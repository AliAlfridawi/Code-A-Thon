import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Star, Heart, MessageSquare, Loader2, Search,
  GraduationCap, BookOpen, FlaskConical, UserCheck, X, Check
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { useSupabase } from '../hooks/useSupabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { usePairings } from '../hooks/usePairings';
import { buildMessagesRoute } from '../constants/routes';
import { calculateMatches, MatchCandidate } from '../services/matchingService';

export default function Matching() {
  const { user } = useUser();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const { profile, role, loading: profileLoading } = useUserProfile();
  const { pairings, loading: pairingsLoading, createPairing, updatePairingStatus, deletePairing } = usePairings();

  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'accept' | 'deny' | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      if (profileLoading) {
        return;
      }

      if (!profile || !role || !user) {
        return;
      }

      setLoading(true);
      const oppositeTable = role === 'mentor' ? 'mentees' : 'mentors';
      const { data, error } = await supabase.from(oppositeTable).select('*');

      if (error) {
        console.error('Error fetching candidates:', error);
        setLoading(false);
        return;
      }

      const eligibleCandidates = (data ?? []).filter((candidate) => candidate.clerk_user_id !== user.id);
      const results = calculateMatches(profile as any, eligibleCandidates, role);
      setMatches(results);
      setFilteredMatches(results);
      setLoading(false);
    }

    if (!profileLoading && (!profile || !role || !user)) {
      setMatches([]);
      setFilteredMatches([]);
      setLoading(false);
      return;
    }

    void fetchMatches();
  }, [profile, profileLoading, role, supabase, user]);

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

    navigate(buildMessagesRoute({ pairingId: pairing.id }));
  };

  const handleAcceptPairing = async (pairingId: string) => {
    setPendingActionId(pairingId);
    setPendingAction('accept');

    try {
      await updatePairingStatus(pairingId, 'active');
      navigate(buildMessagesRoute({ pairingId }));
    } catch (error) {
      console.error('Error accepting pairing request:', error);
    } finally {
      setPendingActionId(null);
      setPendingAction(null);
    }
  };

  const handleDenyPairing = async (pairingId: string, matchName: string) => {
    const shouldDeny = window.confirm(`Deny the pending request from ${matchName}?`);

    if (!shouldDeny) {
      return;
    }

    setPendingActionId(pairingId);
    setPendingAction('deny');

    try {
      await deletePairing(pairingId);
    } catch (error) {
      console.error('Error denying pairing request:', error);
    } finally {
      setPendingActionId(null);
      setPendingAction(null);
    }
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
            const isConnected = Boolean(pairing);
            const isConnecting = connectingId === matchId;
            const isPending = pairing?.status === 'pending';
            const isProcessingPendingAction = pairing ? pendingActionId === pairing.id : false;
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
                      isPending && pairing ? (
                        role === 'mentor' ? (
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void handleDenyPairing(pairing.id, match.name || 'this user')}
                                disabled={isProcessingPendingAction}
                                className="flex-1 py-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isProcessingPendingAction && pendingAction === 'deny' ? (
                                  <><Loader2 size={14} className="animate-spin" /> Denying...</>
                                ) : (
                                  <><X size={14} /> Deny</>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleAcceptPairing(pairing.id)}
                                disabled={isProcessingPendingAction}
                                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-50"
                              >
                                {isProcessingPendingAction && pendingAction === 'accept' ? (
                                  <><Loader2 size={14} className="animate-spin" /> Accepting...</>
                                ) : (
                                  <><Check size={14} /> Accept</>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 py-2.5 bg-amber-50 text-amber-700 font-bold text-xs rounded-xl flex items-center justify-center">
                            Approval Pending
                          </div>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => openChat(match)}
                          className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MessageSquare size={14} />
                          {pairing?.status === 'completed' ? 'View History' : 'Send Message'}
                        </button>
                      )
                    ) : role === 'mentee' ? (
                      <button
                        onClick={() => handleConnect(match)}
                        disabled={isConnecting}
                        className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                      >
                        {isConnecting ? (
                          <><Loader2 size={14} className="animate-spin" /> Requesting...</>
                        ) : (
                          <><Heart size={14} /> Request Pairing</>
                        )}
                      </button>
                    ) : (
                      <div className="flex-1 py-2.5 bg-surface-container-low text-on-surface-variant font-bold text-xs rounded-xl flex items-center justify-center">
                        Mentees must initiate
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
