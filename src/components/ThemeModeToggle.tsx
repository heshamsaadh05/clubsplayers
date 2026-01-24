import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeMode, useUpdateThemeModeSettings, ThemeMode, getResolvedTheme } from '@/hooks/useThemeMode';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import { useEffect } from 'react';

const ThemeModeToggle = () => {
  const { mode, resolvedTheme } = useThemeMode();
  const { t } = useLanguage();
  const updateSettings = useUpdateThemeModeSettings();

  // Apply theme immediately on mount and when resolvedTheme changes
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const handleModeChange = async (newMode: ThemeMode) => {
    try {
      // Apply theme immediately before the async call
      const newResolvedTheme = getResolvedTheme(newMode);
      const root = document.documentElement;
      if (newResolvedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      await updateSettings.mutateAsync({ mode: newMode, autoSwitch: false });
    } catch {
      toast.error(t('common.error', 'حدث خطأ'));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('theme.toggle', 'تغيير الوضع')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleModeChange('light')}
          className="gap-2 cursor-pointer"
        >
          <Sun className="h-4 w-4" />
          {t('theme.light', 'فاتح')}
          {mode === 'light' && <span className="mr-auto text-gold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleModeChange('dark')}
          className="gap-2 cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          {t('theme.dark', 'داكن')}
          {mode === 'dark' && <span className="mr-auto text-gold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleModeChange('system')}
          className="gap-2 cursor-pointer"
        >
          <Monitor className="h-4 w-4" />
          {t('theme.system', 'تلقائي (حسب النظام)')}
          {mode === 'system' && <span className="mr-auto text-gold">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeModeToggle;
