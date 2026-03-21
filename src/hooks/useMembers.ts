import { useEffect, useState } from 'react';
import { useSupabase } from './useSupabase';
import type { Mentor, Mentee, ExtendedProfile, MentorRow, MenteeRow } from '../types';

export function useMembers() {
  const supabase = useSupabase();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoading(true);
        const [mentorsRes, menteesRes] = await Promise.all([
          supabase.from('mentors').select('*').order('name'),
          supabase.from('mentees').select('*').order('name')
        ]);

        if (mentorsRes.error) throw mentorsRes.error;
        if (menteesRes.error) throw menteesRes.error;

        // Map DB rows to standard UI types
        setMentors((mentorsRes.data as MentorRow[]).map(m => ({
          id: m.id,
          name: m.name,
          dept: m.dept,
          tags: m.tags,
          avatar: m.avatar_url || 'https://via.placeholder.com/150'
        })));

        setMentees((menteesRes.data as MenteeRow[]).map(m => ({
          id: m.id,
          name: m.name,
          program: m.program,
          major: m.major,
          interests: m.interests,
          avatar: m.avatar_url || 'https://via.placeholder.com/150'
        })));

      } catch (err: any) {
        console.error('Error fetching members:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [supabase]);

  return { mentors, mentees, loading, error };
}

export function useMemberProfile(id: string | undefined) {
  const supabase = useSupabase();
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [person, setPerson] = useState<(Mentor & { type: 'mentor' }) | (Mentee & { type: 'mentee' }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!id) return;
      try {
        setLoading(true);
        // Try mentor first
        const { data: mentor, error: mentorErr } = await supabase.from('mentors').select('*').eq('id', id).single();
        
        if (mentor) {
          const m = mentor as MentorRow;
          setPerson({
            type: 'mentor',
            id: m.id,
            name: m.name,
            dept: m.dept,
            tags: m.tags,
            avatar: m.avatar_url || ''
          });
          setProfile({
            bio: m.bio || '',
            email: m.email || '',
            office: m.office || '',
            researchInterests: m.research_interests || [],
            publications: m.publications as any || [],
            availability: m.availability as any || [],
            joinedDate: m.joined_date || ''
          });
          return;
        }

        // Try mentee
        const { data: mentee, error: menteeErr } = await supabase.from('mentees').select('*').eq('id', id).single();
        if (mentee) {
          const m = mentee as MenteeRow;
          setPerson({
            type: 'mentee',
            id: m.id,
            name: m.name,
            program: m.program,
            major: m.major,
            interests: m.interests,
            avatar: m.avatar_url || ''
          });
          setProfile({
            bio: m.bio || '',
            email: m.email || '',
            office: m.office || '',
            researchInterests: m.research_interests || [],
            publications: m.publications as any || [],
            availability: m.availability as any || [],
            joinedDate: m.joined_date || ''
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [id, supabase]);

  return { profile, person, loading };
}
