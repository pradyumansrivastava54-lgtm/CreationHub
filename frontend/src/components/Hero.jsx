import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGE_SLIDES = [
  {
    id: 1,
    productId: 1, // Mapped headphone product ID
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    label: "ASOS Premium Style",
    title: "Audio Essentials"
  },
  {
    id: 2,
    productId: 2, // Mapped smartwatch product ID
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    label: "Minimalist Living",
    title: "Sleek Wearables"
  },
  {
    id: 3,
    productId: 3, // Mapped creative setup product ID
    image: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=800&q=80",
    label: "Immersive Gaming",
    title: "Next-Gen Stations"
  }
];

export default function Hero() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  // Automatic slide cycle for image showcase (every 4.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IMAGE_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = IMAGE_SLIDES[index];

  return (
    <section className="w-full bg-[#FAF6F0] pt-6 pb-12 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-200/50 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        
        {/* Left Column: Fixed Brand Copy Typography (Stationary) */}
        <div className="flex-1 space-y-6 text-left z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase bg-white border border-zinc-200/80 rounded-full px-3 py-1 shadow-xs">
              LUXURY LIFESTYLE COLLECTION
            </span>
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-tight"
            >
              Discover Premium <br />
              <span className="italic font-normal text-zinc-550">Boutique Gear</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-zinc-550 max-w-xl text-xs sm:text-sm md:text-base leading-relaxed font-serif italic"
            >
              A carefully curated selection of next-generation smart devices, premium audio wear, wearables, and state-of-the-art gaming setups for the modern designer home. Inspired by Glowora's high-fashion minimalist design language.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-2"
          >
            <button
              onClick={() => {
                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-zinc-900 text-white rounded-full px-7 py-3 hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-md shadow-zinc-900/10 hover:shadow-lg active:scale-98"
            >
              Explore Collection
            </button>
          </motion.div>
        </div>

        {/* Right Column: Premium Auto-sliding Image Showcase Card with Click Conversion */}
        <div className="flex-shrink-0 w-full lg:max-w-[420px] aspect-[4/3] xs:aspect-[16/10] lg:aspect-[4/5] relative flex items-center justify-center">
          <div 
            onClick={() => navigate(`/product/${currentSlide.productId}`)}
            className="relative w-full h-full rounded-[32px] sm:rounded-[40px] overflow-hidden bg-zinc-100 border border-zinc-200/60 shadow-2xl p-4 flex flex-col justify-end cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform duration-300 group"
          >
            <AnimatePresence mode="wait">
              <motion.img 
                key={`img-${currentSlide.id}`}
                src={currentSlide.image} 
                alt={currentSlide.title} 
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.55 }}
                className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:scale-102 transition-transform duration-700"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-900/10 to-transparent pointer-events-none" />
            
            {/* Active dots pagination strip inside card */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 flex items-center gap-1.5 bg-zinc-950/20 backdrop-blur-md px-2.5 py-1.5 rounded-full z-20 border border-white/10"
            >
              {IMAGE_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === index ? 'w-4.5 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="relative z-10 text-white p-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`meta-${currentSlide.id}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-[8px] font-bold tracking-widest uppercase text-zinc-300">{currentSlide.label}</span>
                  <h3 className="text-lg font-serif tracking-tight mt-0.5">{currentSlide.title}</h3>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
