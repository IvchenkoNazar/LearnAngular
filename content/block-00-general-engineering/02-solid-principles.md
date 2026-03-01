---
title: "SOLID Principles for Angular Developers"
block: 0
topic: 2
slug: "solid-principles"
difficulty: 3
tags: ["solid", "srp", "ocp", "lsp", "isp", "dip", "dependency-injection"]
relatedTopics: ["oop-principles", "dependency-injection", "design-patterns"]
interviewQuestions:
  - level: "junior"
    question: "Що таке SOLID і навіщо ці принципи потрібні в Angular-розробці?"
    referenceAnswers:
      junior: "SOLID — це п'ять принципів об'єктно-орієнтованого дизайну: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Вони допомагають писати код, який легше підтримувати та розширювати."
      mid: "SOLID — це п'ять принципів які формалізують best practices об'єктно-орієнтованого дизайну. В Angular вони мають прямі прояви: SRP — компоненти тільки для presentation, логіка в сервісах. OCP — розширення через DI providers без зміни існуючого коду. LSP — будь-яка реалізація injectable сервісу повинна бути взаємозамінною. ISP — granular interfaces для сервісів. DIP — залежність від абстракцій через DI tokens. Дотримання SOLID в Angular зменшує coupling і спрощує тестування."
      senior: "SOLID в контексті Angular — це не просто теоретичні принципи, а архітектурні guidelines вбудовані в сам framework. SRP проявляється в Angular component model: компонент відповідає за presentation, сервіс — за бізнес-логіку, guard — за авторизацію, resolver — за prefetch даних. Angular compiler навіть enforce'ить це — компонент не може бути одночасно сервісом. OCP реалізується через Angular DI: HTTP_INTERCEPTORS, APP_INITIALIZER, ROUTES — все це extension points де можна додавати функціональність без модифікації core. LSP критичний для DI: якщо ви provide'ите MockUserService замість UserService, весь застосунок повинен працювати коректно. ISP в Angular — це роздільні injectable tokens замість одного God-сервісу. DIP — фундамент Angular DI де компоненти залежать від токенів (абстракцій), а не від конкретних класів."
      staff: "SOLID принципи в Angular мають глибші імплікації ніж здається на перший погляд. SRP на рівні framework: Angular team свідомо розділив responsibilities — Compiler відповідає за трансформацію templates, Runtime за rendering, DI за dependency resolution, Change Detection за dirty checking. Кожна підсистема еволюціонує незалежно (ViewEngine → Ivy, Zone.js → Signals). OCP в Angular ecosystem — це plugin architecture через multi-providers. Angular Router використовує OCP через Route guards, resolvers, та canMatch — кожен розширює routing logic без модифікації Router internals. LSP порушується частіше ніж здається: якщо MockService не emit'ить всі observable events що й RealService, або має іншу error handling семантику — це LSP violation яка проявляється як flaky tests. ISP — Angular сам порушував ISP з великими інтерфейсами як CanActivate + CanDeactivate + Resolve, і виправив це в Angular 15+ через functional guards і resolvers — кожна функція має одну відповідальність. DIP — Angular DI це reference implementation DIP де injector hierarchy дозволяє override'ити залежності на будь-якому рівні. На архітектурному рівні SOLID формує layered architecture: UI layer залежить від domain abstractions, domain від port interfaces, infrastructure implements ports — це hexagonal/clean architecture powered by Angular DI."
    commonMistakes:
      - "Перелічують принципи без конкретних Angular-прикладів"
      - "Вважають SOLID абсолютними правилами, а не guidelines"
      - "Не бачать зв'язку між DIP та Angular DI"
    relatedQuestions: ["b0t2q2", "b0t2q3"]
  - level: "mid"
    question: "Як Single Responsibility Principle застосовується при декомпозиції Angular-компонентів та сервісів? Наведіть приклади порушення SRP."
    referenceAnswers:
      junior: "SRP означає що кожен клас повинен мати одну причину для зміни. В Angular компонент не повинен містити HTTP-логіку або складну бізнес-логіку — це відповідальність сервісів."
      mid: "SRP в Angular визначає чіткі boundaries: компоненти відповідають за presentation та user interaction, сервіси — за бізнес-логіку та data access, pipes — за data transformation, directives — за DOM manipulation, guards — за route protection. Порушення SRP — компонент який fetch'ить дані, трансформує їх, валідує форму та навігує. Правильний підхід: smart/dumb component pattern де container component оркеструє сервіси, а presentational components тільки відображають дані через @Input/@Output."
      senior: "SRP в Angular має кілька рівнів застосування. На рівні компонентів: smart (container) vs dumb (presentational) pattern — container inject'ить сервіси та управляє станом, presentational отримує дані через inputs. На рівні сервісів: один сервіс = одна бізнес-область. UserService не повинен містити authentication логіку — це AuthService. На рівні модулів: feature modules інкапсулюють бізнес-домен. Ознаки порушення SRP: компонент з більше ніж 3-4 inject'ами, сервіс з більше ніж 10 публічних методів, component class більше 200 рядків. Виключення: orchestration сервіси (facade) свідомо координують кілька сервісів, але їхня 'одна відповідальність' — координація, а не бізнес-логіка."
      staff: "SRP — найчастіше порушуваний і найскладніший для правильного застосування принцип. 'Одна причина для зміни' — це про business stakeholders, не про технічні функції. Наприклад, UserProfileComponent може відображати і ім'я, і аватар, і preferences — це одна бізнес-область (user profile), отже SRP не порушений, хоча технічно це кілька функцій. Але якщо той самий компонент містить і адмін-панель і user view — це порушення, бо зміни вимагаються різними stakeholders. В Angular SRP enforcement відбувається на кількох рівнях. Framework level: Angular compiler не дозволяє одному класу бути і @Component і @Injectable — це compile-time SRP. Architecture level: nx workspace generators enforce module boundaries. Testing level: якщо unit test потребує більше 5-6 mock'ів — це SRP smell. В enterprise Angular проектах SRP реалізується через layered architecture: Feature Module (orchestration) → Container Components (state management) → Presentational Components (UI) → Domain Services (business logic) → Data Access Services (HTTP/Storage). Кожен шар має чітко визначену відповідальність та тестується незалежно. Signals та computed() в Angular 16+ допомагають SRP на рівні reactivity — кожен computed signal відповідає за одну derived value, замість монолітного BehaviorSubject з об'єктом стану."
    commonMistakes:
      - "Занадто гранулярна декомпозиція — кожен метод в окремому сервісі"
      - "Плутають SRP з 'робити тільки одну річ' — SRP про причини для зміни"
      - "Ігнорують SRP на рівні модулів та feature areas"
    relatedQuestions: ["b0t2q1", "b0t2q4"]
  - level: "mid"
    question: "Поясніть Open/Closed Principle на прикладах Angular: interceptors, guards, multi-providers."
    referenceAnswers:
      junior: "OCP означає що код повинен бути відкритий для розширення, але закритий для модифікації. В Angular можна додавати нові HTTP interceptors без зміни існуючих."
      mid: "OCP в Angular реалізується через extension points. HTTP_INTERCEPTORS — це multi-provider token: кожен interceptor додається через provide з multi: true, і HttpClient обробляє їх як chain без зміни свого коду. Route guards працюють аналогічно — додаємо новий guard до маршруту без модифікації Router. APP_INITIALIZER дозволяє розширити bootstrap логіку. Validators — можна створювати custom validators і додавати до форм. Всі ці patterns реалізують OCP через DI."
      senior: "OCP в Angular має кілька implementation strategies. Multi-providers — найпрямолінійніший: HTTP_INTERCEPTORS, APP_INITIALIZER, NG_VALIDATORS, NG_ASYNC_VALIDATORS. Кожен multi-token — це extension point де нова функціональність додається через provider, а існуючий код не змінюється. Functional composition — Angular 15+ functional interceptors/guards: withInterceptors([loggingInterceptor, authInterceptor]) де кожна функція — це extension. Content projection — <ng-content> дозволяє розширювати компонент через slot composition без модифікації його template. hostDirectives — Angular 15+ pattern де поведінка компонента розширюється через directive composition. Custom structural directives — *appFeatureFlag розширює conditional rendering без зміни існуючих компонентів. На рівні state management: NgRx meta-reducers дозволяють intercepting та extending reducer logic (logging, undo, persistence) без зміни business reducers."
      staff: "OCP — це принцип який Angular framework реалізує на своєму архітектурному рівні і надає інструменти для реалізації на application рівні. Framework level OCP: Angular Router використовує Route interface як extension point — canActivate, canDeactivate, resolve, canMatch, canLoad — кожен guard/resolver розширює routing behavior без модифікації Router source code. Angular compiler використовує OCP через plugin architecture — Angular Language Service, custom schematics, builder API — все це extension points. Application level OCP strategies: 1) Token-based extension через multi-providers для cross-cutting concerns (interceptors, validators, initializers). 2) Configuration-based extension через forRoot/forChild patterns де feature modules конфігурують shared services. 3) Component-level extension через content projection (transclusion) і template injection (ng-template + ngTemplateOutlet). 4) Higher-order pattern: withInterceptors(), provideRouter(withPreloading()), provideHttpClient(withFetch()) — Angular 15+ functional composition API де кожен with* function додає feature. Порушення OCP в Angular: switch/case на тип у template — замість цього strategy pattern через DI. if/else chains для permission check — замість цього guard chain. Монолітний error handler — замість цього ErrorHandler class який можна override'нути через provide. Angular evolves OCP: від class-based interceptors (implements HttpInterceptor) до functional interceptors (HttpInterceptorFn) — framework рухається до більш composable patterns."
    commonMistakes:
      - "Плутають OCP з забороною модифікації будь-якого коду"
      - "Не знають про multi-provider pattern як реалізацію OCP"
      - "Створюють надмірно абстрактні extension points 'на майбутнє'"
    relatedQuestions: ["b0t2q1", "b0t2q5"]
  - level: "senior"
    question: "Як Dependency Inversion Principle реалізований в Angular DI? Як правильно визначати абстракції для injectable залежностей?"
    referenceAnswers:
      junior: "DIP означає що модулі вищого рівня не повинні залежати від модулів нижчого рівня — обидва повинні залежати від абстракцій. В Angular це реалізується через Dependency Injection."
      mid: "DIP в Angular: компоненти (high-level modules) залежать від injection tokens (абстракцій), а не від конкретних сервісів (low-level modules). Реалізація підставляється через providers. Для визначення абстракцій використовують abstract класи (бо інтерфейси стираються при компіляції) або InjectionToken. Наприклад: компонент inject'ить abstract DataService, а в providers вказано { provide: DataService, useClass: HttpDataService }. Це дозволяє легко замінити реалізацію для тестування або різних середовищ."
      senior: "DIP в Angular реалізується на кількох рівнях. На рівні service abstraction: abstract class або InjectionToken визначає контракт, конкретна реалізація підставляється через providers. Abstract class краще коли потрібен і runtime token і default implementation. InjectionToken краще для конфігурацій та non-class dependencies (strings, functions, objects). На рівні module boundaries: feature module визначає що йому потрібно через injection tokens, а root/platform module надає реалізації. Це інверсія залежності на architectural рівні. На рівні testing: TestBed.configureTestingModule override'ить провайдери — це DIP в дії, де test module підставляє mock реалізації. Патерни для DIP: Abstract Repository (abstract class → HttpRepository/InMemoryRepository), Configuration Token (InjectionToken<Config> → environment-specific config), Strategy Token (InjectionToken<SortStrategy> → різні алгоритми). Помилка — inject'ити Injector напряму (Service Locator) — це анти-DIP."
      staff: "DIP — найважливіший з SOLID для архітектури Angular-застосунків, і Angular DI — це одна з найповніших реалізацій DIP серед frontend frameworks. Правильне визначення абстракцій — це архітектурне мистецтво. Rule of thumb: абстракція повинна належати high-level module, а не low-level. Наприклад, UserComponent потребує UserData — абстракція UserRepository визначається в domain layer, а HttpUserRepository реалізується в infrastructure layer. Це clean/hexagonal architecture pattern. Angular DI підтримує кілька strategies для DIP: 1) Abstract class as token — найпоширеніший, дає і type safety і runtime token. 2) InjectionToken<T> з factory — tree-shakeable, підходить для configuration та non-class values. 3) Lightweight injection token pattern — для бібліотек де tree-shaking критичний: замість inject(HeavyService) використовуємо inject(LIGHT_TOKEN) де token зареєстрований з factory. Ієрархія інжекторів дозволяє DIP на різних рівнях: platform providers для cross-app абстракцій, root providers для app-wide, component providers для scoped. Multi-level DIP: UI Components → Application Services (use cases) → Domain Services → Port Interfaces → Adapters (infrastructure). Кожен шар залежить тільки від абстракцій попереднього шару. Angular standalone components з inject() функцією спрощують DIP — не потрібен конструктор, токен inject'иться напряму. Але важливо не зловживати — inject() у computed() або effect() має свої rules щодо injection context."
    commonMistakes:
      - "Використовують interface замість abstract class для DI token"
      - "Inject'ять Injector напряму — це Service Locator anti-pattern"
      - "Визначають абстракцію в low-level module замість high-level"
      - "Не розрізняють DIP (принцип) та DI (механізм)"
    relatedQuestions: ["b0t2q3", "b0t2q5"]
  - level: "staff"
    question: "Як ви застосовуєте SOLID при проектуванні shared Angular бібліотеки, яку використовують кілька команд? Які trade-offs виникають?"
    referenceAnswers:
      junior: "При створенні shared бібліотеки потрібно дотримуватися SOLID щоб різні команди могли легко використовувати та розширювати компоненти без конфліктів."
      mid: "Shared бібліотека повинна мати чіткий public API (barrel exports), компоненти з single responsibility, extension points через content projection та DI tokens. OCP особливо важливий — кожна команда повинна мати змогу customize'увати поведінку без fork'у бібліотеки. ISP проявляється в модульності — не один великий SharedModule, а granular imports окремих компонентів."
      senior: "При проектуванні shared Angular бібліотеки SOLID trade-offs стають критичними. SRP: кожен компонент бібліотеки має одну чітку відповідальність, але виникає tension між granularity та usability — занадто дрібні компоненти створюють cognitive overhead. OCP: extension points через InjectionToken та content projection, але кожен extension point — це API surface що потрібно підтримувати. LSP: всі варіанти компонентів (primary/secondary button, small/large input) повинні бути взаємозамінні в контексті де використовується базовий тип. ISP: standalone components замість NgModule дозволяють granular imports, secondary entry points розділяють бібліотеку на sub-packages. DIP: бібліотека визначає InjectionToken для кожного customization point, а consuming team provide'ить свої реалізації."
      staff: "Проектування shared Angular бібліотеки — це exercise в балансуванні SOLID principles з pragmatism. SRP: кожен компонент і сервіс має чітку відповідальність, але критичний trade-off — рівень абстракції. Table component: один компонент з configuration object (Material CDK підхід) vs набір compose'них примітивів (header, row, cell). Перший простіший у використанні, другий гнучкіший. Рішення: dual API — high-level component для 80% use cases, low-level primitives для advanced customization. OCP: кожен extension point стає частиною semver contract. HTTP_INTERCEPTORS-style multi-tokens для cross-cutting concerns, ng-template injection для custom rendering, CSS custom properties для theming. Але кожен extension point — це maintenance burden і potential breaking change surface. Правило: extension points тільки для validated use cases, не для hypothetical scenarios. LSP: якщо бібліотека expose'ить abstract class DataAdapter, кожна реалізація повинна guarantee однакову semantics — error handling, loading states, empty states. Contract testing через shared test suites для кожного adapter. ISP: Angular secondary entry points (@my-lib/core, @my-lib/forms, @my-lib/table) мінімізують bundle size та дозволяють independent versioning. Standalone components eliminate NgModule overhead. DIP: lightweight injection token pattern для tree-shaking — public API expose'ить тільки tokens, actual implementations tree-shakeable. Version compatibility: abstract classes versioning через optional methods з default implementations — нові capabilities додаються без breaking existing implementations. Nx workspace rules enforce dependency direction — shared lib не може import'увати feature code."
    commonMistakes:
      - "Створюють занадто багато extension points 'на всяк випадок'"
      - "Один великий SharedModule замість granular standalone components"
      - "Не визначають contract testing для abstract dependencies"
      - "Ігнорують tree-shaking implications при виборі DI strategy"
    relatedQuestions: ["b0t2q4", "b0t1q5"]
---

## Core Concept

**English definition:** SOLID is a set of five design principles — Single Responsibility (SRP), Open/Closed (OCP), Liskov Substitution (LSP), Interface Segregation (ISP), and Dependency Inversion (DIP) — that guide the creation of maintainable, extensible, and loosely coupled object-oriented systems.

**Пояснення:** SOLID — це не абстрактна теорія з книжки. Angular framework побудований з дотриманням цих принципів, і надає інструменти (DI, multi-providers, content projection, standalone components) для їх застосування на рівні застосунку. SRP визначає як декомпозувати компоненти та сервіси. OCP формує extension points через DI tokens. LSP гарантує що mock-сервіси можна підставити замість реальних. ISP мотивує granular imports та модульну архітектуру. DIP — це фундамент Angular Dependency Injection.

**Яку проблему вирішує:** Без SOLID Angular-застосунок швидко деградує: God-компоненти з тисячами рядків (порушення SRP), зміни в одному місці ламають десять інших (порушення OCP), тести потребують реального backend (порушення DIP), один imported module тягне весь бандл (порушення ISP). SOLID дає конкретні guidelines для уникнення цих проблем.

**Як працює під капотом:** Angular compiler та runtime enforce'ять деякі SOLID принципи автоматично. Декоратори @Component, @Injectable, @Directive визначають "тип" класу — компонент не може бути одночасно сервісом (SRP enforcement). DI система resolve'ить залежності через ієрархію інжекторів — компоненти залежать від tokens, не від конкретних класів (DIP enforcement). Multi-providers дозволяють додавати interceptors, validators, initializers без зміни core коду (OCP enforcement).

**Trade-offs та обмеження:** Надмірне слідування SOLID створює over-engineering: занадто дрібні сервіси (SRP dogma), абстракції для кожного класу (DIP dogma), інтерфейс для кожного метода (ISP dogma). SOLID — це guidelines, не закони. Pragmatic підхід: застосовувати SOLID коли це зменшує complexity, а не додає boilerplate. TypeScript обмеження: інтерфейси стираються при компіляції, що ускладнює ISP та DIP реалізацію.

**Як Angular це використовує:** Angular framework — це showcase SOLID. SRP: Compiler, Renderer, ChangeDetector, Injector — кожна підсистема має одну відповідальність. OCP: Router extensions через guards/resolvers, HttpClient через interceptors, Forms через validators. LSP: providedIn 'root' | 'platform' | 'any' — кожна стратегія взаємозамінна по інтерфейсу. ISP: Angular перейшов від великих interface-based контрактів (CanActivate, Resolve) до granular functional guards/resolvers в v15+. DIP: вся DI система — це DIP implementation де Injector hierarchy абстрагує resolution від конкретних провайдерів.

## Deep Details

### Edge Cases

- **LSP violation в Angular DI:** Якщо ви provide'ите `{ provide: RealService, useClass: MockService }` і MockService не emit'ить complete() на Observable — це LSP violation яка зламає operators на кшталт `toArray()` або `last()`.
- **SRP tension з Signals:** Angular computed() заохочує fine-grained derived state, але занадто багато computed signals в одному компоненті може порушувати readability. Баланс — extracted helper functions або dedicated signal stores.
- **ISP та tree-shaking:** Якщо shared сервіс має 20 методів але consumer використовує тільки 2 — tree-shaker не видалить невикористані методи (бо вони частина класу). ISP через окремі сервіси або functional tokens вирішує це.
- **OCP boundary:** Кожен extension point (multi-token, ng-content slot) стає частиною public API та semver contract. Додавання extension point — легко, видалення — breaking change.

### Junior vs Senior Understanding

**Junior** знає назви п'яти принципів і може дати bookish визначення кожного. Застосовує SRP як "один клас = одна функція" без розуміння "reasons to change".

**Senior** розуміє SOLID як trade-off guidelines, не як абсолютні правила. Знає коли порушення принципу виправдане (наприклад, facade сервіс свідомо має кілька responsibilities для простоти API). Бачить як Angular framework реалізує SOLID і використовує ці ж patterns на рівні застосунку.

### Connections to Other Concepts

- **OOP Principles** — SOLID формалізує та доповнює базові ООП-принципи конкретними guidelines
- **Design Patterns** — більшість patterns (Strategy, Observer, Factory) реалізують один або кілька SOLID принципів
- **Angular DI** — практична реалізація DIP на рівні framework
- **Clean Architecture** — архітектурний pattern побудований на SOLID, особливо DIP
- **NgRx / State Management** — SRP для state: actions, reducers, effects, selectors мають окремі responsibilities

## Examples

### Basic Usage

```typescript
// SRP: Кожен клас має одну відповідальність
// Сервіс відповідає тільки за HTTP-операції з юзерами
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }
}

// Окремий сервіс для бізнес-логіки — SRP
@Injectable({ providedIn: 'root' })
export class UserBusinessService {
  private readonly api = inject(UserApiService);

  getActiveUsers(): Observable<User[]> {
    return this.api.getAll().pipe(
      map(users => users.filter(u => u.status === 'active')),
    );
  }

  canUserPerformAction(userId: string, action: string): Observable<boolean> {
    return this.api.getById(userId).pipe(
      map(user => user.permissions.includes(action)),
    );
  }
}

// DIP: Компонент залежить від абстракції, не від конкретного класу
// OCP: Можна підставити іншу реалізацію без зміни компонента
export abstract class NotificationService {
  abstract show(message: string, type: 'success' | 'error' | 'info'): void;
  abstract dismiss(id: string): void;
}

@Injectable()
export class ToastNotificationService extends NotificationService {
  show(message: string, type: 'success' | 'error' | 'info'): void {
    // toast notification implementation
  }
  dismiss(id: string): void { /* ... */ }
}

// Provider — DIP inversion point
providers: [
  { provide: NotificationService, useClass: ToastNotificationService }
]
```

### Production Scenario

```typescript
// OCP: Extension через multi-providers та functional composition
// Кожен interceptor — окрема відповідальність (SRP), додається без зміни інших (OCP)

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = performance.now();
  return next(req).pipe(
    tap({
      next: () => {
        const duration = performance.now() - startTime;
        console.log(`${req.method} ${req.url} completed in ${duration}ms`);
      },
      error: (error) => {
        console.error(`${req.method} ${req.url} failed:`, error);
      },
    }),
  );
};

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    retry({ count: 3, delay: (error, retryCount) => {
      if (error.status === 429 || error.status >= 500) {
        return timer(Math.pow(2, retryCount) * 1000);
      }
      throw error;
    }}),
  );
};

// Реєстрація — OCP: додаємо нові без зміни існуючих
provideHttpClient(
  withInterceptors([authInterceptor, loggingInterceptor, retryInterceptor])
)

// ISP: Granular tokens замість God-інтерфейсу
// Замість одного великого AnalyticsService з 20 методами
export const TRACK_PAGE_VIEW = new InjectionToken<(page: string) => void>(
  'Track page view function'
);
export const TRACK_EVENT = new InjectionToken<(event: AnalyticsEvent) => void>(
  'Track event function'
);
export const TRACK_ERROR = new InjectionToken<(error: Error) => void>(
  'Track error function'
);

// Компонент inject'ить тільки те що потрібно — ISP
@Component({ /* ... */ })
export class ProductPageComponent {
  private readonly trackPageView = inject(TRACK_PAGE_VIEW);
  private readonly trackEvent = inject(TRACK_EVENT);

  ngOnInit(): void {
    this.trackPageView('/products');
  }

  onAddToCart(product: Product): void {
    this.trackEvent({ category: 'ecommerce', action: 'add_to_cart', label: product.id });
  }
}
```

### Anti-Example

```typescript
// ПОГАНО: Порушення всіх SOLID принципів

// SRP violation: сервіс робить все — HTTP, caching, validation, notifications
@Injectable({ providedIn: 'root' })
export class UserService {
  private cache = new Map<string, User>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,  // UI в сервісі — SRP violation
  ) {}

  async getUser(id: string): Promise<User> {
    if (this.cache.has(id)) return this.cache.get(id)!;
    const user = await firstValueFrom(this.http.get<User>(`/api/users/${id}`));
    // Validation в data access сервісі — SRP violation
    if (!user.email.includes('@')) {
      this.snackBar.open('Invalid email!');  // UI notification в сервісі
    }
    this.cache.set(id, user);
    return user;
  }

  // OCP violation: switch/case що потребує зміни при додаванні нового типу
  formatUserName(user: User, format: string): string {
    switch (format) {
      case 'full': return `${user.firstName} ${user.lastName}`;
      case 'short': return user.firstName;
      case 'formal': return `${user.title} ${user.lastName}`;
      default: return user.firstName;
    }
  }

  // DIP violation: прямий import конкретного класу замість абстракції
  // LSP violation: метод поводиться по-різному для різних типів
  saveUser(user: User | AdminUser): Observable<void> {
    if (user instanceof AdminUser) {
      return this.http.post<void>('/api/admin/users', user);
    }
    return this.http.post<void>('/api/users', user);
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| God Service з 20+ методами та 10+ inject'ами | Порушує SRP, неможливо тестувати ізольовано, зміна одного методу може зламати інші | Декомпозиція за бізнес-доменами: UserApiService, UserValidationService, UserCacheService |
| switch/case на тип об'єкта для вибору поведінки | Порушує OCP — кожен новий тип вимагає модифікації switch | Strategy pattern через DI: InjectionToken + provider map, або polymorphic method |
| Mock сервіс з порожніми методами | Порушує LSP — mock не дотримується контракту оригіналу | Повна реалізація контракту: emit correct values, handle errors, complete observables |
| Один SharedModule для всієї бібліотеки | Порушує ISP — consumer отримує все, навіть непотрібне | Standalone components + secondary entry points для granular imports |
| Inject(Injector) для динамічного отримання залежностей | Порушує DIP — Service Locator ховає реальні залежності | Explicit constructor/inject() injection з конкретними токенами |

## Interview Block

### [L1 — Warm-up] Що таке SOLID і навіщо ці принципи потрібні в Angular-розробці?

**Signal being tested:** Базове знання SOLID та здатність пов'язати з Angular-практикою.

**What the interviewer expects:** Кандидат називає всі п'ять принципів, дає коротке пояснення кожного і хоча б один Angular-приклад для кожного.

**How to probe deeper:** "Який з SOLID принципів ви порушуєте найчастіше і чому?", "Чи може компонент мати кілька responsibilities?"

**Reference answer:** Див. frontmatter b0t2q1.

**Common mistakes:** Перелік без прикладів. Вважають SOLID абсолютними правилами. Не бачать зв'язку між DIP та Angular DI.

### [L2 — Core Understanding] Як SRP застосовується при декомпозиції Angular-компонентів та сервісів?

**Signal being tested:** Практичне розуміння SRP та вміння визначити порушення.

**What the interviewer expects:** Кандидат пояснює SRP як "одна причина для зміни" (не "одна функція"), описує smart/dumb pattern, називає ознаки порушення SRP (кількість inject'ів, розмір класу, кількість публічних методів).

**How to probe deeper:** "Як визначити межу між 'занадто мало' і 'занадто багато' responsibilities?", "Facade сервіс порушує SRP?"

**Reference answer:** Див. frontmatter b0t2q2.

**Common mistakes:** Занадто гранулярна декомпозиція. Плутають SRP з "робити тільки одну річ".

### [L2 — Core Understanding] Поясніть OCP на прикладах Angular.

**Signal being tested:** Розуміння як Angular framework реалізує OCP та вміння застосувати на рівні застосунку.

**What the interviewer expects:** Кандидат наводить конкретні Angular extension points (interceptors, guards, validators, multi-providers) і пояснює механізм розширення.

**How to probe deeper:** "Як OCP проявляється в Angular 15+ functional API?", "Що є extension point в вашому поточному проекті?"

**Reference answer:** Див. frontmatter b0t2q3.

**Common mistakes:** Плутають OCP з забороною модифікації будь-якого коду. Не знають про functional interceptors/guards.

### [L3 — Advanced] Як DIP реалізований в Angular DI?

**Signal being tested:** Глибоке розуміння DIP як принципу та Angular DI як його реалізації.

**What the interviewer expects:** Кандидат розрізняє DIP (принцип) та DI (механізм), пояснює abstract class vs InjectionToken trade-offs, описує lightweight injection token pattern, знає про ієрархію інжекторів як multi-level DIP.

**How to probe deeper:** "Чому abstract class а не interface для DI token?", "Що таке lightweight injection token pattern?"

**Reference answer:** Див. frontmatter b0t2q4.

**Common mistakes:** Плутають DIP та DI. Використовують Injector напряму (Service Locator). Визначають абстракцію в wrong layer.

### [L4 — Architecture] Як застосувати SOLID при проектуванні shared Angular бібліотеки?

**Signal being tested:** Здатність балансувати SOLID principles з practical constraints при проектуванні reusable library.

**What the interviewer expects:** Кандидат описує trade-offs кожного SOLID принципу в контексті shared library: SRP granularity vs usability, OCP extension points vs maintenance burden, LSP contract testing, ISP through standalone components, DIP through lightweight tokens.

**How to probe deeper:** "Як версіонувати abstract class API без breaking changes?", "Як забезпечити tree-shaking для library consumers?"

**Reference answer:** Див. frontmatter b0t2q5.

**Common mistakes:** Over-engineering extension points. Один SharedModule для всього. Ігнорують tree-shaking implications.

## Summary

### Key Points

- SRP в Angular: компоненти для presentation, сервіси для бізнес-логіки, guards для авторизації — Angular compiler enforce'ить базовий SRP через декоратори
- OCP реалізується через Angular extension points: multi-providers (interceptors, validators), content projection, hostDirectives, functional composition API (withInterceptors, withPreloading)
- LSP критичний для DI: mock-сервіси повинні повністю дотримуватися контракту оригіналу, включаючи Observable semantics
- ISP мотивує standalone components, secondary entry points та granular injection tokens замість God-сервісів
- DIP — фундамент Angular DI: abstract classes та InjectionToken як abstraction layer, injector hierarchy як multi-level inversion
- SOLID — це guidelines, не закони: pragmatic застосування з урахуванням trade-offs важливіше за dogmatic слідування
- Angular framework еволюціонує в напрямку кращого SOLID: від class-based до functional API, від NgModule до standalone

### Elevator Pitch (2 minutes)

"SOLID в Angular — це не теорія з книжки, а практичні принципи вбудовані в framework. SRP визначає архітектуру: компоненти відповідають за UI, сервіси — за логіку, а Angular compiler enforce'ить це через декоратори. OCP реалізується через multi-providers — interceptors, validators, initializers розширюють поведінку без зміни core коду. DIP — це фундамент Angular DI де компоненти залежать від токенів-абстракцій. ISP мотивує standalone components та granular imports. Angular 15+ functional API (functional guards, interceptors) — це еволюція в напрямку кращого ISP та SRP. Розуміння SOLID дозволяє проектувати Angular-застосунки які масштабуються без degradation якості коду."
