---
title: "Reactive Patterns in Angular"
block: 10
topic: 4
slug: "reactive-patterns"
difficulty: 4
sinceVersion: "6"
tags: ["reactive-patterns", "combineLatest", "shareReplay", "polling", "optimistic-updates", "reactive-forms", "debounce"]
relatedTopics: ["higher-order-operators", "subject-types", "error-handling-rxjs", "service-behaviorsubject"]
interviewQuestions:
  - level: "junior"
    question: "Що таке реактивний патерн в Angular і наведіть приклад?"
    referenceAnswers:
      junior: "Реактивний патерн — це підхід де дані описуються як Observable потоки і компоненти реагують на зміни автоматично. Наприклад, пошук де введення тексту автоматично запускає HTTP запит через switchMap."
      mid: "Реактивні патерни в Angular — це набір технік для опису async flows через Observable composition. Ключові: search-with-debounce (valueChanges + debounce + switchMap), combineLatest для multiple state streams, shareReplay для shared HTTP requests, polling через interval + switchMap. Перевага: declarative code, auto-cleanup з async pipe, OnPush-ready, easily testable."
      senior: "Реактивні патерни — це architectural approach де UI є проекція state потоків, а не набір imperative mutations. Core patterns: 1) Smart/Dumb component split — parent управляє state streams, child лише template. 2) Facade pattern — service що composer кілька streams у UI-ready Observable. 3) Optimistic updates — emit new state одразу, rollback при error. 4) Polling з exponential backoff. 5) Request deduplication через shareReplay. Ключово: кожен pattern вирішує конкретну проблему concurrency/state/async і може бути виражений декларативно через Observable operators."
      staff: "Реактивні патерни — це implementation of Reactive Programming paradigm в Angular context. Архітектурно вони формують 'reactive data flow' через весь додаток: від user input → state transformation → UI projection. Сучасний Angular 17+: сигнали замінили частину RxJS patterns для synchronous state, але RxJS залишається для async operations, complex event handling, cross-component event streams. Архітектурний підхід: визначити 'reactive boundaries' — де Observable, де Signal, де plain value. HTTP/WebSocket/Router events — Observable. UI state, derived state — Signal. One-off values — plain. Hybrid patterns: toSignal(http$) для bridging. Team impact: reactive patterns потребують training і pair programming для adoption."
    commonMistakes:
      - "Плутають реактивне і event-driven програмування — схожі але не те саме"
      - "Намагаються зробити все reactive коли простий Promise достатній"
    relatedQuestions: ["b10t4q2", "b10t4q3"]
  - level: "mid"
    question: "Як реалізувати polling у Angular з RxJS? Як зупинити polling при navigate away?"
    referenceAnswers:
      junior: "Можна використати interval() з switchMap для HTTP запитів, і takeUntilDestroyed() щоб зупинити при знищенні компонента."
      mid: "Polling: `interval(5000).pipe(switchMap(() => http.get('/api/data')), takeUntilDestroyed())`. switchMap гарантує що нова відповідь скасовує попередній запит якщо він ще не завершився. takeUntilDestroyed() зупиняє polling при destroy компонента. Для умовного старту/зупинки: BehaviorSubject<boolean> + filter або switchMap на isPolling stream."
      senior: "Повноцінний polling pattern: 1) interval з switchMap (cancel pending). 2) startWith для immediate перший запит. 3) catchError всередині switchMap (не зовні) — помилка не зупиняє polling. 4) takeUntilDestroyed для cleanup. 5) shareReplay(1) якщо кілька компонентів підписані — уникнути паралельних requests. 6) Retry logic: retryWhen або retry({delay, count}) для transient failures. Edge case: якщо HTTP запит займає > 5 секунд і interval fires знову — switchMap скасовує попередній. Якщо потрібно завершити поточний запит — concatMap або exhaustMap. Адаптивний polling: timer(0, 5000) замість interval(5000) — перший emit одразу, потім кожні 5 сек."
      staff: "Production polling patterns: 1) Exponential backoff при помилках: `retryWhen(errors => errors.pipe(scan((count, err) => { if (count >= maxRetries) throw err; return count + 1; }, 0), delayWhen(count => timer(Math.pow(2, count) * 1000))))`. 2) Conditional polling: `this.isActive$.pipe(switchMap(active => active ? interval(5000).pipe(startWith(0)) : EMPTY), switchMap(() => http$))`. 3) Smart polling: Server-Sent Events або WebSocket при доступності, polling як fallback. 4) Circuit breaker: після N consecutive failures — зупинити polling, notify user, можливість manual retry. 5) Multi-tab coordination: BroadcastChannel або localStorage events для sync polling між вкладками — уникнути паралельних requests від різних вкладок. 6) Visibility API: зупиняти polling коли вкладка не активна — document.addEventListener('visibilitychange')."
    commonMistakes:
      - "catchError поза switchMap — один HTTP error зупиняє весь polling"
      - "interval без startWith — перший request через N секунд замість негайно"
      - "Не враховують що HTTP request може займати більше ніж interval"
    relatedQuestions: ["b10t4q1", "b10t5q1"]
  - level: "senior"
    question: "Як реалізувати request deduplication та caching з shareReplay? Які підводні камені?"
    referenceAnswers:
      junior: "shareReplay(1) кешує останній результат і всі нові subscribers отримують його без нового HTTP запиту."
      mid: "shareReplay(1) перетворює cold Observable у hot і кешує останнє значення. Якщо кілька компонентів підписуються на один service метод, перший запускає HTTP, решта отримують з cache. Але підводний камінь: з `{refCount: false}` (default у деяких версіях) підписка залишається активною навіть після відписки всіх subscribers — стале дані в кеші."
      senior: "shareReplay семантика залежить від параметрів: `shareReplay(1)` — shorthand для `shareReplay({ bufferSize: 1, refCount: true })` у RxJS 6.4+. З `refCount: true` — коли всі unsubscribe, source unsubscribe і cache очищається при реcубскрипції. З `refCount: false` — source залишається активним, cache не очищається ніколи. Проблема stale cache: якщо HTTP response кешований shareReplay і дані змінились на сервері — користувач бачить старі. Вирішення: явна cache invalidation через Subject, або timed cache: `timer(cacheTime).pipe(take(1), switchMapTo(request$), shareReplay(1))`. Deduplication vs Caching: deduplication — уникнути паралельних однакових requests у одній сесії. Caching — зберігати між сесіями (localStorage/IndexedDB)."
      staff: "Cache invalidation — одна з двох важких проблем в CS (другя — naming). shareReplay pattern: 1) Time-based expiration: `BehaviorSubject<Observable<T>>` що замінює shared Observable після TTL. 2) Event-based invalidation: `merge(http$, invalidationEvents$).pipe(shareReplay(1))` — при invalidation event перезапускає HTTP. 3) Optimistic updates + cache: emit optimistic state через BehaviorSubject, потім sync з сервером, rollback при помилці. 4) SWR (Stale-While-Revalidate): показати cached дані одразу, в фоні оновити. 5) httpResource() у Angular 19+ — вбудований Resource API зі SWR semantics. 6) Для enterprise: dedicated cache layer (NgRx Data, TanStack Query adapter) замість ad-hoc shareReplay — TTL, invalidation groups, optimistic updates. 7) Cache в service vs store: сервіс-рівень для short-lived, store-рівень для cross-session state."
    commonMistakes:
      - "shareReplay без refCount — cache назавжди, memory leak"
      - "Не знають різниці shareReplay(1) vs shareReplay({bufferSize: 1, refCount: false})"
      - "Кешують мutable дані без invalidation strategy"
    relatedQuestions: ["b10t4q2", "b10t1q1"]
  - level: "mid"
    question: "Що таке optimistic updates і як їх реалізувати з RxJS у Angular?"
    referenceAnswers:
      junior: "Optimistic updates — це коли UI оновлюється відразу до отримання відповіді від сервера, а потім синхронізується або робиться rollback якщо запит провалився."
      mid: "Optimistic update pattern: 1) Emit нове state до HTTP запиту. 2) Виконати HTTP запит. 3) При успіху — sync state з серверною відповіддю. 4) При помилці — rollback до попереднього state. У RxJS: зберегти previous state, emit optimistic, concatMap на HTTP, при catchError emit rollback. Покращує perceived performance — UI відповідає миттєво."
      senior: "Реалізація з BehaviorSubject state: `const previous = this.state.getValue(); this.state.next(optimisticState); this.http.put(...).pipe(tap(serverState => this.state.next(serverState)), catchError(err => { this.state.next(previous); return throwError(() => err); })).subscribe()`. Важливі деталі: 1) Concurrent optimistic updates — якщо два запити в польоті одночасно, rollback одного не має перезаписати state від іншого. 2) Queue updates concatMap або обробляти conflicts. 3) Server state reconciliation — після успіху sync з server response, не просто 'зберегти optimistic'. 4) User feedback — loading indicator окремо від state update, error notification при rollback. 5) NgRx Optimistic Updates — через Actions: dispatchOptimistic + rollback action при failure."
      staff: "Optimistic updates — production pattern з реальними складнощами: 1) Conflict resolution при concurrent edits (multi-user). 2) Versioning/ETag — server повертає conflict 409 при stale update — показати diff, дозволити merge або force. 3) Offline-first apps: queue optimistic updates в IndexedDB, sync при reconnect. 4) Rollback UX: показати що rollback стався, надати можливість retry. 5) Partial optimism: деякі fields можна оновити optimistically (counter), деякі — ні (balance calculation). 6) Audit trail: зберігати optimistic vs confirmed state для debugging. 7) Angular httpResource() v19+ підтримує optimistic update pattern через Resource API. 8) Server-side concerns: idempotency keys для retry safety — якщо мережа впала і retry відправив twice — сервер має ідентифікувати дубль."
    commonMistakes:
      - "Rollback перезаписує state від паралельних updates"
      - "Не синхронізують state з server response після успіху (зберігають тільки optimistic)"
      - "Не показують user feedback при rollback"
    relatedQuestions: ["b10t4q3", "b10t5q1"]
  - level: "staff"
    question: "Як спроєктувати reactive data flow для складної форми з autocomplete, validation і server-side constraints?"
    referenceAnswers:
      junior: "Можна використати ReactiveFormsModule з valueChanges і switchMap для HTTP запитів на кожне поле."
      mid: "ReactiveFormGroup.valueChanges + debounceTime + distinctUntilChanged + switchMap для server-side validation. Окремі Observable для autocomplete suggestions. combineLatest для composite validation що залежить від кількох полів. AsyncValidator для field-level server validation."
      senior: "Складна форма reactive architecture: 1) Field-level async validators через AbstractControl.asyncValidator — Observable<ValidationErrors | null>. 2) Cross-field validation через form.valueChanges + combineLatest. 3) Autocomplete: FormControl.valueChanges + debounceTime(300) + distinctUntilChanged() + switchMap(q => http.get(url, q)). 4) Form state Observable: `combineLatest([form.statusChanges, form.valueChanges]).pipe(map(([status, value]) => ({ valid: status === 'VALID', value })))`. 5) Submit з exhaustMap — ігнорує повторні кліки. 6) Error state — typed error model, not raw HttpErrorResponse. 7) Form dirty state для navigation guard. 8) takeUntilDestroyed для всіх subscriptions."
      staff: "Enterprise reactive form architecture: 1) Form as state machine: idle → dirty → validating → valid/invalid → submitting → success/error. BehaviorSubject<FormState> що відображає весь lifecycle. 2) Declarative validation pipeline: validation rules як pure functions що compose через combineLatest. 3) Server-side validation optimization: debounce 500ms, cancel pending via switchMap, cache results shareReplay(1) for same input. 4) Cross-form coordination: multiple forms у wizard — combineLatest з кожного form validity. 5) Auto-save: valueChanges + debounce(2000) + distinctUntilChanged(deepEqual) + concatMap(save). 6) Undo/Redo: ReplaySubject<FormValue> як history buffer, slice для undo. 7) Multi-step form: окремий BehaviorSubject per step, final Observable via combineLatest. 8) Accessibility: aria-live region для async validation результатів. 9) Testing: marble tests для timing-sensitive debounce behavior."
    commonMistakes:
      - "Один великий subscribe в ngOnInit замість composable Observable chain"
      - "AsyncValidator без debounce — запит на кожний keystroke"
      - "Не обробляють конкурентні async validations (switchMap вирішує)"
    relatedQuestions: ["b10t4q4", "b10t1q2"]
---

## Core Concept

**English definition:** Reactive patterns in Angular are composable, declarative approaches for handling asynchronous data flows using RxJS operators. They transform imperative, callback-based logic into streams of values that can be filtered, combined, transformed, and rendered automatically.

**Пояснення:** Реактивне програмування — це парадигма де програма виражається як граф потоків даних, а не як послідовність команд. В Angular контексті: замість "отримай дані → оновити змінну → оновити UI" — ми описуємо "UI = f(state$)" де state$ — це Observable що автоматично оновлює UI при нових значеннях. Кожен патерн вирішує конкретну проблему: деduplication, polling, optimistic updates, cross-stream coordination.

**Яку проблему вирішує:**
- **Race conditions:** switchMap/exhaustMap гарантують правильну обробку concurrent async operations
- **Performance:** debounce, distinctUntilChanged зменшують зайві HTTP запитів
- **Consistency:** combineLatest гарантує що UI оновлюється коли всі залежні потоки мають значення
- **Predictability:** declarative pipeline легше читати, тестувати і debug-ати ніж imperative callbacks

**Як працює під капотом:**

Реактивні патерни — це composition операторів що трансформують Observable:

```
Pattern: Debounced Search
  fromEvent(input, 'input')     // source: user types
    → debounceTime(300)          // wait for pause in typing
    → map(e => e.target.value)   // extract value
    → distinctUntilChanged()     // skip same queries
    → filter(q => q.length > 2)  // skip short queries
    → switchMap(q => http.get(url, q))  // cancel prev, start new
    → catchError(() => of([]))   // inner error recovery
    → shareReplay(1)             // share with multiple subscribers
```

Кожен оператор — pure transformation function над Observable. Composition через `pipe()` — lazy: ніякого execution до subscribe або async pipe.

**Trade-offs та обмеження:**
- Складні reactive chains важко читати без RxJS досвіду — потрібні conventions
- Marble testing для timing-sensitive patterns — не всі розробники знайомі
- Over-reactive: не все має бути Observable — прості sync operations краще як plain functions
- Error propagation може бути неочевидним у complex chains

**Версійність:**
- RxJS 5.5: pipeable operators — reactive patterns стали composable
- RxJS 6: повна міграція на pipe-based patterns
- RxJS 7: improved TypeScript types, scheduler changes
- Angular 16+: Signals для synchronous reactive state — hybrid RxJS+Signal patterns
- Angular 19: httpResource() — Resource API для declarative HTTP state management

## Deep Details

### Edge Cases

- **combineLatest і initialization:** combineLatest не emit поки всі source Observable не emit хоча б раз. Якщо один з потоків "мовчить" — combineLatest нічого не emit. Вирішення: `startWith(null)` для опціональних streams.
- **shareReplay і error:** Якщо source Observable помилиться після shareReplay — нові subscribers отримають помилку. shareReplay кешує error state. Вирішення: не використовувати shareReplay для Observable що можуть помилитися без retry logic.
- **debounceTime і synchronous tests:** `debounceTime(300)` — async. У тестах з TestScheduler потрібно `flush()` або `tick(300)`. Без цього — тест пройде але debounce не спрацює.
- **distinctUntilChanged і objects:** Стандартний distinctUntilChanged порівнює за reference. Для objects потрібен custom comparator або `distinctUntilKeyChanged('field')`.
- **withLatestFrom і hot source:** `withLatestFrom` не підписується на source Observable — воно тільки бере останнє значення. Якщо source ще не emit — `withLatestFrom` пропустить значення. Для cold Observable — потрібен `combineLatest` або `startWith`.

### Junior vs Senior Understanding

**Junior** знає: "debounce для пошуку, combineLatest для кількох потоків, shareReplay для кешування."

**Senior** розуміє глибину:

1. **Marble semantics:** Може читати і писати marble diagrams. Розуміє timing: `debounceTime(300)` — 300мс ПІСЛЯ останнього значення, `throttleTime(300)` — emit кожні 300мс (перший або останній залежно від `{leading, trailing}`).

2. **shareReplay{refCount}:** `shareReplay(1)` у різних версіях RxJS мав різну default behavior для refCount. RxJS 6.4+: `refCount: true` за замовчуванням. До 6.4: `refCount: false`. Завжди explicit: `shareReplay({ bufferSize: 1, refCount: true })`.

3. **combineLatest vs zip vs forkJoin:** combineLatest emit при будь-якому зміні. zip — чекає пару значень від кожного. forkJoin — чекає завершення всіх і emit масив останніх значень. forkJoin для parallel HTTP запитів що всі мають завершитись.

4. **Scheduler impact:** `interval(1000, asyncScheduler)` vs `interval(1000, animationFrameScheduler)` — різна поведінка. asyncScheduler — macrotask (setTimeout), animationFrameScheduler — requestAnimationFrame.

### Deprecation & Migration Path

- **zip/combineAll:** `zip` тепер `zipWith` для piping, static `zip()` залишився.
- **fromPromise:** deprecated, використовувати `from(promise)`.
- **toPromise():** deprecated у RxJS 7, використовувати `firstValueFrom()` або `lastValueFrom()`.
  ```typescript
  // Old (deprecated):
  const value = await observable.toPromise();
  // New:
  const value = await firstValueFrom(observable);
  const lastValue = await lastValueFrom(observable); // чекає complete
  ```
- **merge/concat/zip static:**  Стали piping operators: `mergeWith`, `concatWith`, `zipWith` для fluent API.

### Connections to Other Concepts

- **Higher-Order Operators (b10t1):** switchMap/mergeMap — ключові для async patterns.
- **Error Handling (b10t5):** catchError placement критична у кожному pattern.
- **Subject Types (b10t3):** BehaviorSubject — state container у reactive patterns.
- **Signals (b11t1):** toSignal/toObservable — bridging RxJS і Signal patterns.
- **Reactive Forms (b7t2):** valueChanges — основний source для form-based reactive patterns.

## Examples

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { combineLatest, interval } from 'rxjs';
import {
  debounceTime, distinctUntilChanged, switchMap,
  startWith, map, shareReplay, catchError
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  template: `
    <input [formControl]="searchControl" placeholder="Search..." />
    <select [formControl]="categoryControl">
      @for (cat of categories; track cat) { <option>{{ cat }}</option> }
    </select>

    @if (products$ | async; as products) {
      @for (p of products; track p.id) { <div>{{ p.name }}</div> }
    }
  `,
})
export class ProductListComponent {
  private http = inject(HttpClient);

  searchControl = new FormControl('');
  categoryControl = new FormControl('all');
  categories = ['all', 'electronics', 'books'];

  // ✅ Pattern: combine multiple filters + debounce + request deduplication
  products$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''), // emit immediately for initial load
      debounceTime(300),
      distinctUntilChanged(),
    ),
    this.categoryControl.valueChanges.pipe(startWith('all')),
  ]).pipe(
    switchMap(([query, category]) =>
      this.http.get<Product[]>('/api/products', {
        params: { q: query ?? '', category },
      }).pipe(
        catchError(() => of([])), // inner catchError — outer stream survives
      )
    ),
    shareReplay(1), // deduplicate if multiple template consumers
  );
}
```

### Production Scenario

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, timer, EMPTY, merge } from 'rxjs';
import {
  switchMap, startWith, catchError, tap,
  retryWhen, delayWhen, scan, shareReplay
} from 'rxjs/operators';

interface DeviceStatus {
  id: string;
  status: 'online' | 'offline' | 'unknown';
  lastSeen: Date;
}

@Injectable({ providedIn: 'root' })
export class DeviceMonitorService {
  private http = inject(HttpClient);

  private isMonitoring$ = new BehaviorSubject(false);

  // ✅ Pattern: conditional adaptive polling with error recovery
  readonly deviceStatuses$ = this.isMonitoring$.pipe(
    switchMap(isActive =>
      isActive
        ? timer(0, 10_000).pipe( // immediate then every 10s
            switchMap(() =>
              this.http.get<DeviceStatus[]>('/api/devices/status').pipe(
                // ✅ Exponential backoff retry
                retryWhen(errors =>
                  errors.pipe(
                    scan((retryCount, err) => {
                      if (retryCount >= 3) throw err; // max 3 retries
                      return retryCount + 1;
                    }, 0),
                    delayWhen(count => timer(Math.pow(2, count) * 1000)),
                  )
                ),
                catchError(() => of([] as DeviceStatus[])), // polling survives errors
              )
            ),
          )
        : EMPTY // stop polling when disabled
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  startMonitoring(): void { this.isMonitoring$.next(true); }
  stopMonitoring(): void { this.isMonitoring$.next(false); }
}
```

### Anti-Example

```typescript
// ❌ WRONG: Imperative, non-reactive patterns
@Component({ selector: 'app-bad', template: '' })
export class BadComponent implements OnInit {
  products: Product[] = [];
  searchQuery = '';
  category = 'all';
  private searchTimer: any;

  ngOnInit() {
    // Polling imperatively — no cleanup, no error handling
    setInterval(() => {
      this.http.get('/api/products').subscribe(
        p => this.products = p as Product[]
      );
    }, 5000); // memory leak, no clearInterval
  }

  onSearch(query: string) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      // Manual debounce — no cancellation, potential race condition
      this.http.get('/api/search', { params: { q: query } }).subscribe(
        results => this.products = results as Product[]
      );
    }, 300);
  }
}

// ✅ CORRECT: Declarative reactive pipeline
@Component({ selector: 'app-good', standalone: true })
export class GoodComponent {
  private http = inject(HttpClient);
  searchControl = new FormControl('');

  products$ = this.searchControl.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => this.http.get<Product[]>('/api/search', { params: { q: q ?? '' } }).pipe(
      catchError(() => of([]))
    )),
    shareReplay(1),
  );
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `setInterval` для polling | Немає cleanup, конфліктує зі Zone.js, не реактивний | `timer(0, interval).pipe(switchMap(...), takeUntilDestroyed())` |
| Manual debounce з setTimeout | Race condition, потрібен ручний cleanup | `debounceTime(300)` у RxJS pipe |
| combineLatest без `startWith` | Потік мовчить поки всі emitters не emit — UI не завантажується | `startWith(initialValue)` на кожному источнику |
| `toPromise()` для HTTP calls | Deprecated, втрачається cancellation | `firstValueFrom()` або `lastValueFrom()` |
| Вкладені `.pipe()` без пояснення | Складно читати, важко debug | Витягти в іменовані Observable або коментувати кожен оператор |

## Interview Block

### [L1 — Warm-up] Що таке реактивний патерн в Angular і наведіть приклад?
**Signal being tested:** Чи розуміє кандидат відмінність reactive і imperative підходів та базові RxJS operators
**What the interviewer expects:** Визначення reactive programming, приклад з реальним use case, хоча б 2-3 оператори
**How to probe deeper:** "Як би ви реалізували search з debounce та скасуванням попереднього запиту?"
**Reference answer:** Реактивний патерн — declarative підхід де UI описується як функція від Observable потоків. Замість `this.data = result` у subscribe — `this.data$ = this.http.get(...).pipe(...)` і `| async` у template. Базовий приклад search: `input.valueChanges.pipe(debounceTime(300), switchMap(q => http.get(url, q)))`. Переваги: auto-cleanup, race condition prevention через switchMap, OnPush-ready.
**Common mistakes:** Не знають різниці reactive і event-driven; використовують setInterval замість interval()

### [L2 — Mid] Як реалізувати polling у Angular? Як зупинити його?
**Signal being tested:** Чи знає кандидат правильні RxJS operators для periodic tasks і cleanup strategies
**What the interviewer expects:** timer(0, N) або interval з startWith, switchMap для cancellation pending, catchError всередині, conditional polling через BehaviorSubject, takeUntilDestroyed
**How to probe deeper:** "Як реалізувати exponential backoff при помилках polling?"
**Reference answer:** `timer(0, 5000).pipe(switchMap(() => http.get(url).pipe(catchError(() => of([])))), takeUntilDestroyed())`. timer(0, 5000) — перший emit одразу, потім кожні 5 сек. switchMap скасовує pending request при новому timer tick. catchError всередині switchMap — помилка не зупиняє polling. Conditional: `isPolling$.pipe(switchMap(active => active ? timer(...) : EMPTY))`. Exponential backoff: retryWhen + delayWhen(count => timer(2^count * 1000)).
**Common mistakes:** interval без startWith; catchError поза switchMap; немає cleanup

### [L3 — Senior] Як shareReplay працює і які підводні камені refCount?
**Signal being tested:** Розуміння hot Observable, multicasting, cache semantics, refCount behavior
**What the interviewer expects:** Пояснення cold→hot conversion, bufferSize semantics, refCount: true vs false різниця, memory leak при refCount: false, stale cache problem
**How to probe deeper:** "shareReplay кешує помилку — що відбудеться коли третій subscriber підпишеться після того як source errored?"
**Reference answer:** shareReplay(1) конвертує cold Observable у hot: перший subscriber запускає execution, решта підписуються на той самий результат. bufferSize: 1 — зберігає останнє значення для late subscribers. refCount: true — коли всі unsubscribe, source unsubscribes і cache очищається. refCount: false (старий default) — source залишається активним назавжди. При error — shareReplay кешує error, нові subscribers отримують error. Stale cache: HTTP response кешується — явна cache invalidation потрібна через BehaviorSubject або time-based expiration.
**Common mistakes:** shareReplay без refCount — memory leak; не знають що shareReplay кешує errors; кешують mutable state без invalidation

### [L4 — Staff/Principal] Як спроєктувати reactive data flow для складної форми?
**Signal being tested:** Архітектурне мислення — form state machine, composition patterns, performance, testing
**What the interviewer expects:** Form as state machine, async validators з debounce/switchMap, auto-save з concatMap, cross-field validation з combineLatest, undo/redo pattern
**How to probe deeper:** "Як реалізувати auto-save що не надсилає запит при кожному keystroke але гарантує що останні зміни збережено?"
**Reference answer:** Form state machine: idle→dirty→validating→submitting→success/error через BehaviorSubject<FormState>. Async validators: abstractControl.asyncValidators array, debounce 500ms + switchMap. Auto-save: `valueChanges.pipe(debounce(2000), distinctUntilChanged(deepEqual), concatMap(save))` — 2 сек пауза, no duplicates, sequential saves. Cross-field validation: `combineLatest([fieldA.valueChanges, fieldB.valueChanges]).pipe(map(validate))`. Undo: ReplaySubject(50) як history, slice for undo.
**Common mistakes:** Один subscribe в ngOnInit замість composable chains; async validator без debounce; не тестують timing behavior

## Summary

### Key Points
- Реактивні патерни — declarative описання async flow через Observable composition, не imperative callbacks
- Debounced search: valueChanges + debounceTime + distinctUntilChanged + switchMap — базовий та найпоширеніший паттерн
- Polling: timer(0, interval) + switchMap + catchError(inside) + conditional via EMPTY
- shareReplay({bufferSize: 1, refCount: true}) — deduplication без memory leak
- combineLatest + startWith — coordination multiple streams з immediate initial value
- forkJoin — parallel HTTP requests де всі мають завершитись
- firstValueFrom/lastValueFrom замість deprecated toPromise()

### Elevator Pitch (2 minutes)
"Реактивні патерни в Angular — це набір RxJS-based підходів для декларативного вираження async логіки. Ключові: пошук з debounce — valueChanges + debounceTime + switchMap (auto-cancel), polling — timer(0, N) + switchMap + catchError всередині (resilient), caching — shareReplay({refCount: true}) (shared HTTP без дублювання). Кожен патерн вирішує проблему concurrency: switchMap для 'cancel old', exhaustMap для 'ignore new', concatMap для 'queue'. Для складних форм: form as state machine, async validators через switchMap, auto-save через debounce + concatMap. В Angular 17+: signals для synchronous state, RxJS для async operations — гібридний підхід."
