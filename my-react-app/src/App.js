import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ClientRegistrationPage from './pages/ClientRegistrationPage';
import ClientLoginPage from './pages/ClientLoginPage';
import FreelancerRegistrationPage from './pages/FreelancerRegistrationPage';
import FreelancerLoginPage from './pages/FreelancerLoginPage';
import AdminRegistrationPage from './pages/AdminRegistrationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import './App.css';

function App() {
    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/client-register" element={<ClientRegistrationPage />} />
                <Route path="/freelancer-register" element={<FreelancerRegistrationPage />} />
                <Route path="/login" element={<ClientLoginPage />} />
                <Route path="/freelancer-login" element={<FreelancerLoginPage />} />
                <Route path="/admin-registration" element={<AdminRegistrationPage />} />
                <Route path="/admin-login" element={<AdminLoginPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/client-register" element={<ClientRegistrationPage />} />
                <Route path="/freelancer-register" element={<FreelancerRegistrationPage />} />
                <Route path="/login" element={<ClientLoginPage />} />
                <Route path="/freelancer-login" element={<FreelancerLoginPage />} />
                <Route path="/admin-registration" element={<AdminRegistrationPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/client-register" element={<ClientRegistrationPage />} />
                <Route path="/freelancer-register" element={<FreelancerRegistrationPage />} />
                <Route path="/login" element={<ClientLoginPage />} />
                <Route path="/freelancer-login" element={<FreelancerLoginPage />} />
                <Route path="/features" element={<div>Features Page (To be implemented)</div>} />
                <Route path="/how-it-works" element={<div>How It Works Page (To be implemented)</div>} />
                <Route path="/pricing" element={<div>Pricing Page (To be implemented)</div>} />
                <Route path="/admin-registration" element={<div>Admin Registration Page (To be implemented)</div>} />
                <Route path="/" element={<HomePage />} />
                <Route path="/client-register" element={<ClientRegistrationPage />} />
                <Route path="/freelancer-register" element={<FreelancerRegistrationPage />} />
                <Route path="/login" element={<ClientLoginPage />} />
                <Route path="/freelancer-login" element={<FreelancerLoginPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/client-register" element={<ClientRegistrationPage />} />
                <Route path="/freelancer-register" element={<FreelancerRegistrationPage />} />
                <Route path="/login" element={<ClientLoginPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/client-register" element={<ClientRegistrationPage />} />
                <Route path="/login" element={<ClientLoginPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/client-register" element={<ClientRegistrationPage />} />
                {/* Add the freelancer registration route when you create it */}
                <Route path="/freelancer-register" element={<div>Freelancer Registration (Coming Soon)</div>} />
                <Route path="/" element={<HomePage />} />
                <Route path="/client-register" element={<ClientRegistrationPage />} />
                <Route path="/features" element={<div>Features Page (To be implemented)</div>} />
                <Route path="/how-it-works" element={<div>How It Works Page (To be implemented)</div>} />
                <Route path="/pricing" element={<div>Pricing Page (To be implemented)</div>} />
                <Route path="/admin-registration" element={<div>Admin Registration Page (To be implemented)</div>} />
                <Route path="/login" element={<div>Login Page (To be implemented)</div>} />
                <Route path="/signup" element={<div>Sign Up Page (To be implemented)</div>} />
            </Routes>
        </div>
    );
}

export default App;

