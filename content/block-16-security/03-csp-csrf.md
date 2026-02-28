---
title: "Content Security Policy & CSRF Protection"
block: 16
topic: 3
slug: "csp-csrf"
difficulty: 3
sinceVersion: "2"
tags: ["CSP", "CSRF", "XSRF", "HttpClientXsrfModule", "nonce", "strict CSP", "meta tag", "security headers"]
relatedTopics: ["xss-sanitization", "auth-patterns", "secure-coding"]
interviewQuestions:
  - id: "b16t3q1"
    level: "junior"
    question: "Що таке Content Security Policy і навіщо вона потрібна Angular додатку?"
    referenceAnswers:
      junior: "CSP — це HTTP заголовок що вказує браузеру звідки можна завантажувати скрипти, стилі та інші ресурси. Захищає від XSS."
      mid: "CSP (Content-Security-Policy header): browser enforces policy — якщо ресурс не відповідає policy → blocked + console error. Директиви: `script-src`, `style-src`, `img-src`, `connect-src`, `font-src`, `default-src`. Для Angular: inline scripts генеруються Angular CLI → потрібен nonce або `'unsafe-inline'` (погано). `script-src 'nonce-{random}'` — дозволяє лише inline scripts з відповідним nonce атрибутом. `default-src 'self'` — лише з того ж origin. CSP додається у HTTP response header або `<meta>` тег."
      senior: "CSP для Angular специфіка: 1) Angular CLI генерує inline styles для компонентів (View Encapsulation Emulated) → `style-src 'unsafe-inline'` або hashes. 2) Angular 16+: `angular.json` `security.autoCsp: true` — Angular CLI автоматично генерує nonces для inline scripts і styles у index.html. 3) Nonce-based CSP: nonce генерується сервером при кожному request, injected у index.html `<script nonce='...' >` і CSP header `script-src 'nonce-xxx'`. 4) `'strict-dynamic'`: дозволяє scripts що завантажуються nonce-blessed scripts — Angular CLI dynamically loaded chunks автоматично trusted. 5) Strict CSP: `script-src 'nonce-{nonce}' 'strict-dynamic'; object-src 'none'; base-uri 'none'`. 6) Report URI: `report-uri /csp-violations` або `report-to` — збирати порушення CSP."
      staff: "CSP deployment strategy для Angular: 1) Phase 1: report-only (`Content-Security-Policy-Report-Only`) — collect violations without breaking. 2) Phase 2: analyze reports, fix violations (third-party scripts, inline styles). 3) Phase 3: enforcement mode. 4) Nonce generation: web server (Nginx/Node) generates cryptographically random nonce per request → injected у `<script nonce>` template. Angular SSR: nonce available через `CSP_NONCE` injection token (Angular 16+). 5) CDN: якщо app serves від CDN (static files) — nonce неможливий (статичні файли). Альтернатива: hash-based CSP для inline scripts. 6) Angular Material: перевіряти що Material не inject inline styles без nonce — Material 16+ підтримує nonce через CSP_NONCE. 7) Third-party analytics: Google Analytics `gtag` потребує specific script-src. Документувати і add to policy."
    commonMistakes:
      - "`'unsafe-inline'` у script-src нівелює весь захист CSP"
      - "CSP через meta тег замість HTTP header — менш безпечний, деякі директиви недоступні"
      - "Не збирають CSP violation reports — не знають що блокується"
    relatedQuestions: ["b16t3q2", "b16t3q3"]
  - id: "b16t3q2"
    level: "mid"
    question: "Що таке CSRF атака і як Angular захищає від неї через HttpClientXsrfModule?"
    referenceAnswers:
      junior: "CSRF — атака де шкідливий сайт змушує браузер надіслати запит до вашого API від імені авторизованого користувача. Angular надає HttpClientXsrfModule для захисту."
      mid: "CSRF (Cross-Site Request Forgery): browser автоматично надсилає cookies до origin → шкідливий сайт може trigger authenticated request. Захист Angular: cookie-to-header pattern. Server встановлює XSRF-TOKEN cookie (non-HttpOnly). Angular читає cookie і додає `X-XSRF-TOKEN` header. Server перевіряє header == cookie value — cross-site request не може читати cookie (SOP), тому не може встановити header. `HttpClientXsrfModule.withOptions({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })` або `provideHttpClient(withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }))`."
      senior: "CSRF механізм і Angular details: 1) Double submit cookie pattern: server sets XSRF-TOKEN cookie → Angular reads (non-HttpOnly, same-origin access) → adds X-XSRF-TOKEN header → server validates `header == cookie`. 2) Cross-site attack neможливий: SOP блокує reading cookie від іншого origin. 3) Angular applies CSRF header лише до: non-GET requests AND same-origin. GET requests безпечні від CSRF (ідемпотентні). 4) SameSite=Strict cookie: якщо auth cookie SameSite=Strict → cross-site requests не мають cookie → CSRF неможливий без Angular XSRF. 5) JWT у header (not cookie): CSRF не загроза — browser не auto-send auth header. CSRF relevant лише з cookie-based auth. 6) Angular default: `HttpClientXsrfModule` не active by default — треба явно import або `withXsrfConfiguration()`."
      staff: "CSRF захист у production: 1) SameSite=Strict + XSRF token: defense in depth. SameSite запобігає більшості cross-site sends, XSRF — додатковий шар. 2) Custom cookie/header names: `XSRF-TOKEN` може бути targeted у attacks на відомі frameworks. Custom names через `withXsrfConfiguration()`. 3) Origin validation на сервері: перевіряти `Origin` або `Referer` header — третій рівень захисту. 4) JWT-based auth: якщо JWT у Authorization header (не cookie) → CSRF автоматично not applicable. Але якщо JWT у cookie (для SSR-compatibility) → CSRF applies. 5) Preflighted requests: cross-origin requests з custom headers (X-XSRF-TOKEN) → browser sends OPTIONS preflight → CORS policy enforced → cross-site CSRF fails. 6) CSRF token rotation: per-request CSRF tokens (як у form-based apps) vs per-session (Angular default). Per-request більш secure але складніший. 7) API design: якщо REST API використовує CORS correctly — cross-origin requests blocked without explicit CORS headers."
    commonMistakes:
      - "Думають JWT у localStorage захищає від CSRF автоматично — правда лише якщо JWT у Authorization header, не cookie"
      - "Не активують HttpClientXsrfModule — Angular не додає XSRF header за замовчуванням"
      - "XSRF-TOKEN cookie встановлюють як HttpOnly — Angular не зможе читати"
    relatedQuestions: ["b16t3q1", "b16t3q3"]
  - id: "b16t3q3"
    level: "mid"
    question: "Які security headers окрім CSP варто встановити для Angular SPA і навіщо?"
    referenceAnswers:
      junior: "Є кілька важливих заголовків: X-Frame-Options проти clickjacking, HSTS для HTTPS. Angular app потребує правильних HTTP заголовків від web сервера."
      mid: "Необхідні security headers: 1) `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — HTTPS only, prevent downgrade. 2) `X-Frame-Options: DENY` — clickjacking protection. 3) `X-Content-Type-Options: nosniff` — prevent MIME sniffing. 4) `Referrer-Policy: strict-origin-when-cross-origin` — обмежити Referer information. 5) `Permissions-Policy` — disable unused browser features (camera, microphone). 6) `Cache-Control: no-store` для authenticated pages. Встановлюються у web server config (Nginx/Apache) або reverse proxy."
      senior: "Security headers у Angular context: 1) HSTS: `max-age=31536000; includeSubDomains; preload` — HTTPS upgrade у browser. Preload submits to Chrome preload list. 2) `X-Frame-Options: DENY` або CSP `frame-ancestors 'none'` — clickjacking. frame-ancestors у CSP більш flexible. 3) `X-Content-Type-Options: nosniff` — browser не буде MIME-sniff відповідь — запобігає JavaScript виконанню від text/plain response. 4) `Cross-Origin-Embedder-Policy: require-corp` + `Cross-Origin-Opener-Policy: same-origin` — COEP+COOP для SharedArrayBuffer (потрібно для high-performance web). 5) `Permissions-Policy: geolocation=(), camera=()` — disable APIs. 6) Angular SPA specific: `Cache-Control: no-store, no-cache` для index.html — щоб browser завжди завантажував свіжу версію. Для static assets: aggressive caching (`immutable`) оскільки Angular CLI hashes filenames."
      staff: "Security headers at infrastructure level: 1) Centralized header policy: Nginx/Cloudflare/AWS CloudFront — add security headers для всіх responses. Не у Angular (SPA не може set response headers). 2) Header audit tools: securityheaders.com, OWASP ZAP. 3) SPA-specific cache strategy: index.html: `Cache-Control: no-cache` (revalidate). `main.abc123.js`: `Cache-Control: max-age=31536000, immutable` (Angular CLI hash). 4) Angular service worker: service worker intercepts requests — може add/override headers? Ні — SW не може modify response headers для navigation requests. 5) HSTS preload gotchas: preload requires `includeSubDomains`. Якщо subdomain не HTTPS — HSTS breaks it. 6) Reporting: `Report-To` і `NEL` (Network Error Logging) — infrastructure insights. 7) Regulatory compliance: HIPAA, PCI-DSS мають specific header requirements. 8) Header testing у CI: `helmsman` або custom script що перевіряє production headers при deployment."
    commonMistakes:
      - "HSTS без `includeSubDomains` — subdomains vulnerable до downgrade"
      - "X-Frame-Options замість CSP frame-ancestors — менш flexible"
      - "Не кешують Angular static assets — зайві requests при кожному page load"
    relatedQuestions: ["b16t3q2", "b16t3q4"]
  - id: "b16t3q4"
    level: "senior"
    question: "Як налаштувати nonce-based CSP для Angular і які є обмеження цього підходу?"
    referenceAnswers:
      junior: "Nonce — це випадковий рядок що додається до script тегів. Браузер дозволяє виконання скриптів лише з відповідним nonce у CSP header."
      mid: "Nonce-based CSP: server генерує `crypto.randomBytes(16).toString('base64')` при кожному request → injected у `<script nonce='ABC123'>` → CSP header: `script-src 'nonce-ABC123' 'strict-dynamic'`. `'strict-dynamic'`: динамічно завантажені скрипти (Angular lazy chunks) trusted якщо завантажені nonce-blessed скриптом. Angular 16+ `CSP_NONCE` injection token: `{ provide: CSP_NONCE, useValue: readNonceFromDocument() }`. Angular додає nonce до своїх inline elements. Обмеження: nonce потребує server-side rendering або server template."
      senior: "Nonce-based CSP для Angular деталі: 1) Server (Nginx + Lua / Node.js Express): генерує nonce → підставляє у index.html template → додає у CSP header. 2) Angular 16+: `CSP_NONCE` injection token — Angular reads nonce з meta tag або провайдера → додає до Angular-generated inline styles. 3) `index.html` template: `<script src='main.js' nonce='${NONCE}'></script>`. 4) `'strict-dynamic'`: Webpack chunks завантажуються динамічно через script injection → вони inherit trust від parent nonce-blessed script. 5) CSP violation при Angular animations: Angular може inject inline styles → потрібен `style-src 'nonce-{nonce}'`. 6) Angular Material: передати нonce через `CSP_NONCE`. 7) Обмеження: CDN-hosted static files не мають server-side nonce generation. Рішення: окремий nonce-injection server (BFF) або hash-based CSP. 8) Testing CSP: browser DevTools Console показує violations. `Content-Security-Policy-Report-Only` у staging."
      staff: "Nonce CSP у production infrastructure: 1) Nginx + OpenResty Lua: `set_by_lua $csp_nonce 'return require('resty.random').bytes(16)';`. Inject у index.html і CSP header. 2) Node.js BFF: `express-csp-header` middleware. 3) Angular SSR (Angular Universal): nonce доступний у server context → inject через `CSP_NONCE` token. 4) Service worker: SW не може додати nonce до navigation responses — SW apps потребують спеціальний підхід. 5) Nonce per request vs per session: per-request security, per-session performance. 6) Hash-based альтернатива: `script-src 'sha256-{hash}'` — hash inline script content. Angular CLI може generate hash. Але при кожній зміні HTML → новий hash → новий CSP header. 7) Angular CLI `autoCsp: true` (experimental): CLI генерує hashes для inline scripts у index.html. 8) Monitoring: CSP violation rate > 0.1% → investigate (може бути browser extension або legit violation)."
    commonMistakes:
      - "`'unsafe-inline'` у production замість nonce або hash"
      - "Nonce без `'strict-dynamic'` — lazy-loaded chunks не завантажуються"
      - "Один nonce для всіх requests — predictable nonce = defeating purpose"
    relatedQuestions: ["b16t3q3", "b16t3q5"]
  - id: "b16t3q5"
    level: "staff"
    question: "Як реалізувати comprehensive security header policy для Angular додатку у production infrastructure?"
    referenceAnswers:
      junior: "Встановити security headers у Nginx або через reverse proxy що стоїть перед Angular app."
      mid: "Nginx config з security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP. Angular index.html: `Cache-Control: no-cache`. Static assets: `Cache-Control: max-age=31536000, immutable`. Тестування: securityheaders.com."
      senior: "Nginx security config: CSP з nonce (через Lua або включення server-side), HSTS preload, frame-ancestors у CSP замість X-Frame-Options, Permissions-Policy для browser features. Cache strategy: SPA-specific — index.html no-cache, assets immutable. CSP report endpoint для violation collection. Angular-specific: `style-src 'nonce-{nonce}'` для Angular-generated styles. Перевірка у CI через securityheaders.com API."
      staff: "Infrastructure security header governance: 1) Centralized policy: Terraform/Cloudflare Workers/AWS WAF — security headers applied globally, не per-app. 2) Per-app overrides: app-specific CSP (деякі apps потребують third-party script-src). 3) Header versioning: CSP policy changes = deploy event. Track у git. 4) Compliance automation: CI/CD job що validates headers after each deployment. Fail deployment якщо required header відсутній або `'unsafe-inline'` present. 5) Multi-environment: dev (relaxed), staging (prod-like CSP report-only), prod (full enforcement). 6) Angular micro-frontends: кожен MFE remote потребує власних CSP adjustments — shell orchestrates combined policy. 7) Content-Security-Policy audit tools: Mozilla Observatory, OWASP ZAP headers scan. 8) Penetration testing: security headers validation частина quarterly pentest scope. 9) Incident: CSP violation spike → auto-alert → investigate → може бути XSS attempt або legit misconfiguration."
    commonMistakes:
      - "Security headers лише у Angular — Angular SPA не може set response headers"
      - "HSTS на http:// сервері — header ігнорується"
      - "Не тестують headers після deployment — можуть бути removed by reverse proxy"
    relatedQuestions: ["b16t3q4", "b16t1q5"]
---

## Core Concept

**English definition:** Content Security Policy (CSP) is an HTTP response header that instructs browsers which sources are trusted for scripts, styles, and other resources, defending against XSS. CSRF (Cross-Site Request Forgery) is mitigated by Angular's cookie-to-header double-submit pattern via `HttpClientXsrfModule`.

**Пояснення:** CSP і CSRF — дві різні атаки з різними векторами і різними захистами. CSP захищає від виконання unauthorized scripts (XSS mitigation шар 2). CSRF захищає від примусових запитів від авторизованого браузера на шкідливому сайті. Angular надає вбудовані механізми для обох, але вимагає правильної конфігурації.

**Яку проблему вирішує:** Без CSP: навіть якщо XSS injection відбулась — script виконується. CSP як defense layer 2: injected script без nonce → browser block. Без CSRF protection з cookie auth: будь-який сайт може trigger authenticated API calls від жертви (delete account, transfer money, etc.).

**Як працює під капотом:** CSP: browser парсить `Content-Security-Policy` header → при завантаженні/виконанні ресурсу → перевірка проти policy → якщо не відповідає → blocked + `securitypolicyviolation` event. Nonce: crypto-random string у header і script/style tag → match required. `'strict-dynamic'`: inherited trust для dynamically-created scripts. Angular CSRF: `HttpClientModule` читає `XSRF-TOKEN` cookie (через `document.cookie` → SOP дозволяє читати same-origin) → додає `X-XSRF-TOKEN` header → сервер порівнює `header value == cookie value` → cross-site request не може читати cookie від іншого origin → не може встановити правильний header.

**Trade-offs та обмеження:** CSP nonce потребує server-side template або SSR — CDN-hosted static SPAs не можуть generate nonce. Hash-based CSP альтернатива але складніша при dynamic content. Angular component styles (ViewEncapsulation.Emulated) inject inline `<style>` → потрібен `style-src 'nonce-{nonce}'` або `'unsafe-inline'`. CSRF relevant лише для cookie-based auth — JWT у Authorization header = CSRF-safe.

**Версійність:** `HttpClientXsrfModule` — Angular 4.3+. `provideHttpClient(withXsrfConfiguration(...))` — Angular 15+. `CSP_NONCE` injection token — Angular 16+. Angular CLI `security.autoCsp` — Angular 16+ (experimental). `withXsrfConfiguration()` без `HttpClientXsrfModule` import — Angular 15+ standalone approach.

## Deep Details

### Edge Cases

**Angular inline styles і CSP:** Angular Emulated ViewEncapsulation генерує `<style>` теги динамічно при bootstrap. Без `style-src 'nonce-{nonce}'` або `'unsafe-inline'` — styles заблоковані, додаток виглядає без стилів. `CSP_NONCE` token у Angular 16+: Angular додає nonce до своїх `<style>` тегів.

**XSRF-TOKEN cookie non-HttpOnly requirement:** Cookie що Angular читає для CSRF defense МАЄ бути non-HttpOnly (щоб JS міг читати). HttpOnly cookies JS не може читати — Angular CSRF mechanism не спрацює. Два cookies: auth session (HttpOnly) + XSRF-TOKEN (non-HttpOnly).

**SPA Cache-Control для index.html:** Angular CLI генерує `main.{hash}.js` — hash змінюється при зміні коду. Але `index.html` не має hash у назві. Якщо browser кешує index.html → старий `<script src='main.old.js'>` → 404. Обов'язково: `Cache-Control: no-cache` для index.html.

**CSP і browser extensions:** Extensions можуть inject scripts → CSP violations у reports. Фільтрувати extension-generated violations (URL pattern `chrome-extension://`).

### Junior vs Senior Understanding

**Junior** знає що CSP — це header проти XSS і Angular має CSRF protection.

**Senior** розуміє: 1) Nonce механізм і `'strict-dynamic'` для Angular lazy loading. 2) Double-submit cookie CSRF pattern і чому XSRF-TOKEN не може бути HttpOnly. 3) CSRF relevance тільки для cookie-based auth. 4) SPA-specific cache strategy (index.html no-cache vs assets immutable). 5) Angular ViewEncapsulation і `CSP_NONCE` injection. 6) CSP violation reporting і аналіз.

### Deprecation & Migration Path

**`HttpClientXsrfModule` (class-based NgModule):** Ще підтримується але NgModule підхід legacy. Standalone: `provideHttpClient(withXsrfConfiguration({ cookieName: '...', headerName: '...' }))`. **`X-XSS-Protection` header:** Deprecated. Замінений на CSP. Деякі старі security guides ще його рекомендують — у сучасному контексті — видалити або встановити `0`. **Meta CSP (`<meta http-equiv='Content-Security-Policy'>`):** Підтримується але обмежений — не підтримує `frame-ancestors`, `report-uri`, `sandbox`. HTTP header preferred.

### Connections to Other Concepts

- **XSS Sanitization (Block 16, Topic 1):** CSP — defense layer 2 після Angular template sanitization.
- **Auth Patterns (Block 16, Topic 2):** CSRF relevant при cookie-based auth. JWT у header = CSRF-safe.
- **Secure Coding (Block 16, Topic 4):** Security headers як частина secure deployment checklist.

## Examples

### Basic Usage

```typescript
// Angular standalone: CSRF protection
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',      // server sets this cookie
        headerName: 'X-XSRF-TOKEN',    // Angular reads cookie, sends as this header
      })
    ),
  ],
};

// Сервер (Node.js Express) встановлює XSRF cookie
app.use((req, res, next) => {
  // Non-HttpOnly — Angular JS code must be able to read it
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false,    // ← ОБОВ'ЯЗКОВО non-HttpOnly
    secure: true,
    sameSite: 'strict',
  });
  next();
});
```

```nginx
# Nginx security headers configuration
server {
    # HSTS: force HTTPS for 1 year, include subdomains, preload
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Clickjacking protection (використовувати CSP frame-ancestors — ширше)
    add_header X-Frame-Options "DENY" always;

    # Prevent MIME type sniffing
    add_header X-Content-Type-Options "nosniff" always;

    # Referrer policy
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Disable unused browser features
    add_header Permissions-Policy "geolocation=(), camera=(), microphone=(), payment=()" always;

    # CSP — nonce via Lua (OpenResty) або placeholder для NodeJS injection
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'nonce-REPLACE_WITH_NONCE' 'strict-dynamic';
        style-src 'nonce-REPLACE_WITH_NONCE' 'self';
        img-src 'self' data: https:;
        font-src 'self';
        connect-src 'self' https://api.myapp.com;
        frame-ancestors 'none';
        base-uri 'self';
        object-src 'none';
        report-uri /csp-violations;
    " always;

    # Angular SPA: index.html no-cache (critical for deployments)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }

    # Angular assets: aggressive caching (CLI hashes filenames)
    location ~* \.(js|css|woff2)$ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }
}
```

### Production Scenario

```typescript
// Angular 16+ CSP_NONCE integration
// Node.js Express server that serves Angular SSR

import express from 'express';
import { randomBytes } from 'crypto';
import { renderApplication } from '@angular/platform-server';

const app = express();

app.get('*', (req, res) => {
  const nonce = randomBytes(16).toString('base64');

  // CSP header з nonce
  res.setHeader(
    'Content-Security-Policy',
    `script-src 'nonce-${nonce}' 'strict-dynamic'; style-src 'nonce-${nonce}' 'self'; object-src 'none'; base-uri 'self'`
  );

  // Angular SSR з nonce через CSP_NONCE token
  renderApplication(AppComponent, {
    document: indexHtml,
    url: req.url,
    platformProviders: [
      { provide: CSP_NONCE, useValue: nonce },  // Angular uses this for inline elements
    ],
  }).then(html => res.send(html));
});

// CSP violation endpoint
app.post('/csp-violations', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body['csp-report'];

  // Filter browser extension violations
  if (report?.['document-uri']?.includes('chrome-extension://')) {
    return res.sendStatus(204);
  }

  // Log to security monitoring (Sentry, Datadog, etc.)
  logger.warn('CSP Violation', {
    blockedUri: report?.['blocked-uri'],
    violatedDirective: report?.['violated-directive'],
    documentUri: report?.['document-uri'],
  });

  res.sendStatus(204);
});
```

### Anti-Example

```typescript
// ❌ НЕБЕЗПЕЧНО: 'unsafe-inline' у script-src нівелює весь захист CSP
// CSP: "script-src 'self' 'unsafe-inline'"
// Зловмисник inject <script>stealData()</script> → виконується!
// 'unsafe-inline' = будь-який inline script allowed = CSP марна

// ❌ НЕБЕЗПЕЧНО: XSRF-TOKEN як HttpOnly cookie
// Angular не може читати HttpOnly cookies через JS
// withXsrfConfiguration стає ineffective — header не додається
// API захищений cookies але без CSRF token → vulnerable
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', generateToken(), {
    httpOnly: true,  // ❌ Angular JS не може читати!
    secure: true,
  });
});

// ❌ НЕБЕЗПЕЧНО: Index.html з aggressive caching
// Nginx: location / { add_header Cache-Control "max-age=86400" }
// Після deployment старий index.html у cache → завантажує main.old.js → 404
// Або: завантажує old Angular version → security vulnerabilities persist

// ❌ НЕБЕЗПЕЧНО: CSP тільки через meta тег
// <meta http-equiv="Content-Security-Policy" content="script-src 'self'">
// Meta CSP не підтримує: frame-ancestors, report-uri, sandbox
// HTTP header завжди preferred і повніший
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `'unsafe-inline'` у `script-src` | CSP марна — будь-який inline script виконується | Nonce-based: `'nonce-{random}' 'strict-dynamic'` |
| XSRF-TOKEN cookie з `HttpOnly: true` | Angular JS не може читати cookie → CSRF token не додається до headers | XSRF-TOKEN має бути non-HttpOnly (auth session cookie може бути HttpOnly) |
| `Cache-Control: max-age=31536000` для index.html | Після deployment браузер завантажує старий index.html → old bundle → 404 або security regression | `Cache-Control: no-cache` для index.html, `immutable` для hashed assets |
| Відсутній CSP violation reporting | Не знаєте що блокується — bugs і attacks invisible | `report-uri /csp-violations` + logging pipeline + alerts |
| CSRF protection лише через Angular без server validation | Якщо client bypassed — no protection | Server MАЄ validate `X-XSRF-TOKEN header == XSRF-TOKEN cookie` |

## Interview Block

### [L1 — Warm-up] Що таке Content Security Policy і навіщо вона Angular додатку?

**Signal being tested:** Розуміння CSP як defense-in-depth шару, а не primary XSS defense.

**What the interviewer expects:** CSP як шар 2 після Angular template sanitization. Директиви script-src. Nonce vs unsafe-inline.

**How to probe deeper:** "Angular вже sanitizes templates. Навіщо ще CSP?"

**Reference answer:** CSP = defense-in-depth шар 2: навіть якщо XSS injection відбулась, injected script без nonce не виконається. `script-src 'nonce-{random}' 'strict-dynamic'` — лише scripts з nonce allowed, Angular lazy chunks автоматично trusted через strict-dynamic. `'unsafe-inline'` = повна втрата захисту.

**Common mistakes:** `'unsafe-inline'` "для зручності". CSP через meta тег (менш захищений). Не збирають violation reports.

---

### [L2 — Mid] Як Angular захищає від CSRF і як налаштувати HttpClientXsrfModule?

**Signal being tested:** Розуміння double-submit cookie pattern і чому XSRF-TOKEN не може бути HttpOnly.

**What the interviewer expects:** Cookie-to-header pattern. Non-HttpOnly requirement. `withXsrfConfiguration()`. CSRF relevance тільки для cookie auth.

**How to probe deeper:** "JWT у Authorization header — чи потрібен CSRF захист?"

**Reference answer:** Double-submit cookie: server sets XSRF-TOKEN (non-HttpOnly) → Angular reads via `document.cookie` → adds X-XSRF-TOKEN header → server validates match. Cross-site request не може read cookie (SOP) → не може set correct header. `provideHttpClient(withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }))`. JWT у header — CSRF N/A (browser не auto-sends headers).

**Common mistakes:** HttpOnly XSRF-TOKEN — Angular не прочитає. Думають JWT автоматично CSRF-safe якщо у localStorage — так, але якщо у cookie — ні.

---

### [L3 — Senior] Як налаштувати nonce-based CSP для Angular і які обмеження?

**Signal being tested:** Практичне розуміння nonce generation, `'strict-dynamic'` і Angular-specific challenges (inline styles, lazy chunks).

**What the interviewer expects:** Server-side nonce generation, `CSP_NONCE` injection token, strict-dynamic для lazy chunks, CDN limitation.

**How to probe deeper:** "Angular lazy-loaded routes використовують dynamic imports. Як вони завантажуються при nonce CSP?"

**Reference answer:** Server генерує `randomBytes(16).toString('base64')` per request → inject у `<script nonce='ABC'>` і CSP header `'nonce-ABC'`. `'strict-dynamic'`: dynamically-created scripts від nonce-blessed script → inherited trust → Angular chunks завантажуються. `CSP_NONCE` token у Angular 16+: Angular додає nonce до inline styles. Обмеження: CDN static hosting → no server-side nonce → hash-based CSP альтернатива.

**Common mistakes:** Без `'strict-dynamic'` — Angular lazy chunks blocked. Один nonce для всіх requests — predictable.

---

### [L4 — Staff/Principal] Як реалізувати comprehensive security header policy у production infrastructure?

**Signal being tested:** Системне мислення про infrastructure-level security, SPA-specific cache strategy і compliance.

**What the interviewer expects:** Centralized header policy (Nginx/CDN level), CSP violation reporting pipeline, SPA cache strategy, CI validation.

**How to probe deeper:** "Після кожного Angular deployment — як переконатись що security headers правильні і app не зламано?"

**Reference answer:** Centralized: Nginx/Cloudflare config для всіх responses. HSTS preload, frame-ancestors у CSP, Permissions-Policy. SPA cache: index.html = `no-cache`, assets = `immutable`. Violation reporting: `/csp-violations` endpoint → Sentry/Datadog → alert on spike. CI/CD: post-deployment check via securityheaders.com API — fail deployment якщо missing headers або unsafe-inline present. Angular SSR + CSP_NONCE для nonce injection.

**Common mistakes:** Security headers у Angular код (SPA не може set response headers). HSTS на http:// сервері (ігнорується). Не тестують headers після deployment.

## Summary

### Key Points

- CSP `script-src 'nonce-{random}' 'strict-dynamic'` — defense layer 2 проти XSS; `'unsafe-inline'` нівелює весь захист
- Angular `CSP_NONCE` injection token (v16+) — Angular додає nonce до своїх inline elements
- CSRF double-submit cookie: XSRF-TOKEN (non-HttpOnly) → Angular reads → X-XSRF-TOKEN header → server validates
- CSRF relevant лише для cookie-based auth; JWT у Authorization header = CSRF-safe
- SPA cache strategy: `index.html: no-cache`, `*.hash.js/css: max-age=31536000, immutable`
- `'strict-dynamic'` у CSP critical для Angular lazy loading chunks
- Security headers (HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) встановлюються у Nginx/CDN, не Angular

### Elevator Pitch (2 minutes)

CSP і CSRF — два різних security механізми. CSP: HTTP header що говорить браузеру "виконувати тільки scripts з nonce або зі свого origin" — defense layer 2 після Angular template sanitization. Для Angular: `script-src 'nonce-{random}' 'strict-dynamic'` — сервер генерує nonce per request, `'strict-dynamic'` дозволяє Angular lazy chunks. CSRF: cookie-based auth вразлива — шкідливий сайт trigger authenticated requests. Angular Double-submit cookie pattern: XSRF-TOKEN non-HttpOnly cookie → Angular reads → X-XSRF-TOKEN header → server validates. JWT у Authorization header = CSRF-safe. Security headers (HSTS, X-Frame-Options через CSP frame-ancestors, X-Content-Type-Options) — Nginx level, не Angular. SPA cache: index.html no-cache (critical для deployments), hashed assets immutable.
