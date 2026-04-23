import React, { useState } from "react";
import { deleteReview, updateReview } from "../services/reviewService";
import StarRating from "./StarRating";

function getTimeAgo(timestamp) {
    if (!timestamp) return "Just now";

    const now = Date.now();
    const diff = now - Number(timestamp);

    const seconds = Math.floor(diff / 1000);
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds} sec ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes === 1 ? "1 min ago" : `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;

    return new Date(timestamp).toLocaleDateString();
}

export default function ReviewCard({ review, refresh }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(review.text);
    const [rating, setRating] = useState(review.rating);
    const [error, setError] = useState("");

    const handleDelete = async () => {
        try {
            await deleteReview(review.id);
            refresh();
        } catch (err) {
            console.error(err);
            setError("Failed to delete review.");
        }
    };

    const handleUpdate = async () => {
        setError("");

        if (!text.trim() || text.trim().length < 3) {
            setError("Review must be at least 3 characters.");
            return;
        }

        if (rating < 1 || rating > 5) {
            setError("Rating must be between 1 and 5.");
            return;
        }

        try {
            await updateReview(review.id, {
                ...review,
                text: text.trim(),
                rating: Number(rating),
            });
            setEditing(false);
            refresh();
        } catch (err) {
            console.error(err);
            setError("Failed to update review.");
        }
    };

    return (
        <div className="review-card">
            <div className="review-card-top">
                <div>
                    <h3>{review.reviewerName}</h3>
                    <p className="review-meta">
                        {review.targetType === "CLIENT" ? "Client Review" : "Freelancer Review"}
                    </p>
                </div>

                <div className={`sentiment-badge ${review.sentiment}`}>
                    {review.sentiment}
                </div>
            </div>

            <StarRating rating={rating} readonly={!editing} setRating={setRating} />

            {editing ? (
                <textarea
                    rows="4"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="review-edit-textarea"
                />
            ) : (
                <p className="review-text">{review.text}</p>
            )}

            {error && <p className="review-error">{error}</p>}

            <div className="review-card-bottom">
                <small>{getTimeAgo(review.createdAt)}</small>

                <div className="review-card-actions">
                    {editing ? (
                        <>
                            <button onClick={handleUpdate}>Save</button>
                            <button className="secondary" onClick={() => setEditing(false)}>
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditing(true)}>Edit</button>
                            <button className="danger" onClick={handleDelete}>
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}