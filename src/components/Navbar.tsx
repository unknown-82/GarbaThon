import React from 'react';
import { Shield, Settings, Zap } from 'lucide-react';
import { LiveConnectionStatus } from '../types/scam';

interface NavbarProps {
  status: LiveConnectionStatus;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ status, onOpenSettings }) => {
  const renderStatusBadge = () => {
    if (status.state === 'connected') {
      return (
        <span className="status-pill live" title={`Model: ${status.modelName || 'gemini-3.8-live'}`}>
          <span className="pulse-dot" />
          Gemini Live API (Active)
        </span>
      );
    }
    if (status.mode === 'fallback_flash') {
      return (
        <span className="status-pill connecting" title="Gemini 3.8 Flash Rolling Chunks">
          <Zap size={14} />
          Gemini Flash Fallback
        </span>
      );
    }
    return (
      <span className="status-pill offline" title={status.error || 'Safe Demo Simulation'}>
        <span className="pulse-dot" />
        Simulation / Standby
      </span>
    );
  };

  return (
    <header className="header-bar">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Shield size={26} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">Scam Call Detector</h1>
          <p className="brand-subtitle">Real-time AI phone fraud detection powered by Google Gemini</p>
        </div>
      </div>

      <div className="header-controls">
        {renderStatusBadge()}

        <button
          className="toggle-btn"
          onClick={onOpenSettings}
          title="API & Model Settings"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};
