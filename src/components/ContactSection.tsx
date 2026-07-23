import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import BpmnNodeBadge from "./BpmnNodeBadge";
import Contact from "./Contact";
import Footer from "./Footer";

import {
  SECTION_ANIMATE,
  SECTION_VIEWPORT,
  SECTION_TRANSITION,
} from "../utils/motionVariants";

function ContactSection() {
  const prefersReducedMotion = useReducedMotion();
  const initialStyle = { opacity: 0, y: prefersReducedMotion ? 0 : 30 };

  return (
    <section
      id="contact"
      className="relative w-full min-h-[100lvh] flex items-center justify-center"
    >
      <div className="relative z-10">
        <motion.div
          initial={initialStyle}
          whileInView={SECTION_ANIMATE}
          viewport={SECTION_VIEWPORT}
          transition={SECTION_TRANSITION}
          className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 text-center pb-2"
        >
          <p className="text-xs text-muted uppercase font-semibold mb-5 text-pretty flex items-center justify-center gap-1.5">
            <BpmnNodeBadge type="end-event-none" />
            Get in touch
          </p>
          <h2 className="text-[clamp(3.5rem,8vw,6rem)] font-display text-text-primary mb-6 leading-[1.1] pb-2 text-balance">
            Let's work together
          </h2>
          <p className="text-sm md:text-base text-muted max-w-md mx-auto mb-10 text-pretty">
            Looking to analyze, map, and optimize your business processes,
            design digital transformation solutions, or fill an analyst role?
            Let's connect.
          </p>
        </motion.div>
        <motion.div
          initial={initialStyle}
          whileInView={SECTION_ANIMATE}
          viewport={SECTION_VIEWPORT}
          transition={SECTION_TRANSITION}
        >
          <Contact />
        </motion.div>
      </div>
      <div className="absolute bottom-0 w-full">
        <Footer />
      </div>
    </section>
  );
}

export default memo(ContactSection);
