import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  currency: string;
  duration_days: number;
  plan_type: string;
  features: string[];
  is_active: boolean;
}

const AdminPlans = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price: 0,
    currency: 'USD',
    duration_days: 30,
    plan_type: 'club',
    features: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedPlans: Plan[] = (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        name_ar: plan.name_ar,
        description: plan.description || '',
        description_ar: plan.description_ar || '',
        price: plan.price,
        currency: plan.currency,
        duration_days: plan.duration_days,
        plan_type: plan.plan_type,
        features: Array.isArray(plan.features) 
          ? (plan.features as unknown[]).map(f => String(f)) 
          : [],
        is_active: plan.is_active,
      }));
      
      setPlans(processedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const planData = {
        name: formData.name,
        name_ar: formData.name_ar,
        description: formData.description,
        description_ar: formData.description_ar,
        price: formData.price,
        currency: formData.currency,
        duration_days: formData.duration_days,
        plan_type: formData.plan_type,
        features: formData.features.split('\n').filter(f => f.trim()),
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast({ title: 'تم تحديث الباقة بنجاح' });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(planData);

        if (error) throw error;
        toast({ title: 'تم إنشاء الباقة بنجاح' });
      }

      setShowDialog(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الباقة',
        variant: 'destructive',
      });
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      toast({ title: 'تم حذف الباقة بنجاح' });
      fetchPlans();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحذف',
        variant: 'destructive',
      });
    }
  };

  const editPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      name_ar: plan.name_ar,
      description: plan.description || '',
      description_ar: plan.description_ar || '',
      price: plan.price,
      currency: plan.currency,
      duration_days: plan.duration_days,
      plan_type: plan.plan_type,
      features: plan.features.join('\n'),
      is_active: plan.is_active,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      price: 0,
      currency: 'USD',
      duration_days: 30,
      plan_type: 'club',
      features: '',
      is_active: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">باقات الاشتراك</h1>
            <p className="text-muted-foreground mt-1">إدارة باقات الاشتراك للأندية واللاعبين</p>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="w-4 h-4 ml-2" />
                إضافة باقة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-card">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الاسم (إنجليزي)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم (عربي)</Label>
                    <Input
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      required
                      className="bg-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الوصف (إنجليزي)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف (عربي)</Label>
                    <Textarea
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      className="bg-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>السعر</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العملة</Label>
                    <Input
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المدة (أيام)</Label>
                    <Input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                      className="bg-secondary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>نوع الباقة</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="club"
                        checked={formData.plan_type === 'club'}
                        onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                      />
                      للأندية
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="player"
                        checked={formData.plan_type === 'player'}
                        onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                      />
                      للاعبين
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>المميزات (كل ميزة في سطر)</Label>
                  <Textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="عرض ملفات اللاعبين&#10;التواصل مع اللاعبين&#10;دعم فني"
                    rows={4}
                    className="bg-secondary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>الباقة مفعّلة</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <Button type="submit" className="w-full btn-gold">
                  {editingPlan ? 'حفظ التعديلات' : 'إنشاء الباقة'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-muted-foreground">جاري التحميل...</p>
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground">لا توجد باقات</p>
          ) : (
            plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card-glass rounded-2xl p-6 ${!plan.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      plan.plan_type === 'club' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {plan.plan_type === 'club' ? 'للأندية' : 'للاعبين'}
                    </span>
                    <h3 className="text-xl font-bold text-foreground mt-2">{plan.name_ar}</h3>
                    <p className="text-sm text-muted-foreground">{plan.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editPlan(plan)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gold" />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-gold">${plan.price}</span>
                  <span className="text-muted-foreground">/ {plan.duration_days} يوم</span>
                </div>

                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description_ar}
                </p>

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gold" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {!plan.is_active && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    (غير مفعّلة)
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
