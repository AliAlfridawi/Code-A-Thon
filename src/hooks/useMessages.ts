import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ConversationRow, ConversationMemberRow, MessageRow } from '../types';
import { useUser } from '@clerk/clerk-react';

export type ConversationWithMembers = ConversationRow & {
  members: ConversationMemberRow[];
  lastMessage?: MessageRow;
  unreadCount: number;
};

export function useMessages() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<ConversationWithMembers[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Realtime Presence & Broadcast state
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [activeChannel, setActiveChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch all conversations
  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoadingConversations(true);
        // In a real app we'd filter by current user's membership.
        // For this demo, we fetch all.
        const { data: convos, error: convosErr } = await supabase
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false });
        if (convosErr) throw convosErr;

        const { data: members, error: membersErr } = await supabase
          .from('conversation_members')
          .select('*');
        if (membersErr) throw membersErr;

        const { data: msgs, error: msgsErr } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });
        if (msgsErr) throw msgsErr;

        const combined = (convos as ConversationRow[]).map(c => {
          const cMembers = (members as ConversationMemberRow[]).filter(m => m.conversation_id === c.id);
          const cMsgs = (msgs as MessageRow[]).filter(m => m.conversation_id === c.id);
          return {
            ...c,
            members: cMembers,
            lastMessage: cMsgs[0],
            unreadCount: cMsgs.filter(m => !m.read_at && m.sender_type !== 'self').length
          };
        });

        setConversations(combined);
        if (combined.length > 0 && !activeConversationId) {
          setActiveConversationId(combined[0].id);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoadingConversations(false);
      }
    }
    fetchConversations();
  }, []);

  // Fetch messages and subscribe to postgres changes + presence + broadcast
  useEffect(() => {
    if (!activeConversationId || !user) return;

    let channel = supabase.channel(`room:${activeConversationId}`, {
      config: {
        presence: { key: user.id },
        broadcast: { ack: true }
      }
    });

    setActiveChannel(channel);

    async function fetchMessages() {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as MessageRow[]);
        
        // Mark as read
        const unreadIds = data.filter(m => !m.read_at && m.sender_type !== 'self').map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
        }
      }
      setLoadingMessages(false);
    }

    fetchMessages();

    // Set up Realtime Subscriptions
    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversationId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as MessageRow]);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        // Iterate over presences and collect online user names
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.online && p.user_name) online.add(p.user_name);
          });
        });
        setOnlineUsers(online);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (payload.isTyping && payload.user_name) {
            next.add(payload.user_name);
          } else if (payload.user_name) {
            next.delete(payload.user_name);
          }
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track({
            user_id: user.id,
            user_name: user.fullName,
            online: true,
          });
        }
      });

    return () => {
      setOnlineUsers(new Set());
      setTypingUsers(new Set());
      supabase.removeChannel(channel);
      setActiveChannel(null);
    };
  }, [activeConversationId, user]);

  const sendMessage = async (content: string) => {
    if (!activeConversationId || !user) return;
    
    // Stop typing indicator instantly when sending
    sendTypingIndicator(false);

    try {
      const { error } = await supabase.from('messages').insert([{
        conversation_id: activeConversationId,
        content,
        sender_name: user.fullName || 'You',
        sender_type: 'self',
        read_at: new Date().toISOString() // Read immediately by sender
      }]);
      
      if (error) throw error;
      
      // Update conversation updated_at
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', activeConversationId);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!activeChannel || !user) return;
    
    await activeChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, user_name: user.fullName, isTyping }
    });
  }, [activeChannel, user]);

  return {
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
  };
}
