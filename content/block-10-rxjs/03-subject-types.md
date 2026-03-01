---
title: "Subject Types: Subject, BehaviorSubject, ReplaySubject, AsyncSubject"
block: 10
topic: 3
slug: "subject-types"
difficulty: 3
sinceVersion: "6"
tags: ["Subject", "BehaviorSubject", "ReplaySubject", "AsyncSubject", "multicast", "state-management", "hot-observable"]
relatedTopics: ["reactive-patterns", "memory-leaks", "service-behaviorsubject"]
interviewQuestions:
  - level: "junior"
    question: "Чим Subject відрізняється від звичайного Observable?"
    referenceAnswers:
      junior: "Subject є одночасно Observable і Observer. Він може мати кілька subscribers і дозволяє програмно emit значення через next(). Звичайний Observable виконується для кожного subscriber окремо."
      mid: "Subject — це multicast Observable: всі subscribers отримують одні й ті самі значення в той самий час (hot Observable). Звичайний cold Observable створює нову execution для кожного subscriber. Subject реалізує два інтерфейси: Observable (можна subscribe) і Observer (є next(), error(), complete()). Це дозволяє використовувати Subject як міст між imperative та reactive кодом."
      senior: "Subject — це multicast Observable і Observer водночас. Під капотом Subject тримає масив observers і при виклику next(value) ітерує по масиву і передає значення кожному observer синхронно (якщо немає async operators). Cold Observable — кожен subscribe запускає producer function заново. Hot Observable (Subject) — один producer, кілька consumers. Ключова відмінність: late subscriber (підписався після emit) нічого не отримає від Subject. Це принципово для state management де потрібно поточне значення — тоді BehaviorSubject. Subject є основою для EventEmitter в Angular (extends Subject), shareReplay, multicast, share operators."
      staff: "Subject — фундаментальна абстракція для multicasting в RxJS. Архітектурно: Subject вирішує проблему 'multiple consumers of single producer' без дублювання execution. В Angular internals: EventEmitter extends Subject (хоча Angular рекомендує не залежати від цього). RouterEvents — Subject що broadcast router state changes. Zone.js патчі emit до Subject-like механізму. Для state management: BehaviorSubject — де-факто стандарт для local component state або service state. Signal implementation у Angular v16+ — по суті BehaviorSubject semantics але synchronous і без Observable overhead. При design нової feature: Subject для events/commands, BehaviorSubject для state, ReplaySubject для event replay. Важлива архітектурна деталь: exposed Subject у public API service — anti-pattern (encapsulation violation). Expose тільки asObservable() або computed signal."
    commonMistakes:
      - "Плутають hot і cold Observable — думають Subject і звичайний Observable однакові"
      - "Expose Subject напряму з сервісу замість asObservable()"
    relatedQuestions: ["b10t3q2", "b10t3q3"]
  - level: "mid"
    question: "Коли використовувати BehaviorSubject vs ReplaySubject vs AsyncSubject? Наведіть практичні приклади."
    referenceAnswers:
      junior: "BehaviorSubject зберігає останнє значення і повертає його новим підписникам. ReplaySubject зберігає N значень. AsyncSubject повертає тільки останнє значення після complete."
      mid: "BehaviorSubject — для state: зберігає current value, новий subscriber отримує його негайно. Ідеально для user state, cart, settings. Потребує initial value. ReplaySubject(N) — для event replay: buffer останніх N значень. Корисно для logs, undo history, reconnection replay (WebSocket). ReplaySubject(1) схожий на BehaviorSubject але без initial value requirement. AsyncSubject — дуже специфічний: emit тільки остання значення і тільки після complete(). Підходить для one-time async operation результату — схоже на Promise."
      senior: "BehaviorSubject: getValue() для synchronous access, але це anti-pattern в reactive code — краще .pipe(take(1)). value getter — snapshot state. При subscribe — синхронно emit current value (synchronous initialization). ReplaySubject(N, windowTime): другий параметр — max age у мс, значення старше windowTime не буферизуються. ReplaySubject(Infinity) — replay all — використовується обережно (unbounded memory). ReplaySubject(1) vs BehaviorSubject: головна різниця — BehaviorSubject вимагає initial value (may be null/undefined as placeholder), ReplaySubject(1) нічого не emit до першого next(). Для late subscriber scenarios де initial state не відомий — ReplaySubject(1) кращий. AsyncSubject: рідко використовується напряму, але share() оператор з refCount internally використовує async-like semantics для completion."
      staff: "Вибір Subject типу — це architectural decision: 1) BehaviorSubject — коли є 'current state' концепція. Але у Angular 17+: signal() семантично еквівалентний і кращий для local state. 2) ReplaySubject — для audit trail, event sourcing patterns, WebSocket reconnection з replay missed events. ReplaySubject(100, 60000) — останні 100 подій або за останню хвилину — useful для activity logs. 3) AsyncSubject — для cache-once patterns: `const result$ = new AsyncSubject(); http.get(...).subscribe(result$);` — result$ буде emit після завершення HTTP і всі future subscribers отримають кешоване значення. Це pattern що лежить в основі shareReplay. 4) Subject для events/commands: void Subject чи з typed payload. 5) Expose policy: service НІКОЛИ не expose raw Subject — тільки `readonly someState$ = this.stateSubject.asObservable()` або computed signal."
    commonMistakes:
      - "getValue() на BehaviorSubject у reactive context (замість pipe/subscribe)"
      - "ReplaySubject без windowTime для real-time streams — unbounded memory growth"
      - "AsyncSubject плутають з Promise — якщо complete() не викликано, жоден subscriber нічого не отримає"
    relatedQuestions: ["b10t3q1", "b10t3q3"]
  - level: "senior"
    question: "Як Subject поводиться при помилках та після complete()? Що таке 'closed Subject'?"
    referenceAnswers:
      junior: "Після error() або complete() Subject більше не приймає значення і нові subscribers отримають помилку або complete негайно."
      mid: "Subject має стан: active, errored, completed. Після error() — Subject переходить у errored state, існуючі subscribers отримують error, нові subscribers негайно отримують ту саму error. Після complete() — Subject переходить у completed state, існуючі отримують complete notification, нові subscriber негайно отримують complete без значень. next() після complete/error — silently ignored (no-op). isStopped property на Subject стає true."
      senior: "Subject internals: `isStopped`, `hasError`, `thrownError`, `closed` flags. `closed` — Subject's Subscription закрита (рідко для raw Subject, але для operators). `isStopped` — після complete або error. При error: `hasError = true`, `thrownError = error`, всі current observers отримують error і видаляються з observers array. Нові subscribers отримують `subscriber.error(thrownError)` одразу при subscribe. Це поведінка що відрізняє Subject від звичайного Observable — Subject 'пам'ятає' свій errored state. BehaviorSubject: після complete() — `getValue()` все ще повертає last value, але нові subscribers отримують complete без значення. Важливо: якщо використовується як state container і хочете 're-open' Subject — неможливо. Потрібен новий Subject instance. Це ще одна перевага сигналів — вони не можуть бути 'completed'."
      staff: "Closed/errored Subject — важлива деталь для resilient services: 1) BehaviorSubject як state store у service — якщо він випадково errored або completed — весь state management зламаний. Захист: try-catch навколо next() або utility wrapper. 2) Error у BehaviorSubject propagate до всіх current subscribers — може зламати весь UI одночасно. Краще: emit typed error state (`state: 'error' | 'success' | 'loading'`) замість кидання помилки у Subject. 3) Re-initialization pattern: при помилці можна замінити BehaviorSubject instance — але це означає що всі старі subscribers отримають complete і потребують resubscribe — складна логіка. 4) Сигнали вирішують: немає concept of 'completed signal'. 5) Production pattern для services: subjects тільки для events (не state), state через BehaviorSubject або signals, глобальний ErrorHandler для unexpected Subject errors. 6) NgRx Store — по суті BehaviorSubject з immutable state і typed dispatching — вирішує pitfalls raw Subject usage."
    commonMistakes:
      - "Намагаються next() після complete — silently ignored, не error"
      - "Не знають що нові subscribers отримують помилку негайно якщо Subject вже errored"
      - "Не розуміють різницю між closed і isStopped"
    relatedQuestions: ["b10t3q2", "b10t3q4"]
  - level: "mid"
    question: "Чому не варто expose Subject напряму з сервісу і як правильно приховати його?"
    referenceAnswers:
      junior: "Якщо expose Subject напряму, то будь-хто може викликати next() і змінити стан. Краще expose тільки Observable через asObservable()."
      mid: "Subject expose напряму порушує encapsulation: будь-який клієнт може next(), error(), complete() — некерована зміна state. Правильно: `private stateSubject = new BehaviorSubject(initial); readonly state$ = this.stateSubject.asObservable();` — клієнти тільки читають. Тільки сервіс контролює коли і як emit нові значення."
      senior: "asObservable() повертає Observable wrapper що не expose next()/error()/complete() API. Але є нюанси: якщо клієнт cast до Subject — він може викликати next(). TypeScript type system не є runtime guard. Тому design contract важливий. Крім encapsulation: expose asObservable() дозволяє пізніше замінити Subject на інший source (computed signal, HTTP polling) без зміни public API. Pattern для сервісів: приватний Subject для imperative updates, публічний Observable або Signal. З Angular 17+ сигнали: `private _count = signal(0); readonly count = this._count.asReadonly()` — аналогічний pattern. Для Angular сервісів рекомендація: уникати expose BehaviorSubject, якщо стан потрібен — expose computed signal через toSignal або Signal."
      staff: "Encapsulation у сервісах — це архітектурна межа: 1) Subject exposed публічно — порушення Command-Query Separation (CQS). Клієнт може і читати і писати через один об'єкт. 2) В NgRx-like patterns: actions (commands) через dispatch, state (query) через select — explicit separation. 3) CQRS для services: окремі методи для mutations, окремий stream для reads. 4) Type-level enforcement: `readonly` keyword на Subject field + `asObservable()` return type. 5) Testing: exposed Subject дозволяє test-spies легко emit values — ось чому іноді expose у tests. Правильно: TestBed provider override з factory що returns controlled Subject. 6) Team education: code review checklist — Subject у service public API = automatic review comment. 7) Migration до сигналів: замінює Subject+asObservable() на signal()+readonly() — простіша і безпечніша модель."
    commonMistakes:
      - "Expose BehaviorSubject публічно з сервісу — будь-хто може змінити state"
      - "Думають asObservable() — runtime guard (TypeScript only)"
      - "Забувають що asObservable() Observable не має getValue() — потрібен окремий метод для sync access"
    relatedQuestions: ["b10t3q3", "b10t3q1"]
  - level: "staff"
    question: "Як реалізувати reactive state management у Angular сервісі використовуючи Subject/BehaviorSubject? Яка різниця між цим підходом і NgRx?"
    referenceAnswers:
      junior: "Можна зберігати state у BehaviorSubject у сервісі і emit нові значення коли state змінюється. NgRx — це більша бібліотека з більшими можливостями."
      mid: "Service-with-BehaviorSubject: private state BehaviorSubject, public методи для mutations, public Observable для reads. NgRx — централізований store з actions, reducers, selectors, effects. BehaviorSubject підхід простіший для невеликих features, NgRx — для великих apps з complex state interactions, time-travel debugging, і strict unidirectional data flow."
      senior: "Service BehaviorSubject pattern: CRUD state через typed mutations, computed state через combineLatest/map, error state explicit у state object. Переваги: zero dependencies, fine-grained components, easy testing. Проблеми: при зростанні — multiple services з cross-dependencies важко синхронізувати, немає devtools, немає time-travel. NgRx: normalized global store, actions як events (audit trail), pure reducers (testable), selectors з memoization, effects для side effects. Overhead: boilerplate, learning curve. NgRx Signal Store (v17+) — hybrid: signal-based, less boilerplate, same principles. Вибір: feature < 3 компонентів і isolated — service. Feature > 3 компонентів, cross-feature state, complex async — NgRx."
      staff: "Architectural continuum для state management: 1) Local component state: signal() або useState-like BehaviorSubject у компоненті. 2) Shared feature state: Service + BehaviorSubject або NgRx ComponentStore/SignalStore — scoped до feature route. 3) Global app state: NgRx Store — normalized entities, selectors, effects. 4) Server state (cache): httpResource() у Angular 19+, або NgRx Data, або TanStack Query pattern. Вибір впливає на: bundle size (NgRx ~100KB), boilerplate, testability, devtools. BehaviorSubject service scaling problem: при 5+ interconnected states потрібно scan all services для debug — NgRx Devtools вирішує це. Migration path: start simple (signals/BehaviorSubject), extract to ComponentStore при complexity growth, migrate to global Store якщо cross-feature. Команда з >3 developers — NgRx enforces conventions, BehaviorSubject services — кожен пише по-своєму."
    commonMistakes:
      - "Починають з NgRx для простих features — over-engineering"
      - "Не знають NgRx SignalStore як middle-ground між сервісом і full NgRx"
      - "Думають що service BehaviorSubject не масштабується — масштабується, але складніше debug"
    relatedQuestions: ["b10t3q2", "b10t4q1"]
---

## Core Concept

**English definition:** Subject is a special RxJS class that acts as both Observable (subscribable) and Observer (has next/error/complete methods), enabling multicasting — multiple subscribers receive the same values from a single execution. BehaviorSubject, ReplaySubject, and AsyncSubject are specialized variants with different value caching behaviors.

**Пояснення:** Звичайний (cold) Observable виконує свій producer функцію для кожного subscriber окремо — якщо два компоненти підписуються на `http.get('/api/data')`, буде два HTTP запити. Subject — hot: один producer, всі subscribers отримують ті самі значення. Subject є міст між imperative кодом (викликаємо next()) і reactive кодом (підписуємось через Observable interface).

**Яку проблему вирішує:**
- **Multicasting:** Кілька subscribers отримують одне значення без дублювання execution
- **Imperative → Reactive bridge:** Дозволяє "ввести" значення у реактивний потік ззовні
- **State container:** BehaviorSubject зберігає current state, нові subscribers отримують його одразу
- **Event bus:** Subject без caching для events де важливий лише момент emit

**Як працює під капотом:**

```
Subject internals:
  observers: Observer[] = []        // всі активні підписники
  isStopped: boolean = false        // після complete() або error()
  hasError: boolean = false
  thrownError: any = null

next(value):
  if isStopped → no-op
  for each observer in observers → observer.next(value)   // синхронно!

error(err):
  isStopped = true, hasError = true, thrownError = err
  for each observer → observer.error(err)
  observers = []  // очищаємо

complete():
  isStopped = true
  for each observer → observer.complete()
  observers = []

subscribe(observer):
  if isStopped && hasError → observer.error(thrownError) immediately
  if isStopped → observer.complete() immediately
  else → add to observers[]
```

**BehaviorSubject** додає: `_value` поле і при subscribe — негайно `observer.next(this._value)`.
**ReplaySubject** додає: `_buffer: any[]` і при subscribe — replay всіх buffered values.
**AsyncSubject** додає: emit лише останнє значення при complete.

**Trade-offs та обмеження:**
- Subject не можна "перезапустити" після error/complete — потрібен новий instance
- BehaviorSubject вимагає initial value — може бути `null` як placeholder, але потрібна обробка
- ReplaySubject без `windowTime` — unbounded memory growth для high-frequency streams
- Subject exposed публічно — порушення encapsulation (будь-хто може next())

**Версійність:**
- RxJS 5: Subject, BehaviorSubject, ReplaySubject, AsyncSubject наявні з початку
- RxJS 6: без змін у API
- RxJS 7: покращена TypeScript типізація, строгіші типи
- Angular v16+: Signals як альтернатива BehaviorSubject для state management
- Angular v17+: NgRx SignalStore як middle-ground

## Deep Details

### Edge Cases

- **BehaviorSubject.getValue():** Синхронний доступ до current value — але anti-pattern у reactive код. Якщо використовується у template через interpolation без async pipe — не буде оновлюватись. Краще: `subject.pipe(take(1))` або `toSignal()`.
- **ReplaySubject з windowTime:** `new ReplaySubject(N, 1000)` — зберігає максимум N значень, але не старших за 1 секунду. При subscribe replay фільтрує застарілі. Перевірка: потенційний edge case коли всі buffered значення expired — subscriber отримає 0 значень, хоча буфер не порожній.
- **Subject і synchronous emission:** next() на Subject синхронний — якщо у subscribe callback викликати next() на той самий Subject — рекурсія. RxJS захищає від цього через re-entrant guard у деяких operators.
- **Subject після complete новим subscriber:** `const s = new Subject(); s.complete(); s.subscribe(v => ...)` — subscribe callback НІКОЛИ не викличеться, complete notification одразу. Це відрізняється від ReplaySubject(1) де subscriber отримав би buffered value then complete.
- **Multicast timing:** Subject emit синхронно до всіх subscribers — якщо subscribe callback один кидає exception — наступні subscribers не отримають значення (bug в RxJS до v7, виправлений trySubscribe).

### Junior vs Senior Understanding

**Junior** знає: "BehaviorSubject зберігає значення, Subject — ні. Треба asObservable()."

**Senior** розуміє глибину:

1. **Hot vs Cold Observable:** Subject — hot Observable. Але `shareReplay(1)` перетворює cold Observable у behavior-subject-like hot Observable. Різниця: shareReplay(1) завершиться коли source завершиться, BehaviorSubject — ніколи (поки явно не complete).

2. **Synchronous delivery:** Subject.next() є синхронним — emit відбувається до повернення з next(). `observeOn(asyncScheduler)` або `delay(0)` можуть зробити async.

3. **ReplaySubject(1) vs BehaviorSubject:** При відсутності initial value — ReplaySubject(1). Але: BehaviorSubject має `getValue()` synchronous access, ReplaySubject — ні. Для state — BehaviorSubject, для event replay без initial — ReplaySubject(1).

4. **Subject і Angular Signals:** `toObservable(signal)` використовує ReplaySubject(1)-like semantics під капотом (через ReplaySubject або effect). `toSignal(obs$)` конвертує назад з auto-unsubscribe.

### Deprecation & Migration Path

- **multicast() + Subject:** Клас-based multicasting через `multicast(subject).refCount()` — deprecated у RxJS 7. Замінено на `share()` і `shareReplay()`.
- **publish(), publishBehavior(), publishReplay():** Deprecated у RxJS 7.
  - `publish()` → `share()`
  - `publishBehavior(x)` → `share({ connector: () => new BehaviorSubject(x) })`
  - `publishReplay(N)` → `shareReplay(N)`
- **refCount():** Deprecated, використовувати `share({ refCount: true })`.

### Connections to Other Concepts

- **Reactive Patterns (b10t4):** BehaviorSubject — основа для service-based state management patterns.
- **State Management (b12t1):** Service + BehaviorSubject = lightweight store pattern.
- **NgRx (b12t2):** NgRx Store внутрішньо використовує BehaviorSubject-like mechanism з immutable state.
- **Signals (b11t1):** signal() — еволюція BehaviorSubject semantics з synchronous, glitch-free updates.
- **Memory Leaks (b10t2):** Subject у service тримає subscribers — критично для cleanup.

## Examples

### Basic Usage

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject, AsyncSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

// ✅ BehaviorSubject для state
@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);

  // ✅ Expose only Observable — clients cannot next()
  readonly cartItems$ = this.cartItems.asObservable();

  // ✅ Computed state
  readonly totalCount$ = this.cartItems$.pipe(
    map(items => items.reduce((sum, item) => sum + item.qty, 0)),
    distinctUntilChanged(),
  );

  addItem(item: CartItem): void {
    const current = this.cartItems.getValue(); // sync access OK у service method
    this.cartItems.next([...current, item]);
  }
}

// ✅ ReplaySubject для event history
@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  // Buffer 50 events, max 5 minutes old
  private events = new ReplaySubject<ActivityEvent>(50, 5 * 60 * 1000);
  readonly events$ = this.events.asObservable();

  log(event: ActivityEvent): void {
    this.events.next(event);
  }
}

// ✅ Subject для one-time events/commands
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications = new Subject<Notification>();
  readonly notifications$ = this.notifications.asObservable();

  show(notification: Notification): void {
    this.notifications.next(notification);
  }
}
```

### Production Scenario

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private http = inject(HttpClient);

  // ✅ Typed state object — never error() the Subject
  private state = new BehaviorSubject<UserState>({
    user: null,
    loading: false,
    error: null,
  });

  // ✅ Derived selectors via pipe/map
  readonly user$ = this.state.pipe(map(s => s.user), distinctUntilChanged());
  readonly loading$ = this.state.pipe(map(s => s.loading));
  readonly error$ = this.state.pipe(map(s => s.error));
  readonly isLoggedIn$ = this.user$.pipe(map(u => u !== null));

  private patch(partial: Partial<UserState>): void {
    this.state.next({ ...this.state.getValue(), ...partial });
  }

  loadUser(id: string): void {
    this.patch({ loading: true, error: null });
    this.http.get<User>(`/api/users/${id}`).pipe(
      tap(user => this.patch({ user, loading: false })),
      catchError(err => {
        this.patch({ loading: false, error: err.message });
        return of(null);
      }),
    ).subscribe();
  }

  logout(): void {
    this.patch({ user: null });
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: Subject exposed publicly
@Injectable({ providedIn: 'root' })
export class BadService {
  // Anyone can call next(), error(), complete()!
  public currentUser$ = new BehaviorSubject<User | null>(null);
}

// Someone does:
badService.currentUser$.error(new Error('oops'));
// Now ALL subscribers get error, Subject is dead forever!

// ❌ WRONG: ReplaySubject без buffer limit для high-frequency stream
@Injectable({ providedIn: 'root' })
export class MetricsService {
  // Unbounded memory: stores ALL metrics ever emitted!
  private metrics = new ReplaySubject<Metric>();
  readonly metrics$ = this.metrics.asObservable();
}

// ❌ WRONG: getValue() in reactive pipeline
@Component({ selector: 'app-bad', template: '' })
export class BadComponent {
  private cartService = inject(CartService);

  addToCart(item: CartItem): void {
    // getValue() bypasses reactive chain — won't work with async operations
    const items = this.cartService.cartItems.getValue(); // also: accessing private!
    this.cartService.cartItems.next([...items, item]);
  }
}

// ✅ CORRECT: Encapsulated, typed state, no exposed Subject
@Injectable({ providedIn: 'root' })
export class GoodService {
  private stateSubject = new BehaviorSubject<AppState>(initialState);

  readonly state$ = this.stateSubject.asObservable(); // readonly Observable
  readonly count$ = this.state$.pipe(map(s => s.count));

  increment(): void {
    const current = this.stateSubject.getValue();
    this.stateSubject.next({ ...current, count: current.count + 1 });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Public Subject у сервісі | Порушення encapsulation — будь-хто може next()/error()/complete() | Private Subject + `asObservable()` або Signal |
| ReplaySubject без buffer limit | Unbounded memory growth для довгоживучих streams | `new ReplaySubject(N)` або `new ReplaySubject(N, windowTimeMs)` |
| error() на BehaviorSubject state | Subject стає dead, всі subscribers отримують помилку | Emit typed error state: `{ error: string \| null }` |
| getValue() у reactive pipeline | Bypass reactive chain, не реагує на майбутні changes | `subject.pipe(take(1))` або signal |
| `new Subject<void>()` як destroy notification | Потрібен ngOnDestroy, prone to forgetting complete() | `takeUntilDestroyed()` з DestroyRef |

## Interview Block

### [L1 — Warm-up] Чим Subject відрізняється від звичайного Observable?
**Signal being tested:** Чи розуміє кандидат різницю hot vs cold Observable і dual nature Subject
**What the interviewer expects:** Hot vs cold пояснення, multicasting, ObserverInterface реалізація (next/error/complete), приклад use case
**How to probe deeper:** "Якщо два компоненти підпишуться на Subject і ще до того Subject emit значення, що вони отримають?"
**Reference answer:** Subject — одночасно Observable (можна subscribe) і Observer (є next/error/complete). Cold Observable виконує producer окремо для кожного subscriber. Subject — hot: один producer, всі subscribers отримують одні значення одночасно. Пізній subscriber не отримає пропущені значення (для цього BehaviorSubject або ReplaySubject). Use case: event bus, user actions, state container.
**Common mistakes:** Думають Subject і Observable однакові; не знають про hot/cold; плутають Subject і Promise

### [L2 — Mid] Коли BehaviorSubject vs ReplaySubject vs AsyncSubject?
**Signal being tested:** Чи може кандидат обрати правильний Subject для конкретного use case і пояснити trade-offs
**What the interviewer expects:** Конкретні приклади для кожного типу, розуміння buffer/caching semantics, initial value requirement BehaviorSubject
**How to probe deeper:** "Коли ви обрали б ReplaySubject(1) замість BehaviorSubject, якщо обидва зберігають 1 значення?"
**Reference answer:** BehaviorSubject — current state з initial value (user profile, cart, settings). Новий subscriber отримує current value одразу, є getValue(). ReplaySubject(N) — event history, undo buffer, WebSocket reconnection replay. ReplaySubject(1) — коли initial value не відомий (відрізняється від BehaviorSubject). AsyncSubject — результат one-time операції після complete(), рідко використовується напряму. ReplaySubject(1) vs BehaviorSubject: BehaviorSubject потребує initial value і має getValue() synchronous access.
**Common mistakes:** Думають ReplaySubject і BehaviorSubject ідентичні при N=1; ReplaySubject без buffer limit; getValue() у reactive code

### [L3 — Senior] Як Subject поводиться після error() та complete()? Що таке 'closed Subject'?
**Signal being tested:** Знання Subject state machine і практичних implications для resilient services
**What the interviewer expects:** isStopped, hasError flags, поведінка нових subscriber після error/complete, неможливість re-open, правильний pattern для state без error() на Subject
**How to probe deeper:** "Як ви спроєктуєте сервіс де BehaviorSubject ніколи не буде errored, навіть при HTTP помилках?"
**Reference answer:** Після error(): Subject переходить у errored state (isStopped=true, hasError=true). Всі current subscribers отримують error і видаляються. Нові subscribers негайно отримують ту саму error. next() після error — no-op. Subject не можна "перезапустити" — потрібен новий instance. Правильний pattern: ніколи не emit error() на state Subject — замість цього emit typed state об'єкт з error полем: `{ data: null, error: 'Not found', loading: false }`.
**Common mistakes:** Думають next() після error кидає exception (no-op); не знають що нові subscribers отримують error одразу; намагаються re-open closed Subject

### [L4 — Staff/Principal] Як реалізувати reactive state у Angular сервісі і яка різниця з NgRx?
**Signal being tested:** Архітектурне мислення — вибір рішення по складності, scalability, team conventions
**What the interviewer expects:** Порівняння service+BehaviorSubject, ComponentStore/SignalStore, NgRx global store. Коли кожен підхід. Signals як альтернатива для local state.
**How to probe deeper:** "Ваш сервіс з BehaviorSubject виріс і тепер 5 компонентів і 3 сервіси взаємодіють. Що ви зробите?"
**Reference answer:** Continuum: local component signal → service+BehaviorSubject → NgRx ComponentStore/SignalStore → NgRx global. BehaviorSubject service: добре для isolated feature, проблема при cross-feature dependencies. NgRx: normalized global store, devtools, strict conventions, overhead. SignalStore (NgRx v17+) — hybrid: signal-based, less boilerplate. Migration trigger: >3 interconnected services або cross-feature state = ComponentStore/SignalStore. Global state з audit trail і devtools = NgRx Store. Сигнали замінюють BehaviorSubject для local і feature state у Angular 17+.
**Common mistakes:** NgRx для простих features (over-engineering); не знають NgRx SignalStore; думають сервіс+BehaviorSubject не масштабується

## Summary

### Key Points
- Subject — hot multicast Observable + Observer: один producer, кілька subscribers, imperative next()
- BehaviorSubject — current state container з initial value, getValue(), новий subscriber отримує current value
- ReplaySubject(N, windowTime) — buffer N останніх значень; ReplaySubject(1) ≈ BehaviorSubject без initial value requirement
- AsyncSubject — emit тільки останнє значення після complete(), рідко використовується напряму
- Після error()/complete() Subject dead — не можна re-open; ніколи error() state Subject
- Завжди asObservable() для public API — encapsulation, future-proof
- Angular 17+: Signal як еволюція BehaviorSubject для state — без subscription lifecycle, glitch-free

### Elevator Pitch (2 minutes)
"Subject у RxJS — це hot multicast Observable що дозволяє програмно emit значення через next(). Є 4 типи: Subject (без кешу), BehaviorSubject (поточне значення), ReplaySubject (N останніх), AsyncSubject (останнє після complete). BehaviorSubject — стандарт для state у сервісах, але правило: завжди expose тільки asObservable() назовні, бо Subject exposed publicly — хтось може case error() і зламати весь state. В Angular 17+ signals замінюють BehaviorSubject для local і feature state — без subscription lifecycle, синхронне оновлення, glitch-free computation."
