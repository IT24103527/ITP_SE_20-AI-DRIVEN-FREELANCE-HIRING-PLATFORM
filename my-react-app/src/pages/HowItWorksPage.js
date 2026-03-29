import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HomePageButton from '../components/HomePageButton';
import NavDropdowns from '../components/NavDropdowns';
import './HowItWorksPage.css';

const HowItWorksPage = () => {
    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        {
            id: 1,
            title: 'Sign Up & Create Profile',
            description: 'Create your account as a client or freelancer and build your comprehensive profile with skills, experience, and preferences.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            ),
            color: '#4361ee'
        },
        {
            id: 2,
            title: 'AI-Powered Matching',
            description: 'Our advanced AI algorithm analyzes your requirements and matches you with the perfect talent based on skills, experience, and project complexity.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            ),
            color: '#667eea'
        },
        {
            id: 3,
            title: 'Collaborate & Complete',
            description: 'Work together through our platform with built-in communication tools, milestone tracking, and secure payment processing.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
            ),
            color: '#f093fb'
        },
        {
            id: 4,
            title: 'Rate & Review',
            description: 'Provide feedback and ratings after project completion. Our sentiment analysis ensures genuine reviews for better future matches.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
            ),
            color: '#43e97b'
        }
    ];

    const handleStepClick = (stepId) => {
        setActiveStep(stepId);
    };

    return (
        <div className="how-it-works-page">
            {/* HomePage Button */}
            <HomePageButton />

            {/* Dynamic Background layer */}
            <div className="bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
                <div className="shape shape-5"></div>
            </div>

            {/* Navigation Bar */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="logo">
                        <h2 className="logo-text">TalentFlow<span className="ai-accent">AI</span></h2>
                    </div>

                    <div className="nav-menu">
                        <Link to="/features" className="nav-item">Features</Link>
                        <Link to="/how-it-works" className="nav-item active">How It Works</Link>
                        <Link to="/earn-more" className="nav-item">Earn More</Link>
                    </div>

                    <NavDropdowns />
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">How TalentFlowAI Works</h1>
                        <p className="hero-subtitle">
                            Our intelligent platform makes hiring simple, efficient, and more accurate than ever before.
                        </p>
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="steps-section">
                <div className="container">
                    <div className="steps-container">
                        <div className="steps-visual">
                            <div className="step-connector"></div>
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`step-visual ${activeStep === step.id ? 'active' : ''}`}
                                    onClick={() => handleStepClick(step.id)}
                                >
                                    <div className="step-icon" style={{ backgroundColor: step.color }}>
                                        {step.icon}
                                    </div>
                                    <div className="step-number">{step.id}</div>
                                </div>
                            ))}
                        </div>

                        <div className="steps-content">
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`step-content glass-card ${activeStep === step.id ? 'active' : ''}`}
                                >
                                    <div className="step-header">
                                        <h3 className="step-title">{step.title}</h3>
                                    </div>
                                    <p className="step-description">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Details */}
            <section className="process-details">
                <div className="container">
                    <h2 className="section-title">Our Intelligent Process</h2>
                    <div className="process-grid">
                        <div className="process-card glass-card">
                            <div className="process-icon">
                                <svg viewBox="0 0 24 24" width="30" height="30">
                                    <path fill="currentColor" d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2h8v2h1V9zm0 2h8v2h-8V9z"/>
                                </svg>
                            </div>
                            <h4>Smart Profile Creation</h4>
                            <p>Our guided profile creation process ensures all relevant information is captured for optimal AI matching.</p>
                        </div>

                        <div className="process-card glass-card">
                            <div className="process-icon">
                                <svg viewBox="0 0 24 24" width="30" height="30">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm3.1-9h-8.2c-.8 0-1.4.6-1.4 1.4v5.2c0 .8.6 1.4 1.4 1.4h8.2c.8 0 1.4-.6 1.4-1.4v-5.2c0-.8-.6-1.4-1.4-1.4z"/>
                                </svg>
                            </div>
                            <h4>AI Analysis</h4>
                            <p>Machine learning algorithms analyze skills, experience, ratings, and project requirements for perfect matches.</p>
                        </div>

                        <div className="process-card glass-card">
                            <div className="process-icon">
                                <svg viewBox="0 0 24 24" width="30" height="30">
                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <h4>Real-time Matching</h4>
                            <p>Get instant matches as soon as you post a job, with relevance scores updated in real-time.</p>
                        </div>

                        <div className="process-card glass-card">
                            <div className="process-icon">
                                <svg viewBox="0 0 24 24" width="30" height="30">
                                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                                </svg>
                            </div>
                            <h4>Secure Collaboration</h4>
                            <p>Built-in communication tools, milestone tracking, and escrow payments ensure safe and efficient collaboration.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits-section">
                <div className="container">
                    <h2 className="section-title">Why Choose Our AI-Powered Approach?</h2>
                    <div className="benefits-grid">
                        <div className="benefit-item glass-card">
                            <div className="benefit-header">
                                <div className="benefit-icon">
                                    <svg viewBox="0 0 24 24" width="30" height="30">
                                        <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                    </svg>
                                </div>
                                <h4 className="benefit-title">95% Match Accuracy</h4>
                            </div>
                            <div className="benefit-content">
                                <p className="benefit-description">
                                    Our AI achieves 95% accuracy in matching freelancers with suitable projects, reducing time-to-hire by 60%.
                                </p>
                                <div className="benefit-stats">
                                    <div className="stat-item">
                                        <span className="stat-number">95%</span>
                                        <span className="stat-label">Match Accuracy</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">60%</span>
                                        <span className="stat-label">Time Reduction</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="benefit-item glass-card">
                            <div className="benefit-header">
                                <div className="benefit-icon">
                                    <svg viewBox="0 0 24 24" width="30" height="30">
                                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                </div>
                                <h4 className="benefit-title">50% Faster Hiring</h4>
                            </div>
                            <div className="benefit-content">
                                <p className="benefit-description">
                                    Automated matching and screening reduces average hiring time from 45 days to just 22 days.
                                </p>
                                <div className="benefit-stats">
                                    <div className="stat-item">
                                        <span className="stat-number">50%</span>
                                        <span className="stat-label">Faster</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">45→22</span>
                                        <span className="stat-label">Days</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="benefit-item glass-card">
                            <div className="benefit-header">
                                <div className="benefit-icon">
                                    <svg viewBox="0 0 24 24" width="30" height="30">
                                        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                </div>
                                <h4 className="benefit-title">30% Better Quality</h4>
                            </div>
                            <div className="benefit-content">
                                <p className="benefit-description">
                                    AI-driven matching results in 30% better project outcomes compared to traditional hiring methods.
                                </p>
                                <div className="benefit-stats">
                                    <div className="stat-item">
                                        <span className="stat-number">30%</span>
                                        <span className="stat-label">Better Quality</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">AI vs</span>
                                        <span className="stat-label">Traditional</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="benefit-item glass-card">
                            <div className="benefit-header">
                                <div className="benefit-icon">
                                    <svg viewBox="0 0 24 24" width="30" height="30">
                                        <path fill="currentColor" d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2h8v2h1V9zm0 16H5v2h14v-2c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"/>
                                    </svg>
                                </div>
                                <h4 className="benefit-title">40% Cost Reduction</h4>
                            </div>
                            <div className="benefit-content">
                                <p className="benefit-description">
                                    Automated processes and better matches reduce overall hiring costs by an average of 40%.
                                </p>
                                <div className="benefit-stats">
                                    <div className="stat-item">
                                        <span className="stat-number">40%</span>
                                        <span className="stat-label">Cost Reduction</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">ROI</span>
                                        <span className="stat-label">Improvement</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials-section">
                <div className="container">
                    <h2 className="section-title">Success Stories</h2>
                    <div className="testimonials-grid">
                        <div className="testimonial-card glass-card">
                            <div className="testimonial-content">
                                <p>"TalentFlowAI helped us find the perfect developer in just 3 days. The AI matching was incredibly accurate!"</p>
                                <div className="testimonial-author">
                                    <strong>Sarah Johnson</strong>
                                    <span>CTO, TechCorp</span>
                                </div>
                            </div>
                            <div className="testimonial-rating">
                                <div className="stars">★★★★★</div>
                            </div>
                        </div>

                        <div className="testimonial-card glass-card">
                            <div className="testimonial-content">
                                <p>"The quality of freelancers we've found through TalentFlowAI is exceptional. Highly recommended!"</p>
                                <div className="testimonial-author">
                                    <strong>Michael Chen</strong>
                                    <span>Founder, StartupHub</span>
                                </div>
                            </div>
                            <div className="testimonial-rating">
                                <div className="stars">★★★★★★</div>
                            </div>
                        </div>

                        <div className="testimonial-card glass-card">
                            <div className="testimonial-content">
                                <p>"As a freelancer, I've gotten more relevant projects through TalentFlowAI than any other platform."</p>
                                <div className="testimonial-author">
                                    <strong>Emily Rodriguez</strong>
                                    <span>Senior Developer</span>
                                </div>
                            </div>
                            <div className="testimonial-rating">
                                <div className="stars">★★★★★</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <h2>Ready to Transform Your Hiring Process?</h2>
                    <p>Join thousands of companies already using TalentFlowAI to find their perfect talent matches.</p>
                    <div className="cta-buttons">
                        <Link to="/client-register" className="cta-btn primary">Get Started Free</Link>
                        <Link to="/earn-more" className="cta-btn secondary">Earn More</Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
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
                            <h3>Platform</h3>
                            <ul className="footer-links">
                                <li><Link to="/features">Features</Link></li>
                                <li><Link to="/how-it-works">How It Works</Link></li>
                                <li><Link to="/earn-more">Earn More</Link></li>
                            </ul>
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

export default HowItWorksPage;