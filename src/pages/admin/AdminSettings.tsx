import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, DollarSign, Globe, Image, Upload, X, Type, Sun, Moon, Maximize2, Minus, Square } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, any>;
}

type LogoSize = 'small' | 'medium' | 'large';

interface SiteLogo {
  type: 'text' | 'image';
  image_url: string | null;
  light_image_url?: string | null;
  dark_image_url?: string | null;
  size?: LogoSize;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const lightLogoInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);

  const [playerFee, setPlayerFee] = useState({ enabled: false, amount: 0, currency: 'USD' });
  const [siteName, setSiteName] = useState({ en: '', ar: '' });
  const [siteDescription, setSiteDescription] = useState({ en: '', ar: '' });
  const [siteLogo, setSiteLogo] = useState<SiteLogo>({ type: 'text', image_url: null });

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
        } else if (setting.key === 'site_logo') {
          setSiteLogo(setting.value as SiteLogo);
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
        saveSetting('site_logo', siteLogo),
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, mode: 'light' | 'dark') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'خطأ', description: 'يرجى اختيار ملف صورة', variant: 'destructive' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'خطأ', description: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت', variant: 'destructive' });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${mode}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      if (mode === 'light') {
        setSiteLogo(prev => ({ 
          ...prev, 
          type: 'image', 
          light_image_url: publicUrl,
          image_url: prev.image_url || publicUrl // Keep backwards compatibility
        }));
      } else {
        setSiteLogo(prev => ({ 
          ...prev, 
          type: 'image', 
          dark_image_url: publicUrl,
          image_url: prev.image_url || publicUrl
        }));
      }
      toast({ title: `تم رفع لوجو الوضع ${mode === 'light' ? 'الفاتح' : 'الداكن'} بنجاح` });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء رفع الصورة', variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = (mode: 'light' | 'dark') => {
    if (mode === 'light') {
      setSiteLogo(prev => ({ ...prev, light_image_url: null }));
    } else {
      setSiteLogo(prev => ({ ...prev, dark_image_url: null }));
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

        {/* Site Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Image className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-xl font-bold">لوجو الموقع</h2>
          </div>

          <div className="space-y-6">
            <RadioGroup
              value={siteLogo.type}
              onValueChange={(value: 'text' | 'image') => 
                setSiteLogo({ ...siteLogo, type: value })
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="text" id="logo-text" />
                <Label htmlFor="logo-text" className="flex items-center gap-2 cursor-pointer">
                  <Type className="w-4 h-4" />
                  استخدام اسم الموقع
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="image" id="logo-image" />
                <Label htmlFor="logo-image" className="flex items-center gap-2 cursor-pointer">
                  <Image className="w-4 h-4" />
                  رفع صورة لوجو
                </Label>
              </div>
            </RadioGroup>

            {siteLogo.type === 'image' && (
              <div className="space-y-6 pt-4 border-t border-border">
                {/* Light Mode Logo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <Label className="font-medium">لوجو الوضع الفاتح</Label>
                  </div>
                  {siteLogo.light_image_url ? (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={siteLogo.light_image_url}
                          alt="Light Mode Logo"
                          className="h-16 w-auto object-contain bg-white rounded-lg p-2 border"
                        />
                        <button
                          onClick={() => handleRemoveLogo('light')}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => lightLogoInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        <Upload className="w-4 h-4 ml-2" />
                        تغيير
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => lightLogoInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold/50 transition-colors bg-white/50"
                    >
                      <Sun className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                      <p className="text-muted-foreground text-sm">
                        {uploadingLogo ? 'جاري الرفع...' : 'رفع لوجو للوضع الفاتح'}
                      </p>
                    </div>
                  )}
                  <input
                    ref={lightLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'light')}
                    className="hidden"
                  />
                </div>

                {/* Dark Mode Logo */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-blue-400" />
                    <Label className="font-medium">لوجو الوضع الداكن</Label>
                  </div>
                  {siteLogo.dark_image_url ? (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={siteLogo.dark_image_url}
                          alt="Dark Mode Logo"
                          className="h-16 w-auto object-contain bg-zinc-800 rounded-lg p-2 border border-zinc-700"
                        />
                        <button
                          onClick={() => handleRemoveLogo('dark')}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => darkLogoInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        <Upload className="w-4 h-4 ml-2" />
                        تغيير
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => darkLogoInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold/50 transition-colors bg-zinc-900/50"
                    >
                      <Moon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                      <p className="text-muted-foreground text-sm">
                        {uploadingLogo ? 'جاري الرفع...' : 'رفع لوجو للوضع الداكن'}
                      </p>
                    </div>
                  )}
                  <input
                    ref={darkLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'dark')}
                    className="hidden"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  PNG, JPG أو SVG - أقصى حجم 2MB لكل صورة
                </p>

                {/* Logo Size Selector */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="font-medium">حجم اللوجو</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={siteLogo.size === 'small' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSiteLogo(prev => ({ ...prev, size: 'small' }))}
                      className={siteLogo.size === 'small' ? 'bg-gold hover:bg-gold/90' : ''}
                    >
                      <Minus className="w-4 h-4 ml-2" />
                      صغير
                    </Button>
                    <Button
                      type="button"
                      variant={(!siteLogo.size || siteLogo.size === 'medium') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSiteLogo(prev => ({ ...prev, size: 'medium' }))}
                      className={(!siteLogo.size || siteLogo.size === 'medium') ? 'bg-gold hover:bg-gold/90' : ''}
                    >
                      <Square className="w-4 h-4 ml-2" />
                      متوسط
                    </Button>
                    <Button
                      type="button"
                      variant={siteLogo.size === 'large' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSiteLogo(prev => ({ ...prev, size: 'large' }))}
                      className={siteLogo.size === 'large' ? 'bg-gold hover:bg-gold/90' : ''}
                    >
                      <Maximize2 className="w-4 h-4 ml-2" />
                      كبير
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {siteLogo.type === 'text' && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  سيتم عرض اسم الموقع "{siteName.ar || siteName.en || 'Stars Agency'}" كنص في شريط التنقل
                </p>
              </div>
            )}
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
