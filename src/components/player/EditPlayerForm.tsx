import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Player = Tables<'players'>;

interface EditPlayerFormProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const positions = [
  'حارس مرمى',
  'مدافع',
  'مدافع أيمن',
  'مدافع أيسر',
  'قلب دفاع',
  'وسط دفاعي',
  'وسط ميدان',
  'جناح أيمن',
  'جناح أيسر',
  'مهاجم',
  'رأس حربة',
];

const EditPlayerForm = ({ player, isOpen, onClose, onUpdate }: EditPlayerFormProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: player.full_name || '',
    phone: player.phone || '',
    nationality: player.nationality || '',
    date_of_birth: player.date_of_birth || '',
    position: player.position || '',
    height_cm: player.height_cm?.toString() || '',
    weight_kg: player.weight_kg?.toString() || '',
    current_club: player.current_club || '',
    previous_clubs: player.previous_clubs?.join(', ') || '',
    bio: player.bio || '',
    profile_image_url: player.profile_image_url || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار صورة صالحة',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${player.user_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('player-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('player-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, profile_image_url: publicUrl }));
      toast({ title: 'تم رفع الصورة بنجاح' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء رفع الصورة',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.full_name.trim()) {
      toast({
        title: 'خطأ',
        description: 'الاسم الكامل مطلوب',
        variant: 'destructive',
      });
      return;
    }

    if (formData.full_name.length > 100) {
      toast({
        title: 'خطأ',
        description: 'الاسم يجب أن لا يتجاوز 100 حرف',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const previousClubsArray = formData.previous_clubs
        .split(',')
        .map(club => club.trim())
        .filter(club => club.length > 0);

      const { error } = await supabase
        .from('players')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          nationality: formData.nationality.trim() || null,
          date_of_birth: formData.date_of_birth || null,
          position: formData.position || null,
          height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
          current_club: formData.current_club.trim() || null,
          previous_clubs: previousClubsArray.length > 0 ? previousClubsArray : null,
          bio: formData.bio.trim() || null,
          profile_image_url: formData.profile_image_url || null,
        })
        .eq('id', player.id);

      if (error) throw error;

      toast({ title: 'تم حفظ التغييرات بنجاح' });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating player:', error);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الملف الشخصي</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 mt-4"
        >
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
              {formData.profile_image_url ? (
                <img
                  src={formData.profile_image_url}
                  alt="صورة الملف الشخصي"
                  className="w-full h-full rounded-full object-cover border-4 border-gold/30"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center border-4 border-dashed border-border">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <span className="text-sm text-gold hover:underline">
                {formData.profile_image_url ? 'تغيير الصورة' : 'رفع صورة'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
                disabled={uploadingImage}
              />
            </label>
          </div>

          {/* Form Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم الكامل *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="أدخل الاسم الكامل"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+20 xxx xxx xxxx"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>الجنسية</Label>
              <Input
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                placeholder="مصري، سعودي، ..."
              />
            </div>

            <div className="space-y-2">
              <Label>تاريخ الميلاد</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>المركز</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleChange('position', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المركز" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>النادي الحالي</Label>
              <Input
                value={formData.current_club}
                onChange={(e) => handleChange('current_club', e.target.value)}
                placeholder="اسم النادي الحالي"
              />
            </div>

            <div className="space-y-2">
              <Label>الطول (سم)</Label>
              <Input
                type="number"
                value={formData.height_cm}
                onChange={(e) => handleChange('height_cm', e.target.value)}
                placeholder="180"
                min="100"
                max="250"
              />
            </div>

            <div className="space-y-2">
              <Label>الوزن (كجم)</Label>
              <Input
                type="number"
                value={formData.weight_kg}
                onChange={(e) => handleChange('weight_kg', e.target.value)}
                placeholder="75"
                min="40"
                max="150"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الأندية السابقة</Label>
            <Input
              value={formData.previous_clubs}
              onChange={(e) => handleChange('previous_clubs', e.target.value)}
              placeholder="نادي 1، نادي 2، نادي 3 (افصل بفاصلة)"
            />
            <p className="text-xs text-muted-foreground">افصل بين الأندية بفاصلة</p>
          </div>

          <div className="space-y-2">
            <Label>نبذة شخصية</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="اكتب نبذة مختصرة عن نفسك ومسيرتك الكروية..."
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-left">
              {formData.bio.length}/1000
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1 btn-gold"
              onClick={handleSubmit}
              disabled={saving}
            >
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
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerForm;