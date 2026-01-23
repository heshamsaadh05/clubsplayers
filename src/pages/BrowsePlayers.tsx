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
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Heart,
  MessageSquare,
  Eye,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";
import { logError } from "@/lib/errorLogger";

// Public player type - now includes date_of_birth for age, excludes contact info and club history
type PublicPlayer = {
  id: string;
  user_id: string;
  full_name: string;
  position: string | null;
  nationality: string | null;
  bio: string | null;
  profile_image_url: string | null;
  video_urls: string[] | null;
  height_cm: number | null;
  weight_kg: number | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  date_of_birth: string | null;
};

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

type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'height_asc' | 'height_desc' | 'age_asc' | 'age_desc';
type ViewMode = 'grid' | 'list';

const BrowsePlayers = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  
  const [players, setPlayers] = useState<PublicPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<PublicPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isClub, setIsClub] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([16, 40]);
  const [heightRange, setHeightRange] = useState<[number, number]>([150, 210]);
  const [weightRange, setWeightRange] = useState<[number, number]>([50, 120]);
  const [showOnlyWithVideos, setShowOnlyWithVideos] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Sort and View states
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

        // Fetch approved players from public view (excludes PII like email, phone, DOB)
        const { data: playersData, error } = await supabase
          .from("players_public")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPlayers(playersData || []);
        setFilteredPlayers(playersData || []);
      } catch (error) {
        logError(error, 'BrowsePlayers:fetchPlayers');
        toast.error("حدث خطأ في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAccessAndFetchPlayers();
    }
  }, [user]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...players];

    // Search filter - search by name and position only (no club info)
    if (searchQuery) {
      result = result.filter(
        (player) =>
          player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.position?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Position filter (multi-select)
    if (selectedPositions.length > 0) {
      result = result.filter((player) => 
        player.position && selectedPositions.includes(player.position)
      );
    }

    // Nationality filter (multi-select)
    if (selectedNationalities.length > 0) {
      result = result.filter((player) => 
        player.nationality && selectedNationalities.includes(player.nationality)
      );
    }

    // Note: Age filter removed - date_of_birth is private PII and not available in public view

    // Height filter
    result = result.filter((player) => {
      if (!player.height_cm) return true;
      return player.height_cm >= heightRange[0] && player.height_cm <= heightRange[1];
    });

    // Weight filter
    result = result.filter((player) => {
      if (!player.weight_kg) return true;
      return player.weight_kg >= weightRange[0] && player.weight_kg <= weightRange[1];
    });

    // Videos filter
    if (showOnlyWithVideos) {
      result = result.filter((player) => 
        player.video_urls && player.video_urls.length > 0
      );
    }

    // Favorites filter
    if (showOnlyFavorites) {
      result = result.filter((player) => isFavorite(player.id));
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return a.full_name.localeCompare(b.full_name, 'ar');
        case 'name_desc':
          return b.full_name.localeCompare(a.full_name, 'ar');
        case 'height_asc':
          return (a.height_cm || 0) - (b.height_cm || 0);
        case 'height_desc':
          return (b.height_cm || 0) - (a.height_cm || 0);
        // Note: Age sorting removed - date_of_birth is private PII
        case 'age_asc':
        case 'age_desc':
          return 0;
        default:
          return 0;
      }
    });

    setFilteredPlayers(result);
  }, [searchQuery, selectedPositions, selectedNationalities, ageRange, heightRange, weightRange, showOnlyWithVideos, showOnlyFavorites, sortBy, players, favorites]);

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
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
    setSelectedPositions([]);
    setSelectedNationalities([]);
    setAgeRange([16, 40]);
    setHeightRange([150, 210]);
    setWeightRange([50, 120]);
    setShowOnlyWithVideos(false);
    setShowOnlyFavorites(false);
  };

  const togglePosition = (position: string) => {
    setSelectedPositions(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const toggleNationality = (nationality: string) => {
    setSelectedNationalities(prev => 
      prev.includes(nationality) 
        ? prev.filter(n => n !== nationality)
        : [...prev, nationality]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const activeFiltersCount = [
    selectedPositions.length > 0,
    selectedNationalities.length > 0,
    ageRange[0] !== 16 || ageRange[1] !== 40,
    heightRange[0] !== 150 || heightRange[1] !== 210,
    weightRange[0] !== 50 || weightRange[1] !== 120,
    showOnlyWithVideos,
    showOnlyFavorites,
  ].filter(Boolean).length;

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
          <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-bold text-gradient-gold">تصفح اللاعبين</h1>
            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/")}>
                الرئيسية
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 md:ml-2" />
                <span className="hidden md:inline">تسجيل خروج</span>
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
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold text-gradient-gold">تصفح اللاعبين</h1>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/club-dashboard")}>
              لوحة التحكم
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 md:ml-2" />
              <span className="hidden md:inline">تسجيل خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          {/* Search Row */}
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم اللاعب، النادي، أو المركز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-card"
              />
            </div>

            {/* Quick Filters - Desktop */}
            <div className="hidden md:flex gap-3">
              <Select value={selectedPositions[0] || "all"} onValueChange={(val) => {
                if (val === "all") setSelectedPositions([]);
                else setSelectedPositions([val]);
              }}>
                <SelectTrigger className="w-[160px] bg-card">
                  <SelectValue placeholder="المركز" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">جميع المراكز</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedNationalities[0] || "all"} onValueChange={(val) => {
                if (val === "all") setSelectedNationalities([]);
                else setSelectedNationalities([val]);
              }}>
                <SelectTrigger className="w-[160px] bg-card">
                  <SelectValue placeholder="الجنسية" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">جميع الجنسيات</SelectItem>
                  {nationalities.map((nat) => (
                    <SelectItem key={nat} value={nat}>
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter & View Controls */}
            <div className="flex gap-2">
              {/* Advanced Filters */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1 md:flex-none">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">فلاتر</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="bg-gold text-primary-foreground h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:w-[380px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>فلاتر البحث المتقدمة</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    {/* Positions Multi-Select */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">المراكز</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {positions.map((pos) => (
                          <div
                            key={pos}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                              selectedPositions.includes(pos)
                                ? 'bg-gold/10 border-gold'
                                : 'border-border hover:border-gold/50'
                            }`}
                            onClick={() => togglePosition(pos)}
                          >
                            <Checkbox 
                              checked={selectedPositions.includes(pos)}
                              className="pointer-events-none"
                            />
                            <span className="text-sm">{pos}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nationalities Multi-Select */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">الجنسيات</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {nationalities.map((nat) => (
                          <div
                            key={nat}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                              selectedNationalities.includes(nat)
                                ? 'bg-gold/10 border-gold'
                                : 'border-border hover:border-gold/50'
                            }`}
                            onClick={() => toggleNationality(nat)}
                          >
                            <Checkbox 
                              checked={selectedNationalities.includes(nat)}
                              className="pointer-events-none"
                            />
                            <span className="text-sm">{nat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Age Range */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">
                        العمر: {ageRange[0]} - {ageRange[1]} سنة
                      </Label>
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
                      <Label className="text-base font-semibold">
                        الطول: {heightRange[0]} - {heightRange[1]} سم
                      </Label>
                      <Slider
                        value={heightRange}
                        onValueChange={(value) => setHeightRange(value as [number, number])}
                        min={150}
                        max={210}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    {/* Weight Range */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">
                        الوزن: {weightRange[0]} - {weightRange[1]} كجم
                      </Label>
                      <Slider
                        value={weightRange}
                        onValueChange={(value) => setWeightRange(value as [number, number])}
                        min={50}
                        max={120}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    {/* Additional Filters */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">خيارات إضافية</Label>
                      <div className="space-y-2">
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            showOnlyWithVideos
                              ? 'bg-gold/10 border-gold'
                              : 'border-border hover:border-gold/50'
                          }`}
                          onClick={() => setShowOnlyWithVideos(!showOnlyWithVideos)}
                        >
                          <Checkbox checked={showOnlyWithVideos} className="pointer-events-none" />
                          <span>لاعبون لديهم فيديوهات فقط</span>
                        </div>
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            showOnlyFavorites
                              ? 'bg-gold/10 border-gold'
                              : 'border-border hover:border-gold/50'
                          }`}
                          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                        >
                          <Checkbox checked={showOnlyFavorites} className="pointer-events-none" />
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>المفضلون فقط</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-3 border-t border-border">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={clearFilters}
                      >
                        <X className="w-4 h-4 ml-2" />
                        مسح جميع الفلاتر
                      </Button>
                      <Button
                        className="w-full btn-gold"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        عرض {filteredPlayers.length} نتيجة
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort Select */}
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <SelectTrigger className="w-[140px] sm:w-[160px] bg-card">
                  <SortAsc className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="ترتيب" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="oldest">الأقدم</SelectItem>
                  <SelectItem value="name_asc">الاسم أ-ي</SelectItem>
                  <SelectItem value="name_desc">الاسم ي-أ</SelectItem>
                  <SelectItem value="age_asc">العمر تصاعدي</SelectItem>
                  <SelectItem value="age_desc">العمر تنازلي</SelectItem>
                  <SelectItem value="height_asc">الطول تصاعدي</SelectItem>
                  <SelectItem value="height_desc">الطول تنازلي</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle - Desktop only */}
              <div className="hidden lg:flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className={viewMode === 'grid' ? 'bg-gold hover:bg-gold/90' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className={viewMode === 'list' ? 'bg-gold hover:bg-gold/90' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Tags */}
          {(selectedPositions.length > 0 || selectedNationalities.length > 0 || searchQuery || showOnlyWithVideos || showOnlyFavorites) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 py-1">
                  بحث: {searchQuery}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {selectedPositions.map(pos => (
                <Badge key={pos} variant="secondary" className="gap-1 py-1">
                  {pos}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => togglePosition(pos)} />
                </Badge>
              ))}
              {selectedNationalities.map(nat => (
                <Badge key={nat} variant="secondary" className="gap-1 py-1">
                  {nat}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleNationality(nat)} />
                </Badge>
              ))}
              {showOnlyWithVideos && (
                <Badge variant="secondary" className="gap-1 py-1">
                  لديهم فيديوهات
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setShowOnlyWithVideos(false)} />
                </Badge>
              )}
              {showOnlyFavorites && (
                <Badge variant="secondary" className="gap-1 py-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  المفضلون
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setShowOnlyFavorites(false)} />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-destructive hover:text-destructive h-7"
              >
                مسح الكل
              </Button>
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        <div className="mb-4 md:mb-6 flex items-center justify-between">
          <p className="text-muted-foreground text-sm md:text-base">
            عرض <span className="text-foreground font-bold">{filteredPlayers.length}</span> لاعب
            {players.length !== filteredPlayers.length && (
              <span className="text-muted-foreground"> من {players.length}</span>
            )}
          </p>
        </div>

        {/* Players Grid/List */}
        <AnimatePresence mode="popLayout">
          {filteredPlayers.length > 0 ? (
            viewMode === 'grid' ? (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6"
              >
                {filteredPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="overflow-hidden hover:border-gold/50 transition-all group">
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
                            <User className="w-12 md:w-20 h-12 md:h-20 text-muted-foreground" />
                          </div>
                        )}
                        {player.position && (
                          <Badge className="absolute top-2 right-2 md:top-3 md:right-3 bg-gold text-primary-foreground text-xs">
                            {player.position}
                          </Badge>
                        )}
                        {/* Favorite Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`absolute top-2 left-2 md:top-3 md:left-3 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 ${
                            isFavorite(player.id) ? 'text-red-500' : 'text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(player.id);
                          }}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(player.id) ? 'fill-current' : ''}`} />
                        </Button>
                        {/* Video Indicator */}
                        {player.video_urls && player.video_urls.length > 0 && (
                          <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {player.video_urls.length}
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3 md:p-4">
                        <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2 truncate">{player.full_name}</h3>
                        
                        <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-muted-foreground">
                          {player.nationality && (
                            <div className="flex items-center gap-1 md:gap-2">
                              <MapPin className="w-3 md:w-4 h-3 md:h-4 text-gold" />
                              <span className="truncate">{player.nationality}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 md:gap-4 mt-2 md:mt-4 pt-2 md:pt-4 border-t border-border text-xs md:text-sm">
                          {player.height_cm && (
                            <div className="flex items-center gap-1">
                              <Ruler className="w-3 md:w-4 h-3 md:h-4 text-gold" />
                              <span>{player.height_cm}</span>
                            </div>
                          )}
                          {player.weight_kg && (
                            <div className="flex items-center gap-1">
                              <Weight className="w-3 md:w-4 h-3 md:h-4 text-gold" />
                              <span>{player.weight_kg}</span>
                            </div>
                          )}
                        </div>

                        <Button 
                          className="w-full mt-3 md:mt-4 btn-gold text-xs md:text-sm" 
                          size="sm"
                          onClick={() => navigate(`/player/${player.id}`)}
                        >
                          عرض الملف
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              // List View
              <motion.div layout className="space-y-4">
                {filteredPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="overflow-hidden hover:border-gold/50 transition-all">
                      <CardContent className="p-4 flex gap-4">
                        {/* Player Image */}
                        <div className="relative w-24 h-32 md:w-32 md:h-40 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {player.profile_image_url ? (
                            <img
                              src={player.profile_image_url}
                              alt={player.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-10 h-10 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-bold text-lg truncate">{player.full_name}</h3>
                              {player.position && (
                                <Badge className="bg-gold/10 text-gold border-gold/30 mt-1">
                                  {player.position}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={isFavorite(player.id) ? 'text-red-500' : 'text-muted-foreground'}
                              onClick={() => toggleFavorite(player.id)}
                            >
                              <Heart className={`w-5 h-5 ${isFavorite(player.id) ? 'fill-current' : ''}`} />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-sm text-muted-foreground mb-4">
                            {player.nationality && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gold" />
                                <span>{player.nationality}</span>
                              </div>
                            )}
                            {player.height_cm && (
                              <div className="flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-gold" />
                                <span>{player.height_cm} سم</span>
                              </div>
                            )}
                            {player.weight_kg && (
                              <div className="flex items-center gap-2">
                                <Weight className="w-4 h-4 text-gold" />
                                <span>{player.weight_kg} كجم</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              className="btn-gold" 
                              size="sm"
                              onClick={() => navigate(`/player/${player.id}`)}
                            >
                              <Eye className="w-4 h-4 ml-2" />
                              عرض الملف
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/messages?to=${player.user_id}`)}
                            >
                              <MessageSquare className="w-4 h-4 ml-2" />
                              مراسلة
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )
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
