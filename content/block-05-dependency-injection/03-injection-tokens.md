---
title: "InjectionToken and Multi Providers"
block: 5
topic: 3
slug: "injection-tokens"
difficulty: 3
sinceVersion: "4"
tags: ["InjectionToken", "multi-providers", "APP_INITIALIZER", "HTTP_INTERCEPTORS", "opaque-token", "DI-token"]
relatedTopics: ["provider-types", "di-internals", "inject-function", "resolution-modifiers", "http-interceptors"]
interviewQuestions:
  - level: "junior"
    question: "Що таке InjectionToken і коли його використовують замість класу як DI токена?"
    referenceAnswers:
      junior: "InjectionToken використовують коли хочуть inject не клас, а конфігурацію або примітивне значення. Наприклад `new InjectionToken<string>('API_URL')`."
      mid: "InjectionToken — typed DI token для non-class values (primitives, interfaces, config objects). Клас не може бути токеном для interface (TypeScript interfaces erased at runtime). InjectionToken('description') — унікальна identity через object reference. Два `new InjectionToken('same-name')` — різні tokens. Використання: configuration objects, feature flags, abstract interfaces, platform-specific implementations."
      senior: "InjectionToken — wrapper що надає token identity незалежно від runtime type. Проблема класу як токена: клас має constructor — Angular може instantiate його. Для primitives/interfaces це неможливо або небажано. InjectionToken вирішує: unique reference = token identity. Generic parameter `InjectionToken<T>` — TypeScript type for inject() return value: `inject(MY_TOKEN)` returns T. Factory в InjectionToken: `new InjectionToken<Config>('', { factory: () => defaultConfig, providedIn: 'root' })` — self-registering token з factory і optional tree-shaking. Description string — для debugging (Angular DevTools, error messages). Токен comparison завжди by reference — string description не впливає на uniqueness."
      staff: "InjectionToken identity semantics important для library architecture. Кожен InjectionToken instance — unique object. Якщо library exports `export const MY_TOKEN = new InjectionToken(...)` — token identity preserved across all consumers. Problem: якщо два versions library loaded (duplicate packages in node_modules) — two different token instances → injection fails або unexpected values. Solution: check for duplicate package versions in CI. Bundling: InjectionToken.toString() returns `InjectionToken<description>` — корисно для logging. Internal vs public tokens: internal tokens — не exported, не part of public API. Public tokens — exported для consumer override. Naming convention: SCREAMING_SNAKE_CASE для tokens. TypeScript strict: `InjectionToken<Config>(description, { factory: () => config as Config })` — satisfies compiler for factory return type. Multi-token aggregation: `new InjectionToken<Provider[][]>('ROUTE_CONFIGS', { factory: () => [] })` — extensible registry pattern."
    commonMistakes:
      - "Думають що два InjectionToken з однаковим description — це один token (це два різних tokens)"
      - "Не додають TypeScript generic — inject() повертає unknown замість typed value"
    relatedQuestions: ["b5t3q2", "b5t3q3"]
  - level: "mid"
    question: "Як правильно визначити InjectionToken з default factory і як це пов'язано з tree-shaking?"
    referenceAnswers:
      junior: "Можна передати factory в InjectionToken: `new InjectionToken('', { factory: () => value })`."
      mid: "InjectionToken з factory: `new InjectionToken<T>('description', { factory: () => defaultValue, providedIn: 'root' })` — token self-registers в root injector. inject(TOKEN) повертає factory result якщо не overridden. Tree-shakable: так само як @Injectable providedIn:'root' — compiler може remove якщо token not injected anywhere."
      senior: "Self-contained token з factory: `const MY_CONFIG = new InjectionToken<Config>('MyConfig', { providedIn: 'root', factory: () => ({ debug: false, timeout: 5000 }) })`. Цей pattern: 1) Provides default value. 2) Tree-shakable (compiler analysis). 3) No need for explicit providers:[] registration. Override: consumer provides `{ provide: MY_CONFIG, useValue: customConfig }` — overrides factory default. factory() може використовувати inject() — InjectionToken factory execution context = injection context. inject(LOGGER) в factory — works якщо LOGGER registered в injector chain. Lazy evaluation: factory called тільки коли token first inject. Subsequent inject() — cached value returned."
      staff: "InjectionToken factory pattern — elegant mechanism для framework defaults з consumer override. Compiler analysis: token defined з factory → ɵprov generated on token object (similar to @Injectable ɵprov). Webpack marks as side-effect-free if no consumers. Якщо inject(TOKEN) anywhere in app — token kept in bundle. Design pattern: framework internal tokens з sensible defaults. Consumer can override per-app або per-route. Example: `ANIMATION_DURATION = new InjectionToken<number>('AnimDuration', { factory: () => 300, providedIn: 'root' })`. Component library uses this token. Consumer: `providers: [{ provide: ANIMATION_DURATION, useValue: 150 }]` — globally faster animations. Route-level: `{ path: 'fast', providers: [{ provide: ANIMATION_DURATION, useValue: 0 }] }` — no animations in route. Hierarchical override — each injector level можна override. Token composition: складний config складається з кількох tokens → granular override capability."
    commonMistakes:
      - "Забувають що factory в InjectionToken потребує explicit return type"
      - "Не знають що factory injection context дозволяє inject() всередині factory"
    relatedQuestions: ["b5t3q1", "b5t3q3"]
  - level: "mid"
    question: "Як APP_INITIALIZER і ENVIRONMENT_INITIALIZER tokens відрізняються і коли кожен використовувати?"
    referenceAnswers:
      junior: "APP_INITIALIZER виконує код перед запуском Angular app. Часто використовується для загрузки конфігурації перед тим як рендериться перший компонент."
      mid: "APP_INITIALIZER — multi token де кожен value — функція що повертає Promise або Observable. Angular чекає всі promises resolve перед bootstrap. ENVIRONMENT_INITIALIZER (Angular 14+) — для environment-level initialization в environment injectors (route lazy loading). APP_INITIALIZER — root level. Різниця: ENVIRONMENT_INITIALIZER може використовуватись в будь-якому EnvironmentInjector (lazy routes), APP_INITIALIZER — тільки root bootstrap."
      senior: "APP_INITIALIZER: registered у root providers. Angular bootstrap process: 1) Create platform. 2) Create root injector. 3) Execute all APP_INITIALIZER functions. 4) Wait for all Promise/Observable completions. 5) Bootstrap root component. Порядок: concurrent (Promise.all semantics). Timeout: немає built-in timeout — якщо promise never resolves, app never boots. Error: якщe initializer throws — app bootstrap fails. ENVIRONMENT_INITIALIZER: нова альтернатива для environment-level init. Runs when EnvironmentInjector created — root або lazy route. Синтаксис: `{ provide: ENVIRONMENT_INITIALIZER, useValue: () => { inject(MyService).init(); }, multi: true }`. Difference: ENVIRONMENT_INITIALIZER виконується synchronously (не async), дозволяє inject() всередині. APP_INITIALIZER — async (Promise/Observable). Для route lazy loading init: ENVIRONMENT_INITIALIZER в route providers — runs once when route injector created."
      staff: "APP_INITIALIZER і ENVIRONMENT_INITIALIZER — startup lifecycle hooks для different scopes. APP_INITIALIZER limitations: async-only (всі мають бути Promise/Observable), runs тільки once at root bootstrap, no inject() directly (old factory pattern з deps:[]). Modern alternative: ENVIRONMENT_INITIALIZER + inject() = cleaner. APP_INITIALIZER use cases: fetch remote config, authenticate user, load i18n resources. Critical: якщo initializer fails або hangs — white screen of death для користувача. Best practices: timeout mechanism, error boundary, loading spinner via document.getElementById before Angular boots. ENVIRONMENT_INITIALIZER use cases: lazy route initialization, feature flag loading, analytics tracking per route. Timing: runs synchronously when injector created — not when route renders. For async: use ENVIRONMENT_INITIALIZER to inject and call service that starts async init, component waits via loading signal. Production pattern: загружати тільки critical config в APP_INITIALIZER, defer non-critical. APP_INITIALIZER parallelism: всі run concurrently (Promise.all) — optimize for parallelism. Guard: якщо initializer order matters — chain promises explicitly or use sequential pattern."
    commonMistakes:
      - "Не повертають Promise або Observable з APP_INITIALIZER factory — Angular не чекає async операцій"
      - "Довгий APP_INITIALIZER без timeout — white screen indefinitely якщо network fails"
    relatedQuestions: ["b5t3q2", "b5t3q4"]
  - level: "senior"
    question: "Як реалізувати extension point через InjectionToken для plugin-based архітектури?"
    referenceAnswers:
      junior: "Можна створити InjectionToken і декілька класів що його implements, потім inject масив через multi:true."
      mid: "Extension point pattern: `PLUGINS = new InjectionToken<Plugin[]>('plugins')`. Кожен plugin реєструє: `{ provide: PLUGINS, useClass: MyPlugin, multi: true }`. Core service inject(PLUGINS) — array всіх зареєстрованих plugins. Цей pattern використовується в Angular для HTTP_INTERCEPTORS, NG_VALIDATORS."
      senior: "Plugin/extension architecture через InjectionToken: 1) Define interface: `interface ContentPlugin { id: string; render(ctx: RenderCtx): TemplateRef }`. 2) Create token: `const CONTENT_PLUGINS = new InjectionToken<ContentPlugin[]>('ContentPlugins')`. 3) Core service uses: `private plugins = inject(CONTENT_PLUGINS, { optional: true }) ?? []`. 4) Plugin provider: `{ provide: CONTENT_PLUGINS, useClass: VideoPlugin, multi: true }`. 5) Route-level: `{ path: 'video', providers: [{ provide: CONTENT_PLUGINS, useClass: VideoPlugin, multi: true }] }`. Typed plugins: interface enforced at compile time. Optional injection: якщо no plugins registered — array empty, not error. Order control через providers ordering."
      staff: "Extension point architecture через DI — proven pattern в large Angular apps і framework design. Angular itself: NG_VALUE_ACCESSOR, NG_VALIDATORS, HTTP_INTERCEPTORS, ROUTES, PLATFORM_INITIALIZER. Design considerations: 1) Plugin interface design — minimize required methods, maximize optional. 2) Priority: multi:true order = providers order (root first, then feature). For explicit priority: plugin interface includes priority: number → sort at injection time. 3) Lifecycle: plugins в multi:true живуть разом з injector — route-scoped plugins auto-cleanup. 4) Type safety: generic token `InjectionToken<T[]>` з interface. 5) Conflict resolution: якщо два plugins handle same content type — first wins або throw? Define policy. 6) Testing: inject mock plugins через TestBed providers. 7) Dynamic plugins (runtime registration) — не можна після injector creation. Alternative: Registry service з signal-based dynamic registration. 8) Lazy plugin loading: route provides plugin lazy — only loaded when route visited. Architectural pattern: plugin-based routing, micro-frontend extension points, design system theming."
    commonMistakes:
      - "Не використовують optional: true при inject — throws якщо no plugins registered"
      - "Не думають про plugin interface versioning — breaking change в interface = all plugins broken"
    relatedQuestions: ["b5t3q3", "b5t3q5"]
  - level: "staff"
    question: "Як bi ви спроектували configuration token hierarchy для enterprise Angular application?"
    referenceAnswers:
      junior: "Один APP_CONFIG token з усіма налаштуваннями і inject в сервіси де потрібно."
      mid: "Розбити на кілька tokens для різних concerns: AUTH_CONFIG, HTTP_CONFIG, FEATURE_FLAGS. Кожен сервіс inject тільки потрібну конфігурацію. Це також кращий tree-shaking."
      senior: "Config token hierarchy: 1) Root config (APP_CONFIG) — базові параметри: apiUrl, env. 2) Feature configs (AUTH_CONFIG, ANALYTICS_CONFIG) — feature-specific. 3) Component tokens (ANIMATION_DURATION, BREAKPOINTS) — UI behavior. Tokens з default factories для optional configs. Override point: root config → feature config → component config → runtime override. Route-level: route-specific config override через providers:[]."
      staff: "Enterprise config token architecture потребує thinking about: 1) Granularity: один великий config vs багато малих tokens. Granular краще для tree-shaking і selective override. 2) Validation: `validate(config)` function у factory — throw descriptive error at startup, not runtime. 3) Environment-specific: `config/environment.ts` exports base config, merge з server-provided config (env vars through meta tags або separate config endpoint). 4) Hierarchical override: global → route → component. Use Angular DI hierarchy для це — EnvironmentInjector надає більш specific config. 5) Type safety: strict TypeScript interfaces з required fields. 6) Documentation: each token needs description string (debugging) і JSDoc. 7) Config schema versioning — схема може змінюватись між app versions. Config migration функція. 8) Runtime config fetching: APP_INITIALIZER reads config.json → provide via useValue. Test overrides: easy mock through providers array in TestBed. 9) Feature flags integration: `FEATURE_FLAGS` token + FeatureFlagService — centralized feature control. 10) Config logging: at startup, log active config (excluding secrets) for debugging. Security: tokens НІКОЛИ не містять secrets — тільки public config."
    commonMistakes:
      - "Один монолітний config — важко override частково, великий bundle"
      - "Secrets в config tokens — Angular config visible in source maps і bundle"
    relatedQuestions: ["b5t3q4", "b5t3q3"]
---

## Core Concept

**English definition:** `InjectionToken<T>` is a type-safe DI token for non-class values (primitives, interfaces, configuration objects) that provides unique identity through object reference, supports default factories with optional tree-shaking, and enables multi-provider patterns for extension points and plugin architectures.

**Пояснення:** `InjectionToken` — typed обгортка для non-class DI tokens. Потрібний коли token value не є class (primitive, interface, config object). Унікальність — через object reference, не string name. Два `new InjectionToken('same')` — різні tokens. Generic `<T>` дає TypeScript type для inject() return value. Factory в constructor — default value і tree-shaking support.

**Яку проблему вирішує:** TypeScript interfaces erased at runtime — не можна inject by interface type. Primitive values (string, number) не унікальні як tokens. Конфігурація і feature flags потребують typed DI без class overhead. Multi-provider pattern через InjectionToken дозволяє extension points (HTTP interceptors, validators, plugins).

**Як працює під капотом:** InjectionToken instance — plain JavaScript object з `_desc` і `ɵprov` fields. При inject(TOKEN): Angular порівнює token object references. З factory: `ɵprov` на token object → compiler аналізує → tree-shaking якщо unused. Multi-token: injector зберігає array of values, кожен multi:true provider додає до array.

**Trade-offs та обмеження:** Token identity через object reference — при дублюванні пакетів (два copies library в node_modules) два різних token instances = injection fails. Multi-token order — порядок providers array = порядок в inject array. Runtime registration неможлива після injector creation.

**Версійність:** OpaqueToken — deprecated, removed Angular 5. InjectionToken з generic — Angular 4+. Factory в InjectionToken constructor — Angular 4+. ENVIRONMENT_INITIALIZER — Angular 14+. InjectionToken з `{ providedIn, factory }` — Angular 6+ (standalone tree-shaking).

---

## Deep Details

### Edge Cases

**Duplicate token names:** `new InjectionToken('Config')` і `new InjectionToken('Config')` — різні tokens. Ніколи не покладайтесь на description для identity. Описовий name — тільки для debugging.

**inject() inside InjectionToken factory:** Factory виконується в injection context — inject() доступний. `new InjectionToken('', { factory: () => { const env = inject(ENV); return new Config(env); } })`.

**Multi-token in parent and child:** Child injector з multi:true доповнює parent array. Child injector override без multi:true — замінює повністю. В Angular 16+ — warning в dev mode для accidental replacement.

**optional multi injection:** `inject(PLUGINS, { optional: true })` — returns null якщо token не registered. Multi token з optional → null (не empty array). Guard: `?? []` for safe usage.

**InjectionToken і HMR:** Hot Module Replacement може recreate tokens якщо module reevaluated — різні token instances. Для HMR compatibility: tokens у окремих стабільних modules.

### Junior vs Senior Understanding

**Junior** знає InjectionToken синтаксис для non-class values, розуміє описовий name.

**Senior** розуміє:

1. **Token identity через reference:** Чому дублювання бібліотеки в node_modules ламає DI. Чому export singleton token instance.

2. **Factory tree-shaking:** ɵprov на token object — same mechanism як @Injectable ɵprov. providedIn:'root' у factory.

3. **Multi-token mechanics:** Array accumulation, parent/child inheritance, replacement vs extension.

4. **ENVIRONMENT_INITIALIZER vs APP_INITIALIZER:** Scope (root vs any env injector), sync vs async, inject() support.

5. **Plugin architecture:** Interface definition, optional injection, priority pattern, lifecycle alignment.

### Deprecation & Migration Path

- **OpaqueToken:** Removed Angular 5. Migration: `new InjectionToken<T>(description)` з TypeScript generic.
- **HTTP_INTERCEPTORS multi:true pattern:** Deprecated стиль Angular 15+. Migration: `withInterceptors([fn])` у provideHttpClient.
- **APP_INITIALIZER factory з deps:** Старий pattern `{ useFactory: () => fn, deps: [Dep] }`. Modern: `{ useValue: () => { const dep = inject(Dep); return fn(dep); } }` — inject() всередині.
- **NG_VALIDATORS / NG_VALUE_ACCESSOR:** Залишаються стабільними, але pattern тепер рекомендується через standalone APIs де можливо.

### Connections to Other Concepts

- **Provider Types:** InjectionToken + useValue/useFactory/useClass — combined pattern для all provider scenarios.
- **HTTP Interceptors:** HTTP_INTERCEPTORS InjectionToken — classic multi:true example. Modern: withInterceptors().
- **Forms:** NG_VALIDATORS, NG_VALUE_ACCESSOR — multi:true extension points для custom validators і CVAs.
- **Router:** ROUTES InjectionToken — multi:true for modular route registration.

---

## Examples

### Basic Usage

```typescript
// Basic InjectionToken for config
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

// Token with description for debugging
export const API_CONFIG = new InjectionToken<ApiConfig>('ApiConfig');

// Self-registering token with default factory
export const ANIMATION_DURATION = new InjectionToken<number>(
  'AnimationDuration',
  {
    providedIn: 'root',
    factory: () => 300  // Default 300ms
  }
);

// Token for interface (no concrete class at runtime)
interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}
export const STORAGE_ADAPTER = new InjectionToken<StorageAdapter>('StorageAdapter');

// Usage in service
@Injectable({ providedIn: 'root' })
export class AppService {
  private config = inject(API_CONFIG);
  private animDuration = inject(ANIMATION_DURATION);  // Returns number
  private storage = inject(STORAGE_ADAPTER, { optional: true });
}

// Provider registration
bootstrapApplication(AppComponent, {
  providers: [
    { provide: API_CONFIG, useValue: { baseUrl: '/api', timeout: 5000, retries: 3 } },
    { provide: STORAGE_ADAPTER, useClass: LocalStorageAdapter },
    // ANIMATION_DURATION has factory default — no need to register unless overriding
  ]
});
```

### Production Scenario

```typescript
// Plugin-based content rendering system
interface ContentPlugin {
  type: string;
  priority: number;
  canHandle(block: ContentBlock): boolean;
  render(block: ContentBlock): TemplateRef<ContentContext>;
}

export const CONTENT_PLUGINS = new InjectionToken<ContentPlugin[]>(
  'ContentPlugins',
  { factory: () => [] }  // Default: empty array
);

// Core content renderer
@Injectable({ providedIn: 'root' })
export class ContentRendererService {
  private plugins = inject(CONTENT_PLUGINS);

  // Sort by priority at injection time (once)
  private sortedPlugins = this.plugins.sort((a, b) => b.priority - a.priority);

  getPlugin(block: ContentBlock): ContentPlugin | null {
    return this.sortedPlugins.find(p => p.canHandle(block)) ?? null;
  }
}

// Video plugin
@Injectable()
export class VideoContentPlugin implements ContentPlugin {
  type = 'video';
  priority = 10;
  private template = viewChild.required<TemplateRef<ContentContext>>('videoTpl');

  canHandle(block: ContentBlock): boolean {
    return block.type === 'video';
  }

  render(block: ContentBlock): TemplateRef<ContentContext> {
    return this.template();
  }
}

// Feature module provides plugin
export function provideVideoContent(): EnvironmentProviders {
  return makeEnvironmentProviders([
    VideoContentPlugin,
    { provide: CONTENT_PLUGINS, useExisting: VideoContentPlugin, multi: true }
  ]);
}

// ENVIRONMENT_INITIALIZER — route-level init
const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component'),
    providers: [
      provideVideoContent(),
      // Analytics initialization when dashboard route loads
      {
        provide: ENVIRONMENT_INITIALIZER,
        useValue: () => {
          const analytics = inject(AnalyticsService);
          analytics.trackRouteLoad('dashboard');
        },
        multi: true
      }
    ]
  }
];

// APP_INITIALIZER — startup config loading
export function provideRemoteConfig(): Provider[] {
  return [
    {
      provide: APP_INITIALIZER,
      useValue: () => {
        const http = inject(HttpClient);
        const configService = inject(ConfigService);
        return lastValueFrom(
          http.get<AppConfig>('/assets/config.json').pipe(
            tap(config => configService.setConfig(config))
          )
        );
      },
      multi: true
    }
  ];
}
```

### Anti-Example

```typescript
// WRONG: Using string as token — not type-safe, name collisions possible
providers: [
  { provide: 'API_URL', useValue: 'https://api.example.com' }
]
// inject('API_URL') — returns any, no TypeScript type

// WRONG: Two separate InjectionToken instances with same name — different tokens
// file-a.ts
export const CONFIG_A = new InjectionToken<Config>('AppConfig');
// file-b.ts
export const CONFIG_B = new InjectionToken<Config>('AppConfig');  // DIFFERENT token!

// This is how to ensure same token everywhere:
// tokens.ts (single source of truth)
export const APP_CONFIG = new InjectionToken<Config>('AppConfig');
// Import and reuse this single instance

// WRONG: APP_INITIALIZER that doesn't return Promise/Observable
providers: [
  {
    provide: APP_INITIALIZER,
    useValue: () => {
      // WRONG: synchronous work, returns void
      this.config = loadSyncConfig();  // Angular doesn't wait for anything
    },
    multi: true
  }
]

// CORRECT:
providers: [
  {
    provide: APP_INITIALIZER,
    useValue: () => {
      const http = inject(HttpClient);
      // Returns Promise — Angular waits for it
      return firstValueFrom(http.get<Config>('/config.json').pipe(
        tap(config => inject(ConfigService).apply(config))
      ));
    },
    multi: true
  }
]
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| String tokens замість InjectionToken | No type safety, global namespace collision | `new InjectionToken<T>('description')` |
| Два InjectionToken instances з однаковим description | Різні tokens — injection fails або unexpected values | Single exported token instance, imported everywhere |
| APP_INITIALIZER без return Promise/Observable | Angular не чекає async роботи — race condition при bootstrap | Return `firstValueFrom(observable)` або `promise` |
| Multi-token override без `multi: true` | Замінює весь parent array — silent bug | Always `multi: true` for multi-token extension |
| inject() результат multi token без `optional: true` | Throws якщо no provider registered | `inject(TOKEN, { optional: true }) ?? []` |

---

## Interview Block

### [L1 — Warm-up] Що таке InjectionToken і коли його використовують замість класу як DI токена?
**Signal being tested:** Розуміння різниці між class token і InjectionToken і practical use cases — не просто "InjectionToken для не-класів".
**What the interviewer expects:** Interfaces erased at runtime, primitive values, config objects, unique reference identity.
**How to probe deeper:** "Чому два `new InjectionToken('same-name')` — це різні tokens?"
**Reference answer:** TypeScript interfaces erased — не можна inject by interface type. InjectionToken provides unique identity через object reference. Primitives не unique as tokens. Use cases: config objects, feature flags, interfaces, platform-specific implementations. Generic <T> — TypeScript type for inject() return. Two InjectionToken('same') — different objects → different tokens.
**Common mistakes:** Думають string description = identity; не типізують generic parameter.

### [L2 — Mid] Як правильно визначити InjectionToken з default factory і як це пов'язано з tree-shaking?
**Signal being tested:** Знання self-registering tokens і розуміння tree-shaking mechanism для non-class providers.
**What the interviewer expects:** factory + providedIn в InjectionToken constructor, ɵprov generated, webpack analysis, override pattern.
**How to probe deeper:** "Як override default factory value для конкретної route?"
**Reference answer:** `new InjectionToken<T>('', { providedIn: 'root', factory: () => defaultValue })` — self-registers, tree-shakable. inject() inside factory — injection context active. Override: `{ provide: MY_TOKEN, useValue: customValue }` в providers. Route-level override: route providers array. Tree-shaking: compiler generates ɵprov on token object → webpack removes if not inject'd.
**Common mistakes:** Не знають про inject() у factory; не додають providedIn для tree-shaking.

### [L3 — Senior] Як APP_INITIALIZER і ENVIRONMENT_INITIALIZER tokens відрізняються і коли кожен використовувати?
**Signal being tested:** Розуміння Angular bootstrap lifecycle і scoping initializers до різних injector рівнів.
**What the interviewer expects:** APP_INITIALIZER (root, async, Promise/Observable), ENVIRONMENT_INITIALIZER (any env injector, sync, inject()), use cases для кожного.
**How to probe deeper:** "Що відбувається якщо APP_INITIALIZER Promise never resolves?"
**Reference answer:** APP_INITIALIZER: root-only, async (Promise/Observable), Angular waits before bootstrap. ENVIRONMENT_INITIALIZER: будь-який env injector, synchronous, inject() supported. APP_INITIALIZER use cases: config loading, auth session check. ENVIRONMENT_INITIALIZER use cases: route-level init, analytics, lazy feature setup. Concurrent: всі APP_INITIALIZER run in parallel (Promise.all). No timeout — hung promise = infinite white screen.
**Common mistakes:** Не повертають Promise; using APP_INITIALIZER for route-level init (use ENVIRONMENT_INITIALIZER).

### [L4 — Staff/Principal] Як би ви спроектували configuration token hierarchy для enterprise Angular application?
**Signal being tested:** Архітектурне мислення про config granularity, tree-shaking, override flexibility і security.
**What the interviewer expects:** Granular tokens per concern, default factories, validation, runtime loading via APP_INITIALIZER, no secrets in tokens.
**How to probe deeper:** "Як забезпечити runtime config (наприклад з env vars) без хардкодованих значень?"
**Reference answer:** Granular tokens: AUTH_CONFIG, HTTP_CONFIG, UI_CONFIG (better tree-shaking і selective override). Default factories для optional configs. APP_INITIALIZER loads config.json → provides via useValue. Config validation at startup. Route-level: route-specific overrides via providers. Never in tokens: API keys, secrets (source map visible). Feature flags via FEATURE_FLAGS token + FeatureFlagService.
**Common mistakes:** Один монолітний config; secrets in tokens; no runtime loading strategy.

---

## Summary

### Key Points
- InjectionToken<T> — typed token для non-class values, унікальна через object reference (не string name)
- Factory в InjectionToken constructor: default value + tree-shaking support (ɵprov generated)
- inject() всередині InjectionToken factory — injection context active, дозволяє DI
- Multi-token: array accumulation, child multi:true extends parent, child без multi:true — replaces all
- APP_INITIALIZER: root-only, async (Promise/Observable), concurrent, Angular waits before bootstrap
- ENVIRONMENT_INITIALIZER: будь-який EnvironmentInjector, synchronous, inject() supported, route-level init
- Plugin architecture: InjectionToken<Plugin[]> + multi:true = runtime extension point

### Elevator Pitch (2 minutes)
InjectionToken<T> — typed DI token для non-class values. Unique через object reference — два токени з однаковим name є різними. Generic <T> — TypeScript type для inject(). Factory constructor: default value + providedIn:'root' = tree-shakable self-registering token. inject() всередині factory — works. Multi tokens: array accumulation per provider, multi:true extends parent, без multi:true — replaces. APP_INITIALIZER: root startup async init, await Promise/Observable before bootstrap, concurrent. ENVIRONMENT_INITIALIZER: route-level sync init, inject() available. Extension points: CONTENT_PLUGINS = InjectionToken + multi:true — plugin registration без coupling. Strings as tokens — never: no type safety, name collisions.
