import { motion, AnimatePresence } from 'motion/react';
import { X, LucideIcon } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, icon: Icon, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none"
          >
            <div className="w-full max-w-lg pointer-events-auto max-h-[85vh] flex flex-col rounded-3xl border border-outline-variant/10 bg-surface-container-lowest shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-outline-variant/10">
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                      <Icon size={20} className="text-on-primary-fixed" />
                    </div>
                  )}
                  <h2 className="font-headline font-bold text-lg text-primary">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>
              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
