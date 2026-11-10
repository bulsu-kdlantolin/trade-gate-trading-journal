import { TradeDirection, MarginType, SpotAction } from '../types/trade';

export interface FuturesMathInput {
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  leverage: number;
  direction: TradeDirection;
  marginType?: MarginType;
}

export interface FuturesMathResult {
  isValid: boolean;
  errorMessage?: string;
  riskAmountDollar: number;
  targetRiskReward: number;
  positionSizeTokens: number;
  notionalPositionDollar: number;
  marginRequiredDollar: number;
  estLiquidationPrice: number;
}

export interface SpotMathInput {
  accountBalance: number;
  allocationDollar: number;
  entryPrice: number;
  targetSellPrice: number;
  stopLossPrice?: number;
  spotAction?: SpotAction;
}

export interface SpotMathResult {
  isValid: boolean;
  errorMessage?: string;
  tokenQuantity: number;
  portfolioWeightPct: number;
  projectedRoiPct: number;
  targetMultiple: number;
  targetRiskReward?: number;
  dollarRisk?: number;
}

/**
 * Safe finite number guard to prevent NaN, Infinity, -Infinity from propagating into math or UI
 */
export function safeNumber(val: unknown, fallback = 0): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || Number.isNaN(val)) {
    return fallback;
  }
  return val;
}

/**
 * Pure derived calculation for Futures (Perps)
 * No useEffect or state mutation (strict adherence to react-best-practices)
 */
export function calculateFuturesMetrics(params: FuturesMathInput): FuturesMathResult {
  const accountBalance = Math.max(0, safeNumber(params.accountBalance, 0));
  const riskPercentage = Math.max(0, safeNumber(params.riskPercentage, 0));
  const entryPrice = Math.max(0, safeNumber(params.entryPrice, 0));
  const stopLossPrice = Math.max(0, safeNumber(params.stopLossPrice, 0));
  const takeProfitPrice = Math.max(0, safeNumber(params.takeProfitPrice, 0));
  const leverage = Math.max(1, safeNumber(params.leverage, 1));
  const direction = params.direction;

  if (entryPrice <= 0 || stopLossPrice <= 0) {
    return {
      isValid: false,
      errorMessage: 'Enter valid Entry and Stop Loss prices',
      riskAmountDollar: 0,
      targetRiskReward: 0,
      positionSizeTokens: 0,
      notionalPositionDollar: 0,
      marginRequiredDollar: 0,
      estLiquidationPrice: 0,
    };
  }

  if (direction === 'Long' && stopLossPrice >= entryPrice) {
    return {
      isValid: false,
      errorMessage: 'Long Stop Loss must be strictly below Entry',
      riskAmountDollar: 0,
      targetRiskReward: 0,
      positionSizeTokens: 0,
      notionalPositionDollar: 0,
      marginRequiredDollar: 0,
      estLiquidationPrice: 0,
    };
  }

  if (direction === 'Short' && stopLossPrice <= entryPrice) {
    return {
      isValid: false,
      errorMessage: 'Short Stop Loss must be strictly above Entry',
      riskAmountDollar: 0,
      targetRiskReward: 0,
      positionSizeTokens: 0,
      notionalPositionDollar: 0,
      marginRequiredDollar: 0,
      estLiquidationPrice: 0,
    };
  }

  const riskDollar = (accountBalance * riskPercentage) / 100;
  const slDistance = Math.abs(entryPrice - stopLossPrice);
  const tpDistance = takeProfitPrice > 0 ? Math.abs(takeProfitPrice - entryPrice) : 0;
  const targetRiskReward =
    slDistance > 0 && tpDistance > 0
      ? safeNumber(Number((tpDistance / slDistance).toFixed(2)), 0)
      : 0;

  // Position sizing: Risk $ / SL distance per token
  const positionSizeTokens = slDistance > 0 ? riskDollar / slDistance : 0;
  const notionalPositionDollar = positionSizeTokens * entryPrice;
  const safeLev = Math.max(1, leverage);
  const marginRequiredDollar = notionalPositionDollar / safeLev;

  // Estimated Liquidation Price calculation with 0.5% maintenance margin buffer
  const maintenanceBuffer = 0.005;
  let estLiquidationPrice = 0;
  if (direction === 'Long') {
    const dropFraction = (1 / safeLev) - maintenanceBuffer;
    estLiquidationPrice = Math.max(0, entryPrice * (1 - dropFraction));
  } else {
    const riseFraction = (1 / safeLev) - maintenanceBuffer;
    estLiquidationPrice = entryPrice * (1 + riseFraction);
  }

  return {
    isValid: true,
    riskAmountDollar: safeNumber(Number(riskDollar.toFixed(2)), 0),
    targetRiskReward,
    positionSizeTokens: safeNumber(Number(positionSizeTokens.toFixed(4)), 0),
    notionalPositionDollar: safeNumber(Number(notionalPositionDollar.toFixed(2)), 0),
    marginRequiredDollar: safeNumber(Number(marginRequiredDollar.toFixed(2)), 0),
    estLiquidationPrice: safeNumber(Number(estLiquidationPrice.toFixed(2)), 0),
  };
}

/**
 * Pure derived calculation for Spot Holdings
 * No useEffect or state mutation
 */
export function calculateSpotMetrics(params: SpotMathInput): SpotMathResult {
  const accountBalance = Math.max(0, safeNumber(params.accountBalance, 0));
  const allocationDollar = Math.max(0, safeNumber(params.allocationDollar, 0));
  const entryPrice = Math.max(0, safeNumber(params.entryPrice, 0));
  const targetSellPrice = Math.max(0, safeNumber(params.targetSellPrice, 0));
  const stopLossPrice =
    params.stopLossPrice !== undefined ? Math.max(0, safeNumber(params.stopLossPrice, 0)) : undefined;

  if (entryPrice <= 0 || allocationDollar <= 0) {
    return {
      isValid: false,
      errorMessage: 'Enter valid Entry Price and Allocation Amount',
      tokenQuantity: 0,
      portfolioWeightPct: 0,
      projectedRoiPct: 0,
      targetMultiple: 0,
    };
  }

  const tokenQuantity = allocationDollar / entryPrice;
  const portfolioWeightPct = accountBalance > 0 ? (allocationDollar / accountBalance) * 100 : 0;

  let projectedRoiPct = 0;
  let targetMultiple = 0;
  if (targetSellPrice > 0) {
    projectedRoiPct = ((targetSellPrice - entryPrice) / entryPrice) * 100;
    targetMultiple = targetSellPrice / entryPrice;
  }

  let targetRiskReward: number | undefined;
  let dollarRisk: number | undefined;

  if (stopLossPrice && stopLossPrice > 0 && stopLossPrice < entryPrice) {
    const riskPerToken = entryPrice - stopLossPrice;
    dollarRisk = tokenQuantity * riskPerToken;
    if (targetSellPrice > entryPrice) {
      const rewardPerToken = targetSellPrice - entryPrice;
      targetRiskReward = safeNumber(Number((rewardPerToken / riskPerToken).toFixed(2)), 0);
    }
  }

  return {
    isValid: true,
    tokenQuantity: safeNumber(Number(tokenQuantity.toFixed(4)), 0),
    portfolioWeightPct: safeNumber(Number(portfolioWeightPct.toFixed(1)), 0),
    projectedRoiPct: safeNumber(Number(projectedRoiPct.toFixed(1)), 0),
    targetMultiple: safeNumber(Number(targetMultiple.toFixed(2)), 0),
    targetRiskReward,
    dollarRisk: dollarRisk !== undefined ? safeNumber(Number(dollarRisk.toFixed(2)), 0) : undefined,
  };
}

