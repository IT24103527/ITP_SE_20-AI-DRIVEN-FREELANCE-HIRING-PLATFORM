import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from './assets/img9.jpg';
import { API_BASE_URL } from '../utils/api';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [otpStep, setOtpStep] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpMessage, setOtpMessage] = useState('');
    const [lockCountdown, setLockCountdown] = useState(0);
    const navigate = useNavigate();

    useState(() => {
        if (lockCountdown <= 0) return;
        const t = setInterval(() => setLockCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
        return () => clearInterval(t);
    }, [lockCountdown]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!formData.email.includes('@')) newErrors.email = 'Email must contain @';
        if (!formData.password) newErrors.password = 'Password is required';
        return newErrors;
    };

    // STEP 1 — validate credentials, trigger OTP
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) { setErrors(formErrors); return; }

        setIsSubmitting(true);
        setErrors({});
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password, role: 'ADMIN' }),
            });
            const data = await response.json();

            if (response.ok && data.otpRequired) {
                setOtpMessage(data.message);
                setOtpStep(true);
            } else if (data.locked) {
                setLockCountdown(data.lockSecondsRemaining || 60);
                setErrors({ submit: data.message || 'Account locked.' });
            } else {
                setErrors({ submit: data.message || 'Invalid admin credentials.' });
            }
        } catch {
            setErrors({ submit: 'Server connection failed. Please try again later.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // STEP 2 — verify OTP, get JWT, navigate
    const handleOtpVerify = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) { setErrors({ otp: 'Enter the 6-digit code' }); return; }

        setIsSubmitting(true);
        setErrors({});
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-login-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp, role: 'ADMIN' }),
            });
            const data = await response.json();

            if (response.ok && data.token) {
                if (data.role !== 'ADMIN') {
                    setErrors({ otp: 'Access denied. This portal is for admins only.' });
                    return;
                }
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role);
                navigate('/admin-dashboard');
            } else if (data.locked) {
                setLockCountdown(data.lockSecondsRemaining || 60);
                setErrors({ otp: data.message || 'Account locked.' });
            } else {
                setErrors({ otp: data.message || 'Invalid or expired OTP.' });
            }
        } catch {
            setErrors({ otp: 'Verification failed. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    return (
        <div
            className="login-page"
            style={{
                backgroundImage: `linear-gradient(135deg, rgba(10, 11, 30, 0.8) 0%, rgba(26, 26, 46, 0.9) 100%), url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            <Link to="/" className="admin-home-btn">🏠 Home</Link>
            <div className="login-container">
                <div className="login-form-container">
                    <div className="login-form">
                        <div className="logo-section">
                            <h2 className="logo-text">TalentFlow<span className="ai-accent">AI</span></h2>
                            <span className="portal-label">Admin Portal</span>
                        </div>

                        {!otpStep ? (
                            <>
                                <h3 className="form-title">Admin Sign In</h3>
                                <p className="form-subtitle">Access your dashboard to manage the platform</p>

                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="email">Admin Email</label>
                                        <div className="input-with-icon">
                                            <svg viewBox="0 0 24 24" width="20" height="20" className="input-icon">
                                                <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                            </svg>
                                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={errors.email ? 'error' : ''} placeholder="admin@talentflowai.lk" />
                                        </div>
                                        {errors.email && <span className="error-message">{errors.email}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="password">Password</label>
                                        <div className="input-with-icon">
                                            <svg viewBox="0 0 24 24" width="20" height="20" className="input-icon">
                                                <path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                            </svg>
                                            <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} className={errors.password ? 'error' : ''} placeholder="Enter password" />
                                            <button type="button" className="password-toggle" onClick={togglePasswordVisibility}>{showPassword ? '👁️' : '🙈'}</button>
                                        </div>
                                        {errors.password && <span className="error-message">{errors.password}</span>}
                                    </div>

                                    <div className="form-options">
                                        <div className="checkbox-group">
                                            <input type="checkbox" id="rememberMe" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} />
                                            <label htmlFor="rememberMe">Remember me</label>
                                        </div>
                                        <Link to="/forgot-password" style={{ color: '#00d2ff', textDecoration: 'none' }}>Forgot password?</Link>
                                    </div>

                                    {errors.submit && <div className="submit-error">{errors.submit}</div>}

                                    <button type="submit" className="login-btn-blue" disabled={isSubmitting || lockCountdown > 0}>
                                        {lockCountdown > 0 ? `Locked — wait ${lockCountdown}s` : isSubmitting ? 'Verifying...' : 'Sign In to Portal'}
                                    </button>
                                </form>

                                <p className="signup-link">
                                    New admin? <Link to="/admin-registration">Register Here</Link>
                                </p>
                            </>
                        ) : (
                            <div className="otp-verify-box">
                                <div className="otp-icon">🔐</div>
                                <h3 className="form-title">Admin Verification</h3>
                                <p className="form-subtitle">Enter the 6-digit code from your authenticator app (Google Authenticator / Microsoft Authenticator)</p>
                                <form onSubmit={handleOtpVerify}>
                                    <div className="form-group">
                                        <label htmlFor="otp">6-Digit Verification Code</label>
                                        <input
                                            type="text"
                                            id="otp"
                                            value={otp}
                                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className={`otp-input ${errors.otp ? 'error' : ''}`}
                                            placeholder="000000"
                                            maxLength={6}
                                            autoFocus
                                        />
                                        {errors.otp && <span className="error-message">{errors.otp}</span>}
                                    </div>
                                    <button type="submit" className="login-btn-blue" disabled={isSubmitting}>
                                        {isSubmitting ? 'Verifying...' : 'Verify & Access Portal'}
                                    </button>
                                </form>
                                <button className="otp-back-btn" onClick={() => { setOtpStep(false); setOtp(''); setErrors({}); }}>
                                    ← Back to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="info-section">
                    <h3>Control Center</h3>
                    <p>Secure access for TalentFlowAI system administrators.</p>
                    <div className="benefits-list">
                        <div className="benefit-item">
                            <div className="benefit-icon">📊</div>
                            <div className="benefit-content"><h4>System Oversight</h4><p>Monitor real-time matching accuracy and user growth.</p></div>
                        </div>
                        <div className="benefit-item">
                            <div className="benefit-icon">🛡️</div>
                            <div className="benefit-content"><h4>Dispute Resolution</h4><p>Manage escrow and resolve project conflicts.</p></div>
                        </div>
                    </div>
                    <div className="security-notice">
                        <h4>⚠️ Security Notice</h4>
                        <p>Credentials are monitored. Ensure you are on a private network.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
