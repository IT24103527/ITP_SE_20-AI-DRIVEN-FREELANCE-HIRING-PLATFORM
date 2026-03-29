import './PasswordStrength.css';

const getStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Weak',   color: '#ef4444' };
    if (score <= 2) return { score, label: 'Fair',   color: '#f59e0b' };
    if (score <= 3) return { score, label: 'Good',   color: '#3b82f6' };
    return              { score, label: 'Strong', color: '#10b981' };
};

const PasswordStrength = ({ password }) => {
    if (!password) return null;
    const { score, label, color } = getStrength(password);

    return (
        <div className="pw-strength">
            <div className="pw-bars">
                {[1,2,3,4].map(i => (
                    <div
                        key={i}
                        className="pw-bar"
                        style={{ background: i <= score ? color : 'rgba(255,255,255,0.1)' }}
                    />
                ))}
            </div>
            <span className="pw-label" style={{ color }}>{label}</span>
        </div>
    );
};

export default PasswordStrength;
