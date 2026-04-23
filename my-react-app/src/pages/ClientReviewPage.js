import React, { useEffect, useMemo, useState } from "react";
import { getReviews } from "../services/reviewService";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import RatingSummary from "../components/RatingSummary";
import "./ReviewPage.css";

export default function ClientReviewPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);

    const reviewerName = useMemo(() => {
        return localStorage.getItem("fullName") || "";
    }, []);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const data = await getReviews({ reviewerType: "CLIENT" });
            setReviews(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load reviews:", error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, []);

    return (
        <div className="review-page-shell">
            <div className="review-page-header">
                <div>
                    <p className="review-page-eyebrow">Trust & Feedback</p>
                    <h1>Client Reviews & Ratings</h1>
                    <p className="review-page-subtitle">
                        Manage your client reviews, ratings, and sentiment insights in one professional space.
                    </p>
                </div>
            </div>

            <RatingSummary reviews={reviews} />

            <ReviewForm
                refresh={loadReviews}
                reviewerName={reviewerName}
                reviewerType="CLIENT"
                titleText="Add Client Review"
                subtitleText="Share your feedback and maintain trusted client review records."
            />

            <div className="review-list-section">
                <div className="review-list-header">
                    <h2>Your Client Reviews</h2>
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