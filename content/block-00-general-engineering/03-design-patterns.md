---
title: "Design Patterns in Angular"
block: 0
topic: 3
slug: "design-patterns"
difficulty: 3
tags: ["design-patterns", "observer", "strategy", "decorator", "factory", "singleton", "facade"]
relatedTopics: ["oop-principles", "solid-principles", "dependency-injection"]
interviewQuestions:
  - id: "b0t3q1"
    level: "junior"
    question: "Які design patterns ви бачите в Angular framework? Назвіть хоча б три з прикладами."
    referenceAnswers:
      junior: "В Angular є Observer pattern (RxJS Observable), Singleton (сервіси з providedIn: 'root'), та Decorator (@Component, @Injectable). Ці patterns вбудовані в framework і використовуються щодня."
      mid: "Angular активно використовує design patterns: Observer — RxJS Observables, EventEmitter, AsyncPipe для reactive data flow. Singleton — сервіси з providedIn: 'root' мають один екземпляр на весь застосунок. Decorator — TypeScript декоратори @Component, @Injectable, @Directive додають metadata до класів. Strategy — DI дозволяє підставляти різні реалізації через провайдери. Factory — useFactory в providers для динамічного створення залежностей. Facade — сервіс який надає спрощений API для складної підсистеми."
      senior: "Angular framework побудований на класичних GoF patterns, адаптованих під TypeScript/reactive парадигму. Observer: RxJS Observable — це pull-based variant Observer pattern де consumer контролює subscription lifecycle через unsubscribe. EventEmitter extends Subject — component-level observer для @Output. AsyncPipe автоматизує subscription management. Singleton: Angular DI забезпечує singleton scope через providedIn: 'root' (app-wide singleton) або component-level providers (scoped singleton). Ivy оптимізує tree-shaking для root singletons. Decorator: TypeScript decorators — це runtime modification pattern, Angular використовує їх для metadata attachment (@Component annotation processor). Strategy: DI token + різні useClass implementations — це Strategy pattern де алгоритм вибирається через конфігурацію. Factory: useFactory, FactoryProvider, injection factories для lazy/conditional creation. Facade: Angular сервіс як facade для complex subsystems (HTTP + cache + error handling). Chain of Responsibility: HTTP interceptors. Template Method: lifecycle hooks (ngOnInit, ngOnChanges)."
      staff: "Angular — це один з найбагатших на design patterns frontend frameworks, і розуміння їхньої імплементації розкриває архітектурні рішення Angular team. Observer: Angular реалізує Observer на кількох рівнях — RxJS для async data streams, EventEmitter для component communication, Zone.js notification для change detection triggering (хоча Signals рухають від Observer до push-based reactivity). Ключова різниця: RxJS Observable — lazy, cold by default, що відрізняється від класичного hot Observer pattern. Singleton: Angular DI має nuanced singleton semantics — providedIn: 'root' це app-level singleton, але lazy-loaded modules historically могли створити другий instance (fixed в Ivy). providedIn: 'any' — intentional multi-instance для isolated state. Decorator: Angular decorators — це не просто metadata annotation, вони trigger'ять compile-time code generation. @Component запускає template compiler, @Injectable генерує factory. Це більше Annotation Processor pattern ніж класичний Decorator. Strategy: DI + InjectionToken реалізує Strategy де context (component) не знає конкретний algorithm (service implementation). Factory: Angular useFactory це classic Factory Method, а EnvironmentInjector.runInContext — це Abstract Factory для scoped creation. Chain of Responsibility: HTTP interceptors та Router guards утворюють chain де кожен handler вирішує pass чи handle. Template Method: Component lifecycle hooks — framework визначає algorithm skeleton (creation → change detection → destruction), component fills in specific steps. Mediator: NgRx Store — components не спілкуються напряму, а через centralized store. Proxy: Angular HttpClient — proxy для XMLHttpRequest/fetch з interceptor chain."
    commonMistakes:
      - "Називають тільки Singleton і Observer, ігноруючи інші patterns"
      - "Плутають TypeScript decorators з GoF Decorator pattern"
      - "Не розуміють що RxJS Observable — це варіація Observer pattern"
    relatedQuestions: ["b0t3q2", "b0t3q3"]
  - id: "b0t3q2"
    level: "mid"
    question: "Як Observer pattern реалізований в Angular через RxJS? Порівняйте Observable, Subject, EventEmitter та Signals."
    referenceAnswers:
      junior: "Observable — це потік даних на який можна підписатися. Subject — Observable який також може emit'ити значення. EventEmitter використовується для @Output в компонентах. Signals — це нова reactive примітива в Angular 16+."
      mid: "Observer pattern в Angular має кілька реалізацій. Observable — lazy, unicast (кожен subscriber отримує окремий execution). Subject — hot, multicast (всі subscribers ділять одне execution). BehaviorSubject — Subject з initial value, віддає останнє значення новим subscribers. EventEmitter extends Subject, використовується для @Output. Signals (Angular 16+) — synchronous, pull-based reactivity: не потрібна підписка, значення читається безпосередньо. Observable vs Signal: Observable — push-based async stream, Signal — pull-based sync value. Angular рухається до Signals для component state, залишаючи Observable для async operations."
      senior: "Observer pattern в Angular еволюціонував через кілька поколінь. RxJS Observable: холодний, lazy, unicast потік — кожен subscribe() створює нове execution. Це відрізняється від класичного hot Observer. Subject/BehaviorSubject: гарячі, multicast — реалізують класичний Observer де один source notify'ить множину observers. EventEmitter: Angular-specific Subject wrapper для @Output, який підтримує як sync так і async emission (хоча async mode рідко використовується). ReplaySubject: корисний для caching — replay N останніх значень новим subscribers. Signals (Angular 16+): принципово інший підхід — pull-based reactivity без subscription overhead. Signal — це reactive value container, computed() — derived value, effect() — side effect. Signals вирішують проблеми Observer pattern: немає subscription leaks, немає потреби в async pipe, synchronous reads для template. Внутрішньо Angular переходить від Zone.js-based change detection (Observer-driven) до Signal-based (pull-based), що дає fine-grained reactivity та кращу performance."
      staff: "Observer pattern в Angular — це case study еволюції reactive programming в enterprise framework. Перше покоління: Zone.js monkey-patches async APIs (setTimeout, Promise, addEventListener) і notification'ує Angular про потенційні зміни — це implicit Observer де Zone.js є observable subject, а change detector — observer. Проблема: over-notification, бо Zone.js не знає які зміни relevant. Друге покоління: RxJS дає explicit reactive streams. Observable.subscribe() — це explicit observer registration. Async pipe — bridge між RxJS та template. Проблема: subscription management (takeUntil, takeUntilDestroyed), cold vs hot confusion, diamond problem з multiple async pipes на одному observable. Третє покоління: Signals — synchronous, pull-based, auto-tracking. Під капотом Angular Signal implementation використовує versioned reactive graph де кожен signal node має version counter, і consumers (computed, effect, template bindings) track dependencies automatically. При зміні signal — dirty flag propagation через graph, actual recomputation — lazy при read. Це Incremental Computation model, споріднений з Solid.js та Vue 3 reactivity. Architectural implications: Observable залишається для async streams (HTTP, WebSocket, Router events), Signal — для synchronous state. toSignal()/toObservable() — bridges. В NgRx: SignalStore як альтернатива Store з Signals замість Observables. Migration strategy: поступовий перехід компонентів від Observable + async pipe до Signal + signal-based components. Template: interpolation {{ signal() }} vs {{ observable$ | async }}. Observer pattern не зникає — він еволюціонує від implicit (Zone.js) через explicit push (RxJS) до explicit pull (Signals)."
    commonMistakes:
      - "Плутають cold та hot observables в контексті Angular"
      - "Не розуміють що EventEmitter — це Subject під капотом"
      - "Вважають що Signals повністю замінять RxJS"
    relatedQuestions: ["b0t3q1", "b0t3q4"]
  - id: "b0t3q3"
    level: "mid"
    question: "Як Singleton pattern реалізований в Angular DI? Які підводні камені та коли потрібен не-singleton scope?"
    referenceAnswers:
      junior: "В Angular сервіс з providedIn: 'root' створюється як singleton — один екземпляр на весь застосунок. Це зручно для shared state та API сервісів."
      mid: "Angular DI реалізує Singleton через providedIn: 'root' — один instance на весь app. Але singleton scope залежить від injector level: component-level provider створює новий instance для кожного компонента. Підводні камені: lazy-loaded modules історично могли створити другий instance singleton-сервісу (вирішено в Ivy). providedIn: 'any' — навмисний multi-instance для ізольованого state. Не-singleton потрібен коли: form state (кожна форма має свій FormService), component-specific state (dialog state), multi-instance UI (кілька однакових widgets з різним state)."
      senior: "Singleton в Angular DI — це не класичний GoF Singleton з static instance. Angular Singleton controlled by DI container: lifetime визначається injector scope, а не класом самим. providedIn: 'root' реєструє сервіс в root EnvironmentInjector — один instance на app. providedIn: 'platform' — один instance на platform (shared між кількома Angular apps на сторінці). Component-level provider — новий instance per component, destroyed з компонентом (useful для cleanup). Підводні камені: 1) pre-Ivy lazy module isolation — lazy module мав свій ModuleInjector, що міг створити другий instance. Ivy виправив через single EnvironmentInjector tree. 2) providedIn: 'any' — кожен lazy chunk отримує свій instance, корисно для isolated state але може бути confusing. 3) Memory leaks — root singleton живе весь lifecycle app, якщо він accumulate'ить дані — memory leak. Патерн: component-scoped singleton через providers на компоненті — instance живе поки живе компонент, automatic cleanup."
      staff: "Singleton pattern в Angular DI заслуговує глибокого аналізу тому що Angular реалізує його unorthodox way. В класичному GoF Singleton — клас контролює свій lifecycle через private constructor + static getInstance(). В Angular — DI container контролює lifecycle, а клас не знає що він singleton. Це IoC applied to Singleton pattern. Під капотом Ivy зберігає singleton instances в LView/TView data structures. Root injector (R3Injector) тримає Map<Type|InjectionToken, Record> де Record містить factory та cached value. Перший inject() виконує factory, кожен наступний повертає cached value — classic lazy initialization. Tree-shaking: providedIn: 'root' з factory дозволяє Angular compiler видалити сервіс якщо він ніде не inject'ується — factory стає dead code. Це неможливо з NgModule providers де реєстрація explicit. Multi-instance scenarios в enterprise Angular: 1) Component-scoped state: FormStateService provided на рівні form component — кожна форма має ізольований state, destroyed автоматично. 2) Route-scoped state: ENVIRONMENT_INITIALIZER + providers на Route level — state lives per route, cleaned on navigation. 3) Dynamic scoping: createEnvironmentInjector() для runtime creation of isolated scopes — plugin isolation, A/B testing, multi-tenant UI. 4) Request-scoped (SSR): кожен HTTP request отримує fresh injector tree щоб уникнути state leaking між requests — критично для Angular Universal/SSR. Anti-pattern: Singleton з mutable state без proper concurrency control — в SSR multiple requests share singleton, що може leak user data. Рішення: request-scoped providers або immutable state + functional updates."
    commonMistakes:
      - "Думають що Singleton — це єдиний scope в Angular DI"
      - "Не знають про проблему duplicate instances в lazy modules (pre-Ivy)"
      - "Забувають про memory implications root-level singletons"
    relatedQuestions: ["b0t3q1", "b0t3q5"]
  - id: "b0t3q4"
    level: "senior"
    question: "Як Strategy та Factory patterns використовуються для побудови extensible Angular-архітектури? Покажіть на прикладі runtime-вибору стратегії."
    referenceAnswers:
      junior: "Strategy pattern дозволяє вибирати алгоритм в runtime. В Angular можна використовувати DI для підстановки різних сервісів. Factory pattern використовується через useFactory в providers."
      mid: "Strategy pattern в Angular реалізується через DI tokens: визначаємо InjectionToken або abstract class як strategy interface, і provide'имо різні реалізації залежно від контексту. Factory pattern: useFactory в providers дозволяє динамічно створювати залежності на основі runtime conditions (feature flags, environment, user role). Приклад: { provide: StorageStrategy, useFactory: (config) => config.useCloud ? new CloudStorage() : new LocalStorage(), deps: [AppConfig] }."
      senior: "Strategy pattern в Angular має кілька implementation approaches. 1) DI-based: InjectionToken<Strategy> + useClass/useFactory на різних рівнях injector hierarchy. Route-level providers дозволяють різні стратегії для різних feature areas. 2) Map-based: InjectionToken<Map<string, Strategy>> де factory будує map стратегій, і runtime code вибирає по ключу. 3) Multi-provider: STRATEGIES multi-token де всі стратегії зареєстровані, і selector service вибирає потрібну. Factory pattern: useFactory для conditional creation, FactoryProvider для dynamic dependencies. Abstract Factory: createEnvironmentInjector як factory для створення scoped injector hierarchies. Composing Strategy + Factory: factory створює стратегію на основі runtime config, і inject'ить її через DI. Це потужний pattern для feature flags, A/B testing, multi-tenant customization."
      staff: "Strategy та Factory — два patterns які разом формують foundation extensible Angular архітектури. Strategy pattern advanced implementations: 1) Hierarchical Strategy Resolution: стратегія визначається на platform → app → route → component рівні, де кожен рівень може override'нути батьківський. Реалізується через Angular DI hierarchy природно. 2) Composite Strategy: multi-provider де кілька стратегій compose'яться (validation strategies, transformation pipelines). 3) Dynamic Strategy Loading: lazy import() стратегії + inject() в injection context. Factory pattern advanced: 1) Abstract Factory через createEnvironmentInjector — runtime creation of complete DI contexts з різними провайдерами. Use case: multi-tenant app де кожен tenant має свій набір сервісів. 2) Factory Method через useFactory + deps — Angular DI є по суті IoC Factory де кожен provider registration — це factory method configuration. 3) Builder pattern variant: provideRouter(withPreloading(...), withHashLocation(...)) — functional builder що constructs router configuration through composition of features. Real-world application: form rendering engine де FormFieldStrategy визначає як рендерити кожен тип поля (text, select, date, custom), FormFieldFactory створює component instances на основі schema, і DI wires everything together. Це дозволяє додавати нові field types через plugin registration без зміни core rendering logic. Performance consideration: factory functions в Angular DI виконуються lazily — перший inject() triggers factory, результат кешується. Для heavy factories це означає cold start overhead, вирішується через APP_INITIALIZER pre-warming."
    commonMistakes:
      - "Реалізують Strategy через if/else замість DI"
      - "Забувають про caching в factory — recreate на кожен inject"
      - "Не використовують DI hierarchy для hierarchical strategy override"
    relatedQuestions: ["b0t3q3", "b0t3q5"]
  - id: "b0t3q5"
    level: "staff"
    question: "Спроектуйте систему dynamic form rendering з використанням design patterns. Як поєднати Strategy, Factory, Observer та Registry patterns?"
    referenceAnswers:
      junior: "Для dynamic form rendering потрібно створити різні компоненти для кожного типу поля та використовувати factory для їх створення на основі конфігурації."
      mid: "Dynamic form system використовує кілька patterns: Factory для створення field components на основі JSON schema, Strategy для різних validation/rendering strategies, Observer (Observable) для reactive form state management, Registry для реєстрації нових field types. Кожен field type — окремий компонент, factory вибирає потрібний на основі type property в schema."
      senior: "Dynamic form rendering architecture: Registry Pattern — FieldTypeRegistry сервіс де реєструються field type mappings (string → TextFieldComponent, date → DateFieldComponent). Strategy Pattern — ValidationStrategy per field type (синхронна, async, cross-field), RenderStrategy (material, bootstrap, custom). Factory Pattern — DynamicFieldFactory створює component instances через ViewContainerRef.createComponent() на основі registry lookup. Observer Pattern — FormStateService з BehaviorSubject<FormState> для reactive state, field-level observables для validation status, cross-field dependency tracking. Decorator Pattern — field wrappers (label, error message, help text) через content projection або wrapper components. Result: JSON schema → Registry lookup → Factory creation → Strategy-based rendering → Observer-based state."
      staff: "Enterprise dynamic form rendering system вимагає orchestration кількох design patterns з урахуванням performance та extensibility. Architecture layers: 1) Schema Layer: JSON/TypeScript form definition з field types, validation rules, conditional visibility, layout hints. Interpreter pattern для parsing schema. 2) Registry Layer: FORM_FIELD_REGISTRY — InjectionToken<Map<string, FieldRegistration>> де FieldRegistration містить component type, default config, validation factory. Multi-provider pattern дозволяє feature modules додавати свої field types без зміни core. 3) Factory Layer: FormFieldFactory використовує ViewContainerRef.createComponent() з Ivy dynamic component API. Abstract Factory pattern — різні factories для різних rendering targets (form, table, detail view). createComponent() з environmentInjector для correct DI scope. 4) Strategy Layer: ValidationStrategy per field — sync validators, async validators, cross-field validators compose через Composite pattern. RenderStrategy — Material, Bootstrap, або custom rendering через component substitution. ConditionalVisibilityStrategy — evaluate field visibility based on other field values. 5) Observer/Reactive Layer: Signal-based form state (Angular 16+) — кожне поле є WritableSignal, computed() для derived state (isValid, isDirty), effect() для side-effects (auto-save, analytics). For complex async: RxJS для debounced validation, HTTP-based lookups, WebSocket updates. 6) Mediator Layer: FormOrchestrator service координує field interactions — коли field A змінюється, field B options оновлюються, field C visibility toggle'ається. Mediator eliminates direct field-to-field coupling. Performance: OnPush + Signals для minimal re-rendering, lazy loading field components через dynamic import, virtual scrolling для large forms. Extensibility: нові field types додаються через провайдер в feature module — zero changes to core. Testing: кожен layer тестується незалежно — schema parsing, registry lookup, factory creation, strategy execution, state management."
    commonMistakes:
      - "Будують монолітний FormComponent замість composable system"
      - "Забувають про DI scoping при dynamic component creation"
      - "Не враховують performance для forms з 100+ полями"
      - "Tight coupling між field types замість Mediator"
    relatedQuestions: ["b0t3q4", "b0t1q5"]
---

## Core Concept

**English definition:** Design Patterns are reusable solutions to commonly occurring problems in software design. They represent best practices evolved over time by experienced developers and provide a shared vocabulary for communicating architectural decisions.

**Пояснення:** Angular framework — це, по суті, колекція design patterns зшитих разом в coherent API. Коли ви пишете `@Component`, ви використовуєте Decorator pattern. Коли inject'ите сервіс з `providedIn: 'root'` — це Singleton managed by DI Container. Коли підписуєтесь на Observable — Observer pattern. Коли HttpClient проганяє запит через interceptors — Chain of Responsibility. Розуміння яким pattern є кожен Angular-механізм дозволяє передбачити його поведінку, обмеження та правильне використання.

**Яку проблему вирішує:** Без знання design patterns розробник винаходить велосипед для кожної архітектурної проблеми. Як організувати спільний state? (Singleton / Mediator). Як зробити код extensible? (Strategy / Observer). Як спростити складний API? (Facade). Patterns дають перевірені рішення та спільну мову для команди.

**Як працює під капотом:** Angular compiler трансформує декоратори (@Component, @Injectable) в runtime код — це Annotation Processing pattern (споріднений з Java annotations). DI container реалізує Factory + Singleton patterns для створення та кешування залежностей. RxJS Observable реалізує Observer pattern з додатковими operators (functional composition). Change Detection — це variant Observer pattern де Angular виступає mediator між data changes та DOM updates.

**Trade-offs та обмеження:** Over-engineering — найпоширеніша проблема. Не кожна задача потребує Strategy pattern з DI token — іноді простий if/else достатній. Patterns додають indirection що ускладнює debugging та code navigation. Важливо використовувати pattern коли він вирішує реальну проблему, а не "тому що так правильно".

**Як Angular це використовує:** Observer: RxJS для async streams, EventEmitter для component output, Zone.js notification для change detection triggering. Singleton: DI container manages instance lifecycle через providedIn scope. Decorator: @Component, @Injectable, @Directive, @Pipe — metadata annotation + compile-time code generation. Factory: useFactory providers, ViewContainerRef.createComponent() для dynamic components. Strategy: DI tokens для swappable implementations (Renderer2 для platform-agnostic rendering). Chain of Responsibility: HTTP interceptors, Route guards. Template Method: Component lifecycle hooks. Proxy: HttpClient як proxy для native HTTP API. Facade: Angular CDK provides facade API для complex browser APIs.

## Deep Details

### Edge Cases

- **Singleton leaks in SSR:** Angular Universal створює новий injector tree per request, але якщо singleton сервіс зберігає user-specific state і цей state leaks між requests — це security vulnerability. Рішення: request-scoped providers або stateless singletons.
- **Observer completion semantics:** HttpClient observables complete після першого emit, але WebSocket observable не complete'ить. Якщо код assumes completion (використовує toPromise(), last(), toArray()) — він зависне на WebSocket observable.
- **Factory circular dependencies:** Якщо factory A потребує service B, а service B потребує factory A — Angular кидає circular dependency error. Рішення: forwardRef() або restructuring dependencies.
- **Strategy switch at runtime:** Зміна strategy після initial injection потребує re-injection або imperative update — Angular DI не підтримує hot-swapping injected values.

### Junior vs Senior Understanding

**Junior** знає що "в Angular є patterns" і може назвати Singleton та Observer. Використовує patterns неусвідомлено — підписується на Observable не розуміючи що це Observer pattern з specific semantics.

**Senior** бачить Angular API як composition of patterns і використовує це знання для prediction та troubleshooting. Розуміє що кожен pattern має trade-offs і вибирає свідомо. Будує custom patterns (Facade services, Strategy через DI) для application-level архітектури. Знає коли pattern unnecessary і додає тільки complexity.

### Connections to Other Concepts

- **OOP Principles** — patterns побудовані на ООП (encapsulation, polymorphism, abstraction)
- **SOLID** — більшість patterns реалізують один або кілька SOLID принципів
- **RxJS** — реалізація Observer pattern з rich operator library
- **Angular DI** — реалізація Factory + Singleton + Strategy patterns
- **NgRx** — Mediator (Store), Command (Actions), Observer (Selectors), Memento (DevTools)
- **Signals** — еволюція від Observer до Incremental Computation pattern

## Examples

### Basic Usage

```typescript
// Facade Pattern: спрощений API для складної підсистеми
@Injectable({ providedIn: 'root' })
export class UserFacadeService {
  private readonly userApi = inject(UserApiService);
  private readonly authService = inject(AuthService);
  private readonly cacheService = inject(CacheService);
  private readonly notificationService = inject(NotificationService);

  // Facade приховує складність координації 4 сервісів
  getCurrentUser(): Observable<User> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        const cached = this.cacheService.get<User>(`user:${userId}`);
        if (cached) return of(cached);
        return this.userApi.getById(userId).pipe(
          tap(user => this.cacheService.set(`user:${userId}`, user, 300)),
        );
      }),
      catchError(error => {
        this.notificationService.show('Failed to load user', 'error');
        return EMPTY;
      }),
    );
  }
}

// Strategy Pattern через DI
export abstract class SortStrategy<T> {
  abstract sort(items: T[], field: keyof T, direction: 'asc' | 'desc'): T[];
}

@Injectable()
export class ClientSideSortStrategy<T> implements SortStrategy<T> {
  sort(items: T[], field: keyof T, direction: 'asc' | 'desc'): T[] {
    return [...items].sort((a, b) => {
      const modifier = direction === 'asc' ? 1 : -1;
      return a[field] > b[field] ? modifier : -modifier;
    });
  }
}

@Injectable()
export class ServerSideSortStrategy<T> implements SortStrategy<T> {
  private readonly http = inject(HttpClient);
  private endpoint = '';

  sort(items: T[], field: keyof T, direction: 'asc' | 'desc'): T[] {
    // Trigger server-side sort, return original items
    // Actual sorted data comes through Observable stream
    this.http.get(`${this.endpoint}?sort=${String(field)}&dir=${direction}`);
    return items;
  }
}
```

### Production Scenario

```typescript
// Registry + Factory + Strategy patterns для dynamic component rendering

// Registry: token для реєстрації widget types
interface WidgetRegistration {
  component: Type<any>;
  defaultConfig: Record<string, unknown>;
  category: string;
}

const WIDGET_REGISTRY = new InjectionToken<Map<string, WidgetRegistration>>(
  'Widget Registry',
  {
    factory: () => new Map(),
  },
);

// Функція для реєстрації нових widgets (OCP — extension without modification)
export function provideWidget(
  type: string,
  registration: WidgetRegistration,
): Provider {
  return {
    provide: WIDGET_REGISTRY,
    useFactory: (existingRegistry: Map<string, WidgetRegistration>) => {
      existingRegistry.set(type, registration);
      return existingRegistry;
    },
    deps: [WIDGET_REGISTRY],
  };
}

// Factory: Dynamic component creation
@Injectable({ providedIn: 'root' })
export class WidgetFactoryService {
  private readonly registry = inject(WIDGET_REGISTRY);
  private readonly injector = inject(EnvironmentInjector);

  create(
    type: string,
    container: ViewContainerRef,
    config?: Record<string, unknown>,
  ): ComponentRef<any> | null {
    const registration = this.registry.get(type);
    if (!registration) {
      console.warn(`Widget type "${type}" not registered`);
      return null;
    }

    const mergedConfig = { ...registration.defaultConfig, ...config };
    const componentRef = container.createComponent(registration.component, {
      environmentInjector: this.injector,
    });

    // Apply config to component inputs
    Object.entries(mergedConfig).forEach(([key, value]) => {
      componentRef.setInput(key, value);
    });

    return componentRef;
  }
}

// Observer pattern: Dashboard з reactive widget layout
@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    @for (widget of widgets(); track widget.id) {
      <div class="widget-container" [style.gridArea]="widget.gridArea">
        <ng-container #widgetHost />
      </div>
    }
  `,
})
export class DashboardComponent implements AfterViewInit {
  private readonly widgetFactory = inject(WidgetFactoryService);
  private readonly dashboardService = inject(DashboardService);

  // Signal-based state (Observer evolution)
  widgets = toSignal(this.dashboardService.getLayout(), { initialValue: [] });

  @ViewChildren('widgetHost', { read: ViewContainerRef })
  widgetHosts!: QueryList<ViewContainerRef>;

  ngAfterViewInit(): void {
    // Render widgets when layout changes
    effect(() => {
      const layout = this.widgets();
      this.widgetHosts.forEach((host, index) => {
        host.clear();
        if (layout[index]) {
          this.widgetFactory.create(layout[index].type, host, layout[index].config);
        }
      });
    });
  }
}
```

### Anti-Example

```typescript
// ПОГАНО: Patterns misuse

// Anti-Singleton: stateful global service без lifecycle awareness
@Injectable({ providedIn: 'root' })
export class GlobalStateService {
  // Mutable public state — breaks encapsulation
  public currentUser: User | null = null;
  public cartItems: CartItem[] = [];
  public notifications: Notification[] = [];
  // Accumulates data forever — memory leak in SPA
  public auditLog: AuditEntry[] = [];

  // God service — порушує SRP, не є proper Facade
  addToCart(item: CartItem): void {
    this.cartItems.push(item); // mutation замість immutable update
    this.auditLog.push({ action: 'add_to_cart', timestamp: Date.now() });
    this.notifications.push({ message: `Added ${item.name}` }); // UI logic in data service
  }
}

// Anti-Strategy: switch/case замість DI-based strategy
@Component({ /* ... */ })
export class ReportComponent {
  generateReport(type: string, data: any[]): void {
    // OCP violation — потрібно змінювати цей код для кожного нового типу
    switch (type) {
      case 'pdf':
        this.generatePdf(data);
        break;
      case 'excel':
        this.generateExcel(data);
        break;
      case 'csv':
        this.generateCsv(data);
        break;
      // Кожен новий формат = зміна цього switch
    }
  }
}

// Anti-Observer: manual state synchronization замість reactive streams
@Component({ /* ... */ })
export class UserListComponent {
  users: User[] = [];
  filteredUsers: User[] = [];
  sortedUsers: User[] = [];

  // Imperative state sync — error-prone, race conditions
  onFilterChange(filter: string): void {
    this.filteredUsers = this.users.filter(u => u.name.includes(filter));
    this.sortAndUpdate(); // забудеш викликати — stale data
  }

  onSortChange(field: string): void {
    this.sortedUsers = [...this.filteredUsers].sort(/* ... */);
    // Якщо filter змінився після sort — inconsistent state
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Singleton з mutable public state | State corruption, race conditions, untestable, memory leaks | Private state + public signals/observables, immutable updates |
| switch/case для type-based behavior | OCP violation, забуті cases, growing complexity | Strategy pattern через DI tokens або registry map |
| Manual Observer (callbacks, event flags) | Missed updates, memory leaks, inconsistent state | RxJS Observable / Signal для reactive state management |
| God Facade з 20+ delegated methods | SRP violation disguised as Facade, high coupling | Domain-specific facades: UserFacade, OrderFacade, AuthFacade |
| Factory з hardcoded types | OCP violation, не extensible | Registry pattern + Factory з dynamic lookup |

## Interview Block

### [L1 — Warm-up] Які design patterns ви бачите в Angular framework?

**Signal being tested:** Здатність розпізнавати patterns в щоденних Angular-конструкціях.

**What the interviewer expects:** Мінімум три patterns з конкретними Angular-прикладами. Розуміння що Angular API побудований на patterns, а не просто "є якісь patterns десь".

**How to probe deeper:** "Чим Angular Decorator (@Component) відрізняється від GoF Decorator?", "Який pattern реалізують HTTP interceptors?"

**Reference answer:** Див. frontmatter b0t3q1.

**Common mistakes:** Тільки Singleton і Observer. Плутають TypeScript decorators з GoF Decorator.

### [L2 — Core Understanding] Як Observer pattern реалізований через RxJS та Signals?

**Signal being tested:** Розуміння reactive paradigms в Angular та еволюції від Observable до Signal.

**What the interviewer expects:** Порівняння Observable (push, lazy, async) vs Signal (pull, eager, sync). Знання Subject variants. Розуміння коли використовувати що.

**How to probe deeper:** "Чому Angular не відмовився від RxJS на користь Signals?", "Як працює toSignal() під капотом?"

**Reference answer:** Див. frontmatter b0t3q2.

**Common mistakes:** Вважають Signals повною заміною RxJS. Не розуміють cold vs hot semantics.

### [L2 — Core Understanding] Як Singleton реалізований в Angular DI?

**Signal being tested:** Розуміння DI-managed Singleton та його scope semantics.

**What the interviewer expects:** Пояснення providedIn variants, component-level scoping, lazy module edge cases. Коли singleton шкідливий (SSR, mutable state).

**How to probe deeper:** "Що таке providedIn: 'any' і навіщо воно?", "Як Singleton поводиться в SSR?"

**Reference answer:** Див. frontmatter b0t3q3.

**Common mistakes:** Не знають про scoped singletons. Ігнорують SSR implications.

### [L3 — Advanced] Як Strategy та Factory patterns будують extensible архітектуру?

**Signal being tested:** Вміння комбінувати patterns для вирішення реальних архітектурних задач.

**What the interviewer expects:** Конкретний приклад з DI token як strategy interface, useFactory для dynamic creation, registry для extensibility. Знання Angular-specific implementation details.

**How to probe deeper:** "Як реалізувати hot-swap стратегії в runtime?", "Як handle'ити circular dependencies у factory?"

**Reference answer:** Див. frontmatter b0t3q4.

**Common mistakes:** Реалізують Strategy через if/else. Забувають про DI caching.

### [L4 — Architecture] Спроектуйте dynamic form rendering з кількома design patterns.

**Signal being tested:** Здатність orchestrate'ити кілька patterns в coherent architecture для реальної enterprise задачі.

**What the interviewer expects:** Layered architecture з чітким responsibility assignment: Registry для extensibility, Factory для creation, Strategy для behavior, Observer/Signal для state, Mediator для coordination. Performance та testing considerations.

**How to probe deeper:** "Як handle'ити forms з 100+ полями?", "Як тестувати кожен layer незалежно?"

**Reference answer:** Див. frontmatter b0t3q5.

**Common mistakes:** Монолітний FormComponent. Tight coupling між fields. Ігнорують performance.

## Summary

### Key Points

- Angular framework побудований на GoF design patterns: Observer (RxJS), Singleton (DI), Decorator (annotations), Factory (providers), Strategy (DI tokens), Chain of Responsibility (interceptors), Template Method (lifecycle hooks)
- Observer pattern еволюціонує в Angular: Zone.js (implicit) → RxJS (explicit push) → Signals (explicit pull) — кожне покоління вирішує проблеми попереднього
- Singleton в Angular — DI-managed, не class-managed: scope визначається injector level, не static instance
- Strategy pattern через DI tokens дозволяє runtime-вибір алгоритму без if/else та з повною testability
- Factory pattern в Angular: useFactory для DI, createComponent() для dynamic rendering, createEnvironmentInjector() для scoped DI contexts
- Facade pattern — ідіоматичний Angular approach для simplifying complex service interactions
- Patterns — це tools, не goals: використовувати коли вирішують реальну проблему, уникати over-engineering

### Elevator Pitch (2 minutes)

"Angular — це framework побудований на design patterns. Кожна Angular-конструкція — це pattern в дії: Observable — Observer, providedIn: 'root' — Singleton, @Component — Decorator, useFactory — Factory, DI token з різними реалізаціями — Strategy, interceptors — Chain of Responsibility, lifecycle hooks — Template Method. Розуміння цих patterns дозволяє передбачити поведінку Angular API, troubleshoot'ити проблеми, і будувати application-level архітектуру використовуючи ті ж patterns: Facade для simplification, Strategy для extensibility, Registry + Factory для plugin systems. Angular еволюціонує від Observer (RxJS) до Incremental Computation (Signals), і розуміння цієї еволюції — ключ до написання сучасного Angular-коду."
