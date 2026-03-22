import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { Loader2 } from 'lucide-react';
import { ONBOARDING_ROUTE, USER_DASHBOARD_ROUTE } from '../constants/routes';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isLoading, isOnboarded } = useOnboardingStatus();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If not onboarded and not already on the onboarding page, redirect
  if (!isOnboarded && location.pathname !== ONBOARDING_ROUTE) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  // If onboarded and trying to access onboarding again, send them to the user dashboard
  if (isOnboarded && location.pathname === ONBOARDING_ROUTE) {
    return <Navigate to={USER_DASHBOARD_ROUTE} replace />;
  }

  return <>{children}</>;
}
