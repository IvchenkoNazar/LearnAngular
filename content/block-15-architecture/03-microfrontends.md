---
title: "Micro-frontends with Angular"
block: 15
topic: 3
slug: "microfrontends"
difficulty: 5
sinceVersion: "2"
tags: ["Module Federation", "micro-frontend", "Webpack 5", "Angular Elements", "web components", "shell app", "remote"]
relatedTopics: ["project-structure", "monorepo-nx", "standalone-components", "lazy-loading"]
interviewQuestions:
  - level: "junior"
    question: "Що таке micro-frontend архітектура і в чому її основна ідея?"
    referenceAnswers:
      junior: "Micro-frontend — це підхід, де великий frontend додаток розбивається на менші незалежні частини, кожна з яких розробляється і деплоїться окремою командою."
      mid: "Micro-frontend переносить мікросервісний підхід на frontend: кожна команда owns весь vertical slice (UI + API + DB). MFE реалізується кількома способами: iframe (ізоляція, але погана UX), Web Components (Angular Elements), JavaScript integration (Module Federation — найпоширеніший у Angular). Shell app (host) завантажує remotes під час runtime. Переваги: незалежний деплой, ізольований tech stack, паралельна розробка."
      senior: "MFE trade-offs: 1) Переваги: команди деплоять незалежно без release coordination. Ізоляція failure — один remote падає, shell продовжує. Паралельна розробка без merge conflicts. 2) Недоліки: shared dependencies дублювання (або складний sharing config). Складніше testing (integration між remotes). Performance: кожен remote = додатковий HTTP request. Inconsistent UX якщо нема design system. State sharing між remotes складний. 3) Module Federation (MF) — Webpack 5 feature, найзріліший підхід. `@angular-architects/module-federation` — Angular-specific wrapper. 4) Corollary: MFE вирішує організаційну проблему, не технічну — якщо немає проблем з release coordination, MFE — over-engineering."
      staff: "MFE architectural decision: 1) Conway's Law application: якщо є кілька незалежних product teams з різними release cadences — MFE дозволяє кожній деплоїти незалежно. 2) Maturity model: монолітний Angular → Nx monorepo (більшість) → MFE (organizational need for independent deploys). 3) Module Federation vs iframes vs Web Components: MF — найкраща DX для Angular-to-Angular. Web Components/Angular Elements — для cross-framework. Iframes — максимальна ізоляція, мінімальна інтеграція. 4) Total cost: MFE додає infrastructure complexity (CDN для remotes, version coordination), testing complexity (contract testing), DX overhead (local dev з кількома apps). Окупається при 3+ незалежних командах з різними deploy cycles. 5) Runtime vs build-time integration: build-time (Nx monorepo) — safe, fast CI; runtime (MFE) — true independence але складніша coordination."
    commonMistakes:
      - "MFE як рішення для організаційних проблем де монорепо з Nx достатнє"
      - "Не розуміють різниці між build-time і runtime integration"
      - "Думають MFE автоматично вирішує performance проблеми"
    relatedQuestions: ["b15t3q2", "b15t3q3"]
  - level: "mid"
    question: "Як Module Federation працює у Webpack 5 і яка роль shell (host) та remote apps?"
    referenceAnswers:
      junior: "Shell app — головний додаток, remotes — окремі apps що завантажуються у shell. Module Federation дозволяє їм шерити код між собою."
      mid: "Module Federation (MF): Webpack 5 feature для динамічного завантаження модулів з інших webpack builds під час runtime. Shell (host): завантажує remoteEntry.js від кожного remote, lazy-loads remote modules через dynamic import. Remote: будується окремо, публікує `ModuleFederationPlugin` з `exposes` config — які модулі available для consumption. `shared` config: Angular framework версії шеряться — одна копія у браузері. `remoteEntry.js` — маніфест що описує exposed modules і shared deps."
      senior: "MF internals: 1) `remoteEntry.js`: generated файл що містить: module registry (які modules exposed), shared deps manifest (версії і availability). 2) Dynamic loading: `import('remote/Module')` → Webpack runtime → fetches remoteEntry.js → resolves shared deps → loads chunk. 3) Shared deps negotiation: host і remote декларують shared packages. Webpack runtime під час завантаження: якщо host вже має Angular 17.x і remote потребує Angular 17.x — використовується один примірник. Singleton: `{ singleton: true, strictVersion: true }` — якщо версії incompatible → runtime error (краще ніж silent duplicate). 4) `@angular-architects/module-federation` schema: `mfSchematic` + `webpack.config.js` wrapper. Angular CLI не підтримує MF нативно (esbuild не підтримує MF) — потрібен `@angular-builders/custom-webpack`. 5) Routing integration: `loadChildren: () => loadRemoteModule({ remoteName: 'orders', exposedModule: './OrdersModule' })`."
      staff: "Module Federation production concerns: 1) Version mismatch strategy: `requiredVersion: 'auto'` читає з package.json, `strictVersion: false` — fallback до local copy якщо remote має incompatible version. 2) Dynamic federation: замість статичного `remotes` конфіга — `manifest.json` що завантажується під час runtime. Shell не знає про remotes при build time. 3) Deployment: кожен remote деплоїться на CDN, shell отримує URLs через environment config або dynamic manifest. 4) Rollback: remote деплоїть breaking change → shell може pinned на old remote URL через manifest versioning. 5) esbuild/Vite і MF: Webpack MF + Angular 17 esbuild — несумісні. Рішення: vite-plugin-federation (experimental) або залишитись на webpack builder для MFE projects. 6) Angular 20+ roadmap: native MF support очікується через native ESM federation (без webpack dependency)."
    commonMistakes:
      - "Не налаштовують singleton для Angular і RxJS — дублювання пакетів, глобальний стан проблеми"
      - "Плутають remoteEntry.js (маніфест) і remote bundle (код)"
      - "Не розуміють що esbuild Angular CLI несумісний з Webpack Module Federation"
    relatedQuestions: ["b15t3q1", "b15t3q3"]
  - level: "senior"
    question: "Як шерити Angular dependencies між shell і remote apps у Module Federation, і що таке singleton mode?"
    referenceAnswers:
      junior: "У webpack.config.js є `shared` об'єкт де перераховуються залежності що шеряться між apps."
      mid: "`shared` config у `ModuleFederationPlugin`: `{ '@angular/core': { singleton: true, strictVersion: true, requiredVersion: 'auto' } }`. `singleton: true` — лише одна копія у браузері. `strictVersion: true` — runtime error якщо версії incompatible (краще ніж два примірники). `requiredVersion: 'auto'` — читає версію з package.json. Критично для Angular: два примірники `@angular/core` = catastrophic runtime errors (ApplicationRef дублювання, DI singleton порушення)."
      senior: "Shared deps стратегії: 1) All-in-one: шерити всі `@angular/*`, `rxjs`, `@ngrx/*`. Ризик: version incompatibility при незалежних updates. 2) Strict versioning: всі remotes мають однакові major.minor. Enforced через dependency management policies. 3) `strictVersion: false` + fallback: якщо remote не може знайти compatible shared version — fallback до bundled copy. Менш ефективно але graceful degradation. 4) Singleton з `shareAll()` helper від `@angular-architects/module-federation`: `shared: share({ ...shareAll({ strictVersion: true, singleton: true }), 'my-lib': { ... } })`. 5) Runtime negotiation: під час завантаження remote, MF runtime порівнює semver. `^17.0.0` сумісний з 17.1.0 але не з 18.0.0. 6) SharedModule vs lazy loading: якщо Angular сервіс у shared module — обидва remotes отримують один і той самий singleton. Але якщо service у lazy remote — він ізольований."
      staff: "Shared dependencies governance у enterprise MFE: 1) Centralized version policy: monorepo (Nx) + release train — всі apps оновлюються разом для major Angular updates. 2) Compatibility matrix: документувати яка версія remote сумісна з якою версією shell. Semantic versioning для remotes. 3) Canary deployments: поступово routing нових users до нової версії remote. Shell підтримує обидві versions через manifest. 4) Breaking change detection: contract tests між shell і remote — якщо remote змінює exposed interface → test fails → cannot deploy без shell update. 5) Dependency audit: periodic check що всі remotes на compatible versions. Automated через Renovate або Dependabot з custom grouping. 6) Performance impact: кожна shared dep яку MF не може share (version mismatch) = дублювання у bundle. Monitor через webpack-bundle-analyzer у CI."
    commonMistakes:
      - "requiredVersion без 'auto' — руками підтримувати версії і помилятися"
      - "Не шерять RxJS — два примірники ламають Subject crosscommunication"
      - "strictVersion: false скрізь — MF тихо завантажить дублікат без попередження"
    relatedQuestions: ["b15t3q2", "b15t3q4"]
  - level: "senior"
    question: "Як реалізувати Angular Elements для micro-frontend інтеграції і в яких сценаріях це кращий вибір ніж Module Federation?"
    referenceAnswers:
      junior: "Angular Elements перетворює Angular компоненти на Web Components що можна використовувати у будь-якому HTML чи іншому фреймворку."
      mid: "`@angular/elements` + `createCustomElement()`: Angular компонент → Custom Element (Web Component). `customElements.define('my-widget', MyAngularElement)`. Shell (React, Vue, або vanilla HTML) завантажує bundle і використовує `<my-widget attr='value'>`. Inputs стають attributes/properties, outputs стають CustomEvents. Lifecycle: `connectedCallback` → Angular bootstrap, `disconnectedCallback` → Angular destroy. Коли краще ніж MF: cross-framework teams (shell = React, remote = Angular), legacy HTML pages що поступово мігрують, мікро-widgets що embedded у third-party sites."
      senior: "Angular Elements internals: 1) `createCustomElement(Component, { injector })` — returns class що extends HTMLElement. 2) Zone.js: Angular element має власний Zone, ізольований від external environment. 3) Inputs: attribute change → `attributeChangedCallback` → property binding. 4) Outputs: EventEmitter → CustomEvent dispatch на host element. 5) Shadow DOM: опціонально через `encapsulation: ViewEncapsulation.ShadowDom` — повна CSS ізоляція. 6) Bundle: Angular Elements bundle включає Angular runtime. Якщо кілька елементів — можна bundle з external Angular (MF-style). 7) Lifecycle: `ngOnDestroy` mapped to `disconnectedCallback`. 8) SSR: Angular Elements не підтримує SSR нативно. 9) Standalone: Angular 14+ — standalone компонент як Element без NgModule. `createApplication()` замість platformBrowserDynamic для lazy bootstrap."
      staff: "Angular Elements у platform strategy: 1) Widget platform: централізований Angular Element registry. Інші teams publish Angular Elements як npm packages. Shell завантажує за потребою. 2) Cross-framework integration: поступова міграція з AngularJS або React → Angular через Elements. Legacy app використовує `<ng-element>` в HTML. 3) Size optimization: якщо кілька Elements з одного Angular app — один shared Angular runtime (через MF або separate bundle). 4) Versioning: Web Components стандарт — element API (attributes/properties/events) = public contract. Breaking changes потребують major version. 5) Testing: Angular Elements тестуються як звичайні Angular components + integration test через DOM API (setAttribute, dispatchEvent). 6) Limitation: складно передавати complex objects через attributes (тільки strings). Використовувати properties або JSON.parse. 7) Performance: кожен Element creates Angular application — якщо 10+ Elements на сторінці → 10+ DI injectors, важкий. Краще один host Angular app з кількома components замість багатьох Elements."
    commonMistakes:
      - "Передають складні об'єкти через HTML attributes замість JS properties"
      - "Не розуміють що кожен Angular Element = окремий Angular runtime (якщо без sharing)"
      - "Плутають Angular Elements (Web Components) і Module Federation (JS chunks)"
    relatedQuestions: ["b15t3q3", "b15t3q5"]
  - level: "staff"
    question: "Як організувати shared state між micro-frontend remotes і як вирішити проблему state isolation vs state sharing?"
    referenceAnswers:
      junior: "Можна використати localStorage або CustomEvents для комунікації між MFEs."
      mid: "State sharing options: 1) URL — universal, без залежності між remotes. 2) CustomEvents — `window.dispatchEvent(new CustomEvent('user-logged-in', { detail: user }))`. 3) Shared service у shell — singleton у host injector, remotes inject через `loadRemoteModule`. 4) Shared state lib (NgRx/Signals) у shared deps MF config — ризик якщо версії розходяться."
      senior: "State architecture у MFE: 1) URL state: route params, query params — universally accessible. 2) Event bus: CustomEvents або mitt (tiny event emitter). Shell broadcasts events, remotes subscribe. Loose coupling. 3) Shared singleton service: у MF shared config, shell надає service, remotes inject. Працює якщо всі Angular і версії сумісні. 4) BroadcastChannel API: cross-tab і cross-frame (в одному origin) communication. 5) NgRx Store у shell: remotes отримують store access через injection. Але coupling до NgRx. 6) Anti-pattern: shared global variables (window.state) — неконтрольовано, не type-safe. 7) State boundary: кожен remote має power state, shell має global state (auth, theme, locale). Remote не повинен читати іншого remote state напряму."
      staff: "State sharing governance: 1) State ownership model: кожен remote owns свій state. Shell owns cross-cutting state (auth, user profile, permissions, theme). 2) Contract: shell exposes state via well-defined API (injected service або CustomEvent protocol). Версіонований API — breaking change = shell major version. 3) Auth propagation: shell отримує JWT → передає до remotes через header injection або shared AuthService. 4) Real-time sync: якщо users-remote оновлює user profile — як orders-remote дізнається? Event bus + BroadcastChannel. 5) Testing state sharing: integration tests де shell і mock-remote тестуються разом. Contract tests (Pact) між shell API і remote expectations. 6) State isolation failure mode: remote не отримав state update → stale UI. Defensive: remotes re-fetch critical state при mount. 7) Eventual consistency mindset: MFE state не завжди globally consistent — design for resilience, not perfection."
    commonMistakes:
      - "Глобальний window.state — неконтрольований, type-unsafe, race conditions"
      - "Спроба шерити NgRx Store між різними Angular versions — runtime crash"
      - "Не визначають ownership boundaries для state — кожен remote може мутувати будь-який state"
    relatedQuestions: ["b15t3q4", "b15t3q2"]
---

## Core Concept

**English definition:** Micro-frontends (MFE) is an architectural approach that decomposes a web application into independently deployable vertical slices, each owned by a separate team, integrated at runtime using techniques like Module Federation, Web Components, or iframes.

**Пояснення:** Micro-frontends переносять принципи мікросервісів на frontend: замість одного monolithic Angular додатку — кілька незалежних apps що об'єднуються у shell під час runtime. Кожна команда деплоїть свій frontend незалежно, без release coordination з іншими. Ключові слова: "незалежний деплой" — це головна і часто єдина причина обирати MFE.

**Яку проблему вирішує:** Коли кілька команд паралельно розробляють великий frontend, вони стикаються з: merge conflicts у shared code, необхідністю координувати release dates, довгими CI pipelines для всього monorepo. MFE дає кожній команді повний контроль над своїм vertical slice — від UI до API до deploy pipeline.

**Як працює під капотом:** Module Federation (Webpack 5): кожен remote app будується webpack з `ModuleFederationPlugin`. При build: webpack генерує `remoteEntry.js` — JSON маніфест що описує exposed modules і shared deps. Shell під час runtime: `import('http://remote-url/remoteEntry.js')` → Webpack runtime парсить маніфест → negotiates shared deps (яка версія Angular вже завантажена) → lazy-loads тільки унікальний код remote. Shared singleton deps завантажуються лише один раз. Angular Elements: `createCustomElement()` обертає Angular component у HTMLElement subclass → `customElements.define()` реєструє у browser Custom Element registry → будь-який HTML може використовувати `<my-element>`.

**Trade-offs та обмеження:** MFE суттєво підвищує infrastructure і operational complexity: CDN для кожного remote, version coordination, integration testing між remotes, local dev setup (кілька apps одночасно). Performance: кожен remote = окремий HTTP request для remoteEntry.js + code chunks. Shared deps не завжди share ідеально (version mismatches). State sharing між remotes — non-trivial. **Важливо:** MFE вирішує organizational/deployment проблему, не технічну. Nx monorepo часто достатній.

**Версійність:** Module Federation — Webpack 5 (2020). `@angular-architects/module-federation` — популярна Angular wrapper library (Manfred Steyer), з 2020. Angular CLI з esbuild (v17) — несумісний з Webpack MF: потрібен `@angular-builders/custom-webpack`. `@angular/elements` — Angular 6 (2018). Standalone Angular Elements без NgModule — Angular 14+. Dynamic federation (runtime manifest) — `@angular-architects/module-federation` v14+.

## Deep Details

### Edge Cases

**esbuild несумісність:** Angular 17+ default builder — esbuild. Webpack Module Federation потребує webpack builder. Для MFE проектів: `"builder": "@angular-builders/custom-webpack:browser"` у project.json. Це означає втрату esbuild performance переваг.

**Version mismatch runtime errors:** Якщо shell має Angular 17.0.0 і remote має Angular 17.2.0 з `strictVersion: true` — або обидва singleton (один примірник 17.2.0 для обох), або runtime error якщо strict range не покривається. Два примірники `@angular/core` = `NullInjectorError`, `ApplicationRef` конфлікти, CD не спрацьовує.

**Dynamic imports і TypeScript:** `import('orders/OrdersModule')` — TypeScript не знає тип. Потрібні type declarations або `@ts-ignore`. `loadRemoteModule()` від `@angular-architects/module-federation` має кращий typing.

**Zone.js у MFE:** Якщо shell і remote обидва завантажують Zone.js (не singleton) — Zone патчить одні і ті самі globals двічі. Завжди: `{ '@angular/core': { singleton: true }, 'zone.js': { singleton: true } }`.

### Junior vs Senior Understanding

**Junior** знає концепцію MFE і що Module Federation дозволяє "шерити код між apps".

**Senior** розуміє: 1) Webpack 5 MF runtime mechanics — remoteEntry.js маніфест, shared deps negotiation алгоритм. 2) Singleton mode критичність для Angular. 3) Несумісність з esbuild і наслідки. 4) Чому MFE — organizational рішення, і коли Nx monorepo достатній. 5) Dynamic federation для runtime-configurable remotes. 6) State sharing patterns і їх trade-offs. 7) Angular Elements як cross-framework alternative.

### Deprecation & Migration Path

**`platformBrowserDynamic` для Angular Elements:** Deprecated на користь `createApplication()` (Angular 14+) для bootstrap Elements без NgModule. **Class-based NgModule MFE:** Замінюється на standalone components з `loadRemoteModule`. **Static federation конфіг:** Замінюється на dynamic manifest approach для production flexibility. **`@angular-architects/module-federation` v1-13:** Breaking changes у v14+ для dynamic federation API. `loadRemoteModule({ type: 'manifest', remoteName })` замість legacy config.

### Connections to Other Concepts

- **Nx Monorepo (Block 15, Topic 2):** `@nx/angular:module-federation-*` generators. Nx + MF = best practices combination.
- **Project Structure (Block 15, Topic 1):** MFE = extreme version of feature boundaries.
- **Lazy Loading (Block 6):** MFE lazy loading через Module Federation vs Angular Router lazy loading.
- **Angular Elements (Block 2):** createCustomElement() internals.

## Examples

### Basic Usage

```typescript
// webpack.config.js для Shell (Host) app
const { withModuleFederationPlugin, share, shareAll } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  remotes: {
    // Static federation: URLs відомі при build
    'orders': 'orders@http://localhost:4201/remoteEntry.js',
    'products': 'products@http://localhost:4202/remoteEntry.js',
  },
  shared: share({
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  }),
});

// webpack.config.js для Remote (orders) app
module.exports = withModuleFederationPlugin({
  name: 'orders',
  exposes: {
    // './OrdersRoutes' — це ім'я, що shell використовує для import
    './OrdersRoutes': './src/app/orders/orders.routes.ts',
  },
  shared: share({
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  }),
});

// Shell: app.routes.ts — завантаження remote через routing
import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'orders',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: 'http://localhost:4201/remoteEntry.js',
        exposedModule: './OrdersRoutes',
      }).then(m => m.ORDERS_ROUTES),
  },
];
```

### Production Scenario

```typescript
// Dynamic federation: shell не знає remote URLs при build
// assets/mf.manifest.json — завантажується під час runtime
// {
//   "orders": "https://orders.myapp.com/remoteEntry.js",
//   "products": "https://products.myapp.com/remoteEntry.js"
// }

// main.ts — завантажити маніфест ПЕРЕД bootstrap
import { initFederation } from '@angular-architects/module-federation';

initFederation('/assets/mf.manifest.json')
  .catch(err => console.error(err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error(err));

// bootstrap.ts — окремий файл (потрібен для dynamic import)
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));

// app.routes.ts — dynamic federation через manifest
import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'orders',
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',           // використати маніфест
        remoteName: 'orders',       // ключ у manifest.json
        exposedModule: './OrdersRoutes',
      }).then(m => m.ORDERS_ROUTES),
  },
];

// Angular Elements — standalone component як Custom Element
// Angular 14+ standalone approach
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { UserProfileComponent } from './user-profile.component';

(async () => {
  const app = await createApplication({
    providers: [
      // providers тут
    ],
  });

  const UserProfileElement = createCustomElement(UserProfileComponent, {
    injector: app.injector,
  });

  customElements.define('user-profile-widget', UserProfileElement);
})();

// user-profile.component.ts — standalone Angular Element
import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  // Shadow DOM для CSS ізоляції
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="profile">
      <h2>{{ name }}</h2>
      <button (click)="editClicked.emit(userId)">Edit</button>
    </div>
  `,
})
export class UserProfileComponent {
  @Input() name = '';
  @Input() userId = '';
  @Output() editClicked = new EventEmitter<string>();
  // Output → CustomEvent на host element
}

// Використання в non-Angular контексті:
// <user-profile-widget name="John Doe" user-id="123"></user-profile-widget>
// element.addEventListener('editClicked', e => console.log(e.detail));
```

### Anti-Example

```typescript
// ПОГАНО: Два примірники Angular через відсутній singleton config
// webpack.config.js (shell)
module.exports = withModuleFederationPlugin({
  remotes: { orders: 'orders@http://localhost:4201/remoteEntry.js' },
  shared: {
    // ❌ Без singleton: true і strictVersion
    '@angular/core': { requiredVersion: 'auto' },
  },
});
// Результат: shell завантажує @angular/core 17.0.0,
// remote завантажує свій @angular/core 17.2.0 → два runtime →
// NullInjectorError, CD не спрацьовує, DI singleton ламається

// ПОГАНО: State через window global
// shell/src/app/app.component.ts
(window as any).__sharedState = { user: this.authService.currentUser() };
// orders-remote читає:
const user = (window as any).__sharedState?.user;
// Проблеми: не type-safe, race conditions, не reactive (зміни не propagate),
// тяжко тестувати, security (будь-який скрипт може читати/писати)

// ПОГАНО: MFE для монокоманди без organizational need
// Якщо одна команда 3 розробники розбиває app на 5 remotes:
// - 5 окремих Angular CLI проектів з окремим CI
// - Щоразу треба запускати 5 apps локально
// - Integration testing між 5 remotes
// - Shared deps version sync між 5 teams (one team)
// Рішення: Nx monorepo покриває всі потреби без MFE overhead
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Відсутній `singleton: true` для Angular/RxJS у shared config | Два примірники ламають DI, Change Detection і Subject cross-communication | `shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })` |
| Статична federation конфігурація у production | Remote URLs закодовані в shell при build — неможлива незалежна зміна remote URL без rebuild shell | Dynamic federation через `manifest.json` завантажений під час runtime |
| Global `window` об'єкт для state sharing | Type-unsafe, race conditions, security вразливість, не reactive | Event bus (CustomEvents/BroadcastChannel) або shared singleton service через MF |
| MFE без organizational need (одна команда) | Infrastructure overhead без організаційних переваг | Nx monorepo з module boundaries — все переваги без MFE складності |
| esbuild Angular + Webpack Module Federation без adaptation | Runtime incompatibility | `@angular-builders/custom-webpack` для MFE projects, або чекати native ESM federation |

## Interview Block

### [L1 — Warm-up] Що таке micro-frontend архітектура?

**Signal being tested:** Розуміння організаційних мотивів MFE, а не просто технічного визначення.

**What the interviewer expects:** Незалежний деплой як головна мотивація. Розуміння що це organizational рішення.

**How to probe deeper:** "Коли Nx monorepo з lazy loading достатній і коли дійсно потрібен MFE?"

**Reference answer:** MFE — frontend decomposition для незалежного деплою кількома командами. Різниця від Nx monorepo: monorepo — спільна codebase зі спільним release, MFE — кожна команда деплоїть незалежно. Виправдане при 3+ команд з різними release cycles. Одна команда — Nx достатній.

**Common mistakes:** Вважають MFE технічним рішенням для performance або code organization, не organizational.

---

### [L2 — Mid] Як Module Federation працює і яка роль shell та remote?

**Signal being tested:** Розуміння runtime integration механізму і Webpack 5 MF internals.

**What the interviewer expects:** remoteEntry.js, shared deps negotiation, dynamic import. Angular-specific: `@angular-architects/module-federation`.

**How to probe deeper:** "Що відбувається під час runtime коли Angular завантажує remote module?"

**Reference answer:** Shell: `remotes` config у webpack → при routing до /orders → dynamic `import()` → Webpack runtime → fetch `remoteEntry.js` (маніфест) → negotiate shared deps (singleton Angular) → lazy-load remote chunks. Remote: `exposes` config → при build webpack generates `remoteEntry.js` з registry exposed modules. Routing: `loadRemoteModule({ type: 'manifest', remoteName: 'orders', exposedModule: './OrdersRoutes' })`.

**Common mistakes:** Думають remoteEntry.js — це весь bundle remote. Це лише маніфест, код завантажується окремо.

---

### [L3 — Senior] Як коректно налаштувати shared dependencies і чому singleton критично важливий?

**Signal being tested:** Глибоке розуміння Webpack MF runtime, singleton negotiation, і наслідків version mismatch для Angular.

**What the interviewer expects:** `singleton: true`, `strictVersion: true`, `requiredVersion: 'auto'`. Пояснення чому два `@angular/core` = catastrophic failure.

**How to probe deeper:** "Що станеться якщо shell і remote мають Angular 17.0.0 і 17.2.0 відповідно, і strictVersion: true?"

**Reference answer:** `shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })`. Singleton: один примірник у пам'яті. Якщо shell має 17.x і remote потребує 17.x — MF runtime обирає завантажену версію (17.0.0 або 17.2.0 залежно від semver range). `strictVersion: true`: якщо versions несумісні (major різниця) — runtime error. Два `@angular/core`: DI injectors конфліктують, CD не propagate між remotes, NullInjectorError.

**Common mistakes:** `strictVersion: false` — MF тихо завантажує дублікат. Не шерять `zone.js` — Zone патчить globals двічі.

---

### [L4 — Staff/Principal] Як організувати state sharing між MFE remotes і що є правильними boundaries?

**Signal being tested:** Системне мислення про state ownership, coupling і resilience у distributed frontend system.

**What the interviewer expects:** State ownership model (shell = global, remote = local), event bus pattern, contract testing, failure modes.

**How to probe deeper:** "Як remote дізнається що user profile оновився в іншому remote? Як ти тестуєш цю інтеграцію?"

**Reference answer:** State ownership: shell owns cross-cutting state (auth, theme, locale), remotes own їх domain state. Propagation: shell надає shared AuthService через MF shared deps або CustomEvents через event bus. Cross-remote communication: BroadcastChannel або `window.dispatchEvent`. Testing: contract tests (Pact) між shell API і remote expectations. Integration tests де shell + mock-remote. Resilience: remotes re-fetch critical state при mount — defensive проти stale state.

**Common mistakes:** Global `window.state` — неконтрольовано. Спроба шерити NgRx Store між різними Angular versions.

## Summary

### Key Points

- MFE — organizational рішення для незалежного деплою; Nx monorepo часто достатній без MFE overhead
- Module Federation (Webpack 5): shell завантажує `remoteEntry.js` маніфест і negotiates shared singleton deps під час runtime
- `singleton: true, strictVersion: true, requiredVersion: 'auto'` — обов'язково для `@angular/core`, `rxjs`, `zone.js`
- Angular CLI esbuild (v17+) несумісний з Webpack MF — потрібен `@angular-builders/custom-webpack`
- Dynamic federation через `manifest.json` — production підхід для runtime-configurable remote URLs
- Angular Elements (`createCustomElement`) — альтернатива для cross-framework MFE або embedded widgets
- State ownership: shell = global (auth/theme), remotes = domain state; cross-remote через event bus

### Elevator Pitch (2 minutes)

Micro-frontends вирішують organizational проблему: кілька команд хочуть деплоїти свій frontend незалежно. У Angular — Module Federation (Webpack 5) є найзрілішим підходом: shell app завантажує remoteEntry.js маніфест від кожного remote, runtime negotiates спільні залежності (один Angular у пам'яті через singleton config), lazy-loads тільки унікальний код remote. Ключові технічні деталі: `singleton: true` для Angular deps (без нього — два runtime, catastrophic failure), dynamic manifest для production flexibility, custom-webpack builder замість esbuild. Angular Elements — альтернатива для cross-framework інтеграції через Web Components. MFE виправдане при 3+ незалежних команд — в іншому випадку Nx monorepo з module boundaries дає всі переваги без complexity.
