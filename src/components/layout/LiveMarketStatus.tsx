import React, { useState, useEffect } from 'react';
import { useLivePrices } from '../../hooks/useLivePrices';
import { RotateCcw, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { playMicroTick, playSuccessChime } from '../../utils/audioTelemetry';

export const LiveMarketStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { metadata, isRefreshing, refreshNow } = useLivePrices();
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const updateAge = () => {
      if (metadata.lastUpdated > 0) {
        const diffSec = Math.max(0, Math.floor((Date.now() - metadata.lastUpdated) / 1000));
        setSecondsAgo(diffSec);
      }
    };
    updateAge();
    const timer = setInterval(updateAge, 1000);
    return () => clearInterval(timer);
  }, [metadata.lastUpdated]);

  const handleManualRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playMicroTick();
    await refreshNow();
    playSuccessChime();
  };

  const isStale = secondsAgo > 60;
  const isError = metadata.status === 'error';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card/60 border border-border text-[11px] font-mono select-none transition-colors ${className}`}
      title={`Live Market Feed: ${
        isError
          ? 'Offline / Cached Fallback'
          : `Connected via ${metadata.source} (Synced ${secondsAgo}s ago)`
      }`}
    >
      {/* Pulse Dot Indicator */}
      <span className="relative flex h-2 w-2 shrink-0">
        {!isError && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isRefreshing
                ? 'bg-amber-400'
                : isStale
                ? 'bg-amber-500'
                : 'bg-emerald-400'
            }`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isError
              ? 'bg-rose-500'
              : isRefreshing
              ? 'bg-amber-400'
              : isStale
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
        />
      </span>

      {/* Status Label */}
      <span className="hidden xl:inline text-text-muted font-sans font-medium text-[10.5px]">
        {isRefreshing ? 'Syncing...' : isError ? 'Cached' : 'Live'}
      </span>

      {/* Sync age (mobile hidden) */}
      <span className="hidden md:inline text-text-secondary text-[10px] tabular-nums font-bold">
        {metadata.lastUpdated > 0 ? (secondsAgo < 5 ? 'Just now' : `${secondsAgo}s ago`) : 'Connecting'}
      </span>

      {/* Manual Refresh Trigger */}
      <button
        type="button"
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        title="Refresh live prices & exchange rates now"
        aria-label="Refresh live prices"
        className="p-0.5 rounded text-text-muted hover:text-brand hover:bg-card transition-colors disabled:opacity-50"
      >
        <RotateCcw
          className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-brand' : ''}`}
        />
      </button>
    </div>
  );
};

