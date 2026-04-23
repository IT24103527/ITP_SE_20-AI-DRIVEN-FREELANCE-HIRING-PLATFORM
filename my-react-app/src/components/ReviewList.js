import React from "react";
import ReviewCard from "./ReviewCard";

export default function ReviewList({ reviews, refresh }) {
    if (!reviews.length) {
        return <div className="review-empty-card">No reviews found.</div>;
    }

    return (
        <div className="review-list">
            {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} refresh={refresh} />
            ))}
        </div>
    );
}