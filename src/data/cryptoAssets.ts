import { isFavoriteTicker } from '../utils/cryptoFavorites';

export interface CryptoAsset {
  symbol: string;         // e.g. "BTCUSDT.P" for perps, "BTC" for spot
  baseTicker: string;     // e.g. "BTC"
  name: string;           // e.g. "Bitcoin"
  rank: number;           // CoinMarketCap market cap rank
  category: 'Major' | 'DeFi' | 'Layer 1' | 'Layer 2' | 'Meme' | 'AI / DePIN' | 'Gaming' | 'Infrastructure';
  isPerp: boolean;
  isSpot: boolean;
  defaultTickSize: number;
  cmcId: number;          // Official CoinMarketCap asset ID
}

interface RawToken {
  baseTicker: string;
  name: string;
  rank: number;
  category: CryptoAsset['category'];
  defaultTickSize: number;
  cmcId: number;
}

/**
 * Top speculative, volatile cryptocurrencies based on CoinMarketCap.
 * Stablecoins (USDT, USDC, USDE, DAI, etc.) are purged so traders only
 * trade genuine, volatile crypto pairs.
 */
const RAW_TOP_100_COINS: RawToken[] = [
  { baseTicker: 'BTC', name: 'Bitcoin', rank: 1, category: 'Major', defaultTickSize: 0.1, cmcId: 1 },
  { baseTicker: 'ETH', name: 'Ethereum', rank: 2, category: 'Major', defaultTickSize: 0.01, cmcId: 1027 },
  { baseTicker: 'BNB', name: 'BNB', rank: 3, category: 'Major', defaultTickSize: 0.01, cmcId: 1839 },
  { baseTicker: 'XRP', name: 'XRP', rank: 4, category: 'Major', defaultTickSize: 0.0001, cmcId: 52 },
  { baseTicker: 'SOL', name: 'Solana', rank: 5, category: 'Layer 1', defaultTickSize: 0.01, cmcId: 5426 },
  { baseTicker: 'TRX', name: 'TRON', rank: 6, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 1958 },
  { baseTicker: 'ZEC', name: 'Zcash', rank: 7, category: 'Layer 1', defaultTickSize: 0.01, cmcId: 1437 },
  { baseTicker: 'HYPE', name: 'Hyperliquid', rank: 8, category: 'DeFi', defaultTickSize: 0.001, cmcId: 32196 },
  { baseTicker: 'XMR', name: 'Monero', rank: 9, category: 'Major', defaultTickSize: 0.01, cmcId: 328 },
  { baseTicker: 'DOGE', name: 'Dogecoin', rank: 10, category: 'Meme', defaultTickSize: 0.00001, cmcId: 74 },
  { baseTicker: 'LEO', name: 'UNUS SED LEO', rank: 11, category: 'Major', defaultTickSize: 0.001, cmcId: 3957 },
  { baseTicker: 'LINK', name: 'Chainlink', rank: 12, category: 'Infrastructure', defaultTickSize: 0.001, cmcId: 1975 },
  { baseTicker: 'ADA', name: 'Cardano', rank: 13, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 2010 },
  { baseTicker: 'XLM', name: 'Stellar', rank: 14, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 512 },
  { baseTicker: 'BCH', name: 'Bitcoin Cash', rank: 15, category: 'Major', defaultTickSize: 0.01, cmcId: 1831 },
  { baseTicker: 'NEAR', name: 'NEAR Protocol', rank: 16, category: 'Layer 1', defaultTickSize: 0.001, cmcId: 6535 },
  { baseTicker: 'UNI', name: 'Uniswap', rank: 17, category: 'DeFi', defaultTickSize: 0.001, cmcId: 7083 },
  { baseTicker: 'LTC', name: 'Litecoin', rank: 18, category: 'Major', defaultTickSize: 0.01, cmcId: 2 },
  { baseTicker: 'AVAX', name: 'Avalanche', rank: 19, category: 'Layer 1', defaultTickSize: 0.01, cmcId: 5805 },
  { baseTicker: 'SUI', name: 'Sui', rank: 20, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 20947 },
  { baseTicker: 'HBAR', name: 'Hedera', rank: 21, category: 'Layer 1', defaultTickSize: 0.00001, cmcId: 4642 },
  { baseTicker: 'SHIB', name: 'Shiba Inu', rank: 22, category: 'Meme', defaultTickSize: 0.00000001, cmcId: 5994 },
  { baseTicker: 'TAO', name: 'Bittensor', rank: 23, category: 'AI / DePIN', defaultTickSize: 0.01, cmcId: 22974 },
  { baseTicker: 'CRO', name: 'Cronos', rank: 24, category: 'Layer 1', defaultTickSize: 0.00001, cmcId: 3635 },
  { baseTicker: 'QNT', name: 'Quant', rank: 25, category: 'Infrastructure', defaultTickSize: 0.01, cmcId: 3155 },
  { baseTicker: 'PEPE', name: 'Pepe', rank: 26, category: 'Meme', defaultTickSize: 0.00000001, cmcId: 24478 },
  { baseTicker: 'ENA', name: 'Ethena', rank: 27, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 30171 },
  { baseTicker: 'AAVE', name: 'Aave', rank: 28, category: 'DeFi', defaultTickSize: 0.01, cmcId: 7278 },
  { baseTicker: 'OKB', name: 'OKB', rank: 29, category: 'Major', defaultTickSize: 0.01, cmcId: 3897 },
  { baseTicker: 'ONDO', name: 'Ondo Finance', rank: 30, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 21159 },
  { baseTicker: 'MNT', name: 'Mantle', rank: 31, category: 'Layer 2', defaultTickSize: 0.0001, cmcId: 27075 },
  { baseTicker: 'DOT', name: 'Polkadot', rank: 32, category: 'Layer 1', defaultTickSize: 0.001, cmcId: 6636 },
  { baseTicker: 'ICP', name: 'Internet Computer', rank: 33, category: 'Layer 1', defaultTickSize: 0.001, cmcId: 8916 },
  { baseTicker: 'BGB', name: 'Bitget Token', rank: 34, category: 'Major', defaultTickSize: 0.001, cmcId: 11092 },
  { baseTicker: 'ARB', name: 'Arbitrum', rank: 35, category: 'Layer 2', defaultTickSize: 0.0001, cmcId: 11841 },
  { baseTicker: 'WLD', name: 'Worldcoin', rank: 36, category: 'AI / DePIN', defaultTickSize: 0.0001, cmcId: 13502 },
  { baseTicker: 'JST', name: 'JUST', rank: 37, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 5488 },
  { baseTicker: 'MORPHO', name: 'Morpho', rank: 38, category: 'DeFi', defaultTickSize: 0.001, cmcId: 34104 },
  { baseTicker: 'ETC', name: 'Ethereum Classic', rank: 39, category: 'Layer 1', defaultTickSize: 0.01, cmcId: 1321 },
  { baseTicker: 'GT', name: 'GateToken', rank: 40, category: 'Major', defaultTickSize: 0.001, cmcId: 4269 },
  { baseTicker: 'KCS', name: 'KuCoin Token', rank: 41, category: 'Major', defaultTickSize: 0.001, cmcId: 2087 },
  { baseTicker: 'POL', name: 'Polygon', rank: 42, category: 'Layer 2', defaultTickSize: 0.0001, cmcId: 28321 },
  { baseTicker: 'JUP', name: 'Jupiter', rank: 43, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 29210 },
  { baseTicker: 'ALGO', name: 'Algorand', rank: 44, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 4030 },
  { baseTicker: 'RENDER', name: 'Render', rank: 45, category: 'AI / DePIN', defaultTickSize: 0.001, cmcId: 5690 },
  { baseTicker: 'KAS', name: 'Kaspa', rank: 46, category: 'Layer 1', defaultTickSize: 0.00001, cmcId: 20396 },
  { baseTicker: 'INJ', name: 'Injective', rank: 47, category: 'Layer 1', defaultTickSize: 0.001, cmcId: 7226 },
  { baseTicker: 'ATOM', name: 'Cosmos', rank: 48, category: 'Layer 1', defaultTickSize: 0.001, cmcId: 3794 },
  { baseTicker: 'CAKE', name: 'PancakeSwap', rank: 49, category: 'DeFi', defaultTickSize: 0.001, cmcId: 7186 },
  { baseTicker: 'FIL', name: 'Filecoin', rank: 50, category: 'AI / DePIN', defaultTickSize: 0.001, cmcId: 2280 },
  { baseTicker: 'XDC', name: 'XDC Network', rank: 51, category: 'Layer 1', defaultTickSize: 0.00001, cmcId: 2634 },
  { baseTicker: 'AERO', name: 'Aerodrome', rank: 52, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 29270 },
  { baseTicker: 'ZRO', name: 'LayerZero', rank: 53, category: 'Infrastructure', defaultTickSize: 0.001, cmcId: 26997 },
  { baseTicker: 'DASH', name: 'Dash', rank: 54, category: 'Major', defaultTickSize: 0.01, cmcId: 131 },
  { baseTicker: 'ETHFI', name: 'ether.fi', rank: 55, category: 'DeFi', defaultTickSize: 0.001, cmcId: 29814 },
  { baseTicker: 'STX', name: 'Stacks', rank: 56, category: 'Layer 2', defaultTickSize: 0.0001, cmcId: 4847 },
  { baseTicker: 'APT', name: 'Aptos', rank: 57, category: 'Layer 1', defaultTickSize: 0.001, cmcId: 21794 },
  { baseTicker: 'PYTH', name: 'Pyth Network', rank: 58, category: 'Infrastructure', defaultTickSize: 0.00001, cmcId: 28177 },
  { baseTicker: 'RAY', name: 'Raydium', rank: 59, category: 'DeFi', defaultTickSize: 0.001, cmcId: 8526 },
  { baseTicker: 'FLR', name: 'Flare', rank: 60, category: 'Layer 1', defaultTickSize: 0.000001, cmcId: 7950 },
  { baseTicker: 'NEXO', name: 'Nexo', rank: 61, category: 'DeFi', defaultTickSize: 0.001, cmcId: 2694 },
  { baseTicker: 'VET', name: 'VeChain', rank: 62, category: 'Layer 1', defaultTickSize: 0.000001, cmcId: 3077 },
  { baseTicker: 'TIA', name: 'Celestia', rank: 63, category: 'Infrastructure', defaultTickSize: 0.0001, cmcId: 22861 },
  { baseTicker: 'CRV', name: 'Curve DAO', rank: 64, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 6538 },
  { baseTicker: 'PENGU', name: 'Pudgy Penguins', rank: 65, category: 'Meme', defaultTickSize: 0.000001, cmcId: 34466 },
  { baseTicker: 'VIRTUAL', name: 'Virtuals Protocol', rank: 66, category: 'AI / DePIN', defaultTickSize: 0.0001, cmcId: 29420 },
  { baseTicker: 'FET', name: 'Artificial Superintelligence Alliance', rank: 67, category: 'AI / DePIN', defaultTickSize: 0.0001, cmcId: 3773 },
  { baseTicker: 'BTT', name: 'BitTorrent', rank: 68, category: 'Infrastructure', defaultTickSize: 0.00000001, cmcId: 16086 },
  { baseTicker: 'SEI', name: 'Sei', rank: 69, category: 'Layer 1', defaultTickSize: 0.00001, cmcId: 23149 },
  { baseTicker: 'BSV', name: 'Bitcoin SV', rank: 70, category: 'Major', defaultTickSize: 0.01, cmcId: 3602 },
  { baseTicker: 'TRUMP', name: 'OFFICIAL TRUMP', rank: 71, category: 'Meme', defaultTickSize: 0.001, cmcId: 35336 },
  { baseTicker: 'STRK', name: 'Starknet', rank: 72, category: 'Layer 2', defaultTickSize: 0.00001, cmcId: 22691 },
  { baseTicker: 'SUN', name: 'Sun Token', rank: 73, category: 'DeFi', defaultTickSize: 0.00001, cmcId: 10529 },
  { baseTicker: 'GNO', name: 'Gnosis', rank: 74, category: 'Layer 1', defaultTickSize: 0.01, cmcId: 1659 },
  { baseTicker: 'XTZ', name: 'Tezos', rank: 75, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 2011 },
  { baseTicker: 'PENDLE', name: 'Pendle', rank: 76, category: 'DeFi', defaultTickSize: 0.001, cmcId: 9481 },
  { baseTicker: 'LDO', name: 'Lido DAO', rank: 77, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 8000 },
  { baseTicker: 'BONK', name: 'Bonk', rank: 78, category: 'Meme', defaultTickSize: 0.00000001, cmcId: 23095 },
  { baseTicker: 'IMX', name: 'Immutable', rank: 79, category: 'Gaming', defaultTickSize: 0.0001, cmcId: 10603 },
  { baseTicker: 'OP', name: 'Optimism', rank: 80, category: 'Layer 2', defaultTickSize: 0.0001, cmcId: 11840 },
  { baseTicker: 'LUNC', name: 'Terra Classic', rank: 81, category: 'Layer 1', defaultTickSize: 0.0000001, cmcId: 4172 },
  { baseTicker: 'CFX', name: 'Conflux', rank: 82, category: 'Layer 1', defaultTickSize: 0.00001, cmcId: 7334 },
  { baseTicker: 'BEAM', name: 'Beam', rank: 83, category: 'Gaming', defaultTickSize: 0.000001, cmcId: 28298 },
  { baseTicker: 'DCR', name: 'Decred', rank: 84, category: 'Layer 1', defaultTickSize: 0.01, cmcId: 1168 },
  { baseTicker: 'AR', name: 'Arweave', rank: 85, category: 'AI / DePIN', defaultTickSize: 0.001, cmcId: 5632 },
  { baseTicker: 'GRT', name: 'The Graph', rank: 86, category: 'Infrastructure', defaultTickSize: 0.00001, cmcId: 6719 },
  { baseTicker: 'COMP', name: 'Compound', rank: 87, category: 'DeFi', defaultTickSize: 0.01, cmcId: 5692 },
  { baseTicker: 'KAIA', name: 'Kaia', rank: 88, category: 'Layer 1', defaultTickSize: 0.00001, cmcId: 32880 },
  { baseTicker: 'WIF', name: 'dogwifhat', rank: 89, category: 'Meme', defaultTickSize: 0.0001, cmcId: 28752 },
  { baseTicker: 'FLOKI', name: 'Floki', rank: 90, category: 'Meme', defaultTickSize: 0.0000001, cmcId: 10804 },
  { baseTicker: 'FTM', name: 'Fantom / Sonic', rank: 91, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 3513 },
  { baseTicker: 'THETA', name: 'Theta Network', rank: 92, category: 'Infrastructure', defaultTickSize: 0.0001, cmcId: 2416 },
  { baseTicker: 'MANA', name: 'Decentraland', rank: 93, category: 'Gaming', defaultTickSize: 0.0001, cmcId: 1966 },
  { baseTicker: 'SAND', name: 'The Sandbox', rank: 94, category: 'Gaming', defaultTickSize: 0.0001, cmcId: 5864 },
  { baseTicker: 'AXS', name: 'Axie Infinity', rank: 95, category: 'Gaming', defaultTickSize: 0.001, cmcId: 6783 },
  { baseTicker: 'DYDX', name: 'dYdX', rank: 96, category: 'DeFi', defaultTickSize: 0.001, cmcId: 28324 },
  { baseTicker: 'RUNE', name: 'THORChain', rank: 97, category: 'DeFi', defaultTickSize: 0.001, cmcId: 4157 },
  { baseTicker: 'MKR', name: 'Maker', rank: 98, category: 'DeFi', defaultTickSize: 0.1, cmcId: 1518 },
  { baseTicker: 'ENS', name: 'Ethereum Name Service', rank: 99, category: 'Infrastructure', defaultTickSize: 0.01, cmcId: 13855 },
  { baseTicker: 'JTO', name: 'Jito', rank: 100, category: 'DeFi', defaultTickSize: 0.001, cmcId: 28541 },

  // Notable Top Volume & Traders' Choice Additions
  { baseTicker: 'DRIFT', name: 'Drift Protocol', rank: 101, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 29944 },
  { baseTicker: 'MOVE', name: 'Movement', rank: 102, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 34358 },
  { baseTicker: 'BLUR', name: 'Blur', rank: 103, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 23121 },
  { baseTicker: '1INCH', name: '1inch Network', rank: 104, category: 'DeFi', defaultTickSize: 0.0001, cmcId: 8104 },
  { baseTicker: 'MEW', name: 'cat in a dogs world', rank: 105, category: 'Meme', defaultTickSize: 0.000001, cmcId: 30126 },
  { baseTicker: 'CHZ', name: 'Chiliz', rank: 106, category: 'Gaming', defaultTickSize: 0.00001, cmcId: 4066 },
  { baseTicker: 'FLOW', name: 'Flow', rank: 107, category: 'Layer 1', defaultTickSize: 0.001, cmcId: 4558 },
  { baseTicker: 'EGLD', name: 'MultiversX', rank: 108, category: 'Layer 1', defaultTickSize: 0.01, cmcId: 6892 },
  { baseTicker: 'IOTA', name: 'IOTA', rank: 109, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 1720 },
  { baseTicker: 'ROSE', name: 'Oasis Network', rank: 110, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 7653 },
  { baseTicker: 'GALA', name: 'Gala', rank: 111, category: 'Gaming', defaultTickSize: 0.00001, cmcId: 7080 },
  { baseTicker: 'KAVA', name: 'Kava', rank: 112, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 4846 },
  { baseTicker: 'SNX', name: 'Synthetix', rank: 113, category: 'DeFi', defaultTickSize: 0.001, cmcId: 2586 },
  { baseTicker: 'ASTR', name: 'Astar', rank: 114, category: 'Layer 1', defaultTickSize: 0.00001, cmcId: 12885 },
  { baseTicker: 'NEO', name: 'NEO', rank: 115, category: 'Layer 1', defaultTickSize: 0.01, cmcId: 1376 },
  { baseTicker: 'EOS', name: 'EOS', rank: 116, category: 'Layer 1', defaultTickSize: 0.0001, cmcId: 1765 },
  { baseTicker: 'RON', name: 'Ronin', rank: 117, category: 'Gaming', defaultTickSize: 0.001, cmcId: 14101 },
  { baseTicker: 'ME', name: 'Magic Eden', rank: 118, category: 'DeFi', defaultTickSize: 0.001, cmcId: 33878 },
  { baseTicker: 'SPX', name: 'SPX6900', rank: 119, category: 'Meme', defaultTickSize: 0.0001, cmcId: 28081 },
  { baseTicker: 'DOGS', name: 'DOGS', rank: 120, category: 'Meme', defaultTickSize: 0.000001, cmcId: 32698 },
];

/**
 * Builds the complete list of CryptoAsset items for both Perp and Spot trading.
 */
export const POPULAR_CRYPTO_ASSETS: CryptoAsset[] = (() => {
  const assets: CryptoAsset[] = [];

    RAW_TOP_100_COINS.forEach((coin) => {
      // 1. Futures Perpetual Pair (e.g. BTCUSDT.P)
      assets.push({
        symbol: `${coin.baseTicker}USDT.P`,
        baseTicker: coin.baseTicker,
        name: `${coin.name} Perp`,
        rank: coin.rank,
        category: coin.category,
        isPerp: true,
        isSpot: false,
        defaultTickSize: coin.defaultTickSize,
        cmcId: coin.cmcId,
      });

      // 2. Spot Ticker (e.g. BTC)
      assets.push({
        symbol: coin.baseTicker,
        baseTicker: coin.baseTicker,
        name: `${coin.name} Spot`,
        rank: coin.rank,
        category: coin.category,
        isPerp: false,
        isSpot: true,
        defaultTickSize: coin.defaultTickSize,
        cmcId: coin.cmcId,
      });
    });

  return assets;
})();

export const TOP_100_CRYPTO_ASSETS = POPULAR_CRYPTO_ASSETS;

/**
 * Searches crypto assets with favorite tokens automatically sorted to the top.
 */
export function searchCryptoAssets(
  query: string,
  mode?: 'futures' | 'spot',
  favoriteTickers: string[] = []
): CryptoAsset[] {
  const cleanQ = query.trim().toUpperCase();
  let list = POPULAR_CRYPTO_ASSETS;

  if (mode === 'futures') {
    list = list.filter((a) => a.isPerp);
  } else if (mode === 'spot') {
    list = list.filter((a) => a.isSpot);
  }

  // Filter by query if user typed a search term
  if (cleanQ) {
    list = list.filter(
      (a) =>
        a.symbol.toUpperCase().includes(cleanQ) ||
        a.baseTicker.toUpperCase().includes(cleanQ) ||
        a.name.toUpperCase().includes(cleanQ)
    );
  }

  // Sort with favorites on top automatically!
  return [...list].sort((a, b) => {
    const aFav = isFavoriteTicker(a.baseTicker, favoriteTickers);
    const bFav = isFavoriteTicker(b.baseTicker, favoriteTickers);

    // 1. Favorites always come first
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;

    // 2. If both are favorites, preserve favorites array order
    if (aFav && bFav) {
      const aIdx = favoriteTickers.indexOf(a.baseTicker);
      const bIdx = favoriteTickers.indexOf(b.baseTicker);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    }

    // 3. Otherwise sort by CoinMarketCap rank
    return a.rank - b.rank;
  });
}
