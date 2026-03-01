---
title: "Unit Testing Fundamentals with Angular"
block: 18
topic: 1
slug: "unit-testing"
difficulty: 2
sinceVersion: "2"
tags: ["TestBed", "ComponentFixture", "Jasmine", "Jest", "describe", "it", "beforeEach", "shallow testing", "deep testing"]
relatedTopics: ["testing-services", "testing-components", "testing-http", "change-detection"]
interviewQuestions:
  - level: "junior"
    question: "Що таке TestBed в Angular testing і навіщо він потрібен?"
    referenceAnswers:
      junior: "TestBed — це Angular testing utility що дозволяє налаштувати тестове середовище для компонентів і сервісів. Він симулює Angular module для тестів."
      mid: "TestBed.configureTestingModule() налаштовує мінімальний Angular environment для тесту — declarations/imports для компонентів, providers для сервісів. TestBed.createComponent() створює компонент в ізольованому DOM. ComponentFixture надає доступ до компонента, його DOM і change detection. fixture.detectChanges() запускає initial change detection cycle — без нього template не рендериться."
      senior: "TestBed створює тестовий NgModule / standalone environment — ізольований DI container і rendering context. Важливий нюанс: TestBed lazy-ініціалізує компілятор при першому запуску — це async operation. TestBed.compileComponents() потрібен якщо templateUrl/styleUrls (async compilation). В сучасних тестах з inline templates — компіляція синхронна. fixture.detectChanges() запускає повний Angular rendering pipeline: template evaluation, DOM update, lifecycle hooks (ngOnInit при першому виклику). Між тестами: TestBed автоматично destroy fixtures якщо не вимкнено через discardPeriodicTasks."
      staff: "TestBed — це controlled Angular runtime. Architectural розуміння: TestBed.configureTestingModule() compile'ить Angular компоненти JIT (навіть якщо production build AOT) — це дозволяє dynamic test configuration але збільшує test startup time. TestBed override APIs (overrideComponent, overrideProvider) дозволяють точкову заміну without full reconfiguration. Scaling concern: великий тестовий suite з TestBed compile per test file — значний overhead. Optimization: TestBed.resetTestingModule() між describe blocks замість між кожним test — але потребує careful state management. Jest vs Jasmine TestBed compatibility: jest-preset-angular handles TestBed integration, але потребує специфічної конфігурації (transformIgnorePatterns для ESM packages). In Angular 19+: signal-based components не потребують detectChanges() для signal updates в тестах (signals self-notify)."
    commonMistakes:
      - "Забувають fixture.detectChanges() після зміни state — DOM не оновлений"
      - "Не компілюють компоненти з templateUrl асинхронно — тести падають"
    relatedQuestions: ["b18t1q2", "b18t1q3"]
  - level: "mid"
    question: "В чому різниця між shallow і deep testing компонентів? Коли використовувати кожен підхід?"
    referenceAnswers:
      junior: "Shallow testing ізолює компонент і замінює дочірні компоненти заглушками. Deep testing рендерить всі дочірні компоненти."
      mid: "Shallow testing: NO_ERRORS_SCHEMA або стаб-компоненти замість реальних дочірніх — тест ізольований, швидкий, не залежить від дочірніх. Deep testing: імпортуємо всі дочірні компоненти і директиви — тест перевіряє інтеграцію між компонентами. Shallow для unit-тестування поведінки компонента; deep для integration тестування взаємодії. NO_ERRORS_SCHEMA ігнорує незнайомі elements/attributes — найпростіший спосіб shallow testing але ховає помилки в template binding."
      senior: "Trade-offs: NO_ERRORS_SCHEMA — простий але небезпечний (помилки в @Input bindings не виявляються, template errors мовчать). Стаб-компоненти — більше boilerplate але type-safe. Третій підхід (Angular 14+): provideMockComponent (Angular Testing Library) або ручні стаби через @Component({ selector: 'app-child', template: '' }). Deep testing з реальними компонентами: повніша coverage але: потребує більше налаштування, тести повільніші, зміни в дочірніх компонентах ламають parent тести (unnecessary coupling). Рекомендація: shallow для більшості unit тестів, deep для critical parent-child interactions, E2E для user flows."
      staff: "Shallow vs deep — це isolation vs coverage trade-off. Architectural підхід: testing pyramid — багато unit (shallow) + менше integration (deep) + мало E2E. Проблема NO_ERRORS_SCHEMA в scale: template bugs проходять у prod (missing @Input, wrong event names). Альтернатива: Angular Testing Library (@testing-library/angular) — render реального дерева але query через user-visible text/roles, не через implementation details. Це забезпечує: реальні компоненти, але тести resemble user perspective (behavior testing не implementation testing). Team consideration: стандартизація підходу важливіша за оптимальність — mixing NO_ERRORS_SCHEMA і stubs в одному проєкті = хаос. Convention: shallow testing для presentational components, deep/integration для smart containers."
    commonMistakes:
      - "Використовують NO_ERRORS_SCHEMA скрізь — template binding errors не виявляються"
      - "Роблять deep testing для всього — тести повільні і тендітні"
    relatedQuestions: ["b18t1q1", "b18t3q1"]
  - level: "mid"
    question: "Як тестувати async операції в Angular: fakeAsync vs waitForAsync?"
    referenceAnswers:
      junior: "fakeAsync дозволяє симулювати час в тестах через tick(). waitForAsync чекає реальних async операцій через whenStable."
      mid: "fakeAsync + tick(): замінює реальний таймер на fake — tick(1000) симулює 1 секунду, flush() завершує всі pending timers. Тест виглядає синхронно. waitForAsync (раніше async()): чекає реальних Promise/Observable через fixture.whenStable(). Дозволяє реальні async операції але тест може бути повільнішим. fakeAsync кращий для більшості async тестів бо контрольований і швидкий."
      senior: "fakeAsync використовує Zone.js FakeAsyncTestZone що заміняє setTimeout/setInterval/Promise на fake implementations. tick(ms) advances fake clock. flush() завершує всі pending macrotasks. flushMicrotasks() для Promises. Важливо: HTTP requests через HttpClient всередині fakeAsync — потрібен HttpTestingController.flush() для response. Observable subscribe'ами в fakeAsync: синхронні observables — OK; асинхронні через timer/delay — потребують tick(). discardPeriodicTasks() — для незавершених intervals після тесту. waitForAsync: реальні timers, fixture.whenStable() чекає Zone.js stability — аналогічно до SSR ApplicationRef.isStable."
      staff: "fakeAsync — це deterministic async control. В складних сценаріях: вкладені setTimeout, Promise chain, RxJS delay operators — fakeAsync дозволяє precise control над timing. Limitation: XMLHttpRequest не підтримується в fakeAsync (HttpClient з fetch — OK, але legacy XHR — ні). Alternative для Observable testing: TestScheduler (RxJS) для marble testing — більш declarative і потужніший для complex timing scenarios. Team consideration: встановити конвенцію — fakeAsync для компонентних тестів, TestScheduler для RxJS operator тестів. Jest: jest.useFakeTimers() + jest.runAllTimers() аналогічний до fakeAsync але не zone-aware — деякі Angular async patterns потребують additional configuration."
    commonMistakes:
      - "Не викликають discardPeriodicTasks() після тесту з intervals — тести залишають pending tasks"
      - "Змішують fakeAsync і real async в одному тесті — непередбачувана поведінка"
    relatedQuestions: ["b18t1q2", "b18t5q1"]
  - level: "senior"
    question: "Яка різниця між Jest і Jasmine для Angular тестів і як налаштувати Jest?"
    referenceAnswers:
      junior: "Jest і Jasmine — обидва дозволяють писати тести. Jest популярніший і швидший, Jasmine — стандартний з Angular CLI."
      mid: "Jasmine — стандартний test runner в Angular CLI (ng test → Karma + Jasmine). Jest: швидший (parallel execution, snapshot testing, built-in mocking), популярніший в broader JS ecosystem, немає Karma browser requirement (runs in jsdom). Для Angular: jest-preset-angular надає TypeScript transform і JSDOM setup. Конфігурація: jest.config.ts з preset 'jest-preset-angular', setupFilesAfterFramework: ['setup-jest.ts']."
      senior: "Jest для Angular: jest-preset-angular transform'ить TypeScript + Angular decorators. Важливі налаштування: transformIgnorePatterns для ESM packages (Angular 16+ пакети — ESM only), testEnvironment: 'jsdom'. Jest snapshot testing для Angular templates — корисно але fragile (minor template change = snapshot update). Jest mock functions (jest.fn(), jest.spyOn()) vs Jasmine (jasmine.createSpy()) — різний API але схожа концепція. Jest coverage через jest --coverage vs Karma/Istanbul. Переваги Jest: --watch mode кращий, parallel test workers, module mocking зручніший. Недоліки: Angular-specific patterns (TestBed) потребують більше конфігурації; Karma тестує в реальному браузері, Jest — в jsdom (відмінності в DOM behavior)."
      staff: "Architectural рішення: Jasmine + Karma vs Jest — не тільки технічне, а команда і ecosystem. Jest: краще для CI (headless, швидше), кращий developer experience (watch, errors). Karma: реальний браузер testing (більш accurate для browser-specific bugs), кращий для legacy code без refactoring. Migration: ng add jest (через jest-schematic) або jest-preset-angular manual setup. Pitfalls при міграції: Zone.js + jest interactions, ESM imports (rxjs, Angular v16+ self are ESM), snapshot tests що зберігають Angular-specific виводи. Recommendation для нових проєктів: Jest + jest-preset-angular. Для enterprise: Vitest як альтернатива (native ESM, Vite-powered, Angular 19+ офіційна підтримка через @angular/build:unit-test). TypeScript path aliases: треба налаштовувати moduleNameMapper в jest.config.ts."
    commonMistakes:
      - "Не налаштовують transformIgnorePatterns для ESM packages — ImportError для @angular/* пакетів"
      - "Порівнюють Jest і Karma/Jasmine як одну категорію — Jest = runner + matcher + mock, Karma = тільки test runner"
    relatedQuestions: ["b18t1q3", "b18t6q1"]
  - level: "staff"
    question: "Як оптимізувати performance великого Angular test suite?"
    referenceAnswers:
      junior: "Запускати тести паралельно і використовувати Jest замість Karma — він швидший."
      mid: "Jest parallel workers для multiple CPU cores. Уникати непотрібного TestBed.configureTestingModule() для кожного тесту. Mock важких залежностей замість реальних HTTP calls. Вимикати animations в тестах (NoopAnimationsModule або provideNoopAnimations())."
      senior: "Оптимізації: 1) TestBed.resetTestingModule() між describe blocks замість між кожним test (зберігає компіляцію), 2) beforeAll замість beforeEach для immutable fixtures, 3) provideNoopAnimations() скрізь де є анімації, 4) Lazy-init TestBed — не configureTestingModule якщо тест не потребує DOM, 5) Jest --maxWorkers для CPU optimization, 6) jest --testPathPattern для running specific tests в development. Code organization: тести що потребують TestBed окремо від pure unit тестів (без TestBed) — різний performance profile."
      staff: "Test performance architecture: 1) Test classification — pure functions (no TestBed, instant), service unit tests (minimal TestBed), component tests (full TestBed), integration (slower), E2E (slowest). CI optimization: sharded test runs (Jest --shard 1/4, etc.), cache node_modules і jest cache між runs. Test isolation vs shared TestBed: TestBed.configureTestingModule повторно expensive — але shared TestBed між tests потребує careful state cleanup. Test suite metrics: track test count, execution time trends, flakiness rate. Flaky tests cost: developers distrust suite → skip running tests → bugs in prod. Systematic fix: identify flaky tests (retry mechanism for detection), fix root cause (usually timing or state leakage), add to CI test health dashboard. Angular 19+: experimental jest integration через @angular/build:unit-test з Vitest — значне покращення DX і performance."
    commonMistakes:
      - "Шарять mutable state між тестами через module-level variables — flaky tests"
      - "Не відстежують test performance trends — деградація непомітна до критичного рівня"
    relatedQuestions: ["b18t1q4", "b18t6q1"]
---

## Core Concept

**English definition:** Angular unit testing uses TestBed as the primary testing utility to create a micro Angular environment — providing component compilation, DI container, and rendering context — allowing components and services to be tested in isolation from the full application.

**Пояснення:** TestBed — це "мінімальний Angular" для тестів. Замість bootstrap всього додатку ти конфігуруєш тільки те що потрібно для конкретного тесту: компоненти, сервіси, providers. ComponentFixture — це wrapper що надає доступ до компонента, його DOM і change detection. Без TestBed — Angular компоненти просто класи, без шаблону і DI.

**Яку проблему вирішує:**
- **Component isolation:** Тест тільки одного компонента без залежності від всього додатку
- **DI в тестах:** Замінити реальні сервіси на мок-объекти через providers
- **DOM testing:** Перевірити що template правильно відображає стан
- **Async control:** fakeAsync/tick для predictable async testing

**Як працює під капотом:**

1. `TestBed.configureTestingModule({ declarations, imports, providers })` компілює компоненти і створює testing NgModule / standalone environment
2. `TestBed.createComponent(ComponentClass)` instantiates компонент і додає його до test DOM (JSDOM або iframe)
3. `fixture.componentInstance` — reference на екземпляр компонента
4. `fixture.nativeElement` — reference на DOM element компонента
5. `fixture.detectChanges()` запускає Angular change detection → template оновлюється
6. `fixture.debugElement` — Angular's wrapper над DOM що підтримує Angular-specific queries

```typescript
// Базова структура unit тесту для компонента
describe('CounterComponent', () => {
  let component: CounterComponent;
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent], // standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // initial change detection → ngOnInit
  });

  it('should increment counter', () => {
    component.increment();
    fixture.detectChanges(); // update DOM after state change
    expect(fixture.nativeElement.querySelector('.count').textContent).toBe('1');
  });
});
```

**Trade-offs та обмеження:**
- TestBed compile step — overhead для кожного `configureTestingModule()`
- Angular components потребують TestBed, pure TypeScript classes — ні
- fakeAsync не сумісний з реальними XHR requests (тільки fetch API)
- jsdom (Jest) відрізняється від реального браузера — деякі DOM behaviors різні

**Версійність:**
- Angular 2: TestBed і ComponentFixture як основа
- Angular 9: Ivy ускорив компіляцію в тестах
- Angular 14+: Standalone components без NgModule в TestBed
- Angular 16+: Signal inputs потребують спеціальної обробки в тестах
- Angular 19+: Expérimental Vitest integration через `@angular/build:unit-test`

## Deep Details

### Edge Cases

**NO_ERRORS_SCHEMA — небезпечний ярлик:**
```typescript
// ❌ NO_ERRORS_SCHEMA ховає помилки
TestBed.configureTestingModule({
  declarations: [ParentComponent],
  schemas: [NO_ERRORS_SCHEMA], // ігнорує всі unknown elements і attributes
});
// Якщо template має <app-child [mistyped]="value"> — NO error
// Якщо є <app-chid> (typo в назві) — NO error
// Баги проходять непоміченими

// ✅ Краще: стаб компоненти або CUSTOM_ELEMENTS_SCHEMA для web components
@Component({ selector: 'app-child', template: '', standalone: true })
class ChildComponentStub {}

TestBed.configureTestingModule({
  imports: [ParentComponent, ChildComponentStub],
});
```

**detectChanges і OnPush:**
```typescript
// OnPush component — detectChanges() не завжди тригерить update
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class OnPushComponent {
  @Input() value!: string;
}

// fixture.detectChanges() тригерить тільки якщо input reference змінився
component.value = 'new'; // OK якщо value - primitive
fixture.detectChanges();

// Для object/array inputs — треба новий reference:
component.items = [...component.items, newItem]; // new array reference
fixture.detectChanges();
```

**compileComponents() — коли потрібен:**
```typescript
// Потрібний якщо templateUrl або styleUrls (async file reads)
beforeEach(async () => {
  await TestBed.configureTestingModule({
    declarations: [ComponentWithTemplateUrl],
  }).compileComponents(); // async compilation

  fixture = TestBed.createComponent(ComponentWithTemplateUrl);
});

// Не потрібний для inline templates (більшість сучасних компонентів)
```

### Junior vs Senior Understanding

**Junior** знає API: TestBed.configureTestingModule, fixture.detectChanges, nativeElement.querySelector.

**Senior** розуміє КОЛИ і ЧОМУ: різниця між detectChanges для initial render і після state change, OnPush зі складним trigger strategy в тестах, коли не потрібен TestBed взагалі (service без DI = pure function test), і як структурувати тести для maintainability (Arrange-Act-Assert, test helpers, page objects).

```typescript
// Senior: test helper для зменшення boilerplate
function createCounterFixture(props: Partial<CounterComponent> = {}) {
  TestBed.configureTestingModule({
    imports: [CounterComponent],
  });
  const fixture = TestBed.createComponent(CounterComponent);
  Object.assign(fixture.componentInstance, props);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

// Senior: DebugElement queries (більш Angular-native)
const buttonEl = fixture.debugElement.query(By.css('button'));
buttonEl.triggerEventHandler('click', null);

// Junior зазвичай: nativeElement.querySelector (DOM-level, less Angular-aware)
const button = fixture.nativeElement.querySelector('button');
button.click();
```

### Deprecation & Migration Path

- **Deprecated:** `async()` helper від `@angular/core/testing` → замінений на `waitForAsync()`
- **Deprecated:** `TestBed.get()` → замінений на `TestBed.inject()`
- **Migration:** Angular 16+ standalone — `imports` замість `declarations` + `imports` в `configureTestingModule`
- **Karma → Jest:** `ng add jest-schematic` або `ng add @angular/build:unit-test` (Angular 19+)

### Connections to Other Concepts

- **Testing Services (Topic 2):** TestBed.inject() для отримання сервісів в тестах
- **Testing Components (Topic 3):** ComponentFixture, By.css, triggerEventHandler
- **Change Detection:** fixture.detectChanges() = manual CD trigger; OnPush strategy in tests
- **Dependency Injection:** TestBed.configureTestingModule providers = DI overrides в тесті

## Examples

### Basic Usage

```typescript
// counter.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  let component: CounterComponent;
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent], // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display initial count of 0', () => {
    const countEl = fixture.nativeElement.querySelector('[data-testid="count"]');
    expect(countEl.textContent.trim()).toBe('0');
  });

  it('should increment on button click', () => {
    const button = fixture.nativeElement.querySelector('[data-testid="increment"]');
    button.click();
    fixture.detectChanges();
    expect(component.count).toBe(1);
  });

  it('should debounce rapid increments (async)', fakeAsync(() => {
    component.scheduledIncrement(); // async, debounced 300ms
    expect(component.count).toBe(0); // not yet

    tick(300);
    fixture.detectChanges();
    expect(component.count).toBe(1); // after debounce
  }));
});
```

### Production Scenario

```typescript
// user-profile.component.spec.ts — production-level test
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { UserProfileComponent } from './user-profile.component';
import { UserService } from '../services/user.service';

// Stub child component — shallow testing
@Component({ selector: 'app-avatar', template: '<img [src]="imageUrl">', standalone: true })
class AvatarStub {
  @Input() imageUrl = '';
}

describe('UserProfileComponent', () => {
  let fixture: ComponentFixture<UserProfileComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getProfile', 'updateProfile']);
    userServiceSpy.getProfile.and.returnValue(of({
      id: '1', name: 'John Doe', email: 'john@example.com', avatarUrl: '/avatar.jpg',
    }));

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent, AvatarStub],
      providers: [{ provide: UserService, useValue: userServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    fixture.detectChanges();
  });

  it('should display user name', () => {
    const nameEl = fixture.debugElement.query(By.css('[data-testid="user-name"]'));
    expect(nameEl.nativeElement.textContent).toContain('John Doe');
  });

  it('should pass avatarUrl to app-avatar', () => {
    const avatarEl = fixture.debugElement.query(By.directive(AvatarStub));
    expect(avatarEl.componentInstance.imageUrl).toBe('/avatar.jpg');
  });
});
```

### Anti-Example

```typescript
// ❌ WRONG: Тест залежить від implementation details
it('should update', () => {
  component['_internalCounter']++; // accessing private property — fragile
  expect(component['_data'].length).toBe(1); // private state
  fixture.detectChanges();
});

// ❌ WRONG: Дублювання настройки замість beforeEach
it('test 1', async () => {
  await TestBed.configureTestingModule({ imports: [MyComponent] }).compileComponents();
  const fixture = TestBed.createComponent(MyComponent);
  fixture.detectChanges();
  // ... test
});
it('test 2', async () => {
  await TestBed.configureTestingModule({ imports: [MyComponent] }).compileComponents(); // DRY violation
  // ...
});

// ✅ CORRECT: Test public behavior, shared setup
describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MyComponent] }).compileComponents();
    fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
  });

  it('should update display', () => {
    fixture.componentInstance.publicMethod(); // test through public API
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result').textContent).toBe('updated');
  });
});
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `NO_ERRORS_SCHEMA` скрізь | Template binding errors і typos не виявляються | Стаб-компоненти або повний import для critical interactions |
| Тестування private properties | Тести тендітні — ламаються при refactoring | Тестувати тільки публічний API і DOM output |
| Відсутність `fixture.detectChanges()` після state change | DOM не оновлений — тест перевіряє застарілий стан | Завжди `detectChanges()` після зміни component state |
| `beforeEach` що робить реальні HTTP calls | Повільні, flaky tests залежать від зовнішніх факторів | Mock HTTP через HttpTestingController або spyOn |
| TestBed в unit-тестах для pure functions/services | Зайвий overhead — pure functions не потребують Angular runtime | TestBed тільки якщо потрібен Angular DI або DOM |

## Interview Block

### [L1 — Warm-up] Що таке TestBed в Angular testing і навіщо він потрібен?
**Signal being tested:** Розуміння ролі TestBed як мінімального Angular runtime для ізольованого testing
**What the interviewer expects:** Налаштування testing module, DI overrides, ComponentFixture, detectChanges purpose
**How to probe deeper:** "Що відбувається якщо не викликати fixture.detectChanges()?"
**Reference answer:** TestBed.configureTestingModule() створює мінімальний Angular environment — компілює компоненти і налаштовує DI. TestBed.createComponent() instantiates компонент. fixture.detectChanges() запускає rendering pipeline (ngOnInit + template evaluation + DOM update) — без нього template не рендериться і ngOnInit не викликається.
**Common mistakes:** Думають що TestBed — це тільки для компонентів (він для сервісів теж); не розуміють для чого detectChanges()

### [L2 — Mid] В чому різниця між shallow і deep testing? Коли використовувати кожен?
**Signal being tested:** Здатність вибирати testing strategy з урахуванням trade-offs між isolation і coverage
**What the interviewer expects:** NO_ERRORS_SCHEMA vs stubs vs real imports, coupling trade-offs, testing pyramid
**How to probe deeper:** "Які баги NO_ERRORS_SCHEMA дозволяє пропустити?"
**Reference answer:** Shallow: ізолює від дочірніх компонентів через стаби або NO_ERRORS_SCHEMA — швидкі, focused тести. Deep: реальні дочірні компоненти — перевіряє інтеграцію але повільніші і coupling. NO_ERRORS_SCHEMA ховає template binding errors (typos в input names, missing components). Recommendation: shallow для unit тестів більшості компонентів, deep для critical parent-child interaction.
**Common mistakes:** NO_ERRORS_SCHEMA everywhere; глибоке тестування для simple presentational components

### [L3 — Senior] Яка різниця між fakeAsync і waitForAsync? Коли кожен підходить?
**Signal being tested:** Розуміння Zone.js fake timer mechanism і вибір async testing strategy
**What the interviewer expects:** fakeAsync = Zone fake timers + tick/flush, waitForAsync = real async + whenStable, коли кожен, limitations
**How to probe deeper:** "Чому fakeAsync не завжди підходить для HTTP request тестів?"
**Reference answer:** fakeAsync замінює Zone.js timers на fake — tick(ms) симулює час синхронно. Ідеально для: setTimeout, setInterval, RxJS delay. waitForAsync чекає реальних async через whenStable(). HTTP з HttpTestingController в fakeAsync: потрібен controller.flush() для response. discardPeriodicTasks() після тесту з intervals.
**Common mistakes:** Не клікають discardPeriodicTasks() — pending tasks error; змішують fakeAsync і real timers

### [L4 — Staff/Principal] Як оптимізувати performance великого Angular test suite?
**Signal being tested:** System-level thinking про test infrastructure, performance, і developer experience
**What the interviewer expects:** Jest parallel workers, TestBed reuse strategy, test classification, CI sharding, flaky test management
**How to probe deeper:** "Як ви виявляєте і усуваєте flaky тести систематично?"
**Reference answer:** Optimization layers: pure function тести без TestBed (fastest), service тести з мінімальним TestBed, component тести. Jest --maxWorkers для паралелізації. TestBed.resetTestingModule між describe groups замість кожного test. CI sharding (Jest --shard). Flaky test management: retry mechanism для detection, fix timing issues і state leakage. Track test execution time trends.
**Common mistakes:** Не класифікують тести по важкості; ігнорують flaky test накопичення

## Summary

### Key Points
- TestBed — мінімальний Angular runtime для тестів: DI container + component compilation + DOM rendering
- `fixture.detectChanges()` запускає Angular rendering pipeline — обов'язково після state changes
- Shallow testing (стаби/NO_ERRORS_SCHEMA) для ізоляції; deep testing для інтеграційних перевірок
- NO_ERRORS_SCHEMA зручний але небезпечний — ховає template binding errors
- `fakeAsync` + `tick()` = детермінований async control; `waitForAsync` + `whenStable()` = реальний async
- `TestBed.inject()` (а не deprecated `TestBed.get()`) для отримання сервісів
- Jest швидший і популярніший; Jasmine + Karma — стандарт Angular CLI але slowер у CI

### Elevator Pitch (2 minutes)
"Angular unit testing будується навколо TestBed — utility що створює мінімальний Angular environment. TestBed.configureTestingModule() налаштовує testing module з потрібними компонентами і services. ComponentFixture надає доступ до компонента і його DOM. fixture.detectChanges() запускає rendering — без нього template не оновлюється. Вибір між shallow testing (стаб-компоненти для ізоляції) і deep testing (реальні дочірні) залежить від: unit ізоляція vs integration coverage. Async тестування: fakeAsync + tick() для контрольованих таймерів, waitForAsync + whenStable() для реальних async. Jest vs Jasmine: Jest швидший і має кращий DX для CI, Jasmine — стандартний з Angular CLI. Ключова порада: тестувати публічний API і DOM output, не private implementation details."
