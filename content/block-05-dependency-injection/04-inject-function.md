---
title: "inject() Function and Functional Providers"
block: 5
topic: 4
slug: "inject-function"
difficulty: 3
sinceVersion: "14"
tags: ["inject", "functional-providers", "DestroyRef", "takeUntilDestroyed", "injection-context", "functional-guards"]
relatedTopics: ["di-internals", "provider-types", "injection-tokens", "resolution-modifiers", "routing-guards"]
interviewQuestions:
  - id: "b5t4q1"
    level: "junior"
    question: "Що таке inject() функція і яка перевага над constructor injection?"
    referenceAnswers:
      junior: "inject() — це функція що дозволяє отримати сервіс без constructor. Можна писати `private service = inject(MyService)` як поле класу замість конструктора."
      mid: "inject() (stable Angular 14) — альтернатива constructor injection. Переваги: 1) Cleaner code — без boilerplate constructor. 2) Works in functional contexts (guards, resolvers, effects). 3) Class field injection — TypeScript inference without explicit type. 4) Composable — можна extract repeated injection patterns у helper functions. Мінус: inject context required — тільки в constructor або field initializer, не в methods."
      senior: "inject() reads currentInjector from Angular's internal context stack. Виконується в injection context: class field init, constructor, useFactory provider. Returns T (non-null). `inject(Token, { optional: true })` → T | null. inject() в field: `service = inject(Service)` — TypeScript infers type від Service class. Functional patterns: guards як plain functions `export const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn()` — inject() works бо Angular sets injection context before calling guard. Effect і toSignal теж потребують injection context — inject DestroyRef internally. Перевага над constructor: composition — `function withLogging() { const logger = inject(Logger); return { log: (msg) => logger.log(msg) }; }` — reusable injection factory."
      staff: "inject() function — семантично еквівалентний constructor injection але з composability преімуществом. Angular 14 stable release відкрив inject() для public use — раніше internal. Architectural implications: 1) Functional providers: useFactory без class boilerplate. 2) Mixin patterns: functions that inject and return behaviors. 3) Composability: `function injectLogger() { return inject(Logger) }` — thin wrapper для reuse. Performance: inject() і constructor injection — ідентичний runtime overhead. Compilation: inject() в field = converted to constructor call by Ivy compiler. Advanced: inject() with generics: `inject<MyService>(TOKEN_FOR_INTERFACE as InjectionToken<MyService>)` — explicit casting для interface tokens. DestroyRef pattern: `const destroyRef = inject(DestroyRef)` — получаємо lifecycle hook без implementing interface. `destroyRef.onDestroy(() => cleanup())` — replaces ngOnDestroy для services і functional patterns."
    commonMistakes:
      - "inject() у ngOnInit або інших lifecycle методах — NG0203 помилка"
      - "Не знають що inject() у field initializer = compilation to constructor injection"
    relatedQuestions: ["b5t4q2", "b5t4q3"]
  - id: "b5t4q2"
    level: "mid"
    question: "Що таке DestroyRef і як takeUntilDestroyed() спрощує управління subscription?"
    referenceAnswers:
      junior: "DestroyRef дозволяє реагувати на destroy компоненту без implements OnDestroy. takeUntilDestroyed() автоматично unsubscribe Observable при destroy."
      mid: "DestroyRef — injectable service що represents lifecycle destroy event. inject(DestroyRef) в component/service → .onDestroy(callback) registers cleanup. takeUntilDestroyed() RxJS operator (Angular 16+): `myObs$.pipe(takeUntilDestroyed())` — автоматично completes при destroy. Всередині inject() DestroyRef. Потребує injection context — викликати в constructor або field initializer. Якщо поза context: `takeUntilDestroyed(destroyRef)` з явним DestroyRef."
      senior: "DestroyRef — injectable token що Angular provides для будь-якого injectable (components, services, directives). Component DestroyRef — calls onDestroy callbacks при ngOnDestroy. Service DestroyRef — при service destruction (injector destroyed). takeUntilDestroyed() implementation: inject(DestroyRef) → subscribe to destroy event → complete subject → pipe через takeUntil. Результат: no NgOnDestroy boilerplate, no Subject management, no forget-to-unsubscribe bugs. Composition pattern: `function injectHttpWithCleanup<T>(url: string) { const http = inject(HttpClient); return http.get<T>(url).pipe(takeUntilDestroyed()); }` — reusable HTTP fetch з auto-cleanup. Service з DestroyRef: `@Injectable() class TimerService { constructor() { const dr = inject(DestroyRef); const timer = setInterval(() => ..., 1000); dr.onDestroy(() => clearInterval(timer)); } }` — no OnDestroy interface needed."
      staff: "DestroyRef і takeUntilDestroyed() — shift від imperative lifecycle management до declarative. Angular 16+ pattern: будь-який resource cleanup через DestroyRef, не OnDestroy interface. Переваги: 1) Works outside component context (services, functional patterns). 2) Composable: inject DestroyRef at any level. 3) Multiple callbacks: dr.onDestroy called in LIFO order. 4) Testable: DestroyRef can be mocked. Relationship з Signals: `toSignal(obs$)` — internally uses inject(DestroyRef) for subscription cleanup. `toSignal(obs$, { requireSync: false })` — safe async signal. When toSignal fails: якщо injection context not available — must pass `{ injector: ... }`. Advanced: `effect()` і `afterRenderEffect()` — also use DestroyRef internally for lifecycle. Zoneless context: DestroyRef ще більш важливий бо немає Zone.js cleanup hooks. Resource cleanup pattern в Angular 19: `resource()` function — built-in HTTP/async resource з auto-cleanup via DestroyRef."
    commonMistakes:
      - "takeUntilDestroyed() поза injection context — inject(DestroyRef) fails"
      - "Не знають що multiple onDestroy callbacks можна зареєструвати в LIFO order"
    relatedQuestions: ["b5t4q1", "b5t4q3"]
  - id: "b5t4q3"
    level: "mid"
    question: "Як inject() функція використовується в functional guards і resolvers Angular 15+?"
    referenceAnswers:
      junior: "В Angular 15 з'явились functional guards. inject() дозволяє inject сервіси в guard функцію без class."
      mid: "Functional guards (Angular 15): `const authGuard: CanActivateFn = (route, state) => inject(AuthService).canAccess()`. inject() works бо Angular sets injection context before calling guard. Переваги: менше boilerplate, легше compose, better tree-shaking. Те саме для resolvers: `export const userResolver: ResolveFn<User> = route => inject(UserService).getUser(route.params['id'])`."
      senior: "Functional guards API: CanActivateFn, CanDeactivateFn, CanMatchFn, ResolveFn — все function types що приймають route params і можуть inject(). Angular встановлює injection context перед викликом — inject() works. Composition: guards combinator — `combineLatestGuards([authGuard, roleGuard])` — custom combinator. inject() result може бути: boolean, UrlTree, Observable<boolean|UrlTree>, Promise<boolean|UrlTree>. Redirect: `inject(Router).createUrlTree(['/login'])` або просто `'/login'` string. Реальний pattern: `export const roleGuard = (role: Role): CanActivateFn => () => inject(AuthService).hasRole(role)` — factory function для parameterized guards."
      staff: "Functional guards — architectural improvement над class-based guards (deprecated). CanActivate class interface deprecated Angular 15.1. Functional advantages: 1) No class overhead — no @Injectable, no class body. 2) Better tree-shaking — function vs class. 3) Composability — combine guards easily. 4) Testing — функцію легше тестувати ніж class з DI setup. Migration: `ng generate @angular/core:route-guard-migration` — automated. Functional resolver з caching: `export const cachedUserResolver: ResolveFn<User> = route => { const cache = inject(CacheService); const id = route.params['id']; return cache.get(id) ?? inject(UserService).getUser(id); }`. Guard з signals: `const authGuard: CanActivateFn = () => inject(AuthStore).isAuthenticated()` — returns Signal<boolean>. Angular Router підтримує Signal-based guards в Angular 17+. withComponentInputBinding() — resolver result auto-mapped до component input: `@Input() user!: User` отримує resolver value. Архітектурно: functional guards + withComponentInputBinding + signal inputs = clean, type-safe routing layer."
    commonMistakes:
      - "Клас-based guards замість functional — старий deprecated pattern"
      - "Не використовують factory function для parameterized guards — duplicate logic"
    relatedQuestions: ["b5t4q2", "b5t4q4"]
  - id: "b5t4q4"
    level: "senior"
    question: "Що таке runInInjectionContext() і коли це потрібно?"
    referenceAnswers:
      junior: "runInInjectionContext() дозволяє запустити функцію де inject() доступний поза нормальним контекстом."
      mid: "runInInjectionContext(injector, fn) — встановлює injection context для виконання fn. Потрібен коли inject() потрібен поза constructor/field — у async callbacks, event handlers, setTimeout. Injector отримується через inject(Injector) в constructor."
      senior: "runInInjectionContext(injector, fn): 1) Зберігає поточний context. 2) Встановлює injector як activeInjector. 3) Виконує fn — inject() works всередині. 4) Відновлює попередній context. Use cases: deferred injection у async code, dynamic component loading з custom injector, testing injection scenarios. Pattern: `class MyService { private injector = inject(Injector); doAsync() { setTimeout(() => runInInjectionContext(this.injector, () => { const dep = inject(SomeDep); dep.work(); }), 1000); }; }`. TestBed.runInInjectionContext() — для testing helpers що потребують injection context."
      staff: "runInInjectionContext() — escape hatch для advanced scenarios. Важливо: Angular не рекомендує overuse — якщо inject() потрібен у багатьох async callbacks, розглянути refactoring до signal/service pattern. Valid use cases: 1) Angular CDK і library internals де dynamic injection потрібен. 2) Testing utilities що потребують injection. 3) Integration з third-party code (Web Workers messaging, custom event systems). 4) Dynamic component factory patterns. Security consideration: runInInjectionContext з foreign injector — потенційно inject services з wrong scope. Ensure injector is from trusted source. Comparison з альтернативами: `createEnvironmentInjector(providers, parent)` — create new injector for isolated DI context. Injector.runInContext() — alias до runInInjectionContext. TestBed pattern: `TestBed.runInInjectionContext(() => inject(MyService))` — корисно для testing injectable functions/factories. Production pattern: у lazy initialization — inject Injector у constructor, run деferred code in runInInjectionContext."
    commonMistakes:
      - "Overuse runInInjectionContext замість rethink architecture"
      - "Injector.get() замість inject() — старий deprecated style"
    relatedQuestions: ["b5t4q3", "b5t4q5"]
  - id: "b5t4q5"
    level: "staff"
    question: "Як використовувати inject() для створення composable behaviors (mixins) в Angular?"
    referenceAnswers:
      junior: "inject() можна використовувати в функціях що викликаються з constructor."
      mid: "Composition functions — helper функції що inject потрібні сервіси і повертають behavior. Наприклад `function withLoading() { const spinner = inject(SpinnerService); return { showLoading: () => spinner.show(), hideLoading: () => spinner.hide() }; }`. Викликається з constructor або field init."
      senior: "Composable injection pattern: `function withPagination(pageSize = 10) { const route = inject(ActivatedRoute); const router = inject(Router); const page = toSignal(route.queryParams.pipe(map(p => +(p['page'] || 1)))); const goToPage = (n: number) => router.navigate([], { queryParams: { page: n } }); return { page, pageSize, goToPage }; }`. Component uses: `class ProductsComponent { pagination = withPagination(20); }`. Reusable logic composition без inheritance. Функції що inject() — must be called in injection context."
      staff: "Composable injection functions — React hooks analog для Angular. Fundamental difference: Angular composables — called once in constructor/field init (not per render). Design principles: 1) Pure injection: function інjects і повертає behavior object. 2) Side-effect-free: не triggers CD або subscriptions (caller's responsibility). 3) Explicit return type для DX. 4) Works with signal primitives: повертати signal/computed/effect. Production composable: `function withFormErrors(control: AbstractControl): Signal<ValidationErrors | null> { const cdr = inject(ChangeDetectorRef); return toSignal(control.statusChanges.pipe(map(() => control.errors), startWith(control.errors))); }`. Framework analogy: Angular CDK uses injection в functions extensively — FocusTrap, DragDrop, etc. Testing: функції складно тестувати ізольовано — потребують injection context (TestBed.runInInjectionContext). Alternative: class-based mixins з inject() — testable через TestBed. Design System: withTooltip(), withValidation(), withFocus() — reusable composition blocks. Limitation: Angular composables — не reactive по дефолту. React re-runs hooks per render. Angular runs once. Signal composition covers reactivity gap: composable returns signals/computed → component template реактивно reads."
    commonMistakes:
      - "Думають Angular composables реактивні як React hooks — вони виконуються once, потрібні signals для reactivity"
      - "Не документують injection requirements — consumers не знають які services потрібні"
    relatedQuestions: ["b5t4q4", "b5t4q3"]
---

## Core Concept

**English definition:** `inject()` is a standalone function (stable Angular 14) that retrieves a dependency from the current injection context, enabling constructor-free DI in class fields, functional guards/resolvers, factory providers, and composable injection functions, while `DestroyRef` and `takeUntilDestroyed()` provide lifecycle-aware cleanup without implementing `OnDestroy`.

**Пояснення:** inject() — функція що замінює constructor injection в situations де клас або конструктор недоступний або небажаний. Доступна в injection context: class field initializer, constructor, useFactory. Functional guards і resolvers (Angular 15+) — Angular sets injection context перед викликом. DestroyRef — injectable lifecycle token для cleanup callbacks без OnDestroy interface. takeUntilDestroyed() — RxJS operator що використовує inject(DestroyRef) для auto-unsubscribe.

**Яку проблему вирішує:** Constructor injection вимагає boilerplate class і constructor parameters. Functional guards/resolvers потребують inject() без class context. Lifecycle cleanup (unsubscribe, clearInterval) потребує OnDestroy interface або Subject management. inject() + DestroyRef вирішують все cleanly і compositionally.

**Як працює під капотом:** inject() reads `currentInjector` від Angular internal context. При compilation: inject() у class field → Ivy compiler переносить до constructor body. В useFactory: injection context встановлюється перед виконанням factory. В functional guards: Angular Router встановлює context перед guard call. DestroyRef — singleton per injector scope, callbacks called at injector destroy time in LIFO order.

**Trade-offs та обмеження:** inject() — тільки synchronous, в injection context. Поза context → NG0203 error. inject() у method → error (навіть якщо called from constructor-initialized field). Composable functions — виконуються once (не per-render як React hooks). takeUntilDestroyed() — requires injection context або explicit DestroyRef.

**Версійність:** inject() internal Angular → public Angular 9 experimental → stable Angular 14. DestroyRef — Angular 16. takeUntilDestroyed() RxJS operator — Angular 16. Functional guards (CanActivateFn) — Angular 14.2 developer preview, stable Angular 15. Class-based guards deprecated Angular 15.1. runInInjectionContext() — Angular 16.

---

## Deep Details

### Edge Cases

**inject() у field initializer vs constructor:** Функціонально еквівалентні. Ivy compiler перетворює field injection в constructor. Але: TypeScript field assignment order — поля ініціалізуються в order. Якщо field-A depends on field-B — order matters.

**inject() у abstract class:** Works — injection context active при constructor call. Abstract class може використовувати inject() — child classes inherit injected values.

**DestroyRef timing:** onDestroy callbacks виконуються після ngOnDestroy (якщо обидва є). LIFO order — останній registered = перший called.

**takeUntilDestroyed() в service:** inject(DestroyRef) в service — DestroyRef для service injector scope. Service з providedIn:'root' — destroyed при app teardown. Route-scoped service — при route deactivation.

**inject() overriding в tests:** TestBed provides override через providers — inject() в field resolves from test injector. No special handling needed.

**runInInjectionContext і async:** Асинхронний код всередині runInInjectionContext — inject() poза synchronous part → error. `runInInjectionContext(injector, () => { setTimeout(() => inject(X), 0) })` — inject() inside setTimeout не в context.

### Junior vs Senior Understanding

**Junior** знає inject() syntax, розуміє що поза constructor, знає про functional guards.

**Senior** розуміє:

1. **Context stack mechanism:** Angular pushes/pops injector to context stack. inject() reads from stack top. Why it fails in async callbacks (stack popped already).

2. **Compilation equivalence:** inject() in field = constructor parameter. Same code after compilation. Style preference only.

3. **DestroyRef scope:** Component DestroyRef vs service DestroyRef — different scopes. Route-scoped service DestroyRef — triggered at route leave.

4. **Composable pattern limitations:** Once-execution vs React hooks per-render. Signals bridge reactivity gap.

5. **runInInjectionContext use cases:** Valid (deferred injection, testing) vs smell (architectural issue).

### Deprecation & Migration Path

- **CanActivate/CanDeactivate/CanLoad class interfaces:** Deprecated Angular 15.1. Migration: functional `CanActivateFn` etc. Automated: `ng generate @angular/core:route-guard-migration`.
- **Injector.get() / ReflectiveInjector:** Old imperative injection. Migration: inject() function.
- **Subject + takeUntil pattern for cleanup:** Functional but verbose. Modern: takeUntilDestroyed() в injection context.
- **implements OnDestroy:** Still valid але DestroyRef + onDestroy() callback cleaner для non-template classes.

### Connections to Other Concepts

- **Signals:** toSignal() і effect() — both require injection context, use inject(DestroyRef) internally.
- **Router:** Functional guards use inject() — Angular 15+ standard.
- **RxJS:** takeUntilDestroyed() — bridge між RxJS lifecycle і Angular DI lifecycle.
- **Testing:** TestBed.runInInjectionContext() — test functional patterns that use inject().

---

## Examples

### Basic Usage

```typescript
// inject() in class field — clean, no constructor boilerplate
@Injectable({ providedIn: 'root' })
export class UserDashboardService {
  // No constructor needed for DI
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // takeUntilDestroyed — auto-cleanup Observable subscription
  readonly activeUsers = toSignal(
    this.userService.getActiveUsers().pipe(
      takeUntilDestroyed()  // inject(DestroyRef) automatically in injection context
    ),
    { initialValue: [] }
  );

  constructor() {
    // DestroyRef callback for cleanup
    this.destroyRef.onDestroy(() => {
      console.log('UserDashboardService destroyed');
    });
  }
}

// Functional guard with inject()
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

// Parameterized guard factory
export const roleGuard = (requiredRole: UserRole): CanActivateFn =>
  () => inject(AuthService).hasRole(requiredRole);

// Usage in routes:
const routes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./admin/admin.component')
  }
];

// Functional resolver
export const userResolver: ResolveFn<User> = route =>
  inject(UserService).getById(route.params['id']);
```

### Production Scenario

```typescript
// Composable injection functions — Angular "hooks" pattern
function withPagination(defaultPageSize = 20) {
  const route = inject(ActivatedRoute);
  const router = inject(Router);

  const page = toSignal(
    route.queryParams.pipe(map(params => +(params['page'] || 1))),
    { initialValue: 1 }
  );

  const pageSize = toSignal(
    route.queryParams.pipe(map(params => +(params['size'] || defaultPageSize))),
    { initialValue: defaultPageSize }
  );

  return {
    page,
    pageSize,
    goToPage: (n: number) =>
      router.navigate([], { queryParams: { page: n }, queryParamsHandling: 'merge' }),
    setPageSize: (size: number) =>
      router.navigate([], { queryParams: { size, page: 1 }, queryParamsHandling: 'merge' })
  };
}

function withAutoSave<T>(getValue: () => T, saveFn: (val: T) => Observable<void>, debounceMs = 1000) {
  const destroyRef = inject(DestroyRef);
  const saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Using toObservable to watch signal changes
  const sub = toObservable(computed(getValue))
    .pipe(
      skip(1),  // Skip initial value
      debounceTime(debounceMs),
      switchMap(val => {
        saveStatus.set('saving');
        return saveFn(val).pipe(
          tap(() => saveStatus.set('saved')),
          catchError(() => {
            saveStatus.set('error');
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(destroyRef)
    )
    .subscribe();

  return { saveStatus: saveStatus.asReadonly() };
}

// Component using composable functions
@Component({
  selector: 'app-products',
  standalone: true,
  template: `
    @for (product of products(); track product.id) {
      <app-product-card [product]="product" />
    }
    <app-pagination
      [currentPage]="pagination.page()"
      [pageSize]="pagination.pageSize()"
      (pageChange)="pagination.goToPage($event)"
    />
  `
})
export class ProductsComponent {
  private productService = inject(ProductService);
  pagination = withPagination(10);

  products = toSignal(
    toObservable(this.pagination.page).pipe(
      switchMap(page => this.productService.getProducts(page, this.pagination.pageSize()))
    ),
    { initialValue: [] }
  );
}
```

### Anti-Example

```typescript
// WRONG: inject() in lifecycle methods
@Component({ template: `...` })
export class BadInjectComponent implements OnInit {
  ngOnInit(): void {
    // WRONG: NG0203 - not injection context
    const service = inject(MyService);
  }

  loadData(): void {
    // WRONG: NG0203 - not injection context
    const http = inject(HttpClient);
    http.get('/api/data').subscribe();
  }
}

// WRONG: class-based guards (deprecated)
@Injectable({ providedIn: 'root' })
export class OldAuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  canActivate(): boolean {
    return this.auth.isLoggedIn();
  }
}

// WRONG: Manual subscription management without takeUntilDestroyed
@Component({ template: `...` })
export class BadSubscriptionComponent implements OnInit, OnDestroy {
  private sub!: Subscription;  // Manual management

  ngOnInit() {
    this.sub = this.service.data$.subscribe(data => this.data = data);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();  // Easy to forget!
  }
}

// CORRECT:
@Component({ template: `...` })
export class GoodComponent {
  // inject() in field — injection context active
  private service = inject(MyService);
  private http = inject(HttpClient);

  // takeUntilDestroyed in field initializer — injection context
  data = toSignal(
    this.service.data$.pipe(takeUntilDestroyed()),
    { initialValue: null }
  );
}

// CORRECT: functional guard
export const newAuthGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/login']);
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| inject() у lifecycle методах або event handlers | NG0203 — injection context not active | inject() у class field або constructor |
| Class-based CanActivate/CanDeactivate guards | Deprecated Angular 15.1, більше boilerplate | Functional `CanActivateFn`, `CanDeactivateFn` |
| Manual Subscription management (sub.unsubscribe()) | Easy to forget → memory leak | `takeUntilDestroyed()` у injection context |
| Overuse runInInjectionContext() | Code smell — архітектурна проблема потребує вирішення | Refactor: inject у constructor/field, передати сервіс |
| Composable function що очікує re-execution | Angular composables виконуються once, не per-render | Повертати signals/computed для reactivity |

---

## Interview Block

### [L1 — Warm-up] Що таке inject() функція і яка перевага над constructor injection?
**Signal being tested:** Знання inject() API і розуміння injection context requirement — не просто "новий синтаксис".
**What the interviewer expects:** Field injection syntax, injection context requirement, functional patterns (guards/resolvers), composability advantages.
**How to probe deeper:** "Де inject() НЕ можна використовувати і чому?"
**Reference answer:** inject() reads current injector from Angular context stack. Works у: class field initializer, constructor, useFactory, functional guards/resolvers. Fails: lifecycle methods, event handlers, async callbacks (context not active). Переваги: no constructor boilerplate, composable functions, functional guards без class.
**Common mistakes:** inject() в ngOnInit (NG0203); думають field inject і constructor inject різно compiled.

### [L2 — Mid] Що таке DestroyRef і як takeUntilDestroyed() спрощує управління subscription?
**Signal being tested:** Знання сучасних Angular lifecycle patterns і розуміння чому ручне управління підписками — anti-pattern.
**What the interviewer expects:** inject(DestroyRef), onDestroy callbacks, takeUntilDestroyed() в injection context, LIFO order callbacks, scope (component vs service).
**How to probe deeper:** "Як takeUntilDestroyed() поводить себе в route-scoped service?"
**Reference answer:** DestroyRef injectable token для lifecycle cleanup без OnDestroy interface. onDestroy(callback) — called at destroy time LIFO order. takeUntilDestroyed() operator: internally inject(DestroyRef), complete subject on destroy. Must call in injection context або pass explicit destroyRef. Service DestroyRef scope = service injector lifetime (route = deactivation).
**Common mistakes:** takeUntilDestroyed поза injection context; не знають LIFO callbacks order.

### [L3 — Senior] Як inject() функція використовується в functional guards і resolvers Angular 15+?
**Signal being tested:** Розуміння Router integration з DI і architectural shift до functional routing layer.
**What the interviewer expects:** CanActivateFn syntax, inject() в guard context, parameterized guard factory, Signal-based guards, withComponentInputBinding.
**How to probe deeper:** "Як реалізувати guard з cache для expensive auth checks?"
**Reference answer:** Functional guards: `const guard: CanActivateFn = () => inject(Service).check()`. Angular sets injection context before call. Guard factory: `const roleGuard = (role: Role): CanActivateFn => () => inject(Auth).hasRole(role)`. Returns boolean/UrlTree/Observable/Promise. Signal guards (Angular 17+): return Signal<boolean>. withComponentInputBinding: resolver result → component @Input automatically.
**Common mistakes:** Class-based guards (deprecated); missing factory pattern for parameterized guards.

### [L4 — Staff/Principal] Як використовувати inject() для створення composable behaviors (mixins) в Angular?
**Signal being tested:** Архітектурне розуміння composition patterns і their limitations compared to React hooks.
**What the interviewer expects:** Composable function pattern, returns signals/computed, once-execution semantics, testing approach, DX considerations.
**How to probe deeper:** "Яка принципова відмінність між Angular composables і React hooks?"
**Reference answer:** Angular composables: `function withPagination() { const route = inject(ActivatedRoute); ... return { page: signal, goToPage: fn }; }`. Called once in field/constructor (not per render). Signal-based returns для reactivity. React hooks: re-run per render, can be conditional. Angular: injection once, reactivity via signals. Testing: TestBed.runInInjectionContext() for composable testing. Design: explicit return type, document injection requirements.
**Common mistakes:** Expecting re-execution like React hooks; calling from methods; no signals for reactivity.

---

## Summary

### Key Points
- inject() — reads from Angular injection context stack, available у class field, constructor, factory, functional guards
- inject() in class field = compilation to constructor parameter (Ivy optimization)
- inject() у lifecycle methods і async callbacks → NG0203 error. runInInjectionContext() для edge cases
- DestroyRef — inject(DestroyRef), onDestroy(callback) LIFO order, no OnDestroy interface needed
- takeUntilDestroyed() — RxJS operator, inject(DestroyRef) internally, must call in injection context
- Functional guards (CanActivateFn) — inject() supported, class-based deprecated Angular 15.1
- Composable functions: `function withBehavior() { inject(X); return { ... } }` — once-executed, signals for reactivity

### Elevator Pitch (2 minutes)
inject() (stable Angular 14) — функція що дозволяє DI без constructor boilerplate. Works у: class fields, constructor, useFactory, functional guards/resolvers. Fails у: lifecycle hooks, async callbacks. inject() в field → Ivy compiles до constructor. DestroyRef: `inject(DestroyRef).onDestroy(() => cleanup())` — lifecycle hook без OnDestroy interface. takeUntilDestroyed() — RxJS auto-unsubscribe operator, використовує inject(DestroyRef) внутрішньо. Functional guards: `const guard: CanActivateFn = () => inject(AuthService).check()` — no class needed, deprecated CanActivate interface. Composable pattern: `function withPagination() { inject(); return { signals }; }` — once-executed, signals bridge reactivity gap. runInInjectionContext(injector, fn) — escape hatch для deferred injection scenarios.
