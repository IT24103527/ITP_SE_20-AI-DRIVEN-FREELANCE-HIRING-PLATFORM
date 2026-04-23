import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HomePageButton from '../components/HomePageButton';
import Toast, { useToast } from '../components/Toast';
import './ClientLoginPage.css';

const ClientLoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    // OTP step state
    const [otpStep, setOtpStep] = useState(false);
    const [otp, setOtp] = useState('');
    const [lockCountdown, setLockCountdown] = useState(0);
    const navigate = useNavigate();
    const { toasts, success, error: toastError } = useToast();

    useEffect(() => {
        if (lockCountdown <= 0) return undefined;
        const t = setInterval(() => setLockCountdown((c) => {
            if (c <= 1) { clearInterval(t); return 0; }
            return c - 1;
        }), 1000);
        return () => clearInterval(t);
    }, [lockCountdown]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!formData.email.includes('@')) newErrors.email = 'Email must contain @';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        return newErrors;
    };

    // STEP 1 — validate credentials, trigger OTP send
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) { setErrors(formErrors); return; }

        setIsSubmitting(true);
        setErrors({});
        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password, role: 'CLIENT' }),
            });
            const data = await response.json();

            if (response.ok && data.otpRequired) {
                setOtpStep(true);
                success('Credentials verified. Enter your authenticator code.');
            } else if (data.locked) {
                setLockCountdown(data.lockSecondsRemaining || 60);
                const msg = data.message || 'Account locked. Please wait before trying again.';
                setErrors({ submit: msg });
                toastError(msg);
            } else {
                const msg = data.message || 'Invalid email or password.';
                setErrors({ submit: msg });
                toastError(msg);
            }
        } catch {
            const msg = 'Server is offline. Please try again later.';
            setErrors({ submit: msg });
            toastError(msg);
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
            const response = await fetch('http://localhost:8080/api/auth/verify-login-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp, role: 'CLIENT' }),
            });
            const data = await response.json();

            if (response.ok && data.token) {
                if (data.role !== 'CLIENT') {
                    const msg = 'This login is for clients only. Please use the correct login page.';
                    setErrors({ otp: msg });
                    toastError(msg);
                    return;
                }
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', 'CLIENT');
                localStorage.setItem('fullName', data.fullName || data.name || formData.email.split('@')[0]);
                localStorage.setItem('userEmail', formData.email);

                if (formData.rememberMe) localStorage.setItem('rememberedEmail', formData.email);
                success('Login successful! Welcome back.');
                navigate('/client-dashboard');
            } else if (data.locked) {
                setLockCountdown(data.lockSecondsRemaining || 60);
                const msg = data.message || 'Account locked.';
                setErrors({ otp: msg });
                toastError(msg);
            } else {
                const msg = data.message || 'Invalid or expired code.';
                setErrors({ otp: msg });
                toastError(msg);
            }
        } catch {
            setErrors({ otp: 'Verification failed. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 4. THE UI (JSX)
    return (
        <div className="login-page">
            <Toast toasts={toasts} />
            {/* HomePage Button */}
            <HomePageButton />

            <div className="login-container">
                <div className="login-form-container">
                    <div className="login-form">
                        <div className="logo-section">
                            <h2>TalentAI</h2>
                            <span>Welcome Back</span>
                        </div>

                        {!otpStep ? (
                            <>
                                <h3 className="form-title">Sign In to Your Account</h3>
                                <p className="form-subtitle">Access your client dashboard and manage your projects</p>

                                <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-with-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" className="input-icon">
                                        <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={errors.email ? 'error' : ''}
                                        placeholder="Enter your email"
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && <span className="error-message">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-with-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" className="input-icon">
                                        <path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                                    </svg>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={errors.password ? 'error' : ''}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? "👁️" : "🙈"}
                                    </button>
                                </div>
                                {errors.password && <span className="error-message">{errors.password}</span>}
                            </div>

                            <div className="form-options">
                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="rememberMe">Remember me</label>
                                </div>
                                <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
                            </div>

                            {errors.submit && (
                                <div className="error-message submit-error">
                                    {errors.submit}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="login-btn"
                                disabled={isSubmitting || lockCountdown > 0}
                            >
                                {lockCountdown > 0 ? `Locked — wait ${lockCountdown}s` : isSubmitting ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="divider"><span>OR</span></div>
                        <div className="social-login">
                            <button className="social-btn google-btn">Sign in with Google</button>
                        </div>
                        <p className="signup-link">
                            Don't have an account? <Link to="/client-register">Sign Up</Link>
                        </p>
                            </>
                        ) : (
                            /* ── OTP VERIFICATION STEP ── */
                            <div className="otp-verify-box">
                                <div className="otp-icon">📱</div>
                                <h3 className="form-title">Verify Your Identity</h3>
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
                                    <button type="submit" className="login-btn" disabled={isSubmitting}>
                                        {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
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
                    <h3>Manage Your Talent with Ease</h3>
                    <p>TalentAI helps you find and manage top-tier professionals for your specific project needs.</p>

                    <ul className="benefits-list">
                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>AI-Powered Matching</h4>
                                <p>Get matched with the perfect freelancers based on your specific needs</p>
                            </div>
                        </li>
                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Quick Hiring Process</h4>
                                <p>Post a job and get matched with qualified talent within hours</p>
                            </div>
                        </li>
                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Cost-Effective Solutions</h4>
                                <p>Save up to 40% on hiring costs compared to traditional methods</p>
                            </div>
                        </li>
                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Secure Payments</h4>
                                <p>Escrow protection ensures your money is safe until work is completed</p>
                            </div>
                        </li>
                    </ul>

                    <div className="support-info">
                        <h4>Need Help?</h4>
                        <p>Our support team is available 24/7 to assist you with any questions.</p>
                        <Link to="/support" className="support-link">Contact Support</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientLoginPage;
