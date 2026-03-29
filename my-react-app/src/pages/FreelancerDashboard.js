import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './FreelancerDashboard.css';

const API = 'http://localhost:8080';

const FreelancerDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', otp: '' });
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const [skillsList, setSkillsList] = useState([]);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) { navigate('/freelancer-login'); return; }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) { navigate('/freelancer-login'); return; }
            const data = await res.json();
            // Trust the role stored at login time — profile endpoint may not include it
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

    if (!user) return <div className="dashboard-loading">Loading...</div>;

    return (
        <div className="dashboard-page freelancer-theme">
            <aside className="dashboard-sidebar">
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
                    <button className={activeTab === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('profile')}>👤 My Profile</button>
                    <button className={activeTab === 'portfolio' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('portfolio')}>💼 Portfolio</button>
                    <button className={activeTab === 'security' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('security')}>🔒 Security</button>
                    <button className={activeTab === 'danger' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('danger')}>⚠️ Account</button>
                </nav>
                <Link to="/" className="home-btn">🏠 Home</Link>
                <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
            </aside>

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Welcome, {user.fullName?.split(' ')[0]}!</h1>
                    <p>{user.professionalTitle || 'Freelancer Dashboard'}</p>
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
