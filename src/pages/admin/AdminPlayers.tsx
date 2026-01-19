import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Check, X, Trash2, Filter, Edit, Crown } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import AdminEditPlayerForm from '@/components/admin/AdminEditPlayerForm';
import AdminManageSubscription from '@/components/admin/AdminManageSubscription';
import PrivateImage from '@/components/admin/PrivateImage';

interface Player {
  id: string;
  user_id: string;
  full_name: string;
  position: string;
  nationality: string;
  current_club: string;
  height_cm: number;
  weight_kg: number;
  status: 'pending' | 'approved' | 'rejected';
  profile_image_url: string;
  created_at: string;
  // PII fields from player_private (admin only)
  email?: string;
  phone?: string;
  date_of_birth?: string;
  id_document_url?: string;
  rejection_reason?: string;
}

const AdminPlayers = () => {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, [statusFilter]);

  const fetchPlayers = async () => {
    try {
      // Fetch players
      let query = supabase.from('players').select('*').order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'approved' | 'rejected');
      }

      const { data: playersData, error: playersError } = await query;
      if (playersError) throw playersError;

      // Fetch PII from player_private (admin only)
      const userIds = (playersData || []).map(p => p.user_id);
      const { data: privateData, error: privateError } = await supabase
        .from('player_private')
        .select('*')
        .in('user_id', userIds);
      
      if (privateError) throw privateError;

      // Create a map for PII
      const privateMap = new Map<string, any>();
      (privateData || []).forEach(p => privateMap.set(p.user_id, p));

      // Merge players with their private data
      const mergedPlayers = (playersData || []).map(player => {
        const pii = privateMap.get(player.user_id);
        return {
          ...player,
          email: pii?.email,
          phone: pii?.phone,
          date_of_birth: pii?.date_of_birth,
          id_document_url: pii?.id_document_url,
          rejection_reason: pii?.rejection_reason,
        };
      });

      setPlayers(mergedPlayers as Player[]);
    } catch (error) {
      logError(error, 'AdminPlayers:fetchPlayers');
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerStatus = async (playerId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ status })
        .eq('id', playerId);

      if (error) throw error;

      toast({
        title: status === 'approved' ? 'تمت الموافقة' : 'تم الرفض',
        description: status === 'approved' 
          ? 'تمت الموافقة على اللاعب بنجاح'
          : 'تم رفض طلب اللاعب',
      });

      fetchPlayers();
      setShowDetails(false);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الحالة',
        variant: 'destructive',
      });
    }
  };

  const deletePlayer = async (playerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا اللاعب؟')) return;

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف اللاعب بنجاح',
      });

      fetchPlayers();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحذف',
        variant: 'destructive',
      });
    }
  };

  const filteredPlayers = players.filter(player =>
    player.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    player.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm">في الانتظار</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">معتمد</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm">مرفوض</span>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة اللاعبين</h1>
            <p className="text-muted-foreground mt-1">
              عرض وإدارة طلبات اللاعبين ({players.length} لاعب)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="البحث عن لاعب..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-secondary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
                className={`text-xs sm:text-sm ${statusFilter === status ? 'btn-gold' : ''}`}
                size="sm"
              >
                {status === 'all' && 'الكل'}
                {status === 'pending' && 'انتظار'}
                {status === 'approved' && 'معتمد'}
                {status === 'rejected' && 'مرفوض'}
              </Button>
            ))}
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="card-glass rounded-2xl overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-right p-4 text-muted-foreground font-medium">اللاعب</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">المركز</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">النادي الحالي</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">الحالة</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">تاريخ التسجيل</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      لا يوجد لاعبون
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player) => (
                    <motion.tr
                      key={player.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-border hover:bg-secondary/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                            {player.profile_image_url ? (
                              <img
                                src={player.profile_image_url}
                                alt={player.full_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gold font-bold">
                                {player.full_name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{player.full_name}</p>
                            <p className="text-sm text-muted-foreground">{player.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">{player.position || '-'}</td>
                      <td className="p-4 text-foreground">{player.current_club || '-'}</td>
                      <td className="p-4">{getStatusBadge(player.status)}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(player.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPlayer(player);
                              setShowDetails(true);
                            }}
                            title="عرض"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gold hover:text-gold/80"
                            onClick={() => {
                              setSelectedPlayer(player);
                              setShowEditForm(true);
                            }}
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-500 hover:text-purple-600"
                            onClick={() => {
                              setSelectedPlayer(player);
                              setShowSubscription(true);
                            }}
                            title="الاشتراك"
                          >
                            <Crown className="w-4 h-4" />
                          </Button>
                          {player.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-500 hover:text-green-600"
                                onClick={() => updatePlayerStatus(player.id, 'approved')}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => updatePlayerStatus(player.id, 'rejected')}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => deletePlayer(player.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">لا يوجد لاعبون</div>
          ) : (
            filteredPlayers.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-glass rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    {player.profile_image_url ? (
                      <img
                        src={player.profile_image_url}
                        alt={player.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gold font-bold">
                        {player.full_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{player.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{player.email}</p>
                  </div>
                  {getStatusBadge(player.status)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">المركز: </span>
                    <span>{player.position || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">النادي: </span>
                    <span>{player.current_club || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(player.created_at).toLocaleDateString('ar-EG')}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedPlayer(player);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gold"
                      onClick={() => {
                        setSelectedPlayer(player);
                        setShowEditForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-purple-500"
                      onClick={() => {
                        setSelectedPlayer(player);
                        setShowSubscription(true);
                      }}
                    >
                      <Crown className="w-4 h-4" />
                    </Button>
                    {player.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-500"
                          onClick={() => updatePlayerStatus(player.id, 'approved')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => updatePlayerStatus(player.id, 'rejected')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deletePlayer(player.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Player Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل اللاعب</DialogTitle>
            </DialogHeader>
            {selectedPlayer && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center">
                    {selectedPlayer.profile_image_url ? (
                      <img
                        src={selectedPlayer.profile_image_url}
                        alt={selectedPlayer.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-gold font-bold">
                        {selectedPlayer.full_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedPlayer.full_name}</h3>
                    <p className="text-muted-foreground">{selectedPlayer.email}</p>
                    {getStatusBadge(selectedPlayer.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">المركز</p>
                    <p className="font-medium">{selectedPlayer.position || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">الجنسية</p>
                    <p className="font-medium">{selectedPlayer.nationality || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">الطول</p>
                    <p className="font-medium">{selectedPlayer.height_cm ? `${selectedPlayer.height_cm} سم` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">الوزن</p>
                    <p className="font-medium">{selectedPlayer.weight_kg ? `${selectedPlayer.weight_kg} كجم` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">النادي الحالي</p>
                    <p className="font-medium">{selectedPlayer.current_club || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">الهاتف</p>
                    <p className="font-medium">{selectedPlayer.phone || '-'}</p>
                  </div>
                </div>

                {selectedPlayer.id_document_url && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">وثيقة الهوية</p>
                    <PrivateImage
                      bucket="player-documents"
                      url={selectedPlayer.id_document_url}
                      alt="وثيقة الهوية"
                      className="max-w-full max-h-48"
                    />
                  </div>
                )}

                {selectedPlayer.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => updatePlayerStatus(selectedPlayer.id, 'approved')}
                    >
                      <Check className="w-4 h-4 ml-2" />
                      قبول اللاعب
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updatePlayerStatus(selectedPlayer.id, 'rejected')}
                    >
                      <X className="w-4 h-4 ml-2" />
                      رفض الطلب
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Player Form */}
        {selectedPlayer && (
          <AdminEditPlayerForm
            player={selectedPlayer}
            isOpen={showEditForm}
            onClose={() => setShowEditForm(false)}
            onUpdate={fetchPlayers}
          />
        )}

        {/* Manage Subscription */}
        {selectedPlayer && (
          <AdminManageSubscription
            userId={selectedPlayer.user_id}
            userName={selectedPlayer.full_name}
            userType="player"
            isOpen={showSubscription}
            onClose={() => setShowSubscription(false)}
            onUpdate={fetchPlayers}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPlayers;
