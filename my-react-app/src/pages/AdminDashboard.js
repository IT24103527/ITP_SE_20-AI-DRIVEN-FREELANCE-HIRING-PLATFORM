/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminDashboard.css';

const API = 'http://localhost:8080';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', otp: '' });
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Jobs & Proposals
    const [allJobs, setAllJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [showingProposalsForJob, setShowingProposalsForJob] = useState(null);
    const [inlineProposals, setInlineProposals] = useState([]);
    const [inlineLoading, setInlineLoading] = useState(false);
    const [proposalSort, setProposalSort] = useState('match-desc');
    const [insights, setInsights] = useState({ total: 0, avgMatch: 0, bestMatch: null, budgetRange: '', proposedRange: '' });

    const token = localStorage.getItem('token');

//NEW:Functions
        const getMatchLabel = (prob) => {
        if (prob > 0.85) return { text: "🔥 BEST MATCH", color: "#10b981" };
        if (prob > 0.75) return { text: "🟢 High Potential", color: "#34d399" };
        if (prob > 0.6) return { text: "🟡 Strong Fit", color: "#f59e0b" };
        return { text: "⚪ Consider", color: "#94a3b8" };
    };

    const computeInsights = (proposals) => {
    if (!proposals.length) return {
        total: 0, avgMatch: 0, bestMatch: null,
        budgetRange: '—', proposedRange: '—'
    };
    const total = proposals.length;
    const avgMatch = proposals.reduce((sum, p) => sum + (p.successProbability || 0), 0) / total;
    const bestMatch = proposals.reduce((best, p) =>
        (p.successProbability || 0) > (best?.successProbability || 0) ? p : best, proposals[0]);

    const budgets = proposals.map(p => p.estimatedBudget || 0).filter(b => b > 0);
    const proposedPrices = proposals.map(p => p.proposedPrice || 0).filter(pr => pr > 0);

    const formatRange = (values) => {
        if (!values.length) return '—';
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        return minVal === maxVal ? formatMoney(minVal) : `${formatMoney(minVal)} – ${formatMoney(maxVal)}`;
    };

    return {
        total,
        avgMatch: parseFloat((avgMatch * 100).toFixed(2)),
        bestMatch,
        budgetRange: formatRange(budgets),
        proposedRange: formatRange(proposedPrices)
    };
    };

    const getSortedProposals = () => {
        const proposals = [...inlineProposals];
        switch (proposalSort) {
            case 'match-desc': return proposals.sort((a,b) => (b.successProbability || 0) - (a.successProbability || 0));
            case 'price-asc': return proposals.sort((a,b) => (a.proposedPrice || 0) - (b.proposedPrice || 0));
            case 'price-desc': return proposals.sort((a,b) => (b.proposedPrice || 0) - (a.proposedPrice || 0));
            case 'date-desc': return proposals.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            default: return proposals;
        }
    };

    const showProposalsInline = async (jobId) => {
    setInlineLoading(true);
    setShowingProposalsForJob(jobId);
    try {
        const res = await fetch(`${API}/client/jobs/${jobId}/proposals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setInlineProposals(data);
            setInsights(computeInsights(data));
        } else {
            setInlineProposals([]);
            setInsights(computeInsights([]));
            showMessage('Failed to load proposals for this job', 'error');
        }
    } catch (e) {
        showMessage('Could not load proposals', 'error');
        setInlineProposals([]);
        setInsights(computeInsights([]));
    } finally {
        setInlineLoading(false);
    }
    };

    const handleUpdateAppStatus = async (proposalId, status) => {
    try {
        const res = await fetch(`${API}/admin/proposals/${proposalId}/status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            showMessage(`Proposal ${status.toLowerCase()} successfully!`, 'success');
            if (showingProposalsForJob) await showProposalsInline(showingProposalsForJob);
        } else {
            const error = await res.json();
            showMessage(error.message || 'Failed to update proposal status', 'error');
        }
    } catch (err) {
        showMessage('Network error while updating proposal', 'error');
    }
    };

    const fetchAllJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
        const res = await fetch(`${API}/api/jobs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setAllJobs(Array.isArray(data) ? data : []);
        } else {
            setAllJobs([]);
        }
    } catch (e) {
        setAllJobs([]);
    } finally {
        setJobsLoading(false);
    }
    }, [token]);

    useEffect(() => {
    if (activeTab === 'jobs-proposals') fetchAllJobs();
    }, [activeTab, fetchAllJobs]);

    const handleDeleteProposal = async (proposalId, freelancerName) => {
    if (!window.confirm(`Delete proposal from ${freelancerName}? This action cannot be undone.`)) return;
    try {
        const res = await fetch(`${API}/client/proposals/${proposalId}`, {   // For Admin: use '/admin/proposals/...'
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            showMessage(`Proposal from ${freelancerName} deleted successfully`, 'success');
            // Refresh proposals for the current job
            if (showingProposalsForJob) {
                await showProposalsInline(showingProposalsForJob);
            }
        } else {
            const error = await res.json();
            showMessage(error.message || 'Failed to delete proposal', 'error');
        }
    } catch (err) {
        showMessage('Network error while deleting proposal', 'error');
    }
    };

    const formatMoney = (value) => {
    if (!value && value !== 0) return '—';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
    };

    const formatPercent = (value) => {
    if (value === undefined || value === null) return '—';
    const percent = value * 100;
    return percent.toFixed(2) + '%';
    };




    const showMessage = useCallback((text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) { navigate('/admin-login'); return; }
            const data = await res.json();
            const storedRole = localStorage.getItem('userRole');
            const userRole = data.role || storedRole;
            if (userRole && userRole !== 'ADMIN') { navigate('/admin-login'); return; }
            setUser(data);
            setProfileData({
                fullName: data.fullName || '',
                phoneNumber: data.phoneNumber || '',
                department: data.department || ''
            });
        } catch (e) { showMessage('Failed to load profile', 'error'); }
    }, [token, navigate, showMessage]);

    const fetchAllUsers = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) { showMessage('Failed to load users', 'error'); return; }
            const data = await res.json();
            setAllUsers(data);
        } catch (e) { showMessage('Failed to load users', 'error'); }
    }, [token, showMessage]);

    useEffect(() => {
        if (!token) { navigate('/admin-login'); return; }
        fetchProfile();
    }, [token, navigate, fetchProfile]);

    useEffect(() => {
        if (activeTab === 'users') fetchAllUsers();
    }, [activeTab, fetchAllUsers]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/user/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            const data = await res.json();
            if (res.ok) { setUser(data.user); setEditMode(false); showMessage('Profile updated!', 'success'); }
            else showMessage(data.message, 'error');
        } catch (e) { showMessage('Update failed', 'error'); }
        finally { setLoading(false); }
    };

    const sendPasswordOtp = () => {
        setOtpSent(true);
        showMessage('Enter the 6-digit code from your authenticator app', 'success');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/user/change-password`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData)
            });
            const data = await res.json();
            if (res.ok) {
                showMessage('Password changed!', 'success');
                setPasswordData({ currentPassword: '', newPassword: '', otp: '' });
                setOtpSent(false);
            } else showMessage(data.message, 'error');
        } catch (e) { showMessage('Failed', 'error'); }
        finally { setLoading(false); }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Delete your admin account permanently?')) return;
        try {
            const res = await fetch(`${API}/api/user/account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { localStorage.clear(); navigate('/'); }
            else showMessage('Delete failed', 'error');
        } catch (e) { showMessage('Delete failed', 'error'); }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Permanently delete account for ${userEmail}? They will be notified by email.`)) return;
        setDeletingId(userId);
        try {
            const res = await fetch(`${API}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setAllUsers(prev => prev.filter(u => u.id !== userId));
                setSelectedUser(null);
                showMessage(data.message, 'success');
            } else {
                showMessage(data.message || 'Delete failed', 'error');
            }
        } catch (e) { showMessage('Delete failed', 'error'); }
        finally { setDeletingId(null); }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/admin-login'); };

    const getRoleBadgeClass = (role) => {
        if (role === 'ADMIN') return 'badge-admin';
        if (role === 'FREELANCER') return 'badge-freelancer';
        return 'badge-client';
    };

    if (!user) return <div className="dashboard-loading">Loading...</div>;

    return (
        <div className="dashboard-page admin-theme">
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <h2>TalentFlow<span className="ai-accent">AI</span></h2>
                    <span className="role-badge admin-badge">Admin</span>
                </div>
                <div className="sidebar-user">
                    <div className="user-avatar admin-avatar">{user.fullName?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{user.fullName}</p>
                        <p className="user-email">{user.department || user.email}</p>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <button className={activeTab === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('profile')}>👤 My Profile</button>
                    <button className={activeTab === 'users'   ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('users')}>👥 Manage Users</button>
                     <button className={activeTab === 'jobs-proposals' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('jobs-proposals')}>📋 Jobs & Proposals</button>
                    <button className={activeTab === 'security'? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('security')}>🔒 Security</button>
                    <button className={activeTab === 'danger'  ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('danger')}>⚠️ Account</button>
                </nav>
                <Link to="/" className="home-btn">🏠 Home</Link>
                <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
            </aside>

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Admin Control Panel</h1>
                    <p>Welcome, {user.fullName} — {user.department || 'Administrator'}</p>
                </div>

                {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                {/* ── PROFILE TAB ── */}
                {activeTab === 'profile' && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>Admin Profile</h2>
                            <button className="edit-btn" onClick={() => setEditMode(!editMode)}>{editMode ? 'Cancel' : '✏️ Edit'}</button>
                        </div>
                        {editMode ? (
                            <form onSubmit={handleProfileUpdate} className="profile-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input value={profileData.phoneNumber} onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <select value={profileData.department} onChange={e => setProfileData({...profileData, department: e.target.value})}>
                                        <option value="">Select Department</option>
                                        <option value="platform-management">Platform Management</option>
                                        <option value="user-support">User Support</option>
                                        <option value="security">Security</option>
                                        <option value="finance">Finance</option>
                                        <option value="analytics">Analytics</option>
                                    </select>
                                </div>
                                <button type="submit" className="save-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                            </form>
                        ) : (
                            <div className="profile-view">
                                <div className="profile-field"><span className="field-label">Full Name</span><span className="field-value">{user.fullName}</span></div>
                                <div className="profile-field"><span className="field-label">Email</span><span className="field-value">{user.email}</span></div>
                                <div className="profile-field"><span className="field-label">Phone</span><span className="field-value">{user.phoneNumber || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Department</span><span className="field-value">{user.department || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Admin Since</span><span className="field-value">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── MANAGE USERS TAB ── */}
                {activeTab === 'users' && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>All Users ({allUsers.length})</h2>
                            <button className="edit-btn" onClick={fetchAllUsers}>🔄 Refresh</button>
                        </div>

                        {/* User detail panel */}
                        {selectedUser && (
                            <div className="user-detail-panel">
                                <div className="user-detail-header">
                                    <div className="user-detail-avatar">{selectedUser.fullName?.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <h3>{selectedUser.fullName}</h3>
                                        <p>{selectedUser.email}</p>
                                    </div>
                                    <button className="close-detail-btn" onClick={() => setSelectedUser(null)}>✕</button>
                                </div>
                                <div className="user-detail-grid">
                                    <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{selectedUser.phoneNumber || '—'}</span></div>
                                    <div className="detail-item"><span className="detail-label">Roles</span><span className="detail-value">{(selectedUser.roles || []).join(', ') || '—'}</span></div>
                                    <div className="detail-item"><span className="detail-label">Status</span><span className={selectedUser.isActive ? 'status-active' : 'status-inactive'}>{selectedUser.isActive ? 'Active' : 'Inactive'}</span></div>
                                    <div className="detail-item"><span className="detail-label">Joined</span><span className="detail-value">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—'}</span></div>
                                    <div className="detail-item"><span className="detail-label">Last Updated</span><span className="detail-value">{selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString() : '—'}</span></div>
                                    <div className="detail-item"><span className="detail-label">Locked Until</span><span className="detail-value">{selectedUser.lockedUntil ? new Date(selectedUser.lockedUntil).toLocaleString() : 'Not locked'}</span></div>
                                    <div className="detail-item"><span className="detail-label">Failed Logins</span><span className="detail-value">{selectedUser.failedLoginAttempts ?? 0}</span></div>
                                    <div className="detail-item"><span className="detail-label">Failed OTPs</span><span className="detail-value">{selectedUser.failedOtpAttempts ?? 0}</span></div>
                                    {selectedUser.companyName        && <div className="detail-item"><span className="detail-label">Company</span><span className="detail-value">{selectedUser.companyName}</span></div>}
                                    {selectedUser.industry           && <div className="detail-item"><span className="detail-label">Industry</span><span className="detail-value">{selectedUser.industry}</span></div>}
                                    {selectedUser.companySize        && <div className="detail-item"><span className="detail-label">Company Size</span><span className="detail-value">{selectedUser.companySize}</span></div>}
                                    {selectedUser.professionalTitle  && <div className="detail-item"><span className="detail-label">Title</span><span className="detail-value">{selectedUser.professionalTitle}</span></div>}
                                    {selectedUser.skills             && <div className="detail-item"><span className="detail-label">Skills</span><span className="detail-value">{selectedUser.skills}</span></div>}
                                    {selectedUser.portfolioUrl       && <div className="detail-item"><span className="detail-label">Portfolio</span><span className="detail-value"><a href={selectedUser.portfolioUrl} target="_blank" rel="noreferrer">{selectedUser.portfolioUrl}</a></span></div>}
                                    {selectedUser.bio                && <div className="detail-item detail-item-full"><span className="detail-label">Bio</span><span className="detail-value">{selectedUser.bio}</span></div>}
                                    {selectedUser.hourlyRate         && <div className="detail-item"><span className="detail-label">Hourly Rate</span><span className="detail-value">${selectedUser.hourlyRate}/hr</span></div>}
                                    {selectedUser.experience         && <div className="detail-item"><span className="detail-label">Experience</span><span className="detail-value">{selectedUser.experience}</span></div>}
                                    {selectedUser.department         && <div className="detail-item"><span className="detail-label">Department</span><span className="detail-value">{selectedUser.department}</span></div>}
                                </div>
                                <div className="user-detail-actions">
                                    <button
                                        className="delete-user-btn"
                                        onClick={() => handleDeleteUser(selectedUser.id, selectedUser.email)}
                                        disabled={deletingId === selectedUser.id}
                                    >
                                        {deletingId === selectedUser.id ? 'Deleting...' : '🗑️ Delete This Account'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="users-table-wrapper">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Roles</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map((u) => (
                                        <tr key={u.id} className={selectedUser?.id === u.id ? 'row-selected' : ''}>
                                            <td>{u.fullName}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                {(u.roles || []).map(r => (
                                                    <span key={r} className={`role-pill ${getRoleBadgeClass(r)}`} style={{marginRight: 4}}>{r}</span>
                                                ))}
                                            </td>
                                            <td><span className={u.isActive ? 'status-active' : 'status-inactive'}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                                            <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="view-btn" onClick={() => setSelectedUser(u)}>👁 View</button>
                                                    <button
                                                        className="delete-row-btn"
                                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                                        disabled={deletingId === u.id}
                                                    >
                                                        {deletingId === u.id ? '…' : '🗑️'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

               {/* ── JOBS & PROPOSALS TAB (with per-job inline proposals) ── */}
                {activeTab === 'jobs-proposals' && (
    <div className="dashboard-card">
        <div className="card-header">
            <h2>All Jobs & Proposals ({allJobs.length})</h2>
            <button className="edit-btn" onClick={fetchAllJobs} disabled={jobsLoading}>🔄 Refresh</button>
        </div>

        {jobsLoading && <div className="section-loading"><div className="loading-spinner" /> Loading jobs...</div>}

        {!jobsLoading && allJobs.length === 0 && (
            <div className="empty-state">
                <div className="empty-icon">💼</div>
                <p>No jobs posted yet.</p>
            </div>
        )}

        {!jobsLoading && allJobs.map(job => {
            const isExpanded = showingProposalsForJob === (job.id || job._id);
            return (
                <div key={job.id || job._id} style={{ marginBottom: '32px' }}>
                    {/* Job Card */}
                    <div className="job-card admin-job-card">
                        <div className="job-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                                {job.companyLogo && (
                                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={job.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="job-title">{job.title || 'Untitled Job'}</h3>
                                    <p className="job-meta">
                                        {job.budget && <span>💰 ${job.budget}</span>}
                                        {job.deadline && <span>📅 Due: {new Date(job.deadline).toLocaleDateString()}</span>}
                                        {job.clientName && <span>👤 {job.clientName}</span>}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <span className={`status-badge ${job.status === 'ACTIVE' ? 'status-accepted' : 'status-pending'}`}>
                                    {job.status || 'ACTIVE'}
                                </span>
                            </div>
                        </div>
                        <p className="job-description">{job.description || 'No description.'}</p>
                        {job.requiredSkills && (
                            <div className="job-skills">
                                {job.requiredSkills.split(',').map(s => (
                                    <span key={s.trim()} className="skill-tag">{s.trim()}</span>
                                ))}
                            </div>
                        )}
                        <button 
                            className="view-proposals-btn" 
                            onClick={() => {
                                if (isExpanded) {
                                    setShowingProposalsForJob(null);
                                    setInlineProposals([]);
                                } else {
                                    showProposalsInline(job.id || job._id);
                                }
                            }}
                        >
                            {isExpanded ? 'Hide Proposals ←' : 'View Proposals →'}
                        </button>
                    </div>

                    {/* Inline Proposals Section (only shown for this job when expanded) */}
                    {isExpanded && (
                        <div className="inline-proposals-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, background: 'linear-gradient(135deg, #fff, #60a5fa)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                                    🤖 AI‑Evaluated Proposals
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#94a3b8', marginLeft: '12px' }}>Job #{job.id || job._id}</span>
                                </h3>
                            </div>

                            {inlineLoading && (
                                <div className="proposals-loading">
                                    <div className="loading-spinner" style={{ width: 40, height: 40 }} />
                                    <span style={{ marginLeft: 16 }}>Analyzing proposals with AI...</span>
                                </div>
                            )}

                            {!inlineLoading && inlineProposals.length > 0 && (
                                <>
                                    <div className="proposals-insights">
                                        <div className="insight-card"><div className="insight-label">📊 TOTAL PROPOSALS</div><div className="insight-value">{insights.total}</div></div>
                                        <div className="insight-card"><div className="insight-label">🎯 AVG. MATCH</div><div className="insight-value">{insights.avgMatch}%</div><div className="insight-sub">AI confidence score</div></div>
                                        <div className="insight-card"><div className="insight-label">🏆 BEST MATCH</div><div className="insight-value">{insights.bestMatch?.freelancerName?.split(' ')[0] || '—'}</div><div className="insight-sub">{Math.round((insights.bestMatch?.successProbability || 0)*100)}% match</div></div>
                                        <div className="insight-card"><div className="insight-label">💰 BUDGET RANGE</div><div className="insight-value">{insights.budgetRange}</div><div className="insight-sub">Proposed: {insights.proposedRange}</div></div>
                                    </div>

                                    <div className="sort-bar">
                                        <span className="sort-label">SORT BY</span>
                                        <select className="sort-select" value={proposalSort} onChange={(e) => setProposalSort(e.target.value)}>
                                            <option value="match-desc">⭐ Match % (High to Low)</option>
                                            <option value="price-asc">💰 Price (Low to High)</option>
                                            <option value="price-desc">💰 Price (High to Low)</option>
                                            <option value="date-desc">📅 Newest First</option>
                                        </select>
                                    </div>

                                    <div className="proposals-grid">
                                        {getSortedProposals().map((p, idx) => {
                                            const prob = Math.round((p.successProbability || 0) * 100);
                                            const match = getMatchLabel(p.successProbability || 0);
                                            const isTopPick = idx === 0 && proposalSort === 'match-desc';
                                            return (
                                                <div key={p.id || idx} className={`proposal-card ${isTopPick ? 'top-pick' : ''}`}>
                                                    {isTopPick && <div className="top-badge">🔥 AI TOP PICK</div>}
                                                    <div className="card-header">
                                                        <div>
                                                            <h3>{p.freelancerName || 'Anonymous'}</h3>
                                                            <span className="match-label" style={{ color: match.color, background: 'rgba(0,0,0,0.3)' }}>{match.text}</span>
                                                        </div>
                                                        <div className="circular-progress">
                                                            <svg width="78" height="78" viewBox="0 0 42 42">
                                                                <defs><linearGradient id={`grad-${p.id}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
                                                                <circle cx="21" cy="21" r="15" fill="none" stroke="#1e2937" strokeWidth="5" />
                                                                <circle cx="21" cy="21" r="15" fill="none" stroke={`url(#grad-${p.id})`} strokeWidth="5" strokeDasharray={`${prob} 100`} strokeLinecap="round" transform="rotate(-90 21 21)" />
                                                            </svg>
                                                            <div className="percentage">{prob}%</div>
                                                        </div>
                                                    </div>
                                                    <p className="proposal-message">“{p.message || 'No additional message provided.'}”</p>
                                                    <div className="metrics">
                                                        <div className="metric"><span className="metric-label">Proposed Price</span><span className="metric-value">${p.proposedPrice}</span></div>
                                                        <div className="metric"><span className="metric-label">Job Budget</span><span className="metric-value">${p.estimatedBudget}</span></div>
                                                    </div>
                                                    <div className="actions">
                                                        <button className="hire-btn" onClick={() => handleUpdateAppStatus(p.id || p._id, 'ACCEPTED')}>✨ Hire Now</button>
                                                        <button className="view-profile-btn" onClick={() => navigate(`/freelancer/${p.freelancerId}`)}>👤 View Profile</button>
                                                        <button className="delete-proposal-btn" onClick={() => handleDeleteProposal(p.id || p._id, p.freelancerName)}>🗑️ Delete</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {!inlineLoading && inlineProposals.length === 0 && (
                                <div className="empty-state" style={{ padding: '40px' }}>
                                    <div className="empty-icon">📭</div>
                                    <p>No proposals received for this job yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
                )}

                {/* ── SECURITY TAB ── */}
                {activeTab === 'security' && (
                    <div className="dashboard-card">
                        <div className="card-header"><h2>Change Password</h2></div>
                        <form onSubmit={handlePasswordChange} className="profile-form">
                            <div className="form-group">
                                <label>Current Password</label>
                                <input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required minLength={8} />
                            </div>
                            <div className="otp-section">
                                <button type="button" className="otp-btn" onClick={sendPasswordOtp}>{otpSent ? '✅ OTP Sent - Resend' : '📱 Send OTP'}</button>
                            </div>
                            {otpSent && (
                                <div className="form-group">
                                    <label>Enter OTP</label>
                                    <input type="text" placeholder="6-digit OTP" value={passwordData.otp} onChange={e => setPasswordData({...passwordData, otp: e.target.value})} required maxLength={6} />
                                </div>
                            )}
                            <button type="submit" className="save-btn" disabled={loading || !otpSent}>{loading ? 'Changing...' : 'Change Password'}</button>
                        </form>
                    </div>
                )}

                {/* ── DANGER TAB ── */}
                {activeTab === 'danger' && (
                    <div className="dashboard-card danger-card">
                        <div className="card-header"><h2>Danger Zone</h2></div>
                        <p>Deleting your admin account will remove all admin privileges permanently.</p>
                        <button className="delete-btn" onClick={handleDeleteAccount}>🗑️ Delete Admin Account</button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
