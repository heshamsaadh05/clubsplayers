import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MenuItem {
  id: string;
  title: string;
  title_ar: string | null;
  url: string;
  location: 'header' | 'footer' | 'both';
  is_external: boolean;
  order_index: number;
  is_active: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export type MenuItemInsert = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;
export type MenuItemUpdate = Partial<MenuItemInsert>;

export const useMenuItems = (location?: 'header' | 'footer') => {
  return useQuery({
    queryKey: ['menu-items', location],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (location) {
        query = query.or(`location.eq.${location},location.eq.both`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MenuItem[];
    },
  });
};

export const useAllMenuItems = () => {
  return useQuery({
    queryKey: ['menu-items', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('location', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as MenuItem[];
    },
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: MenuItemInsert) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('تم إضافة عنصر القائمة بنجاح');
    },
    onError: (error) => {
      toast.error('حدث خطأ أثناء إضافة عنصر القائمة');
      console.error(error);
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MenuItemUpdate }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('تم تحديث عنصر القائمة بنجاح');
    },
    onError: (error) => {
      toast.error('حدث خطأ أثناء تحديث عنصر القائمة');
      console.error(error);
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('تم حذف عنصر القائمة بنجاح');
    },
    onError: (error) => {
      toast.error('حدث خطأ أثناء حذف عنصر القائمة');
      console.error(error);
    },
  });
};
