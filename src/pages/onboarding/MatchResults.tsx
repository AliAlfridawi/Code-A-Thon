import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../../hooks/useSupabase';
import { UserRole } from '../Onboarding';
import { calculateMatches, MatchCandidate } from '../../services/matchingService';
import { Loader2, CheckCircle2, ArrowRight, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { USER_DASHBOARD_ROUTE } from '../../constants/routes';

interface MatchResultsProps {
  role: UserRole;
  formData: any;
}

export function MatchResults({ role, formData }: MatchResultsProps) {
  const { user } = useUser();
  const supabase = useSupabase();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);

  useEffect(() => {
    async function fetchAndMatch() {
      if (!user) {
        setLoading(false);
        return;
      }

      const oppositeTable = role === 'mentor' ? 'mentees' : 'mentors';
      const { data, error } = await supabase.from(oppositeTable).select('*');

      if (error) {
        console.error('Error fetching candidates:', error);
        setLoading(false);
        return;
      }

      const eligibleCandidates = (data ?? []).filter((candidate) => candidate.clerk_user_id !== user.id);
      const results = calculateMatches(formData, eligibleCandidates, role);
      setMatches(results.slice(0, 5));
      setLoading(false);
    }

    fetchAndMatch();
  }, [formData, role, supabase, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-semibold">Finding your perfect matches...</h2>
        <p className="text-muted-foreground">Analyzing profiles and interests</p>
      </div>
    );
  }

  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-700 rounded-full mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Profile Complete!</h1>
        <p className="text-muted-foreground">Based on your interests, we've found some great matches for you.</p>
      </div>

      <div className="space-y-4 mb-12">
        {matches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors shadow-sm"
          >
            <img 
              src={match.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name)}`} 
              alt={match.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1 text-left">
              <h3 className="font-bold text-lg">{match.name}</h3>
              <p className="text-sm text-muted-foreground">
                {role === 'mentor' ? (match as any).major : (match as any).dept}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(role === 'mentor' ? (match as any).interests : (match as any).tags)?.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary font-bold text-xl">
                <Sparkles className="h-5 w-5" />
                {match.matchScore}%
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Match Score</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 mb-8">
        <h3 className="text-xl font-bold mb-2">Ready to start?</h3>
        <p className="text-muted-foreground mb-6">
          You can now access your dashboard to connect with your matches and start your journey.
        </p>
        <button
          onClick={() => navigate(USER_DASHBOARD_ROUTE)}
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20 group"
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
