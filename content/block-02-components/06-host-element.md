---
title: "Host Element Binding & Host Directives"
block: 2
topic: 6
slug: "host-element"
difficulty: 4
sinceVersion: "2"
tags: ["host-binding", "host-listener", "HostBinding", "HostListener", "hostDirectives", "attribute-directives", "directive-composition"]
relatedTopics: ["component-metadata", "viewchild-contentchild", "content-projection", "lifecycle-hooks"]
interviewQuestions:
  - id: "b2t6q1"
    level: "junior"
    question: "Що таке host element? Як використовувати @HostBinding і @HostListener?"
    referenceAnswers:
      junior: "@HostBinding дозволяє встановлювати властивості і атрибути на сам елемент компонента або директиви (host element). @HostListener — підписуватись на події host element. Наприклад, @HostBinding('class.active') isActive = true додає клас active на host."
      mid: "Host element — це DOM-елемент на якому застосований компонент або директива (тег самого компонента в DOM). @HostBinding('attr.aria-expanded') і @HostBinding('class.open') — binding властивостей на цей елемент. @HostListener('click') — handler кліку на host. Перевага: не потрібен окремий wrapper div, логіка binding в класі компонента. Альтернатива: host property в @Component/@Directive декораторі — більш декларативний підхід."
      senior: "@HostBinding і @HostListener — decorator-based спосіб маніпулювати host element з class body. @HostBinding('class.active') active = false — Angular включає клас active коли active === true. @HostBinding('attr.role') role = 'button' — встановлює ARIA attribute. @HostListener('keydown.enter', ['$event']) — Angular event binding syntax з key modifier. Під капотом Angular compiler трансформує @HostBinding в host binding expression, а @HostListener — в host listener definition — ідентично до оголошення в host: {} property. Важливо: host bindings беруть участь в change detection — кожен CD cycle Angular re-evaluates host bindings. Static значення (constants) — prefer host: { 'attr.role': 'button' } замість @HostBinding."
      staff: "@HostBinding і @HostListener — imperative API для host manipulation, deprecated by Angular style guide на користь host: {} property. Архітектурне значення: host element — це межа між component API і DOM. @HostBinding vs [class] в template — host binding застосовується до самого компонента-елемента без wrapper. В design system: компонент button з @HostBinding('class.btn') та @HostBinding('attr.disabled') — semantically correct HTML без обгорток. Performance: host bindings — part of component view bindings, evaluated кожен CD cycle. Static host bindings краще виносити в host: { 'attr.role': 'listbox' } — compiler може optimize. @HostListener — EventListener на host element, cleanup automatic при component destroy. Vs host: {} — функціонально еквівалентно, але host: {} — compile-time static, більш explicit для code reviewers, і підтримує Angular language service auto-complete."
    commonMistakes:
      - "Думають що @HostBinding замінює template bindings — не розуміють що це для host element"
      - "Не знають про host: {} альтернативу в декораторі"
    relatedQuestions: ["b2t6q2", "b2t6q3"]
  - id: "b2t6q2"
    level: "mid"
    question: "Яка різниця між @HostBinding/@HostListener і host property в @Component/@Directive? Що Angular рекомендує?"
    referenceAnswers:
      junior: "host property в декораторі — це альтернативний спосіб зробити те саме що @HostBinding/@HostListener але без декораторів на властивостях."
      mid: "host: {} в @Component/@Directive — об'єктна декларація host bindings і listeners: '(click)': 'onClick($event)', '[class.active]': 'isActive', 'role': 'button'. @HostBinding і @HostListener — class-level decorators що роблять те саме. Функціонально еквівалентно. Angular style guide рекомендує host: {} як більш declarative і collocated з metadata. Переваги host: {}: вся host configuration в одному місці (decorator), Angular Language Service краще підтримує, compile-time static аналіз."
      senior: "Компілятор трактує обидва підходи ідентично — генерує той самий bytecode. Різниця — синтаксична і ergonomic. host: {} синтаксис: static bindings як string literals ('attr.role': 'button'), dynamic bindings як Angular template expressions ('[class.active]': 'isActive'), listeners як '(click)': 'handler()'. @HostBinding/@HostListener — decorator-based, TypeScript class features, але потребують окремих декораторів на кожному binding. Angular style guide (v17+) і eslint rules prefer host: {} для нових компонентів. @HostBinding і @HostListener не deprecated офіційно але Angular команда рухається від декоратор-heavy style. Для директив: host: {} — єдина рекомендація для нових standalone directives."
      staff: "host: {} vs декоратори — це не просто стилістичне питання, це architectural clarity. host: {} робить component's DOM contract explicit і collocated з іншими metadata. Для design system: всі DOM attributes і behaviors в одному об'єкті — reviewable, auditable. Migration: eslint `@angular-eslint/no-host-metadata-property: off` і `prefer-host-metadata: error` — enforce style guide. Компілятор output: обидва шляхи генерують HostBindingDef entries в component definition — runtime identical. Performance consideration: декларативні static host attributes (без []) compiler може виносити як static template attributes — один раз при component creation, не кожен CD. @HostListener з документом: `@HostListener('document:keydown')` — слухає document-level events, корисно для modals/overlays. Cleanup automatic через component destroy lifecycle."
    commonMistakes:
      - "Думають що host: {} і @HostBinding мають різну runtime поведінку"
      - "Забувають що host: {} підтримує static attributes (без [] і ())"
    relatedQuestions: ["b2t6q1", "b2t6q3"]
  - id: "b2t6q3"
    level: "senior"
    question: "Що таке hostDirectives і як працює Directive Composition API (Angular v15+)? Коли це краще ніж inheritance?"
    referenceAnswers:
      junior: "hostDirectives дозволяє застосувати директиву до компонента автоматично без необхідності вказувати її в шаблоні."
      mid: "hostDirectives в @Component/@Directive — масив директив що автоматично застосовуються до host element. Directive Composition API (v15+) дозволяє реалізовувати cross-cutting behavior через composition замість inheritance. Наприклад: ButtonComponent з hostDirectives: [FocusableDirective, TooltipDirective] автоматично otримує всю функціональність цих директив. inputs/outputs директив можна re-export через inputs: ['disabled'] і outputs: ['clicked']."
      senior: "Directive Composition API: hostDirectives масив в decorator приймає об'єкти {directive: DirectiveClass, inputs: [...], outputs: [...]} або просто DirectiveClass. При використанні компонента в template — Angular автоматично instantiate і apply всі host directives до того самого host element. DI: host directives мають доступ до того самого injector як і основний компонент (тому можна inject(HostComponent) в host directive). inputs/outputs forwarding: якщо вказано inputs: ['disabled: isDisabled'] — input `disabled` з директиви стає accessible як `isDisabled` на компоненті в template. Без forwarding — inputs/outputs директиви не доступні ззовні. Composition order matters: host directives застосовуються в порядку оголошення — важливо для директив що конфліктують за ті самі host bindings. Переваги над inheritance: multiple composition (немає multiple inheritance обмежень), mixins-like behavior, shareable behavior units."
      staff: "Directive Composition API — це реалізація mixins pattern для Angular components. Архітектурно вирішує проблему cross-cutting concerns без inheritance tree. Порівняння з patterns: 1) Inheritance — tight coupling, fragile base class problem, одна поведінка за раз. 2) hostDirectives — composition, multiple behaviors, loose coupling. 3) Service injection — для state/logic, не для DOM behavior. Design patterns: 'Prefer composition over inheritance' (Gang of Four) — hostDirectives реалізує це для host element behavior. Production use cases: a) Accessibility: всі interactive компоненти мають AccessibleDirective (aria attrs, keyboard nav). b) Analytics: ClickTrackingDirective на всіх кнопках. c) Theming: ThemableDirective що читає theme token. d) Validation state: FormControlDirective що sync validity CSS classes. DI context: host directive може inject component class через constructor(private host: ButtonComponent) — для tight integration. Compose vs reuse: якщо behavior потрібен тільки одному компоненту — інлайн у host: {}. Якщо shared across 2+ components — extract до directive з hostDirectives. Angular Language Service v15+ підтримує hostDirectives inputs/outputs в template — type-safe."
    commonMistakes:
      - "Думають що hostDirectives треба додавати до imports масиву — ні, тільки в hostDirectives"
      - "Забувають що inputs/outputs директиви не доступні ззовні без explicit forwarding"
    relatedQuestions: ["b2t6q2", "b2t6q4"]
  - id: "b2t6q4"
    level: "senior"
    question: "Як host element bindings взаємодіють з ViewEncapsulation? Які edge cases при використанні HostBinding з CSS класами?"
    referenceAnswers:
      junior: "ViewEncapsulation додає унікальний атрибут до елементів компонента для CSS isolation. Host element теж отримує цей атрибут."
      mid: "Host element — це межа ViewEncapsulation. З Emulated encapsulation: Angular додає _nghost-xxx attribute до host element і _ngcontent-xxx до template elements. CSS в компоненті scoped до _ngcontent-xxx selector. :host selector в CSS — це спосіб стилізувати сам host element через його _nghost-xxx attribute. @HostBinding('class.active') додає клас — і цей клас доступний для CSS батьківського компонента (не encapsulated)."
      senior: "ViewEncapsulation деталі: Emulated — Angular генерує uniq attribute per component (hash-based). Host element отримує обидва: _nghost-c1 (як host) і _ngcontent-c0 (якщо він projected в parent template). CSS :host{} в component styles трансформується в [_nghost-c1]{} — стилізує host element. :host-context(.dark-theme){} — [_nghost-c1]:where(.dark-theme [_nghost-c1]){} — умовні стилі на основі ancestor. @HostBinding('class.expanded') — додає клас до host element. Цей клас visible для parent's CSS (не encapsulated). Це корисно: parent може style `app-accordion.expanded {}`. Але: якщо parent компонент теж має Emulated encapsulation — `app-accordion.expanded` в parent CSS trансформується в `app-accordion.expanded[_ngcontent-parent]` — match тільки якщо host element має _ngcontent-parent attribute. Edge case: Shadow DOM encapsulation — host element стилі тільки через :host в component CSS, зовнішні стилі не проходять крім CSS Custom Properties."
      staff: "Host element і ViewEncapsulation — це де Angular's abstraction зустрічається з реальним DOM. Архітектурні implications: 1) Emulated encapsulation scoping: :host стилі — component's responsibility. Parent стилі через HostBinding-added classes — explicit API contract. 2) API design: які classes виставляти через HostBinding — це частина компонентного API. ButtonComponent з @HostBinding('class.loading') loading — parent може style `app-button.loading {}`. 3) CSS Custom Properties як bridge: компонент може використовувати --button-bg-color що parent sets — це preferred cross-encapsulation styling mechanism. 4) Shadow DOM: реальна encapsulation — жодних _nghost атрибутів, native shadow root. @HostBinding класи видні але ::slotted() і :host() CSS — єдині способи стилізувати. 5) None encapsulation: global CSS, ніяких атрибутів — уникати в component library (global style leakage). Design system guideline: host bindings для state classes (loading, disabled, error), CSS Custom Properties для theming, never expose internal structure through host. Component Testing: host element bindings тестують через fixture.debugElement.classes або nativeElement.classList."
    commonMistakes:
      - "Думають що @HostBinding('class.x') клас стилізується тільки component CSS — він visible для parent"
      - "Не розуміють відмінності :host vs :host-context в Emulated encapsulation"
    relatedQuestions: ["b2t6q3", "b2t6q5"]
  - id: "b2t6q5"
    level: "staff"
    question: "Як спроєктувати reusable behavior system для design system використовуючи hostDirectives і host: {} property? Які trade-offs між різними підходами?"
    referenceAnswers:
      junior: "Можна створити директиви з спільною поведінкою і застосовувати їх через hostDirectives до компонентів."
      mid: "Design pattern: виділити cross-cutting behaviors (accessibility, loading state, disabled state, click tracking) в окремі директиви. Кожен компонент декларує потрібні директиви в hostDirectives. Inputs/outputs forwarding дозволяє споживачу взаємодіяти з цими behaviors через component API."
      senior: "Layered directive composition pattern: Base directives — атомарна поведінка (FocusableDirective, DisableableDirective, LoadingDirective). Composite directives — комбінації (InteractiveDirective = Focusable + Disableable). Component — конкретна реалізація з relevant behaviors. Forwarding: ButtonComponent forwards `disabled` input від DisableableDirective — consumer використовує `[disabled]` на button як завжди. DI integration: LoadingDirective може inject ButtonComponent для tight coordination. Event ordering: host directives listeners викликаються перед component's host listeners. Testing: кожна directive testable в isolation — MockHostComponent в тесті. Reuse: одна директива — багато компонентів (Button, Input, Select — всі мають DisableableDirective)."
      staff: "Designing behavior system через hostDirectives — це архітектурне рішення що має далекосяжні наслідки для design system scalability. Patterns і trade-offs: 1) Fine-grained directives (atomic): максимальна reusability, explicit composition, більше boilerplate per component. 2) Coarse-grained directives (composite): менше oголошень, менше flexibility. 3) Hierarchy: atomic → composite → components. Реальний приклад: Angular Material redesign для v15+ — вся accessibility логіка в окремих directives (MatRipple, FocusMonitor) що компоненти compose через hostDirectives. Trade-offs vs inheritance: Inheritance — simpler для simple cases, але fragile base class, no multiple. hostDirectives — scalable, testable, але більше files, складніший DI graph. Trade-offs vs Mixins (TypeScript): TS mixins — compile-time, не Angular-aware (не беруть участь у DI, CD, lifecycle). hostDirectives — Angular-native, DI-integrated, lifecycle-aware. Migration strategy для existing codebase: 1) Identify repeated @HostBinding patterns across components. 2) Extract до standalone directives. 3) Replace з hostDirectives composition. 4) Publish isolated directives як utilities (можуть використовуватись без parent component). Bundle impact: directives tree-shakeable — якщо компонент не composed з directive — вона не включається. Документація: hostDirectives inputs/outputs повинні бути documented як частина component API (Angular Language Service показує їх в template)."
    commonMistakes:
      - "Розміщують занадто багато логіки в одній директиві замість атомарних units"
      - "Не тестують директиви ізольовано — покладаються на component integration tests"
    relatedQuestions: ["b2t6q3", "b2t6q4"]
---

## Core Concept

**English definition:** Host element binding is the mechanism for applying properties, attributes, classes, styles, and event listeners directly to the DOM element that hosts a component or directive — without modifying the template. Host Directives (Angular v15+, Directive Composition API) allow applying one or more directives to a component's host element declaratively in the component/directive metadata.

**Пояснення:** Host element — це сам DOM-тег компонента або директиви. Коли ти пишеш `<app-button>`, в DOM з'являється `<app-button>` — це host element. @HostBinding і host: {} дозволяють додавати атрибути, класи, стилі саме на цей елемент з коду класу, не з template. hostDirectives — це "mixins" для компонентів: декларуєш список директив в metadata і вони автоматично застосовуються до host element без будь-яких `<ng-host-directive>` тегів в template.

**Яку проблему вирішує:**

Без host bindings: щоб зробити компонент accessible, треба або мати wrapper div і binding там, або вручну встановлювати attributes. Але компонент — це сам тег, не обгортка. Host bindings дають правильне місце для `role`, `aria-*`, `tabindex` і event listeners.

hostDirectives вирішує DRY проблему: якщо 15 компонентів мають однакову логіку (hover state, disabled state, tooltip) — раніше треба було дублювати @HostBinding або наслідуватись. hostDirectives — composition без inheritance.

**Як працює під капотом:**

Angular compiler при обробці `@Component` або `@Directive` збирає:
1. `host: {}` property → `HostBindingDef` entries в component definition
2. `@HostBinding` decorators → ті самі `HostBindingDef` entries (compiler трансформує identично)
3. `hostDirectives` → `HostDirectiveDef` entries — Angular instantiates кожну host directive разом з основним компонентом

Runtime під час view creation:
- Host element (`TNode` з тегом компонента) має merged set of bindings: власні + всі host directives bindings
- Change detection: host bindings evaluated як частина component's own bindings — той самий CD cycle
- Event listeners від @HostListener/host: '(event)' — реєструються на native element через Renderer2

```typescript
// Що компілятор бачить для:
@Component({
  host: { '[class.active]': 'isActive', '(click)': 'onClick()' }
})
// Приблизно трансформується в:
// ɵɵhostProperty('class.active', ctx.isActive)  — в update block
// ɵɵlistener('click', function() { ctx.onClick(); })  — в creation block
```

**Trade-offs та обмеження:**

- `@HostBinding` і `@HostListener` функціонально еквівалентні `host: {}` але Angular style guide рекомендує `host: {}`
- hostDirectives inputs/outputs не доступні ззовні без explicit forwarding (inputs: [...])
- Host directives порядок застосування — важливо при конфліктах bindings (останній виграє)
- Shadow DOM encapsulation змінює правила host element CSS
- hostDirectives не можна dynamically змінювати — тільки static декларація

**Версійність:**

- `@HostBinding`, `@HostListener` — Angular v2+, без breaking changes
- `host: {}` property в декораторі — Angular v2+, завжди підтримувалось
- Directive Composition API (`hostDirectives`) — Angular v15, стабільний з v15.0
- Angular v15+ style guide: prefer `host: {}` над `@HostBinding/@HostListener` для нових компонентів
- `@HostBinding` і `@HostListener` — не deprecated офіційно але де-факто legacy pattern

## Deep Details

### Edge Cases

**Host directive DI context.** Host directive і component — один injector. Тому host directive може `inject(MyComponent)` (якщо декларована для цього компонента) і отримає reference на component instance. Але: circular dependency якщо component також inject(HostDirective) без `optional`.

**Forwarding inputs/outputs.** `hostDirectives: [{ directive: TooltipDirective, inputs: ['tooltipText: tooltip'] }]` — forwarding з aliasing. Consumer використовує `[tooltip]="text"` замість внутрішнього `[tooltipText]`. Без forwarding — input є але не accessible з template.

**Host listener event object.** `@HostListener('click', ['$event'])` — `$event` як другий аргумент у декоратора. В `host: {}` синтаксис: `'(click)': 'onClick($event)'`. Обидва способи передають event object.

**Document і window listeners.** `@HostListener('document:keydown.escape', ['$event'])` — Angular синтаксис для global events. В `host: {}`: `'(document:keydown.escape)': 'onEscape($event)'`. Автоматично cleanup при component destroy.

**hostDirectives в test environment.** TestBed compile включає host directives автоматично — їх не потрібно окремо декларувати. Але щоб тестувати host directive в isolation — треба TestBed.configureTestingModule з MockHostComponent.

**CSS specificity з :host.** `:host` selector — specificity 0-1-0 (як клас). `:host(.active)` — 0-2-0. Якщо parent stylesheet override через `app-button.active` (1-1-0) — parent стиль перемагає. Враховувати при дизайні CSS API.

### Junior vs Senior Understanding

**Junior** знає: `@HostBinding('class.active') isActive = false` додає клас, `@HostListener('click') onClick()` ловить клік. host: {} — альтернатива. hostDirectives — спосіб додати директиву без шаблону.

**Senior** розуміє: compiler output для host bindings (identically generated), ViewEncapsulation implications для :host selector і HostBinding-added classes (visible до parent), hostDirectives DI integration, input/output forwarding mechanics, event ordering (host directives before own listeners), і коли composition перемагає inheritance.

**Staff** мислить системно: host element — це DOM contract компонента. @HostBinding-exposed classes — це частина API (не internal). hostDirectives — mixins pattern для design systems, tree-shakeable behavior units, testable в isolation. Розуміє Angular Material's use of hostDirectives, bundle implications, і документацію API для consumers.

### Deprecation & Migration Path

**@HostBinding → host: {} (Angular style guide v17+):**

```typescript
// До (decorator style):
@Directive({ selector: '[appButton]' })
export class ButtonDirective {
  @HostBinding('class.loading') isLoading = false;
  @HostBinding('attr.disabled') isDisabled?: boolean;
  @HostListener('click', ['$event']) onClick(e: Event) { ... }
}

// Після (host: {} style — recommended):
@Directive({
  selector: '[appButton]',
  host: {
    '[class.loading]': 'isLoading',
    '[attr.disabled]': 'isDisabled || null',
    '(click)': 'onClick($event)'
  }
})
export class ButtonDirective {
  isLoading = false;
  isDisabled?: boolean;
  onClick(e: Event) { ... }
}
```

**Repeated @HostBinding → hostDirectives (Angular v15+):**

```typescript
// До: дублювання @HostBinding в кожному компоненті
@Component({ selector: 'app-button' })
export class ButtonComponent {
  @HostBinding('class.loading') isLoading = false;
  @HostBinding('attr.disabled') disabled = false;
  // Ті ж самі 5 HostBindings в app-input, app-select...
}

// Після: extracted directive + hostDirectives
@Directive({
  selector: '[appInteractiveState]',
  standalone: true,
  host: {
    '[class.loading]': 'loading()',
    '[attr.disabled]': 'disabled() || null'
  }
})
export class InteractiveStateDirective {
  loading = input(false);
  disabled = input(false);
}

@Component({
  selector: 'app-button',
  standalone: true,
  hostDirectives: [{
    directive: InteractiveStateDirective,
    inputs: ['loading', 'disabled']  // forward to component API
  }]
})
export class ButtonComponent {}
// Тепер app-input, app-select — теж використовують InteractiveStateDirective
```

### Connections to Other Concepts

- **Content Projection** (`04-content-projection`): host element — межа між projected content і component view
- **ViewEncapsulation** (`01-component-metadata`): :host selector і encapsulation scoping залежать від host element
- **Lifecycle Hooks** (`02-lifecycle-hooks`): @HostListener cleanup відбувається при ngOnDestroy
- **Directives** (Block 4): host directives — частина directive system, standalone directives рекомендовані для hostDirectives

## Examples

### Basic Usage

```typescript
// host: {} — recommended approach для host bindings
import { Component, input, HostListener } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `{{ label() }}`,
  host: {
    // Static attribute — встановлюється один раз при creation
    'role': 'status',
    'aria-live': 'polite',

    // Dynamic binding — re-evaluated кожен CD
    '[class.badge--primary]': "variant() === 'primary'",
    '[class.badge--error]': "variant() === 'error'",
    '[attr.aria-label]': 'ariaLabel()',

    // Inline event binding
    '(click)': 'onClick()'
  },
  styles: [`
    :host {
      display: inline-flex;
      padding: 2px 8px;
      border-radius: 12px;
    }
    :host(.badge--primary) { background: var(--color-primary); }
    :host(.badge--error) { background: var(--color-error); }
  `]
})
export class BadgeComponent {
  label = input.required<string>();
  variant = input<'primary' | 'error'>('primary');
  ariaLabel = input<string>();

  onClick() {
    // Host click handler
  }
}
```

### Directive Composition API (hostDirectives)

```typescript
// Production pattern: reusable behaviors через hostDirectives
import { Component, Directive, input, output, inject } from '@angular/core';

// ---- Atomic behavior directives ----

@Directive({
  selector: '[appFocusable]',
  standalone: true,
  host: {
    '[attr.tabindex]': 'disabled() ? null : "0"',
    '[attr.aria-disabled]': 'disabled()',
    '(keydown.enter)': 'onEnter()',
    '(keydown.space)': 'onSpace($event)'
  }
})
export class FocusableDirective {
  disabled = input(false);

  onEnter() { this.host.nativeElement.click(); }
  onSpace(e: Event) { e.preventDefault(); this.host.nativeElement.click(); }

  private host = inject(ElementRef<HTMLElement>);
}

@Directive({
  selector: '[appClickTracking]',
  standalone: true,
  host: { '(click)': 'trackClick()' }
})
export class ClickTrackingDirective {
  trackingId = input<string>();

  private analytics = inject(AnalyticsService, { optional: true });

  trackClick() {
    this.analytics?.track('click', { id: this.trackingId() });
  }
}

// ---- Component that COMPOSES behaviors ----

@Component({
  selector: 'app-interactive-button',
  standalone: true,
  // Declare host directives — автоматично applied до host element
  hostDirectives: [
    {
      directive: FocusableDirective,
      inputs: ['disabled']          // Forward disabled input
    },
    {
      directive: ClickTrackingDirective,
      inputs: ['trackingId']        // Forward trackingId input
    }
  ],
  template: `
    <span class="button-content">
      <ng-content />
    </span>
  `,
  host: {
    '[class.btn]': 'true',
    '[class.btn--loading]': 'loading()'
  }
})
export class InteractiveButtonComponent {
  loading = input(false);
  // disabled і trackingId — accessible через forwarded hostDirectives inputs
  // Consumer: <app-interactive-button [disabled]="true" [trackingId]="'submit-btn'">
}
```

### Production Scenario — Accessible Form Control

```typescript
// Real-world: Checkbox component з full accessibility через host
import { Component, input, output, model, signal } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  template: `
    <span class="checkbox-indicator" [class.checked]="checked()">
      @if (checked()) { <span class="checkmark">✓</span> }
    </span>
    <span class="checkbox-label"><ng-content /></span>
  `,
  host: {
    // ARIA semantics
    'role': 'checkbox',
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.tabindex]': 'disabled() ? -1 : 0',

    // Visual states
    '[class.checkbox--checked]': 'checked()',
    '[class.checkbox--disabled]': 'disabled()',
    '[class.checkbox--focused]': 'isFocused()',

    // Interactions
    '(click)': 'toggle()',
    '(keydown.space)': 'onSpace($event)',
    '(focus)': 'isFocused.set(true)',
    '(blur)': 'isFocused.set(false)'
  },
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      gap: 8px;
    }
    :host([aria-disabled="true"]) {
      opacity: 0.5;
      cursor: not-allowed;
    }
    :host(.checkbox--focused) .checkbox-indicator {
      outline: 2px solid var(--color-focus);
    }
  `]
})
export class CheckboxComponent {
  checked = model(false);     // Two-way binding
  disabled = input(false);
  changed = output<boolean>();

  isFocused = signal(false);

  toggle() {
    if (this.disabled()) return;
    this.checked.update(v => !v);
    this.changed.emit(this.checked());
  }

  onSpace(event: KeyboardEvent) {
    event.preventDefault();
    this.toggle();
  }
}
```

### Anti-Example

```typescript
// ПОГАНО: Wrapper div замість host bindings
@Component({
  selector: 'app-tag',
  template: `
    <!-- Зайвий wrapper div — порушує CSS flow, DOM structure -->
    <div
      [class.tag--active]="isActive"
      [attr.role]="'status'"
      (click)="onClick()">
      {{ label }}
    </div>
  `
})
export class TagComponent {
  @Input() label = '';
  @Input() isActive = false;
  onClick() {}
}
// Consumer: <app-tag> → DOM: <app-tag><div class="tag--active">...</div></app-tag>
// div — зайвий рівень, ускладнює CSS, DOM структуру, selector specificity

// ДОБРЕ: Стилізуємо безпосередньо host element
@Component({
  selector: 'app-tag',
  standalone: true,
  template: `{{ label() }}`,
  host: {
    'role': 'status',
    '[class.tag--active]': 'isActive()',
    '(click)': 'onClick()'
  },
  styles: [`:host { display: inline-flex; }`]
})
export class TagComponent {
  label = input.required<string>();
  isActive = input(false);
  onClick() {}
}
// Consumer: <app-tag> → DOM: <app-tag class="tag--active">...</app-tag>
// Чистий DOM, правильний semantic element
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Wrapper div для стилізації host element | Зайвий DOM node, ускладнює CSS (specificity, layout), порушує semantic HTML структуру | Використовувати `:host {}` CSS і `host: {}` property для bindings на host element |
| @HostBinding для static attributes (не змінюються) | Static host bindings re-evaluated кожен CD cycle — overhead | Static attributes в `host: { 'role': 'button' }` (без []) — встановлюються один раз |
| hostDirectives без forwarding important inputs | Consumer не може контролювати behavior директиви через component API — "hidden" inputs | Explicit `inputs: ['disabled', 'loading']` forwarding або aliasing |
| @HostListener на document без cleanup перевірки | @HostListener на document автоматично cleanup при destroy але тільки якщо component/directive destroyed коректно | Verify component lifecycle, avoid manual addEventListener на document |
| Занадто широкий host directive (монолітна логіка) | Порушує SRP, важко тестувати, всі компоненти отримують непотрібну логіку | Atomic directives (FocusableDirective, DisableableDirective окремо) |

## Interview Block

### [L1 — Warm-up] Що таке host element і як @HostBinding/@HostListener на нього впливають?

**Signal being tested:** Чи кандидат розуміє що host element — це сам тег компонента, і може відрізнити host bindings від template bindings.

**What the interviewer expects:** Чітке пояснення що host element — це `<app-my-component>` в DOM. Concrete приклад @HostBinding для class або attribute.

**How to probe deeper:** "Чим host: {} property відрізняється від @HostBinding? Що рекомендує Angular style guide?"

**Reference answer:** Host element — це сам DOM елемент компонента або директиви. Якщо в template пишеш `<app-button>` — в DOM з'являється `<app-button>` — це host element. @HostBinding('class.active') isActive = false додає клас active на цей елемент. @HostListener('click') onClick() ловить click на host element. host: {} property в декораторі — еквівалентний альтернативний синтаксис: `host: { '[class.active]': 'isActive', '(click)': 'onClick()' }`. Angular style guide рекомендує host: {} як більш declarative.

**Common mistakes:**
- "host element — це перший div всередині template" — плутають з першим template element
- Не знають що host: {} і @HostBinding — еквіваленти

---

### [L2 — Mid] Що таке Directive Composition API і hostDirectives? Як правильно forwarding inputs/outputs?

**Signal being tested:** Чи кандидат знає Angular v15+ features і може пояснити composition pattern і механіку forwarding.

**What the interviewer expects:** Пояснення hostDirectives як composition механізму. Concrete forwarding синтаксис. Розуміння що без forwarding — inputs не accessible.

**How to probe deeper:** "У тебе hostDirective з input `tooltipText`. Як зробити щоб consumer використовував `[tooltip]` замість `[tooltipText]`?"

**Reference answer:** hostDirectives в @Component/@Directive — масив директив що автоматично applied до host element без template. `hostDirectives: [{ directive: TooltipDirective, inputs: ['tooltipText: tooltip'] }]` — forwarding з aliasing: `tooltipText` в директиві стає `tooltip` в компоненті's template API. Без forwarding списку — input існує але недоступний ззовні. Outputs forwarding аналогічно. Multiple directives — масив entries, кожен з власним forwarding. DI: host directives мають доступ до того самого injector що і основний компонент.

**Common mistakes:**
- Додають hostDirective до `imports` масиву — потрібно тільки в `hostDirectives`
- Забувають що forwarding потрібен для кожного exposed input/output

---

### [L3 — Senior] Як host bindings взаємодіють з ViewEncapsulation? Чому @HostBinding-added класи видні для parent component?

**Signal being tested:** Чи кандидат розуміє Angular's encapsulation model на рівні host element — де проходить межа scoping.

**What the interviewer expects:** Пояснення що Emulated encapsulation scopes за _ngcontent атрибутом. Host element має _nghost (власний) і _ngcontent (parent's). HostBinding класи — на host element, доступні для parent CSS.

**How to probe deeper:** "Ти додав `@HostBinding('class.loading') isLoading = true` на ButtonComponent. Як parent може стилізувати цей клас? Чи буде це працювати з Shadow DOM encapsulation?"

**Reference answer:** Emulated encapsulation: Angular додає атрибути _nghost-xxx (де xxx — hash) до host element і _ngcontent-xxx до elements в template. CSS компонента scoped через _ngcontent атрибут — не "виходить" зовні. Але @HostBinding клас — на самому host element. Parent template має `<app-button>` з _ngcontent-parent атрибутом — тому parent CSS `app-button.loading[_ngcontent-parent]` може стилізувати host. `:host(.loading)` в самому компоненті трансформується в `[_nghost-comp].loading` — стилізує host element. Shadow DOM encapsulation — реальна isolation: @HostBinding класи видимі але зовнішні styles не проходять — тільки CSS Custom Properties і :host(:state()) CSS.

**Common mistakes:**
- "Emulated encapsulation — повна isolation, parent не може стилізувати компонент" — неправильно для host element
- Плутають :host (host element) і :host-context (ancestor check)

---

### [L3 — Senior] Коли використовувати hostDirectives замість inheritance для shared component behavior?

**Signal being tested:** Чи кандидат може аргументовано порівняти composition і inheritance в Angular контексті і вибрати правильний підхід.

**What the interviewer expects:** Concrete trade-offs: multiple inheritance проблема, fragile base class, testability. Коли hostDirectives перемагає. Коли inheritance все ще ok.

**How to probe deeper:** "У тебе 20 компонентів що всі повинні реагувати на disabled стан. Як ти організуєш це без дублювання?"

**Reference answer:** Inheritance в Angular компонентах: один base class, fragile base class problem (зміна base ламає всіх children), не можна multiply inherit поведінки. hostDirectives — composition: multiple behaviors per component, кожна directive тестується ізольовано, tree-shakeable (якщо не використовується — не включається в bundle). Pattern: DisableableDirective з host bindings для disabled state — apply через hostDirectives до Button, Input, Select, TextArea. Кожен компонент forwards `disabled` input. Тестування: тестуємо DisableableDirective з MockHost, не потребуємо кожен компонент. Inheritance залишається reasonable для: shared template logic (але краще content projection), shared service injections (але краще inject()), дуже tight coupling (але це rare).

**Common mistakes:**
- "Inheritance — простіше, тому краще" — не враховують long-term maintainability
- "hostDirectives вирішує все" — є cases де simple mixin pattern достатній

---

### [L4 — Staff/Principal] Як архітектурно спроєктувати behavior system для design system із 50+ компонентів використовуючи hostDirectives? Які метрики успіху?

**Signal being tested:** Чи кандидат може мислити на system design рівні — декомпозиція поведінок, API contract, team conventions, bundle impact, документація.

**What the interviewer expects:** Layered architecture опис (atomic → composite → components), API contract design для consumer, bundle/performance considerations, тестова стратегія, і метрики що показують success цього підходу.

**How to probe deeper:** "Як ти переконаєш команду що це правильна архітектура? Які risks? Як документувати hostDirectives API для споживачів design system?"

**Reference answer:** Layered behavior architecture: Layer 1 — atomic directives: FocusableDirective (tabindex, keyboard nav), DisableableDirective (disabled attr, CSS class), LoadingDirective (loading class, aria-busy), RippleDirective (click ripple effect). Кожна — standalone, testable ізольовано, minimal dependencies. Layer 2 — composite directives: InteractiveDirective = FocusableDirective + RippleDirective; FormControlDirective = FocusableDirective + DisableableDirective + LoadingDirective. Layer 3 — components: ButtonComponent hostDirectives: [InteractiveDirective, forwarded inputs]. API contract: документувати forwarded inputs як частину component API — consumer не повинен знати про internal directives. Angular Language Service показує forwarded inputs в IDE. Bundle: atomic directives tree-shakeable — компонент без ripple не включає RippleDirective. Метрики успіху: 1) Code duplication — кількість дублікатів @HostBinding до і після. 2) Test coverage — direktive tests vs component tests ratio. 3) Bundle size — per-directive bundle contribution. 4) Bug fix breadth — fix в directive автоматично fix у всіх компонентах. Team conventions: eslint rule що забороняє HostBinding дублікати (custom rule або review checklist). Documentation: Storybook stories для кожної directive в isolation — демонструє поведінку без конкретного компонента.

**Common mistakes:**
- Проектують занадто granular (1 HostBinding = 1 directive) — overhead без benefit
- Не враховують DI graph complexity при deep directive nesting

## Summary

### Key Points

- Host element — це сам DOM тег компонента/директиви; `host: {}` property і `@HostBinding/@HostListener` — два синтаксиси для однієї речі, Angular style guide рекомендує `host: {}`
- Static host attributes (без `[]`) в `host: {}` встановлюються один раз при creation — не re-evaluated кожен CD; динамічні `[class.x]` — кожен CD cycle
- Directive Composition API (`hostDirectives`) — Angular v15+, дозволяє декларативно композувати поведінки на host element без inheritance
- `hostDirectives` inputs/outputs не доступні ззовні без explicit `inputs: [...]` і `outputs: [...]` forwarding
- Host directives мають доступ до того самого DI injector що і основний компонент — можуть `inject(HostComponent)`
- `@HostBinding`-added класи видні для parent component CSS (не scoped Emulated encapsulation) — це частина public DOM API компонента
- Shadow DOM encapsulation — реальна isolation: зовнішні стилі не проходять, тільки CSS Custom Properties

### Elevator Pitch (2 minutes)

Host element — це сам тег компонента або директиви в DOM. `host: {}` property в декораторі і `@HostBinding/@HostListener` декоратори — два способи додати attributes, класи, і event listeners безпосередньо на цей елемент. Результат ідентичний, але Angular style guide рекомендує `host: {}` як більш declarative і collocated з іншими metadata.

Angular v15 ввів Directive Composition API через `hostDirectives`. Замість наслідування або дублювання `@HostBinding` в кожному компоненті — виносимо behavior в standalone directive і декларуємо її в `hostDirectives: [{ directive: DisableableDirective, inputs: ['disabled'] }]`. Angular автоматично instantiate і apply цю директиву до host element. Inputs/outputs forwarding робить їх частиною компонентного API.

Архітектурно: host element — це DOM contract компонента. `@HostBinding`-added класи — видимі для parent CSS (не encapsulated), тому `ButtonComponent` з `class.loading` — це explicit API для parent стилізації. Shadow DOM — єдина справжня isolation: CSS Custom Properties як bridge. hostDirectives pattern: atomic behavior directives → composite → компоненти — це scalable design system architecture що вирішує DRY без fragile inheritance hierarchy.
