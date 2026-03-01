---
title: "Component Metadata & @Component Decorator"
block: 2
topic: 1
slug: "component-metadata"
difficulty: 2
sinceVersion: "2"
tags: ["component", "decorator", "selector", "template", "styles", "encapsulation", "change-detection"]
relatedTopics: ["lifecycle-hooks", "input-output", "host-element", "standalone-components"]
interviewQuestions:
  - level: "junior"
    question: "Що таке @Component decorator і які його основні поля?"
    referenceAnswers:
      junior: "Decorator @Component позначає клас як Angular-компонент. Основні поля: selector, template або templateUrl, styles або styleUrl."
      mid: "@Component — це TypeScript decorator що додає метадані до класу. Angular compiler читає ці метадані для генерації фабрики компонента. Основні поля: selector (CSS-селектор для використання в HTML), template/templateUrl (розмітка), styles/styleUrl (стилі), standalone (чи потребує NgModule), imports (залежності для standalone). В Ivy метадані компілюються в static поля на класі."
      senior: "@Component — це фасад для Ivy compiler. Decorator трансформується AOT-компілятором в ɵcmp static field з ComponentDef. Поля selector, template, styles обробляються compile-time, не runtime. Selector може бути element (app-user), attribute ([appUser]), або CSS-class (.app-user) — вибір впливає на семантику DOM. encapsulation контролює Shadow DOM емуляцію, changeDetection визначає CD стратегію. З Angular 19+ standalone: true є default — поле можна не вказувати. preserveWhitespace: false за замовчуванням зменшує розмір template."
      staff: "@Component decorator — це DSL для декларативного опису UI unit. Архітектурно важливо розуміти, що metadata — це compile-time contract: AOT compiler валідує template bindings, type-checks expressions, і генерує оптимізований код. Selector strategy має наслідки для design system: element selectors для leaf components, attribute selectors для behavior augmentation (хоча directives краще для цього). encapsulation: ViewEncapsulation.None в shared library — архітектурне рішення що вимагає BEM/naming convention. changeDetection: OnPush має бути default для всього проєкту — це policy decision. В monorepo з shared components метадані selector повинні мати namespace prefix для уникнення колізій між libraries."
    commonMistakes:
      - "Не знають різницю між template і templateUrl"
      - "Вважають що standalone: true ще потрібно вказувати в Angular 19+"
    relatedQuestions: ["b2t1q2", "b2t1q3"]
  - level: "mid"
    question: "Які типи selector підтримує Angular і коли використовувати кожен?"
    referenceAnswers:
      junior: "Selector — це CSS-подібний рядок що визначає як компонент використовується в HTML. Найчастіше це ім'я тега, наприклад app-header."
      mid: "Angular підтримує element selector (app-header), attribute selector ([appTooltip]), CSS class selector (.highlight-box), і комбінації. Element selector — найпоширеніший для компонентів. Attribute selector використовується для directives і коли потрібно додати поведінку до існуючого елемента. Не підтримуються: id selector, pseudo-class selector, combinators."
      senior: "Element selector (app-user) створює custom element в DOM — семантично правильний для UI компонентів. Attribute selector ([appUser]) не створює додатковий DOM node — корисний коли компонент повинен бути attribute нативного елемента (наприклад tr[appTableRow] для table rows). CSS class selector (.app-panel) — рідко використовується, може конфліктувати з CSS. Можна комбінувати: 'button[appPrimary]' — компонент працює тільки на button елементах. :not() також підтримується: 'input:not([type=hidden])'. Для libraries рекомендовано prefix (mat-, nz-, p-) для namespace isolation."
      staff: "Selector strategy — це частина component API design. В design system: element selectors для standalone components (ds-button), attribute selectors для augmentation (button[dsButton]) — другий підхід зберігає native element accessibility та form behavior. Для migration scenarios: attribute selector дозволяє поступово замінювати нативні елементи кастомною поведінкою без зміни DOM structure. У великих командах selector naming convention повинна бути enforced через angular-eslint правила (@angular-eslint/component-selector). Composite selectors типу 'a[routerLink]:not([disabled])' використовуються у Router — це демонструє потужність pattern для conditional behavior application."
    commonMistakes:
      - "Використовують element selector для directive-подібної поведінки"
      - "Не додають prefix до selector в libraries"
    relatedQuestions: ["b2t1q1", "b2t6q1"]
  - level: "mid"
    question: "Як працює ViewEncapsulation і яку стратегію обрати?"
    referenceAnswers:
      junior: "ViewEncapsulation визначає як стилі компонента ізолюються від інших компонентів. За замовчуванням Angular додає спеціальні атрибути до елементів."
      mid: "Є три режими: Emulated (default) — Angular додає унікальні атрибути (_nghost-xxx, _ngcontent-xxx) і модифікує CSS selectors для scoping. ShadowDom — використовує native Shadow DOM браузера. None — стилі стають глобальними без scoping. Emulated — найчастіший вибір, бо працює у всіх браузерах і забезпечує ізоляцію."
      senior: "ViewEncapsulation.Emulated додає attribute selectors до кожного CSS правила: .title[_ngcontent-abc] замість .title — це compile-time transformation. Shadow DOM дає справжню ізоляцію але блокує зовнішній styling (::part() потрібен для customization). None робить стилі глобальними — корисно для base styles чи third-party overrides, але потребує naming convention (BEM). Важливий нюанс: :host selector працює в усіх режимах, ::ng-deep deprecated з v17 (але без заміни для деяких use cases). В Emulated режимі :host-context() дозволяє стилізацію на основі ancestor елементів."
      staff: "Encapsulation strategy — це архітектурне рішення для всього проєкту. Рекомендація: Emulated як default, None тільки для global utility styles. Shadow DOM — тільки якщо будуєте Web Components для використання поза Angular (Angular Elements). Для design system: token-based styling через CSS Custom Properties працює крізь encapsulation boundary — це preferred approach замість ::ng-deep. Trade-off між Emulated і ShadowDom: Emulated простіший для debugging (стилі видно в devtools), ShadowDom дає true isolation але accelerating complexity при theming. У micro-frontend архітектурі Shadow DOM prevent style leaking між MFEs — але ціна: складніший theming, проблеми з third-party libraries що inject global styles."
    commonMistakes:
      - "Використовують ::ng-deep повсюди замість CSS custom properties"
      - "Не розуміють різницю між Emulated і ShadowDom"
    relatedQuestions: ["b2t1q1", "b2t6q4"]
  - level: "senior"
    question: "Як changeDetection: OnPush впливає на поведінку компонента і коли його використовувати?"
    referenceAnswers:
      junior: "OnPush робить компонент ефективнішим — Angular перевіряє його рідше. Компонент оновлюється тільки коли змінюються його @Input значення."
      mid: "ChangeDetectionStrategy.OnPush означає що Angular пропускає change detection для компонента якщо: 1) жоден @Input не отримав нове посилання, 2) не відбулась подія з template цього компонента, 3) не викликано markForCheck() або detectChanges(). Це значно покращує performance для великих додатків. Потребує immutable data patterns — мутація об'єкта не тригерить CD."
      senior: "OnPush змінює CD behavior: компонент перевіряється тільки при зміні Input reference (не deep equality), DOM event з його template, async pipe emission, explicit markForCheck()/detectChanges(). Під капотом Ivy використовує dirty flags на LView — OnPush компонент має ChecksEnabled flag що контролюється framework. Signal-based reactivity (signal inputs, computed, effect) автоматично інтегрується з OnPush — signal notify CD framework про зміни без markForCheck(). З Angular 17+ signals + OnPush — найефективніша комбінація. Gotcha: markForCheck() помічає всю гілку від компонента до root як dirty — це O(depth) операція."
      staff: "OnPush повинен бути default change detection strategy для всього проєкту — enforce через ESLint rule. Це policy decision що вимагає team discipline: immutable updates, proper use of async pipe або signal-based reactivity. В enterprise проєкті: створити base component з OnPush, або налаштувати schematic що генерує компоненти з OnPush. Для performance profiling: Angular DevTools показує CD cycles — OnPush компоненти мають бути зеленими (skipped). При міграції legacy Default→OnPush: починати з leaf components, рухатись вгору. Zoneless Angular (experimental) робить OnPush фактично єдиною стратегією — migration до signals + OnPush — це шлях до zoneless. Архітектурний trade-off: OnPush + mutable state = баги що важко діагностувати; OnPush + signals = predictable і performant."
    commonMistakes:
      - "Мутують @Input об'єкт і дивуються що view не оновлюється"
      - "Використовують detectChanges() замість markForCheck() і ламають unidirectional data flow"
    relatedQuestions: ["b2t1q5", "b2t2q1"]
  - level: "senior"
    question: "Як правильно організувати template і styles компонента? Коли inline, коли окремий файл?"
    referenceAnswers:
      junior: "Можна писати template прямо в компоненті через template або в окремому файлі через templateUrl. Те саме зі стилями."
      mid: "Inline template (template:) зручний для маленьких компонентів (до 10-15 рядків) — все в одному файлі, швидше орієнтуватись. templateUrl краще для складних template. styleUrl (з Angular 17+, singular) дозволяє вказати один файл стилів. Inline styles (styles:) — для мінімального styling. AOT compiler обробляє обидва підходи однаково — різниця лише в DX."
      senior: "Від Angular 17: styleUrl (singular) замість styleUrls (array) — більшість компонентів мають один файл стилів. Template inline дозволяє IDE type-checking в тому ж файлі — VS Code Angular Language Service працює з обома. Для design system: окремі файли дозволяють переиспользовувати SCSS mixins/variables з @use. Стилі підтримують CSS, SCSS, Less — налаштовується в angular.json. Важливо: styles в metadata — це масив рядків що додаються ДО зовнішнього файлу. preserveWhitespace: false (default) видаляє зайві пробіли з template — економить bundle size. Можна використовувати template literal з backticks для multi-line inline templates з підсвіткою синтаксису (потребує plugin)."
      staff: "Організація template/styles — це consistency decision для всієї команди. Рекомендую: single-file components (inline template + styles) для прості компоненти (presentational), окремі файли для складні (container, form-heavy). В monorepo: schematic configuration визначає default для generate. Для performance: external templates обробляються як окремі compilation units — AOT compiler може кешувати їх. CSS-in-JS підхід неможливий (і не потрібний) завдяки encapsulation. Для design tokens: CSS Custom Properties в :host — канонічний підхід. При code review: великий inline template (>30 рядків) — сигнал для extraction. Архітектурно: standalone component з inline template і signal-based state — це future Angular pattern, натхненний SFC підходом (Vue, Svelte)."
    commonMistakes:
      - "Використовують styleUrls замість styleUrl (хоча обидва працюють)"
      - "Забувають що styles: [] перезаписує стилі з styleUrl"
    relatedQuestions: ["b2t1q1", "b2t1q3"]
---

## Core Concept

**English definition:** The @Component decorator attaches metadata to a TypeScript class, telling Angular how to create, render, and style a component — including its selector, template, styles, encapsulation mode, and change detection strategy.

**Пояснення:** @Component — це "паспорт" компонента. Він описує Angular-компілятору все що потрібно: як компонент використовується в HTML (selector), що рендерити (template), як виглядає (styles), як ізолювати стилі (encapsulation), і як часто перевіряти зміни (changeDetection).

**Яку проблему вирішує:** Без метаданих Angular не знає як перетворити TypeScript клас на UI елемент. Decorator надає декларативний спосіб описати зв'язок між логікою (клас) і представленням (DOM).

**Як працює під капотом:**

1. AOT compiler знаходить @Component decorator
2. Парсить template, валідує bindings, виконує type-checking
3. Генерує `ɵcmp` static field на класі (ComponentDef)
4. ComponentDef містить: factory function, template function, styles, encapsulation flag, change detection flag
5. Runtime використовує ComponentDef для створення LView/TView structure

```typescript
@Component({
  selector: 'app-user-card',
  template: `
    <div class="card">
      <h2>{{ user().name }}</h2>
      <p>{{ user().role }}</p>
    </div>
  `,
  styles: `
    :host { display: block; padding: 1rem; }
    .card { border: 1px solid var(--border-color, #e0e0e0); border-radius: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCard {
  user = input.required<User>();
}
```

**Trade-offs та обмеження:**

- Metadata immutable після компіляції — не можна динамічно змінити template чи selector
- ViewEncapsulation.Emulated додає attribute selectors до CSS — збільшує specificity
- OnPush потребує discipline з immutable data patterns
- Inline template без IDE plugin не має підсвітки HTML

**Версійність:**
- Angular 2: @Component з'явився — module-based, templateUrl та styleUrls обов'язкові зовнішні файли або inline
- Angular 9 (Ivy): компіляція в static fields замість NgModuleFactory
- Angular 14: standalone components (developer preview)
- Angular 15: standalone stable
- Angular 17: styleUrl (singular), standalone: true за замовчуванням в CLI
- Angular 19: standalone: true — default, поле можна опустити

## Deep Details

### Edge Cases

- **Empty selector:** Якщо selector не вказаний для standalone component — компіляція не впаде, але компонент не можна використати в template (тільки через ViewContainerRef.createComponent).
- **Duplicate selectors:** Два компоненти з однаковим selector — Angular використає той що imported/declared останнім. Немає compile-time warning!
- **styles + styleUrl:** Якщо вказати обидва — styles додаються ПЕРЕД зовнішнім файлом. Це не перезапис, а конкатенація.
- **OnPush + setTimeout:** setTimeout всередині OnPush компонента НЕ тригерить CD для цього компонента — потрібен markForCheck() або signal update.

### Junior vs Senior Understanding

**Junior** знає: "@Component має selector, template, styles — це щоб створити компонент."

**Senior** розуміє: Metadata — це compile-time contract. Вибір encapsulation, changeDetection, selector type — це архітектурні рішення що впливають на performance, maintainability, і component API design. OnPush + signals — це шлях до zoneless Angular.

```typescript
// Senior-level component з повним metadata
@Component({
  selector: 'app-dashboard-widget',
  templateUrl: './dashboard-widget.html',
  styleUrl: './dashboard-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'dashboard-widget',
    '[class.loading]': 'isLoading()',
    'role': 'article',
  },
  imports: [DatePipe, CurrencyPipe, MatProgressSpinner],
})
export class DashboardWidget {
  data = input.required<WidgetData>();
  isLoading = input(false);
}
```

### Deprecation & Migration Path

- **Deprecated:** `styleUrls` (array) — працює, але `styleUrl` (singular) рекомендований з v17
- **Deprecated:** `standalone: true` explicit — з v19 це default, поле зайве
- **Migration:** `ng generate @angular/core:standalone` мігрує NgModule components до standalone
- **Future:** Selector-less components для route-level components (обговорюється)

### Connections to Other Concepts

- **Lifecycle Hooks:** Порядок hooks визначається component tree structure
- **Input/Output:** Визначають component public API
- **Content Projection:** ng-content в template дозволяє slot-based composition
- **Host Element:** host metadata в @Component стилізує wrapper element
- **DI:** providers/viewProviders в metadata створюють component-level injector

## Examples

### Basic Usage

```typescript
// Мінімальний standalone component (Angular 19+)
@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ name() }}!</h1>`,
})
export class Greeting {
  name = input('World');
}
```

### Production Scenario

```typescript
// Design system button з attribute selector
@Component({
  selector: 'button[dsButton], a[dsButton]',
  template: `
    @if (loading()) {
      <ds-spinner [size]="'sm'" />
    }
    <span class="button-content">
      <ng-content />
    </span>
  `,
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"ds-button ds-button--" + variant()',
    '[attr.disabled]': 'disabled() || loading() ? "" : null',
    '[attr.aria-busy]': 'loading()',
  },
  imports: [DsSpinner],
})
export class DsButton {
  variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  disabled = input(false);
  loading = input(false);
}

// Usage: <button dsButton variant="primary" [loading]="saving()">Save</button>
```

### Anti-Example

```typescript
// ❌ WRONG: Default change detection + mutable state + no encapsulation
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css'],       // ← legacy array form
  encapsulation: ViewEncapsulation.None, // ← global styles leak
  // changeDetection not set — Default, CD runs on every cycle
})
export class UserListComponent {
  users: User[] = [];
  // Мутація масиву — працює з Default CD, але зламається при переході на OnPush
  addUser(user: User) { this.users.push(user); }
}

// ✅ CORRECT: OnPush + signals + encapsulation
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList {
  users = signal<User[]>([]);
  addUser(user: User) { this.users.update(list => [...list, user]); }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Default change detection скрізь | Кожен async event тригерить CD для ВСЬОГО дерева компонентів | OnPush як default + signals |
| ViewEncapsulation.None для всіх компонентів | Стилі leakають, конфлікти між компонентами | Emulated (default) + CSS Custom Properties для theming |
| Великий inline template (50+ рядків) | Погана читабельність, складний code review | Виносити в окремий .html файл |
| selector без prefix | Конфлікт з HTML елементами або іншими libraries | Prefix: app-, ds-, feature- |
| providers в кожному компоненті | Новий instance сервісу для кожного компонента | providedIn: 'root' або route-level providers |

## Interview Block

### [L1 — Warm-up] Що таке @Component decorator і які його основні поля?
**Signal being tested:** Базове розуміння структури Angular компонента
**What the interviewer expects:** Згадка selector, template, styles. Bonus: standalone, changeDetection
**How to probe deeper:** "Яка різниця між template і templateUrl? Коли що обрати?"
**Reference answer:** @Component позначає клас як Angular компонент. Основні поля: selector — як використовувати в HTML, template/templateUrl — розмітка, styles/styleUrl — стилі, changeDetection — стратегія оновлення, imports — залежності.
**Common mistakes:** Не знають про standalone; плутають template і templateUrl; не згадують changeDetection

### [L2 — Mid] Які типи selector підтримує Angular і коли використовувати кожен?
**Signal being tested:** Розуміння component API design та DOM semantics
**What the interviewer expects:** Element, attribute, class selectors. Коли attribute (button[dsButton]) кращий за element.
**How to probe deeper:** "Чому в Angular Material використовують attribute selectors для button?"
**Reference answer:** Element selector — для standalone UI components. Attribute selector — для augmentation нативних елементів (зберігає accessibility). Class selector — рідко. Combination selectors обмежують де компонент може використовуватись.
**Common mistakes:** Знають тільки element selector; не розуміють навіщо attribute selector

### [L3 — Senior] Як changeDetection: OnPush впливає на поведінку компонента?
**Signal being tested:** Performance optimization awareness та розуміння CD механізму
**What the interviewer expects:** Умови при яких OnPush компонент перевіряється, зв'язок з signals, gotchas
**How to probe deeper:** "Що станеться якщо зробити HTTP request в OnPush компоненті без async pipe?"
**Reference answer:** OnPush — компонент перевіряється при: зміні Input reference, DOM event з template, async pipe, markForCheck(). Signals автоматично інтегруються. Потребує immutable patterns. Default → OnPush — top performance win.
**Common mistakes:** Мутують Input objects; використовують detectChanges() замість markForCheck(); не знають про signal integration

### [L4 — Staff] Яка ваша стратегія для component metadata conventions в enterprise проєкті?
**Signal being tested:** Architectural thinking — conventions, enforcement, team scaling
**What the interviewer expects:** OnPush policy, selector naming convention, encapsulation strategy, ESLint rules, schematic customization
**How to probe deeper:** "Як enforce conventions в monorepo з 10+ libraries?"
**Reference answer:** OnPush enforced через ESLint. Selector prefix per library (angular-eslint rule). Emulated encapsulation default, CSS Custom Properties для theming. Custom schematic для component generation з team conventions. Code review checklist для metadata. styleUrl singular form. Inline template для simple components, external для complex.
**Common mistakes:** Не думають про enforcement; дозволяють mix Default і OnPush; ігнорують selector naming

## Summary

### Key Points
- @Component decorator — compile-time contract між класом та Angular renderer
- selector визначає API компонента — element для UI, attribute для augmentation
- ViewEncapsulation.Emulated — оптимальний default, CSS Custom Properties для theming
- ChangeDetection.OnPush повинен бути default для performance-critical додатків
- Signals + OnPush — найефективніша комбінація, шлях до zoneless
- standalone: true — default з Angular 19, explicit поле не потрібне
- styleUrl (singular) замінює styleUrls з Angular 17+

### Elevator Pitch
"@Component decorator описує Angular-компілятору все про компонент: selector визначає як його використовувати в DOM, template — що рендерити, styles з encapsulation — як ізолювати стилі. Ключові архітектурні рішення: OnPush changeDetection для performance, selector type для правильної DOM семантики, і encapsulation strategy для стилів. З Angular 19+ standalone за замовчуванням, і signal-based підхід робить OnPush ще ефективнішим."
