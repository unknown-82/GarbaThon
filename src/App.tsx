import React, { useState, useEffect, useMemo } from 'react';
import {
  CallRiskReport,
  LiveConnectionStatus,
} from './types/scam';
import { RiskEngine } from './live/riskEngine';
import { AudioStreamer } from './audio/audioStreamer';
import { GeminiLiveClient } from './live/geminiLiveClient';
import { FallbackDetector } from './live/fallbackDetector';

import { Navbar } from './components/Navbar';
import { AudioUploader } from './components/AudioUploader';
import { AudioVisualizer } from './components/AudioVisualizer';
import { RiskMeter } from './components/RiskMeter';
import { RedFlagChips } from './components/RedFlagChips';
import { LiveTranscript } from './components/LiveTranscript';
import { CyberSafetyTips } from './components/CyberSafetyTips';
import { CyberCrimeModal } from './components/CyberCrimeModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Phone, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  const [transcript, setTranscript] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCyberCrimeModalOpen, setIsCyberCrimeModalOpen] = useState<boolean>(false);

  // Status state
  const [connectionStatus, setConnectionStatus] = useState<LiveConnectionStatus>({
    state: 'idle',
    mode: 'simulation',
  });

  // Current risk report
  const [riskReport, setRiskReport] = useState<CallRiskReport>({
    risk_level: 'SAFE',
    score: 0,
    red_flags: [],
    reason_en: 'Upload a phone call recording to begin scam detection.',
    advice_en: 'Audio will be analyzed in real time as it plays.',
  });

  // Core engines
  const riskEngine = useMemo(() => new RiskEngine(), []);
  const audioStreamer = useMemo(() => new AudioStreamer(), []);

  const fallbackDetector = useMemo(
    () =>
      new FallbackDetector(riskEngine, {
        onTranscriptReceived: (text) => {
          setTranscript(text);
        },
        onRiskEvaluated: (report) => {
          setRiskReport(report);
        },
        onError: (err) => console.warn('Fallback error:', err),
      }),
    [riskEngine]
  );

  const liveClient = useMemo(
    () =>
      new GeminiLiveClient(riskEngine, {
        onStatusChange: (status) => setConnectionStatus(status),
        onTranscriptReceived: (chunk) => {
          setTranscript((prev) => (prev ? `${prev} ${chunk}` : chunk));
        },
        onRiskEvaluated: (report) => {
          setRiskReport(report);
        },
        onError: (err) => console.warn('Live API client error:', err),
      }),
    [riskEngine]
  );

  // Fetch backend config on mount
  const checkConfig = async () => {
    try {
      const configResp = await fetch('/api/config').catch(() => null);
      if (configResp && configResp.ok) {
        const configData = await configResp.json();
        setHasApiKey(configData.hasApiKey);
      }
    } catch (err) {
      console.error('Failed to load server config:', err);
    }
  };

  useEffect(() => {
    checkConfig();
  }, []);

  // Configure AudioStreamer callbacks
  useEffect(() => {
    audioStreamer.setCallbacks({
      onPcmFrame: (base64Pcm) => {
        // Stream frame to Gemini Live API if connected
        if (liveClient.getIsConnected()) {
          liveClient.sendAudioFrame(base64Pcm);
        }
      },
      onChunkStart: () => {
        if (liveClient.getIsConnected()) {
          liveClient.sendActivityStart();
        }
      },
      onChunkEnd: (chunkIndex) => {
        if (liveClient.getIsConnected()) {
          liveClient.sendActivityEnd();
        } else if (hasApiKey) {
          // Fallback rolling chunk evaluation using gemini-3.8-flash
          fallbackDetector.analyzeChunkWithFlash(null, chunkIndex, transcript);
        }
      },
      onPlaybackProgress: (curTime, dur) => {
        setCurrentTime(curTime);
        setTotalDuration(dur);
        // If in simulation mode, check cues
        fallbackDetector.checkSimulationCues(curTime);
      },
      onPlaybackEnded: () => {
        setIsPlaying(false);
      },
    });
  }, [audioStreamer, liveClient, fallbackDetector, hasApiKey, transcript]);

  const resetAnalysis = () => {
    riskEngine.reset();
    fallbackDetector.reset();
    setTranscript('');
    setRiskReport({
      risk_level: 'SAFE',
      score: 0,
      red_flags: [],
      reason_en: 'Audio loaded. Press play to start real-time scam detection.',
      advice_en: 'Listen to the audio as the AI evaluates red flags.',
    });
  };

  // Upload or select audio file
  const handleFileSelected = async (fileOrUrl: File | { name: string; url: string }) => {
    audioStreamer.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    resetAnalysis();

    try {
      let dur = 0;
      if ('url' in fileOrUrl) {
        setCurrentFileName(fileOrUrl.name);

        // Find matching demo if from built-in samples for offline simulation cues
        try {
          const resp = await fetch('/api/demo-calls');
          const demos = await resp.json();
          const matched = demos.find((d: any) => d.audioFile === fileOrUrl.url);
          if (matched) {
            fallbackDetector.setDemoCall(matched);
          } else {
            fallbackDetector.setDemoCall(null);
          }
        } catch {
          fallbackDetector.setDemoCall(null);
        }

        dur = await audioStreamer.loadAudio(fileOrUrl.url);
      } else {
        setCurrentFileName(fileOrUrl.name);
        fallbackDetector.setDemoCall(null);
        const arrayBuffer = await fileOrUrl.arrayBuffer();
        dur = await audioStreamer.loadAudio(arrayBuffer);
      }

      setTotalDuration(dur);

      // Connect to Gemini Live if key is available
      if (hasApiKey && !liveClient.getIsConnected()) {
        await liveClient.connect();
      }

      // Automatically start playback and real-time detection
      audioStreamer.play(0);
      setIsPlaying(true);
    } catch (err: any) {
      alert(`Could not load audio file: ${err?.message || err}`);
    }
  };

  // Manual Play handler
  const handlePlay = async () => {
    if (!currentFileName) return;

    if (hasApiKey && !liveClient.getIsConnected()) {
      await liveClient.connect();
    }

    audioStreamer.play(currentTime);
    setIsPlaying(true);
  };

  // Pause handler
  const handlePause = () => {
    audioStreamer.pause();
    setIsPlaying(false);
  };

  // Reset handler
  const handleReset = () => {
    audioStreamer.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    resetAnalysis();
  };

  const isScam = riskReport.risk_level === 'SCAM';

  return (
    <div className="app-container">
      {/* Clean Navbar */}
      <Navbar
        status={connectionStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Audio Upload Card */}
      <AudioUploader
        onFileSelected={handleFileSelected}
        currentFileName={currentFileName}
        isPlaying={isPlaying}
        disabled={isPlaying}
      />

      {/* Call Cyber Crime Action Bar: ONLY displayed when a SCAM is detected */}
      {currentFileName && isScam && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.3) 100%)',
            border: '2px solid #ef4444',
            borderRadius: '0.85rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fca5a5' }}>
                🚨 Confirmed Scam Call Detected!
              </div>
              <div style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
                Report immediately to the National Cyber Crime Helpline before money is transferred.
              </div>
            </div>
          </div>

          <button
            className="btn-danger"
            onClick={() => setIsCyberCrimeModalOpen(true)}
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.95rem',
              gap: '0.5rem',
            }}
          >
            <Phone size={18} />
            <span>Call Cyber Crime (1930)</span>
          </button>
        </div>
      )}

      {/* Main Analysis Dashboard */}
      {currentFileName && (
        <div className="dashboard-grid">
          {/* Left Column: Player, Live Transcript & Rotating GK Tips */}
          <div>
            <AudioVisualizer
              streamer={audioStreamer}
              isPlaying={isPlaying}
              currentTime={currentTime}
              totalDuration={totalDuration}
              onPlay={handlePlay}
              onPause={handlePause}
              onReset={handleReset}
              disabled={!currentFileName}
            />

            <LiveTranscript
              transcript={transcript}
              isListening={isPlaying}
            />

            {/* Rotating "Did You Know?" Cyber Safety Tips Card */}
            <CyberSafetyTips />
          </div>

          {/* Right Column: Risk Assessment & Red Flags */}
          <div>
            <RiskMeter
              report={riskReport}
              isLatched={riskEngine.isScamLatched()}
            />

            <RedFlagChips
              redFlags={riskReport.red_flags}
            />
          </div>
        </div>
      )}

      {/* Cyber Crime Helpline Details Modal */}
      <CyberCrimeModal
        isOpen={isCyberCrimeModalOpen}
        onClose={() => setIsCyberCrimeModalOpen(false)}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language="en"
        hasApiKey={hasApiKey}
        onKeyUpdated={() => {
          checkConfig();
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
};
