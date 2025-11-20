import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MessageCircle, 
  User,
  Shield,
  Clock,
  ShoppingBag,
  Store,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { AvatarImage } from '@radix-ui/react-avatar'; // You should import AvatarImage from '@/components/ui/avatar'
import { AvatarImage } from '@/components/ui/avatar'; // Assuming AvatarImage is also exported from '@/components/ui/avatar'

// --- INTERFACES ---
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  verification_status: string;
  avatar_url?: string | null; // Added for completeness, assuming profiles table has it
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

// --- UTILITY COMPONENTS ---

const OnlineIndicator: React.FC = () => (
  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-emerald-500 text-emerald-500 border-2 border-background rounded-full animate-pulse" title="Online" />
);

const UserAvatar: React.FC<{ userProfile: Profile, isOnline: boolean }> = ({ userProfile, isOnline }) => {
    // Assuming supabase client is accessible or passed down for public URL generation
    const avatarUrl = userProfile.avatar_url ? supabase.storage.from('avatars').getPublicUrl(userProfile.avatar_url).data.publicUrl : undefined;

    return (
        <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
                <AvatarImage src={avatarUrl} alt={userProfile.full_name} />
                <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                    {userProfile.full_name?.charAt(0) || <User className="h-5 w-5" />}
                </AvatarFallback>
            </Avatar>
            {isOnline && <OnlineIndicator />}
        </div>
    );
};

// --- MAIN COMPONENT ---

const MyChats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Utility to format time for chat list
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getOtherUser = useCallback((conversation: Conversation): Profile => {
    if (conversation.buyer_id === user?.id) {
      return conversation.seller_profile;
    }
    return conversation.buyer_profile;
  }, [user]);

  const getOtherUserId = useCallback((conversation: Conversation): string => {
    return conversation.buyer_id === user?.id ? conversation.seller_id : conversation.buyer_id;
  }, [user]);
  
  // Fetch Conversations logic
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    
    // 1. Fetch conversations
    const { data: conversationsData, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        items (id, title, price, images)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      toast({ title: "Error", description: "Failed to load conversations", variant: "destructive" });
      setLoading(false);
      return;
    }

    // 2. Fetch profiles, last message, and unread count for all
    const userIds = new Set<string>();
    conversationsData?.forEach(conv => {
        userIds.add(conv.buyer_id);
        userIds.add(conv.seller_id);
    });
    
    // Batch fetch profiles (optimization)
    const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, is_verified, verification_status, avatar_url')
        .in('user_id', Array.from(userIds));

    const profileMap = new Map(profilesData?.map(p => [p.user_id, p]));

    const conversationsWithData = await Promise.all(
      (conversationsData || []).map(async (conversation) => {
        
        // Use batch fetched profiles
        const buyerProfile = profileMap.get(conversation.buyer_id) || { user_id: conversation.buyer_id, full_name: 'Unknown User', is_verified: false, verification_status: 'pending' };
        const sellerProfile = profileMap.get(conversation.seller_id) || { user_id: conversation.seller_id, full_name: 'Unknown User', is_verified: false, verification_status: 'pending' };

        // Fetch last message and unread count (cannot be batched easily via simple select)
        const [{ data: lastMessage }, { data: unreadCount }] = await Promise.all([
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
            }),
        ]);

        return {
          ...conversation,
          buyer_profile: buyerProfile as Profile,
          seller_profile: sellerProfile as Profile,
          last_message: lastMessage || undefined,
          unread_count: unreadCount || 0
        };
      })
    );
    
    setConversations(conversationsWithData);
    setLoading(false);
  }, [user, toast]);

  // Presence Subscription (Kept for real-time online status)
  useEffect(() => {
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

    // Initial fetch and subscription cleanup
    fetchConversations();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  // --- RENDER ---

  const renderConversationCard = (conversation: Conversation) => {
    const otherUser = getOtherUser(conversation);
    const otherUserId = getOtherUserId(conversation);
    const isBuyer = conversation.buyer_id === user?.id;
    const isOnline = onlineUsers.has(otherUserId);
    
    // Determine last message content
    let lastMessageContent = conversation.last_message?.content || 'Start a conversation...';
    if (conversation.last_message?.sender_id === user?.id) {
        lastMessageContent = `You: ${lastMessageContent}`;
    }

    return (
      <Card 
        key={conversation.id} 
        className={`hover:shadow-2xl transition-all duration-300 cursor-pointer border-l-4 ${conversation.unread_count && conversation.unread_count > 0 ? 'border-primary/80 bg-primary-50/20' : 'border-border/50'} overflow-hidden group`}
        onClick={() => handleConversationClick(conversation.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            
            {/* Item Image */}
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shadow-md flex-shrink-0">
              {conversation.items?.images?.length > 0 ? (
                <img 
                  src={conversation.items.images[0]} 
                  alt={conversation.items.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base truncate text-foreground">
                        {conversation.items?.title || 'Item'}
                    </h3>
                    <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">
                        {isBuyer ? 'Buying' : 'Selling'}
                    </Badge>
                </div>
                <span className="text-sm font-semibold text-primary flex-shrink-0">
                    ₹{conversation.items?.price?.toLocaleString()}
                </span>
              </div>

              {/* Other User Info */}
              <div className="flex items-center space-x-2 mb-1">
                <UserAvatar userProfile={otherUser} isOnline={isOnline} />
                <span className="text-sm text-muted-foreground truncate font-medium flex-1">
                    {otherUser?.full_name || 'Unknown User'}
                </span>
                {otherUser?.verification_status === 'approved' && (
                  <Shield className="h-4 w-4 text-green-500" title="Verified User" />
                )}
              </div>

              {/* Last Message and Time */}
              <div className="flex items-center justify-between mt-2">
                <p 
                    className={`text-sm truncate flex-1 leading-relaxed ${conversation.unread_count && conversation.unread_count > 0 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                >
                    {lastMessageContent}
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground/70 ml-3 flex-shrink-0">
                  {conversation.unread_count && conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs px-2 py-0.5 font-bold">
                          {conversation.unread_count}
                      </Badge>
                  )}
                  {conversation.last_message && (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(conversation.last_message.created_at)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading your chats...</p>
      </div>
    );
  }

  const buyingConversations = conversations.filter(c => c.buyer_id === user?.id);
  const sellingConversations = conversations.filter(c => c.seller_id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background shadow-md">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-extrabold ml-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              My Chats
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-lg">
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
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/70">
              <TabsTrigger 
                value="buying" 
                className="flex items-center justify-center gap-2 text-base font-semibold data-[state=active]:shadow-lg h-full"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Buying</span>
                <Badge variant="secondary" className="ml-1 px-2">
                  {buyingConversations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="selling" 
                className="flex items-center justify-center gap-2 text-base font-semibold data-[state=active]:shadow-lg h-full"
              >
                <Store className="h-4 w-4" />
                <span>Selling</span>
                <Badge variant="secondary" className="ml-1 px-2">
                  {sellingConversations.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buying" className="space-y-4">
              {buyingConversations.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-card/50">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">No buying conversations started.</p>
                </div>
              ) : (
                buyingConversations.map(renderConversationCard)
              )}
            </TabsContent>

            <TabsContent value="selling" className="space-y-4">
              {sellingConversations.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-card/50">
                  <Store className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">No one has contacted you about your items yet.</p>
                </div>
              ) : (
                sellingConversations.map(renderConversationCard)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default MyChats;
