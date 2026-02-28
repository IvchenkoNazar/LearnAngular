---
title: "Secure Coding Practices in Angular"
block: 16
topic: 4
slug: "secure-coding"
difficulty: 3
sinceVersion: "2"
tags: ["OWASP", "dependency audit", "npm audit", "supply chain", "environment variables", "sensitive data", "secure defaults"]
relatedTopics: ["xss-sanitization", "auth-patterns", "csp-csrf"]
interviewQuestions:
  - id: "b16t4q1"
    level: "junior"
    question: "Як Angular захищає від поширених вразливостей OWASP Top 10 за замовчуванням?"
    referenceAnswers:
      junior: "Angular автоматично санітизує template bindings від XSS і надає DomSanitizer. Також є HttpClient для безпечних HTTP запитів."
      mid: "Angular secure defaults: 1) XSS prevention: template auto-sanitization, DomSanitizer, no innerHTML by default. 2) CSRF: HttpClientXsrfModule (cookie-to-header). 3) Clickjacking: треба X-Frame-Options у сервері. 4) Injection: Angular templates не виконують arbitrary code — compile-time safe. 5) Outdated components: `npm audit`, Dependabot, Angular migrations. 6) Security misconfiguration: Angular не expose server details але server потрібно налаштувати. 7) Angular не захищає від усіх OWASP Top 10 — серверна частина завжди потрібна."
      senior: "OWASP Top 10 у Angular контексті: 1) A01 Broken Access Control: route guards (UX), server-side authorization (security). Angular guards — не security boundary. 2) A02 Cryptographic Failures: не зберігати sensitive data у localStorage/sessionStorage без encryption. HTTPS завжди. 3) A03 Injection: Angular templates compile до TypeScript functions — SQL/command injection не можливий через templates. Але API може бути вразлива. 4) A05 Security Misconfiguration: Angular environment files не мають секретів — client-side код publicly accessible. 5) A06 Vulnerable Components: npm audit + Dependabot. 6) A08 Software Integrity: subresource integrity (SRI) для CDN resources. `<script integrity='sha384-...' crossorigin='anonymous'>`. 7) A09 Logging: Angular does not log — server-side logging critical."
      staff: "OWASP Angular security assessment: 1) Threat modeling: для кожної Angular feature — які дані обробляються? Хто має доступ? Які APIs викликаються? 2) A04 Insecure Design: Angular архітектура може бути insecure — over-permissive route guards, missing server validation. 3) A07 Identification and Authentication: JWT handling, session management, password policies. 4) Security controls matrix: для кожного OWASP item — Angular built-in defense + server-side defense + additional measures. 5) OWASP Angular Security Cheat Sheet: конкретні Angular recommendations. 6) Security by design: DI для security services (не global singletons), immutable patterns, TypeScript strict mode. 7) Regular security training: OWASP TOP 10 awareness для frontend developers. 8) Penetration testing scope: Angular-specific tests (DOM-based XSS, client-side logic bypass, JWT manipulation)."
    commonMistakes:
      - "Думають route guards = security boundary (це лише UX)"
      - "Sensitive data у Angular environment files вважають захищеними"
      - "Покладаються лише на Angular без server-side security"
    relatedQuestions: ["b16t4q2", "b16t4q3"]
  - id: "b16t4q2"
    level: "mid"
    question: "Як захистити Angular додаток від supply chain атак через npm залежності?"
    referenceAnswers:
      junior: "Регулярно запускати npm audit і оновлювати залежності. Використовувати Dependabot або Snyk."
      mid: "`npm audit`: виводить vulnerability level (critical/high/medium/low), CVE ids, affected package. `npm audit fix`: автоматично fix де можливо. `npm audit fix --force`: breaking changes (обережно). Snyk: глибший аналіз, прямі та транзитивні deps. Dependabot (GitHub): автоматичні PR для outdated/vulnerable deps. lockfileVersion у package-lock.json: `npm ci` (не `npm install`) у CI — точні версії. Subresource Integrity (SRI) для CDN resources."
      senior: "Supply chain security у depth: 1) `package-lock.json` integrity: файл містить SHA-512 checksums кожного пакету. `npm ci` верифікує checksums. 2) `npm audit --audit-level=high`: fail CI якщо high/critical vulnerabilities. 3) Snyk vs npm audit: npm audit uses npm registry advisories. Snyk має власну vulnerability database, більше precision. 4) `.npmrc` з private registry: `registry=https://registry.npmjs.org` — зафіксувати registry. 5) `engines` field у package.json: зафіксувати Node.js version. 6) Dependabot config `.github/dependabot.yml`: `package-ecosystem: npm`, `schedule.interval: weekly`. Auto-merge для patch updates. 7) Typosquatting prevention: `npm install` з exact package names. 8) Malicious packages: SolarWinds-like attack через compromised maintainer. Рішення: `--ignore-scripts` в CI (prevents postinstall scripts від npm packages). Але: Angular `@angular/cli` і деякі packages потребують scripts."
      staff: "Enterprise supply chain security: 1) Private npm registry (Artifactory, Nexus, Verdaccio): mirror public packages, security scan before promotion. Developers install from internal mirror. 2) Allowed-list policy: лише approved packages у private registry. New package → security review process. 3) Dependency lockdown: `npm ci` + git-tracked package-lock.json. No `npm install` у CI. 4) Automated vulnerability response SLA: Critical → 24h fix/mitigate. High → 1 week. Medium → 1 month. 5) SBOM (Software Bill of Materials): `cyclonedx-npm` або `syft` — генерує SBOM у JSON/XML. Required для compliance (EU Cyber Resilience Act, NIST). 6) Monorepo deps management: Nx + `@nx/dependency-checks` — verifiable deps у project.json. 7) Runtime monitoring: `socket.dev` — monitor published packages для suspicious activity. 8) Third-party Angular libraries: перед adoption — check maintenance status, last release, npm audit, GitHub security advisories. 9) `npm audit` у Angular context: `ng update` оновлює Angular packages і peer deps — запускати audit після."
    commonMistakes:
      - "`npm install` у CI замість `npm ci` — non-reproducible builds"
      - "Ігнорують transitive vulnerability (dep of dep) — можна бути vulnerable без прямої залежності"
      - "Не фіксують Node.js version у CI — consistency issues"
    relatedQuestions: ["b16t4q1", "b16t4q3"]
  - id: "b16t4q3"
    level: "mid"
    question: "Як безпечно працювати з environment variables та секретними даними в Angular?"
    referenceAnswers:
      junior: "Секрети не повинні бути у Angular коді бо він відправляється до браузера. API ключі тримати на сервері."
      mid: "Angular `environment.ts` файли: компілюються у JavaScript bundle — ПУБЛІЧНО ДОСТУПНІ. Не зберігати: API secrets, private keys, database credentials. Angular environment: configuration values що safe to expose (API URL, feature flags, analytics ID). Секрети на сервері: environment variables на Node.js/backend. Angular → Backend → External service (backend proxy pattern). `sourceMap: false` у production — не expose source code. `buildOptimizer: true` — minification."
      senior: "Angular environment security: 1) `environment.prod.ts` у bundle: мінімізований але не encrypted. `strings main.js | grep API_KEY` — будь-хто може знайти. 2) Safe in environment: API base URLs, feature flags, Google Analytics ID (не secret), app version, release stage. 3) Unsafe in environment: third-party API keys (Stripe, Sendgrid), database connection strings, signing secrets. 4) Backend proxy: Angular → own backend → external service. Backend тримає third-party secrets. 5) Runtime configuration: замість compile-time `environment.ts` — завантажити `/assets/config.json` або `/api/config` під час bootstrap через `APP_INITIALIZER`. Дозволяє зміну конфіга без rebuild. 6) `sourceMap: false` у production angular.json — source maps expose original TypeScript. Або: upload source maps до Sentry (error tracking) але не serve publicly. 7) Angular `fileReplacements`: різні configs для dev/staging/prod через `angular.json`."
      staff: "Environment security at enterprise: 1) Infrastructure-as-Code (IaC): secrets у Vault (HashiCorp), AWS Secrets Manager, Azure Key Vault. Backend fetches at startup. 2) Angular compile-time config security review: CI job що перевіряє `environment.prod.ts` — чи немає regex для відомих secret patterns (API keys, connection strings). 3) `.env` файли: ніколи у git (`.gitignore`). `.env.example` для template. 4) Runtime config pattern: `APP_INITIALIZER → http.get('/api/config') → inject via InjectionToken`. Config може бути user-specific (feature flags per tenant). 5) Source maps strategy: generate у CI, upload до Sentry/Datadog, delete before deploy. Angular build `sourceMap: true` + `hiddenSourceMap: true` (не serve, але generate для error tracking). 6) Secret scanning в CI: `gitleaks`, `truffleHog` — scan commits для accidental secret exposure. 7) Defense in depth: навіть якщо Angular bundle exposed — backend validates all requests. Client-side config exposure = inconvenience, not catastrophe якщо server-side secure."
    commonMistakes:
      - "API keys у `environment.ts` — publicly accessible у bundle"
      - "Source maps у production — expose TypeScript source"
      - "Думають minification = obfuscation → secrets hidden"
    relatedQuestions: ["b16t4q2", "b16t4q4"]
  - id: "b16t4q4"
    level: "senior"
    question: "Що таке prototype pollution і як захистити Angular додаток?"
    referenceAnswers:
      junior: "Prototype pollution — атака де зловмисник модифікує Object.prototype і впливає на поведінку всього JS."
      mid: "Prototype pollution: `obj['__proto__']['isAdmin'] = true` → всі об'єкти тепер мають `isAdmin: true`. У Angular: якщо API response merge у JS object без sanitization → pollution. Захист: `JSON.parse(JSON.stringify(data))` видаляє __proto__. `Object.create(null)` — об'єкт без prototype. Або перевіряти ключі при merge: `if (key === '__proto__' || key === 'constructor') skip`. Бібліотеки `lodash.merge` до v4.17.12 були вразливі."
      senior: "Prototype pollution у Angular context: 1) Вектори: deep merge of API response, `lodash.merge` (оновити!), `jQuery.extend` з deep option. 2) Angular HTTP: `HttpClient.get<T>()` → `JSON.parse()` → plain object — `JSON.parse` сам по собі safe (не assign до existing obj). Але: custom merge, spread operator з untrusted keys. 3) Detection: `({}).isAdmin === undefined` → після pollution → `({}).isAdmin === true`. 4) Захист: оновлені версії lodash/merge libs. `Object.freeze(Object.prototype)` у dev (помічає violations). Custom JSON reviver що reject __proto__/constructor. 5) Angular DI: injection tokens не можуть бути polluted через Object.prototype (TypeScript types + runtime checks). 6) eval() dangers: ніколи `eval(userInput)`. Angular templates НЕ використовують eval (Ivy compiler generates TypeScript functions). 7) `new Function()` — теж eval-like, уникати."
      staff: "Prototype pollution у enterprise Angular: 1) Threat vector assessment: перевірити всі місця де відбувається deep merge або object spreading від external data. 2) `json-schema` validation: validate API responses проти schema перед use — malformed keys rejected. 3) Typescript strict null checks + type narrowing: TypeScript не запобігає prototype pollution runtime, але explicit typing зменшує accidental exploitation. 4) CSP + sandbox: якщо prototype pollution веде до code execution (XSS gadget) → CSP блокує. 5) Security testing: спеціалізовані тести у Jest/Cypress що verify об'єкти не polluted після API response processing. 6) Angular library audit: кожна third-party Angular lib може мати prototype pollution via dependencies. `npm audit` + Snyk catches known CVEs. 7) Runtime protection: `Object.freeze(Object.prototype)` у dev mode, `Object.seal(Object.prototype)` у production? Небезпечно — може ламати third-party libs. 8) Freeze важливих objects: security-critical singletons (AuthService) — freeze у production debug mode."
    commonMistakes:
      - "Думають TypeScript типи захищають від runtime prototype pollution"
      - "Стара версія lodash — lodash.merge вразлива до v4.17.12"
      - "eval() для dynamic functionality — ніколи з user input"
    relatedQuestions: ["b16t4q3", "b16t4q5"]
  - id: "b16t4q5"
    level: "staff"
    question: "Як побудувати Security Development Lifecycle (SDL) для Angular команди?"
    referenceAnswers:
      junior: "Регулярно робити code review з акцентом на безпеку, проводити npm audit, навчати розробників OWASP."
      mid: "SDL включає: security requirements, threat modeling, secure code review, SAST (static analysis), DAST (dynamic testing), dependency scanning, penetration testing, security training. Для Angular: Angular security checklist у code review, ESLint security plugins, npm audit у CI, OWASP ZAP для DAST."
      senior: "Angular SDL implementation: 1) Requirements: security user stories для кожної feature (auth, access control). 2) Design: threat modeling, architecture review з security lens. 3) Coding: ESLint rules для Angular security anti-patterns. 4) SAST: Semgrep або SonarQube з Angular-specific rules (bypassSecurityTrust, unsafe eval, etc.). 5) Dependency: npm audit + Snyk у CI. 6) Testing: security-focused test cases у unit і e2e. 7) DAST: OWASP ZAP або Burp Suite проти staging. 8) Pentest: quarterly third-party. 9) Monitoring: CSP violations, error rates, suspicious patterns. 10) Incident response: documented playbook."
      staff: "Enterprise Angular SDL program: 1) Security champion model: один developer per team trained у secure coding → first reviewer для security-sensitive PRs. 2) Threat modeling у sprint planning: для features що обробляють sensitive data або змінюють access control. STRIDE methodology: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege. 3) Security gates у CI: SAST scan → fail on high severity. npm audit → fail on critical. Header check → fail if missing required headers. 4) Developer security training: annual OWASP training + Angular-specific security workshop. Simulation: controlled XSS/CSRF exercises у sandbox. 5) Bug bounty program: якщо public product — HackerOne або Bugcrowd. Responsible disclosure policy. 6) Security metrics: mean time to remediate (MTTR) for security issues per severity. Track trend. 7) Regulatory compliance: GDPR → data minimization у Angular (не зберігати зайве у state). HIPAA → additional logging, encryption. 8) Supply chain governance: approved package list, private registry, SBOM generation. 9) Post-incident: security blameless postmortem → systemic fixes, not individual blame. 10) Security debt: track у backlog, prioritize як technical debt."
    commonMistakes:
      - "Security як one-time audit замість continuous process"
      - "Тільки один security reviewer замість security champion model"
      - "DAST лише перед release, не регулярно"
    relatedQuestions: ["b16t4q4", "b16t1q5"]
---

## Core Concept

**English definition:** Secure coding practices in Angular encompass OWASP-aligned vulnerability prevention, dependency supply chain security, proper handling of sensitive configuration data, prototype pollution defense, and an organization-wide Security Development Lifecycle integrated into CI/CD pipelines.

**Пояснення:** Безпечне програмування — це не список правил що виконуються раз при аудиті, а культура і процес. Для Angular розробника це означає: знати що Angular захищає автоматично (template XSS) і де відповідальність на тебе (environment secrets, deps, prototype pollution). OWASP Top 10 — не абстракція, а конкретні вектори з конкретними Angular-specific проявами.

**Яку проблему вирішує:** Більшість security breaches — не нульові дні, а відомі вразливості. Outdated dependency з CVE, API key у git history, debug eval() що залишили у production, sensitive data у localStorage — це реальні інциденти. Secure coding практики запобігають систематичним помилкам через automated gates (audit, SAST) і developer education.

**Як працює під капотом:** `npm audit`: npm registry advisories database → порівнює версії залежностей (прямі і транзитивні) з advisory list → vulnerability report. `package-lock.json`: кожен пакет SHA-512 checksum → `npm ci` верифікує checksums — man-in-the-middle або tampered registry detection. SAST (Semgrep/SonarQube): абстрактне синтаксичне дерево (AST) аналіз TypeScript коду → pattern matching для known vulnerability patterns (`bypassSecurityTrustHtml`, `eval(`, `innerHTML =`). Prototype pollution: JavaScript prototype chain — `{}.__proto__ === Object.prototype` → modification поширюється на всі objects.

**Trade-offs та обмеження:** Security і developer experience (DX) у постійній напрузі: кожна security check у CI = більший pipeline. Security training = час. Dependency lockdown = upgrade lag. Але cost of breach >> cost of security investment. Angular TypeScript strict mode (`"strict": true`) зменшує surface area але не security silver bullet.

**Версійність:** `npm audit` — npm v6+ (2018). `npm ci` (clean install) — npm v6+. Angular `fileReplacements` для environment configs — Angular 6+. `sourceMap: false` у production recommended — завжди. Angular CLI security features — постійно evolve. Snyk CLI integration з Angular CLI — через `ng add snyk`.

## Deep Details

### Edge Cases

**`npm audit fix --force`:** Автоматичний fix з breaking changes. Може оновити indirect dependency до incompatible version → app ломається. Завжди review `--force` changes і запускати тести після.

**Angular environment у monorepo:** В Nx workspace `environment.ts` може посилатися на shared constants. Якщо shared lib exports security-sensitive constants → вони теж у bundle. Audit shared libs.

**Prototype pollution через REST API response:** `JSON.parse(response)` сам по собі safe. Але `Object.assign(existingObj, parsedResponse)` або `_.merge(target, parsedResponse)` → pollution якщо response містить `__proto__`. Перевіряти де API response merge у існуючі objects.

**eval() у templates:** Angular Ivy templates НЕ використовують `eval()`. Але третя-party pipes або directives можуть. Custom sanitization через `new Function()` — теж eval-like. Angular compiler виводить попередження для потенційно небезпечних patterns.

### Junior vs Senior Understanding

**Junior** знає що `npm audit` знаходить вразливості і секрети не мають бути у коді.

**Senior** розуміє: 1) Supply chain attack vectors (typosquatting, compromised maintainer, transitive deps). 2) `npm ci` vs `npm install` у CI context. 3) Private npm registry як supply chain mitigation. 4) Prototype pollution mechanics і конкретні Angular vectors (lodash.merge, deep spread). 5) Runtime config pattern (`APP_INITIALIZER`) vs compile-time `environment.ts`. 6) SBOM генерація і compliance requirements. 7) SDL integration у sprint workflow (threat modeling, security champions).

### Deprecation & Migration Path

**`ng build --prod`:** Замінено на `ng build --configuration=production` (Angular 12+). Production config автоматично встановлює `optimization: true`, `sourceMap: false`, `buildOptimizer: true`. **Angular Protractor:** Deprecated у favor of Cypress/Playwright — security testing у e2e тестах потрібно переносити. **`HttpClientModule`:** Замінюється на `provideHttpClient()` у standalone. `HttpClientXsrfModule` → `withXsrfConfiguration()`. **`@angular/core/testing` JIT компіляція:** У строгих security environments, JIT disabled (compile-time security). AOT (Ahead-of-Time) — default і рекомендований.

### Connections to Other Concepts

- **XSS Sanitization (Block 16, Topic 1):** OWASP A03 Injection включає XSS.
- **Auth Patterns (Block 16, Topic 2):** OWASP A01/A07 Broken Access Control/Auth.
- **CSP & CSRF (Block 16, Topic 3):** OWASP A05 Security Misconfiguration includes headers.

## Examples

### Basic Usage

```bash
# npm audit — check for vulnerabilities
npm audit
# Output: found 3 vulnerabilities (1 high, 2 moderate)

# Fail CI якщо high або critical
npm audit --audit-level=high

# Автоматичний fix (безпечний)
npm audit fix

# Snyk (більш comprehensive)
npx snyk test
npx snyk monitor  # continuous monitoring

# npm ci у CI (не npm install)
npm ci  # відтворює точні версії з package-lock.json
```

```typescript
// ✅ Runtime configuration (не compile-time secrets)
// Безпечний патерн: config завантажується з backend

import { APP_INITIALIZER, InjectionToken, Provider } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export interface AppConfig {
  apiUrl: string;
  featureFlags: Record<string, boolean>;
  version: string;
  // НЕ включати: apiSecrets, dbPasswords, etc.
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export function provideAppConfig(): Provider[] {
  return [
    {
      provide: APP_INITIALIZER,
      useFactory: (http: HttpClient, config: Partial<AppConfig>) => {
        return () =>
          http.get<AppConfig>('/api/config').pipe(
            tap(c => Object.assign(config, c))
          ).toPromise();
      },
      deps: [HttpClient, APP_CONFIG],
      multi: true,
    },
    {
      provide: APP_CONFIG,
      useValue: {} as AppConfig,
    },
  ];
}

// environment.ts — ЛИШЕ non-sensitive config
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000', // OK — public URL
  // analyticsId: 'UA-123' — OK, public analytics
  // ❌ НЕ тут: stripeSecretKey, sendgridApiKey, jwtSecret
};
```

### Production Scenario

```typescript
// SAST ESLint custom rule для Angular security
// .eslintrc.json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.property.name='bypassSecurityTrustHtml']",
        "message": "bypassSecurityTrustHtml requires security review and DOMPurify sanitization first"
      },
      {
        "selector": "CallExpression[callee.name='eval']",
        "message": "eval() is forbidden - use alternatives"
      },
      {
        "selector": "MemberExpression[property.name='innerHTML'][object.property.name='nativeElement']",
        "message": "Direct innerHTML assignment bypasses Angular sanitization - use [innerHTML] binding"
      }
    ]
  }
}

// Prototype pollution defense
// utils/safe-merge.ts
function isSafeKey(key: string): boolean {
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  return !dangerous.includes(key);
}

export function safeMerge<T extends object>(target: T, source: Partial<T>): T {
  for (const key of Object.keys(source)) {
    if (isSafeKey(key)) {
      (target as Record<string, unknown>)[key] = (source as Record<string, unknown>)[key];
    }
  }
  return target;
}

// JSON reviver that blocks prototype pollution
export function safeJsonParse<T>(json: string): T {
  return JSON.parse(json, (key, value) => {
    if (key === '__proto__' || key === 'constructor') {
      return undefined; // Drop dangerous keys
    }
    return value;
  });
}

// CI security pipeline
// .github/workflows/security.yml
// - name: npm audit
//   run: npm audit --audit-level=high
// - name: Snyk vulnerability scan
//   run: npx snyk test --severity-threshold=high
// - name: Secret scanning
//   run: npx gitleaks detect --source .
// - name: SAST
//   run: npx semgrep --config=p/angular scan src/
// - name: Security headers check
//   run: node scripts/check-security-headers.js
```

### Anti-Example

```typescript
// ❌ API ключ у environment.ts — visible у bundle
export const environment = {
  production: true,
  stripePublishableKey: 'pk_live_...',   // OK — publishable key (intentionally public)
  stripeSecretKey: 'sk_live_...',         // ❌ КРИТИЧНО — secret key у клієнтському bundle!
  sendgridApiKey: 'SG.xxxxx',             // ❌ third-party API secret
  jwtSecret: 'my-super-secret',           // ❌ signing secret
};

// ❌ eval() для dynamic functionality
@Pipe({ name: 'evaluate', standalone: true })
export class EvaluatePipe implements PipeTransform {
  transform(expression: string): unknown {
    // ❌ eval з будь-яким рядком = arbitrary code execution
    return eval(expression);
    // Навіть 'trusted' expressions можуть бути hijacked через prototype pollution
  }
}

// ❌ npm install у CI (не npm ci)
// Dockerfile:
// RUN npm install  ← non-reproducible, ignores package-lock.json
// Правильно: RUN npm ci

// ❌ package-lock.json у .gitignore
// .gitignore: package-lock.json
// Без lockfile: npm install може встановити різні версії
// → підвищений ризик supply chain attack (newer version може бути compromised)
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Secrets (API keys, JWT signing keys) у `environment.ts` | Клієнтський код публічно доступний — будь-хто може знайти secrets у bundle | Secrets на сервері (env vars, Vault). Angular env — тільки public config |
| `npm install` у CI замість `npm ci` | Не відтворювальні builds; ігнорує package-lock.json; потенційно встановлює compromised newer versions | `npm ci` — строго з package-lock.json checksums |
| Стара версія lodash (< 4.17.12) без update | Prototype pollution CVE — deep merge з untrusted data = Object.prototype pollution | `npm audit fix`, оновити lodash; використовувати `safeMerge` для untrusted data |
| Route guards як єдиний security boundary | Guards — client-side UX, не security. Будь-хто може обійти client-side guard | Guards + обов'язкова server-side authorization для кожного endpoint |
| Source maps у production | Expose оригінальний TypeScript код, бізнес логіку, потенційно security details | `sourceMap: false` у production. Або generate + upload до Sentry + delete before deploy |

## Interview Block

### [L1 — Warm-up] Як Angular захищає від OWASP Top 10 за замовчуванням?

**Signal being tested:** Розуміння що Angular надає і де gaps, особливо що route guards — не security boundary.

**What the interviewer expects:** Template XSS prevention, CSRF через HttpClientXsrfModule. Але: guards = UX, сервер обов'язковий. Secrets не у env.

**How to probe deeper:** "Якщо Angular route guard блокує неавторизований доступ — чи достатньо цього?"

**Reference answer:** Angular auto-sanitize templates (XSS), CSRF через double-submit cookie. Але: route guards = UX layer, сервер завжди перевіряє authorization. A06 Vulnerable Components: npm audit + Dependabot. A05 Security Misconfiguration: security headers у сервері, не Angular. Secrets у environment.ts — публічно доступні.

**Common mistakes:** "Guard достатній для security." "Environment.ts захищений."

---

### [L2 — Mid] Як захистити Angular від supply chain атак через npm?

**Signal being tested:** Практичне розуміння supply chain attack vectors і mitigation strategies.

**What the interviewer expects:** npm audit, npm ci (не npm install), Snyk, Dependabot, package-lock.json у git.

**How to probe deeper:** "Dependabot оновив transitive dependency без твого відома. Як це виявити і запобігти?"

**Reference answer:** `npm ci` верифікує SHA-512 checksums з package-lock.json. `npm audit --audit-level=high` у CI — fail при critical/high CVE. Snyk для глибший transitive analysis. Dependabot: автоматичні PR + CI tests. Private registry (Artifactory) як additional gate. Transitive updates видно у `git diff package-lock.json`.

**Common mistakes:** `npm install` у CI — ігнорує lockfile. package-lock.json у .gitignore. Ігнорують transitive vulnerabilities.

---

### [L3 — Senior] Як безпечно працювати з environment config і де межа між public і secret?

**Signal being tested:** Розуміння що client-side code is public, і runtime config pattern як альтернатива.

**What the interviewer expects:** environment.ts = bundle = public. Runtime config via APP_INITIALIZER. Source maps у production.

**How to probe deeper:** "Stripe API key потрібен у Angular компоненті для payment form. Як правильно?"

**Reference answer:** `environment.ts` компілюється у bundle — буквально публічно доступний через DevTools. Stripe publishable key (`pk_`) — OK у env, intentionally public. Secret key (`sk_`) — ніколи у Angular, тільки backend. Pattern: Angular → власний backend → Stripe API. Secrets у backend env vars або Vault. Runtime config: `APP_INITIALIZER → GET /api/config` — backend повертає лише safe-to-expose values. Source maps: `sourceMap: false` у production або upload to Sentry + delete.

**Common mistakes:** `sk_live_` у environment.ts. Minification = obfuscation (ні).

---

### [L4 — Staff/Principal] Як побудувати Security Development Lifecycle для Angular команди?

**Signal being tested:** Системне мислення про continuous security process, organizational impact і automation.

**What the interviewer expects:** Security champions, threat modeling, automated gates у CI, training, incident response.

**How to probe deeper:** "Команда 20 Angular розробників, quarterly pentest, але security issues продовжують з'являтись. Що системно змінити?"

**Reference answer:** Security champion model: один trained developer per feature team → first security reviewer. Automated CI gates: SAST (Semgrep), npm audit, secret scanning (gitleaks), header check — fail на violations. Threat modeling у sprint planning для security-sensitive features. Annual OWASP training + controlled XSS exercises. Bug tracking: security severity SLA (Critical 24h, High 1w). SBOM generation. Post-incident blameless postmortem → systemic fixes.

**Common mistakes:** Security як one-time audit. Тільки один security person для всієї org. DAST тільки pre-release.

## Summary

### Key Points

- Angular route guards = UX layer, не security boundary; server-side authorization завжди required
- `environment.ts` компілюється у публічний JS bundle — тільки non-sensitive config (URLs, feature flags)
- `npm ci` (не `npm install`) у CI — відтворювальні builds з SHA-512 verification
- `npm audit --audit-level=high` у CI + Snyk + Dependabot — three-layer supply chain defense
- Prototype pollution: `__proto__` injection через untrusted deep merge — `safeMerge()` utility або updated lodash
- Runtime config pattern: `APP_INITIALIZER → GET /api/config` — flex config без rebuild і без secrets у bundle
- SDL: security champions + automated CI gates + threat modeling + DAST = continuous security, not periodic audit

### Elevator Pitch (2 minutes)

Secure coding у Angular — це systematic підхід, не чек-ліст раз на рік. Ключові правила: environment.ts = public bundle, секрети — тільки на сервері або у runtime config через APP_INITIALIZER. Supply chain: `npm ci` (lockfile checksum verification) + `npm audit --audit-level=high` у CI + Snyk для transitive deps + Dependabot для автоматичних PR. Route guards — UX, не security: завжди server-side authorization. Prototype pollution: `safeMerge()` для untrusted deep merge, оновлений lodash. SDL integration: security champion model (один trained dev per team), automated SAST gates (Semgrep), secret scanning (gitleaks), DAST (OWASP ZAP) проти staging. Результат: security issues caught автоматично до production, не після.
