import React from 'react';
import { CallRiskReport, AppLanguage, RiskLevel } from '../types/scam';
import { translations } from '../translations/i18n';
import { ShieldCheck, AlertCircle, AlertOctagon, Lock } from 'lucide-react';

interface RiskMeterProps {
  report: CallRiskReport;
  language: AppLanguage;
  isLatched: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  report,
  language,
  isLatched,
}) => {
  const t = translations[language];
  const { score, risk_level } = report;

  // Calculate needle angle on a 180-degree semi-circle gauge (-90 deg to +90 deg)
  const angle = Math.min(180, Math.max(0, (score / 100) * 180)) - 90;

  const getTheme = (level: RiskLevel) => {
    switch (level) {
      case 'SCAM':
        return {
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '#ef4444',
          className: 'scam',
          Icon: AlertOctagon,
        };
      case 'SUSPICIOUS':
        return {
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: '#f59e0b',
          className: 'suspicious',
          Icon: AlertCircle,
        };
      case 'SAFE':
      default:
        return {
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '#10b981',
          className: 'safe',
          Icon: ShieldCheck,
        };
    }
  };

  const theme = getTheme(risk_level);
  const StatusIcon = theme.Icon;

  return (
    <div className={`card risk-meter-card ${theme.className}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          {t.riskMeterTitle}
        </h3>
        {isLatched && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: '#dc2626',
              color: '#ffffff',
              padding: '0.2rem 0.55rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            <Lock size={12} /> LATCHED SCAM
          </span>
        )}
      </div>

      {/* Semi-circular Speedometer SVG */}
      <svg className="gauge-svg" viewBox="0 0 240 130">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>

        {/* Outer track */}
        <path
          d="M 25 120 A 95 95 0 0 1 215 120"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Colored arc */}
        <path
          d="M 25 120 A 95 95 0 0 1 215 120"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray="298"
          strokeDashoffset={298 - (298 * score) / 100}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {/* Center pivot */}
        <circle cx="120" cy="120" r="10" fill="#ffffff" />
        <circle cx="120" cy="120" r="6" fill="#0f172a" />

        {/* Animated needle */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: '120px 120px',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <line
            x1="120"
            y1="120"
            x2="120"
            y2="34"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="120" cy="30" r="4" fill={theme.color} />
        </g>
      </svg>

      {/* Numerical score */}
      <div className="score-display" style={{ color: theme.color }}>
        {score}
        <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
      </div>

      {/* Status badge */}
      <div
        className="status-label"
        style={{
          background: theme.bg,
          color: theme.color,
          border: `1.5px solid ${theme.border}`,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusIcon size={20} />
          {t.riskStatus[risk_level]}
        </span>
      </div>

      {/* Elder reason text snippet */}
      <div style={{ marginTop: '0.75rem', fontSize: '0.95rem', color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.4 }}>
        {language === 'gu'
          ? report.reason_gu
          : language === 'hi'
          ? report.reason_hi
          : risk_level === 'SCAM'
          ? 'Scam pattern detected! Hang up immediately.'
          : risk_level === 'SUSPICIOUS'
          ? 'Suspicious activity detected. Exercise caution.'
          : 'Call conversation is normal and safe.'}
      </div>
    </div>
  );
};
