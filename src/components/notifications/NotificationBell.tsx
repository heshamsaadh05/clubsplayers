import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { unreadCount, unreadMessages, loading } = useUnreadMessages();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/messages');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold">الإشعارات</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} جديد</Badge>
          )}
        </div>

        <ScrollArea className="max-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : unreadMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد إشعارات جديدة</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {unreadMessages.slice(0, 5).map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={handleViewAll}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {message.sender_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {message.subject || message.content}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        {unreadMessages.length > 0 && (
          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewAll}
            >
              عرض كل الرسائل
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;