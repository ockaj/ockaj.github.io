import { memo, useMemo } from "react";
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
  const initialStyle = useMemo(
    () => ({ opacity: 0, y: prefersReducedMotion ? 0 : 30 }),
    [prefersReducedMotion],
  );

  return (
    <section
      id="contact"
      className="relative flex min-h-[100lvh] w-full items-center justify-center"
    >
      <div className="relative z-10">
        <motion.div
          initial={initialStyle}
          whileInView={SECTION_ANIMATE}
          viewport={SECTION_VIEWPORT}
          transition={SECTION_TRANSITION}
          className="mx-auto max-w-[1200px] px-6 pb-2 text-center md:px-10 lg:px-16"
        >
          <p className="text-muted mb-5 flex items-center justify-center gap-1.5 text-xs font-semibold text-pretty uppercase">
            <BpmnNodeBadge type="end-event-none" />
            Get in touch
          </p>
          <h2 className="font-display text-text-primary mb-6 pb-2 text-[clamp(3.5rem,8vw,6rem)] leading-[1.1] text-balance">
            Let's work together
          </h2>
          <p className="text-muted mx-auto mb-10 max-w-md text-sm text-pretty md:text-base">
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
