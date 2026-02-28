---
title: "NgRx Lightweight Stores: ComponentStore and SignalStore"
block: 12
topic: 3
slug: "ngrx-lightweight-stores"
difficulty: 4
sinceVersion: "9"
tags: ["ComponentStore", "SignalStore", "ngrx", "lightweight-store", "feature-state", "rxmethod", "withEntities"]
relatedTopics: ["ngrx", "signal-store-ngrx", "service-behaviorsubject", "signals-intro"]
interviewQuestions:
  - id: "b12t3q1"
    level: "junior"
    question: "Що таке NgRx ComponentStore і чим відрізняється від NgRx Store?"
    referenceAnswers:
      junior: "ComponentStore — це легший варіант NgRx для управління станом окремого компонента або feature. Він не потребує глобального store і не має actions."
      mid: "ComponentStore (@ngrx/component-store): local/feature state management. Extends ComponentStore<State>. Без actions і reducers — methods для mutations. updater() для state updates. effect() для async. select() для derived state. Providable у component providers — scoped до component lifecycle. Vs NgRx Store: local scope, simpler, Observable-based, no global registry."
      senior: "ComponentStore vs NgRx Store: 1) Scope: ComponentStore — feature або component. NgRx Store — global. 2) API: ComponentStore — OOP, extends class. NgRx Store — functional DI. 3) Actions: ComponentStore — немає explicit actions. NgRx — required. 4) Devtools: NgRx Store — Redux DevTools. ComponentStore — Angular DevTools component state. 5) Lifeycle: ComponentStore destroyed з component/provider context. NgRx Store — app lifetime. 6) Migration: ComponentStore → SignalStore (recommended for new code). 7) updater vs patchState: updater = immer-like, patchState = shallow merge. 8) effect vs createEffect: ComponentStore effect = scoped Observable, createEffect = global."
      staff: "ComponentStore legacy status: NgRx team recommends migrating to SignalStore for new features. ComponentStore still supported but no new features planned. SignalStore advantages: Signals-based (not Observable), less boilerplate, better Angular integration, future-proof. Migration: ComponentStore.updater → SignalStore.withMethods, ComponentStore.effect → rxMethod, ComponentStore.select → withComputed. Provide в component: both support — ComponentStore в providers[], SignalStore в providers[] too. Testing: both similar. For existing ComponentStore code — no forced migration, it works. For new features — SignalStore."
    commonMistakes:
      - "ComponentStore для global state — scope is feature/component"
      - "Думають ComponentStore і NgRx Store API однакові"
      - "Не знають що SignalStore — successor до ComponentStore"
    relatedQuestions: ["b12t3q2", "b12t3q3"]
  - id: "b12t3q2"
    level: "mid"
    question: "Як написати ComponentStore з updater, effect і select?"
    referenceAnswers:
      junior: "Extend ComponentStore<State>, визначити updater() для оновлень, effect() для HTTP, select() для derived state."
      mid: "```typescript\n@Injectable()\nclass BooksStore extends ComponentStore<BooksState> {\n  constructor() { super({ books: [], loading: false }); }\n  \n  readonly books$ = this.select(state => state.books);\n  readonly loading$ = this.select(state => state.loading);\n  \n  readonly setLoading = this.updater((state, loading: boolean) => ({ ...state, loading }));\n  \n  readonly loadBooks = this.effect((trigger$: Observable<void>) =>\n    trigger$.pipe(\n      tap(() => this.setLoading(true)),\n      switchMap(() => http.get('/api/books').pipe(\n        tapResponse(books => this.patchState({ books, loading: false }), err => this.setLoading(false)),\n      ))\n    )\n  );\n}\n```"
      senior: "ComponentStore details: 1) updater<Input>(fn: (state, input: Input) => State) — pure state transition, safe. 2) effect<Input>(fn: (obs$: Observable<Input>) => Observable<any>) — Observable-based side effect, auto-unsubscribe on destroy. 3) select(projector): Observable with shareReplay(1) semantics — hot. 4) patchState: shallow merge. 5) setState for full replacement. 6) get(projector): synchronous snapshot — use sparingly. 7) tapResponse utility: safe error handling у effect. 8) Composition: multiple ComponentStores can be injected — not global, but sharable within scope."
      staff: "ComponentStore production patterns: 1) View model pattern: ComponentStore exposes viewModel$ = select combining multiple slices для template. 2) Pagination: ComponentStore holds page state, effect loads on page change. 3) Search + filter: ComponentStore holds search/filter/sort state, effect debounces and fetches. 4) Wizard steps: ComponentStore per step-form, parent ComponentStore для overall wizard. 5) Drag-n-drop state: ComponentStore for local interaction state. 6) Testing: provide in TestBed providers, call effect triggers, subscribe to selects. 7) Error patterns: ComponentStore effect with tapResponse — proper error handling. 8) Lifecycle hooks: ngOnInit trigger → this.loadBooks() effect call. 9) Optimization: select with distinctUntilChanged (built-in)."
    commonMistakes:
      - "effect без tapResponse — unhandled errors"
      - "updater що returns undefined (forgot return) — state becomes undefined"
      - "Не знають що select вже має distinctUntilChanged"
    relatedQuestions: ["b12t3q1", "b12t3q3"]
  - id: "b12t3q3"
    level: "senior"
    question: "Як NgRx SignalStore відрізняється від ComponentStore? Як провести міграцію?"
    referenceAnswers:
      junior: "SignalStore використовує Angular Signals замість RxJS. Менше boilerplate і простіший API."
      mid: "ComponentStore: Observable-based, extends class, updater/effect/select. SignalStore: Signal-based, composition (withState/withMethods/withComputed), patchState/rxMethod/computed. SignalStore переваги: Signals integration, less boilerplate, modern approach. Migration: updater → withMethods patchState, effect → rxMethod, select → withComputed."
      senior: "Migration mapping: 1) `extends ComponentStore<State>` → `signalStore(withState(initialState))`. 2) `updater((state, v) => ({...state, field: v}))` → `withMethods(store => ({ setField: (v) => patchState(store, {field: v}) }))`. 3) `effect(trigger$ => trigger$.pipe(switchMap(http$)))` → `rxMethod(pipe(switchMap(http$)))`. 4) `select(state => state.items)` → `withComputed(({ items }) => ({ items: computed(() => items()) }))` — but items already signal from withState. 5) `patchState(partial)` — same API в обох. 6) `tapResponse` — same utility. 7) Scope: обидва providable у component providers. Key difference: ComponentStore methods return Observables. SignalStore state IS Signals (no subscription needed)."
      staff: "Migration strategy at scale: 1) Identify ComponentStore usages in codebase. 2) Create parity tests: same inputs → same outputs. 3) Migrate one ComponentStore at a time. 4) Component template update: remove async pipe for select observables → use signal() directly. 5) Effect migration: rxMethod handles same patterns. 6) Testing update: selector spies → signal reads. 7) Feature toggle: run both implementations behind flag during transition. 8) Custom features: if ComponentStore extended with custom logic → migrate to withHooks + custom signalStoreFeature. 9) Timeline: no breaking change — ComponentStore stays supported. Migrate when touching code anyway (boy scout rule)."
    commonMistakes:
      - "Думають міграція автоматична — потрібні ручні зміни у templates і tests"
      - "Не оновлюють template (async pipe removal)"
      - "Намагаються migrate все at once замість incremental"
    relatedQuestions: ["b12t3q2", "b12t3q4"]
  - id: "b12t3q4"
    level: "mid"
    question: "Як providable scope впливає на lifecycle ComponentStore і SignalStore?"
    referenceAnswers:
      junior: "Якщо надається у providers компонента — lifecycle прив'язаний до компонента. Якщо в root — живе весь час."
      mid: "Component providers: `@Component({ providers: [MyStore] })` — новий instance per component instance, destroyed з компонентом. Service providers: `@Injectable({ providedIn: 'root' })` — singleton, app lifetime. Route providers: `Route({ providers: [MyStore] })` — lazily created, destroyed з route deactivation. Scope влияє на: state isolation (кожен компонент свій state), lifecycle (auto cleanup)."
      senior: "Providable scope details: 1) Component-scoped: кожен MyComponent instance has own MyStore. Multiple instances of component = multiple store instances. Destroyed з component. 2) Root-scoped: singleton, shared across all features. ComponentStore destroyable manually. SignalStore root: state persists. 3) Route-scoped (Angular 15+): `Route({ providers: [store] })` — created once per route activation, destroyed on deactivate. 4) EnvironmentInjector: intermediate scope between root і component. 5) Platform: очень рідко. SignalStore withHooks.onDestroy() called when scope is destroyed. ComponentStore.ngOnDestroy called when scope destroyed. Use case: component-scoped = shopping cart for item detail. Root-scoped = auth state, navigation history."
      staff: "Scope design decisions: 1) Component-scoped stores: для isolation — пошук, pagination, selection state per component instance. Prevents state leakage between instances. 2) Route-scoped: per-page state, persists during sub-navigation within route, destroyed on route exit. Pattern for route: `{ path: 'users', providers: [UsersPageStore], component: UsersPageComponent }`. 3) Feature-module scoped (legacy NgModules): provide in feature module providers. 4) Considerations: state size × number of instances. If each component instance has large state and many instances — memory concern. 5) Testing: component-scoped easier to test (isolated). Root-scoped needs cleanup between tests. 6) Angular 17+ best practice: route-scoped SignalStore for page-level state. Component-scoped for instance-isolated state. Root for global."
    commonMistakes:
      - "Root-scoped store для page-level state — persists between page visits (stale data)"
      - "Component-scoped для shared state — кожен компонент має свою копію"
      - "Не знають route-scoped providers pattern"
    relatedQuestions: ["b12t3q3", "b12t3q5"]
  - id: "b12t3q5"
    level: "staff"
    question: "Як обрати між ComponentStore, SignalStore і NgRx Store для різних сценаріїв?"
    referenceAnswers:
      junior: "ComponentStore для окремих компонентів, NgRx Store для глобального стану, SignalStore — нова альтернатива."
      mid: "SignalStore — сучасна заміна ComponentStore. ComponentStore — legacy, signals-aware. NgRx Store — global, cross-feature. Вибір: новий feature-level state → SignalStore. Global state → NgRx Store. Existing ComponentStore → migrate поступово."
      senior: "Decision matrix: 1) Component-isolated state (не shared) → local signals або component-scoped SignalStore. 2) Feature-level shared state (одна feature/route) → SignalStore (route-scoped або root). 3) Cross-feature state, global → NgRx Store. 4) Existing ComponentStore codebase → don't migrate all at once, incremental. 5) Entities CRUD → withEntities (SignalStore) або EntityAdapter (NgRx). 6) Audit trail needed → NgRx Store (actions log). 7) Team size: < 5 → service+signals. 5-15 → SignalStore. 15+ → NgRx. 8) Debugging: SignalStore у Angular DevTools signals. NgRx — Redux DevTools."
      staff: "Enterprise decision framework: 1) Start question: 'Does this state need to be shared across routes/features?' No → component or route-scoped. Yes → root-scoped SignalStore або NgRx. 2) 'Do we need event audit trail, time-travel?' Yes → NgRx Store. No → SignalStore. 3) 'How complex is async logic?' Simple CRUD → SignalStore rxMethod. Complex (optimistic, retry, coordination) → NgRx Effects. 4) 'What's team's experience level?' Junior-heavy → NgRx (conventions). Experienced → SignalStore (flexibility). 5) 'Bundle budget?' Critical → service + signals (0KB). Normal → SignalStore (small). Rich devtools needed → NgRx. 6) 'Timeline?' Fast delivery → signals service. Long-term → invest in NgRx infrastructure. 7) Document architectural decision in ADR. Review after 6 months."
    commonMistakes:
      - "NgRx для everything — over-engineering small features"
      - "ComponentStore для new features — prefer SignalStore"
      - "Не документують architectural decisions"
    relatedQuestions: ["b12t3q4", "b12t3q1"]
---

## Core Concept

**English definition:** NgRx offers two lightweight alternatives to the global Store: `ComponentStore` (Observable-based, introduced in NgRx 9) for feature/component-scoped state management, and `SignalStore` (Signal-based, introduced in NgRx 17) which is the modern successor to ComponentStore. Both provide structured state management without global store complexity, and can be scoped to components, routes, or root.

**Пояснення:** NgRx усвідомили що не все потребує global Redux Store. ComponentStore вирішив проблему "component-level state with Observable patterns without global overhead." SignalStore — наступний крок: Signals-based, менший boilerplate, краща Angular integration. ComponentStore залишається підтримуваним, але нові features мають використовувати SignalStore.

**Яку проблему вирішує:**
- **Feature isolation:** Feature state без global store pollution
- **Lifecycle scope:** State destroyed разом з component або route
- **Boilerplate reduction:** Vs NgRx Store: без actions/reducers для simple cases
- **Migration path:** ComponentStore → SignalStore поступово

**Як працює під капотом:**

```typescript
// ComponentStore (Observable-based):
class MyStore extends ComponentStore<State> {
  // constructor() { super(initial) } → BehaviorSubject<State>
  // select(proj) → pipe(map(proj), distinctUntilChanged(), shareReplay(1))
  // updater(fn) → (input) => { this.setState(state => fn(state, input)) }
  // effect(fn) → creates Observable, subscribes, auto-cleanup on destroy
}

// SignalStore (Signal-based):
const MyStore = signalStore(
  withState(initial),     // → signal for each state field
  withComputed(store =>   // → computed signals
    ({ derived: computed(() => store.field()) })),
  withMethods(store =>    // → methods using patchState
    ({ update: (v) => patchState(store, { field: v }) })),
);
// patchState = shallow merge via signal updates
```

**Trade-offs та обмеження:**
- ComponentStore — Observable-based, потребує async pipe або subscription management
- SignalStore — Signal-based, потребує injection context
- Обидва — немає devtools як NgRx Redux DevTools (Angular DevTools показує signals)
- ComponentStore deprecated for new use, SignalStore — current recommendation

**Версійність:**
- NgRx 9: ComponentStore introduced
- NgRx 14: ComponentStore improvements, tapResponse utility
- NgRx 17: @ngrx/signals SignalStore introduced
- NgRx 17.1: withEntities в @ngrx/signals
- NgRx 18: tapResponse у @ngrx/operators, withCallState
- NgRx 21: поточна версія, SignalStore recommended for new features

## Deep Details

### Edge Cases

- **ComponentStore updater return:** updater callback MUST return new state. `updater((state, v) => { state.field = v; })` — forgets return → state becomes undefined!
- **SignalStore і injection context:** `inject(MySignalStore)` вимагає injection context — у constructor, field initializer, або factory function у providers.
- **ComponentStore і multiple instances:** Якщо ComponentStore provide у component providers — кожен компонент instance має свій store. Корисно для isolation. Але якщо компоненти мають спілкуватись — потрібен parent-scoped або root store.
- **rxMethod cancellation:** rxMethod з switchMap — кожен новий call скасовує попередній. Але при store destroy — всі rxMethod Observable unsubscribe. Немає dangling subscriptions.
- **withHooks onInit timing:** withHooks({ onInit(store) { store.loadData(); } }) — runs когщо service inject. Якщо service route-scoped — на route activation.

### Junior vs Senior Understanding

**Junior** знає: "ComponentStore для component state, extends ComponentStore<State>. SignalStore — новий з Signals."

**Senior** розуміє глибину:

1. **Observable-based vs Signal-based state delivery:** ComponentStore.select() returns Observable — потрібен async pipe або subscribe. SignalStore state — Signals — читаються напряму у template `{{ store.items() }}`, у computed(), у effect().

2. **Scope і lifecycle orchestration:** Route-scoped store через Route providers — common pattern для page-level state. State persists через sub-navigation, destroyed на route exit. Better UX (no state loss during drawer open/close).

3. **tapResponse utility:** `tapResponse({ next: v => patchState(store, {data: v}), error: e => patchState(store, {error: e.message}) })` — structured error handling у effect/rxMethod без manual try-catch або catchError boilerplate.

4. **withEntities у SignalStore vs EntityAdapter у NgRx:** Обидва normalized CRUD. withEntities simpler API. EntityAdapter більш battle-tested, більша community. Для new NgRx Signal Store projects: withEntities recommended.

### Deprecation & Migration Path

- **ComponentStore:** Not deprecated but "maintenance mode" — no new features. SignalStore is the forward path.
- Migration guide: NgRx docs мають explicit guide: ComponentStore → SignalStore.
- **NgRx 9 `@Effect` decorator:** Removed у NgRx 15 (for global Store Effects). `createEffect()` functional API.
- Feature files: ComponentStore files typically `feature.store.ts`. SignalStore: `feature.store.ts` same convention.

### Connections to Other Concepts

- **NgRx (b12t2):** Global Store для cross-feature state.
- **Signals (b11t1):** SignalStore built on Signal primitives.
- **Signal Store NgRx (b11t3):** Detailed SignalStore API.
- **State Comparison (b12t4):** When lightweight vs NgRx Store.

## Examples

### Basic Usage

```typescript
// ComponentStore (legacy approach)
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface BooksState {
  books: Book[];
  loading: boolean;
  error: string | null;
}

@Injectable()
export class BooksComponentStore extends ComponentStore<BooksState> {
  private http = inject(HttpClient);

  constructor() { super({ books: [], loading: false, error: null }); }

  // ✅ Selectors
  readonly books$ = this.select(state => state.books);
  readonly loading$ = this.select(state => state.loading);

  // ✅ Updater for synchronous state changes
  readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading,
  }));

  // ✅ Effect for async operations
  readonly loadBooks = this.effect((trigger$: Observable<void>) =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      switchMap(() =>
        this.http.get<Book[]>('/api/books').pipe(
          tapResponse(
            books => this.patchState({ books, loading: false }),
            (err: Error) => this.patchState({ error: err.message, loading: false }),
          ),
        )
      ),
    )
  );
}

// ✅ SignalStore (modern approach — preferred)
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap } from 'rxjs';
import { computed, inject } from '@angular/core';

export const BooksStore = signalStore(
  withEntities<Book>(),
  withState({ loading: false, error: null as string | null }),
  withComputed(({ entities, loading }) => ({
    books: computed(() => entities()),
    isLoading: computed(() => loading()),
  })),
  withMethods((store, http = inject(HttpClient)) => ({
    loadBooks: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          http.get<Book[]>('/api/books').pipe(
            tapResponse({
              next: books => patchState(store, setAllEntities(books), { loading: false }),
              error: (err: Error) => patchState(store, { loading: false, error: err.message }),
            }),
          )
        ),
      ),
    ),
  })),
  withHooks({ onInit(store) { store.loadBooks(); } }),
);
```

### Production Scenario

```typescript
// ✅ Route-scoped SignalStore for page-level state
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, removeEntity, updateEntity } from '@ngrx/signals/entities';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, concatMap, exhaustMap, tap } from 'rxjs';

export const OrdersPageStore = signalStore(
  withEntities<Order>(),
  withState({
    selectedId: null as string | null,
    filter: 'all' as OrderFilter,
    loading: false,
    submitting: false,
    error: null as string | null,
  }),
  withComputed(({ entities, selectedId, filter }) => ({
    filteredOrders: computed(() => {
      const all = entities();
      return filter() === 'all' ? all : all.filter(o => o.status === filter());
    }),
    selectedOrder: computed(() =>
      entities().find(o => o.id === selectedId()) ?? null
    ),
  })),
  withMethods((store, http = inject(HttpClient)) => ({
    loadOrders: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          http.get<Order[]>('/api/orders').pipe(
            tapResponse({
              next: orders => patchState(store, setAllEntities(orders), { loading: false }),
              error: (err: Error) => patchState(store, { loading: false, error: err.message }),
            }),
          )
        ),
      ),
    ),

    cancelOrder: rxMethod<string>(
      pipe(
        concatMap(id =>
          http.delete(`/api/orders/${id}`).pipe(
            tapResponse({
              next: () => patchState(store, removeEntity(id)),
              error: (err: Error) => patchState(store, { error: err.message }),
            }),
          )
        ),
      ),
    ),

    selectOrder: (id: string) => patchState(store, { selectedId: id }),
    setFilter: (filter: OrderFilter) => patchState(store, { filter }),
  })),
);

// Route definition with scoped store
export const ordersRoutes: Routes = [{
  path: 'orders',
  providers: [OrdersPageStore], // ← scoped to this route
  component: OrdersPageComponent,
}];
```

### Anti-Example

```typescript
// ❌ WRONG: ComponentStore updater without return
@Injectable()
export class BadStore extends ComponentStore<{count: number}> {
  readonly badIncrement = this.updater((state) => {
    state.count++; // ❌ Mutates in-place AND forgets to return!
    // Result: state becomes undefined!
  });
}

// ✅ CORRECT:
readonly increment = this.updater((state) => ({ ...state, count: state.count + 1 })); // ✅ returns new object

// ❌ WRONG: ComponentStore for global cross-feature state
@Injectable({ providedIn: 'root' }) // root-scoped ComponentStore
export class GlobalUserStore extends ComponentStore<UserState> {
  // ❌ ComponentStore is designed for feature/component scope
  // For global cross-feature: use NgRx Store or SignalStore
}

// ❌ WRONG: No error handling in effect
readonly loadItems = this.effect(() =>
  interval(5000).pipe(
    switchMap(() => this.http.get('/api/items')),
    // ❌ No error handling — first HTTP error kills effect
    tap(items => this.patchState({ items })),
  )
);

// ✅ CORRECT: tapResponse for structured error handling
readonly loadItems = this.effect(() =>
  interval(5000).pipe(
    switchMap(() =>
      this.http.get<Item[]>('/api/items').pipe(
        tapResponse(
          items => this.patchState({ items }),
          err => this.patchState({ error: err.message }),
        ),
      )
    ),
  )
);
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| ComponentStore updater без return | State becomes undefined | Always return new state object: `return { ...state, ... }` |
| ComponentStore для новых features | Maintenance mode, no new features | NgRx SignalStore — current recommendation |
| Root-scoped ComponentStore/SignalStore для page-level state | State persists між page visits — stale data | Route-scoped providers або manual reset на init |
| ComponentStore effect без tapResponse | Unhandled errors, effect dies | `tapResponse({ next, error })` від @ngrx/operators |
| Component-scoped store де потрібен shared state | Кожен компонент instance має свій store | Parent-scoped або route-scoped store |

## Interview Block

### [L1 — Warm-up] ComponentStore vs NgRx Store?
**Signal being tested:** Знання NgRx ecosystem і вибір правильного scope
**What the interviewer expects:** Local vs global scope, no actions in ComponentStore, Observable-based, migration до SignalStore
**How to probe deeper:** "Коли ви обрали б ComponentStore над NgRx Store?"
**Reference answer:** ComponentStore — feature/component-scoped state, без global registration, без actions, Observable-based. NgRx Store — global, event-sourced, Redux pattern. ComponentStore для: isolated feature state, component-specific. NgRx Store для: cross-feature, audit trail, devtools. SignalStore — сучасна заміна ComponentStore: Signals-based, менше boilerplate, рекомендована для нових features.
**Common mistakes:** ComponentStore для global state; думають ComponentStore і NgRx Store API identical; не знають SignalStore successor

### [L2 — Mid] Як написати ComponentStore з updater, effect, select?
**Signal being tested:** Практичне знання ComponentStore API
**What the interviewer expects:** extends ComponentStore<State>, updater (pure state fn), effect (Observable fn), select (projector), tapResponse, patchState
**How to probe deeper:** "Що станеться якщо updater не повертає новий об'єкт?"
**Reference answer:** `extends ComponentStore<State>`. `select(state => slice)` — Observable. `updater((state, input) => ({...state, field: input}))` — MUST return new state. `effect(trigger$ => trigger$.pipe(switchMap(http$), tapResponse(next, error)))` — Observable-based async. tapResponse для structured error handling. patchState для shallow merge.
**Common mistakes:** updater без return (state becomes undefined); effect без tapResponse; select на кожну property окремо (prefer ViewModel)

### [L3 — Senior] Як мігрувати ComponentStore до SignalStore?
**Signal being tested:** Знання migration mapping і practical migration approach
**What the interviewer expects:** updater → patchState в withMethods, effect → rxMethod, select → withComputed, async pipe removal у template
**How to probe deeper:** "Що потрібно змінити в template при migration?"
**Reference answer:** updater → `withMethods patchState`. effect → `rxMethod(pipe(switchMap(...), tapResponse(...)))`. select → `withComputed`. Template: remove `async pipe` від Observable selects → use signal() directly `{{ store.items() }}`. Test: selector spies → signal reads. пatchState same API. withHooks для onInit. Incremental — migrate один ComponentStore за раз.
**Common mistakes:** Forgetting template update (async pipe removal); big bang migration; не оновлюють tests

### [L4 — Staff/Principal] Як обрати scope і тип store?
**Signal being tested:** Архітектурний judgment — scope decision, lifecycle implications, enterprise decision framework
**What the interviewer expects:** Component/Route/Root scopes, lifecycle implications, decision matrix, route-scoped pattern
**How to probe deeper:** "Як route-scoped store відрізняється від component-scoped і коли що краще?"
**Reference answer:** Component-scoped: instance isolation, multiple stores per component type. Route-scoped: page-level state, persists during sub-navigation, destroyed on route exit — most common pattern. Root: global, app lifetime. Decision: feature-level page state → route-scoped SignalStore. Component instance isolation → component-scoped. Global auth/nav → root SignalStore або NgRx. Audit trail → NgRx Store. Team conventions: document in ADR.
**Common mistakes:** Root scope для page state (stale data); component scope для shared (isolation); не знають route-scoped pattern

## Summary

### Key Points
- ComponentStore — Observable-based feature/component-scoped store, maintenance mode
- SignalStore — Signal-based successor to ComponentStore, recommended for new features
- updater() в ComponentStore MUST return new state object
- rxMethod у SignalStore = Observable-based effect з auto-cleanup
- Scope options: component providers, route providers, providedIn: 'root'
- Route-scoped providers (`Route.providers`) — common pattern для page-level state
- tapResponse utility — structured error handling у both ComponentStore effects і SignalStore rxMethod

### Elevator Pitch (2 minutes)
"NgRx provides lightweight stores для feature-level state: ComponentStore (legacy, Observable-based) і SignalStore (current, Signal-based). ComponentStore — extends class з updater/effect/select. SignalStore — composition з withState/withMethods/withComputed і rxMethod для async. SignalStore є recommended successor. Обидва providable у component або route providers — scoped lifecycle. Route-scoped SignalStore — common pattern: `Route({ providers: [PageStore] })` — state persists during sub-navigation, destroyed on route exit. Для нових features: SignalStore. Для existing ComponentStore — migrate incremental."
