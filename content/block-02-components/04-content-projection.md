---
title: "Content Projection"
block: 2
topic: 4
slug: "content-projection"
difficulty: 3
sinceVersion: "2"
tags: ["ng-content", "content-projection", "select", "ngTemplateOutlet", "ng-template", "CDK-portal"]
relatedTopics: ["component-metadata", "viewchild-contentchild", "host-element", "ng-template"]
interviewQuestions:
  - id: "b2t4q1"
    level: "junior"
    question: "Що таке content projection і як працює ng-content?"
    referenceAnswers:
      junior: "Content projection дозволяє вставляти HTML контент всередину компонента. ng-content — це placeholder де з'явиться контент що передали між тегами компонента."
      mid: "Content projection — це механізм передачі DOM-контенту від parent в child компонент. <ng-content> в child template визначає slot куди Angular вставить контент з parent template. Наприклад: <app-card><p>Hello</p></app-card> — <p>Hello</p> проєктується в ng-content slot. select attribute дозволяє multi-slot projection: <ng-content select='header'> прийме тільки <header> елементи."
      senior: "Content projection — це compile-time mechanism: Angular при AOT визначає які DOM nodes проєктуються в які slots. <ng-content> не створює додатковий DOM element — це projection point. Проєктований контент живе в parent's view, не в child's view — change detection належить parent. select підтримує CSS selectors: element (header), class (.title), attribute ([slot='header']), :not(). ng-content без select — default slot для всього що не matched інші slots. Важливо: ng-content eagerly рендерить контент навіть якщо slot hidden (на відміну від ngTemplateOutlet). Fallback content для ng-content доступний з Angular 18."
      staff: "Content projection — це composition primitive для component architecture. Архітектурно еквівалент slot-based composition (Web Components, Vue slots). Три types: single-slot, multi-slot (select), conditional (ngTemplateOutlet). Single-slot — для wrapper components (card, panel). Multi-slot — для structured layouts (dialog з header/body/footer). Conditional — коли потрібна lazy або conditional rendering контенту. ng-content limitations: не можна iterate, не можна conditionally render (до v18 fallback). Для advanced patterns: ng-template + ngTemplateOutlet дає повний контроль — template як data. CDK Portal — для cross-component-tree projection (overlays, modals). Архітектурне рішення: коли projection vs коли Input<TemplateRef> — projection для simple composition, TemplateRef для dynamic/repeated rendering."
    commonMistakes:
      - "Не знають про multi-slot projection з select"
      - "Думають що ng-content має lazy rendering"
    relatedQuestions: ["b2t4q2", "b2t4q3"]
  - id: "b2t4q2"
    level: "mid"
    question: "Як працює multi-slot projection з select? Які CSS selectors підтримуються?"
    referenceAnswers:
      junior: "select атрибут на ng-content фільтрує який контент куди потрапляє. Можна вказати тег або клас."
      mid: "select приймає CSS selector: <ng-content select='h2'> — тільки h2 елементи, <ng-content select='.footer'> — елементи з class footer, <ng-content select='[slot=actions]'> — елементи з attribute slot=actions. ng-content без select — catch-all для решти контенту. Порядок evaluation: спочатку specific selects, потім default. Не підтримуються: pseudo-classes (:first-child), combinators (div > p)."
      senior: "Multi-slot projection працює через compile-time slot matching. Кожен projected node matched до slot при створенні view — не при кожному CD. Підтримуються: type selector (header), class selector (.title), attribute selector ([priority]), compound selector (div.actions), ngProjectAs для override matching ('ngProjectAs=\"header\"' на ng-container зробить match для select='header'). Не підтримуються: pseudo-selectors, combinator selectors, * universal. Fallback content (Angular 18+): <ng-content select='header'>Default Header</ng-content> — показується якщо parent не передав matching content. ContentChild/ContentChildren доступні для projected content через query mechanism."
      staff: "Multi-slot projection — це API design tool для structured components. Patterns: 1) Named slots через attribute selectors: [slot='header'], [slot='body'], [slot='footer'] — explicit, discoverable. 2) Type selectors для design system: <ds-card-header>, <ds-card-body> — семантичні, typed (ContentChild може query specific directive). 3) ngProjectAs для wrapper flexibility — ng-container з ngProjectAs не додає DOM element. Для API documentation: slots повинні бути documented як частина component API (аналог props). Angular 18 fallback content вирішує проблему optional slots без @if (contentChild()) workaround. В design system: slot-based API vs Input-based API — slot для rich content (HTML, components), Input для primitive values. Consistency: обрати convention (attribute vs element selectors) для всього design system."
    commonMistakes:
      - "Намагаються використати CSS combinators в select"
      - "Не знають про ngProjectAs"
    relatedQuestions: ["b2t4q1", "b2t4q3"]
  - id: "b2t4q3"
    level: "senior"
    question: "Яка різниця між ng-content і ngTemplateOutlet? Коли що використовувати?"
    referenceAnswers:
      junior: "ng-content вставляє контент як є, ngTemplateOutlet рендерить ng-template і може передати дані."
      mid: "ng-content — static projection, контент рендериться eagerly і не може бути conditional. ngTemplateOutlet приймає TemplateRef і рендерить її dynamically — можна передати context, рендерити умовно, повторювати в loop. ng-content для простої composition, ngTemplateOutlet для dynamic rendering patterns."
      senior: "Ключові відмінності: 1) ng-content — compile-time, eager rendering. Навіть якщо ng-content в @if(false), projected content все одно instantiated (до Angular 18 — з fallback content pattern змінюється). 2) ngTemplateOutlet — runtime, lazy rendering. TemplateRef створюється тільки коли outlet активний. 3) ngTemplateOutlet має context — можна передати дані в template через let-variable. 4) ng-content — parent owns view (CD). ngTemplateOutlet — host component owns embedded view. Use cases: ng-content для slot-based layout (card, dialog). ngTemplateOutlet для: row templates в table, custom rendering strategies, render-prop pattern."
      staff: "Це fundamental architectural choice: composition (ng-content) vs delegation (ngTemplateOutlet). ng-content — declarative slot API, consumer надає HTML/components. ngTemplateOutlet — inversion of control, consumer надає template, host decides when/where/how many times to render. Для component library: List component з itemTemplate: input<TemplateRef>() — host ітерує дані, consumer визначає rendering. Dialog з ng-content slots — consumer визначає layout. Advanced: поєднання обох — ng-content для static structure, ngTemplateOutlet для dynamic parts. CDK Portal — третій підхід для cross-tree projection (overlays). В Angular 18+: ng-content fallback + conditional slots зменшують потребу в ngTemplateOutlet для simple cases. Performance: ngTemplateOutlet lazy — кращий для conditional content (tabs, accordion panels)."
    commonMistakes:
      - "Використовують ng-content для conditional content (eager rendering)"
      - "Не передають context в ngTemplateOutlet"
    relatedQuestions: ["b2t4q1", "b2t4q4"]
  - id: "b2t4q4"
    level: "senior"
    question: "Як реалізувати conditional projection і render-prop pattern в Angular?"
    referenceAnswers:
      junior: "Conditional projection — це коли контент показується або ховається за умовою."
      mid: "Для conditional projection використовують ngTemplateOutlet замість ng-content. Parent передає TemplateRef через Input, child рендерить його через <ng-container *ngTemplateOutlet='tmpl; context: data'>. Render-prop pattern: parent визначає як рендерити item, child визначає коли і де."
      senior: "Conditional projection: ng-content eagerly renders — @if навколо нього не допомагає (контент instantiated завжди). Рішення: Input<TemplateRef> + ngTemplateOutlet. Render-prop pattern: child приймає TemplateRef як input, ітерує дані і рендерить template з context. Приклад: <app-list [items]='users' [itemTemplate]='userTmpl'/>, де userTmpl отримує $implicit з item data. З Angular 18: ng-content fallback content — альтернатива для simple conditional. ContentChild query для перевірки чи передано content. signal-based contentChild() — reactive check для conditional rendering."
      staff: "Conditional projection і render-prop — це composition patterns що визначають component flexibility. Render-prop через TemplateRef: 1) Strongly typed context через generic TemplateRef<C>. 2) Multiple templates для різних станів (loading, error, empty, item). 3) Default template як fallback. Production pattern: data table з cell templates — кожна column має свій TemplateRef для rendering. Для type safety: ContextGuard pattern (static ngTemplateContextGuard) забезпечує type inference в template. CDK Portal для escape-hatch scenarios: projected content потрібен в overlay (поза component tree). Архітектурно: TemplateRef inputs створюють inversion of control — component library визначає behavior, consumer визначає presentation. Це scalable pattern для design systems з high customizability requirements."
    commonMistakes:
      - "Обгортають ng-content в @if і думають що контент conditional"
      - "Не типізують context для ngTemplateOutlet"
    relatedQuestions: ["b2t4q3", "b2t4q5"]
  - id: "b2t4q5"
    level: "staff"
    question: "Як CDK Portal працює і коли його використовувати замість ng-content/ngTemplateOutlet?"
    referenceAnswers:
      junior: "CDK Portal — це спосіб рендерити контент в іншому місці DOM дерева."
      mid: "CDK Portal дозволяє проєктувати component або template в PortalOutlet який може бути в будь-якому місці DOM. Використовується для overlays, modals, tooltips — коли контент повинен бути поза component tree. TemplatePortal для templates, ComponentPortal для dynamic components."
      senior: "CDK Portal вирішує проблему cross-tree projection. ng-content/ngTemplateOutlet працюють в межах component tree. Portal дозволяє: 1) CdkPortalOutlet — directive що приймає Portal. 2) TemplatePortal — wraps TemplateRef для projection. 3) ComponentPortal — dynamic component creation в outlet. 4) DomPortalOutlet — render в arbitrary DOM element (поза Angular app). Use case: Dialog service створює ComponentPortal, рендерить в overlay container при document body. Portal зберігає DI context — inject() працює відносно portal origin. Cleanup автоматичний при detach."
      staff: "CDK Portal — це low-level primitive для UI architecture patterns що потребують DOM position decoupling від component tree position. Patterns: 1) Overlay system (CDK Overlay використовує Portal internally). 2) Teleport pattern — рендеринг в fixed position container (toast notifications, floating toolbars). 3) Lazy component loading — ComponentPortal з dynamic import. Architecture decisions: Portal vs ng-content — use Portal коли DOM position matters (z-index, overflow, positioning). Portal vs Overlay — Portal для custom positioning, Overlay для managed positioning з strategies (connected, global). В micro-frontend: Portal не працює across Angular app boundaries (різні DI trees). Для accessibility: Portal content повинен мати proper aria relationships з trigger element — це responsibility на consumer. Performance: Portal attach/detach — lightweight operation, але ComponentPortal створює component instance кожен раз (reuse через detach/attach pattern)."
    commonMistakes:
      - "Використовують Portal для простої slot-based projection"
      - "Забувають про DI context при Portal projection"
    relatedQuestions: ["b2t4q3", "b2t4q4"]
---

## Core Concept

**English definition:** Content projection is the mechanism by which a parent component passes DOM content (elements, components, text) into designated slots within a child component's template, enabling flexible composition patterns.

**Пояснення:** Content projection — це "слоти" в компоненті, куди parent може вставити свій контент. Як коробка з отворами різної форми: кожен ng-content з select — це отвір що приймає тільки контент що підходить за CSS selector.

**Яку проблему вирішує:** Без projection компоненти мали б приймати весь контент через Inputs (string, TemplateRef) — громіздко і не ergonomic. ng-content дозволяє природну HTML-подібну composition: `<app-card><h2>Title</h2><p>Body</p></app-card>`.

**Як працює під капотом:**

1. AOT compiler аналізує `<ng-content select="...">` slots в child template
2. При компіляції parent template — projected nodes matched до slots за CSS selector
3. Runtime: projected nodes створюються в parent's LView
4. Nodes переміщуються (не копіюються) в child's projection points
5. Change detection для projected content належить parent component

```typescript
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <div class="card-header">
        <ng-content select="[card-header]">
          <!-- Angular 18+: fallback content -->
          <h3>Default Header</h3>
        </ng-content>
      </div>
      <div class="card-body">
        <ng-content />
      </div>
      <div class="card-footer">
        <ng-content select="[card-footer]" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {}

// Usage:
// <app-card>
//   <h2 card-header>User Profile</h2>
//   <p>This goes to default slot (card-body)</p>
//   <button card-footer>Save</button>
// </app-card>
```

**Trade-offs та обмеження:**

- ng-content eager renders — навіть коли slot в @if(false), контент instantiated
- Projected content CD належить parent — child не контролює update frequency
- Не можна iterate projected content (ng-content не є structural directive)
- select обмежений простими CSS selectors — без combinators чи pseudo-classes

**Версійність:**
- Angular 2: ng-content, select attribute
- Angular 4: ngTemplateOutlet з context
- Angular 14: ng-container з ngComponentOutlet inputs
- Angular 18: ng-content fallback content
- CDK Portal: доступний з Angular CDK v2+

## Deep Details

### Edge Cases

- **Duplicate selectors:** Два ng-content з однаковим select — тільки перший отримає контент, другий буде порожнім.
- **ngProjectAs:** `<ng-container ngProjectAs="header">...</ng-container>` — дозволяє match без додавання DOM element.
- **Empty projection:** Якщо parent не передає контент — ng-content порожній (або fallback з v18).
- **Dynamic content:** Content projection static — додавання DOM nodes після init не проєктується в slot.
- **ViewEncapsulation і projected content:** Projected content стилізується PARENT styles (бо належить parent view), не child.

### Junior vs Senior Understanding

**Junior** знає: "ng-content вставляє контент з parent."

**Senior** розуміє: Content projection — це compile-time slot matching. Projected content належить parent view (CD, styles). ng-content eager renders — для conditional content потрібен ngTemplateOutlet. Multi-slot з select — для structured APIs. ngProjectAs — для flexible matching без DOM overhead. Fallback content (v18) для optional slots.

```typescript
// Senior: typed render-prop pattern
@Component({
  selector: 'app-data-list',
  template: `
    @if (loading()) {
      <ng-container *ngTemplateOutlet="loadingTemplate() || defaultLoading" />
    } @else if (data().length === 0) {
      <ng-container *ngTemplateOutlet="emptyTemplate() || defaultEmpty" />
    } @else {
      @for (item of data(); track trackFn()(item)) {
        <ng-container
          *ngTemplateOutlet="itemTemplate(); context: { $implicit: item, index: $index }"
        />
      }
    }

    <ng-template #defaultLoading><p>Loading...</p></ng-template>
    <ng-template #defaultEmpty><p>No data</p></ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataList<T> {
  data = input.required<T[]>();
  loading = input(false);
  trackFn = input<(item: T) => any>(() => (item: any) => item);
  itemTemplate = input.required<TemplateRef<{ $implicit: T; index: number }>>();
  loadingTemplate = input<TemplateRef<void>>();
  emptyTemplate = input<TemplateRef<void>>();
}
```

### Deprecation & Migration Path

- **Not deprecated:** ng-content, ngTemplateOutlet — stable, core API
- **Enhanced:** ng-content fallback content (v18) — reduces need for conditional workarounds
- **Legacy syntax:** `*ngTemplateOutlet` → `ngTemplateOutlet` без structural directive (обидва працюють)
- **Future:** signal-based content queries спрощують conditional projection detection

### Connections to Other Concepts

- **ViewChild/ContentChild:** ContentChild queries projected content, ViewChild queries own template
- **Host Element:** Projected content rendered inside host element boundaries
- **Input/Output:** Alternative composition: Input<TemplateRef> vs ng-content slot
- **Component Metadata:** ng-content slots defined in component template

## Examples

### Basic Usage

```typescript
// Simple wrapper component
@Component({
  selector: 'app-panel',
  template: `
    <div class="panel" [class.expanded]="expanded()">
      <div class="panel-header" (click)="toggle()">
        <ng-content select="[panel-title]" />
        <span class="chevron">{{ expanded() ? '▲' : '▼' }}</span>
      </div>
      @if (expanded()) {
        <div class="panel-body">
          <ng-content />
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Panel {
  expanded = model(true);

  toggle() {
    this.expanded.update(v => !v);
  }
}

// Usage:
// <app-panel [(expanded)]="isOpen">
//   <h3 panel-title>Settings</h3>
//   <app-settings-form />
// </app-panel>
```

### Production Scenario

```typescript
// Dialog component з multi-slot projection і TemplateRef
@Component({
  selector: 'app-dialog',
  template: `
    <div class="dialog-backdrop" (click)="close()">
      <div class="dialog" role="dialog" [attr.aria-labelledby]="titleId"
           (click)="$event.stopPropagation()">
        <header class="dialog-header" [id]="titleId">
          <ng-content select="[dialog-title]">
            <h2>Dialog</h2>
          </ng-content>
          <button class="close-btn" (click)="close()" aria-label="Close">&times;</button>
        </header>

        <section class="dialog-body">
          <ng-content />
        </section>

        <footer class="dialog-actions">
          <ng-content select="[dialog-actions]">
            <button (click)="close()">Close</button>
          </ng-content>
        </footer>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dialog {
  titleId = `dialog-${crypto.randomUUID().slice(0, 8)}`;
  closed = output<void>();

  close() { this.closed.emit(); }
}

// Usage:
// <app-dialog (closed)="onClose()">
//   <h2 dialog-title>Confirm Delete</h2>
//   <p>Are you sure you want to delete this item?</p>
//   <div dialog-actions>
//     <button (click)="onClose()">Cancel</button>
//     <button (click)="onDelete()">Delete</button>
//   </div>
// </app-dialog>
```

### Anti-Example

```typescript
// ❌ WRONG: ng-content inside @if — content still eagerly rendered
@Component({
  selector: 'app-tab-panel',
  template: `
    @if (active()) {
      <ng-content />  <!-- Content instantiated regardless of active() -->
    }
  `,
})
export class TabPanelBad {
  active = input(false);
}

// ✅ CORRECT: ngTemplateOutlet for conditional rendering
@Component({
  selector: 'app-tab-panel',
  template: `
    @if (active()) {
      <ng-container *ngTemplateOutlet="contentTemplate()" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabPanel {
  active = input(false);
  contentTemplate = input.required<TemplateRef<void>>();
}

// Usage:
// <app-tab-panel [active]="currentTab() === 'settings'" [contentTemplate]="settingsTmpl" />
// <ng-template #settingsTmpl>
//   <app-heavy-settings-form />
// </ng-template>
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| ng-content в @if для lazy rendering | Content eagerly instantiated regardless | ngTemplateOutlet + TemplateRef input |
| Один ng-content без select для complex layout | No structured API, all content in one blob | Multi-slot з attribute selectors |
| Duplicate select values | Second slot always empty | Unique selectors per slot |
| Styling projected content from child | Projected content belongs to parent's view | Use CSS Custom Properties або ::ng-deep (з обережністю) |
| CDK Portal для simple slot projection | Unnecessary complexity | ng-content або ngTemplateOutlet |

## Interview Block

### [L1 — Warm-up] Що таке content projection і ng-content?
**Signal being tested:** Базове розуміння composition через slots
**What the interviewer expects:** ng-content як placeholder, parent передає контент
**How to probe deeper:** "А якщо потрібно кілька слотів?"
**Reference answer:** Content projection дозволяє parent передавати HTML/компоненти в child через ng-content slots. Контент між тегами компонента вставляється в ng-content placeholder.
**Common mistakes:** Плутають з ngTemplateOutlet; не знають про select

### [L2 — Mid] Як працює multi-slot projection з select?
**Signal being tested:** Знання structured composition API
**What the interviewer expects:** CSS selectors в select, default slot, ngProjectAs
**How to probe deeper:** "Які CSS selectors НЕ підтримуються в select?"
**Reference answer:** select приймає CSS selectors: element, class, attribute. ng-content без select — default slot. ngProjectAs override matching без DOM element. Не підтримуються combinators, pseudo-classes. Angular 18 додав fallback content.
**Common mistakes:** Використовують complex CSS selectors; не знають ngProjectAs

### [L3 — Senior] ng-content vs ngTemplateOutlet — коли що?
**Signal being tested:** Розуміння eager vs lazy rendering, composition patterns
**What the interviewer expects:** ng-content eager, ngTemplateOutlet lazy + context. Use cases для кожного.
**How to probe deeper:** "Як реалізувати typed render-prop pattern?"
**Reference answer:** ng-content — compile-time, eager, parent owns CD. ngTemplateOutlet — runtime, lazy, context passing. ng-content для layout slots (card, dialog). ngTemplateOutlet для conditional/repeated content (tabs, lists). TemplateRef input з typed context для render-prop.
**Common mistakes:** Не знають що ng-content eager; не типізують template context

### [L4 — Staff] Як CDK Portal доповнює ng-content і ngTemplateOutlet?
**Signal being tested:** Cross-tree projection architecture, overlay patterns
**What the interviewer expects:** When DOM position matters, DI context preservation, overlay system
**How to probe deeper:** "Як забезпечити accessibility для Portal-projected content?"
**Reference answer:** CDK Portal для cross-tree projection — коли DOM position відрізняється від component tree position (overlays, modals, toasts). TemplatePortal, ComponentPortal, DomPortalOutlet. Зберігає DI context origin. Portal vs Overlay: Portal — primitive, Overlay — managed positioning. Accessibility: aria-owns, focus management між trigger і portal content. Performance: reuse через detach/attach.
**Common mistakes:** Portal для простих slots; забувають accessibility; ігнорують DI context

## Summary

### Key Points
- ng-content — compile-time slot-based projection, eager rendering
- select attribute підтримує element, class, attribute CSS selectors (не combinators)
- ngProjectAs дозволяє override slot matching без додаткового DOM element
- ngTemplateOutlet — runtime, lazy rendering з context passing
- Angular 18+: ng-content fallback content для optional slots
- TemplateRef inputs для render-prop pattern (typed, conditional, repeated)
- CDK Portal для cross-component-tree projection (overlays, modals)

### Elevator Pitch
"Content projection в Angular — це slot-based composition. ng-content з select створює structured API з кількома slots. Важливо розуміти: ng-content eager renders (навіть в @if), тому для conditional content — ngTemplateOutlet з TemplateRef. Для render-prop pattern: typed TemplateRef input з context. CDK Portal — для scenarios де DOM position повинна відрізнятись від component tree (overlays). Angular 18 додав fallback content, що спрощує optional slots."
