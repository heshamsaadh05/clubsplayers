import { motion } from "framer-motion";
import { UserPlus, FileCheck, Search, Handshake, Shield, Globe, Zap, Award, Users, TrendingUp, Star, Trophy, User, Building2 } from "lucide-react";
import { usePageSections } from "@/hooks/usePageSections";
import { useLanguage } from "@/hooks/useLanguage";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Shield, Zap, Award, Users, TrendingUp, Star, Trophy, UserPlus, FileCheck, Search, Handshake, User, Building2
};

interface StepItem {
  icon: string;
  number: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
}

interface HowItWorksSettings {
  badge: string;
  badge_en: string;
  title_part1: string;
  title_part1_en: string;
  title_part2: string;
  title_part2_en: string;
  subtitle: string;
  subtitle_en: string;
  steps: StepItem[];
}

const defaultSteps: StepItem[] = [
  { icon: 'UserPlus', number: '01', title: 'سجّل حسابك', title_en: 'Create Account', description: 'أنشئ حسابك مجاناً وأضف جميع بياناتك الشخصية والرياضية', description_en: 'Create your free account and add all your personal and sports data' },
  { icon: 'FileCheck', number: '02', title: 'أكمل ملفك', title_en: 'Complete Profile', description: 'ارفع صورك ومقاطع الفيديو الخاصة بك وأضف تفاصيل نواديك السابقة', description_en: 'Upload your photos and videos and add details of your previous clubs' },
  { icon: 'Search', number: '03', title: 'انتظر الموافقة', title_en: 'Wait for Approval', description: 'يقوم فريقنا بمراجعة ملفك والتحقق من البيانات المقدمة', description_en: 'Our team reviews your file and verifies the submitted data' },
  { icon: 'Handshake', number: '04', title: 'احصل على فرص', title_en: 'Get Opportunities', description: 'بعد الموافقة، ستصلك عروض من أندية مهتمة بموهبتك', description_en: 'After approval, you will receive offers from clubs interested in your talent' },
];

const HowItWorks = () => {
  const { data: sections } = usePageSections('home');
  const { direction } = useLanguage();
  const isEnglish = direction === 'ltr';

  const howSection = sections?.find(s => s.section_key === 'how_it_works');
  const settings = (howSection?.settings || {}) as unknown as Partial<HowItWorksSettings>;

  const badge = isEnglish ? (settings.badge_en || 'How It Works?') : (settings.badge || 'كيف تعمل؟');
  const titlePart1 = isEnglish ? (settings.title_part1_en || 'Simple Steps ') : (settings.title_part1 || 'خطوات بسيطة ');
  const titlePart2 = isEnglish ? (settings.title_part2_en || 'To Get Started') : (settings.title_part2 || 'للانطلاق');
  const subtitle = isEnglish 
    ? (settings.subtitle_en || 'Start your journey towards professionalism in four easy steps') 
    : (settings.subtitle || 'ابدأ رحلتك نحو الاحتراف في أربع خطوات سهلة');

  const steps = settings.steps?.length ? settings.steps : defaultSteps;

  return (
    <section className="section-padding relative bg-card/50">
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

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = iconMap[step.icon] || UserPlus;
            const title = isEnglish ? (step.title_en || step.title) : step.title;
            const description = isEnglish ? (step.description_en || step.description) : step.description;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-l from-gold/50 to-transparent -translate-x-1/2" />
                )}

                <div className="text-center relative">
                  {/* Number */}
                  <div className="text-7xl font-bold text-gold/10 font-playfair mb-4">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-6 -mt-12 relative z-10 border border-gold/20">
                    <IconComponent className="w-8 h-8 text-gold" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
