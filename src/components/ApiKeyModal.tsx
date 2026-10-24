import React, { useState } from 'react';
import { X, Key, CheckCircle, AlertTriangle, Cloud, Server } from 'lucide-react';
import { AppLanguage } from '../types/scam';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
  hasApiKey: boolean;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  language,
  hasApiKey,
  onKeyUpdated,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKeyInput.trim()) {
      setMsg({ type: 'error', text: 'Please enter a valid Gemini API key.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const resp = await fetch('/api/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to update API key');
      }
      setMsg({ type: 'success', text: 'GEMINI_API_KEY updated successfully in server!' });
      setApiKeyInput('');
      onKeyUpdated();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error configuring key' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="scam-modal-overlay">
      <div
        className="scam-modal-content"
        style={{
          background: '#0f172a',
          borderColor: '#3b82f6',
          maxWidth: '560px',
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
          textAlign: 'left',
          animation: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Key size={22} color="#60a5fa" />
            Gemini API Configuration
          </h2>
          <button className="toggle-btn" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Current status */}
        <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '0.65rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <Server size={16} color="#94a3b8" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Backend Status:</span>
            {hasApiKey ? (
              <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={14} /> Key Active
              </span>
            ) : (
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={14} /> No Key in .env (Safe Demo Simulation active)
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Active Models: <strong>gemini-3.8-live</strong> (Live API) & <strong>gemini-3.8-flash</strong> (Fallback)
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          To connect directly to Gemini Live API over WebSocket with ephemeral tokens, paste your Google AI Studio API key below:
        </p>

        <input
          type="password"
          placeholder="AIzaSy..."
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.65rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#ffffff',
            fontSize: '0.95rem',
            marginBottom: '0.75rem',
            outline: 'none',
          }}
        />

        {msg && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              marginBottom: '0.75rem',
              background: msg.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: msg.type === 'success' ? '#86efac' : '#fca5a5',
              border: `1px solid ${msg.type === 'success' ? '#22c55e' : '#ef4444'}`,
            }}
          >
            {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="toggle-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.95rem' }}
          >
            {saving ? 'Saving...' : 'Save & Connect'}
          </button>
        </div>

        {/* Cloud Run deployment hint */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            <Cloud size={14} /> <strong>Cloud Run Deployment</strong>
          </div>
          Set environment variable <code>GEMINI_API_KEY</code> in Google Cloud Run service configuration.
        </div>
      </div>
    </div>
  );
};
