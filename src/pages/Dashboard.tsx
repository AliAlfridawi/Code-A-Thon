import { Users, UserPlus, Handshake, Clock, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MENTORS, MENTEES } from '../types';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';

const stats = [
  {
    label: 'Total Mentors',
    value: MENTORS.length,
    icon: Users,
    gradient: 'from-[#002045] to-[#1a365d]',
    iconBg: 'bg-[#d6e3ff]',
    iconColor: 'text-[#001b3c]',
  },
  {
    label: 'Total Mentees',
    value: MENTEES.length,
    icon: UserPlus,
    gradient: 'from-[#1a365d] to-[#2a4a7f]',
    iconBg: 'bg-[#d6e3ff]',
    iconColor: 'text-[#001b3c]',
  },
  {
    label: 'Active Pairings',
    value: 2,
    icon: Handshake,
    gradient: 'from-[#0d3b2e] to-[#14532d]',
    iconBg: 'bg-[#d1fae5]',
    iconColor: 'text-[#064e3b]',
  },
  {
    label: 'Pending Matches',
    value: 4,
    icon: Clock,
    gradient: 'from-[#78350f] to-[#92400e]',
    iconBg: 'bg-[#fef3c7]',
    iconColor: 'text-[#78350f]',
  },
];

const recentActivity = [
  {
    id: 1,
    action: 'New pairing created',
    detail: 'Dr. Julian Sterling ↔ Liam Carter',
    time: '2 hours ago',
    type: 'pairing' as const,
  },
  {
    id: 2,
    action: 'Mentee registered',
    detail: 'Sarah Jenkins joined as a Masters student',
    time: '5 hours ago',
    type: 'registration' as const,
  },
  {
    id: 3,
    action: 'Profile updated',
    detail: 'Prof. Elena Vance added new expertise tags',
    time: '1 day ago',
    type: 'update' as const,
  },
  {
    id: 4,
    action: 'Meeting scheduled',
    detail: 'Dr. Marcus Thorne & David Chen — Initial consultation',
    time: '2 days ago',
    type: 'meeting' as const,
  },
  {
    id: 5,
    action: 'Pairing completed',
    detail: 'Prof. Elena Vance ↔ Sarah Jenkins — 6-month program',
    time: '3 days ago',
    type: 'pairing' as const,
  },
];

const activityTypeColors: Record<string, string> = {
  pairing: 'bg-primary/10 text-primary',
  registration: 'bg-green-100 text-green-700',
  update: 'bg-amber-100 text-amber-700',
  meeting: 'bg-violet-100 text-violet-700',
};

const activityTypeIcons: Record<string, typeof Handshake> = {
  pairing: Handshake,
  registration: UserPlus,
  update: Activity,
  meeting: Clock,
};

export default function Dashboard() {
  return (
    <PageTransition>
      <PageHeader
        title="Dashboard"
        description="Overview of mentorship activity, pairings, and program health."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            gradient={stat.gradient}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
            delay={i * 0.08}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="xl:col-span-2 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              <h2 className="font-headline font-bold text-lg text-primary">Recent Activity</h2>
            </div>
            <button className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {recentActivity.map((item, i) => {
              const TypeIcon = activityTypeIcons[item.type] || Handshake;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface-container-low transition-all cursor-default"
                >
                  <div className={`w-9 h-9 rounded-xl ${activityTypeColors[item.type]} flex items-center justify-center shrink-0`}>
                    <TypeIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary">{item.action}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">{item.detail}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant whitespace-nowrap font-medium">{item.time}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10 flex flex-col"
        >
          <h2 className="font-headline font-bold text-lg text-primary mb-6">Quick Actions</h2>
          <div className="space-y-4 flex-1">
            <Link
              to="/pairing"
              className="block p-5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white hover:shadow-lg hover:shadow-primary/20 transition-all group"
            >
              <Handshake size={22} className="mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-sm">Create New Pairing</p>
              <p className="text-xs text-white/70 mt-1">Match a mentor with a mentee</p>
            </Link>
            <Link
              to="/members"
              className="block p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 hover:shadow-md transition-all group"
            >
              <UserPlus size={22} className="mb-3 text-primary group-hover:scale-110 transition-transform" />
              <p className="font-bold text-sm text-primary">Add New Member</p>
              <p className="text-xs text-on-surface-variant mt-1">Register a mentor or mentee</p>
            </Link>
            <Link
              to="/messages"
              className="block p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 hover:shadow-md transition-all group"
            >
              <Activity size={22} className="mb-3 text-primary group-hover:scale-110 transition-transform" />
              <p className="font-bold text-sm text-primary">View Messages</p>
              <p className="text-xs text-on-surface-variant mt-1">Check conversations & updates</p>
            </Link>
          </div>
        </motion.section>
      </div>
    </PageTransition>
  );
}
