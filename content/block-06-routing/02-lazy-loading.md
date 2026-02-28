---
title: "Lazy Loading: loadComponent and loadChildren"
block: 6
topic: 2
slug: "lazy-loading"
difficulty: 3
sinceVersion: "8"
tags: ["lazy-loading", "loadComponent", "loadChildren", "code-splitting", "dynamic-import", "preloading"]
relatedTopics: ["router-fundamentals", "guards", "preloading-strategies", "performance", "di-internals"]
interviewQuestions:
  - id: "b6t2q1"
    level: "junior"
    question: "Що таке lazy loading в Angular Router і як його реалізувати?"
    referenceAnswers:
      junior: "Lazy loading — завантаження компоненту або модуля тільки коли user переходить на відповідний route. Використовують loadComponent або loadChildren з dynamic import. Зменшує початковий bundle size."
      mid: "Lazy loading: `loadComponent: () => import('./feature/feature.component').then(m => m.FeatureComponent)` — окремий webpack chunk. loadChildren: `() => import('./feature/feature.routes').then(m => m.FEATURE_ROUTES)` — lazy routes array. Webpack автоматично code-splits dynamic imports. Standalone components — завжди loadComponent. NgModule-based — loadChildren з NgModule."
      senior: "Lazy loading mechanism: dynamic import() → webpack bundle boundary. Router engine: при navigation до lazy route — checks if chunk loaded. Якщо ні — calls import factory function → network request → chunk loaded → route activated. loadComponent (Angular 14+) — standalone component: import повертає Component class напряму (або via .then(m => m.Component)). loadChildren — модуль або routes array: `() => import('./routes').then(m => m.ROUTES)` для standalone routes. Перевага loadComponent над loadChildren для single component: одна мережева операція, прямо завантажує component. loadChildren для feature з sub-routes: ціла feature routing tree lazy. Route-level injector: lazy route автоматично creates EnvironmentInjector з route providers. Chunk naming: `import(/* webpackChunkName: 'feature' */ './feature')` — named chunks для debugging."
      staff: "Lazy loading internals: webpack (або esbuild) static analysis dynamic import() → extracts to separate chunk. Angular Router chunk loading: `RouterConfigLoader.loadChildren()` calls import factory, catches errors (with retry optional). Chunk caching: once loaded — cached in memory and browser cache. Network failure: navigation fails, NavigationError event. Graceful handling: canLoad guard або EMPTY observable. loadComponent — Angular compiler treats standalone component as separate compilation unit — tree-shaking per chunk. Multiple lazy routes sharing component: Angular Router handles deduplication in routing tree. Preloading strategy interaction: PreloadAllModules preloads all lazy chunks in background after initial load. QuickLinkStrategy — prefetch on viewport/hover. Custom strategy: `preload(route, load): Observable<any>` — call load() to trigger. Size optimization: shared chunks for common code across lazy routes (splitChunks в webpack config). angular.json: `budgets` — enforce chunk size limits. Differential loading (legacy): `.es5.js` chunks для старих браузерів — removed Angular 13+."
    commonMistakes:
      - "Використовують loadChildren для standalone components замість loadComponent"
      - "Не perennially-cached: думають кожен navigation re-fetches chunk"
    relatedQuestions: ["b6t2q2", "b6t2q3"]
  - id: "b6t2q2"
    level: "mid"
    question: "Яка різниця між loadComponent і loadChildren і коли кожен використовувати?"
    referenceAnswers:
      junior: "loadComponent для одного компоненту, loadChildren для групи routes або NgModule."
      mid: "loadComponent: standalone component, single chunk, no sub-routes (або router outlet в component). loadChildren: routes array або NgModule, feature with multiple sub-routes. loadChildren краще коли feature має власну routing hierarchy. loadComponent — для leaf routes або компонентів з власним router-outlet. Вибір: один компонент без deep nesting → loadComponent. Feature з кількома routes → loadChildren з routes file."
      senior: "loadComponent vs loadChildren design decision: loadComponent — `() => import('./page.component')` — TypeScript auto-resolves default export або named export. loadChildren — `() => import('./feature.routes').then(m => m.FEATURE_ROUTES)` — returns Routes array. Важлива відмінність: loadChildren routes створюють EnvironmentInjector для той частині дерева. loadComponent + children: `{ path: 'feature', loadComponent: ..., children: [...] }` — lazy parent component, eager children. loadComponent + loadChildren children: `{ path: 'feature', loadComponent: ..., loadChildren: () => import('./children.routes') }` — both parent і children lazy. Multi-chunk strategy: core route tree eager, feature routes lazy. Routing module vs routes array: NgModule loadChildren — NgModule provides services через providers:[] + routing declarations. Routes array loadChildren — standalone, lightweight, providers via route providers.'"
      staff: "loadComponent і loadChildren — різні levels lazy loading з різними trade-offs. loadComponent: per-component chunk — maximum granularity. Overhead: N routes = N chunks = N network requests (mitigated by preloading). loadChildren routes array: groups multiple components in one chunk — fewer requests, better for feature cohesion. Hybrid strategy: loadChildren at feature boundary (one chunk per feature), loadComponent for large sub-pages. Chunk size monitoring: angular build --stats-json → webpack-bundle-analyzer. Target: <200KB per chunk (gzipped). Shared dependencies: Angular framework chunks shared across all lazy chunks via optimization.splitChunks. Preloading consideration: loadComponent preloads component AND its dependencies. If component imports heavy library — preloaded too. Evaluate: `loadChildren` для grouping + shared libs = better preload performance. SSR implications: lazy routes — server-side rendering renders them if initial URL matches. Server must handle all potential URLs. NgUniversal + lazy routes: `RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' })` для SSR. Standalone: `withEnabledBlockingInitialNavigation()` у provideRouter."
    commonMistakes:
      - "loadChildren з NgModule у standalone app — зайва складність"
      - "Не групують пов'язані компоненти в один lazy chunk — занадто багато мережевих запитів"
    relatedQuestions: ["b6t2q1", "b6t2q3"]
  - id: "b6t2q3"
    level: "senior"
    question: "Як lazy loading взаємодіє з DI ієрархією і route-scoped providers?"
    referenceAnswers:
      junior: "Lazy loaded routes мають свій injector де можна зареєструвати сервіси."
      mid: "Lazy route creates EnvironmentInjector з providers у route config. Сервіси в providers: [] — scoped до цього route і його children. При навігації з route — injector destroyed і сервіси теж. Це ізолює feature state і автоматично очищає."
      senior: "Lazy route EnvironmentInjector lifecycle: create при першій активації → destroyed при route deactivation. Route providers: `{ path: 'feature', loadComponent: ..., providers: [FeatureService, FeatureStore] }` — services exist only while feature active. Service scope: FeatureService — available тільки в feature route і children. Parent route services — available якщо not shadowed. DI resolution: NodeInjector (component) → NodeInjector (parents) → EnvironmentInjector (feature route) → EnvironmentInjector (root) → NullInjector. Route injector destroyed → OnDestroy called on services → DestroyRef callbacks. providedIn:'root' services — не affected by route injector destruction. NgRx Signal Store per route: `{ providers: [provideState(featureState)] }` — state exists route lifetime."
      staff: "Route-scoped DI — архітектурний pattern з profound implications. Memory management: route sервіс з WebSocket connection або polling interval — cleaned up automatically при navigation. No memory leaks якщо use DestroyRef properly. Injector hierarchy optimization: route-scoped FeatureService vs root FeatureService — route-scoped: isolated per feature, destroyed з route. Root: global singleton, persists. Team convention: feature-specific services in route providers, cross-feature services in root. Testing lazy routes: TestBed з RouterTestingHarness — provides route environment, activates route, creates correct injector hierarchy. Isolating route in tests: `configureTestingModule({ providers: [...routeProviders] })` — simulate route injector. Advanced: `EnvironmentInjector.runInContext()` для testing route-level code. Common pitfall: service з providedIn:'root' AND in route providers — два instances. Root instance і route-scoped instance. Components in route tree use route-scoped; root-injected components use root. Можливе неочікуване behavior якщо service has state."
    commonMistakes:
      - "Сервіс в route providers з providedIn:'root' — два instances, unexpected state"
      - "Не очищають active subscriptions в route services — DestroyRef.onDestroy()"
    relatedQuestions: ["b6t2q2", "b6t2q4"]
  - id: "b6t2q4"
    level: "senior"
    question: "Що таке preloading strategies і як вибрати правильну для свого app?"
    referenceAnswers:
      junior: "Preloading завантажує lazy chunks у фоні після initial load. PreloadAllModules завантажує всі lazy routes відразу."
      mid: "Preloading strategies: NoPreloading (default) — load on demand. PreloadAllModules — preload all lazy chunks in background. Custom strategy — implements PreloadingStrategy, `preload(route, load)` метод. QuicklinkStrategy (CDK) — preload при hover над RouterLink. `withPreloading(strategy)` у provideRouter."
      senior: "PreloadingStrategy API: `preload(route: Route, load: () => Observable<any>): Observable<any>`. Return load() — triggers preload. Return EMPTY — don't preload. Custom strategy examples: preload based on route data `{ path: ..., data: { preload: true } }`. Role-based: preload admin routes тільки для admin users. Device-based: skip preloading on 2G networks (Network Information API). QuicklinkStrategy: IntersectionObserver + RouterLink — prefetch when link in viewport. `withPreloading(QuicklinkStrategy)` від ngx-quicklink. Network-aware: check `navigator.connection.saveData` або `navigator.connection.effectiveType`."
      staff: "Preloading strategy selection — performance budget decision. Metrics that matter: Time to Interactive (TTI), FCP. PreloadAllModules: maximizes hit rate при navigation (chunk already loaded). Cost: bandwidth для ненавігованих routes. Suitable: fast networks, authenticated apps (user likely navigates). NoPreloading: minimize bandwidth. User navigates → delay (first load). Suitable: unauthenticated landing pages, low-traffic features. Custom strategy: balance. `withPreloading()` — background loading after initial route. Implementation consideration: preloading triggers import() — Angular caches loaded modules, subsequent navigation instant. Interaction з Service Workers: SW can precache lazy chunks від manifest. Combine: SW precaches critical chunks, preloading strategy handles priority ordering. Chunk loading failures: preloading failures are silent — navigation still works (loads on demand). Angular 17: `withViewTransitions()` pairs well with preloading — transitions smooth only if chunks pre-loaded. Measurement: Lighthouse network waterfall, WebPageTest — compare preload vs no-preload for real users on target device/network."
    commonMistakes:
      - "PreloadAllModules для apps з великими features — bandwidth waste на мобільних пристроях"
      - "Custom strategy без network detection — preloads на slow connections"
    relatedQuestions: ["b6t2q3", "b6t2q5"]
  - id: "b6t2q5"
    level: "staff"
    question: "Як оптимізувати bundle splitting для enterprise app з 50+ lazy routes?"
    referenceAnswers:
      junior: "Lazy loading кожного route, спільні компоненти у shared module, preloading для основних routes."
      mid: "Аналіз через webpack-bundle-analyzer. Shared chunks — Common code extracted автоматично. loadChildren для feature bundles. Preloading стратегія для критичних features. Budget limits в angular.json."
      senior: "Bundle optimization strategy: 1) Feature-level chunks: loadChildren per feature. 2) Shared chunks: webpack splitChunks auto-extracts common deps. 3) Angular Material tree-shaking: import тільки needed components. 4) Heavy third-party (charts, PDF): lazy in @defer або separate chunk via dynamic import. 5) Chunk naming: webpackChunkName comments for debugging. 6) Budget enforcement: angular.json budgets for initial and lazy. 7) Source maps: separate для production debugging."
      staff: "50+ lazy routes chunk optimization needs systemic approach. Analysis first: `ng build --stats-json` → webpack-bundle-analyzer visualization. Identify: largest chunks, duplicated deps, underutilized routes. Grouping strategy: group by user journey not by file structure. Example: checkout flow (cart, payment, confirmation) = one chunk. Admin section = one chunk. High-traffic routes = preloaded. Shared utilities: create shared chunk: code accessed by 3+ lazy routes auto-extracted by webpack. Configure splitChunks: `minChunks: 3` threshold. Angular library chunks: @angular/material — if imported in lazy route = duplicated per chunk. Solution: CommonChunk strategy або import in root. Lazy component chunking inside routes: `@defer` inside lazy route = further sub-chunking. Two levels of laziness. Route chunk analysis: track which users visit which routes (analytics). Unused routes (0.1% traffic) — no preloading, no optimization effort. HTTP/2 multiplexing: smaller chunks OK — multiple parallel requests. HTTP/1.1: fewer larger chunks better. Target devices: measure on P75 device/network combo from real analytics. esbuild chunks: Angular 17+ with esbuild — different chunking algorithm. Verify chunk config works with both webpack and esbuild. Progressive enhancement: critical path first, everything else lazy + preloaded."
    commonMistakes:
      - "Оптимізують без measurement — guess-based optimization"
      - "Ігнорують shared chunks — third-party libs duplicated in each feature chunk"
    relatedQuestions: ["b6t2q4", "b6t2q3"]
---

## Core Concept

**English definition:** Lazy loading in Angular Router defers the download of component or route JavaScript bundles until the user navigates to that route, using `loadComponent` (standalone component) or `loadChildren` (routes array/NgModule), creating separate webpack chunks via dynamic `import()` to reduce initial bundle size.

**Пояснення:** Lazy loading = code splitting через dynamic import(). `loadComponent: () => import('./page.component')` — окремий chunk завантажується тільки при навігації. `loadChildren: () => import('./feature.routes').then(m => m.ROUTES)` — routes array як chunk, feature з sub-routes. Webpack автоматично виокремлює dynamic imports. Lazy route також створює EnvironmentInjector для route-scoped providers.

**Яку проблему вирішує:** Великі Angular apps — сотні компонентів. Якщо всі в одному bundle — початковий завантаження повільний. Lazy loading: тільки critical path eager, решта — on demand. Покращує FCP (First Contentful Paint) і TTI (Time to Interactive).

**Як працює під капотом:** Dynamic import() → webpack compile-time code splitting → окремий .js chunk. Router activation → RouterConfigLoader checks if chunk loaded → if not: fetch chunk → evaluate → register routes/component → activate. Chunk cached after first load. loadComponent: Angular compiler marks standalone component as compilation unit — tree-shakes its dependencies into chunk.

**Trade-offs та обмеження:** First navigation to lazy route has network delay. Mitigated by preloading strategies. N lazy routes = N potential network requests. HTTP/2 handles this well. loadChildren creates feature EnvironmentInjector — route-scoped services cleanup on deactivation. SSR: lazy routes loaded server-side for initial URL.

**Версійність:** loadChildren з NgModule — Angular 2+. Standalone loadComponent — Angular 14. loadChildren з routes array (standalone) — Angular 14. withPreloading() — Angular 15. Route-scoped providers в lazy routes — Angular 15. `withEnabledBlockingInitialNavigation()` для SSR — Angular 15.

---

## Deep Details

### Edge Cases

**loadComponent default export:** `() => import('./page.component')` — Angular auto-resolves default export якщо component клас є default export. Named export: `() => import('./page.component').then(m => m.PageComponent)`.

**Shared lazy chunk dependencies:** Якщо компонент A (в chunk-feature-a) і компонент B (в chunk-feature-b) обидва import HeavyLib — webpack може створити shared chunk. Залежить від splitChunks config.

**Route providers in lazy route:** Providers у lazy route config — available only when route active. При navigate away — injector destroyed. Service cleanup: `implements OnDestroy` або `inject(DestroyRef).onDestroy(cleanup)`.

**Circular lazy loading:** Route A lazy loads B, B lazy loads A — circular dep. Angular Router handles via lazy evaluation (callbacks not called until navigation). But TypeScript circular imports — still problematic at parse time.

**Lazy route i18n:** Translations для lazy route — потребують окремого lazy loading strategy для translation files (ngx-translate lazy loading per module/feature).

### Junior vs Senior Understanding

**Junior** knows: loadComponent/loadChildren syntax, reduces bundle size.

**Senior** understands:

1. **Chunk lifecycle and caching:** Once loaded — never re-fetched (unless SW cache expires). Navigation subsequent times: instant.

2. **Route EnvironmentInjector:** Lazy route creates injector → provides route services → destroyed on deactivation. Memory management aligned with feature lifecycle.

3. **Preloading strategy selection:** Trade-offs: bandwidth vs navigation speed. Network-aware custom strategies.

4. **Bundle analysis:** webpack-bundle-analyzer, angular.json budgets, chunk grouping strategy.

5. **loadComponent vs loadChildren trade-offs:** Per-component granularity vs feature chunk grouping. Request count vs chunk reuse.

### Deprecation & Migration Path

- **NgModule loadChildren:** `{ loadChildren: () => import('./feature.module').then(m => m.FeatureModule) }` — functional but NgModule is deprecated workflow. Migration: convert to standalone routes, use `loadChildren: () => import('./feature.routes')`.
- **canLoad guard:** Deprecated Angular 15.1. Migration: `canMatch` — functionally similar but works with preloading (canLoad blocked preloading, canMatch does not).
- **PreloadAllModules vs withPreloading:** Functional equivalent. `withPreloading(PreloadAllModules)` in standalone app.

### Connections to Other Concepts

- **DI Internals:** Lazy route → EnvironmentInjector created → route-scoped services.
- **Performance:** Bundle size optimization, initial load time, preloading strategy.
- **Guards:** canMatch replaces canLoad for lazy chunk loading control.
- **@defer:** Alternative lazy loading at component level (within a route), automatic chunk splitting.

---

## Examples

### Basic Usage

```typescript
// Route configuration with lazy loading
const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Lazy standalone component
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
  },

  // Lazy feature with sub-routes
  {
    path: 'products',
    loadChildren: () => import('./products/products.routes').then(m => m.PRODUCTS_ROUTES)
  },

  // Lazy feature with route-scoped providers
  {
    path: 'checkout',
    loadChildren: () => import('./checkout/checkout.routes'),
    providers: [CheckoutService, CartStore],
  },

  { path: '**', loadComponent: () => import('./not-found/not-found.component') }
];

// Feature routes file: products/products.routes.ts
export default [  // Default export — no .then(m => m.ROUTES) needed
  {
    path: '',
    loadComponent: () => import('./products-list/products-list.component'),
  },
  {
    path: ':id',
    loadComponent: () => import('./product-detail/product-detail.component'),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./product-edit/product-edit.component'),
    canActivate: [authGuard, roleGuard('editor')]
  }
] satisfies Routes;

// App bootstrap with preloading
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),  // Or custom strategy
      withComponentInputBinding()
    )
  ]
});
```

### Production Scenario

```typescript
// Network-aware custom preloading strategy
@Injectable({ providedIn: 'root' })
export class SmartPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Don't preload if save data mode or slow connection
    const connection = (navigator as any).connection;
    if (connection?.saveData || connection?.effectiveType === '2g') {
      return EMPTY;
    }

    // Preload only routes marked with data.preload
    if (route.data?.['preload'] === true) {
      return load();
    }

    // Preload admin routes only for admins (check from signal store)
    if (route.data?.['adminOnly']) {
      const authStore = inject(AuthStore);
      return authStore.isAdmin() ? load() : EMPTY;
    }

    return EMPTY;
  }
}

// Route config with preload hints
const routes: Routes = [
  {
    path: 'search',
    loadComponent: () => import('./search/search.component'),
    data: { preload: true }  // High-traffic route, preload
  },
  {
    path: 'analytics',
    loadChildren: () => import('./analytics/analytics.routes'),
    data: { adminOnly: true }  // Preload only for admins
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component'),
    // No preload flag — load on demand
  }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withPreloading(SmartPreloadingStrategy))
  ]
});

// Lazy route with scoped DI and cleanup
// checkout/checkout.routes.ts
export default [
  {
    path: '',
    providers: [
      CheckoutService,
      CartStateService,
      { provide: PAYMENT_GATEWAY, useClass: StripePaymentGateway }
    ],
    component: CheckoutShellComponent,
    children: [
      { path: '', redirectTo: 'cart', pathMatch: 'full' },
      { path: 'cart', loadComponent: () => import('./cart/cart.component') },
      { path: 'delivery', loadComponent: () => import('./delivery/delivery.component') },
      { path: 'payment', loadComponent: () => import('./payment/payment.component') },
      { path: 'confirm', loadComponent: () => import('./confirm/confirm.component') },
    ]
  }
] satisfies Routes;

// Route-scoped service with cleanup
@Injectable()
export class CheckoutService implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  private state = signal<CheckoutState>({ step: 'cart', items: [] });

  constructor() {
    this.destroyRef.onDestroy(() => {
      // Clear any pending operations when checkout route leaves
      console.log('Checkout service cleanup');
    });
  }

  ngOnDestroy(): void {
    // Alternative: implements OnDestroy
  }
}
```

### Anti-Example

```typescript
// WRONG: Importing component eagerly when it should be lazy
// In routes:
import { HeavyDashboardComponent } from './dashboard/dashboard.component';
const routes: Routes = [
  // WRONG: eagerly imported — always in initial bundle
  { path: 'dashboard', component: HeavyDashboardComponent },
];

// CORRECT: dynamic import — separate chunk
const routes: Routes = [
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component') },
];

// WRONG: route service with providedIn:'root' AND in route providers
@Injectable({ providedIn: 'root' })  // WRONG: root singleton AND route-scoped
export class FeatureService {}

const routes: Routes = [
  {
    path: 'feature',
    loadComponent: () => import('./feature.component'),
    providers: [FeatureService]  // Creates SECOND instance — confusing!
  }
];

// CORRECT: Remove providedIn:'root' for route-scoped services
@Injectable()  // No providedIn
export class FeatureService {}

// WRONG: Using canLoad (deprecated) for lazy route protection
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin.routes'),
    canLoad: [AuthGuard]  // DEPRECATED in Angular 15.1
  }
];

// CORRECT: canMatch instead
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin.routes'),
    canMatch: [authGuard]  // Functional guard, canMatch replaces canLoad
  }
];
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Eager imports для pages у routes | Always bundled — defeats lazy loading | Dynamic import: `loadComponent: () => import(...)` |
| `providedIn: 'root'` + route providers для same service | Two instances — confusing state isolation | Remove `providedIn` for route-scoped services |
| `canLoad` guard (deprecated) | Deprecated Angular 15.1, blocks preloading | `canMatch` — same functionality, preloading compatible |
| PreloadAllModules без network detection | Wastes bandwidth на мобільних | Custom strategy з `navigator.connection.effectiveType` check |
| N lazy routes без chunk grouping analysis | Too many network requests, shared deps duplicated | Group related routes, analyze with webpack-bundle-analyzer |

---

## Interview Block

### [L1 — Warm-up] Що таке lazy loading в Angular Router і як його реалізувати?
**Signal being tested:** Знання lazy loading syntax і розуміння чому це важливо для performance.
**What the interviewer expects:** loadComponent і loadChildren dynamic import syntax, webpack code splitting, initial bundle size reduction.
**How to probe deeper:** "Як lazy chunk кешується і що відбувається при повторній навігації до lazy route?"
**Reference answer:** loadComponent/loadChildren з dynamic import() → webpack creates separate chunk. First navigation: network request to fetch chunk → activate. Subsequent: chunk cached in memory, instant navigation. PreloadAllModules: background prefetch all lazy chunks після initial load. loadComponent for standalone, loadChildren for feature with sub-routes.
**Common mistakes:** Think every navigation re-fetches; confuse loadComponent vs loadChildren use cases.

### [L2 — Mid] Яка різниця між loadComponent і loadChildren і коли кожен використовувати?
**Signal being tested:** Розуміння architectural trade-offs між per-component і feature-level lazy loading.
**What the interviewer expects:** loadComponent (single component, direct class), loadChildren (routes array, feature), EnvironmentInjector creation for lazy routes, providers.
**How to probe deeper:** "Як route-scoped providers взаємодіють з EnvironmentInjector при lazy loading?"
**Reference answer:** loadComponent: standalone component, single file chunk. loadChildren: routes array or NgModule, feature bundle. loadChildren creates EnvironmentInjector with route providers. Route providers destroyed on deactivation. Use loadChildren for feature with multiple sub-routes and shared state. loadComponent for standalone pages or leaf routes.
**Common mistakes:** loadChildren for single standalone component; not grouping related routes into single chunk.

### [L3 — Senior] Як lazy loading взаємодіє з DI ієрархією і route-scoped providers?
**Signal being tested:** Розуміння injector lifecycle alignment з route lifecycle і memory management patterns.
**What the interviewer expects:** Route EnvironmentInjector created on activation, destroyed on deactivation, DestroyRef cleanup, services scoped to feature lifetime.
**How to probe deeper:** "Що відбувається якщо service has providedIn:'root' AND is in route providers?"
**Reference answer:** Lazy route creates EnvironmentInjector з route providers. Services live route lifetime: create on activation, destroy on deactivation. OnDestroy/DestroyRef for cleanup. Two instances if service has both providedIn:'root' и route providers — confusing, avoid. DI resolution: component NodeInjector → route EnvironmentInjector → root EnvironmentInjector.
**Common mistakes:** Services not cleaned up; double registration (providedIn:'root' + route providers).

### [L4 — Staff/Principal] Як оптимізувати bundle splitting для enterprise app з 50+ lazy routes?
**Signal being tested:** Системне мислення про bundle analysis, chunk grouping strategy і trade-offs.
**What the interviewer expects:** webpack-bundle-analyzer, feature-based grouping, shared chunks analysis, preloading strategy, angular.json budgets, HTTP/2 consideration.
**How to probe deeper:** "Як shared deps між lazy chunks handled і як контролювати це?"
**Reference answer:** Analysis: ng build --stats-json → webpack-bundle-analyzer. Group by user journey: checkout = one chunk, admin = one chunk. High-traffic routes eager or preloaded. Shared deps: webpack auto-extracts when used in 3+ chunks. splitChunks config. Angular Material: import in root if needed everywhere. budgets in angular.json: enforce limits. Preloading: SmartPreloadingStrategy with network detection.
**Common mistakes:** No measurement baseline; per-component chunks without grouping; ignore shared deps.

---

## Summary

### Key Points
- loadComponent: standalone component → separate webpack chunk, loaded on navigation
- loadChildren: routes array → feature chunk with EnvironmentInjector and route-scoped providers
- Route providers в lazy route: services scoped to route lifetime, destroyed on deactivation
- canLoad deprecated (Angular 15.1) → use canMatch, compatible with preloading
- PreloadAllModules: all lazy chunks loaded in background after initial. Custom strategy for control
- First navigation = network delay. Subsequent = instant (cached). Preloading eliminates first-navigation delay
- Bundle analysis: ng build --stats-json + webpack-bundle-analyzer. Group by user journey, enforce budgets

### Elevator Pitch (2 minutes)
Lazy loading = code splitting через dynamic import(). loadComponent: `() => import('./page.component')` — standalone component окремим chunk. loadChildren: `() => import('./feature.routes')` — feature з sub-routes, окремий chunk з EnvironmentInjector. Lazy route providers: scoped to route lifetime, auto-destroyed on navigate away. First navigation: fetch chunk (network delay). Subsequent: instant (cached). Preloading: withPreloading(PreloadAllModules) — load all lazy chunks in background after initial load. Custom strategy: network-aware, role-based, or data.preload flag. canLoad deprecated → use canMatch. Bundle optimization: group related routes in one chunk (user journey), analyze shared deps, enforce angular.json budgets.
