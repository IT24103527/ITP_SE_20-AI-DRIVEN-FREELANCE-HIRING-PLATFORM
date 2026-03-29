import { Link } from 'react-router-dom';
import './StaticPage.css';

const sections = [
    { title: '1. Acceptance of Terms', body: 'By creating an account or using TalentFlowAI, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.' },
    { title: '2. Eligibility', body: 'You must be at least 18 years old to use TalentFlowAI. By registering, you confirm that all information you provide is accurate and that you have the legal capacity to enter into this agreement.' },
    { title: '3. Account Roles', body: 'TalentFlowAI has three account types: Client, Freelancer, and Admin. Each role has specific permissions enforced by our Role-Based Access Control (RBAC) system. You may not misrepresent your role.' },
    { title: '4. User Conduct', body: 'You agree not to use the platform for any unlawful purpose, to harass other users, to post false information, to attempt to bypass security measures, or to reverse-engineer any part of the platform.' },
    { title: '5. Intellectual Property', body: 'All platform content, branding, and code is the property of TalentFlowAI (Pvt) Ltd. You retain ownership of content you create, but grant us a licence to display it on the platform.' },
    { title: '6. Payments & Fees', body: 'TalentFlowAI may charge service fees on transactions. All fees are displayed before confirmation. Payments are processed securely and are subject to our refund policy.' },
    { title: '7. Termination', body: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or harm other users. You may delete your account at any time from your dashboard.' },
    { title: '8. Disclaimers', body: 'TalentFlowAI is provided "as is". We do not guarantee uninterrupted service, the accuracy of AI match scores, or the quality of work delivered by freelancers. Use the platform at your own risk.' },
    { title: '9. Limitation of Liability', body: 'To the maximum extent permitted by law, TalentFlowAI shall not be liable for indirect, incidental, or consequential damages arising from your use of the platform.' },
    { title: '10. Governing Law', body: 'These terms are governed by the laws of Sri Lanka. Any disputes shall be resolved in the courts of Colombo, Sri Lanka.' },
    { title: '11. Changes to Terms', body: 'We may update these terms at any time. Continued use of the platform after changes constitutes acceptance. We will notify you of material changes via email.' },
    { title: '12. Contact', body: 'For questions about these terms, contact legal@talentflowai.lk or write to us at Colombo 03, Sri Lanka.' },
];

const TermsOfServicePage = () => (
    <div className="static-page">
        <nav className="static-nav">
            <Link to="/" className="static-nav-logo">TalentFlow<span>AI</span></Link>
            <Link to="/" className="static-nav-home">← Back to Home</Link>
        </nav>

        <header className="static-hero static-hero--compact">
            <div className="static-hero-badge">Legal</div>
            <h1>Terms of <span>Service</span></h1>
            <p>Last updated: March 2026</p>
        </header>

        <section className="static-section">
            <div className="static-container static-container--narrow">
                <div className="legal-intro">
                    Please read these Terms of Service carefully before using TalentFlowAI. These terms govern your access to and use of our platform, services, and APIs.
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
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/contact">Contact Us</Link>
            </div>
        </footer>
    </div>
);

export default TermsOfServicePage;
