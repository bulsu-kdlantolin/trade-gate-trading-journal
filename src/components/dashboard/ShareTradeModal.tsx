import React, { useRef, useState } from 'react';
import { TradeRecord, isFuturesTrade, isSpotTrade } from '../../types/trade';
import { CryptoIcon } from '../common/CryptoIcon';
import { TradeGateLogo } from '../common/TradeGateLogo';
import { getGradeStyle } from '../../utils/gradeStyles';
import { getSessionStyle } from '../../utils/badgeStyles';
import { useToast } from '../../context/ToastContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import { getErrorMessage } from '../../utils/errors';
import { playSuccessChime, playModalClose } from '../../utils/audioTelemetry';
import { Download, Copy, X, Check, ShieldCheck, TrendingUp, TrendingDown, Image as ImageIcon } from 'lucide-react';

interface ShareTradeModalProps {
  trade: TradeRecord | null;
  onClose: () => void;
}

export const ShareTradeModal: React.FC<ShareTradeModalProps> = ({ trade, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const toast = useToast();
  const modalRef = useModalA11y(!!trade, onClose);

  if (!trade) return null;

  const isFut = isFuturesTrade(trade);
  const isSp = isSpotTrade(trade);
  const isWin = trade.tradeResult === 'Win' || (trade.pnlDollar && trade.pnlDollar > 0);
  const isLoss = trade.tradeResult === 'Loss' || (trade.pnlDollar && trade.pnlDollar < 0);

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsCopying(true);
    try {
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(cardRef.current, { quality: 0.95 });
      if (!blob) throw new Error('Could not generate image blob');

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      playSuccessChime();
      toast.success('Image Copied!', 'Trade card copied to clipboard as PNG.');
    } catch (err: unknown) {
      toast.error('Copy Failed', getErrorMessage(err));
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { quality: 0.95 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `TradeGate_${trade.symbol}_${trade.setupGrade}_${Date.now()}.png`;
      a.click();
      playSuccessChime();
      toast.success('Downloaded!', 'Trade card PNG saved to downloads.');
    } catch (err: unknown) {
      toast.error('Download Failed', getErrorMessage(err));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    playModalClose();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-modal-backdrop"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-trade-modal-title"
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 relative animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close share trade modal"
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-card-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="share-trade-modal-title" className="text-base font-bold text-text-primary mb-1">Share Verified Trade</h3>
        <p className="text-xs text-text-secondary mb-5">Institutional Trade Proof Card</p>

        {/* The Exportable Trade Card Element */}
        <div
          ref={cardRef}
          className="bg-[#090A0F] border border-[#1F2430] rounded-2xl p-6 text-white shadow-2xl space-y-5"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Card Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1F2430]">
            <div className="flex items-center gap-2.5">
              <TradeGateLogo size="sm" variant="mark-only" />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-wider text-white">TRADEGATE</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">CRYPTO</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#11131A] text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>DISCIPLINE GATE VERIFIED</span>
            </div>
          </div>

          {/* Trade Main Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CryptoIcon symbol={trade.symbol} size="xl" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-extrabold text-white">{trade.symbol}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isFut ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                  >
                    {isFut ? `PERP ${trade.leverage}x` : 'SPOT'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{trade.strategyName}</p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg ${getGradeStyle(trade.setupGrade).badge}`}
              >
                Grade {trade.setupGrade} Setup
              </span>
              <div className="flex items-center justify-end gap-1 font-mono text-[10px] mt-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${getSessionStyle(trade.session).dot
                    }`}
                />
                <span className="text-slate-400">{trade.session} Session</span>
              </div>
            </div>
          </div>

          {/* Huge P&L Banner */}
          <div className="bg-[#11131A] border border-[#1F2430] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Net Realized Return
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={`text-2xl font-black font-mono tabular-nums tracking-tight ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-white'
                    }`}
                >
                  {trade.pnlDollar !== undefined
                    ? `${trade.pnlDollar >= 0 ? '+' : ''}$${trade.pnlDollar.toLocaleString()}`
                    : trade.status}
                </span>
                {trade.pnlR !== undefined && (
                  <span
                    className={`text-sm font-bold font-mono tabular-nums ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                      }`}
                  >
                    ({trade.pnlR >= 0 ? '+' : ''}{trade.pnlR}R)
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Risk : Reward
              </span>
              <p className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                {isFut ? `1 : ${trade.riskRewardRatio}R` : isSp ? `${trade.targetMultiple}x` : '-'}
              </p>
            </div>
          </div>

          {/* Key Execution Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-[#11131A] border border-[#1F2430] p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Entry Price</span>
              <span className="font-mono font-bold tabular-nums text-white mt-0.5 block">${trade.entryPrice}</span>
            </div>
            <div className="bg-[#11131A] border border-[#1F2430] p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Exit / TP</span>
              <span className="font-mono font-bold tabular-nums text-emerald-400 mt-0.5 block">
                ${trade.exitPrice ?? (isFut ? trade.takeProfitPrice : isSp ? trade.targetSellPrice : '-')}
              </span>
            </div>
            <div className="bg-[#11131A] border border-[#1F2430] p-2.5 rounded-lg">
              <span className="text-[10px] text-slate-400 block">
                {isFut ? 'Stop Loss' : 'Custody'}
              </span>
              <span className="font-mono font-bold tabular-nums text-rose-400 mt-0.5 block">
                {isFut ? `$${trade.stopLossPrice}` : isSp ? trade.venueTag : '-'}
              </span>
            </div>
          </div>

          {/* Optional Embedded Chart Screenshot */}
          {trade.screenshotUrl && (
            <div className="rounded-xl overflow-hidden border border-[#1F2430] max-h-48 bg-black">
              <img
                src={trade.screenshotUrl}
                alt="Trade Execution Chart"
                className="w-full h-auto object-contain"
              />
            </div>
          )}

          {/* Footer Timestamp */}
          <div className="pt-2 border-t border-[#1F2430] flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>{new Date(trade.timestamp).toUTCString()}</span>
            <span>app.tradegate.crypto</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={handleCopyImage}
            disabled={isCopying}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-card-hover border border-border text-text-primary hover:bg-card-hover/80 flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            {isCopying ? 'Copying...' : 'Copy Image'}
          </button>
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-brand text-black hover:bg-brand-hover flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloading ? 'Saving...' : 'Download PNG'}
          </button>
        </div>
      </div>
    </div>
  );
};

