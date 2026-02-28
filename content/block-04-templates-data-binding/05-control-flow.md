---
title: "Control Flow: @if, @for, @switch, @defer"
block: 4
topic: 5
slug: "control-flow"
difficulty: 3
sinceVersion: "17"
tags: ["control-flow", "@if", "@for", "@switch", "@defer", "deferrable-views", "trackBy", "built-in-control-flow"]
relatedTopics: ["dynamic-templates", "binding-types", "structural-directives", "change-detection", "performance"]
interviewQuestions:
  - id: "b4t5q1"
    level: "junior"
    question: "Що таке нативний control flow в Angular і чим @if відрізняється від *ngIf?"
    referenceAnswers:
      junior: "@if — новий синтаксис Angular 17 що замінює *ngIf. Він читабельніший і не потребує NgIf імпорту. `@if (condition) { <div>show</div> } @else { <div>hide</div> }`."
      mid: "Angular 17 ввів native control flow: @if, @for, @switch, @defer — вбудований в template compiler, не директиви. Переваги над *ngIf: 1) Не потребує імпорту NgIf/CommonModule. 2) Підтримує @else if — без else-if ladder через окремі ngIf. 3) Кращий type narrowing — TypeScript бачить тип всередині @if block. 4) Compiler optimization — static analysis для CD optimization. 5) @else і @else if — нативна підтримка."
      senior: "Native control flow — це compiler-level construct, не runtime directive. Принципова відмінність: *ngIf створює embedded view через TemplateRef + structural directive mechanism (runtime overhead). @if — compile-time instruction що генерує conditional view creation inline в component function. TypeScript type narrowing всередині @if: `@if (user) { {{ user.name }} }` — user typed як non-null. `@else if` — тепер нативно без вкладеного @if. Згенерований код: `ɵɵconditional(condition ? 0 : 1)` instruction — efficient switch між embedded view templates. Performance: менше runtime overhead від directive class instantiation, краща compile-time аналітика для tree-shaking."
      staff: "Native control flow — архітектурний shift від runtime directives до compile-time constructs. Implications: 1) No NgModule dependency — standalone by default. 2) Compiler генерує optimal code path — знає структуру на compile time. 3) Incremental hydration integration — @if blocks є natural hydration boundaries (Angular 18+). 4) @defer — складніша форма @if з lazy loading semantics. Повна картина: Angular 19 stable native control flow, *ngIf/*ngFor deprecated but not removed. Migration: `ng generate @angular/core:control-flow-migration` — автоматична. Для enterprise codebases: поступова міграція блок за блоком, оскільки mixing обох синтаксисів в одному file — valid. Compiler з оновленим parser розуміє обидва одночасно."
    commonMistakes:
      - "Думають що @if потребує import NgIf — він вбудований, не директива"
      - "Не знають про type narrowing всередині @if — не використовують цю перевагу"
    relatedQuestions: ["b4t5q2", "b4t5q3"]
  - id: "b4t5q2"
    level: "mid"
    question: "Як правильно використовувати trackBy у @for і чому це критично для performance?"
    referenceAnswers:
      junior: "trackBy допомагає Angular відслідковувати елементи списку щоб не перерендерювати всі при зміні. Потрібно вказувати унікальний ідентифікатор."
      mid: "У @for: `track item.id` — Angular використовує ключ для diffing. Без track — Angular порівнює за object identity (===) — якщо масив перестворюється (наприклад від API) — всі DOM elements recreate навіть якщо data та сама. З track: Angular порівнює ключ — якщо ключ існує — DOM element reused, тільки inputs оновлюються. Для примітивів: `track $index` — але небезпечно при reordering. Для об'єктів: `track item.id` або `track item` якщо reference стабільна."
      senior: "trackBy mechanism в @for — це key function що returns unique identifier для кожного element. Angular LContainer зберігає map від key до view. При оновленні: 1) Runs key function для нового list. 2) Порівнює з previous keys. 3) Reuses existing views де keys match. 4) Creates нові де keys нові. 5) Destroys де keys зникли. Performance: DOM reuse = збережений DOM state (focus, scroll, CSS transitions). Для animations: element з тим самим key — continuation of animation, не reset. Vs *ngFor trackBy: синтаксис змінився, але mechanism аналогічний. `track $index` — dangerous при sorting/filtering: DOM reuse behind wrong data → incorrect state. Рекомендація: завжди `track item.id` якщо є stable ID."
      staff: "trackBy в контексті large-scale list rendering — critical performance decision. Key strategy impacts: 1) DOM node reuse — зберігає CSS transitions, focus state, scroll position. 2) Angular CD — якщо key exists і component OnPush — не re-render якщо input references unchanged. 3) Memory: нові keys = new LView allocation. Compound keys: `track item.type + '_' + item.id` для lists з mixed types. Virtual scroll integration: CDK VirtualScrollViewport з trackBy — virtualized rows корректно recycled. Signal store integration: `@for (item of items(); track item.id)` — якщо items() signal повертає new array з тими ж IDs — DOM nodes reused, тільки changed data re-renders. Profiling: Chrome DevTools + Angular DevTools — LiveProfiler показує які views recreated vs updated. Anti-pattern: `track item` для mutable objects — якщо reference змінюється (new object from API) — Angular destructs і recreates все навіть якщо content same. Завжди stable primitive key."
    commonMistakes:
      - "Використовують `track item` для objects з API responses — reference завжди нова → повний re-render"
      - "Використовують `track $index` при sorted/filtered lists — wrong DOM reuse"
    relatedQuestions: ["b4t5q1", "b4t5q3"]
  - id: "b4t5q3"
    level: "mid"
    question: "Що таке @defer і які triggers він підтримує для lazy rendering?"
    referenceAnswers:
      junior: "@defer дозволяє відкласти рендеринг частини template поки не виконається певна умова — наприклад viewport intersection або idle browser."
      mid: "@defer (Angular 17+) — lazy rendering block що завантажує компоненти і їх dependencies тільки при trigger. Triggers: `on idle` (requestIdleCallback), `on viewport` (IntersectionObserver), `on interaction` (click/focus), `on hover`, `on timer(delay)`, `when condition` (manual). Loading states: `@placeholder { }` — до завантаження, `@loading { }` — під час завантаження, `@error { }` — при помилці. Компоненти в @defer блоці автоматично code-split."
      senior: "@defer — compile-time code splitting mechanism. Compiler аналізує imports в @defer block і автоматично переносить їх до окремого lazy chunk. Runtime: @defer manager відслідковує trigger умови через відповідні browser API (IntersectionObserver, requestIdleCallback, event listeners). При trigger: dynamic import lazy chunk → compile і instantiate components. Prefetch: `@defer (on viewport; prefetch on idle)` — prefetch при idle, render при viewport. Minimum timer: `@loading (minimum 500ms; after 100ms)` — prevents flash of loading state. `when` condition — boolean expression що re-evaluates кожен CD. Nested @defer — кожен окремий chunk. Priority: якщо кілька triggers — перший що спрацює."
      staff: "@defer — це найзначніша performance feature Angular 17. Architectural implications: 1) Automatic route-level і component-level code splitting без manual dynamic import. 2) Progressive loading strategy: above-fold content eager, below-fold @defer on viewport. 3) Integration з SSR: @defer blocks мають окремі hydration semantics — placeholder рендериться server-side, client-side deferred hydration. 4) Incremental hydration (Angular 18+): @defer blocks + `hydrate on interaction` = islands of hydration. Measurement: @defer reduces initial bundle significantly — але треба балансувати request waterfalls. Prefetch strategy: `prefetch on idle` для critical-path components що likely needed. `prefetch when criticalSignal()` — signal-driven prefetch. Performance budget: кожен @defer = окремий HTTP request на lazy chunk. Grouping пов'язаних компонентів в один @defer block мінімізує requests. For Design System library authors: не використовувати @defer всередині library components — consumer вирішує lazy strategy."
    commonMistakes:
      - "Думають що @defer тільки для lazy loading — він також для progressive rendering і hydration"
      - "Не використовують prefetch — компонент завантажується тільки при trigger, може бути пізно"
    relatedQuestions: ["b4t5q2", "b4t5q4"]
  - id: "b4t5q4"
    level: "senior"
    question: "Як @defer взаємодіє з SSR і incremental hydration в Angular 18+?"
    referenceAnswers:
      junior: "@defer з SSR рендерить placeholder на сервері і завантажує content на клієнті."
      mid: "При SSR: @defer block рендерить @placeholder на сервері (або нічого якщо placeholder відсутній). На клієнті: hydration waiting для @defer trigger. @defer content не included в server-rendered HTML. Incremental hydration — Angular 18 feature де @defer blocks можуть hydrate окремо на demand."
      senior: "@defer і SSR interaction: за замовчуванням @defer content не rendered server-side. `@defer (hydrate on viewport)` — SSR рендерить content, client-side hydrates тільки при viewport trigger. Без hydrate trigger — standard @defer behavior: placeholder server-side, lazy load client-side. Incremental hydration (Angular 18, stable 19): `provideClientHydration(withIncrementalHydration())` — дозволяє @defer blocks hydrate незалежно. DOM зберігається від SSR, event handlers attached on demand. `@defer (hydrate on interaction)` — hydrates при першому click/focus. Transfer state: @defer content може включати TransferState для data що потрібна при hydration без new HTTP request."
      staff: "Incremental hydration з @defer — це Angular's Islands Architecture implementation. Порівняння з Astro/Fresh: аналогічна концепція (islands of interactivity) але інтегрована в Angular framework vs окремий framework. Technical implementation: Server renders full component tree включно з @defer content. Client receives HTML з dehydration annotations. Hydration manager відслідковує @defer block boundaries. При trigger: Angular hydrates тільки той block — attaches event listeners, initializes signals, connects CD. Non-hydrated blocks залишаються static HTML. Performance gains: нульовий JS для non-interactive content until needed. Measurement: Lighthouse TTI, TBT metrics — @defer + incremental hydration dramatically improves both. Architectural decision: які блоки з incremental hydration vs eager: above-fold interactive content — eager, below-fold, non-critical interactions — incremental. Trade-off: complexity vs performance. For large content sites (documentation, marketing): significant gains. For highly interactive apps (dashboards): less benefit."
    commonMistakes:
      - "Думають що @defer завжди виключає SSR rendering — насправді можна контролювати через hydrate trigger"
      - "Не розуміють різницю між @defer (lazy load) і @defer (hydrate) — різні semantics"
    relatedQuestions: ["b4t5q3", "b4t5q5"]
  - id: "b4t5q5"
    level: "staff"
    question: "Як би ви спроектували performance стратегію для content-heavy Angular application використовуючи всі можливості нового control flow?"
    referenceAnswers:
      junior: "Використовував би @defer для компонентів що не видно зразу і @if/@for для умовного рендерингу."
      mid: "Стратегія: @if для conditional rendering замість *ngIf, @for з track id для списків, @defer on viewport для below-fold content, @defer on idle для non-critical features, route lazy loading для page-level code splitting."
      senior: "Комплексна стратегія: 1) Route level: loadComponent для all routes — automatic code splitting. 2) Component level: @defer on viewport для below-fold sections. 3) Feature level: @defer when userHasFeature() для conditional features. 4) Interaction level: @defer on interaction для complex editors/pickers. 5) Prefetch strategy: @defer (on viewport; prefetch on idle) для likely-needed content. 6) Lists: @for з track item.id + OnPush components + signals. 7) CD optimization: zoneless Angular + signals для interactive parts. 8) Placeholder quality: meaningful @placeholder content (skeleton screens, not spinners)."
      staff: "Performance architecture для content-heavy Angular app потребує holistic thinking. Core principles: 1) Render budget: Time to First Contentful Paint < 1.5s для above-fold. 2) Hydration strategy: withIncrementalHydration() + @defer (hydrate on interaction) для interactive islands. 3) Bundle analysis: webpack-bundle-analyzer + Angular CLI stats output — identify largest chunks для @defer candidates. 4) @defer grouping: related components в одному @defer block — один request замість N. 5) Prefetch intelligence: prefetch based on user intent signals (hover before click, scroll velocity). 6) Signal-based CD: computed + signal inputs = granular updates без full tree re-check. 7) Virtual scroll: CDK VirtualScrollViewport для long lists навіть з @for. 8) Image optimization: NgOptimizedImage з @defer — lazy load images + lazy load Angular image infrastructure. 9) Service Workers: precaching lazy chunks при idle — @defer chunks available offline. 10) Core Web Vitals monitoring: Angular Devtools + real user monitoring (Datadog, New Relic) для measuring impact. Key metric: @defer on viewport reduces initial JS by 40-60% for typical enterprise dashboards — measurable ROI for implementation effort."
    commonMistakes:
      - "Застосовують @defer до всього включно з above-fold content — збільшує TTFB через request waterfall"
      - "Не вимірюють ефект @defer — оптимізують без baseline metrics"
    relatedQuestions: ["b4t5q4", "b4t5q3"]
---

## Core Concept

**English definition:** Angular's built-in control flow (`@if`, `@for`, `@switch`, `@defer`), introduced as stable in Angular 17, is a compiler-native template syntax for conditional rendering, list iteration, pattern matching, and deferred/lazy rendering that replaces structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`) with zero-overhead compile-time constructs.

**Пояснення:** Angular 17 ввів нативний control flow як альтернативу структурним директивам. `@if`/`@else if`/`@else` — умовний рендеринг з TypeScript type narrowing. `@for`/`@empty` — ітерація з обов'язковим `track` для performance. `@switch`/`@case`/`@default` — pattern matching. `@defer` — lazy/deferred rendering з triggers і loading states. На відміну від `*ngIf/*ngFor` — це compiler primitives, не runtime directives.

**Яку проблему вирішує:** Структурні директиви мають runtime overhead (directive class instantiation, property binding check), потребують NgModule import, не мають else-if. TypeScript type narrowing не працює всередині *ngIf. @defer вирішує code splitting проблему без manual dynamic import. Нативний control flow — compile-time constructs з кращим bundle analyzer support і tree-shaking.

**Як працює під капотом:** @if компілюється в `ɵɵconditional(conditionIndex, templateFnIndex)` instruction. @for — `ɵɵrepeater(items, trackFn, templateFn, emptyFn)` з оптимізованим reconciliation algorithm. @defer — окремі lazy chunk entries в webpack config генеруються Ivy compiler, trigger manager відслідковує IntersectionObserver/idle/event. При @defer trigger: dynamic `import()` lazy chunk → Angular bootstrap компонентів у block.

**Trade-offs та обмеження:** @defer автоматично code-splits компоненти — кожен block потенційно окремий HTTP request. Кількість @defer blocks варто балансувати. *ngIf/*ngFor — deprecated але не removed — migration не обов'язкова відразу. type narrowing в @if — TypeScript тільки в тілі block, не в @else. `track` у @for — mandatory (на відміну від trackBy в *ngFor де optional але recommended).

**Версійність:** Native control flow developer preview Angular 17 (листопад 2023), stable Angular 17.1 (грудень 2023). @defer developer preview Angular 17, stable Angular 17.2. Incremental hydration з @defer hydrate — Angular 18 experimental, Angular 19 stable. *ngIf/*ngFor — deprecated Angular 17, залишаються до майбутнього major release. Migration: `ng generate @angular/core:control-flow-migration`.

---

## Deep Details

### Edge Cases

**@for track requirement:** На відміну від *ngFor де trackBy опціональний (але рекомендований), в @for `track` є mandatory — compiler enforces. Якщо немає stable ID: `track $index` — але небезпечно при reordering. `track item` — тільки якщо references стабільні.

**@for implicit variables:** `$index`, `$count`, `$first`, `$last`, `$even`, `$odd` — всі доступні без destructuring. `let isFirst = $first` — explicit aliasing якщо потрібно передати в child.

**@if type narrowing:** TypeScript narrowing всередині @if block: `@if (user !== null) { {{ user.name }} }` — user: User (not null). В @else — nullable type повертається. Це не працювало з *ngIf.

**@defer і imports:** Компоненти/directives/pipes в @defer block МУСЯТЬ бути в imports масиві компоненту — але Ivy compiler автоматично переносить їх до lazy chunk. Якщо component використовується і в @defer і поза ним — Ivy вирішує це автоматично (shared chunk або eager).

**@defer @error block:** Якщо lazy chunk fails to load (network error) — @error block показується. Default: нічого не показується при error. Завжди визначайте @error для production.

**@switch без default:** @switch без @default — якщо жоден @case не match — nothing rendered. Немає компілятор попередження — silently empty. Завжди додавайте @default.

**Mixing old and new syntax:** Angular підтримує обидва синтаксиси в одному file. `<div *ngIf="...">` поряд з `@if (...) {}` — valid. Але не змішуйте в одному рядку.

### Junior vs Senior Understanding

**Junior** знає синтаксис @if/@for/@switch/@defer, розуміє @else і @empty, знає що track потрібен.

**Senior** розуміє:

1. **Compile-time vs runtime:** Структурні директиви — runtime (directive class, change detection, input binding). Нативний control flow — compile-time instructions, без directive overhead.

2. **@for reconciliation algorithm:** Коли items array змінюється: Angular runs track function для кожного item в новому і старому list, порівнює keys, creates/destroys/reorders LViews відповідно. O(n) де n — list length.

3. **TypeScript type narrowing:** @if з type guard — TypeScript знає тип всередині block. Це дозволяє `.property` доступ без non-null assertion.

4. **@defer lazy chunk splitting:** Compiler аналізує static imports і визначає lazy boundary. Components в @defer block → окремий webpack chunk. Prefetch on idle — використовує requestIdleCallback для фонового завантаження.

5. **@defer і hydration:** SSR renders @defer content якщо `hydrate` trigger вказаний. Incremental hydration — @defer blocks як islands, hydrate on demand.

### Deprecation & Migration Path

- **`*ngIf`, `*ngFor`, `*ngSwitch`:** Deprecated in Angular 17. Рекомендовано мігрувати на @if, @for, @switch. Automated: `ng generate @angular/core:control-flow-migration`.
- **`NgIf`, `NgFor`, `NgSwitch` directive imports:** Більше не потрібні при використанні нативного control flow.
- **`NgTemplateOutlet` для @else pattern:** `*ngIf="cond; else tpl"` → `@if (cond) { ... } @else { ... }` — набагато читабельніше.
- **Structural directive `*ngFor trackBy`:** Замінюється `track` — більш лаконічний синтаксис.

### Connections to Other Concepts

- **Change Detection:** @if/@for — embedded views детектуються в рамках host CD. @defer content — окремий CD context після lazy load.
- **SSR і Hydration:** @defer з `hydrate` triggers — incremental hydration pattern. @placeholder в SSR HTML.
- **Performance:** @defer = code splitting without manual import(). @for з track = DOM reuse. Поєднання з OnPush + Signals = максимальна CD optimization.
- **Structural Directives:** @if/@for замінюють directive-based approach. Custom structural directives залишаються валідними для complex use cases.

---

## Examples

### Basic Usage

```typescript
@Component({
  selector: 'app-control-flow-demo',
  standalone: true,
  template: `
    <!-- @if with else-if chain -->
    @if (status === 'loading') {
      <app-spinner />
    } @else if (status === 'error') {
      <app-error-banner [message]="errorMessage" />
    } @else if (status === 'empty') {
      <p class="empty-state">No results found</p>
    } @else {
      <app-results [data]="data" />
    }

    <!-- @for with track and implicit variables -->
    <ul>
      @for (item of items; track item.id; let i = $index, isLast = $last) {
        <li [class.last]="isLast">{{ i + 1 }}. {{ item.name }}</li>
      } @empty {
        <li>No items available</li>
      }
    </ul>

    <!-- @switch for pattern matching -->
    @switch (userRole) {
      @case ('admin') { <app-admin-panel /> }
      @case ('editor') { <app-editor-toolbar /> }
      @case ('viewer') { <app-read-only-view /> }
      @default { <p>Unknown role</p> }
    }
  `
})
export class ControlFlowDemoComponent {
  status: 'loading' | 'error' | 'empty' | 'loaded' = 'loaded';
  errorMessage = '';
  data: any[] = [];
  items = [{ id: 1, name: 'Angular' }, { id: 2, name: 'TypeScript' }];
  userRole = 'admin';
}
```

### Production Scenario

```typescript
// @defer for below-fold content with progressive loading
@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [
    // Eager: above fold
    ProductHeroComponent,
    ProductPriceComponent,
    // These will be deferred (moved to lazy chunks by compiler)
    ProductReviewsComponent,
    RelatedProductsComponent,
    ProductRecommendationsComponent,
  ],
  template: `
    <!-- Above fold: eager rendering -->
    <app-product-hero [product]="product()" />
    <app-product-price [price]="product().price" />

    <!-- Below fold: defer on viewport -->
    @defer (on viewport; prefetch on idle) {
      <app-product-reviews [productId]="product().id" />
    } @placeholder (minimum 200ms) {
      <!-- Skeleton screen — matches layout to prevent CLS -->
      <div class="reviews-skeleton">
        @for (_ of skeletonRows; track $index) {
          <div class="skeleton-row"></div>
        }
      </div>
    } @loading (minimum 500ms; after 100ms) {
      <app-spinner size="sm" />
    } @error {
      <p>Failed to load reviews. <button (click)="retryReviews()">Retry</button></p>
    }

    <!-- Non-critical: defer on idle -->
    @defer (on idle; prefetch on hover) {
      <app-related-products [category]="product().category" />
    } @placeholder {
      <div class="related-skeleton"></div>
    }

    <!-- User-triggered: defer on interaction -->
    @defer (on interaction(recommendationsTrigger)) {
      <app-product-recommendations [userId]="userId()" />
    } @placeholder {
      <button #recommendationsTrigger>Show Recommendations</button>
    }
  `
})
export class ProductPageComponent {
  product = input.required<Product>();
  userId = input.required<string>();
  skeletonRows = Array(5);

  retryReviews(): void {
    // Implement retry logic
  }
}

// @for with signal-based list and proper tracking
@Component({
  selector: 'app-todo-list',
  standalone: true,
  template: `
    <div class="todo-list">
      @for (todo of todos(); track todo.id) {
        <div class="todo-item"
             [class.completed]="todo.completed">
          <input type="checkbox"
                 [checked]="todo.completed"
                 (change)="toggle(todo.id)">
          <span>{{ todo.title }}</span>
          <button (click)="delete(todo.id)">Delete</button>
        </div>
      } @empty {
        <p class="empty-state">All done! Add a new todo above.</p>
      }
    </div>
    <p>{{ completedCount() }} of {{ todos().length }} completed</p>
  `
})
export class TodoListComponent {
  todos = signal<Todo[]>([]);
  completedCount = computed(() => this.todos().filter(t => t.completed).length);

  toggle(id: string): void {
    this.todos.update(todos =>
      todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }

  delete(id: string): void {
    this.todos.update(todos => todos.filter(t => t.id !== id));
  }
}
```

### Anti-Example

```typescript
// WRONG: Old structural directive style mixed with bad practices
@Component({
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase],  // Unnecessary with native control flow
  template: `
    <!-- WRONG: *ngIf without else — harder to read, no type narrowing -->
    <div *ngIf="user !== null">{{ user!.name }}</div>  <!-- Non-null assertion needed -->

    <!-- WRONG: *ngFor without trackBy — performance issue -->
    <div *ngFor="let item of items">{{ item.name }}</div>

    <!-- WRONG: @for without track -->
    @for (item of items) {  <!-- Compiler error: track is required -->
      {{ item }}
    }

    <!-- WRONG: @defer above fold — request waterfall hurts performance -->
    @defer (on viewport) {
      <app-hero />  <!-- This is the main hero, it should be eager! -->
    }

    <!-- WRONG: @switch without @default — silent empty render -->
    @switch (role) {
      @case ('admin') { <admin-view /> }
      @case ('user') { <user-view /> }
      <!-- No @default — unknown roles silently render nothing -->
    }
  `
})
export class BadControlFlowComponent {
  user: User | null = null;
  items: Item[] = [];
  role = 'guest';
}

// CORRECT:
@Component({
  // No NgIf/NgFor imports needed
  template: `
    <!-- Type narrowing works automatically -->
    @if (user !== null) {
      {{ user.name }}  <!-- TypeScript knows user is not null here -->
    }

    <!-- track is required and explicit -->
    @for (item of items; track item.id) {
      {{ item.name }}
    }

    <!-- Eager for above-fold -->
    <app-hero />

    <!-- @default always present -->
    @switch (role) {
      @case ('admin') { <admin-view /> }
      @case ('user') { <user-view /> }
      @default { <access-denied /> }
    }
  `
})
export class GoodControlFlowComponent {
  user: User | null = null;
  items: Item[] = [];
  role = 'guest';
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `@for` без `track` | Compiler error — але якщо використовувати `track $index` для mutable list — incorrect DOM reuse | `track item.id` зі stable unique identifier |
| `@defer` для above-fold content | Request waterfall — критичний контент завантажується пізніше → bad FCP/LCP metrics | Eager rendering для above-fold, @defer тільки для below-fold |
| `@switch` без `@default` | Silent empty render при невідомих значеннях — debugging nightmare | Завжди додавати `@default` з fallback UI або error state |
| Mixing `*ngIf` і `@if` в одному компоненті | Inconsistency, два стилі — confusion для команди | Мігрувати на `@if` повністю: `ng generate @angular/core:control-flow-migration` |
| `@defer` без `@error` block | Network failures silently invisible | Завжди `@error { <retry-button /> }` для deferred blocks |

---

## Interview Block

### [L1 — Warm-up] Що таке нативний control flow в Angular і чим @if відрізняється від *ngIf?
**Signal being tested:** Знання Angular 17+ syntax і розуміння переваг compiler-native підходу над runtime directives.
**What the interviewer expects:** Знання @if/@for/@switch/@defer, розуміння що це compiler primitives, переваги: no NgIf import, else-if support, TypeScript narrowing.
**How to probe deeper:** "Як TypeScript type narrowing відрізняється між *ngIf і @if?"
**Reference answer:** @if — compile-time instruction, не runtime directive. Переваги: не потребує NgIf import, нативна підтримка else-if, TypeScript type narrowing всередині block. `@if (user !== null) { user.name }` — TypeScript знає що user не null. *ngIf: `<div *ngIf="user !== null">{{ user!.name }}</div>` — потрібен non-null assertion. Compiler оптимізує @if краще оскільки знає структуру статично.
**Common mistakes:** Думають що @if потребує import; не знають про type narrowing перевагу.

### [L2 — Mid] Як правильно використовувати trackBy у @for і чому це критично для performance?
**Signal being tested:** Розуміння DOM reconciliation algorithm і практичні наслідки неправильного tracking.
**What the interviewer expects:** track з stable ID, чому `track item` небезпечно з API responses, чому `track $index` небезпечно при reordering, DOM reuse benefits.
**How to probe deeper:** "Що відбувається якщо використати `track $index` коли список сортується за user interaction?"
**Reference answer:** track в @for — key для Angular reconciliation. Angular mapує existing views за ключем. Якщо key match — view reused (DOM state збережений). Нові keys — нові views. Зниклі keys — destroy. `track item.id` — stable unique key = optimal. `track $index` при reorder — views reused за позицією, не за identity — incorrect DOM state. `track item` — якщо reference нова (API response) — все recreated навіть якщо data та сама.
**Common mistakes:** `track item` для API objects; `track $index` для sortable lists.

### [L3 — Senior] Що таке @defer і які triggers він підтримує для lazy rendering?
**Signal being tested:** Розуміння code splitting механізму @defer і стратегічний вибір trigger types для різних UX scenarios.
**What the interviewer expects:** Всі trigger types (on idle/viewport/interaction/hover/timer/when), loading states, prefetch strategy, @error block, compile-time code splitting.
**How to probe deeper:** "Як @defer взаємодіє з SSR і що рендериться server-side?"
**Reference answer:** @defer triggers: on idle (requestIdleCallback), on viewport (IntersectionObserver), on interaction (first click/focus), on hover, on timer(N), when condition. Loading states: @placeholder (before load), @loading (during, minimum/after options), @error (failure). Prefetch: `@defer (on viewport; prefetch on idle)`. Compiler автоматично code-splits lazy chunks. SSR: @placeholder rendered server-side за замовчуванням.
**Common mistakes:** Застосовують до above-fold content; не визначають @error block; не використовують prefetch.

### [L4 — Staff/Principal] Як би ви спроектували performance стратегію для content-heavy Angular application використовуючи всі можливості нового control flow?
**Signal being tested:** Системне мислення про performance бюджет, правильне застосування @defer стратегій і вимірювання ефекту.
**What the interviewer expects:** Layered strategy (route/component/feature level), prefetch intelligence, incremental hydration, Core Web Vitals measurement, trade-offs between request count і bundle size.
**How to probe deeper:** "Як виміряти ROI від впровадження @defer стратегії і які метрики ви б використовували?"
**Reference answer:** Стратегія: route-level loadComponent, component-level @defer on viewport для below-fold, @defer on idle для non-critical, prefetch on hover/idle для likely-needed. @defer grouping — пов'язані компоненти в одному block = один request. Incremental hydration для SSR apps. Measurement: Lighthouse LCP/FCP/TBT baseline → after @defer → delta. Real user monitoring для production validation. Не застосовувати @defer до above-fold — waterfall hurt FCP.
**Common mistakes:** Застосовують @defer скрізь без measurement; не враховують request waterfall overhead.

---

## Summary

### Key Points
- Angular 17 native control flow (@if, @for, @switch, @defer) — compiler primitives, не runtime directives
- @if: TypeScript type narrowing всередині block, нативний @else if без шаблонних tricks
- @for: `track` є mandatory, рекомендовано `track item.id` зі stable unique key — DOM reuse
- @defer: автоматичний code splitting, triggers (on idle/viewport/interaction/hover/timer/when), prefetch strategy
- @defer loading states: @placeholder (before load), @loading (during), @error (failure) — завжди визначати @error
- Incremental hydration (Angular 18+): @defer blocks з `hydrate` triggers = islands architecture
- Migration: `ng generate @angular/core:control-flow-migration` — автоматична міграція від *ngIf/*ngFor

### Elevator Pitch (2 minutes)
Angular 17 native control flow — @if, @for, @switch, @defer — це compiler-native constructs що замінюють *ngIf/*ngFor structural directives. @if: нативна TypeScript type narrowing в block, @else if без вкладення. @for: обов'язковий `track item.id` для DOM reconciliation і reuse. @switch з @default — завжди. @defer — killer feature: автоматичний code splitting без manual dynamic import, triggers on viewport/idle/interaction/hover, prefetch strategy для progressive loading. Loading states: @placeholder/`@loading`/@error. З SSR: `@defer (hydrate on interaction)` = incremental hydration (Angular 19). Практика: eager above-fold, @defer below-fold на viewport, prefetch on idle. Міграція: `ng generate @angular/core:control-flow-migration`.
