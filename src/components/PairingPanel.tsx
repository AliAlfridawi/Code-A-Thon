import { Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Mentor, Mentee } from '../types';

interface PairingPanelProps {
  selectedMentor: Mentor | null;
  selectedMentee: Mentee | null;
}

export default function PairingPanel({ selectedMentor, selectedMentee }: PairingPanelProps) {
  const hasSelection = selectedMentor || selectedMentee;

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
                      <span>94%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '94%' }}
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
                      <span>88%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '88%' }}
                        className="h-full bg-primary-container"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMentor && selectedMentee && (
                <div className="p-4 bg-primary-fixed rounded-2xl text-on-primary-fixed">
                  <p className="text-xs font-bold mb-1">Compatibility Score</p>
                  <p className="text-2xl font-headline font-extrabold">91.5%</p>
                  <p className="text-[10px] mt-2 opacity-70 italic">Based on research interests and availability</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-6 border-t border-outline-variant/20">
        <button className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <Sparkles size={18} />
          <span>Auto-Match Candidates</span>
        </button>
      </div>
    </section>
  );
}
