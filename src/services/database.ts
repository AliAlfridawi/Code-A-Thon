/**
 * Placeholder for Supabase database.
 * Replace with @supabase/supabase-js.
 */
import { MENTORS, MENTEES } from '../types';

export const getMentors = async () => {
  // In a real app: const { data } = await supabase.from('mentors').select('*');
  return MENTORS;
};

export const getMentees = async () => {
  // In a real app: const { data } = await supabase.from('mentees').select('*');
  return MENTEES;
};

export const createPairing = async (mentorId: string, menteeId: string) => {
  // In a real app: await supabase.from('pairings').insert({ mentor_id: mentorId, mentee_id: menteeId });
  console.log(`Pairing created: ${mentorId} <-> ${menteeId}`);
};
