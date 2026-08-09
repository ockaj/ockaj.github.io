import { memo } from "react";
import { ArrowUp } from "lucide-react";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { scrollToTop } from "../utils/scroll";

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  const currentYear = CURRENT_YEAR;

  return (
    <footer className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-8 md:px-10 md:pb-12 lg:px-16">
      <div className="mb-6 h-px w-full bg-white/5" />
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Copyright */}
        <div className="flex items-center gap-4 select-none">
          <p
            className="text-muted text-xs text-pretty"
            suppressHydrationWarning
          >
            © {currentYear} Ondrej Michal Očkaj
          </p>
        </div>

        {/* Scroll to Top Styled as LiquidGlassButton */}
        <LiquidGlassButton
          onClick={scrollToTop}
          className="group/top-btn px-4 py-3 text-xs"
          ariaLabel="Scroll back to top"
          magnetic
          tilt
          magneticStrength={0.02}
        >
          <span className="flex items-center gap-1.5">
            Back to Top
            <ArrowUp
              size={12}
              className="transition-transform duration-300 group-hover/top-btn:-translate-y-0.5"
            />
          </span>
        </LiquidGlassButton>
      </div>
    </footer>
  );
}

export default memo(Footer);
