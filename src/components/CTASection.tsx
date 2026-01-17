import { motion } from "framer-motion";
import { ArrowLeft, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-background to-background" />
      
      {/* Glow Effects */}
      <div className="hero-glow top-0 right-1/4 animate-glow" />
      <div className="hero-glow bottom-0 left-1/4 animate-glow" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* For Players */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="card-glass rounded-3xl p-8 md:p-12 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-gold" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              هل أنت لاعب موهوب؟
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              انضم إلينا الآن وافتح أبواب الاحتراف. سجّل ملفك واجعل موهبتك مرئية لأفضل الأندية.
            </p>
            <Button size="lg" className="btn-gold rounded-full text-lg px-8 py-6">
              سجّل كلاعب
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </motion.div>

          {/* For Clubs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="card-glass rounded-3xl p-8 md:p-12 text-center border-gold/20"
          >
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-gold" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              تبحث عن مواهب جديدة؟
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              اشترك في باقاتنا الحصرية واحصل على وصول كامل لقاعدة بيانات اللاعبين الموهوبين.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full text-lg px-8 py-6 border-gold text-gold hover:bg-gold hover:text-primary-foreground"
            >
              انضم كنادي
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
