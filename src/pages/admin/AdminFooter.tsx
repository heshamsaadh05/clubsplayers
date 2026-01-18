import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, 
  Save, Loader2, Image, Upload, X, Palette, MessageCircle
} from "lucide-react";
import { FooterContact, FooterSocial, FooterBranding, FooterStyle } from "@/hooks/useFooterSettings";

// Custom TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Custom Snapchat icon
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-.809-.329-1.224-.72-1.227-1.153-.007-.359.285-.69.735-.838.149-.06.344-.09.509-.09.12 0 .285.015.45.074.36.12.735.269 1.017.299.196.016.389-.045.463-.074-.007-.165-.017-.331-.027-.51l-.004-.06c-.104-1.628-.229-3.654.3-4.847 1.582-3.545 4.939-3.821 5.928-3.821h.012z"/>
  </svg>
);

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
  
  const [social, setSocial] = useState<FooterSocial>({
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    whatsapp: '',
    snapchat: '',
  });
  
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
        .in('key', ['footer_contact', 'footer_social', 'footer_branding', 'footer_style']);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const contactData = settings.find(s => s.key === 'footer_contact');
      const socialData = settings.find(s => s.key === 'footer_social');
      const brandingData = settings.find(s => s.key === 'footer_branding');
      const styleData = settings.find(s => s.key === 'footer_style');
      
      if (contactData) setContact(contactData.value as unknown as FooterContact);
      if (socialData) setSocial({ 
        facebook: '', twitter: '', instagram: '', youtube: '', tiktok: '', whatsapp: '', snapchat: '',
        ...(socialData.value as unknown as FooterSocial)
      });
      if (brandingData) setBranding(brandingData.value as unknown as FooterBranding);
      if (styleData) setStyle(styleData.value as unknown as FooterStyle);
    }
  }, [settings]);

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: FooterContact | FooterSocial | FooterBranding | FooterStyle }) => {
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
    updateSetting.mutate({ key: 'footer_social', value: social });
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
                  روابط التواصل الاجتماعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      فيسبوك
                    </Label>
                    <Input
                      value={social.facebook}
                      onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-sky-500" />
                      تويتر / X
                    </Label>
                    <Input
                      value={social.twitter}
                      onChange={(e) => setSocial({ ...social, twitter: e.target.value })}
                      placeholder="https://twitter.com/yourhandle"
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      إنستغرام
                    </Label>
                    <Input
                      value={social.instagram}
                      onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                      placeholder="https://instagram.com/yourprofile"
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-600" />
                      يوتيوب
                    </Label>
                    <Input
                      value={social.youtube}
                      onChange={(e) => setSocial({ ...social, youtube: e.target.value })}
                      placeholder="https://youtube.com/yourchannel"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <TikTokIcon className="w-4 h-4" />
                      تيك توك
                    </Label>
                    <Input
                      value={social.tiktok}
                      onChange={(e) => setSocial({ ...social, tiktok: e.target.value })}
                      placeholder="https://tiktok.com/@yourhandle"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      واتساب
                    </Label>
                    <Input
                      value={social.whatsapp}
                      onChange={(e) => setSocial({ ...social, whatsapp: e.target.value })}
                      placeholder="https://wa.me/201234567890"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <SnapchatIcon className="w-4 h-4 text-yellow-400" />
                      سناب شات
                    </Label>
                    <Input
                      value={social.snapchat}
                      onChange={(e) => setSocial({ ...social, snapchat: e.target.value })}
                      placeholder="https://snapchat.com/add/yourname"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  اترك الحقل فارغاً لإخفاء الأيقونة من الفوتر
                </p>
                
                <Button onClick={handleSaveSocial} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ
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
