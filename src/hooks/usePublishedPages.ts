import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PublishedPage {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  order_index: number;
}

export const usePublishedPages = () => {
  const [pages, setPages] = useState<PublishedPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('id, slug, title, title_ar, order_index')
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setPages(data || []);
      } catch (error) {
        console.error('Error fetching published pages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  return { pages, loading };
};
