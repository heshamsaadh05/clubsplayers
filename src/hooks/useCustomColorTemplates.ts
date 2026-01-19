import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomColorTemplate {
  id: string;
  name: string;
  colors: Record<string, string>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useCustomColorTemplates = () => {
  return useQuery({
    queryKey: ['custom_color_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_color_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CustomColorTemplate[];
    },
  });
};

export const useAddCustomColorTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, colors }: { name: string; colors: Record<string, string> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('custom_color_templates')
        .insert({
          name,
          colors,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_color_templates'] });
    },
  });
};

export const useUpdateCustomColorTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name, colors }: { id: string; name?: string; colors?: Record<string, string> }) => {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (colors !== undefined) updates.colors = colors;
      
      const { error } = await supabase
        .from('custom_color_templates')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_color_templates'] });
    },
  });
};

export const useDeleteCustomColorTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_color_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_color_templates'] });
    },
  });
};
