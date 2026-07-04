import { useState, useEffect, useCallback, memo } from "react";
import {
  motion,
  AnimatePresence,
  Variants,
  useReducedMotion,
} from "motion/react";
import { Expand } from "lucide-react";
import { PROCESS_ITEMS } from "../data/processItems";
import { LiquidGlass } from "./LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "./LiquidGlass/LiquidGlassTabs";
import ProcessLightbox from "./ProcessLightbox";

const tabContentVariants: Variants = {
  hidden: (prefersReducedMotion: boolean) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 15,
    scale: prefersReducedMotion ? 1 : 0.98,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  exit: (prefersReducedMotion: boolean) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 15,
    scale: prefersReducedMotion ? 1 : 0.98,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

function ProcessLibrary() {
  const prefersReducedMotion = useReducedMotion();
  const [activeItem, setActiveItem] = useState(PROCESS_ITEMS[0]);
  const [lightboxItem, setLightboxItem] = useState<
    (typeof PROCESS_ITEMS)[0] | null
  >(null);

  // sliding-window preloading only pre-fetches the two adjacent diagrams (N-1 and N+1) to conserve bandwidth
  useEffect(() => {
    const currentIndex = PROCESS_ITEMS.findIndex(
      (item) => item.id === activeItem.id,
    );
    if (currentIndex === -1) return;

    const adjacentIndices = [currentIndex - 1, currentIndex + 1];
    adjacentIndices.forEach((idx) => {
      if (idx >= 0 && idx < PROCESS_ITEMS.length) {
        const img = new Image();
        img.src = PROCESS_ITEMS[idx].image;
      }
    });
  }, [activeItem.id]);

  const handleTabChange = useCallback((id: number) => {
    const selected = PROCESS_ITEMS.find((item) => item.id === id);
    if (selected) {
      setActiveItem(selected);
    }
  }, []);

  return (
    <>
      {/* Interactive Split Dashboard */}
      <div className="px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-stretch relative z-20">
          {/* Left Column: Index Menu Selector */}
          <Tabs
            value={activeItem.id}
            onChange={handleTabChange}
            layoutId="active-process-highlight"
            squircle
            roundedClass="rounded-2xl"
            className="lg:col-span-5 flex flex-col gap-2 justify-center"
          >
            {PROCESS_ITEMS.map((item, idx) => (
              <Tab
                key={item.id}
                value={item.id}
                aria-controls={`tabpanel-${item.id}`}
                className={`w-full text-left relative px-8 py-4 rounded-2xl transition-colors duration-300 flex items-center gap-4 select-none cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset ${
                  activeItem.id === item.id
                    ? "text-text-primary"
                    : "text-muted hover:text-text-primary"
                }`}
              >
                {/* Badge Index */}
                <span
                  className={`relative z-10 text-xs font-body tabular-nums min-w-[20px] transition-colors duration-300 ${
                    activeItem.id === item.id
                      ? "font-bold text-accent"
                      : "font-semibold text-accent/80"
                  }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* Metadata */}
                <div className="relative z-10">
                  <h3 className="text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1 text-balance line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-[9px] text-muted uppercase mt-0.5 transition-transform duration-300 group-hover:translate-x-1">
                    {item.type}
                  </p>
                </div>
              </Tab>
            ))}
          </Tabs>

          {/* Right Column: Visual Preview Canvas */}
          <div className="lg:col-span-7 flex flex-col justify-center relative min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                role="tabpanel"
                id={`tabpanel-${activeItem.id}`}
                aria-labelledby={`tab-${activeItem.id}`}
                custom={prefersReducedMotion}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
                className="w-full h-full flex flex-col"
              >
                <LiquidGlass
                  as="div"
                  roundedClass="rounded-2xl"
                  className="w-full h-full p-6 md:p-8 flex-col text-left justify-start items-stretch"
                  tilt
                >
                  {/* Canvas Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10 w-full">
                    <div>
                      <span className="inline-block text-[10px] text-accent uppercase font-bold bg-accent/20 border border-accent/30 rounded-xl px-2.5 py-0.5">
                        {activeItem.type}
                      </span>
                      <h3 className="text-xl md:text-2xl font-display text-text-primary mt-2 text-balance">
                        {activeItem.title}
                      </h3>
                    </div>
                  </div>

                  {/* Adaptable Grid Canvas Board */}
                  <button
                    type="button"
                    className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-stroke/50 flex items-center justify-center p-0 mb-6 select-none cursor-zoom-in group/canvas z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    onClick={() => setLightboxItem(activeItem)}
                    aria-label={`Zoom diagram: ${activeItem.title}`}
                    style={{
                      background: `radial-gradient(circle, hsl(var(--stroke)) 1px, transparent 1px) 0 0 / 16px 16px, hsl(var(--surface))`,
                      boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    <img
                      src={activeItem.image}
                      alt={activeItem.title}
                      width={800}
                      height={500}
                      className="w-full h-full object-contain rounded-lg p-6 transition-transform duration-500 group-hover/canvas:scale-102"
                      loading="lazy"
                    />

                    {/* Glass glare overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03)_0%,transparent_60%)]" />

                    {/* Permanent expand affordance */}
                    <div className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-xl px-2.5 py-1 pointer-events-none">
                      <Expand size={13} className="text-accent" />
                      <span className="text-[10px] text-accent uppercase font-bold">
                        Expand
                      </span>
                    </div>
                  </button>

                  {/* Canvas Footer Details */}
                  <div className="relative z-10 mt-auto min-h-[70px] h-auto">
                    <p className="text-[10px] text-muted uppercase font-semibold mb-2">
                      Operational Insight
                    </p>
                    <p className="text-sm text-text-primary/80 leading-relaxed text-pretty">
                      {activeItem.description}
                    </p>
                  </div>
                </LiquidGlass>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightboxItem ? (
          <ProcessLightbox
            key={lightboxItem.id}
            item={lightboxItem}
            onClose={() => setLightboxItem(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default memo(ProcessLibrary);
