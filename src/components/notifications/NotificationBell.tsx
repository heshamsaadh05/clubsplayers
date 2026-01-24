import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, Calendar, Clock, Check, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/hooks/useLanguage';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isArabic = currentLanguage?.code === 'ar';
  
  
  const { unreadCount: unreadMessagesCount, unreadMessages } = useUnreadMessages();
  const { 
    notifications, 
    unreadCount: unreadNotificationsCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'notifications'>('all');

  const totalUnread = unreadMessagesCount + unreadNotificationsCount;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (isArabic) {
      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 7) return `منذ ${diffDays} يوم`;
      return date.toLocaleDateString('ar-SA');
    } else {
      if (diffMins < 1) return 'Now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US');
    }
  };

  const handleViewMessages = () => {
    setIsOpen(false);
    navigate('/messages');
  };

  const handleViewConsultations = () => {
    setIsOpen(false);
    navigate('/my-consultations');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'consultation_reminder':
        return <Calendar className="w-5 h-5 text-gold" />;
      default:
        return <Bell className="w-5 h-5 text-gold" />;
    }
  };

  const handleJoinMeeting = (meetLink: string) => {
    window.open(meetLink, '_blank');
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
            {totalUnread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {totalUnread > 9 ? '9+' : totalUnread}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold">{isArabic ? 'الإشعارات' : 'Notifications'}</h3>
          {totalUnread > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{totalUnread} {isArabic ? 'جديد' : 'new'}</Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={markAllAsRead}
              >
                <Check className="w-3 h-3 mr-1" />
                {isArabic ? 'قراءة الكل' : 'Read all'}
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'all' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('all')}
          >
            {isArabic ? 'الكل' : 'All'}
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'messages' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('messages')}
          >
            {isArabic ? 'الرسائل' : 'Messages'}
            {unreadMessagesCount > 0 && (
              <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {unreadMessagesCount}
              </span>
            )}
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'notifications' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            {isArabic ? 'تذكيرات' : 'Reminders'}
            {unreadNotificationsCount > 0 && (
              <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        <ScrollArea className="max-h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Messages */}
              {(activeTab === 'all' || activeTab === 'messages') && 
                unreadMessages.slice(0, activeTab === 'messages' ? 10 : 3).map((message) => (
                  <motion.div
                    key={`msg-${message.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={handleViewMessages}
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
                ))
              }

              {/* Notifications */}
              {(activeTab === 'all' || activeTab === 'notifications') && 
                notifications.slice(0, activeTab === 'notifications' ? 10 : 3).map((notification) => (
                  <motion.div
                    key={`notif-${notification.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 transition-colors ${
                      notification.is_read ? 'bg-background' : 'bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {isArabic ? notification.title_ar || notification.title : notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? notification.message_ar || notification.message : notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.created_at)}
                        </p>
                        
                        {/* Actions for consultation reminders */}
                        {notification.type === 'consultation_reminder' && notification.metadata?.meet_link && (
                          <Button
                            size="sm"
                            className="mt-2 h-7 text-xs"
                            onClick={() => handleJoinMeeting(notification.metadata.meet_link as string)}
                          >
                            <Video className="w-3 h-3 mr-1" />
                            {isArabic ? 'انضم للاجتماع' : 'Join Meeting'}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              }

              {/* Empty state */}
              {((activeTab === 'all' && unreadMessages.length === 0 && notifications.length === 0) ||
                (activeTab === 'messages' && unreadMessages.length === 0) ||
                (activeTab === 'notifications' && notifications.length === 0)) && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? 'لا توجد إشعارات' : 'No notifications'}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-3 border-t border-border flex gap-2">
          {unreadMessages.length > 0 && (
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={handleViewMessages}
            >
              {isArabic ? 'عرض الرسائل' : 'View Messages'}
            </Button>
          )}
          {notifications.some(n => n.type === 'consultation_reminder') && (
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={handleViewConsultations}
            >
              {isArabic ? 'استشاراتي' : 'My Consultations'}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
