import { memo } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Languages,
  Award,
  ExternalLink,
  Globe,
} from "lucide-react";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import { cn } from "../../utils/cn";
import { type CvDataLanguageSection } from "../../data/cvData";
import { useAppStore } from "../../store/useAppStore";

const WHITESPACE_REGEX = /\s+/g;
const PHONE_PREFIX_REGEX = /^[+\d]/;

function BulletList({
  bullets,
  className = "mt-3 list-none space-y-1.5",
}: Readonly<{ bullets: readonly string[]; className?: string }>) {
  return (
    <ul className={className}>
      {bullets.map((bullet) => (
        <li
          key={bullet}
          className="text-muted flex items-start gap-1.5 text-xs text-pretty"
        >
          <span className="text-accent mt-0.5 flex-shrink-0">•</span>
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

interface InteractiveCvViewProps {
  activeCv: CvDataLanguageSection;
  lang: "en" | "sk";
}

export const InteractiveCvView = memo(function InteractiveCvView({
  activeCv,
  lang,
}: InteractiveCvViewProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      {/* CV Heading Card */}
      <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-md md:flex-row md:items-center md:p-8">
        <div className="from-accent/5 pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr to-transparent" />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-accent bg-accent/10 rounded-xl px-2 py-0.5 text-xs font-semibold uppercase">
              {lang === "en" ? "Active Resume" : "Aktívny Životopis"}
            </span>
          </div>
          <h1 className="font-display text-text-primary mb-1 text-3xl text-balance md:text-4xl">
            {activeCv.title}
          </h1>
          <p className="text-text-primary/95 font-body text-sm font-normal text-pretty">
            {activeCv.role}
          </p>

          {/* Contacts */}
          <div className="text-muted mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs tabular-nums">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-accent/65" />
              {activeCv.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={12} className="text-accent/65" />
              <a
                href={`mailto:${activeCv.email}`}
                className="hover:text-text-primary transition-colors"
              >
                {activeCv.email}
              </a>
            </span>
            {activeCv.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone size={12} className="text-accent/65" />
                {PHONE_PREFIX_REGEX.test(activeCv.phone) ? (
                  <a
                    href={`tel:${activeCv.phone.replace(WHITESPACE_REGEX, "")}`}
                    className="hover:text-text-primary transition-colors"
                  >
                    {activeCv.phone}
                  </a>
                ) : (
                  <span>{activeCv.phone}</span>
                )}
              </span>
            ) : null}
          </div>
        </div>

        {/* Language Toggler */}
        <div className="relative z-10 flex items-center gap-1.5 self-start md:self-auto">
          <LiquidGlassButton
            onClick={() => useAppStore.getState().setCvLang("en")}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold",
              lang === "en" ? "text-accent" : "text-muted",
            )}
          >
            <Languages size={11} />
            EN
          </LiquidGlassButton>
          <LiquidGlassButton
            onClick={() => useAppStore.getState().setCvLang("sk")}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold",
              lang === "sk" ? "text-accent" : "text-muted",
            )}
          >
            <Languages size={11} />
            SK
          </LiquidGlassButton>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Summary, Experience, Education */}
        <div className="space-y-10 lg:col-span-2">
          {/* Profile Section */}
          <section className="space-y-3">
            <h2 className="text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-extrabold text-balance">
              <Sparkles size={16} className="text-accent" />
              {activeCv.profile.title}
            </h2>
            <p className="text-muted font-body text-sm leading-relaxed text-pretty">
              {activeCv.profile.text}
            </p>
          </section>

          {/* Experience Section */}
          <section className="space-y-4">
            <h2 className="text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-extrabold text-balance">
              <Briefcase size={16} className="text-accent" />
              {activeCv.experience.title}
            </h2>
            <div className="space-y-6">
              {activeCv.experience.items.map((job) => (
                <div
                  key={`${job.company}-${job.role}`}
                  className="before:bg-stroke/60 relative pl-6 before:absolute before:top-1.5 before:bottom-0 before:left-1.5 before:w-px"
                >
                  <div className="border-accent bg-bg absolute top-1 left-0 z-10 size-3.5 rounded-full border-2 shadow-sm" />

                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-text-primary text-sm leading-tight font-semibold text-balance">
                        {job.role}
                      </h3>
                      <p className="text-muted text-xs text-pretty">
                        {job.company}
                      </p>
                    </div>
                    <span className="text-accent bg-accent/5 border-accent/15 rounded-xl border px-2 py-0.5 text-xs uppercase tabular-nums">
                      {job.period}
                    </span>
                  </div>
                  <ul className="mt-3 list-none space-y-2">
                    {job.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="text-muted/90 flex items-start gap-2 text-xs leading-relaxed text-pretty"
                      >
                        <span className="bg-accent/60 mt-1.5 size-1.5 flex-shrink-0 rounded-full" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Education Section */}
          <section className="space-y-4">
            <h2 className="text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-extrabold text-balance">
              <GraduationCap size={16} className="text-accent" />
              {activeCv.education.title}
            </h2>
            <div className="space-y-6">
              {activeCv.education.items.map((edu) => (
                <div
                  key={`${edu.school}-${edu.degree}`}
                  className="before:bg-stroke/60 relative pl-6 before:absolute before:top-1.5 before:bottom-0 before:left-1.5 before:w-px last:before:hidden"
                >
                  <div className="border-accent bg-bg absolute top-1 left-0 z-10 size-3.5 rounded-full border-2" />

                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-text-primary text-sm leading-tight font-semibold text-balance">
                        {edu.degree}
                      </h3>
                      <p className="text-muted text-xs text-pretty">
                        {edu.school}
                      </p>
                    </div>
                    <span className="text-muted rounded-xl bg-white/5 px-2 py-0.5 font-mono text-xs tabular-nums">
                      {edu.period}
                    </span>
                  </div>

                  {edu.details ? (
                    <div className="mt-3 rounded-lg border border-white/5 bg-white/5 p-3.5">
                      <p className="text-text-primary mb-2 flex items-center gap-1.5 text-xs font-semibold text-balance">
                        <span className="bg-accent h-3 w-1 rounded" />
                        {edu.details.thesisTitle}
                      </p>
                      <BulletList
                        bullets={edu.details.bullets}
                        className="list-none space-y-1.5"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {/* Certificates Section */}
          {activeCv.certificates ? (
            <section className="space-y-4">
              <h2 className="text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-extrabold text-balance">
                <Award size={16} className="text-accent" />
                {activeCv.certificates.title}
              </h2>
              <div className="space-y-6">
                {activeCv.certificates.items.map((cert) => (
                  <div
                    key={`${cert.issuer}-${cert.name}`}
                    className="before:bg-stroke/60 relative pl-6 before:absolute before:top-1.5 before:bottom-0 before:left-1.5 before:w-px last:before:hidden"
                  >
                    <div className="border-accent bg-bg absolute top-1 left-0 z-10 size-3.5 rounded-full border-2" />

                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-text-primary text-sm leading-tight font-semibold text-balance">
                          {cert.name}
                        </h3>
                        <p className="text-muted text-xs text-pretty">
                          {cert.issuer}
                        </p>
                      </div>
                      <span className="text-muted rounded-xl bg-white/5 px-2 py-0.5 font-mono text-xs tabular-nums">
                        {cert.date}
                      </span>
                    </div>

                    {cert.bullets && cert.bullets.length > 0 ? (
                      <BulletList bullets={cert.bullets} />
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Right: Skills & Languages */}
        <div className="space-y-8">
          {/* Skills Block */}
          <div className="space-y-6 rounded-2xl border border-white/5 bg-white/5 p-5">
            <h2 className="text-text-primary/90 flex items-center gap-2 border-b border-white/5 pb-2 text-sm font-extrabold text-balance uppercase">
              <Globe size={14} className="text-accent" />
              {activeCv.skills.title}
            </h2>

            <div className="space-y-4">
              {activeCv.skills.categories.map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <h3 className="text-accent text-xs font-semibold text-balance uppercase">
                    {cat.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((skill) => (
                      <span
                        key={skill}
                        className="text-muted/95 hover:text-text-primary rounded-xl border border-white/5 bg-white/5 px-2 py-1 text-xs transition-[background-color,color] select-none hover:bg-white/[0.08]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Languages Block */}
          <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-5">
            <h2 className="text-text-primary/90 flex items-center gap-2 border-b border-white/5 pb-2 text-sm font-extrabold text-balance uppercase">
              <Languages size={14} className="text-accent" />
              {activeCv.languages.title}
            </h2>

            <div className="space-y-2.5">
              {activeCv.languages.items.map((langItem) => (
                <div
                  key={langItem.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-text-primary font-normal">
                    {langItem.name}
                  </span>
                  <span className="text-accent bg-accent/10 border-accent/10 rounded-xl border px-2 py-0.5 font-mono text-xs font-semibold">
                    {langItem.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Warning Notice */}
          <div className="border-accent/20 bg-accent/5 space-y-2 rounded-lg border p-4 text-center md:hidden">
            <p className="text-muted text-xs text-pretty">
              PDF view is optimized for desktop viewports. To read the official
              document, you can open or download the PDF below.
            </p>
            <a
              href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-text-primary inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <ExternalLink size={12} />
              Open PDF Document
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});
