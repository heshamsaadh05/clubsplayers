import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Upload, 
  ArrowRight,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const clubSchema = z.object({
  name: z.string().min(2, "اسم النادي مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  website: z.string().url("رابط الموقع غير صالح").optional().or(z.literal("")),
  city: z.string().optional(),
  country: z.string().optional(),
  description: z.string().max(500, "الوصف يجب أن يكون أقل من 500 حرف").optional(),
});

type ClubFormData = z.infer<typeof clubSchema>;

const ClubRegistration = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      city: "",
      country: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الشعار يجب أن يكون أقل من 5 ميجابايت");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;

    const fileExt = logoFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("club-logos")
      .upload(fileName, logoFile);

    if (uploadError) {
      console.error("Logo upload error:", uploadError);
      throw new Error("فشل في رفع الشعار");
    }

    const { data: urlData } = supabase.storage
      .from("club-logos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const onSubmit = async (data: ClubFormData) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if club already exists for this user
      const { data: existingClub } = await supabase
        .from("clubs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingClub) {
        toast.error("لديك نادي مسجل بالفعل");
        navigate("/club-dashboard");
        return;
      }

      // Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      // Insert club data
      const { error: clubError } = await supabase.from("clubs").insert({
        user_id: user.id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        website: data.website || null,
        city: data.city || null,
        country: data.country || null,
        description: data.description || null,
        logo_url: logoUrl,
      });

      if (clubError) throw clubError;

      // Assign club role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "club",
      });

      if (roleError && !roleError.message.includes("duplicate")) {
        console.error("Role assignment error:", roleError);
      }

      toast.success("تم تسجيل النادي بنجاح!");
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("حدث خطأ أثناء التسجيل");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl font-bold mb-2">تسجيل نادي جديد</h1>
          <p className="text-muted-foreground">
            انضم إلى شبكتنا للوصول إلى أفضل المواهب الكروية
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>بيانات النادي</CardTitle>
              <CardDescription>
                أدخل معلومات النادي الأساسية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Logo Upload */}
                  <div className="flex flex-col items-center mb-6">
                    <div
                      className="w-32 h-32 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-gold transition-colors overflow-hidden bg-muted/50"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <span className="text-xs text-muted-foreground">شعار النادي</span>
                        </div>
                      )}
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      رفع الشعار
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Club Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم النادي *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="أدخل اسم النادي"
                                className="pr-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="email@club.com"
                                className="pr-10"
                                dir="ltr"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="tel"
                                placeholder="+966..."
                                className="pr-10"
                                dir="ltr"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Website */}
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الموقع الإلكتروني</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="url"
                                placeholder="https://..."
                                className="pr-10"
                                dir="ltr"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* City */}
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدينة</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="المدينة"
                                className="pr-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Country */}
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الدولة</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="الدولة"
                                className="pr-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نبذة عن النادي</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="اكتب نبذة قصيرة عن النادي..."
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate("/")}
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 btn-gold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري التسجيل...
                        </>
                      ) : (
                        <>
                          تسجيل النادي
                          <ArrowRight className="w-4 h-4 mr-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          بالتسجيل، أنت توافق على{" "}
          <a href="#" className="text-gold hover:underline">
            شروط الخدمة
          </a>{" "}
          و{" "}
          <a href="#" className="text-gold hover:underline">
            سياسة الخصوصية
          </a>
        </motion.p>
      </div>
    </div>
  );
};

export default ClubRegistration;
