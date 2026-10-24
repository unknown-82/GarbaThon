import React from 'react';
import { Phone, ShieldAlert, ExternalLink, X, Clock, AlertCircle } from 'lucide-react';

interface CyberCrimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CyberCrimeModal: React.FC<CyberCrimeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="scam-modal-overlay">
      <div
        className="scam-modal-content"
        style={{
          background: '#0f172a',
          borderColor: '#ef4444',
          maxWidth: '560px',
          textAlign: 'left',
          animation: 'none',
          boxShadow: '0 0 50px rgba(239, 68, 68, 0.35)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <Phone size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                National Cyber Crime Helpline
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Ministry of Home Affairs, Government of India
              </span>
            </div>
          </div>

          <button className="toggle-btn" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Primary Call Action */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.25) 100%)',
            border: '2px solid #ef4444',
            borderRadius: '1rem',
            padding: '1.5rem',
            textAlign: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#fca5a5', fontWeight: 600, marginBottom: '0.4rem' }}>
            Emergency Toll-Free Helpline Number
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.1em', lineHeight: 1 }}>
            1930
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
            24x7 Citizen Financial Cyber Fraud Reporting System
          </div>

          <a
            href="tel:1930"
            className="btn-danger"
            style={{
              marginTop: '1rem',
              display: 'inline-flex',
              width: '100%',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '1.15rem',
              padding: '0.85rem',
            }}
          >
            <Phone size={20} />
            Dial 1930 Now
          </a>
        </div>

        {/* Golden Hour Warning */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '0.75rem',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <Clock size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#fbbf24', fontSize: '0.875rem' }}>The "Golden Hour" Rule:</strong>
            <p style={{ fontSize: '0.825rem', color: '#e2e8f0', marginTop: '0.2rem', lineHeight: 1.4 }}>
              Reporting financial fraud within <strong>2 to 3 hours</strong> allows nodal police and banks to immediately freeze the fraudster's beneficiary account and reverse lost money.
            </p>
          </div>
        </div>

        {/* Web Portal Link */}
        <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Official Cyber Crime Portal</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>File written complaints, upload audio evidence, and track FIRs</div>
            </div>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="toggle-btn"
              style={{ textDecoration: 'none', color: '#60a5fa', borderColor: '#3b82f6' }}
            >
              <span>Visit Portal</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <button className="toggle-btn" onClick={onClose} style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}>
          Close
        </button>
      </div>
    </div>
  );
};
