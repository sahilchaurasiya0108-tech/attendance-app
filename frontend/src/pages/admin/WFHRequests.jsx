import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function RequestCard({ req, onApprove, onReject }) {
  const [approvalDays, setApprovalDays] = useState(req.daysRequested || 1);
  const [actioning, setActioning] = useState(false);

  const handleApprove = async () => {
    setActioning(true);
    await onApprove(req._id, approvalDays);
    setActioning(false);
  };

  const handleReject = async () => {
    setActioning(true);
    await onReject(req._id);
    setActioning(false);
  };

  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/25',
  };

  return (
    <div className="card p-5 space-y-4 animate-fade-in">
      {/* Employee info */}
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
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[req.status] || statusColors.pending}`}>
          {req.status?.toUpperCase()}
        </span>
      </div>

      {/* Location */}
      <div className="bg-surface border border-surface-border rounded-xl p-3">
        <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Requested Location</p>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-mono text-sm text-gray-200">
            {req.latitude?.toFixed(5)}, {req.longitude?.toFixed(5)}
          </span>
        </div>
        {req.accuracy && <p className="text-xs text-gray-600 mt-1 ml-6">Accuracy: ±{Math.round(req.accuracy)}m</p>}
        <a
          href={`https://www.google.com/maps?q=${req.latitude},${req.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-500 transition-colors ml-6"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          Open in Maps
        </a>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-600">Requested</p>
          <p className="text-gray-300 font-medium">{fmt(req.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Days Requested</p>
          <p className="text-brand-500 font-bold font-display text-lg">{req.daysRequested}</p>
        </div>
      </div>

      {/* Comment */}
      {req.comment && (
        <div className="bg-surface border border-surface-border rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Employee Comment</p>
          <p className="text-sm text-gray-300 italic">"{req.comment}"</p>
        </div>
      )}

      {/* Approval actions (only for pending) */}
      {req.status === 'pending' && (
        <div className="border-t border-surface-border pt-4 space-y-3">
          {/* Days adjuster */}
          <div>
            <p className="label mb-2">Approved Days (you can adjust)</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setApprovalDays(d => Math.max(1, d - 1))}
                className="w-9 h-9 rounded-xl border border-surface-border bg-surface flex items-center justify-center text-gray-300 hover:border-brand-500/50 hover:text-brand-500 transition-all font-bold"
              >−</button>
              <div className="flex-1 text-center">
                <span className="font-display font-bold text-2xl text-brand-500">{approvalDays}</span>
                <span className="text-gray-500 text-sm ml-2">{approvalDays === 1 ? 'day' : 'days'}</span>
              </div>
              <button
                type="button"
                onClick={() => setApprovalDays(d => Math.min(90, d + 1))}
                className="w-9 h-9 rounded-xl border border-surface-border bg-surface flex items-center justify-center text-gray-300 hover:border-brand-500/50 hover:text-brand-500 transition-all font-bold"
              >+</button>
            </div>
          </div>
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={actioning}
              className="btn-danger flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {actioning ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={actioning}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {actioning ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              )}
              Approve
            </button>
          </div>
        </div>
      )}

      {/* Approved info */}
      {req.status === 'approved' && (
        <div className="border-t border-surface-border pt-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">Approved for <span className="text-emerald-400 font-bold">{req.daysApproved}</span> day{req.daysApproved !== 1 ? 's' : ''}</span>
          {req.approvedAt && <span className="text-gray-600 text-xs">{fmt(req.approvedAt)}</span>}
        </div>
      )}
    </div>
  );
}

export default function WFHRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/wfh/requests?status=${filter}`);
      setRequests(data.requests || []);
    } catch {
      toast.error('Failed to load WFH requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id, daysApproved) => {
    try {
      await api.put(`/wfh/requests/${id}/approve`, { daysApproved });
      toast.success(`Approved for ${daysApproved} day${daysApproved !== 1 ? 's' : ''}!`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/wfh/requests/${id}/reject`);
      toast.success('Request rejected');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const filterTabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: '', label: 'All' },
  ];

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          WFH Requests
        </h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve work-from-home location requests</p>
      </div>

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
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No {filter || ''} WFH requests</p>
          <p className="text-gray-600 text-sm mt-1">Requests will appear here when employees are outside the office</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <RequestCard key={req._id} req={req} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}
    </div>
  );
}
