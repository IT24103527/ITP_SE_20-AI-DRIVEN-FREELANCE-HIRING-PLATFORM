import React from "react";

export default function StarRating({ rating, setRating, readonly = false }) {
    return (
        <div className="review-star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={star <= rating ? "review-star filled" : "review-star"}
                    onClick={() => !readonly && setRating && setRating(star)}
                >
          ★
        </span>
            ))}
        </div>
    );
}