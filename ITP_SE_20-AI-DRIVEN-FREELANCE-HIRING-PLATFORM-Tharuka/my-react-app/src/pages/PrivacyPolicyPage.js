import { Link } from 'react-router-dom';
import './StaticPage.css';

const sections = [
    { title: '1. Information We Collect', body: 'We collect information you provide directly — such as your name, email address, phone number, and professional details during registration. We also collect usage data, device information, and cookies to improve platform performance.' },
    { title: '2. How We Use Your Information', body: 'Your data is used to operate and improve TalentFlowAI, match you with relevant opportunities, send OTP verification codes, process payments, and communicate important account updates. We do not sell your personal data to third parties.' },
    { title: '3. OTP & Authentication Data', body: 'One-Time Passwords (OTPs) are generated server-side, stored in hashed form, and expire within 5 minutes. JWT tokens are signed with a secure secret and expire after 24 hours. We do not store plaintext passwords.' },
    { title: '4. Data Sharing', body: 'We share data only with service providers necessary to operate the platform (e.g., Twilio for SMS, Gmail SMTP for email). All providers are bound by data processing agreements. We may disclose data if required by law.' },
    { title: '5. Data Retention', body: 'Account data is retained for as long as your account is active. Upon account deletion, personal data is removed within 30 days. Anonymised analytics data may be retained indefinitely.' },
    { title: '6. Your Rights', body: 'You have the right to access, correct, or delete your personal data at any time through your dashboard. You may also request a data export by contacting support@talentflowai.lk.' },
    { title: '7. Cookies', body: 'We use essential cookies for authentication and session management. No third-party advertising cookies are used. You can disable cookies in your browser settings, though some features may not function correctly.' },
    { title: '8. Security', body: 'We use industry-standard encryption (HTTPS/TLS), bcrypt password hashing, JWT-based stateless authentication, and OTP verification to protect your account. Despite these measures, no system is 100% secure.' },
    { title: '9. Changes to This Policy', body: 'We may update this policy periodically. Significant changes will be communicated via email or an in-app notification. Continued use of the platform after changes constitutes acceptance.' },
    { title: '10. Contact', body: 'For privacy-related questions, contact our Data Protection Officer at privacy@talentflowai.lk or write to us at Colombo 03, Sri Lanka.' },
];

const PrivacyPolicyPage = () => (
    <div className="static-page">
        <nav className="static-nav">
            <Link to="/" className="static-nav-logo">TalentFlow<span>AI</span></Link>
            <Link to="/" className="static-nav-home">← Back to Home</Link>
        </nav>

        <header className="static-hero static-hero--compact">
            <div className="static-hero-badge">Legal</div>
            <h1>Privacy <span>Policy</span></h1>
            <p>Last updated: March 2026</p>
        </header>

        <section className="static-section">
            <div className="static-container static-container--narrow">
                <div className="legal-intro">
                    TalentFlowAI ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
                </div>
                <div className="legal-sections">
                    {sections.map((s, i) => (
                        <div className="legal-section" key={i}>
                            <h3>{s.title}</h3>
                            <p>{s.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <footer className="static-footer">
            <p>© 2026 TalentFlowAI (Pvt) Ltd. All Rights Reserved.</p>
            <div className="static-footer-links">
                <Link to="/terms">Terms of Service</Link>
                <Link to="/contact">Contact Us</Link>
            </div>
        </footer>
    </div>
);

export default PrivacyPolicyPage;
