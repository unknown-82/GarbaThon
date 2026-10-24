import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, Check, Music } from 'lucide-react';

interface AudioUploaderProps {
  onFileSelected: (file: File | { name: string; url: string }) => void;
  currentFileName: string | null;
  isPlaying: boolean;
  disabled?: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onFileSelected,
  currentFileName,
  isPlaying,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3')) {
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const sampleCalls = [
    {
      name: 'Gujarati_Bank_KYC_Scam.wav',
      url: '/audio/scam_fake_kyc.wav',
      label: '🚨 Fake Bank KYC (Gujarati)',
      category: 'Banking / OTP Fraud',
      language: 'Gujarati',
    },
    {
      name: 'Hindi_Digital_Arrest_Scam.wav',
      url: '/audio/scam_digital_arrest.wav',
      label: '🚨 Digital Arrest (Hindi)',
      category: 'Police Impersonation',
      language: 'Hindi',
    },
    {
      name: 'English_Customs_Courier_Scam.wav',
      url: '/audio/scam_courier.wav',
      label: '🚨 Customs Courier (English)',
      category: 'Contraband / Parcel FIR',
      language: 'English',
    },
    {
      name: 'Genuine_Family_Call.wav',
      url: '/audio/genuine_call.wav',
      label: '🟢 Genuine Call (Safe)',
      category: 'Normal Conversation',
      language: 'Family',
    },
  ];

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed #3b82f6' : '2px dashed var(--border-color)',
          background: isDragging ? 'rgba(59, 130, 246, 0.08)' : 'rgba(15, 23, 42, 0.4)',
          borderRadius: '0.85rem',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.m4a,.ogg"
          style={{ display: 'none' }}
          disabled={disabled}
          onChange={handleFileChange}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            {currentFileName ? <FileAudio size={28} /> : <UploadCloud size={28} />}
          </div>

          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentFileName ? (
                <span style={{ color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={18} color="#34d399" />
                  Loaded: {currentFileName}
                </span>
              ) : (
                'Upload Phone Call Recording'
              )}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Drag and drop an audio file (.wav, .mp3) here, or click to browse
            </p>
          </div>

          {currentFileName && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.2rem 0.6rem',
                borderRadius: '1rem',
              }}
            >
              Click to replace audio file
            </span>
          )}
        </div>
      </div>

      {/* Quick sample audio selector pills */}
      <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Music size={14} /> Quick test samples:
        </span>
        {sampleCalls.map((sample) => (
          <button
            key={sample.url}
            className="toggle-btn"
            disabled={disabled}
            onClick={() => onFileSelected({ name: sample.name, url: sample.url })}
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.7rem',
              background: currentFileName === sample.name ? 'rgba(59, 130, 246, 0.2)' : undefined,
              borderColor: currentFileName === sample.name ? '#3b82f6' : undefined,
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.1rem',
            }}
          >
            <span style={{ fontWeight: 700 }}>{sample.label}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sample.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
