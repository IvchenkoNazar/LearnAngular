---
title: "Higher-Order Mapping Operators"
block: 10
topic: 1
slug: "higher-order-operators"
difficulty: 4
sinceVersion: "6"
tags: ["switchMap", "mergeMap", "concatMap", "exhaustMap", "flattening", "higher-order-observable"]
relatedTopics: ["reactive-patterns", "memory-leaks", "error-handling-rxjs"]
interviewQuestions:
  - id: "b10t1q1"
    level: "junior"
    question: "Що таке higher-order mapping operator і навіщо він потрібен?"
    referenceAnswers:
      junior: "Higher-order mapping operator приймає значення з одного Observable і повертає новий Observable. Наприклад, switchMap використовується коли потрібно зробити HTTP-запит на кожне значення з потоку."
      mid: "Higher-order mapping operators (switchMap, mergeMap, concatMap, exhaustMap) вирішують проблему 'Observable of Observables'. Замість ручного subscribe всередині subscribe, вони автоматично підписуються на inner Observable і 'розгортають' його значення в зовнішній потік. Кожен оператор має свою стратегію: switchMap скасовує попередній, mergeMap запускає паралельно, concatMap чекає завершення."
      senior: "Higher-order mapping operators — це flattening strategies для вкладених Observable потоків. Під капотом кожен оператор управляє inner subscriptions по-різному: switchMap зберігає лише одну active inner subscription і unsubscribe від попередньої при новому значенні (використовує innerSubscription.unsubscribe()). mergeMap тримає concurrent inner subscriptions з опціональним concurrency limit. concatMap використовує внутрішню чергу (buffer) і підписується на наступний inner Observable тільки після complete попереднього. exhaustMap ігнорує нові значення поки active inner subscription не завершиться. Вибір оператора — це архітектурне рішення: switchMap для search/autocomplete (скасування stale requests), concatMap для ordered writes, exhaustMap для запобігання duplicate submissions."
      staff: "Higher-order operators — це абстракція над concurrency control в реактивних потоках. В контексті Angular: switchMap в router — основа navigation cancellation (нова навігація скасовує попередню). Effects в NgRx використовують різні оператори в залежності від семантики action: switchMap для read operations (latest wins), concatMap для write operations (order matters), exhaustMap для login (prevent duplicate). Архітектурно, вибір оператора визначає backpressure strategy: mergeMap без concurrency limit може спричинити memory pressure при burst of events. В enterprise додатках я рекомендую lint rule що забороняє mergeMap без explicit concurrency parameter і switchMap для write operations. Для тестування: marble testing дозволяє верифікувати timing behavior кожного оператора — це критично для race condition prevention."
    commonMistakes:
      - "Використовують nested subscribe замість higher-order operator"
      - "Плутають switchMap і mergeMap — використовують switchMap для POST/PUT запитів і втрачають запити"
    relatedQuestions: ["b10t1q2", "b10t4q1"]
  - id: "b10t1q2"
    level: "mid"
    question: "Коли використовувати switchMap vs concatMap vs mergeMap vs exhaustMap? Наведіть приклади."
    referenceAnswers:
      junior: "switchMap — для пошуку, mergeMap — для паралельних запитів, concatMap — коли порядок важливий, exhaustMap — щоб ігнорувати повторні кліки."
      mid: "switchMap скасовує попередню inner subscription при новому значенні — ідеально для autocomplete (користувач набирає, попередній HTTP-запит скасовується). mergeMap запускає inner subscriptions паралельно — підходить для незалежних операцій типу завантаження деталей кількох items. concatMap виконує inner subscriptions послідовно — для write операцій де порядок важливий (збереження змін). exhaustMap ігнорує нові значення поки поточний inner не завершиться — для login button (запобігає duplicate submission)."
      senior: "Вибір оператора — це concurrency strategy: switchMap (concurrency: 1, cancel previous) — search, route params, typeahead. Але switchMap для POST небезпечний — запит може вже дійти до сервера коли ми unsubscribe від HTTP Observable (unsubscribe скасує XHR, але сервер міг уже обробити). concatMap (concurrency: 1, queue) — sequential writes, form auto-save. Проблема: якщо inner Observable не complete — чергу заблоковано назавжди. mergeMap (configurable concurrency) — паралельне завантаження. Без concurrency limit при 1000 елементах — 1000 паралельних HTTP запитів. exhaustMap (concurrency: 1, drop new) — submit button, refresh. Менш відомий факт: mergeMap(fn, 1) === concatMap(fn), бо concurrency: 1 перетворює merge на sequential."
      staff: "Архітектурно, ці оператори — це policy decisions для системи. В NgRx Effects: createEffect(() => actions$.pipe(ofType(search), switchMap(...))) — standard для reads. Але я бачив production bugs коли switchMap використовували для delete operations — request скасовувався на клієнті, але сервер виконував delete. Правило: read=switchMap, create/update=concatMap (або exhaustMap), delete=concatMap з confirmation. В router: switchMap за замовчуванням для route resolve — нова навігація скасовує попередній resolve. Для team: ESLint plugin rxjs-x має правила no-unsafe-switchmap що попереджає про switchMap після мутуючих actions. В high-load сценаріях: mergeMap з concurrency parameter — backpressure mechanism. Наприклад, batch upload 10000 файлів: mergeMap(file => upload(file), 3) — максимум 3 паралельних uploads."
    commonMistakes:
      - "switchMap для write/delete операцій — запит може бути скасований, але сервер вже виконав операцію"
      - "mergeMap без concurrency limit для великих масивів — DDoS свого API"
      - "concatMap з inner Observable що не завершується — вічна чергу"
    relatedQuestions: ["b10t1q1", "b10t1q3"]
  - id: "b10t1q3"
    level: "senior"
    question: "Що станеться якщо inner Observable в switchMap кине помилку? Як це впливає на зовнішній потік?"
    referenceAnswers:
      junior: "Якщо inner Observable кине помилку, то весь потік зупиниться."
      mid: "Помилка в inner Observable propagate до зовнішнього потоку і завершує його з помилкою. Щоб цього уникнути, потрібно обробити помилку всередині switchMap за допомогою catchError — тоді зовнішній потік продовжить працювати."
      senior: "В RxJS, error notification в будь-якому місці pipe ланцюга зупиняє весь Observable — це Observable Contract (next*, (error|complete)?). Якщо inner Observable в switchMap кидає помилку, вона propagate до subscriber і Observable завершується. Це критично для long-lived потоків (наприклад, form valueChanges з HTTP save): одна помилка зупиняє весь потік назавжди. Рішення: catchError ВСЕРЕДИНІ switchMap — `switchMap(val => http.get(url).pipe(catchError(err => of(fallback))))`. Важливо: catchError поза switchMap теж працює, але різниця в тому, що зовнішній catchError завершить або перезапустить весь зовнішній Observable, а внутрішній — тільки поточний inner. Для NgRx Effects це особливо критично: effect без catchError 'вмирає' після першої помилки і перестає реагувати на actions."
      staff: "Error handling в higher-order operators — одна з найчастіших причин production bugs в Angular додатках. Архітектурний підхід: 1) Defensive inner Observable — кожен inner Observable має catchError що повертає typed error state (Result pattern: `Observable<Success | Failure>`). 2) Effect resilience — NgRx effects потребують catchError що повертає failure action, бо effect observable не перезапускається автоматично (в старих версіях NgRx робив resubscribe, зараз — ні, треба explicit). 3) Global error handling: ErrorHandler для uncaught, але він не допоможе з 'мертвим' Observable. 4) Monitoring: tap({ error }) перед catchError для logging/telemetry. 5) Testing: marble tests повинні explicit тестувати error scenarios для кожного higher-order operator. Рекомендація для команди: створити utility function типу safeSwitchMap що автоматично обгортає inner Observable в catchError з error reporting."
    commonMistakes:
      - "catchError поза switchMap замість всередині — зовнішній потік все одно завершується"
      - "Не тестують error scenarios в higher-order operators"
      - "В NgRx Effects забувають catchError — effect перестає працювати після першої помилки"
    relatedQuestions: ["b10t1q2", "b10t5q1"]
  - id: "b10t1q4"
    level: "mid"
    question: "Що таке concurrency parameter в mergeMap і коли його варто використовувати?"
    referenceAnswers:
      junior: "mergeMap може приймати другий аргумент — число, яке обмежує кількість паралельних inner subscriptions."
      mid: "mergeMap приймає другий параметр concurrent — максимальна кількість inner Observable підписок одночасно. Якщо concurrent=1, mergeMap працює як concatMap. Це корисно для batch operations: наприклад, завантаження списку файлів з обмеженням паралельних запитів до 3, щоб не перевантажити сервер."
      senior: "Concurrency parameter — це backpressure mechanism в mergeMap. Без нього mergeMap підписується на кожен inner Observable негайно. При concurrent=N, mergeMap буферизує вхідні значення і підписується на наступний inner Observable тільки коли кількість активних inner subscriptions менша за N. Під капотом це working як semaphore. Практичне застосування: parallel HTTP з rate limiting — `from(urls).pipe(mergeMap(url => http.get(url), 5))` — максимум 5 одночасних запитів. Це критично для: bulk operations (import 10000 records), file uploads, API з rate limiting. Без concurrency limit при 1000 items — 1000 паралельних XHR, browser обмежує до ~6 per domain, решта чекають, але Observable вже створені і тримають memory."
      staff: "Concurrency control — це системне рішення. В production: 1) API rate limits — якщо API дозволяє 100 req/s, concurrency потрібно калібрувати. 2) Browser connection limits — HTTP/1.1: 6 per domain, HTTP/2: multiplexed але server може мати limits. 3) Memory — кожен pending request тримає response buffer. 4) User experience — прогрес бар для batch operations потребує знання total/completed. 5) Error recovery — при concurrency > 1 і error в одному inner, інші продовжують. Архітектурно, для великих batch operations краще створити dedicated service з queue, retry logic, progress reporting, і cancellation support — це виходить за межі простого mergeMap. Для distributed systems: concurrency на клієнті — це лише частина puzzle, server-side throttling і circuit breakers теж потрібні."
    commonMistakes:
      - "Ігнорують concurrency parameter і створюють сотні паралельних HTTP запитів"
      - "Не знають що mergeMap(fn, 1) еквівалентний concatMap(fn)"
    relatedQuestions: ["b10t1q2", "b10t1q5"]
  - id: "b10t1q5"
    level: "staff"
    question: "Як би ви спроєктували стратегію використання higher-order operators для великого enterprise Angular додатку?"
    referenceAnswers:
      junior: "Потрібно використовувати правильний оператор для кожної ситуації — switchMap для пошуку, concatMap для збереження."
      mid: "Для enterprise додатку потрібні чіткі правила: switchMap для read операцій (GET), concatMap для write (POST/PUT), exhaustMap для submit. Також потрібно обов'язково використовувати catchError всередині inner Observable для error handling."
      senior: "Стратегія включає: 1) Team conventions — документований mapping: GET=switchMap, mutation=concatMap, submit=exhaustMap. 2) ESLint rules — rxjs-x plugin для автоматичного enforcement. 3) Error handling — utility wrappers що додають catchError і retry logic. 4) Testing — marble tests для кожного higher-order operator usage. 5) NgRx Effects — strict conventions per action type. 6) Code review checklist — перевірка operator вибору. Також важливо: mergeMap з concurrency для batch operations, timeout для кожного HTTP inner Observable."
      staff: "Enterprise стратегія: 1) Operator Selection Matrix — документ що mapping бізнес-операції на оператори з обґрунтуванням. Не просто 'GET=switchMap', а 'search with cancellation=switchMap, polling with latest=switchMap, sequential form save=concatMap, idempotent retry=mergeMap(,1) with retry'. 2) Custom operators library — safeSwitchMap, queuedConcatMap, throttledMergeMap що інкапсулюють error handling, retry, logging, telemetry. 3) Architecture Decision Record для кожного нестандартного вибору. 4) Lint rules: no bare mergeMap (require concurrency), no switchMap after mutation actions, mandatory catchError in effects. 5) Observable pipeline testing strategy: marble tests для timing-critical код, integration tests для end-to-end flows. 6) Monitoring: custom RxJS operator що логує slow inner Observable, unsubscription patterns, error rates. 7) Performance budget: mergeMap concurrency aligned з API rate limits та browser connection pool. 8) Migration plan від callback/Promise-based код до reactive — поступовий, з training і pair programming."
    commonMistakes:
      - "Немає team conventions — кожен розробник обирає оператор 'на відчуття'"
      - "Ігнорують ESLint rules для RxJS"
      - "Не тестують race conditions та error scenarios"
    relatedQuestions: ["b10t1q3", "b10t4q3"]
---

## Core Concept

**English definition:** Higher-order mapping operators (switchMap, mergeMap, concatMap, exhaustMap) are RxJS operators that map each source value to an inner Observable, automatically subscribe to it, and flatten the results into the output Observable using different concurrency strategies.

**Пояснення:** Higher-order mapping operators вирішують фундаментальну проблему реактивного програмування — коли кожне значення з потоку потребує створення нового асинхронного потоку. Наприклад, кожен keystroke в пошуковому полі має ініціювати HTTP-запит. Без цих операторів ми б отримали Observable<Observable<Result>> — "потік потоків". Higher-order operators автоматично "розгортають" вкладені Observable і управляють inner subscriptions за різними стратегіями.

**Яку проблему вирішує:** Уникнення nested subscriptions ("callback hell" в реактивному світі). Без higher-order operators розробники пишуть subscribe всередині subscribe, що призводить до memory leaks, втрати контролю над lifecycle підписок, і неможливості використовувати RxJS оператори для обробки результатів.

**Як працює під капотом:**

Кожен higher-order operator:
1. Підписується на зовнішній (source) Observable
2. Для кожного значення викликає projection function що повертає inner Observable
3. Підписується на inner Observable за своєю стратегією
4. Передає значення з inner Observable далі по pipe

Стратегії управління inner subscriptions:

```
switchMap:   ──a──b──c──  → subscribe(c), unsubscribe(b), unsubscribe(a)
mergeMap:    ──a──b──c──  → subscribe(a) + subscribe(b) + subscribe(c)  [parallel]
concatMap:   ──a──b──c──  → subscribe(a), wait complete, subscribe(b), wait, subscribe(c)
exhaustMap:  ──a──b──c──  → subscribe(a), ignore(b), ignore(c) while a active
```

Під капотом switchMap зберігає посилання на поточну inner subscription. При отриманні нового значення від source — викликає `innerSubscription.unsubscribe()` перед створенням нової. mergeMap тримає Set<Subscription> всіх active inner subscriptions. concatMap використовує внутрішній buffer (масив) і підписується на наступний елемент при `complete` поточного.

**Trade-offs та обмеження:**

- switchMap скасовує HTTP-запити на клієнті (XHR abort), але сервер може вже обробити запит — небезпечно для mutations
- mergeMap без concurrency limit може створити тисячі паралельних запитів
- concatMap блокується назавжди якщо inner Observable не завершується (наприклад, WebSocket)
- exhaustMap "втрачає" значення — не підходить коли кожне значення важливе

**Версійність:**
- RxJS 5: операторя як методи Observable (`observable.switchMap()`)
- RxJS 5.5: lettable (pipeable) operators введені — `pipe(switchMap())`
- RxJS 6: patch operators видалені, тільки pipeable
- RxJS 7: flatMap (alias для mergeMap) deprecated
- Angular 6+: використовує RxJS 6 з pipeable operators
- Angular 21: RxJS 7.8 — стабільна версія всіх higher-order operators

## Deep Details

### Edge Cases

- **switchMap з synchronous inner Observable:** Якщо inner Observable emit'ить синхронно (наприклад, `of(value)`), switchMap не викликає unsubscribe — нема від чого відписуватись, бо inner вже complete.
- **concatMap buffer overflow:** Якщо source emit'ить швидше ніж inner Observable завершується, буфер concatMap росте необмежено. Для 10000 швидких значень з повільним inner — 10000 елементів в пам'яті.
- **mergeMap і completion:** mergeMap complete тільки коли source І всі active inner Observable complete. Якщо один inner "зависне" — весь потік не завершиться.
- **switchMap з shareReplay inner:** Якщо inner Observable shared (shareReplay), unsubscribe від switchMap не зупиняє inner — він продовжує через інших subscribers.
- **Error в одному inner mergeMap:** При mergeMap, помилка в одному inner Observable завершує весь зовнішній потік — навіть якщо інші inner ще активні.

### Junior vs Senior Understanding

**Junior** знає: "switchMap скасовує попередній запит, mergeMap робить паралельно."

**Senior** розуміє глибину:

1. **Cancellation semantics:** switchMap викликає `unsubscribe()` на inner subscription. Для HttpClient це означає `XMLHttpRequest.abort()` або `AbortController.abort()` для fetch. Але abort на клієнті не означає abort на сервері — якщо сервер вже отримав POST і обробляє його, abort на клієнті лише ігнорує response. Тому switchMap для mutations — потенційний баг.

2. **Backpressure:** mergeMap без concurrency — це unbounded concurrency. Senior знає що `mergeMap(fn, 3)` — це semaphore pattern. Для batch operations це єдиний правильний підхід.

3. **Observable Contract:** Після error або complete — Observable мертвий. Тому catchError ВСЕРЕДИНІ switchMap критичний для long-lived потоків. `source$.pipe(switchMap(v => inner$.pipe(catchError(...))))` зберігає зовнішній потік живим.

4. **Resubscription patterns:** Для NgRx Effects, помилка без catchError "вбиває" effect назавжди. Senior використовує `catchError(() => EMPTY)` що повертає complete без значень — зовнішній потік продовжує.

### Deprecation & Migration Path

- **flatMap:** Deprecated alias для mergeMap. Видалений в RxJS 7.
- **switchAll/mergeAll/concatAll:** Окремі flattening operators без mapping — рідко потрібні напряму, бо switchMap = map + switchAll.
- **resultSelector (deprecated):** Раніше higher-order operators приймали resultSelector як параметр. Deprecated в RxJS 6, рекомендовано використовувати `map` після operator: `switchMap(v => inner$).pipe(map(innerVal => combine(v, innerVal)))`.

### Connections to Other Concepts

- **Angular Router:** Використовує switchMap для route resolution — нова навігація скасовує попередній resolve.
- **NgRx Effects:** Кожен effect використовує higher-order operator для обробки actions.
- **Reactive Forms:** `valueChanges` + switchMap — стандартний pattern для server-side validation або autocomplete.
- **Memory Leaks (b10t2):** Higher-order operators автоматично управляють inner subscriptions, зменшуючи ризик leaks.
- **Error Handling (b10t5):** catchError placement відносно higher-order operator критично впливає на поведінку.

## Examples

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { SearchService } from './search.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  template: `
    <input [formControl]="searchControl" placeholder="Search..." />
    @for (result of results$ | async; track result.id) {
      <div>{{ result.name }}</div>
    }
  `,
})
export class SearchComponent {
  private searchService = inject(SearchService);
  searchControl = new FormControl('');

  // switchMap: кожен новий keystroke скасовує попередній HTTP-запит
  results$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => this.searchService.search(query)),
  );
}
```

### Production Scenario

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, concatMap, exhaustMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import * as OrderActions from './order.actions';

@Injectable()
export class OrderEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);

  // READ: switchMap — нова навігація скасовує попередній запит
  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrderActions.loadOrders),
      switchMap(({ filters }) =>
        this.http.get<Order[]>('/api/orders', { params: filters }).pipe(
          map(orders => OrderActions.loadOrdersSuccess({ orders })),
          catchError(error => of(OrderActions.loadOrdersFailure({ error }))),
        ),
      ),
    ),
  );

  // WRITE: concatMap — зберігаємо порядок mutations
  updateOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrderActions.updateOrder),
      concatMap(({ order }) =>
        this.http.put<Order>(`/api/orders/${order.id}`, order).pipe(
          map(updated => OrderActions.updateOrderSuccess({ order: updated })),
          catchError(error => of(OrderActions.updateOrderFailure({ error }))),
        ),
      ),
    ),
  );

  // SUBMIT: exhaustMap — ігнорує повторні кліки поки обробляється
  submitOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrderActions.submitOrder),
      exhaustMap(({ order }) =>
        this.http.post<Order>('/api/orders', order).pipe(
          map(created => OrderActions.submitOrderSuccess({ order: created })),
          catchError(error => of(OrderActions.submitOrderFailure({ error }))),
        ),
      ),
    ),
  );
}
```

### Anti-Example

```typescript
// ❌ WRONG: nested subscribe — "callback hell", memory leaks, no error propagation
this.route.params.subscribe(params => {
  this.http.get(`/api/users/${params['id']}`).subscribe(user => {
    this.http.get(`/api/orders?userId=${user.id}`).subscribe(orders => {
      this.orders = orders; // 3 levels deep, no cleanup!
    });
  });
});

// ✅ CORRECT: chained higher-order operators
this.route.params.pipe(
  switchMap(params => this.http.get<User>(`/api/users/${params['id']}`)),
  switchMap(user => this.http.get<Order[]>(`/api/orders?userId=${user.id}`)),
  takeUntilDestroyed(),
).subscribe(orders => this.orders = orders);

// ❌ WRONG: switchMap для POST — запит може бути скасований на клієнті,
// але сервер вже виконав операцію
saveForm$ = this.form.valueChanges.pipe(
  debounceTime(1000),
  switchMap(formValue => this.http.post('/api/save', formValue)), // Небезпечно!
);

// ✅ CORRECT: concatMap для write operations — гарантує порядок і не скасовує
saveForm$ = this.form.valueChanges.pipe(
  debounceTime(1000),
  concatMap(formValue => this.http.post('/api/save', formValue)),
);
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Nested subscribe (subscribe inside subscribe) | Memory leaks, no composition, no error propagation, untestable | Higher-order operators: switchMap, concatMap, mergeMap |
| switchMap для POST/PUT/DELETE | Запит скасовується на клієнті, але сервер може вже виконати операцію | concatMap для sequential writes, exhaustMap для submit |
| mergeMap без concurrency parameter | Необмежена паралельність, DDoS свого API, memory pressure | `mergeMap(fn, 5)` — explicit concurrency limit |
| catchError поза switchMap для long-lived потоків | Зовнішній Observable завершується при першій помилці inner | catchError ВСЕРЕДИНІ switchMap: `switchMap(v => inner$.pipe(catchError(...)))` |
| Використання map + switchAll замість switchMap | Зайва складність, тяжче читати | `switchMap(v => obs$)` замість `map(v => obs$), switchAll()` |

## Interview Block

### [L1 — Warm-up] Що таке higher-order mapping operator і навіщо він потрібен?
**Signal being tested:** Чи розуміє кандидат проблему вкладених Observable і базову ідею flattening
**What the interviewer expects:** Пояснення проблеми "Observable of Observables", згадка хоча б switchMap, розуміння що оператор автоматично управляє inner subscriptions
**How to probe deeper:** "Що станеться якщо ви зробите subscribe всередині subscribe? Які проблеми це створить?"
**Reference answer:** Higher-order mapping operator приймає кожне значення з потоку, створює для нього новий Observable, підписується на нього і "розгортає" результати в зовнішній потік. Це потрібно щоб уникнути nested subscribe — switchMap, mergeMap, concatMap, exhaustMap роблять це автоматично з різними стратегіями управління паралельними subscriptions.
**Common mistakes:** Не можуть пояснити чому nested subscribe поганий; плутають map і switchMap

### [L2 — Mid] Коли використовувати switchMap vs concatMap vs mergeMap vs exhaustMap? Наведіть приклади.
**Signal being tested:** Чи може кандидат обрати правильний оператор для конкретної бізнес-задачі і обґрунтувати вибір
**What the interviewer expects:** Чітке розуміння стратегій: cancel previous, queue, parallel, ignore new. Приклади з реальних сценаріїв.
**How to probe deeper:** "Ви використовуєте switchMap для автосейву форми. Які проблеми можуть виникнути?"
**Reference answer:** switchMap — autocomplete, search (скасовує попередній запит). concatMap — послідовні write операції (зберігає порядок). mergeMap — паралельні незалежні операції (з concurrency limit). exhaustMap — submit button (ігнорує повторні кліки). Ключове: switchMap для GET, concatMap/exhaustMap для mutations. mergeMap(fn, 1) еквівалентний concatMap(fn).
**Common mistakes:** switchMap для POST/PUT; mergeMap без concurrency limit; не знають exhaustMap

### [L3 — Senior] Що станеться якщо inner Observable в switchMap кине помилку? Як це впливає на зовнішній потік?
**Signal being tested:** Чи розуміє кандидат Observable Contract і може спроєктувати resilient reactive pipeline
**What the interviewer expects:** Знання що error "вбиває" весь потік, placement catchError всередині vs зовні, вплив на NgRx Effects
**How to probe deeper:** "Як би ви спроєктували utility function що гарантує error-safe higher-order operators для всієї команди?"
**Reference answer:** Error в inner Observable propagate до зовнішнього потоку і завершує його — Observable Contract. Для long-lived потоків catchError ВСЕРЕДИНІ switchMap критичний — він ловить помилку inner і повертає fallback, зберігаючи зовнішній потік живим. В NgRx Effects без внутрішнього catchError effect "помирає" після першої помилки. Рішення: catchError(() => of(failureAction)) або catchError(() => EMPTY).
**Common mistakes:** catchError поза switchMap; не тестують error paths; не знають про "мертві" NgRx Effects

### [L4 — Staff/Principal] Як би ви спроєктували стратегію використання higher-order operators для великого enterprise Angular додатку?
**Signal being tested:** Системне мислення — conventions, enforcement, testing strategy, team education
**What the interviewer expects:** Operator Selection Matrix, ESLint rules, custom wrappers, testing strategy, monitoring, ADR documentation
**How to probe deeper:** "Як ви забезпечите дотримання цих conventions у команді з 20 розробників різного рівня?"
**Reference answer:** 1) Operator Selection Matrix — документоване mapping бізнес-операцій на оператори. 2) Custom operator wrappers з built-in error handling і logging. 3) ESLint rules (rxjs-x) для автоматичного enforcement. 4) Marble testing для timing-critical код. 5) Architecture Decision Records для нестандартних виборів. 6) Performance monitoring — tracking slow inner Observables і error rates. 7) Team training з code review checklist.
**Common mistakes:** Немає team-wide conventions; покладаються тільки на code review без automation; не тестують race conditions

## Summary

### Key Points
- Higher-order operators (switchMap, mergeMap, concatMap, exhaustMap) — це стратегії управління вкладеними Observable subscriptions
- switchMap — cancel previous (search, autocomplete), НЕБЕЗПЕЧНИЙ для write operations
- concatMap — queue sequential (ordered writes, form auto-save)
- mergeMap — parallel з configurable concurrency (batch operations)
- exhaustMap — ignore new while active (submit, login)
- catchError ВСЕРЕДИНІ higher-order operator зберігає зовнішній потік живим
- mergeMap без concurrency limit — потенційний DDoS свого API

### Elevator Pitch (2 minutes)
"Higher-order mapping operators в RxJS вирішують проблему 'потоку потоків' — коли кожне значення потребує нового async операції. Замість nested subscribe, switchMap/mergeMap/concatMap/exhaustMap автоматично управляють inner subscriptions. Ключове — вибір оператора залежить від бізнес-логіки: switchMap скасовує попередній (search), concatMap чекає завершення (writes), mergeMap запускає паралельно (batch), exhaustMap ігнорує нові (submit). Для production-ready коду критично: catchError всередині оператора, concurrency limit для mergeMap, і ніколи switchMap для mutations."
