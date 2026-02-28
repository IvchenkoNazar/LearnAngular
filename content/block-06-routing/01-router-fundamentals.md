---
title: "Router Fundamentals: Configuration and Navigation"
block: 6
topic: 1
slug: "router-fundamentals"
difficulty: 2
sinceVersion: "2"
tags: ["router", "Routes", "RouterLink", "RouterOutlet", "navigation", "provideRouter"]
relatedTopics: ["lazy-loading", "guards", "route-data", "router-events", "bootstrapping"]
interviewQuestions:
  - id: "b6t1q1"
    level: "junior"
    question: "Як налаштувати базовий Angular Router і що таке RouterOutlet?"
    referenceAnswers:
      junior: "provideRouter(routes) додається до providers в bootstrapApplication. Routes — масив об'єктів з path і component. RouterOutlet — місце в template де Angular рендерить активний компонент."
      mid: "Angular Router configuration: `provideRouter(routes)` у bootstrapApplication providers. Routes array: `[{ path: 'home', component: HomeComponent }, { path: '', redirectTo: 'home', pathMatch: 'full' }]`. RouterOutlet — директива що marks rendering location. RouterLink — директива для navigation links з `[routerLink]='['/path']'`. `routerLinkActive='active-class'` — CSS class при active route. Router service: `inject(Router).navigate(['/path'])` для programmatic navigation."
      senior: "Router architecture: RouterModule provides routing directives і services. provideRouter() — standalone equivalent. Route matching: top-down, first match wins. pathMatch:'full' — вся URL повинна відповідати (для empty path redirect). pathMatch:'prefix' — default, URL починається з path. Router navigation lifecycle: 1) NavigationStart. 2) Route recognition (UrlMatcher). 3) Guards execution (CanActivate, CanMatch). 4) Resolver execution. 5) Component activation. 6) NavigationEnd. RouterOutlet — named outlets підтримуються: `<router-outlet name='sidebar'>` з `outlet:'sidebar'` в routes. Nested routing: child routes через `children:[]` у route config, nested RouterOutlet у parent component."
      staff: "Router internals: Router — singleton service з RouterStateSnapshot (tree of activated routes). Navigation — creates new RouterStateSnapshot, diffs з попереднім, applies changes. ActivatedRoute — snapshot of current route with params, data, queryParams. ActivatedRouteSnapshot vs ActivatedRoute: snapshot — immutable moment, ActivatedRoute — Observable-based reactive view. withComponentInputBinding() (Angular 16+): route params і resolver data mapped до component inputs автоматично — no ActivatedRoute injection needed. URL Serialization: DefaultUrlSerializer → UrlTree → URL string. Custom UrlSerializer для non-standard URLs. Router history state: Router tracks navigation history для back button support і location.back(). Hash vs PathLocation strategy: HashLocationStrategy для legacy servers without HTML5 history API."
    commonMistakes:
      - "pathMatch:'full' тільки для empty path redirect — забувають і redirect ніколи не спрацьовує"
      - "RouterLink з string замість array: `routerLink='/path'` — works але `[routerLink]='['/path']'` — standard для dynamic"
    relatedQuestions: ["b6t1q2", "b6t1q3"]
  - id: "b6t1q2"
    level: "mid"
    question: "Яка різниця між router.navigate() і router.navigateByUrl() і коли кожен використовувати?"
    referenceAnswers:
      junior: "navigate() приймає масив сегментів, navigateByUrl() — повний URL рядок."
      mid: "router.navigate(['/path', id]) — relative або absolute navigation з параметрами. Підтримує relative navigation від поточного route: `router.navigate(['../sibling'], { relativeTo: this.route })`. navigateByUrl('/path/123?query=val') — повний URL, завжди absolute. navigate() — для programmatic navigation з params. navigateByUrl() — якщо маєш повний URL (redirect URLs, deep links). Різниця: navigate() будує URL від route segments, navigateByUrl() parses готовий URL."
      senior: "navigate() підтримує NavigationExtras: queryParams, fragment, relativeTo, skipLocationChange, replaceUrl, state. `router.navigate(['/user', user.id], { queryParams: { tab: 'profile' } })` — builds URL. `replaceUrl: true` — replace history entry (not push). `skipLocationChange: true` — navigate without browser URL change (internal navigation). `state: { data: ... }` — passes state без URL (accessible via `router.getCurrentNavigation()?.extras.state`). navigateByUrl preserves only queryParams from NavigationExtras — не supports relativeTo. navigate() — завжди кращий вибір для type-safe navigation з params. navigateByUrl — рідко: deep link reconstruction, copy-paste navigation."
      staff: "navigate() і navigateByUrl() — public API Router. Internals: обидва через scheduleNavigation() → createNavigationRequest() → NavigationTransition pipeline. navigate() → parseRouteCommand() → builds UrlTree. navigateByUrl() → parseUrl() → UrlTree. Потім однаковий pipeline. Performance: navigate() з route segments — compiler може type-check (TypedRoute pattern). Router extras state — stored in browser History API state object (history.state) — survives page reload тільки якщо NavigationStart from history pop. Angular Router в SSR: router.navigate() works on server — needed for initial navigation, redirect routes. withPreloading() — affects background lazy loading, not navigate() timing. withRouterConfig({ onSameUrlNavigation: 'reload' }) — force re-navigation to same URL."
    commonMistakes:
      - "navigate() без relativeTo для child routes — navigates to root level"
      - "Передають state via queryParams замість extras.state — security issue (state in URL)"
    relatedQuestions: ["b6t1q1", "b6t1q3"]
  - id: "b6t1q3"
    level: "mid"
    question: "Що таке ActivatedRoute і як читати route parameters в Angular 19?"
    referenceAnswers:
      junior: "ActivatedRoute — injectable service що дає доступ до поточного route. Через `activatedRoute.params` можна читати URL параметри."
      mid: "ActivatedRoute — injectable з поточними route data. `route.paramMap` — Observable<ParamMap> для params. `route.snapshot.paramMap.get('id')` — snapshot для once-read. `route.queryParamMap` — query params. `route.data` — resolved data. З withComponentInputBinding (Angular 16+): params і data автоматично mapped до component @Input — не потрібен inject(ActivatedRoute)."
      senior: "ActivatedRoute hierarchy: кожен RouterOutlet рендерить компонент з власним ActivatedRoute. Вкладені routes — вкладені ActivatedRoute. `activatedRoute.parent` — parent route. `activatedRoute.firstChild` — first child route. paramMap vs params: paramMap — Map API (has/get/getAll). params — plain object. Обидва Observable. `snapshot` — поточний стан, не reactive — використовувати для одноразового читання. Reactive читання: `route.paramMap.pipe(switchMap(params => ...))` — перезавантажується при navigation between same component. withComponentInputBinding(): `@Input() id!: string` — автоматично отримує param. `@Input() data!: MyData` — отримує resolver result. Signal inputs: `id = input<string>()` — теж auto-mapped."
      staff: "ActivatedRoute internals: мусить зберігати Observable state для routing tree. ActivatedRoute обгортає ActivatedRouteSnapshot через BehaviorSubject-based properties. При navigation: новий snapshot created, route Observables emit new values. withComponentInputBinding — Angular 16+ Router feature: RouterOutlet автоматично sets component inputs від route params і data. Compiler-time benefit: TypeScript типи inputs перевіряються vs router config. Signal inputs compatible: `id = input<string>()` working з withComponentInputBinding. Guard input mapping: params → inputs → component initialization → lifecycle hooks. Order matters: inputs set before ngOnInit. Edge case: `relativeTo` in navigate — якщо неправильний ActivatedRoute — navigates to wrong level. Use `inject(ActivatedRoute)` in leaf component, not parent."
    commonMistakes:
      - "Використовують snapshot в ReusedRouteStrategy — snapshot stale, використовувати Observable"
      - "inject(ActivatedRoute) у service — отримують root route, не component route"
    relatedQuestions: ["b6t1q2", "b6t1q4"]
  - id: "b6t1q4"
    level: "senior"
    question: "Як правильно налаштувати wildcard routes і redirect routes в Angular?"
    referenceAnswers:
      junior: "`{ path: '**', component: NotFoundComponent }` — wildcard для 404. `{ path: '', redirectTo: '/home', pathMatch: 'full' }` — redirect з root."
      mid: "Wildcard `**` — matches anything, завжди останній в routes array. Redirect: `{ path: '', redirectTo: '/home', pathMatch: 'full' }` — empty path redirect. `pathMatch:'full'` обов'язковий для empty path щоб prevent infinite redirect. Nested redirects: redirect route відносний до prefix якщо не починається з /. Route order matters — first match wins."
      senior: "Route matching order is critical: 1) Specific paths first: `/user/profile`. 2) Parameterized paths: `/user/:id`. 3) Catch-all children: `/user/**`. 4) Wildcard: `**`. pathMatch algorithm: 'prefix' — поточний segment matching (consumed URL portion). 'full' — entire URL must match (useful for redirects і empty paths). Redirect chain: Angular allows max redirect depth (default 5) — redirect loop detection. Relative redirects: `redirectTo: 'home'` без `/` — relative to current prefix. Absolute redirect: `/home` — from root. In child routes: `{ path: '', redirectTo: 'default-child', pathMatch: 'full' }` — redirect to default child. Wildcard в feature route: `{ path: 'feature', children: [..., { path: '**', component: FeatureNotFoundComponent }] }` — feature-specific 404."
      staff: "Route matching — UrlMatcher function. Default: string path matching. Custom: `UrlMatcher` function `(segments, group, route) => UrlMatchResult | null`. Корисно для: regex-based paths, multi-segment matching, case-insensitive. Route reuse strategy: `RouteReuseStrategy` — контролює чи component destroyed при navigation. Default: destroy on deactivation. Custom: `shouldReuseRoute()`, `store()`, `retrieve()` — reuse components для performance (avoid re-initialization). Angular 16: `BindingReuse` — native param binding without re-creating component. Wildcard і lazy loading: `{ path: '**', loadComponent: () => import('./not-found.component') }` — lazy loaded 404 page. Route resolution: `UrlHandlingStrategy` — controls which URLs Router handles (for hybrid AngularJS/Angular apps)."
    commonMistakes:
      - "Wildcard route не на останньому місці — всі подальші routes ніколи не matchуться"
      - "Redirect з pathMatch:'prefix' для empty path — infinite redirect loop"
    relatedQuestions: ["b6t1q3", "b6t1q5"]
  - id: "b6t1q5"
    level: "staff"
    question: "Як спроектувати routing архітектуру для великого enterprise Angular application?"
    referenceAnswers:
      junior: "Lazy loading для feature routes, guards для захисту, resolvers для даних."
      mid: "Feature-based routing: кожна feature — окремий lazy-loaded route. Shared routing module або standalone routes в feature. Consistent naming, auth guards на protected routes, resolvers для initial data."
      senior: "Enterprise routing architecture: 1) Route hierarchy: /admin, /app, /public — top level separation. 2) Lazy loading: кожна feature loadComponent або loadChildren. 3) Guard layers: global auth guard, role guards per feature. 4) Resolvers: critical data before component. 5) Route data: static config (title, breadcrumbs, permissions). 6) Error handling: global error route, feature-specific 404. 7) withComponentInputBinding: params → inputs, no ActivatedRoute inject."
      staff: "Enterprise routing потребує architectural patterns для maintainability і scalability. Typed routes (Angular 15+): `createUrlTree` type checking via router config types. Route-level providers: feature services scoped до route — destroyed при navigation. Route state management: NgRx RouterStore або signal-based router state. Breadcrumb pattern via route data inheritance: `{ path: 'admin', data: { breadcrumb: 'Admin' }, children: [...] }` — cumulative breadcrumbs. Preloading strategies: QuicklinkStrategy (prefetch on hover), custom strategy based on user role/device. Route animations: `RouteAnimations` via data metadata. A/B testing via CanMatch guard — serve different components per feature flag. Router testing: RouterTestingHarness (Angular 15+) — testNavigate, getActiveComponent, fixture integration. Navigation guards composition: combineLatest guard factories. Custom URL serialization для tenant-based routing: `tenant.app.com/feature` → `/tenant/feature`. State persistence в URL: complex filters, pagination state encoded in queryParams for shareable links."
    commonMistakes:
      - "Не scoping route services — all services in root, memory overhead"
      - "Hard-coding navigation paths — use typed routes або route constants"
    relatedQuestions: ["b6t1q4", "b6t1q3"]
---

## Core Concept

**English definition:** The Angular Router is a client-side navigation engine that maps URL paths to component trees, manages navigation lifecycle (guards, resolvers, events), renders components into `RouterOutlet` placeholders, and maintains browser history — configured via `provideRouter(routes)` in standalone apps.

**Пояснення:** Angular Router — клієнтська навігаційна система. Routes array визначає mapping між URL і компонентами. RouterOutlet — місце рендерингу active component. RouterLink — декларативна навігація. Router service — programmatic navigation. Кожна navigation проходить lifecycle: guards → resolvers → component activation. ActivatedRoute — injectable з поточними route params, data, queryParams.

**Яку проблему вирішує:** SPA потребує client-side routing без повного page reload. Angular Router: URL → component mapping, guards для захисту routes, resolvers для pre-loading даних, deep linking підтримка, browser history management, lazy loading для code splitting.

**Як працює під капотом:** Router maintains RouterStateSnapshot — tree of ActivatedRouteSnapshot. Navigation: parse URL → match routes (top-down, first wins) → run guards → run resolvers → create new state → diff with previous → activate/deactivate components → update DOM via RouterOutlet → update browser URL. RouterOutlet creates component via ViewContainerRef. ActivatedRoute wraps snapshot via BehaviorSubjects.

**Trade-offs та обмеження:** First match wins — route order critical. Wildcard `**` must be last. pathMatch:'full' important for empty path redirects. Route reuse strategy — default destroys/recreates components на navigation. ActivatedRoute.snapshot — stale після navigation на same route.

**Версійність:** Router стабільний з Angular 2. Angular 14: functional guards (CanActivateFn). Angular 15: withComponentInputBinding — route params auto-bound to inputs. Angular 15.1: class-based guards deprecated. Angular 16: RouterTestingHarness. Angular 17: `withViewTransitions()` для browser View Transitions API. Angular 19: typed route trees.

---

## Deep Details

### Edge Cases

**pathMatch difference:** pathMatch:'prefix' — URL starts with path (default). pathMatch:'full' — entire remaining URL = path. Empty path '' with prefix — matches ALL routes (parent routes first match, never reaches children). Solution: pathMatch:'full' for '' redirects.

**relativeTo navigation:** `router.navigate(['../sibling'], { relativeTo: this.route })` — relative from current route. Without relativeTo — navigates from root. For child component: inject ActivatedRoute, pass to navigate.

**Same URL navigation:** Default: navigates only if URL changed. `withRouterConfig({ onSameUrlNavigation: 'reload' })` — re-runs guards/resolvers on same URL. Useful for refresh button simulation.

**NavigationExtras.state:** `router.navigate(['/page'], { state: { data: complex } })` — state not in URL, lives in history.state. Lost on refresh. Access: `this.router.getCurrentNavigation()?.extras.state` during navigation, or `history.state` afterwards.

**RouterOutlet multiple:** Multiple named outlets: `<router-outlet name="header"></router-outlet>`. Route: `{ path: 'hero', component: HeroDetailComponent, outlet: 'header' }`. Navigation to named outlet: `router.navigate([{ outlets: { header: ['hero'] } }])`.

### Junior vs Senior Understanding

**Junior** knows: routes array, RouterOutlet, RouterLink, programmatic navigate, ActivatedRoute params.

**Senior** understands:

1. **Navigation lifecycle:** 7 phases from NavigationStart to NavigationEnd. Guards/resolvers in order. CanDeactivate before leaving.

2. **ActivatedRoute hierarchy:** Each outlet has its own ActivatedRoute. parent/firstChild traversal. Snapshot vs Observable.

3. **withComponentInputBinding:** Automatic param-to-input binding. Signal inputs compatible. Removes ActivatedRoute boilerplate.

4. **Route matching algorithm:** UrlMatcher, prefix vs full, first-match ordering. Wildcard position criticality.

5. **RouterStateSnapshot diffing:** Router diffs old and new state trees to determine minimal DOM changes. Route reuse strategy.

### Deprecation & Migration Path

- **RouterModule.forRoot():** Still works but standalone pattern preferred: `bootstrapApplication(App, { providers: [provideRouter(routes)] })`.
- **Class-based guards:** Deprecated Angular 15.1. Migration: `ng generate @angular/core:route-guard-migration`. Functional CanActivateFn preferred.
- **RouterTestingModule:** Deprecated Angular 16. Use `RouterTestingHarness` instead.
- **ActivatedRoute.params (non-Observable):** Use paramMap Observable for reactive reading.

### Connections to Other Concepts

- **Lazy Loading:** Route loadComponent/loadChildren — code splitting via routes.
- **Guards:** CanActivate, CanDeactivate, CanMatch — route protection lifecycle.
- **Resolvers:** Route data pre-loading before component activation.
- **Change Detection:** Router navigation triggers CD. Signal-based components — reactive to route param signals.

---

## Examples

### Basic Usage

```typescript
// Route configuration
const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'users', component: UsersComponent },
  { path: 'users/:id', component: UserDetailComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', component: NotFoundComponent },  // Must be last
];

// Standalone app bootstrap
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
  ]
});

// Root app component with router outlet
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav>
      <a routerLink="/home" routerLinkActive="active">Home</a>
      <a routerLink="/users" routerLinkActive="active">Users</a>
    </nav>
    <router-outlet />
  `
})
export class AppComponent {}

// Component using withComponentInputBinding — no ActivatedRoute needed
@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: `
    @if (user()) {
      <h1>{{ user()!.name }}</h1>
    }
  `
})
export class UserDetailComponent implements OnInit {
  // Auto-bound from route :id param (withComponentInputBinding)
  id = input.required<string>();

  user = signal<User | null>(null);
  private userService = inject(UserService);

  ngOnInit(): void {
    this.userService.getUser(this.id()).subscribe(u => this.user.set(u));
  }
}
```

### Production Scenario

```typescript
// Feature-based route configuration
const appRoutes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component'),
        title: 'Dashboard'
      },
      {
        path: 'users',
        loadChildren: () => import('./users/users.routes').then(m => m.USERS_ROUTES),
        data: { breadcrumb: 'Users', requiredRole: 'user-manager' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component'),
        canActivate: [roleGuard('admin')],
        providers: [SettingsService],  // Route-scoped service
        title: 'Settings'
      },
    ]
  },
  { path: '**', loadComponent: () => import('./not-found/not-found.component') }
];

// Feature routes file: users/users.routes.ts
export const USERS_ROUTES: Routes = [
  {
    path: '',
    component: UsersShellComponent,
    children: [
      { path: '', component: UsersListComponent },
      {
        path: ':id',
        component: UserDetailComponent,
        resolve: { user: userResolver },
        title: (route) => `User ${route.paramMap.get('id')}`
      },
      { path: ':id/edit', component: UserEditComponent, canDeactivate: [unsavedChangesGuard] },
    ]
  }
];

// Programmatic navigation with state
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);

  goToUser(userId: string, fromPage?: string): void {
    this.router.navigate(['/app/users', userId], {
      queryParams: { returnTo: fromPage },
      state: { timestamp: Date.now() }
    });
  }

  goBack(fallback = '/app/dashboard'): void {
    const nav = this.router.getCurrentNavigation();
    const returnTo = nav?.extras?.queryParams?.['returnTo'];
    this.router.navigateByUrl(returnTo ?? fallback);
  }
}
```

### Anti-Example

```typescript
// WRONG: Wildcard route not last — all following routes unreachable
const routes: Routes = [
  { path: '**', component: NotFoundComponent },  // WRONG: catches everything
  { path: 'home', component: HomeComponent },     // NEVER reached
];

// WRONG: Empty path redirect without pathMatch: 'full'
const routes: Routes = [
  { path: '', redirectTo: '/home' },  // WRONG: no pathMatch:'full' — infinite redirect loop
];

// WRONG: Using snapshot for reactive data
@Component({ template: `...` })
export class UserComponent implements OnInit {
  ngOnInit() {
    // WRONG: snapshot doesn't update when navigating between users
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id');
    // If user navigates from /user/1 to /user/2 — same component, id stays '1'
  }
}

// CORRECT:
@Component({ template: `...` })
export class UserComponent {
  // With withComponentInputBinding — auto-updated on navigation
  id = input<string>('');
  private userService = inject(UserService);

  user = toSignal(
    toObservable(this.id).pipe(
      filter(id => !!id),
      switchMap(id => this.userService.getUser(id))
    )
  );
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Wildcard `**` не на останньому місці | Matches all subsequent routes — вони ніколи не активуються | Move `**` to very last position in routes array |
| Empty path redirect без `pathMatch: 'full'` | Infinite redirect loop — prefix '' matches all URLs | Always `pathMatch: 'full'` for empty path redirects |
| `ActivatedRoute.snapshot` для reactive navigation | Stale value when navigating between same-component routes | Observable paramMap або `withComponentInputBinding` |
| Hard-coded navigation paths | Typos, refactoring breaks — no type checking | Route constants або typed route helpers |
| inject(ActivatedRoute) in shared service | Service gets root ActivatedRoute, не component route | Pass ActivatedRoute from component або use Router state signal |

---

## Interview Block

### [L1 — Warm-up] Як налаштувати базовий Angular Router і що таке RouterOutlet?
**Signal being tested:** Знання routing setup і basic concepts — routes array, outlet, link.
**What the interviewer expects:** provideRouter(routes), RouterOutlet template, RouterLink, basic route object structure.
**How to probe deeper:** "Що означає pathMatch:'full' і коли він необхідний?"
**Reference answer:** provideRouter(routes) у providers bootstrapApplication. Routes: `[{ path, component }]`. RouterOutlet — directive що marks де компонент renders. RouterLink — navigation без page reload. pathMatch:'full' — entire URL must match path (required for '' redirects to prevent infinite loops).
**Common mistakes:** Missing pathMatch:'full' для empty path; wildcard not last.

### [L2 — Mid] Яка різниця між router.navigate() і router.navigateByUrl() і коли кожен використовувати?
**Signal being tested:** Практичне розуміння Router navigation API і NavigationExtras options.
**What the interviewer expects:** navigate() з segments і relativeTo, navigateByUrl() з повним URL, NavigationExtras, state.
**How to probe deeper:** "Як передати дані між routes без URL exposure?"
**Reference answer:** navigate(['/path', id]) — builds URL від segments, supports relativeTo і NavigationExtras. navigateByUrl('/full/url') — parses готовий URL. navigate() preferred: type-safe, supports queryParams, fragment, state, replaceUrl, skipLocationChange. state: `router.navigate(['/page'], { state: { data } })` — lives in history.state, not in URL, lost on refresh.
**Common mistakes:** navigate() без relativeTo для child routes; sensitive data in queryParams instead of state.

### [L3 — Senior] Що таке ActivatedRoute і як читати route parameters в Angular 19?
**Signal being tested:** Розуміння ActivatedRoute hierarchy і reactive vs snapshot reading, withComponentInputBinding.
**What the interviewer expects:** paramMap Observable vs snapshot, withComponentInputBinding для auto-binding, signal inputs compatibility.
**How to probe deeper:** "Коли використовувати snapshot і коли Observable для route params?"
**Reference answer:** ActivatedRoute: route-specific params, data, queryParams Observables. snapshot — immutable moment (use for one-time read at activation). Observable paramMap — reactive, updates when navigating between same-component routes. withComponentInputBinding(): params і data → @Input или signal input automatically. No ActivatedRoute injection needed. Signal input: `id = input<string>()` auto-bound.
**Common mistakes:** snapshot in reused components; inject(ActivatedRoute) в service (gets root route).

### [L4 — Staff/Principal] Як спроектувати routing архітектуру для великого enterprise Angular application?
**Signal being tested:** Архітектурне мислення про route organization, lazy loading, scoped services, URL state management.
**What the interviewer expects:** Feature-based hierarchy, route-scoped providers, preloading strategies, URL as state, typed routes.
**How to probe deeper:** "Як управляти complex filter state (50+ параметрів) в URL без performance проблем?"
**Reference answer:** Feature hierarchy: /app (auth-guarded), /auth, /public. Lazy loadChildren per feature. Route-scoped providers: feature services в route providers — auto-destroyed. withComponentInputBinding для params. Guards composition. URL state: encode filters in queryParams, sync via ActivatedRoute. Preloading: custom strategy based on user role (load admin chunks only for admins). Typed routes for type-safe navigation.
**Common mistakes:** All services in root; hard-coded paths; no route-scoped cleanup.

---

## Summary

### Key Points
- provideRouter(routes) — standalone Router setup, replaces RouterModule.forRoot()
- Routes: first-match-wins, wildcard `**` must be last, empty path needs pathMatch:'full'
- RouterOutlet renders active component, RouterLink navigates, RouterLinkActive adds CSS class
- navigate([segments], extras) — preferred over navigateByUrl для type-safe navigation
- ActivatedRoute: Observable paramMap для reactive reading, snapshot for one-time access
- withComponentInputBinding() — route params and resolver data auto-bound to @Input / signal inputs
- Route-scoped providers: services в route providers — destroyed при route deactivation (Angular 15+)

### Elevator Pitch (2 minutes)
Angular Router maps URLs to components. provideRouter(routes) — standalone setup. Routes array: `{ path, component, children, guards }`. RouterOutlet — rendering slot. RouterLink — declarative navigation. navigate(['/path', id]) — programmatic. Routes: first-match order, wildcard last, empty path needs pathMatch:'full'. ActivatedRoute: paramMap Observable (reactive) або snapshot (once). withComponentInputBinding() — route params auto-mapped to @Input/signal inputs (no ActivatedRoute injection). Route-scoped providers: feature services live only while route active — memory efficient. Guards: CanActivateFn (functional, Angular 15+). Class-based guards deprecated. Navigation lifecycle: guards → resolvers → component activation → NavigationEnd.
