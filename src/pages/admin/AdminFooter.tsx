import { useState, useEffect } from "react";
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
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Save, Loader2, Image } from "lucide-react";
import { FooterContact, FooterSocial, FooterBranding } from "@/hooks/useFooterSettings";

const AdminFooter = () => {
  const queryClient = useQueryClient();
  
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
  });
  
  const [branding, setBranding] = useState<FooterBranding>({
    logo_url: '',
    description: '',
    description_en: '',
  });

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['footer-all-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['footer_contact', 'footer_social', 'footer_branding']);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const contactData = settings.find(s => s.key === 'footer_contact');
      const socialData = settings.find(s => s.key === 'footer_social');
      const brandingData = settings.find(s => s.key === 'footer_branding');
      
      if (contactData) setContact(contactData.value as unknown as FooterContact);
      if (socialData) setSocial(socialData.value as unknown as FooterSocial);
      if (brandingData) setBranding(brandingData.value as unknown as FooterBranding);
    }
  }, [settings]);

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: FooterContact | FooterSocial | FooterBranding }) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-contact'] });
      queryClient.invalidateQueries({ queryKey: ['footer-social'] });
      queryClient.invalidateQueries({ queryKey: ['footer-branding'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => {
      toast.error('فشل في حفظ الإعدادات');
    },
  });

  const handleSaveContact = () => {
    updateSetting.mutate({ key: 'footer_contact', value: contact });
  };

  const handleSaveSocial = () => {
    updateSetting.mutate({ key: 'footer_social', value: social });
  };

  const handleSaveBranding = () => {
    updateSetting.mutate({ key: 'footer_branding', value: branding });
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="branding">العلامة التجارية</TabsTrigger>
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
                  <Label>رابط اللوجو (اختياري)</Label>
                  <Input
                    value={branding.logo_url}
                    onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    dir="ltr"
                  />
                  <p className="text-sm text-muted-foreground">اتركه فارغاً لاستخدام اسم الموقع</p>
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
