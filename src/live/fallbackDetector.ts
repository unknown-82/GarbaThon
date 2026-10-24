import { CallRiskReport, DemoCall } from '../types/scam';
import { RiskEngine } from './riskEngine';

export interface FallbackCallbacks {
  onTranscriptReceived: (text: string, isFinal?: boolean) => void;
  onRiskEvaluated: (report: CallRiskReport) => void;
  onError: (errorMsg: string) => void;
}

export class FallbackDetector {
  private riskEngine: RiskEngine;
  private callbacks: FallbackCallbacks;
  private currentDemo: DemoCall | null = null;
  private triggeredCueIndices: Set<number> = new Set();
  private cumulativeTranscript: string = '';

  constructor(riskEngine: RiskEngine, callbacks: FallbackCallbacks) {
    this.riskEngine = riskEngine;
    this.callbacks = callbacks;
  }

  public setDemoCall(demo: DemoCall | null): void {
    this.currentDemo = demo;
    this.triggeredCueIndices.clear();
    this.cumulativeTranscript = '';
  }

  public reset(): void {
    this.triggeredCueIndices.clear();
    this.cumulativeTranscript = '';
  }

  /**
   * Called on playback progress updates. Checks simulation cues if running in demo simulation mode.
   */
  public checkSimulationCues(currentTimeSeconds: number): void {
    if (!this.currentDemo || !this.currentDemo.simulationCues) return;

    this.currentDemo.simulationCues.forEach((cue, index) => {
      if (currentTimeSeconds >= cue.atSecond && !this.triggeredCueIndices.has(index)) {
        this.triggeredCueIndices.add(index);

        // Update transcript
        this.cumulativeTranscript += (this.cumulativeTranscript ? '\n' : '') + cue.transcript;
        this.callbacks.onTranscriptReceived(this.cumulativeTranscript, true);

        // Evaluate risk through browser-side engine
        const evaluated = this.riskEngine.evaluate(cue.result);
        this.callbacks.onRiskEvaluated(evaluated);
      }
    });
  }

  /**
   * Fallback for real Gemini: sends rolling 5s chunk to backend /api/analyze-chunk
   */
  public async analyzeChunkWithFlash(
    audioData: string | null,
    chunkIndex: number,
    transcriptSoFar: string
  ): Promise<CallRiskReport | null> {
    try {
      const resp = await fetch('/api/analyze-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData,
          mimeType: 'audio/pcm;rate=16000',
          transcriptSoFar,
          chunkIndex,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Analyze chunk failed: ${resp.statusText}`);
      }

      const result = await resp.json();
      const evaluated = this.riskEngine.evaluate(result);
      this.callbacks.onRiskEvaluated(evaluated);
      return evaluated;
    } catch (err: any) {
      console.warn('Fallback chunk analysis error:', err);
      this.callbacks.onError(err?.message || 'Fallback chunk analysis failed');
      return null;
    }
  }
}
