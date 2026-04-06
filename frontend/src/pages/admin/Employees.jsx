import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const EMPTY_FORM = { name: '', email: '', password: '', department: '', phone: '', role: 'employee' };

function EmployeeModal({ emp, onClose, onSaved }) {
  const isEdit = !!emp;
  const [form, setForm] = useState(isEdit ? { name: emp.name, email: emp.email, department: emp.department || '', phone: emp.phone || '', role: emp.role, password: '' } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, department: form.department, phone: form.phone, role: form.role };
        await api.put(`/admin/employees/${emp._id}`, payload);
        toast.success('Employee updated!');
      } else {
        await api.post('/admin/employees', form);
        toast.success('Employee created! Default password: Welcome@123');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="label mb-1.5 block">Full Name *</label><input required className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><label className="label mb-1.5 block">Email *</label><input required type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          {!isEdit && <div><label className="label mb-1.5 block">Password (default: Welcome@123)</label><input type="password" className="input" placeholder="Leave blank for default" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>}
          <div><label className="label mb-1.5 block">Department</label><input className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
          <div><label className="label mb-1.5 block">Phone</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div>
            <label className="label mb-1.5 block">Role</label>
            <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <><Spinner size="sm" /> Saving…</> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null); // null | 'add' | employee object

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/employees', { params: { search, limit: 100 } });
      setEmployees(data.employees);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const toggleStatus = async (emp) => {
    try {
      await api.patch(`/admin/employees/${emp._id}/toggle`);
      toast.success(`${emp.name} ${emp.isActive ? 'deactivated' : 'activated'}`);
      fetchEmployees();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteEmployee = async (emp) => {
    if (!window.confirm(`Delete ${emp.name}? This will also remove all their attendance records. This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/employees/${emp._id}`);
      toast.success(`${emp.name} deleted`);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Employees</h1>
        <button onClick={() => setModal('add')} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add
        </button>
      </div>

      <input className="input" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {employees.length === 0 && <div className="card p-10 text-center text-gray-400">No employees found</div>}
          {employees.map(emp => (
            <div key={emp._id} className="card p-4 flex items-center gap-4 animate-slide-up">
              <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-300 flex-shrink-0">
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white text-sm">{emp.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${emp.role === 'admin' ? 'bg-brand-600/15 text-brand-600' : 'bg-brand-500/15 text-brand-500'}`}>
                    {emp.role}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${emp.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                {emp.department && <p className="text-xs text-gray-500">{emp.department}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {/* View Attendance — opens full page */}
                <button
                  onClick={() => navigate(`/admin/employees/${emp._id}/attendance`)}
                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  title="View attendance"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                {/* Edit */}
                <button onClick={() => setModal(emp)} className="p-2 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all" title="Edit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                {/* Toggle Status */}
                <button onClick={() => toggleStatus(emp)} className={`p-2 rounded-lg transition-all ${emp.isActive ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`} title={emp.isActive ? 'Deactivate' : 'Activate'}>
                  {emp.isActive
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  }
                </button>
                {/* Delete */}
                <button onClick={() => deleteEmployee(emp)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <EmployeeModal
          emp={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchEmployees}
        />
      )}
    </div>
  );
}
