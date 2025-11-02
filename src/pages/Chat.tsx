import React, { useEffect, useState, useRef } from 'react';
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
  Image as ImageIcon,
  Loader2,
  Check,
  CheckCheck,
  Circle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import TypingIndicator from '@/components/TypingIndicator';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
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
  buyer_profile: {
    full_name: string;
    is_verified?: boolean;
    verification_status?: string;
    avatar_url?: string | null;
    mck_id?: string;
    trust_seller_badge?: boolean;
  };
  seller_profile: {
    full_name: string;
    is_verified?: boolean;
    verification_status?: string;
    avatar_url?: string | null;
    mck_id?: string;
    trust_seller_badge?: boolean;
  };
}

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (conversationId && user) {
      fetchConversation();
      fetchMessages();
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
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    if (!conversationId || !user) return;

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
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } else {
      setMessages(data || []);
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversationId || !user) return;

    try {
      await supabase.rpc('mark_messages_read', {
        conv_id: conversationId,
        uid: user.id
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
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
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageContent);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
    
    setSending(false);
  };

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

  if (loading || !conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="p-8 space-y-4 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-center text-muted-foreground">Loading conversation...</p>
        </Card>
      </div>
    );
  }

  const otherUser = user?.id === conversation.buyer_id 
    ? conversation.seller_profile 
    : conversation.buyer_profile;
    
  const isBuyer = user?.id === conversation.buyer_id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/my-chats')}
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-11 w-11 border-2 border-primary/30 shadow-lg">
                    <AvatarImage 
                      src={otherUser.avatar_url ? supabase.storage.from('avatars').getPublicUrl(otherUser.avatar_url).data.publicUrl : undefined} 
                      alt={otherUser.full_name} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                      {otherUser.full_name?.charAt(0) || <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  {isOtherUserOnline && (
                    <Circle className="absolute -bottom-0.5 -right-0.5 h-4 w-4 fill-emerald-500 text-emerald-500 border-2 border-background rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm">{otherUser.full_name || 'Anonymous User'}</h2>
                    {otherUser.verification_status === 'approved' && (
                      <Badge variant="verified" className="text-xs px-1.5 py-0 h-5">
                        <Shield className="h-3 w-3" />
                      </Badge>
                    )}
                    {otherUser.trust_seller_badge && (
                      <Badge variant="warning" className="text-xs px-1.5 py-0 h-5">
                        ★
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {isOtherUserOnline ? (
                      <Badge variant="online" className="text-xs px-2 py-0 h-4 animate-pulse">
                        Online
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">
                        {lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline'}
                      </span>
                    )}
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {isBuyer ? 'Seller' : 'Buyer'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Item Info Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="overflow-hidden shadow-lg border-primary/10">
              <div className="p-4 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-b">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                  <Package className="h-4 w-4" />
                  Item Details
                </div>
              </div>
              <div className="p-4 space-y-4">
                {conversation.items.images && conversation.items.images.length > 0 ? (
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted shadow-inner group">
                    <img
                      src={conversation.items.images[0]}
                      alt={conversation.items.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-muted/30 to-muted flex items-center justify-center shadow-inner">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-3 text-foreground">
                    {conversation.items.title}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      ₹{conversation.items.price.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
                  onClick={() => navigate(`/item/${conversation.item_id}`)}
                >
                  View Full Details
                </Button>
              </div>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="flex flex-col h-[calc(100vh-180px)] lg:h-[650px] overflow-hidden shadow-xl border-primary/10">
              {/* Messages Container */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-muted/5 via-background to-background"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground space-y-3">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                      <p className="font-semibold text-lg text-foreground">Start your conversation</p>
                      <p className="text-sm max-w-xs mx-auto">Send a message to begin chatting about this item</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isOwnMessage = message.sender_id === user?.id;
                      const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                      const isLastMessage = index === messages.length - 1;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                          {!isOwnMessage && showAvatar && (
                            <Avatar className="h-8 w-8 mt-1 shadow-md border border-primary/20">
                              <AvatarFallback className="bg-gradient-to-br from-muted to-muted-foreground/20 text-muted-foreground text-xs">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isOwnMessage && !showAvatar && <div className="w-8" />}
                          
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                              isOwnMessage
                                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm'
                                : 'bg-gradient-to-br from-muted to-muted/80 rounded-bl-sm border border-border/50'
                            }`}
                          >
                            <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <div className={`flex items-center gap-1.5 mt-1.5 ${
                              isOwnMessage 
                                ? 'text-primary-foreground/80 justify-end' 
                                : 'text-muted-foreground'
                            }`}>
                              <p className="text-xs">
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {isOwnMessage && isLastMessage && (
                                message.is_read ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-accent" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isOtherUserTyping && (
                      <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-200">
                        <Avatar className="h-8 w-8 mt-1 shadow-md border border-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-muted to-muted-foreground/20 text-muted-foreground text-xs">
                            <User className="h-4 w-4" />
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
              <div className="border-t bg-gradient-to-r from-background to-muted/5 p-4 shadow-lg">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    className="flex-1 rounded-full px-5 py-2.5 bg-muted/60 border-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
                    disabled={sending}
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={sending || !newMessage.trim()}
                    className="rounded-full h-11 w-11 shrink-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
