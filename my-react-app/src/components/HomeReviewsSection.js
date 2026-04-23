import React, { useState } from "react";
import PublicReviewsPage from "../pages/PublicReviewsPage";
import "./HomeReviewsSection.css";

export default function HomeReviewsSection() {
    const [showReviews, setShowReviews] = useState(false);

    return (
        <div className="home-reviews-wrapper">
            {!showReviews ? (
                // Big Button to View Reviews
                <div className="reviews-cta-card">
                    <div className="reviews-cta-content">
                        <span className="reviews-cta-tag">⭐ Community Trust</span>
                        <h2>What Our Community Says</h2>
                        <p>
                            Read authentic reviews from clients and freelancers who use TalentFlowAI.
                            Real feedback, real experiences, real insights.
                        </p>
                        <button
                            className="view-reviews-btn"
                            onClick={() => setShowReviews(true)}
                        >
                            View All Reviews →
                        </button>
                    </div>
                </div>
            ) : (
                // Show Reviews Section
                <div className="reviews-visible-section">
                    <div className="reviews-header">
                        <button
                            className="close-reviews-btn"
                            onClick={() => setShowReviews(false)}
                        >
                            ← Back
                        </button>
                    </div>
                    <PublicReviewsPage />
                </div>
            )}
        </div>
    );
}