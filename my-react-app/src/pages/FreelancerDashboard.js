import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import './FreelancerDashboard.css';

const API = 'http://localhost:8080';

const LEVELS      = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const LEVEL_PCT   = { Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100 };
const LEVEL_COLORS= ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];
const PROJ_STATUS = ['Completed', 'In Progress', 'Concept'];
const STATUS_COLORS = { Completed: '#10b981', 'In Progress': '#3b82f6', Concept: '#f59e0b' };

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.06) return null;
    const R = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    return (
        <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
            fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const parseSkills = (raw) => {
    if (!raw) return [];
    return raw.split(',').map(s => {
        const p = s.trim().split(':');
        return { name: p[0].trim(), level: p[1]?.trim() || 'Intermediate' };
    }).filter(s => s.name);
};
const parseJSON = (raw, fallback = []) => { try { return JSON.parse(raw) || fallback; } catch { return fallback; } };

const FreelancerDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser]           = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [editMode, setEditMode]   = useState(false);
    const [profileData, setProfileData] = useState({});
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', otp: '' });
    const [otpSent, setOtpSent]     = useState(false);
    const [message, setMessage]     = useState({ text: '', type: '' });
    const [loading, setLoading]     = useState(false);

    // Skills with proficiency
    const [skillsList, setSkillsList]   = useState([]);
    const [skillInput, setSkillInput]   = useState('');
    const [skillLevel, setSkillLevel]   = useState('Intermediate');
    const [editingSkill, setEditingSkill] = useState(null);

    // Projects
    const [projects, setProjects]         = useState([]);
    const [projectForm, setProjectForm]   = useState({ title: '', description: '', tech: '', link: '', status: 'Completed', role: '' });
    const [addingProject, setAddingProject] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    // Certifications
    const [certs, setCerts]       = useState([]);
    const [certForm, setCertForm] = useState({ name: '', issuer: '', year: '', credentialId: '' });
    const [addingCert, setAddingCert] = useState(false);

    // Testimonials
    const [testimonials, setTestimonials] = useState([]);
    const [testForm, setTestForm]         = useState({ client: '', role: '', text: '', rating: 5 });
    const [addingTest, setAddingTest]     = useState(false);

    // Skill filter
    const [skillFilter, setSkillFilter] = useState('');

    const token = localStorage.getItem('token');
    const normalizeRole = (role) => String(role || '').replace(/^ROLE_/, '').toUpperCase();

    const showMessage = useCallback((text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }, []);

    const parsePortfolioBlob = (raw) => {
        const blob = parseJSON(raw, {});
        return { testimonials: blob.testimonials || [], certs: blob.certs || [] };
    };

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/user/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401) { navigate('/freelancer-login'); return; }
            const data = await res.json();
            const storedRole = normalizeRole(localStorage.getItem('userRole'));
            const roleCandidates = [storedRole, data.role, ...(Array.isArray(data.roles) ? data.roles.map(r => typeof r === 'string' ? r : r?.name) : [])].filter(Boolean).map(r => normalizeRole(r));
            if (!roleCandidates.includes('FREELANCER')) { navigate('/freelancer-login'); return; }
            if (!storedRole) localStorage.setItem('userRole', 'FREELANCER');
            setUser(data);
            setSkillsList(parseSkills(data.skills));
            setProjects(parseJSON(data.experience, []));
            const blob = parsePortfolioBlob(data.companyName);
            setTestimonials(blob.testimonials);
            setCerts(blob.certs);
            setProfileData({ fullName: data.fullName || '', phoneNumber: data.phoneNumber || '', professionalTitle: data.professionalTitle || '', bio: data.bio || '', hourlyRate: data.hourlyRate || '' });
        } catch { showMessage('Failed to load profile', 'error'); }
    }, [token, navigate, showMessage]);

    useEffect(() => { if (!token) { navigate('/freelancer-login'); return; } fetchProfile(); }, [token, navigate, fetchProfile]);

    const savePortfolio = useCallback(async (skills, projs, tests, certsArr) => {
        const blob = JSON.stringify({ testimonials: tests, certs: certsArr });
        await fetch(`${API}/api/user/profile`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills: skills.map(s => `${s.name}:${s.level}`).join(', '), experience: JSON.stringify(projs), companyName: blob })
        }).catch(() => {});
    }, [token]);

    // Skills
    const addSkill = () => {
        const name = skillInput.trim();
        if (!name || skillsList.find(s => s.name.toLowerCase() === name.toLowerCase())) return;
        const updated = [...skillsList, { name, level: skillLevel }];
        setSkillsList(updated); setSkillInput('');
        savePortfolio(updated, projects, testimonials, certs);
    };
    const removeSkill = (name) => { const u = skillsList.filter(s => s.name !== name); setSkillsList(u); savePortfolio(u, projects, testimonials, certs); };
    const updateSkillLevel = (name, level) => { const u = skillsList.map(s => s.name === name ? { ...s, level } : s); setSkillsList(u); setEditingSkill(null); savePortfolio(u, projects, testimonials, certs); };

    // Projects
    const saveProject = () => {
        if (!projectForm.title.trim()) return;
        let updated;
        if (editingProject) { updated = projects.map(p => p.id === editingProject ? { ...projectForm, id: editingProject } : p); setEditingProject(null); }
        else { updated = [...projects, { ...projectForm, id: Date.now() }]; setAddingProject(false); }
        setProjects(updated);
        setProjectForm({ title: '', description: '', tech: '', link: '', status: 'Completed', role: '' });
        savePortfolio(skillsList, updated, testimonials, certs);
        showMessage(editingProject ? 'Project updated!' : 'Project added!', 'success');
    };
    const startEditProject = (p) => { setProjectForm({ title: p.title, description: p.description || '', tech: p.tech || '', link: p.link || '', status: p.status || 'Completed', role: p.role || '' }); setEditingProject(p.id); setAddingProject(false); };
    const removeProject = (id) => { const u = projects.filter(p => p.id !== id); setProjects(u); savePortfolio(skillsList, u, testimonials, certs); };

    // Certifications
    const addCert = () => {
        if (!certForm.name.trim()) return;
        const updated = [...certs, { ...certForm, id: Date.now() }];
        setCerts(updated); setCertForm({ name: '', issuer: '', year: '', credentialId: '' }); setAddingCert(false);
        savePortfolio(skillsList, projects, testimonials, updated);
        showMessage('Certification added!', 'success');
    };
    const removeCert = (id) => { const u = certs.filter(c => c.id !== id); setCerts(u); savePortfolio(skillsList, projects, testimonials, u); };

    // Testimonials
    const addTestimonial = () => {
        if (!testForm.client.trim() || !testForm.text.trim()) return;
        const updated = [...testimonials, { ...testForm, id: Date.now() }];
        setTestimonials(updated); setTestForm({ client: '', role: '', text: '', rating: 5 }); setAddingTest(false);
        savePortfolio(skillsList, projects, updated, certs);
        showMessage('Testimonial added!', 'success');
    };
    const removeTestimonial = (id) => { const u = testimonials.filter(t => t.id !== id); setTestimonials(u); savePortfolio(skillsList, projects, u, certs); };

    // Export portfolio as plain text
    const exportPortfolio = () => {
        const lines = [
            `=== ${user.fullName} — ${user.professionalTitle || 'Freelancer'} ===`,
            user.bio ? `\nAbout: ${user.bio}` : '',
            user.hourlyRate ? `Rate: $${user.hourlyRate}/hr` : '',
            `\n--- Skills ---`, ...skillsList.map(s => `• ${s.name} (${s.level})`),
            `\n--- Projects ---`, ...projects.map(p => `• ${p.title} [${p.status || 'Completed'}]${p.tech ? ' | ' + p.tech : ''}${p.link ? ' | ' + p.link : ''}`),
            certs.length ? `\n--- Certifications ---` : '', ...certs.map(c => `• ${c.name}${c.issuer ? ' — ' + c.issuer : ''}${c.year ? ' (' + c.year + ')' : ''}`),
            testimonials.length ? `\n--- Testimonials ---` : '', ...testimonials.map(t => `"${t.text}" — ${t.client}${t.role ? ', ' + t.role : ''} ⭐${t.rating}`),
        ].filter(Boolean).join('\n');
        navigator.clipboard.writeText(lines).then(() => showMessage('Portfolio copied to clipboard!', 'success'));
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await fetch(`${API}/api/user/profile`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(profileData) });
            const data = await res.json();
            if (res.ok) { setUser({ ...user, ...profileData }); setEditMode(false); showMessage('Profile updated!', 'success'); }
            else showMessage(data.message, 'error');
        } catch { showMessage('Update failed', 'error'); }
        finally { setLoading(false); }
    };
    const sendPasswordOtp = () => { setOtpSent(true); showMessage('Enter the 6-digit code from your authenticator app', 'success'); };
    const handlePasswordChange = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await fetch(`${API}/api/user/change-password`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(passwordData) });
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
    };
    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) await fetch(`${API}/api/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
        } catch { /* never block logout */ }
        localStorage.clear(); navigate('/freelancer-login');
    };

    // Charts
    const levelData = useMemo(() => LEVELS.map((lvl, i) => ({ name: lvl, value: skillsList.filter(s => s.level === lvl).length, color: LEVEL_COLORS[i] })).filter(d => d.value > 0), [skillsList]);
    const radarData = useMemo(() => skillsList.slice(0, 8).map(s => ({ skill: s.name.length > 10 ? s.name.slice(0, 10) + '…' : s.name, value: LEVEL_PCT[s.level] || 50 })), [skillsList]);
    const filteredSkills = useMemo(() => skillFilter ? skillsList.filter(s => s.name.toLowerCase().includes(skillFilter.toLowerCase())) : skillsList, [skillsList, skillFilter]);
    const profileCompletion = useMemo(() => { let s = 0; if (user?.fullName) s += 15; if (user?.professionalTitle) s += 15; if (user?.bio) s += 15; if (skillsList.length > 0) s += 15; if (projects.length > 0) s += 15; if (certs.length > 0) s += 15; if (testimonials.length > 0) s += 10; return s; }, [user, skillsList, projects, certs, testimonials]);
    const completionData = [{ name: 'Complete', value: profileCompletion, color: '#10b981' }, { name: 'Remaining', value: 100 - profileCompletion, color: 'rgba(255,255,255,0.06)' }];

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
                    <button className={activeTab === 'profile'   ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('profile')}>👤 My Profile</button>
                    <button className={activeTab === 'portfolio' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('portfolio')}>💼 Portfolio</button>
                    <button className={activeTab === 'security'  ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('security')}>🔒 Security</button>
                    <button className={activeTab === 'danger'    ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('danger')}>⚠️ Account</button>
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

                {/* ── PROFILE TAB ── */}
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
                                    <div className="form-group"><label>Professional Title</label><input value={profileData.professionalTitle} onChange={e => setProfileData({...profileData, professionalTitle: e.target.value})} placeholder="e.g. Full Stack Developer" /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Phone Number</label><input value={profileData.phoneNumber} onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})} /></div>
                                    <div className="form-group"><label>Hourly Rate (USD)</label><input type="number" value={profileData.hourlyRate} onChange={e => setProfileData({...profileData, hourlyRate: e.target.value})} placeholder="e.g. 50" /></div>
                                </div>
                                <div className="form-group"><label>Bio</label><textarea rows={4} value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} placeholder="Tell clients about yourself..." /></div>
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

                {/* ── PORTFOLIO TAB ── */}
                {activeTab === 'portfolio' && (
                    <>
                        {/* Hero */}
                        <div className="portfolio-hero">
                            <div className="portfolio-hero-text">
                                <h2>Hi, I'm {user.fullName?.split(' ')[0]} 👋</h2>
                                <p className="portfolio-title-tag">{user.professionalTitle || 'Freelancer'}</p>
                                <p className="portfolio-bio">{user.bio || 'Add a bio in your profile to display it here.'}</p>
                                <div className="portfolio-hero-stats">
                                    <div className="hero-stat"><span className="hero-stat-num">{skillsList.length}</span><span className="hero-stat-label">Skills</span></div>
                                    <div className="hero-stat"><span className="hero-stat-num">{projects.length}</span><span className="hero-stat-label">Projects</span></div>
                                    <div className="hero-stat"><span className="hero-stat-num">{certs.length}</span><span className="hero-stat-label">Certs</span></div>
                                    <div className="hero-stat"><span className="hero-stat-num">{user.hourlyRate ? `$${user.hourlyRate}` : '—'}</span><span className="hero-stat-label">/ hr</span></div>
                                </div>
                            </div>
                            <div className="portfolio-hero-right">
                                <div className="portfolio-hero-avatar">{user.fullName?.charAt(0).toUpperCase()}</div>
                                <button className="export-btn" onClick={exportPortfolio}>📋 Copy Portfolio</button>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="charts-row">
                            <div className="dashboard-card chart-card">
                                <div className="card-header"><h2>Profile Completion</h2></div>
                                <div className="chart-wrap">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={completionData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270} labelLine={false}>
                                                {completionData.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="donut-center-label">
                                        <span className="donut-pct">{profileCompletion}%</span>
                                        <span className="donut-sub">Complete</span>
                                    </div>
                                </div>
                                <ul className="completion-checklist">
                                    {[['Full Name',15,!!user.fullName],['Title',15,!!user.professionalTitle],['Bio',15,!!user.bio],['Skills',15,skillsList.length>0],['Projects',15,projects.length>0],['Certifications',15,certs.length>0],['Testimonials',10,testimonials.length>0]].map(([label,pts,done]) => (
                                        <li key={label} className={done ? 'check-done' : 'check-todo'}>{done ? '✅' : '⬜'} {label} <span className="check-pts">+{pts}%</span></li>
                                    ))}
                                </ul>
                            </div>

                            <div className="dashboard-card chart-card">
                                <div className="card-header"><h2>Skill Distribution</h2></div>
                                {levelData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={levelData} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={PieLabel}>
                                                {levelData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <Tooltip formatter={(v, n) => [`${v} skill${v !== 1 ? 's' : ''}`, n]} contentStyle={{ background: '#0d1540', border: '1px solid #1e3a7a', borderRadius: 10, color: '#e2e8f0' }} />
                                            <Legend iconType="circle" iconSize={10} formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <div className="empty-state"><div className="empty-icon">📊</div><p>Add skills to see distribution.</p></div>}
                            </div>
                        </div>

                        {/* Radar chart — shows when 3+ skills */}
                        {radarData.length >= 3 && (
                            <div className="dashboard-card">
                                <div className="card-header"><h2>Skill Radar (Top 8)</h2></div>
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                        <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
                                        <Radar name="Proficiency" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                        <Tooltip formatter={v => [`${v}%`, 'Proficiency']} contentStyle={{ background: '#0d1540', border: '1px solid #1e3a7a', borderRadius: 10, color: '#e2e8f0' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Skills */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h2>Skills ({skillsList.length})</h2>
                                <input className="skill-search" value={skillFilter} onChange={e => setSkillFilter(e.target.value)} placeholder="🔍 Filter skills…" />
                            </div>
                            <div className="skill-add-row">
                                <input className="skill-name-input" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Skill name (e.g. React, Figma)" />
                                <select className="skill-level-select" value={skillLevel} onChange={e => setSkillLevel(e.target.value)}>
                                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <button type="button" className="add-skill-btn" onClick={addSkill}>+ Add</button>
                            </div>
                            <div className="skills-grid">
                                {filteredSkills.map(skill => {
                                    const idx = LEVELS.indexOf(skill.level);
                                    const pct = LEVEL_PCT[skill.level] || 50;
                                    const isEditing = editingSkill === skill.name;
                                    return (
                                        <div key={skill.name} className="skill-item">
                                            <div className="skill-item-top">
                                                <span className="skill-name">{skill.name}</span>
                                                <div className="skill-item-right">
                                                    {isEditing ? (
                                                        <select className="skill-level-select-inline" defaultValue={skill.level} onChange={e => updateSkillLevel(skill.name, e.target.value)} onBlur={() => setEditingSkill(null)}>
                                                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="skill-level-badge" style={{ background: `${LEVEL_COLORS[idx]}22`, color: LEVEL_COLORS[idx], border: `1px solid ${LEVEL_COLORS[idx]}55`, cursor: 'pointer' }} onClick={() => setEditingSkill(skill.name)} title="Click to change level">{skill.level} ✎</span>
                                                    )}
                                                    <button className="skill-remove-btn" onClick={() => removeSkill(skill.name)}>×</button>
                                                </div>
                                            </div>
                                            <div className="skill-bar-track"><div className="skill-bar-fill" style={{ width: `${pct}%`, background: LEVEL_COLORS[idx] }} /></div>
                                        </div>
                                    );
                                })}
                                {filteredSkills.length === 0 && <p className="no-skills-hint">{skillFilter ? 'No skills match your filter.' : 'No skills added yet.'}</p>}
                            </div>
                        </div>

                        {/* Projects */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h2>Projects ({projects.length})</h2>
                                <button className="edit-btn" onClick={() => { setAddingProject(!addingProject); setEditingProject(null); setProjectForm({ title: '', description: '', tech: '', link: '', status: 'Completed', role: '' }); }}>{addingProject ? 'Cancel' : '+ Add Project'}</button>
                            </div>
                            {(addingProject || editingProject) && (
                                <div className="project-form">
                                    <div className="form-row">
                                        <div className="form-group"><label>Project Title *</label><input value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} placeholder="e.g. E-commerce Platform" /></div>
                                        <div className="form-group"><label>Your Role</label><input value={projectForm.role} onChange={e => setProjectForm({...projectForm, role: e.target.value})} placeholder="e.g. Lead Developer" /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label>Tech Stack</label><input value={projectForm.tech} onChange={e => setProjectForm({...projectForm, tech: e.target.value})} placeholder="e.g. React, Node.js, MongoDB" /></div>
                                        <div className="form-group"><label>Status</label>
                                            <select value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value})}>
                                                {PROJ_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group"><label>Description</label><textarea rows={3} value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} placeholder="What did you build and what problem did it solve?" /></div>
                                    <div className="form-group"><label>Live Link (optional)</label><input type="url" value={projectForm.link} onChange={e => setProjectForm({...projectForm, link: e.target.value})} placeholder="https://..." /></div>
                                    <button type="button" className="save-btn" onClick={saveProject}>{editingProject ? 'Update Project' : 'Save Project'}</button>
                                </div>
                            )}
                            <div className="projects-grid">
                                {projects.map(p => (
                                    <div key={p.id} className="project-card">
                                        <div className="project-card-header">
                                            <div className="project-icon">🚀</div>
                                            <div className="project-header-info"><h3>{p.title}</h3>{p.tech && <p className="project-tech">{p.tech}</p>}</div>
                                            <div className="project-card-actions">
                                                <button className="proj-edit-btn" onClick={() => startEditProject(p)} title="Edit">✎</button>
                                                <button className="project-remove-btn" onClick={() => removeProject(p.id)}>🗑️</button>
                                            </div>
                                        </div>
                                        <div className="project-meta-row">
                                            {p.status && <span className="proj-status-badge" style={{ background: `${STATUS_COLORS[p.status]}22`, color: STATUS_COLORS[p.status], border: `1px solid ${STATUS_COLORS[p.status]}44` }}>{p.status}</span>}
                                            {p.role && <span className="proj-role-tag">👤 {p.role}</span>}
                                        </div>
                                        {p.description && <p className="project-desc">{p.description}</p>}
                                        {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="project-link">🔗 View Project</a>}
                                    </div>
                                ))}
                                {projects.length === 0 && !addingProject && <div className="empty-state"><div className="empty-icon">🚀</div><p>No projects yet. Click "+ Add Project" to showcase your work.</p></div>}
                            </div>
                        </div>
                        {/* Certifications */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h2>Certifications ({certs.length})</h2>
                                <button className="edit-btn" onClick={() => setAddingCert(!addingCert)}>{addingCert ? 'Cancel' : '+ Add Cert'}</button>
                            </div>
                            {addingCert && (
                                <div className="project-form">
                                    <div className="form-row">
                                        <div className="form-group"><label>Certification Name *</label><input value={certForm.name} onChange={e => setCertForm({...certForm, name: e.target.value})} placeholder="e.g. AWS Solutions Architect" /></div>
                                        <div className="form-group"><label>Issuing Organization</label><input value={certForm.issuer} onChange={e => setCertForm({...certForm, issuer: e.target.value})} placeholder="e.g. Amazon Web Services" /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label>Year</label><input type="number" value={certForm.year} onChange={e => setCertForm({...certForm, year: e.target.value})} placeholder="e.g. 2024" /></div>
                                        <div className="form-group"><label>Credential ID (optional)</label><input value={certForm.credentialId} onChange={e => setCertForm({...certForm, credentialId: e.target.value})} placeholder="e.g. ABC-12345" /></div>
                                    </div>
                                    <button type="button" className="save-btn" onClick={addCert}>Save Certification</button>
                                </div>
                            )}
                            <div className="certs-grid">
                                {certs.map(c => (
                                    <div key={c.id} className="cert-card">
                                        <div className="cert-icon">🏆</div>
                                        <div className="cert-info">
                                            <h3>{c.name}</h3>
                                            {c.issuer && <p className="cert-issuer">{c.issuer}</p>}
                                            <div className="cert-meta">
                                                {c.year && <span>📅 {c.year}</span>}
                                                {c.credentialId && <span>🔑 {c.credentialId}</span>}
                                            </div>
                                        </div>
                                        <button className="project-remove-btn" onClick={() => removeCert(c.id)}>🗑️</button>
                                    </div>
                                ))}
                                {certs.length === 0 && !addingCert && <div className="empty-state"><div className="empty-icon">🏆</div><p>No certifications yet.</p></div>}
                            </div>
                        </div>

                        {/* Testimonials */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h2>Client Testimonials ({testimonials.length})</h2>
                                <button className="edit-btn" onClick={() => setAddingTest(!addingTest)}>{addingTest ? 'Cancel' : '+ Add Testimonial'}</button>
                            </div>
                            {addingTest && (
                                <div className="project-form">
                                    <div className="form-row">
                                        <div className="form-group"><label>Client Name *</label><input value={testForm.client} onChange={e => setTestForm({...testForm, client: e.target.value})} placeholder="e.g. John Smith" /></div>
                                        <div className="form-group"><label>Client Role / Company</label><input value={testForm.role} onChange={e => setTestForm({...testForm, role: e.target.value})} placeholder="e.g. CEO at Acme Corp" /></div>
                                    </div>
                                    <div className="form-group"><label>Testimonial *</label><textarea rows={3} value={testForm.text} onChange={e => setTestForm({...testForm, text: e.target.value})} placeholder="What did the client say about your work?" /></div>
                                    <div className="form-group"><label>Rating (1–5)</label>
                                        <div className="star-picker">
                                            {[1,2,3,4,5].map(n => (
                                                <button key={n} type="button" className={`star-btn ${testForm.rating >= n ? 'star-on' : ''}`} onClick={() => setTestForm({...testForm, rating: n})}>★</button>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="button" className="save-btn" onClick={addTestimonial}>Save Testimonial</button>
                                </div>
                            )}
                            <div className="testimonials-grid">
                                {testimonials.map(t => (
                                    <div key={t.id} className="testimonial-card">
                                        <div className="testimonial-stars">{'★'.repeat(t.rating)}<span className="empty-stars">{'★'.repeat(5 - t.rating)}</span></div>
                                        <p className="testimonial-text">"{t.text}"</p>
                                        <div className="testimonial-author">
                                            <div className="testimonial-avatar">{t.client?.charAt(0).toUpperCase()}</div>
                                            <div><p className="testimonial-name">{t.client}</p>{t.role && <p className="testimonial-role">{t.role}</p>}</div>
                                            <button className="project-remove-btn" style={{ marginLeft: 'auto' }} onClick={() => removeTestimonial(t.id)}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                                {testimonials.length === 0 && !addingTest && <div className="empty-state"><div className="empty-icon">💬</div><p>No testimonials yet. Add feedback from your clients.</p></div>}
                            </div>
                        </div>
                    </>
                )}

                {/* ── SECURITY TAB ── */}
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

                {/* ── DANGER TAB ── */}
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
