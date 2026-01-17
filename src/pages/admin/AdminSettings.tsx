import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, DollarSign, Globe } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, any>;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [playerFee, setPlayerFee] = useState({ enabled: false, amount: 0, currency: 'USD' });
  const [siteName, setSiteName] = useState({ en: '', ar: '' });
  const [siteDescription, setSiteDescription] = useState({ en: '', ar: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;
      
      const processedSettings: SiteSetting[] = (data || []).map(setting => ({
        id: setting.id,
        key: setting.key,
        value: typeof setting.value === 'object' && setting.value !== null 
          ? setting.value as Record<string, any>
          : {},
      }));
      
      setSettings(processedSettings);

      // Parse settings
      processedSettings.forEach((setting) => {
        if (setting.key === 'player_registration_fee') {
          setPlayerFee(setting.value as typeof playerFee);
        } else if (setting.key === 'site_name') {
          setSiteName(setting.value as typeof siteName);
        } else if (setting.key === 'site_description') {
          setSiteDescription(setting.value as typeof siteDescription);
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('key', key);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    
    try {
      const results = await Promise.all([
        saveSetting('player_registration_fee', playerFee),
        saveSetting('site_name', siteName),
        saveSetting('site_description', siteDescription),
      ]);

      if (results.every(r => r)) {
        toast({ title: 'تم حفظ الإعدادات بنجاح' });
      } else {
        throw new Error('Some settings failed to save');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحفظ',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إعدادات الموقع</h1>
            <p className="text-muted-foreground mt-1">تخصيص إعدادات الموقع العامة</p>
          </div>
          <Button
            className="btn-gold"
            onClick={handleSaveAll}
            disabled={saving}
          >
            <Save className="w-4 h-4 ml-2" />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>

        {/* Site Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-xl font-bold">معلومات الموقع</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>اسم الموقع (إنجليزي)</Label>
              <Input
                value={siteName.en}
                onChange={(e) => setSiteName({ ...siteName, en: e.target.value })}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label>اسم الموقع (عربي)</Label>
              <Input
                value={siteName.ar}
                onChange={(e) => setSiteName({ ...siteName, ar: e.target.value })}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label>وصف الموقع (إنجليزي)</Label>
              <Input
                value={siteDescription.en}
                onChange={(e) => setSiteDescription({ ...siteDescription, en: e.target.value })}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label>وصف الموقع (عربي)</Label>
              <Input
                value={siteDescription.ar}
                onChange={(e) => setSiteDescription({ ...siteDescription, ar: e.target.value })}
                className="bg-secondary"
              />
            </div>
          </div>
        </motion.div>

        {/* Player Registration Fee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-xl font-bold">رسوم تسجيل اللاعبين</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">تفعيل رسوم التسجيل</Label>
                <p className="text-sm text-muted-foreground">
                  عند التفعيل، سيُطلب من اللاعبين دفع رسوم للتسجيل
                </p>
              </div>
              <Switch
                checked={playerFee.enabled}
                onCheckedChange={(checked) =>
                  setPlayerFee({ ...playerFee, enabled: checked })
                }
              />
            </div>

            {playerFee.enabled && (
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label>مبلغ الرسوم</Label>
                  <Input
                    type="number"
                    value={playerFee.amount}
                    onChange={(e) =>
                      setPlayerFee({ ...playerFee, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Input
                    value={playerFee.currency}
                    onChange={(e) =>
                      setPlayerFee({ ...playerFee, currency: e.target.value })
                    }
                    className="bg-secondary"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
