import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Radio } from 'lucide-react';
import { AudioStreamer } from '../audio/audioStreamer';

interface AudioVisualizerProps {
  streamer: AudioStreamer;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  streamer,
  isPlaying,
  currentTime,
  totalDuration,
  onPlay,
  onPause,
  onReset,
  disabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      streamer.getVisualizerData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = isPlaying ? (dataArray[i] / 255) * height * 0.85 + 4 : 4;

        // Gradient for audio bars
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, '#1d4ed8');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [streamer, isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="player-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Radio size={18} color={isPlaying ? '#34d399' : '#94a3b8'} className={isPlaying ? 'pulse-dot' : ''} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isPlaying ? '#34d399' : 'var(--text-secondary)' }}>
            {isPlaying ? 'Analyzing Audio Stream in Real Time...' : 'Audio Ready'}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
      </div>

      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        width={600}
        height={64}
      />

      {/* Progress Bar */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Playback Controls */}
      <div className="player-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isPlaying ? (
            <button
              className="btn-primary"
              onClick={onPlay}
              disabled={disabled}
              style={{ opacity: disabled ? 0.6 : 1 }}
            >
              <Play size={20} fill="currentColor" />
              <span>Play Audio</span>
            </button>
          ) : (
            <button className="btn-primary" onClick={onPause} style={{ background: '#f59e0b' }}>
              <Pause size={20} fill="currentColor" />
              <span>Pause Audio</span>
            </button>
          )}

          <button
            className="toggle-btn"
            onClick={onReset}
            title="Restart playback"
            disabled={disabled}
          >
            <RotateCcw size={16} />
            <span>Restart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
