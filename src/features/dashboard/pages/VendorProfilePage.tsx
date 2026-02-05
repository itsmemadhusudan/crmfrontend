import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../auth/auth.store';
import * as authApi from '../../../api/auth.api';
import { getBranches } from '../../../api/branches';
import type { Branch } from '../../../types/crm';

export default function VendorProfilePage() {
  const { user, refreshUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [vendorName, setVendorName] = useState(user?.vendorName ?? '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchSelect, setBranchSelect] = useState(user?.branchId ?? '');
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchError, setBranchError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setBranchSelect(user?.branchId ?? '');
  }, [user?.branchId]);

  useEffect(() => {
    if (user?.role === 'vendor') {
      getBranches({ all: true }).then((r) => {
        if (r.success && r.branches) setBranches(r.branches);
      });
    }
  }, [user?.role]);

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    setBranchSelect(value ?? '');
    setBranchError('');
    setBranchSaving(true);
    const res = await authApi.updateMyBranch(value || null);
    setBranchSaving(false);
    if (res.success && res.user) {
      await refreshUser();
    } else {
      setBranchError(res.message || 'Failed to assign branch');
    }
  };

  const startEdit = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setVendorName(user?.vendorName ?? '');
    setProfileError('');
    setProfileSuccess('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setProfileError('');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    const payload: { name: string; email: string; vendorName?: string } = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };
    if (user?.role === 'vendor') payload.vendorName = vendorName.trim() || undefined;
    const res = await authApi.updateProfile(payload);
    setProfileLoading(false);
    if (res.success && res.user) {
      setProfileSuccess('Profile updated successfully.');
      setEditing(false);
      await refreshUser();
    } else {
      setProfileError(res.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    const res = await authApi.updatePassword(currentPassword, newPassword);
    setPasswordLoading(false);
    if (res.success) {
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.message || 'Failed to update password');
    }
  };

  const initials = (user?.name ?? 'V').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-content vendor-profile-pro">
      <header className="vendor-profile-header">
        <div className="vendor-profile-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="vendor-profile-header-text">
          <h1 className="vendor-profile-name">{user?.name ?? 'Profile'}</h1>
          <p className="vendor-profile-role">
            <span className="vendor-profile-role-badge">{user?.role === 'vendor' ? 'Vendor' : user?.role}</span>
            {user?.role === 'vendor' && user?.branchName && (
              <span className="vendor-profile-branch"> · {user.branchName}</span>
            )}
          </p>
        </div>
      </header>

      <div className="vendor-profile-grid">
        <section className="content-card vendor-profile-card">
          <div className="vendor-profile-card-head">
            <h2 className="vendor-profile-card-title">Account details</h2>
            {!editing ? (
              <button type="button" className="vendor-profile-btn vendor-profile-btn-edit" onClick={startEdit}>
                Edit profile
              </button>
            ) : (
              <button type="button" className="vendor-profile-btn vendor-profile-btn-ghost" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>

          {profileError && (
            <div className="vendor-profile-alert vendor-profile-alert-error" role="alert">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="vendor-profile-alert vendor-profile-alert-success">{profileSuccess}</div>
          )}

          {!editing ? (
            <dl className="vendor-profile-dl">
              <div className="vendor-profile-row">
                <dt>Name</dt>
                <dd>{user?.name ?? '—'}</dd>
              </div>
              <div className="vendor-profile-row">
                <dt>Email</dt>
                <dd>{user?.email ?? '—'}</dd>
              </div>
              {user?.role === 'vendor' && (
                <>
                  <div className="vendor-profile-row">
                    <dt>Business name</dt>
                    <dd>{user?.vendorName ?? '—'}</dd>
                  </div>
                  <div className="vendor-profile-row">
                    <dt>Branch</dt>
                    <dd>{user?.branchName ?? '—'}</dd>
                  </div>
                </>
              )}
              <div className="vendor-profile-row">
                <dt>Role</dt>
                <dd className="vendor-profile-role-value">{user?.role ?? '—'}</dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={handleProfileSubmit} className="vendor-profile-form">
              <label className="vendor-profile-field">
                <span className="vendor-profile-field-label">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="vendor-profile-input"
                  required
                />
              </label>
              <label className="vendor-profile-field">
                <span className="vendor-profile-field-label">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="vendor-profile-input"
                  required
                />
              </label>
              {user?.role === 'vendor' && (
                <label className="vendor-profile-field">
                  <span className="vendor-profile-field-label">Business name</span>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="vendor-profile-input"
                    placeholder="Your business or vendor name"
                  />
                </label>
              )}
              <div className="vendor-profile-actions">
                <button type="button" className="vendor-profile-btn vendor-profile-btn-ghost" onClick={cancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="vendor-profile-btn vendor-profile-btn-primary" disabled={profileLoading}>
                  {profileLoading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </section>

        {user?.role === 'vendor' && (
          <section className="content-card vendor-profile-card">
            <h2 className="vendor-profile-card-title">My branch</h2>
            <p className="vendor-profile-card-desc">
              Assign yourself to a branch. You will only see data for this branch. Admin can also assign you from Staff.
            </p>
            {branchError && (
              <div className="vendor-profile-alert vendor-profile-alert-error" role="alert">
                {branchError}
              </div>
            )}
            <div className="vendor-profile-field">
              <span className="vendor-profile-field-label">Branch</span>
              <select
                value={branchSelect}
                onChange={handleBranchChange}
                disabled={branchSaving}
                className="vendor-profile-input vendor-branch-select"
                aria-label="Assign yourself to a branch"
              >
                <option value="">No branch selected</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {branchSaving && <span className="vendor-profile-saving"> Saving…</span>}
            </div>
          </section>
        )}

        <section className="content-card vendor-profile-card">
          <h2 className="vendor-profile-card-title">Security</h2>
          <p className="vendor-profile-card-desc">Change your password. Use at least 6 characters.</p>

          {passwordError && (
            <div className="vendor-profile-alert vendor-profile-alert-error" role="alert">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="vendor-profile-alert vendor-profile-alert-success">{passwordSuccess}</div>
          )}

          <form onSubmit={handlePasswordSubmit} className="vendor-profile-form">
            <label className="vendor-profile-field">
              <span className="vendor-profile-field-label">Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="vendor-profile-input"
                required
                autoComplete="current-password"
              />
            </label>
            <label className="vendor-profile-field">
              <span className="vendor-profile-field-label">New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="vendor-profile-input"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <label className="vendor-profile-field">
              <span className="vendor-profile-field-label">Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="vendor-profile-input"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <div className="vendor-profile-actions">
              <button type="submit" className="vendor-profile-btn vendor-profile-btn-primary" disabled={passwordLoading}>
                {passwordLoading ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
