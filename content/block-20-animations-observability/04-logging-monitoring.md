---
title: "Logging & Performance Monitoring"
block: 20
topic: 4
slug: "logging-monitoring"
difficulty: 3
sinceVersion: "2"
tags: ["logging", "structured logging", "performance monitoring", "Core Web Vitals", "Angular DevTools", "PerformanceObserver", "Real User Monitoring"]
relatedTopics: ["error-handling-observability", "angular-animations", "animation-builder"]
interviewQuestions:
  - id: "b20t4q1"
    level: "junior"
    question: "Як реалізувати log service в Angular? Яка мінімальна структура потрібна для production logging?"
    referenceAnswers:
      junior: "Log service — це Angular service що абстрагує console.log і дозволяє контролювати рівні логування (debug, info, warn, error) та відключати logs в production."
      mid: "Мінімальна реалізація: enum LogLevel { DEBUG, INFO, WARN, ERROR }, LogService з inject(PLATFORM_ID) і `environment.production` check. В production: тільки WARN і ERROR, в development — всі. Structured logging: не string messages а objects: `log.info('user.login', { userId, timestamp })`. Це дозволяє filtering і querying в log aggregation systems (ELK, Datadog Logs)."
      senior: "Production log service вимоги: 1) Log levels з runtime configurability (не тільки build-time). 2) Structured format: JSON object з: level, message, timestamp (ISO 8601), correlationId, component context, userId (якщо auth). 3) Transport abstraction: console в dev, HTTP POST в prod (batch або real-time). 4) Buffering: localStorage або in-memory queue при offline — flush при reconnect. 5) Sampling: DEBUG logs 10%, INFO 100%, WARN/ERROR 100%. 6) Correlation ID: generated per user session або per request — allows log chain reconstruction. 7) Performance: logging НЕ повинно блокувати main thread — async transport, non-blocking serialization. 8) Error correlation: log service інтегрується з ErrorHandler — кожна error має log entry."
      staff: "Enterprise logging architecture: 1) LogService interface → multiple implementations (ConsoleSink, HttpSink, SentrySink). 2) Log pipeline: create entry → enrich (add context) → filter (level, sampling) → serialize → transport. 3) Context propagation: Angular DI дозволяє inject LogContext service що carries correlationId через request lifetime. 4) Distributed tracing: frontend logs мають traceId що matches backend OpenTelemetry traces. 5) Log aggregation: logs shipped до Datadog/ELK/Loki. Structured logs → automatic field extraction → dashboards і alerts. 6) Compliance: logs можуть містити PII → retention policies, encryption at rest, GDPR right to erasure. 7) Performance impact: HTTP transport batching (flush every 5s або on X log entries) → мінімальний impact. IndexedDB для offline resilience. 8) Team contract: кожен team contributor знає log levels semantics. DEBUG=development traces, INFO=business events, WARN=recoverable issues, ERROR=needs attention. 9) Log-based alerting: anomaly detection на error rate, новий error type trigger в Datadog."
    commonMistakes:
      - "console.log() напряму у компонентах — не централізовано, неможливо вимкнути в prod"
      - "String concatenation в log messages (`'User ' + id + ' failed'`) замість structured objects"
    relatedQuestions: ["b20t4q2", "b20t3q5"]
  - id: "b20t4q2"
    level: "mid"
    question: "Що таке Core Web Vitals (LCP, CLS, INP) і як їх вимірювати в Angular додатку?"
    referenceAnswers:
      junior: "Core Web Vitals — це метрики Google для оцінки UX: LCP (час завантаження головного контенту), CLS (стрибки верстки), INP (час відповіді на interaction). Вимірюються через Lighthouse або PerformanceObserver API."
      mid: "LCP (Largest Contentful Paint): час до рендерингу найбільшого visible елементу (зображення, текстовий блок). Ціль: ≤2.5s. CLS (Cumulative Layout Shift): сума unexpected layout shifts. Ціль: ≤0.1. INP (Interaction to Next Paint, замінив FID з 2024): час від interaction до наступного frame render. Ціль: ≤200ms. В Angular: `PerformanceObserver` API для runtime measurement. `web-vitals` npm package — офіційна Google бібліотека для cross-browser measurement."
      senior: "PerformanceObserver implementation в Angular: `new PerformanceObserver(callback).observe({ type: 'largest-contentful-paint', buffered: true })`. Важливо: `buffered: true` для LCP — елементи що завантажились до observer registration. CLS: `observe({ type: 'layout-shift', buffered: true })` — accumulate hadRecentInput===false shifts. INP: `observe({ type: 'event', durationThreshold: 40 })` — track slow events, find 98th percentile. `web-vitals` бібліотека: `onLCP(metric => send(metric))`, `onCLS(...)`, `onINP(...)`. Angular-specific: change detection cycle довжина впливає на INP — long CD cycle після click = bad INP. Zone.js microtask queue: якщо click handler triggers many CD cycles → browser blocked → high INP."
      staff: "Core Web Vitals для Angular SPA: 1) LCP в SPA: часто не HTML-rendered content а JS-rendered — LCP measurement later than expected. Server-side rendering (Angular Universal) для critical content above the fold. 2) CLS в Angular: dynamic content injection без reserved space, lazy-loaded components що змінюють layout. Guard: CSS `min-height` placeholders для async-loaded sections. 3) INP в Angular: click handler → Zone.js microtask flood → CD cycle → repaint. Zoneless Angular (signals) → fewer CD cycles → better INP. 4) RUM (Real User Monitoring): відмінність від Lighthouse (synthetic) — реальні user measurements з real devices і networks. Datadog RUM, New Relic Browser — aggregate distributions. 5) Performance budget в CI: Lighthouse CI plugin → fail build if LCP > 3s. 6) Angular CDK PerformanceObserver wrapper — не існує, але Angular Material Viewport використовує ResizeObserver для similar patterns. 7) Attribution: LCP element attribution — знати що саме повільне (image? text block?) для targeted optimization."
    commonMistakes:
      - "Вимірюють LCP/CLS тільки в Lighthouse (synthetic) — реальні users на повільних devices можуть мати набагато гірші результати"
      - "Не враховують що INP замінив FID з березня 2024 — старі метрики FID більше не в Core Web Vitals"
    relatedQuestions: ["b20t4q1", "b20t4q3"]
  - id: "b20t4q3"
    level: "mid"
    question: "Як логувати HTTP request timing в Angular через interceptors? Які метрики варто збирати?"
    referenceAnswers:
      junior: "HTTP interceptor може перехоплювати запити і відповіді. Можна використовувати performance.now() для вимірювання тривалості запитів."
      mid: "Functional interceptor: `performance.now()` до і після запиту, різниця = duration. Метрики: url, method, status, duration, timestamp. В `tap` оператор RxJS для success, в `catchError` для failures. Структуровані логи відправляються до log service. Важливо: не логувати request body (може містити PII) без sanitization."
      senior: "HTTP timing interceptor production implementation: `const startTime = performance.now()`. `return next(req).pipe(tap({ next: response => logSuccess(req, response, performance.now() - startTime), error: err => logError(req, err, performance.now() - startTime) }))`. Метрики: URL (masked — `api/users/:id` не `api/users/123`), method, status code, duration ms, request size (Content-Length), response size, cache hit (from cache header). Кореляція: `X-Request-Id` header в request → include в log entry → link frontend log з backend trace. Sampling: логувати 100% errors, 10% success requests в production — volume management. Distributed tracing: `traceparent` header (W3C TraceContext) додається interceptor — backend spans пов'язуються з frontend trace."
      staff: "HTTP observability architecture: 1) Interceptor як data collection point — не тільки timing, але і: retry count, circuit breaker state, cache strategy. 2) Request pipeline instrumentation: correlate HTTP request з user action (яка button click triggered request?). User Action → correlationId → HTTP request log → backend trace. 3) SLO-based alerting: API error rate > 1% на 5-хвилинному window → alert. P99 latency > 2000ms → alert. 4) Endpoint performance dashboard: aggregate per-endpoint stats від all users — identify slow endpoints. 5) Offline detection: `navigator.onLine` + fetch failure pattern detection. 6) Retry logic logging: кількість retries до success/failure — revealing instability. 7) HTTP interceptor і Sentry: Sentry Angular SDK автоматично додає HTTP breadcrumbs — кожен XHR/fetch request як breadcrumb в error report. Custom interceptor може enrich Sentry context (add user action context). 8) Privacy: URL masking (route params), no body logging в prod, request headers filter (no Authorization header in logs)."
    commonMistakes:
      - "Логують повний URL з dynamic params (`/api/users/123`) замість pattern (`/api/users/:id`) — cardinality explosion в monitoring"
      - "Логують request body без sanitization — PII і tokens в logs"
    relatedQuestions: ["b20t4q2", "b20t4q4"]
  - id: "b20t4q4"
    level: "senior"
    question: "Як Angular DevTools API допомагає відстежувати performance change detection cycles? Що таке ɵgetViewRef і як це використовується?"
    referenceAnswers:
      junior: "Angular DevTools — browser extension для debugging Angular apps. Показує component tree, change detection статистику, і profiler."
      mid: "Angular DevTools Profiler: записує CD cycles — кількість і тривалість per component. Дозволяє identify которий компонент найчастіше і найдовше running change detection. `ng.profiler.timeChangeDetection()` — programmatic profiling. Компоненти з OnPush мають зелений індикатор (менше CD cycles)."
      senior: "Angular DevTools internals: використовує `window.__ngDevTools__` object та `ɵgetViewRef` / `ɵgetInjector` global hooks. Профілер: `PerformanceMark` API для CD cycle boundaries. Programmatic access: `import { ɵgetViewRef } from '@angular/core'` — не public API, але доступно в dev builds. `ng.getComponent(element)` — get component instance від DOM element (dev only). Production performance monitoring: замість DevTools API — custom performance marks: `performance.mark('cd-start')` в custom `NgZone` subclass → `performance.measure('cd-duration')` → `PerformanceObserver({ type: 'measure' })` → aggregate. RUM integration: custom CD metrics відправляються до Datadog з `onINP` Core Web Vitals — correlation між CD duration і INP."
      staff: "Angular performance observability system: 1) CD cycle monitoring in production: custom ApplicationRef subclass або NgZone override → hook в `tick()` lifecycle → measure duration → log якщо >16ms (jank threshold). 2) Signal-based apps: signals не мають CD cycle у традиційному сенсі — `effect()` executions вимірюються як microtask durations. 3) Component render time: PerformanceMark в `ngOnInit`/`ngAfterViewInit` — але overhead самого measurement. 4) Zone.js macrotask tracking: `onMicrotaskEmpty`, `onStable` events для identify hung microtask queues. 5) Memory tracking: `performance.measureUserAgentSpecificMemory()` (experimental) для heap size trend. 6) Angular Universal/SSR: `renderApplication()` duration — server-side timing. 7) Hydration performance: Angular 17+ non-destructive hydration — track hydration errors і mismatch count. 8) Correlation: CD duration spike → INP spike → user complaint. Holistic view через RUM dashboard."
    commonMistakes:
      - "Використовують `ɵgetViewRef` та internal Angular APIs в production — unstable, може змінитись між versions"
      - "Профілюють тільки в DevTools (dev mode) — prod build може мати різне поведінку"
    relatedQuestions: ["b20t4q3", "b20t4q5"]
  - id: "b20t4q5"
    level: "staff"
    question: "Як інтегрувати Real User Monitoring (RUM) в Angular додаток? Яка різниця між RUM і Synthetic monitoring?"
    referenceAnswers:
      junior: "RUM — це вимірювання performance реальних користувачів, а не синтетичних тестів. Підключається через SDK (Datadog, New Relic) що збирає Web Vitals і errors від реальних сесій."
      mid: "RUM (Real User Monitoring): SDK в браузері збирає Core Web Vitals, JS errors, resource timing від реальних users. Synthetic: Lighthouse, WebPageTest — controlled environment, repeatability. RUM показує реальний стан (різні devices, мережі, geographies). Synthetic — для regression detection в CI. Datadog RUM Angular: `datadogRum.init()` + `datadogRum.addAction()` для custom events. New Relic Browser Agent — аналогічно."
      senior: "RUM implementation в Angular: 1) Datadog RUM: `import { datadogRum } from '@datadog/browser-rum'`. `datadogRum.init({ applicationId, clientToken, service, env, version, trackResources: true, trackLongTasks: true })`. 2) User context: `datadogRum.setUser({ id: user.id, name: user.name })` після login. 3) Custom events: `datadogRum.addAction('feature_used', { featureName: 'export' })` — business events correlation з performance. 4) Angular-specific: route change duration — `datadogRum.startView({ name: router.url })` в NavigationStart. 5) Error integration: Datadog RUM автоматично captures JS errors, але custom `ErrorHandler` може addError з more context. 6) Session replay: Datadog Session Replay — record user sessions для debugging. Privacy: mask sensitive inputs. 7) Performance context: якщо LCP > threshold в RUM — trigger additional investigation."
      staff: "RUM architecture для enterprise Angular app: 1) SDK initialization: `datadogRum.init()` в main.ts синхронно — catches all errors та resources. 2) Privacy strategy: PII masking в Session Replay (mask all inputs by default, unmask only specific safe fields), no user personal data in action names. 3) Sampling: `sessionSampleRate: 10` (10% sessions) для cost control. `sessionReplaySampleRate: 1` (1% із sampled sessions). 4) Custom views: Angular SPA — manually call `startView()` on NavigationEnd або configure automatic router tracking. 5) Business metrics: RUM custom timing `datadogRum.addTiming('checkout_completed')` — business KPIs в performance context. 6) Alerting strategy: P75 LCP > 3s → alert ops team. Error rate > 2% → page on call. 7) RUM + Sentry: complementary — RUM для performance і session context, Sentry для error details і stack traces. They share correlationId для cross-tool investigation. 8) Budget: RUM costs per session/event — tradeoff між coverage (100% users) і cost. Tiered approach: всі users get basic RUM (vitals only), 10% get full session tracing. 9) Synthetic vs RUM dashboard: CI alerts on synthetic regression, RUM for trend analysis і user impact assessment."
    commonMistakes:
      - "Тільки Lighthouse в CI без RUM — synthetic не відображає реальний user experience на diverse devices"
      - "100% session recording без privacy masking — GDPR violation, PII в session replays"
    relatedQuestions: ["b20t4q4", "b20t4q1"]
---

## Core Concept

**English definition:** Logging and performance monitoring in Angular encompasses structured logging infrastructure (log levels, correlation IDs, transport abstraction), Core Web Vitals measurement via PerformanceObserver API (LCP, CLS, INP), HTTP request timing via interceptors, change detection profiling via Angular DevTools API, and Real User Monitoring integration (Datadog RUM, New Relic) for production observability.

**Пояснення:** Observability — це здатність зрозуміти що відбувається всередині системи на основі зовнішніх виходів (logs, metrics, traces). В Angular SPA це означає: знати коли і чому users бачать broken UI, розуміти performance bottlenecks до того як users скаржаться, і мати достатньо контексту для debugging виробничих проблем без доступу до user's machine.

**Яку проблему вирішує:**

- Без structured logging: "An error occurred" без context — неможливо debug в production
- Без performance monitoring: LCP 8 секунд для Nigerian users на 3G — невидимо без RUM
- Без HTTP timing: повільний API endpoint — хто про це знає?
- Без CD monitoring: excessive change detection cycles — invisible performance drain

**Як працює під капотом:**

**PerformanceObserver:** Browser Performance Timeline API. `observe({ type: 'largest-contentful-paint' })` → callback при кожному LCP candidate. Final LCP — при user interaction або page hide.

**Core Web Vitals collection pipeline:**
```
Browser event (paint, layout shift, interaction)
  → Performance Timeline entry created
  → PerformanceObserver callback fires
  → web-vitals library normalizes to Metric object
  → Application sends to RUM SDK / analytics endpoint
```

**Angular HTTP interceptor timing:**
```
request dispatched → interceptor start → performance.now()
  → HttpClient → fetch() / XHR
  → response/error → interceptor tap/catchError
  → performance.now() - startTime = duration
  → log service → RUM custom timing
```

**Trade-offs та обмеження:**

- PerformanceObserver: недоступний в SSR — `isPlatformBrowser()` guard обов'язковий
- Log volume vs cost: 100% logging expensive — sampling для INFO/DEBUG
- RUM SDKs: ~50-100KB bundle size — async loading рекомендований
- HTTP request logging: URL cardinality (dynamic params) — потребує URL normalization
- Angular DevTools internal APIs (`ɵ*`) — unstable, prod builds можуть не expose

**Версійність:**
- `PerformanceObserver` підтримується з Chrome 52, Firefox 57, Safari 11
- INP метрика замінила FID в Core Web Vitals з березня 2024 — FID більше не official CWV
- `web-vitals` npm package v3+ підтримує INP
- Angular DevTools extension — з Angular 12
- `performance.measureUserAgentSpecificMemory()` — experimental, Chrome only
- Datadog RUM Angular integration — `@datadog/browser-rum` v5+ підтримує Angular SPA views

## Deep Details

### Edge Cases

**LCP і dynamic content:** В Angular SPA часто LCP element — це JS-rendered (не SSR), що появляється пізніше ніж у статичному HTML. LCP measurement починається з перших байт → completion report delayed. Якщо LCP candidate появляється після user interaction — він не враховується (LCP freeze після interaction).

**CLS і Angular animations:** Angular entry animations (`*:enter`) можуть спричиняти layout shifts якщо animated element спочатку займає місце. Guard: `position: absolute` для entering elements або CSS `content-visibility: auto`.

**PerformanceObserver buffered:** `{ buffered: true }` для LCP і resource timing — entries що відбулись до observer registration будуть delivered. Без buffered — entries поза observation window пропускаються.

**Correlation ID і SSR:** Якщо server генерує correlation ID в SSR і передає через HTTP header → client має використовувати той самий ID для linked traces. `TransferState` для передачі server correlation ID до клієнта.

**Log transport і beforeunload:** При page close — `fetch()` з keepalive або `navigator.sendBeacon()` для final log flush. Звичайний fetch може бути canceled при navigation.

### Junior vs Senior Understanding

**Junior знає:** LogLevel enum, log service injection, PerformanceObserver basic syntax, RUM SDK initialization.

**Senior розуміє:**

1. **Structured logging schema:** Кожен log entry має unique schema: `{ level, message, timestamp, correlationId, userId, component, data }`. Timestamp — ISO 8601 UTC. CorrelationId — UUID v4 per session або per request chain. Component — Angular component name (manual або via `constructor.name`).

2. **Log sampling strategy:** DEBUG: 5-10% в staging, 0% в prod. INFO: 50% в prod. WARN/ERROR: 100%. Sampling decision при перший log — "sampling decision" зберігається в session, не per-request.

3. **INP vs FID:** FID вимірював time to first input response. INP — 98th percentile interaction latency протягом всієї session. Набагато більш representational для Angular додатків де slow CD cycles після click = poor INP.

4. **HTTP URL normalization:** `/api/users/123/orders/456` → `/api/users/:id/orders/:orderId`. Pattern: regex replacement або route matching logic. Без normalization: Datadog/Prometheus мають тисячі unique metric labels → cardinality explosion → cost і performance проблеми.

5. **RUM vs Synthetic:** Synthetic (Lighthouse) — один device, один network, controlled environment. RUM — distribution across all user devices, networks, geos. P50 LCP in RUM може бути хорошим, але P95 від Африки/Азії — broken. Synthetic catches regressions, RUM shows real impact.

### Deprecation & Migration Path

- **FID → INP (March 2024):** First Input Delay більше не є Core Web Vital. `onFID()` в web-vitals deprecated. Оновити до `onINP()`. Старі FID dashboards потрібно update.
- **`ng.profiler.timeChangeDetection()`:** deprecated в Angular 9, видалений в Angular 12. Замість: Angular DevTools Extension профілер.
- **`window.performance.timing` (Navigation Timing v1):** deprecated, замінений `PerformanceNavigationTiming` (v2). `performance.getEntriesByType('navigation')` для v2.

### Connections to Other Concepts

- **Error Handling** (`error-handling-observability`) — ErrorHandler + logging pipeline integration
- **HTTP Interceptors** — timing і correlation ID logging point
- **Change Detection** — CD cycle duration = INP impact, monitoring CD via zone hooks
- **Angular Animations** — animation frame completion = performance mark opportunity

## Examples

### Basic Usage

```typescript
// Structured Log Service
export enum LogLevel { DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3 }

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId: string;
  userId?: string;
  data?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class LogService {
  private platformId = inject(PLATFORM_ID);
  private currentLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
  private correlationId = crypto.randomUUID();

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }
  error(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (level < this.currentLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      data,
    };

    if (!environment.production) {
      // Dev: human-readable
      const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
      console[level >= LogLevel.WARN ? 'warn' : 'log'](
        `[${levelNames[level]}] ${message}`, data ?? ''
      );
    } else {
      // Prod: structured JSON для log aggregation
      this.sendToBackend(entry);
    }
  }

  private sendToBackend(entry: LogEntry): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Batch sending via beacon for page-close reliability
    navigator.sendBeacon('/api/logs', JSON.stringify(entry));
  }
}
```

### Production Scenario

```typescript
// Core Web Vitals monitoring з RUM integration
@Injectable({ providedIn: 'root' })
export class WebVitalsService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private logService = inject(LogService);
  private observers: PerformanceObserver[] = [];

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Use web-vitals library для cross-browser compatibility
    import('web-vitals').then(({ onLCP, onCLS, onINP, onFCP, onTTFB }) => {
      onLCP(metric => this.reportVital(metric));
      onCLS(metric => this.reportVital(metric));
      onINP(metric => this.reportVital(metric)); // Замінив FID з 2024
      onFCP(metric => this.reportVital(metric));
      onTTFB(metric => this.reportVital(metric));
    });
  }

  private reportVital(metric: Metric): void {
    const rating = metric.rating; // 'good' | 'needs-improvement' | 'poor'

    this.logService.info('web_vitals', {
      name: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id,
    });

    // Send to Datadog RUM
    if (typeof datadogRum !== 'undefined') {
      datadogRum.addTiming(metric.name, metric.value);
    }

    // Alert on poor vitals
    if (rating === 'poor') {
      this.logService.warn(`Poor ${metric.name} detected`, {
        value: metric.value,
        threshold: { LCP: 4000, CLS: 0.25, INP: 500 }[metric.name]
      });
    }
  }

  ngOnDestroy(): void {
    this.observers.forEach(obs => obs.disconnect());
  }
}

// HTTP timing interceptor з URL normalization
export const timingInterceptor: HttpInterceptorFn = (req, next) => {
  const logService = inject(LogService);
  const startTime = performance.now();

  // Normalize URL: /api/users/123 → /api/users/:id
  const normalizedUrl = req.url.replace(/\/\d+/g, '/:id');

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const duration = Math.round(performance.now() - startTime);
          logService.info('http.request', {
            method: req.method,
            url: normalizedUrl,
            status: event.status,
            duration,
          });
        }
      },
      error: (error: HttpErrorResponse) => {
        const duration = Math.round(performance.now() - startTime);
        logService.error('http.error', {
          method: req.method,
          url: normalizedUrl,
          status: error.status,
          duration,
        });
      }
    })
  );
};
```

### Anti-Example

```typescript
// ❌ console.log напряму — неконтрольовано
@Component({})
export class BadComponent implements OnInit {
  ngOnInit(): void {
    console.log('Component initialized', this.userId); // ❌ PII in console
    console.log(`/api/users/${this.userId}/data`); // ❌ PII in URL log
  }
}

// ❌ String messages замість structured objects
@Injectable()
export class BadLogService {
  log(message: string): void {
    // ❌ Non-searchable string, no structured fields
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// ❌ Без URL normalization
export const badTimingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = performance.now();
  return next(req).pipe(tap({
    next: () => {
      // ❌ Full URL з dynamic params → cardinality explosion
      logMetric(req.url, performance.now() - start);
      // /api/users/1, /api/users/2, /api/users/3 = 3 unique metrics
      // /api/users/:id = 1 metric
    }
  }));
};

// ❌ RUM без sampling — 100% sessions expensive
datadogRum.init({
  applicationId: '...',
  clientToken: '...',
  sessionSampleRate: 100,  // ❌ Expensive — all sessions recorded
  sessionReplaySampleRate: 100, // ❌ Very expensive — all sessions replayed
  // No privacy masking
});

// ✅ Правильно: sampling і privacy
datadogRum.init({
  applicationId: '...',
  clientToken: '...',
  sessionSampleRate: 20,          // 20% sessions
  sessionReplaySampleRate: 5,     // 5% of sampled sessions
  defaultPrivacyLevel: 'mask-user-input', // Mask sensitive inputs
});
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `console.log()` напряму у компонентах | Non-configurable, PII exposure, не централізовано | Inject `LogService` з рівнями і transport abstraction |
| HTTP log з dynamic URL (`/api/users/123`) | Cardinality explosion в monitoring — унікальна метрика per user ID | URL normalization: `/api/users/:id` через regex або route pattern matching |
| FID metric замість INP | FID deprecated з березня 2024, більше не Core Web Vital | `onINP()` з web-vitals v3+ |
| RUM 100% session recording без privacy masking | GDPR violation — PII в session replays | `sessionSampleRate: 20`, `defaultPrivacyLevel: 'mask-user-input'` |
| PerformanceObserver без `isPlatformBrowser()` guard | SSR: `PerformanceObserver` не існує на сервері → runtime error | Guard всі browser-specific APIs |

## Interview Block

### [L1 — Warm-up] Як реалізувати log service в Angular? Яка мінімальна структура потрібна?

**Signal being tested:** Розуміння structured logging як pattern, відмінність від raw console.log, і prod/dev distinction.

**What the interviewer expects:** LogLevel enum, structured object format (не string), transport abstraction, production behavior (no DEBUG logs).

**How to probe deeper:** "Навіщо structured JSON замість string messages?" — searchable/filterable в log aggregation (ELK, Datadog), automatic field extraction, machine-readable.

**Reference answer:** LogService з LogLevel enum (DEBUG/INFO/WARN/ERROR). Structured entries: `{ level, message, timestamp, correlationId, data }`. Dev: console output. Prod: HTTP transport або `navigator.sendBeacon()`. Поточний level з `environment.production` — в prod лише WARN+. CorrelationId per session для log chaining.

**Common mistakes:** `console.log('User ' + id)` — string concatenation, not searchable. Логують PII в messages.

---

### [L2 — Mid] Що таке Core Web Vitals і як їх вимірювати в Angular?

**Signal being tested:** Знання актуальних CWV метрик (INP замінив FID!), PerformanceObserver API, і Angular-specific implications.

**What the interviewer expects:** LCP, CLS, INP (не FID), цільові значення, `web-vitals` npm package, Angular INP зв'язок з CD cycles.

**How to probe deeper:** "Чому Angular додатки можуть мати поганий INP?" — click handler → Zone.js microtask queue → long CD cycle → browser blocked → high INP.

**Reference answer:** LCP ≤2.5s, CLS ≤0.1, INP ≤200ms (замінив FID 2024). `web-vitals` library: `onLCP/onCLS/onINP(metric => report(metric))`. PerformanceObserver напряму — але потребує `buffered: true` для LCP. Angular: long CD cycles після interaction = poor INP. Zoneless/signals — менше CD overhead.

**Common mistakes:** Згадують FID замість INP. Вимірюють тільки Lighthouse без RUM.

---

### [L3 — Senior] Як логувати HTTP request timing через interceptors? Яких помилок уникати?

**Signal being tested:** Практична реалізація HTTP observability, URL normalization awareness, і privacy/cardinality concerns.

**What the interviewer expects:** `performance.now()` в interceptor, tap/catchError, URL normalization, correlation ID, sampling, no PII logging.

**How to probe deeper:** "Що таке cardinality explosion і як його уникнути в HTTP метриках?" — унікальна метрика per dynamic URL → thousands of unique series → cost і performance issues in Prometheus/Datadog.

**Reference answer:** Functional interceptor: `performance.now()` start, `tap({ next: logSuccess, error: logError })`. URL normalization: `/api/users/123` → `/api/users/:id`. Метрики: method, normalized URL, status, duration. Correlation ID в request header. 100% errors, 10% success sampling. No body logging, no Authorization header.

**Common mistakes:** Raw URLs з params в metrics. Request body в logs.

---

### [L4 — Staff/Principal] Як інтегрувати RUM в Angular і яка різниця між RUM і Synthetic monitoring?

**Signal being tested:** Системне розуміння observability — RUM як complement до Synthetic, architectural decisions для sampling і privacy.

**What the interviewer expects:** Synthetic = controlled/CI, RUM = real users/diverse devices. Datadog/New Relic init, sampling strategy, Session Replay privacy, business events correlation.

**How to probe deeper:** "Як correlate RUM performance data з business metrics (revenue, conversions)?" — custom events `datadogRum.addAction('purchase_completed', { value })` — link performance і business KPIs.

**Reference answer:** Synthetic (Lighthouse CI): regression detection, controlled environment. RUM (Datadog/New Relic): real users, real devices, real networks — distribution не average. `datadogRum.init()` синхронно в main.ts. Sampling: 20% sessions, 5% session replay. Privacy: `mask-user-input` by default. Business events: `addAction('checkout')` correlates performance з conversions. RUM + Sentry: complementary — shared correlationId.

**Common mistakes:** 100% session recording без privacy masking (GDPR). Тільки Lighthouse без RUM.

## Summary

### Key Points

- Structured logging: `{ level, message, timestamp, correlationId, data }` — searchable JSON, не string messages. `navigator.sendBeacon()` для reliable log flush при page close.
- Core Web Vitals (2024): LCP, CLS, INP — FID більше не CWV. `web-vitals` library для cross-browser measurement.
- INP і Angular: long CD cycles після click event = poor INP. Zoneless + signals = fewer CD overhead.
- HTTP interceptors: `performance.now()` timing, URL normalization (`/users/:id`), correlation ID header, 100% errors/10% success sampling.
- PerformanceObserver і SSR: `isPlatformBrowser()` guard обов'язковий — API недоступний на сервері.
- RUM vs Synthetic: Synthetic (Lighthouse CI) для regression detection, RUM для real user experience distribution.
- Session Replay privacy: `defaultPrivacyLevel: 'mask-user-input'` обов'язковий — GDPR compliance.

### Elevator Pitch (2 minutes)

Logging і performance monitoring в Angular — це observability infrastructure. Structured log service: `{ level, message, timestamp, correlationId, data }` JSON format з LogLevel enum. Prod: тільки WARN+, HTTP transport з `navigator.sendBeacon()` для page-close reliability. Dev: console з human-readable output.

Core Web Vitals 2024: LCP (≤2.5s), CLS (≤0.1), INP (≤200ms) — INP замінив FID! `web-vitals` npm library для measurement. Angular INP: click → CD cycle → browser paint delay. Zoneless/signals зменшують CD overhead.

HTTP timing interceptor: `performance.now()` + tap/catchError. URL normalization критична: `/api/users/:id` не `/api/users/123` — cardinality explosion prevention.

RUM (Datadog, New Relic): реальні user measurements vs Lighthouse synthetic. Init синхронно в main.ts. Sampling: 20% sessions. Session Replay: `mask-user-input` для GDPR. Business events: `addAction('purchase')` correlates performance з conversions.
