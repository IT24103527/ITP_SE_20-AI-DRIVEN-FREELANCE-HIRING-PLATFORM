import React from 'react';
import { Link } from 'react-router-dom';
import './HomePageButton.css';

const HomePageButton = () => {
    return (
        <div className="homepage-btn-container">
            <Link to="/" className="homepage-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" className="btn-icon">
                    <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5zm-2-8H8v6H4l-2 8h3l5-5z"/>
                </svg>
                <span className="btn-text">Home</span>
            </Link>
        </div>
    );
};

export default HomePageButton;