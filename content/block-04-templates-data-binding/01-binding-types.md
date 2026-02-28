---
title: "Binding Types"
block: 4
topic: 1
slug: "binding-types"
difficulty: 2
sinceVersion: "2"
tags: ["property-binding", "attribute-binding", "class-binding", "style-binding", "interpolation"]
relatedTopics: ["event-binding", "template-reference-variables", "built-in-directives", "component-metadata"]
interviewQuestions:
  - id: "b4t1q1"
    level: "junior"
    question: "Яка різниця між property binding [value] і attribute binding [attr.value]?"
    referenceAnswers:
      junior: "Property binding [value] встановлює DOM property елемента, а attribute binding [attr.value] встановлює HTML attribute. Зазвичай використовують property binding."
      mid: "HTML attributes ініціалізують DOM properties при створенні елемента, після чого properties живуть незалежно. [value] встановлює DOM property безпосередньо — це працює для стандартних DOM properties. [attr.colspan] потрібен коли DOM property не існує, наприклад colspan у td, або для ARIA атрибутів [attr.aria-label]. Property binding більш ефективний бо працює з DOM API напряму."
      senior: "Розрізняти attribute і property — фундаментальне розуміння DOM. HTML attribute — це те що записано в HTML розмітці, DOM property — JavaScript поле на DOM об'єкті. Не всі attributes мають відповідні properties і навпаки. Наприклад: textContent — DOM property без відповідного attribute, colspan — attribute що mapped на colSpan property. Angular property binding [prop] компілюється в ɵɵproperty instruction що викликає element.prop = value. Attribute binding [attr.x] компілюється в ɵɵattribute що викликає setAttribute(). Для SVG елементів потрібен attribute binding бо SVG attributes не mapped до DOM properties. Gotcha: [disabled]='false' встановлює property false (працює), але attr.disabled='false' встановлює attribute 'false' — що для boolean attributes означає enabled, бо presence = true."
      staff: "Binding types — це compiler-level abstraction над DOM API. Angular compiler аналізує template AST і генерує різні Ivy instructions: ɵɵproperty для property binding, ɵɵattribute для attribute binding, ɵɵclassProp/ɵɵstyleProp для class/style binding. Це важливо для performance: property binding — один assignment, attribute binding — setAttribute() виклик що може trigger attribute changed callback в custom elements. Для Web Components interop: property binding працює якщо custom element визначає property, інакше потрібен attribute binding. В Design System архітектурі: рекомендація — визначати properties на custom elements і використовувати property binding для performance. Angular Compiler розрізняє binding target на compile-time: якщо directive має @Input з тим же ім'ям — це directive input binding, не DOM property. Це може створювати subtle баги коли directive ім'я overlap з DOM property."
    commonMistakes:
      - "Плутають HTML attributes з DOM properties — attributes ініціалізують, properties відображають поточний стан"
      - "Використовують [attr.disabled] замість [disabled] — для boolean DOM properties це працює некоректно"
    relatedQuestions: ["b4t1q2", "b4t1q3"]
  - id: "b4t1q2"
    level: "mid"
    question: "Коли interpolation {{ }} і property binding [prop] не є взаємозамінними?"
    referenceAnswers:
      junior: "Interpolation підставляє значення як string, а property binding передає значення як є. Для string значень вони однакові."
      mid: "Interpolation {{ expr }} завжди конвертує результат в string через toString(). Property binding [prop]='expr' передає значення будь-якого типу. Вони не взаємозамінні коли: потрібно передати boolean/number/object — [disabled]='isDisabled' передає boolean, а disabled='{{isDisabled}}' передає string 'true'/'false'. Для string properties вони еквівалентні: [title]='myTitle' і title='{{myTitle}}'. Interpolation не можна використовувати для non-string атрибутів і event binding."
      senior: "Під капотом Angular compiler обробляє interpolation і property binding по-різному. Interpolation {{a}} на атрибуті компілюється в ɵɵpropertyInterpolate instruction — Angular робить string coercion. Multi-interpolation src='{{base}}/{{path}}' компілюється в ɵɵpropertyInterpolate2. Property binding [src]='fullUrl' компілюється в ɵɵproperty — assignment без coercion. Критичний нюанс: для security-sensitive properties (innerHTML, src, href) — Angular sanitization відрізняється. [innerHTML]='htmlContent' проходить через DomSanitizer, але innerHTML='{{htmlContent}}' також sanitized. Для style binding: style='color: {{color}}' — небезпечно, [style.color]='color' — sanitized. Ще один edge case: interpolation в directive input: якщо @Input coerce працює — coercion не спрацює з interpolation бо значення завжди string."
      staff: "На системному рівні вибір між interpolation і property binding впливає на change detection granularity. Angular compiler для interpolation генерує comparison із попереднім string значенням — якщо вираз не змінився, DOM не оновлюється. Для property binding — comparison з попереднім значенням через identity check. Це означає: якщо getter повертає new object кожен раз — property binding буде оновлювати DOM щоразу (reference inequality), а interpolation — тільки якщо string representation змінилася. Архітектурна рекомендація: завжди property binding для non-string inputs і component inputs, interpolation — тільки для text content. З Signals: signal() value через [prop]='mySignal()' — compiler може оптимізувати change detection path. В template compiler pipeline: interpolation tokens парсяться окремо від binding expression і мають інший AST node type — це впливає на custom template tooling (language service, linters)."
    commonMistakes:
      - "Використовують interpolation для передачі об'єктів в child component — завжди потрібен property binding"
      - "Не розуміють що interpolation завжди повертає string"
    relatedQuestions: ["b4t1q1", "b4t1q3"]
  - id: "b4t1q3"
    level: "senior"
    question: "Як Angular обробляє class і style binding конфлікти між host bindings і template bindings?"
    referenceAnswers:
      junior: "Angular дозволяє додавати класи через [class.name] або [ngClass] директиву."
      mid: "В Angular можна задавати класи на рівні host і template. Host binding задається через @HostBinding або host property в компоненті, а template binding — в template де компонент використовується. Angular merge обидві sets класів."
      senior: "Angular має чітку систему пріоритетів для class/style bindings: template bindings перезаписують host bindings при конфлікті на конкретному класі/стилі. Порядок пріоритету (від найвищого): 1) template [style.x]='...' 2) template [class.x]='...' 3) directive host [style.x] 4) directive host [class.x] 5) component host [style.x] 6) component host [class.x]. Ivy runtime підтримує styling priority queue — StylingContext в TView зберігає ordered list of binding sources. Якщо компонент визначає @HostBinding('class.active') і в template є [class.active] — template виграє. Але: Angular merge класи що не конфліктують — host class.bold і template class.active обидва застосовуються. Для style: Angular підтримує units — [style.width.px]='100' компілюється в ɵɵstyleProp('width', 100, 'px')."
      staff: "Styling priority resolution — один з найскладніших аспектів Angular runtime. Ivy зберігає styling instructions в TView.data як linked list з priority levels. При кожному CD cycle Angular iterates instructions і застосовує тільки winning value для кожного style property/class. Це O(n) де n — кількість binding sources для одного property. В legacy ViewEngine була StylingContext — складний state machine що було major source of bugs. Ivy спростив це до sequential comparison. Для Design System компонентів: рекомендація — мінімізувати host style bindings і дозволяти override через template. Використовувати CSS custom properties замість прямих style bindings — це уникає priority conflicts. Для component API: замість @HostBinding('class.variant-primary') краще CSS variable --component-variant з fallback. Це також дозволяє CD optimization — CSS variables не потребують Angular re-evaluation."
    commonMistakes:
      - "Не розуміють priority між host і template bindings — template завжди має вищий пріоритет"
      - "Думають що host і template class bindings повністю перезаписують один одного — Angular merge non-conflicting classes"
    relatedQuestions: ["b4t1q1", "b4t1q4"]
  - id: "b4t1q4"
    level: "senior"
    question: "Що відбувається під капотом коли Angular виконує property binding з точки зору change detection?"
    referenceAnswers:
      junior: "Angular перевіряє чи змінилось значення і оновлює DOM якщо так."
      mid: "Angular при кожному change detection cycle порівнює поточне значення binding expression з попереднім. Якщо значення змінилось — оновлює DOM property. Це порівняння відбувається через strict equality (===). Для object reference — потрібна нова reference для оновлення."
      senior: "Property binding компілюється в Ivy instruction ɵɵproperty(propName, value). При CD cycle Angular викликає instruction, яка: 1) отримує поточне значення виразу, 2) порівнює з попереднім значенням збереженим в LView (bindingIndex), 3) якщо identity check (===) показує зміну — викликає renderer.setProperty() або прямий DOM assignment. LView — це flat array де binding values зберігаються послідовно за binding index. Для interpolation — bindingUpdated перевіряє кожну частину. devMode додає expressionChangedAfterItHasBeenChecked перевірку — другий CD cycle порівнює значення і кидає помилку якщо вони змінились між першим і другим проходом. Це гарантує unidirectional data flow."
      staff: "CD binding check — це hot path в Angular runtime і оптимізований для performance. LView slots для bindings виділяються compiler-ом на compile time — binding index є константою в generated code. Порівняння через === означає що immutable data patterns (NgRx, Signals) дають найкращу performance — якщо reference не змінилась, жодного DOM update. З Signals integration (Angular 17+): якщо binding expression є signal() — Angular може skip перевірку якщо signal не був marked dirty. Це fundamental shift: від pull-based CD (перевірити всі bindings) до push-based (signal каже що змінився). Для enterprise архітектури: OnPush + immutable data + signal inputs — це шлях до максимальної CD performance. Проблема: getter в template (get value()) створює нове значення кожен CD — завжди dirty. Рішення: кешування через signal або computed."
    commonMistakes:
      - "Використовують getters що повертають нові об'єкти в template — кожен CD cycle буде dirty"
      - "Не розуміють що Angular порівнює через === — мутація об'єкту не тригерить оновлення при OnPush"
    relatedQuestions: ["b4t1q3", "b4t1q5"]
  - id: "b4t1q5"
    level: "staff"
    question: "Як би ви спроектували систему binding для Design System бібліотеки враховуючи performance, DX і cross-framework interop?"
    referenceAnswers:
      junior: "Я б використовував Angular Input/Output для передачі даних між компонентами."
      mid: "Для Design System потрібна чітка API: inputs через property binding для конфігурації, outputs через EventEmitter для подій. Документація повинна описувати всі доступні inputs і outputs. Для performance варто використовувати OnPush."
      senior: "Design System binding architecture потребує: 1) Signal inputs (input()) для reactive і fine-grained CD — кожен input окремий signal. 2) CSS custom properties для theming замість style bindings — не потребують CD. 3) Content projection через ng-content для гнучкого layout. 4) Typed inputs через generics де можливо. 5) Coercion для boolean attributes: input.required<boolean>({transform: booleanAttribute}). Host bindings мінімальні — дозволити consumers override через template. Output через output() замість EventEmitter для кращого tree-shaking."
      staff: "Проектування binding системи для enterprise Design System — це architectural decision з довгостроковими наслідками. Рекомендований підхід: Signal-based component API з input()/output()/model() — це foundation для Angular reactivity. CSS custom properties з design tokens — theming без Angular CD overhead. Component variants через data attributes [attr.data-variant] замість class bindings — більш semantic і CSS-queryable. Для cross-framework interop: Angular Elements (custom elements) потребують property binding для складних типів і attribute binding для primitives — проектувати API з обома шляхами. Performance budget: кожен binding — це slot в LView і CD check — мінімізувати кількість bindings через composition. Для Web Component output: CustomEvent замість Angular-specific EventEmitter. Content projection: multiple slots через select attribute — design slot naming convention для команди. Deprecation strategy: коли потрібно змінити input name/type — використовувати alias і transform для backward compatibility."
    commonMistakes:
      - "Не враховують cross-framework interop — Angular-specific bindings не працюють в Web Components контексті"
      - "Занадто багато окремих inputs замість одного config object — збільшує CD overhead"
    relatedQuestions: ["b4t1q3", "b4t1q4"]
---

## Core Concept

**English definition:** Binding types in Angular are mechanisms that connect component data to the DOM — property binding sets DOM properties, attribute binding sets HTML attributes, class binding toggles CSS classes, style binding applies inline styles, and interpolation renders text content.

**Пояснення:** Angular пропонує кілька типів binding для з'єднання даних компоненту з DOM. Property binding `[prop]="expr"` — встановлює DOM property напряму. Attribute binding `[attr.name]="expr"` — встановлює HTML attribute через `setAttribute()`. Class binding `[class.name]="condition"` — toggle CSS класу. Style binding `[style.prop]="value"` — inline стиль. Interpolation `{{ expr }}` — виведення тексту. Кожен тип має свою семантику, performance характеристики і use cases.

**Яку проблему вирішує:** HTML є статичним — значення атрибутів і properties задані один раз. Bindings дозволяють реактивно оновлювати DOM при зміні даних компоненту, створюючи декларативний зв'язок між application state і UI без прямого DOM manipulation.

**Як працює під капотом:** Angular compiler парсить template і для кожного binding генерує відповідну Ivy instruction. Property binding → `ɵɵproperty(propName, value)` — пряме присвоєння DOM property. Attribute binding → `ɵɵattribute(attrName, value)` — виклик `setAttribute()`. Class binding → `ɵɵclassProp(className, value)` — toggle через `classList.add/remove`. Style binding → `ɵɵstyleProp(styleName, value, suffix)` — `style.setProperty()`. Interpolation → `ɵɵpropertyInterpolateN()` — string concatenation + property set. Всі binding values зберігаються в LView (flat array) за binding index — при кожному CD cycle Angular порівнює нове значення з попереднім через `===` і оновлює DOM тільки при зміні.

**Trade-offs та обмеження:** Property binding не працює для атрибутів без відповідних DOM properties (ARIA, colspan, SVG). Interpolation завжди конвертує в string — не підходить для non-string inputs. Class/style binding з об'єктними literals створює нові references на кожному CD cycle. Style binding не підтримує shorthand properties (margin: 10px 20px) — потрібен окремий binding для кожної сторони. При великій кількості bindings на елементі — кожен додає slot в LView і CD check.

**Версійність:** Всі типи binding доступні з Angular 2. Property/attribute/class/style binding залишаються стабільними без major API змін. Angular 9 (Ivy) змінив внутрішню реалізацію — перехід від ViewEngine StylingContext до оптимізованих Ivy instructions. Angular 16+ з Signals: binding expressions можуть використовувати signal() для push-based updates. Angular 17+ signal inputs — `input()` function замість `@Input()` decorator.

---

## Deep Details

### Edge Cases

**Boolean attributes:** HTML boolean attributes (disabled, readonly, hidden) працюють за presence — `<input disabled>` означає disabled. `[attr.disabled]="false"` встановить attribute зі значенням "false" — що все одно означає disabled! Правильно: `[disabled]="false"` (property binding) або `[attr.disabled]="condition ? '' : null"` (null видаляє attribute).

**SVG bindings:** SVG attributes (viewBox, cx, cy) не мають DOM property equivalents — потрібен attribute binding: `[attr.viewBox]="myViewBox"`. Просто `[viewBox]` не працює.

**Style units:** Angular підтримує unit suffix: `[style.width.px]="100"`, `[style.fontSize.em]="1.5"`. Без suffix потрібно передавати повне значення зі string: `[style.width]="'100px'"`.

**Null/undefined handling:** Property binding з null/undefined значенням встановлює property як null/undefined. Attribute binding з null видаляє attribute (removeAttribute). Class binding з falsy — видаляє клас. Style binding з null — видаляє inline style.

**Interpolation у attribute context:** `<img src="{{url}}">` працює, але Angular DomSanitizer може заблокувати небезпечні URL. `<a href="javascript:{{expr}}">` буде sanitized.

### Junior vs Senior Understanding

**Junior** знає синтаксис: `[prop]`, `{{expr}}`, `[class.x]`, `[style.x]` і коли кожен використовувати.

**Senior** розуміє:

1. **Compilation pipeline:** Кожен binding type генерує різну Ivy instruction з різними performance характеристиками. `ɵɵproperty` — найшвидший (пряме присвоєння), `ɵɵattribute` — повільніший (setAttribute DOM API call), `ɵɵclassProp` — оптимізований для className manipulation.

2. **LView binding storage:** Binding values зберігаються в flat array LView. Кожен binding займає один slot. Compiler генерує код що порівнює `lView[bindingIndex]` з новим значенням — якщо рівні (===), DOM не чіпається. Це пояснює чому mutation не тригерить update при OnPush.

3. **Styling priority system:** Angular merge class/style bindings з різних джерел (host, template, directive) з чіткою priority queue. Template bindings завжди виграють.

4. **Security context:** Angular розрізняє security contexts — NONE, HTML, STYLE, URL, RESOURCE_URL. Залежно від binding target Angular застосовує різну sanitization через DomSanitizer.

### Deprecation & Migration Path

Binding types стабільні з Angular 2 і не мають deprecated API. Зміни в implementation:
- Angular 9 (Ivy): нова внутрішня реалізація styling — StylingContext замінений на sequential instruction execution.
- Angular 14: `@Input({transform})` для coercion — замінює ручний coercion в setter.
- Angular 16: Signal inputs `input()` — новий спосіб визначити inputs, property binding синтаксис `[prop]` залишається.
- Angular 17.1+: `input.required()` для mandatory inputs.

### Connections to Other Concepts

- **Change Detection:** Binding values перевіряються під час CD cycle. OnPush components тригерять CD тільки при зміні input reference.
- **Signals:** Signal-based inputs дозволяють fine-grained reactivity — binding expression `[prop]="mySignal()"` інтегрується з signal-based CD.
- **DomSanitizer:** Security-sensitive bindings (innerHTML, src, href) проходять через sanitization pipeline.
- **Directives:** Directive inputs використовують той самий property binding синтаксис — Angular resolver визначає чи target це DOM property чи directive input.

---

## Examples

### Basic Usage

```typescript
@Component({
  selector: 'app-binding-demo',
  standalone: true,
  template: `
    <!-- Property binding -->
    <img [src]="imageUrl" [alt]="imageAlt">
    <input [value]="name" [disabled]="isDisabled">

    <!-- Attribute binding -->
    <td [attr.colspan]="columnSpan">Merged cell</td>
    <div [attr.aria-label]="accessibleLabel">Accessible</div>

    <!-- Interpolation -->
    <h1>{{ title }}</h1>
    <p>{{ user.firstName }} {{ user.lastName }}</p>

    <!-- Class binding -->
    <div [class.active]="isActive"
         [class.highlighted]="isHighlighted">
      Toggle classes
    </div>

    <!-- Style binding -->
    <div [style.width.px]="containerWidth"
         [style.backgroundColor]="bgColor"
         [style.opacity]="isVisible ? 1 : 0.5">
      Styled element
    </div>
  `
})
export class BindingDemoComponent {
  imageUrl = '/assets/logo.png';
  imageAlt = 'Company Logo';
  name = 'Angular';
  isDisabled = false;
  columnSpan = 3;
  accessibleLabel = 'Navigation menu';
  title = 'Binding Types Demo';
  user = { firstName: 'John', lastName: 'Doe' };
  isActive = true;
  isHighlighted = false;
  containerWidth = 300;
  bgColor = '#f0f0f0';
  isVisible = true;
}
```

### Production Scenario

```typescript
@Component({
  selector: 'app-data-table',
  standalone: true,
  template: `
    <table [attr.aria-label]="tableLabel"
           [class.striped]="config.striped"
           [class.compact]="config.compact"
           [style.maxHeight.px]="config.maxHeight">
      <thead>
        <tr>
          @for (col of columns; track col.key) {
            <th [attr.aria-sort]="getSortDirection(col)"
                [class.sortable]="col.sortable"
                [class.sorted]="sortedColumn === col.key"
                [style.width.px]="col.width"
                (click)="col.sortable && sort(col)">
              {{ col.label }}
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of rows; track row.id) {
          <tr [class.selected]="selectedIds.has(row.id)"
              [class.disabled]="row.disabled"
              [attr.data-row-id]="row.id">
            @for (col of columns; track col.key) {
              <td [attr.colspan]="col.colspan ?? null"
                  [style.textAlign]="col.align ?? 'left'">
                {{ row[col.key] }}
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `
})
export class DataTableComponent {
  @Input() columns: ColumnDef[] = [];
  @Input() rows: Record<string, any>[] = [];
  @Input() config: TableConfig = { striped: true, compact: false, maxHeight: 500 };

  tableLabel = 'Data table';
  sortedColumn = '';
  selectedIds = new Set<string>();

  getSortDirection(col: ColumnDef): string | null {
    if (this.sortedColumn !== col.key) return null;
    return col.sortDirection ?? 'ascending';
  }

  sort(col: ColumnDef): void {
    this.sortedColumn = col.key;
  }
}
```

### Anti-Example

```typescript
// WRONG: interpolation для non-string values
@Component({
  template: `
    <!-- Передає string "true"/"false" замість boolean -->
    <app-child disabled="{{ isDisabled }}"></app-child>

    <!-- Передає string "[object Object]" замість об'єкту -->
    <app-child config="{{ config }}"></app-child>

    <!-- Object literal в template — new reference на кожен CD -->
    <div [ngClass]="{ 'active': isActive, 'error': hasError }"></div>

    <!-- attr.disabled зі string — елемент завжди disabled -->
    <button [attr.disabled]="isDisabled">Click</button>
  `
})
export class BadBindingComponent {
  isDisabled = false;
  config = { theme: 'dark' };
  isActive = true;
  hasError = false;
}

// CORRECT:
@Component({
  template: `
    <!-- Property binding передає boolean -->
    <app-child [disabled]="isDisabled"></app-child>

    <!-- Property binding передає object reference -->
    <app-child [config]="config"></app-child>

    <!-- Computed class object або окремі class bindings -->
    <div [class.active]="isActive" [class.error]="hasError"></div>

    <!-- Property binding для boolean DOM property -->
    <button [disabled]="isDisabled">Click</button>
  `
})
export class GoodBindingComponent {
  isDisabled = false;
  config = { theme: 'dark' };
  isActive = true;
  hasError = false;
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Interpolation для non-string inputs: `disabled="{{ val }}"` | Передає string замість boolean/object — child component отримує неправильний тип | Property binding: `[disabled]="val"` |
| Object literal в template: `[ngClass]="{'a': x}"` | Створює new object reference на кожен CD cycle — KeyValueDiffer бачить зміни щоразу | Окремі class bindings `[class.a]="x"` або computed property в компоненті |
| `[attr.disabled]="false"` для boolean attributes | String "false" — truthy attribute, елемент залишається disabled | `[disabled]="false"` (property binding) або `[attr.disabled]="condition ? '' : null"` |
| Getter що повертає new object: `[style]="getStyles()"` | Створює new reference кожен CD — Angular вважає значення dirty | Cache через `computed()` signal або stored property |
| Прямий style binding для theming: `[style.color]="themeColor"` | CD overhead для кожного styled element, не cascadeable | CSS custom properties через `style.setProperty('--color', value)` |

---

## Interview Block

### [L1 — Warm-up] Яка різниця між property binding [value] і attribute binding [attr.value]?
**Signal being tested:** Розуміння фундаментальної різниці між HTML attributes і DOM properties — базове знання DOM API.
**What the interviewer expects:** Кандидат пояснює що attributes ініціалізують properties, properties відображають поточний стан, і Angular працює з обома через різні API.
**How to probe deeper:** "Наведіть приклад коли property binding не працює і потрібен attribute binding."
**Reference answer:** HTML attributes і DOM properties — різні речі. Attributes визначені в HTML розмітці і ініціалізують DOM при парсингу. DOM properties — JavaScript поля на DOM об'єктах що відображають поточний стан. Property binding `[value]` встановлює DOM property через пряме присвоєння. Attribute binding `[attr.colspan]` викликає `setAttribute()`. Потрібен attribute binding коли DOM property не існує (colspan, ARIA, SVG attributes).
**Common mistakes:** Плутають attributes і properties; думають що вони завжди відповідають один одному; не знають що boolean attributes працюють за presence (disabled="false" все одно disabled).

### [L2 — Mid] Коли interpolation {{ }} і property binding [prop] не є взаємозамінними?
**Signal being tested:** Глибина розуміння type coercion в Angular templates і вплив на component communication.
**What the interviewer expects:** Кандидат знає що interpolation завжди повертає string, пояснює наслідки для non-string inputs і компонентної взаємодії.
**How to probe deeper:** "Що відбувається з sanitization при interpolation vs property binding для innerHTML?"
**Reference answer:** Interpolation `{{ expr }}` завжди конвертує результат в string. Property binding `[prop]="expr"` передає значення як є. Вони не взаємозамінні для: boolean inputs (disabled), object inputs (config), number inputs. Для string attributes — еквівалентні. Під капотом interpolation компілюється в `ɵɵpropertyInterpolate` з string coercion, property binding — в `ɵɵproperty` без coercion.
**Common mistakes:** Використовують interpolation для передачі objects в child components; не розуміють що `disabled="{{ false }}"` передає string "false".

### [L3 — Senior] Як Angular обробляє class і style binding конфлікти між host bindings і template bindings?
**Signal being tested:** Розуміння styling priority system в Ivy runtime і архітектурні наслідки для component design.
**What the interviewer expects:** Кандидат описує priority queue, пояснює merge behavior для non-conflicting bindings і override для conflicting, знає внутрішню реалізацію.
**How to probe deeper:** "Як би ви уникнули priority conflicts при проектуванні Design System компонента?"
**Reference answer:** Angular має priority system: template bindings > directive host bindings > component host bindings. При конфлікті на одному class/style property — виграє вищий пріоритет. Non-conflicting bindings merge. Ivy зберігає styling instructions в TView з priority levels і при CD виконує sequential comparison. Для кожного style property/class — застосовується winning value.
**Common mistakes:** Думають що host і template bindings повністю перезаписують один одного; не знають про priority ordering між directive і component host bindings.

### [L4 — Staff/Principal] Як би ви спроектували систему binding для Design System бібліотеки враховуючи performance, DX і cross-framework interop?
**Signal being tested:** Архітектурне мислення, розуміння trade-offs між Angular-specific API і platform-neutral підходами.
**What the interviewer expects:** Системний підхід: signal inputs для reactivity, CSS custom properties для theming, Web Components interop через property/attribute dual API, CD optimization strategy.
**How to probe deeper:** "Як би ви обробляли breaking changes в component binding API при major version upgrade?"
**Reference answer:** Signal-based API з `input()`/`output()`/`model()` як foundation. CSS custom properties для theming — не потребують CD. Component variants через data attributes. Для cross-framework: Angular Elements з dual property/attribute API. Мінімізація bindings — кожен binding це LView slot і CD check. Content projection з named slots. Deprecation через alias і transform для backward compatibility.
**Common mistakes:** Не враховують cross-framework interop; занадто багато дрібних inputs замість structured config; не думають про CD impact при масштабуванні.

---

## Summary

### Key Points
- Angular розрізняє 5 типів binding: property, attribute, class, style, interpolation — кожен з різною Ivy instruction і performance profile
- Property binding працює з DOM properties (пряме присвоєння), attribute binding — з HTML attributes (setAttribute)
- Interpolation завжди конвертує в string — не підходить для non-string inputs
- Class/style bindings мають priority system: template > directive host > component host
- Binding values зберігаються в LView flat array і порівнюються через === при кожному CD cycle
- Object literals в template створюють new reference на кожен CD — використовувати computed або cached properties
- Signals integration дозволяє push-based updates замість pull-based CD checks

### Elevator Pitch (2 minutes)
Angular binding types — це bridge між component data і DOM. Property binding `[prop]` встановлює DOM properties напряму, attribute binding `[attr.x]` — для HTML attributes без DOM property equivalent. Interpolation `{{ }}` — для text content, завжди string. Class `[class.x]` і style `[style.x]` binding — оптимізовані shortcuts для className і inline styles. Під капотом кожен тип компілюється в специфічну Ivy instruction — property binding найшвидший (пряме присвоєння), attribute — повільніший (setAttribute). Всі binding values кешуються в LView і порівнюються через === — мутації не тригерять update. Для production: використовуйте property binding для non-string values, окремі class bindings замість ngClass з object literals, CSS custom properties для theming замість style bindings.
