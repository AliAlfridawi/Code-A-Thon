import { Users, UserPlus, Handshake, Clock, ArrowRight, Activity, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { useAnalytics } from '../hooks/useAnalytics';
import { useActivity } from '../hooks/useActivity';
import { formatDistanceToNow } from '../utils/dateUtils';
import { ADMIN_PAIRING_ROUTE, MESSAGES_ROUTE, MEMBERS_ROUTE } from '../constants/routes';

// ... (rest of imports)

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
  const { stats, loading: statsLoading } = useAnalytics();
  const { activities, loading: activityLoading } = useActivity();

  const loading = statsLoading || activityLoading;

  const statCardsData = [
    {
      label: 'Total Mentors',
      value: stats.totalMentors,
      icon: Users,
      gradient: 'from-[#002045] to-[#1a365d]',
      iconBg: 'bg-[#d6e3ff]',
      iconColor: 'text-[#001b3c]',
    },
    {
      label: 'Total Mentees',
      value: stats.totalMentees,
      icon: UserPlus,
      gradient: 'from-[#1a365d] to-[#2a4a7f]',
      iconBg: 'bg-[#d6e3ff]',
      iconColor: 'text-[#001b3c]',
    },
    {
      label: 'Active Pairings',
      value: stats.activePairings,
      icon: Handshake,
      gradient: 'from-[#0d3b2e] to-[#14532d]',
      iconBg: 'bg-[#d1fae5]',
      iconColor: 'text-[#064e3b]',
    },
    {
      label: 'Pending Matches',
      value: stats.totalPairings - stats.activePairings,
      icon: Clock,
      gradient: 'from-[#78350f] to-[#92400e]',
      iconBg: 'bg-[#fef3c7]',
      iconColor: 'text-[#78350f]',
    },
  ];

  if (loading) {
    return (
      <PageTransition>
        <div className="flex bg-surface min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Dashboard"
        description="Overview of mentorship activity, pairings, and program health."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {statCardsData.map((stat, i) => (
          <StatCard
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
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">No recent activity.</p>
            ) : (
              activities.map((item, i) => {
                const TypeIcon = activityTypeIcons[item.type] || Handshake;
                // Simple date formatting for now
                const dateObj = new Date(item.created_at);
                const timeStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.3 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface-container-low transition-all cursor-default group"
                  >
                    <div className={`w-9 h-9 rounded-xl ${activityTypeColors[item.type]} flex items-center justify-center shrink-0`}>
                      <TypeIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary">{item.action}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate group-hover:text-clip group-hover:whitespace-normal transition-all">{item.detail}</p>
                    </div>
                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap font-medium">{timeStr}</span>
                  </motion.div>
                );
              })
            )}
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
              to={ADMIN_PAIRING_ROUTE}
              className="block p-5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white hover:shadow-lg hover:shadow-primary/20 transition-all group"
            >
              <Handshake size={22} className="mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-sm">Create New Pairing</p>
              <p className="text-xs text-white/70 mt-1">Match a mentor with a mentee</p>
            </Link>
            <Link
              to={MEMBERS_ROUTE}
              className="block p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 hover:shadow-md transition-all group"
            >
              <UserPlus size={22} className="mb-3 text-primary group-hover:scale-110 transition-transform" />
              <p className="font-bold text-sm text-primary">Add New Member</p>
              <p className="text-xs text-on-surface-variant mt-1">Register a mentor or mentee</p>
            </Link>
            <Link
              to={MESSAGES_ROUTE}
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
