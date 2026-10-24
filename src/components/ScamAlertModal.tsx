import React, { useEffect, useState } from 'react';
import { CallRiskReport } from '../types/scam';
import { PhoneOff, AlertTriangle, Volume2, VolumeX, ShieldAlert, X } from 'lucide-react';

interface ScamAlertModalProps {
  report: CallRiskReport;
  isOpen: boolean;
  onHangUp: () => void;
  onDismiss: () => void;
}

export const ScamAlertModal: React.FC<ScamAlertModalProps> = ({
  report,
  isOpen,
  onHangUp,
  onDismiss,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Speech synthesis for speaking warning aloud in English
  const speakWarning = () => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const textToSpeak = `Warning! Scam call detected. ${report.advice_en || 'Hang up the phone immediately! Do not share any OTP or transfer money.'}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      speakWarning();
    } else {
      stopSpeaking();
    }
    return () => {
      stopSpeaking();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="scam-modal-overlay">
      <div className="scam-modal-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
          {/* Audio Speech Toggle */}
          <button
            className="toggle-btn"
            onClick={isSpeaking ? stopSpeaking : speakWarning}
            style={{ color: isSpeaking ? '#4ade80' : 'var(--text-primary)' }}
            title={isSpeaking ? 'Mute Alert' : 'Speak Warning Aloud'}
          >
            {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span>{isSpeaking ? 'Mute Voice' : 'Speak Aloud'}</span>
          </button>

          <button
            className="toggle-btn"
            onClick={onDismiss}
            title="Dismiss view"
            style={{ padding: '0.4rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <AlertTriangle className="modal-danger-icon" />

        <h2 className="scam-modal-title">🚨 SCAM CALL DETECTED!</h2>
        <p style={{ fontSize: '1.15rem', color: '#fca5a5', fontWeight: 600 }}>
          This call has been identified as fraudulent extortion.
        </p>

        {/* Why this is a scam */}
        <div className="scam-modal-reason">
          <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={18} />
            Why is this call dangerous?
          </div>
          <div style={{ color: '#ffffff' }}>
            {report.reason_en || 'The caller is impersonating authority or threatening arrest to demand funds or sensitive data.'}
          </div>
        </div>

        {/* Actionable Advice */}
        <div className="scam-modal-advice">
          <div style={{ fontWeight: 800, color: '#4ade80', marginBottom: '0.35rem' }}>
            What you should do:
          </div>
          <div style={{ color: '#ffffff', fontWeight: 600 }}>
            {report.advice_en || 'Hang up the phone immediately! Do NOT share OTPs, passwords, or send any money.'}
          </div>
        </div>

        {/* Large Emergency Hangup Button */}
        <button className="hangup-big-button" onClick={onHangUp}>
          <PhoneOff size={30} />
          <span>HANG UP CALL NOW</span>
        </button>
      </div>
    </div>
  );
};
