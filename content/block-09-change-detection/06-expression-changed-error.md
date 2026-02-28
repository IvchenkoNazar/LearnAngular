---
title: "ExpressionChangedAfterItHasBeenChecked Error"
block: 9
topic: 6
slug: "expression-changed-error"
difficulty: 4
sinceVersion: "2"
tags: ["ExpressionChangedAfterItHasBeenChecked", "change-detection", "dev-mode", "lifecycle-hooks", "CD-cycle"]
relatedTopics: ["cd-mechanism", "onpush-strategy", "signals", "lifecycle-hooks"]
interviewQuestions:
  - id: "b9t6q1"
    level: "junior"
    question: "Що таке ExpressionChangedAfterItHasBeenCheckedError і чому він виникає?"
    referenceAnswers:
      junior: "Ця помилка виникає коли значення expression змінюється після того як Angular вже перевірив його під час CD cycle. Angular виявляє це у development mode запускаючи перевірку двічі."
      mid: "ExpressionChangedAfterItHasBeenChecked виникає тільки в development mode. Angular виконує CD двічі: перший pass — реальне оновлення DOM; другий pass (CheckNoChanges) — перевіряє що жоден binding не змінився між passes. Якщо binding змінився між першим і другим pass — викидається помилка. Типові причини: зміна state в lifecycle hook afterContentChecked/afterViewChecked, QueryList що змінюється після CD, або third-party lib що модифікує Angular state."
      senior: "CheckNoChanges mechanism: в dev mode після першого CD pass (Update pass), Angular виконує другий pass з assertNoChanges flag — замість DOM updates перевіряє що binding values не змінились. Якщо value[n] !== previousValue[n] → throw ExpressionChangedAfterItHasBeenCheckedError. Причини виникнення: 1) ngAfterViewInit/ngAfterContentInit — ці hooks викликаються після CD, але якщо вони змінюють state що bound в template — наступний CHECK pass виявить зміну. 2) QueryList (@ViewChildren) — оновлюється після CD, якщо template bound до QueryList.length → помилка. 3) Pipe з side effects. 4) changeDetection: Default і зміна в дочірньому компоненті що впливає на батьківський binding. Помилка — це СИГНАЛ що є CD side effects або неправильна архітектура, не просто annoyance."
      staff: "ExpressionChangedAfterItHasBeenChecked є Angular's mechanism для виявлення нестабільної CD (CD side effects що викликають подальші зміни). Ця помилка є valuable diagnostic tool — вона виявляє реальні архітектурні проблеми. Philosophical point: якщо state змінюється під час CD — це означає що rendering не є pure function of state — порушення фундаментального Angular contract. Правильне рішення: не просто 'suppress' помилку (setTimeout, detectChanges hack), а зрозуміти ЧОМУ state змінюється під час CD і зафіксувати root cause. Для signals: signals не можуть спричинити цю помилку якщо використовуються правильно — вони change detection friendly. З Angular 18+ zoneless і signals-only: ця помилка рідша, але все ще можлива якщо є imperative lifecycle code."
    commonMistakes:
      - "Думають що помилка є production bug — вона тільки в development mode"
      - "Вирішують через setTimeout() або ChangeDetectorRef.detectChanges() в ngAfterViewInit — це workarounds, не fixes"
    relatedQuestions: ["b9t6q2", "b9t6q3"]
  - id: "b9t6q2"
    level: "mid"
    question: "Як виправити ExpressionChangedAfterItHasBeenChecked правильно (не через setTimeout workaround)?"
    referenceAnswers:
      junior: "Правильне рішення залежить від причини. Якщо стан змінюється в ngAfterViewInit — перенести зміну в ngOnInit. Можна також використовувати signals або async pipe."
      mid: "Правильні підходи: 1) Перенести state change в правильний lifecycle hook: ngOnInit замість ngAfterViewInit для initial state setup. 2) Якщо потрібно читати ViewChild в ngAfterViewInit — зберегти у signal або trigger async (microtask): Promise.resolve().then(() => { this.value = ...; this.cdr.markForCheck(); }). 3) Async data через async pipe або toSignal() — вони безпечні. 4) Якщо компонент оновлює батьківський state — рефакторити щоб parent керував своїм state, дочірній component emit event."
      senior: "Глибше рішення залежить від root cause: 1) QueryList-based: @ViewChildren дає QueryList що оновлюється після CD. Замість bind до QueryList.length — bind до signal що оновлюється в QueryList.changes subscription (з markForCheck після). 2) ContentChild-based: аналогічно через ContentChildren.changes. 3) Parent-child dependency: якщо child змінює state що bound у parent template — це архітектурний запах; рефакторити до shared service. 4) ngAfterViewInit binding: для нестатичного ViewChild — використати signal-based @viewChild() замість @ViewChild decorator — вони оновлюються реактивно. 5) Якщо справді потрібен microtask: `queueMicrotask(() => { this.value = ...; this.cdr.markForCheck(); })` — semantic відмінність від setTimeout (microtask після поточного synchronous block, не macro task)."
      staff: "ExpressionChangedAfterItHasBeenChecked як architectural signal: ця помилка часто вказує на порушення unidirectional data flow. Системний аналіз: 1) Identify root cause — що саме змінюється і коли. 2) Categorize: initial setup timing issue (move to ngOnInit) vs dynamic state change (reactive pattern needed) vs bidirectional dependency (architectural refactor). 3) Signal-based solution: з Angular 17+ signal inputs і viewChild() signals — багато традиційних причин цієї помилки відпадають бо reactive updates handled by reactive graph. 4) Testing для цієї помилки: навмисно відтворити у unit test через fixture.detectChanges() двічі — Angular dev mode буде assert. 5) ESLint rules що prevent common patterns (ngAfterViewInit state mutations). 6) Правило: якщо бачиш цю помилку і хочеш suppressувати — спочатку глибоко зрозумій ЧОМУ вона виникає. Suppress тільки якщо intentional design (e.g., ContentChildren changes after first check by design) і є документація чому."
    commonMistakes:
      - "setTimeout(0) workaround — відкладає проблему, не вирішує; і додає macro-task delay до UI"
      - "detectChanges() у ngAfterViewInit — може вирішити симптом але часто причина circular updates"
    relatedQuestions: ["b9t6q1", "b9t6q3"]
  - id: "b9t6q3"
    level: "senior"
    question: "Як перший і другий CD pass у development mode відрізняються і навіщо потрібен другий?"
    referenceAnswers:
      junior: "Перший pass оновлює DOM. Другий pass перевіряє що нічого не змінилось. Якщо щось змінилось — Angular сигналізує про проблему."
      mid: "Update pass: Angular traverse component tree, evaluate bindings, update DOM. CheckNoChanges pass: той самий traverse але замість update — assertion: якщо новий binding value !== stored value → throw. Мета: виявити CD side effects. CD side effect: якщо перший pass спричиняє зміни що впливають на значення bindings — app буде постійно oscillate між станами. Другий pass детектує це в dev mode."
      senior: "Update pass у Ivy: для кожного binding execute instruction → compute value → if !== LView[bindingIndex] → DOM update → LView[bindingIndex] = value. CheckNoChanges pass: execute instruction → compute value → assertNoChanges(value, LView[bindingIndex]) → if !== → throw ExpressionChangedAfterItHasBeenChecked. В production: тільки Update pass — немає другого assertion pass. Це означає що в production помилка невидима, але поведінка може бути inconsistent (UI оновлюється 'на один tick пізніше'). Signals і CheckNoChanges: signal changes у template зафіксовані реактивно і не спричиняють цю помилку при правильному використанні — вони є synchronous частиною reactive graph. Для debugging: Angular DevTools показує expression values до і після CD."
      staff: "CheckNoChanges — це application of invariant: 'rendering is a pure function of state'. Якщо after rendering state changed → rendering не є pure → UI може бути inconsistent (наприклад: page shows loading=false but actual data not yet set). У production: ця inconsistency exists silently — тільки dev mode exposes it. Philosophy: Angular's CheckNoChanges є fail-fast approach у dev mode. Це принцип: краще впасти голосно в dev mode ніж тихо misbehave в production. Для advanced cases: якщо intentionally потрібно update after view check — use queueMicrotask або afterRender/afterNextRender hooks (Angular 17+) які designed для post-render updates. afterRender: виконується після кожного render cycle; afterNextRender: виконується один раз після next render — proper hooks без CD violation. Testing: enable AngularCompilerOptions.enableIvy і strictTemplates для додаткових compile-time checks."
    commonMistakes:
      - "Думають що проблема є тільки в dev mode і production safe — production silently inconsistent"
      - "Використовують enableProdMode() щоб 'вирішити' проблему — маскує, не вирішує"
    relatedQuestions: ["b9t6q2", "b9t2q1"]
  - id: "b9t6q4"
    level: "staff"
    question: "Як signals і нові lifecycle hooks (afterRender, afterNextRender) допомагають уникнути ExpressionChangedAfterItHasBeenChecked?"
    referenceAnswers:
      junior: "Signals уникають цієї помилки бо вони реактивно оновлюють тільки своїх consumers. afterRender і afterNextRender — нові hooks що виконуються після rendering і безпечні для post-render updates."
      mid: "Signals: якщо state в signals — Angular reactive graph handles updates synchronously і deterministically перед CD — немає 'changed after checked'. afterRender(fn): виконується після КОЖНОГО render cycle поза CD — безпечно для DOM reads і writes. afterNextRender(fn): виконується один раз після next render — для one-time post-render initialization (third-party lib init, scroll position restore)."
      senior: "Signals і ExpressionChangedAfterItHasBeenChecked: signal read у template реєструє LView як consumer. Signal change → LView.dirty → CD для цього LView. Цей механізм є synchronous і deterministic — no 'after the check' surprise. afterRender і afterNextRender (Angular 17+, stable 18): ці hooks виконуються у AfterRenderPhase: EarlyRead → Write → MixedReadWrite → Read. Вони explicit post-render hooks — designed для DOM measurement і third-party lib integration де imperative DOM read/write потрібен. Вони не є частиною CD cycle — не тригерять CheckNoChanges. Для scrolling, canvas, chart libraries: afterNextRender для ініціалізації, afterRender для updates — правильний design."
      staff: "Signals + afterRender є systematic solution до класу проблем що спричиняли ExpressionChangedAfterItHasBeenChecked: 1) ViewChild DOM access: замість ngAfterViewInit + setTimeout — viewChild() signal + afterRender() або computed(). 2) ContentChildren dynamism: замість QueryList.changes subscribe + markForCheck — contentChildren() signal (Angular 17+) що updates reactively. 3) Third-party lib DOM init: afterNextRender — proper hook designed for this. 4) Post-render measurements (scroll height, element bounds): afterRender with EarlyRead phase → computed signal від measurement → Write phase для visual updates. Architectural принцип: ExpressionChangedAfterItHasBeenChecked зазвичай симптом того що imperative lifecycle patterns (ngAfterViewInit mutation) використовуються де мав би бути declarative reactive (signal, computed, proper hook). Migration path: ідентифікуй всі ngAfterViewInit/ngAfterContentInit state mutations → replace з signal-based patterns або afterRender → error зникає системно."
    commonMistakes:
      - "Думають afterRender є заміною ngAfterViewInit для всіх use cases — вони мають різну semantics"
      - "Не розуміють AfterRenderPhase (EarlyRead/Write/MixedReadWrite/Read) — записують і читають в одному phase, спричиняючи layout thrashing"
    relatedQuestions: ["b9t6q3", "b9t4q1"]
---

## Core Concept

**English definition:** ExpressionChangedAfterItHasBeenCheckedError is a development-mode-only error thrown by Angular when a binding expression's value is found to have changed between the first (Update) and second (CheckNoChanges) change detection passes, indicating a violation of Angular's rendering invariant that views should be stable after a CD cycle.

**Пояснення:** Angular в dev mode запускає CD двічі. Перший pass оновлює DOM. Другий pass перевіряє стабільність — "все що ти вивів в DOM повинно залишатись тим самим якщо state не змінювався після першого pass". Якщо другий pass виявляє відмінність — angular каже: "щось у твоєму коді змінює state під час rendering — це небезпечно".

**Яку проблему вирішує:** Виявляє CD side effects в development mode перш ніж вони спричинять subtle production bugs. Без цієї перевірки — app може мати oscillating state (кожен CD cycle змінює state що тригерить наступний CD cycle → нескінченний loop або непередбачувана UI).

**Як працює під капотом:**

**Update pass (флаг: CheckAlways або Dirty):**
- Traverse component tree
- Evaluate binding: `newValue = computeExpr()`
- `if newValue !== LView[bindingIndex]` → update DOM, `LView[bindingIndex] = newValue`

**CheckNoChanges pass (dev mode only, флаг: CheckNoChanges):**
- Same traverse
- Evaluate same binding: `newValue = computeExpr()`
- `assert(newValue === LView[bindingIndex])` — if differs → `throw ExpressionChangedAfterItHasBeenCheckedError`

Якщо між першим і другим pass щось змінило binding value → assertion fails.

**Trade-offs та обмеження:**
- Тільки в development mode — production не має другого pass
- Може виникати "false positive" відчуття у деяких third-party integration scenarios
- Workarounds (setTimeout) технічно спрацьовують але ховають реальну проблему

**Версійність:**
- Angular 2+: ExpressionChangedAfterItHasBeenCheckedError існує з початку
- Angular 17: afterRender/afterNextRender hooks як proper solution для post-render updates
- Angular 17+: Signal-based viewChild/contentChild — eliminates QueryList-based errors
- Angular 19: input(), output(), viewChild() stable — systematic solution

## Deep Details

### Edge Cases

**Production silently inconsistent:** У production немає другого pass. Але якщо state змінюється між CD cycles через side effects — UI може відставати на один tick. Цей bug тихий і складно відтворити.

**enableProdMode() маскує проблему:** Деякі developer помилково вмикають enableProdMode() у dev щоб усунути помилку. Це приховує реальний bug.

**ngAfterViewInit і ViewChild:** ViewChild (non-static) доступний в ngAfterViewInit. Якщо в ngAfterViewInit оновити state bound у template — перший CD вже завершено → другий pass виявить зміну.

**ContentChildren.changes і QueryList:** QueryList оновлюється після CD. Якщо template bind до QueryList.length — другий pass побачить що length змінилась.

**Signals взагалі не спричиняють цю помилку:** signal.set() у lifecycle hook оновлює reactive graph synchronously before CD — немає "after check" ситуації.

### Junior vs Senior Understanding

**Junior розуміє:** Помилка тільки в dev. Виникає якщо state змінюється після CD. setTimeout "вирішує".

**Senior розуміє:**
- Два CD passes і їх різниця (Update vs CheckNoChanges)
- Чому setTimeout є workaround а не fix
- Правильні рішення: ngOnInit замість ngAfterViewInit для init, signal-based state, async pipe
- queueMicrotask як краща альтернатива setTimeout
- afterRender/afterNextRender як proper hooks

**Staff розуміє:**
- Philosophical significance: rendering as pure function of state
- Systematic refactoring з signals для elimination class of bugs
- afterRender phases (EarlyRead/Write/Read) для DOM operations
- Testing стратегія для виявлення
- ESLint rules для prevention

### Deprecation & Migration Path

**QueryList-based patterns → Signal-based (Angular 17+):**
```typescript
// Old: QueryList triggers ExpressionChangedAfterItHasBeenChecked
@ViewChildren(ChildComponent) children!: QueryList<ChildComponent>;
childCount = 0;
ngAfterViewInit() {
  this.childCount = this.children.length; // Error: changed after checked!
}

// New: Signal viewChildren — reactive, no lifecycle hook needed
readonly children = viewChildren(ChildComponent);
readonly childCount = computed(() => this.children().length); // Reactive, error-free
```

**ngAfterViewInit mutation → proper hooks:**
```typescript
// Old: mutation in ngAfterViewInit → ExpressionChangedAfterItHasBeenChecked
ngAfterViewInit() {
  this.title = this.viewChild.nativeElement.textContent; // Error!
}

// New: afterNextRender — proper post-render hook
constructor() {
  afterNextRender(() => {
    this.titleSignal.set(this.viewChild()!.nativeElement.textContent);
  });
}
```

### Connections to Other Concepts

- **CD Mechanism (b9t2):** CheckNoChanges pass є частиною CD mechanism
- **Lifecycle Hooks (b2t2):** ngAfterViewInit/ngAfterContentInit — найчастіші trigger locations
- **Signals (b9t4):** Signals systematically prevent цю помилку
- **ViewChild/ContentChild (b2t5):** QueryList updates є common cause

## Examples

### Basic Usage

```typescript
// WRONG — causes ExpressionChangedAfterItHasBeenChecked
@Component({
  template: `<p>Count: {{ childCount }}</p>`,
})
class ParentComponent implements AfterViewInit {
  @ViewChildren(ChildComponent) children!: QueryList<ChildComponent>;
  childCount = 0;

  ngAfterViewInit() {
    // WRONG: Called after first CD pass — second pass sees changed childCount
    this.childCount = this.children.length;
    // Error: ExpressionChangedAfterItHasBeenCheckedError
  }
}

// CORRECT — signal-based solution
@Component({
  template: `<p>Count: {{ childCount() }}</p>`,
})
class CorrectParentComponent {
  // Signal-based viewChildren — reactive, no lifecycle hook needed
  readonly children = viewChildren(ChildComponent);
  // computed is synchronous part of reactive graph — no "after check" issue
  readonly childCount = computed(() => this.children().length);
}
```

### Production Scenario

```typescript
// Post-render DOM measurement — correct pattern with afterRender
import { Component, signal, afterNextRender, afterRender, ElementRef, inject, viewChild } from '@angular/core';

@Component({
  selector: 'app-auto-scroll',
  standalone: true,
  template: `
    <div #container class="scroll-container">
      @for (msg of messages(); track msg.id) {
        <p>{{ msg.text }}</p>
      }
    </div>
    <p>Container height: {{ containerHeight() }}px</p>
  `,
})
export class AutoScrollComponent {
  messages = signal<{id: number; text: string}[]>([]);
  containerHeight = signal(0);
  containerEl = viewChild.required<ElementRef>('container');

  constructor() {
    // afterNextRender: runs once after initial render — for one-time initialization
    afterNextRender(() => {
      // Safe DOM read after render — no ExpressionChangedAfterItHasBeenChecked
      this.containerHeight.set(this.containerEl().nativeElement.scrollHeight);
    });

    // afterRender: runs after EVERY render cycle — for continuous updates
    // Use sparingly — runs on every CD cycle!
    afterRender(() => {
      // Auto-scroll to bottom when messages change
      const el = this.containerEl().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }
}
```

### Anti-Example

```typescript
// Common wrong approaches to "fix" ExpressionChangedAfterItHasBeenChecked
@Component({
  template: `<p>{{ status }}</p>`,
})
class AntiPatternComponent implements AfterViewInit {
  @ViewChild('el') el!: ElementRef;
  status = '';
  private cdr = inject(ChangeDetectorRef);

  ngAfterViewInit() {
    // WRONG APPROACH 1: setTimeout
    // Delays the update to next macro-task — "fixes" the error but:
    // - UI shows wrong value for one tick
    // - Adds unnecessary delay
    // - Doesn't address root cause
    setTimeout(() => {
      this.status = this.el.nativeElement.textContent;
    });

    // WRONG APPROACH 2: detectChanges() immediately
    // Triggers another full CD cycle synchronously — may cause multiple CD cycles
    // and can potentially cause infinite loops in edge cases
    this.status = this.el.nativeElement.textContent;
    this.cdr.detectChanges(); // This also triggers CheckNoChanges again...

    // CORRECT: Use afterNextRender or viewChild() signal
    // afterNextRender(() => { this.statusSignal.set(...) });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `setTimeout(() => { this.value = x; })` to suppress error | Delays update by one macro-task — shows stale UI for a tick; doesn't fix root cause | Identify why state changes after check; use `afterNextRender()` for DOM-related, `ngOnInit` for data initialization |
| `ChangeDetectorRef.detectChanges()` in `ngAfterViewInit` to suppress error | Triggers another synchronous CD cycle — potential for circular updates; masks root cause | Move state initialization to `ngOnInit`; use `viewChild()` signal for reactive ViewChild access |
| Mutating state in `ngAfterViewChecked` | Called after every CD cycle — mutation here causes error on every single cycle | `ngAfterViewChecked` should have NO side effects; use `afterRender` if post-render hook is needed |
| Binding to `QueryList.length` directly | QueryList updates asynchronously after CD — length differs between passes | Use `viewChildren()` or `contentChildren()` signal-based API — reactive and error-free |
| `enableProdMode()` in development to suppress error | Removes the detection entirely — real bug remains, silently causes inconsistent UI in production | Fix the actual root cause; use dev mode to diagnose, not suppress |

## Interview Block

### [L1 — Warm-up] Що таке ExpressionChangedAfterItHasBeenChecked і в яких умовах виникає?

**Signal being tested:** Розуміння dev mode CD behavior і базова ідентифікація причин.

**What the interviewer expects:** Опис двох CD passes в dev mode, що помилка тільки в dev mode, і типові причини (lifecycle hooks, QueryList).

**How to probe deeper:** "Чи може ця помилка спричинити проблеми в production якщо її не виправити?"

**Reference answer:** ExpressionChangedAfterItHasBeenChecked — помилка development mode. Angular виконує CD двічі в dev: перший pass оновлює DOM, другий (CheckNoChanges) перевіряє що binding values не змінились. Якщо змінились — помилка. Виникає коли: state оновлюється в ngAfterViewInit/ngAfterContentInit (після першого pass), QueryList.length змінюється після CD, або дочірній компонент змінює state батьківського template. В production: немає другого pass → помилка невидима, але UI може бути inconsistently стale.

**Common mistakes:** Думають що помилка тільки cosmetic і production safe — production має silent inconsistency.

---

### [L2 — Mid] Як правильно (без setTimeout) виправити ExpressionChangedAfterItHasBeenChecked?

**Signal being tested:** Знання правильних рішень vs common workarounds і розуміння чому workarounds проблематичні.

**What the interviewer expects:** Конкретні правильні підходи: ngOnInit для init, signal-based APIs, afterNextRender для DOM access.

**How to probe deeper:** "Ти бачиш цю помилку у ngAfterViewInit де читаєш textContent з DOM елемента і зберігаєш у property. Що правильно зробити?"

**Reference answer:** setTimeout є workaround, не fix — відкладає update на macro-task, показує stale UI на один tick. Правильні рішення залежать від причини: 1) Initial data setup → перенести в ngOnInit (виконується до CD). 2) ViewChild DOM read → `afterNextRender(() => { this.valueSignal.set(this.el()!.nativeElement.textContent); })` — proper post-render hook. 3) QueryList-based: замінити `@ViewChildren + QueryList` на `viewChildren()` signal. 4) Дочірній оновлює батьківський state → рефакторити через shared service або output event.

**Common mistakes:** setTimeout(0) — "вирішує" помилку але залишає одно-тактове UI lag і не фіксує root cause.

---

### [L3 — Senior] Поясни різницю між Update pass і CheckNoChanges pass в Ivy і як signals вирішують цю проблему системно?

**Signal being tested:** Глибоке розуміння CD механізму і того як signals інтегруються в reactive graph без "after check" violations.

**What the interviewer expects:** Технічний опис двох passes (LView flag difference), і пояснення чому signal updates не спричиняють помилку.

**How to probe deeper:** "Чому signal.set() у ngAfterViewInit НЕ спричиняє ExpressionChangedAfterItHasBeenChecked?"

**Reference answer:** Update pass: execute binding instruction → compute → if !== LView[n] → DOM update → LView[n] = value. CheckNoChanges pass: execute same instruction → compute → assert === LView[n] → throw if different. Signal-based state: `signal.set()` оновлює reactive graph synchronously. Коли Angular evaluate `{{ mySignal() }}` у Update pass — читає поточне signal value і stores в LView[n]. У CheckNoChanges pass — `mySignal()` повертає те саме значення (signal не змінилось між passes) → assertion succeeds. Signal.set() після Update pass → signal.version incremented → LView dirty → наступний CD cycle. Ключ: signals synchronous і deterministic — немає "зміни під час check".

**Common mistakes:** Думають що signal.set() може спричинити помилку — ні, якщо немає circular dependency в signal graph.

---

### [L4 — Staff/Principal] Як afterRender та afterNextRender hooks системно вирішують клас проблем що спричиняв цю помилку?

**Signal being tested:** Знання Angular 17+ post-render hooks і їх architectural role як proper replacement для lifecycle hook workarounds.

**What the interviewer expects:** Пояснення AfterRenderPhase lifecycle, use cases для кожного phase, і чому вони не спричиняють CD violations.

**How to probe deeper:** "Які AfterRenderPhase існують і в якому порядку виконуються? Для чого кожен?"

**Reference answer:** afterRender/afterNextRender (Angular 17+) виконуються поза CD cycle — не частина Update або CheckNoChanges passes. Тому state mutations в цих hooks не спричиняють ExpressionChangedAfterItHasBeenChecked. AfterRenderPhase: EarlyRead (DOM reads, measurement) → Write (DOM writes) → MixedReadWrite (якщо потрібно обидва) → Read (final reads). Правильний порядок запобігає layout thrashing. afterNextRender: one-time execution після next render (init third-party libs, restore scroll). afterRender: every render (continuous DOM sync). Ці hooks замінюють ngAfterViewInit setTimeout patterns — proper design без workarounds.

**Common mistakes:** Пишуть DOM reads і writes в одному phase (MixedReadWrite) замість EarlyRead → Write — призводить до forced reflow кожен render.

## Summary

### Key Points

- ExpressionChangedAfterItHasBeenCheckedError — тільки development mode; Angular runs CD twice (Update + CheckNoChanges)
- Помилка вказує на реальний архітектурний issue — CD side effect або неправильний lifecycle hook для state mutations
- setTimeout workaround — ховає проблему, додає UI lag, не рекомендований
- Правильні підходи: ngOnInit для initialization, signal-based APIs, afterNextRender/afterRender для DOM access
- Signal-based viewChild/viewChildren/contentChildren (Angular 17+) систематично усувають QueryList-related errors
- afterRender і afterNextRender (Angular 17+) — proper post-render hooks що виконуються поза CD cycle
- Production: без другого pass UI може бути silently inconsistent якщо проблему не вирішено

### Elevator Pitch (2 minutes)

ExpressionChangedAfterItHasBeenCheckedError — Angular's fail-fast mechanism у dev mode. Angular runs CD двічі: перший pass оновлює DOM і stores binding values в LView; другий (CheckNoChanges) verifies values didn't change. Якщо щось змінилось — помилка попереджає про CD side effects. Типові причини: state mutation в ngAfterViewInit (відбувається після першого pass), QueryList що оновлюється після CD. Неправильне рішення: setTimeout — ховає проблему. Правильні рішення: ngOnInit для initialization, signal-based `viewChildren()` замість QueryList, `afterNextRender()` для DOM access post-render. Signals систематично вирішують цю проблему — вони синхронна частина reactive graph і не спричиняють "after check" violations.
