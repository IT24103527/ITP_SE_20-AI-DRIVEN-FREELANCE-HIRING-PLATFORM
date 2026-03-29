import { useState } from 'react';
import { Link } from 'react-router-dom';
import HomePageButton from '../components/HomePageButton';
import NavDropdowns from '../components/NavDropdowns';
import './EarnMorePage.css';

const tips = [
    {
        id: 1, category: 'profile',
        icon: '🎯', title: 'Optimise Your Profile Score',
        summary: 'A complete profile gets 3× more invitations from clients.',
        steps: [
            'Add a professional photo and a compelling headline',
            'Write a bio that leads with your top 3 skills and a measurable result',
            'List every relevant skill — the AI uses these for matching',
            'Set a competitive hourly rate based on market data (see Rate Guide below)',
        ],
        impact: '+3× invitations', color: '#4361ee',
    },
    {
        id: 2, category: 'profile',
        icon: '📸', title: 'Build a Portfolio That Converts',
        summary: 'Freelancers with 5+ portfolio items earn 60% more on average.',
        steps: [
            'Upload your 5 best work samples with context and results',
            'Include before/after metrics where possible (e.g. "increased conversions by 28%")',
            'Add a live URL or demo link for every project',
            'Refresh your portfolio every 3 months with recent work',
        ],
        impact: '+60% earnings', color: '#667eea',
    },
    {
        id: 3, category: 'proposals',
        icon: '✍️', title: 'Write Proposals That Win',
        summary: 'The first 2 sentences decide whether a client reads on.',
        steps: [
            'Open with the client\'s problem, not your credentials',
            'Reference a specific detail from the job post to show you read it',
            'Include one relevant portfolio link in the first paragraph',
            'End with a clear, low-friction call to action ("Can we jump on a 15-min call?")',
        ],
        impact: '2× win rate', color: '#f093fb',
    },
    {
        id: 4, category: 'pricing',
        icon: '💰', title: 'Price for Value, Not Hours',
        summary: 'Top earners charge for outcomes, not time.',
        steps: [
            'Research market rates using the Rate Guide below before setting your price',
            'Offer 3 package tiers: Basic, Standard, Premium',
            'Anchor your rate against the value delivered, not your cost',
            'Raise your rate by 10–15% every 6 months as you build reviews',
        ],
        impact: '+40% per project', color: '#43e97b',
    },
    {
        id: 5, category: 'retention',
        icon: '🔄', title: 'Turn One Project into Repeat Business',
        summary: 'Repeat clients spend 67% more than new ones.',
        steps: [
            'Deliver a brief end-of-project summary with results and next steps',
            'Proactively suggest a follow-up project or retainer',
            'Check in 30 days after delivery — most repeat work comes from this',
            'Offer a loyalty discount for clients who book 3+ projects',
        ],
        impact: '+67% lifetime value', color: '#ffc107',
    },
    {
        id: 6, category: 'skills',
        icon: '📈', title: 'Skill Up in High-Demand Areas',
        summary: 'AI, cloud, and security skills command 2–3× average rates.',
        steps: [
            'Check the Trending Skills section below for what clients are searching now',
            'Add one new in-demand skill to your profile every quarter',
            'Get certified — verified credentials increase proposal acceptance by 35%',
            'Combine a technical skill with a domain (e.g. "Python for FinTech")',
        ],
        impact: '2–3× rate premium', color: '#17a2b8',
    },
];

const rateGuide = [
    { skill: 'React / Next.js',     junior: '$25–35', mid: '$40–60', senior: '$65–90' },
    { skill: 'Python / Django',     junior: '$20–30', mid: '$35–55', senior: '$60–85' },
    { skill: 'UI/UX Design',        junior: '$20–30', mid: '$35–50', senior: '$55–80' },
    { skill: 'Data Science / ML',   junior: '$30–45', mid: '$50–70', senior: '$75–110' },
    { skill: 'Mobile (Flutter)',     junior: '$25–35', mid: '$40–60', senior: '$65–90' },
    { skill: 'DevOps / AWS',        junior: '$30–45', mid: '$50–75', senior: '$80–120' },
    { skill: 'Copywriting / SEO',   junior: '$15–25', mid: '$28–45', senior: '$50–70' },
    { skill: 'Financial Analysis',  junior: '$25–40', mid: '$45–65', senior: '$70–100' },
];

const categories = ['all', 'profile', 'proposals', 'pricing', 'retention', 'skills'];

export default function EarnMorePage() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    const filtered = activeCategory === 'all' ? tips : tips.filter(t => t.category === activeCategory);

    return (
        <div className="em-page">
            <HomePageButton />

            <div className="em-bg">
                <div className="em-shape em-shape-1"></div>
                <div className="em-shape em-shape-2"></div>
                <div className="em-shape em-shape-3"></div>
            </div>

            {/* Nav */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="logo">
                        <h2 className="logo-text">TalentFlow<span className="ai-accent">AI</span></h2>
                    </div>
                    <div className="nav-menu">
                        <Link to="/features"    className="nav-item">Features</Link>
                        <Link to="/how-it-works" className="nav-item">How It Works</Link>
                        <Link to="/earn-more"   className="nav-item active">Earn More</Link>
                    </div>
                    <NavDropdowns />
                </div>
            </nav>

            {/* Hero */}
            <section className="em-hero">
                <div className="em-badge">💰 Freelancer Growth Hub</div>
                <h1>Earn More on <span>TalentFlowAI</span></h1>
                <p>Practical tips, market rate data, and trending skills to help you land better projects and charge what you're worth.</p>
                <div className="em-hero-stats">
                    <div className="em-hero-stat"><span>+60%</span><small>avg. earnings boost with full profile</small></div>
                    <div className="em-hero-stat"><span>2×</span><small>proposal win rate with our templates</small></div>
                    <div className="em-hero-stat"><span>3×</span><small>more invitations with optimised skills</small></div>
                </div>
            </section>

            {/* Tips section */}
            <section className="em-section">
                <div className="em-container">
                    <h2 className="em-section-title">Growth Tips & Guides</h2>

                    <div className="em-filter-tabs">
                        {categories.map(c => (
                            <button
                                key={c}
                                className={`em-filter-btn${activeCategory === c ? ' active' : ''}`}
                                onClick={() => setActiveCategory(c)}
                            >
                                {c === 'all' ? '🌟 All' :
                                 c === 'profile' ? '👤 Profile' :
                                 c === 'proposals' ? '✍️ Proposals' :
                                 c === 'pricing' ? '💰 Pricing' :
                                 c === 'retention' ? '🔄 Retention' : '📈 Skills'}
                            </button>
                        ))}
                    </div>

                    <div className="em-tips-grid">
                        {filtered.map(tip => (
                            <div
                                key={tip.id}
                                className={`em-tip-card${expandedId === tip.id ? ' expanded' : ''}`}
                                style={{ '--accent': tip.color }}
                            >
                                <div className="em-tip-header" onClick={() => setExpandedId(expandedId === tip.id ? null : tip.id)}>
                                    <span className="em-tip-icon">{tip.icon}</span>
                                    <div className="em-tip-meta">
                                        <strong>{tip.title}</strong>
                                        <span>{tip.summary}</span>
                                    </div>
                                    <div className="em-tip-right">
                                        <span className="em-impact">{tip.impact}</span>
                                        <span className="em-chevron">{expandedId === tip.id ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {expandedId === tip.id && (
                                    <div className="em-tip-body">
                                        <ol className="em-tip-steps">
                                            {tip.steps.map((s, i) => (
                                                <li key={i}>{s}</li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Rate guide */}
            <section className="em-section em-section--alt">
                <div className="em-container">
                    <h2 className="em-section-title">Market Rate Guide</h2>
                    <p className="em-section-sub">Hourly rates on TalentFlowAI by skill and experience level (USD).</p>
                    <div className="em-table-wrap">
                        <table className="em-table">
                            <thead>
                                <tr>
                                    <th>Skill</th>
                                    <th>Junior (0–2 yrs)</th>
                                    <th>Mid (3–5 yrs)</th>
                                    <th>Senior (6+ yrs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rateGuide.map((r, i) => (
                                    <tr key={i}>
                                        <td className="em-skill-cell">{r.skill}</td>
                                        <td>{r.junior}</td>
                                        <td className="em-mid">{r.mid}</td>
                                        <td className="em-senior">{r.senior}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="em-table-note">* Rates are indicative averages based on platform data. Actual rates vary by project complexity and client budget.</p>
                </div>
            </section>

            {/* CTA */}
            <section className="em-cta">
                <div className="em-container">
                    <h2>Ready to Start Earning More?</h2>
                    <p>Create your freelancer profile today and let our AI match you with the right projects.</p>
                    <div className="em-cta-btns">
                        <Link to="/freelancer-register" className="em-btn em-btn--primary">Create Freelancer Profile</Link>
                        <Link to="/how-it-works"        className="em-btn em-btn--secondary">See How It Works</Link>
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
                                <div className="contact-item"><span className="contact-icon">📍</span>Colombo, Sri Lanka</div>
                                <div className="contact-item"><span className="contact-icon">📧</span>support@talentflowai.lk</div>
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
}
