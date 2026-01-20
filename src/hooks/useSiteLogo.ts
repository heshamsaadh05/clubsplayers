import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteLogo {
  type: 'text' | 'image';
  image_url: string | null;
}

interface SiteName {
  en: string;
  ar: string;
}

export const useSiteLogo = () => {
  const [logo, setLogo] = useState<SiteLogo>({ type: 'text', image_url: null });
  const [siteName, setSiteName] = useState<SiteName>({ en: 'Stars Agency', ar: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['site_logo', 'site_name']);

        if (error) throw error;

        data?.forEach((setting) => {
          if (setting.key === 'site_logo' && setting.value) {
            setLogo(setting.value as unknown as SiteLogo);
          } else if (setting.key === 'site_name' && setting.value) {
            setSiteName(setting.value as unknown as SiteName);
          }
        });
      } catch (error) {
        console.error('Error fetching site logo settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { logo, siteName, loading };
};
