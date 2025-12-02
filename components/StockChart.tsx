import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { HistoricalDataPoint } from '../types';

interface StockChartProps {
  data: HistoricalDataPoint[];
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
          <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
          <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#f1f5f9' }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: any, name: string) => {
               if (name === "close") return [`₹${value}`, "Price"];
               if (name === "volume") return [(value as number).toLocaleString(), "Volume"];
               return [value, name];
            }}
          />
          <Bar yAxisId="right" dataKey="volume" fill="#3b82f6" opacity={0.2} barSize={10} />
          <Area yAxisId="left" type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;