import React, { useEffect, useState } from "react";
import { getReviews } from "../services/reviewService";
import ReviewList from "../components/ReviewList";
import RatingSummary from "../components/RatingSummary";
import "./ReviewPage.css";

export default function PublicReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [filterType, setFilterType] = useState("");
    const [loading, setLoading] = useState(false);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const params = filterType ? { reviewerType: filterType } : {};
            const data = await getReviews(params);
            setReviews(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load public reviews:", error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, [filterType]);

    return (
        <div className="review-page-shell">
            <div className="review-page-header">
                <div>
                    <p className="review-page-eyebrow">Community Reviews</p>
                    <h1>Platform Reviews & Ratings</h1>
                    <p className="review-page-subtitle">
                        Explore authentic reviews from clients and freelancers across the platform.
                    </p>
                </div>
            </div>

            <div className="review-filter-row">
                <button
                    className={filterType === "" ? "active-filter" : ""}
                    onClick={() => setFilterType("")}
                >
                    All Reviews
                </button>
                <button
                    className={filterType === "CLIENT" ? "active-filter" : ""}
                    onClick={() => setFilterType("CLIENT")}
                >
                    Client Reviews
                </button>
                <button
                    className={filterType === "FREELANCER" ? "active-filter" : ""}
                    onClick={() => setFilterType("FREELANCER")}
                >
                    Freelancer Reviews
                </button>
            </div>

            <RatingSummary reviews={reviews} />

            <div className="review-list-section">
                <div className="review-list-header">
                    <h2>Latest Community Reviews</h2>
                    <span>{reviews.length} item(s)</span>
                </div>

                {loading ? (
                    <div className="review-empty-card">Loading reviews...</div>
                ) : (
                    <ReviewList reviews={reviews} refresh={loadReviews} />
                )}
            </div>
        </div>
    );
}