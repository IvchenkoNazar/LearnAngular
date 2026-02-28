---
title: "Template-Driven Forms"
block: 7
topic: 1
slug: "template-driven-forms"
difficulty: 2
sinceVersion: "2"
tags: ["ngModel", "FormsModule", "template-driven", "two-way-binding", "NgForm", "form-validation"]
relatedTopics: ["reactive-forms", "custom-validators", "control-value-accessor", "built-in-directives"]
interviewQuestions:
  - id: "b7t1q1"
    level: "junior"
    question: "Що таке template-driven forms і як працює двостороннє зв'язування через ngModel?"
    referenceAnswers:
      junior: "Template-driven forms — це підхід де логіка форми описується в HTML template через директиви ngModel, ngForm, ngModelGroup. [(ngModel)] забезпечує two-way binding — зміни в input автоматично оновлюють змінну компонента і навпаки."
      mid: "Template-driven forms базуються на директивах FormsModule: NgModel створює FormControl під капотом, NgForm автоматично обгортає кожну <form> і створює FormGroup. [(ngModel)] — це синтаксичний цукор що поєднує [ngModel] (property binding) і (ngModelChange) (event binding). Кожен ngModel реєструється у батьківському NgForm через dependency injection. Валідація додається через HTML5 атрибути (required, minlength) або custom directive validators."
      senior: "Template-driven forms — це абстракція де Angular compiler генерує reactive form model з template. Кожен [(ngModel)] з name атрибутом створює FormControl instance і реєструє його в NgForm через метод addControl(). Це відбувається асинхронно — form model доступна після першого CD cycle, тому для доступу потрібен ViewChild з {static: false} або setTimeout. Під капотом NgModel реалізує ControlValueAccessor pattern для зв'язку між DOM і form model. Валідатори (required, minlength, pattern) реалізовані як директиви що імплементують Validator interface і реєструються через NG_VALIDATORS token. Головний trade-off: простота для невеликих форм за рахунок testability (потрібен async TestBed) і type safety (form model нетипізована)."
      staff: "Template-driven forms реалізують декларативну модель де template є source of truth для form structure. Angular compiler під час AOT компіляції генерує factory code що створює NgForm, NgModel instances і зв'язує їх через DI hierarchy. Асинхронна природа TDF (model створюється після CD) — це наслідок того що directive instantiation відбувається в Ivy instruction pipeline послідовно. Для enterprise архітектури TDF мають серйозні обмеження: відсутність типізації (FormGroup model dynamic), складність unit testing (потрібен повний template compilation), неможливість dynamic form generation без додаткових абстракцій. Рекомендація для команди: TDF доречні для простих форм (login, search filter), для складних — reactive forms. З точки зору migration strategy: Angular не deprecate TDF, але typed reactive forms (v14+) роблять reactive підхід значно привабливішим. При code review перевіряти: чи використовується name атрибут з ngModel (обов'язковий в NgForm контексті), чи не змішуються TDF і reactive підходи в одній формі."
    commonMistakes:
      - "Забувають атрибут name на input з ngModel — Angular не може зареєструвати control в формі"
      - "Намагаються отримати form model синхронно — вона створюється асинхронно"
      - "Змішують template-driven і reactive підходи в одній формі"
    relatedQuestions: ["b7t1q2", "b7t2q1"]
  - id: "b7t1q2"
    level: "mid"
    question: "Як працює NgForm під капотом і як отримати доступ до стану форми?"
    referenceAnswers:
      junior: "NgForm автоматично створюється для кожного <form> елемента. Через template reference variable #myForm='ngForm' можна отримати доступ до стану: myForm.valid, myForm.value."
      mid: "NgForm — це директива що автоматично застосовується до <form> елементів. Вона створює top-level FormGroup і збирає всі NgModel children. Доступ до стану: #f='ngForm' дає NgForm instance з властивостями valid, invalid, dirty, pristine, submitted, value. f.value — це об'єкт де ключі — name атрибути NgModel. Для submit: (ngSubmit)='onSubmit(f)' замість (submit) — ngSubmit prevent default form submission. ngModelGroup дозволяє створювати nested FormGroups."
      senior: "NgForm реєструє selector на <form> елементі (крім form[ngNoForm] і form[formGroup]). Під капотом створює FormGroup instance і підписується на addControl/removeControl events від дочірніх NgModel директив. NgModel реєструється через конструктор inject — шукає батьківський ControlContainer (NgForm або NgModelGroup). Важливий нюанс: form model будується асинхронно через Promise.resolve().then() — це означає що form.value в ngOnInit буде порожнім. Для dynamic forms з ngIf: коли NgModel enters/leaves DOM, Angular автоматично add/remove control з NgForm. Для disable: [disabled] на input не рекомендований — краще model.disable() через ViewChild. NgForm також обробляє ngSubmit з validation check і markAllAsTouched для показу помилок."
      staff: "NgForm — це high-level orchestrator що реалізує ControlContainer abstract class. Внутрішня архітектура: FormGroup зберігається як this.form, а NgModel children додаються через addControl(dir) який виконує FormGroup.addControl(name, control). Race condition при динамічних формах: NgModel resolve свій path (name + parent groups) через _setUpControl() в ngOnChanges, що може викликати order-dependent bugs якщо name змінюється динамічно. Для testing TDF: TestBed.configureTestingModule повинен включати FormsModule, fixture.detectChanges() запускає CD, але form model ще не готова — потрібен await fixture.whenStable(). Це робить TDF тести повільнішими ніж reactive forms тести. Архітектурне рішення: для micro-frontends і shared form components reactive forms дають кращу інкапсуляцію — component API приймає FormGroup замість template reference."
    commonMistakes:
      - "Використовують (submit) замість (ngSubmit) — не prevent default browser submit"
      - "Очікують form.value бути заповненим синхронно в ngOnInit"
    relatedQuestions: ["b7t1q1", "b7t1q3"]
  - id: "b7t1q3"
    level: "mid"
    question: "Як додати валідацію в template-driven forms?"
    referenceAnswers:
      junior: "Валідація додається через HTML5 атрибути: required, minlength, maxlength, pattern на input елементах. Стан валідації доступний через ngModel reference: #name='ngModel', name.errors, name.valid."
      mid: "Angular перехоплює HTML5 validation атрибути і замінює їх на Angular validators. required стає RequiredValidator директивою, minlength — MinLengthValidator. Ці директиви реєструються через NG_VALIDATORS multi-provider. Для показу помилок: *ngIf='name.errors?.required && name.touched'. Custom validators створюються як директиви з Validator interface. Для conditional validation: [required]='isFieldRequired' — Angular re-evaluates validator при CD."
      senior: "Angular реєструє built-in validator directives (RequiredValidator, MinLengthValidator, PatternValidator, EmailValidator) через NG_VALIDATORS token. Під капотом NgModel збирає всі validators з NG_VALIDATORS inject і встановлює їх на FormControl через setValidators(). Для async validators — NG_ASYNC_VALIDATORS token. Динамічні validators: коли [required] змінюється, RequiredValidator.enabled оновлюється і NgModel викликає updateValueAndValidity(). Edge case: minlength і maxlength працюють з string value — для number inputs потрібні custom validators. Cross-field validation потребує ngModelGroup або custom directive на рівні form. Для показу помилок рекомендований pattern: ngIf='control.hasError(code) && (control.dirty || form.submitted)' — показувати помилки після взаємодії або submit."
      staff: "Validator architecture в TDF побудована на DI multi-providers — це дозволяє composition. Кожна validator directive надає себе через NG_VALIDATORS, NgModel збирає їх через inject(NG_VALIDATORS, {self: true}). Для enterprise forms: стандартні HTML5 validators недостатні — потрібні server-driven validation rules. Pattern: створити meta-directive що приймає validation config з backend і динамічно застосовує validators. Але з TDF це складніше ніж з reactive forms де validators — pure functions. Performance consideration: validators виконуються при кожному updateValueAndValidity(), що в TDF відбувається при кожному input event (якщо не використовується updateOn: blur/submit). Для форм з багатьма полями і складними validators — updateOn: 'blur' через [ngModelOptions]='{updateOn: \"blur\"}' зменшує validation frequency."
    commonMistakes:
      - "Показують помилки без перевірки touched/dirty — користувач бачить помилки до взаємодії"
      - "Використовують HTML5 validation замість Angular validators — нативна validation конфліктує"
    relatedQuestions: ["b7t1q2", "b7t3q1"]
  - id: "b7t1q4"
    level: "senior"
    question: "Які trade-offs між template-driven і reactive forms? Коли який підхід обрати?"
    referenceAnswers:
      junior: "Template-driven простіші для невеликих форм. Reactive forms дають більше контролю і підходять для складних форм."
      mid: "Template-driven: простіша конфігурація, менше коду для простих форм, form model генерується з template. Reactive: явна model в TypeScript, type safety (з v14), простіше тестування, dynamic forms, програмне керування. TDF підходять для: login, search, contact forms. Reactive — для: multi-step wizards, dynamic fields, complex validation, server-driven forms."
      senior: "Фундаментальна різниця: source of truth. В TDF — template визначає структуру, model генерується. В reactive — TypeScript model визначає структуру, template лише відображає. Це впливає на: 1) Type safety — TDF model нетипізована (FormGroup<any>), reactive з v14 typed. 2) Testing — TDF потребує DOM (async TestBed), reactive — pure TS тести. 3) Dynamic forms — TDF складно генерувати динамічно, reactive — просто addControl/removeControl. 4) Validation — TDF validators через directives (потрібен DI), reactive — pure functions. 5) Performance — TDF валідують на кожний input event за замовчуванням, reactive — configurable. 6) Reusability — reactive FormGroup можна передати як @Input, TDF прив'язані до template."
      staff: "Архітектурне рішення TDF vs Reactive має cascading наслідки. Для enterprise: reactive forms з typed FormGroups дають: compile-time type checking, refactoring safety, unit tests без DOM, server-driven form generation з JSON schema. TDF мають одну перевагу: швидкість розробки простих форм і менший boilerplate. Стратегія для команди: reactive як default, TDF дозволені тільки для trivial isolated forms. Form abstraction layer: створити base FormComponent<T> що стандартизує: creation, validation, submission, error display patterns. З migration perspective: Angular не deprecate TDF, але всі нові features (typed forms, NonNullableFormBuilder) — тільки для reactive. Signal-based forms (RFC stage) також reactive-only."
    commonMistakes:
      - "Обирають TDF для складних форм заради простоти — потім переписують на reactive"
      - "Думають що reactive forms завжди кращі — для простих форм це overengineering"
    relatedQuestions: ["b7t1q1", "b7t2q1"]
  - id: "b7t1q5"
    level: "staff"
    question: "Як би ви спроектували архітектуру форм для enterprise застосунку з server-driven validation?"
    referenceAnswers:
      junior: "Використав би reactive forms і отримував validation rules з сервера."
      mid: "Створив би сервіс що отримує validation rules з API і генерує FormGroup з відповідними validators. Кожне поле мало б конфігурацію: type, validators, async validators. Форма будувалась би динамічно через FormBuilder."
      senior: "Архітектура включає: 1) Form Schema API — backend повертає JSON описуючи поля, validators, dependencies між полями. 2) FormFactory service — парсить schema і створює typed FormGroup з validators. 3) Validator Registry — маппінг string validation rules на ValidatorFn (required -> Validators.required, 'regex:pattern' -> Validators.pattern). 4) Dynamic rendering — component що рендерить FormGroup через @for з component map для різних field types. 5) Cross-field validation — описується в schema як dependencies, імплементується через cross-field validators. Edge case: async validators для uniqueness check (debounceTime + switchMap). Error messages — з backend або i18n по validation error key."
      staff: "Enterprise form architecture потребує: 1) Schema-driven FormGroup generation з full type inference через TypeScript generics і conditional types. 2) Plugin-based Validator Registry де team може додавати custom validators без зміни core. 3) Form State Management — або через signals (FormGroup value -> signal -> computed derived state), або NgRx forms integration. 4) Error Message Strategy — backend повертає error keys, frontend має i18n catalog; для server-side validation errors — setErrors() з API response mapping. 5) Multi-step form orchestration — router-based або stepper-based з form persistence (localStorage/sessionStorage). 6) Accessibility — aria-describedby для errors, focus management при validation failure. 7) Performance — lazy validation (updateOn: blur для більшості полів, updateOn: change для critical). 8) Testing strategy — unit tests для FormFactory (pure logic), integration tests для complex form workflows. 9) Monitoring — form abandonment tracking, validation error analytics."
    commonMistakes:
      - "Хардкодять validation rules на frontend — при зміні бізнес-правил потрібен redeploy"
      - "Не враховують server-side validation errors — форма має вміти показувати errors з API response"
    relatedQuestions: ["b7t1q4", "b7t2q5"]
---

## Core Concept

**English definition:** Template-driven forms are Angular's declarative approach to building forms where the form structure and validation logic are defined primarily in the HTML template using directives like ngModel, ngForm, and ngModelGroup. Angular automatically creates an underlying reactive form model (FormGroup/FormControl) from the template declarations.

**Пояснення:** Template-driven forms (TDF) — це підхід де ви описуєте форму безпосередньо в HTML template. Замість явного створення FormGroup у TypeScript, ви додаєте директиву [(ngModel)] до полів, і Angular автоматично генерує form model. NgForm директива автоматично обгортає кожний `<form>` елемент і збирає всі NgModel children у єдиний FormGroup. Це декларативний підхід — template є source of truth для структури форми.

**Яку проблему вирішує:** HTML форми самі по собі не мають механізму для: двостороннього зв'язування з TypeScript моделлю, валідації з Angular-інтеграцією, відстеження стану форми (dirty, touched, valid). TDF надають високорівневу абстракцію де розробник працює з template а Angular керує складністю form model під капотом.

**Як працює під капотом:** Коли Angular compiler зустрічає `<form>` без `[formGroup]` або `ngNoForm`, він автоматично застосовує NgForm директиву. NgForm створює top-level FormGroup. Кожен `[(ngModel)]` з атрибутом `name` створює FormControl instance і реєструє його в батьківському NgForm (або NgModelGroup) через DI — NgModel inject ControlContainer у конструкторі. Реєстрація відбувається асинхронно через `Promise.resolve().then()` — це означає що form model не готова відразу після першого change detection cycle. Two-way binding реалізований через ControlValueAccessor: NgModel встановлює value через `writeValue()` і слухає зміни через `registerOnChange()` callback. При зміні input value, ControlValueAccessor повідомляє NgModel, який оновлює FormControl, який notifies FormGroup, який оновлює NgForm.

**Trade-offs та обмеження:**
- Простота для невеликих форм, але складність масштабування для enterprise
- Form model нетипізована — `form.value` має тип `any`
- Тестування потребує DOM rendering (async TestBed.configureTestingModule з FormsModule)
- Неможливо легко створювати dynamic forms програмно
- Validators через директиви — більш verbose ніж pure functions
- Асинхронна побудова форми — race conditions при складних динамічних формах

**Версійність:** Template-driven forms доступні з Angular v2 як частина `@angular/forms` пакету. FormsModule необхідний для використання. В standalone компонентах (v14+) потрібно імпортувати FormsModule напряму. Angular не deprecate TDF, але нові features (typed forms v14, signal-based forms RFC) орієнтовані на reactive підхід. З v15+ при standalone-first підході TDF потребують explicit import FormsModule в кожному standalone компоненті що їх використовує.

## Deep Details

### Edge Cases

1. **Асинхронна ініціалізація**: `form.value` порожній у `ngOnInit` — model ще не побудована. Потрібен `ngAfterViewInit` + `setTimeout()` або `fixture.whenStable()` в тестах.

2. **Dynamic ngModel з *ngIf**: коли input з ngModel входить/виходить з DOM через @if, Angular автоматично додає/видаляє control з NgForm. Але якщо ви кешуєте form.value — старі значення залишаться.

3. **ngModel без name**: всередині `<form>` кожен ngModel ОБОВ'ЯЗКОВО потребує `name` атрибут. Без нього Angular кидає помилку. Поза `<form>` — name не обов'язковий.

4. **Standalone ngModel**: `[(ngModel)]` без form (ngModelOptions: `{standalone: true}`) — створює ізольований FormControl не зв'язаний з NgForm.

5. **updateOn options**: `[ngModelOptions]="{updateOn: 'blur'}"` — model оновлюється тільки при blur, не при кожному keystroke. Варіанти: `change` (default), `blur`, `submit`.

### Junior vs Senior Understanding

Junior знає що `[(ngModel)]` зв'язує input з змінною. Senior розуміє повний pipeline: NgModel implements ControlValueAccessor bridge, створює FormControl, реєструє його в parent ControlContainer (NgForm/NgModelGroup) через DI, і form model будується асинхронно. Senior також знає чому `name` обов'язковий (це ключ у FormGroup.controls), розуміє різницю між `[ngModel]`, `[(ngModel)]` і `ngModel` (без binding — тільки реєстрація control), і може налаштувати updateOn для performance optimization.

### Deprecation & Migration Path

Template-driven forms НЕ deprecated. Проте:
- Angular v14 typed forms — тільки для reactive forms
- Angular v16+ signal integration — тільки через reactive forms
- Новий `NonNullableFormBuilder` — тільки reactive
- Signal-based forms (experimental RFC) — reactive-first

Migration від TDF до reactive:
1. Замінити `FormsModule` на `ReactiveFormsModule`
2. Створити `FormGroup` в component class
3. Замінити `[(ngModel)]` на `formControlName`
4. Перенести validators з template directives до FormControl creation
5. Оновити template references з `#name="ngModel"` на `formGroup.get('name')`

### Connections to Other Concepts

- **Reactive Forms** (b7t2): альтернативний підхід де model створюється програмно — обов'язкове порівняння
- **Custom Validators** (b7t3): в TDF validators — це директиви з `NG_VALIDATORS` provider
- **ControlValueAccessor** (b7t4): bridge між DOM і form model — використовується і в TDF і в reactive
- **Change Detection** (b9t2): NgModel оновлює form model в CD cycle — розуміння CD важливе для debug
- **Two-way Binding**: `[(ngModel)]` — це `[ngModel]="value" (ngModelChange)="value = $event"` shorthand

## Examples

### Basic Usage

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface UserProfile {
  name: string;
  email: string;
  address: {
    city: string;
    zip: string;
  };
}

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form #profileForm="ngForm" (ngSubmit)="onSubmit(profileForm)">
      <input
        name="name"
        [(ngModel)]="user.name"
        required
        minlength="2"
        #nameCtrl="ngModel"
      />
      @if (nameCtrl.errors?.['required'] && nameCtrl.touched) {
        <span class="error">Name is required</span>
      }
      @if (nameCtrl.errors?.['minlength'] && nameCtrl.dirty) {
        <span class="error">
          Min length: {{ nameCtrl.errors?.['minlength'].requiredLength }}
        </span>
      }

      <input
        name="email"
        [(ngModel)]="user.email"
        required
        email
        #emailCtrl="ngModel"
      />

      <fieldset ngModelGroup="address">
        <input name="city" [(ngModel)]="user.address.city" required />
        <input name="zip" [(ngModel)]="user.address.zip" pattern="\\d{5}" />
      </fieldset>

      <button type="submit" [disabled]="profileForm.invalid">Save</button>

      <pre>Form value: {{ profileForm.value | json }}</pre>
      <pre>Form valid: {{ profileForm.valid }}</pre>
    </form>
  `
})
export class ProfileFormComponent {
  user: UserProfile = {
    name: '',
    email: '',
    address: { city: '', zip: '' }
  };

  onSubmit(form: NgForm): void {
    if (form.valid) {
      console.log('Submitting:', form.value);
      // form.value = { name: '...', email: '...', address: { city: '...', zip: '...' } }
    }
  }
}
```

### Production Scenario

```typescript
// edit-settings.component.ts — форма з conditional fields і updateOn optimization
import { Component, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-edit-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form #settingsForm="ngForm" (ngSubmit)="save()" [ngFormOptions]="{updateOn: 'blur'}">
      <label>
        <input type="checkbox" name="notifications" [(ngModel)]="settings.notificationsEnabled" />
        Enable notifications
      </label>

      @if (settings.notificationsEnabled) {
        <input
          name="notificationEmail"
          [(ngModel)]="settings.notificationEmail"
          required
          email
          [ngModelOptions]="{updateOn: 'change'}"
        />
      }

      <select name="theme" [(ngModel)]="settings.theme">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>

      <button type="submit" [disabled]="settingsForm.invalid || settingsForm.pristine">
        Save Changes
      </button>
      <button type="button" (click)="reset()">Cancel</button>
    </form>
  `
})
export class EditSettingsComponent {
  @ViewChild('settingsForm') form!: NgForm;

  settings = {
    notificationsEnabled: false,
    notificationEmail: '',
    theme: 'system' as 'light' | 'dark' | 'system'
  };

  private originalSettings = structuredClone(this.settings);

  save(): void {
    if (this.form.valid) {
      // API call
      this.originalSettings = structuredClone(this.settings);
      this.form.form.markAsPristine();
    }
  }

  reset(): void {
    this.settings = structuredClone(this.originalSettings);
    // NgModel оновиться через two-way binding при наступному CD cycle
  }
}
```

### Anti-Example

```typescript
// WRONG: Змішування template-driven і reactive forms
@Component({
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <!-- ERROR: не можна використовувати ngModel з formControl -->
    <form [formGroup]="myForm">
      <input formControlName="name" [(ngModel)]="name" />
      <!-- Angular кидає помилку: ngModel з formGroup deprecated і заборонений -->
    </form>
  `
})
export class BadFormComponent {
  myForm = new FormGroup({ name: new FormControl('') });
  name = ''; // Два sources of truth — recipe for bugs
}

// WRONG: ngModel без name всередині form
@Component({
  template: `
    <form #f="ngForm">
      <!-- ERROR: ngModel потребує name атрибут всередині form -->
      <input [(ngModel)]="value" />
    </form>
  `
})
export class MissingNameComponent {
  value = '';
}

// WRONG: Синхронний доступ до form model
@Component({
  template: `<form #f="ngForm"><input name="x" [(ngModel)]="x" /></form>`
})
export class SyncAccessComponent implements OnInit {
  @ViewChild('f') form!: NgForm;
  x = '';

  ngOnInit() {
    // form.value буде {} — model ще не побудована
    console.log(this.form); // undefined — ViewChild ще не resolved
  }

  // Правильно: використовувати ngAfterViewInit
  ngAfterViewInit() {
    // form доступна, але controls ще можуть не бути зареєстровані
    setTimeout(() => {
      console.log(this.form.value); // { x: '' } — тепер працює
    });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Змішування ngModel з formGroup/formControl | Два sources of truth для form state, Angular кидає warning/error | Обрати один підхід: або TDF або reactive |
| Відсутність name атрибуту на ngModel в form | Angular не може зареєструвати control в NgForm, кидає runtime error | Завжди додавати name що відповідає property name |
| Показ помилок без перевірки touched/dirty | Користувач бачить помилки до першої взаємодії — поганий UX | `@if (ctrl.hasError('required') && (ctrl.touched \|\| form.submitted))` |
| Синхронний доступ до form model в ngOnInit | Form model будується асинхронно, controls ще не зареєстровані | Використовувати ngAfterViewInit + setTimeout або statusChanges observable |
| TDF для складних dynamic forms | Template стає нечитабельним, складно тестувати, немає type safety | Reactive forms з FormBuilder для складних сценаріїв |

## Interview Block

### [L1 — Warm-up] Що таке template-driven forms і як працює двостороннє зв'язування через ngModel?

**Signal being tested:** Чи розуміє кандидат базову модель TDF і механізм two-way binding, а не просто синтаксис.

**What the interviewer expects:** Пояснення що TDF описуються в template через директиви, ngModel забезпечує two-way binding, і що під капотом створюються FormControl/FormGroup.

**How to probe deeper:** "Що відбувається якщо забрати name атрибут з input що має ngModel всередині form?"

**Reference answer:** Template-driven forms — це підхід де форма описується в HTML template через директиви FormsModule. `[(ngModel)]` — синтаксичний цукор для `[ngModel]="value" (ngModelChange)="value=$event"`. Angular автоматично створює FormControl для кожного ngModel і FormGroup для кожного `<form>`. Атрибут `name` обов'язковий всередині form — це ключ у FormGroup.

**Common mistakes:** Думають що `[(ngModel)]` — магія без розуміння що це property binding + event binding. Не знають про NgForm автоматичне створення.

### [L2 — Mid] Як працює NgForm під капотом і як отримати доступ до стану форми?

**Signal being tested:** Чи розуміє кандидат архітектуру NgForm, асинхронну побудову form model, і способи доступу до стану.

**What the interviewer expects:** Знання про автоматичне створення NgForm, реєстрацію controls, template reference variables, ngSubmit, і асинхронну природу model.

**How to probe deeper:** "Чому form.value може бути порожнім у ngOnInit навіть якщо всі ngModel мають початкові значення?"

**Reference answer:** NgForm автоматично застосовується до `<form>` елементів і створює FormGroup. Кожен NgModel реєструється в батьківському NgForm через DI (inject ControlContainer). Модель будується асинхронно — доступна після першого CD cycle. Доступ через `#f="ngForm"` дає NgForm instance з properties: valid, dirty, touched, value, submitted. `(ngSubmit)` — для обробки submit з prevent default.

**Common mistakes:** Використовують `(submit)` замість `(ngSubmit)` — не prevent default. Очікують синхронний доступ до form model.

### [L3 — Senior] Які trade-offs між template-driven і reactive forms? Коли який підхід обрати?

**Signal being tested:** Чи може кандидат зробити обґрунтований архітектурний вибір на основі розуміння внутрішніх механізмів обох підходів.

**What the interviewer expects:** Порівняння по осях: type safety, testing, dynamic forms, validation, performance. Конкретні рекомендації коли що використовувати.

**How to probe deeper:** "Як typed forms у v14 змінюють це рівняння? Чи є сценарії де TDF залишаються кращим вибором?"

**Reference answer:** Фундаментальна різниця — source of truth: TDF template, reactive TypeScript. Type safety: TDF нетипізовані, reactive з v14 typed. Testing: TDF потребують DOM і async TestBed, reactive — pure TS тести. Dynamic forms: reactive значно простіше. Validation: TDF через directives, reactive через pure functions. Performance: TDF валідують на кожний keystroke за замовчуванням. Рекомендація: reactive як default, TDF тільки для trivial форм (login, search).

**Common mistakes:** Абсолютизують один підхід. Не знають про typed forms. Вважають що TDF завжди простіші — для складних форм вони стають складнішими.

### [L4 — Staff/Principal] Як би ви спроектували архітектуру форм для enterprise застосунку з server-driven validation?

**Signal being tested:** Системне мислення — здатність спроектувати масштабовану form architecture що підтримує динамічні rules, testing, accessibility, monitoring.

**What the interviewer expects:** Schema-driven form generation, validator registry pattern, error message strategy, multi-step orchestration, accessibility, testing strategy.

**How to probe deeper:** "Як обробляти server-side validation errors що приходять після submit? Як це інтегрується з вашою form architecture?"

**Reference answer:** Enterprise form architecture включає: Schema-driven FormGroup generation з type inference, Plugin-based Validator Registry (маппінг string rules на ValidatorFn), Error Message Strategy (i18n catalog + server error keys + setErrors() для API responses), Multi-step orchestration (router-based з form persistence), Accessibility (aria-describedby, focus management), Performance (updateOn: blur для більшості, change для critical), Testing (unit для FormFactory, integration для workflows), Monitoring (form abandonment, validation error analytics).

**Common mistakes:** Хардкодять validation rules на frontend. Не враховують server-side validation. Ігнорують accessibility. Не думають про form state persistence.

## Summary

### Key Points
- Template-driven forms описуються в HTML template через директиви FormsModule: NgModel, NgForm, NgModelGroup
- `[(ngModel)]` — синтаксичний цукор для `[ngModel]` + `(ngModelChange)`, потребує `name` атрибут всередині form
- NgForm автоматично створюється для `<form>` і збирає NgModel children в FormGroup
- Form model будується **асинхронно** — не доступна синхронно в ngOnInit
- Валідація через HTML5 атрибути (required, minlength) що Angular перехоплює як Validator директиви
- updateOn option ('change' | 'blur' | 'submit') контролює коли model оновлюється
- Для складних форм, dynamic fields, type safety — reactive forms кращий вибір

### Elevator Pitch (2 minutes)
Template-driven forms — це Angular підхід де ви описуєте форму в template через `[(ngModel)]`, а Angular автоматично створює form model (FormGroup/FormControl) під капотом. NgForm обгортає кожний `<form>` і збирає дочірні ngModel controls. Валідація через директиви — required, minlength, або custom validators через NG_VALIDATORS. Головний trade-off: простота для невеликих форм за рахунок type safety і testability. Для production-ready enterprise додатків рекомендовані reactive forms, TDF доречні для простих ізольованих форм. Ключовий gotcha — form model асинхронна, що впливає на тестування і програмний доступ.
