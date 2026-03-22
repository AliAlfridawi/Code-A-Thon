import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';
import type { UserSettingsRow } from '../types';

type SettingsValues = Pick<
  UserSettingsRow,
  | 'email_notifs'
  | 'push_notifs'
  | 'weekly_digest'
  | 'match_alerts'
  | 'dark_mode'
  | 'compact_view'
>;

type SettingsContextValue = {
  settings: SettingsValues;
  loading: boolean;
  updateSetting: (key: keyof SettingsValues, value: boolean) => Promise<void>;
};

const DEFAULT_SETTINGS: SettingsValues = {
  email_notifs: true,
  push_notifs: false,
  weekly_digest: true,
  match_alerts: true,
  dark_mode: false,
  compact_view: false,
};

const SETTINGS_STORAGE_PREFIX = 'scholarly-editorial:settings';
const SettingsContext = createContext<SettingsContextValue | null>(null);

function getStorageKey(userId: string) {
  return `${SETTINGS_STORAGE_PREFIX}:${userId}`;
}

function normalizeSettings(
  settings?: Partial<UserSettingsRow> | Partial<SettingsValues> | null,
): SettingsValues {
  return {
    email_notifs: settings?.email_notifs ?? DEFAULT_SETTINGS.email_notifs,
    push_notifs: settings?.push_notifs ?? DEFAULT_SETTINGS.push_notifs,
    weekly_digest: settings?.weekly_digest ?? DEFAULT_SETTINGS.weekly_digest,
    match_alerts: settings?.match_alerts ?? DEFAULT_SETTINGS.match_alerts,
    dark_mode: settings?.dark_mode ?? DEFAULT_SETTINGS.dark_mode,
    compact_view: settings?.compact_view ?? DEFAULT_SETTINGS.compact_view,
  };
}

function readStoredSettings(userId: string) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    return raw ? normalizeSettings(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn('Unable to read cached settings:', error);
    return null;
  }
}

function persistStoredSettings(userId: string, settings: SettingsValues) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(settings));
  } catch (error) {
    console.warn('Unable to cache settings locally:', error);
  }
}

function applyAppearanceSettings(settings: SettingsValues) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = settings.dark_mode ? 'dark' : 'light';
  root.dataset.density = settings.compact_view ? 'compact' : 'comfortable';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const { user, isLoaded } = useUser();
  const [settings, setSettings] = useState<SettingsValues>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyAppearanceSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
      return;
    }

    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    const cachedSettings = readStoredSettings(user.id);
    if (cachedSettings) {
      setSettings(cachedSettings);
    }

    let cancelled = false;

    async function loadSettings() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('clerk_user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        let nextSettings = cachedSettings ?? DEFAULT_SETTINGS;

        if (data) {
          nextSettings = normalizeSettings(data);
        } else {
          const { data: newData, error: insertError } = await supabase
            .from('user_settings')
            .insert([{ clerk_user_id: user.id, ...DEFAULT_SETTINGS }])
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          nextSettings = normalizeSettings(newData);
        }

        if (!cancelled) {
          setSettings(nextSettings);
          persistStoredSettings(user.id, nextSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, supabase, user]);

  const updateSetting = useCallback(
    async (key: keyof SettingsValues, value: boolean) => {
      let previousValue = DEFAULT_SETTINGS[key];
      let nextSettings = DEFAULT_SETTINGS;

      setSettings((currentSettings) => {
        previousValue = currentSettings[key];
        nextSettings = { ...currentSettings, [key]: value };

        if (user) {
          persistStoredSettings(user.id, nextSettings);
        }

        return nextSettings;
      });

      if (!user) return;

      try {
        const { error } = await supabase
          .from('user_settings')
          .update({ [key]: value, updated_at: new Date().toISOString() })
          .eq('clerk_user_id', user.id);

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Error updating setting:', error);

        setSettings((currentSettings) => {
          const revertedSettings = { ...currentSettings, [key]: previousValue };
          persistStoredSettings(user.id, revertedSettings);
          return revertedSettings;
        });
      }
    },
    [supabase, user],
  );

  const value = useMemo(
    () => ({
      settings,
      loading,
      updateSetting,
    }),
    [loading, settings, updateSetting],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider.');
  }

  return context;
}
