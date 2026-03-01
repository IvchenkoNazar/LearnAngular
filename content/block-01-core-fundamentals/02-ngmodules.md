---
title: "NgModules & Module Architecture"
block: 1
topic: 2
slug: "ngmodules"
difficulty: 3
sinceVersion: "2"
tags: ["ngmodule", "declarations", "imports", "providers", "lazy-loading", "feature-modules"]
relatedTopics: ["bootstrapping", "standalone-components", "dependency-injection"]
interviewQuestions:
  - level: "junior"
    question: "Що таке NgModule і для чого потрібні масиви declarations, imports, exports, providers?"
    referenceAnswers:
      junior: "NgModule — це клас з декоратором @NgModule, який групує компоненти, директиви та пайпи. declarations — що модуль містить, imports — що він використовує з інших модулів, exports — що він надає назовні, providers — сервіси."
      mid: "NgModule — організаційна одиниця Angular-додатку. declarations реєструє компоненти, директиви та пайпи у compilation scope модуля — вони стають доступними один одному без додаткового імпорту. imports додає інші модулі до compilation scope. exports робить declarations доступними для модулів, які імпортують цей модуль. providers реєструє DI-токени в module injector. Важливо: один компонент може бути в declarations тільки одного модуля."
      senior: "NgModule визначає compilation context — набір компонентів, директив і пайпів, які Angular compiler розглядає разом при template compilation. declarations додає елементи до цього контексту — вони автоматично 'бачать' один одного. imports розширює context елементами з інших модулів. exports визначає public API модуля — тільки exported declarations доступні зовні. providers створюють module-level injector; при lazy loading кожен lazy module отримує власний child injector — це ключова різниця від providedIn: 'root'. Частий баг: декларувати component в двох модулях — Angular кине помилку при AOT compilation."
      staff: "NgModule — це compilation scope boundary та DI configuration unit, дві відповідальності які standalone API розділив. declarations формує transitive compilation scope — Angular compiler використовує його для template type-checking та code generation. Архітектурно, модулі служили як namespace mechanism та deployment boundary. В enterprise: SharedModule для re-exports, CoreModule з forRoot для singleton services, feature modules для domain boundaries. Проблема NgModule: вони створюють opaque dependency graph — складно зрозуміти що конкретний component реально використовує. Standalone API вирішує це через explicit imports per component. При проєктуванні module architecture для legacy проєктів — ключове рішення: granularity. Занадто великі modules — поганий tree-shaking. Занадто дрібні — import hell. Оптимальна стратегія: один module per feature route, shared module per UI library, core module для singleton services."
    commonMistakes:
      - "Плутають imports модулів з TypeScript import statements"
      - "Декларують component в кількох модулях"
      - "Додають сервіси в providers замість використання providedIn: 'root'"
    relatedQuestions: ["b1t2q2", "b1t3q1"]
  - level: "mid"
    question: "Що таке feature module і як правильно організувати модульну архітектуру Angular додатку?"
    referenceAnswers:
      junior: "Feature module — це окремий NgModule для певної функціональності додатку. Наприклад, UsersModule для всього, що стосується користувачів."
      mid: "Feature module інкапсулює певну domain area: компоненти, сервіси, routes. Типова архітектура включає: CoreModule (singleton сервіси, guards), SharedModule (reusable components, pipes, directives), та feature modules per domain (UsersModule, OrdersModule). Feature modules можуть бути lazy-loaded через router для зменшення initial bundle size."
      senior: "Feature modules реалізують separation of concerns на рівні compilation units. Правильна архітектура: CoreModule (forRoot pattern для singletons, import тільки в AppModule), SharedModule (re-exports CommonModule, reusable UI), feature modules per bounded context. Критично: SharedModule НЕ повинен мати providers — інакше кожен lazy module отримає нову instance. Feature modules поділяються на routed (lazy-loaded, з власними routes) та non-routed (widget modules, imported eagerly). Для large-scale: SCAM (Single Component Angular Module) pattern — один module per component, максимальний tree-shaking."
      staff: "Module architecture — це manifestation domain boundaries в коді. Feature modules повинні відповідати bounded contexts з DDD. Критерії декомпозиції: team ownership boundaries, deployment independence, change frequency. В monorepo (Nx): кожен feature module — окрема library з enforced dependency constraints через module boundary rules. Архітектурні layers: feature libraries (smart components), UI libraries (dumb components), data-access libraries (state, API), util libraries (pure functions). SCAM pattern був workaround для tree-shaking — standalone components вирішують це нативно. При migration planning: feature modules природно конвертуються в route-level provider scopes, SharedModule — в набір standalone components з barrel exports."
    commonMistakes:
      - "Один великий SharedModule що імпортує все"
      - "Services в SharedModule providers — дублювання instances при lazy loading"
      - "Circular dependencies між feature modules"
    relatedQuestions: ["b1t2q1", "b1t2q3"]
  - level: "mid"
    question: "Як працює lazy loading модулів і що відбувається з DI при lazy loading?"
    referenceAnswers:
      junior: "Lazy loading — це коли модуль завантажується тільки коли користувач переходить на відповідний route, а не при старті додатку."
      mid: "Lazy loading використовує dynamic import через Router: `loadChildren: () => import('./feature/feature.module').then(m => m.FeatureModule)`. Angular створює окремий chunk при build. При навігації chunk завантажується, модуль ініціалізується. DI: lazy module отримує child injector — providers модуля доступні тільки всередині нього, але він бачить всі root providers."
      senior: "Lazy loading працює через webpack/esbuild code splitting з dynamic import(). Router реєструє lazy route, при першій навігації завантажує chunk, instantiates NgModule, створює child EnvironmentInjector. DI наслідування: lazy module injector → root injector → platform injector. Це означає: service з providers lazy module — scoped singleton (один per lazy module instance). Service з providedIn: 'root' — глобальний singleton навіть якщо клас фізично в lazy module. Проблема: якщо один і той самий сервіс в providers eager і lazy module — два instances. Preloading strategies (PreloadAllModules, custom strategy) оптимізують UX — module вантажиться в background після initial load."
      staff: "Lazy loading — це intersection routing, bundling та DI. При loadChildren Angular compiler створює окремий compilation scope. В Ivy: lazy component може бути standalone з loadComponent — без NgModule overhead. Архітектурні рішення: 1) Granularity — lazy per feature vs per route vs per component. 2) Preloading — PreloadAllModules для bandwidth-rich, custom strategy з network-aware logic для mobile. 3) DI scoping — lazy module providers створюють isolation boundary, що корисно для multi-tenant UI де різні tenant routes мають різні service implementations. 4) Bundle analysis — lazy chunks повинні бути самодостатніми, shared code між chunks потрапляє в common chunk. Webpack splitChunks / esbuild code splitting конфігурація впливає на chunk topology. 5) SSR: lazy modules на сервері не мають сенсу для code splitting — всі routes рендеряться синхронно."
    commonMistakes:
      - "Очікують що providers lazy module доступні глобально"
      - "Не використовують preloading strategies"
      - "Імпортують lazy module і в imports AppModule — він перестає бути lazy"
    relatedQuestions: ["b1t2q2", "b1t2q4"]
  - level: "senior"
    question: "Поясніть патерн forRoot/forChild. Яку проблему він вирішує?"
    referenceAnswers:
      junior: "forRoot і forChild — це static методи модулів. forRoot використовується в AppModule, forChild — в feature modules."
      mid: "forRoot/forChild вирішує проблему дублювання providers при lazy loading. forRoot повертає ModuleWithProviders — модуль + providers (singletons для root). forChild повертає модуль без providers. Приклад: RouterModule.forRoot(routes) в AppModule реєструє Router service, RouterModule.forChild(routes) в feature modules додає тільки routes без повторного створення Router."
      senior: "forRoot/forChild — convention для розділення module configuration від module declarations. Проблема: якщо модуль з providers імпортується в lazy module — створюється новий instance service через child injector. forRoot повертає ModuleWithProviders з providers — викликається один раз в root. forChild повертає модуль без providers. Під капотом ModuleWithProviders — це інтерфейс {ngModule: Type, providers: Provider[]}. Angular compiler обробляє його спеціально — providers з forRoot реєструються в root injector. Custom реалізація: static forRoot(config: Config): ModuleWithProviders<MyModule> — приймає конфігурацію, повертає providers що залежать від неї. Альтернатива в standalone: provideMyFeature() функція — чистіший API."
      staff: "forRoot/forChild — це workaround для фундаментальної проблеми NgModule architecture: модуль combines declarations та providers, але при lazy loading вони мають різну scope semantics. Declarations — compile-time, providers — runtime із injector hierarchy. forRoot/forChild розділяє ці concerns. Еволюція: forRoot → providedIn: 'root' (Angular 6) → standalone provide functions (Angular 14+). Provide functions (provideRouter, provideHttpClient) — це spiritual successor forRoot з кращою ergonomics та tree-shaking. В enterprise legacy code: часто бачу custom modules без forRoot/forChild — service instances дублюються непомітно, спричиняючи subtle state bugs. При audit legacy проєкту: перевіряю чи singleton services не в providers модулів що lazy-loaded. Migration: forRoot pattern → providedIn: 'root' для services, provide*() для configuration."
    commonMistakes:
      - "Використовують forRoot у feature modules — дублювання singleton providers"
      - "Не розуміють зв'язок з injector hierarchy"
      - "Забувають про forChild при lazy loading"
    relatedQuestions: ["b1t2q3", "b1t2q5"]
  - level: "staff"
    question: "Як ви оцінюєте рішення Angular відмовитися від NgModules на користь standalone? Які trade-offs і як мігрувати великий проєкт?"
    referenceAnswers:
      junior: "Standalone components простіші — не треба створювати окремий module файл для кожного компонента."
      mid: "NgModules додавали boilerplate і complexity. Standalone components мають explicit imports — зрозуміло що кожен component використовує. Tree-shaking працює краще. Міграція: schematic `ng generate @angular/core:standalone`. Проте feature modules давали чітку організаційну структуру."
      senior: "NgModules вирішували compilation scope problem, але ціною opaque dependencies та boilerplate. Standalone API робить dependencies explicit per component — краще для tree-shaking, IDE support, і cognitive load. Trade-offs: 1) Standalone imports можуть бути verbose — кожен component імпортує CommonModule чи конкретні директиви. 2) Організаційна структура тепер на developer responsibility — без modules немає enforced boundaries. 3) Lazy loading спрощується (loadComponent замість loadChildren). Migration: automated schematic для convert → manual review circular deps → barrel exports для grouping → feature boundaries через Nx library rules."
      staff: "Angular's move від NgModules — це визнання що modules були over-engineering для component framework. React і Vue ніколи їх не мали. NgModules вирішували дві проблеми: compilation scope та DI configuration. Standalone розділяє їх: imports для compilation, provide functions для DI. Архітектурні implications для large teams: 1) Module boundaries замінюються на Nx library boundaries з lint rules — enforcement зсувається від runtime до build-time. 2) SharedModule → barrel exports з standalone components. 3) CoreModule → provideCore() function in app.config. 4) Lazy feature modules → lazy routes з loadComponent/loadChildren. Migration strategy для 500+ component проєкту: automated schematic (covers 80%), manual fixes (circular deps, forwardRef cases), phased rollout by feature area, automated tests as safety net. Критично: не мігрувати все одним PR — feature-by-feature з CI validation. Risk: schematic може зламати existing barrel exports та re-export chains. Metrics: після міграції очікую 5-15% зменшення bundle size через кращий tree-shaking."
    commonMistakes:
      - "Намагаються мігрувати весь проєкт в одному PR"
      - "Ігнорують circular dependencies при міграції"
      - "Не тестують lazy loading після міграції"
    relatedQuestions: ["b1t2q4", "b1t3q1"]
---

## Core Concept

**English definition:** NgModule is a class decorated with `@NgModule()` that defines a compilation context and DI configuration unit — grouping components, directives, pipes, and service providers into cohesive blocks of functionality.

**Пояснення:** NgModule — це механізм організації Angular додатку. Кожен module визначає "scope видимості" для template compilation: які компоненти, директиви та пайпи можуть бути використані разом у шаблонах. Одночасно module конфігурує Dependency Injection — які сервіси доступні.

**Яку проблему вирішує:** Без module system Angular compiler не знає які директиви/пайпи доступні в template конкретного компонента. NgModule створює "compilation boundary" — чіткий контракт: ось що є, ось що використовується, ось що надається назовні. Також modules дають DI scoping при lazy loading.

**Як працює під капотом:**

1. `@NgModule()` декоратор зберігає metadata через `ɵɵdefineNgModule` в Ivy
2. `declarations` реєструє components/directives/pipes в `compilationScope` модуля
3. `imports` додає exported declarations з інших модулів до scope
4. Angular compiler (ngc) використовує transitive scope для template type-checking
5. `providers` створюють `ModuleInjector` — частину injector hierarchy
6. При lazy loading — окремий child `EnvironmentInjector`

```typescript
@NgModule({
  declarations: [UserListComponent, UserCardComponent, HighlightDirective],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  exports: [UserListComponent],    // public API цього модуля
  providers: [UserApiService],     // scoped до цього module injector
})
export class UsersModule {}
```

**Trade-offs та обмеження:**

- NgModule об'єднує дві concerns: compilation scope + DI config — порушення SRP
- Один component може бути в declarations тільки одного модуля — негнучко для re-use
- Opaque dependencies: за declarations/imports незрозуміло що конкретний template реально використовує
- Boilerplate: кожен feature потребує окремий module файл

**Версійність:**
- Angular 2: NgModule введено (не було в beta, додано в RC5 — breaking change)
- Angular 6: `providedIn: 'root'` — перший крок від module providers
- Angular 14: standalone components (developer preview) — початок відходу від NgModules
- Angular 15: standalone API stable
- Angular 17+: standalone-first, `ng new` генерує без NgModules
- Angular 19+: NgModules підтримуються, але не рекомендовані для нових проєктів

## Deep Details

### Edge Cases

- **Duplicate declarations:** Якщо component оголошено в двох modules — AOT compiler кидає помилку `Type X is part of the declarations of 2 modules`. JIT може мовчки працювати з непередбачуваним результатом.
- **Re-exporting without importing:** Module може exports елемент без imports — Angular дозволяє re-export з declarations.
- **Empty modules:** Module без declarations — валідний. Часто використовується як "barrel" для re-export інших модулів (SharedModule).
- **Circular module imports:** Module A imports Module B, Module B imports Module A — Angular дозволяє це, але це code smell що свідчить про порушення module boundaries.

### Junior vs Senior Understanding

**Junior** знає: "NgModule групує компоненти, є declarations і imports."

**Senior** розуміє: NgModule — це compilation scope mechanism та DI boundary. Senior знає:
- Різницю між module injector та root injector при lazy loading
- Чому `providedIn: 'root'` краще ніж providers array для singletons
- SCAM pattern для оптимального tree-shaking
- Як transitive scope впливає на template compilation

```typescript
// SCAM pattern (Single Component Angular Module) — максимальний tree-shaking
@NgModule({
  declarations: [TooltipDirective],
  imports: [CommonModule],
  exports: [TooltipDirective],
})
export class TooltipModule {}

// Standalone еквівалент (Angular 14+) — SCAM більше не потрібен
@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {}
```

### Deprecation & Migration Path

- **Status:** NgModules НЕ deprecated, але officially "not recommended for new projects" з Angular 17+
- **Migration schematic:** `ng generate @angular/core:standalone`
- **Поетапна стратегія:**
  1. Run schematic в dry-run mode: `--dry-run`
  2. Convert leaf components to standalone (bottom-up)
  3. Convert shared modules to standalone exports
  4. Convert feature modules to route-based configuration
  5. Replace AppModule with `bootstrapApplication`
  6. Remove empty module files

### Connections to Other Concepts

- **Bootstrapping:** `bootstrapModule(AppModule)` — legacy entry point через NgModule
- **Standalone Components:** Пряма заміна NgModules для compilation scope
- **Dependency Injection:** Module providers створюють рівень в injector hierarchy
- **Router:** `RouterModule.forRoot/forChild` — canonical forRoot/forChild приклад
- **Lazy Loading:** Feature modules з `loadChildren` створюють child injectors

## Examples

### Basic Usage

```typescript
// core.module.ts — singleton services, import once in AppModule
@NgModule({
  providers: [], // services з providedIn: 'root' не потребують реєстрації тут
})
export class CoreModule {
  // Guard: prevent re-import
  constructor(@Optional() @SkipSelf() parent: CoreModule) {
    if (parent) {
      throw new Error('CoreModule is already loaded. Import it in AppModule only.');
    }
  }
}

// shared.module.ts — reusable UI components
@NgModule({
  declarations: [SpinnerComponent, TruncatePipe, AutofocusDirective],
  imports: [CommonModule],
  exports: [
    SpinnerComponent, TruncatePipe, AutofocusDirective,
    CommonModule, // re-export для зручності
  ],
})
export class SharedModule {}
```

### Production Scenario

```typescript
// feature module з lazy loading та forRoot/forChild pattern
// analytics.module.ts
@NgModule({
  declarations: [AnalyticsDashboardComponent, EventLogComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(analyticsRoutes)],
})
export class AnalyticsModule {
  static forRoot(config: AnalyticsConfig): ModuleWithProviders<AnalyticsModule> {
    return {
      ngModule: AnalyticsModule,
      providers: [
        { provide: ANALYTICS_CONFIG, useValue: config },
        AnalyticsService,  // singleton in root
      ],
    };
  }
}

// app.module.ts — forRoot для config
@NgModule({
  imports: [AnalyticsModule.forRoot({ trackingId: 'UA-XXXXX' })],
})
export class AppModule {}

// app-routing.module.ts — lazy load без providers
const routes: Routes = [
  { path: 'analytics', loadChildren: () => import('./analytics/analytics.module').then(m => m.AnalyticsModule) },
];
```

### Anti-Example

```typescript
// ❌ WRONG: service в SharedModule providers — кожен lazy module отримає окрему instance
@NgModule({
  declarations: [SpinnerComponent],
  exports: [SpinnerComponent],
  providers: [NotificationService], // Кожен lazy module, що imports SharedModule, отримає нову instance!
})
export class SharedModule {}

// ✅ CORRECT: service з providedIn: 'root' — гарантований singleton
@Injectable({ providedIn: 'root' })
export class NotificationService {}

// ✅ CORRECT: або forRoot pattern
@NgModule({
  declarations: [SpinnerComponent],
  exports: [SpinnerComponent],
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return { ngModule: SharedModule, providers: [NotificationService] };
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| God Module — один module з 50+ declarations | Поганий tree-shaking, важко зрозуміти dependencies | Feature modules або SCAM pattern, standalone components |
| Services в SharedModule providers | Дублювання instances при lazy loading | `providedIn: 'root'` або forRoot pattern |
| Circular module imports | Порушення module boundaries, заплутана архітектура | Виділити shared dependency в окремий module |
| Importing lazy module eagerly | Module не lazy-loaded, весь код в main bundle | Тільки loadChildren в routes, ніколи imports |
| Declaring component in multiple modules | AOT compilation error | Один module per declaration, export для re-use |

## Interview Block

### [L1 — Warm-up] Що таке NgModule і для чого потрібні масиви declarations, imports, exports, providers?
**Signal being tested:** Базове розуміння організаційної структури Angular додатку
**What the interviewer expects:** Чітке пояснення кожного масиву, розуміння що declarations — тільки components/directives/pipes
**How to probe deeper:** "Що станеться якщо один component оголосити в declarations двох modules?"
**Reference answer:** NgModule — клас з @NgModule декоратором, що визначає compilation scope. declarations — компоненти/директиви/пайпи цього модуля. imports — інші модулі чиї exports стають доступними. exports — public API модуля. providers — DI конфігурація.
**Common mistakes:** Плутають NgModule imports з ES imports; додають сервіси в declarations; не розуміють exports

### [L2 — Mid] Що таке feature module і як правильно організувати модульну архітектуру?
**Signal being tested:** Розуміння architectural patterns та module decomposition
**What the interviewer expects:** Core/Shared/Feature pattern, lazy loading awareness, SCAM
**How to probe deeper:** "Як SharedModule з providers поводиться при lazy loading?"
**Reference answer:** Feature module інкапсулює domain. Architecture: CoreModule (singletons, one import), SharedModule (reusable UI, no providers), feature modules per domain. SCAM pattern для tree-shaking. Lazy-loaded feature modules отримують child injector.
**Common mistakes:** Один великий SharedModule; services в shared providers; не знають SCAM

### [L3 — Mid] Як працює lazy loading модулів і що відбувається з DI?
**Signal being tested:** Розуміння code splitting, injector hierarchy, runtime behavior
**What the interviewer expects:** Dynamic import, child injector, preloading strategies, provider scoping
**How to probe deeper:** "Якщо service з providedIn: 'root' фізично в lazy module — скільки instances буде?"
**Reference answer:** Lazy loading через dynamic import() і Router loadChildren. Angular створює child injector для lazy module. Providers scoped до модуля. providedIn: 'root' — завжди singleton незалежно від location. Preloading strategies оптимізують perceived performance.
**Common mistakes:** Думають що code location визначає DI scope; import lazy module в AppModule imports

### [L4 — Senior] Поясніть патерн forRoot/forChild
**Signal being tested:** Глибоке розуміння DI scoping та module architecture
**What the interviewer expects:** Проблема дублювання providers, ModuleWithProviders, зв'язок з injector hierarchy
**How to probe deeper:** "Як standalone provide functions замінюють forRoot pattern?"
**Reference answer:** forRoot/forChild розділяє module configuration (providers) від declarations. forRoot повертає ModuleWithProviders — module + providers для root injector. forChild — тільки module. Вирішує проблему дублювання singletons при lazy loading. Standalone еквівалент: provideFeature() функції.
**Common mistakes:** Використовують forRoot в lazy modules; не знають ModuleWithProviders interface

### [L5 — Staff] Як оцінюєте рішення Angular відмовитися від NgModules? Як мігрувати великий проєкт?
**Signal being tested:** Architectural vision, migration planning, team leadership
**What the interviewer expects:** Аналіз trade-offs, phased migration strategy, tooling, metrics
**How to probe deeper:** "Які metrics ви б відстежували щоб виміряти успіх міграції?"
**Reference answer:** NgModules об'єднували compilation scope і DI — standalone розділяє ці concerns. Trade-offs: explicit imports verbose, але прозорі; організаційна структура — відповідальність devs. Migration: automated schematic → bottom-up conversion → phased rollout → CI validation. Nx library boundaries замінюють module boundaries. Очікуваний результат: 5-15% менший bundle, чистіший dependency graph.
**Common mistakes:** Big-bang міграція в одному PR; ігнорують circular deps; не вимірюють результат

## Summary

### Key Points
- NgModule визначає compilation scope (declarations) та DI configuration (providers)
- declarations/imports/exports/providers — чотири масиви з різною семантикою
- Feature modules: Core (singletons), Shared (reusable UI), Feature (domain)
- Lazy loading створює child injector — providers scoped до lazy module
- forRoot/forChild розділяє singleton providers від module declarations
- `providedIn: 'root'` краще ніж module providers для singletons
- Standalone API замінює NgModules — рекомендовано з Angular 17+

### Elevator Pitch (2 minutes)
"NgModule — це механізм організації Angular додатку, що визначає compilation scope для templates та конфігурує Dependency Injection. Чотири ключових масиви: declarations (що модуль містить), imports (що використовує), exports (що надає назовні), providers (сервіси). Feature modules з lazy loading створюють child injectors — forRoot/forChild pattern вирішує проблему дублювання singletons. З Angular 17+ NgModules замінюються standalone components з explicit imports — простіший API, кращий tree-shaking, прозоріший dependency graph."
