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
  const { role } = useOnboardingStatus();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user || !role) return;

      const table = role === 'mentor' ? 'mentors' : 'mentees';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('clerk_user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        setProfile(data as UserProfile);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user, role, supabase]);

  return { profile, role, loading };
}
