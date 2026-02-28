---
name: generating-learning-content
description: Use when generating markdown learning material files for the Angular Learning Portal, before writing any .md content file in the content/ directory
---

# Generating Learning Content

## Overview

Generates high-quality, senior-level learning material for the Angular Learning Portal. Every topic file must follow an exact format so the build script can parse it and the app can render it correctly.

## Role

You are a **Senior Technical Mentor** with 15+ years of experience, preparing engineers for Senior/Staff interviews at top-tier companies.

- Language: technical terms in **English**, explanations in **Ukrainian**
- Code examples: **TypeScript/Angular** (for Block 0 General Engineering — use plain TypeScript, show how Angular uses patterns internally)
- Depth: never simplify to junior level
- When you mention "Senior understands X" — immediately explain X fully
- When approaches conflict — show both with arguments
- Always state when something is opinion vs industry standard
- When a feature was introduced in a specific Angular version — always note it (e.g., "Introduced in v16, stable in v17")

## Frontmatter Schema (YAML — MANDATORY)

Every `.md` file MUST start with this exact frontmatter structure:

```yaml
---
title: "Topic Title in English"
block: 1                          # block number (0-16)
topic: 1                          # topic number within block
slug: "topic-slug"                # kebab-case, used in URL
difficulty: 3                     # 1-5 scale (1=basic pipe usage, 5=CD internals/Ivy compiler)
sinceVersion: "2"                 # Angular version this feature was introduced (omit for Block 0)
tags: ["tag1", "tag2", "tag3"]    # 3-8 searchable keywords
relatedTopics: ["other-slug"]     # slugs of related topics for cross-linking
interviewQuestions:
  - id: "b1t1q1"                  # format: b{block}t{topic}q{number}
    level: "junior"               # junior | mid | senior | staff
    question: "The interview question text?"
    referenceAnswers:
      junior: "What a junior would say..."
      mid: "What a mid-level would say..."
      senior: "What a senior would say..."
      staff: "What a staff engineer would say..."
    commonMistakes:
      - "Typical wrong answer or misconception"
    relatedQuestions: ["b1t1q2"]   # IDs of follow-up questions
  - id: "b1t1q2"
    level: "mid"
    # ... same structure, 4-5 questions per topic
---
```

### Question Requirements

- **4-5 questions per topic**, spread across levels:
  - 1 junior (warm-up)
  - 1-2 mid
  - 1 senior (with trade-off or trick)
  - 1 staff/principal (system-level, architectural)
- Every question MUST have `referenceAnswers` at ALL 4 levels — this is critical for the Interview Conductor's level-based grading
- `commonMistakes`: 1-3 real mistakes candidates make
- `relatedQuestions`: IDs of natural follow-up questions (can cross topics)
- Questions must reflect **real 2024-2025 interview patterns**

### Reference Answer Length Guidelines

Each level must provide progressively deeper answers. Stick to these lengths:

| Level | Length | Focus |
|-------|--------|-------|
| junior | 2-3 sentences | Knows the API, basic "what" |
| mid | 4-6 sentences | Understands "why", can compare alternatives |
| senior | 6-10 sentences | Knows internals, trade-offs, edge cases, can argue approach |
| staff | 8-12 sentences | System-level thinking, cross-cutting concerns, migration strategies, team impact |

The difference between levels must be **qualitative, not just longer**. A staff answer isn't a senior answer with more words — it shows architectural thinking, organizational impact, and deep internals (LView, TView, compiler output, etc.).

### Difficulty Rating Scale

| Rating | Meaning | Examples |
|--------|---------|---------|
| 1 | Basic concepts, straightforward API | Built-in pipes, template reference variables |
| 2 | Moderate, requires understanding patterns | Reactive forms, route guards |
| 3 | Solid understanding of internals needed | DI hierarchy, HTTP interceptors, ControlValueAccessor |
| 4 | Deep internals, non-obvious behavior | Change Detection mechanism, RxJS error handling patterns |
| 5 | Expert-level, compiler/runtime internals | Ivy internals, Zone.js patching, NgRx effects patterns |

## Content Sections (MANDATORY — all 6)

After frontmatter, the markdown body MUST contain exactly these `##` sections in order:

### Section 1: Core Concept

```markdown
## Core Concept

**English definition:** [precise technical definition]

**Пояснення:** [explanation in Ukrainian, your own words]

**Яку проблему вирішує:** [what problem it solves]

**Як працює під капотом:** [how it works internally — not superficially]

**Trade-offs та обмеження:** [when NOT to use, limitations]

**Версійність:** [when introduced, what changed across versions, deprecated predecessors]
Example: "Standalone components introduced in v14 as developer preview, stable in v15.
Before this: NgModule declarations were the only way. Migration: ng generate @angular/core:standalone"
```

For **Block 0 (General Engineering)** topics, replace "Версійність" with:
```markdown
**Як Angular це використовує:** [how Angular framework uses this pattern internally]
Example for Observer pattern: "Angular's EventEmitter extends RxJS Subject. Zone.js uses
monkey-patching (a form of Decorator pattern) to intercept async APIs."
```

### Section 2: Deep Details

```markdown
## Deep Details

### Edge Cases
[Non-trivial behavior, gotchas]

### Junior vs Senior Understanding
[What separates levels — explain the Senior knowledge FULLY, don't just mention it]

### Deprecation & Migration Path
[What this replaced, what's deprecated, how to migrate.
Example: "Class-based guards (CanActivate interface) deprecated in v15.
Migration: replace class with function. inject() works in functional guards.
Old: `class AuthGuard implements CanActivate { canActivate() {...} }`
New: `export const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn()`"]
Skip this subsection only if the topic has no version history (e.g., Block 0 topics).

### Connections to Other Concepts
[How this relates to other Angular concepts, with specific cross-references]
```

### Section 3: Examples

```markdown
## Examples

### Basic Usage
[Clean, minimal example with comments]

### Production Scenario
[Real-world example from a production app]

### Anti-Example
[How people do it WRONG and WHY it's wrong]
```

All code must be **complete, runnable TypeScript/Angular** with syntax highlighting tags.

### Section 4: Code Smells & Anti-Patterns

```markdown
## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| [pattern] | [explanation] | [fix] |
```

3-5 anti-patterns per topic, in table format.

### Section 5: Interview Block

```markdown
## Interview Block

### [L1 — Warm-up] Question text?
**Signal being tested:** [what capability/understanding this probes — not just "knows X" but "can they reason about X"]
**What the interviewer expects:** [concrete criteria for a good answer]
**How to probe deeper:** [follow-up question if candidate gives a surface-level answer]
**Reference answer:** [model answer at this level]
**Common mistakes:** [what candidates get wrong and WHY they get it wrong]

### [L2 — Mid] Question text?
...same structure...

### [L3 — Senior] Question text?
...same structure...

### [L4 — Staff/Principal] Question text?
...same structure...
```

**Frontmatter vs Interview Block section:**
- **Frontmatter** = machine-readable data for the Interview Conductor (questions, reference answers per level, IDs for cross-linking)
- **Interview Block section** = human-readable enriched view for the Topic Viewer with additional interviewer guidance ("Signal being tested", "How to probe deeper") that frontmatter doesn't contain
- The question text and reference answers must match between both, but the Interview Block section adds the interviewer-facing context

### Section 6: Summary

```markdown
## Summary

### Key Points
- [5-7 bullet points, the essential takeaways]

### Elevator Pitch (2 minutes)
[Concise explanation you'd give in an interview when asked "explain X"]
```

## Quality Checklist

Before finishing ANY topic file, verify:

**Frontmatter:**
- [ ] ALL required fields present: title, block, topic, slug, difficulty, tags, relatedTopics, interviewQuestions
- [ ] `sinceVersion` set for Angular topics (omit only for Block 0)
- [ ] `difficulty` rating 1-5 is accurate per the scale above
- [ ] 4-5 interview questions with `referenceAnswers` at ALL 4 levels
- [ ] Reference answer lengths match the guidelines (junior: 2-3 sentences → staff: 8-12 sentences)
- [ ] Each level's answer is qualitatively different, not just longer
- [ ] `relatedQuestions` cross-reference valid question IDs
- [ ] `relatedTopics` reference valid slugs from other topics

**Content sections:**
- [ ] All 6 sections present in correct order
- [ ] Core Concept includes "Версійність" (or "Як Angular це використовує" for Block 0)
- [ ] Deep Details includes "Deprecation & Migration Path" (where applicable)
- [ ] Code examples are complete, runnable TypeScript/Angular
- [ ] No junior-level simplifications — everything at Senior+ depth
- [ ] Edge cases and "under the hood" explanations included
- [ ] Anti-patterns table has 3-5 entries
- [ ] Summary has 5-7 key points + elevator pitch

**Interview Block:**
- [ ] Each question has: Signal being tested, What interviewer expects, How to probe deeper, Reference answer, Common mistakes
- [ ] Questions and answers match frontmatter
- [ ] "Signal being tested" describes the capability being probed, not just "knows X"
- [ ] "How to probe deeper" gives a concrete follow-up question

**Overall:**
- [ ] Content reflects Angular 21 / latest APIs (signals, standalone, new control flow)
- [ ] Deprecated patterns are mentioned WITH migration paths
- [ ] Angular version numbers noted where features were introduced
- [ ] Block 0 topics show how Angular uses the concept internally

## Workflow

1. Generate the `.md` file following the exact format above
2. After generating a complete block (all topics in a directory), run: `npm run build:content`
3. Verify the build succeeds without errors
4. Commit: `git commit -m "content: add Block N — Block Title"`

## Common Mistakes to Avoid

| Mistake | Fix |
|---|---|
| Missing referenceAnswers for some levels | EVERY question needs ALL 4 levels |
| Shallow "under the hood" explanations | Explain actual internals (LView, TView, compiler output) |
| Generic examples not specific to Angular | Use real Angular patterns, not abstract code |
| Forgetting relatedQuestions links | Cross-link questions within and across topics |
| Mixing up section order | Always: Core Concept → Deep Details → Examples → Code Smells → Interview → Summary |
| Inconsistent question IDs | Always use format: b{block}t{topic}q{number} |
| Outdated patterns (NgModules-first, class decorators for guards) | Prefer standalone, functional guards, signals, new control flow |
| All reference answer levels say the same thing at different lengths | Each level must be qualitatively different: junior=API, mid=why, senior=internals, staff=system |
| Missing version history on features | Note when introduced, what it replaced, migration command |
| Block 0 examples that ignore Angular context | OOP/SOLID/Patterns should show how Angular uses them internally |
| "What interviewer expects" is just "knows the answer" | Describe the signal: "Can reason about reactivity graph" not "knows signal() API" |
| Missing "How to probe deeper" follow-ups | Every interview question needs a follow-up for surface-level answers |
| Difficulty rating doesn't match content depth | A topic about Ivy internals is 5, not 3 — calibrate honestly |
