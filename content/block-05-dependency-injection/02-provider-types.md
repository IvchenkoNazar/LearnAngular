---
title: "Provider Types and Tree-Shakable Providers"
block: 5
topic: 2
slug: "provider-types"
difficulty: 3
sinceVersion: "6"
tags: ["providers", "useClass", "useFactory", "useValue", "useExisting", "providedIn", "tree-shaking"]
relatedTopics: ["di-internals", "injection-tokens", "inject-function", "resolution-modifiers", "bootstrapping"]
interviewQuestions:
  - id: "b5t2q1"
    level: "junior"
    question: "Назвіть основні типи провайдерів в Angular і коли кожен використовувати?"
    referenceAnswers:
      junior: "Angular має useClass (підставити клас), useValue (конкретне значення), useFactory (фабрична функція), useExisting (аліас на існуючий). useClass — найчастіший для заміни сервісу. useValue — для конфігурації."
      mid: "Provider types: useClass — реєструє клас, Angular instantiate через DI. Корисно для mock substitution. useValue — статичне значення, без інстанціювання. Для config constants, mock objects. useFactory — функція що повертає instance, може приймати deps. Для conditional service creation, late-initialization. useExisting — аліас на вже registered provider (не create new instance). Для interface aliasing або multiple tokens pointing to same service."
      senior: "Детально: useClass: `{ provide: Base, useClass: Impl }` — Angular creates Impl instance через DI (Impl може мати власні @Injectable deps). useValue: `{ provide: CONFIG, useValue: { api: '...' } }` — value stored as-is, no factory, no DI. Тип: будь-який. useFactory: `{ provide: Svc, useFactory: (dep: Dep) => new Svc(dep), deps: [Dep] }` — factory function з explicit deps array. deps — required, без них factory отримує нуль аргументів. useExisting: `{ provide: OldApi, useExisting: NewApi }` — DI resolve OldApi → redirect до NewApi provider → returns NewApi instance. Важливо: не дублює instance — справжній аліас. Injection token для interfaces: `{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }` — multi: true, allows multiple values for same token."
      staff: "Provider types реалізуються через єдиний ProviderRecord internal format. useClass compiles до factory function через ɵɵinject() calls. useFactory — raw factory з explicit deps resolution. useValue — special case: value stored in InjectRecord.value, no factory invocation. useExisting — forwarding pointer: DI resolves via the existing token's own chain. Performance implications: useValue — zero cost at injection time. useFactory з deps — cost of deps resolution + factory call. useClass — cost of constructor + all @Injectable deps. Для feature flags: useFactory з `deps: [APP_CONFIG]` → conditional service based on config — evaluated once at injector creation. provideX() pattern (Angular 14+): замість Provider object → function that returns EnvironmentProviders. Enables type-safe provider API: `provideRouter(routes)` замість `{ provide: Router, useClass: Router, deps: [...] }`. Library providers: preferable to expose provideMyLib() function, not raw Provider objects."
    commonMistakes:
      - "Використовують useFactory без `deps` array — factory отримує нуль аргументів, залежності undefined"
      - "Плутають useExisting і useClass — useExisting не створює новий instance, це аліас"
    relatedQuestions: ["b5t2q2", "b5t2q3"]
  - id: "b5t2q2"
    level: "mid"
    question: "Що таке tree-shakable providers і чим providedIn: 'root' відрізняється від реєстрації в providers: []?"
    referenceAnswers:
      junior: "providedIn: 'root' — сервіс доступний скрізь в app. providers:[] в NgModule/Component — тільки в тому scope."
      mid: "Tree-shakable providers: `@Injectable({ providedIn: 'root' })` — Angular compiler може видалити з bundle якщо сервіс не використовується ніде в app (static analysis). `providers: [MyService]` у NgModule або Component — не tree-shakable, завжди включається в bundle навіть якщо не використовується. Різниця в bundle size для великих apps. providedIn:'root' — рекомендований default для нових сервісів."
      senior: "Механізм tree-shaking: `providedIn: 'root'` — compiler додає `ɵprov` до класу сервісу з factory function. При bundle analysis: якщо жоден код не uses `inject(MyService)` або `constructor(private s: MyService)` — webpack/Rollup видаляє сервіс з bundle. Це можливо бо @Injectable({ providedIn: 'root' }) — declarative в класі, не imperative в providers array. `providers: [MyService]` — explicit registration в providers array. Array є runtime dependency — compiler не може статично аналізувати чи сервіс використовується. Тому завжди включається. providedIn: ModuleClass — lazy tree-shakable per module. providedIn: 'platform' — Platform injector level. providedIn: 'any' — deprecated, removed."
      staff: "Tree-shaking providers — architectural decision з далекосяжними наслідками для bundle optimization. Механізм: ɵprov static property на class → webpack marks as side-effect free → якщо no imports of class → removed. Для library authors: всі internal services — providedIn: 'root'. Public API services — expose через provideMyLib() factory. Consumers import function, not class → tree-shaking works. Проблема з `providers: [ServiceA, ServiceB]`: навіть якщо ServiceB не inject ніде — в bundle. Для feature services: route-level providers з provideX() — tree-shakable per route. Lazy route chunk = smaller bundle for unused routes. Angular 16+ standalone APIs: `bootstrapApplication(App, { providers: [provideRouter(routes), provideHttpClient()] })` — function-based providers що wrap tree-shakable registrations. Angular 19 best practice: НІКОЛИ providers:[] для services що можна провайдити через providedIn або provideX function."
    commonMistakes:
      - "Реєструють всі сервіси через providers:[] навіть коли providedIn:'root' підходить"
      - "Не розуміють що library services у providers:[] завжди в bundle користувача"
    relatedQuestions: ["b5t2q1", "b5t2q3"]
  - id: "b5t2q3"
    level: "mid"
    question: "Як використовувати multi: true providers і для чого це потрібно?"
    referenceAnswers:
      junior: "multi:true дозволяє мати кілька providers для одного токена. Використовується для HTTP interceptors де можна додати кілька."
      mid: "Multi providers: `{ provide: TOKEN, useClass: Handler, multi: true }` — замість одного value для TOKEN Angular збирає array. Кожен provider з multi:true додає item до array. inject(TOKEN) повертає array всіх зареєстрованих values. Використання: HTTP_INTERCEPTORS (multiple interceptors), APP_INITIALIZER (multiple init functions), LOCALE_ID extensions. Порядок: providers order = array order."
      senior: "Multi provider mechanism: Angular DI зберігає multi-providers як окремий список в injector registry. При resolve multi token — Angular збирає всі values (з цього injector і parents) в array. Важливий нюанс: якщо один injector override multi token без multi:true — НЕ доповнює array, а повністю замінює (breaks all inherited multi providers). Inheritance: child injector inherits parent multi providers + adds own. useFactory для multi: `{ provide: APP_INITIALIZER, useFactory: () => () => initFn(), multi: true }` — APP_INITIALIZER = array of functions. Порядок в array: від root до current injector, потім в порядку providers array. HTTP_INTERCEPTORS: `withInterceptors([fn1, fn2])` — Angular 15+ functional interceptors, замінює multi:true pattern для HTTP."
      staff: "Multi providers — extension point pattern в Angular framework architecture. Design principle: multi:true = plugin/extension API. Framework uses: APP_INITIALIZER (startup hooks), HTTP_INTERCEPTORS (middleware chain), LOCALE_ID, ENVIRONMENT_INITIALIZER. Architectural pattern для Design System: custom extension points via InjectionToken with multi:true — `THEME_PROVIDERS = new InjectionToken<ThemeProvider[]>('', { factory: () => [] })`. Library consumers register theme providers: `{ provide: THEME_PROVIDERS, useClass: DarkTheme, multi: true }`. Library reads: `inject(THEME_PROVIDERS)` — array of all registered. Pitfall: multi:true inheritance від parent injector — якщо feature module перевизначає без multi:true — silently breaks parent registrations. Perils of ordering: HTTP_INTERCEPTORS order matters для middleware chain. withInterceptors(fns) — Angular 15+ functional approach де order = array order explicitly. Testing multi providers: useValue array injection — `{ provide: TOKEN, useValue: [mock1, mock2] }` — but this replaces parent array, not extends. For test mocks of multi providers: be explicit about what you need."
    commonMistakes:
      - "Переоголошують multi token без multi:true — замінюють весь array замість доповнення"
      - "Не враховують порядок HTTP interceptors — порядок providers = порядок виконання"
    relatedQuestions: ["b5t2q2", "b5t2q4"]
  - id: "b5t2q4"
    level: "senior"
    question: "Що таке provideX() pattern і чому він кращий за raw Provider objects для бібліотек?"
    referenceAnswers:
      junior: "provideX() — функція що повертає провайдери. Наприклад provideRouter(routes) замість `{ provide: Router, ... }`."
      mid: "provideX() functions — Angular 14+ pattern для type-safe, composable provider registration. provideRouter(routes), provideHttpClient(), provideStore() — приклади. Переваги: IDE autocomplete для options, type safety, grouping related providers, testability. Повертають EnvironmentProviders type (не Provider[]) — безпечніший для standalone APIs."
      senior: "provideX() pattern details: function returns `EnvironmentProviders` (не `Provider[]`). EnvironmentProviders — sealed type що не можна використати у @Component providers (тільки в bootstrapApplication або route providers). Це enforces correct usage — environment-level services не потрапляють в component providers. withX() modifiers: `provideHttpClient(withInterceptors([...]), withFetch())` — functional composition. Кожен withX() returns HttpFeature<Kind> — type-safe і tree-shakable. Compiler може tree-shake unused features. Для library: `provideMyLib(config: MyConfig): EnvironmentProviders` — public API, внутрішні services hidden. Consumers: `bootstrapApplication(App, { providers: [provideMyLib({ theme: 'dark' })] })` — clean, type-safe."
      staff: "provideX() pattern — architectural innovation що Angular framework та ecosystem adopts. Technical foundation: EnvironmentProviders type created via `makeEnvironmentProviders(providers)` — prevents accidental component-level registration. Angular 14+: provideRouter(), provideHttpClient(), provideAnimations(). NgRx 16+: provideStore(), provideEffects(). Angular Material 15+: provideAnimationsAsync(). Design principles for library authors: 1) провайдери через function, не NgModule. 2) EnvironmentProviders return type. 3) withX() for optional features (feature flags). 4) Tree-shakable by default. 5) No class decorators on internal services (use factory functions). 6) TypeScript generics for config type-safety. Migration strategy: якщо є NgModule: `MyModule.forRoot()` → `provideMyLib()`. `MyModule.forFeature()` → `provideMyFeature()`. Route-level: replace `{ path: ..., loadChildren: () => import('./mod').then(m => m.Mod) }` з `{ path: ..., loadComponent: ..., providers: [provideMyFeature()] }`. This enables fully standalone, tree-shakable, composable provider API."
    commonMistakes:
      - "Повертають Provider[] замість EnvironmentProviders з provideX() — дозволяє неправильне використання в component providers"
      - "Не використовують withX() pattern для optional features — усі features завжди включені в bundle"
    relatedQuestions: ["b5t2q3", "b5t2q5"]
  - id: "b5t2q5"
    level: "staff"
    question: "Як спроектувати систему провайдерів для Angular library що підтримує tree-shaking, testing і versioning?"
    referenceAnswers:
      junior: "Зробити сервіс з providedIn:'root' і дати користувачам импортувати."
      mid: "Надати provideMyLib() функцію з config options, використовувати EnvironmentProviders. Документувати публічні сервіси. Тести з TestBed і override providers."
      senior: "Library provider design: 1) Public surface: provideMyLib(config) → EnvironmentProviders. 2) Optional features: withMyFeature() → feature flag (tree-shakable). 3) Internal services: @Injectable() без providedIn, registered в provideMyLib. 4) Public tokens: InjectionToken з описовими names для consumers. 5) Testing: provideMyLibTesting() для test-friendly overrides. 6) Versioning: config interfaces з optional fields і defaults — non-breaking additions."
      staff: "Production-grade library provider system вимагає thinking beyond basic DI. Multi-version strategy: SemVer + deprecation warnings через console для removed config options. Config validation: inject config token, validate in ngOnInit або constructor, throw descriptive errors. Feature flags via withX(): `withAnalytics(config)` — optional, tree-shakable. Internal: `ANALYTICS_CONFIG = new InjectionToken<AnalyticsConfig | null>('', { factory: () => null })`. withAnalytics provides this token. Analytics service checks token — if null, no-op. Token namespacing: avoid generic names — `MY_LIB_CONFIG` not `CONFIG`. Multiple library instances: provide configuration from different features — use hierarchical tokens. Testing story: provideMyLibTesting() що override HTTP calls, disable animations, use predictable IDs. Peer dependency on Angular version — use providedIn:'root' тільки для Angular 16+ compatible setup. Migration guide для кожного major version: що змінилось в provider API."
    commonMistakes:
      - "Не надають testing utilities — consumers важко mock library services"
      - "Breaking changes в config interface без SemVer major bump"
    relatedQuestions: ["b5t2q4", "b5t2q3"]
---

## Core Concept

**English definition:** Angular provider types are configurations that tell the DI system how to create or obtain a service instance: `useClass` (instantiate a class), `useValue` (use a literal value), `useFactory` (call a function with resolved deps), `useExisting` (alias another token). Tree-shakable providers via `providedIn` metadata let the compiler remove unused services from bundles.

**Пояснення:** Provider — це конфігурація DI що описує як створити value для токена. Чотири основних типи: `useClass` — Angular instantiate клас через DI; `useValue` — буквальне значення без factory; `useFactory` — функція з залежностями для conditional creation; `useExisting` — аліас (не копія) іншого зареєстрованого токена. `multi:true` — дозволяє кілька values для одного токена (збираються в array). Tree-shaking: `providedIn:'root'` у @Injectable — compiler може видалити з bundle якщо не використовується.

**Яку проблему вирішує:** Різні use cases потребують різних способів надання values через DI. useClass — polymorphism і substitution. useValue — configuration constants. useFactory — conditional creation або complex initialization. useExisting — backward compatibility без дублювання instances. Tree-shakable providers — зменшення bundle size для unused services.

**Як працює під капотом:** Кожен provider компілюється в `ProviderRecord` всередині injector. useValue → value stored directly. useClass/useFactory → factory function виконується при першому inject. Результат кешується (singleton в injector scope). providedIn:'root' → `ɵprov` static property на класі → webpack static analysis → tree-shake якщо unused. `multi:true` → InjectRecord зберігає array, кожен з multi:true додає до array.

**Trade-offs та обмеження:** useFactory з deps — порядок deps array МУСИТЬ відповідати параметрам factory. useExisting — якщо aliased token не registered → error. multi:true child injector без multi:true → replaces parent array (silent bug). providedIn:'root' не tree-shakable якщо будь-де imported (навіть в test file).

**Версійність:** Provider types стабільні з Angular 2. Angular 6: `providedIn:'root'` у @Injectable — tree-shakable providers (major improvement). Angular 14: EnvironmentProviders type, provideX() pattern стандартизований у framework APIs. Angular 15: functional HTTP interceptors з withInterceptors() замість multi:true HTTP_INTERCEPTORS. Angular 16: `provideExperimentalZonelessChangeDetection()`. Angular 19: `provideRouter`, `provideHttpClient` — fully standalone, NgModule-free.

---

## Deep Details

### Edge Cases

**useFactory без deps:** `{ provide: MyToken, useFactory: myFactory }` без deps — factory отримує нуль аргументів. Deps required for any DI injection in factory. Якщо factory потребує inject — використовувати inject() всередині factory (injection context active during factory execution).

**useExisting vs useClass:** useExisting: один instance shared між обома tokens. useClass: два окремих instances (якщо обидва розрізняються). Типовий помилковий вибір: `{ provide: OldService, useClass: NewService }` — два instances.

**Tree-shaking межі:** providedIn:'root' tree-shakable тільки якщо НЕ imported у providers:[] десь. Один providers:[MyService] в будь-якому NgModule — service always bundled навіть якщо providedIn:'root'.

**APP_INITIALIZER:** `{ provide: APP_INITIALIZER, useFactory: () => () => promise, multi: true }` — double arrow function. Outer factory повертає inner function що Angular calls. Inner function може повертати Promise/Observable.

**EnvironmentProviders vs Provider:** EnvironmentProviders не може бути в @Component providers. Це enforced type-check — prevents accidents. makeEnvironmentProviders() — creates this sealed type.

### Junior vs Senior Understanding

**Junior** знає useClass/useValue/useFactory/useExisting синтаксис і providedIn:'root'.

**Senior** розуміє:

1. **Tree-shaking mechanism:** ɵprov static property → webpack static analysis. Чому providers:[] array не tree-shakable.

2. **multi:true inheritance:** Child injector multi without multi:true → replaces parent. Common source of HTTP interceptor bugs.

3. **provideX() pattern:** EnvironmentProviders type, withX() functional composition, tree-shakable features.

4. **Factory execution context:** inject() всередині useFactory — injection context active. Equivalent to constructor injection but lazy.

5. **APP_INITIALIZER pattern:** Promise-based startup initialization через multi DI.

### Deprecation & Migration Path

- **NgModule providers array:** Functional equivalent до standalone providers, але NgModule itself deprecated workflow. Migration: feature providers → route-level providers array або provideX().
- **HTTP_INTERCEPTORS multi:true:** Deprecated стиль для Angular 15+. Migration: `withInterceptors([fn1, fn2])` у provideHttpClient. Automated: `ng generate @angular/core:http-interceptor-migration`.
- **providedIn:'any':** Deprecated Angular 14, removed Angular 16. Migration: explicit scope через route providers або 'root'.
- **forRoot() / forFeature() NgModule pattern:** Replaced by provideMyLib() / provideMyFeature() functional API.

### Connections to Other Concepts

- **InjectionToken:** useValue/useFactory часто paired з InjectionToken для typed, non-class providers.
- **HTTP Interceptors:** multi:true providers pattern → withInterceptors() functional replacement.
- **Router:** Route providers use EnvironmentProviders type (provideX functions).
- **Testing:** TestBed.overrideProvider() / providers array in TestBed.configureTestingModule() — same provider API.

---

## Examples

### Basic Usage

```typescript
// useClass — substitution/polymorphism
interface Logger { log(msg: string): void; }

@Injectable()
class ConsoleLogger implements Logger {
  log(msg: string) { console.log(msg); }
}

@Injectable()
class CloudLogger implements Logger {
  log(msg: string) { /* send to cloud */ }
}

// Swap implementation based on environment
const providers: Provider[] = [
  {
    provide: ConsoleLogger, // token
    useClass: environment.production ? CloudLogger : ConsoleLogger
  }
];

// useValue — config and constants
const APP_CONFIG = new InjectionToken<AppConfig>('AppConfig');

const providers: Provider[] = [
  {
    provide: APP_CONFIG,
    useValue: {
      apiUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3
    } satisfies AppConfig
  }
];

// useFactory — conditional creation with deps
const providers: Provider[] = [
  {
    provide: StorageService,
    useFactory: (config: AppConfig) => {
      return config.useLocalStorage
        ? new LocalStorageService()
        : new SessionStorageService();
    },
    deps: [APP_CONFIG]  // Must match factory params
  }
];

// useFactory with inject() — cleaner modern style
const providers: Provider[] = [
  {
    provide: StorageService,
    useFactory: () => {
      const config = inject(APP_CONFIG);  // inject() works in factory
      return config.useLocalStorage
        ? inject(LocalStorageService)
        : inject(SessionStorageService);
    }
  }
];

// useExisting — alias (single instance shared)
const providers: Provider[] = [
  NewAuthService,  // Real implementation
  { provide: AuthService, useExisting: NewAuthService }  // Alias
];
```

### Production Scenario

```typescript
// provideX() pattern for library
interface AnalyticsConfig {
  trackingId: string;
  enableDebug?: boolean;
}

const ANALYTICS_CONFIG = new InjectionToken<AnalyticsConfig>('ANALYTICS_CONFIG');
const DEBUG_ENABLED = new InjectionToken<boolean>('DEBUG_ENABLED');

// Optional feature
export function withDebugMode(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: DEBUG_ENABLED, useValue: true }
  ]);
}

// Main provider function
export function provideAnalytics(config: AnalyticsConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ANALYTICS_CONFIG, useValue: config },
    { provide: DEBUG_ENABLED, useValue: false },  // Default
    AnalyticsService,  // Internal, tree-shakable via this function
  ]);
}

// Internal service — no providedIn (registered via provideAnalytics only)
@Injectable()
export class AnalyticsService {
  private config = inject(ANALYTICS_CONFIG);
  private debug = inject(DEBUG_ENABLED);

  track(event: string, data?: Record<string, unknown>): void {
    if (this.debug) console.log('[Analytics]', event, data);
    // Send to analytics API
  }
}

// Consumer usage
bootstrapApplication(AppComponent, {
  providers: [
    provideAnalytics({ trackingId: 'GA-12345' }),
    withDebugMode(),  // Optional debug mode
    provideRouter(routes),
    provideHttpClient(),
  ]
});

// multi: true — APP_INITIALIZER pattern
function initializeApp(authService: AuthService): () => Promise<void> {
  return () => authService.checkSession();
}

function loadConfig(http: HttpClient): () => Promise<void> {
  return () => http.get('/assets/config.json').toPromise().then(config => {
    // Apply config
  });
}

const providers: Provider[] = [
  {
    provide: APP_INITIALIZER,
    useFactory: initializeApp,
    deps: [AuthService],
    multi: true
  },
  {
    provide: APP_INITIALIZER,
    useFactory: loadConfig,
    deps: [HttpClient],
    multi: true
  }
];
```

### Anti-Example

```typescript
// WRONG: useFactory without deps array
providers: [
  {
    provide: MyService,
    // WRONG: deps missing — OtherService will be undefined
    useFactory: (otherService: OtherService) => new MyService(otherService)
  }
]

// CORRECT:
providers: [
  {
    provide: MyService,
    useFactory: (otherService: OtherService) => new MyService(otherService),
    deps: [OtherService]  // Explicitly declare
  }
]

// WRONG: useClass instead of useExisting creates duplicate instance
providers: [
  NewService,
  { provide: OldService, useClass: NewService }  // WRONG: creates SECOND NewService instance
]

// CORRECT: useExisting for alias (same instance)
providers: [
  NewService,
  { provide: OldService, useExisting: NewService }  // Same instance aliased
]

// WRONG: multi:true override without multi in child injector
// In parent:
providers: [
  { provide: MY_HANDLERS, useClass: HandlerA, multi: true },
  { provide: MY_HANDLERS, useClass: HandlerB, multi: true }
]
// In child component:
providers: [
  // WRONG: missing multi:true — replaces parent array completely
  { provide: MY_HANDLERS, useClass: HandlerC }
  // Parent's HandlerA and HandlerB are gone!
]

// CORRECT: extend multi array in child
providers: [
  { provide: MY_HANDLERS, useClass: HandlerC, multi: true }  // Adds to parent
]
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `useFactory` без `deps` array | Factory params є undefined — silent bugs | `deps: [Dep1, Dep2]` explicit або inject() всередині factory |
| `useClass` замість `useExisting` для alias | Два окремих instances — порушує singleton semantics | `useExisting: ExistingToken` для справжнього аліасу |
| Всі сервіси через `providers:[]` замість `providedIn:'root'` | Не tree-shakable — unused services в bundle | `@Injectable({ providedIn: 'root' })` для app-wide services |
| Child multi provider без `multi: true` | Мовчки замінює весь parent array — breaks all parent multi registrations | Завжди `multi: true` якщо token є multi в parent |
| Повертати `Provider[]` з library замість `EnvironmentProviders` | Consumers можуть помилково використати в @Component providers | `makeEnvironmentProviders()` → `EnvironmentProviders` return type |

---

## Interview Block

### [L1 — Warm-up] Назвіть основні типи провайдерів в Angular і коли кожен використовувати?
**Signal being tested:** Знання provider API і розуміння use cases для кожного типу — не просто перерахування.
**What the interviewer expects:** useClass/useValue/useFactory/useExisting з конкретними use cases, deps requirement для useFactory.
**How to probe deeper:** "Яка різниця між useExisting і useClass коли обидва вказують на той самий клас?"
**Reference answer:** useClass — Angular instantiate клас (для polymorphism, mocking). useValue — literal value без factory (для config). useFactory — функція з deps (conditional creation). useExisting — аліас на вже існуючий token (один instance). Ключова різниця useExisting vs useClass: useExisting = same instance aliased. useClass = new separate instance created.
**Common mistakes:** useClass замість useExisting для aliases; useFactory без deps array.

### [L2 — Mid] Що таке tree-shakable providers і чим providedIn: 'root' відрізняється від providers: []?
**Signal being tested:** Розуміння bundle optimization і механізму tree-shaking для Angular services.
**What the interviewer expects:** ɵprov static property, webpack static analysis, чому providers:[] не tree-shakable, практичні наслідки для bundle size.
**How to probe deeper:** "Чому library service що використовує providedIn:'root' все одно може потрапити в bundle якщо не використовується?"
**Reference answer:** providedIn:'root' → compiler генерує ɵprov на класі → webpack може статично аналізувати imports → якщо ніде не inject — remove. providers:[] — imperative array registration → cannot statically analyze usage → always bundled. Exception: якщо клас imported у providers:[] десь — ɵprov tree-shaking blocked навіть для providedIn:'root'.
**Common mistakes:** Думають що providers:[] завжди краще бо explicit; не знають про bundle size implications.

### [L3 — Senior] Що таке provideX() pattern і чому він кращий за raw Provider objects для бібліотек?
**Signal being tested:** Знання сучасного Angular provider API і architectural thinking про library design.
**What the interviewer expects:** EnvironmentProviders type, makeEnvironmentProviders(), withX() functional composition, type safety, tree-shaking implications.
**How to probe deeper:** "Як withX() pattern дозволяє tree-shaking optional features?"
**Reference answer:** provideX() returns EnvironmentProviders (sealed type via makeEnvironmentProviders). Prevents accidental usage у @Component providers. withX() pattern: кожна optional feature окремо — `withInterceptors()`, `withFetch()`. Type-safe, composable, tree-shakable. Internal services hidden — only public API exposed. Testing: provideMyLibTesting() з mocked dependencies.
**Common mistakes:** Повертають Provider[] без EnvironmentProviders wrapper; не думають про tree-shaking features.

### [L4 — Staff/Principal] Як спроектувати систему провайдерів для Angular library що підтримує tree-shaking, testing і versioning?
**Signal being tested:** Архітектурне мислення про API design, consumer DX, backward compatibility і testability для library authoring.
**What the interviewer expects:** Public/internal service separation, provideMyLib() + withX(), testing utilities, config validation, SemVer strategy.
**How to probe deeper:** "Як обробити breaking change в provider API між major versions без breaking consumers?"
**Reference answer:** Public API: provideMyLib(config) → EnvironmentProviders. Optional: withAnalytics(), withDebugMode(). Internal services: no providedIn, registered inside provideMyLib. Testing: provideMyLibTesting() з HTTP mocks. Config: InjectionToken з interface + runtime validation. Versioning: optional config fields з defaults. Deprecation warnings (console) перед removal. Migration guide для кожного major.
**Common mistakes:** Всі services з providedIn:'root' — no private internals; no testing utilities; breaking changes без migration path.

---

## Summary

### Key Points
- Чотири provider types: useClass (instantiate), useValue (literal), useFactory (function+deps), useExisting (alias)
- useFactory requires explicit `deps` array або inject() всередині factory function
- useExisting — справжній аліас (один instance), useClass з тим самим class — два окремих instances
- `providedIn:'root'` → tree-shakable (ɵprov + webpack analysis). providers:[] → not tree-shakable
- multi:true — array accumulation. Child override без multi:true — замінює весь parent array
- provideX() + EnvironmentProviders — modern library API pattern, type-safe і composable
- APP_INITIALIZER — multi:true pattern для startup initialization з Promise/Observable support

### Elevator Pitch (2 minutes)
Angular provider types: useClass (instantiate class через DI), useValue (literal config), useFactory (function з explicit deps або inject()), useExisting (true alias — same instance). multi:true — збирає values в array (HTTP interceptors, APP_INITIALIZER). Tree-shaking: `@Injectable({ providedIn: 'root' })` — compiler аналізує usage, видаляє якщо unused. providers:[] array — завжди bundled. Modern approach: provideX() function + makeEnvironmentProviders() — type-safe EnvironmentProviders. withX() для optional features — tree-shakable extras. Library design: provideMyLib(config) публічно, internal services без providedIn, provideMyLibTesting() для test utilities. Multi trap: child injector override без multi:true — silently replaces entire parent array.
