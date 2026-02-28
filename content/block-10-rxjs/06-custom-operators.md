---
title: "Custom RxJS Operators"
block: 10
topic: 6
slug: "custom-operators"
difficulty: 4
sinceVersion: "6"
tags: ["custom-operators", "pipeable-operators", "MonoTypeOperatorFunction", "OperatorFunction", "operator-composition", "higher-order"]
relatedTopics: ["higher-order-operators", "error-handling-rxjs", "reactive-patterns", "memory-leaks"]
interviewQuestions:
  - id: "b10t6q1"
    level: "junior"
    question: "Що таке pipeable operator у RxJS і як написати простий custom operator?"
    referenceAnswers:
      junior: "Pipeable operator — це функція що приймає Observable і повертає Observable. Custom operator — це функція що повертає таку функцію. Можна написати через pipe() або через нову Observable."
      mid: "Pipeable operator — це функція типу `(source: Observable<T>) => Observable<R>`. Custom operator пишеться двома способами: 1) Composition через pipe: `const myOp = () => (source$) => source$.pipe(op1(), op2())`. 2) Через new Observable для low-level control: `(source$) => new Observable(subscriber => { source$.subscribe({ next, error, complete }) })`. Перший підхід для більшості cases, другий для custom timing або side effects."
      senior: "Правильний тип для custom operator: `function myOp<T>(): MonoTypeOperatorFunction<T>` якщо тип не змінюється, або `OperatorFunction<T, R>` якщо трансформує тип. Composition підхід: `return (source$) => source$.pipe(filter(pred), map(transform), catchError(recovery))`. При написанні через new Observable: потрібно обов'язково повертати teardown function для cleanup: `return () => subscription.unsubscribe()`. Без teardown — memory leak. Для загального використання: дотримуватись naming convention — camelCase, factory function що повертає operator."
      staff: "Custom operators — це абстракція для reusable reactive logic. Архітектурно: 1) Operator library у shared/operators: domain-specific operators (withAuthToken, withTelemetry, retryWithBackoff). 2) Type safety: strict generic constraints гарантують correctness. 3) Testing: кожен custom operator тестується через marble tests незалежно від бізнес логіки. 4) Composition vs Creation: composition-based operators (через pipe) — простіші, більш readable. Creation-based (new Observable) — для timing control, buffering, windowing. 5) Performance: уникати closures що тримають великі об'єкти. 6) RxJS source code підхід: всі вбудовані operators використовують lift() або pipe — composition рекомендована."
    commonMistakes:
      - "Не повертають teardown function у new Observable — memory leak"
      - "Плутають MonoTypeOperatorFunction (T→T) і OperatorFunction (T→R)"
      - "Пишуть operators як classes замість functions"
    relatedQuestions: ["b10t6q2", "b10t6q3"]
  - id: "b10t6q2"
    level: "mid"
    question: "Напишіть custom operator що автоматично додає retry з backoff і логування помилок."
    referenceAnswers:
      junior: "Можна написати функцію що повертає `source$.pipe(retry(3), tap(null, err => console.log(err)))`."
      mid: "```typescript\nfunction retryWithLogging<T>(maxRetries = 3): MonoTypeOperatorFunction<T> {\n  return (source$: Observable<T>) => source$.pipe(\n    retry({ count: maxRetries, delay: (err, attempt) => {\n      console.error(`Retry attempt ${attempt}:`, err);\n      return timer(Math.pow(2, attempt) * 1000);\n    }}),\n    catchError(err => { console.error('All retries failed:', err); return throwError(() => err); })\n  );\n}\n```"
      senior: "Повноцінний operator з configurable options: `function retryWithBackoff<T>(options?: RetryOptions): MonoTypeOperatorFunction<T>`. Опції: maxRetries, baseDelay, maxDelay, shouldRetry (predicate), onRetry callback. Використання tap для logging — без порушення pipeline. shouldRetry дозволяє не retrying 4xx. RetryOptions з defaults через Object.assign. Потрібно generic T для type preservation. Внутрішньо: retry({count, delay}) у RxJS 7 — не retryWhen (deprecated)."
      staff: "Enterprise retry operator: 1) Inject logging service через parameter (не глобальний сервіс). 2) Correlation ID — передати через context або окремий parameter для distributed tracing. 3) Metrics: onRetry callback для Prometheus counter increment. 4) shouldRetry: predicate function що отримує HttpErrorResponse або Error — класифікація transient vs permanent. 5) maxDelay cap — exponential може стати надто великим: `Math.min(Math.pow(2, n) * base, maxDelay)`. 6) Testing: marble tests для кожного retry scenario. 7) Library publication: якщо використовується між командами — publish як окремий npm package з types, tests, docs."
    commonMistakes:
      - "retryWhen у RxJS 7 (deprecated) замість retry({delay})"
      - "Логування через console.log замість injectable LoggingService"
      - "Без shouldRetry predicate — retry client errors"
    relatedQuestions: ["b10t6q1", "b10t6q3"]
  - id: "b10t6q3"
    level: "senior"
    question: "Як написати custom operator через new Observable? Коли це необхідно і що з cleanup?"
    referenceAnswers:
      junior: "new Observable дозволяє написати оператор з нуля, а не через composition. Потрібно manually subscribe до source і передавати значення."
      mid: "new Observable оператор: `(source$) => new Observable(subscriber => { const sub = source$.subscribe({ next: v => subscriber.next(transform(v)), error: e => subscriber.error(e), complete: () => subscriber.complete() }); return () => sub.unsubscribe(); // teardown! })`. Teardown повертається з subscriber factory function — викликається при unsubscribe або complete."
      senior: "Необхідність new Observable: 1) Потрібен доступ до raw Subscriber API (closed property). 2) Власний scheduling — emit значення асинхронно поза RxJS scheduler. 3) Buffering логіка що не виражається через composition. 4) Interop з non-Observable async: WebSocket, EventEmitter, callback API. Cleanup критично: підписка на source ВСЕРЕДИНІ new Observable factory — якщо не unsubscribe в teardown → memory leak. Але є тонкощі: якщо source Observable synchronously complete — teardown може бути викликаний до завершення. isStopped check: `if (!subscriber.closed) subscriber.next(value)` — guard від emit після unsubscribe."
      staff: "new Observable best practices: 1) Завжди перевіряти `subscriber.closed` перед emit. 2) Wrapped async resources (setTimeout, EventListener): зберігати handle і clear у teardown. 3) Error boundaries: обгортати sync code у try-catch якщо може throw: `try { subscriber.next(compute()) } catch(e) { subscriber.error(e) }`. 4) Scheduler use: якщо emit має бути async — `asap.schedule(() => subscriber.next(value))` замість bare emit. 5) Verify no sync emit after async teardown — race condition. 6) Prefer composition: якщо можна виразити через pipe + існуючі operators — так. new Observable — тільки коли composition недостатньо. 7) Testing raw Observable operators: TestScheduler.run({ cold, hot, expectObservable }) — повне marble testing."
    commonMistakes:
      - "Забути teardown function — memory leak при new Observable"
      - "`subscriber.next()` після subscriber.closed — no-op але ознака race condition"
      - "Не обгортають sync code в try-catch — unhandled sync exceptions"
    relatedQuestions: ["b10t6q1", "b10t6q4"]
  - id: "b10t6q4"
    level: "mid"
    question: "Напишіть custom operator `filterNil` що видаляє null і undefined і правильно звужує тип."
    referenceAnswers:
      junior: "filter(v => v !== null && v !== undefined) видаляє null і undefined."
      mid: "```typescript\nfunction filterNil<T>(): OperatorFunction<T | null | undefined, T> {\n  return filter((v): v is T => v !== null && v !== undefined);\n}\n// Usage: obs$.pipe(filterNil()) // type: Observable<NonNullable<T>>\n```"
      senior: "TypeScript type narrowing у custom operator: `filter((v): v is T => ...)` — type predicate що звужує тип у pipe. Без type predicate: `filter(v => v != null)` — тип залишається `T | null | undefined`. З предикатом: тип автоматично звужується до T. Альтернатива: `function filterNil<T>(): OperatorFunction<T | null | undefined, NonNullable<T>> { return filter((v): v is NonNullable<T> => v != null); }`. NonNullable<T> виключає null і undefined з union type. Тест: `of(1, null, 2, undefined, 3).pipe(filterNil())` → `1, 2, 3`."
      staff: "Type-safe operators — критична частина team operator library: 1) filterNil — найбільш поширений, але є варіанти: filterNullable (тільки null, не undefined), assertDefined (throwError якщо nil). 2) Type tests: тестувати не тільки runtime але й TypeScript types — dtslint або expect-type пакети. 3) Generic constraints для safety: `function filterBy<T, K extends keyof T>(key: K, pred: (v: T[K]) => boolean): MonoTypeOperatorFunction<T>`. 4) Compound operators: `filterNilWith<T, R>(mapper: (t: T) => R | null): OperatorFunction<T, R>` — map і filter nil в одній операції. 5) Brand types support: `type UserId = string & { readonly brand: 'UserId' }` — filterNil має працювати з branded types."
    commonMistakes:
      - "filter без type predicate — тип не звужується, TypeScript помилки далі в pipe"
      - "v != null замість v !== null && v !== undefined (хоча != null перевіряє обидва через JavaScript coercion)"
      - "Не тестують TypeScript types — тільки runtime behavior"
    relatedQuestions: ["b10t6q3", "b10t6q5"]
  - id: "b10t6q5"
    level: "staff"
    question: "Як організувати бібліотеку custom operators для enterprise Angular проекту?"
    referenceAnswers:
      junior: "Можна створити файл operators.ts і експортувати всі custom operators звідти."
      mid: "shared/operators/ директорія з окремими файлами для кожного operator. Barrel export через index.ts. Кожен operator — окрема функція з JSDoc документацією. Тести для кожного. README з прикладами."
      senior: "Структура: `libs/rxjs-operators/` у Nx monorepo або `src/shared/operators/`. Кожен operator у власному файлі. Tests у `.spec.ts`. Types файл для shared interfaces. Barrel index.ts. Категоризація: http-operators (retryWithBackoff, addAuthToken), ui-operators (debounceLoadingState, filterNil), state-operators (selectSlice, distinctUntilObjectChanged). Документація: JSDoc з @example. Lint: custom ESLint rule що забороняє використовувати raw retry() і вимагає retryWithBackoff. CI check: всі operators повинні мати 100% test coverage."
      staff: "Enterprise operator library design: 1) Versioning і breaking changes: operator API зміни = semver major. 2) Tree-shakable: кожен operator окремий export — не re-export all. 3) Compatibility matrix: які версії RxJS підтримуються. 4) Operator categories: HTTP resilience, state management, UI helpers, testing utilities. 5) Mock operators для testing: `mockRetryWithBackoff()` що синхронно retry без delay — для unit tests. 6) Performance benchmarks: особливо для operators що у hot paths. 7) Documentation: генерована з TSDoc + Storybook-like playground або StackBlitz links. 8) Review process: pull request для нових operators — потрібна approval від 2 seniors. 9) Deprecation policy: 2 major versions notice. 10) Publish до internal npm registry якщо cross-team usage."
    commonMistakes:
      - "Один великий operators.ts файл — не tree-shakable, важко знайти"
      - "Немає marble tests — operators не перевірені для edge cases"
      - "Не версіонують operator API — breaking changes без notice"
    relatedQuestions: ["b10t6q4", "b10t6q2"]
---

## Core Concept

**English definition:** Custom pipeable operators in RxJS are factory functions that return `OperatorFunction<T, R>` — a function that takes a source Observable and returns a new Observable. They encapsulate reusable reactive logic that can be composed with `pipe()`.

**Пояснення:** RxJS pipeable operator — це чиста функція що трансформує Observable потік. Замість копіювання одного і того самого `pipe(debounceTime(300), distinctUntilChanged(), retry(3))` у кожному компоненті — ми інкапсулюємо це у custom operator: `pipe(withSearch())`. Це DRY principle для реактивних pipeline.

**Яку проблему вирішує:**
- **Code reuse:** Complex operator combinations (retry+backoff+logging) повторюються у проекті — DRY через custom operator
- **Abstraction:** Business logic у operator (`loadWithOptimisticUpdate()`) замість низькорівневого RxJS у компонентах
- **Type safety:** Typed generic operators з type narrowing (filterNil)
- **Testability:** Operator тестується окремо через marble tests

**Як працює під капотом:**

```typescript
// Operator type:
type OperatorFunction<T, R> = (source: Observable<T>) => Observable<R>;
type MonoTypeOperatorFunction<T> = OperatorFunction<T, T>;

// Composition-based (preferred):
function myOperator<T>(config: Config): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) => source$.pipe(
    op1(config.param1),
    op2(config.param2),
  );
}

// Creation-based (for low-level control):
function myOperator<T>(): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) => new Observable<T>(subscriber => {
    const subscription = source$.subscribe({
      next: value => { /* transform */ subscriber.next(value); },
      error: err => subscriber.error(err),
      complete: () => subscriber.complete(),
    });
    // CRITICAL: return teardown for cleanup
    return () => subscription.unsubscribe();
  });
}
```

`pipe()` в Observable просто застосовує кожну operator function до попереднього Observable: `obs.pipe(op1, op2, op3)` ≡ `op3(op2(op1(obs)))`. Чисте function composition.

**Trade-offs та обмеження:**
- Composition-based оператори — зручніші але не дають low-level Subscriber access
- Creation-based — повний контроль, але більше boilerplate і потенційні bugs (teardown)
- Занадто специфічні оператори не reusable — правильний рівень абстракції складний
- TypeScript generics у operators може бути складним для team без TS досвіду

**Версійність:**
- RxJS 5: operators як prototype methods — `observable.map().filter()`
- RxJS 5.5: lettable (pipeable) operators introduced — перший підхід до custom operators
- RxJS 6: `pipe()` API stable — сучасний підхід до custom operators
- RxJS 7: `retryWhen` deprecated, `retry({ delay })` — оновлення custom retry operators
- Angular 6+: pipeable operators рекомендовані

## Deep Details

### Edge Cases

- **Closed subscriber check:** У creation-based operator: emit після unsubscribe — `subscriber.closed` буде `true` після unsubscribe. Перед кожним emit: `if (!subscriber.closed) subscriber.next(value)`.
- **Async teardown race:** Якщо teardown викликається асинхронно (з Promise.then) — subscriber може вже бути closed. Guard через `subscriber.closed`.
- **Error in operator factory:** Помилка під час construction (не execution) operator — `pipe(throwingOp())` — буде uncaught. Тільки помилки при subscribe (execution) входять у Observable error channel.
- **lift() і custom operators:** Старий RxJS підхід через `source.lift(new CustomOperator())` — не рекомендований, внутрішній API. Завжди використовувати composition або new Observable.
- **Type inference у pipe():** TypeScript може не правильно inference generic типи при більш ніж 8 operators у pipe — розбити на два .pipe() або явно annotate типи.

### Junior vs Senior Understanding

**Junior** знає: "custom operator — це функція що повертає функцію від Observable до Observable."

**Senior** розуміє глибину:

1. **MonoTypeOperatorFunction vs OperatorFunction:** `MonoTypeOperatorFunction<T> = OperatorFunction<T, T>`. Тип не змінюється — фільтр, side effects. Якщо трансформує тип — `OperatorFunction<T, R>`. Важливо для type safety у pipe() — TypeScript перевіряє типи між операторами.

2. **Type predicate у filter:** `filter((v): v is T => v !== null)` — TypeScript type narrowing. Без predicate: тип залишається широким. З predicate: звужується. Для filterNil critical — без narrowing весь наступний pipe матиме nullable type.

3. **Teardown і cleanup:** Creation-based operator factory function ПОВИННА повертати teardown. При unsubscribe або complete — teardown викликається. Якщо є setTimeout всередині — clearTimeout у teardown. EventListener — removeEventListener.

4. **Testing у TestScheduler:** Marble testing: `testScheduler.run(({ cold, expectObservable }) => { const source = cold('-a-b-c|'); const result = source.pipe(myOp()); expectObservable(result).toBe('-a-b-c|'); })`. Marble strings визначають timing, Symbols — значення.

### Deprecation & Migration Path

- **lift() based operators:** Не deprecated формально, але internal API. Не використовувати.
- **Prototype-based operators (RxJS 5):** `observable.map()` — не підтримуються в RxJS 6+.
- **retryWhen у custom retry operators:** Замінити на `retry({ delay: function })`:
  ```typescript
  // Old:
  retryWhen(errors => errors.pipe(delay(1000)))
  // New:
  retry({ delay: () => timer(1000) })
  ```
- **pipe() у operator body:** Якщо operator використовує `source.pipe()` — це composition approach. Якщо `source.lift()` — мігрувати.

### Connections to Other Concepts

- **Error Handling (b10t5):** Reusable retry operators використовують catchError/retry.
- **Higher-Order Operators (b10t1):** Custom operators можуть обгортати switchMap/mergeMap для specific semantics.
- **Testing (b18t5):** Marble testing для custom operators.
- **Memory Leaks (b10t2):** Teardown функція у creation-based operators критична.

## Examples

### Basic Usage

```typescript
import { Observable } from 'rxjs';
import { filter, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { OperatorFunction, MonoTypeOperatorFunction } from 'rxjs';

// ✅ Simple composition operator
function debounceSearch(delayMs = 300): MonoTypeOperatorFunction<string> {
  return (source$: Observable<string>) =>
    source$.pipe(
      debounceTime(delayMs),
      distinctUntilChanged(),
      filter(q => q.length >= 2),
    );
}

// ✅ Type-narrowing operator
function filterNil<T>(): OperatorFunction<T | null | undefined, T> {
  return filter((v): v is T => v !== null && v !== undefined);
}

// ✅ Transforming operator
function mapToViewModel<T, VM>(transform: (t: T) => VM): OperatorFunction<T, VM> {
  return (source$: Observable<T>) =>
    source$.pipe(map(transform));
}

// Usage:
searchControl.valueChanges.pipe(
  debounceSearch(400),
).subscribe(query => console.log('Searching:', query));

const ids$ = of(1, null, 2, undefined, 3).pipe(filterNil());
// ids$: Observable<number> — TypeScript knows null/undefined removed
```

### Production Scenario

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError, tap } from 'rxjs/operators';
import { MonoTypeOperatorFunction } from 'rxjs';
import { LoggingService } from './logging.service';

interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (err: HttpErrorResponse) => boolean;
}

// ✅ Reusable retry operator with backoff, logging, and smart error classification
export function retryWithBackoff<T>(
  logger: LoggingService,
  config: RetryConfig = {},
): MonoTypeOperatorFunction<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    shouldRetry = (err) => !err.status || err.status >= 500,
  } = config;

  return (source$: Observable<T>) =>
    source$.pipe(
      retry({
        count: maxRetries,
        delay: (err: HttpErrorResponse, attempt) => {
          if (!shouldRetry(err)) {
            throw err; // Don't retry client errors
          }
          const delay = Math.min(Math.pow(2, attempt) * baseDelayMs, maxDelayMs);
          const jitter = Math.random() * 200;
          logger.warn(`Retry attempt ${attempt}/${maxRetries}`, { delay, err });
          return timer(delay + jitter);
        },
        resetOnSuccess: true,
      }),
      catchError(err => {
        logger.error('All retries exhausted', { err });
        return throwError(() => err);
      }),
    );
}

// ✅ Creation-based operator: rate limiter
export function rateLimit<T>(maxPerSecond: number): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) =>
    new Observable<T>(subscriber => {
      const queue: T[] = [];
      let isProcessing = false;
      const intervalMs = 1000 / maxPerSecond;
      let timerId: ReturnType<typeof setInterval>;

      const processQueue = () => {
        if (queue.length > 0 && !subscriber.closed) {
          subscriber.next(queue.shift()!);
        } else if (queue.length === 0) {
          isProcessing = false;
          clearInterval(timerId);
        }
      };

      const subscription = source$.subscribe({
        next: value => {
          queue.push(value);
          if (!isProcessing) {
            isProcessing = true;
            timerId = setInterval(processQueue, intervalMs);
          }
        },
        error: err => subscriber.error(err),
        complete: () => {
          // Drain queue before completing
          const drain = setInterval(() => {
            if (queue.length === 0) {
              clearInterval(drain);
              subscriber.complete();
            } else {
              processQueue();
            }
          }, intervalMs);
        },
      });

      // ✅ CRITICAL: cleanup both subscription and timer
      return () => {
        subscription.unsubscribe();
        clearInterval(timerId);
      };
    });
}

// Usage in service:
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private logger = inject(LoggingService);

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`).pipe(
      retryWithBackoff(this.logger, { maxRetries: 2 }),
    );
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: Creation-based operator without teardown
function badDebounce<T>(ms: number): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) =>
    new Observable<T>(subscriber => {
      let timer: any;
      // ❌ Missing teardown return — memory leak!
      source$.subscribe(value => {
        clearTimeout(timer);
        timer = setTimeout(() => subscriber.next(value), ms);
        // timer and subscription never cleaned up on unsubscribe
      });
    });
}

// ❌ WRONG: No type predicate — type not narrowed
function badFilterNil<T>(): MonoTypeOperatorFunction<T | null | undefined> {
  return filter(v => v !== null && v !== undefined);
  // subscriber still gets T | null | undefined type after pipe
}

// ❌ WRONG: Using deprecated lift()
function oldStyleOperator() {
  return function(source: Observable<any>) {
    return source.lift({  // Internal API, deprecated
      call(subscriber: any, s: any) { /* ... */ }
    });
  };
}

// ✅ CORRECT: With proper teardown and type narrowing
function goodDebounce<T>(ms: number): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) =>
    new Observable<T>(subscriber => {
      let timerId: ReturnType<typeof setTimeout>;
      const subscription = source$.subscribe({
        next: value => {
          clearTimeout(timerId);
          timerId = setTimeout(() => {
            if (!subscriber.closed) subscriber.next(value);
          }, ms);
        },
        error: err => subscriber.error(err),
        complete: () => {
          clearTimeout(timerId);
          subscriber.complete();
        },
      });
      return () => {
        clearTimeout(timerId); // ✅ Clear timer
        subscription.unsubscribe(); // ✅ Unsubscribe from source
      };
    });
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Creation-based operator без teardown return | Memory leak — таймери і subscriptions не очищаються | Завжди `return () => { subscription.unsubscribe(); clearTimeout(id); }` |
| filter без type predicate для type narrowing | Тип не звужується — nullable types у наступних operators | `filter((v): v is T => v !== null)` — explicit type predicate |
| Operator що робить HTTP call через inject() | DI недоступний у operator function context | Передавати сервіс як параметр до operator factory |
| `source.lift()` для custom operators | Internal deprecated API | Composition через `pipe()` або `new Observable` |
| Один монолітний operators.ts файл | Non-tree-shakable, порушення SRP | Окремий файл кожен operator, barrel export |

## Interview Block

### [L1 — Warm-up] Що таке pipeable operator і як написати простий custom operator?
**Signal being tested:** Чи розуміє кандидат функціональну природу RxJS operators і може написати basic custom operator
**What the interviewer expects:** `(source$) => source$.pipe(...)` pattern, factory function що повертає OperatorFunction, MonoTypeOperatorFunction тип
**How to probe deeper:** "Яка різниця між MonoTypeOperatorFunction і OperatorFunction?"
**Reference answer:** Pipeable operator — `OperatorFunction<T, R> = (source: Observable<T>) => Observable<R>`. Custom operator — factory function що повертає OperatorFunction. Composition підхід: `function myOp(): MonoTypeOperatorFunction<T> { return source$ => source$.pipe(op1(), op2()); }`. MonoTypeOperatorFunction — тип не змінюється (T→T). OperatorFunction — тип трансформується (T→R).
**Common mistakes:** Пишуть operator як клас; не знають typing; плутають composition і creation підходи

### [L2 — Mid] Напишіть custom operator з retry, backoff і логуванням.
**Signal being tested:** Чи може кандидат написати production-ready reusable operator з config, RxJS 7 retry API
**What the interviewer expects:** retry({count, delay}) з RxJS 7, exponential backoff з jitter, shouldRetry predicate, logging через injected service
**How to probe deeper:** "Як передати LoggingService у custom operator якщо inject() не доступний там?"
**Reference answer:** `function retryWithBackoff<T>(logger: LoggingService, config: RetryConfig): MonoTypeOperatorFunction<T> { return source$ => source$.pipe(retry({ count: maxRetries, delay: (err, attempt) => { if (!shouldRetry(err)) throw err; return timer(delay + jitter); }, resetOnSuccess: true }), catchError(err => { logger.error(err); return throwError(() => err); })); }`. Сервіс передається як параметр (не inject — DI context недоступний).
**Common mistakes:** retryWhen (deprecated); inject() у operator function; без jitter; без shouldRetry predicate

### [L3 — Senior] Як написати creation-based operator? Що з cleanup?
**Signal being tested:** Розуміння low-level Observable contract і teardown function requirement
**What the interviewer expects:** `new Observable(subscriber => { ...; return teardown; })` pattern, subscriber.closed guard, async teardown via clearTimeout/removeEventListener, коли composition недостатньо
**How to probe deeper:** "Що станеться якщо не повернути teardown function у new Observable?"
**Reference answer:** Creation-based: `(source$) => new Observable<T>(subscriber => { const sub = source$.subscribe({ next: v => { if (!subscriber.closed) subscriber.next(transform(v)); }, error: e => subscriber.error(e), complete: () => subscriber.complete() }); return () => sub.unsubscribe(); })`. Teardown — cleanup при unsubscribe/complete. Без teardown: subscription живе назавжди — memory leak. subscriber.closed guard: запобігає emit після unsubscribe. Коли використовувати: власне buffering, scheduling, WebSocket interop — коли composition недостатньо.
**Common mistakes:** Без teardown; emit після subscriber.closed; не обгортають sync code у try-catch

### [L4 — Staff/Principal] Як організувати бібліотеку custom operators?
**Signal being tested:** Архітектурне мислення — структура, versioning, testing strategy, team process
**What the interviewer expects:** Nx library structure, категоризація, marble testing, mock operators для unit tests, lint enforcement, tree-shaking, documentation
**How to probe deeper:** "Як забезпечити що команда використовує retryWithBackoff замість raw retry()?"
**Reference answer:** Nx library `libs/rxjs-operators/` з category subfolders: http/, state/, ui/. Barrel exports. Кожен operator: unit file + spec file + JSDoc. Marble testing обов'язковий. Mock operators для unit tests (sync retry). ESLint custom rule що забороняє raw retry() і вимагає retryWithBackoff. CI: 100% coverage for operators. Review: 2 senior approvals для нових operators. Internal npm publish якщо cross-team.
**Common mistakes:** Один файл; немає marble tests; немає mock versions; breaking changes без versioning

## Summary

### Key Points
- Custom operator — factory function що повертає `(source$: Observable<T>) => Observable<R>`
- Composition через `pipe()` — preferred: простіший, readable, менше bugs
- Creation через `new Observable` — для low-level control: власний scheduling, buffering, teardown
- Teardown function ОБОВ'ЯЗКОВО у creation-based operators — cleanup timers, subscriptions
- Type predicates у filter-based operators для TypeScript type narrowing
- Inject services як параметри operator factory — DI context недоступний у operator
- marble testing — стандарт для верифікації timing behavior custom operators

### Elevator Pitch (2 minutes)
"Custom RxJS operators — це reusable reactive logic що інкапсулює складні operator chains. Типова структура: factory function що повертає OperatorFunction — тобто функцію від source Observable до result Observable. Два підходи: composition (через pipe існуючих operators) і creation (через new Observable). Composition — простіший і preferred. Creation — потрібен для власного scheduling або buffering, але ЗАВЖДИ потребує teardown function для cleanup. Практично: filterNil для type-safe null filtering, retryWithBackoff для resilient HTTP, debounceSearch для autocomplete — reusable across all features. Тестуються marble tests незалежно від бізнес логіки."
