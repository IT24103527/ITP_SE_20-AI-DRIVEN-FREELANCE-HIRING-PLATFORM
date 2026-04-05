import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import './FreelancerDashboard.css';

const API = API_BASE_URL;

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
    const [experience, setExperience] = useState('');
    const [bidAmount, setBidAmount] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('1 Week');
    const [attachment, setAttachment] = useState('');
    const [attachmentName, setAttachmentName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [applyMsg, setApplyMsg] = useState('');
    const [formErrors, setFormErrors] = useState({});

    const [applications, setApplications] = useState([]);
    const [appsLoading, setAppsLoading] = useState(false);
    const [viewingApplication, setViewingApplication] = useState(null);
    const [editingApplicationId, setEditingApplicationId] = useState(null);

    // Contracts
    const [myContracts, setMyContracts] = useState([]);
    const [contractsLoading, setContractsLoading] = useState(false);
    const [updatingContractId, setUpdatingContractId] = useState(null);
    const [situationUpdate, setSituationUpdate] = useState('');

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Sidebar collapse on mobile
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) { navigate('/freelancer-login'); return; }
        fetchProfile();
        fetchJobs();
        fetchApplications();
        fetchMyContracts();
        fetchNotifications();
        // Periodically refresh notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'browse-jobs') fetchJobs();
        if (activeTab === 'my-applications') fetchApplications();
        if (activeTab === 'contracts') fetchMyContracts();
    }, [activeTab]);

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
        console.log('Fetching jobs from:', `${API}/api/jobs`);
        try {
            const res = await fetch(`${API}/api/jobs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Jobs fetched successfully:', data);
                setJobs(Array.isArray(data) ? data : (data.jobs || data.content || []));
            } else {
                console.error('Failed to fetch jobs. Status:', res.status);
                setJobs([]);
            }
        } catch (e) {
            console.error('Error fetching jobs:', e);
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

    const handleUpdateSituation = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/contracts/${updatingContractId}/situation`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ situation: situationUpdate })
            });
            if (res.ok) {
                showMessage('Situation updated successfully!', 'success');
                setUpdatingContractId(null);
                setSituationUpdate('');
                fetchMyContracts();
            } else {
                const data = await res.json();
                showMessage(data.message || 'Update failed', 'error');
            }
        } catch (e) {
            showMessage('Update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const processFile = (file) => {
        if (file) {
            if (file.type !== 'application/pdf') {
                setApplyMsg('failed: Only PDF files are allowed');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setApplyMsg('failed: File size must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setAttachment(reader.result);
                setAttachmentName(file.name);
                setApplyMsg('');
                setFormErrors(prev => ({ ...prev, attachment: false }));
            };
        }
    };

    const validateForm = () => {
        const errors = {};
        if (experience === '' || Number(experience) < 0) errors.experience = "Experience must be 0 or more.";
        if (!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) errors.bidAmount = "Bid amount must be greater than 0.";
        if (!deliveryTime) errors.deliveryTime = "Please select delivery time.";
        if (!coverLetter || coverLetter.length < 10) errors.coverLetter = "Cover letter must be at least 10 chars.";
        if (!attachment) errors.attachment = "Please upload your CV/Proposal PDF.";

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            const firstErr = Object.values(errors)[0];
            setApplyMsg(`failed: ${firstErr}`);
            return false;
        }
        return true;
    };

    const handleApply = async (jobId) => {
        if (!validateForm()) {
            setApplyMsg('failed: Please correct the errors above.');
            return;
        }

        setLoading(true);
        try {
            const url = editingApplicationId
                ? `${API_BASE_URL}/api/applications/${editingApplicationId}`
                : `${API_BASE_URL}/api/applications`;

            const method = editingApplicationId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    jobId,
                    coverLetter,
                    experience,
                    bidAmount,
                    deliveryTime,
                    attachment
                })
            });

            if (res.ok) {
                setApplyMsg(editingApplicationId ? '✅ Proposal updated successfully!' : '✅ Proposal submitted successfully!');
                setTimeout(() => {
                    setApplyingJobId(null);
                    setEditingApplicationId(null);
                    setExperience('');
                    setBidAmount('');
                    setDeliveryTime('1 Week');
                    setCoverLetter('');
                    setAttachment('');
                    setAttachmentName('');
                    setApplyMsg('');
                    fetchApplications();
                    fetchJobs(); // Update counts
                    setActiveTab('overview'); // Show the new proposal on dashboard
                }, 2000);
            } else {
                let errorMsg = 'Operation failed';
                try {
                    const data = await res.json();
                    errorMsg = data.message || errorMsg;
                } catch (e) {
                    errorMsg = `Server error (${res.status})`;
                }
                setApplyMsg(`failed: ${errorMsg}`);
            }
        } catch (err) {
            setApplyMsg('failed: Connection error - Please check if server is running');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelApplication = async (appId) => {
        if (!window.confirm('Are you sure you want to permanently delete this proposal?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/applications/${appId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.ok) {
                fetchApplications();
                fetchJobs();
                if (viewingApplication) setViewingApplication(null);
                alert('Proposal permanently deleted.');
            } else {
                alert('Failed to delete proposal.');
            }
        } catch (e) {
            alert('Error deleting proposal.');
        }
    };

    const handleStartEdit = (app) => {
        let job = jobs.find(j => (j.id || j._id) === app.jobId);

        // If job not in current list (maybe old), we can still edit since we have app details
        // but we placeholder it
        if (!job) {
            job = { id: app.jobId, title: app.jobTitle || 'Original Job', budget: app.bidAmount, description: 'Details not found in current list.' };
        }

        // Populating form with current values
        setExperience(app.experience || '');
        setBidAmount(app.bidAmount || '');
        setDeliveryTime(app.deliveryTime || '1 Week');
        setCoverLetter(app.coverLetter || '');
        setAttachment(app.attachment || '');
        setAttachmentName(app.attachment ? 'Current_Resume.pdf' : '');

        setEditingApplicationId(app.id || app._id);
        setApplyingJobId(app.jobId);
        setViewingJob(job);
        setViewingApplication(null); // Close detail view
        setActiveTab('browse-jobs'); // Shift to browse to see the form

        // Scroll to top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        { key: 'overview', icon: '🏠', label: 'Overview' },
        { key: 'browse-jobs', icon: '🔍', label: 'Browse Jobs' },
        { key: 'my-applications', icon: '📋', label: 'My Applications' },
        { key: 'contracts', icon: '📜', label: 'My Contracts' },
        { key: 'profile', icon: '👤', label: 'My Profile' },
        { key: 'portfolio', icon: '💼', label: 'Portfolio' },
        { key: 'security', icon: '🔒', label: 'Security' },
        { key: 'danger', icon: '⚠️', label: 'Account' },
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
                    <div className="nav-section-label">MY WORK</div>
                    {navItems.slice(0, 4).map(item => (
                        <button
                            key={item.key}
                            className={activeTab === item.key ? 'nav-item active' : 'nav-item'}
                            onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}

                    <div className="nav-section-label" style={{ marginTop: '20px' }}>MY BRAND</div>
                    {navItems.slice(4).map(item => (
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
                    {user.roles && user.roles.includes('CLIENT') && (
                        <button className="nav-item" onClick={() => handleRoleSwitch('CLIENT')} style={{ color: 'var(--accent-light)', border: '1px solid rgba(124, 58, 237, 0.3)', marginBottom: '8px', background: 'rgba(124, 58, 237, 0.05)' }}>
                            <span className="nav-icon">🔄</span>
                            <span className="nav-label">Switch to Client</span>
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
                        <h1>Welcome, {user.fullName?.split(' ')[0]}!</h1>
                        <p>{user.professionalTitle || 'Freelancer Dashboard'}</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '0.75rem' }}>
                            <span style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: '4px' }}>● Backend Connected</span>
                            <span style={{ color: 'var(--accent-light)', background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Jobs Found: {jobs.length}</span>
                        </div>
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
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>{n.senderName || 'System'}</span>
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

                {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <div className="overview-container">
                        {/* New User Welcome Hero */}
                        {applications.length === 0 && (
                            <div className="dashboard-card welcome-hero" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))', border: '1px solid rgba(124,58,237,0.3)', marginBottom: '24px', padding: '30px', textAlign: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#fff' }}>Ready to land your first project? 🚀</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95rem' }}>Your profile is looking good! Start browsing thousands of open opportunities and submit your first proposal today.</p>
                                <button className="save-btn" style={{ padding: '12px 30px' }} onClick={() => setActiveTab('browse-jobs')}>
                                    🔍 Browse All Jobs
                                </button>
                            </div>
                        )}

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
                                <button className="quick-action-btn" onClick={() => setActiveTab('contracts')}>📜 My Contracts</button>
                                <button className="quick-action-btn" onClick={() => setActiveTab('profile')}>✏️ Edit Profile</button>
                                <button className="quick-action-btn" onClick={() => setActiveTab('portfolio')}>💼 Portfolio</button>
                            </div>
                        </div>

                        {/* Recent Jobs Section */}
                        <div className="dashboard-card overview-card">
                            <div className="card-header">
                                <h2>Recent Jobs by Clients</h2>
                                <button className="link-btn" style={{ fontSize: '0.8rem' }} onClick={() => setActiveTab('browse-jobs')}>Browse All →</button>
                            </div>

                            {jobsLoading ? (
                                <div className="section-loading"><div className="loading-spinner" /> Searching for opportunities…</div>
                            ) : jobs.length === 0 ? (
                                <div className="overview-hint" style={{ textAlign: 'center', padding: '30px' }}>
                                    <p>🔍 No active jobs found from any clients.</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>Tip: Log in as a <b>Client</b> and post a job first!</p>
                                    <button className="refresh-btn" style={{ marginTop: '15px' }} onClick={fetchJobs}>Refresh Jobs</button>
                                </div>
                            ) : (
                                <div className="overview-jobs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                    {jobs.slice(0, 6).map(job => (
                                        <div key={job.id || job._id} className="job-card miniature-job" onClick={() => { setViewingJob(job); setActiveTab('browse-jobs'); }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div className="mini-logo">
                                                    {job.companyLogo ? (
                                                        <img src={job.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        job.companyName?.substring(0, 2).toUpperCase() || 'JB'
                                                    )}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</h4>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.companyName}</p>
                                                </div>
                                            </div>
                                            <div className="mini-job-footer">
                                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-light)', background: 'rgba(124,58,237,0.12)', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(124,58,237,0.2)' }}>
                                                    ${job.budget || 'Neg.'}
                                                </span>
                                                <span className="mini-job-location">📍 {job.location || 'Remote'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* My Recent Proposals Section */}
                        {applications.length > 0 && (
                            <div className="dashboard-card overview-card" style={{ marginTop: '24px' }}>
                                <div className="card-header">
                                    <h2>My Recent Proposals</h2>
                                    <button className="link-btn" style={{ fontSize: '0.8rem' }} onClick={() => setActiveTab('my-applications')}>View All →</button>
                                </div>
                                <div className="overview-proposals-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {applications.slice(0, 3).map(app => (
                                        <div
                                            key={app.id || app._id}
                                            className="job-card list-view miniature-app"
                                            style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                                            onClick={() => { setViewingApplication(app); setActiveTab('my-applications'); }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>{app.jobTitle || 'Untitled Job'}</h4>
                                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        Applied on {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                                                    </p>
                                                </div>
                                                <span className={`status-badge ${getStatusColor(app.status)}`} style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                                                    {app.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                            <div style={{ marginTop: '20px' }}>
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
                                                <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '10px' }}>Submit Your Proposal</h4>

                                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                                    <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block', color: formErrors.experience ? '#f87171' : '' }}>Relevant Experience (Years)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className={`job-search-input ${formErrors.experience ? 'error-border' : ''}`}
                                                        style={{ padding: '8px 12px', background: '#fff', color: '#0a0f2e', fontWeight: '600' }}
                                                        placeholder="e.g. 5"
                                                        value={experience}
                                                        onChange={e => { setExperience(e.target.value); setFormErrors(prev => ({ ...prev, experience: false })); }}
                                                    />
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block', color: formErrors.bidAmount ? '#f87171' : '' }}>Your Bid ($)</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className={`job-search-input ${formErrors.bidAmount ? 'error-border' : ''}`}
                                                            style={{ padding: '8px 12px', background: '#fff', color: '#0a0f2e', fontWeight: '600' }}
                                                            placeholder="e.g. 1500"
                                                            value={bidAmount}
                                                            onChange={e => { setBidAmount(e.target.value); setFormErrors(prev => ({ ...prev, bidAmount: false })); }}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block', color: formErrors.deliveryTime ? '#f87171' : '' }}>Delivery Time</label>
                                                        <select
                                                            className={`job-search-input ${formErrors.deliveryTime ? 'error-border' : ''}`}
                                                            style={{ padding: '8px 12px', background: '#fff', width: '100%', color: '#0a0f2e', fontWeight: '600' }}
                                                            value={deliveryTime}
                                                            onChange={e => { setDeliveryTime(e.target.value); setFormErrors(prev => ({ ...prev, deliveryTime: false })); }}
                                                        >
                                                            <option value="1 Day">1 Day</option>
                                                            <option value="3 Days">3 Days</option>
                                                            <option value="1 Week">1 Week</option>
                                                            <option value="2 Weeks">2 Weeks</option>
                                                            <option value="1 Month">1 Month</option>
                                                            <option value="Flexible">Flexible</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                                    <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block', color: formErrors.coverLetter ? '#f87171' : '' }}>Proposal Cover Letter</label>
                                                    <textarea
                                                        className={`cover-letter-input ${formErrors.coverLetter ? 'error-border' : ''}`}
                                                        rows={3}
                                                        style={{ background: '#fff', color: '#0a0f2e', fontWeight: '500' }}
                                                        placeholder="Describe why you are the best fit for this job (min 10 chars)…"
                                                        value={coverLetter}
                                                        onChange={e => { setCoverLetter(e.target.value); setFormErrors(prev => ({ ...prev, coverLetter: false })); }}
                                                    />
                                                </div>

                                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                                    <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block', color: formErrors.attachment ? '#f87171' : '' }}>Resource / CV (PDF)</label>
                                                    <div
                                                        className={`dropzone ${isDragging ? 'dragging' : ''} ${formErrors.attachment ? 'error-border' : ''}`}
                                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                        onDragLeave={() => setIsDragging(false)}
                                                        onDrop={handleFileDrop}
                                                        style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '8px', padding: '15px', textAlign: 'center', transition: 'all 0.2s', background: isDragging ? 'rgba(124,58,237,0.1)' : 'transparent' }}
                                                    >
                                                        {attachmentName ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <span style={{ fontSize: '0.8rem', color: '#fff' }}>📎 {attachmentName}</span>
                                                                <button className="refresh-btn" style={{ fontSize: '0.7rem', padding: '4px 8px' }} onClick={() => { setAttachment(''); setAttachmentName(''); }}>Change PDF</button>
                                                            </div>
                                                        ) : (
                                                            <div onClick={() => document.getElementById('fileInput').click()} style={{ cursor: 'pointer' }}>
                                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Drag & drop PDF here or <span style={{ color: 'var(--accent-light)' }}>browse</span></p>
                                                                <input id="fileInput" type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {applyMsg && <p className={`apply-msg ${applyMsg.includes('failed') ? 'error-text' : 'success-text'}`} style={{ color: applyMsg.includes('failed') ? '#f87171' : '#34d399', fontSize: '0.8rem', marginBottom: '10px' }}>{applyMsg.replace('failed: ', '')}</p>}

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="save-btn" style={{ flex: 1 }} disabled={loading} onClick={() => handleApply(viewingJob ? (viewingJob.id || viewingJob._id) : null)}>
                                                        {loading ? 'Processing…' : (editingApplicationId ? '🔄 Update Proposal' : '🚀 Send Proposal')}
                                                    </button>
                                                    <button className="otp-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => { setApplyingJobId(null); setEditingApplicationId(null); }}>Cancel</button>
                                                </div>
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
                )
                }

                {/* ── MY APPLICATIONS LIST ── */}
                {activeTab === 'my-applications' && !viewingApplication && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>My Applications</h2>
                            <button className="refresh-btn" onClick={fetchApplications} disabled={appsLoading}>🔄 Refresh</button>
                        </div>

                        {appsLoading ? (
                            <div className="section-loading"><div className="loading-spinner" /> Loading your applications…</div>
                        ) : applications.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px 20px' }}>
                                <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                                <h3 style={{ color: '#fff', marginBottom: '10px' }}>No applications yet</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Start browsing jobs and submit your first proposal to see it here.</p>
                                <button className="save-btn" onClick={() => setActiveTab('browse-jobs')}>🚀 Browse Jobs</button>
                            </div>
                        ) : (
                            <div className="applications-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                {applications.map(app => (
                                    <div key={app.id || app._id} className="job-card list-view" style={{ borderLeft: `4px solid ${app.status === 'ACCEPTED' ? '#22c55e' : app.status === 'REJECTED' ? '#ef4444' : 'var(--accent-primary)'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 className="job-title" style={{ fontSize: '1.1rem' }}>{app.jobTitle || 'Untitled Job'}</h3>
                                                <p className="job-meta" style={{ marginTop: '5px' }}>
                                                    <span>📅 {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}</span>
                                                    <span>💰 ${app.bidAmount || 'Neg.'}</span>
                                                </p>
                                            </div>
                                            <span className={`status-badge ${getStatusColor(app.status)}`}>{app.status}</span>
                                        </div>
                                        <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                                            <button className="view-btn" style={{ flex: 1 }} onClick={() => setViewingApplication(app)}>🔍 View Details</button>
                                            {app.status === 'PENDING' && (
                                                <button className="otp-btn" style={{ fontSize: '0.8rem', padding: '0 10px' }} onClick={() => handleCancelApplication(app.id || app._id)}>🗑️</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── APPLICATION DETAILS VIEW ── */}
                {activeTab === 'my-applications' && viewingApplication && (
                    <div className="dashboard-card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                        <div className="job-detail-view">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <button className="back-btn" onClick={() => setViewingApplication(null)} style={{ margin: 0 }}>
                                    ← Back to Applications
                                </button>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {viewingApplication.status === 'PENDING' && (
                                        <>
                                            <button className="otp-btn" style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }} onClick={() => handleStartEdit(viewingApplication)}>✏️ Edit</button>
                                            <button className="otp-btn" style={{ fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }} onClick={() => handleCancelApplication(viewingApplication.id || viewingApplication._id)}>🗑️ Delete</button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="job-detail-grid">
                                <div className="job-detail-main">
                                    <div className="dashboard-card" style={{ marginBottom: '20px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                                            <span className={`status-badge ${getStatusColor(viewingApplication.status)}`} style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '20px' }}>
                                                {viewingApplication.status}
                                            </span>
                                        </div>
                                        <h2 style={{ color: '#fff', fontSize: '1.6rem', paddingRight: '120px' }}>{viewingApplication.jobTitle}</h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '10px' }}>
                                            Submitted on {viewingApplication.appliedAt ? new Date(viewingApplication.appliedAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>

                                    <div className="dashboard-card" style={{ marginBottom: '20px' }}>
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📄</span> Cover Letter Content
                                        </h3>
                                        <div className="job-desc-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            {viewingApplication.coverLetter}
                                        </div>
                                    </div>

                                    {viewingApplication.attachment && (
                                        <div className="dashboard-card">
                                            <h3 style={{ marginBottom: '20px' }}>📎 Attached Documents</h3>
                                            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
                                                    <span style={{ fontSize: '0.9rem' }}>Proposal_Details.pdf</span>
                                                    <a href={viewingApplication.attachment} download="My_Proposal.pdf" className="link-btn" style={{ textDecoration: 'none', color: 'var(--accent-light)' }}>Download PDF</a>
                                                </div>
                                                <iframe
                                                    src={viewingApplication.attachment}
                                                    width="100%"
                                                    height="500px"
                                                    title="Proposal Preview"
                                                    style={{ border: 'none' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="job-detail-sidebar">
                                    <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(30,58,138,0.1) 100%)', border: '1px solid rgba(124,58,237,0.2)' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '20px' }}>Proposal Summary</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>Expertise Shared</span>
                                                <span style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '700' }}>{viewingApplication.experience || '0'} Years</span>
                                            </div>
                                            <div style={{ background: 'rgba(34,197,94,0.05)', padding: '15px', borderRadius: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(34,197,94,0.7)', textTransform: 'uppercase', marginBottom: '5px' }}>Your Financial Bid</span>
                                                <span style={{ fontSize: '1.4rem', color: '#22c55e', fontWeight: '800' }}>${viewingApplication.bidAmount}</span>
                                            </div>
                                            <div style={{ background: 'rgba(59,130,246,0.05)', padding: '15px', borderRadius: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(59,130,246,0.7)', textTransform: 'uppercase', marginBottom: '5px' }}>Delivery Target</span>
                                                <span style={{ fontSize: '1.2rem', color: '#3b82f6', fontWeight: '700' }}>{viewingApplication.deliveryTime}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {jobs.find(j => (j.id || j._id) === viewingApplication.jobId) && (
                                        <div className="dashboard-card" style={{ marginTop: '20px' }}>
                                            <h3 style={{ fontSize: '0.9rem', marginBottom: '15px' }}>Reference Job Details</h3>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                                <p style={{ marginBottom: '10px', fontWeight: '600', color: '#fff' }}>
                                                    {jobs.find(j => (j.id || j._id) === viewingApplication.jobId).title}
                                                </p>
                                                <p style={{ marginBottom: '15px' }}>
                                                    {jobs.find(j => (j.id || j._id) === viewingApplication.jobId).description.substring(0, 300)}...
                                                </p>
                                                <button
                                                    className="save-btn"
                                                    style={{ width: '100%', fontSize: '0.8rem', padding: '10px' }}
                                                    onClick={() => setViewingJob(jobs.find(j => (j.id || j._id) === viewingApplication.jobId))}
                                                >
                                                    View Original Posting
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PROFILE ── */}
                {
                    activeTab === 'profile' && (
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
                                            <input value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Professional Title</label>
                                            <input value={profileData.professionalTitle} onChange={e => setProfileData({ ...profileData, professionalTitle: e.target.value })} placeholder="e.g. Full Stack Developer" />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input value={profileData.phoneNumber} onChange={e => setProfileData({ ...profileData, phoneNumber: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Hourly Rate (USD)</label>
                                            <input type="number" value={profileData.hourlyRate} onChange={e => setProfileData({ ...profileData, hourlyRate: e.target.value })} placeholder="e.g. 50" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Bio</label>
                                        <textarea rows={4} value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} placeholder="Tell clients about yourself..." />
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
                    )
                }

                {/* ── PORTFOLIO ── */}
                {
                    activeTab === 'portfolio' && (
                        <div className="dashboard-card">
                            <div className="card-header"><h2>Portfolio Management</h2></div>
                            <form onSubmit={handleProfileUpdate} className="profile-form">
                                <div className="form-group">
                                    <label>Portfolio URL</label>
                                    <input type="url" value={profileData.portfolioUrl} onChange={e => setProfileData({ ...profileData, portfolioUrl: e.target.value })} placeholder="https://yourportfolio.com" />
                                </div>
                                <div className="form-group">
                                    <label>Experience</label>
                                    <textarea rows={3} value={profileData.experience} onChange={e => setProfileData({ ...profileData, experience: e.target.value })} placeholder="Describe your work experience..." />
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
                    )
                }

                {/* ── SECURITY ── */}
                {
                    activeTab === 'security' && (
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
                                    <button type="button" className="otp-btn" onClick={sendPasswordOtp}>{otpSent ? '✅ OTP Sent - Resend' : '📱 Send OTP'}</button>
                                </div>
                                {otpSent && (
                                    <div className="form-group">
                                        <label>Enter OTP</label>
                                        <input type="text" placeholder="6-digit OTP" value={passwordData.otp} onChange={e => setPasswordData({ ...passwordData, otp: e.target.value })} required maxLength={6} />
                                    </div>
                                )}
                                <button type="submit" className="save-btn" disabled={loading || !otpSent}>{loading ? 'Changing...' : 'Change Password'}</button>
                            </form>
                        </div>
                    )
                }

                {/* ── DANGER ── */}
                {
                    activeTab === 'danger' && (
                        <div className="dashboard-card danger-card">
                            <div className="card-header"><h2>Danger Zone</h2></div>
                            <p>Deleting your account will permanently remove your profile and portfolio.</p>
                            <button className="delete-btn" onClick={handleDeleteAccount}>🗑️ Delete My Account</button>
                        </div>
                    )
                }
                {/* ── MY CONTRACTS ── */}
                {activeTab === 'contracts' && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>My Active Contracts</h2>
                            <button className="refresh-btn" onClick={fetchMyContracts} disabled={contractsLoading}>🔄 Refresh</button>
                        </div>

                        {contractsLoading ? <div className="section-loading">Loading contracts...</div> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                {myContracts.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📜</div>
                                        <p>No active contracts yet. Submit proposals to get hired!</p>
                                    </div>
                                ) : (
                                    myContracts.map(contract => (
                                        <div key={contract.id} className="dashboard-card" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{contract.jobTitle}</h3>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Client: {contract.clientEmail}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span className={`status-badge ${getStatusColor(contract.status)}`}>{contract.status}</span>
                                                    <p style={{ margin: '5px 0 0', fontWeight: 'bold', color: '#22c55e' }}>${contract.amount}</p>
                                                </div>
                                            </div>

                                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h4 style={{ margin: 0, color: 'var(--accent-light)' }}>📍 Current Situation</h4>
                                                    <button className="edit-btn" style={{ fontSize: '0.75rem', padding: '4px 12px' }} onClick={() => { setUpdatingContractId(contract.id); setSituationUpdate(contract.currentSituation); }}>✏️ Update</button>
                                                </div>
                                                <p style={{ marginTop: '12px', fontSize: '1rem', fontStyle: 'italic', color: '#fff' }}>
                                                    "{contract.currentSituation}"
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                <span>Work started: {new Date(contract.createdAt).toLocaleDateString()}</span>
                                                <span>Last updated: {new Date(contract.updatedAt || contract.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Update Situation Modal */}
                        {updatingContractId && (
                            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setUpdatingContractId(null)}>
                                <div className="dashboard-card" style={{ maxWidth: '500px', width: '90%', background: '#0f172a', border: '1px solid #1e293b' }} onClick={e => e.stopPropagation()}>
                                    <div className="card-header">
                                        <h2>Update Progress</h2>
                                    </div>
                                    <form onSubmit={handleUpdateSituation} style={{ padding: '20px' }}>
                                        <p style={{ marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Describe the current status of your work for the client.</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                            {[
                                                { label: '🚀 Start', value: 'Started - Initial setup and planning.' },
                                                { label: '⚡ In Process', value: 'In Process - Actively working on the tasks.' },
                                                { label: '✅ Complete', value: 'Completed - All deliverables submitted.' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.label}
                                                    type="button"
                                                    onClick={() => setSituationUpdate(opt.value)}
                                                    style={{
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #1e293b',
                                                        background: situationUpdate === opt.value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.02)',
                                                        color: situationUpdate === opt.value ? 'var(--accent-light)' : 'var(--text-secondary)',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        borderColor: situationUpdate === opt.value ? 'var(--accent-primary)' : '#1e293b'
                                                    }}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            rows={3}
                                            value={situationUpdate}
                                            onChange={e => setSituationUpdate(e.target.value)}
                                            placeholder="Or type a custom update here..."
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #1e293b', marginBottom: '20px', fontSize: '0.9rem' }}
                                            required
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="submit" className="save-btn" disabled={loading} style={{ flex: 1 }}>{loading ? 'Updating...' : 'Save Update'}</button>
                                            <button type="button" className="otp-btn" style={{ flex: 0.5 }} onClick={() => setUpdatingContractId(null)}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main >
        </div >
    );
};

export default FreelancerDashboard;
