---
title: "Advanced Routing Patterns"
block: 6
topic: 7
slug: "advanced-routing"
difficulty: 4
sinceVersion: "2"
tags: ["auxiliary-routes", "named-outlets", "router-architecture", "secondary-outlet", "URL-serialization"]
relatedTopics: ["router-fundamentals", "lazy-loading", "router-events", "preloading-strategies"]
interviewQuestions:
  - level: "junior"
    question: "Що таке named outlet в Angular Router і як його оголосити в шаблоні?"
    referenceAnswers:
      junior: "Named outlet — це router-outlet з атрибутом name. Дозволяє відображати кілька незалежних router views одночасно. `<router-outlet name='sidebar'></router-outlet>`."
      mid: "Named outlet (secondary outlet) — додатковий router-outlet що рендерить route незалежно від primary. Template: `<router-outlet></router-outlet>` (primary) і `<router-outlet name='panel'></router-outlet>` (secondary). Route config: `{ path: 'detail', component: DetailComponent, outlet: 'panel' }`. Navigation: `router.navigate([{ outlets: { primary: 'list', panel: 'detail/1' } }])` або RouterLink `[routerLink]='[{ outlets: { panel: [\"detail\", id] } }]'`."
      senior: "Named outlets і auxiliary routes — powerful feature для parallel route states. URL encoding: `http://app.com/list(panel:detail/1)` — parentheses encode secondary outlet state. Multiple outlets: `(panel:detail/1//sidebar:menu)` — double slash separates multiple secondary outlets. Route definition: `{ outlet: 'panel', path: 'detail/:id', component: DetailComponent }`. Outlet naming best practices: semantic names (panel, sidebar, dialog, modal). Closing outlet: `router.navigate([{ outlets: { panel: null } }])`. Outlet state persists в URL — bookmarkable, shareable. canActivate guards work on named outlet routes."
      staff: "Named outlets — angular router's parallel route state machine. URL serialization: Angular UrlSerializer (DefaultUrlSerializer) parses auxiliary routes via parentheses syntax. UrlTree: primary segment + Map<outletName, UrlSegmentGroup>. Multiple outlets encoded: `/primary(aux1:path1//aux2:path2)`. Router state snapshot: ActivatedRouteSnapshot tree has nodes for each outlet. Angular router iterates all outlets during navigation — guards checked for each. Performance consideration: named outlets increase router complexity — each navigation potentially updates multiple outlet states. RouteReuseStrategy applies per-outlet. Complex URL serialization може бути проблемою для server-side routing (must parse Angular URL syntax). Limitation: named outlet route і primary route share RouterModule providers — no outlet-specific DI scope."
    commonMistakes:
      - "Думають що named outlet = окремий router з власними guards — ні, guards спільні"
      - "Забувають що closing outlet потребує `router.navigate([{outlets: {name: null}}])` не просто navigate away"
    relatedQuestions: ["b6t7q2", "b6t7q3"]
  - level: "mid"
    question: "Як навігувати до named outlet і як виглядає URL з auxiliary routes?"
    referenceAnswers:
      junior: "Для navigation до named outlet використовуємо router.navigate з outlets object. URL виглядає з дужками: /path(outletName:routePath)."
      mid: "Programmatic: `router.navigate([{ outlets: { panel: ['detail', id] } }])`. RouterLink: `[routerLink]=\"[{ outlets: { panel: ['detail', id] } }]\"`  Preserve primary: `[{ outlets: { panel: ['detail', id], primary: currentPrimary } }]`. URL: `/list(panel:detail/1)`. Close outlet: `router.navigate([{ outlets: { panel: null } }])`. Multiple: `/home(sidebar:menu//dialog:confirm)`."
      senior: "URL serialization details: Angular DefaultUrlSerializer використовує regex-based parsing. Primary segment: перед першими дужками. Auxiliary: `(outletName:path/segments//outlet2:path2)`. Double slash `//` separates multiple auxiliary outlets. Query params: `/path(aux:route)?param=value` — query params global до URL. Fragment: `/path(aux:route)#section`. Navigation з збереженням outlets: `router.navigate(['.'], { relativeTo: this.route })` — primary navigation, auxiliary outlets preserved by default. Outlets і navigateByUrl: `router.navigateByUrl('/list(panel:detail/1)')` — explicit full URL з outlets. Deactivating outlet: `{ outlets: { panel: null } }` → outlet deactivated, component destroyed, URL cleaned. ActivatedRoute для named outlet component: inject ActivatedRoute → route.outlet === 'panel', route.params для outlet-specific params."
      staff: "URL serialization і auxiliary routes — deep Router internals. UrlTree structure: `{ queryParams, fragment, root: UrlSegmentGroup { segments: [], children: { primary: UrlSegmentGroup, aux1: UrlSegmentGroup } } }`. DefaultUrlSerializer.serialize(): primary segment first, then `(aux1:path//aux2:path)`. DefaultUrlSerializer.parse(): `PRIMARY_OUTLET = 'primary'`. Parsing regex handles nested parens (outlets within outlets for nested lazy routes). Custom UrlSerializer: implement UrlSerializer interface — override serialize() і parse(). Use case: prettier URLs (hash-based auxiliary routes, different separator). Pitfall: якщо custom UrlSerializer не handles auxiliary routes — broken navigation. Router.createUrlTree(commands, extras): merges current URL tree з commands — respects existing auxiliary outlet states. Critical: `router.navigate(['/path'])` без explicit outlet reset → auxiliary outlets preserved. Explicit reset: `router.navigate(['/path', { outlets: { sidebar: null } }])`. This is a common source of stale auxiliary outlet bugs."
    commonMistakes:
      - "Не знають що navigate без explicit outlet param зберігає existing outlet state"
      - "Намагаються navigateByUrl з outlets і не розуміють синтаксис URL serialization"
    relatedQuestions: ["b6t7q1", "b6t7q3"]
  - level: "senior"
    question: "Коли варто використовувати auxiliary routes і коли вони — antipattern?"
    referenceAnswers:
      junior: "Auxiliary routes корисні коли потрібно показати кілька компонентів одночасно незалежно, наприклад sidebar і main content."
      mid: "Auxiliary routes доцільні: master-detail layout де detail URLable, persistent sidebar з власним state, multi-panel dashboard де кожен panel bookmarkable. Antipattern: modals (краще Angular CDK Dialog), tooltips, ephemeral UI що не повинна бути в URL. Auxiliary routes додають URL complexity."
      senior: "Auxiliary routes use cases (legitimate): 1) Master-detail де detail має власний URL (share link, browser back). 2) Side panel з navigation history (user може back до попереднього panel state). 3) Split-view applications (email client: list | detail). 4) Dashboard з configurable panels (user може bookmark конкретну конфігурацію panels). Antipatterns: 1) Modals — modal state не завжди URL-worthy. CDK Dialog краще. Exception: confirmation dialog з власним route для deep-linking. 2) Tooltips, popovers — ephemeral, never URL state. 3) Loading states — routing shouldn't drive loading indicators. 4) Overusing outlets — 3+ simultaneous outlets = URL nightmare, maintenance hell. Alternative patterns: Query params для simple state (`?tab=details&panel=comments`). Router state snapshot для non-URL state. Component-level state service для panel visibility. Auxiliary routes мають value коли state MUST be in URL для shareability/bookmarkability."
      staff: "Auxiliary routes — architectural decision з long-term consequences. Cost-benefit analysis: Benefits: URL-driven state = shareable, bookmarkable, browser back/forward. Parallel navigation contexts. Costs: URL complexity (hard to read, debug), server-side routing complexity (SPA server must handle `(aux:path)` syntax), SEO implications (Google might not follow auxiliary route URLs), increased router configuration complexity, potential z-index/overlay issues for panel components. When to use: email-like split view, document editor з property inspector, IDE-like tools з multiple panels. When to avoid: typical CRUD app з occasional modal/detail — query params або React-style conditional rendering simpler. Pattern comparison: Auxiliary routes vs Query Params: routes = component instantiation/destruction, query params = data passing без lifecycle change. Angular CDK Dialog vs auxiliary route для modals: CDK Dialog simpler, no URL, programmatic control. Named outlet для modal: useful якщо modal has own navigation (wizard steps). Migration: якщо auxiliary routes стали unmaintainable — замінити на query params + component router або CDK Dialog. ng2-query-params-router pattern."
    commonMistakes:
      - "Використовують auxiliary routes для будь-якого overlay/modal без оцінки необхідності URL state"
      - "Не розуміють що 3+ outlets роблять URL illegible і maintenance nightmare"
    relatedQuestions: ["b6t7q2", "b6t7q4"]
  - level: "senior"
    question: "Що таке RouteReuseStrategy і як вона дозволяє зберігати стан компонентів при навігації?"
    referenceAnswers:
      junior: "RouteReuseStrategy дозволяє Angular зберігати (reuse) компоненти при навігації замість destroy+recreate. Це покращує performance."
      mid: "RouteReuseStrategy interface: shouldReuseRoute() — чи reuse existing component. shouldDetach() — чи store component для майбутнього reuse. store() — зберегти DetachedRouteHandle. shouldAttach() — чи attach stored component. retrieve() — повернути stored handle. Default strategy: reuse тільки якщо route config однакова."
      senior: "RouteReuseStrategy — advanced caching механізм для route components. Interface methods: 1) `shouldReuseRoute(future, curr): boolean` — called for every navigation. Return true → keep existing component (no destroy/create). Default: same RouteConfig reference. 2) `shouldDetach(route): boolean` — should we detach this component for later reuse? 3) `store(route, handle)` — store DetachedRouteHandle. 4) `shouldAttach(route): boolean` — should we reattach a stored component? 5) `retrieve(route): DetachedRouteHandle` — return stored handle. Custom implementation: store Map<string, DetachedRouteHandle>. Key by route URL. shouldDetach для specific routes (e.g., complex table з scroll position). shouldAttach якщо stored. Pitfall: stored component — живий з CD running. Memory leak якщо store занадто багато. Selective: тільки high-value routes (complex list з filters, tab views). ngOnAttach/ngOnDetach lifecycle hooks (Angular 14+)."
      staff: "RouteReuseStrategy — route component lifecycle orchestrator. Deep implementation: DetachedRouteHandle = `{ componentRef: ComponentRef<any>, contexts: Map<string, RouteContext> }`. Storing detaches view від DOM але зберігає component instance, injectors, state, subscriptions. Attaching: re-attaches view до ViewContainerRef. CD: detached component has CD running in background (якщо не explicitly detach CD). Memory: detached components consumé memory + potential CD overhead. Production strategy: 1) Max cache size: LRU cache (LinkedHashMap), evict oldest accessed. 2) Detach ChangeDetector: `cdRef.detach()` on detach, `cdRef.reattach()` on attach. 3) ngOnAttach/ngOnDetach lifecycle hooks (v14+): `ngOnDetach() { this.saveScrollPosition(); }` `ngOnAttach() { this.restoreScrollPosition(); }`. 4) Invalidation: user logout → clear all stored handles. Role change → clear stored handles for restricted routes. 5) Named outlet consideration: RouteReuseStrategy works per-outlet. Separate cache keys for primary vs named outlets. Use case: tab navigation (tab1, tab2, tab3) — switch between tabs without destroying — preserves form state, scroll position, loaded data."
    commonMistakes:
      - "Зберігають всі routes без max cache size — memory leak"
      - "Не detach ChangeDetector для stored components — CPU waste на background CD cycles"
    relatedQuestions: ["b6t7q3", "b6t7q5"]
  - level: "staff"
    question: "Як спроектувати routing architecture для enterprise SPA з 100+ routes, multi-tenant, і role-based access?"
    referenceAnswers:
      junior: "Для багатьох routes використовують lazy loading. Для ролей — route guards. Multi-tenant можна реалізувати через subdomain або URL prefix."
      mid: "Lazy loading per feature module. Guards: canActivate для role check, inject AuthService. Multi-tenant: URL prefix (/tenant1/feature або subdomain). Route data для roles. Centralized auth guard що перевіряє roles з route data."
      senior: "Enterprise routing architecture: 1) Feature-based code splitting: один lazy chunk per feature domain (не per page). 2) Guard composition: functional guards + inject(). Shared canActivateFn: `export const authGuard: CanActivateFn = (route) => inject(AuthService).canActivate(route.data['roles'])`. 3) Multi-tenant: URL prefix strategy `/tenant/:tenantId/feature`. TenantGuard extract tenantId → inject TenantService.setTenant(). Subdomain approach: custom UrlMatcher per tenant. 4) Route data typing: `interface RouteData { roles?: string[]; title: string; preload?: boolean; breadcrumb?: string; }`. 5) Nested routing: feature modules мають власні child routes. Lazy children з own routing module. 6) Error routes: ** wildcard per module + global. 7) Router testing: RouterTestingModule.withRoutes(), спеціальні test helpers для navigation."
      staff: "Enterprise routing architecture — системний підхід. Design dimensions: 1) Route hierarchy mirrors domain model: /tenant/:id/domain/:feature/action. Tenant і feature = separate lazy chunks. 2) Guard pipeline: route guards compose via canActivateGuardFn chain. Order: AuthGuard → TenantGuard → PermissionGuard → FeatureFlagGuard. Early exit on failure. 3) Resolver strategy: mandatory data via resolvers (prevent partial renders) vs optional data via services. Resolvers block navigation — only for critical data. 4) Router state management: RouterStore (NgRx) або custom signal-based router state — decouple components від Router API. Components read from store, not inject(Router). 5) URL design: semantic URLs для SEO і UX. Avoid deeply nested /a/b/c/d/e — max 4 levels. 6) Multi-tenant + SSR: server reads tenant from subdomain/header, transfers state via TransferState, Angular client uses transferred tenant без additional API call. 7) Route-level code ownership: каждий feature team owns їх routes section. Route conflicts via module boundary linting. 8) Performance: route.resolve lazy (Observable.pipe(take(1))) для timeout. CanDeactivate guards для unsaved changes — business-critical. 9) Testing: integration tests per feature route module, e2e для critical paths. Router event testing: fakeAsync + RouterTestingHarness (Angular 15+)."
    commonMistakes:
      - "Один giant routes.ts файл для 100+ routes — не scalable, merge conflicts"
      - "Guards як classes з canActivate method — deprecated в v15, використовують functional guards"
    relatedQuestions: ["b6t7q4", "b6t7q3"]
---

## Core Concept

**English definition:** Advanced Angular routing patterns include named outlets (auxiliary routes) for parallel route states encoded in the URL, `RouteReuseStrategy` for component lifecycle caching during navigation, custom `UrlSerializer` for URL structure control, and architectural patterns for organizing large-scale routing configurations with lazy loading, guards, and resolvers.

**Пояснення:** Просте routing (один router-outlet, path → component) покриває більшість apps. Advanced patterns потрібні для складних UI: email-client layout де і список і деталь мають URL стан (named outlets), tab navigation де перемикання між tabs зберігає scroll і форми (RouteReuseStrategy), enterprise apps з 50+ routes де organization — сам по собі архітектурний challenge.

**Яку проблему вирішує:** Named outlets: як зробити URL-addressable parallel UI panels без hack. RouteReuseStrategy: як уникнути destroy/recreate дорогих компонентів при navigation. Enterprise routing architecture: як масштабувати routing на 100+ routes без maintenance nightmare.

**Як працює під капотом:**

URL serialization з auxiliary routes:
```
http://app.com/list(panel:detail/1//sidebar:menu)
                ^     ^             ^
                |     |             └── другий auxiliary outlet
                |     └── auxiliary outlet 'panel' з path 'detail/1'
                └── primary outlet path

UrlTree internal structure:
{
  root: UrlSegmentGroup {
    segments: [],
    children: {
      primary: UrlSegmentGroup { segments: ['list'] },
      panel:   UrlSegmentGroup { segments: ['detail', '1'] },
      sidebar: UrlSegmentGroup { segments: ['menu'] }
    }
  },
  queryParams: {},
  fragment: null
}
```

Router navigation з outlets:
```typescript
// Commands array for multi-outlet navigation:
router.navigate([{
  outlets: {
    primary: ['list'],
    panel: ['detail', id],
    sidebar: ['menu']
  }
}]);

// Closing a specific outlet (removes from URL):
router.navigate([{ outlets: { panel: null } }]);

// Preserving existing outlets (only change primary):
router.navigate(['/new-path']);
// → auxiliary outlets states preserved in URL
```

RouteReuseStrategy flow:
```
Navigation starts
      ↓
shouldReuseRoute(future, current)?
  YES → keep component, no lifecycle hooks → NavigationEnd
  NO ↓
shouldDetach(current)?
  YES → store(current, handle) → detach view from DOM
  NO → destroy component normally
      ↓
shouldAttach(future)?
  YES → retrieve(future) → reattach view to DOM → ngOnAttach()
  NO → create new component instance → ngOnInit()
```

**Trade-offs та обмеження:**

- Named outlets: URL complexity (`/path(aux:route)`) — важко debug, SSR конфігурація складніша
- Named outlets: максимум 1 primary outlet + N named outlets, але 3+ named → URL illegible
- RouteReuseStrategy: stored components consumé memory і потенційно CPU (CD running in background)
- Named outlet routing: деякі Angular features (title strategy, breadcrumb) не completed support для non-primary outlets
- Custom UrlSerializer: breaking change для existing URLs якщо не backward compatible

**Версійність:** Named outlets (auxiliary routes) — Angular 2+. RouteReuseStrategy interface — Angular 2+. `ngOnAttach`/`ngOnDetach` lifecycle hooks — Angular 14. `RouterTestingHarness` — Angular 15 для easier router testing. `withNavigationErrorHandler()` — Angular 16 для global navigation error handling. `withViewTransitions()` — Angular 17 для browser View Transitions API integration між routes.

## Deep Details

### Edge Cases

**Named outlets і lazy loading:** Lazy-loaded route у named outlet потребує `outlet: 'name'` в route config. Lazy chunk registration: коли lazy module preloaded — Angular registers всі routes includings named outlet routes.

**canActivate на named outlet routes:** Guards working on auxiliary routes same as primary. Якщо guard redirects — primary outlet navigated to redirect, auxiliary outlet state unchanged. This can cause UI inconsistency.

**Named outlets і router.navigate merging:** `router.navigate(['/path'])` — primary changes, auxiliary outlets PRESERVED in URL. This is surprising behavior. Use `router.navigateByUrl('/path')` to RESET all outlets. Or explicit: `router.navigate([{ outlets: { primary: 'path', aux: null } }])`.

**RouteReuseStrategy і nested routes:** Strategy applied per route config. Parent route reuse decision affects children. If parent not reused — children recreated regardless of their own strategy decision.

**Circular outlet references:** Auxiliary route component contains `<router-outlet>` — nested outlet. Angular supports this but URL serialization becomes deeply nested. Limit nesting depth.

**withViewTransitions і named outlets:** View Transitions API wraps DOM changes in transition. Multiple simultaneous outlet changes = multiple concurrent transitions. May conflict. `skipInitialTransition: true` для initial load.

### Junior vs Senior Understanding

**Junior** knows: `<router-outlet name="aux">`, route config `{ outlet: 'aux' }`, basic navigation to named outlet.

**Senior** understands:

1. **URL serialization format:** `(aux:path//aux2:path2)` parentheses encoding. UrlTree structure with children map keyed by outlet name.

2. **Navigation merging behavior:** `router.navigate(['/path'])` preserves auxiliary outlet states. `router.navigateByUrl('/path')` resets all.

3. **RouteReuseStrategy all 5 methods** and their decision flow. DetachedRouteHandle structure. Memory implications.

4. **ngOnAttach/ngOnDetach hooks** (Angular 14+) для state save/restore.

5. **When NOT to use:** named outlets for modals/tooltips. CDK Dialog/Overlay better for ephemeral UI.

### Deprecation & Migration Path

- **Class-based route guards with canActivate interface:** Deprecated v15. Migrate to functional guards: `export const myGuard: CanActivateFn = (route, state) => inject(MyService).check()`.
- **RouterModule.forRoot() extensive options:** Migrate to individual `with*()` functions: `withRouterConfig()`, `withPreloading()`, `withNavigationErrorHandler()`, `withViewTransitions()`.
- **Router.initialNavigation():** Use `withEnabledBlockingInitialNavigation()` або `withDisabledInitialNavigation()` у `provideRouter()`.
- **ActivatedRouteSnapshot.queryParams:** Still valid but consider Angular 16+ `input()` with signal binding: `routerLink` params as signal inputs.

### Connections to Other Concepts

- **Angular CDK Overlay/Dialog:** Alternative to named outlets for modal/panel patterns — simpler for ephemeral UI
- **NgRx Router Store:** Serializes router state to NgRx store — enables time-travel debugging, decouples components від Router
- **Change Detection:** RouteReuseStrategy stored components — CD implications of detached/reattached views
- **Guards and Resolvers:** Guard pipeline complexity grows with named outlets — each outlet's routes need guard consideration
- **SSR:** Named outlet URLs (`/path(aux:route)`) need special handling server-side (Express route matching)

## Examples

### Basic Usage

```typescript
// Named outlet setup — master-detail layout
// app.routes.ts
export const routes: Routes = [
  {
    path: 'inbox',
    component: InboxComponent,
    children: [
      { path: '', component: MessageListComponent },
      // Named outlet route for message detail panel
      {
        path: 'message/:id',
        component: MessageDetailComponent,
        outlet: 'detail'  // Named outlet
      }
    ]
  }
];

// app.component.html
@Component({
  template: `
    <div class="app-layout">
      <router-outlet></router-outlet>
      <!-- Named outlet for detail panel -->
      <router-outlet name="detail"></router-outlet>
    </div>
  `
})
export class AppComponent {}

// inbox.component.html
@Component({
  template: `
    <div class="inbox-layout">
      <div class="message-list">
        @for (msg of messages(); track msg.id) {
          <!-- Navigate to named outlet -->
          <a [routerLink]="[{ outlets: { detail: ['message', msg.id] } }]">
            {{ msg.subject }}
          </a>
        }
      </div>

      <div class="message-detail">
        <router-outlet name="detail"></router-outlet>
      </div>
    </div>
  `
})
export class InboxComponent {
  messages = signal<Message[]>([]);
}
```

```typescript
// Programmatic navigation with named outlets
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);

  openDetail(id: string): void {
    // Navigate to named outlet while preserving primary outlet
    this.router.navigate([{
      outlets: {
        detail: ['message', id]
      }
    }]);
  }

  closeDetail(): void {
    // Close/deactivate named outlet
    this.router.navigate([{
      outlets: { detail: null }
    }]);
  }

  openMultiplePanels(detailId: string): void {
    // Navigate multiple outlets simultaneously
    this.router.navigate([{
      outlets: {
        primary: ['inbox'],
        detail: ['message', detailId],
        sidebar: ['folder-tree']
      }
    }]);
  }
}
```

### Production Scenario

```typescript
// RouteReuseStrategy for tab navigation
import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle
} from '@angular/router';

interface CacheEntry {
  handle: DetachedRouteHandle;
  timestamp: number;
}

@Injectable()
export class TabRouteReuseStrategy implements RouteReuseStrategy {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_CACHE_SIZE = 10;
  private readonly MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

  /** Should we keep the current route active? */
  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    // Reuse if same route config (default Angular behavior)
    return future.routeConfig === curr.routeConfig;
  }

  /** Should we cache this route when navigating away? */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return !!(route.routeConfig?.data?.['reuse']);
  }

  /** Store the route for future reuse */
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const key = this.getRouteKey(route);

    if (!handle) {
      this.cache.delete(key);
      return;
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldest = [...this.cache.entries()]
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
      this.cache.delete(oldest[0]);
    }

    this.cache.set(key, { handle, timestamp: Date.now() });
  }

  /** Should we attach a previously stored route? */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (!route.routeConfig?.data?.['reuse']) return false;

    const key = this.getRouteKey(route);
    const entry = this.cache.get(key);

    if (!entry) return false;

    // Expire old cached routes
    if (Date.now() - entry.timestamp > this.MAX_AGE_MS) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /** Retrieve stored route */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const key = this.getRouteKey(route);
    const entry = this.cache.get(key);
    if (entry) {
      entry.timestamp = Date.now(); // Update access time (LRU)
    }
    return entry?.handle ?? null;
  }

  /** Clear cache on logout or role change */
  clearCache(): void {
    this.cache.clear();
  }

  private getRouteKey(route: ActivatedRouteSnapshot): string {
    // Include params in key for parameterized routes
    const path = route.routeConfig?.path ?? '';
    const params = JSON.stringify(route.params);
    return `${path}:${params}`;
  }
}

// Provide in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: TabRouteReuseStrategy },
  ],
};

// Route config with reuse flag
export const routes: Routes = [
  {
    path: 'list',
    component: DataListComponent,
    data: { reuse: true } // This component will be cached
  },
  {
    path: 'form/:id',
    component: EditFormComponent,
    // No reuse flag → always fresh
  }
];

// Component using ngOnAttach/ngOnDetach (Angular 14+)
@Component({ selector: 'app-data-list', template: `...` })
export class DataListComponent {
  private scrollY = 0;

  ngOnDetach(): void {
    // Called when RouteReuseStrategy detaches (caches) this component
    this.scrollY = window.scrollY;
  }

  ngOnAttach(): void {
    // Called when RouteReuseStrategy reattaches (restores) this component
    requestAnimationFrame(() => window.scrollTo(0, this.scrollY));
  }
}
```

### Anti-Example

```typescript
// WRONG: Using named outlets for simple modal — overkill
// Route config for modal
const wrongRoutes: Routes = [
  {
    path: 'confirm-delete',
    component: ConfirmDeleteModalComponent,
    outlet: 'modal' // WRONG: simple confirmation dialog doesn't need URL state
  }
];

// Template with unnecessary named outlet
@Component({
  template: `
    <router-outlet></router-outlet>
    <router-outlet name="modal"></router-outlet>  <!-- WRONG: modal via named outlet -->
  `
})
class AppComponent {}

// This is better:
@Component({ template: `<router-outlet></router-outlet>` })
class GoodAppComponent {
  private dialog = inject(MatDialog);

  openConfirmation(): void {
    // CORRECT: CDK Dialog for ephemeral UI — no URL pollution
    this.dialog.open(ConfirmDeleteModalComponent)
      .afterClosed()
      .subscribe(confirmed => { /* handle result */ });
  }
}

// WRONG: RouteReuseStrategy caches everything without limits
@Injectable()
export class BadReuseStrategy implements RouteReuseStrategy {
  private handlers = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return true; // WRONG: cache ALL routes → memory explosion
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    this.handlers.set(route.routeConfig!.path!, handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.handlers.has(route.routeConfig!.path!); // WRONG: no expiration
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.handlers.get(route.routeConfig!.path!) ?? null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}

// WRONG: Not closing named outlet on navigation
@Component({ template: `<a routerLink="/other">Navigate away</a>` })
class BadNavComponent {
  // WRONG: navigating away from page doesn't close named outlet
  // '/other(detail:message/1)' → user goes to /other but detail panel stays!
  // Must explicitly close: router.navigate(['/other', { outlets: { detail: null } }])
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Named outlet для модальних вікон і ephemeral UI | URL complexity для UI що не потребує bookmark/share | CDK `MatDialog` або `Overlay` — programmatic, no URL pollution |
| RouteReuseStrategy кешує всі routes без ліміту | Memory leak — stored components accumulate без eviction | LRU cache з max size (10) і TTL (30 min), `shouldDetach` тільки для selected routes |
| `router.navigateByUrl('/path')` для часткової outlet navigation | Скидає ВСІ outlet states — unexpected UX | `router.navigate([{ outlets: { primary: 'path' } }])` для точного контролю |
| 3+ одночасні named outlets | URL стає `(a:x//b:y//c:z)` — нечитабельно, важко debug і тестувати | Максимум 1-2 named outlets; для більшого — component-level state або CDK layout |
| Functional guards відсутні для named outlet routes | Guard може не спрацювати для secondary outlet navigation | Явно додавати guards до КОЖНОГО outlet route config |

## Interview Block

### [L1 — Warm-up] Що таке named outlet і як його оголосити?

**Signal being tested:** Знання Angular Router API для паралельного rendering і базове розуміння auxiliary routes.

**What the interviewer expects:** `<router-outlet name="xxx">`, route config `{ outlet: 'xxx' }`, navigation з `{ outlets: { xxx: ['path'] } }`.

**How to probe deeper:** "Як виглядає URL коли активований named outlet? Як його деактивувати?"

**Reference answer:** Named outlet — додатковий `<router-outlet name="panel">`. Route config: `{ path: 'detail/:id', component: DetailComponent, outlet: 'panel' }`. Navigation: `router.navigate([{ outlets: { panel: ['detail', id] } }])`. URL: `/list(panel:detail/1)` — auxiliary outlets в дужках. Закрити: `router.navigate([{ outlets: { panel: null } }])`.

**Common mistakes:** Не знають URL encoding format; думають navigate до primary автоматично закриває named outlets.

### [L2 — Mid] Як навігувати до named outlet і яка різниця між router.navigate і navigateByUrl для outlets?

**Signal being tested:** Практичне розуміння navigation commands і merging behavior для multiple outlets.

**What the interviewer expects:** outlets object в commands array, navigateByUrl скидає всі outlets, navigate зберігає existing, explicit null для deactivation.

**How to probe deeper:** "Що відбудеться з named outlet коли користувач натисне Back у браузері?"

**Reference answer:** `router.navigate([{ outlets: { panel: ['detail', id] } }])` — змінює panel outlet, primary outlet preserves. `router.navigateByUrl('/path')` — скидає ВСІ outlets. `router.navigate(['/path'])` — primary changes, auxiliary preserved. Explicit close: `{ outlets: { panel: null } }`. Browser Back — відновлює попередній URL повністю, включно з outlet state.

**Common mistakes:** Думають navigate('/path') скидає auxiliary outlets; не знають про explicit null для deactivation.

### [L3 — Senior] Коли варто використовувати auxiliary routes і коли вони antipattern?

**Signal being tested:** Архітектурне мислення — оцінка trade-offs URL complexity vs bookmarkability для різних UI patterns.

**What the interviewer expects:** Use cases (master-detail, email-like, dashboards), antipatterns (modals, tooltips), alternatives (CDK Dialog, query params), URL complexity cost.

**How to probe deeper:** "Яка альтернатива named outlet для модального вікна де стан має бути в URL (наприклад, wizard)?"

**Reference answer:** Auxiliary routes доцільні коли UI state MUST be bookmarkable/shareable: split-view applications (email: list + detail), dashboards з configurable panels. Antipatterns: simple modals (CDK Dialog), tooltips, loading states. Alternatives: query params для simple state, component-level services для panel visibility. Cost: URL illegible (`/path(a:x//b:y)`), SSR complexity, SEO implications. Rule: якщо user cannot benefit від sharing/bookmarking URL with outlet state — не використовуй.

**Common mistakes:** Default до named outlets для будь-якого overlay; не розглядають CDK Overlay як simpler alternative.

### [L4 — Staff/Principal] Як спроектувати routing architecture для enterprise SPA з 100+ routes?

**Signal being tested:** System-level мислення про maintainability, team ownership, performance, і security для large-scale routing.

**What the interviewer expects:** Feature-based code splitting, functional guards composition, multi-tenant URL strategy, resolver strategy, route ownership per team, testing approach.

**How to probe deeper:** "Як організувати routing щоб 5 різних teams могли паралельно працювати без conflicts?"

**Reference answer:** Feature-based routing modules: кожна команда owns окремий lazy routes file. `loadChildren: () => import('./feature/feature.routes')`. Guard composition pipeline: Auth → Tenant → Permission → FeatureFlag (ordered, fail-fast). Route data typed interface. Multi-tenant: URL prefix `/tenant/:id/` або subdomain з TenantGuard. Max 4 nesting levels. RouterStore (NgRx) або custom signal store для decoupling від Router API. Метрики: route-level code ownership, guard execution time, lazy chunk sizes per team.

**Common mistakes:** Single giant routes.ts file; class-based deprecated guards; no testing strategy for routing; no team ownership boundaries.

---

## Summary

### Key Points
- Named outlets (`<router-outlet name="x">`) — parallel route states в URL: `/path(aux:route//aux2:route2)`
- `router.navigate([{ outlets: { aux: null } }])` — деактивувати outlet; `router.navigate(['/path'])` — зберігає auxiliary outlet states
- `RouteReuseStrategy` — component lifecycle caching: `shouldDetach/store/shouldAttach/retrieve/shouldReuseRoute`
- `ngOnDetach`/`ngOnAttach` lifecycle hooks (Angular 14+) для state save/restore при reuse
- Named outlets max 2 — більше робить URL нечитабельним і maintenance nightmare
- CDK Dialog/Overlay > named outlets для ephemeral UI (modals, tooltips, confirmations)
- Enterprise routing: feature-based lazy chunks, functional guards pipeline, typed route data, team ownership per routes section

### Elevator Pitch (2 minutes)
Advanced Angular routing має три ключові patterns. Named outlets — паралельні route states в URL: `<router-outlet name="panel">`, route config `{ outlet: 'panel' }`, navigation через `{ outlets: { panel: ['path'] } }`. URL кодує стан як `/list(panel:detail/1)`. Використовуй для master-detail, email-like, dashboard з configurable panels — де URL state має сенс. Для модалів і ephemeral UI — CDK Dialog простіший. RouteReuseStrategy — кешує компоненти при navigation: `shouldDetach` зберігає component instance, `shouldAttach` відновлює, `ngOnDetach/ngOnAttach` lifecycle hooks для scroll/state збереження. LRU cache з max size і TTL — обов'язково. Enterprise architecture: feature-based lazy routes (кожна команда owns своїх routes), functional guards composition pipeline, typed route data interface, RouterStore для decoupling від Router API.
