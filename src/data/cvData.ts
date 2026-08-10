import { CONTACT_EMAIL } from "../utils/contact";

const UNIZA_FRI_SK =
  "Žilinská univerzita v Žiline, Fakulta riadenia a informatiky, Žilina";
const UNIZA_FRI_EN =
  "University of Žilina, Faculty of Management Science and Informatics, Žilina";

interface CvExperienceItem {
  role: string;
  company: string;
  period: string;
  bullets: string[];
}

interface CvEducationItem {
  degree: string;
  school: string;
  period: string;
  details?: {
    thesisTitle: string;
    bullets: string[];
  };
}

interface CvSkillCategory {
  name: string;
  items: string[];
}

interface CvLanguage {
  name: string;
  level: string;
}

interface CvCertificateItem {
  name: string;
  issuer: string;
  date: string;
  bullets?: string[];
}

interface CvProfile {
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
  certificates?: {
    title: string;
    items: CvCertificateItem[];
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
      text: "Študent informačného manažmentu so zameraním na procesné mapovanie, AS-IS/TO-BE modelovanie a návrh digitálnych riešení. Praktické skúsenosti s identifikáciou problémových miest a optimalizáciou procesov v oblasti logistiky a HR s využitím nástroja ADONIS a notácie BPMN. Zameraný na prepojenie akademických vedomostí s practical biznis analýzou.",
    },
    experience: {
      title: "Pracovné skúsenosti",
      items: [
        {
          role: "Merchandiser pre Prazdroj",
          company: "ppm factum s.r.o., stredné Slovensko",
          period: "2020 – súčasnosť",
          bullets: [
            "Riadenie a analýza skladových zásob pre 30 produktových položiek značiek Prazdroj s dôrazom na minimalizáciu výpadkov (OOS).",
            "Identifikácia neefektívností na predajných miestach a návrh opatrení na zlepšenie rotácie tovaru.",
            "Návrhy objednávok na základe stavu zásob, dostupnosti produktov a aktuálnej situácie v predajni.",
            "Tvorba pravidelných reportov o dostupnosti produktov a poskytovanie analytickej spätnej väzby manažmentu.",
          ],
        },
      ],
    },
    education: {
      title: "Vzdelanie",
      items: [
        {
          degree: "Informačný manažment, inžinierske štúdium",
          school: UNIZA_FRI_SK,
          period: "2025 – súčasnosť",
          details: {
            thesisTitle: "Inžiniersky projekt (prebiehajúci)",
            bullets: [
              "Komplexné mapovanie a modelovanie procesov verejnej strednej školy v nástroji ADONIS (procesná mapa, 42 BPMN modelov, organizačná štruktúra, model dokumentov).",
            ],
          },
        },
        {
          degree: "Manažment, bakalárske štúdium, titul Bc.",
          school: UNIZA_FRI_SK,
          period: "Ukončené: 2025",
          details: {
            thesisTitle:
              "Bakalárska práca: Možnosti využitia digitálnych technológií v podnikoch",
            bullets: [
              "Analýza a AS-IS/TO-BE modelovanie v BPMN v 3 podnikoch, návrh riešení (Gantt, RACI) a ekonomické vyhodnotenie.",
            ],
          },
        },
      ],
    },
    skills: {
      title: "Zručnosti",
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
            "Requirements specification (funkčné/nefunkčné požiadavky, User Stories)",
            "RACI matica",
            "Ganttov diagram",
            "Základy UML",
            "Teoretické základy Agile a Scrum metodík (v rámci štúdia)",
          ],
        },
        {
          name: "Modelovacie nástroje",
          items: [
            "ADONIS (praktické použitie pri mapovaní procesov v inžinierskom projekte)",
            "Enterprise Architect (použitie v rámci štúdia)",
            "Camunda Modeler (základy)",
          ],
        },
        {
          name: "Podnikové systémy a digitalizácia",
          items: [
            "Znalosť konceptov ERP, CRM, WMS, TMS a HR systémov z akademických projektov a procesných analýz",
          ],
        },
        {
          name: "Kancelárske, analytické a dokumentačné nástroje",
          items: [
            "Microsoft Excel",
            "Microsoft PowerPoint",
            "Microsoft Word",
            "Confluence (základy)",
            "Reporting",
            "Tabuľky",
            "Filtre",
            "Základné vzorce",
            "Práca s dátami",
          ],
        },
        {
          name: "Pracovné zručnosti",
          items: [
            "Samostatnosť",
            "Systematický prístup",
            "Komunikácia",
            "Dôslednosť pri kontrole a reportingu",
            "Identifikácia nedostatkov",
          ],
        },
      ],
    },
    languages: {
      title: "Jazykové znalosti",
      items: [
        { name: "Slovenský jazyk", level: "Materinský" },
        { name: "Anglický jazyk", level: "B2" },
        { name: "Ruský jazyk", level: "B1" },
      ],
    },
    certificates: {
      title: "Certifikáty",
      items: [
        {
          name: "Introduction to ADONIS (Student Level Credential)",
          issuer:
            "The BOC Group & Žilinská univerzita v Žiline (Fakulta riadenia a informatiky)",
          date: "jún 2026",
          bullets: [
            "Rozvíjané zručnosti: Procesný manažment, biznis modelovanie, praktické mapovanie a konfigurácia atribútov.",
          ],
        },
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
      text: "Information Management student specializing in process mapping, AS-IS/TO-BE modeling, and digital solution design. Practical experience in identifying operational bottlenecks and optimizing processes in logistics and HR using ADONIS and BPMN notation. Focused on bridging academic knowledge with practical business analysis.",
    },
    experience: {
      title: "Work Experience",
      items: [
        {
          role: "Merchandiser for Prazdroj",
          company: "ppm factum s.r.o., Central Slovakia",
          period: "2020 – Present",
          bullets: [
            "Inventory management and analysis for 30 Prazdroj brand product items with an emphasis on minimizing out-of-stock (OOS) situations.",
            "Identifying inefficiencies at point-of-sale locations and proposing measures to improve inventory turnover.",
            "Drafting purchase orders based on stock status, product availability, and current store conditions.",
            "Generating regular product availability reports and providing analytical feedback to management.",
          ],
        },
      ],
    },
    education: {
      title: "Education",
      items: [
        {
          degree: "Information Management, Master's degree (Ing.)",
          school: UNIZA_FRI_EN,
          period: "2025 – Present",
          details: {
            thesisTitle: "Engineering Project (ongoing)",
            bullets: [
              "Comprehensive mapping and process modeling of a public secondary school in ADONIS (process map, 42 BPMN models, organizational structure, document model).",
            ],
          },
        },
        {
          degree: "Management, Bachelor's degree (Bc.)",
          school: UNIZA_FRI_EN,
          period: "Graduated: 2025",
          details: {
            thesisTitle:
              "Bachelor's Thesis: Options for Using Digital Technologies in Enterprises",
            bullets: [
              "Process analysis and AS-IS/TO-BE modeling in BPMN across 3 enterprises, solution design (Gantt, RACI), and economic evaluation.",
            ],
          },
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
            "Requirements Specification (functional/non-functional requirements, User Stories)",
            "RACI Matrix",
            "Gantt Charts",
            "UML Basics",
            "Agile & Scrum Fundamentals (academic context)",
          ],
        },
        {
          name: "Modeling Tools",
          items: [
            "ADONIS (practical application in engineering project process mapping)",
            "Enterprise Architect (academic use)",
            "Camunda Modeler (foundational)",
          ],
        },
        {
          name: "Enterprise Systems & Digitalization",
          items: [
            "Understanding of ERP, CRM, WMS, TMS, and HRIS concepts from academic projects and process audits",
          ],
        },
        {
          name: "Office, Analytical & Documentation Tools",
          items: [
            "Microsoft Excel",
            "Microsoft PowerPoint",
            "Microsoft Word",
            "Confluence (foundational)",
            "Reporting",
            "Spreadsheets",
            "Data Filtering",
            "Formulas",
            "Data Processing",
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
        { name: "English", level: "B2" },
        { name: "Russian", level: "B1" },
      ],
    },
    certificates: {
      title: "Certificates",
      items: [
        {
          name: "Introduction to ADONIS (Student Level Credential)",
          issuer:
            "The BOC Group & University of Žilina (Faculty of Management Science and Informatics)",
          date: "June 2026",
          bullets: [
            "Developed skills: Process management, business modeling, practical mapping, and attribute configuration.",
          ],
        },
      ],
    },
  },
};
