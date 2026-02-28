---
title: "Component Library & Design System Architecture"
block: 15
topic: 4
slug: "design-system"
difficulty: 4
sinceVersion: "2"
tags: ["design system", "component library", "Storybook", "secondary entry points", "peer dependencies", "ng-packagr"]
relatedTopics: ["project-structure", "monorepo-nx", "standalone-components"]
interviewQuestions:
  - id: "b15t4q1"
    level: "junior"
    question: "Що таке publishable Angular library і чим вона відрізняється від звичайної Nx library?"
    referenceAnswers:
      junior: "Publishable library призначена для публікації у npm. Вона будується у окремий дистрибутивний формат який можна встановити через npm install."
      mid: "Nx buildable lib компілюється для використання у monorepo (incremental build). Nx publishable lib: 1) Компілюється через `ng-packagr` у Angular Package Format (APF). 2) Генерує `dist/` з ESM та CJS builds, type definitions, source maps. 3) `package.json` у dist з proper exports map. 4) Готова до `npm publish`. 5) `peerDependencies` замість `dependencies` для Angular/RxJS — споживач має свою копію. `ng generate @nx/angular:library my-lib --publishable --importPath=@myorg/my-lib`."
      senior: "Angular Package Format (APF): 1) ESM2022 (основний), FESM2022 (flat ESM bundle), UMD (legacy). 2) `exports` field у package.json: `'.' → './esm2022/index.mjs'`, `'./secondary' → './esm2022/secondary/index.mjs'`. 3) Ivy partial compilation (Ivy Partial Compilations): ng-packagr компілює у partial Ivy format (не повний), щоб споживач міг compile з своєю версією Angular. Це дозволяє lib Angular 15 використовуватись у Angular 16+ проектах. 4) `compilationMode: 'partial'` у tsconfig. 5) Primary + secondary entry points. 6) Treeshaking: `sideEffects: false` у package.json. 7) `peerDependencies: { '@angular/core': '>=15.0.0 <22.0.0' }` — широкий range для flexibility."
      staff: "Publishable lib governance: 1) Semantic versioning: patch (bug fixes), minor (new components, non-breaking), major (breaking API changes). 2) CHANGELOG automation: conventional commits + `nx release` або `release-it`. 3) Peer dep policy: lib targets specific Angular major range. Breaking changes у peer deps = major version bump. 4) `ng-packagr` vs custom esbuild: ng-packagr — стандарт для Angular libs (APF compliance). 5) Ivy vs View Engine: View Engine libs deprecated Angular 16+. Тільки Ivy partial compilation. 6) Distribution strategy: npm registry (public або private), GitHub Packages, Artifactory. 7) Pre-release: alpha/beta/rc для early adopters. `npm version prerelease --preid=beta`. 8) Documentation-as-code: Storybook у repo, deployed на CDN як living docs."
    commonMistakes:
      - "`dependencies` замість `peerDependencies` для Angular — dist bundle дублює Angular"
      - "Повна Ivy compilation (не partial) — lib несумісна між minor Angular versions"
      - "Не налаштовують `exports` field — tree-shaking не працює для secondary entries"
    relatedQuestions: ["b15t4q2", "b15t4q3"]
  - id: "b15t4q2"
    level: "mid"
    question: "Що таке secondary entry points і навіщо вони потрібні у Angular component library?"
    referenceAnswers:
      junior: "Secondary entry points дозволяють імпортувати частини бібліотеки окремо, наприклад `@myorg/ui/button` замість імпорту всієї бібліотеки."
      mid: "Secondary entry point — окремий ng-package у підпапці lib, будується як окремий chunk. Структура: `libs/ui/src/button/ng-package.json` (мінімальний). Споживач: `import { ButtonComponent } from '@myorg/ui/button'`. Переваги: 1) Tree-shaking: якщо app використовує лише Button — bundler включає лише button chunk. 2) Circular dependency prevention: secondary entries не можуть імпортувати один одного через primary (ng-packagr enforces). 3) Гранулярне версіонування змін. Barrel з primary entry не потрібен якщо є secondary entries."
      senior: "Secondary entry points internals: 1) Кожен secondary entry — окремий ng-package зі своїм `ng-package.json`. 2) `ng-packagr` будує їх паралельно і в правильному порядку (topological sort залежностей між entries). 3) package.json `exports` map генерується автоматично: `'./button': { 'esm2022': './esm2022/button/index.mjs', ... }`. 4) Secondary → primary import: ОК. Secondary A → secondary B import: ОК (explicit dep). Primary → secondary import: ❌ circular (ng-packagr error). 5) Peer deps: успадковуються від primary entry package.json. 6) Lazy loading: secondary entry point = окремий lazy chunk у споживача. `import('@myorg/ui/dialog')` → окремий chunk. 7) `entryFile`: secondary entry вказує на свій `public-api.ts` або `index.ts`."
      staff: "Secondary entries у design system strategy: 1) Granularity decision: per-component entries (ButtonModule, InputModule) або per-category (forms, layout, feedback). Per-component: максимальний tree-shaking але складний maintain. Per-category: pragmatic balance. 2) Deprecation: можна deprecate individual secondary entry без breaking whole lib. `@deprecated` + migration guide. 3) API stability tiers: primary entry = stable API, experimental/ secondary = unstable. 4) Bundle size monitoring: size-limit або bundlesize у CI. Кожен secondary entry — окремий budget. 5) Storybook integration: secondary entries добре маппляться на Storybook categories. 6) Consumer DX: генератор schematics що auto-import secondary entries у consumer's Angular module/component. 7) Ng-update schematics: migration code що запускається при `ng update @myorg/ui` для автоматичного рефакторингу breaking changes."
    commonMistakes:
      - "Primary entry re-exports всі secondary entries — втрачається tree-shaking переваги"
      - "Secondary entry залежить від іншого secondary через primary — circular dep"
      - "Забувають `ng-package.json` у кожній secondary entry директорії"
    relatedQuestions: ["b15t4q1", "b15t4q3"]
  - id: "b15t4q3"
    level: "mid"
    question: "Як Storybook інтегрується з Angular і яку цінність він дає для design system?"
    referenceAnswers:
      junior: "Storybook — інструмент для розробки і документування UI компонентів в ізоляції. Кожен компонент має stories — файли що показують різні стани компонента."
      mid: "`@storybook/angular` — Angular-specific Storybook builder. Story файл: `.stories.ts` поруч з компонентом. `Meta<ButtonComponent>` — конфігурація story. `StoryObj<ButtonComponent>` — окремий сценарій. Controls addon: auto-генерує UI для зміни @Input() значень. Actions addon: відстежує @Output() events. `args` у story відповідають @Input() компонента. Storybook як документація: замість README — живий компонент з інтерактивними controls."
      senior: "Storybook Angular integration деталі: 1) `moduleMetadata({ imports: [...], providers: [...] })` — декоратор для story-level DI. 2) `applicationConfig({ providers: [...] })` — для standalone providers. 3) CSF3 (Component Story Format 3): `const meta: Meta<ButtonComponent> = { component: ButtonComponent }; export default meta;`. 4) Controls: Storybook auto-generates controls з TypeScript types і JSDoc. `argTypes` для override. 5) Interaction testing: `@storybook/testing-library` + `@storybook/jest` — тести у story file, запускаються у браузері або headless. 6) Storybook Docs: auto-generated documentation page з prop table з TypeScript types. 7) Design tokens: Storybook Theming addon показує token values. 8) Chromatic: visual regression testing інтегрований зі Storybook — screenshot diff при кожному PR."
      staff: "Storybook як design system platform: 1) Single source of truth: designer, developer і QA бачать один Storybook. 2) Living documentation: Storybook deploy при кожному merge → завжди актуальний. 3) Component contract: story = специфікація поведінки компонента. 4) Accessibility: `@storybook/addon-a11y` — автоматичний a11y audit для кожної story. 5) Interaction tests у CI: `storybook build → storybook-test-runner` — Playwright запускає interaction tests з stories. 6) Design token integration: `@storybook/addon-designs` для Figma frame embed поруч зі story. 7) Performance: lazy-load stories, `storyStoreV7` — потрібен для великих design systems. 8) Multi-theme preview: Storybook toolbar для переключення між light/dark/brand themes. 9) Contribution model: component owners пишуть stories як specification, design system team reviews. Stories = acceptance criteria."
    commonMistakes:
      - "Stories лише для happy path — відсутні edge cases (empty state, error, loading)"
      - "moduleMetadata у кожній story замість global decorators у preview.ts"
      - "Storybook не у CI — stories відстають від компонентів"
    relatedQuestions: ["b15t4q2", "b15t4q4"]
  - id: "b15t4q4"
    level: "senior"
    question: "Як організувати design tokens у Angular design system і як вони використовуються у компонентах?"
    referenceAnswers:
      junior: "Design tokens — це змінні CSS що містять design-specific значення (кольори, шрифти, відступи) і дозволяють легко змінювати тему."
      mid: "Design tokens: CSS Custom Properties (`--color-primary: #1976d2`) або SCSS variables. Рівні: global tokens (--blue-500), semantic tokens (--color-primary references --blue-500), component tokens (--button-background references --color-primary). В Angular: tokens у `styles/_tokens.scss` або `src/tokens.css`, завантажуються глобально. Компоненти використовують semantic tokens: `background: var(--color-primary)`. Theming: override semantic tokens для light/dark theme."
      senior: "Design token architecture: 1) Token levels: primitive (--blue-500: #1976d2), semantic (--color-action: var(--blue-500)), component (--button-bg: var(--color-action)). 3 рівні — баланс між flexibility і predictability. 2) Style Dictionary: token source у JSON/YAML → генерує CSS Custom Properties, SCSS vars, TypeScript constants, Android/iOS formats. Single source of truth. 3) Angular Material token system (v17+): M3 design tokens via `mat.define-theme()`, `mat.theme()` mixin. 4) Theming у Angular: `:root { --token: value }` for global, `[data-theme='dark'] { --token: override }` на body, Angular можна `document.body.setAttribute('data-theme', 'dark')`. 5) Token TypeScript types: `export type ColorToken = '--color-primary' | '--color-secondary'` — type-safe token usage. 6) Component-level tokens: `@Component` з ViewEncapsulation.None або CSS Layers для inheritance."
      staff: "Design token governance: 1) Single source of truth: Figma variables → Style Dictionary → CSS Custom Properties, TypeScript constants, native mobile. Figma Tokens plugin або Tokens Studio. 2) Semantic versioning tokens: token renames = breaking change (major). New tokens = minor. Token value changes = patch (або minor якщо semantic shift). 3) Token audit: periodic check що всі tokens використовуються, orphaned tokens removed. AST-based tooling для пошуку usage. 4) Multi-brand theming: brand A → brand B через token override sets. Same components, different tokens. 5) Dark mode strategy: semantic tokens level → single override set per theme. Component не знає про light/dark. 6) Accessibility: contrast ratio validation у CI для token combinations. axe-core або @storybook/addon-a11y. 7) Performance: CSS Custom Properties у :root → все cascade автоматично. Zero-cost runtime theming без JS. 8) Token migration: `ng-update` schematics для автоматичного rename старих token references."
    commonMistakes:
      - "Hardcoded кольори у компонентах замість token references"
      - "Primitive tokens у компонентах (--blue-500) замість semantic (--color-primary)"
      - "Tokens у JavaScript змінних замість CSS Custom Properties — втрата cascade і theming"
    relatedQuestions: ["b15t4q3", "b15t4q5"]
  - id: "b15t4q5"
    level: "staff"
    question: "Як спланувати versioning strategy для публічної Angular component library і як обробляти breaking changes?"
    referenceAnswers:
      junior: "Семантичне версіонування: major для breaking changes, minor для нових features, patch для bug fixes."
      mid: "Semver: major.minor.patch. Breaking changes у Angular libs: видалення @Input/@Output, зміна їх типів, видалення компонента, зміна CSS classes публічного API. Deprecation strategy: позначити @deprecated + додати migration guide + видалити у наступному major. CHANGELOG автоматично через conventional commits."
      senior: "Breaking change management: 1) Public API surface: що є public? Все у index.ts barrel. @Input/@Output types, component selector, CSS classes (якщо задокументовані). 2) Deprecation window: deprecate у N.x, remove у (N+1).x. Мінімум 2 minor versions з @deprecated. 3) ng-update schematics: `ng update @myorg/ui` → автоматично запускає migration schematic → рефакторинг breaking changes у споживача. TypeScript AST transform. 4) Peer dep range: підтримувати 2 Angular major versions (`>=17.0.0 <20.0.0`). При Angular major update — оновити пізніше ніж ng-zorro, ng-bootstrap. 5) Release process: `nx release` або `release-it` + `@semantic-release` — automatic versioning, CHANGELOG, npm publish. 6) Pre-releases: `1.0.0-beta.1` для early feedback. RC для stabilization."
      staff: "Design system versioning at enterprise scale: 1) Release train: quarterly major, monthly minor, weekly patch. Teams знають коли очікувати breaking changes. 2) Compatibility matrix: table у docs — lib version × Angular version. Automation: CI тести проти кількох Angular versions. 3) Migration guides: detailed step-by-step у CHANGELOG, supported by schematics для automated migration. 4) Design system adoption metrics: telemetry (opt-in) яка версія lib у яких apps. Identify apps на old versions для targeted migration support. 5) LTS (Long-term support) versions: якщо major corp customer на v2 — security fixes backport до v2-lts branch. 6) Kommunikation: breaking change RFC process → cross-team review → announcement → release. 7) Monorepo consumers: якщо design system lib живе у Nx monorepo — `nx migrate` команда для всіх consumers одразу. 8) External consumers (npm): ng-update schematics + detailed migration guide. `peerDependencies` range enforcement через `engines` field."
    commonMistakes:
      - "Breaking change без deprecation window — споживачі не мають часу адаптуватись"
      - "Відсутність ng-update schematics — ручна міграція болісна"
      - "Занадто вузький peer dep range — lib не сумісна з minor Angular updates"
    relatedQuestions: ["b15t4q4", "b15t4q1"]
---

## Core Concept

**English definition:** An Angular component library is a publishable package built with ng-packagr conforming to Angular Package Format, providing reusable UI components. A design system adds design tokens, accessibility standards, and governance processes on top of the component library.

**Пояснення:** Component library — це набір переваторних UI компонентів упакованих для розповсюдження через npm. Design system — ширше поняття: це також токени дизайну (кольори, типографія, відступи), guidelines використання, Storybook документація і governance процес для змін. Angular component library + design tokens + Storybook + versioning strategy = design system.

**Яку проблему вирішує:** Без design system: кожна команда reimplement одні й ті ж UI patterns по-різному → inconsistent UX → brand erosion. Дизайнери не мають Single source of truth. Зміна бренду потребує змін у десятках місць. Design system: один набір компонентів → consistent UX скрізь, одне місце для змін, design-development handoff через Storybook.

**Як працює під капотом:** `ng-packagr` компілює Angular lib у Angular Package Format (APF): ESM2022 + FESM2022 + type declarations. Partial Ivy compilation: замість повного Ivy compile — partial compilation artifacts (`.d.ts` з Ivy metadata). Споживач Angular CLI завершує compile з своєю Angular версією → lib сумісна між minor Angular versions. Secondary entry points: ng-packagr будує кожен у окремий chunk → `package.json exports` map генерується автоматично → bundler tree-shakes непотрібні entries. Storybook: окремий webpack/Vite build, не prod bundle, lazy-loads stories.

**Trade-offs та обмеження:** Pub/sub release cycle: кожна lib зміна = publish, app оновлює dep. У monorepo: buildable (не publishable) lib достатня — без npm publish. Peer dependencies: lib не бандлює Angular — споживач має свій. Якщо consumer Angular version виходить з peer dep range → error при install. Secondary entry points: більше файлів для manage, але краща tree-shaking. Storybook build час може бути значним для великих design systems.

**Версійність:** ng-packagr — з Angular 5 (2017), тісно інтегрований у Angular CLI. Angular Package Format (APF) оновлюється з кожним Angular major: APF 14 — ESM2020+FESM2020, APF 15+ — ESM2022+FESM2022. Partial Ivy — Angular 12+. Secondary entry points підтримка у ng-packagr — Angular 7+. `@storybook/angular` — Storybook 5+ (2019), mature integration у Storybook 7/8. Design tokens як CSS Custom Properties — сучасний стандарт, Angular Material v17 повністю на M3 tokens.

## Deep Details

### Edge Cases

**Partial vs full Ivy compilation:** ng-packagr компілює у partial mode. Якщо lib використовується у Angular workspace з `enableIvy: false` (Angular 8 View Engine) — несумісність. З Angular 16+: View Engine підтримка видалена, лише Ivy. Partial compilation artifacts у `.d.ts` файлах (Ivy specific types).

**Peer dep version conflicts:** Якщо app має `@angular/core: 17.0.0` і lib має `peerDependencies: { '@angular/core': '>=15 <18' }` — OK. Але `>=15 <17` — npm install warning/error. Широкий peer dep range краще для adoption але ризик incompatibility.

**Secondary entry circular deps:** ng-packagr error якщо primary entry імпортує secondary. Причина: circular dependency у build graph. Primary entry має re-export лише те, що не у secondary. Або: primary entry не re-exports нічого — лише secondary entries.

**Storybook і Angular 17 esbuild:** Storybook 7/8 підтримує Angular esbuild builder. Але деякі addons (custom webpack addons) несумісні. Перевіряти сумісність аддонів з Angular version.

### Junior vs Senior Understanding

**Junior** знає що publishable lib = npm package і Storybook = UI documentation tool.

**Senior** розуміє: 1) APF і partial Ivy compilation — чому lib сумісна між Angular minor versions. 2) Secondary entry points і їх вплив на tree-shaking і bundle size. 3) Design token levels (primitive → semantic → component) і чому не hardcode кольори. 4) ng-update schematics для automated migration. 5) Style Dictionary як automation bridge між Figma і code. 6) Chromatic + Storybook для visual regression testing у CI.

### Deprecation & Migration Path

**View Engine libs:** Більше не підтримуються Angular 16+. Всі libs мають перейти на Ivy partial compilation. `ng-packagr` автоматично compile у partial mode. **`entryFile` path у ng-package.json:** Нова конвенція — `public-api.ts` замість `index.ts` (обидва підтримуються). **Angular Material v2 token system:** Замінено на M3 у Angular Material v17. `mat.define-light-theme()` → `mat.define-theme()`. **SCSS-only theming:** Замінюється на CSS Custom Properties у Angular Material 18+. `mat.color()` mixin → CSS token variables.

### Connections to Other Concepts

- **Monorepo Nx (Block 15, Topic 2):** `nx generate @nx/angular:library --publishable` — генерує APF-compliant publishable lib.
- **Project Structure (Block 15, Topic 1):** Design system lib = `type:ui` у Nx taxonomy.
- **Standalone Components (Block 1):** Standalone components у lib — простіше для споживача (import напряму без NgModule).
- **Change Detection (Block 9):** Design system components з `ChangeDetectionStrategy.OnPush` — performance critical для reusable components.

## Examples

### Basic Usage

```
// Структура publishable Angular component library
// libs/ui/
// ├── src/
// │   ├── index.ts                  — primary entry (re-exports public API)
// │   ├── button/
// │   │   ├── ng-package.json       — secondary entry point
// │   │   ├── index.ts              — secondary barrel
// │   │   ├── button.component.ts
// │   │   └── button.component.spec.ts
// │   └── input/
// │       ├── ng-package.json       — secondary entry point
// │       ├── index.ts
// │       └── input.component.ts
// ├── ng-package.json               — primary ng-package config
// └── package.json                  — lib package.json з peerDependencies
```

```json
// libs/ui/ng-package.json — primary entry
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "src/index.ts"
  },
  "dest": "../../dist/libs/ui"
}

// libs/ui/src/button/ng-package.json — secondary entry
{
  "$schema": "../../../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "index.ts"
  }
}

// libs/ui/package.json
{
  "name": "@myorg/ui",
  "version": "1.0.0",
  "peerDependencies": {
    "@angular/common": ">=17.0.0 <22.0.0",
    "@angular/core": ">=17.0.0 <22.0.0"
  },
  "sideEffects": false
}
```

```typescript
// libs/ui/src/button/button.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [class]="buttonClasses"
      [disabled]="disabled"
      [attr.aria-disabled]="disabled"
      (click)="!disabled && clicked.emit($event)"
    >
      <ng-content />
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    button {
      background: var(--ui-button-bg, var(--color-action));
      color: var(--ui-button-color, var(--color-on-action));
      border-radius: var(--ui-button-radius, var(--radius-sm));
    }
  `],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    return `btn btn--${this.variant} btn--${this.size}`;
  }
}

// libs/ui/src/button/index.ts — secondary entry barrel
export { ButtonComponent } from './button.component';
export type { ButtonVariant, ButtonSize } from './button.component';
```

### Production Scenario

```typescript
// libs/ui/src/button/button.stories.ts — Storybook CSF3
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Components/Button',
  component: ButtonComponent,
  decorators: [
    moduleMetadata({
      imports: [ButtonComponent],
    }),
  ],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    clicked: { action: 'clicked' },
  },
};
export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
  },
  render: (args) => ({
    props: args,
    template: `<ui-button [variant]="variant" [size]="size" [disabled]="disabled">Click me</ui-button>`,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    template: `
      <ui-button variant="primary">Primary</ui-button>
      <ui-button variant="secondary">Secondary</ui-button>
      <ui-button variant="ghost">Ghost</ui-button>
    `,
  }),
};

// Interaction test у Storybook
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const ClickTest: Story = {
  args: { variant: 'primary' },
  render: (args) => ({
    props: args,
    template: `<ui-button (clicked)="clicked($event)">Click</ui-button>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    // Storybook actions addon logs the click
  },
};
```

```scss
// libs/ui/src/styles/_tokens.scss — design tokens
// Primitive tokens (не для прямого використання у компонентах)
:root {
  // Color primitives
  --blue-100: #e3f2fd;
  --blue-500: #1976d2;
  --blue-700: #1565c0;

  // Semantic tokens (компоненти використовують ці)
  --color-action: var(--blue-500);
  --color-action-hover: var(--blue-700);
  --color-on-action: #ffffff;

  // Spacing
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;

  // Typography
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;

  // Radius
  --radius-sm: 4px;
  --radius-md: 8px;
}

// Dark theme override
[data-theme='dark'] {
  --color-action: var(--blue-300);
  --color-on-action: #000000;
}
```

### Anti-Example

```typescript
// ПОГАНО: Hardcoded кольори замість tokens
@Component({
  styles: [`
    button {
      background: #1976d2;   /* ❌ hardcoded — theming неможливий */
      color: white;
      border-radius: 4px;
    }
  `],
})
export class ButtonComponent {}

// ПОГАНО: dependencies замість peerDependencies
// package.json
{
  "dependencies": {
    "@angular/core": "^17.0.0"   // ❌ dist bundle включає Angular!
  }
}
// Результат: споживач + lib мають дві копії Angular → runtime crash

// ПОГАНО: Primary entry re-exports всі secondary entries
// libs/ui/src/index.ts
export * from './button/index';  // ❌ re-export secondary через primary
export * from './input/index';   // Втрачається tree-shaking переваги secondary entries
// Якщо споживач import { ButtonComponent } from '@myorg/ui' (primary entry),
// bundler може включити ВСЕ з lib, не лише button
// Правильно: споживач import { ButtonComponent } from '@myorg/ui/button' (secondary)

// ПОГАНО: Storybook тільки для happy path
export const Button: Story = {
  args: { label: 'Click me' },
}; // ❌ немає: disabled state, loading state, long text overflow, icon-only variant
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `dependencies` замість `peerDependencies` для Angular у lib | Dist bundle включає Angular — споживач має дві копії → runtime crash | `peerDependencies: { '@angular/core': '>=17 <22' }` |
| Hardcoded кольори/розміри замість CSS Custom Properties tokens | Theming неможливий, зміна бренду = ручне оновлення кожного компонента | Semantic design tokens: `var(--color-action)`, `var(--spacing-md)` |
| Primary entry re-exports всі secondary entries | Втрата tree-shaking — споживач завантажує весь lib навіть якщо використовує один компонент | Споживачі явно імпортують secondary entries: `@myorg/ui/button` |
| Breaking change без deprecation window і migration schematics | Споживачі ламаються при update без шляху міграції | Deprecation у N.x, видалення у (N+1).x, ng-update schematics для auto-migration |
| Storybook не у CI, stories outdated | Stories відстають від компонентів, документація ненадійна | `storybook build` у CI + `test-runner` для interaction tests + Chromatic для visual regression |

## Interview Block

### [L1 — Warm-up] Що таке publishable Angular library і чим вона відрізняється від buildable lib у Nx?

**Signal being tested:** Розуміння Angular Package Format і різниці між build-for-monorepo і build-for-npm.

**What the interviewer expects:** APF, peerDependencies, ng-packagr, npm publish ready.

**How to probe deeper:** "Чому Angular має бути у peerDependencies а не dependencies у component lib?"

**Reference answer:** Buildable lib: компілюється для incremental build у monorepo, не для npm. Publishable: ng-packagr → APF (ESM2022 + FESM2022 + type defs). `peerDependencies` для Angular (споживач має свою копію). `sideEffects: false` для tree-shaking. Partial Ivy compilation — сумісність між minor Angular versions.

**Common mistakes:** `dependencies` замість `peerDependencies` — bundle включає Angular. Full Ivy compilation — несумісна між versions.

---

### [L2 — Mid] Що таке secondary entry points і чому вони важливі для tree-shaking?

**Signal being tested:** Розуміння granular code splitting через secondary entries і package.json exports map.

**What the interviewer expects:** `ng-package.json` у підпапці, `@myorg/ui/button` import path, tree-shaking benefit.

**How to probe deeper:** "Що станеться якщо primary entry re-exports всі secondary entries?"

**Reference answer:** Secondary entry: окремий `ng-package.json` → будується як окремий APF chunk → `package.json exports map`. Споживач `import { ButtonComponent } from '@myorg/ui/button'` → bundler включає лише button chunk. Якщо primary re-exports all: bundler може включити все — tree-shaking неефективний. Circular dep rule: secondary не можна імпортувати через primary.

**Common mistakes:** Primary re-export all secondary. Забувають `ng-package.json` у secondary entry dir.

---

### [L3 — Senior] Як організувати design tokens і яка архітектура token levels?

**Signal being tested:** Розуміння token hierarchy (primitive/semantic/component), CSS Custom Properties cascade і theming strategy.

**What the interviewer expects:** 3 рівні токенів, CSS Custom Properties, Style Dictionary для automation, dark mode через token override.

**How to probe deeper:** "Чому компонент має використовувати semantic token (--color-action), а не primitive (--blue-500)?"

**Reference answer:** Primitive tokens: `--blue-500: #1976d2` — абстракція кольору без змісту. Semantic: `--color-action: var(--blue-500)` — намір. Component: `--button-bg: var(--color-action)`. Компонент використовує semantic — при зміні бренду: override `--color-action`, не кожен компонент. Dark mode: `[data-theme='dark'] { --color-action: override }`. Style Dictionary: Figma → JSON → CSS Custom Properties (одне джерело правди).

**Common mistakes:** Primitive tokens у компонентах — theming потребує зміни кожного компонента. Tokens у SCSS variables — втрата CSS cascade.

---

### [L4 — Staff/Principal] Як спланувати versioning strategy для публічної Angular component library?

**Signal being tested:** Системне мислення про release train, breaking change management і ecosystem impact.

**What the interviewer expects:** Semver, deprecation window, ng-update schematics, peer dep range strategy, release automation.

**How to probe deeper:** "Як ти handle breaking change якщо 30 internal apps використовують lib і треба rename key component?"

**Reference answer:** Deprecation window: old API deprecated у v1.x з `@deprecated`, removed у v2.0. ng-update schematics: `ng update @myorg/ui` auto-renames у consumer code через TypeScript AST. Peer dep range: широкий (`>=17 <22`) для adoption. Release train: quarterly major, monthly minor. CHANGELOG + `nx release` automation. Для 30 internal apps: monorepo → `nx migrate` для всіх consumers одразу.

**Common mistakes:** Breaking change без schematics. Занадто вузький peer dep range. Відсутній deprecation window.

## Summary

### Key Points

- Publishable Angular library: ng-packagr → APF (ESM2022), partial Ivy compilation для cross-version compatibility, `peerDependencies` для Angular
- Secondary entry points: окремий APF chunk per feature/component → tree-shaking, `@myorg/ui/button` imports
- Design tokens: 3 рівні (primitive → semantic → component), CSS Custom Properties для cascade і runtime theming, Style Dictionary для Figma-to-code automation
- Storybook: living documentation, Controls addon для @Inputs, interaction tests, Chromatic для visual regression
- Deprecation strategy: deprecated у N.x → removed у (N+1).x → ng-update schematics для auto-migration
- Breaking changes у lib = потенційний блокер для N команд — RFC процес + migration support
- `sideEffects: false` у package.json — bundler tree-shakes lib без ризику видалення потрібного коду

### Elevator Pitch (2 minutes)

Angular design system — це більше ніж набір компонентів: це єдина мова між дизайн і розробка командами. Технічна основа: publishable lib через ng-packagr (Angular Package Format з partial Ivy compilation для cross-version compatibility) + secondary entry points для granular tree-shaking (`@myorg/ui/button` замість імпорту всього). Design tokens: 3 рівні (primitive → semantic → component) через CSS Custom Properties — один override set для theming замість зміни кожного компонента. Storybook: живий documentation + interaction tests + Chromatic visual regression у CI. Governance: semver з deprecation window + ng-update schematics для automated migration breaking changes у споживачів. Результат: consistent UX скрізь продуктах, нова feature у дизайн системі потрапляє у всі apps через npm update.
