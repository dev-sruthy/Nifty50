import React, { useEffect, useMemo, useState } from 'react';
import { NIFTY_50_STOCKS } from '../../constants';
import { Stock } from '../../types';
import { useAuth } from '../context/AuthContext';

type Holding = {
  shares: number;
  avgCost: number;
};

type Transaction = {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  pnl: number;
  timestamp: string;
};

const formatCurrency = (val: number) =>
  `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const TradeSimulator = () => {
  const { user } = useAuth();
  const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

  const [selectedSymbol, setSelectedSymbol] = useState(NIFTY_50_STOCKS[0].symbol);
  const [shares, setShares] = useState(10);
  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
  const [holdings, setHoldings] = useState<Record<string, Holding>>({});
  const [realizedPnl, setRealizedPnl] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPortfolio = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/portfolio/${user.id}`);
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({})))?.detail || 'Failed to load portfolio';
        throw new Error(msg);
      }
      const data = await res.json();
      const holdingsRecord: Record<string, Holding> = {};
      (data.holdings ?? []).forEach((h: any) => {
        holdingsRecord[h.symbol] = { shares: h.shares, avgCost: h.avg_cost };
      });
      setHoldings(holdingsRecord);
      setTransactions(data.trades ?? []);
      setRealizedPnl(data.realized_pnl ?? 0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setHoldings({});
      setTransactions([]);
      setRealizedPnl(0);
      setNote('');
    }
  }, [user]);

  const selectedStock = useMemo<Stock | undefined>(
    () => NIFTY_50_STOCKS.find((s) => s.symbol === selectedSymbol),
    [selectedSymbol]
  );

  if (!selectedStock) {
    return <div className="text-slate-300">No stock selected</div>;
  }

  if (!user) {
    return (
      <div className="space-y-3 text-slate-300">
        <h2 className="text-2xl font-bold text-white">Trade Simulator</h2>
        <p className="text-slate-400">Please log in to place trades and view your portfolio.</p>
      </div>
    );
  }

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNote('');

    if (!user) {
      setError('Please log in to execute trades.');
      return;
    }

    if (loading) return;

    if (shares <= 0) {
      setError('Enter at least 1 share.');
      return;
    }

    const price = selectedStock.currentPrice;
    const key = selectedStock.symbol;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          symbol: key,
          type: mode,
          shares,
          price,
        }),
      });

      if (!res.ok) {
        const msg = (await res.json().catch(() => ({})))?.detail || 'Trade failed';
        throw new Error(msg);
      }

      const data = await res.json();
      const holdingsRecord: Record<string, Holding> = {};
      (data.holdings ?? []).forEach((h: any) => {
        holdingsRecord[h.symbol] = { shares: h.shares, avgCost: h.avg_cost };
      });

      setHoldings(holdingsRecord);
      setTransactions(data.trades ?? []);
      setRealizedPnl(data.realized_pnl ?? realizedPnl);
      setNote(
        `${mode === 'BUY' ? 'Bought' : 'Sold'} ${shares} ${key} @ ${formatCurrency(price)}`
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const holdingRows = useMemo(() => {
    return Object.entries(holdings).map(([symbol, h]) => {
      const stock = NIFTY_50_STOCKS.find((s) => s.symbol === symbol);
      const marketPrice = stock?.currentPrice ?? h.avgCost;
      const marketValue = marketPrice * h.shares;
      const cost = h.avgCost * h.shares;
      const unrealized = marketValue - cost;
      return { symbol, shares: h.shares, avgCost: h.avgCost, marketPrice, marketValue, cost, unrealized };
    });
  }, [holdings]);

  const totals = useMemo(() => {
    const invested = holdingRows.reduce((sum, row) => sum + row.cost, 0);
    const unrealized = holdingRows.reduce((sum, row) => sum + row.unrealized, 0);
    const totalPnl = realizedPnl + unrealized;
    return { invested, unrealized, realized: realizedPnl, totalPnl };
  }, [holdingRows, realizedPnl]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Trade Simulator</h2>
        <p className="text-slate-400">Mock buy/sell orders and track P&L instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6 lg:col-span-2">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleTrade}>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Stock</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 focus:border-accent focus:outline-none"
              >
                {NIFTY_50_STOCKS.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Shares</label>
              <input
                type="number"
                min={1}
                value={shares}
                onChange={(e) => setShares(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('BUY')}
                className={`flex-1 rounded-lg border px-3 py-2 font-semibold transition ${
                  mode === 'BUY'
                    ? 'bg-emerald-500 text-slate-900 border-emerald-500'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-emerald-500/60'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setMode('SELL')}
                className={`flex-1 rounded-lg border px-3 py-2 font-semibold transition ${
                  mode === 'SELL'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-red-400/60'
                }`}
              >
                SELL
              </button>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold py-2 rounded-lg transition"
              >
                Execute {mode === 'BUY' ? 'Buy' : 'Sell'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-sm text-slate-400">
            Current price: <span className="text-slate-200">{formatCurrency(selectedStock.currentPrice)}</span>
          </div>
          {error && (
            <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg p-3">
              {error}
            </div>
          )}
          {note && (
            <div className="mt-3 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-3">
              {note}
            </div>
          )}
        </div>

        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">P&L Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">Invested</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totals.invested)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">Realized P&L</p>
              <p className={`text-xl font-bold ${totals.realized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(totals.realized)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">Unrealized P&L</p>
              <p className={`text-xl font-bold ${totals.unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(totals.unrealized)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">Total P&L</p>
              <p className={`text-xl font-bold ${totals.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(totals.totalPnl)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Open Holdings</h3>
            <span className="text-xs text-slate-400">Market P&L updates with live prices</span>
          </div>
          {holdingRows.length === 0 ? (
            <p className="text-slate-400 text-sm">No open positions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-200">
                <thead className="text-xs uppercase text-slate-400 border-b border-slate-700/70">
                  <tr>
                    <th className="py-2 text-left">Symbol</th>
                    <th className="py-2 text-right">Shares</th>
                    <th className="py-2 text-right">Avg Cost</th>
                    <th className="py-2 text-right">Market</th>
                    <th className="py-2 text-right">Unrealized</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingRows.map((row) => (
                    <tr key={row.symbol} className="border-b border-slate-800/60 last:border-0">
                      <td className="py-2">{row.symbol}</td>
                      <td className="py-2 text-right">{row.shares}</td>
                      <td className="py-2 text-right">{formatCurrency(row.avgCost)}</td>
                      <td className="py-2 text-right">{formatCurrency(row.marketValue)}</td>
                      <td
                        className={`py-2 text-right ${
                          row.unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {formatCurrency(row.unrealized)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-secondary/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Recent Trades</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-slate-400 text-sm">No trades yet. Execute your first order.</p>
            ) : (
              transactions.slice(0, 12).map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">
                      {t.type} {t.symbol}
                    </span>
                    <span className="text-xs text-slate-400">{t.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      {t.shares} @ {formatCurrency(t.price)}
                    </span>
                    <span className={t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {t.type === 'BUY' ? '—' : formatCurrency(t.pnl)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeSimulator;

