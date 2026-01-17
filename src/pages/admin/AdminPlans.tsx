import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Check, ChevronDown, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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

// Predefined features with categories
const PREDEFINED_FEATURES = {
  viewing: {
    label: 'عرض اللاعبين',
    features: [
      { id: 'view_5_players', label: 'مشاهدة 5 لاعبين', label_ar: 'مشاهدة 5 لاعبين' },
      { id: 'view_10_players', label: 'مشاهدة 10 لاعبين', label_ar: 'مشاهدة 10 لاعبين' },
      { id: 'view_25_players', label: 'مشاهدة 25 لاعب', label_ar: 'مشاهدة 25 لاعب' },
      { id: 'view_50_players', label: 'مشاهدة 50 لاعب', label_ar: 'مشاهدة 50 لاعب' },
      { id: 'view_unlimited', label: 'مشاهدة غير محدودة', label_ar: 'مشاهدة غير محدودة للاعبين' },
    ],
  },
  priority: {
    label: 'أولوية العرض',
    features: [
      { id: 'priority_featured', label: 'عرض اللاعبين المتميزين أولاً', label_ar: 'أولوية عرض اللاعبين المتميزين' },
      { id: 'priority_new', label: 'عرض اللاعبين الجدد أولاً', label_ar: 'أولوية عرض اللاعبين الجدد' },
      { id: 'priority_top_rated', label: 'عرض الأعلى تقييماً أولاً', label_ar: 'أولوية عرض الأعلى تقييماً' },
      { id: 'early_access', label: 'الوصول المبكر للاعبين الجدد', label_ar: 'الوصول المبكر للاعبين الجدد' },
    ],
  },
  search: {
    label: 'البحث والفلترة',
    features: [
      { id: 'basic_search', label: 'البحث الأساسي', label_ar: 'البحث الأساسي' },
      { id: 'advanced_filter', label: 'الفلترة المتقدمة', label_ar: 'الفلترة المتقدمة' },
      { id: 'filter_position', label: 'فلترة حسب المركز', label_ar: 'الفلترة حسب المركز' },
      { id: 'filter_nationality', label: 'فلترة حسب الجنسية', label_ar: 'الفلترة حسب الجنسية' },
      { id: 'filter_age', label: 'فلترة حسب العمر', label_ar: 'الفلترة حسب العمر' },
      { id: 'filter_physical', label: 'فلترة حسب المواصفات الجسدية', label_ar: 'الفلترة حسب المواصفات الجسدية' },
      { id: 'save_searches', label: 'حفظ عمليات البحث', label_ar: 'حفظ عمليات البحث' },
    ],
  },
  verification: {
    label: 'التوثيق والميزات',
    features: [
      { id: 'club_verification', label: 'توثيق النادي', label_ar: 'توثيق النادي (علامة زرقاء)' },
      { id: 'verified_badge', label: 'شارة التوثيق', label_ar: 'شارة التوثيق المميزة' },
      { id: 'priority_support', label: 'دعم فني أولوي', label_ar: 'دعم فني ذو أولوية' },
      { id: 'dedicated_manager', label: 'مدير حساب مخصص', label_ar: 'مدير حساب مخصص' },
    ],
  },
  communication: {
    label: 'التواصل',
    features: [
      { id: 'message_5', label: '5 رسائل شهرياً', label_ar: '5 رسائل شهرياً' },
      { id: 'message_20', label: '20 رسالة شهرياً', label_ar: '20 رسالة شهرياً' },
      { id: 'message_50', label: '50 رسالة شهرياً', label_ar: '50 رسالة شهرياً' },
      { id: 'message_unlimited', label: 'رسائل غير محدودة', label_ar: 'رسائل غير محدودة' },
      { id: 'direct_contact', label: 'التواصل المباشر مع اللاعبين', label_ar: 'التواصل المباشر مع اللاعبين' },
      { id: 'contact_info', label: 'عرض معلومات الاتصال', label_ar: 'عرض معلومات الاتصال الكاملة' },
    ],
  },
  extras: {
    label: 'مميزات إضافية',
    features: [
      { id: 'favorites', label: 'إضافة للمفضلة', label_ar: 'إضافة لاعبين للمفضلة' },
      { id: 'favorites_unlimited', label: 'مفضلة غير محدودة', label_ar: 'قائمة مفضلة غير محدودة' },
      { id: 'player_videos', label: 'مشاهدة فيديوهات اللاعبين', label_ar: 'مشاهدة فيديوهات اللاعبين' },
      { id: 'download_cv', label: 'تحميل السيرة الذاتية', label_ar: 'تحميل السيرة الذاتية للاعب' },
      { id: 'export_list', label: 'تصدير قائمة اللاعبين', label_ar: 'تصدير قائمة اللاعبين' },
      { id: 'analytics', label: 'إحصائيات وتقارير', label_ar: 'إحصائيات وتقارير مفصلة' },
      { id: 'no_ads', label: 'بدون إعلانات', label_ar: 'تجربة بدون إعلانات' },
    ],
  },
};

// Flatten features for easy lookup
const ALL_FEATURES = Object.values(PREDEFINED_FEATURES).flatMap(cat => cat.features);

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
    selectedFeatures: [] as string[],
    customFeatures: '',
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

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter(f => f !== featureId)
        : [...prev.selectedFeatures, featureId],
    }));
  };

  const removeFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.filter(f => f !== featureId),
    }));
  };

  const getFeatureLabel = (featureId: string) => {
    const feature = ALL_FEATURES.find(f => f.id === featureId);
    return feature?.label_ar || featureId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Combine selected features (as Arabic labels) + custom features
      const featureLabels = formData.selectedFeatures.map(id => getFeatureLabel(id));
      const customFeaturesList = formData.customFeatures.split('\n').filter(f => f.trim());
      const allFeatures = [...featureLabels, ...customFeaturesList];

      const planData = {
        name: formData.name,
        name_ar: formData.name_ar,
        description: formData.description,
        description_ar: formData.description_ar,
        price: formData.price,
        currency: formData.currency,
        duration_days: formData.duration_days,
        plan_type: formData.plan_type,
        features: allFeatures,
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
    
    // Try to match existing features back to IDs
    const matchedFeatures: string[] = [];
    const unmatchedFeatures: string[] = [];
    
    plan.features.forEach(feature => {
      const found = ALL_FEATURES.find(f => f.label_ar === feature || f.label === feature);
      if (found) {
        matchedFeatures.push(found.id);
      } else {
        unmatchedFeatures.push(feature);
      }
    });

    setFormData({
      name: plan.name,
      name_ar: plan.name_ar,
      description: plan.description || '',
      description_ar: plan.description_ar || '',
      price: plan.price,
      currency: plan.currency,
      duration_days: plan.duration_days,
      plan_type: plan.plan_type,
      selectedFeatures: matchedFeatures,
      customFeatures: unmatchedFeatures.join('\n'),
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
      selectedFeatures: [],
      customFeatures: '',
      is_active: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">باقات الاشتراك</h1>
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
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
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف (عربي)</Label>
                    <Textarea
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      className="bg-secondary"
                      rows={2}
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="club"
                        checked={formData.plan_type === 'club'}
                        onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                        className="accent-gold"
                      />
                      للأندية
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="player"
                        checked={formData.plan_type === 'player'}
                        onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                        className="accent-gold"
                      />
                      للاعبين
                    </label>
                  </div>
                </div>

                {/* Features Dropdown */}
                <div className="space-y-3">
                  <Label>المميزات</Label>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between bg-secondary">
                        <span>اختر المميزات ({formData.selectedFeatures.length} محددة)</span>
                        <ChevronDown className="w-4 h-4 mr-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 max-h-[400px] overflow-y-auto bg-card border-border">
                      {Object.entries(PREDEFINED_FEATURES).map(([key, category]) => (
                        <div key={key}>
                          <DropdownMenuLabel className="text-gold font-bold">
                            {category.label}
                          </DropdownMenuLabel>
                          {category.features.map(feature => (
                            <DropdownMenuCheckboxItem
                              key={feature.id}
                              checked={formData.selectedFeatures.includes(feature.id)}
                              onCheckedChange={() => toggleFeature(feature.id)}
                              className="cursor-pointer"
                            >
                              {feature.label_ar}
                            </DropdownMenuCheckboxItem>
                          ))}
                          <DropdownMenuSeparator />
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Selected Features Display */}
                  {formData.selectedFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-secondary/50 rounded-lg">
                      {formData.selectedFeatures.map(featureId => (
                        <Badge
                          key={featureId}
                          variant="secondary"
                          className="flex items-center gap-1 bg-gold/20 text-gold"
                        >
                          <Check className="w-3 h-3" />
                          {getFeatureLabel(featureId)}
                          <button
                            type="button"
                            onClick={() => removeFeature(featureId)}
                            className="mr-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Custom Features */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">مميزات إضافية (كل ميزة في سطر)</Label>
                    <Textarea
                      value={formData.customFeatures}
                      onChange={(e) => setFormData({ ...formData, customFeatures: e.target.value })}
                      placeholder="أضف مميزات مخصصة..."
                      rows={2}
                      className="bg-secondary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
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
            <div className="col-span-full flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">لا توجد باقات</p>
            </div>
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

                {plan.description_ar && (
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description_ar}
                  </p>
                )}

                <ul className="space-y-2">
                  {plan.features.slice(0, 6).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-gold flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 6 && (
                    <li className="text-sm text-muted-foreground">
                      + {plan.features.length - 6} مميزات أخرى
                    </li>
                  )}
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
