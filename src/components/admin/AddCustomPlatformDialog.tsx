import { useState, useRef } from "react";
import { Plus, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SocialPlatform } from "@/hooks/useFooterSettings";

interface AddCustomPlatformDialogProps {
  onAdd: (platform: SocialPlatform) => void;
  existingPlatformsCount: number;
}

export const AddCustomPlatformDialog = ({
  onAdd,
  existingPlatformsCount,
}: AddCustomPlatformDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `social-icon-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("slider-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("slider-images").getPublicUrl(fileName);

      setIconUrl(publicUrl);
      toast.success("تم رفع الأيقونة بنجاح");
    } catch (error) {
      console.error("Error uploading icon:", error);
      toast.error("فشل في رفع الأيقونة");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !nameAr.trim()) {
      toast.error("يرجى إدخال اسم المنصة");
      return;
    }

    const newPlatform: SocialPlatform = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      name_ar: nameAr.trim(),
      url: url.trim(),
      enabled: true,
      order: existingPlatformsCount,
      icon_type: "custom",
      icon_url: iconUrl || undefined,
    };

    onAdd(newPlatform);
    setOpen(false);
    resetForm();
    toast.success("تمت إضافة المنصة بنجاح");
  };

  const resetForm = () => {
    setName("");
    setNameAr("");
    setUrl("");
    setIconUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed">
          <Plus className="w-4 h-4 ml-2" />
          إضافة منصة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة منصة تواصل اجتماعي جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المنصة (عربي)</Label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: ديسكورد"
              />
            </div>
            <div className="space-y-2">
              <Label>اسم المنصة (إنجليزي)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Discord"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>رابط الحساب</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label>أيقونة المنصة</Label>
            <div className="flex items-center gap-3">
              {iconUrl ? (
                <div className="w-12 h-12 rounded-lg border bg-secondary flex items-center justify-center overflow-hidden">
                  <img
                    src={iconUrl}
                    alt="Icon"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg border bg-secondary flex items-center justify-center text-muted-foreground">
                  <span className="text-lg font-bold">
                    {nameAr.charAt(0) || "؟"}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Upload className="w-4 h-4 ml-2" />
                  )}
                  رفع أيقونة
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  أو أدخل رابط الأيقونة
                </p>
                <Input
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="mt-2 h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>إضافة</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
