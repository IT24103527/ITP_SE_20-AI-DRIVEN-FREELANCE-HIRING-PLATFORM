import { Routes, Route, useLocation } from 'react-router-dom';
import PageTransition from './components/PageTransition';
import HomePage from './components/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorks from './pages/HowItWorksPage';
import EarnMorePage from './pages/EarnMorePage';
import ClientRegistrationPage from './pages/ClientRegistrationPage';
import ClientLoginPage from './pages/ClientLoginPage';
import FreelancerRegistrationPage from './pages/FreelancerRegistrationPage';
import FreelancerLoginPage from './pages/FreelancerLoginPage';
import AdminRegistrationPage from './pages/AdminRegistrationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AboutUsPage from './pages/AboutUsPage';
import CareersPage from './pages/CareersPage';
import BlogPage from './pages/BlogPage';
import PressPage from './pages/PressPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ContactUsPage from './pages/ContactUsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import DebugDashboard from './components/DebugDashboard';
import './App.css';

function App() {
    const location = useLocation();

    return (
        <div className="App">
            <PageTransition>
                <Routes location={location}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/features" element={<FeaturesPage />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/earn-more" element={<EarnMorePage />} />

                    <Route path="/client-register" element={<ClientRegistrationPage />} />
                    <Route path="/freelancer-register" element={<FreelancerRegistrationPage />} />
                    <Route path="/admin-registration" element={<AdminRegistrationPage />} />

                    <Route path="/login" element={<ClientLoginPage />} />
                    <Route path="/freelancer-login" element={<FreelancerLoginPage />} />
                    <Route path="/admin-login" element={<AdminLoginPage />} />

                    <Route path="/client-dashboard" element={<ClientDashboard />} />
                    <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />

                    <Route path="/about" element={<AboutUsPage />} />
                    <Route path="/careers" element={<CareersPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/press" element={<PressPage />} />

                    <Route path="/help-center" element={<HelpCenterPage />} />
                    <Route path="/contact" element={<ContactUsPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsOfServicePage />} />

                    <Route path="/debug" element={<DebugDashboard />} />

                    <Route path="*" element={
                        <div style={{ padding: '50px', textAlign: 'center', background: '#020818', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <h1 style={{ color: '#fff', marginBottom: '20px' }}>404 - Page Not Found</h1>
                            <a href="/" style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>Go to Homepage</a>
                        </div>
                    } />
                </Routes>
            </PageTransition>
        </div>
    );
}

export default App;
