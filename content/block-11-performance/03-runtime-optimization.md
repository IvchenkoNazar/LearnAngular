---
title: "Runtime Performance Optimization"
block: 11
topic: 3
slug: "runtime-optimization"
difficulty: 4
sinceVersion: "2"
tags: ["OnPush", "trackBy", "pure-pipes", "virtual-scrolling", "memoization", "ChangeDetectorRef"]
relatedTopics: ["deferrable-views", "bundle-optimization", "angular-devtools-profiling", "change-detection"]
interviewQuestions:
  - id: "b11t3q1"
    level: "junior"
    question: "Що таке ChangeDetectionStrategy.OnPush і коли Angular запускає change detection для OnPush компонента?"
    referenceAnswers:
      junior: "OnPush — стратегія яка каже Angular перевіряти компонент тільки коли його @Input() змінився. Default — перевіряє при кожному change detection cycle."
      mid: "OnPush компонент перевіряється тільки при: 1) @Input() reference change (не мутація!). 2) async pipe емітує нове значення. 3) Явний markForCheck(). 4) Event binding у шаблоні (click, keyup тощо). 5) Signal() dependency change в Angular 17+. Default: перевіряється при кожному CD cycle (будь-яка async operation в app). OnPush ізолює компонент — не включається в default CD sweep."
      senior: "OnPush internal mechanics: Angular marks component as 'dirty' only for the 5 triggers listed. CD tree traversal: Angular починає від root, descends. Зустрічаючи OnPush component — якщо не 'dirty' → пропускає і всіх children (entire subtree skipped). Це O(subtree) savings. Якщо 'dirty' → checks component → marks clean → continues to children. Signals integration (Angular 17+): signal reads in template create reactive subscription. Signal write → marks component dirty → CD scheduled. ChangeDetectorRef.detach() — повністю від'єднує від CD tree (manual mode). detachFromChangeDetection() + detectChanges() для повного контролю. OnPush + mutable objects antipattern: mutating @Input() object без reference change → template не оновиться. Must create new reference: `{ ...obj, prop: newValue }` або `Object.assign({}, obj, { prop: newValue })`."
      staff: "OnPush як архітектурний контракт. Ivy CD internals: LView має flag LViewFlags.Dirty. Root markDirty() → traverses parent chain, sets Dirty flag up to root. CD cycle: traverse tree, process Dirty components. Non-dirty OnPush → skip subtree. At scale: app з 500 components, 400 OnPush → CD touches only 100 default + dirty OnPush = significant savings. Signal-based components (Angular 17+): template signal reads create Effects. Signal write → microtask scheduled → CD на affected components тільки. Near-zero overhead compared to Zone-based CD. Practical recommendation: all components OnPush + signals = zoneless app possible. Mixing OnPush і default: default component as child of OnPush → default always checked when parent checked. Parent purity lost. Signals + OnPush і async operations: `toSignal(observable$)` — converts Observable to signal, drives OnPush. No async pipe needed. `rxjs-interop` package."
    commonMistakes:
      - "Мутують @Input() object замість нового reference — OnPush не detectує зміну"
      - "Думають OnPush = не буде CD — ні, OnPush = CD тільки при specific triggers"
    relatedQuestions: ["b11t3q2", "b11t3q3"]
  - id: "b11t3q2"
    level: "mid"
    question: "Що таке trackBy в @for та ngFor і чому він критичний для list performance?"
    referenceAnswers:
      junior: "trackBy допомагає Angular ідентифікувати елементи в списку. Без нього при зміні list Angular recreates всі DOM nodes."
      mid: "Without trackBy/@for track: при зміні array Angular порівнює за reference. Якщо array — новий reference (від API) → всі items recreated DOM. З trackBy: Angular порівнює по item identity function (id, або custom key). Тільки нові/видалені items DOM-operated. Оновлені items: DOM reused, тільки bindings updated. @for (Angular 17+) вимагає `track` expression обов'язково — eliminates anti-pattern."
      senior: "trackBy/track mechanics: Angular's differ algorithm (DefaultIterableDiffer або IterableDiffer). Без track: identity by reference. З track: identity by returned key. Algorithm: 1) Build old item map (key → DOM node). 2) Iterate new array. 3) For each item: key in old map? → reuse node, update bindings. Not in old map? → create new node. 4) Old map leftovers → destroy. DOM reuse = no destroy/create lifecycle, no re-parsing template, no garbage collection pressure. At scale: 1000-item list з API polling every 5s. Without track: 5000 DOM creations/minute. With track item.id: 0 DOM ops if data unchanged, minimal ops for actual changes. @for track: `@for (item of items; track item.id) { }`. Function track: `track trackFn(index, item)`. trackFn(index, item): повертає identity key. Для mutable objects без id: `track $index` — stable but semantic only (may reuse wrong node for shifted items)."
      staff: "trackBy/track — critical для list-heavy apps. Differ algorithm deep dive: IterableChanges calculates: forEachAddedItem, forEachRemovedItem, forEachMovedItem. ViewContainerRef operations: insert, remove, move (without recreate). Move operation: O(1) DOM op — just rearranges pointers. Without move: remove old + insert new = expensive. Track by index trade-off: `track $index` — stable key, prevents recreation BUT if items shift (insert at start), ALL subsequent items get wrong node → incorrect state if components have their own state. Always track by unique identifier. Complex track expressions: `track item.id + '_' + item.version` — для immutable versioned records. Performance measurement: Angular DevTools Profiler → look for 'ngForCreate' bars → с trackBy вони зникнуть. Virtual scrolling + track: CdkVirtualScrollViewport only renders visible range. trackBy still matters for the visible window. @for і ChangeDetection: з OnPush + track → list updates cause minimal CD + minimal DOM ops = optimal."
    commonMistakes:
      - "trackBy за `$index` для списків де елементи переставляються — семантично неправильно, може спричинити bugs"
      - "Думають track тільки для performance — насправді correctness теж залежить (component state у list items)"
    relatedQuestions: ["b11t3q1", "b11t3q3"]
  - id: "b11t3q3"
    level: "mid"
    question: "Яка різниця між pure і impure pipes і коли використовувати кожен?"
    referenceAnswers:
      junior: "Pure pipe викликається тільки коли input змінився. Impure pipe викликається при кожному CD cycle. Async pipe — приклад impure pipe."
      mid: "Pure pipe: Angular checks reference equality. New reference → transform() called. Same reference → cached result returned. Impure: `@Pipe({ pure: false })` → transform() called on every CD cycle. AsyncPipe — impure (підписується на Observable, needs continuous checking). Impure — performance expensive. Використання: pure для stateless transformations (formatting, mapping). Impure для: async operations, state-dependent transformations."
      senior: "Pure pipe caching mechanism: Angular stores last input reference(s) і last output. Reference equality check on each CD cycle → якщо same reference → return cached. Multiple args: ALL args must be same references for cache hit. Pure pipe = memoization by reference equality. Design for pure pipes: return new reference only when semantically changed. `filteredItems = items.filter(...)` — завжди new array → pure pipe always re-runs. Fix: `signal<Item[]>` with computed → memoized. Impure pipe performance: called every CD cycle for every usage in template. 5 usages + 60 fps + busy app = 300 calls/second. Usually unacceptable. Alternative to impure pipe: push through Observable + async pipe (single subscription, emits on change). Signal-based approach: `filteredItems = computed(() => this.items().filter(...))` — memoized automatically. Custom impure → computed: replace impure pipe with computed signal property in component → only recomputes when deps change. AsyncPipe specifically: manages subscription lifecycle (subscribes on create, unsubscribes on destroy), marks component dirty on new emission."
      staff: "Pipes architecture — senior strategic thinking. Pure pipe є memoized function: TS type: `PipeTransform.transform(value: T, ...args: any[]): R`. Pure = deterministic (same inputs → same output, no side effects). Design principle: if pipe has side effects → it's already wrong (logging, mutation) — extract to component logic. Impure pipe use cases legitimately: `SlicePipe` is pure but returns new array for same content — semi-pure. `JsonPipe` is impure (object reference same but content may change — but debatable). `AsyncPipe` — legitimate impure because it's a subscription manager. Custom impure legitimate: rarely. Usually better alternatives: Observable → async pipe, state → computed signal. Pipe vs computed signal: pipe applies in template (good for formatting), computed signal applies in class (good for derived state). Combining: `{{ computedItems() | formatCurrency }}` — computed for derivation, pure pipe for formatting. Performance tooling: Angular DevTools Profiler → examine pipe transforms in CD flames."
    commonMistakes:
      - "Створюють impure pipe для async операцій — краще Observable з async pipe або toSignal()"
      - "Pure pipe з array/object argument: мутують argument замість new reference → pipe never re-runs"
    relatedQuestions: ["b11t3q2", "b11t3q4"]
  - id: "b11t3q4"
    level: "senior"
    question: "Як CDK Virtual Scroll вирішує проблему великих списків і як налаштувати CdkVirtualScrollViewport?"
    referenceAnswers:
      junior: "Virtual scroll рендерить тільки visible items замість всього списку. CDK Virtual Scroll — Angular CDK implementation."
      mid: "CdkVirtualScrollViewport: фіксований viewport container, рендерить тільки visible rows + buffer. itemSize: висота кожного item у пікселях. `<cdk-virtual-scroll-viewport itemSize='50'><div *cdkVirtualFor='let item of items'>`. cdkVirtualFor замість *ngFor. Підтримує Observable і array. Buffer: renderMinBufferPx, renderMaxBufferPx."
      senior: "CdkVirtualScrollViewport internals: scrolled container з fixed height. Calculates visible range: `startIndex = scrollTop / itemSize`, `endIndex = (scrollTop + viewportHeight) / itemSize`. Renders only [startIndex - buffer, endIndex + buffer]. Creates 'phantom' spacers: top spacer (height = startIndex * itemSize), bottom spacer (height = (totalItems - endIndex) * itemSize) — scrollbar accurate. cdkVirtualFor = structural directive з custom ViewContainerRef — creates/destroys views as range changes. Buffer zones: renderMinBufferPx (minimum visible buffer before trigger re-render), renderMaxBufferPx (maximum buffer to maintain). Variable item size: AutoSizeVirtualScrollStrategy — measures actual DOM sizes. `scrolledIndexChange` event для tracking. CustomVirtualScrollStrategy: implement VirtualScrollStrategy для complex cases (sticky headers, variable sections). Performance: 10,000 items → ~20-30 DOM nodes rendered. О(1) render complexity vs O(n) without virtual scroll."
      staff: "Virtual scrolling production architecture. CdkVirtualScrollViewport configurations: 1) Fixed size (most performant): `itemSize='50'` + `FixedSizeVirtualScrollStrategy`. Calculation O(1). 2) Variable size: `AutoSizeVirtualScrollStrategy` — measures DOM, caches sizes. Calculation O(measured). Best for heterogeneous lists. 3) Custom strategy: `VirtualScrollStrategy` interface → full control. Use case: sections з headers. CDK Virtual Scroll + ngRx/signals: items$ | async з virtual scroll. `cdkVirtualFor = { cdkVirtualForOf: items$, cdkVirtualForItemSize: 48 }`. Virtual scroll + skeleton loading: use @defer (on viewport) for items beyond initial range to lazy-load heavy per-row components. Custom scroll restoration с virtual scroll: standard `ViewportScroller` не works (не window scroll). Override: `scrollToIndex(i)` on CdkVirtualScrollViewport. Accessibility: screen readers з virtual scroll — ARIA labels, announcements для dynamic content. Mobile considerations: momentum scrolling на iOS — `overflow: scroll; -webkit-overflow-scrolling: touch`. Performance beyond virtual scroll: row-level memoization (trackBy + OnPush per item component), pagination as alternative для data > 100K items (virtual scroll still has limits at very high counts due to phantom spacer height)."
    commonMistakes:
      - "Використовують *ngFor замість *cdkVirtualFor в cdkVirtualScrollViewport — virtual scroll не працює"
      - "Не вказують itemSize — AutoSizeVirtualScrollStrategy значно важча ніж FixedSize"
    relatedQuestions: ["b11t3q3", "b11t3q5"]
  - id: "b11t3q5"
    level: "staff"
    question: "Як runOutsideAngular використовується для оптимізації і коли це необхідно?"
    referenceAnswers:
      junior: "runOutsideAngular виконує код поза Zone.js, тому Angular CD не запускається після цього коду."
      mid: "Zone.js patches всі async APIs (setTimeout, Promise, EventListener). Будь-яке async completion в zone → Angular CD. runOutsideAngular: код виконується без zone patching → CD не тригериться. Для: requestAnimationFrame loops, WebSocket messages, third-party event listeners, performance-sensitive computations."
      senior: "Zone.js mechanics: NgZone wraps application in Zone.js zone. Any async operation patched by Zone.js that completes inside zone → ApplicationRef.tick() called → full CD. runOutsideAngular(fn): fn runs in parent zone (outside Angular zone). Async completions from fn → no CD trigger. Usage patterns: 1) Animation loops: `ngZone.runOutsideAngular(() => { requestAnimationFrame(this.animate.bind(this)); })`. rAF loops → no CD. 2) WebSocket/SSE: messages outside zone, `ngZone.run(() => signal.set(newData))` for UI-affecting data only. 3) D3/Three.js canvas updates: outside zone. 4) scroll event listeners for non-Angular scroll effects. `ngZone.run(fn)`: re-enter zone for specific operation — trigger CD once for result. Pattern: heavy computation outside zone → set signal inside zone = single CD trigger."
      staff: "runOutsideAngular як архітектурний pattern для performance-critical apps. Advanced patterns: 1) Zoneless migration path: runOutsideAngular для non-visual → eventually migrate to zoneless (no Zone.js). Zoneless: no Zone.js = no CD overhead per event. Manual signals/markForCheck for CD. 2) Performance monitoring: track CD cycles. `ApplicationRef.isStable` Observable — emits true коли no pending CD. Monitoring: `appRef.isStable.pipe(filter(Boolean), take(1), tap(() => performance.mark('app-stable')))`. 3) Third-party library integration: Leaflet, Google Maps, D3 — all trigger events. Wrap in runOutsideAngular at initialization: `ngZone.runOutsideAngular(() => { this.map = L.map(el); this.map.on('move', handler); })`. Handler inside: only `ngZone.run(...)` for data that affects Angular template. 4) Web Workers: completely outside Zone.js. Angular Worker support: `new Worker(new URL('./worker', import.meta.url))`. Transferable objects for large data. 5) SchedulerLike (RxJS): `observeOn(asapScheduler)` — defers Observable to microtask (outside CD). 6) Profiling pattern: Angular DevTools Profiler → flame chart → identify frequent CD triggers → trace to event source → wrap in runOutsideAngular. Measurement: before/after frame rate (rAF) comparison в Performance tab."
    commonMistakes:
      - "Не повертаються в zone через ngZone.run() після обчислень — UI не оновлюється коли потрібно"
      - "Думають runOutsideAngular вирішує всі performance проблеми — не вирішує expensive template expressions або deep CD trees"
    relatedQuestions: ["b11t3q4", "b11t3q1"]
---

## Core Concept

**English definition:** Angular runtime performance optimization encompasses reducing Change Detection (CD) overhead via `ChangeDetectionStrategy.OnPush` and Signals, preventing unnecessary DOM operations with `trackBy`/`track`, leveraging pure pipe memoization, virtualizing large lists with `CdkVirtualScrollViewport`, and offloading non-visual computations from the Angular zone via `NgZone.runOutsideAngular()`.

**Пояснення:** Runtime optimization — про те що відбувається після того як код завантажено і Angular запустився. На відміну від bundle optimization (менше коду) — runtime optimization про те як ефективно виконувати код. Angular Change Detection — найбільший runtime cost: за замовчуванням перевіряє весь компонентний tree при будь-якому async event. 500 компонентів + 60 events/second = 30,000 CD checks/second на idle app. OnPush + Signals + virtual scroll + runOutsideAngular — разом дають order-of-magnitude покращення.

**Яку проблему вирішує:** Default Angular app без оптимізацій: full CD tree traversal на кожен click/setTimeout/HTTP response. Великий список (1000+ items) без virtual scroll = 1000 DOM nodes + 1000 CD checks. Expensive template computations re-evaluated на кожному CD cycle. Heavy third-party event handlers (maps, canvas) trigger CD hundreds of times per second.

**Як працює під капотом:**

Change Detection pipeline з OnPush:
```
Async event (click, HTTP, timer)
        ↓
Zone.js intercepts → marks app for check
        ↓
ApplicationRef.tick()
        ↓
CD tree traversal (depth-first from root)
  For each component:
    - Default: always check template bindings
    - OnPush + not dirty: SKIP entire subtree ← O(subtree) savings
    - OnPush + dirty: check → mark clean → continue to children
    - Signal consumer: check only if signal dependencies changed
        ↓
DOM updates for changed bindings
        ↓
Post-CD lifecycle hooks (ngAfterViewChecked)
```

Signals CD optimization (Angular 17+):
```
signal.set(newValue)
        ↓
Marks dependent computed() і effects
        ↓
Microtask scheduled (not Zone.js)
        ↓
Only affected components re-checked
        ↓
DOM updated for changed bindings only
```

Virtual scroll rendering window:
```
Total items: 10,000
Viewport height: 600px
Item height: 50px

Visible range: scrollTop/50 → (scrollTop + 600)/50
Rendered DOM nodes: ~15 visible + 5 buffer each side = ~25 nodes
Phantom spacers: maintain correct scroll height

On scroll: recalculate range → create/destroy ~1-2 nodes per tick
vs without VS: 10,000 nodes always in DOM
```

**Trade-offs та обмеження:**

- OnPush з mutable objects — easy to introduce bugs (mutation без reference change → stale UI)
- Virtual scroll — не для всіх list types: tree views, sticky sections, variable-height items — складніші
- runOutsideAngular — потребує careful `ngZone.run()` для UI-affecting callbacks, inversion of control
- Pure pipe optimization — relies on reference equality: якщо input object мутується без new reference → stale cache
- Signals + OnPush + zoneless — найефективніший combination але потребує significant refactor для legacy apps

**Версійність:** OnPush ChangeDetectionStrategy — Angular 2+. trackBy для ngFor — Angular 2+. Track expression в @for — Angular 17 (mandatory). CdkVirtualScrollViewport — Angular CDK v7+, AutoSizeVirtualScrollStrategy — CDK v8. Signals — Angular 16 (developer preview), stable v17. `toSignal()` з `rxjs-interop` — Angular 16+. `provideExperimentalZonelessChangeDetection()` — Angular 18+. `ChangeDetectorRef.detach/reattach` — Angular 2+.

## Deep Details

### Edge Cases

**OnPush і ExpressionChangedAfterItHasBeenCheckedError:** Якщо `markForCheck()` викликається після CD cycle completed but before view checked — Angular emits error in dev mode. Pattern: якщо async data arrives in `ngAfterViewInit` з MarkForCheck — потрібний `detectChanges()` або setTimeout(()=>markForCheck()).

**Signal і OnPush compatibility:** OnPush + signal template reads — повністю сумісні. Signal read = reactive dependency. Signal write → dirty mark → CD on next frame. Signals replace need for markForCheck() in most cases.

**trackBy і component state:** List of `<item-component>` з internal state (form, expanded state). Without trackBy: on array update → all components recreated → state lost. With trackBy: components reused → state preserved. Correctness, not just performance.

**runOutsideAngular і RxJS:** `Observable.pipe(observeOn(asapScheduler))` — не те саме. observeOn changes execution context within RxJS. runOutsideAngular removes Zone.js tracking. For HTTP outside zone: `ngZone.runOutsideAngular(() => httpClient.get(...).subscribe(...))` — response callbacks outside zone.

**CdkVirtualScrollViewport і dynamic item height:** AutoSizeVirtualScrollStrategy вимірює DOM. Якщо item height змінюється після rendering (lazy-loaded image, expand/collapse) → scrollbar jumps. Fix: consistent heights або `viewport.checkViewportSize()` після DOM change.

**Pure pipe і arrays:** `filter(arr, fn)` pipe → `arr.filter(fn)` → new array reference always → cache miss every CD. Fix: memoize at component level з computed signal, use pipe only for display formatting (string, number, date).

### Junior vs Senior Understanding

**Junior** knows: OnPush = less CD, trackBy = no DOM recreation, pure pipe = cached, virtual scroll = renders visible only.

**Senior** understands:

1. **CD tree mechanics:** OnPush skips entire subtree. Dirty flag propagation. Signal reads create reactive subscriptions without Zone.js.

2. **trackBy correctness:** track by id for identity stability, component state preservation. track by $index = semantic issues for shifting lists.

3. **runOutsideAngular pattern:** Zone.js patch mechanism. Outside → no CD. `ngZone.run()` for re-entering. Profiling CD triggers to find sources.

4. **Virtual scroll implementation:** Fixed vs AutoSize strategies. Phantom spacers. cdkVirtualFor not *ngFor.

5. **Pure pipe memoization failure:** Mutable objects break caching. Computed signals as alternative.

### Deprecation & Migration Path

- **`ChangeDetectorRef.markForCheck()` for async data:** Still valid. Modern alternative: `toSignal(observable$)` + signal template reads → automatic CD without markForCheck(). Less imperative, better DX.
- **`ngFor trackBy: trackFn`:** Replaced by `@for (item of items; track item.id)` in Angular 17+ built-in control flow. Migration: `ng generate @angular/core:control-flow`. trackBy function syntax still works in ngFor directive.
- **`async` pipe з Observable:** Still valid but modern: `toSignal(obs$, { initialValue: [] })` — converts to readonly signal. No async pipe, no manual subscribe/unsubscribe, better type inference (no null handling needed).
- **`NgZone.runOutsideAngular()` necessity:** In zoneless apps — no Zone.js at all → runOutsideAngular нема потреби (no zone to run outside of). Migration path: OnPush + signals → zoneless.

### Connections to Other Concepts

- **Change Detection:** Runtime optimization IS about CD optimization — topic overlap intentional
- **Deferrable Views (@defer):** Deferred components не в CD tree until trigger fires — synergy with runtime optimization
- **Angular DevTools:** Profiler flame chart = primary tool for identifying runtime performance bottlenecks
- **Core Web Vitals:** INP directly impacted by CD cycle duration during user interactions

## Examples

### Basic Usage

```typescript
// OnPush component з signals
@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
  template: `
    @for (user of users(); track user.id) {
      <app-user-card [user]="user" />
    }
  `
})
export class UserListComponent {
  // Signal-based state — OnPush auto-updates when signal changes
  private userService = inject(UserService);
  users = this.userService.users; // readonly Signal<User[]>
}

// Child component: OnPush з signal input
@Component({
  selector: 'app-user-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <h3>{{ user().name }}</h3>
      <p>{{ user().email }}</p>
    </div>
  `
})
export class UserCardComponent {
  // Signal input — reactive, triggers CD only on reference change
  user = input.required<User>();
}
```

```typescript
// Virtual scrolling for large list
import { CdkVirtualScrollViewport, CdkVirtualForOf } from '@angular/cdk/scrolling';

@Component({
  standalone: true,
  imports: [CdkVirtualScrollViewport, CdkVirtualForOf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Fixed item size: most performant strategy -->
    <cdk-virtual-scroll-viewport
      itemSize="72"
      class="scroll-container"
      style="height: 500px; overflow-y: auto;">

      <!-- cdkVirtualFor — NOT *ngFor -->
      <app-row-item
        *cdkVirtualFor="let item of items$; let i = index; trackBy: trackById"
        [item]="item"
        [index]="i">
      </app-row-item>

    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .scroll-container { border: 1px solid #ccc; }
  `]
})
export class LargeListComponent {
  items$ = inject(DataService).items$; // Observable<Item[]>

  trackById(index: number, item: Item): string {
    return item.id;
  }
}
```

### Production Scenario

```typescript
// runOutsideAngular for animation loop + third-party library
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #chartCanvas></canvas>
    <div>Current value: {{ displayValue() }}</div>
  `
})
export class RealtimeChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  displayValue = signal<number>(0);
  private chart: Chart | null = null;
  private animationFrameId: number | null = null;

  ngOnInit(): void {
    // Initialize third-party chart OUTSIDE Angular zone
    // Prevents Chart.js events from triggering CD
    this.ngZone.runOutsideAngular(() => {
      this.chart = new Chart(this.canvasRef.nativeElement, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [] }] },
      });

      // Start data polling outside zone
      const wsService = inject(WebSocketService);
      wsService.dataStream$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(data => {
          // Update chart outside Angular — no CD triggered
          this.chart?.data.datasets[0].data.push(data.value);
          this.chart?.update('none'); // Chart.js update, no CD

          // Only enter Angular zone for display value update (once per batch)
          if (data.isSignificant) {
            this.ngZone.run(() => {
              this.displayValue.set(data.value); // This triggers CD
            });
          }
        });
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}

// Memoization with computed signals
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" />

    @for (item of filteredItems(); track item.id) {
      <li>{{ item.name | titlecase }}</li>
    }

    <p>Total: {{ filteredCount() }}</p>
  `
})
export class SearchableListComponent {
  private allItems = inject(ItemService).items; // Signal<Item[]>
  searchTerm = signal('');

  // Computed = memoized — only recomputes when allItems() or searchTerm() changes
  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allItems();
    return this.allItems().filter(i => i.name.toLowerCase().includes(term));
  });

  // Derived computation — also memoized
  filteredCount = computed(() => this.filteredItems().length);
}
```

### Anti-Example

```typescript
// WRONG: Mutable @Input() with OnPush — stale UI
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ item.name }} - {{ item.status }}`
})
export class OnPushCardComponent {
  @Input() item!: Item;
}

// Parent:
export class ParentComponent {
  item: Item = { id: 1, name: 'Test', status: 'active' };

  updateStatus(): void {
    this.item.status = 'inactive'; // WRONG: mutation, same reference
    // OnPush component won't detect change — UI stays stale
  }
}

// CORRECT: New reference triggers OnPush
export class CorrectParentComponent {
  item = signal<Item>({ id: 1, name: 'Test', status: 'active' });

  updateStatus(): void {
    // CORRECT: signal.update creates reactivity
    this.item.update(current => ({ ...current, status: 'inactive' }));
    // OR: this.item.set({ ...this.item(), status: 'inactive' });
  }
}

// WRONG: Expensive computation in template expression
@Component({
  template: `
    <!-- WRONG: heavyFilter() called on every CD cycle -->
    @for (item of heavyFilter(items); track item.id) {
      <li>{{ item.name }}</li>
    }
  `
})
export class BadComponent {
  items: Item[] = [];

  heavyFilter(items: Item[]): Item[] {
    // WRONG: runs on every CD cycle — O(n) work every frame
    return items.filter(item => item.score > 50).sort((a, b) => b.score - a.score);
  }
}

// CORRECT: computed signal — memoized
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of filteredItems(); track item.id) {
      <li>{{ item.name }}</li>
    }
  `
})
export class GoodComponent {
  private items = signal<Item[]>([]);

  // CORRECT: Only recomputes when items() changes
  filteredItems = computed(() =>
    this.items()
      .filter(item => item.score > 50)
      .sort((a, b) => b.score - a.score)
  );
}

// WRONG: ngFor without trackBy for large, frequently updated list
@Component({
  template: `
    <!-- WRONG: HTTP response returns new array → all 1000 DOM nodes recreated -->
    <li *ngFor="let user of users">{{ user.name }}</li>
  `
})
export class BadListComponent {
  users: User[] = [];

  constructor() {
    // Poll every 5 seconds
    interval(5000).pipe(
      switchMap(() => inject(UserService).getUsers())
    ).subscribe(users => this.users = users); // New array reference every time
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Мутація `@Input()` об'єкта в OnPush компоненті | OnPush не detect mutation без reference change → stale UI | Immutable updates: `{ ...obj, prop: newValue }` або signals |
| Expensive computation в template expression `{{ heavyFn(data) }}` | Виконується на кожному CD cycle (може бути 60fps+) | `computed(() => heavyFn(this.data()))` — memoized signal |
| `*ngFor` без `trackBy` для list з API polling | New array reference → all DOM nodes recreated кожні N секунд | `@for (item of items; track item.id)` або `ngFor trackBy` |
| Impur pipe для derived state | `transform()` on every CD cycle — expensive | `computed()` signal в компоненті, pure pipe тільки для formatting |
| Third-party animations/canvas у Angular zone | Zone.js triggers CD on every rAF → 60 CD cycles/second | `ngZone.runOutsideAngular(() => initThirdPartyLib())` |

## Interview Block

### [L1 — Warm-up] Що таке ChangeDetectionStrategy.OnPush і коли Angular запускає CD для OnPush компонента?

**Signal being tested:** Розуміння CD tree optimization і конкретних triggers для OnPush — не просто "перевіряє рідше".

**What the interviewer expects:** 5 triggers (Input reference change, async pipe emission, markForCheck, event binding, signal change), subtree skip, immutable data requirement.

**How to probe deeper:** "Що станеться якщо замутувати @Input() object замість нового reference в OnPush компоненті?"

**Reference answer:** OnPush = CD тільки при: @Input reference change, async pipe emission, markForCheck()/detectChanges(), event binding у шаблоні, signal() change. Default: перевіряється на кожен CD cycle. OnPush ізолює subtree: Angular пропускає весь subtree якщо компонент не dirty. Ключовий trap: mutation без reference change = OnPush не detects → UI stale.

**Common mistakes:** Думають OnPush = no CD ever; не знають про signal як trigger; мутують Input об'єкти.

### [L2 — Mid] Що таке trackBy в @for/@ngFor і чому він критичний для list performance і correctness?

**Signal being tested:** Розуміння IterableDiffer algorithm і того що trackBy стосується correctness, не тільки performance.

**What the interviewer expects:** DOM reuse vs recreate, differ algorithm, track by unique id (not $index for shifting lists), component state preservation.

**How to probe deeper:** "Що станеться з внутрішнім state компонента-рядка (форма, expanded state) якщо не використовувати trackBy при оновленні списку?"

**Reference answer:** Without track: Angular порівнює по reference. Новий array → нові references → всі DOM nodes recreated → component state (forms, expanded) lost. With track item.id: Angular reuses DOM nodes для existing items, тільки new/removed items operated. Performance: O(changed) vs O(n). @for (Angular 17+) обов'язковий track — eliminates antipattern. track $index: stable key але semantic bug якщо items переставляються (mismatched component state).

**Common mistakes:** track $index для lists де порядок може змінитись; не розуміють що це питання коректності, не тільки performance.

### [L3 — Senior] Яка різниця між pure і impure pipes і яка альтернатива з signals?

**Signal being tested:** Розуміння pipe memoization механізму і signal-based alternatives для derived state.

**What the interviewer expects:** Pure = cached by reference equality, impure = every CD cycle, mutable args break pure pipe, computed signal as superior alternative для derived state, async pipe — legitimate impure.

**How to probe deeper:** "Pure pipe отримує object argument. Що відбудеться якщо мутувати properties цього object?"

**Reference answer:** Pure pipe: reference equality check → same reference → cached result. Performance: O(1) for cache hit. Mutable arg bug: mutate object properties без new reference → pure pipe thinks same input → returns cached (stale) result. Must use new references. Impure pipe: runs every CD cycle — expensive. AsyncPipe: legitimate impure (subscription manager). Modern alternative: `computed(() => this.items().filter(fn))` — signal-based memoization, recomputes only when dependencies change. Better than pure pipe for derived state.

**Common mistakes:** Використовують impure pipe для async state; мутують array/object args до pure pipe.

### [L4 — Staff/Principal] Як NgZone.runOutsideAngular допомагає і як спроектувати оптимізований rendering pipeline для realtime data app?

**Signal being tested:** System-level understanding Zone.js patch mechanism, performance profiling approach, zoneless migration path.

**What the interviewer expects:** Zone.js patches async APIs → every completion triggers CD → runOutsideAngular breaks this. Pattern: computation outside zone, UI update inside. ngZone.run() for re-entry. Profiling: Angular DevTools → identify CD triggers → runOutsideAngular.

**How to probe deeper:** "Яка довгострокова альтернатива runOutsideAngular? Як відрізниться zoneless architecture?"

**Reference answer:** Zone.js intercepts всі async APIs. Completion inside zone → ApplicationRef.tick() → full CD. runOutsideAngular(fn): fn і її async completions outside zone → no CD. Pattern: third-party libs, rAF loops, WebSocket messages outside zone. `ngZone.run(() => signal.set(data))` for UI-affecting data only = single CD trigger per batch. Profiling: Angular DevTools Profiler → flame chart → trace frequent CD to event source. Long-term: zoneless (`provideExperimentalZonelessChangeDetection()`) — no Zone.js at all. runOutsideAngular unnecessary. Signals drive CD explicitly.

**Common mistakes:** Не повертаються в zone для UI updates; думають runOutsideAngular вирішує expensive template expressions.

---

## Summary

### Key Points
- `ChangeDetectionStrategy.OnPush` skips entire component subtree if not dirty — O(subtree) savings
- OnPush triggers: @Input reference change, async pipe, markForCheck, event binding, signal change
- `@for (item of items; track item.id)` — mandatory track in Angular 17+; prevents DOM recreation AND preserves component state
- Pure pipes memoize by reference equality — mutable args break cache; computed signals superior for derived state
- `CdkVirtualScrollViewport` з `*cdkVirtualFor` — renders only visible items, O(visible) vs O(n)
- `NgZone.runOutsideAngular()` prevents Zone.js from triggering CD on third-party events; `ngZone.run()` для UI re-entry
- Optimal combination: OnPush + signals + @for track + computed = zoneless-ready app

### Elevator Pitch (2 minutes)
Runtime optimization в Angular = контроль над Change Detection. Default: CD traverses entire tree on every async event. OnPush ізолює subtrees — Angular skips subtree якщо component не dirty. Dirty triggers: @Input reference change, event binding, markForCheck, signal write. Signal + OnPush = reactive: signal.set() → microtask → тільки affected components checked. track в @for (обов'язковий) — Angular reuses DOM nodes по identity key: correctness (form state preserved) + performance (no recreation). Pure pipe: memoized by reference equality — same reference → cached. Computed signal: superior alternative для derived state. Virtual scroll (CdkVirtualScrollViewport): 10,000 items → ~25 DOM nodes rendered. runOutsideAngular: important для third-party libs (Chart.js, Leaflet), rAF loops, WebSocket — executes outside Zone.js → no CD. `ngZone.run()` для re-entry when signal needs update. Zoneless (Angular 18+): no Zone.js at all — runOutsideAngular unnecessary. Profiling: Angular DevTools Profiler flame chart identifies bottlenecks.
