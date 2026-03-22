import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import {
  Sparkles, Users, CalendarDays, Handshake, MessageSquare,
  Loader2, ExternalLink, Clock, ChevronRight, Star, Check, X
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { useSupabase } from '../hooks/useSupabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { useMeetings } from '../hooks/useMeetings';
import { buildMessagesRoute } from '../constants/routes';
import { calculateMatches, MatchCandidate } from '../services/matchingService';
import { formatMeetingDateParts, getMeetingStatusClasses } from '../utils/dateUtils';

export default function UserDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const { profile, role, loading: profileLoading } = useUserProfile();
  const { upcomingCalendarMeetings, loading: meetingsLoading } = useMeetings();

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [actingConnectionId, setActingConnectionId] = useState<string | null>(null);
  const [actingConnectionIntent, setActingConnectionIntent] = useState<'accept' | 'deny' | null>(null);

  // Fetch potential matches
  useEffect(() => {
    async function fetchMatches() {
      if (profileLoading) {
        return;
      }

      if (!profile || !role || !user) return;

      setLoadingMatches(true);
      const oppositeTable = role === 'mentor' ? 'mentees' : 'mentors';
      const { data, error } = await supabase.from(oppositeTable).select('*');

      if (error) {
        console.error('Error fetching candidates:', error);
        setLoadingMatches(false);
        return;
      }

      const eligibleCandidates = (data ?? []).filter((candidate) => candidate.clerk_user_id !== user.id);
      const results = calculateMatches(profile as any, eligibleCandidates, role);
      setMatches(results.slice(0, 5));
      setLoadingMatches(false);
    }

    if (!profileLoading && (!profile || !role || !user)) {
      setMatches([]);
      setLoadingMatches(false);
      return;
    }

    void fetchMatches();
  }, [profile, profileLoading, role, supabase, user]);

  const fetchConnections = useCallback(async () => {
    if (!profile || !role) {
      setConnections([]);
      setLoadingConnections(false);
      return;
    }

    setLoadingConnections(true);

    const column = role === 'mentor' ? 'mentor_id' : 'mentee_id';
    const joinTable = role === 'mentor' ? 'mentees' : 'mentors';

    const { data, error } = await supabase
      .from('pairings')
      .select(`*, ${joinTable}(*)`)
      .eq(column, profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      setConnections(data || []);
    }

    setLoadingConnections(false);
  }, [profile, role, supabase]);

  // Fetch connections (pairings)
  useEffect(() => {
    void fetchConnections();
  }, [fetchConnections]);

  const handleAcceptConnection = useCallback(async (connectionId: string) => {
    setActingConnectionId(connectionId);
    setActingConnectionIntent('accept');

    try {
      const { error } = await supabase
        .from('pairings')
        .update({
          status: 'active',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (error) {
        throw error;
      }

      await fetchConnections();
      navigate(buildMessagesRoute({ pairingId: connectionId }));
    } catch (error) {
      console.error('Error accepting pairing request:', error);
    } finally {
      setActingConnectionId(null);
      setActingConnectionIntent(null);
    }
  }, [fetchConnections, navigate, supabase]);

  const handleDenyConnection = useCallback(async (connectionId: string, partnerName: string) => {
    const shouldDeny = window.confirm(`Deny the pending request from ${partnerName}?`);

    if (!shouldDeny) {
      return;
    }

    setActingConnectionId(connectionId);
    setActingConnectionIntent('deny');

    try {
      const { error } = await supabase
        .from('pairings')
        .delete()
        .eq('id', connectionId);

      if (error) {
        throw error;
      }

      setConnections((current) => current.filter((connection) => connection.id !== connectionId));
    } catch (error) {
      console.error('Error denying pairing request:', error);
    } finally {
      setActingConnectionId(null);
      setActingConnectionIntent(null);
    }
  }, [supabase]);

  const loading = profileLoading || loadingMatches || loadingConnections || meetingsLoading;

  if (loading) {
    return (
      <PageTransition>
        <div className="flex bg-surface min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </PageTransition>
    );
  }

  const greeting = user?.firstName ? `Welcome, ${user.firstName}!` : 'Welcome!';

  // Group meetings by date for calendar view
  const upcomingMeetings = upcomingCalendarMeetings;

  return (
    <PageTransition>
      <PageHeader
        title={greeting}
        description={`Your ${role === 'mentor' ? 'mentorship' : 'learning'} dashboard — matches, connections, and upcoming meetings.`}
      />

      {/* Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#002045] to-[#1a365d] text-white rounded-3xl p-6 shadow-lg"
        >
          <Sparkles className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{matches.length}</p>
          <p className="text-sm text-white/70 mt-1">Potential Matches</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-gradient-to-br from-[#0d3b2e] to-[#14532d] text-white rounded-3xl p-6 shadow-lg"
        >
          <Handshake className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{connections.length}</p>
          <p className="text-sm text-white/70 mt-1">Connections</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-white rounded-3xl p-6 shadow-lg"
        >
          <CalendarDays className="h-8 w-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{upcomingMeetings.length}</p>
          <p className="text-sm text-white/70 mt-1">Upcoming Meetings</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Potential Matches */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="xl:col-span-2 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h2 className="font-headline font-bold text-lg text-primary">Potential Matches</h2>
            </div>
            <Link to="/pairing" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {matches.length === 0 ? (
            <p className="text-sm text-on-surface-variant italic">No matches found yet. Check back soon!</p>
          ) : (
            <div className="space-y-3">
              {matches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-container-low transition-all cursor-pointer border border-transparent hover:border-primary/10"
                >
                  <img
                    src={match.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name)}&background=002045&color=fff`}
                    alt={match.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary">{match.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {role === 'mentor' ? (match as any).major : (match as any).dept}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(role === 'mentor' ? (match as any).interests : (match as any).tags)?.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[9px] font-bold rounded uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-primary font-bold text-lg">
                      <Star className="h-4 w-4" />
                      {match.matchScore}%
                    </div>
                    <p className="text-[9px] text-on-surface-variant uppercase font-bold tracking-widest">Score</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Connections */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <Handshake size={18} className="text-primary" />
            <h2 className="font-headline font-bold text-lg text-primary">My Connections</h2>
          </div>

          {connections.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant italic">No connections yet.</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">Matches will appear here once confirmed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn: any, i: number) => {
                const partner = role === 'mentor' ? conn.mentees : conn.mentors;
                const partnerName = partner?.name || 'this user';
                const statusColor = conn.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : conn.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600';
                const isPending = conn.status === 'pending';
                const isActing = actingConnectionId === conn.id;
                const messageLabel = conn.status === 'completed' ? 'View History' : 'Send Message';

                return (
                  <motion.div
                    key={conn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-all"
                  >
                    <img
                      src={partner?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner?.name || 'User')}&background=002045&color=fff`}
                      alt={partner?.name || 'Partner'}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary truncate">{partner?.name || 'Unknown'}</p>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider mt-1 ${statusColor}`}>
                        {conn.status}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Link
                        to={buildMessagesRoute({ pairingId: conn.id })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
                      >
                        <MessageSquare size={12} />
                        {messageLabel}
                      </Link>
                      {isPending ? (
                        <>
                          <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleDenyConnection(conn.id, partnerName)}
                            disabled={isActing}
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[11px] font-bold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isActing && actingConnectionIntent === 'deny' ? (
                              <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Denying</span>
                            ) : (
                              <span className="inline-flex items-center gap-1"><X size={12} /> Deny</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleAcceptConnection(conn.id)}
                            disabled={isActing}
                            className="px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isActing && actingConnectionIntent === 'accept' ? (
                              <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Accepting</span>
                            ) : (
                              <span className="inline-flex items-center gap-1"><Check size={12} /> Accept</span>
                            )}
                          </button>
                          </div>
                          <p className="text-[10px] text-on-surface-variant">Chat is available now while this request is pending.</p>
                        </>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>

      {/* Calendar / Upcoming Meetings */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-8 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" />
            <h2 className="font-headline font-bold text-lg text-primary">Upcoming Meetings</h2>
          </div>
          <Link to="/messages" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
            Schedule in chat <ChevronRight size={12} />
          </Link>
        </div>

        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-10">
            <CalendarDays className="h-16 w-16 text-on-surface-variant/20 mx-auto mb-4" />
            <p className="text-sm text-on-surface-variant italic">No upcoming meetings scheduled.</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">
              Use the chat to schedule a meeting with your {role === 'mentor' ? 'mentees' : 'mentors'}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMeetings.map((meeting, i) => {
              const { dayName, monthDay, time } = formatMeetingDateParts(meeting.scheduled_at);

              return (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 rounded-2xl p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-primary text-white rounded-xl px-3 py-1.5 text-center">
                      <p className="text-[10px] uppercase font-bold tracking-wider">{dayName}</p>
                      <p className="text-lg font-bold leading-tight">{monthDay}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <Clock size={12} />
                        <span className="text-xs font-medium">{time}</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getMeetingStatusClasses(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-primary mb-1">{meeting.title}</h3>
                  <p className="text-xs text-on-surface-variant mb-3">
                    {meeting.duration_minutes} min
                    {meeting.notes ? ` · ${meeting.notes}` : ''}
                  </p>
                  {meeting.meeting_link && (
                    <a
                      href={meeting.meeting_link.startsWith('http') ? meeting.meeting_link : `https://${meeting.meeting_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink size={12} />
                      Join Meeting
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>
    </PageTransition>
  );
}
