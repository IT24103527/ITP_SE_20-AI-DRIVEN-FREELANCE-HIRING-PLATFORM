import { useState, useEffect } from "react";
import "./HistoryPage.css";

/* ── Helpers ── */
function getInitials(name = "") {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function truncate(text = "", maxLen = 220) {
    if (text.length <= maxLen) return { text, truncated: false };
    return { text: text.slice(0, maxLen), truncated: true };
}

/* ── Freelancer mini card ── */
function FreelancerMiniCard({ freelancer, primary, onHire }) {
    return (
        <div className={`freelancer-mini-card${primary ? " freelancer-mini-card--primary" : ""}`}>

            {/* Top: avatar + name + MATCH badge */}
            <div className="freelancer-mini-card__top">
                <div className="freelancer-mini-card__avatar">
                    {getInitials(freelancer.name)}
                </div>
                <div className="freelancer-mini-card__info">
                    <p className="freelancer-mini-card__name">{freelancer.name}</p>
                    <p className="freelancer-mini-card__role">{freelancer.skills}</p>
                </div>
                {/* Green MATCH ⚡ badge */}
                <span className="freelancer-mini-card__match">
                    MATCH ⚡
                </span>
            </div>

            {/* ACCURACY label + value row */}
            <div className="freelancer-mini-card__accuracy-row">
                <span className="freelancer-mini-card__accuracy-label">Accuracy</span>
                <span className="freelancer-mini-card__accuracy-value">{freelancer.matchPercentage}%</span>
            </div>

            {/* Animated green accuracy bar */}
            <div className="freelancer-mini-card__bar-track">
                <div
                    className="freelancer-mini-card__bar-fill"
                    style={{ "--target-width": `${freelancer.matchPercentage}%` }}
                />
            </div>

            {/* Hire Now — full width blue */}
            <button className="freelancer-mini-card__hire" onClick={() => onHire && onHire(freelancer)}>
                Hire Now
            </button>
        </div>
    );
}

/* ── Single history card ── */
function HistoryCard({ item, index, onDelete, onHire }) {
    const [expanded, setExpanded] = useState(false);
    const { text, truncated } = truncate(item.jobDescription || "");

    return (
        <div className="history-card">

            {/* Top row */}
            <div className="history-card__top">
                <div className="history-card__meta">
                    <span className="history-card__badge">
                        AI SEARCH #{item.id || String(1000 + index).padStart(4, "0")}
                    </span>
                    <h3 className="history-card__title">
                        {item.title || item.jobDescription?.slice(0, 60) + "…"}
                    </h3>
                    <div className="history-card__info-row">
                        {/* Date */}
                        <span className="history-card__info-item">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            {formatDate(item.createdAt)}
                        </span>

                        {/* Work type if available */}
                        {item.workType && (
                            <span className="history-card__info-item">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                {item.workType}
                            </span>
                        )}
                    </div>
                </div>

                {/* Delete */}
                <button
                    className="history-card__delete"
                    onClick={() => onDelete(item.id)}
                    aria-label="Delete search"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                    </svg>
                </button>
            </div>

            {/* Job description */}
            <p className="history-card__description">
                {expanded ? item.jobDescription : text}
                {truncated && !expanded && "… "}
                {truncated && (
                    <button
                        className="history-card__description-toggle"
                        onClick={() => setExpanded((v) => !v)}
                    >
                        {expanded ? "see less" : "see more"}
                    </button>
                )}
            </p>

            {/* Recommendations */}
            {item.recommendations && item.recommendations.length > 0 && (
                <>
                    <hr className="history-card__divider" />
                    <p className="history-card__rec-label">Top AI Recommendations</p>
                    <div className="history-card__freelancers">
                        {item.recommendations.map((f, i) => (
                            <FreelancerMiniCard
                                key={f.id || i}
                                freelancer={f}
                                primary={i === 0}
                                onHire={onHire}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/* ══════════════════════════════════
   MAIN PAGE
══════════════════════════════════ */
function HistoryPage({ onNewSearch, onHire, onViewDashboard }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL = "http://localhost:8080/api/recommendations/history";

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = () => {
        setLoading(true);
        setError("");
        
        const token = localStorage.getItem("token");

        fetch(API_URL, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load history");
                return res.json();
            })
            .then((data) => setHistory(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    const deleteHistory = (id) => {
        const token = localStorage.getItem("token");

        fetch(`${API_URL}/${id}`, { 
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error("Delete failed");
                setHistory((prev) => prev.filter((h) => h.id !== id));
            })
            .catch((err) => setError(err.message));
    };

    return (
        <div className="history-page">

            {/* ── Header ── */}
            <div className="history-page__header">
                <div className="history-page__header-left">
                    <h2 className="history-page__title">Recommendation History</h2>
                    <p className="history-page__subtitle">
                        Review and manage your past AI-powered talent searches.
                    </p>
                </div>
                <div className="history-page__actions">
                    <button className="history-btn-filter">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="6" x2="20" y2="6"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                            <line x1="11" y1="18" x2="13" y2="18"/>
                        </svg>
                        Filters
                    </button>
                    <button className="history-btn-new" onClick={onNewSearch}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        New AI Search
                    </button>
                    <button className="history-btn-new" onClick={onViewDashboard}>
                        Dashboard
                    </button>
                </div>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="history-loading">
                    <div className="history-loading__spinner" />
                    <p className="history-loading__text">Loading your search history…</p>
                    <div className="history-loading__dots">
                        <span className="history-loading__dot" />
                        <span className="history-loading__dot" />
                        <span className="history-loading__dot" />
                    </div>
                </div>
            )}

            {/* ── Error ── */}
            {error && !loading && (
                <div className="history-error">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                </div>
            )}

            {/* ── Empty state ── */}
            {!loading && !error && history.length === 0 && (
                <div className="history-empty">
                    <div className="history-empty__icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </div>
                    <p className="history-empty__title">No searches yet</p>
                    <p className="history-empty__subtitle">
                        Start a new AI search to find the perfect freelancer for your project.
                    </p>
                </div>
            )}

            {/* ── History cards ── */}
            {!loading && !error && history.length > 0 && (
                <div className="history-list">
                    {history.map((item, index) => (
                        <HistoryCard
                            key={item.id || index}
                            item={item}
                            index={index}
                            onDelete={deleteHistory}
                            onHire={onHire}
                        />
                    ))}
                </div>
            )}

            <footer className="history-footer">
                © 2026 FreelanceAI. Matching you with brilliance.
            </footer>
        </div>
    );
}

export default HistoryPage;