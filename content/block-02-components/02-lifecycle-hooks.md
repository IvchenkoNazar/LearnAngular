---
title: "Lifecycle Hooks"
block: 2
topic: 2
slug: "lifecycle-hooks"
difficulty: 3
sinceVersion: "2"
tags: ["lifecycle", "ngOnInit", "ngOnChanges", "ngOnDestroy", "afterRender", "DestroyRef"]
relatedTopics: ["component-metadata", "input-output", "change-detection", "signals"]
interviewQuestions:
  - id: "b2t2q1"
    level: "junior"
    question: "В якому порядку виконуються lifecycle hooks в Angular і для чого потрібен ngOnInit?"
    referenceAnswers:
      junior: "Порядок: constructor, ngOnChanges, ngOnInit, ngDoCheck, ngAfterContentInit, ngAfterContentChecked, ngAfterViewInit, ngAfterViewChecked, ngOnDestroy. ngOnInit використовується для ініціалізації після того як Angular встановить Input-и."
      mid: "Constructor викликається DI контейнером — в цей момент Input-и ще undefined. ngOnChanges спрацьовує першим (якщо є Input-и), потім ngOnInit — один раз. ngDoCheck — кожен CD cycle. ngAfterContentInit/Checked — після ng-content проєкції. ngAfterViewInit/Checked — після рендерингу child views. ngOnDestroy — cleanup. ngOnInit — головне місце для ініціалізації: Input-и вже доступні, DI resolved."
      senior: "Порядок виконання привʼязаний до фаз rendering pipeline Ivy. Constructor — це DI phase, не Angular lifecycle. ngOnChanges отримує SimpleChanges з firstChange flag — викликається ДО ngOnInit при першому CD і ПЕРЕД кожним наступним CD якщо Input змінився. ngDoCheck — hook для custom CD logic (рідко потрібен). Content hooks — після content projection resolution. View hooks — після view rendering. Важливо: afterViewInit/Checked мають unidirectional data flow constraint — зміна стану тут викличе ExpressionChangedAfterItHasBeenCheckedError. З Angular 16+ afterRender/afterNextRender замінюють afterViewInit для DOM manipulation."
      staff: "Lifecycle hooks — це synchronization points з Ivy rendering pipeline. Порядок визначається traversal order: depth-first для creation hooks (init), bottom-up для view hooks. В production-архітектурі: ngOnInit для imperative initialization (хоча signals/computed зменшують потребу), ngOnDestroy (або краще DestroyRef) для cleanup. afterRender з phase API (read/write) — це performance-critical для DOM measurements: read phase збирає layout info, write phase мутує DOM, уникаючи layout thrashing. При проєктуванні component library: мінімізувати lifecycle hooks, максимізувати declarative reactivity (signals, computed). Lifecycle hooks створюють temporal coupling — signal-based computed створює data coupling що легше reasoning."
    commonMistakes:
      - "Роблять HTTP запити в constructor замість ngOnInit"
      - "Не знають про afterRender/afterNextRender"
    relatedQuestions: ["b2t2q2", "b2t2q3"]
  - id: "b2t2q2"
    level: "mid"
    question: "Чому не варто робити ініціалізацію в constructor? Яка різниця між constructor і ngOnInit?"
    referenceAnswers:
      junior: "В constructor ще немає значень Input-ів, тому ініціалізацію роблять в ngOnInit. Constructor — для DI."
      mid: "Constructor викликається JavaScript runtime при створенні екземпляру класу — це частина DI процесу. В цей момент Angular ще не встановив @Input значення, не виконав content projection, view ще не створений. ngOnInit викликається Angular framework після першого ngOnChanges — Input-и вже мають значення. Constructor використовується тільки для inject() або DI через параметри."
      senior: "Constructor — це TypeScript/JavaScript концепт, не Angular lifecycle hook. DI resolver створює instance через constructor, потім Angular pipeline починає встановлювати Input-и. З signal inputs: input() initializer виконується при declaration, але значення від parent доступне після першого CD. Constructor підходить для: inject() calls, ініціалізації non-Angular properties. ngOnInit підходить для: logic що залежить від Input значень, підписки на observables (хоча effect() кращий для signals). Важливий нюанс: в тестах MockBuilder може викликати constructor без Angular — ngOnInit гарантує Angular context."
      staff: "Ця різниця стає менш важливою з signals. input.required<T>() не має default — до першого CD це ReadonlySignal<T> що кине помилку при read. computed() і effect() замінюють більшість ngOnInit use cases: computed автоматично реагує на input зміни, effect виконує side effects. Архітектурно: якщо компонент потребує складний ngOnInit з imperative logic — це code smell, сигнал для refactoring до reactive approach. В testing: ngOnInit тестується через fixture.detectChanges(), constructor — через new Component(). Для migration legacy code: ngOnInit → effect(onCleanup => {...}) дає і init і cleanup в одному місці. Constructor injection через inject() function (не параметри) — сучасний pattern що працює в functions, не тільки classes."
    commonMistakes:
      - "Підписуються на Observable в constructor"
      - "Вважають що signal inputs мають значення в constructor"
    relatedQuestions: ["b2t2q1", "b2t3q1"]
  - id: "b2t2q3"
    level: "senior"
    question: "Як правильно робити cleanup в компоненті? ngOnDestroy vs DestroyRef vs takeUntilDestroyed."
    referenceAnswers:
      junior: "ngOnDestroy викликається коли компонент видаляється. Там потрібно відписуватись від підписок і очищати таймери."
      mid: "ngOnDestroy — класичний спосіб cleanup. DestroyRef (Angular 16+) — injectable reference що дозволяє зареєструвати cleanup callback через onDestroy(). takeUntilDestroyed() — RxJS operator що автоматично complete'ить Observable при destroy компонента. DestroyRef кращий бо працює в services і functions, не тільки в components."
      senior: "ngOnDestroy потребує imperative management: зберігати Subscription, вручну unsubscribe. DestroyRef.onDestroy() — callback-based, можна викликати з inject() контексту (constructor, field initializer). takeUntilDestroyed() з @angular/core/rxjs-interop — найелегантніший для RxJS pipes, автоматично отримує DestroyRef через inject(). Важливо: takeUntilDestroyed() без параметрів працює ТІЛЬКИ в injection context — якщо викликати в ngOnInit треба передати DestroyRef явно. effect() автоматично cleanup'ить при destroy — не потрібен manual management. Для async: AbortController signal з DestroyRef для fetch cancellation."
      staff: "Cleanup strategy повинна бути consistent для всього проєкту. Рекомендація: 1) Signals + computed для reactive state — автоматичний cleanup. 2) effect() для side effects — cleanup через onCleanup callback. 3) takeUntilDestroyed() для legacy RxJS code. 4) DestroyRef.onDestroy() для imperative cleanup (DOM listeners, third-party library teardown). Архітектурно: якщо компонент має 5+ subscriptions в ngOnDestroy — це code smell для refactoring до reactive patterns. В testing: DestroyRef можна мокати для unit tests без Angular TestBed. Для shared services: DestroyRef scope залежить від injector lifetime — route-level service destroy при navigation, root-level — при app destroy. memory leak prevention: ESLint rule для subscription без cleanup."
    commonMistakes:
      - "Забувають відписатись від Observable — memory leak"
      - "Використовують takeUntilDestroyed() поза injection context"
    relatedQuestions: ["b2t2q1", "b2t2q5"]
  - id: "b2t2q4"
    level: "senior"
    question: "Як працює ngOnChanges і SimpleChanges? Коли він не спрацює?"
    referenceAnswers:
      junior: "ngOnChanges викликається коли @Input значення змінюються. SimpleChanges містить старе і нове значення."
      mid: "ngOnChanges приймає SimpleChanges об'єкт з ключами що відповідають іменам Input-ів. Кожен SimpleChange має currentValue, previousValue, firstChange, isFirstChange(). Викликається ДО ngOnInit при першому CD і перед кожним CD де Input змінився. Не спрацює якщо Input — object і мутувався без зміни reference."
      senior: "ngOnChanges використовує reference equality check (===) для визначення зміни. Мутація object/array property не тригерить hook — потрібна нова reference. SimpleChanges не typed — currentValue/previousValue мають тип any (можна створити typed wrapper). ngOnChanges викликається для ВСІХ змінених Input-ів одночасно — один виклик з кількома keys в SimpleChanges. З signal inputs: ngOnChanges НЕ викликається — signal inputs не інтегруються з legacy lifecycle. Замість ngOnChanges + SimpleChanges: використовуйте effect() що реагує на signal input зміни. ngOnChanges не викликається коли Input встановлюється programmatically через ViewChild."
      staff: "ngOnChanges — це legacy reactivity primitive. В новому коді: signal inputs + computed/effect повністю замінюють ngOnChanges з кращою ergonomics і type safety. SimpleChanges не generic — це design limitation з Angular 2 що неможливо виправити без breaking change. При міграції legacy ngOnChanges: 1) Визначити які inputs тригерять яку логіку. 2) Замінити на signal inputs. 3) Створити computed для derived state. 4) effect() для side effects. Патерн порівняння values в ngOnChanges (if changes['userId'] && !changes['userId'].firstChange) — це imperative опис reactive dependency graph що signals виражають декларативно. В component library: ngOnChanges все ще потрібен для backward compatibility з non-signal consumers, але internal logic повинна бути signal-based."
    commonMistakes:
      - "Не перевіряють firstChange і виконують логіку зайвий раз"
      - "Очікують що ngOnChanges спрацює при мутації object"
    relatedQuestions: ["b2t2q1", "b2t3q1"]
  - id: "b2t2q5"
    level: "senior"
    question: "Що таке afterRender/afterNextRender і коли їх використовувати замість ngAfterViewInit?"
    referenceAnswers:
      junior: "afterRender виконується після кожного рендерингу компонента, afterNextRender — тільки після наступного."
      mid: "afterRender (Angular 16+) — callback що виконується після кожного rendering cycle. afterNextRender — одноразовий callback після наступного render. Вони замінюють ngAfterViewInit для DOM manipulation. Перевага: працюють тільки в browser (не в SSR), мають phase API для уникнення layout thrashing."
      senior: "afterRender/afterNextRender вирішують проблеми ngAfterViewInit: 1) SSR safety — не виконуються на сервері (ngAfterViewInit виконується). 2) Phase API: EarlyRead, Write, MixedReadWrite, Read — дозволяє batch DOM operations для уникнення layout thrashing. 3) afterRender виконується після КОЖНОГО CD cycle, не тільки першого. 4) Працюють з inject() — можна використовувати в services. afterNextRender — ідеальний для ініціалізації third-party DOM libraries (charts, maps). Callback отримує onCleanup для teardown. Важливо: afterRender callbacks виконуються ПОЗА Angular zone — зміни state всередині не тригерять автоматичний CD."
      staff: "afterRender з phase API — це Angular відповідь на layout thrashing проблему. Phases виконуються в порядку: EarlyRead → Write → MixedReadWrite → Read. Це дозволяє batch DOM reads і writes across all components в одному frame. Для performance-critical UI (virtual scroll, animation, resize observers): afterRender з Read phase для measurements, Write phase для DOM updates. В SSR/hydration контексті: afterNextRender — єдине безпечне місце для browser-only initialization (localStorage, window APIs). Архітектурно: afterRender замінює потребу в ngAfterViewChecked (який був anti-pattern для більшості use cases). Для component library: afterRender дозволяє composable DOM behavior — можна створити utility function що encapsulate DOM measurement pattern і reuse across components. Migration від ngAfterViewInit: не завжди 1:1 — ngAfterViewInit має доступ до ViewChild results, afterNextRender може потребувати signal queries."
    commonMistakes:
      - "Використовують ngAfterViewInit для DOM operations в SSR-додатку"
      - "Не використовують phase API і створюють layout thrashing"
    relatedQuestions: ["b2t2q1", "b2t2q3"]
---

## Core Concept

**English definition:** Lifecycle hooks are interface methods that Angular calls at specific moments during a component's creation, change detection, and destruction — giving developers control over initialization, reactivity, rendering, and cleanup.

**Пояснення:** Lifecycle hooks — це "контрольні точки" в житті компонента. Angular гарантує порядок їх виклику: спочатку створення (constructor → ngOnChanges → ngOnInit), потім перевірка змін (ngDoCheck, afterContent*, afterView*), і нарешті знищення (ngOnDestroy). Кожен hook має чітку зону відповідальності.

**Яку проблему вирішує:** Компонент не існує миттєво — він створюється, отримує дані, рендериться, оновлюється, знищується. Hooks дозволяють виконати правильну логіку в правильний момент: ініціалізація коли Input-и готові, cleanup коли компонент зникає, DOM manipulation коли view відрендерений.

**Як працює під капотом:**

1. DI створює instance (constructor)
2. Ivy renderer виконує `refreshView()` — перший CD cycle
3. Input bindings встановлюються — `ngOnChanges(SimpleChanges)` якщо є Input-и
4. `ngOnInit()` — одноразово
5. `ngDoCheck()` — кожен CD cycle
6. Content projection resolves — `ngAfterContentInit()` (раз) → `ngAfterContentChecked()` (кожен CD)
7. View rendering — `ngAfterViewInit()` (раз) → `ngAfterViewChecked()` (кожен CD)
8. afterRender/afterNextRender callbacks (browser only)
9. При видаленні — `ngOnDestroy()`, DestroyRef callbacks

```typescript
@Component({
  selector: 'app-user-profile',
  template: `<h1>{{ user().name }}</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfile implements OnInit, OnDestroy {
  user = input.required<User>();
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // Signal inputs доступні — можна читати user()
    console.log('User:', this.user().name);
  }

  ngOnDestroy() {
    console.log('Cleanup');
  }
}
```

**Trade-offs та обмеження:**

- ngAfterViewInit/Checked — зміна state тут викликає ExpressionChangedAfterItHasBeenCheckedError
- ngDoCheck викликається ДУЖЕ часто — performance critical код тут небезпечний
- ngOnChanges не працює з signal inputs — потрібен перехід на effect()
- afterRender виконується поза zone — state changes потребують explicit notification

**Версійність:**
- Angular 2: всі class-based lifecycle hooks
- Angular 16: afterRender, afterNextRender, DestroyRef, takeUntilDestroyed
- Angular 17: afterRender phase API (earlyRead, write, mixedReadWrite, read)
- Angular 18: afterRender stabilized
- Angular 19: signal-based approach зменшує потребу в lifecycle hooks

## Deep Details

### Edge Cases

- **ngOnChanges не викликається для signal inputs:** Signal inputs обходять legacy lifecycle — використовуйте effect() або computed().
- **afterViewInit + ExpressionChangedAfterItHasBeenCheckedError:** Зміна bound property в ngAfterViewInit тригерить помилку в dev mode. Workaround: використовуйте signal + afterNextRender, або setTimeout (anti-pattern).
- **ngOnDestroy не викликається при browser close/refresh:** Тільки при Angular-managed видаленні. Для cleanup при close — використовуйте `window.onbeforeunload`.
- **DestroyRef scope:** В route-level service — destroy при навігації. В root service — destroy при app shutdown (рідко).

### Junior vs Senior Understanding

**Junior** знає: "ngOnInit для ініціалізації, ngOnDestroy для cleanup."

**Senior** розуміє: Lifecycle hooks — це synchronization points з render pipeline. Кожен hook має strict timing guarantees: ngOnChanges ДО ngOnInit, afterContentInit ДО afterViewInit. Senior використовує afterRender з phase API для DOM manipulation, DestroyRef для composable cleanup, і signals для зменшення залежності від lifecycle hooks взагалі.

```typescript
// Modern approach — мінімум lifecycle hooks
@Component({
  selector: 'app-chart',
  template: `<canvas #canvas></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent {
  data = input.required<ChartData>();
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private chart: Chart | null = null;

  constructor() {
    // Reactive: перемалювати chart при зміні data
    effect(() => {
      const chartData = this.data();
      if (this.chart) {
        this.chart.update(chartData);
      }
    });

    // DOM init — browser only, one-time
    afterNextRender(() => {
      this.chart = new Chart(this.canvas().nativeElement, {
        data: this.data(),
      });
    });

    // Cleanup
    inject(DestroyRef).onDestroy(() => {
      this.chart?.destroy();
    });
  }
}
```

### Deprecation & Migration Path

- **De facto deprecated:** ngDoCheck — рідко потрібен з signals і OnPush
- **De facto deprecated:** ngAfterViewChecked — замінюється afterRender
- **Migration:**
  - `ngOnInit` → field initializer + `effect()` (для signal-based components)
  - `ngOnChanges` → `effect()` або `computed()` з signal inputs
  - `ngAfterViewInit` → `afterNextRender()` для DOM
  - `ngOnDestroy` → `DestroyRef.onDestroy()` або `takeUntilDestroyed()`

### Connections to Other Concepts

- **Change Detection:** Hooks виконуються як частина CD cycle — OnPush впливає на частоту
- **Signal Inputs:** Не тригерять ngOnChanges — потрібен effect()
- **Content Projection:** afterContentInit/Checked пов'язані з ng-content resolution
- **ViewChild/ContentChild:** Доступні починаючи з afterViewInit/afterContentInit (або через signal queries)

## Examples

### Basic Usage

```typescript
@Component({
  selector: 'app-timer',
  template: `<p>Elapsed: {{ elapsed() }}s</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Timer {
  elapsed = signal(0);

  constructor() {
    afterNextRender(() => {
      const interval = setInterval(() => {
        this.elapsed.update(v => v + 1);
      }, 1000);

      inject(DestroyRef).onDestroy(() => clearInterval(interval));
    });
  }
}
```

### Production Scenario

```typescript
// Intersection Observer з afterRender і DestroyRef
@Component({
  selector: 'app-lazy-image',
  template: `
    @if (isVisible()) {
      <img [src]="src()" [alt]="alt()" />
    } @else {
      <div class="placeholder" #placeholder></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LazyImage {
  src = input.required<string>();
  alt = input('');

  isVisible = signal(false);
  private placeholder = viewChild<ElementRef>('placeholder');

  constructor() {
    afterNextRender({
      read: () => {
        const el = this.placeholder()?.nativeElement;
        if (!el) return;

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              this.isVisible.set(true);
              observer.disconnect();
            }
          },
          { threshold: 0.1 }
        );

        observer.observe(el);
        inject(DestroyRef).onDestroy(() => observer.disconnect());
      },
    });
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: State change in ngAfterViewInit
@Component({
  selector: 'app-bad',
  template: `<p>{{ title }}</p>`,
})
export class BadComponent implements AfterViewInit {
  title = 'Loading...';

  ngAfterViewInit() {
    this.title = 'Loaded!'; // ExpressionChangedAfterItHasBeenCheckedError!
  }
}

// ✅ CORRECT: Signal + afterNextRender
@Component({
  selector: 'app-good',
  template: `<p>{{ title() }}</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodComponent {
  title = signal('Loading...');

  constructor() {
    afterNextRender(() => {
      this.title.set('Loaded!');
    });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| HTTP call в constructor | Input-и недоступні, тести ускладнені | effect() з signal inputs або ngOnInit |
| Багато логіки в ngDoCheck | Викликається кожен CD cycle — performance hit | OnPush + signals замість custom dirty checking |
| ngAfterViewChecked для DOM measurements | Виконується кожен CD — layout thrashing | afterRender з Read phase |
| Manual subscription tracking в масиві | Boilerplate, легко забути unsubscribe | takeUntilDestroyed() або DestroyRef |
| ngOnChanges з великим switch/if | Imperative reactivity, складний для розуміння | Signal inputs + computed/effect |

## Interview Block

### [L1 — Warm-up] В якому порядку виконуються lifecycle hooks?
**Signal being tested:** Базове розуміння component lifecycle
**What the interviewer expects:** Правильний порядок, розуміння навіщо ngOnInit окремо від constructor
**How to probe deeper:** "Коли ngOnChanges викликається відносно ngOnInit?"
**Reference answer:** constructor → ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked → ngOnDestroy. ngOnInit — для ініціалізації коли Input-и готові.
**Common mistakes:** Плутають порядок content і view hooks; не знають що ngOnChanges ДО ngOnInit

### [L2 — Mid] Чому ініціалізацію роблять в ngOnInit а не в constructor?
**Signal being tested:** Розуміння DI lifecycle vs Angular lifecycle
**What the interviewer expects:** Input-и доступні в ngOnInit, constructor — тільки DI, тестування
**How to probe deeper:** "А з signal inputs — чи потрібен ngOnInit?"
**Reference answer:** Constructor — DI phase, Angular ще не встановив Input-и. ngOnInit — Angular lifecycle, Input-и мають значення. З signals: effect() і computed() зменшують потребу в ngOnInit, бо реагують на signal changes автоматично.
**Common mistakes:** Вважають що Input-и доступні в constructor; не знають про inject() function

### [L3 — Senior] Як правильно робити cleanup? ngOnDestroy vs DestroyRef vs takeUntilDestroyed.
**Signal being tested:** Cleanup strategy awareness, modern API knowledge
**What the interviewer expects:** Порівняння підходів, розуміння injection context, composability
**How to probe deeper:** "Як takeUntilDestroyed() працює всередині ngOnInit?"
**Reference answer:** ngOnDestroy — imperative, тільки в класах. DestroyRef — injectable, працює в services і functions. takeUntilDestroyed() — для RxJS pipes, потребує injection context (або explicit DestroyRef). effect() має auto-cleanup. Рекомендація: signals для reactive, DestroyRef для imperative cleanup.
**Common mistakes:** takeUntilDestroyed() поза injection context; забувають cleanup в services

### [L4 — Staff] Як afterRender phase API оптимізує DOM operations і як це впливає на архітектуру?
**Signal being tested:** Deep rendering pipeline knowledge, performance architecture
**What the interviewer expects:** Phase ordering, layout thrashing prevention, SSR implications, composable utilities
**How to probe deeper:** "Як би ви створили reusable resize observer utility з afterRender?"
**Reference answer:** afterRender phases: EarlyRead → Write → MixedReadWrite → Read. Batching reads і writes across components prevents layout thrashing. SSR safe — не виконується на сервері. Дозволяє створювати composable DOM utilities: injectResize(), injectIntersection(). Замінює ngAfterViewInit/Checked для DOM. Phase callbacks виконуються outside zone — потрібен explicit signal update для CD notification.
**Common mistakes:** Ігнорують phases, роблять read+write в одному callback; забувають про SSR

## Summary

### Key Points
- Lifecycle hooks виконуються в строгому порядку: creation → content → view → destroy
- ngOnInit — ініціалізація після Input binding, constructor — тільки DI
- ngOnChanges працює з @Input() але НЕ з signal inputs — effect() як заміна
- afterRender/afterNextRender (v16+) — безпечна альтернатива ngAfterViewInit для DOM
- Phase API (read/write) запобігає layout thrashing
- DestroyRef + takeUntilDestroyed() — сучасний cleanup замість ngOnDestroy
- Signals + computed + effect зменшують потребу в lifecycle hooks загалом

### Elevator Pitch
"Lifecycle hooks дають контроль над ключовими моментами життя компонента. ngOnInit для ініціалізації, ngOnDestroy для cleanup — це класика. Але з Angular 16+ з'явились кращі альтернативи: afterRender з phase API для DOM маніпуляцій (SSR-safe, без layout thrashing), DestroyRef і takeUntilDestroyed для composable cleanup, а signals з effect() замінюють ngOnChanges reactive patterns. Тренд — менше imperative hooks, більше declarative signals."
