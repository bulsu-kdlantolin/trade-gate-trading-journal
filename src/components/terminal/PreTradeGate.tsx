import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StrategyProfile, SessionTag } from '../../types/strategy';
import { getErrorMessage } from '../../utils/errors';
import {
  TradeDirection,
  MarginType,
  SpotAction,
  VenueCustodyTag,
  TradeRecord,
  TradeGrade,
  ExecutionErrorTag,
  CheckedRuleState,
  FuturesTradeRecord,
  SpotTradeRecord,
  TradeResult,
} from '../../types/trade';
import { TradeEntryForm } from './TradeEntryForm';
import { compressImageFile } from '../../utils/imageCompressor';
import { calculateFuturesMetrics, calculateSpotMetrics } from '../../utils/cryptoMath';
import { getCurrentActiveSession } from '../../utils/sessionClock';
import { getGradeStyle } from '../../utils/gradeStyles';
import { getCurrencySymbol, isCryptoCurrency, formatNumberOnly } from '../../utils/currency';
import { CryptoIcon } from '../common/CryptoIcon';
import { StrategyLogo } from '../common/StrategyLogo';
import { CurrencyBadge } from '../common/CurrencyDisplay';
import { getRuleCategoryStyle, SESSION_STYLES } from '../../utils/badgeStyles';
import {
  playGateUnlockSound,
  playGateLockSound,
  playTradeLoggedSound,
  playCheckboxTick,
  playMicroTick,
  playDangerAction,
} from '../../utils/audioTelemetry';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  CheckSquare,
  Square,
  Lock,
  Unlock,
  Upload,
  Link as LinkIcon,
  X,
  ZoomIn,
  Send,
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  Check,
  Key,
  Sliders,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PreTradeGateProps {
  strategy: StrategyProfile | null;
  liveBalance: number;
  onTradeLogged: (trade: TradeRecord) => Promise<unknown>;
  onNavigateToProfiles: () => void;
  isActive?: boolean;
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

export const PreTradeGate: React.FC<PreTradeGateProps> = React.memo(({
  strategy,
  liveBalance,
  onTradeLogged,
  onNavigateToProfiles,
  isActive = true,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currencySymbol = getCurrencySymbol(strategy?.baseCurrency);

  // 1. Trade Execution Type
  const [activeExecutionType, setActiveExecutionType] = useState<'futures' | 'spot'>(() => {
    return strategy?.executionMode === 'spot' ? 'spot' : 'futures';
  });

  useEffect(() => {
    if (strategy) {
      setActiveExecutionType(strategy.executionMode === 'spot' ? 'spot' : 'futures');
    }
  }, [strategy?.id, strategy?.executionMode]);

  // 2. Futures Mode State
  const [futuresSymbol, setFuturesSymbol] = useState<string>('BTCUSDT.P');
  const [direction, setDirection] = useState<TradeDirection>('Long');
  const [leverage, setLeverage] = useState<number>(20);
  const [marginType, setMarginType] = useState<MarginType>('Cross');
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(0);
  const [riskPercentage, setRiskPercentage] = useState<number>(strategy?.defaultRiskValue || 1.0);

  // 3. Spot Mode State
  const [spotSymbol, setSpotSymbol] = useState<string>('SOL');
  const [spotAction, setSpotAction] = useState<SpotAction>('BUY / ACCUMULATE');
  const [spotEntryPrice, setSpotEntryPrice] = useState<number>(0);
  const [spotAllocation, setSpotAllocation] = useState<number>(1000);
  const [spotTargetSellPrice, setSpotTargetSellPrice] = useState<number>(0);
  const [spotStopLossPrice, setSpotStopLossPrice] = useState<number>(0);
  const [spotVenue, setSpotVenue] = useState<VenueCustodyTag>('Binance');

  // 4. Checklist Checked State (keyed by rule id)
  const [checkedRules, setCheckedRules] = useState<Record<string, boolean>>({});

  // 5. Outcome State: Active (Open) vs Closed Win/Loss/BE
  const [entryOutcome, setEntryOutcome] = useState<'Active' | 'Win' | 'Loss' | 'Breakeven'>('Active');
  const [exitPriceInput, setExitPriceInput] = useState<number>(0);

  // 6. Metadata
  const [timeframe, setTimeframe] = useState<string>(strategy?.timeframes[0] || '15m');
  const [session, setSession] = useState<string>(() => {
    const active = getCurrentActiveSession();
    if (active && strategy?.sessions.includes(active.name as SessionTag)) {
      return active.name;
    }
    return strategy?.sessions[0] || 'London';
  });
  const [selectedErrors, setSelectedErrors] = useState<ExecutionErrorTag[]>(['None']);
  const [notes, setNotes] = useState<string>('');

  // 7. Screenshot & Modal States
  const [screenshotUrlInput, setScreenshotUrlInput] = useState<string>('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [justCommittedId, setJustCommittedId] = useState<string | null>(null);

  // Pre-Trade Gate Clearance Modal state (locked like a real gate until keys/checklist entered)
  const [isGateModalOpen, setIsGateModalOpen] = useState<boolean>(true);
  const [gateUnlockedDismissed, setGateUnlockedDismissed] = useState<boolean>(false);

  // Storage key generator for safe draft persistence
  const getDraftStorageKey = (strategyId?: string) => `tradegate_draft_${strategyId || 'default'}`;

  // Restore draft or initialize defaults when strategy profile changes
  useEffect(() => {
    if (!strategy) return;

    try {
      const savedDraft = localStorage.getItem(getDraftStorageKey(strategy.id));
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.activeExecutionType) {
          if (strategy.executionMode === 'futures') {
            setActiveExecutionType('futures');
          } else if (strategy.executionMode === 'spot') {
            setActiveExecutionType('spot');
          } else {
            setActiveExecutionType(parsed.activeExecutionType);
          }
        }
        if (parsed.futuresSymbol) setFuturesSymbol(parsed.futuresSymbol);
        if (parsed.direction) setDirection(parsed.direction);
        if (typeof parsed.leverage === 'number') setLeverage(parsed.leverage);
        if (parsed.marginType) setMarginType(parsed.marginType);
        if (typeof parsed.entryPrice === 'number') setEntryPrice(parsed.entryPrice);
        if (typeof parsed.stopLossPrice === 'number') setStopLossPrice(parsed.stopLossPrice);
        if (typeof parsed.takeProfitPrice === 'number') setTakeProfitPrice(parsed.takeProfitPrice);
        if (typeof parsed.riskPercentage === 'number') setRiskPercentage(parsed.riskPercentage);
        if (parsed.spotSymbol) setSpotSymbol(parsed.spotSymbol);
        if (parsed.spotAction) setSpotAction(parsed.spotAction);
        if (typeof parsed.spotEntryPrice === 'number') setSpotEntryPrice(parsed.spotEntryPrice);
        if (typeof parsed.spotAllocation === 'number') setSpotAllocation(parsed.spotAllocation);
        if (typeof parsed.spotTargetSellPrice === 'number') setSpotTargetSellPrice(parsed.spotTargetSellPrice);
        if (typeof parsed.spotStopLossPrice === 'number') setSpotStopLossPrice(parsed.spotStopLossPrice);
        if (parsed.spotVenue) setSpotVenue(parsed.spotVenue);
        if (parsed.timeframe) setTimeframe(parsed.timeframe);
        if (parsed.session) setSession(parsed.session);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.checkedRules) setCheckedRules(parsed.checkedRules);
        return;
      }
    } catch {
      // Fallback to fresh defaults if JSON parse fails
    }

    // Default initialization when no draft exists
    setCheckedRules({});
    setEntryPrice(0);
    setStopLossPrice(0);
    setTakeProfitPrice(0);
    setSpotEntryPrice(0);
    setSpotTargetSellPrice(0);
    setSpotStopLossPrice(0);
    setExitPriceInput(0);
    setEntryOutcome('Active');
    setScreenshotData(null);
    setScreenshotUrlInput('');
    setNotes('');
    setRiskPercentage(strategy.defaultRiskValue || 1.0);
    setTimeframe(strategy.timeframes[0] || '15m');
    const active = getCurrentActiveSession();
    if (active && strategy.sessions.includes(active.name as SessionTag)) {
      setSession(active.name);
    } else {
      setSession(strategy.sessions[0] || 'London');
    }
    setActiveExecutionType(strategy.executionMode === 'spot' ? 'spot' : 'futures');
  }, [strategy?.id]);

  // Persist trade plan draft on change (debounced 300ms)
  useEffect(() => {
    if (!strategy) return;
    const timer = setTimeout(() => {
      const draft = {
        activeExecutionType,
        futuresSymbol,
        direction,
        leverage,
        marginType,
        entryPrice,
        stopLossPrice,
        takeProfitPrice,
        riskPercentage,
        spotSymbol,
        spotAction,
        spotEntryPrice,
        spotAllocation,
        spotTargetSellPrice,
        spotStopLossPrice,
        spotVenue,
        timeframe,
        session,
        notes,
        checkedRules,
      };
      if (
        entryPrice > 0 ||
        stopLossPrice > 0 ||
        spotEntryPrice > 0 ||
        Object.keys(checkedRules).length > 0 ||
        notes.trim().length > 0
      ) {
        try {
          localStorage.setItem(getDraftStorageKey(strategy.id), JSON.stringify(draft));
        } catch {
          // Ignore localStorage quota errors
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    strategy?.id,
    activeExecutionType,
    futuresSymbol,
    direction,
    leverage,
    marginType,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    riskPercentage,
    spotSymbol,
    spotAction,
    spotEntryPrice,
    spotAllocation,
    spotTargetSellPrice,
    spotStopLossPrice,
    spotVenue,
    timeframe,
    session,
    notes,
    checkedRules,
  ]);

  const handleClearDraft = () => {
    if (!strategy) return;
    playDangerAction();
    try {
      localStorage.removeItem(getDraftStorageKey(strategy.id));
    } catch { }
    setCheckedRules({});
    setEntryPrice(0);
    setStopLossPrice(0);
    setTakeProfitPrice(0);
    setSpotEntryPrice(0);
    setSpotTargetSellPrice(0);
    setSpotStopLossPrice(0);
    setExitPriceInput(0);
    setEntryOutcome('Active');
    setScreenshotData(null);
    setScreenshotUrlInput('');
    setNotes('');
    toast.info('Draft Cleared', 'Trade planning parameters have been reset.');
  };

  // Derived Checklist Scoring & Grade
  const {
    mandatoryPassed,
    uncheckedMandatoryRules,
    totalMandatoryCount,
    checkedMandatoryCount,
    confluenceScore,
    maxConfluenceScore,
    setupGrade,
  } = useMemo(() => {
    if (!strategy) {
      return {
        mandatoryPassed: false,
        uncheckedMandatoryRules: [],
        totalMandatoryCount: 0,
        checkedMandatoryCount: 0,
        confluenceScore: 0,
        maxConfluenceScore: 0,
        setupGrade: 'C' as TradeGrade,
      };
    }

    const rules = strategy.rules;
    const unchecked: string[] = [];
    let score = 0;
    let maxScore = 0;

    rules.forEach((rule) => {
      const isTicked = !!checkedRules[rule.id];
      if (rule.type === 'Mandatory') {
        if (!isTicked) unchecked.push(rule.label);
      } else {
        maxScore += rule.weight;
        if (isTicked) score += rule.weight;
      }
    });

    const totalMandatory = rules.filter((r) => r.type === 'Mandatory').length;
    const checkedMandatory = totalMandatory - unchecked.length;
    const isAllMandatory = unchecked.length === 0;

    let grade: TradeGrade = 'C';
    if (!isAllMandatory) {
      grade = 'C';
    } else if (score >= strategy.minConfluenceForGradeA) {
      grade = 'A+';
    } else if (score >= strategy.minConfluenceForGradeB) {
      grade = 'A';
    } else {
      grade = 'B';
    }

    return {
      mandatoryPassed: isAllMandatory,
      uncheckedMandatoryRules: unchecked,
      totalMandatoryCount: totalMandatory,
      checkedMandatoryCount: checkedMandatory,
      confluenceScore: score,
      maxConfluenceScore: maxScore,
      setupGrade: grade,
    };
  }, [strategy, checkedRules]);

  const allRulesChecked =
    strategy && strategy.rules.length > 0 && strategy.rules.every((r) => !!checkedRules[r.id]);

  const handleToggleAllRules = () => {
    if (!strategy || strategy.rules.length === 0) return;
    if (allRulesChecked) {
      playDangerAction();
      setCheckedRules({});
      toast.error('Checklist Cleared', 'All rules unchecked.');
    } else {
      playGateUnlockSound();
      const all: Record<string, boolean> = {};
      strategy.rules.forEach((r) => {
        all[r.id] = true;
      });
      setCheckedRules(all);
      toast.success('Checklist Complete', 'All rules checked.');
    }
  };

  const toggleRuleCheck = (ruleId: string) => {
    playCheckboxTick();
    setCheckedRules((prev) => {
      const willBeTicked = !prev[ruleId];
      const next = { ...prev, [ruleId]: willBeTicked };
      if (strategy) {
        const mandatoryRules = strategy.rules.filter((r) => r.type === 'Mandatory');
        const wasUnlocked = mandatoryRules.every((r) => !!prev[r.id]);
        const nowUnlocked = mandatoryRules.every((r) => !!next[r.id]);
        if (!wasUnlocked && nowUnlocked) {
          playGateUnlockSound();
        } else if (wasUnlocked && !nowUnlocked) {
          playGateLockSound();
        }
      }
      return next;
    });
  };

  const handleUnlockAndEnter = () => {
    if (!mandatoryPassed && uncheckedMandatoryRules.length > 0) {
      toast.error('Gate Locked', `Please complete all ${uncheckedMandatoryRules.length} mandatory rule(s) first.`);
      return;
    }
    playGateUnlockSound();
    setIsGateModalOpen(false);
    setGateUnlockedDismissed(true);
    toast.success('Pre-Trade Gate Cleared', `${setupGrade} Setup Unlocked • Confluence: ${confluenceScore}/${maxConfluenceScore} pts`);
  };

  const handleOverrideGate = () => {
    playGateUnlockSound();
    setIsGateModalOpen(false);
    setGateUnlockedDismissed(true);
    toast.warning('Gate Bypassed as Violation', 'This trade will be recorded as a Grade C Discipline Violation.');
  };

  const toggleExecutionError = (tag: ExecutionErrorTag) => {
    playMicroTick();
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

  // Clipboard Paste handler for chart screenshots
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isActive) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            if (file.size > 15 * 1024 * 1024) {
              toast.error('File Too Large', 'Pasted image exceeds 15MB limit.');
              return;
            }
            try {
              const compressed = await compressImageFile(file);
              setScreenshotData(compressed);
              toast.success('Screenshot Attached', 'Pasted image from clipboard.');
            } catch (err: unknown) {
              toast.error('Image Error', getErrorMessage(err));
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isActive, toast]);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File Too Large', 'Maximum screenshot size is 15MB.');
        e.target.value = '';
        return;
      }
      try {
        const compressed = await compressImageFile(file);
        setScreenshotData(compressed);
        toast.success('Screenshot Attached', 'Chart screenshot uploaded.');
      } catch (err: unknown) {
        toast.error('Upload Error', getErrorMessage(err));
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    const trimmed = screenshotUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      toast.warning('Invalid Image URL', 'Please enter a valid HTTP, HTTPS, or data image URL.');
      return;
    }
    setScreenshotData(trimmed);
    toast.success('Image Attached', 'Applied image URL.');
  };

  // Submit Trade (with optional forceOverride for intentional rule violations)
  const executeLogTrade = async (forceOverride = false) => {
    if (!strategy) return;

    if (!mandatoryPassed && !forceOverride) {
      toast.warning('Gate Locked', 'Satisfy all REQUIRED checklist rules on the left to unlock.');
      return;
    }

    const checkedRuleStates: CheckedRuleState[] = strategy.rules.map((r) => ({
      ruleId: r.id,
      ruleLabel: r.label,
      isMandatory: r.type === 'Mandatory',
      weight: r.weight,
      isTicked: !!checkedRules[r.id],
    }));

    const commonData = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      entryTimestamp: new Date().toISOString(),
      strategyId: strategy.id,
      strategyName: strategy.name,
      executionMode: 'LiveGate' as const,
      accountBalance: liveBalance,
      checkedRules: checkedRuleStates,
      mandatoryRulesPassed: mandatoryPassed,
      confluenceScore,
      maxConfluenceScore,
      setupGrade: forceOverride && !mandatoryPassed ? ('C' as TradeGrade) : setupGrade,
      timeframe,
      session,
      executionErrors:
        forceOverride && !mandatoryPassed && !selectedErrors.includes('Impulse Trade')
          ? [...selectedErrors.filter((e) => e !== 'None'), 'Impulse Trade' as ExecutionErrorTag]
          : selectedErrors,
      notes,
      screenshotUrl: screenshotData || undefined,
    };

    const isClosedNow = entryOutcome !== 'Active';
    const tradeResult: TradeResult | undefined =
      entryOutcome === 'Win' ? 'Win' : entryOutcome === 'Loss' ? 'Loss' : entryOutcome === 'Breakeven' ? 'Breakeven' : undefined;

    let pnlDollar: number | undefined;
    let pnlR: number | undefined;
    let pnlPercentage: number | undefined;

    setIsSubmitting(true);
    try {
      if (activeExecutionType === 'futures') {
        const metrics = calculateFuturesMetrics({
          accountBalance: liveBalance,
          riskPercentage,
          entryPrice,
          stopLossPrice,
          takeProfitPrice,
          leverage,
          direction,
          marginType,
        });

        if (!metrics.isValid) {
          toast.error('Validation Error', metrics.errorMessage || 'Check entry and SL prices.');
          setIsSubmitting(false);
          return;
        }

        const effectiveExitPrice =
          exitPriceInput > 0
            ? exitPriceInput
            : isClosedNow
              ? entryOutcome === 'Win'
                ? takeProfitPrice
                : entryOutcome === 'Loss'
                  ? stopLossPrice
                  : entryPrice
              : undefined;

        if (isClosedNow && effectiveExitPrice) {
          const priceDiff = direction === 'Long' ? effectiveExitPrice - entryPrice : entryPrice - effectiveExitPrice;
          pnlDollar = Number((priceDiff * metrics.positionSizeTokens).toFixed(2));
          pnlR = metrics.riskAmountDollar > 0 ? Number((pnlDollar / metrics.riskAmountDollar).toFixed(2)) : 0;
          pnlPercentage = Number(((pnlDollar / liveBalance) * 100).toFixed(2));
        }

        const futuresRecord: FuturesTradeRecord = {
          ...commonData,
          exitTimestamp: isClosedNow ? new Date().toISOString() : undefined,
          status: isClosedNow ? 'Closed' : 'Open',
          tradeType: 'futures',
          symbol: futuresSymbol,
          direction,
          leverage,
          marginType,
          entryPrice,
          stopLossPrice,
          takeProfitPrice,
          exitPrice: effectiveExitPrice,
          riskPercentage,
          riskAmountDollar: metrics.riskAmountDollar,
          calculatedPositionSize: metrics.positionSizeTokens,
          notionalValue: metrics.notionalPositionDollar,
          estLiquidationPrice: metrics.estLiquidationPrice,
          riskRewardRatio: metrics.targetRiskReward,
          pnlDollar,
          pnlR,
          pnlPercentage,
          tradeResult,
        };

        await onTradeLogged(futuresRecord);
      } else {
        const metrics = calculateSpotMetrics({
          accountBalance: liveBalance,
          allocationDollar: spotAllocation,
          entryPrice: spotEntryPrice,
          targetSellPrice: spotTargetSellPrice,
          stopLossPrice: spotStopLossPrice,
          spotAction,
        });

        if (!metrics.isValid) {
          toast.error('Validation Error', metrics.errorMessage || 'Check entry and allocation.');
          setIsSubmitting(false);
          return;
        }

        const effectiveExitPrice =
          exitPriceInput > 0
            ? exitPriceInput
            : isClosedNow
              ? entryOutcome === 'Win'
                ? spotTargetSellPrice
                : spotEntryPrice
              : undefined;

        if (isClosedNow && effectiveExitPrice) {
          const returnRatio = (effectiveExitPrice - spotEntryPrice) / spotEntryPrice;
          pnlDollar = Number((spotAllocation * returnRatio).toFixed(2));
          pnlPercentage = Number((returnRatio * 100).toFixed(2));
          pnlR = metrics.dollarRisk && metrics.dollarRisk > 0 ? Number((pnlDollar / metrics.dollarRisk).toFixed(2)) : 1;
        }

        const spotRecord: SpotTradeRecord = {
          ...commonData,
          exitTimestamp: isClosedNow ? new Date().toISOString() : undefined,
          status: isClosedNow ? 'Closed' : 'Open',
          tradeType: 'spot',
          symbol: spotSymbol,
          spotAction,
          entryPrice: spotEntryPrice,
          allocationDollar: spotAllocation,
          tokenQuantity: metrics.tokenQuantity,
          portfolioWeight: metrics.portfolioWeightPct,
          targetSellPrice: spotTargetSellPrice,
          stopLossPrice: spotStopLossPrice || undefined,
          exitPrice: effectiveExitPrice,
          venueTag: spotVenue,
          projectedRoi: metrics.projectedRoiPct,
          targetMultiple: metrics.targetMultiple,
          riskRewardRatio: metrics.targetRiskReward,
          pnlDollar,
          pnlR,
          pnlPercentage,
          tradeResult,
        };

        await onTradeLogged(spotRecord);
      }

      setJustCommittedId(commonData.id);
      setTimeout(() => setJustCommittedId(null), 1800);
      playTradeLoggedSound();
      const safePnl = pnlDollar ?? 0;
      const formattedPnlToast = isCryptoCurrency(strategy?.baseCurrency)
        ? `${safePnl >= 0 ? '+' : ''}${formatNumberOnly(safePnl, strategy?.baseCurrency)} ${strategy?.baseCurrency}`
        : `${safePnl >= 0 ? '+' : ''}${currencySymbol}${Math.abs(safePnl).toLocaleString()}`;
      toast.success(
        `Trade Logged: ${activeExecutionType === 'futures' ? futuresSymbol : spotSymbol}`,
        `${setupGrade} Setup • ${session} • ${isClosedNow ? `Realized PnL: ${formattedPnlToast}` : 'Active Position'}`
      );

      // Clean up saved draft upon trade commitment
      try {
        localStorage.removeItem(getDraftStorageKey(strategy.id));
      } catch { }

      // Reset all form fields to fresh state & re-lock the gate for next trade
      setCheckedRules({});
      setIsGateModalOpen(true);
      setGateUnlockedDismissed(false);
      setEntryPrice(0);
      setStopLossPrice(0);
      setTakeProfitPrice(0);
      setSpotEntryPrice(0);
      setSpotTargetSellPrice(0);
      setSpotStopLossPrice(0);
      setExitPriceInput(0);
      setEntryOutcome('Active');
      setScreenshotData(null);
      setScreenshotUrlInput('');
      setNotes('');
      setRiskPercentage(strategy.defaultRiskValue || 1.0);
      setSpotAllocation(strategy.riskModel === 'FixedDollar' ? strategy.defaultRiskValue : 1000);
      setSpotVenue('Binance');
      setSelectedErrors(['None']);
      setTimeframe(strategy.timeframes[0] || '15m');
    } catch (err: unknown) {
      toast.error('Logging Failed', getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!strategy) {
    return (
      <div className="card-glass rounded-2xl p-12 text-center max-w-lg mx-auto">
        <ShieldCheck className="w-12 h-12 text-brand mx-auto mb-3 opacity-80" />
        <h3 className="text-base font-bold text-text-primary mb-1">Select or Create a Trading Strategy</h3>
        <p className="text-xs text-text-secondary mb-5 leading-relaxed">
          The Pre-Trade Gate requires an active strategy profile to calculate risk limits, enforce mandatory execution rules, and compute confluence grades before orders can be logged.
        </p>
        <button
          onClick={onNavigateToProfiles}
          className="px-4 py-2 rounded-xl bg-brand text-black font-bold text-xs hover:bg-brand-hover transition-all"
        >
          Open Strategy Profiles
        </button>
      </div>
    );
  }

  const isFormUnlocked = (strategy.rules.length === 0) || mandatoryPassed || gateUnlockedDismissed;
  const isUnlocked = mandatoryPassed || gateUnlockedDismissed;
  const totalRulesCount = strategy.rules.length;
  const checkedRulesCount = strategy.rules.filter((r) => !!checkedRules[r.id]).length;

  return (
    <div className="relative space-y-4 min-h-[calc(100vh-140px)]">
      {/* ─── MANDATORY PRE-TRADE GATE CHECKLIST MODAL (SCOPED TO JOURNAL & GATE PAGE) ─── */}
      {isGateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pre-Trade Discipline Gate Checklist"
          className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-canvas/35 dark:bg-canvas/40 backdrop-blur-md rounded-2xl sm:rounded-3xl"
          onClick={(e) => {
            if (e.target === e.currentTarget && (mandatoryPassed || gateUnlockedDismissed)) {
              setIsGateModalOpen(false);
            }
          }}
        >
          <div
            className={`card-glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-2xl border-2 shadow-2xl relative max-h-[85vh] flex flex-col transition-colors duration-200 ${
              mandatoryPassed
                ? 'border-emerald-500/50 shadow-emerald-500/10'
                : 'border-brand/40 shadow-brand/10'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                    mandatoryPassed
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-brand/15 border-brand/30 text-brand'
                  }`}
                >
                  {mandatoryPassed ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5 animate-pulse" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StrategyLogo strategy={strategy} size="xs" className="shrink-0" />
                    <h3 className="text-sm font-bold text-text-primary truncate">
                      {strategy.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Pre-Trade Discipline Gate • Mandatory Invalidation Checklist
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  key={setupGrade}
                  className={`font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded-md border ${
                    mandatoryPassed
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-canvas border-border text-text-muted'
                  }`}
                >
                  {setupGrade} Setup
                </span>

                {(mandatoryPassed || gateUnlockedDismissed) && (
                  <button
                    type="button"
                    onClick={() => setIsGateModalOpen(false)}
                    aria-label="Close checklist"
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card border border-transparent hover:border-border transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div >

  {/* Gate Status & Progress Banner */ }
  < div className = "py-3 shrink-0 space-y-2" >
    <div
      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${mandatoryPassed
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
          : 'bg-canvas border-border text-text-primary'
        }`}
    >
      <div className="flex items-center gap-2 text-xs">
        {mandatoryPassed ? (
          <span className="flex items-center gap-1.5 font-bold text-trade-green">
            <Unlock className="w-4 h-4" /> Gate Cleared &amp; Unlocked
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
            <Lock className="w-4 h-4" /> Gate Locked — Verification Required
          </span>
        )}
        <span className="text-[11px] text-text-muted hidden sm:inline">
          ({checkedMandatoryCount}/{totalMandatoryCount} Mandatory Cleared)
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-text-muted">
          Confluence: <strong className="text-text-primary">{confluenceScore}</strong>/{maxConfluenceScore} pts
        </span>
        <button
          type="button"
          onClick={handleToggleAllRules}
          title={allRulesChecked ? 'Uncheck All Rules' : 'Check All Rules'}
          aria-label={allRulesChecked ? 'Uncheck All Rules' : 'Check All Rules'}
          className={`p-1 rounded-md transition-colors ${allRulesChecked
              ? 'text-trade-green hover:bg-trade-green/10'
              : 'text-text-muted hover:text-text-primary hover:bg-card'
            }`}
        >
          {allRulesChecked ? (
            <CheckCheck className="w-4 h-4 text-trade-green" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>

{/* Progress Bar */ }
{
  strategy.rules.length > 0 && (() => {
    const checkedCount = strategy.rules.filter((r) => !!checkedRules[r.id]).length;
    const totalCount = strategy.rules.length;
    const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
    const progressColor =
      pct === 100
        ? 'bg-emerald-500'
        : pct >= 50
          ? 'bg-orange-500'
          : 'bg-red-500';

    return (
      <div className="w-full bg-card-hover h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${progressColor}`}
          style={{
            width: `${Math.max(checkedCount > 0 ? 4 : 0, pct)}%`,
          }}
        />
      </div>
    );
  })()
}
            </div >

  {/* Checklist Rule Cards List (Scrollable) */ }
  < div className = "space-y-2 overflow-y-auto pr-1 flex-1 min-h-0" >
  {
    strategy.rules.length === 0 ? (
      <div className="py-8 px-4 text-center rounded-xl bg-canvas border border-border space-y-2">
        <ShieldCheck className="w-8 h-8 text-text-muted mx-auto opacity-60" />
        <p className="text-xs font-semibold text-text-primary">No Discipline Rules Configured</p>
        <p className="text-[11px] text-text-muted leading-relaxed">
          This strategy profile has no checklist rules. You can enter the journal directly or add mandatory rules in profiles.
        </p>
        <button
          type="button"
          onClick={onNavigateToProfiles}
          className="mt-1 px-3 py-1.5 rounded-xl bg-card border border-border hover:border-brand/40 text-xs font-semibold text-text-primary dark:text-brand hover:text-brand transition-colors"
        >
          Configure Strategy Rules
        </button>
      </div>
    ) : (
      strategy.rules.map((rule) => {
        const isChecked = !!checkedRules[rule.id];
        const isMandatory = rule.type === 'Mandatory';

        return (
          <div
            key={rule.id}
            role="checkbox"
            aria-checked={isChecked}
            tabIndex={0}
            onClick={() => toggleRuleCheck(rule.id)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggleRuleCheck(rule.id);
              }
            }}
            className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-2.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-card ${isChecked
                ? 'bg-emerald-500/10 border-emerald-500/40 text-text-primary shadow-xs'
                : 'bg-canvas border-border text-text-secondary hover:border-border-muted hover:bg-card-hover'
              }`}
          >
            <span aria-hidden="true" className="mt-0.5 shrink-0 transition-colors pointer-events-none">
              {isChecked ? (
                <CheckSquare className="w-4 h-4 text-trade-green animate-check-pop" />
              ) : (
                <Square className="w-4 h-4 text-text-muted group-hover:text-text-primary" />
              )}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${getRuleCategoryStyle(rule.category)}`}>
                  {rule.category}
                </span>

                {isMandatory ? (
                  <span
                    className={`inline-flex items-center justify-center text-[9.5px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono tracking-wider min-h-[20px] ${isChecked
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                      }`}
                  >
                    REQUIRED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold font-mono text-text-muted">
                    +{rule.weight} {rule.weight === 1 ? 'pt' : 'pts'}
                  </span>
                )}
              </div>

              <p className={`text-xs font-semibold leading-snug text-pretty ${isChecked ? 'text-text-primary' : 'text-text-secondary'}`}>
                {rule.label}
              </p>
            </div>
          </div>
        );
      })
    )
  }
            </div >

  {/* Modal Footer / Unlock Action */ }
  < div className = "pt-3 border-t border-border shrink-0 space-y-2" >
    {!mandatoryPassed && uncheckedMandatoryRules.length > 0 && (
      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[11px] uppercase tracking-wider">Required Invalidation Incomplete</p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Missing: {uncheckedMandatoryRules.slice(0, 2).join(', ')}
            {uncheckedMandatoryRules.length > 2 && ` +${uncheckedMandatoryRules.length - 2} more`}
          </p>
        </div>
      </div>
    )}

<button
  type="button"
  onClick={handleUnlockAndEnter}
  disabled={!mandatoryPassed && strategy.rules.length > 0}
  className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all duration-200 ${mandatoryPassed || strategy.rules.length === 0
      ? 'bg-brand text-black hover:bg-brand-hover cursor-pointer active:scale-[0.99] ring-2 ring-brand/30 shadow-lg'
      : 'bg-card border border-border text-text-muted opacity-50 cursor-not-allowed'
    }`}
>
  {mandatoryPassed || strategy.rules.length === 0 ? (
    <>
      <Key className="w-4 h-4 text-black" />
      <span>Unlock Gate &amp; Enter Journal Form</span>
      <ArrowRight className="w-4 h-4 text-black" />
    </>
  ) : (
    <>
      <Lock className="w-4 h-4" />
      <span>Complete {uncheckedMandatoryRules.length} Required Rule{uncheckedMandatoryRules.length > 1 ? 's' : ''} to Unlock Gate</span>
    </>
  )}
</button>

{
  !mandatoryPassed && strategy.rules.length > 0 && (
    <div className="text-center pt-0.5">
      <button
        type="button"
        onClick={handleOverrideGate}
        className="text-[11px] font-mono text-text-muted hover:text-rose-600 dark:hover:text-rose-400 underline decoration-rose-500/30 hover:decoration-rose-500 transition-colors"
      >
        Override Gate as Discipline Violation (Logs as Grade C Violation)
      </button>
    </div>
  )
}
            </div >
          </div >
        </div >
      )}

    {/* ─── PAGE LEVEL CONTENT: 2-COLUMN JOURNAL FORM ─── */}
    <div className={`space-y-4 ${!isFormUnlocked ? 'pointer-events-none select-none' : ''}`}>
      {/* Top Gate Clearance HUD Bar */}
      <div className="card-glass rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 border border-border">
        <div className="flex items-center gap-3 min-w-0">
          <StrategyLogo strategy={strategy} size="sm" className="shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary truncate">{strategy.name}</h3>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-card border border-border text-text-muted">
                {strategy.executionMode}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
              <span className="flex items-center gap-1 text-trade-green font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-trade-green" /> Gate Cleared &amp; Unlocked
              </span>
              <span>•</span>
              <span className="font-mono">
                Confluence: <strong className="text-text-primary">{confluenceScore}</strong>/{maxConfluenceScore} pts
              </span>
              <span>•</span>
              <span className={`font-mono font-bold ${getGradeStyle(setupGrade).text}`}>
                {setupGrade} Setup
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsGateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:border-brand/40 text-xs font-semibold text-text-primary hover:text-brand transition-all shadow-xs"
          >
            <Key className="w-3.5 h-3.5 text-brand" />
            <span>Review Checklist ({checkedRulesCount}/{totalRulesCount})</span>
          </button>
        </div>
      </div>

      {/* TWO-COLUMN JOURNAL FORM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1: Trade Execution & Financial Math (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card-glass rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Execution &amp; Sizing Parameters
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-card border border-border text-text-secondary uppercase">
                {activeExecutionType === 'futures' ? 'Perpetual Futures' : 'Spot Asset'}
              </span>
            </div>

            <TradeEntryForm
              strategy={strategy}
              activeExecutionType={activeExecutionType}
              setActiveExecutionType={setActiveExecutionType}
              liveBalance={liveBalance}
              futuresSymbol={futuresSymbol}
              setFuturesSymbol={setFuturesSymbol}
              direction={direction}
              setDirection={setDirection}
              leverage={leverage}
              setLeverage={setLeverage}
              marginType={marginType}
              setMarginType={setMarginType}
              entryPrice={entryPrice}
              setEntryPrice={setEntryPrice}
              stopLossPrice={stopLossPrice}
              setStopLossPrice={setStopLossPrice}
              takeProfitPrice={takeProfitPrice}
              setTakeProfitPrice={setTakeProfitPrice}
              riskPercentage={riskPercentage}
              setRiskPercentage={setRiskPercentage}
              spotSymbol={spotSymbol}
              setSpotSymbol={setSpotSymbol}
              spotAction={spotAction}
              setSpotAction={setSpotAction}
              spotEntryPrice={spotEntryPrice}
              setSpotEntryPrice={setSpotEntryPrice}
              spotAllocation={spotAllocation}
              setSpotAllocation={setSpotAllocation}
              spotTargetSellPrice={spotTargetSellPrice}
              setSpotTargetSellPrice={setSpotTargetSellPrice}
              spotStopLossPrice={spotStopLossPrice}
              setSpotStopLossPrice={setSpotStopLossPrice}
              spotVenue={spotVenue}
              setSpotVenue={setSpotVenue}
            />
          </div>
        </div>

        {/* COLUMN 2: Context, Documentation & Submission (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card-glass rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Context, Documentation &amp; Submission
                </h4>
              </div>
              <span
                className={`font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded-md ${getGradeStyle(setupGrade).badge}`}
              >
                {setupGrade} Setup
              </span>
            </div>

            {/* Timeframe & Session Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Chart Timeframe
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-smooth">
                  {strategy.timeframes.map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => {
                        playMicroTick();
                        setTimeframe(tf);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${timeframe === tf
                        ? 'bg-brand text-black shadow-xs'
                        : 'bg-canvas border border-border text-text-secondary hover:text-text-primary'
                        }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Trading Session
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-smooth">
                  {[...strategy.sessions]
                    .sort((a, b) => {
                      const order = ['Asia', 'London', 'NY AM', 'NY PM'];
                      const ia = order.indexOf(a);
                      const ib = order.indexOf(b);
                      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                    })
                    .map((sess) => {
                      const isSelected = session === sess;
                      const styleConfig = SESSION_STYLES[sess] || {
                        active: 'bg-brand text-black font-bold shadow-xs',
                        dot: 'bg-brand',
                      };
                      return (
                        <button
                          key={sess}
                          type="button"
                          onClick={() => {
                            playMicroTick();
                            setSession(sess);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${isSelected
                            ? styleConfig.active
                            : 'bg-canvas border border-border text-text-secondary hover:text-text-primary'
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

            {/* Entry Status & Outcome Selector Row */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-text-secondary">
                Entry Status &amp; Outcome
              </label>
              <div className="relative grid grid-cols-2 sm:grid-cols-4 p-1 bg-canvas rounded-xl border border-border select-none gap-1 sm:gap-0">
                <div
                  className={`hidden sm:block absolute top-1 bottom-1 w-[calc(25%-4px)] rounded-lg shadow-xs transition-all duration-200 ease-out pointer-events-none ${entryOutcome === 'Active'
                    ? 'left-1 bg-card'
                    : entryOutcome === 'Win'
                      ? 'left-[calc(25%+2px)] bg-trade-green'
                      : entryOutcome === 'Loss'
                        ? 'left-[calc(50%+3px)] bg-trade-red'
                        : 'left-[calc(75%+4px)] bg-blue-500'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    playMicroTick();
                    setEntryOutcome('Active');
                  }}
                  className={`relative z-10 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 active:scale-[0.98] text-center ${entryOutcome === 'Active'
                    ? 'text-text-primary bg-card sm:bg-transparent shadow-xs sm:shadow-none font-extrabold'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  Active (Open)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMicroTick();
                    setEntryOutcome('Win');
                  }}
                  className={`relative z-10 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 active:scale-[0.98] text-center ${entryOutcome === 'Win'
                    ? 'text-white bg-trade-green sm:bg-transparent shadow-xs sm:shadow-none'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  Win
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMicroTick();
                    setEntryOutcome('Loss');
                  }}
                  className={`relative z-10 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 active:scale-[0.98] text-center ${entryOutcome === 'Loss'
                    ? 'text-white bg-trade-red sm:bg-transparent shadow-xs sm:shadow-none'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  Loss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMicroTick();
                    setEntryOutcome('Breakeven');
                  }}
                  className={`relative z-10 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 active:scale-[0.98] text-center ${entryOutcome === 'Breakeven'
                    ? 'text-white bg-blue-500 sm:bg-transparent shadow-xs sm:shadow-none'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  Breakeven
                </button>
              </div>

              {/* If Win/Loss/BE selected: Realized Exit Price input */}
              {entryOutcome !== 'Active' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-canvas border border-border">
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary mb-1 flex items-center gap-1.5 whitespace-nowrap">
                      <span>Exit Price</span>
                      <CurrencyBadge currency={strategy?.baseCurrency} />
                      <span className="text-text-muted font-normal text-[11px]">(Optional override)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={exitPriceInput || ''}
                      onChange={(e) => setExitPriceInput(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder={
                        entryOutcome === 'Win'
                          ? String(takeProfitPrice || spotTargetSellPrice || '')
                          : entryOutcome === 'Loss'
                            ? String(stopLossPrice || spotStopLossPrice || '')
                            : String(entryPrice || spotEntryPrice || '')
                      }
                      className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-text-primary focus:border-brand"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] text-text-muted uppercase font-bold">Outcome Mode</span>
                    <span
                      className={`text-xs font-bold font-mono mt-0.5 ${entryOutcome === 'Win'
                        ? 'text-trade-green'
                        : entryOutcome === 'Loss'
                          ? 'text-trade-red'
                          : 'text-text-primary'
                        }`}
                    >
                      {entryOutcome.toUpperCase()} RECORD
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Clean Chart Screenshot Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">
                Chart Screenshot
              </label>

              {screenshotData ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-black max-h-48 group">
                  <img
                    src={screenshotData}
                    alt="Chart Screenshot"
                    className="w-full h-auto object-contain cursor-pointer"
                    onClick={() => setIsZoomModalOpen(true)}
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsZoomModalOpen(true)}
                      className="p-1 rounded-md bg-black/70 text-white hover:bg-black transition-colors"
                      title="Zoom in"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotData(null);
                        setScreenshotUrlInput('');
                      }}
                      className="p-1 rounded-md bg-black/70 text-white hover:bg-rose-600 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={screenshotUrlInput}
                      onChange={(e) => setScreenshotUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyUrl();
                        }
                      }}
                      placeholder="Paste chart URL or press Ctrl+V..."
                      className="w-full bg-canvas border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-brand"
                    />
                  </div>

                  {screenshotUrlInput && (
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-brand/40 text-text-primary text-xs font-semibold"
                    >
                      Attach
                    </button>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                </div>
              )}
            </div>

            {/* Execution Mistake Tags */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">
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
                      onClick={() => toggleExecutionError(tag)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-card ${isSelected
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

            {/* Trade Notes */}
            <div>
              <label htmlFor="pre-trade-notes" className="block text-xs font-medium text-text-secondary mb-1">
                Trade Notes &amp; Rationale
              </label>
              <textarea
                id="pre-trade-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Thesis context, invalidation level, key confluences..."
                className="w-full bg-canvas border border-border rounded-xl p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-brand"
              />
            </div>

            {/* Primary Submit Button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => executeLogTrade(false)}
                disabled={!isUnlocked || isSubmitting}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all duration-200 ${justCommittedId
                  ? 'bg-emerald-400 text-black shadow-md ring-2 ring-emerald-500/40'
                  : isUnlocked
                    ? 'bg-brand text-black hover:bg-brand-hover cursor-pointer active:scale-[0.99] ring-2 ring-brand/20 shadow-md'
                    : 'bg-card border border-border text-text-muted opacity-40 cursor-not-allowed'
                  }`}
              >
                {isSubmitting ? (
                  'Logging Entry...'
                ) : justCommittedId ? (
                  <>
                    <Check className="w-4 h-4 text-black font-extrabold" />
                    <span>Order Committed (#{justCommittedId.slice(-6).toUpperCase()})</span>
                  </>
                ) : isUnlocked ? (
                  activeExecutionType === 'futures' ? (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Log Journal Entry ({direction.toUpperCase()})
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Log Spot Entry ({spotAction})
                    </>
                  )
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Complete {uncheckedMandatoryRules.length} Required Rule{uncheckedMandatoryRules.length > 1 ? 's' : ''} to Unlock
                  </>
                )}
              </button>

              {!isUnlocked && (
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => executeLogTrade(true)}
                    className="text-[11px] font-mono text-text-muted hover:text-rose-600 dark:hover:text-rose-400 underline decoration-rose-500/30 hover:decoration-rose-500 transition-colors"
                    title="Record an executed trade where rules were broken (logged as Grade C Violation)"
                  >
                    Record as Discipline Violation Override
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Screenshot Zoom Modal */}
    {
      isZoomModalOpen && screenshotData && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged chart preview"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={screenshotData}
              alt="Enlarged Chart Preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl border border-white/20"
            />
            <button
              onClick={() => setIsZoomModalOpen(false)}
              aria-label="Close chart preview"
              className="absolute -top-3 -right-3 p-1.5 rounded-full bg-black border border-white/30 text-white hover:bg-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </ div>
        </div>
      )
    }
  </div >
);
});
