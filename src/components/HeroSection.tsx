import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Star, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { usePageSections } from "@/hooks/usePageSections";
import heroPlayerDefault from "@/assets/hero-player.jpg";

interface HeroSectionProps {
  backgroundImage?: string;
}

// Helper to detect if URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

const HeroSection = ({ backgroundImage }: HeroSectionProps) => {
  const { t, direction } = useLanguage();
  const { data: sections } = usePageSections('home');
  const heroSection = sections?.find(s => s.section_key === 'hero');
  const heroSettings = (heroSection?.settings || {}) as Record<string, unknown>;
  
  // Media settings
  const heroVideo = (heroSettings.background_video as string) || '';
  const heroImage = backgroundImage || (heroSettings.background_image as string) || heroPlayerDefault;
  const useVideo = heroVideo && isVideoUrl(heroVideo);
  const mediaOpacity = (heroSettings.media_opacity as number) ?? 40; // Default 40%
  
  // Dynamic texts from settings
  const isArabic = direction === 'rtl';
  const badge = isArabic 
    ? (heroSettings.badge_ar as string) || t('hero.badge', 'وكالة اللاعبين الأولى في الوطن العربي')
    : (heroSettings.badge as string) || t('hero.badge', 'The Premier Player Agency');
  const titleLine1 = isArabic
    ? (heroSettings.title_line1_ar as string) || t('hero.title.line1', 'اكتشف موهبتك')
    : (heroSettings.title_line1 as string) || t('hero.title.line1', 'Discover Your Talent');
  const titleLine2 = isArabic
    ? (heroSettings.title_line2_ar as string) || t('hero.title.line2', 'وحقق حلمك الكروي')
    : (heroSettings.title_line2 as string) || t('hero.title.line2', 'Achieve Your Football Dream');
  const subtitle = isArabic
    ? (heroSettings.subtitle_ar as string) || t('hero.subtitle', 'نربط بين المواهب الكروية الناشئة وأفضل الأندية حول العالم. نساعدك في بناء مسيرتك الاحترافية وتحقيق أحلامك في عالم كرة القدم.')
    : (heroSettings.subtitle as string) || t('hero.subtitle', 'We connect emerging football talents with the best clubs around the world.');
  const stats = [{
    icon: Users,
    value: (heroSettings.stat_players_value as string) || "+500",
    label: isArabic 
      ? (heroSettings.stat_players_label_ar as string) || t('hero.stats.players', 'لاعب محترف')
      : (heroSettings.stat_players_label as string) || t('hero.stats.players', 'Pro Players')
  }, {
    icon: Trophy,
    value: (heroSettings.stat_clubs_value as string) || "+120",
    label: isArabic
      ? (heroSettings.stat_clubs_label_ar as string) || t('hero.stats.clubs', 'نادي شريك')
      : (heroSettings.stat_clubs_label as string) || t('hero.stats.clubs', 'Partner Clubs')
  }, {
    icon: Star,
    value: (heroSettings.stat_deals_value as string) || "+50",
    label: isArabic
      ? (heroSettings.stat_deals_label_ar as string) || t('hero.stats.deals', 'صفقة ناجحة')
      : (heroSettings.stat_deals_label as string) || t('hero.stats.deals', 'Successful Deals')
  }];
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  return <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Media (Video or Image) */}
      <div className="absolute inset-0 z-0">
        {useVideo ? (
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ opacity: mediaOpacity / 100 }}
          />
        ) : (
          <img 
            src={heroImage} 
            alt="Football Player" 
            className="w-full h-full object-cover" 
            style={{ opacity: mediaOpacity / 100 }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      {/* Glow Effects */}
      <div className="hero-glow top-1/4 right-1/4 animate-glow" />
      <div className="hero-glow bottom-1/4 left-1/4 animate-glow" style={{
      animationDelay: "1.5s"
    }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="inline-flex items-center gap-2 border rounded-full px-4 py-2 mb-8 bg-primary border-secondary">
            <Star className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-secondary">
              {badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1 initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.2
        }} className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">{titleLine1}</span>
            <br />
            <span className="text-gradient-gold">{titleLine2}</span>
          </motion.h1>

          {/* Description */}
          <motion.p initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.4
        }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {subtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.6
        }} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="btn-gold rounded-full text-lg px-8 py-6" asChild>
              <Link to="/player-registration">
                {t('hero.cta.player', 'سجّل كلاعب الآن')}
                <ArrowIcon className={`w-5 h-5 ${direction === 'rtl' ? 'mr-2' : 'ml-2'}`} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-lg px-8 py-6 border-gold/50 text-gold hover:bg-gold/10" asChild>
              <Link to="/browse-players">
                {t('hero.cta.browse', 'تصفح اللاعبين')}
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.8
        }} className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => <motion.div key={stat.label} initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.5,
            delay: 1 + index * 0.1
          }} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-gold" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>)}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 1.5
    }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{
        y: [0, 10, 0]
      }} transition={{
        duration: 2,
        repeat: Infinity
      }} className="w-6 h-10 rounded-full border-2 border-gold/50 flex justify-center">
          <motion.div animate={{
          y: [0, 12, 0]
        }} transition={{
          duration: 2,
          repeat: Infinity
        }} className="w-1.5 h-3 bg-gold rounded-full mt-2" />
        </motion.div>
      </motion.div>
    </section>;
};
export default HeroSection;