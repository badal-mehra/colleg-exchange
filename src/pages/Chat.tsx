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
  Eye, 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import TypingIndicator from '@/components/TypingIndicator';

// Constants for Pagination
const MESSAGES_PER_PAGE = 50;

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
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
  
  // States for Data
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // States for Loading & Status (Separated for better UX)
  const [conversationLoading, setConversationLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  // States for Pagination
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [fetchingOldMessages, setFetchingOldMessages] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const previousScrollHeightRef = useRef(0); 
  
  // Utility Functions ----------------------------------------------------------------

  const formatLastSeen = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      await supabase.rpc('mark_messages_read', {
        conv_id: conversationId,
        uid: user.id
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversationId, user]);


  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);
  

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
    }, 2000);
  };
  

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user || sending) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      is_read: false
    };

    // Optimistically add message
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

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

    if (error) {
      console.error('Error sending message:', error);
      // Revert optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageContent);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else if (data) {
      // Replace optimistic message with server data
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
    
    setSending(false);
  };

  // Data Fetching and Subscriptions ----------------------------------------------------------------

  // Fetch Messages with Pagination
  const fetchMessages = useCallback(async (pageToFetch: number, initialLoad: boolean) => {
    if (!conversationId || (!hasMoreMessages && pageToFetch > 1) || fetchingOldMessages) return;
    
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
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } else {
      const newMessages = (data || []).reverse(); 
      
      setMessages(prev => {
        if (pageToFetch === 1) {
          return newMessages;
        } else {
          return [...newMessages, ...prev];
        }
      });
      
      setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);
      setPage(pageToFetch);

      if (initialLoad) {
        setInitialLoadComplete(true);
        setTimeout(() => scrollToBottom('auto'), 0);
      }
    }
    setFetchingOldMessages(false);
    if (initialLoad) setMessagesLoading(false);
  }, [conversationId, hasMoreMessages, fetchingOldMessages, scrollToBottom, toast]);


  // Fetch Conversation data
  const fetchConversation = async () => {
    if (!conversationId || !user) return;
    setConversationLoading(true);

    const { data: conversationData, error } = await supabase
      .from('conversations')
      .select(`
        *,
        items (title, price, images)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error",
        description: "Conversation not found",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('full_name, is_verified, verification_status, avatar_url, mck_id, trust_seller_badge')
      .eq('user_id', conversationData.buyer_id)
      .maybeSingle();

    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('full_name, is_verified, verification_status, avatar_url, mck_id, trust_seller_badge')
      .eq('user_id', conversationData.seller_id)
      .maybeSingle();

    setConversation({
      ...conversationData,
      buyer_profile: buyerProfile || { full_name: 'Unknown User' },
      seller_profile: sellerProfile || { full_name: 'Unknown User' }
    });
    setConversationLoading(false);
  };
  
  const subscribeToMessages = () => {
    if (!conversationId) return null;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
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
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          if (newMessage.sender_id !== user?.id) {
            setTimeout(markMessagesAsRead, 500);
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
          setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
        }
      )
      .subscribe();

    return channel;
  };
  
  const subscribeToPresence = () => {
    if (!conversationId || !user) return null;

    const otherUserId = conversation?.buyer_id === user.id 
      ? conversation.seller_id 
      : conversation?.buyer_id;

    const channel = supabase.channel(`presence-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const isOnline = Object.values(state).some((presences: any) => 
          presences.some((p: any) => p.user_id === otherUserId)
        );
        setIsOtherUserOnline(isOnline);
        
        if (!isOnline) {
          const allPresences = Object.values(state).flat() as any[];
          const otherUserPresence = allPresences.find((p: any) => p.user_id === otherUserId);
          if (otherUserPresence?.last_seen) {
            setLastSeen(otherUserPresence.last_seen);
          }
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
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return channel;
  };

  const subscribeToTyping = () => {
    if (!conversationId || !user) return null;

    const otherUserId = conversation?.buyer_id === user.id 
      ? conversation.seller_id 
      : conversation?.buyer_id;

    const channel = supabase.channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === otherUserId) {
          setIsOtherUserTyping(payload.isTyping);
        }
      })
      .subscribe();

    return channel;
  };

  // Effects and Handlers ----------------------------------------------------------------

  useEffect(() => {
    if (conversationId && user) {
      fetchConversation();
      fetchMessages(1, true); 
      markMessagesAsRead();
      
      const messageChannel = subscribeToMessages();
      const presenceChannel = subscribeToPresence();
      const typingChannel = subscribeToTyping();
      
      return () => {
        if (messageChannel) supabase.removeChannel(messageChannel);
        if (presenceChannel) supabase.removeChannel(presenceChannel);
        if (typingChannel) supabase.removeChannel(typingChannel);
      };
    }
  }, [conversationId, user, fetchMessages, markMessagesAsRead]);
  
  // Scroll Adjustments useEffect for New Messages
  useEffect(() => {
    if (initialLoadComplete) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessage = lastMessage && (lastMessage.sender_id === user?.id || !lastMessage.is_read); 
      
      if (isNewMessage) {
        scrollToBottom('smooth');
      }
    }
  }, [messages, user, initialLoadComplete, scrollToBottom]); 
  
  // Adjust Scroll Position after Prepending Old Messages
  useEffect(() => {
    if (fetchingOldMessages === false && page > 1) {
      const currentScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
      const heightDifference = currentScrollHeight - previousScrollHeightRef.current;
      
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop += heightDifference; 
      }
    }
  }, [messages, fetchingOldMessages, page]);

  // Handle Scroll Up for Loading Old Messages
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && hasMoreMessages && !fetchingOldMessages && initialLoadComplete) {
      if (container.scrollTop < container.clientHeight * 0.1) {
        fetchMessages(page + 1, false);
      }
    }
  };


  // RENDER LOGIC ----------------------------------------------------------------------

  if (conversationLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading chat details...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 space-y-4 max-w-md w-full mx-4 text-center">
          <p className="text-xl font-semibold">Conversation Not Found</p>
          <Button onClick={() => navigate('/my-chats')}>Go to My Chats</Button>
        </Card>
      </div>
    );
  }
  
  const otherUser = user?.id === conversation.buyer_id 
    ? conversation.seller_profile 
    : conversation.buyer_profile;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* MCK-THEMED HEADER (Improved Look) */}
      <header className="sticky top-0 z-50 w-full border-b bg-background shadow-md flex-shrink-0">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/my-chats')}
              className="h-9 w-9 text-primary hover:bg-primary/10 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
                  <AvatarImage 
                    src={otherUser.avatar_url ? supabase.storage.from('avatars').getPublicUrl(otherUser.avatar_url).data.publicUrl : undefined} 
                    alt={otherUser.full_name} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-base">
                    {otherUser.full_name?.charAt(0) || <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                {isOtherUserOnline && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-emerald-500 text-emerald-500 border-2 border-background rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-bold text-base truncate">{otherUser.full_name || 'User'}</h2>
                  {otherUser.verification_status === 'approved' && (
                    <Badge variant="verified" title="Verified User" className="h-5 px-1.5">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {isOtherUserOnline ? (
                    <span className="text-emerald-500 font-medium">Online</span>
                  ) : lastSeen ? (
                    `Last seen ${formatLastSeen(lastSeen)}`
                  ) : (
                    'Offline'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Item Info Banner */}
      {conversation.items && (
        <div className="border-b bg-card/50 backdrop-blur flex-shrink-0">
          <div 
            className="px-3 sm:px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => navigate(`/item/${conversation.item_id}`)}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-sm">
              {conversation.items.images && conversation.items.images.length > 0 ? (
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
              <h3 className="font-semibold text-sm truncate">{conversation.items.title}</h3>
              <p className="text-base font-bold text-primary">
                ₹{conversation.items.price.toLocaleString()}
              </p>
            </div>

            <Button variant="outline" size="sm" className="flex-shrink-0 text-xs h-8">
              View Item
            </Button>
          </div>
        </div>
      )}
      
      {/* ⚠️ AUTO-DELETE POLICY NOTICE (45 Days) */}
      <div className="bg-yellow-50 border-y border-yellow-200 text-yellow-800 text-center p-2 text-xs sm:text-sm flex-shrink-0 flex items-center justify-center gap-2">
        <Clock className="h-4 w-4 text-yellow-600" />
        <p className="font-medium">Messages will be automatically deleted after **45 days**.</p>
      </div>

      {/* Messages Container - Optimized for Scroll */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4 bg-muted/5"
      >
        
        {/* Loader at the top when fetching old messages */}
        {fetchingOldMessages && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        
        {/* MESSAGES LOADING FIX: Show spinner only if initial messages are loading */}
        {messagesLoading && messages.length === 0 && (
           <div className="h-full flex items-center justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
        )}

        {messages.length === 0 && !messagesLoading ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center text-muted-foreground space-y-3">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="h-10 w-10 text-primary" />
              </div>
              <p className="font-semibold text-lg text-foreground">Start your conversation</p>
              <p className="text-sm max-w-xs mx-auto">Send a message to begin chatting about this item</p>
            </div>
          </div>
        ) : (
          <>
            {/* Display message if there are more messages to load */}
            {!fetchingOldMessages && hasMoreMessages && (
                 <div className="text-center text-muted-foreground text-xs my-3 pb-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => fetchMessages(page + 1, false)}>
                    — Load previous messages —
                </div>
            )}
            
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user?.id;
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-1.5 sm:gap-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for the other user */}
                  {!isOwnMessage && (
                    <div className={showAvatar ? 'block' : 'invisible'}> 
                      <Avatar className="h-7 w-7 mt-1 shadow-sm border border-primary/20 flex-shrink-0">
                         <AvatarImage 
                            src={otherUser.avatar_url ? supabase.storage.from('avatars').getPublicUrl(otherUser.avatar_url).data.publicUrl : undefined} 
                            alt={otherUser.full_name} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-[12px]">
                            {otherUser.full_name?.charAt(0) || <User className="h-3.5 w-3.5" />}
                          </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  {/* Invisible spacer for aligned messages */}
                  {!isOwnMessage && !showAvatar && <div className="w-7 flex-shrink-0" />} 
                  
                  <div
                    className={`max-w-[75%] sm:max-w-[70%] rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-md ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-card border border-border/50 rounded-bl-sm' 
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <div className={`flex items-center gap-1 mt-1 ${
                      isOwnMessage 
                        ? 'text-primary-foreground/80 justify-end' 
                        : 'text-muted-foreground'
                    }`}>
                      <p className="text-[10px] sm:text-xs">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {isOwnMessage && (
                        message.is_read ? (
                          <CheckCheck className="h-3 w-3 text-accent flex-shrink-0" title="Read" />
                        ) : (
                          <Check className="h-3 w-3 flex-shrink-0" title="Sent" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {isOtherUserTyping && (
              <div className="flex gap-1.5 sm:gap-2 justify-start mb-2">
                <Avatar className="h-7 w-7 mt-1 shadow-sm border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-[12px]">
                       <User className="h-3.5 w-3.5" />
                    </AvatarFallback>
                </Avatar>
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input - Mobile Optimized */}
      <div className="border-t bg-background shadow-xl p-3 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 rounded-full px-4 py-2.5 text-sm bg-muted/70 border-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-primary h-12"
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={sending || !newMessage.trim()}
            className="rounded-full h-12 w-12 flex-shrink-0 shadow-lg"
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
