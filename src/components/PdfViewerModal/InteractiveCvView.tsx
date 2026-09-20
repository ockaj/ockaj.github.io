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
          className="flex items-start gap-1.5 text-sm text-pretty text-muted"
        >
          <span className="mt-0.5 shrink-0 text-accent">•</span>
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
        <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-tr from-accent/5 to-transparent" />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-xl bg-accent/10 px-2.5 py-0.5 text-sm font-semibold tracking-wider text-accent uppercase">
              {lang === "en" ? "Active Resume" : "Aktívny Životopis"}
            </span>
          </div>
          <h1 className="mb-1 font-display text-3xl text-balance text-text-primary md:text-4xl">
            {activeCv.title}
          </h1>
          <p className="font-body text-base font-normal text-pretty text-text-primary/95">
            {activeCv.role}
          </p>

          {/* Contacts */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted tabular-nums">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-accent/65" />
              {activeCv.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={12} className="text-accent/65" />
              <a
                href={`mailto:${activeCv.email}`}
                className="transition-colors hover:text-text-primary"
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
                    className="transition-colors hover:text-text-primary"
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
              "flex items-center gap-1 px-3 py-1.5 text-sm font-semibold",
              lang === "en" ? "text-accent" : "text-muted",
            )}
          >
            <Languages size={11} />
            EN
          </LiquidGlassButton>
          <LiquidGlassButton
            onClick={() => useAppStore.getState().setCvLang("sk")}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-sm font-semibold",
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
            <h2 className="flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-semibold text-balance text-text-primary">
              <Sparkles size={16} className="text-accent" />
              {activeCv.profile.title}
            </h2>
            <p className="font-body text-sm leading-relaxed text-pretty text-muted">
              {activeCv.profile.text}
            </p>
          </section>

          {/* Experience Section */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-semibold text-balance text-text-primary">
              <Briefcase size={16} className="text-accent" />
              {activeCv.experience.title}
            </h2>
            <div className="space-y-6">
              {activeCv.experience.items.map((job) => (
                <div
                  key={`${job.company}-${job.role}`}
                  className="relative pl-6 before:absolute before:top-1.5 before:bottom-0 before:left-1.5 before:w-px before:bg-stroke/60"
                >
                  <div className="absolute top-1 left-0 z-10 size-3.5 rounded-full border-2 border-accent bg-bg shadow-sm" />

                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base leading-tight font-semibold text-balance text-text-primary">
                        {job.role}
                      </h3>
                      <p className="text-sm text-pretty text-muted">
                        {job.company}
                      </p>
                    </div>
                    <span className="rounded-xl border border-accent/15 bg-accent/5 px-2.5 py-0.5 text-xs font-semibold text-accent uppercase tabular-nums">
                      {job.period}
                    </span>
                  </div>
                  <ul className="mt-3 list-none space-y-2">
                    {job.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm leading-relaxed text-pretty text-muted/90"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent/60" />
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
            <h2 className="flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-semibold text-balance text-text-primary">
              <GraduationCap size={16} className="text-accent" />
              {activeCv.education.title}
            </h2>
            <div className="space-y-6">
              {activeCv.education.items.map((edu) => (
                <div
                  key={`${edu.school}-${edu.degree}`}
                  className="relative pl-6 before:absolute before:top-1.5 before:bottom-0 before:left-1.5 before:w-px before:bg-stroke/60 last:before:hidden"
                >
                  <div className="absolute top-1 left-0 z-10 size-3.5 rounded-full border-2 border-accent bg-bg" />

                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base leading-tight font-semibold text-balance text-text-primary">
                        {edu.degree}
                      </h3>
                      <p className="text-sm text-pretty text-muted">
                        {edu.school}
                      </p>
                    </div>
                    <span className="rounded-xl bg-white/5 px-2.5 py-0.5 font-mono text-xs text-muted tabular-nums">
                      {edu.period}
                    </span>
                  </div>

                  {edu.details ? (
                    <div className="mt-3 rounded-lg border border-white/5 bg-white/5 p-3.5">
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-balance text-text-primary">
                        <span className="h-3 w-1 rounded bg-accent" />
                        {edu.details.thesisTitle}
                      </p>
                      <BulletList
                        bullets={edu.details.bullets}
                        className="list-none space-y-1.5 text-sm leading-relaxed"
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
              <h2 className="flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-semibold text-balance text-text-primary">
                <Award size={16} className="text-accent" />
                {activeCv.certificates.title}
              </h2>
              <div className="space-y-6">
                {activeCv.certificates.items.map((cert) => (
                  <div
                    key={`${cert.issuer}-${cert.name}`}
                    className="relative pl-6 before:absolute before:top-1.5 before:bottom-0 before:left-1.5 before:w-px before:bg-stroke/60 last:before:hidden"
                  >
                    <div className="absolute top-1 left-0 z-10 size-3.5 rounded-full border-2 border-accent bg-bg" />

                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base leading-tight font-semibold text-balance text-text-primary">
                          {cert.name}
                        </h3>
                        <p className="text-sm text-pretty text-muted">
                          {cert.issuer}
                        </p>
                      </div>
                      <span className="rounded-xl bg-white/5 px-2.5 py-0.5 font-mono text-xs text-muted tabular-nums">
                        {cert.date}
                      </span>
                    </div>

                    {cert.bullets && cert.bullets.length > 0 ? (
                      <BulletList
                        bullets={cert.bullets}
                        className="text-sm leading-relaxed"
                      />
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
            <h2 className="flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-semibold text-balance text-text-primary">
              <Globe size={16} className="text-accent" />
              {activeCv.skills.title}
            </h2>

            <div className="space-y-4">
              {activeCv.skills.categories.map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <h3 className="text-sm font-semibold text-balance text-accent">
                    {cat.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-xl border border-white/5 bg-white/5 px-3 py-1 text-sm text-muted/95 transition-colors select-none hover:bg-white/8 hover:text-text-primary"
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
            <h2 className="flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-semibold text-balance text-text-primary">
              <Languages size={16} className="text-accent" />
              {activeCv.languages.title}
            </h2>

            <div className="space-y-2.5">
              {activeCv.languages.items.map((langItem) => (
                <div
                  key={langItem.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-normal text-text-primary">
                    {langItem.name}
                  </span>
                  <span className="rounded-xl border border-accent/10 bg-accent/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-accent">
                    {langItem.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Warning Notice */}
          <div className="space-y-2 rounded-lg border border-accent/20 bg-accent/5 p-4 text-center md:hidden">
            <p className="text-sm text-pretty text-muted">
              PDF view is optimized for desktop viewports. To read the official
              document, you can open or download the PDF below.
            </p>
            <a
              href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-text-primary"
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
