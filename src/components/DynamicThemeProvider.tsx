import { useEffect, useState, useCallback } from 'react';
import { useThemeSettings, ThemeColors } from '@/hooks/useThemeSettings';

interface DynamicThemeProviderProps {
  children: React.ReactNode;
  previewColors?: Partial<ThemeColors>;
  previewMode?: 'light' | 'dark'; // Which mode the preview colors are for
}

/**
 * Component that dynamically applies theme colors from the database
 * Also supports preview mode for live color changes before saving
 * And handles light/dark mode switching by observing DOM changes
 */
const DynamicThemeProvider = ({ children, previewColors, previewMode }: DynamicThemeProviderProps) => {
  const { data: themeColors } = useThemeSettings();
  
  // Track the actual theme from DOM instead of hook state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

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

  // Function to apply colors
  const applyColors = useCallback((theme: 'light' | 'dark') => {
    if (!themeColors) return;
    
    const root = document.documentElement;
    const currentModeColors = themeColors[theme];
    
    if (!currentModeColors) return;

    // Merge database colors with preview colors if preview is for current mode
    const colorsToApply = previewMode === theme && previewColors 
      ? { ...currentModeColors, ...previewColors }
      : currentModeColors;

    // Apply each color to CSS variables
    Object.entries(colorsToApply).forEach(([key, value]) => {
      const cssVar = cssVarMap[key];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value);
      }
    });
  }, [themeColors, previewColors, previewMode, cssVarMap]);

  // Watch for dark class changes on documentElement using MutationObserver
  useEffect(() => {
    const root = document.documentElement;
    
    const updateTheme = () => {
      const isDark = root.classList.contains('dark');
      const newTheme = isDark ? 'dark' : 'light';
      setCurrentTheme(newTheme);
    };

    // Initial check
    updateTheme();

    // Create observer to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateTheme();
        }
      });
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Apply colors when theme or themeColors change
  useEffect(() => {
    applyColors(currentTheme);
  }, [currentTheme, themeColors, applyColors]);

  // Also apply when preview colors change
  useEffect(() => {
    if (previewColors && previewMode === currentTheme) {
      applyColors(currentTheme);
    }
  }, [previewColors, previewMode, currentTheme, applyColors]);

  return <>{children}</>;
};

export default DynamicThemeProvider;
