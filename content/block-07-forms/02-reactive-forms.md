---
title: "Reactive Forms & Typed Forms"
block: 7
topic: 2
slug: "reactive-forms"
difficulty: 3
sinceVersion: "2"
tags: ["FormGroup", "FormControl", "FormArray", "ReactiveFormsModule", "typed-forms", "FormBuilder", "NonNullableFormBuilder"]
relatedTopics: ["template-driven-forms", "custom-validators", "control-value-accessor", "signals"]
interviewQuestions:
  - level: "junior"
    question: "Що таке reactive forms і чим вони відрізняються від template-driven?"
    referenceAnswers:
      junior: "Reactive forms — підхід де форма створюється програмно в TypeScript через FormGroup і FormControl. На відміну від template-driven, модель форми явна і доступна в коді компонента, а не генерується з template."
      mid: "Reactive forms визначають form model у TypeScript через FormGroup, FormControl, FormArray. Template лише відображає model через [formGroup], formControlName. Переваги: type safety з v14 typed forms, синхронна модель (доступна одразу), простіше тестування (не потрібен DOM), програмне керування (addControl, removeControl), валідатори як pure functions. Import ReactiveFormsModule замість FormsModule."
      senior: "Reactive forms реалізують imperative модель де TypeScript code — source of truth. FormGroup/FormControl/FormArray — це Observable-based classes: valueChanges і statusChanges дають реактивні streams. Під капотом FormControl зберігає value, validators, async validators, і notify батьківський FormGroup при змінах. З v14 typed forms: FormGroup<{name: FormControl<string>}> — compile-time type checking. FormBuilder — це factory що спрощує creation syntax. Ключова відмінність від TDF: model створюється синхронно в конструкторі або ngOnInit, тому доступна одразу без async workarounds. Validators — pure functions (Validators.required, custom: (control) => ValidationErrors | null), що робить testing trivial."
      staff: "Reactive forms — це реалізація Reactive Programming pattern для form management. AbstractControl hierarchy (FormControl -> FormGroup -> FormArray) реалізує Observer pattern через valueChanges/statusChanges Observables. Архітектурні переваги: 1) Composition — FormGroups composable (nested groups, FormArray для dynamic lists). 2) Testability — pure TypeScript, no DOM needed. 3) Type safety — v14 typed forms з strict null checks. 4) Reactive integration — valueChanges pipe через debounceTime, distinctUntilChanged, switchMap для auto-save, search-as-you-type. 5) Dynamic forms — addControl/removeControl для runtime form modification. Для enterprise: reactive forms дозволяють побудувати form abstraction layer — BaseFormComponent<T>, FormFactory для schema-driven generation, централізований error handling. З v14 typed forms eliminують цілий клас runtime bugs (accessing non-existent controls, wrong value types). NonNullableFormBuilder гарантує що reset() повертає до initial value, не null."
    commonMistakes:
      - "Плутають FormGroup і FormControl — FormGroup містить controls, FormControl містить value"
      - "Забувають імпортувати ReactiveFormsModule"
    relatedQuestions: ["b7t2q2", "b7t1q4"]
  - level: "mid"
    question: "Як працюють typed forms з Angular v14+ і що дає NonNullableFormBuilder?"
    referenceAnswers:
      junior: "Typed forms додають TypeScript типи до form controls. NonNullableFormBuilder створює controls що не приймають null як значення."
      mid: "З v14 FormControl generic: FormControl<string> гарантує що value — string. FormGroup теж typed: FormGroup<{name: FormControl<string>}>. new FormControl('hello') автоматично inferує тип string | null (null бо reset() встановлює null). NonNullableFormBuilder створює controls де reset() повертає initial value замість null — тип без null. fb.nonNullable.control('default') -> FormControl<string> замість FormControl<string | null>."
      senior: "Typed forms в v14 — breaking change що додає compile-time перевірки. FormControl<T> де T — тип value. За замовчуванням nullable: new FormControl('') має тип FormControl<string | null> бо reset() встановлює null. NonNullableFormBuilder (або {nonNullable: true} option) змінює reset() behaviour — повертає initial value. getRawValue() повертає typed object включаючи disabled controls. Type inference працює з FormBuilder: fb.group({name: ['', Validators.required]}) inferує FormGroup<{name: FormControl<string | null>}>. Для strict typing: fb.nonNullable.group({name: ''}) -> FormGroup<{name: FormControl<string>}>. FormArray<FormControl<string>> типізує array elements. Gotcha: FormGroup.value — Partial<T> (disabled controls excluded), getRawValue() — повний T."
      staff: "Typed forms — це major DX improvement що дозволяє catch entire class of bugs at compile time. Type system: FormGroup<T> де T extends {[key: string]: AbstractControl}. Value type inferується рекурсивно: FormGroup<{address: FormGroup<{city: FormControl<string>}>}>.value -> {address?: {city?: string | null}}. Partial через disabled controls — це правильне моделювання runtime behavior. getRawValue() повертає non-partial. Migration strategy: ng update автоматично додає UntypedFormGroup/UntypedFormControl для backward compatibility, потім поступово мігрувати. NonNullableFormBuilder — recommended default для нових проєктів бо: 1) Семантика reset() інтуїтивніша (повертає до initial, не null). 2) Типи чистіші (без | null). 3) Менше null checks в template і component. Для team: ESLint rule що забороняє UntypedFormGroup в нових файлах. Custom FormBuilder wrapper що enforces nonNullable globally."
    commonMistakes:
      - "Не розуміють чому FormControl value nullable — через reset() behavior"
      - "Використовують UntypedFormGroup в нових файлах замість міграції на typed"
      - "Плутають value (partial, без disabled) і getRawValue() (повний)"
    relatedQuestions: ["b7t2q1", "b7t2q3"]
  - level: "mid"
    question: "Як працює FormArray і коли його використовувати?"
    referenceAnswers:
      junior: "FormArray — це масив FormControl або FormGroup. Використовується коли потрібно динамічно додавати/видаляти поля форми, наприклад список телефонів або адрес."
      mid: "FormArray містить ordered list of AbstractControl (FormControl, FormGroup, або nested FormArray). API: push(), removeAt(), at(), insert(), clear(). В template: formArrayName='items' з @for для ітерації, [formGroupName]='i' для кожного елемента. Use cases: dynamic field lists (phone numbers, tags), table rows editing, multi-step form steps. Валідація: можна валідувати весь array (наприклад мінімум 1 елемент) або кожен control окремо."
      senior: "FormArray extends AbstractControl і містить controls: AbstractControl[]. Під капотом: push() додає control і викликає updateValueAndValidity() що propagates вверх до батьківського FormGroup. FormArray.value — це T[] де T — тип value дочірнього control. З typed forms: FormArray<FormGroup<{phone: FormControl<string>, type: FormControl<string>}>> — повна типізація. Performance consideration: великі FormArrays (100+ елементів) з validators на кожному control можуть бути повільними — updateValueAndValidity() traverses весь array. Optimization: використовувати OnPush + manual validation trigger. Gotcha: removeAt() не просто видаляє елемент — він також re-evaluates всіх валідаторів на array рівні. Для reorder: немає native move(), потрібно removeAt() + insert()."
      staff: "FormArray — потужний механізм для dynamic form sections але з архітектурними nuances. Для production: FormArray з complex FormGroups (order line items, survey questions) потребує encapsulated component: OrderLineComponent що приймає FormGroup і відповідає за rendering + validation одного елемента. Це Separation of Concerns + reusability. Performance: FormArray з 50+ items де кожен має async validators — potential bottleneck. Solution: lazy validation (validate on blur not input), virtual scrolling для DOM, або paginated form approach. Type safety pattern: factory method createPhoneGroup(): FormGroup<PhoneControls> що гарантує consistent structure кожного array element. Testing: FormArray manipulation тести — pure TS, перевіряти value, valid, length після push/remove/clear. Для undo/redo: зберігати snapshots FormArray.getRawValue() і restore через patchValue/setValue."
    commonMistakes:
      - "Забувають formArrayName і formGroupName в template — отримують binding errors"
      - "Мутують controls array напряму замість push/removeAt — обходять change notification"
    relatedQuestions: ["b7t2q2", "b7t2q4"]
  - level: "senior"
    question: "Як використовувати valueChanges та statusChanges для реактивних form patterns?"
    referenceAnswers:
      junior: "valueChanges — Observable що emit при зміні значення форми. statusChanges — при зміні стану валідації."
      mid: "valueChanges і statusChanges — Observables на кожному AbstractControl. Patterns: 1) Auto-save: valueChanges.pipe(debounceTime(500), switchMap(val => api.save(val))). 2) Search-as-you-type: control.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), switchMap(term => searchService.search(term))). 3) Dependent fields: country.valueChanges.subscribe(c => loadCities(c)). 4) Form dirty tracking: valueChanges.pipe(map(val => JSON.stringify(val) !== JSON.stringify(initial)))."
      senior: "valueChanges emit при кожному updateValueAndValidity() — це включає programmatic setValue/patchValue (за замовчуванням, можна вимкнути через {emitEvent: false}). Timing: valueChanges emit після value оновлено але до statusChanges. statusChanges emit після всіх sync validators, для async — спочатку 'PENDING' потім 'VALID'/'INVALID'. Patterns з RxJS: 1) Cross-field sync: combineLatest([ctrl1.valueChanges, ctrl2.valueChanges]).pipe(...). 2) Conditional validators: control.valueChanges.pipe(tap(v => { if (v) other.addValidators(...); else other.removeValidators(...); other.updateValueAndValidity(); })). Gotcha: підписка на valueChanges без unsubscribe — memory leak. У standalone: використовувати takeUntilDestroyed(). setValue vs patchValue: setValue потребує повний об'єкт, patchValue — partial."
      staff: "Reactive form streams — це основа для sophisticated form patterns. Architecture: FormStateService що інкапсулює form creation, valueChanges subscriptions, derived state. Pattern: form.valueChanges.pipe(startWith(form.getRawValue()), map(toViewModel), shareReplay(1)) — hot observable що завжди має поточне значення. Integration з Signals: toSignal(form.valueChanges, {initialValue: form.getRawValue()}) — bridge між reactive forms і signal-based components. Для complex multi-form orchestration: kожна form section — окремий FormGroup, координація через parent component що merges valueChanges. Error handling: statusChanges для показу global form errors, combined з server validation errors. Performance: valueChanges на FormGroup level emit при будь-якій зміні будь-якого child — для великих форм краще підписуватися на конкретні controls. Testing: використовувати marble testing для перевірки debounce/switchMap patterns."
    commonMistakes:
      - "Не відписуються від valueChanges — memory leak"
      - "Використовують subscribe замість async pipe — більше boilerplate і manual unsubscription"
      - "Не знають про {emitEvent: false} option — отримують infinite loops при cross-field updates"
    relatedQuestions: ["b7t2q3", "b7t2q5"]
  - level: "staff"
    question: "Як спроектувати type-safe dynamic form system на базі reactive forms?"
    referenceAnswers:
      junior: "Створити сервіс що будує FormGroup динамічно з конфігурації."
      mid: "FormFactory pattern: приймає JSON schema, створює FormGroup з відповідними controls і validators. Маппінг field types на component types для рендерингу. FormArray для repeatable sections."
      senior: "Dynamic form system: 1) Form Schema interface — описує поля, типи, validators, dependencies. 2) FormFactory<T> — generic service що створює FormGroup<T> з schema з type inference. 3) Field Registry — Map<FieldType, Component> для dynamic rendering через ngComponentOutlet. 4) Validator Registry — Map<string, ValidatorFn> для mapping schema validators на Angular validators. 5) Cross-field logic — schema описує field dependencies, FormFactory створює відповідні valueChanges subscriptions. Challenges: TypeScript type inference для dynamic structures обмежена — потрібні helper types і overloads."
      staff: "Enterprise dynamic form platform: 1) Schema Layer — JSON Schema або custom DSL що описує form structure. Versioned schemas з migration support. 2) Type Generation — CLI tool що генерує TypeScript interfaces з schema (json-schema-to-typescript). FormGroup types auto-generated. 3) Runtime Layer — FormFactory що парсить schema в runtime, creates FormGroup tree, applies validators, sets up cross-field logic. 4) Rendering Layer — Plugin-based field component registry. Custom fields як standalone components з ControlValueAccessor. Layout engine (grid/flex) з schema. 5) Validation Layer — sync validators immediate, async validators debounced. Server validation integration через setErrors(). Custom validation DSL: 'requiredIf:otherField=value'. 6) State Management — form state persistence (draft save), undo/redo via value snapshots, optimistic updates. 7) Testing — schema validation tests, FormFactory unit tests, E2E per form type. 8) DX — form builder UI для product team, preview mode, A/B testing for form layouts."
    commonMistakes:
      - "Будують dynamic forms без type safety — втрачають головну перевагу reactive forms"
      - "Не враховують field dependencies — cross-field validation і conditional visibility"
      - "Ігнорують accessibility при динамічному rendering — screen readers потребують proper ARIA"
    relatedQuestions: ["b7t2q4", "b7t1q5"]
---

## Core Concept

**English definition:** Reactive forms are Angular's model-driven approach to handling form inputs where the form structure, validation, and data flow are defined programmatically in TypeScript using FormGroup, FormControl, and FormArray classes. Since Angular v14, reactive forms support strict typing through generic type parameters.

**Пояснення:** Reactive forms — це підхід де ви явно створюєте form model у TypeScript коді компонента. FormControl представляє одне поле, FormGroup — групу полів, FormArray — динамічний масив controls. Template лише відображає цю модель через директиви formGroup, formControlName, formArrayName. Модель доступна синхронно, типізована (з v14), і надає Observable-based API (valueChanges, statusChanges) для реактивних patterns.

**Яку проблему вирішує:** Template-driven forms мають обмеження: нетипізована model, асинхронна побудова, складне тестування, неможливість динамічної генерації. Reactive forms вирішують це: model створюється в TypeScript з повним type safety, доступна синхронно, тестується без DOM, і легко генерується програмно. Reactive streams (valueChanges) дозволяють складні patterns: auto-save, search-as-you-type, dependent fields.

**Як працює під капотом:** FormControl, FormGroup, FormArray наслідують AbstractControl — базовий клас що містить value, status, validators, і Observable streams. При створенні `new FormControl('hello', Validators.required)` Angular зберігає initial value, встановлює validators, і обчислює initial status. Коли user вводить текст, ControlValueAccessor (DefaultValueAccessor для input) викликає `control.setValue(newValue)`. setValue запускає sync validators, якщо є async validators — встановлює status 'PENDING' і запускає їх. Результат propagates вверх через `_updateAncestors()` — батьківський FormGroup/FormArray переобчислює свій value і status. valueChanges і statusChanges — це EventEmitter (extends Subject) що emit при кожній зміні. Template binding через formControlName directive знаходить FormControl в батьківському FormGroup через name lookup.

**Trade-offs та обмеження:**
- Більше boilerplate для простих форм порівняно з TDF
- FormGroup/FormArray creation verbose без FormBuilder
- valueChanges emit на кожну зміну кожного child control — potential performance issue для великих форм
- FormGroup.value excludes disabled controls — потрібен getRawValue() для повного значення
- Typed forms require Angular v14+ — legacy codebases потребують migration
- FormArray reordering немає native API (немає move/swap)

**Версійність:** Reactive forms доступні з Angular v2 (ReactiveFormsModule). Angular v14 — typed forms: FormControl<T>, FormGroup<T>, strict type inference. UntypedFormGroup/UntypedFormControl для backward compatibility. Angular v14 також: NonNullableFormBuilder що змінює reset() behavior. Angular v15+ — no major form changes, standalone components потребують explicit import ReactiveFormsModule. Signal-based forms — RFC stage, не в stable API. Migration: `ng update @angular/core@14` автоматично замінює на Untyped* variants, потім manual migration до typed.

## Deep Details

### Edge Cases

1. **FormGroup.value vs getRawValue()**: `value` повертає Partial<T> — disabled controls excluded. `getRawValue()` повертає повний T включаючи disabled. Це catch: якщо ви disabled поле і submit — його value не буде в form.value.

2. **reset() behavior**: За замовчуванням `reset()` встановлює null (не initial value). З `NonNullableFormBuilder` або `{nonNullable: true}` — reset повертає до initial value. Це причина чому default type `FormControl<string | null>`.

3. **emitEvent: false**: `setValue/patchValue/disable/enable` приймають `{emitEvent: false}` — valueChanges не emit. Критично для уникнення infinite loops при cross-field updates.

4. **updateOn options**: `new FormControl('', {updateOn: 'blur'})` — validation і valueChanges тільки при blur. Для FormGroup: всі children наслідують updateOn якщо не override.

5. **FormArray index shifting**: При `removeAt(i)` всі елементи після i зміщуються. Якщо template використовує index для tracking — може викликати unexpected re-renders.

### Junior vs Senior Understanding

Junior знає як створити FormGroup і прив'язати до template. Senior розуміє: type system (чому value nullable, Partial для disabled), Observable patterns (valueChanges з RxJS operators для complex flows), performance implications (valueChanges bubble up, великі форми), testing strategies (pure TS tests без TestBed), і архітектурні patterns (FormFactory, dynamic forms, reusable form components). Senior також знає різницю між `setValue` (потребує повний об'єкт) і `patchValue` (partial update), і коли використовувати `{emitEvent: false}` і `{onlySelf: true}`.

### Deprecation & Migration Path

- Angular v14: `FormGroup` -> `FormGroup<T>`. Automatic migration: `ng update` створює `UntypedFormGroup` aliases.
- Manual migration: замінити `UntypedFormGroup` на typed `FormGroup<{...}>`.
- `FormBuilder.group()` тепер infers types автоматично.
- `NonNullableFormBuilder` рекомендований для нових проєктів.
- Pattern: `private fb = inject(NonNullableFormBuilder)` замість constructor injection.

### Connections to Other Concepts

- **Template-Driven Forms** (b7t1): альтернативний підхід — TDF використовують ті самі FormGroup/FormControl під капотом
- **Custom Validators** (b7t3): pure functions `(control: AbstractControl) => ValidationErrors | null`
- **ControlValueAccessor** (b7t4): bridge між DOM elements і FormControl — критичний для custom form components
- **RxJS**: valueChanges/statusChanges — це Observables, всі RxJS operators застосовні
- **Signals** (b9t4): `toSignal(form.valueChanges)` — bridge до signal-based reactivity

## Examples

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="name" placeholder="Name" />
      @if (form.controls.name.hasError('required') && form.controls.name.touched) {
        <span class="error">Name is required</span>
      }

      <input formControlName="email" placeholder="Email" />
      @if (form.controls.email.hasError('email') && form.controls.email.touched) {
        <span class="error">Invalid email</span>
      }

      <input formControlName="age" type="number" placeholder="Age" />

      <button type="submit" [disabled]="form.invalid">Register</button>
    </form>
  `
})
export class RegistrationComponent {
  private fb = inject(NonNullableFormBuilder);

  // Typed: form.value -> { name: string, email: string, age: number }
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    age: [18, [Validators.required, Validators.min(0), Validators.max(150)]]
  });

  onSubmit(): void {
    if (this.form.valid) {
      const value = this.form.getRawValue();
      // value: { name: string, email: string, age: number } — fully typed, no null
      console.log(value);
    }
  }
}
```

### Production Scenario

```typescript
import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
  FormArray,
  FormGroup,
  FormControl
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';

// Typed form interfaces
interface AddressForm {
  street: FormControl<string>;
  city: FormControl<string>;
  zip: FormControl<string>;
}

interface PhoneForm {
  number: FormControl<string>;
  type: FormControl<'mobile' | 'work' | 'home'>;
}

interface ProfileForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  address: FormGroup<AddressForm>;
  phones: FormArray<FormGroup<PhoneForm>>;
}

@Component({
  selector: 'app-profile-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <input formControlName="firstName" />
      <input formControlName="lastName" />

      <fieldset formGroupName="address">
        <legend>Address</legend>
        <input formControlName="street" />
        <input formControlName="city" />
        <input formControlName="zip" />
      </fieldset>

      <fieldset>
        <legend>Phones</legend>
        @for (phone of phonesArray.controls; track phone; let i = $index) {
          <div [formGroupName]="i" formArrayName="phones">
            <input formControlName="number" />
            <select formControlName="type">
              <option value="mobile">Mobile</option>
              <option value="work">Work</option>
              <option value="home">Home</option>
            </select>
            <button type="button" (click)="removePhone(i)">Remove</button>
          </div>
        }
        <button type="button" (click)="addPhone()">Add Phone</button>
      </fieldset>

      <button type="submit" [disabled]="form.invalid || form.pristine">Save</button>
      @if (saving) {
        <span>Saving...</span>
      }
    </form>
  `
})
export class ProfileEditorComponent {
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private profileService = inject(ProfileService);

  saving = false;

  form: FormGroup<ProfileForm> = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    address: this.fb.group({
      street: [''],
      city: ['', Validators.required],
      zip: ['', Validators.pattern(/^\d{5}$/)]
    }),
    phones: this.fb.array<FormGroup<PhoneForm>>([])
  });

  get phonesArray(): FormArray<FormGroup<PhoneForm>> {
    return this.form.controls.phones;
  }

  constructor() {
    // Auto-save з debounce
    this.form.valueChanges.pipe(
      debounceTime(2000),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap(() => this.saving = true),
      switchMap(value => this.profileService.saveDraft(this.form.getRawValue())),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.saving = false;
        this.form.markAsPristine();
      },
      error: (err) => {
        this.saving = false;
        console.error('Auto-save failed:', err);
      }
    });
  }

  addPhone(): void {
    this.phonesArray.push(this.fb.group({
      number: ['', Validators.required],
      type: ['mobile' as const]
    }));
  }

  removePhone(index: number): void {
    this.phonesArray.removeAt(index);
  }

  save(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      // raw: { firstName: string, lastName: string, address: {...}, phones: {...}[] }
      this.profileService.save(raw).subscribe();
    }
  }
}
```

### Anti-Example

```typescript
// WRONG: Untyped forms у новому коді
@Component({...})
export class BadComponent {
  // НЕ РОБІТЬ: UntypedFormGroup — втрачаєте type safety
  form = new UntypedFormGroup({
    name: new UntypedFormControl(''),
  });

  save() {
    const name = this.form.value.name; // type: any — ніякої перевірки
    const typo = this.form.value.naem; // runtime undefined, no compile error!
  }
}

// WRONG: Infinite loop через cross-field valueChanges
@Component({...})
export class InfiniteLoopComponent {
  form = new FormGroup({
    price: new FormControl(0),
    tax: new FormControl(0),
    total: new FormControl(0),
  });

  constructor() {
    // INFINITE LOOP: price зміна -> total зміна -> valueChanges -> price зміна...
    this.form.valueChanges.subscribe(val => {
      this.form.patchValue({
        total: (val.price ?? 0) + (val.tax ?? 0)
      }); // triggers valueChanges again!
    });

    // ПРАВИЛЬНО: використовувати {emitEvent: false}
    this.form.valueChanges.subscribe(val => {
      this.form.patchValue(
        { total: (val.price ?? 0) + (val.tax ?? 0) },
        { emitEvent: false } // не trigger valueChanges
      );
    });
  }
}

// WRONG: Мутація FormArray напряму
@Component({...})
export class MutateArrayComponent {
  phones = new FormArray([new FormControl('')]);

  addPhone() {
    // НЕ РОБІТЬ: прямий доступ до internal array
    (this.phones.controls as any).push(new FormControl(''));
    // Form не знає про зміну — value/status не оновлені

    // ПРАВИЛЬНО:
    this.phones.push(new FormControl(''));
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| UntypedFormGroup в нових файлах | Втрата type safety — typos в control names не ловляться compile time | Використовувати typed FormGroup<T> або NonNullableFormBuilder |
| Subscribe на valueChanges без unsubscribe | Memory leak — підписка живе довше ніж component | takeUntilDestroyed() або async pipe |
| patchValue/setValue без {emitEvent: false} при cross-field updates | Infinite loops або зайві CD cycles | Додавати {emitEvent: false} при програмних оновленнях |
| Створення FormGroup в template через method call | Новий FormGroup на кожен CD cycle — втрата стану | Створювати форму в конструкторі/ngOnInit і зберігати як property |
| Використання form.value замість getRawValue() для submit | Disabled controls не включені в value — втрата даних | getRawValue() для отримання повного значення форми |

## Interview Block

### [L1 — Warm-up] Що таке reactive forms і чим вони відрізняються від template-driven?

**Signal being tested:** Чи розуміє кандидат фундаментальну різницю в source of truth та може пояснити переваги explicit model.

**What the interviewer expects:** Не просто "reactive краще" а конкретні відмінності: де model створюється, type safety, testability, synchronous vs async model.

**How to probe deeper:** "Якщо під капотом обидва підходи використовують FormGroup/FormControl, яка реальна різниця?"

**Reference answer:** Reactive forms створюють form model явно в TypeScript через FormGroup, FormControl, FormArray. Source of truth — TypeScript код, template лише відображає. Переваги: type safety (v14+), синхронна model, тестування без DOM, програмне керування. TDF — model генерується з template асинхронно, нетипізована. Обидва використовують AbstractControl під капотом, різниця в тому хто створює і контролює model.

**Common mistakes:** "Reactive forms краще для всього" — для trivial форм TDF простіше. Не знають що TDF також створюють FormGroup/FormControl під капотом.

### [L2 — Mid] Як працюють typed forms з Angular v14+ і що дає NonNullableFormBuilder?

**Signal being tested:** Чи розуміє кандидат type system reactive forms: nullable types, reset() semantics, Partial value.

**What the interviewer expects:** Пояснення чому FormControl<string | null>, як NonNullableFormBuilder це змінює, різниця value vs getRawValue().

**How to probe deeper:** "Чому FormGroup.value повертає Partial<T>? Як це впливає на submit logic?"

**Reference answer:** FormControl<string> за замовчуванням має тип string | null бо reset() встановлює null. NonNullableFormBuilder змінює reset() — повертає initial value замість null, тому тип без null. FormGroup.value — Partial<T> бо disabled controls excluded. getRawValue() — повний T. Migration: ng update створює UntypedFormGroup, потім manual migration.

**Common mistakes:** Не розуміють причину nullable type. Не знають про getRawValue(). Використовують as для обходу типів замість правильного typing.

### [L3 — Senior] Як використовувати valueChanges та statusChanges для реактивних form patterns?

**Signal being tested:** Чи може кандидат побудувати складні reactive patterns з forms: auto-save, dependent fields, preventing infinite loops.

**What the interviewer expects:** Конкретні patterns з RxJS operators, знання про emitEvent option, timing valueChanges vs statusChanges, memory management.

**How to probe deeper:** "Як уникнути infinite loop коли два controls залежать один від одного через valueChanges?"

**Reference answer:** valueChanges — Observable що emit при кожному updateValueAndValidity(). Patterns: auto-save (debounceTime + switchMap), search-as-you-type (debounceTime + distinctUntilChanged + switchMap), dependent fields (valueChanges.subscribe -> patchValue({emitEvent: false})). emitEvent: false критичний для уникнення infinite loops. statusChanges: emit 'PENDING' для async validators, потім final status. Unsubscribe через takeUntilDestroyed().

**Common mistakes:** Infinite loops через patchValue без emitEvent: false. Memory leaks без unsubscribe. Subscribe на FormGroup valueChanges для одного поля замість конкретного control.

### [L4 — Staff/Principal] Як спроектувати type-safe dynamic form system на базі reactive forms?

**Signal being tested:** Системне мислення — здатність спроектувати extensible form platform для enterprise з type safety, plugin architecture, testing strategy.

**What the interviewer expects:** Schema layer, FormFactory з generics, Validator/Field registries, rendering strategy, state management, testing approach.

**How to probe deeper:** "Як забезпечити type safety для динамічно генерованих форм де структура відома тільки в runtime?"

**Reference answer:** Layered architecture: Schema Layer (JSON Schema або custom DSL з versioning), Type Generation (CLI tool для TypeScript interfaces з schema), Runtime Layer (FormFactory з generic types, Validator Registry як Map<string, ValidatorFn>), Rendering Layer (plugin-based field components з ControlValueAccessor, layout engine), State Management (draft persistence, undo/redo), Testing (schema validation + FormFactory unit tests + E2E). Type safety через code generation для known schemas, runtime validation для dynamic.

**Common mistakes:** Dynamic forms без будь-якої type safety. Ігнорування field dependencies. Монолітний form component замість composition. Не думають про accessibility і testing.

## Summary

### Key Points
- Reactive forms створюють model явно в TypeScript: FormGroup, FormControl, FormArray з ReactiveFormsModule
- З Angular v14 typed forms: FormControl<string>, FormGroup<T> — compile-time type checking
- NonNullableFormBuilder змінює reset() semantics — повертає initial value замість null, типи без | null
- valueChanges і statusChanges — Observable streams для reactive patterns (auto-save, search, dependent fields)
- FormGroup.value — Partial<T> (без disabled controls), getRawValue() — повний T
- {emitEvent: false} на setValue/patchValue — критичний для уникнення infinite loops
- FormArray для dynamic field lists — push(), removeAt(), typed через FormArray<FormGroup<T>>

### Elevator Pitch (2 minutes)
Reactive forms — це Angular підхід де form model створюється програмно в TypeScript. Ви явно визначаєте FormGroup з FormControls, FormArrays, validators, і template лише відображає цю модель. З Angular v14 typed forms дають compile-time type safety — помилки в назвах полів чи типах значень ловляться при компіляції. NonNullableFormBuilder рекомендований для нових проєктів — він змінює reset() behavior і прибирає | null з типів. valueChanges Observable дозволяє будувати reactive patterns: auto-save через debounceTime + switchMap, search-as-you-type, dependent fields. Головні gotchas: value excludes disabled controls (потрібен getRawValue()), і emitEvent: false при програмних оновленнях для уникнення infinite loops.
