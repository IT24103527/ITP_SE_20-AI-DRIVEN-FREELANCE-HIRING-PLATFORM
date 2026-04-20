import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PageTransition from './components/PageTransition';
import './App.css';

// ── Eagerly loaded (always needed on first paint) ──────────────
import HomePage from './components/HomePage';

// ── Lazily loaded (split into separate chunks) ─────────────────
const FeaturesPage          = lazy(() => import('./pages/FeaturesPage'));
const HowItWorks            = lazy(() => import('./pages/HowItWorksPage'));
const EarnMorePage          = lazy(() => import('./pages/EarnMorePage'));

const ClientRegistrationPage    = lazy(() => import('./pages/ClientRegistrationPage'));
const FreelancerRegistrationPage = lazy(() => import('./pages/FreelancerRegistrationPage'));
const AdminRegistrationPage     = lazy(() => import('./pages/AdminRegistrationPage'));

const ClientLoginPage       = lazy(() => import('./pages/ClientLoginPage'));
const FreelancerLoginPage   = lazy(() => import('./pages/FreelancerLoginPage'));
const AdminLoginPage        = lazy(() => import('./pages/AdminLoginPage'));

const ClientDashboard       = lazy(() => import('./pages/ClientDashboard'));
const FreelancerDashboard   = lazy(() => import('./pages/FreelancerDashboard'));
const AdminDashboard        = lazy(() => import('./pages/AdminDashboard'));
const ClientProposalContractPage = lazy(() => import('./pages/ClientProposalContractPage'));
const FreelancerProposalContractPage = lazy(() => import('./pages/FreelancerProposalContractPage'));

const AboutUsPage           = lazy(() => import('./pages/AboutUsPage'));
const CareersPage           = lazy(() => import('./pages/CareersPage'));
const BlogPage              = lazy(() => import('./pages/BlogPage'));
const PressPage             = lazy(() => import('./pages/PressPage'));
const HelpCenterPage        = lazy(() => import('./pages/HelpCenterPage'));
const ContactUsPage         = lazy(() => import('./pages/ContactUsPage'));
const PrivacyPolicyPage     = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage    = lazy(() => import('./pages/TermsOfServicePage'));
const DebugDashboard        = lazy(() => import('./components/DebugDashboard'));

// Minimal fallback — matches the dark background so there's no flash
const PageFallback = () => (
    <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0f2e 0%, #2e0854 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
        <div style={{
            width: 40, height: 40,
            border: '3px solid #112244',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

function App() {
    const location = useLocation();

    return (
        <div className="App">
            <PageTransition>
                <Suspense fallback={<PageFallback />}>
                    <Routes location={location}>
                        <Route path="/"                   element={<HomePage />} />
                        <Route path="/features"           element={<FeaturesPage />} />
                        <Route path="/how-it-works"       element={<HowItWorks />} />
                        <Route path="/earn-more"          element={<EarnMorePage />} />

                        <Route path="/client-register"    element={<ClientRegistrationPage />} />
                        <Route path="/freelancer-register" element={<FreelancerRegistrationPage />} />
                        <Route path="/admin-registration" element={<AdminRegistrationPage />} />

                        <Route path="/login"              element={<ClientLoginPage />} />
                        <Route path="/freelancer-login"   element={<FreelancerLoginPage />} />
                        <Route path="/admin-login"        element={<AdminLoginPage />} />

                        <Route path="/client-dashboard"   element={<ClientDashboard />} />
                        <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
                        <Route path="/client-proposals-contracts" element={<ClientProposalContractPage />} />
                        <Route path="/freelancer-proposals-contracts" element={<FreelancerProposalContractPage />} />
                        <Route path="/admin-dashboard"    element={<AdminDashboard />} />

                        <Route path="/about"              element={<AboutUsPage />} />
                        <Route path="/careers"            element={<CareersPage />} />
                        <Route path="/blog"               element={<BlogPage />} />
                        <Route path="/press"              element={<PressPage />} />

                        <Route path="/help-center"        element={<HelpCenterPage />} />
                        <Route path="/contact"            element={<ContactUsPage />} />
                        <Route path="/privacy"            element={<PrivacyPolicyPage />} />
                        <Route path="/terms"              element={<TermsOfServicePage />} />

                        <Route path="/debug"              element={<DebugDashboard />} />

                        <Route path="*" element={
                            <div style={{ padding: '50px', textAlign: 'center', background: '#020818', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <h1 style={{ color: '#fff', marginBottom: '20px' }}>404 - Page Not Found</h1>
                                <a href="/" style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>Go to Homepage</a>
                            </div>
                        } />
                    </Routes>
                </Suspense>
            </PageTransition>
        </div>
    );
}

export default App;
