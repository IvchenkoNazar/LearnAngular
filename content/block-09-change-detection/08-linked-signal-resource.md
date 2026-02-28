---
title: "linkedSignal() and resource() / httpResource()"
block: 9
topic: 8
slug: "linked-signal-resource"
difficulty: 4
sinceVersion: "19"
tags: ["linkedSignal", "resource", "httpResource", "ResourceRef", "async-state", "loading-state"]
relatedTopics: ["signals-intro", "rxjs-signal-interop", "reactive-patterns"]
interviewQuestions:
  - id: "b11t4q1"
    level: "junior"
    question: "Що таке resource() у Angular 19 і яку проблему вирішує?"
    referenceAnswers:
      junior: "resource() — це новий API у Angular 19 для управління async state. Він автоматично відстежує loading і error стани для async операцій."
      mid: "resource(options) — Signal-based async resource: автоматично manage loading/error/value state. При зміні request signal → перезапускає async loader function. Повертає ResourceRef з signals: value(), status(), error(), isLoading(). Вирішує проблему manual toSignal(http$) + loading state management."
      senior: "resource(options): { request: () => T, loader: (params) => Promise<R> }. request() — Signal expression що визначає 'коли перезавантажувати'. При зміні request → loader() викликається з new request value. Status: Idle, Loading, Refreshing, Resolved, Error, Local. ResourceRef.value() — поточне значення. ResourceRef.reload() — manual refresh. resource() для Promise-based loaders, httpResource() для HttpClient. Reactive: request() читається як Signal — зміна request автоматично trigger reload."
      staff: "resource() architectural implications: 1) SWR (Stale-While-Revalidate) semantics через Refreshing status — показує stale value поки оновлюється. 2) reload() для manual refresh (pull-to-refresh, retry). 3) request signal composition: `resource({ request: () => ({ id: userId(), page: page() }) })` — reload при зміні будь-якого. 4) httpResource() type-safe з HttpClient — error typing, request config (headers, params). 5) Local updates: `resource.value.set(localValue)` — optimistic updates. Status 'Local' = locally overridden. 6) Comparison toSignal(http$): resource — SWR, loading state, reload, optimistic. toSignal — simpler, no built-in loading state. 7) Angular 19 integration: httpResource() рекомендований стандарт для HTTP GET з signal-based state."
    commonMistakes:
      - "resource() для mutations (POST/PUT) — resource для read (GET)"
      - "Не знають про status() Signal і можливі стани"
      - "Плутають resource() і toSignal(http$)"
    relatedQuestions: ["b11t4q2", "b11t4q3"]
  - id: "b11t4q2"
    level: "mid"
    question: "Що таке linkedSignal() і коли його використовувати замість computed()?"
    referenceAnswers:
      junior: "linkedSignal() — це сигнал що автоматично оновлюється коли батьківський сигнал змінюється, але його також можна змінювати вручну."
      mid: "linkedSignal<T>(computation) — WritableSignal що автоматично скидається до computed значення при зміні dependency, але може бути записаний вручну між скиданнями. computed() — read-only, завжди відображає обчислення. linkedSignal — writable: можна set/update, але при зміні source → повертається до computed value. Use case: selected item що повинен скинутись при зміні списку."
      senior: "linkedSignal(options): { source: signal, computation: (source, previous?) => T }. Або shorthand: `linkedSignal(() => items()[0])`. Поведінка: початкове значення = computation(source). При записи (set/update) — записується. При зміні source signal → recalculates через computation і перезаписує. Use cases: 1) Pagination page що скидається при filter change. 2) Selected item що скидається при items reload. 3) Form value що може бути edited але reset до default при parent change. comparison з signal(source()) через effect: linkedSignal атомарний і glitch-free. Effect-based reset — може спрацювати пізніше. linkedSignal — synchronous і correct."
      staff: "linkedSignal() pattern catalog: 1) Pagination: `page = linkedSignal({ source: filters, computation: () => 1 })` — page скидається до 1 при filter change, але user може navigatе до page 2 між changes. 2) Selection: `selectedId = linkedSignal(() => items()[0]?.id)` — скидається до першого item при reload. 3) Default override: `theme = linkedSignal(() => user().preferences.theme)` — default від user prefs, але overrideable. 4) Previous value access: `computation: (source, previous) => previous?.some_condition ? adaptedValue : defaultValue`. 5) Вибір між linkedSignal і computed: computation + writable = linkedSignal. computation + readonly = computed. Simple state = signal. 6) Testing: set explicitly, verify reset on source change."
    commonMistakes:
      - "computed() де потрібен linkedSignal — read-only не дозволяє override"
      - "signal() + effect для reset — не glitch-free, race condition"
      - "Не знають про previous value parameter у computation function"
    relatedQuestions: ["b11t4q1", "b11t4q3"]
  - id: "b11t4q3"
    level: "senior"
    question: "Як httpResource() відрізняється від resource() і toSignal(http.get())?"
    referenceAnswers:
      junior: "httpResource() спеціально для HTTP запитів, має кращу TypeScript типізацію."
      mid: "httpResource<T>(request) — спеціалізований resource для HttpClient. request може бути string URL, HttpRequest object, або function що повертає URL/params. Переваги над resource(): type-safe HttpErrorResponse, integration з HttpClient (interceptors, testing), automatic request cancellation при reload."
      senior: "httpResource vs resource: 1) httpResource — uses HttpClient під капотом: interceptors apply, HttpClientTesting works. resource — uses Fetch API або custom loader. 2) Typing: httpResource<User>('/api/user') → ResourceRef<User>. resource<User>({ loader: () => fetch(url).then(r => r.json()) }) → теж. 3) Request config: httpResource({ url: url, headers, params, method: 'GET' }). 4) Reactive params: httpResource(() => `/api/users/${userId()}`) — перезавантажує при userId() зміні. httpResource vs toSignal(http.get()): httpResource — loading/error state, reload(), SWR, optimistic. toSignal — simpler, no built-in resource lifecycle. Recommendation: httpResource для GET data fetching in signal-first components."
      staff: "httpResource() production patterns: 1) Conditional fetch: httpResource(() => userId() ? `/api/users/${userId()}` : undefined) — undefined request = idle, no fetch. 2) Paginated: httpResource(() => ({ url: '/api/items', params: { page: page(), filter: filter() } })) — reloads on any param change. 3) Optimistic: `resource.value.set(optimisticUpdate)` → shows immediately, then server response replaces. 4) Error display: `resource.error()` typed як HttpErrorResponse — direct access to status code. 5) Refresh: `resource.reload()` для pull-to-refresh або manual retry. 6) Server Components (future): httpResource may work differently in SSR context — always check for SSR compatibility. 7) Cache: httpResource немає built-in cache beyond current request. For caching: external service або ngCache pattern. 8) Testing: provideHttpClientTesting() + HttpTestingController works з httpResource."
    commonMistakes:
      - "httpResource для mutations (POST/PUT) — тільки для GET reads"
      - "Не знають undefined request = idle (not error)"
      - "Думають httpResource кешує між navigations — ні"
    relatedQuestions: ["b11t4q2", "b11t4q4"]
  - id: "b11t4q4"
    level: "mid"
    question: "Як обробити loading, error, success стани з resource()?"
    referenceAnswers:
      junior: "resource.isLoading() для loading стану, resource.error() для помилки, resource.value() для даних."
      mid: "ResourceRef має: value() — поточне значення або undefined. status() — ResourceStatus enum: Idle, Loading, Refreshing, Resolved, Error, Local. error() — помилка або undefined. isLoading() = status() === Loading || status() === Refreshing. Для template: `@if (resource.isLoading()) { <spinner /> } @else if (resource.error()) { <error /> } @else { <data [value]=\"resource.value()\" /> }`."
      senior: "ResourceStatus semantics: Idle — request повертає undefined (не ініціалізований). Loading — перший завантаження. Refreshing — SWR: є stale value, оновлюємось. Resolved — є fresh value. Error — завантаження провалилось. Local — value manually set (optimistic). Для UI: Refreshing + Resolved стани дозволяють показати stale data поки оновлюємось. `@if (resource.status() === 'Refreshing') { <small>Updating...</small> }` + `{{ resource.value() }}` (shows stale). Error recovery: `resource.reload()` button. Type narrowing: коли status === 'Resolved' — value() is non-null."
      staff: "Resource state patterns for enterprise UI: 1) Skeleton loading: show skeleton when status === 'Loading' (first load). Show stale data with subtle indicator when status === 'Refreshing'. 2) Error boundaries: resource.error() зі status === 'Error' → show error component з retry button (resource.reload()). 3) Optimistic update flow: user action → `resource.value.set(optimisticValue)` (Local status) → HTTP POST → on success: nothing (resource.reload() triggers fresh fetch). On failure: `resource.value.set(previousValue)`. 4) Conditional fetch pattern: `httpResource(() => activeTab() === 'users' ? '/api/users' : undefined)` — only fetch when relevant. 5) Dependent resources: `const orders = httpResource(() => user.value()?.id ? `/api/orders/${user.value().id}` : undefined)` — chain resources via request signal."
    commonMistakes:
      - "value() null check — при Loading або Error value() може бути undefined"
      - "Не розрізняють Loading і Refreshing — різна UX"
      - "resource.reload() замість resource.value.set() для optimistic updates"
    relatedQuestions: ["b11t4q3", "b11t4q5"]
  - id: "b11t4q5"
    level: "staff"
    question: "Як спроєктувати data loading architecture в Angular 19+ з resource та signal APIs?"
    referenceAnswers:
      junior: "Використовувати httpResource() для всіх GET запитів і управляти state через signals."
      mid: "Feature pattern: httpResource для GET reads, mutations через methods (HTTP POST/PUT + patchState або reload). linkedSignal для derived writable state (pagination, selection). resource у services для shared data."
      senior: "Architecture: 1) Page components: httpResource для primary data, computed для derived. 2) Selection: linkedSignal для selected item. 3) Pagination: linkedSignal page скидається при filter change. 4) Mutations: inject HttpClient, call .pipe(tap(() => resource.reload())).subscribe() після mutation. 5) Optimistic: resource.value.set() → mutation → .reload(). 6) Form integration: linkedSignal від resource.value() для editable form state. 7) Global data: services з httpResource і { providedIn: 'root' } — single fetch, shared signals."
      staff: "Data loading architecture v2 (Angular 19+): 1) httpResource для GET — primary data source. 2) SignalStore (feature/global) для complex state з mutations. 3) linkedSignal для UI state derived від server data але user-editable. 4) RxJS залишається для WebSocket, complex event streams, mutations pipe. 5) Server components (future Angular) — httpResource ймовірно буде integration point. 6) Cache strategy: для frequently accessed data — service з httpResource providedIn root + reload on relevant mutations. 7) SSR consideration: httpResource TransferState integration — avoid double HTTP on hydration. 8) Testing: HttpTestingController, TestBed.inject(ResourceRef) для unit tests. 9) DevTools: Angular DevTools показує resource state у component tree. 10) Migration path: toSignal(http$) → httpResource поступово."
    commonMistakes:
      - "httpResource для mutations — тільки для reads"
      - "linkedSignal де треба computed (read-only) — зайва complexity"
      - "Не враховують SSR implications httpResource"
    relatedQuestions: ["b11t4q4", "b11t4q2"]
---

## Core Concept

**English definition:** `linkedSignal()` (Angular 19+) is a WritableSignal that automatically resets to a computed value when its source signal changes, but can be manually overridden between resets. `resource()` and `httpResource()` (Angular 19+) provide Signal-based async resource management with built-in loading, error, and success states, plus SWR (Stale-While-Revalidate) semantics.

**Пояснення:** linkedSignal вирішує проблему "derived but overrideable" state — наприклад, selected item що повертається до першого при оновленні списку, але може бути обраний вручну. resource() вирішує проблему "async state management" — замість ручного toSignal(http$) + loading/error signals — єдиний API з усіма станами.

**Яку проблему вирішує:**
- **linkedSignal:** Writable derived state — computed() read-only, signal() не auto-resets. linkedSignal — обидва
- **resource:** loading/error/success state в одному API без boilerplate
- **httpResource:** Типізований HttpClient-based resource з interceptors support
- **SWR:** Показуємо stale data поки оновлюємо (Refreshing status)

**Як працює під капотом:**

```typescript
// linkedSignal() simplified:
function linkedSignal<T>(computation: () => T): WritableSignal<T> {
  const state = signal<T>(computation()); // initial value

  effect(() => {
    computation(); // tracks dependencies
    state.set(computation()); // resets to computed on dependency change
  }, { allowSignalWrites: true });

  return state; // but WritableSignal — can be manually set
}

// resource() simplified:
function resource<T, R>(options: {
  request: () => R,
  loader: (params: { request: R }) => Promise<T>
}): ResourceRef<T> {
  const status = signal<ResourceStatus>('idle');
  const value = signal<T | undefined>(undefined);
  const errorSignal = signal<unknown>(undefined);

  effect(() => {
    const req = options.request(); // tracks request signal
    if (req === undefined) { status.set('idle'); return; }
    status.set(value() ? 'refreshing' : 'loading');
    options.loader({ request: req })
      .then(v => { value.set(v); status.set('resolved'); })
      .catch(e => { errorSignal.set(e); status.set('error'); });
  });

  return { value: value.asReadonly(), status: status.asReadonly(), error: errorSignal.asReadonly(),
    reload: () => { /* re-trigger effect */ },
    value: /* WritableSignal for optimistic */ };
}
```

**Trade-offs та обмеження:**
- resource() — для reads тільки; mutations потребують окремого HTTP call + reload()
- linkedSignal — Angular 19+ (не available в Angular 16-18)
- httpResource — немає вбудованого кешу між navigations
- resource() error не є typed HttpErrorResponse — httpResource вирішує

**Версійність:**
- Angular 19: resource(), httpResource(), linkedSignal() — initial release (experimental/developer preview)
- Angular 19.1+: refinements до API
- Angular 21: статус стабільності потрібно перевіряти

## Deep Details

### Edge Cases

- **linkedSignal і initial value:** Перше значення = computation(). Якщо computation читає signal що ще не має значення (undefined) — може бути undefined початково.
- **resource() і concurrent requests:** При швидкій зміні request signal — попередній loader Promise може resolve після нового. resource() відстежує latest request і ignores stale responses.
- **httpResource undefined request:** `httpResource(() => id() ? url : undefined)` — при id() = null/undefined → status = 'idle', no HTTP call. Корисно для conditional fetch.
- **resource.value.set() і reload():** Після manual set (optimistic, Local status) → reload() перезавантажує і встановлює fresh server value (Resolved/Error).
- **Nested resources:** `const orders = httpResource(() => user.value()?.id ? url : undefined)` — orders залежить від user value. При user reload — orders idle до нового user value.

### Junior vs Senior Understanding

**Junior** знає: "linkedSignal = writable computed. resource = async state management."

**Senior** розуміє глибину:

1. **linkedSignal previous value:** `linkedSignal({ source: sig, computation: (source, previous) => calculateFrom(source, previous) })` — computation отримує попереднє значення. Дозволяє incremental updates або збереження partial state при зміні source.

2. **Resource Refreshing vs Loading:** Loading = перший fetch (немає stale data). Refreshing = є value, оновлюємось. UX різниця: Loading → skeleton. Refreshing → показати stale + "updating..." indicator. SWR — key UX pattern.

3. **httpResource request object:** `httpResource({ url: '/api/users', params: { page: page(), filter: filter() } })` — Angular конвертує params до HttpParams. headers можна передати для custom auth headers (але краще через interceptor).

4. **resource() cancellation:** При зміні request — поточний loader Promise не cancelled (Promises non-cancellable). Але resource() ignores response якщо request вже outdated. Для cancellable — використовувати resource з AbortController у loader.

### Deprecation & Migration Path

- Поки нових APIs немає, resource() і httpResource() і linkedSignal() — нові (Angular 19+).
- Migration шлях: `toSignal(http.get(...))` → `httpResource('/api/...')` для GET з loading state.
- `signal(null) + effect для reset` → `linkedSignal(() => source())`.

### Connections to Other Concepts

- **Signals (b11t1):** resource і linkedSignal побудовані на Signal primitives.
- **RxJS Interop (b10t7):** resource() альтернатива toSignal(http$) для HTTP.
- **HTTP Client (b8t1):** httpResource() використовує HttpClient під капотом.

## Examples

### Basic Usage

```typescript
import { Component, signal, linkedSignal } from '@angular/core';
import { httpResource } from '@angular/core';

// ✅ linkedSignal: page resets to 1 when filter changes
@Component({
  selector: 'app-users-list',
  standalone: true,
  template: `
    <select (change)="onFilterChange($event)">
      @for (f of filters; track f) { <option [value]="f">{{ f }}</option> }
    </select>

    @if (users.isLoading()) { <spinner /> }
    @if (users.error()) { <error-msg [error]="users.error()" /> }

    @for (user of users.value() ?? []; track user.id) {
      <user-card [user]="user" />
    }

    <paginator [page]="page()" (pageChange)="page.set($event)" />
  `,
})
export class UsersListComponent {
  filter = signal<'active' | 'all'>('all');
  filters = ['all', 'active'];

  // ✅ linkedSignal: page resets to 1 when filter changes
  page = linkedSignal(() => { this.filter(); return 1; }); // reset on filter change

  // ✅ httpResource: reactive data fetching
  users = httpResource<User[]>(() => ({
    url: '/api/users',
    params: { filter: this.filter(), page: this.page() },
  }));

  onFilterChange(event: Event): void {
    this.filter.set((event.target as HTMLSelectElement).value as 'active' | 'all');
    // page auto-resets to 1 via linkedSignal!
  }
}
```

### Production Scenario

```typescript
import { Component, signal, computed, linkedSignal, inject } from '@angular/core';
import { httpResource, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-order-management',
  standalone: true,
  template: `
    <!-- Loading states -->
    @if (orders.status() === 'loading') { <skeleton-list /> }
    @if (orders.status() === 'refreshing') {
      <div class="refresh-indicator">Updating...</div>
    }

    <!-- Data (shown even during refresh) -->
    @if (orders.value(); as orderList) {
      @for (order of orderList; track order.id) {
        <order-card
          [order]="order"
          [selected]="selectedOrderId() === order.id"
          (click)="selectedOrderId.set(order.id)"
        />
      }
    }

    <!-- Error -->
    @if (orders.status() === 'error') {
      <error-panel [error]="orders.error()">
        <button (click)="orders.reload()">Retry</button>
      </error-panel>
    }
  `,
})
export class OrderManagementComponent {
  private http = inject(HttpClient);

  // Filters
  statusFilter = signal<'all' | 'pending' | 'shipped'>('all');
  dateRange = signal<DateRange>({ from: null, to: null });

  // ✅ httpResource: auto-reload when filters change
  orders = httpResource<Order[]>(() => ({
    url: '/api/orders',
    params: {
      status: this.statusFilter(),
      from: this.dateRange().from ?? '',
      to: this.dateRange().to ?? '',
    },
  }));

  // ✅ linkedSignal: selectedId resets to null when orders reload
  selectedOrderId = linkedSignal<string | null>(() => {
    this.orders.value(); // track orders dependency
    return null; // reset selection on new data
  });

  // ✅ Derived computed
  selectedOrder = computed(() =>
    this.orders.value()?.find(o => o.id === this.selectedOrderId())
  );

  // ✅ Mutation: HTTP + reload pattern
  async approveOrder(orderId: string): Promise<void> {
    // Optimistic update
    const current = this.orders.value() ?? [];
    this.orders.value.set(
      current.map(o => o.id === orderId ? { ...o, status: 'approved' } : o)
    );

    try {
      await firstValueFrom(this.http.put(`/api/orders/${orderId}/approve`, {}));
      this.orders.reload(); // Sync with server
    } catch (err) {
      this.orders.value.set(current); // Rollback on error
    }
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: resource() for mutations
const createUserResource = resource({
  request: () => userFormData(),
  loader: ({ request }) => fetch('/api/users', { // ❌ POST in resource!
    method: 'POST',
    body: JSON.stringify(request),
  }).then(r => r.json()),
});
// resource() triggers on request signal change — creates user on every form input!

// ❌ WRONG: Manual loading state when resource provides it
@Component({ selector: 'app-bad', template: '' })
export class BadComponent {
  private isLoading = signal(false);
  private error = signal<string | null>(null);
  private data = signal<User[]>([]);

  // ❌ Manual state management that resource() provides automatically
  constructor() {
    effect(() => {
      this.isLoading.set(true);
      fetch('/api/users').then(r => r.json())
        .then(data => { this.data.set(data); this.isLoading.set(false); })
        .catch(e => { this.error.set(e.message); this.isLoading.set(false); });
    });
  }
}

// ✅ CORRECT: httpResource provides all state automatically
@Component({ selector: 'app-good', template: '' })
export class GoodComponent {
  users = httpResource<User[]>('/api/users');
  // users.isLoading(), users.error(), users.value() — all provided!
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| resource() для mutations (POST/PUT/DELETE) | resource triggers on signal change — mutations on every state change | HTTP call + resource.reload() або optimistic update |
| Manual loading/error signals поряд з resource | resource() provides loading/error нативно | resource.isLoading(), resource.error(), resource.status() |
| signal() + effect() для reset pattern | Не glitch-free, potential race conditions | `linkedSignal(() => sourceSignal())` |
| httpResource без undefined conditional | Fetches навіть при відсутності id | `httpResource(() => id() ? url : undefined)` |
| resource.reload() для optimistic updates | Зайвий HTTP request | `resource.value.set(optimisticValue)` → after mutation → `resource.reload()` |

## Interview Block

### [L1 — Warm-up] Що таке resource() і яку проблему вирішує?
**Signal being tested:** Знання нових Signal async APIs Angular 19+
**What the interviewer expects:** Loading/error/value state автоматично, reactive request signal, SWR, порівняння з toSignal(http$)
**How to probe deeper:** "Як resource() відрізняється від toSignal(http.get())?"
**Reference answer:** resource() — Signal-based async state management: value(), status(), error(), isLoading() сигнали автоматично. При зміні request signal → перезавантажує. Status: Idle/Loading/Refreshing/Resolved/Error/Local. SWR: Refreshing показує stale + оновлює. reload() для manual refresh. Vs toSignal(http$): toSignal — simpler, no loading state, no reload. resource — full lifecycle management.
**Common mistakes:** resource для POST/PUT; не знають про Refreshing vs Loading різницю; не знають про undefined request

### [L2 — Mid] Що таке linkedSignal() і коли vs computed()?
**Signal being tested:** Розуміння writable derived state і коли вибрати над computed
**What the interviewer expects:** WritableSignal що auto-resets, use cases (pagination, selection), відмінність від computed (read-only) і від signal+effect (not glitch-free)
**How to probe deeper:** "Як реалізувати selected item що скидається при reload але можна обрати вручну?"
**Reference answer:** `linkedSignal(() => items()[0])` — WritableSignal що скидається до computed при зміні items. Manual set/update між скиданнями. computed() — read-only, завжди computed. signal() — writable але не auto-reset. signal()+effect() для reset — not glitch-free, race condition. linkedSignal — атомарно і correct. Use cases: pagination page (reset on filter), selected item (reset on reload), form default (override від server, editable).
**Common mistakes:** computed де потрібен linkedSignal; effect для reset; не знають про previous value parameter

### [L3 — Senior] httpResource vs resource vs toSignal(http$)?
**Signal being tested:** Розуміння trade-offs трьох підходів і практичне застосування
**What the interviewer expects:** httpResource = HttpClient based (interceptors, testing), resource = Promise based, toSignal = simpler no lifecycle, httpResource conditional fetch via undefined
**How to probe deeper:** "Як тестувати компонент що використовує httpResource()?"
**Reference answer:** httpResource(): uses HttpClient → interceptors apply, HttpClientTestingController works. Typed HttpErrorResponse. request function → undefined = idle. resource(): custom Promise loader. toSignal(http$): simpler, no reload, no loading state. httpResource для GET в signal-first components — recommended Angular 19+. Testing: provideHttpClientTesting() + TestBed.inject(HttpTestingController) + flush requests.
**Common mistakes:** resource для mutations; httpResource кешує між navigations (ні); undefined не знають

### [L4 — Staff/Principal] Як спроєктувати data loading з Signal APIs?
**Signal being tested:** Архітектурний вибір — httpResource, SignalStore, linkedSignal composition
**What the interviewer expects:** httpResource для GET reads, mutations через HTTP + reload, linkedSignal для UI state, SignalStore для complex state, SSR considerations
**How to probe deeper:** "Як координувати mutations і reads з httpResource?"
**Reference answer:** httpResource для GET (auto-reactive, loading/error/SWR). Mutations: HTTP POST/PUT → then resource.reload() або optimistic update через resource.value.set(). linkedSignal для UI state що derived від resource але overrideable (selection, pagination). SignalStore для complex state з entities і multiple mutations. SSR: httpResource TransferState integration важлива для hydration. Migration: toSignal(http$) → httpResource поступово.
**Common mistakes:** httpResource для mutations; не знають optimistic pattern; не враховують SSR

## Summary

### Key Points
- `linkedSignal(() => computation)` — WritableSignal що auto-resets до computed при dependency change; glitch-free
- `resource({ request, loader })` — Signal-based async state: value, status, error, isLoading, reload
- `httpResource(requestFn)` — HttpClient-based resource: typed, interceptors, HttpTestingController
- `undefined` request → Idle status (no fetch) — conditional loading pattern
- SWR semantics: Refreshing = stale value visible + updating — кращий UX
- Mutations: HTTP call + `resource.reload()` або optimistic `resource.value.set()` + reload
- linkedSignal vs computed: writable derived = linkedSignal; readonly derived = computed

### Elevator Pitch (2 minutes)
"Angular 19 додав два важливих Signal primitive. linkedSignal() — WritableSignal що auto-resets до computed значення при зміні dependency. Ідеально для pagination page (скидається при filter), selected item (скидається при reload). httpResource() — Signal-based HTTP: resource.value(), isLoading(), error(), status() — all signals, auto-reactive до request params. SWR: Refreshing status — показуємо stale data поки оновлюємо. Mutations: окремий HTTP call + resource.reload(). Разом з linkedSignal для UI state і SignalStore для complex state — повна Signal-based архітектура для Angular додатків без ручного subscription management."
