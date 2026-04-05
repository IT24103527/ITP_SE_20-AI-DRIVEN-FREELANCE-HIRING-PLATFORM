import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

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
                            <li><Link to="/pricing">Pricing</Link></li>
                        </ul>
                    </div>

                    {/* Enhanced Newsletter Section */}
                    <div className="footer-column newsletter-enhanced">
                        <div className="newsletter-header">
                            <h3 className="newsletter-title">
                                <span className="title-icon">📧</span>
                                Stay Updated
                            </h3>
                            <p className="newsletter-subtitle">
                                Get the latest AI insights and hiring trends delivered to your inbox
                            </p>
                        </div>

                        <form className="newsletter-form" onSubmit={handleSubscribe}>
                            <div className="input-group">
                                <input
                                    type="email"
                                    className="newsletter-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <div className="input-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path fill="currentColor" d="M20 4H4c-1.1 0-1.9.9-1.9 1.9L3 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2l.1-12.1c0-1-.9-1.9-2-1.9zm0 4.2l-8 5.2-8-5.2V18h16V8.2z"/>
                                    </svg>
                                </div>
                            </div>

                            {/* Creative Join Button - Option 1: Gradient Animated */}
                            <button
                                type="submit"
                                className={`creative-btn gradient-animated ${isSubmitting ? 'submitting' : ''} ${isSubscribed ? 'success' : ''}`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="btn-content">
                                        <div className="spinner"></div>
                                        <span>Subscribing...</span>
                                    </div>
                                ) : isSubscribed ? (
                                    <div className="btn-content">
                                        <svg className="success-icon" viewBox="0 0 24 24" width="20" height="20">
                                            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-5.58-5.59z"/>
                                        </svg>
                                        <span>Subscribed!</span>
                                    </div>
                                ) : (
                                    <div className="btn-content">
                                        <span>Join</span>
                                        <div className="btn-shine"></div>
                                    </div>
                                )}
                            </button>
                        </form>

                        <div className="newsletter-benefits">
                            <div className="benefit-item">
                                <span className="benefit-icon">✨</span>
                                <span>Weekly AI insights</span>
                            </div>
                            <div className="benefit-item">
                                <span className="benefit-icon">🎯</span>
                                <span>Exclusive hiring tips</span>
                            </div>
                            <div className="benefit-item">
                                <span className="benefit-icon">🚀</span>
                                <span>Early access to features</span>
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
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 TalentFlowAI (Pvt) Ltd. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;