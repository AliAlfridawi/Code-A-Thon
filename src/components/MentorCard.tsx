import { motion } from 'motion/react';
import { Mentor } from '../types';

interface MentorCardProps {
  mentor: Mentor;
  isSelected: boolean;
  onClick: () => void;
  key?: string;
}

export default function MentorCard({ mentor, isSelected, onClick }: MentorCardProps) {
  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={{ y: -2 }}
      className={`p-5 bg-surface-container-lowest rounded-2xl transition-all duration-300 cursor-pointer border-2 ${
        isSelected ? 'border-primary shadow-lg' : 'border-transparent hover:ambient-shadow'
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        <img
          className="w-14 h-14 rounded-xl object-cover"
          src={mentor.avatar}
          alt={mentor.name}
          referrerPolicy="no-referrer"
        />
        <div>
          <h3 className="font-bold text-primary text-base">{mentor.name}</h3>
          <p className="text-xs text-on-surface-variant">{mentor.dept}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {mentor.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded uppercase tracking-wider"
          >
            {tag}
          </span>
        ))}
      </div>
      
      <button className="w-full py-2 bg-surface-container-low text-primary text-sm font-semibold rounded-xl hover:bg-primary hover:text-on-primary transition-colors">
        Match mentee
      </button>
    </motion.div>
  );
}
