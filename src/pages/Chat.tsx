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
  Info, // Changed Eye to Info for notice
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import TypingIndicator from '@/components/TypingIndicator'; // Assuming this component exists

// Constants for Pagination
const MESSAGES_PER_PAGE = 50;
const TYPING_TIMEOUT = 2000; // 2 seconds

// --- INTERFACES ---
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

// --- UTILITY COMPONENTS ---

const MessageStatus: React.FC<{ isRead: boolean }> = ({ isRead }) => {
    return isRead ? (
        <CheckCheck className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" title="Read" />
    ) : (
        <Check className="h-3.5 w-3.5 text-primary-foreground/80 flex-shrink-0" title="Sent" />
    );
};

// --- MAIN COMPONENT ---

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>(); // Use generic for safety
  
  // States for Data
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // States for Loading & Status
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

  const formatLastSeen = (timestamp: string | null): string => {
    if (!timestamp) return 'Offline';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    // Fallback to simple date for older times
    return date.toLocaleDateString();
  };

  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || !user) return;

    // Use setTimeout to debounce and ensure one call per "new message received" burst
    // This is a minimal debounce, adjust as needed.
    setTimeout(async () => {
        try {
            await supabase.rpc('mark_messages_read', {
                conv_id: conversationId,
                uid: user.id
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }, 500); // Debounce by 500ms
  }, [conversationId, user]);


  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);
  

  const handleTyping = () => {
    if (!conversationId || !user) return;

    // Send 'isTyping: true' broadcast
    supabase.channel(`typing-${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, isTyping: true }
    });

    // Clear previous timeout and set a new one to send 'isTyping: false' after 2s
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
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      is_read: false
    };

    // 1. Optimistically add message
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

    // 2. Send 'isTyping: false' immediately to clear typing indicator for self
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
      // Replace optimistic message with server data (id, created_at, etc.)
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
    
    setSending(false);
  };

  // Data Fetching and Subscriptions ----------------------------------------------------------------

  // Fetch Messages with Pagination
  const fetchMessages = useCallback(async (pageToFetch: number, initialLoad: boolean) => {
    if (!conversationId || (!hasMoreMessages && pageToFetch > 1)) return;
    
    if (initialLoad) setMessagesLoading(true);
    if (pageToFetch > 1) {
      setFetchingOldMessages(true);
      // Save current scroll height before fetching to restore position later
      previousScrollHeightRef.current = messagesContainerRef.current?.scrollHeight || 0;
    }

    const offset = (pageToFetch - 1) * MESSAGES_PER_PAGE;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }) // Fetching newest first
      .range(offset, offset + MESSAGES_PER_PAGE - 1); 

    if (error) {
      console.error('Error fetching messages:', error);
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
    } else {
      const newMessages = (data || []).reverse(); // Reverse to get chronological order
      
      setMessages(prev => {
        if (pageToFetch === 1) {
          return newMessages;
        } else {
          // Prepend new messages to the existing list
          return [...newMessages, ...prev];
        }
      });
      
      setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);
      setPage(pageToFetch);

      if (initialLoad) {
        setInitialLoadComplete(true);
        // Ensure scroll to bottom on initial load
        setTimeout(() => scrollToBottom('auto'), 100); 
      }
    }
    setFetchingOldMessages(false);
    if (initialLoad) setMessagesLoading(false);
  }, [conversationId, hasMoreMessages, scrollToBottom, toast]);


  // Fetch Conversation data (and user profiles)
  const fetchConversation = async () => {
    if (!conversationId || !user) return;
    setConversationLoading(true);

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
      navigate('/my-chats'); // Navigate to my-chats on error/not found
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
      buyer_profile: buyerProfile as Profile,
      seller_profile: sellerProfile as Profile
    });
    setConversationLoading(false);
  };
  
  const subscribeToMessages = () => {
    if (!conversationId || !user) return null;

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
            // Prevent duplicates from optimistic send or concurrent inserts
            if (prev.some(m => m.id === newMessage.id || m.id === `temp-${newMessage.id}`)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          // Mark as read if it's not the user's own message
          if (newMessage.sender_id !== user.id) {
            markMessagesAsRead();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Used for 'is_read' updates
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
    if (!conversationId || !user || !conversation) return null;

    const otherUserId = conversation.buyer_id === user.id 
      ? conversation.seller_id 
      : conversation.buyer_id;

    const channel = supabase.channel(`presence-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Check if any presence record belongs to the other user
        const isOnline = Object.values(state).flat().some((p: any) => p.user_id === otherUserId);
        setIsOtherUserOnline(isOnline);
        
        // If not online, try to find a last_seen timestamp
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
          // Update last seen to current time (or time of leave, if provided by channel)
          setLastSeen(new Date().toISOString()); 
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return channel;
  };

  const subscribeToTyping = () => {
    if (!conversationId || !user || !conversation) return null;

    const otherUserId = conversation.buyer_id === user.id 
      ? conversation.seller_id 
      : conversation.buyer_id;

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
      // markMessagesAsRead(); // Mark read is now handled on new message insert
      
      // Cleanup function is returned from effects
      return () => {
        // Cleanup function for subscriptions is added in the subsequent effect after conversation loads
      };
    }
  }, [conversationId, user, fetchMessages]); // Removed markMessagesAsRead from dependency array

  // Effect to subscribe once conversation details are available
  useEffect(() => {
    if (conversation && user) {
        // Initial mark messages as read when entering the chat
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
  }, [conversation, user, markMessagesAsRead]); // Re-subscribe when conversation state changes

  
  // Scroll Adjustments useEffect for New Messages
  useEffect(() => {
    if (initialLoadComplete) {
      // Logic to decide if we should scroll: scroll if it's the user's message OR if the user is currently near the bottom (optional)
      const shouldScroll = true; // For simplicity, always scroll on new message if initial load is complete
      
      if (shouldScroll) {
        scrollToBottom('smooth');
      }
    }
  }, [messages.length, initialLoadComplete, scrollToBottom]); // Scroll when messages list length changes
  
  // Adjust Scroll Position after Prepending Old Messages
  useEffect(() => {
    if (fetchingOldMessages === false && page > 1) {
      const currentScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
      const heightDifference = currentScrollHeight - previousScrollHeightRef.current;
      
      if (messagesContainerRef.current && heightDifference > 0) {
        // Adjust scrollTop by the height of the prepended content
        messagesContainerRef.current.scrollTop += heightDifference; 
      }
    }
  }, [messages, fetchingOldMessages, page]);

  // Handle Scroll Up for Loading Old Messages
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && hasMoreMessages && !fetchingOldMessages && initialLoadComplete) {
      // Trigger fetch when scroll position is in the top 10%
      if (container.scrollTop < container.clientHeight * 0.1) {
        fetchMessages(page + 1, false);
      }
    }
  };


  // RENDER LOGIC ----------------------------------------------------------------------

  if (conversationLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 mt-3 text-muted-foreground">Loading chat details...</p>
      </div>
    );
  }

  if (!conversation) {
    // Already handled navigation in fetchConversation, but this is a fallback UI
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

  // Render Logic for other user's avatar
  const getOtherUserAvatarUrl = otherUser.avatar_url 
    ? supabase.storage.from('avatars').getPublicUrl(otherUser.avatar_url).data.publicUrl 
    : undefined;

  return (
    <div className="flex flex-col h-screen bg-muted/10">
      
      {/* HEADER: Modern and Clear */}
      <header className="sticky top-0 z-50 w-full border-b bg-background shadow-lg flex-shrink-0">
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
                <Avatar className="h-11 w-11 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={getOtherUserAvatarUrl} alt={otherUser.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {otherUser.full_name?.charAt(0) || <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                {isOtherUserOnline && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-emerald-500 text-emerald-500 border-2 border-background rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-lg truncate">{otherUser.full_name || 'User'}</h2>
                  {otherUser.verification_status === 'approved' && (
                    <Badge variant="verified" title="Verified User" className="h-5 px-2 bg-green-500/10 text-green-700 border-green-700/50">
                      <Shield className="h-3 w-3 mr-1 fill-green-500 text-green-500" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {isOtherUserOnline ? (
                    <span className="text-emerald-500 font-bold">Online</span>
                  ) : (
                    formatLastSeen(lastSeen)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Item Info Banner */}
      {conversation.items && (
        <div className="border-b bg-card shadow-sm flex-shrink-0">
          <div 
            className="px-3 sm:px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => navigate(`/item/${conversation.item_id}`)}
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-md">
              {conversation.items.images && conversation.items.images.length > 0 ? (
                <img 
                  src={conversation.items.images[0]} 
                  alt={conversation.items.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{conversation.items.title}</h3>
              <p className="text-lg font-extrabold text-primary">
                ₹{conversation.items.price.toLocaleString()}
              </p>
            </div>

            <Button variant="outline" size="sm" className="flex-shrink-0 text-sm h-9 border-primary text-primary hover:bg-primary/10">
              View Item
            </Button>
          </div>
        </div>
      )}
      
      {/* AUTO-DELETE POLICY NOTICE */}
      <div className="bg-orange-50 border-y border-orange-200 text-orange-800 text-center p-2 text-xs sm:text-sm flex-shrink-0 flex items-center justify-center gap-2">
        <Info className="h-4 w-4 text-orange-600" />
        <p>Messages will be **automatically deleted after 45 days**.</p>
      </div>

      {/* Messages Container - Optimized for Scroll */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4 bg-pattern-light bg-repeat" // Added a subtle background
        style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><rect width="4" height="4" fill="%23fcfcfc" opacity="0.4"/><rect x="0" y="0" width="1" height="1" fill="%23e8e8e8"/></svg>')` }}
      >
        
        {/* Loader at the top when fetching old messages */}
        {fetchingOldMessages && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {/* Initial Loading State */}
        {messagesLoading && messages.length === 0 && (
           <div className="h-full flex items-center justify-center">
               <Loader2 className="h-10 w-10 animate-spin text-primary" />
           </div>
        )}

        {/* Empty State */}
        {messages.length === 0 && !messagesLoading ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center text-muted-foreground space-y-4 pt-16">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto shadow-xl">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <p className="font-extrabold text-xl text-foreground">Start the Conversation</p>
              <p className="text-sm max-w-xs mx-auto">Be the first to send a message to the {user?.id === conversation.buyer_id ? 'seller' : 'buyer'}!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Load previous messages button */}
            {!fetchingOldMessages && hasMoreMessages && (
                 <div className="text-center text-muted-foreground text-sm my-3 py-2 cursor-pointer hover:text-primary transition-colors font-semibold"
                      onClick={() => fetchMessages(page + 1, false)}>
                    <Clock className="h-4 w-4 inline mr-2 align-text-top" />
                    Load previous messages
                </div>
            )}
            
            {/* Message Bubbles */}
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user?.id;
              // Group messages for better visual flow: show avatar/gap only if sender is different from previous
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
              
              // Determine if there should be extra space for grouping
              const isNextMessageSameSender = messages[index + 1]?.sender_id === message.sender_id;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-1.5 sm:gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isNextMessageSameSender ? 'mb-0.5' : 'mb-3'}`}
                >
                  
                  {/* Avatar/Spacer for the other user */}
                  {!isOwnMessage && (
                    <div className={showAvatar ? 'block' : 'invisible'}> 
                      <Avatar className="h-8 w-8 mt-1 shadow-md border border-primary/20 flex-shrink-0">
                         <AvatarImage src={getOtherUserAvatarUrl} alt={otherUser.full_name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                            {otherUser.full_name?.charAt(0) || <User className="h-4 w-4" />}
                          </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  {/* Invisible spacer for aligned messages when avatar is hidden */}
                  {!isOwnMessage && !showAvatar && <div className="w-8 flex-shrink-0" />} 
                  
                  <div className='flex flex-col max-w-[75%] sm:max-w-[60%]'>
                    <div
                      className={`
                        rounded-xl px-4 py-2.5 shadow-lg
                        ${isOwnMessage 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-card border border-border/50 rounded-tl-sm' 
                        }
                        ${!showAvatar && isOwnMessage ? 'rounded-tr-xl' : ''} 
                        ${!showAvatar && !isOwnMessage ? 'rounded-tl-xl' : ''} 
                      `}
                    >
                      <p className="text-sm break-words whitespace-pre-wrap leading-snug">
                        {message.content}
                      </p>
                    </div>
                    
                    {/* Time and Status Indicator */}
                    <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <p className={`text-[10px] sm:text-xs font-medium ${isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground/80'}`}>
                            {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                        {isOwnMessage && message.id.startsWith('temp-') && (
                           <Loader2 className="h-3 w-3 text-primary-foreground/70 animate-spin" title="Sending" />
                        )}
                        {isOwnMessage && !message.id.startsWith('temp-') && (
                            <MessageStatus isRead={message.is_read} />
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isOtherUserTyping && (
              <div className="flex gap-1.5 sm:gap-2 justify-start mb-2">
                <Avatar className="h-8 w-8 mt-1 shadow-md border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
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

      {/* Message Input - Modern and Elevated */}
      <div className="border-t bg-card shadow-2xl p-3 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 rounded-full px-5 py-3 text-base bg-muted/50 border-muted-foreground/10 focus-visible:ring-2 focus-visible:ring-primary h-14 shadow-inner"
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={sending || !newMessage.trim()}
            className="rounded-full h-14 w-14 flex-shrink-0 shadow-xl bg-primary hover:bg-primary/90 transition-colors"
          >
            {sending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Send className="h-6 w-6" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
