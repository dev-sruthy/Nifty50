import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { NIFTY_50_STOCKS, generateHistoricalData } from '../constants';
import { Stock } from '../types';
import StockChart from './StockChart';

const StockAnalysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(NIFTY_50_STOCKS[0].symbol);
  const [searchTerm, setSearchTerm] = useState('');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveChange, setLiveChange] = useState<number | null>(null);
  const [liveChangePercent, setLiveChangePercent] = useState<number | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

  const selectedStock = NIFTY_50_STOCKS.find(s => s.symbol === selectedSymbol) || NIFTY_50_STOCKS[0];

  // Fetch live quote whenever selected symbol changes
  useEffect(() => {
    let cancelled = false;

    const fetchQuote = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/quote/${selectedSymbol}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setLivePrice(data.price ?? null);
        setLiveChange(data.change ?? null);
        setLiveChangePercent(data.change_percent ?? null);
      } catch {
        if (!cancelled) {
          setLivePrice(null);
          setLiveChange(null);
          setLiveChangePercent(null);
        }
      }
    };

    fetchQuote();

    const id = setInterval(fetchQuote, 60_000); // refresh every 60s
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [API_BASE, selectedSymbol]);
  
  // Memoize historical data so it doesn't regenerate on every render, only when stock changes
  const historicalData = useMemo(() => {
    const base = livePrice ?? selectedStock.currentPrice;
    return generateHistoricalData(base);
  }, [selectedStock, livePrice]);

  const filteredStocks = NIFTY_50_STOCKS.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div className="text-4xl font-bold font-mono text-white">
                ₹{(livePrice ?? selectedStock.currentPrice).toLocaleString()}
              </div>
              <div
                className={`text-sm font-medium ${
                  (liveChangePercent ?? selectedStock.changePercent) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {(liveChange ?? selectedStock.change) > 0 ? '+' : ''}
                {(liveChange ?? selectedStock.change)} ({liveChangePercent ?? selectedStock.changePercent}%)
              </div>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
           <StockChart data={historicalData} />
        </div>
      </div>
    </div>
  );
};

export default StockAnalysis;