import { memo, useCallback } from "react";
import { motion, LayoutGroup } from "motion/react";
import { Mail, Phone, MapPin, Languages } from "lucide-react";
import { LiquidGlassButton, StaticGlass } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";
import { SPRING } from "../../utils/springConfig";
import { cn } from "../../utils/cn";
import { CV_DATA, type CvDataLanguageSection } from "../../data/cvData";
import { useAppStore } from "../../store/useAppStore";

const PHONE_PREFIX_REGEX = /^[+\d]/;

function BulletList({
  bullets,
  className = "list-none space-y-2",
}: Readonly<{ bullets: readonly string[]; className?: string }>) {
  return (
    <ul className={className}>
      {bullets.map((bullet) => (
        <li
          key={bullet}
          className="flex items-start gap-2.5 text-sm leading-relaxed text-pretty text-muted/90"
        >
          <span className="mt-2 size-1 shrink-0 rounded-full bg-accent/70" />
          <span className="wrap-anywhere">{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

interface CvSectionProps<T> {
  data: T;
  lang: "en" | "sk";
}

function parseSkillItem(raw: string): { title: string; subtitle?: string } {
  const parenStart = raw.indexOf(" (");
  if (parenStart !== -1 && raw.endsWith(")")) {
    return {
      title: raw.slice(0, parenStart).trim(),
      subtitle: raw.slice(parenStart + 2, -1).trim(),
    };
  }
  return { title: raw.trim() };
}

const CvExperienceSection = memo(function CvExperienceSection({
  data,
  lang,
}: Readonly<CvSectionProps<CvDataLanguageSection["experience"]>>) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
        {data.title}
      </h2>
      {data.items.length === 0 ? (
        <StaticGlass
          roundedClass="rounded-2xl"
          className="block w-full text-left"
        >
          <div className="p-5 text-center text-muted md:p-6">
            <p className="text-sm">
              {lang === "sk"
                ? "Žiadne záznamy o praxi."
                : "No work experience entries available."}
            </p>
          </div>
        </StaticGlass>
      ) : (
        <StaticGlass
          roundedClass="rounded-2xl"
          className="block w-full text-left"
        >
          <div className="space-y-6 p-5 md:p-6">
            {data.items.map((job, idx) => (
              <div
                key={`${job.company}-${job.role}`}
                className={idx > 0 ? "border-t border-white/5 pt-6" : ""}
              >
                <div className="mb-3 space-y-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-base leading-tight font-semibold text-balance text-text-primary md:text-lg">
                      {job.role}
                    </h3>
                    <span className="shrink-0 text-sm text-muted tabular-nums">
                      {job.period}
                    </span>
                  </div>
                  <p className="text-sm text-pretty text-muted md:text-base">
                    {job.company}
                  </p>
                </div>
                <BulletList bullets={job.bullets} />
              </div>
            ))}
          </div>
        </StaticGlass>
      )}
    </section>
  );
});

const CvEducationSection = memo(function CvEducationSection({
  data,
  lang,
}: Readonly<CvSectionProps<CvDataLanguageSection["education"]>>) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
        {data.title}
      </h2>
      {data.items.length === 0 ? (
        <StaticGlass
          roundedClass="rounded-2xl"
          className="block w-full text-left"
        >
          <div className="p-5 text-center text-muted md:p-6">
            <p className="text-sm">
              {lang === "sk"
                ? "Žiadne záznamy o vzdelaní."
                : "No education records available."}
            </p>
          </div>
        </StaticGlass>
      ) : (
        <StaticGlass
          roundedClass="rounded-2xl"
          className="block w-full text-left"
        >
          <div className="space-y-6 p-5 md:p-6">
            {data.items.map((edu, idx) => (
              <div
                key={`${edu.school}-${edu.degree}`}
                className={idx > 0 ? "border-t border-white/5 pt-6" : ""}
              >
                <div className="space-y-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-base leading-tight font-semibold text-balance text-text-primary md:text-lg">
                      {edu.degree}
                    </h3>
                    <span className="shrink-0 text-sm text-muted tabular-nums">
                      {edu.period}
                    </span>
                  </div>
                  <p className="text-sm text-pretty text-muted md:text-base">
                    {edu.school}
                  </p>
                </div>

                {edu.details ? (
                  <div className="mt-3.5 space-y-2 pl-4 sm:pl-5">
                    <p className="text-sm font-medium text-balance text-text-primary/95 md:text-base">
                      {edu.details.thesisTitle}
                    </p>
                    <BulletList bullets={edu.details.bullets} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </StaticGlass>
      )}
    </section>
  );
});

const CvCertificatesSection = memo(function CvCertificatesSection({
  data,
  lang,
}: Readonly<
  CvSectionProps<NonNullable<CvDataLanguageSection["certificates"]>>
>) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
        {data.title}
      </h2>
      {data.items.length === 0 ? (
        <StaticGlass
          roundedClass="rounded-2xl"
          className="block w-full text-left"
        >
          <div className="p-5 text-center text-muted md:p-6">
            <p className="text-sm">
              {lang === "sk"
                ? "Žiadne certifikáty."
                : "No certificates available."}
            </p>
          </div>
        </StaticGlass>
      ) : (
        <StaticGlass
          roundedClass="rounded-2xl"
          className="block w-full text-left"
        >
          <div className="space-y-6 p-5 md:p-6">
            {data.items.map((cert, idx) => (
              <div
                key={`${cert.issuer}-${cert.name}`}
                className={idx > 0 ? "border-t border-white/5 pt-6" : ""}
              >
                <div className="space-y-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="text-base leading-tight font-semibold text-balance text-text-primary md:text-lg">
                      {cert.name}
                    </h3>
                    <span className="shrink-0 text-sm text-muted tabular-nums">
                      {cert.date}
                    </span>
                  </div>
                  <p className="text-sm text-pretty text-muted md:text-base">
                    {cert.issuer}
                  </p>
                </div>

                {cert.bullets && cert.bullets.length > 0 ? (
                  <div className="mt-3.5">
                    <BulletList bullets={cert.bullets} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </StaticGlass>
      )}
    </section>
  );
});

const CvSkillsSection = memo(function CvSkillsSection({
  data,
  lang,
}: Readonly<CvSectionProps<CvDataLanguageSection["skills"]>>) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
        {data.title}
      </h2>
      <StaticGlass
        roundedClass="rounded-2xl"
        className="block w-full text-left"
      >
        <div className="space-y-5 p-5 md:p-6">
          {data.categories.length === 0 ? (
            <p className="text-sm text-muted">
              {lang === "sk" ? "Žiadne zručnosti." : "No skills listed."}
            </p>
          ) : (
            data.categories.map((cat, idx) => (
              <div
                key={cat.name}
                className={cn(
                  "space-y-2.5",
                  idx > 0 && "border-t border-white/5 pt-5",
                )}
              >
                <h3 className="text-sm font-semibold tracking-wide text-text-primary">
                  {cat.name}
                </h3>
                <ul className="space-y-1.5">
                  {cat.items.map((skill) => {
                    const { title, subtitle } = parseSkillItem(skill);
                    return (
                      <li
                        key={skill}
                        className="group flex items-start gap-2.5 text-sm leading-relaxed text-pretty text-muted/90 transition-colors duration-150 hover:text-text-primary"
                      >
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-accent/70 transition-transform duration-150 group-hover:scale-125 group-hover:bg-accent" />
                        <span className="flex-1 wrap-anywhere">
                          <span>{title}</span>
                          {subtitle ? (
                            <>
                              <span className="mx-1.5 text-white/20 select-none">
                                ·
                              </span>
                              <span className="text-muted/70 transition-colors duration-150 group-hover:text-muted">
                                {subtitle}
                              </span>
                            </>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </StaticGlass>
    </section>
  );
});

const CvLanguagesSection = memo(function CvLanguagesSection({
  data,
  lang,
}: Readonly<CvSectionProps<CvDataLanguageSection["languages"]>>) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
        {data.title}
      </h2>
      <StaticGlass
        roundedClass="rounded-2xl"
        className="block w-full text-left"
      >
        <div className="p-5 md:p-6">
          {data.items.length === 0 ? (
            <p className="text-sm text-muted">
              {lang === "sk" ? "Žiadne jazyky." : "No languages listed."}
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {data.items.map((langItem) => (
                <div
                  key={langItem.name}
                  className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
                >
                  <span className="font-medium text-text-primary">
                    {langItem.name}
                  </span>
                  <span className="font-medium text-accent/90 tabular-nums">
                    {langItem.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </StaticGlass>
    </section>
  );
});

const CONTACT_PILL_CLASS =
  "inline-flex h-8 items-center px-3.5 text-sm font-normal text-muted";

const CV_LANGS = ["en", "sk"] as const;
const REDUCED_MOTION_TRANSITION = { duration: 0.15 } as const;

interface CvPhoneContactProps {
  phone: string;
  lang: "en" | "sk";
  prefersReducedMotion: boolean | null;
}

const CvPhoneContact = memo(function CvPhoneContact({
  phone,
  lang,
  prefersReducedMotion,
}: CvPhoneContactProps) {
  if (!phone) return null;

  const directionMultiplier = lang === "sk" ? 1 : -1;
  const xOffset = prefersReducedMotion ? 0 : 6 * directionMultiplier;
  const textTransition = prefersReducedMotion
    ? REDUCED_MOTION_TRANSITION
    : SPRING.stage;

  const phoneText = (
    <motion.span
      key={phone}
      initial={{
        opacity: 0,
        x: xOffset,
      }}
      animate={{ opacity: 1, x: 0 }}
      transition={textTransition}
      className="inline-block whitespace-nowrap"
    >
      {phone}
    </motion.span>
  );

  if (PHONE_PREFIX_REGEX.test(phone)) {
    return (
      <LiquidGlassButton
        href={`tel:${phone.replace(/[^\d+]/g, "")}`}
        className={cn(
          CONTACT_PILL_CLASS,
          "transition-colors hover:text-text-primary",
        )}
        innerClassName="inline-flex items-center gap-1.5 font-normal"
        ariaLabel={`Call ${phone}`}
      >
        <Phone size={14} className="shrink-0 text-accent" />
        {phoneText}
      </LiquidGlassButton>
    );
  }

  return (
    <StaticGlass
      as="span"
      roundedClass="rounded-full"
      className={CONTACT_PILL_CLASS}
      innerClassName="inline-flex items-center gap-1.5 font-normal"
    >
      <Phone size={14} className="shrink-0 text-accent" />
      {phoneText}
    </StaticGlass>
  );
});

interface InteractiveCvViewProps {
  activeCv: CvDataLanguageSection;
  lang: "en" | "sk";
}

export const InteractiveCvView = memo(function InteractiveCvView({
  activeCv,
  lang,
}: InteractiveCvViewProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleLangChange = useCallback((val: string | number) => {
    useAppStore.getState().setCvLang(val as "en" | "sk");
  }, []);

  const directionMultiplier = lang === "sk" ? 1 : -1;
  const roleXOffset = prefersReducedMotion ? 0 : 8 * directionMultiplier;
  const locationXOffset = prefersReducedMotion ? 0 : 6 * directionMultiplier;
  const headerTransition = prefersReducedMotion
    ? REDUCED_MOTION_TRANSITION
    : SPRING.stage;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Dossier Header Card */}
      <StaticGlass
        roundedClass="rounded-2xl"
        className="block w-full text-left"
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1.5">
              <h1 className="font-display text-3xl tracking-tight text-balance wrap-break-word text-text-primary md:text-4xl">
                {activeCv.title}
              </h1>
              <motion.p
                key={activeCv.role}
                initial={{
                  opacity: 0,
                  x: roleXOffset,
                }}
                animate={{ opacity: 1, x: 0 }}
                transition={headerTransition}
                className="font-body text-sm font-normal text-pretty wrap-break-word text-muted md:text-base"
              >
                {activeCv.role}
              </motion.p>

              {/* Contacts Strip */}
              <LayoutGroup id="cv-contact-strip">
                <div className="flex flex-wrap items-center gap-2 pt-3 text-sm text-muted tabular-nums">
                  <motion.span
                    layout={!prefersReducedMotion}
                    transition={headerTransition}
                    className="inline-flex"
                  >
                    <StaticGlass
                      as="span"
                      roundedClass="rounded-full"
                      className={CONTACT_PILL_CLASS}
                      innerClassName="inline-flex items-center gap-1.5 font-normal"
                    >
                      <MapPin size={14} className="shrink-0 text-accent" />
                      <motion.span
                        key={activeCv.location}
                        initial={{
                          opacity: 0,
                          x: locationXOffset,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={headerTransition}
                        className="inline-block whitespace-nowrap"
                      >
                        {activeCv.location}
                      </motion.span>
                    </StaticGlass>
                  </motion.span>

                  <motion.span
                    layout={!prefersReducedMotion}
                    transition={headerTransition}
                    className="inline-flex"
                  >
                    <LiquidGlassButton
                      href={`mailto:${activeCv.email}`}
                      className={cn(
                        CONTACT_PILL_CLASS,
                        "transition-colors hover:text-text-primary",
                      )}
                      innerClassName="inline-flex items-center gap-1.5 font-normal"
                      ariaLabel={`Email ${activeCv.email}`}
                    >
                      <Mail size={14} className="shrink-0 text-accent" />
                      <motion.span
                        key={lang}
                        initial={{
                          opacity: 0,
                          x: locationXOffset,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={headerTransition}
                        className="inline-block whitespace-nowrap"
                      >
                        {activeCv.email}
                      </motion.span>
                    </LiquidGlassButton>
                  </motion.span>

                  <motion.span
                    layout={!prefersReducedMotion}
                    transition={headerTransition}
                    className="inline-flex"
                  >
                    <CvPhoneContact
                      phone={activeCv.phone}
                      lang={lang}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </motion.span>
                </div>
              </LayoutGroup>
            </div>

            {/* Language Toggler */}
            <div className="flex items-center self-start md:self-auto">
              <Tabs
                value={lang}
                onChange={handleLangChange}
                layoutId="cv-language-pill"
                variant="segmented"
                roundedClass="rounded-xl"
                className="isolate inline-flex transform-gpu items-center rounded-xl bg-surface/80 p-1.25 shadow-inset-border backdrop-blur-md select-none"
                highlightClassName="navbar-highlight-flat"
              >
                <Tab
                  value="en"
                  roundedClass="rounded-lg"
                  className="relative flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium tracking-wide text-muted transition-colors duration-200 select-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  activeClassName="font-semibold text-text-primary"
                >
                  <Languages size={14} />
                  <span>EN</span>
                </Tab>
                <Tab
                  value="sk"
                  roundedClass="rounded-lg"
                  className="relative flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium tracking-wide text-muted transition-colors duration-200 select-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  activeClassName="font-semibold text-text-primary"
                >
                  <Languages size={14} />
                  <span>SK</span>
                </Tab>
              </Tabs>
            </div>
          </div>
        </div>
      </StaticGlass>

      {/* Main Content Grid Stage */}
      <div className="grid w-full grid-cols-1 grid-rows-1">
        {CV_LANGS.map((gridLang) => {
          const isSelected = lang === gridLang;
          const data = CV_DATA[gridLang];
          const offsetDirection = gridLang === "sk" ? 1 : -1;
          const xOffset = prefersReducedMotion ? 0 : 14 * offsetDirection;
          const activeSpring = isSelected ? SPRING.stage : SPRING.stageExit;
          const stageTransition = prefersReducedMotion
            ? REDUCED_MOTION_TRANSITION
            : activeSpring;

          return (
            <motion.div
              key={gridLang}
              aria-hidden={!isSelected}
              inert={!isSelected}
              initial={false}
              animate={
                isSelected ? { opacity: 1, x: 0 } : { opacity: 0, x: xOffset }
              }
              transition={stageTransition}
              className={cn(
                "col-start-1 row-start-1 w-full",
                isSelected ? "pointer-events-auto" : "pointer-events-none",
              )}
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column: Summary, Experience, Education, Certificates */}
                <div className="space-y-8 lg:col-span-2">
                  {/* Profile Section */}
                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
                      {data.profile.title}
                    </h2>
                    <StaticGlass
                      roundedClass="rounded-2xl"
                      className="block w-full text-left"
                    >
                      <div className="p-5 md:p-6">
                        <p className="font-body text-sm leading-relaxed text-pretty text-text-primary/90 md:text-base">
                          {data.profile.text}
                        </p>
                      </div>
                    </StaticGlass>
                  </section>

                  <CvExperienceSection data={data.experience} lang={gridLang} />
                  <CvEducationSection data={data.education} lang={gridLang} />
                  {data.certificates ? (
                    <CvCertificatesSection
                      data={data.certificates}
                      lang={gridLang}
                    />
                  ) : null}
                </div>

                {/* Right Column: Skills & Languages */}
                <div className="space-y-8">
                  <CvSkillsSection data={data.skills} lang={gridLang} />
                  <CvLanguagesSection data={data.languages} lang={gridLang} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
