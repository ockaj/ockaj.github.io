# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters, hiring managers, and enterprise team leads evaluating candidates for Junior Business Analyst and Junior Process Analyst positions. Users require verified competency in formal process modeling (BPMN 2.0, ADONIS), systematic workflow analysis, and modern presentation standards.

## Product Purpose

Showcase Bc. Ondrej Michal Očkaj's skills, experience, and academic deliverables as a Junior Business Analyst and Junior Process Analyst. He is pursuing an engineering Master's degree (Ing., 2025–2027) in Information Management at UNIZA FRI. The portfolio demonstrates practical competency in AS-IS / TO-BE process mapping, enterprise digitization, and BPMN 2.0 optimization.

## Positioning

Junior Business & Process Analyst bridging rigorous formal notation (BPMN 2.0, ADONIS) with analytical clarity, modern engineering standards, and tactile design-conscious execution.

## Operating Context

- Single-page interactive portfolio web application hosted on GitHub Pages (`ockaj.me`).
- Desktop and mobile web browsing by recruiters and technical interviewers.
- Primary CTA: Open CV modal for interactive English or Slovak review, or PDF download.
- Secondary CTA: Inspect interactive BPMN process models, review enterprise case studies, read technical journal articles, and initiate contact.
- Candidate Availability: Available for part-time junior analyst roles, project contracts, and flexible hybrid or remote work during Master's studies. Available for full-time employment upon graduation in 2027.

## Capabilities and Constraints

- Process diagram lightbox (`ProcessLightbox.tsx`) with pan and zoom functionality (`react-zoom-pan-pinch`) for AS-IS and TO-BE SVG process models.
- Desktop interactive site navigation flow overlay (`BpmnOverlay.tsx` / `BpmnDiagram.tsx`) triggered by typing `b-p-m-n` or visiting `#bpmn`.
- Seven landmark scroll-spy sections: `#home`, `#work`, `#skills`, `#processes`, `#journal`, `#faq`, and `#contact`.
- Deep-link overlay routing via URL hash (`#cv`, `#case-study-1`, `#article-bpmn-traps`, `#article-process-modeling-languages`, `#lightbox-<id>`, `#bpmn`, `#nav`, `#menu`).
- Headless Base UI modal dialogs and drawer primitives with non-blocking exit springs and scroll lock coordination.
- Tactile LiquidGlass primitives (`InteractiveGlass`, `StaticGlass`, `LiquidGlassButton`, `Tabs`, `Tab`) with cursor-following specular glow, spring recoil, and 3D tilt.
- WebGL background aurora effect (OGL) with hardware GPU validation and `@media (prefers-reduced-motion: reduce)` vector SVG fallback (`AuroraFallback.tsx`).
- Dual-language interactive CV viewer (`InteractiveCvView.tsx`) rendering structured English and Slovak data, alongside direct PDF download.
- Markdown technical journal articles parsed via `react-markdown` and `remark-gfm` with frontmatter metadata.
- Static architecture: Hosted on GitHub Pages with zero backend services and zero dynamic databases.
- Native typography scaling: Authentic support for compact sizes (10pt–13pt / `text-xs` to `text-[13px]`) for footnotes, captions, tags, and micro-metadata, paired with high-contrast obsidian surfaces.
- Mobile interaction ergonomics: Compact circular glass overlay badge (`size-7 rounded-full`) for diagram expansion on phones, and balanced stacked contact actions sharing a unified `max-w-sm` container width.

## Brand Commitments

- Name: Bc. Ondrej Michal Očkaj
- Target Roles: Junior Business Analyst, Junior Process Analyst
- Contact: `ondrej.michal.ockaj@gmail.com`
- Location: Slovakia (Žilina)
- Personality: Analytical, precise, systematic, design-conscious.
- Anti-references: Generic SaaS templates (creamy or beige palettes, ghost cards with thin borders and heavy drop shadows), repetitive uppercase tracked section eyebrows, and cartoon illustrations.

## Evidence on Hand

- Master's engineering project (Ing. at UNIZA FRI, 2025–2027): Comprehensive process mapping of a public secondary school in ADONIS. Phase 1 complete: 42 management models, high-level process landscape architecture, organizational structure model, and centralized document model. Phase 2 covering core educational and supporting processes begins in September.
- Bachelor's thesis (Bc. at UNIZA FRI, graduated 2025): "Options for Using Digital Technologies in Enterprises", analyzing and modeling AS-IS/TO-BE processes in BPMN across 3 enterprises:
  - Logistics & Distribution (150 employees): Inbound storage, order picking, route dispatching, and TMS software evaluation.
  - Manufacturing & Engineering (120 employees): Multi-shift CNC machining, mechanical assembly, and WMS software evaluation.
  - Retail & HR (30 employees): Automated recruitment pipeline, applicant tracking (ATS), and paperless employee onboarding.
- Professional Certification: "Introduction to ADONIS (Student Level Credential)" by The BOC Group & UNIZA FRI (issued June 2026), verifying practical skills in process management, business modeling, and attribute configuration.
- Evaluation Methodology: Structured Multi-Criteria Decision Analysis (Weighted Sum Method) evaluating 5 core dimensions (Cost & Licensing, Usability, Implementation Speed, Support SLA, Functional Coverage), combined with formal RACI matrices and Gantt implementation schedules.
- 3 interactive AS-IS / TO-BE diagram pairs in SVG/BPMN format (Conflict Resolution, Project Coordination, System Integration).
- 2 published technical articles: BPMN 2.0 modeling pipeline in ADONIS (`bpmn-traps`), and 12-language process modeling comparison matrix (`process-modeling-languages`).
- Dual-mode CV: Interactive English/Slovak modal viewer and downloadable PDF file (`/cv/Ondrej_Michal_Ockaj_CV.pdf`).
- Commercial role: Merchandiser at `ppm factum s.r.o.` for Plzeňský Prazdroj (2020 to present), managing stock analysis, out-of-stock minimization across 30 product items, and store efficiency reporting.

## Product Principles

- **Systematic Notation Rigor**: Present process workflows, RACI matrices, and decision logic using formal notation standards (BPMN 2.0, DMN, ADONIS) rather than informal sketches.
- **Verifiable Deliverables**: Ground claims in audited models, real case metrics (42 school processes, 3 thesis enterprises), and official credentials.
- **Dual-Audience Communication**: Balance deep technical process models for lead analysts with fast scanability and clear summaries for recruiters.
- **Tactile Craft & Zero Performance Cost**: Deliver physical glass feedback and micro-interactions with spring physics while preserving 60fps performance and static asset efficiency.
- **Honest & Direct**: Focus on verified project facts and transparent academic timelines. Avoid empty marketing claims and buzzword exaggeration.

## Accessibility & Inclusion

- Contrast ratio >= 4.5:1 for body copy and >= 3:1 for large display elements.
- Complete `@media (prefers-reduced-motion: reduce)` fallbacks for WebGL aurora, LiquidGlass effects, and layout animations.
- Reduced transparency support (`@media (prefers-reduced-transparency: reduce)`) reverting glass blurs to solid opaque surfaces.
- High contrast support (`@media (prefers-contrast: more)`).
- Native HTML landmark structure, full keyboard navigability (`Tab` navigation, `Escape` key handlers), and visible focus rings.
- Native typography system supporting compact footnote and caption scales (10pt–13pt / `text-xs` to `text-[13px]`) for high-density analytical diagrams, alongside comfortable reading baselines for primary content.
