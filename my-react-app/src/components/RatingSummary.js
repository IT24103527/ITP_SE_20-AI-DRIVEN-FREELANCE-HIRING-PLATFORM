import React from "react";

export default function RatingSummary({ reviews }) {
    const totalReviews = reviews.length;

    const avg =
        totalReviews > 0
            ? (
                reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
                totalReviews
            ).toFixed(1)
            : "0.0";

    const positive = reviews.filter((r) => r.sentiment === "positive").length;
    const neutral = reviews.filter((r) => r.sentiment === "neutral").length;
    const negative = reviews.filter((r) => r.sentiment === "negative").length;

    const ratingCounts = [5, 4, 3, 2, 1].map(
        (star) => reviews.filter((r) => Number(r.rating) === star).length
    );

    return (
        <div className="review-summary-card">
            <div className="review-summary-top">
                <div className="review-stat-box">
                    <h2>{avg}</h2>
                    <p>Average Rating</p>
                </div>

                <div className="review-stat-box">
                    <h3>{totalReviews}</h3>
                    <p>Total Reviews</p>
                </div>

                <div className="review-summary-sentiment">
                    <div className="sentiment-badge positive">Positive: {positive}</div>
                    <div className="sentiment-badge neutral">Neutral: {neutral}</div>
                    <div className="sentiment-badge negative">Negative: {negative}</div>
                </div>
            </div>

            <div className="review-rating-bars">
                {[5, 4, 3, 2, 1].map((star, index) => {
                    const count = ratingCounts[index];
                    const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                    return (
                        <div className="review-bar-row" key={star}>
                            <span>{star}★</span>
                            <div className="review-bar-track">
                                <div className="review-bar-fill" style={{ width: `${percent}%` }} />
                            </div>
                            <span>{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}