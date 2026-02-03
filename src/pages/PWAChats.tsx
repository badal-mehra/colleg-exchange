import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, User, MessageCircle, Check, CheckCheck, Image as ImageIcon, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PWAPageWrapper from '@/components/PWAPageWrapper';

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
  verification_status?: string;
}

interface Item {
  id: string;
  title: string;
  images: string[];
  price: number;
}

interface Message {
  content: string;
  created_at: string;
  sender_id: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  item_id: string;
  updated_at: string;
  items: Item;
  buyer_profile: Profile;
  seller_profile: Profile;
  messages: Message[];
  unread_count?: number;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const PWAChats = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id, buyer_id, seller_id, item_id, updated_at,
            items (id, title, images, price),
            messages (content, created_at, sender_id, is_read)
          `)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Get unique user IDs
        const userIds = new Set<string>();
        data?.forEach(conv => {
          userIds.add(conv.buyer_id);
          userIds.add(conv.seller_id);
        });

        // Fetch all profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, verification_status')
          .in('user_id', Array.from(userIds));

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]));

        // Process conversations
        const processedConversations = data?.map(conv => {
          const messages = (conv.messages || []) as unknown as Message[];
          const sortedMessages = [...messages].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          const unreadCount = messages.filter(
            m => !m.is_read && m.sender_id !== user.id
          ).length;

          return {
            ...conv,
            buyer_profile: profilesMap.get(conv.buyer_id) || { user_id: conv.buyer_id, full_name: 'Unknown' },
            seller_profile: profilesMap.get(conv.seller_id) || { user_id: conv.seller_id, full_name: 'Unknown' },
            messages: sortedMessages,
            unread_count: unreadCount
          };
        }) || [];

        setConversations(processedConversations as Conversation[]);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pwa-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refetch on any message change
          supabase
            .from('conversations')
            .select(`
              id, buyer_id, seller_id, item_id, updated_at,
              items (id, title, images, price),
              messages (content, created_at, sender_id, is_read)
            `)
            .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
            .order('updated_at', { ascending: false })
            .then(({ data }) => {
              if (data) {
                // Quick update without re-fetching profiles
                setConversations(prev => {
                  const profilesMap = new Map(
                    prev.flatMap(c => [
                      [c.buyer_id, c.buyer_profile],
                      [c.seller_id, c.seller_profile]
                    ])
                  );

                  return data.map(conv => {
                    const messages = (conv.messages || []) as unknown as Message[];
                    const sortedMessages = [...messages].sort((a, b) => 
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    
                    const unreadCount = messages.filter(
                      m => !m.is_read && m.sender_id !== user.id
                    ).length;

                    return {
                      ...conv,
                      buyer_profile: profilesMap.get(conv.buyer_id) || { user_id: conv.buyer_id, full_name: 'Unknown' },
                      seller_profile: profilesMap.get(conv.seller_id) || { user_id: conv.seller_id, full_name: 'Unknown' },
                      messages: sortedMessages,
                      unread_count: unreadCount
                    };
                  }) as Conversation[];
                });
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      const otherUser = user?.id === conv.buyer_id ? conv.seller_profile : conv.buyer_profile;
      return (
        otherUser.full_name?.toLowerCase().includes(query) ||
        conv.items?.title?.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery, user]);

  if (authLoading) {
    return (
      <PWAPageWrapper title="Chats">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </PWAPageWrapper>
    );
  }

  return (
    <PWAPageWrapper title="Chats">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl px-4 md:px-6 lg:px-8 py-3 border-b">
        <div className="max-w-3xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="pl-10 h-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="max-w-3xl mx-auto divide-y divide-border/50">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 md:p-5">
              <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 md:w-40" />
                <Skeleton className="h-3 w-48 md:w-64" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <MessageCircle className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg md:text-xl mb-1">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </h3>
            <p className="text-muted-foreground text-sm md:text-base text-center">
              {searchQuery 
                ? 'Try a different search term'
                : 'Start a conversation by messaging a seller'
              }
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const otherUser = user?.id === conv.buyer_id ? conv.seller_profile : conv.buyer_profile;
            const lastMessage = conv.messages[0];
            const isOwnMessage = lastMessage?.sender_id === user?.id;
            const hasUnread = (conv.unread_count || 0) > 0;

            return (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`
                  flex items-center gap-3 md:gap-4 p-4 md:p-5 cursor-pointer transition-colors
                  active:bg-muted/50 hover:bg-muted/30
                  ${hasUnread ? 'bg-primary/5' : ''}
                `}
              >
                {/* Avatar with item thumbnail */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-14 w-14 md:h-16 md:w-16 ring-2 ring-background shadow-md">
                    <AvatarImage src={otherUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg md:text-xl">
                      {otherUser.full_name?.charAt(0) || <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  {/* Item thumbnail badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-7 md:h-7 rounded-md overflow-hidden ring-2 ring-background bg-muted shadow-sm">
                    {conv.items?.images?.[0] ? (
                      <img 
                        src={conv.items.images[0]} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-semibold truncate md:text-lg ${hasUnread ? 'text-foreground' : 'text-foreground'}`}>
                        {otherUser.full_name || 'User'}
                      </span>
                      {otherUser.verification_status === 'approved' && (
                        <Shield className="h-3.5 w-3.5 md:h-4 md:w-4 fill-green-500 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs md:text-sm text-muted-foreground flex-shrink-0">
                      {lastMessage && formatTimeAgo(lastMessage.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className={`text-sm md:text-base truncate flex-1 ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {isOwnMessage && (
                        <span className="inline-flex items-center mr-1">
                          {lastMessage?.is_read ? (
                            <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </span>
                      )}
                      {lastMessage?.content || 'No messages yet'}
                    </p>
                    {hasUnread && (
                      <Badge className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>

                  {/* Item name */}
                  <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">
                    {conv.items?.title}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </PWAPageWrapper>
  );
};

export default PWAChats;
