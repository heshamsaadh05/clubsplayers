import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublishedPages } from "@/hooks/usePublishedPages";
import { useLanguage } from "@/hooks/useLanguage";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useFooterSettings } from "@/hooks/useFooterSettings";
import { SocialIcon } from "@/components/SocialIcon";

const Footer = () => {
  const { pages: publishedPages } = usePublishedPages();
  const { t, currentLanguage } = useLanguage();
  const { data: footerMenuItems = [] } = useMenuItems('footer');
  const { contact, socialAdvanced, branding, style } = useFooterSettings();
  const isEnglish = currentLanguage?.code === 'en';

  // Build social links array from advanced platforms
  // Note: we show enabled platforms even if URL is empty/# (admin may still be configuring links).
  const socialLinks = socialAdvanced.platforms
    .filter((p) => p.enabled)
    .sort((a, b) => a.order - b.order)
    .map((p) => {
      const href = (p.url || '').trim();
      const hasValidHref = href !== '' && href !== '#';

      return {
        id: p.id,
        href: hasValidHref ? href : null,
        label: isEnglish ? p.name : p.name_ar,
        iconUrl: p.icon_url,
      };
    });

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
                {socialLinks.map((socialLink) => {
                  const Icon = (
                    <SocialIcon
                      platformId={socialLink.id}
                      iconUrl={socialLink.iconUrl}
                      className="w-5 h-5"
                    />
                  );

                  return socialLink.href ? (
                    <a
                      key={socialLink.id}
                      href={socialLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={socialLink.label}
                      className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:opacity-80 transition-colors"
                      style={accentStyle}
                    >
                      {Icon}
                    </a>
                  ) : (
                    <span
                      key={socialLink.id}
                      aria-label={socialLink.label}
                      title={isEnglish ? 'Add link in admin' : 'أضف الرابط من لوحة التحكم'}
                      className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center opacity-80"
                      style={accentStyle}
                    >
                      {Icon}
                    </span>
                  );
                })}
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
