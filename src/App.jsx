import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginRedirect from '@/components/LoginRedirect';
// Add page imports here
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import PublicLayout from '@/components/site/PublicLayout';
import Home from '@/pages/Home';
import TaxClients from '@/pages/TaxClients';
import JoinTeam from '@/pages/JoinTeam';
import LiveEducation from '@/pages/LiveEducation';
import Software from '@/pages/Software';
import Marketplace from '@/pages/Marketplace';
import SmartWiz from '@/pages/SmartWiz';
import WhatLuxeLogicDoes from '@/pages/WhatLuxeLogicDoes';
import SoftwareAgreement from '@/pages/SoftwareAgreement';
import RefundPolicy from '@/pages/RefundPolicy';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Terms from '@/pages/Terms';
import IncomeDisclaimer from '@/pages/IncomeDisclaimer';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import FormPage from '@/pages/FormPage';
import Waitlist from '@/pages/Waitlist';
import Suite from '@/pages/Suite';
import SuiteDashboard from '@/components/suite/SuiteDashboard';
import ReturnQueue from '@/components/suite/ReturnQueue';
import DueDiligence from '@/components/suite/DueDiligence';
import DocumentRequests from '@/components/suite/DocumentRequests';
import SupportTickets from '@/components/suite/SupportTickets';
import Earnings from '@/components/suite/Earnings';
import Compliance from '@/components/suite/Compliance';
import SuiteTraining from '@/components/suite/SuiteTraining';
import ResourceDashboard from '@/components/suite/ResourceDashboard';
import SuiteSettings from '@/components/suite/SuiteSettings';
import Admin from '@/pages/Admin';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tax-clients" element={<TaxClients />} />
        <Route path="/join" element={<JoinTeam />} />
        <Route path="/live-education" element={<LiveEducation />} />
        <Route path="/software" element={<Software />} />
        <Route path="/what-luxelogic-does" element={<WhatLuxeLogicDoes />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/smartwiz" element={<SmartWiz />} />
        <Route path="/software-agreement" element={<SoftwareAgreement />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/income-disclaimer" element={<IncomeDisclaimer />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/form/:id" element={<FormPage />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
          <Route path="/suite" element={<Suite />}>
            <Route index element={<SuiteDashboard />} />
            <Route path="queue" element={<ReturnQueue />} />
            <Route path="dd" element={<DueDiligence />} />
            <Route path="docs" element={<DocumentRequests />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="training" element={<SuiteTraining />} />
            <Route path="resources" element={<ResourceDashboard />} />
            <Route path="settings" element={<SuiteSettings />} />
          </Route>
        </Route>
      </Route>
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App