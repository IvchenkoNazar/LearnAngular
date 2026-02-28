---
title: "Built-in Directives & Control Flow"
block: 3
topic: 1
slug: "built-in-directives"
difficulty: 2
sinceVersion: "2"
tags: ["ngIf", "ngFor", "ngSwitch", "@if", "@for", "@switch", "ngClass", "ngStyle", "control-flow"]
relatedTopics: ["attribute-directives", "structural-directives", "component-metadata", "lifecycle-hooks"]
interviewQuestions:
  - id: "b3t1q1"
    level: "junior"
    question: "Яка різниця між *ngIf і новим @if синтаксисом?"
    referenceAnswers:
      junior: "*ngIf — це структурна директива що умовно рендерить елемент. @if — новий вбудований синтаксис з Angular 17 що робить те саме, але з більш читабельним синтаксисом без зірочки та директиви."
      mid: "*ngIf потребує імпорту CommonModule або NgIf директиви. @if — це вбудований синтаксис template engine, не директива, тому не потребує жодного імпорту. @if підтримує @else if і @else блоки нативно, тоді як *ngIf потребує ng-template з else. @if з async pipe: @if (user$ | async; as user) { } працює так само як *ngIf з as binding."
      senior: "@if є частиною нового block template syntax введеного в Angular 17. Під капотом Angular compiler трансформує @if блоки в інструкції для Ivy runtime — вони не є директивами і не мають life cycle hooks, що дає менший overhead. Performance: @if не потребує structural directive instantiation — немає ViewContainerRef overhead. Для migration: ng generate @angular/core:control-flow автоматично конвертує *ngIf → @if, *ngFor → @for, *ngSwitch → @switch. Важливий нюанс: @if підтримує тільки один binding через as: @if (service.user$ | async; as user). Стара форма *ngIf з else template reference залишається валідною але deprecated в нових проєктах."
      staff: "Перехід від structural directives до built-in control flow — це фундаментальна зміна в Angular template compilation. @if/@for/@switch компілюються безпосередньо в оптимізовані Ivy instructions, минаючи directive instantiation pipeline. Це дозволяє compiler робити dead code elimination — unreachable @if branches можуть бути виключені з bundle. З архітектурної точки зору: відмова від structural directives спрощує mental model (немає *microsyntax, немає ng-template wrapping). Для команди це означає: оновити ESLint правила для заборони старого синтаксису, налаштувати schematic що генерує код з новим синтаксисом, і поступово мігрувати кодобазу. Важливо розуміти що CommonModule більше не потрібен для control flow — це дозволяє значно зменшити bundle size в standalone components."
    commonMistakes:
      - "Думають що @if і *ngIf ідентичні за performance — @if має менший overhead"
      - "Намагаються імпортувати щось для @if — воно вбудоване і не потребує імпортів"
    relatedQuestions: ["b3t1q2", "b3t3q1"]
  - id: "b3t1q2"
    level: "mid"
    question: "Навіщо @for вимагає обов'язковий track вираз і що буде якщо track неефективний?"
    referenceAnswers:
      junior: "track допомагає Angular відстежувати елементи списку. Якщо track $index — Angular використовує позицію, якщо track item.id — використовує унікальний ідентифікатор."
      mid: "track обов'язковий в @for і вказує Angular як ідентифікувати елементи при змінах. Без правильного track Angular при зміні масиву може перестворювати DOM вузли замість переміщення. track $index — найгірший варіант для динамічних списків: при додаванні на початок Angular перестворює всі елементи. track item.id — оптимальний для списків з унікальними ID: Angular лише переміщує DOM вузли."
      senior: "Angular @for під капотом використовує алгоритм LCS (Longest Common Subsequence) для reconciliation — схожий підхід до React reconciliation. track вираз — це key function що повертає унікальний ідентифікатор. При зміні масиву Angular: 1) обчислює track value для кожного нового елемента, 2) порівнює з попередніми track values, 3) reuses DOM views для matched keys, 4) creates нові views для нових keys, 5) destroys views для видалених keys. Неефективний track (наприклад track весь об'єкт item — reference equality) може призвести до O(n²) порівнянь. track $index при видаленні елемента на початку — перебудовує весь список. Для складних об'єктів можна використовувати composite key: track item.userId + '-' + item.roleId."
      staff: "Вибір track expression — це performance-critical рішення особливо для великих списків. TrackBy функція в *ngFor (стара синтаксис) дозволяла складну логіку, @for track обмежений виразом. Для production: track завжди має бути immutable unique identifier (UUID, database PK). Архітектурний pattern: якщо бізнес-об'єкти не мають unique ID на frontend (legacy API), генерувати surrogate key при завантаженні. Проблема track $index не тільки в performance — при анімаціях (Angular Animations) неправильний track призводить до некоректних transition animations. В virtualized lists (CDK VirtualScrollViewport) правильний track критично важливий для correctness, не тільки performance. Рекомендація для команди: lint rule або code review checklist що забороняє track $index для динамічних списків."
    commonMistakes:
      - "Використовують track $index для списків що змінюються — це призводить до непотрібного DOM перестворення"
      - "Думають що track item (весь об'єкт) ефективний — Angular порівнює reference equality"
    relatedQuestions: ["b3t1q1", "b3t1q5"]
  - id: "b3t1q3"
    level: "mid"
    question: "Коли використовувати @switch, а коли краще підійде @if з @else if?"
    referenceAnswers:
      junior: "@switch використовується коли потрібно перевірити одне значення на відповідність кільком варіантам, як switch/case в JavaScript."
      mid: "@switch краще коли: перевіряємо одне значення на кілька варіантів (enum, string literals), хочемо явний @default. @if/@else if краще коли: умови різні (не одна змінна), потрібні складні boolean вирази, conditions мають різну природу. @switch використовує strict equality (===), тому не підходить для null checks."
      senior: "@switch в Angular template maps до switch/case семантики: строга рівність порівнює switchExpression з кожним @case. Важливий нюанс: @switch НЕ має fall-through behavior (не потрібен break). @default — optional але рекомендований. Performance-wise: @switch і @if/@else if компілюються в схожі Ivy instructions — різниця мінімальна. Практичний вибір: якщо більше 3 @else if блоків — розгляньте @switch або Map<key, TemplateRef> pattern. Для type safety: якщо switchExpression — TypeScript union type, TypeScript не перевіряє exhaustiveness в template (на відміну від switch в TS коді). Рекомендація: використовуйте @switch для display mode/status enum rendering."
      staff: "Вибір між @switch і @if є питанням readability і maintainability більше ніж performance. Але є системний аспект: для rendering логіки що залежить від бізнес-стану (статус замовлення, роль користувача) — @switch з чітким enum mapping є self-documenting code. Для масштабованих систем: якщо кількість варіантів постійно зростає (feature flags, A/B testing), @switch в template стає проблемою — краще component strategy pattern: Map<FeatureFlag, ComponentRef> і ngComponentOutlet. Архітектурне правило: template control flow повинен відображати UI state transitions, не бізнес-логіку. Якщо @switch в template відображає складну бізнес-логіку — це сигнал для extraction до ViewModel або Strategy pattern."
    commonMistakes:
      - "Очікують fall-through поведінку як в JS switch — її немає"
      - "Використовують @switch для null/undefined перевірок — строга рівність не підходить"
    relatedQuestions: ["b3t1q1", "b3t1q4"]
  - id: "b3t1q4"
    level: "senior"
    question: "Яка різниця між [ngClass] і прямим binding [class.name]? Коли кожен підходить?"
    referenceAnswers:
      junior: "[ngClass] дозволяє динамічно додавати/видаляти CSS класи. [class.active]='isActive' — більш коротка форма для одного класу."
      mid: "[class.name] — це Angular template syntax для одного класу: [class.active]='condition'. [ngClass] приймає string, array або object: [ngClass]=\"{'active': isActive, 'disabled': isDisabled}\". [style.property] і [ngStyle] аналогічно для стилів. Пряма форма [class.x] більш explicit і type-safe. [ngClass] з об'єктом зручний коли потрібно керувати багатьма класами одночасно."
      senior: "Angular розрізняє три механізми class binding: 1) [class]='expr' — встановлює весь className (замінює всі класи), 2) [class.name]='bool' — toggle одного класу, 3) [ngClass]='obj|arr|str' — директива з додатковою логікою. Під капотом: [class.x] компілюється в ɵɵclassProp instruction — найефективніший варіант. [ngClass] — це directive з ngOnChanges і внутрішнім KeyValueDiffer — більш дорогий. Gotcha: змішування [class]='str' і [class.x]='bool' може давати несподівані результати — Angular має precedence rules: host bindings < template bindings < class/style. З Angular 15+: [class] і [ngClass] можна безпечно комбінувати — Angular merge їх замість overwrite."
      staff: "Вибір між [class.x] і [ngClass] — це performance і maintainability trade-off. [class.x] — declarative і compile-time optimizable, [ngClass] з dynamic keys — runtime overhead. В Design System: компоненти повинні використовувати [class.x] форму — explicit і searchable (grep by class name). Проблема [ngClass] з object literal в template: {'active': isActive} — створює new object literal на кожен CD cycle, що активує ngOnChanges і KeyValueDiffer на кожній перевірці. Fix: виносити class object до computed property або getter. З Angular Signals: computed(() => ({'active': isActive(), 'error': hasError()})) — мемоізований object для [ngClass]. Архітектурно: для complex conditional styling — CSS custom properties + data attributes можуть бути кращим підходом ніж динамічні класи."
    commonMistakes:
      - "Передають new object literal в [ngClass] у template — створює зайві dirty checks через нову reference"
      - "Плутають [class]='str' (замінює всі класи) і [class.name]='bool' (toggle одного)"
    relatedQuestions: ["b3t1q3", "b3t2q1"]
  - id: "b3t1q5"
    level: "staff"
    question: "Як новий control flow (@if/@for/@switch) впливає на bundle size і change detection performance в порівнянні з директивами?"
    referenceAnswers:
      junior: "Новий синтаксис не потребує імпортувати CommonModule, тому bundle може бути меншим."
      mid: "Новий control flow вбудований в Angular compiler, тому не потрібно CommonModule. Це зменшує bundle size. @for вимагає track що покращує DOM reconciliation performance."
      senior: "Новий control flow компілюється в Ivy runtime instructions безпосередньо, минаючи directive lifecycle. *ngIf створює EmbeddedViewRef через ViewContainerRef.createEmbeddedView() — є overhead на directive instantiation і change detection traversal через directive chain. @if компілюється в умовний блок instructions без directive overhead. Для bundle: CommonModule включає NgIf, NgFor, NgSwitch, DecimalPipe, DatePipe та інші — навіть якщо використовується тільки NgIf, tree-shaking може не видалити весь CommonModule. З standalone і @if: CommonModule взагалі не потрібний — суттєве зменшення initial bundle. Performance: @for з правильним track має O(n) reconciliation замість O(n²) при наївному підході."
      staff: "Вплив на bundle і performance потрібно розглядати системно. Bundle side: перехід на control flow + standalone дозволяє повністю видалити CommonModule з vendor chunk — це може дати 10-30KB reduction в initial bundle залежно від проєкту. CD performance: built-in control flow blocks оптимізовані на рівні compiler — Angular може генерувати більш ефективні instruction sequences бо контролює весь flow замість делегування до directive. Важлива деталь: @for implicit variables ($index, $first, $last, $even, $odd, $count) не мають overhead якщо не використовуються — compiler видаляє їх. Стратегія міграції для enterprise: автоматична міграція через ng generate @angular/core:control-flow безпечна для більшості cases, але потребує тестування для edge cases з custom structural directives що взаємодіють з *ngIf/*ngFor. Довгострокова архітектура: built-in control flow — це крок до Signals-based rendering де Angular може skip CD для незмінених branches."
    commonMistakes:
      - "Думають що різниця в performance мінімальна — для великих списків і частих CD cycles різниця суттєва"
      - "Не видаляють CommonModule після міграції на новий control flow"
    relatedQuestions: ["b3t1q2", "b3t3q3"]
---

## Core Concept

**English definition:** Built-in directives are Angular's mechanism for extending HTML with dynamic behavior — structural directives manipulate the DOM tree, attribute directives modify element appearance. The new block-based control flow syntax (@if, @for, @switch) introduced in Angular 17 replaces structural directives with compiler-native instructions.

**Пояснення:** Вбудовані директиви — це Angular-спосіб додати динаміку до HTML. *ngIf показує/ховає елементи, *ngFor ітерує по списках, *ngSwitch вибирає між варіантами, [ngClass]/[ngStyle] динамічно змінюють зовнішній вигляд. З Angular 17 з'явився новий синтаксис @if/@for/@switch — це не директиви, а вбудовані блоки template engine.

**Яку проблему вирішує:** HTML статичний за природою — він не вміє умовно показувати блоки, ітерувати по даних або динамічно застосовувати стилі. Директиви і control flow вирішують це без написання DOM manipulation коду вручну.

**Як працює під капотом:** Structural directives (*ngIf, *ngFor) використовують ViewContainerRef і TemplateRef — Angular створює EmbeddedView з ng-template і вставляє/видаляє її з DOM. *ngFor внутрішньо використовує IterableDiffer для ефективного diffing масивів. Новий @if/@for/@switch компілюється AOT-компілятором в Ivy runtime instructions безпосередньо — ɵɵconditional, ɵɵrepeater — без directive instantiation overhead. [ngClass] і [ngStyle] — attribute directives з KeyValueDiffer/IterableDiffer для відстеження змін.

**Trade-offs та обмеження:** *ngIf видаляє елемент з DOM (не hide/show) — lifecycle hooks викликаються повторно. Для частого show/hide краще [hidden] або CSS visibility. @for вимагає обов'язковий track — це може бути незручним для quick prototyping. [ngClass] з object literal в template створює нові об'єкти при кожному CD cycle. ngStyle не підтримує CSS custom properties elegantly.

**Версійність:** *ngIf, *ngFor, *ngSwitch — з Angular 2, стабільні. @if, @for, @switch — developer preview в Angular 17, стабільні в Angular 17.1+. [ngClass], [ngStyle] — з Angular 2. У Angular 17+ новий control flow є рекомендованим підходом — старі structural directives deprecated для нових проєктів (але не видалені). Автоматична міграція: `ng generate @angular/core:control-flow`.

---

## Deep Details

### Edge Cases

**@if і async pipe:** `@if (data$ | async; as data)` — async pipe підписується в контексті @if, data доступна як локальна змінна. При завершенні Observable null сигналізує як falsy. Проблема: якщо Observable емітує `0` або `false` — @if буде false, хоча дані є. Краще: `@if (vm$ | async; as vm) { @if (vm.loaded) { ... } }`.

**@for і empty блок:** `@for (item of items; track item.id) { ... } @empty { <p>Список порожній</p> }` — @empty рендериться коли items порожній або null/undefined.

**ngClass з array:** `[ngClass]="['class-a', conditionalClass]"` — null/undefined значення в масиві ігноруються.

**@switch і type narrowing:** На відміну від TypeScript switch, Angular @switch не робить type narrowing — в @case блоку item все ще має тип зі всього union.

**Вкладені @for з однаковими іменами:** У вкладених @for зовнішня змінна доступна:
```typescript
@for (outer of outerList; track outer.id) {
  @for (inner of outer.items; track inner.id) {
    {{ outer.name }} - {{ inner.value }} // обидві доступні
  }
}
```

### Junior vs Senior Understanding

**Junior** знає API: *ngIf для умов, *ngFor для списків, [ngClass] для динамічних класів.

**Senior** розуміє різницю в compilation і performance:

1. **Directive instantiation cost:** *ngIf/ngFor — JavaScript об'єкти з lifecycle. @if/@for — compiler instructions без об'єктів.
2. **IterableDiffer vs track:** *ngFor з trackBy — опціональний параметр. @for track — обов'язковий, compiler enforces.
3. **KeyValueDiffer в ngClass:** При кожному CD cycle Angular запускає differ щоб виявити зміни в object. Якщо передати `{active: isActive}` literal — новий об'єкт кожного разу, differ завжди "бачить" зміни.
4. **ViewContainerRef vs built-in blocks:** Structural directives працюють через ViewContainerRef API — indirect DOM manipulation через Angular abstraction. @if/@for — direct compiler-generated instructions.

### Deprecation & Migration Path

**Deprecated (для нових проєктів):**
- `*ngIf` → `@if` (Angular 17+)
- `*ngFor` → `@for` з обов'язковим `track` (Angular 17+)
- `*ngSwitch` / `*ngSwitchCase` / `*ngSwitchDefault` → `@switch` / `@case` / `@default` (Angular 17+)

**Міграція:**
```bash
ng generate @angular/core:control-flow
```

Автоматично конвертує весь проєкт. Перевіряє template синтаксис і генерує track вирази з trackBy функцій.

**CommonModule:** після міграції на новий control flow CommonModule можна видалити з imports якщо він не потрібен для pipes (AsyncPipe, DecimalPipe тощо). Standalone components + новий control flow = мінімальний bundle.

### Connections to Other Concepts

- **Structural Directives (b3t3):** @if/@for/@switch замінюють custom structural directives для common patterns, але custom structural directives досі потрібні для complex scenarios.
- **Change Detection (b4t1):** OnPush + @for з track = мінімальна кількість CD cycles для списків.
- **Signals (b3t6):** `@if (userSignal())` реагує на signal зміни без markForCheck() — нативна інтеграція.
- **AsyncPipe (b3t4):** `@if (data$ | async; as data)` — canonical pattern для Observable-based data.

---

## Examples

### Basic Usage

```typescript
// app.component.ts
import { Component, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable, of } from 'rxjs';

interface User {
  id: number;
  name: string;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe], // тільки AsyncPipe, не весь CommonModule
  template: `
    <!-- @if з else -->
    @if (isLoggedIn()) {
      <app-dashboard />
    } @else {
      <app-login />
    }

    <!-- @if з async pipe і as -->
    @if (user$ | async; as user) {
      <h1>Привіт, {{ user.name }}</h1>

      <!-- @switch для enum-like значень -->
      @switch (user.role) {
        @case ('admin') { <app-admin-panel /> }
        @case ('user') { <app-user-panel /> }
        @default { <app-guest-view /> }
      }
    } @else {
      <app-loading />
    }

    <!-- @for з track та implicit variables -->
    @for (user of users(); track user.id) {
      <div [class.active]="user.active"
           [class.admin]="user.role === 'admin'">
        {{ $index + 1 }}. {{ user.name }}
        @if ($last) { <span>(last)</span> }
      </div>
    } @empty {
      <p>Список порожній</p>
    }
  `
})
export class AppComponent {
  isLoggedIn = signal(false);
  users = signal<User[]>([]);
  user$: Observable<User | null> = of(null);
}
```

### Production Scenario

```typescript
// product-list.component.ts — реальний production сценарій
import { Component, inject, signal, computed } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ProductService } from './product.service';

type FilterState = 'all' | 'in-stock' | 'on-sale';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe],
  template: `
    <div class="filters">
      @for (filter of filters; track filter.value) {
        <button
          [class.active]="currentFilter() === filter.value"
          (click)="currentFilter.set(filter.value)">
          {{ filter.label }}
        </button>
      }
    </div>

    @if (loading()) {
      <app-skeleton-list />
    } @else if (error()) {
      <app-error-message [message]="error()!" />
    } @else {
      @for (product of filteredProducts(); track product.id) {
        <app-product-card
          [product]="product"
          [class.highlighted]="product.onSale"
          [ngClass]="getProductClasses(product)" />
      } @empty {
        <p class="empty-state">Немає товарів за обраним фільтром</p>
      }
    }
  `
})
export class ProductListComponent {
  private productService = inject(ProductService);

  loading = signal(false);
  error = signal<string | null>(null);
  currentFilter = signal<FilterState>('all');

  filters: { value: FilterState; label: string }[] = [
    { value: 'all', label: 'Всі' },
    { value: 'in-stock', label: 'В наявності' },
    { value: 'on-sale', label: 'Акція' },
  ];

  // computed мемоізує результат — не перераховується без потреби
  filteredProducts = computed(() => {
    const products = this.productService.products();
    const filter = this.currentFilter();
    return filter === 'all' ? products
      : filter === 'in-stock' ? products.filter(p => p.inStock)
      : products.filter(p => p.onSale);
  });

  // Виносимо class object назовні template — не new object literal на кожен CD cycle
  getProductClasses(product: Product) {
    return {
      'out-of-stock': !product.inStock,
      'on-sale': product.onSale,
      'featured': product.featured,
    };
  }
}
```

### Anti-Example

```typescript
// НЕПРАВИЛЬНО — типові помилки з директивами і control flow
@Component({
  template: `
    <!-- ❌ ngClass з object literal — новий об'єкт на кожен CD cycle -->
    <div [ngClass]="{'active': isActive, 'error': hasError}">

    <!-- ❌ track $index для динамічного списку що може змінюватись -->
    @for (item of items; track $index) {
      <app-item [data]="item" />
    }

    <!-- ❌ зайвий wrapper div замість ng-container -->
    <div *ngIf="show">  <!-- legacy синтаксис + зайвий DOM елемент -->
      <span>Content</span>
    </div>

    <!-- ❌ @if для null check з можливим значенням 0 -->
    @if (count) {  <!-- 0 — falsy! -->
      <span>{{ count }} items</span>
    }
  `
})
export class BadComponent {
  // ❌ object literal в template — оцінюється на кожен CD
  // Правильно: виносити до computed property або getter
}

// ПРАВИЛЬНО
@Component({
  template: `
    <!-- ✅ виноситимо class object до getter/computed -->
    <div [ngClass]="itemClasses">

    <!-- ✅ track по унікальному ID -->
    @for (item of items; track item.id) {
      <app-item [data]="item" />
    }

    <!-- ✅ ng-container без зайвого DOM елемента + новий синтаксис -->
    @if (show) {
      <span>Content</span>
    }

    <!-- ✅ явна перевірка null для числових значень -->
    @if (count !== null && count !== undefined) {
      <span>{{ count }} items</span>
    }
  `
})
export class GoodComponent {
  get itemClasses() {
    return { active: this.isActive, error: this.hasError };
  }
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `track $index` для списків що змінюються | Angular перестворює DOM при будь-якій зміні порядку — O(n) операцій замість O(changed) | `track item.id` або інший унікальний ідентифікатор |
| `[ngClass]="{'key': cond}"` object literal в template | Новий об'єкт на кожен CD cycle активує KeyValueDiffer навіть якщо нічого не змінилось | Винести до `get classes()` або `computed()` |
| `*ngIf="item"` для числових значень | `0`, `-1`, `NaN` є falsy — умова буде false для валідних даних | `*ngIf="item !== null && item !== undefined"` або `@if (item != null)` |
| Старий `*ngIf`/`*ngFor` в нових проєктах | Потребує CommonModule import, більший overhead | Новий @if/@for/@switch — вбудований в compiler |
| `[ngStyle]` для статичних CSS значень | Runtime overhead для значень що не змінюються | CSS класи або CSS custom properties |

---

## Interview Block

### [L1 — Warm-up] Яка різниця між *ngIf і новим @if синтаксисом?

**Signal being tested:** Чи в курсі кандидат про Angular 17 control flow і чи розуміє базову різницю між directive і built-in syntax.

**What the interviewer expects:** Кандидат повинен знати що @if вбудований і не потребує імпортів, згадати @else if/@else як покращення.

**How to probe deeper:** "Чи є різниця в performance між @if і *ngIf? Що відбувається під капотом при компіляції?"

**Reference answer:** *ngIf — це структурна директива з CommonModule що умовно рендерить елемент через ViewContainerRef. @if — вбудований в Angular 17+ template syntax що компілюється в Ivy instructions без directive overhead. @if не потребує жодних imports, підтримує @else if/@else нативно. Міграція: `ng generate @angular/core:control-flow`.

**Common mistakes:** Думають що різниця тільки в синтаксисі і не знають про performance implications. Не знають про автоматичну міграцію.

---

### [L2 — Mid] Навіщо @for вимагає обов'язковий track і як правильно його обрати?

**Signal being tested:** Чи розуміє кандидат DOM reconciliation і чому track критично важливий для performance і correctness.

**What the interviewer expects:** Пояснення алгоритму reconciliation, різниця між track $index і track item.id з конкретними наслідками.

**How to probe deeper:** "Що відбудеться з анімаціями якщо використовувати track $index для списку що змінює порядок?"

**Reference answer:** track вираз — це key function для DOM reconciliation. Angular порівнює track values між старим і новим масивом для визначення: які DOM views reuse, які move, які create/destroy. track $index — найгірший варіант для змінних списків: додавання елемента на початок призводить до перестворення всіх DOM nodes. track item.id — оптимальний: Angular лише переміщує існуючі views. Composite key: `track item.userId + '-' + item.roleId` для складних об'єктів.

**Common mistakes:** Використовують track $index "бо зручно" і не замислюються над performance. Думають що track весь об'єкт (track item) ефективний.

---

### [L3 — Senior] Яка різниця між [ngClass] і [class.name] під капотом? Чому [ngClass] з object literal в template — anti-pattern?

**Signal being tested:** Чи розуміє кандидат як Angular compiles різні форми class binding і як KeyValueDiffer впливає на CD performance.

**What the interviewer expects:** Пояснення compilation output (ɵɵclassProp vs directive instantiation), розуміння KeyValueDiffer overhead, practical recommendation.

**How to probe deeper:** "Як виправити [ngClass] performance якщо ви не можете уникнути dynamic class objects? Як Signals допомагають тут?"

**Reference answer:** `[class.active]='cond'` компілюється в `ɵɵclassProp('active', cond)` — один instruction виклик. `[ngClass]='obj'` — instantiates NgClass directive з KeyValueDiffer що порівнює keys/values на кожен CD. Проблема object literal `{'active': isActive}`: Angular створює новий об'єкт при кожному CD cycle — differ бачить "нові" дані і перевіряє всі keys. Fix: `get classes() { return {'active': this.isActive} }` — reference не змінюється якщо значення не змінились. З Signals: `computed(() => ({'active': isActive()}))` — мемоізований через Signal graph.

**Common mistakes:** Думають що Angular "розуміє" що object literal семантично однаковий між renders. Не знають про KeyValueDiffer.

---

### [L4 — Staff/Principal] Як новий control flow (@if/@for/@switch) змінює architecture великого Angular проєкту з точки зору bundle size, CD performance і migration strategy?

**Signal being tested:** Чи може кандидат думати системно про migration impact, bundle optimization, і long-term architecture implications.

**What the interviewer expects:** Системний аналіз bundle impact (CommonModule видалення), CD improvements (compiler-native instructions), migration strategy з ризиками і автоматизацією.

**How to probe deeper:** "Які edge cases при автоматичній міграції ng generate @angular/core:control-flow потребують ручної перевірки?"

**Reference answer:** Системний impact: 1) Bundle — CommonModule може бути повністю видалений для standalone components що використовують тільки @if/@for — потенційно 10-30KB в initial chunk. 2) CD performance — built-in blocks компілюються в оптимізовані Ivy instructions без directive instantiation, особливо помітно для великих @for списків. 3) Migration: автоматична через schematic безпечна для більшості cases, але потребує тестування edge cases: trackBy functions з side effects, custom structural directives що взаємодіють з *ngFor, template references в else blocks. 4) Long-term: новий control flow — крок до zoneless rendering де Angular може skip стані branches без running CD. Рекомендація: спочатку мігрувати shared library components де зменшення bundle розміру максимально впливає.

**Common mistakes:** Фокусуються тільки на синтаксичній зміні не бачачи architectural implications. Не думають про CommonModule cleanup після міграції.

---

## Summary

### Key Points

- @if, @for, @switch — вбудований control flow Angular 17+, не directive, не потребують imports і мають менший CD overhead
- @for вимагає обов'язковий track — вибір track expression критично впливає на DOM reconciliation performance
- [class.name]='bool' компілюється в ɵɵclassProp — ефективніше ніж [ngClass] з object literal
- [ngClass] з object literal в template створює нові об'єкти на кожен CD cycle — виносити до getter або computed()
- CommonModule більше не потрібний після міграції на новий control flow — суттєве зменшення bundle
- Автоматична міграція: ng generate @angular/core:control-flow безпечна для більшості проєктів
- @for implicit variables ($index, $first, $last, $even, $odd, $count) не мають overhead якщо не використовуються

### Elevator Pitch (2 minutes)

Angular має два покоління control flow: старе (NgIf, NgFor, NgSwitch — structural directives з CommonModule) і нове (Angular 17+: @if, @for, @switch — compiler-native blocks). Нові краще в трьох аспектах: не потребують imports, мають менший runtime overhead (немає directive instantiation), і @for з обов'язковим track явно покращує DOM reconciliation. Для class binding: пряма форма [class.active]='cond' ефективніша за [ngClass] з object literal, бо уникає KeyValueDiffer overhead. Практичне правило: нові проєкти — тільки новий control flow, існуючі — мігрувати через schematic.
