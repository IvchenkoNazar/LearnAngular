---
title: "General Computer Science for Frontend"
block: 0
topic: 5
slug: "general-cs"
difficulty: 3
tags: ["algorithms", "data-structures", "big-o", "event-loop", "memory-management", "web-apis"]
relatedTopics: ["typescript-advanced", "anti-patterns"]
interviewQuestions:
  - id: "b0t5q1"
    level: "junior"
    question: "Що таке Event Loop і як він працює в браузері?"
    referenceAnswers:
      junior: "Event Loop — це механізм, який дозволяє JavaScript виконувати асинхронний код, хоча JS є однопоточним. Він перевіряє чи є задачі в черзі і виконує їх по одній."
      mid: "Event Loop координує виконання коду між Call Stack, Task Queue (macrotasks) і Microtask Queue. Коли Call Stack порожній, Event Loop спочатку виконує всі microtasks (Promise.then, queueMicrotask), потім бере одну macrotask (setTimeout, setInterval, DOM events). Це пояснює чому Promise.then виконується раніше за setTimeout(fn, 0)."
      senior: "Event Loop працює в циклі: 1) Виконати всі tasks з Call Stack. 2) Виконати ВСІ microtasks (Promise callbacks, MutationObserver). 3) Якщо потрібен рендеринг — виконати requestAnimationFrame callbacks, recalc styles, layout, paint. 4) Взяти одну macrotask. Важливо: довга microtask queue блокує рендеринг — якщо Promise chain створює нескінченні microtasks, UI зависне. Zone.js патчить setTimeout, Promise, addEventListener щоб перехоплювати async операції — тому Angular знає коли запускати change detection після кожної macrotask."
      staff: "Event Loop — це серце runtime моделі браузера. Для Angular архітектора критично розуміти: 1) Zone.js monkey-patches macrotask і microtask APIs (setTimeout, Promise, fetch, addEventListener) через Zone.current.fork(). Це дозволяє Angular автоматично запускати change detection через ApplicationRef.tick() після кожної async операції. 2) В zoneless Angular з signals — CD тригериться через markForCheck на signal changes, без Zone.js overhead. 3) Long tasks (>50ms) блокують input responsiveness — INP metric. Стратегія: розбивати важкі обчислення через scheduler.yield() або requestIdleCallback. 4) Microtask timing впливає на order of operations — effect() в signals виконується як microtask, що може створити timing issues з DOM access. 5) Web Workers дозволяють offload CPU-intensive tasks, але не мають доступ до DOM — комунікація через postMessage (structured clone algorithm)."
    commonMistakes:
      - "Плутають microtasks і macrotasks — не розуміють пріоритет виконання"
      - "Не знають що Zone.js використовує Event Loop для change detection"
    relatedQuestions: ["b0t5q2", "b0t5q3"]
  - id: "b0t5q2"
    level: "mid"
    question: "Які основні причини memory leaks в Angular SPA і як їх діагностувати?"
    referenceAnswers:
      junior: "Memory leaks виникають коли об'єкти залишаються в пам'яті хоча вже не потрібні. В Angular це часто трапляється через забуті підписки на Observable."
      mid: "Основні причини: 1) Незакриті RxJS subscriptions в компонентах. 2) Event listeners додані через addEventListener без removeEventListener. 3) setInterval/setTimeout без clearInterval/clearTimeout. 4) Closure'и що тримають reference на великі об'єкти. Рішення: takeUntilDestroyed(), async pipe, DestroyRef. Діагностика: Chrome DevTools Memory tab — Heap Snapshots, Allocation Timeline."
      senior: "Memory leaks в SPA накопичуються при навігації — кожен route change може залишати 'zombie' об'єкти. Специфічні Angular причини: 1) Subscriptions без cleanup — рішення: takeUntilDestroyed(this.destroyRef) або async pipe. 2) Zone.js patched callbacks — setInterval зареєстрований в Zone залишається навіть після destroy. 3) Closures в template bindings що тримають reference на component instance. 4) Dynamic components створені через ViewContainerRef без destroy. 5) Third-party libraries з global event listeners. Діагностика: DevTools → Memory → Take Heap Snapshot → навігація → ще snapshot → Compare view. Шукати Detached DOM trees і об'єкти з unexpected Retainer path. Angular DevTools Profiler показує component tree leaks."
      staff: "Memory management в enterprise SPA — це системна проблема. Стратегія: 1) Prevention: ESLint rules для subscription cleanup, mandatory takeUntilDestroyed() або async pipe. 2) Detection: CI pipeline з Playwright + Chrome CDP для automated leak detection — запустити сценарій навігації, порівняти heap size до/після. 3) Monitoring: Performance Observer API в production для tracking memory growth. 4) Architecture: Immutable data patterns (OnPush + readonly) зменшують retained objects. Signal-based reactivity природньо cleanup'ить через effect() з DestroyRef. 5) WeakMap/WeakRef для caches — GC збирає entries коли key більше не referenced. 6) Virtual scrolling (CDK ScrollingModule) для великих списків — не створює DOM nodes для offscreen items. 7) Organizational: memory budget per route, automated regression testing."
    commonMistakes:
      - "Думають що unsubscribe вирішує все — забувають про addEventListener, setInterval, closure references"
      - "Не знають як користуватись Chrome DevTools Memory profiler"
    relatedQuestions: ["b0t5q1", "b0t5q3"]
  - id: "b0t5q3"
    level: "mid"
    question: "Яка роль Big-O нотації в реальних Angular додатках? Наведіть приклади."
    referenceAnswers:
      junior: "Big-O описує як швидкість алгоритму залежить від розміру вхідних даних. O(n) — лінійний, O(n²) — квадратичний."
      mid: "В Angular Big-O важливий для: 1) ngFor/@for з trackBy — без trackBy Angular перестворює DOM для всього списку O(n), з trackBy — оновлює тільки змінені O(k). 2) Фільтрація в компонентах — pipe з O(n) на кожен CD cycle vs computed signal що кешує результат. 3) Пошук — linear search O(n) vs Map.get() O(1). Для списків >1000 елементів різниця помітна на UI."
      senior: "Big-O в Angular контексті: 1) Change Detection — Default strategy перевіряє ВСЕ дерево O(n) де n = кількість bindings. OnPush + Signals скорочує до O(k) де k = dirty subtrees. 2) ngFor trackBy — diff algorithm порівнює масиви. Без trackBy: identity check → все 'нове' → DOM recreate O(n). З trackBy: тільки переміщення та зміни O(n) порівнянь, O(k) DOM операцій. 3) Pipe vs computed: impure pipe виконується на кожен CD cycle — якщо pipe робить sort O(n log n), це може бути катастрофою на великих списках. computed/signal кешує і рахує тільки при зміні source. 4) Virtual Scroll: замість рендерити 10000 items O(n) DOM nodes — тільки visible ~20-50 O(1) відносно total count."
      staff: "Big-O аналіз в enterprise Angular — це performance architecture. 1) Component tree depth: Angular traverses tree при CD — глибина дерева впливає на latency. Flat component architecture vs deeply nested — trade-off між reusability та CD performance. 2) State management: NgRx selectors з memoization — O(1) для unchanged state vs O(n) recomputation. Signal-based stores природньо мемоїзують. 3) Search/filter: для client-side пошуку по 50k+ items — lunr.js з prebuilt index O(1) lookup vs Array.filter O(n). 4) Bundle analysis: tree-shaking — O(n) де n = module graph nodes, dead code elimination saves transfer time. 5) Lazy loading: initial bundle O(1) навіть якщо app має O(n) routes. 6) При code review: виявляти O(n²) patterns — nested loops в templates, subscription в subscription, filter в filter."
    commonMistakes:
      - "Ігнорують Big-O бо 'в UI не має великих даних' — але забувають про change detection frequency"
      - "Не розуміють що impure pipe виконується на КОЖЕН change detection cycle"
    relatedQuestions: ["b0t5q2"]
  - id: "b0t5q4"
    level: "senior"
    question: "Як працює Zone.js під капотом і навіщо Angular його використовує?"
    referenceAnswers:
      junior: "Zone.js — це бібліотека, яку Angular використовує для автоматичного оновлення UI після асинхронних операцій."
      mid: "Zone.js monkey-patches всі async API браузера: setTimeout, Promise, addEventListener, fetch тощо. Кожна async операція виконується в контексті Zone. Angular створює NgZone — fork root zone. Коли будь-яка async операція завершується в NgZone — Angular запускає change detection. Це дозволяє автоматичний UI update без manual trigger."
      senior: "Zone.js — це execution context manager. Він працює через monkey-patching: при завантаженні Zone.js замінює нативні window.setTimeout, Promise.prototype.then, EventTarget.prototype.addEventListener на wrapped версії. Кожен wrapping: 1) Зберігає поточний Zone.current. 2) При виконанні callback — відновлює Zone context. 3) Нотифікує Zone про task lifecycle (scheduled → running → completed). Angular's NgZone — це fork з hooks: onMicrotaskEmpty, onStable, onUnstable. ApplicationRef підписується на onMicrotaskEmpty і викликає tick() → change detection. Проблеми: 1) Performance overhead від patching. 2) Third-party libraries можуть створювати зайві CD cycles. 3) ngZone.runOutsideAngular() для opt-out. Zoneless (provideZonelessChangeDetection) — майбутнє Angular, де signals тригерять CD напряму."
      staff: "Zone.js — це найбільш controversial аспект Angular архітектури. Під капотом: Zone.js використовує JS Proxy-like pattern для async APIs. Він перехоплює ~200+ APIs (window, Node, Cordova, Electron). Структура: Zone.current — linked list of forked zones. Кожна zone має ZoneSpec з hooks: onScheduleTask, onInvokeTask, onHasTask. Angular's NgZone spec відслідковує pending macro/micro tasks і тригерить CD коли всі завершені. Архітектурні implications: 1) Bundle size: zone.js ~13kB gzipped — значна частина polyfills. 2) Debugging: stack traces через zones (long stack traces) — корисно але дорого. 3) SSR: Zone.js потрібен для server-side rendering щоб знати коли page 'stable' для serialization. 4) Migration до zoneless: signal-based components + provideZonelessChangeDetection(). Кожен компонент з signal inputs/outputs та effect() автоматично schedules CD через markForCheck. 5) Hybrid mode: zoneless для нових компонентів, Zone.js для legacy — працює через compatibility layer. 6) Testing: fakeAsync/tick — Zone.js controlled async execution для deterministic tests. Без Zone.js потрібна інша test strategy."
    commonMistakes:
      - "Не знають що Zone.js monkey-patches нативні APIs"
      - "Вважають що zoneless Angular вже production-ready для всіх сценаріїв"
      - "Не розуміють зв'язок між Zone.js і change detection"
    relatedQuestions: ["b0t5q1"]
  - id: "b0t5q5"
    level: "staff"
    question: "Як би ви спроєктували стратегію оптимізації performance для Angular додатку з 100k+ records?"
    referenceAnswers:
      junior: "Використовувати пагінацію або віртуальний скрол для великих списків."
      mid: "Стратегія: 1) Virtual scrolling через CDK ScrollingModule. 2) OnPush change detection для всіх компонентів. 3) trackBy у ngFor. 4) Пагінація на backend. 5) Debounce для пошукових полів. Це зменшує кількість DOM елементів та CD cycles."
      senior: "Комплексна стратегія: 1) Data layer: server-side pagination + cursor-based navigation. Client cache з Map для O(1) lookup. 2) Rendering: CDK virtual scroll з custom strategy для variable height items. trackBy з id для мінімальних DOM mutations. 3) CD: OnPush + signal-based reactivity. computed() для derived state — memoized. 4) Search: prebuilt search index (lunr.js) замість Array.filter. 5) Web Workers для sorting/filtering великих datasets — transferable objects для zero-copy. 6) Bundle: lazy loading feature modules, defer blocks для below-fold content. 7) Profiling: Angular DevTools Profiler для виявлення bottlenecks."
      staff: "Performance optimization для 100k+ records — це multi-layer architecture problem. Layer 1 — Network: GraphQL з cursor pagination, request deduplication, HTTP/2 multiplexing. CDN для static assets. Transfer-Encoding: chunked для streaming responses. Layer 2 — Data: IndexedDB для client-side persistent cache (Dexie.js). Map/Set для in-memory lookups O(1). Immutable data patterns — structural sharing для efficient equality checks. Layer 3 — Rendering: CDK virtual scroll з predictive prefetching (передзавантажувати items за viewport). ResizeObserver для dynamic row heights. CSS containment (contain: strict) для layout isolation. Layer 4 — Computation: Web Workers для heavy transformations. SharedArrayBuffer для shared state між threads (якщо security headers дозволяють). scheduler.yield() для long task breaking. Layer 5 — Monitoring: Custom performance marks, INP tracking, Largest Contentful Paint budget. RUM (Real User Monitoring) з Core Web Vitals dashboard. Layer 6 — Testing: Performance regression tests в CI — Lighthouse CI з budgets, custom playwright tests для scroll performance (maintain 60fps). Organizational: performance budget документ, review checklist, profiling playbook для команди."
    commonMistakes:
      - "Оптимізують тільки frontend — ігнорують backend pagination"
      - "Використовують virtual scroll без trackBy — все одно рекреюються елементи"
      - "Не профілюють перед оптимізацією — оптимізують не те що bottleneck"
    relatedQuestions: ["b0t5q3", "b0t5q4"]
---

## Core Concept

**English definition:** General Computer Science fundamentals — data structures, algorithms, complexity analysis, memory management, and browser runtime model — form the foundation for building performant, scalable frontend applications.

**Пояснення:** CS фундаментали — це не "теорія з університету", а практичний інструментарій для прийняття архітектурних рішень. Знання Event Loop пояснює чому UI зависає. Big-O аналіз показує чому список з 10k items гальмує. Memory management запобігає leaks що накопичуються за годину використання SPA.

**Яку проблему вирішує:** Без CS знань розробник "вгадує" рішення замість обґрунтованого вибору. Чому Map а не Object? Чому virtual scroll а не просто `*ngFor`? Чому `computed()` а не getter? Відповіді — в CS фундаменталах.

**Як працює під капотом:**

Browser runtime model:
1. **Call Stack** — LIFO структура для виконання синхронного коду
2. **Heap** — unstructured memory для об'єктів, closures, DOM nodes
3. **Task Queue (Macrotasks)** — setTimeout, setInterval, I/O, DOM events
4. **Microtask Queue** — Promise callbacks, MutationObserver, queueMicrotask
5. **Event Loop** — координатор: stack empty → drain microtasks → render? → one macrotask → repeat

```
┌───────────────────────────┐
│        Call Stack          │
│   (synchronous execution) │
└─────────┬─────────────────┘
          │ empty?
          ▼
┌───────────────────────────┐
│     Microtask Queue       │ ← Promise.then, queueMicrotask
│   (drain ALL microtasks)  │
└─────────┬─────────────────┘
          │ empty?
          ▼
┌───────────────────────────┐
│    Render (if needed)     │ ← rAF, style/layout/paint
└─────────┬─────────────────┘
          ▼
┌───────────────────────────┐
│    Macrotask Queue        │ ← setTimeout, events, I/O
│   (take ONE macrotask)    │
└───────────────────────────┘
```

**Trade-offs та обмеження:**

- Deep CS knowledge потребує часу — trade-off між "знати ідеально" і "shipping features"
- Over-optimization — premature optimization is the root of all evil (Knuth). Профілюй перед оптимізацією
- Browser APIs еволюціонують — scheduler API, SharedArrayBuffer, OffscreenCanvas змінюють best practices

**Як Angular це використовує:**

- **Zone.js:** Monkey-patches Event Loop APIs (setTimeout, Promise, addEventListener) щоб знати коли async operations завершились → trigger change detection
- **Change Detection:** Traverses component tree — O(n) де n = bindings. OnPush/Signals зменшує до O(k) dirty subtrees
- **Virtual Scroll (CDK):** Використовує Intersection Observer + requestAnimationFrame для efficient rendering
- **Signals:** effect() виконується як microtask — розуміння timing критичне
- **Ivy compiler:** Generates optimized instructions — tree-shaking removes unused code через static analysis

## Deep Details

### Edge Cases

- **Microtask starvation:** Нескінченний ланцюг Promise.then() блокує рендеринг — Event Loop ніколи не дійде до render step. Приклад: recursive promise resolution в effect() може заморозити UI.

```typescript
// ❌ DANGEROUS: infinite microtask loop
const s = signal(0);
effect(() => {
  console.log(s());
  // Якщо щось тут тригерить signal update — нескінченний цикл
});
```

- **WeakRef timing:** WeakRef.deref() може повернути undefined в будь-який момент після GC — не можна покладатись на timing. Корисно для cache, але не для critical references.

- **Structured Clone limitations:** postMessage до Web Worker використовує structured clone — не може передати functions, DOM nodes, Error objects. Map і Set підтримуються з 2022+.

### Junior vs Senior Understanding

**Junior** знає: "є setTimeout, Promise, Event Loop десь працює."

**Senior** розуміє:
- Чому `Promise.resolve().then(fn)` виконується раніше за `setTimeout(fn, 0)` — microtask vs macrotask priority
- Як Zone.js перехоплює async operations через monkey-patching і чому це дорого
- Коли використовувати `ngZone.runOutsideAngular()` для performance-critical loops (animations, scroll handlers)
- Як memory leaks накопичуються через retained closures і event listeners
- Що `trackBy` в `@for` змінює diff algorithm з identity-based на key-based

```typescript
// Senior знає навіщо це потрібно
@Component({...})
export class HeavyListComponent {
  private ngZone = inject(NgZone);

  startAnimation(): void {
    // Виконується ПОЗА Angular Zone — CD не тригериться
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(function animate() {
        // 60fps animation без change detection overhead
        updatePosition();
        requestAnimationFrame(animate);
      });
    });
  }
}
```

### Connections to Other Concepts

- **Change Detection:** Побудований на Event Loop через Zone.js. Zoneless використовує signal notifications замість zone hooks
- **RxJS:** Operators як map, filter — O(1) per emission. Але switchMap з heavy inner observable — потенційний memory issue якщо inner не complete'ає
- **Performance Optimization:** Virtual scroll, lazy loading, Web Workers — всі базуються на CS фундаменталах
- **State Management:** NgRx selectors з memoization — computer science caching principle

## Examples

### Basic Usage

```typescript
// Map vs Object для lookup — O(1) vs O(n) для hasOwnProperty check
// Map — правильний вибір для dynamic key collections

@Injectable({ providedIn: 'root' })
export class EntityCacheService<T extends { id: string }> {
  private cache = new Map<string, T>();

  get(id: string): T | undefined {
    return this.cache.get(id); // O(1)
  }

  set(entity: T): void {
    this.cache.set(entity.id, entity); // O(1)
  }

  getAll(): T[] {
    return [...this.cache.values()]; // O(n) — використовуй тільки коли потрібен повний список
  }

  has(id: string): boolean {
    return this.cache.has(id); // O(1) — не Array.includes(id) який O(n)
  }
}
```

### Production Scenario

```typescript
// Web Worker для heavy computation — не блокує main thread
// worker.ts
addEventListener('message', ({ data }: MessageEvent<{ items: any[]; query: string }>) => {
  const filtered = data.items.filter(item =>
    item.name.toLowerCase().includes(data.query.toLowerCase())
  );
  const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
  postMessage(sorted);
});

// component.ts
@Component({...})
export class SearchComponent {
  private worker = new Worker(new URL('./search.worker', import.meta.url));
  results = signal<any[]>([]);

  constructor() {
    this.worker.onmessage = ({ data }) => {
      this.results.set(data);
    };
  }

  search(query: string, items: any[]): void {
    // Offload to worker — main thread stays responsive
    this.worker.postMessage({ items, query });
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: O(n²) в template — computed property виконує nested loop
@Component({
  template: `
    @for (user of users(); track user.id) {
      <!-- getOrders виконує filter на КОЖЕН user, на КОЖЕН CD cycle -->
      <div>{{ getOrders(user.id).length }} orders</div>
    }
  `
})
export class BadComponent {
  users = signal<User[]>([]);
  orders = signal<Order[]>([]);

  // O(n*m) де n=users, m=orders — на КОЖЕН change detection!
  getOrders(userId: string): Order[] {
    return this.orders().filter(o => o.userId === userId);
  }
}

// ✅ CORRECT: precompute з Map — O(n+m) один раз
@Component({
  template: `
    @for (user of users(); track user.id) {
      <div>{{ ordersByUser().get(user.id)?.length ?? 0 }} orders</div>
    }
  `
})
export class GoodComponent {
  users = signal<User[]>([]);
  orders = signal<Order[]>([]);

  // computed — рахується ОДИН раз при зміні orders, cached
  ordersByUser = computed(() => {
    const map = new Map<string, Order[]>();
    for (const order of this.orders()) {
      const list = map.get(order.userId) ?? [];
      list.push(order);
      map.set(order.userId, list);
    }
    return map;
  });
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Method calls в templates | Виконується на кожен CD cycle — потенційно O(n) * CD frequency | computed signals або pure pipes |
| Nested loops в `@for` без precomputation | O(n²) або гірше, UI lag при великих datasets | Precompute Map/lookup table, один раз |
| Subscription без cleanup | Memory leak, zombie listeners, growing heap | takeUntilDestroyed(), async pipe |
| Array.find/filter для повторного lookup | O(n) на кожен виклик замість O(1) | Map або Set для indexed access |
| setInterval без ngZone.runOutsideAngular | CD тригериться кожен interval tick | runOutsideAngular + manual markForCheck коли потрібно |

## Interview Block

### [L1 — Warm-up] Що таке Event Loop і як він працює в браузері?
**Signal being tested:** Чи розуміє кандидат runtime model браузера чи просто "пише код і воно працює"
**What the interviewer expects:** Знання Call Stack, Task Queue, Microtask Queue. Bonus: зв'язок з Zone.js
**How to probe deeper:** "Чому Promise.then виконується раніше за setTimeout(fn, 0)? Як це впливає на Angular?"
**Reference answer:** Event Loop координує Call Stack, Microtask Queue (promises) і Task Queue (setTimeout, events). Microtasks мають пріоритет. Zone.js патчить ці APIs для Angular change detection.
**Common mistakes:** Плутають micro/macrotasks; не знають про rendering step; не бачать зв'язку з Angular

### [L2 — Mid] Які основні причини memory leaks в Angular SPA і як їх діагностувати?
**Signal being tested:** Чи може кандидат ідентифікувати і виправити production memory issues
**What the interviewer expects:** Знання subscription leaks, event listener leaks, closure references. Знання інструментів діагностики.
**How to probe deeper:** "Як би ви автоматизували detection memory leaks в CI pipeline?"
**Reference answer:** Основні причини: незакриті subscriptions, addEventListener без cleanup, closures з references на великі об'єкти. Рішення: takeUntilDestroyed(), async pipe. Діагностика: Chrome DevTools Heap Snapshots, порівняння до/після навігації.
**Common mistakes:** Знають тільки про unsubscribe; не вміють користуватись DevTools Memory tab

### [L3 — Senior] Як працює Zone.js під капотом і навіщо Angular його використовує?
**Signal being tested:** Deep understanding Angular's runtime — може пояснити магію "автоматичного UI update"
**What the interviewer expects:** Monkey-patching, NgZone fork, onMicrotaskEmpty → tick(), runOutsideAngular
**How to probe deeper:** "Як Angular працюватиме без Zone.js? Що таке zoneless change detection?"
**Reference answer:** Zone.js monkey-patches ~200 async APIs. NgZone — fork з hooks. Коли microtask queue порожня — ApplicationRef.tick(). Zoneless: signals тригерять CD через markForCheck напряму. runOutsideAngular для opt-out performance-critical коду.
**Common mistakes:** Не знають про monkey-patching; вважають zoneless вже production-ready для всіх випадків

### [L4 — Staff/Principal] Як би ви спроєктували стратегію оптимізації performance для Angular додатку з 100k+ records?
**Signal being tested:** System-level thinking — multi-layer optimization, не просто "додати virtual scroll"
**What the interviewer expects:** Network layer (pagination, caching), data layer (Map/Set, IndexedDB), rendering (virtual scroll, CDK), computation (Web Workers), monitoring (Core Web Vitals), organizational (budgets, processes)
**How to probe deeper:** "Як би ви виміряли ROI цих оптимізацій і пріоритизували їх?"
**Reference answer:** Multi-layer: 1) Network — cursor pagination, CDN. 2) Data — Map для O(1) lookup, IndexedDB cache. 3) Rendering — virtual scroll з prefetching, CSS containment. 4) Computation — Web Workers, scheduler.yield(). 5) Monitoring — Core Web Vitals, performance budgets в CI. 6) Org — performance review checklist, regression tests.
**Common mistakes:** Фокусуються тільки на frontend; не профілюють перед оптимізацією; ігнорують monitoring

## Summary

### Key Points
- Event Loop: microtasks (Promise) мають пріоритет над macrotasks (setTimeout) — Zone.js це використовує для CD
- Memory leaks в SPA накопичуються — subscription cleanup через takeUntilDestroyed() обов'язковий
- Big-O важливий в Angular: trackBy перетворює O(n) DOM recreation на O(k) updates
- Map/Set для O(1) lookup замість Array.find/filter O(n) — особливо в computed signals
- Zone.js monkey-patches async APIs — zoneless з signals це майбутнє Angular
- Web Workers для CPU-intensive tasks — main thread залишається responsive
- Профілюй перед оптимізацією — Chrome DevTools, Angular DevTools Profiler

### Elevator Pitch (2 minutes)
"CS фундаментали — це не теорія, а щоденний інструмент Angular розробника. Event Loop пояснює як Zone.js автоматично тригерить change detection. Big-O аналіз показує чому trackBy і computed signals критичні для performance. Memory management запобігає leaks через proper subscription cleanup. Map та Set дають O(1) lookup замість O(n) Array.filter. Для enterprise SPA з великими datasets — multi-layer optimization: server pagination, client caching з IndexedDB, virtual scroll, Web Workers для computation, і performance monitoring в CI. Профілювання завжди перед оптимізацією."
