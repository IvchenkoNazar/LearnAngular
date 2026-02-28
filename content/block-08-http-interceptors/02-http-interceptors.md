---
title: "HTTP Interceptors — Middleware for Angular HTTP"
block: 8
topic: 2
slug: "http-interceptors"
difficulty: 3
sinceVersion: "4.3"
tags: ["HttpInterceptor", "functional-interceptors", "withInterceptors", "HttpHandlerFn", "middleware", "auth-interceptor"]
relatedTopics: ["httpclient", "error-handling-http", "dependency-injection", "guards"]
interviewQuestions:
  - id: "b8t2q1"
    level: "junior"
    question: "Що таке HTTP interceptors і для чого вони використовуються?"
    referenceAnswers:
      junior: "HTTP interceptors — це middleware що перехоплюють HTTP запити та відповіді. Вони дозволяють додавати headers (наприклад, Authorization token), логувати запити, показувати loading spinner або обробляти помилки в одному місці для всіх запитів."
      mid: "HTTP interceptors реалізують HttpInterceptor interface (клас) або HttpInterceptorFn тип (функція). Вони вставляються в HttpHandler chain між HttpClient і HttpBackend. Кожен interceptor отримує HttpRequest і може модифікувати його (через clone()), передати далі через next.handle(req), або обробити відповідь через pipe() на Observable. Типові use cases: auth token attachment, global error handling, request/response logging, loading state management, request deduplication, retry logic."
      senior: "Interceptors реалізують chain of responsibility pattern. З Angular 15+ recommended підхід — functional interceptors (HttpInterceptorFn) замість class-based (HttpInterceptor). Functional interceptors: більш tree-shakeable, легші для тестування, підтримують inject() з Injection Context. Chain порядок: interceptors виконуються в порядку реєстрації для request phase і в зворотньому для response phase. Для request: interceptor1 → interceptor2 → backend; для response: backend → interceptor2 → interceptor1. HttpContext (Angular 12+) дозволяє передавати metadata для conditional behavior (skip auth для public endpoints)."
      staff: "Interceptors архітектурно є точкою розширення HttpClient без модифікації backend implementation. Вони реалізують open/closed principle для HTTP layer. Для enterprise: interceptor ordering є критичним — auth interceptor повинен бути до logging (щоб логи не містили sensitive data), retry повинен бути після error detection. Functional interceptors з inject() дозволяють отримати доступ до services (TokenService, LoadingService) без конструктор injection — це означає що тест може override providers без SpyObject. Performance: interceptors на кожен request — важливо уникати expensive synchronous operations в interceptor pipeline. Для мікросервісної архітектури: різні interceptor chains для різних API domains через provideHttpClient з scope. HttpContext tokens — це InjectionToken<T> що дозволяє type-safe metadata передачу — набагато краще ніж custom headers."
    commonMistakes:
      - "Думають що interceptors виконуються тільки для request, а не для response"
      - "Модифікують HttpRequest напряму замість clone() — HttpRequest immutable"
      - "Не передають modified request через next.handle(clonedReq) — pipeline обривається"
    relatedQuestions: ["b8t2q2", "b8t2q3"]
  - id: "b8t2q2"
    level: "mid"
    question: "Як написати functional interceptor для додавання Authorization header до всіх запитів?"
    referenceAnswers:
      junior: "Functional interceptor — це функція що приймає request і next, клонує request з Authorization header і передає далі. Реєструється через withInterceptors() в provideHttpClient()."
      mid: "Functional interceptor (HttpInterceptorFn): приймає (req: HttpRequest<unknown>, next: HttpHandlerFn). Для auth: inject(AuthService) щоб отримати token, якщо token є — req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }), інакше передати оригінальний req. Важливо: перевірити чи запит потребує auth — public endpoints (login, register) не повинні отримувати token. HttpContext token: SKIP_AUTH = new HttpContext<boolean>() — якщо request має req.context.get(SKIP_AUTH), пропустити. next(modifiedReq) для продовження chain."
      senior: "Production auth interceptor має враховувати: 1) Token refresh — якщо 401, спробувати оновити token і retry request. 2) Race conditions — якщо кілька запитів отримали 401 одночасно, тільки один повинен робити refresh (token refresh deduplication через BehaviorSubject і switchMap). 3) Infinite retry prevention — якщо refresh теж fail, logout і redirect до login. 4) Skip auth для specific requests через HttpContext. Pattern: BehaviorSubject<boolean>(false) для isRefreshing, switchMap що чекає нового token — це класичний pattern для token refresh без race conditions."
      staff: "Token refresh interceptor pattern — типова задача на Senior/Staff інтерв'ю. Архітектурні аспекти: 1) Token storage (memory vs localStorage vs httpOnly cookie) — компроміс між security і UX. 2) Interceptor як глобальний cross-cutting concern — зміни в interceptor впливають на всі HTTP calls в додатку. 3) Testing: interceptor повинен мати unit tests для: happy path, 401 + refresh success, 401 + refresh fail (logout), concurrent 401 deduplication. 4) Для multi-tenant apps: dynamic auth headers на основі поточного tenant контексту — inject через signals. 5) withInterceptors() vs class-based providers — functional підхід у standalone apps дозволяє lazy-loaded feature modules мати власні interceptors через withInterceptorsFromDi() або route-level providers."
    commonMistakes:
      - "Не обробляють token refresh race condition — кілька одночасних запитів після expiry викликають кілька refresh attempts"
      - "Зберігають token у HttpContext щоб передати в interceptor — HttpContext призначений для metadata, не для secrets"
    relatedQuestions: ["b8t2q1", "b8t2q3", "b8t3q1"]
  - id: "b8t2q3"
    level: "senior"
    question: "Як реалізувати interceptor що дедуплікує однакові HTTP запити (request deduplication)?"
    referenceAnswers:
      junior: "Request deduplication означає що якщо один і той самий запит виконується кілька разів одночасно, виконується тільки один реальний HTTP запит, а всі підписники отримують його результат."
      mid: "Для deduplication interceptor: зберігати Map<string, Observable<HttpEvent<unknown>>> де key — це 'METHOD:URL:params'. Якщо request в cache — повернути cached Observable. Якщо ні — виконати next(req), зберегти в cache з shareReplay(1), і видалити після completion. Cache key генерується з req.method, req.urlWithParams. Важливо: тільки для GET/HEAD (idempotent) запитів — POST/PUT не дедуплікуються."
      senior: "Production deduplication interceptor: 1) Cache key включає method, URL, params, і optionally headers що впливають на response (Accept, locale). 2) ShareReplay(1) з refCount: true — щоб cache очищався після completion. 3) Error handling: якщо request fail, треба видалити з cache щоб retry можливий. 4) Cache TTL: деякі GET запити варто кешувати на короткий час (seconds) — тоді shareReplay недостатньо, потрібен explicit expiry. 5) Exclude: не кешувати requests з Authorization headers що можуть мати user-specific responses. 6) HttpContext token: DEDUPLICATE = new HttpContextToken<boolean>(() => true) — opt-in/opt-out control."
      staff: "Request deduplication — це один з кількох HTTP-level caching patterns. Architectural decision: HTTP interceptor vs service-level caching vs SW cache vs HTTP Cache-Control headers. HTTP interceptor deduplication підходить для: in-flight request deduplication (не довгостроковий cache). Для enterprise apps: комбінація — SW cache для static assets, HTTP Cache-Control для API, interceptor deduplication для concurrent request scenarios (parallel component initialization). Memory management: WeakMap не підходить (keys primitives), потрібен LRU cache або Map з explicit cleanup. Тестування deduplication interceptor: потрібні marble tests для RxJS timing або TestScheduler щоб перевірити що два одночасних requests справді share один HTTP call."
    commonMistakes:
      - "Дедуплікують POST запити — POST не idempotent, кожен виклик має side effect"
      - "Не видаляють з cache при error — наступний request отримує той самий error замість retry"
    relatedQuestions: ["b8t2q2", "b8t2q4"]
  - id: "b8t2q4"
    level: "staff"
    question: "Як організувати interceptors у великому Angular додатку з кількома API доменами і різними auth схемами?"
    referenceAnswers:
      junior: "Можна мати кілька interceptors для різних задач і кожен перевіряє URL щоб вирішити чи обробляти запит."
      mid: "Для різних API доменів: умовна логіка в interceptors (if url.includes('api1.example.com')), або окремі interceptors для кожного API з URL перевіркою. provideHttpClient() з withInterceptors([...]) — глобальні. Для локальних interceptors: provide на рівні компонента або lazy module."
      senior: "Стратегії для multi-domain: 1) URL-based routing в interceptors через prefix check. 2) HttpContext tokens для per-request metadata (AUTH_SCHEME = new HttpContextToken<'bearer' | 'api-key' | 'none'>()). 3) Angular 15+ feature: провайдери на рівні route — lazy loaded module може overrideHttpClient providers. 4) Окремий EnvironmentInjector для різних HttpClient instances — але це складно і рідко потрібно."
      staff: "Enterprise multi-domain HTTP architecture: 1) Single HttpClient instance з routing interceptors — простіше але всі interceptors виконуються для кожного request. 2) Multiple HttpClient tokens — inject('INTERNAL_HTTP') vs inject('EXTERNAL_HTTP') — складніше але clean separation. Pattern 2 реалізується через: provide HttpClient через InjectionToken, кожен token має власний провайдер з withInterceptors(). 3) HttpContext is the recommended approach для modern Angular — SKIP_AUTH, AUTH_SCHEME, RETRY_COUNT tokens передаються в request metadata. 4) Interceptor composition: base interceptors (logging, loading) → domain interceptors (auth для API1, API key для API2). 5) Testing matrix: кожна комбінація (domain × auth scheme) потребує тест. 6) Observability: logging interceptor повинен sanitize sensitive headers перед логуванням — ніколи не логувати Authorization values."
    commonMistakes:
      - "Роблять один God interceptor з довгими if-else ланцюгами для різних API — не maintainable"
      - "Логують повні headers включаючи Authorization — security issue в production logs"
    relatedQuestions: ["b8t2q2", "b8t2q3", "b8t3q1"]
---

## Core Concept

**English definition:** HTTP Interceptors are middleware functions (or classes) that sit in the HttpClient pipeline between the caller and the HttpBackend, allowing modification of outgoing requests and incoming responses in a centralized, reusable way.

**Пояснення:** Interceptors — це фільтри що працюють як конвеєр для кожного HTTP запиту. Вони реалізують chain of responsibility: кожен interceptor може обробити, модифікувати або замінити request/response і передати його далі. Використовуються для cross-cutting concerns — логіки яку не хочеться дублювати в кожному сервісі.

**Яку проблему вирішує:** Без interceptors кожен HTTP call потребував би: додавати auth header, обробляти 401, логувати, показувати loading spinner. Interceptors виносять цю логіку в одне місце, дотримуючись DRY принципу для HTTP infrastructure.

**Як працює під капотом:** HttpClient inject(HttpHandler) — перший handler є composited interceptor chain. provideHttpClient(withInterceptors([fn1, fn2])) будує chain: fn1(req, (r) => fn2(r, (r2) => backend.handle(r2))). Кожен interceptor отримує `(req, next)` де next — наступний handler. При виклику next(req) запит рухається вперед. Observable що повертається — це response pipeline, де interceptors можуть додавати tap(), catchError(), map() на зворотньому шляху.

**Trade-offs та обмеження:**
- Interceptors виконуються для КОЖНОГО HTTP запиту — expensive operations в interceptor = performance degradation
- Ordering має значення і не завжди очевидний — потрібна документація
- Функціональні interceptors (Angular 15+) vs class-based (legacy) — два стилі в одному проекті це confusion
- Global error handling в interceptor може приховати специфічні errors від компонентів

**Версійність:**
- Angular 4.3: HttpInterceptor interface введено разом з HttpClient
- Angular 12: HttpContext API — type-safe metadata для interceptors
- Angular 15: Functional interceptors (HttpInterceptorFn), provideHttpClient(withInterceptors(...))
- Angular 15+: Class-based HttpInterceptor все ще підтримується але не recommended для нових standalone apps

## Deep Details

### Edge Cases

**Interceptor order для response:** Request йде через interceptors в порядку реєстрації [A, B, C] → backend. Response проходить у зворотньому порядку: backend → C → B → A. Це важливо для logging (має бути перший для request, останній для response щоб бачити фінальний стан).

**next() повертає Observable — не void:** Interceptor ПОВИНЕН повернути Observable. Якщо не повернути next(req) — chain обривається і response ніколи не прийде. Типова помилка новачків.

**HttpRequest immutability:** `req.headers.set('X-Custom', 'value')` повертає новий HttpHeaders але НЕ оновлює req.headers. Потрібно: `req.clone({ headers: req.headers.set('X-Custom', 'value') })`.

**inject() в функціональних interceptors:** inject() працює тільки в injection context. Функціональні interceptors викликаються в injection context (Angular injector), тому inject(MyService) валідно. Але якщо interceptor викликає inject() асинхронно (в subscribe callback) — це поза injection context і кине помилку.

**Retrying after 401 — race condition:** Якщо 5 запитів одночасно отримали 401 і кожен запускає token refresh — це 5 refresh calls. Потрібна deduplication через shared isRefreshing$ BehaviorSubject.

### Junior vs Senior Understanding

**Junior розуміє:** Як написати basic interceptor що додає header або логує. Знає що interceptors реєструються в провайдерах.

**Senior розуміє:**
- Request vs Response phase і reverse order для response
- HttpRequest immutability і req.clone() pattern
- Functional interceptors (Angular 15+) та inject() в injection context
- Token refresh race condition і pattern для вирішення (BehaviorSubject + switchMap)
- HttpContext для conditional interceptor behavior

**Staff розуміє:**
- Multi-domain interceptor routing strategies
- HttpClient scoping (route-level providers для feature modules)
- Security implications interceptors (не логувати Authorization values)
- Interceptor chain design principles (single responsibility per interceptor)
- Performance considerations (lazy inject, avoid expensive sync operations)

### Deprecation & Migration Path

**Class-based interceptors (legacy, still works but deprecated style):**
```typescript
// Old style (still works in Angular 21)
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req.clone({ headers: req.headers.set('Authorization', 'Bearer token') }));
  }
}
// Registration (NgModule):
{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
```

**Modern functional interceptors (recommended):**
```typescript
// New style (Angular 15+)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) return next(req);
  return next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }));
};
// Registration:
provideHttpClient(withInterceptors([authInterceptor]))
```

Migration: Перетвори клас в функцію. `constructor injection` → `inject()`. `next.handle(req)` → `next(req)`.

### Connections to Other Concepts

- **HttpClient (b8t1):** Interceptors є частиною HttpClient pipeline
- **Error Handling (b8t3):** Error interceptor використовує catchError, retry, throwError
- **DI / inject() (b5t4):** inject() в функціональних interceptors вимагає injection context
- **Guards (b6t3):** Аналогічний functional pattern (CanActivateFn) — обидва функції з inject()
- **Signals (b9t4):** Token service може expose token як Signal для reactive reading в interceptor

## Examples

### Basic Usage

```typescript
// auth.interceptor.ts — functional style (Angular 15+)
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

// HttpContext token for skipping auth
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Skip auth if explicitly requested
  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const token = inject(AuthService).getAccessToken();
  if (!token) {
    return next(req);
  }

  // HttpRequest is immutable — must use clone()
  const authorizedReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(authorizedReq);
};
```

```typescript
// logging.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          console.log(`[HTTP] ${req.method} ${req.url} → ${event.status} (${duration}ms)`);
        }
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        console.error(`[HTTP] ${req.method} ${req.url} → ERROR (${duration}ms)`, error.status);
      },
    }),
    finalize(() => {
      // Runs whether success or error (like try/finally)
    }),
  );
};
```

```typescript
// app.config.ts — registering interceptors (order matters!)
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        loggingInterceptor, // First in chain for requests, last for responses
        authInterceptor,    // Adds auth before request reaches backend
        // errorInterceptor, // Handles errors after auth
      ])
    ),
  ],
};
```

### Production Scenario

```typescript
// token-refresh.interceptor.ts — handles 401 with token refresh
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, throwError, Observable } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Another request is already refreshing — wait for new token
        return refreshTokenSubject.pipe(
          filter((token): token is string => token !== null),
          take(1),
          switchMap(token =>
            next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }))
          ),
        );
      }

      isRefreshing = true;
      refreshTokenSubject.next(null); // Block concurrent retries

      return authService.refreshToken().pipe(
        switchMap(newToken => {
          refreshTokenSubject.next(newToken);
          return next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${newToken}`) }));
        }),
        catchError(refreshError => {
          authService.logout();
          return throwError(() => refreshError);
        }),
        finalize(() => {
          isRefreshing = false;
        }),
      );
    }),
  );
};
```

### Anti-Example

```typescript
// WRONG: Multiple critical mistakes
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

@Injectable()
export class BadInterceptor implements HttpInterceptor {
  private authService = inject(AuthService); // WRONG: inject() in class field outside constructor

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // WRONG: Mutating HttpRequest directly (immutable!)
    // req.headers.set('Authorization', 'Bearer token'); // This returns new HttpHeaders, not mutating req!

    // WRONG: Not returning next.handle() result
    next.handle(req); // Response Observable is ignored — component never gets response!

    // WRONG: Returning something that's not the Observable chain
    return next.handle(req.clone({
      headers: req.headers.set('Authorization', 'Bearer hardcoded') // WRONG: hardcoded token
    }));
    // Also WRONG: not handling the case where token is null/undefined
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Not returning `next(req)` or `next.handle(req)` | Pipeline breaks — subscriber never receives response Observable | Always return `return next(req).pipe(...)` or just `return next(req)` |
| Mutating `req` directly: `req.headers.set(...)` | HttpRequest is immutable — `headers.set()` returns a new object, original req unchanged | Use `req.clone({ headers: req.headers.set('key', 'value') })` |
| Multiple token refresh calls on concurrent 401s | Race condition: 3 simultaneous 401s trigger 3 refresh calls, tokens invalidate each other | Deduplication pattern: `BehaviorSubject` + `isRefreshing` flag + `switchMap` |
| One God interceptor handling auth + logging + errors | Low cohesion, hard to test, hard to disable one concern without affecting others | Separate interceptors by concern: authInterceptor, loggingInterceptor, errorInterceptor |
| Logging Authorization header values | Security vulnerability: token values in application logs can be exfiltrated | Log only header presence: `Authorization: [PRESENT]` or sanitize before logging |

## Interview Block

### [L1 — Warm-up] Що таке HTTP interceptors і для чого вони використовуються?

**Signal being tested:** Базове розуміння middleware pattern в HTTP layer і конкретних use cases.

**What the interviewer expects:** Кандидат перераховує реальні use cases (auth, logging, error handling, loading) і розуміє що interceptors централізують cross-cutting concerns.

**How to probe deeper:** "Як interceptor дізнається про response, а не тільки request?"

**Reference answer:** HTTP interceptors — це middleware в HttpClient pipeline. Вони перехоплюють і запит (до відправки) і відповідь (після отримання). Типові use cases: додавання Authorization header, централізована обробка помилок (401 → refresh token, 500 → show error), logging request/response з timing, показ loading spinner. Interceptor отримує request і next handler, може modify request, виклика next(req) щоб отримати response Observable, і може modify response через pipe().

**Common mistakes:** Думають що interceptors тільки для request — вони також обробляють response через pipe() на Observable що повертає next().

---

### [L2 — Mid] Напиши functional interceptor для додавання Authorization header і поясни чому потрібен clone().

**Signal being tested:** Практичне знання functional interceptor syntax (Angular 15+) і розуміння immutability HttpRequest.

**What the interviewer expects:** Правильний код з req.clone(), inject() для TokenService, і conditional logic (skip якщо немає token або request marked as public).

**How to probe deeper:** "Що станеться якщо ти зробиш `req.headers.set('Authorization', token)` без clone()?"

**Reference answer:** `req.headers.set()` повертає НОВИЙ HttpHeaders, але HttpRequest.headers не оновлюється бо HttpRequest immutable. Щоб змінити request потрібен `req.clone({ headers: newHeaders })` — це створює новий HttpRequest з новими headers. Functional interceptor: `const authInterceptor: HttpInterceptorFn = (req, next) => { const token = inject(TokenService).token; if (!token) return next(req); return next(req.clone({ headers: req.headers.set('Authorization', \`Bearer ${token}\`) })); }`.

**Common mistakes:** Роблять `req.headers.set(...)` і не повертають clone — headers не застосовуються, але код не кидає помилку.

---

### [L3 — Senior] Як реалізувати token refresh при 401 без race condition якщо кілька запитів одночасно отримали 401?

**Signal being tested:** Здатність розпізнати і вирішити concurrency проблему в async code з RxJS — це класична senior-level задача.

**What the interviewer expects:** Опис проблеми (N concurrent 401s → N refresh calls → tokens invalidate each other) і рішення через deduplication з BehaviorSubject.

**How to probe deeper:** "Навіщо `refreshTokenSubject.next(null)` на початку refresh і `refreshTokenSubject.next(newToken)` після success?"

**Reference answer:** Race condition: 5 запитів одночасно отримують 401 → всі 5 намагаються refresh → перший refresh succeeds, invalidating old token → наступні 4 refresh fail. Рішення: `isRefreshing` flag + `refreshTokenSubject = new BehaviorSubject(null)`. Перший 401: встановлює isRefreshing = true, refreshTokenSubject.next(null). Наступні 401: бачать isRefreshing = true, підписуються на refreshTokenSubject і чекають поки token не null. Після успішного refresh: refreshTokenSubject.next(newToken) — всі waiting requests retry з новим token. finalize(): isRefreshing = false незалежно від результату.

**Common mistakes:** Використовують simple boolean `isRefreshing` без Subject — concurrent requests не знають коли retry.

---

### [L4 — Staff/Principal] Як спроектувати HTTP interceptor architecture для enterprise додатку з кількома API доменами і різними auth схемами?

**Signal being tested:** Системне мислення про HTTP infrastructure — routing, security, testability, maintainability для великого проекту.

**What the interviewer expects:** Опис трейдоффів між підходами (URL-based routing vs HttpContext vs multiple HttpClient instances), security considerations, interceptor ordering principles.

**How to probe deeper:** "Як тестувати interceptors в isolation і як переконатись що вони не впливають один на одного?"

**Reference answer:** Для multi-domain enterprise: HttpContext tokens (SKIP_AUTH, AUTH_SCHEME enum) — рекомендований підхід — type-safe metadata без URL checks. URL-based routing (if url.includes('api1')) — простіше але brittle (URL зміниться). Multiple HttpClient instances — максимальна isolation але складна DI конфігурація. Interceptor ordering principle: logging (outermost) → auth → error handling → backend. Security: logging interceptor sanitizes sensitive headers перед output. Testing: кожен interceptor тестується окремо через HttpClientTestingModule; integration tests перевіряють chain behavior.

**Common mistakes:** Один God interceptor з all logic — impossible to test in isolation.

## Summary

### Key Points

- Interceptors реалізують chain of responsibility: request йде через [A→B→C→backend], response — у зворотньому порядку [backend→C→B→A]
- Functional interceptors (Angular 15+) — recommended: `HttpInterceptorFn` type, підтримують `inject()` в injection context
- HttpRequest — immutable: завжди використовуй `req.clone({ headers: req.headers.set(...) })` для модифікації
- ОБОВ'ЯЗКОВО повертати `return next(req)` або `return next(req).pipe(...)` — без цього response Observable втрачається
- HttpContext (Angular 12+) — type-safe metadata для conditional interceptor behavior (`SKIP_AUTH`, `AUTH_SCHEME` tokens)
- Token refresh race condition — класична проблема: вирішується через `BehaviorSubject` + `isRefreshing` flag deduplication
- Single responsibility: один interceptor = одна задача (auth, logging, error handling — окремо)

### Elevator Pitch (2 minutes)

HTTP interceptors — це middleware в Angular's HttpClient pipeline. Кожен interceptor отримує request і next handler, може modify request через req.clone(), виклика next(req) щоб отримати response Observable, і може transform response через pipe(). З Angular 15+ рекомендований стиль — functional interceptors: `const myInterceptor: HttpInterceptorFn = (req, next) => { ... return next(modifiedReq).pipe(...) }`. Реєстрація через `provideHttpClient(withInterceptors([myInterceptor]))`. Ключові правила: завжди clone() для модифікації запиту, завжди повертати next(), використовувати HttpContext для per-request metadata (SKIP_AUTH token), кожен interceptor — одна відповідальність. Типові use cases: auth token attachment, centralized error handling, request logging, loading state management.
