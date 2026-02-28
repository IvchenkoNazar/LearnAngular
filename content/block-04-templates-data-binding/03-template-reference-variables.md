---
title: "Template Reference Variables"
block: 4
topic: 3
slug: "template-reference-variables"
difficulty: 2
sinceVersion: "2"
tags: ["template-reference", "viewchild", "ElementRef", "NgForm", "template-variable", "signal-queries"]
relatedTopics: ["binding-types", "event-binding", "viewchild-contentchild", "dynamic-templates"]
interviewQuestions:
  - id: "b4t3q1"
    level: "junior"
    question: "Що таке template reference variable і як її оголосити в Angular template?"
    referenceAnswers:
      junior: "Template reference variable оголошується через `#name` в template. Вона дає доступ до DOM елемента або директиви. Наприклад, `<input #myInput>` — і потім можна використовувати `myInput.value`."
      mid: "Template reference variable `#varName` — це іменована посилання на DOM елемент, Angular директиву або компонент в template. Значення залежить від елементу: на нативному DOM елементі — HTMLElement, на компоненті — instance компоненту, на директиві — instance директиви. Можна використовувати в тому ж template або передати в ViewChild."
      senior: "Template reference variable має два scope: в template (використовується в будь-якому місці template того ж view, але не в child embedded views окремо) і через @ViewChild/@viewChild в компоненті. При `#var` без значення — тип залежить від елементу: HTMLElement для native, directive/component instance. `#var='directiveName'` — явно вказуємо exportAs directive, отримуємо конкретний instance. NgForm: `#form='ngForm'` — отримуємо NgForm instance, не HTMLElement. ViewChild lifecycle: template var доступна тільки після ngAfterViewInit, не в ngOnInit."
      staff: "Template reference variables — це compile-time mechanism. Angular compiler визначає тип variable при парсингу template — якщо є exportAs directive, компілятор вибирає той instance. Тип інформація важлива для Angular Language Service і type-checking в templates (strictTemplates). В Ivy: template vars зберігаються в LView як references на конкретні nodes/directives. @ViewChild signal-based query (Angular 17.2+): `myInput = viewChild<ElementRef>('myInput')` — reactive reference що стає доступна після view initialization. При structural directives `*ngIf`/`@if`: template var в conditional block — не доступна поза block. Це розповсюджений gotcha: `#form` всередині @if не доступна в parent template."
    commonMistakes:
      - "Пробують використовувати ViewChild reference в ngOnInit — вона undefined до AfterViewInit"
      - "Оголошують #var в *ngIf/#if block і намагаються використати поза блоком"
    relatedQuestions: ["b4t3q2", "b4t3q3"]
  - id: "b4t3q2"
    level: "mid"
    question: "Яка різниця між #var на native елементі, компоненті і директиві з exportAs?"
    referenceAnswers:
      junior: "#var дає доступ до елементу. Якщо на компоненті — до компоненту."
      mid: "На native HTML елементі `<input #myInput>` — myInput є HTMLInputElement. На Angular компоненті `<app-child #child>` — child є instance AppChildComponent з доступом до його public API. Для директив: `#form='ngForm'` — явно запитуємо NgForm directive через її exportAs name. Без `='ngForm'` на form елементі отримаємо HTMLFormElement, не NgForm."
      senior: "Різниця визначається resolve механізмом: 1) Native element без директив → HTMLElement. 2) Component → component instance (не host element). 3) Directive з exportAs і `#var='exportAsName'` → directive instance. 4) `#var=''` порожній рядок → той самий як без значення (element/component). exportAs — ключове: одна директива може мати кілька exported names, і можна мати кілька `#vars` на одному елементі де кожна посилається на різну директиву. Наприклад: `<input #ctrl='ngModel' #el>` — ctrl є NgModel instance, el є HTMLInputElement."
      staff: "exportAs mechanism — це formal public API для directives/components. Вибір того що exposing через exportAs — architectural decision: що consumers мають доступ до без @ViewChild injection. Для Design System: виставляти мінімальний public API через exportAs, решта — internal. Angular compiler при strictTemplates mode type-checks member access через template vars. Якщо exportAs directive має TypeScript type — Language Service надає autocomplete. Для testing: template refs через `fixture.debugElement.query()` — дозволяють перевіряти directive state без компонентного API. Signal-based queries: `viewChild('varName')` — type inference автоматично визначає тип на основі exportAs context."
    commonMistakes:
      - "Не знають що без `='ngForm'` отримають HTMLFormElement, не NgForm"
      - "Думають що template var на компоненті дає доступ до host DOM element — насправді це component instance"
    relatedQuestions: ["b4t3q1", "b4t3q3"]
  - id: "b4t3q3"
    level: "senior"
    question: "Як template reference variables взаємодіють з @ViewChild і новими signal-based queries viewChild()?"
    referenceAnswers:
      junior: "@ViewChild дозволяє отримати template variable в компоненті. Потрібно чекати ngAfterViewInit."
      mid: "@ViewChild('varName') — decorator що шукає template var за іменем і присвоює property. Доступна в ngAfterViewInit. `{ static: true }` — resolve на compile time (доступна в ngOnInit) але тільки якщо не в структурній директиві. signal-based viewChild() (Angular 17.2+): `ref = viewChild<ElementRef>('myVar')` — повертає Signal<ElementRef | undefined> що автоматично оновлюється."
      senior: "@ViewChild lifecycle: `{ static: false }` (default) — resolve після first CD, доступна в ngAfterViewInit. `{ static: true }` — resolve до CD, доступна в ngOnInit, але тільки для static templates (не під *ngIf). Signal viewChild(): реактивний, завжди актуальний, немає lifecycle проблем — якщо element не існує — signal value undefined. viewChild.required() — throws якщо element не знайдено. Перевага signals: `effect(() => { const el = this.myInput(); if (el) el.nativeElement.focus(); })` — автоматично re-runs при availability changes, не потребує ngAfterViewInit. viewChildren() — для multiple elements: `items = viewChildren('itemRef')`."
      staff: "Signal-based queries — це fundamental improvement над decorator-based @ViewChild. Проблема @ViewChild: мутабельна property що змінюється в runtime, порушує predictability. ViewChild з static:true vs static:false — постійне джерело confusion. Signal viewChild() — immutable signal reference що reflects current DOM state. Compiler генерує efficient query code — без runtime reflection. Для testing: компоненти з signal queries легше тестувати — можна перевірити signal value напряму без lifecycle hooks. Архітектурно: viewChild() + effect() = declarative DOM interaction pattern. Для Design System: expose signal queries як readonly — `readonly labelRef = viewChild('label')` — consumer може reactive читати але не мутувати. Migration path: `ng generate @angular/core:signal-queries-migration` для автоматичного перетворення @ViewChild/@ViewChildren на signal queries."
    commonMistakes:
      - "Використовують static:true для @ViewChild під *ngIf — reference буде undefined бо element ще не в DOM"
      - "Не розуміють що signal viewChild() може бути undefined якщо element відсутній (умовний рендеринг)"
    relatedQuestions: ["b4t3q2", "b4t3q4"]
  - id: "b4t3q4"
    level: "senior"
    question: "Чому прямий доступ до DOM через template reference variable (ElementRef) вважається anti-pattern і коли це прийнятно?"
    referenceAnswers:
      junior: "Прямий DOM manipulation ламає Angular CD. Краще використовувати binding."
      mid: "ElementRef дає прямий доступ до нативного DOM — але Angular не знає про ці зміни, CD не спрацює. Це проблема для SSR (немає DOM) і Web Workers (немає DOM). Краще: Renderer2 для DOM manipulation через Angular abstraction, або declarative bindings."
      senior: "Проблеми прямого DOM access через ElementRef: 1) SSR несумісність — platform-server не має real DOM, nativeElement буде mock. 2) Web Worker incompatibility — DOM недоступний в worker context. 3) Security: xss через innerHTML. 4) Тестування — потребує DOM-capable environment (jsdom). 5) Angular CD bypass — зміни не tracked. Renderer2 — правильна абстракція: `renderer.setStyle`, `renderer.addClass`, `renderer.setProperty`. Але: для read operations (getBoundingClientRect, focus, scroll position) — ElementRef через afterRender/afterNextRender є єдиним варіантом. Правило: write через Renderer2, read через ElementRef тільки при необхідності."
      staff: "Прямий DOM access — це leaking abstraction що порушує Angular rendering pipeline. Architectural stance: уникати ElementRef в компонентах взагалі, якщо можливо через declarative binding. Але реальний world вимагає: focus management (accessibility), third-party library integration (charts, maps), animation measurements. Правильний pattern: afterRender()/afterNextRender() для DOM read після render cycle — безпечно і predictable. Renderer2 dependency injection — платформо-незалежне write API. Для third-party integration: виносити в окремий service або directive що encapsulates DOM interaction. ContentChild з ElementRef — ще більш dangerous: доступ до child DOM без knowledge of child's internals. Design System perspective: якщо публічний компонент потребує ElementRef в consumer template — це design flaw, треба expose signal або output для потрібного value."
    commonMistakes:
      - "Маніпулюють DOM в ngOnInit через ViewChild — ще недоступний, і SSR несумісно"
      - "Не знають про afterRender/afterNextRender для post-render DOM reads"
    relatedQuestions: ["b4t3q3", "b4t3q5"]
  - id: "b4t3q5"
    level: "staff"
    question: "Як template reference variables і ViewChild використовуються для composable component patterns в Design System?"
    referenceAnswers:
      junior: "ViewChild дозволяє батьківському компоненту викликати методи дочірнього."
      mid: "Через ViewChild можна отримати child component instance і викликати public методи або читати стан. Це корисно коли треба координувати між компонентами без @Input/@Output."
      senior: "Composable patterns через template refs: 1) Accordion/Tabs parent читає children через @ContentChildren. 2) Form validation: parent form доступ до NgModel через exportAs. 3) Focus management: parent координує focus між sibling components через ViewChild. 4) Animation coordination: parent тригерить анімації children через ViewChild methods. Але: надмірне використання ViewChild creates tight coupling. Кращий підхід: signals/services для state sharing, ViewChild тільки для DOM-specific operations."
      staff: "Template refs в composable Design System patterns потребують careful API design. Compound components pattern: Tabs містить TabList + TabPanel — координація через shared service injection або signal store в parent. exportAs дозволяє consumers отримати component API через template без @ViewChild — `#tabs='appTabs'` дає доступ до AppTabsComponent public API. Signal-based approach: TabsComponent exposes `readonly selectedIndex = signal(0)` — consumers підписуються реактивно. Для accessibility: роль focus management через viewChild — focus trap, roving tabindex — потребує DOM access після render. ContentChildren для dynamic child composition: `@ContentChildren(TabComponent) tabs!: QueryList<TabComponent>` або signal `contentChildren(TabComponent)`. Migration strategy: поступово замінювати imperative ViewChild patterns на declarative signal composition — measurably reduces coupling і покращує testability. Publicly exported signals замість methods — consumers reactive, не imperative."
    commonMistakes:
      - "Використовують ViewChild для state sharing між компонентами — краще services/signals"
      - "Не розмежовують коли exportAs публічний API а коли ViewChild внутрішній — обидва мають різні semantics"
    relatedQuestions: ["b4t3q4", "b4t3q3"]
---

## Core Concept

**English definition:** A template reference variable is a named reference declared with `#varName` in an Angular template that provides direct access to a DOM element, Angular component instance, or directive instance within the same template or via `@ViewChild`/`viewChild()` queries.

**Пояснення:** Template reference variable `#varName` оголошується в шаблоні і дає іменований доступ до елементу або директиви. Значення залежить від контексту: на native HTML — HTMLElement, на компоненті — component instance, на директиві з `exportAs` і `#var='directiveName'` — directive instance. Змінна доступна в тому ж template для event bindings, property bindings і методів.

**Яку проблему вирішує:** Декларативний доступ до елементів і компонентів без programmatic DOM traversal або складного service-based комунікаційного шару. Дозволяє передавати element references між template expressions, координувати форми через NgForm, і надавати батьківським компонентам доступ до child component API.

**Як працює під капотом:** Angular compiler парсить `#varName` і `#varName='exportAsToken'` в template AST. В Ivy: при view creation `ɵɵreference(index)` instruction зберігає reference в LView. При template var без значення — Angular resolver обирає: є directive з matching exportAs token → directive instance, інакше element/component. `@ViewChild('varName')` → compiler генерує query що reads LView slot після view initialization. signal `viewChild('varName')` → reactive signal wrapped навколо LView reference.

**Trade-offs та обмеження:** Template vars не доступні між sibling embedded views (structural directives). Доступ в ngOnInit потребує `static: true` але це несумісно з conditional rendering. Прямий DOM access через ElementRef — несумісний з SSR і Web Workers. Template var scope — поточний template і його child components, але не сibling або parent templates.

**Версійність:** Template reference variables стабільні з Angular 2. Angular 8: `@ViewChild` отримав `static` option для lifecycle control. Angular 14: `ng-template` query по template ref variable. Angular 17.2: signal-based `viewChild()` і `viewChildren()` як stable API. Migration: `ng generate @angular/core:signal-queries-migration` для автоматичного переходу від decorator-based до signal queries.

---

## Deep Details

### Edge Cases

**Scope і structural directives:** Template var оголошена всередині `@if`, `*ngIf`, `@for` блоку — недоступна поза ним. `<div *ngIf="show" #container>` — контейнер доступний тільки якщо show=true і тільки всередині ngIf embedded view.

**Множинні template vars на одному елементі:** Можна мати кілька `#` на одному елементі що вказують на різні речі: `<input #el #ctrl="ngModel">` — el є HTMLInputElement, ctrl є NgModel instance.

**NgForm і template vars:** `<form #myForm="ngForm">` — myForm є NgForm instance. Без `='ngForm'` — myForm буде HTMLFormElement. NgForm exports under 'ngForm' token через `exportAs: 'ngForm'`.

**ViewChild static option:** `{ static: true }` — resolve before first CD run (доступно в ngOnInit), але element МУСИТЬ бути в DOM завжди (не під structural directive). `{ static: false }` — resolve after first CD, доступно в ngAfterViewInit. Default: false.

**Signal viewChild undefined behavior:** `viewChild<ElementRef>('myEl')` повертає `Signal<ElementRef | undefined>`. Якщо element відсутній (conditional rendering) — signal value undefined. `viewChild.required<ElementRef>('myEl')` — throws RuntimeError якщо element не знайдений після view init.

### Junior vs Senior Understanding

**Junior** знає синтаксис `#varName`, вміє передавати в event handlers і property bindings, знає що @ViewChild доступний після ngAfterViewInit.

**Senior** розуміє:

1. **Resolve mechanism:** exportAs token → directive, інакше element/component. Compiler-time resolution → TypeScript type safety в strictTemplates mode.

2. **LView storage:** Template vars зберігаються в LView slots поряд з binding values. Reference є snapshot DOM state на момент view creation — якщо DOM перебудовується (ngIf toggle), reference може stale.

3. **Signal queries vs decorator queries:** viewChild() Signal — реактивний, завжди актуальний, не потребує lifecycle hook awareness. @ViewChild — imperative, static option confusion, потенційні undefined доступи.

4. **SSR і ElementRef:** nativeElement в SSR — server-side element mock. DOM manipulation через nativeElement в SSR — no-op або error. Renderer2 — platform-safe write, afterRender/afterNextRender — safe read timing.

5. **Structural scope isolation:** Template var в @if block — не витікає назовні. Це feature, не bug — prevents accidental stale reference access.

### Deprecation & Migration Path

- **@ViewChild / @ViewChildren decorators:** Функціонально стабільні, не deprecated. Signal-based `viewChild()` / `viewChildren()` — новий preferred підхід в Angular 17.2+. Automated migration: `ng generate @angular/core:signal-queries-migration`.
- **QueryList (від @ViewChildren):** Повертає mutable list — не signal-based. Потрібно `queryList.changes` Observable для реактивності. signal `viewChildren()` — краща альтернатива, повертає `Signal<readonly T[]>`.
- **static: true option:** Залишається, але з signal queries стає непотрібним — signal завжди актуальний.

### Connections to Other Concepts

- **ViewChild / ContentChild:** Template vars — primary selector mechanism для ViewChild queries. Альтернатива: query by component/directive class type.
- **NgForm / ngModel:** Template vars є key pattern для template-driven forms — `#form='ngForm'` і `#ctrl='ngModel'` дають доступ до form state.
- **Signals:** signal viewChild() — bridge між template vars і reactive signal graph. `effect(() => { ... this.myInput() ... })` реагує на element availability changes.
- **Content Projection:** ContentChild/contentChild використовують аналогічний механізм але для projected content, не view children.

---

## Examples

### Basic Usage

```typescript
@Component({
  selector: 'app-template-ref-demo',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Template var on native element — HTMLInputElement -->
    <input #searchInput type="text" placeholder="Search...">
    <button (click)="focusSearch(searchInput)">Focus Search</button>
    <button (click)="clearSearch(searchInput)">Clear</button>

    <!-- Template var on component — AppChildComponent instance -->
    <app-child #childComp></app-child>
    <button (click)="childComp.doSomething()">Call child method</button>

    <!-- Template var on directive with exportAs -->
    <form #myForm="ngForm" (ngSubmit)="onSubmit(myForm)">
      <input name="email" ngModel required email #emailCtrl="ngModel">
      @if (emailCtrl.invalid && emailCtrl.touched) {
        <span class="error">Valid email required</span>
      }
      <button type="submit" [disabled]="myForm.invalid">Submit</button>
    </form>

    <!-- Multiple vars on same element -->
    <input #inputEl #inputModel="ngModel"
           name="username" ngModel>
    <p>Element type: {{ inputEl.tagName }}</p>
    <p>Model valid: {{ inputModel.valid }}</p>
  `
})
export class TemplateRefDemoComponent {
  focusSearch(input: HTMLInputElement): void {
    input.focus();
  }

  clearSearch(input: HTMLInputElement): void {
    input.value = '';
    input.focus();
  }

  onSubmit(form: NgForm): void {
    if (form.valid) {
      console.log('Form data:', form.value);
    }
  }
}
```

### Production Scenario

```typescript
// Signal-based queries — modern Angular 17.2+ approach
@Component({
  selector: 'app-autofocus-input',
  standalone: true,
  template: `
    <div class="input-wrapper">
      <label [for]="inputId">{{ label() }}</label>
      <input
        #inputEl
        [id]="inputId"
        [type]="type()"
        [placeholder]="placeholder()"
      >
      @if (showClear() && hasValue()) {
        <button
          #clearBtn
          type="button"
          (click)="clear()"
          aria-label="Clear input"
        >×</button>
      }
    </div>
  `
})
export class AutofocusInputComponent implements OnInit {
  label = input.required<string>();
  type = input('text');
  placeholder = input('');
  showClear = input(true);
  autofocus = input(false);

  valueChange = output<string>();

  // Signal-based ViewChild queries
  inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  clearBtn = viewChild<ElementRef<HTMLButtonElement>>('clearBtn');

  protected readonly inputId = `input-${Math.random().toString(36).slice(2)}`;
  private _value = signal('');
  hasValue = computed(() => this._value().length > 0);

  constructor() {
    // Reactive effect when element becomes available
    effect(() => {
      const el = this.inputEl();
      if (el && this.autofocus()) {
        // Use afterNextRender for DOM-safe access
        afterNextRender(() => el.nativeElement.focus());
      }
    });
  }

  ngOnInit(): void {
    // Note: viewChild signal is undefined here — element not yet rendered
    // Use effect() or afterViewInit instead
  }

  clear(): void {
    const el = this.inputEl();
    el.nativeElement.value = '';
    this._value.set('');
    this.valueChange.emit('');
    el.nativeElement.focus();
  }
}
```

### Anti-Example

```typescript
// WRONG: Common template reference variable mistakes
@Component({
  template: `
    <!-- Template var inside @if — undefined outside block -->
    @if (showForm) {
      <form #myForm="ngForm">...</form>
    }
    <!-- WRONG: myForm is undefined here when showForm=false -->
    <button [disabled]="!myForm?.valid">Submit</button>
  `
})
export class BadTemplateRefComponent implements OnInit, AfterViewInit {
  @ViewChild('myInput') myInput!: ElementRef;

  showForm = false;

  ngOnInit(): void {
    // WRONG: ViewChild not yet available in ngOnInit
    this.myInput.nativeElement.focus(); // Error: cannot read property of undefined
  }

  ngAfterViewInit(): void {
    // WRONG: Direct DOM manipulation — breaks SSR, bypasses Angular
    this.myInput.nativeElement.style.color = 'red'; // Should use Renderer2
    document.getElementById('someId')!.focus(); // Should use ViewChild + Renderer2
  }
}

// CORRECT:
@Component({
  template: `
    <!-- Move form outside @if or handle undefined case -->
    <form #myForm="ngForm" [class.hidden]="!showForm">...</form>
    <button [disabled]="!myForm.valid">Submit</button>
  `
})
export class GoodTemplateRefComponent implements AfterViewInit {
  // Signal-based query — reactive, no lifecycle confusion
  myInput = viewChild<ElementRef<HTMLInputElement>>('myInput');

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    const el = this.myInput();
    if (el) {
      // Correct: use Renderer2 for DOM writes
      this.renderer.setStyle(el.nativeElement, 'color', 'red');
      // Correct: call focus after render cycle
      afterNextRender(() => el.nativeElement.focus());
    }
  }
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `@ViewChild` used in `ngOnInit` | Element not yet rendered — undefined reference error | Use `ngAfterViewInit` або signal `viewChild()` with `effect()` |
| Template var inside `@if`/`*ngIf` referenced outside | Undefined when condition is false — runtime error | Move element outside conditional або handle undefined case |
| Direct DOM manipulation via `nativeElement` | Breaks SSR, Web Workers, bypasses Angular rendering pipeline | `Renderer2` for writes, `afterRender()` for reads |
| `@ViewChild({ static: true })` for conditional elements | Always undefined since element not in DOM before first CD | Remove `static: true` або restructure template |
| Calling child component methods via ViewChild for state changes | Tight coupling, hard to test, breaks encapsulation | Use @Input/output() або shared Signal service for state |

---

## Interview Block

### [L1 — Warm-up] Що таке template reference variable і як її оголосити в Angular template?
**Signal being tested:** Знання синтаксису і розуміння для чого потрібні template refs — не просто механічне використання.
**What the interviewer expects:** `#varName` синтаксис, розуміння що тип залежить від елементу, знання що доступна в тому ж template.
**How to probe deeper:** "Як отримати template variable в TypeScript class (не в template)? Коли вона стає доступною?"
**Reference answer:** `#varName` оголошується на елементі в template. На native HTML — HTMLElement instance. На компоненті — component instance. На директиві з `#var='exportAsName'` — directive instance. Доступна в будь-якому місці того ж template. В TypeScript class через @ViewChild або signal viewChild() — після ngAfterViewInit.
**Common mistakes:** Плутають scope — думають що var доступна в TypeScript class напряму без @ViewChild; пробують використовувати в ngOnInit.

### [L2 — Mid] Яка різниця між #var на native елементі, компоненті і директиві з exportAs?
**Signal being tested:** Розуміння Angular resolver mechanism для template vars і як exportAs дозволяє директивам expose свій API.
**What the interviewer expects:** Чітке пояснення трьох випадків, приклад з NgForm де exportAs критичний, розуміння множинних vars на одному елементі.
**How to probe deeper:** "Чому `<form #f>` дає HTMLFormElement а `<form #f='ngForm'>` дає NgForm instance?"
**Reference answer:** Resolver mechanism: 1) Якщо є `='exportAsToken'` — Angular шукає directive з таким exportAs і повертає її instance. 2) Без значення — native element або component instance. На одному елементі можна: `<input #el #ctrl='ngModel'>` — el є HTMLInputElement, ctrl є NgModel. Це дозволяє отримати і DOM reference і directive state одночасно.
**Common mistakes:** Не знають про exportAs mechanism; думають що #f на form завжди NgForm; не знають про множинні vars на одному елементі.

### [L3 — Senior] Як template reference variables взаємодіють з @ViewChild і новими signal-based queries viewChild()?
**Signal being tested:** Розуміння lifecycle implications @ViewChild і ability to reason about when references are available, знання signal queries.
**What the interviewer expects:** Різниця static/non-static, lifecycle availability (ngOnInit vs ngAfterViewInit), як signal viewChild() вирішує ці проблеми, required() variant.
**How to probe deeper:** "Коли використовувати viewChild.required() і що відбувається якщо element не знайдено?"
**Reference answer:** @ViewChild static:false (default) — доступна в ngAfterViewInit. static:true — в ngOnInit але тільки для static elements (не під structural directives). Signal viewChild() — реактивний signal, undefined якщо element відсутній, автоматично оновлюється при DOM changes. viewChild.required() — throws при відсутності, гарантує non-null. Effect + viewChild: реагувати на element availability без lifecycle hook overhead.
**Common mistakes:** static:true для елементів під *ngIf; використання @ViewChild в ngOnInit без static:true.

### [L4 — Staff/Principal] Як template reference variables і ViewChild використовуються для composable component patterns в Design System?
**Signal being tested:** Архітектурне мислення про coupling, encapsulation і public API design для reusable components.
**What the interviewer expects:** exportAs як formal public API contract, signal queries для reactive composition, compound component patterns, accessibility considerations для focus management.
**How to probe deeper:** "Як би ви вирішили communication між Tabs і TabPanel компонентами без prop drilling?"
**Reference answer:** exportAs — formal public API: `#tabs='appTabs'` gives template-level access без ViewChild injection. Signal outputs/inputs — declarative composition. Compound components через ContentChildren + shared service або signal store in parent. Focus management через viewChild + afterRender — safe DOM access. Design principle: ViewChild для DOM-specific operations тільки, state sharing через signals/services.
**Common mistakes:** ViewChild для state sharing замість signals/services; не відокремлюють DOM concerns від state concerns.

---

## Summary

### Key Points
- `#varName` дає named reference на DOM element, component instance або directive (через `exportAs`)
- Тип variable залежить від resolve mechanism: `='exportAsToken'` → directive, інакше element/component
- Template vars scope обмежений поточним view — недоступні поза `@if`/`*ngIf` blocks
- @ViewChild: static:false доступна в ngAfterViewInit, static:true в ngOnInit (не під structural directives)
- Signal `viewChild()` (Angular 17.2+) — реактивний, завжди актуальний, без lifecycle confusion
- Прямий DOM manipulation через ElementRef — anti-pattern для writes; Renderer2 — platform-safe alternative
- exportAs — механізм формального public API для директив і компонентів

### Elevator Pitch (2 minutes)
Template reference variables `#varName` — це іменовані посилання на елементи в Angular template. Без значення: native HTML → HTMLElement, компонент → component instance. З `='exportAs'` — directive instance (наприклад `#form='ngForm'`). Доступні в тому ж template для event/property bindings. В TypeScript class: @ViewChild('varName') — доступна після ngAfterViewInit, або signal `viewChild('varName')` (Angular 17.2+) — реактивна, без lifecycle confusion. Типові gotchas: template var всередині @if недоступна поза блоком; @ViewChild в ngOnInit — undefined без static:true; static:true несумісний з conditional elements. Для DOM writes: Renderer2, не nativeElement напряму — для SSR сумісності. Signal viewChild.required() — throws якщо element відсутній. Автоматична міграція: `ng generate @angular/core:signal-queries-migration`.
