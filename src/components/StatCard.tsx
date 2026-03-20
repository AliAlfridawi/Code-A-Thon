import { motion } from 'motion/react';
import { LucideIcon, TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  iconColor: string;
  delay?: number;
}

export default function StatCard({ label, value, icon: Icon, gradient, iconBg, iconColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg cursor-default group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon size={20} className={iconColor} />
        </div>
        <TrendingUp size={16} className="text-white/40 group-hover:text-white/60 transition-colors" />
      </div>
      <motion.p
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.15, duration: 0.4, type: 'spring', stiffness: 200 }}
        className="text-3xl font-headline font-extrabold mb-1"
      >
        {value}
      </motion.p>
      <p className="text-sm text-white/70 font-medium">{label}</p>
      {/* Decorative elements */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5 group-hover:scale-150 transition-transform duration-500" />
      <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-white/5 group-hover:scale-150 transition-transform duration-700" />
    </motion.div>
  );
}
