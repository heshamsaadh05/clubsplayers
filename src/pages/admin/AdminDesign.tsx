import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Palette, Layers, Image, Save, Loader2, Eye, EyeOff, GripVertical, Plus, Trash2, Upload } from 'lucide-react';
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
import { useAllPageSections, useUpdatePageSection, useAddPageSection } from '@/hooks/usePageSections';
import { useSliderSettings, useUpdateSliderSettings, useSliderItems, useAddSliderItem, useUpdateSliderItem, useDeleteSliderItem } from '@/hooks/useSliderSettings';

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

  const isLoading = loadingTheme || loadingSections || loadingSliderSettings || loadingSliderItems;

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
            <TabsList className="grid w-full grid-cols-3 max-w-md">
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

            {/* Colors Tab */}
            <TabsContent value="colors">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>نظام الألوان</CardTitle>
                    <Button onClick={saveColors} disabled={updateTheme.isPending || Object.keys(localColors).length === 0}>
                      {updateTheme.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <Save className="w-4 h-4 ml-2" />
                      )}
                      حفظ التغييرات
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {themeColors && Object.entries(themeColors).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label>{colorLabels[key] || key}</Label>
                          <div className="flex gap-3">
                            <Input
                              value={localColors[key] ?? value}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              placeholder="مثال: 45 100% 51%"
                              dir="ltr"
                              className="flex-1"
                            />
                            <div
                              className="w-12 h-10 rounded-lg border border-border"
                              style={{ backgroundColor: `hsl(${localColors[key] ?? value})` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">صيغة HSL: درجة تشبع% إضاءة%</p>
                        </div>
                      ))}
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
                      {sections?.filter(s => s.page_key === 'home').map((section) => (
                        <div
                          key={section.id}
                          className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl"
                        >
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
                      ))}
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
