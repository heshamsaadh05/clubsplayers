import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

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
      return data?.value as unknown as ThemeColors;
    },
  });
};

export const useUpdateThemeSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (colors: ThemeColors) => {
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
