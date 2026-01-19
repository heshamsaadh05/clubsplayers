import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FooterContact {
  phone: string;
  email: string;
  location: string;
  location_en: string;
}

export interface SocialPlatform {
  id: string;
  name: string;
  name_ar: string;
  url: string;
  enabled: boolean;
  order: number;
  icon_type: 'builtin' | 'custom';
  icon_url?: string;
}

export interface FooterSocial {
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  whatsapp: string;
  snapchat: string;
}

export interface FooterSocialAdvanced {
  platforms: SocialPlatform[];
}

export interface FooterBranding {
  logo_url: string;
  description: string;
  description_en: string;
}

export interface FooterStyle {
  background_color: string;
  text_color: string;
  accent_color: string;
  border_color: string;
}

// Default platforms configuration
export const defaultPlatforms: SocialPlatform[] = [
  { id: 'facebook', name: 'Facebook', name_ar: 'فيسبوك', url: '', enabled: true, order: 0, icon_type: 'builtin' },
  { id: 'twitter', name: 'Twitter / X', name_ar: 'تويتر / X', url: '', enabled: true, order: 1, icon_type: 'builtin' },
  { id: 'instagram', name: 'Instagram', name_ar: 'إنستغرام', url: '', enabled: true, order: 2, icon_type: 'builtin' },
  { id: 'youtube', name: 'YouTube', name_ar: 'يوتيوب', url: '', enabled: true, order: 3, icon_type: 'builtin' },
  { id: 'tiktok', name: 'TikTok', name_ar: 'تيك توك', url: '', enabled: true, order: 4, icon_type: 'builtin' },
  { id: 'whatsapp', name: 'WhatsApp', name_ar: 'واتساب', url: '', enabled: true, order: 5, icon_type: 'builtin' },
  { id: 'snapchat', name: 'Snapchat', name_ar: 'سناب شات', url: '', enabled: true, order: 6, icon_type: 'builtin' },
  { id: 'linkedin', name: 'LinkedIn', name_ar: 'لينكد إن', url: '', enabled: false, order: 7, icon_type: 'builtin' },
  { id: 'telegram', name: 'Telegram', name_ar: 'تيليجرام', url: '', enabled: false, order: 8, icon_type: 'builtin' },
  { id: 'pinterest', name: 'Pinterest', name_ar: 'بينترست', url: '', enabled: false, order: 9, icon_type: 'builtin' },
];

export const useFooterSettings = () => {
  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ['footer-contact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_contact')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as FooterContact;
    },
  });

  const { data: social, isLoading: socialLoading } = useQuery({
    queryKey: ['footer-social'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_social')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as FooterSocial;
    },
  });

  const { data: socialAdvanced, isLoading: socialAdvancedLoading } = useQuery({
    queryKey: ['footer-social-advanced'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_social_advanced')
        .single();
      
      if (error) return null;
      return data?.value as unknown as FooterSocialAdvanced;
    },
  });

  const { data: branding, isLoading: brandingLoading } = useQuery({
    queryKey: ['footer-branding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_branding')
        .single();
      
      if (error) throw error;
      return data?.value as unknown as FooterBranding;
    },
  });

  const { data: style, isLoading: styleLoading } = useQuery({
    queryKey: ['footer-style'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_style')
        .single();
      
      if (error) return null;
      return data?.value as unknown as FooterStyle;
    },
  });

  // Merge old social format with new advanced format
  const getPlatforms = (): SocialPlatform[] => {
    if (socialAdvanced?.platforms) {
      return socialAdvanced.platforms;
    }
    
    // Migrate from old format
    if (social) {
      const socialRecord = social as unknown as Record<string, string>;
      return defaultPlatforms.map(platform => ({
        ...platform,
        url: socialRecord[platform.id] || '',
      }));
    }
    
    return defaultPlatforms;
  };

  return {
    contact: contact || { phone: '', email: '', location: '', location_en: '' },
    social: social || { facebook: '', twitter: '', instagram: '', youtube: '', tiktok: '', whatsapp: '', snapchat: '' },
    socialAdvanced: { platforms: getPlatforms() },
    branding: branding || { logo_url: '', description: '', description_en: '' },
    style: style || { background_color: '', text_color: '', accent_color: '', border_color: '' },
    isLoading: contactLoading || socialLoading || socialAdvancedLoading || brandingLoading || styleLoading,
  };
};
