import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { Loader2 } from 'lucide-react';
import { getDefaultSignedInRoute, ONBOARDING_ROUTE } from '../constants/routes';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isLoading, isOnboarded } = useOnboardingStatus();
  const { user } = useUser();
  const location = useLocation();
  const defaultSignedInRoute = getDefaultSignedInRoute(user?.primaryEmailAddress?.emailAddress);

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

  // If onboarding is already complete, send the user to their default signed-in route.
  if (isOnboarded && location.pathname === ONBOARDING_ROUTE) {
    return <Navigate to={defaultSignedInRoute} replace />;
  }

  return <>{children}</>;
}
