import React, { useState, useRef, useEffect } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Loader2, CalendarPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { useMessages } from '../hooks/useMessages';
import { useMeetings } from '../hooks/useMeetings';
import { useUserProfile } from '../hooks/useUserProfile';

import { useUser } from '@clerk/clerk-react';

export default function Messages() {
  const { user } = useUser();
  const {
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    loadingConversations,
    loadingMessages,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTypingIndicator
  } = useMessages();
  
  const { createMeeting } = useMeetings();
  const { profile, role } = useUserProfile();

  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', link: '', notes: '' });
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeConvo = conversations.find((c) => c.id === activeConversationId);

  const filteredConversations = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Clear typing indicator timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    await sendMessage(newMessage);
    setNewMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim() !== '') {
      sendTypingIndicator(true);
      
      // Debounce the 'stopped typing' event
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 2000);
    } else {
      sendTypingIndicator(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Messages"
        description="Stay connected with your mentors and mentees."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        {/* Conversation List */}
        <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant/10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingConversations ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : filteredConversations.map((convo) => {
              const otherMember = convo.members.find(m => m.member_role !== 'owner') || convo.members[0];
              const dateObj = convo.lastMessage ? new Date(convo.lastMessage.created_at) : new Date(convo.updated_at);
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              const isOnline = otherMember ? onlineUsers.has(otherMember.member_name) : false;
              const isTyping = otherMember ? typingUsers.has(otherMember.member_name) : false;

              return (
                <motion.button
                  key={convo.id}
                  whileHover={{ backgroundColor: 'rgba(0,32,69,0.04)' }}
                  onClick={() => setActiveConversationId(convo.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                    activeConversationId === convo.id ? 'bg-primary/5 border-l-3 border-primary' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={otherMember?.member_avatar || 'https://via.placeholder.com/150'} 
                      alt={convo.title || 'Conversation'} 
                      className="w-11 h-11 rounded-xl object-cover" 
                    />
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-primary truncate">{convo.title || otherMember?.member_name}</p>
                      <span className="text-[10px] text-on-surface-variant whitespace-nowrap ml-2">{timeStr}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${isTyping ? 'text-primary font-medium italic' : 'text-on-surface-variant'}`}>
                      {isTyping ? 'typing...' : (convo.lastMessage?.content || 'No messages yet')}
                    </p>
                  </div>
                  {convo.unreadCount > 0 && !isTyping && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {convo.unreadCount}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Chat Area */}
        <section className="lg:col-span-2 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeConvo ? (
              <motion.div
                key={activeConvo.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full"
              >
                {/* Chat Header */}
                <div className="flex items-center justify-between p-5 border-b border-outline-variant/10 shadow-sm z-10 shrink-0">
                  <div className="flex items-center gap-3">
                    <img 
                      src={activeConvo.members.find(m => m.member_role !== 'owner')?.member_avatar || 'https://via.placeholder.com/150'} 
                      alt={activeConvo.title || ''} 
                      className="w-10 h-10 rounded-xl object-cover" 
                    />
                    <div>
                      <p className="text-sm font-bold text-primary">{activeConvo.title}</p>
                      <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5">
                        {activeConvo.members.some(m => onlineUsers.has(m.member_name)) ? (
                          <><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online</>
                        ) : (
                          <><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Offline</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                      <Phone size={16} className="text-on-surface-variant" />
                    </button>
                    <button className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                      <Video size={16} className="text-on-surface-variant" />
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="p-2 rounded-xl hover:bg-primary/10 transition-colors group"
                      title="Schedule a meeting"
                    >
                      <CalendarPlus size={16} className="text-primary group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                      <MoreVertical size={16} className="text-on-surface-variant" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar flex flex-col">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  ) : messages.map((msg, i) => {
                    const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isSelf = msg.sender_type === user?.id; // Identify own message by Clerk ID
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                            isSelf
                              ? 'bg-primary text-white rounded-br-lg shadow-md shadow-primary/10'
                              : 'bg-surface-container-low text-on-surface rounded-bl-lg border border-outline-variant/5'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1.5 ${isSelf ? 'text-white/60' : 'text-on-surface-variant/60'}`}>
                            {timeStr}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Typing Indicator Bubble */}
                  {activeConvo.members.some(m => typingUsers.has(m.member_name)) && (
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
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-outline-variant/10 bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <button type="button" className="p-2.5 rounded-xl hover:bg-surface-container-low transition-colors">
                      <Paperclip size={18} className="text-on-surface-variant" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20"
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim()}
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
                <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                  <Send size={28} className="text-on-surface-variant" />
                </div>
                <h3 className="font-headline font-bold text-primary mb-2">No Conversation Selected</h3>
                <p className="text-sm text-on-surface-variant max-w-[280px]">
                  Select a conversation from the list to start messaging.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Schedule Meeting Modal */}
      <AnimatePresence>
        {showScheduleModal && (
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
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-lg text-primary">Schedule a Meeting</h3>
                <button onClick={() => setShowScheduleModal(false)} className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!meetingForm.title || !meetingForm.date || !meetingForm.time) return;
                  setSchedulingMeeting(true);

                  const scheduledAt = new Date(`${meetingForm.date}T${meetingForm.time}`);

                  await createMeeting({
                    pairing_id: null,
                    mentor_id: role === 'mentor' ? profile?.id || null : null,
                    mentee_id: role === 'mentee' ? profile?.id || null : null,
                    title: meetingForm.title,
                    meeting_link: meetingForm.link || null,
                    scheduled_at: scheduledAt.toISOString(),
                    duration_minutes: 30,
                    notes: meetingForm.notes || null,
                  });

                  const dateStr = scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const timeStr = scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const meetingMsg = `📅 Meeting scheduled: ${meetingForm.title} on ${dateStr} at ${timeStr}${meetingForm.link ? ` — ${meetingForm.link}` : ''}`;
                  await sendMessage(meetingMsg);

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
                    onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
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
                      onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Time *</label>
                    <input
                      required
                      type="time"
                      value={meetingForm.time}
                      onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Meeting Link (Google Meet / Teams)</label>
                  <input
                    type="text"
                    placeholder="e.g. meet.google.com/abc-defg-hij"
                    value={meetingForm.link}
                    onChange={e => setMeetingForm({ ...meetingForm, link: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any agenda items or notes..."
                    value={meetingForm.notes}
                    onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={schedulingMeeting}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {schedulingMeeting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling...</>
                  ) : (
                    <><CalendarPlus size={16} /> Schedule Meeting</>
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
