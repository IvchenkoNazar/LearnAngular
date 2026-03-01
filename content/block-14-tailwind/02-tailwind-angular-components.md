---
title: "Tailwind CSS in Angular Components"
block: 14
topic: 2
slug: "tailwind-angular-components"
difficulty: 2
sinceVersion: "2"
tags: ["Tailwind", "utility classes", "component styling", "host binding", "encapsulation", ":host"]
relatedTopics: ["tailwind-setup", "material-tailwind-together", "component-driven-approach", "setup-theming"]
interviewQuestions:
  - level: "junior"
    question: "Як використовувати Tailwind utility classes в Angular компонентах і чи є якісь особливості?"
    referenceAnswers:
      junior: "Tailwind класи додаються прямо в HTML template. Вони глобальні тому ViewEncapsulation не заважає. Можна використовувати ngClass для умовних класів."
      mid: "Tailwind utility classes в Angular: 1) Прямо в template — `<div class='flex items-center p-4'>`. 2) Dynamic через ngClass: `[ngClass]={'bg-blue-500': isActive}`. 3) @apply в component styles для reusable patterns. 4) ViewEncapsulation.Emulated (default) — НЕ заважає Tailwind, бо Tailwind classes глобальні в styles.css. 5) Tailwind content paths повинні включати .ts файли для class bindings."
      senior: "ViewEncapsulation і Tailwind деталі: Emulated encapsulation додає _ngcontent-xxx атрибути до DOM і scopeселектори в component CSS. Але Tailwind utilities генеруються в глобальний styles.css з простими class selectors (.flex, .p-4) — вони вищої специфічності ніж scoped компонентні стилі. Тому Tailwind classes завжди 'перемагають' component CSS якщо обидва є. @apply в component .css: PostCSS обробляє component styles окремо з тим же Tailwind config — @apply замінюється на конкретні CSS properties. Але ViewEncapsulation.ShadowDom ізолює component styles від global — @apply не отримає Tailwind definitions."
      staff: "Tailwind в Angular компонентах — архітектурне рішення: 1) Utility-first у templates: мінімальний component CSS, максимальний reuse Tailwind classes. 2) ViewEncapsulation strategy: для більшості компонентів — Emulated (default). ShadowDom — лише коли потрібна повна ізоляція (widget що вбудовується в інші сайти). None — для компонентів де стилі повинні впливати на children (layout контейнери). 3) :host pseudo-element: Tailwind не має :host утиліт — потрібен hybrid підхід: @apply в component CSS для :host стилів. 4) Performance: Tailwind JIT generates CSS лише для classes у content paths — монitorьте bundle з budget checks. 5) Консистентність: enforce Tailwind class ordering через ESLint plugin для team consistency."
    commonMistakes:
      - "Думають що ViewEncapsulation.Emulated блокує Tailwind — Tailwind завжди глобальний"
      - "Конкатенують class names динамічно — purge не знайде"
      - "Використовують Tailwind у компонентах але не включають .ts файли в content paths"
    relatedQuestions: ["b14t2q2", "b14t1q2"]
  - level: "mid"
    question: "Як стилізувати :host елемент Angular компонента через Tailwind і коли потрібний @apply?"
    referenceAnswers:
      junior: "Можна використати :host селектор у component styles і написати CSS вручну або через @apply."
      mid: ":host стилізація: 1) В component CSS: `:host { @apply flex flex-col gap-4; }` — PostCSS перетворює в конкретні CSS properties. 2) Або через host binding: `@HostBinding('class')` = `'flex flex-col gap-4'`. 3) @apply потрібен коли Tailwind classes не можна додати в template — :host, ::before, ::after, складні selectors. 4) @apply в component CSS з Emulated encapsulation — скопіює CSS properties (не додасть class до element)."
      senior: "@apply internals: PostCSS replace @apply directive з resolved CSS properties at build time. Наприклад: `@apply flex items-center` → `display: flex; align-items: center;`. Не додає class до element — копіює properties. Це означає: specificity залежить від де @apply (component :host — specificity 0-1-0, звичайний class — 0-1-0 без attribute selector). З ViewEncapsulation.Emulated, _nghost-xxx selector на :host збільшує specificity. HostBinding('class') vs :host { @apply }: HostBinding dynamic (можна змінювати), :host статичний. Для conditional host classes: `[class.is-active]` binding. Для base styles: :host { @apply } патерн. Performance: @apply копіює properties — якщо 10 компонентів мають `@apply flex`, кожен отримає свій copy CSS. Tailwind classes в template — один shared global CSS rule."
      staff: "Host styling strategy для design system: 1) Base host styles через :host { @apply } — encapsulated, не впливають на зовнішній DOM. 2) Public API через CSS custom properties: `:host { --card-padding: theme('spacing.4'); padding: var(--card-padding); }` — споживачі можуть override. 3) Modifier classes через HostBinding: `@HostBinding('class.is-compact') isCompact = false` — external API для parent to modify child. 4) @apply vs inline utilities: @apply добре для :host і pseudo-elements. Template utilities — для все інше. Mixed підхід. 5) SSR: @apply compile-time — no runtime overhead. HostBinding — triggers Angular CD. 6) Testing: `fixture.debugElement.nativeElement.classList` для host class testing. `getComputedStyle()` для @apply computed values."
    commonMistakes:
      - "@apply в global styles.css для широко повторюваних patterns — краще component extraction"
      - "HostBinding string з усіма класами одразу замість окремих bindings — важко читати і дебажити"
      - "Не враховують що @apply копіює CSS, не клас — specificity може дивувати"
    relatedQuestions: ["b14t2q1", "b14t2q3"]
  - level: "mid"
    question: "Як ViewEncapsulation.None і ViewEncapsulation.ShadowDom впливають на Tailwind CSS в Angular компонентах?"
    referenceAnswers:
      junior: "None означає що стилі глобальні, ShadowDom ізолює стилі. З Tailwind — None не має ефекту бо Tailwind вже глобальний."
      mid: "ViewEncapsulation.None: component styles стають глобальними — можуть accidentally affect children і siblings. З Tailwind це не має різниці для utilities (вже глобальні), але небезпечно для custom component CSS. ShadowDom: повна ізоляція. Tailwind global utilities НЕ penetrate Shadow DOM. @apply в component styles — стилі в shadow root, Tailwind definitions доступні через PostCSS processing. :host selector у shadow DOM — стилізує host element з середини."
      senior: "ViewEncapsulation deep dive: Emulated: Angular додає _ngcontent-HASH і _nghost-HASH атрибути, CSS selectors scoped. Tailwind глобальні classes — не scoped, завжди works. ShadowDom: браузерна інкапсуляція. Зовнішній CSS (включаючи Tailwind utilities з styles.css) не penetrates — це breaking change якщо components rely on global Tailwind. Але @apply в component styles копіює CSS properties у shadow root stylesheet — works. CSS custom properties (--color-primary: red) — penetrate Shadow DOM. Тому: Material/Tailwind design tokens через CSS custom properties — works навіть у ShadowDom. None: стилі додаються в <head> як global — всі children affected. Обережно: компонент з ViewEncapsulation.None і button стилем affected всіх buttons у app. Avoid None якщо не knowingly creating global styles."
      staff: "ViewEncapsulation strategy для enterprise: 1) Default Emulated — для 99% компонентів. Tailwind works, light isolation. 2) ShadowDom — для publishable web components (Angular Elements), third-party embeddable widgets. Знати що global Tailwind utilities не penetrate — потрібен @apply або CSS custom properties bridge. 3) None — anti-pattern в більшості випадків. Легітимне використання: legacy CSS migration де global scope intentional, host application стилі що повинні override child. 4) Hybrid approach для design system: base token layer через CSS custom properties (ShadowDom-compatible) + Tailwind utilities в templates (Emulated-compatible). 5) Testing ShadowDom components: `fixture.debugElement.nativeElement.shadowRoot` для DOM queries. Regular TestBed queries не penetrate Shadow DOM."
    commonMistakes:
      - "ViewEncapsulation.None для 'легкого' CSS override — глобальне забруднення стилів"
      - "Expect Tailwind utilities в ShadowDom component template — вони не penetrate Shadow DOM"
      - "Використовують ShadowDom без розуміння CSS custom properties bridge pattern"
    relatedQuestions: ["b14t2q2", "b14t2q4"]
  - level: "senior"
    question: "Як реалізувати dynamic Tailwind classes в Angular з ngClass без breaking Tailwind content scanning?"
    referenceAnswers:
      junior: "Треба писати повні назви класів, не конкатенувати рядки. Tailwind сканує файли і не знайде partial strings."
      mid: "Dynamic classes патерни: 1) ngClass object map: `[ngClass]={'bg-blue-500': isActive, 'bg-gray-200': !isActive}` — всі class names literal strings, scanner знайде. 2) Signal/computed: `colorClass = computed(() => isActive() ? 'bg-blue-500' : 'bg-gray-200')`. 3) Lookup map в component: `const statusClasses = { error: 'text-red-500', success: 'text-green-500' }` — literal keys."
      senior: "Tailwind content scanning mechanism: Tailwind використовує regex-based token extractor що шукає потенційні utility tokens у файлах як plain text — не парсить TypeScript AST. Наслідки: 1) Template literals bg-${color}-500 — scanner бачить bg-, color, -500 окремо, клас не знайдено. 2) String concatenation: bg- + color + -500 — аналогічно. 3) Computed TypeScript: всі string literals де б вони не були — знайдуться якщо .ts в content. 4) Enum values: enum Status { Active = bg-green-500 } — literal strings знайдуться. 5) Safelist для динамічних patterns: safelist: [{ pattern: /bg-(red|green|blue)-500/ }] — prevents purge. 6) Complete class objects: кожен клас повністю в обєкті — reliable."
      staff: "Dynamic classes architecture: 1) Class maps як constants у separate files з literal string values per key — Tailwind scanner знаходить literal strings у .ts файлах. 2) Variant types: type ButtonVariant = primary or secondary or danger + class map — type-safe і scanner-friendly. 3) Safelist для CMS/API content з documented pattern contract між backend і frontend. 4) Dynamic class generation at build time: якщо classes відомі statically — кодогенерація з API schema. 5) CSS custom properties для truly dynamic user-defined colors через style binding — Tailwind не потрібен для цього рівня кастомізації. 6) ESLint rule для enforcement: заборонити string interpolation в class bindings."
    commonMistakes:
      - "Конкатенація class names (`'bg-' + color`) — classes зникають в production"
      - "Safelist pattern занадто broad (pattern: /.*/) — нейтралізує весь purge"
      - "Не включають .ts файли в content paths — class maps у TS не знайдуться"
    relatedQuestions: ["b14t2q3", "b14t1q2"]
  - level: "staff"
    question: "Як проектувати Angular компоненти styled з Tailwind що легко тестувати, підтримувати і reuse в різних контекстах?"
    referenceAnswers:
      junior: "Компоненти повинні мати окремі класи для різних станів і encapsulated логіку."
      mid: "Testable Tailwind components: 1) Input signals для variants і states. 2) Class maps для dynamic classes. 3) @HostBinding для host element classes. 4) Semantic HTML — accessibility і testing. 5) Storybook для visual testing компонентів."
      senior: "Component design для reusability з Tailwind: 1) Props-driven styling: `@Input() variant: 'primary' | 'secondary' = 'primary'` + `variantClasses = { primary: 'bg-blue-600 text-white', secondary: 'bg-gray-200 text-gray-900' }`. 2) Class merging для external customization: `[class]` binding або `class` Input що merges з base classes. 3) Responsive variants через Input: `@Input() size: 'sm' | 'md' | 'lg'` + class map. 4) Testing: перевіряти computed classes не через DOM text но через component logic unit tests. 5) Стorybook + Tailwind: автоматично picks up Tailwind config — visual testing."
      staff: "Enterprise component architecture з Tailwind: 1) Component API design: expose variants через typed inputs, не expose raw Tailwind class customization (leaky abstraction). `ButtonComponent` приймає `variant: ButtonVariant`, не `className: string`. 2) Class merging utility: `clsx` або `@angular/cdk/coercion` + custom merge — safe combination of conditional classes. 3) Design token consumption: компонент використовує theme tokens через `bg-primary-500` (custom color в Tailwind config) — не hardcoded `bg-blue-500`. 4) Documentation: Storybook stories демонструють всі variant combinations — single source of visual truth. 5) Visual regression: Chromatic або Percy snapshot testing кожного variant. 6) Bundle analysis: кожен unique Tailwind class = 1 CSS rule. Shared classes між компонентами — shared CSS, не duplicated. Порівняно з `@apply` в кожному компоненті — `@apply` дублює CSS properties. 7) A11y: кожен компонент тестується axe-core в Storybook через @storybook/addon-a11y."
    commonMistakes:
      - "Expose raw className input — leaky abstraction, порушує encapsulation"
      - "Хардкодять tailwind color classes замість design tokens (custom colors в Tailwind config)"
      - "Не мають visual regression tests — рефакторинг Tailwind classes ризикований"
    relatedQuestions: ["b14t2q4", "b14t3q1", "b14t4q1"]
---

## Core Concept

**English definition:** Using Tailwind CSS in Angular components involves applying utility classes directly in templates, handling ViewEncapsulation interactions, using `@apply` in component SCSS for host/pseudo-element styling, and managing dynamic class bindings in a way that remains compatible with Tailwind's content scanner.

**Пояснення:** Tailwind в Angular компонентах — це compose-by-class підхід: замість писати CSS, ви комбінуєте utility класи в HTML. Angular-специфіка: ViewEncapsulation визначає як стилі ізолюються, але Tailwind utilities — завжди глобальні. Ключова задача — dynamic classes в Angular bindings зробити сумісними з Tailwind content scanning.

**Яку проблему вирішує:** Традиційний component CSS — isolated, hard to reuse, naming conventions (BEM). Tailwind utilities — universally understood semantics (flex, p-4, text-lg), Tailwind scanner прибирає невикористане. Але Angular ViewEncapsulation і TypeScript динамічні binding patterns потребують розуміння як їх поєднати.

**Як працює під капотом:**

Tailwind + Angular integration pipeline:

1. PostCSS обробляє `styles.css` (з `@tailwind utilities`) і component `.css`/`.scss` files
2. Для `styles.css`: генерує utility classes з usedClasses знайдених у content scanning
3. Для component `.css`: @apply directives замінюються на конкретні CSS properties (не classes)
4. ViewEncapsulation.Emulated: додає `_ngcontent-HASH` атрибути до DOM, scopes component CSS — але NOT Tailwind globals
5. ViewEncapsulation.ShadowDom: browser ізоляція — Tailwind globals з styles.css не penetrate

```typescript
// Що відбувається з @apply у component styles
// SCSS input:
.button { @apply flex items-center px-4 py-2 rounded-lg; }

// PostCSS output (приблизно):
.button { display: flex; align-items: center; padding: 0.5rem 1rem; border-radius: 0.5rem; }
// Зверніть: PostCSS замінює @apply — немає класу 'flex' в DOM, є CSS properties
```

**Trade-offs та обмеження:**

- `@apply` дублює CSS properties у кожному місці використання — збільшує bundle порівняно з shared global class
- Dynamic class strings (конкатенація) несумісні з Tailwind content scanner
- ViewEncapsulation.ShadowDom ізолює від global Tailwind utilities — потрібен @apply або CSS custom props bridge
- `:host` стилізація з Tailwind — тільки через @apply або HostBinding, не через template classes

**Версійність:**
- Angular 11.2+: нативна PostCSS integration — @apply в component styles works
- Angular 14+: standalone components — Tailwind imports in `imports: []` не потрібні (Tailwind завжди global)
- Angular 17+: esbuild builder з покращеною PostCSS інтеграцією для component styles
- Tailwind v3.0+: JIT mode за замовчуванням, arbitrary values (`p-[13px]`)

## Deep Details

### Edge Cases

- **@apply з Emulated encapsulation:** `@apply` у component `.css` + Emulated = scoped CSS з Tailwind properties. Але Tailwind class у template = global CSS rule. Specificity може конфліктувати якщо обидва присутні.
- **:host і specificity:** `:host { @apply ... }` з Emulated encapsulation — selector має specificity 0-1-0 (pseudo-class) + _nghost attribute selector = вища specificity ніж глобальний Tailwind class.
- **Dynamic classes з SSR:** Content scanning відбувається при build — не runtime. SSR не впливає на Tailwind generation. Але `[class]` binding з dynamic values — browser-side only.
- **Tailwind і CSS Modules:** Angular не підтримує CSS Modules нативно (React-style). Tailwind utilities глобальні — схожа behavior без module scoping.

### Junior vs Senior Understanding

**Junior** знає: додавати Tailwind classes у template, використовувати ngClass для умов.

**Senior** розуміє:

1. **ViewEncapsulation matrix** — Emulated: Tailwind works, custom component CSS scoped. ShadowDom: Tailwind NOT works in template, @apply works. None: все global. Правило: Default Emulated для 99%, ShadowDom тільки для web components/embedded widgets.
2. **Content scanning semantics** — Tailwind scanner: regex text search, не TypeScript parser. Literal strings = safe. Template literals, concatenation = unsafe. Constants об'єкти з literal values = safe.
3. **@apply overhead** — `@apply flex p-4` у component styles = 2 CSS properties скопійовано у component stylesheet. 100 компонентів з `@apply flex` = 100 copies `display: flex`. Vs. global `.flex { display: flex }` — 1 rule shared. @apply для reusable patterns тільки якщо genuinely component-specific.
4. **Host styling patterns** — HostBinding class для dynamic, @apply у :host для static base.

### Deprecation & Migration Path

- **`class` + `[class]` binding collision:** В Angular 17+, `class="static"` і `[class]="dynamic"` правильно merges. Раніше `[class]` повністю перезаписував. Використовуйте `[class.dynamic-class]="condition"` для safe conditional addition.
- **ngClass vs [class]:** `[class.name]="bool"` — preferred для одиночного conditional class. `[ngClass]="object"` для кількох. `[class]="string"` — всі static classes (без `class=""` паралельно).

### Connections to Other Concepts

- **Tailwind Setup:** Content paths конфігурація визначає які файли скануються — .ts включення для TypeScript class maps
- **Material + Tailwind Together:** Specificity conflicts між Material і Tailwind — детально в [material-tailwind-together](/topics/material-tailwind-together)
- **Component-Driven Approach:** @apply vs component extraction — detально в [component-driven-approach](/topics/component-driven-approach)
- **ViewEncapsulation:** Emulated vs ShadowDom impact on Tailwind — частина загального Angular component architecture

## Examples

### Basic Usage

```typescript
// card.component.ts — базові Tailwind utilities в template
import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      [ngClass]="[
        'rounded-lg border p-4 shadow-sm',
        variants[variant],
        elevated ? 'shadow-md' : 'shadow-sm'
      ]">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <p class="mt-1 text-sm text-gray-600">
        <ng-content></ng-content>
      </p>
    </div>
  `,
})
export class CardComponent {
  @Input() title = '';
  @Input() variant: 'default' | 'success' | 'warning' | 'error' = 'default';
  @Input() elevated = false;

  // Literal strings — Tailwind scanner знайде всі
  protected readonly variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  } as const;
}
```

### Production Scenario

```typescript
// button.component.ts — production-ready Tailwind button
import {
  Component, Input, HostBinding, booleanAttribute
} from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button, button[appButton]',
  standalone: true,
  template: `
    @if (loading) {
      <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full
                   border-2 border-current border-t-transparent">
      </span>
    }
    <ng-content></ng-content>
  `,
  // :host styles через component CSS з @apply
  styles: [`
    :host {
      @apply inline-flex items-center justify-center font-medium
             transition-all duration-150 focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50;
      cursor: pointer;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) disabled = false;

  // Static class maps — Tailwind scanner знаходить literal strings
  private static readonly variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400',
  };

  private static readonly sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
    md: 'h-10 px-4 text-sm rounded-lg gap-2',
    lg: 'h-12 px-6 text-base rounded-lg gap-2.5',
  };

  @HostBinding('class')
  get hostClasses(): string {
    return [
      ButtonComponent.variantClasses[this.variant],
      ButtonComponent.sizeClasses[this.size],
    ].join(' ');
  }

  @HostBinding('attr.disabled')
  get isDisabled(): boolean | null {
    return this.disabled || this.loading ? true : null;
  }
}
```

```typescript
// status-badge.component.ts — responsive utility classes
import { Component, Input } from '@angular/core';

type Status = 'active' | 'inactive' | 'pending' | 'error';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span [class]="badgeClasses">
      <span class="mr-1.5 inline-block h-2 w-2 rounded-full" [class]="dotClass"></span>
      {{ label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: Status;
  @Input() label = '';

  // Responsive classes — breakpoint prefixes в literal strings
  get badgeClasses(): string {
    return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
            sm:px-3 sm:py-1 sm:text-sm ${this.statusBadgeMap[this.status]}`;
  }

  get dotClass(): string {
    return this.statusDotMap[this.status];
  }

  private readonly statusBadgeMap: Record<Status, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  private readonly statusDotMap: Record<Status, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    pending: 'bg-yellow-500',
    error: 'bg-red-500',
  };
}
```

### Anti-Example

```typescript
// WRONG: Dynamic class concatenation — purge видалить в production
@Component({
  template: `
    <!-- Tailwind НЕ знайде 'bg-blue-500' або 'bg-red-500' -->
    <div [class]="'bg-' + colorName + '-500 text-white p-4'">
      Content
    </div>
  `
})
export class BadDynamicClassComponent {
  colorName = 'blue'; // In production: no bg-blue-500, no bg-red-500 CSS exists
}

// WRONG: @apply для кожного layout — дублює CSS
// styles.css
.flex-center { @apply flex items-center justify-center; }
.flex-between { @apply flex items-center justify-between; }
// Тепер кожне місце де є .flex-center — дублює `display:flex; align-items:center...`
// Краще: просто `<div class="flex items-center justify-center">` — global Tailwind rule shared

// CORRECT: Literal strings у map — scanner знайде
@Component({
  template: `<div [class]="colorClasses[status]">Content</div>`
})
export class GoodDynamicClassComponent {
  status: 'active' | 'error' = 'active';

  // Всі classes literal — content scanner знаходить
  protected readonly colorClasses = {
    active: 'bg-green-500 text-white p-4',
    error: 'bg-red-500 text-white p-4',
  } as const;
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Конкатенація class strings (`'bg-' + color + '-500'`) | Tailwind scanner не знайде класи — зникнуть в production | Literal string map: `{ primary: 'bg-blue-500', danger: 'bg-red-500' }` |
| ViewEncapsulation.ShadowDom + Tailwind template classes | Global Tailwind CSS не penetrate Shadow DOM — утиліти не застосуються | Emulated (default) для Tailwind components, або @apply в component styles |
| ViewEncapsulation.None для "простішого" Tailwind | Component CSS стає глобальним — side effects на інші components | Залишати Emulated (default), використовувати @apply для needed properties |
| @apply для простих single-use utility combinations | Дублює CSS properties замість sharing global rule — збільшує bundle | Пишіть utility classes прямо в template де вони single-use |
| Expose `className: string` input для customization | Leaky abstraction — consumer знає про Tailwind internals | Typed variant inputs: `variant: 'primary' | 'secondary'` з internal class map |

## Interview Block

### [L1 — Warm-up] Чи впливає ViewEncapsulation на Tailwind CSS utility classes в Angular компонентах?
**Signal being tested:** Розуміння що Tailwind utilities глобальні і ViewEncapsulation scopes тільки component styles — розрізнення двох різних CSS layers.
**What the interviewer expects:** Пояснення що Emulated encapsulation scopes component CSS але не global Tailwind utilities. ShadowDom — інша справа.
**How to probe deeper:** "А якщо використовувати ViewEncapsulation.ShadowDom — чи будуть Tailwind utilities в template працювати?"
**Reference answer:** ViewEncapsulation.Emulated (default) НЕ впливає на Tailwind utilities — вони глобальні у styles.css, template elements їх inherit. Emulated scoping додає attribute selectors тільки до component CSS rules. ViewEncapsulation.ShadowDom — виняток: браузерна ізоляція блокує зовнішній CSS включаючи Tailwind utilities. Для ShadowDom компонентів — @apply у component styles або CSS custom properties bridge.
**Common mistakes:** Думають Emulated "ізолює" Tailwind — ні. Або що ShadowDom ніколи не використовується — використовується для embedded widgets.

### [L2 — Mid] Як правильно стилізувати :host елемент і реалізувати динамічні host classes з Tailwind?
**Signal being tested:** Знання двох підходів (:host @apply vs HostBinding) і розуміння коли який використовувати.
**What the interviewer expects:** @apply у component CSS для :host, HostBinding для dynamic classes, комбінування обох.
**How to probe deeper:** "Яка різниця у specificity між :host { @apply ... } і Tailwind class у template?"
**Reference answer:** Два підходи: 1) `:host { @apply flex flex-col; }` — static host styles, PostCSS copies CSS properties у component stylesheet. 2) `@HostBinding('class') classes = 'flex flex-col'` — dynamic, runtime. Комбінування: :host для base static styles + `@HostBinding('class.is-active') active = false` для state-specific. Specificity: :host з Emulated має _nghost attribute selector = трохи вища specificity ніж просто Tailwind class.
**Common mistakes:** Намагаються класи в template на host — `class` attribute на host element shadows template. HostBinding string з усіма класами замість окремих bindings.

### [L3 — Senior] Чому динамічна конкатенація Tailwind class strings не працює в Angular і як правильно реалізувати dynamic Tailwind classes?
**Signal being tested:** Розуміння build-time nature Tailwind content scanning і практичні patterns для dynamic classes.
**What the interviewer expects:** Content scanning mechanism, чому конкатенація unsafe, literal string maps, safelist для API content.
**How to probe deeper:** "Як би ви вирішили задачу де CSS клас приходить з backend API і може бути будь-яким Tailwind класом?"
**Reference answer:** Tailwind content scanner — regex text search, не TypeScript parser. Конкатенація `'bg-' + color + '-500'` — scanner бачить три окремі рядки, не один клас. В production: клас не включений до CSS bundle. Правильні patterns: 1) Literal string maps: `const classes = { blue: 'bg-blue-500', red: 'bg-red-500' }`. 2) Computed signal з literal ternary. 3) Safelist у config для API-driven динамічних значень. Для API content: safelist pattern `{ pattern: /bg-(blue|red|green)-500/ }` — задокументований contract з backend.
**Common mistakes:** Конкатенація — classes зникають в production. Safelist `/.*/` — нейтралізує весь purge.

### [L4 — Staff/Principal] Як проектувати scalable Angular component library styled з Tailwind що підтримує theming, variants, і є maintainable для team?
**Signal being tested:** Architectural thinking про component API design, Tailwind integration at scale, design token strategy.
**What the interviewer expects:** Typed variant inputs, design token integration, @apply vs template classes strategy, visual regression testing.
**How to probe deeper:** "Як забезпечити що оновлення Tailwind config не сломає всі компоненти?"
**Reference answer:** Component library architecture з Tailwind: 1) Typed variant inputs (`ButtonVariant`, `ButtonSize`) — не expose raw className. 2) Static class maps як private constants — scanner-friendly, type-safe. 3) Design tokens в Tailwind theme: `colors: { primary: { 500: 'var(--color-primary)' } }` — components use `bg-primary-500`, не `bg-blue-500`. 4) @apply тільки для :host і pseudo-elements — решта в template. 5) Visual regression: Chromatic/Percy snapshot per variant. 6) Token change detection: якщо design token змінюється — automated screenshot diff. Tailwind config change safety net.
**Common mistakes:** Expose raw className — leaky abstraction. Hardcoded `bg-blue-500` замість `bg-primary-500` — не branded. Немає visual regression — refactoring небезпечний.

## Summary

### Key Points
- ViewEncapsulation.Emulated (default) не блокує Tailwind utilities — вони глобальні в styles.css
- ViewEncapsulation.ShadowDom ізолює від global Tailwind — потрібен @apply або CSS custom properties bridge
- Ніколи не конкатенуйте Tailwind class strings (`'bg-' + color`) — scanner не знайде, classes зникнуть в production
- Literal string maps у TypeScript: `{ primary: 'bg-blue-500' }` — scanner знаходить literal strings у .ts файлах
- @apply у component styles копіює CSS properties, не додає class до DOM — специфічне для :host і pseudo-elements
- HostBinding('class') для dynamic host classes, :host { @apply } для static host base styles
- Design tokens через custom Tailwind colors (`bg-primary-500`) замість hardcoded values (`bg-blue-500`)

### Elevator Pitch (2 minutes)
"Tailwind у Angular компонентах — переважно пряме використання utility classes в template. ViewEncapsulation.Emulated (default) не перешкоджає — Tailwind utilities глобальні. Головна gotcha: динамічна конкатенація class strings несумісна з Tailwind content scanning — scanner шукає literal strings. Патерн: static class maps як TypeScript constants де кожне значення — повний literal string. Для :host і pseudo-elements — @apply у component styles. Для dynamic host classes — @HostBinding. В production бібліотеці компонентів: typed variant inputs замість raw className exposure, custom Tailwind colors через design tokens."
