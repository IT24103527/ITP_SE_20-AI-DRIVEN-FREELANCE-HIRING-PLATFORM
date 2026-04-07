import { Link } from 'react-router-dom';
import './StaticPage.css';

const coverage = [
    { outlet: 'TechCrunch', headline: 'TalentFlowAI raises $4M to bring AI-powered hiring to Southeast Asia', date: 'Feb 2026', emoji: '📰' },
    { outlet: 'Forbes', headline: 'The 10 Most Promising AI Startups in South Asia — 2026', date: 'Jan 2026', emoji: '🏆' },
    { outlet: 'Daily FT', headline: 'Sri Lankan startup TalentFlowAI hits 50,000 user milestone', date: 'Jan 2026', emoji: '🇱🇰' },
    { outlet: 'Wired', headline: 'How TOTP and JWT are making freelance platforms safer', date: 'Dec 2025', emoji: '🔒' },
];

const PressPage = () => (
    <div className="static-page">
        <nav className="static-nav">
            <Link to="/" className="static-nav-logo">TalentFlow<span>AI</span></Link>
            <Link to="/" className="static-nav-home">← Back to Home</Link>
        </nav>

        <header className="static-hero">
            <div className="static-hero-badge">Press Room</div>
            <h1>TalentFlowAI <span>in the News</span></h1>
            <p>Media coverage, press releases, and brand assets. For press inquiries contact <a href="mailto:press@talentflowai.lk">press@talentflowai.lk</a></p>
        </header>

        <section className="static-section">
            <div className="static-container">
                <h2 className="static-section-title">Recent Coverage</h2>
                <div className="press-list">
                    {coverage.map((item, i) => (
                        <div className="press-card" key={i}>
                            <div className="press-emoji">{item.emoji}</div>
                            <div className="press-content">
                                <span className="press-outlet">{item.outlet}</span>
                                <h3>{item.headline}</h3>
                                <span className="press-date">{item.date}</span>
                            </div>
                            <a href="mailto:press@talentflowai.lk?subject=Press%20inquiry%3A%20coverage" className="press-link">Read →</a>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="static-section static-section--alt">
            <div className="static-container">
                <h2 className="static-section-title">Brand Assets</h2>
                <div className="about-grid">
                    <div className="about-card"><div className="about-icon">🎨</div><h3>Logo Pack</h3><p>SVG, PNG in light and dark variants. Download our official logo kit.</p><a href="mailto:press@talentflowai.lk?subject=Request%3A%20logo%20pack" className="static-dl-btn">Download</a></div>
                    <div className="about-card"><div className="about-icon">🖼️</div><h3>Screenshots</h3><p>High-resolution product screenshots for editorial use.</p><a href="mailto:press@talentflowai.lk?subject=Request%3A%20screenshots" className="static-dl-btn">Download</a></div>
                    <div className="about-card"><div className="about-icon">📋</div><h3>Fact Sheet</h3><p>Key stats, founding story, and executive bios in one document.</p><a href="mailto:press@talentflowai.lk?subject=Request%3A%20fact%20sheet" className="static-dl-btn">Download</a></div>
                </div>
            </div>
        </section>

        <footer className="static-footer">
            <p>© 2026 TalentFlowAI (Pvt) Ltd. All Rights Reserved.</p>
            <div className="static-footer-links">
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact Us</Link>
            </div>
        </footer>
    </div>
);

export default PressPage;
