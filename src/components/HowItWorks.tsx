import { motion } from "framer-motion";
import { UserPlus, FileCheck, Search, Handshake } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      number: "01",
      title: "سجّل حسابك",
      description: "أنشئ حسابك مجاناً وأضف جميع بياناتك الشخصية والرياضية",
    },
    {
      icon: FileCheck,
      number: "02",
      title: "أكمل ملفك",
      description: "ارفع صورك ومقاطع الفيديو الخاصة بك وأضف تفاصيل نواديك السابقة",
    },
    {
      icon: Search,
      number: "03",
      title: "انتظر الموافقة",
      description: "يقوم فريقنا بمراجعة ملفك والتحقق من البيانات المقدمة",
    },
    {
      icon: Handshake,
      number: "04",
      title: "احصل على فرص",
      description: "بعد الموافقة، ستصلك عروض من أندية مهتمة بموهبتك",
    },
  ];

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
            كيف تعمل؟
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">خطوات بسيطة </span>
            <span className="text-gradient-gold">للانطلاق</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            ابدأ رحلتك نحو الاحتراف في أربع خطوات سهلة
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
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
                  <step.icon className="w-8 h-8 text-gold" />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
