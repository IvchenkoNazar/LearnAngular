---
title: "Component-Driven Approach with Tailwind"
block: 14
topic: 4
slug: "component-driven-approach"
difficulty: 3
sinceVersion: "2"
tags: ["design system", "component abstraction", "Tailwind", "reusable components", "@apply", "design tokens"]
relatedTopics: ["tailwind-setup", "tailwind-angular-components", "material-tailwind-together", "setup-theming"]
interviewQuestions:
  - level: "junior"
    question: "Коли варто виносити Tailwind класи в окремий Angular компонент замість того щоб писати їх прямо в template?"
    referenceAnswers:
      junior: "Варто виносити коли одні і ті ж класи повторюються в багатьох місцях. Якщо є лише одне використання — можна залишити inline."
      mid: "Правило 'extract when reused' з нюансами: 1) 3+ повторення того самого pattern — extract. 2) Складний semantic pattern (button з variant, size, disabled state) — extract незалежно від кількості. 3) Бізнес-domain компонент (ProductCard, UserAvatar) — extract для naming і encapsulation. 4) Простий layout (flex center) — залишати inline, виносити в @apply anti-pattern."
      senior: "Extract vs inline decision framework: 1) Semantic value: чи надає компонент смислове ім'я? `<app-button variant='primary'>` vs `<button class='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>`. 2) Variance: компонент має variants/states що неможливо виразити без TypeScript. 3) Behavior: є event handlers або effects що варто encapsulate. 4) Testing: чи є окрема тест-поведінка? 5) Reuse threshold: 3+ times або cross-feature. Anti-pattern: extract purely for CSS — `<app-flex-center>` що просто додає `flex items-center justify-center`. CSS utility variants кращі ніж wrapper components для простих layouts."
      staff: "Component abstraction strategy для design system: 1) Utility-first для ad-hoc layouts — inline, ніяких abstractions. 2) Component для semantic UI elements — Button, Card, Badge, Avatar — Tailwind всередині. 3) Component для compound patterns — FormField (label + input + error), DataTable, Modal. 4) Design token layer — CSS custom properties визначають brand, Tailwind theme читає їх. 5) Storybook як documentation — кожен component з variants. 6) Прагматичне правило: extract якщо ім'я компонента communication value ясне і необхідне для team understanding. Не extract якщо компонент — просто CSS wrapper."
    commonMistakes:
      - "Extract кожен UI pattern в компонент — over-engineering для простих layouts"
      - "Залишати complex interactive elements (buttons, forms) без encapsulation — сотні рядків дублювання"
      - "Компоненти без typed inputs — передають raw className string"
    relatedQuestions: ["b14t4q2", "b14t2q5"]
  - level: "mid"
    question: "Як @apply в Tailwind допомагає при component-level abstractions і коли його не варто використовувати?"
    referenceAnswers:
      junior: "@apply дозволяє писати Tailwind класи в CSS файлі замість в HTML. Це корисно коли є повторюваний набір класів."
      mid: "@apply використання: 1) У component styles для :host і pseudo-elements де template classes не достатньо. 2) Для semantic class names у компонентних CSS: `.btn-primary { @apply bg-blue-600 text-white px-4 py-2 rounded-lg; }`. 3) В styles.css для глобальних UI patterns. Не варто: 1) Для simple single-property utilities. 2) Коли краще підходить Angular component. 3) Замість utility composition в template — втрачається flex і transparency Tailwind."
      senior: "@apply trade-offs: 1) CSS bundle: @apply копіює properties в кожному місці використання. `@apply flex items-center` у 10 places = 10x `display: flex; align-items: center;`. Global `.flex { display: flex }` — 1 rule shared. 2) Maintainability: @apply class names у HTML (`.btn`) приховують actual styles — less transparent ніж utilities. 3) Tailwind IntelliSense: @apply у CSS файлах підтримується плагіном VS Code. 4) Legitimate use cases: :host, ::before/::after, complex combinatorial selectors (`.parent:hover .child`). 5) @layer components: `@layer components { .btn { @apply ... } }` — компонентні стилі що нижче Material unlayered але вище @layer utilities."
      staff: "@apply architectural position: 1) @apply — це compile-time expansion. Tailwind компілятор replaces @apply з CSS properties. Це означає: a) No runtime overhead. b) Properties copied не class referenced. c) Specificity = where @apply is used, не Tailwind class specificity. 2) Design system use case: global component classes у styles.scss @layer components — globally available semantic classes. `@layer components { .surface { @apply bg-surface text-on-surface rounded-lg p-4; } }`. 3) Performance comparison: @apply у Angular component styles vs template utilities — component styles generate per-component CSS, template utilities share global CSS rules. З 100 components що use @apply flex — 100 CSS rules з `display: flex`. Vs 100 templates з class='flex' — 1 shared rule. 4) Conclusion: @apply ідеальний для :host patterns і pseudo-elements. Template utilities — для all other cases. Component abstractions — для semantic/behavioral encapsulation."
    commonMistakes:
      - "@apply для кожного layout pattern — CSS bundle роздувається"
      - "@apply замість Angular component для interactive elements — немає TypeScript, inputs, events"
      - "Не знають що @apply copies properties, не references class — різна specificity behavior"
    relatedQuestions: ["b14t4q1", "b14t4q3"]
  - level: "mid"
    question: "Як реалізувати design token підхід в Angular з Tailwind і CSS custom properties?"
    referenceAnswers:
      junior: "Design tokens — це змінні для кольорів, шрифтів, відступів. Можна визначити CSS variables і використовувати їх в Tailwind theme."
      mid: "Design token pipeline: 1) Визначити tokens як CSS custom properties у styles.scss: `--color-primary: #6366f1`. 2) Tailwind config: `theme.extend.colors.primary: 'var(--color-primary)'`. 3) Components використовують `text-primary`, `bg-primary` — читають CSS variable. 4) Theme switching: змінити `--color-primary` на :root або .dark-mode — всі Tailwind utilities оновлюються. 5) Brand theming: різні .brand-x classes override tokens."
      senior: "Design token architecture: 1) Token levels: Global tokens (raw values: `--color-blue-500: #6366f1`) → Semantic tokens (roles: `--color-primary: var(--color-blue-500)`) → Component tokens (specific: `--button-bg: var(--color-primary)`). 2) Tailwind integration: лише semantic tokens у tailwind.config — `primary: 'var(--color-primary)'`. Global і component tokens — через пряме CSS variable usage або @apply. 3) Runtime theming: CSS variables змінюються без rebuild — light/dark, brand switching. 4) TypeScript token catalog: `export const tokens = { primary: 'var(--color-primary)' }` — for use in HostBinding і style bindings. 5) Token documentation: Storybook design token stories або Supernova integration."
      staff: "Enterprise design token system: 1) Token pipeline: Figma (design source) → Style Dictionary (transform) → CSS custom properties + Tailwind theme + iOS/Android tokens. Automated CI sync. 2) Token taxonomy: Core → Semantic → Component tiers. Core: raw values. Semantic: purpose-based names. Component: component-specific. 3) Tailwind config: only semantic tokens — `colors: { primary: 'var(--color-primary)', 'primary-container': 'var(--color-primary-container)' }`. `theme.spacing` — if custom spacing needed. 4) Multi-brand: CSS custom property overrides per brand class — no Tailwind rebuild. 5) Design-dev sync: designers use same token names in Figma, developers in CSS. Token review process for new tokens. 6) Deprecation: token versioning — старі tokens marked deprecated, migration period, eventual removal. 7) Dark mode: semantic tokens automatically adapt — `--color-primary` has light/dark values via `prefers-color-scheme` or body class."
    commonMistakes:
      - "Hardcode color values в Tailwind theme (`blue-600`) замість CSS variables — не runtime-switchable"
      - "Плутають Global і Semantic tokens — все в одному рівні без ієрархії"
      - "Немає Figma → code sync — дизайнери і розробники розходяться у значеннях"
    relatedQuestions: ["b14t4q2", "b14t4q4"]
  - level: "senior"
    question: "Як збудувати Angular component library зі стилями на Tailwind CSS? Як consumer проєкт отримує стилі?"
    referenceAnswers:
      junior: "Треба опублікувати компоненти з npm. Consumer додає Tailwind до свого проєкту і включає library path в content scanning."
      mid: "Два підходи: 1) Source-based: library публікується з TS source + Tailwind classes в templates. Consumer включає library path в tailwind.config content array. Consumer Tailwind config генерує CSS для library components. 2) Compiled CSS: library публікує compiled CSS файл з усіма стилями. Consumer imports CSS без потреби в Tailwind. Перший — менший bundle (shared), другий — zero setup для consumer."
      senior: "Library distribution strategies деталі: 1) Source distribution: `content: ['./node_modules/@org/ui-lib/src/**/*.{html,ts}']` у consumer tailwind.config. Переваги: tree-shaking, consumer Tailwind theme кольори використовуються. Недоліки: consumer повинен мати Tailwind; library тайт couped до consumer config; content paths версіонуються з library. 2) Compiled CSS: ng-packagr з custom styles pipeline. `ng-packagr` компілює SCSS + @apply до CSS. Недоліки: CSS дублювання якщо consumer теж має Tailwind; немає runtime theming з consumer tokens. 3) Hybrid: library exports CSS custom properties для theming + compiled CSS з Tailwind. Consumer може override через tokens без потреби в Tailwind. 4) CSS injection: Angular CDK-inspired approach — library dynamically adds styles via StylesManager."
      staff: "Enterprise component library architecture: 1) Distribution decision matrix: Private library (monorepo) → source distribution з shared Tailwind config preset. Public NPM library → compiled CSS + CSS variables API. Open source → both options documented. 2) Tailwind preset pattern: `@org/tailwind-preset` npm package — design tokens, custom plugins, content path helpers. Library components reference preset tokens. Consumer extends preset. 3) CSS custom properties API contract: library exposes documented CSS variables (--ui-button-bg, --ui-card-padding) для consumer overrides. Semver-stable. 4) Build pipeline: ng-packagr + PostCSS для compiled CSS option. CSS treeshaking через per-component stylesheets (не single bundle). 5) Testing: Visual regression per component в Storybook. Consumer integration tests у separate Angular app. 6) Documentation: Per-variant screenshots, copy-paste examples, token override guide. 7) Migration: version bumps документують token renames, breaking changes in CSS variables API."
    commonMistakes:
      - "Публікують library без документування Tailwind content path requirement — consumers confused"
      - "Compiled CSS без CSS variables API — consumer не може theme customize"
      - "Source distribution зі специфічним Tailwind config — consumer config override можливостей немає"
    relatedQuestions: ["b14t4q3", "b14t4q5"]
  - level: "staff"
    question: "Як оцінити performance implications component-driven vs utility-first підходу в Tailwind і коли який обирати?"
    referenceAnswers:
      junior: "Utility-first — більше класів в HTML але менше CSS. Component-driven — чистіший HTML але може дублювати CSS."
      mid: "Performance comparison: 1) Utility-first в templates: один shared CSS rule per utility. 100 templates з `class='flex'` — 1 `.flex { display: flex }` rule. 2) @apply: copies properties — 100 components з `@apply flex` = 100 rules з `display: flex`. 3) Component abstraction (Angular component): same as utility-first в template — Angular component не додає CSS overhead. Висновок: Angular components з Tailwind в template == utility performance. @apply == CSS duplication."
      senior: "Performance analysis: 1) CSS rule count: utility classes в template → 1 rule each (global). @apply → copies properties per usage. Angular component з template utilities → same as direct usage. 2) HTML parse overhead: 20 utility classes на div vs 1 component tag + 2 classes. Negligible at runtime. 3) Change detection: Angular компоненти з ChangeDetectionStrategy.OnPush — більше granularity. Utility divs — частина parent component CD cycle. 4) Bundle: Angular component (+ TS class, template, imports) = larger JS bundle. Pure CSS class usage = zero JS. For simple styling — CSS utilities win. For behavior — components win. 5) Gzip efficiency: repeated Tailwind class names в templates — gzip компресія дуже ефективна для repetitive strings. CSS file з utilities — також добре gzip."
      staff: "Performance architecture decision: 1) Measurement framework: CSS bundle size (Tailwind output), JS bundle size (component count и size), runtime CD cost (deep component trees), LCP impact (critical CSS). 2) Real-world data: Typical Angular+Tailwind app: ~15-30KB gzipped CSS (utilities) vs ~50-100KB (traditional CSS). Component abstraction не змінює CSS cost якщо template-based. 3) @apply в design system: якщо design system library використовує @apply → published CSS contains duplicated properties per component. For 100 components each with `@apply flex items-center` = 200+ copies `display: flex`. Vs published as source and consumer uses content paths — 1 shared rule. 4) Critical decision: public npm library → compiled CSS (known CSS budget). Internal design system → source distribution (optimal bundle, but build-time dep on Tailwind). 5) Caching: utilities CSS — highly cacheable (changes rarely). Component CSS — changes with each version. Separation strategy: utilities in separately cached CSS layer. 6) SSR: Tailwind CSS static — optimal for SSR. No runtime CSS generation. Critical CSS extraction: identify above-the-fold utility classes for inline critical CSS."
    commonMistakes:
      - "Думають Angular component wrapper додає CSS overhead — він додає JS, але CSS overhead від utilities залишається однаковим"
      - "@apply без аналізу bundle cost — може збільшити CSS в 10x порівняно з shared utilities"
      - "Не вимірюють реальний CSS bundle перед оптимізацією — premature optimization"
    relatedQuestions: ["b14t4q4", "b14t4q2", "b14t1q5"]
---

## Core Concept

**English definition:** Component-driven approach with Tailwind CSS is a strategy for deciding when to encapsulate Tailwind utility classes into Angular components versus keeping them inline in templates, using `@apply` for component-level CSS abstractions, design tokens through CSS custom properties, and building a component library that balances performance, reusability, and maintainability.

**Пояснення:** Component-driven підхід з Tailwind — це відповідь на питання: "коли перестати писати utility classes безпосередньо і виносити в абстракцію?". Тригери: семантичне ім'я несе значення, є TypeScript behavior/state, repeats 3+ рази. Ключовий insight: Angular component з Tailwind classes в template = та ж CSS performance що й inline utilities. @apply = гірша performance (copies properties).

**Яку проблему вирішує:** Pure utility-first підхід дає verbose templates де important semantic intent ховається в класах. Component-driven: `<app-primary-button>` vs `<button class='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2...'>`. Але надмірна componentization = over-engineering. Правило: component для behavior і semantics, utilities для ad-hoc layout і styling.

**Як працює під капотом:**

Performance model Tailwind utilities:

```
Template utility classes:
  100 components з class="flex" → 1 global CSS rule: .flex { display: flex }
  (shared, cached, optimal)

@apply in component styles:
  100 components з :host { @apply flex } → 100 CSS rules з display: flex
  (duplicated, larger CSS bundle)

Angular component з template utilities:
  <app-card> template: <div class="flex p-4"> → same as direct usage
  (no extra CSS cost vs inline)
```

**Trade-offs та обмеження:**

- Немає universal правила — рішення контекстно-залежне
- Component abstraction додає JS overhead (class definition, DI) навіть якщо CSS однаковий
- @apply збільшує CSS bundle — використовувати лише де template classes недоступні
- Design tokens через CSS variables вимагають CSS custom properties browser support (excellent, 2019+)
- Library distribution вибір (source vs compiled) має downstream наслідки для consumers

**Версійність:**
- Tailwind v1-v2: @apply performance cost той самий, але без @layer — інша specificity story
- Tailwind v3: JIT + @layer utilities — @apply generates un-layered CSS in component files
- Angular 14+: standalone components — спрощує component library distribution
- Angular 17+: signals + new control flow — component abstractions з signal-based inputs cleaner

## Deep Details

### Edge Cases

- **@apply і PostCSS processing order:** @apply в component styles обробляється PostCSS окремо від global styles. Якщо custom Tailwind plugin визначений пізніше ніж component styles обробляються — @apply може не знайти custom utility.
- **Tailwind JIT і динамічні variant patterns:** `hover:bg-${variant}-600` — не генерується JIT. Потрібно або literal strings, або safelist. Це впливає на component API design — variants повинні бути literal values.
- **CSS custom properties і Tailwind opacity modifier:** `text-primary/50` (50% opacity) — Tailwind generates з CSS custom property: `color: rgb(var(--color-primary) / 0.5)`. Для цього CSS variable повинна бути без `rgb()` wrapper: `--color-primary: 99 102 241` (RGB components). Не `--color-primary: #6366f1`.
- **Design tokens і Angular signals:** `const primaryColor = signal('var(--color-primary)')` — reactive token reading. Корисно якщо token може змінитись runtime (рідко, але можливо).

### Junior vs Senior Understanding

**Junior** знає: коли копіювати-вставляти стає болісно — виносити в component або @apply. Basic design tokens.

**Senior** розуміє:

1. **@apply CSS duplication cost** — це не просто "трохи більше CSS". З великою library: якщо 50 components мають `@apply flex flex-col gap-4` — 50 rules замість 3 shared. Знати коли template utilities win on performance.
2. **Token hierarchy** — Global → Semantic → Component tokens. Tailwind theme тільки semantic tokens. Компоненти можуть мають component-level tokens через CSS variables. Consumers override через semantic tokens.
3. **Library distribution trade-offs** — Source (consumer needs Tailwind, optimal performance) vs Compiled (zero setup, CSS budget control). Hybrid з CSS variables API contract — best of both.
4. **Opacity modifier compatibility** — CSS variables для Tailwind opacity (`/50`) потребують RGB channels format, не hex. Architectural decision при token definition.

### Deprecation & Migration Path

- **`@apply` deprecation rumors:** Tailwind автор Adam Wathan публічно висловлював думку про deprecation @apply. Станом на 2025 — не deprecated але use judiciously. Планувати migration до component abstractions якщо @apply надмірно використовується.
- **CSS custom properties browser support:** 2019+ baseline — no polyfill needed. IE11 не підтримує — якщо IE11 потрібна (legacy), design tokens через CSS variables не feasible.
- **Tailwind v4 CSS-first config:** `@theme` directive в CSS замість JS config. Token definition може переїхати у CSS: `@theme { --color-primary: #6366f1; }`. Angular CLI support — перевіряти при migration.

### Connections to Other Concepts

- **Tailwind Setup:** Content paths і safelist — prerequisite для component library distribution
- **Tailwind Angular Components:** @apply, HostBinding, ViewEncapsulation — основа для component-level patterns
- **Angular Material Theming:** M3 CSS variables = перший tier design token bridge
- **Performance Optimization:** CSS bundle size, critical CSS, gzip efficiency — performance implications chapter

## Examples

### Basic Usage

```typescript
// simple-button.component.ts — utility-first component abstraction
import { Component, Input, booleanAttribute } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [class]="buttonClasses"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading || null">
      @if (loading) {
        <span class="mr-2 h-4 w-4 animate-spin rounded-full
                     border-2 border-current border-t-transparent"
              aria-hidden="true">
        </span>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) disabled = false;

  // Literal string maps — Tailwind scanner знаходить при content scan
  private static readonly VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary:   'bg-primary text-primary-on hover:bg-primary/90 focus-visible:ring-primary',
    secondary: 'bg-secondary text-secondary-on hover:bg-secondary/90 focus-visible:ring-secondary',
    outline:   'border border-primary text-primary bg-transparent hover:bg-primary/10',
    ghost:     'text-primary bg-transparent hover:bg-primary/10',
    danger:    'bg-error text-error-on hover:bg-error/90 focus-visible:ring-error',
  };

  private static readonly SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm rounded-md gap-1.5 text-sm',
    md: 'h-10 px-4 rounded-lg gap-2 text-sm',
    lg: 'h-12 px-6 rounded-xl gap-2.5 text-base',
  };

  get buttonClasses(): string {
    return [
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      ButtonComponent.VARIANT_CLASSES[this.variant],
      ButtonComponent.SIZE_CLASSES[this.size],
    ].join(' ');
  }
}
```

### Production Scenario

```javascript
// tailwind.config.js — design token bridge з CSS custom properties
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  corePlugins: { preflight: false }, // З Angular Material
  theme: {
    extend: {
      colors: {
        // Semantic design tokens — CSS variables bridge
        // NOTE: RGB channel format для opacity modifier підтримки
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          on: 'rgb(var(--color-primary-on) / <alpha-value>)',
          container: 'rgb(var(--color-primary-container) / <alpha-value>)',
          'on-container': 'rgb(var(--color-primary-on-container) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          on: 'rgb(var(--color-secondary-on) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          variant: 'rgb(var(--color-surface-variant) / <alpha-value>)',
          on: 'rgb(var(--color-on-surface) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)',
          on: 'rgb(var(--color-error-on) / <alpha-value>)',
        },
      },
      borderRadius: {
        // Design token для border radius
        'component': 'var(--radius-component)',
        'card': 'var(--radius-card)',
      },
      spacing: {
        // Component-specific spacing tokens
        'component-sm': 'var(--spacing-component-sm)',
        'component-md': 'var(--spacing-component-md)',
        'component-lg': 'var(--spacing-component-lg)',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-family-mono)', 'monospace'],
      },
    },
  },
};
```

```scss
// tokens.scss — design token definitions (light theme)
:root {
  // --- Color tokens (RGB channels для Tailwind opacity support) ---
  --color-primary: 99 102 241;         /* #6366f1 indigo-500 */
  --color-primary-on: 255 255 255;     /* white */
  --color-primary-container: 224 231 255; /* indigo-100 */
  --color-primary-on-container: 49 46 129; /* indigo-900 */

  --color-secondary: 139 92 246;       /* violet-500 */
  --color-secondary-on: 255 255 255;

  --color-surface: 255 255 255;        /* white */
  --color-surface-variant: 241 245 249; /* slate-100 */
  --color-on-surface: 15 23 42;        /* slate-900 */

  --color-error: 239 68 68;            /* red-500 */
  --color-error-on: 255 255 255;

  // --- Radius tokens ---
  --radius-component: 0.5rem;          /* rounded-lg */
  --radius-card: 0.75rem;              /* rounded-xl */

  // --- Spacing tokens ---
  --spacing-component-sm: 0.75rem;
  --spacing-component-md: 1rem;
  --spacing-component-lg: 1.5rem;

  // --- Typography ---
  --font-family-sans: 'Inter var';
  --font-family-mono: 'JetBrains Mono';
}

// Dark theme override — runtime switching без rebuild
.dark {
  --color-primary: 129 140 248;        /* indigo-400 */
  --color-primary-on: 15 23 42;
  --color-primary-container: 49 46 129; /* indigo-900 */

  --color-surface: 15 23 42;           /* slate-900 */
  --color-surface-variant: 30 41 59;   /* slate-800 */
  --color-on-surface: 241 245 249;     /* slate-100 */
}
```

```typescript
// card.component.ts — compound component з design tokens
import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardElevation = 'flat' | 'raised' | 'floating';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <div [ngClass]="cardClasses">
      @if (title || headerContent) {
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-surface-variant">
          @if (title) {
            <h3 class="text-base font-semibold text-surface-on">{{ title }}</h3>
          }
          <ng-content select="[cardHeader]"></ng-content>
        </div>
      }
      <ng-content></ng-content>
    </div>
  `,
  // :host styles через @apply — де template classes недоступні
  styles: [`
    :host {
      @apply block;
    }
  `]
})
export class CardComponent {
  @Input() title = '';
  @Input() padding: CardPadding = 'md';
  @Input() elevation: CardElevation = 'raised';

  // Design tokens через Tailwind custom colors
  private static readonly PADDING_CLASSES: Record<CardPadding, string> = {
    none: 'p-0',
    sm: 'p-component-sm',
    md: 'p-component-md',
    lg: 'p-component-lg',
  };

  private static readonly ELEVATION_CLASSES: Record<CardElevation, string> = {
    flat: 'bg-surface border border-surface-variant',
    raised: 'bg-surface shadow-sm border border-surface-variant/50',
    floating: 'bg-surface shadow-lg',
  };

  get cardClasses(): string {
    return [
      'rounded-card',  // design token border radius
      CardComponent.PADDING_CLASSES[this.padding],
      CardComponent.ELEVATION_CLASSES[this.elevation],
    ].join(' ');
  }
}
```

```typescript
// design-token.service.ts — programmatic token access
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DesignTokenService {
  /**
   * Get computed CSS variable value at runtime.
   * Useful for Canvas API, charting libraries that need raw values.
   */
  getToken(tokenName: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(tokenName)
      .trim();
  }

  /**
   * Set token override (for dynamic user preferences)
   */
  setToken(tokenName: string, value: string): void {
    document.documentElement.style.setProperty(tokenName, value);
  }

  /**
   * Get primary color as hex for use in non-CSS contexts (canvas, PDF)
   */
  getPrimaryHex(): string {
    const rgb = this.getToken('--color-primary'); // "99 102 241"
    const [r, g, b] = rgb.split(' ').map(Number);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
```

### Anti-Example

```typescript
// WRONG: Component лише для CSS — over-abstraction
@Component({
  selector: 'app-flex-center',
  template: `
    <div class="flex items-center justify-center">
      <ng-content></ng-content>
    </div>
  `
})
export class FlexCenterComponent {}
// Використання:
// <app-flex-center><span>content</span></app-flex-center>
// vs просто:
// <div class="flex items-center justify-center"><span>content</span></div>
// Angular component = JS overhead, extra DOM node, zero semantic value

// WRONG: @apply для кожного repeated layout
// styles.css:
@layer components {
  .flex-col-gap-4 { @apply flex flex-col gap-4; }  // Used everywhere
  .flex-row-gap-2 { @apply flex items-center gap-2; } // Used everywhere
}
// HTML: <div class="flex-col-gap-4"> -- hides what styles are applied
// AND: CSS duplication — не shared global rules але per-usage copies
// Better: just use `class="flex flex-col gap-4"` directly

// WRONG: Expose className input
@Component({
  selector: 'app-card',
  template: `<div [class]="'rounded-lg p-4 ' + className">...</div>`
})
export class BadCardComponent {
  @Input() className = ''; // Leaky abstraction — consumer knows Tailwind internals
}
// Better: typed inputs
@Input() padding: 'sm' | 'md' | 'lg' = 'md';
@Input() variant: 'default' | 'outlined' = 'default';

// WRONG: Hardcoded colors in token definitions (не RGB channels)
// tailwind.config.js:
// colors: { primary: 'var(--color-primary)' } -- де --color-primary: '#6366f1'
// text-primary/50 -- НЕ ПРАЦЮЄ! opacity modifier потребує RGB channel format
// CORRECT: --color-primary: 99 102 241 (space-separated RGB channels)
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Angular component лише для CSS grouping | JS overhead (class, DI, template parsing) без семантичної цінності | Utility classes в template де немає behavior або semantic naming |
| `@apply` для всіх repeated utility patterns | CSS duplication: 100 usages = 100 copies CSS properties | Shared global utility classes у template (1 rule shared). @apply тільки для :host і pseudo-elements |
| Expose `className: string` input в component | Leaky abstraction — consumer залежить від Tailwind knowledge | Typed variant inputs з internal class map |
| Design tokens з HEX format для Tailwind colors | Tailwind opacity modifier (`/50`) не працює з HEX CSS variables | RGB channel format: `--color-primary: 99 102 241` (space-separated) |
| Нема документованого "коли extract" правила | Inconsistency — один розробник виносить всі layouts, інший нічого | Documented decision criteria: behavior/semantics = component, pure layout = utilities |

## Interview Block

### [L1 — Warm-up] Коли варто виносити Tailwind utility classes в Angular компонент?
**Signal being tested:** Розуміння trade-off між DX Tailwind utility-first і semantic value Angular компонентів.
**What the interviewer expects:** Конкретні criteria: behavior, semantics, reuse — не просто "коли повторюється".
**How to probe deeper:** "Наведіть приклад де component abstraction НЕ потрібна, навіть якщо pattern повторюється."
**Reference answer:** Extract criteria: 1) Є TypeScript behavior (state, events, computed). 2) Semantic ім'я несе значення (`<app-primary-button>` vs `<button class='bg-blue-600...'>`). 3) 3+ повторень cross-feature. Не extract: 1) Простий layout без behavior (flex center, grid). 2) One-off стилі. Приклад: `<div class="flex items-center gap-4">` — залишати inline, навіть якщо 50 разів. `<app-user-avatar size="md">` — extract, несе semantic і має size variant behavior.
**Common mistakes:** Extract будь-який патерн що повторюється — over-engineering. Або ніколи не extract — duplicated behavior.

### [L2 — Mid] Які performance наслідки @apply порівняно з utility classes в Angular templates?
**Signal being tested:** Розуміння compile-time mechanics Tailwind і CSS bundle implications.
**What the interviewer expects:** @apply copies properties (bundle grows), template utilities share global rules (optimal).
**How to probe deeper:** "Якщо у нас є Angular component library з 100 компонентами і всі використовують @apply flex items-center — який вплив на CSS bundle?"
**Reference answer:** Template utility `class="flex"`: 1 global CSS rule `.flex { display: flex }` shared між всіма. @apply у component styles: кожен component file отримує copy CSS properties. 100 components з `@apply flex items-center` = 100+ CSS rules з `display: flex; align-items: center`. Vs. 1 shared rule для template approach. Висновок: @apply legitimately тільки для :host і pseudo-elements де template classes недоступні. Angular components з template utilities = same CSS performance as inline.
**Common mistakes:** Думають Angular component wrapper додає CSS overhead — компонент додає JS, CSS від utilities однаковий.

### [L3 — Senior] Як реалізувати design token систему з CSS custom properties і Tailwind для enterprise Angular app?
**Signal being tested:** Розуміння token hierarchy, CSS variable format requirements для Tailwind, runtime theming implications.
**What the interviewer expects:** Semantic token layer в Tailwind config, RGB channel format для opacity modifiers, runtime switching через CSS variable override, token hierarchy.
**How to probe deeper:** "Чому для opacity modifier (`text-primary/50`) CSS variable повинна бути у форматі RGB channels а не hex?"
**Reference answer:** Token hierarchy: Global (raw values) → Semantic (purpose: primary, error) → Component (specific: button-bg). Tailwind config тільки semantic tokens. CSS variable format: `--color-primary: 99 102 241` (space-separated RGB channels). Tailwind opacity modifier генерує: `color: rgb(var(--color-primary) / 0.5)`. З hex `#6366f1` — `rgb(#6366f1 / 0.5)` — invalid CSS. Runtime theming: `.dark { --color-primary: 129 140 248; }` — всі Tailwind utility classes з `primary` автоматично оновлюються. No rebuild needed.
**Common mistakes:** HEX у CSS variables — opacity modifiers broken. All tokens in одному рівні без hierarchy.

### [L4 — Staff/Principal] Як спроєктувати і дистрибутувати Angular component library зі Tailwind CSS для enterprise monorepo і зовнішніх consumers?
**Signal being tested:** System-level thinking про library distribution, CSS budget, consumer DX, token contract.
**What the interviewer expects:** Source vs compiled vs hybrid distribution, Tailwind preset, CSS variables API contract, versioning strategy.
**How to probe deeper:** "Як забезпечити що breaking change у design token не сломає consumer без notice?"
**Reference answer:** Distribution strategy: Internal monorepo → source distribution + shared Tailwind preset (`@org/tailwind-preset`) з design tokens. Consumer extends preset, includes library content paths. External/NPM → compiled CSS + CSS variables API contract. Document `--ui-button-bg`, `--ui-card-padding` як semver-stable overrides. Hybrid: compiled CSS default + source option для Tailwind consumers. Token versioning: semantic versioning для token changes. Deprecation period для renamed tokens (old → new coexist). Automated migration codemod при major changes. CSS budget: published library з CSS size budget в CI — prevent accidental bundle growth. Storybook documentation: кожен variant screenshotted, token override guide.
**Common mistakes:** Не документують token override API — consumers не знають що кастомізувати. Source distribution без preset — consumer config tight coupling.

## Summary

### Key Points
- Extract до Angular component коли є TypeScript behavior, semantic naming, або cross-feature reuse (3+) — не для pure CSS grouping
- @apply копіює CSS properties кожного разу — 100 usages = 100 CSS rules. Template utilities shared — 1 global rule. @apply тільки для :host і pseudo-elements
- Design token hierarchy: Global → Semantic → Component. Tailwind config тільки semantic tokens через CSS custom properties
- CSS variable format для Tailwind opacity modifiers: RGB channels `99 102 241`, не HEX `#6366f1`
- Library distribution: internal monorepo = source + shared Tailwind preset. External = compiled CSS + CSS variables API contract
- Typed variant inputs (`variant: 'primary' | 'secondary'`) замість `className: string` — не expose Tailwind internals
- Runtime theming через CSS custom property override — no rebuild, no Tailwind dependency for consumer

### Elevator Pitch (2 minutes)
"Component-driven підхід з Tailwind — це баланс між utility-first flexibility і Angular component encapsulation. Extract criteria: TypeScript behavior, semantic naming, cross-feature reuse. Pure CSS grouping — ніколи не extract (over-engineering). @apply має hidden cost: copies CSS properties на відміну від shared global utility rules — використовувати тільки для :host і pseudo-elements. Design tokens: CSS custom properties у RGB channel format (для opacity modifier compatibility) → Tailwind semantic colors → components використовують `text-primary` а не `text-indigo-500`. Library distribution: source для monorepo зі shared Tailwind preset, compiled CSS + CSS variables API для external consumers."
