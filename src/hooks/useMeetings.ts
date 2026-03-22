import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import type { MeetingRow } from '../types';

export type Meeting = MeetingRow;

export type MeetingInsert = Omit<MeetingRow, 'id' | 'created_at' | 'created_by'>;

export function useMeetings() {
  const { user } = useUser();
  const supabase = useSupabase();
  const { profile, role } = useUserProfile();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeetings() {
      if (!profile || !role) {
        setMeetings([]);
        setLoading(false);
        return;
      }

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

  const createMeeting = async (meeting: MeetingInsert) => {
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
