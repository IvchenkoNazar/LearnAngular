---
title: "Change Detection Mechanism — How Angular Updates the DOM"
block: 9
topic: 2
slug: "cd-mechanism"
difficulty: 5
sinceVersion: "2"
tags: ["change-detection", "LView", "TView", "ApplicationRef", "detectChanges", "markForCheck", "dirty-checking"]
relatedTopics: ["zonejs", "onpush-strategy", "signals", "expression-changed-error"]
interviewQuestions:
  - id: "b9t2q1"
    level: "junior"
    question: "Як Angular визначає що потрібно оновити DOM?"
    referenceAnswers:
      junior: "Angular запускає change detection що порівнює поточні значення template expressions з попередніми. Якщо є різниця — оновлює DOM. Це відбувається після кожної async операції завдяки Zone.js."
      mid: "Angular's change detection проходить дерево компонентів зверху донизу (top-down traversal). Для кожного компонента перевіряє всі template bindings ({{ expr }}, [prop]='expr'). Якщо значення expression змінилось відносно попереднього check — оновлює відповідну частину DOM. Default стратегія: перевіряє ВСІ компоненти. OnPush стратегія: пропускає компонент якщо Input не змінились і немає events/signals. Результат: dirty checking підхід — порівнює старе і нове значення кожного binding."
      senior: "Angular's CD механізм (Ivy): кожен компонент має LView (runtime view data) і TView (template metadata, shared між instances). LView зберігає: поточні значення bindings (nodes array), directive instances, child LViews. TView зберігає: binding instructions (update functions), template structure. При CD: Angular виконує 'update' pass — iterate через TView.bindingStartIndex до bindingEndIndex, виконує binding instructions, порівнює result з попереднім значенням в LView[bindingIndex]. Якщо різниця — DOM update. Top-down traversal: ComponentView → embedded views (@if, @for) → child ComponentViews. CD завершується коли всі вузли перевірені або позначені як CheckAlways/Dirty."
      staff: "Ivy CD internals: CheckNoChanges mode (development) vs Update mode (production). В CheckNoChanges Angular run CD двічі при dev mode — якщо результат відрізняється між runs → ExpressionChangedAfterItHasBeenChecked. LView flags: LViewFlags.Dirty, LViewFlags.CheckAlways, LViewFlags.Attached. markForCheck() встановлює Dirty на LView і всіх parent LViews. detectChanges() виконує CD для конкретного LView subtree. ApplicationRef.tick() — full tree traversal від root. Сignal-based CD (Angular 17+): Signal.onChange() реєструє consumer (LView) → при signal change → LView.dirty = true → на наступному CD cycle тільки dirty LViews re-check. Це fundamentally different від zone-based: zone trigggerує full tree, signals trigger targeted subtrees."
    commonMistakes:
      - "Думають що Angular знає які конкретні змінні змінились — насправді dirty-checking ВСІХ bindings"
      - "Плутають CD trigger (Zone.js) з CD механізмом (LView/TView traversal)"
    relatedQuestions: ["b9t2q2", "b9t2q3"]
  - id: "b9t2q2"
    level: "mid"
    question: "Яка різниця між detectChanges() і markForCheck() і коли що використовувати?"
    referenceAnswers:
      junior: "detectChanges() негайно запускає change detection для компонента. markForCheck() позначає компонент для оновлення при наступному CD cycle. markForCheck() використовується з OnPush."
      mid: "detectChanges() (inject(ChangeDetectorRef).detectChanges()): синхронно виконує CD для поточного компонента і його дочірніх. Immediate, synchronous. Корисно коли потрібне immediate update (e.g., in setTimeout outside zone). markForCheck(): позначає компонент (і всіх його ancestors) як dirty — CD відбудеться при наступному cycle. Асинхронний. Для OnPush компонентів: тільки dirty components перевіряються. ChangeDetectorRef.detach()/reattach(): повністю відключає/підключає компонент від CD tree — для extreme optimization."
      senior: "detectChanges() у Ivy: виклика checkView(lView) для конкретного LView subtree — не для всього дерева. markForCheck() у Ivy: встановлює LViewFlags.Dirty на LView і traverses up to root marking all parents — це дозволяє наступному ApplicationRef.tick() знайти dirty subtrees і запустити CD тільки для них (у поєднанні з OnPush). Edge case з detectChanges() після ngOnDestroy: якщо компонент destroyed — detectChanges() на відокремленому ChangeDetectorRef кине помилку. Сигнали (Angular 17+): заміна для markForCheck() — signal change автоматично marks LView як dirty. inject(ChangeDetectorRef).markForCheck() у standalone функціях: inject() в injection context (factory, constructor) — валідно."
      staff: "detectChanges() vs markForCheck() architectural implications: detectChanges() — immediate і synchronous — підходить для escape hatches (third-party lib callbacks, Web Components integration). markForCheck() — deferred і batched — підходить для reactive patterns. Performance: надмірні detectChanges() calls (в loops) створюють N synchronous CD cycles — дорого. markForCheck() + batching дає один CD cycle для N changes. Сучасний Angular (17+): якщо використовуються signals — ні detectChanges() ні markForCheck() не потрібні для signal-driven state. Їх використання — ознака що або є non-signal state або integration з non-Angular code. ApplicationRef.tick() vs detectChanges(): tick() — global root level, detectChanges() — targeted subtree. Для performance testing: DevTools profiler + Component tree view показує які views були checked."
    commonMistakes:
      - "Викликають detectChanges() в OnPush компоненті думаючи що markForCheck() не потрібен — detectChanges() безпосередній, але markForCheck() потрібен для ancestors"
      - "Викликають markForCheck() очікуючи негайного DOM оновлення — воно відбудеться при наступному CD cycle"
    relatedQuestions: ["b9t2q1", "b9t2q3", "b9t3q1"]
  - id: "b9t2q3"
    level: "senior"
    question: "Що таке LView і TView і як вони формують основу Angular's Ivy change detection?"
    referenceAnswers:
      junior: "LView і TView — це внутрішні структури даних Angular Ivy що зберігають стан компонента і метадані template для ефективного change detection."
      mid: "TView (Template View) — статична структура що зберігає template metadata: binding instructions, directive types, child component types. Одна TView на тип компонента, shared між усіма instances. LView (Logical View) — runtime instance що зберігає: actual binding values (nodes array), directive instances, query results, parent/child LView references. Кожен component instance має свою LView. При CD: Angular iterate через TView instructions, reads/writes LView для comparison і DOM updates."
      senior: "LView internals: LView[0] = host DOM element, LView[1] = TView, LView[2] = parent LView або parent LContainer, LView[CONTEXT] = component instance. Bindings stored starting at TView.bindingStartIndex. Кожен binding: LView[bindingIndex] = previousValue. При CD: Angular execute binding instruction (generated by compiler) → compute new value → compare з LView[bindingIndex] → якщо !== → DOM update → LView[bindingIndex] = newValue. Ivy compiler generates ɵɵproperty, ɵɵtextInterpolate instructions — це optimized, no reflection. TView.blueprint: template для new LView instances. TView.data: template structure (element, attribute, directive configs). LView flags: Dirty (needs check), CheckAlways (default strategy), IsRoot, Attached."
      staff: "LView/TView design philosophy: template instructions (TView) separated від instance data (LView) — дозволяє efficient memory layout і component pooling. LView data structure дозволяє traversal без additional metadata lookup — index arithmetic. Compiler output: ng build output contains ɵcmp (component definition) з template function that contains LView/TView setup instructions. Source: packages/core/src/render3/interfaces/view.ts в Angular source. For Senior/Staff interview: knowing that LView[0..HEADER_OFFSET] contains infrastructure (host, TView, parent, slots, context, sanitizer) і LView[HEADER_OFFSET+n] contains binding values is key. CheckNoChanges pass: виконується тільки в dev mode — другий CD pass з assert замість write — throws ExpressionChangedAfterItHasBeenChecked if values changed. Signals integration: effect() creates a ReactiveNode that registers its LView as consumer — signal.set() → consumer notification → LView.dirty = true → next tick only dirty LViews traversed."
    commonMistakes:
      - "Думають що кожен component instance має окремий TView — TView shared між instances того самого type"
      - "Думають що Ivy використовує Virtual DOM — ні, direct DOM instructions"
    relatedQuestions: ["b9t2q2", "b9t2q4"]
  - id: "b9t2q4"
    level: "staff"
    question: "Як Angular Ivy's change detection відрізняється від View Engine і як signals змінюють модель CD?"
    referenceAnswers:
      junior: "Ivy — новий compiler і runtime що замінив View Engine в Angular 9. Signals — новий reactive primitive що дозволяє fine-grained CD без Zone.js."
      mid: "View Engine (< Angular 9): NgFactory класи, reflective DI, Component/NgModule factories. Ivy (Angular 9+): ɵcmp, ɵdir, ɵprov — compact static fields, incremental DOM. Signals (Angular 17+): reactive primitives що реєструють consumers (LViews) і тригерять targeted CD. Ключова відмінність: Zone.js CD = full tree; Signals CD = dirty LViews only."
      senior: "View Engine vs Ivy: View Engine компілював в NgFactory classes з createComponent() methods і had runtime reflective DI. Ivy компілює в static ɵcmp (ComponentDef) з template() function — incrementally compiled. Ivy дозволяє tree-shaking на рівні окремих компонентів (View Engine потребував NgModule). Ivy CD: LView/TView замість ComponentRef/ViewRef abstractions — ефективніший memory layout. Signals CD model: createSignal() returns WritableSignal = SignalNode (linked list of consumers). Кожен computed() або effect() є consumer що subscribes на producer signals. Signal change: producer notifies all consumers (LViews) → LView.dirty = true → next ApplicationRef.tick() traverses only dirty subtrees. Це O(dirty_nodes) vs O(total_nodes) для Zone.js CD."
      staff: "Architectural significance: Ivy's LView/TView separation enables component-level compilation and lazy loading without NgModule. Signals make CD model move from push-all (Zone.js) to targeted-dirty (signal consumers). This is fundamental change in performance model: Zone.js CD complexity = O(total_bindings) per cycle; Signals CD = O(changed_bindings) per cycle + O(consumer_count) per signal change. For apps with 1000+ components: signals + OnPush can reduce CD work by 90%+. Migration path: View Engine → Ivy (Angular 9, breaking change for some decorator patterns) → Ivy + Zoneless + Signals (Angular 18-21, incremental, no breaking). Angular's evolution: moving from implicit (Zone.js triggers everything) to explicit (signals trigger targeted subsets) — aligns with React's explicit useState, Vue's reactive() philosophy. Staffing implication: team needs to understand both models during transition period — mixed zone + zoneless apps."
    commonMistakes:
      - "Думають що Ivy = просто новий compiler — насправді це новий runtime model (LView/TView)"
      - "Думають що signals і Zone.js несумісні — вони можуть співіснувати в одному app"
    relatedQuestions: ["b9t2q3", "b9t4q1"]
---

## Core Concept

**English definition:** Angular's Change Detection (CD) mechanism is a process that traverses the component tree, evaluates template expressions (bindings), and updates the DOM when values have changed since the last check. In Ivy, this is implemented through LView (Logical View) runtime instances and TView (Template View) static metadata.

**Пояснення:** Change Detection — це серце Angular. Щоразу коли відбувається async подія (або explicit trigger), Angular проходить дерево компонентів і перевіряє кожне binding: `{{ user.name }}`, `[src]="imageUrl"`, `[class.active]="isActive"`. Якщо значення змінилось — оновлює DOM. Це dirty-checking підхід (не Virtual DOM як у React).

**Яку проблему вирішує:** DOM — мутабельна, повільна структура. Наївне оновлення всього DOM при кожній зміні — занадто дорого. Angular CD мінімізує DOM операції через порівняння: оновлює тільки ті DOM ноди де binding value змінилось.

**Як працює під капотом:**

**Ivy runtime:**
- **TView (Template View):** Статична структура — одна на тип компонента, shared між всіма instances. Містить: template instructions (ɵɵproperty, ɵɵtextInterpolate), binding range (bindingStartIndex), directive types, child component definitions.
- **LView (Logical View):** Runtime instance — унікальна для кожного component instance. Масив де: LView[0] = host element, LView[1] = TView, LView[HEADER+n] = current binding values.

**CD cycle:**
1. `ApplicationRef.tick()` — запускає traversal від root
2. Для кожного компонента: execute TView template instructions
3. Кожна instruction: compute new value → compare з LView[bindingIndex] → if changed → DOM update → save to LView[bindingIndex]
4. Recursively process child LViews

**Trade-offs та обмеження:**
- Default CD: перевіряє ВСЕ дерево навіть якщо змінився один binding — O(total_bindings)
- OnPush + Signals: тільки dirty subtrees — набагато ефективніше
- CheckNoChanges (dev mode): CD runs twice — виявляє ExpressionChangedAfterItHasBeenChecked

**Версійність:**
- Angular 2-8: View Engine — ComponentFactory, NgFactory, reflection-based
- Angular 9: Ivy stable — LView/TView, ɵcmp, tree-shakeable
- Angular 17: Signal-based CD (effect, computed integration з LView)
- Angular 18+: Zoneless stable — CD тільки через signal dirty marking

## Deep Details

### Edge Cases

**CheckNoChanges (dev mode only):** Angular виконує CD двічі в development. Перший pass — реальне оновлення. Другий pass — перевірка що жоден binding не змінився між passes. Якщо змінився → ExpressionChangedAfterItHasBeenChecked error. Це виявляє CD side effects.

**ChangeDetectorRef.detach():** Повністю відключає компонент від CD tree. Такий компонент ніколи не перевіряється — навіть через markForCheck(). Єдиний спосіб оновити — явний detectChanges(). Use case: таблиці з тисячами рядків де більшість static.

**Embedded views (@if, @for):** Мають власні LView instances що вставляються в LContainer. Вони є частиною CD tree і перевіряються так само як component views.

**Dynamic components:** ComponentRef.changeDetectorRef дозволяє контролювати CD окремо. При ApplicationRef.attachView(componentRef.hostView) — компонент підключається до CD tree.

### Junior vs Senior Understanding

**Junior розуміє:** Angular порівнює значення bindings і оновлює DOM. Zone.js тригерить цей процес.

**Senior розуміє:**
- LView зберігає previous binding values для порівняння
- TView shared між instances — compiler optimization
- detectChanges() vs markForCheck() і їх scope
- CheckNoChanges mode і ExpressionChangedAfterItHasBeenChecked
- Signals як targeted CD mechanism (O(dirty) vs O(all))

**Staff розуміє:**
- Повна LView structure (header, binding values, directive instances)
- Compiler output (ɵɵproperty instructions)
- View Engine vs Ivy performance differences
- Signal consumer registration mechanism
- Complexity O(total) vs O(dirty) implications для large apps

### Deprecation & Migration Path

**View Engine (removed in Angular 13):**
- Видалені: `enableIvy: false`, ComponentFactory, NgFactory files, `.ngfactory.ts` imports
- Migration: `ng update @angular/core` в Angular 9-12 мігрував автоматично

**Ivy-only API differences:**
```typescript
// View Engine: ComponentFactoryResolver для dynamic components
const factory = componentFactoryResolver.resolveComponentFactory(MyComponent);
const ref = viewContainerRef.createComponent(factory);

// Ivy (Angular 13+):
const ref = viewContainerRef.createComponent(MyComponent); // No factory needed
```

### Connections to Other Concepts

- **Zone.js (b9t1):** Zone.js є trigger для ApplicationRef.tick()
- **OnPush Strategy (b9t3):** OnPush контролює які LViews перевіряються
- **Signals (b9t4):** Signals надають targeted dirty-marking для LViews
- **ExpressionChangedError (b9t6):** Виникає під час CheckNoChanges pass

## Examples

### Basic Usage

```typescript
// Manual CD control
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';

@Component({
  selector: 'app-manual-cd',
  standalone: true,
  // Default: checks every binding on every CD cycle
  // changeDetection: ChangeDetectionStrategy.Default,
  template: `<p>{{ timestamp }}</p>`,
})
export class ManualCdComponent {
  private cdr = inject(ChangeDetectorRef);
  timestamp = '';

  constructor() {
    // Simulate external async update (e.g., Web Worker message)
    setTimeout(() => {
      this.timestamp = new Date().toISOString();
      // With Default CD: Zone.js would have triggered CD automatically
      // But if outside zone — need manual trigger:
      this.cdr.detectChanges(); // Immediate CD for this subtree
      // OR
      // this.cdr.markForCheck(); // Schedule CD for next cycle (for OnPush)
    }, 1000);
  }
}
```

```typescript
// Detached component for performance
@Component({
  selector: 'app-static-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (row of rows; track row.id) { <tr>...</tr> }`,
})
export class StaticTableComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  rows: Row[] = [];

  ngOnInit(): void {
    // After initial load, detach from CD tree — rows are static
    this.loadData().subscribe(rows => {
      this.rows = rows;
      this.cdr.detectChanges(); // One-time update
      this.cdr.detach(); // No more CD needed — data is static
    });
  }
}
```

### Production Scenario

```typescript
// Understanding when CD runs through NgZone events
import { Injectable, ApplicationRef, inject } from '@angular/core';
import { NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CdMonitorService {
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);
  private cdCount = 0;

  // Wrap ApplicationRef.tick to count CD cycles (dev/monitoring only)
  monitorCdCycles(): void {
    const originalTick = this.appRef.tick.bind(this.appRef);
    this.appRef.tick = () => {
      this.cdCount++;
      if (this.cdCount % 10 === 0) {
        console.log(`[CD Monitor] ${this.cdCount} CD cycles`);
      }
      originalTick();
    };

    this.ngZone.onUnstable.subscribe(() => {
      // Zone became unstable — async task started
    });
    this.ngZone.onStable.subscribe(() => {
      // Zone became stable — all async tasks complete
    });
  }
}
```

### Anti-Example

```typescript
// WRONG: Understanding CD incorrectly
@Component({
  template: `{{ computeHeavy() }}`,
  // WRONG: Heavy computation in template expression
  // computeHeavy() called on EVERY CD cycle (possibly 60 times/second)
})
export class BadComponent {
  computeHeavy(): string {
    // Expensive operation — sorting 10000 items
    return this.items.sort((a, b) => a.name.localeCompare(b.name))
      .map(i => i.name).join(', ');
  }

  // WRONG: Impure function in template — Angular re-evaluates on every CD cycle
  // Solution: pure pipe, computed signal, or pre-computed property
}

// WRONG: Mutating array reference doesn't trigger CD with OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (item of items; track item.id) { ... }`,
})
export class OnPushBugComponent {
  items = [{id: 1, name: 'A'}];

  addItem(): void {
    // WRONG: Mutating existing array — OnPush sees same reference, skips CD
    this.items.push({id: 2, name: 'B'});
    // CORRECT: this.items = [...this.items, {id: 2, name: 'B'}];
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Expensive computation in template expressions `{{ computeHeavy() }}` | Called on every CD cycle (potentially 60fps) — O(N) computation * CD frequency = CPU drain | Use `pure pipe`, `computed()` signal, or pre-compute in component property |
| Mutating arrays/objects with OnPush | OnPush checks reference equality — `array.push()` doesn't change the array reference → CD skipped → UI stale | Always create new reference: `this.items = [...this.items, newItem]` |
| Calling `detectChanges()` in a loop | N synchronous CD cycles — very expensive DOM reconciliation | Batch all state changes first, then single `detectChanges()` |
| Not using `trackBy` in `@for` with large lists | Angular destroys and recreates DOM elements on any array change | Always provide `track` expression: `@for (item of items; track item.id)` |
| `ChangeDetectorRef.detach()` without `reattach()` or `detectChanges()` | Component permanently stuck — UI never updates | Always plan when to call `detectChanges()` or `reattach()` after `detach()` |

## Interview Block

### [L1 — Warm-up] Як Angular change detection визначає що оновити в DOM?

**Signal being tested:** Базове розуміння dirty-checking model і top-down traversal.

**What the interviewer expects:** Опис порівняння binding values, top-down traversal, не Virtual DOM.

**How to probe deeper:** "Angular використовує Virtual DOM як React? Якщо ні — що натомість?"

**Reference answer:** Angular використовує dirty-checking — порівнює поточні значення template bindings з попередніми значеннями збереженими в LView. При кожному CD cycle Angular проходить дерево компонентів зверху донизу, виконує binding expressions, порівнює з попереднім значенням. Якщо є різниця — оновлює конкретну DOM ноду. Angular не використовує Virtual DOM — це direct DOM update instructions generated by the Ivy compiler.

**Common mistakes:** Говорять що Angular використовує Virtual DOM — це React концепція, не Angular.

---

### [L2 — Mid] Яка різниця між detectChanges() і markForCheck() і коли використовувати кожен?

**Signal being tested:** Практичне розуміння ChangeDetectorRef API і їх scope.

**What the interviewer expects:** detectChanges = synchronous, immediate, для поточного subtree; markForCheck = deferred, для OnPush ancestors; чіткі use cases.

**How to probe deeper:** "Якщо OnPush компонент отримує дані через async операцію поза zone — що потрібно викликати?"

**Reference answer:** `detectChanges()` — синхронно виконує CD для поточного LView subtree і потомків. Immediate, не чекає на Zone.js cycle. Підходить для: Web Component integration, third-party callbacks поза zone. `markForCheck()` — позначає LView і всіх ancestors як dirty, CD відбудеться при наступному ApplicationRef.tick(). Для OnPush компонентів що отримують дані через Observable або async. Сучасний підхід: signal() автоматично marks consumers як dirty — ні detectChanges() ні markForCheck() не потрібні для signal-driven state.

**Common mistakes:** markForCheck() після якого очікують immediate DOM update — воно deferred до наступного CD cycle.

---

### [L3 — Senior] Що таке LView і TView і яку роль вони відіграють в Ivy's change detection?

**Signal being tested:** Знання Angular internals на рівні що дозволяє обґрунтовано дискутувати про performance і debugging.

**What the interviewer expects:** Пояснення LView як runtime storage для binding values, TView як shared template metadata, і як вони використовуються при CD traversal.

**How to probe deeper:** "Де Angular зберігає попереднє значення binding щоб порівняти з новим при наступному CD cycle?"

**Reference answer:** TView — статична структура на тип компонента (shared між instances): template instructions (ɵɵproperty, ɵɵtextInterpolate), binding range, directive types. LView — runtime instance (унікальна на component instance): масив де LView[HEADER_OFFSET + n] зберігає попередні binding values для порівняння. При CD: execute TView instruction → compute new value → compare з LView[bindingIndex] → if !== → DOM update → LView[bindingIndex] = newValue. Compiler generates ɵcmp з template function що містить ці instructions.

**Common mistakes:** Думають що TView є окремою для кожного instance — вона shared, LView instance-specific.

---

### [L4 — Staff/Principal] Як signals змінюють модель change detection порівняно з Zone.js і які implications для large app performance?

**Signal being tested:** Системне розуміння двох CD models і здатність оцінити performance implications для large codebases.

**What the interviewer expects:** Zone.js = push-all O(total), signals = targeted-dirty O(dirty), implications для app scalability.

**How to probe deeper:** "В app з 1000 компонентів — скільки LViews перевіряється при одній signal зміні порівняно з Zone.js event?"

**Reference answer:** Zone.js CD: кожна async операція → ApplicationRef.tick() → traversal всього дерева → перевірка ВСІХ bindings O(total_bindings). Signals CD: signal.set() → notify consumers (тільки LViews що читали цей signal) → mark dirty → next tick traverse тільки dirty LViews O(dirty_lviews). В app з 1000 компонентів: Zone.js перевіряє ~1000 views; signals перевіряє ~N де N = кількість компонентів що read цей specific signal (зазвичай 1-10). Performance gain: 100x-1000x менше CD work для targeted changes. Для large enterprise: migration до signals + zoneless — найбільший перформанс win без архітектурного рефакторингу.

**Common mistakes:** Думають signals і Zone.js — mutual exclusive; в Angular 17-21 вони сумісні (progressive migration).

## Summary

### Key Points

- Angular CD використовує dirty-checking: порівнює binding values з попередніми збереженими в LView — не Virtual DOM
- LView (Logical View) — runtime instance що зберігає binding values; TView (Template View) — статична template metadata shared між instances
- `detectChanges()` — synchronous, immediate CD для subtree; `markForCheck()` — deferred, marks LView hierarchy as dirty для OnPush
- CheckNoChanges mode (dev only) запускає CD двічі — виявляє ExpressionChangedAfterItHasBeenChecked
- Zone.js CD = O(total_bindings) per cycle; Signals CD = O(dirty_lviews) — фундаментальна scalability різниця
- Ivy (Angular 9+) replaced View Engine — LView/TView замість NgFactory, tree-shakeable ɵcmp замість reflective DI
- Expensive computations в template expressions виконуються на КОЖНОМУ CD cycle — pure pipes або signals для optimization

### Elevator Pitch (2 minutes)

Angular's change detection — це dirty-checking процес що traverse дерево компонентів і порівнює поточні binding values з попередніми. В Ivy: кожен component instance має LView (runtime data, включаючи previous binding values) і TView (shared template metadata). При CD cycle Angular виконує TView instructions, обчислює нові значення, порівнює з LView[bindingIndex], і якщо різниця є — оновлює DOM. Два trigger механізми: Zone.js (автоматичний, full-tree, O(total)) і Signals (targeted, тільки dirty LViews, O(dirty)). detectChanges() — immediate synchronous CD; markForCheck() — deferred для OnPush components. Сигнали — майбутнє Angular CD: замість traversal всього дерева, тільки ті LViews що читали змінений signal будуть re-checked.
