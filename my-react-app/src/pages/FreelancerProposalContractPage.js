import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import './FreelancerProposalContractPage.css';

const FreelancerProposalContractPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('jobs');

    const [jobs, setJobs] = useState([]);
    const [myProposals, setMyProposals] = useState([]);
    const [myContracts, setMyContracts] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const [proposalForms, setProposalForms] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [touchedFields, setTouchedFields] = useState({});
    const [submittingJobId, setSubmittingJobId] = useState('');
    const [updatingContractId, setUpdatingContractId] = useState('');
    const [editingProposalId, setEditingProposalId] = useState('');
    const [deletingProposalId, setDeletingProposalId] = useState('');
    const [editingProposalData, setEditingProposalData] = useState({});

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3500);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [jobsRes, proposalsRes, contractsRes, notificationsRes] = await Promise.all([
                apiClient('/api/jobs'),
                apiClient('/api/applications/my'),
                apiClient('/api/contracts/my'),
                apiClient('/api/notifications/my')
            ]);

            if (!jobsRes.ok || !proposalsRes.ok || !contractsRes.ok || !notificationsRes.ok) {
                throw new Error('Failed to load module data');
            }

            setJobs(await jobsRes.json());
            setMyProposals(await proposalsRes.json());
            setMyContracts(await contractsRes.json());
            setNotifications(await notificationsRes.json());
        } catch (error) {
            showMessage(error.message || 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/freelancer-login');
            return;
        }
        loadData();
    }, [navigate]);

    const proposalJobIds = useMemo(
        () => new Set((myProposals || []).map((proposal) => proposal.jobId)),
        [myProposals]
    );

    const totalNotificationsCount = notifications.length;
    const unreadNotificationsCount = useMemo(
        () => (notifications || []).filter((notification) => !notification.read).length,
        [notifications]
    );

    const readFileAsBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = String(reader.result || '');
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const updateProposalForm = (jobId, patch) => {
        setProposalForms((prev) => ({
            ...prev,
            [jobId]: {
                proposedBudget: '',
                estimatedDeliveryDays: '',
                coverLetter: '',
                attachmentFileName: '',
                attachmentContentType: '',
                attachmentBase64: '',
                ...(prev[jobId] || {}),
                ...patch
            }
        }));
        Object.keys(patch).forEach((fieldName) => {
            if ((touchedFields[jobId] || {})[fieldName]) {
                validateSingleField(jobId, fieldName, {
                    ...(proposalForms[jobId] || {}),
                    ...patch
                });
            }
        });
    };

    const setFieldError = (jobId, fieldName, message) => {
        setFormErrors((prev) => ({
            ...prev,
            [jobId]: {
                ...(prev[jobId] || {}),
                [fieldName]: message
            }
        }));
    };

    const validateSingleField = (jobId, fieldName, formData) => {
        const form = formData || proposalForms[jobId] || {};
        if (fieldName === 'proposedBudget') {
            const budgetRaw = form.proposedBudget;
            const proposedBudget = Number(budgetRaw);
            if (!budgetRaw) return setFieldError(jobId, fieldName, 'Budget is required');
            if (!Number.isFinite(proposedBudget)) return setFieldError(jobId, fieldName, 'Budget must be a valid number');
            if (proposedBudget <= 0) return setFieldError(jobId, fieldName, 'Budget must be greater than 0');
            return setFieldError(jobId, fieldName, '');
        }

        if (fieldName === 'estimatedDeliveryDays') {
            const deliveryRaw = form.estimatedDeliveryDays;
            const estimatedDeliveryDays = Number(deliveryRaw);
            if (!deliveryRaw) return setFieldError(jobId, fieldName, 'Estimated delivery time is required');
            if (!Number.isInteger(estimatedDeliveryDays)) return setFieldError(jobId, fieldName, 'Delivery time must be a whole number of days');
            if (estimatedDeliveryDays <= 0) return setFieldError(jobId, fieldName, 'Delivery time must be greater than 0');
            return setFieldError(jobId, fieldName, '');
        }

        if (fieldName === 'coverLetter') {
            const coverLetter = (form.coverLetter || '').trim();
            if (!coverLetter) return setFieldError(jobId, fieldName, 'Cover letter is required');
            if (coverLetter.length < 20) return setFieldError(jobId, fieldName, 'Cover letter must be at least 20 characters');
            if (coverLetter.length > 5000) return setFieldError(jobId, fieldName, 'Cover letter cannot exceed 5000 characters');
            return setFieldError(jobId, fieldName, '');
        }

        if (fieldName === 'attachmentBase64') {
            if (!form.attachmentBase64) return setFieldError(jobId, fieldName, 'PDF attachment is required');
            return setFieldError(jobId, fieldName, '');
        }
    };

    const handleFieldBlur = (jobId, fieldName) => {
        setTouchedFields((prev) => ({
            ...prev,
            [jobId]: {
                ...(prev[jobId] || {}),
                [fieldName]: true
            }
        }));
        validateSingleField(jobId, fieldName);
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

    const handleFileChange = async (jobId, file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            showMessage('Please attach a PDF file only', 'error');
            setFieldError(jobId, 'attachmentBase64', 'Please attach a PDF file only');
            return;
        }
        if (file.size === 0) {
            showMessage('Attached PDF cannot be empty', 'error');
            setFieldError(jobId, 'attachmentBase64', 'Attached PDF cannot be empty');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Attached PDF must be 5MB or less', 'error');
            setFieldError(jobId, 'attachmentBase64', 'Attached PDF must be 5MB or less');
            return;
        }

        try {
            const attachmentBase64 = await readFileAsBase64(file);
            updateProposalForm(jobId, {
                attachmentFileName: file.name,
                attachmentContentType: file.type,
                attachmentBase64
            });
            setFieldError(jobId, 'attachmentBase64', '');
        } catch (error) {
            showMessage('Failed to read PDF file', 'error');
            setFieldError(jobId, 'attachmentBase64', 'Failed to read PDF file');
        }
    };

    const validateProposalForm = (jobId) => {
        const form = proposalForms[jobId] || {};
        const errors = {
            proposedBudget: '',
            estimatedDeliveryDays: '',
            coverLetter: '',
            attachmentBase64: ''
        };

        const proposedBudget = Number(form.proposedBudget);
        const estimatedDeliveryDays = Number(form.estimatedDeliveryDays);
        const coverLetter = (form.coverLetter || '').trim();

        if (!form.proposedBudget) {
            errors.proposedBudget = 'Budget is required';
        } else if (!Number.isFinite(proposedBudget)) {
            errors.proposedBudget = 'Budget must be a valid number';
        } else if (proposedBudget <= 0) {
            errors.proposedBudget = 'Budget must be greater than 0';
        }

        if (!form.estimatedDeliveryDays) {
            errors.estimatedDeliveryDays = 'Estimated delivery time is required';
        } else if (!Number.isInteger(estimatedDeliveryDays)) {
            errors.estimatedDeliveryDays = 'Delivery time must be a whole number of days';
        } else if (estimatedDeliveryDays <= 0) {
            errors.estimatedDeliveryDays = 'Delivery time must be greater than 0';
        }

        if (!coverLetter) {
            errors.coverLetter = 'Cover letter is required';
        } else if (coverLetter.length < 20) {
            errors.coverLetter = 'Cover letter must be at least 20 characters';
        } else if (coverLetter.length > 5000) {
            errors.coverLetter = 'Cover letter cannot exceed 5000 characters';
        }

        if (!form.attachmentBase64) {
            errors.attachmentBase64 = 'PDF attachment is required';
        }

        setFormErrors((prev) => ({ ...prev, [jobId]: errors }));
        return Object.values(errors).every((msg) => !msg);
    };

    const handleSubmitProposal = async (jobId) => {
        const form = proposalForms[jobId] || {};
        const proposedBudget = Number(form.proposedBudget);
        const estimatedDeliveryDays = Number(form.estimatedDeliveryDays);
        const coverLetter = (form.coverLetter || '').trim();

        if (!validateProposalForm(jobId)) {
            showMessage('Please fix the validation errors in the form', 'error');
            return;
        }

        try {
            setSubmittingJobId(jobId);
            const res = await apiClient('/api/applications', {
                method: 'POST',
                body: JSON.stringify({
                    jobId,
                    proposedBudget,
                    estimatedDeliveryDays,
                    coverLetter,
                    attachmentFileName: form.attachmentFileName,
                    attachmentContentType: form.attachmentContentType,
                    attachmentBase64: form.attachmentBase64
                })
            });

            const data = await parseResponseData(res);
            if (!res.ok) {
                if (data.errors && typeof data.errors === 'object') {
                    setFormErrors((prev) => ({
                        ...prev,
                        [jobId]: {
                            proposedBudget: data.errors.proposedBudget || '',
                            estimatedDeliveryDays: data.errors.estimatedDeliveryDays || '',
                            coverLetter: data.errors.coverLetter || '',
                            attachmentBase64: data.errors.attachmentBase64 || data.errors.attachmentFileName || ''
                        }
                    }));
                }
                throw new Error(data.message || 'Proposal submission failed');
            }

            setProposalForms((prev) => ({
                ...prev,
                [jobId]: {
                    proposedBudget: '',
                    estimatedDeliveryDays: '',
                    coverLetter: '',
                    attachmentFileName: '',
                    attachmentContentType: '',
                    attachmentBase64: ''
                }
            }));
            showMessage('Proposal submitted successfully', 'success');
            await loadData();
            setActiveTab('proposals');
        } catch (error) {
            showMessage(error.message || 'Proposal submission failed', 'error');
        } finally {
            setSubmittingJobId('');
        }
    };

    const startEditingProposal = (proposal) => {
        setEditingProposalId(proposal.id);
        setEditingProposalData({
            proposedBudget: proposal.proposedBudget,
            estimatedDeliveryDays: proposal.estimatedDeliveryDays,
            coverLetter: proposal.coverLetter,
            attachmentFileName: proposal.attachmentFileName,
            attachmentContentType: proposal.attachmentContentType,
            attachmentBase64: proposal.attachmentBase64
        });
        setFormErrors((prev) => ({
            ...prev,
            [proposal.id]: {}
        }));
        setTouchedFields((prev) => ({
            ...prev,
            [proposal.id]: {}
        }));
    };

    const handleEditProposalChange = (proposalId, field, value) => {
        setEditingProposalData((prev) => ({
            ...prev,
            [field]: value
        }));
        if ((touchedFields[proposalId] || {})[field]) {
            validateEditField(proposalId, field, {
                ...editingProposalData,
                [field]: value
            });
        }
    };

    const handleEditFileChange = async (proposalId, file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            showMessage('Please attach a PDF file only', 'error');
            setFieldError(proposalId, 'attachmentBase64', 'Please attach a PDF file only');
            return;
        }
        if (file.size === 0) {
            showMessage('Attached PDF cannot be empty', 'error');
            setFieldError(proposalId, 'attachmentBase64', 'Attached PDF cannot be empty');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Attached PDF must be 5MB or less', 'error');
            setFieldError(proposalId, 'attachmentBase64', 'Attached PDF must be 5MB or less');
            return;
        }

        try {
            const attachmentBase64 = await readFileAsBase64(file);
            setEditingProposalData((prev) => ({
                ...prev,
                attachmentFileName: file.name,
                attachmentContentType: file.type,
                attachmentBase64
            }));
            setFieldError(proposalId, 'attachmentBase64', '');
        } catch (error) {
            showMessage('Failed to read PDF file', 'error');
            setFieldError(proposalId, 'attachmentBase64', 'Failed to read PDF file');
        }
    };

    const validateEditField = (proposalId, fieldName, formData) => {
        const form = formData || editingProposalData || {};
        if (fieldName === 'proposedBudget') {
            const budgetRaw = form.proposedBudget;
            const proposedBudget = Number(budgetRaw);
            if (!budgetRaw) return setFieldError(proposalId, fieldName, 'Budget is required');
            if (!Number.isFinite(proposedBudget)) return setFieldError(proposalId, fieldName, 'Budget must be a valid number');
            if (proposedBudget <= 0) return setFieldError(proposalId, fieldName, 'Budget must be greater than 0');
            return setFieldError(proposalId, fieldName, '');
        }

        if (fieldName === 'estimatedDeliveryDays') {
            const deliveryRaw = form.estimatedDeliveryDays;
            const estimatedDeliveryDays = Number(deliveryRaw);
            if (!deliveryRaw) return setFieldError(proposalId, fieldName, 'Estimated delivery time is required');
            if (!Number.isInteger(estimatedDeliveryDays)) return setFieldError(proposalId, fieldName, 'Delivery time must be a whole number of days');
            if (estimatedDeliveryDays <= 0) return setFieldError(proposalId, fieldName, 'Delivery time must be greater than 0');
            return setFieldError(proposalId, fieldName, '');
        }

        if (fieldName === 'coverLetter') {
            const coverLetter = (form.coverLetter || '').trim();
            if (!coverLetter) return setFieldError(proposalId, fieldName, 'Cover letter is required');
            if (coverLetter.length < 20) return setFieldError(proposalId, fieldName, 'Cover letter must be at least 20 characters');
            if (coverLetter.length > 5000) return setFieldError(proposalId, fieldName, 'Cover letter cannot exceed 5000 characters');
            return setFieldError(proposalId, fieldName, '');
        }

        if (fieldName === 'attachmentBase64') {
            if (!form.attachmentBase64) return setFieldError(proposalId, fieldName, 'PDF attachment is required');
            return setFieldError(proposalId, fieldName, '');
        }
    };

    const handleEditFieldBlur = (proposalId, fieldName) => {
        setTouchedFields((prev) => ({
            ...prev,
            [proposalId]: {
                ...(prev[proposalId] || {}),
                [fieldName]: true
            }
        }));
        validateEditField(proposalId, fieldName);
    };

    const validateEditForm = (proposalId) => {
        const form = editingProposalData || {};
        const errors = {
            proposedBudget: '',
            estimatedDeliveryDays: '',
            coverLetter: '',
            attachmentBase64: ''
        };

        const proposedBudget = Number(form.proposedBudget);
        const estimatedDeliveryDays = Number(form.estimatedDeliveryDays);
        const coverLetter = (form.coverLetter || '').trim();

        if (!form.proposedBudget) {
            errors.proposedBudget = 'Budget is required';
        } else if (!Number.isFinite(proposedBudget)) {
            errors.proposedBudget = 'Budget must be a valid number';
        } else if (proposedBudget <= 0) {
            errors.proposedBudget = 'Budget must be greater than 0';
        }

        if (!form.estimatedDeliveryDays) {
            errors.estimatedDeliveryDays = 'Estimated delivery time is required';
        } else if (!Number.isInteger(estimatedDeliveryDays)) {
            errors.estimatedDeliveryDays = 'Delivery time must be a whole number of days';
        } else if (estimatedDeliveryDays <= 0) {
            errors.estimatedDeliveryDays = 'Delivery time must be greater than 0';
        }

        if (!coverLetter) {
            errors.coverLetter = 'Cover letter is required';
        } else if (coverLetter.length < 20) {
            errors.coverLetter = 'Cover letter must be at least 20 characters';
        } else if (coverLetter.length > 5000) {
            errors.coverLetter = 'Cover letter cannot exceed 5000 characters';
        }

        if (!form.attachmentBase64) {
            errors.attachmentBase64 = 'PDF attachment is required';
        }

        setFormErrors((prev) => ({ ...prev, [proposalId]: errors }));
        return Object.values(errors).every((msg) => !msg);
    };

    const handleSaveEditProposal = async (proposalId) => {
        if (!validateEditForm(proposalId)) {
            showMessage('Please fix the validation errors in the form', 'error');
            return;
        }

        try {
            setSubmittingJobId(proposalId);
            const res = await apiClient(`/api/applications/${proposalId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    jobId: '', // Not needed for update
                    proposedBudget: Number(editingProposalData.proposedBudget),
                    estimatedDeliveryDays: Number(editingProposalData.estimatedDeliveryDays),
                    coverLetter: editingProposalData.coverLetter.trim(),
                    attachmentFileName: editingProposalData.attachmentFileName,
                    attachmentContentType: editingProposalData.attachmentContentType,
                    attachmentBase64: editingProposalData.attachmentBase64
                })
            });

            const data = await parseResponseData(res);
            if (!res.ok) {
                throw new Error(data.message || 'Proposal update failed');
            }

            showMessage('Proposal updated successfully', 'success');
            setEditingProposalId('');
            setEditingProposalData({});
            await loadData();
        } catch (error) {
            showMessage(error.message || 'Proposal update failed', 'error');
        } finally {
            setSubmittingJobId('');
        }
    };

    const handleDeleteProposal = async (proposalId) => {
        if (!window.confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingProposalId(proposalId);
            const res = await apiClient(`/api/applications/${proposalId}`, {
                method: 'DELETE'
            });

            const data = await parseResponseData(res);
            if (!res.ok) {
                throw new Error(data.message || `Proposal deletion failed (HTTP ${res.status})`);
            }

            showMessage('Proposal deleted successfully', 'success');
            setMyProposals((prev) => prev.filter((proposal) => proposal.id !== proposalId));
            setActiveTab('proposals');
            navigate('/freelancer-dashboard');
        } catch (error) {
            showMessage(error.message || 'Proposal deletion failed', 'error');
        } finally {
            setDeletingProposalId('');
        }
    };

    const handleContractStatusUpdate = async (contractId, status) => {
        try {
            setUpdatingContractId(contractId);
            const res = await apiClient(`/api/contracts/${contractId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            const data = await parseResponseData(res);
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update contract status');
            }
            showMessage('Contract status updated', 'success');
            await loadData();
        } catch (error) {
            showMessage(error.message || 'Failed to update contract status', 'error');
        } finally {
            setUpdatingContractId('');
        }
    };

    const markNotificationRead = async (notificationId) => {
        try {
            const res = await apiClient(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
            const data = await parseResponseData(res);
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update notification');
            }
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n))
            );
        } catch (error) {
            showMessage(error.message || 'Failed to update notification', 'error');
        }
    };

    if (loading) {
        return <div className="module-loading">Loading proposal module...</div>;
    }

    return (
        <div className="proposal-module-page">
            <header className="module-header">
                <div>
                    <h1>Freelancer Proposal & Contract Module</h1>
                    <p>Submit proposals, track approvals, and update contract progress.</p>
                </div>
                <div className="module-header-actions">
                    <Link to="/freelancer-dashboard" className="module-link-btn">Back to Dashboard</Link>
                    <button className="module-link-btn refresh" onClick={loadData}>Refresh</button>
                </div>
            </header>

            {message.text && <div className={`module-alert ${message.type}`}>{message.text}</div>}

            <div className="module-tabs">
                <button className={activeTab === 'jobs' ? 'active' : ''} onClick={() => setActiveTab('jobs')}>Available Jobs</button>
                <button className={activeTab === 'proposals' ? 'active' : ''} onClick={() => setActiveTab('proposals')}>My Proposals</button>
                <button className={activeTab === 'contracts' ? 'active' : ''} onClick={() => setActiveTab('contracts')}>My Contracts</button>
                <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>
                    <span>Notifications</span>
                    <span className={`tab-badge ${unreadNotificationsCount > 0 ? 'has-unread' : ''}`}>{totalNotificationsCount}</span>
                </button>
            </div>

            {activeTab === 'jobs' && (
                <section className="module-section">
                    {jobs.length === 0 && <p className="empty-state">No active jobs available right now.</p>}
                    {jobs.map((job) => (
                        <article key={job.id} className="module-card">
                            <h3>{job.title}</h3>
                            <p className="muted">Budget: ${job.budget || 'N/A'} | Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</p>
                            <p>{job.description}</p>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={(proposalForms[job.id] || {}).proposedBudget || ''}
                                onChange={(e) => updateProposalForm(job.id, { proposedBudget: e.target.value })}
                                onBlur={() => handleFieldBlur(job.id, 'proposedBudget')}
                                placeholder="Your Budget (required)"
                            />
                            {(formErrors[job.id] || {}).proposedBudget && (
                                <p className="field-error">{(formErrors[job.id] || {}).proposedBudget}</p>
                            )}
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={(proposalForms[job.id] || {}).estimatedDeliveryDays || ''}
                                onChange={(e) => updateProposalForm(job.id, { estimatedDeliveryDays: e.target.value })}
                                onBlur={() => handleFieldBlur(job.id, 'estimatedDeliveryDays')}
                                placeholder="Estimated Delivery Time in Days (required)"
                            />
                            {(formErrors[job.id] || {}).estimatedDeliveryDays && (
                                <p className="field-error">{(formErrors[job.id] || {}).estimatedDeliveryDays}</p>
                            )}
                            <textarea
                                value={(proposalForms[job.id] || {}).coverLetter || ''}
                                onChange={(e) => updateProposalForm(job.id, { coverLetter: e.target.value })}
                                onBlur={() => handleFieldBlur(job.id, 'coverLetter')}
                                rows={4}
                                placeholder="Write your proposal cover letter..."
                            />
                            {(formErrors[job.id] || {}).coverLetter && (
                                <p className="field-error">{(formErrors[job.id] || {}).coverLetter}</p>
                            )}
                            <input
                                type="file"
                                accept="application/pdf"
                                onBlur={() => handleFieldBlur(job.id, 'attachmentBase64')}
                                onChange={(e) => handleFileChange(job.id, e.target.files && e.target.files[0])}
                            />
                            {(formErrors[job.id] || {}).attachmentBase64 && (
                                <p className="field-error">{(formErrors[job.id] || {}).attachmentBase64}</p>
                            )}
                            {(proposalForms[job.id] || {}).attachmentFileName && (
                                <p className="muted">Attached: {(proposalForms[job.id] || {}).attachmentFileName}</p>
                            )}
                            <button
                                onClick={() => handleSubmitProposal(job.id)}
                                disabled={submittingJobId === job.id || proposalJobIds.has(job.id)}
                            >
                                {proposalJobIds.has(job.id)
                                    ? 'Already Submitted'
                                    : submittingJobId === job.id
                                        ? 'Submitting...'
                                        : 'Submit Proposal'}
                            </button>
                        </article>
                    ))}
                </section>
            )}

            {activeTab === 'proposals' && (
                <section className="module-section">
                    {myProposals.length === 0 && <p className="empty-state">You have not submitted proposals yet.</p>}
                    {myProposals.map((proposal) => (
                        <article key={proposal.id} className={`module-card ${editingProposalId === proposal.id ? 'editing' : ''}`}>
                            {editingProposalId === proposal.id ? (
                                // Edit Mode
                                <>
                                    <h3>Edit Proposal: {proposal.jobTitle}</h3>
                                    <div className="edit-form-section">
                                        <div className="form-group">
                                            <label>Proposed Budget (required)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={editingProposalData.proposedBudget || ''}
                                                onChange={(e) => handleEditProposalChange(proposal.id, 'proposedBudget', e.target.value)}
                                                onBlur={() => handleEditFieldBlur(proposal.id, 'proposedBudget')}
                                                placeholder="Your Budget (required)"
                                            />
                                            {(formErrors[proposal.id] || {}).proposedBudget && (
                                                <p className="field-error">{(formErrors[proposal.id] || {}).proposedBudget}</p>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label>Estimated Delivery Time in Days (required)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={editingProposalData.estimatedDeliveryDays || ''}
                                                onChange={(e) => handleEditProposalChange(proposal.id, 'estimatedDeliveryDays', e.target.value)}
                                                onBlur={() => handleEditFieldBlur(proposal.id, 'estimatedDeliveryDays')}
                                                placeholder="Estimated Delivery Time in Days (required)"
                                            />
                                            {(formErrors[proposal.id] || {}).estimatedDeliveryDays && (
                                                <p className="field-error">{(formErrors[proposal.id] || {}).estimatedDeliveryDays}</p>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label>Cover Letter (required)</label>
                                            <textarea
                                                value={editingProposalData.coverLetter || ''}
                                                onChange={(e) => handleEditProposalChange(proposal.id, 'coverLetter', e.target.value)}
                                                onBlur={() => handleEditFieldBlur(proposal.id, 'coverLetter')}
                                                rows={4}
                                                placeholder="Write your proposal cover letter..."
                                            />
                                            {(formErrors[proposal.id] || {}).coverLetter && (
                                                <p className="field-error">{(formErrors[proposal.id] || {}).coverLetter}</p>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label>Attachment PDF (required)</label>
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onBlur={() => handleEditFieldBlur(proposal.id, 'attachmentBase64')}
                                                onChange={(e) => handleEditFileChange(proposal.id, e.target.files && e.target.files[0])}
                                            />
                                            {(formErrors[proposal.id] || {}).attachmentBase64 && (
                                                <p className="field-error">{(formErrors[proposal.id] || {}).attachmentBase64}</p>
                                            )}
                                            {editingProposalData.attachmentFileName && (
                                                <p className="muted">Attached: {editingProposalData.attachmentFileName}</p>
                                            )}
                                        </div>

                                        <div className="form-actions">
                                            <button
                                                onClick={() => handleSaveEditProposal(proposal.id)}
                                                disabled={submittingJobId === proposal.id}
                                                className="btn-primary"
                                            >
                                                {submittingJobId === proposal.id ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                onClick={() => setEditingProposalId('')}
                                                disabled={submittingJobId === proposal.id}
                                                className="btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // View Mode
                                <>
                                    <h3>{proposal.jobTitle}</h3>
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

                                    {proposal.status === 'PENDING' && (
                                        <div className="proposal-actions">
                                            <button
                                                onClick={() => handleDeleteProposal(proposal.id)}
                                                className="btn-delete"
                                                disabled={deletingProposalId === proposal.id}
                                            >
                                                {deletingProposalId === proposal.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </article>
                    ))}
                </section>
            )}

            {activeTab === 'contracts' && (
                <section className="module-section">
                    {myContracts.length === 0 && <p className="empty-state">No contracts yet. Acceptances will appear here.</p>}
                    {myContracts.map((contract) => (
                        <article key={contract.id} className="module-card">
                            <h3>{contract.jobTitle}</h3>
                            <p className="muted">Client: {contract.clientName || contract.clientEmail}</p>
                            <p className="muted">Budget: ${contract.budget || 'N/A'}</p>
                            <span className={`status-badge ${(contract.status || 'STARTED').toLowerCase()}`}>{contract.status || 'STARTED'}</span>
                            <div className="status-actions">
                                <button onClick={() => handleContractStatusUpdate(contract.id, 'STARTED')} disabled={updatingContractId === contract.id}>Start</button>
                                <button onClick={() => handleContractStatusUpdate(contract.id, 'IN_PROGRESS')} disabled={updatingContractId === contract.id}>In Progress</button>
                                <button onClick={() => handleContractStatusUpdate(contract.id, 'COMPLETED')} disabled={updatingContractId === contract.id}>Complete</button>
                            </div>
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

export default FreelancerProposalContractPage;
