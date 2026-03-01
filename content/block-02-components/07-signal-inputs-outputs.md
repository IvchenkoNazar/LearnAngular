---
title: "Signal Inputs, Outputs, and Two-Way Binding with model()"
block: 2
topic: 7
slug: "signal-inputs-outputs"
difficulty: 3
sinceVersion: "17"
tags: ["input", "output", "model", "signal-inputs", "two-way-binding", "component-api"]
relatedTopics: ["signals-intro", "input-output", "reactive-forms"]
interviewQuestions:
  - level: "junior"
    question: "Що таке signal inputs у Angular 17+? Чим відрізняються від @Input() decorator?"
    referenceAnswers:
      junior: "signal inputs — це новий спосіб оголошувати inputs компонента через функцію input(). Вони є Signals, тому можна використовувати у computed() та effect()."
      mid: "input() повертає InputSignal — Signal що автоматично оновлюється коли батько передає нове значення. Переваги: 1) Type-safe (обов'язковий vs optional з defaultValue). 2) Composable — можна використовувати у computed без підписок. 3) Простіший код — менше boilerplate ніж ngOnChanges + @Input. 4) input.required() — must-provide, TypeScript error якщо не передано. input(defaultValue) — optional з дефолтом."
      senior: "InputSignal vs @Input decorator: 1) Lifecycle: @Input + ngOnChanges для реакції на зміни. InputSignal у computed або effect — reactive. 2) Type safety: input.required<T>() — compile-time error якщо не передано. @Input() required: true — тільки runtime Angular warning. 3) Transform: input(default, { transform: (v) => v.trim() }) — inline трансформація. Vs @Input({ transform }) — та сама функціональність. 4) Readonly: InputSignal — read-only всередині компонента, батько контролює. 5) withComponentInputBinding() у Router — route params автоматично map до signal inputs. 6) Performance: signal inputs інтегровані у signal-based CD — точніше відстеження що змінилось."
      staff: "Signal inputs архітектурно: 1) Replacement for @Input + ngOnChanges pattern. 2) Route integration: Router з withComponentInputBinding() передає params/query як signal inputs — компонент не потребує ActivatedRoute inject. 3) Host directive signal inputs — дозволяє host directives передавати inputs. 4) Implicit coercion: input(0, { transform: numberAttribute }) — Angular Material pattern для attribute-based inputs. 5) Signal inputs і OnPush: InputSignal змінений → Angular знає що перевіряти, без full tree check. 6) Migration: ng g @angular/core:signal-input-migration для автоматичної міграції @Input → input(). 7) Component library design: signal inputs — кращий API для reusable components, explicit required vs optional."
    commonMistakes:
      - "Думають input() можна записати всередині компонента — InputSignal read-only"
      - "Не знають withComponentInputBinding() для Router integration"
      - "Плутають input.required() і input() з undefined default"
    relatedQuestions: ["b2t7q2", "b2t7q3"]
  - level: "mid"
    question: "Як output() відрізняється від @Output() EventEmitter? Що таке outputFromObservable()?"
    referenceAnswers:
      junior: "output() — нова функція для оголошення outputs замість @Output() EventEmitter. outputFromObservable() дозволяє використати Observable як output."
      mid: "output<T>() повертає OutputEmitterRef. emit(value) для виклику. Переваги: не extends Subject (EventEmitter extends Subject), тому немає subscription semantics. Більш type-safe — не можна subscribe у template. outputFromObservable(obs$) — дозволяє Observable бути джерелом output: кожен emit Observable = output event. Корисно коли output це stream з existing Observable pipeline."
      senior: "output() vs @Output() EventEmitter: 1) EventEmitter extends Subject — у Angular рекомендується не підписуватися на EventEmitter напряму (лише через template event binding). output() — explicit: тільки emit(), немає Observable interface. 2) Type safety: output<number>() — inference. EventEmitter<number>() — теж типізований але extra Subject API. 3) outputFromObservable(source$) — bridge Observable до output: кожен source$ next → output event. Automatic subscription management. 4) Teardown: outputFromObservable() auto-unsubscribes при component destroy. 5) outputToObservable() — обратна конверсія: OutputRef → Observable для composability. 6) RxJS integration: можна pipe() operators перед outputFromObservable: `outputFromObservable(clicks$.pipe(throttleTime(500)))`."
      staff: "Component API design з новими outputs: 1) output() для events, не state — event = 'щось відбулось', state = 'поточне значення'. 2) outputFromObservable для streams-based APIs: WebSocket message stream → output. 3) Component library: output() кращий API ніж EventEmitter — чіткіше separation of concerns. 4) Testing: outputRef.emit() у тестах, або outputToObservable() для перевірки. 5) Angular DevTools: outputs відображаються окремо від properties. 6) Migration: ng g @angular/core:output-migration. 7) Interop з legacy: OutputRef можна обгорнути у toObservable(outputToObservable(ref)) якщо потрібна Observable semantics."
    commonMistakes:
      - "subscribe() на output() — OutputEmitterRef не Observable"
      - "Не знають outputFromObservable() і пишуть ручне subscribe з EventEmitter"
      - "Думають output() — те саме що EventEmitter"
    relatedQuestions: ["b2t7q1", "b2t7q3"]
  - level: "senior"
    question: "Що таке model() у Angular і як реалізується two-way binding з сигналами?"
    referenceAnswers:
      junior: "model() — це двостороннє прив'язування через сигнал. Батько передає значення і може отримати назад зміни від дитини."
      mid: "model<T>() створює ModelSignal — writable signal у дочірньому компоненті що emit updates до батьківського binding. Поєднує input і output: `<child [(value)]=\"parentValue\">`. У дочірньому: `value = model(defaultValue)` — можна і читати (signal) і записувати. При `value.set(v)` — emits до батька. Синтактичний цукор над `[value]=\"parentSig()\" (valueChange)=\"parentSig.set($event)\"`."
      senior: "model() internals: ModelSignal = WritableSignal + OutputEmitterRef combined. `model<T>(initialValue?)` — writable: set(), update(). При set() — emit 'modelChange' output. Батько з `[(model)]` binding: автоматично зв'язує [model] input і (modelChange) output. model.required() — обов'язковий варіант. Transform: `model(default, { transform })`. Відмінність від ControlValueAccessor: model() — simpler для non-form scenarios. CVA — для форм (FormControl integration). model() — для component-to-component two-way binding поза формами. Приклад: dialog visibility, accordion open state, paginator pageIndex — де батько і дитина обидва керують значенням."
      staff: "model() як architectural pattern: 1) Colocated state: компонент і батько ділять state через two-way binding без окремого service. 2) vs ControlValueAccessor: CVA — forms protocol (writeValue, registerOnChange, registerOnTouched). model() — simpler у non-form scenarios. Але: Angular Material components поступово мігрують до model() від CVA де доречно. 3) Composability: model() у дочірньому + signal() у батьківському + computed від обох — powerful reactive graph. 4) Testing: `fixture.componentRef.setInput('value', ...)` тестує model input. Output через `spyOn` або outputToObservable(). 5) Migrate from EventEmitter pattern: `@Input() value; @Output() valueChange = new EventEmitter()` → `value = model()`. 6) Directives: model() у directives для two-way binding на host element properties."
    commonMistakes:
      - "model() і @Input + @Output EventEmitter(valueChange) — не знають різниці"
      - "model() для forms (замість ControlValueAccessor) — неправильне застосування"
      - "Не розуміють що model.set() у дочірньому emit до батька"
    relatedQuestions: ["b2t7q2", "b2t7q4"]
  - level: "mid"
    question: "Як використати withComponentInputBinding() для передачі route params як signal inputs?"
    referenceAnswers:
      junior: "withComponentInputBinding() у провайдерах роутера дозволяє передавати параметри маршруту напряму у inputs компонента."
      mid: "provideRouter(routes, withComponentInputBinding()) — включає feature де Angular автоматично map route params, query params, і data до @Input() або input() компонента. Тобто замість inject(ActivatedRoute) і subscribe на params — просто `id = input.required<string>()` і Router автоматично set 'id' з route params."
      senior: "withComponentInputBinding() mapping: route param ':id' → input named 'id'. Query param '?page=1' → input named 'page'. Route data `{ data: { title: 'Home' } }` → input named 'title'. Resolve result `{ user: UserResolver }` → input named 'user'. Signal inputs: `id = input.required<string>()` — Angular calls setInput('id', value) при navigation. При navigation: Angular set всі mapped inputs. Signal input автоматично оновлюється. computed() що залежить від input — автоматично recalculates. Обмеження: тільки snake_case → camelCase conversion не відбувається автоматично. 'user-id' param → input named 'userId' не mapped — потрібен точний match."
      staff: "Router + Signal inputs architecture: 1) Eliminate ActivatedRoute injection — компонент не залежить від Router API, чистіший code. 2) Route param change → signal input change → computed recalculate → UI update. Повністю reactive без subscriptions. 3) Resolver results як inputs: route data через resolver → input() у компоненті. 4) Testing: `fixture.componentRef.setInput('id', '123')` замість mock ActivatedRoute — простіший тест setup. 5) Query params: `page = input<number>(1, { transform: numberAttribute })` + withComponentInputBinding() — page number з URL automatically. 6) Matrix params: `;id=123` → input named 'id'. 7) Coexistence з ActivatedRoute: можна мати і input() і inject(ActivatedRoute) — але prefer input() для new code."
    commonMistakes:
      - "Забувають withComponentInputBinding() у provideRouter — route params не передаються"
      - "Не знають що resolver results теж map до inputs"
      - "Name mismatch між route param і input name — не map"
    relatedQuestions: ["b2t7q3", "b2t7q5"]
  - level: "staff"
    question: "Як спроєктувати компонентний API використовуючи signal inputs, outputs і model?"
    referenceAnswers:
      junior: "Використати input() для пропсів, output() для подій, model() для двостороннього зв'язку."
      mid: "Good component API: input.required() для обов'язкових, input(default) для опціональних, output() для events, model() для two-way binding. Трансформації через transform option. Документувати через JSDoc."
      senior: "API design principles з Signals: 1) input.required<T>() — compile-time enforcement, no undefined in component. 2) Provide defaults де можливо: input(false) для toggles, input([]) для lists. 3) transform для type coercion: `input(0, { transform: numberAttribute })` для attribute inputs. 4) output<T>() — strongly typed events, не EventEmitter<any>. 5) model() для controlled components — де parent може both read and control value. 6) Composability: computed від inputs як public readonly: `readonly fullName = computed(() => `${this.first()} ${this.last()}`)`. 7) Immutability: не mutate input values — вони read-only."
      staff: "Enterprise component API strategy: 1) API surface minimization: менше inputs/outputs — легше підтримувати. 2) input + computed = 'derived props' pattern (як in React). 3) Versioning: signal inputs change = component interface change = potential breaking. 4) Documentation: generate component API docs з TSDoc + @angular/core metadata. 5) Testing contract: input values → expected output, snapshot testing для complex UIs. 6) Accessibility: signal inputs для aria attributes. 7) Component library: public API = inputs + outputs contract. Private implementation = signals + computeds inside. 8) Design system: consistent naming — modelValue/modelChange, not random naming. 9) Storybook integration: controls map до signal inputs. 10) Migration from @Input: automatic via ng g @angular/core:signal-input-migration, but verify transform functions."
    commonMistakes:
      - "Too many input signals — over-complicated API"
      - "output() for state changes (should be events only)"
      - "Not documenting required vs optional distinction"
    relatedQuestions: ["b2t7q4", "b11t1q5"]
---

## Core Concept

**English definition:** Angular 17+ provides Signal-based component APIs: `input()` creates a read-only InputSignal automatically updated by the parent, `output()` creates an OutputEmitterRef for emitting events, and `model()` creates a ModelSignal for two-way binding combining input and output semantics. These replace the `@Input()`, `@Output() EventEmitter`, and `@Input()/@Output() valueChange` decorator patterns.

**Пояснення:** Нові APIs спрощують component interface declaration: замість трьох декораторів (`@Input`, `@Output`, `ngOnChanges`) — три функції з кращим type safety і Signal integration. input() — батьківський контроль. output() — дочірні events. model() — shared control.

**Яку проблему вирішує:**
- **Boilerplate:** `@Input() @Output() ngOnChanges` → `input() computed() output()`
- **Type safety:** `input.required<T>()` — compile-time enforcement vs runtime @Input warning
- **Reactivity:** InputSignal у computed() без підписок чи ngOnChanges
- **Two-way binding:** model() замість @Input + @Output EventEmitter(nameChange) pattern

**Як працює під капотом:**

```typescript
// input() — read-only Signal updated by Angular when parent sets prop
type InputSignal<T> = Signal<T> & { // WritableSignal internally, but readonly publicly
  transform?: TransformFn<T>;
}

// Angular calls internally: componentRef.setInput('propName', value)
// When parent binding changes → setInput → signal updates → computed/effect re-run

// output<T>() — emit function wrapper
type OutputEmitterRef<T> = {
  emit(value: T): void;
  subscribe(observer: OutputRefSubscriber<T>): OutputRefSubscription;
}

// model() — combined input + output
type ModelSignal<T> = WritableSignal<T> & OutputEmitterRef<T>;
// model.set(v) → updates internal signal AND emits 'modelChange' output
```

**Trade-offs та обмеження:**
- Signal inputs — read-only всередині компонента (batьківський контроль)
- model() — не для форм: використовувати ControlValueAccessor для FormControl integration
- withComponentInputBinding() — точний name match між route param і input name
- Migration: існуючий code потребує міграції (але є schematics)

**Версійність:**
- Angular 17 (developer preview): `input()`, `output()`, `model()`
- Angular 17.1+ stable: `input()` і `output()` stable
- Angular 17.2: `model()` stable
- Angular 18: `input.required()` без initialValue requirement
- Angular 21: всі APIs стабільні

## Deep Details

### Edge Cases

- **input.required() і SSR:** При server-side rendering — Angular може set input пізніше. Required inputs потрібні до першого render. Використовувати `input.required()` тільки якщо parent завжди provided.
- **model() і default value:** `model<T>()` без default — `ModelSignal<T | undefined>`. `model<T>(initial)` — `ModelSignal<T>`. Рекомендовано завжди мати default для optional model.
- **input transform і TypeScript:** `input(0, { transform: numberAttribute })` — transform приймає `string | number | null` і повертає `number`. TypeScript type inference враховує це.
- **setInput() у tests:** `fixture.componentRef.setInput('inputName', value)` — правильний спосіб тестувати signal inputs. Не пряма записку у компонент instance.
- **output() і zone:** output() не залежить від Zone.js — emit() synchronous. Listeners у template — через Angular event binding.

### Junior vs Senior Understanding

**Junior** знає: "input() замість @Input(), output() замість @Output(), model() для two-way."

**Senior** розуміє глибину:

1. **InputSignal reactivity:** input() у computed() або effect() реєструє dependency — при зміні input від батька, computed автоматично перераховується. З @Input + ngOnChanges: потрібен явний recalculation.

2. **outputFromObservable і teardown:** `outputFromObservable(source$)` auto-subscribes до source$ і unsubscribes при destroy. Дозволяє Observable pipeline бути output без ручного subscribe.

3. **withComponentInputBinding coercion:** Route params є рядками (`'123'`). `id = input.required<string>()` — OK. `id = input(0, { transform: numberAttribute })` — автоматично конвертує рядок у число.

4. **model() і changeDetection:** ModelSignal.set() → emits 'modelChange' → parent binding updates parent signal → child input signal updates (через setInput) → CD runs. Синхронний ланцюжок.

### Deprecation & Migration Path

- **@Input() decorator:** Не deprecated, але рекомендовано мігрувати до input() для нових компонентів.
  ```typescript
  // Old:
  @Input() value: string = '';
  @Input({ required: true }) id!: string;
  // New:
  value = input('');
  id = input.required<string>();
  ```
- **@Output() EventEmitter:** Не deprecated.
  ```typescript
  // Old:
  @Output() clicked = new EventEmitter<void>();
  // New:
  clicked = output<void>();
  ```
- **Migration schematic:** `ng g @angular/core:signal-input-migration`
- **@Input + @Output two-way pattern:** Замінюється на model().

### Connections to Other Concepts

- **Signals (b11t1):** input() = Signal, computed() від input() — чиста reactivity.
- **Router (b6t4):** withComponentInputBinding() — route params як signal inputs.
- **Reactive Forms (b7t2):** model() не замінює ControlValueAccessor — для форм окремий API.
- **Change Detection (b9t3):** Signal inputs точніші для OnPush — Angular знає які inputs changed.

## Examples

### Basic Usage

```typescript
import { Component, input, output, model, computed } from '@angular/core';
import { numberAttribute } from '@angular/core';

// ✅ Signal inputs — reactive, type-safe
@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    <h2>{{ fullName() }}</h2>
    <p>Age: {{ age() }}</p>
    <button (click)="onSelect()">Select</button>
  `,
})
export class UserCardComponent {
  // ✅ Required input — compile-time enforcement
  firstName = input.required<string>();
  lastName = input.required<string>();

  // ✅ Optional input with default
  age = input(0, { transform: numberAttribute }); // auto string→number

  // ✅ Derived from signal inputs via computed
  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

  // ✅ Event output
  selected = output<string>(); // emits user id

  onSelect(): void {
    this.selected.emit(`${this.firstName()}-${this.lastName()}`);
  }
}

// ✅ Two-way binding with model()
@Component({
  selector: 'app-toggle',
  standalone: true,
  template: `
    <button (click)="toggle()">
      {{ isOpen() ? 'Close' : 'Open' }}
    </button>
  `,
})
export class ToggleComponent {
  // ✅ model() — parent can both provide and receive value
  isOpen = model(false);

  toggle(): void {
    this.isOpen.update(v => !v); // ← updates signal AND emits 'isOpenChange'
  }
}

// Parent usage:
// <app-toggle [(isOpen)]="panelOpen" />
```

### Production Scenario

```typescript
import { Component, input, output, computed, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { numberAttribute } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

// Route: { path: 'users/:userId', component: UserDetailComponent }
// + provideRouter(routes, withComponentInputBinding())
@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: `
    @if (user()) {
      <h1>{{ user()!.name }}</h1>
      <p>{{ user()!.email }}</p>
      <app-user-orders [userId]="userId()" (orderSelected)="onOrderSelect($event)" />
    }
    @if (error()) {
      <div class="error">{{ error() }}</div>
    }
  `,
})
export class UserDetailComponent {
  private userService = inject(UserService);

  // ✅ Automatically bound from route param :userId via withComponentInputBinding()
  userId = input.required<string>();

  // ✅ Reactive data load when route param changes
  private userResult = toSignal(
    toObservable(this.userId).pipe(
      switchMap(id =>
        this.userService.getUser(id).pipe(
          catchError(err => of({ error: err.message, data: null }))
        )
      ),
    ),
    { initialValue: { error: null, data: null } },
  );

  user = computed(() => this.userResult().data);
  error = computed(() => this.userResult().error);

  orderSelected = output<Order>();
  onOrderSelect(order: Order): void {
    this.orderSelected.emit(order);
  }
}

// App setup:
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()), // ← enables input binding
  ],
};
```

### Anti-Example

```typescript
// ❌ WRONG: Trying to write to input signal
@Component({ selector: 'app-bad', template: '' })
export class BadComponent {
  value = input<string>('');

  reset(): void {
    (this.value as any).set(''); // ❌ InputSignal is read-only! Runtime error
  }
}

// ❌ WRONG: Using model() for form integration
@Component({ selector: 'app-bad-form', template: '' })
export class BadFormComponent {
  // ❌ model() doesn't integrate with FormControl!
  // Use ControlValueAccessor for form integration
  formValue = model('');
}

// ❌ WRONG: @Input without withComponentInputBinding for route params
// Routes without withComponentInputBinding:
@Component({ selector: 'app-user', template: '' })
export class UserComponent {
  @Input() userId!: string; // ❌ This WON'T work without withComponentInputBinding()!
  // Value stays undefined!
}

// ✅ CORRECT: Read-only InputSignal, derived via computed
@Component({ selector: 'app-good', template: '' })
export class GoodComponent {
  value = input('');  // read-only InputSignal

  // ✅ Derive from input via computed
  readonly upperValue = computed(() => this.value().toUpperCase());

  // ✅ If component needs to reset, use model() or separate output
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Пряма запис в InputSignal | Read-only — runtime error | InputSignal контролюється батьком; для two-way — `model()` |
| model() для форм | Не інтегрується з FormControl | ControlValueAccessor для форм integration |
| EventEmitter у output() | EventEmitter extends Subject — надлишковий API | `output<T>()` — тільки emit(), cleanier API |
| inject(ActivatedRoute) замість input() + withComponentInputBinding | Тісна залежність від Router API, складніший тест setup | `id = input.required<string>()` + `withComponentInputBinding()` |
| @Input() required: true (decorator syntax) | Runtime warning тільки, не compile-time | `input.required<T>()` — compile-time enforcement |

## Interview Block

### [L1 — Warm-up] Що таке signal inputs і чим відрізняються від @Input()?
**Signal being tested:** Знання сучасного Angular component API і переваг over decorators
**What the interviewer expects:** input() = Signal, read-only, type-safe, required vs optional, composable у computed
**How to probe deeper:** "Якщо input змінюється від батька — як дочірній компонент реагує без ngOnChanges?"
**Reference answer:** `input()` повертає InputSignal — read-only Signal що Angular оновлює коли батько змінює binding. На відміну від @Input() де потрібен ngOnChanges для реакції, InputSignal може бути читаний у computed() або effect() і автоматично triggers recomputation. input.required<T>() — compile-time error якщо не передано (vs @Input({ required: true }) — тільки runtime warning). transform option для type coercion.
**Common mistakes:** Спробувати записати у InputSignal; не знають input.required(); не знають composability у computed

### [L2 — Mid] output() vs @Output() EventEmitter — різниця?
**Signal being tested:** Розуміння нового output API і його переваг
**What the interviewer expects:** EventEmitter extends Subject (зайвий), output() — тільки emit(), outputFromObservable(), outputToObservable()
**How to probe deeper:** "Як використати Observable pipeline як output source?"
**Reference answer:** output<T>() — OutputEmitterRef: тільки emit(), немає Subject/Observable API. Чистіший separation. EventEmitter extends Subject — subscribe() доступний (але не рекомендований). outputFromObservable(source$) — Observable pipe як output source, auto-subscription/cleanup. outputToObservable(ref) — конвертація назад для composability. Migration: @Output() EventEmitter → output().
**Common mistakes:** subscribe() на output(); думають output і EventEmitter identical; не знають outputFromObservable

### [L3 — Senior] Що таке model() і як реалізується two-way binding?
**Signal being tested:** Розуміння two-way binding семантики і відмінності від CVA
**What the interviewer expects:** ModelSignal = WritableSignal + output, set() emits 'modelChange', [(model)] syntax, відмінність від ControlValueAccessor
**How to probe deeper:** "Коли model() vs ControlValueAccessor для form integration?"
**Reference answer:** model<T>(initial) = WritableSignal у дочірньому + автоматичний 'nameChange' output. set(v) → оновлює signal І emits nameChange. [(isOpen)]="parentSig" = синтаксис two-way. model() для component-to-component two-way поза формами (accordion, dialog visibility). ControlValueAccessor для форм (FormControl integration, writeValue, registerOnChange).
**Common mistakes:** model() для форм; не знають 'nameChange' convention; думають model і @Input+@Output identical

### [L4 — Staff/Principal] Як спроєктувати component API з новими Signal APIs?
**Signal being tested:** Архітектурне мислення — API design, library design, migration strategy
**What the interviewer expects:** input.required для enforcement, computed від inputs, output typing, model для two-way, withComponentInputBinding для router, migration schematics
**How to probe deeper:** "Як тестувати компоненти з signal inputs?"
**Reference answer:** input.required() для обов'язкових props — compile-time safety. computed від inputs — derived props pattern. output<T>() strongly typed. model() для shared control. withComponentInputBinding() для route params як inputs. Testing: `fixture.componentRef.setInput('name', value)` замість mock ActivatedRoute. Migration: `ng g @angular/core:signal-input-migration`. Library design: Signal API = кращий public contract ніж decorator-based.
**Common mistakes:** Over-complicated API; output для state (має бути events); не тестують через setInput

## Summary

### Key Points
- `input<T>()` — read-only InputSignal оновлюється батьком; composable у computed/effect
- `input.required<T>()` — compile-time enforcement (vs @Input required: true — runtime only)
- `output<T>()` — OutputEmitterRef: тільки emit(), не EventEmitter/Subject
- `outputFromObservable(obs$)` — Observable pipeline як output source з auto-cleanup
- `model<T>(initial)` — two-way binding: WritableSignal у дочірньому + emits 'nameChange'
- `withComponentInputBinding()` у provideRouter — route params→query params→resolver результати як signal inputs
- Testing: `fixture.componentRef.setInput('name', value)` для signal inputs

### Elevator Pitch (2 minutes)
"Angular 17+ представив Signal-based component APIs: input() замість @Input(), output() замість EventEmitter, model() для two-way binding. Ключова перевага: input() — це Signal, можна у computed() без ngOnChanges. input.required<T>() — compile-time error якщо не передано. output<T>() — тільки emit(), без зайвого Subject API. model<T>() — two-way binding: дочірній може і читати і писати, батько отримує зміни через 'nameChange' binding. Bonus: withComponentInputBinding() у Router — route params автоматично map до signal inputs без inject(ActivatedRoute). Migration автоматична через schematics."
