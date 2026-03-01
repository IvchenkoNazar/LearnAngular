---
title: "Preloading Strategies"
block: 6
topic: 6
slug: "preloading-strategies"
difficulty: 3
sinceVersion: "2"
tags: ["PreloadAllModules", "NoPreloading", "custom-preloading", "QuicklinkStrategy", "withPreloading"]
relatedTopics: ["lazy-loading", "router-fundamentals", "router-events", "bundle-optimization"]
interviewQuestions:
  - level: "junior"
    question: "Що таке preloading стратегія в Angular і яка різниця між PreloadAllModules і NoPreloading?"
    referenceAnswers:
      junior: "Preloading — завантаження lazy-loaded модулів у фоні після початкового завантаження. PreloadAllModules завантажує всі lazy modules після initial load. NoPreloading — не preloading, модулі завантажуються тільки при navigation."
      mid: "NoPreloading (default): lazy chunks завантажуються on-demand під час navigation — користувач чекає. PreloadAllModules: після initial app load, Angular завантажує всі lazy chunks у фоні — перша navigation до lazy route = instant. Trade-off: PreloadAllModules збільшує трафік (завантажує можливо непотрібні chunks). withPreloading() — standalone API для provideRouter(). Стара RouterModule.forRoot({ preloadingStrategy: PreloadAllModules })."
      senior: "Preloading strategy interface: `abstract class PreloadingStrategy { abstract preload(route: Route, fn: () => Observable<unknown>): Observable<unknown>; }`. Router calls preload() для кожного lazy route після initial navigation. fn() — factory що запускає actual chunk download. Повертаємо fn() для preload, EMPTY (RxJS) для skip. PreloadAllModules: завжди повертає fn(). NoPreloading: завжди повертає EMPTY. Router preloading timing: після NavigationEnd event, Angular iterates всі routes і запитує strategy. Preloading відбувається з idle priority (не блокує main navigation). Network consideration: PreloadAllModules на повільних connections = bandwidth waste. Кращий підхід: selective або network-aware preloading."
      staff: "Preloading architecture в Angular Router: після successful navigation, Router.preloader (RouterPreloader service) викликає preload() для кожного child route. Sequence: NavigationEnd → RouterPreloader.preload() → for each route with loadChildren → strategy.preload(route, loadFn) → if Observable<non-null> → execute loadFn() → chunk downloaded. Preloading happens in router's scheduler — non-blocking. Multiple routes preloaded concurrently (mergeMap). Critical insight: preloading викликається рекурсивно — після preloading parent route, preloads children. QuicklinkStrategy (ngx-quicklink) використовує Intersection Observer + link scanning: preloads тільки routes що мають visible RouterLink на поточній сторінці. Network-aware: Navigator.connection API — effectiveType '4g' → preload, 'slow-2g' → skip. Custom strategy може inject будь-який service — FeatureFlagService, UserRoleService, AnalyticsService."
    commonMistakes:
      - "Думають що preloading = завантаження при route navigate, а не у фоні після initial load"
      - "Використовують PreloadAllModules для всіх apps без оцінки bandwidth impact"
    relatedQuestions: ["b6t6q2", "b6t6q3"]
  - level: "mid"
    question: "Як реалізувати custom preloading стратегію на основі route data?"
    referenceAnswers:
      junior: "Можна додати data в route config і в custom strategy перевіряти це data для вирішення чи preload."
      mid: "Custom strategy extends PreloadingStrategy. preload(route, fn): якщо route.data['preload'] === true → return fn() (download chunk). Інакше → return EMPTY. Router config: route + data: { preload: true }. provideRouter(routes, withPreloading(CustomPreloadingStrategy)). Provide strategy через providers."
      senior: "Custom preloading з route data: `@Injectable({ providedIn: 'root' }) class SelectivePreloadingStrategy implements PreloadingStrategy { preload(route: Route, fn: () => Observable<unknown>): Observable<unknown> { return route.data?.['preload'] ? fn() : EMPTY; } }`. Inject в provideRouter: `withPreloading(SelectivePreloadingStrategy)`. Розширення: preload delay — `return route.data?.['preload'] ? timer(2000).pipe(mergeMap(() => fn())) : EMPTY`. Preload priority: sort routes by priority, preload high-priority first. Preload on hover: router.preloadingStrategy.preload(route, fn) manually — але це приватний API. Краще: manual import() call на hover event. Route data не може бути dynamic — для dynamic strategies (user role based) inject service."
      staff: "Selective preloading strategy design — production considerations. 1) Route data approach limitations: static configuration, не реагує на runtime state (user role, A/B test group). 2) Service-injected strategy: inject UserService, FeatureFlagService в strategy class — preload тільки routes available for current user. Prevents unauthorized chunk download. 3) Preloading і code splitting: preloading не знає про route guards — може preload chunk для route що guard заблокує. Partial optimization: preload chunk не = expose data, але = unnecessary bandwidth. 4) Analytics-driven preloading: inject AnalyticsService, preload top-3 most navigated routes від поточного. Requires server-side analytics data (navigation probability matrix). 5) Preload cancellation: якщо user navigates before preloading completes — Angular does NOT cancel preloading. HttpClient requests continue. Consider: AbortController або takeUntil(navigationStart$) для network-intensive preloads. 6) Error handling in preload(): якщо fn() throws → RouterPreloader catches і logs, не propagates. Preloading failure = silent, navigation still works (lazy load on demand)."
    commonMistakes:
      - "Не provide strategy як injectable — DI помилка при inject(SelectivePreloadingStrategy)"
      - "Повертають null замість EMPTY — Observable<null> тригерить preload, EMPTY — ні"
    relatedQuestions: ["b6t6q1", "b6t6q3"]
  - level: "mid"
    question: "Що таке QuicklinkStrategy і як вона покращує preloading порівняно з PreloadAllModules?"
    referenceAnswers:
      junior: "QuicklinkStrategy (з бібліотеки ngx-quicklink) — preloads тільки routes що видні на екрані через RouterLink. Це розумніший підхід ніж завантажувати все."
      mid: "QuicklinkStrategy використовує Intersection Observer API: відстежує visibility RouterLink елементів. Коли RouterLink входить у viewport — preloads відповідний lazy route. Переваги: не wasteful (тільки те що видно), адаптується до поточного view. Npm: ngx-quicklink. Requires `QuicklinkModule` або `QuicklinkStrategy` provider."
      senior: "QuicklinkStrategy internals: бібліотека ngx-quicklink реєструє IntersectionObserver на RouterLink directives. При intersection → strategy.preload(route, fn) called. Fallback для browsers без IntersectionObserver: prefetch link tags (`<link rel='prefetch'>`). Implementation: strategy implements PreloadingStrategy, внутрішньо — Set<string> для відстеження preloaded routes (no double preload). Network hints: якщо Navigator.connection?.saveData === true або effectiveType === 'slow-2g' → skip. Порівняння з PreloadAllModules: PreloadAllModules preloads ALL routes — wasteful для великих apps. QuicklinkStrategy preloads тільки VISIBLE routes — predictive без waste. Practical: на homepage де є 3 NavigationLinks → preloads їх 3 lazy chunks. 5 hidden routes → не завантажуються. Angular integration: `withPreloading(QuicklinkStrategy)` + `QuicklinkModule` або standalone `QuicklinkDirective` на router-outlet."
      staff: "QuicklinkStrategy — production-optimal preloading для більшості apps. Architecture analysis: IntersectionObserver threshold: default 0 — будь-який visible pixel triggers preload. Може бути noise: elements barely in viewport. Кращий threshold: 0.1 або з rootMargin '200px'. Custom QuicklinkStrategy: override з network check + threshold config. Comparison matrix: NoPreloading: lowest bandwidth, highest navigation latency. PreloadAllModules: highest bandwidth, lowest navigation latency everywhere. QuicklinkStrategy: balanced — preloads what's likely navigated. Network-aware custom: optimal для diverse user base. Real-world consideration: SSR + QuicklinkStrategy — Intersection Observer не exists server-side. Guard isPlatformBrowser або strategy handles server gracefully (повертає EMPTY). QuicklinkStrategy і lazy modules з multiple routes: preloads parent lazy module, але child routes в тому ж module — не окремі chunks (залежить від code splitting granularity). Fine-grained preloading: component-level lazy loading (Angular 19+ loadComponent) + QuicklinkStrategy = preloads конкретні components, не цілі feature modules."
    commonMistakes:
      - "Не враховують SSR — Intersection Observer не available server-side, QuicklinkStrategy потребує platform check"
      - "Забувають додати QuicklinkModule або QuicklinkDirective поруч з QuicklinkStrategy"
    relatedQuestions: ["b6t6q2", "b6t6q4"]
  - level: "senior"
    question: "Як реалізувати network-aware і idle-time preloading стратегію?"
    referenceAnswers:
      junior: "Можна перевіряти navigator.connection для визначення швидкості і preloaditi тільки на швидкому підключенні."
      mid: "Network-aware: перевіряємо navigator.connection?.effectiveType — '4g' → fn(), 'slow-2g'/'2g'/'3g' або saveData → EMPTY. Idle-time: requestIdleCallback → preload під час browser idle. Комбінування: check network, then idle callback."
      senior: "Network-aware preloading strategy: `@Injectable({ providedIn: 'root' }) class NetworkAwarePreloadingStrategy implements PreloadingStrategy { preload(route: Route, fn: () => Observable<unknown>): Observable<unknown> { const conn = (navigator as any).connection; if (conn?.saveData) return EMPTY; const effectiveType = conn?.effectiveType ?? '4g'; if (['slow-2g', '2g', '3g'].includes(effectiveType)) return EMPTY; return fn(); } }`. Idle preloading: використовуємо requestIdleCallback: `return new Observable(observer => { const id = requestIdleCallback(() => { fn().subscribe(observer); }); return () => cancelIdleCallback(id); })`. Комбінований підхід: network check first, then idle callback for preloading — не блокує main thread, не wasteful. Network change events: connection.addEventListener('change') — якщо network покращилась, можна re-trigger preloading. Angular не робить це автоматично."
      staff: "Network-aware + idle preloading — production-grade strategy. Advanced implementation: 1) RTT (round-trip time) vs effectiveType: effectiveType є estimate, rtt (milliseconds) — точніший. rtt < 100 → high-speed, rtt > 400 → slow. 2) Battery API: navigator.getBattery() → battery.charging === false && battery.level < 0.15 → skip preloading. 3) Dynamic network re-evaluation: connection change event → re-scan unpreloaded routes. 4) Priority queue: преloading не є atomic — великий app має десятки lazy chunks. Priority ordering: by user navigation history (analytics), by route data priority field. Implement: PriorityQueue, preload one-by-one in priority order. 5) Memory pressure: performance.memory?.usedJSHeapSize > threshold → pause preloading. 6) Intersection Observer + network awareness: QuicklinkStrategy variant що додатково перевіряє network. 7) Preloading metrics: track preload hit rate — скільки разів preloaded chunk використовувався при navigation. Optimize strategy based on real data. 8) Service Worker integration: SW може preload chunks і cache них — preloading strategy і SW caching complementary. Strategy signals SW що preload, SW handles actual fetch + cache."
    commonMistakes:
      - "Не обробляють відсутність Navigator.connection API — older Safari не підтримує"
      - "requestIdleCallback blocking: якщо fn() synchronously expensive — idle callback ще блокує, потрібний async fn()"
    relatedQuestions: ["b6t6q3", "b6t6q5"]
  - level: "staff"
    question: "Як спроектувати preloading strategy для enterprise Angular app з 50+ lazy routes і різними user roles?"
    referenceAnswers:
      junior: "Для різних ролей можна preload тільки routes що доступні поточному user."
      mid: "Inject AuthService/RoleService в preloading strategy. Перевіряємо чи поточний user має доступ до route (через route data або canActivate guards). Preload тільки allowed routes."
      senior: "Role-based preloading: `preload(route, fn) { const userRoles = this.authService.currentRoles; const requiredRoles = route.data?.['roles'] as string[]; if (requiredRoles && !requiredRoles.some(r => userRoles.includes(r))) return EMPTY; return this.networkStrategy.preload(route, fn); }`. Limitations: guards і preloading — незалежні. Guard може заблокувати navigation навіть якщо route preloaded. Preloading route != grating access. Optimization: не preload routes що guard заблокує — reduces unnecessary chunk downloads. Combined strategy: role-based filter + network awareness + QuicklinkStrategy ordering."
      staff: "Enterprise preloading strategy — multi-dimensional optimization problem. Architecture: 1) User segment profiling: preload routes базуючись на user role (admin → preload admin routes), subscription tier (premium → preload premium features), historical navigation pattern (load from CrUX/analytics API). 2) Predictive preloading: ML model trained на navigation sequences. Current route → predicted next N routes → preload them. Сервер endpoint: POST /api/preload-hints?currentRoute=/dashboard → { routes: ['/users', '/reports'] }. 3) Priority scheduler: inject PriorityPreloadQueue. Roles: critical (user's most common routes, preload immediately), normal (other accessible routes, idle), deferred (rarely visited, no preload). 4) Chunk size budget: total preload bandwidth budget per session. Якщо remaining budget < chunk size → skip. Track cumulative preloaded bytes. 5) Progressive preloading: after initial navigation — preload P1 routes. After first interaction — preload P2. After 30s idle — preload P3. Staged approach prevents bandwidth spike. 6) Invalidation: після role change або login/logout → clear preload state, re-run strategy. 7) Metrics dashboard: preload hit rate per route, bandwidth consumed by preloading, navigation time improvement for preloaded vs non-preloaded routes. ROI metric: (time saved for users) / (bandwidth cost). 8) A/B test preloading strategies: 50% PreloadAllModules vs 50% NetworkAware → measure navigation P75 і bandwidth per session."
    commonMistakes:
      - "Preloading route = granting access — неправда, guards незалежні від preloading"
      - "Не враховують A/B testing вплив: preloading може interference з A/B chunk splitting"
    relatedQuestions: ["b6t6q4", "b6t6q2"]
---

## Core Concept

**English definition:** A preloading strategy in Angular Router is a service implementing the `PreloadingStrategy` interface that determines which lazy-loaded route chunks to download in the background after the initial navigation completes, reducing the perceived latency for subsequent navigations without impacting initial load performance.

**Пояснення:** Preloading — компроміс між lazy loading (мінімальний initial bundle, але затримка при кожному navigate) і eager loading (все одразу, повільний start). Preloading завантажує lazy chunks у фоні коли user вже бачить initial page — коли вони потрібні, вони вже в browser cache. Стратегія визначає ЯКІ chunks завантажувати: всі, тільки видимі links, тільки для поточної ролі, тільки на швидкому інтернеті.

**Яку проблему вирішує:** Lazy loading вирішує initial load performance але створює navigation latency — перший перехід до lazy route = HTTP request + parse. PreloadAllModules вирішує navigation latency але wasteful (завантажує все). Custom preloading strategies — precision: завантажувати тільки те що probable для навігації, з урахуванням network і user context.

**Як працює під капотом:**

```
Initial navigation completes (NavigationEnd)
        ↓
RouterPreloader.preload() called
        ↓
Iterates all routes with loadChildren
        ↓
For each route: strategy.preload(route, loadFn) called
        ↓
┌─── Returns EMPTY ───────────────────────────────────┐
│    (skip this route)                                 │
│                                                     │
└─── Returns Observable with value ──────────────────┘
     (trigger preload: loadFn() called → HTTP chunk download)
        ↓
Chunk cached in browser (ServiceWorker or HTTP cache)
        ↓
Next navigation to this route → instant (from cache)
```

PreloadingStrategy interface:
```typescript
abstract class PreloadingStrategy {
  // fn() = factory that triggers chunk download
  // Return EMPTY = skip, return fn() = preload
  abstract preload(route: Route, fn: () => Observable<unknown>): Observable<unknown>;
}
```

RouterPreloader використовує `mergeMap` — всі routes preloaded concurrently. Preloading відбувається через `Router.navigateByUrl()` internal mechanism — але замість rendering компонента, тільки downloads chunk і registers module.

**Trade-offs та обмеження:**

- PreloadAllModules на large app з 50 routes = 50 HTTP requests after initial load — significant bandwidth
- Preloading і guards незалежні: можна preload chunk до route що guard заблокує
- Network-aware strategies залежать від `Navigator.connection` API — не підтримується в Safari (older versions)
- `requestIdleCallback` для idle preloading — не в Safari до v16.4
- Preloading — фоновий fetch, не guaranteed до navigation (може не завершитись якщо user navigates immediately)

**Версійність:** PreloadingStrategy introduced Angular 2.0. `PreloadAllModules` і `NoPreloading` — built-in з v2. `withPreloading()` — standalone API у provideRouter() з Angular 14 (standalone preview), stable v15. Раніше: `RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })`. Angular 19+: `loadComponent` для component-level lazy loading — preloading strategy works з ними теж.

## Deep Details

### Edge Cases

**Preloading і route guards:** Preloading завантажує chunk але не перевіряє guards. Якщо `canActivate` guard redirect — chunk завантажений але navigation prevented. Це не security issue (chunk може бути empty shell), але bandwidth waste. Fix: inject guard-like service в preloading strategy.

**Preloading failure:** Якщо fn() (chunk download) fails — RouterPreloader catches error і logs. Preloading failure silent. Наступна navigation до цього route — спробує знову (on-demand load). Retry logic в preloading: `fn().pipe(catchError(() => EMPTY))` — вже handled by RouterPreloader.

**Double preloading prevention:** RouterPreloader зберігає state `Map<Route, Observable>` — не preload одну route двічі. Якщо strategy.preload() викликається для вже preloaded route — результат cached.

**Preloading у SSR (Angular Universal):** Server-side немає browser network, preloading strategy methods called але fn() returns empty (no actual HTTP). Platforms без browser APIs (Navigator.connection, requestIdleCallback) потребують platform check у strategy.

**Child route preloading:** RouterPreloader рекурсивний — після preloading parent lazy module, scanner iterates child routes і calls preload() для них теж. Якщо lazy module має власні lazy children — вони теж preloaded за стратегією.

### Junior vs Senior Understanding

**Junior** знає: PreloadAllModules vs NoPreloading, basic concept що preloading = background download.

**Senior** розуміє:

1. **PreloadingStrategy interface:** `preload(route, fn): Observable<any>`. fn() = chunk download trigger. EMPTY = skip. Timing: called after NavigationEnd.

2. **RouterPreloader internals:** mergeMap для concurrent preloads. Recursive child route scanning. State tracking для no double-preload.

3. **Network API limitations:** `Navigator.connection` — Chrome only. Safari support limited. Need graceful fallback.

4. **Integration з DI:** Strategy injectable → can inject AuthService, FeatureFlagService, NetworkService для intelligent decisions.

5. **Idle preloading pattern:** requestIdleCallback wrapper для non-blocking preloads.

### Deprecation & Migration Path

- **RouterModule.forRoot({ preloadingStrategy }):** Deprecated в favor of standalone `withPreloading()`. Migration: `RouterModule.forRoot(routes, { preloadingStrategy: Strategy })` → `provideRouter(routes, withPreloading(Strategy))`. Функціонально ідентично.
- **Старий loadChildren string syntax:** `loadChildren: 'path/to/module#ModuleName'` → deprecated. New: `loadChildren: () => import('./path').then(m => m.Module)` або `loadComponent: () => import('./component').then(m => m.Component)`.
- **NgModule-based lazy modules:** `@NgModule` з `RouterModule.forChild()` → standalone components з loadComponent/loadChildren returning array of routes. Preloading strategy — unchanged, works з обома.

### Connections to Other Concepts

- **Lazy Loading:** preloading = background-phase lazy loading, on-demand = foreground lazy loading
- **Bundle Optimization:** preloading strategy determines bandwidth trade-off of code splitting
- **Router Events:** NavigationEnd triggers RouterPreloader; strategies можуть listen to router events
- **Service Worker:** SW може intercept preloaded chunks і cache them — complementary
- **Change Detection:** preloading не тригерить CD — purely network/module registration

## Examples

### Basic Usage

```typescript
// app.config.ts — provideRouter з withPreloading
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, NoPreloading } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules) // Preload all lazy routes after initial load
    ),
  ],
};

// app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.routes').then(m => m.settingsRoutes),
  },
];
```

```typescript
// Custom route-data based selective preloading
interface RoutePreloadData {
  preload?: boolean;
  preloadDelay?: number; // milliseconds
}

@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, fn: () => Observable<unknown>): Observable<unknown> {
    const data = route.data as RoutePreloadData | undefined;

    if (!data?.preload) {
      return EMPTY; // Skip — not marked for preload
    }

    const delay = data.preloadDelay ?? 0;

    if (delay > 0) {
      return timer(delay).pipe(mergeMap(() => fn()));
    }

    return fn(); // Preload immediately
  }
}

// Routes with preload data
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { preload: true }, // Will be preloaded
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.routes').then(m => m.reportsRoutes),
    data: { preload: true, preloadDelay: 3000 }, // Preload after 3s delay
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    // No preload data → not preloaded
  },
];
```

### Production Scenario

```typescript
// Network-aware + idle preloading strategy
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, EMPTY, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SmartPreloadingStrategy implements PreloadingStrategy {

  preload(route: Route, fn: () => Observable<unknown>): Observable<unknown> {
    // Skip if no loadChildren/loadComponent
    if (!route.loadChildren && !route.loadComponent) {
      return EMPTY;
    }

    // Check data opt-in/opt-out
    if (route.data?.['preload'] === false) {
      return EMPTY; // Explicitly opted out
    }

    // Network awareness
    if (!this.shouldPreloadOnCurrentNetwork()) {
      return EMPTY;
    }

    // Use idle callback for non-critical routes
    const isPriority = route.data?.['preloadPriority'] === 'high';

    if (isPriority) {
      return fn(); // Preload immediately
    }

    // Defer to idle time
    return this.idlePreload(fn);
  }

  private shouldPreloadOnCurrentNetwork(): boolean {
    const connection = (navigator as any).connection;

    if (!connection) {
      return true; // No API — optimistic
    }

    if (connection.saveData) {
      return false; // User explicitly requested data saving
    }

    const slowConnections = ['slow-2g', '2g', '3g'];
    return !slowConnections.includes(connection.effectiveType);
  }

  private idlePreload(fn: () => Observable<unknown>): Observable<unknown> {
    // Wrap fn() in requestIdleCallback for non-blocking preload
    return new Observable(observer => {
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(
          () => {
            fn().subscribe({
              next: val => observer.next(val),
              error: err => observer.error(err),
              complete: () => observer.complete(),
            });
          },
          { timeout: 5000 } // Max 5s wait
        );

        return () => cancelIdleCallback(id);
      } else {
        // Fallback: setTimeout 200ms
        const id = setTimeout(() => fn().subscribe(observer), 200);
        return () => clearTimeout(id);
      }
    });
  }
}

// Role-based preloading
@Injectable({ providedIn: 'root' })
export class RoleBasedPreloadingStrategy implements PreloadingStrategy {
  private authService = inject(AuthService);
  private networkStrategy = inject(SmartPreloadingStrategy);

  preload(route: Route, fn: () => Observable<unknown>): Observable<unknown> {
    const requiredRoles = route.data?.['roles'] as string[] | undefined;

    if (requiredRoles?.length) {
      const currentRoles = this.authService.currentUserRoles();
      const hasAccess = requiredRoles.some(role => currentRoles.includes(role));

      if (!hasAccess) {
        return EMPTY; // Skip routes user can't access
      }
    }

    // Delegate to network-aware strategy
    return this.networkStrategy.preload(route, fn);
  }
}

// ngx-quicklink integration
import { QuicklinkStrategy, QuicklinkModule } from 'ngx-quicklink';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(QuicklinkStrategy) // Preload visible RouterLinks
    ),
    importProvidersFrom(QuicklinkModule), // Required for QuicklinkStrategy
  ],
};
```

### Anti-Example

```typescript
// WRONG: Preloading без network awareness — wasteful on slow connections
@Injectable({ providedIn: 'root' })
export class BadPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, fn: () => Observable<unknown>): Observable<unknown> {
    // WRONG: Always preload everything without checking network
    return fn();
  }
}
// Result: mobile user on 3G → preloads 20 chunks → wastes 5MB background data

// WRONG: Returning null/undefined замість EMPTY
@Injectable({ providedIn: 'root' })
export class AlsoBadStrategy implements PreloadingStrategy {
  preload(route: Route, fn: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload']) {
      return fn();
    }
    return null as any; // WRONG: null triggers TypeError in RouterPreloader
    // CORRECT: return EMPTY;
  }
}

// WRONG: Blocking preload на main thread
@Injectable({ providedIn: 'root' })
export class BlockingPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, fn: () => Observable<unknown>): Observable<unknown> {
    // WRONG: Heavy synchronous operation in preload
    const shouldPreload = this.expensiveComputation(route); // blocks main thread
    return shouldPreload ? fn() : EMPTY;
  }

  private expensiveComputation(route: Route): boolean {
    // Imagine 50ms synchronous work here
    return true;
  }
}

// CORRECT: Async check, network awareness, EMPTY for skip
@Injectable({ providedIn: 'root' })
export class GoodPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, fn: () => Observable<unknown>): Observable<unknown> {
    if (!route.data?.['preload']) return EMPTY;

    const connection = (navigator as any).connection;
    if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) {
      return EMPTY;
    }

    // Non-blocking async decision
    return from(Promise.resolve(this.checkAsync(route))).pipe(
      mergeMap(shouldPreload => shouldPreload ? fn() : EMPTY)
    );
  }

  private async checkAsync(route: Route): Promise<boolean> {
    // Lightweight async check
    return true;
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `PreloadAllModules` без network check | Завантажує всі chunks на mobile/slow connection — wastes user's data | Custom strategy з `Navigator.connection` check або QuicklinkStrategy |
| Returning `null` замість `EMPTY` | `RouterPreloader` expects Observable, null → TypeError crash | Завжди повертай `EMPTY` (from rxjs) для skip, `fn()` для preload |
| Preloading strategy без DI registration | `withPreloading(Strategy)` без `providedIn: 'root'` → DI error | `@Injectable({ providedIn: 'root' })` на стратегії |
| Ігнорувати `saveData` flag | Порушення user preference — дані можуть коштувати грошей | Перший check: `if (navigator.connection?.saveData) return EMPTY` |
| Preloading chunks для routes за guards не перевіряючи ролі | Bandwidth waste + potential confusion (chunk downloaded but navigation blocked) | Inject AuthService у стратегію, skip routes недоступних для поточного user |

## Interview Block

### [L1 — Warm-up] Що таке preloading стратегія і яка різниця між PreloadAllModules і NoPreloading?

**Signal being tested:** Розуміння lazy loading vs preloading trade-off і коли який підхід доцільний.

**What the interviewer expects:** Preloading = background download після initial load, NoPreloading = on-demand, PreloadAllModules = всі chunks, withPreloading() API.

**How to probe deeper:** "Чому NoPreloading може бути кращим ніж PreloadAllModules для деяких apps?"

**Reference answer:** Preloading = завантаження lazy chunks у фоні після initial navigation — navigation latency elimination без initial load impact. NoPreloading (default): chunks завантажуються on-demand — мінімальний bandwidth. PreloadAllModules: після initial load, all lazy chunks downloaded — instant future navigations але bandwidth wasteful. Конфігурація: `provideRouter(routes, withPreloading(PreloadAllModules))`. Custom strategies для precision: preload тільки likely routes.

**Common mistakes:** Думають preloading = частина initial load (ні — після); не знають withPreloading() standalone API.

### [L2 — Mid] Як реалізувати custom preloading стратегію на основі route data?

**Signal being tested:** Знання PreloadingStrategy interface і здатність реалізувати injectable service з правильним EMPTY/fn() logic.

**What the interviewer expects:** PreloadingStrategy abstract class, preload(route, fn) method signature, EMPTY для skip, fn() для trigger, route.data access, @Injectable.

**How to probe deeper:** "Чому EMPTY а не null для skip? Яку роль відіграє fn() параметр?"

**Reference answer:** `implements PreloadingStrategy { preload(route, fn) { return route.data?.['preload'] ? fn() : EMPTY; } }`. fn() — factory Observable що тригерить chunk download. EMPTY — RxJS empty Observable що одразу completes без emission. RouterPreloader: якщо Observable emits — preloads; EMPTY = no emission = skip. Provide: `@Injectable({ providedIn: 'root' })` + `withPreloading(CustomStrategy)`.

**Common mistakes:** Return null замість EMPTY; не mark strategy як Injectable; плутають fn() і route.loadChildren.

### [L3 — Senior] Що таке QuicklinkStrategy і як вона покращує preloading порівняно з PreloadAllModules?

**Signal being tested:** Знання ecosystem tools і розуміння Intersection Observer як preloading trigger.

**What the interviewer expects:** ngx-quicklink, IntersectionObserver on RouterLinks, preloads visible routes тільки, network saveData check, SSR consideration.

**How to probe deeper:** "Як QuicklinkStrategy вирішує SSR проблему де Intersection Observer не доступний?"

**Reference answer:** QuicklinkStrategy (ngx-quicklink) uses IntersectionObserver на RouterLink directives. RouterLink visible в viewport → preloads відповідний lazy route. Переваги vs PreloadAllModules: тільки routes що user likely navigates (visible links), не всі. Network check built-in: saveData або slow-2g → skip. SSR: IntersectionObserver не exists server-side — strategy returns EMPTY або fallback до `<link rel='prefetch'>` tags. Integration: `withPreloading(QuicklinkStrategy)` + `QuicklinkModule` import.

**Common mistakes:** Думають QuicklinkStrategy preloads all visible elements (тільки RouterLinks); забувають QuicklinkModule.

### [L4 — Staff/Principal] Як спроектувати preloading strategy для enterprise app з 50+ lazy routes і різними user roles?

**Signal being tested:** System-level мислення про preloading як optimization problem з multiple constraints (bandwidth, roles, priorities, analytics).

**What the interviewer expects:** Role-based filtering, priority tiers, network awareness, bandwidth budget, analytics-driven predictions, metrics for ROI.

**How to probe deeper:** "Як виміряти чи preloading strategy ефективна? Які metrics збирати?"

**Reference answer:** Multi-dimensional strategy: 1) Role filter — inject AuthService, skip routes user can't access. 2) Network tier — 4G: preload all priority routes; 3G: only high-priority; 2G/saveData: nothing. 3) Priority: route data priority field — high (preload immediately), normal (idle), deferred (skip). 4) Bandwidth budget: track cumulative preloaded bytes, stop at threshold. 5) Analytics-driven: server endpoint returns predicted next routes for current URL. Metrics: preload hit rate, bandwidth per session, navigation time delta (preloaded vs not).

**Common mistakes:** Preloading = access grant (ні — guards незалежні); не враховують bandwidth cost; no metrics for strategy effectiveness.

---

## Summary

### Key Points
- `PreloadingStrategy` interface: `preload(route, fn): Observable<any>` — повертай `fn()` для preload, `EMPTY` для skip
- `withPreloading()` в `provideRouter()` — standalone API (Angular 14+), замінив RouterModule option
- PreloadAllModules — bandwidth wasteful для large apps; QuicklinkStrategy — балансує precision і coverage
- Custom strategies injectable — inject AuthService, FeatureFlagService, NetworkService для smart decisions
- `Navigator.connection?.saveData` — перший check у будь-якій production strategy
- `requestIdleCallback` wrapper — non-blocking preloading під час browser idle
- Preloading ≠ authorization: guards перевіряють access при navigation, preloading — тільки downloads chunk

### Elevator Pitch (2 minutes)
Preloading strategies визначають які lazy chunks завантажувати у фоні після initial navigation. PreloadAllModules = все відразу — instant navigations але bandwidth expensive. NoPreloading (default) = on-demand = navigation latency. Custom strategy implements `PreloadingStrategy` interface: `preload(route, fn)` — повертай `fn()` для download або `EMPTY` для skip. Реальний виробничий підхід: QuicklinkStrategy (ngx-quicklink) preloads тільки visible RouterLinks через IntersectionObserver. Network-aware: `Navigator.connection.saveData` → skip. Idle preloading: `requestIdleCallback(() => fn())` — non-blocking. Role-based: inject AuthService → skip inaccessible routes. `withPreloading(Strategy)` у `provideRouter()` — конфігурація. Ключовий trap: preloading не = authorization, guards залишаються незалежними від preloading.
