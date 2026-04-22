import { motion } from 'motion/react';

/**
 * Generic skeleton loader component for placeholder UI during loading states
 */
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <motion.div
    className={`bg-gradient-to-r from-surface-container to-surface-container-low animate-pulse ${className}`}
    initial={{ opacity: 0.6 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
  />
);

/**
 * Card skeleton for member/mentor/mentee profile cards
 */
export const CardSkeleton = () => (
  <div className="rounded-lg bg-surface-container-highest p-4 space-y-3">
    <Skeleton className="h-4 w-3/4 rounded" />
    <Skeleton className="h-3 w-full rounded" />
    <Skeleton className="h-3 w-5/6 rounded" />
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-2 w-12 rounded-full" />
      <Skeleton className="h-2 w-16 rounded-full" />
    </div>
  </div>
);

/**
 * List skeleton for multiple card items
 */
export const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Message skeleton for chat/messaging UI
 */
export const MessageSkeleton = ({ isOwn = false }: { isOwn?: boolean }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
    <div className={`max-w-xs space-y-2 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
      <Skeleton className={`h-10 ${isOwn ? 'w-40' : 'w-48'} rounded-lg`} />
      <Skeleton className="h-3 w-24 rounded" />
    </div>
  </div>
);

/**
 * Conversation list skeleton
 */
export const ConversationListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-full rounded" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Table row skeleton for admin/analytics views
 */
export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => (
  <div className="flex gap-3 border-b border-surface-container-low p-4">
    {Array.from({ length: columns }).map((_, i) => (
      <div key={i}>
        <Skeleton className="h-4 flex-1 rounded" />
      </div>
    ))}
  </div>
);
