const API = "http://localhost:8080/api/reviews";

export const getReviews = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API}?${query}` : API;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch reviews");
    return res.json();
};

export const addReview = async (data) => {
    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to add review");
    }

    return res.json();
};

export const updateReview = async (id, data) => {
    const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to update review");
    }

    return res.json();
};

export const deleteReview = async (id) => {
    const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete review");
};