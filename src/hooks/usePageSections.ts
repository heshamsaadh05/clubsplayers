import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface PageSection {
  id: string;
  page_key: string;
  section_key: string;
  is_visible: boolean;
  order_index: number;
  settings: Json;
}

export const usePageSections = (pageKey: string) => {
  return useQuery({
    queryKey: ['page-sections', pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_key', pageKey)
        .order('order_index');

      if (error) throw error;
      return data as PageSection[];
    },
  });
};

export const useAllPageSections = () => {
  return useQuery({
    queryKey: ['page-sections', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .order('page_key')
        .order('order_index');

      if (error) throw error;
      return data as PageSection[];
    },
  });
};

export const useUpdatePageSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_visible?: boolean; order_index?: number }) => {
      const { error } = await supabase
        .from('page_sections')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-sections'] });
    },
  });
};

export const useAddPageSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (section: { page_key: string; section_key: string; is_visible?: boolean; order_index?: number }) => {
      const { error } = await supabase
        .from('page_sections')
        .insert(section);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-sections'] });
    },
  });
};

export const useDeletePageSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('page_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-sections'] });
    },
  });
};
