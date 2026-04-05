import { useState } from 'react';
import { Link } from 'react-router-dom';
import './StaticPage.css';

const faqs = [
    { q: 'How does AI matching work?', a: 'Our algorithm analyses your skills, experience, project history, and preferences to score compatibility with available jobs or candidates. Matches above 85% are surfaced first.' },
    { q: 'How do I verify my identity?', a: 'During registration and sensitive actions (like password changes), we send a 6-digit OTP to your registered email and phone number. Enter it within 5 minutes to verify.' },
    { q: 'What is a JWT token and why does TalentFlowAI use it?', a: 'A JSON Web Token is a secure, stateless credential issued after login. It is stored in your browser and sent with every API request so the server can verify your identity without storing session data.' },
    { q: 'How do I change my password?', a: 'Go to your dashboard → Security tab → enter your current password and new password → click Send OTP → enter the OTP sent to your email/phone → confirm.' },
    { q: 'Can I delete my account?', a: 'Yes. Go to your dashboard → Account tab → Delete My Account. This is permanent and cannot be undone.' },
    { q: 'How do I update my freelancer portfolio?', a: 'Log in → Freelancer Dashboard → Portfolio tab. You can update your skills, portfolio URL, experience, and hourly rate at any time.' },
    { q: 'What is the admin registration code?', a: 'The admin code is provided by your organisation\'s super admin. It is required to prevent unauthorised admin account creation.' },
    { q: 'How do I contact support?', a: 'Use the Contact Us page or email support@talentflowai.lk. We respond within 24 hours on business days.' },
];

const HelpCenterPage = () => {
    const [open, setOpen] = useState(null);

    return (
        <div className="static-page">
            <nav className="static-nav">
                <Link to="/" className="static-nav-logo">TalentFlow<span>AI</span></Link>
                <Link to="/" className="static-nav-home">← Back to Home</Link>
            </nav>

            <header className="static-hero">
                <div className="static-hero-badge">Help Center</div>
                <h1>How Can We <span>Help You?</span></h1>
                <p>Find answers to the most common questions about TalentFlowAI.</p>
            </header>

            <section className="static-section">
                <div className="static-container">
                    <div className="about-grid" style={{marginBottom: '48px'}}>
                        <div className="about-card"><div className="about-icon">👤</div><h3>For Clients</h3><p>Posting jobs, managing proposals, payments, and account settings.</p></div>
                        <div className="about-card"><div className="about-icon">💼</div><h3>For Freelancers</h3><p>Portfolio setup, finding work, submitting proposals, and getting paid.</p></div>
                        <div className="about-card"><div className="about-icon">🔐</div><h3>Security & Auth</h3><p>OTP verification, JWT tokens, password changes, and account safety.</p></div>
                    </div>

                    <h2 className="static-section-title">Frequently Asked Questions</h2>
                    <div className="faq-accordion">
                        {faqs.map((item, i) => (
                            <div className={`faq-item ${open === i ? 'faq-item--open' : ''}`} key={i}>
                                <button className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
                                    <span>{item.q}</span>
                                    <span className="faq-chevron">{open === i ? '−' : '+'}</span>
                                </button>
                                {open === i && <div className="faq-answer">{item.a}</div>}
                            </div>
                        ))}
                    </div>

                    <div className="help-cta">
                        <p>Still need help?</p>
                        <Link to="/contact" className="static-cta-btn">Contact Support →</Link>
                    </div>
                </div>
            </section>

            <footer className="static-footer">
                <p>© 2026 TalentFlowAI (Pvt) Ltd. All Rights Reserved.</p>
                <div className="static-footer-links">
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms of Service</Link>
                    <Link to="/contact">Contact Us</Link>
                </div>
            </footer>
        </div>
    );
};

export default HelpCenterPage;
