import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CreditCard, Building2, Wallet, ArrowLeft, Copy, CheckCircle, Upload, Video, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { format, addDays, startOfWeek, isSameDay, isAfter, isBefore } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface ConsultationSettings {
  id: string;
  fee: number;
  currency: string;
  duration_minutes: number;
  description: string;
  description_ar: string;
  is_active: boolean;
}

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
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

interface ExistingBooking {
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

const ConsultationBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, roles } = useAuth();
  const { t, direction, currentLanguage } = useLanguage();
  
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<ConsultationSettings | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [playerNotes, setPlayerNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const isPlayer = roles.some(r => r === 'player');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/consultation-booking');
      return;
    }
    if (!authLoading && user && !isPlayer) {
      toast({
        title: t('common.error', 'خطأ'),
        description: t('consultation.playersOnly', 'هذه الخدمة متاحة للاعبين فقط'),
        variant: 'destructive',
      });
      navigate('/');
      return;
    }
    fetchData();
  }, [user, authLoading, isPlayer]);

  const fetchData = async () => {
    try {
      const [settingsRes, slotsRes, methodsRes, bookingsRes] = await Promise.all([
        supabase
          .from('consultation_settings')
          .select('*')
          .single(),
        supabase
          .from('consultation_slots')
          .select('*')
          .eq('is_active', true)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('payment_methods_public')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('consultation_bookings')
          .select('booking_date, start_time, end_time, status')
          .in('status', ['pending', 'confirmed'])
      ]);

      if (settingsRes.error && settingsRes.error.code !== 'PGRST116') throw settingsRes.error;
      if (slotsRes.error) throw slotsRes.error;
      if (methodsRes.error) throw methodsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      setSettings(settingsRes.data as ConsultationSettings);
      setSlots(slotsRes.data || []);
      setPaymentMethods((methodsRes.data || []).map(pm => ({
        ...pm,
        config: typeof pm.config === 'object' ? pm.config : {}
      })) as PaymentMethod[]);
      setExistingBookings(bookingsRes.data || []);
    } catch (error) {
      logError(error, 'ConsultationBooking:fetchData');
      toast({
        title: t('common.error', 'خطأ'),
        description: t('consultation.errorLoading', 'حدث خطأ أثناء تحميل البيانات'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const dayNames = currentLanguage?.code === 'ar' 
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  };

  const getSlotsForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    return slots.filter(slot => slot.day_of_week === dayOfWeek);
  };

  const isSlotBooked = (date: Date, slot: TimeSlot) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return existingBookings.some(
      b => b.booking_date === dateStr && b.start_time === slot.start_time
    );
  };

  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
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
    if (!selectedDate || !selectedSlot || !selectedPaymentMethod || !user || !settings) return;

    const requiresProof = ['bank_transfer', 'wallet', 'fawry', 'opay'].includes(selectedPaymentMethod.type);
    if (requiresProof && !paymentReference && !proofFile) {
      toast({
        title: t('common.error', 'خطأ'),
        description: t('consultation.validationError', 'يرجى إدخال رقم العملية أو رفع إثبات الدفع'),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      let proofUrl = null;

      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `consultations/${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, proofFile);
        
        if (uploadError) throw uploadError;
        proofUrl = fileName;
      }

      const { error } = await supabase
        .from('consultation_bookings')
        .insert({
          player_user_id: user.id,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          fee_amount: settings.fee,
          fee_currency: settings.currency,
          payment_method: selectedPaymentMethod.type,
          payment_reference: paymentReference || null,
          proof_url: proofUrl,
          player_notes: playerNotes || null,
          status: 'pending',
          payment_status: requiresProof ? 'pending' : 'completed',
        });

      if (error) throw error;

      toast({
        title: t('common.success', 'تم بنجاح!'),
        description: t('consultation.bookingSuccess', 'تم إرسال طلب الحجز وسيتم مراجعته قريباً'),
      });

      navigate('/player-dashboard');
    } catch (error) {
      logError(error, 'ConsultationBooking:handleSubmit');
      toast({
        title: t('common.error', 'خطأ'),
        description: t('consultation.errorBooking', 'حدث خطأ أثناء تسجيل الحجز'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(currentLanguage?.code === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? (currentLanguage?.code === 'ar' ? 'م' : 'PM') : (currentLanguage?.code === 'ar' ? 'ص' : 'AM');
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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

  if (!settings?.is_active) {
    return (
      <div className="min-h-screen bg-background" dir={direction}>
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('consultation.serviceUnavailable', 'خدمة الاستشارات غير متاحة حالياً')}
            </h1>
            <p className="text-muted-foreground">
              {t('consultation.checkLater', 'يرجى المحاولة لاحقاً')}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Video className="w-12 h-12 text-gold mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('consultation.bookTitle', 'حجز استشارة')}
            </h1>
            <p className="text-muted-foreground">
              {currentLanguage?.code === 'ar' ? settings.description_ar : settings.description}
            </p>
            <div className="mt-4 inline-flex items-center gap-4 bg-gold/10 px-6 py-3 rounded-xl">
              <span className="text-sm text-muted-foreground">{t('consultation.fee', 'الرسوم')}:</span>
              <span className="text-2xl font-bold text-gold">{formatPrice(settings.fee, settings.currency)}</span>
              <span className="text-sm text-muted-foreground">/ {settings.duration_minutes} {t('consultation.minutes', 'دقيقة')}</span>
            </div>
          </div>

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
            {/* Step 1: Select Date & Time */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {t('consultation.selectDateTime', 'اختر الموعد')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('consultation.selectDateTimeDesc', 'اختر اليوم والوقت المناسب لك')}
                  </p>
                </div>

                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
                    disabled={isBefore(addDays(currentWeekStart, -1), new Date())}
                  >
                    {direction === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </Button>
                  <span className="font-semibold text-foreground">
                    {format(currentWeekStart, 'MMMM yyyy', { locale: currentLanguage?.code === 'ar' ? ar : enUS })}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
                  >
                    {direction === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-8">
                  {dayNames.map((day, i) => (
                    <div key={i} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                  {getWeekDays().map((date, i) => {
                    const hasSlots = getSlotsForDate(date).length > 0;
                    const isPast = isDateInPast(date);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (!isPast && hasSlots) {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                          }
                        }}
                        disabled={isPast || !hasSlots}
                        className={`
                          p-4 rounded-xl text-center transition-all
                          ${isPast || !hasSlots ? 'opacity-50 cursor-not-allowed bg-secondary' : 'cursor-pointer hover:bg-gold/10'}
                          ${isSelected ? 'bg-gold text-background ring-2 ring-gold' : 'bg-card'}
                        `}
                      >
                        <div className="text-lg font-bold">{format(date, 'd')}</div>
                        {hasSlots && !isPast && (
                          <div className="text-xs text-gold mt-1">
                            {getSlotsForDate(date).filter(s => !isSlotBooked(date, s)).length} {t('consultation.available', 'متاح')}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gold" />
                      {t('consultation.availableSlots', 'الأوقات المتاحة')} - {format(selectedDate, 'EEEE, d MMMM', { locale: currentLanguage?.code === 'ar' ? ar : enUS })}
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {getSlotsForDate(selectedDate).map((slot) => {
                        const isBooked = isSlotBooked(selectedDate, slot);
                        const isSelected = selectedSlot?.id === slot.id;
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => !isBooked && setSelectedSlot(slot)}
                            disabled={isBooked}
                            className={`
                              p-3 rounded-xl text-center transition-all
                              ${isBooked ? 'opacity-50 cursor-not-allowed bg-destructive/10 text-destructive line-through' : 'cursor-pointer hover:bg-gold/10'}
                              ${isSelected ? 'bg-gold text-background ring-2 ring-gold' : 'bg-card border border-border'}
                            `}
                          >
                            <div className="font-medium">{formatTime(slot.start_time)}</div>
                            <div className="text-xs opacity-70">{formatTime(slot.end_time)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                <div className="mt-10 text-center">
                  <Button
                    size="lg"
                    className="btn-gold min-w-[200px]"
                    disabled={!selectedDate || !selectedSlot}
                    onClick={() => setStep(2)}
                  >
                    {t('consultation.nextPayment', 'التالي: طريقة الدفع')}
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
                  {t('consultation.backToDate', 'العودة لاختيار الموعد')}
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {t('consultation.selectPayment', 'اختر طريقة الدفع')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('consultation.selectedSlot', 'الموعد المختار')}: {selectedDate && format(selectedDate, 'EEEE, d MMMM', { locale: currentLanguage?.code === 'ar' ? ar : enUS })} - {selectedSlot && formatTime(selectedSlot.start_time)}
                  </p>
                </div>

                <RadioGroup
                  value={selectedPaymentMethod?.id}
                  onValueChange={(value) => {
                    const method = paymentMethods.find(m => m.id === value);
                    setSelectedPaymentMethod(method || null);
                  }}
                  className="grid md:grid-cols-2 gap-4 mb-8"
                >
                  {paymentMethods.map((method) => (
                    <Label
                      key={method.id}
                      htmlFor={method.id}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                        selectedPaymentMethod?.id === method.id
                          ? 'ring-2 ring-gold bg-gold/10'
                          : 'card-glass hover:ring-1 hover:ring-gold/50'
                      }`}
                    >
                      <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                      <div className="p-3 bg-secondary rounded-xl">
                        {getPaymentIcon(method.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {currentLanguage?.code === 'ar' ? method.name_ar : method.name}
                        </h3>
                      </div>
                      {selectedPaymentMethod?.id === method.id && (
                        <CheckCircle className="w-5 h-5 text-gold" />
                      )}
                    </Label>
                  ))}
                </RadioGroup>

                {paymentMethods.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('consultation.noPaymentMethods', 'لا توجد طرق دفع متاحة')}</p>
                  </div>
                )}

                <div className="mt-10 flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep(1)}
                  >
                    {t('common.back', 'رجوع')}
                  </Button>
                  <Button
                    size="lg"
                    className="btn-gold min-w-[200px]"
                    disabled={!selectedPaymentMethod}
                    onClick={() => setStep(3)}
                  >
                    {t('consultation.nextConfirm', 'التالي: تأكيد الحجز')}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment Details & Confirmation */}
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
                  {t('consultation.backToPayment', 'العودة لاختيار طريقة الدفع')}
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {t('consultation.confirmBooking', 'تأكيد الحجز')}
                  </h2>
                </div>

                {/* Booking Summary */}
                <div className="card-glass p-6 rounded-xl mb-8">
                  <h3 className="font-semibold text-foreground mb-4">{t('consultation.summary', 'ملخص الحجز')}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('consultation.date', 'التاريخ')}:</span>
                      <span className="font-medium text-foreground">
                        {selectedDate && format(selectedDate, 'EEEE, d MMMM yyyy', { locale: currentLanguage?.code === 'ar' ? ar : enUS })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('consultation.time', 'الوقت')}:</span>
                      <span className="font-medium text-foreground">
                        {selectedSlot && `${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('consultation.duration', 'المدة')}:</span>
                      <span className="font-medium text-foreground">{settings.duration_minutes} {t('consultation.minutes', 'دقيقة')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('consultation.paymentMethod', 'طريقة الدفع')}:</span>
                      <span className="font-medium text-foreground">
                        {currentLanguage?.code === 'ar' ? selectedPaymentMethod.name_ar : selectedPaymentMethod.name}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold text-foreground">{t('consultation.total', 'الإجمالي')}:</span>
                        <span className="font-bold text-gold">{formatPrice(settings.fee, settings.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Instructions */}
                {['bank_transfer', 'wallet', 'fawry', 'opay'].includes(selectedPaymentMethod.type) && (
                  <div className="card-glass p-6 rounded-xl mb-8">
                    <h3 className="font-semibold text-foreground mb-4">{t('consultation.paymentInstructions', 'تعليمات الدفع')}</h3>
                    
                    {selectedPaymentMethod.instructions && (
                      <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                        {currentLanguage?.code === 'ar' ? selectedPaymentMethod.instructions_ar : selectedPaymentMethod.instructions}
                      </p>
                    )}

                    {selectedPaymentMethod.config && Object.keys(selectedPaymentMethod.config).length > 0 && (
                      <div className="space-y-3 mb-6">
                        {Object.entries(selectedPaymentMethod.config).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                            <div>
                              <span className="text-xs text-muted-foreground block">{key}</span>
                              <span className="font-mono text-foreground">{value}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(value, key)}
                            >
                              {copied === key ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="paymentReference">{t('consultation.paymentReference', 'رقم العملية / المرجع')}</Label>
                        <Input
                          id="paymentReference"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder={t('consultation.enterReference', 'أدخل رقم العملية')}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="proofFile">{t('consultation.proofUpload', 'رفع إثبات الدفع')}</Label>
                        <div className="mt-1">
                          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">
                              {proofFile ? proofFile.name : t('consultation.clickToUpload', 'انقر لرفع صورة')}
                            </span>
                            <input
                              id="proofFile"
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Player Notes */}
                <div className="card-glass p-6 rounded-xl mb-8">
                  <Label htmlFor="playerNotes">{t('consultation.notes', 'ملاحظات إضافية')} ({t('common.optional', 'اختياري')})</Label>
                  <Textarea
                    id="playerNotes"
                    value={playerNotes}
                    onChange={(e) => setPlayerNotes(e.target.value)}
                    placeholder={t('consultation.notesPlaceholder', 'أي ملاحظات أو استفسارات تود ذكرها...')}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="mt-10 flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep(2)}
                  >
                    {t('common.back', 'رجوع')}
                  </Button>
                  <Button
                    size="lg"
                    className="btn-gold min-w-[200px]"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                        {t('common.loading', 'جاري...')}
                      </>
                    ) : (
                      t('consultation.confirmAndBook', 'تأكيد الحجز')
                    )}
                  </Button>
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

export default ConsultationBooking;
