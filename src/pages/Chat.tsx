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
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId && user) {
      fetchConversation();
      fetchMessages();
      markMessagesAsRead();
      
      const channel = subscribeToMessages();
      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
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

    // Fetch buyer profile
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('full_name, is_verified, verification_status, avatar_url, mck_id, trust_seller_badge')
      .eq('user_id', conversationData.buyer_id)
      .maybeSingle();

    // Fetch seller profile
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
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          // Mark as read if it's not from current user
          if (newMessage.sender_id !== user?.id) {
            setTimeout(markMessagesAsRead, 500);
          }
        }
      )
      .subscribe();

    return channel;
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

    // Optimistically add message to UI
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

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
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageContent);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else if (data) {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
    
    setSending(false);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/my-chats')}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage 
                    src={otherUser.avatar_url ? supabase.storage.from('avatars').getPublicUrl(otherUser.avatar_url).data.publicUrl : undefined} 
                    alt={otherUser.full_name} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {otherUser.full_name?.charAt(0) || <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm">{otherUser.full_name || 'Anonymous User'}</h2>
                    {otherUser.verification_status === 'approved' && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-success/10 text-success">
                        <Shield className="h-3 w-3" />
                      </Badge>
                    )}
                    {otherUser.trust_seller_badge && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-warning/10 text-warning">
                        ★
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isBuyer ? 'Seller' : 'Buyer'} {otherUser.mck_id ? `• ${otherUser.mck_id}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Item Info Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="overflow-hidden">
              <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                  <Package className="h-4 w-4" />
                  Item Details
                </div>
              </div>
              <div className="p-4 space-y-4">
                {conversation.items.images && conversation.items.images.length > 0 ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                    <img
                      src={conversation.items.images[0]}
                      alt={conversation.items.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                    {conversation.items.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ₹{conversation.items.price.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/item/${conversation.item_id}`)}
                >
                  View Item
                </Button>
              </div>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="flex flex-col h-[calc(100vh-200px)] lg:h-[600px] overflow-hidden">
              {/* Messages Container */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-muted/10 to-background"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground space-y-2">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                      <p className="font-medium">Start your conversation</p>
                      <p className="text-sm">Send a message to begin chatting about this item</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isOwnMessage = message.sender_id === user?.id;
                      const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                          {!isOwnMessage && showAvatar && (
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isOwnMessage && !showAvatar && <div className="w-8" />}
                          
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-muted rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage 
                                ? 'text-primary-foreground/70' 
                                : 'text-muted-foreground'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t bg-background p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-full px-4 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary"
                    disabled={sending}
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={sending || !newMessage.trim()}
                    className="rounded-full h-10 w-10 shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
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
