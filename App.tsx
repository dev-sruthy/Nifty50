import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, LineChart, PieChart, Menu, X, TrendingUp, Activity, BarChart3, ArrowLeftRight } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StockAnalysis from './components/StockAnalysis';
import PortfolioOptimizer from './components/PortfolioOptimizer';
import Forecast from './src/pages/Forecast';
import Login from './src/pages/Login';
import Register from './src/pages/Register';
import TradeSimulator from './src/pages/TradeSimulator';
import { useAuth } from './src/context/AuthContext';

const NavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-accent/20 text-accent border border-accent/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary/95 backdrop-blur-xl border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
      <div className="flex items-center gap-2">
        <div className="bg-accent p-2 rounded-lg">
          <TrendingUp className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">NiftyAI</h1>
          <p className="text-xs text-slate-500 font-mono">NIFTY 50 ANALYTICS</p>
        </div>
      </div>
      <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
        <X size={24} />
      </button>
    </div>
    
    <nav className="p-4 space-y-2 mt-4">
      <NavLink to="/" icon={LayoutDashboard} label="Market Dashboard" />
      <NavLink to="/analysis" icon={LineChart} label="Stock Analysis" />
      <NavLink to="/portfolio" icon={PieChart} label="Portfolio Optimizer" />
      <NavLink to="/forecast" icon={BarChart3} label="Stock Forecast" />
      <NavLink to="/trade" icon={ArrowLeftRight} label="Trade Simulator" />
    </nav>

    <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-700/50">
       <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2 text-accent">
            <Activity size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Live Status</span>
          </div>
          <p className="text-xs text-slate-400">AI Engine: <span className="text-emerald-400">Online</span></p>
          <p className="text-xs text-slate-400">Market Data: <span className="text-emerald-400">Simulated</span></p>
       </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-slate-300">Checking session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-primary text-slate-100 font-sans selection:bg-accent/30 selection:text-accent">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="lg:ml-64 transition-all duration-300">
          <header className="sticky top-0 z-40 backdrop-blur-md bg-primary/80 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between lg:hidden">
             <div className="flex items-center gap-2">
                <div className="bg-accent p-1.5 rounded-md">
                  <TrendingUp className="text-white" size={20} />
                </div>
                <span className="font-bold text-lg">NiftyAI</span>
             </div>
             <div className="flex items-center gap-3">
               {user && (
                 <button
                   onClick={logout}
                   className="px-3 py-1 text-sm rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700"
                 >
                   Logout
                 </button>
               )}
               <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
                  <Menu size={24} />
               </button>
             </div>
          </header>

          <main className="p-4 lg:p-8 max-w-7xl mx-auto">
            {user && (
              <div className="hidden lg:flex justify-end mb-4">
                <div className="flex items-center gap-3 bg-secondary/50 border border-slate-700/50 rounded-xl px-4 py-2">
                  <div className="text-sm text-slate-300">{user.email}</div>
                  <button
                    onClick={logout}
                    className="px-3 py-1 text-sm rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analysis"
                element={
                  <ProtectedRoute>
                    <StockAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolio"
                element={
                  <ProtectedRoute>
                    <PortfolioOptimizer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forecast"
                element={
                  <ProtectedRoute>
                    <Forecast />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trade"
                element={
                  <ProtectedRoute>
                    <TradeSimulator />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;