import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  User,
  MapPin,
  Ruler,
  Weight,
  Calendar,
  Trophy,
  X,
  ChevronDown,
  Lock,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Player = Tables<"players">;

const positions = [
  "حارس مرمى",
  "مدافع",
  "مدافع أيمن",
  "مدافع أيسر",
  "وسط دفاعي",
  "وسط",
  "وسط مهاجم",
  "جناح أيمن",
  "جناح أيسر",
  "مهاجم",
];

const nationalities = [
  "السعودية",
  "الإمارات",
  "قطر",
  "الكويت",
  "البحرين",
  "عمان",
  "مصر",
  "الأردن",
  "لبنان",
  "سوريا",
  "العراق",
  "المغرب",
  "الجزائر",
  "تونس",
];

const BrowsePlayers = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isClub, setIsClub] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [selectedNationality, setSelectedNationality] = useState<string>("all");
  const [ageRange, setAgeRange] = useState<[number, number]>([16, 40]);
  const [heightRange, setHeightRange] = useState<[number, number]>([150, 210]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkAccessAndFetchPlayers = async () => {
      if (!user) return;

      try {
        // Check if user is a club
        const { data: clubData } = await supabase
          .from("clubs")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        setIsClub(!!clubData);

        // Check for active subscription
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("end_date", new Date().toISOString())
          .maybeSingle();

        setHasSubscription(!!subData);

        // Fetch approved players
        const { data: playersData, error } = await supabase
          .from("players")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPlayers(playersData || []);
        setFilteredPlayers(playersData || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("حدث خطأ في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAccessAndFetchPlayers();
    }
  }, [user]);

  // Apply filters
  useEffect(() => {
    let result = [...players];

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (player) =>
          player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.current_club?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Position filter
    if (selectedPosition && selectedPosition !== "all") {
      result = result.filter((player) => player.position === selectedPosition);
    }

    // Nationality filter
    if (selectedNationality && selectedNationality !== "all") {
      result = result.filter((player) => player.nationality === selectedNationality);
    }

    // Age filter
    result = result.filter((player) => {
      if (!player.date_of_birth) return true;
      const age = calculateAge(player.date_of_birth);
      return age >= ageRange[0] && age <= ageRange[1];
    });

    // Height filter
    result = result.filter((player) => {
      if (!player.height_cm) return true;
      return player.height_cm >= heightRange[0] && player.height_cm <= heightRange[1];
    });

    setFilteredPlayers(result);
  }, [searchQuery, selectedPosition, selectedNationality, ageRange, heightRange, players]);

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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedPosition("all");
    setSelectedNationality("all");
    setAgeRange([16, 40]);
    setHeightRange([150, 210]);
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

  // Access denied for non-clubs or non-subscribers
  if (!isClub || !hasSubscription) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gradient-gold">تصفح اللاعبين</h1>
            <div className="flex items-center gap-4">
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
                  : "تحتاج لاشتراك نشط للوصول لملفات اللاعبين"}
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gradient-gold">تصفح اللاعبين</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/club-dashboard")}>
              لوحة التحكم
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم اللاعب أو النادي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-card"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-3">
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger className="w-[160px] bg-card">
                  <SelectValue placeholder="المركز" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المراكز</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                <SelectTrigger className="w-[160px] bg-card">
                  <SelectValue placeholder="الجنسية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الجنسيات</SelectItem>
                  {nationalities.map((nat) => (
                    <SelectItem key={nat} value={nat}>
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Advanced Filters */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    فلاتر متقدمة
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px]">
                  <SheetHeader>
                    <SheetTitle>فلاتر متقدمة</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    {/* Age Range */}
                    <div className="space-y-3">
                      <Label>العمر: {ageRange[0]} - {ageRange[1]} سنة</Label>
                      <Slider
                        value={ageRange}
                        onValueChange={(value) => setAgeRange(value as [number, number])}
                        min={16}
                        max={40}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    {/* Height Range */}
                    <div className="space-y-3">
                      <Label>الطول: {heightRange[0]} - {heightRange[1]} سم</Label>
                      <Slider
                        value={heightRange}
                        onValueChange={(value) => setHeightRange(value as [number, number])}
                        min={150}
                        max={210}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={clearFilters}
                      >
                        <X className="w-4 h-4 ml-2" />
                        مسح الفلاتر
                      </Button>
                      <Button
                        className="w-full btn-gold"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        تطبيق
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedPosition !== "all" || selectedNationality !== "all" || searchQuery) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  بحث: {searchQuery}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
              {selectedPosition !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  المركز: {selectedPosition}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedPosition("all")}
                  />
                </Badge>
              )}
              {selectedNationality !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  الجنسية: {selectedNationality}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedNationality("all")}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-destructive hover:text-destructive"
              >
                مسح الكل
              </Button>
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            عرض <span className="text-foreground font-bold">{filteredPlayers.length}</span> لاعب
          </p>
        </div>

        {/* Players Grid */}
        <AnimatePresence mode="popLayout">
          {filteredPlayers.length > 0 ? (
            <motion.div
              layout
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:border-gold/50 transition-all group cursor-pointer">
                    {/* Player Image */}
                    <div className="relative aspect-[3/4] bg-muted">
                      {player.profile_image_url ? (
                        <img
                          src={player.profile_image_url}
                          alt={player.full_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-20 h-20 text-muted-foreground" />
                        </div>
                      )}
                      {player.position && (
                        <Badge className="absolute top-3 right-3 bg-gold text-gold-foreground">
                          {player.position}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 truncate">{player.full_name}</h3>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {player.nationality && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gold" />
                            <span>{player.nationality}</span>
                          </div>
                        )}
                        {player.date_of_birth && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gold" />
                            <span>{calculateAge(player.date_of_birth)} سنة</span>
                          </div>
                        )}
                        {player.current_club && (
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-gold" />
                            <span className="truncate">{player.current_club}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                        {player.height_cm && (
                          <div className="flex items-center gap-1 text-sm">
                            <Ruler className="w-4 h-4 text-gold" />
                            <span>{player.height_cm} سم</span>
                          </div>
                        )}
                        {player.weight_kg && (
                          <div className="flex items-center gap-1 text-sm">
                            <Weight className="w-4 h-4 text-gold" />
                            <span>{player.weight_kg} كجم</span>
                          </div>
                        )}
                      </div>

                      <Button className="w-full mt-4 btn-gold" size="sm">
                        عرض الملف الكامل
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground mb-4">
                لم يتم العثور على لاعبين يطابقون معايير البحث
              </p>
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default BrowsePlayers;
