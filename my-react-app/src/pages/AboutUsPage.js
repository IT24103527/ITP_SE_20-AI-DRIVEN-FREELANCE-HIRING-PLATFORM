import { Link } from 'react-router-dom';
import './StaticPage.css';

const AboutUsPage = () => (
    <div className="static-page">
        <nav className="static-nav">
            <Link to="/" className="static-nav-logo">TalentFlow<span>AI</span></Link>
            <Link to="/" className="static-nav-home">← Back to Home</Link>
        </nav>

        <header className="static-hero">
            <div className="static-hero-badge">Our Story</div>
            <h1>Built to Redefine <span>How Talent Meets Opportunity</span></h1>
            <p>TalentFlowAI was founded with a single belief — that the right person for every job already exists. Finding them just needed to be smarter.</p>
        </header>

        <section className="static-section">
            <div className="static-container">
                <div className="about-grid">
                    <div className="about-card">
                        <div className="about-icon">🎯</div>
                        <h3>Our Mission</h3>
                        <p>To eliminate friction in the hiring process by using AI to create perfect matches between clients and freelancers — faster, fairer, and more accurately than any traditional method.</p>
                    </div>
                    <div className="about-card">
                        <div className="about-icon">👁️</div>
                        <h3>Our Vision</h3>
                        <p>A world where every skilled professional finds meaningful work and every business finds the exact talent they need — regardless of geography or network.</p>
                    </div>
                    <div className="about-card">
                        <div className="about-icon">💎</div>
                        <h3>Our Values</h3>
                        <p>Transparency, meritocracy, and security. We believe talent should speak for itself, and our platform is built to let it do exactly that.</p>
                    </div>
                </div>
            </div>
        </section>

        <section className="static-section static-section--alt">
            <div className="static-container">
                <h2 className="static-section-title">The Numbers Behind Us</h2>
                <div className="stats-grid">
                    <div className="stat-card"><span className="stat-num">50K+</span><span className="stat-lbl">Freelancers</span></div>
                    <div className="stat-card"><span className="stat-num">12K+</span><span className="stat-lbl">Clients</span></div>
                    <div className="stat-card"><span className="stat-num">95%</span><span className="stat-lbl">Match Accuracy</span></div>
                    <div className="stat-card"><span className="stat-num">40+</span><span className="stat-lbl">Countries</span></div>
                </div>
            </div>
        </section>

        <section className="static-section">
            <div className="static-container">
                <h2 className="static-section-title">Leadership Team</h2>
                <div className="team-grid">
                    {[
                        { name: 'Ashan Perera', role: 'CEO & Co-Founder', emoji: '👨‍💼' },
                        { name: 'Nimasha Silva', role: 'CTO & Co-Founder', emoji: '👩‍💻' },
                        { name: 'Ravindu Fernando', role: 'Head of AI', emoji: '🧠' },
                        { name: 'Dilini Jayawardena', role: 'Head of Product', emoji: '🎨' },
                    ].map((m, i) => (
                        <div className="team-card" key={i}>
                            <div className="team-avatar">{m.emoji}</div>
                            <h4>{m.name}</h4>
                            <p>{m.role}</p>
                        </div>
                    ))}
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

export default AboutUsPage;
