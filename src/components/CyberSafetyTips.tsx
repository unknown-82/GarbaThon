import React, { useState, useEffect } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

const SAFETY_TIPS = [
  {
    title: 'No "Digital Arrest" in Indian Law',
    text: 'Police, CBI, ED, and judges NEVER arrest anyone over a video call. There is no legal procedure called "Digital Arrest" under Indian law.',
    tag: 'Digital Arrest Scam',
  },
  {
    title: 'Banks Never Ask for OTPs',
    text: 'Your bank, RBI, or credit card support will NEVER call to ask for your 6-digit SMS OTP, NetBanking password, or ATM PIN.',
    tag: 'Banking Fraud',
  },
  {
    title: 'Couriers Never Ask for UPI Transfers',
    text: 'Customs and courier companies (like FedEx or DHL) never ask you to transfer "clearance penalty fees" or drug inspection charges to UPI IDs.',
    tag: 'Courier Scam',
  },
  {
    title: 'Beware of Remote Access Apps',
    text: 'Never install AnyDesk, TeamViewer, QuickSupport, or RustDesk at the request of an unknown caller. These apps give total control of your phone and bank apps to fraudsters.',
    tag: 'Device Takeover',
  },
  {
    title: 'Artificial Urgency is a Major Trap',
    text: 'Fraudsters create panic with deadlines like "account blocked in 2 hours" to stop you from thinking. Real bank updates allow ample time and official branch visits.',
    tag: 'Urgency Tactic',
  },
  {
    title: 'Secrecy and Isolation is a Scam Sign',
    text: 'If a caller warns you "Keep your door locked and do not tell your family members", it is a guaranteed fraudster trying to isolate you from help.',
    tag: 'Extortion Tactic',
  },
  {
    title: 'National Cyber Crime Helpline: 1930',
    text: 'If you have been scammed or threatened, immediately dial 1930 or visit cybercrime.gov.in to report the incident and freeze fraudulent transactions.',
    tag: 'Emergency Help',
  },
];

export const CyberSafetyTips: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SAFETY_TIPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SAFETY_TIPS.length) % SAFETY_TIPS.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SAFETY_TIPS.length);
  };

  const currentTip = SAFETY_TIPS[currentIndex];

  return (
    <div
      className="card"
      style={{
        marginTop: '1.25rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <Lightbulb size={18} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
            Did You Know? <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>(Cyber Safety Fact)</span>
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#93c5fd',
              background: 'rgba(59, 130, 246, 0.15)',
              padding: '0.15rem 0.5rem',
              borderRadius: '1rem',
              fontWeight: 600,
            }}
          >
            {currentTip.tag}
          </span>
          <button
            onClick={handlePrev}
            className="toggle-btn"
            style={{ padding: '0.25rem 0.4rem', borderRadius: '0.4rem' }}
            title="Previous tip"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="toggle-btn"
            style={{ padding: '0.25rem 0.4rem', borderRadius: '0.4rem' }}
            title="Next tip"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ minHeight: '52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.2rem' }}>
          {currentTip.title}
        </h4>
        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.45 }}>
          {currentTip.text}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.75rem', justifyContent: 'center' }}>
        {SAFETY_TIPS.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: currentIndex === idx ? '16px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: currentIndex === idx ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
};
