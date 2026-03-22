import { useMemo } from 'react';
import { useSession } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseJwtTemplate = 'supabase';
let hasLoggedMissingSupabaseJwtWarning = false;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

type ClerkSupabaseSession = {
  getToken: (options?: { template?: string }) => Promise<string | null>;
} | null | undefined;

export interface SupabaseAuthDiagnostics {
  status: 'ready' | 'missing-session' | 'missing-token' | 'invalid-token' | 'subject-mismatch';
  token: string | null;
  subject: string | null;
  error: string | null;
}

function decodeJwtPayload(token: string) {
  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + paddingLength, '=');
    return JSON.parse(window.atob(paddedPayload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getSupabaseAuthDiagnostics(
  session: ClerkSupabaseSession,
  expectedUserId?: string | null
): Promise<SupabaseAuthDiagnostics> {
  if (!session) {
    return {
      status: 'missing-session',
      token: null,
      subject: null,
      error: 'No active Clerk session was available.',
    };
  }

  const token = await session.getToken({ template: supabaseJwtTemplate });

  if (!token) {
    return {
      status: 'missing-token',
      token: null,
      subject: null,
      error: `Clerk did not return a '${supabaseJwtTemplate}' JWT.`,
    };
  }

  const payload = decodeJwtPayload(token);
  const subject = typeof payload?.sub === 'string' ? payload.sub : null;

  if (!payload || !subject) {
    return {
      status: 'invalid-token',
      token,
      subject: null,
      error: 'The Clerk Supabase JWT could not be decoded or is missing the sub claim.',
    };
  }

  if (expectedUserId && subject !== expectedUserId) {
    return {
      status: 'subject-mismatch',
      token,
      subject,
      error: `The Supabase JWT sub claim (${subject}) does not match the signed-in Clerk user (${expectedUserId}).`,
    };
  }

  return {
    status: 'ready',
    token,
    subject,
    error: null,
  };
}

export function getSupabaseAuthUserMessage(diagnostics: SupabaseAuthDiagnostics) {
  if (diagnostics.status === 'missing-session') {
    return 'You must be signed in to access messages.';
  }

  if (diagnostics.status === 'missing-token') {
    return 'Messaging is unavailable because the Clerk-to-Supabase token is missing for this session.';
  }

  if (diagnostics.status === 'invalid-token' || diagnostics.status === 'subject-mismatch') {
    return 'Messaging is unavailable because the Supabase sign-in token is invalid for this account.';
  }

  return null;
}

export function getSupabaseAuthDebugMessage(diagnostics: SupabaseAuthDiagnostics) {
  if (diagnostics.status === 'ready') {
    return null;
  }

  return [
    `status=${diagnostics.status}`,
    diagnostics.subject ? `sub=${diagnostics.subject}` : null,
    diagnostics.error,
  ]
    .filter(Boolean)
    .join(' | ');
}

/**
 * A custom hook that creates an authenticated Supabase client.
 * It intercepts all fetch requests to inject the Clerk JWT token.
 */
export function useSupabase() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options?: RequestInit) => {
          // Fetch the Supabase-specific JWT from Clerk
          const clerkToken = await session?.getToken({ template: supabaseJwtTemplate });

          const headers = new Headers(options?.headers);

          if (clerkToken) {
            // Override the default anon key auth with the Clerk user's token
            headers.set('Authorization', `Bearer ${clerkToken}`);
          } else if (session && import.meta.env.DEV && !hasLoggedMissingSupabaseJwtWarning) {
            hasLoggedMissingSupabaseJwtWarning = true;
            console.warn(
              `Clerk did not return a '${supabaseJwtTemplate}' JWT. Supabase RLS and messaging RPCs that rely on auth.jwt()->>'sub' may fail until the Clerk JWT template is configured.`
            );
          }

          return fetch(url, { ...options, headers });
        },
      },
    });
  }, [session]);
}
