import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Trash2, Building2 } from 'lucide-react';
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

interface Club {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  logo_url: string;
  description: string;
  website: string;
  created_at: string;
}

const AdminClubs = () => {
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteClub = async (clubId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النادي؟')) return;

    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف النادي بنجاح',
      });

      fetchClubs();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحذف',
        variant: 'destructive',
      });
    }
  };

  const filteredClubs = clubs.filter(club =>
    club.name?.toLowerCase().includes(search.toLowerCase()) ||
    club.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الأندية</h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة الأندية المسجلة ({clubs.length} نادي)
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="البحث عن نادي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 bg-secondary"
          />
        </div>

        {/* Clubs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-muted-foreground">جاري التحميل...</p>
          ) : filteredClubs.length === 0 ? (
            <p className="text-muted-foreground">لا توجد أندية</p>
          ) : (
            filteredClubs.map((club, index) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-glass rounded-2xl p-6"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center">
                    {club.logo_url ? (
                      <img
                        src={club.logo_url}
                        alt={club.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <Building2 className="w-7 h-7 text-gold" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{club.name}</h3>
                    <p className="text-sm text-muted-foreground">{club.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {club.country && (
                    <p className="text-muted-foreground">
                      📍 {club.city ? `${club.city}, ` : ''}{club.country}
                    </p>
                  )}
                  {club.phone && (
                    <p className="text-muted-foreground">📞 {club.phone}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedClub(club);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    عرض
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive/80"
                    onClick={() => deleteClub(club.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Club Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle>تفاصيل النادي</DialogTitle>
            </DialogHeader>
            {selectedClub && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gold/10 flex items-center justify-center">
                    {selectedClub.logo_url ? (
                      <img
                        src={selectedClub.logo_url}
                        alt={selectedClub.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <Building2 className="w-10 h-10 text-gold" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedClub.name}</h3>
                    <p className="text-muted-foreground">{selectedClub.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">الدولة</p>
                    <p className="font-medium">{selectedClub.country || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">المدينة</p>
                    <p className="font-medium">{selectedClub.city || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">الهاتف</p>
                    <p className="font-medium">{selectedClub.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">الموقع</p>
                    {selectedClub.website ? (
                      <a
                        href={selectedClub.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                      >
                        زيارة الموقع
                      </a>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>
                </div>

                {selectedClub.description && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">الوصف</p>
                    <p className="text-foreground">{selectedClub.description}</p>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  تاريخ التسجيل: {new Date(selectedClub.created_at).toLocaleDateString('ar-EG')}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminClubs;
