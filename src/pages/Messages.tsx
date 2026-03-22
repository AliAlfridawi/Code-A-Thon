import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarPlus, Check, Loader2, Search, Send, Video, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { useMessages, type ConversationMessage } from '../hooks/useMessages';
import { useMeetings, type MeetingDecision } from '../hooks/useMeetings';
import {
  buildMeetingScheduledAt,
  formatMeetingDateParts,
  getMeetingStatusClasses,
} from '../utils/dateUtils';

function getMeetingCardTitle(message: ConversationMessage) {
  if (message.message_type === 'meeting_response') {
    return message.meeting?.status === 'accepted' ? 'Meeting Accepted' : 'Meeting Rejected';
  }

  return 'Meeting Request';
}

function getMeetingCardNote(
  message: ConversationMessage,
  currentUserId: string | undefined,
  isArchivedConversation: boolean
) {
  if (!message.meeting) {
    return null;
  }

  if (message.message_type === 'meeting_response') {
    return message.meeting.status === 'accepted'
      ? `${message.sender_name} accepted this meeting request.`
      : `${message.sender_name} rejected this meeting request.`;
  }

  if (message.meeting.status === 'accepted') {
    return 'This meeting is confirmed and now appears on both users\' calendars.';
  }

  if (message.meeting.status === 'rejected') {
    return 'This meeting request was declined. Send a new request to reschedule.';
  }

  if (isArchivedConversation) {
    return 'Archived conversations cannot respond to meeting requests.';
  }

  return message.meeting.created_by === currentUserId
    ? 'Waiting for the other participant to respond.'
    : 'Respond to this request below.';
}

interface MeetingMessageCardProps {
  currentUserId?: string;
  isArchivedConversation: boolean;
  message: ConversationMessage;
  onRespond: (meetingId: string, decision: MeetingDecision) => Promise<void>;
  respondingDecision: MeetingDecision | null;
  respondingMeetingId: string | null;
}

const MeetingMessageCard: React.FC<MeetingMessageCardProps> = ({
  currentUserId,
  isArchivedConversation,
  message,
  onRespond,
  respondingDecision,
  respondingMeetingId,
}) => {
  if (!message.meeting) {
    return null;
  }

  const { meeting } = message;
  const { fullDate, time } = formatMeetingDateParts(meeting.scheduled_at);
  const isPending = meeting.status === 'pending';
  const canRespond =
    message.message_type === 'meeting_request' &&
    isPending &&
    meeting.created_by !== currentUserId &&
    !isArchivedConversation;
  const isResponding = respondingMeetingId === meeting.id;
  const sentAt = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const note = getMeetingCardNote(message, currentUserId, isArchivedConversation);

  return (
    <div className="max-w-[78%] rounded-2xl border border-primary/10 bg-white p-4 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
            {getMeetingCardTitle(message)}
          </p>
          <h4 className="mt-1 text-sm font-bold text-primary">{meeting.title}</h4>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getMeetingStatusClasses(meeting.status)}`}>
          {meeting.status}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-xs text-on-surface-variant">
        <p>
          {fullDate} at {time}
        </p>
        <p>{meeting.duration_minutes} min</p>
        {meeting.notes ? <p>{meeting.notes}</p> : null}
      </div>

      {meeting.meeting_link ? (
        <a
          href={meeting.meeting_link.startsWith('http') ? meeting.meeting_link : `https://${meeting.meeting_link}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
        >
          <Video size={12} />
          Open Meeting Link
        </a>
      ) : null}

      {note ? <p className="mt-4 text-xs text-on-surface-variant">{note}</p> : null}

      {canRespond ? (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void onRespond(meeting.id, 'rejected')}
            disabled={isResponding}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResponding && respondingDecision === 'rejected' ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Rejecting
              </>
            ) : (
              <>
                <X size={12} />
                Reject
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => void onRespond(meeting.id, 'accepted')}
            disabled={isResponding}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResponding && respondingDecision === 'accepted' ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Accepting
              </>
            ) : (
              <>
                <Check size={12} />
                Accept
              </>
            )}
          </button>
        </div>
      ) : null}

      <p className="mt-4 text-[10px] text-on-surface-variant/70">{sentAt}</p>
    </div>
  );
};

export default function Messages() {
  const { user } = useUser();
  const {
    conversations,
    activeConversation,
    messages,
    activeConversationId,
    setActiveConversationId,
    loadingConversations,
    loadingMessages,
    onlineUserIds,
    typingUserIds,
    sendMessage,
    sendTypingIndicator,
    ensureConversation,
    refreshConversations,
    refreshMessages,
    conversationLoadError,
    messagingDebugState,
  } = useMessages();
  const { requestMeeting, respondToMeeting } = useMeetings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', link: '', notes: '' });
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [respondingMeetingId, setRespondingMeetingId] = useState<string | null>(null);
  const [respondingDecision, setRespondingDecision] = useState<MeetingDecision | null>(null);
  const [meetingActionError, setMeetingActionError] = useState<string | null>(null);
  const [isResolvingRequestedConversation, setIsResolvingRequestedConversation] = useState(false);
  const [requestedConversationError, setRequestedConversationError] = useState<string | null>(null);
  const [requestedConversationDebugMessage, setRequestedConversationDebugMessage] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestedPairingId = searchParams.get('pairing');
  const requestedConversationId = searchParams.get('conversation');
  const isDev = import.meta.env.DEV;

  const isArchivedConversation = activeConversation?.pairing_status === 'completed';
  const isCounterpartOnline = activeConversation
    ? activeConversation.counterpart_clerk_user_id !== null && onlineUserIds.has(activeConversation.counterpart_clerk_user_id)
    : false;
  const isCounterpartTyping = activeConversation
    ? activeConversation.counterpart_clerk_user_id !== null && typingUserIds.has(activeConversation.counterpart_clerk_user_id)
    : false;

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversation.counterpart_display_name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery]
  );

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || isArchivedConversation) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await sendMessage(newMessage);
    setNewMessage('');
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setNewMessage(nextValue);

    if (isArchivedConversation) {
      return;
    }

    if (nextValue.trim()) {
      void sendTypingIndicator(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        void sendTypingIndicator(false);
      }, 2000);
    } else {
      void sendTypingIndicator(false);
    }
  };

  const handleMeetingResponse = async (meetingId: string, decision: MeetingDecision) => {
    setMeetingActionError(null);
    setRespondingMeetingId(meetingId);
    setRespondingDecision(decision);

    const result = await respondToMeeting(meetingId, decision);

    if (result.error) {
      setMeetingActionError(result.error);
    } else {
      await Promise.all([
        refreshConversations(),
        refreshMessages(),
      ]);
    }

    setRespondingMeetingId(null);
    setRespondingDecision(null);
  };

  useEffect(() => {
    let isCancelled = false;

    async function syncRequestedConversation() {
      if (!requestedConversationId && !requestedPairingId) {
        if (!isCancelled) {
          setIsResolvingRequestedConversation(false);
          setRequestedConversationError(null);
          setRequestedConversationDebugMessage(null);
        }
        return;
      }

      if (!isCancelled) {
        setIsResolvingRequestedConversation(true);
        setRequestedConversationError(null);
        setRequestedConversationDebugMessage(null);
      }

      if (loadingConversations) {
        return;
      }

      if (requestedConversationId) {
        const requestedConversation = conversations.find(
          (conversation) => conversation.conversation_id === requestedConversationId
        );

        if (!requestedConversation) {
          if (!isCancelled) {
            setRequestedConversationError('We could not find that conversation.');
            setRequestedConversationDebugMessage(null);
            setIsResolvingRequestedConversation(false);
          }
          return;
        }

        if (!isCancelled) {
          setActiveConversationId(requestedConversation.conversation_id);
          setSearchParams(new URLSearchParams(), { replace: true });
          setIsResolvingRequestedConversation(false);
        }
        return;
      }

      if (!requestedPairingId) {
        if (!isCancelled) {
          setIsResolvingRequestedConversation(false);
        }
        return;
      }

      const pairedConversation = conversations.find(
        (conversation) => conversation.pairing_id === requestedPairingId
      );

      if (pairedConversation) {
        if (!isCancelled) {
          setActiveConversationId(pairedConversation.conversation_id);
          setSearchParams(new URLSearchParams(), { replace: true });
          setIsResolvingRequestedConversation(false);
        }
        return;
      }

      const { conversationId, error, debugMessage } = await ensureConversation(requestedPairingId);

      if (isCancelled) {
        return;
      }

      if (conversationId) {
        setActiveConversationId(conversationId);
        setSearchParams(new URLSearchParams(), { replace: true });
      } else {
        setRequestedConversationError(error || 'We could not start this conversation right now. Please try again.');
        setRequestedConversationDebugMessage(debugMessage);
      }

      setIsResolvingRequestedConversation(false);
    }

    void syncRequestedConversation();

    return () => {
      isCancelled = true;
    };
  }, [
    conversations,
    ensureConversation,
    loadingConversations,
    requestedConversationId,
    requestedPairingId,
    setActiveConversationId,
    setSearchParams,
  ]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Messages"
        description="Stay connected with your mentors and mentees."
      />

      {isDev && messagingDebugState && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p className="font-semibold">Messaging debug</p>
          <p className="mt-1 break-words">
            <span className="font-medium">{messagingDebugState.source}:</span> {messagingDebugState.message}
          </p>
        </div>
      )}

      {meetingActionError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {meetingActionError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant/10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingConversations && conversations.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : isResolvingRequestedConversation && filteredConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <Loader2 className="animate-spin text-primary" size={24} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">Starting conversation...</p>
                  <p className="text-xs text-on-surface-variant">We&apos;re opening your chat thread now.</p>
                </div>
              </div>
            ) : requestedConversationError && filteredConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertCircle className="text-amber-600" size={24} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">Conversation unavailable</p>
                  <p className="text-xs text-on-surface-variant">{requestedConversationError}</p>
                  {isDev && requestedConversationDebugMessage ? (
                    <p className="rounded-xl bg-surface-container-low px-3 py-2 text-left font-mono text-[11px] text-on-surface-variant">
                      {requestedConversationDebugMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : conversationLoadError && filteredConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertCircle className="text-amber-600" size={24} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">Inbox unavailable</p>
                  <p className="text-xs text-on-surface-variant">{conversationLoadError}</p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-on-surface-variant">
                No conversations yet. Connect with a mentor or mentee to start chatting.
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const previewTime = new Date(
                  conversation.last_message_created_at ?? conversation.conversation_updated_at
                ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isOnline = conversation.counterpart_clerk_user_id !== null && onlineUserIds.has(conversation.counterpart_clerk_user_id);
                const isTyping = conversation.counterpart_clerk_user_id !== null && typingUserIds.has(conversation.counterpart_clerk_user_id);

                return (
                  <motion.button
                    key={conversation.conversation_id}
                    whileHover={{ backgroundColor: 'rgba(0,32,69,0.04)' }}
                    onClick={() => {
                      setActiveConversationId(conversation.conversation_id);
                      setMeetingActionError(null);
                      if (requestedConversationId || requestedPairingId) {
                        setSearchParams(new URLSearchParams(), { replace: true });
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                      activeConversationId === conversation.conversation_id ? 'bg-primary/5 border-l-3 border-primary' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conversation.counterpart_avatar_url || 'https://via.placeholder.com/150'}
                        alt={conversation.counterpart_display_name}
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                      {isOnline ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-primary truncate">
                          {conversation.counterpart_display_name}
                        </p>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap ml-2">
                          {previewTime}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${isTyping ? 'text-primary font-medium italic' : 'text-on-surface-variant'}`}>
                        {isTyping ? 'typing...' : (conversation.last_message_content || 'No messages yet')}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && !isTyping ? (
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conversation.unread_count}
                      </span>
                    ) : null}
                  </motion.button>
                );
              })
            )}
          </div>
        </section>

        <section className="lg:col-span-2 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeConversation ? (
              <motion.div
                key={activeConversation.conversation_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center justify-between p-5 border-b border-outline-variant/10 shadow-sm z-10 shrink-0">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeConversation.counterpart_avatar_url || 'https://via.placeholder.com/150'}
                      alt={activeConversation.counterpart_display_name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {activeConversation.counterpart_display_name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5">
                        {isCounterpartOnline ? (
                          <><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online</>
                        ) : (
                          <><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Offline</>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMeetingActionError(null);
                      setShowScheduleModal(true);
                    }}
                    disabled={Boolean(isArchivedConversation)}
                    className="p-2 rounded-xl hover:bg-primary/10 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isArchivedConversation ? 'Archived conversations cannot schedule meetings' : 'Propose a meeting'}
                  >
                    <CalendarPlus size={16} className="text-primary group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                {isArchivedConversation ? (
                  <div className="px-5 py-3 text-xs font-medium text-amber-800 bg-amber-50 border-b border-amber-200/70">
                    This conversation is archived because the pairing is completed. You can read history, but sending new messages is disabled.
                  </div>
                ) : null}

                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar flex flex-col">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-on-surface-variant italic">
                      No messages yet. Start the conversation.
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const timeStr = new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isSelf = message.sender_clerk_user_id === user?.id;
                      const showMeetingCard = message.message_type !== 'text' && message.meeting;

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.25 }}
                          className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                        >
                          {showMeetingCard ? (
                            <MeetingMessageCard
                              currentUserId={user?.id}
                              isArchivedConversation={Boolean(isArchivedConversation)}
                              message={message}
                              onRespond={handleMeetingResponse}
                              respondingDecision={respondingDecision}
                              respondingMeetingId={respondingMeetingId}
                            />
                          ) : (
                            <div
                              className={`max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                                isSelf
                                  ? 'bg-primary text-white rounded-br-lg shadow-md shadow-primary/10'
                                  : 'bg-surface-container-low text-on-surface rounded-bl-lg border border-outline-variant/5'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className={`text-[10px] mt-1.5 ${isSelf ? 'text-white/60' : 'text-on-surface-variant/60'}`}>
                                {timeStr}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}

                  {isCounterpartTyping && !isArchivedConversation ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-[70%] p-3.5 rounded-2xl bg-surface-container-low rounded-bl-lg border border-outline-variant/5">
                        <div className="flex items-center gap-1.5 h-5">
                          <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                          <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                          <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </div>

                <form onSubmit={handleSend} className="p-4 border-t border-outline-variant/10 bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder={isArchivedConversation ? 'Archived conversation' : 'Type a message...'}
                      disabled={Boolean(isArchivedConversation)}
                      className="flex-1 px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || Boolean(isArchivedConversation)}
                      className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-container transition-colors shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8"
              >
                {isResolvingRequestedConversation ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                      <Loader2 size={28} className="text-primary animate-spin" />
                    </div>
                    <h3 className="font-headline font-bold text-primary mb-2">Preparing Conversation</h3>
                    <p className="text-sm text-on-surface-variant max-w-[280px]">
                      We&apos;re setting up your chat so you can message your connection.
                    </p>
                  </>
                ) : requestedConversationError ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                      <AlertCircle size={28} className="text-amber-600" />
                    </div>
                    <h3 className="font-headline font-bold text-primary mb-2">Conversation Unavailable</h3>
                    <p className="text-sm text-on-surface-variant max-w-[320px] mb-4">
                      {requestedConversationError}
                    </p>
                    {isDev && requestedConversationDebugMessage ? (
                      <p className="mb-4 max-w-[360px] rounded-2xl bg-surface-container-low px-3 py-2 text-left font-mono text-[11px] text-on-surface-variant">
                        {requestedConversationDebugMessage}
                      </p>
                    ) : null}
                    <button
                      onClick={() => {
                        setRequestedConversationError(null);
                        setRequestedConversationDebugMessage(null);
                        setSearchParams(new URLSearchParams(), { replace: true });
                      }}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Back to inbox
                    </button>
                  </>
                ) : conversationLoadError ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                      <AlertCircle size={28} className="text-amber-600" />
                    </div>
                    <h3 className="font-headline font-bold text-primary mb-2">Inbox Unavailable</h3>
                    <p className="text-sm text-on-surface-variant max-w-[320px]">
                      {conversationLoadError}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                      <Send size={28} className="text-on-surface-variant" />
                    </div>
                    <h3 className="font-headline font-bold text-primary mb-2">No Conversation Selected</h3>
                    <p className="text-sm text-on-surface-variant max-w-[280px]">
                      Select a conversation from the list to start messaging.
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <AnimatePresence>
        {showScheduleModal && activeConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-lg text-primary">Propose a Meeting</h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!meetingForm.title || !meetingForm.date || !meetingForm.time) {
                    return;
                  }

                  setMeetingActionError(null);
                  setSchedulingMeeting(true);
                  const scheduledAt = buildMeetingScheduledAt(meetingForm.date, meetingForm.time);

                  if (!scheduledAt) {
                    setMeetingActionError('Please choose a valid meeting date and time.');
                    setSchedulingMeeting(false);
                    return;
                  }

                  const meetingRequest = await requestMeeting({
                    pairing_id: activeConversation.pairing_id,
                    title: meetingForm.title,
                    meeting_link: meetingForm.link || null,
                    scheduled_at: scheduledAt,
                    duration_minutes: 30,
                    notes: meetingForm.notes || null,
                  });

                  if (meetingRequest.error) {
                    setMeetingActionError(meetingRequest.error);
                    setSchedulingMeeting(false);
                    return;
                  }

                  await Promise.all([
                    refreshConversations(),
                    refreshMessages(activeConversation.conversation_id),
                  ]);

                  setMeetingForm({ title: '', date: '', time: '', link: '', notes: '' });
                  setShowScheduleModal(false);
                  setSchedulingMeeting(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Meeting Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Weekly check-in"
                    value={meetingForm.title}
                    onChange={(event) => setMeetingForm({ ...meetingForm, title: event.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Date *</label>
                    <input
                      required
                      type="date"
                      value={meetingForm.date}
                      onChange={(event) => setMeetingForm({ ...meetingForm, date: event.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Time *</label>
                    <input
                      required
                      type="time"
                      value={meetingForm.time}
                      onChange={(event) => setMeetingForm({ ...meetingForm, time: event.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Meeting Link</label>
                  <input
                    type="text"
                    placeholder="e.g. meet.google.com/abc-defg-hij"
                    value={meetingForm.link}
                    onChange={(event) => setMeetingForm({ ...meetingForm, link: event.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any agenda items or notes..."
                    value={meetingForm.notes}
                    onChange={(event) => setMeetingForm({ ...meetingForm, notes: event.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={schedulingMeeting}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {schedulingMeeting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending request...</>
                  ) : (
                    <><CalendarPlus size={16} /> Send Meeting Request</>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
