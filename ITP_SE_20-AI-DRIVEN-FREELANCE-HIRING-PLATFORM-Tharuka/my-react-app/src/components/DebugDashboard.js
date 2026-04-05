import React from 'react';
import { API_BASE_URL } from '../utils/api';
import './DebugDashboard.css';

const DebugDashboard = () => {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
                console.log('Fetched users:', data);
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const testLogin = async (email, password) => {
        try {
            console.log(`Testing login for: ${email}`);
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('Login test result:', data);
            alert(`Login test for ${email}: ${response.ok ? 'SUCCESS' : 'FAILED'} - ${data.message || 'Unknown error'}`);
        } catch (error) {
            console.error('Login test error:', error);
            alert(`Login test for ${email}: ERROR - ${error.message}`);
        }
    };

    return (
        <div className="debug-dashboard">
            <div className="debug-header">
                <h2>🔍 TalentAI Debug Dashboard</h2>
                <button onClick={fetchUsers} className="refresh-btn">
                    Refresh Users
                </button>
            </div>

            <div className="debug-section">
                <h3>📋 Registered Users</h3>
                {loading ? (
                    <div className="loading">Loading users...</div>
                ) : (
                    <div className="users-grid">
                        {users.map((user, index) => (
                            <div key={index} className="user-card">
                                <div className="user-info">
                                    <strong>{user.name || user.fullName || user.email}</strong>
                                    <span>{user.email}</span>
                                    <span className="user-role">Role: {user.role || 'Unknown'}</span>
                                </div>
                                <button
                                    onClick={() => testLogin(user.email, 'password123')}
                                    className="test-btn"
                                >
                                    Test Login
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="debug-section">
                <h3>🧪 Manual Test</h3>
                <div className="test-form">
                    <input
                        type="email"
                        placeholder="Test email"
                        id="testEmail"
                        className="test-input"
                    />
                    <input
                        type="password"
                        placeholder="Test password"
                        id="testPassword"
                        className="test-input"
                    />
                    <button
                        onClick={() => {
                            const email = document.getElementById('testEmail').value;
                            const password = document.getElementById('testPassword').value;
                            if (email && password) {
                                testLogin(email, password);
                            } else {
                                alert('Please enter both email and password');
                            }
                        }}
                        className="test-btn"
                    >
                        Test Login
                    </button>
                </div>
            </div>

            <div className="debug-section">
                <h3>🔧 API Endpoints to Test</h3>
                <div className="endpoints-list">
                    <div className="endpoint-item">
                        <code>POST /api/auth/login</code>
                        <button onClick={() => testLogin('nileeshamax@gmail.com', 'password123')}>
                            Test
                        </button>
                    </div>
                    <div className="endpoint-item">
                        <code>POST /api/auth/login/client</code>
                        <button onClick={() => testLogin('nileeshamax@gmail.com', 'password123')}>
                            Test
                        </button>
                    </div>
                    <div className="endpoint-item">
                        <code>POST /api/v1/auth/login</code>
                        <button onClick={() => testLogin('nileeshamax@gmail.com', 'password123')}>
                            Test
                        </button>
                    </div>
                </div>
            </div>

            <div className="debug-section">
                <h3>📝 Console Logs</h3>
                <div className="console-note">
                    <p>Open browser console (F12) to see detailed logs during login attempts.</p>
                </div>
            </div>
        </div>
    );
};

export default DebugDashboard;