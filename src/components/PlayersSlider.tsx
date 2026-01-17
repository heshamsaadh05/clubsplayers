import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { useState } from "react";
import player1 from "@/assets/player-1.jpg";
import player2 from "@/assets/player-2.jpg";
import player3 from "@/assets/player-3.jpg";

const PlayersSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const players = [
    {
      id: 1,
      name: "أحمد محمود",
      position: "مهاجم",
      age: 22,
      club: "الأهلي المصري",
      rating: 4.8,
      image: player1,
    },
    {
      id: 2,
      name: "محمد السعيد",
      position: "وسط ميدان",
      age: 24,
      club: "الزمالك",
      rating: 4.6,
      image: player2,
    },
    {
      id: 3,
      name: "يوسف خالد",
      position: "حارس مرمى",
      age: 21,
      club: "بيراميدز",
      rating: 4.9,
      image: player3,
    },
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % players.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + players.length) % players.length);
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
            نجومنا
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">لاعبون </span>
            <span className="text-gradient-gold">مميزون</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            تعرف على نخبة من أفضل اللاعبين المسجلين لدينا
          </p>
        </motion.div>

        {/* Slider */}
        <div className="relative max-w-5xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gold/20 hover:bg-gold/40 flex items-center justify-center transition-colors -mr-6"
          >
            <ChevronRight className="w-6 h-6 text-gold" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gold/20 hover:bg-gold/40 flex items-center justify-center transition-colors -ml-6"
          >
            <ChevronLeft className="w-6 h-6 text-gold" />
          </button>

          {/* Cards Container */}
          <div className="overflow-hidden px-8">
            <motion.div
              className="flex gap-6"
              animate={{ x: `${currentIndex * -100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  className="min-w-full md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)]"
                  whileHover={{ y: -10 }}
                >
                  <div className="card-glass rounded-2xl overflow-hidden group">
                    {/* Image */}
                    <div className="relative h-80 overflow-hidden">
                      <img
                        src={player.image}
                        alt={player.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                      
                      {/* Rating Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-1 bg-gold/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        {player.rating}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {player.name}
                      </h3>
                      <p className="text-gold font-medium mb-3">{player.position}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {player.club}
                        </div>
                        <span>{player.age} سنة</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {players.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? "bg-gold" : "bg-gold/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlayersSlider;
