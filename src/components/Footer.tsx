import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublishedPages } from "@/hooks/usePublishedPages";
import { useLanguage } from "@/hooks/useLanguage";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useFooterSettings } from "@/hooks/useFooterSettings";

// Custom TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Custom Snapchat icon
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-.809-.329-1.224-.72-1.227-1.153-.007-.359.285-.69.735-.838.149-.06.344-.09.509-.09.12 0 .285.015.45.074.36.12.735.269 1.017.299.196.016.389-.045.463-.074-.007-.165-.017-.331-.027-.51l-.004-.06c-.104-1.628-.229-3.654.3-4.847 1.582-3.545 4.939-3.821 5.928-3.821h.012z"/>
  </svg>
);

const Footer = () => {
  const { pages: publishedPages } = usePublishedPages();
  const { t, currentLanguage } = useLanguage();
  const { data: footerMenuItems = [] } = useMenuItems('footer');
  const { contact, social, branding, style } = useFooterSettings();
  const isEnglish = currentLanguage?.code === 'en';

  // Build social links array with all platforms
  const socialLinks = [
    { icon: Facebook, href: social.facebook, label: 'Facebook' },
    { icon: Twitter, href: social.twitter, label: 'Twitter' },
    { icon: Instagram, href: social.instagram, label: 'Instagram' },
    { icon: Youtube, href: social.youtube, label: 'YouTube' },
    { icon: TikTokIcon, href: social.tiktok, label: 'TikTok' },
    { icon: MessageCircle, href: social.whatsapp, label: 'WhatsApp' },
    { icon: SnapchatIcon, href: social.snapchat, label: 'Snapchat' },
  ].filter(link => link.href && link.href !== '#' && link.href.trim() !== '');

  // Use dynamic menu items from database
  const quickLinks = footerMenuItems.map(item => ({
    name: currentLanguage?.code === 'en' ? item.title : (item.title_ar || item.title),
    href: item.url,
    isExternal: item.is_external,
  }));

  // Apply custom styles if set
  const hasCustomStyles = style.background_color || style.text_color;
  const footerStyle = hasCustomStyles ? {
    backgroundColor: style.background_color || undefined,
    borderColor: style.border_color || undefined,
  } : {};

  const textStyle = style.text_color ? { color: style.text_color } : {};
  const accentStyle = style.accent_color ? { color: style.accent_color } : {};
  const mutedTextClass = style.text_color ? '' : 'text-muted-foreground';
  const headingClass = style.text_color ? '' : 'text-foreground';

  return (
    <footer 
      id="contact" 
      className={hasCustomStyles ? 'border-t' : 'bg-card border-t border-border'}
      style={footerStyle}
    >
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="h-12 mb-4" />
            ) : (
              <h3 
                className="text-2xl font-bold font-playfair mb-4"
                style={style.accent_color ? accentStyle : undefined}
              >
                <span className={style.accent_color ? '' : 'text-gradient-gold'}>
                  {t('hero.title', 'ستارز إيجنسي')}
                </span>
              </h3>
            )}
            <p className={`mb-6 leading-relaxed ${mutedTextClass}`} style={textStyle}>
              {isEnglish && branding.description_en 
                ? branding.description_en 
                : (branding.description || t('footer.description', 'الوكالة الرائدة في اكتشاف المواهب الكروية وربطها بأفضل الأندية حول العالم.'))}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {socialLinks.map((socialLink, index) => (
                  <a
                    key={index}
                    href={socialLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialLink.label}
                    className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:opacity-80 transition-colors"
                    style={accentStyle}
                  >
                    <socialLink.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className={`text-lg font-bold mb-6 ${headingClass}`} style={textStyle}>
              {t('footer.quickLinks', 'روابط سريعة')}
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  {link.isExternal ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${mutedTextClass} hover:opacity-80 transition-colors`}
                      style={textStyle}
                    >
                      {link.name}
                    </a>
                  ) : link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className={`${mutedTextClass} hover:opacity-80 transition-colors`}
                      style={textStyle}
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className={`${mutedTextClass} hover:opacity-80 transition-colors`}
                      style={textStyle}
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Published Pages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className={`text-lg font-bold mb-6 ${headingClass}`} style={textStyle}>
              {t('footer.importantPages', 'صفحات مهمة')}
            </h4>
            <ul className="space-y-3">
              {publishedPages.length > 0 ? (
                publishedPages.map((page) => (
                  <li key={page.id}>
                    <Link
                      to={`/page/${page.slug}`}
                      className={`${mutedTextClass} hover:opacity-80 transition-colors`}
                      style={textStyle}
                    >
                      {currentLanguage?.code === 'en' ? page.title : (page.title_ar || page.title)}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <a 
                      href="#" 
                      className={`${mutedTextClass} hover:opacity-80 transition-colors`}
                      style={textStyle}
                    >
                      {t('footer.privacy', 'سياسة الخصوصية')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className={`${mutedTextClass} hover:opacity-80 transition-colors`}
                      style={textStyle}
                    >
                      {t('footer.terms', 'الشروط والأحكام')}
                    </a>
                  </li>
                </>
              )}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className={`text-lg font-bold mb-6 ${headingClass}`} style={textStyle}>
              {t('footer.contactUs', 'تواصل معنا')}
            </h4>
            <ul className="space-y-4">
              {(contact.location || contact.location_en) && (
                <li className={`flex items-center gap-3 ${mutedTextClass}`} style={textStyle}>
                  <MapPin className="w-5 h-5 flex-shrink-0" style={accentStyle} />
                  {isEnglish && contact.location_en ? contact.location_en : contact.location}
                </li>
              )}
              {contact.phone && (
                <li className={`flex items-center gap-3 ${mutedTextClass}`} style={textStyle}>
                  <Phone className="w-5 h-5 flex-shrink-0" style={accentStyle} />
                  <a href={`tel:${contact.phone}`} className="hover:opacity-80 transition-colors">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className={`flex items-center gap-3 ${mutedTextClass}`} style={textStyle}>
                  <Mail className="w-5 h-5 flex-shrink-0" style={accentStyle} />
                  <a href={`mailto:${contact.email}`} className="hover:opacity-80 transition-colors">
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div 
          className={`py-6 border-t text-center text-sm ${mutedTextClass}`}
          style={{ 
            borderColor: style.border_color || undefined,
            ...textStyle
          }}
        >
          <p>© 2025 {t('hero.title', 'ستارز إيجنسي')}. {t('footer.rights', 'جميع الحقوق محفوظة')}.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
