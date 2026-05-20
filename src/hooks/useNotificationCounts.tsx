import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useNotificationCounts = () => {
  const { user } = useAuth();
  const [unreadChats, setUnreadChats] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user) {
      setUnreadChats(0);
      setPendingOrders(0);
      return;
    }

    try {
      // Fetch conversations where user is buyer or seller
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (conversations && conversations.length > 0) {
        // Count total unread messages across all conversations
        const unreadPromises = conversations.map(conv =>
          supabase.rpc('get_unread_count', { conv_id: conv.id, uid: user.id })
        );
        const results = await Promise.all(unreadPromises);
        const totalUnread = results.reduce((sum, r) => sum + (r.data || 0), 0);
        setUnreadChats(totalUnread);
      } else {
        setUnreadChats(0);
      }

      // Count pending orders where user is buyer or seller
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      setPendingOrders(ordersCount || 0);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchCounts();

    // Set up realtime subscriptions for updates
    if (!user) return;

    const messagesChannel = supabase
      .channel('notification-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('notification-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    // Refresh counts periodically (every 30 seconds)
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(ordersChannel);
      clearInterval(interval);
    };
  }, [user, fetchCounts]);

  return { unreadChats, pendingOrders, refetch: fetchCounts };
};
