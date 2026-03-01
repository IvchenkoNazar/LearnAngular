---
title: "Deferrable Views (@defer)"
block: 11
topic: 1
slug: "deferrable-views"
difficulty: 3
sinceVersion: "17"
tags: ["@defer", "@placeholder", "@loading", "@error", "defer-triggers", "lazy-loading", "incremental-hydration"]
relatedTopics: ["bundle-optimization", "core-web-vitals", "runtime-optimization", "angular-devtools-profiling"]
interviewQuestions:
  - level: "junior"
    question: "Що таке @defer в Angular і які trigger types він підтримує?"
    referenceAnswers:
      junior: "@defer — це новий синтаксис Angular 17 для lazy loading частин шаблону. Підтримує triggers: idle, viewport, interaction, hover, immediate, timer."
      mid: "@defer — compiler-level lazy loading для шаблонних блоків. Trigger types: `on idle` (requestIdleCallback), `on viewport` (IntersectionObserver), `on interaction` (click/keydown на placeholder), `on hover` (mouseover на placeholder), `on immediate` (no delay, next tick), `on timer(Xms)` (setTimeout). Додатково: `when condition` — custom boolean expression. Companion blocks: @placeholder (shown before trigger), @loading (shown during load), @error (shown on failure)."
      senior: "@defer під капотом: compiler трансформує @defer block у dynamic import() call + runtime trigger setup. Dependencies всередині @defer block відокремлюються в окремий lazy chunk (code splitting автоматичне). Trigger 'on viewport': IntersectionObserver на @placeholder element. 'on interaction': event listeners на @placeholder (click, keydown). Prefetch: `@defer (on viewport; prefetch on idle)` — prefetch chunk on idle, але показати тільки при viewport. Мінімальний display time для @loading: `@loading (minimum 500ms)` — уникає flash. @error catching: якщо dynamic import() fails або component error в initialization."
      staff: "@defer — paradigm shift для Angular lazy loading. До @defer: route-level code splitting (loadComponent/loadChildren). @defer: component-tree-level code splitting. Compiler output: `ɵɵdefer()` instruction з dependency descriptor. Залежності всередині @defer — окремий chunk через build bundler. SSR implications: @defer з SSR — Angular 17 renders @placeholder on server (не defer content). Angular 18+: incremental hydration — @defer blocks can have `hydrate on` triggers. Server renders full content, client hydrates only when trigger fires. Це crítico для LCP: server HTML contains full content (LCP), client defers hydration cost. Router.preloader + @defer: preloading strategy preloads route chunks, але @defer chunks — окремі. Може бути необхідна координація. Testing: `TestBed.configureTestingModule` з `@defer` — потребує `DeferBlockBehavior.Manual` або `Playthrough`."
    commonMistakes:
      - "Думають @defer = ngIf/show/hide — ні, @defer = code splitting + lazy loading"
      - "Не знають що @defer автоматично створює окремий bundle chunk для залежностей"
    relatedQuestions: ["b11t1q2", "b11t1q3"]
  - level: "mid"
    question: "Як використовувати @placeholder, @loading і @error блоки і яка роль prefetch?"
    referenceAnswers:
      junior: "@placeholder показується до trigger, @loading під час завантаження, @error якщо сталась помилка."
      mid: "@placeholder: rendered до trigger condition. Може мати `minimum Xms` — показується мінімум X ms навіть якщо loaded faster. @loading: shown during lazy chunk download. `minimum 500ms` — no flash of loading. `after 200ms` — show loading тільки якщо > 200ms elapsed. @error: shown if import() fails або component throws. Prefetch: `@defer (on viewport; prefetch on idle)` — downloads chunk on idle but renders on viewport. Prefetch conditions are independent від display trigger."
      senior: "@placeholder blocking trigger: якщо `on viewport` — placeholder element must be in DOM for IntersectionObserver to work. @loading timing: `after Xms` prevents loading flash for fast connections. `minimum Yms` prevents flash for slow connections (too-quick swap). Pattern: `@loading (after 200ms; minimum 500ms)`. Multiple triggers: `@defer (on idle; on viewport)` — whichever fires first. Prefetch and trigger independence: `@defer (on interaction; prefetch on viewport)` — hover over section to prefetch, click to render. Reducing LCP impact: put @defer below the fold (not for LCP elements). SSR: server renders @placeholder, not @defer content. Ensure @placeholder is meaningful (skeleton, spinner, nothing) — це visible до hydration."
      staff: "@placeholder/@loading/@error design system. @placeholder best practices: для viewport trigger — ensure placeholder has meaningful dimensions (same height as deferred content) to prevent CLS when content loads. Skeleton screens краще ніж blank space. @loading за-наміром: after + minimum combo — optimal UX. 200ms rule: humans don't notice <200ms loading, 200ms+ → show loading indicator. @error: user-facing error з retry option — не просто 'error'. `@error { <button (click)='retry()'>Retry</button> }`. Prefetch strategy: `prefetch on idle` — for below-fold heavy components. `prefetch on viewport(triggerEl)` — trigger prefetch when section comes into view (IntersectionObserver). Prefetch doesn't block. Memory: prefetched chunk stored in browser cache, not instantiated. Multiple @defer blocks: кожен — окремий bundle chunk. Або спільний якщо залежності overlap (bundler merges). Bundle analysis: `ng build --stats-json` → stats.json показує @defer chunks."
    commonMistakes:
      - "Не використовують minimum delay для @loading — flash of loading indicator на fast connections"
      - "@error без retry mechanism — user не може відновитись від failed lazy load"
    relatedQuestions: ["b11t1q1", "b11t1q3"]
  - level: "senior"
    question: "Як @defer впливає на bundle size та як налаштувати dependency deferral?"
    referenceAnswers:
      junior: "@defer виносить код у окремий chunk який завантажується пізніше, зменшуючи initial bundle."
      mid: "Усі Angular компоненти, directives, pipes використані тільки в @defer block — автоматично виносяться в lazy chunk. Imports у @Component.imports що використані тільки в @defer — не в initial bundle. Initial bundle зменшується."
      senior: "Dependency deferral механізм: Angular compiler аналізує @defer block і збирає всі unique dependencies (components, directives, pipes, services через factories). Ці dependencies — окремий module chunk через dynamic import(). Умова: dependency ТІЛЬКИ в @defer — інакше залишається в initial bundle (якщо є outside reference). Practical: component що тільки в @defer — moved to defer chunk. Але если той самий component є в іншому місці шаблону — залишається в initial. Multiple @defer з однаковою dependency: bundler може merge в один chunk або split. `ng build --stats-json` → webpack stats або esbuild metafile → аналіз chunks. Inline dependencies vs deferrable: важкі libraries (charts, rich text editors, PDF viewers) — ідеальні кандидати для @defer. NgRx Store components — складніше defer (shared state)."
      staff: "@defer і code splitting architecture. Build time analysis: Angular compiler emits dependency descriptors per @defer block. Bundler (esbuild in Angular 21) groups dependencies into chunks. Chunk strategy: за замовчуванням dynamic import per unique dependency set. Може бути N chunks для N @defer blocks якщо dependency sets non-overlapping. Named chunks: `@defer` blocks можна ідентифікувати в stats через file naming (lazy chunk names in angular). Design principle: @defer не гарантує окремий file per block — bundler може inline маленькі deps. Performance impact modeling: initial JS parse/eval saved = size of deferred deps × parse time coefficient. INP benefit: less JS to parse at startup = faster interaction readiness. Trade-off: @defer adds IntersectionObserver/event listener setup overhead — negligible але non-zero. Multiple @defer overhead: each trigger needs O(1) setup. 100 @defer blocks — 100 observers. Threshold: very granular @defer (50+ per route) може мати observable overhead. Balance: @defer для компонентів > 10KB деferred deps."
    commonMistakes:
      - "Думають що import в @Component.imports автоматично deferred — ні, тільки те що ТІЛЬКИ в @defer block"
      - "Не перевіряють chunk розміри після додавання @defer — можливо компонент вже в initial bundle через інший reference"
    relatedQuestions: ["b11t1q2", "b11t1q4"]
  - level: "senior"
    question: "Як @defer інтегрується з SSR та що таке incremental hydration в Angular 18+?"
    referenceAnswers:
      junior: "З SSR @defer контент може рендеритись на сервері. Incremental hydration — нова функція Angular 18 що дозволяє поступово гідрувати сторінку."
      mid: "@defer з SSR (Angular 17): server renders @placeholder (не @defer content) — content not available on server. Angular 18+: incremental hydration — `@defer (hydrate on viewport)` — server renders full content, Angular defers hydration until trigger. Це краще для LCP та SEO."
      senior: "SSR + @defer evolution: Angular 17: server renders @placeholder. Deferred content absent in server HTML. Cons: LCP не benefiting (placeholder is LCP element, не real content). SEO: deferred content not in HTML. Angular 18+ incremental hydration: `@defer (on viewport; hydrate on viewport)` — server renders full @defer content (for LCP/SEO), client hydrates block only when trigger fires. Hydration deferral reduces JS processing at startup: components not hydrated = no event listener setup, no CD registration. Benefits: LCP: server HTML has content (LCP element fully rendered). INP: less JS to process at startup. SEO: content in HTML. Trigger alignment: preferable to align defer trigger (display) з hydrate trigger або make hydrate trigger earlier. `hydrate on idle` — hydrate all defer blocks during browser idle."
      staff: "Incremental hydration — Angular's answer до Islands Architecture (Astro pattern). Architecture: server renders complete HTML including @defer block content. Client receives full HTML → paint LCP immediately. Angular boots → finds @defer blocks marked for deferred hydration. Per-block: registers trigger (IntersectionObserver, event listener) на server-rendered DOM. Trigger fires → Angular hydrates that block (runs change detection, attaches event listeners). Memory efficiency: non-hydrated components = no Angular overhead. 10 @defer blocks → 2 hydrated (visible) + 8 pending = reduced memory/CPU. withEventReplay() integration (Angular 18+): captures user events before hydration → replays on hydrate. User clicks button before hydration → click replayed after hydration = no lost interactions. Design consideration: @defer hydrate trigger should consider: what if user interacts before hydration? withEventReplay ensures no lost clicks. Monitoring: Hydration performance measurement via PerformanceObserver, custom NG_HYDRATION_FEATURE. Team adoption: incremental hydration requires SSR setup — not zero-cost. Evaluate per-app (SSR complexity vs hydration performance gain)."
    commonMistakes:
      - "Не розуміють різницю між defer (display) і hydrate triggers — це два незалежні mechanisms"
      - "Використовують @defer для all content без SSR — втрачають SEO benefit (content не в HTML)"
    relatedQuestions: ["b11t1q3", "b11t1q5"]
  - level: "staff"
    question: "Як спроектувати @defer стратегію для performance-critical Angular app і як тестувати @defer blocks?"
    referenceAnswers:
      junior: "Використовувати @defer для важких компонентів нижче fold. Для тестування Angular надає спеціальні утиліти."
      mid: "Стратегія: defer above-fold interactive elements тільки якщо не LCP candidates. defer below-fold heavy components. Testing: Angular TestBed підтримує @defer з DeferBlockBehavior — Manual (не trigger автоматично) або Playthrough (trigger normally). getDeferBlocks() для доступу до блоків у тесті."
      senior: "@defer strategy for performance: 1) Never defer LCP element — @defer на LCP content = LCP penalty. 2) Ideal candidates: charts/graphs (heavy viz libraries), rich text editors, PDF viewers, complex tables з non-critical data, below-fold interactive sections. 3) Trigger selection: viewport for content sections, idle for analytics/tracking widgets, interaction for advanced features (user must engage). 4) Prefetch strategy: prefetch on idle for likely-navigated heavy components. Testing: `const deferBlocks = await TestBed.getDeferBlocks(); await deferBlocks[0].render(DeferBlockState.Complete)` — manually trigger defer states. DeferBlockState: Initial (placeholder), Loading, Complete, Error. Для router lazy loading + @defer interaction — integrate routing test harness."
      staff: "@defer strategy architecture та testing infrastructure. Strategy framework: 1) Performance budget per route: initial JS ≤ 200KB → identify heaviest components → @defer candidates. `ng build --stats-json` → analyze chunk sizes. 2) Critical path analysis: above fold content (LCP candidates) → eager load. First interactive elements → eager or immediate trigger. Below fold / secondary features → viewport or idle trigger. 3) User journey mapping: checkout flow → do not defer checkout form (user came here to complete). Sidebar widgets → defer with idle. Recommendation engine → defer with viewport + prefetch on scroll near. 4) SSR + incremental hydration decision: SEO-critical pages → SSR + hydrate on idle/viewport. App-like pages → CSR + @defer (no SSR complexity). 5) Testing at scale: component test: DeferBlockBehavior.Manual → explicit state control. Integration test: Playthrough → simulates real triggers. E2E (Playwright): actual scroll/interaction to trigger @defer. CI: visual regression tests catch placeholder vs content transitions. Performance testing: Lighthouse run before/after @defer addition — measure LCP/INP delta. 6) Error handling strategy: @error block з retry (inject @defer trigger? No — need service). Error state service: `DeferErrorService.retry(blockId)` → programmatic trigger. 7) Bundle monitoring: add @defer chunk sizes to CI budget. Alert if @defer chunk grows > 100KB (should be lazy chunk not initial)."
    commonMistakes:
      - "Defer LCP elements — @defer для above-fold critical content = LCP regression"
      - "Не тестують @error state — error path never validated"
    relatedQuestions: ["b11t1q4", "b11t1q2"]
---

## Core Concept

**English definition:** `@defer` is a compiler-level Angular template feature (introduced in v17, stable) that enables declarative lazy loading of template blocks with automatic code splitting, configurable trigger conditions, and companion state blocks (`@placeholder`, `@loading`, `@error`), optionally enhanced with `prefetch` for background pre-downloading independent of display triggers.

**Пояснення:** @defer — принципово інший підхід до lazy loading ніж route-level code splitting. До @defer: lazy loading тільки при navigation до route. З @defer: будь-який блок шаблону може бути lazy-loaded по будь-якому trigger — idle time, viewport entry, user interaction, explicit condition. Compiler автоматично виносить залежності @defer блоку в окремий chunk — без ручного dynamic import(). Це "component islands" підхід в Angular.

**Яку проблему вирішує:** Initial bundle перевантажений компонентами що user може ніколи не побачити (below-fold content, advanced features, error states). Route-level lazy loading не достатньо granular — 50KB важкий chart component завантажується при navigate до route навіть якщо user не скролить до нього. @defer: "завантажуй коли дійсно потрібно" на рівні компонента.

**Як працює під капотом:**

```
Build time (compiler + bundler):
  Template with @defer block
        ↓
  Angular compiler analyzes dependencies inside @defer
  Emits ɵɵdefer() instruction with dependency factory descriptor
        ↓
  Bundler creates separate chunk for @defer dependencies
  Main chunk: ɵɵdefer setup code (tiny)
  Defer chunk: HeavyComponent + its deps (lazy)

Runtime:
  Component renders
        ↓
  @placeholder shown immediately (sync render)
        ↓
  Trigger setup: IntersectionObserver / event listener / timer / idle
        ↓
  Trigger fires
        ↓
  @loading shown
        ↓
  dynamic import(deferChunk) → chunk downloaded
        ↓
  Component instantiated, change detection runs
        ↓
  @defer content shown
```

Trigger types overview:
```typescript
// Trigger when browser is idle (requestIdleCallback)
@defer (on idle) { <heavy-analytics /> }

// Trigger when element enters viewport (IntersectionObserver)
@defer (on viewport) { <below-fold-chart /> }

// Trigger on user interaction with placeholder (click/keydown)
@defer (on interaction) { <advanced-editor /> }

// Trigger on hover over placeholder
@defer (on hover) { <tooltip-rich-content /> }

// Trigger immediately (next microtask)
@defer (on immediate) { <secondary-panel /> }

// Trigger after delay
@defer (on timer(2000ms)) { <chat-widget /> }

// Custom condition
@defer (when isFeatureEnabled()) { <new-feature /> }

// Prefetch independently of display trigger
@defer (on viewport; prefetch on idle) { <chart /> }
```

**Trade-offs та обмеження:**

- @defer не підходить для LCP-critical content (above fold) — lazy chunk download delay = LCP penalty
- Кожен @defer trigger (IntersectionObserver, event listener) додає невеликий runtime overhead
- Дуже granular @defer (100+ blocks) — observable overhead від many observers
- @error block без retry mechanism — user застряє в error state
- SSR: Angular 17 renders @placeholder server-side (не content), Angular 18+ incremental hydration додає render but defer hydration
- Testing: потребує DeferBlockBehavior setup — не автоматично в звичайних tests

**Версійність:** @defer introduced Angular 17 (developer preview + stable in v17.2). `@placeholder`, `@loading`, `@error` — з v17. `prefetch` keyword — v17. Incremental hydration (`hydrate on` triggers) — Angular 18 (developer preview), stable v19. `withEventReplay()` для captured events before hydration — Angular 18. Prior to @defer: тільки route-level lazy loading з `loadComponent`/`loadChildren`. Manual dynamic import() для component lazy loading — possible але verbose і no compiler support.

## Deep Details

### Edge Cases

**@defer і shared dependencies:** Якщо HeavyChartComponent використовується і в @defer і в eager частині шаблону — він залишається в initial bundle. @defer не може defer dependency що вже eager-loaded. Перевірка: `ng build --stats-json` → знайди компонент в chunks.

**@placeholder і viewport trigger:** IntersectionObserver needs a DOM element to observe. @placeholder content MUST be rendered для viewport trigger to work. Якщо @placeholder порожній → observer on zero-height element → може never trigger. Рішення: placeholder з min-height або explicit observed element.

**@defer і ngIf interaction:** `@if (condition) { @defer (on viewport) { <content /> } }`. @defer setup runs only if @if is true. Якщо condition changes after setup — @defer may not re-trigger. Consider: @defer + when(signal) vs @if + @defer.

**Multiple triggers:** `@defer (on idle; on viewport)` — whichever fires first. After first trigger, others cleaned up. No duplicate rendering.

**Prefetch і Display trigger independence:** Prefetch може запустити fetch до display trigger. Якщо prefetch completes before viewport trigger — @loading shows briefly then content. Якщо not yet complete — @loading shows until download complete.

**@error і network retry:** @error block не має вбудованого retry. Патерн: `@error { <button (click)="retryDefer = !retryDefer">Retry</button> }` + `@defer (when retryDefer)` — but this creates new @defer block. Alternative: service-based state с manual trigger.

### Junior vs Senior Understanding

**Junior** knows: @defer syntax, basic triggers (idle, viewport), companion blocks (@placeholder, @loading, @error).

**Senior** understands:

1. **Automatic code splitting:** compiler extracts @defer dependencies into separate chunks. No manual dynamic import needed. Dependency exclusion: only if ONLY used in @defer.

2. **IntersectionObserver setup:** viewport trigger needs visible @placeholder for observation. Empty placeholder = never triggers.

3. **Prefetch independence:** prefetch и display triggers are separate. `on viewport; prefetch on idle` = download on idle, show on viewport.

4. **SSR behavior:** v17 renders placeholder; v18+ incremental hydration renders full content, defers hydration.

5. **Testing:** DeferBlockBehavior.Manual vs Playthrough. getDeferBlocks() API.

6. **LCP anti-pattern:** never defer above-fold critical content.

### Deprecation & Migration Path

- **Ручний dynamic import() для lazy components:** Replaced by @defer. Migration: replace `const { Comp } = await import('./comp'); VCR.createComponent(Comp)` → `@defer { <comp /> }`. Simpler і compiler-optimized.
- ***ngIf з lazy loading:** Pattern `*ngIf="isVisible$ | async"` for conditional heavy content → `@defer (when isVisible())` or `@defer (on viewport)` depending on use case.
- **Route-level splitting для non-route content:** Якщо раніше creating extra routes just for code splitting → @defer is cleaner solution for sub-route content.

### Connections to Other Concepts

- **Bundle Optimization:** @defer is Angular's primary tool for sub-route code splitting
- **Core Web Vitals:** @defer + SSR incremental hydration → LCP/INP improvements
- **Change Detection:** Deferred components enter CD tree only after trigger fires — reduces initial CD scope
- **Angular DevTools:** Component tree shows deferred blocks; can inspect hydration state

## Examples

### Basic Usage

```html
<!-- Basic @defer with all companion blocks -->
@defer (on viewport) {
  <!-- Heavy component — lazy loaded when scrolled into view -->
  <app-analytics-chart [data]="chartData()" />
} @placeholder {
  <!-- Shown immediately, skeleton for layout stability (prevents CLS) -->
  <div class="chart-skeleton" style="height: 300px; background: #f0f0f0;">
    <span>Loading chart...</span>
  </div>
} @loading (after 200ms; minimum 500ms) {
  <!-- Show spinner only if loading takes > 200ms, for at least 500ms -->
  <app-spinner message="Loading analytics..." />
} @error {
  <!-- Shown if chunk download or component init fails -->
  <app-error-state message="Failed to load chart. Please refresh." />
}
```

```html
<!-- Prefetch on idle, display on interaction -->
@defer (on interaction; prefetch on idle) {
  <app-rich-text-editor [(value)]="content" />
} @placeholder {
  <div class="editor-placeholder" tabindex="0">
    Click to edit...
  </div>
}

<!-- Custom condition trigger -->
@defer (when isAdvancedMode()) {
  <app-advanced-settings />
} @placeholder {
  <div>Enable advanced mode to see more options</div>
}

<!-- Timer-based: show chat widget after 3 seconds -->
@defer (on timer(3000ms); prefetch on idle) {
  <app-chat-widget />
} @placeholder {
  <!-- Nothing visible until timer fires -->
}
```

### Production Scenario

```typescript
// Production @defer strategy for complex dashboard
@Component({
  standalone: true,
  imports: [
    // Only eagerly loaded components here
    // Heavy visualization components NOT imported — defer handles them
    DashboardHeaderComponent,
    MetricsSummaryComponent,
  ],
  template: `
    <!-- Above fold: eager (LCP elements) -->
    <app-dashboard-header [user]="user()" />
    <app-metrics-summary [metrics]="metrics()" />

    <!-- Below fold: @defer on viewport with prefetch on idle -->
    @defer (on viewport; prefetch on idle) {
      <app-revenue-chart [data]="revenueData()" />
    } @placeholder {
      <!-- Maintains layout height for CLS prevention -->
      <div class="chart-placeholder" style="height: 400px;">
        <app-skeleton-chart />
      </div>
    } @loading (after 200ms; minimum 500ms) {
      <app-skeleton-chart [animated]="true" />
    } @error {
      <app-inline-error
        message="Revenue chart failed to load"
        (retry)="retryRevenue.set(!retryRevenue())"
      />
    }

    <!-- Feature flag controlled defer -->
    @defer (when featureFlags.isEnabled('new-analytics')) {
      <app-new-analytics-panel />
    }

    <!-- User interaction for advanced features -->
    @defer (on hover; prefetch on idle) {
      <app-advanced-filters [onApply]="applyFilters" />
    } @placeholder {
      <button class="filters-trigger">
        Advanced Filters
      </button>
    }
  `,
})
export class DashboardComponent {
  user = inject(AuthService).currentUser;
  metrics = inject(MetricsService).summary;
  revenueData = inject(RevenueService).chartData;
  featureFlags = inject(FeatureFlagService);
  retryRevenue = signal(false);
}
```

```typescript
// Testing @defer blocks
import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';

describe('DashboardComponent @defer', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      // DeferBlockBehavior.Manual: @defer blocks stay in placeholder state
      // until manually triggered in test
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('should show placeholder initially', () => {
    const placeholder = fixture.nativeElement.querySelector('.chart-placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('should show chart after trigger', async () => {
    // Get all defer blocks in component
    const deferBlocks = await fixture.getDeferBlocks();

    // Trigger the first defer block (revenue chart)
    await deferBlocks[0].render(DeferBlockState.Complete);
    fixture.detectChanges();

    const chart = fixture.nativeElement.querySelector('app-revenue-chart');
    expect(chart).toBeTruthy();
  });

  it('should show error state on failure', async () => {
    const deferBlocks = await fixture.getDeferBlocks();

    await deferBlocks[0].render(DeferBlockState.Error);
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('app-inline-error');
    expect(error).toBeTruthy();
  });

  it('should show loading state', async () => {
    const deferBlocks = await fixture.getDeferBlocks();

    await deferBlocks[0].render(DeferBlockState.Loading);
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('app-skeleton-chart[animated]');
    expect(skeleton).toBeTruthy();
  });
});
```

### Anti-Example

```html
<!-- WRONG: Deferring LCP element — causes LCP penalty -->
@defer (on idle) {
  <!-- WRONG: hero image is likely LCP element — @defer means it loads late -->
  <img src="/hero.webp" width="1200" height="600" alt="Hero" priority>
} @placeholder {
  <div style="height: 600px;"></div>
}

<!-- CORRECT: Never defer above-fold LCP content -->
<img ngSrc="/hero.webp" width="1200" height="600" alt="Hero" priority>

<!-- WRONG: Empty @placeholder with viewport trigger — observer on zero-height element -->
@defer (on viewport) {
  <app-heavy-list [items]="items()" />
} @placeholder {
  <!-- WRONG: empty placeholder → zero height → IntersectionObserver fires immediately (or never) -->
}

<!-- CORRECT: Placeholder with meaningful height -->
@defer (on viewport) {
  <app-heavy-list [items]="items()" />
} @placeholder {
  <!-- CORRECT: maintains layout, observer fires at proper scroll position -->
  <div style="min-height: 400px;">
    <app-list-skeleton [count]="5" />
  </div>
}

<!-- WRONG: No @error block — user stuck if chunk fails to load -->
@defer (on viewport) {
  <app-analytics />
}
<!-- WRONG: No @error → blank space on network failure -->

<!-- CORRECT: Always handle error state -->
@defer (on viewport) {
  <app-analytics />
} @placeholder {
  <div style="min-height: 200px;"></div>
} @error {
  <!-- CORRECT: User knows something went wrong -->
  <div class="error-state">
    Analytics failed to load.
    <button (click)="location.reload()">Refresh page</button>
  </div>
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `@defer` для LCP-critical above-fold content | Lazy chunk download delay = direct LCP penalty | Тільки eager для above-fold visible content; @defer для below-fold та secondary features |
| Порожній `@placeholder` з viewport trigger | Zero-height element → IntersectionObserver fires at wrong time або ніколи | Placeholder з `min-height` відповідним content; skeleton screen |
| Відсутній `@error` block | User бачить пустий простір на network failure — no feedback | Завжди додавай `@error` з user-actionable message і retry option |
| `@defer` без `minimum` в `@loading` | Flash of loading indicator на fast connections — jarring UX | `@loading (after 200ms; minimum 500ms)` — smooth threshold |
| Defer компоненту що вже є в eager частині шаблону | Компонент залишається в initial bundle (eager reference), @defer не допомагає | Перевіряй з `ng build --stats-json` що component у lazy chunk |

## Interview Block

### [L1 — Warm-up] Що таке @defer і які trigger types він підтримує?

**Signal being tested:** Знання Angular 17+ API і розуміння що @defer = code splitting, не просто conditional display.

**What the interviewer expects:** @defer = lazy loading + code splitting, trigger types (idle, viewport, interaction, hover, immediate, timer, when), companion blocks.

**How to probe deeper:** "Чим @defer відрізняється від *ngIf для conditional display?"

**Reference answer:** @defer — compiler-level lazy loading + code splitting. Dependencies всередині @defer автоматично виносяться в окремий bundle chunk. *ngIf — conditional render без code splitting (компонент в initial bundle). Triggers: idle (requestIdleCallback), viewport (IntersectionObserver), interaction/hover (events on placeholder), immediate (microtask), timer(Xms), when(condition). @placeholder/@loading/@error для companion states. Angular 17+.

**Common mistakes:** Думають @defer = ngIf; не знають про автоматичне code splitting.

### [L2 — Mid] Як використовувати @placeholder, @loading і @error блоки і яка роль prefetch?

**Signal being tested:** Практичне розуміння UX patterns для lazy loading states і незалежність prefetch від display trigger.

**What the interviewer expects:** Функція кожного блоку, after/minimum для @loading, prefetch independence, CLS prevention через placeholder height.

**How to probe deeper:** "Що таке `@loading (after 200ms; minimum 500ms)` і навіщо обидва параметри?"

**Reference answer:** @placeholder: shown immediately, before trigger. Needs height for viewport trigger to work + CLS prevention. @loading: `after 200ms` — не показувати якщо < 200ms (no flash); `minimum 500ms` — показувати мінімум 500ms (no flash-of-loading). @error: shown on chunk download failure або component init error. Prefetch: `prefetch on idle` — downloads chunk on idle, display trigger = show when visible. Незалежні triggers = prefetch before needed.

**Common mistakes:** Не використовують after/minimum для @loading; порожній placeholder з viewport trigger.

### [L3 — Senior] Як @defer впливає на bundle size та як налаштувати dependency deferral?

**Signal being tested:** Розуміння compile-time analysis і умов при яких dependency реально потрапляє в lazy chunk.

**What the interviewer expects:** Dependency тільки в @defer → lazy chunk. Shared dependency (eager + defer) → initial bundle. Перевірка через stats.json.

**How to probe deeper:** "Чому компонент що я поставив в @defer все ще в initial bundle?"

**Reference answer:** Angular compiler аналізує @defer block — всі deps тільки там → lazy chunk. Якщо є eager reference (поза @defer) → initial bundle. Перевірка: `ng build --stats-json` → analyze chunks. Practical: видалити eager import зі списку imports якщо компонент тільки в @defer. Heavy libraries (charts, PDF, rich text) — ідеальні кандидати. NgRx store компоненти — складніше defer якщо state shared.

**Common mistakes:** Думають що import у @Component.imports автоматично deferred; не перевіряють chunks після @defer.

### [L4 — Staff/Principal] Як спроектувати @defer стратегію для performance-critical app і як тестувати?

**Signal being tested:** System-level thinking: performance budget approach, critical path analysis, testing infrastructure, incremental hydration decision.

**What the interviewer expects:** Critical path above fold = eager, below fold = @defer on viewport + prefetch on idle, LCP never defer, testing with DeferBlockBehavior, SSR + incremental hydration trade-off.

**How to probe deeper:** "Як виміряти ROI від додавання @defer — до і після метрики?"

**Reference answer:** Strategy: above-fold LCP content = always eager. Below-fold heavy components = `on viewport; prefetch on idle`. Advanced/optional features = `on interaction` or `when(featureFlag)`. Testing: `DeferBlockBehavior.Manual`, `getDeferBlocks()`, `deferBlock.render(DeferBlockState.Complete/Error/Loading)`. SSR trade-off: v17 renders placeholder; v18+ incremental hydration renders full content + defers hydration. Measurement: `ng build --stats-json` for chunk sizes, Lighthouse before/after for LCP/INP delta.

**Common mistakes:** Defer LCP elements; no @error testing; не вимірюють before/after.

---

## Summary

### Key Points
- `@defer` = compiler-level code splitting + declarative lazy loading, не просто conditional display
- Triggers: idle, viewport, interaction, hover, immediate, timer, when — whichever fires first
- `prefetch` і display trigger незалежні: `on viewport; prefetch on idle` = download eagerly, show lazily
- `@loading (after 200ms; minimum 500ms)` — optimal UX: no flash for fast loads, no flicker for slow
- Залежності тільки в @defer → lazy chunk; залежності і в eager і в @defer → initial bundle
- Ніколи не defer LCP-critical above-fold content — це прямий LCP penalty
- Angular 18+: incremental hydration (`hydrate on`) — server renders content, client defers hydration cost

### Elevator Pitch (2 minutes)
@defer — Angular 17 compiler feature для declarative lazy loading template blocks з automatic code splitting. Відрізняється від *ngIf: @defer виносить залежності в окремий bundle chunk, *ngIf — ні. Triggers: `on idle` (background), `on viewport` (IntersectionObserver), `on interaction/hover` (events), `on timer/immediate`, `when(condition)`. Prefetch незалежний від display: `prefetch on idle` downloads chunk in background, display trigger shows it. Companion states: @placeholder (завжди видимий до trigger), @loading (after 200ms; minimum 500ms — optimal UX), @error (user feedback on failure). Dependency deferral: тільки deps ВИКЛЮЧНО у @defer block → lazy chunk. Перевіряй через `ng build --stats-json`. Ніколи не defer LCP content. Angular 18+ incremental hydration: server renders full content (LCP/SEO OK), client defers hydration until trigger. Testing: `DeferBlockBehavior.Manual` + `getDeferBlocks()` + `deferBlock.render(DeferBlockState.Complete)`.
