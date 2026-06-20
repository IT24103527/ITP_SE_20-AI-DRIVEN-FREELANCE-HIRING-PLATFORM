/**
 * useBackendStatus — polls /api/auth/login with a HEAD-like probe
 * to detect when the Spring Boot backend finishes starting up.
 *
 * Returns: { backendReady: boolean, checking: boolean }
 *
 * Usage: call once on login pages. While backendReady=false, disable
 * the submit button and show a "Server starting…" banner.
 */
import { useState, useEffect, useRef } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const HEALTH_URL = `${API}/actuator/health`;
const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 20; // 40 seconds max wait

export const useBackendStatus = () => {
    const [backendReady, setBackendReady] = useState(false);
    const [checking, setChecking] = useState(true);
    const attempts = useRef(0);

    useEffect(() => {
        let timer;

        const probe = async () => {
            try {
                const res = await fetch(HEALTH_URL, { method: 'GET', signal: AbortSignal.timeout(2000) });
                if (res.ok) {
                    setBackendReady(true);
                    setChecking(false);
                    return;
                }
            } catch {
                // still starting
            }

            attempts.current += 1;
            if (attempts.current >= MAX_ATTEMPTS) {
                // Give up polling — let user try manually
                setChecking(false);
                return;
            }
            timer = setTimeout(probe, POLL_INTERVAL_MS);
        };

        probe();
        return () => clearTimeout(timer);
    }, []);

    return { backendReady, checking };
};
