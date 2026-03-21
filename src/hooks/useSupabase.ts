import { useMemo } from 'react';
import { useSession } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * A custom hook that creates an authenticated Supabase client.
 * It intercepts all fetch requests to inject the Clerk JWT token.
 */
export function useSupabase() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options?: RequestInit) => {
          // Fetch the Supabase-specific JWT from Clerk
          const clerkToken = await session?.getToken({ template: 'supabase' });

          const headers = new Headers(options?.headers);
          
          if (clerkToken) {
            // Override the default anon key auth with the Clerk user's token
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }

          return fetch(url, { ...options, headers });
        },
      },
    });
  }, [session]);
}
