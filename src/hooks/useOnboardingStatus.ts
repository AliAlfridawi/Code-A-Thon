import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';
import type { UserProfileRow } from '../types';

// Module-level cache: once onboarding is confirmed complete, remember it
// so that re-mounts of this hook don't briefly flash isOnboarded=false
// and cause the OnboardingGuard to redirect back to /onboarding.
let cachedOnboarded = false;
let cachedRole: 'mentor' | 'mentee' | null = null;

/** Call this right after the profile upsert succeeds to warm the cache
 *  before navigating away from onboarding. */
export function markOnboardingComplete(role: 'mentor' | 'mentee') {
  cachedOnboarded = true;
  cachedRole = role;
}

export function useOnboardingStatus() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useSupabase();
  // If we already know they're onboarded, start with that so the guard
  // never sees the false→true flicker.
  const [isLoading, setIsLoading] = useState(!cachedOnboarded);
  const [isOnboarded, setIsOnboarded] = useState(cachedOnboarded);
  const [role, setRole] = useState<'mentor' | 'mentee' | null>(cachedRole);

  useEffect(() => {
    // If we already confirmed onboarding, skip the DB query entirely
    if (cachedOnboarded) {
      setIsOnboarded(true);
      setRole(cachedRole);
      setIsLoading(false);
      return;
    }

    async function checkOnboarding() {
      if (!isUserLoaded) return;
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('onboarding_complete, role')
          .eq('clerk_user_id', user.id)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116') {
            // No profile found means not onboarded
            setIsOnboarded(false);
            setRole(null);
          } else {
            console.error('Error fetching onboarding status:', error);
            // On transient errors (406, 401, etc), don't redirect to onboarding
            // Keep previous state to avoid redirect loops
          }
        } else if (data) {
          const onboarded = data.onboarding_complete ?? false;
          const userRole = data.role as 'mentor' | 'mentee';
          setIsOnboarded(onboarded);
          setRole(userRole);
          // Persist to module-level cache so future mounts are instant
          if (onboarded) {
            cachedOnboarded = true;
            cachedRole = userRole;
          }
        } else {
          // maybeSingle returned null (no rows) — not onboarded
          setIsOnboarded(false);
          setRole(null);
        }
      } catch (err) {
        console.error('Unexpected error checking onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkOnboarding();
  }, [user, isUserLoaded, supabase]);

  // Allow callers (like signout) to reset the cache
  const resetCache = useCallback(() => {
    cachedOnboarded = false;
    cachedRole = null;
  }, []);

  return { isLoading: isLoading || !isUserLoaded, isOnboarded, role, resetCache };
}
