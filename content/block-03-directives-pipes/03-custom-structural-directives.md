---
title: "Custom Structural Directives"
block: 3
topic: 3
slug: "custom-structural-directives"
difficulty: 4
sinceVersion: "2"
tags: ["TemplateRef", "ViewContainerRef", "createEmbeddedView", "structural-directive", "microsyntax"]
relatedTopics: ["structural-directives", "attribute-directives", "change-detection", "deferrable-views"]
interviewQuestions:
  - level: "junior"
    question: "Що таке структурна директива і як Angular обробляє символ * перед директивою?"
    referenceAnswers:
      junior: "Структурна директива змінює структуру DOM — додає або видаляє елементи. Символ * — syntactic sugar, Angular автоматично огортає елемент у <ng-template>."
      mid: "Символ * — microsyntax desugaring. `*ngIf='condition'` перетворюється на `<ng-template [ngIf]='condition'><div></div></ng-template>`. Angular compiler перетворює це під час компіляції. Директива отримує TemplateRef (шаблон) та ViewContainerRef (місце вставки). Контент не рендериться поки директива не викличе createEmbeddedView()."
      senior: "Microsyntax desugaring детально: `*appIf='condition; else elseRef'` → `<ng-template [appIf]='condition' [appIfElse]='elseRef'>`. Правило: `let-var='expr'` → `[ngForOf]='items' let-item` — binding на директиву та local template variable. Angular compiler (в Ivy) трансформує це у template instruction. TemplateRef<C> — typed на context об'єкт C. ViewContainerRef — portal для embedded views. createEmbeddedView(templateRef, context) → EmbeddedViewRef. Директива контролює lifecycle: create, destroy, move views. EmbeddedViewRef має detectChanges() — manual CD для performance."
      staff: "Structural directives — template-level control flow primitives. Під капотом в Ivy: директива отримує TemplateRef<C> через DI (Angular compiler автоматично надає). Template → LView (logical view) з TView (template definition, shared). createEmbeddedView() → новий LView підключений до host ViewContainerRef. VCR — по суті array of views + host LView. Views впорядковані — move() можливий без DOM recreation. Ivy's built-in @if/@for/@ switch — власне не директиви, а compiler instructions (ɵɵconditional, ɵɵrepeater) — значно ефективніші ніж directive-based ngIf/ngFor. Custom structural directives залишаються через TemplateRef/VCR API — без змін в Ivy, але не мають той самий compiler-level optimization. Для максимальної performance: новий control flow (@if/@for) для стандартних use cases, custom structural directives тільки для унікальної логіки."
    commonMistakes:
      - "Думають що * — просто синтаксис, не розуміють що Angular створює окремий ng-template"
      - "Не знають що TemplateRef типізований через generic C (context type)"
    relatedQuestions: ["b3t3q2", "b3t3q3"]
  - level: "mid"
    question: "Як реалізувати власну структурну директиву з context об'єктом і типізацією?"
    referenceAnswers:
      junior: "Директива inject ViewContainerRef і TemplateRef. Викликає createEmbeddedView для відображення шаблону або clear для приховування."
      mid: "Структурна директива: `@Directive({ selector: '[appRepeat]' })`. Inject TemplateRef<RepeatContext> та ViewContainerRef. Input setter: clear VCR, цикл createEmbeddedView з context { $implicit: item, index: i }. Context interface: `interface RepeatContext { $implicit: T; index: number }`. Template: `*appRepeat='items; let item; let i=index'`. $implicit — значення для `let item` без explicit binding."
      senior: "Повна реалізація з типізацією: Context interface визначає what's available у template. `$implicit` — primary value для `let x` (без `=` binding). Інші properties доступні через `let v=propertyName`. Generic директива: `TemplateRef<RepeatContext<T>>` — але TypeScript не може вивести T через selector bindings. Workaround: ngTemplateContextGuard static method. `static ngTemplateContextGuard<T>(dir: AppRepeatDirective<T>, ctx: unknown): ctx is RepeatContext<T> { return true; }` — TypeScript type narrowing у template. Це critical для type-safe templates. Без ngTemplateContextGuard — template variables будуть `unknown` type. EmbeddedViewRef lifecycle: директива відповідає за destroy всіх views (ngOnDestroy). Якщо VCR destroyed — Angular auto-destroys child views, але explicit cleanup — best practice."
      staff: "Custom structural directives з embedded view context — critical для reusable template patterns. Design considerations: 1) Context typing: ngTemplateContextGuard + generic на директиві — template type safety. 2) Performance: чи варто recreate views при input change чи тільки update context? Update context: embedded view has injected context object — mutate it, then markForCheck() або detectChanges() на EmbeddedViewRef. Recreate: simple але O(n) DOM operations. 3) Track by: якщо директива рендерить list — identity tracking для DOM reuse (як trackBy в ngFor). Map<T, EmbeddedViewRef> для existing views. 4) Virtual DOM consideration: для великих lists — VCR.createEmbeddedView тільки для visible range. CDK VirtualScroll — готова реалізація. 5) ChangeDetectionStrategy interaction: EmbeddedViewRef.detectChanges() — manual CD для embedded view. Корисно для rendering outside Angular CD. 6) Structural directive як public API: ngTemplateContextGuard + typed context = IntelliSense у templates consumers. Поганий DX без цього."
    commonMistakes:
      - "Не реалізують ngTemplateContextGuard — template variables мають тип unknown, немає type safety"
      - "Не cleanup views в ngOnDestroy — memory leak якщо VCR не destroyed автоматично"
    relatedQuestions: ["b3t3q1", "b3t3q3"]
  - level: "senior"
    question: "Як працює microsyntax desugaring і як написати директиву з custom microsyntax?"
    referenceAnswers:
      junior: "Microsyntax — це спрощений синтаксис з символом *. Angular перетворює його у ng-template."
      mid: "Microsyntax rules: `*directive='expr1; let v=expr2; alias: expr3'`. Частина до першої ; прив'язується до selector attribute. let bindings → template variables. named bindings (alias:) → inputs із суфіксом директиви. Наприклад: `*ngFor='let item of items; trackBy: fn'` → `[ngForOf]='items' [ngForTrackBy]='fn'`."
      senior: "Microsyntax desugaring rules детально: `*myDir='expr1 let v = ctx; when: condExpr'`. 1) `expr1` → `[myDir]='expr1'` input. 2) `let v = ctx` → `let-v='ctx'` на ng-template. 3) `when: condExpr` → `[myDirWhen]='condExpr'` — named binding, camelCase. Ключове правило: named key `key:` → input name = directiveName + key.charAt(0).toUpperCase() + key.slice(1). Так `ngFor` + `of` → `[ngForOf]`. Так само `ngFor` + `trackBy` → `[ngForTrackBy]`. Custom приклад: `*appRange='5; let n; step: 2'` → `<ng-template [appRange]='5' [appRangeStep]='2' let-n>`. Директива: selector `[appRange]`, inputs: `appRange` (primary), `appRangeStep`. $implicit context value → `let n` без explicit binding. Alias input: `alias: 'value'` у @Input() → microsyntax можна використовувати shorter name. TypeScript compiler plugin для template type checking перевіряє відповідність context type через ngTemplateContextGuard."
      staff: "Microsyntax — template DSL для structural directives. Глибокий рівень: Angular template compiler (Ivy) парсить microsyntax у TemplateAttributeBinding array. Кожен binding → host directive input або template let binding. Compilation: compiler.ts, template_parser перетворює `*dir='...'` → `ng-template` з bindings. Runtime: template JIT/AOT compiled до LView instructions. Microsyntax design considerations для public API: 1) Іменування inputs: `directiveName` + PascalCase(alias). Namespace collision: якщо директива `appTable` і alias `of` — input стає `appTableOf`. Може конфліктувати з іншими directives на ті ж element. 2) Backwards compatibility: зміна microsyntax alias = breaking change для consumers. 3) Documentation: microsyntax не очевидна — документуй supported bindings. 4) IDE support: Angular Language Service розуміє microsyntax — type-safe completion. ngTemplateContextGuard потрібен для цього. 5) Alternative: структурна директива може не мати microsyntax — пряме template binding: `<ng-template [appDir]='...' let-x='ctx'>`. Microsyntax — тільки для ergonomics. Проблема custom microsyntax: Angular Language Service (LSP) не завжди коректно обробляє custom microsyntax — можливі false type errors."
    commonMistakes:
      - "Не знають правило іменування inputs для named microsyntax bindings (directiveName + PascalCase alias)"
      - "Забувають що $implicit — спеціальна назва для default let binding без explicit name"
    relatedQuestions: ["b3t3q2", "b3t3q4"]
  - level: "senior"
    question: "Чим відрізняється TemplateRef від TemplatePortal і коли використовувати кожен?"
    referenceAnswers:
      junior: "TemplateRef — посилання на шаблон у Angular. TemplatePortal — це з Angular CDK для рендерингу контенту в інше місце у DOM."
      mid: "TemplateRef — Angular core primitive для embedded views. Рендеримо в поточному ViewContainerRef. TemplatePortal (CDK) — для рендерингу в довільне місце у DOM (overlay, body). CDK Portal: DomPortalOutlet + TemplatePortal.attach() → template рендериться в target DOM node поза Angular component tree."
      senior: "TemplateRef vs TemplatePortal — різні use cases: TemplateRef + ViewContainerRef: template рендериться в місці VCR у component tree. Views — дочірні до host view, Change Detection propagates. Destroy host — destroy embedded views. TemplatePortal (CDK): декомпозиція місця declaration від місця rendering. Template оголошений в компоненті A, рендериться у Portal Outlet B (може бути в іншому NgModule/component tree). Dependency injection: TemplatePortal зберігає injector контексту де template declared — не де rendered. Це critical: template використовує сервіси з declaration component, не destination. OverlayRef використовує PortalOutlet — modals, dropdowns рендеряться в `<body>` через CDK Overlay, але injector — з opening component. ComponentPortal — для компонентів (не templates). DomPortalOutlet — для рендерингу в DOM node без Angular view tree. Зміни детектуються вручну або через PortalOutlet.attach()'s returned view."
      staff: "TemplateRef і CDK Portals — різні abstraction layers. Архітектурні рішення: 1) Якщо template завжди у тій самій позиції у DOM що і declaration — TemplateRef достатньо (custom structural directives). 2) Якщо template має рендеритись в overlay, portal, tooltip, modal — CDK Portal. 3) DI boundary: TemplatePortal preserves injector chain від declaration point — не від outlet. Practical impact: якщо компонент де template declared має стан (form service, user context) — template в portal бачить цей стан коректно. 4) Change Detection: embedded view via VCR.createEmbeddedView → приєднаний до host CD tree. Portal view через PortalOutlet → може бути detached від CD tree. Потребує manual markForCheck() або ChangeDetectorRef.detectChanges(). 5) Memory management: Portal.detach() → EmbeddedViewRef.detach() від CD tree але DOM залишається. Portal.dispose() або PortalOutlet.dispose() → destroy і DOM removal. 6) Vs @defer: @defer дозволяє lazy-load template content; portals про де рендерити. Комбінація: @defer + portal outlet для lazy-loaded modals."
    commonMistakes:
      - "Використовують DomPortalOutlet для Angular-template content — втрачають Change Detection і DI"
      - "Не dispose Portal після закриття modal — memory leak, EmbeddedView залишається в memory"
    relatedQuestions: ["b3t3q3", "b3t3q5"]
  - level: "staff"
    question: "Як Angular новий control flow (@if/@for/@switch) відрізняється від *ngIf/*ngFor і які наслідки для custom structural directives?"
    referenceAnswers:
      junior: "Новий control flow (@if, @for, @switch) — це вбудований синтаксис у Angular 17, синтаксично схожий на JavaScript."
      mid: "@if/@for/@switch — compiler-level синтаксис, не директиви. Не потребують imports (на відміну від NgIf, NgFor). @for обов'язково має track expression — кращий default ніж ngFor що не вимагало trackBy. Значно краща type inference у шаблонах."
      senior: "Built-in control flow vs structural directives: 1) Compiler instructions: @if/@for/@switch компілюються у Ivy instructions (ɵɵconditional, ɵɵrepeater) — не directive class, не DI, не lifecycle hooks. 2) Performance: ɵɵrepeater має оптимізований reconciliation algorithm — moved items tracked без DOM recreation. ngFor з trackBy — добре але ɵɵrepeater кращий. 3) @for обов'язковий track — eliminates 'ngFor without trackBy' antipattern. `@for (item of items; track item.id)`. 4) Standalone: не потребує NgFor/NgIf imports — зменшує bundle. 5) Type inference: @if (value) { } — value narrowed після check (value !== null/undefined). *ngIf не має такого narrowing у template. 6) Custom structural directives: API не змінюється. TemplateRef + VCR — і далі єдиний шлях для custom logic. Але доцільність custom structural directives зменшилась — багато use cases покривається built-in flow. Wrappers над ngIf з context (appIfRole, appIfFeatureFlag) — ще актуальні."
      staff: "Новий control flow — paradigm shift для Angular templates. Архітектурний вплив на custom structural directives: 1) Migration path: ngIf → @if, ngFor → @for, ngSwitch → @switch. `ng generate @angular/core:control-flow` — automated migration. Але custom structural directives (appPermission, appFeatureFlag, appRepeat) — не мігруються автоматично. 2) Performance delta: ɵɵrepeater vs ViewContainerRef.createEmbeddedView array — ɵɵrepeater використовує block-based reconciliation. Для list directives з > 100 items — значна різниця. 3) Composition: `@if (hasPermission()) { <user-list> }` vs `*appPermission='ROLE_ADMIN'` — built-in flow composable, directive більш declarative. Choice: якщо permission logic complex (async, injected PermissionService) — directive. Якщо simple signal — built-in flow. 4) Defer integration: `@defer` — теж compiler-level, не directive. @defer + @placeholder + @loading = pattern що неможливо реплікувати custom structural directive без bundle splitting. 5) Future: Angular team вказує що TemplateRef/VCR API залишається stable. Custom structural directives — valid для власної логіки контролю видимості, permissioning, feature flags, experimental UI patterns. Built-in flow для стандартних use cases. 6) DX comparison: `*appIf='items?.data; let data'` vs `@if (items$ | async; as data) { }` — async pipe залишається valid з @if через template local variable. Signal alternative: `@if (items()) { }` — ще cleaner."
    commonMistakes:
      - "Думають що @if/@for замінюють custom structural directives повністю — ні, тільки стандартні use cases"
      - "Не знають що ɵɵrepeater (new @for) має кращий performance ніж ViewContainerRef-based ngFor"
    relatedQuestions: ["b3t3q4", "b3t3q1"]
---

## Core Concept

**English definition:** A custom structural directive is an Angular directive that manipulates the DOM structure by receiving a `TemplateRef<C>` (a reference to an `<ng-template>`) and a `ViewContainerRef` (the anchor point in the view tree), then imperatively calling `createEmbeddedView()`, `clear()`, or `move()` to control what renders and when. The `*` prefix syntax is a compiler-level desugaring into an `<ng-template>` binding.

**Пояснення:** Структурні директиви — це Angular primitives для imperative control flow у шаблонах. Де декларативний @if/@for покриває 90% випадків, structural directives потрібні коли логіка show/hide/repeat залежить від injected сервісів (PermissionService, FeatureFlagService), асинхронних операцій, або кастомних rendering patterns. Директива отримує TemplateRef — "заморожений" шаблон — і ViewContainerRef — "дірку" в DOM куди можна вставляти views. Виклик createEmbeddedView() = матеріалізація шаблону у живий DOM.

**Яку проблему вирішує:** Типові use cases: `*appHasPermission="'ADMIN'"` — shows content only for admins. `*appFeatureFlag="'new-checkout'"` — feature toggle. `*appLet="observable$ | async as value"` — template variable assignment. `*appRepeat="5; let i"` — render N times. Ці patterns потребують injected services або context objects — неможливо виразити з @if без wrapper компонентів.

**Як працює під капотом:**

Microsyntax desugaring (compile-time):
```
*appIf="condition; else elseTemplate"
           ↓ Angular compiler
<ng-template [appIf]="condition" [appIfElse]="elseTemplate">
  <div>...</div>
</ng-template>
```

Runtime виконання:
```
Directive constructor:
  TemplateRef<C>    ← Angular DI надає посилання на ng-template
  ViewContainerRef  ← Angular DI надає anchor point у view tree

createEmbeddedView(templateRef, context):
  → Creates LView (logical view) from TView (template definition)
  → Appends LView to ViewContainerRef._lContainer
  → DOM nodes inserted at anchor position
  → EmbeddedViewRef returned (for lifecycle control)

VCR.clear():
  → Destroys all embedded views in container
  → DOM nodes removed
  → EmbeddedViewRef.destroy() called on each
```

Ivy internal representation:
- `TView` — shared template structure (created once per template type)
- `LView` — per-instance view data (created per `createEmbeddedView()` call)
- ViewContainerRef wraps `LContainer` — array tracking child LViews

**Trade-offs та обмеження:**

- Angular 17+ built-in @if/@for compile до ɵɵconditional/ɵɵrepeater — більш оптимальні ніж custom TemplateRef/VCR based directives для стандартних patterns
- Custom microsyntax не завжди коректно підхоплюється Angular Language Service — можливі false type errors у IDE
- ngTemplateContextGuard обов'язковий для type safety — без нього template variables мають `unknown` type
- ViewContainerRef.createEmbeddedView без cleanup = memory leak — explicit ngOnDestroy потрібен

**Версійність:** Structural directives available з Angular 2. Ivy (v9+): TemplateRef/VCR API unchanged, але internal representation змінилась (LView/TView замість View Engine). Angular 17: новий built-in control flow (@if/@for/@switch) — compiler instructions, не директиви. ngFor/ngIf/ngSwitch — deprecated in favor of built-in control flow але ще підтримуються. Angular v18+: `ng generate @angular/core:control-flow` для automated migration. Custom structural directives API — стабільний без deprecation.

## Deep Details

### Edge Cases

**EmbeddedView і Change Detection:** `createEmbeddedView()` повертає `EmbeddedViewRef`. За замовчуванням view приєднаний до host CD tree. `EmbeddedViewRef.detach()` — відключає від CD tree (manual mode). `EmbeddedViewRef.detectChanges()` — manual CD для detached view. `EmbeddedViewRef.markForCheck()` — re-attaches до CD schedule для наступного cycle. Використовується для rendering outside Zone.js.

**Context mutability:** Context об'єкт передається by reference. `createEmbeddedView(tRef, contextObj)`. Мутування `contextObj` properties → template бачить зміни (але CD може не спрацювати). Кращий підхід: `embeddedView.context.property = newValue; embeddedView.markForCheck()`.

**Multiple views та ordering:** VCR підтримує multiple views. `createEmbeddedView()` додає в кінець. `VCR.insert(viewRef, index)` — insert at position. `VCR.move(viewRef, newIndex)` — move without DOM recreation. Корисно для sortable lists без destroy/recreate.

**Structural directive на `<ng-template>`:** Якщо `*appDir` на `<ng-template>` — template рендериться в template. Nested ng-template. Compiler обгортає у ще один ng-template. `<ng-template *appIf="show"><div>inner</div></ng-template>` → два рівні ng-template.

**Microsyntax vs property binding:** `[appDir]="expr"` — property binding, не microsyntax. Structural selector `[appDir]` працює як attribute directive. Щоб активувати структурну поведінку — або `*appDir` syntax або ручне `<ng-template [appDir]="...">`.

### Junior vs Senior Understanding

**Junior** знає: як зробити ngIf-like директиву, inject TemplateRef і VCR, викликати createEmbeddedView та clear.

**Senior** розуміє:

1. **Microsyntax desugaring rules:** directiveSelector + PascalCase(alias) = input name. `*ngFor="let item of items; trackBy: fn"` → inputs `ngForOf`, `ngForTrackBy`. Custom: `*appRange="5; step: 2"` → inputs `appRange`, `appRangeStep`.

2. **ngTemplateContextGuard pattern:**
```typescript
static ngTemplateContextGuard<T>(
  dir: AppRepeatDirective<T>,
  ctx: unknown
): ctx is RepeatContext<T> {
  return true;
}
```
Це TypeScript type predicate що дозволяє Angular Language Service і `tsc --strict` перевіряти types у template expressions. Без нього `let item` у template = `unknown`.

3. **EmbeddedViewRef lifecycle:** view.destroy(), view.detach(), view.detectChanges(), view.markForCheck() — різні methods для різних scenarios.

4. **Performance trade-offs:** recreate vs update context. List directives потребують identity tracking.

5. **Built-in control flow vs custom:** коли що переважає.

### Deprecation & Migration Path

- **NgIf, NgFor, NgSwitch:** deprecated on standalone components в favor of built-in control flow (@if, @for, @switch). В NgModule-based apps — ще підтримуються. Migration: `ng generate @angular/core:control-flow`.
- **ngForOf/ngForTrackBy inputs:** якщо є custom wrapper над NgFor — потрібна migration на @for або custom directive.
- **TemplateRef/ViewContainerRef API:** стабільний, не deprecated. Custom structural directives — valid long-term.
- **withDeferredLoading pattern:** раніше використовували custom structural directive для lazy-loading + conditional render. Тепер `@defer` робить це на compiler level з true bundle splitting.

### Connections to Other Concepts

- **Change Detection:** embedded views приєднані до host CD tree — OnPush host + embedded view = nested CD behavior
- **Deferrable Views (@defer):** @defer — compiler-level structural feature, вдохновлена structural directives
- **TemplatePortal (CDK):** альтернатива для рендерингу в інші DOM locations
- **ViewRef lifecycle:** createEmbeddedView, detach, destroy — частина Angular view hierarchy API
- **Dependency Injection:** structural directive може inject services для permission checks — саме це і відрізняє їх від built-in control flow

## Examples

### Basic Usage

```typescript
// Простий appLet — template variable assignment
interface LetContext<T> {
  $implicit: T;
  appLet: T;
}

@Directive({
  standalone: true,
  selector: '[appLet]',
})
export class LetDirective<T> implements OnInit {
  private templateRef = inject(TemplateRef<LetContext<T>>);
  private vcr = inject(ViewContainerRef);

  @Input({ required: true }) appLet!: T;

  private view?: EmbeddedViewRef<LetContext<T>>;

  ngOnInit(): void {
    this.view = this.vcr.createEmbeddedView(this.templateRef, {
      $implicit: this.appLet,
      appLet: this.appLet,
    });
  }

  ngOnChanges(): void {
    if (this.view) {
      this.view.context.$implicit = this.appLet;
      this.view.context.appLet = this.appLet;
      this.view.markForCheck();
    }
  }

  // Type safety для template variables
  static ngTemplateContextGuard<T>(
    dir: LetDirective<T>,
    ctx: unknown
  ): ctx is LetContext<T> {
    return true;
  }
}

// Usage: *appLet з async pipe
// <div *appLet="user$ | async as user">
//   {{ user.name }}  ← user is T (not T | null)
// </div>
```

```typescript
// appRepeat — render N times
interface RepeatContext {
  $implicit: number;  // current index (0-based)
  count: number;      // total count
}

@Directive({
  standalone: true,
  selector: '[appRepeat]',
})
export class RepeatDirective implements OnChanges, OnDestroy {
  private templateRef = inject(TemplateRef<RepeatContext>);
  private vcr = inject(ViewContainerRef);

  @Input({ required: true }) appRepeat!: number;

  ngOnChanges(): void {
    this.vcr.clear();
    for (let i = 0; i < this.appRepeat; i++) {
      this.vcr.createEmbeddedView(this.templateRef, {
        $implicit: i,
        count: this.appRepeat,
      });
    }
  }

  ngOnDestroy(): void {
    this.vcr.clear();
  }

  static ngTemplateContextGuard(
    dir: RepeatDirective,
    ctx: unknown
  ): ctx is RepeatContext {
    return true;
  }
}

// Usage: *appRepeat="5; let i"
// <div *appRepeat="5; let i">Item {{ i + 1 }}</div>
```

### Production Scenario

```typescript
// appHasPermission — permission-based rendering
interface PermissionContext {
  $implicit: boolean;
}

@Directive({
  standalone: true,
  selector: '[appHasPermission]',
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private templateRef = inject(TemplateRef<PermissionContext>);
  private vcr = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);
  private destroyRef = inject(DestroyRef);

  @Input({ required: true }) appHasPermission!: string | string[];
  @Input() appHasPermissionElse?: TemplateRef<void>;

  private currentView: EmbeddedViewRef<PermissionContext> | null = null;
  private hasPermission = false;

  ngOnInit(): void {
    const permissions = Array.isArray(this.appHasPermission)
      ? this.appHasPermission
      : [this.appHasPermission];

    // React to permission changes (e.g., role upgrade during session)
    this.permissionService
      .hasPermissions(permissions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(hasPermission => {
        this.updateView(hasPermission);
      });
  }

  private updateView(hasPermission: boolean): void {
    if (hasPermission === this.hasPermission) return; // No change
    this.hasPermission = hasPermission;

    this.vcr.clear();
    this.currentView = null;

    if (hasPermission) {
      this.currentView = this.vcr.createEmbeddedView(this.templateRef, {
        $implicit: true,
      });
    } else if (this.appHasPermissionElse) {
      this.vcr.createEmbeddedView(this.appHasPermissionElse);
    }
  }

  ngOnDestroy(): void {
    this.vcr.clear();
  }

  static ngTemplateContextGuard(
    dir: HasPermissionDirective,
    ctx: unknown
  ): ctx is PermissionContext {
    return true;
  }
}

// app.component.html
// <div *appHasPermission="'ADMIN'; else noAccess">
//   <admin-panel />
// </div>
// <ng-template #noAccess>
//   <access-denied />
// </ng-template>
```

```typescript
// appFeatureFlag — A/B testing і feature toggles з lazy loading
@Directive({
  standalone: true,
  selector: '[appFeatureFlag]',
})
export class FeatureFlagDirective implements OnInit {
  private templateRef = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  private featureFlags = inject(FeatureFlagService);

  @Input({ required: true }) appFeatureFlag!: string;
  @Input() appFeatureFlagElse?: TemplateRef<void>;

  ngOnInit(): void {
    const isEnabled = this.featureFlags.isEnabled(this.appFeatureFlag);

    this.vcr.clear();

    if (isEnabled) {
      this.vcr.createEmbeddedView(this.templateRef);
    } else if (this.appFeatureFlagElse) {
      this.vcr.createEmbeddedView(this.appFeatureFlagElse);
    }
  }
}

// Usage:
// *appFeatureFlag="'new-checkout'; else oldCheckout"
```

### Anti-Example

```typescript
// WRONG: Немає ngTemplateContextGuard — template variables мають тип unknown
@Directive({ selector: '[appWrong]' })
export class WrongDirective<T> {
  // WRONG: no ngTemplateContextGuard
  // Context: { $implicit: T } але TypeScript не знає про це
  vcr = inject(ViewContainerRef);
  tRef = inject(TemplateRef);

  @Input() appWrong!: T[];

  render() {
    this.appWrong.forEach(item => {
      // item в template буде `unknown` — no type checking
      this.vcr.createEmbeddedView(this.tRef, { $implicit: item });
    });
  }
}

// CORRECT: з ngTemplateContextGuard
@Directive({ selector: '[appCorrect]' })
export class CorrectDirective<T> {
  vcr = inject(ViewContainerRef);
  tRef = inject(TemplateRef<{ $implicit: T }>);

  @Input() appCorrect!: T[];

  render() {
    this.appCorrect.forEach(item => {
      this.vcr.createEmbeddedView(this.tRef, { $implicit: item });
    });
  }

  // CORRECT: type guard для template variables
  static ngTemplateContextGuard<T>(
    dir: CorrectDirective<T>,
    ctx: unknown
  ): ctx is { $implicit: T } {
    return true;
  }
}

// WRONG: Не очищають views в ngOnDestroy
@Directive({ selector: '[appLeak]' })
export class LeakyDirective {
  vcr = inject(ViewContainerRef);
  tRef = inject(TemplateRef);

  @Input() set appLeak(show: boolean) {
    if (show) {
      this.vcr.createEmbeddedView(this.tRef);
      // WRONG: якщо цей setter викликається кілька разів — multiple views
      // і немає cleanup в ngOnDestroy — memory leak
    }
  }
  // WRONG: немає ngOnDestroy з vcr.clear()
}

// CORRECT:
@Directive({ selector: '[appClean]' })
export class CleanDirective implements OnDestroy {
  vcr = inject(ViewContainerRef);
  tRef = inject(TemplateRef);
  private currentView: EmbeddedViewRef<unknown> | null = null;

  @Input() set appClean(show: boolean) {
    this.currentView?.destroy();
    this.currentView = null;

    if (show) {
      this.currentView = this.vcr.createEmbeddedView(this.tRef);
    }
  }

  ngOnDestroy(): void {
    this.currentView?.destroy();
    this.vcr.clear();
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Відсутній `ngTemplateContextGuard` | Template variables мають тип `unknown` — немає type safety, помилки runtime замість compile-time | Завжди додавай `static ngTemplateContextGuard<T>(...): ctx is ContextType<T>` |
| Немає cleanup в `ngOnDestroy` | Кожен createEmbeddedView без destroy = memory leak — EmbeddedViewRef залишається в пам'яті | `vcr.clear()` або `embeddedViewRef.destroy()` в `ngOnDestroy` |
| Recreate views на кожен input change | O(n) DOM operations при кожній зміні — performance degradation для lists | Оновлювати `embeddedView.context` і `markForCheck()` замість recreate |
| Структурна директива для стандартного if/for | Зайва складність коли @if/@for достатньо — maintenance overhead | Використовуй built-in control flow (@if/@for) для стандартних patterns |
| Microsyntax без документації | API незрозуміла для споживачів — "що означає ця крапка з комою?" | Документуй всі microsyntax bindings і context properties, надавай type definitions |

## Interview Block

### [L1 — Warm-up] Що таке структурна директива і як Angular обробляє символ * перед директивою?

**Signal being tested:** Розуміння Angular template compilation pipeline і ролі ng-template як compiler abstraction.

**What the interviewer expects:** * = desugaring до ng-template, TemplateRef і ViewContainerRef як механізм, createEmbeddedView як rendering trigger.

**How to probe deeper:** "Покажіть як виглядає `*ngIf='condition'` після десугарингу компілятора."

**Reference answer:** * — compiler-level syntactic sugar. `*appDir='expr'` → `<ng-template [appDir]='expr'>content</ng-template>`. Директива отримує TemplateRef (посилання на template) і ViewContainerRef (місце вставки у DOM). Виклик createEmbeddedView() матеріалізує шаблон у DOM. clear() видаляє всі views. Цей механізм дозволяє повністю контролювати DOM структуру з бізнес-логікою.

**Common mistakes:** Думають що * — це лише візуальний shorthand без семантичного значення; не знають про TemplateRef та ViewContainerRef.

### [L2 — Mid] Як реалізувати власну структурну директиву з context об'єктом і типізацією?

**Signal being tested:** Практична здатність реалізувати structural directive з type-safe context і правильним lifecycle.

**What the interviewer expects:** TemplateRef<ContextType>, VCR.createEmbeddedView з context, ngTemplateContextGuard для type safety, ngOnDestroy cleanup.

**How to probe deeper:** "Що таке `$implicit` у context об'єкті і навіщо ngTemplateContextGuard?"

**Reference answer:** Interface для context визначає що доступно в template. `$implicit` — значення для `let x` без `=`. Інші properties: `let v=propertyName`. ngTemplateContextGuard — static TypeScript predicate що дозволяє Angular Language Service type-check template variables. Без нього — `unknown`. EmbeddedViewRef.context можна мутувати для оновлення без recreate — ефективніше ніж clear()+createEmbeddedView().

**Common mistakes:** Відсутній ngTemplateContextGuard; не cleanup views в ngOnDestroy; recreate views замість context update.

### [L3 — Senior] Як працює microsyntax desugaring і як написати директиву з custom microsyntax?

**Signal being tested:** Глибоке розуміння Angular compiler transformation rules для microsyntax syntax.

**What the interviewer expects:** Правило іменування inputs (directiveName + PascalCase(alias)), $implicit для default let, named bindings з двокрапкою.

**How to probe deeper:** "`*ngFor='let item of items; trackBy: trackFn'` — які inputs отримує NgFor директива? Як це відповідає правилу іменування?"

**Reference answer:** Microsyntax rules: `*dir='expr; let v = ctx; key: expr2'`. Primary expr → `[dir]='expr'`. `let v = ctx` → `let-v='ctx'` на ng-template. Named key: → input `dirKey` (directiveName + PascalCase(key)). Приклад: ngFor + of → ngForOf, ngFor + trackBy → ngForTrackBy. Custom: `*appRange='5; step: 2'` → inputs `appRange=5`, `appRangeStep=2`. $implicit → default для `let x` без explicit `= propertyName`.

**Common mistakes:** Не знають naming convention; забувають про $implicit; не документують custom microsyntax API.

### [L4 — Staff/Principal] Як Angular новий control flow (@if/@for/@switch) відрізняється від *ngIf/*ngFor і які наслідки для custom structural directives?

**Signal being tested:** System-level розуміння Angular compiler architecture і стратегічне мислення про місце custom structural directives в сучасному Angular.

**What the interviewer expects:** @if/@for = compiler instructions (ɵɵconditional/ɵɵrepeater), performance benefits, обов'язковий track, type narrowing, custom directives — valid для business logic (permissions, feature flags), але не для стандартного if/for.

**How to probe deeper:** "Чому ɵɵrepeater ефективніший за ViewContainerRef-based ngFor? І коли custom structural directive все ще виправдана?"

**Reference answer:** @if/@for/@switch компілюються у Ivy VM instructions (ɵɵconditional, ɵɵrepeater) — не directive class, немає DI overhead. ɵɵrepeater має block-based reconciliation — ефективніший ніж VCR array. @for обов'язковий track — eliminates trackBy antipattern. Type narrowing: `@if (value)` → value is non-null/undefined in block. Custom structural directives — valid для business logic: `*appHasPermission`, `*appFeatureFlag`, `*appLet`. Не замінюються built-in flow бо потребують injected services і complex async logic.

**Common mistakes:** Думають що built-in flow повністю замінює custom directives; не знають про ngTemplateContextGuard для type safety в custom directives.

---

## Summary

### Key Points
- `*` prefix — compiler desugaring до `<ng-template>` + directive property binding
- TemplateRef<C> — typed reference до frozen template, ViewContainerRef — anchor у view tree
- `createEmbeddedView(tRef, context)` → EmbeddedViewRef<C>, підключений до host CD tree
- `ngTemplateContextGuard` — обов'язковий для type-safe template variables (без нього = `unknown`)
- Microsyntax naming rule: directiveSelector + PascalCase(alias) = input name; `$implicit` = default `let` binding
- Built-in @if/@for (Angular 17+) = compiler instructions, ефективніші за TemplateRef/VCR для стандартних patterns
- Custom structural directives — valid для permission checks, feature flags, appLet-like patterns де потрібний injected service або context logic

### Elevator Pitch (2 minutes)
Structural directives контролюють DOM структуру через TemplateRef + ViewContainerRef. `*` — compiler syntactic sugar: `*appDir='expr'` → `<ng-template [appDir]='expr'>`. Директива inject TemplateRef (frozen template) і ViewContainerRef (insertion anchor), викликає `createEmbeddedView(tRef, context)` щоб матеріалізувати HTML. Context typing: `ngTemplateContextGuard` static method — дозволяє Angular Language Service type-check template variables. Без нього `let item` = `unknown`. Microsyntax desugaring: `*appDir='5; step: 2'` → inputs `appDir=5`, `appRangeStep=2` — правило: directiveName + PascalCase(alias). Angular 17+ built-in @if/@for = compiler instructions (ɵɵconditional/ɵɵrepeater) — ефективніші і з type narrowing. Custom structural directives залишаються для бізнес-логіки: permission guards, feature flags, template variable assignment — де потрібен injected service.
