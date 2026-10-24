import React from 'react';
import { DemoCall, AppLanguage } from '../types/scam';
import { translations } from '../translations/i18n';
import { PhoneCall, ShieldCheck, AlertTriangle, Upload } from 'lucide-react';

interface CallPickerProps {
  demoCalls: DemoCall[];
  selectedCall: DemoCall | null;
  onSelectCall: (call: DemoCall) => void;
  language: AppLanguage;
  disabled?: boolean;
  onCustomAudioUpload?: (file: File) => void;
}

export const CallPicker: React.FC<CallPickerProps> = ({
  demoCalls,
  selectedCall,
  onSelectCall,
  language,
  disabled,
  onCustomAudioUpload,
}) => {
  const t = translations[language];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onCustomAudioUpload) {
      onCustomAudioUpload(e.target.files[0]);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PhoneCall size={20} color="#3b82f6" />
            {t.selectCallPrompt}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t.selectCallDesc}
          </p>
        </div>

        {/* Custom audio file upload */}
        <label
          className="toggle-btn"
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
          title="Upload your own WAV audio"
        >
          <Upload size={16} />
          <span>Custom .wav / .mp3</span>
          <input
            type="file"
            accept="audio/wav,audio/mp3,audio/mpeg"
            style={{ display: 'none' }}
            disabled={disabled}
            onChange={handleFileUpload}
          />
        </label>
      </div>

      <div className="call-picker-grid">
        {demoCalls.map((call) => {
          const isSelected = selectedCall?.id === call.id;
          const isScam = call.type === 'SCAM';

          return (
            <div
              key={call.id}
              className={`call-card ${isSelected ? 'selected' : ''}`}
              onClick={() => !disabled && onSelectCall(call)}
              style={{ opacity: disabled && !isSelected ? 0.6 : 1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className={`call-badge ${isScam ? 'scam' : 'safe'}`}>
                  {isScam ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={12} /> SCAM CALL
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldCheck size={12} /> SAFE CALL
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {call.duration} • {call.language}
                </span>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.4rem 0 0.25rem 0' }}>
                {call.title}
              </h3>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {call.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
