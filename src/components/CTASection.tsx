import { motion } from "framer-motion";
import { ArrowLeft, User, Building2, Shield, Globe, Zap, Award, Users, TrendingUp, Star, Trophy, UserPlus, FileCheck, Search, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePageSections } from "@/hooks/usePageSections";
import { useLanguage } from "@/hooks/useLanguage";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Shield, Zap, Award, Users, TrendingUp, Star, Trophy, UserPlus, FileCheck, Search, Handshake, User, Building2
};

interface CTACard {
  icon: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  button_text: string;
  button_text_en: string;
  button_link: string;
  variant: 'primary' | 'outline';
}

interface CTASettings {
  cards: CTACard[];
}

const defaultCards: CTACard[] = [
  { 
    icon: 'User', 
    title: 'هل أنت لاعب موهوب؟', 
    title_en: 'Are you a talented player?', 
    description: 'انضم إلينا الآن وافتح أبواب الاحتراف. سجّل ملفك واجعل موهبتك مرئية لأفضل الأندية.', 
    description_en: 'Join us now and open the doors to professionalism. Register your profile and make your talent visible.',
    button_text: 'سجّل كلاعب',
    button_text_en: 'Register as Player',
    button_link: '/player-registration',
    variant: 'primary'
  },
  { 
    icon: 'Building2', 
    title: 'تبحث عن مواهب جديدة؟', 
    title_en: 'Looking for new talents?', 
    description: 'اشترك في باقاتنا الحصرية واحصل على وصول كامل لقاعدة بيانات اللاعبين الموهوبين.', 
    description_en: 'Subscribe to our exclusive packages and get full access to the talented players database.',
    button_text: 'انضم كنادي',
    button_text_en: 'Join as Club',
    button_link: '/club-registration',
    variant: 'outline'
  },
];

const CTASection = () => {
  const { data: sections } = usePageSections('home');
  const { direction } = useLanguage();
  const isEnglish = direction === 'ltr';

  const ctaSection = sections?.find(s => s.section_key === 'cta');
  const settings = (ctaSection?.settings || {}) as unknown as Partial<CTASettings>;

  const cards = settings.cards?.length ? settings.cards : defaultCards;

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-background to-background" />
      
      {/* Glow Effects */}
      <div className="hero-glow top-0 right-1/4 animate-glow" />
      <div className="hero-glow bottom-0 left-1/4 animate-glow" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {cards.map((card, index) => {
            const IconComponent = iconMap[card.icon] || User;
            const title = isEnglish ? (card.title_en || card.title) : card.title;
            const description = isEnglish ? (card.description_en || card.description) : card.description;
            const buttonText = isEnglish ? (card.button_text_en || card.button_text) : card.button_text;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index === 0 ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`card-glass rounded-3xl p-8 md:p-12 text-center ${card.variant === 'outline' ? 'border-gold/20' : ''}`}
              >
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                  <IconComponent className="w-10 h-10 text-gold" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  {title}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {description}
                </p>
                {card.variant === 'primary' ? (
                  <Button size="lg" className="btn-gold rounded-full text-lg px-8 py-6" asChild>
                    <Link to={card.button_link}>
                      {buttonText}
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full text-lg px-8 py-6 border-gold text-gold hover:bg-gold hover:text-primary-foreground"
                    asChild
                  >
                    <Link to={card.button_link}>
                      {buttonText}
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Link>
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
