import { GoogleGenAI, Modality } from '@google/genai';
import { CallRiskReport, LiveConnectionStatus } from '../types/scam';
import { RiskEngine } from './riskEngine';

export interface LiveClientCallbacks {
  onStatusChange: (status: LiveConnectionStatus) => void;
  onTranscriptReceived: (text: string, isFinal?: boolean) => void;
  onRiskEvaluated: (report: CallRiskReport) => void;
  onError: (errorMsg: string) => void;
}

export class GeminiLiveClient {
  private session: any = null;
  private riskEngine: RiskEngine;
  private callbacks: LiveClientCallbacks;
  private currentStatus: LiveConnectionStatus = {
    state: 'idle',
    mode: 'live_api',
  };
  private isConnected: boolean = false;
  private hasApiKey: boolean = false;
  private modelName: string = 'gemini-3.8-live';

  constructor(riskEngine: RiskEngine, callbacks: LiveClientCallbacks) {
    this.riskEngine = riskEngine;
    this.callbacks = callbacks;
  }

  public updateStatus(partial: Partial<LiveConnectionStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...partial };
    this.callbacks.onStatusChange(this.currentStatus);
  }

  public getStatus(): LiveConnectionStatus {
    return this.currentStatus;
  }

  /**
   * Initializes Live API session by fetching ephemeral token from GET /api/token
   * and connecting over WebSocket.
   */
  public async connect(): Promise<boolean> {
    try {
      this.updateStatus({ state: 'connecting', mode: 'live_api', error: undefined });

      // Step 1: Request short-lived ephemeral token from backend
      const tokenResp = await fetch('/api/token');
      if (!tokenResp.ok) {
        const errJson = await tokenResp.json().catch(() => ({}));
        if (errJson.error === 'MISSING_API_KEY') {
          this.hasApiKey = false;
          this.updateStatus({
            state: 'idle',
            mode: 'simulation',
            error: 'No GEMINI_API_KEY configured. Running in Safe Demo Simulation Mode.',
          });
          return false;
        }
        throw new Error(errJson.message || `Token endpoint failed with status ${tokenResp.status}`);
      }

      const { token, model, tool, systemInstruction } = await tokenResp.json();
      if (!token) {
        throw new Error('Server returned empty token.');
      }

      this.hasApiKey = true;
      this.modelName = model || 'gemini-3.8-live';

      // Step 2: Connect directly to Gemini Live API using ephemeral token
      const ai = new GoogleGenAI({ apiKey: token });

      this.session = await ai.live.connect({
        model: this.modelName,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          tools: [
            {
              functionDeclarations: [tool],
            },
          ],
          inputAudioTranscription: {},
          realtimeInputConfig: {
            automaticActivityDetection: { disabled: true },
          },
        },
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.updateStatus({
              state: 'connected',
              mode: 'live_api',
              modelName: this.modelName,
            });
          },
          onmessage: (msg: any) => {
            this.handleIncomingServerMessage(msg);
          },
          onerror: (err: any) => {
            console.error('Gemini Live WebSocket error:', err);
            this.callbacks.onError(err?.message || 'Gemini Live WebSocket error occurred');
          },
          onclose: (e: any) => {
            this.isConnected = false;
            this.updateStatus({
              state: 'disconnected',
              error: e?.reason || 'Live connection closed',
            });
          },
        },
      });

      return true;
    } catch (err: any) {
      console.warn('Live API connection failed; will fall back if needed:', err);
      this.updateStatus({
        state: 'error',
        error: err?.message || 'Could not connect to Gemini Live API',
      });
      return false;
    }
  }

  /**
   * Sends explicit activityStart signal at the start of each ~5s chunk
   */
  public sendActivityStart(): void {
    if (this.session && this.isConnected) {
      try {
        this.session.sendRealtimeInput({ activityStart: {} });
      } catch (err) {
        console.warn('Error sending activityStart:', err);
      }
    }
  }

  /**
   * Streams a ~100 ms linear PCM audio frame (16kHz 16-bit mono base64)
   */
  public sendAudioFrame(base64Frame: string): void {
    if (this.session && this.isConnected) {
      try {
        this.session.sendRealtimeInput({
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Frame,
          },
        });
      } catch (err) {
        console.warn('Error sending audio frame:', err);
      }
    }
  }

  /**
   * Sends explicit activityEnd signal at the end of each ~5s chunk
   * Prompting Gemini to evaluate and call report_call_risk
   */
  public sendActivityEnd(): void {
    if (this.session && this.isConnected) {
      try {
        this.session.sendRealtimeInput({ activityEnd: {} });
      } catch (err) {
        console.warn('Error sending activityEnd:', err);
      }
    }
  }

  /**
   * Parses messages received from Gemini Live API server
   */
  private handleIncomingServerMessage(msg: any): void {
    if (!msg) return;

    // 1. Process server transcripts from inputAudioTranscription
    if (msg.serverContent) {
      const modelTurn = msg.serverContent.modelTurn;
      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          if (part.text) {
            this.callbacks.onTranscriptReceived(part.text, false);
          }
        }
      }
      if (msg.serverContent.turnComplete) {
        // Turn completed
      }
    }

    // 2. Process tool calls (e.g. report_call_risk)
    const toolCall = msg.toolCall;
    if (toolCall?.functionCalls && Array.isArray(toolCall.functionCalls)) {
      for (const call of toolCall.functionCalls) {
        if (call.name === 'report_call_risk' && call.args) {
          const report = this.riskEngine.evaluate(call.args);
          this.callbacks.onRiskEvaluated(report);

          // Reply to server tool call
          if (this.session && call.id) {
            try {
              this.session.sendToolResponse({
                functionResponses: [
                  {
                    id: call.id,
                    name: call.name,
                    response: { output: { acknowledged: true, latched: report.risk_level } },
                  },
                ],
              });
            } catch (err) {
              console.warn('Error sending tool response:', err);
            }
          }
        }
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.session) {
      try {
        await this.session.close();
      } catch {
        // Ignore
      }
      this.session = null;
    }
    this.isConnected = false;
    this.updateStatus({ state: 'idle' });
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}
