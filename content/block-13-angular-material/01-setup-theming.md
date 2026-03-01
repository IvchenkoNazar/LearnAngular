---
title: "Angular Material Setup & Custom Theming"
block: 13
topic: 1
slug: "setup-theming"
difficulty: 3
sinceVersion: "2"
tags: ["Angular Material", "Material 3", "theming", "custom theme", "CSS variables", "mat-theme", "color system"]
relatedTopics: ["key-components", "cdk", "tailwind-setup", "material-tailwind-together"]
interviewQuestions:
  - level: "junior"
    question: "Як додати Angular Material до проєкту і що відбувається під час ng add @angular/material?"
    referenceAnswers:
      junior: "Треба запустити ng add @angular/material. Ця команда встановлює пакети, додає HammerJS якщо потрібно, налаштовує animations та імпортує теми в styles."
      mid: "ng add @angular/material виконує schematic: 1) встановлює @angular/material, @angular/cdk, @angular/animations. 2) Запитує про тему (prebuilt або custom). 3) Додає BrowserAnimationsModule або provideAnimationsAsync() в app config. 4) Додає Roboto font і Material Icons у index.html. 5) Додає базові стилі в styles. З Angular 17+ standalone schematics — provideAnimationsAsync() замість NgModule."
      senior: "ng add schematic виконує серію трансформацій: 1) package.json update через installPackage. 2) app.config.ts або app.module.ts — додає provideAnimationsAsync() (lazy animations bundle). 3) index.html — font preload для Roboto, Material Icons CDN або self-hosted. 4) styles.(css|scss) — @import prebuilt theme або генерує custom theme scaffold з @use sass. 5) Вибір теми визначає чи додається m2_define_theme або m3_define_theme SASS mixin. Важливо: з Material 3 (v17+) custom theme через CSS custom properties — runtime theme switching без rebuild."
      staff: "ng add є entry point для architecture decision: 1) Prebuilt theme — нульова кастомізація, швидкий старт, не масштабується для brand. 2) Custom M2 theme — SASS compile-time generation, окремі bundle per theme, no runtime switching без CSS vars overhead. 3) Custom M3 theme — CSS custom properties generation, runtime switching, але більший CSS footprint через ~1000 CSS variables. 4) Enterprise: комбінація M3 + CSS variables + light/dark переключення без rebuild — стандарт з 2024. 5) Схема перевіряє наявність існуючих setup — idempotent. 6) Migration path: якщо вже Material 14-16 (M2), ng update + migration schematic для M3 — але breaking changes в component API потребують manual review."
    commonMistakes:
      - "Додають BrowserAnimationsModule замість provideAnimationsAsync() — синхронно завантажує більший animations bundle"
      - "Використовують prebuilt theme для production продукту — неможливо кастомізувати під brand"
      - "Не розуміють різницю між Material 2 і Material 3 theming API"
    relatedQuestions: ["b13t1q2", "b13t1q3"]
  - level: "mid"
    question: "Як створити custom Angular Material theme з Material 3 і що таке color system в M3?"
    referenceAnswers:
      junior: "Треба створити SASS файл, використати mat.define-theme() і передати кольори. Потім включити тему в styles."
      mid: "Material 3 theming через SASS: `@use '@angular/material' as mat`. Викликати `mat.define-theme()` з color, typography, density конфігурацією. Застосувати через `mat.all-component-themes($theme)` або selectively. M3 color system: primary, secondary, tertiary, error palettes — кожна генерує 12+ tonal variants (10, 20, 30...90, 95, 99)."
      senior: "M3 theming internals: 1) `mat.define-theme()` приймає `$color: (primary: mat.$violet-palette, tertiary: mat.$orange-palette)`. 2) Color system генерує tonal palettes через HCT color space (перцептивно рівномірний). 3) Roles: primary, on-primary, primary-container, on-primary-container і так для secondary, tertiary, error. 4) CSS variables: `mat.theme-overrides()` генерує CSS custom properties для кожного role. 5) Light/dark: два `mat.define-theme()` з різними палітрами або один з color-scheme media query. 6) `mat.all-component-themes` vs `mat.all-component-colors` + `mat.all-component-typographies` — розділення для оптимізації."
      staff: "M3 theming architecture decision: 1) CSS variables approach (рекомендований для M3): генерується ~1000 CSS custom properties через `mat.theme-overrides()`. Runtime switching через `.dark-theme { --mat-... }` overrides. 2) Static SASS approach: кожна тема генерує повний CSS — більший bundle, але немає runtime overhead. 3) HCT color space: Hue-Chroma-Tone від Google — перцептивно рівномірний, accessibility-aware (contrast ratios). Заміна HSL що ламає на крайніх тонах. 4) Material Design Tokens Synchronization: Figma → Material Theme Builder → exported CSS tokens → Angular theme config. Automated via CI для design-dev sync. 5) Multi-theme enterprise: CSS variables scope через host context (`.theme-brand-a`, `.theme-brand-b`), component-level theming через nested mat.define-theme. 6) Performance: `mat.all-component-themes()` генерує CSS для всіх ~50 компонентів — lazy load per module де можливо через `mat.[component]-theme()`."
    commonMistakes:
      - "Використовують M2 API (mat-palette, mat-light-theme) в новому проєкті замість M3"
      - "Застосовують all-component-themes глобально замість per-component для зменшення bundle"
      - "Не розуміють різницю між color roles (primary, on-primary, primary-container) і як вони використовуються компонентами"
    relatedQuestions: ["b13t1q1", "b13t1q3", "b13t1q4"]
  - level: "mid"
    question: "Як реалізувати light/dark theme toggle в Angular Material без перезавантаження сторінки?"
    referenceAnswers:
      junior: "Можна мати два CSS класи для світлої і темної теми і перемикати їх через Angular."
      mid: "З Material 3 і CSS variables: 1) Визначити тему з `mat.theme-overrides($light-theme)` на `:root` і `mat.theme-overrides($dark-theme)` на `.dark-mode`. 2) ThemeService toggles document.body classList. 3) Зберігати preference в localStorage. 4) Також враховувати `prefers-color-scheme` media query для системного preference."
      senior: "Повна реалізація: 1) SASS: `:root { @include mat.theme-overrides($light-theme); } .dark { @include mat.theme-overrides($dark-theme); }` — генерує CSS custom properties для кожного theme role. 2) ThemeService: `signal<'light' | 'dark'>` + effect що додає/видаляє клас на document.body. 3) FOUT prevention: inline script в <head> читає localStorage і додає клас до рендерингу Angular. 4) SSR: TransferState передає theme preference для consistent server/client render. 5) color-scheme meta tag: `<meta name='color-scheme' content='light dark'>` для browser chrome (scrollbars, form controls). 6) CSS: `color-scheme: light dark` на :root — browser нативно адаптує."
      staff: "Light/dark theming enterprise strategy: 1) CSS variables runtime switching — нульовий JS overhead для theme switch (лише клас на body). 2) FOUT/FOUC prevention критичний для UX: inline blocking script у <head> читає localStorage/cookie перед Angular bootstrap. Server-rendered apps: HTTP cookie для theme preference, SSR рендерить правильну тему. 3) Component-level theming: деякі компоненти можуть overriding theme locally через `color-scheme` чи custom CSS vars. 4) Testing: visual regression tests для обох тем через Playwright/Cypress з dark mode emulation. 5) Token pipeline: Figma має light/dark variants, Material Theme Builder генерує обидва набори токенів. 6) Accessibility: автоматично перевіряти contrast ratios для обох тем через CI axe-core integration."
    commonMistakes:
      - "Зберігають повний CSS для обох тем замість CSS variables override — подвоює CSS bundle"
      - "Не додають FOUT prevention — тема 'мигає' під час Angular bootstrap"
      - "Ігнорують prefers-color-scheme — не поважають системні налаштування користувача"
    relatedQuestions: ["b13t1q2", "b13t1q4"]
  - level: "senior"
    question: "Як кастомізувати типографію та density в Angular Material theme? Коли density configuration критична?"
    referenceAnswers:
      junior: "В mat.define-theme можна передати typography і density параметри для зміни шрифтів і розмірів компонентів."
      mid: "Typography: `mat.define-theme($typography: (plain-family: 'Roboto', brand-family: 'Google Sans'))`. Density: `mat.define-theme($density: (scale: -2))` де scale від 0 (default) до -5. Density -1 і -2 зменшують розмір компонентів без порушення accessibility, -3 і нижче — для compact UIs де users є advanced."
      senior: "Typography internals: M3 визначає typescale з 15 roles (display-large до body-small). mat.define-theme приймає brand-family (headlines), plain-family (body), bold-weight, medium-weight, regular-weight. CSS variables: `--mat-sys-display-large-font`, `--mat-sys-body-medium-line-height` тощо. Density критична для: data-dense tables/forms (admin panels), compact toolbars, mobile-optimized inputs. mat.$minimum-density і mat.$maximum-density — бажані bounds. При density < -3 Angular Material warns про accessibility. Per-component density: `mat.button-density($theme, -1)` замість global."
      staff: "Typography і density як design system decisions: 1) Typography: brand fonts через @font-face з font-display: swap, variable fonts для performance. Font subsetting для non-Latin characters. 2) Density scale: enterprise admin UI зазвичай density -1 або -2 для інформаційної щільності. Consumer apps — density 0 (default) для touchability. 3) Per-component density дозволяє mixed density: dense tables (density -2) з comfortable buttons (density 0). 4) Responsive density: media query для зміни density на touch devices — CSS variables дозволяють це без SASS re-compilation. 5) Accessibility audit: density < -2 потребує manual axe-core перевірки — WCAG 2.5.5 target size minimum 44x44px. 6) Custom font loading strategy: font preload в index.html, font-display: optional для above-the-fold critical text."
    commonMistakes:
      - "Використовують global density -3 або нижче без accessibility аудиту"
      - "Не знають про per-component density — застосовують однаковий density скрізь"
      - "Завантажують Roboto через Google Fonts CDN в production без self-hosting — зовнішній SPOF"
    relatedQuestions: ["b13t1q2", "b13t1q3"]
  - level: "staff"
    question: "Як спроєктувати Angular Material theming infrastructure для enterprise з підтримкою кількох брендів і M2-to-M3 migration?"
    referenceAnswers:
      junior: "Потрібно мати окремий файл теми для кожного бренду і підключати потрібний."
      mid: "Для кількох брендів: CSS variables approach з body class scope. M3 migration: ng update @angular/material з migration schematic. Але M2 і M3 API дуже різні, потрібен поступовий підхід."
      senior: "Multi-brand: 1) Shared SASS partials з mat.define-theme per brand. 2) CSS variables generation через mat.theme-overrides($brand-theme) під .brand-a { } scope. 3) ThemeService з brand: 'brand-a' | 'brand-b' state. 4) Lazy load brand CSS якщо бренди великі та рідко перемикаються. M2→M3 migration: 1) ng update @angular/material@18 — migration schematic автоматизує ~70%. 2) Ручне оновлення: mat-color() → CSS variables, матеріал icons API. 3) Breaking changes: MatButton, MatFormField змінили API. 4) Staging approach: один routing module за раз."
      staff: "Enterprise theming architecture: 1) Token pipeline: Figma Material Theme Builder → exported JSON tokens → Style Dictionary → generates SASS vars + CSS custom properties + Tailwind theme config. Single source of truth. Automated sync через CI при merge Figma tokens. 2) Theme as npm package: `@org/brand-theme` — versioned, changelog, major version for breaking changes. Apps extend base theme. 3) Multi-brand lazy loading: base CSS в critical path, brand overrides lazy-loaded. CSS custom properties override base theme without re-render. 4) M2→M3 migration strategy: a) Feature flags для поступового rollout по feature domains. b) Component-by-component migration замість big bang. c) Visual regression baseline до migration, diff після кожного компонента. d) API breaking changes inventory: MatLegacy* prefixes для M2 during transition period. e) Performance benchmark before/after: M3 CSS variables vs M2 SASS compile-time — M3 може бути повільнішим на low-end devices через CSS variable cascading. 5) Governance: design system team owns theme package, teams contribute via PR process, token changes go through design review."
    commonMistakes:
      - "Big bang M2→M3 migration замість поступової — занадто великий ризик регресій"
      - "Дублюють theme definitions замість shared SASS partials із CSS variable overrides"
      - "Не мають token pipeline — дизайнери і розробники розходяться у значеннях кольорів"
    relatedQuestions: ["b13t1q2", "b13t1q3", "b13t2q1"]
---

## Core Concept

**English definition:** Angular Material theming is a system built on top of SASS `@use` syntax and CSS custom properties that allows defining a consistent visual language (colors, typography, density) applied uniformly across all Material components, with Material 3 (M3) introducing a HCT-based color system and runtime CSS variable theming.

**Пояснення:** Angular Material theming — це механізм визначення дизайн-токенів (кольори, типографія, щільність) що автоматично застосовуються до всіх ~50 Material компонентів. З Angular Material 17+ перейшли на Material 3, де тема генерує CSS custom properties замість статичного SASS CSS — це дозволяє перемикати теми в runtime без rebuild.

**Яку проблему вирішує:** Без theming system кожен компонент потребує ручного стилізування — Whack-a-Mole підхід де зміна primary кольору вимагає оновлення сотень місць. Theming забезпечує: 1) Централізоване визначення brand colors. 2) Автоматичне застосування до всіх компонентів. 3) Light/dark mode без дублювання стилів. 4) Accessibility через правильні contrast ratios.

**Як працює під капотом:**

Material 3 theming pipeline:

1. SASS `@use '@angular/material' as mat` — завантажує theming SASS API
2. `mat.define-theme()` — приймає color palettes, typography config, density scale і повертає theme map
3. `mat.all-component-themes($theme)` або `mat.[component]-theme($theme)` — включає SASS mixins що генерують CSS
4. З M3 + CSS variables mode: `mat.theme-overrides($theme)` генерує ~1000 CSS custom properties (`--mat-sys-primary`, `--mat-sys-on-primary` тощо)
5. Компоненти посилаються на ці CSS variables, не на захардкоджені значення — runtime switching без SASS recompile

```scss
// styles.scss — Material 3 theming setup
@use '@angular/material' as mat;

// Визначаємо тему з M3 palettes
$light-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$violet-palette,
    tertiary: mat.$orange-palette,
  ),
  typography: (
    brand-family: 'Google Sans',
    plain-family: 'Roboto',
  ),
  density: (scale: 0),
));

$dark-theme: mat.define-theme((
  color: (
    theme-type: dark,
    primary: mat.$violet-palette,
    tertiary: mat.$orange-palette,
  ),
));

// Генеруємо CSS для компонентів
html {
  @include mat.all-component-themes($light-theme);
  @include mat.all-component-typographies($light-theme);
  @include mat.all-component-densities($light-theme);
}

// Dark mode через клас (CSS variables override)
.dark-mode {
  @include mat.all-component-colors($dark-theme);
}
```

**Trade-offs та обмеження:**

- `mat.all-component-themes()` генерує CSS для всіх ~50 компонентів навіть якщо ви використовуєте 5 — краще `mat.[component]-theme()` per module
- CSS variables approach (~1000 custom properties) збільшує CSS footprint, але дозволяє runtime switching
- M3 і M2 API несумісні — migration потребує часу
- Custom SASS modifications (override Material internals) можуть поламатися при оновленнях

**Версійність:**
- Angular Material 2-14: M2 theming через `mat-light-theme()`, `mat-palette()`
- Angular Material 15: нові SASS API (`mat.define-theme()`), M3 developer preview
- Angular Material 17: Material 3 stable, CSS custom properties generation
- Angular Material 18+: M3 default, M2 через `@use '@angular/material' as mat; mat.define-light-theme()` (legacy)
- Deprecated: `mat-color()`, `mat-palette()`, `mat-contrast()` — замінено на CSS custom properties і `mat.define-theme()`

## Deep Details

### Edge Cases

- **Component-level theme override:** Деякі компоненти приймають `[color]="'primary' | 'accent' | 'warn'"` — це M2 API. В M3 color variants через CSS variables або окремі theme scopes
- **SSR і theming:** CSS variables генеруються server-side і не потребують клієнтського JavaScript — сумісно з Angular Universal
- **Storybook integration:** Потребує theming setup в preview.ts — не автоматичне
- **CSS specificity з Tailwind:** `mat.all-component-themes()` генерує CSS не в `@layer` — конфліктує з Tailwind utilities. Рішення описано в [material-tailwind-together](/topics/material-tailwind-together)
- **Font loading:** Material Icons і Roboto за замовчуванням через Google Fonts CDN — для production self-host через `@fontsource/roboto`

### Junior vs Senior Understanding

**Junior** знає: запустити `ng add @angular/material`, вибрати prebuilt theme, використовувати `[color]="'primary'"` на компонентах.

**Senior** розуміє:

1. **HCT color space** — Material 3 використовує Hue-Chroma-Tone замість HSL. HCT перцептивно рівномірний (однаковий perceived lightness для різних hues при однаковому Tone). Це забезпечує автоматичні accessible contrast ratios.
2. **Tonal palettes** — кожен color seed генерує 13 tonal variants (0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100). Color roles (primary, on-primary, primary-container) відображаються на конкретні tones.
3. **CSS variables cascade** — `--mat-sys-primary` визначається на :root, компоненти читають через `color: var(--mat-sys-primary)`. Override на `.dark-mode { --mat-sys-primary: #[dark-value]; }` автоматично перемикає всі компоненти.
4. **Bundle optimization** — `mat.button-theme($theme)` замість `mat.all-component-themes()` в lazy-loaded module зменшує initial bundle.

### Deprecation & Migration Path

**M2 → M3 migration:**

```bash
# Автоматична міграція (частково автоматизована)
ng update @angular/material

# Або конкретна версія
ng update @angular/material@18
```

Ручні кроки після schematic:
- `mat-palette()` → `mat.$[color]-palette`
- `mat-light-theme()` / `mat-dark-theme()` → `mat.define-theme()`
- `mat-color($palette, 500)` → CSS custom property `var(--mat-sys-primary)`
- `MatLegacyButton` → `MatButton` (нова M3 API)
- `[color]="'accent'"` — M3 не має accent, замінити на tertiary або primary

**Legacy support:** Angular Material 15-17 підтримує одночасно M2 (`mat.define-light-theme`) і M3 (`mat.define-theme`) — поступова міграція по компонентам.

### Connections to Other Concepts

- **CSS custom properties:** M3 theming повністю базується на CSS variables — розуміння cascading і specificity критичне
- **Angular CDK:** CDK overlay компоненти успадковують тему через CSS variables — потрібно включати CDK theming окремо через `mat.all-component-themes()` або `cdk-overlay-container` в scope
- **Tailwind coexistence:** Specificity конфлікт між Material un-layered CSS і Tailwind `@layer utilities` — детально в [material-tailwind-together](/topics/material-tailwind-together)
- **Design tokens:** Material Theme Builder (tool від Google) генерує palettes з brand color — output можна використати в `mat.define-theme()`

## Examples

### Basic Usage

```scss
// styles.scss — мінімальний M3 setup
@use '@angular/material' as mat;

// Включаємо базові M3 стилі (normalize, typography базові)
@include mat.core();

// Визначаємо тему
$theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$indigo-palette,
  ),
));

// Застосовуємо до всіх компонентів
html {
  @include mat.all-component-themes($theme);
}
```

```typescript
// app.config.ts — Angular 17+ standalone
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(), // lazy animations bundle
  ],
};
```

### Production Scenario

```scss
// theme.scss — enterprise multi-theme setup з light/dark
@use '@angular/material' as mat;
@use 'sass:map';

@include mat.core();

// Brand palettes
$brand-primary: mat.$violet-palette;
$brand-tertiary: mat.$cyan-palette;

// Light theme
$light-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: $brand-primary,
    tertiary: $brand-tertiary,
  ),
  typography: (
    brand-family: '"Google Sans", sans-serif',
    plain-family: '"Roboto", sans-serif',
    bold-weight: 700,
    medium-weight: 500,
    regular-weight: 400,
  ),
  density: (scale: -1), // compact для enterprise admin
));

// Dark theme (лише color override, typography та density ті ж)
$dark-theme: mat.define-theme((
  color: (
    theme-type: dark,
    primary: $brand-primary,
    tertiary: $brand-tertiary,
  ),
));

// Apply light theme
:root {
  @include mat.all-component-themes($light-theme);
}

// Dark mode override через CSS variables
.dark-mode {
  @include mat.all-component-colors($dark-theme);
  color-scheme: dark;
}

// Системний dark mode (якщо користувач не переключав вручну)
@media (prefers-color-scheme: dark) {
  :root:not(.light-mode) {
    @include mat.all-component-colors($dark-theme);
    color-scheme: dark;
  }
}
```

```typescript
// theme.service.ts — light/dark toggle з localStorage persistence
import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'app-theme';

  readonly theme = signal<Theme>(this.getSavedTheme());

  constructor() {
    // Відстежуємо системний dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    effect(() => {
      this.applyTheme(this.theme(), mediaQuery.matches);
    });

    // Оновлюємо при зміні системного preference
    mediaQuery.addEventListener('change', (e) => {
      if (this.theme() === 'system') {
        this.applyTheme('system', e.matches);
      }
    });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(this.storageKey, theme);
  }

  private applyTheme(theme: Theme, systemDark: boolean): void {
    const body = this.document.body;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);

    body.classList.toggle('dark-mode', isDark);
    body.classList.toggle('light-mode', !isDark);
  }

  private getSavedTheme(): Theme {
    return (localStorage.getItem(this.storageKey) as Theme) ?? 'system';
  }
}
```

```html
<!-- index.html — FOUT prevention: inline script виконується до Angular bootstrap -->
<head>
  <!-- Preload fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preload" as="style"
    href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap">

  <!-- Prevent flash of wrong theme -->
  <script>
    (function() {
      var theme = localStorage.getItem('app-theme') || 'system';
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = theme === 'dark' || (theme === 'system' && systemDark);
      if (isDark) document.documentElement.classList.add('dark-mode');
    })();
  </script>
</head>
```

### Anti-Example

```scss
// WRONG: M2 theming API в новому проєкті
@import '@angular/material/theming'; // Deprecated — використовує @import замість @use

$primary: mat-palette($mat-indigo);
$accent: mat-palette($mat-pink, A200, A100, A400);
$theme: mat-light-theme((
  color: (primary: $primary, accent: $accent)
));

@include angular-material-theme($theme);
// Ця API deprecated, не підтримує M3, не генерує CSS variables
```

```typescript
// WRONG: Завантаження prebuilt theme для branded product
// angular.json styles array:
// "styles": ["node_modules/@angular/material/prebuilt-themes/indigo-pink.css"]
// Неможливо кастомізувати, фіксований M2 indigo-pink бренд,
// нема dark mode, нема CSS variables

// CORRECT: Custom M3 theme у styles.scss як показано вище
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Prebuilt theme у production branded app | Неможливо кастомізувати кольори під brand, фіксований M2 стиль, нема dark mode support | Custom `mat.define-theme()` з brand palettes і CSS variables |
| `mat.all-component-themes()` у кожному lazy module | Дублює CSS для всіх ~50 компонентів в кожному chunk | `@include mat.core()` globally, `mat.[component]-theme()` per lazy module |
| `[color]="'accent'"` з M3 theme | M3 не має accent semantic — компонент fallback до primary | Використовуйте M3 color roles або `[color]="'primary' | 'tertiary'"` |
| BrowserAnimationsModule замість provideAnimationsAsync() | Синхронно завантажує весь animations bundle — збільшує initial bundle | `provideAnimationsAsync()` — animations lazy-loaded коли вперше потрібні |
| Відсутність FOUT prevention для dark mode | Theme 'мигає' від light до dark під час Angular bootstrap | Inline script у `<head>` читає localStorage і додає CSS клас до завантаження Angular |

## Interview Block

### [L1 — Warm-up] Як додати Angular Material до Angular проєкту і що налаштовує ng add schematic?
**Signal being tested:** Чи має кандидат практичний досвід setup, чи лише читав документацію.
**What the interviewer expects:** Конкретні кроки: `ng add @angular/material`, що відбувається (animations, fonts, theme), різниця між prebuilt і custom theme.
**How to probe deeper:** "Яка різниця між BrowserAnimationsModule і provideAnimationsAsync()?"
**Reference answer:** `ng add @angular/material` виконує schematic: встановлює пакети (@angular/material, @angular/cdk, @angular/animations), налаштовує animations через `provideAnimationsAsync()` (lazy) в app.config.ts, додає Roboto і Material Icons у index.html, і додає вибрану тему в styles. З Angular 17+ — standalone-friendly setup з provideAnimationsAsync() замість NgModule.
**Common mistakes:** Плутають BrowserAnimationsModule (sync, більший bundle) з provideAnimationsAsync (async, lazy). Вибирають prebuilt theme для production branded apps — неможливо кастомізувати.

### [L2 — Mid] Поясніть Material 3 color system і як HCT palettes відрізняються від M2 підходу.
**Signal being tested:** Розуміння чому M3 зробили breaking change в theming і що вирішує HCT color space.
**What the interviewer expects:** Пояснення tonal palettes, color roles (primary/on-primary/container), HCT vs HSL, CSS variables generation.
**How to probe deeper:** "Чому M3 використовує `--mat-sys-primary-container` замість просто `--mat-sys-primary` для backgrounds?"
**Reference answer:** M3 color system базується на HCT (Hue-Chroma-Tone) — перцептивно рівномірному color space де однаковий Tone дає однаковий perceived brightness незалежно від hue. Кожна palette генерує 13 tonal variants. Color roles: primary (brand color), on-primary (text на primary), primary-container (subtle background), on-primary-container (text на container). Container vs direct color — accessibility: primary на white може не мати достатній contrast, primary-container (tone 90) на white — завжди accessible. CSS variables generation дозволяє runtime theme switching.
**Common mistakes:** Думають color roles — це просто aliases для кольорів, не розуміють accessibility semantics. Змішують M2 `[color]="'accent'"` з M3 (accent не існує в M3).

### [L3 — Senior] Як реалізувати light/dark theme toggle з FOUT prevention і SSR compatibility?
**Signal being tested:** Розуміння повного lifecycle theme switching — від SASS generation до runtime UX, включаючи SSR edge cases.
**What the interviewer expects:** CSS variables approach, ThemeService з signal, FOUT prevention через inline script, SSR через TransferState або cookie.
**How to probe deeper:** "Як вирішити проблему що SSR рендерить light theme, але користувач має dark mode збережений у localStorage?"
**Reference answer:** SASS: генерувати CSS variables з `mat.theme-overrides($light-theme)` на `:root`, `mat.theme-overrides($dark-theme)` на `.dark-mode`. ThemeService з `signal<Theme>` і effect для classList toggle. FOUT prevention: inline blocking script у `<head>` читає localStorage і додає клас до Angular bootstrap. SSR: проблема — server не має access до localStorage. Рішення: HTTP cookie з theme preference (доступна на сервері), TransferState для sync між server і client render.
**Common mistakes:** Зберігають два повні CSS файли замість CSS variables override. Забувають FOUT prevention. Не враховують SSR — hydration mismatch якщо server рендерить light, client перемикає на dark.

### [L4 — Staff/Principal] Як спроєктувати theming infrastructure для enterprise Angular platform з кількома брендами, design-dev token sync, і M2→M3 migration plan?
**Signal being tested:** System-level architectural thinking, cross-team coordination, migration risk management.
**What the interviewer expects:** Token pipeline (Figma→code), multi-brand CSS variables strategy, versioned theme packages, staged M2→M3 migration.
**How to probe deeper:** "Як автоматизувати синхронізацію між Figma design tokens і Angular Material theme?"
**Reference answer:** Token pipeline: Figma Material Theme Builder → exported JSON → Style Dictionary transforms → SASS variables + CSS custom properties + Tailwind theme config. CI automation: при merge token changes, генерується updated `@org/design-tokens` package. Multi-brand: CSS variables scope через `.brand-a` / `.brand-b` body classes, всі brands share same Angular bundle, CSS overrides brand-specific tokens. `@org/brand-theme` npm package версіонований, teams extend base. M2→M3 migration: Visual regression baseline → feature flag per routing module → `MatLegacy*` components під флагом → поступова заміна → axe-core accessibility diff між M2 і M3 versions.
**Common mistakes:** Big bang M2→M3 migration без visual regression safety net. Немає versioned token package — дизайнери пушать breaking changes без notice. Ігнорують performance різницю: M3 CSS variables cascade може бути повільніший на low-end Android.

## Summary

### Key Points
- `ng add @angular/material` налаштовує animations, fonts, і theme scaffold — використовуйте `provideAnimationsAsync()` для lazy animations bundle
- Material 3 theming через `mat.define-theme()` і CSS custom properties дозволяє runtime light/dark switching без rebuild
- HCT color space і tonal palettes забезпечують accessibility-aware color roles — primary, on-primary, primary-container мають semantic значення для contrast
- `mat.all-component-themes()` дорогий — використовуйте `mat.[component]-theme()` per lazy module для bundle optimization
- Light/dark toggle потребує FOUT prevention: inline script у `<head>` до Angular bootstrap читає localStorage
- M2→M3 migration: `ng update` schematic автоматизує ~70%, решта — ручна заміна deprecated API
- Enterprise: token pipeline від Figma через Style Dictionary до Angular theme + versioned `@org/design-tokens` package

### Elevator Pitch (2 minutes)
"Angular Material theming — це SASS-based система де `mat.define-theme()` з brand palettes генерує CSS. З Material 3 — CSS custom properties (близько 1000 змінних) дозволяють runtime theme switching: SASS генерує variables на `:root`, override на `.dark-mode` — і всі компоненти перемикаються без rebuild. Ключовий концепт M3 — HCT color space і tonal palettes: кожен color role (primary, on-primary, primary-container) автоматично має правильний contrast. Для enterprise: token pipeline Figma → Style Dictionary → Angular theme, versioned npm package для multi-team sync, і staged M2→M3 migration з visual regression safety net."
