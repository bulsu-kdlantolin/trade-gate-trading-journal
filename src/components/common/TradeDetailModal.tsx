import React, { useState } from 'react';
import { TradeRecord, isFuturesTrade, isSpotTrade } from '../../types/trade';
import { CryptoIcon } from './CryptoIcon';
import { getCurrencySymbol } from '../../utils/currency';
import { getGradeStyle } from '../../utils/gradeStyles';
import { useModalA11y } from '../../hooks/useModalA11y';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Clock, ExternalLink, ZoomIn } from 'lucide-react';

interface TradeDetailModalProps {
  trade: TradeRecord | null;
  onClose: () => void;
  onShare?: (trade: TradeRecord) => void;
  currencySymbol?: string;
}

  export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({ trade, onClose, onShare, currencySymbol = '$' }) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const modalRef = useModalA11y(!!trade, onClose);

    if (!trade) return null;

    const isFut = isFuturesTrade(trade);
    const isSp = isSpotTrade(trade);
    const isWin = trade.tradeResult === 'Win' || (trade.pnlDollar && trade.pnlDollar > 0);
    const isLoss = trade.tradeResult === 'Loss' || (trade.pnlDollar && trade.pnlDollar < 0);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-modal-backdrop"
        onClick={onClose}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="trade-detail-modal-title"
          className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Strip */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-canvas/40">
            <div className="flex items-center gap-3">
              <CryptoIcon symbol={trade.symbol} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span id="trade-detail-modal-title" className="font-bold text-base text-text-primary">{trade.symbol}</span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isFut
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                  >
                    {isFut ? `PERP ${trade.leverage}x` : 'SPOT'}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${getGradeStyle(trade.setupGrade).badge}`}
                  >
                    Grade {trade.setupGrade}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {trade.strategyName} • {new Date(trade.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onShare && (
                <button
                  onClick={() => onShare(trade)}
                  aria-label="Share trade performance card"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-card-hover border border-border text-text-secondary hover:text-text-primary transition-colors"
                >
                  Share Card
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close trade details modal"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Top Outcome Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-canvas border border-border rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-text-muted">Net P&L ({currencySymbol})</span>
                <p
                  className={`text-base font-bold font-mono tabular-nums mt-0.5 ${isWin ? 'text-trade-green' : isLoss ? 'text-trade-red' : 'text-text-primary'
                    }`}
                >
                  {trade.pnlDollar !== undefined
                      ? `${trade.pnlDollar >= 0 ? '+' : ''}${currencySymbol}${Math.abs(trade.pnlDollar).toLocaleString()}`
                      : trade.status}
                </p>
              </div>

              <div className="bg-canvas border border-border rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-text-muted">R-Multiple / ROI</span>
                <p
                  className={`text-base font-bold font-mono tabular-nums mt-0.5 ${isWin ? 'text-trade-green' : isLoss ? 'text-trade-red' : 'text-text-primary'
                    }`}
                >
                  {trade.pnlR !== undefined
                    ? `${trade.pnlR >= 0 ? '+' : ''}${trade.pnlR}R`
                    : trade.pnlPercentage !== undefined
                      ? `${trade.pnlPercentage}%`
                      : '-'}
                </p>
              </div>

              <div className="bg-canvas border border-border rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-text-muted">Direction / Action</span>
                <p className="text-sm font-bold mt-0.5 text-text-primary">
                  {isFut ? `${trade.direction} (${trade.marginType})` : isSp ? trade.spotAction : '-'}
                </p>
              </div>

              <div className="bg-canvas border border-border rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-text-muted">Discipline Gate</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {trade.mandatoryRulesPassed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-trade-green" />
                      <span className="text-xs font-bold text-trade-green">Passed</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-trade-red" />
                      <span className="text-xs font-bold text-trade-red">Violated</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Execution Details Table */}
            <div className="bg-canvas border border-border rounded-xl p-4">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                Execution Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-text-muted">Entry Price:</span>
                  <p className="font-mono tabular-nums font-bold text-text-primary">${trade.entryPrice}</p>
                </div>

                {isFut && (
                  <>
                    <div>
                      <span className="text-text-muted">Stop Loss:</span>
                      <p className="font-mono tabular-nums font-bold text-trade-red">${trade.stopLossPrice}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Take Profit:</span>
                      <p className="font-mono tabular-nums font-bold text-trade-green">${trade.takeProfitPrice}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Token Size:</span>
                      <p className="font-mono tabular-nums text-text-primary">{trade.calculatedPositionSize} tokens</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Notional Value:</span>
                      <p className="font-mono tabular-nums text-text-primary">${trade.notionalValue?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Est. Liquidation:</span>
                      <p className="font-mono tabular-nums text-amber-500 font-semibold">${trade.estLiquidationPrice}</p>
                    </div>
                  </>
                )}

                {isSp && (
                  <>
                    <div>
                      <span className="text-text-muted">Allocation:</span>
                      <p className="font-mono tabular-nums font-bold text-text-primary">${trade.allocationDollar?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Token Quantity:</span>
                      <p className="font-mono tabular-nums text-text-primary">{trade.tokenQuantity} {trade.symbol}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Portfolio Weight:</span>
                      <p className="font-mono tabular-nums text-text-primary">{trade.portfolioWeight}%</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Target Sell Price:</span>
                      <p className="font-mono tabular-nums font-bold text-trade-green">${trade.targetSellPrice}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Custody / Venue:</span>
                      <p className="font-semibold text-text-primary">{trade.venueTag}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Checklist Rules Breakdown */}
            {trade.checkedRules && trade.checkedRules.length > 0 && (
              <div className="bg-canvas border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Checklist Rules Breakdown
                  </h4>
                  <span className="text-xs text-text-muted font-mono">
                    Score: {trade.confluenceScore}/{trade.maxConfluenceScore}
                  </span>
                </div>
                <div className="space-y-2">
                  {trade.checkedRules.map((r) => (
                    <div
                      key={r.ruleId}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-card/60 border border-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${r.isTicked ? 'bg-trade-green text-white' : 'bg-canvas border border-border text-transparent'
                            }`}
                        >
                          ✓
                        </span>
                        <span className={r.isTicked ? 'text-text-primary font-medium' : 'text-text-muted line-through'}>
                          {r.ruleLabel}
                        </span>
                      </div>
                      {r.isMandatory && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">
                          Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Screenshot Preview */}
            {trade.screenshotUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Chart Screenshot
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="text-xs text-brand hover:underline flex items-center gap-1"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    {isZoomed ? 'Shrink' : 'Enlarge'}
                  </button>
                </div>
                <div
                  className={`rounded-xl overflow-hidden border border-border bg-black/40 cursor-pointer transition-all ${isZoomed ? 'max-h-none' : 'max-h-64'
                    }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  <img
                    src={trade.screenshotUrl}
                    alt="Chart Screenshot"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            )}

            {/* Execution Mistakes & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trade.executionErrors && trade.executionErrors.length > 0 && (
                <div className="bg-canvas border border-border rounded-xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-text-muted block mb-2">
                    Discipline Audit Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {trade.executionErrors.map((err) => {
                      const isNone = err === 'None';
                      return (
                        <span
                          key={err}
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-bold shadow-xs ${isNone
                            ? 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                            : 'bg-rose-100 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200'
                            }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${isNone ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                          />
                          <span>{err}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {trade.notes && (
                <div className="bg-canvas border border-border rounded-xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-text-muted block mb-1.5">
                    Trade Rationale & Notes
                  </span>
                  <p className="text-xs text-text-secondary whitespace-pre-wrap">{trade.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

