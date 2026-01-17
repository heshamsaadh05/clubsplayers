import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, X, Crown, Sparkles, Shield, MessageCircle, Search, Eye, Star, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
  is_active: boolean;
}

// Feature categories with icons
const FEATURE_CATEGORIES = {
  viewing: {
    label: 'عرض اللاعبين',
    icon: Eye,
    features: [
      { id: 'view_5_players', label: 'مشاهدة 5 لاعبين شهرياً' },
      { id: 'view_10_players', label: 'مشاهدة 10 لاعبين شهرياً' },
      { id: 'view_25_players', label: 'مشاهدة 25 لاعب شهرياً' },
      { id: 'view_50_players', label: 'مشاهدة 50 لاعب شهرياً' },
      { id: 'view_unlimited', label: 'مشاهدة غير محدودة للاعبين' },
    ],
  },
  priority: {
    label: 'أولوية العرض',
    icon: Star,
    features: [
      { id: 'priority_featured', label: 'أولوية عرض اللاعبين المتميزين' },
      { id: 'priority_new', label: 'أولوية عرض اللاعبين الجدد' },
      { id: 'priority_top_rated', label: 'أولوية عرض الأعلى تقييماً' },
      { id: 'early_access', label: 'الوصول المبكر للاعبين الجدد' },
    ],
  },
  search: {
    label: 'البحث والفلترة',
    icon: Search,
    features: [
      { id: 'basic_search', label: 'البحث الأساسي' },
      { id: 'advanced_filter', label: 'الفلترة المتقدمة' },
      { id: 'filter_position', label: 'الفلترة حسب المركز' },
      { id: 'filter_nationality', label: 'الفلترة حسب الجنسية' },
      { id: 'filter_age', label: 'الفلترة حسب العمر' },
      { id: 'filter_physical', label: 'الفلترة حسب المواصفات الجسدية' },
      { id: 'save_searches', label: 'حفظ عمليات البحث' },
    ],
  },
  verification: {
    label: 'التوثيق والميزات',
    icon: Shield,
    features: [
      { id: 'club_verification', label: 'توثيق النادي (علامة زرقاء)' },
      { id: 'verified_badge', label: 'شارة التوثيق المميزة' },
      { id: 'priority_support', label: 'دعم فني ذو أولوية' },
      { id: 'dedicated_manager', label: 'مدير حساب مخصص' },
    ],
  },
  communication: {
    label: 'التواصل',
    icon: MessageCircle,
    features: [
      { id: 'message_5', label: '5 رسائل شهرياً' },
      { id: 'message_20', label: '20 رسالة شهرياً' },
      { id: 'message_50', label: '50 رسالة شهرياً' },
      { id: 'message_unlimited', label: 'رسائل غير محدودة' },
      { id: 'direct_contact', label: 'التواصل المباشر مع اللاعبين' },
      { id: 'contact_info', label: 'عرض معلومات الاتصال الكاملة' },
    ],
  },
  extras: {
    label: 'مميزات إضافية',
    icon: Sparkles,
    features: [
      { id: 'favorites', label: 'إضافة لاعبين للمفضلة' },
      { id: 'favorites_unlimited', label: 'قائمة مفضلة غير محدودة' },
      { id: 'player_videos', label: 'مشاهدة فيديوهات اللاعبين' },
      { id: 'download_cv', label: 'تحميل السيرة الذاتية للاعب' },
      { id: 'export_list', label: 'تصدير قائمة اللاعبين' },
      { id: 'analytics', label: 'إحصائيات وتقارير مفصلة' },
      { id: 'no_ads', label: 'تجربة بدون إعلانات' },
    ],
  },
};

const PlansComparison = () => {
  const navigate = useNavigate();
  const { t, direction, currentLanguage } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .eq('plan_type', 'club')
        .order('price', { ascending: true });

      if (error) throw error;

      const processedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      }));

      setPlans(processedPlans as SubscriptionPlan[]);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getDurationLabel = (days: number) => {
    if (days === 30) return t('subscription.monthly', 'شهري');
    if (days === 90) return t('subscription.quarterly', '3 أشهر');
    if (days === 180) return t('subscription.semiAnnual', '6 أشهر');
    if (days === 365) return t('subscription.annual', 'سنوي');
    return `${days} ${currentLanguage?.code === 'en' ? 'days' : 'يوم'}`;
  };

  const hasFeature = (plan: SubscriptionPlan, featureId: string) => {
    return plan.features.some(f => 
      f === featureId || 
      f.includes(featureId) ||
      featureId.includes(f.split(' ')[0])
    );
  };

  const getFeatureValue = (plan: SubscriptionPlan, category: string, featureId: string) => {
    // Check for mutually exclusive features (like view limits)
    if (category === 'viewing') {
      const viewFeatures = ['view_5_players', 'view_10_players', 'view_25_players', 'view_50_players', 'view_unlimited'];
      for (const vf of viewFeatures) {
        if (plan.features.includes(vf)) {
          return featureId === vf;
        }
      }
    }
    
    if (category === 'communication') {
      const msgFeatures = ['message_5', 'message_20', 'message_50', 'message_unlimited'];
      for (const mf of msgFeatures) {
        if (plan.features.includes(mf) && msgFeatures.includes(featureId)) {
          return featureId === mf;
        }
      }
    }

    return plan.features.includes(featureId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading', 'جاري التحميل...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('plans.title', 'قارن بين الباقات')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('plans.subtitle', 'اختر الباقة المناسبة لاحتياجات ناديك واستمتع بجميع المميزات')}
            </p>
          </motion.div>

          {/* Plans Cards - Mobile */}
          <div className="md:hidden space-y-6 mb-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative overflow-hidden ${index === 1 ? 'ring-2 ring-gold' : ''}`}>
                  {index === 1 && (
                    <div className="absolute top-0 right-0 left-0 bg-gold text-background text-center py-1 text-sm font-bold flex items-center justify-center gap-1">
                      <Crown className="w-4 h-4" />
                      {t('subscription.mostPopular', 'الأكثر شعبية')}
                    </div>
                  )}
                  <CardHeader className={index === 1 ? 'pt-10' : ''}>
                    <CardTitle className="text-2xl text-center">{currentLanguage?.code === 'en' ? plan.name : plan.name_ar}</CardTitle>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-gold">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className="text-muted-foreground">/{getDurationLabel(plan.duration_days)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-gold flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full btn-gold"
                      onClick={() => navigate('/subscription')}
                    >
                      {t('plans.subscribeNow', 'اشترك الآن')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table - Desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="hidden md:block overflow-x-auto"
          >
            <div className="min-w-[800px]">
              {/* Plans Header */}
              <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `250px repeat(${plans.length}, 1fr)` }}>
                <div></div>
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-2xl p-6 text-center ${
                      index === 1 
                        ? 'bg-gold/20 ring-2 ring-gold' 
                        : 'card-glass'
                    }`}
                  >
                    {index === 1 && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-background">
                        <Crown className="w-3 h-3 ml-1" />
                        {t('subscription.mostPopular', 'الأكثر شعبية')}
                      </Badge>
                    )}
                    <h3 className="text-xl font-bold text-foreground mb-2">{currentLanguage?.code === 'en' ? plan.name : plan.name_ar}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-gold">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {getDurationLabel(plan.duration_days)}
                    </p>
                    <Button 
                      className={`w-full ${index === 1 ? 'btn-gold' : ''}`}
                      variant={index === 1 ? 'default' : 'outline'}
                      onClick={() => navigate('/subscription')}
                    >
                      {t('plans.subscribeNow', 'اشترك الآن')}
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Features Comparison */}
              {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => (
                <div key={categoryKey} className="mb-6">
                  <div 
                    className="grid gap-4 items-center bg-secondary/50 rounded-lg p-3 mb-2"
                    style={{ gridTemplateColumns: `250px repeat(${plans.length}, 1fr)` }}
                  >
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <category.icon className="w-5 h-5 text-gold" />
                      {category.label}
                    </div>
                    {plans.map(plan => (
                      <div key={plan.id}></div>
                    ))}
                  </div>
                  
                  {category.features.map((feature, featureIndex) => (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: featureIndex * 0.02 }}
                      className="grid gap-4 items-center py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors rounded"
                      style={{ gridTemplateColumns: `250px repeat(${plans.length}, 1fr)` }}
                    >
                      <div className="text-sm text-muted-foreground pr-4">
                        {feature.label}
                      </div>
                      {plans.map(plan => {
                        const hasIt = getFeatureValue(plan, categoryKey, feature.id);
                        return (
                          <div key={plan.id} className="text-center">
                            {hasIt ? (
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                                <Check className="w-5 h-5 text-green-500" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-destructive/20">
                                <X className="w-5 h-5 text-destructive/50" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  ))}
                </div>
              ))}

              {/* Bottom CTA */}
              <div 
                className="grid gap-4 mt-8 pt-8 border-t border-border"
                style={{ gridTemplateColumns: `250px repeat(${plans.length}, 1fr)` }}
              >
                <div></div>
                {plans.map((plan, index) => (
                  <div key={plan.id} className="text-center">
                    <Button 
                      size="lg"
                      className={`w-full ${index === 1 ? 'btn-gold' : ''}`}
                      variant={index === 1 ? 'default' : 'outline'}
                      onClick={() => navigate('/subscription')}
                    >
                      <Zap className="w-4 h-4 ml-2" />
                      {t('plans.subscribeTo', 'اشترك في')} {currentLanguage?.code === 'en' ? plan.name : plan.name_ar}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              {t('plans.faq', 'الأسئلة الشائعة')}
            </h2>
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-foreground mb-2">{t('plans.faq.upgrade', 'هل يمكنني ترقية باقتي؟')}</h3>
                  <p className="text-muted-foreground">
                    {t('plans.faq.upgradeAnswer', 'نعم، يمكنك الترقية في أي وقت. سيتم احتساب الفرق بين الباقتين فقط.')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-foreground mb-2">{t('plans.faq.expiry', 'ماذا يحدث عند انتهاء الاشتراك؟')}</h3>
                  <p className="text-muted-foreground">
                    {t('plans.faq.expiryAnswer', 'ستظل بياناتك محفوظة، لكن لن تتمكن من الوصول للمميزات المدفوعة حتى تجدد اشتراكك.')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-foreground mb-2">{t('plans.faq.limits', 'هل يتم تجديد حدود الاستخدام شهرياً؟')}</h3>
                  <p className="text-muted-foreground">
                    {t('plans.faq.limitsAnswer', 'نعم، يتم إعادة تعيين حدود المشاهدة والرسائل في بداية كل شهر.')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PlansComparison;
