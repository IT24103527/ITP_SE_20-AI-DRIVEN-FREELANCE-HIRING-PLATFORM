/* eslint-disable no-unused-vars */
import { useState } from "react";
import "./RecommendationPage.css";
import HistoryPage from "./HistoryPage.js";

// Helper: initials from name
function getInitials(name = "") {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Helper: status dot class based on match %
function getStatusDotClass(matchPercentage) {
    if (matchPercentage >= 90) return "status-dot--green";
    if (matchPercentage >= 75) return "status-dot--yellow";
    return "status-dot--red";
}

// Helper: parse skills string into array
function parseSkills(skills = "") {
    return skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

// Skeleton card shown while loading
function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-row">
                <div className="skeleton-avatar" />
                <div className="skeleton-lines">
                    <div className="skeleton-line skeleton-line--medium" />
                    <div className="skeleton-line skeleton-line--short" />
                    <div className="skeleton-line skeleton-line--long" />
                </div>
            </div>
        </div>
    );
}

function RecommendationPage({onViewHistory, onHire, onViewProfile }) {

    const [jobDescription, setJobDescription] = useState("");
    const [results, setResults] = useState([]);

    //  loading state
    const [loading, setLoading] = useState(false);

    // error state
    const [error, setError] = useState("");

    const API_URL = "http://localhost:8080/api/recommendations";

    const findFreelancers = () => {

        setError("");
        setLoading(true);

        const token = localStorage.getItem("token"); // ✅ added

        fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`   // ✅ added
            },
            body: JSON.stringify({ jobDescription: jobDescription }),
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to fetch recommendations");
                }
                return res.json();
            })
            .then((data) => {
                setResults(data);
            })
            .catch((err) => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="recommendation-page">

            {/* ── Hero Header ── */}
            <div className="recommendation-page__header">
                <h2 className="recommendation-page__title">
                    Find Top Freelancers Instantly
                </h2>
                <p className="recommendation-page__subtitle">
                    AI-powered intelligent matching for your most critical roles.
                    Build your dream team in seconds.
                </p>
            </div>

            {/* ── Search Card ── */}
            <div className="recommendation-search-card">

                <div className="recommendation-search-card__heading">
                    <div className="recommendation-search-card__heading-text">
                        <h3>Project Requirements</h3>
                        <p>Describe your project and our AI will suggest the best technical matches from our global network.</p>
                    </div>

                    {/* AI badge (top-right, purely visual) */}
                    <div className="recommendation-search-card__icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="4"/>
                        </svg>
                        AI-POWERED ANALYSIS
                    </div>
                </div>

                <textarea
                    className="recommendation-search-card__textarea"
                    rows="4"
                    placeholder="Example: I need a Senior React Developer to build a fintech dashboard with real-time data visualization using D3.js and Tailwind CSS..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                />

                <div className="recommendation-search-card__footer">

                    {/* Avatar stack + label */}
                    <div className="recommendation-search-card__powered">
                        <div className="avatar-stack">
                            <div className="avatar-stack__item avatar-stack__item--a">A</div>
                            <div className="avatar-stack__item avatar-stack__item--b">S</div>
                            <div className="avatar-stack__item avatar-stack__item--c">M</div>
                        </div>
                        <span className="powered-label">Matching against 500+ verified experts</span>
                    </div>

                    <button
                        className="recommendation-search-card__submit"
                        onClick={findFreelancers}
                        disabled={loading}
                    >
                        {/* Icon: spinner when loading, arrow when idle */}
                        {loading ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.75s linear infinite" }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                                <polyline points="12 5 19 12 12 19"/>
                            </svg>
                        )}
                        {loading ? "Finding..." : "Find Best Matches"}
                    </button>
                </div>

                {/* Error UI */}
                {error && (
                    <div className="recommendation-error">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {error}
                    </div>
                )}
            </div>

            {/* ── Loading Spinner + Skeleton ── */}
            {loading && (
                <>
                    <div className="recommendation-loading">
                        <div className="recommendation-loading__spinner" />
                        <p className="recommendation-loading__text">Matching talent to your requirements…</p>
                        <div className="recommendation-loading__dots">
                            <span className="recommendation-loading__dot" />
                            <span className="recommendation-loading__dot" />
                            <span className="recommendation-loading__dot" />
                        </div>
                    </div>

                    <div className="recommendation-skeleton">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </>
            )}

            {/* ── Results Section ── */}
            {results.length > 0 && !loading && (

                <div className="recommendation-results">

                    <div className="recommendation-results__header">
                        <div className="recommendation-results__title-group">
                            <h3 className="recommendation-results__title">Recommended Profiles</h3>
                            <span className="recommendation-results__badge">
                                {results.length} Match{results.length !== 1 ? "es" : ""}
                            </span>
                        </div>
                        <div className="recommendation-results__sort">
                            Sort by: <strong>Match % ∨</strong>
                        </div>
                    </div>

                    <ul className="result-list">
                        {results.map((r, index) => {

                            const skillList = parseSkills(r.skills);
                            const visibleSkills = skillList.slice(0, 4);
                            const extraCount = skillList.length - visibleSkills.length;

                            return (
                                <li key={index} className="result-card">

                                    {/* Large avatar */}
                                    <div className="result-card__avatar">
                                        {getInitials(r.name)}
                                    </div>

                                    {/* Middle: name, role, skills */}
                                    <div className="result-card__top">
                                        <div className="result-card__info">

                                            <div className="result-card__name-row">
                                                <p className="result-card__name">{r.name}</p>

                                                {/* Match badge + bar */}
                                                <div className="result-card__match-badge">
                                                    <span className="result-card__match-label">
                                                        {r.matchPercentage}% AI MATCH
                                                        <span className="bolt">⚡</span>
                                                    </span>
                                                    <div className="result-card__match-bar-track">
                                                        <div
                                                            className="result-card__match-bar-fill"
                                                            style={{ "--target-width": `${r.matchPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="result-card__role">{r.skills}</p>

                                            {/* Skills + status dot */}
                                            <div className="result-card__bottom">
                                                <span className={`result-card__status-dot ${getStatusDotClass(r.matchPercentage)}`} />
                                                <div className="result-card__skills">
                                                    {visibleSkills.map((skill, i) => (
                                                        <span key={i} className="result-card__skill-tag">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {extraCount > 0 && (
                                                        <span className="result-card__skill-tag result-card__skill-tag--more">
                                                            +{extraCount} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Right: action buttons */}
                                    <div className="result-card__actions">
                                        <button className="result-card__btn-hire" onClick={() => onHire && onHire(r)}>Hire Now</button>
                                        <button className="result-card__btn-view" onClick={() => onViewProfile && onViewProfile(r)}>View Profile</button>
                                    </div>

                                </li>
                            );
                        })}
                    </ul>

                    {/* Load more */}
                    <div className="recommendation-load-more">
                        <button className="recommendation-load-more__btn">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="1 4 1 10 7 10"/>
                                <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                            </svg>
                            Load More Talent
                        </button>
                    </div>
                </div>
            )}
            <div className="recommendation-history">
                <button
                    className="recommendation-history-btn"
                    onClick={onViewHistory}
                >
                    Search History
                </button>
            </div>
            <footer className="recommendation-footer">
                © 2026 FreelanceAI. Matching you with brilliance.
            </footer>

        </div>
    );
}

export default RecommendationPage;