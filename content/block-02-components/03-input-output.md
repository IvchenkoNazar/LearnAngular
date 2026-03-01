---
title: "Input/Output & Component Communication"
block: 2
topic: 3
slug: "input-output"
difficulty: 2
sinceVersion: "2"
tags: ["input", "output", "signal-inputs", "model", "two-way-binding", "EventEmitter"]
relatedTopics: ["component-metadata", "lifecycle-hooks", "content-projection", "signals"]
interviewQuestions:
  - level: "junior"
    question: "Як передати дані від parent до child компонента і назад?"
    referenceAnswers:
      junior: "Від parent до child — через @Input або signal input(). Від child до parent — через @Output з EventEmitter або output() function. Parent передає значення через property binding [prop]='value', child emit'ить подію (event)='handler($event)'."
      mid: "Parent → child: property binding [data]='value' з @Input() або input(). Child → parent: event binding (save)='onSave($event)' з @Output() EventEmitter або output(). Двостороння: model() signal з [(value)] banana-in-a-box syntax. Signal inputs — immutable, мають transform і required options. output() function повертає OutputEmitterRef замість EventEmitter. Alias дозволяє перейменувати public API без зміни internal property name."
      senior: "Input/Output — це component public API contract. Signal inputs (input()) створюють InputSignal<T> — read-only, reactive, type-safe. input.required<T>() — compile-time enforcement. transform option дозволяє coerce values (наприклад, booleanAttribute для string→boolean). output() створює OutputEmitterRef — чистіший API без RxJS dependency. model() — InputSignal + OutputSignal в одному, для two-way binding. Під капотом: [(value)] розгортається в [value]='expr' (valueChange)='expr=$event'. Для performance: OnPush перевіряє Input reference equality — immutable updates обов'язкові. input() і output() працюють з inject() context — можна створити utility functions."
      staff: "Input/Output design — це component API design, аналог function signature. Принципи: мінімальний Input set (single responsibility), typed Output events (не any), required inputs для mandatory data. Signal inputs змінюють architectural patterns: замість ngOnChanges → computed/effect для derived state. model() спрощує form-like components але порушує one-way data flow — використовувати обережно (form controls, toggles). Для component library: input transform дозволяє backward-compatible API changes (приймати string і number). Output як Observable (outputToObservable) — bridge для RxJS-heavy codebase. Naming convention: outputs як дієслово в минулому (saved, deleted, statusChanged) — consistency across team. В monorepo: input/output types повинні бути exported для consumers."
    commonMistakes:
      - "Мутують Input object замість створення нового"
      - "Використовують EventEmitter з @Output як Observable (subscribe в parent)"
    relatedQuestions: ["b2t3q2", "b2t3q3"]
  - level: "mid"
    question: "Яка різниця між @Input() decorator і signal input()? Коли мігрувати?"
    referenceAnswers:
      junior: "Signal input() — новіший спосіб, створює signal замість звичайної property. Рекомендований для нових проєктів."
      mid: "@Input() створює mutable property — Angular напряму встановлює значення. input() створює InputSignal — read-only, reactive. Signal inputs інтегруються з computed() і effect() без ngOnChanges. input() підтримує required, transform, alias. Мігрувати варто в нових компонентах, для legacy — при рефакторингу. Schematic: ng generate @angular/core:signal-input-migration."
      senior: "Ключові відмінності: 1) @Input property mutable — можна перезаписати (anti-pattern). InputSignal — read-only. 2) @Input тригерить ngOnChanges. Signal input тригерить effect/computed. 3) Signal inputs мають type-safe transform: input(0, { transform: numberAttribute }) — compiler валідує. 4) input.required<User>() — compile-time error якщо parent не передав. 5) Signal input доступний через dependency graph — Angular знає коли перевіряти компонент. Migration: @angular/core:signal-input-migration schematic конвертує автоматично. Caveat: ngOnChanges перестає працювати для migrated inputs."
      staff: "Migration від @Input до signal inputs — це project-wide decision. Strategy: 1) Нові компоненти — тільки signal inputs. 2) Shared libraries — signal inputs з coercion через transform для backward compat. 3) Legacy migration — bottom-up, leaf components першими. 4) Testing: InputSignal тестується через componentRef.setInput() або fixture wrappers. Архітектурний вплив: signal inputs + computed замінюють складні ngOnChanges chains — derived state стає declarative. Для form components: model() замість input() + output() pair. Interop: outputFromObservable() і outputToObservable() — bridge між signal і RxJS worlds. ESLint rule для enforce signal inputs в нових файлах. Compile-time required inputs — type-safe component API contract, аналог required props в React."
    commonMistakes:
      - "Намагаються set() signal input (він read-only)"
      - "Забувають що ngOnChanges не працює з signal inputs"
    relatedQuestions: ["b2t3q1", "b2t3q4"]
  - level: "mid"
    question: "Як працює model() і two-way binding? Коли його використовувати?"
    referenceAnswers:
      junior: "model() дозволяє two-way binding — дані йдуть від parent до child і назад. Використовується з [()] синтаксисом."
      mid: "model() створює ModelSignal — writable signal що автоматично генерує Change event. [(value)]='signal' розгортається у [value]='signal()' (valueChange)='signal.set($event)'. model() замінює pattern @Input() value + @Output() valueChange = new EventEmitter(). Використовувати для form-like компонентів: toggles, sliders, custom inputs. model.required<T>() для обов'язкових."
      senior: "model() — це InputSignal + OutputEmitterRef в одному. Під капотом: model('default') створює writable signal що при set() або update() автоматично emit'ить valueChange event. Parent може bind через [(value)] (two-way) або тільки [value] (one-way down). model() зберігає Angular unidirectional data flow: child emit'ить event, parent вирішує що робити. На відміну від Vue v-model: Angular model() — explicit, один model per property. Для ControlValueAccessor: model() спрощує custom form control реалізацію. Gotcha: model() без parent binding створює local writable signal — корисно для standalone component state."
      staff: "model() — це ergonomic sugar для common two-way binding pattern. Архітектурно: two-way binding порушує strict one-way data flow — використовувати тільки для leaf UI components (form controls, toggles, accordions). Container components повинні використовувати input() + output() для explicit data flow. В design system: model() для value-like props (checked, expanded, selectedIndex), output() для action events (save, delete). Testing: model() можна тестувати як signal (set/update) плюс як output (subscribe to changes). Для complex forms: model() + ControlValueAccessor дає найчистішу інтеграцію з ReactiveFormsModule. Caveat: model() values не участвують в dependency injection — для cross-component state use signals in services."
    commonMistakes:
      - "Використовують model() для всього замість input()+output()"
      - "Не розуміють що [()] — це синтаксичний цукор"
    relatedQuestions: ["b2t3q1", "b2t3q2"]
  - level: "senior"
    question: "Як працюють output() function і OutputEmitterRef? Чим відрізняються від EventEmitter?"
    referenceAnswers:
      junior: "output() — новий спосіб створення Output подій замість @Output з EventEmitter."
      mid: "output() створює OutputEmitterRef — lightweight alternative до EventEmitter. EventEmitter extends Subject (RxJS) — overhead для простого event emission. OutputEmitterRef має тільки emit() і subscribe() без RxJS dependency. output() підтримує alias. outputFromObservable() конвертує Observable в output. outputToObservable() — навпаки."
      senior: "EventEmitter — це Subject з RxJS, що тягне весь RxJS в bundle навіть для простих events. OutputEmitterRef — мінімальний API: emit(value) і internal subscription mechanism. output<T>() type-safe, працює з inject() context. outputFromObservable(obs$) — bridge для cases коли output базується на Observable stream (наприклад, debounced search). outputToObservable(outputRef) — для parent що потребує RxJS operators. Під капотом: Angular template compiler генерує subscription на output при (event) binding — це не RxJS subscription, а internal callback. DestroyRef автоматично cleanup'ить output subscriptions."
      staff: "output() — це частина Angular's move away від RxJS for component API. Стратегічно: Signal inputs + output() function = component API без RxJS dependency. EventEmitter не deprecated, але не рекомендований для нових проєктів. В enterprise migration: не потрібно мігрувати всі @Output — вони binary compatible. outputFromObservable() дозволяє complex event streams (debounce, merge) з clean component API. Для testing: OutputEmitterRef має subscribable interface — тестується через spy або direct subscription. Naming: output() alias дозволяє rename без breaking change — important для published libraries. Architecture decision: outputs як verbs (clicked, submitted), inputs як nouns (data, config) — це semantic contract."
    commonMistakes:
      - "Вважають що EventEmitter deprecated"
      - "Subscribe на EventEmitter в parent component замість template binding"
    relatedQuestions: ["b2t3q1", "b2t3q5"]
  - level: "senior"
    question: "Як працюють input transform і required? Наведіть приклади production використання."
    referenceAnswers:
      junior: "required робить Input обов'язковим. transform перетворює значення при передачі."
      mid: "input.required<T>() — compiler error якщо parent не передасть значення. transform option: input(false, { transform: booleanAttribute }) — приймає string з HTML template і конвертує в boolean. numberAttribute — для чисел. Можна писати custom transform functions. alias перейменовує public binding name."
      senior: "required inputs — compile-time contract enforcement. AOT compiler перевіряє що parent template передає всі required inputs — error при build. transform має signature (value: InputType) => TransformType — InputType визначає що parent може передати, TransformType — що component отримає. Built-in: booleanAttribute ('' → true, 'false' → false, null → false), numberAttribute (string → number). Custom: input('', { transform: (v: string) => v.trim().toLowerCase() }). Alias: input({ alias: 'externalName' }) — public API відрізняється від internal name. Для libraries: transform забезпечує backward compat (приймати string | number, внутрішньо — тільки number). required + transform: input.required({ transform: numberAttribute })."
      staff: "Input transform і required — це tools для robust component API design. В design system: booleanAttribute для всіх boolean inputs (HTML attributes завжди strings), numberAttribute для numeric. Custom transforms для validation/normalization — але не для complex logic (це responsibility компонента). required vs optional: default values для optional inputs повинні бути sensible (not null). Для cross-team collaboration: required inputs документують component contract в коді — TypeScript compiler стає documentation tool. Migration strategy: додавання required до existing input — breaking change для consumers, потребує major version bump в library. Transform + generic types: можна створити type-safe coercion pipeline. Performance: transform виконується один раз при Input set, не при кожному read — це O(1) overhead."
    commonMistakes:
      - "Пишуть складну бізнес-логіку в transform замість computed"
      - "Забувають booleanAttribute для boolean inputs в template"
    relatedQuestions: ["b2t3q2", "b2t3q3"]
---

## Core Concept

**English definition:** Inputs and Outputs define the public API of an Angular component — inputs accept data from parent components via property binding, outputs emit events to parents via event binding, and model() provides two-way data binding.

**Пояснення:** Input/Output — це "контракт" між parent і child компонентами. Input приймає дані зверху ([data]="value"), Output відправляє події вгору ((saved)="onSave($event)"). model() об'єднує обидва для two-way binding ([(value)]="signal"). Це основний механізм компонентної комунікації в Angular.

**Яку проблему вирішує:** Компоненти повинні бути ізольованими та reusable. Input/Output забезпечує controlled data flow: parent повністю контролює що передає, child — які події emit'ить. Без цього механізму компоненти не могли б спілкуватись без tight coupling.

**Як працює під капотом:**

1. AOT compiler аналізує template bindings `[input]="expr"` і `(output)="handler($event)"`
2. Для inputs: compiler генерує код що встановлює property при кожному CD cycle (якщо expression змінилась)
3. Signal inputs: compiler створює InputSignal, update через internal `set` (не public)
4. Для outputs: compiler створює listener що викликає handler при emit()
5. model(): compiler генерує і input binding і output listener, пов'язує через ModelSignal

```typescript
@Component({
  selector: 'app-search-box',
  template: `
    <input
      [value]="query()"
      (input)="onInput($event)"
      [placeholder]="placeholder()"
    />
    @if (query()) {
      <button (click)="clear()">Clear</button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBox {
  // Signal inputs
  placeholder = input('Search...');
  debounceMs = input(300, { transform: numberAttribute });

  // Two-way binding
  query = model('');

  // Output
  searched = output<string>();

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searched.emit(value);
    }, this.debounceMs());
  }

  clear() {
    this.query.set('');
    this.searched.emit('');
  }
}
// Parent: <app-search-box [(query)]="searchTerm" (searched)="onSearch($event)" />
```

**Trade-offs та обмеження:**

- Signal inputs read-only — child не може модифікувати Input (це feature, не bug)
- model() порушує strict one-way data flow — обережно з container components
- EventEmitter — RxJS overhead для простого event emission
- Output cannot be bound with [] — тільки ()

**Версійність:**
- Angular 2: @Input(), @Output(), EventEmitter
- Angular 16: signal inputs (developer preview), input.required()
- Angular 17: signal inputs stable, output() function, model()
- Angular 17.1: input transform з booleanAttribute, numberAttribute
- Angular 18: model() stable

## Deep Details

### Edge Cases

- **Input без binding:** Якщо parent не передає значення — @Input має undefined, signal input має default. input.required() — compile error.
- **Output без listener:** emit() без parent listener — нічого не відбувається, no error.
- **model() без two-way binding:** `[value]="expr"` без `()` — працює як one-way input.
- **Signal input в template expression:** `{{ data() }}` — виклик signal, не property access. Забути `()` — покаже Signal object.
- **transform + required:** `input.required({ transform: numberAttribute })` — parent передає string, component отримує number.

### Junior vs Senior Understanding

**Junior** знає: "@Input — дані вхід, @Output — дані вихід."

**Senior** розуміє: Input/Output — це component API design. Signal inputs з required і transform створюють type-safe, self-documenting API. model() — для UI controls з two-way binding. output() зменшує RxJS dependency. Правильний API design: мінімум inputs (SRP), typed outputs, meaningful defaults.

```typescript
// Senior: Design system select з повним API
@Component({
  selector: 'ds-select',
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsSelect<T> {
  options = input.required<T[]>();
  value = model<T | null>(null);
  labelFn = input<(item: T) => string>(item => String(item));
  disabled = input(false, { transform: booleanAttribute });
  placeholder = input('Select...');

  opened = output<void>();
  closed = output<void>();
  filtered = output<string>();
}
```

### Deprecation & Migration Path

- **Not deprecated but not recommended:** @Input(), @Output() with decorators
- **Recommended:** input(), output(), model() functions
- **Migration schematic:** `ng generate @angular/core:signal-input-migration`
- **EventEmitter → output():** Straightforward, output() has simpler API
- **@Input + @Output pair → model():** For two-way binding patterns

### Connections to Other Concepts

- **Lifecycle Hooks:** ngOnChanges тригерится @Input, НЕ signal inputs
- **Change Detection:** OnPush перевіряє Input reference equality
- **Content Projection:** Alternative communication через ng-content template context
- **ViewChild/ContentChild:** Imperative access до child component inputs/outputs

## Examples

### Basic Usage

```typescript
// Parent
@Component({
  selector: 'app-parent',
  template: `
    <app-counter [initial]="5" (changed)="onCountChange($event)" />
  `,
  imports: [Counter],
})
export class Parent {
  onCountChange(value: number) {
    console.log('Count:', value);
  }
}

// Child
@Component({
  selector: 'app-counter',
  template: `
    <button (click)="decrement()">-</button>
    <span>{{ count() }}</span>
    <button (click)="increment()">+</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Counter {
  initial = input(0);
  changed = output<number>();

  count = signal(0);

  constructor() {
    effect(() => this.count.set(this.initial()));
  }

  increment() {
    this.count.update(v => v + 1);
    this.changed.emit(this.count());
  }

  decrement() {
    this.count.update(v => v - 1);
    this.changed.emit(this.count());
  }
}
```

### Production Scenario

```typescript
// Reusable data table з typed inputs/outputs
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  // Required data
  data = input.required<T[]>();
  columns = input.required<ColumnDef<T>[]>();

  // Optional config
  pageSize = input(25, { transform: numberAttribute });
  selectable = input(false, { transform: booleanAttribute });
  sortable = input(true, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });

  // Two-way: selected rows
  selected = model<T[]>([]);

  // Events
  sorted = output<SortEvent<T>>();
  pageChanged = output<PageEvent>();
  rowClicked = output<T>();

  // Derived state via computed
  protected totalPages = computed(() =>
    Math.ceil(this.data().length / this.pageSize())
  );
}

// Usage:
// <app-data-table
//   [data]="users()"
//   [columns]="columnDefs"
//   [(selected)]="selectedUsers"
//   (sorted)="onSort($event)"
//   [loading]="isLoading()"
//   pageSize="50"        ← string! numberAttribute converts to 50
//   selectable            ← empty attribute! booleanAttribute converts to true
// />
```

### Anti-Example

```typescript
// ❌ WRONG: Mutating input, EventEmitter as Observable
@Component({
  selector: 'app-bad-list',
  template: `<div *ngFor="let item of items">{{ item.name }}</div>`,
})
export class BadListComponent {
  @Input() items: Item[] = [];
  @Output() changed = new EventEmitter<Item[]>();

  addItem(item: Item) {
    this.items.push(item);  // ❌ Мутація Input — зламає OnPush parent
    this.changed.emit(this.items); // ❌ Та сама reference
  }
}

// ✅ CORRECT: Immutable update, signal-based
@Component({
  selector: 'app-good-list',
  template: `
    @for (item of items(); track item.id) {
      <div>{{ item.name }}</div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodList {
  items = input.required<Item[]>();
  added = output<Item>();

  addItem(item: Item) {
    this.added.emit(item); // Parent decides how to update
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Mutating @Input object/array | Breaks OnPush, unpredictable parent state | Emit event, let parent update immutably |
| Too many inputs (10+) | Component does too much, hard to use | Split into smaller components, use config object input |
| EventEmitter.subscribe() в parent | Not intended API, leak if not unsubscribed | Use template (event) binding |
| model() для все | Порушує one-way data flow, hard to trace changes | model() тільки для form-like controls |
| @Input() без default і без required | undefined at runtime, no compile-time check | input.required() або input(defaultValue) |

## Interview Block

### [L1 — Warm-up] Як передати дані між parent і child?
**Signal being tested:** Базове розуміння component communication
**What the interviewer expects:** [input]="value" для down, (output)="handler" для up
**How to probe deeper:** "А як зробити two-way binding?"
**Reference answer:** Parent → child через property binding [data]="value" з input(). Child → parent через event binding (saved)="onSave($event)" з output(). Two-way: model() з [(value)] синтаксисом.
**Common mistakes:** Плутають [] і (); не знають про signal inputs

### [L2 — Mid] @Input() vs input() — яка різниця?
**Signal being tested:** Awareness of modern Angular API
**What the interviewer expects:** Signal vs mutable property, required, transform, ngOnChanges incompatibility
**How to probe deeper:** "Що таке input transform і навіщо booleanAttribute?"
**Reference answer:** @Input() — mutable property, тригерить ngOnChanges. input() — read-only InputSignal, reactive з computed/effect. required для compile-time check. transform для value coercion. booleanAttribute/numberAttribute для HTML attribute conversion.
**Common mistakes:** Намагаються set() signal input; забувають що ngOnChanges не працює

### [L3 — Senior] Як output() і OutputEmitterRef відрізняються від EventEmitter?
**Signal being tested:** Understanding of Angular's RxJS decoupling strategy
**What the interviewer expects:** Lightweight vs Subject, bridge functions, API differences
**How to probe deeper:** "Як використати RxJS operators з output()?"
**Reference answer:** EventEmitter extends Subject — RxJS overhead. OutputEmitterRef — мінімальний API (emit). output() не залежить від RxJS. outputFromObservable() — bridge для Observable streams. outputToObservable() — для parent що потребує operators. DestroyRef auto-cleanup.
**Common mistakes:** Вважають EventEmitter deprecated; subscribe на output в TypeScript замість template

### [L4 — Staff] Як спроєктувати Input/Output API для reusable component library?
**Signal being tested:** API design thinking, versioning, cross-team concerns
**What the interviewer expects:** required vs optional strategy, transform for compat, naming conventions, breaking changes
**How to probe deeper:** "Як додати required input до existing library component без breaking change?"
**Reference answer:** Signal inputs з required для mandatory data, defaults для optional. transform для backward compat (string→number). Naming: inputs як nouns, outputs як past-tense verbs. model() тільки для value controls. Alias для rename без breaking change. Export types для consumers. ESLint rules для conventions. Adding required = major version (breaking). Генерувати wrapper components для migration path.
**Common mistakes:** Зламують API без semver; model() для all communication; no transform for HTML attributes

## Summary

### Key Points
- input() створює read-only InputSignal — type-safe, reactive, з required і transform
- output() створює OutputEmitterRef — lightweight event emission без RxJS
- model() — two-way binding signal, використовувати для form-like controls
- booleanAttribute / numberAttribute — built-in transforms для HTML attribute coercion
- input.required<T>() забезпечує compile-time API contract
- [(value)] — синтаксичний цукор для [value]+( valueChange)
- Signal inputs НЕ тригерять ngOnChanges — використовувати effect()/computed()

### Elevator Pitch
"Input/Output визначають public API компонента. Signal inputs (input()) — read-only reactive signals з type-safe required і transform. output() — lightweight event emission без RxJS dependency. model() об'єднує input+output для two-way binding. Ключове: required inputs дають compile-time safety, transform (booleanAttribute, numberAttribute) забезпечує correct HTML attribute handling. Це foundation для component-driven architecture з controlled, predictable data flow."
