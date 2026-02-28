---
title: "Zone.js — Async Task Tracking"
block: 9
topic: 1
slug: "zonejs"
difficulty: 4
sinceVersion: "2"
tags: ["Zone.js", "NgZone", "monkey-patching", "async-tracking", "zoneless", "runOutsideAngular"]
relatedTopics: ["cd-mechanism", "onpush-strategy", "zoneless-angular", "signals"]
interviewQuestions:
  - id: "b9t1q1"
    level: "junior"
    question: "Що таке Zone.js і яку роль він відіграє в Angular?"
    referenceAnswers:
      junior: "Zone.js — це бібліотека що дозволяє Angular автоматично запускати change detection після будь-якої асинхронної операції. Без Zone.js Angular не знав би коли оновлювати UI після setTimeout, HTTP запитів або подій."
      mid: "Zone.js реалізує concept execution context що persists через async operations. Він monkey-patches браузерні асинхронні APIs (setTimeout, Promise, fetch, addEventListener) щоб відслідковувати коли async tasks починаються і завершуються. NgZone — Angular's wrapper над Zone.js що сповіщає Angular (через onMicrotaskEmpty, onStable events) коли async queue порожня → Angular запускає change detection. Це дозволяє automatic CD без manual markForCheck() або detectChanges()."
      senior: "Zone.js перехоплює асинхронні APIs через prototype patching (monkey-patching) в момент ініціалізації. Наприклад: window.setTimeout = zonePatchedSetTimeout — зберігає оригінал і додає zone tracking. Коли код виконується в Angular zone, будь-яка async операція реєструється в zone task queue. Після кожного macrotask і коли microtask queue порожня — Zone.js тригерить NgZone.onMicrotaskEmpty() → ApplicationRef.tick() → change detection для всього дерева компонентів. NgZone.runOutsideAngular() — виконати код без zone tracking (не тригерить CD): корисно для expensive animations, polling, WebSocket heartbeats. NgZone.run() — повернутись в Angular zone."
      staff: "Zone.js є одним з найбільших sources of performance issues в Angular apps. Проблема: будь-яка async операція (включно з third-party libs) тригерить full CD tree traversal. MonkeyPatching scope: Zone.js патчить ~30+ browser APIs при load. Для enterprise: third-party libraries що використовують requestAnimationFrame або setInterval активно — наприклад D3, Chart.js — повинні виконуватись поза Angular zone через runOutsideAngular(). Zone.js і SSR: у Node.js zone.js патчить інші APIs — потенційні incompatibilities. Zoneless (Angular 18+ stable): повна відмова від Zone.js — CD тільки через explicit signals або markForCheck(). Zone.js bundle size: ~40KB gzipped — значимий для performance. Майбутнє: Angular team plans to make Zone.js optional по default і eventually deprecate. Zone coalescing (provideZoneChangeDetection({eventCoalescing: true})) — batches multiple async events в один CD cycle — simple performance win."
    commonMistakes:
      - "Думають що Zone.js = Change Detection — це різні речі; Zone.js тільки тригерить CD"
      - "Не знають про runOutsideAngular() — використовують setInterval для polling і навантажують CD"
    relatedQuestions: ["b9t1q2", "b9t1q3"]
  - id: "b9t1q2"
    level: "mid"
    question: "Як і навіщо використовувати NgZone.runOutsideAngular()?"
    referenceAnswers:
      junior: "runOutsideAngular() дозволяє виконати код без Zone.js tracking, тобто без тригера change detection. Корисно для операцій що часто запускаються (setInterval, requestAnimationFrame) але не змінюють UI."
      mid: "NgZone.runOutsideAngular(fn) виконує fn поза Angular zone — async операції всередині не тригерять CD. Після завершення обчислень можна повернутись через NgZone.run(fn) щоб оновити UI. Типові use cases: 1) requestAnimationFrame loops для Canvas/WebGL, 2) setInterval для polling/heartbeat що не змінює Angular state, 3) Third-party animation libraries (GSAP, Lottie), 4) WebSocket messages що batch-обробляються перш ніж оновлювати state, 5) Large data processing (sorting, filtering great datasets)."
      senior: "Правильний pattern: initialize event listeners поза zone, але update Angular state через NgZone.run(). Сучасний підхід: inject(NgZone) або inject(ChangeDetectorRef). Edge case: якщо виконати async code поза zone і потім call NgZone.run() — але в середині run() є ще один async — той вже може повернутись в zone залежно від нesting. Для Angular 18+ Zoneless: runOutsideAngular() стає no-op (нема zone — нема різниці). Альтернатива для simple cases: PLATFORM_BROWSER_ID check і безпосередній platform API call для non-CD-critical UI updates."
      staff: "runOutsideAngular() є критичним для production performance. Benchmark: requestAnimationFrame 60fps = 60 CD cycles per second якщо в zone. Поза zone = 0 extra CD cycles. Для enterprise apps з real-time data: WebSocket message handler поза zone → batch accumulator → NgZone.run() для batch UI update (наприклад кожні 100ms). Це зменшує CD frequency від N messages/sec до 10 updates/sec. Pattern: EventEmitter від third-party lib може тригерити zone — потрібно wrap listener в runOutsideAngular(). Debugging: Chrome DevTools → Performance → Look for frequent 'zone.run' calls — ознака занадто частих CD cycles. Zone flags: zone.js підтримує __Zone_disable_requestAnimationFrame = true перед import для selective disabling. Для новостворених додатків з signals: уникати runOutsideAngular через правильну стратегію (zoneless + signals)."
    commonMistakes:
      - "Викликають runOutsideAngular() для всього коду — UI перестає оновлюватись бо NgZone.run() забули"
      - "Не використовують runOutsideAngular() для animation loops — непотрібна CD навантаження"
    relatedQuestions: ["b9t1q1", "b9t1q3", "b9t2q1"]
  - id: "b9t1q3"
    level: "senior"
    question: "Як Zone.js monkey-patching впливає на production performance і як це діагностувати?"
    referenceAnswers:
      junior: "Zone.js патчує браузерні async APIs, що додає overhead до кожної async операції і може спричинити зайві change detection cycles."
      mid: "Zone.js monkey-patching: кожен setTimeout, Promise.then, addEventListener в Angular zone тригерить CD після виконання. Проблеми: third-party libraries з частими timers (D3 transitions, Chart.js updates) можуть спричинити десятки CD cycles per second. Діагностика: Angular DevTools → Profiler tab → бачити які events тригерять CD і скільки часу займає кожен цикл. Chrome Performance profiler: шукай часті 'ApplicationRef.tick' calls."
      senior: "Zone.js overhead breakdown: 1) Patching overhead (мікро — наносекунди per call), 2) CD trigger overhead (значний — мілісекунди per cycle для великого дерева). Реальна проблема — не patching вартість а кількість CD triggers. Diagnosis workflow: Angular DevTools Profiler → identify high-frequency CD triggers → trace до source async event → move to runOutsideAngular(). Zone.js source maps: помилки через Zone.js можуть мати довгий stack trace — 'zone.js' frames можна filter в Chrome DevTools → Settings → Ignore list. event coalescing: provideZoneChangeDetection({ eventCoalescing: true }) — батчує requestAnimationFrame-based CD замість immediate. Це single performance tweak що може 30-50% зменшити CD frequency для event-heavy apps."
      staff: "Zone.js performance impact в enterprise: 1) Measurement — Angular DevTools change detection profiler shows CD frequency і duration. 2) Key metric: CD cycles per second в idle state повинен бути 0 або близько до 0. 3) Common culprits: a) RouterModule emitting Navigation events → router-outlet CD, b) Angular Material overlays з internal timers, c) Third-party analytics/monitoring SDKs що use setInterval, d) RxJS Subject.next() в zone від WebSocket. Mitigation hierarchy: event coalescing → OnPush everywhere → runOutsideAngular для hotspots → migrate до Zoneless + Signals. Cost-benefit: full Zoneless migration в large app = significant effort; event coalescing = one-line fix з immediate measurable impact. Zone.js tree-shaking: не всі patches потрібні — zone-flags.ts allows selective disabling (disable Promise patching якщо не потрібно)."
    commonMistakes:
      - "Думають що Zone.js сам по собі повільний — проблема в кількості CD triggers, не в overhead Zone.js"
      - "Намагаються виміряти Zone.js overhead мікробенчмарками замість real CD profiling"
    relatedQuestions: ["b9t1q2", "b9t2q1", "b9t3q1"]
  - id: "b9t1q4"
    level: "staff"
    question: "Що означає 'Zoneless Angular' і яка стратегія міграції для існуючих great apps?"
    referenceAnswers:
      junior: "Zoneless Angular — це режим без Zone.js де change detection запускається вручну або через signals, а не автоматично після async операцій."
      mid: "Zoneless Angular (stable в Angular 18) використовує provideExperimentalZonelessChangeDetection() (або provideZonelessChangeDetection() в Angular 18+). Без Zone.js CD запускається тільки через: 1) Signals (computed, effect), 2) markForCheck(), 3) detectChanges(), 4) async pipe (Observable). Переваги: менший bundle (без zone.js ~40KB), передбачувана CD, краща SSR сумісність."
      senior: "Zoneless migration стратегія: 1) Audit all components — чи залежать від implicit Zone.js CD trigger? 2) Додати provideZoneChangeDetection() поряд з поступовою міграцією компонент до OnPush + signals. 3) Enable zoneless і виправляти broken UI один компонент за раз. 4) Найбільші проблемні місця: setTimeout/setInterval в компонентах без markForCheck(), third-party libs що оновлюють Angular state async, event listeners додані напряму (not Angular events). Testing: Angular testing utilities підтримують zoneless — TestBed.configureTestingModule автоматично adapts."
      staff: "Zoneless migration в enterprise (100k+ LOC app): Phase 1 — enable event coalescing, міграція всіх нових компонентів до OnPush + signals. Phase 2 — run app з explicit zone + strict mode (provideZoneChangeDetection({runCoalescing: true})) для identify implicit dependencies. Phase 3 — поступово convert critical paths до zoneless components (Angular 18 supports mixed mode). Phase 4 — після >80% coverage — switch to full zoneless. Timeline: 3-6 місяців для large teams. Testing strategy: E2E tests (Playwright) є golden path — вони виявляють UI не оновлюється після async. Unit tests: triggerFakeAsync → await fixture.whenStable() pattern залишається — але behavior changes без zone. Risk: third-party Angular libraries що не підтримують zoneless — check library changelog. ROI: менший bundle, передбачуваний performance, simplified mental model."
    commonMistakes:
      - "Думають zoneless migration — це просто видалити zone.js import — ламає весь async UI"
      - "Не тестують E2E після migration — unit tests можуть не виявити Zone.js implicit dependencies"
    relatedQuestions: ["b9t1q3", "b9t5q1"]
---

## Core Concept

**English definition:** Zone.js is a JavaScript library that monkey-patches asynchronous browser APIs to create an execution context (a "zone") that persists across asynchronous operations, enabling Angular to automatically trigger change detection after any async task completes.

**Пояснення:** Zone.js — це "шпигун" за асинхронним кодом. Він замінює нативні API (setTimeout, Promise, fetch, addEventListener) своїми версіями що відслідковують: коли async task розпочинається і завершується. Angular підписується на ці події і запускає change detection коли "всі задачі завершено".

**Яку проблему вирішує:** JavaScript однопотоковий і async — після setTimeout() або Promise.resolve() Angular не знає коли код завершив змінювати state. Без Zone.js розробник мав би вручну викликати detectChanges() або markForCheck() після кожної async операції. Zone.js автоматизує це.

**Як працює під капотом:**

1. **Monkey-patching при ініціалізації:** Zone.js при завантаженні замінює нативні APIs патченими версіями. `window.setTimeout = function zonePatchedSetTimeout(fn, delay) { return originalSetTimeout(zone.wrap(fn), delay); }`. zone.wrap(fn) — це wrapper що відслідковує виконання.

2. **Task tracking:** Zone.js розрізняє MacroTask (setTimeout, setInterval), MicroTask (Promise.then), і EventTask (addEventListener). Кожен task реєструється в zone.

3. **NgZone events:** Angular's NgZone expose Observable events: `onUnstable` (перший async task started), `onMicrotaskEmpty` (microtask queue empty), `onStable` (macrotask queue empty і idle).

4. **CD trigger:** Angular підписується на `NgZone.onMicrotaskEmpty` → виклика `ApplicationRef.tick()` → full CD tree traversal.

**Trade-offs та обмеження:**
- ~40KB bundle size для Zone.js
- Monkey-patching є fragile — може конфліктувати з деякими браузерними оновленнями або CSP policies
- Будь-яка async операція в zone тригерить CD — включно з third-party library operations
- Zone.js не підтримує WeakRef або FinalizationRegistry — нові browser APIs потребують патчів

**Версійність:**
- Angular 2: Zone.js як required dependency
- Angular 8: runOutsideAngular() стала більш prominently documented
- Angular 14: Zone.js 0.12 з покращеним Promise patching
- Angular 15-16: provideZoneChangeDetection() для configuration
- Angular 17: Experimental zoneless mode
- Angular 18: Zoneless mode stable (provideZonelessChangeDetection())
- Angular 21: Zoneless recommended for new projects

## Deep Details

### Edge Cases

**Zone.js і Web Workers:** Zone.js не патчить Web Workers (окремий thread без window API). Workers завжди "поза zone".

**Zone.js і AsyncLocalStorage (Node.js):** У SSR context Zone.js може конфліктувати з AsyncLocalStorage — потрібна обережність при SSR.

**Promise.reject() в zone:** Rejected Promise тригерить onMicrotaskEmpty після обробки. Якщо помилку не обробити, вона propagate як zone error і може тригерити зайвий CD.

**Third-party libraries в zone:** Google Maps, Chart.js, D3, Leaflet — всі їхні internal timers і animation loops виконуються в Angular zone якщо ініціалізовані в Angular context. Це найчастіша причина performance problems.

**runOutsideAngular() і event listeners:** Якщо addEventListener виконується поза zone — event callback теж поза zone. Але якщо callback викликає Angular service — CD не тригерується автоматично.

### Junior vs Senior Understanding

**Junior розуміє:** Zone.js автоматично тригерить CD після async операцій. runOutsideAngular() для уникнення цього.

**Senior розуміє:**
- Механізм monkey-patching конкретних APIs
- NgZone events lifecycle (onUnstable, onMicrotaskEmpty, onStable)
- Практичні cases для runOutsideAngular() + NgZone.run()
- Event coalescing як quick win
- Як діагностувати zone-triggered CD performance issues

**Staff розуміє:**
- Zoneless migration strategy і timeline
- Zone.js tree-shaking через zone-flags.ts
- SSR і Zone.js incompatibilities
- Enterprise migration patterns (progressive, risk mitigation)

### Deprecation & Migration Path

**Zone.js becoming optional:**
```typescript
// Current (Zone.js based) — Angular 21
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Zone.js still imported in polyfills.ts
  ],
};

// Zoneless (Angular 18+, recommended for new projects in Angular 21)
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // Remove zone.js from polyfills.ts
  ],
};
```

`polyfills.ts` зміна: видалити `import 'zone.js'` при переході на zoneless.

### Connections to Other Concepts

- **CD Mechanism (b9t2):** Zone.js є trigger mechanism; CD mechanism — це що відбувається після trigger
- **OnPush Strategy (b9t3):** OnPush зменшує scope CD — менше роботи після Zone.js trigger
- **Signals (b9t4):** Signals є альтернативним trigger mechanism що не залежить від Zone.js
- **Zoneless (b9t5):** Повне видалення Zone.js залежності

## Examples

### Basic Usage

```typescript
// Using NgZone for performance optimization
import { Component, NgZone, OnInit, OnDestroy, inject } from '@angular/core';

@Component({
  selector: 'app-realtime-chart',
  standalone: true,
  template: `<canvas #chartCanvas></canvas>`,
})
export class RealtimeChartComponent implements OnInit, OnDestroy {
  private ngZone = inject(NgZone);
  private animationId: number | null = null;

  ngOnInit(): void {
    // Run animation loop OUTSIDE Angular zone to avoid CD on every frame
    this.ngZone.runOutsideAngular(() => {
      const loop = (timestamp: number) => {
        this.renderFrame(timestamp);
        this.animationId = requestAnimationFrame(loop);
      };
      this.animationId = requestAnimationFrame(loop);
    });
  }

  private renderFrame(timestamp: number): void {
    // Canvas rendering — does not need Angular CD
    // Only call NgZone.run() if Angular state changes
    if (this.shouldUpdateAngularState()) {
      this.ngZone.run(() => {
        // This triggers CD — only when needed
        this.updateAngularState();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
```

### Production Scenario

```typescript
// WebSocket service with zone-aware batching
import { Injectable, NgZone, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { bufferTime, filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TradingWebSocketService {
  private ngZone = inject(NgZone);
  private ws: WebSocket | null = null;

  // Private subject — updated OUTSIDE Angular zone
  private priceUpdatesOutsideZone = new Subject<PriceUpdate>();

  // Public observable — batched and pushed back INTO zone every 100ms
  readonly priceUpdates$: Observable<PriceUpdate[]>;

  constructor() {
    // Batch updates: collect all messages for 100ms, then push to Angular zone once
    // Instead of 50 CD cycles/second, we get 10 updates/second
    this.priceUpdates$ = this.priceUpdatesOutsideZone.pipe(
      bufferTime(100),
      filter(updates => updates.length > 0),
    );
  }

  connect(url: string): void {
    // WebSocket initialized OUTSIDE Angular zone
    this.ngZone.runOutsideAngular(() => {
      this.ws = new WebSocket(url);

      this.ws.onmessage = (event) => {
        const update = JSON.parse(event.data) as PriceUpdate;
        // Still OUTSIDE zone — just pushing to Subject
        this.priceUpdatesOutsideZone.next(update);
        // Angular zone triggered only when bufferTime() emits (every 100ms)
        // via async pipe in components subscribing to priceUpdates$
      };
    });
  }
}

interface PriceUpdate { symbol: string; price: number; timestamp: number; }
```

### Anti-Example

```typescript
// WRONG: Everything in Angular zone — performance nightmare
@Component({
  selector: 'app-bad-chart',
  template: `<canvas></canvas>`,
})
export class BadChartComponent implements OnInit, OnDestroy {
  private intervalId: any;

  ngOnInit(): void {
    // WRONG: setInterval in Angular zone — triggers CD every 16ms = 60 CD cycles/second!
    this.intervalId = setInterval(() => {
      this.updateChartData(); // Even if Angular state doesn't change
    }, 16);

    // WRONG: Third-party library initialized inside Angular zone
    // Google Maps, Chart.js etc. will run their internal timers in Angular zone
    const map = new window['google'].maps.Map(document.getElementById('map'));
    // All Google Maps internal animations now trigger Angular CD!
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `setInterval` in component without `runOutsideAngular` | Each interval tick triggers full CD tree traversal — 60 CD cycles/sec for 60fps | Wrap in `ngZone.runOutsideAngular(() => { setInterval(...) })` and use `ngZone.run()` only when Angular state changes |
| Initializing third-party animation/map libraries inside Angular zone | Library's internal timers and rAF loops trigger CD constantly — unmeasurable performance drain | Initialize all third-party libs in `runOutsideAngular()` |
| Removing Zone.js without migrating to signals/markForCheck | UI stops updating after async operations — silent and hard to diagnose | Migrate to signals + OnPush before removing Zone.js, or use provideZonelessChangeDetection() and fix broken views |
| Not using `eventCoalescing: true` in provideZoneChangeDetection | Default Zone.js triggers CD on every individual event — multiple events in one frame = multiple CD cycles | `provideZoneChangeDetection({ eventCoalescing: true })` — one-line performance win |
| Using NgZone.run() inside a loop | Each run() triggers CD — calling it in a loop causes N CD cycles | Collect all state changes, then call NgZone.run() once with all updates applied |

## Interview Block

### [L1 — Warm-up] Що таке Zone.js і яку проблему він вирішує в Angular?

**Signal being tested:** Базове розуміння навіщо Zone.js існує і яка його роль у CD lifecycle.

**What the interviewer expects:** Кандидат пояснює зв'язок між Zone.js і автоматичним CD без вступу в деталі monkey-patching.

**How to probe deeper:** "Що відбудеться якщо видалити Zone.js з Angular app без жодних інших змін?"

**Reference answer:** Zone.js відслідковує асинхронні операції через monkey-patching browser APIs. Він повідомляє Angular коли async operations завершились (мікротаски queue порожня) → Angular запускає change detection. Без Zone.js Angular не знав би коли оновлювати UI після setTimeout, Promise, fetch. Якщо видалити Zone.js без міграції до signals/markForCheck — UI перестане оновлюватись після async operations.

**Common mistakes:** Говорять що Zone.js IS change detection — ні, він тільки triggers CD.

---

### [L2 — Mid] Для чого NgZone.runOutsideAngular() і де його використовувати?

**Signal being tested:** Розуміння performance implications Zone.js і практичне знання оптимізації.

**What the interviewer expects:** Конкретні use cases, і розуміння що після runOutsideAngular() потрібен NgZone.run() для Angular state updates.

**How to probe deeper:** "Напиши WebSocket handler що обробляє повідомлення поза zone але оновлює Angular UI."

**Reference answer:** runOutsideAngular() виконує код без zone tracking — async operations не тригерять CD. Use cases: requestAnimationFrame loops, setInterval для polling, ініціалізація third-party libs (Google Maps, Chart.js), WebSocket message handlers з batch processing. Pattern: `ngZone.runOutsideAngular(() => { setInterval(() => { processData(); ngZone.run(() => { this.updateState(result); }); }, 1000); })`. NgZone.run() потрібен щоб Angular state updates тригерили CD.

**Common mistakes:** Використовують runOutsideAngular() і забувають NgZone.run() — UI не оновлюється.

---

### [L3 — Senior] Як Zone.js monkey-patching впливає на performance і як діагностувати проблеми?

**Signal being tested:** Здатність пов'язати Zone.js mechanics з реальними performance issues і знання tooling для діагностики.

**What the interviewer expects:** Опис що тригерить CD, практичний diagnosis workflow через Angular DevTools, і конкретні optimizations.

**How to probe deeper:** "Як провести performance audit Zone.js impact в реальному production app?"

**Reference answer:** Zone.js monkey-patching призводить до CD trigger після КОЖНОЇ async операції в zone — включно з third-party libs. Diagnosis: Angular DevTools Profiler → identify high-frequency CD triggers → trace до source. Chrome Performance profiler: часті `ApplicationRef.tick` calls. Quick fix: `provideZoneChangeDetection({ eventCoalescing: true })` — батчує events. For specific hotspots: `runOutsideAngular()`. Для third-party libs: initialize поза zone. Metric: CD cycles per second в idle state повинен бути ~0.

**Common mistakes:** Вимірюють monkey-patching overhead мікробенчмарками замість вимірювання CD frequency і duration.

---

### [L4 — Staff/Principal] Яка стратегія міграції до Zoneless Angular для great existing app?

**Signal being tested:** Стратегічне мислення про великі міграції з risk management, phased approach, і team impact.

**What the interviewer expects:** Поетапний план з конкретними кроками, тест стратегією, і risk mitigation.

**How to probe deeper:** "Як виявити всі місця де код implicit залежить від Zone.js CD triggering?"

**Reference answer:** Phased migration: Phase 1 — event coalescing + OnPush для всіх нових компонентів (low risk, immediate benefit). Phase 2 — поступова міграція існуючих компонентів до OnPush + signals, тести E2E як safety net. Phase 3 — enable explicit zone mode, виявляти implicit Zone.js dependencies через broken UI tests. Phase 4 — switch to provideZonelessChangeDetection() і fix remaining issues. Key: E2E tests є golden standard для виявлення broken CD. Third-party lib audit обов'язковий — деякі libs не підтримують zoneless. Timeline для large app: 3-6 місяців.

**Common mistakes:** Намагаються перейти на zoneless без поступової міграції — отримують велику кількість broken UI одночасно.

## Summary

### Key Points

- Zone.js monkey-patches браузерні async APIs (setTimeout, Promise, fetch) щоб відслідковувати async tasks і тригерити Angular CD після їх завершення
- Zone.js IS NOT Change Detection — він тільки triggers CD; сам механізм CD окремий
- NgZone.runOutsideAngular() виключає код з zone tracking → не тригерить CD; NgZone.run() повертає у zone для Angular state updates
- Third-party libs ініціалізовані в zone (Google Maps, Chart.js, D3) виконують internal timers в zone → часті непотрібні CD cycles
- `provideZoneChangeDetection({ eventCoalescing: true })` — простий one-liner що може значно зменшити CD frequency
- Zoneless Angular (stable в Angular 18) повністю усуває Zone.js залежність — CD тільки через signals і explicit markForCheck
- Діагностика: Angular DevTools Profiler → CD frequency і duration → trace до джерела async events

### Elevator Pitch (2 minutes)

Zone.js вирішує фундаментальну проблему: Angular не знає коли async операції (setTimeout, Promise, fetch) завершились і потрібно оновити UI. Zone.js monkey-patches ці API щоб відслідковувати async tasks. Коли всі tasks завершились — NgZone.onMicrotaskEmpty тригерить ApplicationRef.tick() → change detection. Проблема: будь-яка async операція, включно з third-party libs, тригерить full CD traversal. Рішення: runOutsideAngular() для expensive loops, eventCoalescing для батчування, OnPush для обмеження scope. Довгострокове рішення — zoneless Angular (stable Angular 18+) з signals як explicit CD mechanism — менший bundle (~40KB) і передбачуваний performance.
