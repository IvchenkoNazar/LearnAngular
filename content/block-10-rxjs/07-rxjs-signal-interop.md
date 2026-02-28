---
title: "RxJS and Signals Interoperability"
block: 10
topic: 7
slug: "rxjs-signal-interop"
difficulty: 4
sinceVersion: "16"
tags: ["toSignal", "toObservable", "rxjs-interop", "signals", "interoperability", "DestroyRef", "effect"]
relatedTopics: ["memory-leaks", "reactive-patterns", "signals-intro", "signals-vs-observables"]
interviewQuestions:
  - id: "b10t7q1"
    level: "junior"
    question: "Що таке toSignal() і toObservable() і коли їх використовувати?"
    referenceAnswers:
      junior: "toSignal() конвертує Observable у Signal. toObservable() конвертує Signal у Observable. Використовуються для інтеграції RxJS і Signals у Angular додатку."
      mid: "toSignal(obs$) — конвертує Observable у Signal: автоматично підписується і unsubscribes через DestroyRef, повертає поточне значення як Signal для використання у template або computed. Вимагає injection context. toObservable(signal) — конвертує Signal у Observable: emit нові значення при зміні signal. Корисно коли потрібно використати operators до сигналу або інтегрувати з existing Observable pipeline."
      senior: "toSignal(obs$, options): 1) initialValue — значення до першого emit Observable (інакше undefined). 2) requireSync: true — кидає error якщо Observable не emit синхронно (для завжди-sync sources). 3) manualCleanup: true — не автоматично unsubscribe (для root-level). 4) rejectErrors: false — за замовчуванням re-throws Observable errors у signal read context. Під капотом: `effect()` що підписується на Observable і записує у signal через WritableSignal. toObservable(sig) — використовує effect() що emit у ReplaySubject(1) при зміні signal. Contention: toObservable emit асинхронно (через scheduler), не синхронно — важлива деталь для tests."
      staff: "Interop bridge — архітектурна межа між двома реактивними парадигмами. toSignal: 1) Injection context requirement — inject(DestroyRef) при creation. 2) manualCleanup для root services або guards де немає component lifecycle. 3) Error handling: якщо Observable помиляється — signal.update не викликається, effect внутрішньо реєструє error. З rejectErrors: false — помилка silently ignored (signal зберігає попереднє значення). З rejectErrors: true (default) — помилка rethrown у signal read time. 4) httpResource() у Angular 19+ — вищий рівень абстракції що замінює toSignal(http$) pattern для HTTP. toObservable: 1) async delivery через microtask queue — не synchronous. 2) distinct: не re-emits якщо value не змінилась (=== comparison). 3) Composability: можна pipe() operators до toObservable result."
    commonMistakes:
      - "toSignal() поза injection context — runtime error"
      - "Очікують synchronous emission від toObservable() — воно асинхронне"
      - "Не вказують initialValue і отримують undefined у template"
    relatedQuestions: ["b10t7q2", "b10t7q3"]
  - id: "b10t7q2"
    level: "mid"
    question: "Як toSignal() обробляє помилки Observable? Що таке rejectErrors опція?"
    referenceAnswers:
      junior: "Якщо Observable помиляється, toSignal() теж кине помилку."
      mid: "За замовчуванням toSignal() з rejectErrors: true (implicit) — якщо Observable emits error, ця помилка rethrown при наступному читанні signal. З rejectErrors: false — помилка ігнорується, signal залишається з попереднім значенням. Для HTTP запитів краще обробити catchError до toSignal щоб signal мав typed error state, а не просто кидав помилки при читанні."
      senior: "Error handling у toSignal: Observable error → внутрішній effect ловить → зберігає у private error field → при signal() read — rethrows. Це scheme 'deferred throw': помилка відбулась в Observable, але стає видима тільки при читанні сигналу — може бути неочікуваним для debugging. Кращий pattern: обробити помилку до toSignal через typed state або Result type: `toSignal(obs$.pipe(catchError(err => of({ error: err }))), { initialValue: { data: null, error: null } })`. З rejectErrors: false + catch в Observable: signal ніколи не throw. Тест: signal що кидає при читанні у template — Angular ErrorHandler catch це і може показати невиразне UI."
      staff: "Архітектурний вибір error handling у signal boundary: 1) Result pattern: `type Result<T> = { data: T; error: string | null }` — signal ніколи не throw. 2) rejectErrors: false + окремий error$ Observable — для UI де потрібна explicit error display. 3) Глобальний ErrorHandler — якщо signal throw, Angular ErrorHandler catches і може показати fallback UI. 4) httpResource() API (Angular 19+) вирішує це eleganтніше: resource.status(), resource.error(), resource.value() — explicit state без exceptions. 5) Testing: тест що signal правильно пропагує помилки важко — мутати Observable і verify signal state. 6) Observable error semantics vs Signal error semantics: Observable помилка = dead stream. Signal помилка = exception at read time. Не одне й те саме!"
    commonMistakes:
      - "Не знають про deferred throw semantics — помилка невидима до читання сигналу"
      - "rejectErrors: false без catchError — помилки ігноруються silently"
      - "Не використовують Result pattern — throw у template = поганий UX"
    relatedQuestions: ["b10t7q1", "b10t7q3"]
  - id: "b10t7q3"
    level: "senior"
    question: "Коли використовувати toSignal vs async pipe? Які trade-offs?"
    referenceAnswers:
      junior: "toSignal() конвертує Observable у Signal і можна використовувати без async pipe у template. async pipe — старіший підхід."
      mid: "toSignal(): signal-based template (без | async), можна у computed(), може бути читано поза template. async pipe: template-only, кожне використання — окрема підписка (без shareReplay дублює HTTP), хороший для OnPush без Signal. Перевага toSignal: reusable у computed(), effect(), і template. Перевага async pipe: lazy — підписка тільки якщо рендериться у template."
      senior: "toSignal vs async pipe trade-offs: 1) Subscription timing: toSignal підписується одразу при creation (eager). async pipe — при render. 2) Multi-use: toSignal() значення може використовуватись у computed, effect, і template — одна підписка. async pipe у template — кожен pipe = нова підписка (якщо немає shareReplay). 3) Error handling: async pipe — помилка propagate через ChangeDetector до ErrorHandler. toSignal — deferred throw. 4) Nullable: async pipe може бути undefined до emit. toSignal initialValue обов'язковий. 5) Zoneless: toSignal автоматично triggerу CD через signal механізм. async pipe теж, але через markForCheck. Обидва Zone-free friendly. 6) Lifecycle: toSignal cleanup через DestroyRef. async pipe — через OnDestroy. 7) Recommendation Angular 17+: toSignal для Observable що читаються у template і/або computed. async pipe для legacy або template-only usage."
      staff: "Стратегія вибору: 1) toSignal — якщо Observable результат потрібен у computed(), effect(), або кількох місцях template без shareReplay. 2) async pipe — якщо Observable використовується тільки у template і є shareReplay або один subscriber. 3) httpResource() (Angular 19+) — для HTTP observables замість обох: вбудована Loading/Error/Value state. 4) Performance: toSignal з одним value розрахунком на кілька computed — ефективніше ніж async pipe в N місцях. 5) Library components: якщо компонент є library — async pipe safer (не вимагає injection context від users). 6) Migration: legacy components з async pipe → поступово toSignal для нових features, не force migration. 7) Zone.js removal: async pipe і toSignal обидва Zone-free, але toSignal + computed + Signal binding — найефективніший CD стек."
    commonMistakes:
      - "Думають async pipe і toSignal однакові — є важливі subscription timing і error semantics різниці"
      - "toSignal без initialValue — undefined у template до першого emit"
      - "Multiple async pipes без shareReplay — multiple HTTP requests"
    relatedQuestions: ["b10t7q2", "b10t7q4"]
  - id: "b10t7q4"
    level: "mid"
    question: "Як toObservable() конвертує Signal у Observable і коли це корисно?"
    referenceAnswers:
      junior: "toObservable() створює Observable що emit нові значення коли сигнал змінюється."
      mid: "toObservable(signal) emit нове значення кожного разу коли signal змінюється. Корисно: 1) Використати RxJS operators для сигналу (debounce, switchMap). 2) Інтегрувати Signal у existing Observable pipeline. 3) Коли потрібна subscription semantics (unsubscribe, composition). Emits асинхронно через microtask scheduler — не синхронно."
      senior: "toObservable() під капотом: `effect(() => { const value = signal(); replaySubject.next(value); })` — effect відстежує signal dependency, при зміні emit у ReplaySubject(1). Це означає: 1) Async delivery — effect scheduled через Angular scheduler (microtask), не синхронний. 2) Initial value — перший emit відбувається після current microtask queue, не одразу при subscribe. 3) Distinct — якщо signal value не змінилась (===) — no emit. 4) Multiple read: якщо читаєш toObservable вперше пізніше — отримаєш поточне значення (ReplaySubject(1) semantics). Корисно для: computed signals що потребують debounce (toObservable + debounceTime + switchMap), або сигналів що потрібно combine з HTTP streams."
      staff: "toObservable patterns і anti-patterns: 1) Anti-pattern: `effect(() => { const v = sig(); obs$.pipe(switchMap(() => http.get(v))).subscribe(); })` — subscribe всередині effect без cleanup. 2) Правильний pattern: `toObservable(searchSig).pipe(debounceTime(300), switchMap(q => http.get(url, q)))`. 3) Signal chain → Observable bridge: multiple computed → toObservable → merge → результат назад у signal через toSignal. 4) Testing toObservable: async — потрібен fakeAsync або TestScheduler з flush. 5) Glitch-free concern: Signals гарантують glitch-free updates — toObservable може мати intermediate states у Observable pipeline. 6) RxJS/Signal boundary design: мінімізувати cross-boundary conversions. Якщо є чіткий boundary (HTTP boundary, router boundary) — там конвертація. Не конвертувати туди-назад кілька разів у chain."
    commonMistakes:
      - "Очікують synchronous emission від toObservable — воно async (microtask)"
      - "subscribe всередині effect без takeUntilDestroyed — memory leak"
      - "Надмірні конверсії Signal→Observable→Signal у chain"
    relatedQuestions: ["b10t7q1", "b10t7q3"]
  - id: "b10t7q5"
    level: "staff"
    question: "Як спроєктувати boundary між RxJS і Signals у великому Angular додатку?"
    referenceAnswers:
      junior: "Можна конвертувати Observable у Signal за допомогою toSignal там де потрібно відображати у template."
      mid: "Загальний підхід: RxJS для async operations (HTTP, WebSocket, complex event streams), Signals для synchronous UI state і derived computations. toSignal() на boundary де Observable входить у component state. toObservable() для передачі Signal change у RxJS pipeline."
      senior: "Boundary design: 1) HTTP layer — Observable (HttpClient). toSignal() при вході в component або store. 2) Router events — Observable. toSignal() для current URL signal. 3) WebSocket — Observable. toSignal() для current state або keep as Observable для stream processing. 4) User input events — FormControl.valueChanges Observable для complex processing, signal() для simple binding. 5) Component state — signals, computed. 6) Cross-component communication — Subject/BehaviorSubject або EventEmitter для events, shared signal для state. 7) Feature store — signals для state, RxJS для effects (HTTP, navigation). Правило: Observable для async multi-value streams з complex operators. Signal для synchronous state і derived values."
      staff: "Enterprise boundary architecture: 1) 'Signal Islands' principle: core state у signals, async boundaries через toSignal/toObservable. 2) HTTP boundary: `ApiService.getUser()` повертає Observable, Feature Store конвертує через toSignal або httpResource. 3) Effect layer: `effect(() => { const q = searchQuery(); if (q.length > 2) { this.http.get(url, q).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(results => this.searchResults.set(results)); } })` — але це anti-pattern! Краще: toObservable(q).pipe(switchMap(http)) → toSignal. 4) Glitch-free guarantee: Signals computation graph — без glitches. Observable pipe — може have intermediate states. При complex derived state — prefer pure Signal graph без Observable hop. 5) Migration strategy: нові features — signals first. Legacy — async pipe залишається. Поступова міграція де є ROI. 6) Team convention: document clear boundary line. ESLint rule: заборонити `subscribe()` всередині `effect()`. 7) Testing: signal-based stores easier to test synchronously. Observable-based — TestScheduler або fakeAsync."
    commonMistakes:
      - "subscribe() всередині effect() — anti-pattern, memory leak potential"
      - "Конвертують все у signals або все у observables — замість правильного boundary"
      - "Не враховують glitch-free guarantee при Signal→Observable→Signal hop"
    relatedQuestions: ["b10t7q3", "b10t7q4"]
---

## Core Concept

**English definition:** RxJS/Signal interoperability in Angular provides two bridge functions: `toSignal()` converts an Observable into a Signal (with automatic subscription management), and `toObservable()` converts a Signal into an Observable (enabling RxJS operator composition on signal changes). Both are part of `@angular/core/rxjs-interop` package introduced in Angular 16.

**Пояснення:** Angular має два реактивних примітиви: RxJS Observable (для async streams) і Signals (для synchronous state). Вони вирішують різні проблеми і часто потрібно їх поєднати. toSignal() — bridge "Observable → Signal": конвертує async stream у synchronous Signal value для ефективного template binding і computed(). toObservable() — bridge "Signal → Observable": дозволяє застосовувати RxJS operators до змін сигналу.

**Яку проблему вирішує:**
- **Subscription management:** toSignal автоматично unsubscribes через DestroyRef — немає ручного takeUntilDestroyed
- **Template integration:** Signal у template — без `async` pipe, без nullable issues
- **Composition:** toObservable дозволяє debounce, switchMap до signal changes
- **Type safety:** toSignal result type точно знає тип (Observable<T> → Signal<T | initialValue type>)

**Як працює під капотом:**

```typescript
// toSignal() simplified internal:
function toSignal<T>(source: Observable<T>, options?: ToSignalOptions<T>): Signal<T> {
  const destroyRef = options?.injector
    ? options.injector.get(DestroyRef)
    : inject(DestroyRef); // ← requires injection context

  const state = signal<ResultState<T>>({ kind: 'initializing' });

  const sub = source.subscribe({
    next: value => state.set({ kind: 'value', value }),
    error: err => state.set({ kind: 'error', error: err }),
  });

  destroyRef.onDestroy(() => sub.unsubscribe());

  return computed(() => {
    const s = state();
    if (s.kind === 'error' && options?.rejectErrors !== false) throw s.error;
    return s.kind === 'value' ? s.value : options?.initialValue;
  });
}

// toObservable() simplified internal:
function toObservable<T>(source: Signal<T>): Observable<T> {
  const subject = new ReplaySubject<T>(1);
  // effect() tracks signal reads
  const effectRef = effect(() => {
    subject.next(source()); // reads signal — registers dependency
  });
  // Cleanup effect when all observers unsubscribe
  return subject.pipe(finalize(() => effectRef.destroy()));
}
```

**Trade-offs та обмеження:**
- toSignal вимагає injection context (або explicit injector)
- toObservable emit асинхронно — не підходить якщо потрібна synchronous emission
- toSignal error semantics — deferred throw при читанні, не immediate
- Надмірні конверсії туди-назад (Signal→Observable→Signal) — overhead і potential glitches

**Версійність:**
- Angular 16 (developer preview): toSignal, toObservable у `@angular/core/rxjs-interop`
- Angular 16 stable: обидві функції стабільні
- Angular 17: refinements, покращені TypeScript types
- Angular 19: httpResource() як вищий рівень абстракції над toSignal(http$)
- Angular 21: поточна стабільна версія

## Deep Details

### Edge Cases

- **toSignal без initialValue:** Повертає `Signal<T | undefined>`. Перше значення до emit — undefined. TypeScript type включає undefined. Якщо template не обробляє — може бути NullReferenceError.
- **requireSync: true:** Якщо Observable не emit синхронно при subscribe — toSignal з requireSync: true кидає runtime error. Корисно для BehaviorSubject або `of(value)` як assertions.
- **toSignal в tests:** Тести що використовують toSignal потребують injection context: `TestBed.runInInjectionContext(() => mySignal = toSignal(obs$))`. Або через runInInjectionContext у TestBed.
- **toObservable і glitch:** Signals гарантують glitch-free — computed() ніколи не бачить intermediate inconsistent state. Але toObservable може emit intermediate values через ReplaySubject, потрапляючи у Observable pipeline де glitch-free не гарантовано.
- **manualCleanup: true:** toSignal не auto-unsubscribes. Корисно для root-level service де немає component lifecycle. Потрібно явно управляти lifecycle Observable.

### Junior vs Senior Understanding

**Junior** знає: "toSignal конвертує Observable у Signal, toObservable — навпаки. Треба injection context."

**Senior** розуміє глибину:

1. **Error deferred throw:** Observable emits error → toSignal зберігає error → при signal() read у computed або template — rethrows. Це може бути неочікуваним: помилка відбулась давно, але visible тільки зараз. Pattern: завжди catchError до toSignal для production code.

2. **Async nature toObservable:** effect() schedule через Angular scheduler (microtask), не sync. `const obs = toObservable(sig); sig.set('new'); obs.pipe(take(1)).subscribe(v => /* v is still old value */)`. Перший emit від toObservable відбудеться в наступному microtask.

3. **httpResource() як evolution:** Angular 19 httpResource() = toSignal + HTTP + loading/error state. `const users = httpResource('/api/users')` → `users.value()`, `users.status()`, `users.error()` — сигнали. Замінює `toSignal(http.get(...), { initialValue: [] })` pattern.

4. **Injection context options:** `toSignal(obs$, { injector: myInjector })` — якщо немає injection context, передати explicit injector. Корисно у utility functions або non-component contexts.

### Deprecation & Migration Path

- `toSignal` та `toObservable` є stable у Angular 16+, немає deprecated версій.
- Старий патерн: `const data$ = this.http.get(...); data$ | async` у template — мігрувати до: `data = toSignal(this.http.get(...), { initialValue: null })` і `{{ data() }}` у template.
- async pipe — не deprecated, але toSignal рекомендований для signal-first компонентів.
- httpResource() (Angular 19+) — рекомендація замість `toSignal(http.get(...))` для HTTP.

### Connections to Other Concepts

- **Memory Leaks (b10t2):** toSignal автоматично cleanup через DestroyRef — менше ручного управління.
- **Signals (b11t1):** toSignal/toObservable — bridge між двома reactive primitives.
- **Reactive Patterns (b10t4):** Complex RxJS patterns → toSignal для final UI signal.
- **Change Detection (b9t4):** Signal-based CD — toSignal result triggers fine-grained updates.

## Examples

### Basic Usage

```typescript
import { Component, inject, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { switchMap, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="searchControl" />

    <!-- ✅ Signal in template — no async pipe needed -->
    @if (isLoading()) {
      <span>Loading...</span>
    }
    @for (user of users(); track user.id) {
      <div>{{ user.name }}</div>
    }
    @if (error()) {
      <div class="error">{{ error() }}</div>
    }
  `,
})
export class UserSearchComponent {
  private http = inject(HttpClient);
  searchControl = new FormControl('');

  // ✅ toObservable: convert signal to Observable for RxJS operators
  private query = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  // ✅ toSignal: convert complex Observable pipeline to Signal
  private searchResult = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length > 1
        ? this.http.get<{users: User[], loading: boolean}>(`/api/users?q=${q}`).pipe(
            catchError(() => of({ users: [], loading: false }))
          )
        : of({ users: [], loading: false })
      ),
    ),
    { initialValue: { users: [], loading: false } },
  );

  // ✅ computed() from toSignal result
  users = computed(() => this.searchResult().users);
  isLoading = computed(() => this.searchResult().loading);
  error = computed(() => null as string | null); // simplified
}
```

### Production Scenario

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, merge } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';

interface ProductState {
  items: Product[];
  status: 'idle' | 'loading' | 'error' | 'success';
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductStore {
  private http = inject(HttpClient);

  // ✅ Imperative triggers as Subjects
  private loadTrigger$ = new Subject<string>(); // category
  private refreshTrigger$ = new Subject<void>();

  // ✅ Observable pipeline for complex async logic
  private state$ = merge(
    this.loadTrigger$.pipe(
      switchMap(category =>
        this.http.get<Product[]>(`/api/products?cat=${category}`).pipe(
          map(items => ({ items, status: 'success' as const, error: null })),
          startWith({ items: [], status: 'loading' as const, error: null }),
          catchError(err => of({
            items: [],
            status: 'error' as const,
            error: err.message,
          })),
        )
      ),
    ),
  );

  // ✅ toSignal: bridge to Signal world
  private _state = toSignal(this.state$, {
    initialValue: { items: [], status: 'idle' as const, error: null },
  });

  // ✅ Derived computed signals
  readonly products = computed(() => this._state().items);
  readonly isLoading = computed(() => this._state().status === 'loading');
  readonly error = computed(() => this._state().error);
  readonly hasProducts = computed(() => this._state().items.length > 0);

  // ✅ Commands
  loadCategory(category: string): void {
    this.loadTrigger$.next(category);
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: toSignal outside injection context
export function createUserSignal(userId: string): Signal<User | undefined> {
  const http = inject(HttpClient); // ✅ inject works here if called in injection context
  // But if this function is called in a setTimeout or callback:
  return toSignal(http.get<User>(`/api/users/${userId}`));
  // ❌ Runtime error: inject() called outside injection context
}

// ❌ WRONG: subscribe inside effect — memory leak
@Component({ selector: 'app-bad', template: '' })
export class BadComponent {
  private searchQuery = signal('');

  constructor() {
    effect(() => {
      const q = this.searchQuery();
      // ❌ subscribe inside effect — no automatic cleanup!
      this.http.get(`/api/search?q=${q}`).subscribe(
        results => this.results.set(results)
      );
    });
  }
}

// ✅ CORRECT: toObservable + switchMap → toSignal
@Component({ selector: 'app-good', template: '' })
export class GoodComponent {
  private http = inject(HttpClient);
  searchQuery = signal('');

  // ✅ Proper pipeline with automatic cleanup
  results = toSignal(
    toObservable(this.searchQuery).pipe(
      debounceTime(300),
      switchMap(q => this.http.get<Result[]>(`/api/search?q=${q}`).pipe(
        catchError(() => of([]))
      )),
    ),
    { initialValue: [] },
  );
}

// ❌ WRONG: toSignal without initialValue — undefined type issue
@Component({ selector: 'app-no-init', template: '{{ user()?.name }}' })
export class NoInitComponent {
  private http = inject(HttpClient);
  // ❌ type is Signal<User | undefined> — template needs ?. everywhere
  user = toSignal(this.http.get<User>('/api/user'));
}

// ✅ CORRECT: with initialValue
@Component({ selector: 'app-with-init', template: '{{ user()?.name }}' })
export class WithInitComponent {
  private http = inject(HttpClient);
  user = toSignal(
    this.http.get<User>('/api/user').pipe(catchError(() => of(null))),
    { initialValue: null },
  );
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `subscribe()` всередині `effect()` | Memory leak — subscription не cleanup-ається з effect | `toObservable(sig).pipe(switchMap(...))` → `toSignal()` |
| `toSignal()` без `initialValue` | Signal type включає undefined, template потребує ?. скрізь | `toSignal(obs$, { initialValue: defaultValue })` |
| Не обробляти помилку перед `toSignal()` | Deferred throw при читанні сигналу — поганий DX і UX | `obs$.pipe(catchError(() => of(fallback)))` перед toSignal |
| `toSignal` → `toObservable` → `toSignal` ланцюжок | Overhead, async delays, порушення glitch-free guarantee | Залишитись у Signal або Observable world, мінімізувати crosses |
| `toSignal()` поза injection context | Runtime error | `TestBed.runInInjectionContext()` у тестах; передати `{ injector }` в utility functions |

## Interview Block

### [L1 — Warm-up] Що таке toSignal() і toObservable() і коли їх використовувати?
**Signal being tested:** Розуміння bridging між двома reactivity моделями і базових use cases
**What the interviewer expects:** Напрямок конверсії, injection context requirement, initialValue, async nature toObservable
**How to probe deeper:** "Чому toSignal вимагає injection context і як це обійти?"
**Reference answer:** toSignal(obs$) — Observable→Signal bridge: підписується та auto-unsubscribes через DestroyRef. Повертає Signal що читається у template без async pipe. Вимагає injection context для inject(DestroyRef). toObservable(sig) — Signal→Observable bridge: emit нове значення при кожній зміні signal. Async delivery. Корисно для debounce/switchMap на signal changes. При injection context проблемі: `{ injector: inject(Injector) }` option або `TestBed.runInInjectionContext()`.
**Common mistakes:** Очікують sync від toObservable; не знають injection context requirement; не вказують initialValue

### [L2 — Mid] Як toSignal() обробляє Observable помилки? rejectErrors?
**Signal being tested:** Розуміння error semantics boundary між Observable і Signal
**What the interviewer expects:** Deferred throw concept, rejectErrors option, рекомендація catchError до toSignal
**How to probe deeper:** "Якщо Observable кидає помилку і ніхто не читає сигнал — що відбувається?"
**Reference answer:** Observable error → зберігається у внутрішньому state. При читанні signal() — rethrows (deferred throw). Якщо ніхто не читає — помилка silently buffered до першого read. З rejectErrors: false — помилки ігноруються, signal залишається з попереднім значенням. Кращий pattern для production: `obs$.pipe(catchError(err => of({ error: err.message, data: null })))` перед toSignal — typed error state, ніколи не throw.
**Common mistakes:** Не знають про deferred throw; думають rejectErrors: false означає error logging; не catchError до toSignal

### [L3 — Senior] Коли toSignal vs async pipe? Trade-offs?
**Signal being tested:** Архітектурне розуміння двох subscription підходів, performance implications
**What the interviewer expects:** Eager vs lazy subscription, multi-use advantage toSignal, error handling різниця, nullable handling, Zoneless compatibility
**How to probe deeper:** "Як multiple async pipes на одному Observable впливають на HTTP запити?"
**Reference answer:** toSignal — eager subscribe при creation, одна підписка для кількох uses (computed, effect, template). async pipe — lazy (при render), кожен pipe = нова підписка (multiple HTTP без shareReplay). toSignal error: deferred throw. async pipe error: propagate через CD. toSignal initialValue required для non-undefined type. Zoneless: обидва compatible, але Signal-based CD ефективніший. Recommendation: toSignal для signal-first компонентів, async pipe для legacy.
**Common mistakes:** Multiple async pipe без shareReplay; думають toSignal і async pipe identical; не знають про eager subscription toSignal

### [L4 — Staff/Principal] Як спроєктувати boundary між RxJS і Signals?
**Signal being tested:** Системне мислення — де Observable, де Signal, migration strategy, team conventions
**What the interviewer expects:** 'Signal Islands' principle, HTTP boundary, Effect layer (без subscribe в effect), glitch-free consideration, testing strategy, migration
**How to probe deeper:** "Як запобігти subscribe() всередині effect() у всій команді?"
**Reference answer:** Signal Islands: core state у signals, async boundaries через toSignal. HTTP layer — Observable (HttpClient) → toSignal або httpResource() при вході у feature state. Effect layer: effect() відстежує signals, використовує toObservable+switchMap замість subscribe у effect. ESLint rule: заборонити subscribe у effect(). Glitch-free: не hop Signal→Observable→Signal без потреби. Testing: signals sync testable, Observable потребує fakeAsync/TestScheduler. Migration: нові features — signals first, legacy — async pipe залишається.
**Common mistakes:** subscribe в effect; конвертують все у одну парадигму; не враховують glitch-free

## Summary

### Key Points
- `toSignal()` та `toObservable()` — bidirectional bridge між RxJS і Signals у `@angular/core/rxjs-interop`
- toSignal вимагає injection context (або explicit injector option)
- toSignal error semantics: deferred throw при читанні — завжди catchError до toSignal у production
- toObservable — async delivery (microtask), не synchronous — важливо для tests
- subscribe() у effect() — anti-pattern: використовувати toObservable().pipe(switchMap())→toSignal()
- httpResource() (Angular 19+) — вищий рівень абстракції над toSignal(http$)
- 'Signal Islands': state у signals, async operations у Observable → toSignal на boundary

### Elevator Pitch (2 minutes)
"RxJS/Signal interop в Angular вирішує питання як поєднати дві реактивні системи. toSignal(obs$) конвертує Observable у Signal — auto-subscribe, auto-cleanup через DestroyRef, без async pipe. toObservable(sig) — навпаки, для застосування RxJS operators до signal changes. Архітектурний принцип: 'Signal Islands' — state у signals, async у Observable, toSignal на HTTP boundary. Підводні камені: toSignal вимагає injection context, error semantics — deferred throw (завжди catchError до toSignal), toObservable — async delivery. subscribe() у effect() — anti-pattern, правильно: toObservable().pipe(switchMap()) → toSignal(). Angular 19+: httpResource() замінює toSignal(http$) для HTTP state."
