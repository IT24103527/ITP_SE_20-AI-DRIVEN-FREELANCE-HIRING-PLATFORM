import { useState, useCallback } from 'react';
import './Toast.css';

// Toast hook — use this in any component
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
    const error   = useCallback((msg) => addToast(msg, 'error'),   [addToast]);
    const info    = useCallback((msg) => addToast(msg, 'info'),    [addToast]);
    const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);

    return { toasts, success, error, info, warning };
};

// Toast container component
const Toast = ({ toasts }) => {
    if (!toasts.length) return null;
    return (
        <div className="toast-container" role="alert" aria-live="polite">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    <span className="toast-icon">
                        {t.type === 'success' && '✅'}
                        {t.type === 'error'   && '❌'}
                        {t.type === 'warning' && '⚠️'}
                        {t.type === 'info'    && 'ℹ️'}
                    </span>
                    <span className="toast-message">{t.message}</span>
                </div>
            ))}
        </div>
    );
};

export default Toast;
