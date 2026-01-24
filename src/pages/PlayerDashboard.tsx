import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Ruler, 
  Weight, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Video,
  ArrowRight,
  LogOut,
  Edit,
  Settings,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import NotificationBell from "@/components/notifications/NotificationBell";
import EditPlayerForm from "@/components/player/EditPlayerForm";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

type Player = Tables<"players"> & {
  email?: string;
  phone?: string;
  date_of_birth?: string;
  id_document_url?: string;
  rejection_reason?: string;
};

interface ConsultationBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  meet_link: string | null;
}

const PlayerDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [upcomingConsultations, setUpcomingConsultations] = useState<ConsultationBooking[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchPlayerData = async () => {
    if (!user) return;
    
    try {
      // Fetch player public data
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (playerError) throw playerError;

      if (playerData) {
        // Fetch player private data (PII)
        const { data: privateData, error: privateError } = await supabase
          .from("player_private")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (privateError) throw privateError;

        // Merge both datasets
        setPlayer({
          ...playerData,
          email: privateData?.email,
          phone: privateData?.phone,
          date_of_birth: privateData?.date_of_birth,
          id_document_url: privateData?.id_document_url,
          rejection_reason: privateData?.rejection_reason,
        });
      } else {
        setPlayer(null);
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
      toast.error("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingConsultations = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('consultation_bookings')
        .select('id, booking_date, start_time, end_time, status, meet_link')
        .eq('player_user_id', user.id)
        .gte('booking_date', today)
        .neq('status', 'cancelled')
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(3);

      if (error) throw error;
      setUpcomingConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPlayerData();
      fetchUpcomingConsultations();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          label: "تمت الموافقة",
          icon: CheckCircle,
          color: "bg-green-500/10 text-green-500 border-green-500/30",
          bgColor: "bg-green-500/5",
        };
      case "rejected":
        return {
          label: "مرفوض",
          icon: XCircle,
          color: "bg-red-500/10 text-red-500 border-red-500/30",
          bgColor: "bg-red-500/5",
        };
      default:
        return {
          label: "قيد المراجعة",
          icon: Clock,
          color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
          bgColor: "bg-yellow-500/5",
        };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">لا يوجد ملف لاعب</h2>
            <p className="text-muted-foreground mb-6">
              لم تقم بالتسجيل كلاعب بعد. سجّل الآن للانضمام إلى وكالتنا.
            </p>
            <Button 
              className="btn-gold w-full" 
              onClick={() => navigate("/player-registration")}
            >
              سجّل كلاعب الآن
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(player.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-bold text-gradient-gold">لوحة تحكم اللاعب</h1>
            <div className="flex items-center gap-2 md:gap-4">
              <NotificationBell />
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/my-consultations")}>
                <Video className="w-4 h-4 ml-2" />
                استشاراتي
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => navigate("/my-consultations")}>
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/account-settings")}>
                <Settings className="w-4 h-4 ml-2" />
                الإعدادات
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => navigate("/account-settings")}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => navigate("/")}>
                الرئيسية
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 ml-2" />
                <span className="hidden md:inline">تسجيل خروج</span>
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className={`${statusConfig.bgColor} border-2 ${statusConfig.color.split(' ')[2]}`}>
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${statusConfig.color.split(' ')[0]}`}>
                    <StatusIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">حالة الطلب</p>
                    <Badge className={statusConfig.color} variant="outline">
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                  <p className="font-medium">
                    {new Date(player.created_at).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>
              {player.status === "rejected" && player.rejection_reason && (
                <div className="mt-4 p-4 bg-red-500/10 rounded-lg">
                  <p className="text-sm font-medium text-red-500 mb-1">سبب الرفض:</p>
                  <p className="text-sm text-muted-foreground">{player.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Image & Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  {player.profile_image_url ? (
                    <img
                      src={player.profile_image_url}
                      alt={player.full_name}
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gold/30"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <User className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold mt-4">{player.full_name}</h2>
                  {player.position && (
                    <Badge variant="secondary" className="mt-2">
                      {player.position}
                    </Badge>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gold" />
                    <span className="text-muted-foreground">{player.email}</span>
                  </div>
                  {player.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gold" />
                      <span className="text-muted-foreground">{player.phone}</span>
                    </div>
                  )}
                  {player.nationality && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gold" />
                      <span className="text-muted-foreground">{player.nationality}</span>
                    </div>
                  )}
                  {player.date_of_birth && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gold" />
                      <span className="text-muted-foreground">
                        {new Date(player.date_of_birth).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setEditFormOpen(true)}
                >
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل البيانات
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Physical & Career Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Physical Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-gold" />
                  المواصفات الجسدية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <Ruler className="w-8 h-8 text-gold" />
                    <div>
                      <p className="text-sm text-muted-foreground">الطول</p>
                      <p className="text-2xl font-bold">
                        {player.height_cm ? `${player.height_cm} سم` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <Weight className="w-8 h-8 text-gold" />
                    <div>
                      <p className="text-sm text-muted-foreground">الوزن</p>
                      <p className="text-2xl font-bold">
                        {player.weight_kg ? `${player.weight_kg} كجم` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Career Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" />
                  المسيرة الكروية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {player.current_club && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">النادي الحالي</p>
                    <p className="font-medium">{player.current_club}</p>
                  </div>
                )}
                {player.previous_clubs && player.previous_clubs.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">الأندية السابقة</p>
                    <div className="flex flex-wrap gap-2">
                      {player.previous_clubs.map((club, index) => (
                        <Badge key={index} variant="outline">
                          {club}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {player.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">نبذة شخصية</p>
                    <p className="text-sm">{player.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents & Media */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" />
                  المستندات والوسائط
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <FileText className="w-6 h-6 text-gold" />
                    <div>
                      <p className="font-medium">وثيقة الهوية</p>
                      <p className="text-sm text-muted-foreground">
                        {player.id_document_url ? "تم الرفع ✓" : "لم يتم الرفع"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Video className="w-6 h-6 text-gold" />
                    <div>
                      <p className="font-medium">فيديوهات المهارات</p>
                      <p className="text-sm text-muted-foreground">
                        {player.video_urls?.length || 0} فيديو
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultations Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-gold" />
                  استشاراتي
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/my-consultations")}
                  >
                    عرض الكل
                  </Button>
                  <Button
                    size="sm"
                    className="btn-gold"
                    onClick={() => navigate("/consultation-booking")}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    طلب استشارة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingConsultations.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">لا توجد استشارات قادمة</p>
                    <Button
                      className="btn-gold"
                      onClick={() => navigate("/consultation-booking")}
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      احجز استشارة الآن
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingConsultations.map((booking) => {
                      const formatTime = (time: string) => {
                        const [hours, minutes] = time.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'م' : 'ص';
                        const hour12 = hour % 12 || 12;
                        return `${hour12}:${minutes} ${ampm}`;
                      };

                      return (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-yellow-500/20 text-yellow-500'
                            }`}>
                              {booking.status === 'confirmed' ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Clock className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {format(new Date(booking.booking_date), 'EEEE, d MMMM', { locale: ar })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={
                              booking.status === 'confirmed' 
                                ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                            }>
                              {booking.status === 'confirmed' ? 'مؤكد' : 'قيد المراجعة'}
                            </Badge>
                            {booking.status === 'confirmed' && booking.meet_link && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(booking.meet_link!, '_blank')}
                              >
                                انضم
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Edit Player Form */}
      {player && (
        <EditPlayerForm
          player={player}
          isOpen={editFormOpen}
          onClose={() => setEditFormOpen(false)}
          onUpdate={fetchPlayerData}
        />
      )}
    </div>
  );
};

export default PlayerDashboard;
