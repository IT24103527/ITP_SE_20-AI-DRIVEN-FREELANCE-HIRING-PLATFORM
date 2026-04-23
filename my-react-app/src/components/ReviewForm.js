import React, { useState } from "react";
import { addReview } from "../services/reviewService";
import StarRating from "./StarRating";

export default function ReviewForm({
                                       refresh,
                                       reviewerName,
                                       reviewerType,
                                       titleText,
                                       subtitleText
                                   }) {
    const [text, setText] = useState("");
    const [rating, setRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const [textError, setTextError] = useState("");
    const [ratingError, setRatingError] = useState("");
    const [submitError, setSubmitError] = useState("");

    // Auto target values (hidden from UI)
    const targetType = reviewerType;
    const targetName = reviewerType === "CLIENT" ? "Client Review" : "Freelancer Review";

    const validate = () => {
        let valid = true;

        if (!reviewerName || !reviewerName.trim()) {
            setSubmitError("Logged-in full name not found. Please login again.");
            valid = false;
        }

        if (!text.trim()) {
            setTextError("Review text is required.");
            valid = false;
        } else if (text.trim().length < 3) {
            setTextError("Review must be at least 3 characters.");
            valid = false;
        } else if (text.trim().length > 300) {
            setTextError("Review must be less than 300 characters.");
            valid = false;
        } else {
            setTextError("");
        }

        if (rating < 1 || rating > 5) {
            setRatingError("Please select a rating between 1 and 5.");
            valid = false;
        } else {
            setRatingError("");
        }

        return valid;
    };

    const handleSubmit = async () => {
        setSubmitError("");

        if (!validate()) return;

        try {
            setSubmitting(true);

            await addReview({
                reviewerName: reviewerName.trim(),
                reviewerType,
                targetName,
                targetType,
                text: text.trim(),
                rating: Number(rating),
                createdAt: Date.now(),
            });

            setText("");
            setRating(0);
            refresh();
        } catch (error) {
            console.error("Add review failed:", error);
            setSubmitError(error.message || "Failed to add review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-form-card">
            <h2>{titleText}</h2>
            <p className="review-form-subtitle">{subtitleText}</p>

            <div className="review-grid-two">
                <div className="review-field">
                    <label>Your Name</label>
                    <input type="text" value={reviewerName} disabled />
                </div>

                <div className="review-field">
                    <label>Your Role</label>
                    <input type="text" value={reviewerType} disabled />
                </div>
            </div>

            <div className="review-field">
                <label>Review Text</label>
                <textarea
                    rows="5"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your review here..."
                />
                {textError && <p className="review-error">{textError}</p>}
            </div>

            <div className="review-field">
                <label>Rating</label>
                <StarRating rating={rating} setRating={setRating} />
                {ratingError && <p className="review-error">{ratingError}</p>}
            </div>

            <div className="review-actions">
                <button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Review"}
                </button>
            </div>

            {submitError && <p className="review-error">{submitError}</p>}
        </div>
    );
}