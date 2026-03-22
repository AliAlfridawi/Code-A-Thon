import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';
import type { UserProfileRow } from '../types';

export function useOnboardingStatus() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [role, setRole] = useState<'mentor' | 'mentee' | null>(null);

  useEffect(() => {
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
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No profile found means not onboarded
            setIsOnboarded(false);
            setRole(null);
          } else {
            console.error('Error fetching onboarding status:', error);
          }
        } else if (data) {
          setIsOnboarded(data.onboarding_complete ?? false);
          setRole(data.role as 'mentor' | 'mentee');
        }
      } catch (err) {
        console.error('Unexpected error checking onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkOnboarding();
  }, [user, isUserLoaded, supabase]);

  return { isLoading: isLoading || !isUserLoaded, isOnboarded, role };
}
