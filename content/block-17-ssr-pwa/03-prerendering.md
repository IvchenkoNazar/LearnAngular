---
title: "Static Site Generation & Prerendering"
block: 17
topic: 3
slug: "prerendering"
difficulty: 3
sinceVersion: "2"
tags: ["prerendering", "SSG", "static generation", "routesFile", "platform detection", "ng build --prerender", "app-shell"]
relatedTopics: ["angular-universal", "hydration", "routing", "service-workers-pwa"]
interviewQuestions:
  - id: "b17t3q1"
    level: "junior"
    question: "Що таке prerendering (SSG) в Angular і чим він відрізняється від SSR?"
    referenceAnswers:
      junior: "Prerendering генерує HTML файли під час збірки, а не при кожному запиті. SSR генерує HTML на сервері при кожному запиті. Prerendering швидший бо файли просто відправляються з CDN."
      mid: "SSR (Server-Side Rendering) рендерить HTML per-request в runtime — потрібен живий Node.js сервер. SSG/Prerendering рендерить HTML при build-time — результат статичні HTML файли що можна розмістити на CDN або статичному hosting. Переваги SSG: швидкий TTFB (CDN edge delivery), нульова серверна інфраструктура, простий deployment. Обмеження: контент оновлюється тільки при новій збірці — не підходить для часто змінного або personalized контенту."
      senior: "SSG = SSR at build-time. Angular виконує той самий render pipeline (Angular Universal / CommonEngine), але замість відповіді на HTTP request — записує HTML файл. angular.json prerender конфігурація: Angular рендерить кожен route з routes file і зберігає в dist/browser/{route}/index.html. При deployment: nginx/CDN відповідає на /products/123 статичним файлом dist/browser/products/123/index.html. На клієнті відбувається hydration — SSG + hydration = instant FCP + interactive client. Dynamic routes потребують explicit routes file або routes extraction з router config."
      staff: "SSG в контексті rendering strategies: CSR (runtime browser) → SSG (build-time server) → SSR (request-time server) → ISR (Incremental Static Regeneration, revalidate on access). Angular підтримує CSR, SSG, SSR нативно. ISR — через кастомний server middleware. Архітектурне рішення: content update frequency визначає strategy. Static pages (about, landing) → SSG. Blog posts (оновлюються рідко) → SSG або ISR. Product catalog (змінюються ціни) → SSR з caching або ISR. User dashboard → CSR. Angular app-shell pattern поєднує SSG (shell without data) + SW (offline capability) — ідеально для PWA з dynamic data."
    commonMistakes:
      - "Думають що SSG і SSR взаємовиключні — можна мати SSR для деяких routes і SSG для інших"
      - "Не розуміють що prerendering все одно потребує Angular Universal setup (рендеринг відбувається в Node.js)"
    relatedQuestions: ["b17t3q2", "b17t1q1"]
  - id: "b17t3q2"
    level: "mid"
    question: "Як налаштувати prerendering для dynamic routes в Angular?"
    referenceAnswers:
      junior: "Потрібно вказати список routes які треба prerender в конфігурації. Angular сам не знає які є параметри для dynamic routes."
      mid: "Для dynamic routes типу /products/:id Angular не може автоматично знати всі значення :id. Є два підходи: 1) routesFile — текстовий файл з explicit списком routes (один URL per рядок), 2) Router config extraction — Angular може аналізувати router config і extract статичні routes автоматично. В angular.json: prerender.routesFile: 'routes.txt'. Файл routes.txt: '/products/1\n/products/2\n...'."
      senior: "Prerendering конфігурація в angular.json: builder @angular/build:application з prerender опцією. Routes discovery: Angular 17+ автоматично аналізує Router config і prerender всі статичні routes. Для параметризованих routes (/:id): 1) routesFile: текстовий файл або JSON зі списком всіх URL, 2) Програматичний підхід: getRoutes() функція що повертає Promise<string[]> — можна робити API call для отримання всіх product IDs. Важливий нюанс: prerender виконується в Node.js context — platform guards для browser APIs, TransferState для даних що завантажуються під час prerender."
      staff: "Dynamic routes prerendering — це data-driven build process. Production pattern: routes генеруються з CMS/database під час CI/CD. Architectural рішення: 1) Build-time data fetching (static config) — з'єднання до БД під час build, генерація routes.txt, prerender, 2) Routes from API endpoint — спеціальний /api/routes endpoint що повертає всі valid slugs, 3) Hybrid: prerender популярні routes (top-N за analytics), SSR для довгого хвоста. Проблема scale: 10K продуктів = 10K prerender operations в build — час збірки. Solution: separate prerender step, incremental prerender (тільки нові/змінені), або ISR-like pattern з short-lived cache. Operational: routes.txt є артефактом збірки — version control або генерація в CI, не в repo."
    commonMistakes:
      - "Забувають налаштувати routesFile і дивуються що /products/123 повертає 404"
      - "Не враховують час збірки при великій кількості routes для prerendering"
    relatedQuestions: ["b17t3q1", "b17t3q3"]
  - id: "b17t3q3"
    level: "mid"
    question: "Що таке Angular App Shell і як він пов'язаний з PWA?"
    referenceAnswers:
      junior: "App Shell — це мінімальний HTML/CSS/JS що завантажується першим і показує skeleton UI поки завантажується основний контент."
      mid: "App Shell pattern: заздалегідь рендерується і кешується (Service Worker) мінімальний UI shell (навігація, header, skeleton) — це те що показується миттєво при кожному запуску, навіть offline. Дані (динамічний контент) завантажуються після. Angular App Shell — prerendering кореневого route з мінімальним UI, який потім Service Worker кешує. Команда: ng generate app-shell. Результат: dist/browser містить prerendered shell для index.html."
      senior: "Angular App Shell = SSG кореневого маршруту + Service Worker caching. Технічно: ng generate app-shell створює AppShellComponent (route що рендериться під час prerender), модифікує angular.json для app-shell build step. Build process: Angular рендерить AppShellComponent в index.html, ngsw-config.json налаштовує SW для cache-first стратегії на Shell HTML і assets. При першому відвідуванні: браузер завантажує shell HTML → SW реєструється → кешує shell. При наступних: SW відповідає миттєво з cache. Для PWA: App Shell + SW кешування = offline-capable instant startup."
      staff: "App Shell архітектурний pattern вирішує perceived performance: перший paint миттєвий (shell з cache), дані підвантажуються async. Design considerations: shell повинен бути максимально thin — тільки navigation chrome, не контент. Якщо shell занадто важкий — loses the benefit. Integration з Signals: shell компонент може мати signal-based loading state, динамічний контент завантажується через services після shell display. PWA audit (Lighthouse): App Shell score залежить від: SW реєстрація, shell cached, offline fallback. Обмеження: App Shell pattern погано поєднується з SSR для personalized content — shell по визначенню generic. Для authenticated apps: shell показує navigation skeleton, authenticated content завантажується client-side після auth check."
    commonMistakes:
      - "Роблять App Shell занадто важким (з даними) — втрачається benefit миттєвого завантаження"
      - "Не налаштовують Service Worker для кешування shell — prerendering без SW = не повний App Shell pattern"
    relatedQuestions: ["b17t3q2", "b17t4q1"]
  - id: "b17t3q4"
    level: "senior"
    question: "Коли вибирати SSG vs SSR vs CSR для Angular додатку?"
    referenceAnswers:
      junior: "SSG — для статичного контенту, SSR — для dynamic і SEO, CSR — для authenticated dashboards."
      mid: "Критерії вибору: SEO потреби (SSG/SSR перемагають CSR), частота оновлення контенту (SSG — рідко, SSR — постійно), personalization (SSG — ні, SSR — так з overhead, CSR — так), infrastructure (SSG — тільки CDN, SSR — Node.js server). Гібридний підхід: SSG для публічних сторінок + CSR для authenticated areas."
      senior: "Decision matrix: Content freshness × Personalization × SEO × Infrastructure cost. SSG: marketing pages, blog, docs — максимальна швидкість, мінімальна інфраструктура, SEO perfect. SSR: e-commerce (ціни/наявність змінюються), news (свіжий контент), personalized homepages — server cost але maximum flexibility. CSR: authenticated dashboards, admin panels, real-time apps — no server needed, no SEO concerns. Hybrid (найчастіше production pattern): SSG для shell + CSR для dynamic data, або route-level strategy в Angular (деякі routes prerendered, інші SSR, інші CSR)."
      staff: "Rendering strategy є архітектурним рішенням що впливає на: team skills (SSR потребує server-side thinking), infrastructure cost, deployment complexity, developer experience. Framework для прийняття рішення: 1) Map content types → rendering strategy, 2) Assess team capabilities і infrastructure, 3) Evaluate SEO requirements per page type, 4) Consider migration path (починати з CSR, додавати SSR incrementally). Common mistake: вибирати one-size-fits-all — Angular підтримує per-route strategy. Advanced: Edge rendering (Cloudflare Workers) — SSR-like з SSG-like latency, але обмежений runtime. ISR (manual через cache layer) — SSG що оновлюється автоматично після TTL. Trade-off matrix варто документувати і ревʼювати при зміні requirements."
    commonMistakes:
      - "Застосовують SSR скрізь — там де SSG достатньо, SSR додає зайву складність"
      - "Ігнорують hybrid підхід — вважають що весь додаток повинен мати одну стратегію"
    relatedQuestions: ["b17t3q1", "b17t1q5"]
  - id: "b17t3q5"
    level: "staff"
    question: "Як prerendering впливає на CI/CD pipeline і deployment стратегію?"
    referenceAnswers:
      junior: "Prerendering додає час до збірки, бо треба рендерити HTML для кожної сторінки."
      mid: "Prerendering відбувається під час ng build — збільшує build time пропорційно кількості routes. Результат — статичні HTML файли в dist/browser, що деплояться на CDN або статичний hosting. Для dynamic routes потрібен routes.txt що може генеруватися з API під час CI."
      senior: "CI/CD impact: build step включає Node.js execution Angular для кожного prerendered route — CPU і час. Для 1000 routes: секунди; для 100K routes: хвилини. Deployment: статичні HTML артефакти → S3 + CloudFront, Firebase Hosting, Vercel. Cache invalidation: при redeployment треба invalidate CDN cache для змінених routes. Incremental deployment: тільки змінені routes перегенеровані. Routes source: CI/CD pipeline робить API call → отримує product slugs → генерує routes.txt → ng build → deploy."
      staff: "Prerendering в production CI/CD потребує: 1) Routes generation strategy — static (repo), API-driven (CI fetch), або hybrid, 2) Parallelization — Angular prerender можна паралелізувати по routes (workers), 3) Artifact management — HTML artifacts треба versioned і atomic deployment (старі файли available поки нові deployуються), 4) Cache strategy — CDN cache TTL для prerendered pages, cache invalidation при content update, 5) Content freshness SLA — якщо product змінюється, через скільки часу prerendered сторінка оновиться? Build-on-demand vs scheduled rebuild vs webhook-triggered rebuild. Для headless CMS: webhook on publish → trigger rebuild → prerender new/changed routes only → deploy delta. Monitoring: build time trend (indicator що routes count росте too fast), build failure alerting (prerender crash = broken deployment)."
    commonMistakes:
      - "Не враховують CDN cache invalidation при redeployment — старий контент залишається на edge"
      - "Блокують CI pipeline на prerendering 100K routes без паралелізації — build займає годину"
    relatedQuestions: ["b17t3q4", "b17t1q5"]
---

## Core Concept

**English definition:** Prerendering (Static Site Generation / SSG) is the process of rendering Angular routes to static HTML files at build time, which are then served directly from a CDN or static file server without requiring a running Angular server.

**Пояснення:** Prerendering — це запуск Angular Universal під час `ng build` замість під час HTTP запиту. Результат: папка `dist/browser/` з HTML файлами для кожного route (`/products/1/index.html`, `/about/index.html` тощо). Ці файли деплояться на CDN і відповідають на запити без будь-якого сервера. Браузер завантажує готовий HTML (fast FCP) і потім Angular hydrat'ує його для interactive experience.

**Яку проблему вирішує:**
- **SEO без серверної інфраструктури:** HTML доступний для search crawlers без Node.js сервера
- **Maximum TTFB:** CDN edge delivery — статичний файл з найближчого edge node, ~10-50ms
- **Operational simplicity:** Немає сервера — немає server monitoring, scaling, health checks
- **Offline-first (App Shell):** Service Worker кешує prerendered shell для instant repeat visits і offline capability

**Як працює під капотом:**

```
ng build (з prerender: true в angular.json)
  ↓
Angular Universal bootstrap в Node.js
  ↓
Для кожного route в routes list:
  CommonEngine.render({ url: '/products/1' })
  ↓
HTML string
  ↓
dist/browser/products/1/index.html
  ↓
Deployment → CDN
```

**Trade-offs та обмеження:**
- **Stale content:** HTML статичний — оновлення контенту потребує нової збірки
- **Build time:** 10K routes = значно довший build
- **Dynamic routes:** `/products/:id` потребує explicit список всіх значень `:id`
- **Personalized content неможливий:** Усі користувачі отримують однаковий prerendered HTML
- **Platform limitations:** Під час prerender — server context, browser APIs недоступні без guards

**Версійність:**
- Angular 2-12: `@nguniversal/express-engine` + окремий prerender script
- Angular 13-16: `@nguniversal/builders` з `prerender` builder
- Angular 17+: `@angular/build:application` builder з вбудованою підтримкою `prerender` опції в angular.json
- Angular 17+: Автоматичне виявлення статичних routes з Router config (не потребує ручного routes.txt для простих cases)
- Angular 18+: Incremental hydration сумісна з prerendered HTML

## Deep Details

### Edge Cases

**Route з параметром — prerender failure:**
```typescript
// routes.ts
export const routes: Routes = [
  { path: 'products/:id', component: ProductComponent }, // ❌ Angular не знає значення :id
  { path: 'about', component: AboutComponent },           // ✅ статичний route — автоматично prerender
];
```

```
// routes.txt — явний список для параметризованих routes
/products/1
/products/2
/products/best-seller
/about
```

**Guards під час prerendering:**
```typescript
// ❌ CanActivate guard що перевіряє auth — заблокує prerender
// Prerender виконується без user context
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).isAuthenticated(); // на сервері: false — route не рендериться
};

// ✅ Використовувати окремий route без guard для prerendered версії
// або вимикати guard для SSR контексту
export const authGuard: CanActivateFn = () => {
  if (isPlatformServer(inject(PLATFORM_ID))) return true; // пропустити на сервері
  return inject(AuthService).isAuthenticated();
};
```

**Data завантаження при prerender:**
Якщо компонент завантажує дані в ngOnInit через HTTP — prerender включить ці дані в HTML. Це добре для SEO але потребує TransferState щоб уникнути double-fetch на клієнті.

### Junior vs Senior Understanding

**Junior** знає: "prerender = HTML at build time, configure в angular.json."

**Senior** розуміє весь pipeline: routes discovery → CommonEngine.render() per route → hydration annotations → CDN deployment. Senior знає що prerender є build-time SSR — ті самі gotchas (browser APIs, isStable, TransferState) + додаткові (dynamic routes, guards, content freshness SLA). Senior також розуміє App Shell pattern як prerender + Service Worker = PWA foundation.

```typescript
// Програматична генерація routes для prerender
// scripts/generate-routes.ts — виконується перед ng build

import { writeFileSync } from 'fs';
import fetch from 'node-fetch';

async function generateRoutes() {
  const [products, articles] = await Promise.all([
    fetch('https://api.example.com/products/slugs').then(r => r.json()),
    fetch('https://api.example.com/articles/slugs').then(r => r.json()),
  ]);

  const routes = [
    '/',
    '/about',
    '/contact',
    ...products.map((p: { slug: string }) => `/products/${p.slug}`),
    ...articles.map((a: { slug: string }) => `/blog/${a.slug}`),
  ];

  writeFileSync('routes.txt', routes.join('\n'));
  console.log(`Generated ${routes.length} routes`);
}

generateRoutes();
```

### Deprecation & Migration Path

- **Deprecated:** `@nguniversal/builders` — замінений на `@angular/build:application` з вбудованим prerender
- **Deprecated:** Окремий `prerender` builder — тепер опція в основному builder
- **Migration:** `ng update @nguniversal/express-engine` → автоматично оновлює до `@angular/ssr` + нову конфігурацію
- **Old config:**
  ```json
  { "builder": "@nguniversal/builders:prerender", "options": { "routes": [...] } }
  ```
- **New config (Angular 17+):**
  ```json
  { "builder": "@angular/build:application", "options": { "prerender": { "routesFile": "routes.txt" } } }
  ```

### Connections to Other Concepts

- **Angular Universal / SSR (Topic 1):** Prerender використовує той самий render engine (CommonEngine) — build-time SSR
- **Hydration (Topic 2):** Prerendered HTML + provideClientHydration() = optimal загрузка
- **Service Workers (Topic 4):** App Shell pattern = prerendered shell + SW caching = offline PWA
- **Router:** Route config — джерело для automatic routes discovery; route guards впливають на prerendering

## Examples

### Basic Usage

```json
// angular.json — мінімальна prerender конфігурація (Angular 17+)
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "outputPath": "dist/my-app",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "server": "src/main.server.ts",
            "prerender": true
          }
        }
      }
    }
  }
}
```

```typescript
// app.config.server.ts — server config for prerendering
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

### Production Scenario

```json
// angular.json — prerender з dynamic routes (production)
{
  "prerender": {
    "routesFile": "routes.txt",
    "discoverRoutes": true
  }
}
```

```typescript
// CI/CD script: generate routes from API, then build
// ci/generate-routes.ts
import { writeFileSync } from 'fs';

interface ProductSlug { slug: string; }
interface BlogSlug { slug: string; }

async function generatePrerenderRoutes(): Promise<void> {
  const API_URL = process.env['API_URL'] ?? 'https://api.example.com';

  const [products, posts] = await Promise.all([
    fetch(`${API_URL}/products/slugs`).then(r => r.json() as Promise<ProductSlug[]>),
    fetch(`${API_URL}/blog/slugs`).then(r => r.json() as Promise<BlogSlug[]>),
  ]);

  const staticRoutes = ['/', '/about', '/contact', '/pricing'];
  const dynamicRoutes = [
    ...products.map(p => `/products/${p.slug}`),
    ...posts.map(p => `/blog/${p.slug}`),
  ];

  const allRoutes = [...staticRoutes, ...dynamicRoutes];
  writeFileSync('routes.txt', allRoutes.join('\n'));

  console.log(`Prerender routes: ${staticRoutes.length} static + ${dynamicRoutes.length} dynamic = ${allRoutes.length} total`);
}

generatePrerenderRoutes().catch(console.error);
```

```typescript
// App Shell setup (Angular 17+)
// ng generate app-shell generates this automatically

// app-shell.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <nav class="shell-nav">
      <!-- Static navigation — завжди доступна offline -->
      <a routerLink="/">Home</a>
      <a routerLink="/products">Products</a>
      <a routerLink="/blog">Blog</a>
    </nav>
    <main class="shell-content">
      <router-outlet />
    </main>
  `,
})
export class AppShellComponent {}
```

### Anti-Example

```typescript
// ❌ WRONG: Date.now() в prerendered компоненті
@Component({
  template: `<p>Last updated: {{ lastUpdate }}</p>`,
})
export class ProductComponent {
  lastUpdate = new Date(Date.now()).toLocaleDateString(); // Build-time date frozen in HTML!
  // Prerendered 2024-01-15, user visits 2024-06-01 — shows "1/15/2024" always
}

// ✅ CORRECT: Dynamic data завантажується client-side
@Component({
  template: `<p>Last updated: {{ lastUpdate }}</p>`,
})
export class ProductComponent {
  lastUpdate = '';

  constructor() {
    afterNextRender(() => {
      // Виконується тільки на клієнті після hydration — shows real current value
      this.lastUpdate = new Date().toLocaleDateString();
    });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Prerender authenticated routes | Routes за auth guard не рендеряться або рендеряться з неповним контентом | Prerender тільки публічні routes; authenticated контент завантажується CSR |
| `Date.now()` / `Math.random()` в prerendered components | Build-time значення frozen у HTML — невірний контент для користувачів | `afterNextRender()` або SSR + hydration для dynamic values |
| Prerender 100K+ routes без кешування між builds | Величезний build time при кожній зміні | Incremental prerender (тільки змінені routes), або ISR-like cache |
| Відсутність routesFile для dynamic routes | Параметризовані routes (`/:id`) не prerender'яться — 404 | Генерувати routes.txt в CI з API даних |
| App Shell без Service Worker | Prerendered shell без SW кешування — немає offline benefit | `ng add @angular/pwa` для повного App Shell + SW setup |

## Interview Block

### [L1 — Warm-up] Що таке prerendering (SSG) в Angular і чим він відрізняється від SSR?
**Signal being tested:** Чи розуміє кандидат rendering spectrum і може обґрунтувати вибір стратегії
**What the interviewer expects:** Build-time vs request-time, static files vs Node.js server, trade-offs (staleness vs speed/cost)
**How to probe deeper:** "Коли prerendering недостатній і потрібен повноцінний SSR?"
**Reference answer:** SSG рендерить HTML при build-time → статичні файли на CDN. SSR рендерить per-request на Node.js сервері. SSG: швидший TTFB (CDN edge), нульова серверна інфраструктура, але контент оновлюється тільки при rebuild. SSR: свіжий контент кожен запит, може бути personalized, але потребує infrastructure.
**Common mistakes:** Думають що треба вибирати між SSG і SSR для всього додатку; не розуміють що prerender використовує той самий Angular Universal engine

### [L2 — Mid] Як налаштувати prerendering для dynamic routes в Angular?
**Signal being tested:** Практичне знання конфігурації і розуміння problem з parametrized routes
**What the interviewer expects:** routesFile, discoverRoutes: true, CI-генерація routes з API, angular.json prerender option
**How to probe deeper:** "Якщо у вас 50,000 product pages — як оптимізувати build time?"
**Reference answer:** Angular автоматично discovers статичні routes з Router config. Для `/products/:id` потрібен routesFile з explicit list всіх URLs. В production: CI script робить API call → отримує всі slugs → генерує routes.txt → ng build. angular.json: `"prerender": { "routesFile": "routes.txt" }`.
**Common mistakes:** Не надають routesFile і дивуються що dynamic routes відсутні; генерують routes.txt в repo замість CI pipeline

### [L3 — Senior] Що таке Angular App Shell і як він пов'язаний з PWA?
**Signal being tested:** Розуміння App Shell pattern і його ролі в offline-first PWA architecture
**What the interviewer expects:** Prerendered shell + SW caching = instant startup + offline, ng generate app-shell, ngsw-config
**How to probe deeper:** "Що відбувається якщо App Shell занадто важкий з даними?"
**Reference answer:** App Shell = prerendering кореневого route (navigation chrome без dynamic data) + Service Worker кешування цього shell. Результат: instant repeat visits (shell з cache), offline capability. ng generate app-shell автоматично налаштовує AppShellComponent і angular.json. Shell повинен бути мінімальним — тільки navigation structure, дані завантажуються async.
**Common mistakes:** Роблять App Shell занадто важким (включають дані); не розуміють що SW є обов'язковим компонентом App Shell pattern

### [L4 — Staff/Principal] Як prerendering впливає на CI/CD pipeline і deployment стратегію?
**Signal being tested:** System-level thinking про build automation, content freshness, і operational concerns
**What the interviewer expects:** Routes generation in CI, build time scaling, CDN cache invalidation, content freshness SLA, atomic deployment
**How to probe deeper:** "Як забезпечити свіжість prerendered контенту при частих updates CMS?"
**Reference answer:** CI pipeline: генерація routes.txt з API → ng build з prerender → atomic deployment до CDN. Challenges: build time при scale (parallelization, incremental prerender), CDN cache invalidation при deployment, content freshness SLA (webhook від CMS → trigger rebuild для конкретних routes). Monitoring: build time trend, prerender failures alerting. Hybrid strategy: часто змінюваний контент → SSR, рідко → SSG.
**Common mistakes:** Забувають CDN cache invalidation; не мають стратегії для content freshness SLA; блокують CI pipeline на великому prerender без оптимізації

## Summary

### Key Points
- Prerendering (SSG) = SSR at build-time → статичні HTML файли на CDN без серверної інфраструктури
- Angular 17+ вбудував prerender в `@angular/build:application` builder — більше не потрібен окремий `@nguniversal/builders`
- Dynamic routes (`/:id`) потребують explicit `routesFile` — Angular не знає значення параметрів автоматично
- App Shell = prerendered shell + Service Worker caching = PWA foundation для offline-capable apps
- Prerendered HTML + `provideClientHydration()` = optimal loading (instant FCP + interactive client)
- SSG не підходить для personalized або часто змінюваного контенту — для цього SSR або CSR
- CI/CD integration: routes.txt генерується динамічно з API/CMS під час build pipeline

### Elevator Pitch (2 minutes)
"Prerendering в Angular — це запуск Angular Universal під час збірки замість при кожному HTTP запиті. Результат: статичні HTML файли для кожного route в dist/browser/, які деплояться на CDN. Це дає максимальний TTFB (CDN edge delivery) і нульову серверну інфраструктуру. Angular 17+ автоматично discovers статичні routes з Router config; для dynamic routes (/products/:id) потрібен routesFile зі списком всіх URLs — зазвичай генерується в CI з API. App Shell pattern розширює prerendering: мінімальний navigation shell prerender'иться і Service Worker кешує його — результат instant startup і offline-capable PWA. Ключове обмеження: prerendered контент статичний і оновлюється тільки при новій збірці — не підходить для personalized або real-time контенту."
