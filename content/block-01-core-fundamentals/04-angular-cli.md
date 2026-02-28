---
title: "Angular CLI & Build System"
block: 1
topic: 4
slug: "angular-cli"
difficulty: 2
sinceVersion: "2"
tags: ["cli", "angular-json", "schematics", "builders", "esbuild", "webpack"]
relatedTopics: ["bootstrapping", "standalone-components"]
interviewQuestions:
  - id: "b1t4q1"
    level: "junior"
    question: "Які основні команди Angular CLI ви використовуєте щодня? Що робить ng generate?"
    referenceAnswers:
      junior: "Основні команди: ng new (новий проєкт), ng serve (dev server), ng build (збірка), ng generate (генерація component, service тощо), ng test (тести). ng generate створює файли за шаблоном."
      mid: "ng serve запускає dev server з HMR та live reload, використовує esbuild для швидкої збірки. ng build створює production bundle з оптимізаціями (tree-shaking, minification, code splitting). ng generate використовує schematics — шаблони для генерації коду: components, services, pipes, guards, interceptors. ng test запускає unit tests через Karma/Jest. ng lint, ng e2e — quality та integration testing. Флаги: --dry-run для перевірки, --skip-tests для пропуску тестів."
      senior: "CLI — це orchestrator для Angular toolchain. Ключові команди: ng serve (esbuild dev server з incremental compilation, HMR для styles та templates), ng build (production з differential loading для legacy browsers — хоча з v17+ це менш актуально, budget enforcement, source maps config). ng generate запускає schematics — codegen templates з AST transformations; можна створити custom schematics для team standards. ng update — semver-aware update з migration schematics що автоматично оновлюють breaking changes. ng analytics — telemetry control. ng cache — build cache management (enabled за замовчуванням). Важливо: CLI versioning пов'язаний з Angular version — ng update @angular/cli оновлює обидва."
      staff: "CLI — це developer experience layer та build orchestration platform. Внутрішньо: CLI використовує Architect API — pluggable builder system. Кожна команда (serve, build, test) — це builder з конфігурацією в angular.json. ng generate використовує @angular-devkit/schematics — tree-based file transformation API з dry-run support. Для enterprise: 1) Custom schematics для enforcing team conventions (component structure, barrel exports, test patterns). 2) Custom builders для specialized build pipelines (web workers, service workers, custom asset processing). 3) ng update migration schematics — автоматична міграція breaking changes, critical для large monorepos. 4) CLI prompts та defaults через schematic defaults in angular.json. 5) Workspace schematics (./schematics) для project-specific codegen. CLI extensibility model — це major differentiator від інших frameworks."
    commonMistakes:
      - "Не знають ng update і мігрують вручну"
      - "Не використовують --dry-run перед generate"
      - "Ігнорують ng cache для прискорення builds"
    relatedQuestions: ["b1t4q2", "b1t4q3"]
  - id: "b1t4q2"
    level: "mid"
    question: "Як структурований angular.json? Що таке builders і як вони працюють?"
    referenceAnswers:
      junior: "angular.json — це конфігураційний файл Angular проєкту. Він містить налаштування для build, serve, test."
      mid: "angular.json визначає workspace configuration: projects (application, library), кожен з architect targets (build, serve, test, lint). Кожен target вказує builder та options. Builder — це npm package що виконує задачу: @angular-devkit/build-angular:application (esbuild-based build), @angular-devkit/build-angular:dev-server. Options включають: outputPath, index, main, styles, scripts, budgets, fileReplacements для environments."
      senior: "angular.json — це workspace schema з projects → architect → targets. Кожен target: {builder, options, configurations}. Builder — це function що приймає options та context, повертає Observable<BuilderOutput>. Angular 17+: @angular-devkit/build-angular:application замінив browser builder — esbuild замість webpack, значно швидший. Configurations дозволяють per-environment overrides: production (optimization, budgets), staging (different API URLs), development (source maps, no optimization). fileReplacements підставляє environment.prod.ts замість environment.ts. Budgets — build-time size checks: maximumError зупиняє build якщо bundle перевищує ліміт. Custom builders: createBuilder() з @angular-devkit/architect — можна створити wrapper навколо existing builder або повністю custom pipeline."
      staff: "angular.json — це declarative build configuration що abstracts toolchain details. Architect API: builder discovery через package.json builders field, schema validation через JSON Schema, options merging (defaults → target options → configuration overrides → CLI flags). Для enterprise monorepo: multiple projects в одному workspace, shared configurations через extends. Nx розширює цю model з affected builds та computation caching. Builder internals: builders отримують BuilderContext з logger, workspace info, scheduleTarget() для cross-target orchestration. esbuild builder (application) vs webpack (browser): esbuild — 2-4x faster builds, native code splitting, ESM output. Webpack builder — legacy, потрібен для custom webpack configs (Module Federation, specialized loaders). Migration: browser → application builder — mostly drop-in, але custom webpack plugins потребують alternatives. Budget enforcement — critical для performance culture: initial bundle budget 250-500KB, lazy chunk budget 50-150KB, warning threshold 80% of max."
    commonMistakes:
      - "Не розуміють різницю між builder types (application vs browser)"
      - "Hardcode environment values замість fileReplacements"
      - "Не налаштовують budgets — bundle grows unchecked"
    relatedQuestions: ["b1t4q1", "b1t4q3"]
  - id: "b1t4q3"
    level: "senior"
    question: "Порівняйте esbuild і webpack builders в Angular. Коли потрібен webpack?"
    referenceAnswers:
      junior: "esbuild — це новий швидший bundler в Angular. Webpack — старіший, але все ще підтримується."
      mid: "esbuild builder (@angular-devkit/build-angular:application) з Angular 17+ — значно швидший за webpack (2-4x). Використовує esbuild для TypeScript/JavaScript bundling і Vite для dev server. Webpack (@angular-devkit/build-angular:browser) — legacy builder. Webpack потрібен для: Module Federation (micro-frontends), custom webpack plugins, specialized loaders."
      senior: "esbuild builder: Go-native bundler, ESM-first output, native code splitting, incremental builds з Vite dev server (HMR). Переваги: 2-4x faster cold build, instant HMR для styles. Обмеження: немає webpack plugin ecosystem, no Module Federation support (потребує @angular-architects/module-federation з webpack). Webpack builder: mature plugin ecosystem, extensive loader support, Module Federation для micro-frontends. Angular використовує hybrid approach: esbuild для TS/JS compilation + bundling, Angular compiler (ngc) для template compilation. SSR: esbuild builder підтримує SSR нативно. Міграція: angular.json builder change + видалення custom webpack configs або їх адаптація. Performance profiling: NG_BUILD_PROFILING=1 ng build для timing breakdown."
      staff: "Build system evolution: webpack → esbuild відображає industry trend до native-speed tooling (аналогічно Turbopack в Next.js, Vite). Angular's implementation: esbuild для JS bundling, Vite для dev server, Angular compiler (ngtsc) для template → JS compilation. Архітектурно: build pipeline = ngc compilation → esbuild bundling → optimization passes. Webpack залишається для: 1) Module Federation — runtime module sharing для micro-frontends, esbuild не підтримує цю модель. Native Federation — esbuild-compatible alternative, але менш mature. 2) Custom loaders для specialized assets (WASM, graphql files, etc). 3) Complex code splitting strategies. Decision framework: start з esbuild (default), switch to webpack тільки якщо потрібен specific webpack feature. Hybrid approach: esbuild для більшості apps в monorepo, webpack для MFE shell. Build performance budgets: CI build time < 2 min для typical app. esbuild досягає це для 500+ component apps. Caching: Angular CLI persistent cache (.angular/cache) + Nx computation cache для monorepo = near-instant rebuilds."
    commonMistakes:
      - "Переходять на webpack для features що esbuild підтримує"
      - "Не profiling builds — не знають де bottleneck"
      - "Custom webpack config без розуміння Angular build pipeline"
    relatedQuestions: ["b1t4q2", "b1t4q4"]
  - id: "b1t4q4"
    level: "staff"
    question: "Як ви організовуєте build pipeline та CI/CD для великого Angular monorepo?"
    referenceAnswers:
      junior: "В CI/CD зазвичай є ng build та ng test команди, які запускаються автоматично при pull request."
      mid: "Для monorepo: Nx або Angular workspace з кількома projects. CI: lint → test → build → deploy. Nx affected command запускає тільки tasks для змінених проєктів. Caching зберігає результати попередніх builds. Budgets в angular.json контролюють bundle size."
      senior: "Monorepo build pipeline: 1) Nx workspace з Angular plugin — affected:build/test/lint запускає tasks тільки для змінених libraries та їх dependents. 2) Computation caching: local (.nx/cache) + remote (Nx Cloud) — повторні builds миттєві. 3) Task orchestration: parallel execution з dependency-aware ordering. 4) CI pipeline: affected:lint → affected:test → affected:build → affected:e2e → deploy. 5) Bundle budgets per app: CI fails якщо exceeded. 6) Source map explorer або webpack-bundle-analyzer для audit. 7) Environment management: dynamic environments через build-time replacement або runtime config loading."
      staff: "Enterprise monorepo build architecture: 1) Nx workspace — granular libraries (feature, UI, data-access, util), enforced module boundaries через eslint. 2) Build graph: Nx analyzes project dependencies, task pipeline визначає order (build lib → build app, test parallel з lint). 3) Caching strategy: local cache default, Nx Cloud remote cache shared across team та CI — cache hit rate 60-80% в active development. 4) CI pipeline design: PR pipeline (affected only, 5-10 min) vs merge pipeline (full build, 15-30 min) vs deploy pipeline (staged rollout). 5) Build optimization: esbuild for apps, ngc for libraries (publishable), incremental TypeScript compilation. 6) Size tracking: bundle size recorded per commit, trending dashboard, automatic PR comments з size delta. 7) Feature flags integration: build-time dead code elimination for disabled features. 8) Artifact management: versioned dist artifacts, CDN deployment з cache invalidation strategy. 9) Observability: build timing metrics в CI, slow build alerts, flaky test detection. Metrics для success: PR build < 10 min (affected), full build < 30 min, deploy < 15 min. Nx Cloud distributed task execution для scaling beyond single CI machine."
    commonMistakes:
      - "Запускають full build/test для кожного PR замість affected"
      - "Не використовують remote caching — кожен CI run починає з нуля"
      - "Відсутній bundle size tracking — regression не помічається"
      - "Monorepo без enforced boundaries — стає big ball of mud"
    relatedQuestions: ["b1t4q3", "b1t4q2"]
---

## Core Concept

**English definition:** Angular CLI is a command-line interface that provides scaffolding, development serving, building, testing, and deployment tooling for Angular applications, powered by an extensible builder and schematic architecture.

**Пояснення:** Angular CLI — це "швейцарський ніж" Angular developer. Одна команда `ng new` створює повноцінний проєкт з build pipeline, dev server, testing setup. `ng generate` генерує components за conventions, `ng build` створює optimized production bundles, `ng update` мігрує на нову версію з automatic code transforms.

**Яку проблему вирішує:** Без CLI потрібно самостійно налаштовувати: TypeScript compiler, bundler (esbuild/webpack), dev server з HMR, test runner, linter, і Angular-specific compilation (template → JavaScript). CLI абстрагує цю complexity та забезпечує consistent developer experience.

**Як працює під капотом:**

1. `ng` command → `@angular/cli` package → Architect API
2. Architect reads `angular.json` → determines builder для target
3. Builder (npm package) виконує task: compilation, bundling, serving
4. Schematics engine (для `ng generate`) — tree-based file transformations
5. Build pipeline: Angular compiler (ngtsc) → esbuild bundling → optimization

```
ng serve flow:
  CLI → Architect → @angular-devkit/build-angular:dev-server
    → ngtsc (template compilation)
    → esbuild (JS bundling)
    → Vite dev server (HMR, file serving)
    → Browser refresh
```

**Trade-offs та обмеження:**

- Abstracts build system — важко debug build issues без розуміння internals
- angular.json може бути складним для великих workspaces з багатьма projects
- Custom build requirements можуть потребувати ejection до custom builder
- CLI version lock з Angular version — не можна використовувати різні versions

**Версійність:**
- Angular 2: CLI beta, webpack-based
- Angular 6: Workspace concept, angular.json замість .angular-cli.json, Architect API
- Angular 8: Differential loading (ES2015 + ES5 bundles)
- Angular 12: Webpack 5 default
- Angular 16: esbuild builder (developer preview)
- Angular 17: esbuild + Vite default для нових проєктів, `application` builder
- Angular 19: `browser` builder deprecated, SSR/hydration нативна підтримка
- Angular 21: esbuild-only для нових проєктів, persistent build cache default

## Deep Details

### Edge Cases

- **Multiple projects в workspace:** angular.json підтримує кілька projects — `ng build project-name` для конкретного. defaultProject deprecated з v17, потрібен explicit project name.
- **Custom webpack config:** З esbuild builder — немає прямого доступу до webpack config. Для custom plugins потрібен `@angular-builders/custom-esbuild` або повернення до webpack builder.
- **Schematic conflicts:** При `ng generate` якщо файл вже існує — schematic не перезаписує. `--force` flag примусово перезаписує.
- **Build cache corruption:** `.angular/cache` може corrupted після version update. `ng cache clean` або видалення directory вручну.

### Junior vs Senior Understanding

**Junior** знає: "ng serve запускає проєкт, ng build збирає, ng generate створює файли."

**Senior** розуміє: CLI — це pluggable build platform. Senior знає:
- Як створити custom builder для specialized build requirements
- Як написати schematic для team conventions
- Budget configuration для performance enforcement
- Build profiling для optimization

```typescript
// Custom schematic — генерує feature module за team conventions
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function featureModule(options: { name: string }): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const path = `src/app/features/${options.name}`;

    // Generate route file
    tree.create(`${path}/${options.name}.routes.ts`, `
import { Routes } from '@angular/router';

export const ${strings.classify(options.name)}_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./${options.name}.component')
      .then(m => m.${strings.classify(options.name)}Component),
  },
];`);

    // Generate component, service, etc.
    return tree;
  };
}
```

### Deprecation & Migration Path

- **Deprecated:** `browser` builder → використовувати `application` builder
- **Deprecated:** Karma test runner → migration до Jest або Web Test Runner
- **Deprecated:** `environment.ts` file replacement → runtime configuration pattern
- **`ng update`:** Автоматично запускає migration schematics при оновленні Angular version
- **Migration від webpack:** Змінити builder в angular.json, видалити custom webpack config, знайти esbuild-compatible alternatives

### Connections to Other Concepts

- **Bootstrapping:** `ng serve` / `ng build` компілює entry point (main.ts з bootstrapApplication)
- **Standalone Components:** `ng generate component` генерує standalone за замовчуванням (v17+)
- **NgModules:** `ng generate module` все ще доступний для legacy підтримки
- **SSR:** `ng add @angular/ssr` — CLI integration для server-side rendering

## Examples

### Basic Usage

```json
// angular.json — key sections
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "projects": {
    "my-app": {
      "root": "",
      "sourceRoot": "src",
      "projectType": "application",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/my-app",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": ["{ \"glob\": \"**/*\", \"input\": \"public\" }"],
            "styles": ["src/styles.scss"],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
                { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          }
        }
      }
    }
  }
}
```

### Production Scenario

```typescript
// CI/CD build script з Nx monorepo
// package.json scripts
{
  "scripts": {
    "ci:lint": "nx affected --target=lint --base=origin/main",
    "ci:test": "nx affected --target=test --base=origin/main --ci",
    "ci:build": "nx affected --target=build --base=origin/main --configuration=production",
    "ci:e2e": "nx affected --target=e2e --base=origin/main",
    "bundle:analyze": "ng build --stats-json && npx webpack-bundle-analyzer dist/my-app/stats.json",
    "build:ssr": "ng build && ng run my-app:server"
  }
}

// Budget configuration для strict size control
// angular.json budgets
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "400kB",
    "maximumError": "600kB"
  },
  {
    "type": "anyComponentStyle",
    "maximumWarning": "4kB",
    "maximumError": "8kB"
  },
  {
    "type": "anyScript",
    "maximumWarning": "100kB",
    "maximumError": "200kB"
  }
]
```

### Anti-Example

```json
// ❌ WRONG: no budgets — bundle grows unchecked
{
  "build": {
    "builder": "@angular-devkit/build-angular:application",
    "options": {
      "outputPath": "dist",
      "browser": "src/main.ts"
    },
    "configurations": {
      "production": {
        // Немає budgets — 5MB bundle ніхто не помітить
        // Немає optimization — production без minification
      }
    }
  }
}

// ✅ CORRECT: strict budgets, proper configurations
{
  "configurations": {
    "production": {
      "budgets": [
        { "type": "initial", "maximumWarning": "400kB", "maximumError": "600kB" }
      ],
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false
    }
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| No bundle budgets | Bundle grows unchecked, performance degrades silently | Set strict budgets in angular.json, CI fails on violation |
| Using deprecated browser builder | Missing esbuild performance gains, future incompatibility | Migrate to application builder |
| Manual file creation замість ng generate | Inconsistent file structure, missing test files | Schematics з team conventions, custom schematics |
| Full build/test in CI for every PR | Slow CI, wasted resources | Nx affected commands, remote caching |
| Hardcoded environment values | No build-time optimization, security risk | fileReplacements або runtime config з APP_INITIALIZER |

## Interview Block

### [L1 — Warm-up] Які основні команди Angular CLI ви використовуєте щодня?
**Signal being tested:** Щоденний developer workflow, знання tooling
**What the interviewer expects:** ng serve, ng build, ng generate, ng test. Bonus: ng update, ng cache, flags
**How to probe deeper:** "Що таке --dry-run і коли ви його використовуєте?"
**Reference answer:** ng serve (dev server з HMR), ng build (production bundle), ng generate (code scaffolding через schematics), ng test (unit tests). ng update для version migration з automatic code transforms. --dry-run для preview changes.
**Common mistakes:** Не знають ng update; не використовують ng generate; manual file creation

### [L2 — Mid] Як структурований angular.json? Що таке builders?
**Signal being tested:** Розуміння build configuration та Angular's extensible architecture
**What the interviewer expects:** Projects → architect → targets → builder + options + configurations. Builder types.
**How to probe deeper:** "Як додати custom environment для staging?"
**Reference answer:** angular.json: workspace → projects → architect targets (build, serve, test). Кожен target має builder (npm package), options, configurations (per-environment overrides). application builder (esbuild) — default. Budgets enforce size limits. fileReplacements для environment switching.
**Common mistakes:** Не розуміють builder concept; hardcode configs замість configurations; no budgets

### [L3 — Senior] Порівняйте esbuild і webpack builders в Angular
**Signal being tested:** Глибоке розуміння build tooling та ability to make informed decisions
**What the interviewer expects:** Performance comparison, feature differences, migration path, when webpack needed
**How to probe deeper:** "Як би ви профілювали повільний build?"
**Reference answer:** esbuild (application builder): 2-4x faster, ESM output, Vite dev server. Webpack (browser builder): legacy, потрібен для Module Federation, custom plugins. Migration: builder change в angular.json. Profiling: NG_BUILD_PROFILING=1. esbuild default з v17+, webpack deprecated з v19.
**Common mistakes:** Залишаються на webpack без причини; не знають про profiling; custom webpack config без потреби

### [L4 — Staff] Як організувати build pipeline та CI/CD для великого Angular monorepo?
**Signal being tested:** Масштабне мислення — build infrastructure, team productivity, performance culture
**What the interviewer expects:** Nx, affected builds, caching strategy, budget tracking, CI pipeline design
**How to probe deeper:** "Як ви вимірюєте та покращуєте developer experience з build tooling?"
**Reference answer:** Nx workspace: affected builds (тільки змінене), computation caching (local + remote), enforced module boundaries. CI pipeline: PR (affected, <10 min) vs merge (full, <30 min). Bundle size tracking per commit з trend dashboard. Budgets в angular.json. Custom schematics для team standards. Metrics: build time, cache hit rate, bundle size trend.
**Common mistakes:** Full builds per PR; no caching; no size tracking; monorepo without boundaries

## Summary

### Key Points
- Angular CLI abstracts build complexity: compilation, bundling, serving, testing
- `angular.json` — declarative build configuration з projects, targets, builders
- esbuild builder (application) — default з v17+, 2-4x faster за webpack
- Webpack builder — legacy, потрібен для Module Federation та custom plugins
- Schematics — code generation engine, extensible для team conventions
- Budgets — build-time bundle size enforcement, critical для performance
- Nx monorepo: affected builds + computation caching + module boundaries

### Elevator Pitch (2 minutes)
"Angular CLI — це build platform з pluggable architecture. Architect API orchestrates builders (esbuild для compilation, Vite для dev server), angular.json конфігурує projects та targets. З Angular 17+ esbuild замінив webpack як default — 2-4x швидші builds. Schematics забезпечують consistent code generation. Для enterprise: budgets контролюють bundle size, Nx додає affected builds та remote caching для monorepo. ng update з migration schematics автоматизує version upgrades. Розуміння CLI internals — ключ до продуктивності Angular team."
