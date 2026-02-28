# Angular Learning Portal — Design Document

**Date:** 2026-02-28
**Status:** Approved

## Overview

A self-contained Angular 21 learning portal with premium UI/UX for studying Angular topics, self-assessment, and conducting technical interviews. No backend, no auth — content stored as markdown files, progress in localStorage.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | Angular Material + Tailwind CSS | Material for structure, Tailwind for polish |
| Angular Version | 21 (latest) | Dogfood latest features |
| Content Storage | Markdown files → JSON at build time | Fast search, structured data, good UX |
| Progress Storage | localStorage | Simple, offline, no setup |
| Content Language | Ukrainian explanations + English terms | Matches existing curriculum |
| UI Language | English | Clean, professional interface |
| State Management | Services + Signals | Sufficient for this app, no NgRx overhead |
| Theme | Dark by default (#1e1e2e) | Matches cheatsheet aesthetic, light mode toggle |

## Content Structure

> **v2 — Restructured** after curriculum audit (2026-02-28).
> Changes: dissolved Block 15 (Modern Angular) — deduplicated topics moved to relevant blocks.
> Added 5 new blocks critical for Senior/Staff interviews: Architecture, Security, SSR/PWA, Accessibility/i18n, Animations.
> Expanded Testing and priority blocks. Merged thin topics. Kept Tailwind per preference.

```
content/
  block-00-general-engineering/            # 8 topics (was 7, +CWV)
    01-oop-principles.md
    02-solid-principles.md
    03-design-patterns.md
    04-anti-patterns.md
    05-general-cs.md
    06-typescript-advanced.md
    07-git-workflow.md
    08-core-web-vitals.md                  # moved from Block 11
  block-01-core-fundamentals/              # 4 topics (unchanged)
    01-bootstrapping.md
    02-ngmodules.md
    03-standalone-components.md
    04-angular-cli.md
  block-02-components/                     # 6 topics (unchanged)
    01-component-metadata.md
    02-lifecycle-hooks.md
    03-input-output.md
    04-content-projection.md
    05-viewchild-contentchild.md
    06-host-element.md
  block-03-directives-pipes/               # 5 topics (was 6, control flow → Block 4)
    01-attribute-directives.md
    02-structural-directives.md
    03-custom-structural-directives.md
    04-built-in-pipes.md
    05-custom-pipes.md
  block-04-templates-data-binding/         # 5 topics (was 4, +control flow)
    01-binding-types.md
    02-event-binding.md
    03-template-reference-variables.md
    04-dynamic-templates.md
    05-control-flow.md                     # @if/@for/@switch/@defer — moved from Block 3
  block-05-dependency-injection/           # 5 topics (restructured: merged tree-shakable, +new)
    01-di-internals.md
    02-provider-types.md                   # includes tree-shakable providers (providedIn)
    03-injection-tokens.md                 # includes multi-providers (multi: true)
    04-inject-function.md
    05-resolution-modifiers.md             # NEW: @Optional, @Self, @SkipSelf, @Host
  block-06-routing/                        # 7 topics (was 6, +functional router)
    01-router-fundamentals.md
    02-lazy-loading.md
    03-guards.md                           # includes functional guards (CanActivateFn)
    04-route-data.md                       # includes resolvers, withComponentInputBinding
    05-router-events.md
    06-preloading-strategies.md
    07-advanced-routing.md                 # NEW: aux routes, named outlets, router architecture
  block-07-forms/                          # 4 topics (was 5, merged typed forms → reactive)
    01-template-driven-forms.md
    02-reactive-forms.md                   # includes Typed Forms (v14+)
    03-custom-validators.md
    04-control-value-accessor.md
  block-08-http-interceptors/              # 3 topics (was 4, merged provideHttpClient → interceptors)
    01-httpclient.md
    02-http-interceptors.md                # includes functional interceptors, provideHttpClient, withInterceptors
    03-error-handling.md
  block-09-change-detection/               # 7 topics (was 5, +3 critical) ⚠️ PRIORITY
    01-zonejs.md
    02-cd-mechanism.md
    03-onpush-strategy.md
    04-signals.md
    05-zoneless-angular.md
    06-expression-changed-error.md         # NEW: ExpressionChangedAfterItHasBeenChecked
    07-signal-vs-observable.md             # NEW: decision framework, when to use which
  block-10-rxjs/                           # 7 topics (was 5, +2) ⚠️ PRIORITY
    01-higher-order-operators.md
    02-memory-leaks.md
    03-subject-types.md
    04-reactive-patterns.md
    05-error-handling-rxjs.md
    06-custom-operators.md                 # NEW: writing pipeable operators
    07-rxjs-signal-interop.md              # NEW: toSignal, toObservable, bridging paradigms
  block-11-performance/                    # 4 topics (renamed for clarity) ⚠️ PRIORITY
    01-deferrable-views.md                 # renamed: @defer, lazy components (not route lazy loading)
    02-bundle-optimization.md
    03-runtime-optimization.md             # OnPush, trackBy, pure pipes, etc.
    04-angular-devtools-profiling.md       # renamed: profiling, measuring perf (CWV moved to Block 0)
  block-12-state-management/               # 4 topics (was 5, merged lightweight stores) ⚠️ PRIORITY
    01-service-behaviorsubject.md
    02-ngrx.md
    03-ngrx-lightweight-stores.md          # merged: Component Store + Signal Store
    04-comparison.md
  block-13-angular-material/               # 3 topics (was 4, merged custom theme → setup)
    01-setup-theming.md                    # includes custom theming
    02-key-components.md
    03-cdk.md                              # CDK: a11y, overlay, drag-drop, virtual scroll
  block-14-tailwind/                       # 4 topics (unchanged)
    01-setup.md
    02-tailwind-angular-components.md
    03-material-tailwind-together.md
    04-component-driven-approach.md
  block-15-architecture/                   # 4 topics (NEW — replaced Modern Angular)
    01-project-structure.md                # feature/shared/core module patterns, barrel exports
    02-monorepo-nx.md                      # Nx workspace, library boundaries, affected commands
    03-microfrontends.md                   # Module Federation, Angular Elements, web components
    04-design-system.md                    # component library architecture, Storybook
  block-16-security/                       # 4 topics (NEW)
    01-xss-sanitization.md                 # DomSanitizer, SafeValue, Trusted Types, innerHTML
    02-auth-patterns.md                    # JWT, OAuth2, route guard auth, token interceptors
    03-csp-csrf.md                         # Content Security Policy, CSRF protection
    04-secure-coding.md                    # dependency auditing, OWASP Angular checklist
  block-17-ssr-pwa/                        # 4 topics (NEW — expanded from 1 bullet in old Block 15)
    01-angular-universal.md                # SSR architecture, TransferState
    02-hydration.md                        # full + incremental hydration (v17+), afterRender
    03-prerendering.md                     # SSG, prerender routes, platform detection
    04-service-workers-pwa.md              # @angular/service-worker, offline strategies
  block-18-testing/                        # 7 topics (was 4, significantly expanded)
    01-unit-testing.md                     # TestBed, ComponentFixture, shallow vs deep
    02-testing-services.md
    03-testing-components.md               # NEW: inputs/outputs, DOM interaction, harnesses
    04-testing-http.md                     # NEW: HttpClientTestingModule, provideHttpClientTesting
    05-testing-signals-rxjs.md
    06-mocking-strategies.md               # NEW: provider overrides, spy services, dependency mocking
    07-e2e.md                              # Playwright / Cypress, CI integration
  block-19-accessibility-i18n/             # 4 topics (NEW)
    01-aria-angular.md                     # ARIA attributes in templates, semantic HTML
    02-cdk-a11y.md                         # FocusTrap, LiveAnnouncer, FocusMonitor
    03-i18n.md                             # compile-time i18n, runtime (Transloco), locale pipes
    04-keyboard-navigation.md              # focus management, skip links, roving tabindex
  block-20-animations-observability/       # 4 topics (NEW)
    01-angular-animations.md               # trigger, state, transition, animate, route animations
    02-animation-builder.md                # programmatic animations, performance implications
    03-error-handling-observability.md      # global ErrorHandler, Sentry/Datadog patterns
    04-logging-monitoring.md               # structured logging, performance monitoring, Angular DevTools
```

**Total: 21 blocks, 99 subtopics (8 general + 91 Angular)**

### Markdown File Format

Each .md file has YAML frontmatter:

```yaml
---
title: "Bootstrapping, Platform, Ivy Internals"
block: 1
topic: 1
slug: "bootstrapping"
tags: ["ivy", "LView", "TView", "AOT", "JIT"]
relatedTopics: ["standalone-components", "angular-cli"]
interviewQuestions:
  - id: "b1t1q1"
    level: "junior"
    question: "What is the entry point of an Angular application?"
    referenceAnswers:
      junior: "main.ts bootstraps the app..."
      mid: "platformBrowserDynamic().bootstrapModule()..."
      senior: "The platform creates an EnvironmentInjector..."
      staff: "Ivy compiles components into instructions..."
    commonMistakes: ["Confusing module bootstrap with component bootstrap"]
    relatedQuestions: ["b1t1q2", "b1t3q1"]
  - id: "b1t1q2"
    ...
---

## Core Concept
...
## Deep Details
...
## Examples
...
## Code Smells & Anti-Patterns
...
## Interview Block
...
## Summary
...
```

### Build Script

`scripts/build-content.ts` processes all markdown files and outputs:
- `src/assets/content-index.json` — metadata for navigation, search, filtering
- `src/assets/content/{block}/{topic}.json` — full parsed HTML content per topic
- `src/assets/search-index.json` — lunr.js pre-built search index
- `src/assets/interview-questions.json` — all questions extracted for interview conductor

## App Architecture

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overall progress, weak zones, recent activity, quick stats |
| `/blocks` | Curriculum | All 21 blocks as cards with progress bars |
| `/blocks/:blockId` | Block Detail | Topics list, progress per topic |
| `/blocks/:blockId/:topicSlug` | Topic View | Full material with tabbed sections |
| `/interview` | Interview Center | Self-study: quiz mode, flashcards for self-assessment |
| `/interview/quiz` | Quiz Mode | Flashcard-style, rate yourself, spaced repetition |
| `/conduct` | Interview Conductor | You-as-interviewer mode |
| `/conduct/new` | New Session | Setup: candidate profile + question table |
| `/conduct/session/:id` | Active Session | Conducting interview |
| `/conduct/history` | Session History | Past interview sessions |
| `/conduct/session/:id/summary` | Session Summary | Scorecard, charts, AI prompt |
| `/search` | Search Results | Full-text search across all content |
| `/cheatsheets` | Cheatsheets | Quick reference cards per block |
| `/progress` | Progress & Stats | Detailed analytics |

### Layout

- **Sidenav** (collapsible): Block list with completion indicators, quick links to main sections
- **Toolbar**: Search bar (global, `/` shortcut), dark/light toggle, progress indicator
- **Main content area**: Routed content with breadcrumbs
- **Dark theme by default**: bg #1e1e2e, accent #a29bfe, cyan #56cfe1

### Component Structure

```
app/
  layout/
    shell/                      # Main layout: toolbar + sidenav + router-outlet
    sidenav/                    # Collapsible nav with block list
    toolbar/                    # Search, theme toggle, progress
  features/
    dashboard/                  # Home page with stats
    curriculum/                 # Block list + topic list
    topic-viewer/               # Full topic content with tabbed sections
    interview-center/           # Self-study quiz & flashcards
    interview-conductor/        # You-as-interviewer mode
      session-setup/            # Candidate profile form
      session-active/           # Question table + grading
      session-summary/          # Scorecard + AI prompt
      session-history/          # Past sessions list
    cheatsheets/                # Quick reference per block
    search/                     # Full-text search results
    progress/                   # Detailed analytics
  shared/
    components/
      code-block/               # Syntax-highlighted code
      grade-selector/           # Level + quality grade widget
      progress-bar/             # Reusable progress indicator
      question-card/            # Expandable question with answers
      chip/                     # Tag/label chip
    services/
      content.service.ts        # Loads content JSON
      search.service.ts         # lunr.js search
      progress.service.ts       # localStorage progress tracking
      interview.service.ts      # Interview session management
      theme.service.ts          # Dark/light mode
    models/                     # TypeScript interfaces
    pipes/                      # Custom pipes
```

### Services (Signals-based)

- **ContentService**: Loads content-index.json + individual topic JSON. Exposes signals for current block, topic, etc.
- **SearchService**: Loads pre-built lunr index, exposes search results as signal.
- **ProgressService**: Reads/writes localStorage. Tracks: topic completion, quiz scores, weak areas. Exposes computed signals for stats.
- **InterviewService**: Manages interview sessions. CRUD for sessions in localStorage. Generates AI prompt from session data.
- **ThemeService**: Dark/light toggle, persisted in localStorage.

## Interview Conductor — Detailed Design

### Candidate Profile (filled at session start)

| Field | Type |
|-------|------|
| Name | text |
| Current role | text |
| Years of experience | number |
| Angular versions worked with | multi-select chips (v2...v21) |
| Main responsibilities | textarea |
| Tech stack | chips (RxJS, NgRx, Material, Tailwind, etc.) |
| Best component/feature they built | textarea |
| What they want to improve | textarea |

### Question Table (main interview view)

Full table of all available questions grouped by block/topic:

| Block | Topic | Question | Level | Grade | Notes | Status |
|-------|-------|----------|-------|-------|-------|--------|
| Grouped rows with expand/collapse per block |

**When a question is expanded ("Ask" clicked):**
- Question text displayed prominently
- Reference answers by level (collapsible): Junior / Mid / Senior / Staff
- Grade selector: What level did the candidate answer at? + Quality (Strong / Partial / Weak)
- Notes: free text field
- Mark as "Asked" — highlighted in table

**Filtering/sorting:**
- Filter by block, topic, level
- Sort by any column
- Show only "Not yet asked"
- Quick filter: "Senior+ questions only"

### Smart Question Suggestions

When a question is asked, the system highlights related questions:
- **Yellow highlight**: "Follow-up" — questions that naturally follow (via `relatedQuestions` metadata)
- **Blue highlight**: "Coverage gap" — questions from uncovered blocks/topics
- **Coverage indicator**: Progress bar showing block coverage in current session

### Custom Questions

"Add Custom Question" button allows:
- Custom question text
- Assign to block/topic (or "Custom / Unclassified")
- Grade + notes
- Optionally save for future sessions (localStorage)
- Marked with "Custom" chip in table

### Session Summary

- Scorecard table: question, topic, level, candidate's grade, notes
- Radar chart: performance by block/area
- Overall score: % strong / partial / weak
- Breakdown by level (Junior vs Mid vs Senior vs Staff questions)

### AI Feedback Prompt Generator

One-click "Generate AI Prompt" → copies to clipboard:

```
You are a senior Angular technical interviewer. Analyze this candidate's interview performance.

## Candidate Profile
- Name: {name}, {role}, {years} years experience
- Angular versions: {versions}
- Main tasks: {responsibilities}
- Proudest work: {bestWork}
- Wants to improve: {wantsToImprove}
- Tech stack: {techStack}

## Interview Results

### General Engineering
{for each asked question in block 0}
- [{level}] "{question}" — Answered at: {candidateLevel} level, Grade: {quality}
  Notes: {notes}

### Angular
{for each asked question in blocks 1-16}
- [{level}/{topic}] "{question}" — Answered at: {candidateLevel} level, Grade: {quality}
  Notes: {notes}

### Custom Questions
{for each custom question}
- "{question}" ({block/topic}) — Answered at: {candidateLevel} level, Grade: {quality}
  Notes: {notes}

## Please Provide:
1. Overall assessment (2-3 sentences)
2. Suggested level: Junior / Mid / Senior / Staff (with justification)
3. Strong areas (with evidence from specific answers)
4. Areas to improve (specific gaps identified)
5. Recommended study materials and topics
6. Follow-up questions to probe weak areas deeper
7. Comparison: how does their self-assessment align with actual performance?
```

### Interview History

- List of past sessions in localStorage
- Re-view any past session's scorecard
- Track candidate improvement across sessions (if same name)

## Features Summary

### Core
- Full curriculum browser (21 blocks, 99 subtopics)
- Rich topic viewer with tabbed sections
- Full-text search (lunr.js)
- Progress tracking (localStorage)
- Dark/light theme

### Self-Study
- Interactive flashcard/quiz mode
- Self-grading: Knew it / Partial / Didn't know
- Spaced repetition — weak questions resurface after 1, 3, 7 days
- Interview simulation mode (timed, random from weak areas)

### Interview Conductor
- Candidate profile form
- Full question table with filtering/sorting
- Level-based reference answers
- Level + quality grading per question
- Custom questions
- Smart question suggestions (follow-ups + coverage gaps)
- Session summary with radar chart
- AI feedback prompt generator
- Session history

### Nice-to-Have
- Topic dependency graph (visual map of topic connections)
- "Elevator pitch" mode (2-min condensed view per topic)
- Keyboard navigation (j/k, space, /)
- Code playground links (StackBlitz)
