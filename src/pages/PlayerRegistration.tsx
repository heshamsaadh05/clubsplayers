import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Upload, User, FileText, Video, X, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const positions = [
  'حارس مرمى',
  'مدافع',
  'ظهير أيمن',
  'ظهير أيسر',
  'قلب دفاع',
  'لاعب وسط',
  'لاعب وسط دفاعي',
  'لاعب وسط هجومي',
  'جناح أيمن',
  'جناح أيسر',
  'مهاجم',
];

const nationalities = [
  'مصري', 'سعودي', 'إماراتي', 'قطري', 'كويتي', 'بحريني', 'عماني', 'أردني',
  'لبناني', 'سوري', 'عراقي', 'فلسطيني', 'يمني', 'ليبي', 'تونسي', 'جزائري',
  'مغربي', 'سوداني', 'موريتاني', 'جيبوتي', 'صومالي', 'جزر القمر',
];

const playerSchema = z.object({
  fullName: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  dateOfBirth: z.string().min(1, 'تاريخ الميلاد مطلوب'),
  nationality: z.string().min(1, 'الجنسية مطلوبة'),
  position: z.string().min(1, 'المركز مطلوب'),
  currentClub: z.string().optional(),
  previousClubs: z.string().optional(),
  heightCm: z.coerce.number().min(100, 'الطول غير صالح').max(250, 'الطول غير صالح'),
  weightKg: z.coerce.number().min(30, 'الوزن غير صالح').max(150, 'الوزن غير صالح'),
  bio: z.string().max(500, 'السيرة الذاتية يجب ألا تتجاوز 500 حرف').optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

export default function PlayerRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [videos, setVideos] = useState<File[]>([]);

  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      fullName: '',
      email: user?.email || '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      position: '',
      currentClub: '',
      previousClubs: '',
      heightCm: 170,
      weightKg: 70,
      bio: '',
    },
  });

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
        return;
      }
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم الملف يجب ألا يتجاوز 10 ميجابايت');
        return;
      }
      setIdDocument(file);
    }
  };

  const handleVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`الفيديو ${file.name} يتجاوز الحد المسموح 100 ميجابايت`);
        return false;
      }
      return true;
    });
    
    if (videos.length + validFiles.length > 5) {
      toast.error('يمكنك رفع 5 فيديوهات كحد أقصى');
      return;
    }
    
    setVideos([...videos, ...validFiles]);
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  };

  const onSubmit = async (data: PlayerFormData) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }

    if (!profileImage) {
      toast.error('الصورة الشخصية مطلوبة');
      return;
    }

    if (!idDocument) {
      toast.error('صورة الهوية مطلوبة');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload profile image
      const profileImageUrl = await uploadFile(
        profileImage,
        'player-images',
        `${user.id}/profile-${Date.now()}.${profileImage.name.split('.').pop()}`
      );

      // Upload ID document
      const idDocumentUrl = await uploadFile(
        idDocument,
        'player-documents',
        `${user.id}/id-${Date.now()}.${idDocument.name.split('.').pop()}`
      );

      // Upload videos
      const videoUrls: string[] = [];
      for (const video of videos) {
        const videoUrl = await uploadFile(
          video,
          'player-videos',
          `${user.id}/video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${video.name.split('.').pop()}`
        );
        videoUrls.push(videoUrl);
      }

      // Parse previous clubs
      const previousClubs = data.previousClubs
        ? data.previousClubs.split(',').map(club => club.trim()).filter(Boolean)
        : null;

      // Insert player data
      const { error: insertError } = await supabase
        .from('players')
        .insert({
          user_id: user.id,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.dateOfBirth,
          nationality: data.nationality,
          position: data.position,
          current_club: data.currentClub || null,
          previous_clubs: previousClubs,
          height_cm: data.heightCm,
          weight_kg: data.weightKg,
          bio: data.bio || null,
          profile_image_url: profileImageUrl,
          id_document_url: idDocumentUrl,
          video_urls: videoUrls.length > 0 ? videoUrls : null,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Add player role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'player',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.error('Role assignment error:', roleError);
      }

      toast.success('تم تقديم طلب التسجيل بنجاح! سيتم مراجعته من قبل الإدارة.');
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle>تسجيل الدخول مطلوب</CardTitle>
              <CardDescription>
                يجب تسجيل الدخول أولاً للتسجيل كلاعب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')} className="w-full">
                تسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">تسجيل لاعب جديد</h1>
            <p className="text-muted-foreground">
              أكمل النموذج التالي للانضمام إلى قاعدة بيانات اللاعبين
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    البيانات الشخصية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل *</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسمك الكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="example@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+966 5XX XXX XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الميلاد *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الجنسية *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الجنسية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nationalities.map((nationality) => (
                              <SelectItem key={nationality} value={nationality}>
                                {nationality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المركز *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المركز" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {positions.map((position) => (
                              <SelectItem key={position} value={position}>
                                {position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="heightCm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الطول (سم) *</FormLabel>
                        <FormControl>
                          <Input type="number" min={100} max={250} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوزن (كجم) *</FormLabel>
                        <FormControl>
                          <Input type="number" min={30} max={150} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentClub"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>النادي الحالي</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم النادي الحالي (اختياري)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousClubs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الأندية السابقة</FormLabel>
                        <FormControl>
                          <Input placeholder="النادي 1، النادي 2، النادي 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نبذة تعريفية</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="اكتب نبذة قصيرة عن نفسك وخبراتك..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Profile Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    الصورة الشخصية *
                  </CardTitle>
                  <CardDescription>
                    صورة واضحة بخلفية فاتحة (الحد الأقصى 5 ميجابايت)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {profileImagePreview ? (
                      <div className="relative">
                        <img
                          src={profileImagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProfileImage(null);
                            setProfileImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Label
                        htmlFor="profile-image"
                        className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">رفع صورة</span>
                        </div>
                      </Label>
                    )}
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ID Document */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    صورة الهوية *
                  </CardTitle>
                  <CardDescription>
                    صورة واضحة للهوية الوطنية أو جواز السفر (الحد الأقصى 10 ميجابايت)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {idDocument ? (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm">{idDocument.name}</span>
                        <button
                          type="button"
                          onClick={() => setIdDocument(null)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Label
                        htmlFor="id-document"
                        className="flex-1 border-2 border-dashed rounded-lg p-6 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">رفع صورة الهوية</span>
                        </div>
                      </Label>
                    )}
                    <Input
                      id="id-document"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleIdDocumentChange}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Videos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    فيديوهات اللعب
                  </CardTitle>
                  <CardDescription>
                    يمكنك رفع حتى 5 فيديوهات (الحد الأقصى 100 ميجابايت لكل فيديو)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {videos.length > 0 && (
                      <div className="space-y-2">
                        {videos.map((video, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Video className="h-5 w-5 text-primary" />
                            <span className="text-sm flex-1">{video.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {(video.size / (1024 * 1024)).toFixed(1)} MB
                            </span>
                            <button
                              type="button"
                              onClick={() => removeVideo(index)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {videos.length < 5 && (
                      <Label
                        htmlFor="videos"
                        className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          اضغط لرفع فيديو ({videos.length}/5)
                        </span>
                      </Label>
                    )}
                    <Input
                      id="videos"
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideosChange}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التسجيل...
                  </>
                ) : (
                  'تقديم طلب التسجيل'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
