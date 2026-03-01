import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    const [activeTab, setActiveTab] = useState('clients');

    return (
        <div className="homepage">
            {/* Dynamic Background Shapes */}
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
                        <h2>TalentAI</h2>
                        <span>Intelligent Hiring</span>
                    </div>

                    <div className="nav-links">
                        <Link to="/features">Features</Link>
                        <Link to="/how-it-works">How It Works</Link>
                        <Link to="/pricing">Pricing</Link>
                        <div className="admin-dropdown">
                            <button className="admin-btn">Admin</button>
                            <div className="admin-dropdown-content">
                                <Link to="/admin-registration" className="dropdown-link">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="currentColor" d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                    Admin Registration
                                </Link>
                                <Link to="/admin-login" className="dropdown-link">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                    </svg>
                                    Admin Login
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="nav-buttons">
                        <div className="login-dropdown">
                            <button className="login-btn">Log In</button>
                            <div className="login-dropdown-content">
                                <Link to="/login" className="dropdown-link">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                    Client Login
                                </Link>
                                <Link to="/freelancer-login" className="dropdown-link">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                    </svg>
                                    Freelancer Login
                                </Link>
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

                        <div className="user-tabs">
                            <button
                                className={`tab ${activeTab === 'clients' ? 'active' : ''}`}
                                onClick={() => setActiveTab('clients')}
                            >
                                I'm a Client
                            </button>
                            <button
                                className={`tab ${activeTab === 'freelancers' ? 'active' : ''}`}
                                onClick={() => setActiveTab('freelancers')}
                            >
                                I'm a Freelancer
                            </button>
                        </div>

                        <div className="tab-content">
                            {activeTab === 'clients' ? (
                                <div className="client-content">
                                    <h3>Post a Job and Get Matched Instantly</h3>
                                    <p>Our AI analyzes your requirements and finds the perfect match from our talent pool.</p>
                                    <div className="tab-buttons-centered">
                                        <Link to="/client-register" className="cta-btn">Post Your First Job</Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="freelancer-content">
                                    <h3>Find Projects That Match Your Skills</h3>
                                    <p>Our AI matches you with projects that align with your expertise and career goals.</p>
                                    <div className="tab-buttons-centered">
                                        <Link to="/freelancer-register" className="cta-btn">Browse Opportunities</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">Why Choose TalentAI?</h2>
                    <p className="section-subtitle">Revolutionary features that make hiring smarter and more efficient</p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" width="40" height="40">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <h3>AI-Powered Matching</h3>
                            <p>Our algorithm analyzes skills, experience, and project requirements to find the perfect match.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" width="40" height="40">
                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <h3>Fair Pricing Prediction</h3>
                            <p>Data-driven insights help determine fair market rates for projects based on complexity and skills required.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" width="40" height="40">
                                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                                </svg>
                            </div>
                            <h3>Secure Authentication</h3>
                            <p>OTP-based verification and JWT tokens ensure your data and projects remain secure.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" width="40" height="40">
                                    <path fill="currentColor" d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                                </svg>
                            </div>
                            <h3>Project Management</h3>
                            <p>End-to-end project tracking from proposal to completion with milestone-based payments.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" width="40" height="40">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                </svg>
                            </div>
                            <h3>Sentiment Analysis</h3>
                            <p>Advanced NLP analyzes reviews to provide genuine feedback beyond simple star ratings.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" width="40" height="40">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                                </svg>
                            </div>
                            <h3>Role-Based Access</h3>
                            <p>Strict access controls ensure users only see and interact with features relevant to their role.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="container">
                    <h2 className="section-title">How TalentAI Works</h2>
                    <p className="section-subtitle">Get started in just a few simple steps</p>

                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Sign Up & Verify</h3>
                            <p>Create an account and verify your identity using our secure OTP system via SMS or email.</p>
                        </div>

                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Create Profile or Post Job</h3>
                            <p>Freelancers build detailed portfolios, while clients post detailed job requirements.</p>
                        </div>

                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>AI Matching</h3>
                            <p>Our algorithm analyzes requirements and skills to provide the best matches for your needs.</p>
                        </div>

                        <div className="step">
                            <div className="step-number">4</div>
                            <h3>Collaborate & Complete</h3>
                            <p>Work together using our project management tools and complete the project with milestone payments.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <h2>Ready to Experience Smarter Hiring?</h2>
                    <p>Join thousands of clients and freelancers who have transformed their hiring process with AI.</p>
                    <div className="cta-buttons">
                        <Link to="/client-register" className="primary-btn">Get Started as Client</Link>
                        <Link to="/freelancer-register" className="secondary-btn">Join as Freelancer</Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-column">
                            <h3>TalentAI</h3>
                            <p>Intelligent hiring powered by machine learning.</p>
                            <div className="social-links">
                                <a href="#" aria-label="Facebook">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path fill="currentColor" d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                                    </svg>
                                </a>
                                <a href="#" aria-label="Twitter">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path fill="currentColor" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                    </svg>
                                </a>
                                <a href="#" aria-label="LinkedIn">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <div className="footer-column">
                            <h4>For Clients</h4>
                            <ul>
                                <li><Link to="/how-it-works">How It Works</Link></li>
                                <li><Link to="/pricing">Pricing Plans</Link></li>
                                <li><Link to="/success-stories">Success Stories</Link></li>
                                <li><Link to="/enterprise">Enterprise Solutions</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4>For Freelancers</h4>
                            <ul>
                                <li><Link to="/browse-jobs">Browse Jobs</Link></li>
                                <li><Link to="/freelancer-resources">Resources</Link></li>
                                <li><Link to="/freelancer-community">Community</Link></li>
                                <li><Link to="/freelancer-faq">FAQ</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4>Support</h4>
                            <ul>
                                <li><Link to="/help-center">Help Center</Link></li>
                                <li><Link to="/contact">Contact Us</Link></li>
                                <li><Link to="/privacy">Privacy Policy</Link></li>
                                <li><Link to="/terms">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; 2023 TalentAI. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;