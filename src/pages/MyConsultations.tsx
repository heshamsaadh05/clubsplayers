import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Video, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface ConsultationBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  fee_amount: number;
  fee_currency: string;
  status: string;
  payment_status: string;
  meet_link: string | null;
  admin_notes: string | null;
  player_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
}

const MyConsultations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, roles } = useAuth();
  const { t, direction, currentLanguage } = useLanguage();
  
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const isPlayer = roles.includes('player');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/my-consultations');
      return;
    }
    
    // Wait for roles to be loaded before checking player status
    if (!authLoading && user && roles.length > 0) {
      if (!isPlayer) {
        toast({
          title: t('common.error', 'خطأ'),
          description: t('consultation.playersOnly', 'هذه الخدمة متاحة للاعبين فقط'),
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      fetchBookings();
    }
  }, [user, authLoading, roles, isPlayer]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_bookings')
        .select('*')
        .eq('player_user_id', user?.id)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      logError(error, 'MyConsultations:fetchBookings');
      toast({
        title: t('common.error', 'خطأ'),
        description: t('consultation.errorLoading', 'حدث خطأ أثناء تحميل البيانات'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          label: currentLanguage?.code === 'ar' ? 'مؤكد' : 'Confirmed',
          icon: CheckCircle,
          color: 'bg-green-500/10 text-green-500 border-green-500/30',
        };
      case 'cancelled':
        return {
          label: currentLanguage?.code === 'ar' ? 'ملغي' : 'Cancelled',
          icon: XCircle,
          color: 'bg-red-500/10 text-red-500 border-red-500/30',
        };
      case 'completed':
        return {
          label: currentLanguage?.code === 'ar' ? 'مكتمل' : 'Completed',
          icon: CheckCircle,
          color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
        };
      default:
        return {
          label: currentLanguage?.code === 'ar' ? 'قيد المراجعة' : 'Pending',
          icon: AlertCircle,
          color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
        };
    }
  };

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: currentLanguage?.code === 'ar' ? 'مدفوع' : 'Paid',
          color: 'bg-green-500/10 text-green-500',
        };
      case 'failed':
        return {
          label: currentLanguage?.code === 'ar' ? 'فشل' : 'Failed',
          color: 'bg-red-500/10 text-red-500',
        };
      default:
        return {
          label: currentLanguage?.code === 'ar' ? 'قيد الانتظار' : 'Pending',
          color: 'bg-yellow-500/10 text-yellow-500',
        };
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? (currentLanguage?.code === 'ar' ? 'م' : 'PM') : (currentLanguage?.code === 'ar' ? 'ص' : 'AM');
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(currentLanguage?.code === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const isUpcoming = (booking: ConsultationBooking) => {
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    return bookingDateTime > new Date() && booking.status !== 'cancelled';
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

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter(b => !isUpcoming(b));

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/player-dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Video className="w-6 h-6 text-gold" />
                  {t('consultation.myBookings', 'حجوزاتي')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t('consultation.myBookingsDesc', 'عرض جميع حجوزات الاستشارات')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchBookings}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                className="btn-gold"
                onClick={() => navigate('/consultation-booking')}
              >
                {t('consultation.bookNew', 'حجز جديد')}
              </Button>
            </div>
          </div>

          {bookings.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t('consultation.noBookings', 'لا توجد حجوزات')}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t('consultation.noBookingsDesc', 'لم تقم بحجز أي استشارة بعد')}
                </p>
                <Button
                  className="btn-gold"
                  onClick={() => navigate('/consultation-booking')}
                >
                  {t('consultation.bookNow', 'احجز الآن')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Bookings */}
              {upcomingBookings.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gold" />
                    {t('consultation.upcoming', 'الحجوزات القادمة')}
                    <Badge variant="secondary">{upcomingBookings.length}</Badge>
                  </h2>
                  <div className="space-y-4">
                    {upcomingBookings.map((booking, index) => {
                      const statusConfig = getStatusConfig(booking.status);
                      const StatusIcon = statusConfig.icon;
                      const paymentConfig = getPaymentStatusConfig(booking.payment_status);

                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="border-gold/30 bg-gold/5">
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-14 h-14 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                                    <Video className="w-7 h-7 text-gold" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-foreground">
                                        {format(new Date(booking.booking_date), 'EEEE, d MMMM yyyy', { 
                                          locale: currentLanguage?.code === 'ar' ? ar : enUS 
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                      <Clock className="w-4 h-4" />
                                      <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge className={statusConfig.color} variant="outline">
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {statusConfig.label}
                                      </Badge>
                                      <Badge className={paymentConfig.color}>
                                        {paymentConfig.label}
                                      </Badge>
                                      <span className="text-sm font-medium text-gold">
                                        {formatPrice(booking.fee_amount, booking.fee_currency)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {booking.status === 'confirmed' && booking.meet_link && (
                                  <Button
                                    className="btn-gold"
                                    onClick={() => window.open(booking.meet_link!, '_blank')}
                                  >
                                    <Video className="w-4 h-4 ml-2" />
                                    {t('consultation.joinMeeting', 'انضم للاجتماع')}
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                  </Button>
                                )}
                              </div>

                              {booking.admin_notes && (
                                <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {t('consultation.adminNotes', 'ملاحظات الإدارة')}:
                                  </p>
                                  <p className="text-sm text-foreground">{booking.admin_notes}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    {t('consultation.past', 'الحجوزات السابقة')}
                    <Badge variant="secondary">{pastBookings.length}</Badge>
                  </h2>
                  <div className="space-y-3">
                    {pastBookings.map((booking, index) => {
                      const statusConfig = getStatusConfig(booking.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card className="opacity-80 hover:opacity-100 transition-opacity">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                    <Video className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-foreground text-sm">
                                      {format(new Date(booking.booking_date), 'd MMMM yyyy', { 
                                        locale: currentLanguage?.code === 'ar' ? ar : enUS 
                                      })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={statusConfig.color} variant="outline">
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusConfig.label}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {formatPrice(booking.fee_amount, booking.fee_currency)}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MyConsultations;
