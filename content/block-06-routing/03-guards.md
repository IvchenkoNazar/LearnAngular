---
title: "Route Guards: CanActivate, CanDeactivate, CanMatch"
block: 6
topic: 3
slug: "guards"
difficulty: 3
sinceVersion: "2"
tags: ["guards", "CanActivateFn", "CanDeactivateFn", "CanMatchFn", "functional-guards", "auth-guard"]
relatedTopics: ["router-fundamentals", "lazy-loading", "inject-function", "route-data", "di-internals"]
interviewQuestions:
  - level: "junior"
    question: "Що таке route guards і які основні типи guards існують в Angular?"
    referenceAnswers:
      junior: "Guards — це перевірки що дозволяють або забороняють навігацію. CanActivate перевіряє чи можна активувати route. CanDeactivate — чи можна покинути route. Guards повертають boolean або UrlTree для redirect."
      mid: "Route guards types: CanActivateFn — перевіряє перед активацією route. CanDeactivateFn — перевіряє при залишенні route (unsaved changes). CanMatchFn (замінив canLoad) — визначає чи route взагалі matchable (також controls lazy loading). Resolve — передзавантаження даних. Guards повертають: boolean (allow/deny), UrlTree (redirect), Observable/Promise з цими типами. Functional guards (Angular 15+): plain functions з inject() замість class."
      senior: "Guard execution order: CanMatch (before route matching) → CanActivate (before component activation) → CanActivateChild (for child routes) → Resolve (data loading) → CanDeactivate (before leaving). CanMatch runs before lazy loading — якщо false, route не matched, chunk не завантажується. CanActivate runs після matching — chunk завже завантажений. Guard return types: true/false/UrlTree/Observable/Promise/Signal (Angular 17+). Multiple guards: all must return true (AND logic). Guard composition: `canActivate: [authGuard, roleGuard('admin')]`. Functional syntax: `const authGuard: CanActivateFn = (route, state) => inject(Auth).isLoggedIn()`. inject() works — Angular sets injection context."
      staff: "Guards — navigation lifecycle hooks в RouterTransition pipeline. Technical: Guards run as Observables via `runGuards()` — each guard returns Observable, all merged via `combineLatest`. If ANY returns false/UrlTree — navigation cancelled. Short-circuit evaluation: якщо first guard false — second still runs (not lazy). Для true short-circuit: `(g1$ && g2$)` Observable chain або custom combinator. Guard timing: synchronous guards execute immediately. Async guards (HTTP check): navigation waits. UX: show loading indicator during async guard. Angular 17+: Signal-based guards — `(): Signal<boolean> => inject(AuthStore).isAuthenticated`. Router subscribes to signal changes automatically. TestBed testing: functional guards via RouterTestingHarness — `await harness.navigateByUrl('/protected')`. CanDeactivate: `component?: ComponentType` — guard receives component instance. Access unsaved state."
    commonMistakes:
      - "Клас-based guards (deprecated Angular 15.1) — використовують CanActivate interface"
      - "canLoad замість canMatch — canLoad deprecated, blocks preloading"
    relatedQuestions: ["b6t3q2", "b6t3q3"]
  - level: "mid"
    question: "Як реалізувати auth guard з redirect на login і збереженням returnUrl?"
    referenceAnswers:
      junior: "Перевіряємо isLoggedIn() в guard, якщо false — повертаємо UrlTree до /login."
      mid: "Auth guard: `inject(AuthService).isLoggedIn() ? true : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })`. state.url — поточний URL що user намагався відкрити. Login component читає returnUrl і редіректить після successful login."
      senior: "Complete auth guard pattern: `export const authGuard: CanActivateFn = (route, state) => { const auth = inject(AuthService); const router = inject(Router); if (auth.isLoggedIn()) return true; return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }); }`. Login component: `private returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl') ?? '/dashboard'`. After login: `router.navigateByUrl(this.returnUrl)`. Signal-based: якщо auth state is Signal: `return inject(AuthStore).isAuthenticated() ? true : router.createUrlTree(['/login'])`. Async auth (session check): `return inject(AuthService).checkSession().pipe(map(isAuth => isAuth ? true : router.createUrlTree(['/login'])))`. returnUrl security: validate returnUrl — prevent open redirect attacks: `const safe = returnUrl?.startsWith('/') ? returnUrl : '/dashboard'`."
      staff: "Auth guard production considerations: 1) returnUrl validation — open redirect vulnerability: `isRelativeUrl(returnUrl) ? returnUrl : '/dashboard'`. 2) Session refresh: guard triggers token refresh if expired — refresh → proceed or logout. 3) Race condition: multiple guards check auth simultaneously — use shared auth state (signal/BehaviorSubject), not individual HTTP calls per guard. 4) Guard caching: auth state cached за допомогою signal — no HTTP call per navigation. 5) Anonymous routes: `canMatch` check vs public routes — simpler: just check in canActivate, public routes have no guard. 6) Social auth: redirect to identity provider from guard — use window.location.href for external redirect (not Router.navigate). 7) Testing: mock AuthService with signal, RouterTestingHarness для test navigation outcomes. 8) Error handling: якщо auth check throws — guard should catch and redirect to error page, not propagate. 9) withRouterConfig({ canceledNavigationResolution: 'computed' }) — proper URL handling якщо guard cancels navigation."
    commonMistakes:
      - "returnUrl не validates — open redirect vulnerability"
      - "HTTP auth check per navigation замість cached signal state"
    relatedQuestions: ["b6t3q1", "b6t3q3"]
  - level: "mid"
    question: "Що таке CanDeactivate guard і як реалізувати unsaved changes warning?"
    referenceAnswers:
      junior: "CanDeactivate викликається коли user намагається покинути route. Можна показати confirm dialog якщо є незбережені зміни."
      mid: "CanDeactivateFn: `(component, currentRoute, currentState, nextState) => boolean | Observable<boolean>`. Component надає метод або signal чи є незбережені зміни. Guard перевіряє і показує confirmation dialog: `window.confirm('Unsaved changes, leave?')`. Краще — кастомний dialog замість window.confirm."
      senior: "Unsaved changes guard pattern: `interface CanDeactivateComponent { canDeactivate(): boolean | Observable<boolean>; }`. Generic guard: `export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => component?.canDeactivate() ?? true`. Component implements: `canDeactivate(): boolean | Observable<boolean> { if (!this.form.dirty) return true; return this.dialog.open(ConfirmLeaveDialog).afterClosed().pipe(map(result => result === 'confirm')); }`. Modern: `canDeactivate = () => inject(CanDeactivateService).hasUnsavedChanges() ? inject(DialogService).confirmLeave() : of(true)`. Signal-based: `isDirty = computed(() => this.form.dirty)` → guard reads: `!component.isDirty() || confirmLeave()`. CanDeactivate receives: component instance (may be null if component not instantiated)."
      staff: "CanDeactivate — important UX pattern but often implemented poorly. Production considerations: 1) Browser back button і programmatic navigation — both trigger CanDeactivate. But: browser close/refresh — does NOT trigger. Use `beforeunload` event для browser closure. Combine: `(window.addEventListener('beforeunload', ...)` і CanDeactivate. 2) Dialog service injection: матеріальний підхід — inject MatDialog в component, OR inject в guard via inject(). 3) Auto-save pattern: save every N seconds via debounce — then isDirty signal never true — no confirmation needed. Better UX than blocking. 4) Form state tracking: `formDirty = toSignal(this.form.statusChanges.pipe(startWith(this.form.status), map(() => this.form.dirty)))`. 5) Multiple editors: якщо multiple form sections — each has own dirty state. Combine: `isDirty = computed(() => this.form1().dirty || this.form2().dirty)`. 6) Testing: RouterTestingHarness — verify guard prevents navigation when dirty. 7) CanDeactivate і reactive forms: form.dirty reset після save — `this.form.markAsPristine()`. Signal forms (Angular future): reactive dirty tracking built-in."
    commonMistakes:
      - "window.confirm() для confirmation — блокує main thread, не customizable"
      - "Не обробляють browser back button окремо від router navigation"
    relatedQuestions: ["b6t3q2", "b6t3q4"]
  - level: "senior"
    question: "Як CanMatch відрізняється від CanActivate і коли використовувати кожен?"
    referenceAnswers:
      junior: "CanMatch визначає чи route взагалі може бути matched. CanActivate — чи може компонент бути активований після matching."
      mid: "CanMatch runs до route matching — якщо false, Angular шукає наступний matching route. CanActivate runs після matching, перед component activation. CanMatch виключає route з matching — інший route може match. CanActivate блокує navigation на matched route. CanMatch заміняє canLoad — без блокування preloading."
      senior: "CanMatch semantic: `() => boolean/Observable<boolean>` — false means 'не цей route, продовжуй matching'. Practical difference: `{ path: 'home', canMatch: [mobileGuard], component: MobileHomeComponent }, { path: 'home', component: DesktopHomeComponent }` — same path, different components per device. canActivate: one route, allow/deny access. CanMatch: multiple routes for same path, select appropriate variant. CanMatch i preloading: canMatch false → route not in preloading consideration. CanLoad prevented preloading (deprecated). CanMatch runs preloading anyway якщо guard function returns true. Path-less routes: `{ path: '', canMatch: [featureFlagGuard('new-dashboard')], component: NewDashboard }, { path: '', component: OldDashboard }` — A/B testing via routing."
      staff: "CanMatch — потужний routing primitive що розблоковує patterns недоступні раніше. Use cases: 1) A/B testing — same path, different components via canMatch feature flag. 2) Role-based routing — admin path loads admin component, user path loads user component (same URL). 3) Platform detection — mobile vs desktop at route level. 4) Feature flags — same route tree, different implementation. Multiple canMatch guards: ALL must return true (AND logic). If canMatch returns false — next matching route tried. Guards на всіх варіантах мають бути mutually exclusive (або have catch-all). Performance: canMatch runs before lazy loading chunk fetch. For lazy routes: `{ path: 'admin', canMatch: [adminGuard], loadChildren: () => import('./admin.routes') }` — admin chunk only loaded if adminGuard passes. Versus canActivate: chunk always loaded, guard checks access after. canMatch = conditional lazy loading without performance waste. Angular 15+: canMatch deprecates canLoad: `canLoad: [guard]` → `canMatch: [guard]`. canMatch compatible with preloading (canLoad blocked preloading)."
    commonMistakes:
      - "canLoad замість canMatch — deprecated і blocks preloading"
      - "canMatch та canActivate — не знають різниці в matching vs activation semantics"
    relatedQuestions: ["b6t3q3", "b6t3q5"]
  - level: "staff"
    question: "Як протестувати route guards в Angular і які patterns використовуються?"
    referenceAnswers:
      junior: "TestBed з провайдером mock сервісу і router.navigate() для перевірки навігації."
      mid: "RouterTestingHarness.create() (Angular 16+) або createSpyObj для services. testNavigate() повертає результат навігації. Перевіряємо що компонент активований або навігація redirected."
      senior: "RouterTestingHarness (Angular 16+): `TestBed.configureTestingModule({ imports: [RouterTestingModule.withRoutes(routes)] })`. `const harness = await RouterTestingHarness.create()`. `const component = await harness.navigateByUrl('/protected', ProtectedComponent)` — returns null якщо guard prevents. Verify redirect: `expect(TestBed.inject(Router).url).toBe('/login')`. Functional guard testing: `TestBed.runInInjectionContext(() => inject(MyGuard)(mockRoute, mockState))` — test guard function directly."
      staff: "Guard testing strategy залежить від complexity. Simple functional guard: `TestBed.runInInjectionContext(() => { const result = authGuard(mockRoute, mockState); ... })` — no Router needed. Mock AuthService: `{ provide: AuthService, useValue: { isLoggedIn: () => true } }`. Integration test з RouterTestingHarness: кращий для perror flow — redirect flows, CanDeactivate. Pattern: `const harness = await RouterTestingHarness.create('/initial-route')`. `await harness.navigateByUrl('/protected')`. `expect(harness.routerState.snapshot.url).toBe('/login')`. CanDeactivate testing: `const fixture = harness.fixture`. `const component = fixture.componentInstance`. `component.markDirty()`. `await harness.navigateByUrl('/other')`. `expect(harness.routerState.snapshot.url).not.toBe('/other')` — guard prevented. Guard error testing: mock service throw. Guard should catch and redirect. Test: `expect(Router.url).toBe('/error')`. Signal-based guards: test signal state change → verify guard behavior changes. Performance testing: guard timing — async guards with delay. Mock HTTP call з immediate response для unit tests. Integration tests: real HTTP (or MSW) for slower but more realistic."
    commonMistakes:
      - "Unit testing тільки guard function, не integration flow — guard може бути правильним але routing context неправильним"
      - "Not testing redirect flow — verify that redirected URL is correct"
    relatedQuestions: ["b6t3q4", "b6t3q3"]
---

## Core Concept

**English definition:** Route guards are functions (functional, since Angular 15) that intercept navigation at different lifecycle phases to control access: `CanActivateFn` (before component activation), `CanDeactivateFn` (before leaving a component), `CanMatchFn` (before route matching, replacing deprecated `canLoad`), returning `boolean`, `UrlTree` (redirect), `Observable`, `Promise`, or `Signal`.

**Пояснення:** Guards — lifecycle hooks navigation pipeline. Вирішують: дозволити навігацію (true), заблокувати (false), або redirect (UrlTree). Типи: CanActivate — перед активацією компоненту, CanDeactivate — перед залишенням, CanMatch — перед matching route (заміна deprecated canLoad). Functional guards (Angular 15+): plain functions з inject() — без class boilerplate.

**Яку проблему вирішує:** Protected routes потребують перевірки автентифікації/авторизації. Форми з незбереженими змінами потребують confirmation перед навігацією. CanMatch — route variants per role/device/feature flag без expose в URL. Guards provide clean separation: routing logic відокремлена від component logic.

**Як працює під капотом:** Navigation pipeline: URL parsed → routes matched → CanMatch guards → lazy chunk loaded → CanActivate guards → resolvers → component creation → NavigationEnd. Guards повертають Observables — Router через combineLatest merges всі guards. Якщо будь-який false → navigation cancelled або UrlTree redirect. CanDeactivate — при RouterOutlet destroying previous component.

**Trade-offs та обмеження:** Multiple guards: все AND logic — перший false не short-circuits. Async guards: navigation delayed. CanDeactivate — не fires on browser tab close/refresh (need beforeunload separately). Guard injection context: inject() works в functional guard — Angular sets context before call.

**Версійність:** Guards з Angular 2. Functional guard types — Angular 14.2 preview, stable Angular 15. Class-based CanActivate/CanDeactivate deprecated Angular 15.1. canLoad deprecated Angular 15.1 → canMatch. RouterTestingHarness — Angular 16. Signal-based guard returns — Angular 17.

---

## Deep Details

### Edge Cases

**Guard execution order:** CanMatch → CanActivate (parent) → CanActivateChild → Resolve. CanDeactivate on previous route runs before CanActivate on new route.

**Multiple CanActivate guards:** All run in parallel (combineLatest). First false не stops others. For performance AND short-circuit: chain via switchMap: `auth$.pipe(switchMap(ok => ok ? role$ : EMPTY))`.

**CanMatch і route fallthrough:** CanMatch false → router tries next route with same path. Useful for role-based routing. Guards must be mutually exclusive або have fallback catch-all route.

**CanDeactivate і browser close:** `beforeunload` event does not go through Angular Router. Must handle separately: `@HostListener('window:beforeunload', ['$event'])`.

**Guard і route data:** Guards can access `route.data` — static route config. `inject(ActivatedRouteSnapshot)` не available — use guard's `route` parameter.

**Redirect depth:** Angular Router prevents infinite redirect loops (max depth 10 by default).

### Junior vs Senior Understanding

**Junior** knows: class guard syntax, boolean return, redirect with Router.createUrlTree.

**Senior** understands:

1. **Functional guards:** inject() works — Angular sets injection context. Factory pattern для parameterized guards.

2. **CanMatch vs canActivate:** CanMatch — before matching (route not selected if false). CanActivate — after matching. CanMatch for route variants, conditional lazy loading.

3. **Signal-based auth:** AuthStore signal → guard returns signal value. Reactive, no Observable complexity.

4. **Guard composition:** `canActivate: [authGuard, roleGuard('admin')]` — both must pass. OR logic via manual combinator.

5. **Testing strategy:** Unit (functional guard + inject context), integration (RouterTestingHarness for redirect flows).

### Deprecation & Migration Path

- **CanActivate/CanDeactivate class interfaces:** Deprecated Angular 15.1. Migration: functional guards. `ng generate @angular/core:route-guard-migration`.
- **canLoad:** Deprecated Angular 15.1. Migration: `canMatch` — same semantics but preloading-friendly.
- **RouterTestingModule:** Deprecated Angular 16 for guard testing. Use RouterTestingHarness.
- **resolve: { data: ClassResolver }:** Class-based resolvers deprecated → ResolveFn functional.

### Connections to Other Concepts

- **inject() function:** Guards use inject() — functional pattern enabled by injection context setup.
- **Signals:** Auth state as Signal — guard reads signal directly. Reactive, no subscription.
- **Route Data:** Guards access `route.data` for static config (required roles, permissions).
- **Lazy Loading:** CanMatch controls whether lazy route is considered for matching — prevents chunk download.

---

## Examples

### Basic Usage

```typescript
// Functional auth guard with redirect
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Preserve returnUrl for post-login redirect
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};

// Parameterized role guard
export const roleGuard = (requiredRole: UserRole): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasRole(requiredRole)) {
      return true;
    }
    return router.createUrlTree(['/access-denied']);
  };

// CanDeactivate for unsaved changes
export interface UnsavedChangesComponent {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<UnsavedChangesComponent> =
  (component) => {
    if (!component?.hasUnsavedChanges()) {
      return true;
    }
    return inject(ConfirmationService)
      .confirm('Discard unsaved changes?')
      .pipe(map(confirmed => confirmed));
  };

// CanMatch for A/B testing
export const featureFlagGuard = (flag: string): CanMatchFn =>
  () => inject(FeatureFlagService).isEnabled(flag);

const routes: Routes = [
  {
    path: 'dashboard',
    canMatch: [featureFlagGuard('new-dashboard')],
    loadComponent: () => import('./dashboard-v2/dashboard-v2.component')
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
  }
];
```

### Production Scenario

```typescript
// Signal-based auth with token refresh
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _isAuthenticated = signal(false);
  private _currentUser = signal<User | null>(null);
  private _tokenExpiry = signal<Date | null>(null);

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();

  hasRole(role: UserRole): boolean {
    return this._currentUser()?.roles.includes(role) ?? false;
  }

  isTokenExpiring(): boolean {
    const expiry = this._tokenExpiry();
    if (!expiry) return false;
    return expiry.getTime() - Date.now() < 5 * 60 * 1000; // 5 min
  }
}

// Production auth guard with token refresh
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStore);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: validateReturnUrl(state.url) }
    });
  }

  // Token expiring soon — refresh before proceeding
  if (auth.isTokenExpiring()) {
    return tokenService.refresh().pipe(
      map(() => true),
      catchError(() => {
        tokenService.logout();
        return of(router.createUrlTree(['/auth/login']));
      })
    );
  }

  return true;
};

// Secure returnUrl validation
function validateReturnUrl(url: string): string {
  // Prevent open redirect — only allow relative URLs
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return '/dashboard';
    }
    return url;
  } catch {
    return '/dashboard';
  }
}

// CanDeactivate with Angular CDK dialog
@Component({
  selector: 'app-invoice-editor',
  standalone: true,
  template: `...`
})
export class InvoiceEditorComponent implements UnsavedChangesComponent {
  private invoiceForm = inject(FormBuilder).group({ ... });

  hasUnsavedChanges(): boolean {
    return this.invoiceForm.dirty;
  }

  save(): Observable<void> {
    return this.invoiceService.save(this.invoiceForm.value).pipe(
      tap(() => this.invoiceForm.markAsPristine())
    );
  }
}

// Route config
const routes: Routes = [
  {
    path: 'invoices/:id/edit',
    component: InvoiceEditorComponent,
    canActivate: [authGuard, roleGuard('accountant')],
    canDeactivate: [unsavedChangesGuard],
    resolve: { invoice: invoiceResolver }
  }
];
```

### Anti-Example

```typescript
// WRONG: Class-based guards (deprecated)
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}
  canActivate(): boolean { return this.auth.isLoggedIn(); }
}

// CORRECT: Functional
export const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn();

// WRONG: canLoad instead of canMatch (deprecated)
const routes: Routes = [
  { path: 'admin', canLoad: [AuthGuard], loadChildren: ... }  // Deprecated!
];

// CORRECT:
const routes: Routes = [
  { path: 'admin', canMatch: [authGuard], loadChildren: ... }
];

// WRONG: HTTP call in guard without caching — multiple requests per navigation
export const authGuard: CanActivateFn = () => {
  // WRONG: fresh HTTP call every navigation
  return inject(HttpClient).get<boolean>('/api/auth/check');
};

// CORRECT: Signal-based cached auth state
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  return authStore.isAuthenticated()  // Signal — cached, no HTTP per navigation
    ? true
    : inject(Router).createUrlTree(['/login']);
};

// WRONG: returnUrl without validation — open redirect
export const authGuard: CanActivateFn = (route, state) => {
  return inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }  // WRONG: state.url could be 'https://evil.com'
  });
};
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Class-based CanActivate/CanDeactivate | Deprecated Angular 15.1, more boilerplate | Functional `CanActivateFn`, `CanDeactivateFn` |
| `canLoad` instead of `canMatch` | Deprecated, prevents preloading of guarded routes | `canMatch` — same semantics, preloading-compatible |
| HTTP auth check per navigation without caching | Multiple HTTP requests — slow, potential rate limiting | Signal-based AuthStore — cached authentication state |
| `returnUrl` without validation | Open redirect security vulnerability | Validate: only relative URLs, origin check |
| `window.confirm()` in CanDeactivate | Blocks main thread, not accessible, not styleable | Custom dialog service with Observable result |

---

## Interview Block

### [L1 — Warm-up] Що таке route guards і які основні типи guards існують в Angular?
**Signal being tested:** Знання guard types і розуміння коли кожен використовувати — не просто enumeration.
**What the interviewer expects:** CanActivateFn (access control), CanDeactivateFn (leave confirmation), CanMatchFn (route selection), return types, functional syntax.
**How to probe deeper:** "Яка різниця між CanMatch і CanActivate в контексті lazy loading?"
**Reference answer:** Guards = navigation lifecycle hooks. CanActivateFn: before component activation, returns true/false/UrlTree. CanDeactivateFn: before leaving (unsaved changes). CanMatchFn: before route matching — determines if route is even considered. Functional syntax: plain functions з inject(). Multiple guards: AND logic. canLoad deprecated → use canMatch.
**Common mistakes:** Class-based guards; canLoad instead of canMatch.

### [L2 — Mid] Як реалізувати auth guard з redirect на login і збереженням returnUrl?
**Signal being tested:** Практична реалізація common security pattern і understanding returnUrl security implications.
**What the interviewer expects:** createUrlTree з queryParams, returnUrl preservation, login component reads returnUrl, returnUrl validation (open redirect prevention).
**How to probe deeper:** "Яку security vulnerabilities може мати returnUrl і як захиститись?"
**Reference answer:** `return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })`. Login component: reads returnUrl, navigates після login. Security: validate returnUrl — тільки relative URLs, same origin. `new URL(returnUrl, origin).origin !== origin → redirect to /dashboard`. Signal auth: `inject(AuthStore).isAuthenticated()` — cached, no HTTP per navigation.
**Common mistakes:** No returnUrl validation (open redirect); HTTP call per navigation instead of cached signal.

### [L3 — Senior] Що таке CanMatch і чим він відрізняється від CanActivate?
**Signal being tested:** Розуміння routing semantics — matching vs activation phases і architectural implications.
**What the interviewer expects:** CanMatch runs before matching (route not selected if false), CanActivate after matching. CanMatch for A/B testing, role routing, conditional lazy loading (no chunk download if false).
**How to probe deeper:** "Як реалізувати A/B testing через routing де 50% users бачать нову версію?"
**Reference answer:** CanMatch: false → router tries next matching route (same path). CanActivate: false → navigation blocked, chunk already loaded. CanMatch for: route variants (same path, different component per role/flag), conditional lazy loading. A/B testing: `{ path: 'home', canMatch: [newDesignGuard(50%)], component: HomeV2 }, { path: 'home', component: HomeV1 }`. canMatch + loadChildren: admin chunk not downloaded if guard false.
**Common mistakes:** Using canActivate for routing variants — chunk always downloaded; canLoad (deprecated) instead of canMatch.

### [L4 — Staff/Principal] Як протестувати route guards в Angular і які patterns використовуються?
**Signal being tested:** Testing strategy для routing layer — unit vs integration trade-offs.
**What the interviewer expects:** RouterTestingHarness для integration, runInInjectionContext для unit, мocking auth state with signals, testing redirect flows.
**How to probe deeper:** "Як тестувати CanDeactivate guard що показує custom dialog?"
**Reference answer:** Unit: `TestBed.runInInjectionContext(() => authGuard(route, state))` — mock AuthService. Integration: RouterTestingHarness — `harness.navigateByUrl('/protected')`, verify `router.url === '/login'`. CanDeactivate: mark component dirty, attempt navigate, verify blocked. Dialog mocking: `{ provide: ConfirmationService, useValue: { confirm: () => of(true) } }`. Signal auth: set signal value in test → guard reacts.
**Common mistakes:** Only unit testing guard function — not testing redirect URL correctness; not mocking dialogs in CanDeactivate tests.

---

## Summary

### Key Points
- Functional guards (Angular 15+): plain functions з inject() — no class boilerplate needed
- CanActivateFn: before component activation, returns true/false/UrlTree/Observable/Signal
- CanDeactivateFn: before leaving component (unsaved changes), receives component instance
- CanMatchFn: before route matching — if false, next matching route tried. Replaces deprecated canLoad
- canLoad deprecated (Angular 15.1) → use canMatch: same semantics, preloading-compatible
- returnUrl security: validate that URL is relative/same-origin to prevent open redirect attacks
- Testing: RouterTestingHarness для integration flows, TestBed.runInInjectionContext для unit guards

### Elevator Pitch (2 minutes)
Route guards = navigation lifecycle hooks. CanActivateFn: access control before component load. CanDeactivateFn: leave confirmation (unsaved changes). CanMatchFn: route selection before matching — if false, next route with same path tried. Functional syntax (Angular 15+): `const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn()`. inject() works — Angular sets context. Return: true/false/UrlTree(redirect)/Observable/Signal. Auth guard: `inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })` — validate returnUrl for open redirect. canLoad deprecated → canMatch (preloading-compatible). CanDeactivate: `component.hasUnsavedChanges()` + dialog service. Testing: RouterTestingHarness integration + runInInjectionContext unit.
