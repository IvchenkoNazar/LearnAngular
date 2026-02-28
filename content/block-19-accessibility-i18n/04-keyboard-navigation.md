---
title: "Keyboard Navigation & Focus Management"
block: 19
topic: 4
slug: "keyboard-navigation"
difficulty: 3
sinceVersion: "2"
tags: ["keyboard navigation", "focus management", "skip links", "tabindex", "roving tabindex", "focus trap", "keyboard shortcuts"]
relatedTopics: ["aria-angular", "cdk-a11y", "i18n"]
interviewQuestions:
  - id: "b19t4q1"
    level: "junior"
    question: "Що таке tabindex і які значення він може приймати? Навіщо уникати позитивних значень?"
    referenceAnswers:
      junior: "tabindex='0' додає елемент в природній tab order. tabindex='-1' видаляє з tab order але дозволяє focus програматично. tabindex='1' та вище змінює порядок — варто уникати."
      mid: "tabindex='0' вставляє елемент в DOM-order tab sequence. tabindex='-1' — focusable через JavaScript `.focus()` але Tab key пропускає. Позитивні значення (1, 2...) встановлюють explicit order що override DOM order — це антипатерн бо: 1) складно підтримувати (додавання нового елемента ламає весь sequence), 2) confusing для screen reader (tab order не відповідає візуальному порядку), 3) WCAG 2.4.3 Focus Order violation. Використовувати лише 0 і -1."
      senior: "tabindex на нативних HTML елементах: `<input>`, `<button>`, `<a href>` — focusable without tabindex (implicit tabIndex=0). `<div>`, `<span>` — non-focusable unless explicit tabindex. Позитивні tabindex: browser рендерить tab order як: спочатку всі positive tabindex по зростанню, потім tabindex=0 у DOM order. Це означає: tabindex=1 завжди перший, незалежно від позиції в DOM. Edge case: tabindex на `<summary>` всередині `<details>` — browser behavior різниться. Dynamic tabindex (roving tabindex) — legitimate pattern: один елемент в групі має tabindex=0, решта -1. Змінюється при arrow key navigation."
      staff: "tabindex — це foundation keyboard accessibility архітектури. На рівні design system: всі interactive компоненти мусять мати чітку tabindex strategy. Правило: якщо компонент є 'widget' (listbox, tree, grid) — один tabstop на весь widget (roving tabindex всередині). Якщо компонент є 'landmark' — кожен interactive елемент власний tabstop. Програматичне управління tabindex в Angular: `ElementRef.nativeElement.tabIndex = -1` або `[attr.tabindex]`. Проблема enterprise: legacy code з позитивними tabindex values в third-party components — не можна змінити source. Workaround: CSS `pointer-events: none` + aria-hidden + прихований duplicate без positive tabindex. Accessibility audit: перевіряти tab order через Playwright `page.keyboard.press('Tab')` sequence + `document.activeElement` assertions."
    commonMistakes:
      - "Використовують tabindex='1' для 'першого елемента' — вся логіка tab order ламається"
      - "Не знають що tabindex='-1' потрібен для focus restoration (dialog close → повернення на trigger)"
    relatedQuestions: ["b19t4q2", "b19t2q1"]
  - id: "b19t4q2"
    level: "mid"
    question: "Що таке skip navigation links і як їх реалізувати в Angular Single Page Application?"
    referenceAnswers:
      junior: "Skip navigation — це невидимий або видимий при фокусі link 'Skip to main content' на початку сторінки для клавіатурних користувачів."
      mid: "Skip link — перший елемент в DOM: `<a href='#main-content' class='skip-link'>Skip to main content</a>`. Стилі: `position: absolute; top: -40px;` + `:focus { top: 0; }`. В Angular SPA: проблема що route change не перезавантажує сторінку — skip link залишається в DOM. `<main id='main-content' tabindex='-1'>` — tabindex=-1 бо `<main>` не нативно focusable (href="#main" focus без tabindex = focus на anchor, не переміщення viewport). Після route transition — `document.getElementById('main-content').focus()`."
      senior: "Skip links в SPA мають декілька проблем: 1) `href='#id'` в SPA може спрацювати як route navigation або нічого — залежить від router config. Краще: `(click)='skipToMain(); $event.preventDefault()'` з programmatic `element.focus({ preventScroll: false })`. 2) Множина skip links: 'Skip to navigation', 'Skip to main', 'Skip to footer' — показувати при focus через :focus-visible. 3) В Angular Universal/SSR: skip link присутній в SSR markup — важливо для crawler і AT on first paint. 4) `<main>` landmark: тільки один per page — Angular router outlet migration може порушити це. 5) Focus visible при programmatic focus: деякі browsers не показують :focus ring при `.focus()` — потрібен `focus-visible` polyfill або FocusMonitor."
      staff: "Skip navigation — це один accessibility feature що впливає на весь app architecture. Правильна реалізація: 1) AppComponent level — єдиний skip link, не копіювати в кожному route. 2) Router events subscriber — `NavigationEnd` → focus main landmark. 3) Multiple landmarks з proper aria roles (`<nav aria-label='Main navigation'>`, `<main>`, `<aside>`) — screen reader users можуть skip directly до landmarks через shortcuts (NVDA: R key для landmarks). 4) Angular router focus management: `RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })` — тільки scroll, не focus. Custom `RouteEventsService`: `NavigationEnd` → focus `#main-content`. 5) In-page navigation (tabs, accordion) — consider 'Skip to section' pattern. Metrika: keyboard user journey testing — tab count від login до first action (WCAG 2.4.1 guideline: менше N tabstops до core functionality)."
    commonMistakes:
      - "Skip link тільки hidden без :focus visible state — не допомагає keyboard users"
      - "Не переміщують focus після route transition — screen reader announcer перечитує весь заголовок сторінки"
    relatedQuestions: ["b19t4q3", "b19t4q1"]
  - id: "b19t4q3"
    level: "senior"
    question: "Як правильно управляти focus при навігації між routes в Angular? Яка проблема виникає при SPA routing?"
    referenceAnswers:
      junior: "При переході між сторінками в SPA focus залишається на попередньому елементі або зникає. Потрібно переміщати focus на новий контент після navigation."
      mid: "SPA routing проблема: при route change DOM оновлюється але focus не переміщується — screen reader не оголошує нову сторінку. Рішення: `Router.events.pipe(filter(NavigationEnd))` → `document.getElementById('main-content').focus()`. Або `<router-outlet>` з `#outlet` + focus після navigation. Angular Material використовує LiveAnnouncer для оголошення page title при navigation."
      senior: "Angular не має built-in focus management для routing (на відміну від Remix/Next.js). Правильна implementation: 1) Subscribe на `NavigationEnd` в AppComponent або global service. 2) Focus на `<main id='main-content' tabindex='-1'>` — tabindex=-1 бо нативно non-focusable. 3) `focus({ preventScroll: true })` + manual scroll — або `preventScroll: false` якщо scroll needed. 4) Live announce page title: `liveAnnouncer.announce(this.titleService.getTitle(), 'assertive')` після navigation — screen reader оголошує нову сторінку. 5) Skip anchor focus workaround: `setTimeout(() => el.focus(), 0)` — потрібно щоб DOM оновився після navigation. 6) Scroll restoration: окремо від focus — `scrollPositionRestoration: 'enabled'` в RouterModule, або custom ScrollService. 7) Parametric routes (/user/1 → /user/2): не повний navigation — focus може залишитись на тому ж елементі (правильно, якщо context не змінився)."
      staff: "Focus management при routing — це cross-cutting concern що потребує central solution. Architectural pattern: `RouterAccessibilityService` — inject router events, titleService, liveAnnouncer, focusable main landmark. Skip logic: якщо navigation triggered by user action (click on link) — focus на main content. Якщо programmatic navigation (redirect) — може бути інша стратегія. Progressive enhancement: browser нативний `<a href>` navigation moves focus to body → screen reader reads from top. SPA повинен replicate цю поведінку. Deferred loading consideration: lazy route modules — route load time → focus too early (DOM не готовий). `resolveGuard` completion або `afterRender()` як trigger. Testing strategy: Playwright test що перевіряє `document.activeElement` після navigation. Audit: кожен route transition має тест що перевіряє focus destination. For complex apps: analytics on keyboard users — bounce rate, task completion, heatmap of Tab usage."
    commonMistakes:
      - "Focus на router-outlet замість main content — screen reader оголошує outlet, не content"
      - "Не оголошують page title через LiveAnnouncer — screen reader не знає про page change"
    relatedQuestions: ["b19t4q2", "b19t2q3"]
  - id: "b19t4q4"
    level: "senior"
    question: "Як реалізувати глобальні keyboard shortcuts в Angular? Які проблеми можуть виникнути?"
    referenceAnswers:
      junior: "Keyboard shortcuts реалізуються через `@HostListener('document:keydown.ctrl+s')` або `(keydown)` event binding в шаблоні."
      mid: "Глобальні shortcuts: `@HostListener('document:keydown', ['$event'])` або `fromEvent(document, 'keydown')` в service. Перевірити `event.key`, `event.ctrlKey`, `event.metaKey`. Проблема: conflicts з browser shortcuts (Ctrl+S — save page, Ctrl+F — find). Переважно використовувати нестандартні combinations або `Alt+`."
      senior: "Keyboard shortcuts в Angular: 1) Service-based: `inject(DOCUMENT) fromEvent<KeyboardEvent>('keydown')` + `takeUntilDestroyed()`. 2) Conflict detection: перевіряти `isComposing` (IME input для East Asian languages — не обробляти shortcuts під час composition). 3) Context awareness: shortcuts мають бути disabled в `<input>`, `<textarea>`, `[contenteditable]` (якщо не специфічні editor shortcuts). `event.target instanceof HTMLInputElement` check. 4) `event.preventDefault()` — тільки якщо handled, щоб не блокувати browser behavior. 5) Modifier keys: `event.ctrlKey` для Windows/Linux, `event.metaKey` для macOS — потрібно обидва перевіряти. 6) Focus context: деякі shortcuts мають сенс тільки в певному компоненті — `@HostListener` на компоненті (не document) для scoped shortcuts. 7) Screen reader conflicts: деякі AT hijack keyboard events — 'browse mode' vs 'forms mode' NVDA."
      staff: "Keyboard shortcuts management — це UX і accessibility concern. Архітектурно: centralized ShortcutsService що: 1) registry pattern — компоненти реєструють/дереєструють shortcuts при init/destroy, 2) conflict resolution — автоматично detectує конфлікти, 3) configurable (user-remappable shortcuts), 4) help overlay — показує всі активні shortcuts по `?` key (як GitHub). Implementation: `Map<string, ShortcutHandler>` де key — serialized combination (`ctrl+s`, `meta+k`). Priority/override system для context-aware shortcuts (global vs modal vs widget). ARIA consideration: shortcuts потрібно describe через `aria-keyshortcuts` атрибут на відповідному елементі — screen reader оголошує що shortcut доступний. Accessibility concern: кожен shortcut повинен мати pointer-based alternative (WCAG 2.5.1 Pointer Gestures). Testing: unit test для ShortcutsService, E2E test що симулює key press і перевіряє ефект."
    commonMistakes:
      - "Не перевіряють `event.isComposing` — shortcuts спрацьовують під час IME input"
      - "Встановлюють shortcuts що конфліктують з browser built-ins (Ctrl+S, Ctrl+P, F5)"
    relatedQuestions: ["b19t4q3", "b19t4q1"]
  - id: "b19t4q5"
    level: "staff"
    question: "Як тестувати keyboard navigation в Angular додатку? Що включає повноцінна стратегія тестування?"
    referenceAnswers:
      junior: "Keyboard тестування — це ручна перевірка що всі функції доступні з клавіатури. Tab, Enter, Escape, стрілки."
      mid: "Unit тести: `@testing-library/angular` з `userEvent.tab()` та `userEvent.keyboard('{Enter}')`. E2E: Playwright `page.keyboard.press('Tab')` і перевірка `document.activeElement`. Automated accessibility audit: `@axe-core/playwright` або `jest-axe`."
      senior: "Рівні keyboard testing: 1) Unit/Component: `TestBed` + `dispatchKeyboardEvent` + `detectChanges()` — перевіряти що component правильно реагує на key events. `@testing-library/angular` + `userEvent` для user-centric testing. 2) Integration: FocusTrap tests — `getActiveElement()` після trap initialization. 3) E2E (Playwright): tab sequence tests — program через `page.keyboard.press('Tab')` N разів, перевіряти `page.evaluate(() => document.activeElement?.tagName)`. 4) Automated a11y: `axe-playwright` в CI — ловить ARIA errors, missing labels. 5) Manual testing checklist: Tab order logical, all interactive accessible, Escape closes overlays, Enter/Space activates, arrow navigation в widgets. 6) Screen reader testing: NVDA+Chrome, VoiceOver+Safari — manual, не автоматизується надійно."
      staff: "Keyboard testing strategy на organizational рівні: 1) Automated layer (CI): axe-core для ARIA/semantic issues (ловить ~30%), Playwright tab sequence для critical paths. 2) Component contracts: кожен shared component має accessibility spec file (`.a11y.spec.ts`) — tab order, keyboard API, ARIA state changes. 3) Manual regression (sprint cycle): keyboard smoke test before release — critical user journeys only (login, main workflow, forms). 4) Screen reader matrix: NVDA+Chrome (Windows), VoiceOver+Safari (macOS), TalkBack (Android) — quarterly full audit або on major releases. 5) User testing: periodic sessions з assistive technology users (real users, not just developers). 6) Bug tracking: `a11y` label в JIRA з severity levels. 7) Playwright recipes: `page.keyboard.press('Tab')` в loop з `expect(page.locator(':focus')).toHaveAttribute('data-testid', expected)`. `page.keyboard.down('Shift'); page.keyboard.press('Tab'); page.keyboard.up('Shift')` для Shift+Tab. Custom `tabToElement(page, selector)` utility. Metrika: a11y debt ratio (open a11y bugs / total bugs), keyboard coverage % of user flows."
    commonMistakes:
      - "Вважають що axe-core = complete keyboard testing — воно тестує ARIA, не keyboard interaction"
      - "Не тестують Shift+Tab (backward navigation) — часто broken"
    relatedQuestions: ["b19t4q4", "b19t1q5"]
---

## Core Concept

**English definition:** Keyboard navigation and focus management encompasses the complete set of patterns and techniques ensuring Angular applications are fully operable via keyboard alone: tabindex management, skip navigation links, focus management during route transitions and modal interactions, roving tabindex for widget navigation, keyboard shortcuts, and comprehensive accessibility testing.

**Пояснення:** Keyboard navigation — це не "optional enhancement", а baseline requirement. ~2.5% користувачів покладаються на клавіатуру (motor disabilities, power users), плюс ~7% використовують screen reader (що також keyboard-driven). WCAG 2.1 Guideline 2.1 "Keyboard Accessible" вимагає що вся функціональність доступна з клавіатури. Angular SPA особливо складна для keyboard через відсутність browser-native page reload lifecycle.

**Яку проблему вирішує:**

- **Tab order chaos:** Позитивні tabindex значення руйнують логічний порядок, нативні non-focusable elements неможливо достягти
- **Focus black hole:** Після модалу/drawer focus зникає, після route transition — залишається на старому місці
- **SPA blindness:** Screen reader не знає про route change бо немає page reload — потрібно programmatic announcement
- **Widget navigation:** Без roving tabindex list/grid потребує сотні Tab для навігації

**Як працює під капотом:**

Tab key ordering в browser:
1. Всі елементи з `tabindex > 0` — по зростанню значення
2. Всі елементи з `tabindex = 0` та нативно focusable — у DOM source order
3. `tabindex = -1` — виключені з sequence

Focus ring: `:focus` CSS pseudo-class активується при будь-якому focus. `:focus-visible` — тільки при keyboard/programmatic focus (browser heuristic). Специфікація `:focus-visible` визначає browser: якщо element is input або focus came from keyboard → show ring.

Programmatic focus: `element.focus()` синхронно переміщує focus. `element.focus({ preventScroll: true })` — без scroll. `element.focus({ focusVisible: true })` — experimental, force :focus-visible.

**Trade-offs та обмеження:**

- `tabindex` на non-interactive elements (div, span) — вимагає також keyboard events і ARIA role
- Global keyboard shortcuts конфліктують з browser shortcuts і screen reader shortcuts
- Focus management є cross-cutting concern — важко централізувати без coordination
- Skip links в SPA потребують router integration для правильної роботи

**Версійність:** Keyboard navigation — standard від Angular 2. `RouterModule` scroll restoration додана в v6.1. Angular CDK `ListKeyManager` — з v7. `takeUntilDestroyed()` (новий cleanup pattern) — з Angular 16. `afterRender()` та `afterNextRender()` для post-render focus — Angular 16+.

## Deep Details

### Edge Cases

**Focus і display:none:** `display:none` видаляє елемент з tab order і Accessibility Tree. `visibility:hidden` — видно в Accessibility Tree (AT може navigate до нього), але фізично не focusable. `opacity:0` — focusable! Tab може потрапити на "невидимий" елемент.

**Programmatic focus timing:** `element.focus()` після `*ngIf` true — елемент ще не в DOM. Потрібно: `afterNextRender(() => el.focus())` або `setTimeout(() => el.focus(), 0)` (microtask) або `ChangeDetectorRef.detectChanges()` + focus.

**Router та focus:** Angular router не переміщує focus за замовчуванням. `scrollPositionRestoration` — тільки scroll. Custom `NavigationEnd` handler потрібен для focus management.

**FocusVisible і programmatic focus:** `element.focus()` в JavaScript — browser може не показати `:focus-visible` ring (залежить від browser policy і recent interaction type). `FocusMonitor.focusVia(el, 'keyboard')` з CDK forces keyboard visual.

**IME composition і keyboard shortcuts:** `event.isComposing === true` — IME input (Japanese, Chinese, Korean) у процесі. Shortcuts не мають спрацьовувати під час composition. Перевіряти `if (event.isComposing) return`.

### Junior vs Senior Understanding

**Junior знає:** tabindex=0 і -1, click і keydown handlers, skip link як HTML pattern.

**Senior розуміє:**

1. **Tab sequence algorithm:** Browser будує sequential focus navigation order за spec (HTML spec § "Sequential focus navigation order"). Розуміє що `tabindex` attribute vs `tabIndex` DOM property — attribute завжди string, property завжди number. `el.tabIndex === -1` за замовчуванням для non-interactive elements.

2. **Focus management lifecycle:** Modal open → save focus → trap → (async operations) → close → restore → announce. Кожен step може fail і потребує error handling.

3. **ARIA focus patterns:** `aria-activedescendant` vs DOM focus — різні use cases. `aria-activedescendant` — focus залишається на container, AT читає referenced element. DOM focus — element фізично focused. Combobox, grid, tree — часто aria-activedescendant.

4. **Route focus strategy:** Announce page title + focus `<main>` — не просто focus на перший interactive element, бо user може хотіти прочитати page heading спочатку.

5. **Keyboard shortcut discovery:** Shortcuts марні якщо user не знає про них. `aria-keyshortcuts` attribute + help dialog (press `?`) — стандартний pattern (GitHub, Gmail).

### Deprecation & Migration Path

- `@HostListener` для global shortcuts — все ще valid, але `fromEvent` RxJS підхід більш flexible і testable
- `Router.navigate()` → scroll і focus management — окремі concerns від routing, Angular не планує вбудовувати focus management в router (на відміну від React Router v6)
- CDK FocusKeyManager і ActiveDescendantKeyManager — stable API, без значних змін

### Connections to Other Concepts

- **CDK A11y** (`cdk-a11y`) — FocusTrap, FocusMonitor, ListKeyManager: building blocks для keyboard navigation
- **ARIA & Semantic HTML** (`aria-angular`) — keyboard navigation потребує ARIA state синхронізації
- **Router** — navigation events для focus management при route transitions
- **Angular Animations** — timing animations з focus management (focus після animation complete)

## Examples

### Basic Usage

```typescript
// Skip navigation link
@Component({
  selector: 'app-root',
  template: `
    <!-- Перший елемент в DOM -->
    <a
      href="#main-content"
      class="skip-link"
      (click)="skipToMain($event)"
    >
      Skip to main content
    </a>

    <app-header></app-header>
    <nav>...</nav>

    <main id="main-content" tabindex="-1">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
    }
    .skip-link:focus {
      top: 0;
    }
  `]
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private liveAnnouncer = inject(LiveAnnouncer);
  private titleService = inject(Title);
  private document = inject(DOCUMENT);

  ngOnInit(): void {
    // Focus management при route transitions
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      // Оголосити нову сторінку screen reader'у
      const title = this.titleService.getTitle();
      this.liveAnnouncer.announce(`Navigated to ${title}`, 'polite');

      // Перемістити focus на main content
      setTimeout(() => {
        const main = this.document.getElementById('main-content');
        main?.focus({ preventScroll: false });
      }, 0);
    });
  }

  skipToMain(event: Event): void {
    event.preventDefault();
    const main = this.document.getElementById('main-content');
    main?.focus({ preventScroll: false });
    main?.scrollIntoView();
  }
}
```

### Production Scenario

```typescript
// Roving tabindex для кастомного toolbar
@Component({
  selector: 'app-toolbar',
  template: `
    <div
      role="toolbar"
      aria-label="Text formatting"
      (keydown)="onKeyDown($event)"
    >
      @for (action of actions; track action.id; let i = $index) {
        <button
          type="button"
          [attr.tabindex]="i === activeIndex ? 0 : -1"
          [attr.aria-pressed]="action.active"
          [attr.aria-label]="action.label"
          [attr.aria-keyshortcuts]="action.shortcut"
          (focus)="activeIndex = i"
          (click)="action.execute()"
        >
          <span aria-hidden="true">{{ action.icon }}</span>
        </button>
      }
    </div>
  `
})
export class ToolbarComponent {
  @Input() actions: ToolbarAction[] = [];
  activeIndex = 0;

  onKeyDown(event: KeyboardEvent): void {
    const len = this.actions.length;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % len;
        this.focusActive();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + len) % len;
        this.focusActive();
        break;
      case 'Home':
        event.preventDefault();
        this.activeIndex = 0;
        this.focusActive();
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex = len - 1;
        this.focusActive();
        break;
    }
  }

  private focusActive(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>(
      '[role="toolbar"] button'
    );
    buttons[this.activeIndex]?.focus();
  }
}

// Global keyboard shortcuts service
@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService implements OnDestroy {
  private shortcuts = new Map<string, () => void>();
  private document = inject(DOCUMENT);
  private subscription: Subscription;

  constructor() {
    this.subscription = fromEvent<KeyboardEvent>(this.document, 'keydown')
      .subscribe(event => this.handleKeyDown(event));
  }

  register(combination: string, handler: () => void): void {
    this.shortcuts.set(combination.toLowerCase(), handler);
  }

  unregister(combination: string): void {
    this.shortcuts.delete(combination.toLowerCase());
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Не обробляти під час IME composition
    if (event.isComposing) return;

    // Не обробляти глобальні shortcuts у input елементах
    const target = event.target as HTMLElement;
    if (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable) return;

    const key = this.serializeKey(event);
    const handler = this.shortcuts.get(key);

    if (handler) {
      event.preventDefault();
      handler();
    }
  }

  private serializeKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
```

### Anti-Example

```typescript
// ❌ Позитивні tabindex — ламає tab order
@Component({
  template: `
    <div tabindex="3">Third</div>  <!-- Tab order: 1→2→3→0 elements -->
    <input tabindex="1" />          <!-- Завжди перше, незалежно від DOM position -->
    <button tabindex="2">Second</button>
    <a href="#">Enters tab sequence late, despite being first visually</a>
  `
})
export class BadTabIndexComponent {}

// ❌ Focus management без error handling
@Component({
  template: `
    <button (click)="openModal()">Open</button>
    <app-modal #modal></app-modal>
  `
})
export class BadFocusComponent {
  @ViewChild('modal') modal!: ModalComponent;
  private document = inject(DOCUMENT);

  openModal(): void {
    // ❌ Зберегти activeElement — правильно
    const trigger = this.document.activeElement;
    this.modal.open();
    // ❌ Але при close — не перевіряємо чи trigger ще в DOM
    this.modal.closed.subscribe(() => {
      (trigger as HTMLElement).focus(); // Може fail якщо trigger removed
    });
  }
}

// ❌ Route navigation без focus announcement
@Component({})
export class BadRouterComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        // ❌ Тільки scroll, без focus management і announcement
        window.scrollTo(0, 0);
      });
  }
}

// ✅ Правильно:
export class GoodRouterComponent implements OnInit {
  private router = inject(Router);
  private liveAnnouncer = inject(LiveAnnouncer);
  private title = inject(Title);
  private document = inject(DOCUMENT);

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        // Оголосити нову сторінку
        this.liveAnnouncer.announce(
          `Page: ${this.title.getTitle()}`, 'polite'
        );
        // Focus на main content
        setTimeout(() => {
          const main = this.document.getElementById('main-content');
          if (main) main.focus({ preventScroll: false });
        }, 0);
      });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Позитивні `tabindex` значення (1, 2, 3...) | Ламає природній DOM-order tab sequence, складно підтримувати | Тільки `tabindex="0"` (в natural order) і `tabindex="-1"` (programmatic only) |
| Focus management без announcement при route change | Screen reader не знає про нову сторінку — SPA здається "frozen" | `NavigationEnd` → `liveAnnouncer.announce(pageTitle)` + focus `<main>` |
| Keyboard shortcut без `isComposing` check | Shortcut спрацьовує під час CJK IME input — руйнує text input | `if (event.isComposing) return` на початку handler |
| `element.focus()` одразу після `*ngIf=true` | Element не в DOM ще — focus fail silently | `afterNextRender(() => el.focus())` або `setTimeout` після CD |
| Click-only handlers на кастомних interactive elements | Keyboard users не можуть активувати — WCAG 2.1.1 violation | `(click)` + `(keydown.enter)` + `(keydown.space)` або використовувати native `<button>` |

## Interview Block

### [L1 — Warm-up] Що таке tabindex і які значення він може приймати? Навіщо уникати позитивних значень?

**Signal being tested:** Чи розуміє кандидат tab sequence механізм і знає чому позитивні значення — антипатерн.

**What the interviewer expects:** Три значення (0, -1, >0), пояснення що positive override DOM order, конкретний наслідок (tab order ламається при додаванні нових елементів).

**How to probe deeper:** "Коли може знадобитись tabindex='-1'?" — focus restoration, roving tabindex pattern, programmatic focus без Tab accessibility.

**Reference answer:** `0` — додає в natural DOM order. `-1` — виключає з Tab але дозволяє `.focus()`. Позитивні значення (`1+`) ставлять елемент на початок sequence, override DOM order — антипатерн бо ламається при будь-якому додаванні елементів. WCAG 2.4.3 вимагає логічний focus order. `tabindex='-1'` потрібний для: dialog trigger (restore focus), roving tabindex inactive items, programmatic focus на landmark.

**Common mistakes:** Думають що `tabindex='1'` = "першим" в хорошому сенсі. Не знають що `-1` ще дозволяє programmatic focus.

---

### [L2 — Mid] Що таке skip navigation links і як їх реалізувати в Angular SPA?

**Signal being tested:** Розуміння keyboard user journey, конкретна технічна реалізація в SPA контексті (не тільки static HTML pattern).

**What the interviewer expects:** Первший елемент в DOM, show on focus, `<main tabindex='-1'>`, SPA problem (route не перезавантажує page → skip link persistent).

**How to probe deeper:** "Чому `<main>` потребує `tabindex='-1'`?" — main нативно non-focusable, `href='#main'` scroll без focus, `tabindex=-1` дозволяє programmatic focus.

**Reference answer:** Skip link — перший DOM елемент: `<a href='#main' class='skip-link'>`. CSS: hidden by default, visible on `:focus`. `<main id='main' tabindex='-1'>` — tabindex=-1 для programmatic focus (main нативно non-focusable). В SPA: `(click)='skipToMain($event); $event.preventDefault()'` + `el.focus()`. Також потрібен на `NavigationEnd` — focus main content після route change.

**Common mistakes:** Skip link hidden і без `:focus` visible — неефективний. `href='#main'` без tabindex на main — scroll без focus.

---

### [L3 — Senior] Як правильно управляти focus при навігації між routes в Angular? Яка проблема виникає при SPA routing?

**Signal being tested:** Розуміння SPA accessibility challenge, технічна реалізація focus + announcement, edge cases з timing і parametric routes.

**What the interviewer expects:** Angular не переміщує focus автоматично, `NavigationEnd` subscriber, `LiveAnnouncer` для page title, timing `setTimeout`, відмінність full navigation vs parametric.

**How to probe deeper:** "Як тестувати що focus правильно переміщується після navigation?" — Playwright `page.keyboard.press('Tab')` + `document.activeElement` assertions.

**Reference answer:** SPA проблема: route change оновлює DOM без browser page load → screen reader не знає про нову сторінку, focus залишається на старому елементі. Рішення: `NavigationEnd` → `liveAnnouncer.announce(pageTitle, 'polite')` + `setTimeout(() => main?.focus(), 0)`. `<main tabindex='-1'>` обов'язковий. Parametric routes (/user/1→/user/2) — лише оновлення даних, focus може не переміщуватись.

**Common mistakes:** Focus на `<router-outlet>` замість `<main>`. Не оголошують page title — screen reader "мовчить". setTimeout потрібен для DOM update.

---

### [L4 — Staff/Principal] Як тестувати keyboard navigation в Angular додатку? Що включає повноцінна стратегія тестування?

**Signal being tested:** Системне мислення про accessibility testing pyramid, розуміння обмежень automated tools, organizational процес.

**What the interviewer expects:** Multi-layer strategy (automated CI, component specs, manual checklist, screen reader matrix, user testing), конкретні tools і metrics.

**How to probe deeper:** "Що робить хороший keyboard navigation component test?" — tab sequence, arrow navigation, Escape close, focus restoration, ARIA state sync.

**Reference answer:** Testing pyramid: automated (axe-playwright в CI — ~30% coverage), component a11y specs (TestBed + keyboard dispatch), E2E tab sequence (Playwright), manual checklist (sprint), screen reader matrix quarterly (NVDA+Chrome, VoiceOver+Safari). Custom `tabToElement(page, selector)` utility. Metrics: a11y debt ratio, keyboard coverage % of user flows. User testing з real AT users — незамінний.

**Common mistakes:** axe-core = complete audit. Не тестують Shift+Tab. Не включають screen reader manual testing.

## Summary

### Key Points

- `tabindex`: тільки `0` (natural order) і `-1` (programmatic-only). Позитивні значення — антипатерн що ламає tab sequence.
- Skip link — перший DOM елемент, показується при `:focus`, `<main tabindex='-1'>` для programmatic focus destination.
- SPA routing проблема: Angular не переміщує focus при navigation. Рішення: `NavigationEnd` → `LiveAnnouncer` + focus `<main>`.
- Roving tabindex: один `tabindex=0` в групі, решта `-1`, стрілки переміщують активний. CDK `ListKeyManager` реалізує це.
- Keyboard shortcuts: перевіряти `event.isComposing` (IME), не обробляти в input/textarea, `aria-keyshortcuts` для AT announcement.
- Focus management lifecycle: open → save focus → FocusTrap → close → restore focus → announce.
- Testing: automated axe (30% coverage) + component specs + Playwright tab sequence + manual screen reader matrix.

### Elevator Pitch (2 minutes)

Keyboard navigation в Angular SPA — це не просто `tabindex` на елементах. Головна проблема: SPA не перезавантажує сторінку при navigation — screen reader не знає про change. Рішення: `Router.events NavigationEnd` → `LiveAnnouncer.announce(pageTitle)` + focus `<main id='main-content' tabindex='-1'>`.

Три ключових pattern: 1) Skip navigation link — перший DOM елемент, visible on focus. 2) Roving tabindex для widgets (toolbar, listbox) — один tabstop на widget, стрілки всередині. 3) Focus restoration для overlays — зберегти trigger, restore після close.

`tabindex` правило: тільки 0 і -1. Позитивні значення — антипатерн що override DOM order. CDK `ListKeyManager` і `FocusTrap` — building blocks для правильної keyboard architecture. Testing: automated axe + Playwright tab sequences + manual screen reader testing quarterly.
