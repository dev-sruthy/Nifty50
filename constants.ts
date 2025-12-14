import { Stock } from './types';

export const NIFTY_50_STOCKS: Stock[] = [
  { symbol: "ADANIENT", name: "Adani Enterprises", sector: "Conglomerate", currentPrice: 2850.50, change: 24.30, changePercent: 0.86, marketCap: "3.2T", peRatio: 34.2 },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ", sector: "Logistics", currentPrice: 1310.40, change: -6.20, changePercent: -0.47, marketCap: "2.8T", peRatio: 22.1 },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", sector: "Healthcare", currentPrice: 6125.70, change: 35.60, changePercent: 0.58, marketCap: "0.9T", peRatio: 59.4 },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "Consumer", currentPrice: 2890.10, change: -12.30, changePercent: -0.42, marketCap: "2.7T", peRatio: 55.2 },
  { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking", currentPrice: 1045.60, change: 6.70, changePercent: 0.64, marketCap: "3.2T", peRatio: 13.5 },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto", sector: "Auto", currentPrice: 9534.80, change: -45.20, changePercent: -0.47, marketCap: "2.7T", peRatio: 32.5 },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", sector: "Financials", currentPrice: 1700.20, change: 12.80, changePercent: 0.76, marketCap: "2.7T", peRatio: 27.4 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Financials", currentPrice: 6789.20, change: 123.40, changePercent: 1.85, marketCap: "4.2T", peRatio: 32.4 },
  { symbol: "BPCL", name: "Bharat Petroleum", sector: "Oil & Gas", currentPrice: 298.40, change: 1.60, changePercent: 0.54, marketCap: "0.7T", peRatio: 6.8 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", currentPrice: 1234.50, change: 21.00, changePercent: 1.73, marketCap: "6.5T", peRatio: 65.4 },
  { symbol: "BRITANNIA", name: "Britannia Industries", sector: "FMCG", currentPrice: 4950.30, change: -18.50, changePercent: -0.37, marketCap: "1.2T", peRatio: 52.1 },
  { symbol: "CIPLA", name: "Cipla", sector: "Pharmaceuticals", currentPrice: 1589.70, change: 6.50, changePercent: 0.41, marketCap: "1.4T", peRatio: 33.7 },
  { symbol: "COALINDIA", name: "Coal India", sector: "Metals & Mining", currentPrice: 450.80, change: -2.90, changePercent: -0.64, marketCap: "2.2T", peRatio: 8.5 },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", sector: "Pharmaceuticals", currentPrice: 3995.60, change: 28.30, changePercent: 0.71, marketCap: "1.1T", peRatio: 43.6 },
  { symbol: "DRREDDY", name: "Dr. Reddy's Labs", sector: "Pharmaceuticals", currentPrice: 6250.10, change: 12.40, changePercent: 0.20, marketCap: "1.1T", peRatio: 23.9 },
  { symbol: "EICHERMOT", name: "Eicher Motors", sector: "Auto", currentPrice: 3930.40, change: -21.70, changePercent: -0.55, marketCap: "1.1T", peRatio: 30.2 },
  { symbol: "GRASIM", name: "Grasim Industries", sector: "Materials", currentPrice: 2260.90, change: 18.60, changePercent: 0.83, marketCap: "1.6T", peRatio: 45.2 },
  { symbol: "HCLTECH", name: "HCL Technologies", sector: "IT", currentPrice: 1567.30, change: 4.50, changePercent: 0.29, marketCap: "4.1T", peRatio: 26.7 },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", currentPrice: 1456.20, change: 8.90, changePercent: 0.61, marketCap: "11.2T", peRatio: 18.4 },
  { symbol: "HDFCLIFE", name: "HDFC Life", sector: "Insurance", currentPrice: 690.50, change: 4.30, changePercent: 0.63, marketCap: "1.4T", peRatio: 77.3 },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", sector: "Auto", currentPrice: 4485.60, change: 33.20, changePercent: 0.75, marketCap: "0.9T", peRatio: 23.6 },
  { symbol: "HINDALCO", name: "Hindalco Industries", sector: "Metals", currentPrice: 621.40, change: -5.80, changePercent: -0.92, marketCap: "1.1T", peRatio: 13.8 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG", currentPrice: 2456.70, change: -10.50, changePercent: -0.43, marketCap: "5.3T", peRatio: 52.1 },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", currentPrice: 1089.45, change: 5.60, changePercent: 0.52, marketCap: "7.6T", peRatio: 17.2 },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG", currentPrice: 432.10, change: 1.20, changePercent: 0.28, marketCap: "5.4T", peRatio: 26.2 },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", sector: "Banking", currentPrice: 1520.30, change: 9.60, changePercent: 0.64, marketCap: "1.2T", peRatio: 15.4 },
  { symbol: "INFY", name: "Infosys", sector: "IT", currentPrice: 1678.10, change: -4.30, changePercent: -0.26, marketCap: "6.8T", peRatio: 24.8 },
  { symbol: "JSWSTEEL", name: "JSW Steel", sector: "Metals", currentPrice: 924.70, change: -6.10, changePercent: -0.66, marketCap: "1.1T", peRatio: 19.7 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking", currentPrice: 1765.40, change: -8.90, changePercent: -0.50, marketCap: "3.4T", peRatio: 21.3 },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Engineering", currentPrice: 3456.80, change: 45.60, changePercent: 1.34, marketCap: "4.8T", peRatio: 35.6 },
  { symbol: "M&M", name: "Mahindra & Mahindra", sector: "Auto", currentPrice: 2980.60, change: 14.20, changePercent: 0.48, marketCap: "2.3T", peRatio: 25.9 },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Auto", currentPrice: 11234.50, change: -56.70, changePercent: -0.50, marketCap: "3.5T", peRatio: 28.9 },
  { symbol: "NESTLEIND", name: "Nestle India", sector: "Consumer", currentPrice: 25440.20, change: 135.70, changePercent: 0.54, marketCap: "2.0T", peRatio: 72.3 },
  { symbol: "NTPC", name: "NTPC", sector: "Power", currentPrice: 368.90, change: 2.70, changePercent: 0.74, marketCap: "3.6T", peRatio: 16.2 },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", sector: "Oil & Gas", currentPrice: 278.50, change: -1.40, changePercent: -0.50, marketCap: "3.5T", peRatio: 7.3 },
  { symbol: "POWERGRID", name: "Power Grid Corp", sector: "Power", currentPrice: 293.40, change: 0.90, changePercent: 0.31, marketCap: "2.7T", peRatio: 16.9 },
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Oil & Gas", currentPrice: 2987.50, change: 12.40, changePercent: 0.42, marketCap: "19.8T", peRatio: 28.5 },
  { symbol: "SBILIFE", name: "SBI Life Insurance", sector: "Insurance", currentPrice: 1487.60, change: -6.30, changePercent: -0.42, marketCap: "1.5T", peRatio: 64.8 },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", currentPrice: 789.30, change: 3.20, changePercent: 0.41, marketCap: "6.2T", peRatio: 9.8 },
  { symbol: "SHRIRAMFIN", name: "Shriram Finance", sector: "NBFC", currentPrice: 2875.40, change: 22.10, changePercent: 0.77, marketCap: "1.1T", peRatio: 18.9 },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Pharmaceuticals", currentPrice: 1712.80, change: 8.40, changePercent: 0.49, marketCap: "4.1T", peRatio: 31.6 },
  { symbol: "TATACONSUM", name: "Tata Consumer Products", sector: "Consumer", currentPrice: 1168.20, change: -3.70, changePercent: -0.32, marketCap: "1.1T", peRatio: 63.2 },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Auto", currentPrice: 994.60, change: 5.80, changePercent: 0.59, marketCap: "3.5T", peRatio: 17.5 },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: "Metals", currentPrice: 145.60, change: 2.30, changePercent: 1.60, marketCap: "1.8T", peRatio: 15.4 },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", currentPrice: 4120.30, change: -15.20, changePercent: -0.37, marketCap: "14.5T", peRatio: 29.1 },
  { symbol: "TECHM", name: "Tech Mahindra", sector: "IT", currentPrice: 1375.20, change: -7.90, changePercent: -0.57, marketCap: "1.3T", peRatio: 27.6 },
  { symbol: "TITAN", name: "Titan Company", sector: "Consumer", currentPrice: 3567.80, change: 23.40, changePercent: 0.66, marketCap: "2.6T", peRatio: 85.1 },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", sector: "Cement", currentPrice: 11340.70, change: 82.60, changePercent: 0.73, marketCap: "3.3T", peRatio: 39.5 },
  { symbol: "WIPRO", name: "Wipro", sector: "IT", currentPrice: 489.20, change: -1.20, changePercent: -0.24, marketCap: "2.5T", peRatio: 22.4 },
  { symbol: "LTIM", name: "LTIMindtree", sector: "IT Services", currentPrice: 4948.50, change: 16.30, changePercent: 0.33, marketCap: "1.5T", peRatio: 33.1 }
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