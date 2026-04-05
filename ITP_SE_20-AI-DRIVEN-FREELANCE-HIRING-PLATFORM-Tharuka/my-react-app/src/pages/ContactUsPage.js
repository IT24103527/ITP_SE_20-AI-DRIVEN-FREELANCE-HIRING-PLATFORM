import { useState } from 'react';
import { Link } from 'react-router-dom';
import './StaticPage.css';

const ContactUsPage = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="static-page">
            <nav className="static-nav">
                <Link to="/" className="static-nav-logo">TalentFlow<span>AI</span></Link>
                <Link to="/" className="static-nav-home">← Back to Home</Link>
            </nav>

            <header className="static-hero">
                <div className="static-hero-badge">Get in Touch</div>
                <h1>We'd Love to <span>Hear From You</span></h1>
                <p>Whether you have a question, feedback, or just want to say hello — our team is here.</p>
            </header>

            <section className="static-section">
                <div className="static-container">
                    <div className="contact-layout">
                        <div className="contact-info-col">
                            <h2>Contact Information</h2>
                            <div className="contact-items">
                                <div className="contact-item-row"><span className="ci-icon">📍</span><div><strong>Address</strong><p>Colombo 03, Sri Lanka</p></div></div>
                                <div className="contact-item-row"><span className="ci-icon">📧</span><div><strong>Email</strong><p>support@talentflowai.lk</p></div></div>
                                <div className="contact-item-row"><span className="ci-icon">📞</span><div><strong>Phone</strong><p>+94 11 234 5678</p></div></div>
                                <div className="contact-item-row"><span className="ci-icon">🕐</span><div><strong>Hours</strong><p>Mon–Fri, 9am–6pm IST</p></div></div>
                            </div>
                            <div className="contact-links-row">
                                <Link to="/help-center">Help Center</Link>
                                <Link to="/privacy">Privacy Policy</Link>
                                <Link to="/terms">Terms of Service</Link>
                            </div>
                        </div>

                        <div className="contact-form-col">
                            {sent ? (
                                <div className="contact-success">
                                    <div className="contact-success-icon">✅</div>
                                    <h3>Message Sent!</h3>
                                    <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
                                    <button onClick={() => setSent(false)} className="static-cta-btn">Send Another</button>
                                </div>
                            ) : (
                                <form className="contact-form" onSubmit={handleSubmit}>
                                    <div className="cf-row">
                                        <div className="cf-group">
                                            <label>Full Name</label>
                                            <input required placeholder="Your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                                        </div>
                                        <div className="cf-group">
                                            <label>Email Address</label>
                                            <input type="email" required placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="cf-group">
                                        <label>Subject</label>
                                        <input required placeholder="How can we help?" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
                                    </div>
                                    <div className="cf-group">
                                        <label>Message</label>
                                        <textarea required rows={5} placeholder="Tell us more..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
                                    </div>
                                    <button type="submit" className="static-cta-btn">Send Message →</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <footer className="static-footer">
                <p>© 2026 TalentFlowAI (Pvt) Ltd. All Rights Reserved.</p>
                <div className="static-footer-links">
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms of Service</Link>
                </div>
            </footer>
        </div>
    );
};

export default ContactUsPage;
