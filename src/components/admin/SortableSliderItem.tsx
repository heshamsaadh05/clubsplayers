import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SliderItem {
  id: string;
  slider_key: string;
  title: string | null;
  title_ar: string | null;
  subtitle: string | null;
  subtitle_ar: string | null;
  image_url: string | null;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
}

interface SortableSliderItemProps {
  item: SliderItem;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onImageUpload: (id: string, file: File) => void;
  isUploading: boolean;
}

export const SortableSliderItem = ({
  item,
  onUpdate,
  onDelete,
  onImageUpload,
  isUploading,
}: SortableSliderItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-secondary/50 rounded-xl space-y-4 ${
        isDragging ? 'shadow-lg ring-2 ring-gold' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
            type="button"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </button>
          <Switch
            checked={item.is_active}
            onCheckedChange={(checked) => onUpdate(item.id, { is_active: checked })}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>العنوان (EN)</Label>
          <Input
            value={item.title || ''}
            onChange={(e) => onUpdate(item.id, { title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>العنوان (AR)</Label>
          <Input
            value={item.title_ar || ''}
            onChange={(e) => onUpdate(item.id, { title_ar: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>العنوان الفرعي (EN)</Label>
          <Input
            value={item.subtitle || ''}
            onChange={(e) => onUpdate(item.id, { subtitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>العنوان الفرعي (AR)</Label>
          <Input
            value={item.subtitle_ar || ''}
            onChange={(e) => onUpdate(item.id, { subtitle_ar: e.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>الصورة</Label>
          <div className="flex items-center gap-4">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.title || 'Slider image'}
                className="w-20 h-14 object-cover rounded-lg border border-border"
              />
            )}
            <div className="flex-1 flex gap-2">
              <Input
                value={item.image_url || ''}
                onChange={(e) => onUpdate(item.id, { image_url: e.target.value })}
                placeholder="أو أدخل رابط الصورة"
                dir="ltr"
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageUpload(item.id, file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>رابط الانتقال</Label>
          <Input
            value={item.link_url || ''}
            onChange={(e) => onUpdate(item.id, { link_url: e.target.value })}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
};

export default SortableSliderItem;
