import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import App from './App';
import Dashboard from './pages/Dashboard';
import Pairing from './pages/Pairing';
import Matching from './pages/Matching';
import Calendar from './pages/Calendar';
import Messages from './pages/Messages';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import Settings from './pages/Settings';
import Help from './pages/Help';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import { OnboardingGuard } from './components/OnboardingGuard';
import UserDashboard from './pages/UserDashboard';
import { AdminGuard } from './components/AdminGuard';
import { SettingsProvider } from './hooks/useSettings';
import {
  ADMIN_PAIRING_ROUTE,
  getDefaultSignedInRoute,
  ONBOARDING_ROUTE,
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
  USER_DASHBOARD_ROUTE_SEGMENT,
} from './constants/routes';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Check your .env file.');
}

function DefaultSignedInLanding() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return null;
  }

  const email = user?.primaryEmailAddress?.emailAddress;

  if (getDefaultSignedInRoute(email) !== '/') {
    return <Navigate to={getDefaultSignedInRoute(email)} replace />;
  }

  return <Dashboard />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey}
      signUpForceRedirectUrl={ONBOARDING_ROUTE}
      signUpFallbackRedirectUrl={ONBOARDING_ROUTE}
      signInForceRedirectUrl={ONBOARDING_ROUTE}
      signInFallbackRedirectUrl={ONBOARDING_ROUTE}
    >
      <BrowserRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path={`${SIGN_IN_ROUTE}/*`} element={<SignInPage />} />
          <Route path={`${SIGN_UP_ROUTE}/*`} element={<SignUpPage />} />

          {/* Onboarding route */}
          <Route
            path={ONBOARDING_ROUTE}
            element={
              <>
                <SignedIn>
                  <OnboardingGuard>
                    <Onboarding />
                  </OnboardingGuard>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Protected app routes */}
          <Route
            element={
              <>
                <SignedIn>
                  <OnboardingGuard>
                    <SettingsProvider>
                      <App />
                    </SettingsProvider>
                  </OnboardingGuard>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          >
            <Route index element={<DefaultSignedInLanding />} />
            <Route path={USER_DASHBOARD_ROUTE_SEGMENT} element={<UserDashboard />} />
            <Route path="pairing" element={<Matching />} />
            <Route path="matching" element={<Matching />} />
            <Route path={ADMIN_PAIRING_ROUTE.slice(1)} element={<AdminGuard><Pairing /></AdminGuard>} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="messages" element={<Messages />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:id" element={<MemberProfile />} />
            <Route path="help" element={<Help />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
