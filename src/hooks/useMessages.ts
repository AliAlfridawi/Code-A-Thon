import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from './useSupabase';
import type { MessageRow } from '../types';
import type { Database } from '../types/database.types';

export type ConversationSummary = Database['public']['Functions']['get_my_conversations']['Returns'][number];
export interface EnsureConversationResult {
  conversationId: string | null;
  error: string | null;
}

function upsertMessage(list: MessageRow[], message: MessageRow) {
  if (list.some((entry) => entry.id === message.id)) {
    return list;
  }

  return [...list, message].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function updateConversationWithMessage(
  conversations: ConversationSummary[],
  message: MessageRow,
  currentUserId: string,
  activeConversationId: string | null
) {
  const index = conversations.findIndex((conversation) => conversation.conversation_id === message.conversation_id);

  if (index === -1) {
    return conversations;
  }

  const conversation = conversations[index];
  const shouldCountUnread =
    message.sender_clerk_user_id !== currentUserId && conversation.conversation_id !== activeConversationId;

  const updatedConversation: ConversationSummary = {
    ...conversation,
    conversation_updated_at: message.created_at,
    last_message_content: message.content,
    last_message_created_at: message.created_at,
    last_message_sender_clerk_user_id: message.sender_clerk_user_id,
    last_message_sender_name: message.sender_name,
    unread_count: shouldCountUnread ? conversation.unread_count + 1 : conversation.unread_count,
  };

  const next = conversations.slice();
  next.splice(index, 1);
  next.unshift(updatedConversation);
  return next;
}

export function useMessages() {
  const { user } = useUser();
  const supabase = useSupabase();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const [activeChannel, setActiveChannel] = useState<RealtimeChannel | null>(null);
  const refreshRequestIdRef = useRef(0);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.conversation_id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const refreshConversations = useCallback(async () => {
    const requestId = ++refreshRequestIdRef.current;

    if (!user) {
      if (requestId === refreshRequestIdRef.current) {
        setConversations([]);
        setActiveConversationId(null);
        setLoadingConversations(false);
      }
      return [];
    }

    setLoadingConversations(true);

    const { data, error } = await supabase.rpc('get_my_conversations');

    if (requestId !== refreshRequestIdRef.current) {
      return data ?? [];
    }

    if (error) {
      console.error('Error loading conversations:', error);
      setLoadingConversations(false);
      return [];
    }

    const nextConversations = data ?? [];
    setConversations(nextConversations);
    setActiveConversationId((current) => {
      if (current && nextConversations.some((conversation) => conversation.conversation_id === current)) {
        return current;
      }

      return nextConversations[0]?.conversation_id ?? null;
    });
    setLoadingConversations(false);
    return nextConversations;
  }, [supabase, user]);

  const markConversationRead = useCallback(async (conversationId: string) => {
    if (!user) {
      return;
    }

    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from('conversation_members')
      .update({ last_read_at: readAt })
      .eq('conversation_id', conversationId)
      .eq('clerk_user_id', user.id);

    if (error) {
      console.error('Error marking conversation as read:', error);
      return;
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.conversation_id === conversationId
          ? {
              ...conversation,
              my_last_read_at: readAt,
              unread_count: 0,
            }
          : conversation
      )
    );
  }, [supabase, user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setMessages(data ?? []);
    setLoadingMessages(false);
    await markConversationRead(conversationId);
  }, [markConversationRead, supabase]);

  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!activeChannel || !user) {
      return;
    }

    await activeChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        clerk_user_id: user.id,
        display_name: user.fullName ?? user.firstName ?? 'You',
        is_typing: isTyping,
      },
    });
  }, [activeChannel, user]);

  const sendMessage = useCallback(async (content: string, conversationId = activeConversationId) => {
    if (!user || !conversationId) {
      return null;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return null;
    }

    await sendTypingIndicator(false);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_clerk_user_id: user.id,
        sender_name: user.fullName ?? user.firstName ?? 'You',
        content: trimmedContent,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    setMessages((current) => {
      if (conversationId !== activeConversationId) {
        return current;
      }

      return upsertMessage(current, data);
    });

    setConversations((current) => updateConversationWithMessage(current, data, user.id, activeConversationId));
    return data;
  }, [activeConversationId, sendTypingIndicator, supabase, user]);

  const ensureConversation = useCallback(async (pairingId: string): Promise<EnsureConversationResult> => {
    if (!user) {
      return {
        conversationId: null,
        error: 'You must be signed in to start a conversation.',
      };
    }

    const { data, error } = await supabase
      .rpc('ensure_pairing_conversation', { pairing_id: pairingId })
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.error(`Error ensuring pairing conversation for pairing ${pairingId}:`, error);
      }

      return {
        conversationId: null,
        error: error.message || 'Could not start this conversation right now.',
      };
    }

    const nextConversations = await refreshConversations();
    const ensuredConversationId = data.conversation_id;

    setActiveConversationId(
      nextConversations.find((conversation) => conversation.conversation_id === ensuredConversationId)?.conversation_id
        ?? ensuredConversationId
    );

    return {
      conversationId: ensuredConversationId,
      error: null,
    };
  }, [refreshConversations, supabase, user]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    if (!activeConversationId) {
      setMessages([]);
      setTypingUserIds(new Set());
      setOnlineUserIds(new Set());
      return;
    }

    void fetchMessages(activeConversationId);
  }, [activeConversationId, fetchMessages, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const inboxChannel = supabase
      .channel(`inbox:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const nextMessage = payload.new as MessageRow;

          setConversations((current) => {
            const hasConversation = current.some(
              (conversation) => conversation.conversation_id === nextMessage.conversation_id
            );

            if (!hasConversation) {
              void refreshConversations();
              return current;
            }

            return updateConversationWithMessage(current, nextMessage, user.id, activeConversationId);
          });

          if (nextMessage.conversation_id === activeConversationId) {
            setMessages((current) => upsertMessage(current, nextMessage));

            if (nextMessage.sender_clerk_user_id !== user.id) {
              void markConversationRead(nextMessage.conversation_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(inboxChannel);
    };
  }, [activeConversationId, markConversationRead, refreshConversations, supabase, user]);

  useEffect(() => {
    if (!activeConversationId || !user) {
      return;
    }

    const channel = supabase.channel(`conversation:${activeConversationId}`, {
      config: {
        presence: { key: user.id },
        broadcast: { ack: true },
      },
    });

    setActiveChannel(channel);
    setOnlineUserIds(new Set());
    setTypingUserIds(new Set());

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const online = new Set<string>();

        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.clerk_user_id) {
              online.add(presence.clerk_user_id);
            }
          });
        });

        setOnlineUserIds(online);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUserIds((current) => {
          const next = new Set(current);

          if (!payload?.clerk_user_id || payload.clerk_user_id === user.id) {
            return next;
          }

          if (payload.is_typing) {
            next.add(payload.clerk_user_id);
          } else {
            next.delete(payload.clerk_user_id);
          }

          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            clerk_user_id: user.id,
            display_name: user.fullName ?? user.firstName ?? 'You',
          });
        }
      });

    return () => {
      setOnlineUserIds(new Set());
      setTypingUserIds(new Set());
      void supabase.removeChannel(channel);
      setActiveChannel(null);
    };
  }, [activeConversationId, supabase, user]);

  return {
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
    refreshConversations,
    ensureConversation,
    markConversationRead,
  };
}
