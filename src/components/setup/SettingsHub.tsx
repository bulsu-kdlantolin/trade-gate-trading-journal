import React, { useRef, useState, useEffect } from 'react';
import { StrategyProfile, BaseCurrency } from '../../types/strategy';
import { TradeRecord } from '../../types/trade';
import { TradingSession } from '../../types/session';
import { getSessionStyle } from '../../utils/badgeStyles';
import { useToast } from '../../context/ToastContext';
import { SUPPORTED_CURRENCIES, getCurrencySymbol, convertCurrency, isCryptoCurrency, formatCurrencyAmount, formatNumberOnly } from '../../utils/currency';
import { CryptoIcon } from '../common/CryptoIcon';
import { CircleFlag } from '../common/CircleFlag';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { getErrorMessage } from '../../utils/errors';
import { playMicroTick, playModalOpen, playModalClose, playSuccessChime, playDangerAction } from '../../utils/audioTelemetry';
import {
  getSavedTradingSessions,
  saveTradingSessions,
  resetTradingSessions,
  getLocalFromUtc,
  getUtcFromLocal,
  formatSessionLocalRange,
} from '../../utils/sessionClock';
import {
  createSystemBackupJson,
  parseSystemBackupJson,
  exportTradesToCSV,
  downloadFile,
} from '../../utils/backup';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  Edit3,
  Check,
  Coins,
} from 'lucide-react';
import { AnimatedSelect, SelectOption } from '../common/AnimatedSelect';

interface SettingsHubProps {
  strategies: StrategyProfile[];
  allTrades: TradeRecord[];
  activeStrategy?: StrategyProfile | null;
  onImportBackup: (data: { strategies: StrategyProfile[]; trades: TradeRecord[] }) => Promise<unknown>;
  onResetAllData: () => Promise<unknown>;
  onClearAllTrades: () => Promise<unknown>;
  onUpdateStrategyCurrency?: (currency: BaseCurrency, applyToAll?: boolean) => Promise<unknown>;
}

const SESSION_HOUR_OPTIONS: SelectOption<number>[] = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

const SESSION_MINUTE_OPTIONS: SelectOption<number>[] = [0, 15, 30, 45].map((m) => ({
  value: m,
  label: m.toString().padStart(2, '0'),
}));

const SESSION_PERIOD_OPTIONS: SelectOption<'AM' | 'PM'>[] = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

export const SettingsHub: React.FC<SettingsHubProps> = ({
  strategies,
  allTrades,
  activeStrategy,
  onImportBackup,
  onResetAllData,
  onClearAllTrades,
  onUpdateStrategyCurrency,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Currency & Money Symbol Settings State
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    () => activeStrategy?.baseCurrency || localStorage.getItem('tradegate_preferred_currency') || 'USD'
  );
  const [isSavingCurrency, setIsSavingCurrency] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  useEffect(() => {
    if (activeStrategy?.baseCurrency) {
      setSelectedCurrency(activeStrategy.baseCurrency);
    }
  }, [activeStrategy?.baseCurrency]);

  const currentCurrencySymbol = getCurrencySymbol(selectedCurrency);

  const handleSelectCurrency = async (newCurrency: string) => {
    if (newCurrency === selectedCurrency && activeStrategy?.baseCurrency === newCurrency) {
      return;
    }
    playSuccessChime();
    setSelectedCurrency(newCurrency);
    setIsSavingCurrency(true);
    try {
      if (onUpdateStrategyCurrency) {
        await onUpdateStrategyCurrency(newCurrency as BaseCurrency, true);
      } else {
        localStorage.setItem('tradegate_preferred_currency', newCurrency);
      }
      const sym = getCurrencySymbol(newCurrency);
      toast.success(
        'Currency Converted',
        `Switched base currency to ${sym} (${newCurrency}) and auto-converted account balances.`
      );
    } catch (err: unknown) {
      toast.error('Failed to convert currency', getErrorMessage(err));
    } finally {
      setIsSavingCurrency(false);
    }
  };

  // Trading Sessions State & Editable Form
  const [sessions, setSessions] = useState<TradingSession[]>(() => getSavedTradingSessions());
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Re-render when live exchange rates update
  const [, setRateSyncTick] = useState(0);
  useEffect(() => {
    const handleRates = () => setRateSyncTick((prev) => prev + 1);
    window.addEventListener('tradegate_rates_updated', handleRates);
    return () => window.removeEventListener('tradegate_rates_updated', handleRates);
  }, []);
  const [editForm, setEditForm] = useState({
    startHour12: 12,
    startMinute: 0,
    startPeriod: 'AM' as 'AM' | 'PM',
    endHour12: 8,
    endMinute: 0,
    endPeriod: 'AM' as 'AM' | 'PM',
  });

  const sessionDescriptions: Record<string, string> = {
    asia: 'Initial weekly ranges, Asian high/low formation, overnight funding rate resets.',
    london: 'Judas swings, sweeps of Asian extremes, European open momentum and reversals.',
    ny_am: 'US Cash Open, ETF inflows, macroeconomic releases (CPI/FOMC), highest intraday volume.',
    ny_pm: 'Daily close settlement, liquidity sweep of London session highs/lows, range equilibrium.',
  };

  const handleStartEditSession = (sess: TradingSession) => {
    playModalOpen();
    setEditingSessionId(sess.id);
    const localStart = getLocalFromUtc(sess.utcStartHour, sess.utcStartMinute);
    const localEnd = getLocalFromUtc(sess.utcEndHour, sess.utcEndMinute);
    setEditForm({
      startHour12: localStart.localHour12,
      startMinute: localStart.localMinute,
      startPeriod: localStart.period,
      endHour12: localEnd.localHour12,
      endMinute: localEnd.localMinute,
      endPeriod: localEnd.period,
    });
  };

  const handleSaveSession = (id: string) => {
    let localStart24 = editForm.startHour12 % 12;
    if (editForm.startPeriod === 'PM') localStart24 += 12;

    let localEnd24 = editForm.endHour12 % 12;
    if (editForm.endPeriod === 'PM') localEnd24 += 12;

    const utcStart = getUtcFromLocal(localStart24, editForm.startMinute);
    const utcEnd = getUtcFromLocal(localEnd24, editForm.endMinute);

    const updated = sessions.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          utcStartHour: utcStart.utcHour,
          utcStartMinute: utcStart.utcMinute,
          utcEndHour: utcEnd.utcHour,
          utcEndMinute: utcEnd.utcMinute,
        };
      }
      return s;
    });

    playSuccessChime();
    setSessions(updated);
    saveTradingSessions(updated);
    setEditingSessionId(null);
    toast.success('Session Updated', 'Updated trading session window in local time.');
  };

  const handleResetSessions = () => {
    playDangerAction();
    const defaults = resetTradingSessions();
    setSessions(defaults);
    setEditingSessionId(null);
    toast.info('Sessions Restored', 'Restored default trading session windows.');
  };

  // Export JSON Full Backup
  const handleExportJSON = () => {
    try {
      const json = createSystemBackupJson(strategies, allTrades);
      const filename = `TradeGate_Crypto_Backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(json, filename, 'application/json');
      playSuccessChime();
      toast.success('Backup Exported', `Saved ${strategies.length} profiles and ${allTrades.length} trades.`);
    } catch (err: unknown) {
      toast.error('Export Error', getErrorMessage(err));
    }
  };

  // Export CSV Journal
  const handleExportCSV = () => {
    try {
      const csv = exportTradesToCSV(allTrades);
      const filename = `TradeGate_Crypto_Journal_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csv, filename, 'text/csv');
      playSuccessChime();
      toast.success('CSV Exported', `Exported ${allTrades.length} trade records.`);
    } catch (err: unknown) {
      toast.error('CSV Error', getErrorMessage(err));
    }
  };

  // File Upload handler for JSON Restore
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseSystemBackupJson(content);
        await onImportBackup(parsed);
        playSuccessChime();
        toast.success(
          'Backup Restored',
          `Imported ${parsed.strategies.length} strategies and ${parsed.trades.length} trades.`
        );
      } catch (err: unknown) {
        toast.error('Import Failed', getErrorMessage(err));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Reset to default sample crypto data
  const handleResetSampleData = async () => {
    try {
      playDangerAction();
      await onResetAllData();
      toast.success('System Reset', 'Restored default crypto profiles & sample trades.');
    } catch (err: unknown) {
      toast.error('Reset Failed', getErrorMessage(err));
    }
  };

  // Clear all trades
  const handleClearTrades = async () => {
    try {
      playDangerAction();
      await onClearAllTrades();
      toast.success('Ledger Cleared', 'All trade records deleted.');
    } catch (err: unknown) {
      toast.error('Clear Failed', getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary text-balance">Settings</h2>
        <p className="text-xs text-text-secondary mt-1 text-pretty max-w-prose">
          Manage currency preferences, local-first data backups, and liquidity window references.
        </p>
      </div>

      {/* SECTION 1: CURRENCY & MONEY SYMBOL */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-text-primary text-balance">Account Currency & Money Symbol</h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand/15 text-brand inline-flex items-center gap-1.5">
              Active: {isCryptoCurrency(selectedCurrency) ? <CryptoIcon symbol={selectedCurrency} size="xs" /> : <CircleFlag country={selectedCurrency} size="xs" />} {selectedCurrency}
            </span>
          </div>
          <span className="text-[10px] text-text-muted hidden sm:inline">
            Global Journal & Gate Symbol
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed text-pretty">
            Choose your preferred currency symbol for your journal, account balances, risk sizing, and performance analytics (e.g. <strong>$ USD</strong>, <strong>₱ PHP</strong>, <strong>€ EUR</strong>, <strong>£ GBP</strong>, <strong>¥ JPY</strong>, etc.).
          </p>

          {/* Currency Selection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-2">
            {SUPPORTED_CURRENCIES.map((c) => {
              const isSelected = selectedCurrency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectCurrency(c.code)}
                  disabled={isSavingCurrency}
                  className={`p-2.5 rounded-xl text-left transition-all flex flex-col justify-between gap-1 active:scale-[0.98] ${isSelected
                    ? 'bg-brand/15 border border-brand/60 ring-1 ring-brand/30 shadow-xs'
                    : 'bg-canvas border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary'
                    } ${isSavingCurrency ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    {c.type === 'crypto' ? (
                      <div className="flex items-center gap-1.5">
                        <CryptoIcon symbol={c.code} size="xs" />
                        <span className="font-mono font-bold text-xs text-text-primary">
                          {c.code === 'BTC' ? 'Bitcoin' : c.symbol}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <CircleFlag country={c.code} size="xs" />
                        <span className="font-mono font-black text-sm text-brand">{c.symbol}</span>
                      </div>
                    )}
                    <span className="text-[10px] font-bold font-mono uppercase text-text-muted flex items-center gap-1">
                      {isSelected && <Check className="w-3 h-3 text-brand" />}
                      {c.code}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-medium text-text-secondary truncate">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Converted Preview & Active Status */}
          {
            (() => {
              const previewBalance = convertCurrency(100000, 'USD', selectedCurrency);
              const previewPnl = convertCurrency(2450, 'USD', selectedCurrency);
              const previewRisk = convertCurrency(500, 'USD', selectedCurrency);
              const isCrypto = isCryptoCurrency(selectedCurrency);

              return (
                <div className="p-3.5 rounded-xl bg-canvas border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Live Converted Preview</span>
                    <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                      <span className="font-bold text-text-primary text-sm inline-flex items-center gap-1">
                        {isCrypto ? (
                          <>
                            <CryptoIcon symbol={selectedCurrency} size="xs" />
                            <span>{formatNumberOnly(previewBalance, selectedCurrency)}</span>
                          </>
                        ) : (
                          <span>{formatCurrencyAmount(previewBalance, selectedCurrency)}</span>
                        )}
                      </span>
                      <span className="text-text-muted">•</span>
                      <span className="text-trade-green font-bold inline-flex items-center gap-1">
                        {isCrypto ? (
                          <>
                            <CryptoIcon symbol={selectedCurrency} size="xs" />
                            <span>+{formatNumberOnly(previewPnl, selectedCurrency)} PnL</span>
                          </>
                        ) : (
                          <span>+{formatCurrencyAmount(previewPnl, selectedCurrency)} PnL</span>
                        )}
                      </span>
                      <span className="text-text-muted">•</span>
                      <span className="text-rose-400 font-bold inline-flex items-center gap-1">
                        {isCrypto ? (
                          <>
                            <CryptoIcon symbol={selectedCurrency} size="xs" />
                            <span>-{formatNumberOnly(previewRisk, selectedCurrency)} Risk</span>
                          </>
                        ) : (
                          <span>-{formatCurrencyAmount(previewRisk, selectedCurrency)} Risk</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSavingCurrency ? (
                      <span className="text-xs font-semibold text-brand flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
                        Auto-converting balances...
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-brand" />
                        Active Currency: <strong className="text-text-primary font-mono">{selectedCurrency}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
        </div>
      </section>

      {/* SECTION 2: BACKUP & EXPORT */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Database className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-bold text-text-primary text-balance">Backup & Data</h3>
        </div>

        <div className="divide-y divide-border/60">
          {/* JSON Full Snapshot Row */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-primary">Full Workspace JSON Snapshot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand/10 text-brand">
                  {strategies.length} profiles • {allTrades.length} trades
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5 text-pretty">
                Complete offline backup of your strategies, checklists, balances, and journal entries.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportJSON}
                className="py-1.5 px-3 rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-primary font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-text-muted" />
                Export JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-3 rounded-xl bg-brand text-black font-semibold text-xs hover:bg-brand-hover flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Import Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* CSV Export Row */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-text-primary">Spreadsheet Ledger (CSV)</span>
              <p className="text-[11px] text-text-muted mt-0.5 text-pretty">
                Export trade records formatted for Excel, Google Sheets, or portfolio accounting tools.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="py-1.5 px-3 rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-primary font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              Export CSV ({allTrades.length})
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: TRADING SESSIONS (EDITABLE, 12-HOUR AM/PM FORMAT) */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-text-primary text-balance">Trading Sessions</h3>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand hidden sm:inline">
              Auto-detected Local Time
            </span>
          </div>
          <button
            onClick={handleResetSessions}
            title="Restore default session hours"
            className="text-[11px] font-semibold text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset Sessions
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sessions.map((sess) => {
            const isEditing = editingSessionId === sess.id;
            return isEditing ? (
              <div
                key={sess.id}
                className="p-3.5 rounded-xl bg-canvas border border-brand/50 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getSessionStyle(sess.name).dot}`} />
                    <span className="font-bold text-xs text-text-primary">Edit {sess.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-brand font-semibold">Local Time (12h)</span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1 font-semibold uppercase tracking-wider">Start Time</label>
                    <div className="flex items-center gap-1.5">
                      <AnimatedSelect
                        value={editForm.startHour12}
                        onChange={(val) => setEditForm({ ...editForm, startHour12: val })}
                        options={SESSION_HOUR_OPTIONS}
                        className="px-2 py-1 text-xs font-mono font-bold min-w-[50px] justify-between"
                        dropdownClassName="w-20 min-w-[72px] max-h-48"
                      />
                      <span className="font-bold text-text-muted">:</span>
                      <AnimatedSelect
                        value={editForm.startMinute}
                        onChange={(val) => setEditForm({ ...editForm, startMinute: val })}
                        options={SESSION_MINUTE_OPTIONS}
                        className="px-2 py-1 text-xs font-mono font-bold min-w-[50px] justify-between"
                        dropdownClassName="w-20 min-w-[72px] max-h-48"
                      />
                      <AnimatedSelect
                        value={editForm.startPeriod}
                        onChange={(val) => setEditForm({ ...editForm, startPeriod: val })}
                        options={SESSION_PERIOD_OPTIONS}
                        className="px-2 py-1 text-xs font-mono font-bold min-w-[58px] justify-between"
                        dropdownClassName="w-20 min-w-[72px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-text-muted mb-1 font-semibold uppercase tracking-wider">End Time</label>
                    <div className="flex items-center gap-1.5">
                      <AnimatedSelect
                        value={editForm.endHour12}
                        onChange={(val) => setEditForm({ ...editForm, endHour12: val })}
                        options={SESSION_HOUR_OPTIONS}
                        className="px-2 py-1 text-xs font-mono font-bold min-w-[50px] justify-between"
                        dropdownClassName="w-20 min-w-[72px] max-h-48"
                      />
                      <span className="font-bold text-text-muted">:</span>
                      <AnimatedSelect
                        value={editForm.endMinute}
                        onChange={(val) => setEditForm({ ...editForm, endMinute: val })}
                        options={SESSION_MINUTE_OPTIONS}
                        className="px-2 py-1 text-xs font-mono font-bold min-w-[50px] justify-between"
                        dropdownClassName="w-20 min-w-[72px] max-h-48"
                      />
                      <AnimatedSelect
                        value={editForm.endPeriod}
                        onChange={(val) => setEditForm({ ...editForm, endPeriod: val })}
                        options={SESSION_PERIOD_OPTIONS}
                        className="px-2 py-1 text-xs font-mono font-bold min-w-[58px] justify-between"
                        dropdownClassName="w-20 min-w-[72px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => {
                      playModalClose();
                      setEditingSessionId(null);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveSession(sess.id)}
                    className="px-3 py-1 rounded-lg bg-brand text-black font-bold text-xs hover:bg-brand-hover shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Window
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={sess.id}
                className="p-3.5 rounded-xl bg-canvas border border-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getSessionStyle(sess.name).dot}`} />
                      <span className="font-semibold text-xs text-text-primary">{sess.name}</span>
                    </div>
                      <span className={`text-[11px] font-mono font-bold tabular-nums px-2 py-0.5 rounded ${getSessionStyle(sess.name).badge}`}>
                        {formatSessionLocalRange(sess)}
                      </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed text-pretty">
                    {sessionDescriptions[sess.id] || ''}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-border flex justify-end">
                  <button
                    onClick={() => handleStartEditSession(sess)}
                    className="text-[11px] font-semibold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" /> Edit Session
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: DANGER ZONE */}
      <section className="bg-card border border-rose-500/20 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Trash2 className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold text-rose-500 text-balance">Danger Zone</h3>
        </div>

        <div className="divide-y divide-border/60">
          {/* Reset Profiles Row */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-text-primary">Reset Default Strategies</span>
              <p className="text-[11px] text-text-muted mt-0.5 text-pretty">
                Restores the 4 pre-seeded crypto strategy profiles and default sample trades.
              </p>
            </div>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              aria-label="Reset default strategy profiles and sample data"
              className="py-1.5 px-3 rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-primary font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
              Reset Default Profiles
            </button>
          </div>

          {/* Wipe Trades Row */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-rose-400">Clear All Trade Records</span>
              <p className="text-[11px] text-text-muted mt-0.5 text-pretty">
                Permanently wipes all journaled trades. Strategy profiles, balances, and rules are retained.
              </p>
            </div>
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              aria-label="Permanently delete all journal trade records"
              className="py-1.5 px-3 rounded-xl bg-rose-500/12 border border-rose-500/25 text-rose-400 font-semibold text-xs hover:bg-rose-500 hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Trade Records
            </button>
          </div>
        </div>
      </section>

      {/* Reset System Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetSampleData}
        title="Reset to Default Strategies?"
        description="This will restore the 4 default crypto strategy profiles and sample journal entries. Any custom strategies or unsaved settings will be overwritten. This action cannot be undone."
        confirmButtonText="Reset Everything"
      />

      {/* Clear All Trades Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearTrades}
        title="Clear All Trade Records?"
        description="Permanently delete all trade records? This will clear all entries from your journal and reset your performance equity curve. Your strategy profiles, checklist rules, and account balances will remain intact. This action cannot be undone."
        confirmButtonText="Clear All Trades"
      />
    </div>
  );
};
