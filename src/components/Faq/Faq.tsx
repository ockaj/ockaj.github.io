import { memo, useState, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { Accordion } from "@base-ui/react/accordion";
import {
  InteractiveGlass,
  LiquidGlassButton,
} from "../LiquidGlass/LiquidGlass";
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

  const [openItemIds, setOpenItemIds] = useState<string[]>([]);

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
        <Accordion.Root
          value={openItemIds}
          onValueChange={setOpenItemIds}
          multiple
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
                isOpen={openItemIds.includes(item.id)}
              />
            </motion.div>
          ))}
        </Accordion.Root>

        {/* Editorial Transition Card */}
        <motion.div variants={cardVariants} custom={prefersReducedMotion}>
          <InteractiveGlass
            as="div"
            roundedClass="rounded-2xl"
            className="w-full text-left"
            tilt
          >
            <div className="flex flex-col items-start justify-between gap-6 p-7 sm:p-8 md:flex-row md:items-center md:gap-8">
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-xl font-normal text-balance text-text-primary md:text-2xl">
                  Have an open analyst role or transformation project?
                </h3>
                <p className="max-w-xl text-base leading-relaxed text-pretty text-muted">
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
                  className="group/contact-btn flex min-h-11 cursor-pointer items-center justify-center px-7 py-3 text-sm font-semibold whitespace-nowrap text-text-primary shadow-sm transition-colors"
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
          </InteractiveGlass>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default memo(Faq);
