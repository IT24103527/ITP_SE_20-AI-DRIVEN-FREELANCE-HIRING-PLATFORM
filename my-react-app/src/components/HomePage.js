import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Import the main CSS
import HomeReviewsSection from "./HomeReviewsSection";


const HomePage = () => {
    const [activeTab, setActiveTab] = useState('clients');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const adminTimer = useRef(null);
    const loginTimer = useRef(null);

    const openDropdown = (setter, timer) => {
        clearTimeout(timer.current);
        setter(true);
    };

    const closeDropdown = (setter, timer) => {
        timer.current = setTimeout(() => setter(false), 300);
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();

        if (!email) {
            alert('Please enter your email address');
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubscribed(true);
            setEmail('');

            // Reset success message after 3 seconds
            setTimeout(() => {
                setIsSubscribed(false);
            }, 3000);
        }, 1500);
    };

    return (
        <div className="homepage">
            {/* Animated Background layer */}
            <div className="bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
                <div className="shape shape-5"></div>
                <div className="shape shape-6"></div>
            </div>

            {/* Navigation Bar */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="logo">
                        <h2 className="logo-text">TalentFlow<span className="ai-accent">AI</span></h2>
                    </div>

                    <div className="nav-menu">
                        <Link to="/features" className="nav-item">Features</Link>
                        <Link to="/how-it-works" className="nav-item">How It Works</Link>
                        <Link to="/earn-more" className="nav-item">Earn More</Link>
                    </div>

                    <div className="nav-actions">
                        <div
                            className="dropdown-wrapper"
                            onMouseEnter={() => openDropdown(setAdminOpen, adminTimer)}
                            onMouseLeave={() => closeDropdown(setAdminOpen, adminTimer)}
                        >
                            <button className={`nav-btn-blue${adminOpen ? ' open' : ''}`}>Admin</button>
                            <div className={`dropdown-menu${adminOpen ? ' dropdown-menu--open' : ''}`}>
                                <Link to="/admin-registration" className="dropdown-item">Registration</Link>
                                <Link to="/admin-login" className="dropdown-item">Login</Link>
                            </div>
                        </div>

                        <div
                            className="dropdown-wrapper"
                            onMouseEnter={() => openDropdown(setLoginOpen, loginTimer)}
                            onMouseLeave={() => closeDropdown(setLoginOpen, loginTimer)}
                        >
                            <button className={`nav-btn-blue${loginOpen ? ' open' : ''}`}>Log In</button>
                            <div className={`dropdown-menu${loginOpen ? ' dropdown-menu--open' : ''}`}>
                                <Link to="/login" className="dropdown-item">Client Login</Link>
                                <Link to="/freelancer-login" className="dropdown-item">Freelancer Login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Find the Perfect <span className="highlight">AI-Matched</span> Talent
                        </h1>
                        <p className="hero-subtitle">
                            Our platform uses advanced machine learning to connect clients with the ideal freelancers
                            based on skills, experience, and project requirements.
                        </p>

                        <div className="user-tabs-wrapper">
                            <div className="user-tabs-pill">
                                <button
                                    className={`creative-tab ${activeTab === 'clients' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('clients')}
                                >
                                    I'm a Client
                                </button>
                                <button
                                    className={`creative-tab ${activeTab === 'freelancers' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('freelancers')}
                                >
                                    I'm a Freelancer
                                </button>
                            </div>
                        </div>

                        <div className="tab-content glass-card fade-in-up">
                            {activeTab === 'clients' ? (
                                <div className="client-content">
                                    <h3>Post a Job and Get Matched Instantly</h3>
                                    <p>Our AI analyzes your requirements to find the best talent pool matches.</p>
                                    <Link to="/client-register" className="cta-btn">Post Your First Job</Link>
                                </div>
                            ) : (
                                <div className="freelancer-content">
                                    <h3>Find Projects That Match Your Skills</h3>
                                    <p>Our AI matches you with projects that align with your expertise and career goals.</p>
                                    <Link to="/freelancer-register" className="cta-btn">Browse Opportunities</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">Why Choose TalentFlowAI?</h2>
                    <div className="features-grid">
                        {[
                            { icon: "🚀", title: "AI-Powered Matching", desc: "Advanced algorithms for deep skill analysis." },
                            { icon: "💰", title: "Fair Pricing", desc: "Data-driven insights for market rates." },
                            { icon: "🛡️", title: "Secure Auth", desc: "OTP-based verification and JWT security." },
                            { icon: "📊", title: "Project Management", desc: "End-to-end tracking and milestone payments." },
                            { icon: "🧠", title: "Sentiment Analysis", desc: "NLP-powered reviews for genuine feedback." },
                            { icon: "🔐", title: "Role-Based Access", desc: "Strict controls for privacy and security." }
                        ].map((feat, idx) => (
                            <div key={idx} className="feature-card glass-card feature-popup">
                                <div className="feature-icon">{feat.icon}</div>
                                <h3>{feat.title}</h3>
                                <p>{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <HomeReviewsSection />

            {/* Newsletter Section - ADD THIS */}
            <section className="newsletter-section">
                <div className="container">
                    <div className="newsletter-header">
                        <h2 className="newsletter-title">
                            <span className="newsletter-icon">📧</span>
                            Stay Updated
                        </h2>
                        <p className="newsletter-subtitle">
                            Get the latest AI insights and hiring trends delivered to your inbox
                        </p>
                    </div>

                    <form className="newsletter-form" onSubmit={handleSubscribe}>
                        <div className="newsletter-input-group">
                            <input
                                type="email"
                                className="newsletter-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isSubmitting}
                            />
                            <div className="newsletter-input-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V18h16V8z"/>
                                </svg>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`newsletter-join-btn ${isSubmitting ? 'newsletter-loading' : ''} ${isSubscribed ? 'newsletter-success' : ''}`}
                            disabled={isSubmitting}
                        >
                            <div className="newsletter-join-btn-content">
                                {isSubmitting ? (
                                    <div className="newsletter-loading-content">
                                        <div className="newsletter-spinner"></div>
                                        <span>Subscribing...</span>
                                    </div>
                                ) : isSubscribed ? (
                                    <div className="newsletter-success-content">
                                        <svg className="newsletter-success-icon" viewBox="0 0 24 24" width="20" height="20">
                                            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-5.58-5.59z"/>
                                        </svg>
                                        <span>Subscribed!</span>
                                    </div>
                                ) : (
                                    <div className="newsletter-join-btn-content">
                                        <span>Join</span>
                                        <div className="newsletter-btn-shine"></div>
                                    </div>
                                )}
                            </div>
                        </button>
                    </form>

                    <div className="newsletter-benefits">
                        <div className="newsletter-benefit">
                            <span className="newsletter-benefit-icon">✨</span>
                            <span>Weekly AI insights</span>
                        </div>
                        <div className="newsletter-benefit">
                            <span className="newsletter-benefit-icon">🎯</span>
                            <span>Exclusive hiring tips</span>
                        </div>
                        <div className="newsletter-benefit">
                            <span className="newsletter-benefit-icon">🚀</span>
                            <span>Early access to features</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - ADD THIS */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-grid">
                        <div className="footer-column branding">
                            <h2 className="logo-text">TalentFlow<span className="ai-accent">AI</span></h2>
                            <p className="footer-desc">Revolutionizing the future of work.</p>
                            <div className="contact-info">
                                <div className="contact-item">
                                    <span className="contact-icon">📍</span>
                                    Colombo, Sri Lanka
                                </div>
                                <div className="contact-item">
                                    <span className="contact-icon">📧</span>
                                    support@talentflowai.lk
                                </div>
                            </div>
                        </div>



                        <div className="footer-column">
                            <h3>Company</h3>
                            <ul className="footer-links">
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/careers">Careers</Link></li>
                                <li><Link to="/blog">Blog</Link></li>
                                <li><Link to="/press">Press</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3>Support</h3>
                            <ul className="footer-links">
                                <li><Link to="/help-center">Help Center</Link></li>
                                <li><Link to="/contact">Contact Us</Link></li>
                                <li><Link to="/privacy">Privacy Policy</Link></li>
                                <li><Link to="/terms">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; 2026 TalentFlowAI (Pvt) Ltd. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;