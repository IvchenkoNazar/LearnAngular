---
title: "Custom Pipes"
block: 3
topic: 5
slug: "custom-pipes"
difficulty: 3
sinceVersion: "2"
tags: ["custom-pipe", "PipeTransform", "pure", "impure", "memoization"]
relatedTopics: ["built-in-pipes", "dependency-injection", "signal-and-async-patterns", "testing"]
interviewQuestions:
  - id: "b3t5q1"
    level: "junior"
    question: "Як реалізувати PipeTransform інтерфейс? Покажи мінімальний приклад."
    referenceAnswers:
      junior: "Клас реалізує PipeTransform з методом transform(). Decorator @Pipe з name property. transform() приймає value і optional аргументи, повертає перетворене значення."
      mid: "@Pipe({ name: 'myPipe', pure: true, standalone: true }) + implements PipeTransform. transform(value: T, ...args: any[]): U — signature. Angular інстанціює pipe і викликає transform() при рендерингу. Standalone pipe не потребує NgModule — direct import в component imports array. Для pipes що потребують services — inject() в constructor."
      senior: "PipeTransform — це мінімальний interface з одним методом: `transform(value: unknown, ...args: unknown[]): unknown`. Angular не вимагає implements PipeTransform — достатньо декоратора і методу, але interface дає type safety. Під капотом: Angular compiler генерує pipe factory function, кожен pipe instance — JavaScript об'єкт. Pure pipe: Angular зберігає [lastInputs, lastOutput] — shallow comparison всіх аргументів (value + всі args). Якщо всі аргументи === попереднім — повертає cached output. Важливо: args теж перевіряються — `{{ value | myPipe:arg1:arg2 }}` — зміна arg1 або arg2 також тригерить re-evaluation. Pipe injection: inject(MyService) в constructor — pipe отримує services через DI."
      staff: "PipeTransform — це архітектурний pattern для display transformation. Pipe в Angular — це stateless pure function (в ideal case), що робить їх testable і composable. DI в pipes: pipe може inject будь-які tokens — це дозволяє locale-aware pipes (inject LOCALE_ID), permission-aware pipes (inject PermissionService), але ускладнює тестування. Architectural rule: pipe повинна мати ОДНУ відповідальність — форматування числа, translation, truncation. Якщо pipe inject кілька services і має складну логіку — signal щоб виынести логіку до service, pipe — тонкий wrapper. Performance consideration: pipe instance — persistent об'єкт поки host view alive, на відміну від method виклику — але re-evaluation тільки при input change (pure). Для heavy computation в transform() — кешування через Map або WeakMap всередині pipe instance."
    commonMistakes:
      - "Роблять transform() async — вона синхронна, для async — async pipe або observable"
      - "Не вказують return type — TypeScript не може перевірити pipe chain types"
    relatedQuestions: ["b3t5q2", "b3t5q3"]
  - id: "b3t5q2"
    level: "mid"
    question: "Коли використовувати pipe, а коли метод компонента або computed property?"
    referenceAnswers:
      junior: "Pipe — для форматування даних в template. Метод компонента — якщо потрібна складна логіка. Computed property — якщо використовується кілька разів."
      mid: "Pipe: reusable formatting/transformation що потрібна в кількох компонентах. Method компонента: одноразова трансформація специфічна для компонента, або коли transformation залежить від component state. Computed property (Angular Signals): коли трансформація потрібна кілька разів в template або залежить від signals — computed мемоізується. Gotcha: method в template (`{{ getFormatted(value) }}`) — викликається кожен CD cycle, не мемоізується — performance issue."
      senior: "Вибір між pipe, method і computed — це вибір execution і caching semantics. Method в template: не мемоізується, викликається кожен CD — anti-pattern для expensive operations. Pure pipe: мемоізується за input reference — один instance на template binding. Computed(): мемоізується за signal dependencies — одне значення для всього компонента. Правило вибору: 1) Потрібно reuse в кількох компонентах → pipe. 2) Трансформація залежить від кількох component signals → computed(). 3) Transformation тільки для одного binding і не expensive → inline або method. 4) Expensive computation → computed() або pipe з власним кешем. Pipe vs computed: pipe застосовується per-binding, computed — один раз для компонента. Для списку: pipe в @for — окремий instance per item, computed() — одне значення для всього компонента."
      staff: "Вибір між pipe/method/computed має архітектурні наслідки для maintainability і performance. Pipe — це reusable, independently testable unit з чіткою single responsibility. Method в template — quick and dirty, погано тестується, не reusable. Computed() — оптимальний для derived state що залежить від component-local signals. Системне мислення: якщо трансформація з'являється в 2+ компонентах — автоматично виноситись у pipe. Якщо transformation логіка складна — тест покриття important, pipe тестується легше ніж inline template logic. Важлива грань: pipe що inject services — тестується з TestBed, pipe без залежностей — pure unit test. Architectural smell: компонент з 10+ pipes imports — можливо занадто багато transformation logic в template, потрібен ViewModel pattern з pre-computed properties."
    commonMistakes:
      - "Використовують method в template для expensive operation — відбувається на кожен CD"
      - "Пишуть pipe для одноразової трансформації — overkill для simple cases"
    relatedQuestions: ["b3t5q1", "b3t5q4"]
  - id: "b3t5q3"
    level: "mid"
    question: "Як кешування в pure pipe допомагає з performance? Як реалізувати власний кеш?"
    referenceAnswers:
      junior: "Pure pipe не перераховується якщо input не змінився — це само по собі кеш. Angular зберігає результат."
      mid: "Angular зберігає останній [input, output] для pure pipe — якщо input той самий (===), повертає cached output. Але це кеш тільки для одного значення. Якщо pipe отримує різні значення — кожен раз обчислюється. Для power users: можна додати власний Map<input, output> кеш всередині pipe щоб зберігати результати для кількох різних inputs."
      senior: "Angular's built-in pure pipe cache: single-entry cache — [lastInput, lastOutput]. Ефективний якщо одне binding на pipe. Але в @for з 1000 items: 1000 різних inputs, кожен обчислюється окремо — Angular cache не допомагає (кожен новий input). Власний кеш: Map<string, T> або WeakMap<object, T> всередині pipe instance. WeakMap — для object keys: автоматичний GC коли object більше недосяжний. String-based Map: потрібен stable key (item.id, item.uuid). Приклад: formatCurrency pipe з Map<string, string> — якщо та сама валюта/locale вже форматувалась — return cached. Обережно: Map росте безмежно якщо inputs різноманітні — потрібен LRU cache або clear strategy."
      staff: "Caching в pipes — це балансування між memory і computation. Angular's single-entry cache — достатній для більшості cases: один binding, одне значення. Для pipes що обробляють великі набори різних значень (formatPrice для price list) — custom Map cache дозволяє amortize expensive computation. Але: pipe instance — один per template binding, не per pipe type. Тобто кеш в pipe instance shared тільки для того ж binding, не між різними елементами @for. Якщо потрібен shared cache — inject singleton CacheService. Performance profile: для @for з 1000+ items — pre-compute в ViewModel через computed() map operation, не pipe per item. Pipe caching architecture: 1) Angular built-in — sufficient for 90% cases. 2) Map/WeakMap in instance — для repeated same values. 3) Inject shared cache service — для cross-component sharing. 4) Computed() — для bulk transformation. Вибір залежить від profiling, не від assumption."
    commonMistakes:
      - "Думають що pipe має shared cache між всіма bindings — кожне binding — окремий instance"
      - "Використовують Map без обмеження розміру — memory leak для великих inputs"
    relatedQuestions: ["b3t5q2", "b3t5q4"]
  - id: "b3t5q4"
    level: "senior"
    question: "Коли impure custom pipe виправданий? Назви конкретні use cases і підводні камені."
    referenceAnswers:
      junior: "Impure pipe потрібна коли дані змінюються без зміни reference — наприклад мутований масив."
      mid: "Impure pipe виправдана: 1) Отримує масив що мутується і потрібно відображати актуальний стан. 2) Pipe залежить від зовнішнього стану (наприклад, locale що змінюється). 3) Pipe відстежує Observable або Promise стан. Підводний камінь: impure pipe в @for — transform() викликається N*cycles разів."
      senior: "Impure custom pipe виправдана в обмежених scenarios: 1) FilterPipe для масиву що мутується — але краще використовувати immutable patterns. 2) TranslatePipe (ngx-translate) — translate key до string, залежить від активного locale що може змінитись runtime. 3) Pipe що inject Observable state service і повертає current value — але краще toSignal(). Performance cost: impure pipe в @for з N items — N transform() викликів за КОЖЕН CD cycle. З Default CD strategy і активним routing/events — це може бути hundreds of calls per second. Concrete analysis: app з 100 items в @for, 60fps animation running — 6000 impure pipe calls/second. Fix для FilterPipe: замінити на computed(() => array().filter(pred)). Fix для TranslatePipe: якщо не потрібен runtime locale switch — pure pipe + locale signal."
      staff: "Impure pipe — це архітектурна рішення що потребує explicit justification. В 2024-2025: більшість impure pipe use cases замінені кращими patterns: AsyncPipe → toSignal(), FilterPipe → computed(), TranslatePipe → signal-based i18n. Але є legitimate cases: 1) Legacy API інтеграція де Observable-to-signal migration занадто expensive. 2) Third-party library pipe що impure by design (ngx-translate TranslatePipe). 3) Rapid prototyping де performance не критична. Production checklist для impure pipe: a) Чи є альтернатива без impure? b) В яких template contexts використовується (особливо @for)? c) Чи є OnPush на host компоненті? d) Профільована performance? Архітектурна рекомендація: заборонити custom impure pipes в code review, допускати тільки з explicit justification і performance measurement."
    commonMistakes:
      - "Пишуть FilterPipe як impure бо 'array може змінитись' — краще computed() або immutable array"
      - "Не профілюють impure pipe в @for і дивуються чому app сповільнився"
    relatedQuestions: ["b3t5q3", "b3t5q5"]
  - id: "b3t5q5"
    level: "staff"
    question: "Як тестувати custom pipe ізольовано і в контексті компонента? Які тестові стратегії?"
    referenceAnswers:
      junior: "Pipe можна тестувати як звичайний JavaScript клас — new MyPipe().transform(input, ...args)."
      mid: "Pipe без залежностей — unit test: `const pipe = new MyPipe(); expect(pipe.transform('hello')).toBe('HELLO')`. Pipe з залежностями — TestBed або mock dependencies. В component integration test — TestBed з imports: [MyPipe]."
      senior: "Three testing strategies: 1) Pure unit test (без Angular): `new MyPipe(mockService).transform(value)` — fastest, no TestBed overhead. Підходить для pipes без Angular DI. 2) Isolated TestBed: `TestBed.configureTestingModule({ providers: [MyPipe, { provide: SomeService, useValue: mockService }] })` — pipe з DI, але без component. 3) Integration test з host component: pipe в template context, перевірка rendered output. Що тестувати: boundary cases (null/undefined/empty), type coercion, locale-dependent output (з mock LOCALE_ID), caching behavior (same input → same output reference для pure), multiple arguments. Gotcha: якщо pipe inject DatePipe або CurrencyPipe — потрібно provide або mock їх теж."
      staff: "Testing strategy для pipes визначається їх complexity і dependencies. Pyramid: 1) Unit tests (без TestBed) — для всіх pure utility pipes, fast feedback. 2) TestBed isolated — для pipes з Angular services. 3) Integration — тільки якщо pipe behavior залежить від component context. Для locale-dependent pipes: параметризовані тести для різних locale variants — гарантують i18n correctness. Для pipes з caching: тест що перевіряє cache hit (same input → transform не викликався вдруге — spy on transform). Для impure pipes: тест що перевіряє що transform() викликається при мутації. Coverage strategy: 100% для custom pipes — вони мають чітку, testable interface. Performance тест (рідко але для критичних pipes): benchmark з великим input set — criterion-based або jest performance tests. Documentation через тести: test names мають документувати pipe behavior краще ніж JSDoc."
    commonMistakes:
      - "Не тестують null/undefined inputs — найчастіший source of runtime errors"
      - "Тестують через TestBed коли достатньо `new MyPipe().transform()` — зайвий overhead"
    relatedQuestions: ["b3t5q1", "b3t5q4"]
---

## Core Concept

**English definition:** A custom pipe is a class decorated with @Pipe that implements the PipeTransform interface, providing a `transform()` method for template-based value transformation. Pure pipes are memoized single-entry functions; impure pipes run on every change detection cycle.

**Пояснення:** Custom pipe — це reusable трансформатор для template. Якщо потрібно форматувати строки особливим чином, фільтрувати дані, або перекладати ключі — pipe дозволяє encapsulate цю логіку, reuse в кількох компонентах і тестувати ізольовано.

**Яку проблему вирішує:** Дублювання display transformation логіки в component methods: `{{ formatOrderId(order.id) }}` в кожному компоненті → `{{ order.id | orderId }}` — один раз в pipe. Template readability і single responsibility.

**Як працює під капотом:** Angular compiler знаходить `| pipeName` в template expression і генерує pipe factory call. При first render: Angular instantiates pipe через DI (з dependencies). При кожному CD: для pure pipe — порівнює current args з [lastArgs] cache (shallow ===), якщо match → return lastResult. Якщо miss → викликає transform() і оновлює cache. Impure pipe: завжди викликає transform(). Pipe instance persistent поки host view alive — на відміну від component method call, pipe є stateful object (може мати cache).

**Trade-offs та обмеження:** Pipe — синхронна функція, не async. Складна логіка в pipe ускладнює тестування. Pipe inject через DI — coupling до Angular DI. Impure pipe + @for = performance bottleneck.

**Версійність:** Custom pipes — з Angular 2. Standalone pipes (standalone: true) — Angular 14+. inject() в pipe constructor — Angular 14+. Signal-based inputs для pipes — не підтримуються (pipe transform() не signal-based). Pipe з inject(DestroyRef) для cleanup — Angular 16+.

---

## Deep Details

### Edge Cases

**Pipe args і pure cache:** `{{ value | myPipe:arg }}` — зміна arg тригерить re-evaluation навіть якщо value не змінилось. Кешуються всі аргументи разом.

**Null safety в transform():** Pipe не отримує null check автоматично — `{{ null | myPipe }}` викличе `transform(null)`. Завжди обробляй null/undefined.

**Pipe в component DI:** Pipe можна inject напряму: `inject(DatePipe)` в компоненті. Але потрібно або provide через providers[], або standalone import.

**Pipe і generics:** `transform<T>(value: T[], ...): T[]` — generics дозволяє type-safe pipes для collections.

**Pipe і inject():** `const svc = inject(MyService)` — inject тільки в constructor context або field initializer, не в transform().

### Junior vs Senior Understanding

**Junior** знає: @Pipe decorator, implements PipeTransform, transform() signature, pure: false для impure.

**Senior** розуміє:

1. **Pure cache механізм:** Single-entry cache з shallow comparison всіх args. Pipe в @for — кожен row має окрему pipe instance — Angular не sharing cache між instances.

2. **DI в pipes:** inject() в constructor. Але: inject(HttpClient) в pipe — anti-pattern (pipe не повинна робити HTTP calls — це service responsibility).

3. **Pipe vs method vs computed():** Method — викликається кожен CD, pipe — memoized, computed — signal-based. Вибір залежить від reusability і caching needs.

4. **Pipe в standalone:** `imports: [MyPipe]` — tree-shakeable. Pipe без standalone — потребує NgModule declaration.

### Deprecation & Migration Path

**NgModule-based pipes:** Оголошення в `declarations:[]` NgModule — legacy. Migrate: додати `standalone: true` до pipe, видалити з NgModule declarations, додати до component imports.

**FilterPipe і OrderByPipe:** Офіційно НЕ надаються Angular (performance concerns). Альтернативи: computed() у компоненті або заміна на explicit filtering logic.

### Connections to Other Concepts

- **DI (b5):** Pipe inject services через constructor/inject() — той самий injector що і host component.
- **Testing (b15):** Pure pipe — найлегше тестувати (pure function), impure — потребує CD triggering.
- **Signals (b3t6):** computed() може замінити деякі pipes для component-local transformations.
- **Built-in pipes (b3t4):** Той самий pure/impure механізм що і вбудовані pipes.

---

## Examples

### Basic Usage

```typescript
// truncate.pipe.ts — simple pure pipe
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true,
  pure: true // default, явно для clarity
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, maxLength = 100, ellipsis = '...'): string {
    if (!value) return '';
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength - ellipsis.length) + ellipsis;
  }
}

// order-id.pipe.ts — pipe з форматуванням
@Pipe({ name: 'orderId', standalone: true })
export class OrderIdPipe implements PipeTransform {
  transform(id: string | number): string {
    const padded = String(id).padStart(6, '0');
    return `ORD-${padded}`;
  }
}

// Використання
// {{ description | truncate:150:'…' }}
// {{ order.id | orderId }}  → ORD-000042
```

### Production Scenario

```typescript
// highlight-search.pipe.ts — pipe що inject service, з власним cache
import { Pipe, PipeTransform, inject, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlightSearch',
  standalone: true,
  pure: true
})
export class HighlightSearchPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  // Власний LRU-подібний кеш для різних query/text комбінацій
  private cache = new Map<string, SafeHtml>();
  private readonly MAX_CACHE_SIZE = 100;

  transform(text: string | null, query: string | null): SafeHtml {
    if (!text) return '';
    if (!query?.trim()) return text;

    const cacheKey = `${text}__${query}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Sanitize query перед використанням в regex
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${sanitizedQuery})`, 'gi');

    // XSS safe: не використовуємо innerHTML напряму
    const highlighted = text.replace(regex, '<mark>$1</mark>');
    const safeHtml = this.sanitizer.bypassSecurityTrustHtml(highlighted);

    // LRU eviction — видаляємо найстаріший якщо кеш повний
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, safeHtml);

    return safeHtml;
  }
}

// file-size.pipe.ts — locale-aware pipe
import { Pipe, PipeTransform, inject, LOCALE_ID } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({ name: 'fileSize', standalone: true })
export class FileSizePipe implements PipeTransform {
  private decimalPipe = inject(DecimalPipe);
  private locale = inject(LOCALE_ID);

  transform(bytes: number, precision = 1): string {
    if (bytes === 0) return '0 Bytes';

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);

    const formatted = this.decimalPipe.transform(
      value,
      `1.0-${precision}`,
      this.locale
    ) ?? '0';

    return `${formatted} ${units[i]}`;
  }
}

// Використання
// <span [innerHTML]="product.description | highlightSearch:searchQuery"></span>
// {{ attachment.size | fileSize:2 }}  → 1.23 MB (locale-formatted)
```

### Anti-Example

```typescript
// ❌ ПОГАНІ патерни в custom pipes

@Pipe({ name: 'filterBad', pure: false }) // ❌ impure для filtering
export class BadFilterPipe implements PipeTransform {
  transform(items: any[], query: string): any[] {
    // ❌ Called every CD cycle, O(n) кожен раз
    return items.filter(i => i.name.includes(query));
  }
}

@Pipe({ name: 'asyncBad' })
export class BadAsyncPipe implements PipeTransform {
  transform(id: number): Observable<User> {
    // ❌ HTTP call в pipe! Новий Observable на кожен виклик
    return this.http.get<User>(`/api/users/${id}`);
  }
}

@Pipe({ name: 'sideEffectBad' })
export class BadSideEffectPipe implements PipeTransform {
  transform(value: string): string {
    // ❌ Side effect в pure function — порушує pure pipe contract
    console.log('transforming:', value);
    localStorage.setItem('lastTransformed', value);
    return value.toUpperCase();
  }
}

// ✅ ПРАВИЛЬНО — filter через computed()
@Component({
  template: `
    @for (item of filteredItems(); track item.id) { ... }
  `
})
export class GoodComponent {
  items = signal<Item[]>([]);
  query = signal('');

  // ✅ computed мемоізований, не викликається без потреби
  filteredItems = computed(() =>
    this.items().filter(i => i.name.includes(this.query()))
  );
}

// ✅ ПРАВИЛЬНО — HTTP в service, не pipe
@Component({
  template: `
    @if (user()) { {{ user()!.name }} }
  `
})
export class GoodUserComponent {
  private userService = inject(UserService);
  user = toSignal(this.userService.getUser(this.userId));
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| FilterPipe як `pure: false` | O(n) виконання на кожен CD cycle × кількість елементів в списку | `computed(() => list().filter(pred))` — мемоізований |
| HTTP call або side effect в `transform()` | Pipe викликається при CD — непередбачувана кількість запитів | HTTP в service, inject результат через signal або Observable |
| `transform()` без null/undefined guard | `null | myPipe` кине помилку — template рендеринг fails | `if (!value) return ''` на початку transform() |
| Pipe без `standalone: true` в новому проєкті | Потребує NgModule declaration — не tree-shakeable | `@Pipe({ standalone: true })` + imports в component |
| Map кеш без розміру обмеження | Memory leak — кеш росте безмежно при унікальних inputs | LRU cache або `WeakMap` для object keys з auto-GC |

---

## Interview Block

### [L1 — Warm-up] Покажи мінімальну реалізацію custom pipe.

**Signal being tested:** Базові знання PipeTransform interface і @Pipe decorator.

**What the interviewer expects:** Правильний decorator, implements PipeTransform, transform() signature з typings, standalone: true.

**How to probe deeper:** "Як передати аргументи до pipe? Як це виглядає в template і в transform() signature?"

**Reference answer:**
```typescript
@Pipe({ name: 'myPipe', standalone: true })
export class MyPipe implements PipeTransform {
  transform(value: string, prefix = ''): string {
    return `${prefix}${value.toUpperCase()}`;
  }
}
// template: {{ 'hello' | myPipe:'→' }}  →  →HELLO
```
Args через двокрапку: `| myPipe:arg1:arg2` → transform(value, arg1, arg2).

**Common mistakes:** Не вказують return type. Забувають standalone: true.

---

### [L2 — Mid] Коли краще метод компонента, а коли custom pipe?

**Signal being tested:** Розуміння execution semantics і performance implications різних підходів.

**What the interviewer expects:** Method = викликається кожен CD (не мемоізований), pipe = memoized per input change, computed = memoized per signal change.

**How to probe deeper:** "Якщо трансформація потрібна і в template і в логіці компонента — як уникнути дублювання?"

**Reference answer:** Method в template викликається кожен CD cycle — не мемоізований. Pipe: memoized, але per-binding instance. computed(): одне значення для всього компонента, signal-based. Вибір: reuse в кількох компонентах → pipe. Component-local з signals → computed(). One-off simple → метод (якщо не expensive). Trick: inject(MyPipe) в компоненті — використати ту ж pipe logic в class code.

**Common mistakes:** Вважають що Angular мемоізує method calls автоматично.

---

### [L3 — Senior] Як реалізувати ефективний кеш в pure pipe для великого списку різних значень?

**Signal being tested:** Розуміння difference між Angular built-in single-entry cache і custom caching для diverse inputs.

**What the interviewer expects:** Angular cache = single-entry, custom Map/WeakMap для diverse inputs, LRU eviction для memory safety, WeakMap для object keys.

**How to probe deeper:** "Якщо кеш в pipe instance — чи ділиться він між різними pipe instances в @for списку?"

**Reference answer:** Angular pure pipe cache: один [lastInput, lastOutput] per instance — при @for з 1000 items і 1000 різних values — cache miss кожен раз. Custom кеш: `private cache = new Map<K, V>()` в pipe — накопичує results для різних inputs. Але: кожна pipe instance (кожен row в @for) має ВЛАСНИЙ кеш — не shared. Для shared cache: inject singleton CacheService. WeakMap для object keys: `private cache = new WeakMap<object, string>()` — auto-GC коли object unreachable. LRU eviction для Map: видалити `cache.keys().next().value` при перевищенні MAX_SIZE.

**Common mistakes:** Думають що cache ділиться між pipe instances в @for. Не думають про memory eviction.

---

### [L4 — Staff/Principal] Архітектурно обґрунтуй: коли custom pipe, computed(), і ViewModel pattern кожен є правильним вибором? Як це впливає на testability?

**Signal being tested:** Системне мислення про display transformation architecture і trade-offs між підходами.

**What the interviewer expects:** Чіткий decision tree: pipe = reusable+testable, computed = component-local+signals, ViewModel = complex+pre-computed. Implications для testing кожного підходу.

**How to probe deeper:** "Якщо shared utility pipe inject PermissionService — як це впливає на тестування і потенційні coupling проблеми?"

**Reference answer:** Decision matrix: 1) Pipe: reusable в 2+ компонентах, independently testable (`new Pipe().transform()`), chaining composed. Inject services OK але збільшує coupling. 2) computed(): component-local derived state, memoized з signals, trivial for component unit tests. 3) ViewModel/mapped array: pre-compute all display properties в component class (`rows = computed(() => data().map(r => ({ ...r, formattedDate: ... })))`) — template стає dumb display. Тестується як component logic. Architectural rule: pipe для display formatting primitives (truncate, fileSize), computed для business-derived display state, ViewModel для complex multi-field transformations. Testability: pure pipe без DI — best testable. Pipe з services — TestBed needed. computed — перевіряється як component behavior.

**Common mistakes:** Або все в pipes (навіть complex business logic), або все в methods (не reusable, not memoized). Не думають про testability при виборі.

---

## Summary

### Key Points

- PipeTransform interface — один метод transform(value, ...args): результат; @Pipe({ name, standalone, pure })
- Pure pipe (default): Angular single-entry cache — memoized за === comparison всіх аргументів
- Власний Map/WeakMap кеш в pipe для diverse inputs в @for — але кожна pipe instance має окремий кеш
- impure pipe в @for — performance killer: N transform() calls per CD cycle; замінювати на computed()
- Method в template — не мемоізований; computed() — signal-based memoization; pipe — per-binding memoization
- null/undefined guard обов'язковий: `{{ null | myPipe }}` викличе transform(null)
- Pipe inject services через inject() або constructor — тестується з TestBed, без залежностей — `new Pipe().transform()`

### Elevator Pitch (2 minutes)

Custom pipe — це @Pipe клас що implements PipeTransform з синхронним transform(). Pure pipe (default) мемоізується Angular: один [lastInput, lastOutput] cache per binding. Для diverse inputs в списку — custom Map кеш в pipe instance. Вибір між pipe/method/computed: pipe — reusable і мемоізований per binding; computed() — signal-based, один раз для компонента; method — не мемоізований (використовувати тільки якщо cheap). Impure pipe — тільки коли необхідно відстежувати mutations; в @for — завжди anti-pattern, замінювати на computed(). Тестування: pure pipe без DI — `new MyPipe().transform(value)`, з DI — TestBed. Ключові anti-patterns: HTTP в pipe, side effects в transform(), FilterPipe як impure, відсутній null guard.
