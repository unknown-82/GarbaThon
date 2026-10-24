import React from 'react';
import { RedFlag, RedFlagType, AppLanguage } from '../types/scam';
import { translations } from '../translations/i18n';
import {
  ShieldAlert,
  Flame,
  Clock,
  KeyRound,
  DollarSign,
  EyeOff,
  Smartphone,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface RedFlagChipsProps {
  redFlags: RedFlag[];
  language: AppLanguage;
}

export const RedFlagChips: React.FC<RedFlagChipsProps> = ({
  redFlags,
  language,
}) => {
  const t = translations[language];

  const getFlagIcon = (type: RedFlagType) => {
    switch (type) {
      case 'AUTHORITY_IMPERSONATION':
        return <ShieldAlert size={18} color="#f87171" />;
      case 'THREAT_ARREST':
        return <Flame size={18} color="#ef4444" />;
      case 'URGENCY':
        return <Clock size={18} color="#f59e0b" />;
      case 'OTP_REQUEST':
        return <KeyRound size={18} color="#ef4444" />;
      case 'MONEY_TRANSFER':
        return <DollarSign size={18} color="#f87171" />;
      case 'SECRECY_ISOLATION':
        return <EyeOff size={18} color="#a855f7" />;
      case 'REMOTE_APP':
        return <Smartphone size={18} color="#ec4899" />;
      case 'PERSONAL_DATA':
        return <FileText size={18} color="#fb923c" />;
      default:
        return <ShieldAlert size={18} color="#f87171" />;
    }
  };

  return (
    <div className="card" style={{ marginTop: '1.25rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldAlert size={20} color="#ef4444" />
        {t.redFlagsTitle} ({redFlags.length})
      </h3>

      {redFlags.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem', color: '#34d399', fontSize: '0.95rem' }}>
          <CheckCircle2 size={20} />
          <span>{t.noRedFlagsYet}</span>
        </div>
      ) : (
        <div className="chips-container">
          {redFlags.map((flag, idx) => {
            const flagTitle = t.redFlagNames[flag.type] || flag.type;
            const flagDesc = t.redFlagDescriptions[flag.type] || '';

            return (
              <div key={`${flag.type}-${idx}`} className="flag-chip">
                <div className="flag-header">
                  {getFlagIcon(flag.type)}
                  <span>{flagTitle}</span>
                </div>

                {flagDesc && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {flagDesc}
                  </div>
                )}

                {flag.evidence && (
                  <div className="flag-quote">
                    "{flag.evidence}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
