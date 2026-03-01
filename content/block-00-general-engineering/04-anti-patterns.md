---
title: "Anti-Patterns & Code Smells"
block: 0
topic: 4
slug: "anti-patterns"
difficulty: 3
tags: ["anti-patterns", "code-smells", "god-class", "spaghetti-code", "premature-optimization", "technical-debt"]
relatedTopics: ["solid-principles", "design-patterns", "oop-principles"]
interviewQuestions:
  - level: "junior"
    question: "Що таке code smell і чим він відрізняється від бага?"
    referenceAnswers:
      junior: "Code smell — це ознака поганої структури коду, яка не є помилкою, але може призвести до проблем у майбутньому. На відміну від бага, code smell не ламає функціональність, але ускладнює підтримку коду."
      mid: "Code smell — це поверхневий індикатор глибшої структурної проблеми. Баг — це некоректна поведінка програми, а smell — це патерн коду, який порушує принципи чистого дизайну. Наприклад, метод на 200 рядків працює коректно, але є Long Method smell, бо ускладнює тестування та розуміння. Code smells часто є симптомами порушення SOLID-принципів."
      senior: "Code smell — це евристика, яка сигналізує про потенційне порушення дизайну, вперше каталогізована Мартіном Фаулером у 'Refactoring'. Важливо розуміти, що smell — не абсолютне зло: іноді Long Method виправданий для performance-critical коду. Ключова відмінність від бага: smell не має конкретного тест-кейсу, який фейлиться, але збільшує cognitive load та coupling. В Angular контексті типовий smell — компонент із 15+ інжектованими сервісами, що сигналізує про God Component. Senior розуміє, що smell потрібно оцінювати в контексті: тимчасовий workaround у feature branch — допустимо, той самий код у shared library — ні. Рефакторинг smells має бути data-driven: спершу metrics (cyclomatic complexity, afferent coupling), потім action."
      staff: "Code smell — це каталогізована евристика, що вказує на порушення фундаментальних принципів дизайну. Staff-інженер розглядає smells на системному рівні: один God Component — це локальна проблема, але якщо команда систематично створює God Components — це organizational smell, що вказує на відсутність архітектурних guidelines або review-процесу. Важливо розрізняти три рівні: code-level smells (Long Method, Feature Envy), design-level smells (God Class, Shotgun Surgery), architecture-level smells (Circular Dependencies між модулями, Knot coupling). В Angular-екосистемі я класифікую smells за впливом на збірку: smells що збільшують bundle size (barrel file re-exports), smells що уповільнюють CD (зайві підписки в template), smells що блокують tree-shaking (ambient dependencies). Стратегія роботи зі smells: automated detection через ESLint rules та custom Nx workspace lint rules, tracking через SonarQube quality gates, та поступовий рефакторинг через ADR (Architecture Decision Records). Smell — це leading indicator технічного боргу, а баг — lagging indicator."
    commonMistakes:
      - "Вважають, що кожен code smell обов'язково потрібно негайно виправляти"
      - "Плутають code smell з anti-pattern — smell це симптом, anti-pattern це конкретне помилкове рішення"
    relatedQuestions: ["b0t4q2", "b0t4q3"]
  - level: "mid"
    question: "Як розпізнати God Component в Angular і які стратегії його декомпозиції?"
    referenceAnswers:
      junior: "God Component — це компонент, який робить занадто багато: має багато методів, великий template і багато залежностей. Щоб виправити, потрібно розбити його на менші компоненти."
      mid: "God Component в Angular — це компонент із ознаками: більше 300-400 рядків TypeScript, 5+ інжектованих сервісів, template з кількома незалежними секціями UI. Декомпозиція включає: виділення presentational components для чистого UI, створення container/smart компонентів для логіки, винесення бізнес-логіки у сервіси або facades. Наприклад, DashboardComponent з графіками, таблицями та фільтрами слід розбити на DashboardChartComponent, DashboardTableComponent та DashboardFiltersComponent."
      senior: "God Component порушує Single Responsibility Principle і створює кілька конкретних проблем: неможливість granular change detection (весь компонент перевіряється при будь-якій зміні), неможливість lazy loading окремих частин UI, collision-prone файли при роботі команди, exponential зростання тестів. Стратегії декомпозиції: 1) Extract Presentational — виділити чисті Input/Output компоненти без DI; 2) Extract Facade Service — забрати orchestration-логіку в injectable service; 3) Extract Feature Library — при використанні Nx, виділити цілий domain у бібліотеку. Важливо: після виділення container component має координувати child components через Input/Output або shared service, а не через прямі ViewChild-маніпуляції. В контексті signals (Angular 17+): декомпозиція спрощується через computed() та effect() — можна виділити логіку в injectable service зі signal-based state без RxJS ceremony."
      staff: "God Component — це архітектурний smell, який я аналізую через три лінзи: coupling (скільки модулів знає про internals компонента), cohesion (чи всі методи працюють з одним domain concept), та change frequency (чи змінюються різні частини з різних причин — Shotgun Surgery). На рівні організації God Component виникає через відсутність bounded contexts: команда не має спільної мови для domain decomposition. Моя стратегія: спершу Strangler Fig pattern — створюємо нові компоненти поруч і поступово переносимо функціональність, тримаючи God Component як facade. Технічно: використовую Angular CDK PortalModule або новий @defer для поступової декомпозиції без breaking changes. Метрики для відстеження: lines of code, number of injected dependencies (через custom ESLint rule), template cyclomatic complexity, та найважливіше — change coupling через git log analysis (файли, що змінюються разом). При переході на signals архітектура спрощується: замість God Component з десятками BehaviorSubject, створюємо SignalStore (NgRx) або lightweight signal services. Кожен slice стає окремим injectable token. Це також покращує SSR performance, бо signal-based components мають predictable reactivity graph."
    commonMistakes:
      - "Декомпозиція лише за візуальним розміром, ігноруючи cohesion"
      - "Створення занадто дрібних компонентів (Micro Component smell) — компонент з одним div"
      - "Використання ViewChild для комунікації після декомпозиції замість Input/Output"
    relatedQuestions: ["b0t4q1", "b0t4q4"]
  - level: "mid"
    question: "Які найпоширеніші витоки підписок (subscription leaks) в Angular і як їх уникнути?"
    referenceAnswers:
      junior: "Якщо не відписатися від Observable в ngOnDestroy, підписка залишається в пам'яті. Щоб уникнути цього, можна використовувати async pipe або takeUntilDestroyed."
      mid: "Subscription leaks виникають коли компонент знищується, але Observable продовжує емітити і callback тримає reference на знищений компонент. Основні стратегії уникнення: 1) async pipe в template — автоматично відписується; 2) takeUntilDestroyed() з Angular 16+ — найчистіший підхід; 3) DestroyRef.onDestroy() для manual cleanup. Важливо знати: HTTP-запити (HttpClient) автоматично complete після відповіді, тому їх не потрібно відписувати. Але якщо HTTP observable проходить через switchMap з довгоживучим source — leak можливий."
      senior: "Subscription leak — це специфічний вид memory leak, де GC не може зібрати компонент через замикання (closure) в subscription callback, яке тримає reference на this. Детальний аналіз: 1) Router events — довгоживучий Observable, обов'язково cleanup; 2) FormControl.valueChanges — живе довше за компонент якщо FormGroup shared через сервіс; 3) Subject у сервісі — якщо сервіс provided in root, Subject живе весь lifetime аплікації; 4) WebSocket/SSE streams — потребують explicit cleanup. Стратегії за пріоритетом: declarative (async pipe + signals) > takeUntilDestroyed() > DestroyRef > manual Subject + takeUntil > subscription.unsubscribe(). Ключовий edge case: takeUntilDestroyed() повинен викликатися в injection context (конструктор або field initializer), інакше — runtime error. Для діагностики: Chrome DevTools Heap Snapshot — шукати detached DOM nodes, або використовувати Angular DevTools Profiler для відстеження кількості subscription."
      staff: "Subscription leaks — це системна проблема, яку потрібно вирішувати на рівні архітектури, а не на рівні окремих компонентів. Мій підхід: 1) Architectural: максимально використовувати signals та computed() замість RxJS для component-local state — signals автоматично cleanup через DestroyRef; 2) Lint enforcement: custom ESLint rule що забороняє .subscribe() в компонентах (дозволяємо лише в effects/resolvers); 3) RxJS operator discipline: весь RxJS залишається в сервісах, компоненти отримують signals через toSignal(). На рівні фреймворку Angular internally використовує EnvironmentInjector.onDestroy для cleanup framework-level subscriptions. Zone.js патчить addEventListener/removeEventListener для tracking, але RxJS subscriptions — поза його scope. Важливий нюанс: у SSR контексті (Angular Universal / новий SSR в v17+) subscription leaks особливо небезпечні — вони накопичуються між requests бо Node.js process persistent. Для legacy-кодовиз великою кількістю .subscribe() я використовую поступову міграцію: спершу додаємо takeUntilDestroyed(), потім refactor на async pipe, потім на signals. Метрики: відстежуємо memory consumption per route через Lighthouse CI, tracking detached DOM nodes count в E2E тестах. При code review головне питання: 'чи є lifecycle tie — хто відповідає за cleanup?'"
    commonMistakes:
      - "Вважають що всі Observable потрібно unsubscribe (HTTP-запити complete самостійно)"
      - "Використовують takeUntil без передачі Subject в notifier"
      - "Забувають що takeUntilDestroyed() вимагає injection context"
    relatedQuestions: ["b0t4q2", "b0t4q4"]
  - level: "senior"
    question: "Як NgModule bloat впливає на performance і якими метриками це виміряти? Як standalone-компоненти вирішують цю проблему?"
    referenceAnswers:
      junior: "NgModule bloat — це коли модуль імпортує занадто багато речей. Standalone-компоненти вирішують це, бо не потребують модулів. Це зменшує bundle size."
      mid: "NgModule bloat виникає коли SharedModule реекспортує десятки компонентів, з яких конкретний consumer використовує лише 2-3. Це заважає tree-shaking, бо webpack/esbuild бачить import цілого модуля. Standalone-компоненти дозволяють імпортувати лише потрібне напряму. Метрики: initial bundle size через ng build --stats-json + webpack-bundle-analyzer, та кількість unused declarations через depcheck. Angular compiler оптимізує краще коли imports granular."
      senior: "NgModule bloat — це архітектурний anti-pattern з кількома вимірами: 1) Bundle size — SharedModule змушує включати всі declarations навіть якщо consumer використовує одну pipe. Компілятор Angular (ngc) генерує NgModuleFactory з references на всі declarations, що робить tree-shaking неможливим для unused components всередині модуля. 2) Compilation speed — кожен NgModule збільшує compilation graph; Angular compiler мусить resolve всі transitive imports. 3) Testing overhead — TestBed.configureTestingModule з fat module imports уповільнює юніт-тести. Standalone-компоненти вирішують це: кожен компонент декларує свої залежності через imports array, що дає compiler точну інформацію для tree-shaking. Метрики: source-map-explorer для per-component analysis, Lighthouse Performance score, Time to Interactive, та compilation time (ng build --verbose). Важливо: навіть з standalone, barrel files (index.ts) можуть re-introduce bloat якщо side-effects присутні."
      staff: "NgModule bloat — це наслідок фундаментального trade-off в original Angular architecture: модулі були compilation scope, і Angular compiler потребував їх для template type-checking. Це створювало coupling між 'what you declare' та 'what gets bundled'. Internally, NgModuleFactory містить масив усіх component factories, що робить partial tree-shaking неможливим. З переходом на Ivy (v9+) compiler почав генерувати per-component instructions замість per-module factories, але NgModule семантика все ще змушувала bundler включати transitive imports. Standalone-компоненти (stable v15) фінально розділили compilation scope та bundling scope. Метрики які я відстежую: 1) Initial JS payload per route (budget: <170KB gzipped для 3G), 2) Module boundary coupling через Nx dep-graph, 3) Lazy chunk count та duplication factor, 4) Build time regression tracking в CI. Стратегія міграції з fat NgModules: спершу ng generate @angular/core:standalone — automated migration, потім manual review barrel files (кожен re-export — потенційний tree-shaking blocker), далі перевести SharedModule на набір standalone-функцій з explicit imports. На організаційному рівні: встановити Nx module boundary rules що не дозволяють circular dependencies та enforce single-responsibility per library. Budget enforcement через Angular CLI budgets у angular.json та custom Lighthouse CI assertions."
    commonMistakes:
      - "Вважають що standalone автоматично вирішує всі проблеми з bundle size"
      - "Ігнорують barrel file re-exports як джерело bloat"
      - "Не використовують source-map-explorer для аналізу реального bundle composition"
    relatedQuestions: ["b0t4q3", "b0t4q5"]
  - level: "staff"
    question: "Як ви побудуєте систему automated detection та prevention anti-patterns на рівні організації з 20+ Angular-проєктами?"
    referenceAnswers:
      junior: "Можна використовувати ESLint для перевірки коду і налаштувати правила в CI/CD, щоб автоматично знаходити проблеми."
      mid: "Потрібно налаштувати ESLint з Angular-specific правилами (angular-eslint), додати їх у CI pipeline щоб блокувати merge при порушеннях. Також можна використовувати SonarQube для трекінгу code smells та технічного боргу. Для командних стандартів — створити shared ESLint config як npm-пакет. Code review процес також допомагає виявляти anti-patterns."
      senior: "Система detection повинна працювати на кількох рівнях: 1) IDE-time: shared ESLint config з custom rules (наприклад, max-injected-deps, no-subscribe-in-component, no-logic-in-template); 2) Pre-commit: husky + lint-staged для швидкого feedback; 3) CI: повний lint + SonarQube quality gates з blocking thresholds; 4) Post-deploy: runtime monitoring memory leaks через Sentry. Custom ESLint rules можна писати використовуючи @typescript-eslint/utils для AST traversal — наприклад, rule що виявляє компоненти з більше ніж N constructor parameters. Для Nx monorepo: module boundary rules + dep-graph constraints. Важливо мати 'anti-pattern registry' — документ з описом кожного виявленого anti-pattern, його severity та recommended fix."
      staff: "Побудова organizational-level anti-pattern prevention — це sociotechnical problem, не purely technical. Мій підхід має 4 шари: 1) Tooling Layer: shared Nx plugin з custom ESLint rules, generators та executors. Rules: no-god-component (>N lines + >M deps), no-subscription-leak (detect .subscribe() without takeUntil/takeUntilDestroyed), enforce-standalone, no-barrel-side-effects. Публікуємо як internal npm package з semver — teams opt-in per major version. 2) CI/CD Layer: quality gates в SonarQube з organization-wide profile, Lighthouse CI budgets, bundle size regression detection через bundlesize або size-limit, dependency cruiser для circular dependency detection. 3) Observability Layer: runtime tracking через custom Angular ErrorHandler що відправляє в Sentry, memory leak detection через PerformanceObserver API, та custom Angular DevTools extension для team-specific metrics. 4) Organizational Layer: Architecture Decision Records (ADRs) для кожного нового pattern, Architecture Guild що рев'ює cross-cutting concerns, quarterly 'Tech Debt Sprint' з метриками до/після. Critical success factor: кожен detection rule повинен мати auto-fix або codemod де можливо — blocking rule без migration path створює frustration. Metrics dashboard: % projects on latest shared config, average SonarQube debt ratio, trend of subscription leak incidents, bundle size trend per project. Я уникаю 'big bang enforcement' — натомість поступовий rollout: warning → error on new code → error on all code, з 2-sprint migration windows."
    commonMistakes:
      - "Впровадження лише tooling без organizational buy-in"
      - "Створення blocking rules без auto-fix або migration path"
      - "Ігнорування runtime detection — лише static analysis"
    relatedQuestions: ["b0t4q4", "b0t4q1"]
---

## Core Concept

**English definition:** Anti-patterns are commonly occurring solutions to problems that are ineffective, counterproductive, or create more problems than they solve. Code smells are surface-level indicators in code that suggest deeper structural or design issues.

**Пояснення:** Anti-pattern — це "перевірений спосіб зробити неправильно". На відміну від простої помилки, anti-pattern виглядає як розумне рішення, але створює системні проблеми з часом. Code smell — це симптом: він не ламає код, але вказує на порушення принципів дизайну. Каталогізація Martin Fowler (Refactoring, 1999) та Gang of Four дала індустрії спільну мову для обговорення проблем коду: God Class, Shotgun Surgery, Feature Envy, Primitive Obsession — кожен із них має конкретний refactoring recipe.

**Яку проблему вирішує:** Розпізнавання anti-patterns дозволяє: 1) приймати усвідомлені trade-off рішення замість випадкових, 2) зменшувати cognitive load для нових членів команди, 3) прогнозувати maintenance cost ще на етапі code review, 4) формувати спільну мову для технічних дискусій у команді. Без цієї мови обговорення перетворюється на "мені не подобається цей код" vs конкретне "тут Feature Envy — component читає дані з сервісу та трансформує їх, ця логіка має бути в сервісі".

**Як працює під капотом:** Anti-patterns працюють на рівні абстракцій та зв'язків між компонентами системи. God Class створює hub-and-spoke coupling topology — один центральний файл, від якого залежить все. Shotgun Surgery — навпаки, розкидає одну відповідальність по багатьох файлах. Formally, більшість anti-patterns можна описати через порушення coupling/cohesion метрик: afferent coupling (Ca) — скільки модулів залежать від нас, efferent coupling (Ce) — від скількох модулів залежимо ми, та instability metric I = Ce/(Ca+Ce).

**Trade-offs та обмеження:** Не кожен code smell вимагає негайного рефакторингу. Premature refactoring — сам по собі anti-pattern. God Component у prototype — допустимо. Той самий God Component у shared library — неприпустимо. Контекст визначає severity: lifetime коду (throwaway vs long-lived), team size (solo vs 50 engineers), та deployment frequency. Over-engineering (надмірна абстракція для "чистоти") — це anti-pattern відповідь на code smells.

**Як Angular це використовує:** Angular framework internally має чіткі приклади як архітектурних рішень, так і еволюції від anti-patterns. NgModule був архітектурним compromise — одна абстракція для compilation scope, DI scope, та bundling scope (порушення SRP), тому Angular team створила standalone API. `ChangeDetectorRef` injection у компонент — Temporal Coupling smell (порядок виклику detectChanges/markForCheck має значення), що мотивувало перехід на signals з automatic tracking. Angular compiler (ngc/ngtsc) використовує visitor pattern для traversal template AST, уникаючи God Function anti-pattern в парсері. Zone.js monkey-patching — сам по собі global state anti-pattern, тому Angular 18+ пропонує zoneless change detection через `provideExperimentalZonelessChangeDetection()`.

## Deep Details

### Edge Cases

1. **Circular Dependency через Barrel Files** — `index.ts` що реекспортує все із директорії може створити circular imports якщо два модулі імпортують один одного через barrel. Angular compiler видає `WARNING in Circular dependency detected`, але цей warning часто ігнорується. В runtime це може призвести до `undefined` imports.

2. **Tight Coupling через Constructor Injection** — Angular DI може маскувати tight coupling: компонент інжектує 10 сервісів через constructor, і це виглядає "чисто" (DI ж!), але по суті це God Component з прихованим coupling.

3. **`any` Abuse — Silent Type Erosion** — Використання `any` в одному місці поширюється по type inference chain: `const data: any` робить все що залежить від `data` теж implicitly `any`. TypeScript strict mode не рятує якщо `any` проникає через API boundaries.

4. **Memory Leak через Closure** — Subscription callback замикає `this` компонента. Навіть після `ngOnDestroy`, якщо Observable не complete, GC не може зібрати компонент бо closure тримає reference.

### Junior vs Senior Understanding

**Junior** бачить anti-pattern як "поганий код, який потрібно переписати". Знає кілька назв (God Class, Spaghetti Code), але не може пояснити mechanism шкоди.

**Senior** розуміє системну природу anti-patterns:
- **Причини виникнення**: God Component виникає не через лінь, а через відсутність bounded contexts у domain model. Якщо команда не має shared understanding де boundary між User domain та Payment domain, все стікається в один компонент.
- **Метрики виявлення**: cyclomatic complexity >10 для методу, >500 LOC для компонента, >5 injected dependencies, afferent coupling >8.
- **Refactoring strategies**: не Big Bang rewrite, а Strangler Fig — поступова заміна. Кожен refactoring commit має бути deployable.
- **Prevention**: ESLint rules як executable architecture decisions, не документ який ніхто не читає.

**Staff** бачить anti-patterns як organizational signals: якщо команда систематично створює God Components — проблема не в інженерах, а в архітектурному процесі (відсутність ADR, немає architecture review, немає guidelines).

### Connections to Other Concepts

- **SOLID Principles** (`solid-principles`): кожен anti-pattern — це порушення одного або кількох SOLID принципів. God Component порушує SRP та ISP. Tight coupling порушує DIP.
- **Design Patterns** (`design-patterns`): anti-patterns часто виникають при неправильному застосуванні patterns. Facade що стає God Class. Observer (RxJS) без cleanup що стає memory leak.
- **OOP Principles** (`oop-principles`): Feature Envy порушує encapsulation — компонент маніпулює internal state сервісу замість делегування.

## Examples

### Basic Usage

Розпізнавання God Component за об'єктивними критеріями:

```typescript
// GOD COMPONENT — класичні ознаки
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html', // 400+ рядків template
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Smell #1: Забагато інжектованих залежностей (>5)
  constructor(
    private userService: UserService,
    private analyticsService: AnalyticsService,
    private chartService: ChartService,
    private filterService: FilterService,
    private exportService: ExportService,
    private notificationService: NotificationService,
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef, // Smell #2: Manual CD
  ) {}

  // Smell #3: Component manages multiple domains
  users: User[] = [];
  charts: ChartConfig[] = [];
  filters: FilterState = {};
  exportProgress = 0;
  notifications: Notification[] = [];

  // Smell #4: 20+ methods mixing concerns
  ngOnInit() { /* 50 рядків ініціалізації */ }
  loadUsers() { /* ... */ }
  applyFilter() { /* ... */ }
  refreshCharts() { /* ... */ }
  exportToPdf() { /* ... */ }
  handleNotification() { /* ... */ }
  checkPermissions() { /* ... */ }
  // ... ще 15 методів
}
```

### Production Scenario

Декомпозиція God Component через feature-based architecture:

```typescript
// AFTER: Container component координує через signals
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardChartsComponent,
    DashboardFiltersComponent,
    DashboardUsersTableComponent,
    DashboardExportComponent,
  ],
  template: `
    <app-dashboard-filters
      (filterChange)="dashboardStore.updateFilters($event)" />
    <app-dashboard-charts
      [data]="dashboardStore.chartData()" />
    <app-dashboard-users-table
      [users]="dashboardStore.filteredUsers()" />
    <app-dashboard-export
      [data]="dashboardStore.exportableData()" />
  `,
})
export class DashboardComponent {
  // Single responsibility: orchestration
  protected dashboardStore = inject(DashboardStore);
}

// Feature store encapsulates business logic
@Injectable()
export class DashboardStore {
  private userService = inject(UserService);
  private analyticsService = inject(AnalyticsService);

  // Signal-based state — automatic cleanup, no subscription leaks
  private readonly _users = signal<User[]>([]);
  private readonly _filters = signal<FilterState>({});

  readonly filteredUsers = computed(() =>
    this._users().filter(u => this.matchesFilter(u, this._filters()))
  );

  readonly chartData = computed(() =>
    this.analyticsService.buildChartData(this.filteredUsers())
  );

  readonly exportableData = computed(() => ({
    users: this.filteredUsers(),
    charts: this.chartData(),
  }));

  updateFilters(filters: FilterState): void {
    this._filters.set(filters);
  }

  private matchesFilter(user: User, filters: FilterState): boolean {
    // Pure function — easy to test
    return !filters.role || user.role === filters.role;
  }
}
```

### Anti-Example

Subscription leak та `any` abuse:

```typescript
// BAD: Multiple anti-patterns in one component
@Component({
  selector: 'app-user-list',
  template: `
    <div *ngFor="let user of users">
      <!-- Smell: calling method in template = CD performance issue -->
      {{ getFullName(user) }}
      {{ formatDate(user.createdAt) }}
    </div>
  `,
})
export class UserListComponent implements OnInit {
  users: any[] = []; // Anti-pattern: any abuse

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // Anti-pattern #1: Subscription leak — route.params is long-lived
    this.route.params.subscribe((params: any) => {
      // Anti-pattern #2: HTTP call inside subscription without switchMap
      // If params change rapidly — multiple concurrent requests
      this.http.get(`/api/users?role=${params.role}`).subscribe(
        (data: any) => {
          this.users = data; // any spreads through the codebase
        }
      );
    });
  }

  // Anti-pattern #3: Method called from template on every CD cycle
  getFullName(user: any): string {
    return `${user.firstName} ${user.lastName}`;
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleDateString('uk-UA');
  }
  // Missing ngOnDestroy — no cleanup
}

// GOOD: Fixed version
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    @for (user of users(); track user.id) {
      <div>
        {{ user.fullName }}
        {{ user.createdAt | date:'longDate':'':'uk' }}
      </div>
    }
  `,
})
export class UserListComponent {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  // Declarative: toSignal handles cleanup automatically
  private readonly role = toSignal(
    this.route.params.pipe(map(p => p['role'] as UserRole)),
  );

  // switchMap cancels previous request on new params
  readonly users = toSignal(
    toObservable(this.role).pipe(
      filter(Boolean),
      switchMap(role => this.userService.getByRole(role)),
    ),
    { initialValue: [] },
  );
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| **God Component** (>300 LOC, >5 deps) | Неможливість granular testing, CD overhead, merge conflicts | Декомпозиція на container + presentational components, виділення facade service |
| **Subscription Leak** (.subscribe() без cleanup) | Memory leak, zombie callbacks після navigation, unexpected side effects | `async` pipe, `toSignal()`, `takeUntilDestroyed()` |
| **`any` Abuse** (type assertions, unknown→any) | Вимикає type checking по всьому ланцюжку inference, баги знаходяться лише в runtime | Strict types, generics, `unknown` + type guards, Zod schema validation |
| **NgModule Bloat** (SharedModule з 50+ exports) | Tree-shaking неможливий, increased initial bundle, slow compilation | Standalone components з granular imports, feature libraries |
| **Over-Engineering** (абстракція заради абстракції) | Збільшує cognitive load, indirection без value, harder to debug | YAGNI принцип, абстрагувати лише при 3+ repetitions (Rule of Three) |

## Interview Block

### [L1 — Warm-up] Що таке code smell і чим він відрізняється від бага?
**Signal being tested:** Чи має кандидат vocabulary для обговорення якості коду, чи може категоризувати проблеми.
**What the interviewer expects:** Розуміння що smell — це евристика якості дизайну, а не помилка виконання. Кандидат має назвати 2-3 конкретних smell.
**How to probe deeper:** "Наведи приклад code smell в Angular-проєкті, який ти бачив на практиці. Як ти вирішив, що це саме smell, а не просто інший стиль коду?"
**Reference answer:** Code smell — це ознака поганої структури коду, яка не є помилкою (код працює), але сигналізує про проблеми maintainability. Наприклад, компонент із 10 injected сервісами — це God Component smell. Баг має конкретний failing test case, smell — ні, але smell збільшує ймовірність майбутніх багів та ускладнює onboarding нових розробників.
**Common mistakes:** Плутають smell з anti-pattern. Не можуть назвати конкретних прикладів. Вважають що кожен smell — це баг який треба негайно фіксити.

### [L2 — Mid] Як розпізнати God Component в Angular і які стратегії його декомпозиції?
**Signal being tested:** Чи може кандидат аналізувати архітектуру компонента за об'єктивними критеріями та запропонувати конкретний план рефакторингу.
**What the interviewer expects:** Конкретні метрики (LOC, dependency count), знання container/presentational pattern, розуміння що декомпозиція — не лише візуальне розбиття.
**How to probe deeper:** "Ти виділив 5 child components з God Component. Як вони тепер комунікують? Що якщо їм потрібен shared state?"
**Reference answer:** God Component розпізнається за: >300 LOC TypeScript, >5 injected services, template з кількома незалежними UI-секціями, клас що змінюється з різних причин (порушення SRP). Стратегія декомпозиції: 1) виділити presentational components для чистого UI (Input/Output only); 2) створити facade service або signal store для бізнес-логіки; 3) залишити container component лише для orchestration. Комунікація через Input/Output або shared signal-based store, не через ViewChild маніпуляції.
**Common mistakes:** Декомпозиція лише за розміром template, ігноруючи cohesion. Створення micro-components (div-wrapper). Використання ViewChild для communication після декомпозиції.

### [L2 — Mid] Які найпоширеніші витоки підписок (subscription leaks) в Angular і як їх уникнути?
**Signal being tested:** Розуміння lifecycle Observable та component, knowledge of Angular-specific cleanup mechanisms.
**What the interviewer expects:** Знання які Observable потребують cleanup (router, forms, subjects) а які ні (HTTP), та пріоритизація стратегій (declarative > imperative).
**How to probe deeper:** "Чому takeUntilDestroyed() вимагає injection context? Що відбудеться якщо викликати його в ngOnInit?"
**Reference answer:** Subscription leak виникає коли Observable продовжує емітити після знищення компонента, тримаючи reference через closure. Найнебезпечніші: Router events, FormControl.valueChanges у shared service, Subject у root-provided service, WebSocket streams. HTTP-запити автоматично complete. Стратегії за пріоритетом: signals + toSignal() (automatic cleanup) > async pipe > takeUntilDestroyed() > DestroyRef > manual unsubscribe. takeUntilDestroyed() вимагає injection context бо internally використовує inject(DestroyRef).
**Common mistakes:** Unsubscribe від HTTP-запитів (не потрібно). takeUntilDestroyed() поза конструктором. Накопичення Subscription[] масиву замість використання declarative підходів.

### [L3 — Senior] Як NgModule bloat впливає на performance і якими метриками це виміряти?
**Signal being tested:** Розуміння зв'язку між module architecture та runtime/build performance, знання tooling для measurement.
**What the interviewer expects:** Пояснення механізму: чому NgModule блокує tree-shaking (NgModuleFactory references), конкретні метрики та інструменти, розуміння як standalone вирішує проблему на рівні компілятора.
**How to probe deeper:** "Ти мігрував на standalone components. Bundle size не зменшився. Які ще фактори можуть впливати?"
**Reference answer:** NgModule bloat виникає тому що NgModuleFactory тримає references на всі declarations — bundler не може видалити unused components зсередини модуля. SharedModule з 30 exports де consumer використовує 2 — весь SharedModule потрапляє в bundle. Метрики: source-map-explorer для per-module analysis, Lighthouse TTI/TBT, ng build --stats-json + webpack-bundle-analyzer, compilation time через --verbose. Standalone-компоненти вирішують це: compiler бачить точний граф залежностей per-component. Але barrel files (index.ts) можуть нівелювати це якщо мають side-effects або re-export все. Міграція: ng generate @angular/core:standalone, потім manual audit barrel files.
**Common mistakes:** Вважають що standalone автоматично зменшує bundle (без аудиту barrel files — ні). Не знають source-map-explorer. Ігнорують compilation time як метрику.

### [L4 — Staff/Principal] Як ви побудуєте систему automated detection та prevention anti-patterns на рівні організації з 20+ Angular-проєктами?
**Signal being tested:** System-level thinking — чи може кандидат побудувати multi-layer prevention strategy що працює на масштабі організації, балансуючи strictness та developer experience.
**What the interviewer expects:** Чіткий multi-layer підхід (IDE → pre-commit → CI → runtime), розуміння що tooling без organizational buy-in не працює, конкретні технології та метрики, стратегія поступового rollout.
**How to probe deeper:** "Команда скаржиться що нові ESLint rules блокують їхній sprint delivery. Як ти балансуєш quality enforcement та velocity?"
**Reference answer:** Чотири шари: 1) IDE-time — shared ESLint config як npm package з custom rules (max-injected-deps, no-subscribe-in-component), Nx workspace lint rules для module boundaries; 2) CI — SonarQube quality gates, bundle size regression через size-limit, dependency-cruiser для circular deps; 3) Runtime — custom ErrorHandler для Sentry, PerformanceObserver tracking; 4) Organizational — Architecture Decision Records, Architecture Guild, quarterly Tech Debt sprints. Кожна blocking rule повинна мати auto-fix де можливо. Rollout поступовий: warning → error on new code → error on all (з migration window). Метрики: % projects on latest config, SonarQube debt ratio trend, subscription leak incidents, bundle size trend. Критично: це sociotechnical problem — tooling без buy-in від team leads не працює.
**Common mistakes:** Лише tooling без organizational process. Big bang enforcement без migration path. Ігнорування runtime detection. Не мають метрик ефективності самої prevention системи.

## Summary

### Key Points
- Anti-pattern — це повторювана помилкова практика, яка виглядає як рішення, але створює нові проблеми; code smell — поверхневий індикатор глибшої structural issue
- God Component в Angular розпізнається за об'єктивними метриками: >300 LOC, >5 injected deps, template з кількома незалежними секціями
- Subscription leaks — найпоширеніший Angular-specific anti-pattern; пріоритет стратегій: signals/toSignal() > async pipe > takeUntilDestroyed() > manual cleanup
- NgModule bloat блокує tree-shaking через NgModuleFactory references; standalone components розділяють compilation scope та bundling scope
- `any` abuse вимикає TypeScript type inference по всьому ланцюжку залежностей — використовуйте `unknown` + type guards
- Over-engineering (абстракція заради абстракції) — це anti-pattern response на code smells; YAGNI та Rule of Three як контрбаланс
- Prevention працює лише як multi-layer system: IDE → pre-commit → CI → runtime → organizational process

### Elevator Pitch (2 minutes)

Anti-patterns і code smells — це vocabulary для обговорення якості коду. В Angular-контексті найкритичніші: God Component (порушує SRP, блокує granular CD та lazy loading), subscription leaks (memory leaks через нечищені Observable subscriptions), NgModule bloat (заважає tree-shaking), та `any` abuse (руйнує type safety). Рішення: декомпозиція на container + presentational components з signal-based state management, declarative підхід до subscriptions через toSignal()/async pipe, міграція на standalone для granular bundling. На рівні організації — ESLint custom rules як executable architecture decisions, CI quality gates, та поступовий enforcement з migration paths. Ключове розуміння: anti-pattern це не "поганий код", а системний indicator архітектурної проблеми, і вирішувати його потрібно на відповідному рівні — від рефакторингу конкретного компонента до зміни процесу прийняття архітектурних рішень.
