import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import './ClientDashboard.css';

const API = API_BASE_URL;

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
    const [viewingJobApplications, setViewingJobApplications] = useState(null); // jobId
    const [jobApplications, setJobApplications] = useState([]);
    const [appsLoading, setAppsLoading] = useState(false);

    // Centralized Proposals (across all jobs)
    const [allProposals, setAllProposals] = useState([]);
    const [allProposalsLoading, setAllProposalsLoading] = useState(false);

    // Contracts
    const [myContracts, setMyContracts] = useState([]);
    const [contractsLoading, setContractsLoading] = useState(false);

    // Post/Edit a Job
    const [editJobId, setEditJobId] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [jobForm, setJobForm] = useState({ title: '', description: '', budget: '', deadline: '', requiredSkills: '', gender: '', careerLevel: '', industry: '', experience: '', qualification: '', location: '', jobType: 'Full-Time', companyLogo: '' });
    const [postMsg, setPostMsg] = useState('');
    const [postLoading, setPostLoading] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Mobile sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchProfile();
        fetchNotifications();
        // Periodically refresh notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'my-jobs') fetchMyJobs();
        if (activeTab === 'contracts') fetchMyContracts();
        if (activeTab === 'proposals') fetchAllProposals();
    }, [activeTab]);

    const fetchAllProposals = async () => {
        setAllProposalsLoading(true);
        console.log('Fetching all proposals for client...');
        try {
            const res = await fetch(`${API}/api/applications/client`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Centralized proposals fetched:', data);
                setAllProposals(data);
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Failed to fetch proposals. Status:', res.status, errData);
                showMessage(errData.message || `Error ${res.status}: Could not load all proposals`, 'error');
                setAllProposals([]);
            }
        } catch (e) {
            console.error('Failed to fetch all proposals', e);
            showMessage('Connection error: Could not fetch proposals', 'error');
            setAllProposals([]);
        } finally {
            setAllProposalsLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${API}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !(n.isRead || n.read)).length);
            }
        } catch (e) { console.error('Failed to fetch notifications', e); }
    };

    const markAsRead = async (id) => {
        try {
            await fetch(`${API}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (e) { console.error('Failed to mark notification as read', e); }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${API}/api/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
            showMessage('All notifications marked as read', 'success');
        } catch (e) { console.error('Failed to mark all as read', e); }
    };

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

    const fetchJobApplications = async (jobId) => {
        setAppsLoading(true);
        console.log(`Fetching applications for job: ${jobId}`);
        try {
            const res = await fetch(`${API}/api/applications/job/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Job applications fetched:', data);
                setJobApplications(data);
                setViewingJobApplications(jobId);
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Job applications fetch error:', res.status, errData);
                showMessage(errData.message || `Error ${res.status}: Failed to load applications`, 'error');
            }
        } catch (e) {
            console.error('Failed to fetch job applications', e);
            showMessage('Connection error: Could not fetch applications for this job', 'error');
        } finally {
            setAppsLoading(false);
        }
    };

    const handleUpdateAppStatus = async (appId, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus === 'ACCEPTED' ? 'Accept' : 'Reject'} this proposal?`)) return;
        try {
            const res = await fetch(`${API}/api/applications/${appId}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                showMessage(`Proposal ${newStatus.toLowerCase()} successfully!`, 'success');
                if (newStatus === 'ACCEPTED') {
                    setActiveTab('contracts');
                } else {
                    if (viewingJobApplications) fetchJobApplications(viewingJobApplications);
                    if (activeTab === 'proposals') fetchAllProposals();
                }
            } else {
                const data = await res.json();
                showMessage(data.message || 'Operation failed', 'error');
            }
        } catch (e) {
            showMessage('Operation failed', 'error');
        }
    };

    const fetchMyContracts = async () => {
        setContractsLoading(true);
        try {
            const res = await fetch(`${API}/api/contracts/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyContracts(data);
            }
        } catch (e) {
            console.error('Failed to fetch contracts', e);
        } finally {
            setContractsLoading(false);
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
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleRoleSwitch = async (newRole) => {
        if (!window.confirm(`Switch to ${newRole.toLowerCase()} dashboard?`)) return;
        try {
            const res = await fetch(`${API}/api/auth/switch-role`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role);
                // Force reload to clean up state and redirect
                window.location.href = newRole === 'FREELANCER' ? '/freelancer-dashboard' : '/client-dashboard';
            } else {
                const data = await res.json();
                showMessage(data.message || 'Failed to switch role', 'error');
            }
        } catch (e) {
            showMessage('Error switching roles', 'error');
        }
    };

    const getStatusColor = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'ACTIVE' || s === 'OPEN') return 'status-accepted';
        if (s === 'CLOSED' || s === 'EXPIRED') return 'status-rejected';
        return 'status-pending';
    };

    if (!user) return <div className="dashboard-loading"><div className="loading-spinner" /><p>Loading...</p></div>;

    const navItems = [
        { key: 'overview', icon: '🏠', label: 'Overview' },
        { key: 'post-job', icon: '➕', label: 'Post a Job' },
        { key: 'my-jobs', icon: '💼', label: 'My Jobs' },
        { key: 'proposals', icon: '📬', label: 'Proposals' },
        { key: 'contracts', icon: '📜', label: 'Active Contracts' },
        { key: 'profile', icon: '👤', label: 'My Profile' },
        { key: 'security', icon: '🔒', label: 'Security' },
        { key: 'danger', icon: '⚠️', label: 'Account' },
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
                    {user.roles && user.roles.includes('FREELANCER') && (
                        <button className="nav-item" onClick={() => handleRoleSwitch('FREELANCER')} style={{ color: 'var(--cyan)', border: '1px solid rgba(6, 182, 212, 0.3)', marginBottom: '8px', background: 'rgba(6, 182, 212, 0.05)' }}>
                            <span className="nav-icon">🔄</span>
                            <span className="nav-label">Switch to Freelancer</span>
                        </button>
                    )}
                    <Link to="/" className="home-btn">🏠 Home</Link>
                    <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
                </div>
            </aside>

            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <main className="dashboard-main">
                <div className="dashboard-header" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Welcome back, {user.fullName?.split(' ')[0]}!</h1>
                        <p>{user.companyName ? `${user.companyName} · Client Dashboard` : 'Client Dashboard'}</p>
                    </div>

                    {/* Notification Bell */}
                    <div className="notification-wrapper" style={{ position: 'relative' }}>
                        <button
                            className="notif-bell-btn"
                            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '45px', height: '45px', fontSize: '1.4rem', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid #0f172a' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifDropdown && (
                            <div className="notif-dropdown" style={{ position: 'absolute', top: '55px', right: '0', width: '320px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'hidden' }}>
                                <div style={{ padding: '15px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--accent-light)', fontSize: '0.75rem', cursor: 'pointer' }}>Mark all read</button>
                                    )}
                                </div>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => !(n.isRead || n.read) && markAsRead(n.id)}
                                                style={{ padding: '12px 15px', borderBottom: '1px solid #334155', background: (n.isRead || n.read) ? 'transparent' : 'rgba(124,58,237,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <span style={{ fontSize: '0.7rem', color: n.type === 'SUCCESS' ? '#22c55e' : n.type === 'DANGER' ? '#ef4444' : 'var(--accent-light)', fontWeight: 'bold' }}>{n.type || 'INFO'}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>{n.senderName || 'Freelancer'}</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: n.isRead ? 'var(--text-secondary)' : '#fff', lineHeight: '1.4' }}>{n.message}</p>
                                                <div style={{ textAlign: 'right', marginTop: '5px' }}>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
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
                                <button className="quick-action-btn client-action" onClick={() => setActiveTab('proposals')}>📬 View Proposals</button>
                                <button className="quick-action-btn client-action" onClick={() => setActiveTab('my-jobs')}>💼 My Jobs</button>
                                <button className="quick-action-btn client-action" onClick={() => setActiveTab('contracts')}>📜 Active Contracts</button>
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
                                    onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                                    placeholder="e.g. Senior Java Developer"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    rows={5}
                                    value={jobForm.description}
                                    onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
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
                                        onChange={e => setJobForm({ ...jobForm, budget: e.target.value })}
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
                                        onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })}
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
                                        onChange={e => setJobForm({ ...jobForm, location: e.target.value })}
                                        placeholder="e.g. Colombo, Remote"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Job Type *</label>
                                    <select value={jobForm.jobType} onChange={e => setJobForm({ ...jobForm, jobType: e.target.value })} required>
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
                                    <select value={jobForm.gender} onChange={e => setJobForm({ ...jobForm, gender: e.target.value })} required>
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
                                        onChange={e => setJobForm({ ...jobForm, careerLevel: e.target.value })}
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
                                        onChange={e => setJobForm({ ...jobForm, industry: e.target.value })}
                                        placeholder="e.g. IT, Design"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Experience Required *</label>
                                    <input
                                        type="text"
                                        value={jobForm.experience}
                                        onChange={e => setJobForm({ ...jobForm, experience: e.target.value })}
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
                                        onChange={e => setJobForm({ ...jobForm, qualification: e.target.value })}
                                        placeholder="e.g. Bachelor's Degree"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Required Skills *</label>
                                    <input
                                        value={jobForm.requiredSkills}
                                        onChange={e => setJobForm({ ...jobForm, requiredSkills: e.target.value })}
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
                                <div className="job-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto' }}>
                                    {job.companyLogo && (
                                        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={job.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <h3 className="job-title" style={{ marginBottom: 0, whiteSpace: 'nowrap', fontSize: '0.95rem' }}>{job.title || 'Untitled Job'}</h3>

                                    <div className="job-meta" style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                        {job.budget && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>💰 ${job.budget}</span>}
                                        {job.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📅 Due: {new Date(job.deadline).toLocaleDateString()}</span>}
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                                        {job.applicationCount > 0 && (
                                            <button className="edit-btn" onClick={() => fetchJobApplications(job.id || job._id)} style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: '0.75rem' }}>📬 Proposals ({job.applicationCount})</button>
                                        )}
                                        <button className="edit-btn" onClick={() => startEditJob(job)} style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '0.75rem' }}>✏️ Edit</button>
                                        <button className="delete-btn" onClick={() => handleDeleteJob(job.id || job._id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.75rem', margin: 0 }}>🗑 Delete</button>
                                        <span className={`status-badge ${getStatusColor(job.status)}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
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

                        {/* Proposal Review Section */}
                        {viewingJobApplications && (
                            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setViewingJobApplications(null)}>
                                <div className="dashboard-card" style={{ maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#0f172a', border: '1px solid #1e293b' }} onClick={e => e.stopPropagation()}>
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2>Proposals for {myJobs.find(j => (j.id || j._id) === viewingJobApplications)?.title}</h2>
                                        <button className="close-btn" onClick={() => setViewingJobApplications(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#fff', cursor: 'pointer' }}>×</button>
                                    </div>

                                    {appsLoading ? <div className="section-loading">Loading proposals...</div> : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                                            {jobApplications.length === 0 ? <p>No applications yet.</p> : (
                                                jobApplications.map(app => (
                                                    <div key={app.id || app._id} className="job-card client-job-card proposal-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0' }}>
                                                        <div className="job-card-header">
                                                            <div>
                                                                <h3 className="job-title">{app.freelancerName}</h3>
                                                                <p className="job-meta">
                                                                    <span><span className="icon">📧</span> {app.freelancerEmail}</span>
                                                                </p>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: '800', color: '#22c55e', marginBottom: '4px' }}>${app.bidAmount}</span>
                                                                <div className="proposal-info-item" style={{ justifyContent: 'flex-end' }}>
                                                                    <span className="icon">🕒</span> <span>{app.deliveryTime}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="proposal-preview-box">
                                                            <p style={{ fontWeight: '700', marginBottom: '8px', fontSize: '0.8rem', color: '#fff', textTransform: 'uppercase' }}>Cover Letter:</p>
                                                            <p className="proposal-content-text">{app.coverLetter}</p>
                                                        </div>

                                                        <div className="proposal-action-bar">
                                                            <div className="proposal-info-group">
                                                                {app.attachment && (
                                                                    <a href={app.attachment} download="Proposal.pdf" className="link-btn" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <span className="icon">📎</span> View PDF
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <div className="proposal-btns">
                                                                {app.status === 'PENDING' ? (
                                                                    <>
                                                                        <button className="save-btn btn-accept" style={{ padding: '8px 22px' }} onClick={() => handleUpdateAppStatus(app.id || app._id, 'ACCEPTED')}>Accept</button>
                                                                        <button className="delete-btn btn-reject" style={{ padding: '8px 22px', marginTop: 0 }} onClick={() => handleUpdateAppStatus(app.id || app._id, 'REJECTED')}>Reject</button>
                                                                    </>
                                                                ) : (
                                                                    <span className={`status-badge ${getStatusColor(app.status)}`}>{app.status}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* ── PROPOSALS TAB ── */}
                {activeTab === 'proposals' && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>All Submitted Proposals</h2>
                            <button className="refresh-btn" onClick={fetchAllProposals} disabled={allProposalsLoading}>🔄 Refresh</button>
                        </div>

                        {allProposalsLoading && <div className="section-loading"><div className="loading-spinner" /> Loading proposals…</div>}

                        {!allProposalsLoading && allProposals.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">📬</div>
                                <p>No proposals received yet across your jobs.</p>
                            </div>
                        )}

                        {!allProposalsLoading && allProposals.map(app => (
                            <div key={app.id || app._id} className="job-card client-job-card proposal-card" style={{ borderLeft: `4px solid ${app.status === 'PENDING' ? 'var(--accent-primary)' : app.status === 'ACCEPTED' ? '#22c55e' : '#ef4444'}` }}>
                                <div className="job-card-header">
                                    <div>
                                        <h3 className="job-title">{app.freelancerName}</h3>
                                        <div className="job-meta">
                                            <span><span className="icon">🎯</span> Applied for: <strong>{app.jobTitle}</strong></span>
                                            <span><span className="icon">📅</span> {new Date(app.appliedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: '800', color: '#22c55e', marginBottom: '4px' }}>${app.bidAmount}</span>
                                        <span className={`status-badge ${getStatusColor(app.status)}`}>{app.status}</span>
                                    </div>
                                </div>

                                <div className="proposal-preview-box">
                                    <p style={{ fontWeight: '700', marginBottom: '10px', fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cover Letter Preview:</p>
                                    <p className="proposal-content-text">{app.coverLetter}</p>
                                </div>

                                <div className="proposal-action-bar">
                                    <div className="proposal-info-group">
                                        {app.attachment && (
                                            <a href={app.attachment} download="Proposal.pdf" className="link-btn" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="icon">📎</span> Download PDF
                                            </a>
                                        )}
                                        <div className="proposal-info-item">
                                            <span className="icon">🕒</span> <span>Delivery: {app.deliveryTime}</span>
                                        </div>
                                    </div>
                                    <div className="proposal-btns">
                                        {app.status === 'PENDING' && (
                                            <>
                                                <button className="save-btn btn-accept" style={{ padding: '8px 22px' }} onClick={() => handleUpdateAppStatus(app.id || app._id, 'ACCEPTED')}>Accept</button>
                                                <button className="delete-btn btn-reject" style={{ padding: '8px 22px', marginTop: 0 }} onClick={() => handleUpdateAppStatus(app.id || app._id, 'REJECTED')}>Reject</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'contracts' && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>Managed Contracts</h2>
                            <button className="refresh-btn" onClick={fetchMyContracts} disabled={contractsLoading}>🔄 Refresh</button>
                        </div>

                        {contractsLoading ? <div className="section-loading">Loading contracts...</div> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                {myContracts.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📜</div>
                                        <p>No active contracts found. Accept a proposal to start a contract!</p>
                                    </div>
                                ) : (
                                    myContracts.map(contract => (
                                        <div key={contract.id} className="dashboard-card" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{contract.jobTitle}</h3>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Freelancer: {contract.freelancerName} ({contract.freelancerEmail})</p>
                                                </div>
                                                <span className={`status-badge ${getStatusColor(contract.status)}`}>{contract.status}</span>
                                            </div>

                                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-primary)' }}></div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                    <h4 style={{ margin: 0, color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>📍</span> Current Status
                                                    </h4>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                                                        🕒 Updated {new Date(contract.updatedAt || contract.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontStyle: 'italic', lineHeight: '1.6', fontWeight: '500' }}>
                                                    "{contract.currentSituation}"
                                                </p>
                                            </div>

                                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                                <span>Contract Amount: <strong style={{ color: '#22c55e' }}>${contract.amount}</strong></span>
                                                <span>Started: {new Date(contract.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
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
                                        <input value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input value={profileData.phoneNumber} onChange={e => setProfileData({ ...profileData, phoneNumber: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <input value={profileData.companyName} onChange={e => setProfileData({ ...profileData, companyName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Industry</label>
                                        <input value={profileData.industry} onChange={e => setProfileData({ ...profileData, industry: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Company Size</label>
                                    <select value={profileData.companySize} onChange={e => setProfileData({ ...profileData, companySize: e.target.value })}>
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
                                <input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} required minLength={8} />
                            </div>
                            <div className="otp-section">
                                <button type="button" className="otp-btn" onClick={sendPasswordOtp}>
                                    {otpSent ? '✅ Code Sent - Resend' : '📱 Send Verification Code to Phone'}
                                </button>
                            </div>
                            {otpSent && (
                                <div className="form-group">
                                    <label>Enter OTP</label>
                                    <input type="text" placeholder="6-digit OTP" value={passwordData.otp} onChange={e => setPasswordData({ ...passwordData, otp: e.target.value })} required maxLength={6} />
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
