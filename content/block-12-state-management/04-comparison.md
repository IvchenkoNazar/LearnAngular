---
title: "State Management Comparison: Choosing the Right Approach"
block: 12
topic: 4
slug: "state-management-comparison"
difficulty: 4
sinceVersion: "2"
tags: ["state-management", "ngrx", "signals", "BehaviorSubject", "architecture", "decision-framework", "scalability"]
relatedTopics: ["service-behaviorsubject-pattern", "ngrx-store", "ngrx-lightweight-stores", "signals-intro", "signal-store-ngrx"]
interviewQuestions:
  - level: "junior"
    question: "What are the main options for state management in Angular?"
    referenceAnswers:
      junior: "Angular has several options: a simple service with BehaviorSubject for component sharing, NgRx Store for large apps with complex state, and NgRx ComponentStore or SignalStore for local/feature state. Signals can also be used for simple reactive state in modern Angular."
      mid: "The main approaches are: (1) Service + BehaviorSubject — simple, no deps, works for small/medium apps; (2) NgRx Store — full Redux pattern, best for large teams and complex global state; (3) NgRx ComponentStore/SignalStore — feature-scoped, less boilerplate than global NgRx; (4) Signal-based services — modern, simple, no RxJS needed for basic cases. The right choice depends on team size, app complexity, and whether global state is needed."
      senior: "State management choice should be driven by state scope (local vs global), team size, and complexity of state transitions. Service+BehaviorSubject covers 80% of real-world cases but lacks tooling and enforced patterns. NgRx Store adds Redux discipline — actions, reducers, effects — giving you time-travel debugging, strict unidirectional flow, and great team scalability. NgRx SignalStore bridges both: structured, composable, but signal-based and without boilerplate of global NgRx. Signal services (just signal() + computed()) are great for isolated feature state without infrastructure overhead. The wrong choice is usually picking NgRx for everything or never picking it when the app scales."
      staff: "From an architectural standpoint, state management is a cross-cutting concern that affects team velocity, debugging experience, testing strategy, and onboarding cost. I evaluate along three axes: (1) State scope — global (authentication, user profile, feature flags) warrants NgRx Store; feature-scoped (wizard steps, table filters) warrants SignalStore or ComponentStore; component-local warrants signals or RxJS; (2) Team and consistency — large teams benefit from enforced NgRx conventions (reducers are pure functions, effects are isolated) which reduce per-developer decisions; small teams can move faster with services; (3) Operational needs — time-travel debugging, redux devtools, serializable state for error reporting all favor NgRx. The anti-pattern is mixing approaches without a documented team decision: you end up with NgRx effects calling service BehaviorSubjects calling component signals, which is an unmaintainable mess. I advocate for a documented ADR (Architecture Decision Record) that defines clear state layers with explicit escalation criteria."
    commonMistakes:
      - "Defaulting to NgRx for all projects regardless of complexity — adds 5-10x boilerplate for apps that don't need it"
      - "Calling BehaviorSubject+service 'unscalable' without knowing where the actual scaling problems start"
      - "Ignoring signals as a state management option — in Angular 17+ they're first-class and handle many use cases"
    relatedQuestions: ["b12t4q2", "b12t4q3"]

  - level: "mid"
    question: "When would you choose NgRx Store over a simple service with signals or BehaviorSubject?"
    referenceAnswers:
      junior: "NgRx is better for large apps with lots of shared state, where you need Redux DevTools for debugging. Simple services work fine for small apps."
      mid: "NgRx Store makes sense when: (1) multiple unrelated parts of the UI react to the same state changes; (2) state transitions are complex and need to be auditable (actions as events); (3) the team is large and you need enforced conventions; (4) you need time-travel debugging or server-side state rehydration; (5) you have many async side effects (HTTP, WebSocket) that need centralized management. For a simple user settings page or a single feature's filters, SignalStore or a signal service is far less overhead."
      senior: "NgRx Store introduces the full Redux pattern: immutable state tree, actions as serializable events, pure reducers, side-effect isolation in effects. The benefits are real but costly — for NgRx to pay off you need: (1) global state shared across multiple lazy-loaded feature modules; (2) complex state machines where tracking transitions matters (actions are a log); (3) team size > 4-5 where consistency discipline is more valuable than flexibility; (4) needs like state hydration, time-travel debugging, or integration with Redux DevTools for production monitoring. The tipping point is usually when you find yourself passing BehaviorSubject references across module boundaries or when debugging a state bug requires mentally tracing multiple services. At that point, NgRx's explicitness is a win."
      staff: "I frame the NgRx decision around organizational complexity, not app complexity. NgRx's real value is codifying team conventions into type-safe infrastructure: every state change is an explicit action, every side effect is in an isolated effect class, every selector is memoized. This reduces cognitive load per developer — they don't need to understand the whole app, just the relevant slice. I adopt NgRx when: (1) the team has > 3-4 engineers sharing ownership of state; (2) the app has global invariants that must be enforced (e.g., 'only one websocket connection'); (3) we need audit trails for debugging production issues (action log); (4) we have significant backend-driven state with complex loading/error states. For greenfield projects I often start with SignalStore at feature boundaries and only introduce NgRx Store when we hit genuine cross-feature state coordination problems."
    commonMistakes:
      - "Thinking NgRx is always enterprise-grade and services are always toy-level — it's about fit, not prestige"
      - "Not considering NgRx SignalStore as a middle ground — it provides structure without global Redux overhead"
      - "Conflating 'NgRx effects are complex' with 'the whole pattern is complex' — effects are one part, not the whole"
    relatedQuestions: ["b12t4q1", "b12t4q3", "b12t4q4"]

  - level: "senior"
    question: "How do you decide the scope of state — local, feature, or global — and which tool fits each scope?"
    referenceAnswers:
      junior: "Local state stays in a component with signals or @Input. Shared state goes in a service. Global state like auth uses NgRx."
      mid: "State scope determines the tool: local component state (form step, toggle, animation flag) — signals or simple component properties; feature state (filters, pagination, selected item in a table) — SignalStore provided at route level; global state (user session, notifications, cart) — NgRx Store or a root-level service. The key question is: 'Who needs to read this state and when?'"
      senior: "State scope is determined by asking: (1) What is the state's lifetime? Component lifetime → component state. Route lifetime → route-scoped store. Session lifetime → global store. (2) Who reads it? One component → local. One feature → feature store. Multiple features → global store. (3) How does it change? Simple toggles → signals. Complex transitions with side effects → effects or rxMethod. A common mistake is 'globalizing' state prematurely — putting things in NgRx that are only ever used in one feature adds boilerplate and makes the feature harder to extract. I use a rule: state starts local, gets promoted to feature when shared within a route, and promoted to global only when needed outside that route tree. NgRx SignalStore provided at route level is ideal for feature scope — it lives exactly as long as the route, gets garbage-collected on navigation, and has no boilerplate overhead."
      staff: "State scope is an architectural decision with long-term maintenance implications. I define three layers: (1) Ephemeral state — UI transients (is dropdown open, form validation state, hover) — never leave component level, never serialize; (2) Session state — business domain state that lives for a user session (current user, permissions, app-wide configuration) — NgRx Store or root-scoped signal service with persistent projection to localStorage; (3) Navigation state — state tied to a specific route tree (search results, wizard progress, selected filters) — route-scoped SignalStore or ComponentStore, destroyed on navigation away, potentially rehydrated from URL params. The failure mode I see most is treating navigation state as session state — it ends up in NgRx where it pollutes the global store, causes stale-state bugs on navigation, and makes deep-linking impossible. The architectural principle: URL is the source of truth for navigation state, NgRx is the source of truth for session state, component is the source of truth for ephemeral state."
    commonMistakes:
      - "Putting all state in NgRx because 'it might be needed globally later' — YAGNI applies to state management"
      - "Route-scoping a store but forgetting to add it to the route's providers array — it silently becomes root-scoped"
      - "Using @Input for state that should be in a store — causes prop drilling and tight coupling"
    relatedQuestions: ["b12t4q2", "b12t4q4"]

  - level: "senior"
    question: "What are the concrete trade-offs between NgRx SignalStore and NgRx Store (full Redux) for a medium-sized app?"
    referenceAnswers:
      junior: "SignalStore is simpler and uses Angular signals. NgRx Store is more powerful but has more boilerplate."
      mid: "SignalStore: signal-based state with withState/withComputed/withMethods, less boilerplate, no actions/reducers/effects ceremony, composable via features. NgRx Store: full Redux — actions log, time-travel debugging, strict unidirectional flow, more structure. For medium apps, SignalStore is often enough unless you need Redux DevTools or strict action-based audit trail."
      senior: "NgRx SignalStore trade-offs: Pro — no action/reducer boilerplate, state is signals so template reactivity is fine-grained, composable via store features (withEntities, withCallState), can use rxMethod for observable bridges, tree-shakeable. Con — no Redux DevTools integration (no action log, no time-travel), state mutations can be done directly via patchState which is less traceable, no built-in serialization story for hydration. NgRx Store trade-offs: Pro — full Redux devtools, serializable actions as an event log, strict immutability enforced by architecture, proven at scale, excellent testing story (reducers are pure functions). Con — significant boilerplate (createAction, createReducer, createEffect, createSelector for every slice), slower to iterate, higher onboarding cost. For medium apps (1-3 feature modules, 3-5 engineers) I'd default to SignalStore and add NgRx Store only for features requiring audit trails or cross-cutting state."
      staff: "At the architectural level, the choice is really about the invariants you need the system to enforce. NgRx Store enforces: (1) all state changes happen through reducers (immutability discipline); (2) all async effects are isolated (effects are testable units); (3) all state reads are through selectors (single source of truth, memoization). These invariants have real value at scale but exact a boilerplate tax on every feature. NgRx SignalStore enforces less — patchState can be called from anywhere within methods, rxMethod is a convention not a constraint, there's no global action log. This is fine for most medium apps because Angular's component/service architecture already provides structural constraints. I use SignalStore as the default and introduce NgRx Store as a deliberate architectural escalation for features that need: (a) compliance/audit requirements (serializable event log), (b) state hydration from server or localStorage, (c) complex optimistic updates with rollback, (d) cross-team feature isolation where NgRx's type boundaries act as API contracts between teams."
    commonMistakes:
      - "Thinking SignalStore is just 'NgRx Store Lite' — they have different design philosophies (signal reactivity vs Redux pattern)"
      - "Forgetting that NgRx Store's action log has real operational value — it's not just for debugging"
      - "Mixing NgRx Store and SignalStore state in the same feature without a clear boundary"
    relatedQuestions: ["b12t4q2", "b12t4q3", "b12t4q5"]

  - level: "staff"
    question: "How would you design a state management migration strategy for a large Angular app currently using Service+BehaviorSubject everywhere, wanting to modernize incrementally?"
    referenceAnswers:
      junior: "I'd gradually replace BehaviorSubject with signals in services, and add NgRx where state gets complex."
      mid: "Migration should be incremental: (1) identify which state is truly global vs feature-scoped; (2) convert feature services to SignalStore first (lower risk, local impact); (3) convert global services to either signal-based root services or NgRx Store; (4) use toSignal/toObservable for bridging during transition. Don't migrate everything at once — prioritize high-traffic, buggy areas first."
      senior: "An incremental migration strategy: Phase 1 — audit all services, categorize state by scope and complexity, identify state bugs (race conditions, stale state). Phase 2 — convert leaf services (used by one feature, no dependents) to SignalStore first — this validates the pattern with low risk. Phase 3 — convert global services: simple ones to signal-based root services, complex ones (cart, auth with refresh tokens) to NgRx Store. Phase 4 — remove BehaviorSubject anti-patterns (services with separate data$ and loading$ streams that need combining) by using withCallState pattern or simple signal objects. Key insight: you can bridge old and new code with toSignal/toObservable during migration so you don't need to migrate all consumers at once."
      staff: "A large-scale migration is a team coordination problem as much as a technical one. My approach: (1) Define the target architecture as an ADR before touching code — establish which state belongs where (ephemeral/feature/global), which tools map to each layer (signals/SignalStore/NgRx), and migration priority criteria. This prevents engineers migrating the same service in different directions. (2) Create a base SignalStore feature for cross-cutting concerns (loading state, error handling) so all new stores share the same patterns — reduces divergence. (3) Establish a 'strangler fig' pattern: new features always use the target architecture (SignalStore or NgRx), old features migrate on a schedule tied to business value (migrating a high-traffic, buggy service has higher ROI than a rarely-touched stable one). (4) Track migration progress as a tech debt metric — a percentage on the engineering dashboard keeps it visible without blocking product work. (5) For the bridge period, document which services are 'legacy' (BehaviorSubject) vs 'migrated' (signals/stores) clearly in code — a JSDoc @deprecated comment on the class and a migration issue linked in code prevents re-entrenchment. (6) Run both old and new implementations in parallel for critical state (auth) — shadow-mode testing catches behavioral regressions before you cut over."
    commonMistakes:
      - "Big-bang migration — rewriting all services at once causing a 3-month freeze with high regression risk"
      - "Not establishing team conventions before migrating — ends up with 5 different signal service patterns in the codebase"
      - "Forgetting to update tests during migration — BehaviorSubject tests don't directly port to signal tests"
    relatedQuestions: ["b12t4q3", "b12t4q4"]
---

## Core Concept

**English definition:** A state management decision framework for Angular applications — evaluating Service+BehaviorSubject, Signal-based services, NgRx SignalStore, and NgRx Store across dimensions of scope, complexity, team size, and operational requirements to select the appropriate tool for each context.

**Пояснення:** Управління станом — це одна з тих тем, де немає єдино правильної відповіді. Кожен підхід має свої trade-offs, і вибір залежить від конкретного контексту: масштаб команди, складність бізнес-логіки, вимоги до тестування та debugging. Senior-розробник повинен вміти аргументовано пояснити *чому* вибирає той чи інший підхід, а не просто казати "NgRx — це enterprise, services — це просто".

**Яку проблему вирішує:** Відсутність чітких критеріїв вибору призводить до двох крайнощів: over-engineering (NgRx для TODO-додатку) або under-engineering (service spaghetti у великому enterprise додатку). Правильний вибір інструменту на потрібному рівні зменшує boilerplate, покращує читабельність і масштабованість.

**Як працює під капотом:** Різні підходи реалізують різні патерни управління станом:
- **Service+BehaviorSubject** — observable state з push-based notification через RxJS Subject
- **Signal service** — reactive primitive з pull/push hybrid, lazy computation через computed(), fine-grained change detection
- **NgRx SignalStore** — composition-based store з signal-backed state, інтегрований з Angular CD через signal reactivity
- **NgRx Store** — Redux pattern: centralized immutable state tree, pure reducer functions, serializable action log, selector memoization через Reselect-like algorithm

**Trade-offs та обмеження:**

| Підхід | Pros | Cons | Optimal для |
|--------|------|------|------------|
| Signal service | Zero deps, simple, signal-native | No tooling, no audit trail, no conventions | Local/feature state, small teams |
| Service+BehaviorSubject | Familiar, RxJS composability | Manual subscriptions, no structure | Legacy codebases, migration target |
| NgRx SignalStore | Structured, composable, signal-based, no Redux boilerplate | No Redux DevTools, mutable via patchState | Feature state, medium apps |
| NgRx Store | Redux devtools, immutability enforced, action log, proven scale | High boilerplate, steep learning curve | Global state, large teams, audit needs |

**Версійність:** Service+BehaviorSubject — стабільний підхід з Angular 2+. NgRx Store — стабільний з NgRx v7+. NgRx SignalStore — стабільний з NgRx v17 (Angular v17). Signal-based services — стабільні з Angular v17 (signals v16 developer preview, v17 stable).

---

## Deep Details

### Edge Cases

**Leaking state across route navigations:** Feature stores provided at route level (`Route.providers`) are correctly destroyed on navigation away. But if you accidentally provide a SignalStore at root level (e.g., by including it in `bootstrapApplication` providers), it becomes a singleton that persists state across navigations — causing "stale filter" bugs.

```typescript
// BUG: Root-provided store persists state across routes
bootstrapApplication(AppComponent, {
  providers: [ProductListStore] // ProductListStore state lives forever
});

// CORRECT: Route-scoped store destroyed on navigation
{
  path: 'products',
  component: ProductListComponent,
  providers: [ProductListStore] // destroyed when leaving /products
}
```

**NgRx Store and non-serializable state:** Redux DevTools require serializable state. Putting `Date` objects, `Map`, `Set`, or class instances in the NgRx state tree breaks devtools and hydration. NgRx provides `@ngrx/store/meta-reducers` serialization check in development:

```typescript
// ngrx.config.ts
export const ngrxConfig: EnvironmentProviders = provideStore(reducers, {
  metaReducers: isDevMode() ? [checkActionSerializability] : []
});
```

**BehaviorSubject memory leaks in long-lived services:** Root-scoped services holding BehaviorSubjects never garbage-collect their subscriptions unless explicitly completed. Components subscribing via `subscribe()` instead of `async pipe` or `takeUntilDestroyed()` accumulate subscriptions.

**Signal computed() circular dependencies:** A computed signal that reads itself (directly or through a chain) throws a `NG0600: Detected cycle in computations` error at runtime. NgRx SignalStore's `withComputed` has the same constraint.

### Junior vs Senior Understanding

**Junior** knows *which API to call* for each approach — `new BehaviorSubject()`, `createAction()`, `signalStore()`.

**Senior** knows *when each approach creates technical debt*: a service with 10 BehaviorSubjects that need to be combined with `combineLatest` is a signal that state should be modeled as a single object (a sign to use SignalStore or NgRx). NgRx Store in a 2-person startup is a sign of over-architecture. Feature state in NgRx's global store is a sign of scope inflation.

**Senior understands the actual runtime differences:**
- BehaviorSubject notifications are synchronous by default — subscribers receive values immediately on `.next()`. This can cause ordering bugs in test code.
- Signal updates are batched — Angular's scheduler flushes signal effects asynchronously (microtask). This means `effect(() => console.log(state()))` runs after the current synchronous execution, not immediately.
- NgRx Store's `select()` returns an Observable that only emits when the selected value changes (reference equality by default) — this is the memoization behavior of `createSelector`.

**Senior knows the escape hatches:**
- NgRx Store with `withLatestFrom` in effects for non-reactive state reads (avoid subscribing to the store inside effects)
- SignalStore with `rxMethod` for bridging to existing Observable-based code
- `toSignal()` with `{ requireSync: true }` for synchronous initial values from BehaviorSubjects

### Deprecation & Migration Path

**Class-based NgRx effects** (`@Effect()` decorator) were deprecated in NgRx v11, removed in v17. Migration: use `createEffect()` factory.

**NgRx ComponentStore** remains supported but NgRx SignalStore is the recommended modern replacement. ComponentStore will not be deprecated soon (it has a large install base), but new code should prefer SignalStore.

**BehaviorSubject as state** is not deprecated but is considered legacy in Angular 17+ codebases. Migration path:
1. Convert `BehaviorSubject<State>` to `signal<State>()`
2. Convert `.asObservable()` usages to `toObservable(stateSignal)`
3. Convert `combineLatest` derivations to `computed()`
4. Convert `tap()` side effects in streams to `effect()`

### Connections to Other Concepts

- **RxJS interop**: All four approaches can bridge to Observable land via `toObservable()`, `toSignal()`, or `rxMethod` in SignalStore.
- **Change Detection**: Signal-based approaches (signals, SignalStore) enable fine-grained CD and are required for Zoneless Angular. NgRx Store with `OnPush` achieves similar results via Observable immutability.
- **Testing**: NgRx Store reducers are pure functions — easiest to unit test. Effects require `TestBed` and mock Actions. SignalStore methods can be tested with `TestBed.inject(MyStore)`. BehaviorSubject services are straightforward to test with synchronous values.
- **DevTools**: NgRx Store integrates with Redux DevTools for time-travel debugging. Angular DevTools shows signal dependency graphs. No comparable tooling exists for raw BehaviorSubject services.

---

## Examples

### Basic Usage

```typescript
// 1. Signal Service (simplest — for small feature state)
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<'light' | 'dark'>('light');

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  toggle(): void {
    this._theme.update(t => t === 'light' ? 'dark' : 'light');
  }
}

// 2. NgRx SignalStore (for feature state with methods)
const ProductStore = signalStore(
  withState<ProductState>({ products: [], loading: false, error: null }),
  withComputed(({ products }) => ({
    productCount: computed(() => products().length),
    hasProducts: computed(() => products().length > 0),
  })),
  withMethods((store, api = inject(ProductApiService)) => ({
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() => api.getProducts().pipe(
          tapResponse({
            next: products => patchState(store, { products, loading: false }),
            error: (error: Error) => patchState(store, { error: error.message, loading: false }),
          })
        ))
      )
    ),
  }))
);

// 3. NgRx Store (for global state with audit needs)
// actions
const loadUser = createAction('[Auth] Load User');
const loadUserSuccess = createAction('[Auth] Load User Success', props<{ user: User }>());
const loadUserFailure = createAction('[Auth] Load User Failure', props<{ error: string }>());

// reducer
const authReducer = createReducer(
  { user: null, loading: false, error: null } as AuthState,
  on(loadUser, state => ({ ...state, loading: true })),
  on(loadUserSuccess, (state, { user }) => ({ ...state, user, loading: false })),
  on(loadUserFailure, (state, { error }) => ({ ...state, error, loading: false }))
);
```

### Production Scenario

```typescript
// Decision framework applied to an e-commerce app:
//
// Cart state: global (shared between header badge, checkout, product pages)
//   → NgRx Store (also needs server-side hydration and persistence)
//
// Product list filters: feature state (lives only on /products route)
//   → NgRx SignalStore provided at route level
//
// User preferences (theme, language): session state
//   → Signal service at root level with localStorage persistence
//
// Form wizard steps: component-local
//   → Component signals

// Global cart: NgRx Store
export const cartFeature = createFeature({
  name: 'cart',
  reducer: createReducer(
    initialCartState,
    on(CartActions.addItem, (state, { item }) => ({
      ...state,
      items: [...state.items, item]
    })),
    on(CartActions.removeItem, (state, { itemId }) => ({
      ...state,
      items: state.items.filter(i => i.id !== itemId)
    }))
  )
});

// Feature product filters: SignalStore at route level
export const ProductFiltersStore = signalStore(
  withState<FiltersState>({
    category: null,
    priceRange: [0, 1000],
    inStockOnly: false,
  }),
  withComputed(({ category, priceRange, inStockOnly }) => ({
    hasActiveFilters: computed(() =>
      category() !== null || inStockOnly() || priceRange()[0] > 0
    ),
    queryParams: computed(() => ({
      category: category(),
      minPrice: priceRange()[0],
      maxPrice: priceRange()[1],
      inStock: inStockOnly() || undefined,
    })),
  })),
  withMethods(store => ({
    resetFilters: () => patchState(store, { category: null, priceRange: [0, 1000], inStockOnly: false }),
    setCategory: (category: string | null) => patchState(store, { category }),
  }))
);

// Route config — ProductFiltersStore scoped to this route
export const productRoutes: Routes = [
  {
    path: 'products',
    component: ProductListComponent,
    providers: [ProductFiltersStore], // destroyed on navigation away
  }
];

// Root signal service for preferences
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly _lang = signal(localStorage.getItem('lang') ?? 'en');
  readonly lang = this._lang.asReadonly();

  setLang(lang: string): void {
    this._lang.set(lang);
    localStorage.setItem('lang', lang);
  }
}
```

### Anti-Example

```typescript
// WRONG: All state in NgRx regardless of scope
// This puts form wizard progress in global NgRx state
export const wizardActions = {
  nextStep: createAction('[Wizard] Next Step'),
  prevStep: createAction('[Wizard] Prev Step'),
  setField: createAction('[Wizard] Set Field', props<{ field: string; value: unknown }>()),
};

// Problems:
// 1. Wizard state is ephemeral — it should die when the user navigates away
// 2. If user opens two tabs, the global wizard state bleeds between them
// 3. You need actions for every field change — extreme boilerplate
// 4. State persists in devtools indefinitely — pollutes the store

// CORRECT: Wizard state as component signals or route-scoped SignalStore
export const WizardStore = signalStore(
  withState({ step: 1, fields: {} as Record<string, unknown> }),
  withMethods(store => ({
    nextStep: () => patchState(store, s => ({ step: s.step + 1 })),
    prevStep: () => patchState(store, s => ({ step: Math.max(1, s.step - 1) })),
    setField: (field: string, value: unknown) =>
      patchState(store, s => ({ fields: { ...s.fields, [field]: value } })),
  }))
);
// Provide in the wizard route — auto-destroyed on navigation
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Global NgRx state for local/ephemeral concerns (form steps, UI toggles, route-specific filters) | Pollutes global store, state persists after navigation, requires actions for trivial updates | Use component signals for ephemeral, SignalStore at route level for feature scope |
| Service+BehaviorSubject spaghetti (10+ streams combined with combineLatest) | Unreadable, race-condition-prone, implicit ordering dependencies | Migrate to a SignalStore where state is a typed object with explicit patchState |
| Mixing signal services and NgRx Store for the same domain | Dual sources of truth, synchronization bugs, unclear ownership | Pick one approach per domain; use bridging only during migration with explicit deprecation markers |
| NgRx effects that read from the store with `Store.select()` inside effect logic | Creates timing issues — select() is async, effect runs on emission — can see stale state | Use `withLatestFrom(store.select(...))` to combine action stream with current state synchronously |
| Storing non-serializable values in NgRx Store (Date, Map, Set, class instances) | Breaks Redux DevTools, prevents state hydration, fails NgRx's serialization meta-reducer | Store plain JSON-serializable primitives and arrays; convert Date to ISO string at reducer boundaries |

---

## Interview Block

### [L1 — Warm-up] What are the main state management options in Angular and when would you use each?

**Signal being tested:** Whether the candidate knows the landscape and can map tools to use cases, not just name-drop NgRx.

**What the interviewer expects:** Candidate should mention at least 3 approaches (service, NgRx, signals), give a concrete scenario for each, and show awareness that the choice depends on context.

**How to probe deeper:** "If I have a product list page with filters — which approach would you use and why?"

**Reference answer:** Angular offers several options: signal-based services for simple shared state, NgRx SignalStore for structured feature state at route scope, and NgRx Store for complex global state requiring an audit trail. The right choice depends on state scope (local/feature/global), team size, and whether you need Redux DevTools or state serialization. A signal service is perfect for theme preferences; NgRx Store makes sense for a multi-team checkout flow with complex side effects.

**Common mistakes:** Automatically recommending NgRx for everything; not knowing NgRx SignalStore exists; treating "signals" and "NgRx" as mutually exclusive.

---

### [L2 — Mid] What is the difference between route-scoped and root-scoped providers for a SignalStore?

**Signal being tested:** Understanding of Angular's DI hierarchy and how provider scope maps to component/route lifetime.

**What the interviewer expects:** Candidate explains that root-scoped means singleton (persists for app lifetime), route-scoped means the store is instantiated when the route activates and destroyed when it deactivates.

**How to probe deeper:** "What happens to route-scoped state if the user opens a product list, navigates away, and returns? Is the state reset?"

**Reference answer:** When a SignalStore is listed in `bootstrapApplication` providers or a lazy module's `providers`, it becomes a root singleton. When provided in `Route.providers`, Angular creates an instance tied to that route's environment injector. When the user navigates away from that route, Angular destroys the environment injector and the store's state is garbage-collected. On return, a fresh instance is created. This is ideal for feature state like search filters — you want a clean slate on re-entry, not the user's previous filter selections. If you need to preserve state across navigations, you'd either serialize to URL params or promote to a root service.

**Common mistakes:** Thinking all services/stores provided in a component's `providers` array are route-scoped (they're component-scoped, different thing); forgetting that route-scoped stores need to be listed in the route's `providers`, not the component's.

---

### [L3 — Senior] What are the key trade-offs between NgRx SignalStore and NgRx Store for a medium-scale app, and how do you decide?

**Signal being tested:** Ability to reason about architectural trade-offs, not just recite API differences — showing they've felt the pain of both over- and under-engineering.

**What the interviewer expects:** Concrete trade-offs on both sides (not "SignalStore is simpler, NgRx is better for big apps"), a decision criteria framework, and ideally a personal experience or war story.

**How to probe deeper:** "If your team has used NgRx Store for 2 years and is considering migrating to SignalStore — how would you approach that decision?"

**Reference answer:** NgRx Store's key advantages are the serializable action log (invaluable for debugging production issues), strict immutability enforced by architecture, and Redux DevTools integration. The cost is boilerplate — createAction, createReducer, createEffect, createSelector per feature. NgRx SignalStore eliminates that boilerplate while adding structure over raw signal services — withState, withComputed, withMethods give you organized code without Redux ceremony. The key missing piece in SignalStore is the action log: patchState is just a function call, not a serializable event. I'd choose SignalStore for: most features where state transitions don't need audit trails; route-scoped feature stores; apps where the team finds Redux overhead counterproductive. I'd keep NgRx Store for: authentication state (complex side effects, security audit trail), checkout flows (financial state needs to be auditable), or any state that needs to be serialized to the server for SSR rehydration.

**Common mistakes:** Not knowing SignalStore exists or treating it as "NgRx but simpler" without understanding the Redux vs signal-native design difference; not mentioning the action log as NgRx Store's unique value.

---

### [L4 — Staff/Principal] How would you design a state management architecture for a large app being developed by 3 cross-functional teams, each owning different feature areas?

**Signal being tested:** System-level architectural thinking — team boundaries, consistency conventions, avoiding divergence, and the organizational dimension of technical decisions.

**What the interviewer expects:** Goes beyond "pick a tool" — addresses team coordination, ADR process, state layer definitions, escalation criteria, and how the architecture prevents cross-team contamination of state.

**How to probe deeper:** "One team wants to use NgRx Store for everything, another wants only signal services. How do you resolve that?"

**Reference answer:** For multi-team apps, state management is a team coordination problem, not just a technical one. I'd structure it as three explicit layers with documented ownership rules: (1) Global state (session, permissions, feature flags) — NgRx Store, owned by a platform team, accessed by feature teams via selectors only — no feature team mutates global state directly; (2) Feature state (route-specific filters, pagination, selected items) — NgRx SignalStore provided at route level, owned by the feature team, isolated behind the route boundary — other teams cannot access it; (3) Local state (form steps, UI toggles) — component signals, fully local. The team conflict you mention is resolved by the layer model: global state uses NgRx Store (non-negotiable for cross-team state), feature state uses SignalStore (non-negotiable for isolation), local state is team choice. This ADR gets documented, reviewed by all teams, and enforced via ESLint rules (e.g., a custom rule that prevents importing another team's SignalStore outside its route boundary). I'd also introduce a shared store features library (withCallState, withPagination) so teams share patterns without duplicating code, which naturally converges implementations.

**Common mistakes:** Focusing only on the technical choice without addressing team coordination or ADR process; proposing a solution that requires all teams to agree on every state decision (creates bottleneck); not considering how ESLint or TypeScript module boundaries can enforce architectural rules.

---

## Summary

### Key Points

- State management choice is context-dependent: state scope (local/feature/global), team size, and operational needs (audit trail, DevTools, hydration) drive the decision.
- Signal services are the right default for simple shared state — zero deps, signal-native, no boilerplate.
- NgRx SignalStore is the modern choice for structured feature state — composable, route-scopeable, signal-based, without Redux ceremony.
- NgRx Store remains the right choice when you need a serializable action log, strict Redux immutability, Redux DevTools, or cross-team state boundaries with strong conventions.
- State scope matters as much as tool choice: feature state belongs at route level (destroyed on navigation), global state at root level (session lifetime), ephemeral state in components.
- The worst anti-pattern is premature globalization — putting feature state in NgRx Store "because we might need it globally" creates stale-state bugs and pollutes the store.
- Large-team migrations require an ADR, layer definitions, and optionally ESLint enforcement — not just a technical rewrite.

### Elevator Pitch (2 minutes)

"Angular gives you a spectrum of state management tools, and the senior skill is matching tool to context. For local state — signals in the component. For simple shared state — a signal service. For structured feature state that lives for one route's lifetime — NgRx SignalStore provided in the route's providers. For global state that multiple features share, or when you need a serializable audit trail of state changes — NgRx Store. The mistake I see most is either reaching for NgRx for everything (over-engineering) or never reaching for it when the app grows past 5 features (under-engineering). The decision criteria I use: Who reads this state? — if the answer is 'just this route,' don't globalize it. Do I need an audit trail? — if yes, NgRx Store's action log is irreplaceable. How big is the team? — larger teams benefit more from NgRx's enforced conventions. And in modern Angular 17+, NgRx SignalStore often hits the sweet spot: enough structure to avoid service spaghetti, not so much that you're writing 5 files per feature."
