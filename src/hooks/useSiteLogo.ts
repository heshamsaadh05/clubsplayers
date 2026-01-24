import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

type LogoSize = 'small' | 'medium' | 'large';

interface SiteLogo {
  type: 'text' | 'image';
  image_url: string | null;
  light_image_url?: string | null;
  dark_image_url?: string | null;
  size?: LogoSize;
}

interface SiteName {
  en: string;
  ar: string;
}

interface SiteDescription {
  en: string;
  ar: string;
}

const LOGO_SIZE_CLASSES: Record<LogoSize, string> = {
  small: 'h-8',
  medium: 'h-10',
  large: 'h-14',
};

export const useSiteLogo = () => {
  const [logo, setLogo] = useState<SiteLogo>({ type: 'text', image_url: null });
  const [siteName, setSiteName] = useState<SiteName>({ en: 'Stars Agency', ar: 'ستارز إيجنسي' });
  const [siteDescription, setSiteDescription] = useState<SiteDescription>({ en: '', ar: '' });
  const [loading, setLoading] = useState(true);
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['site_logo', 'site_name', 'site_description']);

        if (error) throw error;

        data?.forEach((setting) => {
          if (setting.key === 'site_logo' && setting.value) {
            setLogo(setting.value as unknown as SiteLogo);
          } else if (setting.key === 'site_name' && setting.value) {
            setSiteName(setting.value as unknown as SiteName);
          } else if (setting.key === 'site_description' && setting.value) {
            setSiteDescription(setting.value as unknown as SiteDescription);
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

  // Update document title based on current language
  useEffect(() => {
    if (!loading && currentLanguage) {
      const isArabic = currentLanguage.code === 'ar';
      const name = isArabic ? (siteName.ar || siteName.en) : (siteName.en || siteName.ar);
      const description = isArabic ? (siteDescription.ar || siteDescription.en) : (siteDescription.en || siteDescription.ar);
      
      if (description) {
        document.title = `${name} | ${description}`;
      } else {
        document.title = name;
      }
    }
  }, [loading, currentLanguage, siteName, siteDescription]);

  // Get the appropriate logo URL based on theme mode
  const getLogoForMode = (isDarkMode: boolean): string | null => {
    if (logo.type !== 'image') return null;
    
    // If mode-specific logos exist, use them
    if (isDarkMode && logo.dark_image_url) {
      return logo.dark_image_url;
    }
    if (!isDarkMode && logo.light_image_url) {
      return logo.light_image_url;
    }
    
    // Fallback to the main image_url for backwards compatibility
    return logo.image_url;
  };

  const logoSizeClass = LOGO_SIZE_CLASSES[logo.size || 'medium'];

  return { logo, siteName, siteDescription, loading, getLogoForMode, logoSizeClass };
};
