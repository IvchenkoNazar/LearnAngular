---
title: "Signal-Based Reactive Patterns"
block: 3
topic: 6
slug: "signal-and-async-patterns"
difficulty: 4
sinceVersion: "17"
tags: ["signal", "computed", "effect", "toSignal", "toObservable", "RxJS interop"]
relatedTopics: ["built-in-pipes", "custom-pipes", "built-in-directives", "lifecycle-hooks", "component-metadata"]
interviewQuestions:
  - id: "b3t6q1"
    level: "junior"
    question: "Що таке signal в Angular і яка різниця між signal і BehaviorSubject?"
    referenceAnswers:
      junior: "Signal — це reactive value з Angular 16+. Відрізняється від BehaviorSubject тим що це Angular-нативне рішення без RxJS. signal() читається як function call: `count()`, встановлюється через `count.set(value)`."
      mid: "Signal — це reactive primitive Angular що notification model без Zone.js. BehaviorSubject — RxJS-based, потребує subscribe/unsubscribe управління. Signal автоматично відстежує залежності в reactive context (computed, effect, template) — при зміні signal всі залежні react автоматично. Signal: синхронний, synchronously reads value. BehaviorSubject: асинхронний pipe через subscribe. Memory: signal не потребує unsubscribe. BehaviorSubject — потребує cleanup або async pipe."
      senior: "Signal і BehaviorSubject вирішують схожу задачу але з різними моделями. BehaviorSubject: push model — subscriber отримує значення через callback. Signal: pull model з automatic tracking — Angular runtime відстежує які signals читаються в reactive context і реєструє dependencies. При signal.set() — Angular планує re-evaluation всіх dependent computeds і effects. Технічно: signal() — функція що при виклику в reactive context реєструє себе як dependency в поточному computation node. Під капотом Angular використовує graph of consumers/producers — reactive graph. Переваги Signal: 1) Немає memory leak — немає subscriptions. 2) Synchronous read. 3) Compiler може оптимізувати CD — знає точно які signals changed. 4) Zoneless compatible — не залежить від Zone.js. Коли BehaviorSubject: legacy code, RxJS operators pipeline, multicasting."
      staff: "Signal vs BehaviorSubject — це вибір reactive primitive для різних architectural contexts. Signal є Angular-native reactive graph node: при читанні в reactive context (template, computed, effect) — Angular автоматично реєструє producer-consumer relationship. При mutation — dirty marking propagates through graph, Angular schedules microtask for re-evaluation. BehaviorSubject — RxJS hot observable з initial value: підписники отримують current + future values. В 2025+ architecture: signals для synchronous UI state, RxJS для async streams (HTTP, WebSocket, timer). toSignal() bridge дозволяє інтегрувати Observable streams у signal graph без ручного subscribe/unsubscribe. Системний impact: перехід до signal-based state model дозволяє Angular перейти до zoneless rendering — Zone.js більше не потрібен для change detection triggering. Для enterprise migration: BehaviorSubject → signal поступово, toSignal(subject.asObservable()) як bridge pattern."
    commonMistakes:
      - "Думають що signal і Observable взаємозамінні скрізь — вони мають різні use cases"
      - "Не знають що signal читається як function call — `count` (reference) vs `count()` (value)"
    relatedQuestions: ["b3t6q2", "b3t6q3"]
  - id: "b3t6q2"
    level: "mid"
    question: "Як toSignal поводиться при початковому значенні? Що таке requireSync і чому це важливо для SSR?"
    referenceAnswers:
      junior: "toSignal конвертує Observable в signal. Якщо Observable не emitted відразу — signal має undefined початковим значенням."
      mid: "toSignal() без options: initialValue = undefined поки Observable не emit. TypeScript type буде `Signal<T | undefined>`. З `{ initialValue: T }` — початкове значення задається. З `{ requireSync: true }` — Angular очікує що Observable emit synchronously при підписці (BehaviorSubject, of()) — якщо ні — throws. requireSync дозволяє уникнути | undefined в type."
      senior: "toSignal() внутрішньо: підписується на Observable в injection context (destroy автоматично), зберігає last emitted value в signal. Type behavior: без initialValue — `Signal<T | undefined>`. З initialValue — `Signal<T>`. З requireSync: true — `Signal<T>` (без undefined), але Observable ПОВИННА emit synchronously при subscribe (BehaviorSubject, of(), ReplaySubject(1) з емісією). Якщо requireSync але Observable не emits synchronously — runtime error. SSR: HTTP Observable в SSR emit synchronously (Angular HTTP з SSR uses synchronous response). requireSync дозволяє використовувати HTTP result без undefined initial state — key для proper SSR rendering. Gotcha: toSignal() у компоненті поза injection context (не в constructor/field initializer) — потрібно передати injector: inject(Injector) як option."
      staff: "toSignal() — це critical bridge між RxJS і Angular Signal worlds. Architectural implications: 1) toSignal() управляє subscription lifecycle автоматично через DestroyRef — це усуває major pain point manual subscription management. 2) requireSync: true — architectural contract що Observable ЗАВЖДИ має value available — відповідне для state subjects (BehaviorSubject, state stores), не для lazy-loaded data. 3) SSR implications: без requireSync — initial render може показати undefined state якщо Observable async. Z Angular Universal: HTTP transferStateKey pattern + requireSync дозволяє hydratable state. 4) Lazy injection context: якщо toSignal() викликається поза constructor — `toSignal(obs$, { injector: inject(Injector) })`. Performance: toSignal() signal читається synchronously — no async callback chain. В computed() або template — direct read без subscribe overhead. Migration strategy для enterprise: поступова заміна AsyncPipe + BehaviorSubject patterns на toSignal() + signal, починаючи з leaf components."
    commonMistakes:
      - "Не знають різниці між initialValue і requireSync в typing"
      - "Викликають toSignal() поза injection context і отримують runtime error"
    relatedQuestions: ["b3t6q1", "b3t6q4"]
  - id: "b3t6q3"
    level: "mid"
    question: "Як effect cleanup працює і навіщо він потрібен?"
    referenceAnswers:
      junior: "effect() виконується коли змінюються signals що він читає. Cleanup — це функція що виконується перед наступним запуском effect або при destroy."
      mid: "effect() повертає EffectRef. Cleanup: повертати функцию з effect callback — вона викликається при наступному спрацюванні (перед новим виконанням) або при destroy. Використовується для: скасування попередніх async операцій, видалення listeners, закриття ресурсів. Аналог cleanup у React useEffect return function."
      senior: "effect() cleanup mechanism: callback всередині effect() може повернути cleanup function. Angular викликає її в двох випадках: 1) перед кожним повторним запуском effect (коли залежні signals змінились), 2) при destroy компонента/context. Типовий use case: `effect(() => { const sub = obs$.subscribe(handler); return () => sub.unsubscribe(); })` — попередня підписка скасовується перед новою. Або: AbortController для fetch. Gotcha: якщо effect() читає signal і той signal змінюється часто — cleanup/re-run стає expensive якщо cleanup has overhead. Рішення: debounce-like pattern або перевіряти чи потрібен re-run. effect() не можна викликати поза injection context — Angular throws. З Angular 17.1+: allowSignalWrites option для effect() що дозволяє змінювати signals всередині (були заборонені за замовчуванням)."
      staff: "effect cleanup — це критичний механізм для resource management в reactive programming. Архітектурно: effect() з cleanup замінює ngOnDestroy + manual subscription tracking для signal-driven side effects. Але: effect() повинен бути використаний обережно — він є 'escape hatch' з purely reactive model. Best practices: 1) Уникати side effects що mutate signals в effect() — може призвести до infinite loops. 2) effect() для DOM manipulation, analytics, logging, WebSocket connections. 3) Для async operations в effect: AbortController pattern — cancel попередній fetch при новому signal value. 4) allowSignalWrites: true — рідко потрібен, сигнал про poor reactive design якщо часто потрібен. Memory safety: effect() registered in injection context автоматично destroyed — не потрібен EffectRef.destroy() для стандартних cases. Але EffectRef.destroy() — для conditional effect lifecycle. Zoneless compatibility: effect() не залежить від Zone.js — future-proof pattern."
    commonMistakes:
      - "Не повертають cleanup function з effect() — resource leak"
      - "Мутують signals всередині effect() без allowSignalWrites — runtime error і architectural smell"
    relatedQuestions: ["b3t6q2", "b3t6q4"]
  - id: "b3t6q4"
    level: "senior"
    question: "Як computed dependency tracking визначає які signals відстежувати? Що відбувається з умовними залежностями?"
    referenceAnswers:
      junior: "computed() автоматично відстежує signals що читаються всередині. Коли вони змінюються — computed перераховується."
      mid: "computed() при першому виконанні записує які signals були прочитані. При зміні будь-якого з них — computed помічається як dirty і перераховується при наступному читанні (lazy evaluation). Якщо один з відстежуваних signals змінився але не вплинув на результат — computed все одно вважається dirty але повертає те саме значення."
      senior: "Computed dependency tracking — dynamic і per-execution. Angular не статично аналізує які signals будуть прочитані — відстежує runtime. Проблема умовних залежностей: `computed(() => { if (conditionSignal()) { return a(); } else { return b(); } })`. Якщо conditionSignal() = true — відстежуються conditionSignal і a. b — не відстежується! Якщо потім conditionSignal стає false — computed() перераховується (conditionSignal змінився), і тепер відстежує conditionSignal і b. Наступного разу при зміні a — computed() НЕ перераховується (a більше не в dependencies). Це коректна поведінка і optimization: computed не реагує на зміни що не впливають на поточний branch. Angular глосарій: dependency tracking реалізований через reactive context stack — при computed() виконанні, будь-який signal read реєструє poточний computed як consumer."
      staff: "Dynamic dependency tracking — це fundamental property Angular reactive graph. Кожне computed() виконання creates new dependency set — попередні залежності забуваються. Це дозволяє: 1) Fine-grained reactivity: computed реагує тільки на relevant signals для поточного стану. 2) Conditional optimization: inactive branches не тригерять re-computation. 3) Потенційна проблема: якщо computed reads many different signals conditionally — dependency set нестабільна, що ускладнює mental model. Edge case: computed() що повертає другий signal (signal-of-signal) — Angular 'unwraps' тільки один level. Для двох рівнів: `computed(() => innerSignal()())` — явно unwrap. Lazy evaluation: computed() не перераховується при dependency change — тільки маркується dirty. Перерахунок відбувається при наступному read. Якщо ніхто не читає computed — він ніколи не перераховується (повна laziness). Це важливо для performance: unused computed = zero cost після initial creation. Architectural pattern: decompose complex computed into multiple smaller computeds — краща readability і granular reactivity."
    commonMistakes:
      - "Думають що computed відстежує всі signals у функції статично — не розуміють dynamic tracking"
      - "Не розуміють lazy evaluation — думають computed перераховується одразу при зміні dependency"
    relatedQuestions: ["b3t6q3", "b3t6q5"]
  - id: "b3t6q5"
    level: "staff"
    question: "Як реалізувати signal-based reactive форму без ReactiveFormsModule? Які trade-offs?"
    referenceAnswers:
      junior: "Можна використовувати signal для зберігання значень форми і обробки змін без FormControl."
      mid: "Signal-based форма: signal() для кожного поля або один signal з FormState об'єктом. (input) event handler викликає signal.update(). Валідація через computed() від field signals. Немає залежності від ReactiveFormsModule. Але: втрачаємо built-in validators, directives, FormGroup API."
      senior: "Signal-based форма: `const form = signal<FormState>({ email: '', password: '' })`. Computed validators: `const emailError = computed(() => validateEmail(form().email))`. Computed valid state: `const isValid = computed(() => !emailError() && !passwordError())`. Template: `<input [value]='form().email' (input)='updateField(\"email\", $event)'>`. Переваги: простота, синхронність, без RxJS. Недоліки: немає dirty/touched tracking з коробки, немає built-in validators, немає form arrays, немає async validators. Компроміс: hybrid — signal для UI state + ReactiveFormsModule для validation logic. Або: повна заміна для simple forms (login, search), ReactiveFormsModule для complex forms. Angular team анонсувала signal-based forms (angular/angular#47478) — в розробці."
      staff: "Signal-based форма — це архітектурне рішення що має реальні trade-offs. Pro: simplified model, no subscription management, synchronous validation, better composability with signals ecosystem. Con: втрата FormControl API (pristine/dirty/touched/pending states), відсутність вбудованих validator compositors, відсутність FormArray для dynamic fields, відсутність cross-field validators в ergonomic way. Enterprise considerations: 1) Form library investment: ReactiveFormsModule — добре відомий pattern, thousands of senior developers знають його — switching cost. 2) Third-party form integrations (UI libraries) очікують FormControl. 3) Signal forms — experimental pattern поки немає official Angular support. 4) Hybrid approach: signals для form state management (show/hide fields, complex UI logic), FormControl для validation і form value management — best of both worlds. Long-term: Angular team розробляє signal-based forms API — слідкувати за RFC. Архітектурна рекомендація для 2025: ReactiveFormsModule для production forms, signal-based для простих forms (search, filter, single field)."
    commonMistakes:
      - "Думають що signal-based форми замінюють ReactiveFormsModule повністю — втрачають bagато built-in features"
      - "Не реалізують dirty/touched state що critical для UX validation feedback"
    relatedQuestions: ["b3t6q4", "b3t6q1"]
---

## Core Concept

**English definition:** Angular Signals are a reactive primitive introduced in Angular 16 that provide fine-grained reactivity through a producer-consumer graph. Unlike Zone.js-based change detection, signals precisely track which components and computeds depend on which values, enabling targeted updates and eventual zoneless rendering.

**Пояснення:** Signals — це Angular-нативна реактивність без Zone.js. signal() — контейнер для значення що сповіщає Angular коли змінюється. computed() — derived value що автоматично перераховується. effect() — side effect що реагує на зміни. Разом вони формують реактивний граф: зміна signal propagates через computed до template без глобального CD traversal.

**Яку проблему вирішує:** Zone.js-based CD — глобальний і дорогий: при будь-якій async операції Angular перевіряє весь дерево компонентів. Signals — точковий: Angular знає ТОЧНО які компоненти залежать від зміненого signal і оновлює тільки їх.

**Як працює під капотом:** Signal при виклику в reactive context (computed, effect, template expression) реєструє поточний consumer node у своєму список subscribers. При signal.set()/update() — Angular маркує всіх registered consumers як "dirty". Computed() — lazy: маркується dirty але не перераховується до наступного read. Template: Angular scheduler перевіряє dirty signals перед CD — оновлює тільки affected views. Reactive graph: DAG (Directed Acyclic Graph) де signals — leaf nodes, computeds — intermediate nodes, template expressions — root consumers.

**Trade-offs та обмеження:** Signals — synchronous pull model, Observable — asynchronous push model. RxJS operators (debounceTime, switchMap, etc.) не застосовуються до signals напряму — потрібен toObservable() bridge. Signals не підходять для multi-cast streams, event buses, complex async pipelines. effect() — escape hatch, не primary reactive mechanism.

**Версійність:** signal(), computed(), effect() — developer preview Angular 16, stable Angular 17. toSignal(), toObservable() (@angular/rxjs-interop) — Angular 16+, stable Angular 17. input() як signal — Angular 17+. model() два-way binding signal — Angular 17.1+. Zoneless rendering (provideExperimentalZonelessChangeDetection) — Angular 18 experimental. Signal-based queries (viewChild(), contentChild()) — Angular 17.2+.

---

## Deep Details

### Edge Cases

**Signal в injection context:** signal(), computed(), effect(), toSignal() — всі мають бути викликані в injection context (constructor або field initializer). Поза injection context — runtime error або потрібен explicit Injector.

**computed() і side effects:** computed() не повинен мати side effects — він може бути перерахований кілька разів або не перерахований взагалі (lazy). Side effects → effect().

**effect() і signal writes:** За замовчуванням Angular throws якщо effect() пише в signal. Причина: infinite loop prevention. `allowSignalWrites: true` у options — дозволяє, але потребує обережності.

**toSignal() і error handling:** Якщо Observable в toSignal() emits error — сигнал кидає error при наступному read. Wrap з catchError() перед toSignal().

**Signal equality:** За замовчуванням signal використовує Object.is() для equality check. Custom: `signal(value, { equal: customEqualFn })`. Важливо для object signals: без custom equal — кожен set() тригерить update навіть якщо об'єкт семантично однаковий.

**untracked():** `untracked(() => someSignal())` — читає signal без реєстрації як dependency. Корисно в effect() коли хочеш read but not track.

### Junior vs Senior Understanding

**Junior** знає: signal(), computed(), effect() API, toSignal() для Observable конвертації.

**Senior** розуміє глибше:

1. **Reactive graph і lazy evaluation:** computed() маркується dirty але перераховується lazy при read. effect() — eager (планується асинхронно після signal change). Template reads — eager при CD.

2. **Dynamic dependency tracking:** computed() відстежує тільки signals що були READ в поточному execution. Умовні залежності — динамічні.

3. **toSignal requireSync і SSR:** requireSync для BehaviorSubject/synchronous Observable дозволяє уникнути `T | undefined` type — critical для SSR hydration correctness.

4. **untracked() pattern:** Читати signal в effect() без додавання як dependency — `untracked(() => otherSignal())`.

5. **model() для two-way binding:**
```typescript
// Angular 17.1+
name = model(''); // ReadWriteSignal
// template: <input [(ngModel)]="name">
// або: <app-child [(name)]="parentName">
```

### Deprecation & Migration Path

**Zone.js-based CD:** Не deprecated але gradually replaced by signal-based reactivity. Migration: incremental — додавати signals до нових features, не переписувати legacy.

**AsyncPipe → toSignal():**
```typescript
// Before:
// template: {{ user$ | async }}

// After:
user = toSignal(this.userService.user$, { initialValue: null });
// template: {{ user() }}
```

**BehaviorSubject → signal():**
```typescript
// Before:
private userSubject = new BehaviorSubject<User | null>(null);
readonly user$ = this.userSubject.asObservable();
setUser(user: User) { this.userSubject.next(user); }

// After:
readonly user = signal<User | null>(null);
// читання: user()
// запис: user.set(newUser)
```

### Connections to Other Concepts

- **Change Detection (b4t1):** Signals — alternative CD triggering без Zone.js marking.
- **Built-in Directives (b3t1):** `@if (mySignal())` — native signal integration в control flow.
- **Component Inputs (b2t3):** `input()` — signal-based @Input replacement.
- **RxJS (b7):** toSignal/toObservable bridges між Signal і Observable worlds.

---

## Examples

### Basic Usage

```typescript
// counter.component.ts — базові signals
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ doubled() }}</p>
    <p>Status: {{ status() }}</p>
    <button (click)="increment()">+1</button>
    <button (click)="reset()">Reset</button>
  `
})
export class CounterComponent {
  count = signal(0);

  // computed: lazy, memoized, залежить від count
  doubled = computed(() => this.count() * 2);

  status = computed(() =>
    this.count() === 0 ? 'zero' :
    this.count() > 0 ? 'positive' : 'negative'
  );

  constructor() {
    // effect: eager, side effects, cleanup
    effect((onCleanup) => {
      const current = this.count();
      console.log(`Count changed to: ${current}`);
      // Cleanup при наступному effect run або destroy
      onCleanup(() => console.log('Cleaning up previous effect'));
    });
  }

  increment() { this.count.update(c => c + 1); }
  reset() { this.count.set(0); }
}
```

### Production Scenario

```typescript
// user-dashboard.component.ts — real-world signal patterns
import {
  Component, signal, computed, inject, effect
} from '@angular/core';
import { toSignal, toObservable } from '@angular/rxjs-interop';
import { debounceTime, switchMap, catchError, of } from 'rxjs';
import { UserService } from './user.service';
import { FilterService } from './filter.service';

interface UserFilter {
  search: string;
  role: string | null;
  page: number;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  template: `
    <input [value]="filter().search"
           (input)="updateSearch($event)" />

    @if (isLoading()) {
      <app-skeleton />
    } @else if (error()) {
      <app-error [message]="error()!" />
    } @else {
      @for (user of users(); track user.id) {
        <app-user-card [user]="user" />
      }
      <p>Total: {{ totalCount() }}</p>
    }
  `
})
export class UserDashboardComponent {
  private userService = inject(UserService);

  // Primary state signal
  filter = signal<UserFilter>({ search: '', role: null, page: 1 });

  isLoading = signal(false);
  error = signal<string | null>(null);

  // RxJS pipeline для debounced search — потрібен RxJS для debounce
  private users$ = toObservable(this.filter).pipe(
    debounceTime(300),  // RxJS operator — не доступний для signal напряму
    switchMap(f => {
      this.isLoading.set(true);
      this.error.set(null);
      return this.userService.getUsers(f).pipe(
        catchError(err => {
          this.error.set(err.message);
          return of({ users: [], total: 0 });
        })
      );
    })
  );

  // Back to signals via toSignal
  private usersState = toSignal(this.users$, {
    initialValue: { users: [], total: 0 }
  });

  users = computed(() => {
    const state = this.usersState();
    this.isLoading.set(false); // побічний ефект в computed — краще в effect
    return state.users;
  });

  totalCount = computed(() => this.usersState().total);

  updateSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    // update зберігає решту фільтру
    this.filter.update(f => ({ ...f, search: value, page: 1 }));
  }
}
```

### Anti-Example

```typescript
// ❌ Типові помилки з signals

@Component({ template: `{{ value() }}` })
export class BadSignalsComponent {
  value = signal(0);

  // ❌ computed зі side effect — порушує contract
  badComputed = computed(() => {
    const v = this.value();
    localStorage.setItem('value', String(v)); // ❌ side effect в computed!
    return v * 2;
  });

  constructor() {
    // ❌ Effect що пише в signal без allowSignalWrites — runtime error
    effect(() => {
      const v = this.value();
      this.value.set(v + 1); // ❌ Infinite loop! set → effect → set...
    });

    // ❌ toSignal поза injection context
    setTimeout(() => {
      // ❌ Runtime error: not in injection context
      const sig = toSignal(someObservable$);
    }, 1000);

    // ❌ Не використовується untracked для "read but not track"
    effect(() => {
      const primary = this.primarySignal();
      // Хочемо читати secondary але не відстежувати зміни
      const secondary = this.secondarySignal(); // ❌ відстежується!
      doSomething(primary, secondary);
    });
  }
}

// ✅ ПРАВИЛЬНО
@Component({ template: `{{ value() }}` })
export class GoodSignalsComponent {
  value = signal(0);

  // ✅ computed — чиста функція, без side effects
  goodComputed = computed(() => this.value() * 2);

  constructor() {
    // ✅ Side effect в effect, не в computed
    effect(() => {
      localStorage.setItem('value', String(this.value()));
    });

    // ✅ toSignal в injection context (constructor)
    const sig = toSignal(someObservable$, { initialValue: 0 });

    // ✅ untracked для "read but not track"
    effect(() => {
      const primary = this.primarySignal();
      const secondary = untracked(() => this.secondarySignal());
      doSomething(primary, secondary);
    });
  }
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Side effect в `computed()` | computed() може бути викликаний multiple times або не викликаний — side effects непередбачувані | Переносити side effects до `effect()` |
| `signal.set()` всередині `effect()` без `allowSignalWrites` | Runtime error + потенційний infinite loop | Restructure reactive graph або `untracked()` |
| `toSignal()` поза injection context | Runtime error: Angular не може register cleanup | Викликати в constructor або field initializer |
| Читати signal поза reactive context для derived state | Вручну subscribe на зміни через сторонні механізми | computed() для automatic tracking |
| BehaviorSubject замість signal для UI state | Потребує subscribe/unsubscribe management, не integrates з signal graph | `signal()` + `toObservable()` якщо потрібен Observable API |

---

## Interview Block

### [L1 — Warm-up] Що таке signal і яка різниця між `signal`, `computed` і `effect`?

**Signal being tested:** Базове розуміння трьох primitives і їх roles в reactive model.

**What the interviewer expects:** signal = mutable state, computed = derived readonly state, effect = side effects. Розуміння що computed lazy, effect eager.

**How to probe deeper:** "Що відбувається якщо computed() ніхто не читає але його dependencies змінились?"

**Reference answer:** signal() — mutable reactive value: `const n = signal(0); n.set(1); n.update(v => v+1); n()` — read. computed() — derived readonly: `computed(() => n() * 2)` — lazy, перераховується тільки при read після dependency change. effect() — side effect: `effect(() => console.log(n()))` — eager, виконується асинхронно після signal change. computed() якщо не читається — ніколи не перераховується (повна laziness).

**Common mistakes:** Думають computed eager як effect. Не знають про lazy evaluation.

---

### [L2 — Mid] Навіщо `toSignal()` і як `requireSync` впливає на TypeScript типи?

**Signal being tested:** Розуміння bridge між Observable і Signal worlds і type safety implications.

**What the interviewer expects:** toSignal = subscribe + cleanup + signal bridge. Без initialValue → T|undefined. З requireSync → T (no undefined). SSR implications.

**How to probe deeper:** "Де саме можна викликати toSignal() і що станеться якщо викликати в ngOnInit?"

**Reference answer:** toSignal() підписується на Observable в injection context і зберігає last value в signal. Тип: без options → `Signal<T | undefined>`. З `{ initialValue: T }` → `Signal<T>`. З `{ requireSync: true }` → `Signal<T>` але Observable MUST emit synchronously при subscribe — інакше runtime error. Для BehaviorSubject → requireSync: true безпечно (always has value). ngOnInit — поза injection context → потрібен `toSignal(obs$, { injector: inject(Injector) })`.

**Common mistakes:** Думають requireSync і initialValue — одне і те ж. Викликають toSignal в lifecycle hooks.

---

### [L3 — Senior] Поясни dynamic dependency tracking в computed(). Що відбудеться з умовними залежностями?

**Signal being tested:** Глибоке розуміння reactive graph і runtime dependency tracking mechanism.

**What the interviewer expects:** Dependencies відстежуються runtime, не статично. Conditional branches — dynamic set. Lazy evaluation — computed не перераховується якщо ніхто не читає.

**How to probe deeper:** "Як untracked() допомагає якщо потрібно read signal в computed без додавання як dependency?"

**Reference answer:** computed() при виконанні записує всі signals що були прочитані як current dependencies. Умовні залежності: `computed(() => flag() ? a() : b())` — якщо flag() = true, відстежуються flag і a, не b. При зміні b — computed не dirty (b не в dependencies). При зміні flag — computed dirty, re-evaluate, тепер відстежує flag і b. untracked((): `computed(() => { const main = mainSig(); const ctx = untracked(() => contextSig()); return process(main, ctx); })` — contextSig читається але не в dependencies.

**Common mistakes:** Думають залежності статичні. Не розуміють що lazy evaluation означає що unused computed = zero overhead after creation.

---

### [L4 — Staff/Principal] Як signals архітектурно змінюють Angular application design і що таке zoneless rendering?

**Signal being tested:** Системне розуміння impact signals на CD model, migration strategy і zoneless future.

**What the interviewer expects:** Signal graph vs Zone.js global CD, zoneless experimental, migration path, trade-offs з RxJS, architectural recommendations.

**How to probe deeper:** "Якщо перейти на zoneless — які частини існуючої кодобази потребують змін?"

**Reference answer:** Signal reactive graph: Angular знає ТОЧНО які components/computeds залежать від зміненого signal — targeted updates. Zone.js: патчує всі async APIs, будь-яка async operation тригерить global CD traversal. Zoneless (Angular 18 experimental `provideExperimentalZonelessChangeDetection`): Zone.js не потрібен — Angular оновлює тільки signal-dirty components. Для zoneless: весь state повинен бути signal-based або explicit CD triggers (markForCheck). HTTP, Router, Forms — Angular оновив їх для signal compatibility. Migration: 1) Додати signals для нових features. 2) Поступово замінити BehaviorSubject → signal. 3) AsyncPipe → toSignal(). 4) Тестувати з zoneless provider. 5) Видалити Zone.js з polyfills. Trade-offs: RxJS operators (debounceTime, switchMap) — через toObservable() bridge; complex async orchestration — RxJS залишається кращим.

**Common mistakes:** Думають "signals замінюють RxJS" — вони complementary для різних cases. Не думають про breaking changes при zoneless migration (third-party libraries що rely on Zone.js).

---

## Summary

### Key Points

- signal() — mutable reactive primitive: синхронне читання через `signal()`, запис через `.set()/.update()`
- computed() — lazy derived value: перераховується тільки при read після dependency change, pure function без side effects
- effect() — eager side effect: виконується асинхронно після dependency change, cleanup function через onCleanup parameter
- toSignal() — Observable → Signal bridge: manages subscription lifecycle, `requireSync: true` для BehaviorSubject → `Signal<T>` без undefined
- toObservable() — Signal → Observable bridge: дозволяє використовувати RxJS operators (debounceTime, switchMap) на signal changes
- Dynamic dependency tracking: computed відстежує тільки signals що були read в поточному execution — conditional branches dynamic
- Zoneless rendering (Angular 18 experimental): signals + explicit CD triggers, без Zone.js global traversal

### Elevator Pitch (2 minutes)

Angular Signals — це reactive primitive що замінює Zone.js-based global change detection на targeted graph-based reactivity. Три primitives: signal() — mutable state, computed() — derived lazy value, effect() — eager side effects. RxJS interop: toSignal() конвертує Observable в signal (manages subscription), toObservable() зворотно. Ключові правила: computed() — чиста функція без side effects, effect() для side effects з cleanup через onCleanup, toSignal() тільки в injection context. Dynamic dependency tracking: computed відстежує тільки ті signals що читаються в поточному execution — optimal для conditional branches. Майбутнє: zoneless rendering (Angular 18+) де Zone.js більше не потрібен — signals знають точно що оновлювати. Migration pattern: BehaviorSubject → signal(), AsyncPipe → toSignal(), поступово починаючи з leaf components.
