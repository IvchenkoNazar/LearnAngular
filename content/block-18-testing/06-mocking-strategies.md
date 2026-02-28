---
title: "Mocking Strategies in Angular Tests"
block: 18
topic: 6
slug: "mocking-strategies"
difficulty: 3
sinceVersion: "2"
tags: ["spy service", "useValue", "overrideComponent", "jest.fn", "jasmine.createSpy", "NO_ERRORS_SCHEMA", "mock"]
relatedTopics: ["unit-testing", "testing-services", "testing-components", "dependency-injection"]
interviewQuestions:
  - id: "b18t6q1"
    level: "junior"
    question: "Як замінити реальний сервіс на mock в Angular тестах?"
    referenceAnswers:
      junior: "Через providers в TestBed.configureTestingModule: { provide: RealService, useValue: mockService }. Так Angular injector повертає mock замість реального."
      mid: "Два підходи: 1) useValue з spy object — jasmine.createSpyObj('Name', ['method1']) або jest.fn(). Всі методи — spy functions що можна configure (returnValue, mock). 2) useClass — інший клас як fake implementation. useValue зазвичай кращий — більш гнучкий, не потребує реалізації всього класу."
      senior: "Provider strategies: useValue (найчастіший для mocks), useClass (fake implementation), useFactory (dynamic mock generation), useExisting (alias). Spy objects: jasmine.createSpyObj<ServiceType>('Name', ['method1', 'method2']) — type-safe з TypeScript generics. Jest: jest.fn() для окремих functions, jest.createMockFromModule() для auto-mock модулів. TestBed.inject(MockedService) повертає той самий spy що був provided — можна configure після inject. Важливо: spy return values повинні матчити expected types — undefined spy може ламати компонент якщо він immediately uses return value."
      staff: "Mock strategy залежить від context: unit test (максимальна ізоляція, повний mock) vs integration test (реальна логіка з мок external deps). Architectural consideration: якщо mock налаштування складне — це сигнал що component/service занадто tightly coupled. Design smell: 10+ spy methods needed = service має занадто багато обов'язків. Mock taxonomy: test doubles (Dummy, Stub, Spy, Mock, Fake) — кожен для різного purpose. Angular testing library (@testing-library/angular) зменшує потребу в моках через testing user behavior — less implementation detail coupling. Convention в команді: stubs для predictable behavior, spies тільки для interaction verification (verify call happened)."
    commonMistakes:
      - "createSpyObj без всіх потрібних методів — TypeError при виклику незареєстрованого методу"
      - "Не configure return value для spy що повертає Observable — компонент отримує undefined.subscribe() error"
    relatedQuestions: ["b18t6q2", "b18t2q2"]
  - id: "b18t6q2"
    level: "mid"
    question: "Як використовувати TestBed.overrideComponent і TestBed.overrideProvider?"
    referenceAnswers:
      junior: "TestBed.overrideComponent дозволяє замінити template або providers конкретного компонента після configureTestingModule."
      mid: "overrideComponent: замінити частину компонента в тесті — template, providers, або metadata. Корисно коли компонент має providers, що треба замінити тільки для нього. overrideProvider: замінити конкретний provider в injector. Відмінність від configureTestingModule providers: override можна робити після configure, більш точний контроль."
      senior: "TestBed.overrideComponent(ComponentClass, { set: { template: '<p>Simple</p>' } }) — повна заміна template для тесту. overrideComponent({ set: { providers: [...] } }) — замінити providers у component injector (не root). overrideProvider(Token, { useValue: mock }) — замінити specific provider. Важливо: overrides мають бути зроблені до createComponent() — після compile вони не діють. Використовується для: компонентів з complex templates де треба simplified version, замінити component-level providers. overridePipe, overrideDirective — аналогічно."
      staff: "Override APIs є powerful escape hatches але signal deeper issues. overrideComponent для template — корисно для snapshot testing (simplified template). Але якщо потрібно override кожен component's providers — може означати DI tree неправильно структурований. Override patterns: 1) Simplify template для focused behavior testing, 2) Override child component provider без affecting parent, 3) Dynamic mock based on test scenario. TestBed.overrideTemplate() — shorthand для template override. Override vs configureTestingModule providers priority: override wins. Testing modules pattern (create reusable testing modules): export const mockServiceModule = { provide: X, useValue: Y } — share between test files. Recommendation: prefer configureTestingModule providers for most cases, override only when necessary for precise control."
    commonMistakes:
      - "overrideComponent після createComponent() — не діє"
      - "overrideProvider vs configureTestingModule provider — не розуміють різниці в DI scope"
    relatedQuestions: ["b18t6q1", "b18t6q3"]
  - id: "b18t6q3"
    level: "mid"
    question: "NO_ERRORS_SCHEMA vs stub components — коли що використовувати?"
    referenceAnswers:
      junior: "NO_ERRORS_SCHEMA ігнорує незнайомі HTML елементи і атрибути. Stub components — мінімальні fake компоненти. NO_ERRORS_SCHEMA простіший, stubs — безпечніший."
      mid: "NO_ERRORS_SCHEMA: Angular ігнорує будь-які незнайомі elements і attributes — включно з @Input binding errors. Проблема: тест може проходити коли [wrongInput] не існує — баг в production. Stub components: @Component({ selector: 'app-child', template: '' }) — Angular перевіряє binding API. Компромісний CUSTOM_ELEMENTS_SCHEMA для web components (не Angular components)."
      senior: "NO_ERRORS_SCHEMA risks: 1) Typo в selector — <app-chidl> замість <app-child> — Angular not render, no error. 2) Typo в @Input — [userName] замість [username] — value not passed, no error. 3) Unknown event (outputEvent) — no error, but handler never called. Stub approach: minimum implementation — selector + template (empty or minimal), @Input properties що parent binding checks. Type-safe stubs через SpyObj for services. Third approach: provideMockComponent from ng-mocks library — auto-generate stubs. CUSTOM_ELEMENTS_SCHEMA: тільки для non-Angular web components (custom elements без Angular decorator)."
      staff: "Schema choice є team architectural decision. NO_ERRORS_SCHEMA is pragmatic for legacy/large codebases where stub maintenance is costly. Stub components are safer but require maintenance. Trade-off analysis: NO_ERRORS_SCHEMA: zero maintenance, hides template bugs. Stubs: some maintenance, catches template bugs early. ng-mocks library: auto-generates stubs, type-safe, maintains stubs automatically — eliminates the trade-off. Recommendation: new projects — ng-mocks or explicit stubs, established projects — evaluate cost of migration. A/B test: introduce explicit stubs for new components, measure bugs caught. If significant — migrate. Template type checking strictness (strictTemplates: true in tsconfig) — catches binding errors at compile time in production code, but NOT in test code with NO_ERRORS_SCHEMA."
    commonMistakes:
      - "NO_ERRORS_SCHEMA в critical integration tests — missing component entirely undetected"
      - "Stub components без @Input declarations — Angular still shows binding errors для Input-decorated props"
    relatedQuestions: ["b18t6q2", "b18t1q2"]
  - id: "b18t6q4"
    level: "senior"
    question: "Як тестувати з fake implementations (Fakes) замість stubs і коли це кращий вибір?"
    referenceAnswers:
      junior: "Fake — це повна але спрощена реалізація сервісу. Наприклад, InMemoryDatabase замість реальної бази даних."
      mid: "Fake — working implementation що emulates real behavior. Наприклад: FakeAuthService що зберігає users в Map замість HTTP calls. На відміну від stub (fixed return) і spy (track calls): fake містить логіку. Кращий коли: логіка складна, багато тестів використовують сервіс, stub maintenance дорожча ніж fake реалізація."
      senior: "Fake use cases: 1) FakeRouter для routing tests (збирає navigate calls), 2) FakeStorage що implements Storage interface in-memory, 3) FakeAuthService що implements AuthService з state management. Переваги: тести read більш realistically (fake поводиться як real), менше mock.returnValue(...) boilerplate, sharing між тестами через module. Недоліки: fake потрібно підтримувати в sync з real implementation, може мати власні bugs. Pattern: fake implements same interface as real service, exported from test helpers. Angular testing: provideFakeService vs provideRealService — одна команда для swap."
      staff: "Fake implementations — це testing investment що окупається при: 1) Widely-used service з complex behavior (auth, cart, user prefs), 2) Many tests that need same service setup with varying state, 3) Integration tests де real implementation too slow/complex. Design: fake should be simple enough to be obviously correct — if fake is as complex as real, it defeats the purpose. Fake maintenance: update fake when interface changes (TypeScript interface enforcement helps). ng-mocks MockService() — auto-generate mock from class but doesn't execute real logic. Consumer-driven approach: teams that own the service provide the official fake. This ensures: fake is always correct (maintained by service owners), consumers don't build their own diverging fakes."
    commonMistakes:
      - "Fake стає занадто складним — якщо fake складніший ніж stub, можливо краще stub"
      - "Fake не підтримується при зміні real service — fake diverges, tests pass but wrong behavior"
    relatedQuestions: ["b18t6q3", "b18t2q5"]
  - id: "b18t6q5"
    level: "staff"
    question: "Як організувати mocking стратегію для великого Angular проєкту?"
    referenceAnswers:
      junior: "Спільні mock файли і helper functions для зменшення дублювання."
      mid: "Test fixtures для типових mock даних. Mock factory functions. Shared testing modules з pre-configured mocks. Документація який підхід використовувати."
      senior: "Organization patterns: 1) testing/mocks/ directory з mock factories per service, 2) createXxxService() factory functions повертають pre-configured spy objects, 3) Shared testing modules — MockCoreModule { provide: CoreService, useValue: createCoreMock() }, 4) Test data builders (builder pattern) для complex domain objects. Naming: mock-*.ts, fake-*.ts, stub-*.ts — consistent naming helps find test doubles. Type safety: jasmine.createSpyObj<ServiceType> — TypeScript catches wrong method names."
      staff: "Enterprise mock strategy — це architectural decision з organizational impact. Considerations: 1) Ownership: хто owns mocks? Service team (correct but slow) vs consumer team (fast but divergent). 2) Automation: code generation for mocks from interfaces (schematics, OpenAPI) — reduce drift. 3) Testing library choice: ng-mocks (auto-mocks), Jest module mocking (global), manual (explicit). 4) Documentation: ADR (Architecture Decision Record) for mock strategy — why this approach, trade-offs, migration path. 5) Metrics: mock maintenance cost (how often mocks need update), false confidence rate (tests pass but bugs in prod). 6) Gradual evolution: start simple (manual mocks), evolve to ng-mocks or similar as codebase grows. Key insight: mock strategy affects team velocity as much as code architecture — invest in it accordingly."
    commonMistakes:
      - "Немає конвенцій — кожен пише mocks по-своєму — inconsistency і maintenance nightmare"
      - "Mock files в тих самих directories що production code — confusion, accidental production imports"
    relatedQuestions: ["b18t6q4", "b18t1q5"]
---

## Core Concept

**English definition:** Mocking strategies in Angular testing involve systematically replacing real dependencies with controlled test doubles — spies, stubs, mocks, and fakes — to isolate the unit under test and control its environment.

**Пояснення:** Mock стратегія — це система рішень: що замінювати (яку залежність), як замінювати (spy/stub/fake), і де зберігати mock implementations. Правильна стратегія забезпечує: ізоляцію тестів, стабільність при рефакторингу, і мінімальний maintenance overhead.

**Яку проблему вирішує:**
- **Isolation:** Тест тільки одного модуля без cascade effects від залежностей
- **Control:** Повний контроль що повертають залежності — тестувати різні scenarios
- **Speed:** Без реальних HTTP/DB/File operations — тести швидкі
- **Determinism:** Ті самі входи = ті самі виходи — немає flakiness від зовнішнього стану

**Як працює під капотом:**

```typescript
// Test double taxonomy (Gerard Meszaros):
// Dummy — not used, just satisfies type requirement
const dummyLogger = {} as Logger;

// Stub — fixed return value, no logic
const stub = { getUser: () => of({ id: '1', name: 'Alice' }) };

// Spy — records calls, can configure return values
const spy = jasmine.createSpyObj<UserService>('UserService', ['getUser']);
spy.getUser.and.returnValue(of({ id: '1', name: 'Alice' }));

// Mock — pre-programmed expectations
const mock = jasmine.createSpyObj<UserService>('UserService', ['getUser']);
// expectation configured before test runs

// Fake — working alternative implementation
class FakeUserService implements UserService {
  private users = new Map<string, User>();
  getUser(id: string): Observable<User> { return of(this.users.get(id)!); }
  addUser(user: User): void { this.users.set(user.id, user); }
}
```

**Trade-offs та обмеження:**
- Spy — flexible але може призводити до implementation testing
- Stub — simple але не тестує interaction між компонентами
- Fake — realistic але потребує maintenance при зміні interface
- NO_ERRORS_SCHEMA — зручний але ховає template errors

**Версійність:**
- Angular 2: jasmine.createSpyObj, manual providers
- Angular 9: Type-safe TestBed.inject()
- Angular 14+: provideMockComponent та ng-mocks ecosystem mature
- Angular 15+: провайдерна система з standalone — менше NgModule mock complexity
- Jest: jest.mock(), jest.fn(), jest.spyOn() — alternatves для Jasmine API

## Deep Details

### Edge Cases

**Jasmine spy vs Jest mock — API відмінності:**
```typescript
// Jasmine:
const spy = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'logout']);
spy.login.and.returnValue(of({ token: 'abc' }));
spy.login.and.throwError('Invalid credentials');
spy.login.calls.count(); // call count
spy.login.calls.mostRecent().args; // last call args

// Jest:
const mockAuthService = {
  login: jest.fn().mockReturnValue(of({ token: 'abc' })),
  logout: jest.fn(),
};
mockAuthService.login.mockImplementation(() => throwError(() => new Error('Invalid')));
mockAuthService.login.mock.calls.length; // call count
mockAuthService.login.mock.calls[0]; // first call args
```

**Типова помилка: spy не налаштований для Observable:**
```typescript
// ❌ Common bug: spy returns undefined, component calls .subscribe() on undefined
const userServiceSpy = jasmine.createSpyObj('UserService', ['getUser']);
// userServiceSpy.getUser returns undefined by default

@Component({ template: '{{ user$ | async }}' })
class UserComponent implements OnInit {
  user$!: Observable<User>;
  constructor(private userService: UserService) {}
  ngOnInit() {
    this.user$ = this.userService.getUser('1'); // returns undefined!
    // async pipe: undefined.pipe() — ERROR
  }
}

// ✅ Always configure Observable return values
userServiceSpy.getUser.and.returnValue(of({ id: '1', name: 'Alice' }));
```

**overrideComponent для isolated template test:**
```typescript
// Корисно для snapshot testing або ізольованого unit test
TestBed.overrideComponent(ComplexComponent, {
  set: {
    template: '<div>{{ title }}</div>', // simplified template
    providers: [{ provide: ComplexService, useValue: mockService }],
  },
});
```

### Junior vs Senior Understanding

**Junior** знає: useValue з spy object в providers, jasmine.createSpyObj, configure return values.

**Senior** розуміє mock taxonomy і вибирає правильний double для ситуації. Знає organizational patterns: shared mock factories, testing modules. Розуміє коли NO_ERRORS_SCHEMA прийнятний (unit test isolation) і коли небезпечний (integration test hiding bugs).

```typescript
// Senior: shared mock factory pattern
// test-helpers/mocks/user-service.mock.ts
export function createUserServiceMock(): jasmine.SpyObj<UserService> {
  const spy = jasmine.createSpyObj<UserService>('UserService', [
    'getUser', 'updateUser', 'deleteUser', 'getUserList',
  ]);

  // Default values — most tests work without reconfiguring
  spy.getUser.and.returnValue(of({ id: '1', name: 'Alice', role: 'user' }));
  spy.getUserList.and.returnValue(of([{ id: '1', name: 'Alice' }]));
  spy.updateUser.and.returnValue(of(void 0));
  spy.deleteUser.and.returnValue(of(void 0));

  return spy;
}

// In test files:
const userServiceMock = createUserServiceMock();
// Override for specific test:
userServiceMock.getUser.and.returnValue(throwError(() => new Error('Not found')));
```

### Deprecation & Migration Path

- **Deprecated:** `TestBed.get(Token)` → `TestBed.inject(Token)`
- **Legacy:** Class-based mocks в NgModule declarations — standalone спрощує це
- ng-mocks library (community) — auto-mock generation, maintained by community
- Angular Testing Library (@testing-library/angular) — behavior-first testing що reduces need for complex mocking

### Connections to Other Concepts

- **Dependency Injection:** useValue, useClass, useFactory — DI mechanisms for mocking
- **Testing Services (Topic 2):** createSpyObj patterns for service mocks
- **Testing Components (Topic 3):** stub components, NO_ERRORS_SCHEMA
- **Unit Testing (Topic 1):** TestBed configuration with mocks

## Examples

### Basic Usage

```typescript
// Базова spy service mock setup
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserDashboardComponent } from './user-dashboard.component';
import { UserService } from './user.service';
import { NotificationService } from './notification.service';

describe('UserDashboardComponent', () => {
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj<UserService>(
      'UserService',
      ['getProfile', 'updateProfile']
    );
    notificationSpy = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['show']
    );

    // Configure default return values
    userServiceSpy.getProfile.and.returnValue(of({
      id: '1', name: 'Alice', email: 'alice@test.com',
    }));

    await TestBed.configureTestingModule({
      imports: [UserDashboardComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    }).compileComponents();
  });

  it('should load and display user profile', () => {
    const fixture = TestBed.createComponent(UserDashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="user-name"]').textContent)
      .toContain('Alice');
  });

  it('should show success notification after update', async () => {
    userServiceSpy.updateProfile.and.returnValue(of(void 0));
    const fixture = TestBed.createComponent(UserDashboardComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="save-btn"]').click();
    fixture.detectChanges();

    expect(notificationSpy.show).toHaveBeenCalledWith('Profile saved', 'success');
  });
});
```

### Production Scenario

```typescript
// Fake implementation для complex stateful service
// test-helpers/fakes/fake-cart.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { CartService, CartItem, Cart } from '../../services/cart.service';
import { Observable, of } from 'rxjs';

@Injectable()
export class FakeCartService implements CartService {
  private items = signal<CartItem[]>([]);

  cart = computed<Cart>(() => ({
    items: this.items(),
    total: this.items().reduce((sum, item) => sum + item.price * item.quantity, 0),
    count: this.items().reduce((sum, item) => sum + item.quantity, 0),
  }));

  addItem(item: CartItem): Observable<void> {
    this.items.update(current => {
      const existing = current.find(i => i.productId === item.productId);
      if (existing) {
        return current.map(i => i.productId === item.productId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
        );
      }
      return [...current, item];
    });
    return of(void 0);
  }

  removeItem(productId: string): Observable<void> {
    this.items.update(current => current.filter(i => i.productId !== productId));
    return of(void 0);
  }

  clearCart(): Observable<void> {
    this.items.set([]);
    return of(void 0);
  }

  // Test helpers
  _setItems(items: CartItem[]): void {
    this.items.set(items);
  }
}

// Usage in test:
describe('CheckoutComponent', () => {
  let fakeCart: FakeCartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [{ provide: CartService, useClass: FakeCartService }],
    }).compileComponents();

    fakeCart = TestBed.inject(CartService) as FakeCartService;
    fakeCart._setItems([
      { productId: '1', name: 'Widget', price: 10, quantity: 2 },
    ]);
  });

  it('should display cart total', () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="total"]').textContent)
      .toContain('$20.00');
  });
});
```

### Anti-Example

```typescript
// ❌ WRONG: createSpyObj без Observable return values
describe('BadComponent', () => {
  beforeEach(() => {
    const spy = jasmine.createSpyObj('UserService', ['getUsers', 'updateUser']);
    // getUsers returns undefined — component calls subscribe() on undefined!
    TestBed.configureTestingModule({
      providers: [{ provide: UserService, useValue: spy }],
    });
  });
});

// ❌ WRONG: NO_ERRORS_SCHEMA hiding real bugs
TestBed.configureTestingModule({
  declarations: [ParentComponent],
  schemas: [NO_ERRORS_SCHEMA], // hides <app-chidl> typo, missing @Input, etc.
});

// Template: <app-chidl [userName]="user.name"></app-chidl>
// ^ typo in selector AND @Input — NO error with NO_ERRORS_SCHEMA

// ✅ CORRECT: Stub with proper @Input declarations
@Component({ selector: 'app-child', template: '', standalone: true })
class ChildStub {
  @Input() userName = ''; // @Input declared — binding error IS caught
}

TestBed.configureTestingModule({
  imports: [ParentComponent, ChildStub],
  // No NO_ERRORS_SCHEMA needed
});
// <app-chidl> — Angular ERROR: unknown element (caught!)
// [userName] — correct binding verified
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `createSpyObj` без configure return values | Default `undefined` return — `TypeError: Cannot read subscribe of undefined` | Завжди `spy.method.and.returnValue(of(...))` для Observable-returning methods |
| `NO_ERRORS_SCHEMA` в integration tests | Typos і missing @Input bindings проходять непоміченими | Stub components або реальні imports для integration level |
| Spy на implementation methods не публічний API | Тести ламаються при refactoring без behavior change | Mock тільки public API; перевіряти результати не call counts |
| Mock factories в кожному test file | Дублювання, inconsistency | Shared mock factories в `test-helpers/` або `testing/` directory |
| Fake service без interface enforcement | Fake diverges від real service | Fake implements interface: `class FakeX implements X {}` — TypeScript catches drift |

## Interview Block

### [L1 — Warm-up] Як замінити реальний сервіс на mock в Angular тестах?
**Signal being tested:** Знання базового DI override механізму в TestBed
**What the interviewer expects:** providers з useValue, jasmine.createSpyObj / jest.fn(), configure return values, type safety
**How to probe deeper:** "Що станеться якщо spy method повертає undefined і компонент підписується на результат?"
**Reference answer:** TestBed.configureTestingModule({ providers: [{ provide: RealService, useValue: spyObj }] }). jasmine.createSpyObj<ServiceType>('Name', ['method1', 'method2']) — type-safe. Обов'язково configure return values: spy.method.and.returnValue(of(data)) для Observable methods. TestBed.inject(RealService) повертає той самий spy.
**Common mistakes:** createSpyObj без configure — undefined.subscribe() error; не тип-safe спроби

### [L2 — Mid] Як використовувати TestBed.overrideComponent і коли це потрібно?
**Signal being tested:** Знання advanced TestBed configuration для точкового override
**What the interviewer expects:** overrideComponent для template/providers, overrideProvider для single token, timing (before createComponent)
**How to probe deeper:** "Чим відрізняється overrideProvider від configureTestingModule providers?"
**Reference answer:** overrideComponent({ set: { template, providers } }) — замінити компоненту template або component-level providers. overrideProvider(Token, { useValue: mock }) — override specific token. Відмінність від configureTestingModule: override = точковий, після configure. Обидва повинні бути до createComponent().
**Common mistakes:** Override після createComponent(); не розуміють різниці DI scope між component і root providers

### [L3 — Senior] NO_ERRORS_SCHEMA vs stub components — де ризики кожного підходу?
**Signal being tested:** Architectural awareness про trade-offs між convenience і correctness
**What the interviewer expects:** NO_ERRORS_SCHEMA hides typos і missing @Inputs; stubs enforce binding API; CUSTOM_ELEMENTS_SCHEMA для web components
**How to probe deeper:** "Яку помилку NO_ERRORS_SCHEMA дозволить пропустити в production?"
**Reference answer:** NO_ERRORS_SCHEMA: ігнорує unknown elements і attributes — включно з typos в selector і @Input names. Stub components: Angular перевіряє binding API — [missingInput] = error caught. Риск NO_ERRORS_SCHEMA: <app-wrong-name> і [wrongInput] проходять в тест, ламаються в production.
**Common mistakes:** NO_ERRORS_SCHEMA скрізь; стаб без @Input declarations (binding errors ще hidden)

### [L4 — Staff/Principal] Як організувати mocking стратегію для великого Angular проєкту?
**Signal being tested:** Organizational thinking про test infrastructure sustainability
**What the interviewer expects:** Mock factories в shared directory, interface-enforced fakes, ownership model, automation через code generation, ADR
**How to probe deeper:** "Як забезпечити що mock factories синхронізовані з реальними сервісами при зміні API?"
**Reference answer:** Shared test-helpers directory з mock factories. Fake implements interface — TypeScript catches drift. Ownership: service team provides official fake. Automation: code generation з interfaces (schematics) або ng-mocks auto-mock. ADR документує стратегію вибору. Metrics: mock maintenance cost vs false confidence rate. Поступова еволюція: manual mocks → ng-mocks при рості codebase.
**Common mistakes:** Відсутність конвенцій; mock файли в production directories; немає ownership model

## Summary

### Key Points
- Test doubles taxonomy: Dummy (fill parameter) → Stub (fixed return) → Spy (track + configure) → Mock (pre-programmed) → Fake (working impl)
- `jasmine.createSpyObj<ServiceType>` — type-safe spy generation; завжди configure Observable return values
- `{ provide: Service, useValue: spy }` в TestBed providers — inject mock замість real
- NO_ERRORS_SCHEMA — ховає template errors; stub components — безпечніше, Angular validates bindings
- `TestBed.overrideComponent` — точковий override template/providers; до `createComponent()`
- Fake implementations (implements interface) — для stateful complex services shared between many tests
- Shared mock factories в `test-helpers/` — зменшує дублювання і забезпечує consistency

### Elevator Pitch (2 minutes)
"Mocking стратегія в Angular тестах будується на DI override: { provide: RealService, useValue: mockObject } в TestBed providers. jasmine.createSpyObj<ServiceType>('Name', ['method1']) — type-safe spy з відстеженням викликів. Критично: завжди configure return values для Observable methods — spy.method.and.returnValue(of(data)) — інакше undefined.subscribe() runtime error. Для shallow testing: stub components (мінімальний @Component) безпечніший ніж NO_ERRORS_SCHEMA — Angular validates bindings з стабами але ігнорує з ERRORS_SCHEMA. TestBed.overrideComponent для точкового template/providers override до createComponent(). Для complex stateful dependencies: Fake implementation (implements ServiceInterface) — working in-memory implementation — TypeScript enforced, no drift. Organizational pattern: shared mock factories в test-helpers/ — consistent setup, less duplication."
