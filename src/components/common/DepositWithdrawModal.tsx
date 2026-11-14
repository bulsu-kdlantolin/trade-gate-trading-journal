import React, { useState } from 'react';
import { StrategyProfile } from '../../types/strategy';
import { getCurrencySymbol, isCryptoCurrency } from '../../utils/currency';
import { CryptoIcon } from '../common/CryptoIcon';
import { useToast } from '../../context/ToastContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import { getErrorMessage } from '../../utils/errors';
import { Wallet, Plus, Minus, RotateCcw, X, AlertCircle } from 'lucide-react';
import { playMicroTick, playSuccessChime, playModalClose } from '../../utils/audioTelemetry';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: StrategyProfile | null;
  currentBalance: number;
  onAddAdjustment: (type: 'deposit' | 'withdraw', amount: number, note?: string) => Promise<unknown>;
  onResetBalance?: (newBalance: number) => Promise<unknown>;
}

export const DepositWithdrawModal: React.FC<DepositWithdrawModalProps> = ({
  isOpen,
  onClose,
  strategy,
  currentBalance,
  onAddAdjustment,
  onResetBalance,
}) => {
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | 'reset'>('deposit');
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const modalRef = useModalA11y(isOpen, onClose);

  if (!isOpen || !strategy) return null;

  const currencySymbol = getCurrencySymbol(strategy.baseCurrency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || !Number.isFinite(amount) || amount <= 0) {
      setAmountError('Please enter a valid capital amount greater than zero.');
      toast.error('Invalid Amount', 'Please enter a valid numeric amount greater than zero.');
      return;
    }

    if (amount > 1e12) {
      setAmountError('Amount exceeds maximum limit ($1,000,000,000,000).');
      toast.error('Amount Exceeds Maximum Limit', 'Capital amount must be less than $1,000,000,000,000.');
      return;
    }

    if (actionType === 'withdraw' && amount > currentBalance) {
      toast.warning('Over-withdrawal Warning', 'Withdrawal amount exceeds available strategy balance.');
    }

    setIsSubmitting(true);
    try {
      if (actionType === 'reset') {
        if (onResetBalance) {
          await onResetBalance(amount);
          toast.success('Balance Reset', `Account balance reset to ${currencySymbol}${amount.toLocaleString()}`);
        }
      } else {
        await onAddAdjustment(actionType, amount, note);
        toast.success(
          actionType === 'deposit' ? 'Capital Added' : 'Capital Withdrawn',
          `${currencySymbol}${amount.toLocaleString()} ${actionType === 'deposit' ? 'deposited to' : 'withdrawn from'} ${strategy.name}.`
        );
      }
      setAmountStr('');
      setNote('');
      setAmountError(null);
      playSuccessChime();
      onClose();
    } catch (err: unknown) {
      toast.error('Transaction Failed', getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setAmountError(null);
    playModalClose();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-backdrop"
      onClick={handleCloseModal}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-modal-title"
        className="w-full max-w-md bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-2xl relative animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleCloseModal}
          aria-label="Close capital adjustment modal"
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-card-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <Wallet className="w-5 h-5 text-brand shrink-0" />
          <div>
            <h3 id="deposit-modal-title" className="text-sm font-bold text-text-primary text-balance">Capital Adjustment</h3>
            <p className="text-xs text-text-secondary">{strategy.name}</p>
          </div>
        </div>

        {/* Current Balance Card */}
        <div className="bg-canvas border border-border rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-xs text-text-muted font-medium">Available Strategy Capital</span>
          <span className="text-base font-bold font-mono tabular-nums text-text-primary inline-flex items-center gap-1.5">
            {isCryptoCurrency(strategy.baseCurrency) ? (
              <>
                <CryptoIcon symbol={strategy.baseCurrency} size="xs" />
                <span>{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </>
            ) : (
              <span>{currencySymbol}{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            )}
          </span>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-3.5">
          {/* Action Segmented Switcher (Deposit / Withdraw / Reset) with Sliding Indicator */}
          <div className="relative grid grid-cols-3 p-1 rounded-xl bg-canvas border border-border select-none">
            {/* Sliding highlight indicator */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(33.333%-4px)] rounded-lg transition-all duration-200 ease-out shadow-xs pointer-events-none ${actionType === 'deposit'
                ? 'left-1 bg-trade-green/15'
                : actionType === 'withdraw'
                  ? 'left-[calc(33.333%+2px)] bg-trade-red/15'
                  : 'left-[calc(66.666%+3px)] bg-brand/15'
                }`}
            />
            <button
              type="button"
              onClick={() => {
                playMicroTick();
                setActionType('deposit');
                if (amountError) setAmountError(null);
              }}
              className={`relative z-10 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors duration-200 active:scale-[0.98] ${actionType === 'deposit'
                ? 'text-trade-green'
                : 'text-text-muted hover:text-text-primary'
                }`}
            >
              <Plus className="w-3 h-3" />
              Deposit
            </button>
            <button
              type="button"
              onClick={() => {
                playMicroTick();
                setActionType('withdraw');
                if (amountError) setAmountError(null);
              }}
              className={`relative z-10 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors duration-200 active:scale-[0.98] ${actionType === 'withdraw'
                ? 'text-trade-red'
                : 'text-text-muted hover:text-text-primary'
                }`}
            >
              <Minus className="w-3 h-3" />
              Withdraw
            </button>
            <button
              type="button"
              onClick={() => {
                playMicroTick();
                setActionType('reset');
                if (amountError) setAmountError(null);
              }}
              className={`relative z-10 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors duration-200 active:scale-[0.98] ${actionType === 'reset'
                  ? 'text-text-primary dark:text-brand'
                  : 'text-text-muted hover:text-text-primary'
                  }`}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label htmlFor="capital-adjustment-amount" className="block text-xs font-medium text-text-secondary mb-1">
              {actionType === 'reset' ? 'New Starting Balance' : 'Adjustment Amount'} ({strategy.baseCurrency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-text-muted text-xs pointer-events-none">
                {isCryptoCurrency(strategy.baseCurrency) ? (
                  <CryptoIcon symbol={strategy.baseCurrency} size="xs" />
                ) : (
                  <span className="font-mono">{currencySymbol}</span>
                )}
              </span>
              <input
                id="capital-adjustment-amount"
                type="number"
                step="any"
                min="0"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (amountError) setAmountError(null);
                }}
                placeholder="0.00"
                className={`w-full bg-canvas border rounded-xl ${amountError ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-border focus:border-brand'
                  } ${isCryptoCurrency(strategy.baseCurrency) ? 'pl-8' : 'pl-7'
                  } pr-3 py-2 text-xs font-mono font-bold text-text-primary placeholder:text-text-muted transition-colors`}
              />
            </div>
            {amountError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{amountError}</span>
                </p>
              )}
                <p className="text-[11px] text-text-muted mt-1 leading-normal">
                  {actionType === 'deposit'
                    ? 'Adds capital to this strategy profile. Capital adjustments do not distort trading P&L.'
                    : actionType === 'withdraw'
                      ? 'Deducts capital from this strategy profile. Historical trading P&L remains untouched.'
                      : 'Directly overwrites the starting balance of this strategy to the specified amount.'}
                </p>
              </div>

            {/* Note input (only for deposit/withdraw) */}
            {actionType !== 'reset' && (
              <div>
                <label htmlFor="capital-adjustment-note" className="block text-xs font-medium text-text-secondary mb-1">
                  Transaction Note <span className="text-text-muted font-normal">(Optional)</span>
                </label>
                <input
                  id="capital-adjustment-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Weekly top-up, Profit withdrawal, Rebalancing"
                  className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-brand"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-card-hover rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl text-white shadow-xs transition-all ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                  } ${actionType === 'deposit'
                    ? 'bg-trade-green hover:bg-trade-green-hover'
                    : actionType === 'withdraw'
                      ? 'bg-trade-red hover:bg-trade-red-hover'
                      : 'bg-brand text-black hover:bg-brand-hover'
                  }`}
              >
                {isSubmitting ? 'Processing...' : actionType === 'deposit'
                  ? 'Confirm Deposit'
                  : actionType === 'withdraw'
                    ? 'Confirm Withdrawal'
                    : 'Reset Balance'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};
