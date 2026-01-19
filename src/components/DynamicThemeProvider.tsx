import { useEffect } from 'react';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { useThemeMode } from '@/hooks/useThemeMode';

interface ThemeColors {
  primary: string;
  primary_foreground: string;
  secondary: string;
  secondary_foreground: string;
  background: string;
  foreground: string;
  accent: string;
  accent_foreground: string;
  muted: string;
  muted_foreground: string;
}

interface DynamicThemeProviderProps {
  children: React.ReactNode;
  previewColors?: Partial<ThemeColors>;
}

/**
 * Component that dynamically applies theme colors from the database
 * Also supports preview mode for live color changes before saving
 * And handles light/dark mode switching
 */
const DynamicThemeProvider = ({ children, previewColors }: DynamicThemeProviderProps) => {
  const { data: themeColors } = useThemeSettings();
  
  // Initialize theme mode (this handles applying dark class to document)
  useThemeMode();

  useEffect(() => {
    // Merge database colors with preview colors (preview takes precedence)
    const colors = { ...themeColors, ...previewColors };
    
    if (!colors || Object.keys(colors).length === 0) return;

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

    // Apply each color to CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = cssVarMap[key];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value);
      }
    });

    // Cleanup function to reset colors when component unmounts
    return () => {
      // Only reset if we were in preview mode
      if (previewColors) {
        Object.values(cssVarMap).forEach((cssVar) => {
          root.style.removeProperty(cssVar);
        });
      }
    };
  }, [themeColors, previewColors]);

  return <>{children}</>;
};

export default DynamicThemeProvider;
