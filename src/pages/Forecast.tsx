import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { RefreshCw, TrendingUp, AlertCircle } from "lucide-react";
import { NIFTY_50_STOCKS } from "../../constants";

const Forecast: React.FC = () => {
  const [symbol, setSymbol] = useState("NIFTY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any | null>(null);

  const fetchForecast = async () => {
    if (!symbol.trim()) {
      setError("Please enter a stock symbol");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(`http://localhost:8000/api/forecast/${symbol.trim().toUpperCase()}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${res.status} ${res.statusText}`);
      }
      
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Cannot connect to backend. Please make sure the server is running on http://localhost:8000");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      console.error("Forecast error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data (Recharts format)
  const chartData =
    data
      ? [
          // Historical section
          ...(data.history_dates || []).map((date: string, i: number) => ({
            date,
            actual: data.history_prices?.[i],
            forecast: null,
          })),
          // Forecast section
          ...(data.dates || []).map((date: string, i: number) => ({
            date,
            actual: null,
            forecast: data.prices?.[i],
          })),
        ]
      : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <TrendingUp className="text-accent" size={32} />
          AI-Powered Stock Forecast
        </h2>
        <p className="text-slate-400">Get AI-generated forecasts for any Nifty 50 stock (or the NIFTY index)</p>
      </div>

      {/* Symbol Selector */}
      <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-2">Stock Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-accent transition-colors"
              disabled={loading}
            >
              <option value="NIFTY">NIFTY — Nifty 50 Index</option>
              {NIFTY_50_STOCKS.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchForecast}
            disabled={loading || !symbol.trim()}
            className="bg-gradient-to-r from-accent to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <TrendingUp size={18} />}
            {loading ? 'Forecasting...' : 'Forecast'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-accent" size={48} />
          <p className="text-slate-400">Loading AI forecast... This may take a moment.</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-red-400 font-bold mb-2">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
              {error.includes("Cannot connect to backend") && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">To start the backend server:</p>
                  <code className="text-xs text-slate-300 bg-slate-900 p-2 rounded block">
                    cd backend<br />
                    python -m uvicorn main:app --reload --port 8000
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chart + Explanation */}
      {data && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* CHART CARD */}
          <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-4">📊 Price History & Forecast</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#f1f5f9' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: any, name: any) => [
                      `₹${Number(value).toLocaleString()}`,
                      name, // "Actual Price" or "Predicted Price" from the <Line name> prop
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={false}
                    name="Actual Price"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                    name="Predicted Price"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI EXPLANATION CARD */}
          <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="text-accent" size={20} />
              AI Market Summary
            </h3>
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {data.explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecast;
