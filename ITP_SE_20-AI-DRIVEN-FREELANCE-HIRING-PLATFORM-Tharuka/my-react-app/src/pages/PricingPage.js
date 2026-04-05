import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HomePageButton from '../components/HomePageButton';
import NavDropdowns from '../components/NavDropdowns';
import './PricingPage.css';

const PricingPage = () => {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [selectedPlan, setSelectedPlan] = useState(null);

    const pricingPlans = [
        {
            id: 'starter',
            name: 'Starter',
            monthlyPrice: 0,
            yearlyPrice: 0,
            description: 'Perfect for individuals and small projects',
            features: [
                'Up to 5 job postings per month',
                'Basic AI matching algorithm',
                'Email support',
                'Standard analytics',
                '7-day data retention'
            ],
            highlighted: false,
            color: '#6c757d'
        },
        {
            id: 'professional',
            name: 'Professional',
            monthlyPrice: 49,
            yearlyPrice: 470,
            description: 'Ideal for growing businesses and teams',
            features: [
                'Unlimited job postings',
                'Advanced AI matching',
                'Priority email support',
                'Advanced analytics & insights',
                '30-day data retention',
                'Team collaboration tools',
                'Custom branding options'
            ],
            highlighted: true,
            color: '#4361ee',
            badge: 'Most Popular'
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            monthlyPrice: 199,
            yearlyPrice: 1900,
            description: 'Complete solution for large organizations',
            features: [
                'Everything in Professional',
                'Custom AI model training',
                '24/7 phone & email support',
                'White-glove onboarding',
                'Unlimited data retention',
                'Advanced security features',
                'API access & integrations',
                'Dedicated account manager',
                'SLA guarantee'
            ],
            highlighted: false,
            color: '#212529'
        }
    ];

    const handlePlanSelect = (planId) => {
        setSelectedPlan(planId === selectedPlan ? null : planId);
    };

    const getYearlySavings = (monthlyPrice, yearlyPrice) => {
        const monthlyTotal = monthlyPrice * 12;
        const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
        return Math.round(savings);
    };

    return (
        <div className="pricing-page">
            {/* HomePage Button */}
            <HomePageButton />

            {/* Dynamic Background Shapes */}
            <div className="bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
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
                        <Link to="/pricing" className="nav-item active">Pricing</Link>
                    </div>

                    <NavDropdowns />
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">Simple, Transparent Pricing</h1>
                        <p className="hero-subtitle">
                            Choose the perfect plan for your needs. No hidden fees, cancel anytime.
                        </p>

                        <div className="billing-toggle">
              <span className={`toggle-option ${billingCycle === 'monthly' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('monthly')}>
                Monthly Billing
              </span>
                            <div className="toggle-switch">
                                <input
                                    type="checkbox"
                                    id="billing-toggle"
                                    checked={billingCycle === 'yearly'}
                                    onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                                />
                                <label htmlFor="billing-toggle" className="toggle-label"></label>
                            </div>
                            <span className={`toggle-option ${billingCycle === 'yearly' ? 'active' : ''}`}
                                  onClick={() => setBillingCycle('yearly')}>
                Yearly Billing
                <span className="savings-badge">Save 20%</span>
              </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Plans */}
            <section className="pricing-plans">
                <div className="container">
                    <div className="plans-grid">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`plan-card glass-card ${plan.highlighted ? 'highlighted' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
                                onClick={() => handlePlanSelect(plan.id)}
                            >
                                {plan.badge && (
                                    <div className="plan-badge" style={{ backgroundColor: plan.color }}>
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="plan-header">
                                    <h3 className="plan-name">{plan.name}</h3>
                                    <div className="plan-price">
                                        <span className="currency">$</span>
                                        <span className="price">
                      {billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                                        <span className="period">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                                    </div>
                                    {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                                        <div className="yearly-savings">
                                            Save ${getYearlySavings(plan.monthlyPrice, plan.yearlyPrice)}%
                                        </div>
                                    )}
                                </div>

                                <div className="plan-description">
                                    <p>{plan.description}</p>
                                </div>

                                <div className="plan-features">
                                    <ul className="features-list">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="feature-item">
                                                <svg viewBox="0 0 24 24" width="16" height="16" className="feature-icon">
                                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-5.58-5.59z"/>
                                                </svg>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="plan-footer">
                                    <button
                                        className={`plan-button ${plan.highlighted ? 'primary' : 'secondary'}`}
                                        style={{ backgroundColor: plan.highlighted ? plan.color : 'transparent' }}
                                    >
                                        {selectedPlan === plan.id ? 'Selected' : 'Get Started'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="container">
                    <h2 className="section-title">Frequently Asked Questions</h2>
                    <div className="faq-list">
                        <div className="faq-item">
                            <div className="faq-question">
                                <h4>Can I change my plan later?</h4>
                                <span className="faq-toggle">+</span>
                            </div>
                            <div className="faq-answer">
                                <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.</p>
                            </div>
                        </div>

                        <div className="faq-item">
                            <div className="faq-question">
                                <h4>Is there a free trial available?</h4>
                                <span className="faq-toggle">+</span>
                            </div>
                            <div className="faq-answer">
                                <p>Yes! Our Starter plan is completely free forever. No credit card required to get started.</p>
                            </div>
                        </div>

                        <div className="faq-item">
                            <div className="faq-question">
                                <h4>What payment methods do you accept?</h4>
                                <span className="faq-toggle">+</span>
                            </div>
                            <div className="faq-answer">
                                <p>We accept all major credit cards, debit cards, PayPal, and bank transfers for Enterprise plans.</p>
                            </div>
                        </div>

                        <div className="faq-item">
                            <div className="faq-question">
                                <h4>Can I cancel my subscription anytime?</h4>
                                <span className="faq-toggle">+</span>
                            </div>
                            <div className="faq-answer">
                                <p>Absolutely! You can cancel your subscription at any time with no cancellation fees. Your access continues until the end of your billing period.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <h2>Ready to Get Started?</h2>
                    <p>Join thousands of companies already using TalentFlowAI to find their perfect talent matches.</p>
                    <div className="cta-buttons">
                        <Link to="/client-register" className="cta-btn primary">Start Free Trial</Link>
                        <Link to="/contact" className="cta-btn secondary">Contact Us</Link>
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
                                <div className="contact-item"><span>📍</span> Colombo, Sri Lanka</div>
                                <div className="contact-item"><span>📧</span> support@talentflowai.lk</div>
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

export default PricingPage;