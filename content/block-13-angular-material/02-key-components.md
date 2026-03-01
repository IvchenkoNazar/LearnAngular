---
title: "Key Angular Material Components"
block: 13
topic: 2
slug: "key-components"
difficulty: 2
sinceVersion: "2"
tags: ["MatTable", "MatDialog", "MatFormField", "MatSnackBar", "MatStepper", "CDK", "overlay"]
relatedTopics: ["setup-theming", "cdk", "reactive-forms", "tailwind-angular-components"]
interviewQuestions:
  - level: "junior"
    question: "Як використати MatTable для відображення списку даних з сортуванням і пагінацією?"
    referenceAnswers:
      junior: "Треба підключити MatTableModule, MatSortModule, MatPaginatorModule. Визначити dataSource, displayedColumns, і додати matSort директиву та mat-paginator компонент."
      mid: "MatTable setup: 1) `dataSource = new MatTableDataSource(data)`. 2) Після ViewInit: `this.dataSource.sort = this.sort; this.dataSource.paginator = this.paginator`. 3) Template: `<mat-table [dataSource]>`, `<mat-header-cell *matHeaderCellDef mat-sort-header>`, `<mat-paginator>`. MatTableDataSource автоматично handles sorting, pagination, filtering через filterPredicate."
      senior: "MatTableDataSource internals: 1) Filtering — `dataSource.filter = searchTerm` тригерить `filterPredicate` — за замовчуванням lowercases і includes на всіх string-able fields. Custom `filterPredicate` для complex filtering. 2) Sorting — `MatSort` підключається через dataSource.sort, sort accessor via `sortingDataAccessor`. 3) Pagination — `MatPaginator` підключається через dataSource.paginator. 4) Server-side: замінити MatTableDataSource на custom DataSource клас що extends `DataSource<T>` і implements `connect()/disconnect()`. Observable-based — дозволяє reactive streams з HTTP. 5) virtual scrolling для великих таблиць — CdkVirtualScrollViewport замість paginator."
      staff: "MatTable at scale: 1) MatTableDataSource — це client-side utility. Для > 1000 rows: server-side DataSource з RxJS BehaviorSubject для sort/page/filter state, merging streams через combineLatest. 2) Performance: `trackBy` функція критична — без неї Angular re-creates всі row DOM nodes при data зміні. 3) Sticky columns: `[sticky]` і `[stickyEnd]` через CSS `position: sticky` — перевіряти browser support і container overflow. 4) Column definitions в окремих компонентах (reusable columns pattern) — Angular Material підтримує через ng-container + *matColumnDef. 5) Accessibility: `aria-label` на mat-table, `role='grid'` vs `role='table'`, keyboard navigation з CDK focus management. 6) Bundle: MatTable тягне MatSort, MatPaginator, MatFormField для filter — lazy load разом як feature module."
    commonMistakes:
      - "Підключають sort і paginator в ngOnInit замість ngAfterViewInit — ViewChild ще не ініціалізовані"
      - "Не додають trackBy — таблиця перемальовується повністю при будь-якій зміні"
      - "Використовують MatTableDataSource для server-side pagination — фільтрує/сортує client-side дані"
    relatedQuestions: ["b13t2q2", "b13t3q1"]
  - level: "mid"
    question: "Як відкрити MatDialog, передати дані в діалог і отримати результат закриття?"
    referenceAnswers:
      junior: "Inject MatDialog сервіс, викликати open() з компонентом і data. Підписатись на afterClosed() щоб отримати результат."
      mid: "MatDialog usage: 1) `dialog.open(MyDialogComponent, { data: { id: 1 } })` повертає `MatDialogRef`. 2) В діалог компоненті: `inject(MAT_DIALOG_DATA)` для доступу до data. 3) Закриття: `dialogRef.close(result)` або кнопка з `mat-dialog-close` directive. 4) `dialogRef.afterClosed()` — Observable що emit результат. 5) Opaque результат: якщо закрити через ESC або backdrop click — emit undefined."
      senior: "MatDialog internals: 1) Під капотом використовує CDK Overlay — `OverlayRef` з `PositionStrategy` (global, center). 2) `MatDialogRef.close(result)` — тригерить AnimationEvent, потім complete на afterClosed subject. 3) Focus management: CDK FocusTrap ловить фокус в діалозі — перший focusable element отримує фокус на відкритті. `restoreFocus` option повертає фокус на trigger element при закритті. 4) Scroll strategy: `BlockScrollStrategy` за замовчуванням — блокує scroll body. 5) `disableClose: true` — вимикає ESC і backdrop click. 6) Component-less dialogs через `TemplateRef`. 7) Multiple dialogs: стекуються, overlay dark background накопичується — використовуйте `panelClass` для кастомізації."
      staff: "MatDialog at scale: 1) DialogService abstraction поверх MatDialog — centralized registry, prevents duplicate dialogs, logging. 2) Lazy loading dialog components — MatDialog.open() може lazy-load через dynamic import. 3) Dialog result typing: `MatDialogRef<DialogComponent, ResultType>` — compile-time type safety для afterClosed result. 4) Global dialog configuration via `MAT_DIALOG_DEFAULT_OPTIONS` token — default width, position, panelClass. 5) Accessibility: `ariaLabel`, `ariaDescribedBy` в dialog config — критично для screen readers. WCAG: dialog повинен мати роль dialog і aria-modal='true'. 6) Mobile: bottom sheet (MatBottomSheet) як alternative для mobile screens — UX рішення. 7) Testing: `MatDialogHarness` з `@angular/material/testing` для stable component tests."
    commonMistakes:
      - "Не обробляють undefined від afterClosed — ESC/backdrop повертає undefined, не null"
      - "Не обмежують ширину діалогу (width/maxWidth) — на mobile займає весь екран некрасиво"
      - "Subscribe без takeUntilDestroyed або async pipe — memory leak якщо component зникає до закриття"
    relatedQuestions: ["b13t2q1", "b13t3q2"]
  - level: "mid"
    question: "Як реалізувати кастомний MatFormField control через ControlValueAccessor?"
    referenceAnswers:
      junior: "Потрібно реалізувати ControlValueAccessor інтерфейс і надати його через NG_VALUE_ACCESSOR. Тоді компонент може використовуватись як form control."
      mid: "Custom MatFormField control потребує: 1) `ControlValueAccessor` — writeValue(), registerOnChange(), registerOnTouched(). 2) `MatFormFieldControl<T>` interface — value, stateChanges Subject, id, placeholder, ngControl, focused, empty, shouldLabelFloat, required, disabled, errorState, controlType. 3) Provide через `useExisting: forwardRef(() => MyControl)` для обох. 4) Inject NgControl і set valueAccessor в constructor."
      senior: "MatFormField control details: 1) `stateChanges: Subject<void>` — emit коли будь-який Material-relevant стан змінюється (focused, disabled, value). MatFormField підписується і runs change detection. 2) `shouldLabelFloat` — логіка для плаваючого label (true коли focused або value non-empty). 3) `errorState` — показувати помилку. Зазвичай: `this.ngControl?.invalid && this.ngControl?.touched`. 4) `setDescribedByIds(ids: string[])` — accessibility: ids елементів що описують control (hint text, error). 5) `onContainerClick(event)` — клік на MatFormField wrapper, зазвичай фокусує внутрішній input. 6) `id` property — унікальний id для label `for` attribute зв'язку."
      staff: "Custom form controls at enterprise scale: 1) Abstract base class для shared CVA logic: `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState` — reduces boilerplate per control. 2) Validation: custom validators через `NG_VALIDATORS` provider + Validators.compose(). 3) Async validators — `NG_ASYNC_VALIDATORS` для server-side validation (unique username). 4) Composite controls: компонент що contains multiple form fields — provides ControlValueAccessor що aggregates nested state. 5) Testing: `FormControl` wrapper в test + `fixture.detectChanges()` + перевіряти rendered DOM. `ReactiveFormsModule` + `MatFormFieldModule` потрібні в TestBed. 6) Accessibility: `aria-describedby` через setDescribedByIds, `aria-invalid`, `aria-required` на внутрішньому input. 7) Error messages: custom ErrorStateMatcher для business-specific error display logic."
    commonMistakes:
      - "Не emit stateChanges після кожної зміни стану — MatFormField не оновлює label і error display"
      - "Забувають implement setDescribedByIds — accessibility hint/error text не пов'язується з control"
      - "Inject NgControl напряму замість через constructor + Optional + Self decorators — circular dependency"
    relatedQuestions: ["b13t2q2", "b7t3q1"]
  - level: "senior"
    question: "Як MatSnackBar і MatStepper вирішують свої специфічні UX задачі? Які є не-очевидні налаштування?"
    referenceAnswers:
      junior: "MatSnackBar показує тимчасові повідомлення внизу екрану. MatStepper — покроковий wizard для форм."
      mid: "MatSnackBar: `snackBar.open(message, action, { duration: 3000 })`. Кастомний компонент через `openFromComponent()`. MatStepper: linear і non-linear режими. `[stepControl]` на кожному step для validation. Horizontal і vertical орієнтації."
      senior: "MatSnackBar internals: 1) Використовує MatSnackBarContainer — CDK overlay-based. 2) `MatSnackBarRef<T>` — dismiss(), afterDismissed(), onAction(). 3) Global config через `MAT_SNACK_BAR_DEFAULT_OPTIONS`. 4) Queue: за замовчуванням нові snackbars відкриваються поверх старих — немає built-in queue, треба dismiss попередній. 5) Horizontal і vertical position config. MatStepper: 1) `[linear]` — не можна перейти вперед без валідації попереднього step. 2) `[stepControl]` — FormGroup чи FormControl для кожного step. 3) `StepperSelectionEvent` — для tracking. 4) `[completed]` і `[editable]` inputs для custom state. 5) Reset: `stepper.reset()` — скидає step і форму. 6) Programmatic navigation: `stepper.next()`, `stepper.previous()`, `stepper.selectedIndex`."
      staff: "Snackbar at scale: 1) Toast service pattern — wrapper над MatSnackBar з queue, типами (success/error/warning), і deduplication. 2) Accessibility: snackbars повинні mають `aria-live` region. MatSnackBar вже має `role='status'` — але action button повинен мати meaningful `aria-label`. 3) Test: `MatSnackBarHarness` для stable tests. Stepper at scale: 1) Multi-step forms з server-side validation per step — async validators на step FormGroup. 2) Step data persistence — зберігати step state при navigation (back/forward). 3) URL sync — `Router` navigation між steps для bookmarking і browser back button. 4) Accessibility: `aria-label` на MatStepper, step icons conveying status visually і через aria. 5) Mobile UX: vertical stepper для mobile, horizontal для desktop — responsive via BreakpointObserver."
    commonMistakes:
      - "Відкривають кілька MatSnackBar одночасно без dismiss попереднього — overlap і confusion"
      - "Linear stepper без [stepControl] — не блокує некоректну навігацію"
      - "Не reset stepper після submit — повторне відкриття форми показує completed state"
    relatedQuestions: ["b13t2q3", "b13t3q1"]
  - level: "staff"
    question: "Як інтегрувати Angular Material компоненти в складну reactive forms систему, включаючи nested form groups, dynamic forms, і cross-field validation?"
    referenceAnswers:
      junior: "Material компоненти підтримують reactive forms через formControlName директиву — підключаєш formGroup і вказуєш controlName."
      mid: "Material + reactive forms: `formControlName` на MatInput, MatSelect, MatCheckbox. Nested: `formGroupName` або `FormGroupDirective`. Dynamic forms: `FormArray` + `*ngFor` по controls. Custom validators через `Validators.compose()`. Error display через `hasError()` і `*ngIf`."
      senior: "Complex reactive forms з Material: 1) Dynamic FormArray з Material: `FormArray.push(new FormGroup({...}))` + `*ngFor` з `[formGroup]` + index. 2) Cross-field validation: validator на FormGroup рівні (не field) — `FormGroup.setErrors()`. MatFormField error display потребує custom `errorStateMatcher` що читає parent FormGroup errors. 3) Custom ErrorStateMatcher: implement `isErrorState(control, form)` — можна показати помилки при submit (`form?.submitted`). 4) AsyncValidator + MatFormField loading state: custom control з `pending` state показує spinner. 5) ControlValueAccessor як nested form group — реалізувати writeValue що патчить внутрішній FormGroup."
      staff: "Enterprise form architecture з Material: 1) Form builder service pattern: `FormFactory.createProductForm()` — centralized, testable, reusable form creation. 2) Dynamic form schemas: JSON schema → FormGroup builder → Material component mapping. Drag-and-drop form builder. 3) Form state persistence: `LocalStorageService.saveFormState(form.value)` при кожній зміні — resume from draft. 4) Multi-step form (MatStepper) з shared FormGroup: steps share one root FormGroup, кожен step контролює свій subset — submit на останньому step. 5) Server-side validation integration: `AsyncValidator` з debounce, відображення server errors через `control.setErrors({ serverError: message })`. 6) Performance: великі форми з сотнями controls — `ChangeDetectionStrategy.OnPush` + `FormGroup.valueChanges.pipe(debounceTime)` замість частих CD cycles. 7) Testing: `ReactiveFormsModule` + `MatFormFieldHarness`, `MatInputHarness` для form interaction tests — stable selectors."
    commonMistakes:
      - "Cross-field validator на control замість FormGroup — не має доступу до sibling controls"
      - "ErrorStateMatcher за замовчуванням не показує помилки до touch — поганий UX при submit"
      - "Не використовують Material Testing Harnesses — тести ламаються при Material DOM updates"
    relatedQuestions: ["b13t2q3", "b13t2q4", "b7t2q1"]
---

## Core Concept

**English definition:** Angular Material provides a comprehensive set of UI components implementing Material Design specification — including data display (MatTable), overlays (MatDialog, MatSnackBar), form controls (MatFormField, MatSelect, MatAutocomplete), and navigation components (MatStepper) — all built on top of the Angular CDK.

**Пояснення:** Angular Material компоненти — це production-ready UI blocks реалізовані поверх CDK (Component Dev Kit). Вони забезпечують Material Design UX out-of-the-box: правильні анімації, accessibility (ARIA), keyboard navigation, і theming через CSS custom properties. Правильне використання економить тижні роботи порівняно зі створенням з нуля.

**Яку проблему вирішує:** Будування production-якісних UI компонентів з нуля — дорого і складно: accessibility, focus management, keyboard support, animations, theming. Angular Material вирішує ці проблеми системно, залишаючи розробникам business logic.

**Як працює під капотом:**

Більшість Material компонентів — це Angular components і directives поверх CDK primitives:

- **MatTable** — CDK `CdkTable` з Material styling і `MatTableDataSource` utility
- **MatDialog** — CDK `Overlay` сервіс з `GlobalPositionStrategy` і `FocusTrap`
- **MatFormField** — контейнер що спілкується зі своїм control через `MatFormFieldControl<T>` interface
- **MatSnackBar** — CDK Overlay з `LiveAnnouncer` для accessibility
- **MatAutocomplete** — CDK `Overlay` з `ConnectedPositionStrategy` поверх input

```typescript
// MatTable data flow (спрощено)
// MatTableDataSource.connect() повертає Observable<T[]>
// CdkTable підписується і рендерить rows
// MatSort підписується на sortChange → DataSource.sortData()
// MatPaginator підписується на page → DataSource.paginate()
```

**Trade-offs та обмеження:**

- Material компоненти мають opinionated styling — складно відхилитись від Material Design без боротьби зі стилями
- Bundle size: кожен MatModule додає CSS і JS — lazy load per feature module
- MatTable не підтримує native virtual scrolling (потребує CDK VirtualScrollViewport replacement)
- MatDialog не має built-in queue — потрібна custom implementation для toast-like notifications
- ControlValueAccessor для custom form controls — складна, але необхідна абстракція

**Версійність:**
- Angular Material 2-14: M2 компоненти, legacy form field appearance: legacy, standard, fill, outline
- Angular Material 15: Deprecated MatLegacyButton, MatLegacyInput тощо; fill/outline як M3 defaults
- Angular Material 17+: Material 3 stable, нові component APIs без [color]="'accent'"
- Angular Material 18+: MatLegacy* компоненти removed

## Deep Details

### Edge Cases

- **MatTable + Virtual Scroll:** MatTable не має built-in virtual scrolling. Рішення: `CdkVirtualScrollViewport` як table container з custom DataSource — але втрачається MatSort. Альтернатива: pagination замість scroll для великих datasets.
- **MatDialog і Angular Router:** Відкритий dialog не закривається при navigation — потрібно inject `Router` і підписатись на `navigationStart` у dialog або використовувати `NavigationService` pattern.
- **MatFormField і OnPush:** `stateChanges.next()` в custom control повинен тригерити `markForCheck()` на MatFormField — інакше label не оновлюється з OnPush.
- **MatAutocomplete і mobile:** На iOS `<input>` з `matAutocomplete` може не відкривати autocomplete panel через browser auto-zoom. Мінімальний font-size 16px запобігає zoom.
- **MatSelect і великі списки:** `MatSelect` не має virtual scrolling — для сотень options використовуйте `MatAutocomplete` з filtering або CDK Virtual Scroll всередині overlay.

### Junior vs Senior Understanding

**Junior** знає: імпортувати Material модулі, використовувати компоненти в template, базову прив'язку до reactive forms.

**Senior** розуміє:

1. **CDK under the hood** — кожен overlay компонент (Dialog, Snackbar, Autocomplete, Tooltip) використовує CDK Overlay. Розуміння CDK дозволяє кастомізацію та дебагінг проблем з позиціонуванням/z-index.
2. **MatFormFieldControl interface** — `stateChanges`, `shouldLabelFloat`, `errorState`, `setDescribedByIds` — кожен метод має конкретне призначення для Material form field rendering.
3. **DataSource pattern** — `DataSource<T>` extends Observable pattern. `connect()` повертає Observable<T[]>, `disconnect()` — cleanup. Server-side pagination = custom DataSource з HTTP calls.
4. **Testing harnesses** — `MatTableHarness`, `MatDialogHarness`, `MatInputHarness` від `@angular/material/testing` — stable DOM-independent tests.

### Deprecation & Migration Path

- **MatLegacy* components (v15):** `MatLegacyButton`, `MatLegacyInput` тощо — deprecated v15, removed v18. Migration: `ng update @angular/material` + schematic автоматизує rename.
- **Form field appearances:** `legacy` і `standard` appearances removed. Використовуйте `fill` або `outline`.
- **`[color]="'accent'"`:** M3 не має accent semantic — замінити на primary або tertiary.
- **`MatProgressBar`, `MatProgressSpinner` color inputs:** deprecated в M3, замінено CSS variables.

### Connections to Other Concepts

- **CDK:** Material компоненти — тонкий шар поверх CDK. Для кастомних overlay/tooltip/dialog — використовуйте CDK напряму
- **Reactive Forms:** `ControlValueAccessor` і `MatFormFieldControl` — два окремих interface для form integration і Material UI integration відповідно
- **Theming:** `mat.all-component-themes()` включає CSS для всіх компонентів описаних тут
- **Accessibility:** Material компоненти мають ARIA built-in, але потребують правильного контексту (aria-labels, form labels)

## Examples

### Basic Usage

```typescript
// feature.module.ts або standalone imports
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// users.component.ts
import {
  Component, ViewChild, AfterViewInit, signal
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule
  ],
  template: `
    <!-- Filter input -->
    <mat-form-field>
      <mat-label>Filter</mat-label>
      <input matInput (keyup)="applyFilter($event)"
             placeholder="Search users...">
    </mat-form-field>

    <!-- Table -->
    <mat-table [dataSource]="dataSource" matSort>
      <ng-container matColumnDef="name">
        <mat-header-cell *matHeaderCellDef mat-sort-header>Name</mat-header-cell>
        <mat-cell *matCellDef="let user">{{ user.name }}</mat-cell>
      </ng-container>

      <ng-container matColumnDef="email">
        <mat-header-cell *matHeaderCellDef mat-sort-header>Email</mat-header-cell>
        <mat-cell *matCellDef="let user">{{ user.email }}</mat-cell>
      </ng-container>

      <ng-container matColumnDef="role">
        <mat-header-cell *matHeaderCellDef>Role</mat-header-cell>
        <mat-cell *matCellDef="let user">{{ user.role }}</mat-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
      <mat-row *matRowDef="let row; columns: displayedColumns;"
               [class.selected]="selectedUser() === row"
               (click)="selectedUser.set(row)">
      </mat-row>
    </mat-table>

    <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons>
    </mat-paginator>
  `
})
export class UsersComponent implements AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = ['name', 'email', 'role'];
  dataSource = new MatTableDataSource<User>([]);
  selectedUser = signal<User | null>(null);

  // Critical: ViewChild available only in ngAfterViewInit
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    // Reset paginator to first page after filter
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
```

### Production Scenario

```typescript
// confirm-dialog.component.ts — типовий production dialog
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerous?: boolean;
}

export type ConfirmDialogResult = 'confirm' | 'cancel';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="'cancel'">
        {{ data.cancelLabel ?? 'Cancel' }}
      </button>
      <button mat-flat-button
              [color]="data.dangerous ? 'warn' : 'primary'"
              [mat-dialog-close]="'confirm'">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
```

```typescript
// dialog.service.ts — DialogService wrapper
import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  ConfirmDialogResult
} from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<ConfirmDialogResult> {
    const config: MatDialogConfig<ConfirmDialogData> = {
      data,
      width: '400px',
      maxWidth: '90vw',    // mobile-friendly
      disableClose: true,  // вимагаємо explicit cancel
    };

    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult>(
        ConfirmDialogComponent,
        config
      )
      .afterClosed()
      .pipe(filter((result): result is ConfirmDialogResult => result !== undefined));
  }
}
```

```typescript
// server-side-data-source.ts — реальний server-side DataSource
import { DataSource } from '@angular/cdk/collections';
import { Observable, combineLatest, BehaviorSubject, switchMap, tap } from 'rxjs';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

interface PagedResult<T> {
  items: T[];
  total: number;
}

@Injectable()
export class ServerSideDataSource<T> extends DataSource<T> {
  private readonly sort$ = new BehaviorSubject<Sort>({ active: '', direction: '' });
  private readonly page$ = new BehaviorSubject<PageEvent>({ pageIndex: 0, pageSize: 25, length: 0 });
  loading$ = new BehaviorSubject<boolean>(false);
  total$ = new BehaviorSubject<number>(0);

  constructor(
    private readonly fetchFn: (sort: Sort, page: PageEvent) => Observable<PagedResult<T>>
  ) {
    super();
  }

  connectSort(sort: MatSort): void {
    sort.sortChange.subscribe(s => this.sort$.next(s));
  }

  connectPaginator(paginator: MatPaginator): void {
    paginator.page.subscribe(p => this.page$.next(p));
  }

  connect(): Observable<T[]> {
    return combineLatest([this.sort$, this.page$]).pipe(
      tap(() => this.loading$.next(true)),
      switchMap(([sort, page]) => this.fetchFn(sort, page)),
      tap(result => {
        this.total$.next(result.total);
        this.loading$.next(false);
      }),
      map(result => result.items)
    );
  }

  disconnect(): void {
    this.loading$.complete();
    this.total$.complete();
  }
}
```

### Anti-Example

```typescript
// WRONG: Підключення sort/paginator у ngOnInit
@Component({...})
export class WrongTableComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<User>([]);

  ngOnInit(): void {
    // ViewChild ще не ініціалізовані в ngOnInit!
    this.dataSource.sort = this.sort;     // sort = undefined
    this.dataSource.paginator = this.paginator; // paginator = undefined
    // Sorting і pagination не працюватимуть
  }
}

// CORRECT: AfterViewInit
export class CorrectTableComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}

// WRONG: Memory leak з MatDialog
@Component({...})
export class WrongDialogUsageComponent {
  private dialog = inject(MatDialog);

  openConfirm(): void {
    this.dialog.open(ConfirmDialog).afterClosed().subscribe(result => {
      // Якщо component знищується до закриття dialog — memory leak!
      if (result) this.doAction();
    });
  }
}

// CORRECT: takeUntilDestroyed
export class CorrectDialogUsageComponent {
  private destroyRef = inject(DestroyRef);

  openConfirm(): void {
    this.dialog.open(ConfirmDialog).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) this.doAction();
      });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| MatTableDataSource для server-side data | MatTableDataSource фільтрує/сортує client-side — для server-side fetch потрібний custom `DataSource<T>` | Implement `DataSource<T>` з `connect()` що повертає Observable<T[]> з HTTP calls |
| Підключення sort/paginator у ngOnInit | ViewChild недоступний в ngOnInit — sort і pagination мовчки не працюють | Завжди підключати у ngAfterViewInit |
| MatDialog без width/maxWidth | На mobile dialog займає весь екран, на desktop може бути замалий | `{ width: '400px', maxWidth: '90vw' }` для responsive dialogs |
| Відкрити MatSnackBar поверх існуючого | Snackbars стакуються або перекриваються — заплутаний UX | Dismiss попередній перед відкриттям нового або використовуйте queue service |
| Custom form control без stateChanges.next() | MatFormField не знає про зміни стану — label, errors, floating не оновлюються | Emit stateChanges після кожної зміни value, focused, disabled state |

## Interview Block

### [L1 — Warm-up] Як налаштувати MatTable з sorting і pagination?
**Signal being tested:** Практичний досвід з одним з найпоширеніших Material компонентів.
**What the interviewer expects:** ViewChild для MatSort і MatPaginator, підключення через dataSource, обов'язкове ngAfterViewInit.
**How to probe deeper:** "Чому підключення в ngOnInit не працює?"
**Reference answer:** Три кроки: 1) Додати `matSort` директиву на `<mat-table>` і `<mat-header-cell mat-sort-header>`. 2) Додати `<mat-paginator>`. 3) В `ngAfterViewInit`: `dataSource.sort = this.sort; dataSource.paginator = this.paginator`. ViewChild для `MatSort` і `MatPaginator` доступні тільки після view initialization — тому не ngOnInit.
**Common mistakes:** Підключення у ngOnInit — ViewChild undefined. Забувають trackBy — таблиця перемальовується повністю при зміні даних.

### [L2 — Mid] Як передати typed дані в MatDialog і отримати типізований результат?
**Signal being tested:** Розуміння MatDialog data/result typing і lifecycle (afterClosed observable).
**What the interviewer expects:** MAT_DIALOG_DATA inject, MatDialogRef generic typing, afterClosed handling включаючи undefined case.
**How to probe deeper:** "Що повертає afterClosed якщо користувач натиснув ESC або клікнув backdrop?"
**Reference answer:** `dialog.open<DialogComponent, DataType, ResultType>(DialogComponent, { data })` — generic типи для compile-time safety. В діалозі: `inject<DataType>(MAT_DIALOG_DATA)`. Закриття: `dialogRef.close(result)` або `[mat-dialog-close]="result"`. `afterClosed()` emits `ResultType | undefined` — undefined при ESC/backdrop. Завжди фільтрувати: `.pipe(filter(r => r !== undefined))`.
**Common mistakes:** Не обробляють undefined від afterClosed. Memory leak — subscribe без takeUntilDestroyed.

### [L3 — Senior] Як реалізувати custom MatFormField control через ControlValueAccessor і MatFormFieldControl?
**Signal being tested:** Розуміння двох окремих interface та їх взаємодії — ControlValueAccessor для forms, MatFormFieldControl для Material UI.
**What the interviewer expects:** Обидва interface, stateChanges Subject, shouldLabelFloat, errorState, setDescribedByIds, injection setup з forwardRef.
**How to probe deeper:** "Для чого потрібен stateChanges Subject і коли його потрібно emit?"
**Reference answer:** Custom control потребує двох interface: 1) `ControlValueAccessor` — connects до Angular forms (writeValue, registerOnChange, registerOnTouched). 2) `MatFormFieldControl<T>` — connects до MatFormField (value, stateChanges, focused, empty, shouldLabelFloat, errorState). `stateChanges: Subject<void>` потрібно emit після КОЖНОЇ зміни будь-якого Material-relevant стану — MatFormField підписується і runs CD. Inject обидва через `useExisting: forwardRef(() => MyControl)` в providers масиві компонента.
**Common mistakes:** Забувають MatFormFieldControl — компонент в формах працює, але Material label/error не функціонують. Не emit stateChanges — Material UI stale.

### [L4 — Staff/Principal] Як спроєктувати enterprise form system з Angular Material що включає dynamic forms, server-side validation, і reusable form components?
**Signal being tested:** Architectural thinking про form system design — composability, reusability, validation strategy, DX для team.
**What the interviewer expects:** FormFactory/Builder service, dynamic schema-driven forms, async validators, ErrorStateMatcher customization, testing strategy.
**How to probe deeper:** "Як би ви вирішили проблему що різні форми мають однакові controls (address, phone) і треба не дублювати validation логіку?"
**Reference answer:** Form system architecture: 1) `FormFactory` service — centralized form builders, testable, consistent validation. 2) Reusable form sub-components з ControlValueAccessor — address form, phone number input як composite CVA components. 3) Shared validators service — `ValidatorsService.phone()`, `ValidatorsService.uniqueEmail(http)`. 4) Async validators з `debounceTime(300)` і `distinctUntilChanged()` для server calls. 5) Custom `ErrorStateMatcher` що показує errors при form submit не тільки при touch — важливо для UX. 6) Testing: `MatInputHarness`, `MatSelectHarness` з Testing Harnesses — stable tests незалежно від Material DOM structure changes.
**Common mistakes:** Дублюють validator логіку між forms. Form validation errors видно тільки після touch — поганий UX при submit без interaction.

## Summary

### Key Points
- MatTable + MatTableDataSource — client-side sort/filter/pagination; для server-side потрібен custom `DataSource<T>` з Observable-based `connect()`
- MatSort і MatPaginator підключаються до dataSource у `ngAfterViewInit`, не ngOnInit — ViewChild недоступний раніше
- MatDialog повертає `MatDialogRef<C, R>` — afterClosed() emits `R | undefined`, де undefined означає ESC/backdrop dismiss
- Custom MatFormField control потребує два interface: `ControlValueAccessor` для Angular Forms і `MatFormFieldControl<T>` для Material UI rendering
- `stateChanges: Subject<void>` в custom control — emit після кожної зміни state, MatFormField підписується і оновлює UI
- MatLegacy* компоненти removed у v18 — мігруйте через `ng update` schematic
- Material Testing Harnesses (`MatTableHarness`, `MatDialogHarness`) — stable тести що не ламаються при Material DOM updates

### Elevator Pitch (2 minutes)
"Angular Material компоненти — це production-ready UI blocks поверх CDK. MatTable з MatTableDataSource вирішує client-side sort/filter/pagination, але для server-side треба custom DataSource з Observable connect(). MatDialog використовує CDK Overlay і provides typed data/result interface — ключова деталь: afterClosed() може emit undefined при ESC/backdrop, тому фільтруйте. Custom form controls потребують двох interface: ControlValueAccessor для Angular Forms і MatFormFieldControl для Material UI — stateChanges Subject це bridge між ними. В enterprise — DialogService wrapper над MatDialog, ServerSideDataSource для HTTP-backed tables, і FormFactory для reusable form builders."
