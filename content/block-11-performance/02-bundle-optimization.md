---
title: "Bundle Optimization"
block: 11
topic: 2
slug: "bundle-optimization"
difficulty: 4
sinceVersion: "2"
tags: ["tree-shaking", "lazy-loading", "code-splitting", "bundle-analysis", "esbuild", "source-map-explorer"]
relatedTopics: ["deferrable-views", "core-web-vitals", "runtime-optimization", "angular-devtools-profiling"]
interviewQuestions:
  - id: "b11t2q1"
    level: "junior"
    question: "Що таке tree-shaking і як Angular використовує його для зменшення bundle size?"
    referenceAnswers:
      junior: "Tree-shaking — видалення невикористаного коду з bundle. Angular використовує його при production build щоб видалити компоненти та сервіси що не використовуються."
      mid: "Tree-shaking базується на ES module static analysis. Bundler (esbuild/webpack) аналізує import/export graph і видаляє unreachable code. Умова: ES modules (import/export), не CommonJS (require()). Angular сприяє tree-shaking через: standalone components (не NgModules), providedIn: 'root' (service tree-shakeable якщо не injected), AOT compilation (removes decorators metadata at build time). CommonJS modules — погано tree-shaken: require() dynamic, bundler консервативний."
      senior: "Tree-shaking mechanics детально: bundler будує module dependency graph. Node видаляється якщо: 1) Не referenced від entry point. 2) Не має side effects (`sideEffects: false` в package.json). Проблема side effects: `import 'some-lib'` — side effect import, не tree-shaken навіть якщо не used. Angular: `@angular/core` marked `sideEffects: false` → unused Angular APIs tree-shaken. AOT compilation transforms: `@Component()` decorator → raw `ɵcmp` property. IVY component definition is pure assignment → tree-shakeable. Comparaison: NgModule-based — all declared components bundled (transitive deps). Standalone: only imported components bundled. Angular 15+: standalone required for optimal tree-shaking. `providedIn: 'root'` service: service class included only if inject(Service) reference exists somewhere in included code. Не injectable → tree-shaken out."
      staff: "Tree-shaking як architectural constraint — implications для library design і application structure. Library authoring: 1) Secondary entry points: `@angular/cdk/overlay`, not `@angular/cdk`. Tree-shaking works per entry point. Flat bundle без secondary = import anything = import everything. 2) `sideEffects` field в package.json: `false` for libraries без side effect imports. `['*.css', '*.scss']` for style imports. 3) ES2022+ class fields syntax (not decorator transform) — better tree-shakeable. Angular compiler modernizes this. Application design для tree-shaking: 1) Lazy load feature modules: `loadChildren` → feature code not in initial bundle regardless of tree-shaking. 2) Barrel files (index.ts) anti-pattern: `import { ComponentA } from './components'` → entire barrel analyzed → potential inclusion of unused components. Better: direct imports. 3) Dynamic imports for conditional features. 4) Runtime vs compile-time: providedIn: 'root' enables tree-shaking at link time. Platform/environment providers: `provideEnvironmentNgZone()` only if ZonedCD (tree-shaken in zoneless apps). 5) Bundle analysis workflow: build → analyze → identify large contributors → find tree-shaking opportunities or lazy load candidates."
    commonMistakes:
      - "Думають CommonJS dependencies tree-shaken — ні, require() не statically analyzable"
      - "Barrel файли (index.ts re-exports) ускладнюють tree-shaking — bundler включає більше ніж потрібно"
    relatedQuestions: ["b11t2q2", "b11t2q3"]
  - id: "b11t2q2"
    level: "mid"
    question: "Як працює route-level code splitting і component-level lazy loading в Angular?"
    referenceAnswers:
      junior: "Lazy loading — завантаження коду тільки коли потрібно. Для routes використовуємо loadChildren або loadComponent щоб завантажувати feature modules тільки при navigation."
      mid: "Route-level: `loadChildren: () => import('./feature/feature.routes').then(m => m.routes)` або `loadComponent: () => import('./page.component').then(m => m.PageComponent)`. Кожен lazy import → окремий chunk. Component-level (Angular 19+): `@defer` для below-route lazy loading. Preloading: withPreloading(PreloadAllModules) або custom strategy для background download."
      senior: "Code splitting levels: 1) Route-level (loadComponent/loadChildren): chunk per lazy route. Triggered on navigation. Preloading possible via PreloadingStrategy. 2) Component-level (@defer): chunk per @defer block. Triggered by viewport/idle/interaction. No preloading strategy integration — prefetch qualifier handles this. 3) Manual dynamic import: `const { util } = await import('./utils')` — for conditional heavy utilities. Code splitting granularity: loadChildren з route array → all routes in one chunk. loadChildren з deeply nested routes → single chunk for whole feature. loadComponent → minimal chunk (one component). @defer → minimal chunk (component + its unique deps). Bundle analysis: `ng build --stats-json --source-map`. Source map explorer: `npx source-map-explorer dist/app/*.js`. Shows component-level contribution. Angular's chunk naming: lazy chunks named by route path fragment or component name. Custom: webpack `chunkFilename` or esbuild `chunkNames`."
      staff: "Code splitting strategy для enterprise app. Code splitting hierarchy and bundle budget: Initial bundle (critical path): Angular framework + core features + above-fold components. Target: < 200KB gzip. Route chunks (feature boundaries): per lazy route or feature module. Target: < 100KB gzip each. @defer chunks (component islands): heavy below-fold components. Target: < 50KB gzip each. Dynamic imports (conditional): third-party libs, polyfills. Budget enforcement: `angular.json` budgets + Lighthouse CI assertions. Splitting granularity trade-offs: Too coarse: user downloads large chunk for one page feature. Too fine: many small HTTP/2 requests — each has overhead. HTTP/2 multiplexing reduces but doesn't eliminate per-request overhead. Rule of thumb: chunk < 5KB → consider inlining. Chunk > 500KB → consider splitting further. Module federation (Nx): micro-frontend code splitting — each team deploys independently, shares Angular core singleton. Advanced: partial evaluation at build time. Angular compiler pre-evaluates static expressions, reduces runtime bundle. Signal-based components (zoneless): smaller framework runtime (no Zone.js included). `provideExperimentalZonelessChangeDetection()` → tree-shake Zone.js (~30KB)."
    commonMistakes:
      - "loadChildren з barrel index.ts — весь feature module в один chunk навіть якщо можна split далі"
      - "Не враховують HTTP/2 overhead — занадто granular splitting може бути повільнішим ніж medium chunk"
    relatedQuestions: ["b11t2q1", "b11t2q3"]
  - id: "b11t2q3"
    level: "mid"
    question: "Як використовувати source-map-explorer і webpack-bundle-analyzer для аналізу bundle?"
    referenceAnswers:
      junior: "Можна використовувати ці інструменти щоб побачити що займає місце в bundle і знайти великі залежності."
      mid: "`ng build --source-map` для source maps. `npx source-map-explorer dist/app/*.js` — показує treemap залежностей. webpack-bundle-analyzer: `ng build --stats-json`, потім `npx webpack-bundle-analyzer dist/app/stats.json`. Обидва показують розмір кожного модуля/файлу в bundle."
      senior: "source-map-explorer vs webpack-bundle-analyzer: 1) source-map-explorer: аналізує source maps — показує оригінальні файли і їх розмір в minified bundle. Точніший (map-based). Команда: `npx source-map-explorer 'dist/app/*.js' --html report.html`. 2) webpack-bundle-analyzer: аналізує webpack stats.json — показує module graph і chunk composition. `ng build --stats-json → dist/app/stats.json → npx webpack-bundle-analyzer stats.json`. Обидва для esbuild (Angular 17+): Angular CLI з esbuild генерує source maps сумісні з source-map-explorer. Для bundleAnalyzer — потрібен stats-json format. Що шукати: 1) Unexpected large modules (момент: чому тут вся lodash?). 2) Duplicate modules (multiple versions of same lib). 3) CommonJS modules (important size hint). 4) Unused chunks (large chunk never navigated). Workflow: baseline measurement → add optimization → rebuild → compare. Angular DevTools: Component tree може показати lazy-loaded vs eager components at runtime."
      staff: "Bundle analysis як systematic process. Bundle analysis pyramid: 1) High level: gzip sizes of initial и lazy chunks (CI budget). 2) Module-level: source-map-explorer treemap — identify top-10 contributors. 3) Symbol-level: `twc` (TypeScript webpack checker) або `npm pack --dry-run` для library analysis. Bundle regression detection in CI: `bundlesize` або `size-limit` npm packages. Configure: `{ 'path': 'dist/app/main.*.js', 'maxSize': '200kb' }`. CI fails if regression. Per-team ownership: teams responsible for their lazy chunk sizes. Bundle size review checklist per PR: new dependency added → what's its size? Already included in bundle? CommonJS or ESM? `bundlephobia.com` for quick analysis before adding dependency. Advanced: differential loading — modern JS (ES2022) for modern browsers (smaller), ES5 for legacy. Angular CLI handles this. `browserslist` configuration. Incremental adoption tracking: measure initial bundle over time. Performance budget KPI. Monthly review. Bundle size vs functionality trade-off: 50KB for rich text editor that 90% of users never see → @defer it. 5KB utility that every user needs → include eagerly."
    commonMistakes:
      - "Не використовують source maps при analysis — без --source-map бачать мінімізований код без mapping"
      - "Аналізують development build — production build суттєво менший через minification і tree-shaking"
    relatedQuestions: ["b11t2q2", "b11t2q4"]
  - id: "b11t2q4"
    level: "senior"
    question: "Яка різниця між CommonJS і ESM для bundle size і чому CommonJS погано для tree-shaking?"
    referenceAnswers:
      junior: "ESM (ES modules) використовує import/export. CommonJS використовує require(). ESM краще для tree-shaking бо import/export статично аналізується."
      mid: "CommonJS: require() — динамічний, можна умовний. Bundler не може статично визначити що реально використовується → включає весь модуль. ESM: import/export — статичні declarations. Bundler знає точно які exports використані → може видалити решту. Angular packages — ESM. Якщо залежність CommonJS — bundler включає її повністю навіть якщо використовується одна функція."
      senior: "CommonJS tree-shaking неможливий через: 1) require() може бути умовним: `if (x) require('./a')`. 2) exports — mutable object: `module.exports.newProp = value`. 3) Dynamic require: `require(dynamicString)`. Bundler (esbuild/webpack) — консервативний: включає весь CommonJS module. ESM: static binding — `import { fn } from 'lib'` → bundler знає точно що потрібно. Angular CLI warning: 'CommonJS module xyz detected' — explicit warning. Solution: знайти ESM alternative або bundle entire CJS lib. Практичні приклади: `moment.js` (CJS, 290KB) vs `date-fns` (ESM, tree-shakeable, ~3KB per function). `lodash` (CJS, 70KB) vs `lodash-es` (ESM, tree-shakeable). `rxjs` — ESM, tree-shakeable (operators individually exported). Dynamic imports (await import()): завжди code-splits regardless of CJS/ESM. Package analysis: `package.json` fields: `module` (ESM) або `main` (CJS). Modern: `exports` field з conditional exports — `import` condition = ESM, `require` condition = CJS."
      staff: "ESM vs CJS — ecosystem migration і Angular app implications. Status 2024-2025: major libraries migrated to ESM: rxjs, lodash-es, date-fns, nanoid. Some legacy CJS: некоторые Node.js-only libs, older Angular packages. Angular ecosystem: всі @angular/* packages — ESM з secondary entry points. Pure ESM packages require Node.js ESM runtime для SSR (Angular Universal). Angular CLI handles this with proper bundler config. Detection workflow: 1) `ng build` → watch for 'CommonJS or AMD dependencies' warnings. 2) source-map-explorer → ідентифікуй CJS modules (often huge blobs). 3) `npm view packageName` → check `module` field. 4) Search ESM alternative or contribute ESM build. Organizational: `no-restricted-imports` ESLint rule: forbid known CJS packages that have ESM alternatives. `allow-list` approach for intentional CJS. Size impact: одна lodash CJS import = ~70KB. Switch to lodash-es tree-shaken = 1-5KB (тільки used functions). `moment` → `date-fns/format` import = ~5KB vs ~290KB. ROI: replacing 3 CJS deps with ESM alternatives = -200KB initial bundle. Direct INP/LCP improvement (less JS to parse). Bundler handling: esbuild handles CJS → ESM interop automatically (wraps in ESM). But cannot tree-shake the wrapped CJS → whole lib included."
    commonMistakes:
      - "Ігнорують Angular CLI 'CommonJS or AMD dependencies' warnings — кожне таке попередження = потенційний розмір bundle"
      - "Думають що dynamic import() вирішує CJS tree-shaking — dynamic import = code splitting, не tree-shaking"
    relatedQuestions: ["b11t2q3", "b11t2q5"]
  - id: "b11t2q5"
    level: "staff"
    question: "Як esbuild і Angular CLI build pipeline змінили підхід до bundle optimization в Angular 17+?"
    referenceAnswers:
      junior: "esbuild — швидший bundler. Angular 17+ використовує esbuild замість webpack що робить build значно швидшим."
      mid: "Angular 17: esbuild як default bundler замість webpack. Результат: build time 72% faster, rebuild 90% faster. esbuild написаний на Go, паралельний. Application builder (`@angular/build:application`) — новий builder з esbuild. Підтримує: SSR, prerendering, partial hydration. Старий браузер webpack build — deprecated."
      senior: "esbuild impact на bundle optimization: 1) Build speed: webpack 60s → esbuild 10s. Тестах: rebuild ms замість секунд. 2) Output size: esbuild aggressive minification — константи inline, dead code elimination at IR level. 3) Code splitting: esbuild native code splitting — dynamic import() = automatic chunk. No webpack magic comments needed. 4) ESM output: esbuild emits native ESM — modern browsers load faster. Legacy fallback: `@angular/build:application` generates differential builds (modern + legacy). 5) Source maps: esbuild source maps accurate для source-map-explorer. 6) Angular-specific: Angular compiler (Ivy) emits ES2022 class syntax → esbuild optimizes further. Decorator transform: ngtsc handles → esbuild receives clean code. Build pipeline: TypeScript compilation (ngtsc) → Ivy output (component definitions) → esbuild bundling → final chunks."
      staff: "esbuild integration — production considerations і optimization strategies. Angular CLI Application Builder (stable v17): 1) SSR + prerendering в одному builder: `ng build` з `outputMode: 'server'` → server bundle + client bundle + prerendered HTML. 2) Partial hydration: builder generates server HTML з @defer placeholders, client bundle з defer chunks. 3) Budget enforcement: esbuild reports sizes → Angular CLI compares vs angular.json budgets. Fail build on exceeded budget. 4) Optimization flags: `optimization.scripts: true` (minify), `optimization.styles: true` (CSS minify), `optimization.fonts: { inline: true }` (critical fonts inlined). 5) Advanced esbuild config: Angular 20+ exposes `customWebpackConfig` equivalent via `defineConfig` plugin API. Custom plugins for: bundle analysis automation, custom chunk naming, polyfill injection. Build performance in CI: incremental builds не available в CI (clean build each time). esbuild caching: `--cache` flag — cache compilation results. Angular CLI cache: `.angular/cache` — persists across CI runs якщо cache volume configured. 6) Comparison webpack vs esbuild output: webpack generated chunk graph з more granular control. esbuild generates flatter output. Для micro-frontend (Module Federation): webpack still needed (esbuild Module Federation support experimental). Nx Module Federation: webpack-based з Angular's webpack builder. 7) Bundle size target evolution: Angular 12 typical initial: 400KB+. Angular 21 typical initial (zoneless + esbuild): 60-80KB framework + app code. Zoneless + standalone + esbuild = smallest possible Angular bundle."
    commonMistakes:
      - "Продовжують використовувати старий webpack builder (@angular-devkit/build-angular:browser) замість нового application builder"
      - "Не налаштовують CI cache для .angular/cache — кожен build з нуля без caching benefits"
    relatedQuestions: ["b11t2q4", "b11t2q3"]
---

## Core Concept

**English definition:** Bundle optimization in Angular encompasses tree-shaking (eliminating unreachable code via static ESM analysis), route-level and component-level code splitting (generating separate chunks via `loadComponent`/`loadChildren`/`@defer`), bundle analysis tooling (source-map-explorer, webpack-bundle-analyzer), CommonJS-vs-ESM impact on treeshakeability, and the Angular CLI's esbuild-based build pipeline that produces minimal production bundles.

**Пояснення:** Bundle optimization — це систематичне зменшення JavaScript що браузер повинен завантажити, розібрати та виконати. Кожен KB initial bundle = більше parsing time = гірший INP і LCP. Bundle optimization — не одноразова задача а ongoing practice: новий dependency доданий → bundle analysis → tree-shaking opportunities → lazy loading candidates.

**Яку проблему вирішує:** Angular applications без оптимізації: 1MB+ initial bundles, 3-5s parse time на mobile, поганий INP/LCP. Tree-shaking, code splitting, правильне використання ESM libraries — разом можуть скоротити initial bundle до 100-200KB і зробити додаток responsive від старту.

**Як працює під капотом:**

Tree-shaking pipeline:
```
Source code (TypeScript/ESM)
      ↓
Angular compiler (ngtsc) → Ivy IR (component definitions)
      ↓
esbuild bundler
  - Builds module dependency graph (import/export)
  - Marks each export as "used" or "unreachable"
  - Dead code elimination at IR level
  - Respects sideEffects field in package.json
      ↓
Minification (esbuild built-in)
  - Variable/function name shortening
  - Constant folding
  - Dead branch elimination
      ↓
Final chunks (initial + lazy)
```

Code splitting levels:
```
Level 1: Route-level (loadComponent/loadChildren)
app.routes.ts:
  { path: 'feature', loadComponent: () => import('./feature') }
  → chunk: feature.xyz123.js

Level 2: Component-level (@defer)
template:
  @defer (on viewport) { <heavy-chart /> }
  → chunk: heavy-chart.abc456.js

Level 3: Manual (dynamic import)
component.ts:
  const { PDFViewer } = await import('./pdf-viewer');
  → chunk: pdf-viewer.def789.js
```

Bundle analysis tools:
```bash
# Build with source maps
ng build --configuration production

# source-map-explorer (file-level analysis)
npx source-map-explorer 'dist/app/browser/*.js' --html bundle-report.html

# webpack-bundle-analyzer (module graph visualization)
ng build --stats-json
npx webpack-bundle-analyzer dist/app/browser/stats.json

# Angular CLI built-in budget check
# angular.json budgets: { type: 'initial', maximumError: '500kb' }
```

**Trade-offs та обмеження:**

- Занадто granular code splitting → many small HTTP requests (though HTTP/2 multiplexing helps)
- Tree-shaking requires ESM — CommonJS deps не tree-shaken → can negate effort
- Barrel files (index.ts) re-exports — can break tree-shaking by pulling in more than needed
- esbuild aggressive dead code elimination can conflict with libraries that rely on side effects
- Source maps збільшують build size (deploy без source maps в production, keep для error monitoring)

**Версійність:** Angular 2+: Webpack-based builds, lazy loading з NgModule. Angular 9: Ivy compiler — better tree-shaking for component definitions. Angular 14: standalone components — optimal tree-shaking without NgModules. Angular 17: esbuild default (`@angular/build:application` builder) — 72% faster builds, better output. Angular 17: `@defer` for component-level code splitting. Angular 18: incremental hydration affects bundle structure. Angular 19+: zoneless change detection — tree-shakes Zone.js (~30KB).

## Deep Details

### Edge Cases

**Barrel files and tree-shaking:** `export * from './components'` barrel — bundler imports entire barrel to resolve one component. Solution: direct imports або configuring IDE auto-import to avoid barrels. `eslint-plugin-import/no-barrel-files` rule.

**Side effects and tree-shaking:** `import 'zone.js'` — pure side effect import. Zone.js adds itself to global scope. Cannot be tree-shaken even if `sideEffects: false` elsewhere. Zoneless Angular (v18+): не потрібен Zone.js import → tree-shaken.

**Angular module factories:** In legacy NgModule apps, `@NgModule` class itself bundled even if all declared components tree-shaken — NgModule factory prevents complete tree-shaking. Standalone + providedIn: 'root' — no NgModule overhead.

**esbuild і CSS tree-shaking:** Angular component styles (ViewEncapsulation.Emulated) — per-component CSS bundled. Unused styles in unused components → tree-shaken з компонентом. Global styles — не tree-shaken.

**dynamic import() з template strings:** `import(\`./features/${name}\`)` — не statically analyzable → bundler includes ALL files matching glob. Avoid dynamic template strings in import paths.

**sideEffects field gotcha:** `"sideEffects": false` в library package.json — але library має CSS import → CSS tree-shaken → missing styles. Fix: `"sideEffects": ["*.css", "*.scss"]`.

### Junior vs Senior Understanding

**Junior** knows: tree-shaking видаляє unused code, lazy loading = loadChildren/loadComponent, bundle size matters.

**Senior** understands:

1. **Tree-shaking mechanics:** ESM static analysis, sideEffects field, why CommonJS breaks it. providedIn: 'root' services tree-shaken if not injected.

2. **Bundle analysis workflow:** Build with source maps → source-map-explorer → identify top contributors → find optimization opportunities.

3. **CommonJS detection:** Angular CLI warnings, package.json module field, ESM alternatives.

4. **Code splitting granularity:** route vs component vs manual levels. Trade-offs with HTTP/2.

5. **esbuild pipeline:** ngtsc → esbuild, differential builds, cache benefits.

### Deprecation & Migration Path

- **`@angular-devkit/build-angular:browser`:** Deprecated в Angular 17. Migration: change `builder` to `@angular/build:application` in angular.json. New builder: better performance, SSR support, incremental hydration.
- **`@angular-devkit/build-angular:server`:** Deprecated. New: unified `@angular/build:application` з `outputMode: 'server'`.
- **NgModule-based lazy loading:** `loadChildren: () => import('./module').then(m => m.FeatureModule)`. Still works but suboptimal. Migration: standalone routes array, `loadComponent`, `loadChildren` з route array.
- **webpack magic comments for chunk names:** `/* webpackChunkName: "feature" */` — esbuild has native chunk naming via build options.

### Connections to Other Concepts

- **Deferrable Views:** @defer is primary tool for sub-route code splitting
- **Core Web Vitals:** Bundle size directly impacts LCP (script parse time) and INP (JS execution)
- **Runtime Optimization:** Tree-shaking reduces parse time; runtime optimization reduces execution time
- **Angular DevTools:** Shows component tree — can infer what's in initial vs lazy bundles

## Examples

### Basic Usage

```typescript
// Proper tree-shakeable service setup
@Injectable({ providedIn: 'root' })  // Tree-shakeable: removed if not injected
export class UserService {
  // ...
}

// NOT tree-shakeable:
@Injectable()
export class NotTreeShakeableService { }
// Must be in providers: [] to work → always bundled

// Standalone component — optimal for tree-shaking
@Component({
  standalone: true,
  // Only import what this component actually uses
  imports: [
    AsyncPipe,          // From @angular/common — tree-shakeable
    DatePipe,           // Only if used in template
    RouterLink,         // Only if used
  ],
  template: `...`
})
export class UserListComponent {}
```

```bash
# Bundle analysis workflow

# 1. Build production с source maps
ng build --configuration production

# 2. Analyze with source-map-explorer
npx source-map-explorer 'dist/app/browser/*.js' --html report.html
# Opens treemap: each rectangle = file, size = bytes in bundle

# 3. Check Angular CLI budget results
# angular.json:
# "budgets": [
#   { "type": "initial", "maximumWarning": "200kb", "maximumError": "400kb" },
#   { "type": "anyLazyChunk", "maximumWarning": "80kb", "maximumError": "150kb" }
# ]

# 4. webpack bundle analyzer
ng build --stats-json
npx webpack-bundle-analyzer dist/app/browser/stats.json
```

```json
// angular.json — comprehensive budget configuration
{
  "configurations": {
    "production": {
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "200kb",
          "maximumError": "400kb"
        },
        {
          "type": "anyLazyChunk",
          "maximumWarning": "80kb",
          "maximumError": "150kb"
        },
        {
          "type": "anyComponentStyle",
          "maximumWarning": "4kb",
          "maximumError": "8kb"
        },
        {
          "type": "anyScript",
          "maximumWarning": "10kb"
        }
      ]
    }
  }
}
```

### Production Scenario

```typescript
// ESM-friendly dependency alternatives
// BEFORE (CommonJS, large):
import * as moment from 'moment';  // CJS, ~290KB, not tree-shakeable
import _ from 'lodash';           // CJS, ~70KB, not tree-shakeable

// AFTER (ESM, tree-shakeable):
import { format, parseISO } from 'date-fns';  // ESM, ~3KB for used functions
import { debounce, throttle } from 'lodash-es'; // ESM, ~1KB for used functions

// Route-level code splitting with proper chunking
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    // Children in same chunk as parent for small features
  },
  {
    path: 'reports',
    // Separate chunk: reports feature
    loadChildren: () => import('./reports/reports.routes')
      .then(m => m.reportsRoutes),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    // Largest feature: admin panel — own chunk
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.adminRoutes),
  }
];

// Component with @defer for heavy sub-components
@Component({
  standalone: true,
  // Note: HeavyChartComponent NOT in imports — only used inside @defer
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Initial bundle: only essential components -->
    <app-header />
    <app-navigation />

    <!-- @defer: heavy chart → separate chunk auto-created -->
    @defer (on viewport; prefetch on idle) {
      <app-heavy-chart [config]="chartConfig()" />
    } @placeholder {
      <div class="chart-skeleton" style="height: 400px;"></div>
    }

    <!-- @defer: PDF viewer (large dependency) -->
    @defer (on interaction) {
      <app-pdf-viewer [src]="pdfUrl()" />
    } @placeholder {
      <button>View PDF Report</button>
    }
  `
})
export class AnalyticsPageComponent {
  chartConfig = signal<ChartConfig>({ type: 'bar', data: [] });
  pdfUrl = signal<string>('');
}
```

```typescript
// Zoneless configuration — removes Zone.js from bundle (~30KB)
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

// Note: remove import 'zone.js' from polyfills.ts first!
bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
  ]
});

// angular.json: remove "zone.js" from polyfills
// "polyfills": []  // Empty - no zone.js
```

### Anti-Example

```typescript
// WRONG: Barrel file breaks tree-shaking
// components/index.ts
export * from './user-list.component';
export * from './admin-panel.component';   // Heavy!
export * from './reporting-dashboard.component';  // Heavy!

// app.component.ts
import { UserListComponent } from './components';
// WRONG: bundler pulls entire barrel → AdminPanelComponent included
// even though not used!

// CORRECT: direct import
import { UserListComponent } from './components/user-list.component';

// WRONG: CommonJS library without ESM alternative awareness
import * as _ from 'lodash';  // 70KB CJS — completely bundled
const result = _.get(obj, 'a.b.c');  // Using only 1 function = 70KB waste

// CORRECT: ESM alternative
import { get } from 'lodash-es';  // ~500B for get function only
const result = get(obj, 'a.b.c');

// WRONG: Service not using providedIn: 'root' — always bundled
@Injectable()
export class ReportingService {
  // Heavy service
}

// Must add to providers: [] somewhere to work
// → included in bundle even if feature never used by this user role

// CORRECT:
@Injectable({ providedIn: 'root' })
export class ReportingService { }
// Tree-shaken if no inject(ReportingService) found in included code

// WRONG: import('template string') — bundler includes all matching files
async loadFeature(name: string) {
  // WRONG: dynamic template → bundler includes ALL ./features/* files
  const module = await import(`./features/${name}/index`);
}

// CORRECT: explicit switch/map
const featureLoaders: Record<string, () => Promise<unknown>> = {
  'users': () => import('./features/users/index'),
  'reports': () => import('./features/reports/index'),
};
const loader = featureLoaders[name];
if (loader) await loader();
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| CommonJS dependencies без ESM alternatives | Весь CJS module bundled, tree-shaking неможливий — 50-300KB waste per lib | Знаходь ESM версії: lodash → lodash-es, moment → date-fns; перевіряй Angular CLI CJS warnings |
| Barrel файли (index.ts) для компонентів | Bundler подтягує весь barrel щоб resolved один import → unused components в bundle | Direct imports або auto-import IDE configuration з direct paths |
| `@Injectable()` без `providedIn: 'root'` | Service в providers: [] → завжди bundled навіть якщо feature недоступна для user | `providedIn: 'root'` для tree-shakeability або lazy-provide в route providers |
| Аналіз development build | Dev build не має tree-shaking і minification → misleading sizes | Завжди аналізуй `ng build --configuration production` |
| Відсутні Angular CLI budgets | Bundle росте непомітно — production performance деградує поступово | Налаштуй budgets в angular.json, інтегруй у CI |

## Interview Block

### [L1 — Warm-up] Що таке tree-shaking і як Angular використовує його для зменшення bundle size?

**Signal being tested:** Розуміння механіки tree-shaking і чому ESM є prerequisite (не просто "Angular видаляє unused code").

**What the interviewer expects:** ESM static analysis, providedIn: 'root' tree-shakeability, standalone components vs NgModules, sideEffects field.

**How to probe deeper:** "Чому CommonJS dependencies не tree-shaken? Як перевірити що сервіс tree-shaken?"

**Reference answer:** Tree-shaking = dead code elimination через static ESM import/export analysis. Bundler будує module graph і видаляє unreachable exports. Prerequisite: ESM (static imports). `providedIn: 'root'` service — tree-shaken якщо не injected anywhere in reachable code. Standalone components — tree-shakeable (тільки imported components bundled). NgModules — всі declared components bundled. sideEffects: false — explicit opt-in для tree-shaking.

**Common mistakes:** Думають CJS tree-shaken; не знають що NgModule declarations bypass tree-shaking.

### [L2 — Mid] Як працює route-level code splitting і component-level lazy loading?

**Signal being tested:** Практичне знання трьох рівнів code splitting і trade-offs між ними.

**What the interviewer expects:** loadComponent vs loadChildren, @defer для component-level, granularity trade-offs, HTTP/2 consideration.

**How to probe deeper:** "Яка різниця між route-level і component-level code splitting? Коли використовувати кожен?"

**Reference answer:** Route-level: `loadComponent`/`loadChildren` — chunk per lazy route, triggered on navigation. Component-level: `@defer` — chunk per component, triggered by idle/viewport/interaction. Manual: `await import()` — conditional utilities. Granularity: route chunks target < 100KB, @defer chunks < 50KB. HTTP/2 multiplexing reduces but doesn't eliminate per-request overhead. Rule: chunk < 5KB → consider inline; > 500KB → split further.

**Common mistakes:** Не знають @defer як code splitting tool; думають loadChildren з одним модулем = optimal.

### [L3 — Senior] Як використовувати source-map-explorer і яка різниця між ESM і CJS для bundle?

**Signal being tested:** Практична здатність провести bundle analysis і пояснити чому ESM is prerequisite для tree-shaking.

**What the interviewer expects:** `ng build --configuration production`, source-map-explorer command, what to look for, CJS = no tree-shaking = whole lib bundled, ESM = static analysis possible.

**How to probe deeper:** "Знайшли що момент.js займає 290KB. Як вирішити? Яку ESM-альтернативу запропонуєш?"

**Reference answer:** `npx source-map-explorer 'dist/app/*.js' --html report.html`. Шукаємо: великі модулі, CJS libs (blob-like rectangles), дублікати. CJS: require() dynamic → bundler conservative → entire lib included. ESM: import/export static → bundler knows exactly what's used → tree-shaking. moment.js (CJS 290KB) → date-fns (ESM, ~3KB per function). Angular CLI warns на CJS. `package.json module` field = ESM entry point.

**Common mistakes:** Аналізують dev build; ігнорують Angular CLI CJS warnings.

### [L4 — Staff/Principal] Як esbuild змінив Angular build pipeline і як спроектувати систему bundle monitoring?

**Signal being tested:** Deep technical understanding esbuild integration і system-level thinking про bundle size як ongoing KPI.

**What the interviewer expects:** esbuild vs webpack performance/output, application builder migration, CI bundle regression detection, per-team chunk ownership, zoneless для minimum bundle.

**How to probe deeper:** "Як інтегрувати bundle size regression detection у CI pipeline? Що робити якщо teammate додав 100KB dependency?"

**Reference answer:** esbuild (Angular 17+ default): 72% faster build, better minification, native code splitting без webpack magic comments. Migration: `@angular-devkit/build-angular:browser` → `@angular/build:application`. CI bundle monitoring: `bundlesize` npm tool з `.bundlesizerc.json` — `{ path: 'dist/*.js', maxSize: '200kb' }` — CI fails on regression. Per-team: кожна команда owns своїх lazy chunk. PR checks: нова dependency → bundlephobia.com size check. Zoneless (v18+): remove zone.js import = -30KB. Monthly bundle review meeting.

**Common mistakes:** Не мігрують на application builder; відсутній CI bundle regression detection.

---

## Summary

### Key Points
- Tree-shaking requires ESM — CommonJS libs не tree-shaken, кожен `require()` = whole lib bundled
- `providedIn: 'root'` services tree-shakeable — видаляються якщо `inject(Service)` відсутній в reachable code
- Bundle analysis: `ng build --configuration production` + `npx source-map-explorer 'dist/*.js'`
- Code splitting levels: route (loadComponent/loadChildren) → component (@defer) → manual (await import())
- Angular 17+ esbuild builder: 72% faster builds, aggressive minification, native code splitting
- Angular CLI budgets в angular.json — compile-time guard; Lighthouse CI assertions — regression detection
- Zoneless Angular (`provideExperimentalZonelessChangeDetection`) — tree-shakes Zone.js (~30KB saving)

### Elevator Pitch (2 minutes)
Bundle optimization = три взаємопов'язані практики. Tree-shaking: ESM static analysis видаляє unreachable code. Requires ESM modules — CommonJS deps (lodash, moment) = whole lib bundled. providedIn: 'root' services tree-shaken якщо не injected. Code splitting: route-level (loadComponent/loadChildren), component-level (@defer), manual (dynamic import). Analysis: `ng build --configuration production` → `npx source-map-explorer 'dist/*.js' --html report.html` — treemap shows what's taking space. Angular CLI budgets блокують build на перевищення. esbuild (Angular 17+): default bundler, 72% faster, aggressive minification, native code splitting. Zoneless Angular: remove zone.js import = -30KB initial. Production targets: initial < 200KB gzip, lazy chunks < 100KB. CI integration: `bundlesize` tool для regression detection — PR fails якщо bundle grows unexpectedly.
