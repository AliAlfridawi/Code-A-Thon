import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';

type OnboardingRole = 'mentor' | 'mentee';

type CachedOnboardingState = {
  userId: string | null;
  isOnboarded: boolean;
  role: OnboardingRole | null;
};

let cachedState: CachedOnboardingState = {
  userId: null,
  isOnboarded: false,
  role: null,
};

function getCachedStateForUser(userId?: string | null) {
  if (!userId || cachedState.userId !== userId) {
    return {
      isOnboarded: false,
      role: null as OnboardingRole | null,
    };
  }

  return {
    isOnboarded: cachedState.isOnboarded,
    role: cachedState.role,
  };
}

export function clearOnboardingStatusCache() {
  cachedState = {
    userId: null,
    isOnboarded: false,
    role: null,
  };
}

export function markOnboardingComplete(userId: string, role: OnboardingRole) {
  cachedState = {
    userId,
    isOnboarded: true,
    role,
  };
}

export function useOnboardingStatus() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useSupabase();
  const userId = user?.id ?? null;
  const cachedForUser = getCachedStateForUser(userId);

  const [isLoading, setIsLoading] = useState(userId ? !cachedForUser.isOnboarded : true);
  const [isOnboarded, setIsOnboarded] = useState(cachedForUser.isOnboarded);
  const [role, setRole] = useState<OnboardingRole | null>(cachedForUser.role);

  useEffect(() => {
    if (!isUserLoaded) {
      return;
    }

    if (!user) {
      setIsOnboarded(false);
      setRole(null);
      setIsLoading(false);
      return;
    }

    const nextCachedState = getCachedStateForUser(user.id);

    if (nextCachedState.isOnboarded) {
      setIsOnboarded(true);
      setRole(nextCachedState.role);
      setIsLoading(false);
      return;
    }

    async function checkOnboarding() {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('onboarding_complete, role')
          .eq('clerk_user_id', user.id)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116') {
            setIsOnboarded(false);
            setRole(null);
          } else {
            console.error('Error fetching onboarding status:', error);
          }
          return;
        }

        if (data) {
          const onboarded = data.onboarding_complete ?? false;
          const userRole = data.role as OnboardingRole;

          setIsOnboarded(onboarded);
          setRole(userRole);

          cachedState = {
            userId: user.id,
            isOnboarded: onboarded,
            role: userRole,
          };

          return;
        }

        setIsOnboarded(false);
        setRole(null);
        cachedState = {
          userId: user.id,
          isOnboarded: false,
          role: null,
        };
      } catch (err) {
        console.error('Unexpected error checking onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    }

    void checkOnboarding();
  }, [isUserLoaded, supabase, user]);

  const resetCache = useCallback(() => {
    clearOnboardingStatusCache();
  }, []);

  return { isLoading: isLoading || !isUserLoaded, isOnboarded, role, resetCache };
}
