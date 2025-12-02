import { Stock } from './types';

export const NIFTY_50_STOCKS: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Oil & Gas", currentPrice: 2987.50, change: 12.40, changePercent: 0.42, marketCap: "19.8T", peRatio: 28.5 },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", currentPrice: 4120.30, change: -15.20, changePercent: -0.37, marketCap: "14.5T", peRatio: 29.1 },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Financials", currentPrice: 1456.20, change: 8.90, changePercent: 0.61, marketCap: "11.2T", peRatio: 18.4 },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Financials", currentPrice: 1089.45, change: 5.60, changePercent: 0.52, marketCap: "7.6T", peRatio: 17.2 },
  { symbol: "INFY", name: "Infosys", sector: "IT", currentPrice: 1678.10, change: -4.30, changePercent: -0.26, marketCap: "6.8T", peRatio: 24.8 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", currentPrice: 1234.50, change: 21.00, changePercent: 1.73, marketCap: "6.5T", peRatio: 65.4 },
  { symbol: "SBIN", name: "State Bank of India", sector: "Financials", currentPrice: 789.30, change: 3.20, changePercent: 0.41, marketCap: "6.2T", peRatio: 9.8 },
  { symbol: "LICI", name: "LIC India", sector: "Insurance", currentPrice: 1023.40, change: -2.10, changePercent: -0.20, marketCap: "5.9T", peRatio: 14.5 },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG", currentPrice: 432.10, change: 1.20, changePercent: 0.28, marketCap: "5.4T", peRatio: 26.2 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG", currentPrice: 2456.70, change: -10.50, changePercent: -0.43, marketCap: "5.3T", peRatio: 52.1 },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Construction", currentPrice: 3456.80, change: 45.60, changePercent: 1.34, marketCap: "4.8T", peRatio: 35.6 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Financials", currentPrice: 6789.20, change: 123.40, changePercent: 1.85, marketCap: "4.2T", peRatio: 32.4 },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Auto", currentPrice: 11234.50, change: -56.70, changePercent: -0.50, marketCap: "3.5T", peRatio: 28.9 },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "Consumer", currentPrice: 2890.10, change: -12.30, changePercent: -0.42, marketCap: "2.7T", peRatio: 55.2 },
  { symbol: "TITAN", name: "Titan Company", sector: "Consumer", currentPrice: 3567.80, change: 23.40, changePercent: 0.66, marketCap: "2.6T", peRatio: 85.1 },
  { symbol: "AXISBANK", name: "Axis Bank", sector: "Financials", currentPrice: 1045.60, change: 6.70, changePercent: 0.64, marketCap: "3.2T", peRatio: 13.5 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Financials", currentPrice: 1765.40, change: -8.90, changePercent: -0.50, marketCap: "3.4T", peRatio: 21.3 },
  { symbol: "WIPRO", name: "Wipro", sector: "IT", currentPrice: 489.20, change: -1.20, changePercent: -0.24, marketCap: "2.5T", peRatio: 22.4 },
  { symbol: "HCLTECH", name: "HCL Technologies", sector: "IT", currentPrice: 1567.30, change: 4.50, changePercent: 0.29, marketCap: "4.1T", peRatio: 26.7 },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: "Metals", currentPrice: 145.60, change: 2.30, changePercent: 1.60, marketCap: "1.8T", peRatio: 15.4 },
];

// Mock Data Generator
export const generateHistoricalData = (basePrice: number, days: number = 90) => {
  const data = [];
  let currentPrice = basePrice * 0.85; // Start a bit lower to show trend
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = basePrice * 0.02;
    const change = (Math.random() - 0.48) * volatility; // Slight upward bias
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }
  return data;
};