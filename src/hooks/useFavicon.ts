import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useThemeMode } from './useThemeMode';

interface FaviconSettings {
  light_url: string | null;
  dark_url: string | null;
}

export const useFavicon = () => {
  const [favicon, setFavicon] = useState<FaviconSettings>({ light_url: null, dark_url: null });
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useThemeMode();
  const isDarkMode = resolvedTheme === 'dark';

  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'site_favicon')
          .maybeSingle();

        if (error) throw error;
        if (data?.value) {
          setFavicon(data.value as unknown as FaviconSettings);
        }
      } catch (error) {
        console.error('Error fetching favicon settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavicon();
  }, []);

  // Apply favicon based on theme
  useEffect(() => {
    const faviconUrl = isDarkMode ? favicon.dark_url : favicon.light_url;
    
    if (faviconUrl) {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());

      // Add new favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = faviconUrl;
      document.head.appendChild(link);

      // Also add apple-touch-icon
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = faviconUrl;
      document.head.appendChild(appleLink);
    }
  }, [favicon, isDarkMode]);

  return { favicon, loading };
};
