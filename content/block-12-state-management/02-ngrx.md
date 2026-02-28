---
title: "NgRx: Store, Actions, Reducers, Effects, Selectors"
block: 12
topic: 2
slug: "ngrx"
difficulty: 5
sinceVersion: "4"
tags: ["ngrx", "redux", "store", "actions", "reducers", "effects", "selectors", "entity", "devtools"]
relatedTopics: ["service-behaviorsubject", "signal-store-ngrx", "higher-order-operators", "error-handling-rxjs"]
interviewQuestions:
  - id: "b12t2q1"
    level: "junior"
    question: "Що таке NgRx і як він реалізує Redux pattern в Angular?"
    referenceAnswers:
      junior: "NgRx — це state management бібліотека для Angular що реалізує Redux pattern. Є Store (global state), Actions (що сталося), Reducers (як state змінюється), Effects (async operations)."
      mid: "NgRx Redux flow: 1) Action dispatched від компонента. 2) Reducer: pure function (state, action) => newState. 3) Store оновлює state. 4) Selectors вибирають частину state. 5) Components підписуються на selectors. 6) Effects: intercept actions → async operation → dispatch новий action. Переваги: predictable state, devtools, immutability enforcement."
      senior: "NgRx internals: Store — BehaviorSubject обгорнутий у Redux-like container з reducer registry. dispatch(action) → reducers run → новий state emitted. State tree — normalized via createEntityAdapter. Effects — Observable streams що react на actions via ofType operator. Selectors — memoized functions з createSelector: recompute тільки при зміні dependencies. createFeature — автоматичний feature reducer registration. Unidirectional data flow: View → Action → Reducer → Store → Selector → View."
      staff: "NgRx architectural value: 1) Actions as events — audit trail, time-travel debugging, replay. 2) Immutable state — predictable, testable. 3) Normalized entities — EntityAdapter, CRUD operations, deduplication. 4) Selectors memoization — O(1) re-render для незмінних selectors. 5) Effects isolation — async operations separated від components. 6) devtools — Redux DevTools: state inspector, action log, time-travel. 7) Team scalability: actions = contract між features. Reducers = pure functions testable без Angular. 8) Bundle cost: NgRx ~100KB. Justify when: team > 5, complex state, audit trail needed."
    commonMistakes:
      - "Dispatch action всередині reducer — reducer must be pure"
      - "HTTP calls у reducers — side effects belong in Effects"
      - "Не використовують selectors — читають весь store у component"
    relatedQuestions: ["b12t2q2", "b12t2q3"]
  - id: "b12t2q2"
    level: "mid"
    question: "Як правильно написати NgRx Effect і обробити помилки?"
    referenceAnswers:
      junior: "Effect — це Injectable з @Effect decorator або createEffect() що перехоплює actions і робить async операції. catchError потрібен щоб Effect не вмер при помилці."
      mid: "createEffect(() => actions$.pipe(ofType(actionType), switchMap/concatMap/exhaustMap(action => http.call(action.params).pipe(map(result => successAction({result})), catchError(err => of(failureAction({error: err}))))))) . Важливо: catchError ВСЕРЕДИНІ switchMap — effect не вмирає при помилці. dispatch: true (default) — dispatches returned action."
      senior: "Effect concurrency strategies: 1) switchMap — read operations, cancel stale (loadUser on route change). 2) concatMap — sequential writes (ordered saves). 3) exhaustMap — prevent duplicate (login). 4) mergeMap — parallel independent (upload files). Error handling: catchError ВСЕРЕДИНІ inner pipe → returns failure action → effect continues. Without inner catchError: first error kills effect permanently. NgRx 17+ Effects: `{ functional: true }` для functional effects без Injectable class. tapResponse від @ngrx/operators: structured next/error handling."
      staff: "Effect design patterns: 1) Effect per action pattern: one effect = one responsibility. 2) Navigation effects: `switchMap(() => this.router.navigate([...]), { dispatch: false })`. 3) Optimistic effects: dispatch success immediately, revert on failure. 4) Race condition prevention: switchMap for reads, concatMap for writes. 5) Effect testing: provideMockActions + hot Observable. 6) createEffect({ dispatch: false }) for side effects without dispatching. 7) Router navigation в Effect через Router service. 8) Long-running effects: WebSocket stream → dispatch events. 9) tapResponse utility: `tapResponse({ next: result => successAction({result}), error: err => failureAction({err}) })`. 10) Effect isolation: effects не читають state напряму — тільки через action payload або withLatestFrom selector."
    commonMistakes:
      - "catchError поза inner pipe — effect вмирає після першої помилки"
      - "switchMap для write operations — request cancellation mid-flight"
      - "Effect читає store напряму замість withLatestFrom"
    relatedQuestions: ["b12t2q1", "b12t2q3"]
  - id: "b12t2q3"
    level: "senior"
    question: "Як працюють NgRx Selectors і чому memoization важлива?"
    referenceAnswers:
      junior: "Selectors — це функції що вибирають частину store. createSelector мemoizes результат щоб не перераховувати при незмінних даних."
      mid: "createSelector(featureSelector, (state) => derived): memoized — перераховується тільки якщо input selectors змінились. createFeatureSelector('feature') — вибирає feature slice. Composable: createSelector(selector1, selector2, (v1, v2) => combine(v1, v2)). Runtime: projector function викликається тільки якщо inputs !== previous."
      senior: "Selector memoization internals: createSelector зберігає останні inputs і result. При нових inputs: strict equality (===) check. Якщо однакові → повертає cached result без виклику projector. Якщо різні → recalculate і cache. Для arrays: push mutates in-place → same reference → selector won't recalculate. Тому immutable updates critical. Props-based selectors (legacy): `createSelector(selector, (state, props) => ...)` — deprecated у NgRx 15, use closure. Release memoization: `selector.release()` або `selector.clearResult()` для testing. `createSelectorFactory` з custom memoization для special cases (e.g., structuralEqual)."
      staff: "Selector performance architecture: 1) Selector composition pyramid: base feature selectors → derived → aggregate. 2) Avoid computing in component — move to selector. 3) Memoization granularity: fine-grained selectors = fewer rerenders. 4) Projector profiling: Angular DevTools показує selector recomputes. 5) Custom memoizer: `createSelectorFactory(defaultStateFn)` для custom comparison. 6) Parametrized selectors: `const selectItem = (id: string) => createSelector(selectAll, items => items.find(i => i.id === id))`. Але кожен call creates new selector instance. Pattern: factory in constructor, same instance. 7) Weak map memoization for parametrized. 8) ngRx/store memoizeOne approach. 9) selectMany: multiple selectors combine via combineLatest. 10) Testing: projector unit tests — pure function, no Redux setup needed."
    commonMistakes:
      - "Mutable state updates — selector не recomputes (same reference)"
      - "Parametrized selectors у template — new instance on each call = no memoization"
      - "Не знають що projector tests не потребують Redux setup"
    relatedQuestions: ["b12t2q2", "b12t2q4"]
  - id: "b12t2q4"
    level: "mid"
    question: "Що таке NgRx Entity і як він спрощує CRUD operations?"
    referenceAnswers:
      junior: "NgRx Entity — це допоміжний пакет для управління колекціями об'єктів. Він зберігає entities у normalized формі і надає CRUD operations."
      mid: "createEntityAdapter<Entity>() надає: addOne, addMany, setAll, updateOne, removeOne і т.д. Normalized state: `{ ids: string[], entities: Record<string, Entity> }`. selectAll, selectEntities, selectIds, selectTotal selectors. Normalize краще за array: O(1) lookup by id замість O(n) find."
      senior: "EntityAdapter internals: ids array + entities dictionary (hashmap). CRUD: addOne = update ids and entities. updateOne({ id, changes }) = spread merge. removeOne = filter ids, delete from entities. selectAll = ids.map(id => entities[id]). sortComparer: optional function для sorted ids. Переваги normalized: 1) O(1) lookups. 2) Деduplication (no duplicate entities). 3) Consistent CRUD operations. 4) Integrates with createSelector. Selector composition: `const { selectAll, selectEntities } = adapter.getSelectors(selectFeature)`."
      staff: "Entity in large-scale apps: 1) Normalized data: parent → child relationships via IDs, not embedded. 2) Relationships: UserEntity with orderIds[], OrderEntity with userId. 3) Denormalization for UI: selector that joins User + Orders. 4) Bulk operations: addMany, setMany for batch imports. 5) Pagination: separate pagination state, entity slice for cached pages. 6) Optimistic CRUD: addOne(optimistic) → HTTP → on error: removeOne(optimisticId). 7) Stale data: updatedAt field + refresh logic. 8) Type safety: EntityAdapter<User> — all operations typed. 9) Server normalization: Normalizr.js for nested API responses before dispatch. 10) Compare with withEntities (SignalStore): simpler API, Signal-based, but no global store benefits."
    commonMistakes:
      - "Array state замість normalized — O(n) lookups, duplicate entities"
      - "Не знають selectAll = ids.map(id => entities[id]) — order matters"
      - "Embed child objects замість normalize"
    relatedQuestions: ["b12t2q3", "b12t2q5"]
  - id: "b12t2q5"
    level: "staff"
    question: "Як тестувати NgRx Store, Effects і Selectors?"
    referenceAnswers:
      junior: "Selectors тестуються як чисті функції. Effects тестуються з provideMockActions. Store тестуються через TestBed з MockStore."
      mid: "Selectors: projector unit test — `selector.projector(mockState)` — no Redux. Effects: `provideMockActions()` у TestBed + hot Observable з action sequence. MockStore: `provideMockStore({ initialState })` → `store.setState()` → перевірити dispatched actions. Component tests: MockStore + mockSelector via `store.overrideSelector(selector, value)`."
      senior: "Testing strategy: 1) Reducers: pure function → `expect(reducer(initialState, action)).toEqual(expectedState)`. 2) Selectors: projector test: `expect(selectActive.projector(state)).toEqual(expected)`. 3) Effects: TestBed з `provideMockActions(actions$)`. `actions$ = hot('-a', { a: loadAction })`. `effects.load$.subscribe(result => expect(result).toEqual(successAction))`. Marble testing для timing. 4) Components: MockStore + overrideSelector. assert dispatched actions: `store.scannedActions$.subscribe`. 5) Integration tests: real Store + Effects + HTTP mock (HttpTestingController). 6) Effect error paths: `actions$ = hot('-a', { a: loadAction })` + mock http to throw → verify failureAction dispatched."
      staff: "NgRx testing pyramid: 1) Unit: reducer, selector projector, effect logic — fast, no Angular. 2) Integration: component + MockStore — Angular TestBed, moderate. 3) E2e: full Redux flow — Playwright/Cypress, slow but high confidence. Anti-patterns: 1) Testing implementation (action type strings) not behavior. 2) Overly mocked effects — testing the mock, not logic. 3) No error path tests — most bugs in error handling. Best practices: 1) Effect marble tests for all concurrency scenarios. 2) Snapshot tests for complex selectors. 3) State machine tests for complex reducer logic. 4) Router integration tests for navigation effects. 5) CI: all tests run — unit fast, integration slower, e2e nightly or pre-release."
    commonMistakes:
      - "Тестують action type strings замість behavior"
      - "Не тестують error paths у Effects"
      - "MockStore без overrideSelector — selector returns undefined"
    relatedQuestions: ["b12t2q4", "b12t2q3"]
---

## Core Concept

**English definition:** NgRx is Angular's implementation of the Redux pattern: a single immutable state tree (Store), typed events that describe what happened (Actions), pure functions that transform state (Reducers), memoized state projections (Selectors), and Observable-based async operations that react to actions (Effects).

**Пояснення:** Redux pattern вирішує "prop drilling" і "shared mutable state" проблеми через centralizing state. Actions — це аудит лог "що сталося". Reducers — pure functions без side effects. Selectors — efficient derived state з memoization. Effects — bridge між Redux і async world (HTTP, WebSocket). NgRx робить це Angular-native: DI, TypeScript, RxJS.

**Яку проблему вирішує:**
- **Centralized state:** Один source of truth для app state
- **Predictability:** Unidirectional data flow, immutable updates
- **Debug:** Redux DevTools: state inspector, action log, time-travel
- **Team scalability:** Actions = contract. Features розуміють одне одного через actions
- **Audit trail:** Кожна зміна state — action у log

**Як працює під капотом:**

```
Component dispatches action:
  store.dispatch(loadUsers({ page: 1 }))

Action flows to:
  1. Effects: ofType(loadUsers) → HTTP → dispatch loadUsersSuccess/Failure
  2. Reducers: (state, action) => newState (pure function)

Store updates:
  BehaviorSubject<AppState>.next(newState)

Selectors subscribe:
  selectUsers.pipe(
    map(selectUsers.projector),  // memoized
    distinctUntilChanged(),
  )

Component receives:
  users$ = this.store.select(selectUsers) // Observable<User[]>
```

**Trade-offs та обмеження:**
- Boilerplate: action + reducer + effect + selector для кожної feature
- Bundle: ~100KB additional
- Learning curve: Redux mental model
- Over-engineering для small features

**Версійність:**
- NgRx 4-6: перший stable з Angular 4+
- NgRx 8: createAction, createReducer, createEffect — functional API (замість classes)
- NgRx 13: standalone compatible
- NgRx 15: createFeature, feature creators, props-based selectors deprecated
- NgRx 17: Signal Store (@ngrx/signals), functional effects
- NgRx 18: tapResponse, withCallState utilities
- NgRx 21: поточна стабільна версія

## Deep Details

### Edge Cases

- **Effect і state reading:** Effect НІКОЛИ не читає store напряму (action.getStore()). Використовувати `withLatestFrom(store.select(selector))` у pipe.
- **Reducer і side effects:** Reducer — pure function: no HTTP, no console.log, no Date.now() без injection. Side effects → Effects.
- **Multiple reducers і action:** Один action може бути handled by multiple reducers — це feature, не bug. Наприклад, `logout` action → auth reducer clear token + user reducer clear profile + settings reducer reset.
- **EntityAdapter і sortComparer:** `sortComparer: (a, b) => a.name.localeCompare(b.name)` — ids масив буде sorted. Але sort при кожному add/update — performance cost для large collections.
- **Selector memoization і class instances:** `createSelector` використовує `===` для comparison. Якщо reducers мутують (не повертають new object) — selector не recomputes навіть якщо data змінилась. Immutability essential.

### Junior vs Senior Understanding

**Junior** знає: "action dispatch → reducer → store updates → selector emits → component renders."

**Senior** розуміє глибину:

1. **Effect inner catchError placement:** Effect pipe structure:
   ```
   ofType(load)
   → switchMap(({ id }) =>
       http.get(url).pipe(
         map(data => loadSuccess({ data })),
         catchError(err => of(loadFailure({ err }))) // ← inner
       )
   )
   ```
   Inner catchError = effect survives. Outer = effect dies after first error.

2. **Selector composition і projector tests:** `createSelector(s1, s2, projector)` — `projector(s1Value, s2Value)` — це pure function. Unit test без Redux: `expect(selector.projector(mockS1, mockS2)).toEqual(expected)`.

3. **Action typing з createActionGroup:** `createActionGroup({ source: 'Users API', events: { loadUsers: emptyProps(), loadUsersSuccess: props<{users: User[]}>() } })` — generates typed actions. Type unions automatically.

4. **RouterStore (@ngrx/router-store):** Router state у NgRx Store — route params, URL, query string available у selectors і effects.

### Deprecation & Migration Path

- **@Effect decorator:** Removed у NgRx 15. Замінено на `createEffect()` functional API.
- **Class-based actions:** `class LoadUsers implements Action { type = '[Users] Load' }` → `createAction('[Users] Load')`.
- **Class-based reducers:** `function reducer(state, action): State { switch(action.type) ... }` → `createReducer` з `on()`.
- **Props-based selectors:** `createSelector(..., (state, props) => ...)` deprecated → closure pattern.

### Connections to Other Concepts

- **RxJS Operators (b10t1):** Effects використовують switchMap/concatMap.
- **Error Handling (b10t5):** catchError в Effects — critical.
- **SignalStore (b11t3):** Feature-level alternative.
- **State Comparison (b12t4):** When NgRx vs alternatives.

## Examples

### Basic Usage

```typescript
import { createAction, createReducer, on, createSelector, createFeatureSelector, props } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// ✅ Actions
export const loadUsers = createAction('[Users] Load');
export const loadUsersSuccess = createAction('[Users] Load Success', props<{ users: User[] }>());
export const loadUsersFailure = createAction('[Users] Load Failure', props<{ error: string }>());
export const deleteUser = createAction('[Users] Delete', props<{ id: string }>());

// ✅ Entity Adapter
export interface UsersState extends EntityState<User> {
  loading: boolean;
  error: string | null;
}
export const adapter: EntityAdapter<User> = createEntityAdapter<User>();
export const initialState: UsersState = adapter.getInitialState({ loading: false, error: null });

// ✅ Reducer
export const usersReducer = createReducer(
  initialState,
  on(loadUsers, state => ({ ...state, loading: true, error: null })),
  on(loadUsersSuccess, (state, { users }) => adapter.setAll(users, { ...state, loading: false })),
  on(loadUsersFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(deleteUser, (state, { id }) => adapter.removeOne(id, state)),
);

// ✅ Selectors
const selectUsersFeature = createFeatureSelector<UsersState>('users');
const { selectAll, selectEntities } = adapter.getSelectors(selectUsersFeature);
export const selectUsers = selectAll;
export const selectUsersLoading = createSelector(selectUsersFeature, s => s.loading);
export const selectUserById = (id: string) => createSelector(selectEntities, entities => entities[id]);

// ✅ Effects
@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      switchMap(() =>
        this.http.get<User[]>('/api/users').pipe(
          map(users => loadUsersSuccess({ users })),
          catchError(err => of(loadUsersFailure({ error: err.message }))),
        )
      ),
    ),
  );
}
```

### Production Scenario

```typescript
// Full feature with optimistic delete
@Injectable()
export class OrdersEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private http = inject(HttpClient);
  private router = inject(Router);

  // ✅ Load with latest filter from store
  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOrders),
      withLatestFrom(this.store.select(selectOrdersFilter)), // ← read from store
      switchMap(([, filter]) =>
        this.http.get<Order[]>('/api/orders', { params: filter }).pipe(
          map(orders => loadOrdersSuccess({ orders })),
          catchError(err => of(loadOrdersFailure({ error: err.message }))),
        )
      ),
    ),
  );

  // ✅ Optimistic delete
  deleteOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteOrderOptimistic),
      concatMap(({ id, previousState }) =>
        this.http.delete(`/api/orders/${id}`).pipe(
          map(() => deleteOrderSuccess({ id })),
          catchError(err => of(deleteOrderRollback({ previousState, error: err.message }))),
        )
      ),
    ),
  );

  // ✅ Navigation effect (no dispatch)
  navigateAfterCreate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createOrderSuccess),
      tap(({ order }) => this.router.navigate(['/orders', order.id])),
    ),
    { dispatch: false }, // ← navigation side effect, don't dispatch
  );
}
```

### Anti-Example

```typescript
// ❌ WRONG: HTTP in reducer
export const usersReducer = createReducer(
  initialState,
  on(loadUsers, (state) => {
    fetch('/api/users').then(/* ... */); // ❌ Side effect in pure function!
    return { ...state, loading: true };
  }),
);

// ❌ WRONG: catchError outside inner pipe — effect dies on first error
loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),
    switchMap(() => this.http.get('/api/users')),
    map(users => loadUsersSuccess({ users })),
    catchError(err => of(loadUsersFailure({ error: err }))), // ❌ effect dies!
  ),
);

// ✅ CORRECT: catchError inside switchMap
loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),
    switchMap(() =>
      this.http.get<User[]>('/api/users').pipe(      // ← inner pipe
        map(users => loadUsersSuccess({ users })),
        catchError(err => of(loadUsersFailure({ error: err.message }))), // ← inner
      )
    ),
  ),
);

// ❌ WRONG: Reading store directly in effect
loadRelated$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadRelated),
    switchMap(() => {
      const userId = this.store.getValue().user.id; // ❌ anti-pattern
      return this.http.get(`/api/user/${userId}/related`);
    }),
  ),
);

// ✅ CORRECT: withLatestFrom
loadRelated$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadRelated),
    withLatestFrom(this.store.select(selectCurrentUserId)), // ← correct
    switchMap(([, userId]) =>
      this.http.get<Related[]>(`/api/user/${userId}/related`).pipe(
        map(related => loadRelatedSuccess({ related })),
        catchError(err => of(loadRelatedFailure({ error: err.message }))),
      )
    ),
  ),
);
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Side effects у Reducer | Reducer must be pure function | HTTP, logging, navigation → Effects |
| catchError поза inner pipe у Effect | Effect вмирає після першої помилки | catchError ВСЕРЕДИНІ switchMap/concatMap inner pipe |
| switchMap для write operations у Effect | Requests cancelled mid-flight | concatMap для ordered writes, exhaustMap для submit |
| Читання store напряму у Effect | Anti-pattern, breaks unidirectional flow | `withLatestFrom(store.select(selector))` |
| Array state замість EntityAdapter | O(n) lookups, duplicate management | `createEntityAdapter<T>()` для collections |

## Interview Block

### [L1 — Warm-up] Що таке NgRx і Redux pattern?
**Signal being tested:** Базове розуміння Redux unidirectional data flow
**What the interviewer expects:** Store, Action, Reducer, Effect, Selector пояснення, unidirectional flow
**How to probe deeper:** "Чому Reducer має бути pure function?"
**Reference answer:** NgRx реалізує Redux: Store (central state BehaviorSubject), Action (typed event — що сталося), Reducer (pure: (state, action) => newState), Effect (async: action → HTTP → dispatch result), Selector (memoized state projection). Flow: Component dispatch → Reducer/Effect → Store update → Selector emit → Component render. Pure reducer: predictable, testable, time-travel possible.
**Common mistakes:** HTTP у reducer; effect замість reducer для sync update; не знають selectors

### [L2 — Mid] Як правильно написати Effect з error handling?
**Signal being tested:** Розуміння Effect lifecycle і catchError placement
**What the interviewer expects:** catchError inside switchMap, failure action dispatch, concurrency strategy
**How to probe deeper:** "Що трапиться якщо перший HTTP call провалиться без inner catchError?"
**Reference answer:** `createEffect(() => actions$.pipe(ofType(load), switchMap(({ id }) => http.get(url).pipe(map(data => loadSuccess({data})), catchError(err => of(loadFailure({error: err.message}))))))`. Inner catchError — effect виживає. Без inner: перша помилка kills effect назавжди. Concurrency: switchMap (reads), concatMap (writes), exhaustMap (submit). tapResponse utility для structured handling.
**Common mistakes:** catchError поза inner; switchMap для writes; не повертають failure action

### [L3 — Senior] Як Selectors і memoization працюють?
**Signal being tested:** Розуміння memoization механізму і performance implications
**What the interviewer expects:** createSelector === comparison, projector unit tests, parametrized selectors pattern, immutability requirement
**How to probe deeper:** "Чому mutable state update ламає selector memoization?"
**Reference answer:** createSelector зберігає останні inputs і result. `===` check при кожному emission. Якщо inputs однакові → cached result без projector. Immutable updates mandatory: `state.items.push(item)` → same reference → selector won't recompute. Parametrized: factory function у component, same instance re-used. Projector unit tests: `selector.projector(mockS1, mockS2)` — no Redux setup.
**Common mistakes:** Мутують state; new selector instance в template на кожен render; не знають projector tests

### [L4 — Staff/Principal] Як тестувати NgRx Store, Effects, Selectors?
**Signal being tested:** Системне мислення — testing pyramid, marble tests, MockStore, isolation
**What the interviewer expects:** Reducer (pure function), selector projector, Effect marble tests з provideMockActions, MockStore для components
**How to probe deeper:** "Як тестувати Effect що робить optimistic update і rollback?"
**Reference answer:** Reducer: `expect(reducer(state, action)).toEqual(newState)`. Selector: `selector.projector(state) → value`. Effect: `provideMockActions(actions$ = hot('-a', {a: loadAction}))` + `effects.load$ → expectObservable(toBe('-b', {b: successAction}))`. Component: MockStore + `store.overrideSelector(selector, value)` + verify `store.dispatch` called. Optimistic test: cold(-a) succeed, cold(-#) error → verify rollback action dispatched.
**Common mistakes:** Тестують тільки success paths; MockStore без overrideSelector; marble tests відсутні

## Summary

### Key Points
- NgRx = Redux: Store (BehaviorSubject state), Actions (typed events), Reducers (pure state transforms), Effects (async), Selectors (memoized projections)
- Unidirectional: Component dispatch → Effect/Reducer → Store → Selector → Component
- Effect catchError ВСЕРЕДИНІ inner pipe — effect survives errors
- Selectors: memoized — perераховується тільки якщо inputs changed (===)
- EntityAdapter — normalized CRUD: O(1) lookups, deduplication
- Use NgRx when: global state, audit trail, devtools, team > 5, complex cross-feature state
- Testing: Reducer (pure), Selector (projector), Effect (marble + provideMockActions), Component (MockStore)

### Elevator Pitch (2 minutes)
"NgRx реалізує Redux pattern в Angular: централізований Store (BehaviorSubject), typed Actions (events що сталося), pure Reducers (state transforms без side effects), memoized Selectors (efficient derived state), Observable Effects (async operations). Ключові best practices: catchError INSIDE inner pipe in effects (effect survives), EntityAdapter для normalized collections, createSelector з memoization. Тестування: reducers як pure functions, selector projectors без Redux setup, effects з marble tests + provideMockActions. Justify NgRx when: global state, audit trail needed, team > 5. Для feature state: NgRx SignalStore simpler."
