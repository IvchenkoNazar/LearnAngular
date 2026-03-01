---
title: "ViewChild, ContentChild & Signal Queries"
block: 2
topic: 5
slug: "viewchild-contentchild"
difficulty: 4
sinceVersion: "2"
tags: ["ViewChild", "ContentChild", "signal-queries", "viewChildren", "contentChildren", "ElementRef", "QueryList"]
relatedTopics: ["content-projection", "lifecycle-hooks", "component-metadata", "host-element"]
interviewQuestions:
  - level: "junior"
    question: "Що таке ViewChild і ContentChild? В чому різниця між ними?"
    referenceAnswers:
      junior: "ViewChild дозволяє отримати посилання на елемент або компонент з власного template компонента. ContentChild — те саме але для контенту що проєктується через ng-content. ViewChild шукає в view component, ContentChild — в projected content."
      mid: "ViewChild і ContentChild — це декоратори що дають прямий доступ до DOM-елементів, компонентів або директив. ViewChild шукає в template самого компонента (view hierarchy). ContentChild шукає серед nodes що проєктуються через ng-content — тобто контент що передав parent. Timing різний: ViewChild доступний в ngAfterViewInit, ContentChild — в ngAfterContentInit. Обидва можуть шукати по type (клас компонента/директиви) або по template reference variable (#ref)."
      senior: "ViewChild і ContentChild реалізовані через Angular's query mechanism. ViewChild — query в component's own view (LView nodes). ContentChild — query в projected content nodes. Під капотом: compiler генерує TView.queries array де кожна query — це TQuery object з predicate (type або string), flags (descendants, static), і pointer. При view initialization runtime матчить query predicate проти node definitions в TView. Static queries (static: true) resolve під час view creation (можна використовувати в ngOnInit). Dynamic queries (static: false — default) resolve після view/content init. Множинний доступ через ViewChildren/ContentChildren повертає QueryList — живий колекція що автоматично оновлюється при structural changes."
      staff: "ViewChild/ContentChild — це compile-time query primitive що Angular compiler трансформує в view flags і query definitions. Architectural implications: прямий доступ до child — це порушення encapsulation і створює tight coupling. Кращі альтернативи: Signals для state sharing, Outputs для events, Services для cross-component communication. Signal-based queries (Angular v17+) — viewChild(), contentChild() — вирішують проблему async timing через computed/effect reactivity. Для component library: публічні ViewChild-powered APIs (методи на компоненті) — acceptable pattern. Але коли consumer code отримує ViewChild на internal component — це порушення API boundaries. Migration path від QueryList до signal queries: QueryList.changes RxJS Observable замінюється на effect() або computed(). Performance: queries з descendants: true — дорожчі, Angular 19+ рекомендує signal queries як primary approach."
    commonMistakes:
      - "Звертаються до ViewChild в ngOnInit — він ще не ініціалізований (тільки в ngAfterViewInit)"
      - "Плутають ContentChild і ViewChild — ContentChild для projected content, не для власного template"
    relatedQuestions: ["b2t5q2", "b2t5q3"]
  - level: "mid"
    question: "Яка різниця між signal-based queries (viewChild(), contentChild()) і decorator-based queries (@ViewChild, @ContentChild)?"
    referenceAnswers:
      junior: "signal-based queries — новий спосіб (Angular 17+). Повертають Signal замість прямого значення. Декоратори — старий спосіб."
      mid: "Decorator queries (@ViewChild) встановлюють значення на властивість компонента асинхронно — воно undefined до ngAfterViewInit і потребує lifecycle hook для реакції. Signal queries повертають Signal<T> — reactive value що автоматично оновлюється. Це дозволяє використовувати viewChild() в computed() і effect() без lifecycle hooks. Також signal queries type-safe: viewChild(SomeComponent) повертає Signal<SomeComponent | undefined>, viewChild.required(SomeComponent) повертає Signal<SomeComponent> (throws if not found)."
      senior: "Ключові відмінності: 1) Timing: @ViewChild — imperative, requires ngAfterViewInit callback. viewChild() — reactive, signal автоматично ready after view init, можна читати в template і effect(). 2) Type safety: @ViewChild може бути undefined без TypeScript warning. viewChild.required() throws runtime error якщо query не знайдена — чітка семантика. 3) Reactivity: QueryList.changes — Observable, потребує subscribe/unsubscribe. viewChildren() — Signal<readonly T[]>, автоматично triggers computed/effect. 4) Composition: signal queries composable — можна побудувати computed() поверх кількох queries. 5) Under the hood: signal queries використовують той самий TView.queries механізм але результат wrapped у WritableSignal що Angular оновлює після view changes."
      staff: "Signal queries — це частина Angular's Signals architecture що вирішує fundamental problem: bridge між imperative lifecycle hooks і reactive data model. Decorator queries мають hidden mutable state — компонент має private mutable reference що змінюється в lifecycle — ускладнює reasoning і тестування. Signal queries: immutable reference (readonly signal), зміни explicit і traceable через signal graph. Migration strategy: поступова — можна мати mix @ViewChild і viewChild() в одному компоненті. В component library context: signal queries дозволяють expose reactive API без EventEmitter чи Subjects. Performance: Angular devtools може visualize signal dependency graph — signal queries стають частиною reactivity graph. Angular 19 lint rules попереджають про @ViewChild usage в нових компонентах — clear migration direction."
    commonMistakes:
      - "Намагаються використати viewChild() в ngOnInit і чекають значення — signal ready після view init, але читати можна де завгодно"
      - "Забувають що viewChild() без required повертає Signal<T | undefined>"
    relatedQuestions: ["b2t5q1", "b2t5q3", "b2t5q4"]
  - level: "mid"
    question: "Як працює ViewChildren/viewChildren() і що таке QueryList? Коли потрібні множинні queries?"
    referenceAnswers:
      junior: "ViewChildren повертає всі елементи що відповідають запиту, а не тільки перший. Результат — колекція."
      mid: "ViewChildren/@ViewChildren повертає QueryList<T> — живу колекцію що оновлюється при structural changes (додавання/видалення елементів в @for, @if). QueryList має changes: Observable<QueryList<T>> для реакції на зміни. viewChildren() (signal) повертає Signal<readonly T[]> — теж реактивна, але через signals. Типові use cases: доступ до всіх child компонентів одного типу (tabs, accordion items), focus management в списку елементів, batch operations над child instances."
      senior: "QueryList — спеціальний iterable object що Angular оновлює після кожного CD cycle де structural changes відбулись. Важливе: changes Observable emit після кожного oновлення — треба unsubscribe в ngOnDestroy (або takeUntilDestroyed()). QueryList.toArray(), .first, .last — convenience accessors. Descendants flag (за замовчуванням false для ViewChildren): з {descendants: true} — шукає глибоко в subtree. Без — тільки direct children. Signal version: viewChildren(Token) — Signal<readonly Token[]>. При @for changes Angular оновлює signal value автоматично — effect() і computed() реагують без explicit subscription. For keyboard navigation: viewChildren(ItemComponent) + computed() для active index — clean reactive pattern без QueryList.changes."
      staff: "QueryList — legacy reactive primitive до появи Signals. Проблеми: 1) BehaviorSubject-like but not standard — потребує special handling. 2) changes fires after every CD round що includes structural changes — може викликати ExpressionChangedAfterItHasBeenChecked в dev mode якщо читати QueryList в lifecycle hooks. 3) Memory leak якщо не unsubscribe від changes. Signal viewChildren() вирішує всі три: computed/effect auto-cleanup через DestroyRef, Angular manages notification scheduling. Architectural use case: в component library (tabs, stepper, carousel) — множинні queries для child directives. Pattern: parent directive queries all child directives, coordinates their state. TabGroup queries TabPanel directives, manages active state. Signal-based: selectedIndex = signal(0); activePanels = viewChildren(TabPanel) — clean, composable, testable."
    commonMistakes:
      - "Не unsubscribe від QueryList.changes — memory leak"
      - "Плутають ViewChildren (всі) і ViewChild (перший знайдений)"
    relatedQuestions: ["b2t5q2", "b2t5q4"]
  - level: "senior"
    question: "Поясніть timing проблеми при роботі з ViewChild і ContentChild. Чому є AfterViewInit і AfterContentInit? Як signal queries змінюють ситуацію?"
    referenceAnswers:
      junior: "ViewChild не готовий в ngOnInit — треба чекати ngAfterViewInit. ContentChild готовий в ngAfterContentInit."
      mid: "Angular ініціалізує lifecycle в певному порядку: спочатку перевіряє content (projected nodes) в ngAfterContentInit, потім view (template) в ngAfterViewInit. Тому ContentChild доступний раніше ніж ViewChild. Якщо звертатись до ViewChild в ngOnInit — він буде undefined. static: true дозволяє отримати ViewChild в ngOnInit якщо query не залежить від structural directives (@if, @for)."
      senior: "Timing деталі: 1) ngOnChanges, ngOnInit — view ще не ініціалізована, ViewChild undefined. 2) ngAfterContentInit — projected content ініціалізовано, ContentChild доступний. 3) ngAfterContentChecked — після кожної CD для content. 4) ngAfterViewInit — view і всі child views ініціалізовані, ViewChild доступний. 5) ngAfterViewChecked — після кожної CD для view. static: true — query resolve synchronously під час view creation (перед lifecycle callbacks). Можна використовувати в ngOnInit. Але: static: true не працює з structural directives (query може не знайти елемент). ExpressionChangedAfterItHasBeenChecked: зміна ViewChild reference в ngAfterViewInit може викликати цю помилку в dev mode — Angular вже закінчив CD round. Signal queries вирішують timing: viewChild() signal — undefined до view init, після — reactive value. Читати в template, effect(), computed() — Angular ensures correct timing."
      staff: "Timing проблеми ViewChild — це symptom більшої проблеми: imperative access до declarative tree. Angular's view initialization є depth-first: parent initializes after all children. Тому AfterViewInit fires bottom-up. Content initialization — top-down (projected content ініціалізується в parent context). ExpressionChangedAfterItHasBeenChecked — одна з найбільш confusing Angular errors. Причина: під час CD Angular записує binding values, потім checks children, потім re-checks parent bindings — якщо ViewChild використовується для встановлення binding і змінюється в AfterViewInit — assertion fails. Fixes: setTimeout (hack), ChangeDetectorRef.detectChanges() (тригер CD), signal queries (elegant). Signal timing guarantee: viewChild() value update scheduled as part of signal graph — Angular updates signal після view init але перед CD re-run. Архітектурна рекомендація: якщо виникають timing проблеми — це сигнал що компонент має занадто tight coupling. Refactor до service-based state або Input/Output pattern."
    commonMistakes:
      - "Використовують ViewChild в ngOnInit без static: true"
      - "Не розуміють що static: true не працює з @if/@for"
      - "Намагаються вирішити ExpressionChangedAfterItHasBeenChecked через setTimeout замість архітектурного рефакторингу"
    relatedQuestions: ["b2t5q2", "b2t5q3", "b2t5q5"]
  - level: "staff"
    question: "Які performance implications мають ViewChild queries з descendants: true? Як проєктувати component APIs щоб мінімізувати потребу в прямому DOM access?"
    referenceAnswers:
      junior: "descendants: true шукає глибше в DOM дереві, що може бути повільніше."
      mid: "ViewChild з descendants: true (або ViewChildren з {descendants: true}) обходить весь subtree в пошуку match — O(n) складність де n — кількість nodes в subtree. Без descendants — тільки direct children (shallow). Для зменшення потреби в DOM access: компоненти повинні приймати data через Inputs і комунікувати через Outputs замість того щоб parent маніпулював child безпосередньо."
      senior: "Performance деталі queries: Angular maintains TView.queries array — кожна query виконується проти TView nodes під час view creation і оновлення. descendants: true — deep traversal, дорожче. Для QueryList: Angular re-evaluates живі queries при structural changes в view — @for з великою кількістю items і ViewChildren query — потенційна bottleneck. Optimization: локалізувати queries — отримати ViewChild на wrapper component а не deep DOM element. Prefer type-based queries (ViewChild(ComponentClass)) над string-based ViewChild('refName') — компілятор може оптимізувати. Signal viewChildren() — той самий traversal але results є signal — notification batched, не fired per-change. API design: Input/Output pattern, Signal-based state sharing через services, EventEmitter — всі ці pattern зменшують потребу в прямому DOM access."
      staff: "Queries — це необхідний evil для певних patterns але повинні бути architectural last resort. Проблеми масштабування: 1) Large lists: ViewChildren на 1000+ items — memory overhead від QueryList і re-evaluation cost. 2) Deep descendants queries — O(depth * breadth) traversal. 3) Test complexity: компоненти з ViewChild складніше unit-testувати (потребують DOM). Framework evolution: Angular рухається до: a) Signal inputs/outputs — повна reactivity без lifecycle hooks. b) Signal queries — reactive DOM access. c) Functional approach — менше class-level state, менше ViewChild. API design principles: 1) Prefer Output over ViewChild for communication (parent calls child method → anti-pattern). 2) Prefer shared state (service/signal) over query-based coordination. 3) Use ViewChild for genuine DOM operations: focus(), scroll(), animation triggers — де немає alternative. 4) Element directives pattern: замість ViewChild(ElementRef) — directive на element що encapsulates DOM interaction. In design system: провідні libraries (Angular CDK) мінімізують ViewChild exposure — internal queries для behavior coordination, public API через Inputs/Outputs/Signals. Migration guide: QueryList-heavy components → signal queries → service/signal state — поступова архітектурна evolution."
    commonMistakes:
      - "Використовують ViewChild для calling methods на child (imperative) замість Input/Output reactive pattern"
      - "Не враховують cost queries при великих списках"
    relatedQuestions: ["b2t5q4", "b2t5q2"]
---

## Core Concept

**English definition:** ViewChild and ContentChild are Angular query mechanisms that provide direct programmatic access to child components, directives, or DOM elements within a component's view or projected content. Signal-based variants (viewChild, contentChild, viewChildren, contentChildren) introduced in Angular v17 provide reactive, composable alternatives.

**Пояснення:** ViewChild і ContentChild — це "телепорт" до дочірніх елементів. Якщо Inputs/Outputs — це формальний канал комунікації, то ViewChild — це прямий доступ до інстансу дочірнього компонента або DOM-елемента. ViewChild шукає в шаблоні самого компонента (view), ContentChild — серед контенту що проєктується через `ng-content` (projected content).

**Яку проблему вирішує:** В декларативному Angular템플릿 іноді потрібен imperative доступ — викликати метод на child компоненті, прочитати розміри DOM-елемента, програмно встановити focus. Inputs передають дані донизу, Outputs — події догори. ViewChild дає прямий доступ до instance коли ці механізми недостатні. ContentChild вирішує потребу в доступі до projected content — наприклад, parent component що хоче взаємодіяти зі своїм projected child directive.

**Як працює під капотом:**

Angular compiler трансформує `@ViewChild(Token)` в query definition що зберігається в `TView.queries`. Кожна query — це `TQuery` object з:
- `predicate`: type class або string (template ref variable name)
- `flags`: descendants depth, static/dynamic timing
- `isViewQuery`: true для ViewChild, false для ContentChild

При view creation runtime обходить `TNode` linked list і матчить кожен node проти query predicates. Matching results записуються в `LView` (instance data). Angular оновлює queries після structural changes (`@if`, `@for` зміни).

Signal queries (`viewChild()`, `contentChild()`) використовують той самий `TView.queries` механізм але результат wrapped у `WritableSignal`. Angular оновлює сигнал після view initialization — значення стає reactive частиною signal graph.

```typescript
// Compiler output (simplified conceptual — не буквальний код)
// @ViewChild(MyComponent) child!: MyComponent;
// Трансформується приблизно в:
// TView.queries.push({ predicate: MyComponent, flags: QueryFlags.isViewQuery, ... })
// Значення читається з LView[queryIndex]
```

**Trade-offs та обмеження:**

- ViewChild доступний тільки після `ngAfterViewInit` (крім `static: true`)
- ContentChild доступний після `ngAfterContentInit`
- Прямий доступ до child — tight coupling, ускладнює тестування і підтримку
- QueryList (від ViewChildren) потребує manual unsubscribe від `.changes`
- Signal queries вирішують timing і reactivity проблеми але вимагають Angular v17+

**Версійність:**

- `@ViewChild`, `@ContentChild` — Angular v2+, без суттєвих breaking changes
- `static` option — додано в Angular v8 (з введенням Ivy, де dynamic queries — default)
- `viewChild()`, `contentChild()` signal functions — Angular v17 (developer preview), стабільні в v17.1
- `viewChildren()`, `contentChildren()` — Angular v17 (developer preview), стабільні в v17.1
- Angular v19+: lint rules рекомендують signal queries для нових компонентів
- Deprecated: `@ViewChild({ read: ... })` підхід не deprecated але signal queries — preferred

## Deep Details

### Edge Cases

**static: true обмеження.** При `@ViewChild(Token, { static: true })` Angular resolve query synchronously під час view creation (перед lifecycle hooks) — значення доступне в `ngOnInit`. Але: якщо елемент захований `@if(false)` — query поверне `undefined` і залишиться `undefined` навіть коли `@if` стане `true`. `static: true` — тільки для елементів що завжди присутні в шаблоні.

**read option.** `@ViewChild(Token, { read: ElementRef })` дозволяє отримати різне уявлення того самого node — `ElementRef`, `TemplateRef`, або конкретну директиву на елементі. Корисно коли на елементі кілька директив і потрібна конкретна.

**Signal required queries.** `viewChild.required(Token)` — throws `RuntimeError` якщо query не знайдена при зверненні до signal value. Строгіша семантика ніж `viewChild(Token)` що повертає `undefined`. Prefer `required` коли element guaranteed present.

**ContentChild і nested ng-content.** ContentChild шукає тільки в безпосередньо projected content — не глибше. Якщо child component теж робить projection — `ContentChild` з `descendants: false` (default) не досягне глибоко nested content.

**QueryList identity.** QueryList object — один і той самий протягом lifecycle компонента, змінюється його вміст. Тому `@ViewChildren('items') items!: QueryList<ElementRef>` — `this.items` посилання стабільне, але `this.items.toArray()` змінюється. Якщо зберегти `toArray()` result — він stale після structural change.

### Junior vs Senior Understanding

**Junior** знає API: `@ViewChild(Component)` дає доступ до дочірнього компонента в `ngAfterViewInit`. `@ContentChild(Component)` — для projected content.

**Senior** розуміє compiler mechanics: queries compiled до `TView.queries` definitions, runtime matching під час view initialization, різницю між static і dynamic resolution, memory implications QueryList, і коли ViewChild є anti-pattern (замість Input/Output). Senior знає signal queries і може пояснити reactivity переваги.

**Staff** мислить архітектурно: ViewChild — це coupling mechanism що обмежує testability і reusability. Prefer signal-based state sharing через services, Input/Output, functional patterns. Розуміє compiler output для queries, performance implications descendants traversal, і migration strategy від legacy QueryList до signal queries.

### Deprecation & Migration Path

**Від @ViewChild до viewChild() (Angular v17+):**

```typescript
// До (decorator-based):
@ViewChild(MyComponent) child?: MyComponent;
ngAfterViewInit() {
  this.child?.doSomething();
}

// Після (signal-based):
child = viewChild(MyComponent); // Signal<MyComponent | undefined>
// Або якщо guaranteed present:
child = viewChild.required(MyComponent); // Signal<MyComponent>

// В effect або computed:
effect(() => {
  this.child()?.doSomething(); // автоматично reactive
});
```

**Від QueryList до viewChildren() (Angular v17+):**

```typescript
// До (QueryList + RxJS):
@ViewChildren(ItemComponent) items!: QueryList<ItemComponent>;
private destroy$ = new Subject<void>();

ngAfterViewInit() {
  this.items.changes
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => this.recalculate());
}

ngOnDestroy() { this.destroy$.next(); }

// Після (signal):
items = viewChildren(ItemComponent); // Signal<readonly ItemComponent[]>

constructor() {
  effect(() => {
    const currentItems = this.items(); // auto-tracked
    this.recalculate(currentItems);    // re-runs on change
  });
}
```

### Connections to Other Concepts

- **Lifecycle Hooks** (`02-lifecycle-hooks`): ViewChild timing безпосередньо tied до `ngAfterViewInit`/`ngAfterContentInit`
- **Content Projection** (`04-content-projection`): ContentChild отримує доступ до projected content
- **Signals** (Block 3): viewChild/viewChildren — частина Angular Signals ecosystem
- **Change Detection**: QueryList.changes тригерить CD, signal queries — reactive notifications

## Examples

### Basic Usage

```typescript
// ViewChild — доступ до дочірнього компонента
import { Component, viewChild, viewChildren, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-search-box',
  standalone: true,
  template: `<input #searchInput type="text" placeholder="Search...">`
})
export class SearchBoxComponent {
  focus() {
    // Метод що parent може викликати
    this.inputEl.nativeElement.focus();
  }
  private inputEl = viewChild.required<ElementRef>('searchInput');
}

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [SearchBoxComponent],
  template: `
    <app-search-box />
    <button (click)="focusSearch()">Focus Search</button>
  `
})
export class SearchPageComponent {
  // Signal query — required бо завжди є в template
  private searchBox = viewChild.required(SearchBoxComponent);

  focusSearch(): void {
    this.searchBox().focus(); // Signal — викликаємо як функцію
  }
}
```

### Signal Queries — Reactive Pattern

```typescript
// viewChildren — реактивна колекція з ефектом
import {
  Component, Directive, Input, viewChildren,
  computed, effect, signal
} from '@angular/core';

@Directive({
  selector: '[appTab]',
  standalone: true
})
export class TabDirective {
  label = input.required<string>();
  active = input<boolean>(false);
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [TabDirective],
  template: `
    <div class="tabs">
      @for (tab of tabs(); track tab.label()) {
        <button
          [class.active]="tab.active()"
          (click)="selectTab(tab)">
          {{ tab.label() }}
        </button>
      }
    </div>
  `
})
export class TabsComponent {
  // Signal query — reactive list
  tabs = viewChildren(TabDirective);

  // Computed поверх signal query
  activeTab = computed(() =>
    this.tabs().find(tab => tab.active()) ?? null
  );

  constructor() {
    // Effect реагує на зміни tabs list
    effect(() => {
      console.log(`Tab count changed: ${this.tabs().length}`);
    });
  }

  selectTab(selectedTab: TabDirective): void {
    // Реактивне оновлення стану
    // В реальному app — через service або output
  }
}
```

### ContentChild — Доступ до Projected Content

```typescript
// ContentChild для coordination з projected content
import {
  Component, Directive, contentChild, contentChildren,
  AfterContentInit, signal
} from '@angular/core';

@Directive({
  selector: '[appAccordionItem]',
  standalone: true
})
export class AccordionItemDirective {
  title = input.required<string>();
  expanded = signal(false);

  toggle() {
    this.expanded.update(v => !v);
  }
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  template: `
    <div class="accordion">
      @for (item of items(); track item.title()) {
        <div class="accordion-item">
          <button (click)="toggle(item)">
            {{ item.title() }}
            <span>{{ item.expanded() ? '▲' : '▼' }}</span>
          </button>
          @if (item.expanded()) {
            <div class="content">
              <ng-content />
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AccordionComponent {
  // ContentChild query — шукає в projected content
  items = contentChildren(AccordionItemDirective);

  toggle(item: AccordionItemDirective): void {
    // Collapse others, expand selected (single-select mode)
    this.items().forEach(i => {
      if (i !== item) i.expanded.set(false);
    });
    item.toggle();
  }
}

// Usage:
// <app-accordion>
//   <div appAccordionItem title="Section 1">Content 1</div>
//   <div appAccordionItem title="Section 2">Content 2</div>
// </app-accordion>
```

### Anti-Example

```typescript
// ПОГАНО: ViewChild для state sync замість Input/Output
@Component({
  selector: 'app-form',
  standalone: true,
  template: `
    <app-submit-button />
    <app-validation-summary />
  `
})
export class FormComponent {
  @ViewChild(SubmitButtonComponent) submitBtn!: SubmitButtonComponent;
  @ViewChild(ValidationSummaryComponent) summary!: ValidationSummaryComponent;

  onSubmit() {
    // Imperative manipulation — tight coupling!
    this.submitBtn.setLoading(true);
    this.summary.showErrors(this.errors);
    // Порушення encapsulation, ускладнює тестування,
    // ExpressionChangedAfterItHasBeenChecked ризик
  }
}

// ДОБРЕ: Signal-based state sharing
@Component({
  selector: 'app-form',
  standalone: true,
  template: `
    <app-submit-button [loading]="isLoading()" />
    <app-validation-summary [errors]="validationErrors()" />
  `
})
export class FormComponent {
  // Shared state через signals — declarative, testable
  isLoading = signal(false);
  validationErrors = signal<string[]>([]);

  async onSubmit() {
    this.isLoading.set(true);
    try {
      await this.formService.submit();
    } catch (err) {
      this.validationErrors.set(this.formService.getErrors());
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Calling child methods via ViewChild (`this.child.doSomething()`) | Tight coupling, порушення encapsulation, ускладнює unit testing дочірнього компонента | Передавати стан через Input signals, реагувати через Output/computed |
| ViewChild в ngOnInit без static: true | Значення undefined — не ініціалізовано до ngAfterViewInit | Використовувати ngAfterViewInit або signal viewChild() |
| QueryList.changes без unsubscribe | Memory leak — Observable не завершується автоматично | takeUntilDestroyed() або migrate to viewChildren() signal |
| ViewChild для DOM маніпуляції (стилі, класи) | Bypasses Angular's change detection і binding system | @HostBinding, [class], [style] bindings або Angular Renderer2 |
| @ViewChild без null check у strict mode | Runtime crash якщо елемент conditional | viewChild() з Optional або viewChild.required() з explicit semantics |

## Interview Block

### [L1 — Warm-up] Що таке ViewChild і ContentChild? В чому різниця між ними?

**Signal being tested:** Чи кандидат розрізняє view і projected content, і чи знає lifecycle timing для кожного.

**What the interviewer expects:** Чіткий опис різниці між "власним шаблоном" і "projected content". Mention ngAfterViewInit vs ngAfterContentInit timing.

**How to probe deeper:** "Що станеться якщо ти звернешся до ViewChild в ngOnInit?"

**Reference answer:** ViewChild дає доступ до елементів в власному template компонента — компонентів, директив, DOM-елементів. ContentChild — те саме для контенту що проєктується через ng-content від parent. Timing різний: ViewChild доступний після ngAfterViewInit, ContentChild — після ngAfterContentInit. До цих lifecycle hooks значення undefined.

**Common mistakes:**
- "ViewChild і ContentChild — це одне і те саме" — не розуміють різниці між view і projected content
- "Можна використовувати в ngOnInit" — забувають про timing

---

### [L2 — Mid] Яка різниця між signal-based queries і decorator queries? Коли що використовувати?

**Signal being tested:** Чи кандидат слідкує за сучасними Angular patterns і може пояснити why signal queries — це architectural improvement.

**What the interviewer expects:** Розуміння reactivity переваг (computed/effect composition), type safety (required vs optional), і migration path від QueryList.

**How to probe deeper:** "Як ти б мігрував компонент з @ViewChildren + QueryList.changes на signal queries?"

**Reference answer:** Decorator queries (@ViewChild) встановлюють значення асинхронно — потребують lifecycle hook. Signal queries повертають Signal<T> — reactive value що composable з computed() і effect(). viewChild.required() — throws якщо не знайдено (explicit semantics). viewChildren() — Signal<readonly T[]> замість QueryList — автоматично cleanup, без subscribe/unsubscribe. Обидва підходи можна mixing в одному компоненті під час migration. Signal queries — preferred для нових компонентів (Angular v17+).

**Common mistakes:**
- Думають що signal queries потребують explicit subscribe
- Не знають про viewChild.required() — завжди роблять null check

---

### [L3 — Senior] Поясніть timing проблеми ViewChild. Що таке `static: true`? Як signal queries змінюють timing model?

**Signal being tested:** Чи кандидат розуміє Angular view initialization pipeline, може діагностувати ExpressionChangedAfterItHasBeenChecked, і знає compiler-level details.

**What the interviewer expects:** Пояснення depth-first initialization, static vs dynamic resolution, і conceptual model signal query timing. Bonus: згадка ExpressionChangedAfterItHasBeenChecked і як signal queries уникають її.

**How to probe deeper:** "Коли ти отримуєш ExpressionChangedAfterItHasBeenChecked при роботі з ViewChild? Як це фіксувати без setTimeout?"

**Reference answer:** Angular ініціалізує view depth-first — всі children ініціалізовані до parent's ngAfterViewInit. static: true — Angular resolve query synchronously під час view creation, перед lifecycle hooks — значення доступне в ngOnInit. Але static: true не працює з @if/@for бо element може не існувати. static: false (default) — resolve після view init, тільки в ngAfterViewInit. ExpressionChangedAfterItHasBeenChecked: якщо ViewChild використовується для встановлення binding і його значення змінюється в ngAfterViewInit — Angular's dev mode assertion fails бо CD вже завершений. Signal queries вирішують: viewChild() value — reactive, Angular schedules update як частину signal graph після view init але синхронно перед template re-render.

**Common mistakes:**
- "static: true завжди краще" — не розуміють обмеження з structural directives
- Не знають ExpressionChangedAfterItHasBeenChecked причину і вирішують через setTimeout

---

### [L3 — Senior] Які performance implications у ViewChildren з `descendants: true` і великими списками?

**Signal being tested:** Чи кандидат розуміє query traversal cost і може приймати performance-aware architectural decisions.

**What the interviewer expects:** Розуміння O(n) traversal, QueryList re-evaluation при structural changes, і architectural alternatives що зменшують потребу в queries.

**How to probe deeper:** "У тебе список з 500 items і @ViewChildren query. Що відбувається при кожному додаванні нового item?"

**Reference answer:** ViewChildren query з descendants: true — deep traversal через весь subtree, O(n) де n — кількість TNodes. QueryList re-evaluated при кожній structural change (add/remove) — великі @for списки з ViewChildren можуть бути bottleneck. Без descendants flag — тільки direct children (shallow, дешевше). Signal viewChildren() — той самий traversal але result wrapped у signal, notifications batched через signal graph. Архітектурна альтернатива: замість parent-queries-children pattern — child реєструє себе в parent через Inject, або shared service. Для performance-critical lists: virtual scrolling (CDK) зменшує кількість DOM nodes і тим самим query scope.

**Common mistakes:**
- Не знають різниці між з і без descendants flag
- Думають що signal queries швидші по traversal (ні — той самий механізм)

---

### [L4 — Staff/Principal] Як архітектурно мінімізувати потребу у ViewChild в великому Angular додатку? Яка migration стратегія від legacy QueryList-heavy codebase?

**Signal being tested:** Чи кандидат мислить на рівні system design — patterns що скорочують coupling, migration стратегії для team, architectural evolution.

**What the interviewer expects:** Concrete architectural alternatives (signal state, service injection, Input/Output), graduated migration plan, розуміння trade-offs (component library context vs application context), і knowledge Angular roadmap.

**How to probe deeper:** "У вас design system з 50+ компонентами що використовують QueryList. Як плануєш migration і як переконуєш team це пріоритизувати?"

**Reference answer:** ViewChild — це architectural smell коли використовується для state sync замість Input/Output. Стратегія мінімізації: 1) State sharing через Signals і services — замість `this.child.setLoading(true)` — `isLoading.set(true)` і child реагує через Input. 2) Directive self-registration — child директива inject(ParentComponent) і реєструє себе — parent не потребує query. 3) Composition через Inputs/Outputs — всі interactions explicit і testable. Migration legacy codebase: 1) Audit: які ViewChild — legitimate DOM ops (focus, scroll) vs state sync (anti-pattern). 2) State sync refactor: extract shared state до signals/service, перейти на Input/Output. 3) Legitimate DOM ops: залишити ViewChild але migrate @ViewChild → viewChild() signal. 4) QueryList.changes: migrate to viewChildren() + effect() — safety provided by takeUntilDestroyed(). Team strategy: Angular eslint rules для заборони нових @ViewChild в application code (дозволити тільки в library components де legitimate). Prioritization: migration окупається через: краща testability (менше TestBed DOM setup), менше memory leaks, better performance profiling через Angular DevTools signal graph.

**Common mistakes:**
- "ViewChild — це нормально, просто треба знати timing" — не бачать architectural implications
- Пропонують повну migration одразу замість graduated approach

## Summary

### Key Points

- ViewChild шукає в власному template (view), ContentChild — в projected content через ng-content; timing відповідно ngAfterViewInit і ngAfterContentInit
- `static: true` дозволяє ViewChild в ngOnInit але тільки для елементів що не є в @if/@for
- Signal queries (`viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()`) — Angular v17+, reactive альтернативи що composable з computed/effect
- `viewChild.required()` — throws якщо не знайдено, explicit semantics замість undefined
- QueryList від @ViewChildren потребує manual unsubscribe від `.changes`; viewChildren() signal — автоматично cleanup
- ViewChild як pattern для calling child methods — architectural smell; prefer Input/Output/Signal state
- ExpressionChangedAfterItHasBeenChecked при ViewChild-based binding mutation в ngAfterViewInit — вирішується signal queries або ChangeDetectorRef.detectChanges()

### Elevator Pitch (2 minutes)

ViewChild і ContentChild — механізми прямого imperative доступу до дочірніх компонентів і DOM. ViewChild шукає в власному template — доступний після ngAfterViewInit. ContentChild — у projected content від ng-content — після ngAfterContentInit. Декоратор @ViewChild встановлює властивість асинхронно що створює timing проблеми і потребує lifecycle hooks.

Angular v17 ввів signal-based queries: `viewChild(Token)` повертає `Signal<T | undefined>`, `viewChild.required(Token)` — `Signal<T>` з runtime error якщо не знайдено. Ці queries reactive — composable з computed() і effect(), без lifecycle hooks, з auto-cleanup. ViewChildren повертає QueryList (legacy) або viewChildren() дає Signal<readonly T[]>.

Архітектурно: ViewChild — це legitimate tool для DOM operations (focus, scroll, animation) і component library coordination patterns. Але використання ViewChild для state sync — anti-pattern що порушує encapsulation. Prefer: Input/Output для explicit API, signals/services для state sharing, ViewChild тільки коли немає declarative alternative.
