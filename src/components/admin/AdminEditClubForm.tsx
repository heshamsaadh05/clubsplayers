import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Upload, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Club {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  logo_url: string;
  description: string;
  website: string;
}

interface AdminEditClubFormProps {
  club: Club;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const AdminEditClubForm = ({ club, isOpen, onClose, onUpdate }: AdminEditClubFormProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [formData, setFormData] = useState({
    name: club.name || '',
    email: club.email || '',
    phone: club.phone || '',
    country: club.country || '',
    city: club.city || '',
    website: club.website || '',
    description: club.description || '',
    logo_url: club.logo_url || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار صورة صالحة',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن لا يتجاوز 2 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Delete old logo if exists
      if (formData.logo_url) {
        const urlParts = formData.logo_url.split('/club-logos/');
        if (urlParts.length > 1) {
          await supabase.storage.from('club-logos').remove([urlParts[1]]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${club.user_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('club-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('club-logos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast({ title: 'تم رفع الشعار بنجاح' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء رفع الشعار',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'خطأ',
        description: 'اسم النادي مطلوب',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'خطأ',
        description: 'البريد الإلكتروني مطلوب',
        variant: 'destructive',
      });
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
          country: formData.country.trim() || null,
          city: formData.city.trim() || null,
          website: formData.website.trim() || null,
          description: formData.description.trim() || null,
          logo_url: formData.logo_url || null,
        })
        .eq('id', club.id);

      if (error) throw error;

      toast({ title: 'تم حفظ التغييرات بنجاح' });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating club:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ التغييرات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل بيانات النادي (المدير)</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 mt-4"
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-20 h-20">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="شعار النادي"
                  className="w-full h-full rounded-xl object-cover border-2 border-gold/30"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <span className="text-sm text-gold hover:underline">
                {formData.logo_url ? 'تغيير الشعار' : 'رفع شعار'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="sr-only"
                disabled={uploadingLogo}
              />
            </label>
          </div>

          {/* Form Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم النادي *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>البريد الإلكتروني *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>الموقع الإلكتروني</Label>
              <Input
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                dir="ltr"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>الدولة</Label>
              <Input
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={saving} className="flex-1 btn-gold">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              إلغاء
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditClubForm;
