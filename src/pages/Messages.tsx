import { useState } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  sender: 'self' | 'other';
  text: string;
  time: string;
}

const conversations: Conversation[] = [
  {
    id: '1',
    name: 'Dr. Julian Sterling',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
    lastMessage: "I'd love to discuss the quantum entanglement research proposal.",
    time: '2m ago',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
    lastMessage: 'Thank you for the mentorship guidance!',
    time: '1h ago',
    unread: 0,
    online: true,
  },
  {
    id: '3',
    name: 'Prof. Elena Vance',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150',
    lastMessage: 'The lab results are quite promising.',
    time: '3h ago',
    unread: 1,
    online: false,
  },
  {
    id: '4',
    name: 'Liam Carter',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
    lastMessage: 'Can we schedule the next review session?',
    time: 'Yesterday',
    unread: 0,
    online: false,
  },
  {
    id: '5',
    name: 'Dr. Marcus Thorne',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150',
    lastMessage: 'The archival documents have arrived.',
    time: '2 days ago',
    unread: 0,
    online: false,
  },
];

const messageHistory: Record<string, Message[]> = {
  '1': [
    { id: 'a1', sender: 'other', text: "Hello! I've reviewed the latest research paper you recommended.", time: '10:30 AM' },
    { id: 'a2', sender: 'self', text: "Great! What did you think of the methodology section?", time: '10:32 AM' },
    { id: 'a3', sender: 'other', text: "It was thorough. I particularly liked the approach to quantum state measurement.", time: '10:35 AM' },
    { id: 'a4', sender: 'self', text: "I agree. The error correction technique they proposed is novel.", time: '10:38 AM' },
    { id: 'a5', sender: 'other', text: "I'd love to discuss the quantum entanglement research proposal.", time: '10:40 AM' },
  ],
  '2': [
    { id: 'b1', sender: 'other', text: "Hi! I wanted to update you on my thesis progress.", time: '9:00 AM' },
    { id: 'b2', sender: 'self', text: "Of course! How is the literature review going?", time: '9:05 AM' },
    { id: 'b3', sender: 'other', text: "I've covered 40 papers so far. The genomics section is almost complete.", time: '9:10 AM' },
    { id: 'b4', sender: 'other', text: "Thank you for the mentorship guidance!", time: '9:12 AM' },
  ],
  '3': [
    { id: 'c1', sender: 'other', text: "The new batch of cell cultures is ready for analysis.", time: 'Yesterday' },
    { id: 'c2', sender: 'self', text: "Excellent. Let's run the sequencing protocol tomorrow.", time: 'Yesterday' },
    { id: 'c3', sender: 'other', text: "The lab results are quite promising.", time: '3h ago' },
  ],
};

export default function Messages() {
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const messages = activeConvoId ? messageHistory[activeConvoId] ?? [] : [];

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {filteredConversations.map((convo) => (
              <motion.button
                key={convo.id}
                whileHover={{ backgroundColor: 'rgba(0,32,69,0.04)' }}
                onClick={() => setActiveConvoId(convo.id)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                  activeConvoId === convo.id ? 'bg-primary/5 border-l-3 border-primary' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <img src={convo.avatar} alt={convo.name} className="w-11 h-11 rounded-xl object-cover" />
                  {convo.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary truncate">{convo.name}</p>
                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap ml-2">{convo.time}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">{convo.lastMessage}</p>
                </div>
                {convo.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {convo.unread}
                  </span>
                )}
              </motion.button>
            ))}
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
                <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <img src={activeConvo.avatar} alt={activeConvo.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="text-sm font-bold text-primary">{activeConvo.name}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {activeConvo.online ? '● Online' : '○ Offline'}
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
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className={`flex ${msg.sender === 'self' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'self'
                            ? 'bg-primary text-white rounded-br-lg'
                            : 'bg-surface-container-low text-on-surface rounded-bl-lg'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1.5 ${msg.sender === 'self' ? 'text-white/50' : 'text-on-surface-variant/60'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <button className="p-2.5 rounded-xl hover:bg-surface-container-low transition-colors">
                      <Paperclip size={18} className="text-on-surface-variant" />
                    </button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-container transition-colors">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
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
