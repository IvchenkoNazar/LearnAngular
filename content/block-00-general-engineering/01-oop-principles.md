---
title: "OOP Principles in Angular Context"
block: 0
topic: 1
slug: "oop-principles"
difficulty: 2
tags: ["oop", "encapsulation", "inheritance", "polymorphism", "abstraction", "composition"]
relatedTopics: ["solid-principles", "design-patterns"]
interviewQuestions:
  - level: "junior"
    question: "Які основні принципи ООП ви знаєте і як вони проявляються в Angular-компонентах?"
    referenceAnswers:
      junior: "Основні принципи ООП — інкапсуляція, наслідування, поліморфізм та абстракція. В Angular компоненти є класами з інкапсульованим станом, сервіси можуть наслідуватися, а DI забезпечує поліморфізм."
      mid: "Чотири принципи ООП в Angular: інкапсуляція реалізується через ViewEncapsulation та private поля компонентів, наслідування — через extends для компонентів і сервісів, поліморфізм — через DI-токени де різні реалізації підставляються під один інтерфейс, абстракція — через абстрактні класи сервісів. Angular активно використовує всі чотири принципи у своїй внутрішній архітектурі."
      senior: "В Angular інкапсуляція працює на кількох рівнях: ViewEncapsulation.Emulated додає атрибутні селектори для ізоляції CSS, private/protected поля класу обмежують доступ до стану компонента, а OnPush change detection стратегія інкапсулює логіку перевірки змін. Наслідування компонентів дозволяє перевикористовувати lifecycle hooks і методи, але metadata декораторів не наслідується — це свідоме рішення Angular team. Поліморфізм реалізується через InjectionToken та useClass/useExisting провайдери, де один токен може резолвитися в різні реалізації залежно від контексту інжектора. Абстракція досягається через абстрактні класи як DI-токени, що є ідіоматичним патерном для Angular, оскільки TypeScript інтерфейси стираються при компіляції."
      staff: "Angular framework побудований на глибокій ООП-моделі, де кожен принцип має специфічну імплементацію. Інкапсуляція: Angular compiler трансформує шаблони в інструкції рендерингу, які працюють виключно з контекстом свого компонента — це compile-time інкапсуляція. ViewEncapsulation.ShadowDom використовує нативний Shadow DOM, Emulated емулює через атрибути, None вимикає — кожен варіант має performance та compatibility trade-offs. Наслідування в Angular має відомі обмеження: декоратор metadata не мерджиться автоматично, що змушує дублювати @Input/@Output в дочірніх класах до Angular 15, де з'явився composition API через hostDirectives. Поліморфізм через DI — це по суті IoC Container pattern, де resolution strategy визначається ієрархією інжекторів: Element → Component → Module → Platform → Null. Абстракція через абстрактні класи замість інтерфейсів — це не просто технічне обмеження TypeScript, а архітектурне рішення, яке дозволяє мати runtime-значення для DI-токена. На рівні архітектури великих Angular-застосунків ООП-принципи формують layered architecture: presentation layer (components), business logic layer (services), data access layer (repositories/adapters), де кожен шар інкапсулює свою відповідальність і взаємодіє через абстракції."
    commonMistakes:
      - "Плутають інкапсуляцію в ООП з ViewEncapsulation в Angular"
      - "Вважають що Angular компоненти не підтримують наслідування"
      - "Не розуміють чому Angular використовує класи замість інтерфейсів для DI"
    relatedQuestions: ["b0t1q2", "b0t1q3"]
  - level: "mid"
    question: "Чому в Angular рекомендують композицію замість наслідування компонентів? Які проблеми виникають при наслідуванні?"
    referenceAnswers:
      junior: "Композиція краща за наслідування тому що вона гнучкіша. В Angular наслідування компонентів може створювати проблеми з metadata декораторів та lifecycle hooks."
      mid: "При наслідуванні Angular-компонентів metadata з декоратора @Component не мерджиться — дочірній клас повинен мати власний декоратор з повним набором метаданих. Це означає дублювання template, styles, selector. Lifecycle hooks батьківського класу можуть конфліктувати з дочірніми. Композиція через сервіси, директиви та content projection дозволяє уникнути цих проблем та побудувати більш гнучку архітектуру."
      senior: "Наслідування компонентів в Angular має ряд фундаментальних проблем. По-перше, Angular compiler обробляє кожен @Component декоратор незалежно — metadata не мерджиться по prototype chain, що призводить до необхідності дублювати selector, template, styleUrls. По-друге, якщо батьківський і дочірній компоненти обидва реалізують, наприклад, ngOnInit, потрібно явно викликати super.ngOnInit(), що є error-prone. По-третє, @Input та @Output до Angular 15 не наслідувалися автоматично. Композиція через hostDirectives (Angular 15+), content projection та сервісну ін'єкцію вирішує всі ці проблеми. hostDirectives дозволяють додавати поведінку до компонента декларативно, content projection забезпечує структурну композицію, а DI — поведінкову."
      staff: "Проблема наслідування в Angular має коріння в тому, як працює Angular compiler. При AOT-компіляції кожен компонент трансформується в definition factory — статичну функцію, яка створює компонент. Ці factories генеруються на основі metadata з декоратора, і compiler не робить prototype chain traversal для збору metadata. Це свідоме архітектурне рішення: мерджинг metadata створив би непередбачуваність і ускладнив tree-shaking. Angular team визнала цю проблему і запропонувала кілька еволюційних рішень: mixins через TypeScript (обмежено), composition через DI, і нарешті hostDirectives в Angular 15, що є реалізацією Composition pattern на рівні framework. hostDirectives дозволяють attach'ити директиви до host-елементу компонента, expose'ити їхні inputs/outputs, і цим досягати reuse без inheritance. У великих enterprise-застосунках рекомендований підхід — це layered composition: presentational components складаються з UI-примітивів через content projection, поведінка додається через директиви, а бізнес-логіка інжектується через сервіси. Це дає максимальну testability і flexibility при рефакторингу."
    commonMistakes:
      - "Вважають що composition означає відмову від класів взагалі"
      - "Не знають про hostDirectives як офіційний composition mechanism"
      - "Думають що наслідування компонентів взагалі не працює в Angular"
    relatedQuestions: ["b0t1q1", "b0t1q4"]
  - level: "mid"
    question: "Як Angular реалізує інкапсуляцію на рівні компонентів? Порівняйте ViewEncapsulation стратегії."
    referenceAnswers:
      junior: "Angular має три режими ViewEncapsulation: Emulated (за замовчуванням), ShadowDom і None. Emulated додає спеціальні атрибути до елементів для ізоляції стилів."
      mid: "ViewEncapsulation.Emulated — за замовчуванням — Angular compiler додає унікальні атрибути (_nghost-xxx, _ngcontent-xxx) до елементів компонента і модифікує CSS-селектори додаючи ці атрибути. ShadowDom використовує нативний Shadow DOM браузера для повної ізоляції. None вимикає інкапсуляцію повністю — стилі стають глобальними. Кожна стратегія має свої trade-offs щодо performance, browser support та ізоляції."
      senior: "ViewEncapsulation.Emulated працює на етапі компіляції: Angular compiler парсить CSS кожного компонента, генерує унікальний content attribute (_ngcontent-abc) та host attribute (_nghost-abc), і модифікує кожний CSS-правило додаючи відповідний attribute selector. Наприклад .title стає .title[_ngcontent-abc]. Це забезпечує scoping без Shadow DOM, але має обмеження: ::ng-deep пробиває інкапсуляцію (deprecated), :host та :host-context працюють через емуляцію. ShadowDom створює нативний shadow root, що дає справжню DOM і style ізоляцію, але ускладнює theming і має обмеження з деякими third-party бібліотеками. None корисний для глобальних utility стилів. Вибір стратегії впливає на performance: Emulated має overhead на compile-time, ShadowDom — на runtime через shadow tree."
      staff: "Інкапсуляція в Angular — це multi-layered concept. На рівні DOM: ViewEncapsulation визначає як стилі скоупляться. Emulated — compile-time трансформація CSS через Angular compiler (раніше ViewEngine, тепер Ivy), де кожне CSS-правило отримує attribute selector suffix. Ivy compiler генерує ці атрибути детерміновано на основі component selector, що дозволяє stable CSS output для caching. ShadowDom делегує ізоляцію браузеру, що ефективніше для великої кількості компонентів, але створює challenges для CSS custom properties inheritance та third-party component libraries. На рівні даних: Angular інкапсулює component state через closure — Ivy instructions працюють з LView array напряму, де кожен компонент має свій діапазон індексів, і зовнішній код не має доступу до internal view state. На рівні change detection: OnPush стратегія інкапсулює reactivity — компонент перевіряється тільки коли його inputs змінюються (reference check) або коли внутрішня подія тригерить markForCheck(). Це дає performance інкапсуляцію. На рівні архітектури: component boundaries визначають encapsulation boundaries — public API компонента це його inputs, outputs та exported template reference. Все інше — implementation detail. Signals в Angular 16+ додають ще один рівень інкапсуляції — fine-grained reactivity де кожен signal інкапсулює свій reactive context."
    commonMistakes:
      - "Думають що ViewEncapsulation захищає від XSS"
      - "Не розуміють різницю між compile-time та runtime інкапсуляцією"
      - "Використовують ::ng-deep як основний інструмент замість правильної архітектури стилів"
    relatedQuestions: ["b0t1q1", "b0t1q4"]
  - level: "senior"
    question: "Як Angular внутрішньо використовує поліморфізм через Dependency Injection? Поясніть ієрархію інжекторів та resolution strategy."
    referenceAnswers:
      junior: "Angular DI дозволяє підставляти різні реалізації сервісів через провайдери. Можна використовувати useClass, useValue, useExisting для поліморфізму."
      mid: "Angular DI реалізує поліморфізм через систему провайдерів: useClass створює новий екземпляр вказаного класу, useExisting перенаправляє на існуючий провайдер, useFactory дозволяє створювати залежності динамічно. Ієрархія інжекторів працює від дочірнього до батьківського: спочатку шукається провайдер в element injector, потім в module injector. Це дозволяє override'ити сервіси на будь-якому рівні."
      senior: "Angular DI — це реалізація IoC Container з ієрархічною resolution strategy. Існує два дерева інжекторів: Element Injector tree (побудоване на основі DOM-ієрархії компонентів) та Module/Environment Injector tree. При запиті залежності Angular проходить спочатку вгору по Element tree, потім перемикається на Module tree. Поліморфізм досягається через multi-providers (MULTI: true), InjectionToken з factory, та useClass/useExisting/useFactory. Наприклад HTTP_INTERCEPTORS — це multi-token де кожен провайдер додає реалізацію, а HttpClient обробляє їх як chain of responsibility. @Optional(), @Self(), @SkipSelf(), @Host() декоратори модифікують resolution strategy, обмежуючи або розширюючи пошук по ієрархії. Це дає fine-grained control над тим, яка реалізація буде inject'нута."
      staff: "Angular DI — один з найскладніших підсистем framework, побудований на принципі поліморфного resolution. Внутрішньо Ivy використовує bloom filter для швидкого пошуку провайдерів в Element Injector — це O(1) lookup замість O(n) traversal. Кожен NodeInjector зберігає bloom hash своїх провайдерів, і при resolution Angular перевіряє bloom filter перед повним пошуком, що критично для performance у великих component trees. Ієрархія інжекторів: NodeInjector (per element) → R3Injector (environment/module) → PlatformInjector → NullInjector. Resolution модифікатори (@Self, @SkipSelf, @Host, @Optional) трансляються в InjectFlags бітову маску, яка передається в resolution function. Multi-providers реалізують Open/Closed Principle — можна розширювати поведінку (додавати interceptors, validators) без зміни існуючого коду. InjectionToken з factory забезпечує tree-shakeable провайдери — якщо токен не inject'иться ніде, його factory не потрапляє в bundle. Це досягається через providedIn: 'root' де Angular compiler аналізує injection graph і видаляє невикористані провайдери. На рівні архітектури великих застосунків DI-поліморфізм дозволяє будувати plugin-based architectures, де feature modules реєструють свої реалізації через forRoot/forChild patterns, а core module визначає абстрактні контракти через InjectionToken."
    commonMistakes:
      - "Не розрізняють Element і Module injector trees"
      - "Не знають про bloom filter optimization в Ivy"
      - "Плутають useExisting з useClass — перший alias, другий нова інстанція"
    relatedQuestions: ["b0t1q2", "b0t1q5"]
  - level: "staff"
    question: "Спроектуйте архітектуру Angular-застосунку з plugin-based системою, використовуючи ООП-принципи. Як забезпечити extensibility без модифікації core-коду?"
    referenceAnswers:
      junior: "Можна використовувати DI для підключення різних плагінів. Кожен плагін буде окремим модулем з сервісами, які реєструються через провайдери."
      mid: "Для plugin-based архітектури потрібно визначити абстрактний контракт через InjectionToken або абстрактний клас. Кожен плагін реалізує цей контракт і реєструється через multi-provider. Core-модуль inject'ить масив реалізацій і працює з ними через спільний інтерфейс. Це дозволяє додавати нові плагіни без зміни core-коду."
      senior: "Plugin-based архітектура будується на кількох ООП-принципах. Абстракція: визначаємо InjectionToken<Plugin[]> з multi: true де Plugin — абстрактний клас з методами initialize(), destroy(), getCapabilities(). Поліморфізм: кожен feature module реєструє свою реалізацію Plugin через providers. Інкапсуляція: кожен плагін інкапсулює свою логіку і стан, core бачить тільки public API. Для lazy-loaded плагінів використовуємо dynamic import + createEnvironmentInjector для ізольованого DI scope. Registry pattern через сервіс-orchestrator збирає та координує плагіни, надаючи unified API для core application."
      staff: "Архітектура plugin-based Angular-застосунку вимагає багаторівневого застосування ООП. На найнижчому рівні визначаємо Plugin Contract — абстрактний клас (не інтерфейс, бо потрібен runtime token) з lifecycle methods (onInit, onDestroy), capability declaration (getRoutes, getMenuItems, getProviders) та metadata (version, dependencies). Plugin Registry Service — singleton який збирає зареєстровані плагіни, резолвить їх залежності (DAG resolution), ініціалізує в правильному порядку та надає query API. Для extensibility використовуємо Extension Points — це multi-token'и для конкретних hook'ів: PLUGIN_ROUTE_EXTENSION, PLUGIN_MENU_EXTENSION, PLUGIN_TOOLBAR_EXTENSION. Кожен плагін може contribute'ити в будь-який extension point. Lazy loading реалізується через dynamic import() + createEnvironmentInjector — кожен плагін отримує ізольований injector який inherit'ить від root, що дає інкапсуляцію стану плагіна. Для комунікації між плагінами — Event Bus pattern через shared service з typed events. Versioning — semantic version matching між plugin dependencies. Для безпеки — sandbox pattern де plugin code виконується через обмежений API surface, без прямого доступу до Router чи HttpClient. Це дозволяє будувати enterprise-grade extensible systems за принципом WordPress/VSCode plugin architecture, але в Angular ecosystem."
    commonMistakes:
      - "Забувають про lifecycle management плагінів"
      - "Не враховують dependency resolution між плагінами"
      - "Дають плагінам необмежений доступ до core services"
      - "Не передбачають lazy loading для plugin modules"
    relatedQuestions: ["b0t1q4", "b0t2q5"]
---

## Core Concept

**English definition:** Object-Oriented Programming (OOP) is a paradigm based on four principles — encapsulation, inheritance, polymorphism, and abstraction — that organizes code around objects combining state and behavior, enabling modular and maintainable software systems.

**Пояснення:** Angular побудований на TypeScript-класах, і кожен компонент, сервіс, директива та pipe є класом. Це означає що ООП-принципи — не абстрактна теорія, а щоденний інструмент Angular-розробника. Розуміння як Angular framework внутрішньо використовує інкапсуляцію (ViewEncapsulation, component isolation), наслідування (component/directive inheritance), поліморфізм (DI resolution, multi-providers) та абстракцію (abstract services, InjectionToken) дозволяє писати архітектурно правильний код і розуміти чому framework працює саме так.

**Яку проблему вирішує:** Без ООП-принципів Angular-застосунок перетворюється на набір процедурних скриптів — компоненти на 500+ рядків, God-сервіси, copy-paste замість reuse, tight coupling між модулями. ООП дає мову та інструменти для декомпозиції складних систем на ізольовані, перевикористовувані та розширювані частини.

**Як працює під капотом:** Angular compiler (ngc) трансформує TypeScript-класи з декораторами в оптимізовані JavaScript-інструкції. Ivy compiler генерує component definition factories — статичні методи `ɵcmp`, `ɵdir`, `ɵinj` — які описують компонент як набір інструкцій для рендерингу. Кожен клас компонента стає factory для створення екземплярів, де DI резолвить залежності через ієрархію інжекторів. Це класичний IoC Container pattern з ООП-світу, реалізований на рівні framework.

**Trade-offs та обмеження:** TypeScript надає ООП-примітиви (класи, інтерфейси, abstract, access modifiers), але має обмеження: інтерфейси стираються при компіляції (не можна використовувати як DI-токени), access modifiers не enforcяться в runtime, multiple inheritance неможливий (тільки mixins через TypeScript). Angular додає свої обмеження: metadata декораторів не наслідується, component inheritance має відомі edge cases.

**Як Angular це використовує:** Angular framework внутрішньо побудований на ООП. `Renderer2` — абстракція для DOM-маніпуляцій (абстракція + поліморфізм для SSR). `ChangeDetectorRef` — інкапсуляція change detection логіки. `HttpInterceptor` chain — поліморфізм через multi-providers. `NgModule`, `Component`, `Directive` — декоратори що додають metadata до класів, реалізуючи decorator pattern. Injector hierarchy — IoC Container з hierarchical resolution, де NodeInjector використовує bloom filter для O(1) lookup.

## Deep Details

### Edge Cases

- **Наслідування компонентів з OnPush:** Дочірній компонент, що extends батьківський з `ChangeDetectionStrategy.OnPush`, повинен мати свій декоратор з OnPush — стратегія не наслідується через metadata.
- **Constructor injection в наслідуванні:** Якщо батьківський клас має конструктор з DI-залежностями, дочірній повинен або оголосити ідентичний конструктор і викликати `super(...)`, або не мати конструктора взагалі (TypeScript автоматично делегує до super).
- **ViewEncapsulation та глобальні стилі:** Компонент з `ViewEncapsulation.None` "забруднює" глобальний scope — його стилі впливають на всі інші компоненти, навіть з Emulated encapsulation.
- **Abstract class як DI token:** Abstract клас можна використовувати як injection token, але при цьому всі його методи повинні бути abstract або мати default implementation — інакше runtime помилки при неповній реалізації.

### Junior vs Senior Understanding

**Junior** бачить ООП як набір синтаксичних конструкцій — `class`, `extends`, `implements`, `private`. Створює класи "тому що так треба", без розуміння коли інкапсуляція корисна, а коли зайва.

**Senior** розуміє ООП як набір принципів проектування. Обирає між наслідуванням та композицією на основі конкретного use case. Знає що Angular DI — це IoC Container, і використовує поліморфізм через провайдери для побудови extensible архітектури. Розуміє обмеження TypeScript ООП та workarounds для Angular-специфічних проблем.

### Connections to Other Concepts

- **SOLID Principles** — формалізація ООП-принципів у вигляді конкретних guidelines для class design
- **Design Patterns** — типові рішення повторюваних проблем, побудовані на ООП-принципах
- **Dependency Injection** — реалізація IoC (Inversion of Control) та DIP (Dependency Inversion Principle)
- **RxJS** — функціональний reactive підхід, який доповнює ООП в Angular
- **Signals** — Angular 16+ примітив який поєднує ООП-інкапсуляцію з reactive paradigm

## Examples

### Basic Usage

```typescript
// Абстрактний клас як DI-token та контракт
abstract class DataSource<T> {
  abstract getAll(): Observable<T[]>;
  abstract getById(id: string): Observable<T>;
  abstract save(entity: T): Observable<T>;
}

// Конкретна реалізація — поліморфізм через DI
@Injectable()
class ApiDataSource<T> extends DataSource<T> {
  constructor(private http: HttpClient, private endpoint: string) {
    super();
  }

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.endpoint);
  }

  getById(id: string): Observable<T> {
    return this.http.get<T>(`${this.endpoint}/${id}`);
  }

  save(entity: T): Observable<T> {
    return this.http.post<T>(this.endpoint, entity);
  }
}

// Реєстрація через провайдер — підміна реалізації без зміни коду
providers: [
  { provide: DataSource, useFactory: (http: HttpClient) =>
    new ApiDataSource(http, '/api/users'), deps: [HttpClient] }
]
```

### Production Scenario

```typescript
// Composition через hostDirectives (Angular 15+)
@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {
  @Input() appTooltip = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private overlayRef: OverlayRef | null = null;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainer: ViewContainerRef,
  ) {}

  @HostListener('mouseenter')
  show(): void {
    // create overlay and attach tooltip component
  }

  @HostListener('mouseleave')
  hide(): void {
    this.overlayRef?.dispose();
  }
}

@Directive({
  selector: '[appLoadingState]',
  standalone: true,
})
export class LoadingStateDirective {
  @Input() set appLoadingState(loading: boolean) {
    this.elementRef.nativeElement.classList.toggle('is-loading', loading);
    this.elementRef.nativeElement.toggleAttribute('disabled', loading);
  }

  constructor(private elementRef: ElementRef) {}
}

// Composition замість inheritance — компонент використовує поведінку
// через hostDirectives, а не extends BaseButtonComponent
@Component({
  selector: 'app-action-button',
  standalone: true,
  hostDirectives: [
    { directive: TooltipDirective, inputs: ['appTooltip', 'tooltipPosition'] },
    { directive: LoadingStateDirective, inputs: ['appLoadingState'] },
  ],
  template: `<button><ng-content /></button>`,
})
export class ActionButtonComponent {
  // Чиста відповідальність — тільки button-specific логіка
  @Output() actionComplete = new EventEmitter<void>();
}
```

### Anti-Example

```typescript
// ПОГАНО: God-component з наслідуванням та порушенням інкапсуляції
class BaseComponent {
  public userData: any;         // public mutable state — порушення інкапсуляції
  public http: HttpClient;      // expose internal dependency
  public router: Router;

  constructor(injector: Injector) {
    // Service Locator anti-pattern — ховає залежності
    this.http = injector.get(HttpClient);
    this.router = injector.get(Router);
  }

  loadUser() {
    this.http.get('/api/user').subscribe(data => this.userData = data);
  }
}

// Дочірній компонент тісно пов'язаний з батьківським
@Component({ selector: 'app-profile', template: '...' })
class ProfileComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);  // передача injector — red flag
  }

  ngOnInit() {
    this.loadUser();
    // Прямий доступ до parent's public field — tight coupling
    console.log(this.userData);
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| God Component з 500+ рядків | Порушує SRP, неможливо тестувати та підтримувати | Декомпозиція на presentation + smart components, виділення логіки в сервіси |
| Injector.get() (Service Locator) | Ховає залежності, ускладнює тестування, порушує DIP | Explicit constructor injection — залежності видні в конструкторі |
| Deep inheritance hierarchy (3+ рівні) | Fragile base class problem, складно розуміти поведінку | Composition через hostDirectives, сервіси, content projection |
| Public mutable state в сервісах | Порушує інкапсуляцію, непередбачувані side effects | Private state + public readonly observable/signal, immutable updates |
| Instanceof checks замість поліморфізму | Порушує OCP, потребує зміни при додаванні нового типу | Поліморфізм через DI tokens, strategy pattern, visitor pattern |

## Interview Block

### [L1 — Warm-up] Які основні принципи ООП ви знаєте і як вони проявляються в Angular-компонентах?

**Signal being tested:** Базове розуміння ООП та здатність пов'язати теорію з Angular-практикою.

**What the interviewer expects:** Кандидат називає всі чотири принципи і дає хоча б по одному прикладу з Angular для кожного. Не просто перелік, а розуміння як Angular використовує ці принципи.

**How to probe deeper:** "Чому Angular використовує класи замість plain objects для компонентів?", "Який принцип ООП стоїть за Angular DI?"

**Reference answer:** Див. frontmatter b0t1q1.

**Common mistakes:** Перелічують принципи без прикладів з Angular. Плутають інкапсуляцію з ViewEncapsulation. Забувають про абстракцію як окремий принцип.

### [L2 — Core Understanding] Чому в Angular рекомендують композицію замість наслідування компонентів?

**Signal being tested:** Розуміння trade-offs між inheritance та composition в контексті Angular compiler та architecture.

**What the interviewer expects:** Кандидат пояснює конкретні технічні проблеми наслідування в Angular (metadata, lifecycle hooks) і знає про hostDirectives як framework-level рішення.

**How to probe deeper:** "Що таке hostDirectives і як вони вирішують проблему?", "Покажіть приклад де наслідування все ж доречне в Angular."

**Reference answer:** Див. frontmatter b0t1q2.

**Common mistakes:** Повторюють "composition over inheritance" як мантру без пояснення чому саме в Angular. Не знають про обмеження metadata inheritance.

### [L2 — Core Understanding] Як Angular реалізує інкапсуляцію на рівні компонентів?

**Signal being tested:** Глибоке розуміння ViewEncapsulation та механізмів ізоляції в Angular.

**What the interviewer expects:** Кандидат пояснює всі три стратегії, розуміє як Emulated працює під капотом (attribute selectors), знає trade-offs кожної.

**How to probe deeper:** "Що відбувається коли компонент з None вкладений в компонент з Emulated?", "Як ::ng-deep працює і чому він deprecated?"

**Reference answer:** Див. frontmatter b0t1q3.

**Common mistakes:** Не знають що Emulated — це compile-time трансформація. Думають що ViewEncapsulation захищає від XSS. Зловживають ::ng-deep.

### [L3 — Advanced] Як Angular внутрішньо використовує поліморфізм через Dependency Injection?

**Signal being tested:** Розуміння DI як ООП-патерна, знання injector hierarchy та resolution strategy.

**What the interviewer expects:** Кандидат пояснює два дерева інжекторів, resolution order, модифікатори (@Self, @SkipSelf), та як multi-providers реалізують поліморфізм.

**How to probe deeper:** "Що таке bloom filter в контексті Angular DI?", "Як працює tree-shaking для providedIn: 'root'?"

**Reference answer:** Див. frontmatter b0t1q4.

**Common mistakes:** Не розрізняють Element та Module injector trees. Не знають про bloom filter. Плутають useExisting (alias) з useClass (нова інстанція).

### [L4 — Architecture] Спроектуйте plugin-based архітектуру на Angular з використанням ООП-принципів.

**Signal being tested:** Здатність застосувати ООП-принципи для проектування складної extensible системи.

**What the interviewer expects:** Кандидат описує contract (abstract class), registry, extension points, lazy loading, sandbox isolation. Демонструє як всі чотири ООП-принципи працюють разом в реальній архітектурі.

**How to probe deeper:** "Як вирішити залежності між плагінами?", "Як забезпечити backward compatibility при оновленні plugin API?"

**Reference answer:** Див. frontmatter b0t1q5.

**Common mistakes:** Забувають про lifecycle management. Не враховують lazy loading. Дають плагінам необмежений доступ до core services.

## Summary

### Key Points

- Angular побудований на TypeScript-класах — ООП є фундаментом framework, а не опціональним підходом
- Інкапсуляція в Angular працює на кількох рівнях: ViewEncapsulation для стилів, access modifiers для даних, OnPush для change detection, component boundaries для API
- Наслідування компонентів має суттєві обмеження через Angular compiler — metadata не мерджиться, що робить композицію кращим вибором
- hostDirectives (Angular 15+) — офіційне рішення для composition на рівні framework
- DI — це реалізація IoC та поліморфізму, де InjectionToken + providers дозволяють підміняти реалізації без зміни коду
- Abstract класи використовуються як DI-токени замість інтерфейсів, бо інтерфейси стираються при компіляції
- Bloom filter в Ivy NodeInjector забезпечує O(1) lookup при resolution залежностей

### Elevator Pitch (2 minutes)

"Angular — це framework побудований на ООП-принципах. Кожен компонент, сервіс та директива — це TypeScript-клас, де інкапсуляція забезпечується через ViewEncapsulation та access modifiers, поліморфізм — через DI-провайдери та multi-tokens, абстракція — через abstract класи як DI-контракти. Наслідування в Angular має обмеження — metadata декораторів не мерджиться, тому framework еволюціонував до composition-first підходу через hostDirectives, content projection та DI. Розуміння як Angular використовує ООП під капотом — від bloom filter в injector resolution до compile-time CSS scoping — дозволяє приймати правильні архітектурні рішення та будувати масштабовані застосунки."
