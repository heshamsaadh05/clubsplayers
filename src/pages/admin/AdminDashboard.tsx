import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalPlayers: number;
  pendingPlayers: number;
  approvedPlayers: number;
  totalClubs: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalPlayers: 0,
    pendingPlayers: 0,
    approvedPlayers: 0,
    totalClubs: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch players stats
      const { count: totalPlayers } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });

      const { count: pendingPlayers } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approvedPlayers } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Fetch clubs stats
      const { count: totalClubs } = await supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true });

      // Fetch subscriptions stats
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        totalPlayers: totalPlayers || 0,
        pendingPlayers: pendingPlayers || 0,
        approvedPlayers: approvedPlayers || 0,
        totalClubs: totalClubs || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalRevenue: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Users,
      label: 'إجمالي اللاعبين',
      value: stats.totalPlayers,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Clock,
      label: 'في انتظار الموافقة',
      value: stats.pendingPlayers,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: CheckCircle,
      label: 'لاعبون معتمدون',
      value: stats.approvedPlayers,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Building2,
      label: 'الأندية المسجلة',
      value: stats.totalClubs,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: TrendingUp,
      label: 'اشتراكات نشطة',
      value: stats.activeSubscriptions,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
    {
      icon: DollarSign,
      label: 'إجمالي الإيرادات',
      value: `$${stats.totalRevenue}`,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على إحصائيات الموقع</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">إجراءات سريعة</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/admin/players"
              className="flex items-center gap-3 p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
            >
              <Users className="w-5 h-5 text-gold" />
              <span>مراجعة اللاعبين الجدد</span>
            </a>
            <a
              href="/admin/plans"
              className="flex items-center gap-3 p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
            >
              <DollarSign className="w-5 h-5 text-gold" />
              <span>إدارة الباقات</span>
            </a>
            <a
              href="/admin/settings"
              className="flex items-center gap-3 p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
            >
              <Building2 className="w-5 h-5 text-gold" />
              <span>إعدادات الموقع</span>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
