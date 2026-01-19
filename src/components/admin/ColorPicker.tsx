import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pipette, RotateCcw } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  originalValue: string;
  onChange: (value: string) => void;
  onReset?: () => void;
}

// Convert HSL string to hex for the color picker
const hslToHex = (hsl: string): string => {
  try {
    // Parse HSL values: "45 90% 55%" or "45deg 90% 55%"
    const parts = hsl.replace(/deg/g, '').trim().split(/\s+/);
    if (parts.length < 3) return '#d4af37'; // fallback gold
    
    const h = parseFloat(parts[0]) / 360;
    const s = parseFloat(parts[1].replace('%', '')) / 100;
    const l = parseFloat(parts[2].replace('%', '')) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return '#d4af37';
  }
};

// Convert hex to HSL string
const hexToHsl = (hex: string): string => {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '45 90% 55%';

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);

    return `${hDeg} ${sPct}% ${lPct}%`;
  } catch {
    return '45 90% 55%';
  }
};

const ColorPicker = ({ label, value, originalValue, onChange, onReset }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hexValue = hslToHex(value);
  const hasChanged = value !== originalValue;

  const handleHexChange = useCallback((hex: string) => {
    const hsl = hexToHsl(hex);
    onChange(hsl);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {hasChanged && onReset && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3 ml-1" />
            استعادة
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        {/* Color Picker Button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              className="w-12 h-10 rounded-lg border-2 border-border hover:border-gold transition-colors relative overflow-hidden group"
              style={{ backgroundColor: `hsl(${value})` }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <Pipette className="w-4 h-4 text-white" />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <input
                type="color"
                value={hexValue}
                onChange={(e) => handleHexChange(e.target.value)}
                className="w-full h-32 cursor-pointer rounded-lg border-0"
              />
              <div className="flex gap-2">
                <Input
                  value={hexValue}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="font-mono text-sm"
                  dir="ltr"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* HSL Input */}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="H S% L%"
          dir="ltr"
          className={`flex-1 font-mono text-sm ${hasChanged ? 'border-gold' : ''}`}
        />
      </div>
      <p className="text-xs text-muted-foreground">صيغة HSL: درجة اللون، التشبع%، الإضاءة%</p>
    </div>
  );
};

export default ColorPicker;
