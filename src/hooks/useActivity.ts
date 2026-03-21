import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import type { ActivityLogRow } from '../types';

export function useActivity() {
  const supabase = useSupabase();
  const [activities, setActivities] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setActivities(data as ActivityLogRow[]);
      } catch (err) {
        console.error('Error fetching activity log:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [supabase]);

  const logActivity = useCallback(async (action: string, detail: string, type: ActivityLogRow['type']) => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .insert([{ action, detail, type }])
        .select()
        .single();
      
      if (error) throw error;
      setActivities(prev => [(data as ActivityLogRow), ...prev].slice(0, 20));
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  }, [supabase]);

  return { activities, loading, logActivity };
}
