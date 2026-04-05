import { Link } from 'react-router-dom';
import './StaticPage.css';

const posts = [
    { title: 'How AI is Eliminating Hiring Bias in 2026', category: 'AI & Tech', date: 'Mar 18, 2026', read: '5 min read', emoji: '🤖' },
    { title: 'The Rise of the Async Freelancer Economy', category: 'Industry', date: 'Mar 10, 2026', read: '4 min read', emoji: '🌐' },
    { title: 'Building a Portfolio That Gets You Hired', category: 'Freelancers', date: 'Feb 28, 2026', read: '6 min read', emoji: '💼' },
    { title: 'Why TOTP is the New Standard for Platform Security', category: 'Security', date: 'Feb 20, 2026', read: '3 min read', emoji: '🔐' },
    { title: 'How to Write a Job Post That Attracts Top Talent', category: 'Clients', date: 'Feb 12, 2026', read: '4 min read', emoji: '📝' },
    { title: 'TalentFlowAI Reaches 50,000 Freelancers Milestone', category: 'Company News', date: 'Jan 30, 2026', read: '2 min read', emoji: '🎉' },
];

const BlogPage = () => (
    <div className="static-page">
        <nav className="static-nav">
            <Link to="/" className="static-nav-logo">TalentFlow<span>AI</span></Link>
            <Link to="/" className="static-nav-home">← Back to Home</Link>
        </nav>

        <header className="static-hero">
            <div className="static-hero-badge">Insights</div>
            <h1>The TalentFlowAI <span>Blog</span></h1>
            <p>Thoughts on AI, hiring, freelancing, and the future of work — from our team to yours.</p>
        </header>

        <section className="static-section">
            <div className="static-container">
                <div className="blog-grid">
                    {posts.map((post, i) => (
                        <div className="blog-card" key={i}>
                            <div className="blog-emoji">{post.emoji}</div>
                            <div className="blog-meta-top">
                                <span className="blog-category">{post.category}</span>
                                <span className="blog-read">{post.read}</span>
                            </div>
                            <h3>{post.title}</h3>
                            <div className="blog-date">{post.date}</div>
                            <a href="#" className="blog-read-link">Read Article →</a>
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

export default BlogPage;
