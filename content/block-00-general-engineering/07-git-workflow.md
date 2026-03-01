---
title: "Git Workflow & Collaboration"
block: 0
topic: 7
slug: "git-workflow"
difficulty: 2
tags: ["git", "branching", "merge", "rebase", "monorepo", "conventional-commits", "ci-cd"]
relatedTopics: ["anti-patterns"]
interviewQuestions:
  - level: "junior"
    question: "Яка різниця між git merge і git rebase?"
    referenceAnswers:
      junior: "Merge створює новий commit що об'єднує дві гілки. Rebase переміщує коміти однієї гілки на кінець іншої. Merge зберігає історію, rebase робить її лінійною."
      mid: "Merge створює merge commit з двома батьківськими комітами — зберігає повну історію розгалуження. Rebase переписує історію, створюючи нові коміти з тим самим змістом але іншими SHA. Merge безпечніший для shared branches, rebase — для local feature branches перед merge. Правило: ніколи не rebase те що вже запушено і шариться з іншими. В Angular проєктах з monorepo (Nx) rebase preferred для чистої git log."
      senior: "Merge vs rebase — це trade-off між історичною точністю та читабельністю. Merge зберігає DAG (directed acyclic graph) розгалужень — корисно для audit trail і розуміння коли feature branch відгалузився. Rebase створює лінійну історію — спрощує git bisect, blame, і rollback. Interactive rebase (rebase -i) дозволяє squash, fixup, reorder коміти перед merge — критично для чистої історії. Fast-forward merge (git merge --ff-only) можливий тільки після rebase — без зайвого merge commit. Для Angular monorepo: squash merge в main зберігає один commit per feature, спрощує changelog generation з conventional commits."
      staff: "Стратегія merge/rebase — це team-level рішення що впливає на CI/CD pipeline, bisect reliability, і changelog generation. В enterprise Angular monorepo з 50+ розробниками: 1) Trunk-based development з short-lived branches (< 2 дні). 2) Squash merge в main — один commit per feature/fix, commit message = PR title з conventional commit format. 3) Rebase для sync з main перед merge — уникаємо merge conflicts в CI. 4) Protected main branch з required linear history — забороняє merge commits. 5) Automated release notes з conventional commits. Проблема rebase в великих командах: якщо два розробники rebase одну branch — force push конфлікт. Рішення: кожна branch має одного owner. Merge commits корисні для rollback цілої feature (git revert -m 1 <merge-commit>), але squash merge дозволяє простіший revert одного коміту. Вибір залежить від release cadence: continuous deployment → squash merge, release trains → merge commits для feature grouping."
    commonMistakes:
      - "Rebase shared branches — переписують історію для інших розробників"
      - "Не знають про interactive rebase для cleanup комітів"
    relatedQuestions: ["b0t7q2"]
  - level: "mid"
    question: "Що таке conventional commits і як вони використовуються в Angular проєктах?"
    referenceAnswers:
      junior: "Conventional commits — це стандарт написання commit messages з префіксами типу feat:, fix:, docs:. Це допомагає зрозуміти що змінилось."
      mid: "Conventional commits — специфікація для структурованих commit messages: type(scope): description. Types: feat (нова функціональність), fix (виправлення), refactor, perf, test, docs, chore, ci. Angular сам використовує цей формат — він був створений Angular командою. Scope вказує на модуль: feat(router): add lazy loading. BREAKING CHANGE в footer тригерить major version bump. Інструменти: commitlint для валідації, husky для git hooks, standard-version/release-please для automated releases."
      senior: "Conventional commits — foundation для automated semantic versioning та changelog generation. В Angular ecosystem: 1) Angular сам слідує цій конвенції — подивіться angular/angular commits. 2) Nx workspace generators додають commitlint config автоматично. 3) Semantic release pipeline: conventional commit → визначення version bump (feat → minor, fix → patch, BREAKING CHANGE → major) → changelog generation → npm publish → git tag. Scope hierarchy в monorepo: feat(shared-ui): або fix(feature-auth):. Для PR workflow: squash merge з PR title як commit message — title має бути conventional format. CI validation: commitlint в pre-commit hook (local) + GitHub Action (remote). Проблема: розробники часто пишуть generic messages ('fix stuff') — commitlint + PR template enforcement вирішує це."
      staff: "Conventional commits — це contracts для automation pipeline. В enterprise Angular monorepo: 1) Commit convention як частина Definition of Done — PR не мержиться без proper conventional commit. 2) Monorepo-aware scopes — Nx affected визначає які packages змінились, scope повинен відповідати Nx project name. 3) Automated CHANGELOG per package — lerna/nx release читає conventional commits і генерує changelog для кожного package окремо. 4) Release orchestration — feat commit в shared library тригерить minor release library → patch release всіх залежних apps (через dependency graph). 5) Breaking change protocol: BREAKING CHANGE commit → automated migration schematic (як Angular робить для major versions) → deprecation notice в попередньому minor release. 6) Commit metadata для observability: link до Jira ticket в footer, co-authors для pair programming. Це інвестиція в developer experience — початковий overhead окупається через automated releases, searchable history, і автоматичну документацію змін."
    commonMistakes:
      - "Використовують неправильні types — refactor замість fix коли виправляють баг"
      - "Не вказують scope в monorepo — незрозуміло який package змінився"
      - "Ігнорують BREAKING CHANGE footer — major version не бампається автоматично"
    relatedQuestions: ["b0t7q1", "b0t7q3"]
  - level: "senior"
    question: "Як організувати Git workflow для Angular monorepo з Nx?"
    referenceAnswers:
      junior: "Monorepo — це коли весь код в одному репозиторії. Nx допомагає керувати багатьма проєктами в одному repo."
      mid: "Nx monorepo містить apps і libs. Git workflow: trunk-based з feature branches. Nx affected визначає які проєкти змінились і запускає тести тільки для них. CI pipeline: nx affected:test, nx affected:build. Branch protection: required status checks для affected projects. Кожна lib має CODEOWNERS — PR потребує review від team що володіє library."
      senior: "Git workflow для Nx monorepo: 1) Trunk-based development — main завжди deployable, feature branches < 2 дні. 2) nx affected --base=origin/main — CI тестує тільки змінені проєкти та їх dependents. 3) Branch protection: required linear history, minimum 1 approval, CODEOWNERS для shared libs. 4) PR pipeline: lint (nx affected:lint) → test (nx affected:test) → build (nx affected:build) → e2e (nx affected:e2e) — parallelized. 5) Nx Cloud для distributed caching та task execution — CI час O(affected) замість O(all). 6) Conventional commits з Nx project scopes → automated changelog per project. 7) Release strategy: independent versioning для libs, app deployment через affected + deployment tags. Проблема масштабу: великий monorepo = великий git history. Рішення: shallow clone в CI (--depth=1), git sparse-checkout для локальної розробки."
      staff: "Git workflow для enterprise Nx monorepo (100+ libs, 50+ devs): 1) Repository structure: apps/, libs/shared/, libs/feature-*, libs/data-access-*, libs/ui-* — Nx enforce boundaries через module boundary rules. 2) Branching: trunk-based з feature flags для long-running features (не feature branches). Feature branches максимум 1-2 дні, stacked PRs для великих changes. 3) CI architecture: Nx Cloud agents для distributed task execution — 30-хвилинний pipeline стає 5-хвилинним. GitHub Actions matrix strategy + Nx affected для parallel jobs. 4) CODEOWNERS granularity: per-library ownership, platform team owns shared/*, feature teams own feature-*. Automated CODEOWNERS generation з Nx project graph. 5) Merge queue (GitHub merge queue) — serializes merges в main, запускає final CI check з latest main — eliminates 'green PR but broken main' scenario. 6) Git LFS для assets, .gitattributes для consistent line endings across OS. 7) Pre-commit: nx format:check (prettier), commitlint, lint-staged для affected files only. 8) Disaster recovery: main protected, force push disabled, automated backups. 9) Metrics: PR cycle time, time-to-merge, CI reliability — tracked для continuous improvement. Ключовий принцип: git workflow служить delivery velocity, не bureaucracy."
    commonMistakes:
      - "Запускають CI для всіх проєктів замість nx affected — повільний pipeline"
      - "Не використовують CODEOWNERS — PR мержаться без review від team що володіє кодом"
      - "Feature branches живуть тижнями — merge conflicts, stale code"
    relatedQuestions: ["b0t7q2", "b0t7q4"]
  - level: "staff"
    question: "Як спроектувати CI/CD pipeline для Angular додатку від commit до production?"
    referenceAnswers:
      junior: "CI/CD — це автоматичний процес тестування і деплою. Для Angular: ng test для тестів, ng build для збірки, потім deploy на сервер."
      mid: "CI pipeline: 1) Install deps (npm ci). 2) Lint (ng lint). 3) Unit tests (ng test --watch=false --code-coverage). 4) Build (ng build --configuration production). 5) E2E tests. CD pipeline: build artifacts → staging → smoke tests → production. Environment configs через Angular environments або runtime config. Docker image з nginx для serving static files."
      senior: "CI/CD для Angular: CI: 1) Cache management — npm ci з node_modules cache, Nx computation cache. 2) Parallel stages: lint + unit tests паралельно, потім build (залежить від lint pass). 3) ng build --configuration production — AOT, tree-shaking, budgets (перевірка bundle size). 4) Bundle analysis — source-map-explorer, розмір < budget. 5) E2E з Playwright/Cypress на built artifacts. 6) Security: npm audit, Snyk/Dependabot. CD: 1) Docker multi-stage build (build stage: node, serve stage: nginx). 2) Environment-specific config через runtime injection (не compile-time environments). 3) Deployment strategy: blue-green або canary. 4) CDN для static assets з cache busting (Angular додає content hash до filenames). 5) Feature flags для progressive rollout. 6) Rollback plan: previous Docker image або git revert + re-deploy."
      staff: "CI/CD architecture для enterprise Angular: CI: 1) Event-driven pipeline: PR open → lint + test + build + preview deploy; PR merge → release pipeline. 2) Nx affected в CI — тестуємо тільки змінене. Nx Cloud remote cache — якщо хтось вже зробив цей build, результат береться з cache. 3) Quality gates: unit test coverage > threshold (не 100%, а meaningful — 80% statements), bundle budgets (initial < 300KB, lazy chunk < 100KB), Lighthouse CI (performance > 90). 4) Security gate: SAST (SonarQube), dependency audit, license compliance check. 5) Preview deployments per PR — stakeholders бачать зміни до merge. CD: 1) GitOps — merge в main тригерить release pipeline автоматично. 2) Semantic release з conventional commits — version bump, changelog, npm publish для libs, Docker build для apps. 3) Progressive delivery: canary deployment (5% → 25% → 50% → 100%) з automated rollback на error rate spike. 4) Multi-environment: dev → staging → production з promotion-based deployment (один artifact проходить всі environments). 5) Runtime configuration через config endpoint або environment variables injected в Docker — не rebuild per environment. 6) Observability integration: deployment markers в Datadog/Grafana, error tracking (Sentry) linked to releases. 7) Database migrations coordinated з deployment (якщо BFF/backend в monorepo). 8) Disaster recovery: automated rollback trigger на P1 alert, blue-green для instant rollback. Pipeline ownership: platform team owns pipeline templates, feature teams customize per-project. Метрика успіху: deployment frequency (daily+), lead time for changes (< 1 day), MTTR (< 1 hour), change failure rate (< 5%)."
    commonMistakes:
      - "Rebuild для кожного environment замість одного artifact з runtime config"
      - "Не використовують cache в CI — кожен build починає з нуля"
      - "Деплой прямо в production без staging та canary"
      - "Ігнорують bundle size budgets — додаток росте непомітно"
    relatedQuestions: ["b0t7q3"]
---

## Core Concept

**English definition:** Git workflow defines the branching strategy, merge policies, commit conventions, and CI/CD integration that govern how a team collaborates on code. For Angular projects, this includes monorepo tooling (Nx), conventional commits, and Angular-specific build/deploy pipelines.

**Пояснення:** Git workflow — це не просто "як комітити код". Це системний процес що визначає: як команда працює паралельно (branching), як інтегрує зміни (merge/rebase), як документує зміни (conventional commits), як автоматизує якість (CI) і доставку (CD). Для Angular це особливо важливо через monorepo підхід (Nx), складний build pipeline (AOT, tree-shaking, budgets), і ecosystem конвенції (Angular team сама використовує conventional commits та squash merge).

**Яку проблему вирішує:** Без формалізованого workflow: merge conflicts блокують команду, git history нечитабельна, releases ручні та error-prone, баги потрапляють в production без gate. Правильний workflow перетворює git з "save points" на delivery pipeline — від коміту до production за хвилини з автоматичними перевірками якості.

**Як працює під капотом:**

Git під капотом — content-addressable filesystem. Кожен commit — snapshot всього проєкту (не diff), з pointer на parent commit(s). Branch — pointer на commit. Merge створює commit з двома parents. Rebase створює нові commits з новими SHA (бо parent змінився).

```
# Git Flow (heavyweight)
main ──────●──────────●──────────●──── releases
            \        / \        /
develop ─────●──●──●────●──●──●───── integration
              \  /        \  /
feature ───────●───        ●──────── short-lived

# Trunk-Based (lightweight, recommended for Angular)
main ────●──●──●──●──●──●──●──●──── always deployable
          \/ \/ \/  \/  \/ \/
feature    ●  ●  ●   ●   ●  ●────── < 2 days, squash merge
```

CI/CD для Angular:
1. **Pre-commit** — lint-staged, commitlint (local)
2. **PR pipeline** — `nx affected:lint` → `nx affected:test` → `nx affected:build` → preview deploy
3. **Merge pipeline** — semantic release → Docker build → staging deploy → smoke tests → production

```bash
# Nx affected — ключова оптимізація для Angular monorepo
# Визначає які проєкти змінились відносно main
npx nx affected:test --base=origin/main
npx nx affected:build --base=origin/main --configuration=production

# Angular production build з budgets
ng build --configuration production
# angular.json budgets:
# { "type": "initial", "maximumWarning": "250kb", "maximumError": "500kb" }
```

**Trade-offs та обмеження:**

- Trunk-based потребує feature flags для incomplete features — додаткова інфраструктура
- Squash merge втрачає granular history — важче debug через git bisect окремих комітів всередині PR
- Monorepo git history росте — clone стає повільним (рішення: shallow clone, sparse checkout)
- Conventional commits потребують enforcement — без tooling конвенція деградує

**Як Angular це використовує:**

- **Angular repo (github.com/angular/angular)** — monorepo з conventional commits, squash merge, automated changelog
- **Commit format:** `feat(core): add signal-based inputs` — scope = Angular package
- **CI:** кожен PR запускає bazel build + тести для affected packages
- **Release:** semantic versioning на основі conventional commits — feat → minor, fix → patch, BREAKING CHANGE → major
- **Nx** — створений core Angular contributors (Nrwl) для Angular monorepo management
- **ng update** — schematics для automated migration, версіонування через semver

## Deep Details

### Edge Cases

- **Merge conflict у lock file:** `package-lock.json` / `yarn.lock` — не мержити вручну. Рішення: `npm install` після merge для regeneration, або git merge strategy для lock files.
- **Rebase з merge commits:** `git rebase --rebase-merges` зберігає merge topology. Без цього флагу merge commits втрачаються.
- **Detached HEAD в CI:** CI runners часто checkout specific commit (не branch) — detached HEAD. Для Nx affected потрібен `--base` і `--head` explicit.
- **Circular dependency в Nx:** Library A imports B, B imports A — Nx module boundary rule не спіймає якщо обидві в одному scope. Рішення: `nx graph` для візуалізації, enforce unidirectional dependencies.

### Junior vs Senior Understanding

**Junior** знає: git add, commit, push, pull, basic branching, resolve conflicts в IDE.

**Senior** розуміє:
- Git як DAG — merge/rebase як graph operations
- Workflow як delivery mechanism — від commit до production
- Automation: conventional commits → semantic versioning → automated changelog → release
- Monorepo specifics: affected computation, distributed caching, CODEOWNERS

```bash
# Senior-level: налаштування pre-commit hooks для Angular
# .husky/pre-commit
npx lint-staged

# .lintstagedrc.json
{
  "*.{ts,html}": ["nx affected:lint --fix --files"],
  "*.{ts,json,html,scss}": ["prettier --write"]
}

# .husky/commit-msg
npx --no -- commitlint --edit "$1"

# commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'core', 'shared-ui', 'feature-auth', 'feature-dashboard'
    ]],
  },
};
```

### Connections to Other Concepts

- **Anti-Patterns:** Long-lived feature branches — integration hell. God commits — impossible to review/revert.
- **CI/CD:** Git workflow визначає pipeline triggers — branch patterns, conventional commit types
- **Monorepo Architecture:** Git workflow must scale з кількістю projects — Nx affected ключовий для performance
- **Code Review:** PR practices, CODEOWNERS, review automation — частина git workflow

## Examples

### Basic Usage

```bash
# Typical Angular development workflow
# 1. Створюємо feature branch від main
git checkout main && git pull origin main
git checkout -b feat/user-profile

# 2. Робимо зміни, комітимо з conventional format
git add src/app/features/user-profile/
git commit -m "feat(user-profile): add profile editing form

Implement reactive form with validation for user profile editing.
Includes avatar upload with file size limit.

Closes #142"

# 3. Sync з main перед PR
git fetch origin main
git rebase origin/main

# 4. Push і створюємо PR
git push -u origin feat/user-profile
gh pr create --title "feat(user-profile): add profile editing form" \
  --body "## Changes\n- Profile edit form\n- Avatar upload\n\nCloses #142"
```

### Production Scenario

```yaml
# .github/workflows/ci.yml — CI для Angular Nx monorepo
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Потрібно для nx affected

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - uses: nrwl/nx-set-shas@v4  # Визначає base SHA для affected

      - run: npx nx affected -t lint --parallel=3
      - run: npx nx affected -t test --parallel=3 --configuration=ci
      - run: npx nx affected -t build --parallel=3 --configuration=production

      # Bundle size check
      - name: Check bundle budgets
        run: |
          npx nx run my-app:build:production --stats-json
          npx bundlesize

      # Preview deployment per PR
      - name: Deploy preview
        if: success()
        run: npx nx run my-app:deploy:preview --pr=${{ github.event.number }}
```

```typescript
// angular.json — production build configuration з budgets
{
  "configurations": {
    "production": {
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "250kb",
          "maximumError": "500kb"
        },
        {
          "type": "anyComponentStyle",
          "maximumWarning": "4kb",
          "maximumError": "8kb"
        }
      ],
      "outputHashing": "all",  // Cache busting
      "optimization": true,
      "sourceMap": false,
      "namedChunks": false
    }
  }
}
```

### Anti-Example

```bash
# ❌ WRONG: feature branch живе 3 тижні
git checkout -b feature/complete-redesign
# ... 3 weeks of commits, 150 changed files ...
git merge main  # Massive conflicts
git push
# PR: 3000 lines changed — неможливо нормально review

# ✅ CORRECT: short-lived branches з incremental changes
git checkout -b feat/redesign-header
# 2-3 файли, < 200 рядків
git commit -m "feat(ui): redesign header with new navigation"
git push && gh pr create
# Після merge:
git checkout -b feat/redesign-sidebar
# ...

# ❌ WRONG: generic commit messages
git commit -m "fix stuff"
git commit -m "updates"
git commit -m "wip"

# ✅ CORRECT: conventional commits
git commit -m "fix(auth): handle expired token refresh race condition"
git commit -m "feat(dashboard): add real-time notification counter"
git commit -m "perf(table): virtualize rows for datasets > 1000 items"
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Long-lived feature branches (> 3 дні) | Merge conflicts, stale code, big PRs що неможливо review | Trunk-based з feature flags, branches < 2 дні |
| Force push на shared branches | Переписує історію для інших — втрата роботи | Force push тільки на personal branches, `--force-with-lease` для safety |
| Ручні releases без automation | Error-prone, inconsistent, повільно | Semantic release з conventional commits, automated pipeline |
| Один CI pipeline для всього monorepo | 30+ хвилин на кожен PR навіть для typo fix | `nx affected` — тестуємо тільки змінене та залежне |
| Відсутність bundle size budgets | Додаток росте непомітно, performance деградує | Angular budgets в angular.json + CI check |

## Interview Block

### [L1 — Warm-up] Яка різниця між git merge і git rebase?

**Signal being tested:** Чи розуміє кандидат як Git працює з історією, чи просто натискає кнопки в IDE

**What the interviewer expects:** Пояснення обох операцій, коли яку використовувати, awareness що rebase переписує історію

**How to probe deeper:** "Коли rebase небезпечний? Що таке --force-with-lease і навіщо?"

**Reference answer:** Merge створює merge commit що об'єднує дві гілки — зберігає історію розгалуження. Rebase переписує коміти на нову base — створює лінійну історію. Rebase для local feature branches, merge для shared branches. Ніколи не rebase що вже запушено.

**Common mistakes:** Rebase shared branches; не розуміють що rebase створює нові commits (інші SHA); не знають про interactive rebase

### [L2 — Competence] Що таке conventional commits і як вони використовуються в Angular проєктах?

**Signal being tested:** Чи розуміє кандидат зв'язок між commit convention і automation (versioning, changelog)

**What the interviewer expects:** Формат (type(scope): description), основні types, зв'язок з semantic versioning, tooling (commitlint, husky)

**How to probe deeper:** "Як BREAKING CHANGE впливає на versioning? Як налаштувати enforcement в команді?"

**Reference answer:** Conventional commits — структурований формат: type(scope): description. Angular створив цю конвенцію. feat → minor version, fix → patch, BREAKING CHANGE → major. Tooling: commitlint + husky для enforcement, semantic-release для automation.

**Common mistakes:** Не знають зв'язку з semantic versioning; пишуть generic messages (fix stuff); плутають types (refactor замість fix)

### [L3 — Depth] Як організувати Git workflow для Angular monorepo з Nx?

**Signal being tested:** Чи має кандидат досвід з monorepo tooling і розуміє scaling challenges

**What the interviewer expects:** Trunk-based development, nx affected, CODEOWNERS, CI optimization, distributed caching

**How to probe deeper:** "Як nx affected визначає що змінилось? Що таке Nx Cloud і як distributed caching працює?"

**Reference answer:** Trunk-based з short-lived branches. nx affected визначає змінені проєкти через dependency graph і git diff. CI: affected lint → test → build (паралельно). CODEOWNERS per library. Nx Cloud для distributed caching і task execution. Squash merge з conventional commits для automated releases.

**Common mistakes:** CI запускає все замість affected; feature branches живуть тижнями; немає CODEOWNERS; не використовують caching

### [L4 — Architecture] Як спроектувати CI/CD pipeline для Angular додатку від commit до production?

**Signal being tested:** System-level мислення — reliability, automation, observability, disaster recovery

**What the interviewer expects:** End-to-end pipeline design, quality gates, deployment strategies, runtime config, monitoring integration

**How to probe deeper:** "Як реалізувати canary deployment? Що робити якщо deployment зламав production?"

**Reference answer:** CI: nx affected (lint, test, build), quality gates (coverage, budgets, security audit), preview deploys per PR. CD: GitOps-triggered, semantic release, Docker multi-stage build, progressive delivery (canary з automated rollback), runtime config (не rebuild per env), observability integration (deployment markers, error tracking). DORA metrics для continuous improvement.

**Common mistakes:** Rebuild per environment; manual releases; deploy прямо в production без canary; ігнорують bundle budgets; немає rollback strategy

## Summary

### Key Points
- Trunk-based development з short-lived branches (< 2 дні) — recommended для Angular teams
- Conventional commits (feat/fix/refactor) — foundation для automated versioning та changelog
- `nx affected` — ключова оптимізація для monorepo CI, тестує тільки змінене
- Squash merge зберігає чисту main history — один commit per feature
- Bundle budgets в angular.json — автоматичний контроль розміру додатку в CI
- CI/CD: lint → test → build → preview (PR), semantic release → canary deploy (merge)
- Angular team сама використовує conventional commits, squash merge, і monorepo workflow

### Elevator Pitch (2 minutes)
"Git workflow для Angular — це не просто branching strategy, а delivery pipeline. Trunk-based development з short-lived branches забезпечує continuous integration. Conventional commits автоматизують semantic versioning та changelog — Angular team сама створила цю конвенцію. В monorepo з Nx, `nx affected` визначає змінені проєкти і запускає CI тільки для них — це різниця між 5-хвилинним і 30-хвилинним pipeline. Production build з budgets контролює bundle size автоматично. CI/CD pipeline: від commit до production через quality gates, preview deployments, і canary releases з automated rollback. Метрика успіху — DORA metrics: deployment frequency, lead time, MTTR, change failure rate."
