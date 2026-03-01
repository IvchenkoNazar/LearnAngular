---
title: "Testing Angular Services"
block: 18
topic: 2
slug: "testing-services"
difficulty: 3
sinceVersion: "2"
tags: ["TestBed", "inject", "spyOn", "service testing", "HttpClientTestingModule", "provideHttpClientTesting"]
relatedTopics: ["unit-testing", "testing-http", "dependency-injection", "testing-signals-rxjs"]
interviewQuestions:
  - level: "junior"
    question: "Як протестувати Angular service що не має залежностей?"
    referenceAnswers:
      junior: "Можна просто створити instance сервісу через new ServiceClass() і тестувати методи напряму. Або через TestBed.inject()."
      mid: "Сервіс без залежностей — чистий TypeScript клас. new ServiceClass() цілком достатньо — не потрібен TestBed overhead. TestBed.inject() варто використовувати якщо сервіс залежить від Angular DI або потрібно перевірити що він правильно надається. Для більшості pure logic сервісів: new + test методів напряму — найпростіший і найшвидший підхід."
      senior: "Правило: використовуй мінімальний setup для тесту. Сервіс без DI залежностей — new ServiceClass(). Якщо сервіс providedIn: 'root' але без конструктор залежностей — new() або TestBed.inject() однаково OK. TestBed потрібен коли: сервіс inject'ить щось через конструктор або inject(), або коли треба тестувати DI tree behavior. Тест структура для простого сервісу: describe → let service = new ServiceClass() → it → expect. Це significantly faster і simpler ніж TestBed setup."
      staff: "Pure service testing без TestBed — це правильний architectural підхід бо: 1) Швидше (немає Angular bootstrap overhead), 2) Явно показує що сервіс не залежить від Angular runtime, 3) Легше тестувати у різних contexts (Node.js, worker). Якщо неможливо тестувати сервіс без TestBed — це сигнал що він занадто tightly coupled до Angular infrastructure. Design principle: бізнес логіка в сервісах повинна бути platform-agnostic — якщо сервіс робить document.getElementById() напряму — це design smell, не тільки testing problem. Architectural pattern: separate pure business logic services (testable without TestBed) від Angular-specific services (routing, HTTP, DI coordination)."
    commonMistakes:
      - "Завжди налаштовують TestBed навіть для простих сервісів без DI — зайвий overhead"
      - "Плутають 'сервіс без залежностей' і 'сервіс без TestBed' — можна мати залежності але тестувати без TestBed через manual injection"
    relatedQuestions: ["b18t2q2", "b18t1q1"]
  - level: "mid"
    question: "Як тестувати сервіс що має залежності — spy vs stub vs mock?"
    referenceAnswers:
      junior: "Для тестування сервісу з залежностями замінюємо залежності на фейкові через providers в TestBed. Spy дозволяє стежити за викликами."
      mid: "Три підходи: 1) Spy (jasmine.createSpyObj / jest.fn()) — реальний об'єкт з відстежуваними методами, повертаємо потрібні значення через .and.returnValue(). 2) Stub — мінімальна ручна реалізація інтерфейсу, тільки потрібні методи. 3) Mock — повна fake реалізація з всією логікою. Spy — найпоширеніший для Angular тестів. TestBed providers: { provide: RealService, useValue: spyObj }."
      senior: "Spy object (jasmine.createSpyObj): автоматично створює spy functions для всіх вказаних методів. Повертає типізований об'єкт. .and.returnValue(value) для синхронних, .and.returnValue(of(value)) для Observable, .and.returnValue(Promise.resolve(value)) для async. Stub — клас що implements інтерфейс із fixed behavior: корисний коли spy логіка стає складною. Mock — найважчий варіант, зазвичай overkill. TestBed inject: TestBed.inject(RealService) повертає injected instance — якщо passed useValue spy, отримуємо spy. Важливо: jest.spyOn(service, 'method') vs jasmine.createSpyObj — spyOn патчить існуючий об'єкт, createSpyObj — нові functions. Testing with inject() в InjectionToken: TestBed.inject(TOKEN)."
      staff: "Spy vs Stub vs Mock — це trade-off між flexibility і clarity. Spy: maximum flexibility, але тест може перевіряти call counts замість behavior — implementation testing (fragile). Stub: fixed behavior, тест перевіряє результат — behavior testing (resilient). Architectural consideration: якщо тест перевіряє що service.method() був викликаний N разів — це implementation test. Якщо перевіряє що component показує правильний результат — behavior test. Prefer behavior tests. Test doubles taxonomy (Gerard Meszaros): dummy (не використовується), stub (fixed return), spy (records calls), mock (pre-programmed expectations), fake (working alternative impl). Angular testing часто мішає spy і mock — clarification допомагає команді консистентно використовувати terminology і підходи."
    commonMistakes:
      - "Тестують що spy.method() викликався (implementation test) замість результату (behavior test)"
      - "createSpyObj з неповним списком методів — TypeError коли service.methodNotInList() викликається"
    relatedQuestions: ["b18t2q1", "b18t2q3"]
  - level: "mid"
    question: "Як тестувати Observable з сервісу — done callback vs fakeAsync vs first/toPromise?"
    referenceAnswers:
      junior: "Можна підписатись на Observable в тесті через subscribe і перевіряти значення в callback. done() параметр в it() сигналізує завершення async тесту."
      mid: "Три підходи: 1) done callback — subscribe, перевіряти значення, викликати done(). 2) fakeAsync + flush() для cold synchronous observables. 3) firstValueFrom(observable) → async/await у waitForAsync тесті. Done callback ризикований: якщо observable не emit — тест timeout без done() call. fakeAsync + tick для observables з delay. firstValueFrom — найчитабельніший для simple cases."
      senior: "done callback проблеми: тест timeout якщо observable не completes, складно тестувати множинні emissions, error handling в subscribe не підхоплюється test framework без done.fail(). fakeAsync + flush: очищає всі pending observables якщо вони використовують scheduled tasks. firstValueFrom + async/await: найсучасніший підхід, читається як synchronous code. Для BehaviorSubject / ReplaySubject: вони емітять synchronously при subscribe — можна тестувати без async. Observable testing pattern: arrange (setup spy/stub), act (call service method), assert (pipe to promise через firstValueFrom). Error scenario: expect(firstValueFrom(obs)).rejects.toThrow()."
      staff: "Observable testing strategy залежить від observable source. Cold synchronous (of(), from()) — sync, no special handling. Cold async (HttpClient) — HttpTestingController.flush() або jest mock. Hot (Subject, Event stream) — manual next() в test. Scheduler-based (interval, timer, delay) — fakeAsync + tick(). Для complex RxJS chains: TestScheduler з marble testing — найпотужніший і найдекларативніший. Recommendation: firstValueFrom + jest async для simplе cases, marble testing для RxJS operators, fakeAsync для Angular-specific timing (debounceTime в reactive forms). Test isolation: кожен тест повинен manaually контролювати observable lifecycle — не залишати відкриті subscriptions між тестами (flakiness)."
    commonMistakes:
      - "done() не викликається якщо observable не emit — test timeout без clear error"
      - "Не обробляють error case в subscribe — thrown errors in subscribe не перехоплюються test runner"
    relatedQuestions: ["b18t2q2", "b18t5q1"]
  - level: "senior"
    question: "Як тестувати сервіс що використовує HttpClient — provideHttpClientTesting vs HttpClientTestingModule?"
    referenceAnswers:
      junior: "Є спеціальний модуль HttpClientTestingModule що замінює реальний HTTP на fake. Через HttpTestingController можна перевіряти що зроблено запит і відповідати тестовими даними."
      mid: "HttpClientTestingModule (legacy) або provideHttpClientTesting() (Angular 15+, standalone) замінює HttpBackend на fake. HttpTestingController.expectOne(url) перевіряє що запит зроблено і повертає TestRequest. testReq.flush(data) відповідає даними. afterEach: controller.verify() щоб перевірити незаплановані запити."
      senior: "provideHttpClientTesting() — сучасний standalone API. TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }). HttpTestingController.expectOne() підтримує URL string або RequestMatch object (url + method + params). testReq.flush(body, { status, statusText }) для success або error response. testReq.error(new ErrorEvent('network error')) для network errors. Порядок важливий: service.method() → controller.expectOne() → testReq.flush() → assert. verify() в afterEach перевіряє що немає unexpected requests."
      staff: "HTTP testing architecture: HttpTestingController є synchronous interceptor — flush() синхронно delivers response. Це дозволяє тести без fakeAsync в більшості випадків. Складні сценарії: interceptors — провайдяться в providers разом з HttpClient, тестуються end-to-end через service call. Testing interceptors окремо: потрібен мінімальний HTTP setup або mock HttpHandler. Retry logic testing: контролюємо кількість flush() calls. Concurrency testing: кілька concurrent requests — match('conditions') повертає масив. Performance: HttpTestingController не робить реальних HTTP calls — тести can run without network. Integration level: для повного HTTP flow (з реальними interceptors і error handling) — integration test з HttpTestingController краще ніж unit mock."
    commonMistakes:
      - "Не викликають controller.verify() afterEach — незаплановані requests проходять непоміченими"
      - "flush() після assert замість перед — Observable не emits відповідь ще"
    relatedQuestions: ["b18t2q3", "b18t4q1"]
  - level: "staff"
    question: "Як проектувати testable Angular services в масштабі enterprise додатку?"
    referenceAnswers:
      junior: "Сервіси з малою кількістю залежностей легше тестувати. Треба використовувати interfaces і моки."
      mid: "Інвертувати залежності (DI) — inject abstractions, не implementations. Розбивати великі сервіси на менші з однією відповідальністю. Уникати side effects в конструкторах. Статичні методи або pure functions де можливо."
      senior: "Testability principles: 1) Single Responsibility — кожен сервіс робить одне, 2) Dependency Inversion — inject interfaces/tokens not concrete classes, 3) No side effects in constructor — ініціалізація в методах, 4) Platform-agnostic logic — не inject document/window напряму. Patterns: Command/Query separation (читання і запис окремо — легше mock queries), Repository pattern (data access abstracted), pure function extractors (складну логіку в окрему pure function, тестувати без DI)."
      staff: "Enterprise testing architecture рішення: 1) Testing contracts — InjectionToken + interface, multiple implementations (real, mock, stub). 2) Test fixtures — shared factories для test data (builder pattern), версіоновані test scenarios. 3) Service composition testing — testing individual services (unit) vs integrated service trees (integration) — обоє потрібні, різний рівень. 4) Mutation testing (Stryker) — виявляє що тести не покривають edge cases навіть при 100% line coverage. 5) Property-based testing (fast-check) для complex business logic — генерує random inputs і validates invariants. 6) Consumer-driven contract testing (Pact) для service boundaries між mfes або backend. Team consideration: test strategy document — що unit тестується, що integration, що E2E, de-duplicating coverage між levels."
    commonMistakes:
      - "100% line coverage = добрі тести — неправда, mutation testing виявляє прогалини"
      - "Тестують тільки happy path — error handling testing критичний для production reliability"
    relatedQuestions: ["b18t2q2", "b18t6q1"]
---

## Core Concept

**English definition:** Angular service testing involves isolating services from their dependencies through spies, stubs, and mocks, and verifying their behavior — both pure business logic and interactions with HTTP, state, or other services.

**Пояснення:** Тестування сервісів в Angular — це перевірка бізнес-логіки ізольовано. Для сервісів без залежностей — `new ServiceClass()` достатньо. Для сервісів з залежностями (HttpClient, інші сервіси) — замінюємо залежності через TestBed providers на spy objects або stubs. Ціль: тестувати поведінку сервісу, а не реалізацію залежностей.

**Яку проблему вирішує:**
- **Isolation:** Перевіряти логіку сервісу без реальних HTTP calls або UI
- **Controlled dependencies:** Spy objects дозволяють контролювати що повертають залежності
- **Async testing:** fakeAsync/TestScheduler/firstValueFrom для Observable і Promise тестів
- **HTTP verification:** HttpTestingController для перевірки HTTP requests без реальної мережі

**Як працює під капотом:**

```typescript
// Три рівні складності тестування сервісів:

// 1. Без залежностей — просто new()
class PureService {
  calculateTax(price: number, rate: number): number {
    return price * rate;
  }
}
const service = new PureService();
expect(service.calculateTax(100, 0.2)).toBe(20); // No TestBed needed

// 2. З залежностями — spy objects
class OrderService {
  constructor(private productService: ProductService) {}
  getOrderTotal(ids: string[]): Observable<number> {
    return this.productService.getProducts(ids).pipe(
      map(products => products.reduce((sum, p) => sum + p.price, 0))
    );
  }
}
// Тест: spy на productService.getProducts

// 3. З HTTP — HttpTestingController
class ApiService {
  constructor(private http: HttpClient) {}
  getData(): Observable<Data[]> { return this.http.get<Data[]>('/api/data'); }
}
// Тест: provideHttpClientTesting + HttpTestingController
```

**Trade-offs та обмеження:**
- Spy перевіряє виклики методів — може призвести до implementation testing замість behavior testing
- Стаб з фіксованою відповіддю не тестує interaction logic
- HttpTestingController synchronous — не тестує реальні network conditions
- TestBed overhead — для простих сервісів new() завжди швидший

**Версійність:**
- Angular 2: `TestBed.get()` — deprecated в Angular 9
- Angular 9+: `TestBed.inject()` — type-safe альтернатива
- Angular 14+: `HttpClientTestingModule` — legacy; `provideHttpClientTesting()` — сучасний підхід
- Angular 16+: `inject()` в `TestBed.runInInjectionContext()` для testing inject()-based services

## Deep Details

### Edge Cases

**inject() в тесті (Angular 16+):**
```typescript
// Сервіс що використовує inject() замість constructor
@Injectable({ providedIn: 'root' })
class ModernService {
  private http = inject(HttpClient); // inject() не constructor DI
  getData() { return this.http.get('/api/data'); }
}

// Тест — потрібен injection context:
it('should call API', () => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  // inject() автоматично працює в TestBed context
  const service = TestBed.inject(ModernService);
  // ...
});

// Або явний injection context для non-TestBed тестів:
TestBed.runInInjectionContext(() => {
  const service = new ModernService();
  // inject() calls work here
});
```

**BehaviorSubject в сервісі — тестування state:**
```typescript
// state.service.ts
@Injectable({ providedIn: 'root' })
class StateService {
  private state = new BehaviorSubject<AppState>({ loading: false, data: [] });
  state$ = this.state.asObservable();

  setLoading(loading: boolean): void {
    this.state.next({ ...this.state.value, loading });
  }
}

// Тест — BehaviorSubject емітить synchronously
it('should update loading state', () => {
  const service = new StateService();
  let currentState: AppState | undefined;

  service.state$.subscribe(s => currentState = s); // sync emit of initial value

  service.setLoading(true);
  expect(currentState!.loading).toBe(true);
  // Без async потрібно — BehaviorSubject синхронний
});
```

### Junior vs Senior Understanding

**Junior** знає: "TestBed.inject для отримання сервісу, jasmine.createSpyObj для mock залежностей."

**Senior** розуміє КОЛИ не використовувати TestBed: pure business logic сервіси — `new()`. Знає різницю між implementation testing (перевіряємо що метод викликаний) і behavior testing (перевіряємо результат) — prefer behavior. Розуміє Observable testing strategies і вибирає по ситуації.

```typescript
// Senior підхід: тестування через поведінку, не через спостереження за викликами

// ❌ Implementation test — fragile
it('should call product service', () => {
  service.getOrderTotal(['1', '2']);
  expect(productServiceSpy.getProducts).toHaveBeenCalledWith(['1', '2']);
  // Тест зламається якщо ти переіменуєш метод або зміниш signature
});

// ✅ Behavior test — resilient
it('should return sum of product prices', async () => {
  productServiceSpy.getProducts.and.returnValue(of([
    { id: '1', price: 10 }, { id: '2', price: 20 }
  ]));

  const total = await firstValueFrom(service.getOrderTotal(['1', '2']));
  expect(total).toBe(30); // Test behavior, not implementation
});
```

### Deprecation & Migration Path

- **Deprecated:** `TestBed.get(Token)` → `TestBed.inject(Token)` (type-safe)
- **Deprecated:** `HttpClientTestingModule` — все ще працює але `provideHttpClientTesting()` рекомендований
- **Migration:**
  ```typescript
  // OLD:
  TestBed.configureTestingModule({
    imports: [HttpClientModule, HttpClientTestingModule],
  });
  const service = TestBed.get(MyService);

  // NEW:
  TestBed.configureTestingModule({
    providers: [MyService, provideHttpClient(), provideHttpClientTesting()],
  });
  const service = TestBed.inject(MyService);
  ```

### Connections to Other Concepts

- **DI Hierarchy:** TestBed providers override root providers — саме для цього і існує DI
- **Testing HTTP (Topic 4):** HttpTestingController детально описаний там
- **Testing Signals & RxJS (Topic 5):** Observable testing patterns
- **Mocking Strategies (Topic 6):** spy vs stub vs mock trade-offs деталізовані там

## Examples

### Basic Usage

```typescript
// cart.service.spec.ts — сервіс з залежностями
import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';

describe('CartService', () => {
  let cartService: CartService;
  let productServiceSpy: jasmine.SpyObj<ProductService>;

  beforeEach(() => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getProduct', 'checkStock']);

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: ProductService, useValue: productServiceSpy },
      ],
    });

    cartService = TestBed.inject(CartService);
  });

  it('should add item to cart', async () => {
    productServiceSpy.getProduct.and.returnValue(of({
      id: '123', name: 'Widget', price: 9.99,
    }));
    productServiceSpy.checkStock.and.returnValue(of({ available: true }));

    await firstValueFrom(cartService.addItem('123', 2));

    const cart = await firstValueFrom(cartService.getCart());
    expect(cart.items).toHaveSize(1);
    expect(cart.items[0]).toEqual(jasmine.objectContaining({ productId: '123', quantity: 2 }));
  });

  it('should throw when item out of stock', async () => {
    productServiceSpy.getProduct.and.returnValue(of({ id: '123', name: 'Widget', price: 9.99 }));
    productServiceSpy.checkStock.and.returnValue(of({ available: false }));

    await expectAsync(
      firstValueFrom(cartService.addItem('123', 1))
    ).toBeRejectedWithError('Out of stock');
  });
});
```

### Production Scenario

```typescript
// auth.service.spec.ts — сервіс з HTTP і token storage
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // перевірити немає unexpected requests
  });

  it('should login and store token', () => {
    let result: { token: string } | undefined;

    authService.login('user@test.com', 'password').subscribe(r => result = r);

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@test.com', password: 'password' });

    req.flush({ token: 'jwt-token-123', expiresIn: 3600 });

    expect(result).toEqual(jasmine.objectContaining({ token: 'jwt-token-123' }));
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('should handle login error', () => {
    let error: Error | undefined;

    authService.login('bad@test.com', 'wrong').subscribe({
      error: e => error = e,
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(error?.message).toContain('Invalid credentials');
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('should auto-logout after token expiry', fakeAsync(() => {
    authService.loginWithToken('jwt-token', 1); // expires in 1 second

    expect(authService.isAuthenticated()).toBe(true);

    tick(1001); // advance 1 second + buffer

    expect(authService.isAuthenticated()).toBe(false);
  }));
});
```

### Anti-Example

```typescript
// ❌ WRONG: Реальний HTTP в тестах
describe('BadService', () => {
  it('should fetch data', async () => {
    const service = new ApiService(new HttpClient(/* real backend */));
    const data = await firstValueFrom(service.getData()); // REAL HTTP CALL! Slow, flaky, external dependency
    expect(data).toBeDefined();
  });
});

// ❌ WRONG: Занадто специфічні spy expectations
it('should work', () => {
  service.doSomething();
  expect(depSpy.internalHelper).toHaveBeenCalledTimes(3); // internal detail testing
  expect(depSpy.internalHelper).toHaveBeenCalledWith(jasmine.any(Object), true, undefined);
  // Refactoring internalHelper signature breaks this test even if behavior unchanged
});

// ✅ CORRECT: Test behavior through observable result
it('should transform data correctly', async () => {
  depSpy.getData.and.returnValue(of([{ raw: 'value' }]));

  const result = await firstValueFrom(service.getTransformedData());

  expect(result).toEqual([{ transformed: 'value', processed: true }]);
  // Doesn't care HOW it's transformed internally
});
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `new Service()` для сервісу з inject() | inject() потребує injection context — TypeError | `TestBed.inject()` або `TestBed.runInInjectionContext()` |
| Реальні HTTP calls в unit тестах | Повільні, flaky, залежать від зовнішньої мережі | `provideHttpClientTesting()` + `HttpTestingController` |
| Testing implementation (call counts) замість behavior | Тести ламаються при refactoring без зміни behavior | Тестувати outputs і state, не internal method calls |
| Відсутність error scenario тестів | Production bugs в edge cases і error handling | Завжди тестувати: happy path, error path, edge cases |
| `controller.verify()` відсутній afterEach | Зайві/незаплановані HTTP requests проходять непоміченими | Завжди `afterEach(() => httpMock.verify())` |

## Interview Block

### [L1 — Warm-up] Як протестувати Angular service що не має залежностей?
**Signal being tested:** Чи кандидат знає коли TestBed потрібний, а коли new() достатньо — pragmatic testing knowledge
**What the interviewer expects:** new ServiceClass() для simple cases, TestBed.inject() для DI context, розуміння overhead
**How to probe deeper:** "Коли б ти все-таки використав TestBed навіть для сервісу без залежностей?"
**Reference answer:** Сервіс без залежностей — pure TypeScript клас, new ServiceClass() достатньо. TestBed overhead тільки якщо: тестуємо DI behavior (correctness of providedIn), або сервіс inject() щось всередині. Принцип: мінімальний setup для тесту — швидше і простіше.
**Common mistakes:** Завжди налаштовують TestBed навіть де не потрібно; не знають що new() — valid підхід

### [L2 — Mid] Як тестувати сервіс що має залежності — spy vs stub vs mock?
**Signal being tested:** Розуміння test doubles taxonomy і вибір правильного для ситуації
**What the interviewer expects:** jasmine.createSpyObj / jest.fn(), useValue в providers, розуміння behavior vs implementation testing
**How to probe deeper:** "В чому небезпека тестування через spy call verification замість результату?"
**Reference answer:** jasmine.createSpyObj('Name', ['method1', 'method2']) створює spy object. { provide: RealService, useValue: spyObj } замінює в DI. .and.returnValue(of(data)) для Observable. Prefer тестувати результат (behavior) ніж що метод викликаний (implementation) — implementation тести ламаються при refactoring.
**Common mistakes:** Забувають методи в createSpyObj — TypeError; тестують call counts замість outcomes

### [L3 — Senior] Як тестувати Observable що повертає сервіс — done vs fakeAsync vs firstValueFrom?
**Signal being tested:** Розуміння async testing patterns і їх trade-offs з Observable lifecycle
**What the interviewer expects:** done callback ризики, fakeAsync для timer-based, firstValueFrom + async/await — рекомендований, error testing
**How to probe deeper:** "Що станеться якщо Observable з done callback ніколи не completes?"
**Reference answer:** done() ризик: тест timeout без ясного error якщо observable doesn't emit. fakeAsync + tick() для delay/timer operators. firstValueFrom() + async/await — найчитабельніший для simple emissions. Для error: expect(firstValueFrom(obs)).rejects. BehaviorSubject — synchronous, не потребує async handling.
**Common mistakes:** done() без timeout handling; не тестують error scenarios

### [L4 — Staff/Principal] Як проектувати testable Angular services в масштабі enterprise?
**Signal being tested:** Architectural thinking — design for testability, not retrofit testing
**What the interviewer expects:** DI abstractions, SRP, platform-agnostic logic, mutation testing, contract testing, testing strategy document
**How to probe deeper:** "Як виявити що у вас 100% line coverage але тести не ловлять bugs?"
**Reference answer:** Testability principles: SRP (один обов'язок = легше mock), DI abstractions (inject interfaces не impl), platform-agnostic logic (не document.getElementById в business services). Tools: mutation testing (Stryker) виявляє coverage gaps, property-based testing для complex logic. Strategy: unit (isolated behavior) + integration (service trees) + contract (boundaries). Mutation testing score + test confidence більш значущий ніж line coverage %.
**Common mistakes:** 100% coverage goal без mutation testing; не мають strategy document — кожен тестує по-різному

## Summary

### Key Points
- Сервіс без залежностей — тестувати через `new ServiceClass()`, без TestBed overhead
- `jasmine.createSpyObj` / `jest.fn()` + `{ provide: Service, useValue: spy }` для dependency isolation
- Prefer behavior testing (перевіряти результат) над implementation testing (call counts)
- Observable testing: `firstValueFrom()` + `async/await` — найчитабельніший; fakeAsync для timer-based
- `provideHttpClientTesting()` + `HttpTestingController` для HTTP: expectOne → flush → assert
- Завжди `controller.verify()` в `afterEach` для виявлення unexpected HTTP requests
- `TestBed.inject()` замість deprecated `TestBed.get()`

### Elevator Pitch (2 minutes)
"Тестування сервісів в Angular — три рівні складності. Сервіс без залежностей — просто `new ServiceClass()`, тестуємо методи напряму. Сервіс з залежностями — замінюємо їх через TestBed providers на spy objects (jasmine.createSpyObj / jest.fn()) що повертають контрольовані значення. Сервіс з HTTP — `provideHttpClientTesting()` надає `HttpTestingController` для перевірки requests і flush-ування responses без реальної мережі. Ключова порада: тестувати behavior (що сервіс повертає) а не implementation (які internal методи викликаються) — behavior тести стабільні при refactoring. Для Observable: `firstValueFrom()` + async/await — найчитабельніший підхід. Завжди `controller.verify()` в afterEach для виявлення незапланованих HTTP requests."
