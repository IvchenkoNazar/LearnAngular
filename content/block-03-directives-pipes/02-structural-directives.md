---
title: "Structural Directives"
block: 3
topic: 2
slug: "structural-directives"
difficulty: 4
sinceVersion: "2"
tags: ["structural-directive", "ng-template", "ng-container", "TemplateRef", "ViewContainerRef", "microsyntax"]
relatedTopics: ["built-in-directives", "attribute-directives", "lifecycle-hooks", "dependency-injection"]
interviewQuestions:
  - level: "junior"
    question: "Що таке ng-template і ng-container, і яка між ними різниця?"
    referenceAnswers:
      junior: "ng-template — це Angular-елемент що визначає HTML блок який не рендериться одразу. ng-container — це grouping елемент що не створює DOM елемент. Різниця: ng-template — lazy template definition, ng-container — structural wrapper без DOM node."
      mid: "ng-template визначає reusable шматок template що може бути інстанційований через *ngIf else, NgTemplateOutlet або programmatically через ViewContainerRef. Він НЕ рендериться в DOM поки не буде явно вставлений. ng-container — transparent wrapper що дозволяє застосовувати structural directives без зайвого DOM елемента: `<ng-container *ngIf='cond'>` замість `<div *ngIf='cond'>` коли div не потрібен семантично."
      senior: "ng-template компілюється в TemplateRef — це lazily instantiable view. Під капотом: Angular compiler генерує окрему template function для кожного ng-template, indexed в TView.tNode. ViewContainerRef.createEmbeddedView(templateRef, context) — instantiates template з optional context object. ng-container — compile-time construct що повністю зникає з DOM, залишаючи тільки comment node як anchor для ViewContainerRef. Важливий нюанс: ng-template має власний scope — локальні змінні (let-x='y') видимі тільки в межах template. TemplateRef — це typed: TemplateRef<{ $implicit: User }> — TypeScript знає тип контексту."
      staff: "ng-template і ng-container — це два різних abstraction levels. ng-template — це lazy view definition, blueprint для embedded view creation. ng-container — це host point для structural directives без DOM pollution. Архітектурно: ng-template з @ContentChild дозволяє parent компоненту inject child-provided templates — pattern для highly customizable components (наприклад, data grid що приймає custom cell templates). TemplateRef typing: строга типізація контексту запобігає runtime помилкам при template rendering. Для performance: велика кількість ng-template на сторінці не має overhead якщо вони не instantiated — вони тільки blueprint functions в memory. В zoneless Angular майбутньому: embedded views реагуватимуть на signal changes без global CD traversal."
    commonMistakes:
      - "Думають що ng-template рендериться в DOM як невидимий елемент"
      - "Використовують div замість ng-container і забруднюють DOM структуру"
    relatedQuestions: ["b3t2q2", "b3t2q3"]
  - level: "mid"
    question: "Як працює TemplateRef і ViewContainerRef разом? Поясни механізм custom structural directive."
    referenceAnswers:
      junior: "TemplateRef — це reference на ng-template. ViewContainerRef — місце в DOM де можна вставляти views. Structural directive використовує їх щоб показувати або ховати content."
      mid: "TemplateRef — об'єкт що представляє ng-template, вміє instantiate view з context. ViewContainerRef — anchor point в DOM (comment node) де вставляються embedded views. Structural directive inject обидва: TemplateRef через constructor і ViewContainerRef через constructor injection. vcr.createEmbeddedView(templateRef) — рендерить template вміст. vcr.clear() — видаляє всі вставлені views. Простий *ngIf clone: якщо condition true → createEmbeddedView, якщо false → clear."
      senior: "ViewContainerRef — logical container для views, фізично представлений comment node (<!--ng-container-->) в DOM. Кожен call createEmbeddedView() повертає EmbeddedViewRef — об'єкт що контролює view lifecycle: markForCheck(), detectChanges(), destroy(). Views в ViewContainerRef мають index: vcr.get(0), vcr.move(view, newIndex) — для reordering без recreating. Context object типізований: createEmbeddedView<Ctx>(templateRef, context: Ctx) — всі let-var='prop' bindings в template отримують значення з context. NgFor internal mechanism: IterableDiffer визначає які views create/move/destroy при зміні масиву, потім VCR операції виконуються мінімально."
      staff: "TemplateRef + ViewContainerRef — низькорівневий API що дає повний контроль над view lifecycle. Для custom structural directive: inject TemplateRef з host ng-template, inject ViewContainerRef для insertion point. Architectural patterns: 1) Portals (CDK Portal) — ViewContainerRef дозволяє render view в будь-якій точці DOM tree, навіть поза host компонентом. 2) Lazy component loading: ViewContainerRef.createComponent() — dynamic component creation без template compilation. 3) Virtual scrolling: CDK VirtualScrollViewport використовує VCR для render/destroy items при scroll. Performance consideration: createEmbeddedView — дорога операція що запускає full lifecycle. Для frequent show/hide — кращий [hidden] CSS або cache embedded view ref замість recreate."
    commonMistakes:
      - "Плутають ViewContainerRef компонента і ViewContainerRef з @ViewChild — перший рендерить всередині компонента, другий — після конкретного елемента"
      - "Не знають що vcr.createEmbeddedView повертає EmbeddedViewRef з повним lifecycle control"
    relatedQuestions: ["b3t2q1", "b3t2q4"]
  - level: "mid"
    question: "Що таке microsyntax десугаринг? Розкажи що відбувається з *ngIf='condition; else tmpl'."
    referenceAnswers:
      junior: "Зірочка перед директивою — це syntactic sugar. *ngIf='condition' насправді розгортається в довший синтаксис з ng-template."
      mid: "*ngIf='condition; else tmpl' — Angular compiler трансформує це в: `<ng-template [ngIf]='condition' [ngIfElse]='tmpl'>`. Зірочка — shorthand: structural directive selector стає Input binding, весь вираз — binding value. Це дозволяє писати *ngFor='let item of items; trackBy: fn' замість довгої форми з ng-template і кількома inputs."
      senior: "Microsyntax parser в Angular compiler розбирає рядок після * і трансформує його в еквівалентний ng-template синтаксис. Алгоритм: 1) весь вираз розміщується на ng-template як host binding, 2) of/let/as/trackBy — ключові слова що трансформуються в конкретні Input bindings. *ngFor='let item of items; trackBy: myFn' → `<ng-template ngFor let-item [ngForOf]='items' [ngForTrackBy]='myFn'>`. let-variable (без =) → прив'язується до $implicit контексту. let-i='index' → прив'язується до 'index' властивості контексту. Для custom structural directive: NgForOf надає NgForOfContext<T> з $implicit, index, first, last тощо. Важливо: microsyntax ключові слова (of, as, let, trackBy) — reserved і не можна використовувати власні ключові слова."
      staff: "Microsyntax — це DSL поверх template syntax що робить structural directives ergonomic. Compiler трансформація відбувається статично (AST-level), не runtime. Для custom structural directive з context: якщо директива надає context { $implicit: T, extraProp: U }, то let-x binding до $implicit і let-y='extraProp' binding до extraProp — все compile-time type-checked. Проблема з новим control flow (@if/@for): вони НЕ використовують microsyntax — це окремий parser. Але custom structural directives досі використовують microsyntax і * syntax. Architectural implication: якщо треба custom microsyntax ключові слова (как ngFor's trackBy) — це потребує написання structural directive, не можна досягти через @if/@for. Для library authors: microsyntax дозволяє elegant API для reusable structural patterns (permission directives, loading state directives)."
    commonMistakes:
      - "Думають що * просто приховує ng-template — не розуміють microsyntax parser"
      - "Намагаються використовувати власні ключові слова в microsyntax — вони не парсяться"
    relatedQuestions: ["b3t2q2", "b3t2q4"]
  - level: "senior"
    question: "Коли варто писати custom structural directive а не використовувати @if/@for? Наведи реальні use cases."
    referenceAnswers:
      junior: "Custom structural directive потрібна коли вбудований @if/@for не вистачає — наприклад для permission checking або complex conditional rendering."
      mid: "Custom structural directive виправдана коли: 1) потрібна reusable умовна логіка (permission check, feature flag, A/B test), 2) потрібен context в template (structural directive може надавати типізований context), 3) логіка занадто складна для inline @if. Приклад: *hasPermission='\"admin\"; role: currentRole' — декларативно і типобезпечно."
      senior: "Custom structural directive виправдана в кількох scenarios: 1) Permission-based rendering: *ifPermission='\"edit\"' — inject PermissionService, hide template без нього. 2) Feature flags: *featureFlag='\"newUI\"' — inject FeatureFlagService. 3) Lazy template з context: subscription paywall '*ifSubscribed; let plan=plan' — inject SubscriptionService, надати plan в context. 4) Declarative loading state: *withData='observable$; let data; let error=error; let loading=loading' — один structural directive замість трьох @if/@else if. @if не може: inject services, надати typed context до template, encapsulate складну умовну логіку. Коли НЕ потрібна custom structural directive: прості boolean conditions → @if, simple iteration → @for."
      staff: "Custom structural directives — це abstraction layer для cross-cutting concerns в template. Архітектурне мислення: якщо умовна логіка повторюється в 10+ компонентах — strong signal для structural directive. *ifPermission, *featureFlag, *withData — це vocabulary для domain-specific template programming. Design considerations: 1) Typing context — TemplateRef<{ $implicit: T, loading: boolean, error: unknown }> — TypeScript перевіряє let bindings. 2) Error handling — що якщо injected service недоступний? 3) OnPush compatibility — directive повинна markForCheck() при async state change. 4) Server rendering — directive може inject isPlatformBrowser і надавати placeholder context в SSR. Performance: structural directive instance persistent поки host element alive — service subscriptions потребують takeUntilDestroyed. Comparison: @if/@for — зручно і compiler-native, structural directive — expressive і reusable. В large codebase: custom structural directives — частина domain language, повинні бути в shared library з повною документацією."
    commonMistakes:
      - "Пишуть structural directive для простих boolean умов — overkill, @if достатній"
      - "Не типізують context TemplateRef — втрачають type safety для let bindings"
    relatedQuestions: ["b3t2q3", "b3t2q5"]
  - level: "staff"
    question: "Як реалізувати structural directive з context що передає async стан (loading/error/data) і як забезпечити type safety для let bindings?"
    referenceAnswers:
      junior: "Structural directive може надавати context об'єкт до template через createEmbeddedView з другим аргументом."
      mid: "Structural directive з context: createEmbeddedView(templateRef, context) де context — об'єкт. TemplateRef типізований: TemplateRef<Context>. let-x binding без = → $implicit. let-loading='loading' → context.loading. TypeScript перевіряє що context відповідає очікуваному типу."
      senior: "Реалізація: 1) Визначити context interface: `interface AsyncContext<T> { $implicit: T | null; loading: boolean; error: unknown }`. 2) Директива: `@Directive({ selector: '[withAsync]' })` з `withAsync = input.required<Observable<T>>()`. 3) inject TemplateRef<AsyncContext<T>> і ViewContainerRef. 4) subscribe до Observable, на кожну emission: vcr.clear() + vcr.createEmbeddedView(tmpl, { $implicit: data, loading, error }). 5) TypeScript static guards: static ngTemplateContextGuard<T>(dir, ctx): ctx is AsyncContext<T> { return true } — Angular compiler використовує це для type narrowing let bindings. Без ngTemplateContextGuard: let-data тип буде any. З guard: let-data тип буде T | null, let-loading — boolean."
      staff: "async state structural directive — advanced pattern що замінює boilerplate @if/@else chains. Production considerations: 1) ngTemplateContextGuard — mandatory для type-safe let bindings, без нього DX деградує до any. 2) Multiple template references: окремі ng-template для loading, error, empty states — directive inject через @ContentChild. 3) EmbeddedViewRef caching: замість vcr.clear() + createEmbeddedView на кожну emission — кешувати viewRef і оновлювати context properties для мінімального DOM churn. 4) OnPush compatibility: viewRef.markForCheck() після context update. 5) SSR considerations: в SSR Observable може не emit — directive повинна render loading state або empty state. 6) Error boundary pattern: directive catches errors і рендерить error template замість propagating. Архітектурний вплив: такий pattern замінює трьох-рядковий @if/@else chain скрізь по codebase на один декларативний *withAsync — читабельніше і testable ізольовано."
    commonMistakes:
      - "Забувають ngTemplateContextGuard — let bindings стають any"
      - "Recreate EmbeddedView на кожну emission замість updating context — зайвий DOM churn і lifecycle triggers"
    relatedQuestions: ["b3t2q4", "b3t2q2"]
---

## Core Concept

**English definition:** A structural directive is a class decorated with @Directive that manipulates the DOM structure — it can add, remove, or replace DOM elements — by controlling ViewContainerRef with TemplateRef instances. The asterisk (*) syntax is syntactic sugar that wraps the host element in an ng-template.

**Пояснення:** Structural directive — це директива що "перебудовує" DOM. Вона може додавати елементи (render), видаляти (destroy), або замінювати їх, маніпулюючи ViewContainerRef. На відміну від attribute directive що тільки модифікує існуючий елемент — structural directive контролює само існування DOM вузла.

**Яку проблему вирішує:** Reusable DOM manipulation patterns: permission-based rendering, feature flags, loading/error states, conditional rendering зі складною логікою — все це structural directives дозволяють encapsulate і reuse декларативно.

**Як працює під капотом:** `*myDirective='expr'` — Angular compiler трансформує на: `<ng-template [myDirective]='expr'>`. Directive inject TemplateRef (blueprint для view) і ViewContainerRef (insertion point — comment node в DOM). `vcr.createEmbeddedView(templateRef, context)` — instantiates template, вставляє in DOM після comment node. Context object типізований — let bindings в template отримують значення з context. Кожен embedded view — EmbeddedViewRef з власним lifecycle (markForCheck, detectChanges, destroy).

**Trade-offs та обмеження:** Structural directive — важча абстракція ніж @if/@for. createEmbeddedView — expensive операція: запускає OnInit, OnChanges, checks. Не можна мати два structural directives на одному елементі. Microsyntax — обмежений DSL без довільних ключових слів.

**Версійність:** Structural directives — з Angular 2. ng-template, ng-container — з Angular 2. TemplateRef, ViewContainerRef API — стабільні з Angular 2. Новий @if/@for/@switch (Angular 17+) замінює більшість вбудованих structural directives але custom structural directives залишаються актуальними. DestroyRef для cleanup — Angular 16+. Signal inputs в директивах — Angular 17+.

---

## Deep Details

### Edge Cases

**ng-template і scope:** Змінні визначені поза ng-template доступні всередині (closure). Але let-variables в ng-template — тільки всередині template.

**ViewContainerRef позиція:** `@ViewChild('anchor', { read: ViewContainerRef })` — VCR вставляє views ПІСЛЯ anchor node. Якщо потрібно вставити всередину — inject VCR компонента: `inject(ViewContainerRef)`.

**Context typing:** Якщо ng-template строго типізований `TemplateRef<{ user: User }>` — TypeScript не дозволить createEmbeddedView з невалідним context.

**ngTemplateContextGuard:** Static метод що Angular compiler використовує для type narrowing let bindings — без нього let-x тип це any.

```typescript
static ngTemplateContextGuard<T>(
  dir: WithDataDirective<T>,
  ctx: unknown
): ctx is WithDataContext<T> {
  return true;
}
```

**Two structural directives:** `<div *ngIf="x" *ngFor="let item of items">` — compile error. Fix: ng-container:
```html
<ng-container *ngIf="x">
  <div *ngFor="let item of items">...</div>
</ng-container>
```

### Junior vs Senior Understanding

**Junior** знає: * syntax, ng-template/ng-container різниця, inject TemplateRef + ViewContainerRef.

**Senior** розуміє deep механізм:

1. **EmbeddedViewRef lifecycle:** createEmbeddedView повертає ref — його потрібно зберегти для update context без recreating:
```typescript
let viewRef: EmbeddedViewRef<Ctx> | null = null;
// Update без recreate:
viewRef!.context = newContext;
viewRef!.markForCheck();
```

2. **VCR index management:** vcr.move(view, 0) — переміщує view без destroy/recreate. NgFor використовує це для efficient reordering.

3. **ngTemplateContextGuard для type safety:** Без нього всі let bindings — any. З ним — TypeScript checks.

4. **Microsyntax parsing:** of, let, as, trackBy — reserved microsyntax keywords. Власні ключові слова потребують окремих @Input bindings.

### Deprecation & Migration Path

***ngIf, *ngFor, *ngSwitch** — deprecated для нових проєктів (Angular 17+), але не removed. Замінені на @if/@for/@switch.

**Structural directive loading pattern** замінений на @if/@else chain або custom structural directive залежно від складності.

**Міграція:**
```bash
ng generate @angular/core:control-flow  # *ngIf/*ngFor/*ngSwitch → @if/@for/@switch
```

Custom structural directives — залишаються, не мають прямої заміни.

### Connections to Other Concepts

- **ViewContainerRef і dynamic components (b8):** той самий VCR API використовується для createComponent() — dynamic component rendering.
- **Content Projection (b2t4):** ng-template + @ContentChild дозволяє parent inject custom templates від consumer.
- **Change Detection (b4t1):** Embedded views мають власний CD context — OnPush компонент що contains structural directive може потребувати explicit markForCheck().
- **Portals (CDK):** CDK Portal побудований поверх ViewContainerRef + TemplateRef — той самий API.

---

## Examples

### Basic Usage

```typescript
// simple-if.directive.ts — найпростіша structural directive
import { Directive, input, effect, inject, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appSimpleIf]',
  standalone: true
})
export class SimpleIfDirective<T = unknown> {
  appSimpleIf = input<T | null | undefined>(undefined);

  private templateRef = inject(TemplateRef<{ $implicit: T }>);
  private vcr = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const value = this.appSimpleIf();
      this.vcr.clear();
      if (value) {
        this.vcr.createEmbeddedView(this.templateRef, { $implicit: value });
      }
    });
  }

  // Type guard для let bindings
  static ngTemplateContextGuard<T>(
    dir: SimpleIfDirective<T>,
    ctx: unknown
  ): ctx is { $implicit: T } {
    return true;
  }
}

// Використання: <div *appSimpleIf="user; let u">{{ u.name }}</div>
```

### Production Scenario

```typescript
// with-permission.directive.ts — production permission structural directive
import {
  Directive, input, effect, inject,
  TemplateRef, ViewContainerRef, EmbeddedViewRef
} from '@angular/core';
import { PermissionService } from './permission.service';

interface PermissionContext {
  $implicit: boolean;
  permissions: string[];
}

@Directive({
  selector: '[withPermission]',
  standalone: true
})
export class WithPermissionDirective {
  withPermission = input.required<string | string[]>();
  withPermissionElse = input<TemplateRef<void> | null>(null);

  private permService = inject(PermissionService);
  private tmpl = inject(TemplateRef<PermissionContext>);
  private vcr = inject(ViewContainerRef);

  private viewRef: EmbeddedViewRef<PermissionContext> | null = null;

  constructor() {
    effect(() => {
      const required = this.withPermission();
      const perms = Array.isArray(required) ? required : [required];
      const hasAccess = this.permService.hasPermissions(perms);

      if (hasAccess) {
        if (!this.viewRef) {
          // Create тільки якщо немає — уникаємо recreate
          this.viewRef = this.vcr.createEmbeddedView(this.tmpl, {
            $implicit: true,
            permissions: perms
          });
        }
        // Видалити fallback якщо є
        if (this.vcr.length > 1) this.vcr.remove(1);
      } else {
        // Destroy main view
        this.viewRef?.destroy();
        this.viewRef = null;
        this.vcr.clear();
        // Render else template якщо надано
        const elseTmpl = this.withPermissionElse();
        if (elseTmpl) {
          this.vcr.createEmbeddedView(elseTmpl);
        }
      }
    });
  }

  static ngTemplateContextGuard(
    dir: WithPermissionDirective,
    ctx: unknown
  ): ctx is PermissionContext {
    return true;
  }
}

// Використання:
// <button *withPermission="'edit'; else noAccessTmpl; let hasAccess">
//   Edit (hasAccess: {{ hasAccess }})
// </button>
// <ng-template #noAccessTmpl>
//   <span class="no-access">Недостатньо прав</span>
// </ng-template>
```

### Anti-Example

```typescript
// ❌ Погана structural directive

@Directive({ selector: '[badStructural]' })
export class BadStructuralDirective {
  private tmpl = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);

  @Input() set badStructural(condition: boolean) {
    // ❌ vcr.clear() + createEmbeddedView на кожен change
    // — recreates DOM, triggers full lifecycle кожен раз
    this.vcr.clear();
    if (condition) {
      this.vcr.createEmbeddedView(this.tmpl);
    }
  }
  // ❌ Немає ngTemplateContextGuard — let bindings будуть any
  // ❌ Немає cleanup — якщо service subscriptions — memory leak
  // ❌ @Input замість input() — legacy підхід
}

// ✅ Правильний підхід — кешуємо viewRef, уникаємо recreate
@Directive({ selector: '[goodStructural]', standalone: true })
export class GoodStructuralDirective {
  goodStructural = input<boolean>(false);

  private tmpl = inject(TemplateRef<void>);
  private vcr = inject(ViewContainerRef);
  private viewRef: EmbeddedViewRef<void> | null = null;

  constructor() {
    effect(() => {
      if (this.goodStructural()) {
        if (!this.viewRef) {
          this.viewRef = this.vcr.createEmbeddedView(this.tmpl);
        }
      } else {
        this.viewRef?.destroy();
        this.viewRef = null;
      }
    });
  }
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `vcr.clear()` + `createEmbeddedView()` на кожен input change | Перестворює DOM, triggers повний lifecycle (OnInit, OnDestroy) без потреби | Кешувати EmbeddedViewRef, оновлювати context properties |
| Structural directive для простих boolean умов | Overkill — зайва складність, custom directive важча для розуміння | @if/@else для простих cases |
| TemplateRef без ngTemplateContextGuard | let bindings мають тип any — втрата type safety, IDE не допомагає | Обов'язково реалізувати static ngTemplateContextGuard |
| Два structural directives на одному елементі | Compile error — Angular не підтримує | ng-container для outer directive |
| Structural directive що не cleanup при destroy | EmbeddedViews не видаляються автоматично якщо VCR не destroy | vcr.clear() або viewRef.destroy() в ngOnDestroy / DestroyRef |

---

## Interview Block

### [L1 — Warm-up] Яка різниця між ng-template і ng-container?

**Signal being tested:** Базове розуміння Angular template mechanisms і навіщо вони існують.

**What the interviewer expects:** Чітке пояснення: ng-template — lazy template def (не рендериться), ng-container — transparent wrapper без DOM node.

**How to probe deeper:** "Коли б ти використав ng-container замість div?"

**Reference answer:** ng-template — blueprint для view що не рендериться поки не instantiated програматично або через structural directive. ng-container — прозорий wrapper що не генерує DOM елемент — корисний для structural directives без semantic wrapper: `<ng-container @if='x'>` замість `<div @if='x'>` коли div зайвий в DOM.

**Common mistakes:** Думають ng-template рендериться як hidden елемент. Не знають що ng-container зникає з DOM.

---

### [L2 — Mid] Поясни microsyntax: що насправді відбувається з `*ngFor="let item of items; trackBy: fn"`?

**Signal being tested:** Чи розуміє кандидат що * syntax — це compiler transform і як directive inputs map з microsyntax.

**What the interviewer expects:** Пояснення десугаринга до ng-template форми, як of/let/trackBy map до NgInput.

**How to probe deeper:** "Якщо ти пишеш custom structural directive — як додати власне ключове слово схоже на trackBy в ngFor?"

**Reference answer:** `*ngFor="let item of items; trackBy: fn"` компілюється в `<ng-template ngFor let-item [ngForOf]="items" [ngForTrackBy]="fn">`. Алгоритм: 1) `let item` → `let-item` на ng-template (bind до $implicit). 2) `of items` → `[ngForOf]="items"` (ngFor + "Of" → ngForOf Input). 3) `trackBy: fn` → `[ngForTrackBy]="fn"`. Custom ключові слова: для `trackBy`-like — потрібен @Input з назвою `directiveName + CapitalizedKeyword`.

**Common mistakes:** Думають * просто приховує ng-template — не розуміють compiler transform. Не знають naming convention для microsyntax ключових слів.

---

### [L3 — Senior] Як TemplateRef і ViewContainerRef взаємодіють? Чому важливо кешувати EmbeddedViewRef?

**Signal being tested:** Розуміння view lifecycle і performance implications structural directive implementation choices.

**What the interviewer expects:** Пояснення що createEmbeddedView — expensive (lifecycle triggers), EmbeddedViewRef дозволяє update context без recreate, markForCheck для OnPush.

**How to probe deeper:** "Як NgFor внутрішньо реалізує ефективний reordering при зміні масиву без перестворення DOM?"

**Reference answer:** TemplateRef — blueprint, ViewContainerRef — insertion point (comment node). createEmbeddedView запускає full view lifecycle: OnInit, OnChanges. Для conditional show/hide: якщо recreate кожен раз — зайві lifecycle calls. Правильно: зберегти EmbeddedViewRef, оновити view.context = newCtx + view.markForCheck(). NgFor: IterableDiffer визначає min operations (create/move/remove), vcr.move() переміщує view без destroy.

**Common mistakes:** vcr.clear() + createEmbeddedView на кожен tick — performance anti-pattern. Не знають про vcr.move() для reordering.

---

### [L4 — Staff/Principal] Спроектуй reusable `*withAsync` structural directive що надає (data, loading, error) стан і type-safe let bindings. Які production considerations?

**Signal being tested:** Здатність проектувати складну structural directive з full type safety, performance optimization і production readiness.

**What the interviewer expects:** ngTemplateContextGuard, EmbeddedViewRef caching, OnPush compatibility, SSR considerations, error handling strategy.

**How to probe deeper:** "Як directive веде себе якщо Observable завершується без emission в SSR контексті?"

**Reference answer:** 1) Context interface: `{ $implicit: T | null; loading: boolean; error: unknown }`. 2) TemplateRef<AsyncContext<T>> — typed ref. 3) Static ngTemplateContextGuard — compiler type narrowing для let bindings. 4) EmbeddedViewRef cache — оновлювати context замість recreate на кожну emission. 5) viewRef.markForCheck() — OnPush compatibility. 6) takeUntilDestroyed — cleanup Observable. 7) SSR: в SSR Observable може not emit — render loading state або empty template за замовчуванням. 8) Error handling: catch errors, populate error context, не propagate. 9) Multiple templates: @ContentChild для окремих loading/error/empty templates.

**Common mistakes:** Забувають ngTemplateContextGuard — let types стають any. Не думають про SSR і zoneless compatibility.

---

## Summary

### Key Points

- Structural directive маніпулює DOM structure через TemplateRef (blueprint) + ViewContainerRef (insertion point)
- * syntax — compiler shorthand що трансформує host element в ng-template з директивою як Input binding
- Microsyntax — обмежений DSL: let, of, as, trackBy — reserved keywords, custom keywords через naming convention
- ng-template — lazy view def (не рендериться), ng-container — transparent DOM wrapper без генерації HTML елемента
- ngTemplateContextGuard — static метод для TypeScript type narrowing let bindings — обов'язковий для type-safe directives
- Кешування EmbeddedViewRef критично: update context замість vcr.clear() + recreate уникає зайвих lifecycle triggers
- Custom structural directive виправдана для: permission rendering, feature flags, async state abstraction — не для простих boolean умов

### Elevator Pitch (2 minutes)

Structural directive — це Angular механізм для reusable DOM manipulation: через TemplateRef (blueprint) і ViewContainerRef (insertion point) директива може render, видаляти, або замінювати DOM вузли. * syntax — syntactic sugar що компілятор розгортає в ng-template форму. ng-template — lazy view definition, ng-container — transparent wrapper для structural directives без DOM pollution. Для production-ready directive: кешуй EmbeddedViewRef щоб уникнути зайвих lifecycle triggers, реалізуй ngTemplateContextGuard для type-safe let bindings, використовуй takeUntilDestroyed або DestroyRef для cleanup. Custom structural directives виправдані для cross-cutting concerns (permissions, feature flags, async state) — для простих умов використовуй @if.
