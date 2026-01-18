import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, CreditCard, Building2, Wallet, ArrowLeft, Copy, CheckCircle, Upload } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
  is_active: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  is_active: boolean;
  config: Record<string, string>;
  instructions: string;
  instructions_ar: string;
}

const Subscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { t, direction, currentLanguage } = useLanguage();
  
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/subscription');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const [plansRes, methodsRes] = await Promise.all([
        supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .eq('plan_type', 'club')
          .order('price', { ascending: true }),
        supabase
          .from('payment_methods_public')
          .select('*')
      ]);

      if (plansRes.error) throw plansRes.error;
      if (methodsRes.error) throw methodsRes.error;

      const processedPlans = (plansRes.data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      }));

      const processedMethods = (methodsRes.data || []).map(pm => ({
        ...pm,
        config: typeof pm.config === 'object' ? pm.config : {}
      }));

      setPlans(processedPlans as SubscriptionPlan[]);
      setPaymentMethods(processedMethods as PaymentMethod[]);
    } catch (error) {
      logError(error, 'Subscription:fetchData');
      toast({
        title: t('common.error', 'خطأ'),
        description: t('subscription.errorLoading', 'حدث خطأ أثناء تحميل البيانات'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'stripe':
      case 'paypal':
      case '2checkout':
        return <CreditCard className="w-6 h-6" />;
      case 'bank_transfer':
        return <Building2 className="w-6 h-6" />;
      default:
        return <Wallet className="w-6 h-6" />;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !selectedPaymentMethod || !user) return;

    // Validate based on payment method type
    const requiresProof = ['bank_transfer', 'wallet', 'fawry', 'opay'].includes(selectedPaymentMethod.type);
    if (requiresProof && !paymentReference && !proofFile) {
      toast({
        title: t('common.error', 'خطأ'),
        description: t('subscription.validationError', 'يرجى إدخال رقم العملية أو رفع إثبات الدفع'),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          payment_method: selectedPaymentMethod.type,
          payment_reference: paymentReference,
          status: requiresProof ? 'active' : 'active', // Could be 'pending' if manual approval needed
          end_date: endDate.toISOString(),
        });

      if (error) throw error;

      toast({
        title: t('common.success', 'تم بنجاح!'),
        description: t('subscription.successMessage', 'تم تسجيل اشتراكك بنجاح'),
      });

      navigate('/club-dashboard');
    } catch (error) {
      logError(error, 'Subscription:handleSubmit');
      toast({
        title: t('common.error', 'خطأ'),
        description: t('subscription.errorPayment', 'حدث خطأ أثناء تسجيل الاشتراك'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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

  if (authLoading || loading) {
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
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step >= s 
                    ? 'bg-gold text-background' 
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded ${
                    step > s ? 'bg-gold' : 'bg-secondary'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Plan */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold text-foreground mb-2">{t('subscription.selectPlan', 'اختر خطة الاشتراك')}</h1>
                  <p className="text-muted-foreground">{t('subscription.selectPlanDesc', 'اختر الخطة المناسبة لناديك للوصول إلى قاعدة بيانات اللاعبين')}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedPlan(plan)}
                      className={`relative cursor-pointer rounded-2xl p-6 transition-all ${
                        selectedPlan?.id === plan.id
                          ? 'ring-2 ring-gold bg-gold/10'
                          : 'card-glass hover:ring-1 hover:ring-gold/50'
                      }`}
                    >
                      {index === 1 && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gold text-background text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            {t('subscription.mostPopular', 'الأكثر شعبية')}
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-foreground mb-1">{currentLanguage?.code === 'en' ? plan.name : plan.name_ar}</h3>
                        <p className="text-sm text-muted-foreground">{getDurationLabel(plan.duration_days)}</p>
                      </div>

                      <div className="text-center mb-6">
                        <span className="text-4xl font-bold text-gold">{formatPrice(plan.price, plan.currency)}</span>
                      </div>

                      {(currentLanguage?.code === 'en' ? plan.description : plan.description_ar) && (
                        <p className="text-sm text-muted-foreground text-center mb-4">
                          {currentLanguage?.code === 'en' ? plan.description : plan.description_ar}
                        </p>
                      )}

                      <ul className="space-y-3">
                        {(plan.features as string[]).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-gold flex-shrink-0" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {selectedPlan?.id === plan.id && (
                        <div className="absolute top-4 left-4">
                          <CheckCircle className="w-6 h-6 text-gold" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {plans.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{t('subscription.noPlans', 'لا توجد خطط متاحة حالياً')}</p>
                  </div>
                )}

                <div className="mt-10 text-center">
                  <Button
                    size="lg"
                    className="btn-gold min-w-[200px]"
                    disabled={!selectedPlan}
                    onClick={() => setStep(2)}
                  >
                    {t('subscription.nextPayment', 'التالي: اختيار طريقة الدفع')}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Payment Method */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('subscription.backToPlan', 'العودة لاختيار الخطة')}
                </button>

                <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold text-foreground mb-2">{t('subscription.selectPayment', 'اختر طريقة الدفع')}</h1>
                  <p className="text-muted-foreground">
                    {t('subscription.selectedPlan', 'الخطة المختارة')}: {currentLanguage?.code === 'en' ? selectedPlan?.name : selectedPlan?.name_ar} - {formatPrice(selectedPlan?.price || 0, selectedPlan?.currency || 'USD')}
                  </p>
                </div>

                <RadioGroup
                  value={selectedPaymentMethod?.id}
                  onValueChange={(value) => {
                    const method = paymentMethods.find(m => m.id === value);
                    setSelectedPaymentMethod(method || null);
                  }}
                  className="grid md:grid-cols-2 gap-4"
                >
                  {paymentMethods.map((method) => (
                    <Label
                      key={method.id}
                      htmlFor={method.id}
                      className={`cursor-pointer rounded-xl p-5 transition-all ${
                        selectedPaymentMethod?.id === method.id
                          ? 'ring-2 ring-gold bg-gold/10'
                          : 'card-glass hover:ring-1 hover:ring-gold/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedPaymentMethod?.id === method.id
                            ? 'bg-gold text-background'
                            : 'bg-secondary text-foreground'
                        }`}>
                          {getPaymentIcon(method.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-foreground">{currentLanguage?.code === 'en' ? method.name : method.name_ar}</p>
                          <p className="text-sm text-muted-foreground">{currentLanguage?.code === 'en' ? method.name_ar : method.name}</p>
                        </div>
                        {selectedPaymentMethod?.id === method.id && (
                          <CheckCircle className="w-6 h-6 text-gold" />
                        )}
                      </div>
                    </Label>
                  ))}
                </RadioGroup>

                {paymentMethods.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{t('subscription.noPaymentMethods', 'لا توجد طرق دفع متاحة حالياً')}</p>
                  </div>
                )}

                <div className="mt-10 text-center">
                  <Button
                    size="lg"
                    className="btn-gold min-w-[200px]"
                    disabled={!selectedPaymentMethod}
                    onClick={() => setStep(3)}
                  >
                    {t('subscription.nextComplete', 'التالي: إتمام الدفع')}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment Details */}
            {step === 3 && selectedPaymentMethod && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('subscription.backToPayment', 'العودة لاختيار طريقة الدفع')}
                </button>

                <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold text-foreground mb-2">{t('subscription.completePayment', 'إتمام الدفع')}</h1>
                  <p className="text-muted-foreground">
                    {currentLanguage?.code === 'en' ? selectedPlan?.name : selectedPlan?.name_ar} - {formatPrice(selectedPlan?.price || 0, selectedPlan?.currency || 'USD')}
                  </p>
                </div>

                <div className="max-w-xl mx-auto">
                  <div className="card-glass rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                        {getPaymentIcon(selectedPaymentMethod.type)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{currentLanguage?.code === 'en' ? selectedPaymentMethod.name : selectedPaymentMethod.name_ar}</p>
                        <p className="text-sm text-muted-foreground">{currentLanguage?.code === 'en' ? selectedPaymentMethod.name_ar : selectedPaymentMethod.name}</p>
                      </div>
                    </div>

                    {/* Payment Details based on type */}
                    {selectedPaymentMethod.type === 'bank_transfer' && (
                      <div className="space-y-4">
                        {Object.entries(selectedPaymentMethod.config || {}).map(([key, value]) => (
                          value && (
                            <div key={key} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                              <div>
                                <p className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</p>
                                <p className="font-medium text-foreground">{value}</p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(value, key)}
                                className="p-2 hover:bg-background rounded-lg transition-colors"
                              >
                                {copied === key ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {selectedPaymentMethod.type === 'wallet' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">رقم المحفظة</p>
                            <p className="text-xl font-bold text-foreground">
                              {selectedPaymentMethod.config?.wallet_number}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(selectedPaymentMethod.config?.wallet_number || '', 'wallet')}
                            className="p-2 hover:bg-background rounded-lg transition-colors"
                          >
                            {copied === 'wallet' ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {['stripe', 'paypal', '2checkout'].includes(selectedPaymentMethod.type) && (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">سيتم تحويلك لإتمام الدفع</p>
                        <Button
                          size="lg"
                          className="btn-gold"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? 'جاري المعالجة...' : `الدفع ${formatPrice(selectedPlan?.price || 0, selectedPlan?.currency || 'USD')}`}
                        </Button>
                      </div>
                    )}

                    {/* Instructions */}
                    {selectedPaymentMethod.instructions_ar && (
                      <div className="mt-6 p-4 bg-gold/10 rounded-lg">
                        <p className="text-sm text-foreground">{selectedPaymentMethod.instructions_ar}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Confirmation for manual methods */}
                  {['bank_transfer', 'wallet', 'fawry', 'opay'].includes(selectedPaymentMethod.type) && (
                    <div className="card-glass rounded-2xl p-6">
                      <h3 className="font-bold text-foreground mb-4">تأكيد الدفع</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>رقم العملية / المرجع</Label>
                          <Input
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="أدخل رقم العملية بعد إتمام التحويل"
                            className="mt-2 bg-secondary"
                          />
                        </div>

                        <div>
                          <Label>أو رفع إثبات الدفع</Label>
                          <div className="mt-2">
                            <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-gold transition-colors">
                              <Upload className="w-5 h-5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {proofFile ? proofFile.name : 'اختر صورة إثبات الدفع'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="sr-only"
                              />
                            </label>
                          </div>
                        </div>

                        <Button
                          size="lg"
                          className="w-full btn-gold"
                          onClick={handleSubmit}
                          disabled={submitting || (!paymentReference && !proofFile)}
                        >
                          {submitting ? 'جاري التأكيد...' : 'تأكيد الدفع وتفعيل الاشتراك'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Subscription;