---
title: "Signals — Reactive Primitives in Angular"
block: 9
topic: 4
slug: "signals"
difficulty: 3
sinceVersion: "16"
tags: ["signals", "signal", "computed", "effect", "WritableSignal", "toSignal", "toObservable", "reactivity"]
relatedTopics: ["cd-mechanism", "onpush-strategy", "zoneless-angular", "signal-vs-observable", "rxjs-signal-interop"]
interviewQuestions:
  - id: "b9t4q1"
    level: "junior"
    question: "Що таке Angular Signals і яку проблему вони вирішують?"
    referenceAnswers:
      junior: "Signals — це реактивні значення що автоматично оновлюють UI при зміні. Signal створюється через signal(initialValue), читається через mySignal(), оновлюється через mySignal.set(newValue) або mySignal.update(prev => newValue)."
      mid: "Signals вирішують дві проблеми: 1) Zone.js implicit CD triggering — з signals CD тригерується тільки для компонентів що читають змінений signal. 2) Складне управління Observable subscriptions. Три примітиви: signal<T>(initial) — WritableSignal; computed(() => derived) — read-only, мemoized, lazy; effect(() => sideEffect) — runs when dependencies change. Всі три використовують reactive context для автоматичного dependency tracking — читання signal у computed/effect реєструє dependency."
      senior: "Signals реалізують fine-grained reactivity через reactive graph. Кожен signal є producer (SignalNode) що зберігає consumers list. computed() є і consumer (читає signals) і producer (надає значення). Lazy evaluation: computed() не обчислюється до першого читання. Memoization: якщо dependencies не змінились — повертає cached value. effect() є consumer що runs side effects і re-runs при dependency change. Signal в template: Angular template engine реєструє LView як consumer сигналу — при signal change → LView.dirty = true → targeted CD. Це принципово відрізняється від Zone.js (full tree) і markForCheck() (upward dirty marking)."
      staff: "Signals є фундаментальним зрушенням в Angular reactivity model. Reactive graph architecture: SignalNode (producers) → consumers (computed, effect, LView). SignalNode зберігає: value, version counter, consumers list. При signal.set(): version increment → notify all consumers → consumers invalidate (computed) або schedule re-run (effect) або mark LView dirty. Computed lazy evaluation: якщо consumer читає computed — перевіряє версію dependencies; якщо змінилась → re-evaluate; інакше → cached value. Signal equality: за замовчуванням Object.is(); custom: signal(val, { equal: deepEqual }). Для enterprise: signals є foundation для Signal Store (NgRx, Elf) — centralised reactive state без Subscription management. Performance: signals CD O(dirty_consumers) vs Zone.js O(total). Angular 19: input(), output(), viewChild(), contentChild() — signal-based alternatives до @Input/@Output @ViewChild @ContentChild."
    commonMistakes:
      - "Викликають signal як функцію в template без () — отримують SignalNode object замість value"
      - "Оновлюють signal в effect() без guard — нескінченний цикл: effect runs → signal changes → effect runs..."
      - "Використовують effect() для sync state derivation замість computed()"
    relatedQuestions: ["b9t4q2", "b9t4q3"]
  - id: "b9t4q2"
    level: "mid"
    question: "Яка різниця між computed() і effect() і коли використовувати кожен?"
    referenceAnswers:
      junior: "computed() — для обчислення похідного значення з signals (синхронно, повертає значення). effect() — для side effects що повинні виконуватись при зміні signals (наприклад, логування або HTTP запит)."
      mid: "computed<T>(() => T): 1) Синхронно обчислює значення з інших signals. 2) Lazy — обчислюється тільки при першому читанні. 3) Memoized — кешує результат, re-evaluate тільки якщо dependencies змінились. 4) Read-only — не можна встановити ззовні. Використовувати: для derived state (fullName = computed(() => `${firstName()} ${lastName()}`)). effect(() => void): 1) Side effects при зміні signals. 2) Runs eagerly — при першому виклику і при кожній dependency change. 3) Не повертає значення. Використовувати: logging, localStorage sync, WebSocket send, third-party lib integration."
      senior: "Ключова різниця: computed — pull model (value pulled on read); effect — push model (runs on change). Nested computed: computed може читати інші computed — вони утворюють reactive graph. Computed в template: Angular реєструє LView як consumer computed, не direct signal dependencies — це важливо для performance (зміна signal → computed → LView, якщо computed result не змінилось → LView не dirty). effect() lifecycle: виконується у current injection context; cleanup через повернутий DisposeFn або inject(DestroyRef).onDestroy(effect.destroy). effect() і WritableSignal: оновлювати signal в effect() — допустимо але обережно — потрібна guard умова щоб уникнути циклів. allowSignalWrites: true опція для effect що оновлює signals."
      staff: "computed vs effect архітектурна різниця: computed для synchronous transformations (data mapping, aggregation) — частина reactive graph; effect для side effects що не повертають значення до graph (IO, storage, external APIs). Anti-pattern: використовувати effect для sync state derivation замість computed — ламає reactive graph оптимізацію. Pattern: store state as minimal signals, derive everything else as computed. Effect для observability: `effect(() => { if (errorSignal()) { analytics.track('error', errorSignal()); } })` — clean integration without Subscription. Cleanup в effect: `effect(() => { const sub = ws.connect(url()); return () => sub.close(); })` — повернута функція виконується перед re-run і при destroy. Glitch-free evaluation: Angular гарантує що computed і effect не бачать intermediate inconsistent state (наприклад, якщо A і B змінились — effect що читає A і B запуститься після ОБОХ змін, не після кожної окремо)."
    commonMistakes:
      - "Використовують effect() для derived state замість computed() — не мемоізовано, side-effect semantics"
      - "effect() без cleanup для subscriptions — memory leak"
      - "Оновлюють signal в effect без allowSignalWrites або без guard — infinite loop"
    relatedQuestions: ["b9t4q1", "b9t4q3"]
  - id: "b9t4q3"
    level: "mid"
    question: "Що таке input() і viewChild() signals і чим вони кращі за @Input() і @ViewChild()?"
    referenceAnswers:
      junior: "input() і viewChild() — це signal-based версії @Input() і @ViewChild() введені в Angular 17. Вони повертають Signal замість plain properties, що дозволяє реактивно відслідковувати зміни."
      mid: "input<T>() (Angular 17, stable 19): замість @Input() — повертає InputSignal<T>. Переваги: участь у reactive graph (computed/effect можуть depend on input), required inputs: input.required<T>(), transform: input(0, { transform: numberAttribute }). viewChild<T>(token) замість @ViewChild: повертає Signal<T | undefined>. contentChild/viewChildren/contentChildren теж signal-based. Ці signal-based APIs дозволяють: template expressions без () overhead, computed з input, більш predictable timing."
      senior: "Signal inputs vs @Input() технічна різниця: @Input() встановлюється через property assignment у lifecycle (ngOnChanges). input() — встановлюється через writableSignal.set() інтернально Angular — споживачі (computed, effect) автоматично оновлюються. Timing перевага: з signal inputs можна реактивно derived state без ngOnChanges. Приклад: `readonly sortedItems = computed(() => [...this.items()].sort())` де `items = input<Item[]>([])` — computed автоматично re-evaluates при input change. @ViewChild timing issue: статичний false — доступний після ngAfterViewInit; viewChild() сигнал — той самий timing але реактивний. required: input.required<T>() — compile-time помилка якщо не передати. model(): двосторонній signal-based binding для компонентів (аналог [(ngModel)])."
      staff: "Signal inputs є кроком до повного signal-based component API. Angular 17-19 migration: @Input → input(), @Output → output(), @ViewChild → viewChild() — поступово без breaking changes, обидва APIs підтримуються. output() замість @Output(): EventEmitter<T> → OutputEmitter<T>. output() не є Signal (не має значення), але є type-safe альтернативою. model<T>() — двостороннє binding (WritableSignal + output для [()] syntax). Для component library: signal inputs дозволяють споживачам компонентів використовувати input values в computed() без додаткових patterns. Testing: signal inputs тестуються через component.inputName.set(value) в TestBed — немає потреби у fixture.componentRef.setInput(). Performance: signal-based component tree дозволяє Angular знати exact залежності — майбутні оптимізації (lazy component hydration на основі signal dependencies)."
    commonMistakes:
      - "Намагаються встановити input() ззовні: component.items.set([]) — InputSignal read-only ззовні"
      - "Плутають model() з signal() — model() двосторонній, signal() тільки локальний"
    relatedQuestions: ["b9t4q2", "b9t4q4"]
  - id: "b9t4q4"
    level: "staff"
    question: "Як signals змінюють архітектуру state management порівняно з BehaviorSubject/Observable підходом?"
    referenceAnswers:
      junior: "Signals простіші у використанні ніж Observables — не потрібна підписка, читаються синхронно як звичайні змінні."
      mid: "BehaviorSubject pattern: service.state$ = new BehaviorSubject(initial); оновлення через .next(newValue); читання через async pipe або subscribe(). Signal pattern: state = signal(initial); оновлення через .set() або .update(); читання у template через state() без async pipe. Переваги signals: no subscription management, synchronous read, automatic CD integration, computed для derived state без complex pipe chains."
      senior: "Архітектурний зсув: BehaviorSubject = push-based (stream), Signal = pull-based з automatic notification. Derived state comparison: BehaviorSubject: combineLatest([a$, b$]).pipe(map(([a, b]) => a + b), distinctUntilChanged()); Signal: computed(() => a() + b()). Signals автоматично distinctUntilChanged (Object.is). Для complex async: signals не замінюють Observables для async flows (HTTP, WebSocket) — toSignal() bridging. Signal Store pattern: patchState для atomic updates, selectSignal() для derived selectors. Angular Signal Store (NgRx): reducer-less, signals-native state management."
      staff: "Signal-based state architecture for enterprise: 1) Domain signals: separate service per domain (UserService, CartService) з signal state. 2) patchState() для atomic multi-signal update (prevents intermediate states in reactive graph). 3) Computed selectors: `readonly cartTotal = computed(() => this.items().reduce((sum, i) => sum + i.price, 0))`. 4) Signal Store (NgRx Angular 18+): signalStore() як replacement для ComponentStore — declarative, type-safe, computed selectors, RxJS interop. 5) Cross-service reactivity: `computed(() => userService.isLoggedIn() && cartService.items().length > 0)` — cross-service derived state без complex RxJS pipe. 6) Testing: signals тестуються синхронно — `expect(component.total()).toBe(100)` замість fakeAsync або marble testing. 7) Migration from BehaviorSubject: incremental — add signals alongside BehaviorSubjects, gradually migrate consumers, then convert source. 8) Performance: signal graph execution O(changed_nodes) vs RxJS stream O(all_operators) — signals more efficient for synchronous derived state."
    commonMistakes:
      - "Замінюють ВСЕ на signals включно з async операціями — HTTP та WebSocket краще залишити Observable"
      - "Не використовують patchState() для atomic updates — intermediate states тригерять зайві computed re-evaluations"
    relatedQuestions: ["b9t4q3", "b9t5q1", "b9t7q1"]
---

## Core Concept

**English definition:** Angular Signals are reactive primitives that represent synchronously readable, trackable values. A Signal notifies its consumers (computed, effects, template LViews) when its value changes, enabling fine-grained, targeted change detection without Zone.js traversal.

**Пояснення:** Signals — це "розумні змінні" що знають хто їх читає і повідомляють читачів при зміні. Три примітиви: `signal()` для стану, `computed()` для похідних значень, `effect()` для side effects. На відміну від Observable (pull з async), Signal — synchronous і push при зміні.

**Яку проблему вирішує:**
1. **CD performance:** Zone.js тригерить full tree traversal. Signal change тригерить тільки LViews що читали цей signal — O(consumers) замість O(total)
2. **Subscription management:** BehaviorSubject потребує subscribe/unsubscribe. Signal читається синхронно як звичайна функція — `mySignal()`
3. **Derived state complexity:** `combineLatest + distinctUntilChanged + map` → `computed(() => ...)` — значно простіше

**Як працює під капотом:**

**Reactive graph:**
- `signal<T>(value)` повертає `WritableSignal<T>` — `SignalNode<T>` з `value` і `consumers: ReactiveNode[]`
- Читання signal у `computed/effect/template`: Angular реєструє поточний reactive consumer у `signal.consumers`
- `signal.set(newValue)`: оновлює value → increment version → iterate consumers → notify (invalidate computed, schedule effect, mark LView dirty)
- `computed<T>(() => T)`: є і consumer (читає signals) і producer. Lazy + memoized: лише re-evaluates якщо dependency version > cached version
- Template reading: `{{ mySignal() }}` — Angular template compiler generates code що registers LView as consumer

**Trade-offs та обмеження:**
- Signals є synchronous — для async операцій (HTTP, WebSocket) потрібен toSignal() + Observable bridge
- effect() ordering та cleanup потребують уваги
- Ще не всі Angular APIs signal-based (deferred view взаємодія, router events)
- Глибока зміна в mental model порівняно з Observable-first підходом

**Версійність:**
- Angular 16: Signals developer preview (signal, computed, effect)
- Angular 17: Signal inputs (input(), output(), viewChild()), toSignal(), toObservable() stable
- Angular 17: effect() з allowSignalWrites
- Angular 18: model() stable, Signals fully stable
- Angular 19: input(), output(), viewChild(), contentChild(), viewChildren() — all stable, recommended
- Angular 21: Signal-based component API recommended default

## Deep Details

### Edge Cases

**Glitch-free updates:** Angular гарантує що якщо кілька signals змінились в одній операції, consumers (effect, computed, LView) бачать consistent snapshot — не intermediate state. Це досягається через batch/flush механізм.

**computed() в constructor:** computed() може бути ініціалізовано в constructor — вони lazy, не обчислюються до першого read.

**effect() і injection context:** effect() повинен бути створений в injection context (constructor, factory function, або з injector параметром). Поза injection context — кинути помилку.

**signal() equality:** За замовчуванням Object.is(). Для об'єктів/масивів потрібна custom equal функція: `signal([], { equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]) })`.

**Infinite loop prevention:** signal.set() в effect() — допустимо, але Angular detect cycles і кидає помилку після N iterations.

**input.required() runtime check:** Angular throws при відсутньому required input не при compile time але при component initialization.

### Junior vs Senior Understanding

**Junior розуміє:** signal/computed/effect API, основне використання, читання через ().

**Senior розуміє:**
- Reactive graph механізм (SignalNode, consumers, lazy evaluation)
- Glitch-free evaluation гарантії
- Різниця computed vs effect і правильні use cases
- input(), viewChild() signal APIs і їх переваги
- toSignal() для Observable → Signal bridge

**Staff розуміє:**
- Performance: O(consumers) vs O(total) CD complexity
- Signal Store patterns (NgRx Signal Store, custom)
- Atomic state updates через batch/patchState
- Migration strategy від Observable/BehaviorSubject до Signals
- Testing signals синхронно vs fakeAsync для Observables

### Deprecation & Migration Path

Signals не deprecate Observables — вони complementary. Поступова migration:

```typescript
// Before: BehaviorSubject pattern
@Injectable()
class UserService {
  private _user$ = new BehaviorSubject<User | null>(null);
  readonly user$ = this._user$.asObservable();
  setUser(user: User) { this._user$.next(user); }
}

// After: Signal pattern
@Injectable()
class UserService {
  private _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  setUser(user: User) { this._user.set(user); }
}
```

`toSignal()` для HTTP (залишається Observable):
```typescript
readonly users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });
```

### Connections to Other Concepts

- **CD Mechanism (b9t2):** Signals mark LView consumers dirty — targeted CD
- **OnPush (b9t3):** Signals are perfect companion for OnPush — automatic dirty marking
- **Zoneless (b9t5):** Signals є primary CD mechanism у zoneless apps
- **Signal vs Observable (b9t7):** Decision framework між двома підходами
- **RxJS-Signal Interop (b10t7):** toSignal(), toObservable() bridging

## Examples

### Basic Usage

```typescript
import {
  Component, signal, computed, effect, OnInit, inject
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

interface Product {
  id: number;
  name: string;
  price: number;
}

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  template: `
    <div>
      <h2>Cart ({{ itemCount() }} items)</h2>
      <p>Total: {{ total() | currency }}</p>

      @for (item of cartItems(); track item.id) {
        <div>
          {{ item.name }} — {{ item.price | currency }}
          <button (click)="removeItem(item.id)">Remove</button>
        </div>
      }
    </div>
  `,
})
export class ShoppingCartComponent {
  // Writable signal — local state
  cartItems = signal<Product[]>([]);

  // computed — derived from cartItems, lazy + memoized
  itemCount = computed(() => this.cartItems().length);
  total = computed(() => this.cartItems().reduce((sum, item) => sum + item.price, 0));

  // effect — side effect when cart changes
  private syncToLocalStorage = effect(() => {
    // Automatically re-runs when cartItems changes
    localStorage.setItem('cart', JSON.stringify(this.cartItems()));
    // No need to unsubscribe — effect cleaned up when component destroys
  });

  addItem(product: Product): void {
    // update(): modify based on current value
    this.cartItems.update(items => [...items, product]);
  }

  removeItem(id: number): void {
    this.cartItems.update(items => items.filter(item => item.id !== id));
  }
}
```

### Production Scenario

```typescript
// Signal-based service with HTTP bridge
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, shareReplay } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

interface DashboardState {
  selectedUserId: number | null;
  filters: { role: string; active: boolean };
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private http = inject(HttpClient);

  // Local state signals
  private _state = signal<DashboardState>({
    selectedUserId: null,
    filters: { role: 'all', active: true },
  });

  // Public read-only views
  readonly selectedUserId = computed(() => this._state().selectedUserId);
  readonly filters = computed(() => this._state().filters);

  // HTTP data — reactive to filter changes via Observable bridge
  readonly users = toSignal(
    toObservable(this.filters).pipe(
      switchMap(filters =>
        this.http.get<User[]>('/api/users', {
          params: { role: filters.role, active: String(filters.active) }
        })
      ),
      shareReplay(1),
    ),
    { initialValue: [] as User[] }
  );

  // Derived computed from HTTP data
  readonly activeUserCount = computed(() =>
    this.users().filter(u => u.active).length
  );

  // Actions
  selectUser(id: number): void {
    this._state.update(s => ({ ...s, selectedUserId: id }));
  }

  setFilter(filter: Partial<DashboardState['filters']>): void {
    this._state.update(s => ({
      ...s,
      filters: { ...s.filters, ...filter }
    }));
  }
}

interface User { id: number; name: string; active: boolean; role: string; }
```

### Anti-Example

```typescript
// WRONG: Common signal anti-patterns
@Component({ template: `{{ mySignal }}` }) // WRONG: missing () — renders [object Object]
class Wrong1 {}

@Component({ template: `{{ mySignal() }}` })
class Wrong2 {
  mySignal = signal(0);

  constructor() {
    effect(() => {
      // WRONG: Infinite loop — reading and writing same/dependent signal without guard
      if (this.mySignal() < 100) {
        this.mySignal.update(v => v + 1); // Each set → effect re-runs → set → ...
        // allowSignalWrites: true doesn't prevent the loop — logic guard needed
      }
    });
  }
}

// WRONG: Using effect for derived state instead of computed
@Component({ template: `{{ derivedValue }}` })
class Wrong3 {
  source = signal(10);
  derivedValue = 0; // NOT a signal — won't update template!

  constructor() {
    // WRONG: Should be computed(() => this.source() * 2)
    effect(() => {
      this.derivedValue = this.source() * 2; // derivedValue is not reactive!
    });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `{{ mySignal }}` in template without `()` | Renders the Signal object reference, not its value | Always call signals: `{{ mySignal() }}` |
| Using `effect()` for derived state instead of `computed()` | effect() has side-effect semantics, not memoized, no glitch-free guarantee for derived values | `computed(() => derivedValue)` — lazy, memoized, part of reactive graph |
| Reading and setting the same signal in `effect()` without guard | Creates infinite update cycle — effect runs → signal changes → effect runs... | Add condition guard: `if (this.signal() !== target) this.signal.set(target)`, or restructure to use `computed()` |
| Converting every Observable to Signal with `toSignal()` | HTTP/WebSocket flows are naturally async — signal wrapping adds unnecessary complexity | Use toSignal() for stable data streams; keep complex async operators as Observable chains |
| `signal` for async operations: `signal(this.http.get(...))` | Signal stores the Observable object, not the response | Use `toSignal(this.http.get<T>(...), { initialValue: defaultValue })` |

## Interview Block

### [L1 — Warm-up] Що таке Angular Signals і яка різниця між signal(), computed() і effect()?

**Signal being tested:** Розуміння трьох signal primitives і їх ролей у reactive architecture.

**What the interviewer expects:** Чіткий опис кожного примітиву з use cases: state (signal), derived (computed), side effects (effect).

**How to probe deeper:** "Якщо computed() не викликається — чи буде він обчислюватись? Чому?"

**Reference answer:** `signal<T>(value)` — WritableSignal для mutable state, читається через `mySignal()`, оновлюється через `.set()` або `.update()`. `computed<T>(() => expr)` — read-only derived value, lazy (обчислюється тільки при першому read), memoized (не re-evaluate якщо dependencies не змінились). `effect(() => sideEffect)` — side effects що re-run при dependency change (localStorage sync, logging, WebSocket). computed() не обчислюється якщо його ніхто не читає — це lazy pull-based semantics, на відміну від effect() що є push-based.

**Common mistakes:** Використовують effect() для derived state — `derivedValue = 0; effect(() => { derivedValue = source() * 2; })` — derivedValue не reactive, UI не оновиться.

---

### [L2 — Mid] Як signal inputs (input()) відрізняються від @Input() і які переваги?

**Signal being tested:** Знання Angular 17+ signal-based component API і практичне розуміння переваг.

**What the interviewer expects:** Reactive integration (input в computed/effect), required inputs, transform, і сучасний рекомендований підхід.

**How to probe deeper:** "Як прочитати input() value в computed() і що відбудеться при зміні Input з батьківського компонента?"

**Reference answer:** `input<T>()` (Angular 17+) повертає `InputSignal<T>` — read-only Signal. Переваги: 1) Участь у reactive graph — `computed(() => this.items().length)` автоматично re-evaluates при Input change без ngOnChanges. 2) `input.required<T>()` — compile-time safety. 3) `input(default, { transform: numberAttribute })` — вбудований transform. 4) Синхронне читання без ngOnChanges lifecycle hook. При зміні Input у parent: Angular внутрішньо викликає `writableSignal.set(newValue)` → consumers (computed, effect, LView) повідомляються.

**Common mistakes:** Намагаються `component.items.set([])` ззовні — InputSignal read-only поза компонентом.

---

### [L3 — Senior] Як signals інтегруються з change detection і що означає "targeted CD"?

**Signal being tested:** Розуміння того як Signal reactive graph замінює/доповнює Zone.js для CD triggering.

**What the interviewer expects:** Опис consumer registration mechanism, targeted dirty marking, порівняння з Zone.js full-tree traversal.

**How to probe deeper:** "В app з 500 компонентів — скільки перевіряє Angular якщо змінити один signal що читається у 3 компонентах?"

**Reference answer:** Signals реалізують targeted CD: при `signal.set()` → Angular notify тільки registered consumers (LViews що читали signal). З 500 компонентів і 3 consumers — Angular перевіряє тільки ці 3 LViews + їх ancestors для dirty propagation. Для порівняння: Zone.js async event → ApplicationRef.tick() → ALL 500 компонентів перевіряються. Mechanism: при `mySignal()` у template Angular реєструє поточний LView як consumer у SignalNode.consumers[]. При `signal.set()`: iterate consumers → `lView.flags |= LViewFlags.Dirty`. Наступний CD cycle: traverse тільки dirty LViews.

**Common mistakes:** Думають signals і Zone.js несумісні — у Angular 17-21 вони сумісні (поступова migration).

---

### [L4 — Staff/Principal] Як signals змінюють архітектуру state management і яка стратегія міграції від BehaviorSubject-based stores?

**Signal being tested:** Системне мислення про state management evolution і здатність спланувати incremental migration.

**What the interviewer expects:** Порівняння BehaviorSubject vs signal model, NgRx Signal Store, incremental migration strategy, testing implications.

**How to probe deeper:** "Як вирішити atomic multi-signal update без intermediate states що тригерять зайві computed re-evaluations?"

**Reference answer:** BehaviorSubject vs signals: BehaviorSubject = push stream, unsubscribe management, async; Signal = synchronous reactive graph, no subscription. Migration: не replace все одразу — `toSignal(service.state$)` bridge. NgRx Signal Store: `signalStore()` з `withState()`, `withComputed()`, `withMethods()` — signals-native state. Atomic updates: NgRx `patchState()` або custom batch mechanism — updates multiple signals, computed evaluate once після всіх змін. Testing: signals sync — `expect(store.total()).toBe(100)` без fakeAsync. Migration phases: new features в signals, legacy BehaviorSubjects incrementally converted, toSignal bridges for HTTP data.

**Common mistakes:** Замінюють HTTP Observables на plain signals без toSignal() — HTTP async incompatible з sync signals.

## Summary

### Key Points

- Три signal primitives: `signal<T>()` (writable state), `computed<T>(() => expr)` (lazy memoized derived), `effect(() => void)` (side effects)
- Reading signal у reactive context (computed/effect/template) автоматично реєструє consumer для notifications
- Targeted CD: signal change → notify only registered LView consumers → mark dirty → check only dirty LViews (O(consumers) vs Zone.js O(total))
- `input()`, `viewChild()`, `output()`, `model()` — signal-based component APIs (stable Angular 19+)
- computed() — pull-based, lazy, мemoized; effect() — push-based, eager; не плутати їх use cases
- toSignal() / toObservable() — bridge між Observable і Signal worlds (RxJS-interop)
- Signals є foundation для modern Angular state management (NgRx Signal Store, custom signal stores)

### Elevator Pitch (2 minutes)

Angular Signals — це reactive primitives що вирішують дві проблеми: ефективний CD і складний subscription management. `signal<T>(value)` — writable state; `computed(() => expr)` — lazy memoized derived state; `effect(() => sideEffect)` — side effects що автоматично re-run при change. Mechanism: читання signal реєструє consumer; `signal.set()` notifies тільки registered consumers. В template: Angular реєструє LView як consumer — `signal.set()` marks тільки ті LViews dirty. Порівняно з Zone.js (full tree O(total)), signals забезпечують targeted CD O(consumers). Signal inputs (`input()`, `viewChild()`) дозволяють computed/effect depend on @Input без ngOnChanges. toSignal() і toObservable() bridging для async flows. Signals не замінюють Observables для async — вони complementary.
