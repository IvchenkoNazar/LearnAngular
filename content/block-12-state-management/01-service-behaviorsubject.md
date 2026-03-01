---
title: "Service with BehaviorSubject Pattern"
block: 12
topic: 1
slug: "service-behaviorsubject"
difficulty: 3
sinceVersion: "2"
tags: ["BehaviorSubject", "service-state", "state-management", "reactive-service", "store-pattern", "lightweight-store"]
relatedTopics: ["subject-types", "memory-leaks", "signals-intro", "ngrx"]
interviewQuestions:
  - level: "junior"
    question: "Як реалізувати shared state між компонентами у Angular без NgRx?"
    referenceAnswers:
      junior: "Можна використати сервіс з BehaviorSubject. BehaviorSubject зберігає поточне значення і всі компоненти підписуються на нього щоб отримувати оновлення."
      mid: "Service-with-BehaviorSubject pattern: Injectable сервіс з private BehaviorSubject для state і public Observable (через asObservable()) для читання. Публічні методи для mutations. Компоненти inject сервіс і підписуються на state. Переваги: zero dependencies, простий, добре для невеликих features."
      senior: "Service pattern деталі: 1) Private `BehaviorSubject<State>` — не expose напряму (encapsulation). 2) Public `readonly state$ = this.stateSubject.asObservable()`. 3) Derived selectors via `.pipe(map(), distinctUntilChanged())`. 4) Mutation methods: `setState(patch: Partial<State>)`. 5) Не expose raw BehaviorSubject — хтось може error() або complete(). 6) Сигнали: у Angular 17+ замінити BehaviorSubject на signal() — простіше, без subscription. Pattern evolution: BehaviorSubject service → Signal service → NgRx SignalStore."
      staff: "Service state pattern at scale: 1) Single state object: `BehaviorSubject<{ loading, error, data }>` — атомарні оновлення через spread. 2) Multiple selectors: computed від state$ через pipe(map). 3) Command pattern: методи — це 'actions', вони знають як оновити state. 4) Immutability: spread operator для shallow clone, Immer для deep. 5) Testing: inject у TestBed, call methods, subscribe to check state. 6) Scale limit: при 5+ взаємодіючих сервісах — cross-state dependencies стають складними. 7) Migration trigger: debugging becomes hard → introduce SignalStore або NgRx. 8) Angular 17+: signal() замість BehaviorSubject де можливо — менший overhead, auto-tracked."
    commonMistakes:
      - "Expose BehaviorSubject publicly — будь-хто може error() і зламати state"
      - "Не використовують distinctUntilChanged для selectors — зайві re-renders"
      - "Множинні BehaviorSubjects замість одного state object — важко синхронізувати"
    relatedQuestions: ["b12t1q2", "b12t1q3"]
  - level: "mid"
    question: "Як організувати immutable state updates у service-based store?"
    referenceAnswers:
      junior: "Створити новий об'єкт замість мутації існуючого: spread operator або Object.assign."
      mid: "Immutable updates: `this.state.next({ ...this.state.getValue(), loading: true })`. Для arrays: `[...currentArray, newItem]` або `currentArray.filter(i => i.id !== id)`. Immer.js для складних nested objects: `this.state.next(produce(this.state.getValue(), draft => { draft.items.push(newItem); }))`. Immutability критична для: ChangeDetection (reference check), predictable state, easier debugging."
      senior: "Immutability patterns: 1) Shallow: `{ ...state, field: value }` — для flat state. 2) Nested: `{ ...state, nested: { ...state.nested, field: value } }` — verbose для deep. 3) Immer.produce: curried updater — `produce(state, draft => { draft.deeply.nested.field = value; })`. 4) Structural sharing: Immer повторно використовує незмінені частини — memory efficient. 5) Typed patch function: `patch<S>(state: S, partial: DeepPartial<S>): S` utility. 6) Angular OnPush: immutable updates гарантують reference change → CD спрацює. 7) Bug prevention: мутація state без .next() — зміна невидима для subscribers."
      staff: "Immutability at enterprise scale: 1) Immer.js — де-факто стандарт для complex nested state mutations. 2) Type-safe Immer: `Draft<State>` type у produce callback. 3) Performance: structural sharing у Immer — O(log n) memory замість O(n) deep clone. 4) Immutability enforcement: Object.freeze у dev mode для catching accidental mutations. 5) Redux Toolkit approach: Immer вбудований у NgRx toolkit. 6) Testing: можна snapshot compare state before/after action. 7) Time-travel debugging: кожен state snapshot — immutable — можна зберегти і відновити. 8) Функціональні updaters: `type Updater<T> = (state: T) => T` — reusable state transformations."
    commonMistakes:
      - "Мутують state напряму без .next() — зміна невидима"
      - "Deep clone через JSON.parse(JSON.stringify()) — втрата Date, undefined, functions"
      - "Не знають Immer.js для складних nested updates"
    relatedQuestions: ["b12t1q1", "b12t1q3"]
  - level: "senior"
    question: "Як написати typed, safe service store з Error і Loading state?"
    referenceAnswers:
      junior: "Додати loading і error поля у state об'єкт і оновлювати їх при HTTP запитах."
      mid: "Typed state: `interface State<T> { data: T | null; loading: boolean; error: string | null; }`. BehaviorSubject<State<T>>. Методи: setLoading(), setError(err), setData(data). Computed selectors: loading$, error$, data$. HttpClient call: setLoading(true) → HTTP → setData(result) або setError(err) у catchError."
      senior: "Production-ready typed store: 1) State as discriminated union: `type AsyncState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'error'; error: string } | { status: 'success'; data: T }`. 2) TypeScript narrowing: `if (state.status === 'success') state.data; // TypeScript knows data exists`. 3) `patchState(partial: Partial<S>)` utility для atomic updates. 4) Selectors via pipe(map, distinctUntilChanged) — emit only when specific field changes. 5) Error normalization: HttpErrorResponse → string message. 6) Multiple concurrent operations: окремий loading state per operation. 7) Rollback: зберегти previous state для optimistic rollback."
      staff: "Enterprise typed store architecture: 1) Generic base store class: `class Store<S> { protected state: BehaviorSubject<S>; select<T>(selector: (s: S) => T): Observable<T> { return this.state.pipe(map(selector), distinctUntilChanged()); } dispatch(patch: (s: S) => S): void { this.state.next(patch(this.state.getValue())); } }`. 2) Extends for feature: `class ProductsStore extends Store<ProductsState>`. 3) Actions as functions: `const loadProducts = () => ({ type: 'load' as const })` — typed actions without NgRx boilerplate. 4) Reducer function: pure function `(state: S, action: Action) => S` — testable. 5) Effect pattern: store method → HTTP → dispatch. 6) Devtools: custom middleware (tap) для logging state changes. 7) Migration path: Store base class → extract to NgRx SignalStore у pkg sem."
    commonMistakes:
      - "State shape без discriminated union — data may be null при успіху, помилка невидима"
      - "Один loading boolean для кількох concurrent operations"
      - "Не використовують distinctUntilChanged для selectors — зайві re-renders"
    relatedQuestions: ["b12t1q2", "b12t1q4"]
  - level: "mid"
    question: "Коли service з BehaviorSubject достатній і коли потрібен NgRx?"
    referenceAnswers:
      junior: "Service достатній для маленьких features. NgRx потрібен для великих додатків з complex state."
      mid: "Service достатній: isolated feature (< 5 компонентів), simple CRUD, невелика команда. NgRx потрібен: cross-feature state interactions, complex async flows, audit trail (actions log), time-travel debugging, great DX for debugging. NgRx SignalStore — middle ground: feature-level, Signals, менше boilerplate."
      senior: "Decision criteria: 1) State scope: component-only → local state/signal. Feature-only → service. Cross-feature → NgRx. 2) Async complexity: simple CRUD → service. Multiple concurrent operations, optimistic updates, retry → NgRx SignalStore або NgRx. 3) Team size: < 5 → service (simpler). 5-15+ → NgRx (conventions, devtools). 4) Debugging needs: debugging through Devtools important → NgRx. 5) Existing codebase: NgRx already present → use it. 6) Performance: SignalStore + signals → efficient CD. 7) Bundle size: NgRx adds ~100KB. Service adds 0."
      staff: "Architectural continuum: 1) Local signal: `count = signal(0)` — component-only. 2) Local service: simple injectable з signals або BehaviorSubject. 3) Feature SignalStore: `signalStore(withState, withMethods)` — feature-scoped. 4) Global SignalStore: `{ providedIn: 'root' }` — app-wide. 5) NgRx Store: global, event-sourced, devtools, normalized entities. Decision triggers: move up when: debugging becomes painful, cross-feature interactions complex, team grows. Don't pre-optimize: start simple (service), refactor when needed. Cost of over-engineering > cost of under-engineering initially."
    commonMistakes:
      - "NgRx для кожного feature — over-engineering"
      - "Service для global cross-feature state — spaghetti dependencies"
      - "Не знають NgRx SignalStore як middle ground"
    relatedQuestions: ["b12t1q3", "b12t1q5"]
  - level: "staff"
    question: "Як мігрувати service з BehaviorSubject до Signal-based store поступово?"
    referenceAnswers:
      junior: "Замінити BehaviorSubject на signal() і видалити async pipe."
      mid: "Кроки: 1) Замінити BehaviorSubject<T> на signal<T>(). 2) Замінити asObservable() на asReadonly(). 3) Замінити derived Observable (pipe map) на computed(). 4) Замінити .next() на .set() або .update(). 5) Замінити | async pipe на () в template. 6) Видалити subscription management (takeUntilDestroyed)."
      senior: "Migration поступово: 1) Wrap BehaviorSubject: `toSignal(this.subject$)` — нові consumers отримують Signal, старі — Observable. 2) Поступово мігрувати consumers від async pipe до signal(). 3) Коли всі consumers мігровані — замінити BehaviorSubject на signal() у service. 4) Перевірити computed() правильно derived від signal. 5) Видалити toSignal wrapper. Feature flag для поступового rollout. Тести: після кожного кроку — run tests. Integration tests першими. Unit tests — найбільше змін."
      staff: "Enterprise migration strategy: 1) Codemod script: AST transform для автоматичної заміни BehaviorSubject → signal, asObservable → asReadonly, pipe(map) → computed, next() → set/update, async pipe → (). 2) Angular schematics: ng generate migration або custom schematic. 3) Parallel run: стара BehaviorSubject і нова signal версія у feature flag → порівняти поведінку. 4) Breaking change detection: якщо service є бібліотека — breaking change requires semver major. 5) Testing: refactor tests разом з code — component tests з setInput замість mock BehaviorSubject. 6) Team: pair programming для навчання signal mental model. 7) Metrics: compare bundle, CD performance before/after."
    commonMistakes:
      - "Big bang migration замість incremental"
      - "Не оновлюють тести після migration"
      - "Не перевіряють computed() зі складними dependencies"
    relatedQuestions: ["b12t1q4", "b12t1q3"]
---

## Core Concept

**English definition:** The Service with BehaviorSubject pattern is a lightweight state management approach where an Angular Injectable service holds a `BehaviorSubject` (or Signal in Angular 17+) as a private state container, exposes read-only derived Observables/Signals for consumers, and provides public methods for controlled state mutations.

**Пояснення:** Це найпростіша форма state management в Angular без зовнішніх залежностей. Сервіс — singleton (providedIn: 'root') — тримає state і share-ить його між компонентами. Subscribers отримують реактивні оновлення. Pattern добре масштабується до середнього розміру features, але при зростанні cross-dependencies — час мігрувати до SignalStore або NgRx.

**Яку проблему вирішує:**
- **Shared state:** Кілька компонентів читають і змінюють одні дані без prop drilling
- **Reactivity:** Компоненти автоматично оновлюються при зміні state
- **Encapsulation:** Private state з public API для mutations

**Як працює під капотом:**

```typescript
class StateService<T> {
  private subject: BehaviorSubject<T>;

  // BehaviorSubject internals:
  // - stores current value
  // - on subscribe → immediately emit current value
  // - on next(v) → update value, notify all observers

  constructor(initial: T) {
    this.subject = new BehaviorSubject<T>(initial);
  }

  // Public read-only Observable
  readonly state$: Observable<T> = this.subject.asObservable();

  // Derived selector — only emit when specific field changes
  select<R>(selector: (state: T) => R): Observable<R> {
    return this.state$.pipe(map(selector), distinctUntilChanged());
  }

  // Controlled mutation
  update(updater: (state: T) => T): void {
    this.subject.next(updater(this.subject.getValue()));
  }
}
```

**Trade-offs та обмеження:**
- Не масштабується для складних cross-feature state interactions
- Немає devtools для debugging state changes
- Subscription management required (takeUntilDestroyed, async pipe)
- Concurrent async operations складно управляти
- Angular 17+: signal() є кращою альтернативою для простих cases

**Версійність:**
- Angular 2+: Базовий pattern доступний з початку
- Angular 16+: signal() як альтернатива BehaviorSubject
- Angular 17+: NgRx SignalStore як structured upgrade path
- Angular 17+: toSignal() для bridge від BehaviorSubject до Signal consumers

## Deep Details

### Edge Cases

- **BehaviorSubject.getValue() в async contexts:** Якщо між getValue() і next() є async operations — інший subscriber міг змінити state. Race condition. Рішення: `update(fn)` pattern — fn отримує current value atomic.
- **Error у BehaviorSubject:** Якщо HTTP error propagates і не caught → next(null) + setError — або error() на Subject що kills it permanently. НІКОЛИ error() на state Subject.
- **Circular dependency між services:** ServiceA inject ServiceB inject ServiceA — Angular DI error. Вирішення: extract shared state у третій сервіс або refactor.
- **Multiple subscribers і memory:** 100 components підписуються на BehaviorSubject — 100 subscriptions. Signal у service — 0 subscriptions, auto-tracked. Перевага signals для high-subscriber scenarios.
- **distinctUntilChanged і object references:** `distinctUntilChanged()` порівнює через `===`. Для objects: однаковий вміст але новий reference → emit. Для примітивів — коректно. Deep comparison: `distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))` — дорого.

### Junior vs Senior Understanding

**Junior** знає: "BehaviorSubject у сервісі, asObservable(), .next() для оновлень."

**Senior** розуміє глибину:

1. **State as single object:** Замість 3+ BehaviorSubjects — один `BehaviorSubject<PageState>`. Atomic updates: `{ ...state, loading: true, error: null }`. Уникнення inconsistent state (loading=true і error='something').

2. **Discriminated union state type:** `type AsyncState<T> = Idle | Loading | Success<T> | Error`. TypeScript narrowing забезпечує що компонент не читає `data` у Loading state.

3. **Base Store class:** Реusable generic class зі select(), dispatch(), update() — уникнення дублювання між сервісами.

4. **Migration trigger:** Коли є 3+ сервіси що читають state одне одного — час для NgRx SignalStore або NgRx Store. Cross-service dependencies → tangled state = debugging nightmare.

### Deprecation & Migration Path

- BehaviorSubject pattern не deprecated, але Signal-based service є recommended для нових features.
- Migration шлях:
  1. `BehaviorSubject<T>` → `signal<T>()`
  2. `.asObservable()` → `.asReadonly()`
  3. `pipe(map(selector))` → `computed(() => selector(this.state()))`
  4. `.next(value)` → `.set(value)` або `.update(fn)`
  5. `| async` у template → `()` (signal read)

### Connections to Other Concepts

- **Subject Types (b10t3):** BehaviorSubject semantics і encapsulation.
- **Signals (b11t1):** Signal-based service альтернатива.
- **NgRx (b12t2):** Structured upgrade path для complex state.
- **SignalStore (b11t3):** Middle-ground між service і NgRx.

## Examples

### Basic Usage

```typescript
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface TodosState {
  items: Todo[];
  loading: boolean;
  error: string | null;
  filter: 'all' | 'active' | 'completed';
}

const initialState: TodosState = {
  items: [],
  loading: false,
  error: null,
  filter: 'all',
};

@Injectable({ providedIn: 'root' })
export class TodosService {
  private http = inject(HttpClient);

  // ✅ Private state container
  private state = new BehaviorSubject<TodosState>(initialState);

  // ✅ Public read-only observable
  readonly state$ = this.state.asObservable();

  // ✅ Typed selectors — emit only on relevant changes
  readonly todos$ = this.state$.pipe(
    map(s => s.items),
    distinctUntilChanged(),
  );
  readonly loading$ = this.state$.pipe(map(s => s.loading));
  readonly error$ = this.state$.pipe(map(s => s.error));

  // ✅ Filtered selector
  readonly filteredTodos$ = this.state$.pipe(
    map(s => {
      if (s.filter === 'active') return s.items.filter(t => !t.done);
      if (s.filter === 'completed') return s.items.filter(t => t.done);
      return s.items;
    }),
    distinctUntilChanged(),
  );

  // ✅ Private atomic patch utility
  private patch(partial: Partial<TodosState>): void {
    this.state.next({ ...this.state.getValue(), ...partial });
  }

  // ✅ Commands
  loadTodos(): void {
    this.patch({ loading: true, error: null });
    this.http.get<Todo[]>('/api/todos').pipe(
      catchError(err => {
        this.patch({ loading: false, error: err.message });
        return of([]);
      }),
    ).subscribe(items => this.patch({ items, loading: false }));
  }

  addTodo(text: string): void {
    const newTodo: Todo = { id: Date.now().toString(), text, done: false };
    this.patch({ items: [...this.state.getValue().items, newTodo] });
  }

  toggleTodo(id: string): void {
    this.patch({
      items: this.state.getValue().items.map(t =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    });
  }

  setFilter(filter: TodosState['filter']): void {
    this.patch({ filter });
  }
}
```

### Production Scenario

```typescript
// Signal-based version (Angular 17+ preferred)
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface ProductsState {
  items: Product[];
  status: AsyncStatus;
  error: string | null;
  selectedId: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductsStateService {
  private http = inject(HttpClient);

  // ✅ Private writable state signals
  private _items = signal<Product[]>([]);
  private _status = signal<AsyncStatus>('idle');
  private _error = signal<string | null>(null);
  private _selectedId = signal<string | null>(null);

  // ✅ Public read-only signals
  readonly items = this._items.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();

  // ✅ Computed derived state (glitch-free)
  readonly isLoading = computed(() => this._status() === 'loading');
  readonly hasError = computed(() => this._status() === 'error');
  readonly selectedProduct = computed(() =>
    this._items().find(p => p.id === this._selectedId()) ?? null
  );
  readonly inStockCount = computed(() =>
    this._items().filter(p => p.inStock).length
  );

  // ✅ Commands
  loadProducts(): void {
    this._status.set('loading');
    this._error.set(null);
    this.http.get<Product[]>('/api/products').pipe(
      catchError(err => {
        this._status.set('error');
        this._error.set(err.message);
        return of([]);
      }),
    ).subscribe(items => {
      this._items.set(items);
      this._status.set('success');
    });
  }

  selectProduct(id: string): void {
    this._selectedId.set(id);
  }

  updateProduct(updated: Product): void {
    this._items.update(items => items.map(p => p.id === updated.id ? updated : p));
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: Public Subject — anyone can error() or complete()
@Injectable({ providedIn: 'root' })
export class BadService {
  public todos$ = new BehaviorSubject<Todo[]>([]); // ❌ public!
}
// Somewhere in a component:
badService.todos$.error(new Error('oops')); // Kills all subscribers!

// ❌ WRONG: Multiple BehaviorSubjects — hard to synchronize
@Injectable({ providedIn: 'root' })
export class FragmentedService {
  loading$ = new BehaviorSubject(false);      // ❌ separated
  error$ = new BehaviorSubject<string | null>(null);    // ❌ separated
  items$ = new BehaviorSubject<Todo[]>([]);   // ❌ separated
  // Race condition: between loading$=false and items$=data
}

// ❌ WRONG: Direct state mutation
@Injectable({ providedIn: 'root' })
export class MutatingService {
  private state = new BehaviorSubject({ items: [] as Todo[] });

  addTodo(todo: Todo): void {
    // ❌ Mutating array in-place! BehaviorSubject doesn't know!
    this.state.getValue().items.push(todo);
    // subscribers don't get notified!
  }
}

// ✅ CORRECT: Encapsulated, single state object, immutable updates
@Injectable({ providedIn: 'root' })
export class GoodService {
  private state = new BehaviorSubject({ items: [] as Todo[] });
  readonly items$ = this.state.pipe(map(s => s.items), distinctUntilChanged());

  addTodo(todo: Todo): void {
    const current = this.state.getValue();
    this.state.next({ ...current, items: [...current.items, todo] }); // ✅ immutable
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Public BehaviorSubject у сервісі | error()/complete() від будь-якого consumer — state назавжди dead | Private Subject + public `asObservable()` |
| Multiple окремих BehaviorSubjects | Race condition між updates, hard to synchronize | Single state object `BehaviorSubject<State>` |
| Direct state mutation без .next() | Subscribers не сповіщаються | Immutable update: `state.next({ ...state.getValue(), field: value })` |
| Без distinctUntilChanged у selectors | Зайві re-renders при незмінних sub-fields | `pipe(map(selector), distinctUntilChanged())` |
| BehaviorSubject для simple toggles у Angular 17+ | Зайва complexity | `signal<boolean>(false)` — simple, auto-tracked |

## Interview Block

### [L1 — Warm-up] Як реалізувати shared state між компонентами без NgRx?
**Signal being tested:** Знання service-based state pattern і BehaviorSubject semantics
**What the interviewer expects:** Injectable service, BehaviorSubject, asObservable(), public selectors, private mutations
**How to probe deeper:** "Чому не можна expose BehaviorSubject напряму?"
**Reference answer:** Injectable сервіс з private `BehaviorSubject<State>`. Public Observable: `asObservable()`. Derived selectors: `pipe(map, distinctUntilChanged)`. Mutation methods. Компоненти: inject сервіс + async pipe або toSignal. В Angular 17+: signal() замість BehaviorSubject — простіше, без subscriptions.
**Common mistakes:** Public Subject; multiple окремих Subjects; mutate state напряму

### [L2 — Mid] Як забезпечити immutable state updates?
**Signal being tested:** Розуміння immutability для Angular OnPush і predictable state
**What the interviewer expects:** Spread operator, Immer.js для deep, чому immutability important для OnPush CD
**How to probe deeper:** "Як зробити deep immutable update для nested objects без Immer?"
**Reference answer:** Shallow: `state.next({ ...current, field: value })`. Arrays: `[...array, item]`, `array.filter(...)`. Deep nested: `{ ...s, nested: { ...s.nested, deep: value } }` — verbose. Immer.produce(): `produce(state, draft => { draft.items.push(item) })` — structural sharing. OnPush: reference change required для CD trigger.
**Common mistakes:** JSON.parse(JSON.stringify) — втрата Date/undefined; мутація без .next(); не знають Immer

### [L3 — Senior] Як написати typed service store з Error і Loading state?
**Signal being tested:** Розуміння typed state, discriminated unions, AsyncState pattern
**What the interviewer expects:** Discriminated union для status, TypeScript narrowing, patchState utility, selector distinctUntilChanged
**How to probe deeper:** "Як обробити concurrent async operations з окремими loading states?"
**Reference answer:** `type AsyncState<T> = {status:'idle'}|{status:'loading'}|{status:'success',data:T}|{status:'error',error:string}`. TypeScript narrowing: `if (s.status==='success') s.data`. Single BehaviorSubject з atomic patch. Concurrent operations: окремий `{operationName}Loading: boolean` field у state. Generic base Store class: `select(selector)`, `update(fn)`.
**Common mistakes:** Multiple BehaviorSubjects для loading/error; не знають discriminated union; не знають distinctUntilChanged

### [L4 — Staff/Principal] Коли service, коли SignalStore, коли NgRx?
**Signal being tested:** Архітектурний judgment і scaling decisions
**What the interviewer expects:** Decision criteria (scope, complexity, team, devtools), continuum service → SignalStore → NgRx, migration triggers
**How to probe deeper:** "Ваш сервіс з BehaviorSubject виріс до 5 services що взаємодіють. Що далі?"
**Reference answer:** Service: < 5 components, isolated feature, zero deps. SignalStore: feature-level з loading/entities/methods, middle complexity. NgRx: global, cross-feature, audit trail, devtools. Migration triggers: debugging painful, cross-service deps complex, team > 5 engineers. Signal service (Angular 17+) замінює BehaviorSubject service для simple cases. Не pre-optimize: start simple, refactor when needed.
**Common mistakes:** NgRx для все; service для global cross-feature; не знають SignalStore middle ground

## Summary

### Key Points
- Service + BehaviorSubject: private state, public asObservable(), immutable updates, mutation methods
- Single state object `BehaviorSubject<State>` замість multiple окремих — atomic updates
- Immutable updates через spread або Immer.js — required для OnPush і predictable state
- Typed discriminated union state — TypeScript narrowing для correct state access
- Angular 17+: signal() + computed() — preferred over BehaviorSubject для new features
- Migration trigger: > 5 cross-dependent services → SignalStore або NgRx
- Decision continuum: local signal → service → SignalStore → NgRx

### Elevator Pitch (2 minutes)
"Service with BehaviorSubject — найпростіший state management: Injectable singleton з private BehaviorSubject<State>, public asObservable() і методами для mutations. Key patterns: один state object (не multiple subjects), immutable updates (spread або Immer), typed discriminated union (idle/loading/success/error), distinctUntilChanged для selectors. В Angular 17+: signal() + computed() краще — без subscription lifecycle. Scaling: при > 5 взаємодіючих сервісах → NgRx SignalStore або NgRx Store. Принцип: start simple, refactor when needed, не over-engineer до початку."
