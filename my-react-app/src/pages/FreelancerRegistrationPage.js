import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast, { useToast } from '../components/Toast';
import PasswordStrength from '../components/PasswordStrength';
import HomePageButton from '../components/HomePageButton';
import './FreelancerRegistrationPage.css';

const FreelancerRegistrationPage = () => {
    const navigate = useNavigate();
    const { toasts, success, error: toastError, warning } = useToast();
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
    const [qrCode, setQrCode] = useState('');
    const [totpSecret, setTotpSecret] = useState('');
    const [roleAdded, setRoleAdded] = useState(false);
    const [skillsList, setSkillsList] = useState([]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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

        if (!formData.fullName.trim())
            newErrors.fullName = 'Full name is required';
        else if (!/^[a-zA-Z\s'-]+$/.test(formData.fullName.trim()))
            newErrors.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes';

        if (!formData.email.trim())
            newErrors.email = 'Email address is required';
        else if (!formData.email.includes('@'))
            newErrors.email = 'Email must contain @';

        if (!formData.password)
            newErrors.password = 'Password is required';
        else if (formData.password.length < 8)
            newErrors.password = 'Password must be at least 8 characters';
        else if (!/[A-Z]/.test(formData.password))
            newErrors.password = 'Password must contain at least one uppercase letter';
        else if (!/[0-9]/.test(formData.password))
            newErrors.password = 'Password must contain at least one number';

        if (!formData.confirmPassword)
            newErrors.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = 'Passwords do not match';

        if (!formData.professionalTitle.trim())
            newErrors.professionalTitle = 'Professional title is required';

        if (!formData.phoneNumber.trim())
            newErrors.phoneNumber = 'Phone number is required';
        else if (!/^\+?[0-9\s\-()]{7,15}$/.test(formData.phoneNumber.trim()))
            newErrors.phoneNumber = 'Please enter a valid phone number (e.g. +94771234567)';

        if (!formData.skills.trim())
            newErrors.skills = 'Please add at least one skill';
        else if (skillsList.length < 3)
            newErrors.skills = 'Please add at least 3 skills to improve your match quality';

        if (formData.portfolioUrl && !/^https?:\/\/.+/.test(formData.portfolioUrl))
            newErrors.portfolioUrl = 'Portfolio URL must start with http:// or https://';

        if (!formData.agreedToTerms)
            newErrors.agreedToTerms = 'You must agree to the Terms of Service and Privacy Policy';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            warning('Please fix the errors below before submitting');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post('http://localhost:8080/api/auth/register/freelancer', {
                fullName: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                professionalTitle: formData.professionalTitle.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                skills: formData.skills,
                portfolioUrl: formData.portfolioUrl,
                bio: formData.bio
            });

            if (response.status === 200) {
                const data = response.data;
                setQrCode(data.qrCode || '');
                setTotpSecret(data.totpSecret || '');
                if (data.qrCode) {
                    setRegistrationSuccess(true);
                    success('Freelancer account created successfully!');
                } else {
                    setRoleAdded(true);
                    success('Freelancer role added to your existing account!');
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
            <Toast toasts={toasts} />
            <HomePageButton />
            <div className="registration-container">
                <div className="registration-form-container">
                    <div className="registration-form">
                        <div className="logo-section">
                            <h2>TalentAI</h2>
                            <span>Join as Freelancer</span>
                        </div>

                        <h3 className="form-title">Create Your Freelancer Account</h3>
                        <p className="form-subtitle">Showcase your skills and connect with top clients</p>

                        {roleAdded ? (
                            <div className="success-message">
                                <h3>✅ Freelancer Role Added!</h3>
                                <p>Your existing account now has <strong>Freelancer</strong> access. Use your existing password and authenticator app to log in to the Freelancer portal.</p>
                                <div style={{background:'rgba(102,126,234,0.1)',border:'1px solid rgba(102,126,234,0.3)',borderRadius:'10px',padding:'16px',margin:'16px 0',textAlign:'left'}}>
                                    <p style={{color:'#94a3b8',fontSize:'0.85rem',margin:0}}>
                                        🔐 Your TOTP authenticator app and password remain the same.<br/>
                                        Simply go to the <strong style={{color:'#a78bfa'}}>Freelancer Login</strong> page and sign in.
                                    </p>
                                </div>
                                <Link to="/freelancer-login" className="login-link-btn" style={{marginTop:'8px',display:'inline-block'}}>
                                    Go to Freelancer Login →
                                </Link>
                            </div>
                        ) : registrationSuccess ? (
                            <div className="success-message">
                                <h3>✅ Registration Successful!</h3>
                                <p>Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> to set up your login verification.</p>
                                {qrCode && <img src={qrCode} alt="TOTP QR Code" style={{width:'200px',height:'200px',margin:'16px auto',display:'block',borderRadius:'8px'}} />}
                                <p style={{fontSize:'0.8rem',color:'#94a3b8',marginTop:'8px'}}>Can't scan? Enter this key manually: <code style={{background:'#112244',padding:'4px 8px',borderRadius:'4px',color:'#60a5fa'}}>{totpSecret}</code></p>
                                <p style={{marginTop:'12px',fontSize:'0.85rem',color:'#94a3b8'}}>After scanning, you'll use the 6-digit code from the app every time you log in.</p>
                                <Link to="/freelancer-login" className="login-link-btn" style={{marginTop:'16px',display:'inline-block'}}>Go to Login →</Link>
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
                                        <PasswordStrength password={formData.password} />
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
                        {/* Benefits list remains same as your original provided code */}
                        <li className="benefit-item">
                            <div className="benefit-icon">🚀</div>
                            <div className="benefit-content">
                                <h4>AI-Powered Job Matching</h4>
                                <p>Get matched with projects that perfectly align with your skills and experience</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default FreelancerRegistrationPage;