import { Link } from 'react-router-dom';
import './StaticPage.css';

const jobs = [
    { title: 'Senior AI/ML Engineer', dept: 'Engineering', location: 'Colombo / Remote', type: 'Full-time' },
    { title: 'Full Stack Developer', dept: 'Engineering', location: 'Colombo / Remote', type: 'Full-time' },
    { title: 'Product Designer (UI/UX)', dept: 'Design', location: 'Remote', type: 'Full-time' },
    { title: 'Growth Marketing Manager', dept: 'Marketing', location: 'Colombo', type: 'Full-time' },
    { title: 'Customer Success Lead', dept: 'Support', location: 'Remote', type: 'Full-time' },
    { title: 'Data Analyst', dept: 'Analytics', location: 'Colombo / Remote', type: 'Contract' },
];

const CareersPage = () => (
    <div className="static-page">
        <nav className="static-nav">
            <Link to="/" className="static-nav-logo">TalentFlow<span>AI</span></Link>
            <Link to="/" className="static-nav-home">← Back to Home</Link>
        </nav>

        <header className="static-hero">
            <div className="static-hero-badge">We're Hiring</div>
            <h1>Join the Team <span>Shaping the Future of Work</span></h1>
            <p>We're a fast-growing AI company based in Sri Lanka with a global reach. Come build something that matters.</p>
        </header>

        <section className="static-section">
            <div className="static-container">
                <div className="about-grid">
                    <div className="about-card"><div className="about-icon">🚀</div><h3>Move Fast</h3><p>We ship weekly, iterate constantly, and trust our team to make decisions.</p></div>
                    <div className="about-card"><div className="about-icon">🌍</div><h3>Work Anywhere</h3><p>Most roles are remote-friendly. We care about output, not office hours.</p></div>
                    <div className="about-card"><div className="about-icon">📈</div><h3>Grow Fast</h3><p>Early team members get equity, mentorship, and room to own entire product areas.</p></div>
                </div>
            </div>
        </section>

        <section className="static-section static-section--alt">
            <div className="static-container">
                <h2 className="static-section-title">Open Positions</h2>
                <div className="jobs-list">
                    {jobs.map((job, i) => (
                        <div className="job-card" key={i}>
                            <div className="job-info">
                                <h3>{job.title}</h3>
                                <div className="job-meta">
                                    <span className="job-tag">{job.dept}</span>
                                    <span className="job-tag">{job.location}</span>
                                    <span className="job-tag job-tag--type">{job.type}</span>
                                </div>
                            </div>
                            <a href="mailto:careers@talentflowai.lk" className="job-apply-btn">Apply Now</a>
                        </div>
                    ))}
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

export default CareersPage;
