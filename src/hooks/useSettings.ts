import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useUser } from '@clerk/clerk-react';
import type { UserSettingsRow } from '../types';

const DEFAULT_SETTINGS = {
  email_notifs: true,
  push_notifs: false,
  weekly_digest: true,
  match_alerts: true,
  dark_mode: false,
  compact_view: false
};

export function useSettings() {
  const supabase = useSupabase();
  const { user, isLoaded } = useUser();
  const [settings, setSettings] = useState<Partial<UserSettingsRow>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      if (!isLoaded || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('clerk_user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is not found
          throw error;
        }

        if (data) {
          setSettings(data);
        } else {
          // Create default settings row
          const { data: newData, error: insertError } = await supabase
            .from('user_settings')
            .insert([{ clerk_user_id: user.id, ...DEFAULT_SETTINGS }])
            .select()
            .single();
            
          if (!insertError && newData) setSettings(newData);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user, isLoaded, supabase]);

  const updateSetting = useCallback(async (key: keyof UserSettingsRow, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value })); // Optimistic

    if (!user) return;
    try {
      await supabase
        .from('user_settings')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('clerk_user_id', user.id);
    } catch (err) {
      console.error('Error updating setting:', err);
    }
  }, [user, supabase]);

  return { settings, loading, updateSetting, user };
}
