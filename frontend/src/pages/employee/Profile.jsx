import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

export default function EmployeeProfile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPw(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-full bg-surface px-4 pt-6 pb-8 max-w-md mx-auto space-y-5 animate-fade-in">
      <h1 className="page-title">Profile</h1>

      {/* Avatar & info */}
      <div className="card p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center mx-auto mb-4 text-2xl font-display font-bold text-brand-300">
          {initials}
        </div>
        <h2 className="font-display font-bold text-xl text-white">{user?.name}</h2>
        <p className="text-gray-400 text-sm">{user?.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user?.role === 'admin' ? 'bg-brand-600/15 text-brand-600 border border-brand-600/20' : 'bg-brand-500/15 text-brand-500 border border-brand-500/20'}`}>
            {user?.role === 'admin' ? '⚡ Admin' : '👤 Employee'}
          </span>
          {user?.department && <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/20">{user.department}</span>}
        </div>
      </div>

      {/* Edit profile */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="section-title">Personal Info</p>
          <button onClick={() => setEditing(!editing)} className="text-xs text-brand-500 hover:text-brand-300 font-semibold">
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div><label className="label mb-1.5 block">Full Name</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label className="label mb-1.5 block">Phone</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 98765 43210" /></div>
            <div><label className="label mb-1.5 block">Department</label><input className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Engineering" /></div>
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <><Spinner size="sm" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[['Name', user?.name], ['Email', user?.email], ['Phone', user?.phone || '—'], ['Department', user?.department || '—']].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2 border-b border-surface-border last:border-0">
                <span className="text-sm text-gray-400">{k}</span>
                <span className="text-sm text-gray-200 font-medium">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="section-title">Security</p>
          <button onClick={() => setChangingPw(!changingPw)} className="text-xs text-brand-500 hover:text-brand-300 font-semibold">
            {changingPw ? 'Cancel' : 'Change Password'}
          </button>
        </div>
        {changingPw && (
          <div className="space-y-3">
            <div><label className="label mb-1.5 block">Current Password</label><input type="password" className="input" value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} /></div>
            <div><label className="label mb-1.5 block">New Password</label><input type="password" className="input" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} /></div>
            <div><label className="label mb-1.5 block">Confirm New Password</label><input type="password" className="input" value={pwForm.confirmPassword} onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} /></div>
            <button onClick={handleChangePassword} disabled={savingPw} className="btn-primary w-full flex items-center justify-center gap-2">
              {savingPw ? <><Spinner size="sm" /> Saving…</> : 'Update Password'}
            </button>
          </div>
        )}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="btn-danger w-full flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>

      <p className="text-center text-xs text-gray-600">Office Attendance v1.0.0</p>
    </div>
  );
}
