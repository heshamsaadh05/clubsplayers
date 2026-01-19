import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Upload, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Club = Tables<"clubs">;

interface EditClubFormProps {
  club: Club;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditClubForm = ({ club, isOpen, onClose, onUpdate }: EditClubFormProps) => {
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [formData, setFormData] = useState({
    name: club.name || '',
    email: club.email || '',
    phone: club.phone || '',
    website: club.website || '',
    city: club.city || '',
    country: club.country || '',
    description: club.description || '',
    logo_url: club.logo_url || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صالحة');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${club.user_id}/${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (formData.logo_url) {
        const oldPath = formData.logo_url.split('/').slice(-2).join('/');
        await supabase.storage.from('club-logos').remove([oldPath]);
      }

      const { error: uploadError, data } = await supabase.storage
        .from('club-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('club-logos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('تم رفع الشعار بنجاح');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('حدث خطأ أثناء رفع الشعار');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('اسم النادي مطلوب');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('البريد الإلكتروني مطلوب');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          website: formData.website.trim() || null,
          city: formData.city.trim() || null,
          country: formData.country.trim() || null,
          description: formData.description.trim() || null,
          logo_url: formData.logo_url || null,
        })
        .eq('id', club.id);

      if (error) throw error;

      toast.success('تم حفظ التغييرات بنجاح');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating club:', error);
      toast.error('حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">تعديل بيانات النادي</DialogTitle>
          <DialogDescription>
            قم بتحديث معلومات النادي الخاصة بك
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>شعار النادي</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-dashed border-border">
                  {formData.logo_url ? (
                    <>
                      <img 
                        src={formData.logo_url} 
                        alt="Club logo" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploadingLogo ? 'جاري الرفع...' : 'رفع شعار جديد'}
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    الحد الأقصى: 2 ميجابايت
                  </p>
                </div>
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم النادي *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="أدخل اسم النادي"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@club.com"
                  required
                />
              </div>
            </div>

            {/* Phone & Website */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+966 ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">الموقع الإلكتروني</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* City & Country */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="أدخل المدينة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">الدولة</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="أدخل الدولة"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">نبذة عن النادي</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="اكتب وصفاً مختصراً عن النادي..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-left">
                {formData.description.length}/500
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                إلغاء
              </Button>
              <Button type="submit" className="btn-gold" disabled={saving || uploadingLogo}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ التغييرات'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClubForm;
