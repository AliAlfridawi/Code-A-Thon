import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import App from './App';
import Dashboard from './pages/Dashboard';
import Pairing from './pages/Pairing';
import Messages from './pages/Messages';
import Members from './pages/Members';
import Settings from './pages/Settings';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import { OnboardingGuard } from './components/OnboardingGuard';
import { AdminGuard } from './components/AdminGuard';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Check your .env file.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          {/* Onboarding route */}
          <Route
            path="/onboarding"
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
                    <App />
                  </OnboardingGuard>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          >
            <Route index element={<AdminGuard><Dashboard /></AdminGuard>} />
            <Route path="pairing" element={<Pairing />} />
            <Route path="messages" element={<Messages />} />
            <Route path="members" element={<Members />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
