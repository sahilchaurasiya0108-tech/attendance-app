import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const LEAVE_TYPES = [
  { value: 'sick',    label: 'Sick Leave',    color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/25' },
  { value: 'casual',  label: 'Casual Leave',  color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/25' },
  { value: 'earned',  label: 'Earned Leave',  color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/25' },
  { value: 'unpaid',  label: 'Unpaid Leave',  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/25' },
  { value: 'other',   label: 'Other',         color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/25' },
];

const STATUS_STYLES = {
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/25',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/25',
};

const fmtDate = (d) => d
  ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

const fmtCreated = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

// Count Mon–Sat working days between two date strings
const countWorkingDays = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr + 'T00:00:00');
  const end   = new Date(endStr   + 'T00:00:00');
  if (start > end) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

function LeaveTypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {LEAVE_TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 text-left
            ${value === t.value
              ? `${t.bg} ${t.color} shadow-sm`
              : 'bg-surface border-surface-border text-gray-500 hover:text-gray-300 hover:border-gray-600'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function LeaveCard({ leave, onCancel }) {
  const type = LEAVE_TYPES.find(t => t.value === leave.leaveType);
  return (
    <div className="card p-5 space-y-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${type?.bg} ${type?.color}`}>
            {type?.label || leave.leaveType}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[leave.status]}`}>
            {leave.status.toUpperCase()}
          </span>
        </div>
        <span className="text-xs text-gray-600 flex-shrink-0">{fmtCreated(leave.createdAt)}</span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-600 mb-0.5">From</p>
          <p className="text-gray-200 font-medium">{fmtDate(leave.startDate)}</p>
        </div>
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        <div>
          <p className="text-xs text-gray-600 mb-0.5">To</p>
          <p className="text-gray-200 font-medium">{fmtDate(leave.endDate)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-600 mb-0.5">Days</p>
          <p className="font-display font-bold text-xl text-brand-500">{leave.totalDays}</p>
        </div>
      </div>

      <div className="bg-surface border border-surface-border rounded-xl p-3">
        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Reason</p>
        <p className="text-sm text-gray-300">{leave.reason}</p>
      </div>

      {leave.adminNote && (
        <div className="bg-surface border border-surface-border rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Admin Note</p>
          <p className="text-sm text-gray-300 italic">"{leave.adminNote}"</p>
        </div>
      )}

      {leave.status === 'pending' && (
        <button
          onClick={() => onCancel(leave._id)}
          className="btn-danger w-full text-sm py-2"
        >
          Cancel Request
        </button>
      )}
    </div>
  );
}

export default function LeavePage() {
  const [leaves, setLeaves]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter]     = useState('');
  const [totalApproved, setTotalApproved] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [reason, setReason]       = useState('');

  const previewDays = countWorkingDays(startDate, endDate);
  const curYear = new Date().getFullYear();

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leave/my-leaves?year=${curYear}${filter ? `&status=${filter}` : ''}`);
      setLeaves(data.leaves || []);
      setTotalApproved(data.totalApprovedDays || 0);
    } catch {
      toast.error('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  }, [filter, curYear]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    if (previewDays === 0) {
      toast.error('Selected range has no working days');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/leave/request', { leaveType, startDate, endDate, reason });
      toast.success('Leave request submitted!');
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('sick');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await api.delete(`/leave/${id}`);
      toast.success('Request cancelled');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const filterTabs = [
    { key: '',         label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
          opacity: 0.8;
          cursor: pointer;
        }
        input[type="date"] {
          color-scheme: dark;
        }
      `}</style>

      <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Leave Requests
            </h1>
            <p className="text-gray-500 text-sm mt-1">{curYear} · <span className="text-emerald-400 font-semibold">{totalApproved} day{totalApproved !== 1 ? 's' : ''}</span> approved so far</p>
          </div>
          <button
            onClick={() => setShowForm(f => !f)}
            className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Request
          </button>
        </div>

        {/* New Request Form */}
        {showForm && (
          <div className="card p-6 space-y-5 animate-fade-in border-brand-500/30">
            <h2 className="font-display font-bold text-white text-base">Apply for Leave</h2>

            {/* Leave type */}
            <div>
              <p className="label mb-2">Leave Type</p>
              <LeaveTypeSelector value={leaveType} onChange={setLeaveType} />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1.5">From</label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={e => setStartDate(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label block mb-1.5">To</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={e => setEndDate(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Day preview */}
            {startDate && endDate && (
              <div className={`rounded-xl p-3 border text-sm font-semibold text-center transition-all
                ${previewDays > 0
                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-500'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {previewDays > 0
                  ? `${previewDays} working day${previewDays !== 1 ? 's' : ''} (Mon–Sat, Sundays excluded)`
                  : 'No working days in this range'}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="label block mb-1.5">Reason</label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Brief reason for leave..."
                className="input w-full resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-gray-400 hover:text-gray-200 text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || previewDays === 0}
                className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {submitting ? <Spinner size="sm" /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                Submit Request
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${filter === key
                  ? 'bg-brand-500 text-black shadow-glow'
                  : 'bg-surface-card border border-surface-border text-gray-400 hover:text-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Leave cards */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : leaves.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-surface-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No {filter || ''} leave requests</p>
            <p className="text-gray-600 text-sm mt-1">Tap "New Request" to apply for leave</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaves.map(l => <LeaveCard key={l._id} leave={l} onCancel={handleCancel} />)}
          </div>
        )}
      </div>
    </>
  );
}