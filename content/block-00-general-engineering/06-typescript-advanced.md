---
title: "Advanced TypeScript for Angular"
block: 0
topic: 6
slug: "typescript-advanced"
difficulty: 4
tags: ["typescript", "generics", "type-guards", "mapped-types", "conditional-types", "utility-types", "decorators"]
relatedTopics: ["oop-principles", "design-patterns"]
interviewQuestions:
  - id: "b0t6q1"
    level: "junior"
    question: "Що таке generics у TypeScript і навіщо вони потрібні?"
    referenceAnswers:
      junior: "Generics — це параметри типів, які дозволяють писати функції та класи, що працюють з різними типами даних. Наприклад, Array<number> і Array<string> — один і той самий Array, але з різним типом елементів."
      mid: "Generics забезпечують type safety без втрати гнучкості. Замість any, ми параметризуємо тип: function identity<T>(arg: T): T повертає той самий тип, що прийняла. В Angular generics скрізь: Signal<T>, Observable<T>, EventEmitter<T>, FormControl<T>. Generics дозволяють компілятору перевіряти consistency типів на етапі компіляції, а не в runtime."
      senior: "Generics — фундамент type-level програмування в TypeScript. Вони реалізують parametric polymorphism — один код працює з будь-якими типами при збереженні type safety. В Angular: Signal<T> гарантує що .set() приймає той самий тип що .get() повертає. FormGroup використовує generics для typed forms — FormGroup<{ name: FormControl<string> }> не дозволить .get('name')?.value бути any. Generics мають constraints (extends), defaults, і можуть бути inferred з контексту. Важливо: generics стираються при компіляції (type erasure) — вони не існують в runtime JavaScript."
      staff: "Generics в TypeScript реалізують System F (polymorphic lambda calculus) з обмеженнями. Вони критичні для Angular's type infrastructure: Signal<T> використовує variance для readonly/writable розмежування (WritableSignal<T> extends Signal<T>). RxJS pipes використовують generic chaining — pipe(map<A,B>, filter<B>) де кожен оператор трансформує тип. Для архітектури це означає: правильне використання generics дозволяє будувати type-safe API layers де помилки ловляться при компіляції. В enterprise кодбазах я проектую generic base classes для HTTP services (CrudService<T, ID>), generic state management (Store<State, Actions>), generic form builders. Constraint inference через conditional types дозволяє створювати self-documenting APIs де неправильне використання неможливе на рівні типів. Проблема over-generalization: надмірні generics роблять код нечитабельним — потрібен баланс між type safety і DX."
    commonMistakes:
      - "Використовують any замість generics — втрачають type safety"
      - "Не розуміють type erasure — намагаються робити runtime перевірки generic типів"
    relatedQuestions: ["b0t6q2", "b0t6q3"]
  - id: "b0t6q2"
    level: "mid"
    question: "Як працюють type guards і навіщо вони потрібні в Angular?"
    referenceAnswers:
      junior: "Type guards — це перевірки, які звужують тип змінної. Наприклад, if (typeof x === 'string') дозволяє TypeScript знати, що x — це string всередині if блоку."
      mid: "Type guards звужують union types до конкретного типу. Є вбудовані (typeof, instanceof, in) та custom (функції з is predicate). В Angular вони корисні для template type narrowing та перевірки response від API. Наприклад, якщо API повертає SuccessResponse | ErrorResponse, type guard дозволяє безпечно обробити обидва випадки. Custom type guard: function isErrorResponse(r: ApiResponse): r is ErrorResponse — повертає boolean, але TypeScript звужує тип."
      senior: "Type guards — механізм control flow analysis в TypeScript compiler. Compiler відстежує narrowing через branches. Вбудовані: typeof (primitives), instanceof (classes), in (property check), === null/undefined. Custom type guards з is predicate — найпотужніший інструмент. В Angular: canActivate guards перевіряють auth state, pipe operators звужують Observable types. Важливо: type guards мають runtime cost — це реальні перевірки. Assertion functions (asserts x is T) — альтернатива що кидає error замість повернення boolean. Discriminated unions (type: 'success' | 'error') — найефективніший pattern для type narrowing в Redux-like state management."
      staff: "Type guards — це bridge між runtime та compile-time type systems. В enterprise Angular: 1) API layer — discriminated unions для response types з exhaustive switch для handling. 2) State management — guards для state transitions (isDraftState, isPublishedState). 3) Template narrowing — Angular compiler розуміє type guards через $any() workaround або через explicit narrowing в component class. Архітектурно: type guards створюють contract між layers — API adapter гарантує що data пройшла validation через guard перш ніж потрапити в domain layer. Проблема: type guards можуть брехати — function isUser(x: unknown): x is User може повертати true для неповного об'єкту. Рішення: runtime validation (zod, io-ts) що генерує type guards автоматично. В Angular 17+ з control flow (@if, @switch) type narrowing працює нативно в templates."
    commonMistakes:
      - "Пишуть type guards що не роблять реальну runtime перевірку — тип звужується але дані некоректні"
      - "Не знають про discriminated unions як альтернативу ланцюжку if/else"
    relatedQuestions: ["b0t6q1", "b0t6q4"]
  - id: "b0t6q3"
    level: "mid"
    question: "Що таке mapped types і conditional types? Як вони використовуються в Angular?"
    referenceAnswers:
      junior: "Mapped types створюють нові типи на основі існуючих, змінюючи кожну property. Conditional types — це як if/else але для типів. Наприклад, Partial<T> робить всі поля optional."
      mid: "Mapped types ітерують по ключах типу: { [K in keyof T]: NewType }. Utility types — це mapped types: Partial<T>, Required<T>, Readonly<T>, Pick<T,K>, Record<K,V>. Conditional types: T extends U ? X : Y — вибирають тип за умовою. В Angular: Readonly використовується для immutable state, Partial — для patch operations (HttpClient.patch), Pick — для DTO з повної моделі. FormGroup typing внутрішньо використовує mapped types для типізації controls."
      senior: "Mapped types — iteration over type keys з трансформацією: модифікатори (+/- readonly, +/- optional), key remapping (as clause). Conditional types з infer — pattern matching для типів: type UnwrapSignal<T> = T extends Signal<infer U> ? U : T витягує inner type. Angular's typed forms використовують це інтенсивно: FormGroup<{name: FormControl<string>}>.value має тип {name: string | undefined} — це mapped type що трансформує FormControl<T> → T | undefined. Template literal types (v4.1) дозволяють type-safe routing: type Route = `/api/${string}/details`. Distributive conditional types працюють по-різному для union types — це часте джерело багів."
      staff: "Mapped та conditional types — це type-level computation, Turing-complete підмножина TypeScript. Вони дозволяють кодувати business rules в type system. В enterprise Angular: 1) Form builder types — DeepPartial<T> для patch forms, RequiredFields<T, 'name' | 'email'> для validation. 2) API contract types — mapped type що генерує endpoint signatures з schema: type Api<Schema> = { [K in keyof Schema]: (params: Schema[K]['input']) => Observable<Schema[K]['output']> }. 3) State machine types — conditional types для valid transitions. 4) Template literal types для route params: type ExtractParams<T> = T extends `${string}:${infer P}/${infer Rest}` ? P | ExtractParams<Rest> : never. Проблема: складні type-level computations уповільнюють IDE та tsc. Рекомендую: benchmark типів через trace flag (--generateTrace), кешувати складні types через type aliases, уникати глибокої рекурсії (ліміт ~50 рівнів)."
    commonMistakes:
      - "Не розуміють distributive behavior conditional types з union — wrapping в tuple вимикає distribution"
      - "Створюють надто складні types що уповільнюють компіляцію"
    relatedQuestions: ["b0t6q2", "b0t6q4"]
  - id: "b0t6q4"
    level: "senior"
    question: "Як працюють декоратори в TypeScript та як Angular їх використовує внутрішньо?"
    referenceAnswers:
      junior: "Декоратори — це спеціальні функції що додають метадані до класів. Angular використовує @Component, @Injectable, @Input для позначення що клас є компонентом, сервісом, або що властивість приймає дані."
      mid: "Декоратори — функції що викликаються при визначенні класу (не при створенні instance). @Component({...}) зберігає metadata (template, styles, selector) що Angular compiler читає при AOT compilation. @Injectable({providedIn: 'root'}) реєструє клас в root injector. Під капотом, декоратори використовують reflect-metadata API для зберігання метаданих. В Angular Ivy, декоратори компілюються в static fields: ɵcmp, ɵinj, ɵfac — runtime не потребує reflect-metadata."
      senior: "TypeScript має legacy decorators (experimentalDecorators) і TC39 Stage 3 decorators — це різні API. Angular використовує legacy decorators як compile-time markers. AOT compiler (ngtsc) читає decorator metadata з AST — decorator functions не виконуються в production build. Замість цього compiler генерує static fields: @Component → ɵcmp з component definition, @Injectable → ɵprov з provider definition. Це дозволяє tree-shaking — якщо component не використовується, його definition видаляється. Parameter decorators (@Inject, @Optional) трансформуються в factory function parameters. Signal-based alternatives (@input() → input(), @Output → output()) використовують функції замість decorators для кращого type inference та tree-shaking."
      staff: "Декоратори в Angular — це facade над compiler transformation pipeline. Архітектурно це separation of concerns: розробник пише декларативний код (@Component), compiler трансформує його в imperative runtime instructions (ɵɵdefineComponent). Еволюція: Angular 2-8 використовував runtime decorator execution + reflect-metadata (великий overhead). Ivy перемістив всю роботу в compile-time: decorator — лише маркер для ngtsc. TC39 decorators (Stage 3) мають інший API — Angular поки не мігрував, бо legacy decorators покривають потреби і міграція зламала б ecosystem. Signal-based APIs (input(), output(), viewChild()) — це стратегічний відхід від decorators: функції дають кращий type inference (input<string>() vs @Input() name!: string), працюють з strict mode без non-null assertion, і дозволяють IDE надавати точніші автодоповнення. Для custom decorators в enterprise: використовуйте для cross-cutting concerns (logging, memoization, validation) але пам'ятайте — вони не tree-shakable і створюють implicit dependencies що ускладнюють reasoning про код."
    commonMistakes:
      - "Вважають що декоратори виконуються в runtime в production Angular — з Ivy це не так"
      - "Плутають TC39 Stage 3 decorators з TypeScript legacy decorators"
      - "Не знають про signal-based alternatives (@input → input())"
    relatedQuestions: ["b0t6q3", "b0t6q5"]
  - id: "b0t6q5"
    level: "staff"
    question: "Як би ви спроектували type-safe API layer для великого Angular додатку використовуючи advanced TypeScript?"
    referenceAnswers:
      junior: "Я б створив інтерфейси для всіх API responses і використовував HttpClient з generic типами: http.get<User[]>('/api/users')."
      mid: "Я б створив generic base service з CRUD операціями: CrudService<T> з методами getAll(): Observable<T[]>, getById(id): Observable<T>, create(data: Partial<T>): Observable<T>. Кожен entity service extends CrudService з конкретним типом. Response types через discriminated unions для error handling. Interceptors для auth та error transformation."
      senior: "Type-safe API layer: 1) Schema definition — single source of truth для endpoint types (можна генерувати з OpenAPI). 2) Generic HTTP adapter: ApiClient<Schema> де Schema описує всі endpoints як mapped type. 3) Request/Response types через conditional types: type ResponseOf<E extends Endpoint> = E extends {response: infer R} ? R : never. 4) Typed interceptors через generic chain. 5) Runtime validation через zod schemas що генерують TypeScript типи — compile-time type safety + runtime validation. 6) Error types як discriminated unions з exhaustive handling. Це дає: один тип зміни в schema каскадно показує всі місця що потрібно оновити."
      staff: "Архітектура type-safe API layer для enterprise: 1) Contract-first approach — OpenAPI spec → codegen (openapi-typescript) генерує types + runtime validators. CI pipeline перевіряє що backend spec синхронізований з frontend types. 2) Generic API client з type-level routing: type Api = DefineApi<{'/users': {GET: {response: User[]}, POST: {body: CreateUser, response: User}}, '/users/:id': {GET: {params: {id: string}, response: User}}}>. Mapped types генерують callable interface: api.get('/users') returns Observable<User[]>. 3) Response handling через Result monad pattern: ApiResult<T> = Success<T> | Failure<ApiError> з type-safe chaining (.map, .flatMap). 4) Cache layer з generic TTL: CacheConfig<T> з invalidation keys typed до endpoints. 5) Optimistic updates з generic rollback: type OptimisticUpdate<T> = {apply: (state: T) => T, rollback: (state: T) => T}. 6) Type testing — dtslint або tsd для перевірки що types працюють як очікується. Trade-off: over-engineering types збільшує cognitive load і compilation time. Метрика: якщо тип читається довше 30 секунд — спростити."
    commonMistakes:
      - "Не валідують runtime data — TypeScript types не гарантують що API поверне правильні дані"
      - "Дублюють types між backend і frontend замість генерації з schema"
      - "Over-engineer типи до нечитабельності"
    relatedQuestions: ["b0t6q4", "b0t6q3"]
---

## Core Concept

**English definition:** Advanced TypeScript encompasses generics, conditional types, mapped types, type guards, decorators, template literal types, and the `infer` keyword — features that enable type-level programming and form the backbone of Angular's type safety infrastructure.

**Пояснення:** TypeScript для Angular — це не просто "JavaScript з типами". Це повноцінна система type-level programming, де типи самі по собі є мовою програмування. Angular внутрішньо використовує найскладніші можливості TypeScript: generics параметризують Signal<T>, Observable<T>, FormControl<T>; conditional types визначають return types compiler API; mapped types будують typed forms; декоратори є основою компонентної моделі. Розуміння цих механізмів на глибокому рівні — різниця між тим хто "пише Angular" і тим хто будує type-safe архітектуру.

**Яку проблему вирішує:** Без advanced TypeScript великі Angular кодбази деградують в "any-driven development" — втрачається head type safety, рефакторинг стає небезпечним, API контракти не перевіряються компілятором. Advanced types дозволяють: ловити баги при компіляції замість runtime; робити рефакторинг з confidence; створювати self-documenting APIs де неправильне використання неможливе.

**Як працює під капотом:**

TypeScript compiler працює в декілька фаз:
1. **Parsing** — source code → AST
2. **Binding** — створює symbol table, resolves scopes
3. **Type checking** — evaluates types, resolves generics, checks constraints
4. **Emit** — генерує JavaScript (всі типи стираються — type erasure)

Generics реалізують parametric polymorphism — type parameter T замінюється конкретним типом при використанні. Conditional types (`T extends U ? X : Y`) — це pattern matching на рівні типів. Mapped types (`{[K in keyof T]: ...}`) — iteration по type keys. `infer` — extraction під-типів з pattern.

```typescript
// Type-level computation: витягуємо тип значення з Signal
type UnwrapSignal<T> = T extends Signal<infer U> ? U : never;

type UserSignal = Signal<User>;
type ExtractedUser = UnwrapSignal<UserSignal>; // User

// Mapped type: робимо всі поля сигналами
type Signalify<T> = {
  [K in keyof T]: WritableSignal<T[K]>;
};

interface UserForm {
  name: string;
  age: number;
}
type UserSignals = Signalify<UserForm>;
// { name: WritableSignal<string>; age: WritableSignal<number> }
```

**Trade-offs та обмеження:**

- Складні типи уповільнюють tsc і IDE — TypeScript має ліміт рекурсії ~50 рівнів
- Type erasure означає що generics не існують в runtime — неможливо зробити `if (T === string)`
- Over-engineering типів знижує readability — баланс між safety і DX
- Декоратори мають два несумісних стандарти (legacy vs TC39 Stage 3)
- Conditional types з union мають distributive behavior що часто неочікуваний

**Як Angular це використовує:**

- **Signal<T> / WritableSignal<T>** — generics для type-safe reactive state. `WritableSignal<T> extends Signal<T>` використовує variance
- **FormGroup<TControl>** — mapped types для typed forms: `.value` тип обчислюється з control types
- **@Component, @Injectable** — legacy decorators як compile-time markers для ngtsc
- **Router** — template literal types для typed route parameters в `withComponentInputBinding()`
- **HttpClient** — `get<T>(url): Observable<T>` — generic для response typing
- **inject<T>(token)** — conditional types для визначення return type з `InjectOptions`
- **ɵɵdefineComponent** — compiler output використовує conditional types для feature detection

## Deep Details

### Edge Cases

- **Distributive conditional types з never:** `type Test = never extends string ? 'yes' : 'no'` дає `never`, бо `never` — порожній union, distribution по порожній множині дає `never`. Wrap в tuple: `[never] extends [string] ? 'yes' : 'no'` дає `'yes'`.
- **Generic inference з overloads:** TypeScript вибирає останній overload при inferring — порядок overloads в `.d.ts` має значення.
- **Decorator execution order:** Property decorators перед class decorators. В Angular це впливає на порядок metadata registration.
- **Readonly vs Immutable:** `Readonly<T>` — shallow. `DeepReadonly<T>` потрібно реалізовувати вручну через recursive mapped type.

```typescript
// DeepReadonly — рекурсивний mapped type
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

// Використання з Angular Signal
const state: DeepReadonly<AppState> = {
  user: { name: 'John', address: { city: 'Kyiv' } },
};
// state.user.address.city = 'Lviv'; // TS Error!
```

### Junior vs Senior Understanding

**Junior** знає: `Array<number>`, `Observable<User>`, базові utility types (`Partial`, `Readonly`), `typeof` / `instanceof` для narrowing.

**Senior** розуміє:
- Type-level programming як окрему дисципліну — generics, conditionals, mapped types, infer як складові type-level мови
- Variance (covariance/contravariance) і як вона впливає на generic constraints
- Compiler performance implications — коли типи уповільнюють збірку
- Runtime validation gap — TypeScript types не гарантують runtime correctness

```typescript
// Senior-level: Generic constraint з conditional return type
function getFormValue<T extends AbstractControl>(
  control: T
): T extends FormControl<infer V>
  ? V
  : T extends FormGroup<infer C>
    ? { [K in keyof C]: C[K] extends AbstractControl<infer V> ? V : never }
    : unknown {
  return control.value;
}

// TypeScript infers exact return type based on input
const nameValue = getFormValue(new FormControl('John')); // string
const formValue = getFormValue(new FormGroup({
  name: new FormControl(''),
  age: new FormControl(0),
})); // { name: string; age: number }
```

### Connections to Other Concepts

- **OOP Principles:** Generics реалізують Liskov Substitution Principle на рівні типів — `WritableSignal<T>` може використовуватись як `Signal<T>`
- **Design Patterns:** Factory pattern з generics (`create<T>(config: Config<T>): T`), Strategy pattern з conditional types
- **Dependency Injection:** Angular's `inject<T>()` використовує generic для виведення типу з `InjectionToken<T>`
- **RxJS:** Pipe operators ланцюгово трансформують generic types — `Observable<A>.pipe(map<A,B>(...))` → `Observable<B>`

## Examples

### Basic Usage

```typescript
// Generics з constraints для Angular service
interface HasId {
  id: string | number;
}

abstract class CrudService<T extends HasId> {
  protected abstract endpoint: string;

  constructor(private http: HttpClient) {}

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.endpoint);
  }

  getById(id: T['id']): Observable<T> {
    // T['id'] — indexed access type
    return this.http.get<T>(`${this.endpoint}/${id}`);
  }

  update(entity: Partial<T> & Pick<T, 'id'>): Observable<T> {
    // Partial для часткового оновлення, але id обов'язковий
    return this.http.patch<T>(
      `${this.endpoint}/${entity.id}`,
      entity
    );
  }
}

// Конкретний service — тип виводиться автоматично
@Injectable({ providedIn: 'root' })
export class UserService extends CrudService<User> {
  protected endpoint = '/api/users';
  constructor(http: HttpClient) { super(http); }
}
```

### Production Scenario

```typescript
// Type-safe form builder з mapped types
type FormShape<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? FormArray<FormControl<U>>
    : T[K] extends object
      ? FormGroup<FormShape<T[K]>>
      : FormControl<T[K]>;
};

interface UserProfile {
  name: string;
  email: string;
  address: {
    street: string;
    city: string;
  };
  tags: string[];
}

type UserProfileForm = FormShape<UserProfile>;
// Result:
// {
//   name: FormControl<string>;
//   email: FormControl<string>;
//   address: FormGroup<{
//     street: FormControl<string>;
//     city: FormControl<string>;
//   }>;
//   tags: FormArray<FormControl<string>>;
// }

// Type guard з runtime validation (zod integration)
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

type User = z.infer<typeof UserSchema>; // Type generated from schema

function validateUser(data: unknown): data is User {
  return UserSchema.safeParse(data).success;
}

// В Angular service
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);

  getUser(id: number): Observable<User> {
    return this.http.get<unknown>(`/api/users/${id}`).pipe(
      map(data => {
        const result = UserSchema.safeParse(data);
        if (!result.success) {
          throw new ApiValidationError(result.error);
        }
        return result.data; // typed as User
      })
    );
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: any everywhere — no type safety
@Injectable({ providedIn: 'root' })
export class DataService {
  getData(endpoint: string): Observable<any> {
    return this.http.get<any>(endpoint);
  }
  transformData(data: any): any {
    return data.map((item: any) => ({ ...item, processed: true }));
  }
}

// ❌ WRONG: type assertion замість type guard
function processResponse(response: ApiResponse) {
  const data = response as SuccessResponse; // Небезпечно!
  console.log(data.items); // Runtime error якщо це ErrorResponse
}

// ✅ CORRECT: generic service з type guards
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  getData<T>(endpoint: string, validator: (data: unknown) => data is T): Observable<T> {
    return this.http.get<unknown>(endpoint).pipe(
      map(data => {
        if (!validator(data)) {
          throw new TypeError(`Invalid response from ${endpoint}`);
        }
        return data;
      })
    );
  }
}

// ✅ CORRECT: discriminated union з exhaustive check
type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; code: number };

function handleResponse<T>(response: ApiResponse<T>): T {
  switch (response.status) {
    case 'success': return response.data;
    case 'error': throw new ApiError(response.error, response.code);
    default: {
      const _exhaustive: never = response;
      throw new Error(`Unhandled status: ${_exhaustive}`);
    }
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `as` type assertions скрізь | Обходить type checker — баги проявляються в runtime | Type guards або discriminated unions для safe narrowing |
| `any` в generic position (`Observable<any>`) | Втрата type safety по всьому ланцюжку pipe | Explicit generic: `Observable<User[]>` або `unknown` + validation |
| Надто глибока рекурсія в типах | Уповільнює tsc, може досягти recursion limit | Обмежити глибину, кешувати через type aliases |
| `!` (non-null assertion) замість proper null handling | Потенційний runtime undefined/null | Optional chaining (`?.`), nullish coalescing (`??`), або explicit check |
| Дублювання types між interfaces та runtime validation | Розсинхронізація — type каже одне, runtime інше | Single source of truth: zod schema → infer type, або codegen з OpenAPI |

## Interview Block

### [L1 — Warm-up] Що таке generics у TypeScript і навіщо вони потрібні?

**Signal being tested:** Чи розуміє кандидат базову концепцію parametric polymorphism чи просто копіює `<T>` з прикладів

**What the interviewer expects:** Пояснення ідеї "один код для різних типів", приклади з Angular (Observable, Signal, HttpClient), розуміння різниці з any

**How to probe deeper:** "Чим generic відрізняється від any? Що таке generic constraints і навіщо вони потрібні?"

**Reference answer:** Generics параметризують типи — дозволяють писати код що працює з різними типами без втрати type safety. На відміну від any, generic зберігає зв'язок між вхідними і вихідними типами. В Angular: Signal<T>, Observable<T>, FormControl<T>.

**Common mistakes:** Не бачать різниці між generic і any; не можуть навести приклад де generic вирішує реальну проблему

### [L2 — Competence] Як працюють type guards і навіщо вони потрібні в Angular?

**Signal being tested:** Чи розуміє кандидат control flow analysis і може застосувати narrowing для реальних задач

**What the interviewer expects:** Знання вбудованих і custom type guards, is predicate, discriminated unions, приклади з API handling

**How to probe deeper:** "Як зробити exhaustive check для discriminated union? Що таке assertion functions?"

**Reference answer:** Type guards звужують union types через runtime перевірки. Вбудовані (typeof, instanceof) та custom (is predicate). В Angular — для API response handling з discriminated unions та template narrowing з @if.

**Common mistakes:** Пишуть type guards без реальної runtime перевірки; не знають про discriminated unions; плутають type assertion (as) з type guard

### [L2 — Competence] Що таке mapped types і conditional types? Як вони використовуються в Angular?

**Signal being tested:** Чи здатний кандидат до type-level programming чи обмежується базовими типами

**What the interviewer expects:** Розуміння механізму mapped types (keyof, in), conditional types (extends, infer), зв'язок з Angular typed forms та utility types

**How to probe deeper:** "Напишіть тип DeepPartial<T>. Як працює infer keyword? Що таке distributive conditional types?"

**Reference answer:** Mapped types ітерують по ключах: `{[K in keyof T]: ...}`. Conditional types — pattern matching: `T extends U ? X : Y`. Angular typed forms використовують обидва для виведення .value типу з FormGroup controls.

**Common mistakes:** Не розуміють distributive behavior; плутають keyof з Object.keys; не знають про infer

### [L3 — Depth] Як працюють декоратори в TypeScript та як Angular їх використовує внутрішньо?

**Signal being tested:** Чи розуміє кандидат Angular compiler pipeline чи бачить декоратори як "магію"

**What the interviewer expects:** Різниця між legacy та TC39 decorators, compile-time vs runtime execution, Ivy compilation, signal-based migration

**How to probe deeper:** "Що генерує Angular compiler замість @Component? Чому Angular мігрує від decorators до функцій (input(), output())?"

**Reference answer:** Angular використовує legacy TypeScript decorators як compile-time маркери. AOT compiler (ngtsc) читає metadata з AST, не виконуючи decorator функції. Генерує static fields (ɵcmp, ɵprov). Signal-based APIs (input(), output()) замінюють decorator-based для кращого type inference і tree-shaking.

**Common mistakes:** Вважають що декоратори виконуються в runtime в production; не знають про signal-based alternatives; плутають два стандарти decorators

### [L4 — Architecture] Як би ви спроектували type-safe API layer для великого Angular додатку використовуючи advanced TypeScript?

**Signal being tested:** Чи може кандидат проектувати type-safe архітектуру на рівні всієї системи, а не окремих файлів

**What the interviewer expects:** Contract-first підхід, codegen, runtime validation, Result pattern, cache typing, performance considerations

**How to probe deeper:** "Як забезпечити що frontend types завжди синхронізовані з backend? Як тестувати самі типи?"

**Reference answer:** Contract-first: OpenAPI → codegen для types. Generic API client з mapped types для endpoint routing. Runtime validation (zod) як bridge між compile-time types і runtime data. Result monad для error handling. Type testing (tsd). CI перевіряє синхронізацію з backend spec.

**Common mistakes:** Не валідують runtime data; дублюють types вручну; створюють нечитабельні типи; не думають про compilation performance

## Summary

### Key Points
- Generics забезпечують parametric polymorphism — один код для різних типів зі збереженням type safety
- Type guards — bridge між compile-time і runtime, критичні для safe API handling
- Mapped types + conditional types = type-level programming для typed forms, API layers, state management
- Decorators в Angular — compile-time маркери, не runtime функції (з Ivy). Signal-based функції їх замінюють
- `infer` keyword — pattern matching для витягування під-типів, використовується в Angular internal types
- Runtime validation (zod) необхідний — TypeScript types стираються при компіляції
- Balance: type safety vs readability vs compiler performance

### Elevator Pitch (2 minutes)
"Advanced TypeScript для Angular — це не академічна вправа, а практичний інструмент для побудови надійних додатків. Generics дають type-safe signals, observables, forms. Type guards забезпечують safe handling API responses. Mapped types дозволяють генерувати складні form types з простих interfaces. Conditional types з infer — це pattern matching для типів, який Angular використовує всюди від inject() до typed forms. Декоратори — основа компонентної моделі, але Angular мігрує до function-based API (input(), output()) для кращого type inference. Головне правило: types мають допомагати розробнику, а не ускладнювати код. Якщо тип не можна прочитати за 30 секунд — його потрібно спростити."
