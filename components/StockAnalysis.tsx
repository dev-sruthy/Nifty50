import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { NIFTY_50_STOCKS, generateHistoricalData } from '../constants';
import { Stock } from '../types';
import StockChart from './StockChart';

type ManualField = 'open' | 'close' | 'high' | 'low' | 'volume';

const StockAnalysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(NIFTY_50_STOCKS[0].symbol);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualInputs, setManualInputs] = useState<Record<ManualField, string>>({
    open: '',
    close: '',
    high: '',
    low: '',
    volume: '',
  });

  const selectedStock = NIFTY_50_STOCKS.find(s => s.symbol === selectedSymbol) || NIFTY_50_STOCKS[0];
  
  // Memoize historical data so it doesn't regenerate on every render, only when stock changes
  const historicalData = useMemo(() => {
    return generateHistoricalData(selectedStock.currentPrice);
  }, [selectedStock]);

  const filteredStocks = NIFTY_50_STOCKS.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManualChange = (field: ManualField, value: string) => {
    setManualInputs(prev => ({ ...prev, [field]: value }));
  };

  const investmentEvaluation = useMemo(() => {
    const open = parseFloat(manualInputs.open);
    const close = parseFloat(manualInputs.close);
    const high = parseFloat(manualInputs.high);
    const low = parseFloat(manualInputs.low);
    const volume = parseFloat(manualInputs.volume);

    if ([open, close, high, low, volume].some(v => Number.isNaN(v))) {
      return null;
    }

    if (open <= 0 || high <= 0 || low <= 0 || volume <= 0) {
      return {
        error: 'Values must be positive numbers greater than zero.',
      };
    }

    const changePct = ((close - open) / open) * 100;
    const rangePct = ((high - low) / open) * 100;
    const volumeMillions = volume / 1_000_000;

    const isMomentumPositive = changePct >= 0.75;
    const isVolatilityHealthy = rangePct <= 6;
    const isVolumeSupportive = volume >= 500_000;

    const positiveSignals = [isMomentumPositive, isVolatilityHealthy, isVolumeSupportive].filter(Boolean).length;
    const confidence = 60 + positiveSignals * 10 - Math.max(0, rangePct - 4);
    const verdict = positiveSignals >= 2 ? 'Good' : 'Bad';

    return {
      verdict,
      changePct: Number(changePct.toFixed(2)),
      rangePct: Number(rangePct.toFixed(2)),
      volumeMillions: Number(volumeMillions.toFixed(2)),
      confidence: Math.max(30, Math.min(95, Number(confidence.toFixed(0)))),
      summary:
        verdict === 'Good'
          ? 'Trend and liquidity look supportive for a bullish stance.'
          : 'Signals point to elevated risk or weak demand. Consider waiting.',
      signals: {
        isMomentumPositive,
        isVolatilityHealthy,
        isVolumeSupportive,
      },
    };
  }, [manualInputs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Sidebar - Stock Selector */}
      <div className="lg:col-span-1 bg-secondary/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col h-[85vh]">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search Nifty 50..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filteredStocks.map(stock => (
            <button
              key={stock.symbol}
              onClick={() => setSelectedSymbol(stock.symbol)}
              className={`w-full text-left p-4 rounded-xl transition-all border ${
                selectedSymbol === stock.symbol 
                  ? 'bg-accent/10 border-accent/50 ring-1 ring-accent/20' 
                  : 'bg-slate-800/30 border-transparent hover:bg-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-bold ${selectedSymbol === stock.symbol ? 'text-accent' : 'text-slate-200'}`}>
                  {stock.symbol}
                </span>
                <span className={`text-xs font-mono ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stock.changePercent}%
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate">{stock.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Chart & Analysis */}
      <div className="lg:col-span-2 space-y-6 overflow-y-auto h-[85vh] pr-2 custom-scrollbar">
        {/* Header */}
        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6 flex justify-between items-end">
           <div>
              <h2 className="text-3xl font-bold text-white mb-1">{selectedStock.name}</h2>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">{selectedStock.sector}</span>
                <span className="text-sm">PE: <span className="text-slate-200">{selectedStock.peRatio}</span></span>
                <span className="text-sm">M.Cap: <span className="text-slate-200">{selectedStock.marketCap}</span></span>
              </div>
           </div>
           <div className="text-right">
              <div className="text-4xl font-bold font-mono text-white">₹{selectedStock.currentPrice.toLocaleString()}</div>
              <div className={`text-sm font-medium ${selectedStock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                 {selectedStock.change > 0 ? '+' : ''}{selectedStock.change} ({selectedStock.changePercent}%)
              </div>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
           <StockChart data={historicalData} />
        </div>

        {/* Manual OHLCV assessment */}
        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-2xl font-bold text-white">Manual Trade Check</h3>
              <p className="text-slate-400 text-sm">
                Input your observed OHLCV data for {selectedStock.symbol} to estimate trade quality.
              </p>
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-500 border border-slate-700 rounded-full px-3 py-1">
              Experimental
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {(['open','close','high','low','volume'] as ManualField[]).map(field => (
              <div key={field}>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">
                  {field === 'volume' ? 'Volume (shares)' : `${field.charAt(0).toUpperCase()}${field.slice(1)} (₹)`}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-slate-600"
                  placeholder={field === 'volume' ? '500000' : 'e.g. 2200'}
                  value={manualInputs[field]}
                  onChange={(e) => handleManualChange(field, e.target.value)}
                  min="0"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-700/60 rounded-2xl p-5">
              {investmentEvaluation ? (
                investmentEvaluation.error ? (
                  <p className="text-red-400 text-sm">{investmentEvaluation.error}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-slate-400">Model Verdict</p>
                        <p className={`text-3xl font-black ${investmentEvaluation.verdict === 'Good' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {investmentEvaluation.verdict === 'Good' ? 'Good Investment' : 'Risky Investment'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Confidence</p>
                        <p className="text-2xl font-bold text-white">{investmentEvaluation.confidence}%</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">{investmentEvaluation.summary}</p>
                  </>
                )
              ) : (
                <div className="text-slate-500 text-sm">
                  Enter all OHLCV fields to see the instant verdict.
                </div>
              )}
            </div>

            <div className="bg-slate-900/40 border border-slate-700/60 rounded-2xl p-5">
              <h4 className="text-sm text-slate-400 uppercase tracking-wider mb-3">Key Metrics</h4>
              {investmentEvaluation && !investmentEvaluation.error ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Price Change</p>
                    <p className="text-lg font-bold text-slate-100">{investmentEvaluation.changePct}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Intraday Range</p>
                    <p className="text-lg font-bold text-slate-100">{investmentEvaluation.rangePct}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Volume (Millions)</p>
                    <p className="text-lg font-bold text-slate-100">{investmentEvaluation.volumeMillions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Signals</p>
                    <p className="text-slate-300">
                      {investmentEvaluation.signals.isMomentumPositive ? '⬆ Momentum' : '⬇ Momentum'}
                      {' • '}
                      {investmentEvaluation.signals.isVolatilityHealthy ? 'Stable vol' : 'High vol'}
                      {' • '}
                      {investmentEvaluation.signals.isVolumeSupportive ? 'Strong flow' : 'Weak flow'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Metrics will appear after entering valid numbers.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAnalysis;