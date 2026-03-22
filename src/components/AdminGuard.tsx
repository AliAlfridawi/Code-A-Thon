import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { isAdminEmail } from '../constants/routes';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = isAdminEmail(user?.primaryEmailAddress?.emailAddress);

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-6 text-center">
        <ShieldAlert className="h-20 w-20 text-destructive mb-6" />
        <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
          This restricted area is for administrative purposes only. Your mentor/mentee profile has been successfully recorded.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
