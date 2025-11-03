import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MessageCircle, 
  User,
  Shield,
  Clock,
  Circle,
  ShoppingBag,
  Store
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  verification_status: string;
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
  updated_at: string;
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

const MyChats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToPresence();
    }
  }, [user]);

  const subscribeToPresence = () => {
    if (!user) return;

    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set(
          Object.values(state)
            .flat()
            .map((presence: any) => presence.user_id)
        );
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    
    const { data: conversationsData, error } = await supabase
      .from('conversations')
      .select(`
        *,
        items (id, title, price, images)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const conversationsWithData = await Promise.all(
      (conversationsData || []).map(async (conversation) => {
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, email, is_verified, verification_status')
          .eq('user_id', conversation.buyer_id)
          .maybeSingle();

        const { data: sellerProfile } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, email, is_verified, verification_status')
          .eq('user_id', conversation.seller_id)
          .maybeSingle();

        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: unreadCount } = await supabase.rpc('get_unread_count', {
          conv_id: conversation.id,
          uid: user.id
        });

        return {
          ...conversation,
          buyer_profile: buyerProfile || { id: '', user_id: conversation.buyer_id, full_name: 'Unknown User', email: '', is_verified: false, verification_status: 'pending' },
          seller_profile: sellerProfile || { id: '', user_id: conversation.seller_id, full_name: 'Unknown User', email: '', is_verified: false, verification_status: 'pending' },
          last_message: lastMessage || undefined,
          unread_count: unreadCount || 0
        };
      })
    );
    
    setConversations(conversationsWithData);
    setLoading(false);
  };

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  const getOtherUser = (conversation: Conversation) => {
    if (conversation.buyer_id === user?.id) {
      return conversation.seller_profile;
    }
    return conversation.buyer_profile;
  };

  const getOtherUserId = (conversation: Conversation) => {
    return conversation.buyer_id === user?.id ? conversation.seller_id : conversation.buyer_id;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-32"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Chats
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageCircle className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">No conversations yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start browsing items and chat with sellers to see your conversations here.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="shadow-lg hover:shadow-xl transition-all"
            >
              Browse Items
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="buying" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="buying" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Buying</span>
                <Badge variant="secondary" className="ml-2">
                  {conversations.filter(c => c.buyer_id === user?.id).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="selling" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>Selling</span>
                <Badge variant="secondary" className="ml-2">
                  {conversations.filter(c => c.seller_id === user?.id).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buying" className="space-y-3">
              {conversations.filter(c => c.buyer_id === user?.id).length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No buying conversations yet</p>
                </div>
              ) : (
                conversations.filter(c => c.buyer_id === user?.id).map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const otherUserId = getOtherUserId(conversation);
              const isBuyer = conversation.buyer_id === user?.id;
              const isOnline = onlineUsers.has(otherUserId);
              
              return (
                <Card 
                  key={conversation.id} 
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30 overflow-hidden group bg-gradient-to-br from-card to-card/50"
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Item Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted shadow-md flex-shrink-0 group-hover:shadow-lg transition-shadow">
                        {conversation.items?.images?.length > 0 ? (
                          <img 
                            src={conversation.items.images[0]} 
                            alt={conversation.items.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h3 className="font-semibold text-sm truncate text-foreground">
                              {conversation.items?.title || 'Item'}
                            </h3>
                            <Badge variant="outline" className="text-xs border-primary/30">
                              {isBuyer ? 'Buying' : 'Selling'}
                            </Badge>
                            {conversation.unread_count && conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                {conversation.unread_count} new
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            ₹{conversation.items?.price?.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-2">
                          <div className="relative">
                            <Avatar className="h-7 w-7 border border-primary/20">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                              <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-emerald-500 text-emerald-500 border border-background rounded-full" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="text-sm text-muted-foreground truncate font-medium">
                              {otherUser?.full_name || 'Unknown User'}
                            </span>
                            {otherUser?.is_verified && otherUser?.verification_status === 'approved' && (
                              <Badge variant="verified" tooltip="Verified User" className="h-4 px-1">
                                <Shield className="h-2.5 w-2.5" />
                              </Badge>
                            )}
                            {isOnline && (
                              <Badge variant="online" tooltip="Online" className="h-4 w-4 rounded-full p-0 flex items-center justify-center">
                                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                              </Badge>
                            )}
                          </div>
                        </div>

                        {conversation.last_message && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate flex-1 leading-relaxed">
                              {conversation.last_message.sender_id === user?.id && (
                                <span className="font-medium">You: </span>
                              )}
                              {conversation.last_message.content}
                            </p>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground/70 ml-3">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(conversation.last_message.created_at)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }))}
            </TabsContent>

            <TabsContent value="selling" className="space-y-3">
              {conversations.filter(c => c.seller_id === user?.id).length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No selling conversations yet</p>
                </div>
              ) : (
                conversations.filter(c => c.seller_id === user?.id).map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const otherUserId = getOtherUserId(conversation);
              const isBuyer = conversation.buyer_id === user?.id;
              const isOnline = onlineUsers.has(otherUserId);
              
              return (
                <Card 
                  key={conversation.id} 
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30 overflow-hidden group bg-gradient-to-br from-card to-card/50"
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Item Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted shadow-md flex-shrink-0 group-hover:shadow-lg transition-shadow">
                        {conversation.items?.images?.length > 0 ? (
                          <img 
                            src={conversation.items.images[0]} 
                            alt={conversation.items.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h3 className="font-semibold text-sm truncate text-foreground">
                              {conversation.items?.title || 'Item'}
                            </h3>
                            <Badge variant="outline" className="text-xs border-primary/30">
                              {isBuyer ? 'Buying' : 'Selling'}
                            </Badge>
                            {conversation.unread_count && conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                {conversation.unread_count} new
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            ₹{conversation.items?.price?.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-2">
                          <div className="relative">
                            <Avatar className="h-7 w-7 border border-primary/20">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                              <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-emerald-500 text-emerald-500 border border-background rounded-full" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="text-sm text-muted-foreground truncate font-medium">
                              {otherUser?.full_name || 'Unknown User'}
                            </span>
                            {otherUser?.is_verified && otherUser?.verification_status === 'approved' && (
                              <Badge variant="verified" tooltip="Verified User" className="h-4 px-1">
                                <Shield className="h-2.5 w-2.5" />
                              </Badge>
                            )}
                            {isOnline && (
                              <Badge variant="online" tooltip="Online" className="h-4 w-4 rounded-full p-0 flex items-center justify-center">
                                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                              </Badge>
                            )}
                          </div>
                        </div>

                        {conversation.last_message && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate flex-1 leading-relaxed">
                              {conversation.last_message.sender_id === user?.id && (
                                <span className="font-medium">You: </span>
                              )}
                              {conversation.last_message.content}
                            </p>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground/70 ml-3">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(conversation.last_message.created_at)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default MyChats;
