import { useState, useMemo } from 'react';
import { Plus, Sparkles, History, X, CheckCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MentorCard from '../components/MentorCard';
import MenteeCard from '../components/MenteeCard';
import PairingPanel from '../components/PairingPanel';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { MENTORS, MENTEES, Mentor, Mentee } from '../types';

interface Pairing {
  id: string;
  mentor: Mentor;
  mentee: Mentee;
  score: number;
  date: string;
}

function getCompatibilityScore(mentor: Mentor, mentee: Mentee): number {
  const tagMap: Record<string, string[]> = {
    Physics: ['Quantum Mechanics', 'Ethics'],
    Biology: ['Genomics', 'Lab Mgmt'],
    History: ['Latin', 'Archiving'],
  };
  const relevantTags = tagMap[mentee.major] || [];
  const overlap = mentor.tags.filter((t) => relevantTags.includes(t)).length;
  const base = overlap > 0 ? 70 + overlap * 12 : 40 + Math.random() * 20;
  return Math.min(Math.round(base + Math.random() * 8), 99);
}

export default function Pairing() {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAutoMatch, setShowAutoMatch] = useState(false);
  const [addType, setAddType] = useState<'mentor' | 'mentee'>('mentor');

  // Form state for add modal
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formProgram, setFormProgram] = useState('');
  const [formMajor, setFormMajor] = useState('');
  const [formTags, setFormTags] = useState('');

  const pairedMentorIds = new Set(pairings.map((p) => p.mentor.id));
  const pairedMenteeIds = new Set(pairings.map((p) => p.mentee.id));

  const availableMentors = MENTORS.filter((m) => !pairedMentorIds.has(m.id));
  const availableMentees = MENTEES.filter((m) => !pairedMenteeIds.has(m.id));

  const autoMatchResults = useMemo(() => {
    if (!showAutoMatch) return [];
    return availableMentors.flatMap((mentor) =>
      availableMentees.map((mentee) => ({
        mentor,
        mentee,
        score: getCompatibilityScore(mentor, mentee),
      }))
    ).sort((a, b) => b.score - a.score).slice(0, 3);
  }, [showAutoMatch, availableMentors, availableMentees]);

  const handleConfirmPairing = (mentor: Mentor, mentee: Mentee, score: number) => {
    setPairings((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        mentor,
        mentee,
        score,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      },
    ]);
    setShowAutoMatch(false);
    setSelectedMentor(null);
    setSelectedMentee(null);
  };

  const resetAddForm = () => {
    setFormName('');
    setFormDept('');
    setFormProgram('');
    setFormMajor('');
    setFormTags('');
  };

  return (
    <PageTransition>
      <PageHeader
        title="Academic Pairing Hub"
        description="Curating scholarly connections. Select profiles to match mentors with the right mentees."
        actions={
          <button
            onClick={() => {
              setShowAutoMatch(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-transform hover:shadow-xl"
          >
            <Sparkles size={16} />
            Auto-Match
          </button>
        }
      />

      {/* Auto-Match Results Banner */}
      <AnimatePresence>
        {showAutoMatch && autoMatchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary/5 to-primary-container/10 rounded-3xl p-6 border border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-primary" />
                  <h3 className="font-headline font-bold text-primary">AI-Suggested Matches</h3>
                </div>
                <button onClick={() => setShowAutoMatch(false)} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                  <X size={16} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {autoMatchResults.map((result, i) => (
                  <motion.div
                    key={`${result.mentor.id}-${result.mentee.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <img src={result.mentor.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <span className="text-xs text-on-surface-variant">↔</span>
                      <img src={result.mentee.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <div className="ml-auto px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-extrabold">
                        {result.score}%
                      </div>
                    </div>
                    <p className="text-xs font-bold text-primary">{result.mentor.name}</p>
                    <p className="text-[10px] text-on-surface-variant mb-1">with {result.mentee.name}</p>
                    <button
                      onClick={() => handleConfirmPairing(result.mentor, result.mentee, result.score)}
                      className="w-full mt-2 py-2 text-xs font-bold text-primary bg-surface-container-low rounded-xl hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={12} /> Confirm
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[calc(100vh-340px)]">
        {/* Mentors Column */}
        <section className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              <h2 className="font-headline font-bold text-lg text-primary">Available Mentors</h2>
            </div>
            <span className="px-2 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">
              {availableMentors.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
            <AnimatePresence>
              {availableMentors.map((mentor, i) => (
                <motion.div
                  key={mentor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <MentorCard
                    mentor={mentor}
                    isSelected={selectedMentor?.id === mentor.id}
                    onClick={() => setSelectedMentor(mentor === selectedMentor ? null : mentor)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Mentees Column */}
        <section className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-on-surface-variant opacity-40"></span>
              <h2 className="font-headline font-bold text-lg text-primary">Unpaired Mentees</h2>
            </div>
            <span className="px-2 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">
              {availableMentees.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
            <AnimatePresence>
              {availableMentees.map((mentee, i) => (
                <motion.div
                  key={mentee.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <MenteeCard
                    mentee={mentee}
                    isSelected={selectedMentee?.id === mentee.id}
                    onClick={() => setSelectedMentee(mentee === selectedMentee ? null : mentee)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Pairing Panel */}
        <div className="h-full">
          <PairingPanel
            selectedMentor={selectedMentor}
            selectedMentee={selectedMentee}
          />
        </div>
      </div>

      {/* Pairing History */}
      {pairings.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-primary" />
            <h2 className="font-headline font-bold text-lg text-primary">Pairing History</h2>
            <span className="px-2 py-0.5 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">
              {pairings.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pairings.map((pairing, i) => (
              <motion.div
                key={pairing.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img src={pairing.mentor.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-on-surface-variant">↔</span>
                  </div>
                  <img src={pairing.mentee.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                  <div className="ml-auto px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-extrabold">
                    {pairing.score}%
                  </div>
                </div>
                <p className="text-sm font-bold text-primary">{pairing.mentor.name}</p>
                <p className="text-xs text-on-surface-variant">
                  paired with <span className="font-semibold">{pairing.mentee.name}</span>
                </p>
                <p className="text-[10px] text-on-surface-variant mt-2 flex items-center gap-1">
                  <CheckCircle size={10} className="text-green-600" /> Confirmed — {pairing.date}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { resetAddForm(); setShowAddModal(true); }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary-container text-on-primary shadow-2xl flex items-center justify-center z-50 hover:shadow-primary/30 transition-shadow"
      >
        <Plus size={24} />
      </motion.button>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add New ${addType === 'mentor' ? 'Mentor' : 'Mentee'}`}
        icon={Plus}
      >
        <div className="space-y-5">
          {/* Type Toggle */}
          <div className="flex bg-surface-container-low rounded-xl p-1">
            <button
              onClick={() => setAddType('mentor')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                addType === 'mentor' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant'
              }`}
            >
              Mentor
            </button>
            <button
              onClick={() => setAddType('mentee')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                addType === 'mentee' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant'
              }`}
            >
              Mentee
            </button>
          </div>

          {/* Common Fields */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10 transition-all placeholder:text-on-surface-variant/40"
            />
          </div>

          {addType === 'mentor' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Department</label>
                <input
                  type="text"
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  placeholder="e.g. Dept. of Computer Science"
                  className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10 transition-all placeholder:text-on-surface-variant/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Expertise Tags</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. Machine Learning, AI Ethics (comma-separated)"
                  className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10 transition-all placeholder:text-on-surface-variant/40"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Program</label>
                <select
                  value={formProgram}
                  onChange={(e) => setFormProgram(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10 transition-all"
                >
                  <option value="">Select program</option>
                  <option value="PhD Candidate">PhD Candidate</option>
                  <option value="Masters">Masters</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postdoctoral">Postdoctoral</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Major</label>
                <input
                  type="text"
                  value={formMajor}
                  onChange={(e) => setFormMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10 transition-all placeholder:text-on-surface-variant/40"
                />
              </div>
            </>
          )}

          <button
            onClick={() => setShowAddModal(false)}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform hover:shadow-xl mt-2"
          >
            <Plus size={18} />
            Add {addType === 'mentor' ? 'Mentor' : 'Mentee'}
          </button>
        </div>
      </Modal>
    </PageTransition>
  );
}
