// MyChats.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
  Store,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  verification_status: string;
  avatar_url?: string;
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
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('buying');

  // Memoized data fetching
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          items (id, title, price, images),
          buyer_profile:profiles!buyer_id(id, user_id, full_name, email, is_verified, verification_status, avatar_url),
          seller_profile:profiles!seller_id(id, user_id, full_name, email, is_verified, verification_status, avatar_url)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get last messages and unread counts in parallel
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          const [lastMessage, unreadCount] = await Promise.all([
            supabase
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('conversation_id', conversation.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase.rpc('get_unread_count', {
              conv_id: conversation.id,
              uid: user.id
            })
          ]);

          return {
            ...conversation,
            last_message: lastMessage.data || undefined,
            unread_count: unreadCount.data || 0
          };
        })
      );
      
      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Real-time presence tracking
  const subscribeToPresence = useCallback(() => {
    if (!user) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const online = new Set(
        Object.keys(state).map(userId => userId)
      );
      setOnlineUsers(online);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ 
          user_id: user.id,
          online_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Filter conversations based on search and active tab
  useEffect(() => {
    let filtered = conversations;
    
    // Filter by tab
    if (activeTab === 'buying') {
      filtered = filtered.filter(c => c.buyer_id === user?.id);
    } else {
      filtered = filtered.filter(c => c.seller_id === user?.id);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conversation => 
        conversation.items?.title?.toLowerCase().includes(query) ||
        getOtherUser(conversation)?.full_name?.toLowerCase().includes(query) ||
        conversation.last_message?.content?.toLowerCase().includes(query)
      );
    }
    
    setFilteredConversations(filtered);
  }, [conversations, searchQuery, activeTab, user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      const cleanup = subscribeToPresence();
      return cleanup;
    }
  }, [user, fetchConversations, subscribeToPresence]);

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

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-12" />
          </div>

          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  My Chats
                </h1>
                <p className="text-sm text-muted-foreground">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Search and Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 h-12 rounded-2xl bg-background border-border/50 focus:border-primary/50 transition-all duration-200"
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-2xl h-12 w-12 shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

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
              className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8"
            >
              Browse Items
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-2xl">
              <TabsTrigger 
                value="buying" 
                className="flex items-center gap-2 rounded-xl transition-all duration-200 data-[state=active]:shadow-sm"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Buying</span>
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 flex items-center justify-center">
                  {conversations.filter(c => c.buyer_id === user?.id).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="selling" 
                className="flex items-center gap-2 rounded-xl transition-all duration-200 data-[state=active]:shadow-sm"
              >
                <Store className="h-4 w-4" />
                <span>Selling</span>
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 flex items-center justify-center">
                  {conversations.filter(c => c.seller_id === user?.id).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buying" className="space-y-3 mt-0">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No buying conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const otherUser = getOtherUser(conversation);
                  const otherUserId = getOtherUserId(conversation);
                  const isOnline = onlineUsers.has(otherUserId);
                  
                  return (
                    <ConversationCard
                      key={conversation.id}
                      conversation={conversation}
                      otherUser={otherUser}
                      isOnline={isOnline}
                      user={user}
                      onClick={() => handleConversationClick(conversation.id)}
                      formatTime={formatTime}
                    />
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="selling" className="space-y-3 mt-0">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No selling conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const otherUser = getOtherUser(conversation);
                  const otherUserId = getOtherUserId(conversation);
                  const isOnline = onlineUsers.has(otherUserId);
                  
                  return (
                    <ConversationCard
                      key={conversation.id}
                      conversation={conversation}
                      otherUser={otherUser}
                      isOnline={isOnline}
                      user={user}
                      onClick={() => handleConversationClick(conversation.id)}
                      formatTime={formatTime}
                    />
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

// Separate component for conversation card for better performance
const ConversationCard = React.memo(({ 
  conversation, 
  otherUser, 
  isOnline, 
  user, 
  onClick, 
  formatTime 
}: { 
  conversation: Conversation;
  otherUser: Profile;
  isOnline: boolean;
  user: any;
  onClick: () => void;
  formatTime: (timestamp: string) => string;
}) => {
  const isBuyer = conversation.buyer_id === user?.id;
  
  return (
    <Card 
      className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30 overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Item Image */}
          <div className="relative">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted shadow-md group-hover:shadow-lg transition-all duration-300">
              {conversation.items?.images?.length > 0 ? (
                <img 
                  src={conversation.items.images[0]} 
                  alt={conversation.items.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
            {conversation.unread_count && conversation.unread_count > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 min-w-0 p-0 flex items-center justify-center text-xs rounded-full animate-pulse"
              >
                {conversation.unread_count}
              </Badge>
            )}
          </div>

          {/* Chat Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="font-semibold text-sm truncate text-foreground">
                  {conversation.items?.title || 'Item'}
                </h3>
                <Badge variant="outline" className="text-xs border-primary/30 shrink-0">
                  {isBuyer ? 'Buying' : 'Selling'}
                </Badge>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ₹{conversation.items?.price?.toLocaleString()}
                </span>
                {conversation.last_message && (
                  <span className="text-xs text-muted-foreground">
                    {formatTime(conversation.last_message.created_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <Avatar className="h-6 w-6 border border-primary/20">
                  <AvatarImage 
                    src={otherUser?.avatar_url} 
                    alt={otherUser?.full_name} 
                  />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-emerald-500 text-emerald-500 border border-background rounded-full" />
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm text-muted-foreground truncate font-medium">
                  {otherUser?.full_name || 'Unknown User'}
                </span>
                {otherUser?.is_verified && otherUser?.verification_status === 'approved' && (
                  <Badge variant="verified" className="h-4 px-1">
                    <Shield className="h-2.5 w-2.5" />
                  </Badge>
                )}
              </div>
            </div>

            {conversation.last_message && (
              <p className="text-sm text-muted-foreground truncate leading-relaxed">
                {conversation.last_message.sender_id === user?.id && (
                  <span className="font-medium text-primary">You: </span>
                )}
                {conversation.last_message.content}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ConversationCard.displayName = 'ConversationCard';

export default MyChats;
