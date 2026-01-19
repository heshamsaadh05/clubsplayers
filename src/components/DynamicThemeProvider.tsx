import { useEffect } from 'react';
import { useThemeSettings, ThemeColors } from '@/hooks/useThemeSettings';
import { useThemeMode } from '@/hooks/useThemeMode';

interface DynamicThemeProviderProps {
  children: React.ReactNode;
  previewColors?: Partial<ThemeColors>;
  previewMode?: 'light' | 'dark'; // Which mode the preview colors are for
}

/**
 * Component that dynamically applies theme colors from the database
 * Also supports preview mode for live color changes before saving
 * And handles light/dark mode switching
 */
const DynamicThemeProvider = ({ children, previewColors, previewMode }: DynamicThemeProviderProps) => {
  const { data: themeColors } = useThemeSettings();
  const { resolvedTheme } = useThemeMode();

  useEffect(() => {
    if (!themeColors) return;

    const root = document.documentElement;

    // Map theme keys to CSS variable names
    const cssVarMap: Record<string, string> = {
      primary: '--primary',
      primary_foreground: '--primary-foreground',
      secondary: '--secondary',
      secondary_foreground: '--secondary-foreground',
      background: '--background',
      foreground: '--foreground',
      accent: '--accent',
      accent_foreground: '--accent-foreground',
      muted: '--muted',
      muted_foreground: '--muted-foreground',
    };

    // Get colors for current theme mode
    const currentModeColors = themeColors[resolvedTheme];
    
    if (!currentModeColors) return;

    // Merge database colors with preview colors if preview is for current mode
    const colorsToApply = previewMode === resolvedTheme && previewColors 
      ? { ...currentModeColors, ...previewColors }
      : currentModeColors;

    // Apply each color to CSS variables
    Object.entries(colorsToApply).forEach(([key, value]) => {
      const cssVar = cssVarMap[key];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value);
      }
    });

    // Cleanup function to reset colors when component unmounts
    return () => {
      // Only reset if we were in preview mode
      if (previewColors && previewMode === resolvedTheme) {
        Object.entries(currentModeColors).forEach(([key, value]) => {
          const cssVar = cssVarMap[key];
          if (cssVar && value) {
            root.style.setProperty(cssVar, value);
          }
        });
      }
    };
  }, [themeColors, previewColors, previewMode, resolvedTheme]);

  return <>{children}</>;
};

export default DynamicThemeProvider;
