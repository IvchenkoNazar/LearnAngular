---
title: "HTTP Error Handling — Resilient Angular Applications"
block: 8
topic: 3
slug: "error-handling-http"
difficulty: 3
sinceVersion: "4.3"
tags: ["HttpErrorResponse", "catchError", "retry", "retryWhen", "throwError", "error-handling", "resilience"]
relatedTopics: ["httpclient", "http-interceptors", "rxjs-error-handling", "rxjs-higher-order-operators"]
interviewQuestions:
  - id: "b8t3q1"
    level: "junior"
    question: "Як обробити помилку HTTP запиту в Angular?"
    referenceAnswers:
      junior: "HTTP помилки обробляються через catchError оператор RxJS в pipe() після http.get(). У catchError можна повернути EMPTY щоб завершити stream без значення, або throwError щоб propagate помилку далі, або fallback значення через of()."
      mid: "HttpClient помилки бувають двох типів: 1) Мережеві помилки (status 0) — немає інтернету, CORS, timeout; 2) HTTP помилки (4xx, 5xx) — сервер повернув error response. Обидва типи wrapped у HttpErrorResponse. Обробка: .pipe(catchError((error: HttpErrorResponse) => { if (error.status === 0) { /* network error */ } if (error.status === 404) { /* not found */ } return throwError(() => error); })). throwError(() => error) — завжди з factory function для lazy evaluation. EMPTY для silent failure. of(fallbackValue) для graceful degradation."
      senior: "HTTP error handling має два рівні: interceptor-level (глобальна обробка — 401 refresh, 500 notification) і service-level (domain-specific — 404 → null, 409 → conflict handling). Розподіл відповідальності: interceptor обробляє infrastructure concerns, service обробляє business logic помилки. HttpErrorResponse.error містить parsed error body якщо Content-Type: application/json — це structured error від API. HttpErrorResponse.status === 0 — network/CORS/timeout — error.message містить деталі. Для retry: retryWhen deprecated (Angular RxJS 7.5+), використовувати retry({ count: 3, delay: 1000 }) або retry({ count: 3, delay: (error, count) => timer(count * 1000) }) для exponential backoff."
      staff: "Production HTTP error handling strategy: 1) Interceptor handles: 401 (token refresh), 403 (permission notification), 5xx (server error notification + logging), 0 (offline detection). 2) Service handles: 404 (return null/default), 409 (conflict — return error details for UI), 422 (validation errors — map to form errors). 3) Global ErrorHandler (не для HTTP) — для uncaught JS exceptions. 4) Structured errors: API contract для error format (RFC 7807 Problem Details — { type, title, status, detail, instance }). 5) Circuit breaker pattern: після N consecutive failures, stop sending requests for T seconds. 6) Observability: error interceptor надсилає structured log до Sentry/Datadog з context (URL, status, user, correlation-id). 7) Retry strategy: idempotent requests (GET, PUT) — retry safe; POST — retry тільки якщо idempotency header або server confirms idempotency."
    commonMistakes:
      - "Використовують throwError(error) без factory функції — помилка 'throwError requires factory function'"
      - "Перехоплюють помилки в interceptor і не propagate — service thinks request succeeded"
      - "Retry POST запити без ідемпотентності — duplicate submissions"
    relatedQuestions: ["b8t3q2", "b8t3q3"]
  - id: "b8t3q2"
    level: "mid"
    question: "Як реалізувати retry з exponential backoff для HTTP запитів?"
    referenceAnswers:
      junior: "retry(3) виконає запит до 3 разів при помилці. Для паузи між спробами використовується retryWhen або новий retry() з delay опцією."
      mid: "Сучасний підхід (RxJS 7+): retry({ count: 3, delay: (error, attempt) => timer(Math.pow(2, attempt) * 1000) }) — exponential backoff: 1s, 2s, 4s між спробами. Перший аргумент delay — помилка, другий — номер спроби (1-based). Потрібно retry тільки для retryable помилок (5xx, 0) але не для 4xx (клієнтська помилка — retry не допоможе). Conditional retry: delay fn може повертати throwError() для non-retryable помилок."
      senior: "Conditional retry pattern: delay function у retry() може throwError щоб зупинити retry для non-retryable помилок: retry({ count: 3, delay: (error: HttpErrorResponse, attempt) => { if (error.status >= 400 && error.status < 500) return throwError(() => error); // Don't retry client errors return timer(Math.pow(2, attempt) * 1000 + Math.random() * 1000); // Jitter } }). Jitter (random component) важливий для distributed systems — без нього всі клієнти retry одночасно і перевантажують сервер (thundering herd). Для critical paths: combine retry з timeout: race(http.get(url), timer(5000).pipe(mergeMap(() => throwError(() => new TimeoutError())))). timeout(5000) оператор також доступний."
      staff: "Exponential backoff з jitter — це стандарт для distributed systems (AWS, Google Cloud рекомендують full jitter або decorrelated jitter). Full jitter: `random(0, cap(base * 2^attempt))`. Для Angular SPA: circuit breaker pattern поверх retry — після N failures в T seconds, reject requests immediately для T' seconds. Retry budget: не retry нескінченно — встановити загальний бюджет (max 30 seconds of retries). Idempotency consideration: GET, HEAD, OPTIONS, PUT, DELETE — safe to retry; POST — тільки з idempotency key header; PATCH — залежить від semantics. Observability: кожен retry має бути logged з attempt number, delay, error code — для аналізу flakiness в production. Coordination: якщо 100 clients retrying simultaneously після outage — exponential backoff + jitter розподіляє навантаження."
    commonMistakes:
      - "Retry для 4xx помилок — клієнтська помилка не зникне від повторного запиту"
      - "Без jitter — thundering herd при відновленні сервісу"
    relatedQuestions: ["b8t3q1", "b8t3q3"]
  - id: "b8t3q3"
    level: "senior"
    question: "Як розподілити HTTP error handling між interceptors і services?"
    referenceAnswers:
      junior: "Глобальні помилки (401, 500) обробляються в interceptors, специфічні для бізнес-логіки — в services або компонентах."
      mid: "Interceptors обробляють: 401 (token refresh), 403 (global permission denied notification), 5xx (global error notification, logging). Services обробляють: 404 → return null, 409 → return conflict error для UI display, 422 → map validation errors до form control errors. Компоненти обробляють: display-specific behavior (show toast, redirect). Принцип: infrastructural concerns → interceptor; domain concerns → service."
      senior: "Architectural pattern: interceptor обробляє status codes що є universal (не залежать від бізнес-контексту). Service обробляє status codes з бізнес-значенням. Проблема: якщо interceptor catchError і не re-throwError — service думає що запит успішний. Рішення: interceptor повинен завжди throwError після side effect (notification, logging). Для конкретних endpoints що повинні обходити global error handling — HttpContext token: CUSTOM_ERROR_HANDLING = new HttpContextToken<boolean>(() => false). Structured API errors (400 з validation details): interceptor не обробляє, service mapує HttpErrorResponse.error до domain error type."
      staff: "Error handling architecture для enterprise: Layer 1 — HttpInterceptor: auth errors (401 → refresh), rate limiting (429 → queue/backoff), network errors (0 → offline state), logging всіх errors з correlation IDs. Layer 2 — API Service: map HTTP errors до domain errors (UserNotFoundError, ConflictError, ValidationError) — це translation layer між HTTP і domain. Layer 3 — Use Case / Feature Service: domain error handling logic (retry з user confirmation, fallback data, state rollback). Layer 4 — Component: display errors via reactive state (errorMessage signal, toast service). Structured error format: RFC 7807 Problem Details дозволяє type-safe error parsing. Global ErrorHandler: окремо для uncaught JS errors — не плутати з HTTP error handling. Correlation IDs: кожен request отримує X-Correlation-ID header (генерується в interceptor) — це дозволяє trace request через distributed systems в logs."
    commonMistakes:
      - "Перехоплюють помилки в interceptor без re-throw — service отримує successful undefined замість error"
      - "Обробляють validation errors (422) в interceptor — вони domain-specific, мають йти до service/component"
    relatedQuestions: ["b8t3q1", "b8t2q4", "b8t3q4"]
  - id: "b8t3q4"
    level: "staff"
    question: "Як реалізувати circuit breaker pattern для HTTP calls в Angular?"
    referenceAnswers:
      junior: "Circuit breaker — це pattern що тимчасово зупиняє HTTP запити після серії помилок, щоб не перевантажувати нестабільний сервіс."
      mid: "Circuit breaker має три стани: Closed (normal, requests pass through), Open (after N failures, reject requests immediately), Half-Open (after timeout, allow one test request — if success → Closed, if failure → Open again). В Angular реалізується як RxJS operator або interceptor що tracking failure counts."
      senior: "Angular circuit breaker як interceptor: state signal або BehaviorSubject для current state (closed/open/half-open). В interceptor: if state === 'open' → throwError(new CircuitBreakerOpenError()). При failure: failureCount++; if failureCount >= threshold → state = 'open', schedule half-open після timeout. При success в half-open → state = 'closed', reset failureCount. Sliding window для failure count — не total failures але failures в останні N seconds. Metastable issue: якщо open duration занадто коротке, circuit flaps між open і half-open."
      staff: "Production circuit breaker для Angular SPA: 1) Per-endpoint circuit breakers (не один global) — /api/users може бути down без affecting /api/products. 2) State persistence: circuit state в memory або localStorage (для page refresh scenarios). 3) Half-open strategy: замість одного test request — slowly increase traffic (10%, 25%, 50%, 100%) — gradual recovery. 4) Fallback responses: при open state повертати stale cache або degraded response замість error. 5) Bulkhead pattern: окремі HttpClient instances для critical і non-critical APIs — failure в одному не блокує інший. 6) Metrics: circuit state changes, failure rates, latency percentiles — export до monitoring. 7) Coordination: якщо app у кількох вкладках — circuit state може бути shared через BroadcastChannel або ServiceWorker. 8) Testing: deterministic time-based tests з TestScheduler для circuit state transitions."
    commonMistakes:
      - "Один global circuit breaker для всіх API — незалежні API failures впливають одна на одну"
      - "Не мають fallback при open state — user бачить error замість stale/degraded data"
    relatedQuestions: ["b8t3q2", "b8t3q3"]
---

## Core Concept

**English definition:** HTTP Error Handling in Angular encompasses strategies for detecting, categorizing, and responding to failures in the HTTP layer — from network errors (status 0) to server errors (5xx) to client errors (4xx) — using RxJS operators (catchError, retry), interceptors, and service-level domain error mapping.

**Пояснення:** HTTP помилки неминучі в production — сервери падають, мережа нестабільна, токени закінчуються. Правильна обробка помилок в Angular означає: розрізняти типи помилок, обробляти їх на правильному рівні (interceptor vs service vs component), інформувати користувача і автоматично відновлюватись там де можливо.

**Яку проблему вирішує:** Без централізованої обробки помилок: кожен HTTP call дублює error handling logic, 401 responses залишаються без обробки (user не бачить що потрібен re-login), мережеві помилки зупиняють UI без feedback. Правильна архітектура вирішує: global vs domain error separation, retry strategies, user notification.

**Як працює під капотом:** HttpClient перехоплює non-2xx responses і network failures і передає їх як HttpErrorResponse через Observable error channel. Interceptors обробляють errors через pipe(catchError(...)) на Observable що повертає next(). RxJS retry() оператор автоматично re-subscribes до джерела Observable при error — фактично повторно надсилаючи HTTP request.

**Trade-offs та обмеження:**
- Centralized error handling (interceptor) vs granular control (per-call) — трейдофф між DRY і flexibility
- retry() для network errors може спричинити thundering herd без jitter
- Silent error swallowing (catchError → EMPTY) приховує problems від observability tools
- Circuit breaker додає complexity — лише для high-traffic або unreliable external APIs

**Версійність:**
- Angular 4.3: HttpErrorResponse введено разом з HttpClient
- RxJS 7.5: retryWhen deprecated на користь retry({ delay: fn })
- Angular 12: HttpContext для conditional error handling в interceptors
- Angular 14+: retry() з покращеними options (count, delay factory, resetOnSuccess)

## Deep Details

### Edge Cases

**status: 0 — не обов'язково мережева помилка:** status 0 може означати: CORS preflight fail, request canceled (component destroyed і unsubscribed), network offline, або strict CORS policy. `error.message` містить деталі.

**HttpErrorResponse.error — дві різні речі:** Для network errors (status 0) — error.error є ProgressEvent або ErrorEvent. Для HTTP errors (4xx, 5xx) — error.error є parsed response body (якщо Content-Type: application/json).

**retry() і cold vs hot:** retry() re-subscribes до source Observable — для HttpClient (cold) це означає новий HTTP запит. Для hot Observables поведінка різна.

**catchError і type narrowing:** catchError отримує `unknown` в TypeScript strict mode. Потрібна перевірка: `if (error instanceof HttpErrorResponse) { ... }`.

**throw в catchError:** `return throwError(() => error)` — factory function обов'язкова (lazy). `return throwError(error)` — deprecated, eager evaluation.

### Junior vs Senior Understanding

**Junior розуміє:** catchError для обробки помилок, throwError для propagation, retry для повторних спроб.

**Senior розуміє:**
- Різницю між status 0 (network) і 4xx/5xx (HTTP)
- Conditional retry (не retry 4xx — вони не зникнуть)
- Exponential backoff з jitter для distributed systems
- Розподіл між interceptor (infrastructure) і service (domain) error handling
- HttpErrorResponse.error для structured API error parsing

**Staff розуміє:**
- Circuit breaker pattern — implementation і trade-offs
- Correlation IDs для distributed tracing
- RFC 7807 Problem Details для structured errors
- Retry budgets і thundering herd prevention
- Bulkhead pattern для isolating critical API failures

### Deprecation & Migration Path

**retryWhen (deprecated in RxJS 7.5):**
```typescript
// Old (deprecated)
pipe(
  retryWhen(errors => errors.pipe(
    delay(1000),
    take(3)
  ))
)

// New (RxJS 7+)
pipe(
  retry({
    count: 3,
    delay: (error, attempt) => timer(Math.pow(2, attempt) * 1000)
  })
)
```

**throwError без factory:**
```typescript
// Old (deprecated)
throwError(error) // eager, error created immediately

// New (correct)
throwError(() => error) // lazy factory function
```

### Connections to Other Concepts

- **HTTP Interceptors (b8t2):** Error interceptor — найпоширеніший use case interceptors
- **RxJS Error Handling (b10t5):** catchError, retry, throwError, EMPTY — це RxJS operators
- **HttpClient (b8t1):** HttpErrorResponse приходить від HttpClient
- **Signals (b9t4):** Error state можна зберігати як Signal для reactive UI

## Examples

### Basic Usage

```typescript
// Basic error handling in service
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, EMPTY, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`).pipe(
      // Retry up to 2 times for server/network errors, not for client errors
      retry({
        count: 2,
        delay: (error: HttpErrorResponse) => {
          // Don't retry client errors (4xx) — they won't fix themselves
          if (error.status >= 400 && error.status < 500) {
            return throwError(() => error);
          }
          return timer(1000); // Wait 1 second before retry for 5xx/network
        },
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          // Graceful degradation: return null for not found
          return of(null as unknown as Product);
        }
        // Re-throw all other errors for caller to handle
        return throwError(() => this.mapToAppError(error));
      }),
    );
  }

  private mapToAppError(error: HttpErrorResponse): AppError {
    if (error.status === 0) {
      return { code: 'NETWORK_ERROR', message: 'No network connection' };
    }
    if (error.status === 403) {
      return { code: 'FORBIDDEN', message: 'Access denied' };
    }
    // Try to extract structured error from API response
    const apiError = error.error;
    if (apiError?.title) {
      return { code: apiError.type ?? 'API_ERROR', message: apiError.title };
    }
    return { code: 'UNKNOWN_ERROR', message: `HTTP ${error.status}: ${error.statusText}` };
  }
}

interface AppError { code: string; message: string; }
interface Product { id: number; name: string; }
```

### Production Scenario

```typescript
// global-error.interceptor.ts — production-grade interceptor
import {
  HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpContextToken
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { retry, catchError } from 'rxjs/operators';
import { throwError, timer } from 'rxjs';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { LoggingService } from './logging.service';

// Opt-out token for custom error handling
export const HANDLE_ERRORS = new HttpContextToken<boolean>(() => true);

export const globalErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);
  const logger = inject(LoggingService);

  // Skip global handling if component handles errors itself
  if (!req.context.get(HANDLE_ERRORS)) {
    return next(req);
  }

  return next(req).pipe(
    // Auto-retry for server errors (5xx) and network errors (0)
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, attempt: number) => {
        // Only retry server/network errors
        if (error.status !== 0 && error.status < 500) {
          return throwError(() => error);
        }
        // Exponential backoff with jitter
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        return timer(baseDelay + jitter);
      },
    }),
    catchError((error: HttpErrorResponse) => {
      // Log every error with context for observability
      logger.error('HTTP Error', {
        url: req.url,
        method: req.method,
        status: error.status,
        // NEVER log Authorization header value — only presence
        hasAuth: req.headers.has('Authorization'),
      });

      if (error.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        notifications.showError('Access denied');
      } else if (error.status === 0) {
        notifications.showError('Network connection lost. Please check your internet.');
      } else if (error.status >= 500) {
        notifications.showError('Server error. Please try again later.');
      }

      return throwError(() => error); // Always re-throw — services need to know about errors
    }),
  );
};
```

### Anti-Example

```typescript
// WRONG: Multiple error handling anti-patterns
@Injectable({ providedIn: 'root' })
export class BadService {
  private http = inject(HttpClient);

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`).pipe(
      // WRONG: retryWhen is deprecated in RxJS 7.5
      retryWhen(errors => errors.pipe(delay(1000), take(3))),

      catchError(error => {
        console.log('Error:', error); // WRONG: logging without context or structure

        // WRONG: throwError(error) without factory function (deprecated)
        return throwError(error);
      }),
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users').pipe(
      // WRONG: retrying 4xx errors — they will never succeed
      retry(3),

      catchError(error => {
        // WRONG: swallowing error silently — caller thinks request succeeded with undefined
        return EMPTY; // Component receives "completed" signal — no way to show error
      }),
    );
  }
}

// WRONG: Interceptor that swallows errors without re-throwing
export const badErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      console.error('Error!'); // side effect
      return EMPTY; // WRONG: services think requests succeeded (undefined value)
      // All components will silently get nothing — user confused, no error shown
    }),
  );
};
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `throwError(error)` without factory | Deprecated since RxJS 7 — evaluates error eagerly; will trigger deprecation warnings | Always `throwError(() => error)` — lazy factory function |
| Retrying 4xx errors | Client errors (bad request, not found, forbidden) won't be fixed by retrying — wastes resources | Only retry 5xx and status 0 (network) errors; abort retry for 4xx: `delay: (err) => err.status < 500 ? throwError(() => err) : timer(1000)` |
| Swallowing errors with `EMPTY` in interceptor | Services and components receive a completed-but-empty Observable — appear to succeed but deliver no data; impossible to show error UI | Always `throwError(() => error)` after side effects in interceptors; only use `EMPTY` in services for explicit "not found → empty" semantics |
| Retry without jitter | Thundering herd: all clients retry simultaneously after outage, re-saturating the recovering server | Add `Math.random() * 1000` jitter to retry delay |
| Logging `Authorization` header value | Security vulnerability — tokens in logs can be exfiltrated | Log only header presence: `req.headers.has('Authorization')` |

## Interview Block

### [L1 — Warm-up] Які типи HTTP помилок існують в Angular і як їх розрізнити?

**Signal being tested:** Розуміння HttpErrorResponse і різниці між network errors (status 0) і HTTP errors (4xx/5xx).

**What the interviewer expects:** Кандидат знає що всі HTTP помилки wrapped у HttpErrorResponse, розрізняє status 0 (network) від HTTP status codes.

**How to probe deeper:** "Що містить `HttpErrorResponse.error` для network error (status 0) проти HTTP 400?"

**Reference answer:** Всі HTTP помилки приходять як HttpErrorResponse. Два типи: 1) Network errors (status 0) — немає з'єднання, CORS fail, request canceled — error.error є ProgressEvent або ErrorEvent; 2) HTTP errors (4xx, 5xx) — сервер відповів з non-2xx status — error.error є parsed response body (JSON). Для обробки: `if (error.status === 0) { /* network */ } else if (error.status === 404) { /* not found */ } else if (error.status >= 500) { /* server error */ }`.

**Common mistakes:** Думають що status 0 завжди означає "немає інтернету" — насправді може бути CORS preflight fail або request canceled.

---

### [L2 — Mid] Як написати retry з exponential backoff що не retry клієнтські помилки?

**Signal being tested:** Знання сучасного retry() API і здатність реалізувати conditional retry logic.

**What the interviewer expects:** Використання `retry({ count, delay: fn })`, розрізнення retryable vs non-retryable errors, exponential backoff formula.

**How to probe deeper:** "Що таке 'thundering herd' і як jitter вирішує цю проблему?"

**Reference answer:** `retry({ count: 3, delay: (error: HttpErrorResponse, attempt) => { if (error.status >= 400 && error.status < 500) return throwError(() => error); return timer(Math.pow(2, attempt) * 1000 + Math.random() * 1000); } })`. 4xx errors — не retry (не зникнуть). 5xx і 0 — retry з exponential backoff. Jitter (random component) запобігає thundering herd — коли всі клієнти retry одночасно і перевантажують сервіс що відновлюється.

**Common mistakes:** `retry(3)` без умов — буде retry і 404, і 403, і 500 — марно для 4xx.

---

### [L3 — Senior] Як розподілити HTTP error handling між interceptors і services? Які помилки йдуть куди?

**Signal being tested:** Архітектурне мислення — розуміння separation of concerns між HTTP infrastructure (interceptors) і domain logic (services).

**What the interviewer expects:** Чіткий поділ: interceptors = infrastructure concerns; services = domain concerns. Кандидат знає що interceptor НЕ повинен swallow errors без re-throw.

**How to probe deeper:** "Що трапиться якщо interceptor робить catchError і повертає EMPTY — чи дізнається про помилку service?"

**Reference answer:** Interceptors обробляють: 401 (token refresh або logout), 403 (global notification), 5xx + 0 (retry, notification, logging). Services обробляють: 404 → return null (graceful degradation), 409 → domain error для UI, 422 → map validation errors до form errors. Ключове правило: interceptor ЗАВЖДИ re-throw після side effects — `return throwError(() => error)`. Якщо interceptor повертає EMPTY — service думає що запит успішно завершився з empty value. HttpContext token для opt-out: `HANDLE_ERRORS = new HttpContextToken(() => true)`.

**Common mistakes:** Interceptor catches і повертає EMPTY — service і component не мають шансу відреагувати на помилку.

---

### [L4 — Staff/Principal] Опиши circuit breaker pattern для Angular HTTP і коли він доречний.

**Signal being tested:** Знання resilience patterns для distributed systems і здатність оцінити trade-offs складності vs надійності.

**What the interviewer expects:** Три стани circuit breaker (closed/open/half-open), implementation як interceptor, per-endpoint vs global, fallback strategies.

**How to probe deeper:** "Які альтернативи circuit breaker і коли вони кращі для Angular SPA?"

**Reference answer:** Circuit breaker три стани: Closed (normal), Open (після N failures — reject immediately), Half-Open (після timeout — test request, якщо success → Closed). Реалізація як interceptor: state signal + failure counter + timer для half-open transition. Per-endpoint breakers — не один global. Fallbacks при open: stale cache, degraded response, або graceful error message. Альтернативи: якщо app не high-traffic SPA — retry з backoff достатньо. Circuit breaker worth it коли: external API з нестабільним SLA, real-time trading або critical operations. Coordinate circuit state через BroadcastChannel для multiple tabs.

**Common mistakes:** Один global circuit breaker — failure в /api/products відкриває circuit для /api/users теж.

## Summary

### Key Points

- Всі HTTP помилки wrapped у `HttpErrorResponse` — status 0 (network/CORS) vs 4xx/5xx (HTTP errors)
- `throwError(() => error)` — фабрична функція обов'язкова; `throwError(error)` deprecated
- `retry({ count, delay: fn })` — сучасний API; conditional: не retry 4xx, retry 5xx і 0
- Exponential backoff + jitter запобігає thundering herd при відновленні сервісу
- Interceptor обробляє infrastructure concerns (401, 5xx, logging); service обробляє domain concerns (404→null, 422→form errors)
- Interceptor ПОВИНЕН re-throw після side effects — інакше сервіси і компоненти не дізнаються про помилку
- `HttpContextToken` для opt-out глобальної обробки помилок у специфічних запитах

### Elevator Pitch (2 minutes)

HTTP error handling в Angular будується на HttpErrorResponse — клас що wraps і network errors (status 0) і HTTP errors (4xx/5xx). Для RxJS: catchError перехоплює, throwError(() => error) propagates, retry({ count, delay }) для automatic retry з exponential backoff. Retry тільки для network errors і 5xx — 4xx errors не зникнуть від повторного запиту. Backoff + jitter запобігає thundering herd. Архітектурний розподіл: interceptors = infrastructure (auth refresh, logging, global notifications), services = domain (404 → graceful null, 422 → validation error mapping). Критичне правило: interceptor завжди re-throw після side effects — якщо повернути EMPTY, сервіс отримає completed Observable без значення і не дізнається про помилку.
