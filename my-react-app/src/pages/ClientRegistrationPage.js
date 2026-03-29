import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import HomePageButton from '../components/HomePageButton';
import Toast, { useToast } from '../components/Toast';
import PasswordStrength from '../components/PasswordStrength';
import './ClientRegistrationPage.css';

const ClientRegistrationPage = () => {
    const navigate = useNavigate();
    const { toasts, success, error: toastError, warning } = useToast();

    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', confirmPassword: '',
        companyName: '', phoneNumber: '', agreedToTerms: false
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [totpSecret, setTotpSecret] = useState('');
    const [roleAdded, setRoleAdded] = useState(false); // true when role was added to existing account

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        // Clear field error on change
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        const { fullName, email, password, confirmPassword, companyName, phoneNumber, agreedToTerms } = formData;

        if (!fullName.trim())
            e.fullName = 'Full name is required';
        else if (fullName.trim().length < 2)
            e.fullName = 'Full name must be at least 2 characters';
        else if (!/^[a-zA-Z\s'-]+$/.test(fullName.trim()))
            e.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes';

        if (!email.trim())
            e.email = 'Email address is required';
        else if (!email.includes('@'))
            e.email = 'Email must contain @';

        if (!password)
            e.password = 'Password is required';
        else if (password.length < 8)
            e.password = 'Password must be at least 8 characters';
        else if (!/[A-Z]/.test(password))
            e.password = 'Password must contain at least one uppercase letter';
        else if (!/[0-9]/.test(password))
            e.password = 'Password must contain at least one number';

        if (!confirmPassword)
            e.confirmPassword = 'Please confirm your password';
        else if (password !== confirmPassword)
            e.confirmPassword = 'Passwords do not match';

        if (!companyName.trim())
            e.companyName = 'Company name is required';
        else if (companyName.trim().length < 2)
            e.companyName = 'Company name must be at least 2 characters';

        if (!phoneNumber.trim())
            e.phoneNumber = 'Phone number is required';
        else if (!/^\+?[0-9\s\-()]{7,15}$/.test(phoneNumber.trim()))
            e.phoneNumber = 'Please enter a valid phone number (e.g. +94771234567)';

        if (!agreedToTerms)
            e.agreedToTerms = 'You must agree to the Terms of Service and Privacy Policy';

        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validate();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            warning('Please fix the errors below before submitting');
            return;
        }
        setIsSubmitting(true);
        setErrors({});
        try {
            const response = await axios.post('http://localhost:8080/api/auth/register/client', {
                fullName: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                companyName: formData.companyName.trim(),
                phoneNumber: formData.phoneNumber.trim()
            });
            if (response.status === 200) {
                const data = response.data;
                setQrCode(data.qrCode || '');
                setTotpSecret(data.totpSecret || '');
                if (data.qrCode) {
                    // Brand new account — show QR code
                    setRegistrationSuccess(true);
                    success('Client account created successfully!');
                } else {
                    // Existing account — role was added
                    setRoleAdded(true);
                    success('Client role added to your existing account!');
                }
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            setErrors({ submit: msg });
            toastError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="registration-page">
            <Toast toasts={toasts} />
            <HomePageButton />
            <div className="registration-container">
                <div className="registration-form-container">
                    <div className="registration-form">
                        <h2 className="form-title">Create Your Client Account</h2>
                        <p className="form-subtitle">Start hiring top talent today</p>

                        {roleAdded ? (
                            <div className="success-message">
                                <h3>✅ Client Role Added!</h3>
                                <p>Your existing account now has <strong>Client</strong> access. Use your existing password and authenticator app to log in to the Client portal.</p>
                                <div style={{background:'rgba(67,97,238,0.1)',border:'1px solid rgba(67,97,238,0.3)',borderRadius:'10px',padding:'16px',margin:'16px 0',textAlign:'left'}}>
                                    <p style={{color:'#94a3b8',fontSize:'0.85rem',margin:0}}>
                                        🔐 Your TOTP authenticator app and password remain the same.<br/>
                                        Simply go to the <strong style={{color:'#60a5fa'}}>Client Login</strong> page and sign in.
                                    </p>
                                </div>
                                <Link to="/login" className="login-link-btn" style={{marginTop:'8px',display:'inline-block'}}>
                                    Go to Client Login →
                                </Link>
                            </div>
                        ) : registrationSuccess ? (
                            <div className="success-message">
                                <h3>✅ Account Created Successfully!</h3>
                                <p>Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> to set up your two-factor authentication.</p>
                                {qrCode && <img src={qrCode} alt="TOTP QR Code for two-factor authentication" style={{width:'200px',height:'200px',margin:'16px auto',display:'block',borderRadius:'8px',border:'2px solid #1e3a7a'}} />}
                                <p style={{fontSize:'0.8rem',color:'#94a3b8',marginTop:'8px'}}>
                                    Cannot scan? Enter this key manually in your app:<br/>
                                    <code style={{background:'#112244',padding:'6px 10px',borderRadius:'6px',color:'#60a5fa',display:'inline-block',marginTop:'6px',letterSpacing:'0.1em'}}>{totpSecret}</code>
                                </p>
                                <p style={{marginTop:'12px',fontSize:'0.85rem',color:'#94a3b8',lineHeight:'1.6'}}>
                                    ⚠️ Save this QR code or key — you will need it every time you log in.
                                </p>
                                <Link to="/login" className="login-link-btn" style={{marginTop:'16px',display:'inline-block'}}>
                                    Proceed to Login →
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                                        <input type="text" id="fullName" name="fullName" value={formData.fullName}
                                            onChange={handleChange} className={errors.fullName ? 'error' : ''}
                                            placeholder="e.g. John Smith" autoComplete="name" />
                                        {errors.fullName && <span className="error-message" role="alert">{errors.fullName}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="companyName">Company Name <span className="required">*</span></label>
                                        <input type="text" id="companyName" name="companyName" value={formData.companyName}
                                            onChange={handleChange} className={errors.companyName ? 'error' : ''}
                                            placeholder="e.g. Acme Corp" autoComplete="organization" />
                                        {errors.companyName && <span className="error-message" role="alert">{errors.companyName}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address <span className="required">*</span></label>
                                    <input type="email" id="email" name="email" value={formData.email}
                                        onChange={handleChange} className={errors.email ? 'error' : ''}
                                        placeholder="you@company.com" autoComplete="email" />
                                    {errors.email && <span className="error-message" role="alert">{errors.email}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phoneNumber">Phone Number <span className="required">*</span></label>
                                    <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber}
                                        onChange={handleChange} className={errors.phoneNumber ? 'error' : ''}
                                        placeholder="+94 77 123 4567" autoComplete="tel" />
                                    {errors.phoneNumber && <span className="error-message" role="alert">{errors.phoneNumber}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="password">Password <span className="required">*</span></label>
                                        <div className="input-with-icon">
                                            <input type={showPassword ? 'text' : 'password'} id="password" name="password"
                                                value={formData.password} onChange={handleChange}
                                                className={errors.password ? 'error' : ''}
                                                placeholder="Min. 8 characters" autoComplete="new-password" />
                                            <button type="button" className="password-toggle" onClick={() => setShowPassword(p => !p)} aria-label="Toggle password visibility">
                                                {showPassword ? '👁️' : '🙈'}
                                            </button>
                                        </div>
                                        <PasswordStrength password={formData.password} />
                                        {errors.password && <span className="error-message" role="alert">{errors.password}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                                        <div className="input-with-icon">
                                            <input type={showConfirm ? 'text' : 'password'} id="confirmPassword" name="confirmPassword"
                                                value={formData.confirmPassword} onChange={handleChange}
                                                className={errors.confirmPassword ? 'error' : ''}
                                                placeholder="Re-enter password" autoComplete="new-password" />
                                            <button type="button" className="password-toggle" onClick={() => setShowConfirm(p => !p)} aria-label="Toggle confirm password visibility">
                                                {showConfirm ? '👁️' : '🙈'}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && <span className="error-message" role="alert">{errors.confirmPassword}</span>}
                                    </div>
                                </div>

                                <div className="form-group checkbox-group">
                                    <input type="checkbox" id="agreedToTerms" name="agreedToTerms"
                                        checked={formData.agreedToTerms} onChange={handleChange} />
                                    <label htmlFor="agreedToTerms">
                                        I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                                    </label>
                                    {errors.agreedToTerms && <span className="error-message" role="alert">{errors.agreedToTerms}</span>}
                                </div>

                                {errors.submit && <div className="error-message submit-error" role="alert">{errors.submit}</div>}

                                <button type="submit" className="register-btn" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <span className="btn-loading">
                                            <span className="btn-spinner" /> Creating Account...
                                        </span>
                                    ) : 'Create Account'}
                                </button>

                                <p className="login-link">
                                    Already have an account? <Link to="/login">Sign In</Link>
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                <div className="benefits-section">
                    <h3>Why Join TalentFlowAI as a Client?</h3>
                    <ul className="benefits-list">
                        <li className="benefit-item"><div className="benefit-icon">✨</div><div className="benefit-content"><h4>AI-Powered Matching</h4><p>Get matched with the perfect freelancers based on your specific needs</p></div></li>
                        <li className="benefit-item"><div className="benefit-icon">🚀</div><div className="benefit-content"><h4>Quick Hiring Process</h4><p>Post a job and get matched with qualified talent within hours</p></div></li>
                        <li className="benefit-item"><div className="benefit-icon">💰</div><div className="benefit-content"><h4>Cost-Effective Solutions</h4><p>Save up to 40% on hiring costs compared to traditional methods</p></div></li>
                        <li className="benefit-item"><div className="benefit-icon">🛡️</div><div className="benefit-content"><h4>Secure Payments</h4><p>Escrow protection ensures your money is safe until work is completed</p></div></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ClientRegistrationPage;
