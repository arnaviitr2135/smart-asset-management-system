import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid 
} from 'recharts';
import { BarChart3, Database, Users, AlertTriangle, Compass, CheckCircle2, LineChart as LineIcon } from 'lucide-react';

const EMPTY_STATS = {
  totalInventory: 0,
  totalAssetsCount: 0,
  availableInventory: 0,
  allocatedInventory: 0,
  activeBookings: 0,
  overdueCount: 0,
  popularAssets: [],
  utilizationRates: [],
};

const AnalyticsDashboard: React.FC = () => {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsData, forecastData] = await Promise.all([
        apiFetch('/api/v1/analytics'),
        apiFetch('/api/v1/analytics/forecast'),
      ]);
      setStats(statsData && !Array.isArray(statsData) ? statsData : EMPTY_STATS);
      setForecasts(Array.isArray(forecastData) ? forecastData : []);
    } catch (err) {
      console.error('Failed to retrieve analytics datasets', err);
      setStats(EMPTY_STATS);
      setForecasts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !stats) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Formatting data for Recharts Pie Chart (Available vs Allocated Stock)
  const stockPieData = [
    { name: 'Available', value: stats.availableInventory },
    { name: 'Checked Out', value: stats.allocatedInventory },
  ];

  // Formatting popular assets for Bar Chart
  const popularAssetsData = stats.popularAssets.map((item: any) => ({
    name: item.name.length > 18 ? item.name.substring(0, 15) + '...' : item.name,
    bookings: item.bookingsCount,
    volume: item.totalQtyBooked,
  }));

  // Formatting category utilization rate averages
  const categoryDataMap: Record<string, { sum: number; count: number }> = {};
  stats.utilizationRates.forEach((item: any) => {
    if (!categoryDataMap[item.category]) {
      categoryDataMap[item.category] = { sum: 0, count: 0 };
    }
    categoryDataMap[item.category].sum += item.utilizationRate;
    categoryDataMap[item.category].count += 1;
  });

  const categoryUtilizationData = Object.keys(categoryDataMap).map((cat) => ({
    category: cat.replace('_', ' '),
    rate: Math.round(categoryDataMap[cat].sum / categoryDataMap[cat].count),
  }));

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div>
        <h2 className="text-2xl font-bold font-sans">Operational Analytics</h2>
        <p className="text-sm text-dark-400">Real-time resource utilization metrics and predictive inventory demand.</p>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-dark-850 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/10">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] text-dark-400 uppercase font-semibold">Total Stock Items</span>
            <span className="text-2xl font-extrabold text-white">{stats.totalInventory}</span>
            <span className="block text-[10px] text-dark-500 mt-0.5">{stats.totalAssetsCount} unique models</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-dark-850 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] text-dark-400 uppercase font-semibold">Asset Checkout Rate</span>
            <span className="text-2xl font-extrabold text-white">
              {stats.totalInventory > 0 ? Math.round((stats.allocatedInventory / stats.totalInventory) * 100) : 0}%
            </span>
            <span className="block text-[10px] text-dark-400 mt-0.5">
              <span className="text-indigo-400 font-semibold">{stats.allocatedInventory}</span> items currently checked out
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-dark-850 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] text-dark-400 uppercase font-semibold">Active Bookings</span>
            <span className="text-2xl font-extrabold text-white">{stats.activeBookings}</span>
            <span className="block text-[10px] text-dark-500 mt-0.5">Pending or Approved</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-dark-850 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/10">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] text-dark-400 uppercase font-semibold">Overdue Returns</span>
            <span className={`text-2xl font-extrabold ${stats.overdueCount > 0 ? 'text-red-400' : 'text-white'}`}>
              {stats.overdueCount}
            </span>
            <span className="block text-[10px] text-dark-500 mt-0.5">Requires immediate attention</span>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Stock Allocation Split (Pie) */}
        <div className="glass-panel p-5 rounded-2xl border border-dark-850 flex flex-col justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-dark-400 mb-4 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-brand-400" /> Current Stock Distribution
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1c23', border: '1px solid #383c48', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Top Borrowed Assets (Bar) */}
        <div className="glass-panel p-5 rounded-2xl border border-dark-850 lg:col-span-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-dark-400 mb-4 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-brand-400" /> Most Frequently Borrowed Assets
          </h3>
          {popularAssetsData.length === 0 ? (
            <p className="text-xs text-dark-400 text-center py-24">No bookings logged yet for metrics charts.</p>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularAssetsData}>
                  <XAxis dataKey="name" stroke="#5b6070" fontSize={10} tickLine={false} />
                  <YAxis stroke="#5b6070" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1c23', border: '1px solid #383c48', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Times Borrowed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart C: Category Utilization (Line/Bar) */}
        <div className="glass-panel p-5 rounded-2xl border border-dark-850 lg:col-span-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-dark-400 mb-4 flex items-center gap-1.5">
            <LineIcon className="w-4 h-4 text-indigo-400" /> Category Utilization Rates (%)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={categoryUtilizationData}>
                <CartesianGrid stroke="#262932" strokeDasharray="3 3" />
                <XAxis dataKey="category" stroke="#5b6070" fontSize={10} tickLine={false} />
                <YAxis stroke="#5b6070" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1c23', border: '1px solid #383c48', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2.5} name="Utilization %" activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI DEMAND FORECASTING (Highest ROI / Bonus) */}
      <div className="glass-panel p-6 rounded-2xl border border-dark-850/80 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-dark-100 font-sans flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
            </span>
            AI-Based Demand Prediction & Shortage Forecasting
          </h3>
          <p className="text-xs text-dark-400 mt-1 leading-relaxed">
            Uses a weighted moving average algorithm over the past 3 weeks of society bookings to predict upcoming resource demand. Highlighted items indicate high shortage risk.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-dark-800 text-dark-400 uppercase tracking-widest text-[9px] font-bold">
                <th className="py-3 px-2">Asset Model Name</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">W-3 Demand</th>
                <th className="py-3 px-2">W-2 Demand</th>
                <th className="py-3 px-2">W-1 Demand</th>
                <th className="py-3 px-2 font-bold text-brand-300">Predicted Demand (Next Week)</th>
                <th className="py-3 px-2 text-right">Shortage Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-850/40 font-sans">
              {forecasts.map((forecast) => {
                const assetModel = stats.utilizationRates.find((u: any) => u.id === forecast.id);
                const totalAvailable = assetModel ? assetModel.total : 1;
                const ratio = forecast.predictedDemand / totalAvailable;

                let riskLevel = 'LOW';
                let riskClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                if (ratio >= 0.8) {
                  riskLevel = 'CRITICAL SHORTAGE';
                  riskClass = 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse';
                } else if (ratio >= 0.5) {
                  riskLevel = 'MODERATE';
                  riskClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                }

                return (
                  <tr key={forecast.id} className="hover:bg-dark-900/10">
                    <td className="py-3.5 px-2 font-semibold text-dark-100">{forecast.name}</td>
                    <td className="py-3.5 px-2 uppercase text-[10px] text-dark-400">{forecast.category.replace('_', ' ')}</td>
                    <td className="py-3.5 px-2 text-dark-400">{forecast.w3Quantity}x</td>
                    <td className="py-3.5 px-2 text-dark-400">{forecast.w2Quantity}x</td>
                    <td className="py-3.5 px-2 text-dark-400">{forecast.w1Quantity}x</td>
                    <td className="py-3.5 px-2 font-bold text-brand-300 text-sm">{forecast.predictedDemand}x</td>
                    <td className="py-3.5 px-2 text-right">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${riskClass}`}>
                        {riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
