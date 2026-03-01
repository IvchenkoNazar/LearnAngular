---
title: "Resolution Modifiers: @Optional, @Self, @SkipSelf, @Host"
block: 5
topic: 5
slug: "resolution-modifiers"
difficulty: 4
sinceVersion: "2"
tags: ["Optional", "Self", "SkipSelf", "Host", "resolution-modifiers", "DI-hierarchy", "inject-options"]
relatedTopics: ["di-internals", "provider-types", "inject-function", "injection-tokens", "content-projection"]
interviewQuestions:
  - level: "junior"
    question: "Що таке @Optional в Angular DI і коли його використовувати?"
    referenceAnswers:
      junior: "@Optional дозволяє inject сервіс який може бути не зареєстрований. Якщо сервіс не знайдено — inject поверне null замість помилки."
      mid: "@Optional decorator або `inject(Token, { optional: true })` — маркує dependency як optional. Якщо token не registered в injector chain — returns null замість NG0202 error. Тип повертає `Service | null` — потрібна null check. Use cases: optional plugin services, graceful degradation, library services що consumer may not have provided."
      senior: "@Optional resolution: Angular traverses injector chain як звичайно, але замість NullInjector throw — returns null. З inject(): `inject(Token, { optional: true })` — return type T | null. TypeScript type narrowing: потрібен null check перед use. Pattern: `private logger = inject(LoggerService, { optional: true })`. Потім: `this.logger?.log('message')`. @Optional з default: `private config = inject(CONFIG, { optional: true }) ?? DEFAULT_CONFIG`. Для multi-token: `inject(PLUGINS, { optional: true }) ?? []`. @Optional не означає 'lazy' — inject спробує знайти token нормально, просто не throws якщо не знайдено."
      staff: "@Optional — important для library design and optional feature detection. Architectural pattern: feature detection через optional injection. Library component: `private animationService = inject(AnimationService, { optional: true })`. Якщо consumer не provides AnimationService — feature gracefully disabled. Testing: inject null for optional deps by not providing them in TestBed. Production pattern: `private analytics = inject(AnalyticsService, { optional: true })`. Якщо app не configured analytics — component still works. Alternatively: NullObject pattern — `inject(Analytics, { optional: true }) ?? inject(NoopAnalytics)` — always valid service. Optional і @Self: `inject(FormGroup, { optional: true, self: true })` — optional only in current injector. Used in CVA components to check if inside ReactiveForm."
    commonMistakes:
      - "Не перевіряють null після optional inject — runtime error при access"
      - "Не знають що @Optional з multi-token повертає null (не empty array) якщо не registered"
    relatedQuestions: ["b5t5q2", "b5t5q3"]
  - level: "mid"
    question: "Яка різниця між @Self, @SkipSelf і @Host і коли кожен використовувати?"
    referenceAnswers:
      junior: "@Self — inject тільки з поточного injector. @SkipSelf — пропустити поточний. @Host — зупинитись на host element."
      mid: "@Self: шукати token ТІЛЬКИ в поточному NodeInjector (не traverses parents). Якщо не знайдено — error (або null якщо @Optional). @SkipSelf: почати пошук з PARENT injector, пропустити поточний. Корисно для сервісу що inject власний parent instance. @Host: шукати до host element boundary — зупинятись на component/directive що 'owns' current view. Відрізняється від @Self бо може traverse до host element але не далі."
      senior: "@Self: inject(Token, { self: true }) — тільки поточний NodeInjector. Throws NG0201 якщо not found (без @Optional). Use case: компонент перевіряє чи він сам надає певний service — `inject(MyService, { self: true, optional: true })`. @SkipSelf: inject(Token, { skipSelf: true }) — пропускає поточний NodeInjector, починає з parent. Use case: сервіс inject свій parent instance: `class TreeNode { private parent = inject(TreeNode, { skipSelf: true, optional: true }); }`. @Host: inject(Token, { host: true }) — traverses до host element boundary. Host element — компонент/директива що використовує поточну template. In content projection: @Host зупиняється на projected component boundary, не переходить до parent. Different від @Self бо може traverse 1-2 levels в embedded views але зупиниться на host."
      staff: "@Host — найтонший і найбільш misunderstood modifier. Technical definition: зупиняється коли injector belongs до host component/directive. In embedded views (ngFor, ngIf): @Host traverses до view's host component. Це відрізняє від @Self (поточний лише). Content projection scenario: `<app-parent><app-child></app-child></app-parent>`. app-child з @Host inject: зупиниться на app-child boundary (app-child is its own host). Без @Host: traverse до app-parent. З @Host в template directive: traverse до component that owns template. Use case: form controls з @Host inject FormGroupDirective — знаходить closest FormGroup у host view. `inject(FormGroupDirective, { host: true, optional: true })` в reactive form CVA component. Ivy internals: @Host sets TDFlags.Host flag на DI lookup — NodeInjector checks isHostBoundary flag при traversal. Content projection і @Host: projected content — belongs до projecting component (logical parent), not receiving component. @Host у projected content → finds projecting component's injector."
    commonMistakes:
      - "Плутають @Self і @Host — Self = current only, Host = traverse до host component boundary"
      - "Не знають що @Host в content projection → projecting component, не receiving"
    relatedQuestions: ["b5t5q1", "b5t5q3"]
  - level: "senior"
    question: "Як resolution modifiers використовуються для реалізації parent-child component communication через DI?"
    referenceAnswers:
      junior: "Батьківський компонент може зробити себе injectable і child inject його через @SkipSelf або @Host."
      mid: "Pattern: parent component provides itself або деякий service. Child inject через @SkipSelf щоб знайти parent instance. Це альтернатива до @Input/@Output для deeply nested components. Приклад: Tab/TabList pattern — TabList provides itself, Tab inject TabList через @Host."
      senior: "Parent-child DI communication patterns: 1) Direct self-provide: `@Component({ providers: [{ provide: AccordionPanel, useExisting: forwardRef(() => AccordionPanelComponent) }] })`. Child inject: `inject(AccordionPanel, { optional: true })`. 2) Abstract class token: `abstract class TabsApi { abstract select(id: string): void; }`. TabsComponent extends/implements TabsApi, provides via useExisting. TabComponent inject TabsApi — no direct coupling. 3) @SkipSelf для recursive: `class TreeNodeComponent { parent = inject(TreeNodeComponent, { skipSelf: true, optional: true }); }` — tree structure. 4) Shared service via component providers — same instance for parent and all children."
      staff: "DI-based component communication — альтернатива Input/Output що works для compound components і design systems. Trade-offs vs Input/Output: DI communication — implicit coupling через token, harder to see in template. Input/Output — explicit, visible in template, better for simple parent-child. DI pattern suited для: deeply nested communication (accordion panel knowing accordion root), compound components (tabs API), form controls (CVA knowing parent form). Angular CDK examples: PortalOutlet, TreeControl, SelectionModel — всі DI-based communication. Implementation details: `forwardRef` required якщо self-provide in same file (circular reference before class defined). Alternatively: define token separately from component class. Testing DI-based communication: provide mock parent в TestBed providers або use ViewChild in test. Real compound component design: `abstract class ListboxApi { abstract select(value: string): void; }`. ListboxComponent implements ListboxApi, provides via `{ provide: ListboxApi, useExisting: ListboxComponent }`. ListboxOptionComponent injects ListboxApi — works regardless of concrete ListboxComponent implementation."
    commonMistakes:
      - "useExisting з forwardRef — забувають forwardRef при self-reference"
      - "DI communication everywhere — замість Input/Output де вони достатні і більш explicit"
    relatedQuestions: ["b5t5q2", "b5t5q4"]
  - level: "senior"
    question: "Як @Optional і @Self використовуються в ControlValueAccessor компонентах для форм?"
    referenceAnswers:
      junior: "CVA компоненти implements ControlValueAccessor і реєструються через NG_VALUE_ACCESSOR."
      mid: "CVA component inject NgControl (FormControl wrapper) для доступу до validation state. `inject(NgControl, { optional: true, self: true })` — optional якщо input використовується поза формою, self — тільки з поточного injector (де FormControl прив'язаний через formControlName/ngModel)."
      senior: "CVA pattern з DI modifiers: `class CustomInputComponent implements ControlValueAccessor { private ngControl = inject(NgControl, { optional: true, self: true }); constructor() { if (this.ngControl) { this.ngControl.valueAccessor = this; } } }`. Чому @Self: NgControl реєструється в NodeInjector того ж element де formControlName або ngModel. @Self гарантує inject тільки з поточного element injector. Чому @Optional: компонент може використовуватись поза формою (standalone input без ngModel). Validation state: `this.ngControl?.errors`, `this.ngControl?.touched`, `this.ngControl?.dirty`. Circular dependency: не можна inject NgControl через DI і одночасно register через NG_VALUE_ACCESSOR — Angular bootstrap проблема. Рішення: inject у constructor, встановити valueAccessor вручну."
      staff: "CVA і DI modifiers — класичний Angular pattern що розкриває розуміння DI system. Проблема NG_VALUE_ACCESSOR і NgControl: якщо компонент реєструє себе через NG_VALUE_ACCESSOR (multi:true), Angular inject NG_VALUE_ACCESSOR при NgControl creation — circular. Solution (Angular best practice): 1) Provide NG_VALUE_ACCESSOR окремо: `providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyComp), multi: true }]`. 2) В constructor inject NgControl @Self @Optional. 3) Set valueAccessor manually. Сучасний підхід (Angular 14+): `class MyInput { ngControl = inject(NgControl, { self: true, optional: true }); constructor() { this.ngControl?.valueAccessor = this; } }`. NG_VALUE_ACCESSOR providers — required for template-driven forms. formControlName — uses NgControl directly. Validation display: CVA component reads ngControl.errors, ngControl.status, ngControl.touched → shows error messages. Angular Material uses this pattern extensively — MatInput, MatSelect. Testing CVA: wrap в ReactiveFormsModule form або use FormControl directly with setViewValue."
    commonMistakes:
      - "Inject FormControl напряму замість NgControl — не works з ngModel template-driven forms"
      - "Реєструють NG_VALUE_ACCESSOR і inject NgControl — circular dependency"
    relatedQuestions: ["b5t5q3", "b5t5q5"]
  - level: "staff"
    question: "Як resolution modifiers допомагають при реалізації compound component patterns у Design System?"
    referenceAnswers:
      junior: "Parent компонент provides service який child inject через DI щоб комунікувати."
      mid: "Compound components: Select/Option, Accordion/Panel, Tabs/Tab. Parent provides abstract token, children inject via @Host або @Self. DI-based communication замість prop drilling. forwardRef для circular reference."
      senior: "Compound component DI pattern: 1) Abstract API class: `abstract class SelectApi { abstract select(value: unknown): void; abstract isSelected(value: unknown): boolean; }`. 2) Select component: `provides: [{ provide: SelectApi, useExisting: forwardRef(() => SelectComponent) }]`. 3) Option component: `private select = inject(SelectApi)`. @Host — якщо option може бути в nested templates. @Optional — якщо option може жити поза select. Signal-based communication: SelectComponent exposes signals, OptionComponent reads via inject."
      staff: "Compound component architecture потребує careful DI design. Key decisions: 1) Abstract token vs direct component class — abstract = better testability і multiple implementations. 2) @Host vs no modifier — @Host stops at component boundary (needed if options can be in ng-content). 3) Signal-based vs imperative API — signals = reactive, imperative = explicit control. Production example (listbox): `abstract class ListboxContext { abstract readonly selectedValues: Signal<unknown[]>; abstract toggle(value: unknown): void; abstract readonly multiple: Signal<boolean>; }`. ListboxComponent: `implements ListboxContext, provides: [{ provide: ListboxContext, useExisting: ListboxComponent }]`. ListboxOptionComponent: `ctx = inject(ListboxContext)`. Selected state: `isSelected = computed(() => this.ctx.selectedValues().includes(this.value()))`. Click: `this.ctx.toggle(this.value())`. Benefits: 1) Option doesn't know about ListboxComponent concrete class. 2) Easy mock in tests: `providers: [{ provide: ListboxContext, useValue: mockCtx }]`. 3) Multiple implementations: AccessibleListbox, VirtualListbox — same option component. 4) Signals = fine-grained reactivity. forwardRef не потрібен якщо token окремий від class. Angular CDK approach: DropdownTriggerFor, Dialog, etc. — all use @Host і abstract class tokens. For open source library: this pattern = excellent API stability guarantee."
    commonMistakes:
      - "Couple option до specific parent class — breaks extensibility"
      - "No forwardRef для self-provide у same file — ReferenceError"
    relatedQuestions: ["b5t5q4", "b5t5q3"]
---

## Core Concept

**English definition:** Angular DI resolution modifiers (`@Optional`, `@Self`, `@SkipSelf`, `@Host`) control how the injector traverses the injection hierarchy: `@Optional` allows null when not found, `@Self` restricts lookup to current injector only, `@SkipSelf` starts from the parent injector, and `@Host` stops traversal at the host component boundary.

**Пояснення:** Resolution modifiers — це параметри що змінюють алгоритм пошуку dependency в injector chain. @Optional: повертає null замість помилки якщо не знайдено. @Self: шукає тільки в поточному injector без traversal. @SkipSelf: пропускає поточний injector, починає з parent. @Host: зупиняється на host component boundary (host = component що owns поточний template). В inject() function: `inject(Token, { optional: true, self: true })`.

**Яку проблему вирішує:** Default resolution traverses весь injector chain до NullInjector. Іноді потрібен контроль: injectable що may not exist (optional), service що ПОВИНЕН бути в поточному injector (self), recursive components (skipSelf для parent instance), content projection boundaries (host). Без цих модифікаторів — складні compound components і form integrations неможливі.

**Як працює під капотом:** Модифікатори компілюються в flags для DI lookup: TDFlags.Optional, TDFlags.Self, TDFlags.SkipSelf, TDFlags.Host. NodeInjector traversal перевіряє ці flags: Self → тільки поточний TNode providers. SkipSelf → skip поточний, перейти до parent. Host → встановлює HostBoundary flag — при dosягненні host component NodeInjector → stop. Optional → NullInjector returns null замість throw.

**Trade-offs та обмеження:** @Self жорстко обмежує lookup — якщо token не в поточному injector → error або null. @Host behavior відрізняється для content-projected vs view children — складно передбачити без розуміння template ownership. @SkipSelf + @Optional = optional parent — null якщо нема parent з token (важливо для root instances).

**Версійність:** Всі modifiers стабільні з Angular 2. Angular 14: inject() function з options object `{ optional, self, skipSelf, host }` — замінює decorator-based usage. Decorator @Optional, @Self, @SkipSelf, @Host залишаються для backward compatibility. Рекомендований підхід: inject() з options замість decorators.

---

## Deep Details

### Edge Cases

**@Host і content projection:** Content projected into component — логічно belongs до projecting component (не receiving). `<app-parent><app-child /></app-parent>` де app-child проецується: @Host у app-child → знаходить app-parent's injector (projecting parent), не app-receiving's.

**@SkipSelf для root service:** `inject(RootService, { skipSelf: true })` в root component — traverses до Platform injector. Якщо root service only in root injector → not found. @Optional допомагає.

**@Self + @Optional у CVA:** `inject(NgControl, { self: true, optional: true })` — common pattern для ControlValueAccessor. Self: NgControl registered on same element. Optional: component може використовуватись standalone.

**Combining modifiers:** `inject(TOKEN, { optional: true, host: true })` — valid. Optional + Host: search до host boundary, null if not found there.

**@Host vs @Self у directive:** Directive на `<input ngModel #ctrl="ngModel">`: @Self → directive's own injector (input element). @Host → host component boundary. For NgModel interaction: @Self correct.

**forwardRef і self-provide:** `providers: [{ provide: MyClass, useExisting: forwardRef(() => MyClass) }]` — needed якщо class references itself before full definition.

### Junior vs Senior Understanding

**Junior** знає що модифікатори існують, @Optional повертає null.

**Senior** розуміє:

1. **Traversal algorithm change:** Кожен modifier — specific flag в TDFlags. NodeInjector traversal code checks these flags at each level.

2. **@Host vs @Self distinction:** Self = current node only. Host = traverse до host component boundary (crosses embedded views але stops at host).

3. **Content projection ownership:** Projected content логічно belongs to projecting component. @Host reflects цю логіку.

4. **CVA DI pattern:** NgControl @Self + @Optional — стандартний pattern. Circular dependency з NG_VALUE_ACCESSOR — forwardRef solution.

5. **Compound components via DI:** Abstract token, forwardRef self-provide, Signal-based API — production design system patterns.

### Deprecation & Migration Path

- **Decorator syntax (@Optional, @Self, etc.):** Залишаються, не deprecated. inject() options — preferred modern style. Both work.
- **constructor(@Optional() @Self() private ngControl: NgControl):** Functional equivalent `inject(NgControl, { optional: true, self: true })`. Migration: style preference.
- **forwardRef у providers:** Залишається needed для class self-reference. Angular CLI generates this when appropriate.

### Connections to Other Concepts

- **DI Internals:** Resolution modifiers change traversal algorithm — direct impact on bloom filter and injector chain traversal.
- **Forms (CVA):** @Optional + @Self = canonical CVA DI pattern для NgControl injection.
- **Content Projection:** @Host behavior changes with content projection — projected content has projecting component as host.
- **Compound Components:** @Host і abstract class tokens = compound component pattern foundation.

---

## Examples

### Basic Usage

```typescript
// @Optional — graceful service absence
@Injectable({ providedIn: 'root' })
export class FeatureComponent {
  // Optional: null if AnalyticsService not provided
  private analytics = inject(AnalyticsService, { optional: true });

  trackEvent(name: string): void {
    // Null-safe call
    this.analytics?.track(name);
  }
}

// @Self — only current injector
@Component({
  selector: 'app-form-field',
  providers: [FormFieldService],  // Provides in this component's NodeInjector
  template: `...`
})
export class FormFieldComponent {
  // @Self: must be in THIS component's providers
  private formField = inject(FormFieldService, { self: true });
  // If not in providers — error (use optional: true for safety)
}

// @SkipSelf — parent instance
@Component({
  selector: 'app-tree-node',
  providers: [
    // Each node provides itself
    { provide: TreeNodeComponent, useExisting: forwardRef(() => TreeNodeComponent) }
  ],
  template: `
    <ng-content></ng-content>
    <app-tree-node *ngFor="let child of node.children" [node]="child" />
  `
})
export class TreeNodeComponent {
  node = input.required<TreeNode>();

  // SkipSelf: inject PARENT node, not self
  parent = inject(TreeNodeComponent, { skipSelf: true, optional: true });

  get depth(): number {
    return this.parent ? this.parent.depth + 1 : 0;
  }
}

// @Host — stop at host boundary
@Directive({ selector: '[appTooltip]' })
export class TooltipDirective {
  // Host: find OverlayContainer in host component, not all ancestors
  private overlay = inject(OverlayContainer, { host: true, optional: true })
    ?? inject(OverlayContainer);  // Fallback to root
}
```

### Production Scenario

```typescript
// ControlValueAccessor with @Optional + @Self
@Component({
  selector: 'app-star-rating',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true
    }
  ],
  template: `
    <div class="stars" [class.invalid]="isInvalid()" [class.touched]="isTouched()">
      @for (star of stars; track star) {
        <button
          type="button"
          [class.filled]="star <= value()"
          (click)="setValue(star)"
          [attr.aria-label]="'Rate ' + star + ' stars'"
        >★</button>
      }
    </div>
    @if (isInvalid() && isTouched()) {
      <span class="error">{{ errorMessage() }}</span>
    }
  `
})
export class StarRatingComponent implements ControlValueAccessor, OnInit {
  stars = [1, 2, 3, 4, 5];
  value = signal(0);

  // CVA: @Self + @Optional
  // @Self: NgControl registered on same element
  // @Optional: works standalone (without form)
  private ngControl = inject(NgControl, { self: true, optional: true });

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  isInvalid = computed(() =>
    this.ngControl ? this.ngControl.invalid === true : false
  );

  isTouched = computed(() =>
    this.ngControl ? this.ngControl.touched === true : false
  );

  errorMessage = computed(() => {
    const errors = this.ngControl?.errors;
    if (errors?.['required']) return 'Rating is required';
    if (errors?.['min']) return `Minimum rating is ${errors['min'].min}`;
    return '';
  });

  constructor() {
    // Set valueAccessor BEFORE Angular processes form
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  setValue(rating: number): void {
    this.value.set(rating);
    this.onChange(rating);
    this.onTouched();
  }

  writeValue(value: number): void { this.value.set(value ?? 0); }
  registerOnChange(fn: (v: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}

// Compound Listbox with abstract DI token
export abstract class ListboxContext {
  abstract readonly selectedValues: Signal<unknown[]>;
  abstract readonly multiple: Signal<boolean>;
  abstract toggle(value: unknown): void;
}

@Component({
  selector: 'app-listbox',
  standalone: true,
  providers: [
    { provide: ListboxContext, useExisting: forwardRef(() => ListboxComponent) }
  ],
  template: `
    <div role="listbox" [attr.aria-multiselectable]="multiple()">
      <ng-content></ng-content>
    </div>
  `
})
export class ListboxComponent implements ListboxContext {
  multiple = input(false);
  readonly selectedValues = signal<unknown[]>([]);

  toggle(value: unknown): void {
    this.selectedValues.update(vals =>
      this.multiple()
        ? vals.includes(value) ? vals.filter(v => v !== value) : [...vals, value]
        : [value]
    );
  }
}

@Component({
  selector: 'app-listbox-option',
  standalone: true,
  template: `
    <div
      role="option"
      [attr.aria-selected]="isSelected()"
      [class.selected]="isSelected()"
      (click)="select()"
      (keydown.space)="select(); $event.preventDefault()"
      tabindex="0"
    >
      <ng-content></ng-content>
    </div>
  `
})
export class ListboxOptionComponent {
  value = input.required<unknown>();

  // @Host: stop at listbox boundary
  // @Optional: graceful if used outside listbox
  private ctx = inject(ListboxContext, { host: true, optional: true });

  isSelected = computed(() =>
    this.ctx?.selectedValues().includes(this.value()) ?? false
  );

  select(): void {
    this.ctx?.toggle(this.value());
  }
}
```

### Anti-Example

```typescript
// WRONG: inject() without @Optional when service may not exist
@Component({ template: `...` })
export class BadComponent {
  // WRONG: throws if AnalyticsService not provided
  private analytics = inject(AnalyticsService);

  // Should be:
  // private analytics = inject(AnalyticsService, { optional: true });
}

// WRONG: @Self without @Optional — throws if not in current injector
@Directive({ selector: '[appFeature]' })
export class BadDirective {
  // WRONG: @Self but no @Optional — if FeatureService not in this element's providers
  private feature = inject(FeatureService, { self: true }); // Throws!

  // Should be:
  // private feature = inject(FeatureService, { self: true, optional: true });
}

// WRONG: No forwardRef for self-provide in same file
@Component({
  // WRONG: ReferenceError — MyComp not yet defined at providers evaluation
  providers: [{ provide: MyComp, useExisting: MyComp }],
  template: `...`
})
export class MyComp {
  parent = inject(MyComp, { skipSelf: true, optional: true });
}

// CORRECT:
@Component({
  // forwardRef: defer evaluation until MyComp is defined
  providers: [{ provide: MyComp, useExisting: forwardRef(() => MyComp) }],
  template: `...`
})
export class MyComp {
  parent = inject(MyComp, { skipSelf: true, optional: true });
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| inject() без optional для potentially-absent services | NG0201 error якщо service not provided — app crashes | `inject(Token, { optional: true })` з null check |
| @Self без @Optional для non-guaranteed tokens | Throws якщо current injector doesn't have token | `inject(Token, { self: true, optional: true })` |
| Self-provide без forwardRef в same file | ReferenceError — class not yet defined at evaluation | `useExisting: forwardRef(() => MyClass)` |
| Inject parent class без @SkipSelf в recursive components | Infinite loop або wrong instance | inject(ParentClass, { skipSelf: true, optional: true }) |
| Coupling option to parent component class | Breaks extensibility — can't swap parent implementation | Abstract class token + @Host + @Optional |

---

## Interview Block

### [L1 — Warm-up] Що таке @Optional в Angular DI і коли його використовувати?
**Signal being tested:** Розуміння graceful degradation в DI і практичних scenarios де service може бути absent.
**What the interviewer expects:** Returns null замість error, `inject(Token, { optional: true })`, null check required, use cases (optional plugins, library services).
**How to probe deeper:** "Що повертає inject() для multi-token з optional:true якщо ніхто не registered?"
**Reference answer:** @Optional: traverses chain normally, NullInjector returns null замість throw. inject() return type T | null — TypeScript requires null check. Use cases: optional analytics, plugin services, graceful feature degradation. Multi-token + optional: returns null (not empty array) — guard with `?? []`.
**Common mistakes:** Not null-checking after optional inject; думають multi optional returns empty array.

### [L2 — Mid] Яка різниця між @Self, @SkipSelf і @Host і коли кожен використовувати?
**Signal being tested:** Розуміння traversal modification і architectural use cases для кожного modifier.
**What the interviewer expects:** Self (current injector only), SkipSelf (skip current), Host (stop at host boundary), specific use cases.
**How to probe deeper:** "Як @Host поводить себе в content-projected component?"
**Reference answer:** @Self: тільки поточний NodeInjector. @SkipSelf: skip current, start from parent (recursive components, parent instance). @Host: traverse до host component boundary, stop (compound components, projected content). @Host in content projection: host = projecting component (logical owner). Combined: `{ self: true, optional: true }` для CVA NgControl pattern.
**Common mistakes:** Плутають Self і Host; не знають content projection Host behavior.

### [L3 — Senior] Як resolution modifiers використовуються для реалізації parent-child component communication через DI?
**Signal being tested:** Архітектурне розуміння DI-based communication patterns — коли доречніше ніж Input/Output.
**What the interviewer expects:** Abstract class token, forwardRef self-provide, @Host in option component, Signal-based API, compound component pattern.
**How to probe deeper:** "Чому abstract class token краще ніж direct component class injection?"
**Reference answer:** Abstract API class → component implements → provides via useExisting forwardRef. Option injects abstract class via @Host — stops at component boundary. @Optional — option works outside parent. Benefits: decoupled (no direct class reference), testable (mock abstract), extensible (multiple implementations). Signal-based: selectedValues signal + toggle method = reactive compound API.
**Common mistakes:** Using concrete class instead of abstract token; missing forwardRef; coupling тight instead of abstract API.

### [L4 — Staff/Principal] Як resolution modifiers допомагають при реалізації compound component patterns у Design System?
**Signal being tested:** Системне мислення про API stability, testability і extensibility для Design System library compound components.
**What the interviewer expects:** Abstract context class, signal-based API, @Host + @Optional в option, testing strategy, multiple implementations, angular CDK patterns.
**How to probe deeper:** "Як тестувати ListboxOption компонент без Listbox?"
**Reference answer:** Abstract ListboxContext class: selectedValues signal + toggle method. ListboxComponent implements і provides via forwardRef. ListboxOptionComponent: inject(ListboxContext, { host:true, optional:true }). Tests: `providers: [{ provide: ListboxContext, useValue: mockCtx }]`. Multiple implementations: VirtualListbox, AccessibleListbox — same options. Angular CDK does this: DropdownTriggerFor, Dialog.
**Common mistakes:** Concrete class token (breaks extensibility); no @Optional (crashes standalone); no test strategy.

---

## Summary

### Key Points
- @Optional: null замість error коли token absent. inject(T, { optional: true }). Null check required
- @Self: тільки поточний NodeInjector. inject(T, { self: true }). No parent traversal
- @SkipSelf: пропустити поточний injector, почати з parent. Для recursive components (tree nodes)
- @Host: зупинитись на host component boundary. Важливо для compound components і content projection
- Content projection: @Host → projecting component (logical owner), not receiving component
- CVA pattern: `inject(NgControl, { self: true, optional: true })` + forwardRef NG_VALUE_ACCESSOR — canonical form integration
- Compound components: abstract class token + forwardRef self-provide + @Host @Optional в child = extensible, testable API

### Elevator Pitch (2 minutes)
Resolution modifiers контролюють traversal алгоритм Angular DI. @Optional — returns null замість throw (graceful degradation). @Self — current injector only, no parent traversal (NG_VALIDATORS, CVA patterns). @SkipSelf — skip current, start from parent (tree node self-reference). @Host — stop at host component boundary (compound components, content projection boundary). inject() syntax: `inject(Token, { optional: true, self: true })`. Key patterns: CVA form integration = `inject(NgControl, { self: true, optional: true })` + forwardRef in NG_VALUE_ACCESSOR. Compound components: abstract context class, component provides via forwardRef, option injects via @Host + @Optional. Content projection gotcha: @Host in projected content finds projecting component, not receiving.
