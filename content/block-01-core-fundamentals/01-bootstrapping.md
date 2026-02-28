---
title: "Bootstrapping & Application Initialization"
block: 1
topic: 1
slug: "bootstrapping"
difficulty: 3
sinceVersion: "2"
tags: ["bootstrapping", "standalone", "APP_INITIALIZER", "providers", "platformBrowserDynamic"]
relatedTopics: ["ngmodules", "standalone-components", "dependency-injection"]
interviewQuestions:
  - id: "b1t1q1"
    level: "junior"
    question: "Як Angular-додаток стартує? Що відбувається при виклику bootstrapApplication?"
    referenceAnswers:
      junior: "Angular створює root component і рендерить його в DOM-елемент, вказаний у selector. bootstrapApplication приймає root component і конфігурацію providers."
      mid: "bootstrapApplication створює ApplicationRef, ініціалізує DI-контейнер з переданими providers, створює root component і рендерить його. Перед рендерингом виконуються APP_INITIALIZER'и. Zone.js патчить async API для автоматичного change detection."
      senior: "Процес: 1) Створюється EnvironmentInjector з providers. 2) Zone.js ініціалізується та патчить Promise, setTimeout, addEventListener тощо. 3) Виконуються APP_INITIALIZER'и (можуть бути async — bootstrap чекає). 4) Створюється ApplicationRef. 5) Root component instantiates через ComponentFactory (в Ivy — напряму). 6) Перший change detection cycle. Важливо: якщо APP_INITIALIZER повертає Promise що reject'ається — додаток не стартує, і помилку легко пропустити без глобального error handler."
      staff: "Bootstrapping — це orchestration DI tree, zone setup, і rendering pipeline. В Ivy, bootstrapApplication уникає NgModuleFactory — component напряму створюється через ɵɵdefineComponent. EnvironmentInjector замінює старий ModuleInjector. Для micro-frontends критично розуміти, що кожен bootstrapApplication створює окремий Zone та DI tree — shared state потребує explicit механізму (custom events, shared service через window). В SSR сценарії bootstrapApplication замінюється на renderApplication з @angular/platform-server, де Zone.js опціональний (zoneless з provideExperimentalZonelessChangeDetection). При побудові platform-agnostic додатків — розділення platform providers від application providers є ключовим архітектурним рішенням."
    commonMistakes:
      - "Плутають bootstrapApplication (standalone) з platformBrowserDynamic().bootstrapModule (NgModule-based)"
      - "Не знають що APP_INITIALIZER блокує рендеринг"
    relatedQuestions: ["b1t1q2", "b1t2q1"]
  - id: "b1t1q2"
    level: "mid"
    question: "Яка різниця між bootstrapModule і bootstrapApplication? Коли використовувати кожен?"
    referenceAnswers:
      junior: "bootstrapModule — для NgModule-based додатків, bootstrapApplication — для standalone. Standalone — це новий підхід."
      mid: "bootstrapModule приймає NgModule клас, який декларує root component. bootstrapApplication приймає standalone component напряму, без NgModule обгортки. Standalone підхід простіший, має менше boilerplate, і є рекомендованим з Angular v17+. Providers передаються через appConfig замість NgModule providers."
      senior: "bootstrapModule створює NgModuleRef з повним module injector tree — це legacy підхід з Angular 2. bootstrapApplication створює standalone EnvironmentInjector без module overhead. Ключова різниця в DI: module injector vs environment injector. Standalone дозволяє tree-shaking providers ефективніше, бо немає NgModule що 'тримає' всі providers. Міграція: `ng generate @angular/core:standalone` автоматизує перехід. Але в enterprise-проєктах з lazy-loaded feature modules міграція потребує обережності — кожен lazy module стає просто routes з providers."
      staff: "Це питання architectural migration. bootstrapModule тягне за собою NgModuleFactory, JIT/AOT compilation path через NgModuleCompiler. bootstrapApplication — чистий Ivy pipeline без module compilation. В monorepo з shared libraries це впливає на build graph: standalone components мають чіткіші dependency boundaries. Для команди: міграція потребує strategy — не можна мігрувати 'по одному файлу', бо NgModule declarations і standalone imports несумісні в одному scope. Рекомендую: bottom-up migration (leaf components → shared modules → feature modules → app module), з automated migration schematic як першим кроком та manual review для edge cases (forwardRef, circular dependencies)."
    commonMistakes:
      - "Вважають що bootstrapModule deprecated — він ні, просто не рекомендований для нових проєктів"
      - "Не розуміють різницю в DI tree structure між підходами"
    relatedQuestions: ["b1t1q1", "b1t2q1"]
  - id: "b1t1q3"
    level: "senior"
    question: "Як працює APP_INITIALIZER? Що станеться якщо initializer кине помилку або зависне?"
    referenceAnswers:
      junior: "APP_INITIALIZER — це спеціальний token для функцій, що виконуються перед стартом додатку."
      mid: "APP_INITIALIZER — multi-provider token. Angular збирає всі зареєстровані функції і викликає їх при bootstrap. Якщо функція повертає Promise або Observable — Angular чекає завершення. Якщо Promise reject — додаток не стартує."
      senior: "APP_INITIALIZER використовує ENVIRONMENT_INITIALIZER під капотом у standalone підході. Всі initializer'и викликаються паралельно через Promise.all. Якщо один reject — ApplicationRef не створюється, DOM залишається порожнім (або показує loading state з index.html). Проблема: немає timeout за замовчуванням — якщо initializer зависне, додаток просто не стартує без помилки в консолі. Workaround: обгортати в Promise.race з timeout. Також важливо: initializer'и не мають доступу до Router чи компонентів — вони виконуються ДО їх створення."
      staff: "APP_INITIALIZER — це synchronization point в bootstrap pipeline. В enterprise-додатках це місце для: auth token refresh, feature flags loading, config fetching, A/B test setup. Архітектурне рішення: що повинно блокувати bootstrap (auth — так), а що може завантажуватись lazy (feature flags — можливо). Для resilience: кожен initializer потребує error boundary та timeout. В SSR: initializer'и виконуються на сервері — network calls до external services збільшують TTFB. Стратегія: TransferState для передачі initializer результатів з сервера на клієнт без повторного fetch. При zoneless — initializer'и працюють так само, але change detection після них потребує explicit trigger."
    commonMistakes:
      - "Не обробляють помилки в initializer — додаток мовчки не стартує"
      - "Повертають void замість Promise — initializer не чекається"
    relatedQuestions: ["b1t1q1"]
  - id: "b1t1q4"
    level: "staff"
    question: "Як би ви спроєктували bootstrap процес для micro-frontend Angular додатку?"
    referenceAnswers:
      junior: "Micro-frontends — це коли декілька Angular додатків працюють на одній сторінці."
      mid: "Кожен micro-frontend має свій bootstrapApplication з окремим root element. Потрібно уникати конфліктів в CSS і global state. Module Federation дозволяє шарити залежності."
      senior: "Кожен MFE bootstrap створює окремий Zone instance і DI tree. Shared dependencies через Module Federation externals (Angular, RxJS). Комунікація: Custom Events або shared observable service через window. Routing: shell app керує top-level routes, MFE реєструють child routes. Проблеми: Zone.js конфлікти (кілька Zone.js instances), CSS isolation (Shadow DOM або naming convention), версійність Angular між MFEs."
      staff: "Bootstrap architecture для MFE: 1) Shell app — мінімальний bootstrap з router та shared services container. 2) MFE loader — dynamic import з Module Federation, error boundary per MFE. 3) Shared zone — один Zone.js для всіх (налаштування Module Federation shared з singleton: true). 4) Communication bus — typed event system, не window.postMessage (type safety, debugging). 5) Lifecycle management — MFE mount/unmount з cleanup (subscription management, DOM cleanup). 6) Version strategy — semver contract між shell та MFEs, runtime version check. 7) SSR considerations — MFEs rendered server-side потребують coordination. 8) Testing — integration tests з mock MFEs, contract testing для shared interfaces. Архітектурне рішення: zoneless MFEs з signal-based reactivity спрощують isolation та усувають Zone.js конфлікти."
    commonMistakes:
      - "Шарять Zone.js неправильно — кілька instances ламають change detection"
      - "Не думають про cleanup при unmount MFE"
      - "Ігнорують versioning між shell і MFEs"
    relatedQuestions: ["b1t1q3"]
---

## Core Concept

**English definition:** Bootstrapping is the process of initializing an Angular application — creating the root injector, instantiating the root component, and triggering the first rendering cycle.

**Пояснення:** Bootstrap — це "запуск двигуна" Angular додатку. Коли браузер завантажує JavaScript bundle, виконується `bootstrapApplication()` (або legacy `platformBrowserDynamic().bootstrapModule()`), який створює DI контейнер, ініціалізує root component і вставляє його в DOM.

**Яку проблему вирішує:** Без bootstrap процесу Angular не знає який component рендерити, які services доступні, як обробляти async операції. Bootstrap — це єдина точка входу що з'єднує compiled components, DI providers, і platform-specific API (DOM, Server, WebWorker).

**Як працює під капотом:**

1. `main.ts` викликає `bootstrapApplication(AppComponent, appConfig)`
2. Створюється `PlatformRef` (якщо ще не існує) — абстракція над runtime (browser, server)
3. Створюється `EnvironmentInjector` з providers з appConfig
4. Виконуються всі `APP_INITIALIZER` providers (паралельно, через `Promise.all`)
5. Створюється `ApplicationRef` — центральний об'єкт Angular runtime
6. Root component створюється та вставляється в DOM (selector `<app-root>`)
7. Запускається перший change detection cycle

```typescript
// main.ts — Angular 21 standalone bootstrap
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig)
  .catch(err => console.error('Bootstrap failed:', err));
```

**Trade-offs та обмеження:**

- APP_INITIALIZER блокує рендеринг — занадто важкі операції збільшують час до First Contentful Paint
- Кожен bootstrapApplication створює окремий DI tree — не підходить для shared state між micro-frontends без додаткових механізмів
- Zone.js за замовчуванням патчить ВСІ async APIs — overhead для простих додатків

**Версійність:**
- Angular 2-13: `platformBrowserDynamic().bootstrapModule(AppModule)` — єдиний спосіб
- Angular 14: з'явились standalone components (developer preview)
- Angular 15: `bootstrapApplication()` став stable
- Angular 17+: standalone-first, NgModule bootstrap не рекомендується
- Angular 21: `provideBrowserGlobalErrorListeners()` додано для кращого error handling

## Deep Details

### Edge Cases

- **APP_INITIALIZER без Promise:** Якщо функція повертає `void` — Angular не чекає завершення. Це частий баг коли забувають `return` перед async операцією.
- **Circular dependency в providers:** Якщо provider A залежить від B, а B від A — bootstrap впаде з `NullInjectorError`. В standalone підході це менш імовірно через tree-shakable providers.
- **Multiple bootstraps:** Можна викликати `bootstrapApplication` декілька разів з різними root components — кожен створює окремий Angular "island". Використовується в micro-frontends та поступовій міграції з AngularJS.

### Junior vs Senior Understanding

**Junior** знає: "є `main.ts`, викликається `bootstrapApplication`, рендериться `AppComponent`."

**Senior** розуміє: Bootstrap — це orchestration phase. Порядок має значення: providers реєструються → initializers виконуються → component створюється. Senior знає що можна маніпулювати bootstrap для:
- Conditional providers (feature flags): `provideHttpClient(withInterceptors([...]))` замість static registration
- Multiple platforms: один код, різний bootstrap для browser/server/testing
- Error recovery: wrap bootstrap в try/catch з fallback UI
- Performance: `provideExperimentalZonelessChangeDetection()` для усунення Zone.js overhead

```typescript
// Conditional providers based on environment
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      ...(environment.production ? [withFetch()] : [])
    ),
    provideAnimationsAsync(),
  ],
};
```

### Deprecation & Migration Path

- **Deprecated:** `platformBrowserDynamic().bootstrapModule()` — не видалений, але не рекомендований
- **Migration command:** `ng generate @angular/core:standalone` — автоматично мігрує NgModule-based app до standalone
- **Крок за кроком:**
  1. Мігрувати leaf components до standalone
  2. Мігрувати shared modules
  3. Мігрувати feature modules до route-level providers
  4. Замінити AppModule на `bootstrapApplication` з `appConfig`
  5. Видалити порожні NgModule файли

### Connections to Other Concepts

- **Dependency Injection:** Bootstrap створює root injector. Всі `providedIn: 'root'` services живуть тут.
- **NgModules:** Legacy bootstrap mechanism. Standalone замінює module-based підхід.
- **Change Detection:** Перший CD cycle запускається після bootstrap. Zone.js налаштовується тут.
- **Router:** `provideRouter()` реєструється в bootstrap providers.

## Examples

### Basic Usage

```typescript
// app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(),
    provideAnimationsAsync(),
  ],
};
```

### Production Scenario

```typescript
// app.config.ts з APP_INITIALIZER для завантаження конфігурації
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { ConfigService } from './shared/services/config.service';

function initializeApp(configService: ConfigService) {
  return () => Promise.race([
    configService.loadConfig(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Config loading timeout')), 10000)
    ),
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (cs: ConfigService) => initializeApp(cs),
      deps: [ConfigService],
      multi: true,
    },
    // ... other providers
  ],
};
```

### Anti-Example

```typescript
// ❌ WRONG: APP_INITIALIZER без return — не чекає завершення
{
  provide: APP_INITIALIZER,
  useFactory: (authService: AuthService) => () => {
    authService.refreshToken(); // Забули return!
    // Angular не знає що це async — bootstrap продовжиться без token
  },
  deps: [AuthService],
  multi: true,
}

// ✅ CORRECT: повертаємо Promise
{
  provide: APP_INITIALIZER,
  useFactory: (authService: AuthService) => () => {
    return authService.refreshToken(); // return Promise
  },
  deps: [AuthService],
  multi: true,
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Heavy synchronous code в APP_INITIALIZER | Блокує main thread, збільшує TTI | Використовуйте async operations з timeout |
| Не обробляти помилки bootstrap | Додаток мовчки не працює, білий екран | `.catch()` в main.ts з fallback UI |
| Реєстрація всіх providers в root | Великий initial bundle, повільний startup | Lazy providers через route-level providedIn |
| Використання bootstrapModule для нових проєктів | Legacy overhead, гірший tree-shaking | bootstrapApplication з standalone |
| Декілька Zone.js instances в micro-frontends | Конфлікти в change detection, memory leaks | Shared Zone через Module Federation singleton |

## Interview Block

### [L1 — Warm-up] Як Angular-додаток стартує? Що відбувається при виклику bootstrapApplication?
**Signal being tested:** Чи розуміє кандидат lifecycle від main.ts до першого рендеру, чи просто "воно якось працює"
**What the interviewer expects:** Згадка про: root component, providers/DI, DOM insertion. Bonus: APP_INITIALIZER, Zone.js
**How to probe deeper:** "А що станеться, якщо APP_INITIALIZER поверне Promise що ніколи не resolve'ається?"
**Reference answer:** bootstrapApplication створює DI контейнер з providers, виконує APP_INITIALIZER'и, потім створює root component та рендерить його в DOM element що відповідає selector'у. Zone.js патчить async API для автоматичного change detection.
**Common mistakes:** Плутають з AngularJS bootstrap; не знають про APP_INITIALIZER; вважають що компонент "просто з'являється"

### [L2 — Mid] Яка різниця між bootstrapModule і bootstrapApplication? Коли використовувати кожен?
**Signal being tested:** Чи розуміє кандидат еволюцію Angular і може обґрунтувати вибір підходу
**What the interviewer expects:** Знання обох підходів, розуміння чому standalone рекомендований, DI різниця
**How to probe deeper:** "Якщо у вас legacy проєкт на NgModules — як би ви планували міграцію?"
**Reference answer:** bootstrapModule працює з NgModule, створює module injector. bootstrapApplication працює зі standalone components, створює environment injector — менше boilerplate, кращий tree-shaking. Standalone рекомендований з v17+. Міграція: `ng generate @angular/core:standalone`.
**Common mistakes:** Вважають bootstrapModule deprecated (він ні); не знають про migration schematic

### [L3 — Senior] Як працює APP_INITIALIZER? Що станеться якщо initializer кине помилку або зависне?
**Signal being tested:** Чи може кандидат проєктувати reliable bootstrap pipeline з error handling
**What the interviewer expects:** Promise.all поведінка, timeout стратегія, error boundary, SSR implications
**How to probe deeper:** "Як би ви реалізували graceful degradation якщо config endpoint недоступний?"
**Reference answer:** APP_INITIALIZER — multi-provider. Функції викликаються паралельно. Promise rejection зупиняє bootstrap. Немає built-in timeout — потрібен Promise.race. В SSR initializers збільшують TTFB. Для resilience: timeout + fallback config + error reporting.
**Common mistakes:** Не знають про відсутність timeout; забувають return Promise; не думають про SSR impact

### [L4 — Staff/Principal] Як би ви спроєктували bootstrap процес для micro-frontend Angular додатку?
**Signal being tested:** System-level архітектурне мислення — isolation, communication, lifecycle management
**What the interviewer expects:** Shared Zone strategy, DI isolation, communication bus design, version management, cleanup
**How to probe deeper:** "Як вирішити проблему різних версій Angular між shell і MFE?"
**Reference answer:** Shell з мінімальним bootstrap + MFE loader через Module Federation. Shared Zone.js (singleton), typed event bus для communication. Кожен MFE — окремий bootstrapApplication з cleanup на unmount. Version contract через semver. Zoneless MFEs з signals спрощують isolation.
**Common mistakes:** Не думають про Zone.js конфлікти; ігнорують cleanup; шарять state через window без type safety

## Summary

### Key Points
- `bootstrapApplication()` — сучасний спосіб запуску Angular (standalone-first з v17+)
- Bootstrap створює DI tree → виконує APP_INITIALIZER → рендерить root component
- APP_INITIALIZER блокує рендеринг — потребує timeout і error handling
- `platformBrowserDynamic().bootstrapModule()` — legacy, не deprecated але не рекомендований
- Zone.js налаштовується при bootstrap — zoneless альтернатива доступна
- Кожен `bootstrapApplication` створює ізольований DI tree і Zone
- Migration path: `ng generate @angular/core:standalone`

### Elevator Pitch (2 minutes)
"Bootstrap в Angular — це процес ініціалізації додатку. Сучасний підхід використовує `bootstrapApplication()` зі standalone component. При виклику створюється DI контейнер з providers, виконуються APP_INITIALIZER'и для pre-loading даних, і тоді рендериться root component. Важливо розуміти що initializer'и блокують рендеринг — потрібен timeout та error handling. Для micro-frontends кожен bootstrap створює ізольоване середовище, що потребує careful architecture для shared state та Zone.js management."
