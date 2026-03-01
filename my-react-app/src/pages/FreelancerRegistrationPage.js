import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FreelancerRegistrationPage.css';

const FreelancerRegistrationPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        professionalTitle: '',
        phoneNumber: '',
        skills: '',
        portfolioUrl: '',
        bio: '',
        agreedToTerms: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [skillsList, setSkillsList] = useState([]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSkillsChange = (e) => {
        const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
        setSkillsList(skills);
        setFormData({
            ...formData,
            skills: e.target.value
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

        if (!formData.professionalTitle.trim()) {
            newErrors.professionalTitle = 'Professional title is required';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        }

        if (!formData.skills.trim()) {
            newErrors.skills = 'Please add at least one skill';
        } else if (skillsList.length < 3) {
            newErrors.skills = 'Please add at least 3 skills';
        }

        if (formData.portfolioUrl && !/^https?:\/\/.+/.test(formData.portfolioUrl)) {
            newErrors.portfolioUrl = 'Please enter a valid URL (http:// or https://)';
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
            console.log('Freelancer registration data:', { ...formData, skillsList });

            // Show success message
            setRegistrationSuccess(true);
            setIsSubmitting(false);
        } catch (error) {
            setErrors({ submit: 'Registration failed. Please try again.' });
            setIsSubmitting(false);
        }
    };

    const popularSkills = [
        'JavaScript', 'React', 'Python', 'Node.js', 'UI/UX Design',
        'Java', 'C++', 'Angular', 'Vue.js', 'Django', 'Ruby', 'PHP'
    ];

    const addSkill = (skill) => {
        if (!skillsList.includes(skill)) {
            const newSkillsList = [...skillsList, skill];
            setSkillsList(newSkillsList);
            setFormData({
                ...formData,
                skills: newSkillsList.join(', ')
            });
        }
    };

    const removeSkill = (skillToRemove) => {
        const newSkillsList = skillsList.filter(skill => skill !== skillToRemove);
        setSkillsList(newSkillsList);
        setFormData({
            ...formData,
            skills: newSkillsList.join(', ')
        });
    };

    return (
        <div className="registration-page">
            <div className="registration-container">
                <div className="registration-form-container">
                    <div className="registration-form">
                        <div className="logo-section">
                            <h2>TalentAI</h2>
                            <span>Join as Freelancer</span>
                        </div>

                        <h3 className="form-title">Create Your Freelancer Account</h3>
                        <p className="form-subtitle">Showcase your skills and connect with top clients</p>

                        {registrationSuccess ? (
                            <div className="success-message">
                                <h3>Registration Successful!</h3>
                                <p>Your freelancer account has been created. Please check your email to verify your account.</p>
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
                                            placeholder="John Doe"
                                        />
                                        {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="professionalTitle">Professional Title</label>
                                        <input
                                            type="text"
                                            id="professionalTitle"
                                            name="professionalTitle"
                                            value={formData.professionalTitle}
                                            onChange={handleChange}
                                            className={errors.professionalTitle ? 'error' : ''}
                                            placeholder="e.g., Full Stack Developer"
                                        />
                                        {errors.professionalTitle && <span className="error-message">{errors.professionalTitle}</span>}
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
                                        placeholder="john@example.com"
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
                                    <label htmlFor="phoneNumber">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className={errors.phoneNumber ? 'error' : ''}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                    {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="skills">Skills</label>
                                    <input
                                        type="text"
                                        id="skills"
                                        name="skills"
                                        value={formData.skills}
                                        onChange={handleSkillsChange}
                                        className={errors.skills ? 'error' : ''}
                                        placeholder="e.g., JavaScript, React, Node.js"
                                    />
                                    {errors.skills && <span className="error-message">{errors.skills}</span>}

                                    <div className="popular-skills">
                                        <span>Popular skills:</span>
                                        {popularSkills.map(skill => (
                                            <button
                                                key={skill}
                                                type="button"
                                                className="skill-tag"
                                                onClick={() => addSkill(skill)}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>

                                    {skillsList.length > 0 && (
                                        <div className="selected-skills">
                                            {skillsList.map(skill => (
                                                <div key={skill} className="selected-skill">
                                                    {skill}
                                                    <button type="button" onClick={() => removeSkill(skill)}>
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="portfolioUrl">Portfolio URL (Optional)</label>
                                    <input
                                        type="url"
                                        id="portfolioUrl"
                                        name="portfolioUrl"
                                        value={formData.portfolioUrl}
                                        onChange={handleChange}
                                        className={errors.portfolioUrl ? 'error' : ''}
                                        placeholder="https://yourportfolio.com"
                                    />
                                    {errors.portfolioUrl && <span className="error-message">{errors.portfolioUrl}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="bio">Bio/Description</label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows="4"
                                        placeholder="Tell us about yourself and your experience..."
                                    ></textarea>
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
                    <h3>Why Join TalentAI as a Freelancer?</h3>
                    <ul className="benefits-list">
                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>AI-Powered Job Matching</h4>
                                <p>Get matched with projects that perfectly align with your skills and experience</p>
                            </div>
                        </li>

                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Fair Compensation</h4>
                                <p>Our AI ensures you receive fair market rates based on your expertise and project complexity</p>
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
                                <p>Guaranteed payments with milestone-based releases and escrow protection</p>
                            </div>
                        </li>

                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Build Your Reputation</h4>
                                <p>Advanced sentiment analysis provides genuine feedback to showcase your quality</p>
                            </div>
                        </li>

                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Flexible Work</h4>
                                <p>Choose projects that fit your schedule and work from anywhere in the world</p>
                            </div>
                        </li>

                        <li className="benefit-item">
                            <div className="benefit-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                            </div>
                            <div className="benefit-content">
                                <h4>Career Growth</h4>
                                <p>Access to premium projects and opportunities to expand your professional network</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
// Example for FreelancerRegistrationPage.js
const handleSubmit = async (e) => {
    e.preventDefault();
    /* ... validation logic ... */
    try {
        const response = await fetch('http://localhost:8080/api/auth/register/freelancer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token); // Save JWT
            setRegistrationSuccess(true);
        }
    } catch (error) {
        setErrors({ submit: 'Connection to server failed.' });
    }
};

export default FreelancerRegistrationPage;