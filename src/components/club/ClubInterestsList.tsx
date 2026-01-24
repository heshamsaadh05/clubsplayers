import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Heart, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User,
  Calendar,
  ExternalLink,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PlayerInterest {
  id: string;
  player_id: string;
  interest_type: string;
  message: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  player?: {
    full_name: string;
    position: string | null;
    nationality: string | null;
    profile_image_url: string | null;
  };
}

const ClubInterestsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<PlayerInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const handleWithdraw = async (interestId: string) => {
    setWithdrawingId(interestId);
    try {
      const { error } = await supabase
        .from("player_interests")
        .delete()
        .eq("id", interestId)
        .eq("status", "pending");

      if (error) throw error;

      setInterests(prev => prev.filter(i => i.id !== interestId));
      toast.success("تم سحب الطلب بنجاح");
    } catch (error) {
      console.error("Error withdrawing interest:", error);
      toast.error("حدث خطأ أثناء سحب الطلب");
    } finally {
      setWithdrawingId(null);
    }
  };

  useEffect(() => {
    const fetchInterests = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("player_interests")
          .select(`
            id,
            player_id,
            interest_type,
            message,
            status,
            admin_notes,
            created_at,
            reviewed_at
          `)
          .eq("club_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        // Fetch player info for each interest
        if (data && data.length > 0) {
          const playerIds = [...new Set(data.map(i => i.player_id))];
          const { data: players } = await supabase
            .from("players")
            .select("id, full_name, position, nationality, profile_image_url")
            .in("id", playerIds);

          const playerMap = new Map(players?.map(p => [p.id, p]) || []);
          
          const enrichedInterests = data.map(interest => ({
            ...interest,
            player: playerMap.get(interest.player_id)
          }));

          setInterests(enrichedInterests);
        } else {
          setInterests([]);
        }
      } catch (error) {
        console.error("Error fetching interests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [user]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "قيد المراجعة",
          icon: Clock,
          color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
        };
      case "approved":
        return {
          label: "تمت الموافقة",
          icon: CheckCircle,
          color: "bg-green-500/10 text-green-600 border-green-500/30"
        };
      case "rejected":
        return {
          label: "مرفوض",
          icon: XCircle,
          color: "bg-red-500/10 text-red-600 border-red-500/30"
        };
      default:
        return {
          label: status,
          icon: Clock,
          color: "bg-muted text-muted-foreground border-border"
        };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "offer":
        return {
          label: "عرض رسمي",
          icon: FileText,
          color: "bg-gold/10 text-gold border-gold/30"
        };
      case "interested":
      default:
        return {
          label: "مهتم",
          icon: Heart,
          color: "bg-primary/10 text-primary border-primary/30"
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-gold" />
            اهتماماتي باللاعبين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-gold" />
          اهتماماتي باللاعبين
        </CardTitle>
        <CardDescription>
          الطلبات التي أرسلتها للإدارة بشأن اللاعبين
        </CardDescription>
      </CardHeader>
      <CardContent>
        {interests.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              لم ترسل أي طلبات اهتمام بعد
            </p>
            <Button onClick={() => navigate("/browse-players")} variant="outline">
              <User className="w-4 h-4 ml-2" />
              تصفح اللاعبين
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {interests.map((interest, index) => {
              const statusConfig = getStatusConfig(interest.status);
              const typeConfig = getTypeConfig(interest.interest_type);
              const StatusIcon = statusConfig.icon;
              const TypeIcon = typeConfig.icon;

              return (
                <motion.div
                  key={interest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:border-gold/30 transition-colors"
                >
                  {/* Player Image */}
                  <div className="flex-shrink-0">
                    {interest.player?.profile_image_url ? (
                      <img
                        src={interest.player.profile_image_url}
                        alt={interest.player.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold truncate">
                        {interest.player?.full_name || "لاعب"}
                      </h4>
                      <Badge variant="outline" className={typeConfig.color}>
                        <TypeIcon className="w-3 h-3 ml-1" />
                        {typeConfig.label}
                      </Badge>
                    </div>
                    
                    {interest.player?.position && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {interest.player.position}
                        {interest.player.nationality && ` • ${interest.player.nationality}`}
                      </p>
                    )}

                    {interest.message && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {interest.message}
                      </p>
                    )}

                    {interest.admin_notes && interest.status !== "pending" && (
                      <div className="mt-2 p-2 rounded bg-muted/50 text-sm">
                        <span className="font-medium">رد الإدارة: </span>
                        {interest.admin_notes}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(interest.created_at).toLocaleDateString("ar-SA")}
                      </span>
                      {interest.reviewed_at && (
                        <span>
                          تمت المراجعة: {new Date(interest.reviewed_at).toLocaleDateString("ar-SA")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig.label}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {interest.status === "pending" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={withdrawingId === interest.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>سحب الطلب</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من سحب طلب الاهتمام بـ {interest.player?.full_name || "هذا اللاعب"}؟
                                لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleWithdraw(interest.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                سحب الطلب
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/player/${interest.player_id}`)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubInterestsList;
