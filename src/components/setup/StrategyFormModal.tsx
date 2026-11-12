import React, { useState, useEffect } from 'react';
import { StrategyProfile, StrategyRule, CryptoExecutionMode, BaseCurrency, TimeframeTag, SessionTag } from '../../types/strategy';
import { SUPPORTED_CURRENCIES, convertCurrency } from '../../utils/currency';
import { CryptoIcon } from '../common/CryptoIcon';
import { CircleFlag } from '../common/CircleFlag';
import { useToast } from '../../context/ToastContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import { getErrorMessage } from '../../utils/errors';
import { AnimatedSelect, SelectOption } from '../common/AnimatedSelect';
import { getRuleCategoryStyle, SESSION_STYLES } from '../../utils/badgeStyles';
import { playMicroTick, playSuccessChime, playModalClose, playDangerAction } from '../../utils/audioTelemetry';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ShieldCheck,
  Sparkles,
  Save,
  Sliders,
  Check,
} from 'lucide-react';

interface StrategyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy?: StrategyProfile | null;
  onSave: (data: Omit<StrategyProfile, 'id' | 'createdAt' | 'updatedAt'> | Partial<StrategyProfile>) => Promise<unknown>;
}

const ALL_TIMEFRAMES: TimeframeTag[] = ['1m', '3m', '5m', '15m', '30m', '1H', '2H', '4H', '1D', '1W'];
const ALL_SESSIONS: SessionTag[] = ['Asia', 'London', 'NY AM', 'NY PM'];
const CATEGORY_OPTIONS = ['HTF Bias', 'Execution', 'Risk', 'Market Context', 'On-Chain', 'General'] as const;

const EXECUTION_MODE_OPTIONS: SelectOption<CryptoExecutionMode>[] = [
  { value: 'futures', label: 'Crypto Futures (Perps)' },
  { value: 'spot', label: 'Crypto Spot & Holdings' },
];

const BASE_CURRENCY_OPTIONS: SelectOption<BaseCurrency>[] = SUPPORTED_CURRENCIES.map((c) => {
  const cleanName = c.name.replace(/\s*\([^)]*\)/g, '');
  const isCrypto = c.type === 'crypto';
  const displayLabel = isCrypto
    ? `${c.code} • ${cleanName}`
    : c.symbol === c.code
      ? `${c.code} • ${cleanName}`
      : `${c.code} (${c.symbol}) • ${cleanName}`;
  const triggerLabel = isCrypto
    ? c.code
    : c.symbol === c.code
      ? c.code
      : `${c.code} (${c.symbol})`;

  return {
    value: c.code,
    label: displayLabel,
    triggerLabel,
    icon: isCrypto ? (
      <CryptoIcon symbol={c.code} size="xs" />
    ) : (
      <CircleFlag country={c.code} size="xs" />
    ),
  };
});

const RULE_TYPE_OPTIONS: SelectOption<'Mandatory' | 'Confluence'>[] = [
  { value: 'Mandatory', label: 'Required (Lock)' },
  { value: 'Confluence', label: 'Confluence (+Pts)' },
];

const RULE_WEIGHT_OPTIONS: SelectOption<number>[] = [
  { value: 1, label: '+1 pt' },
  { value: 2, label: '+2 pts' },
  { value: 3, label: '+3 pts' },
];

const CATEGORY_SELECT_OPTIONS: SelectOption<typeof CATEGORY_OPTIONS[number]>[] = CATEGORY_OPTIONS.map((c) => ({
  value: c,
  label: c,
}));

export const StrategyFormModal: React.FC<StrategyFormModalProps> = ({
  isOpen,
  onClose,
  strategy,
  onSave,
}) => {
  const toast = useToast();
  const modalRef = useModalA11y(isOpen, onClose);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [executionMode, setExecutionMode] = useState<CryptoExecutionMode>('futures');
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>('USDT');
  const [accountBalance, setAccountBalance] = useState<number>(25000);
  const [defaultRiskValue, setDefaultRiskValue] = useState<number>(1.0);
  const [timeframes, setTimeframes] = useState<TimeframeTag[]>(['15m', '5m', '1m']);
  const [sessions, setSessions] = useState<SessionTag[]>(['London', 'NY AM']);
  const [rules, setRules] = useState<StrategyRule[]>([]);

  // New rule builder form
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'Mandatory' | 'Confluence'>('Mandatory');
  const [newWeight, setNewWeight] = useState(2);
  const [newCategory, setNewCategory] = useState<typeof CATEGORY_OPTIONS[number]>('Execution');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (strategy) {
      setName(strategy.name);
      setDescription(strategy.description || '');
      setExecutionMode(strategy.executionMode);
      setBaseCurrency(strategy.baseCurrency);
      setAccountBalance(strategy.accountBalance);
      setDefaultRiskValue(strategy.defaultRiskValue);
      setTimeframes([...strategy.timeframes]);
      setSessions([...strategy.sessions]);
      setRules([...strategy.rules]);
    } else {
      setName('');
      setDescription('');
      setExecutionMode('futures');
      setBaseCurrency('USDT');
      setAccountBalance(10000);
      setDefaultRiskValue(1.0);
      setTimeframes(['15m', '5m', '1m']);
      setSessions(['London', 'NY AM', 'NY PM', 'Asia']);
      setRules([
        { id: 'rule_1', label: 'HTF Liquidity Swept (Daily/4H)', type: 'Mandatory', weight: 0, category: 'HTF Bias' },
        { id: 'rule_2', label: '15m MSS with Displacement Confirmed', type: 'Mandatory', weight: 0, category: 'Execution' },
        { id: 'rule_3', label: '5m FVG / OTE Fib Retest', type: 'Confluence', weight: 2, category: 'Execution' },
        { id: 'rule_4', label: 'Orderflow CVD / Delta Alignment', type: 'Confluence', weight: 2, category: 'Market Context' },
      ]);
    }
  }, [strategy, isOpen]);

  if (!isOpen) return null;

  // Toggle timeframe pill
  const toggleTimeframe = (tf: TimeframeTag) => {
    playMicroTick();
    if (timeframes.includes(tf)) {
      if (timeframes.length > 1) {
        setTimeframes(timeframes.filter((t) => t !== tf));
      }
    } else {
      setTimeframes([...timeframes, tf]);
    }
  };

  // Toggle session pill
  const toggleSession = (sess: SessionTag) => {
    playMicroTick();
    if (sessions.includes(sess)) {
      if (sessions.length > 1) {
        setSessions(sessions.filter((s) => s !== sess));
      }
    } else {
      setSessions([...sessions, sess]);
    }
  };

  // Add rule
  const handleAddRule = () => {
    if (!newLabel.trim()) return;
    playSuccessChime();
    const rule: StrategyRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: newLabel.trim(),
      type: newType,
      weight: newType === 'Mandatory' ? 0 : newWeight,
      category: newCategory,
    };
    setRules([...rules, rule]);
    setNewLabel('');
  };

  // Draggable reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
    playMicroTick();
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...rules];
    const item = reordered.splice(draggedIndex, 1)[0];
    reordered.splice(index, 0, item);
    setDraggedIndex(index);
    setRules(reordered);
    playMicroTick();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const removeRule = (id: string) => {
    playDangerAction();
    setRules(rules.filter((r) => r.id !== id));
  };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
          toast.error('Validation Error', 'Strategy profile name is required.');
          return;
        }
        if (rules.length === 0) {
          toast.error('Validation Error', 'At least one checklist rule is required.');
          return;
        }

        setIsSubmitting(true);
        try {
          if (strategy) {
            await onSave({
              id: strategy.id,
              name: name.trim(),
              description: description.trim(),
              executionMode,
              baseCurrency,
              accountBalance,
              defaultRiskValue,
              timeframes,
              sessions,
              rules,
            });
            playSuccessChime();
            toast.success('Strategy Updated', `Saved changes to ${name}.`);
          } else {
            await onSave({
              name: name.trim(),
              description: description.trim(),
              executionMode,
              baseCurrency,
              accountBalance,
              riskModel: 'Percentage',
              defaultRiskValue,
              timeframes,
              sessions,
              rules,
              minConfluenceForGradeA: 4,
              minConfluenceForGradeB: 2,
            });
            playSuccessChime();
            toast.success('Strategy Created', `Created strategy ${name}.`);
          }
          onClose();
        } catch (err: unknown) {
          toast.error('Save Error', getErrorMessage(err));
        } finally {
          setIsSubmitting(false);
        }
      };

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-backdrop"
            onClick={() => {
              playModalClose();
              onClose();
      }
  }
    >
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="strategy-modal-title"
      className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-modal-content"
      onClick={(e) => e.stopPropagation()}
    >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-canvas/40">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <h3 id="strategy-modal-title" className="text-sm font-bold text-text-primary text-balance">
                    {strategy ? 'Edit Strategy Profile' : 'New Strategy Profile'}
                  </h3>
                  <p className="text-[11px] text-text-muted">Configure execution rules, capital, and checklist</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playModalClose();
                  onClose();
                }}
                aria-label="Close strategy profile modal"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

                {/* Scrollable Body */}
                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
                  {/* Basic Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="min-w-0">
                      <label htmlFor="strategy-name-input" className="block text-xs font-medium text-text-secondary mb-1">
                        Strategy Name
                      </label>
                      <input
                        id="strategy-name-input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. ICT Silver Bullet & Session Liquidity"
                        required
                        className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:border-brand"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Execution Mode
                      </label>
                      <AnimatedSelect
                        value={executionMode}
                        onChange={(val) => setExecutionMode(val)}
                        options={EXECUTION_MODE_OPTIONS}
                        className="w-full justify-between py-2"
                        dropdownClassName="w-full min-w-0 max-w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="strategy-desc-input" className="block text-xs font-medium text-text-secondary mb-1">
                      Strategy Description
                    </label>
                    <input
                      id="strategy-desc-input"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Killzone displacement, FVG retests, and liquidity sweep setups on Perpetual Futures."
                      className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:border-brand"
                    />
                  </div>

                  {/* Capital & Risk Parameters */}
                  <div className="bg-canvas border border-border rounded-xl p-3.5 space-y-3">
                    <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      Capital & Risk Parameters
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="min-w-0">
                          <label className="block text-[11px] font-medium text-text-secondary mb-1">
                            Base Currency
                          </label>
                          <AnimatedSelect
                            value={baseCurrency}
                            onChange={(val) => {
                              if (val !== baseCurrency) {
                                const convertedBal = convertCurrency(accountBalance, baseCurrency, val);
                                setAccountBalance(convertedBal);
                                setBaseCurrency(val);
                              }
                            }}
                            options={BASE_CURRENCY_OPTIONS}
                            className="w-full justify-between"
                            dropdownClassName="w-full min-w-0 max-w-full"
                          />
                      </div>

                      <div className="min-w-0">
                        <label htmlFor="strategy-balance-input" className="block text-[11px] font-medium text-text-secondary mb-1">
                          Starting Balance
                        </label>
                        <input
                          id="strategy-balance-input"
                          type="number"
                          step="any"
                          min="0"
                          value={accountBalance}
                          onChange={(e) => setAccountBalance(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-text-primary focus:border-brand"
                        />
                      </div>

                      <div className="min-w-0">
                          <label htmlFor="strategy-risk-input" className="block text-[11px] font-medium text-text-secondary mb-1">
                            Default Risk (%)
                          </label>
                <input
                            id="strategy-risk-input"
                            type="number"
                            step="any"
                            min="0.1"
                            max="100"
                            value={defaultRiskValue}
                            onChange={(e) => setDefaultRiskValue(Math.min(100, Math.max(0.01, parseFloat(e.target.value) || 1.0)))}
                            className="w-full bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-text-primary focus:border-brand"
                          />
                      </div>
                    </div>
                  </div>

                  {/* Timeframes & Sessions Multi-select Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">
                          Chart Timeframes
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_TIMEFRAMES.map((tf) => {
                            const isSelected = timeframes.includes(tf);
                            return (
                              <button
                                key={tf}
                                type="button"
                                onClick={() => toggleTimeframe(tf)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${isSelected
                                  ? 'bg-brand text-black shadow-xs'
                                  : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
                                  }`}
                              >
                                {tf}
                              </button>
                            );
                          })}
                        </div>
                    </div>

                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1.5">
                            Allowed Sessions
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_SESSIONS.map((sess) => {
                              const isSelected = sessions.includes(sess);
                              const styleConfig = SESSION_STYLES[sess] || {
                                active: 'bg-brand text-black font-bold shadow-xs',
                                dot: 'bg-brand',
                                badge: 'bg-canvas border border-border text-text-muted',
                              };
                              return (
                                <button
                                  key={sess}
                                  type="button"
                                  onClick={() => toggleSession(sess)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${isSelected
                                    ? styleConfig.active
                                    : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${styleConfig.dot} ${isSelected ? 'opacity-100' : 'opacity-40'}`}
                                  />
                                  <span>{sess}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                        {/* Checklist Rules Builder */}
                        <div className="space-y-3 pt-2 border-t border-border">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                              Checklist Rules Builder ({rules.length} rules)
                            </h4>
                            <span className="text-[10px] text-text-muted font-mono">
                              {rules.filter((r) => r.type === 'Mandatory').length} Required • {rules.filter((r) => r.type === 'Confluence').length} Confluence
                            </span>
                          </div>

                                {/* Existing Rules List */ }
                                < div className = "space-y-1.5 max-h-56 overflow-y-auto" >
                                {
                                  rules.map((rule, idx) => (
                                    <div
                                      key={rule.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, idx)}
                                      onDragEnter={(e) => handleDragEnter(e, idx)}
                                      onDragOver={handleDragOver}
                                      onDragEnd={handleDragEnd}
                                      className={`flex items-center justify-between p-2 rounded-xl bg-canvas border text-xs gap-2 transition-all duration-200 ease-out select-none cursor-grab active:cursor-grabbing ${draggedIndex === idx
                                        ? 'opacity-40 scale-[0.98] border-brand shadow-md ring-1 ring-brand/40 bg-brand/5'
                                        : 'border-border hover:border-brand/40'
                                        }`}
                                    >
                                      <div
                                        className="flex items-center gap-1 shrink-0 text-text-muted hover:text-text-primary p-0.5"
                                        title="Drag to reorder rule"
                                      >
                                        <GripVertical className="w-3.5 h-3.5 shrink-0" />
                                      </div>

                                      <span className="flex-1 font-medium text-text-primary truncate">
                                        {rule.label}
                                      </span>

                                      <span
                                        className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded shrink-0 ${rule.type === 'Mandatory'
                                          ? 'bg-rose-500/15 text-rose-400'
                                          : 'bg-amber-500/15 text-amber-400'
                                          }`}
                                      >
                                        {rule.type === 'Mandatory' ? 'REQUIRED' : `+${rule.weight}`}
                                      </span>

                  {rule.category && (
                                  <span
                                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 hidden sm:inline ${getRuleCategoryStyle(
                                      rule.category
                                    )}`}
                                  >
                                    {rule.category}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeRule(rule.id);
                                  }}
                                  aria-label={`Remove rule "${rule.label}"`}
                                  className="min-w-[28px] min-h-[28px] sm:min-w-[24px] sm:min-h-[24px] p-1 flex items-center justify-center rounded text-text-muted hover:text-trade-red hover:bg-card-hover shrink-0 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                  ))}
                          </div>

                        {/* Add New Rule Form */}
                        <div className="bg-canvas border border-border rounded-xl p-2.5 space-y-2">
                          <label htmlFor="strategy-new-rule-input" className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                            Add Checklist Rule
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              id="strategy-new-rule-input"
                              type="text"
                              value={newLabel}
                              onChange={(e) => setNewLabel(e.target.value)}
                              placeholder="e.g. SMT Divergence BTC vs ETH"
                              className="flex-1 min-w-[180px] bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-brand"
                            />

                              <AnimatedSelect
                                value={newType}
                                onChange={(val) => setNewType(val)}
                                options={RULE_TYPE_OPTIONS}
                              />

                              {newType === 'Confluence' && (
                                <AnimatedSelect
                                  value={newWeight}
                                  onChange={(val) => setNewWeight(val)}
                                  options={RULE_WEIGHT_OPTIONS}
                                />
                              )}

                              <AnimatedSelect
                                value={newCategory}
                                onChange={(val) => setNewCategory(val)}
                                options={CATEGORY_SELECT_OPTIONS}
                              />

                              <button
                                type="button"
                                onClick={handleAddRule}
                                className="px-3 py-1.5 rounded-lg bg-card-hover border border-border text-text-primary hover:bg-card text-xs font-bold transition-colors"
                              >
                                Add
                              </button>
                            </div>
                        </div>

                        {/* Checklist Scoring Rationale / Gate Enforcement */}
                        <div className="p-2.5 rounded-xl bg-canvas/60 border border-border/40 text-[11px] text-text-muted flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                          <span className="leading-relaxed">
                            <strong className="text-text-primary">Gate Enforcement:</strong> Required rules must pass to unlock execution. Confluence points determine setup grade: <strong className="text-trade-green">Grade A</strong> (4+ pts), <strong className="text-amber-400">Grade B</strong> (2–3 pts), or <strong className="text-trade-red">Grade C</strong> (&lt;2 pts).
                          </span>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                        <button
                          type="button"
                          onClick={() => {
                            playModalClose();
                            onClose();
                          }}
                          className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-card-hover rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-5 py-2 rounded-xl bg-brand text-black font-bold text-xs hover:bg-brand-hover shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSubmitting ? 'Saving...' : 'Save Strategy Profile'}
                        </button>
                      </div>
                    </form>
                  </div >
              </div >
              );
  };

