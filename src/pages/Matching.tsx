import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { profile, role, loading: profileLoading } = useUserProfile();
  const { createPairing } = usePairings();
  const {
    conversations, messages: chatMessages, activeConversationId,
    setActiveConversationId, sendMessage: sendChatMessage, loadingMessages
  } = useMessages();
  const { createMeeting } = useMeetings();

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  // Chat slide-over state
  const [chatTarget, setChatTarget] = useState<MatchCandidate | null>(null);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Schedule meeting state
  const [showSchedule, setShowSchedule] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', link: '' });
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    async function fetchMatches() {
      if (!profile || !role) return;
      const oppositeTable = role === 'mentor' ? 'mentees' : 'mentors';
      const { data, error } = await supabase.from(oppositeTable).select('*');
      if (error) { console.error('Error fetching candidates:', error); setLoading(false); return; }
      const results = calculateMatches(profile as any, data, role);
      setMatches(results);
      setFilteredMatches(results);
      setLoading(false);
    }
    fetchMatches();
  }, [profile, role, supabase]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredMatches(matches); return; }
    const q = searchQuery.toLowerCase();
    setFilteredMatches(
      matches.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        (m as any).dept?.toLowerCase().includes(q) ||
        (m as any).major?.toLowerCase().includes(q) ||
        m.research_interests?.some(r => r.toLowerCase().includes(q)) ||
        (m as any).tags?.some((t: string) => t.toLowerCase().includes(q)) ||
        (m as any).interests?.some((i: string) => i.toLowerCase().includes(q))
      )
    );
  }, [searchQuery, matches]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleConnect = async (match: MatchCandidate) => {
    if (!profile) return;
    const matchId = match.id as string;
    setConnectingId(matchId);
    try {
      const mentorId = role === 'mentor' ? profile.id : matchId;
      const menteeId = role === 'mentee' ? profile.id : matchId;
      await createPairing(mentorId, menteeId, match.matchScore || 0);
      setConnectedIds(prev => new Set(prev).add(matchId));
    } catch (err) { console.error('Error creating pairing:', err); }
    finally { setConnectingId(null); }
  };

  const openChat = async (match: MatchCandidate) => {
    setChatTarget(match);
    // Try to find an existing conversation with this person
    const convo = conversations.find(c =>
      c.title?.toLowerCase() === match.name?.toLowerCase() ||
      c.members?.some(m => m.member_name?.toLowerCase() === match.name?.toLowerCase())
    );
    if (convo) {
      setActiveConversationId(convo.id);
    } else {
      // Auto-create a conversation for this pair
      try {
        const { data: newConvo, error: convoErr } = await supabase
          .from('conversations')
          .insert({ title: match.name || 'Chat' })
          .select()
          .single();
        if (convoErr) throw convoErr;

        // Add both members
        const userName = profile?.name || 'You';
        const userAvatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=002045&color=fff`;
        const matchAvatar = match.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name || 'User')}&background=002045&color=fff`;
        
        await supabase.from('conversation_members').insert([
          { 
            conversation_id: newConvo.id, 
            member_name: userName, 
            member_role: role || 'user',
            member_avatar: userAvatar 
          },
          { 
            conversation_id: newConvo.id, 
            member_name: match.name || 'User', 
            member_role: role === 'mentor' ? 'mentee' : 'mentor',
            member_avatar: matchAvatar
          }
        ]);

        setActiveConversationId(newConvo.id);
      } catch (err) {
        console.error('Error creating conversation:', err);
      }
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.date || !meetingForm.time) return;
    setScheduling(true);
    const scheduledAt = new Date(`${meetingForm.date}T${meetingForm.time}`);
    await createMeeting({
      pairing_id: null,
      mentor_id: role === 'mentor' ? profile?.id || null : (chatTarget?.id as string) || null,
      mentee_id: role === 'mentee' ? profile?.id || null : (chatTarget?.id as string) || null,
      title: meetingForm.title,
      meeting_link: meetingForm.link || null,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: 30,
      notes: null,
    });
    const dateStr = scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    await sendChatMessage(`📅 Meeting scheduled: ${meetingForm.title} on ${dateStr} at ${timeStr}${meetingForm.link ? ` — ${meetingForm.link}` : ''}`);
    setMeetingForm({ title: '', date: '', time: '', link: '' });
    setShowSchedule(false);
    setScheduling(false);
  };

  if (profileLoading || loading) {
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

      {/* Search Bar */}
      <div className="relative mb-8 max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Search ${roleLabel} by name, field, or interest...`}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10">
          <Sparkles size={14} className="text-primary" />
          <span className="text-sm font-bold text-primary">{filteredMatches.length}</span>
          <span className="text-xs text-on-surface-variant">potential {roleLabel}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200/50">
          <UserCheck size={14} className="text-green-600" />
          <span className="text-sm font-bold text-green-700">{connectedIds.size}</span>
          <span className="text-xs text-on-surface-variant">connected</span>
        </div>
      </div>

      {/* Match Grid */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 text-on-surface-variant/20 mx-auto mb-4" />
          <p className="text-on-surface-variant italic">No matches found. Try broadening your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMatches.map((match, i) => {
            const matchId = match.id as string;
            const isConnected = connectedIds.has(matchId);
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
                transition={{ delay: Math.min(i * 0.04, 0.5) }}
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
                        {match.research_interests.slice(0, 3).map(interest => (
                          <span key={interest} className="px-2.5 py-1 bg-primary/5 text-primary text-[9px] font-bold rounded-lg">{interest}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
                    {isConnected ? (
                      <button
                        onClick={() => openChat(match)}
                        className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-100 transition-colors"
                      >
                        <MessageSquare size={14} />
                        Send Message
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

      {/* Chat Slide-Over */}
      <AnimatePresence>
        {chatTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setChatTarget(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
            >
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center gap-3 bg-surface-container-lowest">
                <img
                  src={chatTarget.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatTarget.name || 'User')}&background=002045&color=fff`}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-primary truncate">{chatTarget.name}</h3>
                  <p className="text-[10px] text-on-surface-variant">
                    {role === 'mentor' ? (chatTarget as any).major : (chatTarget as any).dept}
                  </p>
                </div>
                <button
                  onClick={() => setShowSchedule(true)}
                  className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
                  title="Schedule a meeting"
                >
                  <CalendarPlus size={16} className="text-primary" />
                </button>
                <button
                  onClick={() => setChatTarget(null)}
                  className="p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  <X size={16} className="text-on-surface-variant" />
                </button>
              </div>

              {/* Chat Messages */}
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
                  chatMessages.map(msg => {
                    const isSelf = msg.sender_type === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                          isSelf
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-surface-container-low text-on-surface rounded-bl-md'
                        }`}>
                          {msg.content}
                          <div className={`text-[9px] mt-1 ${isSelf ? 'text-white/50' : 'text-on-surface-variant/50'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Schedule Meeting Mini-Form */}
              <AnimatePresence>
                {showSchedule && (
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
                      required type="text" placeholder="Meeting title"
                      value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/20 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required type="date" value={meetingForm.date}
                        onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        required type="time" value={meetingForm.time}
                        onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <input
                      type="text" placeholder="Google Meet / Teams link"
                      value={meetingForm.link} onChange={e => setMeetingForm({ ...meetingForm, link: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/20 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit" disabled={scheduling}
                      className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {scheduling ? <Loader2 size={12} className="animate-spin" /> : <CalendarPlus size={12} />}
                      {scheduling ? 'Scheduling...' : 'Schedule'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Chat Input */}
              <div className="px-4 py-3 border-t border-outline-variant/10 bg-surface-container-lowest">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
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
