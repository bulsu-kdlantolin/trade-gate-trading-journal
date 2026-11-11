import React, { useEffect, useState } from 'react';
import { TradeGateLogo } from './TradeGateLogo';
import { ShieldCheck } from 'lucide-react';
import { playMicroTick } from '../../utils/audioTelemetry';

interface LoadingScreenProps {
  /** If provided, overrides default terminal initialization message */
  customMessage?: string;
  /** Controls when the loading screen initiates its smooth fade-out sequence */
  isReady?: boolean;
  /** Callback fired once the fade-out exit animation finishes */
  onFinished?: () => void;
  /** Optional minimum display duration in ms (defaults to 600ms for visual elegance) */
  minDurationMs?: number;
}

const BOOT_STEPS = [
  { text: 'Connecting to sovereign vault...', progress: 24 },
  { text: 'Loading playbooks & risk parameters...', progress: 58 },
  { text: 'Calibrating execution gates & audit ledger...', progress: 86 },
  { text: 'Synchronizing live market telemetry...', progress: 98 },
  { text: 'Execution Terminal Armed.', progress: 100 },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  customMessage,
  isReady = true,
  onFinished,
  minDurationMs = 700,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Minimum display timer to avoid jarring single-frame flicker
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDurationMs);
    return () => clearTimeout(timer);
  }, [minDurationMs]);

  // Telemetry boot step progression
  useEffect(() => {
    if (customMessage) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < BOOT_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [customMessage]);

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
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [minTimeElapsed, isReady, isFadingOut, onFinished]);

  const currentStep = BOOT_STEPS[stepIndex] || BOOT_STEPS[BOOT_STEPS.length - 1];
  const displayMessage = customMessage || currentStep.text;
  const displayProgress = customMessage ? 99 : currentStep.progress;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading TradeGate Terminal"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090A0F] text-[#F8FAFC] select-none transition-all duration-500 ease-out ${isFadingOut
          ? 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-100 scale-100 pointer-events-auto'
        }`}
    >
      {/* Ambient Radial Glowing Orbs */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-brand/12 rounded-full blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: '3s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-emerald-500/8 rounded-full blur-2xl pointer-events-none"
      />

      {/* Subtle Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#F59E0B 1px, transparent 1px), linear-gradient(90deg, #F59E0B 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Center Console */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full space-y-6">

        {/* Elevated Glowing Squircle Logo */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-brand/35 to-amber-500/20 rounded-3xl blur-md opacity-80 animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-[#11131A] border border-[#232838] flex items-center justify-center shadow-2xl shadow-black/90">
            <TradeGateLogo size="lg" withBackground={false} />
          </div>
        </div>

        {/* Brand Wordmark & Monospace Terminal Subtext */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
              TradeGate
            </h1>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 tracking-wider">
              CRYPTO
            </span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
            Sovereign Execution Terminal
          </p>
        </div>

        {/* Progress Bar & Telemetry Status Ticker */}
        <div className="w-full max-w-[270px] space-y-2.5">
          {/* Progress Track */}
          <div className="h-1.5 w-full bg-[#161A24] border border-[#232838] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
            {/* Shimmer Light Beam */}
            <div
              className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"
              style={{
                left: `${Math.max(0, displayProgress - 15)}%`,
                transition: 'left 300ms ease-out',
              }}
            />
          </div>

          {/* Telemetry Ticker Text */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5 min-h-[18px]">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">{displayMessage}</span>
            </span>
            <span className="text-slate-300 font-bold tabular-nums shrink-0 ml-2">
              {displayProgress}%
            </span>
          </div>
        </div>

        {/* Institutional Discipline Seal */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500/90 shrink-0" />
          <span>Pre-Trade Discipline Gate • Armed</span>
        </div>

      </div>
    </div>
  );
};