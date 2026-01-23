import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Search,
  Filter,
  Calendar,
  Building2,
  User,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PlayerInterest {
  id: string;
  player_id: string;
  club_user_id: string;
  interest_type: string;
  message: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  player_name?: string;
  club_name?: string;
  player_email?: string;
  player_phone?: string;
  club_email?: string;
  club_phone?: string;
}

const AdminPlayerInterests = () => {
  const { toast } = useToast();
  const [interests, setInterests] = useState<PlayerInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInterest, setSelectedInterest] = useState<PlayerInterest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchInterests = async () => {
    try {
      const { data: interestsData, error } = await supabase
        .from('player_interests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (interestsData && interestsData.length > 0) {
        // Get player and club details
        const playerIds = [...new Set(interestsData.map(i => i.player_id))];
        const clubUserIds = [...new Set(interestsData.map(i => i.club_user_id))];

        const [playersRes, playerPrivateRes, clubsRes] = await Promise.all([
          supabase.from('players').select('id, full_name, user_id').in('id', playerIds),
          supabase.from('player_private').select('user_id, email, phone'),
          supabase.from('clubs').select('user_id, name, email, phone').in('user_id', clubUserIds),
        ]);

        const playerMap = new Map(playersRes.data?.map(p => [p.id, p]));
        const playerPrivateMap = new Map(playerPrivateRes.data?.map(p => [p.user_id, p]));
        const clubMap = new Map(clubsRes.data?.map(c => [c.user_id, c]));

        const enrichedInterests = interestsData.map(interest => {
          const player = playerMap.get(interest.player_id);
          const playerPrivate = player ? playerPrivateMap.get(player.user_id) : null;
          const club = clubMap.get(interest.club_user_id);

          return {
            ...interest,
            player_name: player?.full_name || 'غير معروف',
            player_email: playerPrivate?.email,
            player_phone: playerPrivate?.phone,
            club_name: club?.name || 'غير معروف',
            club_email: club?.email,
            club_phone: club?.phone,
          };
        });

        setInterests(enrichedInterests);
      } else {
        setInterests([]);
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, []);

  const updateInterestStatus = async (id: string, status: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('player_interests')
        .update({
          status,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'تم تحديث الحالة بنجاح' });
      fetchInterests();
      setSelectedInterest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating interest:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحديث الحالة',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const filteredInterests = interests.filter(interest => {
    const matchesSearch = 
      interest.player_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interest.club_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || interest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'قيد المراجعة', variant: 'secondary' },
      reviewed: { label: 'تمت المراجعة', variant: 'outline' },
      contacted: { label: 'تم التواصل', variant: 'default' },
      rejected: { label: 'مرفوض', variant: 'destructive' },
    };
    const { label, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'offer' ? (
      <Badge className="bg-gold text-gold-foreground">عرض رسمي</Badge>
    ) : (
      <Badge variant="outline">مهتم</Badge>
    );
  };

  const stats = {
    total: interests.length,
    pending: interests.filter(i => i.status === 'pending').length,
    contacted: interests.filter(i => i.status === 'contacted').length,
    offers: interests.filter(i => i.interest_type === 'offer').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-gold" />
            اهتمامات الأندية
          </h1>
          <p className="text-muted-foreground">إدارة طلبات الأندية للتواصل مع اللاعبين</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{stats.contacted}</div>
              <p className="text-sm text-muted-foreground">تم التواصل</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gold">{stats.offers}</div>
              <p className="text-sm text-muted-foreground">عروض رسمية</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم اللاعب أو النادي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="تصفية بالحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد المراجعة</SelectItem>
              <SelectItem value="reviewed">تمت المراجعة</SelectItem>
              <SelectItem value="contacted">تم التواصل</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Interests List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : filteredInterests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات اهتمام</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInterests.map((interest) => (
              <motion.div
                key={interest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={interest.status === 'pending' ? 'border-yellow-500/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          {getTypeBadge(interest.interest_type)}
                          {getStatusBadge(interest.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-gold" />
                            {interest.club_name}
                          </span>
                          <span className="text-muted-foreground">←</span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gold" />
                            {interest.player_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(interest.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                        </div>
                        {interest.message && (
                          <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {interest.message}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedInterest(interest);
                          setAdminNotes(interest.admin_notes || '');
                        }}
                      >
                        <Eye className="w-4 h-4 ml-2" />
                        عرض التفاصيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={!!selectedInterest} onOpenChange={() => setSelectedInterest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل طلب الاهتمام</DialogTitle>
            </DialogHeader>

            {selectedInterest && (
              <div className="space-y-6 mt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Club Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gold" />
                        معلومات النادي
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><strong>الاسم:</strong> {selectedInterest.club_name}</p>
                      <p><strong>البريد:</strong> {selectedInterest.club_email || '—'}</p>
                      <p><strong>الهاتف:</strong> {selectedInterest.club_phone || '—'}</p>
                    </CardContent>
                  </Card>

                  {/* Player Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="w-4 h-4 text-gold" />
                        معلومات اللاعب
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><strong>الاسم:</strong> {selectedInterest.player_name}</p>
                      <p><strong>البريد:</strong> {selectedInterest.player_email || '—'}</p>
                      <p><strong>الهاتف:</strong> {selectedInterest.player_phone || '—'}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Interest Details */}
                <div className="space-y-2">
                  <p><strong>نوع الاهتمام:</strong> {getTypeBadge(selectedInterest.interest_type)}</p>
                  <p><strong>الحالة الحالية:</strong> {getStatusBadge(selectedInterest.status)}</p>
                  {selectedInterest.message && (
                    <div>
                      <strong>رسالة النادي:</strong>
                      <p className="mt-1 p-3 bg-muted rounded-lg">{selectedInterest.message}</p>
                    </div>
                  )}
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label>ملاحظات الإدارة</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="أضف ملاحظات..."
                    className="min-h-[80px]"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => updateInterestStatus(selectedInterest.id, 'contacted')}
                    disabled={updating}
                    className="btn-gold"
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    تم التواصل
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateInterestStatus(selectedInterest.id, 'reviewed')}
                    disabled={updating}
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    تمت المراجعة
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateInterestStatus(selectedInterest.id, 'rejected')}
                    disabled={updating}
                  >
                    <XCircle className="w-4 h-4 ml-2" />
                    رفض
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPlayerInterests;
