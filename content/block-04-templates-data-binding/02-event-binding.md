---
title: "Event Binding"
block: 4
topic: 2
slug: "event-binding"
difficulty: 2
sinceVersion: "2"
tags: ["event-binding", "output", "EventEmitter", "custom-events", "host-listener", "two-way-binding"]
relatedTopics: ["binding-types", "template-reference-variables", "component-metadata", "directives"]
interviewQuestions:
  - id: "b4t2q1"
    level: "junior"
    question: "Як в Angular підписатись на DOM подію кнопки і викликати метод компоненту?"
    referenceAnswers:
      junior: "Використовуємо event binding синтаксис: `(click)=\"handleClick()\"`. Angular підписується на DOM подію і викликає метод компоненту при спрацюванні."
      mid: "Event binding `(eventName)=\"handler($event)\"` реєструє DOM event listener і викликає template statement при події. `$event` — це native DOM event object або custom event value. Angular автоматично unsubscribes при destroy компоненту. Під капотом компілюється в `addEventListener` через Angular renderer."
      senior: "Event binding компілюється Ivy compiler в `ɵɵlistener` instruction. При створенні view — реєструє native event listener через Renderer2 API. При destroy — автоматично видаляє listener. Template statement (не expression) виконується в контексті компоненту. `$event` — implicit variable що містить event object. Важливо: event binding не є RxJS-based — це пряма DOM event delegation. Для stream processing треба поєднувати з fromEvent або Subject."
      staff: "Event binding в Ivy — це `ɵɵlistener(eventName, handler, useCapture)`. Handler — це closure що виконує template statement в LView context. Angular Renderer2 абстрагує platform-specific listener registration — в браузері це addEventListener, в SSR (platform-server) — no-op або server-side emulation. Критично для performance: кожен event binding — один native listener. При великій кількості елементів (virtual scroll, large lists) — event delegation pattern кращий: один listener на container замість N listeners на row. Angular CDK використовує саме цей підхід. Для zoneless Angular (signal-based CD): event listeners залишаються native, але без Zone.js patching — ApplicationRef.tick() не відбувається автоматично. З `provideExperimentalZonelessChangeDetection()` — компоненти мають самостійно тригерити CD або використовувати Signals."
    commonMistakes:
      - "Викликають метод без дужок: `(click)=\"handleClick\"` — передає reference на функцію замість виклику"
      - "Не знають що `$event` — це native DOM Event, не Angular wrapper"
    relatedQuestions: ["b4t2q2", "b4t2q3"]
  - id: "b4t2q2"
    level: "mid"
    question: "Яка різниця між Output() EventEmitter і output() signal-based output в Angular 17+?"
    referenceAnswers:
      junior: "@Output() EventEmitter — старий спосіб. output() — новий сигнальний підхід. Обидва дозволяють emit events з child до parent."
      mid: "@Output() EventEmitter extends RxJS Subject — можна subscribe, має next/error/complete. Нова функція output() з Angular 17+ — не RxJS-based, це lightweight event emitter з простішим API: `myOutput = output<string>()` і `myOutput.emit(value)`. output() більш tree-shakable і інтегрується з Signals ecosystem. EventEmitter deprecated style але не видалений."
      senior: "`output()` function (stable Angular 17+) повертає `OutputRef<T>` — не Observable, не Subject. Всередині `OutputRef` використовує `OutputEmitter` — dedicated class без RxJS overhead. При compile time: Angular compiler розпізнає як output так само як @Output(). В template parent компоненту — той самий синтаксис `(myOutput)=\"handler($event)\"`. Ключова відмінність: EventEmitter — pushes values synchronously, supports multiple subscribers. output() — designed for single parent listener. outputToObservable() helper дозволяє convert output() до Observable для interop. output() також підтримує `outputFromObservable()` — wrap Observable як output. Для component library: output() кращий вибір — менше bundle size, cleaner API, signal-native."
      staff: "Еволюція outputs відображає broader Angular shift від RxJS-everywhere до selective usage. EventEmitter як Subject — це leaky abstraction: consumers могли subscribe напряму, bypass template binding, що порушувало encapsulation. output() enforces single-direction communication через template only. Під капотом output() в Ivy — `ɵɵdeclareOutput` instruction, zero RxJS overhead. Для Design System: output() + outputToObservable() де потрібен stream = best of both worlds. Migration: automated codemod існує (`ng generate @angular/core:output-migration`). В zoneless context: output() emit не потребує Zone trigger — це пряме function call що веде до host component CD. Архітектурно: output() + input() + model() = повноцінний reactivity contract без RxJS залежності в component API."
    commonMistakes:
      - "Думають що output() — це Observable — насправді OutputRef, потрібен outputToObservable() для stream"
      - "Підписуються на EventEmitter напряму в parent замість template binding — порушує encapsulation"
    relatedQuestions: ["b4t2q1", "b4t2q3"]
  - id: "b4t2q3"
    level: "mid"
    question: "Що таке two-way binding і як Angular реалізує [(ngModel)] і [(value)] синтаксис?"
    referenceAnswers:
      junior: "Two-way binding `[(ngModel)]` дозволяє синхронізувати значення між template і компонентом. Зміна в input — оновлює модель, зміна моделі — оновлює input."
      mid: "Two-way binding — це синтаксичний цукор: `[(x)]` розгортається в `[x]='value' (xChange)='value=$event'`. Angular шукає Input x і Output xChange. ngModel — директива з FormsModule що реалізує цей pattern для form controls: `[ngModel]='value'` + `(ngModelChange)='value=$event'`. Для власних компонентів: @Input() value + @Output() valueChange = EventEmitter. З Angular 17+: `model()` function — reactive two-way binding без EventEmitter."
      senior: "Two-way binding desugaring: `[(x)]=\"expr\"` → `[x]=\"expr\" (xChange)=\"expr=$event\"`. Angular parser обробляє banana-in-a-box syntax і генерує обидва bindings. FormsModule's NgModel directive: `@Input('ngModel') model` приймає значення, `@Output('ngModelChange') update = new EventEmitter()` емітує зміни. NgModel також реалізує ControlValueAccessor під капотом для integration з reactive forms. Нова `model()` function (Angular 17.1, stable): `count = model(0)` — одночасно signal input і signal output. `count.set(5)` тригерить зміну назовні. `[(count)]=\"parentCount\"` — повна two-way sync. model() — це WritableSignal що propagates changes both ways."
      staff: "Two-way binding convention (xChange) — це architectural pattern що Angular enforces через naming convention, not code. Це важливо: будь-який Input/Output pair з matching names автоматично стає two-way bindable. `model()` function fundamentally змінює підхід — замість Event-based communication (push) використовується Signal synchronization (reactive graph). При `[(model)]` Angular compiler генерує: читання signal для [model] і підписку на model changes для (modelChange). Це O(1) reactivity без change detection traversal. Для Design System: model() inputs = excellent DX для controlled components (slider, color picker, date picker). Важлива деталь: model() propagates changes synchronously в parent signal — це може surprised розробників що звикли до async EventEmitter patterns. При SSR: two-way binding через model() безпечний — немає DOM manipulation, тільки signal updates."
    commonMistakes:
      - "Не знають що [(x)] розгортається в [x] + (xChange) — називають Output eventName замість eventNameChange"
      - "Використовують ngModel в reactive forms — там потрібен formControl/formControlName"
    relatedQuestions: ["b4t2q2", "b4t2q4"]
  - id: "b4t2q4"
    level: "senior"
    question: "Як правильно обробляти event propagation і зупиняти bubbling в Angular templates?"
    referenceAnswers:
      junior: "Можна викликати `$event.stopPropagation()` в handler методі щоб зупинити bubbling."
      mid: "Angular event binding реєструє listeners на конкретних елементах. Bubbling — природна поведінка DOM. `$event.stopPropagation()` зупиняє bubbling, `$event.preventDefault()` — скасовує default behavior. В Angular: `(click)=\"handler($event)\"` де в handler викликаємо `event.stopPropagation()`. Або інлайн: `(click)=\"$event.stopPropagation(); handler()\"`. Для multiple statements в template — використовуємо крапку з комою."
      senior: "Event propagation в Angular templates має кілька нюансів. Template statement `(click)=\"$event.stopPropagation()\"` — виконується в order: спочатку statement, потім bubbling від Angular listener вже зупинений. Але є edge case: якщо parent компонент також має `(click)` binding і вони на різних Angular components — bubbling проходить через native DOM, не через Angular event system. @HostListener('click', ['$event']) на directive — також реагує на bubbled events якщо не зупинено. Для event delegation pattern: один listener на parent `(click)=\"handleDelegated($event)\"` і перевірка `$event.target` — ефективніше ніж N individual bindings. Modifier-like pattern: `(keydown.enter)=\"submit()\"` — Angular підтримує key filtering для keyboard events без manual keyCode checks."
      staff: "Event propagation і Angular zones — critical interaction. Zone.js patches всі event listeners globally. При event fire: native listener виконується в Zone context → Zone.js записує що async operation відбулась → після completion Angular CD runs. Якщо зупинити propagation ПІСЛЯ Angular зафіксував event — CD все одно відбудеться. З zoneless: кожен event — просто function call, CD manual або signal-driven. Architectural consideration: event delegation для performance — замість binding на кожен row у virtual scroll, один binding на viewport. Angular CDK ScrollDispatcher і EventManager plugins дозволяють кастомне event handling. Custom event plugins: `(gesture.swipe)` можна реалізувати через HAMMER_GESTURE_CONFIG. Для accessibility: keyboard events + stopPropagation можуть break screen reader navigation — завжди тестувати з AT. Passive event listeners (`{passive: true}`) для scroll events — Angular не підтримує нативно, потрібен custom renderer або direct addEventListener."
    commonMistakes:
      - "Викликають stopPropagation() в async callback після event обробки — bubbling вже відбувся"
      - "Забувають що (click) на component не зупиняє bubbling автоматично — Angular компоненти прозорі для DOM events"
    relatedQuestions: ["b4t2q3", "b4t2q5"]
  - id: "b4t2q5"
    level: "staff"
    question: "Як би ви спроектували архітектуру event handling для high-performance таблиці з 10,000 rows?"
    referenceAnswers:
      junior: "Я б використовував Virtual Scroll щоб рендерити тільки видимі рядки і ставив (click) binding на кожен рядок."
      mid: "Для high-performance: CDK Virtual Scroll для рендерингу тільки видимих рядків, event delegation замість individual row bindings, trackBy для @for, OnPush CD strategy. Окремий binding на viewport container замість на кожен row."
      senior: "Architectural approach: 1) CDK VirtualScrollViewport — рендерить ~20-50 visible rows. 2) Event delegation: один `(click)` на scroll viewport, `$event.target.closest('[data-row-id]')` для row identification. 3) OnPush + immutable data — CD тільки при reference change. 4) trackBy з stable IDs. 5) Уникати bindings в row template що генерують нові references — computed signals або pure pipes. 6) ChangeDetectorRef.detach() для rows поза viewport. Row selection state через Signal store — `selectedIds = signal(new Set())` з computed для row state."
      staff: "High-performance table архітектура потребує systemic thinking. Event delegation — перший крок: один listener замість 10K. Але DOM traversal через closest() — це O(depth) per event. Рекомендація: data attributes на TR elements, WeakMap mapping від element до row data — O(1) lookup. CDK VirtualScroll + custom rendering strategy (FixedSizeVirtualScrollStrategy) для predictable performance. Rendering pipeline: Angular rendering кожного row — мінімальний template, computed values через signals замість template expressions. Signal-based row state: `rowState = computed(() => this.store.getRowState(row.id))` — granular updates без full list re-render. Memory management: VirtualScroll recycles DOM nodes — row components не destroyed/created, тільки inputs updated. З NgRx Signal Store: selectRow selector з memoization — рядок re-renders тільки при зміні своїх даних. Для selection: click delegation → dispatch action → store update → signal propagation до affected rows only. Profiling: Chrome DevTools Rendering panel, Angular DevTools component tree — measure actual bottlenecks before optimizing."
    commonMistakes:
      - "Ставлять individual event bindings на кожен row не думаючи про масштаб"
      - "Не враховують що Virtual Scroll recycles components — state з попереднього row може залишитись"
    relatedQuestions: ["b4t2q4", "b4t2q3"]
---

## Core Concept

**English definition:** Event binding in Angular is a one-way data flow mechanism that listens for DOM events (or custom component events) and executes a template statement in response, passing the `$event` object containing event data.

**Пояснення:** Event binding `(eventName)="statement"` — це Angular механізм підписки на DOM події та custom events компонентів. Синтаксис з дужками відрізняє event binding від property binding (квадратні дужки). Коли подія спрацьовує — Angular виконує template statement в контексті поточного компоненту. `$event` — implicit змінна що містить native DOM Event або custom event payload.

**Яку проблему вирішує:** DOM events — асинхронні і потребують ручного addEventListener/removeEventListener з ручним управлінням lifecycle. Event binding автоматизує реєстрацію і cleanup listeners, забезпечує доступ до компонентної логіки в handlers, і інтегрується з Angular CD pipeline для автоматичного оновлення UI після event обробки.

**Як працює під капотом:** Angular Ivy compiler парсить `(click)="handler($event)"` і генерує `ɵɵlistener('click', function($event) { ctx.handler($event); })` instruction. При view creation — реєструє native event listener через Renderer2 (що абстрагує platform: DOM, SSR, Web Workers). При view destruction — автоматично видаляє listener. Zone.js патчить addEventListener — при event fire Angular автоматично запускає change detection через `ApplicationRef.tick()`.

**Trade-offs та обмеження:** Один event binding = один native listener — при тисячах елементів це memory overhead. Template statements (не expressions) мають обмежений синтаксис — не можна писати complex logic. Event binding + Zone.js = CD після кожного event — навіть якщо нічого не змінилось. Немає вбудованого debounce/throttle — потрібно або RxJS fromEvent або ручна логіка в handler.

**Версійність:** Event binding стабільний з Angular 2. Angular 17 додав `output()` function як альтернативу @Output() EventEmitter — lighter, signal-integrated, без RxJS. Angular 17.1: `model()` function для two-way binding як Signal. Angular 14+: `@HostListener` можна замінити на `host: { '(click)': 'handler()' }` в component decorator — більш performant (compile-time vs runtime decorator).

---

## Deep Details

### Edge Cases

**Template statement vs expression:** Event binding приймає statement (side-effect код), не expression (value). `(click)="count++"` — valid statement. `(click)="count + 1"` — некоректно (expression без side effect). Multiple statements: `(click)="log(); handle()"` через крапку з комою.

**$event typing:** В TypeScript strict mode, `$event` тип залежить від context. `(click)` — MouseEvent. `(keydown)` — KeyboardEvent. Custom Output — тип з EventEmitter generic. `(ngModelChange)` — тип значення. Без явної типізації в handler — `$event: any`.

**Key event filtering:** Angular підтримує key combinations: `(keydown.enter)`, `(keydown.shift.enter)`, `(keydown.control.z)`. Компілюється в listener з manual key check — зручніше ніж перевіряти keyCode вручну.

**Host event binding:** В директиві/компоненті: `@HostListener('click', ['$event'])` або `host: { '(click)': 'handler($event)' }`. Різниця: decorator — runtime reflection, host property — compile-time — використовуйте host property для кращого performance і tree-shaking.

**Event binding і zones:** При кожному event Angular запускає full CD cycle (якщо не zoneless). Навіть якщо handler нічого не змінює — CD відбувається. Оптимізація: `NgZone.runOutsideAngular()` для events що не потребують CD (mousemove для canvas, scroll без UI updates).

### Junior vs Senior Understanding

**Junior** знає синтаксис `(event)="handler($event)"`, знає як передати event object, розуміє що це реагування на DOM події.

**Senior** розуміє:

1. **Ivy compilation:** `ɵɵlistener` instruction, яка через `Renderer2.listen()` реєструє native listener. При SSR — renderer не реєструє DOM listeners, але компонентна логіка може виконуватись.

2. **Zone.js interaction:** Кожен event binding — це потенційний CD trigger. Рознесення між Zone і non-Zone listeners дає конкретні gains при профілюванні.

3. **Event delegation pattern:** Замість N listeners — один на container. Angular не надає вбудованого механізму, але pattern реалізується через `(click)="handleDelegated($event)"` і `$event.target.closest()`.

4. **output() vs EventEmitter:** EventEmitter — RxJS Subject overhead. output() — lightweight, signal-native, no RxJS import needed. Для library authoring: output() завжди кращий.

5. **model() для two-way:** `[(value)]` desugars до `[value]` + `(valueChange)`. model() Signal — реактивна two-way sync без EventEmitter overhead.

### Deprecation & Migration Path

- **@Output() EventEmitter**: Не deprecated, але output() — новий preferred підхід (Angular 17+). Migration: `ng generate @angular/core:output-migration`.
- **@HostListener decorator**: Функціонально стабільний, але `host: { '(event)': 'handler()' }` у decorator — compile-time, краща performance. Зміни: лише style preference.
- **ngModel two-way binding**: Стабільний у FormsModule. Але для signal-based components — `model()` є кращою альтернативою.

### Connections to Other Concepts

- **Change Detection:** Event firing → Zone.js → `ApplicationRef.tick()` → CD cycle. З OnPush — CD тільки якщо event emitted від компоненту або його нащадків.
- **RxJS:** `fromEvent(element, 'click')` — Observable alternative з operators (debounce, map, filter). Event binding vs fromEvent: binding — declarative template, fromEvent — programmatic with operators.
- **Signals:** `output()` і `model()` — signal-integrated event system. Zoneless Angular + Signals: events більше не auto-trigger CD.
- **Directives:** Event bindings на directive's host element через `@HostListener` або `host` metadata.

---

## Examples

### Basic Usage

```typescript
@Component({
  selector: 'app-event-demo',
  standalone: true,
  template: `
    <!-- Basic click event -->
    <button (click)="increment()">Increment</button>
    <p>Count: {{ count }}</p>

    <!-- Event with $event object -->
    <input (input)="onInput($event)" [value]="inputValue">

    <!-- Keyboard event with key filter -->
    <input (keydown.enter)="onSubmit()" placeholder="Press Enter to submit">
    <input (keydown.escape)="onCancel()" placeholder="Press Esc to cancel">

    <!-- Prevent default -->
    <a href="/home" (click)="navigate($event)">Custom navigation</a>

    <!-- Stop propagation -->
    <div (click)="outerClick()">
      Outer
      <button (click)="$event.stopPropagation(); innerClick()">
        Inner (won't bubble)
      </button>
    </div>

    <!-- Mouse events -->
    <div (mouseenter)="onHover(true)"
         (mouseleave)="onHover(false)"
         [class.hovered]="isHovered">
      Hover me
    </div>
  `
})
export class EventDemoComponent {
  count = 0;
  inputValue = '';
  isHovered = false;

  increment(): void {
    this.count++;
  }

  onInput(event: Event): void {
    this.inputValue = (event.target as HTMLInputElement).value;
  }

  onSubmit(): void {
    console.log('Submitted:', this.inputValue);
  }

  onCancel(): void {
    this.inputValue = '';
  }

  navigate(event: MouseEvent): void {
    event.preventDefault();
    // Custom routing logic
  }

  outerClick(): void { console.log('outer'); }
  innerClick(): void { console.log('inner only'); }
  onHover(state: boolean): void { this.isHovered = state; }
}
```

### Production Scenario

```typescript
// Child component with output() — modern Angular 17+ approach
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="search-wrapper">
      <input
        type="search"
        [value]="query()"
        (input)="onInput($event)"
        (keydown.enter)="onSearch()"
        (keydown.escape)="onClear()"
        [attr.placeholder]="placeholder()"
      >
      @if (query()) {
        <button (click)="onClear()" aria-label="Clear search">×</button>
      }
    </div>
  `
})
export class SearchInputComponent {
  placeholder = input('Search...');
  query = model('');  // Two-way binding via model()

  // output() — signal-based, no RxJS
  search = output<string>();
  cleared = output<void>();

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
  }

  onSearch(): void {
    if (this.query().trim()) {
      this.search.emit(this.query().trim());
    }
  }

  onClear(): void {
    this.query.set('');
    this.cleared.emit();
  }
}

// Parent component usage
@Component({
  selector: 'app-results-page',
  standalone: true,
  imports: [SearchInputComponent],
  template: `
    <app-search-input
      placeholder="Search topics..."
      [(query)]="searchQuery"
      (search)="performSearch($event)"
      (cleared)="clearResults()"
    />
    <p>Current query: {{ searchQuery() }}</p>
  `
})
export class ResultsPageComponent {
  searchQuery = signal('');

  performSearch(query: string): void {
    // Trigger API call
  }

  clearResults(): void {
    // Clear search results
  }
}
```

### Anti-Example

```typescript
// WRONG: Common event binding mistakes
@Component({
  template: `
    <!-- Missing parentheses — passes function reference, not called -->
    <button (click)="handleClick">Click me</button>

    <!-- Inline complex logic in template — hard to test, bad DX -->
    <input (keydown)="$event.keyCode === 13 ? submit() : $event.keyCode === 27 ? cancel() : null">

    <!-- EventEmitter subscribed directly in parent — bypasses template, leaks -->
    <app-child #child></app-child>
  `
})
export class BadEventComponent implements OnInit {
  @ViewChild('child') child!: ChildComponent;

  ngOnInit() {
    // WRONG: subscribing to EventEmitter directly — creates memory leak
    this.child.someOutput.subscribe(val => this.handleValue(val));
  }

  handleClick: () => void = () => {};  // Passed as reference — never called by Angular
}

// CORRECT:
@Component({
  template: `
    <!-- Correct: parentheses for invocation -->
    <button (click)="handleClick()">Click me</button>

    <!-- Correct: use key event filters -->
    <input (keydown.enter)="submit()" (keydown.escape)="cancel()">

    <!-- Correct: template event binding, no direct subscription -->
    <app-child (someOutput)="handleValue($event)"></app-child>
  `
})
export class GoodEventComponent {
  handleClick(): void { /* logic here */ }
  submit(): void { /* submit */ }
  cancel(): void { /* cancel */ }
  handleValue(val: string): void { /* handle */ }
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `(click)="handler"` без дужок | Передає function reference — Angular виконує як template statement, що є no-op | `(click)="handler()"` з дужками |
| Складна логіка в template statement | Важко тестувати, порушує separation of concerns, template перевантажений | Виносити логіку в метод компоненту, template — тільки виклик |
| Підписка на EventEmitter напряму в parent | Memory leak якщо не unsubscribe, обходить template binding pipeline | Використовувати `(outputName)="handler($event)"` в template |
| Один event handler для всіх N рядків списку | N native listeners — memory overhead | Event delegation: один listener на container, `$event.target.closest()` |
| Не використовувати NgZone.runOutsideAngular() для frequent events | mousemove/scroll тригерять CD на кожен pixel — catastrophic performance | `ngZone.runOutsideAngular(() => el.addEventListener(...))` |

---

## Interview Block

### [L1 — Warm-up] Як в Angular підписатись на DOM подію кнопки і викликати метод компоненту?
**Signal being tested:** Знання базового синтаксису event binding і розуміння flow від DOM event до компонентного методу.
**What the interviewer expects:** Демонстрація `(click)="handler()"` синтаксису, знання `$event`, розуміння automatic listener cleanup.
**How to probe deeper:** "Як передати $event в handler і що він містить для click події?"
**Reference answer:** Event binding `(click)="handler()"` реєструє DOM listener на елементі. Angular автоматично видаляє listener при destroy компоненту. `$event` містить native MouseEvent з координатами, target та іншими стандартними полями. Під капотом Ivy компілює в `ɵɵlistener` instruction через Renderer2.
**Common mistakes:** Пишуть `(click)="handler"` без дужок — Angular виконує як statement без виклику; плутають що `$event` — native DOM Event, не Angular wrapper.

### [L2 — Mid] Яка різниця між @Output() EventEmitter і output() signal-based output в Angular 17+?
**Signal being tested:** Обізнаність з еволюцією Angular API і розуміння trade-offs між RxJS-heavy і signal-native підходами.
**What the interviewer expects:** Знання що EventEmitter extends Subject (RxJS overhead), output() — lightweight без RxJS, обидва використовують однаковий template синтаксис, outputToObservable() для interop.
**How to probe deeper:** "Як перетворити output() на Observable якщо потрібен stream з operators?"
**Reference answer:** EventEmitter extends RxJS Subject — підтримує subscribe, next/error/complete, але несе RxJS overhead. output() (Angular 17+) — OutputRef без RxJS, легший, tree-shakable. Обидва використовують `(outputName)="handler($event)"` в template. outputToObservable(myOutput) — convert для RxJS interop де потрібні operators. outputFromObservable() — wrap Observable як output.
**Common mistakes:** Думають output() — Observable; підписуються на EventEmitter напряму замість template binding.

### [L3 — Senior] Як правильно обробляти event propagation і зупиняти bubbling в Angular templates?
**Signal being tested:** Розуміння DOM event lifecycle в контексті Angular binding system і Zone.js, вміння обирати між declarative і programmatic підходами.
**What the interviewer expects:** stopPropagation в template statement, розуміння що Angular components прозорі для DOM events, знання event delegation pattern.
**How to probe deeper:** "Як реалізувати event delegation для таблиці з динамічними рядками для кращої performance?"
**Reference answer:** `(click)="$event.stopPropagation(); handler()"` зупиняє bubbling до native DOM level. Але: Angular components прозорі — bubbling відбувається через DOM незалежно від Angular hierarchy. Для event delegation: один `(click)` на container, `$event.target.closest('[data-id]')` для identification. Zone.js реєструє event — CD запуститься незалежно від stopPropagation. Для performance-critical events (mousemove, scroll) — `NgZone.runOutsideAngular()`.
**Common mistakes:** Думають що event binding на Angular component зупиняє bubbling між компонентами; не використовують event delegation при масштабуванні.

### [L4 — Staff/Principal] Як би ви спроектували архітектуру event handling для high-performance таблиці з 10,000 rows?
**Signal being tested:** Системне мислення про performance, memory management, і architectural patterns при scale — не просто "як написати код" але "як спроектувати систему".
**What the interviewer expects:** Event delegation, CDK VirtualScroll, Signal-based state, OnPush, memory management for recycled components, profiling approach.
**How to probe deeper:** "Як обробити selection state при Virtual Scroll де rows recycled?"
**Reference answer:** CDK VirtualScrollViewport рендерить ~50 visible rows. Event delegation: один listener на viewport, data attributes на rows, WeakMap для O(1) element-to-data mapping. OnPush + Signal store: кожен row читає computed signal від store — re-renders тільки при своїх даних. Row components не destroyed при scroll — inputs оновлюються. NgZone.runOutsideAngular() для scroll events. Profiling: Chrome DevTools Rendering + Angular DevTools перед оптимізацією.
**Common mistakes:** Individual bindings на кожен row без думки про масштаб; не врахування що Virtual Scroll recycled components зберігають стан між rows.

---

## Summary

### Key Points
- Event binding `(eventName)="statement"` реєструє native DOM listener і auto-cleanup при destroy
- `$event` — native DOM Event object (або custom event payload для component outputs)
- Ivy компілює event binding в `ɵɵlistener` instruction через Renderer2 — platform-agnostic
- `output()` (Angular 17+) — lightweight альтернатива @Output() EventEmitter без RxJS overhead
- Two-way binding `[(x)]` desugars в `[x]` + `(xChange)`, `model()` Signal — reactive два-напрямки
- Event delegation (один listener на container) краще N individual listeners при масштабі
- Zone.js: кожен event binding потенційно тригерить CD — `NgZone.runOutsideAngular()` для frequent events

### Elevator Pitch (2 minutes)
Event binding в Angular — `(eventName)="handler($event)"` — реєструє DOM listener з auto-cleanup при destroy компоненту. `$event` — native DOM Event. Під капотом: Ivy `ɵɵlistener` через Renderer2. Для component communication: @Output() EventEmitter (RxJS-based, legacy) або `output()` (Angular 17+, lightweight, signal-native). Two-way binding `[(x)]` = `[x]` + `(xChange)`, або `model()` Signal для повністю reactive підходу. Key filters: `(keydown.enter)` без ручних keyCode перевірок. Performance: event delegation для великих списків, `NgZone.runOutsideAngular()` для mousemove/scroll. З zoneless Angular: events не auto-trigger CD — треба signal-based state або manual `markForCheck()`.
