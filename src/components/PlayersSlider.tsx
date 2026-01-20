import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
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

interface SliderItem {
  id: string;
  image_url: string | null;
  title: string | null;
  title_ar: string | null;
  subtitle: string | null;
  subtitle_ar: string | null;
  link_url: string | null;
}

// Extracted card component for reusability
const SliderCard = ({ item, itemWidth }: { item: SliderItem; itemWidth: string }) => (
  <motion.div
    className={`flex-shrink-0 ${itemWidth}`}
    whileHover={{ y: -10 }}
  >
    <a 
      href={item.link_url || '#'} 
      className="block"
      onClick={(e) => !item.link_url && e.preventDefault()}
    >
      <div className="card-glass rounded-2xl overflow-hidden group h-full">
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
);

const PlayersSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const { data: settings, isLoading: loadingSettings } = useSliderSettings('players');
  const { data: items, isLoading: loadingItems } = useSliderItems('players');
  const { data: pageSections, isLoading: loadingSections } = usePageSections('home');
  
  const sliderSection = pageSections?.find(s => s.section_key === 'players_slider');
  const sectionSettings = (sliderSection?.settings || {}) as SectionSettings;
  
  const activeItems = items?.filter(item => item.is_active) || [];
  const itemCount = activeItems.length;

  const configuredItemsPerView = settings?.items_per_view || 3;
  const itemsPerView = Math.min(configuredItemsPerView, itemCount || 1);
  
  // For seamless loop, we need to clone items
  const needsLoop = itemCount > itemsPerView;
  
  // Create extended items array with clones for seamless loop
  const extendedItems = needsLoop 
    ? [...activeItems, ...activeItems, ...activeItems] // Triple the items for smooth infinite scroll
    : activeItems;
  
  // Start from the middle set for seamless looping
  const startOffset = needsLoop ? itemCount : 0;

  // Calculate width based on items per view
  const getItemWidth = useCallback(() => {
    switch (itemsPerView) {
      case 1: return 'w-full';
      case 2: return 'w-[calc(50%-12px)]';
      case 3: return 'w-[calc(33.333%-16px)]';
      case 4: return 'w-[calc(25%-18px)]';
      case 5: return 'w-[calc(20%-19.2px)]';
      default: return 'w-[calc(33.333%-16px)]';
    }
  }, [itemsPerView]);

  // Handle seamless reset when reaching clone boundaries
  const handleTransitionEnd = useCallback(() => {
    if (!needsLoop) return;
    
    setIsTransitioning(false);
    
    // If we've gone past the end, reset to beginning of middle set
    if (currentIndex >= itemCount) {
      setCurrentIndex(0);
    }
    // If we've gone before the beginning, reset to end of middle set
    else if (currentIndex < 0) {
      setCurrentIndex(itemCount - 1);
    }
  }, [currentIndex, itemCount, needsLoop]);

  // Auto-play functionality
  useEffect(() => {
    if (!settings?.auto_play || itemCount === 0 || !needsLoop) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, settings.auto_play_interval || 5000);

    return () => clearInterval(interval);
  }, [settings?.auto_play, settings?.auto_play_interval, itemCount, needsLoop]);

  // Handle instant reset after transition
  useEffect(() => {
    if (!needsLoop || isTransitioning) return;
    
    const timer = setTimeout(() => {
      if (currentIndex >= itemCount) {
        setCurrentIndex(0);
      } else if (currentIndex < 0) {
        setCurrentIndex(itemCount - 1);
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [currentIndex, itemCount, needsLoop, isTransitioning]);

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

  if (itemCount === 0) {
    return null;
  }
  
  const badge = sectionSettings.badge_ar || sectionSettings.badge || 'نجومنا';
  const titlePart1 = sectionSettings.title_part1_ar || sectionSettings.title_part1 || 'لاعبون';
  const titlePart2 = sectionSettings.title_part2_ar || sectionSettings.title_part2 || 'مميزون';
  const description = sectionSettings.description_ar || sectionSettings.description || 'تعرف على نخبة من أفضل اللاعبين المسجلين لدينا';

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const goToSlide = (index: number) => {
    setIsTransitioning(true);
    setCurrentIndex(index);
  };

  // Calculate the actual display index for dots (always 0 to itemCount-1)
  const displayIndex = ((currentIndex % itemCount) + itemCount) % itemCount;

  // Calculate translation - account for the starting offset in extended array
  const translateX = needsLoop 
    ? ((startOffset + currentIndex) * 100 / itemsPerView)
    : (currentIndex * 100 / itemsPerView);

  return (
    <section id="players" className="section-padding relative overflow-hidden">
      <div className="hero-glow top-1/2 right-0 -translate-y-1/2 animate-glow" />

      <div className="container mx-auto relative z-10">
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

        <div className="relative max-w-5xl mx-auto">
          {settings?.show_navigation !== false && needsLoop && (
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

          <div className="overflow-hidden px-8" ref={sliderRef}>
            <motion.div
              className="flex gap-6"
              animate={{ x: `-${translateX}%` }}
              transition={isTransitioning ? { 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              } : { 
                duration: 0 
              }}
              onAnimationComplete={handleTransitionEnd}
              style={{ justifyContent: !needsLoop ? 'center' : 'flex-start' }}
            >
              {extendedItems.map((item, index) => (
                <SliderCard 
                  key={`${item.id}-${index}`}
                  item={item}
                  itemWidth={getItemWidth()}
                />
              ))}
            </motion.div>
          </div>

          {settings?.show_dots !== false && itemCount > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {activeItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === displayIndex ? "bg-gold" : "bg-gold/30"
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
