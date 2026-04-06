import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import StatusBadge from '../../components/common/StatusBadge';

const fmt = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

function StatCard({ label, value, sub, color = 'brand' }) {
  const colors = {
    brand:   'from-brand-500/20 to-brand-600/10 border-brand-500/20 text-brand-300',
    green:   'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-300',
    amber:   'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-300',
    red:     'from-red-500/20 to-red-600/10 border-red-500/20 text-red-300',
  };
  return (
    <div className={`card p-4 bg-gradient-to-br ${colors[color]} animate-fade-in`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-display font-bold ${colors[color].split(' ').pop()}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setDashboard(data.dashboard);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); const t = setInterval(fetchDashboard, 60000); return () => clearInterval(t); }, [fetchDashboard]);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

  const attendancePct = dashboard?.totalEmployees > 0
    ? Math.round((dashboard.checkedIn / dashboard.totalEmployees) * 100) : 0;

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">{today}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Employees" value={dashboard?.totalEmployees} color="brand" />
        <StatCard label="Present Today" value={dashboard?.present} color="green" />
        <StatCard label="Late Today" value={dashboard?.late} color="amber" />
        <StatCard label="Absent Today" value={dashboard?.absent} color="red" />
      </div>

      {/* Attendance rate */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title">Today's Attendance Rate</p>
          <span className="font-display font-bold text-2xl text-gradient">{attendancePct}%</span>
        </div>
        <div className="w-full bg-surface-border rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-1000"
            style={{ width: `${attendancePct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{dashboard?.checkedIn} checked in</span>
          <span>{dashboard?.totalEmployees} total</span>
        </div>
      </div>

      {/* Live feed */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="glow-dot" />
          <p className="section-title">Live Check-in Feed</p>
        </div>
        {dashboard?.liveFeed?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No check-ins yet today</p>
        ) : (
          <div className="space-y-3">
            {dashboard?.liveFeed?.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-surface-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300">
                    {item.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={item.status} />
                  <p className="text-xs text-gray-500 mt-1 font-mono">{fmt(item.checkInTime)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avg work hours */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="label mb-1">Avg Work Hours Today</p>
          <p className="font-display font-bold text-3xl text-white">{dashboard?.avgWorkHours || 0} <span className="text-lg font-sans text-gray-400">hrs</span></p>
        </div>
        <div className="w-14 h-14 rounded-full border-4 border-brand-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
