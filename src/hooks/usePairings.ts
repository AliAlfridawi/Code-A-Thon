import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import type { PairingRow } from '../types';

export function usePairings() {
  const supabase = useSupabase();
  const [pairings, setPairings] = useState<PairingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPairings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pairings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPairings(data as PairingRow[]);
      } catch (err) {
        console.error('Error fetching pairings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPairings();
  }, [supabase]);

  const createPairing = useCallback(async (mentorId: string, menteeId: string, score: number) => {
    try {
      const { data, error } = await supabase
        .from('pairings')
        .insert([{ mentor_id: mentorId, mentee_id: menteeId, score }])
        .select()
        .single();
      
      if (error) throw error;
      setPairings(prev => [data as PairingRow, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating pairing:', err);
      throw err;
    }
  }, [supabase]);

  const updatePairingStatus = useCallback(async (id: string, status: 'pending' | 'active' | 'completed') => {
    try {
      const updates: any = { status };
      if (status === 'active') updates.confirmed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('pairings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setPairings(prev => prev.map(p => p.id === id ? (data as PairingRow) : p));
    } catch (err) {
      console.error('Error updating pairing:', err);
      throw err;
    }
  }, [supabase]);

  const deletePairing = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('pairings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPairings(prev => prev.filter((pairing) => pairing.id !== id));
    } catch (err) {
      console.error('Error deleting pairing:', err);
      throw err;
    }
  }, [supabase]);

  return { pairings, loading, createPairing, updatePairingStatus, deletePairing };
}
