import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Layers, Image, Save, Loader2, Eye, EyeOff, GripVertical, Plus, Trash2, Upload, RotateCcw, ExternalLink, Moon, Sun, Monitor, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useThemeSettings, useUpdateThemeSettings } from '@/hooks/useThemeSettings';
import { useThemeModeSettings, useUpdateThemeModeSettings, ThemeMode } from '@/hooks/useThemeMode';
import { useAllPageSections, useUpdatePageSection, useAddPageSection } from '@/hooks/usePageSections';
import { useSliderSettings, useUpdateSliderSettings, useSliderItems, useAddSliderItem, useUpdateSliderItem, useDeleteSliderItem } from '@/hooks/useSliderSettings';
import ColorPicker from '@/components/admin/ColorPicker';

const sectionLabels: Record<string, string> = {
  hero: 'قسم البداية (Hero)',
  features: 'قسم المميزات',
  how_it_works: 'كيف يعمل',
  players_slider: 'سلايدر اللاعبين',
  cta: 'دعوة للتسجيل (CTA)',
};

const colorLabels: Record<string, string> = {
  primary: 'اللون الرئيسي',
  primary_foreground: 'نص اللون الرئيسي',
  secondary: 'اللون الثانوي',
  secondary_foreground: 'نص اللون الثانوي',
  background: 'الخلفية',
  foreground: 'النص الأساسي',
  accent: 'لون التمييز',
  accent_foreground: 'نص التمييز',
  muted: 'اللون الخافت',
  muted_foreground: 'النص الخافت',
};

const AdminDesign = () => {
  const [activeTab, setActiveTab] = useState('colors');
  
  // Theme
  const { data: themeColors, isLoading: loadingTheme } = useThemeSettings();
  const updateTheme = useUpdateThemeSettings();
  const [localColors, setLocalColors] = useState<Record<string, string>>({});
  const [previewEnabled, setPreviewEnabled] = useState(true);

  // Theme Mode
  const { data: themeModeSettings, isLoading: loadingThemeMode } = useThemeModeSettings();
  const updateThemeMode = useUpdateThemeModeSettings();

  // Apply live preview
  useEffect(() => {
    if (!previewEnabled || Object.keys(localColors).length === 0) return;

    const root = document.documentElement;
    const cssVarMap: Record<string, string> = {
      primary: '--primary',
      primary_foreground: '--primary-foreground',
      secondary: '--secondary',
      secondary_foreground: '--secondary-foreground',
      background: '--background',
      foreground: '--foreground',
      accent: '--accent',
      accent_foreground: '--accent-foreground',
      muted: '--muted',
      muted_foreground: '--muted-foreground',
    };

    // Apply preview colors
    Object.entries(localColors).forEach(([key, value]) => {
      const cssVar = cssVarMap[key];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value);
      }
    });

    return () => {
      // Reset to original when preview disabled or colors cleared
      if (themeColors) {
        Object.entries(themeColors).forEach(([key, value]) => {
          const cssVar = cssVarMap[key];
          if (cssVar && value) {
            root.style.setProperty(cssVar, value);
          }
        });
      }
    };
  }, [localColors, previewEnabled, themeColors]);

  // Sections
  const { data: sections, isLoading: loadingSections } = useAllPageSections();
  const updateSection = useUpdatePageSection();

  // Slider
  const { data: sliderSettings, isLoading: loadingSliderSettings } = useSliderSettings('players');
  const updateSliderSettings = useUpdateSliderSettings();
  const { data: sliderItems, isLoading: loadingSliderItems } = useSliderItems('players');
  const addSliderItem = useAddSliderItem();
  const updateSliderItem = useUpdateSliderItem();
  const deleteSliderItem = useDeleteSliderItem();

  const handleColorChange = (key: string, value: string) => {
    setLocalColors(prev => ({ ...prev, [key]: value }));
  };

  const resetColor = (key: string) => {
    setLocalColors(prev => {
      const newColors = { ...prev };
      delete newColors[key];
      return newColors;
    });
  };

  const resetAllColors = () => {
    setLocalColors({});
    toast.success('تم إعادة تعيين جميع الألوان');
  };

  const saveColors = async () => {
    if (!themeColors) return;
    
    const newColors = { ...themeColors, ...localColors };
    try {
      await updateTheme.mutateAsync(newColors);
      toast.success('تم حفظ الألوان بنجاح');
      setLocalColors({});
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const toggleSectionVisibility = async (id: string, isVisible: boolean) => {
    try {
      await updateSection.mutateAsync({ id, is_visible: isVisible });
      toast.success('تم تحديث القسم');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const [uploadingHero, setUploadingHero] = useState(false);

  const handleHeroImageUpload = async (sectionId: string, file: File, currentSettings: Record<string, unknown>) => {
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingHero(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('slider-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('slider-images')
        .getPublicUrl(filePath);

      await updateSection.mutateAsync({ 
        id: sectionId, 
        settings: { ...currentSettings, background_image: publicUrl } 
      });
      toast.success('تم رفع صورة الهيرو بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSliderSettingChange = async (key: string, value: number | boolean) => {
    try {
      await updateSliderSettings.mutateAsync({ 
        slider_key: 'players', 
        [key]: value 
      });
      toast.success('تم تحديث الإعدادات');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleAddSliderItem = async () => {
    try {
      await addSliderItem.mutateAsync({
        slider_key: 'players',
        title: 'New Item',
        title_ar: 'عنصر جديد',
        subtitle: '',
        subtitle_ar: '',
        image_url: '',
        link_url: '',
        order_index: (sliderItems?.length || 0) + 1,
        is_active: true,
      });
      toast.success('تم إضافة العنصر');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleUpdateSliderItem = async (id: string, updates: Record<string, unknown>) => {
    try {
      await updateSliderItem.mutateAsync({ id, ...updates });
      toast.success('تم التحديث');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDeleteSliderItem = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await deleteSliderItem.mutateAsync(id);
      toast.success('تم الحذف');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  const handleImageUpload = async (itemId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingItemId(itemId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `slider/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('slider-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('slider-images')
        .getPublicUrl(filePath);

      await updateSliderItem.mutateAsync({ id: itemId, image_url: publicUrl });
      toast.success('تم رفع الصورة بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleThemeModeChange = async (mode: ThemeMode) => {
    try {
      await updateThemeMode.mutateAsync({ mode, autoSwitch: false });
      toast.success('تم تغيير وضع الألوان');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleAutoSwitchChange = async (enabled: boolean) => {
    try {
      await updateThemeMode.mutateAsync({ autoSwitch: enabled });
      toast.success(enabled ? 'تم تفعيل التبديل التلقائي' : 'تم إيقاف التبديل التلقائي');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleTimeChange = async (field: 'lightStart' | 'darkStart', value: string) => {
    try {
      await updateThemeMode.mutateAsync({ [field]: value });
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const isLoading = loadingTheme || loadingSections || loadingSliderSettings || loadingSliderItems || loadingThemeMode;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              تصميم الموقع
            </h1>
            <p className="text-muted-foreground mt-1">
              تحكم في الألوان والسيكشنز والسلايدر
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-xl">
              <TabsTrigger value="theme-mode" className="gap-2">
                <Moon className="w-4 h-4" />
                الوضع
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-2">
                <Palette className="w-4 h-4" />
                الألوان
              </TabsTrigger>
              <TabsTrigger value="sections" className="gap-2">
                <Layers className="w-4 h-4" />
                السيكشنز
              </TabsTrigger>
              <TabsTrigger value="slider" className="gap-2">
                <Image className="w-4 h-4" />
                السلايدر
              </TabsTrigger>
            </TabsList>

            {/* Theme Mode Tab */}
            <TabsContent value="theme-mode">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Mode Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-gold" />
                      وضع الألوان
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      اختر الوضع الافتراضي للموقع أو فعّل التبديل التلقائي
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Mode Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => handleThemeModeChange('light')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          themeModeSettings?.mode === 'light' && !themeModeSettings?.autoSwitch
                            ? 'border-gold bg-gold/10'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 flex items-center justify-center">
                            <Sun className="w-8 h-8 text-yellow-700" />
                          </div>
                          <span className="font-semibold">الوضع الفاتح</span>
                          <span className="text-sm text-muted-foreground">خلفية فاتحة ونصوص داكنة</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleThemeModeChange('dark')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          themeModeSettings?.mode === 'dark' && !themeModeSettings?.autoSwitch
                            ? 'border-gold bg-gold/10'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                            <Moon className="w-8 h-8 text-slate-300" />
                          </div>
                          <span className="font-semibold">الوضع الداكن</span>
                          <span className="text-sm text-muted-foreground">خلفية داكنة ونصوص فاتحة</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleThemeModeChange('system')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          themeModeSettings?.mode === 'system' && !themeModeSettings?.autoSwitch
                            ? 'border-gold bg-gold/10'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <Monitor className="w-8 h-8 text-white" />
                          </div>
                          <span className="font-semibold">تلقائي (حسب النظام)</span>
                          <span className="text-sm text-muted-foreground">يتبع إعدادات جهاز الزائر</span>
                        </div>
                      </button>
                    </div>

                    {/* Auto Switch by Time */}
                    <div className="border-t border-border pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-gold" />
                          <div>
                            <h4 className="font-semibold">التبديل التلقائي حسب الوقت</h4>
                            <p className="text-sm text-muted-foreground">
                              تغيير الوضع تلقائياً في أوقات محددة
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={themeModeSettings?.autoSwitch || false}
                          onCheckedChange={handleAutoSwitchChange}
                        />
                      </div>

                      {themeModeSettings?.autoSwitch && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Sun className="w-4 h-4 text-yellow-500" />
                              بداية الوضع الفاتح
                            </Label>
                            <Input
                              type="time"
                              value={themeModeSettings?.lightStart || '06:00'}
                              onChange={(e) => handleTimeChange('lightStart', e.target.value)}
                              className="max-w-[150px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Moon className="w-4 h-4 text-blue-400" />
                              بداية الوضع الداكن
                            </Label>
                            <Input
                              type="time"
                              value={themeModeSettings?.darkStart || '18:00'}
                              onChange={(e) => handleTimeChange('darkStart', e.target.value)}
                              className="max-w-[150px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
                      <p className="text-sm">
                        <strong>ملاحظة:</strong> يمكن للزوار تغيير الوضع من خلال أيقونة الشمس/القمر في شريط التنقل. الإعداد هنا يحدد الوضع الافتراضي للموقع.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Action Bar */}
                <Card>
                  <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-gold" />
                        نظام الألوان
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        غيّر ألوان الموقع وشاهد المعاينة مباشرة
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Preview Toggle */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg">
                        <Switch
                          checked={previewEnabled}
                          onCheckedChange={setPreviewEnabled}
                          id="preview-toggle"
                        />
                        <Label htmlFor="preview-toggle" className="text-sm cursor-pointer">
                          معاينة حية
                        </Label>
                      </div>
                      
                      {/* Preview Link */}
                      <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        فتح الموقع
                      </a>
                      
                      {/* Reset Button */}
                      {Object.keys(localColors).length > 0 && (
                        <Button variant="outline" onClick={resetAllColors}>
                          <RotateCcw className="w-4 h-4 ml-2" />
                          إلغاء التغييرات
                        </Button>
                      )}
                      
                      {/* Save Button */}
                      <Button 
                        onClick={saveColors} 
                        disabled={updateTheme.isPending || Object.keys(localColors).length === 0}
                        className="btn-gold"
                      >
                        {updateTheme.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        ) : (
                          <Save className="w-4 h-4 ml-2" />
                        )}
                        حفظ التغييرات
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Colors Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Main Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الألوان الرئيسية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {themeColors && ['primary', 'primary_foreground', 'background', 'foreground'].map((key) => (
                        <ColorPicker
                          key={key}
                          label={colorLabels[key] || key}
                          value={localColors[key] ?? themeColors[key as keyof typeof themeColors]}
                          originalValue={themeColors[key as keyof typeof themeColors]}
                          onChange={(value) => handleColorChange(key, value)}
                          onReset={() => resetColor(key)}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Secondary Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الألوان الثانوية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {themeColors && ['secondary', 'secondary_foreground', 'accent', 'accent_foreground'].map((key) => (
                        <ColorPicker
                          key={key}
                          label={colorLabels[key] || key}
                          value={localColors[key] ?? themeColors[key as keyof typeof themeColors]}
                          originalValue={themeColors[key as keyof typeof themeColors]}
                          onChange={(value) => handleColorChange(key, value)}
                          onReset={() => resetColor(key)}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Muted Colors */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">الألوان الخافتة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {themeColors && ['muted', 'muted_foreground'].map((key) => (
                          <ColorPicker
                            key={key}
                            label={colorLabels[key] || key}
                            value={localColors[key] ?? themeColors[key as keyof typeof themeColors]}
                            originalValue={themeColors[key as keyof typeof themeColors]}
                            onChange={(value) => handleColorChange(key, value)}
                            onReset={() => resetColor(key)}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Live Preview Card */}
                <Card className="border-gold/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="w-5 h-5 text-gold" />
                      معاينة المكونات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Primary Button Preview */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">زر رئيسي</p>
                        <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                          زر نموذجي
                        </button>
                      </div>
                      
                      {/* Secondary Button Preview */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">زر ثانوي</p>
                        <button className="w-full px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:opacity-90 transition-opacity">
                          زر ثانوي
                        </button>
                      </div>
                      
                      {/* Accent Preview */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">لون التمييز</p>
                        <div className="w-full px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium text-center">
                          نص بارز
                        </div>
                      </div>
                      
                      {/* Muted Preview */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">لون خافت</p>
                        <div className="w-full px-4 py-2 rounded-lg bg-muted text-muted-foreground font-medium text-center">
                          نص خافت
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Preview */}
                    <div className="mt-6 p-4 bg-card rounded-xl border border-border">
                      <h4 className="font-bold text-foreground mb-2">معاينة البطاقة</h4>
                      <p className="text-muted-foreground text-sm">
                        هذه معاينة لكيفية ظهور البطاقات والنصوص بالألوان الحالية.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>سيكشنز الصفحة الرئيسية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sections?.filter(s => s.page_key === 'home').map((section) => {
                        const sectionSettings = (section.settings || {}) as Record<string, unknown>;
                        const heroImage = sectionSettings.background_image as string | undefined;
                        
                        return (
                          <div
                            key={section.id}
                            className="p-4 bg-secondary/50 rounded-xl space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                                <div>
                                  <p className="font-medium">
                                    {sectionLabels[section.section_key] || section.section_key}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    الترتيب: {section.order_index}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {section.is_visible ? (
                                  <Eye className="w-5 h-5 text-green-500" />
                                ) : (
                                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                                )}
                                <Switch
                                  checked={section.is_visible}
                                  onCheckedChange={(checked) => toggleSectionVisibility(section.id, checked)}
                                />
                              </div>
                            </div>
                            
                            {/* Hero Background Image Upload */}
                            {section.section_key === 'hero' && (
                              <div className="pt-4 border-t border-border space-y-4">
                                {/* Hero Background Image */}
                                <div>
                                  <Label className="mb-3 block">صورة خلفية الهيرو</Label>
                                  <div className="flex items-center gap-4">
                                    {heroImage && (
                                      <img 
                                        src={heroImage} 
                                        alt="Hero background" 
                                        className="w-24 h-16 object-cover rounded-lg border border-border"
                                      />
                                    )}
                                    <label className="cursor-pointer flex-1">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleHeroImageUpload(section.id, file, sectionSettings);
                                        }}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled={uploadingHero}
                                        asChild
                                      >
                                        <span className="flex items-center justify-center gap-2">
                                          {uploadingHero ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Upload className="w-4 h-4" />
                                          )}
                                          {heroImage ? 'تغيير الصورة' : 'رفع صورة'}
                                        </span>
                                      </Button>
                                    </label>
                                  </div>
                                </div>

                                {/* Hero Texts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>الشارة (EN)</Label>
                                    <Input
                                      value={(sectionSettings.badge as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, badge: e.target.value } 
                                      })}
                                      placeholder="The Premier Player Agency"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>الشارة (AR)</Label>
                                    <Input
                                      value={(sectionSettings.badge_ar as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, badge_ar: e.target.value } 
                                      })}
                                      placeholder="وكالة اللاعبين الأولى"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>العنوان - السطر الأول (EN)</Label>
                                    <Input
                                      value={(sectionSettings.title_line1 as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, title_line1: e.target.value } 
                                      })}
                                      placeholder="Discover Your Talent"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>العنوان - السطر الأول (AR)</Label>
                                    <Input
                                      value={(sectionSettings.title_line1_ar as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, title_line1_ar: e.target.value } 
                                      })}
                                      placeholder="اكتشف موهبتك"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>العنوان - السطر الثاني (EN)</Label>
                                    <Input
                                      value={(sectionSettings.title_line2 as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, title_line2: e.target.value } 
                                      })}
                                      placeholder="Achieve Your Football Dream"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>العنوان - السطر الثاني (AR)</Label>
                                    <Input
                                      value={(sectionSettings.title_line2_ar as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, title_line2_ar: e.target.value } 
                                      })}
                                      placeholder="وحقق حلمك الكروي"
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>الوصف (EN)</Label>
                                    <Input
                                      value={(sectionSettings.subtitle as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, subtitle: e.target.value } 
                                      })}
                                      placeholder="We connect emerging football talents..."
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>الوصف (AR)</Label>
                                    <Input
                                      value={(sectionSettings.subtitle_ar as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, subtitle_ar: e.target.value } 
                                      })}
                                      placeholder="نربط بين المواهب الكروية الناشئة..."
                                    />
                                  </div>
                                </div>

                                {/* Hero Stats */}
                                <div className="pt-4 border-t border-border">
                                  <Label className="mb-3 block font-semibold">الإحصائيات</Label>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Players Stat */}
                                    <div className="p-4 bg-background rounded-lg space-y-3">
                                      <p className="text-sm font-medium text-muted-foreground">اللاعبين</p>
                                      <div className="space-y-2">
                                        <Label className="text-xs">القيمة</Label>
                                        <Input
                                          value={(sectionSettings.stat_players_value as string) || '+500'}
                                          onChange={(e) => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, stat_players_value: e.target.value } 
                                          })}
                                          placeholder="+500"
                                          dir="ltr"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs">التسمية (AR)</Label>
                                        <Input
                                          value={(sectionSettings.stat_players_label_ar as string) || ''}
                                          onChange={(e) => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, stat_players_label_ar: e.target.value } 
                                          })}
                                          placeholder="لاعب محترف"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs">التسمية (EN)</Label>
                                        <Input
                                          value={(sectionSettings.stat_players_label as string) || ''}
                                          onChange={(e) => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, stat_players_label: e.target.value } 
                                          })}
                                          placeholder="Pro Players"
                                        />
                                      </div>
                                    </div>

                                    {/* Clubs Stat */}
                                    <div className="p-4 bg-background rounded-lg space-y-3">
                                      <p className="text-sm font-medium text-muted-foreground">الأندية</p>
                                      <div className="space-y-2">
                                        <Label className="text-xs">القيمة</Label>
                                        <Input
                                          value={(sectionSettings.stat_clubs_value as string) || '+120'}
                                          onChange={(e) => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, stat_clubs_value: e.target.value } 
                                          })}
                                          placeholder="+120"
                                          dir="ltr"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs">التسمية (AR)</Label>
                                        <Input
                                          value={(sectionSettings.stat_clubs_label_ar as string) || ''}
                                          onChange={(e) => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, stat_clubs_label_ar: e.target.value } 
                                          })}
                                          placeholder="نادي شريك"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs">التسمية (EN)</Label>
                                        <Input
                                          value={(sectionSettings.stat_clubs_label as string) || ''}
                                          onChange={(e) => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, stat_clubs_label: e.target.value } 
                                          })}
                                          placeholder="Partner Clubs"
                                        />
                                      </div>
                                    </div>

                                    {/* Deals Stat */}
                                    <div className="p-4 bg-background rounded-lg space-y-3">
                                      <p className="text-sm font-medium text-muted-foreground">الصفقات</p>
                                      <div className="space-y-2">
                                        <Label className="text-xs">القيمة</Label>
                                        <Input
                                          value={(sectionSettings.stat_deals_value as string) || '+50'}
                                          onChange={(e) => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, stat_deals_value: e.target.value } 
                                          })}
                                          placeholder="+50"
                                          dir="ltr"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs">التسمية (AR)</Label>
                                        <Input
                                          value={(sectionSettings.stat_deals_label_ar as string) || ''}
                                          onChange={(e) => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, stat_deals_label_ar: e.target.value } 
                                          })}
                                          placeholder="صفقة ناجحة"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs">التسمية (EN)</Label>
                                        <Input
                                          value={(sectionSettings.stat_deals_label as string) || ''}
                                          onChange={(e) => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, stat_deals_label: e.target.value } 
                                          })}
                                          placeholder="Successful Deals"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Slider Tab */}
            <TabsContent value="slider">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Slider Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>إعدادات السلايدر</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <Label>التشغيل التلقائي</Label>
                        <Switch
                          checked={sliderSettings?.auto_play ?? true}
                          onCheckedChange={(checked) => handleSliderSettingChange('auto_play', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>إظهار الأسهم</Label>
                        <Switch
                          checked={sliderSettings?.show_navigation ?? true}
                          onCheckedChange={(checked) => handleSliderSettingChange('show_navigation', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>إظهار النقاط</Label>
                        <Switch
                          checked={sliderSettings?.show_dots ?? true}
                          onCheckedChange={(checked) => handleSliderSettingChange('show_dots', checked)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>سرعة التمرير (ثانية)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[sliderSettings?.auto_play_interval ? sliderSettings.auto_play_interval / 1000 : 5]}
                            min={2}
                            max={10}
                            step={1}
                            onValueCommit={(value) => handleSliderSettingChange('auto_play_interval', value[0] * 1000)}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-8">
                            {sliderSettings?.auto_play_interval ? sliderSettings.auto_play_interval / 1000 : 5}s
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>عدد العناصر الظاهرة</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[sliderSettings?.items_per_view ?? 3]}
                            min={1}
                            max={5}
                            step={1}
                            onValueCommit={(value) => handleSliderSettingChange('items_per_view', value[0])}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-8">
                            {sliderSettings?.items_per_view ?? 3}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Slider Items */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>عناصر السلايدر</CardTitle>
                    <Button onClick={handleAddSliderItem} size="sm">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة عنصر
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sliderItems?.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-secondary/50 rounded-xl space-y-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                              <Switch
                                checked={item.is_active}
                                onCheckedChange={(checked) => handleUpdateSliderItem(item.id, { is_active: checked })}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSliderItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>العنوان (EN)</Label>
                              <Input
                                value={item.title || ''}
                                onChange={(e) => handleUpdateSliderItem(item.id, { title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>العنوان (AR)</Label>
                              <Input
                                value={item.title_ar || ''}
                                onChange={(e) => handleUpdateSliderItem(item.id, { title_ar: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>العنوان الفرعي (EN)</Label>
                              <Input
                                value={item.subtitle || ''}
                                onChange={(e) => handleUpdateSliderItem(item.id, { subtitle: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>العنوان الفرعي (AR)</Label>
                              <Input
                                value={item.subtitle_ar || ''}
                                onChange={(e) => handleUpdateSliderItem(item.id, { subtitle_ar: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>الصورة</Label>
                              <div className="flex items-center gap-4">
                                {item.image_url && (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.title || 'Slider image'} 
                                    className="w-20 h-14 object-cover rounded-lg border border-border"
                                  />
                                )}
                                <div className="flex-1 flex gap-2">
                                  <Input
                                    value={item.image_url || ''}
                                    onChange={(e) => handleUpdateSliderItem(item.id, { image_url: e.target.value })}
                                    placeholder="أو أدخل رابط الصورة"
                                    dir="ltr"
                                    className="flex-1"
                                  />
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(item.id, file);
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      disabled={uploadingItemId === item.id}
                                      asChild
                                    >
                                      <span>
                                        {uploadingItemId === item.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Upload className="w-4 h-4" />
                                        )}
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>رابط الانتقال</Label>
                              <Input
                                value={item.link_url || ''}
                                onChange={(e) => handleUpdateSliderItem(item.id, { link_url: e.target.value })}
                                dir="ltr"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!sliderItems || sliderItems.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          لا توجد عناصر. أضف عنصراً جديداً للبدء.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDesign;
