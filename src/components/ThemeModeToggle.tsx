import { Moon, Sun, Monitor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeMode, useUpdateThemeModeSettings, ThemeMode } from '@/hooks/useThemeMode';
import { useLanguage } from '@/hooks/useLanguage';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const ThemeModeToggle = () => {
  const { mode, resolvedTheme, setLocalMode } = useThemeMode();
  const { t } = useLanguage();
  const updateSettings = useUpdateThemeModeSettings();
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    // Show transition indicator
    setIsTransitioning(true);
    
    // Apply theme immediately via localStorage (works for all users)
    setLocalMode(newMode);
    
    // Also save to database for authenticated users
    try {
      await updateSettings.mutateAsync({ mode: newMode, autoSwitch: false });
    } catch {
      // Silent fail for database - localStorage already applied
      console.log('Theme saved locally');
    }
    
    // Hide transition indicator after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 350);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative overflow-hidden",
            isTransitioning && "pointer-events-none"
          )}
        >
          {/* Shimmer overlay during transition */}
          {isTransitioning && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
          )}
          
          {/* Loading spinner during transition */}
          <Loader2 
            className={cn(
              "absolute h-5 w-5 text-primary transition-all duration-200",
              isTransitioning ? "opacity-100 animate-spin" : "opacity-0 scale-0"
            )} 
          />
          
          {/* Sun icon */}
          <Sun 
            className={cn(
              "h-5 w-5 transition-all duration-300",
              isTransitioning 
                ? "opacity-0 scale-0" 
                : "rotate-0 scale-100 dark:-rotate-90 dark:scale-0"
            )} 
          />
          
          {/* Moon icon */}
          <Moon 
            className={cn(
              "absolute h-5 w-5 transition-all duration-300",
              isTransitioning 
                ? "opacity-0 scale-0" 
                : "rotate-90 scale-0 dark:rotate-0 dark:scale-100"
            )} 
          />
          
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
