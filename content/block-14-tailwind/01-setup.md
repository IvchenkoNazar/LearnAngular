---
title: "Tailwind CSS Setup in Angular"
block: 14
topic: 1
slug: "tailwind-setup"
difficulty: 2
sinceVersion: "11.2"
tags: ["tailwindcss", "postcss", "configuration", "JIT", "purge"]
relatedTopics: ["tailwind-angular-components", "material-tailwind-together", "component-driven-approach"]
interviewQuestions:
  - level: "junior"
    question: "Як додати Tailwind CSS до Angular-проєкту? Які кроки потрібні?"
    referenceAnswers:
      junior: "Потрібно встановити tailwindcss через npm і запустити npx tailwindcss init. Потім додати Tailwind directives (@tailwind base, components, utilities) в styles.css."
      mid: "Angular CLI з версії 11.2 підтримує Tailwind нативно. Після npm install -D tailwindcss postcss autoprefixer та npx tailwindcss init, потрібно налаштувати content paths в tailwind.config.js для template scanning, і додати @tailwind directives в глобальний styles.css. Angular CLI автоматично інтегрує PostCSS pipeline."
      senior: "Angular CLI детектить tailwind.config.js і автоматично додає PostCSS plugin в webpack/esbuild pipeline. Важливо правильно налаштувати content array — він визначає які файли Tailwind сканує для purge. Для monorepo з Nx потрібно включити paths до shared libraries. JIT mode (default з Tailwind v3) генерує CSS on-demand, що радикально зменшує dev build size. В production, unused classes автоматично видаляються. Типова помилка — забути додати paths до component HTML і TS файлів (для class bindings)."
      staff: "Tailwind integration в Angular — це PostCSS pipeline configuration. Angular CLI використовує або webpack з postcss-loader, або esbuild з вбудованим PostCSS support (application builder з v17+). Для enterprise: 1) Tailwind config як shared preset в monorepo — єдиний source of truth для design tokens. 2) Content paths повинні покривати всі libraries в dependency graph. 3) JIT vs AOT purge — в dev JIT генерує лише використані класи, в prod tree-shaking видаляє решту. 4) CSS budget — Tailwind без purge може генерувати 3MB+ CSS, з purge — 10-30KB. 5) Для SSR — Tailwind CSS повністю static, проблем з hydration немає. 6) CI pipeline — перевіряйте що content paths актуальні при додаванні нових libraries."
    commonMistakes:
      - "Забувають налаштувати content paths — CSS не генерується для template classes"
      - "Встановлюють Tailwind без PostCSS і Autoprefixer"
    relatedQuestions: ["b14t1q2", "b14t2q1"]
  - level: "mid"
    question: "Як працює purge (content scanning) в Tailwind CSS і чому це критично для production?"
    referenceAnswers:
      junior: "Purge видаляє невикористані CSS класи для зменшення розміру файлу."
      mid: "Tailwind генерує CSS лише для класів знайдених у файлах вказаних в content масиві tailwind.config.js. Він сканує файли як plain text, шукаючи потенційні class names. В production це критично, бо повний Tailwind CSS — кілька мегабайт, а після purge — 10-30KB. Тому динамічна генерація class names (string concatenation) не працює."
      senior: "Content scanning працює через regex-based extraction — Tailwind не парсить HTML чи TypeScript AST, а шукає потенційні class tokens у файлах. Це означає: 1) Динамічні класи типу `bg-${color}-500` не будуть знайдені — потрібно використовувати safelist або повні class names. 2) Classes в JS/TS files (class bindings) теж потрібно покривати в content. 3) Для Angular — template literal strings в component .ts файлах потребують включення '**/*.ts' в content. PurgeCSS під капотом використовує conservative extraction — краще залишити зайве, ніж видалити потрібне."
      staff: "Purge mechanism — це compile-time static analysis з inherent limitations. Архітектурні рішення: 1) safelist для dynamic classes з API/CMS — задокументувати contract між backend і frontend. 2) Monorepo content strategy — shared tailwind preset з content paths що автоматично розширюються при додаванні libraries. 3) CSS budget monitoring — відстежувати розмір згенерованого CSS в CI (Angular budgets configuration). 4) Multi-theme support — кожна тема збільшує CSS output, потрібна стратегія lazy-loading theme CSS. 5) Design system library — published library повинна або включати compiled CSS, або документувати required Tailwind config. 6) Для micro-frontends — кожен MFE може мати свій Tailwind scope з prefix option для уникнення конфліктів."
    commonMistakes:
      - "Конкатенують class names динамічно і дивуються чому стилі зникають в production"
      - "Не включають .ts файли в content — класи з class bindings губляться"
      - "Не моніторять CSS bundle size — можуть потрапити duplicate Tailwind styles"
    relatedQuestions: ["b14t1q1", "b14t1q3"]
  - level: "senior"
    question: "Як налаштувати Tailwind CSS в Angular monorepo з Nx? Які типові проблеми виникають?"
    referenceAnswers:
      junior: "В monorepo потрібно мати tailwind.config.js в кожному проєкті або один спільний."
      mid: "В Nx monorepo є два підходи: per-project config або shared preset. Nx має спеціальний generator для Tailwind setup. Потрібно правильно налаштувати content paths щоб включити shared libraries."
      senior: "Nx підтримує Tailwind через @nx/angular:setup-tailwind generator. Підходи: 1) Per-app config з shared preset — кожен app має tailwind.config.js що extends shared preset з design tokens. 2) Content paths — потрібно включити node_modules або library source paths для shared components. 3) Library building — якщо library publishable, Tailwind classes повинні або компілюватись в library CSS, або споживач повинен включити library в свій content. Типові проблеми: classes з library не потрапляють в purge, різні versions Tailwind в apps, conflicting theme configurations між apps."
      staff: "Monorepo Tailwind architecture: 1) Shared preset package (@org/tailwind-config) — single source of truth для design tokens, colors, typography, spacing. Versions controlled через package.json. 2) Content resolution strategy — використовувати Nx project graph для автоматичного визначення content paths на основі dependency graph. 3) Build caching — Tailwind output детерміністичний для однакових inputs, Nx computation cache прискорює rebuilds. 4) Library strategy — buildable libraries компілюють CSS окремо (publishable), non-buildable використовують app-level Tailwind pipeline. 5) Migration strategy для existing monorepo — поступове впровадження по feature domains, coexistence з existing CSS framework. 6) Testing — visual regression tests для перевірки що Tailwind classes рендеряться правильно після config changes."
    commonMistakes:
      - "Використовують абсолютні paths в content замість relative — ламається при зміні workspace root"
      - "Не враховують buildable vs non-buildable library різницю"
    relatedQuestions: ["b14t1q2", "b15t2q1"]
  - level: "mid"
    question: "Що таке JIT mode в Tailwind CSS і як він впливає на developer experience?"
    referenceAnswers:
      junior: "JIT mode генерує CSS на льоту замість генерації всього CSS наперед."
      mid: "JIT (Just-In-Time) став default з Tailwind v3. Він генерує лише CSS для класів, що реально використовуються, на льоту під час розробки. Це дає: 1) Швидший dev server start. 2) Менший CSS bundle навіть в development. 3) Підтримку arbitrary values як bg-[#1da1f2]. 4) Всі variants доступні без конфігурації."
      senior: "JIT engine кардинально змінив архітектуру Tailwind. До v3 — генерувались всі можливі utility classes (мегабайти CSS), purge видаляв зайве в production. З JIT — CSS генерується incremental при зміні файлів. Це дозволило: arbitrary values (w-[calc(100%-2rem)]), arbitrary variants, і будь-яку комбінацію modifiers без попередньої конфігурації. В Angular context — HMR працює швидше бо Tailwind regenerates лише змінені utilities. Caveat: JIT потребує file watcher — в CI/CD де нема watch mode, використовується one-shot generation."
      staff: "JIT mode — це фундаментальна зміна від 'generate all, remove unused' до 'generate only used'. Це вплинуло на: 1) DX — arbitrary values зменшують потребу в custom theme extensions. 2) Performance — dev builds на 90% менше CSS. 3) Architecture — можна створювати utility patterns що раніше вимагали б тисячі pre-generated classes. 4) CI/CD — build time зменшився бо нема overhead від purge post-processing. 5) Testing — CSS output стабільніший між environments (dev = prod minus source maps). В Angular esbuild pipeline JIT інтегрується через PostCSS plugin що викликається при кожній template зміні. Для design system — JIT дозволяє theme customization через CSS variables без regeneration всього stylesheet."
    commonMistakes:
      - "Думають що JIT — це runtime CSS generation (як CSS-in-JS) — насправді це build-time"
      - "Не розуміють що arbitrary values працюють лише з JIT (default з v3)"
    relatedQuestions: ["b14t1q1", "b14t1q2"]
  - level: "staff"
    question: "Як би ви спроєктували Tailwind CSS infrastructure для enterprise Angular platform з десятками додатків?"
    referenceAnswers:
      junior: "Потрібно мати спільну конфігурацію Tailwind для всіх додатків."
      mid: "Створити shared Tailwind preset з design tokens і розшарити між додатками. Використовувати monorepo для управління конфігурацією. Мати спільні компоненти з Tailwind стилями."
      senior: "Enterprise Tailwind strategy: 1) @org/tailwind-preset — npm package з theme, plugins, custom utilities. 2) Per-app override можливість для brand variations. 3) Design tokens в Tailwind theme що синхронізовані з Figma через token pipeline. 4) Shared component library з Tailwind classes — consumers extend preset. 5) CSS budget enforcement в CI. 6) Migration guide для teams переходящих з іншого CSS framework."
      staff: "Enterprise CSS infrastructure: 1) Token pipeline: Figma → Style Dictionary → Tailwind theme config → CSS custom properties. Automated sync через CI. 2) Tailwind preset hierarchy: base preset (tokens) → domain presets (e-commerce, admin) → app configs. Versioned via semver, breaking changes announced. 3) Component library: CDK-based components styled with Tailwind, published with both compiled CSS (for non-Tailwind consumers) and source classes (for Tailwind consumers via content paths). 4) Performance budget: per-app CSS budget in angular.json, enforced in CI, dashboard for trend monitoring. 5) Consistency enforcement: ESLint plugin для Tailwind class ordering, custom plugin для banned utilities (direct color values instead of theme tokens). 6) Migration strategy: CSS Modules coexistence during transition, automated codemod for common patterns. 7) SSR considerations: Tailwind CSS is static — no hydration issues, but critical CSS extraction потребує inline Tailwind utilities above the fold. 8) Multi-brand: CSS custom properties for runtime theme switching, Tailwind generates utility classes for each brand variation."
    commonMistakes:
      - "Не версіонують shared preset — breaking changes ламають всі apps одночасно"
      - "Ігнорують token pipeline — дизайнери і розробники працюють з різними значеннями"
      - "Не мають CSS budget — bundle size зростає непомітно"
    relatedQuestions: ["b14t1q3", "b15t4q1"]
---

## Core Concept

**English definition:** Tailwind CSS setup in Angular involves installing the Tailwind CSS framework, configuring PostCSS integration, defining content paths for class scanning, and customizing the theme to match your design system.

**Пояснення:** Tailwind CSS — це utility-first CSS framework, що дозволяє стилізувати компоненти через композицію маленьких utility класів (flex, pt-4, text-center) безпосередньо в HTML templates. Інтеграція з Angular відбувається через PostCSS pipeline, який Angular CLI підтримує нативно з версії 11.2.

**Яку проблему вирішує:** Традиційний CSS/SCSS для великих Angular проєктів стає некерованим — naming conventions (BEM), CSS specificity wars, dead CSS accumulation. Tailwind усуває ці проблеми: utility classes мають чітку семантику, нема naming, purge автоматично видаляє невикористане. Це особливо цінно для команд де багато розробників одночасно працюють з UI.

**Як працює під капотом:**

Angular CLI інтегрує Tailwind через PostCSS pipeline:

1. При `ng serve` / `ng build` Angular CLI детектить `tailwind.config.js` в root проєкту
2. PostCSS plugin додається автоматично в build pipeline (webpack postcss-loader або esbuild PostCSS)
3. `@tailwind base/components/utilities` directives в `styles.css` замінюються на реальний CSS
4. Content scanning аналізує файли вказані в `content` array і генерує CSS лише для знайдених class tokens
5. В production — CSS мінімізується, unused classes вже відсутні завдяки JIT

```typescript
// tailwind.config.js — базова конфігурація для Angular
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",  // templates і component class bindings
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',  // інтеграція з CSS custom properties
      },
    },
  },
  plugins: [],
};
```

**Trade-offs та обмеження:**

- Verbose HTML — шаблони з десятками utility classes важко читати; рішення: `@apply` або component extraction
- Learning curve — команда повинна знати Tailwind utility naming convention
- Dynamic classes не працюють з purge — потрібні safelist або повні class names
- Не замінює CSS повністю — animations, complex selectors, pseudo-elements потребують custom CSS
- ViewEncapsulation.Emulated не впливає на Tailwind (глобальні стилі), але @apply в component styles працює

**Версійність:**
- Angular 11.2+: нативна підтримка Tailwind CSS через PostCSS
- Angular 17+: esbuild application builder з покращеною PostCSS інтеграцією
- Tailwind CSS v3 (2021): JIT mode за замовчуванням, arbitrary values
- Tailwind CSS v4 (2025): новий engine на Rust (Oxide), CSS-first configuration, значні performance покращення

## Deep Details

### Edge Cases

- **ViewEncapsulation і Tailwind:** Tailwind utility classes — глобальні (в `styles.css`). Якщо використовуєте `@apply` в component `.css` — воно працює, бо PostCSS обробляє component styles окремо. Але `@apply` в component styles з `ViewEncapsulation.ShadowDom` — не працюватиме, бо Shadow DOM ізолює стилі.
- **SSR і Tailwind:** Tailwind генерує static CSS — проблем з SSR/hydration немає. Але критичний CSS для above-the-fold контенту потребує inline стилів, що конфліктує з CSP без `style-src 'unsafe-inline'`.
- **Tailwind v4 migration:** Tailwind v4 використовує CSS-first конфігурацію (`@theme` директива в CSS) замість JavaScript config. Angular CLI підтримка потребує перевірки сумісності PostCSS plugin.
- **HMR з Tailwind:** При зміні template, Tailwind JIT regenerates CSS. Якщо зміна в shared config — весь CSS перебудовується. У великих проєктах це може сповільнити HMR.

### Junior vs Senior Understanding

**Junior** знає: встановити Tailwind, додати directives в styles.css, використовувати utility classes.

**Senior** розуміє: Tailwind — це build-time CSS generation через PostCSS pipeline. Senior знає:
- Як працює content scanning і чому динамічні класи не працюють
- Різницю між JIT generation (dev) і production output
- Як налаштувати shared presets для monorepo
- Trade-offs `@apply` vs utility classes vs component extraction
- Як інтегрувати design tokens з Tailwind theme
- Performance implications: CSS budget monitoring, critical CSS extraction для SSR
- Tailwind v4 migration path і CSS-first конфігурацію

### Deprecation & Migration Path

- **Tailwind v2 → v3:** JIT став default, `purge` ключ замінено на `content`, `mode: 'jit'` більше не потрібен
- **Tailwind v3 → v4:** JavaScript config замінюється CSS-first конфігурацією з `@theme`. Tailwind надає `@tailwindcss/upgrade` codemod. PostCSS plugin змінився — перевіряйте Angular CLI сумісність
- **Angular build system:** Webpack → esbuild migration (v17+) не впливає на Tailwind конфігурацію, але змінює internal PostCSS pipeline

### Connections to Other Concepts

- **Angular Material:** Tailwind і Material можуть співіснувати, але потрібна стратегія CSS specificity — див. [material-tailwind-together](/topics/material-tailwind-together)
- **Component styles:** `@apply` в component styles працює з ViewEncapsulation.Emulated — див. [component-driven-approach](/topics/component-driven-approach)
- **Design systems:** Tailwind theme — основа для design tokens — див. [design-system](/topics/design-system)
- **SSR:** Tailwind CSS є повністю static, що спрощує SSR — див. [angular-universal](/topics/angular-universal)

## Examples

### Basic Usage

```typescript
// 1. Install: npm install -D tailwindcss postcss autoprefixer
// 2. Init: npx tailwindcss init

// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

// src/styles.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```html
<!-- app.component.html — базове використання utility classes -->
<div class="min-h-screen bg-gray-100 flex items-center justify-center">
  <div class="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
    <h1 class="text-2xl font-bold text-gray-900 mb-4">Welcome</h1>
    <p class="text-gray-600 leading-relaxed">
      Tailwind CSS з Angular — utility-first підхід до стилізації.
    </p>
    <button class="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md
                    hover:bg-blue-700 transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
      Get Started
    </button>
  </div>
</div>
```

### Production Scenario

```typescript
// tailwind.config.js — enterprise конфігурація з shared preset
const sharedPreset = require('@org/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedPreset],  // design tokens, custom plugins від design team
  content: [
    "./src/**/*.{html,ts}",
    // Shared library components
    "./node_modules/@org/ui-components/src/**/*.{html,ts}",
    // Safelist для dynamic CMS content
  ],
  safelist: [
    // CMS може повертати ці класи для banner backgrounds
    { pattern: /bg-(red|green|blue|yellow)-(100|200|500)/ },
  ],
  theme: {
    extend: {
      // App-specific overrides
      fontFamily: {
        sans: ['Inter var', ...sharedPreset.theme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),       // form reset styles
    require('@tailwindcss/typography'),   // prose класи для CMS content
  ],
};
```

```typescript
// angular.json — CSS budget для моніторингу bundle size
{
  "budgets": [
    {
      "type": "anyComponentStyle",
      "maximumWarning": "6kb",
      "maximumError": "10kb"
    },
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    }
  ]
}
```

### Anti-Example

```typescript
// WRONG: Динамічна генерація class names — purge не знайде ці класи!
@Component({
  template: `<div [class]="'bg-' + color + '-500'">...</div>`
})
export class BadComponent {
  color = 'blue'; // 'bg-blue-500' не буде в production CSS!
}

// CORRECT: Використовуйте повні class names
@Component({
  template: `
    <div [ngClass]="{
      'bg-blue-500': color === 'blue',
      'bg-red-500': color === 'red',
      'bg-green-500': color === 'green'
    }">...</div>
  `
})
export class GoodComponent {
  color = 'blue'; // Всі три класи знайдуться при content scanning
}

// ALSO CORRECT: Tailwind safelist для дійсно динамічних значень
// tailwind.config.js
module.exports = {
  safelist: [
    { pattern: /bg-(blue|red|green)-500/ },
  ],
};
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Динамічна конкатенація class names (`'bg-' + color + '-500'`) | Tailwind content scanner не знайде ці класи — зникнуть в production | Використовуйте повні class names з ngClass або safelist в config |
| Tailwind без content paths до library source | Shared component classes не потрапляють в production CSS | Включіть library paths в content array tailwind.config.js |
| `@apply` для кожного utility | Втрачає переваги utility-first — повертає до semantic CSS з гіршим DX | Використовуйте `@apply` лише для повторюваних patterns (btn, card) |
| Один глобальний tailwind.config без preset hierarchy | В monorepo з різними додатками — неможливо кастомізувати per-app | Shared preset + per-app extends для override |
| Відсутність CSS budget monitoring | Bundle size зростає непомітно, особливо з safelist patterns | Налаштуйте budgets в angular.json і CI checks |

## Interview Block

### [L1 — Warm-up] Як додати Tailwind CSS до Angular проєкту? Які мінімальні кроки?
**Signal being tested:** Чи має кандидат практичний досвід інтеграції Tailwind з Angular, чи лише теоретичні знання.
**What the interviewer expects:** Конкретні кроки: install, init, content paths, directives. Розуміння що Angular CLI підтримує Tailwind нативно.
**How to probe deeper:** "Що станеться якщо забути налаштувати content paths?"
**Reference answer:** Три кроки: 1) `npm install -D tailwindcss postcss autoprefixer` + `npx tailwindcss init`. 2) Налаштувати `content: ["./src/**/*.{html,ts}"]` в tailwind.config.js. 3) Додати `@tailwind base; @tailwind components; @tailwind utilities;` в src/styles.css. Angular CLI автоматично детектить tailwind.config.js і інтегрує PostCSS pipeline — додаткова конфігурація webpack/esbuild не потрібна.
**Common mistakes:** Забувають content paths — все працює в dev (JIT генерує все), але classes зникають в production. Намагаються вручну налаштувати PostCSS в Angular, хоча CLI робить це автоматично.

### [L2 — Mid] Як працює Tailwind content scanning і чому динамічні класи не працюють?
**Signal being tested:** Розуміння build-time nature Tailwind і його обмежень, вміння працювати з обмеженнями.
**What the interviewer expects:** Пояснення regex-based token extraction, приклади що працює і не працює, рішення (safelist, повні class names).
**How to probe deeper:** "Як би ви вирішили проблему динамічних стилів з CMS, де backend повертає назви кольорів?"
**Reference answer:** Tailwind сканує файли як plain text через regex, шукаючи потенційні class tokens. Він не парсить HTML/TS AST, тому `'bg-' + color + '-500'` не буде знайдено — Tailwind бачить лише рядки 'bg-', color, '-500' окремо. Рішення: 1) Використовувати повні class names з ngClass/object map. 2) safelist в config для patterns що приходять від API. 3) Arbitrary values для one-off значень: `bg-[var(--cms-color)]`.
**Common mistakes:** Думають що Tailwind аналізує runtime DOM — насправді це build-time text scanning. Не розуміють різницю між dev (все працює через JIT) і production (classes зникають).

### [L3 — Senior] Як налаштувати Tailwind CSS infrastructure для Angular monorepo?
**Signal being tested:** Архітектурне мислення, досвід з monorepo tooling, розуміння build pipeline.
**What the interviewer expects:** Стратегія shared preset, content paths resolution для libraries, build caching, per-app customization.
**How to probe deeper:** "Як ви вирішите проблему коли publishable library використовує Tailwind classes, але consumer може не мати Tailwind?"
**Reference answer:** Monorepo Tailwind strategy: 1) Shared preset package з design tokens, colors, typography — версіонований через package.json. 2) Per-app tailwind.config.js що extends preset і може override theme. 3) Content paths включають source paths shared libraries: `"../../libs/ui/src/**/*.{html,ts}"`. 4) Для buildable/publishable libraries — два підходи: a) compile Tailwind до CSS і publish разом з library, b) export source + preset, consumer інтегрує через content paths. 5) Nx computation cache — Tailwind output детерміністичний, кешується правильно. Проблеми: stale content paths при додаванні нових libs, CSS duplication якщо кілька apps включають одну library.
**Common mistakes:** Один tailwind.config.js на всі apps без preset hierarchy. Хардкодять абсолютні paths замість relative. Не враховують publishable vs non-buildable library різницю.

### [L4 — Staff/Principal] Спроєктуйте CSS infrastructure для enterprise Angular platform з десятками додатків, migration з existing CSS framework, і design system integration.
**Signal being tested:** System-level architectural thinking, migration strategy, organizational impact, cross-team coordination.
**What the interviewer expects:** Повна стратегія включаючи token pipeline, migration plan, team enablement, monitoring.
**How to probe deeper:** "Як ви забезпечите consistency між Figma designs і Tailwind implementation?"
**Reference answer:** Повна CSS infrastructure: 1) Token pipeline: Figma (design source) → Style Dictionary (token transform) → Tailwind theme config + CSS custom properties. Automated sync через CI — дизайнер пушить tokens, pipeline генерує updated Tailwind preset. 2) Preset hierarchy: base (tokens) → domain (e-commerce, admin) → app. Versioned via semver з CHANGELOG. 3) Migration strategy: CSS Modules coexistence — поступово замінюємо component styles, automated codemod для common patterns (margin, padding, flex). Phase: pilot team → shared components → feature teams. 4) Component library: CDK-based, styled з Tailwind, published з compiled CSS (для non-Tailwind consumers) і source (для Tailwind consumers). 5) Enforcement: ESLint plugin для Tailwind class ordering, custom ESLint rule для banned raw CSS values (must use theme tokens). 6) Monitoring: CSS budget в CI, Lighthouse CI для performance regression, bundle analyzer dashboard.
**Common mistakes:** Не версіонують shared preset — breaking changes ламають всі apps. Немає token pipeline — дизайнери і девелопери працюють з різними значеннями. Big bang migration замість поступової — команди паралізовані.

## Summary

### Key Points
- Angular CLI нативно підтримує Tailwind CSS з версії 11.2 — просто додайте tailwind.config.js і PostCSS інтегрується автоматично
- Content paths визначають які файли сканує Tailwind — забудете `.ts` файли і class bindings зникнуть в production
- JIT mode (default з v3) генерує CSS on-demand — драматично менший CSS в development і production
- Динамічна конкатенація class names не працює з content scanning — використовуйте повні class names або safelist
- В monorepo — shared preset з design tokens як єдиний source of truth, per-app config для overrides
- CSS budget monitoring критичний для enterprise — без нього bundle size зростає непомітно
- Tailwind v4 переходить на CSS-first конфігурацію — плануйте migration path

### Elevator Pitch (2 minutes)
"Tailwind CSS в Angular інтегрується нативно через PostCSS pipeline — CLI детектить tailwind.config.js автоматично. Ключове розуміння: Tailwind — це build-time tool, не runtime. Content scanning шукає class tokens в файлах як plain text, тому динамічна генерація class names не працює — потрібні повні class names або safelist. В enterprise монорепозиторіях правильна стратегія — shared preset з design tokens як npm package, per-app config для overrides, і CSS budget monitoring в CI. З Tailwind v3 JIT mode — default, що дає менший CSS bundle і підтримку arbitrary values. Для команд що мігрують з existing CSS framework — поступова migration з coexistence period, автоматизація через codemods, і enforcement через ESLint."
