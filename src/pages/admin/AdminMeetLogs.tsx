import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, Clock, User, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MeetLog {
  id: string;
  booking_id: string;
  meet_link: string;
  calendar_event_id: string | null;
  status: string;
  player_user_id: string;
  player_name: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  regenerated_count: number;
}

const getStatusConfig = (t: (key: string) => string) => ({
  created: { label: t('meet.created'), color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  active: { label: t('meet.active'), color: 'bg-green-500/10 text-green-500 border-green-500/30', icon: <Video className="w-3.5 h-3.5" /> },
  completed: { label: t('meet.completed'), color: 'bg-gray-500/10 text-gray-500 border-gray-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { label: t('meet.cancelled'), color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', icon: <XCircle className="w-3.5 h-3.5" /> },
  error: { label: t('meet.error'), color: 'bg-destructive/10 text-destructive border-destructive/30', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  expired: { label: t('meet.expired'), color: 'bg-gray-500/10 text-gray-400 border-gray-500/30', icon: <Clock className="w-3.5 h-3.5" /> },
});

const AdminMeetLogs = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const statusConfig = getStatusConfig(t);
  const [logs, setLogs] = useState<MeetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('google_meet_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching meet logs:', error);
      toast({
        title: t('common.error'),
        description: t('meet.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
    toast({ title: t('meet.logsRefreshed') });
  };

  const handleUpdateStatus = async (logId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('google_meet_logs')
        .update({ status: newStatus })
        .eq('id', logId);

      if (error) throw error;

      setLogs(logs.map(log => 
        log.id === logId ? { ...log, status: newStatus } : log
      ));

      toast({ title: t('meet.statusUpdated') });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: t('common.error'),
        description: t('meet.statusUpdateError'),
        variant: 'destructive',
      });
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.player_name?.toLowerCase().includes(query) ||
      log.meet_link.toLowerCase().includes(query) ||
      log.booking_id.toLowerCase().includes(query)
    );
  });

  // Stats
  const stats = {
    total: logs.length,
    created: logs.filter(l => l.status === 'created').length,
    active: logs.filter(l => l.status === 'active').length,
    completed: logs.filter(l => l.status === 'completed').length,
    errors: logs.filter(l => l.status === 'error').length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('meet.logs')}</h1>
            <p className="text-muted-foreground mt-1">{t('meet.trackMeetings')}</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('meet.total')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-glass rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.created}</p>
                <p className="text-xs text-muted-foreground">{t('meet.created')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-glass rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">{t('meet.active')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-glass rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">{t('meet.completed')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-glass rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.errors}</p>
                <p className="text-xs text-muted-foreground">{t('meet.errors')}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-glass rounded-xl p-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('meet.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-secondary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-secondary">
                  <SelectValue placeholder={t('common.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('meet.allStatuses')}</SelectItem>
                  <SelectItem value="created">{t('meet.created')}</SelectItem>
                  <SelectItem value="active">{t('meet.active')}</SelectItem>
                  <SelectItem value="completed">{t('meet.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('meet.cancelled')}</SelectItem>
                  <SelectItem value="error">{t('meet.error')}</SelectItem>
                  <SelectItem value="expired">{t('meet.expired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{t('meet.noLogs')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t('meet.player')}</TableHead>
                    <TableHead className="text-right">{t('meet.bookingDate')}</TableHead>
                    <TableHead className="text-right">{t('meet.bookingTime')}</TableHead>
                    <TableHead className="text-right">{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('meet.meetingLink')}</TableHead>
                    <TableHead className="text-right">{t('meet.regenerateCount')}</TableHead>
                    <TableHead className="text-right">{t('meet.createdAt')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const status = statusConfig[log.status] || statusConfig.created;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{log.player_name || t('meet.unknown')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span dir="ltr">{format(new Date(log.booking_date), 'yyyy/MM/dd')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span dir="ltr">{log.start_time} - {log.end_time}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${status.color} flex items-center gap-1 w-fit`}>
                            {status.icon}
                            {status.label}
                          </Badge>
                          {log.error_message && (
                            <p className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={log.error_message}>
                              {log.error_message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <a
                            href={log.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="max-w-[150px] truncate" dir="ltr">
                              {log.meet_link.replace('https://meet.google.com/', '')}
                            </span>
                          </a>
                        </TableCell>
                        <TableCell>
                          {log.regenerated_count > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {log.regenerated_count} {t('meet.times')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground" dir="ltr">
                            {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm', { locale: ar })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={log.status}
                            onValueChange={(value) => handleUpdateStatus(log.id, value)}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="created">{t('meet.created')}</SelectItem>
                              <SelectItem value="active">{t('meet.active')}</SelectItem>
                              <SelectItem value="completed">{t('meet.completed')}</SelectItem>
                              <SelectItem value="cancelled">{t('meet.cancelled')}</SelectItem>
                              <SelectItem value="expired">{t('meet.expired')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminMeetLogs;
