import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ThemeColors {
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

export interface DualModeThemeColors {
  light: ThemeColors;
  dark: ThemeColors;
}

// Default colors from index.css
export const DEFAULT_LIGHT_COLORS: ThemeColors = {
  primary: '210 40% 96.0784%',
  primary_foreground: '33 100% 96%',
  secondary: '0 0% 32%',
  secondary_foreground: '0 0% 98%',
  background: '0 0% 96%',
  foreground: '0 0% 9%',
  accent: '47 100% 96%',
  accent_foreground: '335 77.5701% 41.9608%',
  muted: '0 0% 63%',
  muted_foreground: '0 0% 9%',
};

export const DEFAULT_DARK_COLORS: ThemeColors = {
  primary: '27 95% 60%',
  primary_foreground: '12 81% 14%',
  secondary: '0 0% 45%',
  secondary_foreground: '0 0% 98%',
  background: '0 0% 9%',
  foreground: '0 0% 98%',
  accent: '20 91% 14%',
  accent_foreground: '43 96% 56%',
  muted: '0 0% 45%',
  muted_foreground: '0 0% 98%',
};

export const useThemeSettings = () => {
  return useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .eq('key', 'colors')
        .single();

      if (error) throw error;
      
      // Handle legacy single-mode colors or new dual-mode format
      const value = data?.value as unknown;
      if (value && typeof value === 'object' && 'light' in (value as object) && 'dark' in (value as object)) {
        return value as DualModeThemeColors;
      }
      
      // Legacy format: return as dark mode colors, use defaults for light
      return {
        light: DEFAULT_LIGHT_COLORS,
        dark: (value as ThemeColors) || DEFAULT_DARK_COLORS,
      } as DualModeThemeColors;
    },
  });
};

// Get colors for a specific mode
export const useThemeColorsForMode = (mode: 'light' | 'dark') => {
  const { data: themeSettings, ...rest } = useThemeSettings();
  
  return {
    ...rest,
    data: themeSettings?.[mode],
  };
};

export const useUpdateThemeSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (colors: DualModeThemeColors) => {
      const { error } = await supabase
        .from('theme_settings')
        .update({ value: colors as unknown as Json })
        .eq('key', 'colors');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
    },
  });
};

// Update colors for a specific mode only
export const useUpdateThemeColorsForMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mode, colors }: { mode: 'light' | 'dark'; colors: ThemeColors }) => {
      // Get current settings
      const { data: existing } = await supabase
        .from('theme_settings')
        .select('value')
        .eq('key', 'colors')
        .single();

      let currentSettings: DualModeThemeColors;
      
      const value = existing?.value as unknown;
      if (value && typeof value === 'object' && 'light' in (value as object) && 'dark' in (value as object)) {
        currentSettings = value as DualModeThemeColors;
      } else {
        currentSettings = {
          light: DEFAULT_LIGHT_COLORS,
          dark: (value as ThemeColors) || DEFAULT_DARK_COLORS,
        };
      }

      const newSettings = {
        ...currentSettings,
        [mode]: colors,
      };

      const { error } = await supabase
        .from('theme_settings')
        .update({ value: newSettings as unknown as Json })
        .eq('key', 'colors');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
    },
  });
};
