import React, { useState, useEffect } from 'react';
import { TradeRecord, TradeResult, ExecutionErrorTag, isFuturesTrade, isSpotTrade } from '../../types/trade';
import { useToast } from '../../context/ToastContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import { getErrorMessage } from '../../utils/errors';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { X, Save, Edit3, DollarSign, Check, Trash2 } from 'lucide-react';

interface TradeEditModalProps {
  trade: TradeRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<TradeRecord>) => Promise<unknown>;
  onDelete?: (id: string) => Promise<unknown>;
  currencySymbol?: string;
}

const ERROR_TAG_OPTIONS: ExecutionErrorTag[] = [
  'None',
  'FOMO',
  'Moved SL',
  'Early Exit',
  'Over-leveraged',
  'Late Entry',
  'Impulse Trade',
  'Chased Price',
  'Revenge Trade',
  'No Invalidation',
];

export const TradeEditModal: React.FC<TradeEditModalProps> = ({
  trade,
  isOpen,
  onClose,
  onSave,
  onDelete,
  currencySymbol = '$',
}) => {
  const toast = useToast();
  const modalRef = useModalA11y(isOpen, onClose);

  const [status, setStatus] = useState<'Open' | 'Closed'>('Open');
  const [outcome, setOutcome] = useState<TradeResult>('Win');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [pnlDollar, setPnlDollar] = useState<string>('');
  const [pnlR, setPnlR] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedErrors, setSelectedErrors] = useState<ExecutionErrorTag[]>(['None']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (trade) {
      setStatus(trade.status === 'Open' ? 'Open' : 'Closed');
      setOutcome(trade.tradeResult || 'Win');
      setExitPrice(trade.exitPrice !== undefined ? String(trade.exitPrice) : '');
      setPnlDollar(trade.pnlDollar !== undefined ? String(trade.pnlDollar) : '');
      setPnlR(trade.pnlR !== undefined ? String(trade.pnlR) : '');
      setNotes(trade.notes || '');
      setSelectedErrors(trade.executionErrors && trade.executionErrors.length > 0 ? trade.executionErrors : ['None']);
    }
  }, [trade, isOpen]);

  if (!isOpen || !trade) return null;

  const isFut = isFuturesTrade(trade);
  const isSp = isSpotTrade(trade);

  const toggleErrorTag = (tag: ExecutionErrorTag) => {
    if (tag === 'None') {
      setSelectedErrors(['None']);
      return;
    }
    const filtered = selectedErrors.filter((e) => e !== 'None');
    if (filtered.includes(tag)) {
      const updated = filtered.filter((e) => e !== tag);
      setSelectedErrors(updated.length === 0 ? ['None'] : updated);
    } else {
      setSelectedErrors([...filtered, tag]);
    }
  };

  // Auto-derive PnL if user enters exit price
  const handleExitPriceChange = (valStr: string) => {
    setExitPrice(valStr);
    const exitP = parseFloat(valStr);
    if (!isNaN(exitP) && Number.isFinite(exitP) && exitP > 0 && trade.entryPrice > 0) {
      if (isFut) {
        const diff = trade.direction === 'Long' ? exitP - trade.entryPrice : trade.entryPrice - exitP;
        const dollar = Number((diff * trade.calculatedPositionSize).toFixed(2));
        setPnlDollar(String(dollar));
        if (trade.riskAmountDollar > 0) {
          setPnlR(String(Number((dollar / trade.riskAmountDollar).toFixed(2))));
        }
        setOutcome(dollar > 0 ? 'Win' : dollar < 0 ? 'Loss' : 'Breakeven');
      } else if (isSp) {
        const ratio = (exitP - trade.entryPrice) / trade.entryPrice;
        const dollar = Number((trade.allocationDollar * ratio).toFixed(2));
        setPnlDollar(String(dollar));
        setPnlR(String(Number(ratio.toFixed(2))));
        setOutcome(dollar > 0 ? 'Win' : dollar < 0 ? 'Loss' : 'Breakeven');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedExit = exitPrice ? parseFloat(exitPrice) : undefined;
      const exitP = parsedExit !== undefined && Number.isFinite(parsedExit) ? Math.max(0, parsedExit) : undefined;

      const parsedDollar = pnlDollar ? parseFloat(pnlDollar) : undefined;
      const dollar = parsedDollar !== undefined && Number.isFinite(parsedDollar) ? parsedDollar : undefined;

      const parsedR = pnlR ? parseFloat(pnlR) : undefined;
      const r = parsedR !== undefined && Number.isFinite(parsedR) ? parsedR : undefined;

      const updates: Partial<TradeRecord> = {
        status,
        tradeResult: status === 'Closed' ? outcome : undefined,
        exitPrice: exitP,
        pnlDollar: status === 'Closed' ? dollar : undefined,
        pnlR: status === 'Closed' ? r : undefined,
        notes: notes.trim(),
        executionErrors: selectedErrors,
        exitTimestamp: status === 'Closed' ? (trade.exitTimestamp || new Date().toISOString()) : undefined,
      };

      await onSave(trade.id, updates);
      toast.success('Trade Updated', `Saved updates for ${trade.symbol}.`);
      onClose();
    } catch (err: unknown) {
      toast.error('Update Failed', getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-edit-modal-title"
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close edit trade modal"
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-card-hover"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <Edit3 className="w-5 h-5 text-brand shrink-0" />
          <div>
            <h3 id="trade-edit-modal-title" className="text-sm font-bold text-text-primary text-balance">Edit Trade Record</h3>
            <p className="text-xs text-text-secondary">{trade.symbol} • Entry: <span className="font-mono tabular-nums">{currencySymbol}{trade.entryPrice}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Toggle */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Position Status
            </label>
            <div className="relative grid grid-cols-2 p-1 bg-canvas rounded-xl border border-border select-none">
              {/* Sliding highlight indicator */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-brand shadow-xs transition-all duration-200 ease-out pointer-events-none ${status === 'Open' ? 'left-1' : 'left-[calc(50%+3px)]'
                  }`}
              />
              <button
                type="button"
                onClick={() => setStatus('Open')}
                className={`relative z-10 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 active:scale-[0.98] ${status === 'Open'
                  ? 'text-black font-extrabold'
                  : 'text-text-muted hover:text-text-primary'
                  }`}
              >
                Active (Open)
              </button>
              <button
                type="button"
                onClick={() => setStatus('Closed')}
                className={`relative z-10 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 active:scale-[0.98] ${status === 'Closed'
                  ? 'text-black font-extrabold'
                  : 'text-text-muted hover:text-text-primary'
                  }`}
              >
                Resolved (Closed)
              </button>
            </div>
          </div>

          {/* If Closed: Outcome & Realized Values */}
          {status === 'Closed' && (
            <div className="bg-canvas border border-border p-3 rounded-xl space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1">
                  Trade Outcome
                </label>
                <div className="relative grid grid-cols-3 p-1 bg-card rounded-xl border border-border select-none">
                  {/* Sliding highlight indicator */}
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(33.333%-4px)] rounded-lg shadow-xs transition-all duration-200 ease-out pointer-events-none ${outcome === 'Win'
                      ? 'left-1 bg-trade-green'
                      : outcome === 'Loss'
                        ? 'left-[calc(33.333%+2px)] bg-trade-red'
                        : 'left-[calc(66.666%+3px)] bg-blue-500'
                      }`}
                  />
                  {(['Win', 'Loss', 'Breakeven'] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setOutcome(res)}
                      className={`relative z-10 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 active:scale-[0.98] text-center ${outcome === res
                        ? 'text-white'
                        : 'text-text-muted hover:text-text-primary'
                        }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label htmlFor="edit-exit-price" className="block text-[10px] font-medium text-text-secondary mb-1">
                    Exit Price ({currencySymbol})
                  </label>
                  <input
                    id="edit-exit-price"
                    type="number"
                    step="any"
                    value={exitPrice}
                    onChange={(e) => handleExitPriceChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 font-mono text-text-primary focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="edit-pnl-dollar" className="block text-[10px] font-medium text-text-secondary mb-1">
                    Realized P&L ({currencySymbol})
                  </label>
                  <input
                    id="edit-pnl-dollar"
                    type="number"
                    step="any"
                    value={pnlDollar}
                    onChange={(e) => setPnlDollar(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 font-mono font-bold text-text-primary focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="edit-pnl-r" className="block text-[10px] font-medium text-text-secondary mb-1">
                    R-Multiple
                  </label>
                  <input
                    id="edit-pnl-r"
                    type="number"
                    step="any"
                    value={pnlR}
                    onChange={(e) => setPnlR(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 font-mono font-bold text-text-primary focus:border-brand"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Discipline Mistakes */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Discipline Audit Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ERROR_TAG_OPTIONS.map((tag) => {
                const isSelected = selectedErrors.includes(tag);
                const isNone = tag === 'None';
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleErrorTag(tag)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all focus:outline-hidden ${isSelected
                      ? isNone
                        ? 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs hover:bg-emerald-200 dark:hover:bg-emerald-500/40'
                        : 'bg-rose-100 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200 font-bold shadow-xs hover:bg-rose-200 dark:hover:bg-rose-500/40'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {isSelected && (
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${isNone ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                      />
                    )}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="edit-trade-notes" className="block text-xs font-medium text-text-secondary mb-1">
              Notes & Reflection
            </label>
            <textarea
              id="edit-trade-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Reflections, post-trade analysis, lessons learned..."
              className="w-full bg-canvas border border-border rounded-xl p-2.5 text-xs text-text-primary focus:border-brand"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
            {onDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Trade
              </button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-card-hover rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-brand text-black font-bold text-xs hover:bg-brand-hover shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>

      {onDelete && (
        <ConfirmDeleteModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={async () => {
            try {
              await onDelete(trade.id);
              toast.success('Trade Deleted', `Removed ${trade.symbol} entry from ledger.`);
              setIsConfirmDeleteOpen(false);
              onClose();
            } catch (err: unknown) {
              toast.error('Delete Failed', getErrorMessage(err));
            }
          }}
          itemName={trade.symbol}
        />
      )}
    </div>
  );
};

