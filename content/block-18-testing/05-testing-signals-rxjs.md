---
title: "Testing Signals and RxJS"
block: 18
topic: 5
slug: "testing-signals-rxjs"
difficulty: 4
sinceVersion: "17"
tags: ["signal testing", "effect testing", "TestBed.flushEffects", "toSignal", "TestScheduler", "marble testing"]
relatedTopics: ["testing-services", "testing-components", "unit-testing", "change-detection"]
interviewQuestions:
  - id: "b18t5q1"
    level: "junior"
    question: "Як тестувати Angular signal — перевіряти його значення в тестах?"
    referenceAnswers:
      junior: "Signal — це функція, тому signal() повертає поточне значення. В тесті просто викликаємо signal() і перевіряємо значення."
      mid: "Signal — callable функція що повертає поточне значення. В TestBed context: component.mySignal() читає value. Для writable signals: signal.set(value) або signal.update(fn). Але читання signal поза injection context (поза TestBed або runInInjectionContext) може не відстежуватися — для простого value check це OK. TestBed.inject(MyService) → service.count() — читаємо поточне значення."
      senior: "Signal reading в тестах: signal() повертає поточний snapshot — синхронно. Computed signals: також callable, lazy evaluation — якщо залежності не змінились, повертають кешоване значення. Для тестування computed: set/update залежні signals, читати computed. Signal effects (side effects) потребують injection context і є async — TestBed.flushEffects() для synchronous testing. TestBed.runInInjectionContext() якщо потрібно create signals поза компонентом/сервісом. В component tests: fixture.detectChanges() не потрібен для signal reads — signals synchronously update computed chain."
      staff: "Signal testing philosophy: signals є synchronous reactive primitives — їх testing простіше ніж RxJS Observables. Немає async, немає subscribe, просто read after write. Challenges: 1) Effects — асинхронні, потребують flushEffects(), 2) toSignal() — bridge між RxJS і Signals — потребує injection context і Observable subscription, 3) Signal-based components з OnPush — detectChanges() після signal update для DOM assertion. Performance consideration: signal reactivity graph є internal — тестуємо через public API (final values, emitted events), не через reactivity internals. In Angular 21: untracked() calls в computed/effects — тестувати side effects через observable output або state changes."
    commonMistakes:
      - "Намагаються тестувати effects без TestBed.flushEffects() — effects виконуються асинхронно"
      - "Читають signal поза injection context без runInInjectionContext — може не відстежуватись"
    relatedQuestions: ["b18t5q2", "b18t1q1"]
  - id: "b18t5q2"
    level: "mid"
    question: "Як тестувати effect() в Angular і навіщо потрібен TestBed.flushEffects()?"
    referenceAnswers:
      junior: "Effects — це side effects що виконуються при зміні signals. TestBed.flushEffects() запускає їх в тестах."
      mid: "effect() виконується асинхронно після change detection cycle — не синхронно при зміні signal. TestBed.flushEffects() (Angular 18+) синхронно виконує всі pending effects. Без нього: зміна signal → effect scheduled but not run → assertion fails. Порядок: signal.set(value) → TestBed.flushEffects() → assert side effect occurred."
      senior: "effect() scheduling: ефект schedules виконання після поточного мікро-task queue — використовує microtask scheduling. В TestBed context: detectChanges() тригерить деякі effects в контексті компонента. Але TestBed.flushEffects() — єдиний надійний спосіб запустити всі pending effects synchronously. Injection context requirement: effect() потрібен injection context для cleanup (DestroyRef). В тесті: TestBed.configureTestingModule → TestBed.inject(MyService) — injection context існує. Якщо effect в компоненті: fixture.componentInstance — injection context компонента. Effect cleanup testing: verify effect runs on destroy, TestBed.resetTestingModule() тригерить destroy."
      staff: "Effect testing strategy: ефект — це reactive side effect, найскладніший для тестування. Два підходи: 1) Direct effect testing (TestBed.flushEffects) — тестує що ефект виконується коректно, 2) Indirect effect testing — тестує output ефекту (state зміна, service call) — більш behavior-oriented. Recommendation: prefer indirect (що зробив ефект) над direct (чи виконався ефект). Ефект що викликає сервіс: тестуємо що сервіс викликаний + signal set → flushEffects → verify service called. Complex effects: effects що підписуються на Observables (toObservable) — потребують combined Signal + Observable testing. Angular 18 flushEffects vs Jasmine clock: якщо effects мають setTimeout всередині — combine flushEffects + fakeAsync."
    commonMistakes:
      - "Не викликають flushEffects() — ефект scheduled але не executed — assertion проходить помилково"
      - "Testing effect through spy on signal reads замість side effect output"
    relatedQuestions: ["b18t5q1", "b18t5q3"]
  - id: "b18t5q3"
    level: "mid"
    question: "Як тестувати toSignal() і toObservable() bridge функції?"
    referenceAnswers:
      junior: "toSignal перетворює Observable на Signal. При тестуванні треба мати injection context і Observable що emit'ить значення."
      mid: "toSignal() потребує injection context. В тесті: або TestBed.inject() (автоматичний context), або TestBed.runInInjectionContext(() => toSignal(obs)). Subject.next() для emit нового значення → signal() повертає нове. toObservable() converting signal → observable: в injection context, subscribe для assertion."
      senior: "toSignal() internals: підписується на Observable в injection context, зберігає останнє значення в writable signal, повертає readonly signal. Cleanup через DestroyRef. В тесті: 1) Service що містить toSignal() — TestBed.inject(), signal читається після Observable emit. 2) Manual: TestBed.runInInjectionContext(() => { const sig = toSignal(subject.asObservable()); subject.next(value); expect(sig()).toBe(value); }). toObservable() testing: signal зміна → Observable emit — перевірити через subscribe або firstValueFrom. initialValue для toSignal: якщо Observable не emitted yet — signal повертає initialValue (або undefined if not set). requireSync option: Observable must emit synchronously."
      staff: "toSignal/toObservable bridges є критичними для incremental Signal adoption. Testing consideration: toSignal encapsulates subscription — тест не має прямого доступу до subscription state. Testing pattern: через observable source (Subject) → set → read signal. Edge cases: 1) Error від Observable з toSignal: після Angular 17.1 — signal кидає error при читанні, 2) initialValue vs undefined initial state — тестувати обидва варіанти, 3) requireSync: observable що не emit синхронно з requireSync — кидає runtime error — важливий edge case для тестування. Integration with component: @Component що використовує toSignal для data loading — тестувати initial state (loading), success state, error state через Subject control."
    commonMistakes:
      - "toSignal() поза injection context — error 'NG0203: toSignal() can only be used within injection context'"
      - "Не тестують initial undefined state — компонент може render з undefined до Observable emit"
    relatedQuestions: ["b18t5q2", "b18t5q4"]
  - id: "b18t5q4"
    level: "senior"
    question: "Що таке marble testing з RxJS TestScheduler і коли його використовувати?"
    referenceAnswers:
      junior: "Marble testing дозволяє описувати Observable sequences через ASCII символи — 'marble diagrams'. Кожен символ = один frame часу."
      mid: "RxJS TestScheduler дозволяє описувати hot і cold observables через marble strings: '-a-b-c|' (emit a, b, c, complete), '--#' (error), '---' (never completes). expectObservable(obs).toBe(expectedMarble, values) — assertion через marble. Корисний для: timing-based operators (debounceTime, delay, throttleTime), complex async chains, race conditions."
      senior: "TestScheduler.run(({ cold, hot, expectObservable }) => { ... }). cold('--a-b|', { a: 1, b: 2 }) — cold observable (starts when subscribed). hot('-a--b-c', { a: 1 }) — hot observable (already running). Marble syntax: '-' = 1 frame (10ms default), 'a'-'z' = emitted value, '|' = complete, '#' = error, '()' = synchronous group. expectObservable captures all frames. Ефективний для тестування custom operators, complex switchMap chains, timing guarantees. Обмеження: тільки для scheduled observables (using scheduler parameter) — більшість HttpClient тестів не потребують TestScheduler."
      staff: "Marble testing є power tool для complex RxJS logic. Use cases: 1) Custom RxJS operators (switchMap з retry і backoff), 2) Timing-sensitive UX logic (debounced search, throttled scroll), 3) Race conditions (switchMap vs mergeMap behavior), 4) Error recovery sequences. Integration з Angular testing: компоненти з RxJS pipelines — можна замінити scheduler: operators що приймають SchedulerLike параметр (observeOn, subscribeOn, debounceTime) → pass asyncScheduler в production, pass testScheduler в tests. Architectural consideration: якщо operator chain складно тестувати без marble — це сигнал що chain занадто складний → виділити в окрему pure RxJS function → marble test. Team consideration: marble syntax — learning curve — документувати використані patterns."
    commonMistakes:
      - "Тестують schedulerless observables через TestScheduler — marble не спрацьовує"
      - "Не вказують scheduler в operators під тест (debounceTime без scheduler arg) — TestScheduler не контролює timing"
    relatedQuestions: ["b18t5q3", "b18t5q5"]
  - id: "b18t5q5"
    level: "staff"
    question: "Як побудувати тестову стратегію для Service що поєднує Signals і RxJS?"
    referenceAnswers:
      junior: "Тестувати кожну частину окремо — спочатку RxJS, потім signals."
      mid: "Для RxJS частини: firstValueFrom або TestScheduler. Для Signal частини: direct signal() read. Для bridge (toSignal): injection context test."
      senior: "Strategy: 1) Ізолювати pure RxJS logic (operators, transformations) → marble або firstValueFrom tests, 2) Ізолювати signal state → TestBed + direct read, 3) Test integration (toSignal bridge) → TestBed + Subject control. Subject як controlled input дозволяє тестувати всю chain: subject.next() → signal updates via toSignal → effect runs via flushEffects. Для timing: fakeAsync + tick для scheduler-based logic in signals context."
      staff: "Mixed Signal/RxJS service architecture testing: treat each reactive primitive as its own responsibility. Pure Observable pipelines (data fetching, transformation) — service boundary, test with TestScheduler or firstValueFrom. Signal state (UI state, derived values) — component/UI boundary, test with direct reads. Bridge patterns (toSignal, toObservable) — integration concern, test both sides. Systematic approach: create test matrix: for each public API method/signal/observable, what inputs cause what outputs/side effects. This matrix drives test cases. Completeness metric: every cell in matrix tested. Tools: property-based testing (fast-check) for signal invariants — 'count signal never goes negative', 'selected item always in items list'. For complex reactive services: consider separating pure state management (signals, no side effects) from side-effect layer (effects, Observables) — each layer independently testable."
    commonMistakes:
      - "Testing reactive state through spy on internal signals замість через public API outputs"
      - "Не тестують state consistency — сигнали можуть бути в inconsistent state при concurrent updates"
    relatedQuestions: ["b18t5q2", "b18t2q5"]
---

## Core Concept

**English definition:** Testing Angular Signals involves reading signal values synchronously, flushing effects via TestBed.flushEffects(), and testing Signal/Observable bridges (toSignal, toObservable) within an injection context. RxJS testing uses TestScheduler for marble-based timing tests or firstValueFrom for simpler cases.

**Пояснення:** Signals — синхронні reactive primitives: `signal()` читає поточне значення напряму. Effects — асинхронні: потребують `TestBed.flushEffects()`. RxJS Observables — залежить від source: synchronous (of()) — просто subscribe, async (timer, delay) — TestScheduler або fakeAsync. Headliner Angular 17+: Signal APIs потребують injection context для creation але не для reading.

**Яку проблему вирішує:**
- **Synchronous reactive testing:** Signals — no subscribe, no async — прості assertions
- **Effect side-effect testing:** TestBed.flushEffects() для запуску pending effects
- **Bridge testing:** toSignal(observable) і toObservable(signal) потребують injection context
- **Timing-based RxJS:** TestScheduler marble testing для operators з scheduler (debounceTime, delay)

**Як працює під капотом:**

```typescript
// Signal test — synchronous reads
const counter = signal(0);
counter.set(5);
expect(counter()).toBe(5); // Direct read — no async

// Effect test — needs flush
effect(() => {
  console.log('counter:', counter()); // side effect
});
counter.set(10);
TestBed.flushEffects(); // synchronously runs all pending effects
// Now console.log has been called

// RxJS marble test
TestScheduler.run(({ cold, expectObservable }) => {
  const source$ = cold('--a-b|', { a: 1, b: 2 });
  const result$ = source$.pipe(map(x => x * 2));
  expectObservable(result$).toBe('--a-b|', { a: 2, b: 4 });
});
```

**Trade-offs та обмеження:**
- `TestBed.flushEffects()` — Angular 18+; раніше були workarounds через `fixture.detectChanges()`
- Marble testing тільки для scheduled observables — не всі RxJS operations scheduler-based
- `toSignal()` requires injection context — поза TestBed потрібен runInInjectionContext
- Effect cleanup ordering — може бути складним при nested effects

**Версійність:**
- Angular 16: Signals developer preview, effect(), signal(), computed()
- Angular 17: Signals stable, toSignal() / toObservable() stable
- Angular 17.1: Signal inputs, model() inputs/outputs
- Angular 18: TestBed.flushEffects() stable API для effect testing
- Angular 19: linkedSignal(), resource() — нові signal primitives

## Deep Details

### Edge Cases

**Effect cleanup і DestroyRef:**
```typescript
it('should cleanup effect on service destroy', () => {
  // TestBed автоматично destroys інжектовані сервіси при resetTestingModule
  const effectSpy = jasmine.createSpy('effectFn');
  const service = TestBed.inject(MyService);

  // Override internal signal to track effect execution
  service.someSignal.set('initial');
  TestBed.flushEffects();
  expect(effectSpy).toHaveBeenCalledTimes(1);

  // After destroy, effect should not run
  TestBed.resetTestingModule();
  // Create new TestBed... verify effect not running
});
```

**Computed signal lazy evaluation:**
```typescript
it('should compute value lazily', () => {
  const a = signal(1);
  const b = signal(2);
  const sum = computed(() => a() + b());

  // sum hasn't been evaluated yet — lazy
  a.set(10);
  // sum is still not evaluated

  expect(sum()).toBe(12); // evaluated now, a=10, b=2
  // computed caches result
  expect(sum()).toBe(12); // cached, no re-computation
});
```

**toSignal з initialValue vs undefined:**
```typescript
it('should handle initial state before observable emits', () => {
  TestBed.configureTestingModule({});

  const subject = new Subject<string>();
  let sig!: Signal<string | undefined>;

  TestBed.runInInjectionContext(() => {
    sig = toSignal(subject.asObservable()); // initialValue = undefined
  });

  expect(sig()).toBeUndefined(); // before first emit

  subject.next('hello');
  expect(sig()).toBe('hello'); // after emit
});
```

### Junior vs Senior Understanding

**Junior** знає: signal() = read, set() = write, effect = side effect, marble = ASCII timing diagram.

**Senior** розуміє scheduling model: коли effects виконуються (мікро-task queue), чому TestBed.flushEffects() потрібен, injection context requirements і їх implikації. Senior обирає між marble testing і firstValueFrom залежно від scenario (timing-critical vs simple async). Знає як тестувати computed chains через dependency manipulation.

```typescript
// Senior: comprehensive signal service test
describe('CartSignalService', () => {
  let service: CartSignalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartSignalService],
    });
    service = TestBed.inject(CartSignalService);
  });

  describe('signals', () => {
    it('should compute total from items', () => {
      service.addItem({ id: '1', price: 10, qty: 2 }); // set via public method
      service.addItem({ id: '2', price: 5, qty: 1 });

      expect(service.total()).toBe(25); // computed: 10*2 + 5*1
      expect(service.itemCount()).toBe(2); // computed: distinct items
    });

    it('should update derived signals when item removed', () => {
      service.addItem({ id: '1', price: 10, qty: 1 });
      service.addItem({ id: '2', price: 20, qty: 1 });
      service.removeItem('1');

      expect(service.total()).toBe(20);
      expect(service.isEmpty()).toBe(false);
    });
  });

  describe('effects', () => {
    it('should save to localStorage when cart changes', () => {
      const saveSpy = spyOn(service['storageService'], 'save');
      service.addItem({ id: '1', price: 10, qty: 1 });

      TestBed.flushEffects(); // flush scheduled effects

      expect(saveSpy).toHaveBeenCalledWith('cart', jasmine.any(Object));
    });
  });
});
```

### Deprecation & Migration Path

- Angular 16: `effect()` перша версія — required `manualCleanup: true` або injection context for cleanup
- Angular 17: `effect()` stable, automatic cleanup via DestroyRef
- Angular 18: `TestBed.flushEffects()` stable, раніше був `flush()` workaround
- Angular 19: `linkedSignal()`, `resource()` — нові testing patterns coming
- RxJS 7: `firstValueFrom` і `lastValueFrom` замінили `.toPromise()` (deprecated)

### Connections to Other Concepts

- **Unit Testing (Topic 1):** TestBed, fakeAsync — базові tools
- **Testing Services (Topic 2):** firstValueFrom для Observable, injection context
- **Change Detection:** Signal updates і component rendering — detectChanges в component tests
- **Signals (Block 9):** Signal primitives, computed, effect internals

## Examples

### Basic Usage

```typescript
// counter.service.spec.ts — signal service testing
import { TestBed } from '@angular/core/testing';
import { CounterService } from './counter.service';

describe('CounterService (Signals)', () => {
  let service: CounterService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CounterService] });
    service = TestBed.inject(CounterService);
  });

  it('should initialize with 0', () => {
    expect(service.count()).toBe(0);
  });

  it('should increment count signal', () => {
    service.increment();
    expect(service.count()).toBe(1);

    service.increment();
    expect(service.count()).toBe(2);
  });

  it('should compute doubled value', () => {
    service.increment();
    service.increment();
    expect(service.doubled()).toBe(4); // computed: count * 2
  });

  it('should run effect on count change', () => {
    const logSpy = spyOn(console, 'log');

    service.increment();
    TestBed.flushEffects(); // flush Angular 18+

    expect(logSpy).toHaveBeenCalledWith('Count changed:', 1);
  });
});
```

### Production Scenario

```typescript
// search.service.spec.ts — RxJS marble testing
import { TestScheduler } from 'rxjs/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let testScheduler: TestScheduler;
  let service: SearchService;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    // Service with debounced search — no TestBed needed for pure RxJS
    service = new SearchService();
  });

  it('should debounce search queries (300ms)', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      // Rapid typing — 'a', 'ab', 'abc' within 300ms debounce
      const input$ = hot('-a-b-c---------d|', {
        a: 'a', b: 'ab', c: 'abc', d: 'test',
      });

      // Only 'abc' and 'test' should pass debounce
      const expected = '----------c----d|';

      const result$ = service.search(input$);
      expectObservable(result$).toBe(expected, { c: 'abc', d: 'test' });
    });
  });

  it('should cancel pending search on new input (switchMap)', () => {
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const input$ = hot('a----b|', { a: 'query1', b: 'query2' });
      // api call takes 5 frames
      const apiResult1$ = cold('-----r|', { r: [{ id: 1 }] }); // query1 result
      const apiResult2$ = cold('-----r|', { r: [{ id: 2 }] }); // query2 result

      const result$ = service.searchWithApi(input$, (query) =>
        query === 'query1' ? apiResult1$ : apiResult2$
      );

      // query1 cancelled after b, only query2 result appears
      expectObservable(result$).toBe('----------r|', { r: [{ id: 2 }] });
    });
  });
});
```

```typescript
// notification.service.spec.ts — toSignal bridge testing
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { NotificationService } from './notification.service';

describe('NotificationService (toSignal bridge)', () => {
  let service: NotificationService;
  let notificationSubject: Subject<Notification>;

  beforeEach(() => {
    notificationSubject = new Subject<Notification>();

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        // Inject controlled subject as notification source
        { provide: NOTIFICATION_SOURCE, useValue: notificationSubject.asObservable() },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  it('should reflect latest notification in signal', () => {
    expect(service.latestNotification()).toBeNull(); // initial value

    const notif: Notification = { id: '1', message: 'Test', type: 'info' };
    notificationSubject.next(notif);

    expect(service.latestNotification()).toEqual(notif);
  });

  it('should count unread through computed signal', () => {
    expect(service.unreadCount()).toBe(0);

    notificationSubject.next({ id: '1', message: 'A', type: 'info', read: false });
    notificationSubject.next({ id: '2', message: 'B', type: 'warn', read: false });

    expect(service.unreadCount()).toBe(2);
  });
});
```

### Anti-Example

```typescript
// ❌ WRONG: Reading signal в effect without flushEffects
it('should trigger effect', () => {
  const logSpy = spyOn(console, 'log');

  service.count.set(5);
  // Effect is scheduled but NOT yet executed
  expect(logSpy).toHaveBeenCalled(); // FAILS — effect hasn't run yet
});

// ✅ CORRECT: flushEffects before assertion
it('should trigger effect', () => {
  const logSpy = spyOn(console, 'log');

  service.count.set(5);
  TestBed.flushEffects(); // synchronously run all pending effects
  expect(logSpy).toHaveBeenCalledWith('Count:', 5);
});

// ❌ WRONG: toSignal outside injection context
it('should convert observable', () => {
  const subject = new Subject<string>();
  const sig = toSignal(subject.asObservable()); // ERROR: NG0203
});

// ✅ CORRECT: runInInjectionContext
it('should convert observable', () => {
  TestBed.configureTestingModule({});
  const subject = new Subject<string>();
  let sig!: Signal<string | undefined>;

  TestBed.runInInjectionContext(() => {
    sig = toSignal(subject.asObservable());
  });

  subject.next('hello');
  expect(sig()).toBe('hello');
});
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Testing effects without `TestBed.flushEffects()` | Effect scheduled but not run — false assertions | `signal.set(value); TestBed.flushEffects(); expect(...)` |
| `toSignal()` поза injection context в тестах | NG0203 runtime error | `TestBed.runInInjectionContext(() => toSignal(...))` |
| Testing RxJS timing без TestScheduler | Timing-based tests flaky in CI (real timers) | TestScheduler marble testing для debounce/delay operators |
| `.toPromise()` для Observable в тестах | Deprecated in RxJS 7, returns undefined for empty | `firstValueFrom()` або `lastValueFrom()` |
| Testing computed signal internals замість values | Implementation testing — fragile при refactor | Тестувати computed() через inputs and output value |

## Interview Block

### [L1 — Warm-up] Як тестувати Angular signal — перевіряти його значення?
**Signal being tested:** Знання що signal — callable function і як читати/писати value в тестах
**What the interviewer expects:** signal() = read, set()/update() = write, injection context для creation, TestBed.inject для services з signals
**How to probe deeper:** "Що потрібно для тестування effect що виконує side effect при зміні signal?"
**Reference answer:** Signal читається через виклик як функції: `service.count()`. Для writable: `signal.set(value)` або `signal.update(fn)`. В TestBed: `TestBed.inject(MyService)` → `service.signal()`. Читання signal синхронне — немає async, немає subscribe.
**Common mistakes:** Намагаються subscribe на signal; не знають що effects потребують flushEffects()

### [L2 — Mid] Навіщо потрібен TestBed.flushEffects() і як тестувати effect()?
**Signal being tested:** Розуміння асинхронного scheduling model effects і як синхронізувати в тестах
**What the interviewer expects:** effect() async scheduling, flushEffects() для sync execution, injection context requirement
**How to probe deeper:** "Що відбувається якщо не викликати flushEffects() і відразу перевіряти side effect?"
**Reference answer:** effect() виконується асинхронно після microtask queue — не синхронно при set(). TestBed.flushEffects() (Angular 18+) синхронно виконує всі pending effects. Порядок: signal.set(value) → TestBed.flushEffects() → assert side effect. Effect потребує injection context — в TestBed context це автоматично.
**Common mistakes:** Перевіряють side effect до flushEffects(); не знають що effects async

### [L3 — Senior] Як тестувати toSignal() bridge і які є edge cases?
**Signal being tested:** Розуміння injection context requirement і initial state behavior
**What the interviewer expects:** runInInjectionContext або TestBed.inject context, Subject controlled input, initial undefined state testing
**How to probe deeper:** "Що повертає signal від toSignal() до першого emit Observable?"
**Reference answer:** toSignal() потребує injection context — в TestBed context автоматично при inject, або TestBed.runInInjectionContext() manually. Initial state: без initialValue — повертає undefined до першого emit. Testing: Subject → next(value) → signal() читає нове значення. Test initial undefined state окремо — component може render з undefined.
**Common mistakes:** toSignal() поза injection context (NG0203); не тестують initial undefined state

### [L4 — Staff/Principal] Як побудувати testing стратегію для сервісу що поєднує Signals і RxJS?
**Signal being tested:** Architectural thinking про reactive testing layers і tool selection
**What the interviewer expects:** Separation: pure RxJS (TestScheduler/firstValueFrom) + signal state (direct reads) + bridge testing (Subject + injection context), property-based testing для invariants
**How to probe deeper:** "Коли marble testing краще ніж fakeAsync + tick для RxJS?"
**Reference answer:** Шари: 1) Pure RxJS operators — TestScheduler marble для timing-critical, firstValueFrom для simple, 2) Signal state — direct reads після mutations, 3) Bridges — runInInjectionContext + controlled Subject. Property-based testing для signal invariants (fast-check). Marble тест коли: timing guarantees critical (debounce, throttle), race conditions, complex merge/switch patterns.
**Common mistakes:** Один підхід для всього (тільки fakeAsync або тільки marble); не тестують initial states

## Summary

### Key Points
- Signals — callable functions: `signal()` читає value синхронно — no subscribe needed
- `effect()` виконується асинхронно; `TestBed.flushEffects()` (v18+) для sync testing
- `toSignal()` і `toObservable()` потребують injection context — `TestBed.inject()` або `runInInjectionContext()`
- Marble testing (`TestScheduler`) — для timing-based operators (debounce, delay, throttle)
- `firstValueFrom()` + `async/await` — найчитабельніший для simple Observable assertions
- Тестувати initial undefined state `toSignal()` — компонент renders до першого Observable emit
- Computed signals — lazy: тестувати через dependency mutations і read final value

### Elevator Pitch (2 minutes)
"Тестування Signals і RxJS — різні підходи для різних primitives. Signals — synchronous: signal() читає поточне значення напряму, set()/update() — записує. Computed — lazy, перераховується при залежності. Effects — асинхронні: TestBed.flushEffects() (Angular 18+) синхронно виконує pending effects в тестах. toSignal() потребує injection context — або TestBed.inject() context, або runInInjectionContext(). toSignal initial state: undefined до першого Observable emit — тестувати окремо. RxJS: firstValueFrom() + async/await для simple cases. Marble testing через TestScheduler — для timing-critical operators (debounceTime, switchMap cancellation) — описуємо sequential через ASCII: '-a-b|' = delay, emit a, emit b, complete. Загальна стратегія: ізолювати pure RxJS logic → TestScheduler, signal state → direct reads, bridges → controlled Subject + injection context."
