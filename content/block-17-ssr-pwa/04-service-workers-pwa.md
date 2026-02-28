---
title: "Service Workers & Progressive Web Apps"
block: 17
topic: 4
slug: "service-workers-pwa"
difficulty: 3
sinceVersion: "5"
tags: ["service worker", "PWA", "@angular/service-worker", "SwUpdate", "ngsw-config", "cache strategy", "offline", "push notifications"]
relatedTopics: ["prerendering", "angular-universal", "http-interceptors"]
interviewQuestions:
  - id: "b17t4q1"
    level: "junior"
    question: "Що таке Service Worker і як @angular/service-worker спрощує його використання?"
    referenceAnswers:
      junior: "Service Worker — це скрипт що працює в фоні в браузері, перехоплює мережеві запити і може кешувати ресурси для offline роботи. @angular/service-worker автоматично генерує і управляє ним через ngsw-config.json."
      mid: "@angular/service-worker генерує ngsw.json manifest під час збірки і реєструє ServiceWorkerScript що реалізує caching стратегії описані в ngsw-config.json. Без angular/service-worker потрібно писати SW вручну — складно і error-prone. З ним: описуєш що кешувати в JSON конфігурації, Angular генерує повноцінний SW з версіонуванням і update flow."
      senior: "@angular/service-worker — це opinionated SW implementation з: 1) Asset groups (статичні файли з cache-first стратегією), 2) Data groups (API responses з configurable стратегіями), 3) Automatic versioning (хеші в ngsw.json), 4) Update flow (SwUpdate service), 5) Push notifications (SwPush service). SW реєструється тільки в production build (ng build без --configuration=development). Механізм: SW перехоплює fetch events і відповідає з cache або network залежно від конфігурації для конкретного URL pattern."
      staff: "@angular/service-worker — це abstraction layer над SW APIs що вирішує: versioning (SW знає поточну і попередню версії), update coordination (не ламати активні sessions при оновленні), cache consistency (всі ресурси однієї версії оновлюються атомарно). Архітектурне значення: SW є separate thread від main JS — communication тільки через postMessage. Angular ServiceWorkerModule/provideServiceWorker() реєструє SW і expose ServiceWorker, SwUpdate, SwPush services як Angular observables. Production consideration: SW stale-while-revalidate може показувати старий UI після deployment — SwUpdate.versionUpdates stream потрібен для user notification. Multi-tab: SW shared між вкладками одного origin — оновлення впливає на всі вкладки."
    commonMistakes:
      - "Тестують PWA з ng serve (development build) — SW не реєструється без production build"
      - "Не налаштовують SwUpdate — користувачі використовують застарілу версію без повідомлення"
    relatedQuestions: ["b17t4q2", "b17t3q3"]
  - id: "b17t4q2"
    level: "mid"
    question: "Як влаштований ngsw-config.json і які є стратегії кешування?"
    referenceAnswers:
      junior: "ngsw-config.json описує які файли і API responses кешувати. Є стратегії freshness (спочатку мережа) і performance (спочатку кеш)."
      mid: "ngsw-config.json містить: assetGroups (статичні ресурси — JS, CSS, images) з install/lazy loading стратегіями і cache-first поведінкою, dataGroups (динамічні дані — API responses) з стратегіями freshness (network-first з cache fallback) або performance (cache-first з background update). Для кожної групи: URLs/patterns, cache size limit, max age. assetGroups з installMode: 'prefetch' завантажуються під час SW installation."
      senior: "ngsw-config.json структура: appData (metadata про версію), index (shell HTML), assetGroups (static assets), dataGroups (dynamic data), navigationUrls (SPA navigation patterns). Asset caching: SW відстежує хеші файлів — якщо хеш змінився, новий файл в cache при update. Data caching strategies: freshness = network → if offline/error → cache (актуальні дані завжди якщо online), performance = cache → background network update (швидкий response але може бути stale). Важливо: dataGroups кешують HTTP відповіді для URL patterns, не Angular HttpClient calls — SW перехоплює реальні fetch requests."
      staff: "ngsw-config.json є декларативним описом caching policy. Senior design consideration: розмір кешу і max age — не кешувати велику кількість API responses якщо memory обмежена. Cache eviction: при перевищенні maxSize — oldest entries видаляються (LRU-like). Безпека: не кешувати authenticated responses якщо shared device. navigationUrls: SPA routing — SW повертає index.html для '/products/.*' patterns, дозволяє Angular Router handle navigation offline. Patterns: ['/**', '!/api/**'] — exclude API calls від navigation handling. Operational: ngsw.json (generated) vs ngsw-config.json (source) — ngsw.json містить file hashes і deploy-specific config, має бути deployment artifact, не в git."
    commonMistakes:
      - "Кешують authenticated API responses без урахування безпеки — data leaks на shared devices"
      - "Встановлюють maxAge занадто великим для mutable data — stale content"
    relatedQuestions: ["b17t4q1", "b17t4q3"]
  - id: "b17t4q3"
    level: "mid"
    question: "Як SwUpdate service сповіщає про нові версії додатку і як показати промпт оновлення?"
    referenceAnswers:
      junior: "SwUpdate.versionUpdates stream повідомляє коли є нова версія. Можна показати UI і запропонувати reload сторінки."
      mid: "SwUpdate.versionUpdates — Observable що emit'ить VERSION_DETECTED, VERSION_READY, VERSION_INSTALLATION_FAILED події. При VERSION_READY: нова версія завантажена і готова. activateUpdate() перемикає SW на нову версію, після чого потрібен page reload. checkForUpdate() вручну перевіряє оновлення (для polling). isEnabled — перевірити чи SW підтримується (для development mode)."
      senior: "SwUpdate lifecycle: 1) Фоново завантажується нова версія (VERSION_DETECTED), 2) Завантаження завершено (VERSION_READY), 3) Опціонально: activateUpdate() → перемикає до нової версії без reload (але виконуючий JS залишається старим), 4) Page reload → нова версія активна. Сценарій UX: VERSION_READY → показати banner 'New version available, click to update' → user click → activateUpdate() → location.reload(). unrecoverable stream: якщо SW виявляє що cache corrupted і не може serve app — рекомендується automatic reload. Автоматичне checkForUpdate: встановлювати interval polling (кожні 6 годин), або при visibilitychange (коли user повертається до вкладки)."
      staff: "SwUpdate update strategy є architectural рішенням балансу між: freshness (нова версія ASAP) і stability (не ламати активні workflows). Options: 1) Silent update (automatic activateUpdate + reload) — OK для простих apps, bad для apps з unsaved state (forms, editors), 2) User-prompted update — показати notification, user вирішує коли reload, 3) Update on navigation — activateUpdate при router navigation якщо нова версія доступна (найменший disruption). Enterprise consideration: примусове оновлення після X часу (security critical updates). Multi-tab: activateUpdate в одній вкладці активує SW для всіх вкладок — усі перезавантажуються. Monitoring: VERSION_INSTALLATION_FAILED — alert (можливо CDN issue або corrupt deployment)."
    commonMistakes:
      - "Викликають activateUpdate() без location.reload() — JS bundle старий, SW новий — inconsistent state"
      - "Не обробляють unrecoverable stream — додаток stuck в broken state"
    relatedQuestions: ["b17t4q2", "b17t4q4"]
  - id: "b17t4q4"
    level: "senior"
    question: "Як реалізувати push notifications через SwPush в Angular PWA?"
    referenceAnswers:
      junior: "SwPush — Angular сервіс для роботи з Web Push API. Потрібна підписка користувача, сервер що відправляє push повідомлення."
      mid: "SwPush.requestSubscription({ serverPublicKey }) запитує permission і створює push subscription. Subscription endpoint відправляється на сервер. Сервер використовує Web Push protocol (VAPID) для відправки повідомлень. SwPush.messages — Observable push повідомлень. SwPush.notificationClicks — Observable кліків по нотифікаціях."
      senior: "Push notification flow: 1) VAPID key pair генерується (або отримується з сервера), 2) SwPush.requestSubscription({ serverPublicKey: vapidPublicKey }) — браузер реєструє subscription на push service (FCM, Mozilla Push, Apple), 3) Subscription (endpoint + keys) відправляється на ваш сервер, 4) Сервер відправляє push через web-push library (Node.js) або відповідний SDK, 5) SW отримує push event і показує notification або emit в messages stream, 6) User click → notificationClicks Observable. Ключові деталі: VAPID (Voluntary Application Server Identification) — стандарт аутентифікації push сервера. Push payload шифрується — тільки client може розшифрувати."
      staff: "Push notifications в enterprise context: privacy (GDPR — explicit consent, право відписатись), reliability (push delivery не guaranteed — FCM, APNS можуть drop messages), UX (notification fatigue). Architecture: push subscription management endpoint (зберігати/оновлювати/видаляти subscriptions), multi-device (один user = кілька subscriptions), segments (відправляти конкретним групам). Implementation: SwPush.subscription$ Observable (стан підписки), graceful handling якщо user deny permission. iOS PWA: Apple додав push support тільки в iOS 16.4+ (March 2023) — перевіряти compatibility. Service Worker lifecycle: SW може бути woken up при push навіть якщо app closed — notification може показатись без відкритого додатку. Monitoring: push delivery rate, open rate (click на notification / delivered)."
    commonMistakes:
      - "Не зберігають subscription на сервері — після refresh subscription Lost"
      - "Ігнорують iOS PWA limitations для push notifications до iOS 16.4"
    relatedQuestions: ["b17t4q3", "b17t4q5"]
  - id: "b17t4q5"
    level: "staff"
    question: "Як спроєктувати offline-first Angular PWA для production?"
    referenceAnswers:
      junior: "Offline-first — коли додаток спочатку намагається використати кешовані дані і тільки потім мережу. Service Worker кешує дані для offline режиму."
      mid: "Стратегія: SW з cache-first для static assets і stale-while-revalidate для API data. IndexedDB для offline data persistence. Background Sync API для черги дій (відправити form offline → sync при відновленні). App Shell для instant startup."
      senior: "Offline-first architecture layers: 1) App Shell (SW cache-first) — instant startup, 2) Static data (SW data groups, performance strategy) — catalog/config, 3) Dynamic user data (IndexedDB) — shopping cart, drafts, 4) Mutations queue (Background Sync або custom queue) — actions при offline що sync при reconnect, 5) Conflict resolution — що робити якщо server і local diverge. ngsw-config: asset groups (prefetch core bundles), data groups (freshness для real-time, performance для catalog). NetworkService для online/offline status."
      staff: "Offline-first PWA design requires: data sync protocol (last-write-wins vs CRDTs vs operational transforms), conflict resolution strategy, offline UI/UX (clear indicators про offline state, які дії доступні offline), security (cached authenticated data — що робити після logout?). Implementation stack: SW (@angular/service-worker), local store (IndexedDB через idb library або Dexie.js), sync mechanism (Background Sync API або polling при reconnect), conflict resolution service. Angular integration: NetworkStatusService (fromEvent(window, 'online/offline')), OfflineQueueService (IndexedDB persistent queue), SyncService що обробляє queue при reconnect. Operational: offline analytics (дії buffer'яться, відправляються при reconnect), crash reports від offline states, testing offline scenarios in CI (service worker tests, network interception). Business consideration: offline-first збільшує perceived reliability але потребує significant engineering investment — ROI залежить від user connectivity patterns (аудиторія з поганим connectivity — high ROI)."
    commonMistakes:
      - "Не вирішують security питання — cached authenticated data доступна після logout"
      - "Ігнорують conflict resolution — user робить дії offline, сервер має інші дані — data corruption"
      - "Тестують тільки happy path online — offline scenarios виявляють edge cases"
    relatedQuestions: ["b17t4q2", "b17t3q3"]
---

## Core Concept

**English definition:** Service Workers are scripts that run in a separate browser thread, acting as a proxy between web application and network, enabling offline capabilities, push notifications, and background sync. @angular/service-worker provides an Angular-opinionated abstraction over the Service Worker API.

**Пояснення:** Service Worker — це скрипт що браузер запускає в окремому thread (без доступу до DOM), здатний перехоплювати мережеві запити і відповідати з кешу. @angular/service-worker надає опінований SW з автоматичним версіонуванням, Angular-specific сервісами (SwUpdate, SwPush) і декларативною конфігурацією (ngsw-config.json) замість написання SW вручну.

**Яку проблему вирішує:**
- **Offline capability:** Додаток працює без мережі, відповідаючи з кешу
- **Performance:** Cache-first стратегія — instant load для повторних відвідувань
- **App updates:** Controlled update flow без "стара версія назавжди в кеші"
- **Push notifications:** Нотифікації навіть коли додаток закритий
- **PWA requirements:** SW є prerequisite для install prompt і маніфесту

**Як працює під капотом:**

1. `ng build` + ngsw-config.json → Angular генерує `ngsw.json` з file hashes та `ngsw-worker.js`
2. Браузер реєструє SW (`provideServiceWorker()`)
3. SW intercepts `fetch` events:
   - URL match `assetGroups`? → cache-first response
   - URL match `dataGroups` з `performance`? → cache-first + background update
   - URL match `dataGroups` з `freshness`? → network-first + cache fallback
   - navigationUrls pattern? → serve `index.html` (SPA routing)
4. При deployment: новий `ngsw.json` → SW порівнює hashes → downloads changed files → VERSION_READY event

```typescript
// main.ts або app.config.ts — реєстрація Service Worker
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(), // тільки в production
      registrationStrategy: 'registerWhenStable:30000', // після стабілізації або через 30сек
    }),
  ],
};
```

**Trade-offs та обмеження:**
- **Тільки HTTPS:** SW вимагає secure context (або localhost для development)
- **Development mode:** SW не реєструється в `ng serve` — потрібен `ng build` + статичний сервер
- **Update lag:** Stale-while-revalidate може показувати стару версію до explicit reload
- **Cache invalidation complexity:** Неправильна конфігурація = стара версія "застрягає" в кеші
- **iOS Safari limitations:** Довгий час обмежена підтримка (push notifications тільки iOS 16.4+)

**Версійність:**
- Angular 5: Перша версія `@angular/service-worker` з `ServiceWorkerModule`
- Angular 12: `SwUpdate.versionUpdates` observable замість окремих deprecated методів
- Angular 14: `provideServiceWorker()` функція (standalone)
- Angular 15+: `SwUpdate.checkForUpdate()` повертає Promise<boolean>
- `ServiceWorkerModule.register()` — deprecated на користь `provideServiceWorker()`

## Deep Details

### Edge Cases

**SW не оновлюється — classic cache trap:**
```typescript
// ❌ Частий сценарій: SW кешує стару версію ngsw.js
// Причина: ngsw-worker.js закешований SW'ом самого себе
// Angular вирішує це: ngsw-worker.js НІКОЛИ не кешується SW
// Але: якщо CDN кешує ngsw-worker.js з довгим TTL — SW не оновиться
// Рішення: Cache-Control: no-cache для ngsw-worker.js і ngsw.json на CDN/nginx
```

**unrecoverable стан:**
```typescript
// Виникає коли SW cache corrupted або файли missing
// Angular виводить warning в console і SW не може serve app

@Injectable({ providedIn: 'root' })
export class PwaService {
  private swUpdate = inject(SwUpdate);

  setupAutoRecover(): void {
    this.swUpdate.unrecoverable.subscribe(event => {
      // Кеш пошкоджений — примусово перезавантажити і очистити кеш
      console.error('SW unrecoverable:', event.reason);
      // Очищаємо SW кеш і перезавантажуємо
      caches.keys().then(keys =>
        Promise.all(keys.map(key => caches.delete(key)))
      ).then(() => location.reload());
    });
  }
}
```

**Безпека кешованих даних:**
```typescript
// ❌ НЕБЕЗПЕЧНО: authenticated responses в dataGroups cache
// При logout — дані залишаються в SW cache
// При наступному відкритті — можуть бути доступні без auth

// ✅ Рішення: не кешувати authenticated endpoints
// ngsw-config.json: dataGroups тільки для public API
// Або: при logout — clear SW cache
{
  dataGroups: [
    {
      name: "public-api",
      urls: ["/api/products", "/api/categories"], // тільки публічні endpoints
      cacheConfig: { strategy: "performance", maxSize: 100, maxAge: "1h" }
    }
    // НЕ включати /api/user, /api/orders тощо
  ]
}
```

### Junior vs Senior Understanding

**Junior** знає: "ng add @angular/pwa додає Service Worker, ngsw-config.json конфігурує кешування, SwUpdate для оновлень."

**Senior** розуміє SW lifecycle і update mechanics: SW має три стани (installed, waiting, active), multi-tab behavior (SW shared між вкладками), і чому stale-while-revalidate + відсутність SwUpdate notification = users stuck on old version. Senior проектує update UX: коли показувати prompt, примусовий update для security fixes, graceful degradation.

```typescript
// Senior-level update management service
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private swUpdate = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  initialize(): void {
    if (!this.swUpdate.isEnabled) return;

    // Слухаємо версії оновлень
    this.swUpdate.versionUpdates
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.type === 'VERSION_READY') {
          this.promptUpdate(event.latestVersion.appData);
        }
        if (event.type === 'VERSION_INSTALLATION_FAILED') {
          console.error('SW update failed:', event.error);
          // Alert monitoring system
        }
      });

    // Перевіряємо при повернені до вкладки
    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        throttleTime(60_000), // не частіше ніж раз на хвилину
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.swUpdate.checkForUpdate());
  }

  private async promptUpdate(appData: object | undefined): Promise<void> {
    const ref = this.snackBar.open(
      'New version available!',
      'Update',
      { duration: 10_000 }
    );

    const action = await firstValueFrom(ref.onAction());
    if (action !== undefined) {
      await this.swUpdate.activateUpdate();
      location.reload();
    }
  }
}
```

### Deprecation & Migration Path

- **Deprecated:** `ServiceWorkerModule.register()` → замінений на `provideServiceWorker()`
- **Deprecated:** `SwUpdate.available` і `SwUpdate.activated` observables (Angular 13.0) → замінені на `SwUpdate.versionUpdates` stream з типізованими event objects
- **Deprecated:** `checkForUpdate()` returning void → тепер Promise<boolean> (Angular 15+)

```typescript
// OLD (Angular 5-12):
ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: environment.production,
})
SwUpdate.available.subscribe(event => { /* ... */ });
SwUpdate.activated.subscribe(event => { /* ... */ });

// NEW (Angular 14+):
provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() })
SwUpdate.versionUpdates.subscribe(event => {
  if (event.type === 'VERSION_READY') { /* ... */ }
});
```

### Connections to Other Concepts

- **Prerendering / App Shell (Topic 3):** App Shell pattern = prerendered shell + SW caching = PWA
- **HTTP Interceptors:** SW перехоплює на рівні browser fetch, не Angular HttpClient — різний рівень
- **Router:** `navigationUrls` в ngsw-config визначає які URL SW serve як SPA (повертає index.html)
- **TransferState:** SW кешує HTTP responses окремо від TransferState (яка в HTML) — різні caching layers

## Examples

### Basic Usage

```bash
# Встановити @angular/pwa
ng add @angular/pwa
# Генерує: ngsw-config.json, manifest.webmanifest, іконки
# Модифікує: angular.json, index.html, app.config.ts
```

```json
// ngsw-config.json — базова конфігурація
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/assets/**", "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"]
      }
    }
  ]
}
```

### Production Scenario

```json
// ngsw-config.json — production конфігурація з data caching
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app-core",
      "installMode": "prefetch",
      "resources": {
        "files": ["/favicon.ico", "/index.html", "/manifest.webmanifest", "/*.css", "/*.js"]
      }
    },
    {
      "name": "assets-lazy",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/assets/**", "/*.(jpg|jpeg|png|webp|svg|gif|woff|woff2)"]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "product-catalog",
      "urls": ["/api/products", "/api/categories"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 200,
        "maxAge": "1h",
        "timeout": "5s"
      }
    },
    {
      "name": "real-time-data",
      "urls": ["/api/prices", "/api/inventory"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 100,
        "maxAge": "5m",
        "timeout": "3s"
      }
    }
  ],
  "navigationUrls": [
    "/**",
    "!/**/*.*",
    "!/**/*__*",
    "!/**/*__*/**",
    "!/api/**"
  ]
}
```

```typescript
// push-notification.service.ts — SwPush implementation
import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);

  async subscribeToNotifications(): Promise<void> {
    if (!this.swPush.isEnabled) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: VAPID_PUBLIC_KEY,
      });

      // Відправляємо subscription на наш сервер
      await this.http.post('/api/push/subscribe', subscription).toPromise();

      console.log('Push subscription registered');
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  }

  listenForNotifications(): void {
    this.swPush.messages.subscribe((message: object) => {
      console.log('Push message received:', message);
      // Обробити silent push або in-app notification
    });

    this.swPush.notificationClicks.subscribe(({ action, notification }) => {
      console.log('Notification clicked:', action, notification);
      // Navigate to relevant page
    });
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: Перевіряти оновлення без обробки — user ніколи не дізнається про нову версію
@Injectable({ providedIn: 'root' })
export class BadUpdateService {
  private swUpdate = inject(SwUpdate);

  constructor() {
    // Ніколи не показує notification і не оновлюється
    this.swUpdate.checkForUpdate();
    // Users stuck on old version forever
  }
}

// ❌ WRONG: activateUpdate без reload — JS bundle старий, SW новий
this.swUpdate.versionUpdates.subscribe(async event => {
  if (event.type === 'VERSION_READY') {
    await this.swUpdate.activateUpdate();
    // MISSING: location.reload() — додаток в inconsistent state!
  }
});

// ✅ CORRECT: повний update flow
this.swUpdate.versionUpdates.subscribe(async event => {
  if (event.type === 'VERSION_READY') {
    const updateConfirmed = await this.snackBar
      .open('Update available!', 'Reload')
      .onAction()
      .pipe(take(1), map(() => true))
      .toPromise();

    if (updateConfirmed) {
      await this.swUpdate.activateUpdate();
      location.reload(); // REQUIRED для завантаження нового JS bundle
    }
  }
});
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| SW в development mode (`ng serve`) | SW не реєструється — тестування PWA неможливе | `ng build && npx http-server dist/app -p 4200` для testing |
| `activateUpdate()` без `location.reload()` | JS bundle залишається старим, SW новий — inconsistent state | Завжди: `await activateUpdate(); location.reload();` |
| Кешування authenticated API responses | Data leaks між users на shared devices, stale auth data | Виключати authenticated endpoints з dataGroups |
| Відсутність `unrecoverable` handling | App broken state без recovery path — blank screen | Підписатись на `swUpdate.unrecoverable` і очищати cache |
| maxAge занадто великий для mutable data | Stale content показується users годинами | freshness strategy для real-time data, performance для static catalog |

## Interview Block

### [L1 — Warm-up] Що таке Service Worker і як @angular/service-worker спрощує його використання?
**Signal being tested:** Розуміння SW як окремого thread-proxy і цінності Angular abstraction над raw SW API
**What the interviewer expects:** Fetch interception, separate thread, offline capability; @angular/service-worker = declarative config + versioning + Angular services
**How to probe deeper:** "Як протестувати PWA features локально?"
**Reference answer:** SW — browser script в окремому thread що перехоплює мережеві запити і може respond з кешу. @angular/service-worker автоматизує: SW generation з ngsw-config.json, file versioning через hashes, update flow через SwUpdate service, push через SwPush. Потрібен production build — `ng serve` не реєструє SW.
**Common mistakes:** Думають SW = cache всього автоматично; не знають що SW не доступний у development mode

### [L2 — Mid] Як влаштований ngsw-config.json і які є стратегії кешування?
**Signal being tested:** Практичне знання конфігурації і розуміння trade-offs між freshness і performance стратегіями
**What the interviewer expects:** assetGroups vs dataGroups, freshness vs performance strategies, installMode prefetch vs lazy, maxAge/maxSize
**How to probe deeper:** "Яку стратегію обрати для product prices API?"
**Reference answer:** assetGroups — статичні файли (JS, CSS, images) з cache-first. dataGroups — API responses з двома стратегіями: freshness (network-first, fallback до cache — для актуальних даних), performance (cache-first з background update — для relatively static даних). installMode: prefetch — завантажити при SW install; lazy — при першому запиті.
**Common mistakes:** Не розуміють різниці freshness vs performance; кешують authenticated responses

### [L3 — Senior] Як SwUpdate service сповіщає про нові версії і як показати промпт оновлення?
**Signal being tested:** Розуміння SW update lifecycle і здатність спроектувати user-friendly update UX
**What the interviewer expects:** versionUpdates stream з VERSION_READY event, activateUpdate() + reload(), unrecoverable handling, polling strategy
**How to probe deeper:** "Що відбувається якщо user має кілька вкладок і ти викликаєш activateUpdate()?"
**Reference answer:** swUpdate.versionUpdates emit VERSION_READY коли нова версія downloaded. При VERSION_READY: показати snackbar/banner, на action: activateUpdate() → location.reload(). checkForUpdate() для polling (при visibilitychange). unrecoverable — очистити cache і reload. activateUpdate в одній вкладці активує SW для всіх вкладок того самого origin.
**Common mistakes:** activateUpdate() без reload(); не обробляють VERSION_INSTALLATION_FAILED і unrecoverable

### [L4 — Staff/Principal] Як спроєктувати offline-first Angular PWA для production?
**Signal being tested:** System-level thinking — data sync, conflict resolution, security, operational concerns для offline-first
**What the interviewer expects:** Architecture layers (App Shell + SW + IndexedDB + sync queue), conflict resolution strategy, security (logout + cached data), monitoring
**How to probe deeper:** "Як вирішити конфлікт коли user редагував дані offline, а сервер їх змінив?"
**Reference answer:** Offline-first layers: App Shell (instant startup), SW data groups (static catalog performance, real-time freshness), IndexedDB для user mutations, Background Sync queue для pending actions при reconnect. Conflict resolution strategy (last-write-wins / manual merge / server wins). Security: при logout → clear authenticated cache. Monitoring: offline analytics buffer, sync failures alerting.
**Common mistakes:** Ігнорують conflict resolution; не очищають authenticated cache при logout; тестують тільки online scenarios

## Summary

### Key Points
- Service Worker — окремий browser thread що перехоплює мережеві запити і реалізує offline/caching
- `ng add @angular/pwa` встановлює і конфігурує @angular/service-worker з ngsw-config.json і Web App Manifest
- ngsw-config.json: assetGroups (cache-first для JS/CSS/images) + dataGroups (freshness або performance для API)
- SwUpdate.versionUpdates stream — слухати VERSION_READY і завжди робити reload після activateUpdate()
- SwPush.requestSubscription() + VAPID для push notifications (iOS 16.4+ для PWA)
- Тестувати тільки через production build (`ng build`) — SW не реєструється в development
- Безпека: не кешувати authenticated API responses в dataGroups

### Elevator Pitch (2 minutes)
"@angular/service-worker надає Angular abstraction над Service Worker API. Через ngsw-config.json ти декларативно описуєш caching стратегії: assetGroups для статичних ресурсів (cache-first), dataGroups для API (freshness для актуальних даних або performance для catalog). Angular генерує ngsw-worker.js з автоматичним версіонуванням через file hashes. SwUpdate service через versionUpdates Observable сповіщає коли нова версія готова — при VERSION_READY показуєш prompt, на confirm: activateUpdate() + location.reload(). SwPush для push notifications через Web Push / VAPID. Ключові gotchas: SW не реєструється в ng serve — потрібен production build; activateUpdate() без reload = inconsistent state; не кешуй authenticated responses — data security risk. App Shell = prerendered shell + SW caching = instant startup і offline capability = PWA foundation."
