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
  ShoppingBag,
  Store,
  Loader2,
  Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- INTERFACES ---
interface Profile {
  id?: string;
  user_id: string;
  full_name: string;
  email?: string;
  is_verified?: boolean;
  verification_status?: string;
  avatar_url?: string | null; 
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

// --- UTILITY COMPONENTS (Cleaner) ---

const OnlineIndicator: React.FC = () => (
  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border-2 border-background rounded-full" title="Online" />
);

const UserAvatar: React.FC<{ userProfile: Profile, isOnline: boolean }> = ({ userProfile, isOnline }) => {
    const avatarUrl = userProfile.avatar_url ? supabase.storage.from('avatars').getPublicUrl(userProfile.avatar_url).data.publicUrl : undefined;

    return (
        <div className="relative">
            <Avatar className="h-8 w-8 border border-border/70 shadow-sm">
                <AvatarImage src={avatarUrl} alt={userProfile.full_name} />
                <AvatarFallback className="text-xs bg-muted/50 text-foreground font-medium">
                    {userProfile.full_name?.charAt(0) || <User className="h-4 w-4" />}
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
    
    try {
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

      // 2. Fetch related data (profiles, last message, unread count)
      const conversationsWithData = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          
          const [{ data: buyerProfile }, { data: sellerProfile }, { data: lastMessage }, { data: unreadCount }] = await Promise.all([
            supabase
              .from('profiles')
              .select('user_id, full_name, is_verified, verification_status, avatar_url')
              .eq('user_id', conversation.buyer_id)
              .maybeSingle(),
            supabase
              .from('profiles')
              .select('user_id, full_name, is_verified, verification_status, avatar_url')
              .eq('user_id', conversation.seller_id)
              .maybeSingle(),
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
            buyer_profile: (buyerProfile as Profile) || { user_id: conversation.buyer_id, full_name: 'Unknown User' },
            seller_profile: (sellerProfile as Profile) || { user_id: conversation.seller_id, full_name: 'Unknown User' },
            last_message: lastMessage || undefined,
            unread_count: unreadCount || 0
          };
        })
      );
      
      setConversations(conversationsWithData);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
      toast({ title: "Error", description: "Failed to load conversations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Presence Subscription with better cleanup
  useEffect(() => {
    if (!user) return;

    let presenceChannel: any = null;
    let mounted = true;

    const setupPresence = async () => {
      presenceChannel = supabase.channel('online-users')
        .on('presence', { event: 'sync' }, () => {
          if (!mounted) return;
          const state = presenceChannel.presenceState();
          const online = new Set(
            Object.values(state)
              .flat()
              .map((presence: any) => presence.user_id)
          );
          setOnlineUsers(online);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && mounted) {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString()
            });
          }
        });
    };

    setupPresence();
    fetchConversations();
    
    return () => {
      mounted = false;
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
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
    const unreadCount = conversation.unread_count || 0;
    
    let lastMessageContent = conversation.last_message?.content || 'Start a conversation...';
    if (conversation.last_message?.sender_id === user?.id) {
        lastMessageContent = `You: ${lastMessageContent}`;
    }

    // Determine the border style based on unread status
    const cardBorderClass = unreadCount > 0 
      ? 'border-l-4 border-primary/80 bg-primary/5 hover:bg-primary/10' 
      : 'border-l-4 border-transparent hover:bg-accent/5';

    return (
      <Card 
        key={conversation.id} 
        className={`transition-all duration-200 cursor-pointer overflow-hidden group shadow-sm hover:shadow-lg ${cardBorderClass}`}
        onClick={() => handleConversationClick(conversation.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            
            {/* Item Image */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-inner">
              {conversation.items?.images?.length > 0 ? (
                <img 
                  src={conversation.items.images[0]} 
                  alt={conversation.items.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              
              {/* Top Row: Item Title & Price */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-base truncate text-foreground">
                        {conversation.items?.title || 'Item'}
                    </h3>
                </div>
                <span className="text-sm font-semibold text-primary flex-shrink-0">
                    ₹{conversation.items?.price?.toLocaleString()}
                </span>
              </div>

              {/* Middle Row: Other User Info & Status */}
              <div className="flex items-center space-x-2 mb-2">
                <UserAvatar userProfile={otherUser} isOnline={isOnline} />
                <span className="text-sm text-muted-foreground truncate font-medium flex-1">
                    {otherUser?.full_name || 'Unknown User'}
                </span>
                {otherUser?.verification_status === 'approved' && (
                  <Shield className="h-4 w-4 text-green-500" title="Verified User" /> 
                )}
                <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 border-border text-muted-foreground">
                    {isBuyer ? 'Buyer' : 'Seller'}
                </Badge>
              </div>

              {/* Bottom Row: Last Message and Time/Unread Count */}
              <div className="flex items-center justify-between mt-1">
                <p 
                    className={`text-sm truncate flex-1 leading-relaxed ${unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                    {lastMessageContent}
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground ml-3 flex-shrink-0">
                  {conversation.last_message && (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(conversation.last_message.created_at)}</span>
                    </>
                  )}
                  {unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-2 py-0.5 font-semibold">
                          {unreadCount}
                      </Badge>
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground font-medium">Loading your chats...</p>
      </div>
    );
  }

  const buyingConversations = conversations.filter(c => c.buyer_id === user?.id);
  const sellingConversations = conversations.filter(c => c.seller_id === user?.id);

  return (
    <div className="min-h-screen bg-background">
      
      {/* HEADER: Clean and Simple */}
      <header className="sticky top-0 z-50 w-full border-b bg-background shadow-md">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="font-medium">Back</span>
            </Button>
            <h1 className="text-2xl font-bold ml-4 text-foreground">
              Conversations
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <MessageCircle className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">No conversations yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto font-normal">
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
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/70 rounded-lg">
              <TabsTrigger 
                value="buying" 
                className="flex items-center justify-center gap-2 text-base font-medium data-[state=active]:shadow-md h-full rounded-md"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Buying</span>
                <Badge variant="secondary" className="ml-1 px-2 font-semibold">
                  {buyingConversations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="selling" 
                className="flex items-center justify-center gap-2 text-base font-medium data-[state=active]:shadow-md h-full rounded-md"
              >
                <Store className="h-4 w-4" />
                <span>Selling</span>
                <Badge variant="secondary" className="ml-1 px-2 font-semibold">
                  {sellingConversations.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buying" className="space-y-3">
              {buyingConversations.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-card/50">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">No buying conversations started.</p>
                </div>
              ) : (
                buyingConversations.map(renderConversationCard)
              )}
            </TabsContent>

            <TabsContent value="selling" className="space-y-3">
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
