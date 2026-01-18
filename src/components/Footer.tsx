import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublishedPages } from "@/hooks/usePublishedPages";
import { useLanguage } from "@/hooks/useLanguage";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useFooterSettings } from "@/hooks/useFooterSettings";

const Footer = () => {
  const { pages: publishedPages } = usePublishedPages();
  const { t, currentLanguage } = useLanguage();
  const { data: footerMenuItems = [] } = useMenuItems('footer');
  const { contact, social, branding } = useFooterSettings();
  const isEnglish = currentLanguage?.code === 'en';

  const socialLinks = [
    { icon: Facebook, href: social.facebook, label: 'Facebook' },
    { icon: Twitter, href: social.twitter, label: 'Twitter' },
    { icon: Instagram, href: social.instagram, label: 'Instagram' },
    { icon: Youtube, href: social.youtube, label: 'YouTube' },
  ].filter(link => link.href && link.href !== '#' && link.href.trim() !== '');

  // Use dynamic menu items from database
  const quickLinks = footerMenuItems.map(item => ({
    name: currentLanguage?.code === 'en' ? item.title : (item.title_ar || item.title),
    href: item.url,
    isExternal: item.is_external,
  }));

  return (
    <footer id="contact" className="bg-card border-t border-border">
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
              <h3 className="text-2xl font-bold text-gradient-gold font-playfair mb-4">
                {t('hero.title', 'ستارز إيجنسي')}
              </h3>
            )}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {isEnglish && branding.description_en 
                ? branding.description_en 
                : (branding.description || t('footer.description', 'الوكالة الرائدة في اكتشاف المواهب الكروية وربطها بأفضل الأندية حول العالم.'))}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((socialLink, index) => (
                  <a
                    key={index}
                    href={socialLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialLink.label}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-gold/20 hover:text-gold transition-colors"
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
            <h4 className="text-lg font-bold text-foreground mb-6">
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
                      className="text-muted-foreground hover:text-gold transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-gold transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-gold transition-colors"
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
            <h4 className="text-lg font-bold text-foreground mb-6">
              {t('footer.importantPages', 'صفحات مهمة')}
            </h4>
            <ul className="space-y-3">
              {publishedPages.length > 0 ? (
                publishedPages.map((page) => (
                  <li key={page.id}>
                    <Link
                      to={`/page/${page.slug}`}
                      className="text-muted-foreground hover:text-gold transition-colors"
                    >
                      {currentLanguage?.code === 'en' ? page.title : (page.title_ar || page.title)}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
                      {t('footer.privacy', 'سياسة الخصوصية')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
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
            <h4 className="text-lg font-bold text-foreground mb-6">
              {t('footer.contactUs', 'تواصل معنا')}
            </h4>
            <ul className="space-y-4">
              {(contact.location || contact.location_en) && (
                <li className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-gold flex-shrink-0" />
                  {isEnglish && contact.location_en ? contact.location_en : contact.location}
                </li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-gold transition-colors">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-gold transition-colors">
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border text-center text-muted-foreground text-sm">
          <p>© 2025 {t('hero.title', 'ستارز إيجنسي')}. {t('footer.rights', 'جميع الحقوق محفوظة')}.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
