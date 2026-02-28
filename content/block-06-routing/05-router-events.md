---
title: "Router Events and Navigation Lifecycle"
block: 6
topic: 5
slug: "router-events"
difficulty: 3
sinceVersion: "2"
tags: ["router-events", "NavigationStart", "NavigationEnd", "NavigationError", "loading-indicator", "router-lifecycle"]
relatedTopics: ["router-fundamentals", "guards", "route-data", "preloading-strategies", "rxjs"]
interviewQuestions:
  - id: "b6t5q1"
    level: "junior"
    question: "Що таке Router Events і як підписатись на навігаційні події?"
    referenceAnswers:
      junior: "Router emits events під час навігації. Підписуємось через `router.events` Observable. Можна фільтрувати по типу через instanceof або filter."
      mid: "Router.events — Observable<Event> що emits lifecycle events. Основні: NavigationStart, NavigationEnd, NavigationError, NavigationCancel. Фільтрація: `router.events.pipe(filter(e => e instanceof NavigationEnd))`. Use cases: global loading indicator, analytics page views, scroll restoration, breadcrumb updates."
      senior: "Router Events lifecycle sequence: 1) NavigationStart — navigation began, url property. 2) RoutesRecognized — routes matched. 3) GuardsCheckStart → GuardsCheckEnd — guards running. 4) ResolveStart → ResolveEnd — resolvers running. 5) ActivationStart → ChildActivationStart → ChildActivationEnd → ActivationEnd — component activation. 6) NavigationEnd — success. Or: NavigationCancel (guard returned false/UrlTree) або NavigationError (error в guard/resolver). Events carry snapshot of RouterStateSnapshot. NavigationCancel: reason property. NavigationError: error property. RouterEvent is sealed union type — exhaustive type checking possible."
      staff: "Router Events — event sourcing для Angular navigation lifecycle. Technical: Router emits events synchronously during navigation pipeline. Якщо guard Observable емітує — router proceeds after emission. Events carry navigation ID — correlate NavigationStart і NavigationEnd for same navigation. Performance monitoring: NavigationStart timestamp → NavigationEnd timestamp = navigation duration. Track slow navigations. Events in Angular's change detection: router events are emissions, не triggers CD by themselves. Subscribing in service: use takeUntilDestroyed or manual unsubscribe. Memory implication: router.events never completes — must unsubscribe. WithDebugTracing: `withRouterConfig({ enableTracing: true })` — all events logged to console. Development tool. ActivationStart/ActivationEnd — one pair per component activation, including nested. Aggregate all activation events for full navigation cost."
    commonMistakes:
      - "Не unsubscribe від router.events — memory leak оскільки subject never completes"
      - "Тільки слухають NavigationEnd і ігнорують NavigationError/NavigationCancel"
    relatedQuestions: ["b6t5q2", "b6t5q3"]
  - id: "b6t5q2"
    level: "mid"
    question: "Як реалізувати global loading indicator за допомогою Router Events?"
    referenceAnswers:
      junior: "Слухаємо NavigationStart для показу spinner, NavigationEnd для приховання. Сервіс який керує станом."
      mid: "LoadingService: signal `isLoading = signal(false)`. В constructor: router.events subscribe. NavigationStart → isLoading.set(true). NavigationEnd/NavigationError/NavigationCancel → isLoading.set(false). AppComponent reads isLoading і shows/hides loading bar. Cleanup: takeUntilDestroyed."
      senior: "Global loading indicator production implementation: `@Injectable({ providedIn: 'root' }) class LoadingService { private _loading = signal(false); readonly isLoading = this._loading.asReadonly(); constructor() { inject(Router).events.pipe(takeUntilDestroyed()).subscribe(event => { if (event instanceof NavigationStart) this._loading.set(true); if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) this._loading.set(false); }); } }`. AppComponent: `[class.loading]='loadingService.isLoading()'`. Multiple navigations: NavigationCancel fires якщо guard redirects — loading must hide. Debounce: якщо navigation instant (cached route) — spinner flicker. `debounceTime(200)` for show, immediate for hide: `isLoading.pipe(debounceTime(200))` для template щоб уникнути flash."
      staff: "Production loading indicator має edge cases: 1) Multiple concurrent navigations: старий NavigationEnd може hide loading while new navigation in progress. Correlate by navigation ID. 2) Router preloading (background) — generates NavigationStart/End for preload. Filter: check `event.navigationTrigger` або `event.id`. 3) Imperious cancellation: `NavigationCancel` with `reason.code === NavigationCancellationCode.SupersededByNewNavigation` — another navigation started, cancel current. Hide loading in this case? Depends on UX. 4) Error boundary: NavigationError → show error toast + hide loading. 5) NProgress / nprogress-style indicator: incremental progress. NavigationStart → start. ResolveStart → 30%. ResolveEnd → 70%. ActivationEnd → 90%. NavigationEnd → 100%. 6) Loading indicator і accessibility: `aria-live='polite'` region announces navigation completion for screen readers. 7) Custom loading per route: `data: { loading: 'skeleton' }` → LoadingService selects strategy. 8) Server-side rendering: loading indicator irrelevant server-side (no navigation). Guard with `isPlatformBrowser`."
    commonMistakes:
      - "Не обробляють NavigationCancel і NavigationError — spinner застрягає"
      - "Spinner flicker для instant navigations — no debounce on show"
    relatedQuestions: ["b6t5q1", "b6t5q3"]
  - id: "b6t5q3"
    level: "mid"
    question: "Як реалізувати analytics page tracking через Router Events?"
    referenceAnswers:
      junior: "Слухаємо NavigationEnd і відправляємо page view event в analytics service."
      mid: "AnalyticsService: on NavigationEnd, read current URL, read route data for page ID. Send to analytics provider. Inject в AppComponent або окремий service з takeUntilDestroyed."
      senior: "Analytics tracking via Router: `router.events.pipe(filter(e => e instanceof NavigationEnd), map(e => e as NavigationEnd)).subscribe(event => { const snapshot = router.routerState.snapshot; const pageId = this.getPageId(snapshot.root); analytics.trackPageView({ url: event.url, pageId, title: document.title, referrer: previousUrl }); previousUrl = event.url; })`. Route data з analytics config: `data: { analytics: { pageId: 'user-list', section: 'admin', category: 'management' } }`. Traverse activated route tree для aggregated analytics data. Title: read document.title after TitleStrategy updated (NavigationEnd order: TitleStrategy runs, then subscriber)."
      staff: "Analytics via Router events — robust architecture для SPA analytics. Production considerations: 1) PII in URLs: filter sensitive params before tracking. `data: { analytics: { excludeParams: ['token', 'email'] } }`. 2) Custom dimensions: route data → custom dimensions in GA4. 3) Timing: NavigationEnd = page load time (includes resolvers). Track separately: guard time, resolver time, activation time. 4) SPA behavior: first page = full page load time + Angular bootstrap. Subsequent: navigation time only. Send correct event type to analytics. 5) Error tracking: NavigationError → track failed navigation з error type. 6) Hash routing: NavigationEnd.url includes hash — handle in analytics. 7) RouterReuse: if component reused (RouteReuseStrategy) — NavigationEnd fires but component not recreated. Ensure analytics fires regardless. 8) Privacy: respect user consent — check before tracking. Event fires but analytics() conditional на consent signal. 9) Server-Side Rendering: initial URL tracked server-side (or not). Angular Universal transfers state — avoid double-tracking first page."
    commonMistakes:
      - "Не фільтрують PII в URL — email/token в analytics logs"
      - "Відправляють тільки URL, не page metadata (section, category)"
    relatedQuestions: ["b6t5q2", "b6t5q4"]
  - id: "b6t5q4"
    level: "senior"
    question: "Що таке scroll restoration і як Router керує scroll position?"
    referenceAnswers:
      junior: "Angular Router може відновлювати scroll position при навігації назад. Налаштовується через withInMemoryScrolling."
      mid: "withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }). 'enabled' — restores scroll on back/forward. 'top' — scrolls to top on new navigation. anchorScrolling:'enabled' — scrolls to #fragment. Custom scroll: SCROLL_POSITION token або ViewportScroller."
      senior: "Scroll restoration options: `withInMemoryScrolling(config)` у provideRouter. scrollPositionRestoration: 'disabled' (default), 'top' (scroll to top on navigation), 'enabled' (restore on back/forward). Angular stores scroll position in navigation extras. anchorScrolling: 'disabled' | 'enabled' — scroll to element with matching id. Custom scroll behavior: `ViewportScroller` service — `scrollToPosition([x, y])`, `scrollToAnchor(id)`. NavigationEnd + ViewportScroller для custom logic. Scroll event: Router emits Scroll event subtype with position data. Filter: `filter(e => e instanceof Scroll)`. For virtual scroll or custom containers: ViewportScroller.setOffset() або implement custom scroll."
      staff: "Scroll restoration — often overlooked but critical UX feature. Deep dive: Angular Router stores scroll position in popstate event (browser history). When navigating back: retrieves position, restores after NavigationEnd + CD cycle. Timing issue: scroll restoration must happen AFTER component rendered (images loaded, dynamic content). Solution: `afterNextRender()` або `setTimeout`. ViewportScroller: wraps `window.scrollTo` (browser viewport). For custom containers (scrollable div, not window): override ViewportScroller: `providers: [{ provide: ViewportScroller, useClass: CustomViewportScroller }]`. Implement: scroll to container, store position from container. Mobile: momentum scrolling — setTimeout для iOS. SSR: no scroll restoration server-side. Guard: `isPlatformBrowser()`. Progressive: scroll to top on new navigation, restore on back — good UX. Anchor scrolling з route fragments: `router.navigate(['./path'], { fragment: 'section1' })` → scrolls to `<div id='section1'>`. Fragment must exist in DOM when scroll happens — resolver timing matters."
    commonMistakes:
      - "withInMemoryScrolling не додають — scroll position не відновлюється при back navigation"
      - "Scroll restoration в component constructor — element ще не rendered"
    relatedQuestions: ["b6t5q3", "b6t5q5"]
  - id: "b6t5q5"
    level: "staff"
    question: "Як спроектувати систему моніторингу navigation performance через Router Events?"
    referenceAnswers:
      junior: "Можна відслідковувати час між NavigationStart і NavigationEnd для вимірювання швидкості навігації."
      mid: "NavigationPerformanceService: зберігати NavigationStart timestamp, на NavigationEnd обчислювати delta. Логувати повільні navigations. Зберігати history навігацій для analysis."
      senior: "Navigation performance monitoring: correlate events by navigation ID. `interface NavMetrics { id: number; url: string; startTime: number; guardTime?: number; resolverTime?: number; activationTime?: number; totalTime?: number }`. Track: NavigationStart → record start. GuardsCheckEnd → record guard duration. ResolveEnd → record resolver duration. NavigationEnd → total time. Threshold alert: якщо total > 2000ms → send to monitoring. `router.events.pipe(scan((acc, event) => { ... accumulate metrics ... }))`."
      staff: "Navigation performance monitoring — production observability для SPA. Implementation architecture: 1) NavigationStart: `metrics.start = performance.now()`, `metrics.url = event.url`, `metrics.id = event.id`. 2) GuardsCheckStart/End: guard duration. 3) ResolveStart/End: resolver duration. 4) ActivationStart/End per component: accumulate activation time. 5) NavigationEnd: calculate total. 6) Send to monitoring: Datadog, Sentry, custom endpoint. Correlation: navigation ID links all events для same navigation. Metrics to track: P50, P75, P95 navigation times per route. Identify: slow resolvers (backend latency), slow guards (unnecessary HTTP), expensive component activations (template complexity). Alerting: P95 > 3s → alert. Trends: degradation over releases. Integration з Core Web Vitals: LCP during navigation correlates з component activation time. TTFB для lazy chunks — measure chunk download time (ResolveStart → first ActivationStart gap includes chunk loading). Real User Monitoring: send metrics з actual user devices/networks. Not just synthetic tests. Privacy: URLs may contain PII — hash/anonymize before sending. `data: { monitoring: false }` — opt-out per route."
    commonMistakes:
      - "Aggregate всіх navigations без per-route breakdown — impossible to identify which route is slow"
      - "No P95 tracking — average masks tail latency (worst user experiences)"
    relatedQuestions: ["b6t5q4", "b6t5q3"]
---

## Core Concept

**English definition:** Angular Router emits a sequence of strongly-typed events throughout the navigation lifecycle (`NavigationStart`, `RoutesRecognized`, `GuardsCheckStart/End`, `ResolveStart/End`, `ActivationStart/End`, `NavigationEnd`, `NavigationCancel`, `NavigationError`) via the `router.events` Observable, enabling cross-cutting concerns like loading indicators, analytics, scroll restoration, and performance monitoring.

**Пояснення:** Router.events — Observable що emits events кожного navigation lifecycle phase. Від NavigationStart (navigation initiated) до NavigationEnd (success) або NavigationCancel (guard blocked) або NavigationError (error). Between: guards check, resolvers, component activation. Кожен event несе navigation ID для кореляції та url. Використовують для: loading indicators, analytics tracking, scroll restoration, performance monitoring.

**Яку проблему вирішує:** Navigation lifecycle надто complex для компонентів — вони не мають знати про guards, resolvers, scroll. Router Events дозволяють окремим cross-cutting concern services слухати lifecycle і реагувати: loading bar service, analytics service, scroll restoration — decoupled від feature components.

**Як працює під капотом:** Router — Subject<RouterEvent> під капотом (RxJS). Navigation pipeline: synchronous emissions при кожному phase transition. Events carry snapshot of router state at that moment. Navigation ID: monotonically increasing integer. Events emitted in navigation thread — order guaranteed.

**Trade-offs та обмеження:** Router.events never completes — manual unsubscribe або takeUntilDestroyed needed. All events emitted including preloading navigations — must filter by context. NavigationCancel для redirects (UrlTree from guard) — вважається успішним UX (redirect happened). NavigationError — fatal navigation failure.

**Версійність:** Router Events стабільні з Angular 2. Angular 14: NavigationCancellationCode enum для cancellation reasons. Angular 15: withInMemoryScrolling як standalone API function. Angular 17: withViewTransitions — browser View Transitions API integration.

---

## Deep Details

### Edge Cases

**NavigationCancel for redirect:** Guard повертає UrlTree → NavigationCancel з code SupersededByNewNavigation. Then new NavigationStart for redirect URL. Loading indicator: hide on NavigationCancel (redirect started new navigation).

**Multiple navigations:** RouterLink rapid clicks → multiple NavigationStart. Previous navigation cancelled. Track by ID for accurate metrics.

**Preloading events:** Background preloading generates NavigationStart/End pairs. These have lower navigationTrigger. Filter if needed: `event.navigationTrigger !== 'imperative'`.

**withViewTransitions:** Angular 17 wraps DOM changes in browser View Transitions API. Animated route transitions без manual CSS. `withViewTransitions({ skipInitialTransition: true })`.

**Scroll and async content:** anchorScrolling може fire before images load — anchor element visible but not at correct position. Solution: ViewportScroller.scrollToAnchor() in afterNextRender callback.

**NavigationError і error handling:** Error in guard/resolver → NavigationError. Navigation stays at previous URL. Global error handler: subscribe to NavigationError events, show toast, log to monitoring.

### Junior vs Senior Understanding

**Junior** knows: NavigationStart/NavigationEnd для loading indicator, filter pattern.

**Senior** understands:

1. **Full lifecycle sequence:** 7+ events per navigation. Why each matters (guards timing, resolver timing, activation timing).

2. **Navigation ID correlation:** Correlate NavigationStart и NavigationEnd for metrics. Multiple concurrent navigations.

3. **NavigationCancel reasons:** Guard redirect vs user-initiated cancellation vs superseded. Different UX responses.

4. **Preloading events:** Background navigations generate events — must filter for UI indicators.

5. **Performance metrics pattern:** scan() accumulating metrics per navigation ID. P95 tracking.

### Deprecation & Migration Path

- **Router.events manual subscription:** Pattern unchanged. But modern: takeUntilDestroyed() instead of manual Subject.
- **scrollPositionRestoration 'auto':** Was 'disabled' default. Now recommend 'enabled'. withInMemoryScrolling in standalone.
- **RouterModule events:** Same events available in standalone via inject(Router).events.

### Connections to Other Concepts

- **RxJS:** Router events = Observable stream. filter, map, scan operators for event processing.
- **Signals:** Loading state as signal: router events update signal → template reacts.
- **Accessibility:** NavigationEnd → announce page change for screen readers (LiveAnnouncer).
- **Performance:** Navigation duration metrics → Core Web Vitals (LCP, FID impact).

---

## Examples

### Basic Usage

```typescript
// Global loading indicator service
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private router = inject(Router);
  private _isLoading = signal(false);

  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this._isLoading.set(true);
        }
        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this._isLoading.set(false);
        }
      });
  }
}

// AppComponent with loading bar
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (loading.isLoading()) {
      <div class="loading-bar" role="progressbar" aria-label="Loading"></div>
    }
    <router-outlet />
  `
})
export class AppComponent {
  protected loading = inject(LoadingService);
}

// Analytics service
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private router = inject(Router);
  private previousUrl = '';

  constructor() {
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(event => {
        const navEnd = event as NavigationEnd;
        this.trackPageView(navEnd.urlAfterRedirects);
        this.previousUrl = navEnd.urlAfterRedirects;
      });
  }

  private trackPageView(url: string): void {
    // Get route data for richer tracking
    const snapshot = this.router.routerState.snapshot;
    const pageId = this.getLeafRouteData(snapshot.root, 'pageId');

    console.log('Page view:', { url, pageId, previous: this.previousUrl });
    // gtag('event', 'page_view', { page_path: url, page_id: pageId });
  }

  private getLeafRouteData(route: ActivatedRouteSnapshot, key: string): unknown {
    if (route.firstChild) {
      return this.getLeafRouteData(route.firstChild, key);
    }
    return route.data[key];
  }
}
```

### Production Scenario

```typescript
// Navigation performance monitoring
interface NavigationMetrics {
  id: number;
  url: string;
  startTime: number;
  guardDuration?: number;
  resolverDuration?: number;
  activationDuration?: number;
  totalDuration?: number;
  status: 'pending' | 'success' | 'error' | 'cancelled';
}

@Injectable({ providedIn: 'root' })
export class NavigationMonitorService {
  private router = inject(Router);
  private monitoringService = inject(MonitoringService, { optional: true });

  // Signal with recent navigation metrics
  readonly recentMetrics = signal<NavigationMetrics[]>([]);

  constructor() {
    const pendingNavigations = new Map<number, NavigationMetrics>();

    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          pendingNavigations.set(event.id, {
            id: event.id,
            url: event.url,
            startTime: performance.now(),
            status: 'pending'
          });
        }

        if (event instanceof GuardsCheckEnd) {
          const metrics = pendingNavigations.get(event.id);
          if (metrics) {
            metrics.guardDuration = performance.now() - metrics.startTime;
          }
        }

        if (event instanceof ResolveEnd) {
          const metrics = pendingNavigations.get(event.id);
          if (metrics && metrics.guardDuration) {
            metrics.resolverDuration =
              performance.now() - metrics.startTime - metrics.guardDuration;
          }
        }

        if (event instanceof NavigationEnd || event instanceof NavigationError || event instanceof NavigationCancel) {
          const metrics = pendingNavigations.get(event.id);
          if (metrics) {
            metrics.totalDuration = performance.now() - metrics.startTime;
            metrics.status = event instanceof NavigationEnd
              ? 'success'
              : event instanceof NavigationError
              ? 'error'
              : 'cancelled';

            pendingNavigations.delete(event.id);
            this.recordMetrics(metrics);
          }
        }
      });
  }

  private recordMetrics(metrics: NavigationMetrics): void {
    // Update signal for DevTools / dashboard
    this.recentMetrics.update(recent => [metrics, ...recent].slice(0, 50));

    // Alert on slow navigations
    if (metrics.totalDuration && metrics.totalDuration > 3000 && metrics.status === 'success') {
      console.warn(`Slow navigation to ${metrics.url}: ${metrics.totalDuration}ms`);
      this.monitoringService?.recordSlowNavigation(metrics);
    }
  }
}

// Scroll restoration with custom container
@Injectable()
export class ContentAreaScrollService extends ViewportScroller {
  private scrollContainer: HTMLElement | null = null;
  private positions = new Map<string, [number, number]>();

  setScrollContainer(el: HTMLElement): void {
    this.scrollContainer = el;
  }

  override scrollToPosition(position: [number, number]): void {
    this.scrollContainer?.scrollTo({ top: position[1], left: position[0], behavior: 'smooth' });
  }

  override getScrollPosition(): [number, number] {
    return [
      this.scrollContainer?.scrollLeft ?? 0,
      this.scrollContainer?.scrollTop ?? 0
    ];
  }

  override scrollToAnchor(anchor: string): void {
    const el = document.getElementById(anchor);
    el?.scrollIntoView({ behavior: 'smooth' });
  }

  override setHistoryScrollRestoration(scrollRestoration: 'auto' | 'manual'): void {
    // No-op for custom container
  }
}
```

### Anti-Example

```typescript
// WRONG: No unsubscribe from router.events
@Component({ template: `...` })
export class BadComponent implements OnInit {
  ngOnInit() {
    // WRONG: never unsubscribed — memory leak
    inject(Router).events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateUI();
      }
    });
  }
}

// CORRECT:
@Injectable({ providedIn: 'root' })
export class GoodService {
  constructor() {
    inject(Router).events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed()  // Auto-cleanup
      )
      .subscribe(event => { /* ... */ });
  }
}

// WRONG: Not handling NavigationCancel — spinner stuck
@Injectable({ providedIn: 'root' })
export class BadLoadingService {
  loading = signal(false);

  constructor() {
    inject(Router).events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) this.loading.set(true);
      if (event instanceof NavigationEnd) this.loading.set(false);  // WRONG: misses Cancel and Error
    });
  }
}

// CORRECT: Handle all terminal events
@Injectable({ providedIn: 'root' })
export class GoodLoadingService {
  loading = signal(false);

  constructor() {
    inject(Router).events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading.set(true);
      }
      // Handle ALL terminal events
      if (event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError) {
        this.loading.set(false);
      }
    });
  }
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Manual subscribe без unsubscribe | Memory leak — router.events never completes | `takeUntilDestroyed()` або explicit unsubscribe |
| Handle тільки NavigationEnd для loading | Spinner stuck on redirect/error — NavigationCancel and NavigationError missed | Handle всі terminal events (End/Cancel/Error) |
| не фільтрують PII в URLs для analytics | Security/privacy violation — sensitive data в analytics | Filter sensitive params, hash/anonymize |
| Scroll restoration в constructor | Element not yet rendered — scroll fires before DOM ready | `afterNextRender()` або NavigationEnd + requestAnimationFrame |
| Metrics без navigation ID correlation | Cannot match Start to End for accurate timing | Store metrics by event.id, correlate events |

---

## Interview Block

### [L1 — Warm-up] Що таке Router Events і як підписатись на навігаційні події?
**Signal being tested:** Знання router.events API і розуміння lifecycle event types.
**What the interviewer expects:** router.events Observable, filter by instanceof, NavigationStart/End/Cancel/Error, takeUntilDestroyed.
**How to probe deeper:** "Які типи events існують між NavigationStart і NavigationEnd?"
**Reference answer:** router.events — Observable<RouterEvent>. filter(e => e instanceof NavigationEnd) для specific events. Lifecycle: Start → RoutesRecognized → GuardsCheckStart/End → ResolveStart/End → ActivationStart/End → End (або Cancel/Error). Always unsubscribe: takeUntilDestroyed() або manual. router.events never completes.
**Common mistakes:** No unsubscribe; handling only NavigationEnd (missing Cancel and Error).

### [L2 — Mid] Як реалізувати global loading indicator за допомогою Router Events?
**Signal being tested:** Практична реалізація common UX pattern з proper terminal event handling.
**What the interviewer expects:** Signal-based loading state, NavigationStart → show, NavigationEnd/Cancel/Error → hide, debounce for instant navigation flicker.
**How to probe deeper:** "Що відбувається якщо guard returns UrlTree (redirect) — чи show/hide loading correctly?"
**Reference answer:** LoadingService з signal. NavigationStart → set(true). NavigationEnd AND NavigationCancel AND NavigationError → set(false). UrlTree redirect = NavigationCancel → new NavigationStart immediately. Debounce show (200ms) for instant navigations — prevent flash. No debounce on hide.
**Common mistakes:** Missing NavigationCancel/Error in hide logic; no debounce for instant navigations.

### [L3 — Senior] Як реалізувати analytics page tracking через Router Events?
**Signal being tested:** Знання routing events API і ability to extract meaningful data (route data, timing, previous URL).
**What the interviewer expects:** NavigationEnd subscription, route data extraction, PII filtering, document.title after TitleStrategy.
**How to probe deeper:** "Як відслідковувати і відправляти час навігації як метрику?"
**Reference answer:** NavigationEnd subscription, `router.routerState.snapshot` for route data, traverse to leaf route for pageId. Document.title after NavigationEnd (TitleStrategy updated). Track previous URL for referrer. PII: filter/hash sensitive params before sending. Correlate by navigation ID for timing metrics.
**Common mistakes:** Sending raw URL with PII; missing page metadata from route data.

### [L4 — Staff/Principal] Як спроектувати систему моніторингу navigation performance через Router Events?
**Signal being tested:** Системне мислення про observability, корелятсія events, P95 metrics і actionable alerting.
**What the interviewer expects:** Navigation ID correlation, per-phase timing (guards, resolvers, activation), P95 threshold alerts, privacy (PII), integration with monitoring services.
**How to probe deeper:** "Як відрізнити повільний resolver від повільної active component activation?"
**Reference answer:** Map<navId, metrics> to correlate events. NavigationStart → start timestamp. GuardsCheckEnd → guard duration = now - start. ResolveEnd → resolver duration = now - start - guardDuration. NavigationEnd → total. Per-phase breakdown: identify which phase is bottleneck. P95 > 3s alert → send to monitoring. PII: route data.monitoring = false opt-out. Signal for DevTools dashboard.
**Common mistakes:** Average metrics masking P95 tail; no per-phase breakdown; no PII handling.

---

## Summary

### Key Points
- router.events — Observable що emits events per navigation phase, never completes — must unsubscribe
- Lifecycle: NavigationStart → RoutesRecognized → Guards → Resolvers → Activation → NavigationEnd/Cancel/Error
- Loading indicator: show on NavigationStart, hide on NavigationEnd AND NavigationCancel AND NavigationError
- NavigationCancel fires on guard redirect (UrlTree) и на superseded navigation
- Navigation ID: correlate Start/End events for accurate timing metrics
- withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }) — scroll position restored on back/forward
- withViewTransitions() — browser View Transitions API for animated route transitions (Angular 17+)

### Elevator Pitch (2 minutes)
Router Events = Observable<RouterEvent> що emits navigation lifecycle phases. NavigationStart → NavigationEnd (success) або NavigationCancel (guard block/redirect) або NavigationError (exception). Between: GuardsCheck, Resolve, Activation phases. Never completes — завжди takeUntilDestroyed(). Loading indicator: show on Start, hide on End/Cancel/Error — всі три terminal events. Analytics: filter NavigationEnd, extract route data, track pageId + URL + timing. Scroll: withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }) — browser back/forward restores position. Performance monitoring: correlate events by navigation.id — track per-phase timing (guards, resolvers, activation). P95 > 3s → alert. withViewTransitions() (Angular 17+) — smooth visual transitions between routes.
