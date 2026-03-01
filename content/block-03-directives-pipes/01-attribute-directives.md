---
title: "Attribute Directives (Custom)"
block: 3
topic: 1
slug: "attribute-directives"
difficulty: 3
sinceVersion: "2"
tags: ["Directive", "attribute-directive", "HostBinding", "HostListener", "ElementRef", "Renderer2"]
relatedTopics: ["built-in-directives", "structural-directives", "dependency-injection", "testing"]
interviewQuestions:
  - level: "junior"
    question: "Що таке attribute directive і як її створити?"
    referenceAnswers:
      junior: "Attribute directive — це клас з @Directive decorator що змінює зовнішній вигляд або поведінку елемента. Вона застосовується як HTML атрибут: <div appHighlight>. Створюється через ng generate directive."
      mid: "Attribute directive застосовується до host element як атрибут і може: читати/змінювати властивості елемента через @HostBinding, реагувати на DOM events через @HostListener, або отримувати access до нативного елемента через ElementRef. На відміну від structural directive не маніпулює DOM структурою — тільки behavior/appearance. З Angular 14+: директиви можуть бути standalone (не потребують NgModule)."
      senior: "Attribute directive — це TypeScript клас з @Directive({ selector: '[appName]' }) що Angular instantiates для кожного matching element. Під капотом: Angular compiler знаходить всі matching elements в template і генерує instructions для directive instantiation (ɵɵdirectiveDef). Директива отримує injected tokens через DI — той самий injector що і компонент на тому ж елементі. @HostBinding компілюється в property binding instructions, @HostListener — в event listener registration. З Angular 15+: host property в @Directive метаданих як альтернатива декораторам — {host: {'[class.active]': 'isActive', '(click)': 'onClick()'}}. Standalone directive: standalone: true + imports: [] для залежностей."
      staff: "Attribute directive — fundamental building block Angular abstraction layer. Архітектурно: directive дає можливість composition over inheritance — поведінку можна compose з кількох директив на одному елементі. В Design System: behavior directives (appTooltip, appRipple) відокремлюють behavior від visual component — хороша separation of concerns. Директиви можуть мати власний DI scope що дозволяє coordination між директивами на одному елементі (inject sibling directive). Performance: кожна directive instance — JavaScript об'єкт з lifecycle, занадто багато директив на елементі збільшує memory footprint. Альтернатива для pure DOM behavior: CSS :hover, :focus-within, data-* attributes — вони не мають JS overhead."
    commonMistakes:
      - "Плутають attribute directive з component (component — це directive з template)"
      - "Безпосередньо маніпулюють DOM через ElementRef.nativeElement замість Renderer2"
    relatedQuestions: ["b3t1q2", "b3t1q3"]
  - level: "mid"
    question: "Чому потрібно використовувати Renderer2 замість прямого маніпулювання DOM через ElementRef.nativeElement?"
    referenceAnswers:
      junior: "Renderer2 — це Angular-абстракція для роботи з DOM. ElementRef.nativeElement дає прямий доступ до DOM елемента, але це не рекомендовано."
      mid: "ElementRef.nativeElement дає прямий доступ до нативного DOM елемента — це працює в браузері, але не в Server-Side Rendering (SSR), Web Workers, або Electron де нативного DOM немає. Renderer2 — це абстракція що делегує до платформо-специфічної реалізації. На сервері (Angular Universal) Renderer2 ops перетворюються на server-side DOM operations. Крім того: прямий DOM доступ може порушувати Content Security Policy (CSP)."
      senior: "Renderer2 — це абстракція rendering layer. Injected реалізація залежить від платформи: в браузері — DomRenderer2 що виконує нативні DOM операції, в SSR — ServerRenderer2 що модифікує virtual DOM, в тестах — MockRenderer для перевірки викликів без реального DOM. Прямий ElementRef.nativeElement доступ: 1) ламає SSR — document/window не існують на сервері, 2) обходить Angular's sanitization для innerHTML, 3) ускладнює тестування (потрібен реальний DOM). Renderer2 методи: createElement, appendChild, setAttribute, addClass, removeClass, setStyle, listen. listen() повертає cleanup function — важливо для уникнення memory leaks. З Angular Signals і host bindings — більшість DOM маніпуляцій можна замінити declarative bindings."
      staff: "Renderer2 vs ElementRef.nativeElement — це платформо-агностичність vs зручність. Для enterprise: SSR все частіше використовується для SEO і First Contentful Paint — директиви що використовують ElementRef безпосередньо ламаються в SSR контексті. Стратегія: в shared library — завжди Renderer2, в app-specific code — прийнятний прямий доступ якщо SSR не планується. Важливий нюанс: Angular 16+ з hydration потребує ще більш обережного DOM маніпулювання — неузгоджені зміни між SSR і клієнтом ламають hydration. Альтернативний підхід: замість Renderer2 в директиві — CSS custom properties через host bindings, що взагалі уникає JS DOM manipulation. З Web Components (Angular Elements): директиви з nativeElement можуть конфліктувати з Shadow DOM encapsulation."
    commonMistakes:
      - "Не розуміють навіщо Renderer2 якщо ElementRef 'просто працює'"
      - "Думають що Renderer2 тільки для SSR — не знають про CSP і тестування переваги"
    relatedQuestions: ["b3t1q1", "b3t1q4"]
  - level: "mid"
    question: "Що таке exportAs і коли він потрібний?"
    referenceAnswers:
      junior: "exportAs — це поле в @Directive metadata що дозволяє отримати reference на директиву в template через template reference variable."
      mid: "exportAs дозволяє template reference variable посилатись на instance директиви: @Directive({ selector: '[appMenu]', exportAs: 'appMenu' }) — тоді в template: <div appMenu #menu='appMenu'>. Через #menu можна викликати публічні методи директиви: (click)='menu.open()'. Приклад з Angular Material: MatMenuTrigger має exportAs: 'matMenuTrigger', MatFormField — 'matFormField'."
      senior: "exportAs — mechanism для template-to-directive communication. Коли Angular зустрічає #ref='exportAsName', він шукає серед директив на елементі ту що має відповідний exportAs і записує її instance в template variable. Якщо exportAs не вказано — #ref посилається на сам елемент (HTMLElement або ComponentRef для компонентів). Multiple exports: один елемент може мати кілька директив з різними exportAs. Практичний use case: Tooltip directive з exportAs: 'tooltip' — батьківський компонент може програмно викликати tooltip.show()/hide(). Тестування: в тестах через fixture.debugElement.query(By.directive(X)).injector.get(X) — отримуємо той самий instance. Важливо: публічні методи через exportAs — це public API директиви, треба treat їх як такий."
      staff: "exportAs — це точка extensibility для template-level component composition. В Design System: FormField component з exportAs: 'formField' дозволяє консюмерам program access до validation state. Архітектурно: exportAs створює tight coupling між template автором і директивою — будь-яка зміна публічних методів — breaking change. Альтернативи: @Output EventEmitter для events, @Input для конфігурації, ContentChildren для child coordination. exportAs доцільний коли: imperative API неминучий (focus(), scrollTo(), triggerAnimation()), або коли директива — state container що консюмери повинні читати. В component library з SEMVER: exportAs методи повинні бути явно задокументовані і versioned як part of public API."
    commonMistakes:
      - "Не знають що #ref без exportAs посилається на HTMLElement, не на directive"
      - "Плутають exportAs (template access) з providers (DI access)"
    relatedQuestions: ["b3t1q2", "b3t1q2"]
  - level: "senior"
    question: "Яка різниця між structural і attribute directive? Наведи приклади коли обирати кожну."
    referenceAnswers:
      junior: "Structural directive змінює структуру DOM (додає/видаляє елементи), attribute directive змінює appearance або behavior елемента що вже є в DOM."
      mid: "Structural directive позначається * синтаксисом (*ngIf, *ngFor) і маніпулює ViewContainerRef — може додавати/видаляти views. Attribute directive застосовується як атрибут без * і модифікує host element. Вибір: якщо потрібно conditionally render або repeat — structural. Якщо потрібно додати behavior або стиль до існуючого елемента — attribute."
      senior: "Structural directive отримує TemplateRef і ViewContainerRef як constructor dependencies — це її defining characteristic. Attribute directive не має доступу до TemplateRef. Structural directive може: клонувати template (create multiple views), вставляти views з context, видаляти views. Attribute directive може: binding до host properties через @HostBinding, listen до host events через @HostListener, inject siblings (inject(NgModel)). Важливий нюанс: structural directive з * синтаксисом — syntactic sugar для ng-template wrapping. Можна мати обидва типи на одному елементі, але не два structural directives (компілятор видасть помилку). Use case вибору: tooltip на існуючому button — attribute. Conditional rendering складного view — structural або @if."
      staff: "Structural vs attribute — це різні abstraction levels. Structural directive — DOM tree manipulation, attribute — behavior augmentation. Архітектурне правило: надавати перевагу вбудованому @if/@for/@switch перед custom structural directives для стандартних patterns. Custom structural directives виправдані для: reusable loading/error patterns, permission-based rendering з complex logic, lazy template instantiation з context injection. В performance-critical scenarios: structural directive що frequently creates/destroys views (e.g., carousel slides) потребує careful memory management — explicit destroyRef або takeUntilDestroyed. Для micro-frontends: structural directives що inject services можуть crossing module boundaries — потребують explicit DI configuration."
    commonMistakes:
      - "Намагаються використовувати два structural directives на одному елементі"
      - "Не знають що ng-container дозволяє застосовувати structural directive без зайвого DOM елемента"
    relatedQuestions: ["b3t1q3", "b3t1q1"]
  - level: "staff"
    question: "Як тестувати attribute directive ізольовано? Які підводні камені?"
    referenceAnswers:
      junior: "Directive можна тестувати через TestBed, створюючи host компонент в тесті."
      mid: "Для тестування directive: створити test host component з directive застосованою в template. TestBed.configureTestingModule з declarations або imports (для standalone). fixture.debugElement.query(By.directive(MyDirective)).injector.get(MyDirective) — отримати instance. Тестуємо: що directive змінює host element correctly, що @HostListener handlers реагують на events."
      senior: "Canonical підхід: TestHostComponent з directive в template. Але є нюанси: 1) Renderer2 тести — в TestBed DEFAULT Renderer2 це DOM renderer, щоб тестувати без DOM — inject MockRenderer або spy on renderer methods. 2) ElementRef.nativeElement — в TestBed є реальний DOM (jsdom), можна перевіряти нативні properties. 3) @HostListener тести: triggerEventHandler('click', {}) на debugElement. 4) Input/Output directives: fixture.debugElement.query(By.directive(X)) потім manipulate inputs і detectChanges(). Ізольоване тестування без DOM: SpectatorDirective (Spectator library) або Angular CDK Testing utilities. Snapshot тестування директив: перевірити що DOM state після directive application відповідає snapshot."
      staff: "Testing strategy для directive — це частина тестової піраміди. Unit tests для directive logic, integration tests для directive + component interaction. Підводні камені: 1) TestBed overhead — кожен `TestBed.configureTestingModule` compile templates — для simple directive tests це expensive. Альтернатива: Spectator з менш verbose API. 2) Renderer2 mocking — в production TestBed Renderer2 може бути DomRenderer, не MockRenderer — тести що залежать від конкретних renderer calls можуть бути flaky. 3) ChangeDetection в тестах: потрібен explicit fixture.detectChanges() після input changes — забули → тест fails or misleads. 4) Directive exportAs в тестах: fixture.debugElement.query(By.directive(X)).references['exportAsName'] — отримати exported reference. 5) Для SSR-safe directive: E2E тест що запускає directive в SSR context — unit tests цього не перевіряють. Рекомендація: директиви з нетривіальною логікою повинні мати interface з бізнес-логікою (injectable service) і тонкий directive wrapper — тоді service тестується ізольовано."
    commonMistakes:
      - "Не знають як отримати directive instance в тесті"
      - "Тестують тільки що DOM змінився — не тестують що directive правильно cleanup при destroy"
    relatedQuestions: ["b3t1q1", "b3t1q2"]
---

## Core Concept

**English definition:** An attribute directive is a class decorated with @Directive that modifies the behavior, appearance, or DOM properties of the element it's applied to, without changing the DOM structure. It acts as a reusable behavior mixin applied via an HTML attribute.

**Пояснення:** Attribute directive — це "поведінковий плагін" для HTML елемента. Замість створення нового компонента для кожного pattern поведінки (hover ефект, tooltip, input masking, auto-focus) — пишемо директиву що застосовується атрибутом до будь-якого елемента. Composition: кілька директив можна combine на одному елементі.

**Яку проблему вирішує:** Повторювана DOM поведінка без дублювання коду. Наприклад: ripple ефект на кнопках, tooltip на будь-якому елементі, auto-resize для textarea, copy-to-clipboard для span — все це directive без дублювання логіки в кожному компоненті.

**Як працює під капотом:** Angular compiler знаходить елементи що відповідають директив selector і додає directive instance до того ж injector що і host component/element. Directive отримує access до host через injection: ElementRef (нативний елемент), Renderer2 (абстрактний rendering), HostBinding/HostListener — shortcuts для host property/event binding. Під капотом @HostBinding компілюється в property binding instructions на host element, @HostListener — в addEventListener call через Renderer2. Angular керує lifecycle директиви разом з host елементом.

**Trade-offs та обмеження:** Directive не має template — тільки host manipulation. Directive не може project content. Занадто багато директив на елементі збільшує memory і instantiation time. @HostListener для high-frequency events (mousemove, scroll) може бути bottleneck без explicit throttle/debounce.

**Версійність:** Attribute directives — з Angular 2. @HostBinding/@HostListener декоратори — з Angular 2, alternate host metadata property — завжди існувала. Standalone directives — Angular 14+. Signal-based inputs (input() замість @Input) — Angular 17+. DestroyRef inject для cleanup — Angular 16+.

---

## Deep Details

### Edge Cases

**Inject sibling directive:** Директива може inject іншу директиву на тому самому елементі:
```typescript
@Directive({ selector: '[appValidation]' })
export class ValidationDirective {
  private ngModel = inject(NgModel, { optional: true });
  // Координація з NgModel якщо він є
}
```

**Directive на компоненті:** Директиву можна застосувати до custom component — вона отримає ElementRef на host element компонента.

**Self-closing elements:** `<input appDirective>` — директива на void element, ElementRef.nativeElement — HTMLInputElement.

**Multiple instances:** Якщо директива застосована в *ngFor — кожен iteration має власний instance директиви.

**HostListener і event propagation:** `@HostListener('click', ['$event']) onClick(e: MouseEvent)` — якщо викликати e.stopPropagation() — event не дійде до батьківських елементів.

### Junior vs Senior Understanding

**Junior** знає: застосовується атрибутом, @HostBinding для properties, @HostListener для events, ElementRef для DOM access.

**Senior** розуміє глибше:

1. **Renderer2 vs nativeElement:** Renderer2 — платформо-агностичний, необхідний для SSR. nativeElement — зручний, але прив'язує до браузера.

2. **@HostBinding compilation:** `@HostBinding('class.active') isActive = false;` компілюється в те саме що `[class.active]='isActive'` в template. Альтернатива через host metadata: `{ host: { '[class.active]': 'isActive' } }` — ефективніша бо уникає decorator overhead.

3. **DI coordination між директивами:** inject(SiblingDirective, { optional: true }) — координація без tight coupling.

4. **DestroyRef для cleanup:**
```typescript
@Directive({ selector: '[appScroll]', standalone: true })
export class ScrollDirective {
  constructor() {
    const destroyRef = inject(DestroyRef);
    const renderer = inject(Renderer2);
    const el = inject(ElementRef);

    const unlisten = renderer.listen(el.nativeElement, 'scroll', this.onScroll);
    destroyRef.onDestroy(unlisten); // cleanup без ngOnDestroy
  }
}
```

### Deprecation & Migration Path

**@HostBinding/@HostListener декоратори:** Не deprecated, але Angular team рекомендує `host` property в metadata як більш centralized і visible підхід:
```typescript
// Old (still valid)
@HostBinding('class.active') isActive = false;
@HostListener('click') onClick() { }

// Preferred (Angular style guide update 2024)
@Directive({
  host: {
    '[class.active]': 'isActive',
    '(click)': 'onClick()',
  }
})
```

**Standalone:** з Angular 14+ всі нові директиви мають бути standalone. NgModule-based directives — legacy, але не deprecated.

### Connections to Other Concepts

- **DI Hierarchy (b5):** Директива в тому самому injector що і компонент — може inject все що доступне компоненту.
- **Change Detection (b4t1):** @HostBinding values перевіряються під час CD cycle — OnPush не захищає від зайвих CD якщо directive не оптимізована.
- **Renderer2 і SSR (b12):** SSR-безпечна директива завжди використовує Renderer2, ніколи не звертається до window/document без isPlatformBrowser guard.
- **Testing (b15):** Directive testing через test host component — стандартна практика.

---

## Examples

### Basic Usage

```typescript
// highlight.directive.ts — class атрибутна директива
import { Directive, input, HostListener, inject, Renderer2, ElementRef } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
  host: {
    // host metadata замість @HostBinding декоратора
    '[style.backgroundColor]': 'currentColor',
    '[style.cursor]': '"pointer"',
  }
})
export class HighlightDirective {
  // Signal-based input (Angular 17+)
  appHighlight = input<string>('yellow');
  defaultColor = input<string>('transparent');

  protected currentColor = this.defaultColor();

  private renderer = inject(Renderer2);
  private el = inject(ElementRef);

  @HostListener('mouseenter')
  onMouseEnter() {
    this.currentColor = this.appHighlight();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.currentColor = this.defaultColor();
  }
}

// Використання
// <p appHighlight="lightblue" defaultColor="white">Hover me</p>
```

### Production Scenario

```typescript
// copy-to-clipboard.directive.ts — production-ready директива
import {
  Directive, input, output, inject,
  Renderer2, ElementRef, DestroyRef, signal
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

@Directive({
  selector: '[appCopyToClipboard]',
  standalone: true,
  exportAs: 'appCopy',
  host: {
    '[attr.aria-label]': 'ariaLabel()',
    '[class.copied]': 'justCopied()',
    '(click)': 'copy()',
    '(keydown.enter)': 'copy()',
  }
})
export class CopyToClipboardDirective {
  appCopyToClipboard = input.required<string>(); // текст для копіювання
  copied = output<void>();
  copyError = output<Error>();

  justCopied = signal(false);

  private clipboard = inject(Clipboard);
  private destroyRef = inject(DestroyRef);

  protected ariaLabel = () =>
    this.justCopied() ? 'Скопійовано!' : 'Копіювати';

  copy(): void {
    const success = this.clipboard.copy(this.appCopyToClipboard());

    if (success) {
      this.justCopied.set(true);
      this.copied.emit();

      const timeout = setTimeout(() => this.justCopied.set(false), 2000);
      // Cleanup якщо директива destroy раніше ніж timeout
      this.destroyRef.onDestroy(() => clearTimeout(timeout));
    } else {
      this.copyError.emit(new Error('Clipboard API unavailable'));
    }
  }
}

// Використання з exportAs
// <button [appCopyToClipboard]="codeSnippet" #copyBtn="appCopy">
//   {{ copyBtn.justCopied() ? '✓ Copied' : 'Copy' }}
// </button>
```

### Anti-Example

```typescript
// ❌ НЕПРАВИЛЬНА directive — типові помилки
@Directive({ selector: '[appBad]' })
export class BadDirective implements OnDestroy {
  private el = inject(ElementRef);
  private subscription: Subscription | undefined;

  constructor() {
    // ❌ Прямий DOM доступ — ламається в SSR
    this.el.nativeElement.style.color = 'red';

    // ❌ document/window без платформ guard — ламається в SSR
    this.el.nativeElement.addEventListener('click', () => {
      document.body.classList.add('modal-open');
    });

    // ❌ Ручна підписка без cleanup через DestroyRef
    this.subscription = fromEvent(this.el.nativeElement, 'scroll')
      .subscribe(this.onScroll);
  }

  ngOnDestroy() {
    // ❌ Забули відписатись — memory leak якщо це хтось упустить
    // this.subscription?.unsubscribe();
  }
}

// ✅ ПРАВИЛЬНА версія
@Directive({ selector: '[appGood]', standalone: true })
export class GoodDirective {
  private renderer = inject(Renderer2);    // ✅ SSR-safe
  private el = inject(ElementRef);
  private destroyRef = inject(DestroyRef); // ✅ auto cleanup

  constructor() {
    // ✅ Renderer2 замість прямого DOM
    this.renderer.setStyle(this.el.nativeElement, 'color', 'red');

    // ✅ Cleanup через DestroyRef
    const unlisten = this.renderer.listen(this.el.nativeElement, 'click', () => {
      // Логіка без прямого document доступу
    });
    this.destroyRef.onDestroy(unlisten);

    // ✅ takeUntilDestroyed для RxJS
    fromEvent(this.el.nativeElement, 'scroll')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(this.onScroll);
  }
}
```

---

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `ElementRef.nativeElement.style.x = y` | Ламається в SSR, обходить Angular's sanitization, не тестується без DOM | `Renderer2.setStyle()` або `@HostBinding('[style.x]')` |
| `window.addEventListener` без cleanup | Memory leak — listener залишається після destroy directive | `renderer.listen()` що повертає cleanup function + `DestroyRef.onDestroy()` |
| `@HostListener` для high-frequency events без throttle | `scroll`, `mousemove`, `input` events — десятки разів за секунду, кожен запускає CD | `fromEvent().pipe(throttleTime(16))` з RxJS або requestAnimationFrame |
| Inject `ElementRef` для property reads | Тісна прив'язка до DOM API, ламає абстракцію | `@HostBinding` + computed properties для state |
| Directive з занадто широким selector | `[class]` або `[style]` — directive applies everywhere | Специфічний selector: `[appHighlight]`, або `button[appRipple]` |

---

## Interview Block

### [L1 — Warm-up] Що таке attribute directive і як її написати мінімально?

**Signal being tested:** Базове розуміння angular directive concept і вміння відрізнити від component.

**What the interviewer expects:** Кандидат має описати @Directive selector, @HostBinding/@HostListener або host metadata, основний use case.

**How to probe deeper:** "Яку різницю між attribute і structural directive ти бачиш?"

**Reference answer:** Attribute directive — це @Directive клас з selector як атрибут `[appName]`. Вона модифікує host element через @HostBinding (properties), @HostListener (events), inject(ElementRef) або inject(Renderer2). Standalone: standalone: true. Застосовується: `<div appHighlight>`.

**Common mistakes:** Кажуть що directive == component. Не знають що @Directive без template — це attribute directive.

---

### [L2 — Mid] Чому Renderer2, а не ElementRef.nativeElement? Покажи конкретний приклад де прямий доступ ламається.

**Signal being tested:** Чи розуміє кандидат Angular universal rendering і наслідки прямого DOM маніпулювання.

**What the interviewer expects:** Конкретні scenarios: SSR, Web Workers, тестування. Розуміння що Renderer2 — це abstraction layer.

**How to probe deeper:** "Як Renderer2 listen() відрізняється від addEventListener? Що повертає Renderer2.listen()?"

**Reference answer:** `el.nativeElement.style.color = 'red'` — в браузері працює, в SSR (Angular Universal/server) нативного DOM немає, код кине помилку. Renderer2.setStyle() — делегує до платформо-специфічної реалізації: DomRenderer в браузері, ServerRenderer в SSR. Renderer2.listen() повертає unlisten function — crítico для cleanup (звичайний addEventListener потребує manual removeEventListener).

**Common mistakes:** "Ми не використовуємо SSR тому нам не важливо". Не знають що Renderer2.listen() повертає cleanup function.

---

### [L3 — Senior] Поясни `exportAs` — як він працює і коли це правильний інструмент vs alternatives?

**Signal being tested:** Чи розуміє кандидат template-level API design і коли публічний imperative API директиви виправданий.

**What the interviewer expects:** Механізм роботи exportAs, конкретний use case, порівняння з альтернативами (@Output, ContentChild, DI).

**How to probe deeper:** "Якщо директива змінює стан через exportAs method — хто відповідальний за тригер change detection?"

**Reference answer:** exportAs: 'name' дозволяє `#ref='name'` в template — Angular знаходить directive з таким exportAs і присвоює instance. Practical: MatMenuTrigger exportAs 'matMenuTrigger' — template може викликати trigger.openMenu(). Коли виправданий: imperative API неминучий (focus, scroll, trigger animation). Коли надмірний: для data flow — краще @Output. При exportAs методі що змінює стан — потрібен manual markForCheck() якщо компонент на OnPush.

**Common mistakes:** Використовують exportAs для data access — краще @Output або signal. Не думають про change detection при виклику методів.

---

### [L4 — Staff/Principal] Як спроектувати систему attribute directives для Design System що підтримує SSR, tree-shaking і A11y?

**Signal being tested:** Системне мислення про directive architecture в контексті reusable library.

**What the interviewer expects:** Розгляд SSR-safety (Renderer2), standalone/tree-shaking, accessibility (aria binding), testing strategy, публічний API design.

**How to probe deeper:** "Якщо директива потребує global state (як ripple animation registry) — як ти це організуєш в SSR-safe спосіб?"

**Reference answer:** Design System directive architecture: 1) Standalone — кожна directive tree-shakeable, без NgModule barrel. 2) SSR-safety — Renderer2 + isPlatformBrowser guard для animations/visual effects. 3) A11y — директиви додають aria-* attributes через @HostBinding('[attr.aria-x]') — не можна покладатись на consumer. 4) Testing — кожна directive має unit test з test host + Spectator для зменшення boilerplate. 5) Composition — directives compose, не extend — FocusTrapDirective + ScrollLockDirective на modal. 6) Public API — exportAs для imperative actions, signal inputs для configuration, outputs для events. Global state (animation registry): InjectionToken з providedIn: 'root' + isPlatformBrowser guard для browser-only initialization.

**Common mistakes:** Не думають про tree-shaking — barrel файл що re-exports всі directives без side effects ок, але barrel що imports все — ламає tree-shaking. Ігнорують A11y implications.

---

## Summary

### Key Points

- Attribute directive модифікує host element без зміни DOM структури — behavior/appearance augmentation
- Renderer2 замість ElementRef.nativeElement — обов'язково для SSR-safe коду, Renderer2.listen() повертає cleanup function
- @HostBinding і @HostListener — shortcuts, але host metadata property більш centralized і Angular 2024 style
- exportAs дозволяє template reference на directive instance — для imperative public API
- DestroyRef.onDestroy() замість ngOnDestroy для cleanup — більш functional, без need for class method
- Signal inputs (input()) в директивах — Angular 17+ рекомендований підхід замість @Input decorator
- Directive composition > inheritance — кілька focused directives краще ніж одна "god directive"

### Elevator Pitch (2 minutes)

Attribute directive — це reusable поведінковий mixin для HTML елементів. Через @Directive з selector як атрибут, директива може: змінювати host properties через host bindings (@HostBinding або host metadata), реагувати на host events (@HostListener), маніпулювати DOM через Renderer2 (не nativeElement — ламається в SSR). Ключові практики: Renderer2 для DOM маніпуляцій, DestroyRef для cleanup без ngOnDestroy, exportAs для публічного template API. З Angular 17: signal inputs (input()) і standalone: true — canonical form. Composition: кілька директив на одному елементі мають спільний injector і можуть inject один одного.
