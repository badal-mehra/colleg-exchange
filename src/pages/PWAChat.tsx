import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Send, User, Shield, Loader2, Check, CheckCheck, MessageCircle, Phone, MoreVertical, Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import TypingIndicator from '@/components/TypingIndicator'; 

const MESSAGES_PER_PAGE = 50;
const TYPING_TIMEOUT = 2000; 

interface Profile {
  id?: string;
  user_id: string;
  full_name: string;
  email?: string;
  is_verified?: boolean;
  verification_status?: string;
  avatar_url?: string | null; 
  mck_id?: string;
}

interface Item {
  id: string;
  title: string;
  price: number;
  images: string[];
}

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  item_id: string;
  created_at: string;
  updated_at?: string; 
  items: Item;
  buyer_profile: Profile;
  seller_profile: Profile;
}

interface Message {
  id: string | number; 
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  is_optimistic?: boolean; 
}

const MessageStatus: React.FC<{ isRead: boolean, isSending: boolean }> = ({ isRead, isSending }) => {
  if (isSending) {
    return <Loader2 className="h-3 w-3 text-primary-foreground/60 animate-spin" />;
  }
  return isRead ? (
    <CheckCheck className="h-3 w-3 text-blue-400" />
  ) : (
    <Check className="h-3 w-3 text-primary-foreground/60" />
  );
};

const formatLastSeen = (timestamp: string | null): string => {
  if (!timestamp) return 'Offline';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Active now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

const PWAChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>(); 
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [conversationLoading, setConversationLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [fetchingOldMessages, setFetchingOldMessages] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const previousScrollHeightRef = useRef(0); 
  const channelsRef = useRef<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const otherUser = useMemo(() => {
    if (!conversation || !user) return null;
    return user.id === conversation.buyer_id 
      ? conversation.seller_profile 
      : conversation.buyer_profile;
  }, [conversation, user]);

  const otherUserId = useMemo(() => {
    if (!conversation || !user) return null;
    return user.id === conversation.buyer_id 
      ? conversation.seller_id 
      : conversation.buyer_id;
  }, [conversation, user]);

  const getOtherUserAvatarUrl = useMemo(() => {
    return otherUser?.avatar_url || undefined;
  }, [otherUser]);

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const markMessagesAsRead = useCallback(() => {
    if (!conversationId || !user) return;
    const timeoutId = `read-${conversationId}`;
    if ((window as any)[timeoutId]) clearTimeout((window as any)[timeoutId]);
    
    (window as any)[timeoutId] = setTimeout(async () => {
      try {
        await supabase.rpc('mark_messages_read', {
          conv_id: conversationId,
          uid: user.id
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }, 500); 
  }, [conversationId, user]);

  const handleTyping = () => {
    if (!conversationId || !user) return;

    supabase.channel(`typing-${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, isTyping: true }
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`typing-${conversationId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, isTyping: false }
      });
    }, TYPING_TIMEOUT);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user || sending) return;

    const messageContent = newMessage.trim();
    const tempId = Date.now(); 
    
    const optimisticMessage: Message = {
      id: tempId, 
      content: messageContent,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      is_read: false,
      is_optimistic: true, 
    };

    setMessages(prev => [...prev.filter(m => m.id !== tempId), optimisticMessage]); 
    setNewMessage('');
    setSending(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    supabase.channel(`typing-${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, isTyping: false }
    });

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent
      })
      .select()
      .single();

    setSending(false);

    if (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const remaining = prev.filter(m => m.id !== tempId);
        toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
        setNewMessage(messageContent);
        return remaining;
      });
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, is_optimistic: false } : m));
    }
  };

  const fetchMessages = useCallback(async (pageToFetch: number, initialLoad: boolean) => {
    if (!conversationId || (!hasMoreMessages && pageToFetch > 1)) return;
    
    if (initialLoad) setMessagesLoading(true);
    if (pageToFetch > 1) {
      setFetchingOldMessages(true);
      previousScrollHeightRef.current = messagesContainerRef.current?.scrollHeight || 0;
    }

    const offset = (pageToFetch - 1) * MESSAGES_PER_PAGE;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }) 
      .range(offset, offset + MESSAGES_PER_PAGE - 1); 

    if (error) {
      console.error('Error fetching messages:', error);
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
    } else {
      const newMessages = (data || []).reverse() as Message[];
      
      setMessages(prev => {
        if (pageToFetch === 1) {
          return newMessages;
        } else {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
          return [...uniqueNewMessages, ...prev];
        }
      });
      
      setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);
      setPage(pageToFetch);

      if (initialLoad) {
        setInitialLoadComplete(true);
        setTimeout(() => scrollToBottom('auto'), 100); 
      }
    }
    setFetchingOldMessages(false);
    if (initialLoad) setMessagesLoading(false);
  }, [conversationId, hasMoreMessages, scrollToBottom, toast]);

  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !user) return;
      setConversationLoading(true);

      try {
        const { data: conversationData, error } = await supabase
          .from('conversations')
          .select(`
            buyer_id, seller_id, item_id, created_at, id,
            items (title, price, images)
          `)
          .eq('id', conversationId)
          .single();

        if (error || !conversationData) {
          console.error('Error fetching conversation:', error);
          toast({ title: "Error", description: "Conversation not found", variant: "destructive" });
          navigate('/my-chats'); 
          return;
        }
        
        const userIdsToFetch = [conversationData.buyer_id, conversationData.seller_id];

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, is_verified, verification_status, avatar_url, mck_id, trust_seller_badge')
          .in('user_id', userIdsToFetch);
          
        const buyerProfile = profilesData?.find(p => p.user_id === conversationData.buyer_id) || { full_name: 'Unknown User' };
        const sellerProfile = profilesData?.find(p => p.user_id === conversationData.seller_id) || { full_name: 'Unknown User' };

        setConversation({
          ...conversationData,
          items: { ...conversationData.items, id: conversationData.item_id } as Item,
          buyer_profile: buyerProfile as Profile,
          seller_profile: sellerProfile as Profile
        });

      } catch (error) {
        console.error('Error in fetchConversation:', error);
        toast({ title: "Error", description: "Failed to load conversation", variant: "destructive" });
      } finally {
        setConversationLoading(false);
      }
    };

    if (conversationId && user) {
      fetchConversation();
      fetchMessages(1, true); 
    } else if (!conversationId) {
      setConversationLoading(false);
      setMessagesLoading(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, user, fetchMessages, navigate, toast]);
  
  useEffect(() => {
    if (!conversation || !user || !otherUserId) {
      return;
    }
    
    const cleanupChannels = () => {
      channelsRef.current.forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel).catch(console.error);
        }
      });
      channelsRef.current = [];
    };

    const messageChannel = supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) {
            return prev;
          }
          if (prev.some(m => m.sender_id === newMessage.sender_id && m.content === newMessage.content && m.is_optimistic)) {
            return prev.map(m => m.is_optimistic && m.sender_id === newMessage.sender_id && m.content === newMessage.content ? { ...newMessage, is_optimistic: false } : m);
          }
          return [...prev, newMessage];
        });
        
        if (newMessage.sender_id !== user.id) {
          markMessagesAsRead();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const updatedMessage = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
      })
      .subscribe();
      
    const presenceChannel = supabase.channel(`presence-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const allPresences = Object.values(state).flat() as any[];
        const isOnline = allPresences.some((p: any) => p.user_id === otherUserId);
        setIsOtherUserOnline(isOnline);
        
        if (!isOnline) {
          const otherUserPresence = allPresences.find((p: any) => p.user_id === otherUserId);
          setLastSeen(otherUserPresence?.last_seen || null);
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const isOtherUser = newPresences.some((p: any) => p.user_id === otherUserId);
        if (isOtherUser) {
          setIsOtherUserOnline(true);
          setLastSeen(null);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const isOtherUser = leftPresences.some((p: any) => p.user_id === otherUserId);
        if (isOtherUser) {
          setIsOtherUserOnline(false);
          setLastSeen(new Date().toISOString()); 
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    const typingChannel = supabase.channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === otherUserId) {
          setIsOtherUserTyping(payload.isTyping);
        }
      })
      .subscribe();

    channelsRef.current = [messageChannel, presenceChannel, typingChannel];
    markMessagesAsRead(); 

    return cleanupChannels; 
  }, [conversation, user, otherUserId, conversationId, markMessagesAsRead]); 

  useEffect(() => {
    if (initialLoadComplete && messages.length > 0) {
      const container = messagesContainerRef.current;
      const isNearBottom = container && (container.scrollHeight - container.scrollTop < container.clientHeight + 300);

      if (isNearBottom || messages[messages.length - 1].sender_id === user?.id) {
        scrollToBottom('smooth');
      }
    }
  }, [messages.length, user, initialLoadComplete, scrollToBottom]); 
  
  useEffect(() => {
    if (fetchingOldMessages === false && page > 1) {
      const currentScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
      const heightDifference = currentScrollHeight - previousScrollHeightRef.current;
      
      if (messagesContainerRef.current && heightDifference > 0) {
        messagesContainerRef.current.scrollTop += heightDifference; 
      }
    }
  }, [messages, fetchingOldMessages, page]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && hasMoreMessages && !fetchingOldMessages && initialLoadComplete) {
      if (container.scrollTop < container.clientHeight * 0.1) {
        fetchMessages(page + 1, false);
      }
    }
  };

  const navigateToProfile = () => {
    if (otherUser?.mck_id) {
      navigate(`/profile/${otherUser.mck_id}`);
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  if (conversationLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center safe-area-inset">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <p className="mt-4 text-muted-foreground font-medium">Loading chat...</p>
      </div>
    );
  }

  if (!conversation || !otherUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6 safe-area-inset">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <MessageCircle className="h-10 w-10 text-destructive" />
        </div>
        <h3 className="text-xl font-bold mb-2">Chat Not Found</h3>
        <p className="text-muted-foreground mb-6">This conversation may have been deleted.</p>
        <Button onClick={() => navigate('/my-chats')} className="rounded-full px-6">
          Back to Chats
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Native-style Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b safe-area-top">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-2 md:px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/my-chats')}
            className="h-10 w-10 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer active:opacity-70 transition-opacity"
            onClick={navigateToProfile}
          >
            <div className="relative">
              <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-background shadow-md">
                <AvatarImage src={getOtherUserAvatarUrl} alt={otherUser.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {otherUser.full_name?.charAt(0) || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              {isOtherUserOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold text-base md:text-lg truncate">
                  {otherUser.full_name || 'User'}
                </h2>
                {otherUser.verification_status === 'approved' && (
                  <Shield className="h-4 w-4 fill-green-500 text-green-500 flex-shrink-0" />
                )}
              </div>
              <p className={`text-xs md:text-sm truncate ${isOtherUserOnline ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
                {isOtherUserOnline ? 'Online' : formatLastSeen(lastSeen)}
              </p>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-muted hidden md:flex"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-muted"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Item Preview Bar */}
        {conversation.items && (
          <div 
            className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-2 bg-muted/50 border-t cursor-pointer active:bg-muted transition-colors"
            onClick={() => navigate(`/item/${conversation.items.id}`)}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {conversation.items.images?.[0] ? (
                <img 
                  src={conversation.items.images[0]} 
                  alt={conversation.items.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base font-medium truncate">{conversation.items.title}</p>
              <p className="text-xs md:text-sm text-primary font-semibold">₹{conversation.items.price.toLocaleString()}</p>
            </div>
          </div>
        )}
      </header>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 md:px-6 py-4"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(var(--muted)/0.3) 0%, transparent 100%)'
        }}
      >
        <div className="max-w-4xl mx-auto">
        {fetchingOldMessages && (
          <div className="flex justify-center py-3">
            <div className="bg-muted/80 backdrop-blur-sm rounded-full px-4 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          </div>
        )}
        
        {messagesLoading && messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {messages.length === 0 && !messagesLoading ? (
          <div className="h-full flex items-center justify-center px-6">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <div>
                <p className="font-bold text-xl mb-1">Start the Conversation</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Send a message about "{conversation.items?.title}"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="flex justify-center my-4">
                  <span className="bg-muted/80 backdrop-blur-sm text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                    {formatDateHeader(dateKey)}
                  </span>
                </div>

                {/* Messages for this date */}
                {dateMessages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  const isOptimistic = message.is_optimistic;
                  const prevMessage = dateMessages[index - 1];
                  const nextMessage = dateMessages[index + 1];
                  const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
                  const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}
                    >
                      {!isOwnMessage && (
                        <div className={`w-8 mr-2 ${showAvatar ? '' : 'invisible'}`}>
                          <Avatar 
                            onClick={navigateToProfile}
                            className="h-8 w-8 cursor-pointer shadow-sm"
                          >
                            <AvatarImage src={getOtherUserAvatarUrl} alt={otherUser.full_name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                              {otherUser.full_name?.charAt(0) || <User className="h-3 w-3" />}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] md:max-w-[60%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`
                            px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap
                            ${isOwnMessage 
                              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md' 
                              : 'bg-card border border-border/50 rounded-2xl rounded-bl-md shadow-sm' 
                            }
                            ${isOptimistic ? 'opacity-60' : ''}
                          `}
                        >
                          {message.content}
                        </div>
                        
                        {isLastInGroup && (
                          <div className={`flex items-center gap-1 mt-1 px-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isOwnMessage && (
                              <MessageStatus isRead={message.is_read} isSending={isOptimistic || false} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {isOtherUserTyping && (
              <div className="flex gap-2 justify-start mb-2">
                <Avatar className="h-8 w-8 shadow-sm">
                  <AvatarImage src={getOtherUserAvatarUrl} alt={otherUser.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs">
                    {otherUser.full_name?.charAt(0) || <User className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
                <TypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
        </div>
      </div>

      {/* Native-style Input */}
      <div className="border-t bg-background/95 backdrop-blur-xl p-3 md:p-4 safe-area-bottom">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Message..."
              className="w-full rounded-full pl-4 pr-12 py-3 h-12 md:h-14 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary text-base md:text-lg"
              disabled={sending}
            />
          </div>
          <Button 
            type="submit" 
            size="icon"
            disabled={sending || !newMessage.trim()}
            className={`
              rounded-full h-12 w-12 md:h-14 md:w-14 transition-all duration-200 shadow-lg
              ${newMessage.trim() 
                ? 'bg-primary hover:bg-primary/90 scale-100' 
                : 'bg-muted hover:bg-muted scale-95 opacity-50'
              }
            `}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
            ) : (
              <Send className="h-5 w-5 md:h-6 md:w-6" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PWAChat;
