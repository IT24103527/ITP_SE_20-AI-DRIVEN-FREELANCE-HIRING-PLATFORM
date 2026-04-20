import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import './ClientProposalContractPage.css';

const ClientProposalContractPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('proposals');

    const [proposals, setProposals] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const [processingProposalId, setProcessingProposalId] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3500);
    };

    const getPdfHref = (base64) => {
        if (!base64) return '';
        return `data:application/pdf;base64,${base64}`;
    };

    const parseResponseData = async (response) => {
        const text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            return { message: text };
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [proposalRes, contractRes, notificationRes] = await Promise.all([
                apiClient('/api/applications/client'),
                apiClient('/api/contracts/my'),
                apiClient('/api/notifications/my')
            ]);

            if (!proposalRes.ok || !contractRes.ok || !notificationRes.ok) {
                throw new Error('Failed to load proposal module data');
            }

            setProposals(await proposalRes.json());
            setContracts(await contractRes.json());
            setNotifications(await notificationRes.json());
        } catch (error) {
            showMessage(error.message || 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        loadData();
    }, [navigate]);

    const pendingProposals = useMemo(
        () => (proposals || []).filter((p) => (p.status || '').toUpperCase() === 'PENDING'),
        [proposals]
    );

    const totalNotificationsCount = notifications.length;
    const unreadNotificationsCount = useMemo(
        () => (notifications || []).filter((notification) => !notification.read).length,
        [notifications]
    );

    const handleProposalDecision = async (proposalId, status) => {
        try {
            setProcessingProposalId(proposalId);
            const res = await apiClient(`/api/applications/${proposalId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            const data = await parseResponseData(res);
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update proposal');
            }

            showMessage(status === 'ACCEPTED' ? 'Proposal accepted and contract created' : 'Proposal rejected', 'success');
            await loadData();
        } catch (error) {
            showMessage(error.message || 'Failed to update proposal', 'error');
        } finally {
            setProcessingProposalId('');
        }
    };

    const markNotificationRead = async (notificationId) => {
        try {
            const res = await apiClient(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
            const data = await parseResponseData(res);
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update notification');
            }
            setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
        } catch (error) {
            showMessage(error.message || 'Failed to update notification', 'error');
        }
    };

    if (loading) {
        return <div className="module-loading">Loading proposal module...</div>;
    }

    return (
        <div className="proposal-module-page client-theme">
            <header className="module-header">
                <div>
                    <h1>Client Proposal Review & Contract Module</h1>
                    <p>Review incoming freelancer proposals and manage active contracts.</p>
                </div>
                <div className="module-header-actions">
                    <Link to="/client-dashboard" className="module-link-btn">Back to Dashboard</Link>
                    <button className="module-link-btn refresh" onClick={loadData}>Refresh</button>
                </div>
            </header>

            {message.text && <div className={`module-alert ${message.type}`}>{message.text}</div>}

            <div className="module-tabs">
                <button className={activeTab === 'proposals' ? 'active' : ''} onClick={() => setActiveTab('proposals')}>
                    Incoming Proposals ({pendingProposals.length})
                </button>
                <button className={activeTab === 'contracts' ? 'active' : ''} onClick={() => setActiveTab('contracts')}>Contracts</button>
                <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>
                    <span>Notifications</span>
                    <span className={`tab-badge ${unreadNotificationsCount > 0 ? 'has-unread' : ''}`}>{totalNotificationsCount}</span>
                </button>
            </div>

            {activeTab === 'proposals' && (
                <section className="module-section">
                    {proposals.length === 0 && <p className="empty-state">No incoming proposals yet for your posted jobs.</p>}
                    {proposals.map((proposal) => (
                        <article key={proposal.id} className="module-card">
                            <h3>{proposal.jobTitle}</h3>
                            <p className="muted">Freelancer: {proposal.freelancerName} ({proposal.freelancerEmail})</p>
                            <p className="muted">Submitted: {proposal.appliedAt ? new Date(proposal.appliedAt).toLocaleString() : 'N/A'}</p>
                            <p className="muted">Proposed Budget: ${proposal.proposedBudget !== null && proposal.proposedBudget !== undefined ? proposal.proposedBudget.toFixed(2) : 'N/A'}</p>
                            <p className="muted">Estimated Delivery: {proposal.estimatedDeliveryDays !== null && proposal.estimatedDeliveryDays !== undefined ? proposal.estimatedDeliveryDays : 'N/A'} day(s)</p>
                            {proposal.attachmentFileName && <p className="muted">Attachment: {proposal.attachmentFileName}</p>}
                            {proposal.attachmentBase64 && (
                                <p>
                                    <a href={getPdfHref(proposal.attachmentBase64)} target="_blank" rel="noreferrer" className="module-link-btn">
                                        View Attached PDF
                                    </a>
                                </p>
                            )}
                            <span className={`status-badge ${(proposal.status || 'PENDING').toLowerCase()}`}>{proposal.status || 'PENDING'}</span>
                            <p>{proposal.coverLetter}</p>

                            {(proposal.status || 'PENDING').toUpperCase() === 'PENDING' && (
                                <div className="status-actions">
                                    <button
                                        onClick={() => handleProposalDecision(proposal.id, 'ACCEPTED')}
                                        disabled={processingProposalId === proposal.id}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="reject"
                                        onClick={() => handleProposalDecision(proposal.id, 'REJECTED')}
                                        disabled={processingProposalId === proposal.id}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </article>
                    ))}
                </section>
            )}

            {activeTab === 'contracts' && (
                <section className="module-section">
                    {contracts.length === 0 && <p className="empty-state">No active contracts yet.</p>}
                    {contracts.map((contract) => (
                        <article key={contract.id} className="module-card">
                            <h3>{contract.jobTitle}</h3>
                            <p className="muted">Freelancer: {contract.freelancerName || contract.freelancerEmail}</p>
                            <p className="muted">Budget: ${contract.budget || 'N/A'}</p>
                            <span className={`status-badge ${(contract.status || 'STARTED').toLowerCase()}`}>{contract.status || 'STARTED'}</span>
                        </article>
                    ))}
                </section>
            )}

            {activeTab === 'notifications' && (
                <section className="module-section">
                    {notifications.length === 0 && <p className="empty-state">No notifications yet.</p>}
                    {notifications.map((notification) => (
                        <article key={notification.id} className={`module-card notification ${notification.read ? 'read' : 'unread'}`}>
                            <h3>{notification.title}</h3>
                            <p>{notification.message}</p>
                            <p className="muted">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</p>
                            {!notification.read && (
                                <button onClick={() => markNotificationRead(notification.id)}>Mark as Read</button>
                            )}
                        </article>
                    ))}
                </section>
            )}
        </div>
    );
};

export default ClientProposalContractPage;
