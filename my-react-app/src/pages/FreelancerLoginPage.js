import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FreelancerLoginPage.css';

const FreelancerLoginPage = () => {
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
            console.log('Freelancer login data:', formData);

            // Redirect to dashboard on successful login
            navigate('/freelancer-dashboard');
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
                            <span>Welcome Back, Freelancer</span>
                        </div>

                        <h3 className="form-title">Sign In to Your Account</h3>
                        <p className="form-subtitle">Access your dashboard and find your next opportunity</p>

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
                            Don't have an account? <Link to="/freelancer-register">Sign Up</Link>
                        </p>
                    </div>
                </div>

                <div className="info-section">
                    <h3>Welcome Back to TalentAI</h3>
                    <p>Sign in to access your personalized dashboard and discover new opportunities.</p>

                    <div className="benefits-list">
                        <div className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Find Perfect Projects</h4>
                                <p>Discover opportunities that match your skills and experience</p>
                            </div>
                        </div>

                        <div className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Track Your Applications</h4>
                                <p>Monitor the status of all your project proposals</p>
                            </div>
                        </div>

                        <div className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Manage Your Portfolio</h4>
                                <p>Update your skills and showcase your latest work</p>
                            </div>
                        </div>

                        <div className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Receive Payments</h4>
                                <p>Secure and timely payments for completed projects</p>
                            </div>
                        </div>
                    </div>

                    <div className="stats-section">
                        <h4>Platform Statistics</h4>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-number">10,000+</span>
                                <span className="stat-label">Active Freelancers</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">5,000+</span>
                                <span className="stat-label">Monthly Projects</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">$2M+</span>
                                <span className="stat-label">Paid Monthly</span>
                            </div>
                        </div>
                    </div>

                    <div className="support-info">
                        <h4>Need Help?</h4>
                        <p>Our support team is available 24/7 to assist you.</p>
                        <Link to="/support" className="support-link">Contact Support</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Run the local UI validation
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
        // 2. Make the real API call to Spring Boot
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.email,
                password: formData.password
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // 3. On Success: Save credentials and navigate
            localStorage.setItem('token', data.token); // Save JWT for future API calls
            localStorage.setItem('userRole', data.role); // Save role for route protection

            // If "Remember Me" is checked, you could store the email
            if (formData.rememberMe) {
                localStorage.setItem('rememberedEmail', formData.email);
            }

            console.log('Login successful:', data.role);
            navigate('/freelancer-dashboard');
        } else {
            // 4. On Error: Extract message from GlobalExceptionHandler.java
            setErrors({ submit: data.message || 'Invalid email or password. Please try again.' });
            setIsSubmitting(false);
        }
    } catch (error) {
        // 5. On Connection Failure: Stop the spinner and show generic error
        setErrors({ submit: 'Server is currently offline. Please try again later.' });
        setIsSubmitting(false);
    }
};

export default FreelancerLoginPage;