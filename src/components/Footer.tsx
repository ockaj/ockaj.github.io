import { memo } from "react";
import { ArrowUp } from "lucide-react";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { scrollToTop } from "../utils/scroll";

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  const currentYear = CURRENT_YEAR;

  return (
    <footer className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 pb-8 md:pb-12 relative z-10 w-full">
      <div className="w-full h-px bg-white/5 mb-6" />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Copyright */}
        <div className="flex items-center gap-4 select-none">
          <p
            className="text-xs text-muted text-pretty"
            suppressHydrationWarning
          >
            © {currentYear} Ondrej Michal Očkaj
          </p>
        </div>

        {/* Scroll to Top Styled as LiquidGlassButton */}
        <LiquidGlassButton
          onClick={scrollToTop}
          className="text-xs px-4 py-3 group/top-btn"
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
