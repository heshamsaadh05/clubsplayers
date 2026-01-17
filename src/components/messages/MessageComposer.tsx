import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  onMessageSent?: () => void;
}

const MessageComposer = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  onMessageSent,
}: MessageComposerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || !content.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: recipientId,
        subject: subject.trim() || null,
        content: content.trim(),
      });

      if (error) throw error;

      toast({ title: 'تم إرسال الرسالة بنجاح' });
      setSubject('');
      setContent('');
      onClose();
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال الرسالة',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-gold" />
            إرسال رسالة إلى {recipientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>الموضوع (اختياري)</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع الرسالة..."
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label>الرسالة *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="bg-secondary min-h-[150px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 btn-gold"
              onClick={handleSend}
              disabled={sending || !content.trim()}
            >
              {sending ? (
                'جاري الإرسال...'
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  إرسال
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageComposer;