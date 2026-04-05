import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children }) => {
    const location = useLocation();
    const [displayChildren, setDisplayChildren] = useState(children);
    const [barState, setBarState] = useState('idle'); // idle | loading | done
    const [pageVisible, setPageVisible] = useState(true);
    const prevPath = useRef(location.pathname);
    const timerRef = useRef([]);

    const clear = () => timerRef.current.forEach(clearTimeout);

    useEffect(() => {
        if (location.pathname === prevPath.current) return;
        prevPath.current = location.pathname;

        clear();

        // 1. Start bar + fade out current page
        setBarState('loading');
        setPageVisible(false);

        // 2. Swap content mid-transition
        const t1 = setTimeout(() => {
            setDisplayChildren(children);
            setPageVisible(true);
        }, 180);

        // 3. Complete bar
        const t2 = setTimeout(() => setBarState('done'), 320);

        // 4. Reset bar
        const t3 = setTimeout(() => setBarState('idle'), 620);

        timerRef.current = [t1, t2, t3];

        return () => {
            clear();
            // If the user navigates away before t1 fires, the *next* effect will handle fading.
            // But just in case we are stuck without another effect running properly, we can forcefully ensure visibility
            // synchronously or simply let the next effect cycle do its job. 
            // The REAL issue is `setDisplayChildren` never ran for the TARGET path because `clear()` nuked `t1`.
            // We MUST update `displayChildren` synchronously in cleanup if `t1` didn't fire!
            setDisplayChildren(children);
            setPageVisible(true);
        };
    }, [location.pathname, children]);

    // Keep children in sync when same route re-renders
    useEffect(() => {
        if (location.pathname === prevPath.current) {
            setDisplayChildren(children);
        }
    }, [children, location.pathname]);

    return (
        <>
            {/* Top progress bar */}
            <div className={`tf-bar tf-bar--${barState}`} />

            {/* Page content */}
            <div className={`tf-page ${pageVisible ? 'tf-page--visible' : 'tf-page--hidden'}`}>
                {displayChildren}
            </div>
        </>
    );
};

export default PageTransition;
