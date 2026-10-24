import React, { useEffect, useRef } from 'react';
import { MessageSquare, Mic } from 'lucide-react';

interface LiveTranscriptProps {
  transcript: string;
  isListening: boolean;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  transcript,
  isListening,
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [transcript]);

  const lines = transcript ? transcript.split('\n').filter(Boolean) : [];

  return (
    <div className="card" style={{ marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={20} color="#60a5fa" />
          Live Call Transcript
        </h3>
        {isListening && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#4ade80', fontWeight: 600 }}>
            <Mic size={14} className="pulse-dot" /> Listening...
          </span>
        )}
      </div>

      <div ref={boxRef} className="transcript-box">
        {lines.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
            Upload and play an audio file to see the real-time transcript here...
          </p>
        ) : (
          lines.map((line, idx) => {
            const isCaller = line.startsWith('Caller:') || line.startsWith('Inspector') || line.startsWith('This is');
            return (
              <div
                key={idx}
                className="transcript-line"
                style={{
                  color: isCaller ? '#f8fafc' : '#93c5fd',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginRight: '0.5rem',
                    color: isCaller ? '#f87171' : '#60a5fa',
                  }}
                >
                  {isCaller ? '🎙️ CALLER:' : '👤 RESPONSE:'}
                </span>
                {line.replace(/^(Caller:|Victim:|Host:|Son:|Mother:)\s*/i, '')}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
