---
title: "Core Web Vitals & Web Performance Metrics"
block: 0
topic: 8
slug: "core-web-vitals"
difficulty: 3
tags: ["LCP", "FID", "CLS", "INP", "TTFB", "performance-budget", "Lighthouse", "PageSpeed"]
relatedTopics: ["deferrable-views", "bundle-optimization", "runtime-optimization", "angular-devtools-profiling"]
interviewQuestions:
  - level: "junior"
    question: "Що таке Core Web Vitals і які три основні метрики вони вимірюють?"
    referenceAnswers:
      junior: "Core Web Vitals — три метрики Google для оцінки UX: LCP (Largest Contentful Paint) — час завантаження основного контенту, FID/INP — час реакції на першу взаємодію, CLS (Cumulative Layout Shift) — стабільність верстки. Ці метрики впливають на SEO ранжування."
      mid: "Core Web Vitals — підмножина Web Vitals що Google використовує в Page Experience ranking. LCP (Largest Contentful Paint): час до відображення найбільшого image або block елементу у viewport — target < 2.5s. INP (Interaction to Next Paint, замінив FID з 2024): затримка від interaction до frame update — target < 200ms. CLS (Cumulative Layout Shift): сума зміщень layout без user input — target < 0.1. Додатково: TTFB (Time to First Byte) < 800ms, FCP (First Contentful Paint) < 1.8s — важливі але не Core."
      senior: "Core Web Vitals — user-centric performance metrics що корелюють з реальним UX. LCP: browser визначає найбільший rendered element (img, video, background-image, block-level text) у viewport. Пастка: LCP може змінитись після initial render — великий lazy-loaded image може стати LCP element. INP: successor до FID (deprecated в 2024). Вимірює responsiveness — від input event (click, tap, keypress) до next paint commit. Відрізняється від FID: FID = перша взаємодія, INP = worst interaction за весь session. CLS: layout-shift score = impact fraction × distance fraction. Only unexpected shifts — shifts після user gesture не враховуються. TTFB впливає на LCP: 800ms TTFB → LCP неможливо досягти < 1.8s. Angular specifics: SSR/hydration покращує LCP але hydration може спричиняти CLS якщо сервер і клієнт DOM не збігаються."
      staff: "Core Web Vitals як engineering KPI — від metrics до actionable optimization strategy. LCP decomposition: TTFB + resource load delay + resource load time + element render delay. Кожен компонент має свій action item (CDN для TTFB, preload для resource delay, image optimization для load time). INP в Angular context: CD cycles що виникають під час interaction — якщо OnPush не використовується і є дорогі pipe computations, event handler може тригерити 100+ component checks перед next paint. Рішення: OnPush + signals, runOutsideAngular для non-visual updates, deferring heavy processing з scheduler API. CLS і Angular: Server-Side Rendering без hydration або з partial hydration може спричиняти layout shifts коли Angular бере контроль над DOM. withDomHydration() і стабільне серверне розміщення елементів критичне. Performance budget як deployment gate: Lighthouse CI в CI/CD pipeline з budget.json — блокує deploy якщо Core Web Vitals regression. Field data (CrUX) vs lab data (Lighthouse) — різниця може бути значною через device diversity та network conditions реальних юзерів."
    commonMistakes:
      - "Плутають FID і INP — FID deprecated в березні 2024, тепер INP є Core Web Vital"
      - "Вважають що CLS = тільки зображення без розмірів — будь-який unexplained layout shift рахується"
      - "Ігнорують TTFB — він напряму обмежує досяжний LCP"
    relatedQuestions: ["b0t8q2", "b0t8q3"]
  - level: "mid"
    question: "Як Angular SSR та гідратація впливають на LCP і CLS?"
    referenceAnswers:
      junior: "SSR рендерить HTML на сервері, тому контент з'являється швидше — це покращує LCP. Але якщо Angular клієнт рендерить по-іншому, може бути зміщення — це CLS."
      mid: "SSR покращує LCP: HTML приходить з сервера вже populated, браузер не чекає JS bootstrap. Angular 17+ hydration (withDomHydration): клієнт reuses server DOM замість destroy+recreate — уникаємо flash of unstyled content та CLS. Без hydration: Angular видаляє server HTML і рендерить заново — видимий layout shift. TTFB впливає: якщо сервер повільний, SSR не допомагає LCP."
      senior: "SSR + hydration impact на Core Web Vitals: LCP: SSR робить LCP element (hero image, H1) доступним у initial HTML → браузер може почати render до JS load. З CSR: LCP чекає на JS parse+execute+HTTP request → 2-4s penalty. Hydration types в Angular: 1) Full hydration (withDomHydration) — клієнт traverses server DOM, attaches event listeners без DOM recreation. LCP: excellent (server HTML). CLS: low (DOM не recreated). 2) Partial hydration / @defer з SSR: static parts stay server-rendered, interactive parts hydrate incrementally. 3) Без hydration (legacy): Angular destroys server DOM, renders fresh — CLS spike. Edge cases: CLS з hydration: якщо server і client рендерять різний HTML (timezone-dependent dates, random IDs, platform-specific CSS) — Angular hydration mismatch warning + DOM reconciliation → CLS. TransferState для SSR data prevents double HTTP requests. Incremental hydration (v18+): @defer blocks can defer hydration → менший INP на startup (less JS to parse)."
      staff: "SSR/hydration architecture decisions — trade-offs для performance і complexity. LCP optimization hierarchy: 1) Preconnect/dns-prefetch для critical origins. 2) Resource hints: <link rel='preload'> для LCP image (Critical Image element). 3) SSR з streaming (Angular 21+ HTTP streaming response). 4) CDN edge caching для SSR responses. CLS prevention strategy: a) Усі images/video мають explicit width/height або aspect-ratio CSS. b) Font swap strategy — size-adjust CSS descriptor для web fonts prevents text CLS. c) Server і client render identical HTML — уникати browser-only APIs в constructor (use afterRender/isPlatformBrowser). d) hydrationMismatch: Angular devMode logs mismatches — виявляти на CI. INP і Angular SSR: під час hydration Angular runs all CD synchronously — може блокувати main thread > 50ms (Long Task). Рішення: withEventReplay() (Angular 18+) для кращого First Input Delay під час hydration. Progressive hydration strategy: hydrate above-fold components first, below-fold via @defer(on viewport). Field data від CrUX API для real user monitoring, не тільки Lighthouse lab data."
    commonMistakes:
      - "Думають SSR автоматично вирішує CLS — гідратаційні mismatches можуть спричиняти більший CLS ніж CSR"
      - "Не використовують withDomHydration — Angular без нього знищує server DOM і CLS spike неминучий"
    relatedQuestions: ["b0t8q1", "b0t8q4"]
  - level: "mid"
    question: "Як виміряти Core Web Vitals для Angular застосунку і що впливає на INP?"
    referenceAnswers:
      junior: "Можна використовувати Lighthouse в Chrome DevTools або PageSpeed Insights. Вони показують оцінки і рекомендації."
      mid: "Інструменти: Lighthouse (lab data, synthetic), PageSpeed Insights (lab + field data з CrUX), Chrome DevTools Performance tab, web-vitals JS library для real user monitoring. INP впливають: довгі event handlers, synchronous DOM operations, важкі computations в main thread, Angular CD cycles що тригеруються event handlers без OnPush."
      senior: "Вимірювання CWV: 1) Lab tools: Lighthouse audit (F12 → Lighthouse), CLI: `lighthouse https://app.com --output=json`. Обмеження: synthetic network/CPU, не реальні пристрої. 2) Field data: Chrome User Experience Report (CrUX) — 28-day rolling window, real devices. PageSpeed Insights показує both. 3) Real User Monitoring (RUM): `web-vitals` library → send to analytics. `onINP((metric) => analytics.send(metric))`. 4) Angular-specific: Angular DevTools Profiler — flame chart CD cycles per interaction. INP у Angular: event handler → Angular CD → DOM update → paint. Bottlenecks: a) Zone.js тригерить CD на кожен event. b) OnPush not used — full tree CD. c) Expensive pipes (impur). d) Template expressions з side effects. e) setTimeout/setInterval без runOutsideAngular. Профілювання: Chrome Performance tab → поміти Event Listener → CD Cycle → Layout → Paint sequence."
      staff: "INP optimization в Angular — системний підхід. INP = input event dispatch time + event processing time (JS) + next frame presentation time. Angular contributes до event processing time через Zone.js + CD. Optimization hierarchy: 1) OnPush + signals: signals memoize computation, OnPush isolates CD subtree. CD triggered only for changed inputs/signals. 2) runOutsideAngular: third-party event listeners, WebSocket messages, non-visual timers — не тригерять CD. 3) Scheduler API (experimental): yield to browser between tasks — розбиваємо long tasks. 4) Deferrable views: heavy components що не в viewport — не в CD tree. 5) Web Workers: heavy computation off main thread. Angular worker support через @angular/service-worker або manual. INP measurement program: web-vitals library з sendBeacon для unload. Attribution: `onINP(metric => { const { processingStart, processingEnd, startTime } = metric.attribution.eventEntry; })` — identify specific slow interactions. Budget: P75 INP > 200ms = needs action. Track per interaction type (click vs keyboard vs touch) — може відрізнятись."
    commonMistakes:
      - "Використовують тільки Lighthouse (lab data) — реальні користувачі на слабких пристроях можуть мати значно гірші показники"
      - "Профілюють в development mode — Angular devMode додає extra checks, production завжди швидший"
    relatedQuestions: ["b0t8q2", "b0t8q4"]
  - level: "senior"
    question: "Як налаштувати performance budget для Angular застосунку і інтегрувати Lighthouse CI в pipeline?"
    referenceAnswers:
      junior: "В angular.json є budgets налаштування де можна вказати максимальний розмір bundle. Якщо бюджет перевищено — build fails."
      mid: "Angular budgets в angular.json: type initial/anyComponentStyle/bundle з maximumWarning та maximumError. Lighthouse CI: @lhci/cli пакет, налаштування в lighthouserc.json, assertions для LCP/CLS/INP/performance score. Інтегрується в GitHub Actions — fails PR якщо регресія."
      senior: "Performance budget strategy: 1) Angular CLI budgets (angular.json) — compile-time. Initial bundle < 200KB gzipped, lazy chunks < 80KB. Budget exceeded → build error → PR blocked. 2) Lighthouse CI budget (budget.json або assertions в lighthouserc): `{ 'audits[largest-contentful-paint].numericValue': { 'maxNumericValue': 2500 }, 'categories[performance].score': { 'minScore': 0.9 } }`. 3) RUM-based budget: P75 LCP > 2.5s in production → alert/incident. Lighthouse CI setup: `npm install -g @lhci/cli`, `lhci autorun` в CI, compare з baseline (previous PR or main branch). Canary analysis: LCP regression > 200ms on merge → block deploy. source-map-explorer для bundle analysis: `npx source-map-explorer dist/app/*.js` — identifies what contributes to bundle size. webpack-bundle-analyzer alternative. Angular-specific monitoring: `ng build --stats-json` → stats.json → bundle analyzer."
      staff: "Performance budget як engineering contract — organizational і technical dimensions. Technical implementation: 1) Tiered budgets: warn threshold (95% of limit) + error threshold (100%). CI block on error, ticket on warn. 2) Per-route budgets: критично для lazy-loaded routes. Route `/dashboard` — не більше ніж 150KB lazy chunk (includes route component + dependencies). 3) Bundle composition monitoring: track per-library contribution до bundle. New dependency added → bundle size regression report. 4) Core Web Vitals SLA: P75 LCP < 2.5s, P75 INP < 200ms, P75 CLS < 0.1 — measured in production via CrUX або RUM. Breach = incident. 5) Lighthouse CI як performance regression detection: порівнюємо з main branch baseline. >10% regression → required review від performance team. Organizational: performance budget sign-off від product і eng lead. 'Performance champion' per team. Monthly CWV review. Tools ecosystem: WebPageTest для advanced filmstrip analysis + waterfall, SpeedCurve для long-term tracking, Calibre для enterprise. Angular-specific: Angular CLI --budget-report (v21+), custom Webpack plugin для bundle analysis в monorepo."
    commonMistakes:
      - "Встановлюють budget тільки на initial bundle і забувають про lazy chunks — великий lazy chunk блокує navigation"
      - "Lighthouse CI запускають на throttled network але не на emulated mobile CPU — CPU throttling критичніший для INP"
    relatedQuestions: ["b0t8q3", "b0t8q1"]
  - level: "staff"
    question: "Як спроектувати систему моніторингу Web Performance для production Angular застосунку з мільйонами користувачів?"
    referenceAnswers:
      junior: "Можна використовувати Google Analytics або Sentry для моніторингу помилок і продуктивності."
      mid: "Для production моніторингу: web-vitals library для збору метрик з реальних браузерів, sendBeacon для відправки при unload, агрегація в аналітику. CrUX API для загальних тенденцій. Alerting на регресії."
      senior: "Production CWV monitoring architecture: 1) Collection: web-vitals library (onLCP, onINP, onCLS, onFCP, onTTFB). Report via sendBeacon до custom endpoint або GA4. Include: url, device type, connection type, Angular version. 2) Attribution: web-vitals attribution build — розкладає LCP на server time/resource load/element render. INP attribution: identifies slow element. 3) Aggregation: P75 per URL group (не exact URL — query params vary). Rolling 7-day window. 4) Alerting: P75 LCP > 2.5s для > 5% sessions → PagerDuty. 5) Dashboard: Grafana з time-series, heatmaps per device/country. 6) Correlation з deployments: deployment markers → identify which release caused regression."
      staff: "Enterprise Web Performance Observability System — від collection до actionable insights. Architecture: 1) Collection layer: web-vitals library + custom Angular performance interceptor. Collect: CWVs, navigation timing, resource timing (critical path), long tasks API, Angular-specific (CD duration, hydration time). Sampling: 100% для P0 pages (homepage, checkout), 10% для решти. Privacy: no PII, hash URLs. 2) Processing pipeline: Kafka → Flink stream processing → P50/P75/P95 aggregation per route/device/network/country. Volume: 10M users → ~1M CWV events/day → requires efficient aggregation (not raw storage). 3) Storage: time-series DB (InfluxDB/TimescaleDB) для metrics, ClickHouse для ad-hoc analysis. Hot data: 30 days. Cold: 1 year. 4) Correlation engine: cross-reference CWV regressions з deployment history, A/B experiments, backend latency. ML anomaly detection для автоматичного виявлення регресій. 5) Alerting hierarchy: P75 LCP > 2.5s AND > 1000 samples/hour → P1 incident (5 min response). P75 INP > 500ms AND growing trend → P2 (1 hour). CLS > 0.1 AND > 100 samples → P3 (next business day). 6) Fix loop: alert → profiling session (WebPageTest + Lighthouse + Angular DevTools) → root cause → deploy fix → monitor improvement. 7) Angular-specific tracking: measure hydration time via NG_HYDRATION_FEATURE, track CD performance degradation via custom zone interceptor. SLA: 95th percentile LCP < 2.5s = performance SLA. Breach = executive escalation."
    commonMistakes:
      - "Зберігають raw events замість pre-aggregated P75 — неможливо масштабувати на мільйони users"
      - "Алертять на середнє значення (mean) — mean маскує хвіст розподілу, реальні погані UX досвіди пропускаються"
      - "Не враховують device/network segmentation — desktop P75 може бути < 2s, mobile P75 > 4s"
    relatedQuestions: ["b0t8q4", "b0t8q3"]
---

## Core Concept

**English definition:** Core Web Vitals are a subset of Google's Web Vitals initiative — three user-centric performance metrics that quantify real-world user experience: Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS). Together they measure loading performance, interactivity responsiveness, and visual stability.

**Пояснення:** Core Web Vitals — це не абстрактні технічні метрики, а конкретні виміри того, що користувач відчуває: "Чи швидко з'явився контент?", "Чи миттєво реагує сторінка на мої дії?", "Чи не стрибає верстка поки я читаю?". Google використовує ці метрики як сигнал ранжування з 2021 року. FID (First Input Delay) був замінений INP (Interaction to Next Paint) у березні 2024 — принципова різниця: FID вимірював тільки першу взаємодію, INP — найгіршу за весь session.

**Яку проблему вирішує:** До появи CWV "performance" вимірювалась технічними метриками (load event, DOMContentLoaded) які погано корелювали з реальним досвідом. LCP, INP, CLS — вибрані через доведену кореляцію з conversion rate, bounce rate, і user satisfaction. Погані CWV → нижче SEO ранжування → менше трафіку + гірший UX → менше конверсій.

**Як працює під капотом:**

LCP: браузер відстежує найбільший rendered element у viewport. Кандидати: `<img>`, `<image>` (SVG), `<video poster>`, елементи з CSS `background-image`, block-level elements з текстом. LCP оновлюється доки користувач не interacts (scroll, tap, keypress зупиняють LCP watch). PerformanceObserver API: `new PerformanceObserver((list) => { const entries = list.getEntries(); const last = entries[entries.length - 1]; console.log('LCP:', last.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true })`.

INP: реплейсер FID. Замість лише першої взаємодії — worst interaction за весь page lifetime (з відкиданням outliers > 50 interactions). Вимірює: від input event → event handlers complete → next frame painted (commit to display). Breakdown: input delay (was main thread busy?) + processing time (event handler duration) + presentation delay (rendering pipeline).

CLS: `layout_shift_score = impact_fraction × distance_fraction`. Impact fraction = % viewport affected. Distance fraction = max distance element moved / viewport. Accumulates across "session windows" (< 1s gap between shifts, max 5s window). Unexplained shifts only — shift після 500ms від user interaction не рахується.

```
Core Web Vitals thresholds:

LCP:  < 2.5s = Good    2.5-4s = Needs Improvement    > 4s = Poor
INP:  < 200ms = Good   200-500ms = Needs Improvement  > 500ms = Poor
CLS:  < 0.1 = Good     0.1-0.25 = Needs Improvement   > 0.25 = Poor

Supporting metrics (not Core, but important):
TTFB: < 800ms = Good   (directly limits achievable LCP)
FCP:  < 1.8s = Good    (first bit of content painted)
```

**Trade-offs та обмеження:**

- Lab (Lighthouse) vs Field (CrUX) дані різняться суттєво — реальні пристрої (low-end Android) значно повільніші за DevTools throttling
- INP вимагає реального user interaction — не вимірюється при bounced sessions
- CLS false positives: ads, banners що завантажуються асинхронно без placeholder — significant CLS навіть при "правильній" реалізації
- Single-page apps: LCP вимірюється тільки для initial load, не soft navigations (поки draft API)

**Як Angular це використовує:**

Angular framework напряму впливає на всі три CWV:
- **LCP:** Angular Universal SSR + `withDomHydration()` → HTML available before JS boots → LCP не чекає на Angular bootstrap. `NgOptimizedImage` directive (v15+) автоматично додає `loading="lazy"`, `fetchpriority="high"` для LCP images, explicit width/height.
- **INP:** Zone.js патчить browser event APIs → кожен event тригерить Angular CD. `NgZone.runOutsideAngular()` для non-visual handlers. OnPush + Signals → CD обмежена affected subtree. `@defer(on interaction)` — defer heavy components поки user не потребує їх.
- **CLS:** `withDomHydration()` reuses server DOM замість destroy+recreate → no CLS spike. Directive `NgOptimizedImage` enforces width/height → no image CLS. `@placeholder` в `@defer` — stable layout під час loading.

## Deep Details

### Edge Cases

**LCP element switching:** LCP element може змінитись після initial paint. Якщо hero text загрузився → LCP = 0.8s. Потім великий lazy-loaded banner image появляється → LCP оновлюється до 3.5s. Це "LCP update" — PerformanceObserver emits нові entries до першого user interaction.

**CLS і Angular animations:** Angular animations що змінюють розміри елементів можуть генерувати CLS якщо не запущені через CSS transform (translate, scale). `position: absolute` елементи що появляються можуть push інший контент. Використовуй `@AnimateChild` з `transform` замість `height` animations.

**INP і Zone.js патчинг:** `addEventListener` в template (event bindings) → Zone.js патчує → Angular CD після кожного event. Навіть якщо handler порожній — CD cycle для всього дерева (без OnPush). Ефект: "пустий" click handler може мати INP > 100ms на дереві з 500+ компонентів.

**TTFB і кешування:** High TTFB (> 1s) блокує LCP навіть з ідеальним frontend. SSR без CDN кешування = кожен запит = cold server render. Vercel/Cloudflare Edge рендеринг або HTTP cache headers (`s-maxage`) критичні.

**CLS і web fonts:** Flash of Unstyled Text (FOUT) → layout shift коли font завантажується і меняє метрики тексту. Рішення: `font-display: optional` (no swap) або `font-display: swap` + `size-adjust` CSS descriptor для compensation.

### Junior vs Senior Understanding

**Junior** знає: три назви метрик, що LCP = speed, CLS = stability, INP = interactivity. Знає Lighthouse показує їх. Може вказати explicit image dimensions для CLS.

**Senior** розуміє:

1. **LCP decomposition:** TTFB → resource load delay → resource load time → element render delay. Кожен крок має свій fix (CDN, preload, compression, AOT render). Не просто "make LCP fast" а "which component of LCP is slow?"

2. **INP attribution:** `startTime` (event dispatch) + `processingStart - startTime` (input delay) + `processingEnd - processingStart` (processing) + `nextPaintTime - processingEnd` (presentation delay). Identifies де саме 200ms ідуть.

3. **Angular CD і INP:** Знає що Zone.js = CD after every event. Знає як OnPush + signals break default CD cycle. Може виміряти CD duration в Angular DevTools і корелювати з INP.

4. **CLS scoring formula:** impact_fraction × distance_fraction. Знає що animate transform, не geometry. Знає про "session windows".

5. **Field vs Lab:** CrUX P75 — реальні дані. Lighthouse — controlled environment. Обидва потрібні — lab для debugging, field для KPIs.

### Deprecation & Migration Path

- **FID → INP (березень 2024):** FID (First Input Delay) вилучено з Core Web Vitals. INP тепер є офіційним Core Web Vital. `web-vitals` library: `onFID()` — deprecated, `onINP()` — current. Angular performance optimization стратегії для FID залишаються валідними для INP але INP більш вимогливий (worst interaction, не перша).
- **Angular NgOptimizedImage (v15+):** Замінює ручне додавання `loading="lazy"` та `width/height`. Автоматично виправляє LCP та CLS image issues. Інтеграція: `imports: [NgOptimizedImage]`, замінити `<img src="...">` на `<img ngSrc="...">`.
- **withDomHydration (v16, stable v17):** Замінює попередній підхід (Angular Universal без hydration = DOM destroy + recreate). Migration: `bootstrapApplication(App, { providers: [provideClientHydration(withDomHydration())] })`.

### Connections to Other Concepts

- **Deferrable Views (@defer):** Прямо впливає на INP та LCP — важкі компоненти не в initial bundle і не в CD tree
- **Bundle Optimization:** Менший initial bundle → швидший JS parse/execute → LCP + INP покращуються
- **Runtime Optimization:** OnPush + signals → менше CD cycles → кращий INP
- **Angular DevTools:** Profiler flame chart → identifies slow CD cycles що збільшують INP
- **SSR/Hydration:** withDomHydration → LCP benefits без CLS regressions

## Examples

### Basic Usage

```typescript
// Measuring Core Web Vitals з web-vitals library
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

// Simple collection function
function reportMetric(metric: any): void {
  // Send to analytics or monitoring
  console.log(`${metric.name}: ${metric.value.toFixed(2)}ms`);

  // Example: send to Google Analytics 4
  // gtag('event', metric.name, {
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   metric_id: metric.id,
  //   metric_value: metric.value,
  //   metric_delta: metric.delta,
  // });
}

// Register all Core Web Vitals
onLCP(reportMetric);
onINP(reportMetric);  // Note: INP replaced FID in March 2024
onCLS(reportMetric);
onFCP(reportMetric);
onTTFB(reportMetric);

// Angular integration — викликати в main.ts після bootstrap
// або в AppComponent constructor
```

```typescript
// NgOptimizedImage для LCP + CLS fixes
import { NgOptimizedImage } from '@angular/common';

@Component({
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <!-- LCP hero image: priority=true додає fetchpriority="high" + preload link -->
    <img ngSrc="/hero.webp"
         alt="Hero banner"
         width="1200"
         height="600"
         priority>

    <!-- Lazy loaded image: explicit dimensions = no CLS -->
    <img ngSrc="/product.webp"
         alt="Product image"
         width="400"
         height="300">

    <!-- Fill mode: коли розміри не відомі заздалегідь -->
    <div class="image-container" style="position: relative; height: 300px;">
      <img ngSrc="/dynamic.webp"
           alt="Dynamic image"
           fill
           style="object-fit: cover">
    </div>
  `
})
export class HeroComponent {}
```

### Production Scenario

```typescript
// Production Web Vitals monitoring service
import { Injectable, inject } from '@angular/core';
import { onLCP, onINP, onCLS, onFCP, onTTFB, Metric } from 'web-vitals/attribution';
import { HttpClient } from '@angular/common/http';

interface VitalReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  url: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  connectionType?: string;
  attribution?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class WebVitalsService {
  private http = inject(HttpClient);

  initialize(): void {
    // Use attribution build for detailed diagnostics
    onLCP(metric => this.report(metric));
    onINP(metric => this.report(metric));
    onCLS(metric => this.report(metric));
    onFCP(metric => this.report(metric));
    onTTFB(metric => this.report(metric));
  }

  private report(metric: Metric): void {
    const report: VitalReport = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      url: this.anonymizeUrl(window.location.pathname),
      deviceType: this.getDeviceType(),
      connectionType: (navigator as any).connection?.effectiveType,
      attribution: metric.attribution as Record<string, unknown>,
    };

    // Use sendBeacon for reliability during page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', JSON.stringify(report));
    } else {
      // Fallback for browsers without sendBeacon
      this.http.post('/api/vitals', report).subscribe();
    }
  }

  private anonymizeUrl(pathname: string): string {
    // Replace dynamic segments with placeholders
    // /users/123/profile → /users/:id/profile
    return pathname.replace(/\/\d+/g, '/:id');
  }

  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone|ipod|blackberry/i.test(ua)) return 'mobile';
    return 'desktop';
  }
}

// main.ts — ініціалізація
bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withDomHydration()),
    // ...
  ]
}).then(() => {
  // Initialize after Angular boots
  inject(WebVitalsService).initialize();
});
```

```json
// lighthouserc.json — Lighthouse CI budget
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:4200/", "http://localhost:4200/dashboard"]
    },
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "interaction-to-next-paint": ["error", { "maxNumericValue": 200 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 1800 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "categories:performance": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Anti-Example

```typescript
// WRONG: Не оптимізовані зображення → LCP і CLS проблеми
@Component({
  template: `
    <!-- WRONG: немає explicit розмірів → браузер не резервує місце → CLS -->
    <img src="/hero.jpg" alt="Hero">

    <!-- WRONG: немає priority → LCP image не preloaded → повільний LCP -->
    <img ngSrc="/hero.webp" width="1200" height="600" alt="Hero">

    <!-- WRONG: loading="eager" на non-LCP images → блокує bandwidth для LCP -->
    <img src="/below-fold.jpg" loading="eager" alt="Below fold">
  `
})
export class BadComponent {}

// CORRECT:
@Component({
  imports: [NgOptimizedImage],
  template: `
    <!-- CORRECT: priority для LCP image -->
    <img ngSrc="/hero.webp" width="1200" height="600" alt="Hero" priority>

    <!-- CORRECT: явні розміри для non-LCP images -->
    <img ngSrc="/below-fold.webp" width="400" height="300" alt="Below fold">
  `
})
export class GoodComponent {}

// WRONG: Тяжка операція в event handler → поганий INP
@Component({
  template: `<button (click)="onFilter()">Filter</button>`
})
export class BadFilterComponent {
  items = Array.from({ length: 10000 }, (_, i) => i);
  filteredItems: number[] = [];

  onFilter(): void {
    // WRONG: синхронна важка операція блокує main thread → INP > 500ms
    this.filteredItems = this.items.filter(item => expensiveFilterFn(item));
  }
}

// CORRECT: використовуємо runOutsideAngular або Web Worker
@Component({
  template: `<button (click)="onFilter()">Filter</button>`
})
export class GoodFilterComponent {
  private ngZone = inject(NgZone);
  items = Array.from({ length: 10000 }, (_, i) => i);
  filteredItems = signal<number[]>([]);

  onFilter(): void {
    // CORRECT: важка операція поза Angular zone, results з Signal
    this.ngZone.runOutsideAngular(() => {
      // Yield to browser for paint, then compute
      requestIdleCallback(() => {
        const result = this.items.filter(item => expensiveFilterFn(item));
        this.ngZone.run(() => this.filteredItems.set(result));
      });
    });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `<img>` без explicit `width`/`height` або `aspect-ratio` | Браузер не резервує місце → layout shift при завантаженні → CLS spike | Завжди вказуй `width` і `height` або `aspect-ratio` в CSS; використовуй `NgOptimizedImage` |
| LCP image без `fetchpriority="high"` або `<link rel="preload">` | LCP image завантажується з низьким пріоритетом → повільний LCP | `NgOptimizedImage priority` або ручний `<link rel="preload" as="image">` |
| Тяжкі synchronous обчислення в event handlers | Блокують main thread між input і next paint → INP > 500ms | `runOutsideAngular`, `requestIdleCallback`, Web Workers, scheduler API |
| Angular без OnPush на компонентах з частими event bindings | Zone.js CD після кожного event → full tree check → INP penalty | `changeDetection: ChangeDetectionStrategy.OnPush` + Signals |
| SSR без `withDomHydration()` | Angular destroy server DOM і recreates → visible CLS spike + no LCP benefit | `provideClientHydration(withDomHydration())` в providers |

## Interview Block

### [L1 — Warm-up] Що таке Core Web Vitals і які три основні метрики вони вимірюють?

**Signal being tested:** Знання сучасних performance метрик включно з INP що замінив FID у 2024 році.

**What the interviewer expects:** Назви трьох метрик, що вони вимірюють, порогові значення "Good", awareness що FID deprecated.

**How to probe deeper:** "FID — чи все ще є Core Web Vital? Що таке INP і чим відрізняється від FID?"

**Reference answer:** LCP (Largest Contentful Paint) < 2.5s — час до найбільшого контентного елементу. INP (Interaction to Next Paint) < 200ms — замінив FID у березні 2024, вимірює worst interaction за session. CLS (Cumulative Layout Shift) < 0.1 — кумулятивне зміщення верстки. Всі три впливають на SEO ранжування.

**Common mistakes:** Называють FID замість INP; не знають порогових значень; думають що це тільки SEO метрики а не реальний UX.

### [L2 — Mid] Як Angular SSR та гідратація впливають на LCP і CLS?

**Signal being tested:** Розуміння того як Angular рендеринг pipeline взаємодіє з browser performance metrics.

**What the interviewer expects:** SSR покращує LCP (HTML з сервера), withDomHydration запобігає CLS (reuses DOM), мismatch = CLS.

**How to probe deeper:** "Що відбувається з CLS якщо server і client рендерять різний HTML?"

**Reference answer:** SSR покращує LCP: HTML з populated контентом приходить до JS bootstrap, браузер рендерить LCP element одразу. `withDomHydration()` критичний для CLS: без нього Angular destroy server DOM і recreates — visible CLS spike. З hydration — Angular traverses існуючий DOM і attaches listeners. Hydration mismatch (різний server/client HTML) → Angular reconciliation → CLS і warnings в devMode.

**Common mistakes:** Думають SSR автоматично вирішує CLS; не знають що без withDomHydration() Angular видаляє server HTML.

### [L3 — Senior] Як виміряти Core Web Vitals для Angular застосунку і що впливає на INP?

**Signal being tested:** Практичне знання measurement tools і глибоке розуміння Angular CD pipeline як INP contributor.

**What the interviewer expects:** web-vitals library, Lab vs Field data distinction, Zone.js + CD = INP overhead, OnPush + signals як fix.

**How to probe deeper:** "Як Zone.js впливає на INP? Як виміряти скільки часу займає Angular CD після click event?"

**Reference answer:** Measurement: web-vitals library для RUM, Lighthouse для lab, CrUX для field trends. INP у Angular: Zone.js тригерить CD після кожного event → full component tree check без OnPush → main thread blocked before next paint. Angular DevTools Profiler показує CD duration per event. Fix: OnPush + signals зменшує CD scope, runOutsideAngular для non-visual handlers. INP attribution API: `processingStart - startTime` = input delay, `processingEnd - processingStart` = JS processing.

**Common mistakes:** Профілюють в development mode (extra checks); використовують тільки Lighthouse ігноруючи real device field data.

### [L4 — Staff/Principal] Як спроектувати систему моніторингу Web Performance для production Angular застосунку з мільйонами користувачів?

**Signal being tested:** System-level мислення: sampling strategy, data pipeline, aggregation (P75 not mean), actionable alerting, privacy, correlation з deployments.

**What the interviewer expects:** web-vitals attribution, sendBeacon, P75 aggregation по route groups, sampling rate, alert hierarchy, deployment correlation, privacy (PII-free URLs).

**How to probe deeper:** "Як відрізнити performance regression від deployment vs backend slowdown? Як агрегувати метрики по route groups коли URL мають dynamic IDs?"

**Reference answer:** Collection: web-vitals attribution build via sendBeacon, sampling 100% для critical pages 10% для решти, анонімізовані URLs (/:id замість /123). Processing: P75 aggregation per route group + device/network segments — not mean. Storage: time-series DB. Alerting: P75 LCP > 2.5s AND > 1000 samples/hour = P1 incident. Deployment markers кореляція: regression після deploy → rollback trigger. Angular-specific: hydration timing, CD performance tracking.

**Common mistakes:** Зберігають raw events і aggregating post-hoc — не масштабується; алертять на mean замість P75/P95.

---

## Summary

### Key Points
- Core Web Vitals: LCP < 2.5s (loading), INP < 200ms (interactivity), CLS < 0.1 (stability) — FID deprecated березень 2024
- INP = worst interaction за session, не перша — вимагає загального підходу до CD performance в Angular
- Angular Zone.js тригерить CD після кожного event — OnPush + Signals критичні для INP
- `NgOptimizedImage` (v15+) автоматично вирішує типові LCP та CLS image проблеми
- `withDomHydration()` обов'язковий з SSR — без нього Angular destroy server DOM = CLS spike
- Lab (Lighthouse) vs Field (CrUX P75) — обидва потрібні: lab для debugging, field для реальних KPIs
- Performance budget: Angular CLI budgets (compile-time) + Lighthouse CI assertions (regression detection)

### Elevator Pitch (2 minutes)
Core Web Vitals — три метрики Google що вимірюють реальний UX: LCP (як швидко завантажується), INP (як швидко реагує), CLS (чи стрибає верстка). FID замінено INP у 2024 — тепер вимірюється worst interaction за весь session, не лише перша. Angular напряму впливає на всі три: Zone.js тригерить Change Detection після кожного event — без OnPush + Signals INP деградує. NgOptimizedImage (v15+) автоматично додає fetchpriority і explicit dimensions — fix для LCP і CLS. SSR з withDomHydration покращує LCP без CLS regression. Вимірювати: web-vitals library для RUM, Lighthouse для lab, CrUX для field trends. Performance budget: Angular CLI budgets блокують build при перевищенні розміру, Lighthouse CI assertions блокують deploy при regression CWV.
