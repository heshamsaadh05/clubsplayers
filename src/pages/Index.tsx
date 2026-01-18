import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import PlayersSlider from "@/components/PlayersSlider";
import HowItWorks from "@/components/HowItWorks";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { usePageSections } from "@/hooks/usePageSections";

const Index = () => {
  const { data: sections } = usePageSections('home');

  const isSectionVisible = (sectionKey: string) => {
    const section = sections?.find(s => s.section_key === sectionKey);
    return section?.is_visible ?? true;
  };

  // Sort sections by order_index
  const orderedSections = sections?.slice().sort((a, b) => a.order_index - b.order_index) || [];

  const sectionComponents: Record<string, React.ReactNode> = {
    hero: <HeroSection key="hero" />,
    features: <FeaturesSection key="features" />,
    how_it_works: <HowItWorks key="how_it_works" />,
    players_slider: <PlayersSlider key="players_slider" />,
    cta: <CTASection key="cta" />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {orderedSections.length > 0 ? (
        orderedSections.map(section => 
          section.is_visible ? sectionComponents[section.section_key] : null
        )
      ) : (
        // Default order if no sections loaded yet
        <>
          {isSectionVisible('hero') && <HeroSection />}
          {isSectionVisible('features') && <FeaturesSection />}
          {isSectionVisible('players_slider') && <PlayersSlider />}
          {isSectionVisible('how_it_works') && <HowItWorks />}
          {isSectionVisible('cta') && <CTASection />}
        </>
      )}
      <Footer />
    </div>
  );
};

export default Index;
