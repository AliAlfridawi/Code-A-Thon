import { motion } from 'motion/react';
import { BarChart3, PieChart, TrendingUp, Users, Handshake, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { MENTORS, MENTEES } from '../types';

// --- Data ---

const departmentData = [
  { name: 'Physics', mentors: 1, mentees: 1, color: '#002045' },
  { name: 'Biology', mentors: 1, mentees: 1, color: '#14532d' },
  { name: 'History', mentors: 1, mentees: 1, color: '#78350f' },
  { name: 'Comp Sci', mentors: 0, mentees: 0, color: '#581c87' },
];

const monthlyPairings = [
  { month: 'Oct', value: 2 },
  { month: 'Nov', value: 5 },
  { month: 'Dec', value: 3 },
  { month: 'Jan', value: 7 },
  { month: 'Feb', value: 4 },
  { month: 'Mar', value: 8 },
];

const programMetrics = [
  { label: 'Match Rate', value: '87%', trend: '+12%', up: true, desc: 'of suggested pairings confirmed' },
  { label: 'Avg. Duration', value: '4.2mo', trend: '+0.8', up: true, desc: 'average mentorship length' },
  { label: 'Satisfaction', value: '94%', trend: '+3%', up: true, desc: 'from post-program surveys' },
  { label: 'Drop-off Rate', value: '6%', trend: '-2%', up: false, desc: 'mentorships ended early' },
];

const programBreakdown = [
  { program: 'PhD Candidate', count: 2, pct: 67, color: '#002045' },
  { program: 'Masters', count: 1, pct: 33, color: '#1a365d' },
  { program: 'Undergraduate', count: 0, pct: 0, color: '#2a4a7f' },
  { program: 'Postdoctoral', count: 0, pct: 0, color: '#3b5998' },
];

const maxPairing = Math.max(...monthlyPairings.map((m) => m.value));

// --- Component ---

export default function Analytics() {
  return (
    <PageTransition>
      <PageHeader
        title="Analytics"
        description="Program performance, pairing trends, and department insights."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {programMetrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{metric.label}</p>
              <span className={`flex items-center gap-0.5 text-xs font-bold ${metric.up ? 'text-green-600' : 'text-red-500'}`}>
                {metric.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {metric.trend}
              </span>
            </div>
            <p className="text-3xl font-headline font-extrabold text-primary">{metric.value}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">{metric.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Pairings Over Time — Bar Chart */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-primary" />
            <h2 className="font-headline font-bold text-lg text-primary">Pairings Over Time</h2>
          </div>
          <div className="flex items-end gap-4 h-48 px-2">
            {monthlyPairings.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-primary">{m.value}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(m.value / maxPairing) * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full bg-gradient-to-t from-primary to-primary-container rounded-t-xl min-h-[8px] hover:opacity-80 transition-opacity cursor-default"
                />
                <span className="text-[10px] text-on-surface-variant font-medium">{m.month}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Department Distribution */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={18} className="text-primary" />
            <h2 className="font-headline font-bold text-lg text-primary">Department Distribution</h2>
          </div>
          <div className="space-y-4">
            {departmentData.map((dept, i) => {
              const total = dept.mentors + dept.mentees;
              const maxTotal = Math.max(...departmentData.map((d) => d.mentors + d.mentees), 1);
              const pct = (total / maxTotal) * 100;
              return (
                <motion.div
                  key={dept.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: dept.color }} />
                      <span className="text-sm font-bold text-primary">{dept.name}</span>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      {dept.mentors}M / {dept.mentees}S = {total}
                    </span>
                  </div>
                  <div className="h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5 + i * 0.06, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Program Breakdown */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <Users size={18} className="text-primary" />
            <h2 className="font-headline font-bold text-lg text-primary">By Program</h2>
          </div>
          <div className="space-y-4">
            {programBreakdown.map((prog) => (
              <div key={prog.program} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: prog.color }} />
                  <span className="text-sm font-semibold text-primary">{prog.program}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">{prog.count}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded">
                    {prog.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Summary Stats */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <Target size={18} className="text-primary" />
            <h2 className="font-headline font-bold text-lg text-primary">Program Summary</h2>
          </div>
          <div className="space-y-5">
            {[
              { label: 'Total Members', value: MENTORS.length + MENTEES.length, icon: Users },
              { label: 'Total Pairings (All Time)', value: 29, icon: Handshake },
              { label: 'Active This Semester', value: 8, icon: TrendingUp },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                  <item.icon size={18} className="text-on-primary-fixed" />
                </div>
                <div>
                  <p className="text-2xl font-headline font-extrabold text-primary">{item.value}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Growth Chart */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-primary to-primary-container rounded-3xl p-6 text-white"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} />
            <h2 className="font-headline font-bold text-lg">Growth Trajectory</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-4xl font-headline font-extrabold">+42%</p>
              <p className="text-sm text-white/70 mt-1">Year-over-year growth in pairings</p>
            </div>
            <div className="h-px bg-white/20" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-headline font-extrabold">12</p>
                <p className="text-xs text-white/60">New members this quarter</p>
              </div>
              <div>
                <p className="text-2xl font-headline font-extrabold">3</p>
                <p className="text-xs text-white/60">Departments participating</p>
              </div>
            </div>
            <div className="h-px bg-white/20" />
            <p className="text-xs text-white/50 italic">
              Data represents academic year 2025–2026 metrics.
            </p>
          </div>
        </motion.section>
      </div>
    </PageTransition>
  );
}
