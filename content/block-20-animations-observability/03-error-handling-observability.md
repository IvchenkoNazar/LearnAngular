---
title: "Global Error Handling & Observability"
block: 20
topic: 3
slug: "error-handling-observability"
difficulty: 4
sinceVersion: "2"
tags: ["ErrorHandler", "global error handling", "Sentry", "error boundaries", "unhandled rejections", "monitoring"]
relatedTopics: ["logging-monitoring", "angular-animations", "animation-builder"]
interviewQuestions:
  - id: "b20t3q1"
    level: "junior"
    question: "Як реалізувати кастомний ErrorHandler в Angular? Що робить дефолтний ErrorHandler?"
    referenceAnswers:
      junior: "ErrorHandler — це Angular service для обробки глобальних помилок. Дефолтний виводить помилки в console.error. Кастомний реалізує interface ErrorHandler з методом handleError()."
      mid: "Дефолтний `ErrorHandler.handleError()` — `console.error(error)`. Кастомний: `@Injectable() class CustomErrorHandler implements ErrorHandler { handleError(error: any): void { /* logic */ } }`. Реєструється: `{ provide: ErrorHandler, useClass: CustomErrorHandler }` в appConfig providers. handleError() викликається при: unhandled exceptions в Angular CD cycle, errors в component lifecycle hooks, errors в Observables якщо немає error handler в subscribe."
      senior: "Angular ErrorHandler перехоплює errors що propagate через Zone.js. Механізм: Zone.js monkey-patches async APIs і intercepts unhandled errors через `zone.onError` hook. ErrorHandler.handleError() викликається в Angular zone (або NgZone.run() context). Важливо: handleError() НЕ перехоплює: 1) Promise rejections що не пов'язані з Angular zone, 2) Web Worker errors, 3) errors в non-Angular event handlers (vanilla JS). Для Promise rejections: `window.addEventListener('unhandledrejection', ...)` окремо. Для ErrorHandler: НЕ re-throw error — це створює infinite loop (ErrorHandler обробляє свій власний error). Якщо потрібно re-throw — `throw error` тільки в catch block, не в handleError."
      staff: "ErrorHandler architecture для enterprise: 1) Centralized error enrichment — userID, sessionID, environment, component context. 2) Error categorization — network errors (offline?), auth errors (redirect to login), validation errors (show to user), unexpected errors (report to Sentry). 3) Error boundaries pattern (Angular не має React-like boundaries): try-catch в lifecycle hooks + fallback UI через ViewContainerRef. 4) Zone.js error propagation: errors в setTimeout/setInterval/Promise всередині zone → ErrorHandler. 5) Graceful degradation strategy: деякі errors — try again, деякі — show error state, деякі — force reload. 6) Error deduplication: Sentry SDK робить це автоматично, custom handlers потребують fingerprinting. 7) User notification: toast/snackbar для recoverable errors, full page error state для critical. Design decision: ErrorHandler injectable service не має доступу до Router напряму (circular dependency risk) — inject Router через `inject()` з lazy initialization або через `Injector.get(Router)` on demand."
    commonMistakes:
      - "Re-throw error в handleError() — infinite error loop"
      - "Inject Router в ErrorHandler constructor — може спричинити circular dependency"
    relatedQuestions: ["b20t3q2", "b20t3q3"]
  - id: "b20t3q2"
    level: "mid"
    question: "Як Zone.js впливає на error propagation в Angular? Що відбувається з unhandled Promise rejections?"
    referenceAnswers:
      junior: "Zone.js відстежує async операції в Angular. Помилки в промісах без catch потрапляють в ErrorHandler через Zone.js."
      mid: "Zone.js monkey-patches: Promise, setTimeout, setInterval, XMLHttpRequest, fetch. Коли помилка виникає в patched async context — Zone.js перехоплює і propagates до поточного zone's error handler. В Angular: NgZone це wrapper над Zone.js, `zone.onError` → `NgZone.onError` → `ErrorHandler.handleError()`. Unhandled Promise rejection в NgZone context → ErrorHandler. Promise поза zone (наприклад `zone.runOutsideAngular(async () => {throw err})`) → NOT captured by ErrorHandler."
      senior: "Zone.js error propagation деталі: 1) `zone.onError` і `zone.onHandleError` hooks. `onHandleError` дозволяє custom error handling per zone. 2) Якщо Promise rejection відбувається поза Angular zone (runOutsideAngular, web workers) — Angular ErrorHandler не бачить. 3) window.addEventListener('unhandledrejection') — незалежний від Zone.js, ловить всі unhandled rejections. 4) Проблема подвійного перехоплення: якщо Zone.js і window.unhandledrejection обидва active — один error може бути reported двічі. 5) RxJS і ErrorHandler: Observable.subscribe без error handler → RxJS re-throws error → якщо в zone — ErrorHandler catches. subscribe з error handler — ErrorHandler не бачить. 6) Zoneless Angular (v18+): без Zone.js — нема automatic error forwarding. ErrorHandler потрібно manual trigger або RxJS catchError pipeline."
      staff: "Zone.js error propagation — складна тема з implications для monitoring. Architectural concerns: 1) Error deduplication: Zone.js і window.unhandledrejection можуть duplicate — Sentry SDK handles це, custom handlers потребують dedup logic. 2) async/await і zone: `async function` в Angular zone → await resumption → в zone. Але якщо `await Promise.resolve()` прив'язується до non-angular zone — error може leak. 3) Zoneless migration: провайдери `provideExperimentalZonelessChangeDetection()` або `provideZonelessChangeDetection()` (v18+) — ErrorHandler ще exists, але Zone.js propagation відсутня. All async errors потребують explicit error handling. 4) Monitoring impact: в zoneless apps — більша відповідальність на developer для proper error handling у кожному async context. RxJS `catchError` і try/catch в async functions стають критичними. 5) Sentry SDK: Angular specific `@sentry/angular` враховує Zone.js context для better stack traces і breadcrumbs. При міграції на zoneless — перевірити Sentry compatibility."
    commonMistakes:
      - "Вважають що ErrorHandler ловить ВСІ async errors — ні, тільки ті що в Angular zone"
      - "Додають window.unhandledrejection і ErrorHandler без dedup — одна помилка reported двічі"
    relatedQuestions: ["b20t3q1", "b20t3q3"]
  - id: "b20t3q3"
    level: "senior"
    question: "Як інтегрувати Sentry в Angular додаток? Що таке TraceService і як він допомагає?"
    referenceAnswers:
      junior: "Sentry — це error monitoring platform. В Angular інтегрується через @sentry/angular пакет що надає ErrorHandler і інтеграцію з Router."
      mid: "Sentry Angular SDK: `@sentry/angular`. Ініціалізація в main.ts: `Sentry.init({ dsn, environment, release })` — ПЕРЕД bootstrapApplication. Providers: `{ provide: ErrorHandler, useValue: Sentry.createErrorHandler() }`, `{ provide: TraceService, deps: [Router] }`, `{ provide: APP_INITIALIZER, useFactory: () => () => inject(TraceService), multi: true }`. TraceService — інтегрується з Angular Router для performance tracing (route transitions як Sentry transactions)."
      senior: "Sentry Angular інтеграція деталі: 1) `Sentry.init()` має бути синхронно перед будь-яким Angular code — захоплює ранні errors під час bootstrap. 2) `createErrorHandler({ showDialog: true, dialogOptions: { ... } })` — optional user feedback dialog. 3) TraceService: підписується на Router events (NavigationStart → start transaction, NavigationEnd → finish), component lifecycle tracing через `SentryTrace` directive. 4) User context: `Sentry.setUser({ id, email })` після authentication. 5) Error enrichment: `Sentry.withScope(scope => { scope.setTag('module', 'checkout'); Sentry.captureException(error); })`. 6) Sourcemaps: `@sentry/webpack-plugin` або `@sentry/angular-ivy` автоматично uploadings sourcemaps для readable stack traces. 7) Angular ErrorHandler інтеграція: Sentry.createErrorHandler() повертає Angular ErrorHandler implementation що calls Sentry.captureException()."
      staff: "Sentry enterprise configuration: 1) DSN per environment (dev/staging/prod через environment.ts). 2) Sample rate: `tracesSampleRate: 0.1` для production (10% транзакцій) — коштує per event. 3) Error filtering: `beforeSend(event, hint) => null` для known errors що не потребують report (network offline errors, user-cancelled requests). 4) Release tracking: `release: environment.version` — correlate errors з deployment. 5) Source maps: CI uploads source maps, prod bundle minified — Sentry unminifies stack traces. 6) Alerts: Sentry issue alerts per route, per error type, spike detection. 7) Angular-specific: component stack — Sentry captures Angular component tree in error context (v18+). 8) Privacy: filter PII before send — `beforeSend: removeUserData(event)`. 9) Performance monitoring: Web Vitals integration — LCP, CLS, INP tracking в Sentry performance dashboard. 10) Integration з Angular Router guards: errors in guards properly attributed. Design decision: Sentry.init() options — structured logging, breadcrumbs (automatic HTTP breadcrumbs через Angular HttpClient interceptor)."
    commonMistakes:
      - "Sentry.init() після bootstrapApplication — ранні bootstrap errors не captured"
      - "Не фільтрують expected errors (401 Unauthorized, network offline) — noise в dashboard"
    relatedQuestions: ["b20t3q2", "b20t3q4"]
  - id: "b20t3q4"
    level: "senior"
    question: "Як реалізувати error boundary pattern в Angular? Angular не має React-like error boundaries — яка альтернатива?"
    referenceAnswers:
      junior: "Error boundaries в React показують fallback UI при помилці в дочірньому компоненті. В Angular подібного механізму немає, але можна перехоплювати помилки в компонентах."
      mid: "Angular ErrorHandler — глобальний, не per-component. Для local error boundaries: try-catch в lifecycle hooks (ngOnInit, ngAfterViewInit) + `isError` flag + fallback template через @if. Або ViewContainerRef з dynamic component creation — при помилці swap components. CDK Portal — для overlay-based error states."
      senior: "Angular error boundary alternatives: 1) Component-level ErrorHandler: override ErrorHandler в component providers — scoped до component subtree. `@Component({ providers: [{ provide: ErrorHandler, useClass: ComponentErrorHandler }] })` — але ErrorHandler в DI tree: найближчий виграє. 2) OnPush + catch in template: `{{ safePipe(data) | async }}` — safeAsync pipe що catches errors і returns fallback. 3) Dynamic component strategy: `try { loadComponent() } catch { loadFallback() }` в ngOnInit з ViewContainerRef. 4) Structural directive ErrorBoundary: `*appErrorBoundary` що wraps ng-content в try-catch і shows ng-template on error. Limitations порівняно з React: Angular не перехоплює errors в template expressions (expression evaluation errors) через boundary — вони йдуть в global ErrorHandler. Тільки errors в lifecycle hooks та explicit code можна catch per-component."
      staff: "Error boundary design для Angular design system: 1) ErrorBoundaryDirective: `@Directive({ selector: '[appErrorBoundary]' })` що exposes `error$: Observable<Error>` для consumer. 2) Component isolation: кожен major section (dashboard widget, data grid) wrapped in error boundary — один failing widget не crashює всю сторінку. 3) Retry mechanism: error boundary надає `retry()` action — re-instantiate component. 4) Error reporting: ErrorBoundaryDirective автоматично reports до ErrorHandler при catch — local recovery + global tracking. 5) Testing: кожен ErrorBoundary тестується з mock component що throws — verify fallback UI renders. 6) Graceful degradation levels: Widget fails → show widget error state (users can continue working). Section fails → show section reload. Page fails → global error page. Application fails → static error page. 7) Telemetry: error boundaries fire events (error boundary hit counter) → metric для identifying flaky components."
    commonMistakes:
      - "Вважають що component-level ErrorHandler в providers надійно ізолює errors — ErrorHandler ізоляція в Angular не повна (template expression errors обходять)"
      - "Не implementують retry логіку — users застрягають в error state"
    relatedQuestions: ["b20t3q3", "b20t3q5"]
  - id: "b20t3q5"
    level: "staff"
    question: "Як організувати error enrichment і structured error context в Angular додатку перед відправкою в monitoring?"
    referenceAnswers:
      junior: "Error enrichment — це додавання контексту до помилок (user ID, page URL) для кращого debugging."
      mid: "В кастомному ErrorHandler: отримати user info з AuthService, поточний URL з Router, і додати до Sentry scope: `Sentry.setUser()`, `Sentry.setTag()`, `Sentry.setExtra()`. Або в beforeSend hook Sentry."
      senior: "Structured error enrichment pipeline: 1) ErrorHandler.handleError() receives Error object. 2) Classify error: `error instanceof HttpErrorResponse` → network, `error instanceof TypeError` → runtime, custom AppError subclasses → business logic. 3) Enrich: `this.authStore.user()` (signal) або `inject(AuthService).currentUser`, `this.router.url`, `environment.version`. 4) Component context: Angular DevMode `error.ngDebugContext` — component stack в dev mode (не в prod). 5) Correlation ID: якщо HTTP request failed — extract request ID з error context для cross-service tracing. 6) Severity mapping: CRITICAL (payment failure) → PagerDuty alert, ERROR (JS exception) → Sentry, WARN (deprecated API) → log only. 7) beforeSend: Sentry hook для final filtering і PII scrubbing — `beforeSend: (event) => { delete event.user?.email; return event; }`."
      staff: "Enterprise error observability system: 1) Error taxonomy: Domain errors (business logic, expected), System errors (infrastructure, unexpected), User errors (input validation). 2) Error contracts: typed error classes `class PaymentError extends AppError { constructor(public paymentId: string, public reason: PaymentFailReason) }` — structured data, not string messages. 3) Error serialization: toJSON() для structured logging, `toSentryEvent()` для monitoring enrichment. 4) Component stack трacing: в prod немає ngDebugContext — custom TraceService що tracks active component tree (lightweight, performance-aware). 5) Error budget: SLO-based alerting — якщо error rate перевищує threshold → incident trigger. 6) Cross-service correlation: distributed tracing (W3C TraceContext, OpenTelemetry) — correlate frontend error з backend 500. HTTP interceptor передає trace-id → Sentry links frontend error з backend trace. 7) Error anonymization: GDPR вимагає не зберігати PII в logs/monitoring — automated PII detection в beforeSend (email regex, phone number patterns, credit card numbers). 8) Incident management: Sentry → PagerDuty integration, on-call rotation, runbooks per error type."
    commonMistakes:
      - "Логують raw Error object без enrichment — debugging без context неможливий"
      - "Зберігають PII (email, tokens) в error logs — GDPR violation"
    relatedQuestions: ["b20t3q4", "b20t4q1"]
---

## Core Concept

**English definition:** Global error handling in Angular centers on the `ErrorHandler` interface — a service that intercepts all unhandled exceptions propagating through Angular's zone-based error pipeline, enabling centralized error reporting, user notification, and graceful degradation, typically integrated with monitoring platforms like Sentry or Datadog.

**Пояснення:** В Angular додатку помилки можуть виникати в компонентах, сервісах, RxJS pipelines, HTTP запитах, і async операціях. Без centralized handling — кожна необроблена помилка видима тільки в console.error і користувач бачить broken UI без feedback. `ErrorHandler` + monitoring integration дозволяє: 1) перехопити всі errors, 2) збагатити контекстом (user, route, version), 3) відправити в Sentry/Datadog, 4) показати user-friendly error state.

**Яку проблему вирішує:**
- Без ErrorHandler: помилки тільки в console, production bugs невидимі
- Без error enrichment: stack trace без контексту — важко debug
- Без error boundaries: один компонент що падає crashує всю сторінку
- Без proper unhandledrejection: Promise errors повністю невидимі

**Як працює під капотом:**

```
Error thrown in Angular context
  → Zone.js catches via zone.onHandleError
  → NgZone._inner.onHandleError
  → NgZone.onError.emit(error)
  → ApplicationRef._zone.onError → ErrorHandler.handleError(error)
  → Custom handler: enrichment + Sentry.captureException()

Unhandled Promise rejection (outside Angular zone):
  → window.addEventListener('unhandledrejection', ...)
  → Must manually call ErrorHandler or Sentry
```

**Trade-offs та обмеження:**

- ErrorHandler перехоплює тільки errors в Angular zone — `runOutsideAngular()` errors випадають
- handleError() не повинен throw — infinite loop
- Template expression errors ({{ invalidExpression }}) — йдуть через ErrorHandler, але без component context в prod
- Error в ErrorHandler's handleError() itself — caught by global window.onerror, не рекурсивно

**Версійність:**
- `ErrorHandler` interface з Angular 2 (раніше `ExceptionHandler` у rc releases)
- `@sentry/angular` v7+ підтримує standalone, v8+ підтримує Angular 17+
- Zone.js optional з Angular 18 (zoneless) — змінює error propagation model
- Angular 17+ `afterRender`/`afterNextRender` errors — через новий render pipeline

## Deep Details

### Edge Cases

**Circular dependency в ErrorHandler:** Inject `Router` або `HttpClient` в ErrorHandler constructor → circular dependency. Solution: `inject(Injector)` + lazy `injector.get(Router)` в handleError().

**ErrorHandler і async/await:** `async handleError(error): Promise<void>` — підтримується, але Angular не чекає completion. Fire-and-forget semantics. Якщо потрібно await (наприклад, show dialog) — use `Promise.resolve().then(...)` або defer до microtask.

**Template error context:** В dev mode: `error.ngDebugContext?.component` дає component instance. В production: `ɵgetDebugNode` недоступний. Production: custom TraceService для component stack.

**Multiple ErrorHandlers:** В DI tree — кожен component subtree може мати свій `{ provide: ErrorHandler, useClass: ... }`. Але Angular route чи lazy-loaded module ErrorHandler не ізолює errors від parent injector. Scoping обмежений.

**RxJS catchError vs ErrorHandler:** Observable `throwError` + `subscribe(next, error, complete)` — error handler в subscribe catches, ErrorHandler не бачить. Якщо `subscribe` без error handler або `.subscribe(next)` pattern — error propagates до ErrorHandler.

### Junior vs Senior Understanding

**Junior знає:** implements ErrorHandler, handleError method signature, provider registration.

**Senior розуміє:**

1. **Zone.js error pipeline:** Zone `_inner` vs `_outer` zone contexts. `runOutsideAngular()` — помилки не йдуть в ErrorHandler. `run()` — повертає в zone.

2. **Error classification:** `error instanceof Error` (JS error), `instanceof HttpErrorResponse` (HTTP), `instanceof PromiseRejectionEvent` (unhandled promise), string errors (legacy throw 'message').

3. **Error deduplication:** Одна помилка може trigger і ErrorHandler (via zone) і window.unhandledrejection. Dedup by error message + stack hash.

4. **Sentry initialization timing:** `Sentry.init()` synchronously before bootstrap — якщо bootstrap fails, Sentry ще captures. Якщо Sentry.init() в APP_INITIALIZER — bootstrap errors не captured.

5. **Error boundaries vs ErrorHandler:** ErrorHandler — global catch-all. Error boundaries — local fallback UI. Обидва потрібні: boundaries для graceful UI, ErrorHandler для monitoring.

### Deprecation & Migration Path

- `ExceptionHandler` (Angular 2 RC) → `ErrorHandler` (Angular 2.0+) — replaced completely
- Class-based providers для ErrorHandler — все ще valid (не deprecable — interface-based)
- Zone.js error propagation: в zoneless Angular (v18+) — ErrorHandler ще підтримується, але errors потрібно явно forward: `inject(ErrorHandler).handleError(error)` в catch blocks
- `@sentry/angular-ivy` (v14-v16) → `@sentry/angular` v7+ для Angular 17+

### Connections to Other Concepts

- **Logging & Monitoring** (`logging-monitoring`) — ErrorHandler як entry point для structured logging
- **HTTP Interceptors** — catch HTTP errors та forward до ErrorHandler
- **Zone.js** — foundation для error propagation в non-zoneless apps
- **Dependency Injection** — ErrorHandler registration, hierarchical providers для error boundaries

## Examples

### Basic Usage

```typescript
// Кастомний ErrorHandler
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private injector = inject(Injector);

  handleError(error: unknown): void {
    // Normalize error
    const err = error instanceof Error ? error : new Error(String(error));

    // Don't re-throw — infinite loop

    // Lazy inject to avoid circular dependency
    const router = this.injector.get(Router, null);
    const url = router?.url ?? 'unknown';

    console.error(`[AppErrorHandler] Error on ${url}:`, err);

    // Send to monitoring
    // Sentry.captureException(err);
  }
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: AppErrorHandler },
    // Also catch unhandled promise rejections
  ]
};

// Catch unhandled Promise rejections outside Angular zone
// main.ts
window.addEventListener('unhandledrejection', (event) => {
  const injector = (window as any)['__angularInjector'];
  injector?.get(ErrorHandler)?.handleError(event.reason);
});
```

### Production Scenario

```typescript
// Enterprise ErrorHandler з Sentry integration
import * as Sentry from '@sentry/angular';

// main.ts — BEFORE bootstrapApplication
Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.name,
  release: environment.version,
  tracesSampleRate: environment.production ? 0.1 : 1.0,
  beforeSend(event, hint) {
    // Filter known non-errors
    const error = hint?.originalException;
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return null; // Don't report auth errors
    }
    // Scrub PII
    if (event.user) {
      delete event.user.email; // GDPR
    }
    return event;
  }
});

bootstrapApplication(AppComponent, appConfig);

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler({
      showDialog: false, // User feedback dialog
    })},
    // Sentry Router tracing
    { provide: TraceService, deps: [Router] },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => inject(TraceService), // Forces TraceService init
      multi: true
    },
  ]
};

// Rich error context with correlation
@Injectable()
export class RichErrorHandler implements ErrorHandler {
  private injector = inject(Injector);
  private authStore = inject(AuthStore); // Signal-based store

  handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));

    // Enrich with context
    const user = this.authStore.user();
    const router = this.injector.get(Router, null);

    Sentry.withScope(scope => {
      if (user) {
        scope.setUser({ id: user.id, username: user.name });
      }
      scope.setTag('route', router?.url ?? 'unknown');
      scope.setTag('app.version', environment.version);
      scope.setExtra('timestamp', new Date().toISOString());

      // Classify error
      if (err instanceof HttpErrorResponse) {
        scope.setTag('error.type', 'http');
        scope.setExtra('http.status', err.status);
        scope.setExtra('http.url', err.url);
      } else {
        scope.setTag('error.type', 'runtime');
      }

      Sentry.captureException(err);
    });

    // User notification for recoverable errors
    const snackBar = this.injector.get(MatSnackBar, null);
    if (err instanceof HttpErrorResponse && err.status >= 500) {
      snackBar?.open('Server error. Please try again.', 'Dismiss', {
        duration: 5000
      });
    }
  }
}
```

### Anti-Example

```typescript
// ❌ Re-throw в handleError — infinite loop
@Injectable()
export class BadErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    console.error(error);
    throw error; // ❌ Angular calls handleError again → infinite loop
  }
}

// ❌ Inject Router в constructor — circular dependency
@Injectable()
export class BadDepsErrorHandler implements ErrorHandler {
  constructor(private router: Router) {} // ❌ Can cause circular DI

  handleError(error: unknown): void {
    console.error(`Error on ${this.router.url}:`, error);
  }
}

// ❌ Sentry.init() після bootstrapApplication — bootstrap errors не captured
bootstrapApplication(AppComponent, appConfig); // ❌
Sentry.init({ dsn: '...' }); // Too late!

// ❌ Без beforesend фільтрації — PII в Sentry
Sentry.init({
  dsn: '...',
  // ❌ No beforeSend — user email/tokens можуть попасти в events
});

// ✅ Правильно:
// Sentry.init() синхронно перед bootstrap, з PII scrubbing
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `throw error` в `handleError()` | Angular catches the thrown error і викликає handleError() знову → infinite loop | Просто log/report, не re-throw |
| Inject `Router` в ErrorHandler constructor | Circular dependency risk — Router залежить від services що можуть залежати від ErrorHandler | `inject(Injector)` + lazy `injector.get(Router)` в handleError() |
| `Sentry.init()` після `bootstrapApplication()` | Bootstrap errors не captured — найранніші помилки пропускаються | `Sentry.init()` синхронно в main.ts, ПЕРЕД bootstrap |
| Логування PII (email, tokens) в error reports | GDPR violation, security risk | `beforeSend` hook для PII scrubbing, log only userId не email |
| Відсутній handler для `window.unhandledrejection` | Promise errors поза Angular zone повністю невидимі | `window.addEventListener('unhandledrejection')` + forward до ErrorHandler |

## Interview Block

### [L1 — Warm-up] Як реалізувати кастомний ErrorHandler в Angular?

**Signal being tested:** Знання ErrorHandler API і критичне правило — не re-throw.

**What the interviewer expects:** `implements ErrorHandler`, `handleError(error)`, provider registration, і обов'язково — не re-throw.

**How to probe deeper:** "Що трапиться якщо зробити `throw error` в handleError()?" — Angular catches і знову викликає handleError() → infinite loop → stack overflow.

**Reference answer:** `@Injectable() class CustomErrorHandler implements ErrorHandler { handleError(error) { /* log, report, show toast */ } }`. Provider: `{ provide: ErrorHandler, useClass: CustomErrorHandler }`. Критично: не re-throw. Inject Router через `inject(Injector)` lazy — не в constructor (circular dependency risk).

**Common mistakes:** Re-throw. Router в constructor. Async handleError без awareness що Angular не чекає.

---

### [L2 — Mid] Як Zone.js впливає на error propagation? Що з unhandled Promise rejections?

**Signal being tested:** Розуміння Zone.js error pipeline, і що ErrorHandler — не universal catch-all.

**What the interviewer expects:** Zone.js monkey-patches async APIs, NgZone.onError → ErrorHandler. Але runOutsideAngular errors та window.unhandledrejection — окремо.

**How to probe deeper:** "Як переконатись що Promise errors поза Angular zone також captured?" — `window.addEventListener('unhandledrejection')` + forward до ErrorHandler або Sentry напряму.

**Reference answer:** Zone.js patching Promise/setTimeout → errors propagate через NgZone.onError → ErrorHandler. Але `runOutsideAngular()` = outside zone = ErrorHandler не бачить. Unhandled rejections: `window.addEventListener('unhandledrejection', e => handler.handleError(e.reason))`. В zoneless (v18+): автоматичний forwarding відсутній — explicit try/catch потрібен.

**Common mistakes:** Думають ErrorHandler ловить все. Не додають unhandledrejection handler.

---

### [L3 — Senior] Як інтегрувати Sentry в Angular додаток? Що таке TraceService?

**Signal being tested:** Практична Sentry конфігурація, розуміння timing (Sentry.init до bootstrap), і TraceService роль.

**What the interviewer expects:** Sentry.init() ПЕРЕД bootstrap, createErrorHandler(), TraceService для Router tracing, APP_INITIALIZER для initialization, beforeSend для filtering і PII.

**How to probe deeper:** "Чому важливо викликати Sentry.init() до bootstrapApplication?" — bootstrap errors (APP_INITIALIZER failures, provider errors) не captured якщо Sentry не ініціалізований.

**Reference answer:** main.ts: `Sentry.init({ dsn, environment, tracesSampleRate, beforeSend })` синхронно перед bootstrap. appConfig: `Sentry.createErrorHandler()` як ErrorHandler, `TraceService` provider + APP_INITIALIZER для init. TraceService: Router NavigationStart → Sentry transaction, NavigationEnd → finish. beforeSend: filter 401s, scrub PII.

**Common mistakes:** Sentry.init() після bootstrap. Не фільтрують expected errors. Не скрабують PII.

---

### [L4 — Staff/Principal] Як організувати error enrichment і structured error context перед відправкою в monitoring?

**Signal being tested:** Системний підхід до observability — typed errors, enrichment pipeline, correlation, privacy.

**What the interviewer expects:** Typed error classes, classification (HTTP/runtime/business), user context enrichment, correlation IDs, PII scrubbing, GDPR compliance.

**How to probe deeper:** "Як correlate frontend error з backend trace?" — HTTP interceptor передає trace-id в запитах, Sentry links frontend error з backend span через W3C TraceContext.

**Reference answer:** ErrorHandler: enrich з user (signal store), route (Router), version. Classify: HttpErrorResponse → http error, TypeError → runtime. `Sentry.withScope()` для per-error context. Typed error classes з `toSentryEvent()`. beforeSend: PII scrubbing (GDPR). Correlation: HTTP interceptor передає W3C traceparent header, Sentry links frontend + backend.

**Common mistakes:** Raw errors без context. PII в reports. String messages замість typed errors.

## Summary

### Key Points

- `ErrorHandler.handleError()` — ніколи не re-throw. Це викликає infinite loop.
- Zone.js forwards errors з NgZone до ErrorHandler. `runOutsideAngular()` errors — невидимі для ErrorHandler.
- `window.addEventListener('unhandledrejection')` для Promise errors поза Angular zone — обов'язковий.
- `Sentry.init()` синхронно ПЕРЕД `bootstrapApplication()` — інакше bootstrap errors не captured.
- TraceService: підписується на Router events і створює Sentry transactions для route transitions.
- Error enrichment: user context, route, version, correlation ID через `Sentry.withScope()`.
- `beforeSend` hook для: filtering expected errors (401, network offline) і PII scrubbing (GDPR).
- Zoneless Angular (v18+): explicit try/catch потрібен — Zone.js forwarding відсутній.

### Elevator Pitch (2 minutes)

Angular ErrorHandler — central hub для всіх unhandled exceptions. `implements ErrorHandler { handleError(error) }` + `{ provide: ErrorHandler, useClass: ... }`. Критично: ніколи не re-throw в handleError — infinite loop. Lazy inject через Injector для Router (circular dependency prevention).

Zone.js механізм: errors в NgZone → NgZone.onError → ErrorHandler. Але `runOutsideAngular()` і Promise rejections поза zone — невидимі. Додатково: `window.addEventListener('unhandledrejection')`.

Sentry: `Sentry.init()` синхронно до `bootstrapApplication()`. `createErrorHandler()` як ErrorHandler provider. TraceService + APP_INITIALIZER для Router tracing. `beforeSend`: фільтрувати expected errors (401), scrub PII (GDPR). Error enrichment: `Sentry.withScope()` → setUser, setTag, setExtra для context-rich error reports.
