import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Plus, Trash2, Zap, ShieldCheck, TrendingUp, RefreshCw } from 'lucide-react';
import { NIFTY_50_STOCKS } from '../constants';
import { RiskProfile, PortfolioOptimizationResult } from '../types';
import { optimizePortfolio } from '../services/geminiService';

const PortfolioOptimizer = () => {
  const [portfolio, setPortfolio] = useState<{ symbol: string; amount: number }[]>([]);
  const [selectedStock, setSelectedStock] = useState(NIFTY_50_STOCKS[0].symbol);
  const [amount, setAmount] = useState(10000);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(RiskProfile.MODERATE);
  const [optimizationResult, setOptimizationResult] = useState<PortfolioOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const totalValue = portfolio.reduce((sum, item) => sum + item.amount, 0);

  const addToPortfolio = () => {
    if (portfolio.find(p => p.symbol === selectedStock)) return;
    setPortfolio([...portfolio, { symbol: selectedStock, amount }]);
    // Reset optimization when portfolio changes
    setOptimizationResult(null);
  };

  const removeFromPortfolio = (symbol: string) => {
    setPortfolio(portfolio.filter(p => p.symbol !== symbol));
    setOptimizationResult(null);
  };

  const handleOptimize = async () => {
    if (portfolio.length === 0) return;
    setLoading(true);
    
    // Calculate current allocations percentage
    const items = portfolio.map(p => ({
      symbol: p.symbol,
      currentAllocation: parseFloat(((p.amount / totalValue) * 100).toFixed(1)),
      amount: p.amount
    }));

    try {
      const result = await optimizePortfolio(items, riskProfile, totalValue);
      setOptimizationResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Colors for pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const currentData = portfolio.map(p => ({ name: p.symbol, value: p.amount }));
  
  const optimizedData = optimizationResult?.optimizedAllocation.map(p => ({
     name: p.symbol,
     value: (p.percentage / 100) * totalValue
  })) || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Builder */}
      <div className="space-y-6">
        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
           <h2 className="text-2xl font-bold text-white mb-4">Build Portfolio</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <div className="md:col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Stock</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                >
                  {NIFTY_50_STOCKS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol}</option>)}
                </select>
             </div>
             <div className="md:col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Investment (₹)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-sm"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
             </div>
             <div className="md:col-span-1 flex items-end">
                <button 
                  onClick={addToPortfolio}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add
                </button>
             </div>
           </div>

           <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
             {portfolio.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                  Add stocks to start building your portfolio
                </div>
             )}
             {portfolio.map((item) => (
               <div key={item.symbol} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
                  <div>
                    <span className="font-bold text-slate-200">{item.symbol}</span>
                    <div className="text-xs text-slate-500">₹{item.amount.toLocaleString()}</div>
                  </div>
                  <button 
                    onClick={() => removeFromPortfolio(item.symbol)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
               </div>
             ))}
           </div>
           
           <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center">
              <span className="text-slate-400">Total Value</span>
              <span className="text-2xl font-bold text-white">₹{totalValue.toLocaleString()}</span>
           </div>
        </div>

        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
           <h3 className="text-lg font-bold text-white mb-4">Optimization Settings</h3>
           <div className="flex gap-4 mb-6">
              {[RiskProfile.CONSERVATIVE, RiskProfile.MODERATE, RiskProfile.AGGRESSIVE].map(profile => (
                 <button
                    key={profile}
                    onClick={() => setRiskProfile(profile)}
                    className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium border transition-all ${
                      riskProfile === profile 
                      ? 'bg-accent text-white border-accent' 
                      : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700'
                    }`}
                 >
                    {profile}
                 </button>
              ))}
           </div>
           <button 
             onClick={handleOptimize}
             disabled={loading || portfolio.length === 0}
             className="w-full bg-gradient-to-r from-accent to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             {loading ? <RefreshCw className="animate-spin" /> : <Zap />}
             {loading ? 'Optimizing...' : 'Optimize Allocation'}
           </button>
        </div>
      </div>

      {/* Right: Results */}
      <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-white mb-6">Allocation Analysis</h2>
        
        {optimizationResult ? (
          <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2 text-center">Current</h4>
                   <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={currentData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                            {currentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }} />
                        </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div>
                   <h4 className="text-xs text-accent uppercase tracking-wider mb-2 text-center font-bold">Optimized</h4>
                   <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={optimizedData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                            {optimizedData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }} />
                        </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>

             <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-700/50">
                   <div className="text-center">
                      <div className="text-xs text-slate-500">Exp. Return</div>
                      <div className="text-lg font-bold text-emerald-400">{optimizationResult.expectedReturn}</div>
                   </div>
                   <div className="text-center border-l border-slate-700/50 border-r">
                      <div className="text-xs text-slate-500">Volatility</div>
                      <div className="text-lg font-bold text-amber-400">{optimizationResult.volatility}</div>
                   </div>
                   <div className="text-center">
                      <div className="text-xs text-slate-500">Sharpe Ratio</div>
                      <div className="text-lg font-bold text-blue-400">{optimizationResult.sharpeRatio}</div>
                   </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                   <span className="font-semibold text-accent">Analysis:</span> {optimizationResult.analysis}
                </p>
             </div>

             <div>
                <h4 className="font-bold text-slate-200 mb-3">Suggested Changes</h4>
                <div className="space-y-2">
                   {optimizationResult.optimizedAllocation.map((opt) => {
                      const current = portfolio.find(p => p.symbol === opt.symbol);
                      const currentPct = current ? ((current.amount / totalValue) * 100) : 0;
                      const diff = opt.percentage - currentPct;
                      
                      return (
                         <div key={opt.symbol} className="bg-slate-800/30 p-3 rounded-lg flex items-center justify-between text-sm border border-slate-700/30">
                            <div className="flex items-center gap-3">
                               <div className={`w-1 h-8 rounded ${diff > 0 ? 'bg-emerald-500' : diff < 0 ? 'bg-red-500' : 'bg-slate-500'}`} />
                               <div>
                                  <div className="font-bold text-slate-200">{opt.symbol}</div>
                                  <div className="text-xs text-slate-500">{opt.reason}</div>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="font-bold text-white">{opt.percentage}%</div>
                               <div className={`text-xs ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                               </div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl min-h-[300px]">
             <ShieldCheck size={48} className="mb-4 opacity-20" />
             <p>Add stocks and click "Optimize" to see portfolio recommendations</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default PortfolioOptimizer;