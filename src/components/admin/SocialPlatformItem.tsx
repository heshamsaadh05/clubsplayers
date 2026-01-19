import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SocialPlatform } from "@/hooks/useFooterSettings";
import { SocialIcon } from "@/components/SocialIcon";

interface SocialPlatformItemProps {
  platform: SocialPlatform;
  onUpdate: (platform: SocialPlatform) => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const SocialPlatformItem = ({
  platform,
  onUpdate,
  onDelete,
  isDragging,
  dragHandleProps,
}: SocialPlatformItemProps) => {
  const [url, setUrl] = useState(platform.url);

  const handleUrlBlur = () => {
    if (url !== platform.url) {
      onUpdate({ ...platform, url });
    }
  };

  const handleToggle = (enabled: boolean) => {
    onUpdate({ ...platform, enabled });
  };

  const isCustom = platform.icon_type === 'custom';

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card transition-shadow ${
        isDragging ? "shadow-lg ring-2 ring-primary" : ""
      }`}
    >
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
        <SocialIcon platformId={platform.id} iconUrl={platform.icon_url} className="w-5 h-5" />
      </div>

      {/* Platform Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Label className="font-medium text-sm">{platform.name_ar}</Label>
          <span className="text-xs text-muted-foreground">({platform.name})</span>
        </div>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder={`https://${platform.id}.com/...`}
          dir="ltr"
          className="h-8 text-sm"
        />
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          checked={platform.enabled}
          onCheckedChange={handleToggle}
        />
        <span className="text-xs text-muted-foreground w-12">
          {platform.enabled ? "مفعل" : "معطل"}
        </span>
      </div>

      {/* Delete Button (only for custom platforms) */}
      {isCustom && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(platform.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
