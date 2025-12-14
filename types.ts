export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: string; // e.g. "12T"
  peRatio: number;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PredictionResult {
  targetPrice: number;
  horizon: string; // e.g., "1 Week", "1 Month"
  confidence: number; // 0-100
  signal: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface PortfolioItem {
  stock: Stock;
  allocation: number; // percentage or value
  shares: number;
}

export interface PortfolioOptimizationResult {
  optimizedAllocation: { symbol: string; percentage: number; reason: string }[];
  expectedReturn: string;
  volatility: string;
  sharpeRatio: string;
  analysis: string;
}

export enum RiskProfile {
  CONSERVATIVE = 'Conservative',
  MODERATE = 'Moderate',
  AGGRESSIVE = 'Aggressive'
}