---
title: "Angular Project Structure & Module Patterns"
block: 15
topic: 1
slug: "project-structure"
difficulty: 3
sinceVersion: "2"
tags: ["feature modules", "shared module", "core module", "barrel exports", "standalone architecture", "folder structure"]
relatedTopics: ["standalone-components", "lazy-loading", "dependency-injection", "monorepo-nx"]
interviewQuestions:
  - id: "b15t1q1"
    level: "junior"
    question: "Що таке feature module у Angular і навіщо він потрібен?"
    referenceAnswers:
      junior: "Feature module — це NgModule, що групує компоненти, директиви і сервіси для певної функції програми. Він допомагає розбити великий додаток на менші частини."
      mid: "Feature module інкапсулює все, що стосується конкретної business feature: компоненти, директиви, пайпи, сервіси, роутинг. Переваги: lazy loading (завантажувати лише при потребі), ізоляція (компоненти не витікають в інші модулі), кращий tree-shaking. Feature module зазвичай має свій RoutingModule і може бути завантажений через `loadChildren` у роутері."
      senior: "Feature module pattern (pre-standalone) включає: 1) FeatureModule з declarations + imports + exports. 2) FeatureRoutingModule для router config. 3) Lazy loading через `loadChildren: () => import('./feature/feature.module').then(m => m.FeatureModule)`. Під капотом: Angular компілює feature module у окремий JS chunk. Router lazy-loads chunk при першому переході. При standalone components: feature module замінюється Routes array з `loadComponent`. Принципова різниця між standalone і NgModule lazy loading: NgModule lazy load creates new injector scope, standalone lazy loading не створює автоматично — потрібен `providers` у route config або `provideXxx()` функції. Feature module також встановлює boundary для circular dependency detection."
      staff: "Feature modules вирішують кілька architectural concerns одночасно: 1) Code splitting: Webpack/esbuild бачить dynamic import і створює окремий chunk. 2) DI scope: кожен lazy-loaded NgModule отримує child injector — сервіси, надані у feature module, є singleton лише в межах feature. Це критично для multi-tenant або per-feature state. 3) Compilation unit: Angular Ivy компілює кожен NgModule окремо — incremental compilation. 4) Team boundaries: feature module = ownership boundary. У monorepo: feature module = library. 5) Standalone migration: Angular надає schematic `ng generate @angular/core:standalone` для автоматичної міграції. Після міграції feature modules стають routes arrays з providers. 6) При плануванні структури: feature boundary = lazy boundary = team boundary — ці три повинні збігатися."
    commonMistakes:
      - "SharedModule у lazy feature module — SharedModule re-instantiates services якщо ті надані у SharedModule"
      - "Плутають declarations і exports — component у declarations не доступний зовні без exports"
      - "Circular imports між feature modules — порушення boundary"
    relatedQuestions: ["b15t1q2", "b15t1q3"]
  - id: "b15t1q2"
    level: "mid"
    question: "Поясни роль CoreModule і SharedModule у класичній Angular архітектурі."
    referenceAnswers:
      junior: "CoreModule містить singleton сервіси як AuthService. SharedModule містить компоненти і директиви, що використовуються в багатьох місцях."
      mid: "CoreModule: singleton сервіси (AuthService, LoggingService), guards, interceptors. Імпортується лише в AppModule. Містить guard проти повторного імпорту через `constructor(@Optional() @SkipSelf() parentModule: CoreModule)`. SharedModule: dumb/presentational компоненти, pipes, directives. Не містить сервісів з providedIn. Імпортується у feature modules. Типова структура: core/services/, core/guards/, core/interceptors/; shared/components/, shared/pipes/, shared/directives/."
      senior: "Core/Shared pattern проблеми: 1) SharedModule може стати God module — все потрапляє туди. 2) SharedModule imports все і exports все — feature modules імпортують навіть те, що не використовують. 3) CoreModule з providedIn: 'root' сервісами — CoreModule взагалі не потрібен для сервісів. 4) Рішення: SharedModule розбити на domain-specific shared modules. 5) Standalone альтернатива: замість SharedModule — barrel exports і standalone components. Кожен standalone component/pipe/directive imports те, що йому потрібно напряму. 6) Anti-pattern: import SharedModule у CoreModule або навпаки — circular dependency. 7) З standalone: CoreModule і SharedModule є legacy patterns, нові проекти їх не використовують."
      staff: "Core/Shared pattern у 2024 context: 1) Standalone-first world: SharedModule замінено на SHARED_COMPONENTS = [CompA, CompB] array exported from index.ts. Component imports напряму. 2) CoreModule замінено на provideXxx() functions у app.config.ts. 3) Провайдери: `provideHttpClient(withInterceptors([authInterceptor]))` у app.config.ts, не у CoreModule. 4) Migration strategy: спочатку мігрувати Core/Shared до standalone, потім feature modules. Schematic автоматизує declarations → imports у component, exports з module → standalone components. 5) Організаційний вплив: Core/Shared була команди-level boundary pattern. Standalone-first переносить цю відповідальність на barrel exports і library boundaries. 6) Monorepo: libs/shared/ui, libs/shared/data-access, libs/core/auth — реплікує Core/Shared на рівні Nx libraries."
    commonMistakes:
      - "Сервіси у SharedModule — вони не singleton, кожен lazy module отримує нову інстанцію"
      - "Імпорт CoreModule у feature modules — порушує singleton pattern"
      - "SharedModule як сміттєзвалище для всього shared коду"
    relatedQuestions: ["b15t1q1", "b15t1q3"]
  - id: "b15t1q3"
    level: "mid"
    question: "Що таке barrel exports (index.ts) і як вони допомагають запобігти circular dependencies?"
    referenceAnswers:
      junior: "index.ts файл, що реекспортує все з директорії, щоб можна було писати `import { X } from './feature'` замість довгого шляху."
      mid: "Barrel file (index.ts) реекспортує public API модуля: `export { UserComponent } from './user.component'; export { UserService } from './user.service';`. Переваги: 1) Короткі import paths. 2) Приховує внутрішню структуру. 3) Дозволяє рефакторинг внутрішніх файлів без зміни imports у споживачів. Circular dependency prevention: якщо A → B → A через barrel, TypeScript і webpack видають error. Рішення: виділити shared types у третій модуль C."
      senior: "Barrel exports — це public API pattern: лише те, що в index.ts, є public. Решта — private implementation. Circular dependency detection: 1) TypeScript: `error TS2345: Argument... circular`. 2) eslint-plugin-import: `import/no-cycle` rule. 3) Webpack: попередження при build. 4) Nx: `@nx/enforce-module-boundaries` — lint rule для boundary violations. Barrel anti-patterns: 1) Deep re-export: `export * from './sub/barrel'` — nested barrels важко слідкувати. 2) Circular через barrel: A exports from B, B imports from A. 3) Performance: barrel з сотнями exports — TypeScript type checking сповільнюється. 4) Solution: explicit named exports, не `export *`. Shallow barrels лише на рівні feature."
      staff: "Barrel exports як API contract: 1) Public API invariant: якщо воно не у index.ts — воно приватне. Це enforcement mechanism для dependency inversion. 2) Circular dependency at scale: найчастіше через shared types (interfaces, enums) — виділити в окремий utils/types lib. 3) Nx libraries = enforced barrels: `paths` у tsconfig.base.json маппить `@org/feature` → `libs/feature/src/index.ts`. Import поза barrel неможливий без зміни tsconfig. 4) TypeScript project references: кожна library — окремий tsconfig з references — incremental compilation, ізольоване type checking. 5) Tree-shaking impact: barrel з re-exports — bundler може не tree-shake якщо side effects present. sideEffects: false у package.json вирішує. 6) Organizational impact: barrel = team API contract. Breaking change у barrel = semver major у library."
    commonMistakes:
      - "export * from замість явних іменованих exports — важко бачити public API"
      - "Barrel на кожному рівні директорій — надмірна складність"
      - "Circular imports через barrel не помічають до build time"
    relatedQuestions: ["b15t1q2", "b15t1q4"]
  - id: "b15t1q4"
    level: "senior"
    question: "Порівняй feature-based та layer-based структуру папок. Коли яку обирати?"
    referenceAnswers:
      junior: "Feature-based: папки по features (users/, products/). Layer-based: папки по типу (components/, services/, models/)."
      mid: "Feature-based: `src/app/users/`, `src/app/products/` — кожна feature містить компоненти, сервіси, моделі своєї домени. Layer-based: `src/app/components/`, `src/app/services/`, `src/app/models/`. Feature-based: легше знайти все для однієї feature, краща ізоляція, природні lazy loading boundaries. Layer-based: легше орієнтуватися у маленьких проектах, спільна термінологія. Рекомендація: feature-based для > 3-5 features."
      senior: "Feature-based переваги: 1) Co-location: компонент, його тест, його стилі — поруч. 2) Lazy loading = feature folder. 3) Видалення feature: видалити одну папку. 4) Onboarding: розробник знає, що все про users — у users/. Layer-based проблеми при масштабуванні: `services/` стає свалищем 50 сервісів. Hybrid підхід: feature-based на верхньому рівні, layer-based всередині feature: `users/components/`, `users/services/`, `users/models/`. Standalone-era структура: `users/` містить index.ts (barrel), routes.ts, user-list/, user-detail/ (sub-features). Nx enforces це на рівні libraries: `libs/users/feature-list`, `libs/users/data-access`."
      staff: "Структура файлів як architectural decision: 1) Conway's Law: структура коду відображає структуру команди. Feature-based = vertical teams (кожна команда owns feature). Layer-based = horizontal teams (frontend team, backend team). 2) Feature-based at Nx scale: libs/feature-name/ → `feature-shell` (routing), `feature-list` (list page), `feature-detail` (detail page), `data-access` (state/API), `ui` (dumb components). 3) Naming conventions: `feature-*` — routed features, `ui-*` — presentational libs, `data-access-*` — state/API, `util-*` — utilities. 4) Angular Style Guide recommendations: feature folders, one component per file. 5) Decision framework: якщо більше 2 розробників на проекті — feature-based. Якщо монорепо — Nx library structure. Якщо single-team small project — hybrid. 6) Рефакторинг layer → feature-based: поступово, по одній feature за раз, зберігаючи обидва patterns паралельно."
    commonMistakes:
      - "Починають з layer-based і рефакторять при зростанні — краще одразу feature-based"
      - "Feature папки без ізоляції — компоненти однієї feature залежать від деталей іншої"
      - "Занадто глибока вкладеність feature в feature"
    relatedQuestions: ["b15t1q3", "b15t1q5"]
  - id: "b15t1q5"
    level: "staff"
    question: "Як спроектувати структуру великого Angular додатку (30+ features, 10+ розробників) щоб мінімізувати merge conflicts і забезпечити незалежний деплой features?"
    referenceAnswers:
      junior: "Розбити на окремі модулі для кожної feature і використовувати lazy loading."
      mid: "Monorepo з Nx: окремі libraries для кожної feature. Module boundaries між libs. CI/CD: nx affected для запуску тестів лише для змінених libs. Кожна lib має свій owner."
      senior: "Архітектура для scale: 1) Nx monorepo з типізованими libs: feature, data-access, ui, util. 2) Module boundary enforcement: `@nx/enforce-module-boundaries` — feature може залежати від data-access і ui, але не від іншої feature. 3) Nx affected: `nx affected:test --base=main` — тести лише змінених libs. 4) Shared libs: libs/shared/ui, libs/shared/data-access. 5) Lazy loading кожної feature. 6) State ізоляція: кожна feature має власний NgRx feature state або SignalStore. 7) API contracts через barrel exports."
      staff: "Enterprise Angular структура: 1) Monorepo structure: apps/ (shell app, e2e), libs/ (domain grouping: libs/users/, libs/products/). 2) Library types: `feature-shell` = routing entry, `feature-list/detail` = pages, `data-access` = NgRx/SignalStore + API, `ui` = dumb components, `util` = pure functions. 3) Dependency graph rules: app → feature-shell → feature-page → data-access → util; ui → util. Ніколи feature-a → feature-b. 4) Independent deployment: micro-frontends через Module Federation — кожна feature = окремий deployable. Shell app завантажує remotes. 5) Merge conflict reduction: feature-owned files, shared через libs/shared з review process. 6) Team topology: кожна команда owns 1-2 feature libs + 1 data-access lib. 7) CI optimization: nx affected + distributed task execution. 8) Contract testing: consumers і providers незалежно тестуються — Pact або API contract tests."
    commonMistakes:
      - "Shared state між features через сервіс замість подій або NgRx"
      - "Занадто великий shared/ui — стає bottleneck для всіх команд"
      - "Feature teams не enforcing module boundaries — поступово накопичуються cross-feature dependencies"
    relatedQuestions: ["b15t1q4", "b15t2q1"]
---

## Core Concept

**English definition:** Angular project structure encompasses the organization of source files, NgModule/standalone patterns, folder conventions, and code boundary enforcement strategies that determine how a codebase scales, compiles, and is maintained across teams.

**Пояснення:** Архітектура проекту Angular — це не просто розкладка файлів по папках. Це набір рішень про те, як розбити додаток на незалежні частини, як ці частини комунікують між собою, і як запобігти перетворенню кодобази в "спагетті" з часом. Правильна структура визначає, наскільки легко додавати нові features, рефакторити існуючі, і масштабувати команду.

**Яку проблему вирішує:** Без чіткої структури Angular проект деградує до монолітного `AppModule` з сотнями declarations, відсутності lazy loading, circular imports і "страху торкатися чужого коду". Правильна структура вирішує: 1) Code splitting для performance. 2) Ownership boundaries для команд. 3) Predictable import paths. 4) Запобігання circular dependencies.

**Як працює під капотом:** Angular компілятор (Ivy/ngtsc) обробляє кожен NgModule як окрему compilation unit. При lazy loading (`loadChildren`, `loadComponent`) Webpack/esbuild бачить dynamic `import()` і створює окремий JS chunk. При standalone components немає NgModule як compilation unit — кожен component є своєю власною compilation unit з явними imports. TypeScript project references дозволяють incremental compilation — компілюється лише змінений код і його залежності. ESLint rules (`import/no-cycle`, `@nx/enforce-module-boundaries`) enforce dependency graph на рівні lint.

**Trade-offs та обмеження:** Feature-based структура вимагає більше початкового планування. Barrel exports можуть сповільнити TypeScript type checking при великій кількості re-exports. NgModule lazy loading створює child injector scope (що може бути як перевагою, так і проблемою). Standalone lazy loading не створює injector scope автоматично — потрібен `providers` у route config.

**Версійність:** NgModule-based архітектура — з Angular 2 (2016). Lazy loading через `loadChildren` — з Angular 2. `loadComponent` для standalone lazy loading — Angular 14 (developer preview), stable у v15. `ng generate @angular/core:standalone` schematic для автоматичної міграції NgModule → standalone — Angular 15+. Standalone-first approach офіційно рекомендований Angular team з v17.

## Deep Details

### Edge Cases

**Lazy loading і DI scope:** NgModule lazy loading створює child injector. Якщо сервіс надається у lazy NgModule (не `providedIn: 'root'`), він є singleton лише у цьому lazy module. Якщо той самий сервіс надається і у root, і у lazy module — буде дві інстанції. Standalone lazy routing з `providers` у route config також створює environment injector для цих providers.

**Barrel exports і performance:** TypeScript обробляє barrel re-exports через module graph. Дуже великий barrel (100+ exports через `export *`) помітно сповільнює `tsc --watch`. Рішення: явні named exports, а не `export *`. У Nx: `paths` у `tsconfig.base.json` маппить `@myorg/feature` → конкретний `index.ts`.

**Circular dependency detection:** `import/no-cycle` ESLint rule виявляє циклічні залежності статично. Webpack виводить попередження при build. Angular compiler може видати error при circular NgModule imports. Найчастіша причина: shared types між двома features — виділити в окремий utils/types модуль.

### Junior vs Senior Understanding

**Junior** бачить структуру як організаційну зручність: "feature-based — легше знайти файли".

**Senior** розуміє структуру як architectural enforcement mechanism: 1) Границі модулів = границі lazy loading chunks = границі команд. 2) `index.ts` barrel = public API contract модуля. 3) Порушення module boundary = введення прихованої залежності. 4) Circular dependency = ознака порушеного Single Responsibility або відсутнього shared abstraction. Senior також розуміє різницю між NgModule DI scope і standalone environment injector scope — і коли кожен потрібен.

### Deprecation & Migration Path

**NgModules (не deprecated, але не рекомендовані для нових проектів):** Angular команда офіційно рекомендує standalone-first з v17. Existuючі NgModule проекти підтримуються і не будуть видалені. Schematic для міграції: `ng generate @angular/core:standalone` — автоматично конвертує declarations у standalone imports, видаляє зайві NgModules. Рекомендована стратегія міграції: leaf components першими, потім їх батьківські модулі, нарешті AppModule.

**Core/Shared module pattern:** Замінюється на: CoreModule → `app.config.ts` з `provideXxx()` функціями. SharedModule → standalone components з barrel exports або Nx shared libs.

### Connections to Other Concepts

- **Lazy Loading (Block 6):** Структура проекту безпосередньо визначає lazy loading boundaries.
- **Dependency Injection (Block 5):** NgModule boundaries визначають DI scope. Standalone environment injectors — альтернатива.
- **Nx Monorepo (Block 15, Topic 2):** Nx formalize project structure на рівні workspace.
- **Micro-frontends (Block 15, Topic 3):** Module Federation використовує feature boundaries для окремих deployable units.

## Examples

### Basic Usage

```typescript
// Структура standalone-first Angular проекту (Angular 17+)
// src/app/
// ├── app.config.ts          — providers (HTTP, Router, etc.)
// ├── app.routes.ts          — root routing
// ├── app.component.ts       — root component
// ├── core/
// │   ├── auth/
// │   │   ├── auth.service.ts
// │   │   └── auth.interceptor.ts
// │   └── index.ts           — barrel: export { AuthService } from './auth/auth.service'
// ├── shared/
// │   ├── ui/
// │   │   ├── button/
// │   │   │   ├── button.component.ts
// │   │   │   └── button.component.spec.ts
// │   │   └── index.ts
// │   └── index.ts
// └── features/
//     ├── users/
//     │   ├── routes.ts      — feature routing
//     │   ├── user-list/
//     │   │   ├── user-list.component.ts
//     │   │   └── user-list.component.spec.ts
//     │   ├── user-detail/
//     │   │   └── user-detail.component.ts
//     │   └── index.ts       — public API: export { UserListComponent } from './user-list/...'
//     └── products/
//         └── routes.ts

// app.routes.ts — lazy loading features
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    loadChildren: () => import('./features/users/routes').then(m => m.USER_ROUTES),
  },
  {
    path: 'products',
    loadChildren: () =>
      import('./features/products/routes').then(m => m.PRODUCT_ROUTES),
  },
];

// features/users/routes.ts — feature-level routing
import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./user-list/user-list.component').then(c => c.UserListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./user-detail/user-detail.component').then(c => c.UserDetailComponent),
  },
];

// features/users/index.ts — barrel exports (public API)
export { UserListComponent } from './user-list/user-list.component';
// UserDetailComponent НЕ експортується — внутрішня деталь feature
```

### Production Scenario

```typescript
// app.config.ts — standalone app configuration (замінює AppModule)
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { loggingInterceptor } from './core/logging/logging.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([authInterceptor, loggingInterceptor])
    ),
  ],
};

// core/auth/auth.interceptor.ts — functional interceptor (standalone era)
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authReq);
  }
  return next(req);
};

// Lazy feature з власними providers (environment injector scope)
// features/admin/routes.ts
import { Routes } from '@angular/router';
import { AdminDataService } from './admin-data.service';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [AdminDataService], // scoped до admin feature — не singleton у root
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then(
        c => c.AdminDashboardComponent
      ),
  },
];
```

### Anti-Example

```typescript
// ПОГАНО: Layer-based структура, що не масштабується
// src/app/
// ├── components/        — 50+ компонентів, немає ізоляції
// │   ├── user-list.component.ts
// │   ├── product-list.component.ts
// │   ├── order-form.component.ts
// │   └── ... 47 more files
// ├── services/          — 30+ сервісів
// │   ├── user.service.ts
// │   └── ...
// └── models/

// ПОГАНО: SharedModule як God module
@NgModule({
  declarations: [
    ButtonComponent,
    InputComponent,
    UserCardComponent,     // feature-specific, не справді shared
    ProductCardComponent,  // feature-specific
    AdminHeaderComponent,  // feature-specific
    // 20+ more...
  ],
  exports: [/* everything above */],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  // ПРОБЛЕМА: кожен модуль що імпортує SharedModule отримує ВСЕ це,
  // навіть якщо використовує лише ButtonComponent
})
export class SharedModule {}

// ПОГАНО: Cross-feature пряма залежність
// features/orders/order.service.ts
import { ProductService } from '../products/product.service'; // ПОРУШЕННЯ BOUNDARY
// Правильно: ProductService має бути у shared data-access lib або
// orders feature комунікує через events/NgRx actions
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| SharedModule як God module з усіма shared components | Кожен feature module завантажує весь SharedModule — зайві imports, погана tree-shaking | Розбити на domain-specific shared modules або standalone components з явними imports |
| Пряма залежність між feature modules | Порушує ізоляцію, ускладнює lazy loading, призводить до circular deps | Комунікація через shared data-access lib, NgRx actions або events |
| Barrel з `export *` на всіх рівнях | TypeScript type checking сповільнюється, важко бачити public API | Явні named exports лише для public API |
| Layer-based структура при масштабуванні | Папки services/, components/ стають свалищами, важко знайти пов'язаний код | Feature-based з co-location: компонент, сервіс, тест — поруч |
| Сервіс у SharedModule без `providedIn: 'root'` | Кожен lazy module що імпортує SharedModule отримує нову інстанцію сервісу | Використовувати `providedIn: 'root'` або `provideXxx()` у feature providers |

## Interview Block

### [L1 — Warm-up] Що таке feature module і навіщо він потрібен?

**Signal being tested:** Чи розуміє кандидат призначення модульної архітектури і lazy loading, а не просто факт існування NgModule.

**What the interviewer expects:** Згадати lazy loading, ізоляцію, code splitting. Не просто "групує компоненти".

**How to probe deeper:** "Як feature module пов'язаний з lazy loading? Що відбувається під капотом при `loadChildren`?"

**Reference answer:** Feature module інкапсулює компоненти, сервіси і роутинг конкретної business feature. Ключова перевага — lazy loading: `loadChildren` → Webpack/esbuild створює окремий JS chunk → браузер завантажує лише при потребі. У standalone-era: feature module замінюється routes array з `loadComponent`.

**Common mistakes:** Кажуть "групує компоненти" без згадки lazy loading. Не знають різниці між NgModule і standalone lazy loading scopes.

---

### [L2 — Mid] Поясни роль CoreModule і SharedModule у класичній Angular архітектурі.

**Signal being tested:** Розуміння separation of concerns між singleton services і reusable UI components, і чому ці patterns застаріли.

**What the interviewer expects:** CoreModule = singletons, SharedModule = reusable UI. Знання guard проти re-import. Розуміння що з standalone ці patterns замінені.

**How to probe deeper:** "Чому сервіс у SharedModule — це проблема? Що станеться якщо lazy feature module імпортує SharedModule з сервісом?"

**Reference answer:** CoreModule: singleton services, interceptors, guards — імпортується лише в AppModule з guard проти повторного імпорту. SharedModule: presentational компоненти, pipes, directives — імпортується у feature modules. Проблема SharedModule сервісів: lazy module отримує власну інстанцію. У standalone-era: CoreModule → `app.config.ts`, SharedModule → standalone components з barrel exports.

**Common mistakes:** Вважають що SharedModule автоматично забезпечує singleton для сервісів. Не знають про `@Optional() @SkipSelf()` guard у CoreModule.

---

### [L3 — Senior] Порівняй feature-based та layer-based структуру папок. Коли яку обирати?

**Signal being tested:** Здатність обґрунтувати архітектурне рішення через trade-offs, враховуючи Conway's Law і масштабування команди.

**What the interviewer expects:** Конкретні trade-offs, не просто "feature-based краще". Згадка co-location, lazy loading alignment, Conway's Law.

**How to probe deeper:** "Як структура папок впливає на merge conflicts у команді з 10+ розробників?"

**Reference answer:** Feature-based переваги: co-location (тест і компонент разом), lazy loading boundary = feature folder, видалення feature = видалення папки. Layer-based: простіше для малих проектів, спільна термінологія. При масштабуванні layer-based деградує: 50 сервісів у services/. Conway's Law: feature-based = vertical team ownership. Hybrid: feature-based зовні, layer-based всередині feature.

**Common mistakes:** Починають з layer-based і болісно рефакторять. Не розуміють зв'язок між структурою і merge conflicts.

---

### [L4 — Staff/Principal] Як спроектувати структуру великого Angular додатку (30+ features, 10+ розробників) щоб мінімізувати merge conflicts і забезпечити незалежний деплой features?

**Signal being tested:** Системне мислення про Conway's Law, CI/CD, team topology і architectural constraints як organizational tools.

**What the interviewer expects:** Nx monorepo, module boundaries, affected commands, можливість micro-frontends. Розуміння organizational impact.

**How to probe deeper:** "Як ти enforceуватимеш module boundaries щоб команди не порушували їх випадково?"

**Reference answer:** Nx monorepo: apps/ (shell), libs/ (domain groups). Library types: feature-shell, feature-page, data-access, ui, util. Dependency rules: feature → data-access → util; ui → util; feature-A не → feature-B. `@nx/enforce-module-boundaries` ESLint rule — порушення = lint error. `nx affected:test` у CI. Для незалежного деплою: Module Federation. Team topology: команда owns 1-2 feature libs.

**Common mistakes:** Monorepo без boundary enforcement — поступово cross-feature dependencies. Shared state між features через сервіси замість NgRx/events.

## Summary

### Key Points

- Feature-based структура забезпечує co-location, lazy loading alignment і team ownership boundaries
- CoreModule (singletons) і SharedModule (reusable UI) — класичні patterns, замінені у standalone-era на `app.config.ts` і standalone components
- Barrel exports (`index.ts`) визначають public API модуля — лише те, що у barrel, є публічним
- Circular dependencies — симптом порушеного Single Responsibility або відсутнього shared abstraction
- NgModule lazy loading створює child injector scope; standalone lazy routing з `providers` — environment injector
- Nx enforces project structure через `@nx/enforce-module-boundaries` і library types
- `ng generate @angular/core:standalone` автоматизує міграцію NgModule → standalone

### Elevator Pitch (2 minutes)

Angular project structure — це архітектурний фундамент, що визначає як додаток масштабується у часі і команді. Класичний підхід: AppModule → CoreModule (singletons) → FeatureModules (lazy) → SharedModule (reusable UI). У standalone-era (v17+): app.config.ts → feature routes з `loadComponent` → standalone components з явними imports. Ключові принципи незалежно від підходу: feature = lazy boundary = team boundary; barrel exports = public API contract; no cross-feature direct dependencies — лише через shared libs або NgRx/events. Для великих команд Nx enforces ці правила автоматично через ESLint module boundary rules.
