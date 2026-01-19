import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  MoreVertical,
  Calendar,
  CreditCard,
  Building2,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import PrivateImage from '@/components/admin/PrivateImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  payment_method: string | null;
  payment_reference: string | null;
  proof_url: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  subscription_plans: {
    id: string;
    name: string;
    name_ar: string;
    price: number;
    currency: string;
    duration_days: number;
  };
  clubs: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

const AdminSubscriptions = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Fetch subscriptions with plan details
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            name_ar,
            price,
            currency,
            duration_days
          )
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Fetch clubs for each subscription
      const userIds = [...new Set((subsData || []).map(s => s.user_id))];
      
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name, email, phone, user_id')
        .in('user_id', userIds);

      if (clubsError) throw clubsError;

      // Map clubs to subscriptions
      const clubsMap = new Map(clubsData?.map(c => [c.user_id, c]));
      
      const processedData = (subsData || []).map(sub => ({
        ...sub,
        clubs: clubsMap.get(sub.user_id) || null
      }));

      setSubscriptions(processedData as Subscription[]);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async (subscriptionId: string, newStatus: 'active' | 'expired' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({ title: 'تم تحديث حالة الاشتراك بنجاح' });
      fetchSubscriptions();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء التحديث',
        variant: 'destructive',
      });
    }
  };

  const extendSubscription = async (subscription: Subscription, days: number) => {
    try {
      const currentEndDate = new Date(subscription.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          end_date: newEndDate.toISOString(),
          status: 'active'
        })
        .eq('id', subscription.id);

      if (error) throw error;

      toast({ title: `تم تمديد الاشتراك ${days} يوم بنجاح` });
      fetchSubscriptions();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء التمديد',
        variant: 'destructive',
      });
    }
  };

  const getStatusConfig = (status: string, endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (status === 'pending') {
      return {
        label: 'في انتظار الموافقة',
        icon: Clock,
        className: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      };
    }

    if (status === 'cancelled') {
      return {
        label: 'ملغي',
        icon: XCircle,
        className: 'bg-red-500/10 text-red-500 border-red-500/30',
      };
    }

    if (status === 'expired' || daysRemaining <= 0) {
      return {
        label: 'منتهي',
        icon: XCircle,
        className: 'bg-red-500/10 text-red-500 border-red-500/30',
      };
    }

    if (daysRemaining <= 7) {
      return {
        label: 'ينتهي قريباً',
        icon: Clock,
        className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      };
    }

    return {
      label: 'نشط',
      icon: CheckCircle,
      className: 'bg-green-500/10 text-green-500 border-green-500/30',
    };
  };

  const getPaymentMethodLabel = (method: string | null) => {
    const labels: Record<string, string> = {
      stripe: 'Stripe',
      paypal: 'PayPal',
      bank_transfer: 'تحويل بنكي',
      wallet: 'محفظة إلكترونية',
      fawry: 'فوري',
      opay: 'OPay',
      '2checkout': '2Checkout',
    };
    return method ? labels[method] || method : 'غير محدد';
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.clubs?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.clubs?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: subscriptions.length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
    totalRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.subscription_plans?.price || 0), 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة الاشتراكات</h1>
            <p className="text-muted-foreground mt-1">مراقبة وإدارة اشتراكات الأندية</p>
          </div>
          <Button variant="outline" onClick={fetchSubscriptions}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass rounded-xl p-4"
          >
            <p className="text-sm text-muted-foreground">إجمالي الاشتراكات</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-glass rounded-xl p-4 cursor-pointer hover:ring-2 hover:ring-orange-500"
            onClick={() => setStatusFilter('pending')}
          >
            <p className="text-sm text-muted-foreground">في الانتظار</p>
            <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-glass rounded-xl p-4"
          >
            <p className="text-sm text-muted-foreground">نشط</p>
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-glass rounded-xl p-4"
          >
            <p className="text-sm text-muted-foreground">منتهي</p>
            <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-glass rounded-xl p-4"
          >
            <p className="text-sm text-muted-foreground">ملغي</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.cancelled}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-glass rounded-xl p-4"
          >
            <p className="text-sm text-muted-foreground">الإيرادات النشطة</p>
            <p className="text-2xl font-bold text-gold">${stats.totalRevenue}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالنادي أو البريد أو رقم المرجع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-secondary"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-secondary">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="حالة الاشتراك" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">في الانتظار</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="expired">منتهي</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subscriptions Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد اشتراكات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">النادي</TableHead>
                  <TableHead className="text-right">الخطة</TableHead>
                  <TableHead className="text-right">طريقة الدفع</TableHead>
                  <TableHead className="text-right">تاريخ البدء</TableHead>
                  <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => {
                  const statusConfig = getStatusConfig(subscription.status, subscription.end_date);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{subscription.clubs?.name || 'غير معروف'}</p>
                            <p className="text-sm text-muted-foreground">{subscription.clubs?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{subscription.subscription_plans?.name_ar}</p>
                          <p className="text-sm text-gold">
                            {subscription.subscription_plans?.price} {subscription.subscription_plans?.currency}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPaymentMethodLabel(subscription.payment_method)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(subscription.start_date).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        {new Date(subscription.end_date).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.className} variant="outline">
                          <StatusIcon className="w-3 h-3 ml-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedSubscription(subscription);
                              setDetailsOpen(true);
                            }}>
                              <Eye className="w-4 h-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            {subscription.status !== 'active' && (
                              <DropdownMenuItem onClick={() => updateSubscriptionStatus(subscription.id, 'active')}>
                                <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                                تفعيل
                              </DropdownMenuItem>
                            )}
                            {subscription.status === 'active' && (
                              <>
                                <DropdownMenuItem onClick={() => extendSubscription(subscription, 30)}>
                                  <Calendar className="w-4 h-4 ml-2 text-blue-500" />
                                  تمديد 30 يوم
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateSubscriptionStatus(subscription.id, 'cancelled')}>
                                  <XCircle className="w-4 h-4 ml-2 text-red-500" />
                                  إلغاء
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </motion.div>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل الاشتراك</DialogTitle>
            </DialogHeader>
            {selectedSubscription && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">النادي</p>
                    <p className="font-medium">{selectedSubscription.clubs?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{selectedSubscription.clubs?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">الخطة</p>
                    <p className="font-medium">{selectedSubscription.subscription_plans?.name_ar}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">السعر</p>
                    <p className="font-medium text-gold">
                      {selectedSubscription.subscription_plans?.price} {selectedSubscription.subscription_plans?.currency}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">طريقة الدفع</p>
                    <p className="font-medium">{getPaymentMethodLabel(selectedSubscription.payment_method)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">رقم المرجع</p>
                    <p className="font-medium">{selectedSubscription.payment_reference || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">تاريخ البدء</p>
                    <p className="font-medium">{new Date(selectedSubscription.start_date).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                    <p className="font-medium">{new Date(selectedSubscription.end_date).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>

                {/* Payment Proof Section */}
                {selectedSubscription.proof_url && (
                  <div className="space-y-2 p-4 bg-secondary rounded-xl">
                    <p className="text-sm font-medium text-foreground">إثبات الدفع</p>
                    <PrivateImage
                      bucket="payment-proofs"
                      url={selectedSubscription.proof_url}
                      alt="إثبات الدفع"
                      className="max-w-full max-h-64 mx-auto"
                    />
                  </div>
                )}

                {/* Admin Notes */}
                {selectedSubscription.admin_notes && (
                  <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                    <p className="text-sm font-medium text-yellow-600 mb-1">ملاحظات المدير</p>
                    <p className="text-sm">{selectedSubscription.admin_notes}</p>
                  </div>
                )}

                {/* Pending Subscription - Approval Actions */}
                {selectedSubscription.status === 'pending' && (
                  <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
                    <p className="text-sm font-medium text-orange-500 mb-3">هذا الاشتراك في انتظار الموافقة</p>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          updateSubscriptionStatus(selectedSubscription.id, 'active');
                          setDetailsOpen(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 ml-2" />
                        الموافقة وتفعيل
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          updateSubscriptionStatus(selectedSubscription.id, 'cancelled');
                          setDetailsOpen(false);
                        }}
                      >
                        <XCircle className="w-4 h-4 ml-2" />
                        رفض
                      </Button>
                    </div>
                  </div>
                )}

                {/* Active Subscription Actions */}
                {selectedSubscription.status === 'active' && (
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        extendSubscription(selectedSubscription, 30);
                        setDetailsOpen(false);
                      }}
                    >
                      <Calendar className="w-4 h-4 ml-2" />
                      تمديد 30 يوم
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateSubscriptionStatus(selectedSubscription.id, 'cancelled');
                        setDetailsOpen(false);
                      }}
                    >
                      <XCircle className="w-4 h-4 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                )}

                {/* Expired/Cancelled Subscription Actions */}
                {(selectedSubscription.status === 'expired' || selectedSubscription.status === 'cancelled') && (
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      className="flex-1 btn-gold"
                      onClick={() => {
                        updateSubscriptionStatus(selectedSubscription.id, 'active');
                        setDetailsOpen(false);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      إعادة تفعيل
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;