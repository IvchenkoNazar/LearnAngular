---
title: "Dynamic Templates: ng-template, ng-container, ViewContainerRef"
block: 4
topic: 4
slug: "dynamic-templates"
difficulty: 3
sinceVersion: "2"
tags: ["ng-template", "ng-container", "ViewContainerRef", "TemplateRef", "dynamic-components", "portal"]
relatedTopics: ["control-flow", "template-reference-variables", "structural-directives", "viewchild-contentchild", "content-projection"]
interviewQuestions:
  - id: "b4t4q1"
    level: "junior"
    question: "Що таке ng-template і ng-container і для чого вони використовуються?"
    referenceAnswers:
      junior: "ng-template — це шаблон що не рендериться одразу, Angular може його рендерити пізніше. ng-container — це логічний контейнер що не створює DOM елемент. Обидва корисні для структурних директив."
      mid: "ng-template — оголошує reusable template fragment (TemplateRef) що не рендериться в DOM поки не використано явно або structural directive. ng-container — phantom wrapper без DOM output, корисний коли потрібно застосувати directive без зайвого DOM елементу. Різниця: ng-template — content definition, ng-container — content grouping without DOM pollution."
      senior: "ng-template компілюється в TemplateRef — об'єкт що encapsulates embedded view factory. При рендерингу Angular викликає viewContainerRef.createEmbeddedView(templateRef, context) що створює EmbeddedViewRef в ViewContainerRef. ng-container компілюється в comment node (`<!-- -->`) в DOM — zero overhead. Structural directive sugar `*ngIf='expr'` desugars в `[ngIf]='expr'` на `<ng-template>`. @if нова syntax — native control flow без directive overhead, але концептуально аналогічна. TemplateRef + context — дозволяє parameterize templates: `$implicit` і named context properties."
      staff: "ng-template в Ivy компілюється в окремий template function поряд з host component. Кожна `<ng-template>` — окремий `ɵɵtemplate()` instruction в component factory. Embedded view creation — `createEmbeddedView()` — алоцирує новий LView linked до host view. Performance implications: lazy template instantiation — тільки при explicit create. Memory: кожен EmbeddedViewRef — окремий LView allocation. ViewContainerRef як anchor — embedded views вставляються як siblings до anchor comment node в DOM. Для Dynamic Component Loading: `createComponent()` через ViewContainerRef — allocates injector hierarchy rooted at host injector. В SSR context: ViewContainerRef operations — synchronous, work correctly на server side."
    commonMistakes:
      - "Плутають ng-template і ng-container — template не рендерить DOM, container рендерить content але без wrapper element"
      - "Думають що ng-template з `#ref` автоматично рендериться — потрібен explicit render через ViewContainerRef або ngTemplateOutlet"
    relatedQuestions: ["b4t4q2", "b4t4q3"]
  - id: "b4t4q2"
    level: "mid"
    question: "Як передати context у ng-template і як отримати $implicit значення?"
    referenceAnswers:
      junior: "Через ngTemplateOutlet з context: `[ngTemplateOutletContext]='{ $implicit: myValue }'`. В template використовують `let-varName` для отримання значення."
      mid: "Template context передається через `ngTemplateOutletContext` object. `$implicit` — спеціальне поле що відповідає `let-varName` без `='prop'`. Named properties: `{ name: 'John', age: 30 }` — в template `let-n='name' let-a='age'`. Структурна директива context: `*ngFor='let item of items; let i=index; let isLast=last'` — всі ці поля приходять з directive context object."
      senior: "Context mechanism: ngTemplateOutlet directive передає context object до `createEmbeddedView(templateRef, context)`. В template `let-x='prop'` компілюється в binding що читає `context.prop`. `let-x` без `='...'` → `context.$implicit`. Context typing: Angular 14+ template context type inference через `NgTemplateContextGuard` static method на директиві. Це дає type-safe context без manual type assertion. Template type checking: `<ng-template [ngTemplateOutlet]='tpl' [ngTemplateOutletContext]='ctx'>` — Angular перевіряє тип ctx якщо template має `ngTemplateContextGuard`. TemplateRef generic `TemplateRef<MyContext>` — explicit type для context."
      staff: "Context передача в embedded views — це runtime data binding між host view і embedded view. LView hierarchy: embedded view LView має reference на parent (host) LView. Context object живе в host scope і передається as-is (без копіювання) в embedded view context slot. Зміна context property — тригерить re-check embedded view при наступному CD. Performance: context object що змінюється reference на кожен CD — re-creates bindings. Immutable context — optimal. Для Design System reusable templates: TypeScript generic templates `TemplateRef<{ $implicit: T }>` + NgTemplateContextGuard static method — повна type safety для consumers. Dynamic context: сигнальний context — якщо context property є signal value, embedded view не реагує реактивно — потрібен explicit context object update або signal() read в template expression."
    commonMistakes:
      - "Не знають що `let-x` без `='prop'` читає `$implicit`"
      - "Не типізують context — втрачають type checking в template"
    relatedQuestions: ["b4t4q1", "b4t4q3"]
  - id: "b4t4q3"
    level: "mid"
    question: "Що таке ViewContainerRef і як його використовувати для dynamic component loading?"
    referenceAnswers:
      junior: "ViewContainerRef — це місце куди Angular може динамічно додавати компоненти або templates. Через нього можна програмно додавати компоненти."
      mid: "ViewContainerRef — абстракція що представляє місце в DOM де можна програмно вставляти views. `createEmbeddedView(templateRef, context)` — вставляє template instance. `createComponent(ComponentClass)` — динамічно створює компонент. Views вставляються як siblings до anchor element (comment node) ViewContainerRef. Для dynamic components: inject ViewContainerRef в constructor або через @ViewChild."
      senior: "ViewContainerRef API: `createEmbeddedView(tRef, ctx?, options?)` → EmbeddedViewRef. `createComponent(componentType, options?)` → ComponentRef. `insert(viewRef, index?)` — вставляє існуючий view. `move(viewRef, newIndex)` — переміщує. `remove(index?)` — destroys і видаляє. `detach(index?)` — detach без destroy (для manual CD). ViewContainerRef позиція: за default — поточний компонент's host element. Через @ViewChild('#anchor', {read: ViewContainerRef}) — custom anchor. Dynamic component DI: `createComponent` options.injector — передає custom injector для proper DI resolution. ComponentRef.instance — доступ до component class instance. ComponentRef.setInput() — встановлення inputs (Angular 14+), безпечніше ніж прямий instance доступ."
      staff: "ViewContainerRef — один з фундаментальних Angular primitives. В Ivy: ViewContainerRef є wrapper над LContainer — спеціальний slot в LView що зберігає ordered list embedded views. DOM projection: views вставляються між anchor comment node і next DOM element. createComponent без NgModule (Angular 14+): не потребує entryComponents або NgModule — Ivy знає компонент з import. Injector hierarchy при dynamic creation: якщо не передати injector — компонент використовує host injector. Для proper service scoping: `Injector.create({ providers: [...], parent: this.injector })`. Portal pattern (Angular CDK): TemplatePortal/ComponentPortal — вищого рівня abstraction над ViewContainerRef для cross-component view projection. Performance: dynamic components vs ng-template — template завжди дешевший (shared compilation). Dynamic component — окремий compilation unit, but same Ivy instructions. Для модальних вікон, tooltips, overlays: CDK Overlay + PortalOutlet — production-ready ViewContainerRef wrapper."
    commonMistakes:
      - "Не destroy ViewRef після видалення — memory leak"
      - "Inject ViewContainerRef в constructor отримують container linked до host element, не до specific anchor — використовувати @ViewChild для точної позиції"
    relatedQuestions: ["b4t4q2", "b4t4q4"]
  - id: "b4t4q4"
    level: "senior"
    question: "Як реалізувати dynamic component loading з proper lifecycle management і input/output handling?"
    referenceAnswers:
      junior: "Використовуємо ViewContainerRef.createComponent() для завантаження компоненту динамічно."
      mid: "createComponent(MyComponent) повертає ComponentRef. Через componentRef.instance встановлюємо inputs, через componentRef.instance.myOutput.subscribe() підписуємось на outputs. При destroy — componentRef.destroy(). Для очищення — зберігаємо refs і destroy при потребі."
      senior: "Proper dynamic component lifecycle: 1) `const ref = vcr.createComponent(MyComp, { injector: this.injector })` — create з proper injector. 2) `ref.setInput('title', value)` — Angular 14+ API для inputs замість прямого instance access. 3) Outputs через `outputToObservable(ref.instance.myOutput)` або пряма підписка з cleanup. 4) `ref.changeDetectorRef.detectChanges()` після input changes якщо OnPush. 5) Cleanup: `ref.destroy()` або `vcr.remove(vcr.indexOf(ref.hostView))`. HostView vs EmbeddedView: dynamic component створює HostView (повний CD context), embedded view — легший без DI overhead."
      staff: "Dynamic component lifecycle management — critical для production apps. Pattern: `ComponentRef` stored в WeakMap або Map keyed by identifier. Cleanup: `takeUntilDestroyed()` для output subscriptions, `DestroyRef.onDestroy()` для component cleanup. Input/output contract: `setInput()` тригерить OnChanges lifecycle, правильно інтегрується з OnPush. Output subscriptions: `outputToObservable(ref.instance.someOutput).pipe(takeUntil(destroyed$)).subscribe(...)`. Change detection: dynamic components під OnPush — `ref.changeDetectorRef.markForCheck()` після зовнішніх змін. Routing integration: dynamic components в router-outlet — Angular Router handles lifecycle. Custom dynamic routing: Angular Router code split patterns — loadComponent для lazy. Performance: dynamic component vs *ngIf toggle — *ngIf кращий для conditional visibility (cheap toggle), dynamic createComponent — для truly dynamic cases (unknown component type at compile time). CDK Portal service — production pattern що абстрагує ViewContainerRef management."
    commonMistakes:
      - "Не clean up output subscriptions при dynamic component removal — memory leak"
      - "Прямий instance доступ для inputs замість setInput() — OnChanges не спрацьовує"
    relatedQuestions: ["b4t4q3", "b4t4q5"]
  - id: "b4t4q5"
    level: "staff"
    question: "Як спроектувати систему dialog/modal з dynamic content в Angular без третьосторонніх бібліотек?"
    referenceAnswers:
      junior: "Можна використати Angular Material MatDialog або зробити компонент що показується/ховається через *ngIf."
      mid: "Для custom dialog: DialogService що інжектує через ViewContainerRef або document.body, dynamic component loading, backdrop, close через output або service. Overlay component з ViewContainerRef для dynamic content rendering."
      senior: "Architecture: DialogService з inject(ViewContainerRef) або document.body ViewContainerRef. createComponent(DialogWrapperComponent) → wrapper містить content via ng-content або ngTemplateOutlet. Передача даних: через ComponentRef.setInput() або custom injector з dialog data. Закриття: output або Subject в service. Backdrop: порожній overlay div. Animations: Angular Animations або CSS transitions. Cleanup: dialogRef.destroy() + document cleanup. Typing: generic DialogRef<T, R> де T — input data, R — result type."
      staff: "Production dialog system потребує вирішення декількох cross-cutting concerns: 1) Overlay management: CDK Overlay service як foundation — handles stacking, positioning, backdrop. 2) Focus trap: CDK FocusTrap — accessibility requirement (WCAG 2.1). 3) Scroll management: CDK ScrollStrategy — prevent body scroll. 4) Animation: enter/leave animations без ViewChild timing issues — useAnimation з AnimationBuilder. 5) Injector: dialog components потребують parent injector + dialog-specific providers (DIALOG_DATA token). 6) Result handling: Observable/Promise based API — `dialog.open(MyComp, data).afterClosed().subscribe(result => ...)`. 7) Dialog stacking: z-index management, overlay container в document. 8) SSR considerations: guards для browser-only APIs (document.body, window). 9) Testing: OverlayContainer mock у tests. Ключове архітектурне рішення: інтегрувати з CDK Overlay (якщо вже є Angular Material) vs custom VDOM insertion. CDK дає accessibility patterns безкоштовно — не варто reimplementing."
    commonMistakes:
      - "Забувають про focus trap — modal без FocusTrap не accessible"
      - "Не думають про SSR — document/window access без platform check"
    relatedQuestions: ["b4t4q4", "b4t4q3"]
---

## Core Concept

**English definition:** Dynamic templates in Angular refer to the mechanism of declaring, storing, and instantiating template fragments at runtime using `ng-template` (TemplateRef), `ng-container` (DOM-less grouping), and `ViewContainerRef` (programmatic view insertion point), enabling deferred, conditional, and dynamic component loading.

**Пояснення:** Angular дозволяє декларувати template fragments що не рендеряться одразу. `ng-template` — оголошення TemplateRef (template factory). `ng-container` — логічна група без DOM елемента (рендериться як comment node). `ViewContainerRef` — місце в DOM де Angular може програмно вставляти embedded views або dynamic components. Разом ці механізми забезпечують lazy rendering, reusable UI patterns і runtime component composition.

**Яку проблему вирішує:** Статичні templates не дозволяють умовно рендерити різні структури, перевикористовувати template fragments з різним контекстом, або завантажувати компоненти що невідомі на compile time. Dynamic templates вирішують: reusable cell templates у таблицях, modal dialogs і overlays, plugin/extension архітектура, wizard/stepper patterns.

**Як працює під капотом:** `<ng-template>` компілюється в окрему template function в component factory. При виклику `viewContainerRef.createEmbeddedView(templateRef, context)` — Angular алоцирує новий LView (embedded view), виконує template function і вставляє результат в DOM як siblings до anchor comment node. LContainer в LView зберігає ordered list вставлених views. `createComponent(Type)` — алоцирує ComponentRef з власним LView і injector, вставляє host view в ViewContainerRef.

**Trade-offs та обмеження:** Dynamic components — higher overhead ніж @if toggle (окремий LView, injector). TemplateRef context — object reference, не reactive signal. ViewContainerRef lifecycle — developer responsibility. Прямий DOM insertion через document.body bypass Angular zones. ng-template всередині @if — стає недоступним поза block (scope isolation).

**Версійність:** ng-template і ViewContainerRef стабільні з Angular 2. Angular 13: `createComponent()` без NgModule entryComponents. Angular 14: `ComponentRef.setInput()` API, typed template context. Angular 17: `@if`/`@for`/`@switch` — нативний control flow замість структурних директив (але ng-template залишається для reusable templates). Angular 19: `afterRenderEffect()` для post-render DOM interaction.

---

## Deep Details

### Edge Cases

**ng-template scope:** Template var `#tpl` в ng-template — доступна тільки поки template в DOM scope. Якщо ng-template оголошена в child component — не доступна в parent через @ViewChild з parent template context.

**ViewContainerRef anchor position:** Без custom anchor ViewContainerRef inject в constructor — anchor є host element comment. З @ViewChild('anchor', {read: ViewContainerRef}) — anchor є той ng-container або element де розміщена reference.

**Multiple inserts одного TemplateRef:** Один TemplateRef можна вставити кілька разів з різними contexts — кожен `createEmbeddedView()` створює окремий LView (окремий state, lifecycle, bindings).

**Detach vs Destroy:** `viewContainerRef.detach(index)` — відриває view від ViewContainerRef без destroy. View залишається в memory і може бути re-attached. `remove(index)` — detach + destroy. Detach корисний для view recycling (performance optimization).

**ngTemplateOutlet і context typing:** Angular 14+ підтримує typed context через `NgTemplateContextGuard`. Без нього — context тип `any`. З guard — type checking в template expressions.

**CD і embedded views:** Embedded views мають власний CD context але залежать від host view CD cycle. При OnPush host view — embedded views теж не перевіряються якщо host не dirty. Виняток: AsyncPipe в embedded view — markForCheck() propagates up.

### Junior vs Senior Understanding

**Junior** знає синтаксис ng-template, ngTemplateOutlet, розуміє ng-container як no-DOM wrapper.

**Senior** розуміє:

1. **LView hierarchy:** Embedded view — окремий LView дочірній до host. Dynamic component — HostView з власним injector. Різниця в overhead і DI capability.

2. **Template function compilation:** ng-template → окрема функція в compiled output. Not evaluated until `createEmbeddedView()` — lazy execution, не lazy parsing.

3. **Context typing з NgTemplateContextGuard:** Static method що дає type-checked context без runtime overhead.

4. **ViewContainerRef positioning:** Де розміщується anchor — критично для DOM structure. Custom anchor через @ViewChild read ViewContainerRef.

5. **Lifecycle управління:** createComponent/createEmbeddedView — developer manages destroy. Не автоматичний cleanup — memory leak ризик.

6. **Portal pattern (CDK):** TemplatePortal/ComponentPortal — production abstraction що handles ViewContainerRef complexity і cross-component projection.

### Deprecation & Migration Path

- **entryComponents (NgModule):** Видалено в Angular 14. Ivy не потребує реєстрації dynamic components.
- **ComponentFactoryResolver:** Deprecated Angular 13, видалено Angular 15. Тепер: `viewContainerRef.createComponent(ComponentClass)` напряму.
- **@ViewChild static для ViewContainerRef:** Краще — inject ViewContainerRef в constructor або використовувати signal viewChild.
- **ngTemplateOutlet без typed context:** Upgrade path — додати NgTemplateContextGuard для type safety.

### Connections to Other Concepts

- **Structural Directives:** `*ngFor`, `*ngIf` under the hood використовують TemplateRef + ViewContainerRef. `@if`/`@for` — native control flow з тим самим LView mechanism.
- **Content Projection:** ng-content vs ngTemplateOutlet — обидва projection, але ng-content static (parent defines structure), template outlet dynamic (consumer defines template).
- **CDK Portal:** TemplatePortal/ComponentPortal — high-level API над ViewContainerRef для overlay/dialog patterns.
- **Change Detection:** Embedded views детектуються в рамках host CD cycle. createComponent views — незалежний CD, можна викликати окремо.

---

## Examples

### Basic Usage

```typescript
@Component({
  selector: 'app-template-demo',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <!-- ng-container: structural grouping without DOM element -->
    <ng-container *ngIf="isLoggedIn; else loginTpl">
      <h2>Welcome, {{ username }}!</h2>
    </ng-container>

    <!-- ng-template: reusable template fragment -->
    <ng-template #loginTpl>
      <h2>Please log in</h2>
      <button (click)="login()">Login</button>
    </ng-template>

    <!-- ngTemplateOutlet: render template with context -->
    <ng-container [ngTemplateOutlet]="cardTpl"
                  [ngTemplateOutletContext]="{ $implicit: user, highlight: true }">
    </ng-container>

    <ng-template #cardTpl let-user let-highlighted="highlight">
      <div [class.highlighted]="highlighted">
        {{ user.name }}
      </div>
    </ng-template>

    <!-- Reuse same template multiple times with different context -->
    @for (item of items; track item.id) {
      <ng-container [ngTemplateOutlet]="rowTpl"
                    [ngTemplateOutletContext]="{ $implicit: item, index: $index }">
      </ng-container>
    }

    <ng-template #rowTpl let-item let-i="index">
      <div>{{ i + 1 }}. {{ item.name }}</div>
    </ng-template>
  `
})
export class TemplateDemoComponent {
  isLoggedIn = false;
  username = 'User';
  user = { name: 'John' };
  items = [{ id: 1, name: 'Angular' }, { id: 2, name: 'React' }];

  login(): void { this.isLoggedIn = true; }
}
```

### Production Scenario

```typescript
// Generic table with customizable cell templates
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <table>
      <thead>
        <tr>
          @for (col of columns(); track col.key) {
            <th>{{ col.label }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.id) {
          <tr>
            @for (col of columns(); track col.key) {
              <td>
                @if (col.template) {
                  <ng-container
                    [ngTemplateOutlet]="col.template"
                    [ngTemplateOutletContext]="{ $implicit: row[col.key], row: row }">
                  </ng-container>
                } @else {
                  {{ row[col.key] }}
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `
})
export class DataTableComponent<T extends { id: string | number }> {
  columns = input.required<ColumnDef<T>[]>();
  rows = input.required<T[]>();
}

interface ColumnDef<T> {
  key: keyof T;
  label: string;
  template?: TemplateRef<{ $implicit: unknown; row: T }>;
}

// Usage with custom cell template
@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table [columns]="columns" [rows]="users">
    </app-data-table>

    <!-- Custom template for status column -->
    <ng-template #statusTpl let-status let-row="row">
      <span [class]="'badge badge-' + status">{{ status }}</span>
    </ng-template>
  `
})
export class UsersPageComponent implements AfterViewInit {
  @ViewChild('statusTpl') statusTpl!: TemplateRef<{ $implicit: string; row: User }>;

  users = signal<User[]>([
    { id: 1, name: 'Alice', status: 'active' },
    { id: 2, name: 'Bob', status: 'inactive' },
  ]);

  columns: ColumnDef<User>[] = [];

  ngAfterViewInit(): void {
    this.columns = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status', template: this.statusTpl },
    ];
  }
}
```

### Anti-Example

```typescript
// WRONG: Common dynamic template mistakes
@Component({
  template: `
    <!-- WRONG: trying to use template var from inside @if outside -->
    @if (showDialog) {
      <ng-template #dialogTpl>Dialog content</ng-template>
    }
    <!-- dialogTpl is undefined here — out of scope -->
    <ng-container [ngTemplateOutlet]="dialogTpl"></ng-container>
  `
})
export class BadDynamicComponent implements OnInit {
  @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;
  private componentRef?: ComponentRef<DynamicModalComponent>;

  openModal(): void {
    this.componentRef = this.container.createComponent(DynamicModalComponent);
    // WRONG: direct instance mutation, bypasses OnChanges
    this.componentRef.instance.title = 'My Modal';
    // WRONG: no cleanup on output subscription
    this.componentRef.instance.closed.subscribe(() => this.closeModal());
  }

  closeModal(): void {
    this.componentRef?.destroy();
    // WRONG: not clearing the reference — stale ComponentRef
  }
}

// CORRECT:
@Component({
  template: `
    <!-- Move template outside conditional -->
    <ng-template #dialogTpl>Dialog content</ng-template>
    @if (showDialog) {
      <ng-container [ngTemplateOutlet]="dialogTpl"></ng-container>
    }
  `
})
export class GoodDynamicComponent implements OnDestroy {
  @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;
  private componentRef?: ComponentRef<DynamicModalComponent>;
  private destroyed$ = new Subject<void>();

  openModal(): void {
    this.componentRef?.destroy(); // Clean up existing
    this.componentRef = this.container.createComponent(DynamicModalComponent, {
      injector: this.injector
    });
    // Correct: use setInput() — triggers OnChanges
    this.componentRef.setInput('title', 'My Modal');
    // Correct: cleanup subscription on destroy
    outputToObservable(this.componentRef.instance.closed)
      .pipe(take(1), takeUntil(this.destroyed$))
      .subscribe(() => this.closeModal());
  }

  closeModal(): void {
    this.componentRef?.destroy();
    this.componentRef = undefined; // Clear stale reference
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.componentRef?.destroy();
  }
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Не destroy ComponentRef після видалення | Memory leak — LView і injector залишаються в memory | `componentRef.destroy()` і `componentRef = undefined` при cleanup |
| Прямий instance access для inputs замість setInput() | OnChanges не спрацьовує, OnPush не оновлюється | `componentRef.setInput('propName', value)` — Angular 14+ |
| Підписка на output без unsubscribe при dynamic components | Memory leak оскільки component може бути destroyed | `take(1)` або `takeUntil(destroyed$)` для output subscriptions |
| ng-template всередині @if для зовнішнього використання | Template var out of scope поза @if block — завжди undefined | Розмістити ng-template поза conditional block |
| ComponentFactoryResolver (Angular 13-) | Deprecated та видалено в Angular 15 | `viewContainerRef.createComponent(ComponentClass)` напряму |

---

## Interview Block

### [L1 — Warm-up] Що таке ng-template і ng-container і для чого вони використовуються?
**Signal being tested:** Розуміння Angular template primitives і коли використовувати кожен — не плутати ng-template (definition) з ng-container (grouping).
**What the interviewer expects:** Чітка різниця: ng-template — template factory (TemplateRef), ng-container — phantom wrapper без DOM output, обидва корисні для structural directives.
**How to probe deeper:** "Що рендериться в DOM від `<ng-template #t>Hello</ng-template>` якщо він ніде не referenced?"
**Reference answer:** ng-template — не рендериться в DOM автоматично, тільки comment placeholder. Це TemplateRef — factory для embedded views. ng-container — рендериться як comment node, content відображається але без wrapper element. Structural directives (ngIf, ngFor) under the hood створюють ng-template і керують ViewContainerRef.
**Common mistakes:** Думають ng-template автоматично показується; плутають з ng-content (content projection).

### [L2 — Mid] Як передати context у ng-template і як отримати $implicit значення?
**Signal being tested:** Знання template context mechanism і `let-` syntax — розуміння implicit vs named properties.
**What the interviewer expects:** ngTemplateOutletContext object, `$implicit` для `let-x`, named properties для `let-x='prop'`, typed context через TemplateRef<T>.
**How to probe deeper:** "Як типізувати context ng-template для type safety в strictTemplates mode?"
**Reference answer:** Context передається через `[ngTemplateOutletContext]="{ $implicit: value, prop: other }"`. `let-x` в template читає `$implicit`. `let-x='prop'` — читає named property. TemplateRef<MyContext> — explicit typing. NgTemplateContextGuard static method — type inference для context без explicit generics.
**Common mistakes:** Не знають що `let-x` без `='...'` читає `$implicit`; не типізують context і втрачають type checking.

### [L3 — Senior] Що таке ViewContainerRef і як його використовувати для dynamic component loading?
**Signal being tested:** Розуміння ViewContainerRef як low-level Angular primitive і правильне lifecycle management при dynamic loading.
**What the interviewer expects:** createComponent API, setInput(), output subscriptions з cleanup, ComponentRef.destroy(), injector hierarchy.
**How to probe deeper:** "Яка різниця між HostView (dynamic component) і EmbeddedView (ng-template) з точки зору DI і CD?"
**Reference answer:** ViewContainerRef.createComponent(MyComp) → ComponentRef. setInput() для inputs (тригерить OnChanges). OutputToObservable для output subscriptions з takeUntil cleanup. componentRef.destroy() при видаленні. Custom injector через options.injector — для proper service scoping. HostView (dynamic component) має власний injector tree; EmbeddedView — shares host injector.
**Common mistakes:** Не destroy ComponentRef; пряма instance mutation замість setInput(); не очищають output subscriptions.

### [L4 — Staff/Principal] Як спроектувати систему dialog/modal з dynamic content в Angular без третьосторонніх бібліотек?
**Signal being tested:** Архітектурне мислення про cross-cutting concerns: accessibility, animations, SSR, injector hierarchy — не просто "як показати div".
**What the interviewer expects:** CDK Overlay як foundation, focus trap для a11y, scroll strategy, AnimationBuilder, generic DialogRef<T,R> API, SSR guards.
**How to probe deeper:** "Як обробити focus management і keyboard navigation (Escape key) у modal?"
**Reference answer:** CDK Overlay service — handles z-index, backdrop, positioning. FocusTrap — WCAG accessibility. ScrollStrategy — prevent body scroll. DialogRef<T,R> з afterClosed() Observable. DIALOG_DATA token через custom injector. AnimationBuilder для enter/exit. Cleanup: destroy on close + body scroll restore. SSR: isPlatformBrowser guards для document access.
**Common mistakes:** Ігнорують accessibility (focus trap, escape key, aria-modal); не думають про SSR; не generic — hard-coded data types.

---

## Summary

### Key Points
- `ng-template` — оголошення TemplateRef що не рендериться до explicit instantiation через ViewContainerRef або ngTemplateOutlet
- `ng-container` — логічна група без DOM output (comment node), використовується для structural directives без зайвих elements
- Context передається через `ngTemplateOutletContext` object: `$implicit` → `let-x`, named props → `let-x='prop'`
- `ViewContainerRef.createComponent(Type)` — dynamic component loading без NgModule (Angular 13+)
- `ComponentRef.setInput()` (Angular 14+) — правильний спосіб встановлення inputs, тригерує OnChanges
- Lifecycle management — developer responsibility: destroy ComponentRef, unsubscribe outputs
- CDK Portal — production-level abstraction над ViewContainerRef для dialog/overlay patterns

### Elevator Pitch (2 minutes)
Dynamic templates в Angular — три примітиви: `ng-template` (TemplateRef — lazy template fragment), `ng-container` (DOM-less grouping), `ViewContainerRef` (insertion point для programmatic view creation). ng-template + ngTemplateOutlet + context = reusable parameterizable templates. `$implicit` в context → `let-x` в template. ViewContainerRef.createComponent(MyComp) → dynamic loading без NgModule. ComponentRef.setInput() → safe input assignment. Завжди: destroy ComponentRef при cleanup, unsubscribe outputs. Typed context: TemplateRef<MyContext> + NgTemplateContextGuard = type-safe templates. Production: CDK Portal для overlays — abstracts ViewContainerRef + accessibility + z-index management.
