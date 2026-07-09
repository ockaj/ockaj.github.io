import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  BoxIcon,
  Zap,
  Database,
  Briefcase,
  Palette,
  FileText,
} from "lucide-react";
import { LiquidGlass } from "./LiquidGlass/LiquidGlass";
import BpmnNodeBadge from "./BpmnNodeBadge";

const isBuildMode =
  typeof window !== "undefined" &&
  (window as unknown as { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD;

const SKILL_CATEGORIES = [
  {
    title: "Process Analysis",
    icon: BoxIcon,
    skills: [
      "BPMN Modeling",
      "AS-IS/TO-BE Analysis",
      "Process Mapping",
      "Problem Identification",
      "Solution Design",
    ],
    gridSpan: "md:col-span-2",
    isWide: true,
  },
  {
    title: "Modeling Tools",
    icon: Zap,
    skills: [
      "ADONIS (Expert)",
      "Camunda Modeler",
      "Enterprise Architect",
      "UML Fundamentals",
    ],
    gridSpan: "md:col-span-1",
    isWide: false,
  },
  {
    title: "Enterprise Systems",
    icon: Database,
    skills: [
      "ERP Concepts",
      "CRM Architecture",
      "WMS Knowledge",
      "TMS Understanding",
      "HRIS Design",
    ],
    gridSpan: "md:col-span-1",
    isWide: false,
  },
  {
    title: "Business Strategy",
    icon: Briefcase,
    skills: [
      "Requirements Specification",
      "RACI Matrix",
      "Gantt Diagram Planning",
      "Change Management",
      "Stakeholder Communication",
    ],
    gridSpan: "md:col-span-2",
    isWide: true,
  },
  {
    title: "Design & Visualization",
    icon: Palette,
    skills: [
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Affinity Design",
      "3ds Max",
      "Visual Interface Design",
    ],
    gridSpan: "md:col-span-2",
    isWide: true,
  },
  {
    title: "Office & Analytics",
    icon: FileText,
    skills: [
      "Excel Advanced",
      "PowerPoint",
      "Word",
      "Confluence",
      "Data Analysis & Reporting",
    ],
    gridSpan: "md:col-span-1",
    isWide: false,
  },
];

const LANGUAGES = [
  { language: "Slovak", level: "Native" },
  { language: "English", level: "Fluent (B2)" },
  { language: "Russian", level: "Intermediate (B1)" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: (prefersReducedMotion: boolean) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 30,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function Skills() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="px-6 md:px-10 lg:px-16">
      {/* Skills Bento Grid */}
      <motion.div
        custom={prefersReducedMotion}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
        variants={containerVariants}
        initial={isBuildMode ? "visible" : "hidden"}
        whileInView={isBuildMode ? undefined : "visible"}
        viewport={isBuildMode ? undefined : { once: true, margin: "-80px" }}
      >
        {SKILL_CATEGORIES.map((category) => (
          <motion.div
            key={category.title}
            variants={cardVariants}
            custom={prefersReducedMotion}
            className={`${category.gridSpan} h-full`}
          >
            <SkillCard category={category} />
          </motion.div>
        ))}
      </motion.div>

      {/* Languages — inline tags */}
      <motion.div
        initial={
          isBuildMode
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: prefersReducedMotion ? 0 : 30 }
        }
        whileInView={isBuildMode ? undefined : { opacity: 1, y: 0 }}
        viewport={isBuildMode ? undefined : { once: true, margin: "-80px" }}
        className="relative z-30 pt-10 md:pt-14"
      >
        <div className="mb-6 flex items-center gap-3">
          <BpmnNodeBadge
            type="gateway-parallel"
            className="translate-y-[1px]"
          />
          <h3 className="text-lg font-semibold text-text-primary">Languages</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          {LANGUAGES.map((lang) => (
            <LiquidGlass
              key={lang.language}
              as="div"
              className="px-4 py-2"
              innerClassName="flex items-center gap-3"
              magnetic={false}
              tilt
            >
              <span className="text-sm font-semibold text-text-primary">
                {lang.language}
              </span>
              <span className="text-xs text-muted">{lang.level}</span>
            </LiquidGlass>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

interface Category {
  title: string;
  icon: React.ElementType;
  skills: string[];
  gridSpan: string;
  isWide: boolean;
}

const SkillCard = memo(function SkillCard({
  category,
}: {
  category: Category;
}) {
  const Icon = category.icon;

  return (
    <LiquidGlass
      as="div"
      roundedClass="rounded-2xl"
      className="w-full h-full p-6 md:p-8 flex-col text-left justify-start items-stretch"
      tilt
    >
      <div
        className={`flex flex-col ${category.isWide ? "md:flex-row md:justify-between md:gap-8" : ""} h-full w-full`}
      >
        {/* Left content block */}
        <div
          className={
            category.isWide
              ? "md:max-w-[40%] flex-shrink-0 mb-5 md:mb-0"
              : "mb-5"
          }
        >
          {/* Icon & Title */}
          <div className="flex items-center gap-3">
            <Icon
              size={20}
              className="text-muted group-hover:text-accent transition-colors duration-300 flex-shrink-0"
            />
            <h3 className="text-base font-semibold text-text-primary text-balance">
              {category.title}
            </h3>
          </div>
        </div>

        <div
          className={`space-y-2.5 ${category.isWide ? "md:flex-1 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-2.5 md:space-y-0 md:self-center" : ""}`}
        >
          {category.skills.map((skill) => (
            <p
              key={skill}
              className="text-sm text-muted/80 flex items-start gap-1 cursor-default text-pretty skill-item-hover group/item"
            >
              <span className="w-4 h-5 flex items-center justify-start flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/60 group-hover/item:w-3.5 transition-[width,background-color] duration-200 ease-out group-hover/item:bg-accent" />
              </span>
              <span className="flex-1 skill-item-text">{skill}</span>
            </p>
          ))}
        </div>
      </div>
    </LiquidGlass>
  );
});

export default memo(Skills);
