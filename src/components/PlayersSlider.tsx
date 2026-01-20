import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useSliderSettings, useSliderItems } from "@/hooks/useSliderSettings";
import { usePageSections } from "@/hooks/usePageSections";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionSettings {
  badge?: string;
  badge_ar?: string;
  title_part1?: string;
  title_part1_ar?: string;
  title_part2?: string;
  title_part2_ar?: string;
  description?: string;
  description_ar?: string;
}

const PlayersSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Fetch slider settings and items from database
  const { data: settings, isLoading: loadingSettings } = useSliderSettings('players');
  const { data: items, isLoading: loadingItems } = useSliderItems('players');
  
  // Fetch section settings for text content
  const { data: pageSections, isLoading: loadingSections } = usePageSections('home');
  
  // Get players_slider section settings
  const sliderSection = pageSections?.find(s => s.section_key === 'players_slider');
  const sectionSettings = (sliderSection?.settings || {}) as SectionSettings;
  
  // Filter only active items
  const activeItems = items?.filter(item => item.is_active) || [];

  // Adjust items per view based on actual items count
  const configuredItemsPerView = settings?.items_per_view || 3;
  const itemsPerView = Math.min(configuredItemsPerView, activeItems.length || 1);
  
  // Calculate if we need navigation (only if items exceed items per view)
  const needsNavigation = activeItems.length > itemsPerView;
  
  // Calculate max index for navigation
  const maxIndex = Math.max(0, activeItems.length - itemsPerView);

  // Auto-play functionality - infinite loop
  useEffect(() => {
    if (!settings?.auto_play || activeItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= activeItems.length - 1 ? 0 : prev + 1));
    }, settings.auto_play_interval || 5000);

    return () => clearInterval(interval);
  }, [settings?.auto_play, settings?.auto_play_interval, activeItems.length]);

  // Reset current index if it exceeds max
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(Math.max(0, maxIndex));
    }
  }, [currentIndex, maxIndex]);

  const isLoading = loadingSettings || loadingItems || loadingSections;

  if (isLoading) {
    return (
      <section id="players" className="section-padding relative overflow-hidden">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-4 w-20 mx-auto mb-4" />
            <Skeleton className="h-10 w-64 mx-auto mb-6" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="flex gap-6 justify-center">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-80 h-96 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (activeItems.length === 0) {
    return null; // Don't render section if no items
  }
  
  // Get text content with fallbacks
  const badge = sectionSettings.badge_ar || sectionSettings.badge || 'نجومنا';
  const titlePart1 = sectionSettings.title_part1_ar || sectionSettings.title_part1 || 'لاعبون';
  const titlePart2 = sectionSettings.title_part2_ar || sectionSettings.title_part2 || 'مميزون';
  const description = sectionSettings.description_ar || sectionSettings.description || 'تعرف على نخبة من أفضل اللاعبين المسجلين لدينا';

  // Calculate width percentage based on items per view
  const getItemWidth = () => {
    switch (itemsPerView) {
      case 1: return 'w-full';
      case 2: return 'w-[calc(50%-12px)]';
      case 3: return 'w-[calc(33.333%-16px)]';
      case 4: return 'w-[calc(25%-18px)]';
      case 5: return 'w-[calc(20%-19.2px)]';
      default: return 'w-[calc(33.333%-16px)]';
    }
  };

  // Infinite loop navigation functions
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= activeItems.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? activeItems.length - 1 : prev - 1));
  };

  return (
    <section id="players" className="section-padding relative overflow-hidden">
      {/* Glow Effect */}
      <div className="hero-glow top-1/2 right-0 -translate-y-1/2 animate-glow" />

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
            <span className="text-foreground">{titlePart1} </span>
            <span className="text-gradient-gold">{titlePart2}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {description}
          </p>
        </motion.div>

        {/* Slider */}
        <div className="relative max-w-5xl mx-auto">
          {/* Navigation Buttons - Always show if more than 1 item */}
          {settings?.show_navigation !== false && activeItems.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-colors -mr-6 bg-gold/20 hover:bg-gold/40"
              >
                <ChevronRight className="w-6 h-6 text-gold" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-colors -ml-6 bg-gold/20 hover:bg-gold/40"
              >
                <ChevronLeft className="w-6 h-6 text-gold" />
              </button>
            </>
          )}

          {/* Cards Container */}
          <div className="overflow-hidden px-8">
            <motion.div
              className="flex gap-6"
              animate={{ x: `${currentIndex * -100 / itemsPerView}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ justifyContent: activeItems.length < configuredItemsPerView ? 'center' : 'flex-start' }}
            >
              {activeItems.map((item) => (
                <motion.div
                  key={item.id}
                  className={`flex-shrink-0 ${getItemWidth()}`}
                  whileHover={{ y: -10 }}
                >
                  <a 
                    href={item.link_url || '#'} 
                    className="block"
                    onClick={(e) => !item.link_url && e.preventDefault()}
                  >
                    <div className="card-glass rounded-2xl overflow-hidden group h-full">
                      {/* Image */}
                      <div className="relative h-80 overflow-hidden bg-muted">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title || item.title_ar || ''}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            لا توجد صورة
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                      </div>

                      {/* Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-foreground mb-1">
                          {item.title_ar || item.title || 'عنوان'}
                        </h3>
                        {(item.subtitle_ar || item.subtitle) && (
                          <p className="text-gold font-medium">
                            {item.subtitle_ar || item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Dots */}
          {settings?.show_dots !== false && activeItems.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {activeItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? "bg-gold" : "bg-gold/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PlayersSlider;
