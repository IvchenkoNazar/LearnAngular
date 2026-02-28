---
title: "ControlValueAccessor — Custom Form Controls"
block: 7
topic: 4
slug: "control-value-accessor"
difficulty: 4
sinceVersion: "2"
tags: ["ControlValueAccessor", "custom-form-control", "NG_VALUE_ACCESSOR", "reactive-forms", "template-driven-forms", "form-integration"]
relatedTopics: ["reactive-forms", "template-driven-forms", "custom-validators", "dependency-injection"]
interviewQuestions:
  - id: "b7t4q1"
    level: "junior"
    question: "Що таке ControlValueAccessor і навіщо він потрібен?"
    referenceAnswers:
      junior: "ControlValueAccessor — це інтерфейс що дозволяє створювати кастомні компоненти форм, які працюють як стандартні form controls. Він є мостом між Angular forms API (FormControl) і DOM елементом або кастомним компонентом."
      mid: "ControlValueAccessor — це інтерфейс з 4 методами: writeValue(), registerOnChange(), registerOnTouched(), setDisabledState(). Він дозволяє Angular forms працювати з будь-яким кастомним UI компонентом так само як з нативними input елементами. Компонент реєструється через NG_VALUE_ACCESSOR multi-provider і Angular автоматично виклика методи CVA при зміні form control value або стану."
      senior: "ControlValueAccessor — bridge pattern між Angular forms infrastructure і DOM/компонентом. Під капотом: DefaultValueAccessor (для стандартних inputs) реалізує CVA і реєструється на [formControlName], [ngModel], [formControl]. Коли Angular створює FormControl і прив'язує до елемента, він inject() NG_VALUE_ACCESSOR щоб знайти відповідний accessor. При FormControl.setValue(), Angular виклика accessor.writeValue() — це синхронний виклик. Коли юзер змінює значення, accessor виклика registered onChange() callback, який оновлює FormControl. setDisabledState() відповідає за disabled стан — найчастіше забувають імплементувати. Edge case: CVA і Validators незалежні — CVA не валідує, він тільки транслює values."
      staff: "CVA є критичним extension point Angular forms — він дозволяє forms infrastructure залишатись незалежною від конкретних UI primitives. Архітектурно: NG_VALUE_ACCESSOR — multi-provider token, тому multiple accessors можуть бути зареєстровані на одному елементі, але Angular використовує перший (defaultAccessor має низький priority через useExisting: forwardRef(() => MyComponent)). Для component library: кожен form component має бути CVA-compliant — це non-negotiable API contract. Performance consideration: writeValue() викликається при кожному setValue/patchValue — якщо компонент має expensive rendering, варто додати comparison check щоб уникнути needless re-renders. Testing CVA: create FormControl, attach to host element, verify writeValue/onChange roundtrip — це повний integration test. Для complex controls (date picker, rich text editor): CVA повинен транслювати між internal representation і form-compatible value type. Deprecated pattern: class-based providers з provide: NG_VALUE_ACCESSOR — prefer `hostDirectives` або `providers` в standalone component. З Angular 14+ typed forms: writeValue(value: T) тепер може бути типізований."
    commonMistakes:
      - "Забувають викликати onChange() при programmatic value changes всередині компонента"
      - "Не імплементують setDisabledState() — disabled стан form control не відображається"
      - "Викликають writeValue() рекурсивно — призводить до нескінченного циклу"
    relatedQuestions: ["b7t4q2", "b7t4q3"]
  - id: "b7t4q2"
    level: "mid"
    question: "Як правильно імплементувати ControlValueAccessor для кастомного компонента?"
    referenceAnswers:
      junior: "Потрібно реалізувати інтерфейс ControlValueAccessor з методами writeValue, registerOnChange, registerOnTouched, і додати provider NG_VALUE_ACCESSOR в декоратор компонента."
      mid: "Правильна імплементація: 1) implements ControlValueAccessor, 2) providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyComponent), multi: true}], 3) зберегти onChange і onTouched callbacks в полях класу, 4) викликати onChange() при внутрішніх змінах значення, 5) викликати onTouched() при blur/interaction, 6) writeValue() оновлює внутрішній стан без виклику onChange(). forwardRef потрібен бо компонент ще не визначений в момент provider declaration."
      senior: "Деталі правильної імплементації: 1) writeValue(value) — якщо value null/undefined, скинути до default; не викликати onChange() тут, бо це призведе до circular updates. 2) registerOnChange(fn) — зберегти fn в this.onChange, гарантувати що initial onChange = () => {} щоб уникнути null errors. 3) registerOnTouched(fn) — викликати при blur або першій interaction. 4) setDisabledState(isDisabled) — встановити disabled стан через ChangeDetectorRef якщо потрібно. Edge case з форками: якщо компонент має async операції, onChange() потрібно викликати в правильний час (не раніше ніж після user confirmation). Для nested form groups: CVA може повертати складний об'єкт як value — це валідно."
      staff: "Production-grade CVA implementation має враховувати: 1) Value equality — writeValue() має порівнювати нове значення з поточним (особливо для array/object values) щоб уникнути circular update loops через ChangeDetection. 2) OnPush compatibility — якщо компонент OnPush, після writeValue() потрібен markForCheck(). 3) Destroy cleanup — якщо CVA підписується на RxJS всередині, потрібен takeUntilDestroyed(). 4) Host directives pattern (Angular 15+): замість providers у decorator, можна використати hostDirectives для compose CVA поведінки. 5) Testing strategy: замість TestBed для кожного CVA unit test — пряма instantiation через new MyComponent() з mock injector. 6) Для design system: abstract base class для CVA що contains boilerplate (onChange, onTouched, writeValue tracking) зменшує дублювання."
    commonMistakes:
      - "Викликають onChange() всередині writeValue() — Angular loops між FormControl і CVA"
      - "Не використовують forwardRef() — компонент не знайдено при ін'єкції"
      - "Не зберігають onChange/onTouched як noop functions — null pointer exceptions при першому рендері"
    relatedQuestions: ["b7t4q1", "b7t4q3", "b7t3q1"]
  - id: "b7t4q3"
    level: "senior"
    question: "Як CVA взаємодіє з Validators і як реалізувати validation в кастомному form control?"
    referenceAnswers:
      junior: "CVA і Validators — це окремі концепції. Validators додаються до FormControl окремо через Validators.required або через NG_VALIDATORS provider."
      mid: "CVA не відповідає за validation — він тільки транслює values. Validators додаються: 1) через FormControl constructor: new FormControl('', [Validators.required, myValidator]), 2) через NG_VALIDATORS provider в компоненті (для built-in validation behavior), 3) через setValidators() динамічно. Якщо хочемо щоб кастомний компонент мав вбудовану валідацію, реалізуємо Validator interface разом з CVA: implements ControlValueAccessor, Validator — і реєструємо через обидва providers."
      senior: "Щоб кастомний компонент надавав власну validation logic, він має реалізувати Validator interface (validate(control): ValidationErrors | null) і зареєструватись через NG_VALIDATORS. Важливий нюанс: registerOnValidatorChange(fn) — необов'язковий метод Validator interface — потрібно зберегти і викликати fn() коли internal validation rules змінились (наприклад, якщо компонент приймає min/max як @Input()). Без цього батьківський FormControl не буде знати що потрібно re-run validation. Для async validation — AsyncValidator interface з validate() що повертає Observable<ValidationErrors>. Edge case: validation errors з CVA і validation errors з FormControl validators — обидва merge в control.errors."
      staff: "Архітектурний pattern для компонентів що потребують і CVA і Validation: create compound provider. Проблема з registerOnValidatorChange — якщо компонент не викликає onValidatorChange() при зміні validation inputs, батьківська форма стає stale. Це тонкий баг в production. Рекомендований pattern: замість NG_VALIDATORS, expose validation logic через explicit API (наприклад, @Input() validators: ValidatorFn[]) і let the consumer compose з FormControl. Це дає кращу testability і clear separation of concerns. Для дуже складних форм: consider форм-рівнева валідація через AbstractControl.addValidators() після CVA setup — це дає більший контроль. Тестова стратегія для CVA з validation: треба перевірити що 1) writeValue round-trips correctly, 2) onChange fires on user interaction, 3) validate() returns expected errors, 4) registerOnValidatorChange triggers re-validation."
    commonMistakes:
      - "Реалізують validation в writeValue() або onChange() замість окремого validate() методу"
      - "Забувають реєструвати через NG_VALIDATORS окремо від NG_VALUE_ACCESSOR"
      - "Не викликають onValidatorChange() при зміні validation input — форма стає stale"
    relatedQuestions: ["b7t4q2", "b7t3q1", "b7t4q4"]
  - id: "b7t4q4"
    level: "staff"
    question: "Як спроектувати component library де всі form controls є CVA-compliant і добре працюють з Angular forms в різних проектах?"
    referenceAnswers:
      junior: "Всі компоненти форм в бібліотеці мають реалізовувати ControlValueAccessor інтерфейс."
      mid: "Для component library: кожен form component реалізує CVA, надає consistent API (value, disabled, placeholder), і exports providers для external use. Важливо тестувати кожен CVA component в isolation і в combination з reactive і template-driven forms."
      senior: "Component library CVA design: 1) Base abstract class з CVA boilerplate, 2) Consistent value types (null для empty замість ''), 3) Generic typing для writeValue<T>, 4) setDisabledState implementation у кожному компоненті, 5) Exposing validity state через host binding (aria-invalid), 6) Тести що перевіряють roundtrip: setValue → writeValue → onChange → setValue. Необхідно вирішити: чи компонент emits на кожен keystroke чи on blur — це API decision."
      staff: "Enterprise component library CVA architecture: 1) AbstractFormFieldComponent base class що includes onChange = () => {}, onTouched = () => {}, implements CVA boilerplate — reduces 20+ lines per component. 2) Generic CVA interface: ControlValueAccessor<T> з typed writeValue(value: T | null) — typesafety across forms. 3) Interop testing matrix: кожен component має E2E tests в reactive forms + template-driven forms context. 4) Breaking change strategy: якщо value type змінюється між versions (e.g., string → Date для DatePicker), це major version change — semver critical. 5) hostDirectives (Angular 15+) дозволяє compose CVA behavior без providers boilerplate — кожен компонент може use shared CVA directive. 6) Documentation: для кожного CVA component — documented value format, null handling, disabled behavior. 7) Storybook integration: controls that mirror formControl API для playground testing. 8) Performance: мaркувати OnPush, уникати writeValue side effects, lazy initialize internal form controls."
    commonMistakes:
      - "Не визначають null handling consistently — половина компонентів приймає null, половина — empty string"
      - "Відсутня типізація CVA — writeValue(value: any) замість writeValue(value: T | null)"
      - "Немає тестів для CVA roundtrip — баги виявляються тільки у споживачів бібліотеки"
    relatedQuestions: ["b7t4q3", "b7t2q1"]
---

## Core Concept

**English definition:** ControlValueAccessor (CVA) is an Angular interface that acts as a bridge between Angular's form controls (FormControl, NgModel) and native DOM elements or custom components, enabling any component to participate in Angular Forms as a first-class form control.

**Пояснення:** ControlValueAccessor — це контракт між Angular forms infrastructure і будь-яким компонентом або DOM елементом. Без CVA Angular не може зв'язати FormControl з кастомним UI компонентом. Саме завдяки CVA кастомний date picker, rating component, або color selector можуть бути підключені до форми через `[formControl]`, `[ngModel]`, або `[formControlName]` так само як звичайний `<input>`.

**Яку проблему вирішує:** Angular forms API (FormControl, NgModel) за замовчуванням знає як спілкуватись тільки з нативними DOM елементами через вбудовані accessors (DefaultValueAccessor для text inputs, CheckboxControlValueAccessor для checkboxes, SelectControlValueAccessor для select). CVA вирішує проблему extensibility — дозволяє будь-якому кастомному компоненту брати участь у формі без зміни Angular forms code.

**Як працює під капотом:** Коли Angular процесує директиву `[formControl]`, `[ngModel]`, або `[formControlName]` на елементі, він inject(NG_VALUE_ACCESSOR) для цього елемента. NG_VALUE_ACCESSOR — це multi-provider token, тому може бути кілька зареєстрованих accessors. Angular вибирає "найспецифічніший" accessor (той що зареєстровано з useExisting на самому компоненті). Після вибору accessor:
1. Angular виклика `accessor.registerOnChange(fn)` — accessor зберігає callback для оповіщення форми про зміни
2. Angular виклика `accessor.registerOnTouched(fn)` — accessor зберігає callback для оповіщення про touched state
3. Angular виклика `accessor.writeValue(currentValue)` — форма передає поточне значення в accessor
4. Коли юзер взаємодіє з компонентом, accessor виклика збережений `onChange(newValue)` — FormControl оновлює своє значення

**Trade-offs та обмеження:**
- CVA додає boilerplate (~30 рядків на компонент) — при великих бібліотеках це накопичується
- Синхронна природа writeValue() може бути проблемою для async UI компонентів (animated transitions)
- CVA не надає type safety out-of-the-box до Angular 14 (typed forms)
- Помилки в CVA (особливо circular onChange calls) складно дебажити — вони проявляються як "ExpressionChangedAfterItHasBeenChecked" або infinite loops

**Версійність:** CVA існує з Angular 2. У Angular 14 з'явились Typed Forms — тепер writeValue(value: T) може бути типізований, що покращує DX. У Angular 15+ з'явились `hostDirectives` — новий pattern для compose CVA behavior. Deprecated: не існує — CVA є стабільним API.

## Deep Details

### Edge Cases

**writeValue() викликається з null:** При reset форми (form.reset()), Angular виклика writeValue(null). Компонент ОБОВ'ЯЗКОВО повинен обробляти null/undefined — встановлювати default value або empty state.

**Circular update loop:** Якщо в writeValue() викликати onChange() — FormControl оновлюється → Angular знову виклика writeValue() → і так до нескінченності. Це найпоширеніша помилка з CVA.

**OnPush і writeValue():** Якщо компонент з CVA використовує ChangeDetectionStrategy.OnPush, Angular не запустить change detection автоматично після writeValue(). Потрібно явно inject(ChangeDetectorRef).markForCheck() в writeValue().

**forwardRef() requirement:** В providers масиві компонента, useExisting: MyComponent не працює якщо клас ще не визначений (JavaScript hoisting). forwardRef(() => MyComponent) вирішує цю проблему через ліниву оцінку.

**Multiple CVA accessors:** Якщо зареєстровано кілька accessors для одного елемента (наприклад, і DefaultValueAccessor і кастомний), Angular може поводитися непередбачувано. Зазвичай потрібно додати `host: { '(input)': null }` або виключити DefaultValueAccessor.

### Junior vs Senior Understanding

**Junior розуміє:** Як написати базову CVA імплементацію — 4 методи + provider.

**Senior розуміє:**
- Чому forwardRef() необхідний (JavaScript temporal dead zone)
- Що NG_VALUE_ACCESSOR — multi-provider і як Angular вибирає accessor (specificity)
- Різницю між синхронним FormControl.setValue() (Angular → CVA) і асинхронним user input (CVA → FormControl)
- Чому writeValue() не повинен викликати onChange() (причини circular loops)
- Як CVA взаємодіє з ChangeDetectionStrategy.OnPush
- Як комбінувати CVA з Validator interface для вбудованої validation

**Staff розуміє:**
- Як спроектувати base CVA class для component library
- hostDirectives як альтернативу providers boilerplate
- Performance implications CVA в формах з багатьма controls
- Testability стратегії (unit vs integration)
- Breaking change management для CVA-compliant component libraries

### Deprecation & Migration Path

CVA сам по собі не deprecated. Проте старий стиль реєстрації:
```typescript
// Old: окремий provider object
providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyComp), multi: true}]
```
У Angular 15+ можна використовувати `hostDirectives` для compose behavior, але це опціонально — providers стиль залишається валідним.

Angular 14 Typed Forms: `writeValue(value: T)` тепер може бути повністю типізованим.

### Connections to Other Concepts

- **Reactive Forms (b7t2):** FormControl викликає CVA методи при setValue/patchValue
- **Template-Driven Forms (b7t1):** NgModel також використовує CVA через NG_VALUE_ACCESSOR
- **Custom Validators (b7t3):** CVA і Validator interface можна комбінувати в одному компоненті
- **Dependency Injection (Block 5):** NG_VALUE_ACCESSOR є multi-provider InjectionToken — це DI mechanics
- **Change Detection (Block 9):** CVA з OnPush потребує явного markForCheck()

## Examples

### Basic Usage

```typescript
import { Component, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="star-rating" [class.disabled]="isDisabled">
      @for (star of stars; track star) {
        <span
          class="star"
          [class.filled]="star <= currentValue"
          (click)="!isDisabled && selectRating(star)"
          (mouseenter)="!isDisabled && (hoverValue = star)"
          (mouseleave)="hoverValue = 0"
          [class.hovered]="star <= hoverValue"
          role="button"
          [attr.aria-label]="'Rate ' + star + ' stars'"
        >★</span>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true,
    },
  ],
})
export class StarRatingComponent implements ControlValueAccessor {
  stars = [1, 2, 3, 4, 5];
  currentValue = 0;
  hoverValue = 0;
  isDisabled = false;

  // Stored callbacks from Angular forms
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  // Called by Angular when FormControl value changes (e.g., setValue(), patchValue(), reset())
  writeValue(value: number | null): void {
    // Handle null from form.reset() — never call onChange() here!
    this.currentValue = value ?? 0;
    // If OnPush: inject(ChangeDetectorRef).markForCheck()
  }

  // Called by Angular once to register the "notify form of change" callback
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  // Called by Angular once to register the "mark as touched" callback
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Called by Angular when FormControl disabled state changes
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  selectRating(value: number): void {
    this.currentValue = value;
    // Notify Angular forms that value changed (user interaction)
    this.onChange(value);
    // Mark as touched on first interaction
    this.onTouched();
  }
}
```

Usage in reactive form:
```typescript
// In parent component
form = new FormGroup({
  rating: new FormControl<number>(0, [Validators.required, Validators.min(1)]),
});
```
```html
<form [formGroup]="form">
  <app-star-rating formControlName="rating" />
  <span *ngIf="form.get('rating')?.hasError('min')">Please select at least 1 star</span>
</form>
```

### Production Scenario

```typescript
// Rich text editor CVA component (production-grade)
import {
  Component, forwardRef, inject, OnDestroy, input,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="editor"
      [attr.contenteditable]="!isDisabled"
      [attr.aria-disabled]="isDisabled"
      (input)="onInput($event)"
      (blur)="onBlur()"
    ></div>
  `,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RichTextEditorComponent),
    multi: true,
  }],
})
export class RichTextEditorComponent implements ControlValueAccessor, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private editorEl: HTMLDivElement | null = null;
  isDisabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // Debounce to avoid emitting on every keystroke
  private inputSubject = new Subject<string>();

  constructor() {
    this.inputSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(value => {
      this.onChange(value);
    });
  }

  writeValue(value: string | null): void {
    const safeValue = value ?? '';
    // Avoid redundant DOM updates (equality check!)
    if (this.editorEl && this.editorEl.innerHTML !== safeValue) {
      this.editorEl.innerHTML = safeValue;
    }
    // OnPush: must trigger CD after external value change
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLDivElement).innerHTML;
    this.inputSubject.next(value);
  }

  onBlur(): void {
    this.onTouched();
  }

  ngOnDestroy(): void {
    this.inputSubject.complete();
  }
}
```

### Anti-Example

```typescript
// WRONG: Multiple critical mistakes
@Component({
  selector: 'app-bad-input',
  template: `<input [value]="value" (input)="onInput($event)">`,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: BadInputComponent, // WRONG: missing forwardRef()
    multi: true,
  }],
})
export class BadInputComponent implements ControlValueAccessor {
  value = '';
  private onChange: any; // WRONG: no default noop — will throw if called before registerOnChange

  writeValue(value: string): void {
    this.value = value;
    this.onChange(value); // WRONG: calling onChange() in writeValue() creates infinite loop!
    // FormControl.setValue → writeValue() → onChange() → FormControl.setValue → writeValue()...
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    // WRONG: fn not stored — onTouched never called — control never marked as touched
  }

  // WRONG: setDisabledState() not implemented — disabled FormControl has no effect on UI

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    // WRONG: not calling onTouched() — control never marked as touched on interaction
    this.onChange(this.value);
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Calling `onChange()` inside `writeValue()` | Creates infinite update loop: FormControl → writeValue → onChange → FormControl... | Only call `onChange()` from user interaction handlers, never from `writeValue()` |
| No default noop for `onChange`/`onTouched` | Throws "Cannot invoke undefined" before Angular calls `registerOnChange()` (e.g., during initial render) | Initialize: `private onChange = () => {}; private onTouched = () => {};` |
| Missing `setDisabledState()` | FormControl's disabled state has no visual effect — users can still interact with disabled controls | Always implement `setDisabledState(isDisabled: boolean)` and apply to host element |
| Missing `forwardRef()` in provider | Provider registration fails at class definition time due to JavaScript temporal dead zone | `useExisting: forwardRef(() => MyComponent)` — lazy evaluation defers resolution |
| Not handling `null` in `writeValue()` | `form.reset()` passes `null` — component throws or renders incorrectly | `writeValue(value: T \| null): void { this.internalValue = value ?? defaultValue; }` |

## Interview Block

### [L1 — Warm-up] Що таке ControlValueAccessor і навіщо він потрібен?

**Signal being tested:** Розуміння bridge pattern між Angular forms і кастомними UI компонентами.

**What the interviewer expects:** Кандидат повинен пояснити що CVA дозволяє кастомним компонентам поводитись як нативні form controls, і перелічити основні методи інтерфейсу.

**How to probe deeper:** "Назви 4 методи CVA і поясни навіщо кожен з них?"

**Reference answer:** ControlValueAccessor — це інтерфейс з 4 методами (writeValue, registerOnChange, registerOnTouched, setDisabledState) що дозволяє будь-якому Angular компоненту підключитись до Angular forms API через `[formControl]`, `[ngModel]`, або `[formControlName]`. Він є bridge між FormControl і DOM/компонентом. Необхідний коли стандартні нативні inputs не підходять і потрібен кастомний UI.

**Common mistakes:** Говорять що CVA тільки для reactive forms — насправді він працює з обома підходами (reactive і template-driven).

---

### [L2 — Mid] Чому у writeValue() не можна викликати onChange(), і як правильно notify форму про зміни?

**Signal being tested:** Розуміння data flow між FormControl і CVA — хто ініціює оновлення і в якому напрямку.

**What the interviewer expects:** Кандидат має пояснити що writeValue() — це "форма → компонент" напрямок, onChange() — "компонент → форма", і змішування призводить до infinite loop.

**How to probe deeper:** "Що відбудеться якщо все ж таки викликати onChange() у writeValue()? Як Angular це обробляє?"

**Reference answer:** writeValue() — це односторонній потік "форма → компонент". Angular виклика writeValue() коли FormControl value змінюється ззовні (setValue, patchValue, reset). onChange() — це зворотній напрямок "компонент → форма", викликається при user interaction. Якщо викликати onChange() у writeValue(), це оновить FormControl, що знову запустить writeValue(), утворюючи нескінченний цикл. onChange() потрібно викликати виключно в user interaction handlers (input, click, change events).

**Common mistakes:** Думають що writeValue() повинен і оновлювати UI і повідомляти форму — це неправильне розуміння однонаправленого data flow.

---

### [L3 — Senior] Як CVA взаємодіє з ChangeDetectionStrategy.OnPush і які проблеми можуть виникнути?

**Signal being tested:** Здатність поєднати два незалежних механізми Angular (forms і change detection) і передбачити non-obvious взаємодії.

**What the interviewer expects:** Кандидат пояснить що Angular не тригерить CD автоматично для OnPush після writeValue(), і що потрібен явний markForCheck().

**How to probe deeper:** "Де ще в CVA lifecycle може знадобитись markForCheck()?"

**Reference answer:** При ChangeDetectionStrategy.OnPush Angular запускає CD тільки при: Input change, async pipe emit, manual markForCheck/detectChanges, або event binding. writeValue() викликається з Angular forms infrastructure синхронно, але поза normal CD cycle. Тому якщо OnPush компонент отримує нове значення через writeValue() і оновлює internal state — UI не оновиться до наступного CD cycle. Рішення: inject(ChangeDetectorRef).markForCheck() в кінці writeValue() і setDisabledState(). registerOnChange/registerOnTouched не потребують markForCheck — вони тільки зберігають callbacks.

**Common mistakes:** Думають що OnPush і CVA несумісні або що потрібен detectChanges() замість markForCheck() (detectChanges запускає CD синхронно що може спричинити ExpressionChangedAfterItHasBeenChecked).

---

### [L4 — Staff/Principal] Як спроектувати CVA-compliant component library для enterprise Angular додатків?

**Signal being tested:** Системне мислення про form control API design, breaking changes, testability і cross-cutting concerns для великих команд.

**What the interviewer expects:** Кандидат виходить за межі одного компонента і думає про: base class, типізацію, тестову стратегію, versioning, documentation.

**How to probe deeper:** "Як ти вирішиш питання null vs empty string для value type consistency між різними controls в бібліотеці?"

**Reference answer:** Для enterprise CVA library: 1) Abstract base class AbstractFormControl<T> з boilerplate (onChange, onTouched noop init, writeValue з null handling) — reduces ~25 lines per component. 2) Generic типізація: ControlValueAccessor<T> — writeValue(value: T | null). 3) Consistent null contract: всі controls повертають null для empty state, ніколи empty string — це обов'язково документувати. 4) Тестова матриця: кожен control тестується в reactive + template-driven context. 5) setDisabledState — обов'язковий, enforced через lint rule або abstract method. 6) Breaking changes: зміна value type — major version, нові optional methods — minor version. 7) Angular 15+ hostDirectives pattern для DI-free CVA composition.

**Common mistakes:** Розробники library не думають про null contract і кожен компонент обробляє null по-різному — споживачі library отримують inconsistent behavior.

## Summary

### Key Points

- ControlValueAccessor — bridge між Angular FormControl і будь-яким кастомним компонентом; реєструється через NG_VALUE_ACCESSOR multi-provider
- Чотири обов'язкові методи: `writeValue()` (форма → компонент), `registerOnChange()`, `registerOnTouched()`, `setDisabledState()`
- **Критичне правило:** `writeValue()` НІКОЛИ не повинен викликати `onChange()` — це призводить до infinite update loop
- `forwardRef(() => MyComponent)` обов'язковий у providers — JavaScript temporal dead zone не дозволяє посилатись на клас до його декларації
- OnPush компоненти потребують `inject(ChangeDetectorRef).markForCheck()` всередині `writeValue()` і `setDisabledState()`
- CVA і Validator interface можна комбінувати — компонент може бути і form value carrier і validation provider одночасно
- Для component library: abstract base class, generic типізація, consistent null contract, тест-матриця reactive + template-driven

### Elevator Pitch (2 minutes)

ControlValueAccessor — це контракт, який Angular використовує щоб спілкуватись з будь-яким UI компонентом як з form control. Без нього Angular forms не знають як читати і писати значення в кастомні компоненти. CVA визначає 4 методи: writeValue() — Angular передає значення в компонент; registerOnChange(fn) — Angular дає компоненту callback для оповіщення про зміни; registerOnTouched(fn) — callback для touched state; setDisabledState() — для disabled/enabled. Головне правило: writeValue() — це односторонній потік від форми до компонента, onChange() — від компонента до форми. Змішування призводить до infinite loop. Компонент реєструється через NG_VALUE_ACCESSOR multi-provider з forwardRef. Це дозволяє використовувати кастомний date picker, star rating, або rich text editor з [formControl] або [(ngModel)] так само як звичайний input.
