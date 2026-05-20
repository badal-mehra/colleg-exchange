import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Send, User, Shield, Loader2, Check, CheckCheck, Clock, Info, MessageCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import TypingIndicator from '@/components/TypingIndicator'; 

// Constants
const MESSAGES_PER_PAGE = 50;
const TYPING_TIMEOUT = 2000; 

// --- CRITICAL FIX: ADDED mck_id TO INTERFACE ---
interface Profile {
  id?: string;
  user_id: string;
  full_name: string;
  email?: string;
  is_verified?: boolean;
  verification_status?: string;
  avatar_url?: string | null; 
  mck_id?: string; // <--- Added mck_id here
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
  last_message?: { 
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number; 
}
// --- END INTERFACE UPDATES ---


interface Message {
  id: string | number; 
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  is_optimistic?: boolean; 
}


// --- UTILITY COMPONENTS ---
const MessageStatus: React.FC<{ isRead: boolean, isSending: boolean }> = ({ isRead, isSending }) => {
    if (isSending) {
        return <Loader2 className="h-3.5 w-3.5 text-primary-foreground/70 animate-spin flex-shrink-0" />;
    }
    return isRead ? (
        <CheckCheck className="h-3.5 w-3.5 text-blue-300 flex-shrink-0" />
    ) : (
        <Check className="h-3.5 w-3.5 text-primary-foreground/70 flex-shrink-0" />
    );
};

const formatLastSeen = (timestamp: string | null): string => {
    if (!timestamp) return 'Offline';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `last seen ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `last seen ${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `last seen ${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };


// --- MAIN COMPONENT ---

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>(); 
  
  // States & Refs
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

  // Memoize Other User Data
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


  // Utility Functions ----------------------------------------------------------------

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
    
    // 1. Optimistically add message
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

    // 2. Clear typing indicator for self
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    supabase.channel(`typing-${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, isTyping: false }
    });

    // 3. Insert into DB
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent
      })
      .select()
      .single();

    // 4. Update messages state
    setSending(false);

    if (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const remaining = prev.filter(m => m.id !== tempId);
        toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
        setNewMessage(messageContent);
        return remaining;
      });
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, is_optimistic: false } : m));
    }
  };


  // Data Fetching and Subscriptions ----------------------------------------------------------------

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

  // Fetch Conversation data (Initial data load)
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

        // Fetches mck_id to allow correct profile navigation
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
  

  // Effect to handle ALL Subscriptions
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

    // 1. Messages Subscription
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
        
    // 2. Presence Subscription
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

    // 3. Typing Subscription
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


  // Scroll Adjustments
  useEffect(() => {
    if (initialLoadComplete && messages.length > 0) {
      const container = messagesContainerRef.current;
      const isNearBottom = container && (container.scrollHeight - container.scrollTop < container.clientHeight + 300);

      if (isNearBottom || messages[messages.length - 1].sender_id === user?.id) {
        scrollToBottom('smooth');
      }
    }
  }, [messages.length, user, initialLoadComplete, scrollToBottom]); 
  
  // Adjust Scroll Position after Prepending Old Messages
  useEffect(() => {
    if (fetchingOldMessages === false && page > 1) {
      const currentScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
      const heightDifference = currentScrollHeight - previousScrollHeightRef.current;
      
      if (messagesContainerRef.current && heightDifference > 0) {
        messagesContainerRef.current.scrollTop += heightDifference; 
      }
    }
  }, [messages, fetchingOldMessages, page]);

  // Handle Scroll Up
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && hasMoreMessages && !fetchingOldMessages && initialLoadComplete) {
      if (container.scrollTop < container.clientHeight * 0.1) {
        fetchMessages(page + 1, false);
      }
    }
  };

  // Helper for Profile Navigation
  const navigateToProfile = () => {
    if (otherUser?.mck_id) {
      navigate(`/profile/${otherUser.mck_id}`);
    }
  };


  // RENDER LOGIC --------------------------------------------------------

  if (conversationLoading) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-3 text-muted-foreground font-medium">Loading conversation...</p>
        </div>
    );
  }

  if (!conversation || !otherUser) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
            <Info className="h-10 w-10 text-destructive mb-3" />
            <h3 className="text-xl font-semibold mb-2">Conversation Not Found</h3>
            <p className="text-muted-foreground">Please return to your chats list.</p>
            <Button onClick={() => navigate('/my-chats')} className="mt-4">
                Go to Chats
            </Button>
        </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-muted/10">
      
      {/* HEADER: Updated with Clickable Profile Elements */}
      <header className="sticky top-0 z-50 w-full border-b bg-background shadow-md flex-shrink-0">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/my-chats')}
              className="h-10 w-10 text-primary hover:bg-primary/10 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar 
                  // --- FIX: Added onClick and pointer cursor ---
                  onClick={navigateToProfile}
                  className="h-10 w-10 border border-border/70 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <AvatarImage src={getOtherUserAvatarUrl} alt={otherUser.full_name} />
                  <AvatarFallback className="bg-muted/50 text-foreground text-base font-medium">
                    {otherUser.full_name?.charAt(0) || <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                {isOtherUserOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 border-2 border-background rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 
                    // --- FIX: Added onClick and pointer cursor ---
                    onClick={navigateToProfile}
                    className="font-semibold text-lg truncate text-foreground cursor-pointer hover:underline hover:text-primary transition-colors"
                  >
                    {otherUser.full_name || 'User'}
                  </h2>
                  {otherUser.verification_status === 'approved' && (
                    <Badge variant="outline" title="Verified User" className="h-5 px-2 text-green-700 border-green-700/50 bg-green-50/50 font-medium">
                      <Shield className="h-3 w-3 mr-1 fill-green-500 text-green-500" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className={`text-sm truncate ${isOtherUserOnline ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                  {isOtherUserOnline ? (
                    'Online'
                  ) : (
                    formatLastSeen(lastSeen)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4 bg-background"
      >
        {fetchingOldMessages && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {messagesLoading && messages.length === 0 && (
           <div className="h-full flex items-center justify-center">
               <Loader2 className="h-10 w-10 animate-spin text-primary" />
           </div>
        )}

        {messages.length === 0 && !messagesLoading ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center text-muted-foreground space-y-4 pt-16">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto shadow-lg">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <p className="font-semibold text-xl text-foreground">Start the Conversation</p>
              <p className="text-sm max-w-xs mx-auto font-normal">Send a message to begin chatting about this item.</p>
            </div>
          </div>
        ) : (
          <>
            {!fetchingOldMessages && hasMoreMessages && (
                 <div className="text-center text-muted-foreground text-sm my-3 py-2 cursor-pointer hover:text-primary transition-colors font-medium"
                      onClick={() => fetchMessages(page + 1, false)}>
                    <Clock className="h-4 w-4 inline mr-2 align-text-top" />
                    Load previous messages
                </div>
            )}
            
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user?.id;
              const isOptimistic = message.is_optimistic || message.id.toString().startsWith('temp-');
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
              const isNextMessageSameSender = messages[index + 1]?.sender_id === message.sender_id;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-1.5 sm:gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isNextMessageSameSender ? 'mb-0.5' : 'mb-3'}`}
                >
                  
                  {!isOwnMessage && (
                    <div className={showAvatar ? 'block' : 'invisible'}> 
                      <Avatar 
                        // --- FIX: Avatar in chat list also clickable ---
                        onClick={navigateToProfile}
                        className="h-8 w-8 mt-1 shadow-sm border border-border/70 flex-shrink-0 cursor-pointer hover:opacity-80"
                      >
                         <AvatarImage src={getOtherUserAvatarUrl} alt={otherUser.full_name} />
                          <AvatarFallback className="bg-muted/50 text-foreground text-sm font-medium">
                            {otherUser.full_name?.charAt(0) || <User className="h-4 w-4" />}
                          </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  {!isOwnMessage && !showAvatar && <div className="w-8 flex-shrink-0" />} 
                  
                  <div className='flex flex-col max-w-[75%] sm:max-w-[60%]'>
                    <div
                      className={`
                        rounded-xl px-4 py-2.5 shadow-md text-sm leading-snug break-words whitespace-pre-wrap font-normal
                        ${isOwnMessage 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-card border border-border/70 rounded-tl-sm' 
                        }
                        ${!showAvatar && isOwnMessage ? 'rounded-tr-xl' : ''} 
                        ${!showAvatar && !isOwnMessage ? 'rounded-tl-xl' : ''} 
                        ${isOptimistic ? 'opacity-70' : ''}
                      `}
                    >
                      {message.content}
                    </div>
                    
                    <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <p className={`text-[10px] sm:text-xs font-normal ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                            {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                        {isOwnMessage && (
                            <MessageStatus isRead={message.is_read} isSending={isOptimistic || sending} />
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isOtherUserTyping && (
              <div className="flex gap-1.5 sm:gap-2 justify-start mb-2">
                <Avatar className="h-8 w-8 mt-1 shadow-sm border border-border/70">
                    <AvatarFallback className="bg-muted/50 text-foreground text-sm font-medium">
                       {otherUser.full_name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                </Avatar>
                <TypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-card shadow-lg p-3 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 rounded-full px-5 py-3 text-base bg-muted/50 border-muted-foreground/10 focus-visible:ring-2 focus-visible:ring-primary h-12 font-normal"
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={sending || !newMessage.trim()}
            className="rounded-full h-12 w-12 flex-shrink-0 shadow-md bg-primary hover:bg-primary/90 transition-colors"
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
