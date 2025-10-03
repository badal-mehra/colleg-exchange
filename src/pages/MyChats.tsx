import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  MessageCircle, 
  User,
  Shield,
  Clock
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

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch conversations where user is buyer or seller
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

    // Fetch profiles and last messages for each conversation
    const conversationsWithData = await Promise.all(
      (conversationsData || []).map(async (conversation) => {
        // Fetch buyer profile
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, email, is_verified, verification_status')
          .eq('user_id', conversation.buyer_id)
          .maybeSingle();

        // Fetch seller profile
        const { data: sellerProfile } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, email, is_verified, verification_status')
          .eq('user_id', conversation.seller_id)
          .maybeSingle();

        // Fetch last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count using RPC function
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-32"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-primary">My Chats</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start browsing items and chat with sellers to see your conversations here.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Browse Items
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const isBuyer = conversation.buyer_id === user?.id;
              
              return (
                <Card 
                  key={conversation.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Item Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {conversation.items?.images?.length > 0 ? (
                          <img 
                            src={conversation.items.images[0]} 
                            alt={conversation.items.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MessageCircle className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-sm truncate">
                              {conversation.items?.title || 'Item'}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {isBuyer ? 'Buying' : 'Selling'}
                            </Badge>
                            {conversation.unread_count && conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs px-2 py-0.5 animate-pulse">
                                {conversation.unread_count} new
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            ₹{conversation.items?.price?.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="text-sm text-muted-foreground truncate">
                              {otherUser?.full_name || 'Unknown User'}
                            </span>
                            {otherUser?.is_verified && otherUser?.verification_status === 'approved' && (
                              <Shield className="h-3 w-3 text-primary" />
                            )}
                          </div>
                        </div>

                        {conversation.last_message && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate flex-1">
                              {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                              {conversation.last_message.content}
                            </p>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground ml-2">
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyChats;