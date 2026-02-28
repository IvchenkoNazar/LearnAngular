---
title: "Standalone Components & APIs"
block: 1
topic: 3
slug: "standalone-components"
difficulty: 2
sinceVersion: "14"
tags: ["standalone", "imports", "providers", "migration", "tree-shaking"]
relatedTopics: ["ngmodules", "bootstrapping", "dependency-injection"]
interviewQuestions:
  - id: "b1t3q1"
    level: "junior"
    question: "Що таке standalone component і чим він відрізняється від звичайного component в NgModule?"
    referenceAnswers:
      junior: "Standalone component — це компонент з standalone: true (тепер за замовчуванням), який не потребує NgModule. Він сам вказує свої залежності через imports масив."
      mid: "Standalone component самостійно управляє своїм compilation scope через власний imports масив — він напряму імпортує інші components, directives, pipes, або навіть NgModules. Не потрібно декларувати його в жодному NgModule. З Angular 19+ standalone: true є значенням за замовчуванням, тому прапорець можна не вказувати. Це спрощує mental model — кожен component явно декларує свої залежності."
      senior: "Standalone component — це самодостатня одиниця compilation scope. Замість NgModule що визначає scope для групи компонентів, standalone component визначає scope для себе. Під капотом: Angular compiler обробляє imports масив standalone component для побудови template compilation context — аналогічно до transitive scope NgModule. Ключова відмінність: залежності explicit per component, а не implicit per module. Це дає: 1) Кращий tree-shaking — bundler бачить точний dependency graph. 2) Простіший mental model — відкрий component, бач imports. 3) Гнучкість — component можна використати де завгодно без module plumbing. З Angular 19+: standalone: true за замовчуванням, standalone: false потрібен тільки якщо component в NgModule declarations."
      staff: "Standalone API — це fundamental shift в Angular's component model. Historically, Angular's compilation model вимагав module scope через AOT compilation pipeline — template type-checking потребує знання доступних symbols. Standalone реалізує per-component scope через ɵɵStandaloneFeature runtime feature та зміни в compiler. Архітектурно це unblocks: 1) True component-level code splitting — loadComponent замість loadChildren з module wrapper. 2) Fine-grained tree-shaking — unused standalone component не потрапляє в bundle, навіть якщо він у тій же directory. 3) Simpler mental model для onboarding — React/Vue developers не натикаються на NgModule concept. Trade-off: втрата enforced organizational boundaries — потребує discipline або tooling (Nx, eslint-plugin-boundaries). Для framework evolution: standalone — prerequisite для signal-based components, які ще більше спрощують component model."
    commonMistakes:
      - "Думають що standalone components не можуть використовувати NgModule-based бібліотеки"
      - "Забувають імпортувати CommonModule або окремі директиви (NgIf, NgFor)"
      - "Вважають що standalone: true треба явно вказувати в Angular 19+"
    relatedQuestions: ["b1t3q2", "b1t2q1"]
  - id: "b1t3q2"
    level: "mid"
    question: "Як standalone component управляє залежностями? Що можна вказати в imports?"
    referenceAnswers:
      junior: "В imports standalone component можна додати інші компоненти, директиви, пайпи, або цілі модулі — все, що потрібно для шаблону."
      mid: "imports масив standalone component приймає: інші standalone components/directives/pipes, NgModules (для backward compatibility), або навіть масиви з них. Angular розгортає transitive exports модулів — якщо імпортуєш SharedModule, отримуєш все що він exports. Для нових проєктів рекомендується імпортувати конкретні standalone елементи замість NgModules — кращий tree-shaking та explicit dependencies."
      senior: "imports standalone component будує compilation scope аналогічно NgModule, але per-component. Приймає: standalone components/directives/pipes (напряму), NgModules (використовуються їх exports), масиви (для grouped exports з barrel files). Порядок resolution: Angular compiler збирає всі symbols з imports, будує flatened scope, використовує його для template type-checking. Важливий нюанс: якщо імпортуєш NgModule — отримуєш його exports, не declarations. Для tree-shaking: `import { NgIf, NgFor } from '@angular/common'` краще ніж `import { CommonModule }` — хоча в practice різниця мінімальна завдяки Ivy tree-shaking. З Angular 17+ built-in control flow (@if, @for) замінює NgIf/NgFor — немає потреби імпортувати їх взагалі."
      staff: "imports — це declarative dependency graph для template compilation. Під капотом: compiler аналізує imports, будує DirectiveMeta/PipeMeta для кожного symbol, створює scope для template type-checking. Для architectural decisions: 1) Barrel exports (index.ts з масивом standalone components) — замінюють SharedModule для grouping. 2) Transitive imports consideration — importing one standalone component не pulls in its imports (на відміну від NgModule де imports transitive через exports). 3) В monorepo: Nx library public API визначає що можна імпортувати — boundary enforcement на build level, не runtime. 4) Performance: кожен import додає до compilation scope, але НЕ до runtime bundle якщо template не використовує. Compiler + bundler оптимізують це. 5) Testing: standalone components trivially testable — TestBed.configureTestingModule({ imports: [MyStandaloneComponent] }) без module boilerplate."
    commonMistakes:
      - "Імпортують CommonModule замість конкретних директив або використання built-in control flow"
      - "Не розуміють що imports NgModule дає тільки exports, не declarations"
      - "Плутають component imports з TypeScript ES imports"
    relatedQuestions: ["b1t3q1", "b1t3q3"]
  - id: "b1t3q3"
    level: "mid"
    question: "Як надавати сервіси в standalone world? Яка різниця між providedIn, route providers, і component providers?"
    referenceAnswers:
      junior: "Сервіси можна надавати через providedIn: 'root' в @Injectable — це робить сервіс доступним всюди в додатку як singleton."
      mid: "Три рівні providers: 1) providedIn: 'root' — глобальний singleton, tree-shakable. 2) Route-level providers в Routes config — scoped до route та його children, новий instance per route. 3) Component-level providers в @Component — scoped до component instance та його children, новий instance per component. Standalone world використовує provide функції в app.config замість NgModule providers."
      senior: "DI в standalone world має чітку hierarchy: 1) Environment Injector (root) — bootstrapApplication providers, providedIn: 'root'. 2) Route Environment Injector — providers в Route config, створюється при навігації, аналог lazy module injector. 3) Element Injector — component/directive providers, прив'язаний до DOM hierarchy. providedIn: 'root' — найкращий для singletons (tree-shakable, не потрібна реєстрація). Route providers замінюють lazy module providers — scoped singleton per route subtree. Component providers — per instance, корисні для stateful services (form state, component-specific API client). Provide functions (provideHttpClient, provideRouter) замінюють module forRoot — functional composition замість class-based."
      staff: "Standalone DI architecture — це evolved model з чіткішим separation of concerns. Hierarchy: PlatformInjector → RootEnvironmentInjector → RouteEnvironmentInjector → ElementInjector. Architectural decisions: 1) providedIn: 'root' для stateless singletons (HTTP services, state management). 2) Route providers для feature-scoped state (кожен lazy feature route отримує свій injector — ідеально для multi-tenant UI). 3) Component providers для per-instance state (form handlers, component-level cache). 4) makeEnvironmentProviders() для library authors — ensures providers registered only in environment injector, not in component. 5) provideIn: 'platform' для cross-application singletons (micro-frontends sharing service). В enterprise: route-level providers замінюють forRoot/forChild pattern — Route.providers: [provideFeatureState()] чистіше ніж FeatureModule.forRoot(). Testing: route providers легко override в RouterTestingHarness. Challenge: developer education — три рівні injectors потребують розуміння scope та lifetime."
    commonMistakes:
      - "Реєструють singleton service в component providers — кожен instance отримає окремий service"
      - "Не використовують providedIn: 'root' і вручну реєструють скрізь"
      - "Не знають про route-level providers як заміну lazy module providers"
    relatedQuestions: ["b1t3q2", "b1t3q4"]
  - id: "b1t3q4"
    level: "senior"
    question: "Як мігрувати великий NgModule-based проєкт на standalone components? Яка стратегія та підводні камені?"
    referenceAnswers:
      junior: "Angular має migration schematic — ng generate @angular/core:standalone, який автоматично конвертує компоненти."
      mid: "Міграція: 1) ng generate @angular/core:standalone — три кроки: convert declarations, convert NgModule bootstrap, remove unnecessary modules. 2) Bottom-up: спочатку leaf components, потім shared, потім features. 3) Можна мігрувати поступово — standalone і NgModule-based компоненти працюють разом. Перевіряти lazy loading після кожного етапу."
      senior: "Стратегія для великого проєкту: 1) Аудит: визначити module graph, circular dependencies, forRoot/forChild usage. 2) Automated migration: `ng generate @angular/core:standalone` в три фази — convert-to-standalone, prune-ng-modules, standalone-bootstrap. 3) Manual fixes: circular deps (використати forwardRef або restructure), dynamic module patterns, custom ModuleWithProviders. 4) Barrel exports: замінити SharedModule на index.ts з re-exports standalone components. 5) Testing: кожен етап повинен мати passing tests. 6) Gradual rollout: merge per feature area. Підводні камені: transitive dependencies через NgModule exports ламаються — компоненти повинні explicit import що використовують. Third-party NgModule-only libraries — все ще потребують import через NgModule."
      staff: "Migration — це architectural transformation, не просто automated refactor. Planning: 1) Dependency graph analysis — tools: ngx-module-graph, madge для circular deps. 2) Risk assessment: custom schematics, dynamic module loading, enterprise-specific patterns (plugin systems). 3) Phased approach з feature flags: standalone-migrated features behind runtime toggles для safe rollback. 4) CI pipeline: bundle size tracking, lazy chunk analysis, E2E tests per phase. 5) Team coordination: coding standards update, PR review checklist, training. Metrics: bundle size delta, number of NgModule files, compilation time, test execution time. Timing: migrate shared/UI components first (lowest risk, highest reuse), then feature modules, finally AppModule bootstrap. For libs published on npm: maintain NgModule re-export wrapper for backward compatibility. Post-migration: enforce standalone-only через eslint rule. Expected effort: 500 component project — 2-3 sprints з 2 engineers, 80% automated, 20% manual."
    commonMistakes:
      - "Запускають schematic без dry-run — ламають проєкт без можливості review"
      - "Мігрують AppModule першим замість leaf components"
      - "Не перевіряють barrel exports після видалення NgModules"
    relatedQuestions: ["b1t3q3", "b1t2q5"]
  - id: "b1t3q5"
    level: "staff"
    question: "Як standalone API впливає на tree-shaking, bundle size та загальну архітектуру Angular додатків?"
    referenceAnswers:
      junior: "Standalone components краще для tree-shaking — невикористані компоненти не потрапляють в bundle."
      mid: "NgModule 'тримає' всі declarations в bundle навіть якщо не всі використані в templates — tree-shaking не може видалити component що referenced в declarations масиві. Standalone components мають прямий import graph — bundler видаляє невикористаний код ефективніше. Також loadComponent для lazy routes — менший overhead ніж loadChildren з модулем."
      senior: "Tree-shaking mechanism: bundler (esbuild/webpack) аналізує import graph. NgModule declarations — це runtime array reference, bundler не може статично визначити що component не використовується в template. Standalone: кожен import в component — static ES import, bundler бачить повний graph. Результат: 1) Unused standalone components tree-shaken автоматично. 2) loadComponent — single component chunk замість module chunk. 3) Provide functions (provideRouter vs RouterModule.forRoot) — tree-shakable features через withFeature() pattern. 4) Built-in control flow (@if, @for) — zero import overhead, compiled to efficient JS. Bundle impact: 5-15% reduction в типовому enterprise проєкті, більше якщо були God Modules."
      staff: "Standalone fundamentally змінює Angular's compilation та bundling model. Compilation: per-component scope замість per-module scope — compiler генерує менше metadata. Runtime: standalone component definition включає directiveDefs/pipeDefs через closures замість module scope resolution — faster component instantiation. Bundling: static import graph дозволяє aggressive code splitting. loadComponent + dynamic import = per-route single component entry point. Esbuild (Angular 17+) використовує це для faster builds та smaller bundles. Architectural implications: 1) Micro-frontends: standalone components як shareable units без module coupling. 2) Library design: export standalone components, не modules — consumers import тільки що потрібно. 3) Testing: standalone components мають explicit deps — MockBuilder/TestBed setup мінімальний. 4) Server components (future): standalone model — prerequisite для partial hydration де кожен component незалежно hydrate'able. Metrics від реальних міграцій: 8-12% bundle reduction, 15-20% faster compilation, значно простіший dependency graph. Long-term: NgModules стануть compatibility layer, core Angular APIs будуть standalone-only."
    commonMistakes:
      - "Очікують драматичне зменшення bundle без зміни архітектури"
      - "Не аналізують bundle до і після міграції"
      - "Ігнорують що tree-shaking залежить від static import graph, не від standalone/module"
    relatedQuestions: ["b1t3q4", "b1t2q5"]
---

## Core Concept

**English definition:** Standalone components (directives, pipes) are Angular building blocks that manage their own compilation scope through an `imports` array, eliminating the need for NgModule declarations.

**Пояснення:** Standalone — це підхід де кожен component, directive чи pipe сам визначає свої залежності. Замість NgModule що групує компоненти, standalone component має власний `imports` масив: "мені потрібен RouterLink, NgClass, і ось цей DateFormatPipe". З Angular 19+ standalone є default — не потрібно навіть вказувати `standalone: true`.

**Яку проблему вирішує:** NgModules створювали indirection — щоб зрозуміти залежності компонента, треба було знайти його module, переглянути imports, і transitively дослідити exports кожного. Standalone робить dependencies explicit та local — відкрив component файл, побачив все.

**Як працює під капотом:**

1. Component decorated з `@Component({ imports: [...] })` (standalone: true за замовчуванням з v19)
2. Angular compiler аналізує imports і будує compilation scope для template
3. Runtime: `ɵɵStandaloneFeature` додається до component definition
4. При creation: Angular resolves directives/pipes з imports closure
5. Для DI: standalone component може мати свій `providers` array (element injector)
6. При lazy loading: `loadComponent` створює окремий chunk для single component

```typescript
// Angular 19+ — standalone за замовчуванням, не потрібно вказувати standalone: true
@Component({
  selector: 'app-user-profile',
  imports: [DatePipe, RouterLink, AvatarComponent],
  template: `
    <app-avatar [user]="user()" />
    <p>Joined: {{ user().createdAt | date:'longDate' }}</p>
    <a [routerLink]="['/users', user().id, 'edit']">Edit</a>
  `,
})
export class UserProfileComponent {
  user = input.required<User>();
}
```

**Trade-offs та обмеження:**

- Imports можуть бути verbose — кожен component вказує всі залежності
- Без NgModule boundaries — organizational structure на відповідальності developers/tooling
- Third-party бібліотеки без standalone exports потребують import через NgModule
- Migration cost для великих existing проєктів

**Версійність:**
- Angular 14: standalone API в developer preview (`standalone: true` explicit)
- Angular 15: standalone API stable, `bootstrapApplication()` stable
- Angular 16: standalone migration schematic
- Angular 17: standalone-first, `ng new` без NgModules, built-in control flow
- Angular 19: `standalone: true` за замовчуванням — прапорець можна опустити
- Angular 21: standalone — єдиний рекомендований підхід

## Deep Details

### Edge Cases

- **Standalone + NgModule interop:** Standalone component можна імпортувати в NgModule через imports (не declarations!). NgModule можна імпортувати в standalone component через imports.
- **Circular standalone imports:** Component A imports Component B, B imports A — Angular дозволяє через `forwardRef(() => ComponentB)` в imports. Але це code smell.
- **standalone: false explicit:** З Angular 19+ потрібно explicit `standalone: false` щоб component був NgModule-compatible. Забути це при міграції legacy code — часта помилка.
- **Host directives:** Standalone directive може бути hostDirective іншого standalone component — composition без template.

### Junior vs Senior Understanding

**Junior** знає: "standalone компоненти не потребують NgModule, додаю imports в компонент."

**Senior** розуміє: Standalone — це per-component compilation scope. Senior знає:
- Різницю між compilation scope (imports) та DI scope (providers, providedIn)
- Як standalone впливає на bundle: static import graph → tree-shaking
- Route-level providers як заміна lazy module providers
- Testing переваги: мінімальний TestBed setup

```typescript
// Route-level providers — заміна lazy NgModule providers
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [
      AdminGuard,
      { provide: API_BASE_URL, useValue: '/api/admin' },
    ],
    children: [
      { path: '', loadComponent: () => import('./admin-dashboard').then(m => m.AdminDashboard) },
      { path: 'users', loadComponent: () => import('./admin-users').then(m => m.AdminUsers) },
    ],
  },
];

// Testing standalone component — мінімальний setup
it('should render user name', async () => {
  const fixture = TestBed.createComponent(UserProfileComponent);
  // Всі imports вже в component — не потрібен module configuration
  fixture.componentRef.setInput('user', mockUser);
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('John');
});
```

### Deprecation & Migration Path

- **NgModules:** Не deprecated, але standalone рекомендований для нових проєктів
- **Migration schematic:** `ng generate @angular/core:standalone` — три фази:
  1. `--mode convert-to-standalone` — додає standalone: true, переносить imports
  2. `--mode prune-ng-modules` — видаляє порожні модулі
  3. `--mode standalone-bootstrap` — міняє bootstrapModule на bootstrapApplication
- **Coexistence:** Standalone і NgModule-based components працюють разом — можна мігрувати поступово

### Connections to Other Concepts

- **NgModules:** Standalone замінює declarations в NgModule. NgModule все ще працює для imports.
- **Bootstrapping:** `bootstrapApplication()` — standalone-first bootstrap без AppModule.
- **Dependency Injection:** providers в standalone component → element injector. Route providers → environment injector.
- **Router:** `loadComponent` для lazy standalone components. Route providers для scoped DI.
- **Built-in Control Flow:** @if/@for/@switch — standalone-native, не потребує imports.

## Examples

### Basic Usage

```typescript
// Standalone component з Angular 19+ (standalone за замовчуванням)
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink, ImageOptimized],
  template: `
    <article>
      <img [ngSrc]="product().imageUrl" width="300" height="200" />
      <h3>{{ product().name }}</h3>
      <p>{{ product().price | currency:'UAH':'symbol' }}</p>
      @if (product().inStock) {
        <a [routerLink]="['/products', product().id]">Детальніше</a>
      } @else {
        <span class="out-of-stock">Немає в наявності</span>
      }
    </article>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();
}
```

### Production Scenario

```typescript
// Barrel export замість SharedModule
// shared/components/index.ts
export { SpinnerComponent } from './spinner/spinner.component';
export { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
export { PaginationComponent } from './pagination/pagination.component';
export { EmptyStateComponent } from './empty-state/empty-state.component';

// Lazy route з route-level providers
// features/orders/orders.routes.ts
export const ORDER_ROUTES: Routes = [
  {
    path: '',
    providers: [
      OrdersStore,
      { provide: ORDERS_API_CONFIG, useValue: { pageSize: 25, cacheTimeout: 300_000 } },
    ],
    children: [
      {
        path: '',
        loadComponent: () => import('./order-list.component').then(m => m.OrderListComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./order-detail.component').then(m => m.OrderDetailComponent),
      },
    ],
  },
];

// app.routes.ts
export const routes: Routes = [
  { path: 'orders', loadChildren: () => import('./features/orders/orders.routes').then(m => m.ORDER_ROUTES) },
];
```

### Anti-Example

```typescript
// ❌ WRONG: імпортувати весь CommonModule замість конкретних директив або built-in control flow
@Component({
  selector: 'app-list',
  imports: [CommonModule], // Тягне все з CommonModule — NgIf, NgFor, NgClass, AsyncPipe...
  template: `
    <div *ngIf="items.length">  <!-- Legacy structural directive syntax -->
      <div *ngFor="let item of items">{{ item.name }}</div>
    </div>
  `,
})
export class ListComponent {
  items: Item[] = [];
}

// ✅ CORRECT: built-in control flow — zero imports needed
@Component({
  selector: 'app-list',
  imports: [], // Нічого не потрібно для @if/@for
  template: `
    @if (items().length) {
      @for (item of items(); track item.id) {
        <div>{{ item.name }}</div>
      }
    }
  `,
})
export class ListComponent {
  items = input.required<Item[]>();
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Importing CommonModule в кожен standalone component | Зайвий overhead, legacy syntax | Built-in control flow (@if, @for), конкретні pipes |
| God component з 20+ imports | Порушення SRP, component робить забагато | Декомпозиція на менші standalone components |
| Standalone component без explicit imports — покладається на NgModule scope | Ламається при видаленні module | Кожен standalone component з повним imports списком |
| Використання standalone: false в нових компонентах | Legacy pattern, гірший tree-shaking | Standalone за замовчуванням (Angular 19+) |
| Дублювання providers в кожному standalone component | Multiple instances, inconsistent state | providedIn: 'root' або route-level providers |

## Interview Block

### [L1 — Warm-up] Що таке standalone component і чим він відрізняється від NgModule-based?
**Signal being tested:** Базове розуміння standalone API як default Angular підходу
**What the interviewer expects:** Знання imports масиву, відсутність потреби в NgModule, default з v19
**How to probe deeper:** "Чи можна використовувати NgModule-based компонент всередині standalone?"
**Reference answer:** Standalone component сам визначає залежності через imports масив — інші components, directives, pipes, або навіть NgModules. Не потребує декларації в NgModule. З Angular 19+ standalone за замовчуванням.
**Common mistakes:** Думають що standalone і NgModule несумісні; не знають що standalone тепер default

### [L2 — Mid] Як standalone component управляє залежностями? Що можна вказати в imports?
**Signal being tested:** Розуміння compilation scope та dependency management
**What the interviewer expects:** Типи imports, NgModule interop, built-in control flow, tree-shaking awareness
**How to probe deeper:** "Чому @if/@for не потребують imports? Як це працює?"
**Reference answer:** imports приймає standalone components/directives/pipes, NgModules (їх exports), масиви. Для NgModule — отримуєш тільки exports, не declarations. Built-in control flow (@if, @for) — zero imports. Tree-shaking: explicit static imports дозволяють bundler видаляти невикористане.
**Common mistakes:** Імпортують CommonModule замість конкретних елементів; плутають imports з ES imports

### [L3 — Mid] Як надавати сервіси в standalone world?
**Signal being tested:** Розуміння DI hierarchy в standalone context
**What the interviewer expects:** Три рівні providers, provide functions, route providers як заміна lazy module providers
**How to probe deeper:** "Коли використовувати route providers замість providedIn: 'root'?"
**Reference answer:** Три рівні: providedIn: 'root' (global singleton), route providers (scoped per route subtree), component providers (per instance). Provide functions (provideRouter, provideHttpClient) замінюють module forRoot. Route providers замінюють lazy module injectors.
**Common mistakes:** Не знають route-level providers; singleton в component providers; manual registration замість providedIn

### [L4 — Senior] Як мігрувати великий NgModule-based проєкт на standalone?
**Signal being tested:** Здатність планувати великомасштабну міграцію з risk management
**What the interviewer expects:** Phased strategy, tooling, testing, team coordination, rollback plan
**How to probe deeper:** "Які edge cases schematic не покриває?"
**Reference answer:** Аудит dependency graph → automated schematic в dry-run → bottom-up migration (leaf → shared → feature → app) → phased merges з CI validation. Edge cases: circular deps, custom ModuleWithProviders, dynamic module loading. Standalone і NgModule coexist — не потрібен big bang. Barrel exports замінюють SharedModule.
**Common mistakes:** Big-bang migration; не використовують dry-run; забувають про third-party modules

### [L5 — Staff] Як standalone API впливає на tree-shaking, bundle size та архітектуру?
**Signal being tested:** Системне розуміння compilation, bundling та architectural evolution
**What the interviewer expects:** Technical depth (import graph, compiler, bundler), metrics, future direction
**How to probe deeper:** "Як standalone model пов'язаний з partial hydration та signal-based components?"
**Reference answer:** Static import graph → ефективний tree-shaking (NgModule declarations opaque для bundler). loadComponent — per-component code splitting. Provide functions — tree-shakable features. Metrics: 8-12% bundle reduction, 15-20% faster compilation. Архітектурно: standalone — prerequisite для signal-based components, partial hydration. Boundaries enforcement через Nx/eslint замість NgModules.
**Common mistakes:** Очікують magic bundle reduction; не вимірюють before/after; ігнорують organizational impact

## Summary

### Key Points
- Standalone component сам визначає залежності через `imports` — не потребує NgModule
- З Angular 19+ `standalone: true` за замовчуванням — прапорець можна опустити
- `imports` приймає: standalone elements, NgModules (їх exports), масиви
- Built-in control flow (@if, @for, @switch) — не потребує imports взагалі
- Три рівні DI: `providedIn: 'root'`, route providers, component providers
- Tree-shaking краще: explicit static import graph замість opaque NgModule declarations
- Migration: `ng generate @angular/core:standalone` — автоматизовано, bottom-up, поетапно

### Elevator Pitch (2 minutes)
"Standalone components — це сучасний підхід Angular де кожен component сам визначає свої залежності через imports масив, без потреби в NgModule. З Angular 19+ це default behavior. Це спрощує mental model — відкрив component, бачиш всі залежності. Tree-shaking працює ефективніше завдяки explicit static import graph. DI в standalone world: providedIn: 'root' для singletons, route-level providers для scoped state, component providers для per-instance. Built-in control flow (@if, @for) усуває потребу імпортувати CommonModule. Міграція з NgModules автоматизована через schematic і може бути поетапною."
