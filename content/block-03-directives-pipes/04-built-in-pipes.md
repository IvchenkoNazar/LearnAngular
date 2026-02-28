---
title: "Built-in Pipes & Pure vs Impure"
block: 3
topic: 4
slug: "built-in-pipes"
difficulty: 2
sinceVersion: "2"
tags: ["pipe", "DatePipe", "CurrencyPipe", "AsyncPipe", "pure", "impure", "UpperCasePipe"]
relatedTopics: ["custom-pipes", "signal-and-async-patterns", "built-in-directives", "component-metadata"]
interviewQuestions:
  - id: "b3t4q1"
    level: "junior"
    question: "Що таке pure і impure pipe? Яка різниця в поведінці?"
    referenceAnswers:
      junior: "Pure pipe викликається тільки коли змінюється reference вхідних даних. Impure pipe викликається на кожен change detection cycle. Pure pipes ефективніші."
      mid: "Pure pipe: Angular викликає transform() тільки коли input value або reference змінився (strict equality ===). Impure pipe: transform() викликається на кожен CD cycle незалежно від змін. Це дозволяє impure pipe реагувати на мутації масивів/об'єктів. Але impure pipe — performance overhead. AsyncPipe — приклад impure pipe: він повинен відстежувати active Observable/Promise state."
      senior: "Pure pipe: Angular використовує memoization — зберігає останній input і output. Якщо нові inputs (===) збігаються з попередніми — повертає cached output без виклику transform(). Це O(1) для незмінених inputs. Impure pipe: transform() викликається щоразу при CD. Чому AsyncPipe impure: Observable emission не змінює reference на Observable — Angular не може detect зміни через strict equality. Тому AsyncPipe повинен бути impure: вона зберігає internal subscription state і повертає останнє emitted значення при кожному transform() виклику. Gotcha: pure pipe з object input — якщо об'єкт мутується (array.push()) — pipe не оновлюється бо reference не змінилась."
      staff: "Pure/impure distinction — це фундаментальний trade-off між performance і reactivity. Pure pipe — functional concept: детермінований output для однакового input, без side effects — дозволяє мемоізацію. В Angular CD model: pure pipe перевіряється одного разу за CD cycle з cache. Impure pipe — react to any state change, але коштує одного виклику transform() за CD cycle PER pipe instance PER element. Системні implications: якщо impure pipe в @for списку з 1000 items — 1000 transform() викликів за кожен CD cycle. Architectural rule: immpure pipe в template — red flag для code review. Prefer: signal-based reactive state + pure pipe, або computed() замість impure pipe. AsyncPipe exception: вона специфічно designed для Observable pattern, але в Signal-based codebase — toSignal() + pure pipe або пряме використання signal value."
    commonMistakes:
      - "Думають що impure pipe 'оновлюється автоматично' без розуміння CD cost"
      - "Не розуміють чому AsyncPipe impure — не знають механізм"
    relatedQuestions: ["b3t4q2", "b3t4q5"]
  - id: "b3t4q2"
    level: "mid"
    question: "Як AsyncPipe запобігає memory leaks і що відбувається якщо Observable не завершується?"
    referenceAnswers:
      junior: "AsyncPipe автоматично підписується на Observable і відписується коли компонент знищується."
      mid: "AsyncPipe реалізує OnDestroy — при destroy компонента автоматично викликає unsubscribe(). Це запобігає memory leak. Якщо передати новий Observable до AsyncPipe — вона відписується від старого і підписується на новий. Для Promise — AsyncPipe чекає resolve і рендерить значення. Компонент не потребує ручного управління підпискою."
      senior: "AsyncPipe — це impure pipe що реалізує SubscriptionStrategy: для Observable викликає subscribe(), для Promise — then(). При CD cycle: якщо є нова emissions — markForCheck() на компоненті (важливо для OnPush). При destroy: unsubscribe/cleanup. Важливий нюанс: якщо Observable не завершується (BehaviorSubject, interval) — AsyncPipe все одно cleanup при компонент destroy. Але якщо reference на Observable змінюється в template (new Observable кожен CD) — AsyncPipe підписується і відписується на кожен cycle — memory і performance проблема. Gotcha: `{{ stream$ | async }}` де stream$ — getter що повертає new Observable — катастрофа. Fix: зберігати Observable reference в полі, не обчислювати в getter."
      staff: "AsyncPipe — це ergonomic wrapper навколо manual subscription management. Але в великих додатках є архітектурні trade-offs: 1) Multiple AsyncPipe на одному Observable — кожна AsyncPipe робить окрему підписку. Fix: shareReplay(1) або один async pipe з as binding. 2) OnPush compatibility — AsyncPipe викликає markForCheck() тому добре працює з OnPush. 3) Перехід до Signals: toSignal() замінює AsyncPipe — підписується в injection context, автоматично cleanup, signal-based реактивність без CD traversal. 4) Error handling: AsyncPipe не має built-in error handling — Observable error = unhandled exception в template. Fix: catchError() перед AsyncPipe. 5) Loading states: AsyncPipe не надає loading/error state — потребує окремих механізмів або custom async pipe. Архітектурна рекомендація: для нових проєктів з Signals — toSignal() + template signal reads замість AsyncPipe."
    commonMistakes:
      - "Повертають new Observable з getter/computed і підписуються при кожному CD"
      - "Не знають що кілька AsyncPipe на одному Observable — кілька окремих підписок"
    relatedQuestions: ["b3t4q1", "b3t4q3"]
  - id: "b3t4q3"
    level: "mid"
    question: "Як правильно chaining pipes? Покажи приклад з DatePipe та UpperCasePipe."
    referenceAnswers:
      junior: "Pipes можна об'єднати через | символ: {{ value | pipe1 | pipe2 }}. Результат першого pipe передається до другого."
      mid: "Pipe chaining: `{{ date | date:'medium' | uppercase }}` — результат DatePipe (string) передається до UpperCasePipe. Порядок важливий: виконуються зліва направо. Аргументи для конкретного pipe: pipe:arg1:arg2. Можна chain будь-яку кількість pipes але кожна pipe — окрема обробка. Performance: кожна pure pipe в chain мемоізована окремо."
      senior: "Pipe chaining — лінійна композиція: output попередньої pipe стає input наступної. Type safety: кожна pipe має typed transform method — TypeScript перевіряє що output типу першої pipe сумісний з input типом другої. Наприклад: DatePipe transform повертає string | null — якщо UpperCasePipe очікує string, TypeScript попередить про nullable. Від Angular 14+: strict template type checking перевіряє pipe chain types. Performance: кожна pure pipe в chain кешується незалежно — якщо тільки одна з них змінила input, лише вона перераховується. Gotcha: `{{ value | slice:0:5 | uppercase }}` — slice pipe модифікує масив/рядок, uppercase перетворює результат. SlicePipe — impure pipe! Весь chain може бути expensive якщо є хоч одна impure pipe."
      staff: "Pipe chaining — це functional composition в template. Архітектурно: довгий pipe chain в template — сигнал що трансформаційна логіка повинна бути в component або service. Template pipe chain читається легко до 2-3 pipes, далі — maintenance overhead. Критична деталь: якщо будь-яка pipe в chain impure — весь chain потенційно expensive. Type propagation в chain: Angular 16+ strict template checking відстежує типи крізь chain — compile-time error якщо types incompatible. Для design system або shared templates: pipe chains повинні бути documented — споживач повинен розуміти performance характеристики. Альтернатива для complex transformations: computed() або ViewModel pattern де transformations відбуваються в component class, не template."
    commonMistakes:
      - "Не знають що impure pipe в chain робить весь chain expensive"
      - "Не перевіряють nullable types при chaining (DatePipe може повертати null)"
    relatedQuestions: ["b3t4q1", "b3t4q4"]
  - id: "b3t4q4"
    level: "senior"
    question: "Як DatePipe і CurrencyPipe залежать від locale? Як правильно налаштувати i18n в Angular?"
    referenceAnswers:
      junior: "DatePipe форматує дати, CurrencyPipe — валюту. Вони враховують locale налаштування Angular."
      mid: "DatePipe і CurrencyPipe використовують LOCALE_ID injection token. За замовчуванням — en-US. Для зміни locale: provide LOCALE_ID в providers і registerLocaleData(). DatePipe приймає format string або named formats (short, medium, long). CurrencyPipe: currencyCode, display (symbol/code), digitsInfo."
      senior: "Angular i18n для pipes: 1) registerLocaleData() — реєструє locale data (дата/час formats, currency symbols, number formats). 2) LOCALE_ID — injection token для active locale. 3) DatePipe, CurrencyPipe, DecimalPipe, PercentPipe — всі використовують LOCALE_ID. Динамічна зміна locale: LOCALE_ID — синхронний token, зміна потребує re-injection (наприклад app restart або dynamic component) — це обмеження Angular. Альтернатива для runtime locale switching: ngx-translate або Angular i18n з lazy locale modules. DatePipe format: 'yyyy-MM-dd' (strict format), 'medium' (locale-dependent named format). Timezone: DatePipe приймає timezone parameter — UTC, America/New_York, etc. CurrencyPipe з undefined locale — fallback до en-US."
      staff: "Locale-aware pipes — це infrastructure concern для internationalized apps. Системні рішення: 1) Static locale (build-time): одна build per locale, LOCALE_ID provides at compile time, максимальний bundle optimization. 2) Dynamic locale (runtime): один build, locale switch on the fly, потребує динамічного завантаження locale data. 3) Hybrid: initial locale від browser/user preferences, зберігається в localStorage/cookie. Архітектурні пастки: DatePipe з user timezone — відображати в UTC чи local time? Для фінансових apps — CurrencyPipe форматування може відрізнятись від backend validation — потрібна єдина джерело truth (backend або shared i18n library). Для micro-frontends: якщо кожен MFE може мати різний locale — coordination проблема. Рекомендація: centralized locale management service з typed locale config."
    commonMistakes:
      - "Не реєструють locale data (registerLocaleData) і дивуються чому date formats не змінились"
      - "Думають що LOCALE_ID можна динамічно змінити без перестворення компонентів"
    relatedQuestions: ["b3t4q3", "b3t4q5"]
  - id: "b3t4q5"
    level: "staff"
    question: "Які performance implications від використання багатьох pipes в template компонента що рендерить великі списки? Як оптимізувати?"
    referenceAnswers:
      junior: "Занадто багато pipes може сповільнити app. Pure pipes ефективніші ніж impure."
      mid: "В @for списку кожен елемент має свої pipe instances. Pure pipes мемоізовані — не перераховуються якщо input не змінився. Impure pipes обчислюються на кожен CD. Для великих списків це може бути суттєво."
      senior: "Performance analysis для pipes в @for: 1) Pure pipe + незмінна reference: O(1) per CD cycle — cached result. 2) Pure pipe з новим reference кожен render: O(n) де n = list size. 3) Impure pipe: O(n) на кожен CD cycle незалежно від змін. Проблемні patterns: DatePipe в @for 1000 items з OnPush Default + часті CD cycles — 1000 DatePipe transform() calls. Fix: використовувати pre-computed values в ViewModel, не pipes в template. OnPush + signals: CD cycles мінімальні — pure pipes не є bottleneck. Profile: Angular DevTools → Profiler показує CD cycles. Реальний bottleneck зазвичай не pipe overhead а кількість CD cycles."
      staff: "Pipes performance в контексті великих списків — це multi-layered optimization problem. Layer 1 — CD cycles: зменшити кількість CD cycles через OnPush + Signals — pure pipes стають non-issue. Layer 2 — pipe computation cost: якщо transform() дорога (regex, formatting) — memoize в component: Map<input, output> lookup. Layer 3 — impure pipes в lists: ніколи не мати impure pipe в @for template — move logic to ViewModel. Layer 4 — virtual scrolling: CDK VirtualScrollViewport render тільки visible items — pipes обчислюються тільки для visible subset. Layer 5 — Web Workers: для computationally expensive transformations — move to worker, pipe в template тільки для simple display. Системна рекомендація: ViewModel pattern (transform data before template) + pure pipes тільки для simple display formatting + OnPush + Signals = оптимальна combination для performance. Pipes — template concern, не data processing concern."
    commonMistakes:
      - "Оптимізують pipes не вимірявши — можна оптимізувати не те"
      - "Додають impure pipe в @for шаблон і дивуються що app сповільнився"
    relatedQuestions: ["b3t4q1", "b3t4q2"]
---

## Core Concept

**English definition:** Angular pipes are pure functions applied in template expressions to transform display values. They follow the `value | pipeName:arg1:arg2` syntax. Pure pipes are memoized (called only on reference change), impure pipes run on every change detection cycle.

**Пояснення:** Pipes — це трансформатори даних для template. Вони беруть значення, застосовують форматування або трансформацію, і повертають відображуване значення. Ключова ідея: pipes вирішують display concern — як показати дані, а не яку бізнес-логіку виконати.

**Яку проблему вирішує:** Дублювання форматування скрізь по template: `{{ user.createdAt | date:'mediumDate' }}` замість `formatDate(user.createdAt)` в кожному компоненті. Pipes — reusable, composable, lazy (pure = тільки при необхідності), і declarative.

**Як працює під капотом:** Pure pipe: Angular зберігає `[lastInput, lastOutput]` tuple. При кожному CD: якщо input === lastInput — повертає lastOutput. Якщо ні — викликає transform() і оновлює cache. Impure pipe: transform() викликається кожного CD cycle без cache. AsyncPipe: subscribe до Observable/Promise, зберігає last emitted value, повертає його з transform(). При зміні value — markForCheck() для OnPush compatibility.

**Trade-offs та обмеження:** Pure pipes не бачать мутацій масивів/об'єктів (потрібна нова reference). Impure pipes дорогі в @for списках. Pipes — тільки для display transformation, не для side effects. Pipe chaining з impure pipe = весь chain expensive.

**Версійність:** Pipes — з Angular 2. AsyncPipe — з Angular 2. DatePipe з timezone parameter — Angular 5+. Strict pipe type checking — Angular 14+. Standalone pipes (standalone: true) — Angular 14+. SlicePipe, JsonPipe, KeyValuePipe — з Angular 2.

---

## Deep Details

### Edge Cases

**DatePipe і null/undefined:** `{{ null | date }}` → `''` (empty string, не error). Але `{{ undefined | date }}` теж `''`. Потрібна явна перевірка якщо null має інше значення.

**AsyncPipe і null:** Поки Observable не emitted — AsyncPipe повертає null. `{{ user$ | async }}` виводить `null` в DOM. Fix: `@if (user$ | async; as user) { {{ user.name }} }`.

**SlicePipe — impure!** `[1,2,3] | slice:0:2` — SlicePipe impure бо масиви мутабельні. В @for — O(n) на кожен CD.

**KeyValuePipe:** Сортує keys за замовчуванням. Для Map — підтримує Map iteration order.

**CurrencyPipe і locale:** `{{ 1234.5 | currency:'EUR':'symbol':'1.2-2':'uk' }}` → `1 234,50 €` (Ukrainian locale). Без locale parameter — використовує LOCALE_ID.

**JsonPipe — impure:** Для debug purposes — `{{ obj | json }}` — impure pipe, не для production.

### Junior vs Senior Understanding

**Junior** знає: | синтаксис, DatePipe/CurrencyPipe/AsyncPipe usage, pure vs impure визначення.

**Senior** розуміє глибше:

1. **AsyncPipe markForCheck():** AsyncPipe викликає markForCheck() при кожній emission — це означає що OnPush компонент з AsyncPipe буде re-checked при новому значенні. Але markForCheck() позначає всю гілку до root — не тільки один компонент.

2. **Multiple AsyncPipe на одному Observable:** Два `{{ data$ | async }}` в template = два окремих subscriptions. Fix: `@if (data$ | async; as data)` — один subscription, data доступна всередині блоку.

3. **Pipe і static analysis:** Angular 14+ strict template checking перевіряє pipe input/output types. `{{ date | date | uppercase }}` — TypeScript перевіряє що date pipe output (string | null) сумісний з uppercase pipe input (string).

4. **Pure pipe і WeakMap cache:** Деякі pipe реалізації використовують WeakMap для extended caching — якщо input — об'єкт, можна cache by reference.

### Deprecation & Migration Path

**SlicePipe і impure behavior:** Не deprecated але часто misused. В Angular 17+ з signal-based lists — краще computed() для slicing.

**AsyncPipe migration до toSignal():**
```typescript
// Before: AsyncPipe
// template: {{ user$ | async | json }}

// After: toSignal() в injection context
user = toSignal(this.user$, { initialValue: null });
// template: {{ user() | json }}
```

**ngx-translate vs Angular i18n:** Для runtime locale switching — ngx-translate зі своїм TranslatePipe. Angular built-in i18n — compile-time, не runtime.

### Connections to Other Concepts

- **Custom Pipes (b3t5):** Той самий PipeTransform interface, pure/impure distinction.
- **AsyncPipe і Signals (b3t6):** toSignal() замінює AsyncPipe в signal-based architecture.
- **Change Detection (b4t1):** Pure pipe memoization залежить від CD strategy. OnPush + signals = мінімальні CD cycles → pure pipes рідко re-evaluate.
- **i18n (b13):** DatePipe, CurrencyPipe, DecimalPipe — i18n infrastructure pipes.

---

## Examples

### Basic Usage

```typescript
// Standalone component з різними built-in pipes
import { Component, signal } from '@angular/core';
import {
  DatePipe, CurrencyPipe, DecimalPipe,
  UpperCasePipe, LowerCasePipe, TitleCasePipe,
  AsyncPipe, JsonPipe, SlicePipe, KeyValuePipe
} from '@angular/common';

@Component({
  selector: 'app-pipes-demo',
  standalone: true,
  imports: [
    DatePipe, CurrencyPipe, DecimalPipe,
    UpperCasePipe, LowerCasePipe, TitleCasePipe,
    AsyncPipe, SlicePipe, KeyValuePipe
  ],
  template: `
    <!-- Date formatting -->
    {{ today | date:'dd.MM.yyyy' }}          <!-- 28.02.2026 -->
    {{ today | date:'mediumDate':'UTC' }}     <!-- Feb 28, 2026 (UTC timezone) -->
    {{ today | date:'shortTime' }}           <!-- 10:30 AM -->

    <!-- Number/Currency -->
    {{ price | currency:'UAH':'symbol':'1.2-2':'uk' }}   <!-- 1 234,50 ₴ -->
    {{ ratio | percent:'1.1-2' }}                         <!-- 75.5% -->
    {{ bigNumber | number:'1.0-0':'uk' }}                 <!-- 1 234 567 -->

    <!-- String -->
    {{ 'hello world' | titlecase }}    <!-- Hello World -->
    {{ name | uppercase }}             <!-- JOHN DOE -->

    <!-- Async з as binding — один subscription -->
    @if (user$ | async; as user) {
      <div>{{ user.name | titlecase }}</div>
    }

    <!-- Pipe chaining — зліва направо -->
    {{ today | date:'fullDate' | uppercase }}

    <!-- Slice для arrays -->
    @for (item of items() | slice:0:5; track item.id) {
      <li>{{ item.name }}</li>
    }

    <!-- KeyValue для objects -->
    @for (entry of config | keyvalue; track entry.key) {
      <div>{{ entry.key }}: {{ entry.value }}</div>
    }
  `
})
export class PipesDemoComponent {
  today = new Date();
  price = 1234.5;
  ratio = 0.755;
  bigNumber = 1234567;
  name = 'john doe';
  items = signal<{ id: number; name: string }[]>([]);
  config = { theme: 'dark', lang: 'uk', version: '2.0' };
  user$ = /* Observable<User> */ null as any;
}
```

### Production Scenario

```typescript
// order-card.component.ts — production use of multiple pipes
import { Component, input } from '@angular/core';
import { DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  createdAt: Date;
  total: number;
  currency: string;
  status: OrderStatus;
  items: { name: string; qty: number; price: number }[];
}

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, TitleCasePipe],
  template: `
    <article class="order-card">
      <header>
        <span class="order-id">#{{ order().id }}</span>
        <!-- DatePipe з locale і timezone -->
        <time>{{ order().createdAt | date:'dd MMM yyyy, HH:mm':'UTC+2':'uk' }}</time>
      </header>

      <ul class="items">
        @for (item of order().items; track item.name) {
          <li>
            {{ item.name | titlecase }} × {{ item.qty }}
            <!-- CurrencyPipe з dynamic currency code -->
            <span>{{ item.price | currency:order().currency:'symbol':'1.2-2' }}</span>
          </li>
        }
      </ul>

      <footer>
        <strong>Разом: {{ order().total | currency:order().currency:'symbol':'1.2-2' }}</strong>
        <span class="status status--{{ order().status }}">
          {{ statusLabel() }}
        </span>
      </footer>
    </article>
  `
})
export class OrderCardComponent {
  order = input.required<Order>();

  // Трансформація в компоненті, не pipe — бо це бізнес-логіка
  protected statusLabel = () => {
    const map: Record<OrderStatus, string> = {
      pending: 'Очікує',
      confirmed: 'Підтверджено',
      shipped: 'Відправлено',
      delivered: 'Доставлено',
      cancelled: 'Скасовано'
    };
    return map[this.order().status];
  };
}
```

### Anti-Example

```typescript
// ❌ ПОГАНІ ПРАКТИКИ з pipes

@Component({
  template: `
    <!-- ❌ Кілька AsyncPipe на одному Observable — 3 subscriptions! -->
    <h1>{{ user$ | async }}</h1>
    <p>{{ (user$ | async)?.email }}</p>
    <p>{{ (user$ | async)?.role }}</p>

    <!-- ❌ JsonPipe в production — impure, performance waste -->
    <pre>{{ bigObject | json }}</pre>

    <!-- ❌ SlicePipe (impure!) в @for великого списку -->
    @for (item of largeList | slice:0:10; track item.id) { ... }

    <!-- ❌ Getter що повертає new Observable кожен CD cycle -->
    {{ getData() | async }}
  `
})
export class BadPipesComponent {
  // ❌ Getter повертає new Observable = new subscription кожен CD
  get getData() { return this.http.get('/api/data'); }
}

// ✅ ПРАВИЛЬНО
@Component({
  template: `
    <!-- ✅ Один AsyncPipe з as — один subscription -->
    @if (user$ | async; as user) {
      <h1>{{ user.name }}</h1>
      <p>{{ user.email }}</p>
    }

    <!-- ✅ Або toSignal для signal-based підходу -->
    @if (user()) {
      <h1>{{ user()!.name }}</h1>
    }

    <!-- ✅ slice в @for — використовуємо computed для pre-slicing -->
    @for (item of visibleItems(); track item.id) { ... }
  `
})
export class GoodPipesComponent {
  user$ = this.userService.user$;
  user = toSignal(this.userService.user$);

  // ✅ computed мемоізує — не перераховується без потреби
  visibleItems = computed(() => this.largeList().slice(0, 10));
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Кілька `AsyncPipe` на одному Observable | Кожна AsyncPipe — окрема підписка на той самий Observable | `@if (data$ \| async; as data)` — один subscription |
| `JsonPipe` в production template | Impure pipe — transform() кожен CD cycle, debug-only | Видалити або замінити на typed display |
| `SlicePipe` в @for великого списку | SlicePipe impure — O(n) на кожен CD cycle для всіх елементів | `computed(() => list().slice(0, n))` — мемоізований |
| Getter що повертає `new Observable()` для AsyncPipe | New reference кожен CD = unsubscribe/resubscribe на кожен cycle | Зберігати Observable в полі класу |
| Бізнес-логіка в pipe transform() | Pipes — display concern, не business logic | Service або ViewModel method для логіки |

---

## Interview Block

### [L1 — Warm-up] Чому AsyncPipe є impure, хоча більшість pipes повинні бути pure?

**Signal being tested:** Чи розуміє кандидат зв'язок між pure/impure distinction і Observable subscription model.

**What the interviewer expects:** Пояснення що Observable emission не змінює reference — тому pure pipe не може detect зміни. Impure дозволяє AsyncPipe перевіряти internal subscription state.

**How to probe deeper:** "Якщо AsyncPipe impure, то скільки разів викликається transform() за секунду якщо у нас 60fps rendering?"

**Reference answer:** AsyncPipe impure бо Observable emission не змінює reference на сам Observable об'єкт — pure pipe з `===` comparison не бачить нових значень. Impure AsyncPipe: зберігає internal subscription і last emitted value, повертає last value при кожному transform() виклику, і при новій emission — markForCheck() для OnPush.

**Common mistakes:** "AsyncPipe impure бо Observable асинхронний" — неправильне пояснення механізму.

---

### [L2 — Mid] Чому кілька `| async` на одному Observable — anti-pattern і як це виправити?

**Signal being tested:** Розуміння AsyncPipe subscription model і вміння правильно структурувати template.

**What the interviewer expects:** Конкретне пояснення multiple subscriptions, як `as` binding вирішує проблему, альтернатива через toSignal().

**How to probe deeper:** "Якщо Observable emit HTTP request — скільки запитів буде зроблено при трьох AsyncPipe?"

**Reference answer:** Кожна AsyncPipe instance підписується незалежно — `{{ user$ | async }}, {{ (user$ | async)?.email }}` = два subscriptions. Для HTTP Observable — два HTTP запити. Fix: `@if (user$ | async; as user) { ... user.name ... user.email }` — один async, одна підписка, data доступна через as. Або toSignal(): `user = toSignal(user$)` — один subscription в injection context.

**Common mistakes:** Думають що Angular оптимізує multiple AsyncPipe на одному Observable автоматично.

---

### [L3 — Senior] Як pure pipe memoization працює під капотом? Коли вона ламається?

**Signal being tested:** Розуміння Angular's pipe caching mechanism і strict equality semantics.

**What the interviewer expects:** Пояснення [lastInput, lastOutput] cache з === comparison, коли memoization fails (mutations, new references).

**How to probe deeper:** "Якщо передати `new Date()` до DatePipe при кожному CD — чи буде memoization ефективною?"

**Reference answer:** Pure pipe: Angular зберігає `[lastInput, lastOutput]`. При CD: якщо `newInput === lastInput` → return lastOutput. `new Date()` кожен CD — завжди new reference → cache miss кожен раз. Mutation: `arr.push(item)` → reference та сама → cache hit → pipe не бачить зміни. Правило: pure pipe + immutable data = efficient. Для Date: зберігати Date reference в полі, не `new Date()` в template expression.

**Common mistakes:** Думають що Angular порівнює deep equality для objects. Не розуміють чому array mutation не оновлює pure pipe output.

---

### [L4 — Staff/Principal] Як оптимізувати performance для компонента що рендерить 1000+ рядків з DatePipe і CurrencyPipe?

**Signal being tested:** Системне мислення про rendering performance, CD optimization і ViewModel pattern.

**What the interviewer expects:** Multi-layer аналіз: reduce CD cycles (OnPush+Signals), pre-compute in ViewModel, virtual scrolling, profiling strategy.

**How to probe deeper:** "Якщо профілювання показує що bottleneck — DatePipe transform(), як ти вирішиш без видалення DatePipe?"

**Reference answer:** Layer 1: OnPush + Signals — зменшити CD cycles → pure pipes рідко re-evaluate. Layer 2: Virtual scrolling (CDK VirtualScrollViewport) — render тільки visible rows, pipe виконується лише для видимих. Layer 3: ViewModel pre-computation — `rows.map(r => ({ ...r, formattedDate: this.datePipe.transform(r.date, 'dd.MM.yyyy'), formattedAmount: this.currencyPipe.transform(r.amount, 'UAH') }))` — computed() мемоізує. Layer 4: Profiling першочергово — Angular DevTools Profiler, Chrome Performance tab. Layer 5: Web Workers для bulk formatting якщо CPU bottleneck.

**Common mistakes:** Оптимізують pipe першочергово не вимірявши — зазвичай bottleneck в кількості CD cycles, не pipe computation.

---

## Summary

### Key Points

- Pure pipe: memoized (=== comparison), called only on reference change — default, рекомендований підхід
- Impure pipe: called every CD cycle — тільки коли необхідно відстежувати mutations (AsyncPipe, SlicePipe)
- AsyncPipe: impure, subscribe/unsubscribe lifecycle, markForCheck() для OnPush — але кілька AsyncPipe на одному Observable = кілька subscriptions
- `@if (data$ | async; as data)` — canonical pattern для один subscription + type-safe access
- DatePipe, CurrencyPipe, DecimalPipe — locale-aware через LOCALE_ID injection token
- Pipe chaining: виконуються зліва направо, types перевіряються compiler, impure pipe в chain = весь chain expensive
- Для 2026: toSignal() + signal reads в template замінює AsyncPipe в signal-based architecture

### Elevator Pitch (2 minutes)

Angular pipes — це display transformers: беруть значення, повертають відформатоване. Pure pipes мемоізовані через strict equality check — не перераховуються якщо input reference не змінилась. Impure pipes (AsyncPipe, SlicePipe) викликаються кожен CD cycle — бо мусять відслідковувати internal state. AsyncPipe — найважливіша impure: підписується на Observable, повертає останнє значення, cleanup при destroy. Ключовий anti-pattern: кілька AsyncPipe на одному Observable = кілька підписок. Fix: `@if (data$ | async; as d)`. Для i18n: DatePipe/CurrencyPipe через LOCALE_ID + registerLocaleData(). Performance: pure pipes + OnPush + Signals = мінімальні обчислення. Сигнал для рефакторингу: impure pipe в @for великого списку.
