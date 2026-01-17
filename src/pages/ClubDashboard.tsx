import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar,
  CreditCard,
  AlertCircle,
  ArrowRight,
  LogOut,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  MessageSquare,
  Heart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import NotificationBell from "@/components/notifications/NotificationBell";
import FavoritesList from "@/components/favorites/FavoritesList";

type Club = Tables<"clubs">;
type Subscription = Tables<"subscriptions">;
type SubscriptionPlan = Tables<"subscription_plans">;

interface SubscriptionWithPlan extends Subscription {
  subscription_plans: SubscriptionPlan;
}

const ClubDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch club data
        const { data: clubData, error: clubError } = await supabase
          .from("clubs")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (clubError) throw clubError;
        setClub(clubData);

        // Fetch active subscription
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*, subscription_plans(*)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (subError && !subError.message.includes("no rows")) {
          console.error("Subscription fetch error:", subError);
        }
        setSubscription(subData as SubscriptionWithPlan | null);

        // Fetch available plans
        const { data: plansData, error: plansError } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .eq("plan_type", "club")
          .order("price", { ascending: true });

        if (plansError) throw plansError;
        setPlans(plansData || []);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("حدث خطأ في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getSubscriptionStatus = () => {
    if (!subscription) {
      return {
        label: "غير مشترك",
        icon: XCircle,
        color: "bg-muted text-muted-foreground border-border",
        bgColor: "bg-muted/50",
      };
    }

    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return {
        label: "منتهي",
        icon: XCircle,
        color: "bg-red-500/10 text-red-500 border-red-500/30",
        bgColor: "bg-red-500/5",
        daysRemaining: 0,
      };
    } else if (daysRemaining <= 7) {
      return {
        label: "ينتهي قريباً",
        icon: Clock,
        color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
        bgColor: "bg-yellow-500/5",
        daysRemaining,
      };
    } else {
      return {
        label: "نشط",
        icon: CheckCircle,
        color: "bg-green-500/10 text-green-500 border-green-500/30",
        bgColor: "bg-green-500/5",
        daysRemaining,
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

  if (!club) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">لا يوجد نادي مسجل</h2>
            <p className="text-muted-foreground mb-6">
              لم تقم بتسجيل ناديك بعد. سجّل الآن للوصول إلى أفضل المواهب.
            </p>
            <Button 
              className="btn-gold w-full" 
              onClick={() => navigate("/club-registration")}
            >
              سجّل ناديك الآن
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getSubscriptionStatus();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gradient-gold">لوحة تحكم النادي</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button variant="outline" onClick={() => navigate("/messages")}>
              <MessageSquare className="w-4 h-4 ml-2" />
              الرسائل
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              الرئيسية
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Subscription Status Card */}
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
                    <p className="text-sm text-muted-foreground">حالة الاشتراك</p>
                    <Badge className={statusConfig.color} variant="outline">
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                {subscription && (
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">ينتهي في</p>
                    <p className="font-medium">
                      {new Date(subscription.end_date).toLocaleDateString("ar-SA")}
                    </p>
                    {statusConfig.daysRemaining !== undefined && statusConfig.daysRemaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ({statusConfig.daysRemaining} يوم متبقي)
                      </p>
                    )}
                  </div>
                )}
              </div>
              {subscription && subscription.subscription_plans && (
                <div className="mt-4 p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-gold" />
                    <span className="font-semibold">{subscription.subscription_plans.name_ar}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.subscription_plans.description_ar}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Club Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  {club.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gold/30"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Building2 className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold mt-4">{club.name}</h2>
                  {club.city && club.country && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {club.city}، {club.country}
                    </p>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gold" />
                    <span className="text-muted-foreground">{club.email}</span>
                  </div>
                  {club.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gold" />
                      <span className="text-muted-foreground">{club.phone}</span>
                    </div>
                  )}
                  {club.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="w-4 h-4 text-gold" />
                      <a 
                        href={club.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                      >
                        {club.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gold" />
                    <span className="text-muted-foreground">
                      انضم في {new Date(club.created_at).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                </div>

                {club.description && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-sm text-muted-foreground">{club.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Plans & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Favorites List */}
            <FavoritesList />
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" />
                  الوصول للاعبين
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-medium mb-2">لديك صلاحية الوصول للاعبين</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      يمكنك تصفح جميع اللاعبين المعتمدين والتواصل معهم
                    </p>
                    <Button className="btn-gold" onClick={() => navigate("/browse-players")}>
                      <Users className="w-4 h-4 ml-2" />
                      تصفح اللاعبين
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium mb-2">تحتاج اشتراك للوصول للاعبين</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      اشترك في إحدى الخطط للوصول لملفات اللاعبين والتواصل معهم
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gold" />
                  خطط الاشتراك
                </CardTitle>
                <CardDescription>
                  اختر الخطة المناسبة لاحتياجات ناديك
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plans.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          subscription?.plan_id === plan.id
                            ? "border-gold bg-gold/5"
                            : "border-border hover:border-gold/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold">{plan.name_ar}</h3>
                          {subscription?.plan_id === plan.id && (
                            <Badge className="bg-gold text-gold-foreground">الخطة الحالية</Badge>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-gold mb-2">
                          {plan.price} {plan.currency}
                          <span className="text-sm font-normal text-muted-foreground">
                            / {plan.duration_days} يوم
                          </span>
                        </p>
                        {plan.description_ar && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {plan.description_ar}
                          </p>
                        )}
                        {subscription?.plan_id !== plan.id && (
                          <Button 
                            className="w-full" 
                            variant={subscription ? "outline" : "default"}
                            onClick={() => navigate("/subscription")}
                          >
                            {subscription ? "ترقية" : "اشترك الآن"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      لا توجد خطط متاحة حالياً
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ClubDashboard;
