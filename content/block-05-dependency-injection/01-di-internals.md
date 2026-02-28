---
title: "DI Internals: Injector Hierarchy and Resolution"
block: 5
topic: 1
slug: "di-internals"
difficulty: 4
sinceVersion: "2"
tags: ["dependency-injection", "injector", "EnvironmentInjector", "NodeInjector", "DI-hierarchy", "Ivy"]
relatedTopics: ["provider-types", "injection-tokens", "inject-function", "resolution-modifiers", "bootstrapping"]
interviewQuestions:
  - id: "b5t1q1"
    level: "junior"
    question: "Що таке Dependency Injection в Angular і навіщо він потрібен?"
    referenceAnswers:
      junior: "DI — це патерн де Angular сам створює і надає залежності (сервіси) компонентам замість того щоб компоненти самі їх створювали. Це зменшує coupling між компонентами."
      mid: "Angular DI — це Inversion of Control container що управляє lifecycle сервісів і resolves їх залежності. Переваги: loose coupling (компонент не знає як створити сервіс), testability (можна підміняти сервіси в тестах), singleton management (один instance на весь app або scope). Angular injector читає token, знаходить provider, інстанціює і кешує сервіс."
      senior: "Angular DI — ієрархічна система injectors. Кожен injector має parent і власний registry (Map<token, value>). Resolution: починається від поточного injector, якщо token не знайдено — іде до parent. Дерево injectors: Platform → Environment (root, module injectors) → Node (element injectors для компонентів/директив). Compiler перетворює @Injectable metadata в `ɵprov` property (provider definition). При inject(Token): Angular traverses injector chain до знаходження provider або NullInjector (throws). Сервіс з providedIn: 'root' реєструється в root EnvironmentInjector — один instance на app."
      staff: "DI в Ivy — фундаментально інший від ViewEngine. В Ivy: кожен injector — це R3Injector (EnvironmentInjector) або NodeInjector. NodeInjector — не окремий об'єкт, а bloom filter + data structure вбудована в TView/LView. При token lookup: NodeInjector traverses element tree через bloom filter для O(1) negative checks (якщо token не в поточному blooms — skip to parent). BloomFilter — 256-bit filter де кожен token hash відображається. False positive rate ~2% — якщо bloom каже "maybe" — тоді linear search по providers. Це значно швидше ніж linear search для кожного lookup. Environment injector (root, module, route) — стандартний Map-based registry. Ланцюг: NodeInjector(component) → NodeInjector(parent component) → ... → EnvironmentInjector(route) → EnvironmentInjector(root) → NullInjector."
    commonMistakes:
      - "Думають що DI — просто singleton pattern, не розуміючи ієрархію injectors"
      - "Не знають різницю між EnvironmentInjector і NodeInjector"
    relatedQuestions: ["b5t1q2", "b5t1q3"]
  - id: "b5t1q2"
    level: "mid"
    question: "Яка різниця між EnvironmentInjector і NodeInjector в Angular Ivy?"
    referenceAnswers:
      junior: "В Angular є root injector для сервісів і component injector для компонентів."
      mid: "EnvironmentInjector — injector для environment-level tokens (сервіси, app config). Існує для root, feature modules, lazy-loaded routes. NodeInjector — injector на рівні DOM node, пов'язаний з конкретним component/directive. Ієрархія: спочатку NodeInjectors вгору по component tree, потім переходить до EnvironmentInjectors. Різниця: EnvironmentInjector — stateful singleton registry, NodeInjector — lightweight DI annotation на component node."
      senior: "EnvironmentInjector (Angular 14+, раніше ModuleInjector): — R3Injector — Map-based registry з providers. Зберігає instances сервісів. Lifecycle: живе доки живе Angular environment. NodeInjector: — не окремий клас, embedded structure в TNode/LView. TNode.directiveStart/directiveEnd — range of directives on element. Bloom filter в TView для швидкого token lookup. LView слоти для directive instances. Провайдери в компоненті (@Component providers:[]) — реєструються в NodeInjector того component node. Різниця в scope: EnvironmentInjector — tree of injectors parallel до app structure. NodeInjector — паралельний до DOM tree. Token resolution traverses обидва дерева sequentially."
      staff: "Dual injector tree — architectural decision Ivy що відрізняє Angular від інших DI frameworks. EnvironmentInjector tree: Platform injector (Navigator, Document) → Root injector (app-wide services) → Feature module injectors → Route injectors (lazy loaded). Кожен EnvironmentInjector — R3Injector з Map<token, record>. При bootstrap: ApplicationRef creates root R3Injector з appConfig.providers. NodeInjector tree: parallel до component tree. BLOOMS важливо: TView.firstChild/next для tree traversal, bloom filters per TView для fast negative resolution. Коли обидва дерева combined: inject() спочатку traverses NodeInjector tree до root component, потім EnvironmentInjector tree. Це означає: component-level providers shadow environment-level з тим самим token. Practical implication: `@Component({ providers: [MyService] })` — creates scoped instance, кожен component instance має власний instance. Це використовується для scoped state (form services, feature-specific state)."
    commonMistakes:
      - "Думають що всі injectors одного типу — не знають про dual tree"
      - "Не розуміють що @Component providers: [] створює NodeInjector scope, не singleton"
    relatedQuestions: ["b5t1q1", "b5t1q3"]
  - id: "b5t1q3"
    level: "senior"
    question: "Як Angular резолвить залежність при inject() виклику — опишіть алгоритм lookup крок за кроком?"
    referenceAnswers:
      junior: "Angular шукає сервіс в поточному injector, якщо не знаходить — йде до батьківського."
      mid: "Алгоритм: 1) Отримати поточний injector context (з якого component inject викликано). 2) Шукати token в поточному NodeInjector. 3) Якщо не знайдено — перейти до parent NodeInjector. 4) Коли NodeInjector tree вичерпано — перейти до EnvironmentInjector chain. 5) Якщо не знайдено ніде — NullInjector throws або повертає default якщо @Optional."
      senior: "Детальний алгоритм: 1) inject(Token) викликається в injection context (constructor, factory, effect). 2) Поточний injector визначається через `currentLView` або `currentInjector` context variable. 3) NodeInjector lookup: a) bloom filter check — якщо bit не встановлено → не в цьому injector, traverse to parent. b) Якщо bloom positive → linear search providers array. c) Якщо found → create/return instance. 4) Коли NodeInjectors вичерпані (дійшли до root component) → EnvironmentInjector chain. 5) EnvironmentInjector lookup: Map.get(token) → found → return. 6) Parent EnvironmentInjector → repeat. 7) Root EnvironmentInjector → Platform injector → NullInjector. 8) NullInjector: throws якщо not @Optional, повертає null якщо @Optional. Modifier @Self — step 3 тільки для поточного NodeInjector. @SkipSelf — пропустити поточний, почати з parent. @Host — зупинитись на host element boundary."
      staff: "DI resolution в production context має performance implications. Bloom filter — критична оптимізація: без неї кожен inject() потребував би linear search по всіх ancestors. З bloom filter: O(1) negative, O(depth) positive case. Token identity: Angular використовує object identity для tokens (reference equality). Тому `new InjectionToken('same-name')` — two different tokens. Circular dependency detection: Angular відслідковує resolving stack — якщо token вже в stack → circular dependency error. factory provider може break cycles через forwardRef. providedIn: 'root' + tree-shaking: Angular compiler аналізує чи token реально використовується в app. Якщо ні — provider видаляється з bundle (tree-shaken). Це можливо тільки для providedIn: 'root' (static analysis). Dynamic providers через providers:[] array — не tree-shakable. Practical optimization: уникати providedIn: component для services що не потребують scoped instances — це додаткові NodeInjector lookups і allocations."
    commonMistakes:
      - "Думають що DI resolution — тільки лінійний пошук без bloom filter оптимізації"
      - "Не знають що @Self/@SkipSelf/@Host змінюють traversal алгоритм"
    relatedQuestions: ["b5t1q2", "b5t1q4"]
  - id: "b5t1q4"
    level: "senior"
    question: "Що таке injection context і де inject() функцію можна і не можна використовувати?"
    referenceAnswers:
      junior: "inject() можна використовувати в constructor класу або на рівні класу поля. В ngOnInit використовувати не можна."
      mid: "inject() працює тільки в injection context: constructor, class field initializer, factory functions провайдерів. Не можна в методах (ngOnInit, setTimeout callbacks). Injection context — Angular runtime state що вказує поточний injector. runInInjectionContext() дозволяє запустити код в injection context. toSignal() може потребувати injection context для cleanup."
      senior: "Injection context — це runtime flag Angular що встановлюється коли Angular виконує code в DI-safe context: constructor, class field init, factory function (useFactory). При inject() Angular читає currentInjector з internal stack. inject() поза context → NG0203 error. runInInjectionContext(injector, fn) — явне встановлення context. Це використовується для: deferred inject (inject в async callback), functional guards/resolvers (inject в standalone function), effect() + afterRenderEffect() (injection context автоматично). Angular 16+: inject() в constructor/field init — compiler автоматично sets context. inject() в метод — requires explicit runInInjectionContext або DestroyRef pattern."
      staff: "Injection context — це architectural guardrail що enforces correct DI usage. Без context checking inject() міг би використовуватись де завгодно, але injector не визначений — undefined behavior. Context stack: Angular pushes/pops injector reference при обробці view creation. Edge cases: 1) Деferred component loading — inject() у dynamically created component works (context set by createComponent). 2) Standalone functional providers (Angular 14+): `provideExperimentalZonelessChangeDetection()` — inject() works у factory. 3) Route guards/resolvers як functions — Angular runner встановлює context. 4) NgRx effects: createEffect() callback — injection context встановлюється. 5) toSignal() — requires injection context для DestroyRef registration (auto-unsubscribe). takeUntilDestroyed() — аналогічно. Practical pattern: при dynamic scenarios де inject() потрібен поза constructor — inject DestroyRef + Injector в constructor → use runInInjectionContext(this.injector, ...) у відповідний момент."
    commonMistakes:
      - "Намагаються inject() в ngOnInit або lifecycle methods — NG0203 error"
      - "Не знають про runInInjectionContext() для нестандартних сценаріїв"
    relatedQuestions: ["b5t1q3", "b5t1q5"]
  - id: "b5t1q5"
    level: "staff"
    question: "Як DI ієрархія впливає на архітектуру великого Angular застосування? Розкажіть про scoped services, lazy module injectors і route-level DI."
    referenceAnswers:
      junior: "Lazy loaded модулі мають свій injector де можна перевизначити сервіси для тієї частини app."
      mid: "Кожен lazy-loaded feature module/route створює свій EnvironmentInjector. Сервіси з `providers:[]` у lazy module — scoped до того модуля. providedIn: 'root' — глобальний singleton. Scoped service pattern: кожна route feature має свої сервіси що живуть тільки поки route active."
      senior: "Архітектурні шари: 1) Platform injector — Navigator, Document (per browser tab). 2) Root EnvironmentInjector — app-wide singletons (AuthService, HttpClient). 3) Route EnvironmentInjector — lazy route providers, живе поки route active. 4) Component NodeInjector — компонент-scoped services. Route-level providers: `{ path: 'admin', loadComponent: ..., providers: [AdminService] }` — AdminService exists тільки в admin route tree. При навігації away — injector destroyed, service destroyed. Component-level scoping: `@Component({ providers: [FormService] })` — кожен form instance has own FormService. Lazy loaded route creates new R3Injector з providers array."
      staff: "DI ієрархія в enterprise app — critical architectural concern. Design principles: 1) Root injector — тільки truly global singletons (HTTP, auth, error handling). 2) Feature route injectors — feature-specific services. Переваги: memory efficiency (service destroyed з route), service isolation між features, testability (inject mock service per route). 3) Component injectors — state services що scoped to component tree (wizard steps, multi-instance forms). Pitfall: сервіс з providedIn:'root' і `providers:[]` одночасно — два instances. Anti-pattern: реєструвати feature-specific service в root — memory overhead, potential cross-feature leakage. Route injector timing: providers ініціалізуються при route activation, destroyed при deactivation. Якщо service має cleanup (interval, WebSocket) — implements OnDestroy або DestroyRef.onDestroy(). NgRx integration: feature stores в route providers — scoped state management. Nx monorepo: library boundary = injector boundary — library services не leaking до app-level."
    commonMistakes:
      - "Реєструють все в root injector — memory bloat і unclear service ownership"
      - "Не розуміють що route providers destroyed при navigation — stale reference bugs"
    relatedQuestions: ["b5t1q4", "b5t1q3"]
---

## Core Concept

**English definition:** Angular's Dependency Injection system is a hierarchical IoC container consisting of two parallel injector trees: EnvironmentInjectors (platform, root, route/module-level) and NodeInjectors (component/directive-level, embedded in LView), which resolves tokens by traversing from the current injection context up through parent injectors.

**Пояснення:** Angular DI — це ієрархічна система двох паралельних дерев injectors. EnvironmentInjector (Platform → Root → Feature/Route) — стандартний Map-based registry для environment-level сервісів. NodeInjector — структура вбудована в LView/TNode для component/directive level DI, використовує Bloom Filter для швидкого пошуку. При inject(Token): Angular traverses NodeInjector tree вгору по component hierarchy, потім переходить до EnvironmentInjector chain. Resolution закінчується NullInjector — кидає помилку або повертає null якщо @Optional.

**Яку проблему вирішує:** Manual object creation і dependency management = tight coupling і untestable code. DI надає Inversion of Control — компоненти декларують залежності, DI container управляє creation і lifecycle. Ієрархічна структура дозволяє scoped instances (per-component, per-route) і overriding для testing без зміни бізнес-логіки.

**Як працює під капотом:** @Injectable compiler генерує `ɵprov` (provider definition) з factory function. NodeInjector використовує bloom filter (256 bits) для O(1) negative lookup. При positive bloom hit — linear search в TNode providers array. EnvironmentInjector — R3Injector з Map<token, Record>. inject() читає `currentInjector` з Angular internal context stack. providedIn:'root' — lazy tree-shakable registration в root injector.

**Trade-offs та обмеження:** NodeInjector bloom filter — false positive rate ~2% (extra linear search). Глибока component ієрархія = більше traversal steps. Component-level providers — кожен component instance = окремий service instance (intended for scoping, може бути неочікуваним). inject() поза injection context — NG0203 runtime error. Circular dependencies — compile-time або runtime error, потребують forwardRef.

**Версійність:** DI стабільний з Angular 2. Angular 9 (Ivy): NodeInjector перероблений — bloom filter architecture. Angular 14: EnvironmentInjector API публічний, deprecated ModuleInjector terminology. Angular 14: inject() function стабільна (була experimental). Angular 16: inject() в class field initializers, runInInjectionContext(). Angular 19: `@Injectable({ providedIn: 'root' })` — default для нових сервісів через CLI.

---

## Deep Details

### Edge Cases

**Singleton vs per-component:** `providedIn: 'root'` — один instance. `@Component({ providers: [MyService] })` — окремий instance для кожного component. Якщо і root і component providers визначені — component NodeInjector shadows root instance.

**providedIn: 'any':** Deprecated Angular 14. Створював окремий instance для кожного lazy-loaded module injector. Складна семантика — видалено.

**forwardRef і circular deps:** `providers: [{ provide: A, useClass: B, deps: [forwardRef(() => A)] }]` — вирішує circular reference. forwardRef — wrapper що відкладає evaluation до runtime.

**inject() в class field:** `private service = inject(MyService)` — еквівалент constructor injection, но більш concise. TypeScript field initializers — injection context встановлено Angular.

**Platform injector:** Один на browser tab. Містить: Document, DOCUMENT, PLATFORM_ID. При SSR — platform-server injector інший set providers.

**R3Injector і destroy:** При EnvironmentInjector destroy — всі сервіси що implements OnDestroy отримують ngOnDestroy call. Route injector destroy = route deactivation. Лазово завантажені route services — живуть від activation до deactivation.

### Junior vs Senior Understanding

**Junior** знає що DI inject сервіси, розуміє @Injectable і providedIn:'root', знає що ієрархія існує.

**Senior** розуміє:

1. **Dual injector trees:** EnvironmentInjector (Map-based) і NodeInjector (bloom filter + LView embedded). Різні алгоритми lookup, різні purposes.

2. **Bloom filter optimization:** 256-bit filter, O(1) negative check. False positive rate, linear fallback. Це чому Angular DI fast при deep component hierarchies.

3. **Token identity:** Object reference equality для tokens. InjectionToken('same-name') — два різних tokens якщо різні instances.

4. **Tree shaking:** `providedIn:'root'` — compiler аналізує static usage і видаляє unused providers. `providers:[]` масив — не tree-shakable (dynamic).

5. **Injection context:** inject() потребує active context. runInInjectionContext() для деferred/async scenarios. DestroyRef — inject в constructor, onDestroy() callback де потрібно.

### Deprecation & Migration Path

- **NgModule-based DI:** NgModule providers — deprecated workflow, але все ще підтримується. Migration: standalone providers через bootstrapApplication і provideX functions.
- **ModuleInjector terminology:** Renamed EnvironmentInjector в Angular 14. API залишилась але документація оновлена.
- **providedIn: 'any':** Deprecated Angular 14, removed Angular 16.
- **ReflectiveInjector:** Видалено Angular 9 (Ivy). Все через StaticInjector або R3Injector.

### Connections to Other Concepts

- **Bootstrapping:** bootstrapApplication() creates root EnvironmentInjector з appConfig.providers.
- **Router:** Lazy routes create route EnvironmentInjector з route providers. Route deactivation = injector destroy.
- **Testing:** TestBed creates isolated test injector — overrides providers для mocking.
- **Signals:** inject() функція дозволяє inject в computed/effect contexts через runInInjectionContext.

---

## Examples

### Basic Usage

```typescript
// Simple injectable service
@Injectable({
  providedIn: 'root'  // Tree-shakable singleton in root injector
})
export class UserService {
  private users = signal<User[]>([]);

  getUsers(): User[] {
    return this.users();
  }
}

// Class field injection (Angular 16+ preferred style)
@Component({
  selector: 'app-users',
  standalone: true,
  template: `
    @for (user of users(); track user.id) {
      <p>{{ user.name }}</p>
    }
  `
})
export class UsersComponent {
  // inject() in class field — injection context automatically set
  private userService = inject(UserService);

  users = this.userService.getUsers;  // Signal reference
}

// Constructor injection (legacy but still valid)
@Component({
  selector: 'app-users-legacy',
  standalone: true,
  template: `...`
})
export class UsersLegacyComponent {
  constructor(private userService: UserService) {}
}
```

### Production Scenario

```typescript
// Scoped service pattern — per-route DI
// Route configuration with scoped providers
const routes: Routes = [
  {
    path: 'checkout',
    loadComponent: () => import('./checkout/checkout.component'),
    providers: [
      // CheckoutService scoped to checkout route and its children
      CheckoutService,
      // Cart state scoped to checkout flow only
      { provide: CartStore, useClass: CheckoutCartStore },
    ]
  }
];

// CheckoutService — no providedIn (will only exist in route injector)
@Injectable()  // No providedIn — must be registered in providers array
export class CheckoutService implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  private state = signal<CheckoutState>({ step: 1, items: [] });

  constructor() {
    // DestroyRef.onDestroy — clean up when route injector destroyed
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  private cleanup(): void {
    console.log('Checkout route leaving — cleanup');
  }
}

// Component-level scoped service — per-instance
@Component({
  selector: 'app-expandable-panel',
  standalone: true,
  providers: [PanelStateService],  // Each panel instance gets own PanelStateService
  template: `...`
})
export class ExpandablePanelComponent {
  private panelState = inject(PanelStateService);
}

// runInInjectionContext usage
@Injectable({ providedIn: 'root' })
export class DynamicService {
  private injector = inject(Injector);

  setupDynamicFeature(): void {
    // inject() needs injection context — use runInInjectionContext
    runInInjectionContext(this.injector, () => {
      const featureService = inject(FeatureService);
      featureService.initialize();
    });
  }
}
```

### Anti-Example

```typescript
// WRONG: Manual instantiation — bypasses DI
@Component({ template: `...` })
export class BadComponent {
  // WRONG: direct instantiation — not injectable, not testable
  private service = new UserService();

  constructor() {
    // WRONG: inject() outside injection context
    setTimeout(() => {
      const s = inject(SomeService); // NG0203 error
    }, 0);
  }

  ngOnInit(): void {
    // WRONG: inject() in lifecycle method — not injection context
    const router = inject(Router); // NG0203 error
  }
}

// WRONG: Registering everything in root — no scoping
@NgModule({
  providers: [
    CheckoutService,       // Should be route-scoped
    CartService,           // Should be route-scoped
    FeatureAService,       // Should be feature-scoped
    FeatureBService,       // Should be feature-scoped
    // Memory leak: these never get destroyed
  ]
})
export class AppModule {}

// CORRECT:
@Component({ template: `...` })
export class GoodComponent {
  // inject() in class field — injection context is active
  private service = inject(UserService);
  private injector = inject(Injector);

  performDeferredInjection(): void {
    // Correct: runInInjectionContext for deferred injection
    runInInjectionContext(this.injector, () => {
      const dynamicService = inject(DynamicService);
      dynamicService.doWork();
    });
  }
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `new ServiceClass()` замість inject | Bypasses DI — не testable, no lifecycle management | `inject(ServiceClass)` або constructor injection |
| Всі сервіси в root injector | Memory bloat, no scoping, unclear ownership | Route/component providers для feature-specific services |
| inject() у lifecycle методах або callbacks | NG0203 injection context error | inject() у class field або constructor, або `runInInjectionContext()` |
| Circular dependency без forwardRef | Runtime DI error або infinite loop | `forwardRef(() => Dependency)` або refactor to remove cycle |
| `providedIn: 'any'` (deprecated) | Removed Angular 16, unpredictable multiple instances | `providedIn: 'root'` або explicit `providers: []` in module/route |

---

## Interview Block

### [L1 — Warm-up] Що таке Dependency Injection в Angular і навіщо він потрібен?
**Signal being tested:** Розуміння IoC principle і чому DI краще manual instantiation — не просто "Angular inject services".
**What the interviewer expects:** IoC explanation, loosе coupling, testability, singleton management, ієрархія injectors на базовому рівні.
**How to probe deeper:** "Яка різниця між `providedIn: 'root'` і реєстрацією в `@Component({ providers: [] })`?"
**Reference answer:** DI — IoC container що manages service creation і dependencies. Переваги: loose coupling (не знає як create service), testability (swap mocks in tests), lifecycle management. Angular injector hierarchy: Platform → Root → Feature/Route → Component. providedIn:'root' — singleton в root injector, tree-shakable. providers:[] у component — scoped instance per component.
**Common mistakes:** Думають DI = лише singleton pattern; не розуміють ієрархію.

### [L2 — Mid] Яка різниця між EnvironmentInjector і NodeInjector в Angular Ivy?
**Signal being tested:** Знання internal architecture Ivy DI і розуміння dual tree design — не просто "є injector hierarchy".
**What the interviewer expects:** EnvironmentInjector (Map-based, route/app level), NodeInjector (bloom filter, embedded in LView, component level), как resolution traverses both trees.
**How to probe deeper:** "Що відбувається якщо той самий token registered і в root EnvironmentInjector і в Component providers?"
**Reference answer:** EnvironmentInjector — R3Injector з Map<token, record>, для root/route/module level. NodeInjector — bloom filter structure вбудована в LView для component/directive level. Resolution: спочатку NodeInjector tree (component → parent → root), потім EnvironmentInjector chain. Component providers shadow root injector — component instance отримує власний scoped service.
**Common mistakes:** Думають один тип injector; не знають про bloom filter optimization.

### [L3 — Senior] Як Angular резолвить залежність при inject() виклику — опишіть алгоритм lookup?
**Signal being tested:** Глибоке знання resolution algorithm і performance implications — може пояснити bloom filter і traversal order.
**What the interviewer expects:** Bloom filter check → linear search → parent traversal → EnvironmentInjector chain → NullInjector, effect modifiers (@Self/@SkipSelf/@Host).
**How to probe deeper:** "Як @Self, @SkipSelf і @Host модифікують алгоритм traversal?"
**Reference answer:** Bloom filter O(1) negative check → якщо positive → linear search providers → якщо found return instance. Якщо не знайдено → parent NodeInjector (repeat). Після root component → EnvironmentInjector Map.get(token). Parent chain → NullInjector. @Self: тільки поточний NodeInjector. @SkipSelf: пропустити поточний. @Host: зупинитись на host component boundary.
**Common mistakes:** Не знають про bloom filter; думають linear search від початку для кожного lookup.

### [L4 — Staff/Principal] Як DI ієрархія впливає на архітектуру великого Angular застосування?
**Signal being tested:** Архітектурне мислення про service scoping, memory management і feature isolation.
**What the interviewer expects:** Route-scoped services, component-scoped state, memory lifecycle alignment, feature isolation, NgRx/Signal Store integration з route providers.
**How to probe deeper:** "Як правильно очищати route-scoped services що мають активні connections (WebSocket, polling)?"
**Reference answer:** Architectural layers: Platform (Document), Root (global singletons), Route (feature services — живуть route lifetime), Component (per-instance state). Route providers destroyed при navigation — DestroyRef.onDestroy() для cleanup. Feature isolation: кожна lazy route = власний EnvironmentInjector. Component providers для multi-instance state (wizard, multi-form). NgRx: feature state в route providers — scoped until route leaves.
**Common mistakes:** Всі сервіси в root — memory і ownership проблеми; не очищають route services при navigation.

---

## Summary

### Key Points
- Angular DI — ієрархічна система двох паралельних injector trees: EnvironmentInjector і NodeInjector
- NodeInjector — bloom filter structure в LView, O(1) negative lookup без окремого injector object per node
- Resolution order: NodeInjectors (component → parent → root), потім EnvironmentInjector chain → NullInjector
- inject() потребує injection context: class field, constructor, factory. runInInjectionContext() для async
- providedIn:'root' — tree-shakable singleton. Component providers — scoped instance per component instance
- Route providers — feature-scoped, destroyed при route deactivation. Ідеально для feature services
- @Self/@SkipSelf/@Host модифікують traversal — детальніше в Resolution Modifiers topic

### Elevator Pitch (2 minutes)
Angular DI — ієрархічна IoC система з двома паралельними injector trees. EnvironmentInjector (Platform → Root → Route) — Map-based registry. NodeInjector (per component) — bloom filter structure в LView для O(1) negative lookups. Resolution: inject(Token) traverses NodeInjectors вгору по component tree, потім EnvironmentInjector chain, завершується NullInjector. inject() — injection context required (class field, constructor, factory). providedIn:'root' — tree-shakable global singleton. @Component providers:[] — scoped instance per component. Route providers — exist only while route active (feature isolation + memory management). For enterprise: root = global, route = feature, component = per-instance state. DestroyRef.onDestroy() для cleanup в scoped services.
