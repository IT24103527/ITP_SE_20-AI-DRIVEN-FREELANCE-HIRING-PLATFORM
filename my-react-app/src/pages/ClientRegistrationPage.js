import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ClientRegistrationPage.css';

const ClientRegistrationPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        companyName: '',
        phoneNumber: '',
        agreedToTerms: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        }

        if (!formData.agreedToTerms) {
            newErrors.agreedToTerms = 'You must agree to the terms and conditions';
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
            console.log('Client registration data:', formData);

            // Show success message
            setRegistrationSuccess(true);
            setIsSubmitting(false);
        } catch (error) {
            setErrors({ submit: 'Registration failed. Please try again.' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="registration-page">
            <div className="registration-container">
                <div className="registration-form-container">
                    <div className="registration-form">
                        <h2 className="form-title">Create Your Client Account</h2>
                        <p className="form-subtitle">Start hiring top talent today</p>

                        {registrationSuccess ? (
                            <div className="success-message">
                                <h3>Registration Successful!</h3>
                                <p>Your account has been created. Please check your email to verify your account.</p>
                                <Link to="/login" className="login-link-btn">Go to Login</Link>
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
                                        />
                                        {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="companyName">Company Name</label>
                                        <input
                                            type="text"
                                            id="companyName"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className={errors.companyName ? 'error' : ''}
                                        />
                                        {errors.companyName && <span className="error-message">{errors.companyName}</span>}
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
                                    />
                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phoneNumber">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className={errors.phoneNumber ? 'error' : ''}
                                    />
                                    {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={errors.password ? 'error' : ''}
                                    />
                                    {errors.password && <span className="error-message">{errors.password}</span>}
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
                                        I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                                    </label>
                                    {errors.agreedToTerms && <span className="error-message">{errors.agreedToTerms}</span>}
                                </div>

                                {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

                                <button
                                    type="submit"
                                    className="register-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                                </button>

                                <p className="login-link">
                                    Already have an account? <Link to="/login">Log In</Link>
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                <div className="benefits-section">
                    <h3>Why Join TalentAI as a Client?</h3>
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
                                <h4>Fair Pricing Prediction</h4>
                                <p>Get data-driven insights to determine fair market rates for your projects</p>
                            </div>
                        </li>

                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Secure Transactions</h4>
                                <p>Your payments and project data are protected with enterprise-level security</p>
                            </div>
                        </li>

                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Project Management Tools</h4>
                                <p>Track progress, manage milestones, and communicate with your team</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Run local UI validation (matches your existing logic)
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
        // 2. Call the specific Client Registration endpoint
        const response = await fetch('http://localhost:8080/api/auth/register/client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // formData already contains fullName, email, password, companyName, phoneNumber
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            // 3. On Success: Store token/role and show success UI
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);

            console.log('Client registration successful');
            setRegistrationSuccess(true); // Shows the "Success" message in your UI
            setIsSubmitting(false);
        } else {
            // 4. Handle logical errors (e.g. "Email already exists")
            setErrors({ submit: data.message || 'Registration failed. Please try again.' });
            setIsSubmitting(false);
        }
    } catch (error) {
        // 5. Handle Network/Connection errors
        setErrors({ submit: 'Could not connect to the server. Please ensure the backend is running.' });
        setIsSubmitting(false);
    }
};

export default ClientRegistrationPage;