import React, { useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { NIFTY_50_STOCKS, generateHistoricalData } from '../constants';
import { Stock } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Helper for card
const StatCard = ({ title, value, change, isPositive, icon: Icon }: any) => (
  <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6 hover:border-accent/30 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-accent/10 transition-colors">
        <Icon className="text-slate-400 group-hover:text-accent transition-colors" size={24} />
      </div>
      <span className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {change}%
      </span>
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
  </div>
);

const StockRow = ({ stock }: { stock: Stock }) => {
  const isPositive = stock.changePercent >= 0;
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-800/50 rounded-xl transition-colors border-b border-slate-800/50 last:border-0 group cursor-default">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 group-hover:bg-accent group-hover:text-white transition-all">
          {stock.symbol.substring(0, 2)}
        </div>
        <div>
          <h4 className="font-semibold text-slate-200 group-hover:text-accent transition-colors">{stock.symbol}</h4>
          <p className="text-xs text-slate-500">{stock.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono font-medium text-slate-200">₹{stock.currentPrice.toLocaleString()}</p>
        <p className={`text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent}%)
        </p>
      </div>
    </div>
  );
};

type RangeOption = '1D' | '1W' | '1M';

const BASE_INDEX_PRICE = 22280.5;

const Dashboard = () => {
  const [activeRange, setActiveRange] = useState<RangeOption>('1D');

  const intradayData = useMemo(() => ([
    { name: '9:15', value: 22100 },
    { name: '10:00', value: 22150 },
    { name: '11:00', value: 22120 },
    { name: '12:00', value: 22180 },
    { name: '13:00', value: 22250 },
    { name: '14:00', value: 22210 },
    { name: '15:30', value: 22280 },
  ]), []);

  const buildRangeData = (days: number) => {
    const raw = generateHistoricalData(BASE_INDEX_PRICE, days);
    const trimmed = raw.slice(-days);
    return trimmed.map(point => {
      const d = new Date(point.date);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return { name: label, value: point.close };
    });
  };

  const weeklyData = useMemo(() => buildRangeData(7), []);
  const monthlyData = useMemo(() => buildRangeData(30), []);

  const rangeDataMap: Record<RangeOption, { name: string; value: number }[]> = {
    '1D': intradayData,
    '1W': weeklyData,
    '1M': monthlyData,
  };

  const indexData = rangeDataMap[activeRange];

  const topGainers = [...NIFTY_50_STOCKS].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const topLosers = [...NIFTY_50_STOCKS].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Market Overview</h2>
        <p className="text-slate-400">Real-time insights into Nifty 50 performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Nifty 50" value="22,280.50" change="0.85" isPositive={true} icon={Activity} />
        <StatCard title="Sensex" value="73,450.20" change="0.72" isPositive={true} icon={BarChart3} />
        <StatCard title="Bank Nifty" value="47,120.00" change="-0.23" isPositive={false} icon={DollarSign} />
        <StatCard title="India VIX" value="13.45" change="-1.20" isPositive={true} icon={Activity} />
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-100">Nifty 50 Index Trend</h3>
            <div className="flex gap-2">
              {(['1D','1W','1M'] as RangeOption[]).map(range => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    activeRange === range 
                      ? 'bg-accent text-white shadow-[0_0_12px_rgba(59,130,246,0.45)]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={indexData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Gainers List */}
        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-slate-100 mb-6">Top Gainers</h3>
          <div className="space-y-1">
            {topGainers.map(stock => <StockRow key={stock.symbol} stock={stock} />)}
          </div>
        </div>
      </div>
      
      {/* Top Losers List (Optional Bottom Section) */}
      <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
         <h3 className="text-xl font-bold text-slate-100 mb-6">Top Losers</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topLosers.map(stock => (
               <div key={stock.symbol} className="bg-slate-800/30 p-4 rounded-xl flex justify-between items-center border border-slate-700/30">
                  <div>
                     <div className="font-bold text-slate-200">{stock.symbol}</div>
                     <div className="text-sm text-slate-500">{stock.sector}</div>
                  </div>
                  <div className="text-right">
                     <div className="text-red-400 font-mono font-bold">{stock.changePercent}%</div>
                     <div className="text-xs text-slate-500">₹{stock.currentPrice}</div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;