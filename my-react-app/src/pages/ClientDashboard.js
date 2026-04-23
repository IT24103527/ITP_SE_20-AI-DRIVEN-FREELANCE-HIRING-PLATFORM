import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClientDashboard.css';

const API = 'http://localhost:8080';

const ClientDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', otp: '' });
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('token');

    const showMessage = useCallback((text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }, []);

    const fetchProfile = useCallback(async () => {
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
        } catch (e) { showMessage('Failed to load profile', 'error'); }
    }, [token, navigate, showMessage]);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchProfile();
    }, [token, navigate, fetchProfile]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await fetch(`${API}/api/user/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            const data = await res.json();
            if (res.ok) { setUser(data.user); setEditMode(false); showMessage('Profile updated!', 'success'); }
            else showMessage(data.message, 'error');
        } catch { showMessage('Update failed', 'error'); }
        finally { setLoading(false); }
    };

    const sendPasswordOtp = () => { setOtpSent(true); showMessage('Enter the 6-digit code from your authenticator app', 'success'); };

    const handlePasswordChange = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await fetch(`${API}/api/user/change-password`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData)
            });
            const data = await res.json();
            if (res.ok) { showMessage('Password changed!', 'success'); setPasswordData({ currentPassword: '', newPassword: '', otp: '' }); setOtpSent(false); }
            else showMessage(data.message, 'error');
        } catch { showMessage('Failed', 'error'); }
        finally { setLoading(false); }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Delete your account permanently?')) return;
        const res = await fetch(`${API}/api/user/account`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) { localStorage.clear(); navigate('/'); }
        else showMessage('Delete failed', 'error');
    };

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await fetch(`${API}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });
            }
        } catch { /* never block logout */ }
        localStorage.clear();
        navigate('/login');
    };

    if (!user) return <div className="dashboard-loading">Loading...</div>;

    return (
        <div className="dashboard-page">
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <h2>TalentFlow<span className="ai-accent">AI</span></h2>
                    <span className="role-badge client-badge">Client</span>
                </div>
                <div className="sidebar-user">
                    <div className="user-avatar">{user.fullName?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{user.fullName}</p>
                        <p className="user-email">{user.email}</p>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <button className={activeTab === 'profile'  ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('profile')}>👤 My Profile</button>
                    <button className={activeTab === 'security' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('security')}>🔒 Security</button>
                    <button className={activeTab === 'danger'   ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('danger')}>⚠️ Account</button>
                </nav>
                <Link to="/" className="home-btn">🏠 Home</Link>
                <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
            </aside>

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Welcome back, {user.fullName?.split(' ')[0]}!</h1>
                    <p>Manage your client profile and account settings</p>
                </div>
                {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                {activeTab === 'profile' && (
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2>Profile Information</h2>
                            <button className="edit-btn" onClick={() => setEditMode(!editMode)}>{editMode ? 'Cancel' : '✏️ Edit'}</button>
                        </div>
                        {editMode ? (
                            <form onSubmit={handleProfileUpdate} className="profile-form">
                                <div className="form-row">
                                    <div className="form-group"><label>Full Name</label><input value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} /></div>
                                    <div className="form-group"><label>Phone Number</label><input value={profileData.phoneNumber} onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Company Name</label><input value={profileData.companyName} onChange={e => setProfileData({...profileData, companyName: e.target.value})} /></div>
                                    <div className="form-group"><label>Industry</label><input value={profileData.industry} onChange={e => setProfileData({...profileData, industry: e.target.value})} /></div>
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
                                <button type="submit" className="save-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
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

                {activeTab === 'security' && (
                    <div className="dashboard-card">
                        <div className="card-header"><h2>Change Password</h2></div>
                        <form onSubmit={handlePasswordChange} className="profile-form">
                            <div className="form-group"><label>Current Password</label><input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} required /></div>
                            <div className="form-group"><label>New Password</label><input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required minLength={8} /></div>
                            <div className="otp-section"><button type="button" className="otp-btn" onClick={sendPasswordOtp}>{otpSent ? '✅ OTP Sent - Resend' : '📱 Send OTP'}</button></div>
                            {otpSent && <div className="form-group"><label>Enter OTP</label><input type="text" placeholder="6-digit OTP" value={passwordData.otp} onChange={e => setPasswordData({...passwordData, otp: e.target.value})} required maxLength={6} /></div>}
                            <button type="submit" className="save-btn" disabled={loading || !otpSent}>{loading ? 'Changing...' : 'Change Password'}</button>
                        </form>
                    </div>
                )}

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
