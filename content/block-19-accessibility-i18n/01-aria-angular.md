---
title: "ARIA & Semantic HTML in Angular"
block: 19
topic: 1
slug: "aria-angular"
difficulty: 2
sinceVersion: "2"
tags: ["ARIA", "accessibility", "a11y", "semantic HTML", "role", "aria-label", "aria-describedby", "screen reader"]
relatedTopics: ["cdk-a11y", "keyboard-navigation", "angular-animations"]
interviewQuestions:
  - level: "junior"
    question: "Що таке ARIA і навіщо воно потрібне в Angular-додатках?"
    referenceAnswers:
      junior: "ARIA (Accessible Rich Internet Applications) — це набір атрибутів HTML, що допомагають screen reader'ам розуміти інтерактивні елементи. В Angular ці атрибути додаються як звичайні HTML атрибути або через attribute binding."
      mid: "ARIA вирішує проблему доступності кастомних UI-компонентів, які не мають семантики за замовчуванням. Наприклад, `<div>` що виглядає як кнопка — для screen reader це просто текст. Додавши `role='button'`, `aria-pressed`, `tabindex='0'` — ми робимо його доступним. В Angular dynamic ARIA атрибути прив'язуються через `[attr.aria-label]='expression'`."
      senior: "ARIA — це контракт між веб-додатком і Accessibility API операційної системи (MSAA, IAccessible2, ATK/AT-SPI на Linux, AX API на macOS). Screen reader не читає DOM напряму — він звертається до Accessibility Tree, який браузер будує з DOM + ARIA. Помилкове використання ARIA (наприклад, додавання `role='button'` до елемента без `tabindex`) створює 'accessibility illusion' — screen reader оголошує елемент доступним, але клавіатурний користувач не може на нього потрапити. Перший принцип: semantic HTML ЗАВЖДИ кращий за ARIA — `<button>` з коробки має role, tabindex, keyboard events. ARIA потрібна тільки коли семантичного HTML недостатньо."
      staff: "На рівні organization ARIA compliance — це юридичний ризик (ADA, Section 508, EN 301 549 в Євросоюзі). В Angular-проєктах системна проблема — компоненти UI-бібліотеки (Material, PrimeNG) мають ARIA, але кастомні feature-компоненти часто ні. Архітектурне рішення: впровадити a11y audit як частину CI (axe-core, lighthouse в GitHub Actions), визначити component accessibility contract (кожен shared компонент повинен мати: role, aria-label або labelledby, keyboard handling, focus visible стилі). Для продуктових команд це означає: a11y acceptance criteria в definition of done, periodic audit з real assistive technology (NVDA + Chrome, VoiceOver + Safari), та accessibility regression testing."
    commonMistakes:
      - "Додають ARIA атрибути до semantic HTML елементів (наприклад aria-role='button' на <button>) — це redundant та може заплутати screen reader"
      - "Плутають aria-label (задає ім'я) і aria-describedby (задає опис) — різна семантика"
    relatedQuestions: ["b19t1q2", "b19t2q1"]
  - level: "mid"
    question: "Як правильно прив'язувати ARIA атрибути в Angular шаблонах? Яка різниця між [attr.aria-label] і aria-label?"
    referenceAnswers:
      junior: "В Angular для dynamic ARIA атрибутів використовується `[attr.aria-label]='expression'`. Статичний `aria-label='text'` — просто HTML атрибут."
      mid: "Angular розрізняє property binding `[prop]` і attribute binding `[attr.name]`. Для ARIA потрібно attribute binding, бо ARIA атрибути не є DOM properties — вони є HTML attributes. `[attr.aria-label]='label || null'` — якщо expression null/undefined, атрибут видаляється з DOM (важливо для screen reader, щоб не бачив порожній aria-label). Різниця: `aria-label='static text'` — завжди присутній, `[attr.aria-label]='dynamicLabel'` — реагує на зміну даних."
      senior: "Attribute binding через `[attr.*]` використовує `Renderer2.setAttribute/removeAttribute` під капотом в Ivy. Важливий edge case: `[attr.aria-label]='value'` де value є `false` (boolean) — встановить рядок 'false' в атрибут, не видалить його. Треба явно писати `[attr.aria-label]='value || null'`. Для aria-hidden специфічний підводний камінь: `[attr.aria-hidden]='isHidden'` де isHidden=false встановить `aria-hidden='false'` — це NOT те саме що відсутній атрибут для деяких screen reader'ів. Angular Material вирішує це через `AriaDescriber` service. Також: aria-label vs aria-labelledby — labelledby referencing видимий текст кращий за label з точки зору maintenance."
      staff: "З архітектурної точки зору, управління ARIA state у великих додатках потребує систематичного підходу. ARIA атрибути, що залежать від стану компонента (aria-expanded, aria-selected, aria-checked), мають бути частиною state model, а не розкидані по темплейту. В signal-based компонентах: computed() для похідного ARIA state. Для design system — abstraction layer над ARIA: компонент Button не exposed aria-label — замість цього він приймає `accessibleLabel` input, що enforce правильне використання. Pattern: accessibility directives (як cdkTrapFocus) краще ніж inline ARIA на кожному компоненті — це DRY та testable."
    commonMistakes:
      - "Використовують property binding [aria-label] замість attribute binding [attr.aria-label] — це не працює бо aria-label не є DOM property"
      - "Не обробляють null/undefined — порожній aria-label гірший ніж відсутній"
    relatedQuestions: ["b19t1q3", "b19t1q1"]
  - level: "mid"
    question: "Що таке aria-live region і коли його використовувати в Angular?"
    referenceAnswers:
      junior: "aria-live — це атрибут, що повідомляє screen reader про динамічні зміни в DOM без перефокусування."
      mid: "aria-live region оголошує зміни контенту screen reader'ам асинхронно. Значення: `polite` — оголошує при паузі користувача (підходить для більшості сповіщень), `assertive` — перериває поточне оголошення (тільки для критичних помилок), `off` — вимикає оголошення. В Angular: LiveAnnouncer з CDK — більш надійний спосіб ніж ручний aria-live, бо управляє DOM injection та cleanup."
      senior: "aria-live має декілька проблем в SPA: 1) Якщо елемент з aria-live з'являється в DOM вже з текстом — деякі screen reader'и його ігнорують (region має бути порожнім при першому рендері). 2) Rapid updates — тільки останній update оголошується. 3) aria-atomic='true' — оголошує весь region, не тільки змінену частину. 4) aria-relevant (additions/removals/text) — контролює що саме оголошується. In Angular, CDK LiveAnnouncer вирішує проблему №1 через dynamic DOM injection. Додатково: `aria-live='assertive'` слід уникати — він перериває navigation і читання, що руйнує UX для screen reader користувачів."
      staff: "Для enterprise-рівня: aria-live strategy має бути централізованою — не кожен компонент сам керує своїми live regions (ризик race conditions, duplicate announcements). CDK LiveAnnouncer як singleton service — правильний підхід. На рівні системи: notification/toast service повинен мати built-in accessibility (aria-live, politeness рівень залежно від severity). Тестування: screen reader announces важко автоматизувати — axe-core не перевіряє aria-live контент. Підхід: manual testing matrix (NVDA/JAWS/VoiceOver) як частина QA для компонентів зі dynamic content. В Angular Universal/SSR: aria-live regions не мають сенсу на сервері — потрібна guard `isPlatformBrowser()`."
    commonMistakes:
      - "Додають aria-live region з вже заповненим контентом при першому рендері — screen reader'и часто ігнорують початкове значення"
      - "Використовують assertive для всіх сповіщень — це руйнує UX, лише для критичних помилок"
    relatedQuestions: ["b19t2q2", "b19t1q4"]
  - level: "senior"
    question: "Як реалізувати доступний кастомний dropdown компонент в Angular? Які ARIA патерни потрібні?"
    referenceAnswers:
      junior: "Кастомний dropdown потребує role='combobox' або role='listbox', управління клавіатурою, та aria атрибутів для стану відкрито/закрито."
      mid: "За ARIA Authoring Practices (APG) для listbox: контейнер має `role='combobox'` або trigger з `aria-haspopup='listbox'`, `aria-expanded`, `aria-controls` (вказує на id listbox). Listbox: `role='listbox'`, options: `role='option'`, `aria-selected`. Клавіатура: Enter/Space відкриває, Escape закриває, стрілки навігують по options. Angular Material Select реалізує цей патерн як reference."
      senior: "ARIA APG розрізняє два патерни для combobox: Select-only (немає вводу тексту) і editable combobox (з input). Для select-only: trigger button з `aria-haspopup='listbox'`, `aria-expanded`, `aria-labelledby`. Listbox з `aria-activedescendant` — вказує на id активного option без переміщення DOM focus (focus залишається на trigger). Це критично: переміщення DOM focus до listbox при відкритті = правильно для editable combobox, неправильно для select-only. Також: `aria-multiselectable` для multi-select, `aria-disabled` для disabled options. Тестування: обов'язково з NVDA+Firefox та VoiceOver+Safari — вони по-різному обробляють listbox патерни."
      staff: "Розробка accessible dropdown для design system — це підготовка 'accessibility contract' для консумерів. Компонент має: 1) документований keyboard interaction model, 2) configurable aria-label/labelledby (не hardcoded), 3) events для focus management (onClose — return focus to trigger), 4) не припускає контекст використання. Типова проблема: dropdown всередині modal — FocusTrap захоплює focus, і якщо dropdown відкривається поза trap boundary — screen reader губиться. Рішення: renderning в CDK Overlay (portals), що правильно координується з FocusTrap. На рівні організації: ARIA патерни для shared components мають бути reviewed a11y спеціалістом — розробники часто не знають всіх нюансів APG spec."
    commonMistakes:
      - "Переміщують DOM focus до listbox замість використання aria-activedescendant — неправильний патерн для select-only combobox"
      - "Забувають повернути focus на trigger при закритті dropdown"
      - "Не реалізують Escape для закриття"
    relatedQuestions: ["b19t2q1", "b19t4q1"]
  - level: "staff"
    question: "Як забезпечити WCAG 2.1 AA compliance в великому Angular enterprise-додатку? Як побудувати процес?"
    referenceAnswers:
      junior: "WCAG 2.1 AA — це стандарт доступності. Треба перевіряти кольоровий контраст, додавати alt до зображень, і забезпечити навігацію з клавіатури."
      mid: "WCAG 2.1 AA включає: contrast ratio 4.5:1 для тексту, 3:1 для великого тексту та UI елементів, keyboard navigability, focus visible indicators, alternative text, form labels, error identification. Інструменти: axe-core, Lighthouse, WAVE browser extensions для аудиту."
      senior: "Системний підхід до WCAG AA: 1) Automated testing (axe-core в Jest/Playwright ловить ~30% issues), 2) Manual keyboard testing, 3) Screen reader testing (NVDA+Chrome для Windows, VoiceOver+Safari для macOS/iOS). Критичні WCAG 2.1 критерії для SPA: 4.1.3 Status Messages (aria-live для async результатів), 2.4.7 Focus Visible, 2.5.3 Label in Name, 1.4.10 Reflow (zoom 400%). Angular-специфічне: route transitions повинні переміщати focus (WCAG 2.4.3), dynamic content updates потребують live regions."
      staff: "Для enterprise: WCAG compliance — це program, не project. Структура: 1) Automated gates в CI (axe-playwright блокує merge при нових violations), 2) Component library — кожен shared component має accessibility spec та playwright a11y test, 3) Design system review — designers перевіряють contrast та touch target size до implementation, 4) Developer education — internal workshops, a11y champions у кожній команді, 5) Periodic manual audits з external a11y consultant (quarterly), 6) Bug triage — severity mapping (blocker: не можна виконати core task, critical: major difficulty, major: workaround є). Метрики: accessibility compliance score в quarterly report. Юридично: documenting accessibility policy та VPAT (Voluntary Product Accessibility Template) для enterprise B2B. Angular specifics: покрити route focus management (single hook в AppComponent), skip navigation (один раз на app level), та form validation messaging (один pattern, shared FormFieldComponent)."
    commonMistakes:
      - "Вважають що axe-core = full a11y audit — автоматика ловить тільки ~30% проблем"
      - "Додають ARIA атрибути як afterthought, замість проектування з accessibility першочергово"
      - "Не тестують з реальними screen reader + browser комбінаціями"
    relatedQuestions: ["b19t1q4", "b19t4q3"]
---

## Core Concept

**English definition:** ARIA (Accessible Rich Internet Applications) is a W3C specification that defines a set of HTML attributes enabling developers to describe the semantics, state, and properties of custom UI components to assistive technologies (screen readers, braille displays, switch controls).

**Пояснення:** ARIA — це міст між DOM і Accessibility Tree. Коли ви створюєте кастомний компонент (дропдаун, модал, таблиця з сортуванням), браузер не знає що це за UI-патерн. ARIA атрибути ("role", "aria-*") повідомляють браузер і assistive technology: "цей div — це кнопка", "це модальне вікно відкрите", "цей елемент списку вибраний". Angular надає повну підтримку ARIA через attribute binding та CDK.

**Яку проблему вирішує:** Без ARIA кастомні інтерактивні компоненти невидимі для screen reader'ів. `<div onclick="...">` виглядає як клікабельний елемент візуально, але screen reader оголошує його як "div" без жодної interactive семантики. Близько 7.5 мільйонів людей в США використовують assistive technology — без ARIA ваш додаток для них просто недоступний.

**Як працює під капотом:**

Браузер підтримує два паралельних дерева: DOM Tree (для rendering) та Accessibility Tree (для assistive technology). Accessibility Tree будується з:
1. Native HTML semantics (`<button>`, `<nav>`, `<main>` — мають implicit ARIA roles)
2. Explicit ARIA attributes (`role`, `aria-label`, `aria-expanded` тощо)
3. CSS visibility (`display:none`, `visibility:hidden` видаляє з Accessibility Tree; `opacity:0` — ні)

Screen reader взаємодіє не з DOM напряму, а з платформенним Accessibility API:
- **Windows**: MSAA / IAccessible2 / UI Automation
- **macOS/iOS**: NSAccessibility / AXUIElement
- **Linux**: AT-SPI2

Angular's change detection оновлює DOM → браузер оновлює Accessibility Tree → screen reader отримує нотифікацію через OS API.

**Trade-offs та обмеження:**

- **ARIA не додає функціональність** — `role='button'` не додає клавіатурні events, focus management, cursor style. Це тільки семантична аннотація. Все потрібно реалізувати окремо.
- **Перший принцип:** семантичний HTML > ARIA. `<button>` завжди кращий за `<div role='button'>`.
- **ARIA може зашкодити** — неправильне використання (зайві roles, конфліктуючі стани) гірше за відсутність ARIA.
- **Browser/AT compatibility** — різні screen reader + browser комбінації обробляють ARIA по-різному. NVDA+Chrome ≠ VoiceOver+Safari.

**Версійність:** ARIA підтримується в Angular з версії 2. Angular Material надає ARIA підтримку в компонентах з v2, CDK A11y module — з v7. WCAG 2.1 опублікований у 2018, WCAG 2.2 у 2023 (додав нові criteria). Angular Material 3 (MDC-based, v15+) покращив ARIA coverage відповідно до ARIA APG 1.2.

## Deep Details

### Edge Cases

**aria-hidden та focus:** `aria-hidden='true'` приховує елемент від screen reader, але якщо елемент є focusable — focus може потрапити на "невидимий" елемент. Завжди разом з `aria-hidden='true'` треба додавати `tabindex='-1'` або видаляти focusability.

**aria-label і aria-labelledby пріоритет:** Якщо обидва присутні — `aria-labelledby` перемагає (вищий пріоритет). Якщо `aria-labelledby` reference на невидимий (aria-hidden) елемент — деякі AT ігнорують його.

**Dynamic roles:** Зміна `role` атрибуту в runtime (через Angular binding) не завжди коректно обробляється screen reader'ами. Краще управляти `aria-hidden` для show/hide, ніж динамічно міняти role.

**Boolean атрибути:** `aria-expanded='false'` — це рядок, не boolean. В Angular `[attr.aria-expanded]='isExpanded'` де isExpanded=false → встановить рядок `'false'`, що є коректним. Але `[attr.aria-hidden]='!isVisible'` де !isVisible=false → `'false'`. Різниця: `aria-hidden='false'` НЕ повністю ідентичне відсутньому aria-hidden атрибуту в деяких AT.

### Junior vs Senior Understanding

**Junior знає:** як додати `aria-label` на елемент, що роль `button` дає семантику кнопки.

**Senior розуміє:**
1. **Accessibility Tree vs DOM** — це різні структури. CSS `display:none` видаляє з обох, `visibility:hidden` — тільки з DOM (AT ще бачить), `opacity:0` — з жодного.
2. **ARIA authoring practices** — W3C APG описує конкретні patterns (dialog, combobox, tree, tabs) з точними вимогами до keyboard interaction та ARIA атрибутів.
3. **Announcement timing** — screen reader не оголошує кожну DOM зміну миттєво. Зміни в aria-live regions — асинхронні, з debounce.
4. **Name Calculation Algorithm** — браузер обчислює "accessible name" за алгоритмом: aria-labelledby > aria-label > label element > title > placeholder > text content.
5. **Focus management після dynamic content** — коли з'являється modal/toast/error — де потрібно перемістити focus (в modal — на перший focusable елемент або modal heading; на toast — зазвичай не переміщаємо focus, використовуємо aria-live).

### Deprecation & Migration Path

Немає прямих deprecations для ARIA в Angular, але практики еволюціонували:
- **ARIA 1.0 → 1.1 → 1.2:** Деякі implicit roles змінились (наприклад, `<section>` без label більше не має implicit landmark role в ARIA 1.2).
- **Angular Material Upgrades:** Перехід з MDC (v15+) покращив ARIA compliance — компоненти автоматично отримали кращий coverage при міграції. `ng update @angular/material` для автоматичної міграції.

### Connections to Other Concepts

- **CDK A11y** (`cdk-a11y`) — higher-level ARIA utilities: FocusTrap, LiveAnnouncer, FocusMonitor
- **Keyboard Navigation** (`keyboard-navigation`) — ARIA семантика без keyboard support = incomplete accessibility
- **Angular Material** — reference implementation ARIA patterns для Angular
- **Testing** — axe-core integration для автоматичного ARIA audit

## Examples

### Basic Usage

```typescript
// Базове використання ARIA атрибутів в Angular темплейті
@Component({
  selector: 'app-notification',
  template: `
    <!-- Semantic HTML — найкращий підхід -->
    <button
      type="button"
      [attr.aria-pressed]="isLiked"
      [attr.aria-label]="isLiked ? 'Unlike post' : 'Like post'"
      (click)="toggleLike()"
    >
      <span aria-hidden="true">♥</span>
      {{ isLiked ? 'Liked' : 'Like' }}
    </button>

    <!-- aria-live region для динамічних повідомлень -->
    <!-- ВАЖЛИВО: region має бути порожнім при першому рендері -->
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ statusMessage }}
    </div>

    <!-- Форма з proper labeling -->
    <form>
      <div class="field">
        <label [attr.for]="fieldId">Email address</label>
        <input
          [id]="fieldId"
          type="email"
          [attr.aria-required]="isRequired"
          [attr.aria-invalid]="hasError"
          [attr.aria-describedby]="hasError ? errorId : null"
        />
        @if (hasError) {
          <span [id]="errorId" role="alert">
            {{ errorMessage }}
          </span>
        }
      </div>
    </form>
  `
})
export class NotificationComponent {
  isLiked = false;
  statusMessage = '';
  fieldId = 'email-field';
  errorId = 'email-error';
  isRequired = true;
  hasError = false;
  errorMessage = '';

  toggleLike(): void {
    this.isLiked = !this.isLiked;
    // Оновлення aria-live region — screen reader оголосить зміну
    this.statusMessage = this.isLiked ? 'Post liked' : 'Post unliked';
  }
}
```

### Production Scenario

```typescript
// Кастомний accordion компонент з повною ARIA підтримкою
@Component({
  selector: 'app-accordion',
  template: `
    @for (item of items; track item.id; let i = $index) {
      <div class="accordion-item">
        <h3>
          <button
            type="button"
            [attr.id]="'accordion-header-' + item.id"
            [attr.aria-expanded]="expandedId === item.id"
            [attr.aria-controls]="'accordion-panel-' + item.id"
            class="accordion-trigger"
            (click)="toggle(item.id)"
            (keydown)="onKeyDown($event, i)"
          >
            {{ item.title }}
            <span aria-hidden="true" class="icon">
              {{ expandedId === item.id ? '▲' : '▼' }}
            </span>
          </button>
        </h3>
        <div
          [attr.id]="'accordion-panel-' + item.id"
          [attr.aria-labelledby]="'accordion-header-' + item.id"
          role="region"
          [hidden]="expandedId !== item.id"
        >
          {{ item.content }}
        </div>
      </div>
    }
  `
})
export class AccordionComponent {
  @Input() items: AccordionItem[] = [];
  expandedId: string | null = null;

  toggle(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const buttons = this.getButtons();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        buttons[(index + 1) % buttons.length]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        buttons[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        buttons[buttons.length - 1]?.focus();
        break;
    }
  }

  private getButtons(): HTMLButtonElement[] {
    return Array.from(
      document.querySelectorAll('.accordion-trigger')
    ) as HTMLButtonElement[];
  }
}
```

### Anti-Example

```typescript
// НЕПРАВИЛЬНО: Div soup без семантики
@Component({
  template: `
    <!-- ❌ Div без role і keyboard support -->
    <div class="btn" (click)="save()">Save</div>

    <!-- ❌ Зображення без alt -->
    <img src="logo.png" />

    <!-- ❌ Icon-only button без accessible name -->
    <button (click)="close()">✕</button>

    <!-- ❌ Custom checkbox без ARIA -->
    <div class="checkbox" [class.checked]="isChecked" (click)="toggle()">
      <div class="checkmark"></div>
    </div>

    <!-- ❌ Form label не пов'язаний з input -->
    <label>Username</label>
    <input type="text" />
  `
})
export class BadAccessibilityComponent {}

// ПРАВИЛЬНО:
@Component({
  template: `
    <!-- ✅ Semantic button -->
    <button type="button" (click)="save()">Save</button>

    <!-- ✅ Image з alt -->
    <img src="logo.png" alt="Company Logo" />

    <!-- ✅ Icon button з aria-label -->
    <button type="button" aria-label="Close dialog" (click)="close()">
      <span aria-hidden="true">✕</span>
    </button>

    <!-- ✅ Custom checkbox з ARIA -->
    <div
      role="checkbox"
      [attr.aria-checked]="isChecked"
      tabindex="0"
      (click)="toggle()"
      (keydown.space)="toggle(); $event.preventDefault()"
      (keydown.enter)="toggle()"
    >
      <div class="checkmark" aria-hidden="true"></div>
      <span class="sr-only">Accept terms</span>
    </div>

    <!-- ✅ Пов'язаний label -->
    <label for="username">Username</label>
    <input id="username" type="text" />
  `
})
export class GoodAccessibilityComponent {}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `<div (click)="...">` без `role` і `tabindex` | Screen reader не бачить як interactive, клавіатурний юзер не може навігувати | Використовувати `<button>` або додати `role`, `tabindex='0'`, keyboard handlers |
| `<img src="...">` без `alt` | Screen reader оголошує filename або пропускає — незрозуміло | Додати `alt='description'` для informative, `alt=''` для decorative images |
| Порожній `aria-label=''` | Деякі AT оголошують пустий label — гірше за відсутній | Використовувати `[attr.aria-label]='value || null'` — null видаляє атрибут |
| `aria-hidden='true'` на focusable елементі | Screen reader не бачить, але focus потрапляє — "phantom focus" | Додати `tabindex='-1'` або `disabled` разом з `aria-hidden='true'` |
| Кольоровий контраст тільки через CSS class | Зміна теми/dark mode може зламати contrast ratio | Перевіряти contrast в design system level, automated Lighthouse checks в CI |

## Interview Block

### [L1 — Warm-up] Що таке ARIA і навіщо воно потрібне в Angular-додатках?

**Signal being tested:** Розуміє чи кандидат базову мету ARIA — не просто "знає термін", а може пояснити яку проблему вирішує.

**What the interviewer expects:** Кандидат пов'язує ARIA з assistive technology, розуміє що HTML semantics і ARIA разом будують Accessibility Tree, знає що semantic HTML кращий за кастомний ARIA.

**How to probe deeper:** "Якщо ми вже маємо `<button>`, навіщо додавати `role='button'`?" — правильна відповідь: не потрібно, це redundant.

**Reference answer:** ARIA вирішує проблему кастомних UI-компонентів. `<div>` що виглядає як dropdown — для screen reader просто текст. ARIA атрибути (`role`, `aria-expanded`, `aria-haspopup`) повідомляють assistive technology про семантику. В Angular — `[attr.aria-label]='expression'` для dynamic ARIA. Перший принцип: semantic HTML завжди пріоритет над ARIA.

**Common mistakes:** Кандидати думають що ARIA додає функціональність (keyboard handling, focus) — ні, тільки семантику. Плутають `aria-label` (задає name) з `aria-describedby` (задає description).

---

### [L2 — Mid] Як правильно прив'язувати ARIA атрибути в Angular шаблонах? Яка різниця між `[attr.aria-label]` і `aria-label`?

**Signal being tested:** Чи розуміє кандидат різницю між Angular property binding і attribute binding, і чому для ARIA потрібен attribute binding.

**What the interviewer expects:** Пояснення що ARIA — це HTML attributes, не DOM properties. Знання що `null` видаляє атрибут. Обізнаність з edge cases (false як рядок).

**How to probe deeper:** "Що станеться якщо написати `[aria-label]='text'` без `attr.` prefix?" — відповідь: Angular спробує знайти DOM property `ariaLabel` (в сучасних браузерах є через ARIAMixin), але це ненадійно і залежить від браузера.

**Reference answer:** ARIA атрибути мають існувати як HTML attributes в DOM, тому потрібен `[attr.aria-label]='expression'`. `[attr.aria-label]='value || null'` — null видаляє атрибут (порожній aria-label гірший за відсутній). Для boolean aria атрибутів (aria-expanded, aria-pressed) — Angular встановлює рядок 'true'/'false', що є коректним.

**Common mistakes:** `[aria-label]` без `attr.` prefix — property binding шукає DOM property, може непередбачувано. Не null-checking — порожній aria-label оголошується screen reader'ом як пуста назва.

---

### [L3 — Senior] Як реалізувати доступний кастомний dropdown компонент в Angular? Які ARIA патерни потрібні?

**Signal being tested:** Чи знає кандидат ARIA Authoring Practices, може реалізувати конкретний accessibility pattern, розуміє різницю між focus management підходами.

**What the interviewer expects:** Конкретні ARIA атрибути (aria-haspopup, aria-expanded, aria-controls, role='listbox', role='option', aria-selected, aria-activedescendant), keyboard model, choice між focus approaches.

**How to probe deeper:** "Чому ми використовуємо `aria-activedescendant` замість переміщення DOM focus на option?" — пояснення select-only vs editable combobox pattern.

**Reference answer:** За ARIA APG для select-only combobox: trigger button з `aria-haspopup='listbox'`, `aria-expanded`, `aria-controls`. При відкритті — `aria-activedescendant` вказує на id активного option (focus залишається на trigger). Options: `role='option'`, `aria-selected`. Keyboard: ArrowUp/Down — навігація, Enter — вибір, Escape — закриття. CDK Overlay для rendering поза поточним DOM контекстом.

**Common mistakes:** Переміщення DOM focus на listbox (правильно тільки для editable combobox). Забувають повернути focus при закритті. Не реалізують keyboard navigation.

---

### [L4 — Staff/Principal] Як забезпечити WCAG 2.1 AA compliance в великому Angular enterprise-додатку? Як побудувати процес?

**Signal being tested:** Системне мислення про accessibility як organizational capability, не як технічну задачу. Розуміння балансу automated vs manual testing, процесів і метрик.

**What the interviewer expects:** Архітектурний підхід: CI gates, design system ownership, developer education, audit cadence. Розуміння обмежень automated tools (~30% coverage).

**How to probe deeper:** "Як би ви визначили severity для accessibility bugs?" — class: blocker (неможливо виконати task), critical (major difficulty), major (workaround є).

**Reference answer:** WCAG compliance — це program: CI automated gates (axe-playwright), component library accessibility specs, design review для contrast/touch targets, developer a11y champions, quarterly manual audits з external consultant. Метрики і bug severity triage для tracking progress. Angular-специфічно: централізований route focus management, skip navigation, shared FormFieldComponent для consistent error messaging.

**Common mistakes:** Вважають axe-core = complete audit. ARIA як afterthought. Не тестують з реальними AT combinations.

## Summary

### Key Points

- ARIA — це семантичні аннотації для Accessibility Tree, не функціональність. Semantic HTML завжди пріоритетніший за ARIA.
- В Angular ARIA атрибути прив'язуються через `[attr.aria-label]='value || null'` — null видаляє атрибут.
- aria-live regions мають бути порожніми при першому рендері; CDK LiveAnnouncer вирішує це надійніше.
- WCAG 2.1 AA є юридичною вимогою в багатьох країнах та стандартом для enterprise-продуктів.
- Automated tools (axe-core) ловлять ~30% accessibility issues — ручне тестування з AT незамінне.
- Кожен кастомний interactive компонент потребує: role, accessible name, keyboard handling, focus management.
- Angular Material реалізує ARIA APG патерни і є reference implementation для кастомних компонентів.

### Elevator Pitch (2 minutes)

ARIA — це W3C специфікація атрибутів що будують семантичний міст між DOM і assistive technology через OS Accessibility API. Браузер підтримує два паралельних дерева: DOM (для rendering) та Accessibility Tree (для AT). ARIA атрибути — role, aria-*, — заповнюють семантичні прогалини кастомних компонентів, які нативний HTML не виражає.

В Angular ARIA додається через attribute binding: `[attr.aria-expanded]='isOpen'`, `[attr.aria-label]='title || null'`. Null видаляє атрибут — порожній aria-label гірший за відсутній. Перший принцип: semantic HTML кращий за ARIA — `<button>` завжди кращий за `<div role='button'>`, бо button з коробки має role, keyboard events, focus management.

Для enterprise-рівня: compliance = process. CI gates з axe-core ловлять ~30% issues автоматично. Решта — manual testing з NVDA+Chrome, VoiceOver+Safari, keyboard-only navigation. Design system ownership accessibility contracts, developer education, quarterly audits з AT specialists.
