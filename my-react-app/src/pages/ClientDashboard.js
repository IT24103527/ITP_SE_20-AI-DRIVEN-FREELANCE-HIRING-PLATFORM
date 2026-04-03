import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClientDashboard.css';

const API = 'http://localhost:8080';

const ClientDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', otp: '' });
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    // My Jobs
    const [myJobs, setMyJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    // Post/Edit a Job
    const [editJobId, setEditJobId] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [jobForm, setJobForm] = useState({ title: '', description: '', budget: '', deadline: '', requiredSkills: '', gender: '', careerLevel: '', industry: '', experience: '', qualification: '', location: '', jobType: 'Full-Time', companyLogo: '' });
    const [postMsg, setPostMsg] = useState('');
    const [postLoading, setPostLoading] = useState(false);

    // Mobile sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'my-jobs') fetchMyJobs();
    }, [activeTab]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) { navigate('/login'); return; }
            const data = await res.json();
            const storedRole = localStorage.getItem('userRole');
            const userRole = data.role || storedRole;
            if (userRole && userRole !== 'CLIENT') { navigate('/login'); return; }
            setUser(data);
            setProfileData({
                fullName: data.fullName || '',
                phoneNumber: data.phoneNumber || '',
                companyName: data.companyName || '',
                industry: data.industry || '',
                companySize: data.companySize || ''
            });
        } catch (e) {
            showMessage('Failed to load profile', 'error');
        }
    };

    const fetchMyJobs = async () => {
        setJobsLoading(true);
        try {
            const res = await fetch(`${API}/api/jobs/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyJobs(Array.isArray(data) ? data : (data.jobs || data.content || []));
            } else {
                setMyJobs([]);
            }
        } catch (e) {
            setMyJobs([]);
        } finally {
            setJobsLoading(false);
        }
    };

    const getTodayDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const getTwoMonthsLaterDate = () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 2);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showMessage('Image must be under 2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setJobForm({ ...jobForm, companyLogo: reader.result });
            setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        try {
            const res = await fetch(`${API}/api/jobs/${jobId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showMessage('Job deleted successfully!', 'success');
                fetchMyJobs();
            } else showMessage('Failed to delete job', 'error');
        } catch (e) { showMessage('Delete failed', 'error'); }
    };

    const startEditJob = (job) => {
        setEditJobId(job.id || job._id);
        const deadlineFormatted = job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '';
        setJobForm({
            title: job.title || '',
            description: job.description || '',
            budget: job.budget || '',
            deadline: deadlineFormatted,
            requiredSkills: job.requiredSkills || '',
            gender: job.gender || 'Any',
            careerLevel: job.careerLevel || '',
            industry: job.industry || '',
            experience: job.experience || '',
            qualification: job.qualification || '',
            location: job.location || '',
            jobType: job.jobType || 'Full-Time',
            companyLogo: job.companyLogo || ''
        });
        setLogoPreview(job.companyLogo || null);
        setActiveTab('post-job');
    };

    const validateForm = () => {
        const errors = [];
        if (!jobForm.title.trim()) errors.push('Job title is required');
        if (!jobForm.description.trim()) {
            errors.push('Description is required');
        } else if (jobForm.description.trim().length < 20 || jobForm.description.trim().length > 2000) {
            errors.push('Description must be between 20 and 2000 characters');
        }
        
        // Budget validation: 0-100,000,000
        const budgetNum = Number(jobForm.budget);
        if (isNaN(budgetNum) || budgetNum < 0 || budgetNum > 100000000) {
            errors.push('Budget must be between 0 and 100,000,000');
        }

        // Deadline validation: today to two months future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(jobForm.deadline);
        const twoMonthsLater = new Date();
        twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
        twoMonthsLater.setHours(23, 59, 59, 999);

        if (!jobForm.deadline) {
            errors.push('Deadline is required');
        } else if (deadline < today) {
            errors.push('Deadline cannot be in the past');
        } else if (deadline > twoMonthsLater) {
            errors.push('Deadline must be within the next two months');
        }

        if (!jobForm.location.trim()) errors.push('Location is required');
        if (!jobForm.careerLevel.trim()) errors.push('Career level is required');
        if (!jobForm.industry.trim()) errors.push('Industry is required');
        if (!jobForm.experience.trim()) errors.push('Experience is required');
        if (!jobForm.qualification.trim()) errors.push('Qualification is required');
        if (!jobForm.requiredSkills.trim()) errors.push('Required skills are required');

        return errors;
    };

    const handlePostJob = async (e) => {
        e.preventDefault();
        
        const errors = validateForm();
        if (errors.length > 0) {
            setPostMsg(`❌ ${errors[0]}`);
            showMessage(errors[0], 'error');
            return;
        }

        setPostLoading(true);
        setPostMsg('');
        
        try {
            const endpoint = editJobId ? `${API}/api/jobs/${editJobId}` : `${API}/api/jobs`;
            const method = editJobId ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(jobForm)
            });
            const data = await res.json();
            if (res.ok) {
                setPostMsg(`✅ Job ${editJobId ? 'updated' : 'posted'} successfully!`);
                setJobForm({ title: '', description: '', budget: '', deadline: '', requiredSkills: '', gender: '', careerLevel: '', industry: '', experience: '', qualification: '', location: '', jobType: 'Full-Time', companyLogo: '' });
                setEditJobId(null);
                setLogoPreview(null);
                showMessage(`Job ${editJobId ? 'updated' : 'posted'} successfully!`, 'success');
                fetchMyJobs();
                setActiveTab('my-jobs');
            } else {
                setPostMsg(data.message || `Failed to ${editJobId ? 'update' : 'post'} job.`);
            }
        } catch (e) {
            setPostMsg(`Failed to ${editJobId ? 'update' : 'post'} job. Please ensure the backend is running.`);
        } finally {
            setPostLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

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
            if (res.ok) {
                setUser(data.user);
                setEditMode(false);
                showMessage('Profile updated successfully!', 'success');
            } else {
                showMessage(data.message, 'error');
            }
        } catch (e) {
            showMessage('Update failed', 'error');
        } finally { setLoading(false); }
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
                showMessage('Password changed successfully!', 'success');
                setPasswordData({ currentPassword: '', newPassword: '', otp: '' });
                setOtpSent(false);
            } else showMessage(data.message, 'error');
        } catch (e) { showMessage('Password change failed', 'error'); }
        finally { setLoading(false); }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
        try {
            const res = await fetch(`${API}/api/user/account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                localStorage.clear();
                navigate('/');
            } else showMessage('Failed to delete account', 'error');
        } catch (e) { showMessage('Delete failed', 'error'); }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const getStatusColor = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'ACTIVE' || s === 'OPEN') return 'status-accepted';
        if (s === 'CLOSED' || s === 'EXPIRED') return 'status-rejected';
        return 'status-pending';
    };

    if (!user) return <div className="dashboard-loading"><div className="loading-spinner" /><p>Loading...</p></div>;

    const navItems = [
        { key: 'overview',  icon: '🏠', label: 'Overview' },
        { key: 'post-job',  icon: '➕', label: 'Post a Job' },
        { key: 'my-jobs',   icon: '💼', label: 'My Jobs' },
        { key: 'profile',   icon: '👤', label: 'My Profile' },
        { key: 'security',  icon: '🔒', label: 'Security' },
        { key: 'danger',    icon: '⚠️', label: 'Account' },
    ];

    return (
        <div className="dashboard-page">
            {/* Mobile toggle */}
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
                {sidebarOpen ? '✕' : '☰'}
            </button>

            <aside className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>TalentFlow<span className="ai-accent">AI</span></h2>
                    <span className="role-badge client-badge">Client</span>
                </div>
                <div className="sidebar-user">
                    <div className="user-avatar client-avatar">{user.fullName?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{user.fullName}</p>
                        <p className="user-email">{user.companyName || user.email}</p>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            className={activeTab === item.key ? 'nav-item active' : 'nav-item'}
                            onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <Link to="/" className="home-btn">🏠 Home</Link>
                    <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
                </div>
            </aside>

            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Welcome back, {user.fullName?.split(' ')[0]}!</h1>
                    <p>{user.companyName ? `${user.companyName} · Client Dashboard` : 'Client Dashboard'}</p>
                </div>

                {message.text && (
                    <div className={`alert alert-${message.type}`}>{message.text}</div>
                )}

                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <div>
                        <div className="stats-grid">
                            <div className="stat-card client-stat">
                                <div className="stat-icon">💼</div>
                                <div className="stat-info">
                                    <span className="stat-number">{myJobs.length || '—'}</span>
                                    <span className="stat-label">Jobs Posted</span>
                                </div>
                            </div>
                            <div className="stat-card client-stat">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <span className="stat-number">{myJobs.filter(j => (j.status || '').toUpperCase() === 'ACTIVE' || (j.status || '').toUpperCase() === 'OPEN').length || '—'}</span>
                                    <span className="stat-label">Active Listings</span>
                                </div>
                            </div>
                            <div className="stat-card client-stat">
                                <div className="stat-icon">📬</div>
                                <div className="stat-info">
                                    <span className="stat-number">{myJobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0) || '—'}</span>
                                    <span className="stat-label">Applications</span>
                                </div>
                            </div>
                            <div className="stat-card client-stat">
                                <div className="stat-icon">🏢</div>
                                <div className="stat-info">
                                    <span className="stat-number">{user.companySize || '—'}</span>
                                    <span className="stat-label">Company Size</span>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-card overview-card">
                            <div className="card-header"><h2>Quick Actions</h2></div>
                            <div className="quick-actions">
                                <button className="quick-action-btn client-action" onClick={() => setActiveTab('post-job')}>➕ Post a Job</button>
                                <button className="quick-action-btn client-action" onClick={() => setActiveTab('my-jobs')}>💼 My Jobs</button>
                                <button className="quick-action-btn client-action" onClick={() => setActiveTab('profile')}>✏️ Edit Profile</button>
                            </div>
                        </div>

                        <div className="dashboard-card overview-card">
                            <div className="card-header"><h2>Company Info</h2></div>
                            <div className="profile-view">
                                <div className="profile-field"><span className="field-label">Company</span><span className="field-value">{user.companyName || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Industry</span><span className="field-value">{user.industry || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Team Size</span><span className="field-value">{user.companySize || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Member Since</span><span className="field-value">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── POST A JOB ── */}
                {activeTab === 'post-job' && (
                    <div className="dashboard-card">
                        <div className="card-header"><h2>{editJobId ? 'Edit Job Posting' : 'Post a New Job'}</h2></div>
                        <form onSubmit={handlePostJob} className="profile-form">
                            
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label>Company Logo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div
                                        onClick={() => document.getElementById('logoInput').click()}
                                        style={{
                                            width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed #4b5563',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                            background: logoPreview ? 'transparent' : 'rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0
                                        }}
                                    >
                                        {logoPreview
                                            ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '24px' }}>🖼</span>
                                        }
                                    </div>
                                    <div>
                                        <button type="button" onClick={() => document.getElementById('logoInput').click()} className="save-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                            Upload Image
                                        </button>
                                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>PNG, JPG up to 2MB</p>
                                    </div>
                                </div>
                                <input id="logoInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                            </div>

                            <div className="form-group">
                                <label>Job Title *</label>
                                <input
                                    value={jobForm.title}
                                    onChange={e => setJobForm({...jobForm, title: e.target.value})}
                                    placeholder="e.g. Senior Java Developer"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    rows={5}
                                    value={jobForm.description}
                                    onChange={e => setJobForm({...jobForm, description: e.target.value})}
                                    placeholder="Describe the project, deliverables, and expectations…"
                                    required
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Budget / Exact Salary (USD) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={jobForm.budget}
                                        onChange={e => setJobForm({...jobForm, budget: e.target.value})}
                                        placeholder="e.g. 500"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Deadline *</label>
                                    <input
                                        type="date"
                                        value={jobForm.deadline}
                                        min={getTodayDate()}
                                        max={getTwoMonthsLaterDate()}
                                        onChange={e => setJobForm({...jobForm, deadline: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Location *</label>
                                    <input
                                        type="text"
                                        value={jobForm.location}
                                        onChange={e => setJobForm({...jobForm, location: e.target.value})}
                                        placeholder="e.g. Colombo, Remote"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Job Type *</label>
                                    <select value={jobForm.jobType} onChange={e => setJobForm({...jobForm, jobType: e.target.value})} required>
                                        <option value="Full-Time">Full-Time</option>
                                        <option value="Part-Time">Part-Time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Freelance">Freelance</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Gender Preference *</label>
                                    <select value={jobForm.gender} onChange={e => setJobForm({...jobForm, gender: e.target.value})} required>
                                        <option value="">Any</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Career Level *</label>
                                    <input
                                        type="text"
                                        value={jobForm.careerLevel}
                                        onChange={e => setJobForm({...jobForm, careerLevel: e.target.value})}
                                        placeholder="e.g. Team Leader, Senior"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Industry *</label>
                                    <input
                                        type="text"
                                        value={jobForm.industry}
                                        onChange={e => setJobForm({...jobForm, industry: e.target.value})}
                                        placeholder="e.g. IT, Design"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Experience Required *</label>
                                    <input
                                        type="text"
                                        value={jobForm.experience}
                                        onChange={e => setJobForm({...jobForm, experience: e.target.value})}
                                        placeholder="e.g. 2 Years"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Qualification *</label>
                                    <input
                                        type="text"
                                        value={jobForm.qualification}
                                        onChange={e => setJobForm({...jobForm, qualification: e.target.value})}
                                        placeholder="e.g. Bachelor's Degree"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Required Skills *</label>
                                    <input
                                        value={jobForm.requiredSkills}
                                        onChange={e => setJobForm({...jobForm, requiredSkills: e.target.value})}
                                        placeholder="e.g. React, Node.js (comma separated)"
                                        required
                                    />
                                </div>
                            </div>

                            {postMsg && (
                                <div className={`post-result-msg ${postMsg.startsWith('✅') ? 'post-success' : 'post-error'}`}>
                                    {postMsg}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="save-btn client-save-btn" disabled={postLoading} style={{ flex: 1 }}>
                                    {postLoading ? 'Saving…' : (editJobId ? '✏️ Update Job' : '🚀 Post Job')}
                                </button>
                                {editJobId && (
                                    <button type="button" className="save-btn" style={{ background: '#4b5563', border: 'none', flex: 0.3 }} onClick={() => { setEditJobId(null); setJobForm({ title: '', description: '', budget: '', deadline: '', requiredSkills: '', gender: '', careerLevel: '', industry: '', experience: '', qualification: '', location: '', jobType: 'Full-Time', companyLogo: '' }); setActiveTab('my-jobs'); }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* ── MY JOBS ── */}
                {activeTab === 'my-jobs' && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>My Posted Jobs</h2>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button className="refresh-btn" onClick={fetchMyJobs} disabled={jobsLoading}>🔄 Refresh</button>
                                <button className="post-job-btn" onClick={() => setActiveTab('post-job')}>➕ Post New Job</button>
                            </div>
                        </div>

                        {jobsLoading && <div className="section-loading"><div className="loading-spinner" /> Loading your jobs…</div>}

                        {!jobsLoading && myJobs.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">💼</div>
                                <p>You haven't posted any jobs yet. <button className="link-btn" onClick={() => setActiveTab('post-job')}>Post your first job →</button></p>
                            </div>
                        )}

                        {!jobsLoading && myJobs.map(job => (
                            <div key={job.id || job._id} className="job-card client-job-card">
                                <div className="job-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        {job.companyLogo && (
                                            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                <img src={job.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="job-title">{job.title || 'Untitled Job'}</h3>
                                            <p className="job-meta">
                                                {job.budget && <span>💰 ${job.budget}</span>}
                                                {job.deadline && <span>📅 Due: {new Date(job.deadline).toLocaleDateString()}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button className="edit-btn" onClick={() => startEditJob(job)} style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>✏️ Edit</button>
                                        <button className="delete-btn" onClick={() => handleDeleteJob(job.id || job._id)} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>🗑 Delete</button>
                                        <span className={`status-badge ${getStatusColor(job.status)}`}>
                                            {(job.status || 'ACTIVE').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <p className="job-description">{job.description || 'No description.'}</p>
                                {job.requiredSkills && (
                                    <div className="job-skills">
                                        {job.requiredSkills.split(',').map(s => (
                                            <span key={s.trim()} className="skill-tag client-skill-tag">{s.trim()}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── PROFILE ── */}
                {activeTab === 'profile' && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>Profile Information</h2>
                            <button className="edit-btn" onClick={() => setEditMode(!editMode)}>
                                {editMode ? 'Cancel' : '✏️ Edit'}
                            </button>
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
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <input value={profileData.companyName} onChange={e => setProfileData({...profileData, companyName: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Industry</label>
                                        <input value={profileData.industry} onChange={e => setProfileData({...profileData, industry: e.target.value})} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Company Size</label>
                                    <select value={profileData.companySize} onChange={e => setProfileData({...profileData, companySize: e.target.value})}>
                                        <option value="">Select size</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="200+">200+ employees</option>
                                    </select>
                                </div>
                                <button type="submit" className="save-btn client-save-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                            </form>
                        ) : (
                            <div className="profile-view">
                                <div className="profile-field"><span className="field-label">Full Name</span><span className="field-value">{user.fullName}</span></div>
                                <div className="profile-field"><span className="field-label">Email</span><span className="field-value">{user.email}</span></div>
                                <div className="profile-field"><span className="field-label">Phone</span><span className="field-value">{user.phoneNumber || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Company</span><span className="field-value">{user.companyName || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Industry</span><span className="field-value">{user.industry || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Company Size</span><span className="field-value">{user.companySize || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Member Since</span><span className="field-value">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── SECURITY ── */}
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
                                <button type="button" className="otp-btn" onClick={sendPasswordOtp}>
                                    {otpSent ? '✅ Code Sent - Resend' : '📱 Send Verification Code to Phone'}
                                </button>
                            </div>
                            {otpSent && (
                                <div className="form-group">
                                    <label>Enter OTP</label>
                                    <input type="text" placeholder="6-digit OTP" value={passwordData.otp} onChange={e => setPasswordData({...passwordData, otp: e.target.value})} required maxLength={6} />
                                </div>
                            )}
                            <button type="submit" className="save-btn client-save-btn" disabled={loading || !otpSent}>{loading ? 'Changing...' : 'Change Password'}</button>
                        </form>
                    </div>
                )}

                {/* ── DANGER ── */}
                {activeTab === 'danger' && (
                    <div className="dashboard-card danger-card">
                        <div className="card-header"><h2>Danger Zone</h2></div>
                        <p>Once you delete your account, there is no going back. Please be certain.</p>
                        <button className="delete-btn" onClick={handleDeleteAccount}>🗑️ Delete My Account</button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientDashboard;
