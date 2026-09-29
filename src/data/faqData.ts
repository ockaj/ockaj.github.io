export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  actionLink?: {
    label: string;
    action: "cv" | "work" | "processes" | "contact";
  };
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "education-career",
    question: "What is your educational background and target role?",
    answer:
      "I study Information Management as a Master's student (Ing.) at the University of Žilina, following my 2025 Bachelor's degree in Management. I target Junior Process Analyst and Junior Business Analyst roles focused on BPMN modeling, workflow analysis, and system requirements.",
    actionLink: {
      label: "View Full CV",
      action: "cv",
    },
  },
  {
    id: "projects-domains",
    question:
      "What enterprise processes and domains have you analyzed and modeled?",
    answer:
      "My process analysis work covers four operational areas:\n\n• Education & Public Sector (Master's Project): Complete process map and 42 BPMN 2.0 management models for a secondary school in ADONIS.\n• Logistics & Distribution (150 employees): Inbound storage, order picking, route dispatching, and TMS evaluation.\n• Manufacturing & Engineering (120 employees): Multi-shift CNC machining, mechanical assembly, and WMS selection.\n• Retail & HR (30 employees): Automated recruitment pipeline, applicant tracking (ATS), and paperless employee onboarding.",
    actionLink: {
      label: "Explore Case Studies",
      action: "work",
    },
  },
  {
    id: "evaluation-methods",
    question:
      "How do you evaluate and recommend enterprise software solutions?",
    answer:
      "I evaluate software options with Multi-Criteria Decision Analysis (Weighted Sum Method) across five criteria:\n\n1. Annual cost and licensing (K1)\n2. Usability and user experience (K2)\n3. Implementation speed and time to value (K3)\n4. Technical support quality and SLA (K4)\n5. Functional requirements coverage (K5)\n\nI combine scoring with RACI responsibility matrices and Gantt rollout schedules.",
  },
  {
    id: "tools-notations",
    question:
      "Which modeling notations, tools, and certifications do you have?",
    answer:
      "• Notations: BPMN 2.0 (events, gateways, subprocesses, pools/lanes) and foundational UML.\n• Software: ADONIS (Certified: Introduction to ADONIS by The BOC Group), Camunda Modeler, Enterprise Architect, MS Excel (data modeling), and SQL.\n• Frameworks: AS-IS / TO-BE gap analysis, User Stories, and ERP / WMS / TMS / HRIS system concepts.",
    actionLink: {
      label: "View Process Library",
      action: "processes",
    },
  },
  {
    id: "work-arrangements",
    question: "What working arrangements and locations are you available for?",
    answer:
      "I am completing my Master's degree at UNIZA FRI with graduation scheduled for 2027. During my studies, I am available for part-time junior analyst roles, project contracts, and hybrid or remote work. After graduation in 2027, I am available for full-time employment in Slovakia or remotely.",
  },
];
