---
title: "Route Data: Resolvers, Static Data, and withComponentInputBinding"
block: 6
topic: 4
slug: "route-data"
difficulty: 3
sinceVersion: "2"
tags: ["resolve", "route-data", "ResolveFn", "withComponentInputBinding", "ActivatedRoute", "route-params"]
relatedTopics: ["router-fundamentals", "guards", "lazy-loading", "inject-function", "di-internals"]
interviewQuestions:
  - id: "b6t4q1"
    level: "junior"
    question: "Що таке route resolver і навіщо він потрібен?"
    referenceAnswers:
      junior: "Resolver завантажує дані для компоненту до його активації. Angular чекає поки resolver завершить роботу і передає результат через ActivatedRoute.data."
      mid: "ResolveFn — функція що запускається до компоненту і повертає дані. Angular чекає Promise/Observable completion. Результат доступний через `route.data['key']` або автоматично через @Input з withComponentInputBinding. Переваги: component always has data on init, no loading state for data, clean component code."
      senior: "Resolver pattern vs component loading: component-side loading — component renders, then fetches (skeleton/spinner). Resolver — block navigation until data ready. Trade-off: resolver provides complete data on activation but добавляє navigation delay (user sees URL not changing while data loads). Functional resolver: `export const userResolver: ResolveFn<User> = (route) => inject(UserService).getUser(route.paramMap.get('id')!)`. Route config: `resolve: { user: userResolver }`. Data доступна: `route.data` Observable або `route.snapshot.data`. withComponentInputBinding: `@Input() user!: User` або `user = input<User>()` — автоматично mapped. Resolver cancellation: якщо user navigates away during resolver — Observable unsubscribed (Angular handles this)."
      staff: "Resolver design principles: використовуйте resolver тільки для data REQUIRED at initial render. Optional/enrichment data — load in component. Resolver failure: якщо resolver throws або returns EMPTY — navigation cancelled, NavigationError event. Navigation stays at previous URL. Graceful handling: `catchError(() => { router.navigate(['/error']); return EMPTY; })` в resolver. Performance: resolver delays navigation — keeps current route visible while loading. For UX: NavigationStart event → show global loading indicator. NavigationEnd → hide. Multiple resolvers: run in parallel (like guards combineLatest). Data access order: всі resolved before component activation. Resolver з retry: `this.http.get(url).pipe(retry(3), catchError(...))`. withComponentInputBinding і typed resolvers: Angular 16+ auto-binding. Resolver return type ResolveFn<T> — generic для type checking. Signal-based resolver data: поки не пряма підтримка — use toSignal(route.data.pipe(map(d => d['user'])))."
    commonMistakes:
      - "Резолвер для всіх даних компоненту — додаткова навігаційна затримка без UX benefit"
      - "Не обробляють resolver failure — navigation cancelled silently"
    relatedQuestions: ["b6t4q2", "b6t4q3"]
  - id: "b6t4q2"
    level: "mid"
    question: "Що таке withComponentInputBinding() і як він змінює доступ до route даних?"
    referenceAnswers:
      junior: "withComponentInputBinding() дозволяє автоматично передавати route params і resolver data в @Input компоненту."
      mid: "withComponentInputBinding() (Angular 16+): router params, queryParams і resolver data автоматично mapped до component @Input з відповідним ім'ям. `{ path: 'user/:id' }` + `@Input() id!: string` — id auto-bound. Resolver: `resolve: { user: userResolver }` + `@Input() user!: User` — user auto-bound. Спрощує: не потрібен inject(ActivatedRoute) в більшості cases."
      senior: "withComponentInputBinding mapping logic: route.params → @Input з matching name. route.queryParams → @Input з matching name. route.data → @Input з matching name. Priority: data > params > queryParams (якщо collision). Works з signal inputs (Angular 17+): `id = input<string>()` — auto-bound. Works з static data: `{ path: ..., data: { title: 'My Page' } }` → `@Input() title!: string`. Limitations: works тільки якщо component is directly activated (RouterOutlet). Не works якщо ActivatedRoute needed for nested child data access. Class-based Components: @Input() only. Standalone: @Input() or input() signal. NgOnChanges: called when route params change on same-component navigation. Limitation: `@Input({ transform: numberAttribute }) id!: number` — transform applied. Signal inputs: `id = input('', { transform: numberAttribute })` — typed conversion."
      staff: "withComponentInputBinding — architectural improvement що reduces coupling між Router і Component. Before: component injected ActivatedRoute → read params → load data. After: component declares @Input → router provides value. Component becomes more testable (no Router/ActivatedRoute dependency), reusable (can be used outside routing context). Implementation: RouterOutlet инterceptz input setting via ComponentRef.setInput(). For each active binding: ComponentRef.setInput(inputName, value) called. Angular CD: input change → triggers OnChanges → can react. Limitation: for complex reactive scenarios (switchMap on param change) — still use ActivatedRoute + Observable. Hybrid approach: simple params → @Input, complex reactive flows → ActivatedRoute. Design System implication: if component used both routed и non-routed — @Input is correct API, withComponentInputBinding is convenience binding. Component should work without router context (testability). SSR и withComponentInputBinding: works — server reads route params, sets inputs, renders."
    commonMistakes:
      - "Не додають withComponentInputBinding() до provideRouter — inputs не auto-bind"
      - "Expect queryParam та route param conflict resolution — треба знати priority"
    relatedQuestions: ["b6t4q1", "b6t4q3"]
  - id: "b6t4q3"
    level: "mid"
    question: "Що таке статичні route data і як використовувати data inheritance?"
    referenceAnswers:
      junior: "Route data: `{ path: ..., data: { title: 'My Page' } }` — статичні дані що доступні через ActivatedRoute.data."
      mid: "Static route data: `data: { title, breadcrumb, requiredRole, animation }` — config about route. Accessible via `route.data` або `@Input() breadcrumb: string` з withComponentInputBinding. Inheritance: child routes inherit parent data — якщо parent has `data: { theme: 'dark' }` і child не override — child.data.theme === 'dark'. paramsInheritanceStrategy: 'always' (inherit all) або 'emptyOnly' (default — inherit only if no params)."
      senior: "Static data use cases: 1) Page title: `data: { title: 'Users List' }` → TitleStrategy reads. 2) Breadcrumbs: `data: { breadcrumb: 'Users' }` → BreadcrumbService traverses activated route tree. 3) Required roles: `data: { roles: ['admin'] }` → generic RoleGuard reads from route.data. 4) Animation names: `data: { animation: 'FadeIn' }` → RouterOutlet animation trigger. 5) SEO metadata: `data: { meta: { description: '...' } }`. Data inheritance detail: `withRouterConfig({ paramsInheritanceStrategy: 'always' })` — child inherits all parent params and data, not just emptyOnly. Breadcrumb pattern: `this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => { let route = this.activatedRoute.root; while (route.firstChild) { route = route.firstChild; ... } })`. Title strategy: Angular provides DefaultTitleStrategy, BrowserTitle sets document.title. Custom: `extends TitleStrategy`, reads `route.data.title`."
      staff: "Route data — power pattern для cross-cutting concerns. Architecture: `data` is compile-time static config — не для runtime values (use resolver для dynamic). Enterprise use cases: 1) Permission matrix: `data: { permissions: ['read:users', 'write:users'] }` → PermissionGuard reads, also component reads для UI control. 2) Feature flags per route: `data: { features: ['new-ui'] }` → component enables features. 3) Analytics: `data: { analytics: { pageId: 'user-list', section: 'admin' } }` → global NavigationEnd handler sends analytics event. 4) Layout config: `data: { layout: 'sidebar' }` → AppShellComponent reads, renders correct layout. 5) SEO per route: `data: { seo: { title: 'Users', description: '...', canonical: '/users' } }` → SeoService reads on NavigationEnd, sets meta tags. Data inheritance з breadcrumbs: traverse `activatedRoute.pathFromRoot` → accumulate breadcrumb data. `withRouterConfig({ paramsInheritanceStrategy: 'always' })` для child components that need parent params (without reinject ActivatedRoute up the tree)."
    commonMistakes:
      - "Використовують data для runtime values — використовувати resolver"
      - "Не знають про paramsInheritanceStrategy — child params не inherited by default"
    relatedQuestions: ["b6t4q2", "b6t4q4"]
  - id: "b6t4q4"
    level: "senior"
    question: "Як реалізувати breadcrumb navigation через route data і ActivatedRoute tree traversal?"
    referenceAnswers:
      junior: "Breadcrumbs показують navigation path. Кожен route має data.breadcrumb і компонент збирає їх через ActivatedRoute."
      mid: "BreadcrumbService: subscribe to NavigationEnd, traverse activatedRoute.root.firstChild chain, accumulate data.breadcrumb for each route. Повертає array breadcrumb items. Component renders. ActivatedRoute tree: root → children matching current URL."
      senior: "Breadcrumb implementation: `type BreadcrumbItem = { label: string; url: string }`. Service: on NavigationEnd, traverse `this.router.routerState.snapshot.root` — ActivatedRouteSnapshot tree. For each route: if `route.data['breadcrumb']` — add to list. Build URL from `route.url.join('/')`. Accumulate for full path. Dynamic breadcrumbs: resolver data → `data.breadcrumb` can be dynamic: `resolve: { breadcrumb: entityNameResolver }`. Parametric: breadcrumb in data can be function: `data: { breadcrumb: (route: ActivatedRouteSnapshot) => route.params['name'] }`. Signal-based breadcrumbs: `breadcrumbs = toSignal(this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.buildBreadcrumbs())))` — reactive updates."
      staff: "Breadcrumb service — commonly built, frequently done incorrectly. Issues with naive implementation: 1) Static labels only — resolved entities not available. 2) Not reactive (snapshot only). 3) Breaks with lazy routes (route config not yet loaded). 4) Multi-outlet support missing. Production breadcrumbs: 1) Traverse `activatedRoute.pathFromRoot` (Observable chain, not snapshot). 2) CombineLatest on all route data observables — reactive to resolver updates. 3) Dynamic labels: function in data: `data: { breadcrumb: (snapshot) => snapshot.data['user']?.name ?? 'Loading...' }`. 4) URL building: accumulate urlSegments from pathFromRoot. 5) Last item: not clickable (current page). Accessibility: `<nav aria-label='breadcrumb'><ol><li aria-current='page'>...</li></ol></nav>`. Signal-based with toSignal: `breadcrumbs = toSignal(this.buildBreadcrumbs$(), { initialValue: [] })`. Event: NavigationEnd observable → switchMap to activatedRoute.pathFromRoot — rebuild breadcrumbs. Handle: i18n breadcrumbs (translate label) — pipe through TranslateService."
    commonMistakes:
      - "Using snapshot for breadcrumbs — not reactive to resolver data updates"
      - "Not handling last item differently — last breadcrumb should not be link"
    relatedQuestions: ["b6t4q3", "b6t4q5"]
  - id: "b6t4q5"
    level: "staff"
    question: "Як TypeScript TitleStrategy і withComponentInputBinding змінюють архітектуру routing layer в Angular 16+?"
    referenceAnswers:
      junior: "TitleStrategy дозволяє автоматично встановлювати browser tab title на основі route data."
      mid: "TitleStrategy (Angular 14+): Angular provides DefaultTitleStrategy що читає route.title або data.title. Custom: extends TitleStrategy, override updateTitle(). withComponentInputBinding: route data і params → @Input automatically. Менше boilerplate, testable components без Router dependency."
      senior: "TitleStrategy architecture: Router calls `titleStrategy.updateTitle(routerState)` on NavigationEnd. DefaultTitleStrategy: traverses activated route tree → finds first non-null `route.title`. Custom strategy: inject TranslateService → translate title. SEO: custom strategy sets meta tags + canonical. Route title можуть бути: static string, function `(route) => route.data['entity']?.name`. withComponentInputBinding architectural shift: component becomes data-independent (input = contract). Easier unit testing — provide @Input directly without Router setup. Reuse component in tests, Storybook without routing context."
      staff: "Angular 16+ routing architecture holistically: 1) withComponentInputBinding: components declare inputs, router provides. Components testable without router. 2) TitleStrategy: centralized document.title management. Composite strategy: i18n + entity names + app name. 3) Functional resolvers: inject() в ResolveFn — no class overhead. 4) Signal inputs + withComponentInputBinding: reactive route data. `id = input<string>()` → effect(() => { loadUser(this.id()) }) — reactive to navigation. 5) RouterTestingHarness: test full routing flow including TitleStrategy. Shift from imperative (ActivatedRoute.subscribe) to declarative (inputs). Enterprise impact: reduces boilerplate per route component (no inject(ActivatedRoute) in every component). Promotes component reuse — route component = regular component + route binding convenience. Downsides: debugging — input value origin less obvious (is it from route or parent). Need Angular devtools to inspect. For library components: design as pure components with @Input, then route binds convenience. Library components should NEVER depend on ActivatedRoute."
    commonMistakes:
      - "Not providing withComponentInputBinding — inputs stay empty, no error shown"
      - "Library components injecting ActivatedRoute — not usable outside routing context"
    relatedQuestions: ["b6t4q4", "b6t4q3"]
---

## Core Concept

**English definition:** Route data in Angular encompasses: `resolve` (functions that pre-load data before component activation), static `data` property (compile-time route configuration), `title` (page title for TitleStrategy), and `withComponentInputBinding()` (Angular 16+ feature that automatically maps route params, queryParams, and resolved data to component `@Input` or signal `input()` properties).

**Пояснення:** Route data = способи передачі інформації від routing layer до components. Resolver (`ResolveFn<T>`): async data loading перед активацією. Static `data`: compile-time config (breadcrumbs, roles, animations). `title`: page title для TitleStrategy. `withComponentInputBinding()`: автоматичний mapping route params і resolved data до `@Input`. Разом — clean separation між routing і component logic.

**Яку проблему вирішує:** Без resolvers: component renders without data (loading state complexity). Без static data: cross-cutting concerns scattered across components. Без withComponentInputBinding: кожен component inject(ActivatedRoute) boilerplate. Angular 16+ routing layer provides all data через standard @Input contract — component незалежний від routing infrastructure.

**Як працює під капотом:** Resolver: Angular merges all resolve functions via combineLatest → waits for all → creates merged `data` object → passes to activated component via ActivatedRoute.data. withComponentInputBinding: RouterOutlet calls `ComponentRef.setInput(inputName, value)` for each matching param/queryParam/data key. TitleStrategy: Angular calls `updateTitle(routerState)` on NavigationEnd.

**Trade-offs та обмеження:** Resolver: blocks navigation until data loaded — UI shows previous page while loading. Empty data: resolver returning EMPTY cancels navigation. withComponentInputBinding: priority (data > params > queryParams) — potential naming conflicts. Static data: compile-time only — use resolver for dynamic values.

**Версійність:** Route `resolve` стабільний з Angular 2. Functional ResolveFn — Angular 14. TitleStrategy — Angular 14. withComponentInputBinding — Angular 16 stable. Signal inputs (`input()`) with auto-binding — Angular 17.2. `route.title` function (dynamic) — Angular 16.

---

## Deep Details

### Edge Cases

**Resolver cancellation:** User navigates away while resolver running — Angular unsubscribes Observable. Component never activated. No cleanup needed в resolver — Observable cancellation handles it.

**Resolver returning EMPTY:** Navigation cancelled completely. NavigationError не fired — просто stays at current URL. Use `catchError(() => { router.navigate(['/error']); return EMPTY; })` for explicit error handling.

**withComponentInputBinding naming conflict:** `data: { id: 'static' }` і route param `:id` → data wins (higher priority). Avoid naming collisions. Use distinct names for data keys vs params.

**Static data + resolver data merge:** Both available via `route.data`. Static і resolver data merged: `{ ...staticData, ...resolverData }`. Resolver can override static (same key).

**TitleStrategy і async titles:** `title: (route) => route.data['entity']?.name` — Angular evaluates at navigation time. If async (resolver not yet complete) — evaluates with partial data. Run TitleStrategy after resolvers complete (Angular handles ordering).

**ngOnChanges з withComponentInputBinding:** Params change on same-component navigation → ngOnChanges fires з SimpleChanges. React to param changes without ActivatedRoute subscription.

### Junior vs Senior Understanding

**Junior** knows: resolver syntax, static data, @Input with withComponentInputBinding.

**Senior** understands:

1. **Resolver failure handling:** EMPTY cancels navigation. catchError for graceful degradation.

2. **Resolver vs component loading trade-off:** Resolver = navigation delay but clean component. Component loading = immediate render but loading state complexity.

3. **withComponentInputBinding mechanism:** RouterOutlet calls setInput() — standard component input, no special Angular magic.

4. **paramsInheritanceStrategy:** 'emptyOnly' default — only pathless route children inherit. 'always' — всі children inherit parent params.

5. **Breadcrumb reactive pattern:** combineLatest on pathFromRoot data Observables — reactive to resolver data updates.

### Deprecation & Migration Path

- **Class-based resolvers (Resolve interface):** Deprecated Angular 15.1. Migration: `ResolveFn<T>` functional. `ng generate @angular/core:route-resolver-migration`.
- **ActivatedRoute.snapshot.data for reactive scenarios:** Use Observable `route.data` для reactive reading or withComponentInputBinding.
- **Component constructor ActivatedRoute injection for simple params:** Replace with withComponentInputBinding + @Input.

### Connections to Other Concepts

- **Guards:** Resolvers run after guards — guaranteed access before data loading.
- **inject() function:** ResolveFn uses inject() — functional composition.
- **Change Detection:** withComponentInputBinding + signal inputs: reactive CD when params change.
- **Router Events:** TitleStrategy triggered by NavigationEnd event. Breadcrumb service similarly.

---

## Examples

### Basic Usage

```typescript
// Functional resolver
export const userResolver: ResolveFn<User> = (route) =>
  inject(UserService).getUser(route.paramMap.get('id')!);

// Resolver with error handling
export const productResolver: ResolveFn<Product> = (route) => {
  const productService = inject(ProductService);
  const router = inject(Router);

  return productService.getProduct(route.paramMap.get('id')!).pipe(
    catchError(err => {
      if (err.status === 404) {
        router.navigate(['/products']);
      } else {
        router.navigate(['/error']);
      }
      return EMPTY;
    })
  );
};

// Route configuration
const routes: Routes = [
  {
    path: 'users/:id',
    component: UserDetailComponent,
    resolve: { user: userResolver },
    data: {
      breadcrumb: 'User Details',
      requiredRole: 'user-manager',
      animation: 'FadeSlide'
    },
    title: 'User Details'
  }
];

// Bootstrap with withComponentInputBinding
bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withComponentInputBinding())]
});

// Component — clean, no ActivatedRoute injection
@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: `
    <h1>{{ user().name }}</h1>
    <p>{{ user().email }}</p>
  `
})
export class UserDetailComponent {
  // Auto-bound from resolver
  user = input.required<User>();

  // Auto-bound from route param
  id = input.required<string>();
}
```

### Production Scenario

```typescript
// Custom TitleStrategy with i18n and app name
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private translate = inject(TranslateService);
  private appName = inject(APP_NAME_TOKEN);

  override updateTitle(routerState: RouterStateSnapshot): void {
    const title = this.buildTitle(routerState);

    if (title) {
      const translated = this.translate.instant(title);
      document.title = `${translated} | ${this.appName}`;
    } else {
      document.title = this.appName;
    }
  }
}

// Reactive breadcrumb service
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  readonly breadcrumbs: Signal<BreadcrumbItem[]> = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.buildBreadcrumbs(this.activatedRoute.snapshot.root))
    ),
    { initialValue: [] }
  );

  private buildBreadcrumbs(
    route: ActivatedRouteSnapshot,
    url = '',
    breadcrumbs: BreadcrumbItem[] = []
  ): BreadcrumbItem[] {
    const children = route.children;

    for (const child of children) {
      const routeURL = child.url.map(seg => seg.path).join('/');
      const fullUrl = routeURL ? `${url}/${routeURL}` : url;
      const label = child.data['breadcrumb'];

      if (label) {
        breadcrumbs.push({
          label: typeof label === 'function' ? label(child) : label,
          url: fullUrl,
          isActive: child.children.length === 0
        });
      }

      this.buildBreadcrumbs(child, fullUrl, breadcrumbs);
    }

    return breadcrumbs;
  }
}

// Route config with rich data
const routes: Routes = [
  {
    path: 'app',
    component: AppShellComponent,
    data: { animation: 'none' },
    children: [
      {
        path: 'products',
        data: { breadcrumb: 'Products', permissions: ['read:products'] },
        children: [
          {
            path: '',
            component: ProductsListComponent,
            title: 'Products'
          },
          {
            path: ':id',
            resolve: { product: productResolver },
            data: {
              breadcrumb: (route: ActivatedRouteSnapshot) =>
                route.data['product']?.name ?? 'Product'
            },
            children: [
              { path: '', component: ProductDetailComponent, title: (route) => route.data['product']?.name }
            ]
          }
        ]
      }
    ]
  }
];
```

### Anti-Example

```typescript
// WRONG: Class-based resolver (deprecated)
@Injectable({ providedIn: 'root' })
export class UserResolver implements Resolve<User> {
  constructor(private userService: UserService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<User> {
    return this.userService.getUser(route.params['id']);
  }
}

// CORRECT: Functional resolver
export const userResolver: ResolveFn<User> = route =>
  inject(UserService).getUser(route.paramMap.get('id')!);

// WRONG: Not handling resolver failure
export const badResolver: ResolveFn<Product> = route =>
  // If getProduct throws 404 — navigation silently cancelled!
  inject(ProductService).getProduct(route.params['id']);

// CORRECT: Explicit error handling
export const goodResolver: ResolveFn<Product> = route => {
  return inject(ProductService).getProduct(route.params['id']).pipe(
    catchError(() => {
      inject(Router).navigate(['/products']);
      return EMPTY;
    })
  );
};

// WRONG: Using resolver for ALL data — every secondary data blocks navigation
const routes: Routes = [
  {
    path: 'user/:id',
    resolve: {
      user: primaryUserResolver,       // OK: needed for render
      userPosts: postsResolver,         // WRONG: secondary data, blocks navigation
      userFollowers: followersResolver,  // WRONG: can load lazily in component
    }
  }
];

// CORRECT: Resolver only for primary critical data
const routes: Routes = [
  {
    path: 'user/:id',
    resolve: { user: userResolver }  // Only critical data
    // userPosts and followers loaded in component with loading states
  }
];
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Class-based Resolve interface | Deprecated Angular 15.1, більше boilerplate | `ResolveFn<T>` functional resolver |
| Resolver без error handling | Silent navigation cancellation on failure | `catchError(() => { router.navigate(['/error']); return EMPTY; })` |
| Resolver for ALL data including secondary | Blocks navigation unnecessarily | Resolver only for critical-path data, rest lazy-load in component |
| Static `data` for dynamic values | Data evaluated at compile-time, not per-navigation | Use resolver for runtime dynamic values |
| `ActivatedRoute.snapshot.data` in reactive component | Stale after same-component navigation | Observable `route.data` або `withComponentInputBinding` |

---

## Interview Block

### [L1 — Warm-up] Що таке route resolver і навіщо він потрібен?
**Signal being tested:** Розуміння resolver purpose і trade-off між navigation delay і clean component state.
**What the interviewer expects:** ResolveFn syntax, data availability before component init, trade-off (delay), withComponentInputBinding for access.
**How to probe deeper:** "Як обробити випадок коли resolver returns EMPTY або throws?"
**Reference answer:** Resolver pre-loads data before component activation. Angular waits Observable/Promise completion. Result available via route.data or @Input with withComponentInputBinding. Trade-off: navigation delayed but component always has data. Failure: catchError → navigate to error page, return EMPTY — navigation cancelled.
**Common mistakes:** Not handling errors (silent cancellation); resolving ALL data (blocks navigation).

### [L2 — Mid] Що таке withComponentInputBinding() і як він змінює доступ до route даних?
**Signal being tested:** Знання сучасного Angular routing API і розуміння architectural benefit component decoupling.
**What the interviewer expects:** provideRouter(routes, withComponentInputBinding()), @Input() auto-bound, signal input() auto-bound, priority (data > params > queryParams), component testable without Router.
**How to probe deeper:** "Що відбувається якщо route param і data мають однакову назву?"
**Reference answer:** withComponentInputBinding() in provideRouter: RouterOutlet calls setInput(name, value) for each matching route param/queryParam/data key. Priority: data > params > queryParams. Works with @Input и signal input(). Component becomes Router-independent — testable without Router setup, reusable in Storybook. ngOnChanges fires when params change on same-component navigation.
**Common mistakes:** Forgetting to add withComponentInputBinding(); naming conflicts.

### [L3 — Senior] Що таке статичні route data і як використовувати data inheritance?
**Signal being tested:** Розуміння route data як cross-cutting concern mechanism і paramsInheritanceStrategy.
**What the interviewer expects:** Static data use cases (breadcrumbs, roles, animations, SEO), data inheritance, paramsInheritanceStrategy:'always', dynamic breadcrumb pattern.
**How to probe deeper:** "Як реалізувати breadcrumb де останній елемент показує entity name з resolver?"
**Reference answer:** Static data: compile-time config accessible via route.data. Use cases: breadcrumbs, permissions, animations, SEO meta. Data inheritance: children inherit parent data. paramsInheritanceStrategy:'always' (withRouterConfig) — children inherit parent params. Dynamic breadcrumbs: `data: { breadcrumb: (route) => route.data['entity']?.name }` — function evaluated per navigation. Traverse pathFromRoot, accumulate breadcrumb data.
**Common mistakes:** Static data for dynamic values (use resolver); not using function breadcrumbs for entity names.

### [L4 — Staff/Principal] Як TypeScript TitleStrategy і withComponentInputBinding змінюють архітектуру routing layer в Angular 16+?
**Signal being tested:** Системне мислення про routing architecture, component decoupling і cross-cutting concerns.
**What the interviewer expects:** TitleStrategy extensibility, withComponentInputBinding architectural impact (components without Router dependency), signal inputs reactive binding, testing improvements.
**How to probe deeper:** "Як б ви реалізували multi-tenant TitleStrategy де title includes tenant name?"
**Reference answer:** TitleStrategy: extends TitleStrategy, override updateTitle(). Custom: i18n titles via TranslateService. withComponentInputBinding: components become Router-independent — @Input contract. More testable (no inject(ActivatedRoute)). Reusable outside routing. Signal inputs + binding: reactive to param changes. Enterprise: centralize cross-cutting concerns (titles, breadcrumbs, analytics, SEO) in router event handlers + route data, not in components.
**Common mistakes:** Library components injecting ActivatedRoute (not reusable); per-component title management (scattered).

---

## Summary

### Key Points
- `ResolveFn<T>`: functional resolver, runs before component activation, blocks navigation until complete
- Error in resolver: catchError + navigate to error page + EMPTY — cancel navigation gracefully
- Static `data`: compile-time config (breadcrumbs, roles, animations) — not for dynamic runtime values
- `withComponentInputBinding()`: route params/data → @Input or signal input — component Router-independent
- Priority: data > params > queryParams when names conflict with withComponentInputBinding
- TitleStrategy (Angular 14+): centralized document.title management, custom i18n/entity names
- Dynamic breadcrumbs: `data.breadcrumb` as function `(route) => route.data['entity']?.name`

### Elevator Pitch (2 minutes)
Route data in Angular: resolver (pre-load data), static data (compile-time config), title (TitleStrategy). Functional resolver: `const resolver: ResolveFn<T> = route => inject(Service).load(route.params['id'])`. Error: catchError → navigate + EMPTY. withComponentInputBinding() (Angular 16+): route params и resolver data → @Input автоматично. signal input() supported. Priority: data > params > queryParams. Component becomes Router-independent — testable without routing setup. Static data use cases: breadcrumbs (function for dynamic entity names), permissions matrix, animation names, SEO meta. TitleStrategy: `extends TitleStrategy`, override updateTitle() — centralized, i18n-ready. paramsInheritanceStrategy:'always' — children inherit parent params for deeply nested components.
