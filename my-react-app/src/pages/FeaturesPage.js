import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HomePageButton from '../components/HomePageButton';
import NavDropdowns from '../components/NavDropdowns';
import './FeaturesPage.css';

const FeaturesPage = () => {
    const [activeCategory, setActiveCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'All Features', icon: '🌟' },
        { id: 'ai', name: 'AI-Powered', icon: '🤖' },
        { id: 'collaboration', name: 'Collaboration', icon: '👥' },
        { id: 'security', name: 'Security', icon: '🔒' },
        { id: 'analytics', name: 'Analytics', icon: '📊' }
    ];

    const features = [
        {
            id: 1,
            category: 'ai',
            title: 'Intelligent Talent Matching',
            description: 'Our advanced AI algorithm analyzes skills, experience, and project requirements to find the perfect match for your needs.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            ),
            color: '#4361ee'
        },
        {
            id: 2,
            category: 'ai',
            title: 'Skill Assessment',
            description: 'AI-powered skill assessment and verification ensure freelancers have the expertise they claim.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm3.1-9h-8.2c-.8 0-1.4.6-1.4 1.4v5.2c0 .8.6 1.4 1.4 1.4h8.2c.8 0 1.4-.6 1.4-1.4v-5.2c0-.8-.6-1.4-1.4-1.4z"/>
                </svg>
            ),
            color: '#667eea'
        },
        {
            id: 3,
            category: 'ai',
            title: 'Predictive Analytics',
            description: 'Get insights into project success rates, freelancer performance, and market trends to make informed decisions.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7V7h12v12H4z"/>
                </svg>
            ),
            color: '#f093fb'
        },
        {
            id: 4,
            category: 'collaboration',
            title: 'Real-time Communication',
            description: 'Built-in messaging, video conferencing, and file sharing tools for seamless collaboration.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 4h-2v12h12V6H4z"/>
                </svg>
            ),
            color: '#4facfe'
        },
        {
            id: 5,
            category: 'collaboration',
            title: 'Project Management',
            description: 'Comprehensive project management tools with milestone tracking, deadline reminders, and progress monitoring.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2h8v2h1V9zm0 2h8v2h-8V9z"/>
                </svg>
            ),
            color: '#00f2fe'
        },
        {
            id: 6,
            category: 'security',
            title: 'Secure Payments',
            description: 'Escrow payment protection and secure transaction processing for all projects and milestones.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
            ),
            color: '#43e97b'
        },
        {
            id: 7,
            category: 'security',
            title: 'Identity Verification',
            description: 'Multi-factor authentication and identity verification to ensure all users are genuine professionals.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
            ),
            color: '#f5576c'
        },
        {
            id: 8,
            category: 'analytics',
            title: 'Performance Analytics',
            description: 'Detailed analytics on freelancer performance, project success rates, and platform usage patterns.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7V7h12v12z"/>
                </svg>
            ),
            color: '#ffc107'
        },
        {
            id: 9,
            category: 'analytics',
            title: 'Custom Reporting',
            description: 'Generate custom reports on hiring metrics, cost analysis, and team performance.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 8H7v8h6z"/>
                </svg>
            ),
            color: '#17a2b8'
        },
        {
            id: 10,
            category: 'collaboration',
            title: 'Team Management',
            description: 'Tools for managing teams, assigning roles, and controlling access to projects and resources.',
            icon: (
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
            ),
            color: '#e91e63'
        }
    ];

    const filteredFeatures = activeCategory === 'all'
        ? features
        : features.filter(feature => feature.category === activeCategory);

    return (
        <div className="features-page">
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
                        <Link to="/features" className="nav-item active">Features</Link>
                        <Link to="/how-it-works" className="nav-item">How It Works</Link>
                        <Link to="/earn-more" className="nav-item">Earn More</Link>
                    </div>

                    <NavDropdowns />
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">Powerful Features for Smart Hiring</h1>
                        <p className="hero-subtitle">
                            Discover how TalentFlowAI's advanced features transform your hiring process and connect you with the perfect talent.
                        </p>

                        <div className="category-tabs">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(category.id)}
                                >
                                    <span className="category-icon">{category.icon}</span>
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="container">
                    <div className="features-grid">
                        {filteredFeatures.map((feature, index) => (
                            <div key={feature.id} className="feature-card glass-card feature-popup" style={{ borderTopColor: feature.color }}>
                                <div className="feature-header">
                                    <div className="feature-icon" style={{ backgroundColor: feature.color }}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="feature-title">{feature.title}</h3>
                                </div>
                                <div className="feature-description">
                                    <p>{feature.description}</p>
                                </div>
                                <div className="feature-cta">
                                    <Link to="/features" className="feature-link">Learn More</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Detailed Features Section */}
            <section className="detailed-features">
                <div className="container">
                    <h2 className="section-title">Feature Deep Dive</h2>
                    <div className="detailed-features-grid">
                        <div className="detailed-feature glass-card">
                            <h3>AI-Powered Matching Algorithm</h3>
                            <p>Our proprietary AI algorithm analyzes multiple data points including skills, experience, ratings, project history, and even communication patterns to provide the most accurate matches possible.</p>
                            <ul>
                                <li>Multi-factor skill assessment</li>
                                <li>Experience level verification</li>
                                <li>Cultural fit analysis</li>
                                <li>Performance prediction modeling</li>
                            </ul>
                        </div>

                        <div className="detailed-feature glass-card">
                            <h3>Advanced Analytics Dashboard</h3>
                            <p>Get real-time insights into your hiring process with comprehensive analytics on time-to-hire, cost-per-hire, quality-of-hire, and diversity metrics.</p>
                            <ul>
                                <li>Hiring funnel analysis</li>
                                <li>Source effectiveness tracking</li>
                                <li>Diversity and inclusion metrics</li>
                                <li>ROI calculation tools</li>
                            </ul>
                        </div>

                        <div className="detailed-feature glass-card">
                            <h3>Automated Workflows</h3>
                            <p>Streamline your entire hiring process with automated screening, scheduling, interview coordination, and offer management workflows.</p>
                            <ul>
                                <li>Automated resume screening</li>
                                <li>Smart interview scheduling</li>
                                <li>Offer management system</li>
                                <li>Onboarding automation</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technology Stack */}
            <section className="tech-stack">
                <div className="container">
                    <h2 className="section-title">Built with Modern Technology</h2>
                    <div className="tech-grid">
                        <div className="tech-item glass-card">
                            <h4>Frontend</h4>
                            <div className="tech-icons">
                                <div className="tech-icon react">React</div>
                                <div className="tech-icon typescript">TypeScript</div>
                                <div className="tech-icon redux">Redux</div>
                            </div>
                        </div>

                        <div className="tech-item glass-card">
                            <h4>Backend</h4>
                            <div className="tech-icons">
                                <div className="tech-icon spring">Spring Boot</div>
                                <div className="tech-icon java">Java</div>
                                <div className="tech-icon mysql">MySQL</div>
                            </div>
                        </div>

                        <div className="tech-item glass-card">
                            <h4>AI/ML</h4>
                            <div className="tech-icons">
                                <div className="tech-icon python">Python</div>
                                <div className="tech-icon tensorflow">TensorFlow</div>
                                <div className="tech-icon scikit">Scikit-learn</div>
                            </div>
                        </div>

                        <div className="tech-item glass-card">
                            <h4>Infrastructure</h4>
                            <div className="tech-icons">
                                <div className="tech-icon aws">AWS</div>
                                <div className="tech-icon docker">Docker</div>
                                <div className="tech-icon kubernetes">Kubernetes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <h2>Experience the Future of Hiring</h2>
                    <p>See how our innovative features can transform your recruitment process and help you build better teams faster.</p>
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

export default FeaturesPage;