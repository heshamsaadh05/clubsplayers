import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeMode, useUpdateThemeModeSettings, ThemeMode } from '@/hooks/useThemeMode';
import { toast } from 'sonner';

const ThemeModeToggle = () => {
  const { mode, resolvedTheme } = useThemeMode();
  const updateSettings = useUpdateThemeModeSettings();

  const handleModeChange = async (newMode: ThemeMode) => {
    try {
      await updateSettings.mutateAsync({ mode: newMode, autoSwitch: false });
    } catch {
      toast.error('حدث خطأ في تغيير الوضع');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">تغيير الوضع</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleModeChange('light')}
          className="gap-2 cursor-pointer"
        >
          <Sun className="h-4 w-4" />
          فاتح
          {mode === 'light' && <span className="mr-auto text-gold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleModeChange('dark')}
          className="gap-2 cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          داكن
          {mode === 'dark' && <span className="mr-auto text-gold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleModeChange('system')}
          className="gap-2 cursor-pointer"
        >
          <Monitor className="h-4 w-4" />
          تلقائي (حسب النظام)
          {mode === 'system' && <span className="mr-auto text-gold">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeModeToggle;
