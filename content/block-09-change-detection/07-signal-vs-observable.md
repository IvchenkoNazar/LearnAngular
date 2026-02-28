---
title: "Signal vs Observable — Decision Framework"
block: 9
topic: 7
slug: "signal-vs-observable"
difficulty: 4
sinceVersion: "16"
tags: ["signals", "Observable", "RxJS", "toSignal", "toObservable", "reactive-patterns", "decision-framework"]
relatedTopics: ["signals", "zoneless-angular", "rxjs-higher-order-operators", "rxjs-signal-interop"]
interviewQuestions:
  - id: "b9t7q1"
    level: "junior"
    question: "Коли використовувати Signal, а коли Observable у Angular?"
    referenceAnswers:
      junior: "Signals для synchronous state що відображається в template. Observable для async operations (HTTP, WebSocket) де важливі RxJS operators (debounceTime, switchMap)."
      mid: "Signal: 1) Synchronous state (counter, filter, selected item), 2) Template-bound values де потрібна reactive оновлення, 3) Derived state (computed()), 4) Local component state. Observable: 1) Async operations (HTTP requests, WebSocket), 2) Коли потрібні RxJS operators (debounceTime, switchMap, combineLatest), 3) Event streams що потребують transformation, 4) Multi-subscriber scenarios з shareReplay. Вони не конкуренти — complementary: toSignal() і toObservable() дозволяють переходити між ними."
      senior: "Правило вибору: Signals для STATE, Observables для EVENTS/FLOWS. State — поточне значення (user session, cart items, filter state). Events/Flows — послідовність значень над часом (keystrokes, HTTP responses, WebSocket messages). Technical difference: Signal — synchronous pull (current value always available); Observable — lazy push (values delivered over time). Completion semantics: Observable може complete, Signal — ніколи. Error handling: Observable має built-in error channel; Signal — немає (errors через попередній шар). Combination: toSignal(httpCall$) — HTTP залишається Observable, в template читається як Signal; toObservable(filter) — filter signal як Observable для HTTP trigger через switchMap."
      staff: "Decision framework для enterprise: 1) HTTP/async I/O → завжди Observable (lazy, cancellable, RxJS operators), wrap з toSignal() для template consumption. 2) UI state (selected tab, modal visibility, form filters) → Signal (synchronous, simple, no subscription management). 3) Derived state → computed() Signal (memo, reactive graph, laziness). 4) Complex event orchestration (multi-step async flows, retry, debounce) → Observable pipeline. 5) Server state (remote data) → Observable loading + toSignal() для display. 6) Real-time updates (WebSocket) → Observable stream + toSignal() buffer або Subject-based batching. Philosophical alignment: React Query / TanStack Query pattern — async data fetching stays async (Observable), UI state stays local (Signal) — Angular moving to same split. Team guidance: если ти пишеш .subscribe() без async pipe або toSignal() — може бути code smell."
    commonMistakes:
      - "Замінюють всі Observable на signals без розуміння що вони fundamentally different"
      - "Використовують signal для async data: signal(httpCall$) — stores Observable object, not response"
    relatedQuestions: ["b9t7q2", "b9t7q3"]
  - id: "b9t7q2"
    level: "mid"
    question: "Як toSignal() і toObservable() bridging functions працюють і коли їх використовувати?"
    referenceAnswers:
      junior: "toSignal() конвертує Observable до Signal для читання в template без async pipe. toObservable() конвертує Signal до Observable для використання з RxJS operators."
      mid: "toSignal(obs$, options): підписується на Observable, повертає Signal що оновлюється при кожному emit. initialValue option для значення до першого emit. requireSync: true якщо Observable guaranteed synchronous. Відписується автоматично при destroy компонента (або injector). toObservable(signal): повертає Observable що emit при signal change через effect(). Use when: toSignal — коли маєш Observable але хочеш reactive template без async pipe. toObservable — коли маєш Signal але хочеш switchMap/debounce/pipe operators."
      senior: "toSignal() technical: inject(EffectRef), creates internal subscription in Injector context. initialValue types: if not provided, initial value is undefined — Signal<T | undefined>; якщо initialValue надано — Signal<T>; якщо requireSync — Signal<T> (throws if Observable doesn't sync emit). toSignal() і error handling: якщо Observable errors, signal stores the error and rethrows on next read. rejectErrors: false option для suppress. toObservable() technical: uses effect() internally — emits on next microtask після signal change (not synchronous). Timing nuance: toObservable(sig) не emit synchronously — Observable emits asynchronously через effect scheduler. Use cases: `const searchResults = toSignal(toObservable(searchFilter).pipe(debounceTime(300), switchMap(filter => http.get(url, {params: filter}))), { initialValue: [] })` — reactive HTTP search."
      staff: "toSignal/toObservable architectural patterns: 1) HTTP resource pattern: data = toSignal(http.get<T>(url).pipe(shareReplay(1)), { initialValue: null }) — HTTP stays Observable, template access as Signal. 2) Reactive form filter: results = toSignal(toObservable(this.filter).pipe(debounceTime(300), switchMap(f => service.search(f))), { initialValue: [] }). 3) Angular 18+ resource() API: higher-level abstraction over toSignal + HTTP — resource({ request: () => id(), loader: ({request}) => inject(HttpClient).get('/api/' + request) }). resource() handles loading state, error state, refresh — built-in. 4) Manual subscription anti-pattern: якщо inject(DestroyRef) не використовується або takeUntilDestroyed() — memory leak risk. toSignal() handles this automatically. 5) Injection context requirement: toSignal і toObservable повинні бути викликані в injection context (constructor, factory) — поза injection context → throw."
    commonMistakes:
      - "Викликають toSignal() поза injection context (в method, setTimeout) — кидає помилку"
      - "Не передають initialValue і отримують Signal<T | undefined> — undefined check в template"
    relatedQuestions: ["b9t7q1", "b9t7q3"]
  - id: "b9t7q3"
    level: "senior"
    question: "Які конкретні RxJS patterns неможливо або важко замінити signals?"
    referenceAnswers:
      junior: "switchMap для HTTP requests, debounceTime для search input, retry для HTTP errors — ці patterns дуже важко реалізувати тільки через signals."
      mid: "Observable-only patterns: 1) Cancellation (switchMap): HTTP request скасування при новому запиті — signals не мають built-in cancel. 2) Time-based operators (debounceTime, throttleTime, delay): signals synchronous. 3) Multi-source combination (combineLatest, zip, race): signals мають computed() але без time semantics. 4) Multicasting (shareReplay, share): один Observable → N subscribers — signals не мають hot/cold distinction. 5) Error channel: Observable.catch — signals не мають error semantics."
      senior: "Детальні cases де Observable wins: 1) switchMap для HTTP: searchTerm$.pipe(debounceTime(300), distinctUntilChanged(), switchMap(term => http.get(url, {params: {term}})))) — скасовує попередній request при новому searchTerm. З signals: toObservable(searchTerm).pipe(debounceTime(300), switchMap(...)) — bridge через toObservable. 2) WebSocket streams: ws.messages$ де кожне повідомлення є новим event — Observable semantics (stream over time). 3) Retry logic: retry(3) — Observable built-in. Signals можна bridge: effect(() => { if (retrySignal()) { makeRequest(); } }). 4) Race conditions: race(request1$, timer(timeout$)) — Observable natural. 5) Complex merge scenarios: merge(wsMessages$, httpPolling$, userEvents$) — all as one stream — Observable natural."
      staff: "Signals і Observable правила для senior/staff: 1) Async coordination (switchMap, mergeMap, concatMap) → Observable — це killer feature RxJS. 2) Error recovery (catchError, retry, retryWhen) → Observable — error channel built-in. 3) Time-based logic → Observable (debounce, throttle, delay, timeout). 4) Stream multiplexing (shareReplay, publish) → Observable. 5) UI state derivation → Signals (computed, synchronous, no subscription). 6) Combine async + sync: `const result = toSignal(obs$.pipe(withLatestFrom(toObservable(uiSignal))), ...)` — bridge де потрібно. 7) Angular resource() API (Angular 18+): handles loading/error/refresh states — higher-level abstraction for server state. 8) Architecture rule: Observable for async data orchestration, Signal for UI state management — clear separation. 9) No Observable.subscribe() in components if avoidable — async pipe, toSignal(), resource() — lifecycle automatic."
    commonMistakes:
      - "Замінюють switchMap на effect() + signal — немає built-in cancellation попереднього request"
      - "Думають combineLatest можна замінити computed() — computed не має temporal/async semantics"
    relatedQuestions: ["b9t7q2", "b9t7q1"]
  - id: "b9t7q4"
    level: "staff"
    question: "Як Angular resource() API змінює підхід до server state і де він вписується між Signals і Observables?"
    referenceAnswers:
      junior: "resource() (Angular 18+) — це higher-level API для HTTP data fetching що автоматично обробляє loading, error і refresh стани."
      mid: "resource() (Angular 18+): `resource({ request: () => params(), loader: ({request, abortSignal}) => firstValueFrom(http.get(url)) })`. Повертає ResourceRef з сигналами: value(), status(), error(). Автоматично re-fetches якщо request() signal зміниться. Підтримує abort через AbortSignal. rxResource() для Observable-based loaders (Angular 18+). Handles loading/idle/error/resolved states через ResourceStatus enum."
      senior: "resource() technical details: request — Signal-based parameter factory, loader — async функція з request і abortSignal. При зміні request signal → попередній request aborted (через abortSignal) → новий loader виклик. ResourceRef.reload() для manual refresh. ResourceRef.update() для optimistic updates. rxResource() for Observable loaders: автоматично switchMap semantics. Порівняння: toSignal(http.get().pipe(shareReplay(1))) — одноразовий fetch, no refresh. resource() — reactive fetch з automatic cancellation і retry support. resource() vs toSignal + switchMap: resource() є higher-level з built-in status tracking; toSignal+switchMap — lower-level, більш flexible."
      staff: "resource() і архітектура server state: 1) resource() maps to TanStack Query / SWR patterns — server state management є окремою категорією від local UI state. 2) resource() handles: caching (value persists між re-requests), loading states (ResourceStatus.Loading, Resolved, Error, Reloading), optimistic updates (update()), refresh on demand (reload()). 3) Enterprise patterns: feature services можуть expose resource() refs замість Observable; components bind до .value(), .status(), .error() signals. 4) Composition: `readonly userData = resource({ request: () => this.userId(), loader: ... })` — reactive, cancellable, с loading state. 5) Error handling: resource().error() signal — error state as Signal. 6) Difference від NgRx: resource() для single-entity server state; NgRx для complex multi-entity normalized state. 7) Testing: resource().set() для mock values у tests. 8) Future: Angular team expanding resource() API (streaming, pagination, infinite scroll patterns). 9) Migration from toSignal+HTTP: incremental — convert one endpoint at a time to resource()."
    commonMistakes:
      - "Думають resource() замінює NgRx — вони вирішують різні проблеми (single entity vs normalized store)"
      - "Не обробляють ResourceStatus.Error state — шоу stale data без error indication"
    relatedQuestions: ["b9t7q3", "b9t4q4"]
---

## Core Concept

**English definition:** Signals and Observables are complementary reactivity primitives in Angular: Signals are synchronous, pull-based reactive values optimal for UI state and derived computations; Observables are async, push-based streams optimal for event handling, HTTP operations, and complex async coordination — with toSignal() and toObservable() bridging between them.

**Пояснення:** Сигнали і Observable — не конкуренти, а два інструменти для різних задач. Signal = "яке значення зараз?" (synchronous). Observable = "що відбулось/станеться?" (async stream). Вибір неправильного інструменту призводить до складного workaround-коду. Правильний вибір: Observable для async coordination, Signal для UI state.

**Яку проблему вирішує:** До появи signals: все було Observable — включно з local UI state. Це призводило до subscription boilerplate навіть для простих counter або toggle values. Signals вирішують: synchronous state без subscription management. Але Observable залишаються незамінними для async, cancellable, time-based операцій.

**Як працює під капотом:**

**Signal = pull-based reactive value:**
- Завжди має поточне значення (current value always available synchronously)
- Читання реєструє consumer
- `set()` notifies all registered consumers synchronously

**Observable = push-based event stream:**
- Lazy (nothing happens until subscribe)
- May emit 0..N values, then complete or error
- No "current value" concept (unless BehaviorSubject)
- Supports RxJS operators for transformation, time, cancellation

**Bridge:**
- `toSignal(obs$)`: subscribe to Observable, wrap in Signal — value available synchronously after first emit
- `toObservable(signal)`: wrap Signal in Observable via effect — emits asynchronously on change

**Trade-offs та обмеження:**
- Signal: немає time operators (debounce, delay), немає cancellation, немає error channel
- Observable: subscription management, no "current value" without BehaviorSubject
- Mixing: careful with timing (toObservable emits asynchronously, not synchronously)

**Версійність:**
- Angular 16: signal(), computed(), effect() — developer preview
- Angular 16: toSignal(), toObservable() — first versions
- Angular 17-18: stable, improved type inference
- Angular 18: resource() і rxResource() APIs
- Angular 21: resource() expanded, signal-based component API default

## Deep Details

### Edge Cases

**toObservable() timing:** `toObservable(mySignal)` не emits synchronously при signal change. Воно emits у наступному microtask (через effect scheduler). Це може спричинити timing issues якщо очікується synchronous Observable.

**toSignal() і BehaviorSubject:** `toSignal(behaviorSubject$)` з `{requireSync: true}` — BehaviorSubject emits synchronously при subscribe → Signal initialized synchronously.

**Multiple toSignal() на одному Observable:** Кожен toSignal() — окрема subscription. Для холодних Observables (HTTP) — окремі HTTP requests. Потрібен shareReplay(1).

**resource() і Strict Mode:** resource() strict з TypeScript — loader повертає Promise<T>, request повертає сигнал параметрів.

**Signal у ngOnDestroy context:** toSignal() і toObservable() потрібні injector — якщо component destroyed перед emit, subscription автоматично cleaned up.

### Junior vs Senior Understanding

**Junior розуміє:** Signal для local state, Observable для HTTP. toSignal() для bridge.

**Senior розуміє:**
- Конкретні RxJS operators що немає аналогу в signals (switchMap cancel, debounceTime, retry)
- toSignal() і toObservable() timing nuances
- initialValue і requireSync для toSignal()
- Reactive HTTP search pattern (toObservable → debounce → switchMap → toSignal)

**Staff розуміє:**
- resource() і rxResource() APIs і коли їх використовувати
- Angular 21 architecture: server state (resource()) vs UI state (signal) vs async flow (observable)
- Decision framework для весь team
- Migration path від Observable-heavy до mixed architecture

### Deprecation & Migration Path

Обидва API підтримуються. Поступова migration:

```typescript
// Before: everything Observable
class OldService {
  private state$ = new BehaviorSubject<AppState>(initial);
  readonly users$ = this.http.get<User[]>('/api/users');
  update(state: AppState) { this.state$.next(state); }
}

// After: signals for UI state, Observable for async
class NewService {
  readonly uiState = signal<UiState>(initial);
  readonly users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });
  // OR:
  readonly usersResource = resource({
    loader: () => firstValueFrom(this.http.get<User[]>('/api/users'))
  });
}
```

### Connections to Other Concepts

- **Signals (b9t4):** Signal primitives
- **Zoneless (b9t5):** Signals + toSignal() = primary CD mechanism
- **RxJS Signal Interop (b10t7):** Deep dive into toSignal/toObservable
- **RxJS Higher-Order Operators (b10t1):** switchMap та інші — чому Observable незамінний

## Examples

### Basic Usage

```typescript
// Decision examples — when to use which
import { Component, signal, computed, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { debounceTime, switchMap, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <input [value]="searchQuery()" (input)="searchQuery.set($event.target.value)" />
    <p>Results: {{ resultCount() }}</p>
    @if (isLoading()) { <mat-spinner /> }
    @for (result of searchResults(); track result.id) {
      <app-result [data]="result" />
    }
  `,
})
export class SearchComponent {
  private http = inject(HttpClient);

  // Signal: synchronous UI state — simple string value
  readonly searchQuery = signal('');

  // Bridge: Signal → Observable for RxJS operators (debounce, switchMap)
  readonly searchResults = toSignal(
    toObservable(this.searchQuery).pipe(
      debounceTime(300),          // Time-based — impossible with signals alone
      distinctUntilChanged(),
      switchMap(query =>          // Cancellable — impossible with signals alone
        query.length > 2
          ? this.http.get<SearchResult[]>('/api/search', { params: { q: query } })
          : of([])
      ),
    ),
    { initialValue: [] as SearchResult[] }
  );

  // Derived signal — from another signal, synchronous
  readonly resultCount = computed(() => this.searchResults().length);
  readonly isLoading = signal(false);
}

interface SearchResult { id: number; title: string; }
```

### Production Scenario

```typescript
// resource() API for server state management (Angular 18+)
import { Component, signal, computed, inject, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ResourceStatus } from '@angular/core';

interface Order { id: number; items: OrderItem[]; total: number; status: string; }
interface OrderItem { productId: number; quantity: number; price: number; }

@Component({
  selector: 'app-order-detail',
  standalone: true,
  template: `
    @switch (ordersResource.status()) {
      @case (ResourceStatus.Loading) {
        <mat-spinner />
      }
      @case (ResourceStatus.Error) {
        <p class="error">Error: {{ ordersResource.error()?.message }}</p>
        <button (click)="ordersResource.reload()">Retry</button>
      }
      @case (ResourceStatus.Resolved) {
        <h2>Order #{{ selectedOrderId() }}</h2>
        <p>Total: {{ ordersResource.value()?.total | currency }}</p>
        <!-- ... -->
      }
    }
  `,
})
export class OrderDetailComponent {
  private http = inject(HttpClient);

  // UI state — Signal
  selectedOrderId = signal<number | null>(null);

  // Server state — resource() handles loading/error/refresh
  ordersResource = resource({
    // request is a Signal — when it changes, resource auto-refetches
    request: () => this.selectedOrderId(),
    loader: ({ request: orderId, abortSignal }) => {
      if (!orderId) return Promise.resolve(null);
      return firstValueFrom(
        this.http.get<Order>(`/api/orders/${orderId}`)
      );
      // abortSignal automatically cancels if selectedOrderId changes
    },
  });

  protected readonly ResourceStatus = ResourceStatus;

  selectOrder(id: number): void {
    this.selectedOrderId.set(id);
    // resource() automatically refetches when selectedOrderId changes
  }
}
```

### Anti-Example

```typescript
// WRONG: Misuse of signals and observables
@Component({ template: `{{ httpCallSignal() }}` })
class WrongComponent {
  private http = inject(HttpClient);

  // WRONG: signal stores the Observable object, not the response!
  httpCallSignal = signal(this.http.get('/api/data'));
  // Template renders: [object Object] (the Observable itself)

  // WRONG: Converting everything to signal including complex async flows
  searchResults = signal<Result[]>([]);

  onSearchChange(query: string): void {
    // WRONG: No debounce, no cancellation — firing HTTP on every keystroke
    this.http.get<Result[]>('/api/search', { params: { q: query } }).subscribe(
      results => {
        this.searchResults.set(results);
        // No markForCheck needed because it's a signal — but still:
        // No debounce, no cancellation of previous request (race condition!)
      }
    );
    // CORRECT: toObservable(searchQuery).pipe(debounceTime(300), switchMap(...)) → toSignal()
  }
}

// WRONG: Replacing switchMap with effect
@Component({ template: '' })
class SwitchMapReplacementWrong {
  searchQuery = signal('');
  results = signal<Result[]>([]);
  private http = inject(HttpClient);

  constructor() {
    effect(() => {
      // WRONG: No cancellation! Old request still in flight when query changes
      this.http.get<Result[]>('/api/search', { params: { q: this.searchQuery() } })
        .subscribe(r => this.results.set(r));
      // Race condition: fast typing → multiple in-flight requests, last to complete wins
    });
    // CORRECT: use toObservable(searchQuery).pipe(switchMap(...)) → toSignal()
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `signal(this.http.get(...))` | Stores the Observable object in signal, not the response — template renders `[object Object]` | `toSignal(this.http.get<T>(...), { initialValue: null })` |
| `effect(() => { this.http.get(...).subscribe(...) })` | No cancellation on effect re-run — multiple concurrent requests, race conditions | `toObservable(paramSignal).pipe(switchMap(() => http.get(...))) → toSignal()` |
| Converting everything to signals including RxJS orchestration | Loses debounce, cancellation, retry operators — manual reimplementation is complex and error-prone | Keep async coordination as Observable; bridge to Signal only at consumption point with `toSignal()` |
| `toSignal()` outside injection context | Runtime error — toSignal() must be called in constructor or factory | Always call `toSignal()` in constructor or field initializer (injection context) |
| Multiple `toSignal()` calls on cold Observable (e.g., HTTP) without `shareReplay` | Each `toSignal()` creates a separate subscription → N HTTP requests for N toSignal() calls | Add `shareReplay({ bufferSize: 1, refCount: false })` before `toSignal()` |

## Interview Block

### [L1 — Warm-up] Коли використовувати Signal, а коли Observable у Angular додатку?

**Signal being tested:** Базовий decision framework між двома reactivity primitives.

**What the interviewer expects:** Чіткий розподіл: signals для synchronous UI state, Observable для async data і RxJS operations.

**How to probe deeper:** "Ти маєш search input що тригерить HTTP запит — як реалізуєш без race condition?"

**Reference answer:** Signal: synchronous UI state (selected item, toggle, filter values, counter), derived state через computed(). Observable: async operations (HTTP, WebSocket), коли потрібні RxJS operators (debounce, switchMap, retry). Bridge: toSignal(obs$) — read Observable як Signal у template; toObservable(signal) — Signal як Observable для RxJS pipe. Вони complementary, не конкуренти. Для search: `searchQuery = signal('')`, `results = toSignal(toObservable(searchQuery).pipe(debounceTime(300), switchMap(q => http.get(url, {params: {q}}))))`.

**Common mistakes:** Замінюють switchMap на effect + subscribe — немає cancellation → race condition.

---

### [L2 — Mid] Як toSignal() і toObservable() bridging functions працюють і де вони потрібні?

**Signal being tested:** Практичне знання bridging functions і їх timing nuances.

**What the interviewer expects:** Опис що toSignal() підписується на Observable і поновлює Signal при emit; toObservable() emits асинхронно при signal change. Injection context requirement.

**How to probe deeper:** "Якщо Observable у toSignal() не має initialValue і я читаю Signal до першого emit — що отримаю?"

**Reference answer:** `toSignal(obs$)` підписується на Observable (у injection context) і оновлює wrapped Signal при кожному emit. Якщо без `initialValue` — до першого emit Signal value є `undefined` → тип `Signal<T | undefined>`. З `initialValue: []` — Signal<T[]>, завжди defined. `requireSync: true` — кидає помилку якщо Observable не emit synchronously при subscribe (для BehaviorSubject). `toObservable(signal)` — emits через effect(), асинхронно (не synchronously). Оба потрібні в injection context (constructor/field).

**Common mistakes:** Викликають toSignal() у method (setTimeout, click handler) — runtime error поза injection context.

---

### [L3 — Senior] Які конкретні RxJS patterns неможливо замінити signals і чому?

**Signal being tested:** Глибоке розуміння limitations signals і конкретних cases де Observable незамінний.

**What the interviewer expects:** switchMap cancellation, time-based operators, error channel — з поясненням чому signals не можуть це замінити.

**How to probe deeper:** "Покажи як реалізувати reactive HTTP search з debounce і cancellation використовуючи signals і bridge functions."

**Reference answer:** Observable-only patterns: 1) switchMap cancellation: при новому searchTerm попередній HTTP request скасовується — signals не мають built-in cancel mechanism. 2) debounceTime/throttleTime: signals synchronous, time operators потребують Observable. 3) retry/catchError: error channel вбудований в Observable, не в Signal. 4) combineLatest з temporal semantics (два Observable що emit у різний час). Реалізація: `toSignal(toObservable(search).pipe(debounceTime(300), distinctUntilChanged(), switchMap(q => http.get(url, {params: {q}}).pipe(catchError(() => of([])))), ), { initialValue: [] })`.

**Common mistakes:** effect() для switchMap без cancellation — race condition при rapid changes.

---

### [L4 — Staff/Principal] Як Angular resource() API змінює підхід до server state і де він вписується в Signal vs Observable decision?

**Signal being tested:** Знання Angular 18+ resource() API і architectural understanding server state as distinct category.

**What the interviewer expects:** resource() як answer для server state (loading/error/refresh), і як воно fits між Signals (UI state) і Observables (async orchestration).

**How to probe deeper:** "Коли resource() краще ніж toSignal(http.get(...)) і коли гірше?"

**Reference answer:** resource() (Angular 18+) handles server state — специфічну категорію що потребує: loading state, error state, automatic refetch при param change, manual refresh. `resource({ request: () => paramsSignal(), loader: ({request}) => firstValueFrom(http.get(url)) })`. ResourceRef.value(), .status(), .error(), .reload() — built-in. toSignal(http.get()) — simpler, одноразовий fetch без loading state. resource() краще коли: params змінюються (reactive refetch), потрібен retry, loading/error display. rxResource() для Observable loaders. Архітектурно: Signal = UI state, Observable = async orchestration, resource() = server state management — три чіткі категорії.

**Common mistakes:** resource() для складних multi-step async flows — Observable pipeline виразніший.

## Summary

### Key Points

- Signal = synchronous pull-based reactive value (UI state, derived); Observable = async push-based stream (HTTP, time-based, complex coordination)
- Вони complementary, не конкуренти: `toSignal()` і `toObservable()` bridge між ними
- Observable-only: switchMap cancellation, debounceTime/throttleTime, error channel (catchError, retry), temporal combination (combineLatest з async timing)
- Reactive HTTP search pattern: `toSignal(toObservable(querySignal).pipe(debounceTime(300), switchMap(q => http.get(...))), { initialValue: [] })`
- resource() (Angular 18+): handles server state — reactive fetch, loading/error states, automatic refetch, manual reload
- Decision framework: UI state → Signal; async I/O → Observable; server state → resource(); bridge at consumption: toSignal()
- Anti-pattern: effect + subscribe замість toObservable + switchMap — немає cancellation → race conditions

### Elevator Pitch (2 minutes)

Signals і Observable — complementary інструменти. Signal = synchronous state що завжди має поточне значення, читається без subscribe, optimal для UI state і computed derivations. Observable = async stream що може emitty values over time, підтримує RxJS operators (debounce, switchMap, retry), optimal для HTTP, WebSocket, time-based logic. Ключова різниця: Observable незамінний для cancellation (switchMap), time-based operators (debounceTime), і error channel (catchError). Bridge: `toSignal(obs$)` — читай Observable як Signal у template без async pipe; `toObservable(signal)` — використовуй Signal value у RxJS pipe. Для reactive HTTP search: `toSignal(toObservable(query).pipe(debounceTime(300), switchMap(q => http.get(...))), {initialValue: []})`. Angular 18+ resource() API: вищий рівень для server state — loading, error, refresh handled automatically. Архітектурний принцип: UI state → Signal, async flows → Observable, server state → resource().
