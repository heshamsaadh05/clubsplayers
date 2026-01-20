import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Palette, Layers, Image, Save, Loader2, Eye, EyeOff, GripVertical, Plus, Trash2, Upload, RotateCcw, ExternalLink, Moon, Sun, Monitor, Clock, Bookmark, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useThemeSettings, useUpdateThemeSettings, ThemeColors, useUpdateThemeColorsForMode, DEFAULT_LIGHT_COLORS, DEFAULT_DARK_COLORS } from '@/hooks/useThemeSettings';
import { useThemeModeSettings, useUpdateThemeModeSettings, ThemeMode } from '@/hooks/useThemeMode';
import { useCustomColorTemplates, useAddCustomColorTemplate, useDeleteCustomColorTemplate } from '@/hooks/useCustomColorTemplates';
import { useAllPageSections, useUpdatePageSection, useAddPageSection } from '@/hooks/usePageSections';
import { useSliderSettings, useUpdateSliderSettings, useSliderItems, useAddSliderItem, useUpdateSliderItem, useDeleteSliderItem } from '@/hooks/useSliderSettings';
import ColorPicker from '@/components/admin/ColorPicker';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSliderItem } from '@/components/admin/SortableSliderItem';
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

// Color Templates
const colorTemplates = [
  {
    id: 'gold',
    name: 'ذهبي كلاسيكي',
    preview: ['45 90% 55%', '0 0% 9%', '27 95% 60%'],
    colors: {
      primary: '27 95% 60%',
      primary_foreground: '12 81% 14%',
      secondary: '0 0% 45%',
      secondary_foreground: '0 0% 98%',
      background: '0 0% 9%',
      foreground: '0 0% 98%',
      accent: '20 91% 14%',
      accent_foreground: '43 96% 56%',
      muted: '0 0% 45%',
      muted_foreground: '0 0% 98%',
    }
  },
  {
    id: 'ocean',
    name: 'أزرق محيطي',
    preview: ['200 80% 50%', '0 0% 9%', '180 70% 45%'],
    colors: {
      primary: '200 80% 50%',
      primary_foreground: '200 100% 10%',
      secondary: '210 30% 40%',
      secondary_foreground: '0 0% 98%',
      background: '210 40% 8%',
      foreground: '0 0% 98%',
      accent: '180 70% 20%',
      accent_foreground: '180 70% 75%',
      muted: '210 20% 40%',
      muted_foreground: '0 0% 90%',
    }
  },
  {
    id: 'emerald',
    name: 'أخضر زمردي',
    preview: ['160 84% 39%', '0 0% 9%', '140 70% 35%'],
    colors: {
      primary: '160 84% 39%',
      primary_foreground: '160 100% 10%',
      secondary: '150 30% 35%',
      secondary_foreground: '0 0% 98%',
      background: '160 30% 8%',
      foreground: '0 0% 98%',
      accent: '140 70% 20%',
      accent_foreground: '140 70% 75%',
      muted: '150 20% 40%',
      muted_foreground: '0 0% 90%',
    }
  },
  {
    id: 'royal',
    name: 'بنفسجي ملكي',
    preview: ['270 70% 55%', '0 0% 9%', '280 80% 45%'],
    colors: {
      primary: '270 70% 55%',
      primary_foreground: '270 100% 95%',
      secondary: '280 30% 40%',
      secondary_foreground: '0 0% 98%',
      background: '270 30% 8%',
      foreground: '0 0% 98%',
      accent: '280 60% 20%',
      accent_foreground: '280 70% 75%',
      muted: '270 20% 40%',
      muted_foreground: '0 0% 90%',
    }
  },
  {
    id: 'crimson',
    name: 'أحمر قرمزي',
    preview: ['0 72% 50%', '0 0% 9%', '350 80% 45%'],
    colors: {
      primary: '0 72% 50%',
      primary_foreground: '0 100% 95%',
      secondary: '0 30% 40%',
      secondary_foreground: '0 0% 98%',
      background: '0 20% 8%',
      foreground: '0 0% 98%',
      accent: '350 60% 20%',
      accent_foreground: '350 70% 75%',
      muted: '0 20% 40%',
      muted_foreground: '0 0% 90%',
    }
  },
  {
    id: 'sunset',
    name: 'غروب الشمس',
    preview: ['25 95% 53%', '0 0% 9%', '15 90% 50%'],
    colors: {
      primary: '25 95% 53%',
      primary_foreground: '25 100% 10%',
      secondary: '35 40% 40%',
      secondary_foreground: '0 0% 98%',
      background: '20 30% 8%',
      foreground: '0 0% 98%',
      accent: '15 70% 20%',
      accent_foreground: '30 80% 70%',
      muted: '25 20% 40%',
      muted_foreground: '0 0% 90%',
    }
  },
  {
    id: 'midnight',
    name: 'منتصف الليل',
    preview: ['220 60% 50%', '220 40% 6%', '240 50% 45%'],
    colors: {
      primary: '220 60% 50%',
      primary_foreground: '220 100% 95%',
      secondary: '230 30% 35%',
      secondary_foreground: '0 0% 98%',
      background: '220 40% 6%',
      foreground: '220 20% 95%',
      accent: '240 50% 20%',
      accent_foreground: '220 60% 75%',
      muted: '220 20% 35%',
      muted_foreground: '220 20% 80%',
    }
  },
  {
    id: 'light-minimal',
    name: 'فاتح بسيط',
    preview: ['220 14% 40%', '0 0% 98%', '220 13% 91%'],
    colors: {
      primary: '220 14% 40%',
      primary_foreground: '0 0% 98%',
      secondary: '220 13% 91%',
      secondary_foreground: '220 14% 20%',
      background: '0 0% 98%',
      foreground: '220 14% 10%',
      accent: '220 13% 95%',
      accent_foreground: '220 14% 30%',
      muted: '220 13% 91%',
      muted_foreground: '220 14% 50%',
    }
  },
];

const AdminDesign = () => {
  const [activeTab, setActiveTab] = useState('colors');
  const [editingColorMode, setEditingColorMode] = useState<'light' | 'dark'>('dark');
  
  // Theme
  const { data: themeColors, isLoading: loadingTheme } = useThemeSettings();
  const updateTheme = useUpdateThemeSettings();
  const updateThemeForMode = useUpdateThemeColorsForMode();
  const [localColors, setLocalColors] = useState<Record<string, string>>({});
  const [previewEnabled, setPreviewEnabled] = useState(true);

  // Theme Mode
  const { data: themeModeSettings, isLoading: loadingThemeMode } = useThemeModeSettings();
  const updateThemeMode = useUpdateThemeModeSettings();

  // Custom Templates
  const { data: customTemplates, isLoading: loadingCustomTemplates } = useCustomColorTemplates();
  const addCustomTemplate = useAddCustomColorTemplate();
  const deleteCustomTemplate = useDeleteCustomColorTemplate();
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Get current mode colors for editing
  const currentModeColors = themeColors?.[editingColorMode];

  // Apply live preview
  useEffect(() => {
    if (!previewEnabled || Object.keys(localColors).length === 0 || !currentModeColors) return;

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

    // Check if we're in the editing mode to apply preview
    const isDarkMode = root.classList.contains('dark');
    const currentThemeMode = isDarkMode ? 'dark' : 'light';
    
    // Only apply preview if we're editing the current active theme
    if (currentThemeMode === editingColorMode) {
      Object.entries(localColors).forEach(([key, value]) => {
        const cssVar = cssVarMap[key];
        if (cssVar && value) {
          root.style.setProperty(cssVar, value);
        }
      });
    }

    return () => {
      // Reset to original when preview disabled or colors cleared
      if (currentModeColors && currentThemeMode === editingColorMode) {
        Object.entries(currentModeColors).forEach(([key, value]) => {
          const cssVar = cssVarMap[key];
          if (cssVar && value) {
            root.style.setProperty(cssVar, value);
          }
        });
      }
    };
  }, [localColors, previewEnabled, currentModeColors, editingColorMode]);

  // Reset local colors when switching editing mode
  useEffect(() => {
    setLocalColors({});
  }, [editingColorMode]);

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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for slider items reordering
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !sliderItems) return;

    const oldIndex = sliderItems.findIndex((item) => item.id === active.id);
    const newIndex = sliderItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedItems = arrayMove(sliderItems, oldIndex, newIndex);

    // Update order_index for each item
    try {
      const updatePromises = reorderedItems.map((item, index) =>
        updateSliderItem.mutateAsync({ id: item.id, order_index: index + 1 })
      );
      await Promise.all(updatePromises);
      toast.success('تم إعادة ترتيب العناصر');
    } catch {
      toast.error('حدث خطأ أثناء إعادة الترتيب');
    }
  }, [sliderItems, updateSliderItem]);

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

  const resetToDefaults = async () => {
    const defaultColors = editingColorMode === 'dark' ? DEFAULT_DARK_COLORS : DEFAULT_LIGHT_COLORS;
    const modeName = editingColorMode === 'dark' ? 'الداكن' : 'الفاتح';
    
    if (!confirm(`هل أنت متأكد من إعادة ألوان الوضع ${modeName} للقيم الافتراضية؟`)) return;
    
    try {
      await updateThemeForMode.mutateAsync({ mode: editingColorMode, colors: defaultColors });
      setLocalColors({});
      toast.success(`تم إعادة ألوان الوضع ${modeName} للقيم الافتراضية`);
    } catch {
      toast.error('حدث خطأ أثناء إعادة التعيين');
    }
  };

  const applyTemplate = (template: { name: string; colors: Record<string, string> }) => {
    setLocalColors(template.colors);
    toast.success(`تم تطبيق قالب "${template.name}"`);
  };

  const applyCustomTemplate = (template: { name: string; colors: Record<string, string> }) => {
    setLocalColors(template.colors);
    toast.success(`تم تطبيق قالب "${template.name}"`);
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }

    // Get current colors for the editing mode
    const baseColors = currentModeColors;
    const colorsToSave = Object.keys(localColors).length > 0 
      ? { ...baseColors, ...localColors }
      : baseColors;

    if (!colorsToSave) {
      toast.error('لا توجد ألوان للحفظ');
      return;
    }

    try {
      await addCustomTemplate.mutateAsync({
        name: newTemplateName.trim(),
        colors: colorsToSave as unknown as Record<string, string>,
      });
      toast.success('تم حفظ القالب بنجاح');
      setSaveTemplateDialogOpen(false);
      setNewTemplateName('');
    } catch {
      toast.error('حدث خطأ أثناء حفظ القالب');
    }
  };

  const handleDeleteCustomTemplate = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف قالب "${name}"؟`)) return;
    
    try {
      await deleteCustomTemplate.mutateAsync(id);
      toast.success('تم حذف القالب');
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const saveColors = async () => {
    if (!currentModeColors) return;
    
    const newColors = { ...currentModeColors, ...localColors } as ThemeColors;
    try {
      await updateThemeForMode.mutateAsync({ mode: editingColorMode, colors: newColors });
      toast.success(`تم حفظ ألوان الوضع ${editingColorMode === 'dark' ? 'الداكن' : 'الفاتح'} بنجاح`);
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
  const [uploadingHeroVideo, setUploadingHeroVideo] = useState(false);

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

  const handleHeroVideoUpload = async (sectionId: string, file: File, currentSettings: Record<string, unknown>) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('يرجى اختيار ملف فيديو بصيغة MP4, WebM, أو OGG');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('حجم الفيديو يجب أن يكون أقل من 50 ميجابايت');
      return;
    }

    setUploadingHeroVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-video-${Date.now()}.${fileExt}`;
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
        settings: { ...currentSettings, background_video: publicUrl } 
      });
      toast.success('تم رفع فيديو الهيرو بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء رفع الفيديو');
    } finally {
      setUploadingHeroVideo(false);
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

  const isLoading = loadingTheme || loadingSections || loadingSliderSettings || loadingSliderItems || loadingThemeMode || loadingCustomTemplates;

  return (
    <AdminLayout>
      {/* Save Template Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حفظ الألوان كقالب جديد</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name">اسم القالب</Label>
            <Input
              id="template-name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="مثال: قالب الشركة"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveAsTemplate}
              disabled={addCustomTemplate.isPending}
              className="btn-gold"
            >
              {addCustomTemplate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              حفظ القالب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {/* Mode Selector */}
                <Card className="border-gold/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-gold" />
                      اختر الوضع للتعديل
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      يمكنك تعديل ألوان كل وضع بشكل منفصل
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                      <button
                        onClick={() => setEditingColorMode('light')}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          editingColorMode === 'light'
                            ? 'border-gold bg-gold/10'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 flex items-center justify-center">
                          <Sun className="w-5 h-5 text-yellow-700" />
                        </div>
                        <div className="text-right">
                          <span className="font-semibold block">الوضع الفاتح</span>
                          <span className="text-xs text-muted-foreground">Light Mode</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setEditingColorMode('dark')}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          editingColorMode === 'dark'
                            ? 'border-gold bg-gold/10'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                          <Moon className="w-5 h-5 text-slate-300" />
                        </div>
                        <div className="text-right">
                          <span className="font-semibold block">الوضع الداكن</span>
                          <span className="text-xs text-muted-foreground">Dark Mode</span>
                        </div>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Bar */}
                <Card>
                  <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {editingColorMode === 'dark' ? (
                          <Moon className="w-5 h-5 text-gold" />
                        ) : (
                          <Sun className="w-5 h-5 text-gold" />
                        )}
                        ألوان الوضع {editingColorMode === 'dark' ? 'الداكن' : 'الفاتح'}
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
                      
                      {/* Reset to Defaults Button */}
                      <Button 
                        variant="outline" 
                        onClick={resetToDefaults}
                        disabled={updateThemeForMode.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <RotateCcw className="w-4 h-4 ml-2" />
                        إعادة للافتراضي
                      </Button>

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
                        disabled={updateThemeForMode.isPending || Object.keys(localColors).length === 0}
                        className="btn-gold"
                      >
                        {updateThemeForMode.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        ) : (
                          <Save className="w-4 h-4 ml-2" />
                        )}
                        حفظ ألوان {editingColorMode === 'dark' ? 'الداكن' : 'الفاتح'}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Color Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-gold" />
                      قوالب ألوان جاهزة
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      اختر قالب ألوان جاهز بنقرة واحدة
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                      {colorTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className="group relative p-3 rounded-xl border-2 border-border hover:border-gold/50 transition-all hover:scale-105"
                        >
                          <div className="flex flex-col items-center gap-2">
                            {/* Color Preview Circles */}
                            <div className="flex gap-1">
                              {template.preview.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                                  style={{ backgroundColor: `hsl(${color})` }}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-medium text-center">{template.name}</span>
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gold/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Templates */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-gold" />
                        قوالبي المخصصة
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        قوالب ألوان قمت بحفظها
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSaveTemplateDialogOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      حفظ الألوان الحالية كقالب
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {customTemplates && customTemplates.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {customTemplates.map((template) => {
                          const colors = template.colors as Record<string, string>;
                          const previewColors = [
                            colors.primary || '0 0% 50%',
                            colors.background || '0 0% 10%',
                            colors.accent || '0 0% 30%',
                          ];
                          return (
                            <div
                              key={template.id}
                              className="group relative p-3 rounded-xl border-2 border-border hover:border-gold/50 transition-all"
                            >
                              <button
                                onClick={() => applyCustomTemplate({ name: template.name, colors })}
                                className="w-full flex flex-col items-center gap-2"
                              >
                                {/* Color Preview Circles */}
                                <div className="flex gap-1">
                                  {previewColors.map((color, i) => (
                                    <div
                                      key={i}
                                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                                      style={{ backgroundColor: `hsl(${color})` }}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-medium text-center">{template.name}</span>
                              </button>
                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteCustomTemplate(template.id, template.name)}
                                className="absolute top-1 left-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لم تقم بحفظ أي قوالب مخصصة بعد</p>
                        <p className="text-sm mt-1">اضغط على "حفظ الألوان الحالية كقالب" لإنشاء قالب جديد</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Colors Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Main Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الألوان الرئيسية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {currentModeColors && ['primary', 'primary_foreground', 'background', 'foreground'].map((key) => (
                        <ColorPicker
                          key={`${editingColorMode}-${key}`}
                          label={colorLabels[key] || key}
                          value={localColors[key] ?? currentModeColors[key as keyof ThemeColors]}
                          originalValue={currentModeColors[key as keyof ThemeColors]}
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
                      {currentModeColors && ['secondary', 'secondary_foreground', 'accent', 'accent_foreground'].map((key) => (
                        <ColorPicker
                          key={`${editingColorMode}-${key}`}
                          label={colorLabels[key] || key}
                          value={localColors[key] ?? currentModeColors[key as keyof ThemeColors]}
                          originalValue={currentModeColors[key as keyof ThemeColors]}
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
                        {currentModeColors && ['muted', 'muted_foreground'].map((key) => (
                          <ColorPicker
                            key={`${editingColorMode}-${key}`}
                            label={colorLabels[key] || key}
                            value={localColors[key] ?? currentModeColors[key as keyof ThemeColors]}
                            originalValue={currentModeColors[key as keyof ThemeColors]}
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
                        const heroVideo = sectionSettings.background_video as string | undefined;
                        
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
                            
                            {/* Hero Background Image & Video Upload */}
                            {section.section_key === 'hero' && (
                              <div className="pt-4 border-t border-border space-y-4">
                                {/* Hero Background Image */}
                                <div>
                                  <Label className="mb-3 block">صورة خلفية الهيرو (تظهر عند عدم وجود فيديو)</Label>
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

                                {/* Hero Background Video */}
                                <div className="pt-4 border-t border-border">
                                  <Label className="mb-3 block font-semibold">فيديو خلفية الهيرو (اختياري - يظهر بدل الصورة)</Label>
                                  <p className="text-sm text-muted-foreground mb-3">يمكنك رفع فيديو أو إدخال رابط مباشر. الفيديو سيعمل تلقائياً بدون صوت.</p>
                                  
                                  <div className="space-y-3">
                                    {/* Video Preview */}
                                    {heroVideo && (
                                      <div className="relative">
                                        <video 
                                          src={heroVideo} 
                                          className="w-full max-w-md h-32 object-cover rounded-lg border border-border"
                                          muted
                                          loop
                                          autoPlay
                                          playsInline
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          className="absolute top-2 right-2"
                                          onClick={() => updateSection.mutateAsync({ 
                                            id: section.id, 
                                            settings: { ...sectionSettings, background_video: '' } 
                                          })}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {/* Upload Video */}
                                    <div className="flex items-center gap-4">
                                      <label className="cursor-pointer flex-1">
                                        <input
                                          type="file"
                                          accept="video/mp4,video/webm,video/ogg"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleHeroVideoUpload(section.id, file, sectionSettings);
                                          }}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="w-full"
                                          disabled={uploadingHeroVideo}
                                          asChild
                                        >
                                          <span className="flex items-center justify-center gap-2">
                                            {uploadingHeroVideo ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                              <Upload className="w-4 h-4" />
                                            )}
                                            {heroVideo ? 'تغيير الفيديو' : 'رفع فيديو'}
                                          </span>
                                        </Button>
                                      </label>
                                    </div>

                                    {/* Video URL Input */}
                                    <div className="space-y-2">
                                      <Label className="text-sm">أو أدخل رابط الفيديو مباشرة (يوتيوب، فيميو، أو رابط مباشر)</Label>
                                      <Input
                                        value={heroVideo || ''}
                                        onChange={(e) => updateSection.mutateAsync({ 
                                          id: section.id, 
                                          settings: { ...sectionSettings, background_video: e.target.value } 
                                        })}
                                        placeholder="https://www.youtube.com/watch?v=... أو https://vimeo.com/..."
                                        dir="ltr"
                                      />
                                      <div className="text-xs text-muted-foreground space-y-1">
                                        <p>✓ روابط يوتيوب: youtube.com/watch?v=... أو youtu.be/...</p>
                                        <p>✓ روابط فيميو: vimeo.com/...</p>
                                        <p>✓ فيديو مباشر: MP4, WebM, OGG (الحد الأقصى للرفع: 50 ميجابايت)</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Media Opacity Control */}
                                <div className="pt-4 border-t border-border">
                                  <Label className="mb-3 block font-semibold">شفافية الخلفية (الصورة/الفيديو)</Label>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                      <Slider
                                        value={[(sectionSettings.media_opacity as number) ?? 40]}
                                        onValueChange={(value) => updateSection.mutateAsync({ 
                                          id: section.id, 
                                          settings: { ...sectionSettings, media_opacity: value[0] } 
                                        })}
                                        min={10}
                                        max={100}
                                        step={5}
                                        className="flex-1"
                                      />
                                      <span className="text-sm font-medium w-12 text-center">
                                        {(sectionSettings.media_opacity as number) ?? 40}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">قيمة أقل = خلفية أغمق، قيمة أعلى = خلفية أوضح</p>
                                  </div>
                                </div>

                                {/* Video Playback Speed */}
                                <div className="pt-4 border-t border-border">
                                  <Label className="mb-3 block font-semibold">سرعة تشغيل الفيديو (للفيديو المباشر فقط)</Label>
                                  <div className="flex items-center gap-3">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                                      <Button
                                        key={speed}
                                        type="button"
                                        variant={(sectionSettings.video_speed as number) === speed || (!sectionSettings.video_speed && speed === 1) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => updateSection.mutateAsync({ 
                                          id: section.id, 
                                          settings: { ...sectionSettings, video_speed: speed } 
                                        })}
                                      >
                                        {speed}x
                                      </Button>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">ملاحظة: التحكم في السرعة يعمل فقط مع الفيديو المرفوع مباشرة (MP4, WebM, OGG) وليس مع روابط يوتيوب/فيميو</p>
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

                            {/* Players Slider Section Settings */}
                            {section.section_key === 'players_slider' && (
                              <div className="pt-4 border-t border-border space-y-4">
                                <Label className="mb-3 block font-semibold text-gold">نصوص سيكشن سلايدر اللاعبين</Label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>الشارة (EN)</Label>
                                    <Input
                                      value={(sectionSettings.badge as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, badge: e.target.value } 
                                      })}
                                      placeholder="Our Stars"
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
                                      placeholder="نجومنا"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>العنوان - الجزء الأول (EN)</Label>
                                    <Input
                                      value={(sectionSettings.title_part1 as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, title_part1: e.target.value } 
                                      })}
                                      placeholder="Featured"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>العنوان - الجزء الأول (AR)</Label>
                                    <Input
                                      value={(sectionSettings.title_part1_ar as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, title_part1_ar: e.target.value } 
                                      })}
                                      placeholder="لاعبون"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>العنوان - الجزء الثاني (EN)</Label>
                                    <Input
                                      value={(sectionSettings.title_part2 as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, title_part2: e.target.value } 
                                      })}
                                      placeholder="Players"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>العنوان - الجزء الثاني (AR)</Label>
                                    <Input
                                      value={(sectionSettings.title_part2_ar as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, title_part2_ar: e.target.value } 
                                      })}
                                      placeholder="مميزون"
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>الوصف (EN)</Label>
                                    <Input
                                      value={(sectionSettings.description as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, description: e.target.value } 
                                      })}
                                      placeholder="Meet the best registered players"
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>الوصف (AR)</Label>
                                    <Input
                                      value={(sectionSettings.description_ar as string) || ''}
                                      onChange={(e) => updateSection.mutateAsync({ 
                                        id: section.id, 
                                        settings: { ...sectionSettings, description_ar: e.target.value } 
                                      })}
                                      placeholder="تعرف على نخبة من أفضل اللاعبين المسجلين لدينا"
                                    />
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
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={sliderItems?.map(item => item.id) || []}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {sliderItems?.map((item) => (
                            <SortableSliderItem
                              key={item.id}
                              item={item}
                              onUpdate={handleUpdateSliderItem}
                              onDelete={handleDeleteSliderItem}
                              onImageUpload={handleImageUpload}
                              isUploading={uploadingItemId === item.id}
                            />
                          ))}
                          {(!sliderItems || sliderItems.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">
                              لا توجد عناصر. أضف عنصراً جديداً للبدء.
                            </p>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
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
