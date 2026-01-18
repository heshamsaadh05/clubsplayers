import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FooterContact {
  phone: string;
  email: string;
  location: string;
  location_en: string;
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

  return {
    contact: contact || { phone: '', email: '', location: '', location_en: '' },
    social: social || { facebook: '', twitter: '', instagram: '', youtube: '', tiktok: '', whatsapp: '', snapchat: '' },
    branding: branding || { logo_url: '', description: '', description_en: '' },
    style: style || { background_color: '', text_color: '', accent_color: '', border_color: '' },
    isLoading: contactLoading || socialLoading || brandingLoading || styleLoading,
  };
};
