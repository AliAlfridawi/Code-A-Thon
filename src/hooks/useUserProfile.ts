import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';
import { useOnboardingStatus } from './useOnboardingStatus';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar_url: string;
  research_interests: string[];
  availability: any[];
  // Mentor fields
  dept?: string;
  tags?: string[];
  // Mentee fields
  major?: string;
  program?: string;
  interests?: string[];
}

export function useUserProfile() {
  const { user } = useUser();
  const supabase = useSupabase();
  const { role, isLoading: onboardingLoading } = useOnboardingStatus();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (onboardingLoading) {
        setLoading(true);
        return;
      }

      if (!role) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const table = role === 'mentor' ? 'mentors' : 'mentees';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
      } else {
        setProfile((data as UserProfile | null) ?? null);
      }
      setLoading(false);
    }

    void fetchProfile();
  }, [onboardingLoading, role, supabase, user]);

  return { profile, role, loading };
}
