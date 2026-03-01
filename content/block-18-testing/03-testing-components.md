---
title: "Testing Angular Components"
block: 18
topic: 3
slug: "testing-components"
difficulty: 3
sinceVersion: "2"
tags: ["ComponentFixture", "input", "output", "DOM interaction", "harness", "Material harness", "By.css", "triggerEventHandler"]
relatedTopics: ["unit-testing", "testing-services", "mocking-strategies", "change-detection"]
interviewQuestions:
  - level: "junior"
    question: "Як тестувати @Input() та @Output() компонента?"
    referenceAnswers:
      junior: "@Input тестується через встановлення значення на component instance і detectChanges. @Output — підписка на EventEmitter і перевірка що він emit'ів значення."
      mid: "@Input: `component.inputProp = value; fixture.detectChanges()` — перевіряємо DOM або поведінку. @Output: `let emittedValue: T; component.outputEvent.subscribe(v => emittedValue = v); triggerAction(); expect(emittedValue).toBe(expected)`. Для signal inputs (Angular 17.1+): `fixture.componentRef.setInput('propName', value)` — це правильний API для programmatic input setting."
      senior: "Тонкощі: для @Input() зміна в тесті треба присвоїти НОВЕ значення + detectChanges(). OnPush компоненти: detectChanges() тільки якщо input reference змінився. Signal inputs: обов'язково використовувати fixture.componentRef.setInput() — прямий доступ до signal через componentInstance.inputSignal неможливий. @Output: EventEmitter extends Subject — підписуємось як на Observable. Не забувати що EventEmitter може emit multiple times — перевіряти всі emissions якщо важливо. Required inputs: якщо @Input({ required: true }) — не встановлення ломає компонент."
      staff: "Input/Output testing — це API contract testing між parent і child. Testing philosophy: @Input test = 'якщо parent передає X, component показує Y'. @Output test = 'якщо user робить дію Z, component emit X'. Це boundary testing — тестуємо component's public interface. Для complex scenarios: wrapper component тест (TestHostComponent що використовує component в template) — ближче до реального use case ніж programmatic input setting. Signal inputs і signal outputs (output()) — новий API в v17.3 — тестування через setInput і subscribe на OutputRef. Required signal inputs: тест повинен надати значення, інакше runtime error."
    commonMistakes:
      - "Пряме присвоєння signal input (`component.signalProp = value`) — не працює, потрібен setInput()"
      - "Не підписуються на Output перед дією — emit вже відбувся, значення пропущено"
    relatedQuestions: ["b18t3q2", "b18t1q2"]
  - level: "mid"
    question: "Як тестувати DOM взаємодію через By.css і triggerEventHandler?"
    referenceAnswers:
      junior: "By.css дозволяє знайти елемент в DOM тесту. triggerEventHandler симулює DOM events. nativeElement.click() теж можна."
      mid: "fixture.debugElement.query(By.css('.btn')) — Angular-native DOM query, повертає DebugElement. triggerEventHandler('click', eventObject) — тригерить Angular event listener (не реальний browser event). Відмінність від nativeElement.click(): triggerEventHandler works only on Angular-bound events (через (click)= binding), nativeElement.click() — реальний DOM event (більш realistic). By.directive(DirectiveClass) — знайти по директиві, By.predicate — custom predicate."
      senior: "triggerEventHandler vs nativeElement dispatch: triggerEventHandler = Angular event handler directly без DOM bubble. Це означає: якщо є hostlistener на parent — не тригериться. nativeElement.dispatchEvent(new Event('click')) = реальний DOM event з bubbling — більш accurate для end-to-end scenarios. Вибір: triggerEventHandler для unit тестів (швидше, ізольовано), dispatchEvent для interaction tests (реалістичніше). DebugElement.query повертає перший match, queryAll — всі. Для conditional rendering (@if, *ngIf): після зміни condition + detectChanges() елемент з'являється/зникає — query поверне null якщо не rendered."
      staff: "DOM testing philosophy: тести повинні нагадувати використання компонента користувачем. По можливості: query by text content, aria-label, data-testid — не by CSS class (implementation detail). @testing-library/angular promotes це: getByText(), getByRole(), getByTestId() — more resilient selectors. CSS class/structure based queries ламаються при redesign. Але: DebugElement.query(By.css) — стандарт Angular testing. Trade-off: Angular-native (By.css) vs user-centric (testing-library) — team convention важливіша за правильність. For accessibility testing: By.css with aria-label Submit — combines DOM query with accessibility verification."
    commonMistakes:
      - "triggerEventHandler без detectChanges() після — DOM не оновлений якщо OnPush"
      - "query(By.css) перед detectChanges initial — елемент ще не rendered"
    relatedQuestions: ["b18t3q1", "b18t3q3"]
  - level: "mid"
    question: "Як тестувати Angular Material компоненти через Component Harnesses?"
    referenceAnswers:
      junior: "Angular Material надає спеціальні test harnesses для своїх компонентів — наприклад MatButtonHarness. Вони дозволяють взаємодіяти з компонентами через стабільний API замість CSS selectors."
      mid: "Component harnesses — абстракція над DOM компонента для тестів. HarnessLoader: TestbedHarnessEnvironment.loader(fixture) для component tests, DocumentHarnessEnvironment для broader scope. loader.getHarness(MatButtonHarness) повертає harness instance. harness.click(), harness.getText(), harness.isDisabled() — typed API що не залежить від internal DOM structure."
      senior: "Harnesses вирішують проблему: Material DOM structure змінюється між версіями — тести що query internal DOM ламаються при upgrade. Harness API стабільний через версії. TestbedHarnessEnvironment.loader(fixture) для Angular TestBed context. loader.getAllHarnesses(MatInputHarness) — всі instances. HarnessPredicate для filtering: MatButtonHarness.with({ text: 'Submit' }). Harnesses підтримують async/await — компоненти що animate або lazy-load content. Написання custom harness для власних компонентів: extends ComponentHarness, визначити static hostSelector, методи що queries internal structure."
      staff: "Harness architecture — це testing boundary design. Harness = public API для тестів, аналогічно до public API для production users. Benefits: test code decoupled від DOM structure, upgrade Material versions without breaking tests, readable tests ('click Submit button' not 'click button.mat-button:nth-child(2)'). Creating harnesses for own components: це значна investment але окупається для widely-used shared components. Angular CDK надає HarnessEnvironment base class, можна implement для будь-якого environment (Playwright, Cypress harnesses). Test architecture recommendation: harnesses для Material і CDK components (вже існують), stub або real для власних. Integration test environments: ProtractorHarnessEnvironment (legacy), SeleniumWebDriverHarnessEnvironment, PlaywrightHarnessEnvironment (community)."
    commonMistakes:
      - "Queryять internal DOM Material компонентів (mat-button > .mat-button-base) — ламається при version update"
      - "Не використовують HarnessPredicate для filtering — беруть перший harness, але потрібен конкретний"
    relatedQuestions: ["b18t3q2", "b18t7q1"]
  - level: "senior"
    question: "Як тестувати @defer блоки в Angular компонентах?"
    referenceAnswers:
      junior: "@defer блок завантажується пізніше. В тестах треба якось trigger defer, щоб контент завантажився і можна було перевірити."
      mid: "DeferFixture або TestBed з дозволяємо defer triggers. fixture.deferBlock().triggeredByInteraction() або triggeredByViewport(). За замовчуванням в тестах @defer не triggers — контент в @placeholder. Використовувати getDeferBlocks() для доступу до defer blocks."
      senior: "Angular 17+ testing API для @defer: fixture.getDeferBlocks() повертає масив DeferBlockFixture. deferBlockFixture.render(DeferBlockState.Complete) переводить блок в потрібний стан. States: DeferBlockState.Placeholder (default), Loading, Error, Complete. await deferBlockFixture.render(DeferBlockState.Complete) — рендерить deferred контент. fixture.detectChanges() після. Для тестування loading state: render(DeferBlockState.Loading). Важливо: @defer triggers (viewport, interaction, hover) в unit тестах не спрацьовують автоматично — потрібен explicit render() call."
      staff: "Defer testing strategy залежить від що тестуємо. Unit test: manually control defer state через DeferBlockFixture — ізольовано, fast. Integration test: можна mock IntersectionObserver або simulate click для real trigger. E2E: cypress/playwright native support для scrolling до viewport, clicking — best for real-world defer behavior. Test consideration: кожен defer state (placeholder, loading, complete, error) потребує окремого test — 4x більше tests per defer block. Team decision: тестувати всі defer states vs тільки complete state. Loading/error states зазвичай generic UI — може бути достатньо shared snapshot. Incremental hydration testing (v18+): defer hydration state testing — більш complex, окремий set helpers."
    commonMistakes:
      - "Очікують що @defer автоматично тригериться в тестах — він не тригериться без explicit render()"
      - "Тестують тільки DeferBlockState.Complete і пропускають Loading/Error states"
    relatedQuestions: ["b18t3q3", "b18t1q3"]
  - level: "staff"
    question: "Як тестувати компонент з ng-content (content projection)?"
    referenceAnswers:
      junior: "ng-content проектує контент з parent компонента. Для тестування треба передати контент при створенні компонента в TestBed."
      mid: "Wrapper TestHostComponent: `@Component({ template: '<app-card><p>Projected</p></app-card>' })` — TestBed imports TestHostComponent. fixture = TestBed.createComponent(TestHostComponent). Це дозволяє тестувати що ng-content правильно рендерить projected контент."
      senior: "Підходи до ng-content testing: 1) TestHostComponent (рекомендований) — більш реалістичний, близький до production use. 2) Якщо компонент має named slots (ng-content select='[header]') — TestHost надає контент з відповідним атрибутом. 3) afterRender lifecycle в компоненті що depends on projected content — тестувати через TestHost щоб projected content існував. Перевірка rendered projected content: fixture.debugElement.query(By.css('app-card p')) — знаходить projected p. ContentChildren декоратор: компонент може query projected children — TestHost забезпечує ці children."
      staff: "Content projection testing вимагає TestHostComponent pattern — це integration test між parent і child. Design consideration: якщо компонент активно query projected children (ContentChildren) і reacts to them — це tight coupling між parent and child template structure. Testing це requires test scenarios that cover various projection configs: empty projection, single element, multiple elements, conditional projection. Architectural pattern: якщо компонент занадто складно тестувати з ng-content — можна expose child components via @Input() замість ng-content: більш explicit API, легше mock в unit test. ng-content гарний для pure presentational components (card, dialog shell); @Input для behavior components."
    commonMistakes:
      - "Намагаються тестувати ng-content без TestHostComponent — projected content не існує"
      - "Не тестують named slots (select attribute) — кожен slot може мати різну логіку"
    relatedQuestions: ["b18t3q2", "b18t1q2"]
---

## Core Concept

**English definition:** Component testing in Angular verifies that a component's template renders correctly based on its state, that @Input() bindings update the view, that @Output() events are emitted correctly, and that DOM interactions trigger the expected behavior.

**Пояснення:** Тестування компонентів фокусується на трьох аспектах: 1) Рендеринг — template відображає правильні значення; 2) Inputs/Outputs — публічний API компонента; 3) DOM взаємодія — кліки, введення тексту викликають очікувану поведінку. ComponentFixture надає доступ до всього трьох рівнів.

**Яку проблему вирішує:**
- **Template correctness:** Перевірити що @if, @for і property bindings рендерять правильно
- **Input/Output contract:** Тестувати публічний API компонента незалежно від parent
- **Event handling:** Перевірити що (click), (input) handlers викликають правильну логіку
- **Material/CDK components:** Component harnesses для стабільних тестів без DOM coupling

**Як працює під капотом:**

```typescript
// Три рівні доступу в component tests:
const fixture = TestBed.createComponent(MyComponent);

// 1. Component instance — стан і методи
const component = fixture.componentInstance;
component.title = 'Test Title';
fixture.detectChanges();

// 2. DebugElement — Angular-aware queries
const el = fixture.debugElement.query(By.css('[data-testid="title"]'));
el.triggerEventHandler('click', { target: el.nativeElement });

// 3. NativeElement — raw DOM
const text = fixture.nativeElement.querySelector('h1').textContent;
```

**Trade-offs та обмеження:**
- Signal inputs потребують `fixture.componentRef.setInput()` — пряме присвоєння не працює
- `triggerEventHandler` не симулює реальний browser event bubble
- `ComponentHarnesses` потребують async/await — трохи складніший API
- @defer блоки в тестах не тригеряться автоматично — потрібен explicit render()

**Версійність:**
- Angular 2: ComponentFixture, DebugElement, By.css
- Angular 9: TestBed автоматично cleanup після кожного тесту
- Angular 14+: standalone component в imports масиві configureTestingModule
- Angular 15+: Angular Material Component Harnesses stable
- Angular 17+: @defer testing через getDeferBlocks() / DeferBlockFixture
- Angular 17.1+: signal input setInput() API офіційний

## Deep Details

### Edge Cases

**OnPush з async pipe — detectChanges timing:**
```typescript
// OnPush component з async pipe
@Component({
  template: `<div>{{ data$ | async }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AsyncComponent {
  data$ = inject(DataService).getData();
}

// Тест: async pipe ticks CD automatically via markForCheck
it('should render async data', fakeAsync(() => {
  dataServiceSpy.getData.and.returnValue(of('test-value'));
  fixture.detectChanges(); // initial render
  tick(); // let async pipe emit
  fixture.detectChanges(); // update DOM after async
  expect(nativeEl.textContent).toContain('test-value');
}));
```

**Signal Input vs @Input testing:**
```typescript
// Signal input (Angular 17.1+)
@Component({})
class ModernComponent {
  name = input<string>(''); // signal input
  age = input.required<number>(); // required signal input
}

// ✅ Correct: use setInput()
fixture.componentRef.setInput('name', 'Alice');
fixture.componentRef.setInput('age', 30);
fixture.detectChanges();

// ❌ Wrong: can't assign to signal directly
// component.name = signal('Alice'); // TypeError: Assignment to constant variable
```

**@for trackBy в тестах:**
```typescript
it('should render list items', () => {
  component.items = [
    { id: 1, label: 'First' },
    { id: 2, label: 'Second' },
  ];
  fixture.detectChanges();

  const items = fixture.debugElement.queryAll(By.css('[data-testid="item"]'));
  expect(items.length).toBe(2);
  expect(items[0].nativeElement.textContent).toContain('First');
});
```

### Junior vs Senior Understanding

**Junior** знає: query by CSS, nativeElement.click(), set @Input, subscribe to @Output.

**Senior** розуміє ієрархію підходів: TestHostComponent для ng-content/integration scenarios, harnesses для Material, DeferBlockFixture для @defer, setInput() для signal inputs. Senior вибирає правильний рівень abstraction і розуміє trade-offs між isolation і realism.

```typescript
// Senior: TestHostComponent pattern для реалістичного testing
@Component({
  template: `
    <app-card [title]="cardTitle" (action)="onAction($event)">
      <ng-template #content>
        <p>{{ contentText }}</p>
      </ng-template>
    </app-card>
  `,
  standalone: true,
  imports: [CardComponent],
})
class TestHostComponent {
  cardTitle = 'Test Card';
  contentText = 'Test Content';
  emittedAction: string | undefined;
  onAction(action: string) { this.emittedAction = action; }
}

// Тест через TestHost — реалістично як в production
describe('CardComponent via TestHost', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent], // imports test host which imports CardComponent
    }).compileComponents();
    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should project content', () => {
    const content = hostFixture.nativeElement.querySelector('p');
    expect(content.textContent).toContain('Test Content');
  });
});
```

### Deprecation & Migration Path

- Angular 16: `DeferBlockFixture` API для @defer testing
- Angular 17.1+: `fixture.componentRef.setInput()` — офіційний API для programmatic input setting
- **Deprecated:** `NO_ERRORS_SCHEMA` pattern у favor of stub components або real imports
- **Deprecated:** `async()` test wrapper → `waitForAsync()`
- ComponentHarnesses: стабільні з Angular Material 15+ — повністю замінюють DOM-based Material testing

### Connections to Other Concepts

- **Unit Testing (Topic 1):** TestBed, fixture, detectChanges — base APIs
- **Mocking Strategies (Topic 6):** stub components для shallow testing
- **Change Detection:** detectChanges trigger patterns, OnPush implications
- **@defer blocks (Block 16):** DeferBlockFixture API для lazy content testing

## Examples

### Basic Usage

```typescript
// button-toggle.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ButtonToggleComponent } from './button-toggle.component';

describe('ButtonToggleComponent', () => {
  let component: ButtonToggleComponent;
  let fixture: ComponentFixture<ButtonToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render label from @Input', () => {
    fixture.componentRef.setInput('label', 'Click Me'); // signal input
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').textContent.trim()).toBe('Click Me');
  });

  it('should emit toggled event on click', () => {
    let emitted: boolean | undefined;
    component.toggled.subscribe((v: boolean) => emitted = v);

    fixture.debugElement.query(By.css('button')).triggerEventHandler('click', null);

    expect(emitted).toBe(true);
  });

  it('should disable button when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
  });
});
```

### Production Scenario

```typescript
// data-table.component.spec.ts — harness + defer + inputs
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSortHarness } from '@angular/material/sort/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { DeferBlockState } from '@angular/core/testing';
import { DataTableComponent } from './data-table.component';

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    fixture.detectChanges();
  });

  it('should render data rows', async () => {
    fixture.componentRef.setInput('data', [
      { id: 1, name: 'Alice', role: 'Admin' },
      { id: 2, name: 'Bob', role: 'User' },
    ]);
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();

    expect(rows.length).toBe(2);
    const cells = await rows[0].getCells({ columnName: 'name' });
    expect(await cells[0].getText()).toBe('Alice');
  });

  it('should sort by column on header click', async () => {
    fixture.componentRef.setInput('data', [
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Alice' },
    ]);
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const sort = await loader.getHarness(MatSortHarness);
    const nameHeader = await sort.getSortHeaders({ label: 'Name' });
    await nameHeader[0].click();

    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();
    const firstCell = await (await rows[0].getCells({ columnName: 'name' }))[0].getText();
    expect(firstCell).toBe('Alice');
  });

  it('should show loading state in defer block', async () => {
    const deferBlocks = await fixture.getDeferBlocks();
    await deferBlocks[0].render(DeferBlockState.Loading);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="loading-spinner"]')).toBeTruthy();
  });

  it('should render deferred content', async () => {
    const deferBlocks = await fixture.getDeferBlocks();
    await deferBlocks[0].render(DeferBlockState.Complete);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="table-content"]')).toBeTruthy();
  });
});
```

### Anti-Example

```typescript
// ❌ WRONG: Querying Material internal DOM — breaks on version update
it('should show disabled button', () => {
  component.isDisabled = true;
  fixture.detectChanges();
  // Mat button internal DOM structure can change between Material versions
  const btn = fixture.nativeElement.querySelector('.mat-mdc-button-base');
  expect(btn.hasAttribute('disabled')).toBe(true);
});

// ✅ CORRECT: Use harness API
it('should show disabled button', async () => {
  fixture.componentRef.setInput('isDisabled', true);
  fixture.detectChanges();
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const button = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
  expect(await button.isDisabled()).toBe(true);
});

// ❌ WRONG: Testing only implementation, not behavior
it('should call updateMethod on click', () => {
  spyOn(component, 'updateMethod');
  fixture.nativeElement.querySelector('button').click();
  expect(component.updateMethod).toHaveBeenCalled(); // implementation test
});

// ✅ CORRECT: Test what user sees
it('should show updated status after click', () => {
  fixture.nativeElement.querySelector('[data-testid="update-btn"]').click();
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('[data-testid="status"]').textContent)
    .toContain('Updated');
});
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Querying Material internal DOM (`.mat-mdc-*` classes) | Breaks on Material version updates | Component Harnesses (`MatButtonHarness`, etc.) |
| `component.signalInput = value` пряме присвоєння | Signal inputs read-only — TypeError | `fixture.componentRef.setInput('name', value)` |
| Testing implementation (spy on private methods) | Тести ламаються при refactoring без поведінкових змін | Тестувати DOM output і emitted events |
| Відсутність `detectChanges()` після state change | DOM відображає старий стан | Завжди `detectChanges()` після input/state changes |
| `NO_ERRORS_SCHEMA` для template з Material components | Material components rendered as empty elements — no real testing | Import реальні або stub Material components |

## Interview Block

### [L1 — Warm-up] Як тестувати @Input() та @Output() компонента?
**Signal being tested:** Знання публічного API тестування компонентів і різниці між class і signal inputs
**What the interviewer expects:** @Input: set value + detectChanges; @Output: subscribe then trigger; signal inputs: setInput()
**How to probe deeper:** "Яка різниця між встановленням @Input і signal input в тесті?"
**Reference answer:** @Input: `component.inputProp = value; fixture.detectChanges()`. Signal inputs: `fixture.componentRef.setInput('propName', value); fixture.detectChanges()` — пряме присвоєння не працює. @Output: підписатись на EventEmitter до тригерування дії, перевірити emitted value.
**Common mistakes:** Пряме присвоєння signal input; не підписуються на Output перед trigger

### [L2 — Mid] Як тестувати DOM взаємодію через By.css і triggerEventHandler?
**Signal being tested:** Розуміння різних рівнів DOM interaction і вибір відповідного для context
**What the interviewer expects:** By.css vs By.directive, triggerEventHandler vs dispatchEvent, detectChanges після interaction
**How to probe deeper:** "В чому різниця між triggerEventHandler('click') і nativeElement.click()?"
**Reference answer:** By.css повертає DebugElement. triggerEventHandler('click', eventObj) — тригерить Angular event binding напряму без DOM bubble. nativeElement.dispatchEvent(new Event('click')) — реальний DOM event з bubbling. triggerEventHandler для unit isolation; dispatchEvent для реалістичніших integration tests.
**Common mistakes:** triggerEventHandler без detectChanges(); query до initial detectChanges()

### [L3 — Senior] Як тестувати Angular Material компоненти через Component Harnesses?
**Signal being tested:** Знання harness pattern і розуміння чому це краще ніж DOM queries
**What the interviewer expects:** TestbedHarnessEnvironment.loader(), getHarness(), HarnessPredicate.with(), async/await
**How to probe deeper:** "Як написати власний Component Harness для власного компонента?"
**Reference answer:** TestbedHarnessEnvironment.loader(fixture) → loader.getHarness(MatButtonHarness). Harness methods: click(), getText(), isDisabled() — stable API незалежно від Material DOM structure. HarnessPredicate.with({ text: 'Submit' }) для specific instance. Custom harness: extends ComponentHarness з static hostSelector.
**Common mistakes:** Query internal `.mat-mdc-*` classes — breaks при Material updates; не використовують HarnessPredicate

### [L4 — Staff/Principal] Як тестувати компонент з ng-content і @defer блоками?
**Signal being tested:** Знання advanced testing patterns для complex Angular features
**What the interviewer expects:** TestHostComponent для ng-content; getDeferBlocks() + DeferBlockFixture + DeferBlockState для @defer
**How to probe deeper:** "Як тестувати всі стани @defer (placeholder, loading, error, complete)?"
**Reference answer:** ng-content: TestHostComponent що використовує component в своєму template — projected content існує як в production. @defer: fixture.getDeferBlocks() → deferBlockFixture.render(DeferBlockState.Complete/Loading/Error). Кожен state потребує окремого тесту. @defer не тригериться автоматично в unit tests.
**Common mistakes:** ng-content тест без TestHostComponent; очікують automatic defer trigger в unit tests

## Summary

### Key Points
- `@Input()` тест: `component.prop = value; fixture.detectChanges()`. Signal input: `fixture.componentRef.setInput('name', value)`
- `@Output()` тест: підписатись до action, trigger action, перевірити emitted value
- `By.css` / `By.directive` — Angular-native queries; `triggerEventHandler` — без DOM bubble
- Component Harnesses — стабільний API для Material/CDK testing без DOM coupling
- `TestHostComponent` pattern — реалістичне тестування ng-content і complex bindings
- `getDeferBlocks()` + `DeferBlockFixture.render(DeferBlockState.X)` для @defer тестів
- Prefer behavior testing (DOM output) над implementation testing (method call counts)

### Elevator Pitch (2 minutes)
"Тестування компонентів в Angular — три аспекти. Inputs/Outputs: @Input встановлюється через component instance або setInput() для signal inputs + detectChanges(), @Output — підписка до trigger + перевірка emitted value. DOM interaction: fixture.debugElement.query(By.css()) + triggerEventHandler('event', payload) для Angular event bindings, або nativeElement.dispatchEvent() для реальних DOM events з bubbling. Material/CDK: Component Harnesses через TestbedHarnessEnvironment — stable API що не ламається при version updates. @defer блоки: getDeferBlocks() + render(DeferBlockState.Complete) — explicit контроль стану. ng-content: TestHostComponent що містить компонент в своєму template — єдиний спосіб мати real projected content. Ключове правило: тестувати через user-visible behavior (DOM text, disabled state) а не через implementation (spy on method call)."
