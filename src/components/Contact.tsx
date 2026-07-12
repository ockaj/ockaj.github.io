import { memo } from "react";
import { ArrowUpRight } from "lucide-react";
import { siGithub, siX } from "simple-icons";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { CONTACT_EMAIL } from "../utils/contact";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/ockaj", path: siGithub.path },
  {
    label: "X (Twitter)",
    href: "https://x.com/onkozinternetu",
    path: siX.path,
  },
];

function Contact() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 text-center mb-16 md:mb-20">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4 sm:gap-6 mx-auto">
        {/* Email button wrapper */}
        <div className="w-full sm:w-auto flex justify-center">
          <LiquidGlassButton
            href={`mailto:${CONTACT_EMAIL}`}
            className="px-6 py-3.5 sm:px-8 sm:py-4 whitespace-nowrap group/email-btn w-fit"
            ariaLabel="Send email"
            magnetic
            tilt
            magneticStrength={0.02}
            specularGlow
          >
            <span className="flex items-center justify-center gap-2 w-full">
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
        <div className="flex flex-row justify-center gap-3 w-full sm:w-auto sm:gap-6">
          {SOCIALS.map((social) => (
            <LiquidGlassButton
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3.5 sm:px-8 sm:py-4 text-xs sm:text-sm whitespace-nowrap group/social-btn flex-1 sm:flex-initial max-w-[145px] sm:max-w-none"
              ariaLabel={`Visit ${social.label}`}
              magnetic
              tilt
              magneticStrength={0.02}
              specularGlow
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2 w-full">
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[13px] h-[13px] sm:w-4 sm:h-4 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d={social.path} />
                </svg>
                <span>{social.label}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  size={13}
                  className="sm:hidden transition-transform duration-300 group-hover/social-btn:translate-x-0.5 group-hover/social-btn:-translate-y-0.5 shrink-0"
                />
                <ArrowUpRight
                  aria-hidden="true"
                  size={16}
                  className="hidden sm:inline transition-transform duration-300 group-hover/social-btn:translate-x-0.5 group-hover/social-btn:-translate-y-0.5 shrink-0"
                />
              </span>
            </LiquidGlassButton>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(Contact);
