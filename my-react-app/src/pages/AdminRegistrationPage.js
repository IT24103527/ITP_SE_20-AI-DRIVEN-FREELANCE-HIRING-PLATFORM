import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminRegistrationPage.css';

const AdminRegistrationPage = () => {
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
            console.log('Admin registration data:', formData);

            // Show success message
            setRegistrationSuccess(true);
            setIsSubmitting(false);
        } catch (error) {
            setErrors({ submit: 'Registration failed. Please check your admin code and try again.' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="registration-page">
            <div className="registration-container">
                <div className="registration-form-container">
                    <div className="registration-form">
                        <div className="logo-section">
                            <h2>TalentAI</h2>
                            <span>Admin Registration</span>
                        </div>

                        <h3 className="form-title">Create Your Admin Account</h3>
                        <p className="form-subtitle">Register to manage and oversee the TalentAI platform</p>

                        {registrationSuccess ? (
                            <div className="success-message">
                                <h3>Registration Successful!</h3>
                                <p>Your admin account has been created. You will be notified once your account is reviewed and approved.</p>
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
                                            placeholder="Min. 8 characters"
                                        />
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
                                        I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>, and acknowledge the admin responsibilities
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
                    <p>As an administrator, you play a crucial role in maintaining the integrity and quality of our platform.</p>

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
                                <h4>Analytics & Insights</h4>
                                <p>Access comprehensive analytics and reports to make data-driven decisions</p>
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
                                <p>Ensure platform security and compliance with industry regulations</p>
                            </div>
                        </div>
                    </div>

                    <div className="security-notice">
                        <h4>Security Notice</h4>
                        <p>Admin accounts have elevated privileges. You are responsible for maintaining the confidentiality of your credentials and using your access only for intended purposes.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Run local UI validation (checks if all fields are filled)
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
        // 2. Call the specific Admin Registration endpoint
        const response = await fetch('http://localhost:8080/api/auth/register/admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Sends fullName, email, password, and the vital adminCode
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            // 3. On Success: Store token and Role, then show success state
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);

            console.log('Admin registration successful');

            // This triggers the success message view in your registration UI
            setRegistrationSuccess(true);
            setIsSubmitting(false);
        } else {
            // 4. Handle logical errors (e.g. "Invalid Admin Code" or "Email Taken")
            // This pulls the error message directly from our Backend AuthService
            setErrors({ submit: data.message || 'Registration failed. Check your Admin Code.' });
            setIsSubmitting(false);
        }
    } catch (error) {
        // 5. Handle Connection Errors
        setErrors({ submit: 'The backend server is unreachable. Please verify it is running on port 8080.' });
        setIsSubmitting(false);
    }
};

export default AdminRegistrationPage;