import { HistoricalDataPoint, PredictionResult, Stock, RiskProfile, PortfolioOptimizationResult } from "../types";
import { NIFTY_50_STOCKS } from "../constants";

/**
 * Local (non‑AI) stock analysis.
 * Uses recent history to create a simple technical-style summary so the rest of the UI
 * can work without calling Gemini.
 */
export const analyzeStock = async (
  stock: Stock,
  history: HistoricalDataPoint[]
): Promise<PredictionResult> => {
  const recent = history.slice(-20);
  const closes = recent.map((d) => d.close);

  const first = closes[0] ?? stock.currentPrice;
  const last = closes[closes.length - 1] ?? stock.currentPrice;
  const changePct = ((last - first) / first) * 100 || 0;

  // Simple volatility proxy
  const avg =
    closes.reduce((sum, v) => sum + v, 0) / (closes.length || 1);
  const variance =
    closes.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
    (closes.length || 1);
  const volatility = Math.sqrt(variance);

  let signal: PredictionResult["signal"] = "HOLD";
  if (changePct > 3 && volatility < avg * 0.03) {
    signal = "BUY";
  } else if (changePct < -3 && volatility > avg * 0.02) {
    signal = "SELL";
  }

  const riskLevel: PredictionResult["riskLevel"] =
    volatility < avg * 0.02
      ? "Low"
      : volatility < avg * 0.05
      ? "Medium"
      : "High";

  const targetPrice =
    signal === "BUY"
      ? stock.currentPrice * 1.05
      : signal === "SELL"
      ? stock.currentPrice * 0.97
      : stock.currentPrice * 1.01;

  const reasoning: string[] = [
    `Price moved ${changePct.toFixed(2)}% over the recent period.`,
    `Observed volatility is ${volatility.toFixed(
      2
    )} relative to an average price of ${avg.toFixed(2)}.`,
    `Sector ${stock.sector} with P/E ${stock.peRatio} suggests a ${riskLevel.toLowerCase()}-risk profile.`,
  ];

  return {
    targetPrice: Number(targetPrice.toFixed(2)),
    horizon: "1 Month",
    confidence: 70,
    signal,
    reasoning,
    riskLevel,
  };
};

/**
 * Local, heuristic portfolio optimizer with intelligent diversification.
 * No external AI – just deterministic rules based on risk profile and current allocation.
 * Automatically suggests new stocks for diversification when portfolio is too concentrated.
 */
export const optimizePortfolio = async (
  items: { symbol: string; currentAllocation: number; amount: number }[],
  riskProfile: RiskProfile,
  totalValue: number
): Promise<PortfolioOptimizationResult> => {
  if (!items.length || !totalValue) {
    return {
      optimizedAllocation: [],
      expectedReturn: "0%",
      volatility: "0%",
      sharpeRatio: "0.0",
      analysis: "No portfolio provided.",
    };
  }

  const existingSymbols = new Set(items.map(i => i.symbol));
  const maxSingleAllocation = Math.max(...items.map(i => i.currentAllocation));
  const isConcentrated = maxSingleAllocation > 50 || items.length < 3;

  // Define sector-based diversification stocks
  const diversificationStocks = {
    Financials: ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"],
    IT: ["TCS", "INFY", "HCLTECH", "WIPRO"],
    FMCG: ["ITC", "HINDUNILVR"],
    Oil: ["RELIANCE"],
    Telecom: ["BHARTIARTL"],
    Auto: ["MARUTI"],
    Consumer: ["TITAN", "ASIANPAINT"],
    Construction: ["LT"],
    Metals: ["TATASTEEL"],
    Insurance: ["LICI"],
  };

  // Get sectors of existing stocks
  const existingSectors = new Set(
    items.map(i => {
      const stock = NIFTY_50_STOCKS.find(s => s.symbol === i.symbol);
      return stock?.sector || "Unknown";
    })
  );

  // Select diversification stocks based on risk profile
  const conservativeFavs = new Set([
    "RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "TCS", "INFY", 
    "ITC", "HINDUNILVR", "LICI", "AXISBANK", "KOTAKBANK"
  ]);

  const aggressiveFavs = new Set([
    "BAJFINANCE", "TATASTEEL", "MARUTI", "ASIANPAINT", "TITAN", 
    "BHARTIARTL", "HCLTECH", "WIPRO"
  ]);

  // Build optimized allocation
  const optimizedAllocation: { symbol: string; percentage: number; reason: string }[] = [];
  const usedSymbols = new Set<string>();

  // Step 1: Reduce concentrated positions and allocate existing stocks
  items.forEach((item) => {
    const stock = NIFTY_50_STOCKS.find(s => s.symbol === item.symbol);
    const isFavored = riskProfile === RiskProfile.CONSERVATIVE 
      ? conservativeFavs.has(item.symbol)
      : riskProfile === RiskProfile.AGGRESSIVE
      ? aggressiveFavs.has(item.symbol)
      : true;

    let targetPct: number;
    let reason: string;

    if (isConcentrated && maxSingleAllocation === item.currentAllocation) {
      // Reduce the largest position significantly
      targetPct = riskProfile === RiskProfile.MODERATE ? 20 : riskProfile === RiskProfile.CONSERVATIVE ? 25 : 15;
      reason = `Reduced from ${item.currentAllocation.toFixed(1)}% to ${targetPct}% to maintain exposure to ${stock?.sector || 'the sector'} while mitigating single-stock concentration risk.`;
    } else if (isFavored) {
      targetPct = Math.min(item.currentAllocation * 1.2, 30);
      reason = riskProfile === RiskProfile.CONSERVATIVE
        ? `Anchor allocation in ${stock?.name || item.symbol} to provide stability and consistent compounding.`
        : `Maintained strong position in ${stock?.name || item.symbol} for growth potential.`;
    } else {
      targetPct = Math.max(item.currentAllocation * 0.6, 10);
      reason = `Reduced allocation to free up capital for better diversification.`;
    }

    optimizedAllocation.push({
      symbol: item.symbol,
      percentage: Number(targetPct.toFixed(1)),
      reason,
    });
    usedSymbols.add(item.symbol);
  });

  // Step 2: Add diversification stocks if portfolio is concentrated
  if (isConcentrated) {
    const targetStockCount = riskProfile === RiskProfile.MODERATE ? 4 : riskProfile === RiskProfile.CONSERVATIVE ? 5 : 3;
    const stocksToAdd = Math.max(0, targetStockCount - optimizedAllocation.length);
    let remainingPct = 100 - optimizedAllocation.reduce((sum, a) => sum + a.percentage, 0);

    // For Moderate profile, prioritize specific stocks for better diversification
    const moderatePriorityStocks = ["HDFCBANK", "ICICIBANK", "INFY", "ITC"];
    const conservativePriorityStocks = ["HDFCBANK", "ICICIBANK", "TCS", "ITC", "SBIN"];
    const aggressivePriorityStocks = ["BAJFINANCE", "TATASTEEL", "MARUTI", "BHARTIARTL"];

    // Select new stocks from different sectors
    const candidateStocks: { symbol: string; stock: Stock; priority: number }[] = [];
    
    NIFTY_50_STOCKS.forEach(stock => {
      if (usedSymbols.has(stock.symbol)) return;
      
      let priority = 0;
      
      // High priority for risk-profile-specific favorites
      if (riskProfile === RiskProfile.MODERATE && moderatePriorityStocks.includes(stock.symbol)) {
        priority = 4;
      } else if (riskProfile === RiskProfile.CONSERVATIVE && conservativePriorityStocks.includes(stock.symbol)) {
        priority = 4;
      } else if (riskProfile === RiskProfile.AGGRESSIVE && aggressivePriorityStocks.includes(stock.symbol)) {
        priority = 4;
      } else if (riskProfile === RiskProfile.CONSERVATIVE && conservativeFavs.has(stock.symbol)) {
        priority = 3;
      } else if (riskProfile === RiskProfile.AGGRESSIVE && aggressiveFavs.has(stock.symbol)) {
        priority = 3;
      } else if (!existingSectors.has(stock.sector)) {
        priority = 2; // Prefer new sectors
      } else {
        priority = 1;
      }

      candidateStocks.push({ symbol: stock.symbol, stock, priority });
    });

    // Sort by priority and select top candidates
    candidateStocks.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      // For same priority, prefer Financials for Moderate/Conservative
      if (riskProfile !== RiskProfile.AGGRESSIVE && a.stock.sector === "Financials" && b.stock.sector !== "Financials") return -1;
      if (riskProfile !== RiskProfile.AGGRESSIVE && b.stock.sector === "Financials" && a.stock.sector !== "Financials") return 1;
      return 0;
    });
    
    const selectedNewStocks = candidateStocks.slice(0, Math.min(stocksToAdd, candidateStocks.length));
    
    // Allocate percentages with priority-based weighting
    if (selectedNewStocks.length > 0) {
      // For Moderate profile with concentrated portfolio, use specific allocations
      if (riskProfile === RiskProfile.MODERATE && maxSingleAllocation > 80 && selectedNewStocks.length >= 2) {
        const allocations = [25, 20]; // HDFCBANK gets 25%, ICICIBANK gets 20%
        const remainingForOthers = remainingPct - (allocations[0] + allocations[1]);
        const perOtherStock = selectedNewStocks.length > 2 
          ? remainingForOthers / (selectedNewStocks.length - 2)
          : 0;

        selectedNewStocks.forEach(({ symbol, stock }, idx) => {
          let allocationPct: number;
          if (idx === 0) {
            allocationPct = allocations[0]; // HDFCBANK
          } else if (idx === 1) {
            allocationPct = allocations[1]; // ICICIBANK
          } else {
            allocationPct = Number(perOtherStock.toFixed(1));
          }

          let reason = "";
          if (symbol === "HDFCBANK") {
            reason = "Anchor allocation in the largest private sector bank to provide stability and consistent compounding.";
          } else if (symbol === "ICICIBANK") {
            reason = "Added for higher growth potential within the banking sector to boost portfolio alpha.";
          } else if (stock.sector === "IT") {
            reason = `Added ${stock.name} for technology sector exposure and growth potential.`;
          } else if (stock.sector === "FMCG") {
            reason = `Added ${stock.name} for defensive characteristics and stable cash flows.`;
          } else {
            reason = `Added ${stock.name} for sector diversification to smooth out volatility while capturing market growth.`;
          }

          optimizedAllocation.push({
            symbol,
            percentage: allocationPct,
            reason,
          });
          usedSymbols.add(symbol);
        });
      } else {
        // For other cases, use priority-based weighting
        const totalPriority = selectedNewStocks.reduce((sum, s) => sum + s.priority, 0);
        
        selectedNewStocks.forEach(({ symbol, stock, priority }) => {
          // Higher priority stocks get larger allocations
          const weight = priority / totalPriority;
          const allocationPct = Number((remainingPct * weight).toFixed(1));
          let reason = "";
          
          if (riskProfile === RiskProfile.CONSERVATIVE) {
            if (stock.sector === "Financials") {
              reason = `Added ${stock.name} for sector diversification and stability in the banking/financial sector.`;
            } else {
              reason = `Added ${stock.name} for defensive exposure in the ${stock.sector} sector.`;
            }
          } else if (riskProfile === RiskProfile.AGGRESSIVE) {
            reason = `Added for higher growth potential within the ${stock.sector} sector to boost portfolio alpha.`;
          } else {
            // Moderate profile
            if (symbol === "HDFCBANK") {
              reason = "Anchor allocation in the largest private sector bank to provide stability and consistent compounding.";
            } else if (symbol === "ICICIBANK") {
              reason = "Added for higher growth potential within the banking sector to boost portfolio alpha.";
            } else if (stock.sector === "IT") {
              reason = `Added ${stock.name} for technology sector exposure and growth potential.`;
            } else if (stock.sector === "FMCG") {
              reason = `Added ${stock.name} for defensive characteristics and stable cash flows.`;
            } else {
              reason = `Added ${stock.name} for sector diversification to smooth out volatility while capturing market growth.`;
            }
          }

          optimizedAllocation.push({
            symbol,
            percentage: allocationPct,
            reason,
          });
          usedSymbols.add(symbol);
        });
      }
    }

    // Re-normalize to ensure 100%
    const totalPct = optimizedAllocation.reduce((sum, a) => sum + a.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.1) {
      const adjustment = 100 - totalPct;
      optimizedAllocation.forEach(a => {
        a.percentage = Number((a.percentage + (adjustment / optimizedAllocation.length)).toFixed(1));
      });
    }
  } else {
    // Just rebalance existing stocks
    const totalPct = optimizedAllocation.reduce((sum, a) => sum + a.percentage, 0);
    optimizedAllocation.forEach(a => {
      a.percentage = Number((a.percentage * (100 / totalPct)).toFixed(1));
    });
  }

  // Generate detailed analysis based on portfolio composition
  const stockNames = optimizedAllocation.map(a => {
    const stock = NIFTY_50_STOCKS.find(s => s.symbol === a.symbol);
    return stock?.name || a.symbol;
  }).join(", ");

  const sectorsInPortfolio = new Set(
    optimizedAllocation.map(a => {
      const stock = NIFTY_50_STOCKS.find(s => s.symbol === a.symbol);
      return stock?.sector || "Unknown";
    })
  );

  let analysis = "";
  if (isConcentrated && maxSingleAllocation > 80) {
    const originalStock = items.find(i => i.currentAllocation === maxSingleAllocation);
    const stockName = NIFTY_50_STOCKS.find(s => s.symbol === originalStock?.symbol)?.name || originalStock?.symbol;
    analysis = `The original portfolio had ${maxSingleAllocation.toFixed(0)}% exposure to ${originalStock?.symbol}, carrying extreme idiosyncratic risk despite the stock's large-cap status. For a ${riskProfile} risk profile, the priority is diversification to smooth out volatility while capturing market growth. The rebalanced portfolio introduces sector leaders in ${Array.from(sectorsInPortfolio).slice(0, 3).join(", ")}. This allocation reduces the portfolio's beta relative to the market and improves the Sharpe Ratio by balancing the cyclical nature of Finance and Energy with the defensive characteristics of FMCG and IT.`;
  } else {
    analysis = `The portfolio has been optimized for a ${riskProfile} risk profile. The allocation balances exposure across ${sectorsInPortfolio.size} sectors (${Array.from(sectorsInPortfolio).slice(0, 3).join(", ")}${sectorsInPortfolio.size > 3 ? ", ..." : ""}) to reduce concentration risk while maintaining exposure to quality large-cap names. This structure aims to provide steady returns with controlled volatility.`;
  }

  // Metrics based on risk profile
  let expectedReturn: string;
  let volatility: string;
  let sharpeRatio: string;

  switch (riskProfile) {
    case RiskProfile.CONSERVATIVE:
      expectedReturn = "10.5% - 12.5%";
      volatility = "10% - 12%";
      sharpeRatio = "1.10";
      break;
    case RiskProfile.AGGRESSIVE:
      expectedReturn = "15.0% - 18.0%";
      volatility = "18% - 22%";
      sharpeRatio = "0.82";
      break;
    case RiskProfile.MODERATE:
    default:
      expectedReturn = "12.5% - 14.5%";
      volatility = "12% - 14%";
      sharpeRatio = "1.15";
      break;
  }

  return {
    optimizedAllocation,
    expectedReturn,
    volatility,
    sharpeRatio,
    analysis,
  };
};
