---
title: "Angular Universal — Server-Side Rendering"
block: 17
topic: 1
slug: "angular-universal"
difficulty: 4
sinceVersion: "2"
tags: ["SSR", "Angular Universal", "server-side rendering", "TransferState", "makeStateKey", "platform-server", "isPlatformBrowser"]
relatedTopics: ["hydration", "prerendering", "change-detection", "dependency-injection"]
interviewQuestions:
  - id: "b17t1q1"
    level: "junior"
    question: "Що таке Server-Side Rendering в Angular і для чого він потрібен?"
    referenceAnswers:
      junior: "SSR — це коли Angular генерує HTML на сервері, а не в браузері. Це допомагає SEO і першому завантаженню сторінки, бо браузер отримує готовий HTML замість порожньої сторінки."
      mid: "SSR вирішує три проблеми: SEO (search bots бачать повний HTML), Time to First Contentful Paint (користувач бачить контент без чекання JS), і share previews (Open Graph теги в соцмережах). Angular Universal рендерить додаток через Node.js сервер, повертає готовий HTML, а потім на клієнті відбувається hydration — Angular 'оживляє' статичний HTML без повного ре-рендеру."
      senior: "SSR вирішує Cold Start UX проблему: при CSR браузер завантажує bundle, парсить JS, виконує bootstrap, робить API call — тільки тоді контент видно. При SSR сервер виконує той самий Angular код, але в Node.js через @angular/platform-server. Ключова деталь: після SSR рендеру, коли клієнт завантажується, Angular раніше робив full re-render (знищував SSR DOM і рендерив заново) — це robbed the benefit. Angular 16 додав developer preview hydration, Angular 17 зробив її stable, що дозволяє reuse SSR DOM. Також TransferState запобігає double HTTP requests (server + client роблять той самий API call)."
      staff: "SSR — це rendering strategy в спектрі CSR → SSR → SSG → ISR. Architectural рішення залежить від: content freshness requirements, server infrastructure cost, SEO importance, user demographics (poor network — SSR wins). Angular's CommonEngine (замінив AppServerModule в v17+) компілює і виконує Angular в Node.js context. Під капотом використовується platform-server замість platform-browser — різні implementations одних і тих самих tokens (DOCUMENT, Renderer2 тощо). В scale: SSR потребує stateless servers або sticky sessions (Angular SSR само по собі stateless, але DI tree — per request), CDN edge rendering, cache strategies. В Angular 19+: zoneless SSR стало продакшн-реді, що спрощує performance та eliminates Zone.js overhead на сервері."
    commonMistakes:
      - "Думають що SSR автоматично означає кращий SEO — без TransferState можуть бути duplicate API calls і мерехтіння контенту"
      - "Не розуміють різниці між SSR і hydration — SSR повертає HTML, hydration 'оживляє' його"
    relatedQuestions: ["b17t1q2", "b17t2q1"]
  - id: "b17t1q2"
    level: "mid"
    question: "Як TransferState вирішує проблему подвійних HTTP запитів при SSR?"
    referenceAnswers:
      junior: "TransferState зберігає дані з сервера і передає їх на клієнт, щоб не робити запити двічі."
      mid: "На сервері Angular виконує HTTP запити і зберігає результати в TransferState store за допомогою makeStateKey. Цей store серіалізується в JSON і вбудовується в HTML (в <script> тег типу application/json). На клієнті при bootstrap Angular десеріалізує цей store, і коли сервіс робить той самий HTTP запит — він спочатку перевіряє TransferState і повертає кешовані дані замість real HTTP call. Ключово: стан автоматично видаляється після першого отримання (one-time use)."
      senior: "TransferState — це key-value store реалізований через ApplicationRef. makeStateKey<T>('key') створює typed ключ. На сервері: після рендеру Angular серіалізує store і вставляє як inline script з id='ng-state'. На клієнті: BrowserTransferStateModule (legacy) або automatical через provideClientHydration() читає цей script при bootstrap. Проблема: якщо HTTP request відрізняється між server і client (різні query params, headers) — Transfer не спрацює. Кастомний підхід: inject TransferState в service, explicit check з hasKey()/get()/set(). З Angular HttpClient і withInterceptors — є built-in withHttpTransferCache() що автоматизує процес без ручного TransferState management."
      staff: "TransferState — це loading state serialization механізм. Architectural проблема: server і client виконують однакову business logic але в різних environments. TransferState bridge це через HTML payload. withHttpTransferCache() (v17+) автоматично кешує GET requests — але має edge cases: не кешує мутації, не враховує auth headers (може передати protected data в public HTML), не кешує при помилках. В production: потрібна стратегія для які дані безпечно transfer (public data — yes, user-specific — maybe with caution, auth tokens — never). В CDN контексті: HTML з вбудованим state не може бути cached на edge якщо state user-specific — це вибір між CDN efficiency і personalization."
    commonMistakes:
      - "Не використовують TransferState і дивуються чому API calls виконуються двічі"
      - "Кешують user-specific дані в TransferState що може привести до data leaks між користувачами на shared servers"
    relatedQuestions: ["b17t1q1", "b17t1q3"]
  - id: "b17t1q3"
    level: "mid"
    question: "Чому isPlatformBrowser/isPlatformServer guard необхідний в SSR додатку?"
    referenceAnswers:
      junior: "Деякий код працює тільки в браузері (window, document) і не працює на сервері. isPlatformBrowser перевіряє де виконується код."
      mid: "На Node.js сервері немає window, document, localStorage, navigator та інших browser APIs. Angular Universal використовує DOM emulation, але вона неповна. Наприклад, setTimeout/setInterval технічно доступні, але можуть cause memory leaks якщо не очищені. PLATFORM_ID injection token надає ідентифікатор платформи — isPlatformBrowser(PLATFORM_ID) повертає true тільки в браузері. Це дозволяє умовно виконувати browser-specific логіку."
      senior: "isPlatformBrowser — це runtime guard, але є ще compile-time підхід через @angular/cdk/platform. Під капотом PLATFORM_ID — це InjectionToken<Object>, platform-browser надає 'browser', platform-server надає 'server'. Для SSR-safe компонентів є кілька підходів: 1) isPlatformBrowser guard в ngOnInit, 2) afterRender/afterNextRender хуки (v16.2+) що виконуються тільки на клієнті, 3) Dependency injection — inject SSR-safe абстракцію. Кращий підхід ніж isPlatformBrowser: inject Renderer2 замість нативних DOM API — Renderer2 implementation змінюється між platforms. Для localStorage — inject абстракцію або TOKEN зі значенням null на сервері."
      staff: "Platform detection — це symptom of poor abstraction. Кожен isPlatformBrowser в компоненті — це coupling to environment і тест smell. Senior engineer створює abstractions: STORAGE token (LocalStorageService vs NullStorageService per platform), WINDOW token (window object vs null), ANIMATION_FRAME token. Це дозволяє компонентам бути platform-agnostic і testable без SSR environment. Architectural підхід: 'components should not know where they run'. В Angular Universal 16+ afterRender/afterNextRender lifecycle hooks — офіційно рекомендований pattern замість isPlatformBrowser для DOM manipulation. В Angular CDK Overlay — повністю platform-agnostic через таку абстракцію."
    commonMistakes:
      - "Доступ до window/document безпосередньо без guard — додаток падає на сервері"
      - "Перевіряють typeof window !== 'undefined' замість isPlatformBrowser — менш читабельно і не Angular-ідіоматично"
    relatedQuestions: ["b17t1q2", "b17t2q1"]
  - id: "b17t1q4"
    level: "senior"
    question: "Що таке CommonEngine в Angular SSR і чим вона відрізняється від старого AppServerModule підходу?"
    referenceAnswers:
      junior: "CommonEngine — це новий спосіб робити SSR в Angular, який простіше налаштувати."
      mid: "AppServerModule — це NgModule що bootstrap'ує додаток для SSR. CommonEngine (v16+) — це новий API який працює без NgModule. CommonEngine.render() приймає { bootstrap, document, url, providers } і повертає Promise<string> з rendered HTML. Це більш functional підхід і не потребує окремого server module."
      senior: "Еволюція SSR API: Angular 2-15 використовував AppServerModule extends AppModule + ServerModule. Це вимагало окремий entry point для server. Angular 16 представив CommonEngine з @angular/ssr, Angular 17 зробив standalone SSR default — тепер bootstrapApplication використовується без AppServerModule. CommonEngine.render() internally: 1) Створює server platform через createServerPlatform(), 2) Bootstrap компонент в server environment, 3) Чекає завершення рендеру (включно з async operations), 4) Серіалізує DOM через domino або @angular/platform-server DOM implementation, 5) Повертає HTML string. Важливий нюанс: 'stability' — Angular чекає поки ApplicationRef.isStable стане true перед серіалізацією. Якщо є довгі intervals або незавершені observables — рендер ніколи не завершиться."
      staff: "CommonEngine — це abstraction над render pipeline. Architectural значення: server.ts тепер є thin adapter між Express/Fastify і Angular renderer. CommonEngine per-request DI: кожен render() call отримує request-scoped providers (URL, headers, request context). Це критично для: personalized SSR (inject user context), A/B testing (inject variant), multi-tenancy (inject tenant config). Production considerations: 1) CommonEngine рендерить синхронно в terms of Node.js event loop (але async всередині) — потрібен concurrency control, 2) Memory per render — Angular bootstrap allocates, треба profiling, 3) CPU-bound — виграє від clustering або worker threads, 4) Cache layer — ідентичні URLs можна cache в Redis з TTL. Angular 17+ application builder об'єднує server і client builds — спрощує toolchain але потребує розуміння outputPath конфігурації."
    commonMistakes:
      - "Залишають довгоживучі Observables незакритими — AppRef ніколи не стає stable і SSR render висить"
      - "Не налаштовують request-scoped providers — всі запити шарять state"
    relatedQuestions: ["b17t1q3", "b17t2q1"]
  - id: "b17t1q5"
    level: "staff"
    question: "Як би ви спроєктували SSR архітектуру для high-traffic Angular додатку з personalized контентом?"
    referenceAnswers:
      junior: "Потрібен сервер що рендерить HTML з Angular Universal і відправляє користувачу."
      mid: "Можна кешувати rendered HTML на CDN для публічного контенту і робити server-side рендер для персоналізованого. TransferState для API відповідей, Node.js cluster для concurrency."
      senior: "Архітектура: 1) Публічний контент — prerendering на build-time або edge SSR з CDN cache (Cloudflare Workers, Vercel Edge), 2) Персоналізований — server SSR per-request без CDN cache, 3) Hybrid: shell SSR з public data + client-side fetch для personalization (avoids cache poisoning), 4) TransferState для non-personalized API data, 5) HTTP cache headers на рівні Express (Cache-Control: s-maxage для CDN), 6) Rate limiting і circuit breakers для backend APIs з SSR context."
      staff: "Rendering strategy matrix: Public static → SSG at build time, cached on CDN edge. Public dynamic (news feed) → SSR with CDN cache + stale-while-revalidate. Semi-personalized (logged-in state) → SSR with Vary: Cookie header, short TTL. Fully personalized → SSR per-user або CSR з skeleton. Architecture decisions: 1) Edge SSR (Cloudflare Workers / Deno Deploy) — lower latency але limited API (no Node.js core modules, limited memory), 2) Regional Node.js clusters — full Node.js API, але longer cold start, 3) Streaming SSR (Angular не підтримує нативно, але ручний підхід через HTTP streaming + partial hydration). Operational: distributed tracing для SSR performance (каждий render — span), alerting на render timeouts, canary deployments для SSR changes. Team impact: SSR потребує server-side thinking від frontend dev — error handling, memory management, stateless design."
    commonMistakes:
      - "Кешують персоналізований контент на CDN — data leaks між користувачами"
      - "Не враховують що SSR server може бути bottleneck при спайках трафіку"
      - "Ігнорують Cold Start часи серверних функцій (AWS Lambda, Vercel) для SSR"
    relatedQuestions: ["b17t1q4", "b17t2q1", "b17t3q1"]
---

## Core Concept

**English definition:** Angular Universal (now Angular SSR via @angular/ssr) is the technology for running Angular applications on a server, generating static HTML that is sent to the client before JavaScript loads.

**Пояснення:** Angular Universal — це набір інструментів що дозволяє запускати Angular не тільки в браузері, а й на Node.js сервері. Сервер отримує HTTP запит, Angular виконує bootstrap і рендер компонентів, отримує HTML string і відправляє його в браузері. Браузер показує контент миттєво, а потім завантажується JavaScript і Angular "оживляє" сторінку (hydration).

**Яку проблему вирішує:**
- **SEO:** Search crawlers отримують повний HTML замість порожньої сторінки з `<app-root>`
- **Time to First Contentful Paint (FCP):** Користувач бачить контент без очікування JS bundle завантаження та виконання
- **Social sharing:** Open Graph / Twitter Card meta теги в HTML від початку
- **Poor network / low-end devices:** Менше роботи на клієнті при першому завантаженні

**Як працює під капотом:**

1. Node.js сервер (Express) отримує HTTP GET запит
2. `CommonEngine.render({ bootstrap, document, url })` запускає Angular в server context
3. Angular bootstrap відбувається з `@angular/platform-server` providers замість `@angular/platform-browser`
4. Всі компоненти рендеряться в in-memory DOM (через domino або native Node.js v22+ DOM API)
5. Angular чекає поки `ApplicationRef.isStable` стане `true` (всі HTTP запити завершені, всі pending tasks done)
6. DOM серіалізується в HTML string
7. TransferState store серіалізується і вбудовується як `<script id="ng-state">` в HTML
8. HTML відправляється клієнту
9. На клієнті Angular завантажується і виконує hydration — reuse SSR DOM замість повного ре-рендеру

```typescript
// server.ts — Angular 17+ application builder SSR entry point
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { join } from 'path';
import bootstrap from './src/main.server';

const app = express();
const engine = new CommonEngine();

app.get('*', async (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  try {
    const html = await engine.render({
      bootstrap,
      documentFilePath: join(__dirname, '../browser/index.html'),
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: join(__dirname, '../browser'),
      providers: [
        { provide: 'REQUEST', useValue: req },
        { provide: 'RESPONSE', useValue: res },
      ],
    });
    res.send(html);
  } catch (err) {
    next(err);
  }
});
```

**Trade-offs та обмеження:**
- **Server infrastructure cost:** SSR потребує Node.js сервер, на відміну від статичного hosting для CSR/SSG
- **Складніший код:** Потрібен isPlatformBrowser guard або abstractions для browser-only APIs
- **ApplicationRef stability:** Довгоживучі Observables або intervals блокують серіалізацію — render ніколи не завершується
- **Double data fetch:** Без TransferState сервер і клієнт роблять однакові HTTP запити
- **Statelessness requirement:** SSR сервер повинен бути stateless — DI tree per request, немає global state між запитами

**Версійність:**
- Angular 2-4: Angular Universal як окремий community проєкт
- Angular 7+: Офіційна інтеграція через `@angular/platform-server`
- Angular 14-15: `ng add @nguniversal/express-engine` — стандартний спосіб
- Angular 16: `CommonEngine` API, developer preview hydration, `@angular/ssr` package
- Angular 17: `@angular/ssr` став офіційним replacement для `@nguniversal/*`, stable hydration, `provideClientHydration()` за замовчуванням в new projects
- Angular 17+: Application builder (`@angular/build:application`) замінив `@angular-devkit/build-angular:browser` + окремий server builder
- Angular 19+: Zoneless SSR production-ready

## Deep Details

### Edge Cases

**ApplicationRef.isStable — найчастіша проблема SSR:**
```typescript
// ❌ Цей setInterval не дасть ApplicationRef стати stable
// SSR render буде висіти нескінченно
@Component({})
export class AppComponent implements OnInit {
  ngOnInit() {
    setInterval(() => this.update(), 1000); // ніколи не зупиняється
  }
}

// ✅ Виконувати тільки в браузері
ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    setInterval(() => this.update(), 1000);
  }
}
```

**REQUEST/RESPONSE injection на сервері:**
```typescript
// Доступ до Express request в Angular component/service на сервері
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class RequestService {
  constructor(
    @Optional() @Inject('REQUEST') private request: any,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  getUserAgent(): string {
    if (isPlatformServer(this.platformId)) {
      return this.request?.headers['user-agent'] ?? '';
    }
    return navigator.userAgent;
  }
}
```

**Memory leaks в SSR:**
Кожен render() call створює Angular application instance. Якщо компоненти підписуються на глобальні observables без відписки — memory leak. Angular автоматично destroy компоненти після рендеру, але зовнішні subscriptions (наприклад до синглтон сервісів з ReplaySubject) можуть тримати посилання.

### Junior vs Senior Understanding

**Junior** знає: "є `ng add @angular/ssr`, сервер рендерить HTML, SEO краще."

**Senior** розуміє весь рендер pipeline: bootstrap → CD cycle → isStable wait → DOM serialization. Senior знає що:
- `isPlatformBrowser` — це symptom, abstractions — це cure
- `withHttpTransferCache()` автоматично вирішує double-fetch без ручного TransferState
- `afterRender`/`afterNextRender` lifecycle hooks (v16.2+) — кращий pattern ніж `isPlatformBrowser` для DOM manipulation
- ApplicationRef stability — найпоширеніша причина SSR hangs у production

```typescript
// Senior підхід: абстракція над platform-specific API
// Замість if (isPlatformBrowser) скрізь — inject абстракцію
export const LOCAL_STORAGE = new InjectionToken<Storage | null>('LOCAL_STORAGE', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId) ? localStorage : null;
  },
});

// Компонент не знає де він запускається
@Component({})
export class SettingsComponent {
  private storage = inject(LOCAL_STORAGE);

  saveSettings(settings: Settings): void {
    this.storage?.setItem('settings', JSON.stringify(settings));
  }
}
```

### Deprecation & Migration Path

- **Deprecated:** `@nguniversal/express-engine` та `@nguniversal/common` — замінені на `@angular/ssr`
- **Deprecated:** `AppServerModule` pattern — замінений на standalone bootstrap з `main.server.ts`
- **Migration:** `ng add @angular/ssr` для нових проєктів; для існуючих `@nguniversal` — оновити до Angular 17+ та замінити imports
- **Deprecated:** `ServerTransferStateModule` та `BrowserTransferStateModule` — тепер автоматично через `provideClientHydration()`

```typescript
// OLD (Angular 2-16): AppServerModule
@NgModule({
  imports: [AppModule, ServerModule],
})
export class AppServerModule {}

// NEW (Angular 17+): standalone main.server.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);
export default bootstrap;
```

### Connections to Other Concepts

- **Hydration (Topic 2):** SSR генерує HTML, hydration перетворює його на живий Angular app без повного ре-рендеру
- **TransferState:** Механізм передачі даних між server і client Angular instances
- **Change Detection:** `ApplicationRef.isStable` залежить від Zone.js pending tasks — CD безпосередньо впливає на SSR render completion
- **Dependency Injection:** Platform-specific providers — різні implementations для server vs browser
- **Prerendering (Topic 3):** SSR at build-time замість request-time

## Examples

### Basic Usage

```typescript
// app.config.server.ts — Server-specific app configuration
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

```typescript
// app.config.ts — Shared config with TransferState cache
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withHttpTransferCache } from '@angular/platform-browser';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    // withHttpTransferCache автоматично кешує GET requests між server і client
    provideClientHydration(withHttpTransferCache()),
  ],
};
```

### Production Scenario

```typescript
// products.service.ts — Service з manual TransferState для custom logic
import { Injectable, inject, PLATFORM_ID, makeStateKey, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

const PRODUCTS_KEY = makeStateKey<Product[]>('products-list');

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);

  getProducts(): Observable<Product[]> {
    // На клієнті — перевіряємо TransferState спочатку
    if (this.transferState.hasKey(PRODUCTS_KEY)) {
      const products = this.transferState.get(PRODUCTS_KEY, []);
      this.transferState.remove(PRODUCTS_KEY); // one-time use
      return of(products);
    }

    return this.http.get<Product[]>('/api/products').pipe(
      tap(products => {
        // На сервері — зберігаємо для клієнта
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(PRODUCTS_KEY, products);
        }
      }),
    );
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: Прямий доступ до browser APIs без platform check
@Component({
  template: `<p>Screen width: {{ width }}</p>`,
})
export class WidgetComponent implements OnInit {
  width = 0;

  ngOnInit() {
    // ReferenceError: window is not defined — на сервері немає window
    this.width = window.innerWidth;

    // TypeError: document.querySelector is not a function (неповна emulation)
    const el = document.querySelector('.special');
  }
}

// ✅ CORRECT: afterRender hook виконується тільки на клієнті
@Component({
  template: `<p>Screen width: {{ width }}</p>`,
})
export class WidgetComponent {
  width = 0;

  constructor() {
    afterNextRender(() => {
      // Цей callback виконується тільки в браузері, після першого рендеру
      this.width = window.innerWidth;
    });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `window.someApi` без guard | ReferenceError на сервері — SSR crash | `afterNextRender()` або inject abstraction token |
| `setInterval` в `ngOnInit` без platform check | ApplicationRef ніколи не стає stable — SSR render висить нескінченно | Обгорнути в `isPlatformBrowser()` або `afterNextRender()` |
| Відсутність `withHttpTransferCache()` | HTTP requests виконуються двічі (server + client) — мерехтіння контенту і зайве навантаження | `provideClientHydration(withHttpTransferCache())` |
| Stateful SSR servers | Shared state між запитами — data leaks між користувачами | Request-scoped providers, stateless server design |
| Ігнорування AppServerModule → CommonEngine міграції | Старий підхід не отримує оновлень, більше boilerplate | Оновити до `@angular/ssr` з `ng add @angular/ssr` |

## Interview Block

### [L1 — Warm-up] Що таке Server-Side Rendering в Angular і для чого він потрібен?
**Signal being tested:** Чи розуміє кандидат trade-offs між CSR та SSR, а не просто "SSR = краще"
**What the interviewer expects:** Назвати конкретні переваги (SEO, FCP, social sharing) і розуміти що SSR ≠ silver bullet
**How to probe deeper:** "А що відбувається після того як браузер отримав SSR HTML і JavaScript завантажився?"
**Reference answer:** SSR вирішує проблему CSR: browser отримує готовий HTML для SEO і швидкого FCP, без чекання JS bundle. Angular виконує bootstrap на Node.js сервері через platform-server, серіалізує DOM в HTML string. На клієнті відбувається hydration — Angular reuse SSR DOM замість повного ре-рендеру.
**Common mistakes:** Думають що SSR автоматично швидший за CSR (не завжди — залежить від TTFB); не знають про hydration; вважають що SSR обов'язковий для SEO (prerendering теж вирішує)

### [L2 — Mid] Як TransferState вирішує проблему подвійних HTTP запитів при SSR?
**Signal being tested:** Чи розуміє кандидат проблему double data fetching і може описати механізм вирішення
**What the interviewer expects:** Пояснення makeStateKey, server set → HTML embed → client get, one-time use; bonus: withHttpTransferCache() як автоматизація
**How to probe deeper:** "Які дані небезпечно передавати через TransferState?"
**Reference answer:** На сервері результати HTTP запитів зберігаються в TransferState за допомогою makeStateKey. Store серіалізується в JSON і вбудовується в HTML як inline script. На клієнті Angular читає цей store при bootstrap — при наступному такому ж HTTP запиті повертає кешоване значення замість real network call. withHttpTransferCache() в provideClientHydration() автоматизує цей процес для всіх GET requests.
**Common mistakes:** Не прибирають ключ після використання (TransferState.remove()) — дані живуть довше ніж потрібно; кешують user-specific дані в публічно доступному HTML

### [L3 — Senior] Які причини через які SSR render може "зависнути" і як їх діагностувати?
**Signal being tested:** Розуміння ApplicationRef stability механізму і production debugging навичок
**What the interviewer expects:** setInterval/незавершені Observables = isStable ніколи true; ngZone.onMicrotaskEmpty; timeout в CommonEngine; профілювання через ApplicationRef.isStable stream
**How to probe deeper:** "Як CommonEngine.render() знає що рендер завершено і можна серіалізувати DOM?"
**Reference answer:** CommonEngine чекає ApplicationRef.isStable === true перед серіалізацією. isStable стає false коли Zone.js відстежує pending microtasks або macrotasks. setInterval, незавершені Observables, або pending HTTP requests (що ніколи не resolve) тримають isStable в false. Діагностика: enableDebugTools(appRef) і відслідковування instabilityReasons, або логування в ngZone.onStable. Вирішення: timeout в render(), isPlatformBrowser guard навколо polling code, takeUntilDestroyed для subscriptions.
**Common mistakes:** Не розуміють чому рендер "просто зависає" без error; думають що будь-який setTimeout блокує SSR (ні — тільки незакриті repeating timers)

### [L4 — Staff/Principal] Як би ви спроєктували SSR архітектуру для high-traffic Angular додатку з personalized контентом?
**Signal being tested:** System-level thinking — rendering strategy matrix, caching architecture, infrastructure trade-offs
**What the interviewer expects:** Розрізнення між public/semi-personal/personal content strategies, edge SSR vs regional, cache poisoning prevention, operational concerns
**How to probe deeper:** "Як вирішити конфлікт між CDN caching ефективністю і персоналізованим контентом?"
**Reference answer:** Rendering strategy matrix: публічний статичний контент → SSG на build-time + CDN edge. Публічний динамічний → SSR + CDN з stale-while-revalidate. Персоналізований → SSR per-user (не кешується на CDN) або hybrid (SSR shell + client personalization). Operational: distributed tracing для render latency, alerting на timeouts, Circuit breakers для backend APIs, Node.js clustering або worker threads для CPU scaling. Для edge SSR (Cloudflare Workers) — обмежений Node.js API, але нижча latency.
**Common mistakes:** Кешують персоналізований контент на shared CDN (data leak); не думають про server infrastructure cost порівняно зі SSG; ігнорують Cold Start для serverless SSR

## Summary

### Key Points
- SSR (Angular Universal / @angular/ssr) рендерить Angular в Node.js і відправляє готовий HTML клієнту — покращує SEO, FCP і social previews
- CommonEngine.render() чекає ApplicationRef.isStable перед серіалізацією — setInterval без isPlatformBrowser guard призведе до SSR hang
- TransferState / withHttpTransferCache() запобігають подвійним HTTP запитам між server і client
- isPlatformBrowser/isPlatformServer гарди або afterRender/afterNextRender hooks — обов'язкові для browser-only APIs
- Angular 17+ замінив AppServerModule + @nguniversal на standalone bootstrap + @angular/ssr
- SSR потребує stateless server design — кожен render() — ізольований DI tree
- Rendering strategy: SSR ≠ кращий завжди; SSG, hybrid, edge rendering — варіанти залежно від content type

### Elevator Pitch (2 minutes)
"Angular SSR через @angular/ssr дозволяє рендерити Angular компоненти на Node.js сервері і відправляти готовий HTML клієнту. Це вирішує SEO проблему (search bots бачать контент) і покращує Time to First Contentful Paint. CommonEngine.render() bootstrap'ує Angular в server context, чекає завершення async operations через ApplicationRef.isStable, потім серіалізує DOM в HTML string. TransferState передає API responses з сервера на клієнт щоб уникнути duplicate requests. Після завантаження JS відбувається hydration — Angular reuse SSR DOM без повного ре-рендеру. Ключові gotchas: browser APIs (window, document) потребують platform guards, довгоживучі Observables блокують SSR render, персоналізований контент не можна кешувати на CDN."
