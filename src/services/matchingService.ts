import { MentorRow, MenteeRow } from '../types';

interface Availability {
  day: string;
  hours: string;
}

export type MatchCandidate = (Partial<MentorRow> & Partial<MenteeRow>) & {
  matchScore?: number;
};

/**
 * Calculates match scores between a user and a list of candidates.
 * 
 * Scoring Logic:
 * - Tag/Interest overlap: 40%
 * - Research Interest overlap: 40%
 * - Dept/Major match: 10%
 * - Availability overlap (day match): 10%
 */
export function calculateMatches(
  userProfile: Partial<MentorRow> | Partial<MenteeRow>,
  candidates: (MentorRow | MenteeRow)[],
  role: 'mentor' | 'mentee'
): MatchCandidate[] {
  return candidates.map(candidate => {
    let score = 0;

    // 1. Tag/Interest overlap (40%)
    const userTags = role === 'mentor' 
      ? (userProfile as Partial<MentorRow>).tags || [] 
      : (userProfile as Partial<MenteeRow>).interests || [];
    
    const candidateTags = role === 'mentor'
      ? (candidate as MenteeRow).interests || []
      : (candidate as MentorRow).tags || [];
    
    const tagOverlap = intersect(userTags, candidateTags).length;
    const maxTags = Math.max(userTags.length, candidateTags.length, 1);
    score += (tagOverlap / maxTags) * 40;

    // 2. Research Interest overlap (40%)
    const userResearch = userProfile.research_interests || [];
    const candidateResearch = candidate.research_interests || [];
    const researchOverlap = intersect(userResearch, candidateResearch).length;
    const maxResearch = Math.max(userResearch.length, candidateResearch.length, 1);
    score += (researchOverlap / maxResearch) * 40;

    // 3. Dept/Major match (10%)
    const userDept = role === 'mentor' 
      ? (userProfile as Partial<MentorRow>).dept 
      : (userProfile as Partial<MenteeRow>).major;
    
    const candidateDept = role === 'mentor'
      ? (candidate as MenteeRow).major
      : (candidate as MentorRow).dept;
    
    if (userDept && candidateDept && userDept.toLowerCase() === candidateDept.toLowerCase()) {
      score += 10;
    }

    // 4. Availability overlap (10%)
    const userAvail = parseAvailability(userProfile.availability);
    const candidateAvail = parseAvailability(candidate.availability);
    
    const userDays = new Set(userAvail.map(a => a.day.toLowerCase()));
    const candidateDays = new Set(candidateAvail.map(a => a.day.toLowerCase()));
    
    const dayOverlap = [...userDays].filter(day => candidateDays.has(day)).length;
    const maxDays = Math.max(userDays.size, candidateDays.size, 1);
    score += (dayOverlap / maxDays) * 10;

    return {
      ...candidate,
      matchScore: Math.round(score)
    };
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

function intersect(a: string[], b: string[]) {
  const setB = new Set((b || []).map(i => i.toLowerCase()));
  return (a || []).filter(i => setB.has(i.toLowerCase()));
}

function parseAvailability(avail: any): Availability[] {
  if (Array.isArray(avail)) return avail as Availability[];
  if (typeof avail === 'string') {
    try {
      return JSON.parse(avail);
    } catch (e) {
      return [];
    }
  }
  return [];
}
