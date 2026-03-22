import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import {
  Sparkles, Users, CalendarDays, Handshake, MessageSquare,
  Loader2, ExternalLink, Clock, ChevronRight, Star
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { useSupabase } from '../hooks/useSupabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { useMeetings, Meeting } from '../hooks/useMeetings';
import { calculateMatches, MatchCandidate } from '../services/matchingService';

export default function UserDashboard() {
  const { user } = useUser();
  const supabase = useSupabase();
  const { profile, role, loading: profileLoading } = useUserProfile();
  const { meetings, loading: meetingsLoading } = useMeetings();

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingConnections, setLoadingConnections] = useState(true);

  // Fetch potential matches
  useEffect(() => {
    async function fetchMatches() {
      if (!profile || !role) return;

      const oppositeTable = role === 'mentor' ? 'mentees' : 'mentors';
      const { data, error } = await supabase.from(oppositeTable).select('*');

      if (error) {
        console.error('Error fetching candidates:', error);
        setLoadingMatches(false);
        return;
      }

      const results = calculateMatches(profile as any, data, role);
      setMatches(results.slice(0, 5));
      setLoadingMatches(false);
    }

    fetchMatches();
  }, [profile, role, supabase]);

  // Fetch connections (pairings)
  useEffect(() => {
    async function fetchConnections() {
      if (!profile || !role) return;

      const column = role === 'mentor' ? 'mentor_id' : 'mentee_id';
      const joinTable = role === 'mentor' ? 'mentees' : 'mentors';
      const joinColumn = role === 'mentor' ? 'mentee_id' : 'mentor_id';

      const { data, error } = await supabase
        .from('pairings')
        .select(`*, ${joinTable}(*)`)
        .eq(column, profile.id);

      if (error) {
        console.error('Error fetching connections:', error);
      } else {
        setConnections(data || []);
      }
      setLoadingConnections(false);
    }

    fetchConnections();
  }, [profile, role, supabase]);

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
  const upcomingMeetings = meetings.filter(
    m => new Date(m.scheduled_at) >= new Date()
  );

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
                const statusColor = conn.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : conn.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600';

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
                    <Link to="/messages" className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
                      <MessageSquare size={16} className="text-primary" />
                    </Link>
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
              const date = new Date(meeting.scheduled_at);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <Clock size={12} />
                      <span className="text-xs font-medium">{time}</span>
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
