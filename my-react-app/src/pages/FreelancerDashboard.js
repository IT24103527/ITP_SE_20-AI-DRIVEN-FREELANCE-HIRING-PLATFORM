import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './FreelancerDashboard.css';

const API = 'http://localhost:8080';

const FreelancerDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', otp: '' });
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const [skillsList, setSkillsList] = useState([]);

    // Browse Jobs
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobSearch, setJobSearch] = useState('');
    const [applyingJobId, setApplyingJobId] = useState(null);
    const [viewingJob, setViewingJob] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [applyMsg, setApplyMsg] = useState('');

    // My Applications
    const [applications, setApplications] = useState([]);
    const [appsLoading, setAppsLoading] = useState(false);

    // Sidebar collapse on mobile
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) { navigate('/freelancer-login'); return; }
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'browse-jobs') fetchJobs();
        if (activeTab === 'my-applications') fetchApplications();
    }, [activeTab]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) { navigate('/freelancer-login'); return; }
            const data = await res.json();
            const storedRole = localStorage.getItem('userRole');
            const userRole = data.role || storedRole;
            if (userRole && userRole !== 'FREELANCER') { navigate('/freelancer-login'); return; }
            setUser(data);
            const skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
            setSkillsList(skills);
            setProfileData({
                fullName: data.fullName || '',
                phoneNumber: data.phoneNumber || '',
                professionalTitle: data.professionalTitle || '',
                skills: data.skills || '',
                portfolioUrl: data.portfolioUrl || '',
                bio: data.bio || '',
                hourlyRate: data.hourlyRate || '',
                experience: data.experience || ''
            });
        } catch (e) {
            showMessage('Failed to load profile', 'error');
        }
    };

    const fetchJobs = async () => {
        setJobsLoading(true);
        try {
            const res = await fetch(`${API}/api/jobs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(Array.isArray(data) ? data : (data.jobs || data.content || []));
            } else {
                setJobs([]);
            }
        } catch (e) {
            setJobs([]);
        } finally {
            setJobsLoading(false);
        }
    };

    const fetchApplications = async () => {
        setAppsLoading(true);
        try {
            const res = await fetch(`${API}/api/applications/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setApplications(Array.isArray(data) ? data : (data.applications || []));
            } else {
                setApplications([]);
            }
        } catch (e) {
            setApplications([]);
        } finally {
            setAppsLoading(false);
        }
    };

    const handleApply = async (jobId) => {
        setLoading(true);
        setApplyMsg('');
        try {
            const res = await fetch(`${API}/api/applications`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, coverLetter })
            });
            const data = await res.json();
            if (res.ok) {
                setApplyMsg('✅ Application submitted successfully!');
                setApplyingJobId(null);
                setCoverLetter('');
                showMessage('Application submitted!', 'success');
            } else {
                setApplyMsg(data.message || 'Failed to submit application');
            }
        } catch (e) {
            setApplyMsg('Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !skillsList.includes(s)) {
            const updated = [...skillsList, s];
            setSkillsList(updated);
            setProfileData({ ...profileData, skills: updated.join(', ') });
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => {
        const updated = skillsList.filter(s => s !== skill);
        setSkillsList(updated);
        setProfileData({ ...profileData, skills: updated.join(', ') });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/user/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...profileData, skills: skillsList.join(', ') })
            });
            const data = await res.json();
            if (res.ok) {
                setUser(data.user);
                setEditMode(false);
                showMessage('Profile updated!', 'success');
            } else showMessage(data.message, 'error');
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
        if (!window.confirm('Delete your account permanently?')) return;
        try {
            const res = await fetch(`${API}/api/user/account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { localStorage.clear(); navigate('/'); }
            else showMessage('Delete failed', 'error');
        } catch (e) { showMessage('Delete failed', 'error'); }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/freelancer-login'); };

    const filteredJobs = jobs.filter(j =>
        !jobSearch || (j.title || '').toLowerCase().includes(jobSearch.toLowerCase()) ||
        (j.description || '').toLowerCase().includes(jobSearch.toLowerCase()) ||
        (j.requiredSkills || '').toLowerCase().includes(jobSearch.toLowerCase())
    );

    const profileCompleteness = () => {
        if (!user) return 0;
        const fields = [user.fullName, user.email, user.phoneNumber, user.professionalTitle, user.bio, user.skills, user.portfolioUrl, user.hourlyRate];
        return Math.round((fields.filter(Boolean).length / fields.length) * 100);
    };

    const getStatusColor = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'ACCEPTED') return 'status-accepted';
        if (s === 'REJECTED') return 'status-rejected';
        return 'status-pending';
    };

    if (!user) return <div className="dashboard-loading"><div className="loading-spinner" /><p>Loading...</p></div>;

    const navItems = [
        { key: 'overview',         icon: '🏠', label: 'Overview' },
        { key: 'browse-jobs',      icon: '🔍', label: 'Browse Jobs' },
        { key: 'my-applications',  icon: '📋', label: 'My Applications' },
        { key: 'profile',          icon: '👤', label: 'My Profile' },
        { key: 'portfolio',        icon: '💼', label: 'Portfolio' },
        { key: 'security',         icon: '🔒', label: 'Security' },
        { key: 'danger',           icon: '⚠️', label: 'Account' },
    ];

    return (
        <div className="dashboard-page freelancer-theme">
            {/* Mobile menu toggle */}
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
                {sidebarOpen ? '✕' : '☰'}
            </button>

            <aside className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>TalentFlow<span className="ai-accent">AI</span></h2>
                    <span className="role-badge freelancer-badge">Freelancer</span>
                </div>
                <div className="sidebar-user">
                    <div className="user-avatar freelancer-avatar">{user.fullName?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{user.fullName}</p>
                        <p className="user-email">{user.professionalTitle || user.email}</p>
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
                    <h1>Welcome, {user.fullName?.split(' ')[0]}!</h1>
                    <p>{user.professionalTitle || 'Freelancer Dashboard'}</p>
                </div>

                {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <div>
                        <div className="stats-grid">
                            <div className="stat-card freelancer-stat">
                                <div className="stat-icon">📋</div>
                                <div className="stat-info">
                                    <span className="stat-number">{applications.length || '—'}</span>
                                    <span className="stat-label">Applications</span>
                                </div>
                            </div>
                            <div className="stat-card freelancer-stat">
                                <div className="stat-icon">🛠️</div>
                                <div className="stat-info">
                                    <span className="stat-number">{skillsList.length}</span>
                                    <span className="stat-label">Skills Listed</span>
                                </div>
                            </div>
                            <div className="stat-card freelancer-stat">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <span className="stat-number">{profileCompleteness()}%</span>
                                    <span className="stat-label">Profile Complete</span>
                                </div>
                            </div>
                            <div className="stat-card freelancer-stat">
                                <div className="stat-icon">💰</div>
                                <div className="stat-info">
                                    <span className="stat-number">{user.hourlyRate ? `$${user.hourlyRate}` : '—'}</span>
                                    <span className="stat-label">Hourly Rate</span>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-card overview-card">
                            <div className="card-header"><h2>Profile Completeness</h2></div>
                            <div className="progress-bar-wrap">
                                <div className="progress-bar-track">
                                    <div className="progress-bar-fill freelancer-fill" style={{ width: `${profileCompleteness()}%` }} />
                                </div>
                                <span className="progress-label">{profileCompleteness()}%</span>
                            </div>
                            {profileCompleteness() < 100 && (
                                <p className="overview-hint">💡 Complete your profile to attract more clients. Add your bio, skills, and portfolio URL.</p>
                            )}
                        </div>

                        <div className="dashboard-card overview-card">
                            <div className="card-header"><h2>Quick Actions</h2></div>
                            <div className="quick-actions">
                                <button className="quick-action-btn" onClick={() => setActiveTab('browse-jobs')}>🔍 Browse Jobs</button>
                                <button className="quick-action-btn" onClick={() => setActiveTab('my-applications')}>📋 My Applications</button>
                                <button className="quick-action-btn" onClick={() => setActiveTab('profile')}>✏️ Edit Profile</button>
                                <button className="quick-action-btn" onClick={() => setActiveTab('portfolio')}>💼 Portfolio</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BROWSE JOBS ── */}
                {activeTab === 'browse-jobs' && (
                    <div className="dashboard-card" style={{ background: viewingJob ? 'transparent' : '', border: viewingJob ? 'none' : '' }}>
                        {viewingJob ? (
                            <div className="job-detail-view">
                                <button className="back-btn" onClick={() => { setViewingJob(null); setApplyingJobId(null); }}>
                                    ← Back to Jobs
                                </button>
                                
                                <div className="job-detail-grid">
                                    <div className="job-detail-main">
                                        <div className="job-detail-header-card dashboard-card">
                                            <div className="job-company-logo" style={{ padding: viewingJob.companyLogo ? 0 : '', overflow: 'hidden' }}>
                                                {viewingJob.companyLogo ? (
                                                    <img src={viewingJob.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    viewingJob.companyName?.substring(0, 2).toUpperCase() || 'CO'
                                                )}
                                            </div>
                                            <div className="job-header-info">
                                                <h2>{viewingJob.title}</h2>
                                                <p className="job-company">{viewingJob.companyName}</p>
                                                <div className="job-tags">
                                                    <span className="job-tag type-tag">{viewingJob.jobType || 'Full-Time'}</span>
                                                    <span className="job-tag status-tag">OPEN</span>
                                                </div>
                                                <div className="job-meta-row">
                                                    <span>📍 {viewingJob.location || 'Remote'}</span>
                                                    <span>💰 {viewingJob.budget ? `$${viewingJob.budget}` : 'Negotiable'}</span>
                                                    <span>📅 Apply by {viewingJob.deadline ? new Date(viewingJob.deadline).toLocaleDateString() : 'ASAP'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="job-detail-description dashboard-card">
                                            <h3>📋 Job Description</h3>
                                            <div className="job-desc-content">
                                                {viewingJob.description || 'No description provided.'}
                                            </div>
                                            
                                            {viewingJob.requiredSkills && (
                                                <div style={{marginTop: '20px'}}>
                                                    <h4>Required Skills</h4>
                                                    <div className="job-skills">
                                                        {viewingJob.requiredSkills.split(',').map(s => (
                                                            <span key={s.trim()} className="skill-tag">{s.trim()}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="job-detail-sidebar">
                                        <div className="job-apply-card dashboard-card">
                                            <p className="apply-hint">You are viewing this job as a freelancer.</p>
                                            
                                            {applyingJobId === (viewingJob.id || viewingJob._id) ? (
                                                <div className="apply-section">
                                                    <textarea
                                                        className="cover-letter-input"
                                                        rows={4}
                                                        placeholder="Write a short cover letter…"
                                                        value={coverLetter}
                                                        onChange={e => setCoverLetter(e.target.value)}
                                                    />
                                                    {applyMsg && <p className={`apply-msg ${applyMsg.includes('failed') ? 'error-text' : 'success-text'}`}>{applyMsg}</p>}
                                                    <button className="save-btn w-100" disabled={loading} onClick={() => handleApply(viewingJob.id || viewingJob._id)}>
                                                        {loading ? 'Submitting…' : '🚀 Confirm Application'}
                                                    </button>
                                                    <button className="cancel-btn w-100 mt-2" onClick={() => setApplyingJobId(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button className="apply-main-btn" onClick={() => setApplyingJobId(viewingJob.id || viewingJob._id)}>
                                                    ✉️ Apply Now
                                                </button>
                                            )}
                                        </div>

                                        <div className="job-overview-card dashboard-card">
                                            <h3>📊 Job Overview</h3>
                                            <div className="overview-list">
                                                <div className="overview-item">
                                                    <span className="oi-label">💰 Offered Salary</span>
                                                    <span className="oi-value">{viewingJob.budget ? `$${viewingJob.budget}` : 'Negotiable'}</span>
                                                </div>
                                                <div className="overview-item">
                                                    <span className="oi-label">👤 Gender</span>
                                                    <span className="oi-value">{viewingJob.gender || 'Any'}</span>
                                                </div>
                                                <div className="overview-item">
                                                    <span className="oi-label">🏅 Career Level</span>
                                                    <span className="oi-value">{viewingJob.careerLevel || 'Any'}</span>
                                                </div>
                                                <div className="overview-item">
                                                    <span className="oi-label">🏭 Industry</span>
                                                    <span className="oi-value">{viewingJob.industry || 'Any'}</span>
                                                </div>
                                                <div className="overview-item">
                                                    <span className="oi-label">🕒 Experience</span>
                                                    <span className="oi-value">{viewingJob.experience || 'Not specified'}</span>
                                                </div>
                                                <div className="overview-item">
                                                    <span className="oi-label">🎓 Qualification</span>
                                                    <span className="oi-value">{viewingJob.qualification || 'Not specified'}</span>
                                                </div>
                                                <div className="overview-item">
                                                    <span className="oi-label">📅 Deadline</span>
                                                    <span className="oi-value">{viewingJob.deadline ? new Date(viewingJob.deadline).toLocaleDateString() : 'None'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="card-header">
                                    <h2>Browse Jobs</h2>
                                    <button className="refresh-btn" onClick={fetchJobs} disabled={jobsLoading}>🔄 Refresh</button>
                                </div>
                                <div className="job-search-bar">
                                    <input
                                        type="text"
                                        placeholder="Search by title, skill, or keyword…"
                                        value={jobSearch}
                                        onChange={e => setJobSearch(e.target.value)}
                                        className="job-search-input"
                                    />
                                </div>

                                {jobsLoading && <div className="section-loading"><div className="loading-spinner" /> Loading jobs…</div>}

                                {!jobsLoading && filteredJobs.length === 0 && (
                                    <div className="empty-state">
                                        <div className="empty-icon">🔍</div>
                                        <p>No jobs found. Check back soon or ask your client to post jobs!</p>
                                    </div>
                                )}

                                {!jobsLoading && filteredJobs.map(job => (
                                    <div key={job.id || job._id} className="job-card list-view" onClick={() => setViewingJob(job)}>
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
                                                        {job.companyName && <span>🏢 {job.companyName}</span>}
                                                        {job.location && <span>📍 {job.location}</span>}
                                                        {job.budget && <span>💰 ${job.budget}</span>}
                                                        {job.deadline && <span>📅 Due: {new Date(job.deadline).toLocaleDateString()}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="view-btn">View</button>
                                        </div>
                                        <p className="job-description">{job.description ? job.description.substring(0, 150) + '...' : 'No description provided.'}</p>
                                        {job.requiredSkills && (
                                            <div className="job-skills">
                                                {job.requiredSkills.split(',').slice(0, 3).map(s => (
                                                    <span key={s.trim()} className="skill-tag">{s.trim()}</span>
                                                ))}
                                                {job.requiredSkills.split(',').length > 3 && <span className="skill-tag">+{job.requiredSkills.split(',').length - 3}</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* ── MY APPLICATIONS ── */}
                {activeTab === 'my-applications' && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>My Applications</h2>
                            <button className="refresh-btn" onClick={fetchApplications} disabled={appsLoading}>🔄 Refresh</button>
                        </div>

                        {appsLoading && <div className="section-loading"><div className="loading-spinner" /> Loading applications…</div>}

                        {!appsLoading && applications.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <p>You haven't applied to any jobs yet. <button className="link-btn" onClick={() => setActiveTab('browse-jobs')}>Browse Jobs →</button></p>
                            </div>
                        )}

                        {!appsLoading && applications.map(app => (
                            <div key={app.id || app._id} className="application-card">
                                <div className="application-card-header">
                                    <div>
                                        <h3 className="app-job-title">{app.jobTitle || app.job?.title || 'Job'}</h3>
                                        <p className="app-meta">
                                            {app.appliedAt && <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>}
                                        </p>
                                    </div>
                                    <span className={`status-badge ${getStatusColor(app.status)}`}>
                                        {(app.status || 'PENDING').toUpperCase()}
                                    </span>
                                </div>
                                {app.coverLetter && (
                                    <p className="app-cover-letter">"{app.coverLetter}"</p>
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
                                        <label>Professional Title</label>
                                        <input value={profileData.professionalTitle} onChange={e => setProfileData({...profileData, professionalTitle: e.target.value})} placeholder="e.g. Full Stack Developer" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input value={profileData.phoneNumber} onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Hourly Rate (USD)</label>
                                        <input type="number" value={profileData.hourlyRate} onChange={e => setProfileData({...profileData, hourlyRate: e.target.value})} placeholder="e.g. 50" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Bio</label>
                                    <textarea rows={4} value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} placeholder="Tell clients about yourself..." />
                                </div>
                                <button type="submit" className="save-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                            </form>
                        ) : (
                            <div className="profile-view">
                                <div className="profile-field"><span className="field-label">Full Name</span><span className="field-value">{user.fullName}</span></div>
                                <div className="profile-field"><span className="field-label">Email</span><span className="field-value">{user.email}</span></div>
                                <div className="profile-field"><span className="field-label">Phone</span><span className="field-value">{user.phoneNumber || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Title</span><span className="field-value">{user.professionalTitle || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Hourly Rate</span><span className="field-value">{user.hourlyRate ? `$${user.hourlyRate}/hr` : 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Bio</span><span className="field-value bio-value">{user.bio || 'Not set'}</span></div>
                                <div className="profile-field"><span className="field-label">Member Since</span><span className="field-value">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── PORTFOLIO ── */}
                {activeTab === 'portfolio' && (
                    <div className="dashboard-card">
                        <div className="card-header"><h2>Portfolio Management</h2></div>
                        <form onSubmit={handleProfileUpdate} className="profile-form">
                            <div className="form-group">
                                <label>Portfolio URL</label>
                                <input type="url" value={profileData.portfolioUrl} onChange={e => setProfileData({...profileData, portfolioUrl: e.target.value})} placeholder="https://yourportfolio.com" />
                            </div>
                            <div className="form-group">
                                <label>Experience</label>
                                <textarea rows={3} value={profileData.experience} onChange={e => setProfileData({...profileData, experience: e.target.value})} placeholder="Describe your work experience..." />
                            </div>
                            <div className="form-group">
                                <label>Skills</label>
                                <div className="skill-input-row">
                                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill and press Enter" />
                                    <button type="button" className="add-skill-btn" onClick={addSkill}>+ Add</button>
                                </div>
                                <div className="skills-tags">
                                    {skillsList.map(skill => (
                                        <span key={skill} className="skill-tag">
                                            {skill}
                                            <button type="button" onClick={() => removeSkill(skill)}>×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="portfolio-preview">
                                <h3>Current Portfolio</h3>
                                <div className="portfolio-info">
                                    <div className="portfolio-stat"><span className="stat-label">Skills</span><span className="stat-value">{skillsList.length}</span></div>
                                    <div className="portfolio-stat"><span className="stat-label">Portfolio URL</span><span className="stat-value">{user.portfolioUrl ? <a href={user.portfolioUrl} target="_blank" rel="noreferrer">View Portfolio</a> : 'Not set'}</span></div>
                                </div>
                            </div>
                            <button type="submit" className="save-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Portfolio'}</button>
                        </form>
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

                {/* ── DANGER ── */}
                {activeTab === 'danger' && (
                    <div className="dashboard-card danger-card">
                        <div className="card-header"><h2>Danger Zone</h2></div>
                        <p>Deleting your account will permanently remove your profile and portfolio.</p>
                        <button className="delete-btn" onClick={handleDeleteAccount}>🗑️ Delete My Account</button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FreelancerDashboard;
