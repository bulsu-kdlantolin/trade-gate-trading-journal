import React, { useEffect, useState } from 'react';
import { TradeGateLogo } from './TradeGateLogo';
import { playMicroTick } from '../../utils/audioTelemetry';

interface LoadingScreenProps {
  /** If provided, overrides default initialization message */
  customMessage?: string;
  /** Controls when the loading screen initiates its smooth fade-out sequence */
  isReady?: boolean;
  /** Callback fired once the fade-out exit animation finishes */
  onFinished?: () => void;
  /** Optional minimum display duration in ms (defaults to 450ms for snappy institutional boot) */
  minDurationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  customMessage,
  isReady = true,
  onFinished,
  minDurationMs = 450,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [progress, setProgress] = useState(20);

  // Smooth realistic boot progress sequence
  useEffect(() => {
    const p1 = setTimeout(() => setProgress(55), 100);
    const p2 = setTimeout(() => setProgress(85), 250);
    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
    };
  }, []);

  // Set 100% when ready
  useEffect(() => {
    if (isReady) {
      setProgress(100);
    }
  }, [isReady]);

  // Minimum display timer to avoid single-frame flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDurationMs);
    return () => clearTimeout(timer);
  }, [minDurationMs]);

  // Initiate exit animation when both min-time and ready condition are satisfied
  useEffect(() => {
    if (minTimeElapsed && isReady && !isFadingOut) {
      setIsFadingOut(true);
      try {
        playMicroTick();
      } catch {
        // Audio telemetry is optional
      }
      const timer = setTimeout(() => {
        if (onFinished) onFinished();
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [minTimeElapsed, isReady, isFadingOut, onFinished]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading TradeGate Crypto"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-canvas text-text-primary select-none transition-opacity duration-300 ease-out ${isFadingOut
        ? 'opacity-0 pointer-events-none'
        : 'opacity-100 pointer-events-auto'
        }`}
    >
      {/* Subtle ambient brand yellow aura */}
      <div className="absolute w-56 h-56 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

      {/* Modern Center Brand & Loader */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Integrated Brand Lockup */}
        <div className="flex items-center justify-center">
          <TradeGateLogo size="lg" variant="full" badgeText="CRYPTO" />
        </div>

          {/* Precision Hairline Progress */}
          <div className="w-48 space-y-2 pt-1">
            <div className="h-1.5 w-full bg-card border border-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-text-muted px-0.5">
              <span>{customMessage || (isReady ? 'Ready' : 'Loading journal...')}</span>
              <span className="tabular-nums font-semibold text-text-primary">{progress}%</span>
            </div>
          </div>
        </div>
      </div>
      );
};
