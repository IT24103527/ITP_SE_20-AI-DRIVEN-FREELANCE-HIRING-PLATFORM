import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In a real app, you would make an API call here
            console.log('Admin login data:', formData);

            // Redirect to dashboard on successful login
            navigate('/admin-dashboard');
        } catch (error) {
            setErrors({ submit: 'Invalid email or password. Please try again.' });
            setIsSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-form-container">
                    <div className="login-form">
                        <div className="logo-section">
                            <h2>TalentAI</h2>
                            <span>Admin Portal</span>
                        </div>

                        <h3 className="form-title">Admin Sign In</h3>
                        <p className="form-subtitle">Access your admin dashboard and manage the platform</p>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Admin Email</label>
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
                                        placeholder="admin@talentai.com"
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
                                        placeholder="Enter your admin password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 24 24" width="20" height="20">
                                                <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" width="20" height="20">
                                                <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                            </svg>
                                        )}
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

                            {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

                            <button
                                type="submit"
                                className="login-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="divider">
                            <span>OR</span>
                        </div>

                        <div className="social-login">
                            <button className="social-btn google-btn">
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Sign in with Google
                            </button>

                            <button className="social-btn linkedin-btn">
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                Sign in with LinkedIn
                            </button>
                        </div>

                        <p className="signup-link">
                            Don't have an admin account? <Link to="/admin-registration">Register Here</Link>
                        </p>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Admin Portal Access</h3>
                    <p>Sign in to access your admin dashboard and manage the TalentAI platform.</p>

                    <div className="benefits-list">
                        <div className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Platform Oversight</h4>
                                <p>Monitor platform health and ensure compliance with community guidelines</p>
                            </div>
                        </div>

                        <div className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>User Management</h4>
                                <p>Manage client and freelancer accounts, including verification and dispute resolution</p>
                            </div>
                        </div>

                        <div className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Analytics & Reports</h4>
                                <p>Access comprehensive analytics and generate detailed reports for stakeholders</p>
                            </div>
                        </div>

                        <div className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Security & Compliance</h4>
                                <p>Ensure platform security and maintain regulatory compliance</p>
                            </div>
                        </div>
                    </div>

                    <div className="security-notice">
                        <h4>Security Notice</h4>
                        <p>Admin accounts have elevated privileges. Never share your credentials and always use secure networks when accessing the admin portal.</p>
                    </div>

                    <div className="support-info">
                        <h4>Need Assistance?</h4>
                        <p>For technical support or account issues, please contact the system administrator.</p>
                        <Link to="/support" className="support-link">Contact Support</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Run local UI validation (checks for email and password)
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
        // 2. Call the general Login endpoint (Admin uses the same route as others)
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Login only requires email and password
            body: JSON.stringify({
                email: formData.email,
                password: formData.password
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // 3. On Success: Save JWT and Role, then redirect
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);

            console.log('Admin login successful');

            // Redirect to the Admin Dashboard
            navigate('/admin-dashboard');
        } else {
            // 4. Handle logical errors (e.g. "Invalid credentials")
            setErrors({ submit: data.message || 'Invalid admin credentials. Please try again.' });
            setIsSubmitting(false);
        }
    } catch (error) {
        // 5. Handle Network/Connection errors
        setErrors({ submit: 'The server is not responding. Please try again later.' });
        setIsSubmitting(false);
    }
};

export default AdminLoginPage;