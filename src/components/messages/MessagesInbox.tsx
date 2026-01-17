import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  MailOpen, 
  Send, 
  Inbox, 
  Trash2, 
  Reply,
  ChevronLeft,
  User,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MessageComposer from './MessageComposer';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

interface MessagesInboxProps {
  onClose?: () => void;
}

const MessagesInbox = ({ onClose }: MessagesInboxProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyRecipient, setReplyRecipient] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sender/receiver names
      const userIds = [...new Set([
        ...(data || []).map(m => m.sender_id),
        ...(data || []).map(m => m.receiver_id),
      ])];

      const [playersRes, clubsRes] = await Promise.all([
        supabase.from('players').select('user_id, full_name').in('user_id', userIds),
        supabase.from('clubs').select('user_id, name').in('user_id', userIds),
      ]);

      const namesMap = new Map<string, string>();
      playersRes.data?.forEach(p => namesMap.set(p.user_id, p.full_name));
      clubsRes.data?.forEach(c => namesMap.set(c.user_id, c.name));

      const processedMessages = (data || []).map(msg => ({
        ...msg,
        sender_name: namesMap.get(msg.sender_id) || 'مستخدم',
        receiver_name: namesMap.get(msg.receiver_id) || 'مستخدم',
      }));

      setMessages(processedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, is_read: true } : m))
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      setSelectedMessage(null);
      toast({ title: 'تم حذف الرسالة' });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحذف',
        variant: 'destructive',
      });
    }
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.receiver_id === user?.id) {
      markAsRead(message.id);
    }
  };

  const handleReply = (message: Message) => {
    const recipientId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
    const recipientName = message.sender_id === user?.id ? message.receiver_name : message.sender_name;
    setReplyRecipient({ id: recipientId, name: recipientName || 'مستخدم' });
    setReplyOpen(true);
  };

  const inboxMessages = messages.filter(m => m.receiver_id === user?.id);
  const sentMessages = messages.filter(m => m.sender_id === user?.id);
  const unreadCount = inboxMessages.filter(m => !m.is_read).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-SA');
    }
  };

  const MessageList = ({ messageList }: { messageList: Message[] }) => (
    <ScrollArea className="h-[400px]">
      {messageList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <Mail className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">لا توجد رسائل</p>
        </div>
      ) : (
        <div className="space-y-2 p-2">
          {messageList.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleSelectMessage(message)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedMessage?.id === message.id
                  ? 'bg-gold/20 ring-1 ring-gold'
                  : !message.is_read && message.receiver_id === user?.id
                  ? 'bg-secondary/80 hover:bg-secondary'
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  !message.is_read && message.receiver_id === user?.id
                    ? 'bg-gold text-background'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {!message.is_read && message.receiver_id === user?.id ? (
                    <Mail className="w-5 h-5" />
                  ) : (
                    <MailOpen className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium truncate ${
                      !message.is_read && message.receiver_id === user?.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {activeTab === 'inbox' ? message.sender_name : message.receiver_name}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  {message.subject && (
                    <p className="text-sm font-medium truncate">{message.subject}</p>
                  )}
                  <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {selectedMessage ? (
          <motion.div
            key="message-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Message Header */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMessage(null)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h3 className="text-lg font-bold flex-1 truncate">
                {selectedMessage.subject || 'بدون موضوع'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => deleteMessage(selectedMessage.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Message Content */}
            <div className="card-glass rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedMessage.sender_id === user?.id ? 'أنت' : selectedMessage.sender_name}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedMessage.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>

              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedMessage.content}
              </p>
            </div>

            {/* Reply Button */}
            {selectedMessage.sender_id !== user?.id && (
              <Button
                className="w-full btn-gold"
                onClick={() => handleReply(selectedMessage)}
              >
                <Reply className="w-4 h-4 ml-2" />
                رد على الرسالة
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="message-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="inbox" className="gap-2">
                  <Inbox className="w-4 h-4" />
                  الوارد
                  {unreadCount > 0 && (
                    <Badge className="bg-gold text-background text-xs px-1.5 py-0">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="gap-2">
                  <Send className="w-4 h-4" />
                  المرسل
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inbox">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <MessageList messageList={inboxMessages} />
                )}
              </TabsContent>

              <TabsContent value="sent">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <MessageList messageList={sentMessages} />
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Composer */}
      {replyRecipient && (
        <MessageComposer
          isOpen={replyOpen}
          onClose={() => {
            setReplyOpen(false);
            setReplyRecipient(null);
          }}
          recipientId={replyRecipient.id}
          recipientName={replyRecipient.name}
          onMessageSent={fetchMessages}
        />
      )}
    </div>
  );
};

export default MessagesInbox;