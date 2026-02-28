---
title: "Angular DevTools & Performance Profiling"
block: 11
topic: 4
slug: "angular-devtools-profiling"
difficulty: 3
sinceVersion: "12"
tags: ["Angular-DevTools", "Profiler", "component-tree", "change-detection-cycles", "flame-chart", "performance-timeline"]
relatedTopics: ["runtime-optimization", "bundle-optimization", "deferrable-views", "change-detection"]
interviewQuestions:
  - id: "b11t4q1"
    level: "junior"
    question: "Що таке Angular DevTools і які основні функції він надає?"
    referenceAnswers:
      junior: "Angular DevTools — Chrome extension для debugging Angular apps. Показує component tree і дозволяє профілювати change detection."
      mid: "Angular DevTools (Chrome/Firefox extension): 1) Components tab — інспекція component tree, properties, inputs/outputs, injected services. 2) Profiler tab — запис і аналіз Change Detection cycles, flame chart, time spent per component. Встановлюється з Chrome Web Store. Працює тільки в development mode або з `enableDebugTools()`. Angular Ivy required (v9+). Стабільно з v12."
      senior: "Angular DevTools architecture: Chrome DevTools extension із injected content script що комунікує з Angular через `window.__ngDevtools__` hook. Ivy exposes debug API: `ng.getComponent(el)`, `ng.getContext(el)`, `ng.getDirectives(el)`. DevTools reads component tree through LView traversal. Component inspector: shows current state of component (inputs, outputs, signals, properties). Live update — reflects latest CD output. Profiler: instruments ApplicationRef.tick() — records start time, CD duration per component. Data structure: array of CD cycles, each with component contributions. Flame chart: horizontal = time, vertical = component nesting. Bar width = CD duration for component. Color: longer = more critical."
      staff: "Angular DevTools як observability tool для Angular internals. Internals: extension injects script that wraps ApplicationRef.tick() with performance.mark() API. Each CD cycle: measures duration, records which components were checked, records view operations (create, destroy, update). ɵgetLView(), ɵgetTView() APIs for accessing Ivy internals. Security consideration: DevTools functions (ng.*) only available in development mode (isDevMode()). Production: these APIs removed → no debug overhead. DevTools як development tool не production monitoring — для production: Angular's performanceMarkFeature, web-vitals, custom CD interceptors. Integration з Chrome Performance tab: Angular DevTools profiler exports data that correlates with Chrome's Performance timeline. Long Tasks (> 50ms) visible in both. Cross-tool workflow: Angular Profiler identifies 'slow component', Chrome Performance tab identifies system-level impact (layout, paint, GC)."
    commonMistakes:
      - "Думають Angular DevTools працює в production builds — ні, Ivy debug API тільки в development"
      - "Використовують тільки Component tree і ігнорують Profiler — Profiler дає найцінніші performance insights"
    relatedQuestions: ["b11t4q2", "b11t4q3"]
  - id: "b11t4q2"
    level: "mid"
    question: "Як використовувати Profiler tab в Angular DevTools для знаходження slow components?"
    referenceAnswers:
      junior: "В Profiler tab є кнопка Record. Після запису видно flame chart з CD cycles. Великі блоки = повільні компоненти."
      mid: "Profiler workflow: 1) Відкрити Angular DevTools → Profiler. 2) Click 'Record'. 3) Виконати дію що викликає performance issue. 4) Stop recording. 5) Аналізувати flame chart: горизонтальна вісь = час, вертикальна = component tree. Широкий bar = довгий CD для компонента. Click на bar → shows component name, CD duration, change detection count. Multiple bars = multiple CD cycles."
      senior: "Angular DevTools Profiler details: Flame chart encoding: Width = time in CD. Color: green (< 1ms), yellow (1-3ms), red (> 3ms). Bar structure: parent component bar contains child bars. Click bar: shows component file, duration, 'Instances changed' count. Right panel: per-component breakdown — CD count, duration, what triggered. Patterns to look for: 1) Wide bars = slow component. 2) Many bars per interaction = too many CD cycles (Zone.js triggers). 3) Long chains = deeply nested expensive templates. 4) Default vs OnPush components: default = always appears. OnPush only = appears when dirty. 5) Repeated wide bars = same component checked many times (should be OnPush'd). Export profiling data: JSON format for offline analysis. Filter: show only components over threshold. Timeline zoom для fine-grained analysis."
      staff: "Profiler tab — systematic performance investigation. Investigation methodology: 1) Baseline: record idle state (no user interaction). Any CD cycles? → spurious ticks (unpatched async outside zone, or service with setInterval). 2) Interaction profiling: click button → record CD triggered. Identify: which components checked, duration, necessary vs unnecessary. 3) Top-N analysis: sort by 'total time in CD' → 5 slowest components. Prioritize optimization. 4) OnPush effectiveness: Profiler shows whether components are being checked. After adding OnPush → component should disappear from most CD cycles. 5) Signal migration: after converting to signals — component only appears in cycles triggered by its signals. Fewer appearances = success. Profiler + Angular source maps: component names map to source files. Click → VS Code opens source? (With debugger configured). Advanced: compare before/after optimization. Export JSON baseline → re-record after optimization → compare totals. Angular 21: Profiler shows signal changes as CD triggers."
    commonMistakes:
      - "Record у development mode з Angular's extra checks — це природно повільніше ніж production, але ОК для відносного comparison"
      - "Фокусуються тільки на найширшому bar і ігнорують frequency (частоту CD cycles)"
    relatedQuestions: ["b11t4q1", "b11t4q3"]
  - id: "b11t4q3"
    level: "mid"
    question: "Як виявити зайві change detection cycles з Angular DevTools?"
    referenceAnswers:
      junior: "В Profiler видно скільки разів кожен компонент перевіряється. Якщо Default компонент перевіряється дуже часто — потрібен OnPush."
      mid: "Ознаки зайвих CD cycles: 1) Default components що з'являються в кожному frame без user interaction. 2) Component перевіряється більше ніж очікується (setTimeout, setInterval triggers). 3) OnPush component що з'являється без явного @Input change. Причини: Zone.js patches, третьосторонні бібліотеки у zone, нескінченні observable subscriptions."
      senior: "Detecting unnecessary CD in Angular DevTools: 1) Idle recording: record 5 seconds без user interaction. Якщо є CD cycles → spurious triggers. Common causes: a) setInterval без runOutsideAngular. b) Websocket messages у zone. c) requestAnimationFrame у zone. d) Observable що не completetes і продовжує emitting. e) BehaviorSubject.next() в timer. 2) Frequency analysis: how many CD cycles per user action? Click should trigger 1-2 cycles max. More → investigation needed. 3) OnPush violation: OnPush component appears every cycle → something calling markForCheck() unnecessarily або async pipe з frequently emitting Observable. 4) Default components: identify default components in hot paths. Convert to OnPush → they disappear from cycles when not dirty. 5) Signal tracking: Angular 21 DevTools shows which signal triggered CD. Identify high-frequency signals. Tools synergy: Angular Profiler (Angular-level) + Chrome Performance > Long Tasks panel (browser-level). Long Task > 50ms usually = multiple CD cycles."
      staff: "Systematic approach до unnecessary CD elimination. Root cause analysis framework: 1) Zone.js trigger audit: Angular DevTools Profiler → record idle → count cycles → 0 expected. Any cycles = Zone.js trigger. Chrome Performance tab → Event Listeners → find the source event. Common culprits: third-party polling lib in zone, Angular Material ripple effects, ResizeObserver in zone. 2) CD amplification: one event → many CD cycles. Symptom: 3+ bars per click in profiler. Cause: nested markForCheck() calls, cascading signal updates, TemplateRef.createEmbeddedView in loop. 3) OnPush audit: Angular DevTools Component tree → right-click component → inspect. Shows CD strategy. All leaf components = OnPush? Middle components? CD strategy audit coverage. 4) Signal frequency: computed() with expensive inputs that change frequently. Alternative: debounceTime() on source, or batch updates. 5) Fix verification: apply fix → re-record → compare cycle count + duration. Regression prevention: CD cycle count as automated metric (Angular performance benchmark). `benchmark.run()` з Angular CDK testing для measurement in tests."
    commonMistakes:
      - "Виправляють симптом (додають OnPush) без розуміння root cause (Zone.js trigger)"
      - "Не вимірюють after optimization — можливо OnPush не помогло якщо є explicit markForCheck()"
    relatedQuestions: ["b11t4q2", "b11t4q4"]
  - id: "b11t4q4"
    level: "senior"
    question: "Як використовувати Chrome DevTools Performance tab для profiling Angular-specific issues?"
    referenceAnswers:
      junior: "Chrome DevTools Performance tab записує все що відбувається в браузері: JavaScript виконання, layout, paint. Можна знайти довгі tasks що блокують UI."
      mid: "Chrome Performance tab: Record interaction → Stop → аналізувати. Long Tasks (> 50ms червона трикутник) = INP degradation. Call stack: ідентифікує якій код повільний. Angular functions у стеку: ApplicationRef.tick(), checkView, detectChanges. Event Listeners: click → Angular zone → CD. Layout та Paint після CD."
      senior: "Chrome Performance analysis для Angular apps: 1) Timeline overview: JS (yellow), Rendering (purple), Painting (green). Long Tasks (red flag > 50ms) = INP problems. 2) Angular-specific callstack patterns: `ApplicationRef.tick` → `checkView` → component template functions. Identify: which component template is CPU-heavy. 3) Flame chart (Bottom-Up vs Call Tree): Bottom-Up → most expensive JS by self time. Look for Angular template functions, pipe transforms, computed expressions. 4) Layout trashing: forced synchronous layout (читаємо DOM properties між writes). Pattern: `element.style.height = x; element.clientHeight` in loop → layout thrashing. Angular template expressions that read layout properties. 5) Memory profiling: Heap snapshot before/after navigation. Look for: Angular component instances not GC'd (route reuse issue), Observable subscriptions accumulating. 6) User Timing marks: `performance.mark('ng-cd-start')` before tick, `performance.measure(...)` after. Shows custom events in Timeline."
      staff: "Chrome DevTools для Angular production investigation. Advanced workflow: 1) INP attribution workflow: Chrome Performance tab → Interactions panel (Chrome 113+). Click interaction → shows input delay, processing time, presentation delay. Processing time = Angular CD duration. 2) Memory leak investigation: heap snapshot before navigate, after navigate, after navigate back. Detached DOM nodes = leak. Angular: unsubscribed Observables, stored DetachedRouteHandles без TTL, global event listeners. 3) Network + Angular correlation: waterfall timing → identify lazy chunk loads. Angular Router events (NavigationStart) alignment з network requests. 4) CPU throttling: 6x throttle для simulating low-end Android. Angular DevTools + Chrome Performance simultaneously: Angular Profiler shows CD cycles, Chrome shows systemic impact. 5) Core Web Vitals in Performance tab (Chrome 112+): LCP, CLS, INP overlaid on timeline. Correlation: which Angular code caused LCP element delay? Which CD cycle caused CLS? 6) Recording strategy для production investigation: Chrome Canary + experimental flags → more detailed Angular internals in Timeline. `--enable-logging=stderr` для verbose Angular diagnostics. 7) User.timing custom marks: Angular interceptor that marks CD start/end → visible in Performance tab. `NgZone.onMicrotaskEmpty` → `performance.mark('cd-end')`. 8) Lighthouse CI integration: Lighthouse Performance tab results = aggregated Chrome Performance data."
    commonMistakes:
      - "Не використовують CPU throttling — desktop 60fps може маскувати проблеми що реальні для mobile users"
      - "Аналізують тільки Call Tree і ігнорують Bottom-Up view — Bottom-Up краще для ідентифікації найдорожчих функцій"
    relatedQuestions: ["b11t4q3", "b11t4q5"]
  - id: "b11t4q5"
    level: "staff"
    question: "Як побудувати real-world profiling workflow для Angular app і які інструменти комбінувати?"
    referenceAnswers:
      junior: "Спочатку Angular DevTools для component-level аналізу, потім Chrome Performance для детального timing."
      mid: "Workflow: 1) Визначити проблему (user reports slow interaction). 2) Reproduce locally. 3) Angular DevTools Profiler → record interaction → ідентифікувати повільні components. 4) Chrome Performance tab → CPU throttling → ідентифікувати Long Tasks. 5) Fix → measure again. 6) Production: web-vitals RUM для підтвердження."
      senior: "Production performance investigation workflow: 1) Start з RUM data (web-vitals, Sentry): P75 INP > 200ms on '/checkout' page. 2) Reproduce: use Chrome with 6x CPU throttle on target page. Angular DevTools Profiler → record checkout interaction. 3) Identify: 'OrderFormComponent' — 45ms CD duration. 400+ component checks. 4) Angular Component tree: confirm OrderFormComponent is Default strategy. 5) Chrome Performance: Long Task 150ms on click. Call stack: ApplicationRef.tick → OrderFormComponent → getAvailableShippingMethods (expensive sync). 6) Fix: OnPush + memoize shipping methods with computed signal. 7) Re-measure: CD duration 2ms. Long Task < 10ms. 8) Production RUM: confirm P75 INP improved. 9) Add to CI: Angular performance benchmark для checkout route."
      staff: "Comprehensive profiling ecosystem design. Tool selection matrix: Angular DevTools Profiler: CD cycle analysis, component-level bottlenecks, OnPush effectiveness. Use: developer workflow, pre-release investigation. Chrome Performance tab: browser-level impact (layout, paint, GC), INP attribution, memory leaks. Use: deep investigation, production issue reproduction. web-vitals library (RUM): real user field data, P75/P95 segmented by device/network. Use: production monitoring, KPIs. Lighthouse CI: synthetic performance regression detection. Use: CI pipeline, PR gates. WebPageTest: deep waterfall, filmstrip, multi-location. Use: pre-release validation. SpeedCurve/Calibre: long-term performance trend. Use: monthly reviews. Workflow integration: 1) Development: Angular DevTools as primary. CI: Lighthouse CI. Production: web-vitals RUM + alerting. 2) Incident response: RUM alert → reproduce с Chrome Performance → Angular DevTools → identify → fix → validate с Lighthouse CI → confirm з RUM. 3) Profiling infrastructure: `NgModule`-level performance interceptor for development: wrap ApplicationRef.tick() with performance.mark() → visible in Chrome Performance. Custom Angular performance dashboard: CD cycles per route, hydration time, lazy chunk load times. 4) Regression testing: PerformanceObserver in e2e tests: `new PerformanceObserver(list => { list.getEntries().forEach(entry => { if (entry.duration > 50) fail('Long Task detected') }) }).observe({ entryTypes: ['longtask'] })`. 5) Team culture: monthly performance review meeting, per-PR bundle analysis, performance champion per team."
    commonMistakes:
      - "Profiling у development mode і очікують точних цифр — development Angular має extra checks, production 2-3x faster"
      - "Ігнорують mobile — desktop profiling дає неправильне уявлення про real user experience"
    relatedQuestions: ["b11t4q4", "b11t4q3"]
---

## Core Concept

**English definition:** Angular DevTools is a Chrome/Firefox browser extension that provides an Angular-aware debugger exposing the component tree inspector and a Change Detection profiler with flame-chart visualization, enabling developers to identify which components are being checked, how long each CD cycle takes, and where performance bottlenecks originate at the Angular framework level.

**Пояснення:** Angular DevTools — primary tool для розуміння що Angular робить під капотом під час роботи app. Component tree inspector дозволяє бачити live state кожного компонента (inputs, signals, properties). Profiler показує скільки часу займає Change Detection для кожного компонента і скільки разів він перевіряється. Без цього інструменту — performance optimization є "стрільба в темряві". З ним — точно видно де проблема.

**Яку проблему вирішує:** Без DevTools профілювання Angular app = stack traces у Chrome Performance з незрозумілими Angular internals (`ApplicationRef.tick`, `checkView`). Angular DevTools перекладає ці на human-readable: "UserListComponent CD took 45ms, checked 200 times per interaction". Це дозволяє цільову оптимізацію замість спроб і помилок.

**Як працює під капотом:**

```
Angular DevTools Chrome Extension architecture:

Content Script (injected in page)
    ↓
Accesses window.__ngDevtools__ (set by Angular when devMode)
    ↓
Ivy Debug APIs:
  ng.getComponent(domElement) → ComponentRef
  ng.getContext(domElement) → component class instance
  ng.getDirectives(domElement) → directive instances
  ɵgetLView(domElement) → Ivy LView (internal)
    ↓
DevTools Panel (separate Chrome devtools tab)
    ↓
Component Tree: traverses LView hierarchy
Profiler: wraps ApplicationRef.tick() with:
  performance.mark('ng-before-cd')
  // ... change detection runs ...
  performance.mark('ng-after-cd')
  performance.measure('cd-cycle', 'ng-before-cd', 'ng-after-cd')
  Record: which components checked, duration, view ops
```

Profiler data structure per recording:
```typescript
interface CDProfile {
  cycles: CDCycle[];
}

interface CDCycle {
  duration: number;         // Total CD cycle time (ms)
  components: ComponentProfile[];
}

interface ComponentProfile {
  name: string;             // Component class name
  duration: number;         // Time in this component's CD
  changeCount: number;      // Number of bindings changed
  children: ComponentProfile[];
}
```

Flame chart reading:
```
Timeline (horizontal = time, total 300ms):

Root AppComponent [============================] 280ms
  HeaderComponent [==] 5ms
  MainComponent [========================] 250ms
    UserListComponent [===================] 200ms  ← BOTTLENECK
      UserCardComponent × 100 [==================]
    FooterComponent [=] 1ms
```

**Trade-offs та обмеження:**

- Angular DevTools тільки в development mode — Ivy debug APIs stripped в production builds
- Profiler adds overhead by wrapping tick() — recorded timings slightly inflated vs real
- No network correlation — Angular Profiler doesn't show HTTP requests
- Component tree може бути повільним для дуже великих trees (500+ components)
- Firefox support: limited compared to Chrome extension

**Версійність:** Angular DevTools introduced Angular 12 (initial release). Angular 14: improved signal support display. Angular 16: signal state visible in component inspector. Angular 17: @defer blocks visible in component tree, hydration status. Angular 18: incremental hydration profiling. Angular 21: signal-triggered CD cycles shown explicitly in Profiler. Available в Chrome Web Store і Firefox Add-ons.

## Deep Details

### Edge Cases

**Angular DevTools і production:** DevTools shows "Angular not detected" для production builds. If `enableDebugTools(appRef)` called manually in production — DevTools works but adds overhead. Never в production apps.

**Profiler і Change Detection Zone.js:** Profiler records ApplicationRef.tick() calls. Zone.js triggers many ticks. Profiler shows ALL ticks including Zone.js-triggered idle ticks (від third-party libs). Filter: focus on ticks triggered by user actions.

**Component tree і lazy-loaded routes:** After navigating to lazy route — component tree updates to show new components. Lazy-loaded components identified. @defer blocks shown as "Deferred" nodes.

**Signal state in DevTools:** Angular 17+ DevTools shows signal values in component inspector. Computed signals show memoized value. Signal inputs show current value. Live update as signals change.

**Ivy debug API і prototype chain:** `ng.getComponent(el)` traverses up the DOM if el is not direct component host. Can get wrong component if DOM structure complex. Use `ng.getDirectives(el)` for precise directive list.

**Memory leak detection з DevTools:** Component tree shows components that should have been destroyed after navigation but remain. Symptom: count of component instances grows. Use with Chrome Memory profiler for heap analysis.

### Junior vs Senior Understanding

**Junior** knows: open Angular DevTools, record profiling, see flame chart, identify wide bars = slow components.

**Senior** understands:

1. **Flame chart encoding:** Width = time (not work). Color coding (green/yellow/red). Parent bar includes children time. Click → component source file.

2. **CD cycle patterns:** Idle CD cycles (spurious Zone.js), frequency analysis, OnPush absence patterns.

3. **Component inspector deep usage:** Inspect state of failing component without console.log. Signal values, inputs, service state.

4. **Chrome Performance correlation:** Angular Profiler for CD-level, Chrome Performance for browser-level (layout, paint, GC).

5. **@defer visibility:** Deferred blocks in component tree, hydration status.

### Deprecation & Migration Path

- **Angular DevTools `enableDebugTools()`:** `enableDebugTools(appRef)` — manually enables DevTools APIs. Mostly unnecessary if using Angular CLI development mode (automatic). Use only for specific cases (testing in near-production).
- **`ng.probe()` (legacy):** Old View Engine API for element inspection — removed in Ivy. Angular DevTools uses Ivy-native `ng.getComponent()`, `ng.getDirectives()`.
- **Zone.js debugging:** Before Angular DevTools, debugging CD = manual logging + Chrome Performance. Now: DevTools Profiler is the standard.

### Connections to Other Concepts

- **Runtime Optimization:** DevTools Profiler is the primary tool for identifying what to optimize (OnPush, trackBy, computed signals)
- **Change Detection:** Profiler visualizes exactly when and why CD runs
- **Deferrable Views:** @defer status visible in component tree (deferred vs hydrated)
- **Core Web Vitals:** INP optimization guided by Profiler findings

## Examples

### Basic Usage

```typescript
// Enabling Angular DevTools for local development
// main.ts — automatically works in development mode (default CLI config)
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig);

// DevTools automatically available when:
// 1. Running ng serve (development mode)
// 2. Or ng build --configuration development

// Manual enablement for specific scenarios:
import { ApplicationRef } from '@angular/core';
import { enableDebugTools } from '@angular/platform-browser';

bootstrapApplication(AppComponent, appConfig).then(appRef => {
  // Only in development builds!
  if (isDevMode()) {
    enableDebugTools(appRef);
  }
});
```

```typescript
// Component inspector usage via console (DevTools Console tab)
// Select element in Elements tab, then in Console:

// Get Angular component instance for selected element
// $0 = currently selected DOM element
const component = ng.getComponent($0);
console.log(component); // Full class instance with all properties

// Get all directives on element
const directives = ng.getDirectives($0);
console.log(directives);

// Get component context (same as component in most cases)
const context = ng.getContext($0);

// Manually trigger CD for debugging
const cdr = ng.getInjector($0).get(ChangeDetectorRef);
cdr.detectChanges();

// Get injector for DI debugging
const injector = ng.getInjector($0);
const myService = injector.get(MyService);
console.log(myService.state);

// Update component property and see change (development only!)
component.someProperty = 'new value';
ng.applyChanges($0); // Triggers CD
```

### Production Scenario

```typescript
// Profiling workflow example: finding and fixing slow OrderFormComponent
// STEP 1: Record profiling in Angular DevTools
// - Open Angular DevTools (F12 > Angular tab)
// - Click "Profiler" > "Start Recording"
// - Click "Submit Order" button
// - Stop Recording

// STEP 2: Flame chart shows:
// OrderFormComponent: 80ms, 500+ component checks
// Root cause: Default ChangeDetection + expensive template expression

// BEFORE (slow):
@Component({
  // No OnPush — checked on every CD cycle
  template: `
    <!-- SLOW: getAvailableShippingMethods() runs on every CD check -->
    @for (method of getAvailableShippingMethods(); track method.id) {
      <shipping-option [method]="method" />
    }
    <!-- SLOW: expensive calculation inline -->
    <p>Total: {{ calculateOrderTotal() | currency }}</p>
  `
})
export class OrderFormComponent {
  orderItems = signal<OrderItem[]>([]);
  selectedRegion = signal<string>('');

  // Called on every CD cycle — expensive
  getAvailableShippingMethods(): ShippingMethod[] {
    return ALL_SHIPPING_METHODS.filter(m =>
      m.supportedRegions.includes(this.selectedRegion()) &&
      m.maxWeight >= this.getTotalWeight()
    );
  }

  calculateOrderTotal(): number {
    return this.orderItems().reduce((sum, item) => sum + item.price * item.qty, 0);
  }
}

// AFTER (optimized — based on DevTools findings):
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // FIX 1: OnPush
  template: `
    <!-- FIX 2: computed signal — memoized -->
    @for (method of availableShippingMethods(); track method.id) {
      <shipping-option [method]="method" />
    }
    <!-- FIX 3: computed signal for total -->
    <p>Total: {{ orderTotal() | currency }}</p>
  `
})
export class OrderFormComponent {
  orderItems = signal<OrderItem[]>([]);
  selectedRegion = signal<string>('');

  // FIXED: computed — only recomputes when orderItems() or selectedRegion() changes
  availableShippingMethods = computed(() =>
    ALL_SHIPPING_METHODS.filter(m =>
      m.supportedRegions.includes(this.selectedRegion()) &&
      m.maxWeight >= this.getTotalWeight()
    )
  );

  orderTotal = computed(() =>
    this.orderItems().reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  private getTotalWeight = computed(() =>
    this.orderItems().reduce((sum, item) => sum + item.weight * item.qty, 0)
  );
}

// AFTER OPTIMIZATION:
// Angular DevTools Profiler shows:
// OrderFormComponent: 2ms (down from 80ms)
// Component checks: ~5 (down from 500+)
// CD cycles per click: 1 (down from 3)
```

```typescript
// Custom performance markers for Angular DevTools integration
// (visible in Chrome Performance tab under User Timing)
@Injectable({ providedIn: 'root' })
export class PerformanceMarkerService {
  private appRef = inject(ApplicationRef);

  /**
   * Mark CD cycle boundaries for Chrome Performance correlation
   * Use in development to correlate Angular CD with browser events
   */
  startCDMonitoring(): void {
    // Subscribe to Angular's stable/unstable signals
    this.appRef.isStable.subscribe(isStable => {
      if (!isStable) {
        performance.mark('angular-cd-start');
      } else {
        performance.mark('angular-cd-end');
        try {
          performance.measure(
            'angular-cd-cycle',
            'angular-cd-start',
            'angular-cd-end'
          );
        } catch {
          // Guards against mismatched marks
        }
      }
    });
  }
}

// Usage in development: inject and call startCDMonitoring()
// Then open Chrome Performance tab > User Timing
// See "angular-cd-cycle" overlaid on timeline
```

### Anti-Example

```typescript
// WRONG: Profiling in production mode conclusions applied to dev build
// Production mode: Angular strips debug APIs, tree-shaking removes unused code,
// minification renames functions, no extra checks
// Development mode: 2-3x slower due to extra assertions and debug overhead

// If you profile in development and see 30ms CD → production might be 10ms
// Profile in development for RELATIVE comparison (before vs after optimization)
// Use web-vitals RUM for ABSOLUTE production numbers

// WRONG: Only looking at widest bar in profiler
// Scenario: UserListComponent 50ms (wide bar, but 1 check)
//           DataService 1ms (narrow bar, but 10,000 checks)
// The FREQUENT 1ms component may contribute more total time
// Sort by: Total Time (bar width) AND by Count
// Both matter: reduce duration AND reduce frequency

// WRONG: Using ng.getComponent() in production for debugging
export function debugInProduction(el: HTMLElement): void {
  // WRONG: ng.getComponent() not available in production!
  const component = ng.getComponent(el); // TypeError: ng is not defined
}

// CORRECT: Guard with isDevMode()
export function safeDebug(el: HTMLElement): void {
  if (isDevMode()) {
    const component = ng.getComponent(el);
    console.log('Component state:', component);
  }
}

// WRONG: No baseline measurement before optimization
// Just adding OnPush without measuring whether it helps
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Added OnPush without checking if component was actually a bottleneck
  // Might be premature optimization on a component that was never checked frequently
})
export class LowValueOptimizationComponent {}

// CORRECT: Measure-first approach
// 1. Angular DevTools Profiler → record → identify actual bottlenecks
// 2. Focus on components with high duration × high frequency
// 3. Apply OnPush → re-record → verify improvement
// 4. Only optimize where DevTools shows measurable bottleneck
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Профілювання в development mode і висновки про production numbers | Dev mode 2-3x повільніший через extra checks — абсолютні числа некоректні | Профілювати відносні порівняння в dev; абсолютні числа — web-vitals RUM в production |
| Дивляться тільки на найширший bar без frequency аналізу | 1ms component × 10,000 checks = 10s загального CD time — критично | Аналізувати Total Time = duration × frequency; sort by both metrics |
| `ng.getComponent()` без `isDevMode()` guard | `ng` undefined в production → runtime error | Завжди guard: `if (isDevMode()) { ng.getComponent(el) }` |
| Додають OnPush без вимірювання що component є bottleneck | Premature optimization — усклажнює код без benefit | Profiler first → identify actual bottlenecks → then optimize |
| Ігнорують idle CD cycles у записі | Spurious ticks від Zone.js у background = постійне background CD | Record idle state → no cycles expected; будь-які → investigate Zone.js trigger |

## Interview Block

### [L1 — Warm-up] Що таке Angular DevTools і які основні функції він надає?

**Signal being tested:** Awareness of Angular-specific debugging tooling і розуміння що DevTools = development only.

**What the interviewer expects:** Chrome extension, Component tree inspector, Profiler tab, development mode only, Ivy required.

**How to probe deeper:** "Чи можна використовувати Angular DevTools в production build? Що там відбувається?"

**Reference answer:** Angular DevTools — Chrome/Firefox extension для Angular debugging. Два основні tabs: Components (live component tree inspection — inputs, signals, services state) і Profiler (CD cycle flame chart — які components check, скільки часу). Тільки в development mode — Ivy debug APIs stripped в production. Chrome Web Store. Works Angular 9+ (Ivy). Stable/feature-rich з v12.

**Common mistakes:** Думають DevTools = production monitoring tool; не знають про development mode requirement.

### [L2 — Mid] Як використовувати Profiler tab для знаходження slow components?

**Signal being tested:** Практична здатність інтерпретувати flame chart і ідентифікувати actionable bottlenecks.

**What the interviewer expects:** Record → action → stop. Flame chart: width = time, color coding, bar hierarchy. Click bar = component details. Patterns: wide bar = slow, many bars = frequent.

**How to probe deeper:** "Flamechart показує UserListComponent 50ms. Наступні кроки?"

**Reference answer:** Record в Profiler → trigger slow interaction → Stop. Flame chart: horizontal = time, vertical = component nesting. Width = CD duration. Click bar: component name, duration, change count, source file. Investigation: 50ms UserListComponent — перевірити CD strategy (Default vs OnPush). Багато thin bars = frequent re-checks. Compare: same component in multiple CD cycles = markForCheck() excessive або Zone.js trigger.

**Common mistakes:** Дивляться тільки на один bar; не аналізують frequency across multiple CD cycles.

### [L3 — Senior] Як виявити зайві change detection cycles?

**Signal being tested:** Systematic troubleshooting approach — від symptom (slow) до root cause (spurious Zone.js ticks, unnecessary markForCheck).

**What the interviewer expects:** Idle recording (0 cycles expected), frequency analysis per interaction, OnPush absence pattern, Chrome Performance correlation, Zone.js trigger identification.

**How to probe deeper:** "Записали профіль у idle state і бачите CD cycle кожні 200ms. Що перевірити?"

**Reference answer:** Idle recording: 0 CD cycles очікується. Cycles в idle = spurious Zone.js. Investigate: setInterval без runOutsideAngular, WebSocket messages в zone, third-party polling. Per-interaction: > 2 cycles = amplification. Causes: nested markForCheck(), signal cascades, VCR.createEmbeddedView in loop. Chrome Performance: Long Task source. Fix: runOutsideAngular для third-party, debounceTime для high-frequency signals. Verify: re-record → idle = 0 cycles.

**Common mistakes:** Фікусуються на duration, ігнорують frequency; додають OnPush без знаходження root cause.

### [L4 — Staff/Principal] Як побудувати real-world profiling workflow і які інструменти комбінувати?

**Signal being tested:** Holistic performance engineering mindset — від production RUM до developer tooling до CI regression prevention.

**What the interviewer expects:** RUM → reproduce → Angular DevTools → Chrome Performance → fix → validate → CI gate. Tool selection matrix per use case.

**How to probe deeper:** "web-vitals показує P75 INP 350ms на checkout page. Walk через весь investigation workflow."

**Reference answer:** 1) RUM: P75 INP 350ms on checkout → isolate users/devices. 2) Reproduce: 6x CPU throttle, Chrome Performance record checkout action. 3) Angular DevTools Profiler: record click → identify CheckoutFormComponent 80ms, Default strategy. 4) Chrome Performance: Long Task 150ms, call stack показує expensive sync calculation. 5) Fix: OnPush + computed signals для expensive derivations. 6) Re-measure: Angular Profiler 3ms, Chrome Long Task < 10ms. 7) Production validation: web-vitals RUM P75 INP improves. 8) CI gate: Lighthouse CI assertion INP < 200ms на checkout route.

**Common mistakes:** Профілюють тільки у dev mode без CPU throttle; не вимірюють після optimization; відсутній CI regression prevention.

---

## Summary

### Key Points
- Angular DevTools (Chrome/Firefox extension) — development only: component tree inspector + CD profiler
- Profiler flame chart: width = CD duration, color = severity (green < 1ms, red > 3ms)
- Investigation workflow: idle recording (0 cycles expected) → interaction recording → identify wide + frequent bars
- `ng.getComponent($0)` у console — live component state inspection без console.log
- Chrome Performance tab: browser-level impact (Long Tasks > 50ms = INP degradation)
- Tool stack: Angular DevTools (CD-level) + Chrome Performance (browser-level) + web-vitals RUM (production)
- Profiling → measure → fix → re-measure: завжди порівнювати relative, не absolute values

### Elevator Pitch (2 minutes)
Angular DevTools — Chrome extension для debugging Angular internals. Два ключових tabs: Components (live tree inspection: inputs, signals, services, live state без console.log) і Profiler (Change Detection flame chart). DevTools тільки в development mode — Ivy debug APIs stripped в production. Profiler workflow: Record → виконати slow action → Stop → аналізувати flame chart. Wide bars = slow CD duration. Many bars = high frequency. Click bar → component name + source file. Red bar (> 3ms) = optimization candidate. Idle recording: 0 cycles expected — будь-які cycles = spurious Zone.js trigger. Investigation: Angular Profiler для CD-level (який component повільний) → Chrome Performance для browser-level (Long Tasks > 50ms = INP degradation). Real-world workflow: web-vitals RUM alert (P75 INP > 200ms) → reproduce з CPU throttle → Angular DevTools → знайти bottleneck → fix → re-measure → Lighthouse CI gate для regression prevention.
