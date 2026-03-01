---
title: "Client-Side Hydration"
block: 17
topic: 2
slug: "hydration"
difficulty: 4
sinceVersion: "17"
tags: ["hydration", "provideClientHydration", "incremental hydration", "@defer hydration", "DOM reuse", "hydration mismatch"]
relatedTopics: ["angular-universal", "prerendering", "change-detection", "defer-blocks"]
interviewQuestions:
  - level: "junior"
    question: "Що таке hydration в Angular і чим вона відрізняється від звичайного SSR?"
    referenceAnswers:
      junior: "Hydration — це коли Angular 'оживляє' HTML що прийшов з сервера, замість того щоб видаляти його і рендерити знову. Це швидше і немає мерехтіння сторінки."
      mid: "Без hydration Angular знищував SSR HTML і робив full re-render на клієнті — це нівелювало перевагу SSR (Flash of Unstyled Content, зайва робота). З hydration Angular проходить по існуючому SSR DOM, зіставляє його з компонентним деревом, прикріплює event listeners і відновлює стан — без знищення і повторного створення DOM nodes. provideClientHydration() вмикає цей режим."
      senior: "Hydration — це process of reusing server-rendered DOM замість full bootstrap re-render. Angular використовує DOM node annotations (спеціальні коментарі та атрибути) під час SSR для mapping DOM → LView tree на клієнті. Процес: 1) SSR рендер вставляє DOM annotations, 2) На клієнті Angular читає ці annotations під час bootstrap, 3) Замість createElement() Angular виконує 'claim' існуючих DOM nodes, 4) Event listeners прикріплюються до existing elements, 5) Signals і change detection підключаються. Якщо DOM відрізняється від того що Angular очікує — hydration mismatch error."
      staff: "Hydration — це reconciliation між server-rendered DOM і client-side LView tree. LView (Logical View) — internal Angular data structure що описує компонент. При normal bootstrap Angular створює LView і DOM одночасно. При hydration Angular створює LView але 'claims' existing DOM nodes замість createElement. Архітектурне значення: hydration потребує deterministic rendering — однаковий output на server і client. Це обмежує: Date.now(), Math.random(), browser-specific APIs в template — все це може cause mismatch. В Angular 19 incremental hydration + event replay = skip hydration для invisible content і не пропускати events під час hydration. Performance impact: hydration зменшує Time to Interactive (TTI) бо немає DOM churn, але збільшує initial JS parse time (треба скачати Angular для hydration)."
    commonMistakes:
      - "Думають що hydration = SSR — це різні речі: SSR генерує HTML, hydration клієнт-сайд процес"
      - "Не знають що без hydration Angular видаляв SSR DOM і рендерив заново"
    relatedQuestions: ["b17t2q2", "b17t1q1"]
  - level: "mid"
    question: "Що таке hydration mismatch і як його налагодити?"
    referenceAnswers:
      junior: "Hydration mismatch — коли HTML з сервера відрізняється від того що Angular генерує на клієнті. Angular виводить помилку в консоль."
      mid: "Mismatch виникає коли server render і client render генерують різний DOM. Причини: Date.now() або Math.random() в шаблоні, browser-specific APIs що не доступні на сервері (відповідно, різні значення), різні дані між server і client renders. Angular в development mode виводить детальну помилку з вказівкою на конкретний DOM node. Для налагодження: ngSkipHydration атрибут на компоненті тимчасово вимикає hydration для цього subtree."
      senior: "Hydration mismatch — runtime error що виникає коли Angular намагається 'claim' DOM node але знаходить несподіване. Angular порівнює 'expected DOM structure' (з compile-time template analysis) з actual DOM. Типові причини: 1) Non-deterministic values в template (Date, random), 2) Browser extensions що модифікують DOM (ad blockers, password managers), 3) Різні дані між server і client (race condition), 4) Invalid HTML (table без tbody, p в p), 5) Conditional rendering що різниться між platforms. Налагодження: ngZone.onError, консоль error з DOM highlight, тимчасовий ngSkipHydration. Fix: винести non-deterministic logic в afterNextRender(), переконатись в TransferState для однакових даних."
      staff: "Hydration mismatch — це symptom architectural невідповідності між server і client rendering paths. Root causes: 1) Environmental divergence — platform-specific behavior не ізольований, 2) Temporal non-determinism — time-based values без seeding, 3) Data inconsistency — server і client отримують різні API відповіді. Systematic approach: 1) Audit всіх template expressions на determinism, 2) TransferState для всіх API calls (withHttpTransferCache()), 3) Тести що запускають SSR і compare output, 4) ngSkipHydration як escape hatch для third-party компонентів з складними DOM mutations. Architectural рішення: строга ізоляція platform-specific коду через injection tokens — компоненти never call browser APIs directly. В Angular 17+ detailed error messages з DOM path значно спростили debugging. Operational: mismatch errors в production — metric для моніторингу (збільшення = regression в SSR consistency)."
    commonMistakes:
      - "Ставлять ngSkipHydration скрізь замість виправлення root cause"
      - "Не розуміють що browser extensions можуть викликати hydration mismatch (важко відтворити локально)"
    relatedQuestions: ["b17t2q1", "b17t2q3"]
  - level: "senior"
    question: "Як працює incremental hydration з @defer в Angular 18+?"
    referenceAnswers:
      junior: "Incremental hydration дозволяє гідратувати не всю сторінку одразу, а частинами — компоненти в @defer блоках гідратуються пізніше."
      mid: "З Angular 18+ incremental hydration дозволяє SSR-рендерити і @defer блоки, але гідратувати їх тільки коли потрібно (viewport, interaction). withIncrementalHydration() вмикає цей режим. На сервері: @defer блок рендериться в HTML (для SEO). На клієнті: блок залишається як 'dehydrated' DOM поки trigger не спрацює (on viewport, on interaction тощо)."
      senior: "Incremental hydration (v18 developer preview, v19 stable) розширює @defer механізм: @defer блоки можуть бути SSR-rendered але не hydrated відразу. Механізм: 1) SSR рендерить @defer вміст в HTML з special marker attributes, 2) На клієнті Angular boot завантажує тільки 'eager' частину додатку, 3) @defer trigger спрацьовує (on viewport, on interaction) → Angular lazy-завантажує chunk → hydrates specific subtree. Це поєднує переваги SSR (HTML для SEO і FCP) з lazy loading (менше JS і work при initial load). withEventReplay() доповнює: зберігає user events (clicks тощо) під час hydration і відтворює їх після завершення."
      staff: "Incremental hydration — це paradigm shift від 'hydrate all at once' до 'hydrate on demand'. Архітектурне значення: SSR HTML coverage = SEO + FCP, але JS execution coverage = lazy. Це розриває раніше assumed зв'язок між 'HTML coverage' і 'JS coverage'. Implementation details: Angular compiler генерує 'hydration annotations' в SSR output, runtime має 'hydration boundaries' map. При trigger: dynamic import() для lazy chunk → NgZone aware bootstrap для subtree → LView reconciliation з annotated DOM. withEventReplay() — EventContractService перехоплює events до hydration і зберігає в queue, потім replay. Production considerations: incremental hydration потребує careful testing щодо event ordering, timing race conditions між hydration і user interaction. Metric: 'hydration coverage' — відсоток DOM що гідратується при initial load vs on-demand. Optimal strategy для content-heavy apps: SSR all, hydrate interactive parts only."
    commonMistakes:
      - "Думають що incremental hydration = lazy loading компонентів — це різні концепції"
      - "Не додають withEventReplay() і дивуються що clicks під час hydration ігноруються"
    relatedQuestions: ["b17t2q2", "b17t2q4"]
  - level: "senior"
    question: "Навіщо потрібні afterRender та afterNextRender хуки і коли їх використовувати замість ngAfterViewInit?"
    referenceAnswers:
      junior: "afterRender і afterNextRender виконуються тільки в браузері після рендеру, тому їх безпечно використовувати для DOM операцій при SSR."
      mid: "ngAfterViewInit виконується на сервері під час SSR, що може викликати помилки при доступі до browser APIs. afterRender/afterNextRender (v16.2+) — нові lifecycle hooks що виконуються тільки на клієнті, після того як Angular завершив рендер і оновлення DOM. afterNextRender — одноразово після наступного рендеру, afterRender — після кожного рендеру. Ідеальні для: ініціалізація третіх бібліотек що потребують DOM, measurement layout, scroll restoration."
      senior: "afterRender/afterNextRender — це офіційний replacement для isPlatformBrowser()+ngAfterViewInit pattern. Технічно вони виконуються в 'render hook queue' після Angular rendering pipeline завершено — це означає DOM готовий і stable. Фази виконання afterRender: 1) EarlyRead — DOM reads перед writes, 2) Write — DOM mutations, 3) MixedReadWrite — не рекомендовано, 4) Read — DOM reads після writes. Розподіл на фази запобігає layout thrashing. Порівняно з ngAfterViewInit: ngAfterViewInit — component lifecycle hook що запускається при view initialization (включно з SSR в деяких випадках), afterRender — platform-level hook що гарантовано тільки на клієнті."
      staff: "afterRender фази — це performance optimization через батчування DOM операцій. Layout thrashing (read→write→read→write) — одна з найчастіших причин poor rendering performance. Фазова система забезпечує: всі reads батчуються разом, всі writes — разом. Це еквівалент React's useLayoutEffect але з більш явними performance guarantees. Architectural pattern: будь-які DOM measurement або third-party library ініціалізації йдуть через afterNextRender(). Custom renderers або animation libraries — через afterRender() з відповідною фазою. Integration з Signals: afterRender callback може читати signals — але signal changes всередині callback не викликають re-render (це навмисно). З zoneless: afterRender є zoneless-aware і не потребує Zone.js для triggering."
    commonMistakes:
      - "Використовують afterRender для кожної маленької DOM операції — краще ngAfterViewInit де можна"
      - "Не розуміють різниці між afterRender (кожен рендер) і afterNextRender (один раз)"
    relatedQuestions: ["b17t2q3", "b17t1q3"]
  - level: "staff"
    question: "Як hydration впливає на Core Web Vitals і як вимірювати її ефективність?"
    referenceAnswers:
      junior: "Hydration покращує Largest Contentful Paint і зменшує мерехтіння при завантаженні."
      mid: "Hydration впливає на LCP (контент видимий швидше бо SSR HTML), CLS (немає DOM churn і layout shifts від ре-рендеру), TTI (interactive швидше бо менше JS роботи). Вимірювати: Chrome DevTools Performance tab, Web Vitals extension, PerformanceObserver API."
      senior: "Core Web Vitals impact: LCP — SSR+hydration = HTML available early = faster LCP (контент вже в DOM). FID/INP — hydration потребує JS execution що може block main thread — без incremental hydration великі apps мають worse INP. CLS — без hydration був DOM churn (delete SSR → create client) = CLS 0.x; з hydration = no DOM churn = better CLS. Вимірювання: RUM (Real User Monitoring) через web-vitals library, порівняти CSR baseline vs SSR+hydration. Метрики в production: LCP p75, INP p75, CLS. DevTools: Performance profile під час page load — шукати 'Hydrate' і 'Parse HTML' tasks."
      staff: "Hydration performance measurement framework: 1) Synthetic testing — Lighthouse CI в pipeline, порівняти з/без SSR на той самий URL, 2) RUM — web-vitals library + analytics event для LCP/INP/CLS, сегментувати по SSR vs non-SSR pages, 3) Hydration-specific metrics — кастомні Performance marks: performance.mark('ng-hydration-start/end'), вимірювати hydration duration, 4) Coverage analytics — скільки % DOM гідратується eagerly vs incrementally. Business case: LCP покращення на 20% = ~X% conversion rate improvement (Google data: 100ms LCP improvement = 1% conversion). Архітектурне рішення: incremental hydration для content-heavy pages (blog, catalog) — can improve INP significantly бо менше eager JS. Trade-off: withEventReplay() додає ~2KB overhead але необхідний для interactive pages (forms, CTAs)."
    commonMistakes:
      - "Вимірюють тільки Lighthouse score (synthetic), не RUM — реальні користувачі мають різний досвід"
      - "Не враховують INP deградацію від eager full-page hydration на mobile devices"
    relatedQuestions: ["b17t2q3", "b17t1q5"]
---

## Core Concept

**English definition:** Client-Side Hydration is the process of Angular "activating" server-rendered HTML on the client — attaching event listeners, restoring component state, and connecting the Angular runtime to the existing DOM nodes without destroying and re-rendering them.

**Пояснення:** До появи hydration Angular при завантаженні на клієнті просто видаляв весь SSR HTML і робив повний ре-рендер з нуля. Це нівелювало переваги SSR: був "мерехтіння" (Flash of Unstyled Content), зайве навантаження на браузер, і DOM churn. Hydration вирішує це: Angular "ходить" по існуючому SSR DOM, зіставляє його зі своїм компонентним деревом, і "приєднується" до нього без знищення та повторного створення.

**Яку проблему вирішує:**
- **DOM churn prevention:** Без hydration SSR DOM видалявся і перестворювався — layout shifts, втрата scroll position
- **Time to Interactive (TTI):** Менше JS роботи при initial load — не треба createElement для кожного DOM node
- **Cumulative Layout Shift (CLS):** Немає стрибків layout при переходах від SSR до client render
- **Event handling during hydration:** withEventReplay() зберігає user events під час hydration і відтворює їх

**Як працює під капотом:**

1. **SSR phase:** Angular генерує HTML з спеціальними hydration annotations (коментарі `<!--ng-->` і `jsaction` атрибути для event delegation)
2. **Client bootstrap:** Angular читає `ng-state` TransferState і hydration annotations з DOM
3. **LView reconciliation:** Замість `createElement()` Angular виконує "claim" — отримує reference на existing DOM node
4. **Event listeners:** Прикріплюються до existing elements без DOM mutations
5. **Signal/CD initialization:** Reactivity graph будується поверх existing DOM
6. **isStable:** Hydration завершена, Angular повністю operational

```typescript
// app.config.ts — вмикання hydration
import { ApplicationConfig } from '@angular/core';
import { provideClientHydration, withHttpTransferCache, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(
      withHttpTransferCache(),  // автоматичний HTTP transfer cache
      withEventReplay(),        // зберігати events під час hydration
    ),
  ],
};
```

**Trade-offs та обмеження:**
- **Non-deterministic rendering:** Hydration потребує ідентичного DOM між server і client — будь-яка divergence = mismatch error
- **Third-party DOM mutations:** Browser extensions, third-party scripts що модифікують DOM — potential mismatch
- **Invalid HTML:** `<p>` всередині `<p>`, `<tr>` без `<tbody>` — браузер авто-корегує invalid HTML, Angular очікує інше
- **withEventReplay() overhead:** ~2KB additional JS, event queue в memory під час hydration

**Версійність:**
- Angular 16: Developer preview hydration, `provideClientHydration()` перший раз
- Angular 17: Stable hydration, увімкнена за замовчуванням в нових SSR проєктах
- Angular 17.1: Детальні hydration mismatch error messages з DOM path
- Angular 18: Incremental hydration developer preview, `withIncrementalHydration()`, `withEventReplay()`
- Angular 19: Incremental hydration stable, event replay stable

## Deep Details

### Edge Cases

**Invalid HTML structure — silent mismatch:**
```html
<!-- ❌ Invalid HTML — браузер авто-виправляє, Angular очікує оригінал -->
<p>Text <div>Block inside inline</div></p>
<!-- Браузер парсить це як: <p>Text</p><div>Block inside inline</div><p></p> -->
<!-- Angular template має <p><div></div></p> — MISMATCH -->

<!-- ✅ Valid HTML structure -->
<div>Text <div>Block inside block</div></div>
```

**ngSkipHydration — escape hatch для проблемних компонентів:**
```typescript
// Коли компонент використовує third-party DOM library що мутує DOM
@Component({
  selector: 'app-chart',
  template: `<div #chartContainer></div>`,
  host: { 'ngSkipHydration': 'true' }, // пропустити hydration для цього компонента
})
export class ChartComponent implements AfterViewInit {
  @ViewChild('chartContainer') container!: ElementRef;

  ngAfterViewInit() {
    // D3.js або Chart.js — мутують DOM безпосередньо
    // Angular не може hydrate такий dynamic DOM
    new Chart(this.container.nativeElement, { ... });
  }
}
```

**withEventReplay() — збереження подій під час hydration:**
```typescript
// Без withEventReplay: click до завершення hydration — ігнорується
// З withEventReplay: click зберігається, відтворюється після hydration

// Важливо: withEventReplay вимикає automatic event delegation через jsaction
// і переходить на explicit event capture queue
provideClientHydration(withEventReplay()) // Angular 18+
```

### Junior vs Senior Understanding

**Junior** знає: "provideClientHydration() вмикає hydration, SSR DOM reuse — добре."

**Senior** розуміє reconciliation механізм: LView "claims" DOM nodes, annotation коментарі як mapping markers, чому non-deterministic rendering ламає hydration. Senior може діагностувати mismatch через DOM annotations і знає що ngSkipHydration — це escape hatch, не fix.

```typescript
// Розуміння що робить Angular при hydration:
// 1. SSR output містить:
// <!--ng-->  <- hydration boundary marker
// <div>      <- перший child component
// <!--ng-->  <- marker для component instance

// 2. На клієнті під час bootstrap:
// Angular parser читає ці коментарі
// LViewManager.claimNodes(hostElement) → повертає existing DOM nodes
// замість createEmbeddedView() → createElement()

// 3. Якщо DOM відрізняється від очікуваного:
// ERROR: NG0500: Hydration: cannot find element #3 in the component tree
```

### Deprecation & Migration Path

- Angular 16: `BrowserModule.withServerTransition({ appId: 'serverApp' })` — deprecated
- Angular 17: `provideClientHydration()` за замовчуванням в нових SSR проєктах — не потребує ручного додавання
- `ServerTransferStateModule` / `BrowserTransferStateModule` — deprecated, functionality вбудована в `provideClientHydration()`
- Angular 18+: `withIncrementalHydration()` для @defer блоків

### Connections to Other Concepts

- **Angular Universal / SSR (Topic 1):** SSR генерує HTML + annotations, hydration використовує їх
- **@defer blocks (Block 16):** Incremental hydration розширює @defer для server-rendered-but-lazy-hydrated blocks
- **TransferState:** withHttpTransferCache() автоматизує TransferState для HTTP requests
- **Change Detection:** Hydration підключає CD до existing DOM — LView structure
- **Signals:** Signal-based reactivity сумісна з hydration; signal effects запускаються після hydration complete

## Examples

### Basic Usage

```typescript
// app.config.ts — мінімальна конфігурація з hydration
import { ApplicationConfig } from '@angular/core';
import { provideClientHydration, withHttpTransferCache } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withHttpTransferCache()),
  ],
};
```

### Production Scenario

```typescript
// Incremental hydration з @defer (Angular 18+)
// content/article.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-article',
  template: `
    <!-- Головний контент — hydrate eagerly (SEO critical) -->
    <article>
      <h1>{{ article.title }}</h1>
      <p>{{ article.summary }}</p>
    </article>

    <!-- Коментарі — defer hydration до viewport -->
    @defer (hydrate on viewport) {
      <app-comments [articleId]="article.id" />
    } @placeholder {
      <div class="comments-skeleton">Loading comments...</div>
    }

    <!-- Related articles — defer до interaction -->
    @defer (hydrate on interaction) {
      <app-related-articles [tags]="article.tags" />
    }
  `,
})
export class ArticleComponent {
  article = input.required<Article>();
}
```

```typescript
// app.config.ts — з incremental hydration
import { withIncrementalHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withHttpTransferCache(),
      withIncrementalHydration(), // дозволяє @defer (hydrate ...) syntax
      withEventReplay(),          // зберігати clicks/events під час hydration
    ),
  ],
};
```

### Anti-Example

```typescript
// ❌ WRONG: Non-deterministic value в template — guaranteed hydration mismatch
@Component({
  template: `
    <div>Generated at: {{ now }}</div>
    <p>Random: {{ randomId }}</p>
  `,
})
export class HeaderComponent {
  now = new Date().toISOString(); // РІЗНЕ значення на сервері і клієнті!
  randomId = Math.random();       // РІЗНЕ значення на сервері і клієнті!
}

// ✅ CORRECT: Non-deterministic logic в afterNextRender або TransferState
@Component({
  template: `
    <div>{{ displayTime }}</div>
  `,
})
export class HeaderComponent {
  displayTime = '';

  constructor() {
    // Виконується тільки на клієнті — немає hydration mismatch
    afterNextRender(() => {
      this.displayTime = new Date().toLocaleString();
    });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `ngSkipHydration` на всіх компонентах | Нівелює переваги hydration — DOM churn повертається | Використовувати тільки для реально problematic third-party DOM components |
| Non-deterministic values в templates | Hydration mismatch — Angular throws error | Перенести в `afterNextRender()` або TransferState |
| Прямі DOM mutations в `ngAfterViewInit` | Може cause mismatch або mute hydration | Використовувати `afterNextRender()` або `Renderer2` |
| `withIncrementalHydration()` без `@defer` | Вмикає incremental mode без benefit — overhead без purpose | Додавати тільки якщо є `@defer (hydrate ...)` blocks |
| Відсутність `withEventReplay()` в interactive app | User clicks під час hydration — ignored, UX проблема | Завжди додавати `withEventReplay()` для форм і interactive elements |

## Interview Block

### [L1 — Warm-up] Що таке hydration в Angular і чим вона відрізняється від звичайного SSR?
**Signal being tested:** Розуміння різниці між server rendering і client activation, а не просто "hydration = SSR"
**What the interviewer expects:** SSR генерує HTML, hydration клієнт-сайд reuse SSR DOM; без hydration — full re-render; provideClientHydration()
**How to probe deeper:** "Що конкретно відбувається з SSR DOM якщо hydration вимкнена?"
**Reference answer:** SSR генерує і відправляє HTML клієнту. Без hydration Angular при bootstrap видаляв весь SSR DOM і рендерив заново — layout shifts, DOM churn, зайня робота. З hydration (provideClientHydration()) Angular "claims" existing DOM nodes, прикріплює event listeners і відновлює компонентний стан без знищення DOM. Це покращує CLS і TTI.
**Common mistakes:** Плутають SSR і hydration як синоніми; думають що hydration потрібна для SEO (це SSR); не знають що до hydration Angular буквально видаляв SSR DOM

### [L2 — Mid] Що таке hydration mismatch і як його налагодити?
**Signal being tested:** Здатність діагностувати і виправляти production SSR проблеми
**What the interviewer expects:** Розуміння причин mismatch (non-determinism, invalid HTML, browser extensions), debugging підхід, ngSkipHydration як escape hatch не fix
**How to probe deeper:** "Може браузерне розширення викликати hydration mismatch?"
**Reference answer:** Mismatch виникає коли server і client генерують різний DOM. Причини: Date.now()/Math.random() в шаблоні, invalid HTML (браузер auto-corrects), browser extensions що мутують DOM, різні дані між server і client. Debugging: детальна error message з DOM path (Angular 17.1+), тимчасовий ngSkipHydration для ізоляції проблеми. Fix: перенести non-deterministic logic в afterNextRender(), забезпечити TransferState для consistent data.
**Common mistakes:** Ставлять ngSkipHydration як постійне рішення; не думають про browser extensions як причину; ігнорують invalid HTML

### [L3 — Senior] Як працює incremental hydration з @defer в Angular 18+?
**Signal being tested:** Розуміння advanced hydration optimization і trade-offs з incremental підходом
**What the interviewer expects:** SSR renders @defer content, client defers hydration до trigger, withIncrementalHydration() + withEventReplay() combination
**How to probe deeper:** "Що відбувається якщо користувач клікає на @defer блок до його hydration?"
**Reference answer:** withIncrementalHydration() дозволяє @defer (hydrate on viewport/interaction) синтаксис. SSR рендерить весь контент включно з @defer блоками (для SEO і FCP), але клієнт defers hydration. При trigger Angular lazy-завантажує chunk і hydrates тільки той subtree. withEventReplay() вирішує проблему events під час hydration: зберігає queue клікань і відтворює їх після hydration. Ідеально для content-heavy pages де більшість контенту нижче fold.
**Common mistakes:** Думають incremental hydration = lazy loading компонентів; не додають withEventReplay() і втрачають user events

### [L4 — Staff/Principal] Як hydration впливає на Core Web Vitals і як вимірювати її ефективність?
**Signal being tested:** Здатність конвертувати технічні рішення в бізнес-метрики і будувати measurement framework
**What the interviewer expects:** LCP/CLS/INP impact аналіз, RUM vs synthetic testing, incremental hydration для INP improvement, конкретні measurement підходи
**How to probe deeper:** "Як би ви довели stakeholders що SSR+hydration варте investment у порівнянні з CSR?"
**Reference answer:** LCP покращується бо SSR HTML available раніше. CLS покращується бо немає DOM churn при hydration (на відміну від SSR без hydration). INP — potential деградація від eager full-page hydration; вирішення: incremental hydration. Measurement: web-vitals library для RUM, performance.mark() для custom hydration timing, Lighthouse CI в pipeline. Segmentation: SSR pages vs CSR pages в analytics — compare p75 LCP/INP. Business case: LCP +20% → conversion rate improvement.
**Common mistakes:** Вимірюють тільки Lighthouse (synthetic), ігнорують RUM; не враховують mobile devices де hydration overhead більший

## Summary

### Key Points
- Hydration reuse-ує SSR DOM замість повного ре-рендеру — покращує CLS, TTI, і usability
- `provideClientHydration()` вмикається за замовчуванням в Angular 17+ SSR проєктах
- Hydration mismatch виникає при non-deterministic templates — `afterNextRender()` є рішенням
- Incremental hydration (v18+ stable в v19) + `@defer (hydrate ...)` = lazy hydration для below-fold контенту
- `withEventReplay()` зберігає user events під час hydration — необхідний для interactive pages
- `ngSkipHydration` — escape hatch для third-party DOM libraries, не загальне рішення
- LView "claims" existing DOM nodes замість createElement() — це core механізм hydration

### Elevator Pitch (2 minutes)
"Hydration вирішує проблему Angular SSR: раніше Angular при завантаженні на клієнті видаляв весь server-rendered HTML і рендерив заново — це причиняло layout shifts і нівелювало переваги SSR. З hydration (Angular 17+ stable) Angular 'claims' existing DOM nodes — прикріплює event listeners і відновлює стан без знищення DOM. provideClientHydration() вмикає це, withHttpTransferCache() запобігає double HTTP requests. Головна пастка: non-deterministic values (Date.now(), Math.random()) в template викликають hydration mismatch — їх треба перенести в afterNextRender(). Angular 18+ incremental hydration з @defer дозволяє SSR-рендерити весь контент але гідратувати lazy — ідеально для content-heavy pages де не весь контент потребує immediate interaction."
