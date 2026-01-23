import { useState, useEffect } from 'react';
import { Send, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PlayerInterestButtonProps {
  playerId: string;
  playerName: string;
}

const PlayerInterestButton = ({ playerId, playerName }: PlayerInterestButtonProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingInterest, setExistingInterest] = useState<{
    id: string;
    interest_type: string;
    status: string;
  } | null>(null);
  const [interestType, setInterestType] = useState<'interested' | 'offer'>('interested');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkExistingInterest = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('player_interests')
        .select('id, interest_type, status')
        .eq('club_user_id', user.id)
        .eq('player_id', playerId)
        .maybeSingle();

      if (data) {
        setExistingInterest(data);
      }
    };

    checkExistingInterest();
  }, [user, playerId]);

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('player_interests').insert({
        player_id: playerId,
        club_user_id: user.id,
        interest_type: interestType,
        message: message.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'تم التسجيل مسبقاً',
            description: 'لقد سجلت اهتمامك بهذا اللاعب من قبل',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'تم بنجاح',
          description: 'تم إرسال اهتمامك للإدارة وسيتم التواصل معك قريباً',
        });
        setExistingInterest({
          id: '',
          interest_type: interestType,
          status: 'pending',
        });
        setIsOpen(false);
        setMessage('');
      }
    } catch (error) {
      console.error('Error submitting interest:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تسجيل الاهتمام',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!existingInterest) return null;

    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'قيد المراجعة', className: 'bg-yellow-500/20 text-yellow-500' },
      reviewed: { label: 'تمت المراجعة', className: 'bg-blue-500/20 text-blue-500' },
      contacted: { label: 'تم التواصل', className: 'bg-green-500/20 text-green-500' },
      rejected: { label: 'مرفوض', className: 'bg-red-500/20 text-red-500' },
    };

    const config = statusConfig[existingInterest.status] || statusConfig.pending;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${config.className}`}>
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">
          {existingInterest.interest_type === 'offer' ? 'عرض مقدم' : 'مهتم'} - {config.label}
        </span>
      </div>
    );
  };

  if (existingInterest) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground mb-2">
          لقد سجلت اهتمامك بهذا اللاعب
        </p>
        {getStatusBadge()}
      </div>
    );
  }

  return (
    <>
      <Button className="w-full btn-gold" onClick={() => setIsOpen(true)}>
        <Send className="w-4 h-4 ml-2" />
        تسجيل اهتمام
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل اهتمام باللاعب</DialogTitle>
            <DialogDescription>
              سيتم إرسال اهتمامك للإدارة وسيتم التواصل معك لتزويدك ببيانات التواصل مع اللاعب
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>اللاعب</Label>
              <p className="font-medium text-lg">{playerName}</p>
            </div>

            <div className="space-y-2">
              <Label>نوع الاهتمام</Label>
              <Select
                value={interestType}
                onValueChange={(value: 'interested' | 'offer') => setInterestType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interested">مهتم بالتعاقد</SelectItem>
                  <SelectItem value="offer">لدي عرض رسمي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>رسالة للإدارة (اختياري)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="أضف أي تفاصيل تريد مشاركتها مع الإدارة..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 btn-gold"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    إرسال
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlayerInterestButton;
