import React, { useState, lazy, Suspense } from 'react';
import { StrategyProfile } from '../../types/strategy';
import { getCurrencySymbol, isCryptoCurrency } from '../../utils/currency';
import { CryptoIcon } from '../common/CryptoIcon';
import { getSessionStyle, getTimeframeHorizonStyle } from '../../utils/badgeStyles';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errors';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { playMicroTick, playModalOpen, playModalClose, playSuccessChime, playDangerAction } from '../../utils/audioTelemetry';

// Lazy-load modal dialogs to keep hub bundle minimal
const StrategyFormModal = lazy(() =>
  import('./StrategyFormModal').then((m) => ({ default: m.StrategyFormModal }))
);
const ShareStrategyModal = lazy(() =>
  import('./ShareStrategyModal').then((m) => ({ default: m.ShareStrategyModal }))
);
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Share2,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface StrategiesHubProps {
  strategies: StrategyProfile[];
  activeStrategy: StrategyProfile | null;
  onSelectStrategy: (id: string) => void;
  onSaveStrategy: (data: Omit<StrategyProfile, 'id' | 'createdAt' | 'updatedAt'> | Partial<StrategyProfile>) => Promise<unknown>;
  onDeleteStrategy: (id: string) => Promise<unknown>;
  onResetDefaultStrategies: () => Promise<unknown>;
}

export const StrategiesHub: React.FC<StrategiesHubProps> = ({
  strategies,
  activeStrategy,
  onSelectStrategy,
  onSaveStrategy,
  onDeleteStrategy,
  onResetDefaultStrategies,
}) => {
  const toast = useToast();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyProfile | null>(null);
  const [selectedStrategyForShare, setSelectedStrategyForShare] = useState<StrategyProfile | null>(null);
  const [strategyToDelete, setStrategyToDelete] = useState<StrategyProfile | null>(null);

  const handleOpenCreate = () => {
    playModalOpen();
    setEditingStrategy(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (strat: StrategyProfile) => {
    playModalOpen();
    setEditingStrategy(strat);
    setIsFormModalOpen(true);
  };

  const handleOpenShare = (strat: StrategyProfile) => {
    playModalOpen();
    setSelectedStrategyForShare(strat);
  };

  const handleDeleteClick = (strat: StrategyProfile) => {
    if (strategies.length <= 1) {
      toast.warning('Action Blocked', 'You must maintain at least one active strategy profile.');
      return;
    }
    playDangerAction();
    setStrategyToDelete(strat);
  };

  const handleConfirmDelete = async () => {
    if (!strategyToDelete) return;
    playDangerAction();
    try {
      await onDeleteStrategy(strategyToDelete.id);
      toast.success('Strategy Deleted', `Removed profile "${strategyToDelete.name}".`);
    } catch (err: unknown) {
      toast.error('Delete Failed', getErrorMessage(err));
    } finally {
      setStrategyToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Strip */}
      <div className="card-glass rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand" />
            <h3 className="text-base font-extrabold text-text-primary">
              Crypto Strategy Profiles
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Isolated capital balances, pre-trade checklist gates, and execution rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playDangerAction();
              onResetDefaultStrategies();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-muted hover:text-text-primary text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand text-black font-bold text-xs hover:bg-brand-hover shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            New Strategy
          </button>
        </div>
      </div>

      {/* Strategy Profile Cards Grid */}
      {strategies.length === 0 ? (
        <div className="card-glass rounded-2xl p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center text-brand mx-auto shadow-xs">
            <Sliders className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-text-primary text-balance">No Strategy Profiles Found</h4>
          <p className="text-xs text-text-muted leading-relaxed text-pretty max-w-sm mx-auto">
            Create a custom trading strategy or restore default crypto profiles to access the Execution Gate.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={onResetDefaultStrategies}
              className="px-3.5 py-1.5 rounded-xl bg-canvas border border-border hover:border-brand/40 text-xs font-semibold text-text-primary transition-colors"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 rounded-xl bg-brand text-black text-xs font-bold hover:bg-brand-hover shadow-xs transition-colors"
            >
              Create Strategy
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strat) => {
            const isActive = strat.id === activeStrategy?.id;
            const currencySymbol = getCurrencySymbol(strat.baseCurrency);
            const mandatoryCount = strat.rules.filter((r) => r.type === 'Mandatory').length;
            const confluenceCount = strat.rules.filter((r) => r.type === 'Confluence').length;

            return (
              <div
                key={strat.id}
                className={`card-glass rounded-2xl p-5 space-y-4 transition-all ${isActive ? 'border-brand/60 ring-1 ring-brand/30 shadow-md' : 'hover:border-border-muted'
                  }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold tracking-tight text-text-primary truncate text-balance">
                        {strat.name}
                      </h4>
                      {isActive && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand/15 text-brand font-mono shrink-0">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    {strat.description && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed text-pretty">
                        {strat.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono shrink-0 ${strat.executionMode === 'futures'
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                  >
                    {strat.executionMode === 'futures' ? 'Perps' : 'Spot'}
                  </span>
                </div>

                {/* Capital & Parameters Bar */}
                <div className="grid grid-cols-3 gap-2 bg-canvas border border-border p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                      Base Capital
                    </span>
                    <span className="font-mono font-bold text-sm text-trade-green block mt-0.5 tabular-nums">
                      {isCryptoCurrency(strat.baseCurrency) ? (
                        <span className="inline-flex items-center justify-center gap-1">
                          <CryptoIcon symbol={strat.baseCurrency} size="xs" />
                          <span>{strat.accountBalance.toLocaleString()}</span>
                        </span>
                      ) : (
                        `${currencySymbol}${strat.accountBalance.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                      Default Risk
                    </span>
                    <span className="font-mono font-bold text-sm text-text-primary block mt-0.5 tabular-nums">
                      {strat.defaultRiskValue}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                      Rules
                    </span>
                    <span className="font-mono font-bold text-xs text-text-primary block mt-0.5 tabular-nums">
                      {mandatoryCount} Req • {confluenceCount} Conf
                    </span>
                  </div>
                </div>

                {/* Timeframes & Sessions Tagline */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-text-muted">TF:</span>
                    {strat.timeframes.map((tf) => (
                      <span key={tf} className={`font-bold ${getTimeframeHorizonStyle(tf)}`}>
                        {tf}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-text-muted">Sessions:</span>
                    {strat.sessions.map((sess) => (
                      <span
                        key={sess}
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded ${getSessionStyle(sess).badge}`}
                      >
                        <span className={`w-1 h-1 rounded-full shrink-0 ${getSessionStyle(sess).dot}`} />
                        {sess}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons Strip with Text Labels */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  {!isActive ? (
                    <button
                      onClick={() => {
                        playSuccessChime();
                        onSelectStrategy(strat.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-primary font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Select Active</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand">
                      <Check className="w-3.5 h-3.5" />
                      Active Playbook
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenShare(strat)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-brand hover:bg-card-hover border border-transparent hover:border-border flex items-center gap-1.5 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Playbook</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(strat)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-card-hover border border-transparent hover:border-border flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(strat)}
                      className="p-1.5 rounded-xl text-text-muted hover:text-trade-red hover:bg-card-hover transition-colors"
                      title="Delete Profile"
                      aria-label={`Delete ${strat.name} strategy profile`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )
      }

      {/* Strategy Profile Editor Modal */}
      {
        isFormModalOpen && (
          <Suspense fallback={null}>
            <StrategyFormModal
              isOpen={isFormModalOpen}
              onClose={() => {
                playModalClose();
                setIsFormModalOpen(false);
              }}
              strategy={editingStrategy}
              onSave={async (data) => {
                playSuccessChime();
                return onSaveStrategy(data);
              }}
            />
          </Suspense>
        )
      }

      {/* Strategy Playbook Share Modal */}
      {
        selectedStrategyForShare && (
          <Suspense fallback={null}>
            <ShareStrategyModal
              strategy={selectedStrategyForShare}
              onClose={() => {
                playModalClose();
                setSelectedStrategyForShare(null);
              }}
            />
          </Suspense>
        )
      }

      {/* Delete Strategy Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={!!strategyToDelete}
        onClose={() => {
          playModalClose();
          setStrategyToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Strategy Profile?"
        description="Permanently delete this strategy profile? All trade records logged under this strategy will remain preserved in your historical ledger."
        itemName={strategyToDelete?.name}
        confirmButtonText="Delete Profile"
      />
    </div >
  );
};
