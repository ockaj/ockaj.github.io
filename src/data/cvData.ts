import { CONTACT_EMAIL } from "../utils/contact";

export interface CvExperienceItem {
  role: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface CvEducationItem {
  degree: string;
  school: string;
  period: string;
  details?: {
    thesisTitle: string;
    bullets: string[];
  };
}

export interface CvSkillCategory {
  name: string;
  items: string[];
}

export interface CvLanguage {
  name: string;
  level: string;
}

export interface CvProfile {
  title: string;
  text: string;
}

export interface CvDataLanguageSection {
  title: string;
  role: string;
  location: string;
  email: string;
  phone: string;
  profile: CvProfile;
  experience: {
    title: string;
    items: CvExperienceItem[];
  };
  education: {
    title: string;
    items: CvEducationItem[];
  };
  skills: {
    title: string;
    categories: CvSkillCategory[];
  };
  languages: {
    title: string;
    items: CvLanguage[];
  };
}

export interface CvData {
  sk: CvDataLanguageSection;
  en: CvDataLanguageSection;
}

export const CV_DATA: CvData = {
  sk: {
    title: "Bc. Ondrej Michal Očkaj",
    role: "Junior Business Analyst | Process Analyst | BPMN | ADONIS",
    location: "Slovensko",
    email: CONTACT_EMAIL,
    phone: "Telefónne číslo na vyžiadanie",
    profile: {
      title: "Profil",
      text: "Som študent informačného manažmentu so zameraním na procesné mapovanie, BPMN, AS-IS/TO-BE modelovanie a návrh digitálnych riešení. V bakalárskej práci som analyzoval procesy v 3 podnikoch v oblastiach skladového hospodárstva, dopravnej logistiky a HR, identifikoval problémové miesta a navrhol zlepšenia vrátane implementačného plánu, Ganttovho diagramu, RACI matice a ekonomického vyhodnotenia. Mám praktickú skúsenosť s nástrojom ADONIS, základnú skúsenosť s Camunda Modelerom a Enterprise Architectom.",
    },
    experience: {
      title: "Pracovné skúsenosti",
      items: [
        {
          role: "Merchandiser pre Prazdroj",
          company: "ppm factum s.r.o., stredné Slovensko",
          period: "2020 – súčasnosť",
          bullets: [
            "Kontrola približne 30 produktových položiek značiek Birell, Gambrinus, Kozel, Pilsner Urquell, Radegast a Šariš vrátane dostupnosti, vystavenia, rotácie a exspirácie tovaru.",
            "Identifikácia nedostatkov v regáloch, promo vystaveniach a doplnení tovaru.",
            "Návrhy objednávok na základe stavu zásob, dostupnosti produktov a aktuálnej situácie v predajni.",
            "Spracovanie reportov po návštevách predajného miesta a poskytovanie spätnej väzby k dostupnosti, vystaveniu a doplneniu tovaru.",
            "Komunikácia s pracovníkmi predajného miesta a samostatné plnenie úloh podľa harmonogramu návštev a pravidiel merchandisingu.",
          ],
        },
      ],
    },
    education: {
      title: "Vzdelanie",
      items: [
        {
          degree: "Informačný manažment, inžinierske štúdium",
          school:
            "Žilinská univerzita v Žiline, Fakulta riadenia a informatiky, Žilina",
          period: "2025 – súčasnosť",
        },
        {
          degree: "Manažment, bakalárske štúdium, Bc.",
          school:
            "Žilinská univerzita v Žiline, Fakulta riadenia a informatiky, Žilina",
          period: "Ukončené: 2025",
          details: {
            thesisTitle:
              "Bakalárska práca: Možnosti využitia digitálnych technológií v podnikoch",
            bullets: [
              "Analýza procesov v 3 podnikoch so zameraním na skladové hospodárstvo, dopravnú logistiku a HR.",
              "AS-IS a TO-BE modelovanie v BPMN a identifikácia problémových miest.",
              "Návrh digitálnych riešení vrátane implementačného plánu, Ganttovho diagramu a RACI matice.",
              "Ekonomické a mimoekonomické vyhodnotenie navrhovaných riešení.",
            ],
          },
        },
        {
          degree: "Gymnaziálne štúdium so zameraním na dizajn",
          school: "Súkromné gymnázium Banskobystrické, Banská Bystrica",
          period: "Ukončené: 2022",
        },
      ],
    },
    skills: {
      title: "Zručnosti & Kompetencie",
      categories: [
        {
          name: "Procesná a biznis analýza",
          items: [
            "BPMN",
            "AS-IS/TO-BE modelovanie",
            "Process mapping",
            "Procesná analýza",
            "Identifikácia problémových miest",
            "Návrh riešení",
            "Requirements specification",
            "RACI matica",
            "Ganttov diagram",
            "Základy UML",
          ],
        },
        {
          name: "Modelovacie nástroje",
          items: [
            "ADONIS (praktické použitie)",
            "Enterprise Architect (štúdium)",
            "Camunda Modeler (základy)",
          ],
        },
        {
          name: "Podnikové systémy",
          items: [
            "Koncepty ERP, CRM, WMS, TMS a HR systémov z akademických projektov a procesných analýz",
          ],
        },
        {
          name: "Kancelárske a dokumentačné nástroje",
          items: [
            "Microsoft Excel",
            "Microsoft PowerPoint",
            "Microsoft Word",
            "Confluence (reporty, filtre, vzorce, analýza dát)",
          ],
        },
        {
          name: "Grafické a dizajnové nástroje",
          items: [
            "Adobe Photoshop",
            "Adobe Illustrator",
            "Affinity Design",
            "3ds Max",
            "ZBrush (vizuálne podklady a rozhrania)",
          ],
        },
        {
          name: "Pracovné zručnosti",
          items: [
            "Samostatnosť",
            "Systematický prístup",
            "Komunikácia",
            "Dôslednosť pri kontrole",
            "Identifikácia nedostatkov",
          ],
        },
      ],
    },
    languages: {
      title: "Jazykové znalosti",
      items: [
        { name: "Slovenský jazyk", level: "Materinský" },
        { name: "Anglický jazyk", level: "Fluent (B2)" },
        { name: "Ruský jazyk", level: "Intermediate (B1)" },
      ],
    },
  },
  en: {
    title: "Bc. Ondrej Michal Očkaj",
    role: "Junior Business Analyst | Process Analyst | BPMN | ADONIS",
    location: "Slovakia",
    email: CONTACT_EMAIL,
    phone: "Phone number on request",
    profile: {
      title: "Profile",
      text: "I am an Information Management student specializing in process mapping, BPMN, AS-IS/TO-BE modeling, and digital solution design. In my bachelor's thesis, I analyzed processes in 3 enterprises focusing on warehouse management, transportation logistics, and HR, identifying bottlenecks and proposing improvements including an implementation roadmap, Gantt chart, RACI matrix, and economic evaluation. I have practical experience with ADONIS and foundational experience with Camunda Modeler and Enterprise Architect.",
    },
    experience: {
      title: "Work Experience",
      items: [
        {
          role: "Merchandiser for Prazdroj",
          company: "ppm factum s.r.o., Central Slovakia",
          period: "2020 – Present",
          bullets: [
            "Audited approximately 30 product lines (Birell, Gambrinus, Kozel, Pilsner Urquell, Radegast, and Šariš), monitoring stock availability, shelf display quality, inventory rotation, and expiration dates.",
            "Identified out-of-stock items, promotional placement deficiencies, and restocked shelves.",
            "Prepared purchase order recommendations based on stock levels, product availability, and real-time in-store scenarios.",
            "Compiled detailed visit reports and provided feedback on stock availability, placement, and replenishment status.",
            "Coordinated with store managers and executed tasks independently based on visit schedules and merchandising guidelines.",
          ],
        },
      ],
    },
    education: {
      title: "Education",
      items: [
        {
          degree: "Information Management, Master's degree (Ing.)",
          school:
            "University of Žilina, Faculty of Management Science and Informatics, Žilina",
          period: "2025 – Present",
        },
        {
          degree: "Management, Bachelor's degree (Bc.)",
          school:
            "University of Žilina, Faculty of Management Science and Informatics, Žilina",
          period: "Graduated: 2025",
          details: {
            thesisTitle:
              "Bachelor's Thesis: Options for Using Digital Technologies in Enterprises",
            bullets: [
              "Analyzed processes in 3 companies focusing on warehouse management, transport logistics, and human resources.",
              "Designed AS-IS and TO-BE processes using BPMN 2.0 and identified operational bottlenecks.",
              "Proposed digital solutions, including an implementation plan, Gantt chart, and RACI matrix.",
              "Performed economic and non-economic evaluations of the proposed solutions.",
            ],
          },
        },
        {
          degree: "Secondary School with focus on Design",
          school: "Súkromné gymnázium Banskobystrické, Banská Bystrica",
          period: "Graduated: 2022",
        },
      ],
    },
    skills: {
      title: "Skills & Competencies",
      categories: [
        {
          name: "Process & Business Analysis",
          items: [
            "BPMN",
            "AS-IS/TO-BE Modeling",
            "Process Mapping",
            "Process Analysis",
            "Bottleneck Identification",
            "Solution Design",
            "Requirements Specification",
            "RACI Matrix",
            "Gantt Charts",
            "UML Basics",
          ],
        },
        {
          name: "Modeling Tools",
          items: [
            "ADONIS (practical application)",
            "Enterprise Architect (academic use)",
            "Camunda Modeler (foundational)",
          ],
        },
        {
          name: "Enterprise Systems",
          items: [
            "Understanding of ERP, CRM, WMS, TMS, and HRIS concepts through academic projects and process audits",
          ],
        },
        {
          name: "Office & Documentation Tools",
          items: [
            "Microsoft Excel",
            "Microsoft PowerPoint",
            "Microsoft Word",
            "Confluence (reports, filters, formulas, data management)",
          ],
        },
        {
          name: "Graphic & Design Tools",
          items: [
            "Adobe Photoshop",
            "Adobe Illustrator",
            "Affinity Suite",
            "3ds Max",
            "ZBrush (creating visual assets and UI layout designs)",
          ],
        },
        {
          name: "Professional Competencies",
          items: [
            "Self-reliance",
            "Systematic Approach",
            "Communication",
            "Accuracy in Control & Reporting",
            "Discrepancy Identification",
          ],
        },
      ],
    },
    languages: {
      title: "Languages",
      items: [
        { name: "Slovak", level: "Native" },
        { name: "English", level: "Fluent (B2)" },
        { name: "Russian", level: "Intermediate (B1)" },
      ],
    },
  },
};
