import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Calendar, Clock, CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Subscription = Tables<'subscriptions'>;
type SubscriptionPlan = Tables<'subscription_plans'>;

interface AdminManageSubscriptionProps {
  userId: string;
  userName: string;
  userType: 'player' | 'club';
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const AdminManageSubscription = ({
  userId,
  userName,
  userType,
  isOpen,
  onClose,
  onUpdate,
}: AdminManageSubscriptionProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  
  // Form state
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'active' | 'expired' | 'cancelled' | 'pending'>('active');
  const [autoRenew, setAutoRenew] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch plans based on user type
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .eq('plan_type', userType)
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Fetch current subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError && !subError.message.includes('no rows')) throw subError;

      if (subData) {
        setSubscription(subData);
        setSelectedPlanId(subData.plan_id);
        setStartDate(subData.start_date.split('T')[0]);
        setEndDate(subData.end_date.split('T')[0]);
        setStatus(subData.status);
        setAutoRenew(subData.auto_renew || false);
      } else {
        // Set default values for new subscription
        setSubscription(null);
        if (plansData && plansData.length > 0) {
          setSelectedPlanId(plansData[0].id);
          const defaultEndDate = new Date();
          defaultEndDate.setDate(defaultEndDate.getDate() + plansData[0].duration_days);
          setEndDate(defaultEndDate.toISOString().split('T')[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + plan.duration_days);
      setEndDate(newEndDate.toISOString().split('T')[0]);
    }
  };

  const handleSave = async () => {
    if (!selectedPlanId) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار باقة',
        variant: 'destructive',
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: 'خطأ',
        description: 'يرجى تحديد تاريخ البداية والنهاية',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const subscriptionData = {
        user_id: userId,
        plan_id: selectedPlanId,
        start_date: startDate,
        end_date: endDate,
        status,
        auto_renew: autoRenew,
        payment_method: 'admin_assigned',
      };

      if (subscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', subscription.id);

        if (error) throw error;
        toast({ title: 'تم تحديث الاشتراك بنجاح' });
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert(subscriptionData);

        if (error) throw error;
        toast({ title: 'تم إنشاء الاشتراك بنجاح' });
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الاشتراك',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    if (!confirm('هل أنت متأكد من إلغاء الاشتراك؟')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);

      if (error) throw error;

      toast({ title: 'تم إلغاء الاشتراك' });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إلغاء الاشتراك',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-500">نشط</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-500">منتهي</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/20 text-gray-500">ملغي</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500">معلق</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            إدارة اشتراك {userName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 mt-4"
          >
            {/* Current Status */}
            {subscription && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">الحالة الحالية</span>
                  {getStatusBadge(subscription.status)}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>من: {new Date(subscription.start_date).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>إلى: {new Date(subscription.end_date).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Selection */}
            <div className="space-y-2">
              <Label>الباقة</Label>
              <Select value={selectedPlanId} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الباقة" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name_ar} - {plan.price} {plan.currency} / {plan.duration_days} يوم
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Renew */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">التجديد التلقائي</p>
                <p className="text-sm text-muted-foreground">
                  تفعيل التجديد التلقائي للاشتراك
                </p>
              </div>
              <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="btn-gold">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : subscription ? (
                  <>
                    <CheckCircle className="w-4 h-4 ml-2" />
                    تحديث الاشتراك
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء اشتراك جديد
                  </>
                )}
              </Button>
              
              {subscription && subscription.status === 'active' && (
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={saving}
                >
                  <XCircle className="w-4 h-4 ml-2" />
                  إلغاء الاشتراك
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminManageSubscription;
