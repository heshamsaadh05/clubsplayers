import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Facebook, Mail, Phone, MapPin, 
  Save, Loader2, Image, Upload, X, Palette, GripVertical
} from "lucide-react";
import { FooterContact, FooterBranding, FooterStyle, SocialPlatform, defaultPlatforms, FooterSocialAdvanced } from "@/hooks/useFooterSettings";
import { SocialPlatformItem } from "@/components/admin/SocialPlatformItem";
import { AddCustomPlatformDialog } from "@/components/admin/AddCustomPlatformDialog";

const AdminFooter = () => {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [contact, setContact] = useState<FooterContact>({
    phone: '',
    email: '',
    location: '',
    location_en: '',
  });
  
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(defaultPlatforms);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const [branding, setBranding] = useState<FooterBranding>({
    logo_url: '',
    description: '',
    description_en: '',
  });

  const [style, setStyle] = useState<FooterStyle>({
    background_color: '#1a1a1a',
    text_color: '#ffffff',
    accent_color: '#d4af37',
    border_color: '#333333',
  });

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['footer-all-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['footer_contact', 'footer_social_advanced', 'footer_branding', 'footer_style']);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const contactData = settings.find(s => s.key === 'footer_contact');
      const socialAdvancedData = settings.find(s => s.key === 'footer_social_advanced');
      const brandingData = settings.find(s => s.key === 'footer_branding');
      const styleData = settings.find(s => s.key === 'footer_style');
      
      if (contactData) setContact(contactData.value as unknown as FooterContact);
      if (socialAdvancedData) {
        const advancedValue = socialAdvancedData.value as unknown as FooterSocialAdvanced;
        if (advancedValue?.platforms) {
          setPlatforms(advancedValue.platforms);
        }
      }
      if (brandingData) setBranding(brandingData.value as unknown as FooterBranding);
      if (styleData) setStyle(styleData.value as unknown as FooterStyle);
    }
  }, [settings]);

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: FooterContact | FooterSocialAdvanced | FooterBranding | FooterStyle }) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          key, 
          value: JSON.parse(JSON.stringify(value)), 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-contact'] });
      queryClient.invalidateQueries({ queryKey: ['footer-social'] });
      queryClient.invalidateQueries({ queryKey: ['footer-social-advanced'] });
      queryClient.invalidateQueries({ queryKey: ['footer-branding'] });
      queryClient.invalidateQueries({ queryKey: ['footer-style'] });
      queryClient.invalidateQueries({ queryKey: ['footer-all-settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => {
      toast.error('فشل في حفظ الإعدادات');
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `footer-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('slider-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('slider-images')
        .getPublicUrl(fileName);

      setBranding({ ...branding, logo_url: publicUrl });
      toast.success('تم رفع اللوجو بنجاح');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('فشل في رفع اللوجو');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setBranding({ ...branding, logo_url: '' });
  };

  const handleSaveContact = () => {
    updateSetting.mutate({ key: 'footer_contact', value: contact });
  };

  const handleSaveSocial = () => {
    // Update order based on current position
    const orderedPlatforms = platforms.map((p, index) => ({ ...p, order: index }));
    updateSetting.mutate({ key: 'footer_social_advanced', value: { platforms: orderedPlatforms } });
  };

  const handlePlatformUpdate = useCallback((updatedPlatform: SocialPlatform) => {
    setPlatforms(prev => 
      prev.map(p => p.id === updatedPlatform.id ? updatedPlatform : p)
    );
  }, []);

  const handleDeletePlatform = useCallback((id: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleAddPlatform = useCallback((newPlatform: SocialPlatform) => {
    setPlatforms(prev => [...prev, newPlatform]);
  }, []);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPlatforms = [...platforms];
    const draggedItem = newPlatforms[draggedIndex];
    newPlatforms.splice(draggedIndex, 1);
    newPlatforms.splice(index, 0, draggedItem);
    setPlatforms(newPlatforms);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveBranding = () => {
    updateSetting.mutate({ key: 'footer_branding', value: branding });
  };

  const handleSaveStyle = () => {
    updateSetting.mutate({ key: 'footer_style', value: style });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إعدادات الفوتر</h1>
          <p className="text-muted-foreground">تحكم في جميع عناصر الفوتر</p>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="branding">العلامة التجارية</TabsTrigger>
            <TabsTrigger value="style">الألوان</TabsTrigger>
            <TabsTrigger value="contact">بيانات التواصل</TabsTrigger>
            <TabsTrigger value="social">التواصل الاجتماعي</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  العلامة التجارية والوصف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>اللوجو</Label>
                  <div className="flex items-center gap-4">
                    {branding.logo_url ? (
                      <div className="relative">
                        <img 
                          src={branding.logo_url} 
                          alt="Logo" 
                          className="h-16 max-w-[200px] object-contain bg-secondary rounded p-2"
                        />
                        <button
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-32 bg-secondary rounded flex items-center justify-center text-muted-foreground">
                        <Image className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        ) : (
                          <Upload className="w-4 h-4 ml-2" />
                        )}
                        رفع صورة
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">أو أدخل رابط الصورة مباشرة</p>
                  <Input
                    value={branding.logo_url}
                    onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    dir="ltr"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>الوصف (عربي)</Label>
                  <Textarea
                    value={branding.description}
                    onChange={(e) => setBranding({ ...branding, description: e.target.value })}
                    placeholder="وصف الموقع بالعربية"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>الوصف (إنجليزي)</Label>
                  <Textarea
                    value={branding.description_en}
                    onChange={(e) => setBranding({ ...branding, description_en: e.target.value })}
                    placeholder="Site description in English"
                    dir="ltr"
                    rows={3}
                  />
                </div>
                
                <Button onClick={handleSaveBranding} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  ألوان الفوتر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>لون الخلفية</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={style.background_color}
                        onChange={(e) => setStyle({ ...style, background_color: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={style.background_color}
                        onChange={(e) => setStyle({ ...style, background_color: e.target.value })}
                        placeholder="#1a1a1a"
                        dir="ltr"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>لون النص</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={style.text_color}
                        onChange={(e) => setStyle({ ...style, text_color: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={style.text_color}
                        onChange={(e) => setStyle({ ...style, text_color: e.target.value })}
                        placeholder="#ffffff"
                        dir="ltr"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>لون التمييز (الروابط والأيقونات)</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={style.accent_color}
                        onChange={(e) => setStyle({ ...style, accent_color: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={style.accent_color}
                        onChange={(e) => setStyle({ ...style, accent_color: e.target.value })}
                        placeholder="#d4af37"
                        dir="ltr"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>لون الحدود</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={style.border_color}
                        onChange={(e) => setStyle({ ...style, border_color: e.target.value })}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={style.border_color}
                        onChange={(e) => setStyle({ ...style, border_color: e.target.value })}
                        placeholder="#333333"
                        dir="ltr"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6">
                  <Label className="mb-2 block">معاينة</Label>
                  <div 
                    className="p-6 rounded-lg"
                    style={{ 
                      backgroundColor: style.background_color,
                      borderColor: style.border_color,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}
                  >
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ color: style.accent_color }}
                    >
                      ستارز إيجنسي
                    </h3>
                    <p style={{ color: style.text_color }}>
                      هذا نص تجريبي لمعاينة الألوان
                    </p>
                    <a 
                      href="#" 
                      className="mt-2 inline-block"
                      style={{ color: style.accent_color }}
                    >
                      رابط تجريبي
                    </a>
                  </div>
                </div>
                
                <Button onClick={handleSaveStyle} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  بيانات التواصل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف
                    </Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      placeholder="+20 123 456 7890"
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      placeholder="info@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      الموقع (عربي)
                    </Label>
                    <Input
                      value={contact.location}
                      onChange={(e) => setContact({ ...contact, location: e.target.value })}
                      placeholder="القاهرة، مصر"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      الموقع (إنجليزي)
                    </Label>
                    <Input
                      value={contact.location_en}
                      onChange={(e) => setContact({ ...contact, location_en: e.target.value })}
                      placeholder="Cairo, Egypt"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <Button onClick={handleSaveContact} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="w-5 h-5" />
                  منصات التواصل الاجتماعي
                </CardTitle>
                <CardDescription>
                  اسحب لإعادة ترتيب الأيقونات • استخدم المفتاح للتفعيل/التعطيل • أضف منصات مخصصة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platforms List */}
                <div className="space-y-2">
                  {platforms.map((platform, index) => (
                    <div
                      key={platform.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <SocialPlatformItem
                        platform={platform}
                        onUpdate={handlePlatformUpdate}
                        onDelete={platform.icon_type === 'custom' ? handleDeletePlatform : undefined}
                        isDragging={draggedIndex === index}
                        dragHandleProps={{
                          onMouseDown: (e) => e.stopPropagation(),
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Add Custom Platform */}
                <div className="pt-4 border-t">
                  <AddCustomPlatformDialog
                    onAdd={handleAddPlatform}
                    existingPlatformsCount={platforms.length}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  💡 المنصات المعطلة لن تظهر في الفوتر حتى لو كان لها رابط
                </p>
                
                <Button onClick={handleSaveSocial} disabled={updateSetting.isPending} className="w-full">
                  {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ الإعدادات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminFooter;
