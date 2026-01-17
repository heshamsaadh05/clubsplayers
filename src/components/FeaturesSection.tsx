import { motion } from "framer-motion";
import { Shield, Globe, Zap, Award, Users, TrendingUp } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Globe,
      title: "شبكة عالمية",
      description: "نملك علاقات قوية مع أندية في أوروبا وآسيا وأفريقيا لفتح أبواب الاحتراف أمامك",
    },
    {
      icon: Shield,
      title: "حماية حقوقك",
      description: "فريق قانوني متخصص لضمان حقوقك في جميع العقود والصفقات",
    },
    {
      icon: Zap,
      title: "استجابة سريعة",
      description: "نتابع ملفك بشكل مستمر ونوفر لك الفرص المناسبة بأسرع وقت",
    },
    {
      icon: Award,
      title: "تقييم احترافي",
      description: "نقدم تقييماً شاملاً لمهاراتك ونساعدك في تطويرها",
    },
    {
      icon: Users,
      title: "دعم متكامل",
      description: "فريق متخصص لمساعدتك في جميع الجوانب الإدارية والتسويقية",
    },
    {
      icon: TrendingUp,
      title: "تطوير مستمر",
      description: "برامج تدريبية وإرشادية لتحسين أدائك والارتقاء بمستواك",
    },
  ];

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
            لماذا نحن؟
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">خدمات </span>
            <span className="text-gradient-gold">احترافية متكاملة</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            نقدم لك مجموعة شاملة من الخدمات التي تضمن لك مسيرة احترافية ناجحة
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="card-glass rounded-2xl p-8 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                <feature.icon className="w-7 h-7 text-gold" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
