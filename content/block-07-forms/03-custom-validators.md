---
title: "Custom Validators & Cross-Field Validation"
block: 7
topic: 3
slug: "custom-validators"
difficulty: 3
sinceVersion: "2"
tags: ["Validator", "AsyncValidator", "ValidatorFn", "cross-field-validation", "NG_VALIDATORS", "ValidationErrors"]
relatedTopics: ["reactive-forms", "template-driven-forms", "control-value-accessor", "http-interceptors"]
interviewQuestions:
  - level: "junior"
    question: "Як створити custom validator для reactive form?"
    referenceAnswers:
      junior: "Custom validator — це функція що приймає AbstractControl і повертає об'єкт з помилками або null якщо валідно. Наприклад: (control) => control.value < 0 ? {negative: true} : null."
      mid: "ValidatorFn — це (control: AbstractControl) => ValidationErrors | null. ValidationErrors — це Record<string, any>. Для reactive forms передається як другий аргумент FormControl: new FormControl('', [myValidator]). Для параметризованих validators використовують factory: function minAge(age: number): ValidatorFn { return (ctrl) => ctrl.value >= age ? null : {minAge: {required: age, actual: ctrl.value}}; }. Помилки доступні через control.hasError('minAge') або control.errors?.minAge."
      senior: "ValidatorFn signature: (control: AbstractControl) => ValidationErrors | null. Важливі деталі: 1) Validator має бути pure function — не мутувати control, не мати side effects. 2) ValidationErrors — key-value де key — error code, value — details для error message. Convention: включати actual і required values: {minAge: {required: 18, actual: 15}}. 3) Для reusable validators — factory pattern з closure. 4) Validators.compose([v1, v2]) — combines validators, повертає перший error або null. 5) У typed forms AbstractControl generic: AbstractControl<string> — можна type-narrow value. 6) Validators виконуються при кожному updateValueAndValidity() — для дорогих перевірок використовувати async validators з debounce."
      staff: "Архітектура validators в Angular побудована на DI і composition. ValidatorFn для pure logic, Validator interface для directive-based validators з DI access. Для enterprise: Validator Registry pattern — централізований mapping string codes на ValidatorFn factories. Це дозволяє server-driven validation де backend повертає validator configs як JSON. Composition: Validators.compose для AND логіки, custom composeOr для OR. Error messages: створити error-message.pipe або directive що mapить error codes на i18n messages. Testing: validators — pure functions, тестуються тривіально. Performance: validators виконуються синхронно при кожній зміні — для складних validators (regex з backtracking) це може бути bottleneck. Solution: memoize або convert до async з debounce."
    commonMistakes:
      - "Повертають true/false замість ValidationErrors | null"
      - "Мутують control всередині validator — side effects"
      - "Не включають деталі в error object — складно побудувати error message"
    relatedQuestions: ["b7t3q2", "b7t2q1"]
  - level: "mid"
    question: "Як реалізувати async validator і як він впливає на form status?"
    referenceAnswers:
      junior: "Async validator — функція що повертає Promise або Observable з результатом валідації. Використовується для перевірок що потребують API call, наприклад перевірка унікальності email."
      mid: "AsyncValidatorFn: (control: AbstractControl) => Promise<ValidationErrors | null> | Observable<ValidationErrors | null>. Передається третім аргументом: new FormControl('', [], [asyncValidator]). Коли async validator запускається, control.status стає 'PENDING'. Observable ПОВИНЕН complete (використовувати first(), take(1), або HTTP Observable що завершується). Важливо: async validators запускаються ТІЛЬКИ якщо всі sync validators пройшли. Для debounce: return timer(300).pipe(switchMap(() => apiCheck(control.value)))."
      senior: "Async validators мають важливі implementation details: 1) Запускаються тільки після проходження всіх sync validators — це optimization, не робити API call якщо format невалідний. 2) control.status = 'PENDING' під час виконання — потрібно обробити в UI (loading indicator). 3) При зміні value попередній async validator cancels (якщо Observable) або ignores (якщо Promise). Angular internally робить unsubscribe від попереднього Observable. 4) Observable ОБОВ'ЯЗКОВО повинен complete — інакше status залишиться PENDING назавжди. 5) Для debounce: не використовувати debounceTime в validator — Angular recreate validator при кожній зміні. Замість цього: updateOn: 'blur' або custom debounce logic в component. 6) Для server validation: HTTP GET з catchError що повертає error object."
      staff: "Async validators в production потребують careful architecture. Pattern: AsyncValidatorFactory що приймає API service і створює validators з: built-in debounce, caching (якщо value не змінився — не робити API call), error handling (network failure != validation failure), cancellation (switchMap семантика). Для enterprise: centralized async validation service що batches multiple validation requests в один API call (замість N паралельних calls для N полів). Status management: PENDING status впливає на submit button, form.statusChanges.pipe(filter(s => s !== 'PENDING')) для submission guard. Race condition: user types fast, multiple API calls — Angular handles cancellation для Observable-based validators, але Promise-based — ні. Always use Observable. Integration з interceptors: не додавати auth interceptor для validation endpoints якщо вони public."
    commonMistakes:
      - "Observable що не complete — status залишається PENDING назавжди"
      - "Не обробляють PENDING стан в UI — кнопка submit доступна під час validation"
      - "Використовують Promise замість Observable — немає cancellation"
    relatedQuestions: ["b7t3q1", "b7t3q3"]
  - level: "senior"
    question: "Як реалізувати cross-field validation і які є підходи?"
    referenceAnswers:
      junior: "Cross-field validation — перевірка що залежить від кількох полів одночасно, наприклад пароль і підтвердження паролю."
      mid: "Cross-field validator встановлюється на FormGroup рівні — другий аргумент FormGroup constructor або fb.group({...}, {validators: [crossValidator]}). Validator отримує FormGroup як control і може перевірити кілька controls: (group) => group.get('password').value === group.get('confirm').value ? null : {mismatch: true}. Помилка встановлюється на FormGroup, не на окремий control. Для показу: form.hasError('mismatch')."
      senior: "Cross-field validation має кілька підходів: 1) Group-level validator — встановлюється на FormGroup, отримує доступ до всіх children. Error на group рівні. 2) Dependent field approach — valueChanges одного control trigger updateValueAndValidity() іншого. Error на field рівні. 3) Composite approach — group validator + setErrors на specific control для UX (error message при конкретному полі). Нюанси: group-level validator спрацьовує при зміні будь-якого child — може бути overhead. Для conditional validation: validator перевіряє condition перед validation (if field A has value, validate B). Error display: group.hasError('code') показує error на form рівні, для показу при конкретному полі — потрібен custom ErrorStateMatcher або manual setErrors."
      staff: "Cross-field validation architecture для enterprise: 1) Declarative validation rules — описувати залежності як конфігурацію: {when: 'fieldA', equals: 'value', then: {field: 'fieldB', validators: [required]}}. ValidationRuleEngine парсить config і створює відповідні group validators. 2) Error attribution — group-level errors не показуються автоматично при полях. Strategy: cross-field validator ставить error на group І через control.setErrors() на relevant control. Gotcha: setErrors() замінює всі errors — потрібно merge з існуючими. 3) Async cross-field: наприклад перевірка що username+email combination unique. Needs combined debounce і single API call. 4) Dynamic dependencies: коли field C залежить від A і B, і A залежить від D — validation DAG. Для складних cases: topological sort validation execution order."
    commonMistakes:
      - "Встановлюють cross-field validator на FormControl замість FormGroup"
      - "Використовують setErrors без merge з існуючими errors — затирають інші помилки"
      - "Не оновлюють dependent controls при зміні — stale validation state"
    relatedQuestions: ["b7t3q2", "b7t3q4"]
  - level: "senior"
    question: "Як реалізувати custom validator directive для template-driven forms?"
    referenceAnswers:
      junior: "Потрібно створити directive що реалізує Validator interface і зареєструвати її через NG_VALIDATORS provider."
      mid: "Directive має: 1) selector — attribute selector, наприклад [appMinAge]. 2) providers: [{provide: NG_VALIDATORS, useExisting: MinAgeDirective, multi: true}]. 3) implements Validator interface з validate(control: AbstractControl): ValidationErrors | null. Для parametrized: @Input() appMinAge: number. Для async: NG_ASYNC_VALIDATORS і AsyncValidator interface з validate() що повертає Observable."
      senior: "Validator directive — це bridge між Angular DI і validation logic. Деталі: 1) multi: true обов'язковий — NG_VALIDATORS є multi-provider, кожна directive додає валідатор до списку. 2) useExisting — не useClass! Використовуємо existing instance directive, не новий. 3) Для dynamic parameters: якщо @Input змінюється, потрібно implements OnChanges і викликати registerOnValidatorChange callback щоб NgModel перезапустив validation. 4) AsyncValidator directive: NG_ASYNC_VALIDATORS provider, validate() повертає Observable<ValidationErrors | null>. Observable MUST complete. 5) Для reuse: directive може делегувати на ValidatorFn factory — тіло validate(): return myValidatorFactory(this.param)(control). 6) Error message access: directive може також provide ErrorStateMatcher для Material forms."
      staff: "Validator directives в enterprise: 1) Shared validation library — набір reusable validator directives з unit tests, published як Angular library. Кожна directive — thin wrapper навколо ValidatorFn для reuse в reactive forms. 2) Server-config driven: meta-directive [appValidate]='validationConfig' що приймає validation config object і динамічно compose validators. Під капотом: registerOnValidatorChange для re-evaluation при config зміні. 3) Integration з i18n error messages: directive може provide error message template або key. 4) Testing: validator directives потребують TestBed для DI — але internal ValidatorFn тестується як pure function. 5) Performance: кожна validator directive — DI resolution при directive instantiation. Для forms з багатьма полями і validators — це measurable overhead. Reactive form validators як functions — zero DI overhead."
    commonMistakes:
      - "Використовують useClass замість useExisting — створюється новий instance без @Input values"
      - "Забувають multi: true — замінюють всі validators замість додавання"
      - "Не викликають registerOnValidatorChange при зміні @Input — stale validation"
    relatedQuestions: ["b7t3q3", "b7t1q3"]
  - level: "staff"
    question: "Як побудувати централізовану систему валідації з error messages для великого проєкту?"
    referenceAnswers:
      junior: "Створити сервіс що mapить error codes на повідомлення і компонент для показу помилок."
      mid: "Error message service з Map<string, (error: any) => string>. Generic error component: приймає control, перевіряє errors, показує повідомлення з сервісу. Для i18n: error keys -> translation keys. Централізоване місце для всіх validation messages."
      senior: "Centralized validation system: 1) ValidationMessageRegistry — Map<string, MessageFactory> де factory приймає error details і повертає string. Наприклад: 'minlength' -> (err) => `Min ${err.requiredLength} chars`. 2) FormErrorComponent — standalone component що приймає AbstractControl і показує першу помилку з registry. 3) Custom ErrorStateMatcher для Material — визначає коли показувати error (touched + invalid, або submitted + invalid). 4) Server validation mapping — API response errors маппляться на setErrors() calls. 5) Для i18n: registry повертає translation key, translate pipe в template. 6) Testing: registry unit tests + component integration tests."
      staff: "Enterprise validation platform: 1) Multi-layer validation: field-level sync, field-level async, cross-field sync, cross-field async, form-level business rules. Clear execution order і dependency resolution. 2) Validation Rule DSL: JSON-based rules від product team, parsed в runtime до ValidatorFn chains. Versioned rules з A/B testing support. 3) Error Message Architecture: i18n-ready message catalog, interpolation з error details ({{min}}, {{max}}), rich content support (links, formatting). 4) Error Display Strategy: configurable per-form — show first error, show all errors, show on touch, show on submit. FormErrorDirective або Component з strategy injection. 5) Server Validation Integration: API errors з field paths маппляться на FormControl.setErrors(). Re-validation on field change після server error. 6) Monitoring: validation error analytics — які validators fail найчастіше, conversion impact. 7) Accessibility: aria-describedby linking errors to fields, live regions для dynamic errors, focus management on submit with errors."
    commonMistakes:
      - "Хардкодять error messages в кожному компоненті — дублювання і inconsistency"
      - "Не враховують i18n — messages тільки однією мовою"
      - "Ігнорують server-side validation errors — тільки client-side validation"
    relatedQuestions: ["b7t3q4", "b7t2q5"]
---

## Core Concept

**English definition:** Custom validators in Angular are functions (ValidatorFn) or directives (Validator interface) that implement domain-specific validation logic beyond built-in validators. They can be synchronous or asynchronous, operate on single controls or across multiple fields (cross-field validation), and integrate with both reactive and template-driven forms.

**Пояснення:** Custom validators — це механізм створення власної логіки валідації. Для reactive forms це pure functions типу `ValidatorFn`, для template-driven — директиви що реалізують `Validator` interface. Sync validators повертають `ValidationErrors | null` синхронно, async validators — через `Observable` або `Promise`. Cross-field validators встановлюються на `FormGroup` рівні і мають доступ до всіх дочірніх controls.

**Яку проблему вирішує:** Built-in validators (required, minlength, email, pattern) покривають базові потреби. Бізнес-логіка потребує специфічних перевірок: формат телефону, валідність IBAN, унікальність username (async), відповідність паролів (cross-field), умовна обов'язковість поля. Custom validators дозволяють інкапсулювати цю логіку як reusable, testable функції.

**Як працює під капотом:** Коли `FormControl.updateValueAndValidity()` викликається (при кожній зміні value або програмно): 1) Angular виконує всі sync validators через `Validators.compose(syncValidators)` — повертає merged `ValidationErrors` або null. 2) Якщо sync validators пройшли і є async validators — status встановлюється 'PENDING', виконуються async validators через `Validators.composeAsync(asyncValidators)`. 3) Observable від async validators з'єднуються через `forkJoin` і результат merge. 4) Final status: 'VALID', 'INVALID', або 'DISABLED'. 5) Результат propagates вверх через `_updateAncestors()` до батьківського FormGroup. Для template-driven forms: validators реєструються через DI multi-provider `NG_VALIDATORS` / `NG_ASYNC_VALIDATORS`. NgModel збирає всі validators через inject і передає у FormControl.

**Trade-offs та обмеження:**
- Sync validators виконуються при кожній зміні — expensive validators можуть бути bottleneck
- Async validators не cancellable для Promise-based — краще Observable з switchMap semantics
- Cross-field validators на FormGroup спрацьовують при зміні БУДЬ-ЯКОГО child — overhead для великих forms
- Error attribution: group-level errors не показуються автоматично при конкретних полях
- setErrors() замінює ВСІ errors — потрібен merge pattern для combination з validator errors

**Версійність:** Custom validators доступні з Angular v2. Typed validators з v14: AbstractControl<T> generic дозволяє type-narrow value. Немає breaking changes в validator API за всю історію Angular. З standalone components (v15+) validator directives потребують explicit import в component. AsyncValidatorFn signature стабільний: Observable MUST complete.

## Deep Details

### Edge Cases

1. **Validator execution order**: sync validators виконуються в порядку додавання, але результат — merged object, тому порядок не впливає на final errors (всі errors об'єднуються).

2. **setErrors() vs validator errors**: `control.setErrors({serverError: 'msg'})` замінює ВСІ errors (включаючи від validators). При наступному updateValueAndValidity() validator errors відновлюються, але setErrors() затирається. Pattern: використовувати setErrors() для server errors і чекати що при наступному input change validators перезапустяться.

3. **Async validator cancellation**: Angular внутрішньо зберігає reference на pending async validation. При новому updateValueAndValidity() — попередній Observable unsubscribes (якщо Observable), але Promise не cancellable.

4. **Conditional validators**: `addValidators()` / `removeValidators()` (v12+) для dynamic validator management. Після зміни — обов'язково `updateValueAndValidity()`.

5. **Validator identity**: `removeValidators(fn)` порівнює по reference — потрібно зберігати reference на ту саму функцію. Factory validators: зберігати result в variable.

### Junior vs Senior Understanding

Junior знає як написати функцію-validator і підключити до FormControl. Senior розуміє: lifecycle validators в Angular (коли виконуються, як cancellable, ordering), різницю між sync і async (status 'PENDING', Observable completion requirement), cross-field validation patterns (group-level vs dependent field approach), integration з template-driven через DI (NG_VALIDATORS, multi: true, useExisting), і architecture validators для enterprise (registry pattern, error message mapping, server validation integration). Senior також знає про `addValidators/removeValidators` для dynamic validation, і про `registerOnValidatorChange` для directive validators.

### Deprecation & Migration Path

Validator API стабільний з Angular v2, немає deprecated patterns. Однак:
- Angular v12: додані `addValidators()`, `removeValidators()`, `hasValidator()` на AbstractControl
- Angular v14: typed AbstractControl<T> — validators можуть type-narrow control.value
- Рекомендація: для нових проєктів використовувати standalone validator functions навіть для TDF — create function, wrap в directive.

### Connections to Other Concepts

- **Reactive Forms** (b7t2): validators передаються при створенні FormControl або через addValidators()
- **Template-Driven Forms** (b7t1): validators через directive з NG_VALIDATORS provider
- **ControlValueAccessor** (b7t4): custom form control що потребує specific validation
- **HTTP** (b8t1): async validators часто роблять HTTP requests для server-side validation
- **RxJS**: async validators повертають Observable — всі RxJS operators застосовні

## Examples

### Basic Usage

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

// Simple validator
export function noWhitespace(control: AbstractControl<string>): ValidationErrors | null {
  if (control.value && control.value.trim().length === 0) {
    return { noWhitespace: true };
  }
  return null;
}

// Parameterized validator factory
export function minAge(min: number): ValidatorFn {
  return (control: AbstractControl<number>): ValidationErrors | null => {
    if (control.value !== null && control.value < min) {
      return { minAge: { required: min, actual: control.value } };
    }
    return null;
  };
}

// Async validator factory з inject()
export function uniqueEmail(userService: UserService): AsyncValidatorFn {
  return (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }
    return timer(300).pipe( // debounce
      switchMap(() => userService.checkEmailExists(control.value)),
      map(exists => exists ? { emailTaken: { value: control.value } } : null),
      catchError(() => of(null)) // network error is NOT validation error
    );
  };
}

// Cross-field validator
export function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (password && confirm && password !== confirm) {
    return { passwordMismatch: true };
  }
  return null;
}

// Usage in component
@Component({...})
export class SignupComponent {
  private fb = inject(NonNullableFormBuilder);
  private userService = inject(UserService);

  form = this.fb.group({
    name: ['', [Validators.required, noWhitespace]],
    email: ['', [Validators.required, Validators.email], [uniqueEmail(this.userService)]],
    age: [18, [Validators.required, minAge(18)]],
    passwords: this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: [passwordMatch] })
  });
}
```

### Production Scenario

```typescript
// validation-registry.service.ts — централізована система валідації
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';

type MessageFactory = (error: any) => string;

@Injectable({ providedIn: 'root' })
export class ValidationRegistryService {
  private validators = new Map<string, (...args: any[]) => ValidatorFn>();
  private messages = new Map<string, MessageFactory>();

  constructor() {
    // Register built-in error messages
    this.registerMessage('required', () => 'This field is required');
    this.registerMessage('minlength', (err) => `Minimum ${err.requiredLength} characters`);
    this.registerMessage('maxlength', (err) => `Maximum ${err.requiredLength} characters`);
    this.registerMessage('email', () => 'Invalid email format');
    this.registerMessage('min', (err) => `Minimum value is ${err.min}`);
    this.registerMessage('max', (err) => `Maximum value is ${err.max}`);
    this.registerMessage('pattern', () => 'Invalid format');

    // Register custom validators
    this.registerValidator('noWhitespace', () => noWhitespace);
    this.registerValidator('minAge', (min: number) => minAge(min));
    this.registerMessage('noWhitespace', () => 'Value cannot be only whitespace');
    this.registerMessage('minAge', (err) => `Minimum age is ${err.required}`);
  }

  registerValidator(name: string, factory: (...args: any[]) => ValidatorFn): void {
    this.validators.set(name, factory);
  }

  registerMessage(errorCode: string, factory: MessageFactory): void {
    this.messages.set(errorCode, factory);
  }

  getValidator(name: string, ...args: any[]): ValidatorFn {
    const factory = this.validators.get(name);
    if (!factory) throw new Error(`Unknown validator: ${name}`);
    return factory(...args);
  }

  getErrorMessage(errorCode: string, errorDetails: any): string {
    const factory = this.messages.get(errorCode);
    return factory ? factory(errorDetails) : `Validation error: ${errorCode}`;
  }

  getFirstError(control: AbstractControl): string | null {
    if (!control.errors) return null;
    const [code, details] = Object.entries(control.errors)[0];
    return this.getErrorMessage(code, details);
  }
}

// form-error.component.ts — reusable error display
@Component({
  selector: 'app-form-error',
  standalone: true,
  template: `
    @if (errorMessage && (control.touched || control.dirty)) {
      <span class="form-error" role="alert">{{ errorMessage }}</span>
    }
  `,
  styles: [`.form-error { color: var(--error-color, #dc3545); font-size: 0.875rem; }`]
})
export class FormErrorComponent {
  private registry = inject(ValidationRegistryService);

  @Input({ required: true }) control!: AbstractControl;

  get errorMessage(): string | null {
    return this.registry.getFirstError(this.control);
  }
}

// Server validation integration
@Component({...})
export class OrderFormComponent {
  private api = inject(OrderApiService);

  form = this.fb.group({
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  submit(): void {
    if (this.form.invalid) return;

    this.api.createOrder(this.form.getRawValue()).subscribe({
      next: (order) => this.router.navigate(['/orders', order.id]),
      error: (response: HttpErrorResponse) => {
        if (response.status === 422) {
          // Map server validation errors to form controls
          const serverErrors = response.error.errors as Record<string, string[]>;
          Object.entries(serverErrors).forEach(([field, messages]) => {
            const control = this.form.get(field);
            if (control) {
              control.setErrors({ serverError: { messages } });
              control.markAsTouched();
            }
          });
        }
      }
    });
  }
}
```

### Anti-Example

```typescript
// WRONG: Side effects in validator
function badValidator(control: AbstractControl): ValidationErrors | null {
  // НЕ РОБІТЬ: мутація control всередині validator
  if (!control.value) {
    control.markAsTouched(); // Side effect! Validators should be pure
    return { required: true };
  }
  // НЕ РОБІТЬ: зміна інших controls
  control.parent?.get('otherField')?.setValue(''); // Triggers infinite loop!
  return null;
}

// WRONG: Async validator з Promise без cancellation
function badAsyncValidator(api: ApiService): AsyncValidatorFn {
  return (control: AbstractControl) => {
    // Promise не cancellable — при швидкому друці всі requests будуть виконуватись
    return api.check(control.value).toPromise().then(
      exists => exists ? { taken: true } : null
    );
    // ПРАВИЛЬНО: Observable з debounce
    // return timer(300).pipe(
    //   switchMap(() => api.check(control.value)),
    //   map(exists => exists ? { taken: true } : null)
    // );
  };
}

// WRONG: Cross-field validator на неправильному рівні
@Component({...})
export class BadCrossFieldComponent {
  form = this.fb.group({
    password: ['', Validators.required],
    confirm: ['', [
      Validators.required,
      // НЕ РОБІТЬ: cross-field logic в field-level validator
      (control: AbstractControl) => {
        // control.parent може бути null при initialization
        const password = control.parent?.get('password')?.value;
        return control.value !== password ? { mismatch: true } : null;
      }
    ]]
  });
  // Проблема: цей validator на confirm не перезапускається при зміні password!
  // ПРАВИЛЬНО: group-level validator
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Side effects у validator (markAsTouched, setValue інших controls) | Порушує pure function контракт, може викликати infinite loops | Validator тільки читає value і повертає errors або null |
| Async validator з Promise замість Observable | Немає cancellation — множинні паралельні requests при швидкому друці | Observable з timer/debounce і switchMap для cancellation |
| Cross-field validator на field-level замість group-level | Не перезапускається при зміні залежних полів | Встановити validator на FormGroup що містить обидва поля |
| setErrors() без merge з existing errors | Затирає validator errors — при наступному input вони відновляться але server errors зникнуть | Merge: control.setErrors({...control.errors, serverError: msg}) |
| Складний regex без timeout/protection | ReDoS — regex з backtracking може block main thread | Обмежити input length, або використовувати async validator для складних patterns |

## Interview Block

### [L1 — Warm-up] Як створити custom validator для reactive form?

**Signal being tested:** Чи знає кандидат ValidatorFn signature і як підключити validator до FormControl.

**What the interviewer expects:** Правильна signature (AbstractControl -> ValidationErrors | null), приклад параметризованого validator через factory, знання як підключити.

**How to probe deeper:** "Що має містити об'єкт ValidationErrors для якісного error message?"

**Reference answer:** ValidatorFn — це `(control: AbstractControl) => ValidationErrors | null`. ValidationErrors — об'єкт де ключ це error code, value — деталі. Для параметризації — factory pattern: `function minAge(min: number): ValidatorFn { return (ctrl) => ... }`. Підключається другим аргументом: `new FormControl('', [myValidator])`. Best practice: включати actual і required values в error details.

**Common mistakes:** Повертають true/false замість об'єкта помилок. Не використовують factory pattern для параметризованих validators.

### [L2 — Mid] Як реалізувати async validator і як він впливає на form status?

**Signal being tested:** Чи розуміє кандидат async validation lifecycle: PENDING status, Observable completion, cancellation, ordering з sync validators.

**What the interviewer expects:** AsyncValidatorFn signature, статус PENDING, Observable MUST complete, async запускається тільки після sync, debounce strategy.

**How to probe deeper:** "Що трапиться якщо Observable в async validator не complete? Як Angular обробляє multiple rapid changes?"

**Reference answer:** AsyncValidatorFn повертає Observable<ValidationErrors | null> що MUST complete. Status стає 'PENDING' під час виконання. Async validators запускаються тільки якщо sync пройшли. Angular auto-unsubscribe від попереднього Observable при новій зміні. Для debounce: timer(300).pipe(switchMap(() => apiCheck())). Promise-based async validators не мають cancellation — краще Observable.

**Common mistakes:** Observable без completion — вічний PENDING. Не обробляють PENDING в UI. Не додають debounce для API calls.

### [L3 — Senior] Як реалізувати cross-field validation і які є підходи?

**Signal being tested:** Чи розуміє кандидат архітектуру cross-field validation: group-level vs field-level, error attribution, re-evaluation при зміні залежних полів.

**What the interviewer expects:** Group-level validator approach, порівняння з dependent field approach, error display strategy, gotchas (re-evaluation, error attribution).

**How to probe deeper:** "Як показати cross-field validation error поряд з конкретним полем якщо error встановлено на FormGroup рівні?"

**Reference answer:** Два підходи: 1) Group-level validator — встановлюється на FormGroup, має доступ до всіх children, error на group. 2) Dependent field — valueChanges одного trigger updateValueAndValidity іншого. Group-level простіший і автоматично re-evaluates при будь-якій зміні. Error attribution: group.hasError() для display, або додатково setErrors() на specific control (з merge). Gotcha: group validator спрацьовує при кожному child change.

**Common mistakes:** Ставлять cross-field logic в field-level validator — не re-evaluates при зміні залежних полів. setErrors без merge затирає інші помилки.

### [L4 — Staff/Principal] Як побудувати централізовану систему валідації з error messages для великого проєкту?

**Signal being tested:** Системне мислення — architect validation platform що масштабується на велику команду з i18n, server integration, analytics.

**What the interviewer expects:** Validator Registry, Error Message Registry з i18n, reusable error component, server validation integration, testing strategy, monitoring.

**How to probe deeper:** "Як обробляти validation rules що приходять з backend і можуть змінюватись без frontend redeploy?"

**Reference answer:** Multi-layer architecture: Validator Registry (Map<string, ValidatorFn factory>) для centralized reusable validators, Error Message Registry з i18n support (error codes -> translation keys з interpolation), Reusable FormErrorComponent що автоматично показує errors з registry, Server validation integration через setErrors() mapping з API response, Validation Rule DSL для server-driven rules, Monitoring (validation error analytics, form abandonment tracking), Accessibility (aria-describedby, live regions).

**Common mistakes:** Хардкодять error messages в кожному компоненті. Не інтегрують server-side validation. Не думають про accessibility і i18n.

## Summary

### Key Points
- Custom ValidatorFn: `(control: AbstractControl) => ValidationErrors | null` — pure function без side effects
- Factory pattern для параметризованих validators: `function minAge(min: number): ValidatorFn`
- Async validators: Observable-based (не Promise), MUST complete, status 'PENDING', запускаються після sync
- Cross-field validation на FormGroup рівні — автоматичний re-evaluation при зміні будь-якого child
- Для TDF: validator directive з NG_VALIDATORS multi-provider і useExisting
- setErrors() замінює ВСІ errors — потрібен merge pattern для комбінації з validator errors
- Enterprise: Validator Registry + Error Message Registry + server validation integration

### Elevator Pitch (2 minutes)
Custom validators в Angular — це pure functions (ValidatorFn) що повертають об'єкт помилок або null. Для параметризації використовується factory pattern. Async validators повертають Observable і автоматично cancellable — Angular unsubscribe при новій зміні. Cross-field validation встановлюється на FormGroup рівні. Для template-driven forms validators оформлюються як directives з NG_VALIDATORS provider. В enterprise проєктах потрібна централізована система: Validator Registry для reuse, Error Message Registry з i18n для consistent error display, і server validation integration через setErrors() mapping.
