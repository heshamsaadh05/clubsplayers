import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SliderSettings {
  id: string;
  slider_key: string;
  auto_play: boolean;
  auto_play_interval: number;
  show_navigation: boolean;
  show_dots: boolean;
  items_per_view: number;
}

interface SliderItem {
  id: string;
  slider_key: string;
  title: string | null;
  title_ar: string | null;
  subtitle: string | null;
  subtitle_ar: string | null;
  image_url: string | null;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
}

export const useSliderSettings = (sliderKey: string) => {
  return useQuery({
    queryKey: ['slider-settings', sliderKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slider_settings')
        .select('*')
        .eq('slider_key', sliderKey)
        .single();

      if (error) throw error;
      return data as SliderSettings;
    },
  });
};

export const useUpdateSliderSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slider_key, ...updates }: Partial<SliderSettings> & { slider_key: string }) => {
      const { error } = await supabase
        .from('slider_settings')
        .update(updates)
        .eq('slider_key', slider_key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slider-settings'] });
    },
  });
};

export const useSliderItems = (sliderKey: string) => {
  return useQuery({
    queryKey: ['slider-items', sliderKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slider_items')
        .select('*')
        .eq('slider_key', sliderKey)
        .order('order_index');

      if (error) throw error;
      return data as SliderItem[];
    },
  });
};

export const useAddSliderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: { 
      slider_key: string;
      title?: string;
      title_ar?: string;
      subtitle?: string;
      subtitle_ar?: string;
      image_url?: string;
      link_url?: string;
      order_index?: number;
      is_active?: boolean;
    }) => {
      const { error } = await supabase
        .from('slider_items')
        .insert(item);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slider-items'] });
    },
  });
};

export const useUpdateSliderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      title?: string;
      title_ar?: string;
      subtitle?: string;
      subtitle_ar?: string;
      image_url?: string;
      link_url?: string;
      order_index?: number;
      is_active?: boolean;
    }) => {
      const { error } = await supabase
        .from('slider_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slider-items'] });
    },
  });
};

export const useDeleteSliderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('slider_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slider-items'] });
    },
  });
};
