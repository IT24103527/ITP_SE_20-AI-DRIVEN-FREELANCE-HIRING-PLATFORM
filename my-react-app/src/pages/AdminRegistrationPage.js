import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast, { useToast } from '../components/Toast';
import PasswordStrength from '../components/PasswordStrength';
import './AdminRegistrationPage.css';

const AdminRegistrationPage = () => {
    const navigate = useNavigate();
    const { toasts, success, error: toastError, warning } = useToast();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminCode: '',
        department: '',
        agreedToTerms: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [totpSecret, setTotpSecret] = useState('');
    const [roleAdded, setRoleAdded] = useState(false);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        // Email — proper format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Enter a valid email address (e.g. admin@company.com)';
        }

        // Password — strong password rules
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one lowercase letter';
        } else if (!/[0-9]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one number';
        } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one special character (!@#$%^&*...)';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.adminCode.trim()) {
            newErrors.adminCode = 'Admin registration code is required';
        }

        if (!formData.department.trim()) {
            newErrors.department = 'Department is required';
        }

        if (!formData.agreedToTerms) {
            newErrors.agreedToTerms = 'You must agree to the terms and conditions';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Run local UI validation
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            warning('Please fix the errors below before submitting');
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await fetch('http://localhost:8080/api/auth/register/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    adminCode: formData.adminCode,
                    department: formData.department
                }),
            });

            const data = await response.json();

            if (response.ok && data.qrCode) {
                setQrCode(data.qrCode);
                setTotpSecret(data.totpSecret || '');
                setRegistrationSuccess(true);
                setIsSubmitting(false);
            } else if (response.ok && !data.qrCode && data.role === 'ADMIN') {
                // Role added to existing account
                setRoleAdded(true);
                setIsSubmitting(false);
            } else {
                setErrors({ submit: data.message || 'Registration failed. Check your Admin Code.' });
                setIsSubmitting(false);
            }
        } catch (error) {
            setErrors({ submit: 'The backend server is unreachable. Please verify it is running.' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="registration-page">
            <Toast toasts={toasts} />
            <Link to="/" className="admin-home-btn">🏠 Home</Link>
            <div className="registration-container">
                <div className="registration-form-container">
                    <div className="registration-form">
                        <div className="logo-section">
                            <h2>TalentAI</h2>
                            <span>Admin Registration</span>
                        </div>

                        <h3 className="form-title">Create Your Admin Account</h3>
                        <p className="form-subtitle">Register to manage and oversee the TalentAI platform</p>

                        {roleAdded ? (
                            <div className="success-message">
                                <h3>✅ Admin Role Added!</h3>
                                <p>Your existing account now has <strong>Admin</strong> access. Use your existing password and authenticator app to log in to the Admin portal.</p>
                                <div style={{background:'rgba(240,147,251,0.1)',border:'1px solid rgba(240,147,251,0.3)',borderRadius:'10px',padding:'16px',margin:'16px 0',textAlign:'left'}}>
                                    <p style={{color:'#94a3b8',fontSize:'0.85rem',margin:0}}>
                                        🔐 Your TOTP authenticator app and password remain the same.<br/>
                                        Simply go to the <strong style={{color:'#f0abfc'}}>Admin Login</strong> page and sign in.
                                    </p>
                                </div>
                                <Link to="/admin-login" className="login-link-btn" style={{marginTop:'8px',display:'inline-block'}}>
                                    Go to Admin Login →
                                </Link>
                            </div>
                        ) : registrationSuccess ? (
                            <div className="success-message">
                                <h3>✅ Admin Account Created!</h3>
                                <p>Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> to set up your login verification.</p>
                                {qrCode && <img src={qrCode} alt="TOTP QR Code" style={{width:'200px',height:'200px',margin:'16px auto',display:'block',borderRadius:'8px'}} />}
                                <p style={{fontSize:'0.8rem',color:'#94a3b8',marginTop:'8px'}}>Can't scan? Enter this key manually: <code style={{background:'#0c2a3e',padding:'4px 8px',borderRadius:'4px',color:'#00d2ff'}}>{totpSecret}</code></p>
                                <p style={{marginTop:'12px',fontSize:'0.85rem',color:'#94a3b8'}}>After scanning, you'll use the 6-digit code from the app every time you log in.</p>
                                <Link to="/admin-login" className="login-link-btn" style={{marginTop:'16px',display:'inline-block'}}>Go to Admin Login →</Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="fullName">Full Name</label>
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className={errors.fullName ? 'error' : ''}
                                            placeholder="Enter your full name"
                                        />
                                        {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="department">Department</label>
                                        <select
                                            id="department"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            className={errors.department ? 'error' : ''}
                                        >
                                            <option value="">Select Department</option>
                                            <option value="platform-management">Platform Management</option>
                                            <option value="user-support">User Support</option>
                                            <option value="security">Security</option>
                                            <option value="finance">Finance</option>
                                            <option value="analytics">Analytics</option>
                                        </select>
                                        {errors.department && <span className="error-message">{errors.department}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={errors.email ? 'error' : ''}
                                        placeholder="admin@talentai.com"
                                    />
                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="password">Password</label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={errors.password ? 'error' : ''}
                                            placeholder="Min. 8 chars, upper, lower, number, symbol"
                                        />
                                        <PasswordStrength password={formData.password} />
                                        {errors.password && <span className="error-message">{errors.password}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Confirm Password</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={errors.confirmPassword ? 'error' : ''}
                                            placeholder="Re-enter password"
                                        />
                                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="adminCode">Admin Registration Code</label>
                                    <input
                                        type="text"
                                        id="adminCode"
                                        name="adminCode"
                                        value={formData.adminCode}
                                        onChange={handleChange}
                                        className={errors.adminCode ? 'error' : ''}
                                        placeholder="Enter your admin registration code"
                                    />
                                    {errors.adminCode && <span className="error-message">{errors.adminCode}</span>}
                                    <small className="form-help">This code is provided by your organization's super admin</small>
                                </div>

                                <div className="form-group checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="agreedToTerms"
                                        name="agreedToTerms"
                                        checked={formData.agreedToTerms}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="agreedToTerms">
                                        I agree to the <a href="/terms">Terms of Service</a> and acknowledge the admin responsibilities
                                    </label>
                                    {errors.agreedToTerms && <span className="error-message">{errors.agreedToTerms}</span>}
                                </div>

                                {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

                                <button
                                    type="submit"
                                    className="register-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating Account...' : 'Create Admin Account'}
                                </button>

                                <p className="login-link">
                                    Already have an account? <Link to="/login">Log In</Link>
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                <div className="benefits-section">
                    <h3>Admin Privileges & Responsibilities</h3>
                    {/* SVG icons and benefits remain here... */}
                </div>
            </div>{/* end registration-container */}
        </div>
    );
};

export default AdminRegistrationPage;