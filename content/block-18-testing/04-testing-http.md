---
title: "Testing HTTP Requests"
block: 18
topic: 4
slug: "testing-http"
difficulty: 3
sinceVersion: "2"
tags: ["HttpClientTestingModule", "HttpTestingController", "expectOne", "expectNone", "provideHttpClientTesting", "flush", "error"]
relatedTopics: ["testing-services", "testing-signals-rxjs", "http-interceptors", "unit-testing"]
interviewQuestions:
  - level: "junior"
    question: "Як тестувати Angular сервіс що виконує HTTP запити?"
    referenceAnswers:
      junior: "Треба використовувати HttpClientTestingModule або provideHttpClientTesting() щоб замінити реальний HTTP на fake. HttpTestingController.expectOne() перевіряє запит і flush() відповідає тестовими даними."
      mid: "provideHttpClientTesting() (Angular 15+) або HttpClientTestingModule реєструє fake HttpBackend. TestBed.inject(HttpTestingController) для контролю. Порядок: 1) Викликати service method (підписатись на Observable), 2) httpMock.expectOne(url) — перевіряє і повертає TestRequest, 3) testReq.flush(mockData) — доставляє відповідь, 4) assert результати. afterEach: httpMock.verify()."
      senior: "HttpTestingController synchronously delivers responses — flush() синхронно emit'ить через Observable chain. expectOne() кидає error якщо: 0 requests matched (запит не зроблений) або > 1 matched (кілька requests). expectOne з RequestMatch object: { method: 'POST', url: '/api/users' } — більш specific matching. testReq.request — доступ до actual HttpRequest для перевірки: method, url, body, headers, params. flush(body, { status: 404, statusText: 'Not Found' }) для error responses. Verify() після кожного тесту: перевіряє немає unsatisfied expectations і unmatched requests."
      staff: "HTTP testing architecture: HttpTestingController як synchronous interceptor дозволяє тестувати весь Observable chain через service. Це integration-level test — не тільки service method але і: retry logic, error mapping, response transformation, interceptors. Для чистого unit test: jest.fn() на HttpClient.get() замість HttpTestingController — але втрачається HTTP infrastructure testing. Decision: HttpTestingController для service-level HTTP testing (most cases); jest mock HttpClient для компонентних тестів де service mocked окремо. Scale: великий test suite з HttpTestingController — performance ОК бо немає network. TestRequest.cancel() для тестування request cancellation (switchMap scenarios)."
    commonMistakes:
      - "flush() до subscribe — Observable не чекає response, бо немає subscriber"
      - "Відсутність verify() afterEach — зайві requests проходять непоміченими"
    relatedQuestions: ["b18t4q2", "b18t2q4"]
  - level: "mid"
    question: "Як тестувати HTTP error scenarios та перевіряти request headers/params?"
    referenceAnswers:
      junior: "Для error: flush() з status кодом помилки. Для headers: перевіряємо testReq.request.headers."
      mid: "Error response: testReq.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' }). Network error: testReq.error(new ProgressEvent('error')). В subscribe: error callback перевіряємо. Headers: testReq.request.headers.get('Authorization'). Query params: testReq.request.params.get('page')."
      senior: "Error scenarios: 1) HTTP error (4xx/5xx): flush(body, { status, statusText }), 2) Network error: error(new ProgressEvent('error')), 3) Timeout: error(new ProgressEvent('timeout')). Testing service error handling: subscribe з error callback або expectAsync(firstValueFrom(obs)).toBeRejectedWith(). Headers testing: expect(req.request.headers.get('Authorization')).toBe('Bearer token'). withCredentials: expect(req.request.withCredentials).toBe(true). Body для POST: expect(req.request.body).toEqual({ id: '1', name: 'Test' }). Params: expect(req.request.params.get('sort')).toBe('name')."
      staff: "Comprehensive HTTP testing checklist: happy path (200 + correct data), client error (400, 422 validation), auth error (401 redirect), not found (404), server error (500 + retry?), network error (offline), timeout, concurrent requests (race conditions). Error handling testing є critical — production bugs часто в error paths що мало тестуються. Architectural pattern: service-level error mapping (HTTP errors → domain errors) потрібен окремий test layer: 1) Does service correctly catch HTTP error? 2) Does service correctly transform to domain error? 3) Does caller correctly handle domain error? Три окремих tests, не один."
    commonMistakes:
      - "Тестують тільки happy path, ігнорують 4xx/5xx — production bugs в error handling"
      - "Не перевіряють request body для POST/PUT — service може відправляти неправильні дані"
    relatedQuestions: ["b18t4q1", "b18t4q3"]
  - level: "mid"
    question: "Як тестувати Angular HTTP interceptors?"
    referenceAnswers:
      junior: "Interceptor перехоплює HTTP запити. Для тестування треба налаштувати TestBed з реальним interceptor і MockBackend."
      mid: "Два підходи: 1) Unit test interceptor окремо: mock HttpHandler, перевірити що interceptor трансформує request/response. 2) Integration test: провайдити interceptor разом з provideHttpClientTesting, тестувати через service call — interceptor застосовується автоматично."
      senior: "Interceptor unit test: inject(HttpHandler) mock, interceptor.intercept(mockRequest, mockHandler). Перевірити що: added headers в intercepted request, response transformation, error catching. Integration через провайдери: provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(). Service call → expectOne() → перевірити що request має Authorization header → flush(). Functional interceptors (Angular 15+): тестувати як pure function, не клас. Interceptor chain order тест: два interceptors — перевірити правильний порядок application."
      staff: "Interceptor testing strategy: unit vs integration. Unit testing interceptor: ізолює логіку interceptor але складний setup (mock HttpHandler, HttpRequest). Integration: більш realistic, але тестує service + interceptor разом — failure може бути в будь-якому. Recommendation: unit test для complex interceptor logic (retry, transform), integration test для simple (add header, log). Auth interceptor testing: 1) Test token refresh trigger (401 response), 2) Test concurrent requests during refresh (queue + replay), 3) Test logout on persistent 401. Retry interceptor testing: verify request count через expectOne() vs match() calls, tick() для retry delays в fakeAsync. Architectural concern: якщо interceptor занадто складний для testing — можливо треба розбити на service + interceptor."
    commonMistakes:
      - "Тестують тільки interceptor through service call — неясно де помилка при failure"
      - "Не тестують interceptor chain order — two interceptors can conflict"
    relatedQuestions: ["b18t4q2", "b18t4q4"]
  - level: "senior"
    question: "Як тестувати retry logic і concurrency scenarios в HTTP services?"
    referenceAnswers:
      junior: "Для retry: кілька разів відповідати на один запит з помилкою, потім успіхом. Для concurrency: кілька підписок на різні запити."
      mid: "Retry: перший expectOne() → flush error → другий expectOne() — SAME url (retry) → flush success. fakeAsync + tick(delay) для delay між retries. Concurrency: match('/api/') повертає масив всіх matching requests — flush кожен окремо."
      senior: "Retry з RxJS retryWhen або retry operator: в fakeAsync — flush error, tick(retryDelay), наступний expectOne для того самого URL — flush success. expect(requestCount) via httpMock.match(). switchMap cancellation: якщо перший запит pending і новий switch — TestRequest.cancelled === true для cancelled request. Concurrency з forkJoin: всі requests одночасно pending — httpMock.match() для batch, flush кожен — forkJoin emit тільки коли все complete. Race condition testing: два concurrent requests, flush другий перший — verify що перший cancels або service handles correctly."
      staff: "Concurrency testing в HTTP — це integration-level concern. Real scenarios: 1) Type-ahead search (switchMap — cancel previous), 2) Parallel data loading (forkJoin), 3) Sequential with dependency (concatMap), 4) Error в одному з паралельних (forkJoin error propagation). Testing philosophy: ці scenarios важкі в unit тесті, краще в service integration test. fakeAsync + tick для timing контролю. TestRequest.cancelled є angular-specific test utility. Performance: httpMock.match() scans all pending requests — for high-concurrency tests може бути slow. Alternative: Playwright/Cypress з mock server для concurrency E2E tests — більш realistic але slower."
    commonMistakes:
      - "Не перевіряють що cancelled requests реально cancelled (TestRequest.cancelled)"
      - "forkJoin тест без flush всіх requests — forkJoin не emits до всі complete"
    relatedQuestions: ["b18t4q3", "b18t5q1"]
  - level: "staff"
    question: "Як організувати HTTP testing у великому Angular проєкті для ефективного maintenance?"
    referenceAnswers:
      junior: "Спільні helpers для setup TestBed і типові HTTP мок відповіді."
      mid: "API mock factory що повертає standard responses. Shared TestBed configuration. Type-safe HTTP fixtures."
      senior: "Patterns: 1) HTTP mock factory — createMockResponse<T>(data, options) для typed responses. 2) Shared service spec helpers — configureServiceTestingModule(ServiceClass, additionalProviders) reduces boilerplate. 3) Type-safe API fixtures — constants файли з mock data per endpoint. 4) Custom matchers — expect(req).toMatchRequest({ method, url, body }) для cleaner assertions. 5) ApiMockService — centralized mock definition що може бути shared між tests."
      staff: "Enterprise HTTP testing strategy: 1) Mock server approach — MSW (Mock Service Worker) або json-server для integration tests — single mock definition shared між unit tests, browser testing, E2E, 2) Contract testing (Pact) — consumer-driven contracts між frontend і backend — автоматично verify що backend відповідає expected interface, 3) Type generation from OpenAPI — автоматично генерувати TypeScript types і mock factories з backend schema — zero drift між mock і real API. Organizational consideration: хто owns HTTP mock definitions? Frontend team — швидше ітерація, але може diverge від backend. Shared contract — slower but accurate. Backend team generates mocks — slowest but most accurate. Recommendation: OpenAPI → typescript-generator → shared types + mock factories. Update cycle: при backend API change → regenerate types → update affected tests. This eliminates entire category of integration bugs."
    commonMistakes:
      - "Кожен test file має свій mock data — inconsistency між тестами для одного endpoint"
      - "Не мають strategy для mock data synchronization з реальним backend API"
    relatedQuestions: ["b18t4q3", "b18t6q1"]
---

## Core Concept

**English definition:** HTTP testing in Angular uses HttpTestingController (via provideHttpClientTesting()) to intercept HTTP requests made by services, verify request parameters and body, and deliver controlled mock responses without making real network calls.

**Пояснення:** HttpTestingController — це synchronous interceptor що заміняє реальний HTTP backend в тестах. Замість мережі: service call → Observable (pending) → expectOne() перехоплює → flush() доставляє відповідь → Observable emit → assert. Все це відбувається синхронно в одному test tick.

**Яку проблему вирішує:**
- **Network independence:** Тести не залежать від зовнішнього API — швидкі і надійні
- **Request verification:** Перевіряти method, URL, headers, body, params — service відправляє правильний запит
- **Response control:** Flush будь-яку відповідь (success, 4xx, 5xx, network error) для testing edge cases
- **Interceptor testing:** Перевіряти що interceptors правильно трансформують requests/responses

**Як працює під капотом:**

```typescript
// HttpTestingController intercepts at HttpBackend level
// Angular HttpClient → HttpHandler chain → interceptors → HttpBackend
// У тестах: real HttpBackend → MockHttpBackend (HttpTestingController)

// Sequence:
// 1. service.getData() → HttpClient.get() → MockBackend (pending)
// 2. httpMock.expectOne(url) → find in pending queue, mark expected
// 3. testReq.flush(data) → synchronously deliver response
// 4. Observable emit → service transform → test assertion
```

```typescript
// Базовий setup
TestBed.configureTestingModule({
  providers: [
    MyService,
    provideHttpClient(),         // HttpClient з interceptors
    provideHttpClientTesting(),  // замінює backend на mock
  ],
});
const service = TestBed.inject(MyService);
const httpMock = TestBed.inject(HttpTestingController);

afterEach(() => httpMock.verify()); // перевірити немає unsatisfied expectations
```

**Trade-offs та обмеження:**
- Tests HttpClient layer, не реальну мережу — мережеві помилки (DNS, TLS) не тестуються
- XHR-based legacy code несумісний з fetch-based HttpClient в деяких test environments
- HttpTestingController не verifies response schema — можна flush некоректний тип
- MockBackend synchronous — async patterns (retry delays) потребують fakeAsync

**Версійність:**
- Angular 2-14: `HttpClientTestingModule` — NgModule based
- Angular 15+: `provideHttpClientTesting()` — standalone function, рекомендований
- Angular 16+: `withInterceptors([fn])` для functional interceptors тестування
- Angular 17+: `withFetch()` для native fetch замість XHR — тестування ідентичне

## Deep Details

### Edge Cases

**verifyNoOutstandingRequests vs verify:**
```typescript
// httpMock.verify() перевіряє обидва:
// 1. Немає unsatisfied expectations (очікуваний запит не відбувся)
// 2. Немає unexpected requests (запит відбувся, не очікувався)

// Якщо service робить запит але тест не робить expectOne() — verify() кидає:
// "HttpClientTestingBackend had 1 expected request(s), but found 0"

// Якщо service НЕ робить запит але expectOne() викликається — expectOne кидає:
// "Expected one matching request for criteria: '/api/data', found none"
```

**Testing з params і headers:**
```typescript
it('should pass search params', () => {
  service.searchUsers({ query: 'alice', page: 1 }).subscribe();

  const req = httpMock.expectOne(r =>
    r.url === '/api/users' &&
    r.params.get('query') === 'alice' &&
    r.params.get('page') === '1'
  );
  expect(req.request.method).toBe('GET');
  req.flush([{ id: '1', name: 'Alice' }]);
});

it('should include auth header', () => {
  service.getProfile().subscribe();

  const req = httpMock.expectOne('/api/profile');
  expect(req.request.headers.get('Authorization')).toMatch(/^Bearer /);
  req.flush({ name: 'User' });
});
```

**Network error vs HTTP error:**
```typescript
// HTTP error (сервер відповів): flush with status
req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

// Network error (з'єднання не відбулось): error()
req.error(new ProgressEvent('error')); // Network error
req.error(new ProgressEvent('timeout')); // Timeout
```

### Junior vs Senior Understanding

**Junior** знає: expectOne(url) → flush(data) → verify().

**Senior** розуміє весь testing contract: перевіряти не тільки що запит зроблений, але і що в ньому правильно — method, URL, headers, body, params. Знає різницю між HTTP error і network error. Тестує retry, cancellation, concurrent scenarios. Розуміє коли HttpTestingController а коли jest.fn() на HttpClient.

```typescript
// Senior: comprehensive request verification
it('should create user with correct payload and headers', () => {
  const newUser = { name: 'Alice', role: 'admin' };
  let createdUser: User | undefined;

  service.createUser(newUser).subscribe(u => createdUser = u);

  const req = httpMock.expectOne('/api/users');
  expect(req.request.method).toBe('POST');
  expect(req.request.body).toEqual(newUser);
  expect(req.request.headers.get('Content-Type')).toBe('application/json');
  expect(req.request.withCredentials).toBe(true);

  req.flush({ id: 'new-id', ...newUser }, { status: 201, statusText: 'Created' });

  expect(createdUser).toEqual({ id: 'new-id', ...newUser });
});
```

### Deprecation & Migration Path

- **Deprecated:** `HttpClientTestingModule` — все ще працює але `provideHttpClientTesting()` рекомендований для standalone
- **Migration:**
  ```typescript
  // OLD (NgModule-based):
  TestBed.configureTestingModule({
    imports: [HttpClientModule, HttpClientTestingModule],
    providers: [MyService],
  });

  // NEW (standalone):
  TestBed.configureTestingModule({
    providers: [
      MyService,
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  ```
- Angular 16+: Functional interceptors `withInterceptors([fn])` — тестуються так само, але провайдяться по-іншому

### Connections to Other Concepts

- **Testing Services (Topic 2):** HTTP testing є частина service testing
- **HTTP Interceptors (Block 8):** interceptor testing через integration setup
- **Testing Signals & RxJS (Topic 5):** Observable error handling patterns
- **Mocking Strategies (Topic 6):** HttpTestingController vs jest mock HttpClient

## Examples

### Basic Usage

```typescript
// products.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProductsService, Product } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch products', () => {
    const mockProducts: Product[] = [
      { id: '1', name: 'Widget', price: 9.99 },
      { id: '2', name: 'Gadget', price: 19.99 },
    ];
    let result: Product[] = [];

    service.getProducts().subscribe(p => result = p);

    const req = httpMock.expectOne('/api/products');
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);

    expect(result).toEqual(mockProducts);
  });

  it('should handle server error', () => {
    let error: Error | undefined;

    service.getProducts().subscribe({ error: e => error = e });

    const req = httpMock.expectOne('/api/products');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(error).toBeDefined();
  });
});
```

### Production Scenario

```typescript
// auth-interceptor.spec.ts — interceptor integration test
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { TokenService } from './token.service';
import { ApiService } from './api.service';

describe('authInterceptor integration', () => {
  let apiService: ApiService;
  let httpMock: HttpTestingController;
  let tokenServiceSpy: jasmine.SpyObj<TokenService>;

  beforeEach(() => {
    tokenServiceSpy = jasmine.createSpyObj('TokenService', ['getToken', 'refreshToken', 'clearToken']);
    tokenServiceSpy.getToken.and.returnValue('valid-jwt-token');

    TestBed.configureTestingModule({
      providers: [
        ApiService,
        { provide: TokenService, useValue: tokenServiceSpy },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    apiService = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should attach Authorization header', () => {
    apiService.getData().subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-jwt-token');
    req.flush([]);
  });

  it('should refresh token on 401 and retry', fakeAsync(() => {
    tokenServiceSpy.refreshToken.and.returnValue(Promise.resolve('new-token'));
    let result: unknown;

    apiService.getData().subscribe(r => result = r);

    // First request — 401
    const req1 = httpMock.expectOne('/api/data');
    req1.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Interceptor refreshes token and retries
    tick(); // process promise
    expect(tokenServiceSpy.refreshToken).toHaveBeenCalled();

    // Second request — success
    const req2 = httpMock.expectOne('/api/data');
    expect(req2.request.headers.get('Authorization')).toBe('Bearer new-token');
    req2.flush([{ id: '1', name: 'Test' }]);

    expect(result).toEqual([{ id: '1', name: 'Test' }]);
  }));

  it('should logout on persistent 401 (token refresh failed)', fakeAsync(() => {
    tokenServiceSpy.refreshToken.and.returnValue(Promise.reject(new Error('Refresh failed')));

    apiService.getData().subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/data');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    tick();
    expect(tokenServiceSpy.clearToken).toHaveBeenCalled();
  }));
});
```

### Anti-Example

```typescript
// ❌ WRONG: flush before subscribe — Observable has no subscriber
it('should get users', () => {
  const req = httpMock.expectOne('/api/users'); // ERROR: no request made yet
  req.flush([]); // This runs before subscribe
  service.getUsers().subscribe(); // Request happens here — too late
});

// ❌ WRONG: No verify() — leaked requests undetected
describe('BadService', () => {
  it('should load data', () => {
    service.loadMultiple().subscribe();
    // service makes 2 requests internally, test only handles 1
    const req = httpMock.expectOne('/api/data');
    req.flush([]);
    // Second /api/config request never handled — but no verify() = no detection
    expect(true).toBe(true); // this passes — false confidence
  });
  // NO afterEach verify() !
});

// ✅ CORRECT: proper order and cleanup
describe('GoodService', () => {
  afterEach(() => httpMock.verify()); // Always!

  it('should load all data', () => {
    service.loadMultiple().subscribe();

    const dataReq = httpMock.expectOne('/api/data');
    const configReq = httpMock.expectOne('/api/config');

    dataReq.flush([{ id: '1' }]);
    configReq.flush({ theme: 'dark' });

    // verify() will confirm no extra requests
  });
});
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `flush()` перед `subscribe()` | Observable не має subscriber — запит ще не зроблений | Subscribe → expectOne → flush → assert |
| Відсутність `afterEach(() => httpMock.verify())` | Незаплановані requests проходять непоміченими — false confidence | Завжди `verify()` після кожного тесту |
| Тільки happy path тести | Error handling bugs в production | Тестувати: 200, 400, 401, 404, 500, network error |
| Не перевіряти request body/headers | Service може відправляти неправильні дані без виявлення | `expect(req.request.body).toEqual(expected)` |
| `HttpClientTestingModule` в нових проєктах | Legacy NgModule API | `provideHttpClientTesting()` для standalone |

## Interview Block

### [L1 — Warm-up] Як тестувати Angular сервіс що виконує HTTP запити?
**Signal being tested:** Знання HttpTestingController pattern і правильного порядку операцій
**What the interviewer expects:** provideHttpClientTesting(), expectOne, flush, verify, правильний порядок
**How to probe deeper:** "Що станеться якщо ти викличеш flush() до subscribe()?"
**Reference answer:** provideHttpClientTesting() замінює реальний backend на mock. Порядок: service.method().subscribe() → httpMock.expectOne(url) → testReq.flush(mockData) → assert result. afterEach: httpMock.verify(). flush() синхронно доставляє відповідь через Observable chain.
**Common mistakes:** flush() перед subscribe(); відсутній verify(); не знають що expectOne() кидає error якщо request не зроблений

### [L2 — Mid] Як тестувати HTTP error scenarios і перевіряти request headers/params?
**Signal being tested:** Комплексність HTTP testing knowledge — error types, request verification
**What the interviewer expects:** flush(body, { status: 404 }) для HTTP errors, error(ProgressEvent) для network errors, request.headers/params access
**How to probe deeper:** "В чому різниця між HTTP error (404) і network error?"
**Reference answer:** HTTP error: flush({ error: 'msg' }, { status: 404, statusText: 'Not Found' }). Network error: testReq.error(new ProgressEvent('error')). Headers: req.request.headers.get('Authorization'). Body: req.request.body. Verify що service correctly handles errors: subscribe з error callback або expectAsync(firstValueFrom()).toBeRejected().
**Common mistakes:** Тільки happy path тести; не перевіряють request body для POST/PUT

### [L3 — Senior] Як тестувати HTTP interceptors?
**Signal being tested:** Розуміння interceptor testing trade-offs між unit і integration підходами
**What the interviewer expects:** Integration: withInterceptors([fn]) + provideHttpClientTesting, verify headers applied, test 401 retry flow
**How to probe deeper:** "Як тестувати interceptor що реалізує token refresh при 401?"
**Reference answer:** Integration test: provideHttpClient(withInterceptors([authInterceptor])) + provideHttpClientTesting. Service call → request intercepted → expect added header → flush 401 → interceptor refresh flow → second request → flush success. fakeAsync + tick() для async token refresh. verify() confirms correct number of requests.
**Common mistakes:** Unit test interceptor без integration context; не тестують 401 refresh flow

### [L4 — Staff/Principal] Як організувати HTTP testing у великому Angular проєкті?
**Signal being tested:** Architectural thinking про test infrastructure і mock data management
**What the interviewer expects:** MSW / shared mock factories / OpenAPI-generated mocks / contract testing, organizational patterns
**How to probe deeper:** "Як забезпечити що mock responses синхронізовані з реальним backend API?"
**Reference answer:** Options: 1) Shared mock factories з typed responses, 2) MSW (Mock Service Worker) — один mock definition для unit + browser + E2E, 3) OpenAPI → typescript-generator → shared types + auto-generated mocks — zero drift. Contract testing (Pact) для boundary verification між frontend і backend. Team decision: frontend-owned mocks (fast iter), shared mocks (accurate), backend-generated (slowest but correct).
**Common mistakes:** Mock data в кожному test file — inconsistency; немає strategy для mock-backend synchronization

## Summary

### Key Points
- `provideHttpClientTesting()` (Angular 15+) або `HttpClientTestingModule` — fake backend для tests
- Порядок: `service.method().subscribe()` → `expectOne()` → `flush()` → assert
- Завжди `afterEach(() => httpMock.verify())` для виявлення unexpected requests
- Перевіряти: request method, URL, headers, body, params — не тільки що запит зроблений
- Error scenarios: `flush({}, { status: 404 })` для HTTP errors, `error(new ProgressEvent())` для network
- Interceptor testing: integration setup з `withInterceptors([fn])` + `provideHttpClientTesting`
- `testReq.request.cancelled` для перевірки switchMap request cancellation

### Elevator Pitch (2 minutes)
"HTTP testing в Angular будується навколо HttpTestingController. provideHttpClientTesting() замінює реальний HTTP backend на synchronous mock. Правильний порядок: service.method().subscribe() — спочатку trigger HTTP call, потім httpMock.expectOne(url) — перехопити і отримати TestRequest, потім testReq.flush(mockData) — синхронно доставити відповідь, потім assert результат. Важливо: flush() після subscribe(), не до. afterEach: httpMock.verify() — перевіряє немає unsatisfied expectations і зайвих requests. Для error scenarios: flush(body, { status: 404 }) для HTTP errors, error(new ProgressEvent('error')) для network errors. Interceptors: провайдити разом з withInterceptors([fn]) і тестувати через service call — перевіряти що request має правильні headers після interceptor. Ключова практика: тестувати не тільки happy path але і 401, 404, 500, network errors — production bugs живуть там."
