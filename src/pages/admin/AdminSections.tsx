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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Save, Loader2, Star, Trophy, Users, Shield, Globe, Zap, Award, TrendingUp,
  UserPlus, FileCheck, Search, Handshake, User, Building2, Plus, Trash2, Upload
} from "lucide-react";

// Icon mapping
const iconOptions = [
  { name: 'Globe', icon: Globe },
  { name: 'Shield', icon: Shield },
  { name: 'Zap', icon: Zap },
  { name: 'Award', icon: Award },
  { name: 'Users', icon: Users },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Star', icon: Star },
  { name: 'Trophy', icon: Trophy },
  { name: 'UserPlus', icon: UserPlus },
  { name: 'FileCheck', icon: FileCheck },
  { name: 'Search', icon: Search },
  { name: 'Handshake', icon: Handshake },
  { name: 'User', icon: User },
  { name: 'Building2', icon: Building2 },
];

interface FeatureItem {
  icon: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
}

interface StepItem {
  icon: string;
  number: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
}

interface CTACard {
  icon: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  button_text: string;
  button_text_en: string;
  button_link: string;
  variant: 'primary' | 'outline';
}

interface FeaturesSettings {
  badge: string;
  badge_en: string;
  title_part1: string;
  title_part1_en: string;
  title_part2: string;
  title_part2_en: string;
  subtitle: string;
  subtitle_en: string;
  features: FeatureItem[];
}

interface HowItWorksSettings {
  badge: string;
  badge_en: string;
  title_part1: string;
  title_part1_en: string;
  title_part2: string;
  title_part2_en: string;
  subtitle: string;
  subtitle_en: string;
  steps: StepItem[];
}

interface CTASettings {
  cards: CTACard[];
}

const defaultFeatures: FeaturesSettings = {
  badge: 'لماذا نحن؟',
  badge_en: 'Why Us?',
  title_part1: 'خدمات ',
  title_part1_en: 'Professional ',
  title_part2: 'احترافية متكاملة',
  title_part2_en: 'Integrated Services',
  subtitle: 'نقدم لك مجموعة شاملة من الخدمات التي تضمن لك مسيرة احترافية ناجحة',
  subtitle_en: 'We offer you a comprehensive range of services that guarantee a successful professional career',
  features: [
    { icon: 'Globe', title: 'شبكة عالمية', title_en: 'Global Network', description: 'نملك علاقات قوية مع أندية في أوروبا وآسيا وأفريقيا', description_en: 'We have strong relationships with clubs in Europe, Asia and Africa' },
    { icon: 'Shield', title: 'حماية حقوقك', title_en: 'Protect Your Rights', description: 'فريق قانوني متخصص لضمان حقوقك في جميع العقود', description_en: 'Specialized legal team to protect your rights in all contracts' },
    { icon: 'Zap', title: 'استجابة سريعة', title_en: 'Quick Response', description: 'نتابع ملفك بشكل مستمر ونوفر لك الفرص المناسبة', description_en: 'We follow up on your file continuously and provide you with opportunities' },
    { icon: 'Award', title: 'تقييم احترافي', title_en: 'Professional Evaluation', description: 'نقدم تقييماً شاملاً لمهاراتك ونساعدك في تطويرها', description_en: 'We provide a comprehensive evaluation of your skills' },
    { icon: 'Users', title: 'دعم متكامل', title_en: 'Full Support', description: 'فريق متخصص لمساعدتك في جميع الجوانب', description_en: 'Specialized team to help you in all aspects' },
    { icon: 'TrendingUp', title: 'تطوير مستمر', title_en: 'Continuous Development', description: 'برامج تدريبية وإرشادية لتحسين أدائك', description_en: 'Training and guidance programs to improve your performance' },
  ]
};

const defaultHowItWorks: HowItWorksSettings = {
  badge: 'كيف تعمل؟',
  badge_en: 'How It Works?',
  title_part1: 'خطوات بسيطة ',
  title_part1_en: 'Simple Steps ',
  title_part2: 'للانطلاق',
  title_part2_en: 'To Get Started',
  subtitle: 'ابدأ رحلتك نحو الاحتراف في أربع خطوات سهلة',
  subtitle_en: 'Start your journey towards professionalism in four easy steps',
  steps: [
    { icon: 'UserPlus', number: '01', title: 'سجّل حسابك', title_en: 'Create Account', description: 'أنشئ حسابك مجاناً وأضف جميع بياناتك', description_en: 'Create your free account and add all your data' },
    { icon: 'FileCheck', number: '02', title: 'أكمل ملفك', title_en: 'Complete Profile', description: 'ارفع صورك ومقاطع الفيديو الخاصة بك', description_en: 'Upload your photos and videos' },
    { icon: 'Search', number: '03', title: 'انتظر الموافقة', title_en: 'Wait for Approval', description: 'يقوم فريقنا بمراجعة ملفك والتحقق منه', description_en: 'Our team reviews and verifies your file' },
    { icon: 'Handshake', number: '04', title: 'احصل على فرص', title_en: 'Get Opportunities', description: 'بعد الموافقة، ستصلك عروض من أندية', description_en: 'After approval, you will receive offers from clubs' },
  ]
};

const defaultCTA: CTASettings = {
  cards: [
    { 
      icon: 'User', 
      title: 'هل أنت لاعب موهوب؟', 
      title_en: 'Are you a talented player?', 
      description: 'انضم إلينا الآن وافتح أبواب الاحتراف. سجّل ملفك واجعل موهبتك مرئية لأفضل الأندية.', 
      description_en: 'Join us now and open the doors to professionalism.',
      button_text: 'سجّل كلاعب',
      button_text_en: 'Register as Player',
      button_link: '/player-registration',
      variant: 'primary'
    },
    { 
      icon: 'Building2', 
      title: 'تبحث عن مواهب جديدة؟', 
      title_en: 'Looking for new talents?', 
      description: 'اشترك في باقاتنا الحصرية واحصل على وصول كامل لقاعدة بيانات اللاعبين الموهوبين.', 
      description_en: 'Subscribe to our exclusive packages and get full access to talented players.',
      button_text: 'انضم كنادي',
      button_text_en: 'Join as Club',
      button_link: '/club-registration',
      variant: 'outline'
    },
  ]
};

const AdminSections = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('features');
  const [featuresSettings, setFeaturesSettings] = useState<FeaturesSettings>(defaultFeatures);
  const [howItWorksSettings, setHowItWorksSettings] = useState<HowItWorksSettings>(defaultHowItWorks);
  const [ctaSettings, setCtaSettings] = useState<CTASettings>(defaultCTA);

  // Fetch sections
  const { data: sections, isLoading } = useQuery({
    queryKey: ['admin-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_key', 'home');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (sections) {
      const featuresSection = sections.find(s => s.section_key === 'features');
      const howSection = sections.find(s => s.section_key === 'how_it_works');
      const ctaSection = sections.find(s => s.section_key === 'cta');

      if (featuresSection?.settings && Object.keys(featuresSection.settings as object).length > 0) {
        setFeaturesSettings({ ...defaultFeatures, ...(featuresSection.settings as unknown as FeaturesSettings) });
      }
      if (howSection?.settings && Object.keys(howSection.settings as object).length > 0) {
        setHowItWorksSettings({ ...defaultHowItWorks, ...(howSection.settings as unknown as HowItWorksSettings) });
      }
      if (ctaSection?.settings && Object.keys(ctaSection.settings as object).length > 0) {
        setCtaSettings({ ...defaultCTA, ...(ctaSection.settings as unknown as CTASettings) });
      }
    }
  }, [sections]);

  const updateSection = useMutation({
    mutationFn: async ({ sectionKey, settings }: { sectionKey: string; settings: unknown }) => {
      const section = sections?.find(s => s.section_key === sectionKey);
      if (!section) throw new Error('Section not found');

      const { error } = await supabase
        .from('page_sections')
        .update({ settings: JSON.parse(JSON.stringify(settings)), updated_at: new Date().toISOString() })
        .eq('id', section.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sections'] });
      queryClient.invalidateQueries({ queryKey: ['page-sections'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => {
      toast.error('فشل في حفظ الإعدادات');
    },
  });

  const handleSaveFeatures = () => {
    updateSection.mutate({ sectionKey: 'features', settings: featuresSettings });
  };

  const handleSaveHowItWorks = () => {
    updateSection.mutate({ sectionKey: 'how_it_works', settings: howItWorksSettings });
  };

  const handleSaveCTA = () => {
    updateSection.mutate({ sectionKey: 'cta', settings: ctaSettings });
  };

  const addFeature = () => {
    setFeaturesSettings(prev => ({
      ...prev,
      features: [...prev.features, { icon: 'Star', title: '', title_en: '', description: '', description_en: '' }]
    }));
  };

  const removeFeature = (index: number) => {
    setFeaturesSettings(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, field: keyof FeatureItem, value: string) => {
    setFeaturesSettings(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }));
  };

  const addStep = () => {
    const nextNumber = String(howItWorksSettings.steps.length + 1).padStart(2, '0');
    setHowItWorksSettings(prev => ({
      ...prev,
      steps: [...prev.steps, { icon: 'Star', number: nextNumber, title: '', title_en: '', description: '', description_en: '' }]
    }));
  };

  const removeStep = (index: number) => {
    setHowItWorksSettings(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index: number, field: keyof StepItem, value: string) => {
    setHowItWorksSettings(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const updateCTACard = (index: number, field: keyof CTACard, value: string) => {
    setCtaSettings(prev => ({
      ...prev,
      cards: prev.cards.map((c, i) => i === index ? { ...c, [field]: value } : c)
    }));
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

  const IconSelector = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-2 p-2 bg-background rounded-lg max-h-32 overflow-y-auto">
      {iconOptions.map(({ name, icon: Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={`p-2 rounded-lg transition-colors ${value === name ? 'bg-gold text-primary-foreground' : 'hover:bg-secondary'}`}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة السيكشنز</h1>
          <p className="text-muted-foreground">تحكم كامل في محتوى جميع أقسام الصفحة الرئيسية</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">المميزات</TabsTrigger>
            <TabsTrigger value="how_it_works">كيف يعمل</TabsTrigger>
            <TabsTrigger value="cta">دعوة للتسجيل</TabsTrigger>
          </TabsList>

          {/* Features Section */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>قسم المميزات</CardTitle>
                <Button onClick={handleSaveFeatures} disabled={updateSection.isPending}>
                  {updateSection.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Header Settings */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الشارة (عربي)</Label>
                    <Input value={featuresSettings.badge} onChange={(e) => setFeaturesSettings(prev => ({ ...prev, badge: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>الشارة (إنجليزي)</Label>
                    <Input value={featuresSettings.badge_en} onChange={(e) => setFeaturesSettings(prev => ({ ...prev, badge_en: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان الجزء 1 (عربي)</Label>
                    <Input value={featuresSettings.title_part1} onChange={(e) => setFeaturesSettings(prev => ({ ...prev, title_part1: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان الجزء 1 (إنجليزي)</Label>
                    <Input value={featuresSettings.title_part1_en} onChange={(e) => setFeaturesSettings(prev => ({ ...prev, title_part1_en: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان الجزء 2 (عربي)</Label>
                    <Input value={featuresSettings.title_part2} onChange={(e) => setFeaturesSettings(prev => ({ ...prev, title_part2: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان الجزء 2 (إنجليزي)</Label>
                    <Input value={featuresSettings.title_part2_en} onChange={(e) => setFeaturesSettings(prev => ({ ...prev, title_part2_en: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>الوصف (عربي)</Label>
                    <Textarea value={featuresSettings.subtitle} onChange={(e) => setFeaturesSettings(prev => ({ ...prev, subtitle: e.target.value }))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>الوصف (إنجليزي)</Label>
                    <Textarea value={featuresSettings.subtitle_en} onChange={(e) => setFeaturesSettings(prev => ({ ...prev, subtitle_en: e.target.value }))} dir="ltr" />
                  </div>
                </div>

                {/* Features List */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">المميزات</Label>
                    <Button onClick={addFeature} size="sm" variant="outline">
                      <Plus className="w-4 h-4 ml-2" /> إضافة ميزة
                    </Button>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {featuresSettings.features.map((feature, index) => {
                      const SelectedIcon = iconOptions.find(i => i.name === feature.icon)?.icon || Star;
                      return (
                        <AccordionItem key={index} value={`feature-${index}`} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <SelectedIcon className="w-5 h-5 text-gold" />
                              <span>{feature.title || `ميزة ${index + 1}`}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>الأيقونة</Label>
                              <IconSelector value={feature.icon} onChange={(v) => updateFeature(index, 'icon', v)} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>العنوان (عربي)</Label>
                                <Input value={feature.title} onChange={(e) => updateFeature(index, 'title', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>العنوان (إنجليزي)</Label>
                                <Input value={feature.title_en} onChange={(e) => updateFeature(index, 'title_en', e.target.value)} dir="ltr" />
                              </div>
                              <div className="space-y-2">
                                <Label>الوصف (عربي)</Label>
                                <Textarea value={feature.description} onChange={(e) => updateFeature(index, 'description', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>الوصف (إنجليزي)</Label>
                                <Textarea value={feature.description_en} onChange={(e) => updateFeature(index, 'description_en', e.target.value)} dir="ltr" />
                              </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => removeFeature(index)}>
                              <Trash2 className="w-4 h-4 ml-2" /> حذف
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* How It Works Section */}
          <TabsContent value="how_it_works" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>قسم كيف يعمل</CardTitle>
                <Button onClick={handleSaveHowItWorks} disabled={updateSection.isPending}>
                  {updateSection.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Header Settings */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الشارة (عربي)</Label>
                    <Input value={howItWorksSettings.badge} onChange={(e) => setHowItWorksSettings(prev => ({ ...prev, badge: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>الشارة (إنجليزي)</Label>
                    <Input value={howItWorksSettings.badge_en} onChange={(e) => setHowItWorksSettings(prev => ({ ...prev, badge_en: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان الجزء 1 (عربي)</Label>
                    <Input value={howItWorksSettings.title_part1} onChange={(e) => setHowItWorksSettings(prev => ({ ...prev, title_part1: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان الجزء 1 (إنجليزي)</Label>
                    <Input value={howItWorksSettings.title_part1_en} onChange={(e) => setHowItWorksSettings(prev => ({ ...prev, title_part1_en: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان الجزء 2 (عربي)</Label>
                    <Input value={howItWorksSettings.title_part2} onChange={(e) => setHowItWorksSettings(prev => ({ ...prev, title_part2: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان الجزء 2 (إنجليزي)</Label>
                    <Input value={howItWorksSettings.title_part2_en} onChange={(e) => setHowItWorksSettings(prev => ({ ...prev, title_part2_en: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>الوصف (عربي)</Label>
                    <Textarea value={howItWorksSettings.subtitle} onChange={(e) => setHowItWorksSettings(prev => ({ ...prev, subtitle: e.target.value }))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>الوصف (إنجليزي)</Label>
                    <Textarea value={howItWorksSettings.subtitle_en} onChange={(e) => setHowItWorksSettings(prev => ({ ...prev, subtitle_en: e.target.value }))} dir="ltr" />
                  </div>
                </div>

                {/* Steps List */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">الخطوات</Label>
                    <Button onClick={addStep} size="sm" variant="outline">
                      <Plus className="w-4 h-4 ml-2" /> إضافة خطوة
                    </Button>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {howItWorksSettings.steps.map((step, index) => {
                      const SelectedIcon = iconOptions.find(i => i.name === step.icon)?.icon || Star;
                      return (
                        <AccordionItem key={index} value={`step-${index}`} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <span className="text-gold font-bold">{step.number}</span>
                              <SelectedIcon className="w-5 h-5 text-gold" />
                              <span>{step.title || `خطوة ${index + 1}`}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>الرقم</Label>
                                <Input value={step.number} onChange={(e) => updateStep(index, 'number', e.target.value)} dir="ltr" />
                              </div>
                              <div className="space-y-2">
                                <Label>الأيقونة</Label>
                                <IconSelector value={step.icon} onChange={(v) => updateStep(index, 'icon', v)} />
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>العنوان (عربي)</Label>
                                <Input value={step.title} onChange={(e) => updateStep(index, 'title', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>العنوان (إنجليزي)</Label>
                                <Input value={step.title_en} onChange={(e) => updateStep(index, 'title_en', e.target.value)} dir="ltr" />
                              </div>
                              <div className="space-y-2">
                                <Label>الوصف (عربي)</Label>
                                <Textarea value={step.description} onChange={(e) => updateStep(index, 'description', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>الوصف (إنجليزي)</Label>
                                <Textarea value={step.description_en} onChange={(e) => updateStep(index, 'description_en', e.target.value)} dir="ltr" />
                              </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => removeStep(index)}>
                              <Trash2 className="w-4 h-4 ml-2" /> حذف
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CTA Section */}
          <TabsContent value="cta" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>قسم دعوة للتسجيل</CardTitle>
                <Button onClick={handleSaveCTA} disabled={updateSection.isPending}>
                  {updateSection.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {ctaSettings.cards.map((card, index) => {
                  const SelectedIcon = iconOptions.find(i => i.name === card.icon)?.icon || User;
                  return (
                    <div key={index} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                          <SelectedIcon className="w-6 h-6 text-gold" />
                        </div>
                        <h3 className="text-lg font-semibold">البطاقة {index + 1}</h3>
                      </div>

                      <div className="space-y-2">
                        <Label>الأيقونة</Label>
                        <IconSelector value={card.icon} onChange={(v) => updateCTACard(index, 'icon', v)} />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>العنوان (عربي)</Label>
                          <Input value={card.title} onChange={(e) => updateCTACard(index, 'title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>العنوان (إنجليزي)</Label>
                          <Input value={card.title_en} onChange={(e) => updateCTACard(index, 'title_en', e.target.value)} dir="ltr" />
                        </div>
                        <div className="space-y-2">
                          <Label>الوصف (عربي)</Label>
                          <Textarea value={card.description} onChange={(e) => updateCTACard(index, 'description', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>الوصف (إنجليزي)</Label>
                          <Textarea value={card.description_en} onChange={(e) => updateCTACard(index, 'description_en', e.target.value)} dir="ltr" />
                        </div>
                        <div className="space-y-2">
                          <Label>نص الزر (عربي)</Label>
                          <Input value={card.button_text} onChange={(e) => updateCTACard(index, 'button_text', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>نص الزر (إنجليزي)</Label>
                          <Input value={card.button_text_en} onChange={(e) => updateCTACard(index, 'button_text_en', e.target.value)} dir="ltr" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>رابط الزر</Label>
                          <Input value={card.button_link} onChange={(e) => updateCTACard(index, 'button_link', e.target.value)} dir="ltr" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSections;
