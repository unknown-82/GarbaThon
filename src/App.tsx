import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AppLanguage,
  CallRiskReport,
  DemoCall,
  LiveConnectionStatus,
  RiskLevel,
} from './types/scam';
import { translations } from './translations/i18n';
import { RiskEngine } from './live/riskEngine';
import { AudioStreamer } from './audio/audioStreamer';
import { GeminiLiveClient } from './live/geminiLiveClient';
import { FallbackDetector } from './live/fallbackDetector';

import { Navbar } from './components/Navbar';
import { CallPicker } from './components/CallPicker';
import { AudioVisualizer } from './components/AudioVisualizer';
import { RiskMeter } from './components/RiskMeter';
import { RedFlagChips } from './components/RedFlagChips';
import { LiveTranscript } from './components/LiveTranscript';
import { ScamAlertModal } from './components/ScamAlertModal';
import { ApiKeyModal } from './components/ApiKeyModal';

export const App: React.FC = () => {
  const [language, setLanguage] = useState<AppLanguage>('gu');
  const [elderMode, setElderMode] = useState<boolean>(true);
  const [demoCalls, setDemoCalls] = useState<DemoCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<DemoCall | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  const [transcript, setTranscript] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showScamModal, setShowScamModal] = useState<boolean>(false);

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
    reason_gu: 'કૉલ શરૂ થવાની રાહ જોવાઈ રહી છે...',
    reason_hi: 'कॉल शुरू होने की प्रतीक्षा की जा रही है...',
    advice_gu: 'કૉલ શરૂ કરો અને તપાસ જુઓ.',
    advice_hi: 'कॉल शुरू करें और जांच देखें।',
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
          if (report.risk_level === 'SCAM') {
            setShowScamModal(true);
          }
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
          if (report.risk_level === 'SCAM') {
            setShowScamModal(true);
          }
        },
        onError: (err) => console.warn('Live API client error:', err),
      }),
    [riskEngine]
  );

  // Synchronize Elder Mode body class
  useEffect(() => {
    if (elderMode) {
      document.body.classList.add('elder-mode');
    } else {
      document.body.classList.remove('elder-mode');
    }
  }, [elderMode]);

  // Fetch backend config and demo calls on mount
  const checkConfigAndDemos = async () => {
    try {
      const [configResp, demosResp] = await Promise.all([
        fetch('/api/config').catch(() => null),
        fetch('/api/demo-calls').catch(() => null),
      ]);

      if (configResp && configResp.ok) {
        const configData = await configResp.json();
        setHasApiKey(configData.hasApiKey);
      }

      if (demosResp && demosResp.ok) {
        const demosData = await demosResp.json();
        setDemoCalls(demosData);
        if (demosData.length > 0 && !selectedCall) {
          setSelectedCall(demosData[0]);
          fallbackDetector.setDemoCall(demosData[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load initial server config:', err);
    }
  };

  useEffect(() => {
    checkConfigAndDemos();
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
      onChunkStart: (chunkIndex) => {
        if (liveClient.getIsConnected()) {
          liveClient.sendActivityStart();
        }
      },
      onChunkEnd: (chunkIndex, cumulativeDuration) => {
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
        // If in simulation mode, check cue triggers
        fallbackDetector.checkSimulationCues(curTime);
      },
      onPlaybackEnded: () => {
        setIsPlaying(false);
      },
    });
  }, [audioStreamer, liveClient, fallbackDetector, hasApiKey, transcript]);

  // Select a phone call
  const handleSelectCall = async (call: DemoCall) => {
    audioStreamer.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    setSelectedCall(call);
    fallbackDetector.setDemoCall(call);
    resetAnalysis();

    try {
      const dur = await audioStreamer.loadAudio(call.audioFile);
      setTotalDuration(dur);
    } catch (err) {
      console.error('Failed to preload audio:', err);
    }
  };

  // Upload custom audio file
  const handleCustomAudioUpload = async (file: File) => {
    audioStreamer.stop();
    setIsPlaying(false);
    setCurrentTime(0);

    const arrayBuffer = await file.arrayBuffer();
    const customCall: DemoCall = {
      id: `custom_${Date.now()}`,
      title: `Custom: ${file.name}`,
      language: 'Unknown',
      type: 'SCAM',
      duration: 'Custom',
      audioFile: '',
      description: 'User uploaded audio file for real-time scam detection.',
      expectedRedFlags: [],
    };

    setSelectedCall(customCall);
    fallbackDetector.setDemoCall(customCall);
    resetAnalysis();

    try {
      const dur = await audioStreamer.loadAudio(arrayBuffer);
      setTotalDuration(dur);
    } catch (err) {
      alert(`Could not decode audio: ${err}`);
    }
  };

  const resetAnalysis = () => {
    riskEngine.reset();
    fallbackDetector.reset();
    setShowScamModal(false);
    setTranscript('');
    setRiskReport({
      risk_level: 'SAFE',
      score: 0,
      red_flags: [],
      reason_gu: 'કૉલ શરૂ થવાની રાહ જોવાઈ રહી છે...',
      reason_hi: 'कॉल शुरू होने की प्रतीक्षा की जा रही है...',
      advice_gu: 'કૉલ શરૂ કરો અને તપાસ જુઓ.',
      advice_hi: 'कॉल शुरू करें और जांच देखें।',
    });
  };

  // Play handler
  const handlePlay = async () => {
    if (!selectedCall) return;

    // Connect Live API if key is present and not connected yet
    if (hasApiKey && !liveClient.getIsConnected()) {
      await liveClient.connect();
    }

    // Ensure audio buffer is loaded
    if (totalDuration === 0 && selectedCall.audioFile) {
      try {
        const dur = await audioStreamer.loadAudio(selectedCall.audioFile);
        setTotalDuration(dur);
      } catch (err) {
        console.error('Error loading audio:', err);
      }
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

  // Hang-up handler (Stops audio immediately & closes modal)
  const handleHangUp = () => {
    audioStreamer.stop();
    setIsPlaying(false);
    setShowScamModal(false);
  };

  return (
    <div className="app-container">
      {/* Navbar with Elder Mode and Language Toggle */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        elderMode={elderMode}
        onToggleElderMode={() => setElderMode(!elderMode)}
        status={connectionStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Call Picker */}
      <CallPicker
        demoCalls={demoCalls}
        selectedCall={selectedCall}
        onSelectCall={handleSelectCall}
        language={language}
        disabled={isPlaying}
        onCustomAudioUpload={handleCustomAudioUpload}
      />

      {/* Main Analysis Dashboard */}
      <div className="dashboard-grid">
        {/* Left Column: Player & Live Transcript */}
        <div>
          <AudioVisualizer
            streamer={audioStreamer}
            isPlaying={isPlaying}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onHangUp={handleHangUp}
            language={language}
            disabled={!selectedCall}
          />

          <LiveTranscript
            transcript={transcript}
            language={language}
            isListening={isPlaying}
          />
        </div>

        {/* Right Column: Risk Meter & Red Flags */}
        <div>
          <RiskMeter
            report={riskReport}
            language={language}
            isLatched={riskEngine.isScamLatched()}
          />

          <RedFlagChips
            redFlags={riskReport.red_flags}
            language={language}
          />
        </div>
      </div>

      {/* Full-Screen Scam Alert Modal */}
      <ScamAlertModal
        report={riskReport}
        isOpen={showScamModal}
        onHangUp={handleHangUp}
        onDismiss={() => setShowScamModal(false)}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* API Key & Cloud Settings Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        hasApiKey={hasApiKey}
        onKeyUpdated={() => {
          checkConfigAndDemos();
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
};
