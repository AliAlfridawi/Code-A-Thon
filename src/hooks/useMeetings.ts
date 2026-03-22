import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, useUser } from '@clerk/clerk-react';
import {
  getSupabaseAuthDebugMessage,
  getSupabaseAuthDiagnostics,
  type SupabaseAuthDiagnostics,
  useSupabase,
} from './useSupabase';
import { useUserProfile } from './useUserProfile';
import type { Database } from '../types/database.types';
import type { MeetingRow } from '../types';
import { isUpcomingMeeting, sortMeetingsByScheduledAt } from '../utils/dateUtils';

export type Meeting = MeetingRow;
export type MeetingRequestInput = {
  pairing_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes?: number;
  meeting_link?: string | null;
  notes?: string | null;
};
export type MeetingDecision = 'accepted' | 'rejected';
export type MeetingRequestResult = Database['public']['Functions']['request_pairing_meeting']['Returns'][number];
export type MeetingResponseResult = Database['public']['Functions']['respond_to_meeting_request']['Returns'][number];
export interface MeetingActionResult<T> {
  data: T | null;
  error: string | null;
  debugMessage: string | null;
}

function getMeetingActionErrorMessage(errorMessage?: string | null) {
  if (!errorMessage) {
    return 'We could not update that meeting right now. Please try again.';
  }

  if (errorMessage.includes('Authentication required')) {
    return 'You must be signed in to manage meetings.';
  }

  if (errorMessage.includes('Pairing not found')) {
    return 'We could not find that mentorship pairing.';
  }

  if (errorMessage.includes('Meeting not found')) {
    return 'We could not find that meeting request.';
  }

  if (errorMessage.includes('Meeting title is required')) {
    return 'Add a meeting title before sending the request.';
  }

  if (errorMessage.includes('Completed pairing cannot schedule meetings')) {
    return 'Archived pairings cannot schedule meetings.';
  }

  if (errorMessage.includes('Completed pairing cannot respond to meetings')) {
    return 'Archived pairings cannot update meeting requests.';
  }

  if (errorMessage.includes('Meeting requester cannot respond to their own request')) {
    return 'You cannot respond to your own meeting request.';
  }

  if (errorMessage.includes('Meeting request already responded to')) {
    return 'That meeting request has already been updated.';
  }

  if (errorMessage.includes('Conversation not found for meeting request')) {
    return 'We could not find the conversation for that meeting request.';
  }

  if (errorMessage.includes('Not allowed to access this pairing conversation')) {
    return 'You do not have access to that meeting.';
  }

  if (errorMessage.includes('Meeting decision must be accepted or rejected')) {
    return 'That meeting response was not valid.';
  }

  return 'We could not update that meeting right now. Please try again.';
}

function getMeetingAuthUserMessage(status: SupabaseAuthDiagnostics['status']) {
  if (status === 'missing-session') {
    return 'You must be signed in to manage meetings.';
  }

  if (status === 'missing-token') {
    return 'Meetings are unavailable because the Clerk-to-Supabase token is missing for this session.';
  }

  if (status === 'invalid-token' || status === 'subject-mismatch') {
    return 'Meetings are unavailable because the Supabase sign-in token is invalid for this account.';
  }

  return null;
}

export function useMeetings() {
  const { user } = useUser();
  const { session } = useSession();
  const supabase = useSupabase();
  const { profile, role } = useUserProfile();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const logMeetingDebug = useCallback((source: string, message: string) => {
    if (import.meta.env.DEV) {
      console.error(`[meetings:${source}] ${message}`);
    }
  }, []);

  const ensureSupabaseMeetingAuth = useCallback(async (source: string) => {
    if (!user) {
      return {
        userMessage: 'You must be signed in to manage meetings.',
        debugMessage: null,
      };
    }

    const diagnostics = await getSupabaseAuthDiagnostics(session, user.id);
    const userMessage = getMeetingAuthUserMessage(diagnostics.status);

    if (!userMessage) {
      return null;
    }

    const debugMessage = getSupabaseAuthDebugMessage(diagnostics) ?? 'Unknown Clerk-to-Supabase auth bridge failure.';
    logMeetingDebug(source, debugMessage);

    return {
      userMessage,
      debugMessage,
    };
  }, [logMeetingDebug, session, user]);

  const refreshMeetings = useCallback(async (options?: { showLoader?: boolean }) => {
    const showLoader = options?.showLoader ?? false;

    if (!user || !profile || !role) {
      setMeetings([]);
      setLoading(false);
      return [];
    }

    if (showLoader) {
      setLoading(true);
    }

    const authIssue = await ensureSupabaseMeetingAuth('meetings.select');

    if (authIssue) {
      setMeetings([]);
      setLoading(false);
      return [];
    }

    const column = role === 'mentor' ? 'mentor_id' : 'mentee_id';
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq(column, profile.id)
      .order('scheduled_at', { ascending: true });

    if (error) {
      logMeetingDebug(
        'meetings.select',
        [error.message, error.details, error.hint, error.code].filter(Boolean).join(' | ')
      );
      setMeetings([]);
    } else {
      setMeetings(data || []);
    }

    setLoading(false);
    return data || [];
  }, [ensureSupabaseMeetingAuth, logMeetingDebug, profile, role, supabase, user]);

  useEffect(() => {
    void refreshMeetings({ showLoader: true });
  }, [refreshMeetings]);

  useEffect(() => {
    if (!profile || !role) {
      return;
    }

    const column = role === 'mentor' ? 'mentor_id' : 'mentee_id';
    const nextChannel = supabase
      .channel(`meetings:${role}:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
          filter: `${column}=eq.${profile.id}`,
        },
        () => {
          void refreshMeetings();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(nextChannel);
    };
  }, [profile, refreshMeetings, role, supabase]);

  const requestMeeting = async (
    meeting: MeetingRequestInput
  ): Promise<MeetingActionResult<MeetingRequestResult>> => {
    const authIssue = await ensureSupabaseMeetingAuth('request_pairing_meeting');

    if (authIssue) {
      return {
        data: null,
        error: authIssue.userMessage,
        debugMessage: authIssue.debugMessage,
      };
    }

    const { data, error } = await supabase
      .rpc('request_pairing_meeting', {
        pairing_id: meeting.pairing_id,
        title: meeting.title,
        scheduled_at: meeting.scheduled_at,
        duration_minutes: meeting.duration_minutes ?? 30,
        meeting_link: meeting.meeting_link ?? null,
        notes: meeting.notes ?? null,
      })
      .single();

    if (error) {
      const debugMessage = [error.message, error.details, error.hint, error.code].filter(Boolean).join(' | ');
      logMeetingDebug('request_pairing_meeting', `pairing_id=${meeting.pairing_id} | ${debugMessage}`);

      return {
        data: null,
        error: getMeetingActionErrorMessage(error.message),
        debugMessage,
      };
    }

    await refreshMeetings();
    return {
      data,
      error: null,
      debugMessage: null,
    };
  };

  const respondToMeeting = async (
    meetingId: string,
    decision: MeetingDecision
  ): Promise<MeetingActionResult<MeetingResponseResult>> => {
    const authIssue = await ensureSupabaseMeetingAuth('respond_to_meeting_request');

    if (authIssue) {
      return {
        data: null,
        error: authIssue.userMessage,
        debugMessage: authIssue.debugMessage,
      };
    }

    const { data, error } = await supabase
      .rpc('respond_to_meeting_request', {
        meeting_id: meetingId,
        decision,
      })
      .single();

    if (error) {
      const debugMessage = [error.message, error.details, error.hint, error.code].filter(Boolean).join(' | ');
      logMeetingDebug('respond_to_meeting_request', `meeting_id=${meetingId} | ${debugMessage}`);

      return {
        data: null,
        error: getMeetingActionErrorMessage(error.message),
        debugMessage,
      };
    }

    await refreshMeetings();
    return {
      data,
      error: null,
      debugMessage: null,
    };
  };

  const acceptedMeetings = useMemo(
    () => meetings.filter((meeting) => meeting.status === 'accepted'),
    [meetings]
  );

  const calendarMeetings = useMemo(
    () => sortMeetingsByScheduledAt(meetings.filter((meeting) => meeting.status !== 'rejected')),
    [meetings]
  );

  const upcomingCalendarMeetings = useMemo(
    () => calendarMeetings.filter((meeting) => isUpcomingMeeting(meeting.scheduled_at)),
    [calendarMeetings]
  );

  const meetingsById = useMemo(
    () => new Map(meetings.map((meeting) => [meeting.id, meeting])),
    [meetings]
  );

  return {
    meetings,
    acceptedMeetings,
    calendarMeetings,
    upcomingCalendarMeetings,
    meetingsById,
    loading,
    refreshMeetings,
    requestMeeting,
    respondToMeeting,
  };
}
