// Chat.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Send, 
  User,
  Shield,
  Package,
  Loader2,
  Check,
  CheckCheck,
  Circle,
  Clock,
  Image as ImageIcon,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';

// Constants
const MESSAGES_PER_PAGE = 30;
const TYPING_INDICATOR_DURATION = 2000;

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  conversation_id: string;
}

interface Profile {
  full_name: string;
  is_verified?: boolean;
  verification_status?: string;
  avatar_url?: string | null;
  mck_id?: string;
  trust_seller_badge?: boolean;
}

interface Conversation {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  items: {
    title: string;
    price: number;
    images: string[];
  };
  buyer_profile: Profile;
  seller_profile: Profile;
}

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  
  // States
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const presenceChannelRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const messagesChannelRef = useRef<any>(null);

  // Memoized functions
  const formatLastSeen = useCallback((timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      const unreadMessages = messages.filter(
        msg => !msg.is_read && msg.sender_id !== user.id
      );

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(msg => msg.id));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversationId, user, messages]);

  // Data fetching
  const fetchConversation = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          items (title, price, images),
          buyer_profile:profiles!buyer_id(full_name, is_verified, verification_status, avatar_url, mck_id, trust_seller_badge),
          seller_profile:profiles!seller_id(full_name, is_verified, verification_status, avatar_url, mck_id, trust_seller_badge)
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error",
        description: "Conversation not found",
        variant: "destructive",
      });
      navigate('/my-chats');
    }
  }, [conversationId, user, toast, navigate]);

  const fetchMessages = useCallback(async (page = 1, isInitial = false) => {
    if (!conversationId) return;

    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const from = (page - 1) * MESSAGES_PER_PAGE;
      const to = from + MESSAGES_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        const newMessages = data.reverse();
        setMessages(prev => isInitial ? newMessages : [...newMessages, ...prev]);
        setHasMore((count || 0) > to + 1);
      }

      if (isInitial) {
        setTimeout(() => scrollToBottom('auto'), 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [conversationId, toast, scrollToBottom]);

  // Real-time subscriptions
  const setupSubscriptions = useCallback(() => {
    if (!conversationId || !user || !conversation) return;

    const otherUserId = conversation.buyer_id === user.id 
      ? conversation.seller_id 
      : conversation.buyer_id;

    // Presence channel
    presenceChannelRef.current = supabase.channel(`presence-${conversationId}`, {
      config: {
        presence: { key: user.id }
      }
    })
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannelRef.current.presenceState();
      const isOnline = Object.keys(state).includes(otherUserId);
      setIsOtherUserOnline(isOnline);
      
      if (!isOnline) {
        const otherUserState = state[otherUserId] as any[];
        if (otherUserState?.[0]?.last_seen) {
          setLastSeen(otherUserState[0].last_seen);
        }
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannelRef.current.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        });
      }
    });

    // Typing channel
    typingChannelRef.current = supabase.channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === otherUserId) {
          setIsOtherUserTyping(payload.is_typing);
          
          if (payload.is_typing) {
            setTimeout(() => {
              setIsOtherUserTyping(false);
            }, TYPING_INDICATOR_DURATION);
          }
        }
      })
      .subscribe();

    // Messages channel
    messagesChannelRef.current = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          if (newMessage.sender_id !== user.id) {
            setTimeout(markMessagesAsRead, 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      )
      .subscribe();

    return () => {
      presenceChannelRef.current?.unsubscribe();
      typingChannelRef.current?.unsubscribe();
      messagesChannelRef.current?.unsubscribe();
    };
  }, [conversationId, user, conversation, markMessagesAsRead]);

  // Message handling
  const handleTyping = useCallback(() => {
    if (!conversationId || !user || !typingChannelRef.current) return;

    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, is_typing: true }
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, is_typing: false }
      });
    }, TYPING_INDICATOR_DURATION);
  }, [conversationId, user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      is_read: false,
      conversation_id: conversationId
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === tempMessage.id ? data : msg)
      );

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageContent);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Effects
  useEffect(() => {
    if (conversationId && user) {
      Promise.all([fetchConversation(), fetchMessages(1, true)]).then(() => {
        markMessagesAsRead();
      });
    }
  }, [conversationId, user, fetchConversation, fetchMessages, markMessagesAsRead]);

  useEffect(() => {
    const cleanup = setupSubscriptions();
    return cleanup;
  }, [setupSubscriptions]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_id === user?.id || !lastMessage.is_read) {
        scrollToBottom();
      }
    }
  }, [messages, user, scrollToBottom]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = Math.floor(messages.length / MESSAGES_PER_PAGE) + 1;
      fetchMessages(nextPage, false);
    }
  };

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 space-y-4 max-w-md w-full mx-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </Card>
      </div>
    );
  }

  const otherUser = user?.id === conversation.buyer_id 
    ? conversation.seller_profile 
    : conversation.buyer_profile;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-muted/5">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/my-chats')}
              className="hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-full shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm shrink-0">
              <AvatarImage 
                src={otherUser.avatar_url} 
                alt={otherUser.full_name} 
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {otherUser.full_name?.charAt(0) || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold truncate">{otherUser.full_name || 'User'}</h2>
                {otherUser.is_verified && otherUser.verification_status === 'approved' && (
                  <Badge variant="verified" className="h-5 px-1.5">
                    <Shield className="h-3 w-3" />
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {isOtherUserOnline ? (
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-emerald-500" />
                    Online
                  </span>
                ) : lastSeen ? (
                  `Last seen ${formatLastSeen(lastSeen)}`
                ) : (
                  'Offline'
                )}
              </p>
            </div>

            <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Item Info */}
        {conversation.items && (
          <div 
            className="border-t bg-card/50 px-4 py-3 cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => navigate(`/item/${conversation.item_id}`)}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm">
                {conversation.items.images?.[0] ? (
                  <img 
                    src={conversation.items.images[0]} 
                    alt={conversation.items.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{conversation.items.title}</h3>
                <p className="text-base font-bold text-primary">
                  ₹{conversation.items.price.toLocaleString()}
                </p>
              </div>

              <Badge variant="secondary" className="shrink-0">
                View
              </Badge>
            </div>
          </div>
        )}
      </header>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-transparent to-muted/5"
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (scrollTop < 100 && !loadingMore && hasMore) {
            handleLoadMore();
          }
        }}
      >
        {loadingMore && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">Start the conversation</p>
              <p className="text-muted-foreground text-sm">Send a message to begin chatting</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showAvatar = !isOwn && (
                index === 0 || messages[index - 1].sender_id !== message.sender_id
              );

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwn && showAvatar && (
                    <Avatar className="h-8 w-8 mt-1 shrink-0">
                      <AvatarImage src={otherUser.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {otherUser.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {!isOwn && !showAvatar && <div className="w-8 shrink-0" />}

                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card border border-border/50 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <div className={`flex items-center gap-2 mt-2 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isOwn && (
                        message.is_read ? (
                          <CheckCheck className="h-3 w-3 text-accent" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isOtherUserTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {otherUser.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 p-4">
        <form onSubmit={sendMessage} className="flex gap-3">
          <Button type="button" variant="outline" size="icon" className="rounded-full shrink-0">
            <ImageIcon className="h-5 w-5" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 rounded-full px-4 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
            disabled={sending}
          />
          
          <Button 
            type="submit" 
            size="icon"
            disabled={sending || !newMessage.trim()}
            className="rounded-full shrink-0 bg-primary hover:bg-primary/90 transition-all duration-200"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
