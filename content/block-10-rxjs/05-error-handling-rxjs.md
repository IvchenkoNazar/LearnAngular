---
title: "Error Handling in RxJS"
block: 10
topic: 5
slug: "error-handling-rxjs"
difficulty: 4
sinceVersion: "6"
tags: ["catchError", "retry", "retryWhen", "throwError", "EMPTY", "error-handling", "resilience"]
relatedTopics: ["higher-order-operators", "reactive-patterns", "memory-leaks"]
interviewQuestions:
  - id: "b10t5q1"
    level: "junior"
    question: "Як обробити помилку в RxJS Observable? Що станеться з потоком після помилки?"
    referenceAnswers:
      junior: "Помилку можна обробити через catchError оператор або через другий аргумент subscribe(next, error). Після помилки Observable завершується і більше не emit значень."
      mid: "У RxJS помилка — це terminal notification: після error() Observable завершується (Observable Contract). Обробка: 1) catchError — перехоплює помилку і повертає новий Observable або throwError для re-throw. 2) subscribe error callback — останнє місце де помилка може бути оброблена. 3) retry/retryWhen — resubscribe при помилці. Важливо: catchError ВСЕРЕДИНІ higher-order operator (switchMap) зберігає зовнішній потік живим."
      senior: "Observable Contract: `next* (error | complete)?` — після error або complete не може бути next. catchError отримує помилку і повинен повернути Observable: of(fallback) для graceful degradation, EMPTY для тихого завершення, throwError(() => err) для re-throw. Розміщення catchError critical: 1) Всередині switchMap inner — зовнішній потік виживає. 2) Поза switchMap — зовнішній потік завершується. Для long-lived streams (NgRx Effects, polling) — завжди catchError всередині inner Observable. retry(N) — resubscribe N разів при помилці. У RxJS 7: retry({ count: N, delay: 1000, resetOnSuccess: true })."
      staff: "Error handling стратегія в reactive architecture: 1) Layer-based handling: inner Observable catchError для local recovery, outer для fallback, subscriber error callback для UI notification. 2) Typed errors: не raw Error, а discriminated union: `Observable<Result<T, ApiError>>`. 3) Global error handler: Angular ErrorHandler як last resort для uncaught. 4) NgRx Effects: catchError повертає failure action, не terminate effect. 5) Circuit breaker pattern: після N помилок за час T — відкрити circuit, не надсилати requests. 6) Error telemetry: tap({ error: err => logger.error(err) }) перед catchError. 7) Retry з exponential backoff для transient failures (network blips). 8) Non-retryable errors (401, 403, 404) vs retryable (5xx, network timeout) — різні стратегії."
    commonMistakes:
      - "catchError поза inner Observable в switchMap — outer stream terminates"
      - "Не знають що після error Observable повністю dead — не emit більше нічого"
      - "Забувають про NgRx Effects що 'вмирають' без catchError"
    relatedQuestions: ["b10t5q2", "b10t5q3"]
  - id: "b10t5q2"
    level: "mid"
    question: "Як реалізувати retry з exponential backoff у RxJS? Коли retry недоречний?"
    referenceAnswers:
      junior: "retry(3) перепідписується на Observable 3 рази при помилці. Exponential backoff можна реалізувати через retryWhen."
      mid: "retry(N) — простий retry N разів. Для exponential backoff: `retry({ count: 3, delay: (err, count) => timer(Math.pow(2, count) * 1000) })` у RxJS 7. Або retryWhen у старих версіях. Retry недоречний для: 4xx клієнтські помилки (400, 401, 403, 404) — вони не зникнуть від retry. Доречний для: 5xx, network timeouts, rate limiting (429 з Retry-After header)."
      senior: "Exponential backoff з jitter: `retry({ count: 3, delay: (err, count) => { if (err.status < 500) throw err; // don't retry client errors return timer(Math.pow(2, count) * 1000 + Math.random() * 100); // jitter prevents thundering herd } })`. Jitter важливий: якщо 1000 clients retry одночасно після backoff — thundering herd problem. Random jitter розподіляє навантаження. Retry з observable delay: `retryWhen(errors => errors.pipe(scan((attempt, err) => { if (attempt >= maxRetries || err.status === 401) throw err; return attempt + 1; }, 0), delayWhen(attempt => timer(Math.pow(2, attempt) * 1000))))`. У RxJS 7: `retry({ count, delay, resetOnSuccess })` — resetOnSuccess очищає retry count після успіху."
      staff: "Production retry strategy: 1) Error classification: transient (5xx, timeout, network) vs permanent (4xx, validation). 2) Circuit breaker integration: після X failures у Y seconds — open circuit, fail fast без retry. 3) Idempotency: retry safe лише для idempotent operations. POST без idempotency key — retry може duplicate. 4) Retry budget: global maximum retries per time window — уникнути cascade failures. 5) Retry-After header: 429 Too Many Requests — parse header, retry після вказаного часу. 6) Distributed retry: якщо retry відбувається за gateway/proxy — client і proxy можуть retry незалежно — exponential вибух запитів. 7) Observability: log retry attempts з context (attempt N, error type, delay) — critical для production debugging. 8) User feedback: після X retry — показати 'Service unavailable, please retry manually'."
    commonMistakes:
      - "retry() без умови — retries 4xx errors які ніколи не відновляться"
      - "Без jitter в backoff — thundering herd problem"
      - "Retry non-idempotent operations — дублювання side effects"
    relatedQuestions: ["b10t5q1", "b10t5q3"]
  - id: "b10t5q3"
    level: "senior"
    question: "Поясніть різницю між catchError, throwError і EMPTY. Коли що використовувати?"
    referenceAnswers:
      junior: "catchError перехоплює помилку. throwError кидає нову помилку. EMPTY — порожній Observable що одразу complete."
      mid: "catchError(handler) — оператор що перехоплює error notification і повертає новий Observable: `of(fallback)` для значення за замовчуванням, `EMPTY` для тихого завершення (complete без значень), `throwError(() => err)` для re-throw (з трансформацією або тією ж помилкою). throwError(() => new Error()) — Observable що одразу кидає помилку (factory function у RxJS 7). EMPTY — Observable що одразу complete без значень."
      senior: "Семантика: `catchError(err => of(fallback))` — graceful degradation, stream produces fallback і completes. `catchError(err => EMPTY)` — silent completion, споживач може обробити complete event. `catchError(err => throwError(() => new WrappedError(err)))` — error transformation, re-propagate до наступного catchError або subscriber. EMPTY vs NEVER: EMPTY одразу complete, NEVER ніколи не emit і не complete — для заглушення subscriptions де потрібно зберегти активний pipe. throwError(() => err) — factory function важлива: ліниве створення error об'єкту, різні instances для різних subscribers. Розміщення в pipe: catchError в кінці pipe обробляє всі помилки з попередніх operators. Кілька catchError у pipe: перший що обробить (не throw) — зупиняє propagation."
      staff: "Error handling taxonomy: 1) Recovery: `catchError(() => of(defaultValue))` — продовжити з fallback. 2) Retry: `catchError(err => shouldRetry(err) ? source$.pipe(retry(3)) : throwError(() => err))` — умовний retry. 3) Transform: `catchError(err => throwError(() => new UserFriendlyError(err)))` — transform до presentable error. 4) Silence: `catchError(() => EMPTY)` — ignore, continue outer stream. 5) Circuit break: `catchError(err => { circuitBreaker.recordFailure(); throw err; })` — side effect before re-throw. 6) Result type pattern: `catchError(err => of({ success: false, error: err }))` — converts error to value, outer stream never errors. 7) Global error boundary: `catchError(err => { inject(ErrorHandler).handleError(err); return EMPTY; })`. 8) Observable lifecycle: після catchError що returns Observable, pipe continues — але source Observable is replaced by the returned Observable."
    commonMistakes:
      - "throwError(new Error()) замість throwError(() => new Error()) — eager evaluation"
      - "NEVER замість EMPTY коли потрібно complete stream"
      - "Кілька catchError і не розуміють що перший що не re-throws — зупиняє propagation"
    relatedQuestions: ["b10t5q1", "b10t5q4"]
  - id: "b10t5q4"
    level: "mid"
    question: "Як правильно обробляти HTTP помилки в Angular з RxJS? Де catchError — в сервісі чи в компоненті?"
    referenceAnswers:
      junior: "catchError можна ставити і в сервісі, і в компоненті — залежно від того де потрібна обробка."
      mid: "Найкращий підхід: HTTP interceptor для спільної обробки (4xx/5xx, retry, auth refresh). У сервісі: domain-specific error mapping — HttpErrorResponse → typed domain error. У компоненті: UI-specific handling — показати toast, redirect. Розмежування: interceptor = cross-cutting, сервіс = business logic errors, компонент = UI feedback."
      senior: "Layered error handling: 1) HTTP Interceptor: глобальний — retry transient errors (5xx), token refresh (401), log all errors. Повертає `catchError` що або handles або rethrows. 2) Service layer: `catchError(err => throwError(() => this.mapToApiError(err)))` — transforms HttpErrorResponse до typed ApiError. 3) Component layer: `error$ = this.service.data$.pipe(catchError(err => { this.handleError(err); return EMPTY; }))`. Але краще: service повертає `Observable<DataState>` де DataState = `{data, loading, error}` — компонент підписується без catchError, error є частина нормального state. NgRx approach: actions з failure type — error є explicit state в store, не exception."
      staff: "Enterprise HTTP error handling strategy: 1) Interceptor per concern: AuthInterceptor (401 refresh), RetryInterceptor (transient errors), LoggingInterceptor (telemetry), ErrorNormalizationInterceptor (transform to domain errors). 2) Problem Details (RFC 7807): стандартизований error response format — `{type, title, status, detail, instance}`. Backend API має дотримуватись. 3) Error correlation: кожен HTTP request має request-id header, error логує цей id — enables distributed tracing. 4) Offline detection: navigator.onLine + window online/offline events → specific error type. 5) Validation errors (422): field-level errors mapped до form control errors. 6) Rate limiting (429): parse Retry-After, показати countdown timer. 7) Circuit breaker в interceptor: після N failures до endpoint за час T — fail fast. 8) Error analytics: Sentry/Datadog custom event з user context, route, request params."
    commonMistakes:
      - "catchError тільки в компоненті — код дублюється, немає centralized handling"
      - "Не використовують interceptor для cross-cutting concerns (retry, auth refresh)"
      - "Показують raw HttpErrorResponse у UI — містить internal info, поганий UX"
    relatedQuestions: ["b10t5q3", "b10t5q5"]
  - id: "b10t5q5"
    level: "staff"
    question: "Як реалізувати circuit breaker pattern у Angular HTTP layer?"
    referenceAnswers:
      junior: "Circuit breaker — це патерн де після кількох помилок ми перестаємо надсилати запити деякий час."
      mid: "Circuit breaker має 3 стани: Closed (нормальна робота), Open (fail fast без запитів після X помилок), Half-Open (один test request для перевірки відновлення). В Angular — можна реалізувати через HTTP interceptor що відстежує failure rate і відхиляє запити в Open стані."
      senior: "Circuit breaker у HTTP interceptor: `class CircuitBreakerInterceptor { private failures = 0; private lastFailure = 0; private state: 'closed' | 'open' | 'half-open' = 'closed'; intercept(req, next) { if (this.state === 'open') { if (Date.now() - this.lastFailure > TIMEOUT) { this.state = 'half-open'; } else { return throwError(() => new CircuitOpenError()); } } return next.handle(req).pipe(tap({ error: () => this.recordFailure(), next: () => this.recordSuccess() })); } }`. Threshold: failures per minute. State transitions: Closed→Open при threshold, Open→HalfOpen після timeout, HalfOpen→Closed при success, HalfOpen→Open при failure."
      staff: "Production circuit breaker architecture: 1) Per-service granularity: різні circuits для різних backend endpoints — payments circuit відкритий не блокує user profile requests. 2) Bulkhead pattern паралельно: ізоляція failure domains — payments failures не cascade до інших services. 3) Metrics: Prometheus/Grafana для circuit state, failure rate, latency percentiles. 4) UI circuit: не тільки HTTP — якщо rendering компонент кидає exception кілька разів — ErrorBoundary-like mechanism. 5) Distributed circuit state: якщо кілька Angular apps (micro-frontends) — shared circuit state через BroadcastChannel або SharedWorker. 6) Circuit open UX: показати meaningful message 'Service temporarily unavailable', estimated recovery time (based on cooldown). Manual reset button для operators. 7) Testing circuit breaker: integration tests що simulate failures і verify circuit transitions, timing tests. 8) Partial degradation: circuit open для writes, но reads через cache — graceful degradation замість total failure."
    commonMistakes:
      - "Circuit breaker implementation без Half-Open стану — circuit ніколи не відновлюється автоматично"
      - "Один глобальний circuit для всіх endpoints — один service failure блокує весь app"
      - "Не логують circuit state changes — неможливо debug production issues"
    relatedQuestions: ["b10t5q2", "b10t5q4"]
---

## Core Concept

**English definition:** Error handling in RxJS is the set of strategies for intercepting, recovering from, transforming, and propagating error notifications within Observable pipelines. Unlike Promises, RxJS provides fine-grained control over error placement (inner vs outer stream), retry semantics, and fallback strategies.

**Пояснення:** В RxJS помилка — це перший клас подієвої системи: `error` notification поряд з `next` і `complete`. Observable Contract гарантує: `next* (error | complete)?` — після error або complete Observer не отримає більше next. Це означає що помилка "вбиває" Observable. Весь error handling будується навколо перехоплення цього момента і або відновлення (нові значення), або тихого завершення, або re-throw.

**Яку проблему вирішує:**
- **Resilience:** retry для transient failures, fallback для permanent
- **Stream lifecycle:** catchError всередині inner Observable зберігає outer stream живим
- **Error transformation:** HttpErrorResponse → typed domain error → user-friendly message
- **Observable death prevention:** особливо критично для long-lived streams (NgRx Effects, polling)

**Як працює під капотом:**

Observable notification channels:
```
next(value)    → вартий обробки
error(err)     → термінальний, Observable dead після цього
complete()     → термінальний, нормальне завершення

catchError(handler):
  - Intercepts error notification
  - Calls handler(err, caught$) where caught$ = source Observable (for retry)
  - Handler returns new Observable
  - If handler Observable errors too → propagates further
  - If handler returns EMPTY → complete notification instead of error
  - If returns of(value) → value emitted, then complete

retry(config):
  - Upon error: re-subscribes to source Observable
  - New subscription = fresh execution of source
  - retryWhen (deprecated RxJS 7) → retry({ delay }) функція
```

**Trade-offs та обмеження:**
- Надмірний retry може маскувати реальні проблеми
- catchError що повертає `of(null)` — приховує помилку, UI може не показати error state
- throwError() factory function (RxJS 7) vs throwError(error) (deprecated) — важлива різниця
- Interceptor retry не координується з component-level retry — потенційні duplicate retries

**Версійність:**
- RxJS 5-6: `retryWhen(errors$ => errors$.pipe(delay(1000)))` — стандартний retry з delay
- RxJS 7: `retry({ count, delay, resetOnSuccess })` — новий уніфікований API
- RxJS 7: `throwError(() => new Error())` — factory function (старий `throwError(new Error())` deprecated)
- RxJS 7: `retryWhen` deprecated — мігрувати на `retry({ delay: (err) => ... })`
- Angular 14+: `inject(HttpBackend)` у interceptors без circular DI

## Deep Details

### Edge Cases

- **catchError і caught$ parameter:** `catchError((err, caught$) => caught$.pipe(retry(3)))` — другий параметр є оригінальний Observable. Дозволяє retry через caught$.
- **retry і stateful Observable:** retry resubscribes — якщо source Observable має side effects (наприклад, збільшує counter) — вони виконуються знову при кожному retry. Важливо для HTTP: кожен retry = новий HTTP request.
- **nested catchError:** Якщо два catchError у pipe — перший що перехоплює і NOT re-throws зупиняє propagation. `pipe(catchError(handle1), catchError(handle2))` — handle2 спрацьовує тільки якщо handle1 re-throws.
- **catchError і complete:** catchError тільки перехоплює error, не complete. `EMPTY` у catchError handler спричиняє complete notification — не error.
- **onErrorResumeNext:** Оператор що дозволяє продовжити з іншим Observable при error або complete. Рідко використовується, але корисний для fallback chains.

### Junior vs Senior Understanding

**Junior** знає: "catchError ловить помилку, retry повторює. Ставлю catchError в кінці pipe."

**Senior** розуміє глибину:

1. **Placement semantics:** `source$.pipe(switchMap(v => inner$.pipe(catchError(recovery))))` vs `source$.pipe(switchMap(v => inner$), catchError(recovery))` — перший зберігає outer stream живим, другий термінує його. Це не просто "де краще" — це фундаментальна різниця у поведінці.

2. **Factory function у throwError:** `throwError(() => new Error('msg'))` — factory виконується LAZY для кожного subscriber. `throwError(new Error('msg'))` — eager: один instance для всіх. При retry той самий Error instance може бути rethrown — stack trace не оновиться. Factory гарантує fresh Error.

3. **retry і HTTP:** HttpClient Observable є cold — кожен subscribe = новий HTTP request. retry resubscribes → новий HTTP request. З interceptors — кожен retry також проходить через interceptors (включно з AuthInterceptor якщо токен refresh відбувся між retries).

4. **Error categories:** Client errors (4xx) — як правило non-retryable. Server errors (5xx) — retryable. Network errors (0/timeout) — retryable з backoff. Validation errors (422) — non-retryable, mapped to form errors.

### Deprecation & Migration Path

- **retryWhen:** Deprecated у RxJS 7.
  ```typescript
  // Old (deprecated):
  retryWhen(errors => errors.pipe(delay(1000), take(3)))
  // New (RxJS 7):
  retry({ count: 3, delay: 1000 })
  // Or with custom delay:
  retry({ count: 3, delay: (err, count) => timer(count * 1000) })
  ```

- **throwError(value):** Deprecated у RxJS 7 (non-function argument).
  ```typescript
  // Old (deprecated):
  throwError(new Error('msg'))
  // New:
  throwError(() => new Error('msg'))
  ```

- **onErrorResumeNext:** Не deprecated, але рідко потрібен. Обережно — маскує помилки.

### Connections to Other Concepts

- **Higher-Order Operators (b10t1):** catchError placement відносно switchMap/mergeMap — critical для stream lifecycle.
- **Reactive Patterns (b10t4):** Error handling вбудований у всі production reactive patterns.
- **HTTP Interceptors (b8t2):** Interceptors — перше місце для centralized HTTP error handling.
- **NgRx Effects:** Effects потребують catchError що повертає failure action — інакше effect dead.

## Examples

### Basic Usage

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, EMPTY, of } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';

interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`).pipe(
      // ✅ Retry transient errors only (5xx), not client errors (4xx)
      retry({
        count: 3,
        delay: (err, attempt) => {
          if (err.status >= 400 && err.status < 500) {
            throw err; // Don't retry client errors
          }
          return timer(Math.pow(2, attempt) * 1000); // Exponential backoff
        },
      }),
      // ✅ Transform HttpErrorResponse to domain error
      catchError(err => throwError(() => this.mapError(err))),
    );
  }

  getProductWithFallback(id: string): Observable<Product | null> {
    return this.http.get<Product>(`/api/products/${id}`).pipe(
      // ✅ Graceful degradation - return null instead of erroring
      catchError(() => of(null)),
    );
  }

  private mapError(err: any): ApiError {
    return {
      code: err.status?.toString() ?? 'NETWORK_ERROR',
      message: err.error?.message ?? 'An error occurred',
      retryable: !err.status || err.status >= 500,
    };
  }
}
```

### Production Scenario

```typescript
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as UserActions from './user.actions';
import { LoggingService } from './logging.service';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private logger = inject(LoggingService);

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUser),
      switchMap(({ userId }) =>
        this.http.get<User>(`/api/users/${userId}`).pipe(
          map(user => UserActions.loadUserSuccess({ user })),

          // ✅ CRITICAL: catchError INSIDE switchMap
          // If outside, first HTTP error terminates entire effect!
          catchError(err => {
            // ✅ Log before handling
            this.logger.error('loadUser failed', { userId, err });

            // ✅ Return failure action (NOT throw) — effect remains alive
            return of(UserActions.loadUserFailure({
              error: err.status === 404
                ? 'User not found'
                : 'Failed to load user',
            }));
          }),
        ),
      ),
    ),
  );

  // ✅ Retry with backoff for transient failures
  syncUserData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.syncData),
      exhaustMap(({ data }) =>
        this.http.post('/api/users/sync', data).pipe(
          retry({
            count: 2,
            delay: (err, attempt) => {
              if (err.status < 500) throw err; // Don't retry 4xx
              return timer(attempt * 2000);
            },
          }),
          map(() => UserActions.syncDataSuccess()),
          catchError(err => of(UserActions.syncDataFailure({ error: err.message }))),
        ),
      ),
    ),
  );
}
```

### Anti-Example

```typescript
// ❌ WRONG: catchError outside switchMap — effect dies on first error
loadData$ = createEffect(() =>
  this.actions$.pipe(
    ofType(DataActions.load),
    switchMap(() => this.http.get('/api/data')),
    map(data => DataActions.loadSuccess({ data })),
    // ❌ First HTTP error kills entire effect stream!
    catchError(err => of(DataActions.loadFailure({ error: err }))),
  ),
);

// ❌ WRONG: Swallow error silently
getData(): Observable<Data[]> {
  return this.http.get<Data[]>('/api/data').pipe(
    catchError(() => of([])), // Looks fine, but: no error logging, no user notification
  );
}

// ❌ WRONG: Retry client errors
getUser(id: string): Observable<User> {
  return this.http.get<User>(`/api/users/${id}`).pipe(
    retry(3), // Will retry 404 Not Found 3 times — pointless!
  );
}

// ❌ WRONG: throwError with eager Error creation
function failWith(msg: string): Observable<never> {
  // Same Error instance shared between all subscribers — stale stack trace
  return throwError(new Error(msg)); // deprecated syntax + eager
}

// ✅ CORRECT:
// Effect with inner catchError
loadData$ = createEffect(() =>
  this.actions$.pipe(
    ofType(DataActions.load),
    switchMap(() =>
      this.http.get<Data[]>('/api/data').pipe(
        map(data => DataActions.loadSuccess({ data })),
        catchError(err => { // ← inside switchMap
          this.logger.error(err);
          return of(DataActions.loadFailure({ error: err.message }));
        }),
      ),
    ),
  ),
);
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| catchError поза inner Observable в NgRx Effect | Effect вмирає після першої помилки, перестає реагувати на actions | catchError ВСЕРЕДИНІ inner pipe (switchMap inner) |
| retry() без status check | Retry 4xx client errors (404, 400) — марно, збільшує навантаження | `retry({ delay: (err) => err.status < 500 ? throwError(() => err) : timer(...) })` |
| Swallow error via `catchError(() => of([]))` без logging | Error приховано, неможливо debug production | Завжди `tap({ error: err => logger.error(err) })` перед catchError |
| `throwError(new Error())` eager | Стекова трасіровка не оновлюється при retry | `throwError(() => new Error())` — factory function |
| retryWhen замість retry | Deprecated у RxJS 7 | `retry({ count, delay: (err, attempt) => ... })` |

## Interview Block

### [L1 — Warm-up] Як обробити помилку в RxJS? Що станеться з потоком після помилки?
**Signal being tested:** Чи розуміє кандидат Observable Contract і terminal nature помилки
**What the interviewer expects:** Згадка catchError, terminal nature error notification, що Observable dead після error, retry як resubscription
**How to probe deeper:** "Якщо catchError повертає EMPTY — що отримає subscriber?"
**Reference answer:** Помилка у RxJS — terminal: після error() Observable не буде emit next(). catchError перехоплює error і повертає новий Observable: of(fallback) для значення, EMPTY для complete без значень, throwError для re-throw. retry() resubscribes on error — кожен retry = нова execution. Важливо: placement of catchError critical — всередині switchMap зберігає outer stream живим.
**Common mistakes:** Думають catchError просто "ловить" і потік продовжується; не знають різниці EMPTY vs NEVER; не знають про NgRx Effect death без catchError

### [L2 — Mid] Як реалізувати retry з exponential backoff? Коли retry недоречний?
**Signal being tested:** Знання retry semantics, error classification, backoff strategy, jitter
**What the interviewer expects:** retry({count, delay}) синтаксис RxJS 7, exponential formula, jitter для thundering herd, не retry 4xx
**How to probe deeper:** "Чому важливий jitter в exponential backoff при тисячах клієнтів?"
**Reference answer:** `retry({ count: 3, delay: (err, attempt) => err.status < 500 ? throwError(() => err) : timer(Math.pow(2, attempt) * 1000 + Math.random() * 200) })`. Jitter — random delay уникнення thundering herd. Не retry: 4xx client errors (не зникнуть), validation errors. Retry: 5xx server errors, network timeout, 429 з Retry-After header. resetOnSuccess — очищає retry count після успішного відповіді.
**Common mistakes:** retry() без status check; без jitter; retryWhen не deprecated RxJS 7

### [L3 — Senior] Поясніть різницю catchError, throwError, EMPTY — коли що?
**Signal being tested:** Глибоке знання Observable termination semantics і error recovery patterns
**What the interviewer expects:** Різниця graceful degradation (of/EMPTY) vs re-throw, lazy factory у throwError, EMPTY vs NEVER, caught$ parameter для retry
**How to probe deeper:** "Що таке caught$ другий параметр catchError і як використати для retry?"
**Reference answer:** catchError(err => of(fallback)) — graceful: emit fallback value then complete. catchError(err => EMPTY) — silent complete. catchError(err => throwError(() => err)) — re-throw, propagates to next catchError or subscriber. throwError(() => new Error()) — factory function: lazy, fresh Error instance per subscriber, оновлена stack trace. EMPTY = Observable.create(sub => sub.complete()) — complete without values. NEVER = Observable.create() — never complete. caught$ у catchError — оригінальний source для conditional retry: `catchError((err, src$) => attempts < 3 ? src$ : throwError(() => err))`.
**Common mistakes:** throwError eager syntax; не знають caught$ для retry; NEVER замість EMPTY

### [L4 — Staff/Principal] Як реалізувати circuit breaker у Angular HTTP layer?
**Signal being tested:** Системне мислення — resilience patterns, per-service granularity, observability, UX
**What the interviewer expects:** 3 стани (Closed/Open/HalfOpen), threshold logic, Interceptor implementation, per-endpoint granularity, user feedback, metrics
**How to probe deeper:** "Як координувати circuit state між кількома Angular micro-frontend instances?"
**Reference answer:** Circuit breaker у HTTP interceptor: 3 стани — Closed (normal), Open (fail fast після X failures за Y seconds), HalfOpen (test request після cooldown). State transitions: Closed→Open при threshold, Open→HalfOpen після timeout, HalfOpen→Closed при success, HalfOpen→Open при failure. Per-endpoint granularity — payment circuit відкритий не блокує profile requests. UX: meaningful error message + estimated recovery time. Metrics: Prometheus circuit state changes. Distributed: BroadcastChannel для sync між вкладками.
**Common mistakes:** Один глобальний circuit; відсутній HalfOpen стан (circuit ніколи не відновлюється); немає observability

## Summary

### Key Points
- Observable Contract: `next* (error | complete)?` — після error Observable dead, не emit більше нічого
- catchError placement critical: всередині inner Observable (switchMap) зберігає outer stream; поза — terminates it
- NgRx Effects: catchError → return failure action, не throw; інакше effect dead після першої помилки
- `throwError(() => new Error())` — factory function (lazy), не `throwError(new Error())` (deprecated, eager)
- retry({count, delay}) у RxJS 7; retryWhen deprecated; не retry 4xx client errors
- EMPTY = complete without values; NEVER = never complete; for silent error recovery use EMPTY
- Circuit breaker: 3 стани (Closed/Open/HalfOpen), per-endpoint, з observability

### Elevator Pitch (2 minutes)
"Error handling у RxJS відрізняється від try-catch: помилка — terminal notification що 'вбиває' Observable. catchError перехоплює і повертає новий Observable: of(fallback) для graceful degradation, EMPTY для тихого завершення, throwError для re-throw. Ключова деталь: catchError ВСЕРЕДИНІ switchMap зберігає outer stream живим — критично для NgRx Effects і polling. retry({count, delay}) у RxJS 7 з exponential backoff і jitter — для transient failures, але не для 4xx. В enterprise: layered handling — interceptor для cross-cutting (auth refresh, transient retry), service для domain error mapping, component для UI feedback. Circuit breaker — наступний рівень resilience."
