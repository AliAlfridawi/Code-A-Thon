import { Search, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Mentor, Mentee } from '../types';

interface PairingPanelProps {
  selectedMentor: Mentor | null;
  selectedMentee: Mentee | null;
  compatibilityScore: number | null;
}

function getResearchAlignment(mentor: Mentor, mentee: Mentee): number {
  if (!mentee.interests || mentee.interests.length === 0) return 40;
  const menteeInterests = mentee.interests.map((i) => i.toLowerCase());
  const overlap = mentor.tags.filter((t) =>
    menteeInterests.includes(t.toLowerCase())
  ).length;
  const maxOverlap = Math.max(mentor.tags.length, mentee.interests.length, 1);
  return Math.round(40 + (overlap / maxOverlap) * 55);
}

function getAcademicReadiness(mentee: Mentee): number {
  switch (mentee.program) {
    case 'Postdoctoral': return 96;
    case 'PhD Candidate': return 88;
    case 'Masters': return 74;
    case 'Undergraduate': return 60;
    default: return 65;
  }
}

export default function PairingPanel({ selectedMentor, selectedMentee, compatibilityScore }: PairingPanelProps) {
  const hasSelection = selectedMentor || selectedMentee;

  const researchAlignment = selectedMentor && selectedMentee
    ? getResearchAlignment(selectedMentor, selectedMentee)
    : selectedMentor ? 80 : 0;

  const academicReadiness = selectedMentee
    ? getAcademicReadiness(selectedMentee)
    : 0;

  return (
    <section className="bg-surface-container-low rounded-3xl p-6 flex flex-col h-full border border-outline-variant/10">
      <div className="mb-6">
        <h2 className="font-headline font-bold text-lg text-primary mb-1">Pairing Profile</h2>
        <p className="text-xs text-on-surface-variant">Select a profile to view compatibility details</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <AnimatePresence mode="wait">
          {!hasSelection ? (
            <motion.div
              key="no-selection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                <Search size={32} className="text-on-surface-variant" />
              </div>
              <h3 className="font-headline font-bold text-primary mb-2">No Selection</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-[240px]">
                Click on any mentor or mentee card to reveal deeper academic insights, research alignment scores, and availability schedules.
              </p>
              <div className="mt-8 w-full space-y-3">
                <div className="h-4 bg-surface-container-highest rounded-full w-3/4 mx-auto animate-pulse"></div>
                <div className="h-4 bg-surface-container-highest rounded-full w-1/2 mx-auto animate-pulse"></div>
                <div className="h-4 bg-surface-container-highest rounded-full w-2/3 mx-auto animate-pulse"></div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-6"
            >
              {selectedMentor && (
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={selectedMentor.avatar} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-primary">{selectedMentor.name}</p>
                      <p className="text-[10px] text-on-surface-variant">Mentor</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-on-surface-variant">
                      <span>Research Alignment</span>
                      <span>{researchAlignment}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div
                        key={`ra-${researchAlignment}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${researchAlignment}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMentee && (
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={selectedMentee.avatar} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-primary">{selectedMentee.name}</p>
                      <p className="text-[10px] text-on-surface-variant">Mentee</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-on-surface-variant">
                      <span>Academic Readiness</span>
                      <span>{academicReadiness}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div
                        key={`ar-${academicReadiness}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${academicReadiness}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-primary-container"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMentor && selectedMentee && compatibilityScore !== null && (
                <div className="p-4 bg-primary-fixed rounded-2xl text-on-primary-fixed">
                  <p className="text-xs font-bold mb-1">Compatibility Score</p>
                  <p className="text-2xl font-headline font-extrabold">{compatibilityScore}%</p>
                  <p className="text-[10px] mt-2 opacity-70 italic">Based on profile interests, field relevance, and academic level</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-6 border-t border-outline-variant/20">
        <button className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <Users size={18} />
          <span>Match by Profile</span>
        </button>
      </div>
    </section>
  );
}
