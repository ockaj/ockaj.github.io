import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import BpmnNodeBadge from "./BpmnNodeBadge";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import Footer from "./Footer";
import { CONTACT_EMAIL } from "../utils/contact";

import {
  SECTION_ANIMATE,
  SECTION_VIEWPORT,
  SECTION_TRANSITION,
} from "../utils/motionVariants";

const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/ockaj",
    path: "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/onkozinternetu",
    path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  },
];

function ContactSection() {
  const prefersReducedMotion = useReducedMotion();
  const initialStyle = { opacity: 0, y: prefersReducedMotion ? 0 : 30 };

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
          <div className="mx-auto mb-16 max-w-[1200px] px-6 text-center md:mb-20 md:px-10 lg:px-16">
            <div className="mx-auto flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-6">
              {/* Email button wrapper */}
              <div className="flex w-full justify-center sm:w-auto">
                <LiquidGlassButton
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="group/email-btn w-fit px-6 py-3.5 whitespace-nowrap sm:px-8 sm:py-4"
                  ariaLabel="Send email"
                  magnetic
                  tilt
                  magneticStrength={0.02}
                  specularGlow
                >
                  <span className="flex w-full items-center justify-center gap-2">
                    <span>{CONTACT_EMAIL}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={16}
                      className="transition-transform duration-300 group-hover/email-btn:translate-x-0.5 group-hover/email-btn:-translate-y-0.5"
                    />
                  </span>
                </LiquidGlassButton>
              </div>

              {/* Social buttons wrapper */}
              <div className="flex w-full flex-row justify-center gap-3 sm:w-auto sm:gap-6">
                {SOCIALS.map((social) => (
                  <LiquidGlassButton
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/social-btn max-w-[145px] flex-1 px-4 py-3.5 text-xs whitespace-nowrap sm:max-w-none sm:flex-initial sm:px-8 sm:py-4 sm:text-sm"
                    ariaLabel={`Visit ${social.label}`}
                    magnetic
                    tilt
                    magneticStrength={0.02}
                    specularGlow
                  >
                    <span className="flex w-full items-center justify-center gap-1.5 sm:gap-2">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-[13px] w-[13px] shrink-0 sm:h-4 sm:w-4"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d={social.path} />
                      </svg>
                      <span>{social.label}</span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-[13px] w-[13px] shrink-0 transition-transform duration-300 group-hover/social-btn:translate-x-0.5 group-hover/social-btn:-translate-y-0.5 sm:h-4 sm:w-4"
                      />
                    </span>
                  </LiquidGlassButton>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="absolute bottom-0 w-full">
        <Footer />
      </div>
    </section>
  );
}

export default memo(ContactSection);
