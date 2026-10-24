import React, { useEffect, useState } from 'react';
import { CallRiskReport, AppLanguage } from '../types/scam';
import { translations } from '../translations/i18n';
import { PhoneOff, AlertTriangle, Volume2, VolumeX, ShieldAlert, X } from 'lucide-react';

interface ScamAlertModalProps {
  report: CallRiskReport;
  isOpen: boolean;
  onHangUp: () => void;
  onDismiss: () => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
}

export const ScamAlertModal: React.FC<ScamAlertModalProps> = ({
  report,
  isOpen,
  onHangUp,
  onDismiss,
  language,
  onLanguageChange,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const t = translations[language];

  // Speech synthesis for speaking warning aloud in Gujarati or Hindi
  const speakWarning = () => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    let textToSpeak = '';
    let voiceLang = 'hi-IN';

    if (language === 'gu') {
      textToSpeak = `સાવધાન! આ છેતરપિંડીનો કૉલ છે. ${report.advice_gu || 'તરત જ ફોન કાપી નાખો! કોઈ પૈસા કે ઓટીપી આપશો નહીં.'}`;
      voiceLang = 'gu-IN';
    } else if (language === 'hi') {
      textToSpeak = `सावधान! यह फर्जी कॉल है। ${report.advice_hi || 'तुरंत फोन काट दें! कोई पैसा या ओटीपी न बताएं।'}`;
      voiceLang = 'hi-IN';
    } else {
      textToSpeak = `Warning! Confirmed scam call detected. Hang up immediately!`;
      voiceLang = 'en-US';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voiceLang;
    utterance.rate = 0.95; // Slightly slower for elderly clarity
    utterance.pitch = 1.0;

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

  // Auto-speak once when scam modal triggers
  useEffect(() => {
    if (isOpen) {
      speakWarning();
    } else {
      stopSpeaking();
    }
    return () => {
      stopSpeaking();
    };
  }, [isOpen, language]);

  if (!isOpen) return null;

  const currentReason = language === 'gu' ? report.reason_gu : language === 'hi' ? report.reason_hi : report.reason_hi;
  const currentAdvice = language === 'gu' ? report.advice_gu : language === 'hi' ? report.advice_hi : report.advice_hi;

  return (
    <div className="scam-modal-overlay">
      <div className="scam-modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          {/* Language toggle inside modal */}
          <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.65rem', padding: '0.2rem' }}>
            <button
              className={`toggle-btn ${language === 'gu' ? 'active' : ''}`}
              onClick={() => onLanguageChange('gu')}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.85rem' }}
            >
              ગુજરાતી
            </button>
            <button
              className={`toggle-btn ${language === 'hi' ? 'active' : ''}`}
              onClick={() => onLanguageChange('hi')}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.85rem' }}
            >
              हिंदी
            </button>
            <button
              className={`toggle-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => onLanguageChange('en')}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.85rem' }}
            >
              English
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Audio Speech Toggle */}
            <button
              className="toggle-btn"
              onClick={isSpeaking ? stopSpeaking : speakWarning}
              style={{ color: isSpeaking ? '#4ade80' : 'var(--text-primary)' }}
              title={isSpeaking ? t.stopAudioAlert : t.readAloud}
            >
              {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span>{isSpeaking ? t.stopAudioAlert : t.readAloud}</span>
            </button>

            <button
              className="toggle-btn"
              onClick={onDismiss}
              title="Close modal view"
              style={{ padding: '0.4rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <AlertTriangle className="modal-danger-icon" />

        <h2 className="scam-modal-title">{t.fullScreenAlertHeader}</h2>
        <p style={{ fontSize: '1.15rem', color: '#fca5a5', fontWeight: 600 }}>
          {t.fullScreenAlertSub}
        </p>

        {/* Why this is a scam */}
        <div className="scam-modal-reason">
          <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={18} />
            {t.whyThisIsScam}
          </div>
          <div style={{ color: '#ffffff' }}>{currentReason}</div>
        </div>

        {/* Actionable Advice */}
        <div className="scam-modal-advice">
          <div style={{ fontWeight: 800, color: '#4ade80', marginBottom: '0.35rem' }}>
            {t.whatYouShouldDo}
          </div>
          <div style={{ color: '#ffffff', fontWeight: 600 }}>{currentAdvice}</div>
        </div>

        {/* Large Emergency Hangup Button */}
        <button className="hangup-big-button" onClick={onHangUp}>
          <PhoneOff size={32} />
          <span>{t.hangUpCall}</span>
        </button>
      </div>
    </div>
  );
};
