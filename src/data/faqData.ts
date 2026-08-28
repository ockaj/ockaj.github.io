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
      "I am currently studying for a Master's degree (Ing.) in Information Management at the University of Žilina (Faculty of Management Science and Informatics), having graduated with a Bachelor's degree (Bc.) in Management in 2025. I am targeting Junior Process Analyst and Junior Business Analyst positions focusing on structured process mapping, BPMN modeling, and digital optimization.",
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
      "My process analysis work spans four operational domains:\n\n• Education & Public Sector (Ongoing Master's Project): Complete process architecture map and 42 BPMN 2.0 management models for a public secondary school in ADONIS.\n• Logistics & Distribution (150 employees): Inbound storage, order picking, route dispatching, and TMS evaluation.\n• Manufacturing & Engineering (120 employees): Multi-shift CNC machining, mechanical assemblies, and WMS software selection.\n• Retail & HR (30 employees): Automated recruitment pipeline, applicant tracking (ATS), and paperless employee onboarding.",
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
      "I apply structured Multi-Criteria Decision Analysis (Weighted Sum Method) evaluating 5 core dimensions:\n\n1. Total Annual Cost & Licensing (K1)\n2. User Experience & Usability (K2)\n3. Implementation Speed & Time-to-Value (K3)\n4. Technical Support Quality & SLA (K4)\n5. Functional Coverage & Requirements Match (K5)\n\nI combine this evaluation with formal RACI responsibility matrices and Gantt implementation schedules to ensure realistic project execution.",
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
      "I am currently completing my Master's degree (Ing.) at UNIZA FRI with state exams scheduled for 2027. I am actively seeking part-time junior analyst roles, project contracts, or flexible hybrid and remote work alongside my university studies. Upon graduation in 2027, I look forward to transitioning into full-time employment across Slovakia or remote.",
  },
];
