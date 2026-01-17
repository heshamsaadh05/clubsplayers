import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  ArrowRight,
  LogOut,
  Lock,
  Play,
  FileText,
  MessageCircle,
  Share2,
  Heart,
  ChevronLeft,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import MessageComposer from "@/components/messages/MessageComposer";
import { useFavorites } from "@/hooks/useFavorites";
import PlayerRating from "@/components/player/PlayerRating";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

type Player = Tables<"players">;

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { 
    recordPlayerView, 
    getRemainingViews, 
    limits,
    hasActiveSubscription: subLimitsActive 
  } = useSubscriptionLimits();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isClub, setIsClub] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchPlayerAndCheckAccess = async () => {
      if (!user || !id) return;

      try {
        // Check if user is a club with active subscription
        const { data: clubData } = await supabase
          .from("clubs")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        setIsClub(!!clubData);

        const { data: subData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("end_date", new Date().toISOString())
          .maybeSingle();

        setHasAccess(!!subData);

        // Fetch player data
        const { data: playerData, error } = await supabase
          .from("players")
          .select("*")
          .eq("id", id)
          .eq("status", "approved")
          .maybeSingle();

        if (error) throw error;
        setPlayer(playerData);

        // Record view if has access and is club
        if (clubData && subData && playerData && !viewRecorded) {
          const recorded = await recordPlayerView(id);
          if (recorded) {
            setViewRecorded(true);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("حدث خطأ في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPlayerAndCheckAccess();
    }
  }, [user, id, viewRecorded, recordPlayerView]);

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ملف اللاعب - ${player?.full_name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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

  if (!isClub || !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4 ml-2" />
              رجوع
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل خروج
            </Button>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-10 h-10 text-gold" />
              </div>
              <h2 className="text-2xl font-bold mb-2">الوصول مقيد</h2>
              <p className="text-muted-foreground mb-6">
                {!isClub
                  ? "هذه الصفحة متاحة للأندية المسجلة فقط"
                  : "تحتاج لاشتراك نشط لعرض ملفات اللاعبين"}
              </p>
              <Button
                className="btn-gold w-full"
                onClick={() => navigate(isClub ? "/club-dashboard" : "/club-registration")}
              >
                {isClub ? "إدارة الاشتراك" : "سجّل ناديك"}
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4 ml-2" />
              رجوع
            </Button>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-6">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">اللاعب غير موجود</h2>
              <p className="text-muted-foreground mb-6">
                لم يتم العثور على هذا اللاعب أو أنه غير معتمد بعد
              </p>
              <Button onClick={() => navigate("/browse-players")}>
                تصفح اللاعبين
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/browse-players")}>
            <ChevronLeft className="w-4 h-4 ml-2" />
            رجوع للاعبين
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => id && toggleFavorite(id)}
            >
              <Heart
                className={`w-4 h-4 ${isFavorite(id || '') ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Image & Quick Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Profile Card */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[3/4] bg-muted">
                {player.profile_image_url ? (
                  <img
                    src={player.profile_image_url}
                    alt={player.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-32 h-32 text-muted-foreground" />
                  </div>
                )}
                {player.position && (
                  <Badge className="absolute top-4 right-4 bg-gold text-gold-foreground text-lg px-4 py-1">
                    {player.position}
                  </Badge>
                )}
              </div>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2">{player.full_name}</h1>
                {player.current_club && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gold" />
                    {player.current_club}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Physical Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">المواصفات الجسدية</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Ruler className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {player.height_cm || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">سم</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Weight className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {player.weight_kg || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">كجم</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Calendar className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {player.date_of_birth ? calculateAge(player.date_of_birth) : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">سنة</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <MapPin className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-lg font-bold truncate">
                    {player.nationality || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">الجنسية</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Bio */}
            {player.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gold" />
                    نبذة عن اللاعب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {player.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Career History */}
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
                    <p className="font-medium text-lg">{player.current_club}</p>
                  </div>
                )}
                {player.previous_clubs && player.previous_clubs.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">الأندية السابقة</p>
                    <div className="flex flex-wrap gap-2">
                      {player.previous_clubs.map((club, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {club}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {!player.current_club && (!player.previous_clubs || player.previous_clubs.length === 0) && (
                  <p className="text-muted-foreground">لا توجد معلومات عن المسيرة الكروية</p>
                )}
              </CardContent>
            </Card>

            {/* Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-gold" />
                  فيديوهات المهارات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {player.video_urls && player.video_urls.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {player.video_urls.map((videoUrl, index) => (
                      <Dialog key={index}>
                        <DialogTrigger asChild>
                          <div
                            className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => setSelectedVideo(videoUrl)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors">
                              <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 text-gold-foreground fill-current mr-[-2px]" />
                              </div>
                            </div>
                            <p className="absolute bottom-2 right-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                              فيديو {index + 1}
                            </p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0">
                          <DialogHeader className="p-4">
                            <DialogTitle>فيديو {index + 1}</DialogTitle>
                          </DialogHeader>
                          <div className="aspect-video">
                            <video
                              src={videoUrl}
                              controls
                              autoPlay
                              className="w-full h-full"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">لا توجد فيديوهات متاحة</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card className="border-gold/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-gold" />
                  تواصل مع اللاعب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {player.email && (
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Mail className="w-5 h-5 text-gold" />
                      <div>
                        <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                        <p className="font-medium">{player.email}</p>
                      </div>
                    </div>
                  )}
                  {player.phone && (
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Phone className="w-5 h-5 text-gold" />
                      <div>
                        <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                        <p className="font-medium" dir="ltr">{player.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="font-medium mb-3">إرسال رسالة مباشرة</p>
                  <Button
                    className="w-full btn-gold"
                    onClick={() => setMessageOpen(true)}
                  >
                    <MessageCircle className="w-4 h-4 ml-2" />
                    إرسال رسالة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Player Ratings */}
            <PlayerRating
              playerId={id || ''}
              isClub={isClub}
              hasAccess={hasAccess}
            />
          </motion.div>
        </div>
      </main>

      {/* Message Composer Dialog */}
      <MessageComposer
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        recipientId={player.user_id}
        recipientName={player.full_name}
      />
    </div>
  );
};

export default PlayerProfile;
