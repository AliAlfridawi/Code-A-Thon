import { MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { Mentee } from '../types';

interface MenteeCardProps {
  mentee: Mentee;
  isSelected: boolean;
  onClick: () => void;
  key?: string;
}

export default function MenteeCard({ mentee, isSelected, onClick }: MenteeCardProps) {
  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      className={`p-5 bg-surface-container-lowest rounded-2xl border-2 border-dashed transition-all duration-300 cursor-grab active:cursor-grabbing ${
        isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:border-primary-container/40'
      }`}
    >
      <div className="flex items-center gap-4">
        <img
          className="w-12 h-12 rounded-xl object-cover"
          src={mentee.avatar}
          alt={mentee.name}
          referrerPolicy="no-referrer"
        />
        <div className="flex-1">
          <h3 className="font-bold text-primary text-sm">{mentee.name}</h3>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
            {mentee.program} • {mentee.major}
          </p>
        </div>
        <button className="p-2 text-primary-container hover:bg-primary-fixed rounded-lg transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>
    </motion.div>
  );
}
