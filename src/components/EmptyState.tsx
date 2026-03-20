import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
        <Icon size={28} className="text-on-surface-variant" />
      </div>
      <h3 className="font-headline font-bold text-primary mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-[280px] leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-container transition-colors active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
