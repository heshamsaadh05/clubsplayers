import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Settings2, 
  Users, 
  Trash2, 
  Save,
  CheckCircle2,
  XCircle,
  Eye,
  Video,
  FileText,
  AlertCircle,
  Loader2,
  CalendarRange,
  Repeat
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AddSlotDialog } from '@/components/admin/AddSlotDialog';
import PrivateImage from '@/components/admin/PrivateImage';

interface ConsultationSettings {
  id: string;
  fee: number;
  currency: string;
  duration_minutes: number;
  is_active: boolean;
  description: string | null;
  description_ar: string | null;
}

interface ConsultationSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  recurrence_type: string;
  start_date: string | null;
  end_date: string | null;
  specific_dates: string[] | null;
}

interface ConsultationBooking {
  id: string;
  player_user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  fee_amount: number;
  fee_currency: string;
  payment_method: string | null;
  proof_url: string | null;
  meet_link: string | null;
  player_notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  confirmed: 'bg-green-500/10 text-green-500',
  cancelled: 'bg-red-500/10 text-red-500',
  completed: 'bg-blue-500/10 text-blue-500',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  paid: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
};

const AdminConsultations = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<ConsultationSettings>({
    id: '',
    fee: 0,
    currency: 'USD',
    duration_minutes: 30,
    is_active: true,
    description: '',
    description_ar: '',
  });
  
  // Slots state
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  
  // Bookings state
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);
  const [meetLink, setMeetLink] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [creatingMeet, setCreatingMeet] = useState(false);
  const [googleApiConfigured, setGoogleApiConfigured] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSettings(),
        fetchSlots(),
        fetchBookings(),
        checkGoogleApiConfig(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleApiConfig = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'google_api_settings')
      .single();
    
    if (data?.value) {
      const settings = data.value as { serviceAccountKey?: string };
      setGoogleApiConfigured(!!settings.serviceAccountKey);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('consultation_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }

    if (data) {
      setSettings(data);
    }
  };

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from('consultation_slots')
      .select('*')
      .order('day_of_week')
      .order('start_time');

    if (error) {
      console.error('Error fetching slots:', error);
      return;
    }

    setSlots(data || []);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    setBookings(data || []);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('consultation_settings')
          .update({
            fee: settings.fee,
            currency: settings.currency,
            duration_minutes: settings.duration_minutes,
            is_active: settings.is_active,
            description: settings.description,
            description_ar: settings.description_ar,
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('consultation_settings')
          .insert({
            fee: settings.fee,
            currency: settings.currency,
            duration_minutes: settings.duration_minutes,
            is_active: settings.is_active,
            description: settings.description,
            description_ar: settings.description_ar,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }

      toast({ title: 'تم حفظ الإعدادات بنجاح' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // handleAddSlot removed - now using AddSlotDialog component



  const handleToggleSlot = async (slotId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('consultation_slots')
        .update({ is_active: isActive })
        .eq('id', slotId);

      if (error) throw error;

      setSlots(slots.map(s => s.id === slotId ? { ...s, is_active: isActive } : s));
    } catch (error) {
      console.error('Error toggling slot:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الفترة',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('consultation_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      setSlots(slots.filter(s => s.id !== slotId));
      toast({ title: 'تم حذف الفترة الزمنية' });
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الفترة',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBooking = async (bookingId: string, updates: Partial<ConsultationBooking>) => {
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .update(updates)
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.map(b => b.id === bookingId ? { ...b, ...updates } : b));
      setSelectedBooking(null);
      toast({ title: 'تم تحديث الحجز بنجاح' });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الحجز',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmBooking = async (booking: ConsultationBooking) => {
    // If Google API is configured, create Meet link automatically
    if (googleApiConfigured) {
      await handleCreateMeetAndConfirm(booking);
    } else {
      // Manual confirmation with provided meet link
      await handleUpdateBooking(booking.id, {
        status: 'confirmed',
        payment_status: 'completed',
        meet_link: meetLink || booking.meet_link,
        admin_notes: adminNotes || booking.admin_notes,
      });
    }
  };

  const handleCreateMeetAndConfirm = async (booking: ConsultationBooking) => {
    setCreatingMeet(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-google-meet', {
        body: { bookingId: booking.id },
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        setBookings(bookings.map(b => 
          b.id === booking.id 
            ? { ...b, status: 'confirmed', payment_status: 'completed', meet_link: data.meetLink }
            : b
        ));
        setSelectedBooking(null);
        toast({
          title: 'تم تأكيد الحجز',
          description: 'تم إنشاء رابط Google Meet تلقائياً',
        });
      } else {
        throw new Error(data.error || 'فشل في إنشاء رابط الاجتماع');
      }
    } catch (error) {
      console.error('Error creating Meet:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء رابط الاجتماع',
        variant: 'destructive',
      });
    } finally {
      setCreatingMeet(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    await handleUpdateBooking(bookingId, { status: 'cancelled' });
  };

  const openBookingDetails = (booking: ConsultationBooking) => {
    setSelectedBooking(booking);
    setMeetLink(booking.meet_link || '');
    setAdminNotes(booking.admin_notes || '');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة الاستشارات</h1>
            <p className="text-muted-foreground mt-1">إدارة جلسات الاستشارة عبر Google Meet</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الحجوزات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">في انتظار المراجعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">مؤكدة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{slots.filter(s => s.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">فترات متاحة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="w-4 h-4" />
              الإعدادات
            </TabsTrigger>
            <TabsTrigger value="slots" className="gap-2">
              <Calendar className="w-4 h-4" />
              الفترات الزمنية
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Users className="w-4 h-4" />
              الحجوزات
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass rounded-2xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">إعدادات الاستشارة</h2>
                    <p className="text-sm text-muted-foreground">تحديد الرسوم والمدة</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="is-active">تفعيل الاستشارات</Label>
                  <Switch
                    id="is-active"
                    checked={settings.is_active}
                    onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>رسوم الاستشارة</Label>
                  <Input
                    type="number"
                    value={settings.fee}
                    onChange={(e) => setSettings({ ...settings, fee: parseFloat(e.target.value) || 0 })}
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => setSettings({ ...settings, currency: value })}
                  >
                    <SelectTrigger className="bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - دولار أمريكي</SelectItem>
                      <SelectItem value="EUR">EUR - يورو</SelectItem>
                      <SelectItem value="SAR">SAR - ريال سعودي</SelectItem>
                      <SelectItem value="AED">AED - درهم إماراتي</SelectItem>
                      <SelectItem value="EGP">EGP - جنيه مصري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>مدة الجلسة (دقيقة)</Label>
                  <Select
                    value={settings.duration_minutes.toString()}
                    onValueChange={(value) => setSettings({ ...settings, duration_minutes: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 دقيقة</SelectItem>
                      <SelectItem value="30">30 دقيقة</SelectItem>
                      <SelectItem value="45">45 دقيقة</SelectItem>
                      <SelectItem value="60">60 دقيقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>وصف الاستشارة (إنجليزي)</Label>
                  <Textarea
                    value={settings.description || ''}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    placeholder="Describe the consultation service..."
                    className="bg-secondary min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف الاستشارة (عربي)</Label>
                  <Textarea
                    value={settings.description_ar || ''}
                    onChange={(e) => setSettings({ ...settings, description_ar: e.target.value })}
                    placeholder="وصف خدمة الاستشارة..."
                    className="bg-secondary min-h-[100px]"
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} className="btn-gold">
                <Save className="w-4 h-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
            </motion.div>
          </TabsContent>

          {/* Time Slots Tab */}
          <TabsContent value="slots">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Add New Slot - New Dialog Component */}
              <Card className="card-glass">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarRange className="w-5 h-5 text-gold" />
                    إدارة الفترات الزمنية
                  </CardTitle>
                  <AddSlotDialog onSlotAdded={fetchSlots} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    أضف فترات زمنية متكررة أسبوعياً أو لنطاق تاريخ محدد أو لتواريخ مخصصة
                  </p>
                </CardContent>
              </Card>

              {/* Slots List - Enhanced View */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>الفترات الزمنية المتاحة ({slots.length})</span>
                    {slots.length > 0 && (
                      <Badge variant="secondary">
                        {slots.filter(s => s.is_active).length} نشطة
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {slots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد فترات زمنية محددة</p>
                      <p className="text-sm">أضف فترات لتمكين اللاعبين من الحجز</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {DAYS_OF_WEEK.map(day => {
                        const daySlots = slots.filter(s => s.day_of_week === day.value);
                        if (daySlots.length === 0) return null;

                        return (
                          <div key={day.value} className="border border-border rounded-xl p-4">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              {day.label}
                              <Badge variant="outline" className="text-xs">
                                {daySlots.length} فترة
                              </Badge>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {daySlots.map(slot => (
                                <div
                                  key={slot.id}
                                  className={`flex flex-col gap-1 px-3 py-2 rounded-lg border transition-colors ${
                                    slot.is_active 
                                      ? 'bg-gold/10 border-gold/30' 
                                      : 'bg-secondary/50 border-border opacity-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      {slot.start_time} - {slot.end_time}
                                    </span>
                                    <Switch
                                      checked={slot.is_active}
                                      onCheckedChange={(checked) => handleToggleSlot(slot.id, checked)}
                                      className="scale-75"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteSlot(slot.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  {/* Show recurrence info */}
                                  {slot.recurrence_type && slot.recurrence_type !== 'weekly' && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {slot.recurrence_type === 'date_range' && (
                                        <>
                                          <CalendarRange className="w-3 h-3" />
                                          <span>
                                            {slot.start_date && format(parseISO(slot.start_date), 'dd/MM')} - {slot.end_date && format(parseISO(slot.end_date), 'dd/MM')}
                                          </span>
                                        </>
                                      )}
                                      {slot.recurrence_type === 'specific_dates' && (
                                        <>
                                          <Calendar className="w-3 h-3" />
                                          <span>{slot.specific_dates?.length || 0} تواريخ</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {slot.recurrence_type === 'weekly' && slot.end_date && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Repeat className="w-3 h-3" />
                                      <span>حتى {format(parseISO(slot.end_date), 'dd/MM/yyyy')}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass rounded-2xl overflow-hidden"
            >
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد حجوزات حتى الآن</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ والوقت</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>حالة الدفع</TableHead>
                      <TableHead>الرسوم</TableHead>
                      <TableHead>رابط Meet</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: ar })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.start_time} - {booking.end_time}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[booking.status]}>
                            {booking.status === 'pending' && 'قيد الانتظار'}
                            {booking.status === 'confirmed' && 'مؤكد'}
                            {booking.status === 'cancelled' && 'ملغي'}
                            {booking.status === 'completed' && 'مكتمل'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={PAYMENT_STATUS_COLORS[booking.payment_status]}>
                            {booking.payment_status === 'pending' && 'في انتظار الدفع'}
                            {booking.payment_status === 'paid' && 'مدفوع'}
                            {booking.payment_status === 'failed' && 'فشل'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.fee_amount} {booking.fee_currency}
                        </TableCell>
                        <TableCell>
                          {booking.meet_link ? (
                            <a
                              href={booking.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gold hover:underline flex items-center gap-1"
                            >
                              <Video className="w-4 h-4" />
                              فتح
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">لم يُحدد</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openBookingDetails(booking)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>تفاصيل الحجز</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">التاريخ</p>
                                      <p className="font-medium">
                                        {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: ar })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">الوقت</p>
                                      <p className="font-medium">{booking.start_time} - {booking.end_time}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">طريقة الدفع</p>
                                      <p className="font-medium">{booking.payment_method || 'غير محدد'}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">الرسوم</p>
                                      <p className="font-medium">{booking.fee_amount} {booking.fee_currency}</p>
                                    </div>
                                  </div>

                                  {booking.proof_url && (
                                    <div>
                                      <p className="text-muted-foreground text-sm mb-2">إثبات الدفع</p>
                                      <PrivateImage
                                        bucket="payment-proofs"
                                        url={booking.proof_url}
                                        alt="إثبات الدفع"
                                        className="max-w-full max-h-64 mx-auto"
                                      />
                                    </div>
                                  )}

                                  {booking.player_notes && (
                                    <div>
                                      <p className="text-muted-foreground text-sm mb-1">ملاحظات اللاعب</p>
                                      <p className="text-sm bg-secondary/50 p-2 rounded">{booking.player_notes}</p>
                                    </div>
                                  )}

                                  {!googleApiConfigured && (
                                    <div className="space-y-2">
                                      <Label>رابط Google Meet</Label>
                                      <Input
                                        value={meetLink}
                                        onChange={(e) => setMeetLink(e.target.value)}
                                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                        className="bg-secondary"
                                        dir="ltr"
                                      />
                                    </div>
                                  )}

                                  {googleApiConfigured && booking.status === 'pending' && (
                                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                                      <div className="flex items-center gap-2 text-green-600">
                                        <Video className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                          سيتم إنشاء رابط Google Meet تلقائياً عند التأكيد
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <Label>ملاحظات المدير</Label>
                                    <Textarea
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="ملاحظات خاصة..."
                                      className="bg-secondary"
                                    />
                                  </div>

                                  {booking.status === 'pending' && (
                                    <div className="flex gap-2 pt-4">
                                      <Button
                                        onClick={() => handleConfirmBooking(booking)}
                                        className="flex-1 btn-gold"
                                        disabled={creatingMeet}
                                      >
                                        {creatingMeet ? (
                                          <>
                                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                            جاري الإنشاء...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="w-4 h-4 ml-2" />
                                            {googleApiConfigured ? 'تأكيد وإنشاء Meet' : 'تأكيد الحجز'}
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleCancelBooking(booking.id)}
                                        className="flex-1"
                                        disabled={creatingMeet}
                                      >
                                        <XCircle className="w-4 h-4 ml-2" />
                                        رفض
                                      </Button>
                                    </div>
                                  )}

                                  {booking.status !== 'pending' && (
                                    <Button
                                      onClick={() => handleUpdateBooking(booking.id, {
                                        meet_link: meetLink,
                                        admin_notes: adminNotes,
                                      })}
                                      className="w-full btn-gold"
                                    >
                                      <Save className="w-4 h-4 ml-2" />
                                      حفظ التغييرات
                                    </Button>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-500 hover:text-green-600"
                                  onClick={() => {
                                    openBookingDetails(booking);
                                    handleConfirmBooking(booking);
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminConsultations;
