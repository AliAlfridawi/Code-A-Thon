import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Star, Heart, MessageSquare, Loader2, Search,
  GraduationCap, BookOpen, FlaskConical, UserCheck, X, Send, CalendarPlus
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { useSupabase } from '../hooks/useSupabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { usePairings } from '../hooks/usePairings';
import { useMessages } from '../hooks/useMessages';
import { useMeetings } from '../hooks/useMeetings';
import { calculateMatches, MatchCandidate } from '../services/matchingService';

export default function Matching() {
  const { user } = useUser();
  const supabase = useSupabase();
  const { profile, role, loading: profileLoading } = useUserProfile();
  const { pairings, loading: pairingsLoading, createPairing } = usePairings();
  const {
    conversations,
    activeConversation,
    messages: chatMessages,
    activeConversationId,
    setActiveConversationId,
    ensureConversation,
    sendMessage: sendChatMessage,
    loadingMessages,
  } = useMessages();
  const { createMeeting } = useMeetings();

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<MatchCandidate | null>(null);
  const [chatPairingId, setChatPairingId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', link: '' });
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    async function fetchMatches() {
      if (!profile || !role) {
        return;
      }

      const oppositeTable = role === 'mentor' ? 'mentees' : 'mentors';
      const { data, error } = await supabase.from(oppositeTable).select('*');

      if (error) {
        console.error('Error fetching candidates:', error);
        setLoading(false);
        return;
      }

      const results = calculateMatches(profile as any, data, role);
      setMatches(results);
      setFilteredMatches(results);
      setLoading(false);
    }

    void fetchMatches();
  }, [profile, role, supabase]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMatches(matches);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredMatches(
      matches.filter((match) =>
        match.name?.toLowerCase().includes(query) ||
        (match as any).dept?.toLowerCase().includes(query) ||
        (match as any).major?.toLowerCase().includes(query) ||
        match.research_interests?.some((interest) => interest.toLowerCase().includes(query)) ||
        (match as any).tags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
        (match as any).interests?.some((interest: string) => interest.toLowerCase().includes(query))
      )
    );
  }, [matches, searchQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const relevantPairings = useMemo(() => {
    if (!profile || !role) {
      return [];
    }

    return pairings.filter((pairing) =>
      role === 'mentor' ? pairing.mentor_id === profile.id : pairing.mentee_id === profile.id
    );
  }, [pairings, profile, role]);

  const pairingsByMatchId = useMemo(() => {
    const next = new Map<string, typeof pairings[number]>();

    relevantPairings.forEach((pairing) => {
      const otherProfileId = role === 'mentor' ? pairing.mentee_id : pairing.mentor_id;

      if (!next.has(otherProfileId)) {
        next.set(otherProfileId, pairing);
      }
    });

    return next;
  }, [relevantPairings, role]);

  const activeChatConversation = useMemo(() => {
    if (!chatPairingId) {
      return null;
    }

    return conversations.find((conversation) => conversation.pairing_id === chatPairingId) ?? null;
  }, [chatPairingId, conversations]);

  const isArchivedChat = activeChatConversation?.pairing_status === 'completed';

  const closeChat = () => {
    setChatTarget(null);
    setChatPairingId(null);
    setShowSchedule(false);
    setChatInput('');
  };

  const handleConnect = async (match: MatchCandidate) => {
    if (!profile || !role) {
      return;
    }

    const matchId = match.id as string;
    setConnectingId(matchId);

    try {
      const mentorId = role === 'mentor' ? profile.id : matchId;
      const menteeId = role === 'mentee' ? profile.id : matchId;
      await createPairing(mentorId, menteeId, match.matchScore || 0);
    } catch (error) {
      console.error('Error creating pairing:', error);
    } finally {
      setConnectingId(null);
    }
  };

  const openChat = async (match: MatchCandidate) => {
    const matchId = match.id as string;
    const pairing = pairingsByMatchId.get(matchId);

    if (!pairing) {
      return;
    }

    const existingConversation = conversations.find((conversation) => conversation.pairing_id === pairing.id);
    if (existingConversation) {
      setChatTarget(match);
      setChatPairingId(pairing.id);
      setActiveConversationId(existingConversation.conversation_id);
      return;
    }

    if (pairing.status === 'completed') {
      console.error('Completed pairings can only open an existing archived conversation.');
      return;
    }

    const ensuredConversationId = await ensureConversation(pairing.id);
    if (ensuredConversationId) {
      setChatTarget(match);
      setChatPairingId(pairing.id);
      setActiveConversationId(ensuredConversationId);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isArchivedChat) {
      return;
    }

    await sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleScheduleMeeting = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!meetingForm.title || !meetingForm.date || !meetingForm.time || !profile || !role || !activeChatConversation) {
      return;
    }

    const mentorId =
      role === 'mentor'
        ? profile.id
        : activeChatConversation.counterpart_role === 'mentor'
          ? activeChatConversation.counterpart_profile_id
          : null;
    const menteeId =
      role === 'mentee'
        ? profile.id
        : activeChatConversation.counterpart_role === 'mentee'
          ? activeChatConversation.counterpart_profile_id
          : null;

    if (!mentorId || !menteeId) {
      console.error('Could not resolve meeting participants from the active conversation.');
      return;
    }

    setScheduling(true);
    const scheduledAt = new Date(`${meetingForm.date}T${meetingForm.time}`);

    const meeting = await createMeeting({
      pairing_id: activeChatConversation.pairing_id,
      mentor_id: mentorId,
      mentee_id: menteeId,
      title: meetingForm.title,
      meeting_link: meetingForm.link || null,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: 30,
      notes: null,
    });

    if (meeting) {
      const dateLabel = scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeLabel = scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const meetingMessage = `Meeting scheduled: ${meetingForm.title} on ${dateLabel} at ${timeLabel}${meetingForm.link ? ` - ${meetingForm.link}` : ''}`;
      await sendChatMessage(meetingMessage);
    }

    setMeetingForm({ title: '', date: '', time: '', link: '' });
    setShowSchedule(false);
    setScheduling(false);
  };

  if (profileLoading || pairingsLoading || loading) {
    return (
      <PageTransition>
        <div className="flex bg-surface min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </PageTransition>
    );
  }

  const roleLabel = role === 'mentor' ? 'mentees' : 'mentors';

  return (
    <PageTransition>
      <PageHeader
        title="Find Your Match"
        description={`Discover ${roleLabel} who share your academic interests and research goals.`}
      />

      <div className="relative mb-8 max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={`Search ${roleLabel} by name, field, or interest...`}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
        />
      </div>

      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10">
          <Sparkles size={14} className="text-primary" />
          <span className="text-sm font-bold text-primary">{filteredMatches.length}</span>
          <span className="text-xs text-on-surface-variant">potential {roleLabel}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200/50">
          <UserCheck size={14} className="text-green-600" />
          <span className="text-sm font-bold text-green-700">{pairingsByMatchId.size}</span>
          <span className="text-xs text-on-surface-variant">connected</span>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 text-on-surface-variant/20 mx-auto mb-4" />
          <p className="text-on-surface-variant italic">No matches found. Try broadening your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMatches.map((match, index) => {
            const matchId = match.id as string;
            const pairing = pairingsByMatchId.get(matchId);
            const existingConversation = pairing
              ? conversations.find((conversation) => conversation.pairing_id === pairing.id)
              : null;
            const canOpenArchivedHistory = pairing?.status === 'completed' ? Boolean(existingConversation) : true;
            const isConnected = Boolean(pairing);
            const isConnecting = connectingId === matchId;
            const score = match.matchScore || 0;
            const scoreColor = score >= 60
              ? 'from-green-500 to-emerald-600'
              : score >= 30
                ? 'from-amber-500 to-orange-500'
                : 'from-gray-400 to-gray-500';

            return (
              <motion.div
                key={matchId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.5) }}
                className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/10 hover:shadow-lg transition-all group"
              >
                <div className={`bg-gradient-to-r ${scoreColor} px-5 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-white" />
                    <span className="text-white text-sm font-bold">{score}% Match</span>
                  </div>
                  <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider">Compatibility</span>
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={match.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name || 'User')}&background=002045&color=fff`}
                      alt={match.name || ''}
                      className="w-14 h-14 rounded-2xl object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-primary text-base truncate">{match.name}</h3>
                      <p className="text-xs text-on-surface-variant truncate flex items-center gap-1.5 mt-0.5">
                        <GraduationCap size={12} />
                        {role === 'mentor' ? (match as any).major : (match as any).dept}
                      </p>
                      {role === 'mentor' && (match as any).program && (
                        <p className="text-[10px] text-on-surface-variant/70 mt-0.5">{(match as any).program}</p>
                      )}
                    </div>
                  </div>

                  {match.bio && (
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-2">{match.bio}</p>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BookOpen size={10} className="text-primary" />
                      <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">
                        {role === 'mentor' ? 'Interests' : 'Expertise'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(role === 'mentor' ? (match as any).interests : (match as any).tags)?.slice(0, 4).map((tag: string) => (
                        <span key={tag} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-[9px] font-bold rounded-lg uppercase tracking-wider">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {match.research_interests && match.research_interests.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <FlaskConical size={10} className="text-primary" />
                        <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Research</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.research_interests.slice(0, 3).map((interest) => (
                          <span key={interest} className="px-2.5 py-1 bg-primary/5 text-primary text-[9px] font-bold rounded-lg">{interest}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {pairing && (
                    <div className="mb-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                        pairing.status === 'active'
                          ? 'bg-green-50 text-green-700'
                          : pairing.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {pairing.status}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
                    {isConnected ? (
                      <button
                        onClick={() => openChat(match)}
                        disabled={!canOpenArchivedHistory}
                        className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageSquare size={14} />
                        {pairing?.status === 'completed' ? 'View History' : 'Send Message'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(match)}
                        disabled={isConnecting}
                        className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                      >
                        {isConnecting ? (
                          <><Loader2 size={14} className="animate-spin" /> Connecting...</>
                        ) : (
                          <><Heart size={14} /> Connect</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {chatTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
            onClick={closeChat}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center gap-3 bg-surface-container-lowest">
                <img
                  src={activeChatConversation?.counterpart_avatar_url || chatTarget.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatTarget.name || 'User')}&background=002045&color=fff`}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-primary truncate">
                    {activeChatConversation?.counterpart_display_name || chatTarget.name}
                  </h3>
                  <p className="text-[10px] text-on-surface-variant">
                    {role === 'mentor' ? (chatTarget as any).major : (chatTarget as any).dept}
                  </p>
                </div>
                <button
                  onClick={() => setShowSchedule(true)}
                  disabled={!activeChatConversation || isArchivedChat}
                  className="p-2 rounded-xl hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={isArchivedChat ? 'Archived conversations cannot schedule meetings' : 'Schedule a meeting'}
                >
                  <CalendarPlus size={16} className="text-primary" />
                </button>
                <button
                  onClick={closeChat}
                  className="p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  <X size={16} className="text-on-surface-variant" />
                </button>
              </div>

              {isArchivedChat && (
                <div className="px-5 py-3 text-xs font-medium text-amber-800 bg-amber-50 border-b border-amber-200/70">
                  This chat is archived because the pairing is completed. New messages are disabled.
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-primary" size={20} />
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-10 w-10 text-on-surface-variant/20 mx-auto mb-3" />
                    <p className="text-sm text-on-surface-variant italic">Start the conversation!</p>
                    <p className="text-xs text-on-surface-variant/50 mt-1">Say hello to {chatTarget.name}</p>
                  </div>
                ) : (
                  chatMessages.map((message) => {
                    const isSelf = message.sender_clerk_user_id === user?.id;

                    return (
                      <div key={message.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                          isSelf
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-surface-container-low text-on-surface rounded-bl-md'
                        }`}>
                          {message.content}
                          <div className={`text-[9px] mt-1 ${isSelf ? 'text-white/50' : 'text-on-surface-variant/50'}`}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <AnimatePresence>
                {showSchedule && activeChatConversation && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleScheduleMeeting}
                    className="border-t border-outline-variant/10 bg-primary/5 px-4 py-3 space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Schedule Meeting</span>
                      <button type="button" onClick={() => setShowSchedule(false)}>
                        <X size={14} className="text-on-surface-variant" />
                      </button>
                    </div>
                    <input
                      required
                      type="text"
                      placeholder="Meeting title"
                      value={meetingForm.title}
                      onChange={(event) => setMeetingForm({ ...meetingForm, title: event.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/20 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required
                        type="date"
                        value={meetingForm.date}
                        onChange={(event) => setMeetingForm({ ...meetingForm, date: event.target.value })}
                        className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        required
                        type="time"
                        value={meetingForm.time}
                        onChange={(event) => setMeetingForm({ ...meetingForm, time: event.target.value })}
                        className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Google Meet / Teams link"
                      value={meetingForm.link}
                      onChange={(event) => setMeetingForm({ ...meetingForm, link: event.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/20 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      disabled={scheduling}
                      className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {scheduling ? <Loader2 size={12} className="animate-spin" /> : <CalendarPlus size={12} />}
                      {scheduling ? 'Scheduling...' : 'Schedule'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="px-4 py-3 border-t border-outline-variant/10 bg-surface-container-lowest">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && void handleSendChat()}
                    placeholder={isArchivedChat ? 'Archived conversation' : 'Type a message...'}
                    disabled={isArchivedChat || !activeConversationId}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={() => void handleSendChat()}
                    disabled={!chatInput.trim() || isArchivedChat || !activeConversationId}
                    className="p-2.5 bg-primary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-30"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
