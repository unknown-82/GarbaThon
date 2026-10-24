import React from 'react';
import { Shield, ShieldAlert, Globe, Type, Settings, Zap } from 'lucide-react';
import { AppLanguage, LiveConnectionStatus } from '../types/scam';
import { translations } from '../translations/i18n';

interface NavbarProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  elderMode: boolean;
  onToggleElderMode: () => void;
  status: LiveConnectionStatus;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  elderMode,
  onToggleElderMode,
  status,
  onOpenSettings,
}) => {
  const t = translations[language];

  const renderStatusBadge = () => {
    if (status.state === 'connected') {
      return (
        <span className="status-pill live" title={`Model: ${status.modelName || 'gemini-3.8-live'}`}>
          <span className="pulse-dot" />
          {t.liveApiMode}
        </span>
      );
    }
    if (status.mode === 'fallback_flash') {
      return (
        <span className="status-pill connecting" title="Gemini 3.8 Flash Rolling Chunks">
          <Zap size={14} />
          {t.fallbackFlashMode}
        </span>
      );
    }
    return (
      <span className="status-pill offline" title={status.error || 'Safe Demo Simulation'}>
        <span className="pulse-dot" />
        {t.simulatedDemoMode}
      </span>
    );
  };

  return (
    <header className="header-bar">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Shield size={28} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">{t.appTitle}</h1>
          <p className="brand-subtitle">{t.appSubtitle}</p>
        </div>
      </div>

      <div className="header-controls">
        {renderStatusBadge()}

        {/* Elder Mode Toggle */}
        <button
          className={`toggle-btn ${elderMode ? 'active' : ''}`}
          onClick={onToggleElderMode}
          title={t.elderMode}
        >
          <Type size={16} />
          <span>{t.elderMode}</span>
        </button>

        {/* Language Selector */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: '0.65rem', padding: '0.2rem', border: '1px solid var(--border-color)' }}>
          <button
            className={`toggle-btn ${language === 'gu' ? 'active' : ''}`}
            onClick={() => onLanguageChange('gu')}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
          >
            ગુજરાતી
          </button>
          <button
            className={`toggle-btn ${language === 'hi' ? 'active' : ''}`}
            onClick={() => onLanguageChange('hi')}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
          >
            हिंदी
          </button>
          <button
            className={`toggle-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => onLanguageChange('en')}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
          >
            English
          </button>
        </div>

        {/* Settings button */}
        <button
          className="toggle-btn"
          onClick={onOpenSettings}
          title={t.apiSettings}
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};
