import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, DollarSign, Globe, Image, Upload, X, Type, Sun, Moon, Maximize2, Minus, Square, Star, Video, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Wifi } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
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

interface FaviconSettings {
  light_url: string | null;
  dark_url: string | null;
}

interface GoogleApiSettings {
  service_account_key: string;
  is_configured: boolean;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const lightLogoInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const lightFaviconInputRef = useRef<HTMLInputElement>(null);
  const darkFaviconInputRef = useRef<HTMLInputElement>(null);

  const [playerFee, setPlayerFee] = useState({ enabled: false, amount: 0, currency: 'USD' });
  const [siteName, setSiteName] = useState({ en: '', ar: '' });
  const [siteDescription, setSiteDescription] = useState({ en: '', ar: '' });
  const [siteLogo, setSiteLogo] = useState<SiteLogo>({ type: 'text', image_url: null });
  const [siteFavicon, setSiteFavicon] = useState<FaviconSettings>({ light_url: null, dark_url: null });
  const [googleApi, setGoogleApi] = useState<GoogleApiSettings>({ service_account_key: '', is_configured: false });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingGoogleApi, setSavingGoogleApi] = useState(false);
  const [testingGoogleApi, setTestingGoogleApi] = useState(false);
  const [googleApiTestResult, setGoogleApiTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
        } else if (setting.key === 'site_favicon') {
          setSiteFavicon(setting.value as FaviconSettings);
        } else if (setting.key === 'google_api_settings') {
          const apiSettings = setting.value as GoogleApiSettings;
          setGoogleApi({
            service_account_key: apiSettings.service_account_key || '',
            is_configured: !!apiSettings.service_account_key
          });
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
      // Check if setting exists first
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ key, value });
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
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
        saveSetting('site_favicon', siteFavicon),
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

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>, mode: 'light' | 'dark') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'خطأ', description: 'يرجى اختيار ملف صورة', variant: 'destructive' });
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      toast({ title: 'خطأ', description: 'حجم الصورة يجب أن يكون أقل من 1 ميجابايت', variant: 'destructive' });
      return;
    }

    setUploadingFavicon(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${mode}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      if (mode === 'light') {
        setSiteFavicon(prev => ({ ...prev, light_url: publicUrl }));
      } else {
        setSiteFavicon(prev => ({ ...prev, dark_url: publicUrl }));
      }
      toast({ title: `تم رفع favicon الوضع ${mode === 'light' ? 'الفاتح' : 'الداكن'} بنجاح` });
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء رفع الصورة', variant: 'destructive' });
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleRemoveFavicon = (mode: 'light' | 'dark') => {
    if (mode === 'light') {
      setSiteFavicon(prev => ({ ...prev, light_url: null }));
    } else {
      setSiteFavicon(prev => ({ ...prev, dark_url: null }));
    }
  };

  const handleSaveGoogleApi = async () => {
    setSavingGoogleApi(true);
    try {
      // Validate JSON format if key is provided
      if (googleApi.service_account_key.trim()) {
        try {
          JSON.parse(googleApi.service_account_key);
        } catch {
          toast({
            title: 'خطأ',
            description: 'صيغة مفتاح الخدمة غير صحيحة. يجب أن يكون JSON صالح.',
            variant: 'destructive',
          });
          setSavingGoogleApi(false);
          return;
        }
      }

      const success = await saveSetting('google_api_settings', {
        service_account_key: googleApi.service_account_key,
        is_configured: !!googleApi.service_account_key.trim()
      });

      if (success) {
        setGoogleApi(prev => ({ ...prev, is_configured: !!googleApi.service_account_key.trim() }));
        toast({ title: 'تم حفظ إعدادات Google API بنجاح' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setSavingGoogleApi(false);
    }
  };

  const handleRemoveGoogleApi = async () => {
    setSavingGoogleApi(true);
    try {
      const success = await saveSetting('google_api_settings', {
        service_account_key: '',
        is_configured: false
      });

      if (success) {
        setGoogleApi({ service_account_key: '', is_configured: false });
        setGoogleApiTestResult(null);
        toast({ title: 'تم إزالة مفتاح Google API' });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إزالة المفتاح',
        variant: 'destructive',
      });
    } finally {
      setSavingGoogleApi(false);
    }
  };

  const handleTestGoogleApi = async () => {
    setTestingGoogleApi(true);
    setGoogleApiTestResult(null);
    
    try {
      // Validate JSON format first
      if (!googleApi.service_account_key.trim()) {
        setGoogleApiTestResult({ success: false, message: 'يرجى إدخال مفتاح Google Service Account أولاً' });
        setTestingGoogleApi(false);
        return;
      }

      try {
        JSON.parse(googleApi.service_account_key);
      } catch {
        setGoogleApiTestResult({ success: false, message: 'صيغة مفتاح الخدمة غير صحيحة. يجب أن يكون JSON صالح.' });
        setTestingGoogleApi(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('test-google-api', {
        body: { service_account_key: googleApi.service_account_key }
      });

      if (error) {
        console.error('Test Google API error:', error);
        setGoogleApiTestResult({ success: false, message: error.message || 'حدث خطأ أثناء اختبار الاتصال' });
      } else if (data?.success) {
        setGoogleApiTestResult({ success: true, message: data.message || 'تم التحقق من الاتصال بنجاح!' });
        toast({ title: 'نجاح', description: 'تم التحقق من اتصال Google API بنجاح!' });
      } else {
        setGoogleApiTestResult({ success: false, message: data?.error || 'فشل اختبار الاتصال' });
      }
    } catch (error) {
      console.error('Error testing Google API:', error);
      setGoogleApiTestResult({ success: false, message: 'حدث خطأ غير متوقع أثناء اختبار الاتصال' });
    } finally {
      setTestingGoogleApi(false);
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

        {/* Site Favicon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="card-glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold">أيقونة الموقع (Favicon)</h2>
              <p className="text-sm text-muted-foreground">الأيقونة التي تظهر في تبويب المتصفح</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Light Mode Favicon */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <Label className="font-medium">الوضع الفاتح</Label>
              </div>
              {siteFavicon.light_url ? (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={siteFavicon.light_url}
                      alt="Light Favicon"
                      className="w-12 h-12 object-contain bg-white rounded-lg p-1 border"
                    />
                    <button
                      onClick={() => handleRemoveFavicon('light')}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => lightFaviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                  >
                    <Upload className="w-4 h-4 ml-2" />
                    تغيير
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => lightFaviconInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold/50 transition-colors bg-white/50"
                >
                  <Sun className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-muted-foreground text-sm">
                    {uploadingFavicon ? 'جاري الرفع...' : 'رفع أيقونة'}
                  </p>
                </div>
              )}
              <input
                ref={lightFaviconInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFaviconUpload(e, 'light')}
                className="hidden"
              />
            </div>

            {/* Dark Mode Favicon */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-blue-400" />
                <Label className="font-medium">الوضع الداكن</Label>
              </div>
              {siteFavicon.dark_url ? (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={siteFavicon.dark_url}
                      alt="Dark Favicon"
                      className="w-12 h-12 object-contain bg-zinc-800 rounded-lg p-1 border border-zinc-700"
                    />
                    <button
                      onClick={() => handleRemoveFavicon('dark')}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => darkFaviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                  >
                    <Upload className="w-4 h-4 ml-2" />
                    تغيير
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => darkFaviconInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold/50 transition-colors bg-zinc-900/50"
                >
                  <Moon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <p className="text-muted-foreground text-sm">
                    {uploadingFavicon ? 'جاري الرفع...' : 'رفع أيقونة'}
                  </p>
                </div>
              )}
              <input
                ref={darkFaviconInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFaviconUpload(e, 'dark')}
                className="hidden"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            PNG أو ICO - الحجم الموصى به 32×32 أو 64×64 بكسل - أقصى حجم 1MB
          </p>
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

        {/* Google Calendar/Meet API Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Google Calendar/Meet API</h2>
              <p className="text-sm text-muted-foreground">لإنشاء روابط Google Meet تلقائياً للاستشارات</p>
            </div>
            {googleApi.is_configured ? (
              <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">مُفعّل</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">غير مُفعّل</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Detailed Setup Instructions */}
            <div className="p-5 bg-gradient-to-br from-secondary/80 to-secondary/40 rounded-xl border border-border/50">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm">📋</span>
                خطوات إعداد Google Meet API
              </h3>
              
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">إنشاء مشروع في Google Cloud Console</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      اذهب إلى{' '}
                      <a 
                        href="https://console.cloud.google.com/projectcreate" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gold hover:underline inline-flex items-center gap-1"
                      >
                        Google Cloud Console
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      {' '}وأنشئ مشروعاً جديداً (أو اختر مشروعاً موجوداً).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">تفعيل Google Calendar API</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      من القائمة الجانبية، اذهب إلى{' '}
                      <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs">APIs & Services → Library</code>
                      {' '}وابحث عن "Google Calendar API" ثم اضغط "Enable".
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">إنشاء Service Account</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      اذهب إلى{' '}
                      <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs">IAM & Admin → Service Accounts</code>
                      {' '}ثم اضغط "Create Service Account". أدخل اسماً للحساب واضغط "Create and Continue".
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">تحميل مفتاح JSON</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      بعد إنشاء الحساب، اضغط عليه ثم اذهب إلى تبويب "Keys" واضغط{' '}
                      <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs">Add Key → Create new key → JSON</code>.
                      سيتم تحميل ملف JSON - افتحه وانسخ محتواه كاملاً.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    5
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">تفعيل Domain-Wide Delegation (اختياري)</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      إذا كنت تستخدم Google Workspace، فعّل "Enable G Suite Domain-wide Delegation" في إعدادات Service Account.
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-500">الصق المفتاح أدناه</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      الصق محتوى ملف JSON في الحقل أدناه واحفظه. سيتم إنشاء روابط Google Meet تلقائياً عند تأكيد الحجوزات.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">مفتاح حساب الخدمة (Service Account Key JSON)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="h-8"
                >
                  {showApiKey ? (
                    <>
                      <EyeOff className="w-4 h-4 ml-1" />
                      إخفاء
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 ml-1" />
                      إظهار
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={showApiKey ? googleApi.service_account_key : (googleApi.service_account_key ? '••••••••••••••••••••••••••••••••' : '')}
                onChange={(e) => setGoogleApi(prev => ({ ...prev, service_account_key: e.target.value }))}
                placeholder='{"type": "service_account", "project_id": "your-project-id", "private_key_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----...", "client_email": "...@...iam.gserviceaccount.com", ...}'
                className="bg-secondary font-mono text-xs min-h-[140px] resize-y"
                dir="ltr"
                disabled={!showApiKey && googleApi.is_configured}
              />
              <p className="text-xs text-muted-foreground">
                💡 تأكد من نسخ محتوى ملف JSON كاملاً بما في ذلك الأقواس { }
              </p>
            </div>

            {/* Test Result */}
            {googleApiTestResult && (
              <div className={`p-4 rounded-xl flex items-start gap-3 ${
                googleApiTestResult.success 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-destructive/10 border border-destructive/30'
              }`}>
                {googleApiTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${googleApiTestResult.success ? 'text-green-500' : 'text-destructive'}`}>
                  {googleApiTestResult.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={handleTestGoogleApi}
                disabled={testingGoogleApi || !googleApi.service_account_key.trim()}
                variant="outline"
                className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
              >
                {testingGoogleApi ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الاختبار...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 ml-2" />
                    اختبار الاتصال
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveGoogleApi}
                disabled={savingGoogleApi || !googleApi.service_account_key.trim()}
                className="btn-gold"
              >
                <Save className="w-4 h-4 ml-2" />
                {savingGoogleApi ? 'جاري الحفظ...' : googleApi.is_configured ? 'تحديث المفتاح' : 'حفظ وتفعيل'}
              </Button>
              {googleApi.is_configured && (
                <Button
                  variant="outline"
                  onClick={handleRemoveGoogleApi}
                  disabled={savingGoogleApi}
                  className="text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <X className="w-4 h-4 ml-2" />
                  إزالة المفتاح
                </Button>
              )}
            </div>

            {/* Status Message */}
            {googleApi.is_configured ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-500">Google Meet API مُفعّل ✓</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      سيتم إنشاء روابط Google Meet تلقائياً عند تأكيد حجوزات الاستشارة من صفحة إدارة الاستشارات.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-500">Google Meet API غير مُفعّل</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      بدون تفعيل هذا الخيار، ستحتاج لإضافة روابط Google Meet يدوياً لكل استشارة عند التأكيد.
                    </p>
                  </div>
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
