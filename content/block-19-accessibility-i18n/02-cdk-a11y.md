---
title: "Angular CDK Accessibility Utilities"
block: 19
topic: 2
slug: "cdk-a11y"
difficulty: 3
sinceVersion: "7"
tags: ["FocusTrap", "FocusMonitor", "LiveAnnouncer", "CdkTrapFocus", "A11yModule", "focus management"]
relatedTopics: ["aria-angular", "keyboard-navigation", "angular-animations"]
interviewQuestions:
  - level: "junior"
    question: "Що таке FocusTrap в Angular CDK і для чого він використовується?"
    referenceAnswers:
      junior: "FocusTrap обмежує переміщення focus всередині певного DOM елемента. Використовується в модальних вікнах, щоб focus не виходив за межі модалу."
      mid: "FocusTrap — це CDK utility, що перехоплює Tab і Shift+Tab key events і циклічно переміщує focus між focusable елементами всередині контейнера. Реалізований як `cdkTrapFocus` директива або `FocusTrap` service. Критичний для модалів, drawer'ів, dropdown'ів — без нього Tab key виходить за межі overlay і порушує WCAG 2.1 criterion 2.1.2."
      senior: "FocusTrap реалізований через два 'sentinel' елементи (невидимі tabindex=0 span'и) на початку і кінці контейнера. Коли focus досягає sentinel — він телепортується на протилежний край. `FocusTrap.focusFirstTabbableElement()` і `focusLastTabbableElement()` для програмного переміщення focus при відкритті. Важливий edge case: `cdkTrapFocusAutoCapture` — автоматично переносить focus при attach. Lazy content (ng-content з *ngIf) потребує `focusTrap.updateFocalPoint()` після рендерингу динамічного контенту. CDK Overlay (використовується в Material Dialog/Snackbar) автоматично manages FocusTrap."
      staff: "FocusTrap — один з building blocks accessibility-ready component library. На системному рівні: кожен overlay (modal, drawer, tooltip з focusable content) повинен мати FocusTrap lifecycle management. Проблема: вкладені FocusTrap (modal відкриває dropdown всередині) — кожен trap незалежний, вони не знають один про одного. CDK Overlay stack management вирішує це через z-index та focus restoration chain. В Angular Material: DialogRef зберігає previouslyFocusedElement і restores focus при close — цей pattern треба реплікувати в кастомних overlays. Для design system: `FocusTrapFactory` inject дозволяє автоматично create/destroy FocusTrap в overlay lifecycle hooks."
    commonMistakes:
      - "Забувають destroy FocusTrap при закритті modal — може залишитись активним після видалення DOM"
      - "Не переміщують focus на перший focusable елемент при відкритті modal — screen reader не знає про новий контент"
    relatedQuestions: ["b19t2q2", "b19t4q1"]
  - level: "mid"
    question: "Як FocusMonitor відрізняється від звичайних focus events? Що таке focus origin?"
    referenceAnswers:
      junior: "FocusMonitor відстежує звідки прийшов focus — від миші, клавіатури або програматично. Це дозволяє показувати focus ring тільки при клавіатурній навігації."
      mid: "FocusMonitor відстежує 'focus origin': mouse, keyboard, touch, program. CSS :focus-visible вирішує задачу показу ring тільки при keyboard, але FocusMonitor дає більше контролю. Підписатись: `focusMonitor.monitor(element).subscribe(origin => ...)`. Origin null = blur. Використовується в Angular Material для conditional focus ring стилів. Важливо: monitor() повертає Observable, треба unsubscribe та `stopMonitoring(element)` для cleanup."
      senior: "FocusMonitor реалізований через document-level event listeners (mousedown, touchstart, keydown) що встановлюють 'last interaction' state. Коли focus event приходить — origin визначається за останньою взаємодією. `coerceFocusOrigin()` нормалізує origin. Внутрішньо зберігає WeakMap елемент → Subject. Focus origin має 4 значення: mouse, keyboard, touch, program (через `.focus()` виклик або FocusTrap). Edge case: фокусування через `element.focus()` в setTimeout — origin буде 'program', навіть якщо triggered клавіатурою. CSS :focus-visible більш performant (нативний browser mechanism), але FocusMonitor потрібен для programmatic focus detection та custom component logic."
      staff: "На рівні design system FocusMonitor закриває gap між CSS :focus-visible (що browser-native і не customizable) та компонентами де потрібна custom логіка. Наприклад: анімований focus ring (Angular Material ripple), analytics (track keyboard vs mouse usage for UX insights), conditional behavior (keyboard — показати tooltip, mouse — ні). Architectural concern: FocusMonitor — singleton service з global event listeners. Не має overhead для elements що не monitored. Але `monitor()` без `stopMonitoring()` = memory leak. Pattern для host directive: `ngOnInit: monitor(el)`, `ngOnDestroy: stopMonitoring(el)`. В zoneless apps: FocusMonitor emits через zone — може trigger unnecessary CD cycles. Рішення: `focusMonitor.monitor(el, false).subscribe(origin => { zone.runOutsideAngular(() => {...}) })`."
    commonMistakes:
      - "Не викликають stopMonitoring при знищенні компонента — memory leak"
      - "Плутають FocusMonitor (CDK) з :focus-visible (CSS) — різні use cases, CSS завжди кращий для простих стилів"
    relatedQuestions: ["b19t2q1", "b19t4q2"]
  - level: "mid"
    question: "Як використовувати LiveAnnouncer для programmatic screen reader announcements?"
    referenceAnswers:
      junior: "LiveAnnouncer дозволяє програматично оголошувати повідомлення screen reader'ам без зміни видимого UI через aria-live region."
      mid: "LiveAnnouncer інжектується як service і має метод `announce(message, politeness?, duration?)`. Politeness: 'polite' (чекає паузи) або 'assertive' (перериває). LiveAnnouncer динамічно створює aria-live region в DOM, встановлює message, потім очищує — це вирішує проблему статичних aria-live regions, що ігнорують початкові значення. Duration — auto-clear timeout."
      senior: "LiveAnnouncer under the hood: inject aria-live div в document.body (не в поточний компонент — глобальний), встановлює textContent, після duration — очищує. Чому не в компонент: aria-live regions мусять існувати в DOM до того як content появляється — LiveAnnouncer гарантує це. Важливий нюанс: concurrent announcements — якщо `announce()` викликається швидко, кожен перезаписує попередній. `AriaLivePoliteness.assertive` — для помилок і критичних змін тільки. Race condition: `announce()` повертає Promise — await якщо потрібна sequenced announcements. Cleanup: `LiveAnnouncer.ngOnDestroy()` видаляє aria-live div — але якщо компонент щo використовує LiveAnnouncer destroyed до announce — може announce в destroyed context."
      staff: "Для enterprise notification system: LiveAnnouncer як central hub для всіх AT announcements. Pattern: NotificationService wraps LiveAnnouncer, adds business logic (deduplication, throttling, priority queue). Наприклад: form validation — не оголошувати кожну keystroke (throttle), але оголосити при submit або blur. Cart updates — polite announcement не перериває navigation. Error alerts — assertive тільки для blocking errors. Testing concern: LiveAnnouncer в Jest — треба mock або verify message без actual AT. `AriaLiveAnnouncer` mock: spy on `announce` method. E2E testing: немає надійного способу перевірити що screen reader прочитав — перевіряємо що aria-live div містить очікуваний текст."
    commonMistakes:
      - "Використовують assertive для всіх повідомлень — перериває navigation, руйнує UX"
      - "Не await Promise від announce() при sequential announcements — race condition"
    relatedQuestions: ["b19t1q3", "b19t2q4"]
  - level: "senior"
    question: "Як правильно відновити focus після закриття modal в Angular? Які edge cases існують?"
    referenceAnswers:
      junior: "Після закриття modal потрібно повернути focus на елемент який його відкрив, щоб клавіатурний користувач не загубився."
      mid: "Зберегти `previouslyFocusedElement = document.activeElement` перед відкриттям modal. При закритті: `previouslyFocusedElement?.focus()`. Angular Material DialogRef робить це автоматично. Для кастомних overlays — треба реалізувати вручну. Якщо trigger element видалений з DOM — fallback на document.body або логічний parent."
      senior: "Focus restoration — складніша ніж здається: 1) `document.activeElement` перед open може бути null (якщо modal відкривається programmatically без user interaction). 2) Trigger element може бути destroyed поки modal відкритий (наприклад, list item що відкрив detail modal, а list refresh видалив item). 3) В nested overlays (modal відкриває confirm dialog) — кожен overlay має свій previouslyFocusedElement, і закриття inner overlay restores focus на outer overlay trigger, не на document. 4) FocusMonitor.focusVia(element, 'program') — кращий ніж element.focus() бо правильно встановлює focus origin для visual feedback. 5) Timing: focus restoration має відбутись ПІСЛЯ animation (якщо overlay має close animation — focus ще знаходиться в overlay під час animation)."
      staff: "Focus restoration — частина загального overlay lifecycle contract. Design system рішення: базовий OverlayRef abstract class з built-in focus management. Template: open() → save focus + trapFocus → ... → close(animationDone) → restoreFocus. Для compound scenarios (wizard з кількома кроками) — focus stack: push при кожному overlay open, pop при close. Accessibility concern: якщо focus restoration fail (element не знайдено) — focus на body = acceptable fallback, але user gubitsya. Краще: логічний parent container (наприклад якщо list item deleted — focus на list container). Testing: Playwright `page.keyboard.press('Escape')` + check `document.activeElement` — automation того що правильний element focused після close. In SSR: focus operations мусять бути guarded by `isPlatformBrowser()` — `document.activeElement` недоступний на сервері."
    commonMistakes:
      - "Не зберігають previouslyFocusedElement до відкриття — намагаються визначити 'хто відкрив' після закриття"
      - "Не обробляють випадок коли trigger element видалений з DOM"
    relatedQuestions: ["b19t2q1", "b19t4q3"]
  - level: "staff"
    question: "Як реалізувати roving tabindex pattern для keyboard navigation в кастомному list/grid компоненті?"
    referenceAnswers:
      junior: "Roving tabindex — це коли тільки один елемент у групі має tabindex=0, решта tabindex=-1. Tab переходить до групи, стрілки навігують всередині."
      mid: "Roving tabindex: контейнер має tabindex=0, або один 'active' child має tabindex=0. Tab потрапляє в групу, arrow keys переміщають focus між items (через set tabindex=-1 на старий, tabindex=0 на новий + focus()). Escape — вихід з групи. CDK ListKeyManager реалізує roving tabindex для vertical/horizontal navigation."
      senior: "CDK ListKeyManager — foundation для roving tabindex. `ListKeyManager<T extends ListKeyManagerOption>` де option має `disabled` і `getLabel()`. `ActiveDescendantKeyManager` використовує aria-activedescendant замість DOM focus (для combobox). `FocusKeyManager` переміщає DOM focus (для toolbars, menubars). Конфігурація: `.withWrap()` (зациклювання), `.withTypeAhead()` (jump to item by first letter), `.withHorizontalOrientation()` (горизонтальна навігація), `.withHomeAndEnd()` (Home/End keys). При ініціалізації: `setActiveItem(0)` і встановити tabindex=0 на перший item. При Tab out — зберегти activeItem для наступного Tab in."
      staff: "Roving tabindex — складний pattern в динамічних списках. Challenges: 1) Virtual scrolling — items не всі в DOM, але 'active' item може бути поза viewport. CDK VirtualScroll + ListKeyManager: при active item change — scrollIntoView. 2) Async data — items з'являються пізніше, potentialActiveItem може змінитись. 3) Grid (2D navigation) — стандартний ListKeyManager тільки 1D. Кастомна 2D implementation: row × column matrix, ArrowLeft/Right для horizontal, ArrowUp/Down з column preservation (як в Excel — UP іде на той самий стовпець). 4) Mixed focusable items (buttons і text в grid row) — skip non-interactive cells. Architectural decision: CDK's ActiveDescendantKeyManager vs FocusKeyManager — activedescendant краще для performance (немає DOM focus переміщень), але деякі screen reader'и краще обробляють DOM focus. Test matrix визначає підхід. Для design system: реалізувати базовий RovingTabindexDirective що handles lifecycle і exposes API для consumer components."
    commonMistakes:
      - "Не зберігають активний item при Tab out — наступний Tab in завжди фокусує перший item"
      - "Забувають про wrapping — стрілка вниз на останньому елементі нічого не робить"
    relatedQuestions: ["b19t4q2", "b19t2q4"]
---

## Core Concept

**English definition:** Angular CDK A11y module (`@angular/cdk/a11y`) provides a set of utilities for building accessible Angular applications: FocusTrap (confines focus within containers), FocusMonitor (tracks focus origin and state), LiveAnnouncer (programmatic aria-live announcements), and related keyboard management tools.

**Пояснення:** CDK A11y — це "toolbox" для accessibility, що вирішує технічні проблеми недоступні через чистий HTML/ARIA. FocusTrap утримує focus всередині modal. FocusMonitor визначає звідки прийшов focus (миша/клавіатура/touch) для умовного показу focus ring. LiveAnnouncer програматично сповіщає screen reader'и. Разом вони покривають більшість складних accessibility сценаріїв в SPA.

**Яку проблему вирішує:**

- **Без FocusTrap:** Tab в modal виходить за його межі — клавіатурний користувач "провалюється" назовні, порушення WCAG 2.1 criterion 2.1.2.
- **Без FocusMonitor:** Або завжди показуємо focus ring (візуальний шум для mouse users) або ніколи (порушення keyboard accessibility).
- **Без LiveAnnouncer:** Динамічні UI зміни (loading complete, error, success) невидимі для screen reader'ів якщо не переміщувати focus.

**Як працює під капотом:**

**FocusTrap:**
- Вставляє два invisible `<span tabindex="0">` (anchors) на початку і кінці контейнера
- Event listener на Escape/Tab перехоплює keyboard events
- При Tab на останньому focusable — focus телепортується на перший, і навпаки
- `FocusTrapFactory` creates/destroys traps, integrates with Angular lifecycle

**FocusMonitor:**
- Document-level `mousedown`, `touchstart`, `keydown` listeners встановлюють `_origin` state
- `focus` event на monitored elements зчитує поточний `_origin`
- WeakMap `_elementInfo: WeakMap<HTMLElement, ElementInfo>` — per-element subjects
- Integrates з zone.js для change detection triggering

**LiveAnnouncer:**
- Creates `<div aria-live="polite/assertive" aria-atomic="true">` в `document.body`
- Sets textContent = message → screen reader detects DOM mutation via aria-live
- Clears content after `duration` (default 'off' = no auto-clear)
- Global singleton — один DOM element для всього додатку

**Trade-offs та обмеження:**

- FocusTrap: nested traps не координуються автоматично (modal в modal)
- FocusMonitor: document listeners = slight overhead, але WeakMap memory management виключає leaks якщо `stopMonitoring()` викликається
- LiveAnnouncer: rapid consecutive calls — тільки останнє повідомлення читається
- All CDK a11y utilities: потрібен `A11yModule` import або individual imports

**Версійність:** CDK A11y module стабільний з Angular 7. `LiveAnnouncer.announce()` повертає Promise з Angular 9 (раніше void). `FocusMonitor.monitor()` додав `checkChildren` параметр в v9. `ActiveDescendantKeyManager` — з CDK 6. В Angular 15+ standalone imports: `import { A11yModule } from '@angular/cdk/a11y'` або individual directives/services without module.

## Deep Details

### Edge Cases

**FocusTrap з динамічним контентом:** Якщо контент всередині trap змінюється після ініціалізації (lazy loaded, *ngIf) — FocusTrap не автоматично оновлює список focusable elements. `FocusTrap` клас має `focusFirstTabbableElementWhenReady()` — чекає на microtask queue перед пошуком focusable elements.

**FocusMonitor і Shadow DOM:** FocusMonitor не "дивиться" всередину Shadow DOM (наприклад, Angular Elements). Потребує explicit monitoring shadow root або relying on composed events.

**LiveAnnouncer і SSR:** `inject(DOCUMENT).body` в SSR — доступний, але screen readers на сервері не існують. Guard: `if (isPlatformBrowser(platformId))` перед announce().

**ListKeyManager і disabled items:** `withSkipPredicate()` дозволяє кастомну логіку пропуску. За замовчуванням — пропускає items де `item.disabled === true`.

**FocusTrap і z-index overlapping:** Якщо element за межами trap має вищий z-index і візуально поверх modal — Tab може технічно focus невидимий (але accessible) елемент за trap. Visual layer management треба coordinating з focus management.

### Junior vs Senior Understanding

**Junior знає:** як підключити `cdkTrapFocus` директиву, як inject LiveAnnouncer і викликати announce().

**Senior розуміє:**

1. **FocusTrap lifecycle:** `FocusTrapFactory.create(element, deferAnchors)` — deferAnchors=true відкладає вставку anchors (для performance при SSR або off-screen). Manual `focusTrap.attachAnchors()` пізніше.

2. **FocusMonitor and changeDetection:** Emits в Angular zone за замовчуванням — може trigger unnecessary CD cycle. Для high-performance компонентів: `focusMonitor.monitor(el, false)` + ручний `changeDetectorRef.markForCheck()` тільки коли потрібно.

3. **ListKeyManager typeahead:** `.withTypeAhead(debounceInterval)` — перехоплює printable key events, будує buffer, шукає item по label. Потребує `getLabel()` implementation на кожному item.

4. **Focus visibility strategy:** CSS `:focus-visible` (нативний) достатній для більшості випадків. FocusMonitor потрібен коли: custom animation на focus, programmatic focus detection, analytics, component needs to know focus source.

5. **cdkTrapFocusAutoCapture:** `<div cdkTrapFocus cdkTrapFocusAutoCapture>` — автоматично фокусує перший focusable element при ініціалізації директиви. Аналог `autofocus` HTML attribute, але працює з Angular lifecycle.

### Deprecation & Migration Path

- `FocusOrigin` тип змінився в v9: додано `'program'` значення. Якщо code перевіряє `origin === null` для program focus — треба оновити на `origin === 'program' || origin === null`.
- `InteractivityChecker` (перевіряє чи element focusable) переміщений в CDK v7 з Material.
- Standalone CDK: в Angular 15+ `A11yModule` може бути замінений individual imports для tree-shaking.

### Connections to Other Concepts

- **ARIA & Semantic HTML** (`aria-angular`) — CDK utilities будуються поверх ARIA
- **Keyboard Navigation** (`keyboard-navigation`) — ListKeyManager є CDK-implementation roving tabindex
- **Angular Animations** — FocusTrap і animation timing потребують координації (focus restoration після close animation)
- **Angular Material** — всі overlay компоненти (Dialog, Menu, Select) internally use FocusTrap + FocusMonitor

## Examples

### Basic Usage

```typescript
// FocusTrap через директиву
@Component({
  selector: 'app-modal',
  imports: [A11yModule],
  template: `
    @if (isOpen) {
      <div
        class="modal-backdrop"
        (click)="close()"
        (keydown.escape)="close()"
      >
        <div
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title"
          cdkTrapFocus
          cdkTrapFocusAutoCapture
          class="modal-content"
          (click)="$event.stopPropagation()"
        >
          <h2 id="modal-title">{{ title }}</h2>
          <ng-content></ng-content>
          <button type="button" (click)="close()">Close</button>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() title = '';
  isOpen = false;

  open(): void { this.isOpen = true; }
  close(): void { this.isOpen = false; }
}

// LiveAnnouncer для async notifications
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private liveAnnouncer = inject(LiveAnnouncer);

  async notifySuccess(message: string): Promise<void> {
    await this.liveAnnouncer.announce(message, 'polite');
  }

  async notifyError(message: string): Promise<void> {
    await this.liveAnnouncer.announce(message, 'assertive');
  }
}
```

### Production Scenario

```typescript
// FocusMonitor для умовного focus ring + focus restoration
@Component({
  selector: 'app-custom-button',
  imports: [CommonModule],
  template: `
    <button
      #btn
      [class.keyboard-focused]="isFocusedByKeyboard"
      (click)="onClick()"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button { outline: none; } /* Remove default */
    .keyboard-focused { outline: 2px solid blue; outline-offset: 2px; }
  `]
})
export class CustomButtonComponent implements OnInit, OnDestroy {
  @ViewChild('btn') buttonRef!: ElementRef;

  private focusMonitor = inject(FocusMonitor);
  private destroy$ = new Subject<void>();
  isFocusedByKeyboard = false;

  ngOnInit(): void {
    this.focusMonitor
      .monitor(this.buttonRef.nativeElement, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe(origin => {
        this.isFocusedByKeyboard = origin === 'keyboard';
      });
  }

  ngOnDestroy(): void {
    this.focusMonitor.stopMonitoring(this.buttonRef.nativeElement);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClick(): void { /* ... */ }
}

// Програматичне управління FocusTrap з focus restoration
@Injectable({ providedIn: 'root' })
export class DialogService {
  private focusTrapFactory = inject(FocusTrapFactory);
  private document = inject(DOCUMENT);
  private focusTrap: FocusTrap | null = null;
  private previouslyFocused: HTMLElement | null = null;

  open(containerElement: HTMLElement): void {
    // Зберегти поточний focus
    this.previouslyFocused = this.document.activeElement as HTMLElement;

    // Створити trap
    this.focusTrap = this.focusTrapFactory.create(containerElement);
    this.focusTrap.focusFirstTabbableElementWhenReady();
  }

  close(): void {
    this.focusTrap?.destroy();
    this.focusTrap = null;

    // Restore focus — з fallback
    if (this.previouslyFocused && this.document.contains(this.previouslyFocused)) {
      this.previouslyFocused.focus();
    } else {
      // Trigger element removed from DOM — fallback to body
      (this.document.body as HTMLElement).focus();
    }
    this.previouslyFocused = null;
  }
}
```

### Anti-Example

```typescript
// НЕПРАВИЛЬНО: Не cleanup FocusMonitor і FocusTrap
@Component({
  template: `<div #container cdkTrapFocus>...</div>`
})
export class BadComponent implements OnInit {
  @ViewChild('container') container!: ElementRef;
  private focusMonitor = inject(FocusMonitor);

  ngOnInit(): void {
    // ❌ Немає cleanup — memory leak
    this.focusMonitor.monitor(this.container.nativeElement).subscribe(origin => {
      console.log('focus origin:', origin);
    });
  }

  // ❌ Немає ngOnDestroy з stopMonitoring і unsubscribe
}

// ❌ Неправильне використання LiveAnnouncer
@Component({
  template: `<button (click)="saveForm()">Save</button>`
})
export class BadAnnouncerComponent {
  private liveAnnouncer = inject(LiveAnnouncer);

  saveForm(): void {
    // ❌ assertive для не-критичного повідомлення — перериває navigation
    this.liveAnnouncer.announce('Form saved successfully!', 'assertive');
    // ❌ Не await — немає гарантії порядку якщо ще announcements
    this.liveAnnouncer.announce('Redirecting...', 'assertive');
  }
}

// ПРАВИЛЬНО:
@Component({
  template: `<div #container cdkTrapFocus>...</div>`
})
export class GoodComponent implements OnInit, OnDestroy {
  @ViewChild('container') container!: ElementRef;
  private focusMonitor = inject(FocusMonitor);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.focusMonitor
      .monitor(this.container.nativeElement)
      .pipe(takeUntil(this.destroy$))
      .subscribe(origin => { /* ... */ });
  }

  ngOnDestroy(): void {
    this.focusMonitor.stopMonitoring(this.container.nativeElement);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `focusMonitor.monitor()` без `stopMonitoring()` в `ngOnDestroy` | Memory leak — WeakMap entry і Subject залишаються живими | Завжди pair `monitor()` з `stopMonitoring()`, використовувати `takeUntil(destroy$)` |
| `LiveAnnouncer.announce('...', 'assertive')` для всіх повідомлень | Перериває поточне читання — катастрофічний UX для screen reader users | `assertive` тільки для блокуючих помилок, `polite` для решти |
| `cdkTrapFocus` без відновлення focus після закриття | Клавіатурний юзер після закриття modal опиняється на body — втрачає контекст | Зберігати `previouslyFocusedElement` і restore при close |
| Не обробляти collapsed `FocusTrap` контейнер | `focusFirstTabbableElement()` поверне false якщо немає focusable — focus зникне | Додати fallback: `trap.focusInitialElement() || containerEl.focus()` |
| `ListKeyManager` без `withWrap()` | На останньому/першому елементі ArrowKey нічого не робить — заплутує юзерів | Завжди `.withWrap()` для list navigation якщо UI не має явного "кінця" |

## Interview Block

### [L1 — Warm-up] Що таке FocusTrap в Angular CDK і для чого він використовується?

**Signal being tested:** Чи розуміє кандидат практичну проблему яку вирішує FocusTrap, може пов'язати з WCAG вимогами.

**What the interviewer expects:** Зв'язок FocusTrap з modal/overlay patterns, WCAG 2.1.2 (No Keyboard Trap / Trap Focus Containment), розуміння що Tab без trap виходить за межі overlay.

**How to probe deeper:** "Що станеться якщо не використовувати FocusTrap в modal?" — Tab виходить на фонові елементи, screen reader не знає про modal контекст.

**Reference answer:** FocusTrap утримує keyboard focus всередині контейнера циклічно через Tab/Shift+Tab. Критичний для модалів, drawer'ів, overlays. Реалізується через `cdkTrapFocus` директиву або `FocusTrapFactory` service. Без нього Tab key виходить за межі modal — порушення WCAG 2.1 criterion 2.1.2.

**Common mistakes:** Плутають із закриттям modal по Escape (окрема функціональність). Не розуміють що FocusTrap — не security feature, а accessibility pattern.

---

### [L2 — Mid] Як FocusMonitor відрізняється від звичайних focus events? Що таке focus origin?

**Signal being tested:** Чи розуміє кандидат різницю між HTML focus events і CDK FocusMonitor abstraction, може пояснити use case для focus origin detection.

**What the interviewer expects:** Focus origin (mouse/keyboard/touch/program), зв'язок з conditional focus ring, розуміння що CSS :focus-visible може бути достатнім для простих випадків.

**How to probe deeper:** "Коли варто використовувати CSS :focus-visible замість FocusMonitor?" — :focus-visible для простих стилів, FocusMonitor для programmatic logic, animations, analytics.

**Reference answer:** FocusMonitor відстежує `origin`: mouse, keyboard, touch, program. Document-level event listeners встановлюють origin state, focus event зчитує. Підписка: `focusMonitor.monitor(el).subscribe(origin => ...)`. Використовується в Material для conditional focus ring. Потребує `stopMonitoring(el)` в ngOnDestroy.

**Common mistakes:** Не cleanup — memory leak. Використовують де достатньо CSS :focus-visible.

---

### [L3 — Senior] Як правильно відновити focus після закриття modal в Angular? Які edge cases існують?

**Signal being tested:** Глибоке розуміння focus lifecycle в overlay patterns, відомість про edge cases з видаленими DOM елементами і nested overlays.

**What the interviewer expects:** `previouslyFocusedElement` strategy, fallback для deleted triggers, timing з animations, nested overlay stack.

**How to probe deeper:** "Що робити якщо trigger element видалений поки modal відкритий?" — fallback на логічний parent або body.

**Reference answer:** Зберегти `document.activeElement` перед open. При close: перевірити `document.contains(previouslyFocused)`, якщо так — `.focus()`. Якщо ні — fallback на логічний parent або body. `FocusMonitor.focusVia(el, 'program')` кращий за `el.focus()`. Timing: restore ПІСЛЯ close animation. Angular Material DialogRef implementsце автоматично.

**Common mistakes:** Намагаються знайти trigger після close. Не перевіряють `contains()` — focus на detached element fails silently.

---

### [L4 — Staff/Principal] Як реалізувати roving tabindex pattern для keyboard navigation в кастомному list/grid компоненті?

**Signal being tested:** Системне розуміння CDK ListKeyManager internals, здатність вирішити complex cases (virtual scrolling, 2D grid, mixed content).

**What the interviewer expects:** CDK ListKeyManager/FocusKeyManager/ActiveDescendantKeyManager, withWrap/withTypeAhead/withHorizontalOrientation API, virtual scroll coordination, design system reuse pattern.

**How to probe deeper:** "Як реалізувати 2D grid navigation (як Excel) з CDK?" — кастомна matrix-based navigation поверх ListKeyManager або повністю custom.

**Reference answer:** CDK FocusKeyManager для DOM focus movement, ActiveDescendantKeyManager для aria-activedescendant. `.withWrap().withTypeAhead().withHomeAndEnd()`. Virtual scrolling: `scrollIntoView` при active item change. 2D grid: кастомна реалізація — row/column matrix, column preservation при ArrowUp/Down. Design system: базовий RovingTabindexDirective з exported API.

**Common mistakes:** Не зберігають active item при Tab out. Не враховують disabled items. Не реалізують typeahead для великих списків.

## Summary

### Key Points

- FocusTrap конфайнить focus в overlay через invisible sentinel anchors — критичний для modals/drawers відповідно до WCAG 2.1.2.
- FocusMonitor відстежує focus origin (mouse/keyboard/touch/program) через document-level event listeners — завжди потрібен `stopMonitoring()` в ngOnDestroy.
- LiveAnnouncer програматично оголошує в aria-live region — `polite` для більшості, `assertive` тільки для blocking errors.
- Focus restoration після overlay close: зберегти `previouslyFocusedElement`, перевірити `contains()`, restore після animation.
- CDK ListKeyManager реалізує roving tabindex — `FocusKeyManager` для DOM focus, `ActiveDescendantKeyManager` для aria-activedescendant.
- Всі CDK a11y utilities потребують cleanup в `ngOnDestroy` — FocusMonitor `stopMonitoring()`, FocusTrap `destroy()`.
- CSS `:focus-visible` достатній для простих стилів; FocusMonitor потрібен для programmatic logic і animations.

### Elevator Pitch (2 minutes)

Angular CDK A11y module закриває gap між ARIA специфікацією і практичною реалізацією в SPA. FocusTrap вирішує проблему Tab key що "вислизає" з modal — вставляє invisible anchors і циклює focus. FocusMonitor дає `origin` (mouse/keyboard/touch/program) — на основі цього можна умовно показувати focus ring без CSS :focus-visible обмежень. LiveAnnouncer динамічно створює aria-live region і programmatically announces message screen reader'ам — надійніше ніж статичний aria-live div.

Ключові patterns: cdkTrapFocus + cdkTrapFocusAutoCapture для overlays, focus restoration з `previouslyFocusedElement` при close, ListKeyManager для roving tabindex у lists/grids. Критично: FocusMonitor.stopMonitoring() в ngOnDestroy, FocusTrap.destroy() при close, LiveAnnouncer.announce() — polite за замовчуванням.
