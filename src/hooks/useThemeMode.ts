import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeModeSettings {
  mode: ThemeMode;
  autoSwitch: boolean;
  lightStart: string; // e.g., "06:00"
  darkStart: string;  // e.g., "18:00"
}

const DEFAULT_SETTINGS: ThemeModeSettings = {
  mode: 'dark',
  autoSwitch: false,
  lightStart: '06:00',
  darkStart: '18:00',
};

// Get resolved theme based on mode and system preference
export const getResolvedTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
};

// Get theme based on time
const getThemeByTime = (lightStart: string, darkStart: string): 'light' | 'dark' => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [lightHour, lightMin] = lightStart.split(':').map(Number);
  const [darkHour, darkMin] = darkStart.split(':').map(Number);
  
  const lightTime = lightHour * 60 + lightMin;
  const darkTime = darkHour * 60 + darkMin;
  
  if (lightTime < darkTime) {
    // Normal case: light during day
    return currentTime >= lightTime && currentTime < darkTime ? 'light' : 'dark';
  } else {
    // Inverted case: dark during day (unusual but supported)
    return currentTime >= darkTime && currentTime < lightTime ? 'dark' : 'light';
  }
};

export const useThemeModeSettings = () => {
  return useQuery({
    queryKey: ['theme_mode_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theme_settings')
        .select('value')
        .eq('key', 'mode_settings')
        .maybeSingle();
      
      if (error) throw error;
      if (!data?.value) return DEFAULT_SETTINGS;
      return data.value as unknown as ThemeModeSettings;
    },
  });
};

export const useUpdateThemeModeSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<ThemeModeSettings>) => {
      // Get current settings
      const { data: existing } = await supabase
        .from('theme_settings')
        .select('value')
        .eq('key', 'mode_settings')
        .maybeSingle();
      
      const currentSettings = existing?.value 
        ? (existing.value as unknown as ThemeModeSettings) 
        : DEFAULT_SETTINGS;
      const newSettings = { ...currentSettings, ...settings };
      
      const { error } = await supabase
        .from('theme_settings')
        .upsert({ 
          key: 'mode_settings', 
          value: newSettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      if (error) throw error;
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme_mode_settings'] });
    },
  });
};

export const useThemeMode = () => {
  const { data: settings } = useThemeModeSettings();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  
  const updateTheme = useCallback(() => {
    if (!settings) return;
    
    let newTheme: 'light' | 'dark';
    
    if (settings.autoSwitch) {
      newTheme = getThemeByTime(settings.lightStart, settings.darkStart);
    } else {
      newTheme = getResolvedTheme(settings.mode);
    }
    
    setResolvedTheme(newTheme);
    
    // Apply theme to document
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings]);
  
  // Update theme when settings change
  useEffect(() => {
    updateTheme();
  }, [updateTheme]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (settings?.mode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => updateTheme();
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings?.mode, updateTheme]);
  
  // Auto-switch based on time
  useEffect(() => {
    if (!settings?.autoSwitch) return;
    
    // Check every minute
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, [settings?.autoSwitch, updateTheme]);
  
  return {
    mode: settings?.mode || 'dark',
    resolvedTheme,
    autoSwitch: settings?.autoSwitch || false,
    settings: settings || DEFAULT_SETTINGS,
  };
};
