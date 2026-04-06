import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import StatusBadge from '../../components/common/StatusBadge';
import {
  enablePushNotifications,
  notifyNewCheckIn,
  notifyLowAttendance,
} from '../../services/notifications';

const fmt = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtH = (h) => { if (!h) return '—'; const hrs = Math.floor(h); const min = Math.round((h - hrs) * 60); return `${hrs}h ${min}m`; };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Group records by date for day-wise view
function groupByDate(records) {
  const map = {};
  for (const r of records) {
    if (!map[r.date]) map[r.date] = [];
    map[r.date].push(r);
  }
  // Sort dates descending
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function AdminAttendance() {
  const now = new Date();
  const [month, setMonth]     = useState(now.getMonth() + 1);
  const [year, setYear]       = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);
  const [total, setTotal]     = useState(0);
  const [view, setView]       = useState('list'); // 'list' | 'daywise'
  const [expandedDate, setExpandedDate] = useState(null);

  // Track previous check-in count for push notifications
  const [prevCheckedIn, setPrevCheckedIn] = useState(null);

  useEffect(() => {
    api.get('/users').then(({ data }) => setEmployees(data.users)).catch(() => {});
    enablePushNotifications();
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      // BUG FIX: Use actual last day of month
      const lastDay = new Date(year, month, 0).getDate();
      const params = { month, year, limit: 200 };
      if (selectedEmployee) params.userId = selectedEmployee;
      const { data } = await api.get('/admin/attendance', { params });
      setRecords(data.records);
      setTotal(data.total);

      // Push notification if new check-ins appeared (live mode for today)
      const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
      if (isCurrentMonth && prevCheckedIn !== null) {
        const todayStr = now.toISOString().split('T')[0];
        const todayChecked = data.records.filter(r => r.date === todayStr && r.checkInTime);
        if (todayChecked.length > prevCheckedIn) {
          const newest = todayChecked[todayChecked.length - 1];
          notifyNewCheckIn(newest?.userId?.name || 'Someone', newest?.status);
        }
        // Low attendance alert
        const totalEmp = employees.length || 1;
        const pct = Math.round((todayChecked.length / totalEmp) * 100);
        if (pct < 50 && prevCheckedIn === 0) notifyLowAttendance(pct);
        setPrevCheckedIn(todayChecked.length);
      } else if (prevCheckedIn === null) {
        const todayStr = now.toISOString().split('T')[0];
        const todayCount = data.records.filter(r => r.date === todayStr && r.checkInTime).length;
        setPrevCheckedIn(todayCount);
      }
    } catch {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [month, year, selectedEmployee, employees, prevCheckedIn]);

  useEffect(() => { fetchRecords(); }, [month, year, selectedEmployee]);

  // Auto-refresh every 60s for live updates
  useEffect(() => {
    const interval = setInterval(fetchRecords, 60000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/attendance/export', { params: { month, year }, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${year}-${month}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const present = records.filter(r => r.status === 'present').length;
  const late    = records.filter(r => r.status === 'late').length;
  const dayGroups = groupByDate(records);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <h1 className="page-title">Attendance Records</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="input col-span-2 md:col-span-1" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
          <option value="">All Employees</option>
          {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'list' ? 'bg-brand-500/20 text-brand-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          📋 All Records
        </button>
        <button
          onClick={() => setView('daywise')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'daywise' ? 'bg-brand-500/20 text-brand-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          📅 Day-wise
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <p className="text-2xl font-display font-bold text-emerald-400">{present}</p>
          <p className="text-xs text-gray-400">Present</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-display font-bold text-amber-400">{late}</p>
          <p className="text-xs text-gray-400">Late</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-display font-bold text-gray-300">{total}</p>
          <p className="text-xs text-gray-400">Total Records</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : view === 'daywise' ? (
        /* ── Day-wise View ── */
        <div className="space-y-3">
          {dayGroups.length === 0 && (
            <div className="card p-10 text-center text-gray-400">No records for this period</div>
          )}
          {dayGroups.map(([date, dayRecords]) => {
            const dayPresent = dayRecords.filter(r => r.status === 'present').length;
            const dayLate    = dayRecords.filter(r => r.status === 'late').length;
            const isExpanded = expandedDate === date;
            const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
            });
            const isSunday = new Date(date + 'T00:00:00').getDay() === 0;

            return (
              <div key={date} className="card overflow-hidden">
                {/* Day header — clickable to expand */}
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-surface-hover transition-colors"
                  onClick={() => setExpandedDate(isExpanded ? null : date)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display font-bold
                      ${isSunday ? 'bg-brand-600/15 text-brand-600' : 'bg-brand-500/15 text-brand-300'}`}>
                      {new Date(date + 'T00:00:00').getDate()}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm">{dayLabel}</p>
                      {isSunday && <p className="text-xs text-brand-600">☀️ Sunday</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 text-xs">
                      <span className="text-emerald-400 font-semibold">{dayPresent}P</span>
                      <span className="text-amber-400 font-semibold">{dayLate}L</span>
                      <span className="text-gray-400">{dayRecords.length} total</span>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded employee list */}
                {isExpanded && (
                  <div className="border-t border-surface-border divide-y divide-surface-border">
                    {dayRecords.map(r => (
                      <div key={r._id} className="px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300">
                            {r.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">{r.userId?.name || '—'}</p>
                            <p className="text-xs text-gray-500">{r.userId?.department || ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-emerald-400 font-mono">{fmt(r.checkInTime)}</p>
                            <p className="text-xs text-amber-400 font-mono">{fmt(r.checkOutTime)}</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-brand-500 font-mono">{fmtH(r.workHours)}</p>
                          </div>
                          <StatusBadge status={r.checkInTime ? r.status : 'absent'} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <>
          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Employee','Date','Status','Check In','Check Out','Work Hours'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {records.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No records found</td></tr>
                )}
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-200">{r.userId?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{r.userId?.department || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.checkInTime ? r.status : 'absent'} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-400">{fmt(r.checkInTime)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-amber-400">{fmt(r.checkOutTime)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-500">{fmtH(r.workHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {records.length === 0 && <div className="card p-10 text-center text-gray-400">No records found</div>}
            {records.map(r => (
              <div key={r._id} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{r.userId?.name || '—'}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <StatusBadge status={r.checkInTime ? r.status : 'absent'} />
                </div>
                {r.checkInTime && (
                  <div className="grid grid-cols-3 gap-2 text-center bg-surface-DEFAULT rounded-xl p-2.5">
                    <div><p className="text-[10px] text-gray-500">IN</p><p className="font-mono text-xs text-emerald-400">{fmt(r.checkInTime)}</p></div>
                    <div className="border-x border-surface-border"><p className="text-[10px] text-gray-500">OUT</p><p className="font-mono text-xs text-amber-400">{fmt(r.checkOutTime)}</p></div>
                    <div><p className="text-[10px] text-gray-500">HRS</p><p className="font-mono text-xs text-brand-500">{fmtH(r.workHours)}</p></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}