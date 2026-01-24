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

const LOCAL_STORAGE_KEY = 'theme-mode-preference';

// Get theme from localStorage for non-authenticated users
const getLocalStorageTheme = (): ThemeMode | null => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as ThemeMode;
    }
  } catch {
    // localStorage not available
  }
  return null;
};

// Save theme to localStorage
const setLocalStorageTheme = (mode: ThemeMode) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, mode);
  } catch {
    // localStorage not available
  }
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
      // NOTE: For public/guest browsing we don't want theme mode reads to break the UI.
      // If the record doesn't exist (or response shape is unexpected), fall back safely.
      const { data, error } = await supabase
        .from('theme_settings')
        .select('value')
        .eq('key', 'mode_settings')
        .single();

      if (error) return DEFAULT_SETTINGS;
      if (!data?.value) return DEFAULT_SETTINGS;
      return data.value as unknown as ThemeModeSettings;
    },
  });
};

export const useUpdateThemeModeSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<ThemeModeSettings>) => {
      // Guests should not attempt DB writes; localStorage already covers them.
      const { data: sessionData } = await supabase.auth.getSession();
      const isAuthed = !!sessionData?.session;

      // Get current settings
      const { data: existing, error: existingError } = await supabase
        .from('theme_settings')
        .select('value')
        .eq('key', 'mode_settings')
        .single();
      
      const currentSettings = !existingError && existing?.value
        ? (existing.value as unknown as ThemeModeSettings)
        : DEFAULT_SETTINGS;
      const newSettings = { ...currentSettings, ...settings };

      if (!isAuthed) return newSettings;
      
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
  const { data: settings, isLoading } = useThemeModeSettings();
  const [hasLocalPreference, setHasLocalPreference] = useState<boolean>(() => {
    return !!getLocalStorageTheme();
  });
  
  // Initialize from localStorage first, then use database settings
  const [localMode, setLocalMode] = useState<ThemeMode>(() => {
    return getLocalStorageTheme() || 'dark';
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const initialMode = getLocalStorageTheme() || 'dark';
    return getResolvedTheme(initialMode);
  });

  // Get effective mode (localStorage takes priority for quick loading, then database)
  const effectiveMode = hasLocalPreference ? localMode : (settings?.mode || localMode);
  
  const applyTheme = useCallback((theme: 'light' | 'dark', skipTransition = false) => {
    setResolvedTheme(theme);
    const root = document.documentElement;
    
    // Temporarily disable transitions to prevent flash on initial load
    if (skipTransition) {
      root.classList.add('no-transition');
    }
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Re-enable transitions after a short delay
    if (skipTransition) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.remove('no-transition');
        });
      });
    }
  }, []);

  const updateTheme = useCallback(() => {
    let newTheme: 'light' | 'dark';
    
    // If the user explicitly picked a mode, don't override it with time-based auto switch.
    if (!hasLocalPreference && settings?.autoSwitch) {
      newTheme = getThemeByTime(settings.lightStart, settings.darkStart);
    } else {
      newTheme = getResolvedTheme(effectiveMode);
    }
    
    applyTheme(newTheme);
  }, [settings, effectiveMode, applyTheme, hasLocalPreference]);

  // Apply theme immediately on mount from localStorage (skip transition to prevent flash)
  useEffect(() => {
    const storedMode = getLocalStorageTheme();
    if (storedMode) {
      applyTheme(getResolvedTheme(storedMode), true);
    } else {
      // Apply default theme without transition on first load
      applyTheme(getResolvedTheme('dark'), true);
    }
  }, [applyTheme]);

  // Update theme when settings change
  useEffect(() => {
    if (!isLoading) {
      updateTheme();
    }
  }, [updateTheme, isLoading]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (effectiveMode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => updateTheme();
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [effectiveMode, updateTheme]);
  
  // Auto-switch based on time
  useEffect(() => {
    if (hasLocalPreference) return;
    if (!settings?.autoSwitch) return;
    
    // Check every minute
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, [settings?.autoSwitch, updateTheme, hasLocalPreference]);
  
  return {
    mode: effectiveMode,
    resolvedTheme,
    autoSwitch: settings?.autoSwitch || false,
    settings: settings || DEFAULT_SETTINGS,
    setLocalMode: (mode: ThemeMode) => {
      setHasLocalPreference(true);
      setLocalMode(mode);
      setLocalStorageTheme(mode);
      applyTheme(getResolvedTheme(mode));
    },
  };
};
