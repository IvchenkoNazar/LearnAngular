---
title: "HttpClient — HTTP Requests in Angular"
block: 8
topic: 1
slug: "httpclient"
difficulty: 2
sinceVersion: "4.3"
tags: ["HttpClient", "provideHttpClient", "HTTP", "Observable", "typed-requests", "withFetch"]
relatedTopics: ["http-interceptors", "error-handling-http", "rxjs-higher-order-operators", "reactive-forms"]
interviewQuestions:
  - id: "b8t1q1"
    level: "junior"
    question: "Як підключити HttpClient в Angular standalone додатку і зробити GET запит?"
    referenceAnswers:
      junior: "В standalone додатку HttpClient підключається через provideHttpClient() в app.config.ts. Потім інжектуємо HttpClient в компонент або сервіс і використовуємо методи get(), post(), put(), delete() для HTTP запитів. Всі методи повертають Observable."
      mid: "В standalone додатку: provideHttpClient() в providers масиві в app.config.ts замість старого HttpClientModule. HttpClient.get<T>(url) повертає Observable<T> — тип response можна вказати generic параметром. Рекомендований pattern: HTTP calls в сервісі, не в компоненті. Observable підписка в компоненті через async pipe або subscribe(). provideHttpClient() приймає features: withInterceptors(), withFetch(), withJsonpSupport(), withXsrfConfiguration()."
      senior: "HttpClient — це high-level HTTP abstraction над XHR або Fetch API. provideHttpClient() з Angular 15+ замінює HttpClientModule в standalone архітектурі. Під капотом: HttpClient.get() створює Observable що lazy (не виконується до subscribe). Кожен subscribe() ініціює окремий HTTP запит — це важливий нюанс для production. Типізація: HttpClient.get<ResponseType>() — TypeScript generic для type inference. withFetch() feature (Angular 18+, stable 19) переключає transport layer з XHR на Fetch API — важливо для SSR де XHR недоступний у browser-compatible way. RequestOptions дозволяють встановлювати headers, params, responseType, observe (body | response | events). observe: 'response' повертає повний HttpResponse з headers і status code. observe: 'events' дає HttpSentEvent, HttpHeadersReceivedEvent, HttpDownloadProgressEvent — для upload/download progress."
      staff: "HttpClient архітектурно побудований на двох рівнях: HttpBackend (низький — транспорт XHR/Fetch) і HttpHandler chain (middleware chain через interceptors). провайдер HttpClient inject(HttpHandler) — перший interceptor в chain. HttpRequest і HttpResponse — immutable value objects (record-like) — це дизайн-рішення для predictable state в interceptors. Для enterprise: HttpClient повинен бути wrapped в domain services з typed methods — ніколи не inject HttpClient напряму в компоненти. withFetch() і SSR: Fetch API natively available в Node.js 18+, тому Angular Universal і withFetch() добре поєднуються — TransferState можна використовувати для hydration. Performance: HTTP calls в Services дозволяють shareReplay(1) для caching без дублювання запитів. Breaking changes в HttpClient між versions: v15 — provideHttpClient(), v18 — withFetch() stable, v14 — typed HttpClient (HttpClient.get<T> enforces response type). Migration від HttpClientModule до provideHttpClient(): просто замінити import в AppModule або app.config — API ідентичний."
    commonMistakes:
      - "Підписуються на Observable кілька разів — кожен subscribe() робить окремий HTTP запит"
      - "Import HttpClientModule в standalone app замість provideHttpClient()"
      - "Не відписуються від HTTP observables (хоча HttpClient auto-completes після response)"
    relatedQuestions: ["b8t1q2", "b8t1q3"]
  - id: "b8t1q2"
    level: "mid"
    question: "Які опції observe і responseType надає HttpClient і навіщо вони потрібні?"
    referenceAnswers:
      junior: "observe вказує що отримати у відповідь: body (за замовчуванням), response (повний HttpResponse), events (всі події включно з прогресом). responseType вказує формат: json, text, blob, arraybuffer."
      mid: "observe опція: 'body' (default) — повертає parsed response body з типом T; 'response' — повертає HttpResponse<T> з headers, status, statusText, body; 'events' — повертає Observable<HttpEvent<T>> що emit HttpSentEvent, HttpHeadersReceivedEvent, HttpDownloadProgressEvent, HttpResponse — потрібно для progress bars. responseType: 'json' (default) — автоматично JSON.parse(); 'text' — string; 'blob' — для file downloads; 'arraybuffer' — для binary data. Комбінація: observe: 'response' + responseType: 'blob' — для file downloads з status check."
      senior: "Типова помилка: responseType і generic type T є незалежними. get<MyType>() generic parameter — TypeScript compile-time only; responseType — runtime parsing. Якщо вказати responseType: 'text' але get<MyType>(), TypeScript type буде MyType але реально отримаєте string. Для file downloads production pattern: { observe: 'events', responseType: 'blob', reportProgress: true } — дає прогрес завантаження. HttpDownloadProgressEvent.loaded та total для progress percentage. Важливо: reportProgress: true потрібно передати явно навіть якщо observe: 'events' — інакше progress events не emit. HttpSentEvent і HttpHeadersReceivedEvent useful для latency measurement. Для великих uploads: observe: 'events' + reportProgress: true + HttpUploadProgressEvent."
      staff: "observe і responseType — це runtime pipeline configuration що впливає на HttpBackend поведінку. При responseType: 'json' HttpBackend виконує JSON.parse() і повертає parsed object. При responseType: 'text' — raw string. Архітектурно: HttpResponse.headers — це HttpHeaders immutable map, HttpResponse.body — typed T (або null для 204 No Content). Для API gateway patterns де різні endpoints повертають різні content types: factory pattern для HttpClient options. Для streaming responses (Server-Sent Events): HttpClient не supports SSE natively — потрібен EventSource або withFetch() + Readable streams. Для enterprise file management service: observe: 'events' + progress tracking + cancel token (через Subject + takeUntil) — це standard pattern."
    commonMistakes:
      - "Вказують get<MyType>() і думають що responseType: 'json' встановлюється автоматично — воно й так json за замовчуванням, але generic не пов'язаний з responseType"
      - "Забувають reportProgress: true при observe: 'events' — progress events не приходять"
    relatedQuestions: ["b8t1q1", "b8t1q3", "b8t2q1"]
  - id: "b8t1q3"
    level: "mid"
    question: "Як правильно передавати HTTP headers і query params в HttpClient?"
    referenceAnswers:
      junior: "Headers передаються через options об'єкт: { headers: {'Authorization': 'Bearer token'} }. Query params через params: { search: 'query', page: '1' }."
      mid: "HttpHeaders і HttpParams — це immutable classes: кожен .set(), .append(), .delete() повертає новий instance (не mutates). Правильний паттерн: const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`).set('Content-Type', 'application/json'). HttpParams: new HttpParams().set('page', '1').set('limit', '10') або { fromObject: {page: 1, limit: 10} }. Для масивів: httpParams.append('tags', 'angular').append('tags', 'rxjs') — два параметри з однаковим ключем."
      senior: "Immutability HttpHeaders/HttpParams — це дизайн для safety в interceptors (interceptor не може мутувати request). Для динамічних headers: HttpHeaders конструктор приймає Record<string, string | string[]> — зручніше ніж chain. HttpParams.fromString('page=1&limit=10') для parsing query string. Edge case: case-insensitivity headers — HTTP spec каже headers case-insensitive, HttpHeaders нормалізує до lowercase. Якщо потрібно передати null значення в params — HttpParams їх ігнорує: потрібно явно не додавати параметр. Для authentication: Authorization header передається через interceptor (не в кожному call) — це separation of concerns. HttpContext (Angular 12+) — metadata для interceptors без забруднення headers."
      staff: "HttpHeaders immutability — це прямий наслідок requirement: interceptors не повинні mutate request — вони clone і modify. Внутрішньо HttpHeaders uses Map<string, string[]> (array для multi-value headers). Для enterprise API clients: TypeScript typed params через generic factory: createSearchParams<T extends Record<string, string | number | boolean>>(params: T): HttpParams. HttpContext (InjectionToken-based metadata) — architectural решення для passing out-of-band data до interceptors без HTTP spec violation. Наприклад: skipAuth token, skipLoading token — interceptors читають context і вирішують як обробляти request. Version history: HttpContext introduced Angular 12."
    commonMistakes:
      - "Мутують HttpHeaders: headers.set() не повертає void, а новий HttpHeaders — стара помилка"
      - "Передають number в HttpParams.set() — приймає тільки string; потрібно .toString()"
    relatedQuestions: ["b8t1q2", "b8t2q1"]
  - id: "b8t1q4"
    level: "senior"
    question: "Що таке withFetch() feature для provideHttpClient і які переваги та обмеження Fetch API transport?"
    referenceAnswers:
      junior: "withFetch() переключає HttpClient використовувати Fetch API замість XHR для HTTP запитів."
      mid: "withFetch() — це feature для provideHttpClient() що замінює XHR backend на Fetch API backend. Переваги: нативна підтримка в сучасних браузерах, краща сумісність з SSR (Node.js 18+ має вбудований Fetch), підтримка streaming responses, менший bundle size (не потрібен XHR polyfill). Обмеження: немає upload progress events (Fetch API не підтримує upload progress на рівні специфікації), не підтримується в IE (але IE вже не підтримується Angular)."
      senior: "withFetch() (stable в Angular 19+) замінює HttpXhrBackend на HttpFetchBackend. Архітектурні відмінності: 1) XHR підтримує upload progress через XMLHttpRequest.upload.onprogress — Fetch API цього не має. 2) Fetch повертає ReadableStream для body — теоретично streaming підтримка. 3) В SSR контексті: XHR потребує polyfill в Node.js, Fetch нативно доступний з Node 18+. 4) CORS behavior: однаковий для обох. 5) withFetch() і interceptors: interceptors продовжують працювати — вони на рівні HttpHandler, не транспорту. Edge case: якщо app використовує upload progress reporting, withFetch() не підходить — потрібен XHR. Cancel: обидва підтримують cancel (XHR через abort(), Fetch через AbortController) — HttpClient абстрагує це через unsubscribe від Observable."
      staff: "withFetch() є стратегічним вибором для майбутнього Angular. Fetch API — стандарт W3C, XHR — legacy. Для Angular Universal / SSR: withFetch() є рекомендованим — Fetch в Node.js 18+ означає що немає потреби у node-fetch або xhr2 polyfills. Performance: Fetch API може бути незначно ефективнішим в сучасних браузерах через нативну реалізацію. Architectural decision для team: якщо app використовує upload progress — залиш XHR або implement work-around; якщо SSR є пріоритетом — migrate до withFetch(). Breaking change: перехід withFetch() не ламає interceptors, headers, params API. Тестування: FetchBackend можна mock через HttpClientTestingModule незалежно від transport — Angular testing infrastructure абстрагує transport layer."
    commonMistakes:
      - "Думають що withFetch() ламає interceptors — ні, interceptors на рівні HttpHandler, незалежно від транспорту"
      - "Використовують withFetch() і очікують upload progress — Fetch API не підтримує upload progress"
    relatedQuestions: ["b8t1q1", "b8t2q1"]
---

## Core Concept

**English definition:** HttpClient is Angular's built-in HTTP client service that provides a simplified API for making HTTP requests, returning RxJS Observables for each request with support for typed responses, request/response interception, and progress tracking.

**Пояснення:** HttpClient — це Angular's abstraction над браузерним XHR або Fetch API. Він повертає Observable для кожного запиту, що добре інтегрується з RxJS pipeline. Замість прямої роботи з XMLHttpRequest або fetch(), HttpClient надає типізований, тестований і interceptable API.

**Яку проблему вирішує:** До появи HttpClient (Angular 4.3) Angular використовував Http service (deprecated), який повертав Observable<Response> без типізації. HttpClient вирішує: 1) Типізовані відповіді через generics, 2) Автоматичний JSON parsing, 3) Interceptor pipeline для cross-cutting concerns, 4) Легке мокування в тестах через HttpClientTestingModule.

**Як працює під капотом:** HttpClient побудований на ланцюжку HttpHandler. Кожен interceptor є HttpHandler що делегує до наступного. Останній handler — HttpBackend (XHR або Fetch) що реально виконує запит. HttpClient.get() створює HttpRequest object і передає його через chain: interceptor1 → interceptor2 → HttpBackend → response → interceptor2 → interceptor1 → subscriber. Кожен HttpRequest і HttpResponse — immutable objects з методом clone() для створення модифікованих копій.

**Trade-offs та обмеження:**
- Lazy Observables — HTTP запит не виконується до subscribe(). Це важливо для performance але може дивувати новачків
- Кожен subscribe() створює новий HTTP запит — потрібен shareReplay() для caching
- HttpClient не підтримує Server-Sent Events (SSE) — потрібен EventSource
- Upload progress недоступний з withFetch() — тільки з XHR backend

**Версійність:**
- Angular 4.3: HttpClient введено як заміна deprecated Http service
- Angular 12: HttpContext API — metadata для interceptors
- Angular 14: Типізовані форми (окремо), HttpClient type inference покращено
- Angular 15: provideHttpClient() для standalone apps, withInterceptors(), withFetch() (developer preview)
- Angular 19: withFetch() stable
- Deprecated: HttpClientModule (все ще підтримується але рекомендовано провайдер-based підхід)

## Deep Details

### Edge Cases

**Multiple subscriptions = multiple requests:** Observable від HttpClient.get() — це cold Observable. Кожен `.subscribe()` виконує новий HTTP запит. Для caching: `shareReplay({ bufferSize: 1, refCount: false })`.

**204 No Content response:** HttpResponse.body буде null. Якщо типізовано як `Observable<MyType>`, TypeScript не попередить що body може бути null — потрібна перевірка.

**Cancellation через unsubscribe:** При unsubscribe від HTTP Observable, Angular скасовує XHR запит (XHR.abort()) або AbortController.abort() для Fetch. Це важливо для компонентів що destroy до завершення запиту.

**HttpParams з масивами:** `HttpParams.set('tag', ['a', 'b'])` додасть `?tag=a,b`. Для `?tag=a&tag=b` потрібен `.append()` двічі або fromObject з масивом.

**XSRF/CSRF автоматично:** provideHttpClient() за замовчуванням включає XSRF protection — читає XSRF-TOKEN cookie і додає X-XSRF-TOKEN header. Вимкнути: `withNoXsrfProtection()` або налаштувати через `withXsrfConfiguration()`.

### Junior vs Senior Understanding

**Junior розуміє:** Як зробити GET/POST запит, передати headers і params, підписатися на Observable.

**Senior розуміє:**
- Cold Observable природу HTTP calls — кожен subscribe = новий запит
- Різницю між observe: body/response/events і коли яку використовувати
- Immutability HttpHeaders і HttpParams (кожен метод повертає новий instance)
- withFetch() trade-offs (no upload progress, SSR benefits)
- HttpContext для out-of-band interceptor metadata (Angular 12+)
- shareReplay pattern для HTTP caching

**Staff розуміє:**
- HttpBackend vs HttpHandler архітектуру
- XHR vs Fetch transport implications для SSR, streaming, progress
- Typed factory patterns для enterprise HTTP clients
- HttpClient testing infrastructure — як вона абстрагує transport для unit tests

### Deprecation & Migration Path

**Deprecated: Http (старий сервіс до v4.3)**
```typescript
// Old (removed)
import { Http } from '@angular/http';
// New
import { HttpClient } from '@angular/common/http';
```

**Deprecated: HttpClientModule (все ще функціонує але not recommended for new apps)**
```typescript
// Old pattern (NgModule-based apps)
@NgModule({ imports: [HttpClientModule] })
// New pattern (standalone)
export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))]
};
```

Migration: замінити `HttpClientModule` на `provideHttpClient()` в providers.

### Connections to Other Concepts

- **HTTP Interceptors (b8t2):** Interceptors — middleware layer поверх HttpClient
- **Error Handling (b8t3):** catchError, retry, throwError patterns для HttpClient Observables
- **RxJS Higher-Order Operators (b10t1):** switchMap, concatMap для chaining HTTP requests
- **Reactive Forms (b7t2):** HTTP часто поєднується з forms (submit → POST request)
- **Signals (b9t4):** `toSignal(this.http.get<T>(url))` для resource loading з signals

## Examples

### Basic Usage

```typescript
// app.config.ts — provider setup
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()), // Use Fetch API transport
  ],
};
```

```typescript
// user.service.ts — HTTP service pattern
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.example.com';

  // Typed GET request
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  // With query params
  getUsers(page: number, limit: number, search?: string): Observable<UsersResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<UsersResponse>(`${this.baseUrl}/users`, { params });
  }

  // POST with typed body
  createUser(userData: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, userData);
  }

  // With custom headers
  updateUser(id: number, data: Partial<User>): Observable<User> {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('X-Idempotency-Key', crypto.randomUUID());

    return this.http.put<User>(`${this.baseUrl}/users/${id}`, data, { headers });
  }

  // DELETE
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }
}
```

### Production Scenario

```typescript
// File download with progress tracking
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpDownloadProgressEvent } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';

export interface DownloadProgress {
  loaded: number;
  total: number | null;
  percentage: number | null;
}

@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly http = inject(HttpClient);

  downloadFile(url: string): Observable<Blob | DownloadProgress> {
    return this.http.get(url, {
      responseType: 'blob',
      observe: 'events',
      reportProgress: true, // REQUIRED for progress events
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.DownloadProgress) {
          const progressEvent = event as HttpDownloadProgressEvent;
          return {
            loaded: progressEvent.loaded,
            total: progressEvent.total ?? null,
            percentage: progressEvent.total
              ? Math.round(progressEvent.loaded / progressEvent.total * 100)
              : null,
          } as DownloadProgress;
        }

        if (event.type === HttpEventType.Response) {
          return event.body as Blob;
        }

        return null;
      }),
      filter((v): v is Blob | DownloadProgress => v !== null),
    );
  }
}

// Usage in component with signals
@Component({
  template: `
    <button (click)="startDownload()">Download</button>
    @if (progress()) {
      <progress [value]="progress()!.percentage ?? 0" max="100"></progress>
    }
  `,
})
export class DownloadButtonComponent {
  private readonly downloadService = inject(FileDownloadService);
  progress = signal<DownloadProgress | null>(null);

  startDownload(): void {
    this.downloadService.downloadFile('/api/report.pdf').subscribe({
      next: (result) => {
        if (result instanceof Blob) {
          // Download complete
          const url = URL.createObjectURL(result);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'report.pdf';
          a.click();
          URL.revokeObjectURL(url);
          this.progress.set(null);
        } else {
          this.progress.set(result);
        }
      },
    });
  }
}
```

### Anti-Example

```typescript
// WRONG: Multiple problems
@Component({
  template: `
    <div>{{ user | json }}</div>
    <div>{{ user2 | json }}</div>
  `,
})
export class BadComponent implements OnInit {
  private http = inject(HttpClient); // WRONG: inject HttpClient directly in component
  user: any;
  user2: any;

  // WRONG: Using HttpClientModule in standalone app instead of provideHttpClient()
  // (configured elsewhere but shown here for context)

  ngOnInit(): void {
    // WRONG: two subscriptions = two separate HTTP requests!
    const user$ = this.http.get('https://api.example.com/user/1');
    user$.subscribe(u => this.user = u);   // Request #1
    user$.subscribe(u => this.user2 = u); // Request #2 — separate network call!

    // WRONG: no error handling — unhandled errors crash silently
    // WRONG: no takeUntilDestroyed — though HttpClient auto-completes, this is bad habit
    this.http.get('https://api.example.com/data').subscribe(data => {
      // WRONG: direct response manipulation without typing
      (data as any).items.forEach(() => {}); // runtime error if structure changes
    });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Injecting HttpClient directly in components | Couples component to HTTP layer, hard to test, no reuse | Create a service that wraps HttpClient; component injects the service |
| Multiple subscriptions to the same Observable | Each subscribe() sends a separate HTTP request — 2 subscribers = 2 network calls | Use `shareReplay({ bufferSize: 1, refCount: false })` or subscribe once and store value |
| No type parameter on `http.get()` | Returns `Observable<Object>` — no type safety, runtime errors on shape changes | Always specify: `http.get<User>(url)` |
| Constructing `new HttpHeaders()` and ignoring return value | `headers.set()` does NOT mutate — it returns a new instance; old pattern is silently dropped | Use: `const h = new HttpHeaders().set('key', 'value')` — chain or reassign |
| Missing `reportProgress: true` with `observe: 'events'` | Progress events (HttpDownloadProgressEvent) are not emitted without this flag | Always add `reportProgress: true` when using `observe: 'events'` for tracking |

## Interview Block

### [L1 — Warm-up] Як підключити HttpClient в Angular standalone додатку?

**Signal being tested:** Знання сучасного (standalone era) способу налаштування HttpClient проти застарілого NgModule підходу.

**What the interviewer expects:** Кандидат знає `provideHttpClient()` в app.config.ts, а не застарілий `HttpClientModule` в NgModule.

**How to probe deeper:** "Які features можна передати в provideHttpClient() і для чого вони?"

**Reference answer:** В standalone додатку HttpClient налаштовується через `provideHttpClient()` в `providers` масиві `app.config.ts`. Передається разом з features: `withFetch()` для Fetch API transport, `withInterceptors([myInterceptor])` для функціональних interceptors, `withXsrfConfiguration()` для CSRF налаштувань. HttpClientModule (NgModule-based) все ще підтримується але не рекомендується для нових проектів.

**Common mistakes:** Говорять `HttpClientModule` для standalone app — це застарілий підхід. Для NgModule app він ще валідний, але для standalone — provideHttpClient().

---

### [L2 — Mid] Поясни різницю між `observe: 'body'`, `observe: 'response'` і `observe: 'events'` в HttpClient.

**Signal being tested:** Розуміння різних рівнів деталізації HTTP response і практичне знання коли використовувати кожен.

**What the interviewer expects:** Конкретні use cases для кожного observe рівня, особливо коли потрібен progress tracking.

**How to probe deeper:** "Якщо потрібно показати progress bar при завантаженні файлу — яку опцію використовуєш і що ще потрібно налаштувати?"

**Reference answer:** `observe: 'body'` (default) — повертає тільки parsed response body. `observe: 'response'` — повертає `HttpResponse<T>` з headers, status, statusText і body — потрібно коли важливі headers відповіді або status code. `observe: 'events'` — emit всі HTTP events: sent, headers received, download progress, response — потрібно для progress tracking. Для progress: обов'язково додати `reportProgress: true` окремо, інакше progress events не приходять.

**Common mistakes:** Забувають `reportProgress: true` при `observe: 'events'` і дивуються що прогрес не оновлюється.

---

### [L3 — Senior] Чому Observable від HttpClient.get() є cold і що це означає для production коду?

**Signal being tested:** Глибоке розуміння RxJS cold/hot observable distinction і його прямих наслідків для HTTP caching і performance.

**What the interviewer expects:** Пояснення що кожен subscribe = новий запит, і стратегії як це контролювати (shareReplay, Subject-based caching).

**How to probe deeper:** "Як реалізувати HTTP caching в сервісі щоб перший запит кешувався і подальші підписники отримували кешований результат?"

**Reference answer:** Cold Observable від HttpClient.get() означає що HTTP запит виконується лише при subscribe() і кожен subscriber ініціює незалежний запит. Це безпечно за замовчуванням (немає shared state) але небезпечно якщо один Observable має кілька підписників. Production pattern для caching: `this.users$ = this.http.get<User[]>(url).pipe(shareReplay({ bufferSize: 1, refCount: false }))` — перший subscriber запускає запит, наступні отримують кешований результат. `refCount: false` означає кеш зберігається навіть якщо всі відписались. Альтернатива: Subject + BehaviorSubject pattern для більш explicit caching control.

**Common mistakes:** Ділять один `user$ = http.get(url)` між двома async pipe — два запити в шаблоні.

---

### [L4 — Staff/Principal] Опиши архітектуру HttpClient middleware chain і як це впливає на дизайн enterprise HTTP layer.

**Signal being tested:** Розуміння HttpHandler → interceptors → HttpBackend architecture і здатність спроектувати scalable HTTP infrastructure.

**What the interviewer expects:** Опис HttpHandler chain, immutable request/response, і architectural рекомендації для enterprise (typed API clients, domain services, interceptor responsibilities).

**How to probe deeper:** "Як ти розподілиш відповідальності між кількома interceptors у великому Angular додатку?"

**Reference answer:** HttpClient побудований як chain of responsibility: HttpClient inject HttpHandler (перший в chain). Кожен interceptor — це HttpHandler що може modify request, delegate до next.handle(req), і modify response. Останній — HttpBackend (XHR або Fetch). Immutability: HttpRequest.clone({headers: ...}) — interceptors не мутують, а клонують. Для enterprise: 1) AuthInterceptor — додає Authorization header, 2) LoadingInterceptor — показує/ховає global spinner, 3) ErrorInterceptor — centralized error handling і retry, 4) CachingInterceptor — HTTP-level caching. HttpContext (Angular 12+) дозволяє передавати metadata (skipAuth, skipLoading) без забруднення headers. Domain HTTP services (UserApiService, OrderApiService) wrapping HttpClient з typed methods — ніколи HttpClient напряму в компонентах.

**Common mistakes:** Роблять один "God interceptor" що робить все — auth, logging, error handling, caching. Правильно — один interceptor = одна відповідальність.

## Summary

### Key Points

- HttpClient — Angular's HTTP abstraction що повертає cold Observable для кожного запиту; кожен subscribe() ініціює новий HTTP запит
- `provideHttpClient()` в app.config.ts — сучасний standalone підхід замість deprecated `HttpClientModule`
- Три рівні observe: `body` (default), `response` (full HttpResponse + headers), `events` (progress tracking — потребує `reportProgress: true`)
- HttpHeaders і HttpParams — immutable; кожен `.set()`, `.append()` повертає новий instance
- `withFetch()` переключає transport на Fetch API — краще для SSR (Node.js 18+), але без upload progress support
- HttpContext (Angular 12+) — metadata для interceptors без забруднення HTTP headers
- Production pattern: HTTP calls у сервісах, типізовані generics, `shareReplay` для caching

### Elevator Pitch (2 minutes)

HttpClient — це Angular's HTTP service що абстрагує XHR або Fetch API через RxJS Observable interface. Кожен запит — lazy Observable що виконується тільки при subscribe. Методи get/post/put/delete приймають URL, optional options (headers, params, observe, responseType) і повертають `Observable<T>` де T — тип response body. Налаштовується через `provideHttpClient()` в app.config.ts з features: `withFetch()` для Fetch API, `withInterceptors()` для middleware. Правила production: inject HttpClient в сервісах (не компонентах), завжди типізуй `get<T>()`, використовуй `shareReplay` якщо кілька підписників, `observe: 'events'` + `reportProgress: true` для file download progress.
