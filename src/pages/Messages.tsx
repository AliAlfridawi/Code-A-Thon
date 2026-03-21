import { useState, useRef, useEffect } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { useMessages } from '../hooks/useMessages';

export default function Messages() {
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
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
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className={`flex ${msg.sender_type === 'self' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                            msg.sender_type === 'self'
                              ? 'bg-primary text-white rounded-br-lg shadow-md shadow-primary/10'
                              : 'bg-surface-container-low text-on-surface rounded-bl-lg border border-outline-variant/5'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1.5 ${msg.sender_type === 'self' ? 'text-white/60' : 'text-on-surface-variant/60'}`}>
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
    </PageTransition>
  );
}
