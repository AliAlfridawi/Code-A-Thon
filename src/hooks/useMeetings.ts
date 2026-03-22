import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';

export interface Meeting {
  id: string;
  pairing_id: string | null;
  mentor_id: string | null;
  mentee_id: string | null;
  title: string;
  meeting_link: string | null;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export function useMeetings() {
  const { user } = useUser();
  const supabase = useSupabase();
  const { profile, role } = useUserProfile();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeetings() {
      if (!profile) return;

      const column = role === 'mentor' ? 'mentor_id' : 'mentee_id';
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq(column, profile.id)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching meetings:', error);
      } else {
        setMeetings(data || []);
      }
      setLoading(false);
    }

    fetchMeetings();
  }, [profile, role, supabase]);

  const createMeeting = async (meeting: Omit<Meeting, 'id' | 'created_at' | 'created_by'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('meetings')
      .insert({ ...meeting, created_by: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting:', error);
      return null;
    }

    setMeetings(prev => [...prev, data]);
    return data;
  };

  return { meetings, loading, createMeeting };
}
