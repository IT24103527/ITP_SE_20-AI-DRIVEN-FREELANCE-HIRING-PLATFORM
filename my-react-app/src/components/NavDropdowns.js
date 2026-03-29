import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable dropdown nav-actions block used across all public pages.
 * Uses React state + mouseLeave delay to prevent the menu disappearing
 * when the mouse moves from the button to the menu items.
 */
const NavDropdowns = () => {
    const [adminOpen, setAdminOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const adminTimer = useRef(null);
    const loginTimer = useRef(null);

    const open  = (setter, timer) => { clearTimeout(timer.current); setter(true); };
    const close = (setter, timer) => { timer.current = setTimeout(() => setter(false), 300); };

    return (
        <div className="nav-actions">
            <div
                className="dropdown-wrapper"
                onMouseEnter={() => open(setAdminOpen, adminTimer)}
                onMouseLeave={() => close(setAdminOpen, adminTimer)}
            >
                <button className={`nav-btn-blue${adminOpen ? ' open' : ''}`}>Admin</button>
                <div className={`dropdown-menu${adminOpen ? ' dropdown-menu--open' : ''}`}>
                    <Link to="/admin-registration" className="dropdown-item">Registration</Link>
                    <Link to="/admin-login"        className="dropdown-item">Login</Link>
                </div>
            </div>

            <div
                className="dropdown-wrapper"
                onMouseEnter={() => open(setLoginOpen, loginTimer)}
                onMouseLeave={() => close(setLoginOpen, loginTimer)}
            >
                <button className={`nav-btn-blue${loginOpen ? ' open' : ''}`}>Log In</button>
                <div className={`dropdown-menu${loginOpen ? ' dropdown-menu--open' : ''}`}>
                    <Link to="/login"            className="dropdown-item">Client Login</Link>
                    <Link to="/freelancer-login" className="dropdown-item">Freelancer Login</Link>
                </div>
            </div>
        </div>
    );
};

export default NavDropdowns;
