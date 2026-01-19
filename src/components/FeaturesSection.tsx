import { motion } from "framer-motion";
import { Shield, Globe, Zap, Award, Users, TrendingUp, Star, Trophy, UserPlus, FileCheck, Search, Handshake, User, Building2 } from "lucide-react";
import { usePageSections } from "@/hooks/usePageSections";
import { useLanguage } from "@/hooks/useLanguage";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Shield, Zap, Award, Users, TrendingUp, Star, Trophy, UserPlus, FileCheck, Search, Handshake, User, Building2
};

interface FeatureItem {
  icon: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
}

interface FeaturesSettings {
  badge: string;
  badge_en: string;
  title_part1: string;
  title_part1_en: string;
  title_part2: string;
  title_part2_en: string;
  subtitle: string;
  subtitle_en: string;
  features: FeatureItem[];
}

const defaultFeatures: FeatureItem[] = [
  { icon: 'Globe', title: 'شبكة عالمية', title_en: 'Global Network', description: 'نملك علاقات قوية مع أندية في أوروبا وآسيا وأفريقيا لفتح أبواب الاحتراف أمامك', description_en: 'We have strong relationships with clubs in Europe, Asia and Africa' },
  { icon: 'Shield', title: 'حماية حقوقك', title_en: 'Protect Your Rights', description: 'فريق قانوني متخصص لضمان حقوقك في جميع العقود والصفقات', description_en: 'Specialized legal team to protect your rights in all contracts' },
  { icon: 'Zap', title: 'استجابة سريعة', title_en: 'Quick Response', description: 'نتابع ملفك بشكل مستمر ونوفر لك الفرص المناسبة بأسرع وقت', description_en: 'We follow up on your file continuously and provide you with opportunities' },
  { icon: 'Award', title: 'تقييم احترافي', title_en: 'Professional Evaluation', description: 'نقدم تقييماً شاملاً لمهاراتك ونساعدك في تطويرها', description_en: 'We provide a comprehensive evaluation of your skills' },
  { icon: 'Users', title: 'دعم متكامل', title_en: 'Full Support', description: 'فريق متخصص لمساعدتك في جميع الجوانب الإدارية والتسويقية', description_en: 'Specialized team to help you in all aspects' },
  { icon: 'TrendingUp', title: 'تطوير مستمر', title_en: 'Continuous Development', description: 'برامج تدريبية وإرشادية لتحسين أدائك والارتقاء بمستواك', description_en: 'Training and guidance programs to improve your performance' },
];

const FeaturesSection = () => {
  const { data: sections } = usePageSections('home');
  const { direction } = useLanguage();
  const isEnglish = direction === 'ltr';

  const featuresSection = sections?.find(s => s.section_key === 'features');
  const settings = (featuresSection?.settings || {}) as unknown as Partial<FeaturesSettings>;

  const badge = isEnglish ? (settings.badge_en || 'Why Us?') : (settings.badge || 'لماذا نحن؟');
  const titlePart1 = isEnglish ? (settings.title_part1_en || 'Professional ') : (settings.title_part1 || 'خدمات ');
  const titlePart2 = isEnglish ? (settings.title_part2_en || 'Integrated Services') : (settings.title_part2 || 'احترافية متكاملة');
  const subtitle = isEnglish 
    ? (settings.subtitle_en || 'We offer you a comprehensive range of services that guarantee a successful professional career') 
    : (settings.subtitle || 'نقدم لك مجموعة شاملة من الخدمات التي تضمن لك مسيرة احترافية ناجحة');

  const features = settings.features?.length ? settings.features : defaultFeatures;

  return (
    <section id="services" className="section-padding relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--gold)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-gold text-sm font-medium tracking-wider uppercase mb-4 block">
            {badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">{titlePart1}</span>
            <span className="text-gradient-gold">{titlePart2}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {subtitle}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Globe;
            const title = isEnglish ? (feature.title_en || feature.title) : feature.title;
            const description = isEnglish ? (feature.description_en || feature.description) : feature.description;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="card-glass rounded-2xl p-8 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                  <IconComponent className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
