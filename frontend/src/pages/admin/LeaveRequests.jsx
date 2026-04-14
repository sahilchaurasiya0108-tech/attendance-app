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

function LeaveRequestCard({ req, onApprove, onReject }) {
  const [adminNote, setAdminNote] = useState('');
  const [actioning, setActioning] = useState(false);
  const type = LEAVE_TYPES.find(t => t.value === req.leaveType);

  const handleApprove = async () => {
    setActioning(true);
    await onApprove(req._id, adminNote);
    setActioning(false);
  };

  const handleReject = async () => {
    setActioning(true);
    await onReject(req._id, adminNote);
    setActioning(false);
  };

  return (
    <div className="card p-5 space-y-4 animate-fade-in">
      {/* Employee + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-500 font-bold text-sm flex-shrink-0">
            {req.userName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{req.userName}</p>
            <p className="text-xs text-gray-500">{req.userEmail}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[req.status]}`}>
            {req.status.toUpperCase()}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${type?.bg} ${type?.color}`}>
            {type?.label || req.leaveType}
          </span>
        </div>
      </div>

      {/* Date range + days */}
      <div className="bg-surface border border-surface-border rounded-xl p-3">
        <div className="flex items-center gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-600 mb-0.5">From</p>
            <p className="text-gray-200 font-medium">{fmtDate(req.startDate)}</p>
          </div>
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <div>
            <p className="text-xs text-gray-600 mb-0.5">To</p>
            <p className="text-gray-200 font-medium">{fmtDate(req.endDate)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-600 mb-0.5">Working Days</p>
            <p className="font-display font-bold text-2xl text-brand-500">{req.totalDays}</p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-surface border border-surface-border rounded-xl p-3">
        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Reason</p>
        <p className="text-sm text-gray-300">{req.reason}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Submitted {fmtCreated(req.createdAt)}</span>
        {req.approvedByName && (
          <span>Actioned by <span className="text-gray-400">{req.approvedByName}</span></span>
        )}
      </div>

      {/* Admin actions for pending */}
      {req.status === 'pending' && (
        <div className="border-t border-surface-border pt-4 space-y-3">
          <div>
            <label className="label block mb-1.5">Note to Employee (optional)</label>
            <input
              type="text"
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="e.g. Approved, please handover tasks"
              className="input w-full text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={actioning}
              className="btn-danger flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {actioning ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={actioning}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {actioning ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              Approve ({req.totalDays}d)
            </button>
          </div>
        </div>
      )}

      {/* Resolved info */}
      {req.status !== 'pending' && req.adminNote && (
        <div className="bg-surface border border-surface-border rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Admin Note</p>
          <p className="text-sm text-gray-300 italic">"{req.adminNote}"</p>
        </div>
      )}
    </div>
  );
}

// Mini summary bar at top
function SummaryBar({ requests }) {
  const pending  = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').reduce((s, r) => s + r.totalDays, 0);
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Pending', value: pending, color: 'text-amber-400' },
        { label: 'Approved Days (shown)', value: approved, color: 'text-emerald-400' },
        { label: 'Total Shown', value: requests.length, color: 'text-brand-500' },
      ].map(({ label, value, color }) => (
        <div key={label} className="card p-3 text-center">
          <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminLeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leave/requests${filter ? `?status=${filter}` : ''}`);
      setRequests(data.requests || []);
    } catch {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id, adminNote) => {
    try {
      const { data } = await api.put(`/leave/requests/${id}/approve`, { adminNote });
      toast.success(data.message || 'Leave approved');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id, adminNote) => {
    try {
      await api.put(`/leave/requests/${id}/reject`, { adminNote });
      toast.success('Leave rejected');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const filterTabs = [
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: '',         label: 'All' },
  ];

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Leave Requests
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Approve or reject employee leave applications. Approved leaves automatically update attendance.
        </p>
      </div>

      {/* Summary */}
      {!loading && <SummaryBar requests={requests} />}

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

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : requests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-surface-border flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No {filter || ''} leave requests</p>
          <p className="text-gray-600 text-sm mt-1">Employee leave applications will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <LeaveRequestCard key={req._id} req={req} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}
    </div>
  );
}