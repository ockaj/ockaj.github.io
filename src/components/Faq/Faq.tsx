import { memo, useState, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import { FaqItem } from "./FaqItem";
import { FAQ_ITEMS } from "../../data/faqData";
import { isBoneyardBuild } from "../../utils/boneyard";
import { navigateTo } from "../../hooks/useAppNavigation";
import {
  containerStaggerVariants,
  cardStaggerVariants,
  SECTION_VIEWPORT,
} from "../../utils/motionVariants";

const isBuildMode = isBoneyardBuild();
const containerVariants = containerStaggerVariants(0.05);
const cardVariants = cardStaggerVariants;

function Faq() {
  const prefersReducedMotion = useReducedMotion();

  const [openItemIds, setOpenItemIds] = useState<Set<string>>(() => new Set());

  const handleToggle = useCallback((id: string) => {
    setOpenItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleScrollToContact = useCallback(() => {
    navigateTo("contact");
  }, []);

  return (
    <div className="px-6 md:px-10 lg:px-16">
      {/* Accordion Items List & Editorial Transition Card */}
      <motion.div
        custom={prefersReducedMotion}
        variants={containerVariants}
        initial={isBuildMode ? "visible" : "hidden"}
        whileInView={isBuildMode ? undefined : "visible"}
        viewport={isBuildMode ? undefined : SECTION_VIEWPORT}
        className="flex flex-col gap-4"
      >
        {FAQ_ITEMS.map((item) => (
          <motion.div
            key={item.id}
            variants={cardVariants}
            custom={prefersReducedMotion}
          >
            <FaqItem
              item={item}
              isOpen={openItemIds.has(item.id)}
              onToggle={handleToggle}
            />
          </motion.div>
        ))}

        {/* Editorial Transition Card */}
        <motion.div variants={cardVariants} custom={prefersReducedMotion}>
          <LiquidGlass
            as="div"
            roundedClass="rounded-2xl"
            className="w-full text-left"
            tilt
          >
            <div className="flex flex-col items-start justify-between gap-6 p-7 sm:p-8 md:flex-row md:items-center md:gap-8">
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-text-primary text-xl font-semibold text-balance md:text-2xl">
                  Have an open analyst role or transformation project?
                </h3>
                <p className="text-muted max-w-xl text-xs leading-relaxed text-pretty md:text-sm">
                  I am open to part-time analyst roles during my master's
                  studies, hybrid projects, and post-graduation full-time
                  discussions (graduating 2027). Let's discuss how my process
                  modeling and optimization skills fit your team.
                </p>
              </div>

              <div className="shrink-0">
                <LiquidGlassButton
                  type="button"
                  onClick={handleScrollToContact}
                  roundedClass="rounded-full"
                  className="group/contact-btn text-text-primary flex min-h-[44px] cursor-pointer items-center justify-center px-7 py-3 text-xs font-semibold whitespace-nowrap shadow-sm transition-colors md:text-sm"
                  ariaLabel="Scroll down to contact section"
                  magnetic
                  tilt
                  magneticStrength={0.03}
                  specularGlow
                >
                  <span className="flex items-center gap-2">
                    <span>Get in Touch</span>
                    <ArrowDown
                      size={16}
                      aria-hidden="true"
                      className="transition-transform duration-300 ease-out group-hover/contact-btn:translate-y-0.5"
                    />
                  </span>
                </LiquidGlassButton>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default memo(Faq);
