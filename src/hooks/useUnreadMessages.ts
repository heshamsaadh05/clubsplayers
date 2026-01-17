import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnreadMessage {
  id: string;
  sender_id: string;
  subject: string | null;
  content: string;
  created_at: string;
  sender_name?: string;
}

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnreadMessages = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setUnreadMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, subject, content, created_at')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sender names
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        
        const [playersRes, clubsRes] = await Promise.all([
          supabase.from('players').select('user_id, full_name').in('user_id', senderIds),
          supabase.from('clubs').select('user_id, name').in('user_id', senderIds),
        ]);

        const namesMap = new Map<string, string>();
        playersRes.data?.forEach(p => namesMap.set(p.user_id, p.full_name));
        clubsRes.data?.forEach(c => namesMap.set(c.user_id, c.name));

        const messagesWithNames = data.map(msg => ({
          ...msg,
          sender_name: namesMap.get(msg.sender_id) || 'مستخدم',
        }));

        setUnreadMessages(messagesWithNames);
        setUnreadCount(data.length);
      } else {
        setUnreadMessages([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadMessages();
  }, [fetchUnreadMessages]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('new-messages-notification')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          // New message received
          const newMessage = payload.new as any;
          
          // Fetch sender name
          let senderName = 'مستخدم';
          
          const [playerRes, clubRes] = await Promise.all([
            supabase.from('players').select('full_name').eq('user_id', newMessage.sender_id).maybeSingle(),
            supabase.from('clubs').select('name').eq('user_id', newMessage.sender_id).maybeSingle(),
          ]);

          if (playerRes.data?.full_name) {
            senderName = playerRes.data.full_name;
          } else if (clubRes.data?.name) {
            senderName = clubRes.data.name;
          }

          // Show toast notification
          toast({
            title: '📬 رسالة جديدة',
            description: `${senderName}: ${newMessage.subject || newMessage.content.substring(0, 50)}...`,
          });

          // Update unread count
          fetchUnreadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          // Message marked as read, refresh count
          fetchUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, fetchUnreadMessages]);

  return {
    unreadCount,
    unreadMessages,
    loading,
    refetch: fetchUnreadMessages,
  };
};

export default useUnreadMessages;