---
title: "Monorepo Architecture with Nx"
block: 15
topic: 2
slug: "monorepo-nx"
difficulty: 4
sinceVersion: "2"
tags: ["Nx", "monorepo", "workspace", "libraries", "affected commands", "module boundaries", "project graph"]
relatedTopics: ["project-structure", "microfrontends", "design-system"]
interviewQuestions:
  - level: "junior"
    question: "Що таке Nx monorepo і яка різниця між apps/ та libs/ в Nx workspace?"
    referenceAnswers:
      junior: "Nx — це інструмент для monorepo, де весь код в одному репозиторії. apps/ містить deployable applications, libs/ містить shared libraries."
      mid: "Nx workspace розділяє код на: apps/ (deployable applications — Angular apps, API servers, e2e tests) і libs/ (reusable libraries — feature libs, UI libs, data-access libs, util libs). Кожна library є окремою compile unit з власним tsconfig, власним barrel (index.ts) і власними тестами. Apps є consumers бібліотек — самі не містять business logic. Бізнес логіка, UI components, state — у libs."
      senior: "Nx workspace anatomy: 1) `apps/` — thin shell apps, лише routing і bootstrap. 2) `libs/` — де живе весь код. Library types: `feature` (routed pages), `ui` (presentational components), `data-access` (state management, API calls), `util` (pure functions, helpers), `types` (interfaces, enums). 3) `project.json` або `project.json` — build/test/lint targets. 4) `tsconfig.base.json` — paths mapping: `@myorg/users/feature-list` → `libs/users/feature-list/src/index.ts`. 5) `nx.json` — workspace configuration, cache settings, plugins. 6) Dependency graph: directed acyclic graph (DAG) де кожна lib є вузлом. Nx обчислює affected libs через git diff + DAG traversal."
      staff: "Nx архітектурна цінність: 1) DAG (Directed Acyclic Graph) проекту — foundation для всіх Nx features. Побудований через static analysis (imports, project.json). 2) Affected computation: `nx affected` порівнює git diff з base branch, знаходить змінені files, traverses DAG reverse щоб знайти всі залежні проекти. 3) Remote cache (Nx Cloud): хеш task inputs (source files, config, deps) → якщо хеш збігається — відновити output з cache замість виконання. 4) Distributed task execution (DTE): розподіл tasks між CI agents. 5) Module federation integration: libs/ → Webpack chunks → MFE remotes. 6) Crystal clear ownership: `project.json` може містити `owners` field для CODEOWNERS генерації. 7) Organizational impact: library type taxonomy (feature/ui/data-access/util) стає shared vocabulary між командами."
    commonMistakes:
      - "Business logic у apps/ замість libs/ — втрачається reusability і affected optimization"
      - "Одна велика lib замість composable libs — втрачається granular affected"
      - "Не розуміють що apps/ і libs/ — конвенція, не enforcement"
    relatedQuestions: ["b15t2q2", "b15t2q3"]
  - level: "mid"
    question: "Як `nx affected` прискорює CI і як Nx обчислює 'affected' projects?"
    referenceAnswers:
      junior: "Nx affected запускає тести лише для змінених модулів, не для всього репозиторію."
      mid: "`nx affected --target=test --base=main` знаходить проекти змінені або залежні від змінених. Алгоритм: 1) git diff між current branch і base. 2) Знайти libs, що містять змінені файли. 3) Traversal dependency graph — все що залежить від змінених libs також affected. Приклад: змінили `libs/shared/ui` → affected: shared/ui + всі libs/apps що її імпортують. У CI: кожен PR запускає лише affected tests, lint, build — замість повного test suite."
      senior: "Affected алгоритм деталі: 1) Nx будує project graph через static analysis (import statements, project.json deps). 2) При `nx affected`: a) `git diff --name-only base...HEAD` → список змінених файлів. b) Маппинг файл → project. c) Forward pass у DAG від змінених проектів. 3) `implicitDependencies` у project.json: якщо `.github/workflows/ci.yml` змінився — все affected. 4) `nx.json` `targetDefaults` — дефолтні inputs для tasks. `inputs` configuration: яких файлів зміна invalidates task. 5) Task hashing: hash(source files + deps + task config) → cache key. Remote cache через Nx Cloud. 6) `nx print-affected --select=projects` — вивести список для скриптів."
      staff: "Affected optimization у enterprise CI: 1) Base branch strategy: `--base=main --head=HEAD` у PR. Але merge commits на main: використовувати `--base=main~1`. 2) Nx Cloud: distributed cache — agent A будує lib, agent B отримує cache hit. 3) `nx run-many` vs `nx affected`: run-many для scheduled full builds (нічні), affected для PR gates. 4) Task pipeline: `nx.json` `targetDefaults.build.dependsOn: ['^build']` — build lib залежить від build її deps. Nx автоматично topological sort. 5) DTE (Distributed Task Execution): `nx-cloud start-ci-run` розподіляє tasks між N agents динамічно. 6) Cache poisoning prevention: outputs визначені у project.json — лише визначені outputs кешуються. 7) Метрика: в типовому monorepo з 100+ libs, affected скорочує CI час з 30 хв до 3-5 хв для невеликих PR."
    commonMistakes:
      - "Не визначають `inputs` для tasks — cache invalidation занадто часта або занадто рідка"
      - "Не налаштовують `implicitDependencies` для shared config files"
      - "Запускають `nx affected` без base branch — порівнює з поточним HEAD, завжди 0 changed"
    relatedQuestions: ["b15t2q1", "b15t2q3"]
  - level: "mid"
    question: "Як `@nx/enforce-module-boundaries` ESLint rule захищає архітектуру?"
    referenceAnswers:
      junior: "Це ESLint правило, що не дозволяє бібліотекам імпортувати одна одну якщо це заборонено архітектурними правилами."
      mid: "`@nx/enforce-module-boundaries` читає `tags` з project.json і `depConstraints` з `.eslintrc.json`. Теги позначають тип і domain lib: `scope:users`, `type:feature`. depConstraints: `{ sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:data-access', 'type:ui', 'type:util'] }`. Feature lib не може імпортувати іншу feature lib. Порушення = lint error. Enforced при `nx lint` і у pre-commit hooks."
      senior: "Module boundary enforcement деталі: 1) Tags у project.json: `'tags': ['scope:users', 'type:feature-shell']`. Кілька тегів: ORed при matching. 2) depConstraints: масив об'єктів. 3) `allowedExternalImports`: контроль npm packages per lib type. 4) `banTransitiveDependencies`: заборона не-direct deps. 5) `checkDynamicDependenciesExceptions`: виключення для dynamic imports. 6) Типова constraint matrix: util → нічого з проекту; data-access → util, types; ui → util, types; feature → data-access, ui, util, types; app → будь-що. 7) Cross-scope: `scope:users` lib не може імпортувати `scope:products` lib без прямої залежності у constraints. 8) Enforcement у CI: `nx affected --target=lint`."
      staff: "Module boundaries як organizational governance: 1) Tag taxonomy design: `type:*` для vertical layers, `scope:*` для domain/team. `platform:*` для web/mobile. 2) Migrating a violating import: introduce abstraction у shared lib або event-driven communication. 3) Gradual enforcement: `nx migrate` + поступово enable constraints. 4) Custom rules: `@nx/enforce-module-boundaries` extensible через `banTransitiveDependencies`. 5) Boundary violations як архітектурний debt: кожне violation = explicit coupling між domains. Tracking via `nx graph` + `nx list`. 6) Team agreements: constraint matrix у ADR (Architecture Decision Record). Changes до constraints = pull request з cross-team review. 7) Психологічний ефект: lint error одразу при збереженні (ESLint у IDE) — developer corrects violation перед commit. Набагато дешевше ніж code review пізніше."
    commonMistakes:
      - "Теги не consistent — 'feature' і 'Feature' — два різних тега"
      - "Всі libs з одним тегом — enforcement не granular"
      - "depConstraints визначені але не enforced у CI"
    relatedQuestions: ["b15t2q2", "b15t2q4"]
  - level: "senior"
    question: "Як побудувати Nx project graph і що він показує?"
    referenceAnswers:
      junior: "Project graph показує залежності між libs і apps у monorepo. `nx graph` відкриває його у браузері."
      mid: "`nx graph` або `nx dep-graph` (legacy) відображає DAG всіх projects та їх dependencies. Можна фільтрувати: `nx graph --focus=my-lib` — лише ті, що залежать від або залежать від my-lib. `nx graph --affected --base=main` — лише affected. Корисно для: виявлення unexpected dependencies, circular deps (Nx помічає), planning refactoring, understanding blast radius зміни."
      senior: "Project graph internals: 1) Побудований через static analysis: TypeScript import statements + project.json `implicitDependencies`. 2) Angular-specific: Nx Angular plugin аналізує `@NgModule`, `@Component` imports. 3) Nodes: кожен project (app або lib). 4) Edges: dependency (import), implicit dependency (project.json). 5) DAG: directed acyclic — circular deps = error. 6) `nx graph --file=output.json` — export для custom tooling. 7) `nx ls-projects` — список всіх projects. 8) `nx show project my-lib` — деталі конкретного project. 9) Graph використовується: affected computation, task scheduling, DTE distribution, module boundary checking."
      staff: "Project graph як living architecture documentation: 1) Graph є source of truth для архітектурних рішень. 2) Automated architecture validation: CI job що порівнює граф з ADR-описаними constraints. 3) Graph evolution over time: snapshot граф у різні моменти — track як architecture змінюється. 4) Blast radius analysis: перед merge PR — перевірити `nx affected` список, якщо > threshold libs — обов'язковий архітектурний review. 5) Orphaned libs detection: libs без жодного consumer — candidates для видалення. Script: parse `nx graph --file` JSON, find nodes with 0 in-edges except apps. 6) Dependency cycles у deps: якщо виявлені — обов'язкова root cause analysis перед merge. 7) Custom Nx plugins: можна розширити graph побудову для non-standard import patterns (динамічні imports, runtime federation)."
    commonMistakes:
      - "Ігнорують project graph до виникнення проблем — краще регулярно переглядати"
      - "Не налаштовують implicit dependencies для shared config"
      - "Не використовують graph для planning refactoring"
    relatedQuestions: ["b15t2q3", "b15t2q5"]
  - level: "staff"
    question: "Як організувати Nx workspace для 5 команд з різними доменами і спільним design system?"
    referenceAnswers:
      junior: "Кожна команда має свою папку в libs/, спільний дизайн у shared/."
      mid: "Структура: libs/[team-domain]/ для кожної команди. libs/shared/ui для design system. libs/shared/data-access для shared state. CODEOWNERS: кожна команда owns свій domain. Shared libs — cross-team review required."
      senior: "Multi-team Nx structure: `libs/users/`, `libs/products/`, `libs/orders/`, `libs/shared/`. Кожен domain: `feature-shell`, `feature-list`, `feature-detail`, `data-access`, `ui`. Shared: `libs/shared/ui` (design system), `libs/shared/util`, `libs/shared/types`. Tags: `scope:users`, `scope:shared`. Constraints: `scope:users` → `scope:shared`, не → `scope:products`. CODEOWNERS: `libs/users/** @users-team`. Design system lib: versioned окремо, Storybook у `apps/storybook`."
      staff: "Enterprise multi-team Nx governance: 1) Domain taxonomy: first-class domains (users, products, orders) + platform (shared, core, infra). 2) Library ownership enforcement: CODEOWNERS + branch protection — зміна у чужому domain = required review від owners. 3) Design system as internal package: `libs/shared/ui` з version policy. Breaking changes потребують migration guide. Storybook як живий документ. 4) Cross-domain communication contracts: `libs/shared/types` — interfaces що не belong до жодного domain. Events: `libs/shared/events` — domain events для cross-domain interactions. 5) Feature team autonomy: команда може працювати у своєму domain без координації з іншими (крім shared/). 6) Shared lib change process: RFC/ADR → cross-team PR review → staged rollout. 7) Nx Cloud організація: workspace-level cache sharing між всіма agents. Team-level cache namespacing якщо потрібна ізоляція. 8) Onboarding: project graph як перший ознайомлювальний матеріал — показує систему цілком."
    commonMistakes:
      - "Shared libs без ownership — стають nobody's responsibility"
      - "Надто багато cross-domain dependencies — порушення domain boundaries"
      - "Shared design system без versioning — breaking changes ламають всіх"
    relatedQuestions: ["b15t2q4", "b15t1q5"]
---

## Core Concept

**English definition:** Nx is a smart, extensible build system and monorepo tool that provides a structured workspace with code generators, task runners, affected computation, caching, and dependency graph visualization for managing large-scale Angular (and polyglot) codebases.

**Пояснення:** Nx monorepo — це підхід, де весь код організації живе в одному репозиторії, але зберігає чітку структуру через libs і apps. Замість десятків окремих репозиторіїв з npm publish/consume циклом — все в одному місці з миттєвими cross-project refactors і shared tooling. Nx додає до цього intelligence: розуміє залежності між проектами, кешує build outputs і запускає лише те, що дійсно змінилось.

**Яку проблему вирішує:** 1) Polyrepo проблеми: синхронізація versions між repos, неможливість атомарного cross-repo рефакторингу, дублювання конфігурацій (eslint, tsconfig, jest). 2) Monorepo без tooling: весь CI запускає всі тести навіть якщо змінена одна lib. 3) Архітектурний decay: без enforcement будь-хто може імпортувати будь-що. 4) CI час: тисячі тестів для кожного PR.

**Як працює під капотом:** Nx будує Directed Acyclic Graph (DAG) проектів через static analysis TypeScript imports і `project.json` конфігурацій. При `nx affected`: git diff → змінені файли → mapping до projects → forward DAG traversal від змінених nodes → результат: affected project set. Task hashing: для кожної task обчислюється hash(source files + task config + deps outputs) → порівняння з Nx Cloud remote cache → cache hit = skip execution. Distributed Task Execution: Nx Cloud coordinator розподіляє tasks між CI agents за топологічним порядком залежностей.

**Trade-offs та обмеження:** Monorepo потребує потужного CI (або Nx Cloud для distributed execution). Initial setup складніший ніж polyrepo. Всі команди шерять git history — merge conflicts можливі у shared configs. Large monorepo: `git clone` і `git status` сповільнюються (git sparse checkout або git partial clone як рішення). Nx версіонування: сам Nx і його плагіни потребують синхронного оновлення.

**Версійність:** Nx (раніше Nrwl) існує з 2017. Angular підтримка — з початку. Nx 16: Project Crystal — `project.json` може бути виведений з `package.json`, plugins inference. Nx 17: Nx Cloud workspace plans. Nx 18+: First-class Vite support для Angular. `@nx/angular` — офіційний Angular plugin. `nx migrate` для автоматичного оновлення workspace.

## Deep Details

### Edge Cases

**Cache poisoning:** Якщо `outputs` у project.json неправильно визначені — файли що не є output можуть бути відновлені з cache, або навпаки. Завжди явно визначати `outputs: ['{options.outputPath}']`.

**Affected і merge commits:** На main branch `nx affected --base=main~1` потрібен для порівняння з попереднім commit, бо `--base=main` порівнює з собою (0 diff).

**Circular dependencies:** Nx виявляє circular deps між projects і помічає у project graph. Circular dep у одній lib (A imports B imports A) — TypeScript error, не Nx.

**TypeScript paths і IDE:** `tsconfig.base.json` paths mapping `@myorg/lib` → `libs/lib/src/index.ts` потрібен для IDE auto-import і TypeScript. При додаванні нової lib через `nx generate` — paths додаються автоматично.

### Junior vs Senior Understanding

**Junior** знає що `nx affected` рятує час у CI і що libs/ — для reusable коду.

**Senior** розуміє: 1) DAG traversal алгоритм і як `inputs`/`outputs` конфігурація впливає на cache. 2) Module boundary tag taxonomy як governance tool. 3) Як Nx task pipeline (`dependsOn`) замінює ручне управління build order. 4) Різницю між Nx cache і Nx Cloud remote cache. 5) Як `nx generate` + executor plugins стандартизують code generation і tooling у великих командах.

### Deprecation & Migration Path

**`workspace.json`:** Deprecated на користь `project.json` (per-project). `nx migrate` автоматично конвертує. **`nx.json` `workspaceLayout`:** Deprecated у Nx 16 — layout визначається через plugins. **Class-based executors:** Замінюються на function-based. **`angular.json`:** У Nx workspace — замінений на `project.json` per project. `ng add @nx/angular` або `nx init` для міграції існуючого Angular CLI проекту до Nx.

### Connections to Other Concepts

- **Project Structure (Block 15, Topic 1):** Nx formalize project structure на workspace рівні.
- **Micro-frontends (Block 15, Topic 3):** Nx + Module Federation — офіційна інтеграція через `@nx/angular:module-federation-*` generators.
- **Design System (Block 15, Topic 4):** Nx publishable libs для design system packages.
- **Change Detection (Block 9):** `nx affected` не замінює потребу у performance optimization — лише CI.

## Examples

### Basic Usage

```bash
# Створення Nx workspace
npx create-nx-workspace@latest myorg --preset=angular-monorepo

# Структура workspace
# myorg/
# ├── apps/
# │   ├── shell/                    — Angular shell app
# │   └── shell-e2e/                — E2E tests
# ├── libs/
# │   ├── users/
# │   │   ├── feature-shell/        — routing + lazy pages
# │   │   ├── feature-list/         — UserListPage component
# │   │   ├── data-access/          — UserStore + API service
# │   │   └── ui/                   — UserCard, UserAvatar (dumb components)
# │   └── shared/
# │       ├── ui/                   — design system components
# │       └── util/                 — pure helpers
# ├── nx.json
# └── tsconfig.base.json

# Генерація нової library
nx generate @nx/angular:library feature-list --directory=libs/users/feature-list \
  --tags="scope:users,type:feature"

# Генерація компонента у lib
nx generate @nx/angular:component user-list \
  --project=users-feature-list \
  --standalone

# Запуск affected тестів
nx affected --target=test --base=main --head=HEAD

# Відкрити project graph
nx graph
```

```typescript
// tsconfig.base.json — paths для library imports
{
  "compilerOptions": {
    "paths": {
      "@myorg/users/feature-list": ["libs/users/feature-list/src/index.ts"],
      "@myorg/users/data-access": ["libs/users/data-access/src/index.ts"],
      "@myorg/shared/ui": ["libs/shared/ui/src/index.ts"],
      "@myorg/shared/util": ["libs/shared/util/src/index.ts"]
    }
  }
}

// libs/users/feature-list/src/index.ts — barrel export
export { UserListComponent } from './lib/user-list/user-list.component';
export { USER_LIST_ROUTES } from './lib/user-list.routes';

// apps/shell/src/app/app.routes.ts — lazy load feature lib
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    loadChildren: () =>
      import('@myorg/users/feature-shell').then(m => m.USER_SHELL_ROUTES),
  },
];
```

### Production Scenario

```json
// libs/users/feature-list/project.json
{
  "name": "users-feature-list",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/users/feature-list/src",
  "projectType": "library",
  "tags": ["scope:users", "type:feature"],
  "targets": {
    "build": {
      "executor": "@nx/angular:ng-packagr-lite",
      "outputs": ["{workspaceRoot}/dist/libs/users/feature-list"],
      "options": {
        "project": "libs/users/feature-list/ng-package.json"
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/libs/users/feature-list"],
      "options": {
        "jestConfig": "libs/users/feature-list/jest.config.ts"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["libs/users/feature-list/**/*.ts"]
      }
    }
  }
}
```

```json
// .eslintrc.json — module boundary rules
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "enforceBuildableLibDependency": true,
        "allow": [],
        "depConstraints": [
          {
            "sourceTag": "type:feature",
            "onlyDependOnLibsWithTags": [
              "type:feature",
              "type:data-access",
              "type:ui",
              "type:util",
              "type:types"
            ]
          },
          {
            "sourceTag": "type:data-access",
            "onlyDependOnLibsWithTags": ["type:util", "type:types"]
          },
          {
            "sourceTag": "type:ui",
            "onlyDependOnLibsWithTags": ["type:util", "type:types"]
          },
          {
            "sourceTag": "scope:users",
            "onlyDependOnLibsWithTags": ["scope:users", "scope:shared"]
          }
        ]
      }
    ]
  }
}
```

### Anti-Example

```typescript
// ПОГАНО: Business logic у app, не у lib
// apps/shell/src/app/users/user.service.ts  ← НЕ у lib!
// apps/shell/src/app/users/user-list.component.ts  ← НЕ у lib!
// Результат: код не reusable, не affected-optimized,
// немає module boundary enforcement

// ПОГАНО: Імпорт поза barrel (deep import)
// ❌ Порушення public API contract
import { UserListComponent } from '@myorg/users/feature-list/lib/user-list/user-list.component';
// ✅ Правильно — через barrel
import { UserListComponent } from '@myorg/users/feature-list';

// ПОГАНО: Crosss-scope dependency без явного дозволу
// libs/users/feature-list/src/lib/user-list.component.ts
import { ProductService } from '@myorg/products/data-access'; // ❌ scope:users → scope:products
// Nx lint error: "A project tagged with 'scope:users' can only depend on
// libs tagged with 'scope:users' or 'scope:shared'"

// ПОГАНО: Circular dependency
// libs/shared/ui → imports from libs/users/data-access
// libs/users/data-access → imports from libs/shared/ui
// Nx graph помічає cycle і виводить error при build
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Business logic у apps/, не у libs/ | Код не reusable, не affected-optimized, немає module boundary enforcement | Весь business logic у libs/, apps/ — thin bootstrapping |
| Одна величезна shared/ui lib | Bottleneck для всіх команд, будь-яка зміна affected всіх | Розбити на domain-specific UI libs + core design system lib |
| Теги не consistent або відсутні | depConstraints не працюють, boundary enforcement неможливий | Строга tag taxonomy: `scope:*` + `type:*`, обов'язкові для всіх libs |
| Deep imports поза barrel (index.ts) | Порушує public API contract, breaking при internal refactor | Завжди імпортувати через `@myorg/lib-name`, не через internal paths |
| `nx affected` без налаштованих inputs/outputs | Cache miss занадто часто або cache hit на stale data | Явно визначити `inputs` і `outputs` для кожного target у project.json |

## Interview Block

### [L1 — Warm-up] Що таке Nx monorepo і яка різниця між apps/ та libs/?

**Signal being tested:** Базове розуміння монорепо підходу і організаційних принципів Nx.

**What the interviewer expects:** apps = deployable, libs = reusable code. Розуміння чому business logic у libs.

**How to probe deeper:** "Чому важливо тримати business logic у libs/, а не у apps/?"

**Reference answer:** Nx workspace: apps/ — thin deployable applications (лише bootstrap і routing), libs/ — весь business logic, UI, state. Причина: libs мають barrel exports (public API), module boundary enforcement і optimized affected computation. Код у apps/ ніколи не reusable.

**Common mistakes:** Думають що apps/ і libs/ — просто organizational folders без architectural implications.

---

### [L2 — Mid] Як `nx affected` прискорює CI?

**Signal being tested:** Розуміння DAG-based affected computation і практичне застосування у CI pipelines.

**What the interviewer expects:** Алгоритм: git diff → projects → DAG traversal. Конкретна команда. Чому це важливо.

**How to probe deeper:** "Якщо змінили `libs/shared/ui` — які проекти будуть affected?"

**Reference answer:** `nx affected --target=test --base=main` — знаходить змінені файли через git diff, маппить на projects, traverses DAG forward — всі залежні projects також affected. Змінили shared/ui → affected всі libs і apps що її імпортують. У CI: тести лише для affected, не для всього workspace. На 100 libs — з 30 хв до 3-5 хв для типового PR.

**Common mistakes:** Запускають `nx affected` без `--base` — порівнює з HEAD, завжди 0 affected.

---

### [L3 — Senior] Як `@nx/enforce-module-boundaries` захищає архітектуру і як налаштувати constraint matrix?

**Signal being tested:** Здатність спроектувати tag taxonomy і constraint matrix як governance tool, розуміння enforcement механізму.

**What the interviewer expects:** Tags у project.json, depConstraints у eslint config, типова constraint matrix (feature→data-access→util).

**How to probe deeper:** "Якщо команда хоче cross-scope dependency — як правильно вирішити це без порушення boundaries?"

**Reference answer:** Tags: `scope:users`, `type:feature` у project.json. depConstraints: sourceTag `type:feature` → onlyDependOnLibsWithTags `['type:data-access', 'type:ui', 'type:util']`. Cross-scope: вводять shared abstraction у `libs/shared/types` або event-based communication. ESLint error при порушенні — в IDE одразу, у CI через `nx affected --target=lint`.

**Common mistakes:** Inconsistent tags (великі/малі літери). depConstraints визначені але не enforced у CI.

---

### [L4 — Staff/Principal] Як організувати Nx workspace для 5 команд з різними доменами і спільним design system?

**Signal being tested:** Системне мислення про multi-team governance, Conway's Law, ownership і CI optimization.

**What the interviewer expects:** Domain grouping, CODEOWNERS, design system versioning strategy, cross-domain communication contracts.

**How to probe deeper:** "Як ти організуєш process для зміни shared/ui бібліотеки щоб не блокувати 5 команд?"

**Reference answer:** Structure: `libs/[domain]/[type]-[feature]`. Tags: `scope:[domain]` + `type:[feature|ui|data-access|util]`. CODEOWNERS: domain teams own their libs. Shared/ui: cross-team RFC process, Storybook, versioning. Cross-domain events у `libs/shared/events`. Nx Cloud: distributed execution для all teams. Breaking changes у shared libs — staged rollout з migration guides.

**Common mistakes:** Shared libs без ownership стають nobody's responsibility. Cross-domain deps через direct imports замість shared abstractions.

## Summary

### Key Points

- Nx workspace: apps/ = thin deployable shells, libs/ = весь business logic з barrel exports і ownership boundaries
- Affected computation: git diff → project mapping → DAG traversal — тести лише для змінених і залежних projects
- `@nx/enforce-module-boundaries`: tag taxonomy + depConstraints = lint-enforced architectural boundaries
- Library types: feature (routing), ui (presentational), data-access (state/API), util (pure), types (interfaces)
- Nx cache: hash(inputs) → remote cache hit = skip execution; до 10x прискорення CI
- Project graph: living architecture documentation, blast radius analysis, circular dep detection
- `tsconfig.base.json` paths: `@myorg/lib` → `libs/lib/src/index.ts` — deep imports неможливі

### Elevator Pitch (2 minutes)

Nx перетворює великий Angular monorepo з хаосу на structured workspace. Ключові принципи: весь business logic у libs/ (не apps/), кожна lib має typed tags (scope/type), ESLint enforcement не дозволяє cross-boundary imports. Affected commands: Nx будує DAG залежностей і запускає CI лише для реально змінених проектів — замість 30 хвилин повного suite отримуємо 3-5 хвилин на PR. Remote caching через Nx Cloud: hash task inputs → якщо builder A вже зробив цю task — builder B отримує результат з cache. Результат: команда з 10+ розробників на 100+ libs має передбачувану архітектуру, швидкий CI і чіткі ownership boundaries.
