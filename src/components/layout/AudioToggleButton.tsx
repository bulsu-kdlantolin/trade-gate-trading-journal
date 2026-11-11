import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isAudioEnabled, toggleAudioEnabled } from '../../utils/audioTelemetry';

export const AudioToggleButton: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(() => isAudioEnabled());

  useEffect(() => {
    const handleAudioChange = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail) {
        setEnabled(custom.detail.enabled);
      } else {
        setEnabled(isAudioEnabled());
      }
    };
    window.addEventListener('tradegate_audio_changed', handleAudioChange);
    return () => {
      window.removeEventListener('tradegate_audio_changed', handleAudioChange);
    };
  }, []);

  const handleToggle = () => {
    const next = toggleAudioEnabled();
    setEnabled(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={enabled ? 'Audio Telemetry: Enabled (Click to Mute)' : 'Audio Telemetry: Muted (Click to Enable)'}
      aria-label={enabled ? 'Mute audio telemetry' : 'Enable audio telemetry'}
      className={`relative p-1.5 rounded-xl transition-all cursor-pointer shrink-0 focus-visible:outline-brand select-none flex items-center justify-center ${
        enabled
          ? 'text-brand hover:text-brand-hover hover:bg-brand/10'
          : 'text-text-muted hover:text-text-primary hover:bg-card-hover'
      }`}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4 filter drop-shadow-[0_0_6px_rgba(234,179,8,0.35)]" />
      ) : (
        <VolumeX className="w-4 h-4 opacity-60" />
      )}
    </button>
  );
};

