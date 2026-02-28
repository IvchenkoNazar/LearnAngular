---
title: "Angular Animations"
block: 20
topic: 1
slug: "angular-animations"
difficulty: 3
sinceVersion: "2"
tags: ["Angular animations", "trigger", "state", "transition", "animate", "keyframes", "animateChild", "route animations"]
relatedTopics: ["animation-builder", "error-handling-observability", "keyboard-navigation"]
interviewQuestions:
  - id: "b20t1q1"
    level: "junior"
    question: "Як підключити Angular Animations до standalone додатку? В чому різниця між provideAnimations() і provideAnimationsAsync()?"
    referenceAnswers:
      junior: "provideAnimations() підключає Angular Animations синхронно. provideAnimationsAsync() завантажує animation engine асинхронно, що може покращити initial load time."
      mid: "provideAnimations() з `@angular/platform-browser/animations` — синхронне підключення, AnimationModule включається в initial bundle. provideAnimationsAsync() — lazy loads BrowserAnimationsModule (динамічний import), зменшує initial bundle. Різниця: якщо анімації критичні для initial render (nav transitions) — provideAnimations(). Якщо більшість анімацій below the fold — provideAnimationsAsync(). Для E2E тестування — `provideNoopAnimations()` відключає всі анімації."
      senior: "provideAnimationsAsync() використовує dynamic import: `import('@angular/animations/browser').then(m => m.ɵcreateEngine)`. Це відкладає BrowserAnimationBuilder, AnimationRenderer і WebAnimationsDriver до першого використання. Але: якщо initial route має animated component — анімація не спрацює при першому render (race condition між route activation і async module load). Workaround: `APP_INITIALIZER` що preloads animation module, або accept що перша navigation не animated. provideNoopAnimations(): замінює AnimationDriver на NoopAnimationDriver — всі `animate()` calls ігноруються, trigger callbacks все ще виконуються. Корисно для unit тестів де анімації уповільнюють perforamance."
      staff: "Вибір між sync і async animations — architectural рішення для bundle optimization. В enterprise додатках з heavy animation usage (dashboard charts, drag-drop interfaces): provideAnimations() — predictable, no race conditions. В content-heavy apps де більшість UI статична: provideAnimationsAsync() + PerformanceBudget для initial bundle. Angular 17+ router: view transitions API як native alternative до Angular animations для route transitions — zero JS overhead. Design system consideration: якщо shared component library uses animations, consumers мусять have provideAnimations() — це неявна залежність. Краще: provide fallback через `inject(ANIMATION_MODULE_TYPE, { optional: true })` і skip animations якщо module not provided."
    commonMistakes:
      - "Додають `BrowserAnimationsModule` в NgModule imports замість provideAnimations() в standalone"
      - "Не знають що provideNoopAnimations() дозволяє animation callbacks — animations skip, але lifecycle events спрацьовують"
    relatedQuestions: ["b20t1q2", "b20t1q3"]
  - id: "b20t1q2"
    level: "mid"
    question: "Поясни різницю між :enter і :leave aliases та state('*') wildcard в Angular Animations. Коли вони спрацьовують?"
    referenceAnswers:
      junior: ":enter спрацьовує коли елемент додається в DOM, :leave — коли видаляється. * — wildcard для будь-якого стану."
      mid: ":enter і :leave — aliases для void => * та * => void відповідно. void — стан елемента поза DOM. :enter: елемент появляється через *ngIf=true, @for, @if. :leave: видалення через *ngIf=false. Важливо: з Angular 17 новим control flow (@if, @for) — :enter і :leave працюють так само. Wildcard `*` в transition: `'* => active'` спрацьовує для будь-якого переходу в 'active'. `'* => *'` — для будь-якого переходу."
      senior: "void стан в Angular — спеціальний стан для 'не в DOM'. Sequence для :enter: 1) Елемент створюється в DOM. 2) Встановлюється initial style() з transition definition. 3) Animation виконується. Sequence для :leave: 1) Removal запрошується. 2) Angular затримує видалення DOM. 3) Animation виконується. 4) DOM видаляється. Проблема: :leave animation блокує route navigation якщо компонент не destroyed до navigationEnd. Підводний камінь з @if: якщо condition змінюється двічі швидко (true→false→true), :leave animation може конфліктувати з :enter. Angular cancels першу animation. State wildcard в trigger: якщо current state не відповідає жодному defined state — Angular uses style з найближчого default state або порожній."
      staff: "void/:enter/:leave lifecycle важливий для list animations і route transitions. Для list animations: `query(':enter', animateChild())` в parent trigger — кожен новий item animated. Але при великих списках (100+ items entering) — animate all items = performance problem. Рішення: `stagger()` з limit. Для route transitions: :leave на компоненті що виходить + :enter на наступному. Критична проблема: обидва компоненти в DOM під час transition — потрібен `position: absolute` на router-outlet children або RouterOutlet wrapper. Angular v17 ViewTransition API: `withViewTransitions()` в provideRouter — browser-native shared element transitions. Набагато простіший для route animations і не потребує void state management."
    commonMistakes:
      - "Плутають :enter/:leave з component ngOnInit/ngOnDestroy — вони пов'язані, але не ідентичні (re-attach не тригерить :enter якщо вже в DOM)"
      - "Не знають що :leave блокує DOM removal — анімація повинна завершитись"
    relatedQuestions: ["b20t1q1", "b20t1q3"]
  - id: "b20t1q3"
    level: "mid"
    question: "Що таке query() і stagger() в Angular Animations? Як реалізувати stagger animation для list items?"
    referenceAnswers:
      junior: "query() вибирає дочірні елементи для анімації. stagger() додає затримку між анімацією кожного елемента — ефект послідовного появи."
      mid: "`query(':enter', [style({opacity: 0}), stagger(50, [animate('300ms', style({opacity: 1}))])])` — кожен новий item анімується з затримкою 50ms. query() selector: CSS selectors, ':enter', ':leave', ':animating', ':self'. stagger(delay, animation): delay може бути від'ємним (reverse stagger — останні елементи анімуються першими). query з limit: `query(':enter', [...], { limit: 5 })` — animate тільки перші 5."
      senior: "query() і animateChild() — механізм для parent-child animation coordination. `animateChild()` — triggers child component triggers з parent transition. Без animateChild — child animations виконуються незалежно. З animateChild — parent controls timing. query(':animating') — selects elements currently animating — дозволяє interrupt current animation. Stagger internals: Angular calculator offset per item = index × delay. Від'ємний stagger: від останнього до першого. `stagger('0.1s', [...])` — string delay підтримується. Проблема великих списків: 100 items × 50ms = 5 секунд для останнього. Рішення: `{ limit: 10 }` + stagger тільки visible items (virtual scroll aware). Performance: query(':enter') виконує DOM query — expensive якщо великий subtree. Оптимізація: scope query до specific container, не весь компонент."
      staff: "query/stagger architecture для complex UI: 1) List появи (stagger enter): основний use case. 2) Cascade через компоненти (animateChild): parent transition triggers child. 3) Coordinated multi-element transitions (route change з floating elements): складний choreography. Альтернатива: CSS animations з animation-delay через CSS custom properties — `--stagger-index: N; animation-delay: calc(var(--stagger-index) * 50ms)` і Angular встановлює index через [style.--stagger-index]. Це: performant (CSS animation vs JS animation), simple, але менш dynamic. Motion sensitivity: `@media (prefers-reduced-motion: reduce)` — обов'язково disable stagger для accessibility. Angular не має вбудованої reduced-motion support — потрібна manual implementation через `inject(DOCUMENT).defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches`."
    commonMistakes:
      - "stagger без limit на великих списках — останні items анімуються через декілька секунд"
      - "Не враховують prefers-reduced-motion — users з vestibular disorders можуть мати seizures від heavy stagger animations"
    relatedQuestions: ["b20t1q2", "b20t1q4"]
  - id: "b20t1q4"
    level: "senior"
    question: "Як реалізувати route transition animations в Angular? Які підводні камені при реалізації?"
    referenceAnswers:
      junior: "Route animations — це анімація при переході між сторінками. Потрібно додати trigger на router-outlet і визначити transitions між routes."
      mid: "Route animations: 1) RouterOutlet з `@routeAnimation` binding: `<router-outlet #outlet='outlet'>` + `[@routeAnimation]='getRouteAnimationData(outlet)'`. 2) Trigger з transitions між route states. 3) `data: { animation: 'HomePage' }` в route config. Для crossfade: поточний і наступний компоненти мають бути `position: absolute` в router-outlet wrapper."
      senior: "Route animations архітектура: RouterOutlet snapshot надає поточний route data. `getRouteAnimationData(outlet)`: `outlet.activatedRouteData?.['animation']`. Trigger: `trigger('routeAnimation', [transition('* <=> *', [style({position: 'relative'}), query(':enter, :leave', [style({position: 'absolute', top: 0, left: 0, width: '100%'})], {optional: true}), query(':enter', [style({opacity: 0})]), query(':leave', animateChild(), {optional: true}), group([query(':leave', [animate('300ms ease-out', style({opacity: 0}))], {optional: true}), query(':enter', [animate('300ms ease-out', style({opacity: 1}))])]), query(':enter', animateChild())])])`. Проблеми: 1) query(':leave') може бути empty при initial load — потрібен optional: true. 2) Якщо leaving component має nested animations — animateChild() координує їх. 3) Scroll position при transition — окрема проблема. 4) Browser back button — transition reversed? Зазвичай ні."
      staff: "Route animations — expensive architectural feature. Trade-offs: 1) Complexity: router-outlet wrapper, position:absolute, query/animateChild — багато moving parts. 2) Performance: обидва компоненти в DOM під час transition = double rendering. 3) Scroll: scrollPositionRestoration конфліктує з animated transitions. Angular v17 ViewTransitions API: `provideRouter(routes, withViewTransitions())` — browser-native, підтримує `::view-transition-old` і `::view-transition-new` CSS pseudo-elements. Zero JS animation code, browser handles optimization (GPU layer promotion automatic). Shared element transitions (product card → product detail) — viewTransitionName CSS property. Обмеження: тільки Chrome 111+, Safari 18+ — progressive enhancement. For enterprise: ViewTransitions as enhancement + graceful degradation в старих browsers. Design consideration: route animations можуть бути harmful for motion-sensitive users — `prefers-reduced-motion` media query respected by ViewTransitions API automatically (!)."
    commonMistakes:
      - "Не додають optional: true на query(':leave') для initial route — animation breaks"
      - "Не встановлюють position:absolute на :enter/:leave — елементи розміщуються вертикально один за одним"
    relatedQuestions: ["b20t1q3", "b20t2q1"]
  - id: "b20t1q5"
    level: "staff"
    question: "Як Angular Animations виконуються під капотом? Що таке AnimationDriver і WebAnimationsDriver?"
    referenceAnswers:
      junior: "Angular Animations використовують Web Animations API або CSS animations для рендерингу. AnimationDriver — це abstraction що дозволяє Angular запускати анімації в різних середовищах."
      mid: "AnimationDriver — interface що abstracts animation execution. WebAnimationsDriver використовує Web Animations API (element.animate()). CssAnimationsDriver (legacy) використовував CSS transitions. NoopAnimationDriver — для тестів. В SSR: NoopAnimationDriver або ServerAnimationModule."
      senior: "Angular Animation pipeline: 1) Trigger definition (compile-time) → AST. 2) Runtime: AnimationBuilder compiles AST до AnimationFactory. 3) AnimationRenderer intercepts Angular rendering cycle. 4) На style changes — AnimationRenderer creates AnimationPlayer. 5) WebAnimationsDriver.animate() викликає `element.animate(keyframes, options)` — Web Animations API. 6) AnimationPlayer: play(), pause(), reset(), finish(), destroy(). 7) AnimationPlayer onDone/onStart callbacks — integration з Angular zone. WebAnimationsDriver vs CssKeyframesDriver: WAAPI надає programmatic control (pause, playback rate, currentTime), CSS keyframes — тільки fire-and-forget. Angular 9+ використовує WAAPI за замовчуванням. Edge case: `element.animate()` не підтримує анімацію display property — Angular обходить це через visibility + pointer-events."
      staff: "AnimationDriver architecture — це extensibility point Angular Animation system. Custom drivers: для React Native (Angular + React Native bridge), Canvas animation (WebGL), або testing. AnimationRenderer: wrap Angular Renderer2, intercept setAttribute/setStyle calls, queue animations. Timing з CD: animations запускаються в microtask після CD cycle. Це важливо: if component destroyed під час animation — player callbacks можуть trigger CD на destroyed component. Proper cleanup: `player.destroy()` в ngOnDestroy. Zone.js integration: animation callbacks run inside zone — trigger CD. Для performance: `zone.runOutsideAngular(() => player.play())` якщо animation callbacks не змінюють component state. GPU acceleration: Angular підтримує `will-change: transform` для GPU layer promotion — але AnimationBuilder не встановлює це автоматично. Manual: `[style.will-change]='isAnimating ? \"transform\" : \"auto\"'`. WebAnimationsAPI polyfill потрібний для Safari < 13.1."
    commonMistakes:
      - "Не destroy AnimationPlayer в ngOnDestroy — memory leak і callbacks на destroyed component"
      - "Анімують display property напряму — WAAPI не підтримує, Angular silently ignores"
    relatedQuestions: ["b20t2q1", "b20t1q4"]
---

## Core Concept

**English definition:** Angular Animations is a declarative DSL built on top of the Web Animations API that provides trigger/state/transition abstractions for defining component animations, with support for complex choreography via query(), stagger(), group(), sequence(), and route transition coordination.

**Пояснення:** Angular Animations — це JavaScript-based animation system, що компілює декларативні trigger/state/transition описи в Web Animations API calls. На відміну від CSS animations: повна інтеграція з Angular lifecycle, можливість trigger анімацій на основі component state, координація між батьківськими і дочірніми компонентами, і programmatic control (pause, reverse, playback rate).

**Яку проблему вирішує:** CSS animations складно синхронізувати з Angular state changes (потрібен клас toggle + animation end listener). Angular Animations надає: `state('expanded', style(...))` + `transition('collapsed <=> expanded', animate(...))` — анімація автоматично тригериться при зміні state. Також вирішує: coordinated multi-element animations (stagger lists), route transitions, parent-child animation orchestration.

**Як працює під капотом:**

1. **Compile-time:** `@Component` decorator з `animations: [trigger(...)]` — Angular compiler аналізує animation DSL і будує Animation AST
2. **Runtime — AnimationRenderer:** Ivy використовує `AnimationRenderer` (замість `Renderer2`) для компонентів з animations. Перехоплює `setStyle`, `setAttribute` calls
3. **Animation scheduling:** При зміні binding `[@triggerName]='state'` → `AnimationRenderer` queues animation check
4. **WebAnimationsDriver:** Translates Angular animation instructions до `element.animate(keyframes, options)` Web Animations API calls
5. **AnimationPlayer:** Повертається для lifecycle management (`play()`, `pause()`, `onDone()`)

```
Template [@trigger]='state' → Angular CD detects change →
AnimationRenderer.setProperty() → AnimationEngine.process() →
WebAnimationsDriver.animate() → element.animate() → CSS GPU layer
```

**Trade-offs та обмеження:**

- JS-driven animations мають overhead порівняно з CSS (parse, compile, schedule) — для simple transitions prefer CSS
- `display` property не може бути animated — WAAPI limitation
- SSR: animations skip (NoopAnimationDriver) — no WAAPI on server
- `prefers-reduced-motion` — Angular не обробляє автоматично, потрібна manual implementation
- Bundle size: BrowserAnimationsModule ~40KB gzipped — provideAnimationsAsync() рятує initial load

**Версійність:**
- Angular Animations з v2 (FormsModule-like separation)
- WebAnimationsDriver (WAAPI) як default з Angular 9 (раніше — CssKeyframesDriver)
- `provideAnimations()` standalone API з Angular 15
- `provideAnimationsAsync()` з Angular 17
- `withViewTransitions()` в Router (ViewTransition API) з Angular 17 — native browser alternative

## Deep Details

### Edge Cases

**:enter і change detection timing:** :enter анімація починається ПІСЛЯ першого CD cycle для нового елемента. Якщо в `ngAfterViewInit` змінюється state — може вийти два animation triggers. `ChangeDetectorRef.detectChanges()` може порушити timing.

**:leave і route navigation blocking:** Якщо leaving component має :leave animation і route changes — Angular чекає завершення :leave before destroying component. Якщо animation дуже довга або не завершується — navigation visually blocked. Timeout не вбудований. Workaround: short leave animations або `done` callback з `router.navigate()`.

**group() vs sequence():** `group([a, b])` — паралельно, загальний час = max(a, b). `sequence([a, b])` — послідовно, загальний час = a + b. `group` всередині `sequence` — спочатку паралельний блок, потім наступний.

**animateChild() timing:** Без explicit `animateChild()` в parent transition — child animations виконуються незалежно від parent. З `animateChild()` — child animations pauseable parent-ом.

**keyframes() offset:** Явний offset: `keyframes([style({..., offset: 0}), style({..., offset: 0.3}), style({..., offset: 1})])`. Без offset — рівномірний розподіл. Якщо один keyframe має offset — всі мусять.

### Junior vs Senior Understanding

**Junior знає:** trigger/state/transition/animate синтаксис, :enter/:leave basics, style() для CSS properties.

**Senior розуміє:**

1. **AnimationPlayer lifecycle:** `play()` після `init()`, `pause()` + `play()` для resumable animations, `reset()` → start state, `finish()` → end state instant, `destroy()` для cleanup. onDone/onStart callbacks — inside zone by default.

2. **Animation optimization:** Тільки `transform` і `opacity` — не викликають layout reflow. `height: * → auto` — Angular може animate через calculated pixel values, але повільно. Краще: `transform: scaleY()` + `overflow: hidden`.

3. **State persistence:** Після transition завершення Angular встановлює final state styles inline (через element.style). При наступному render ці стилі можуть конфліктувати. `state('*', style({...}))` як catch-all.

4. **Disable animations в tests:** `NoopAnimationDriver` (via `provideNoopAnimations()`) відключає анімації але callbacks спрацьовують. Для unit tests де animation timing важлива: `TestBed.overrideComponent()` + `fakeAsync()` + `tick()`.

5. **Angular animations vs CSS animations:** Angular — для state-driven, component-integrated animations. CSS — для hover, focus, simple transitions. Правило: якщо animation triggered by JavaScript state change — Angular animations. If pure visual feedback (hover, active) — CSS.

### Deprecation & Migration Path

- `BrowserAnimationsModule` → `provideAnimations()` для standalone (Angular 15+)
- `BrowserModule` → не потрібен standalone — `BrowserAnimationsModule` також
- Legacy `AnimationBuilder.build()` → все ще valid, але `AnimationPlayer` manual management складний
- `@angular/animations/browser` WebAnimationsPlayer — direct access для low-level control
- ViewTransitions API (v17+) як progressive enhancement для route animations

### Connections to Other Concepts

- **AnimationBuilder** (`animation-builder`) — programmatic, imperative animation API
- **CDK A11y** (`cdk-a11y`) — `prefers-reduced-motion` awareness перед animation trigger
- **Performance** — GPU layer promotion, will-change, composite properties
- **Router** — route transition animations, ViewTransitions API

## Examples

### Basic Usage

```typescript
// Базовий toggle animation
import {
  trigger, state, style, transition, animate
} from '@angular/animations';

@Component({
  selector: 'app-accordion',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        overflow: 'hidden',
        opacity: 0,
      })),
      state('expanded', style({
        height: '*',  // '*' = natural height
        overflow: 'visible',
        opacity: 1,
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
    ])
  ],
  template: `
    <button (click)="toggle()" [attr.aria-expanded]="isExpanded">
      Toggle
    </button>
    <div [@expandCollapse]="isExpanded ? 'expanded' : 'collapsed'">
      <ng-content></ng-content>
    </div>
  `
})
export class AccordionComponent {
  isExpanded = false;
  toggle(): void { this.isExpanded = !this.isExpanded; }
}
```

### Production Scenario

```typescript
// List stagger animation з prefers-reduced-motion support
import {
  trigger, transition, style, animate,
  query, stagger, animateChild
} from '@angular/animations';
import { DOCUMENT } from '@angular/common';

const prefersReducedMotion = () =>
  inject(DOCUMENT).defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;

@Component({
  selector: 'app-results-list',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-15px)' }),
          stagger(60, [
            animate('400ms ease-out',
              style({ opacity: 1, transform: 'none' })
            )
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <ul [@listAnimation]="items.length">
      @for (item of items; track item.id) {
        <li>{{ item.name }}</li>
      }
    </ul>
  `
})
export class ResultsListComponent {
  @Input() items: Item[] = [];
  private reducedMotion = prefersReducedMotion();

  // В production: перевіряти reduced motion і відключати stagger
  constructor() {
    if (this.reducedMotion) {
      // Disable trigger via [attr.@listAnimation] binding to null
    }
  }
}

// Route transition animation
@Component({
  selector: 'app-root',
  animations: [
    trigger('routeAnimation', [
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({ position: 'absolute', top: 0, left: 0, width: '100%' })
        ], { optional: true }),
        query(':enter', [style({ opacity: 0, transform: 'translateX(20px)' })], { optional: true }),
        query(':leave', animateChild(), { optional: true }),
        group([
          query(':leave', [
            animate('200ms ease-out',
              style({ opacity: 0, transform: 'translateX(-20px)' })
            )
          ], { optional: true }),
          query(':enter', [
            animate('200ms 100ms ease-out',
              style({ opacity: 1, transform: 'none' })
            )
          ], { optional: true })
        ]),
        query(':enter', animateChild(), { optional: true })
      ])
    ])
  ],
  template: `
    <div [@routeAnimation]="getRouteAnimationData(outlet)">
      <router-outlet #outlet="outlet"></router-outlet>
    </div>
  `
})
export class AppComponent {
  getRouteAnimationData(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['animation'] ?? '';
  }
}
```

### Anti-Example

```typescript
// ❌ Анімація layout properties — викликає reflow
@Component({
  animations: [
    trigger('bad', [
      transition(':enter', [
        style({ width: 0, height: 0, marginLeft: '100px' }),
        animate('500ms', style({ width: '200px', height: '100px', marginLeft: 0 }))
      ])
    ])
  ]
})
export class BadAnimationComponent {}

// ✅ Тільки transform і opacity — GPU composited
@Component({
  animations: [
    trigger('good', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8) translateX(20px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'none' })
        )
      ])
    ])
  ]
})
export class GoodAnimationComponent {}

// ❌ Route animation без optional: true
@Component({
  animations: [
    trigger('routeAnimation', [
      transition('* <=> *', [
        query(':leave', animate('200ms', style({ opacity: 0 }))), // ❌ Fails on initial load!
        query(':enter', animate('200ms', style({ opacity: 1 })))
      ])
    ])
  ]
})
export class BadRouteComponent {}
// ✅ { optional: true } на :leave query
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Анімація `height`, `width`, `margin`, `padding` | Layout properties викликають reflow і repaint — jank | Анімувати тільки `transform` і `opacity` — GPU composited, no reflow |
| query(':leave') без `{ optional: true }` | При першому render немає leaving element — animation throws error | Завжди додавати `{ optional: true }` для :enter/:leave queries |
| Stagger без ліміту на великих списках | 100 items × 100ms = 10 секунд для останнього item | `stagger()` з `{ limit: 10 }` або зменшити delay |
| AnimationPlayer без destroy в ngOnDestroy | Memory leak, callbacks можуть trigger на destroyed component | `player.destroy()` в `ngOnDestroy` |
| BrowserAnimationsModule в standalone | Legacy NgModule підхід, більший bundle | `provideAnimations()` або `provideAnimationsAsync()` в appConfig |

## Interview Block

### [L1 — Warm-up] Як підключити Angular Animations до standalone додатку? В чому різниця між provideAnimations() і provideAnimationsAsync()?

**Signal being tested:** Знання standalone API і розуміння bundle optimization через async loading.

**What the interviewer expects:** `provideAnimations()` vs `provideAnimationsAsync()`, `provideNoopAnimations()` для тестів, розуміння trade-offs.

**How to probe deeper:** "Коли provideAnimationsAsync() може зламати UX?" — якщо initial route має animated component — перша анімація пропускається (race condition).

**Reference answer:** Standalone: `provideAnimations()` в appConfig.providers — синхронне підключення. `provideAnimationsAsync()` — dynamic import animation engine, зменшує initial bundle. `provideNoopAnimations()` — відключає анімації (E2E тести). Якщо перший route animated — provideAnimations() надійніший.

**Common mistakes:** `BrowserAnimationsModule` в imports замість providers. Не знають про NoopAnimations для тестів.

---

### [L2 — Mid] Поясни різницю між :enter/:leave aliases та state('*') wildcard.

**Signal being tested:** Розуміння void state і animation lifecycle, а не просто API знання.

**What the interviewer expects:** void стан, sequence :enter (style → animate), :leave (затримка DOM removal), wildcard семантика.

**How to probe deeper:** "Що відбудеться якщо :leave animation не завершується?" — DOM не видаляється поки animation active — navigation може бути blocked.

**Reference answer:** `:enter` = `void => *` (вхід в DOM), `:leave` = `* => void` (вихід). void — спеціальний стан поза DOM. Angular затримує DOM removal до завершення :leave. Wildcard `*` матчить будь-який стан. `:enter/:leave` — aliases, `<=>` — двонаправлений transition shorthand.

**Common mistakes:** Плутають void з null. Не знають що :leave затримує видалення.

---

### [L3 — Senior] Як реалізувати route transition animations в Angular? Які підводні камені?

**Signal being tested:** Практичний досвід з route animations, знання position:absolute requirement і optional: true.

**What the interviewer expects:** RouterOutlet binding, getRouteAnimationData, query optional, position:absolute для concurrent display, animateChild координація.

**How to probe deeper:** "Як ViewTransitions API (Angular 17) спрощує route animations?" — browser-native, CSS pseudo-elements, zero JS animation code, reduced-motion automatic.

**Reference answer:** RouterOutlet з `[@routeAnimation]='getRouteAnimationData(outlet)'`. `data: { animation: 'Home' }` в route config. Trigger з query(':enter, :leave') — обов'язково `{ optional: true }` для initial load. `position: absolute` на router-outlet wrapper і children — для concurrent display. animateChild() для child animations coordination. Angular 17: `withViewTransitions()` як simpler native alternative.

**Common mistakes:** optional: true пропущений. Не встановлюють position:absolute — componnents stack vertically.

---

### [L4 — Staff/Principal] Як Angular Animations виконуються під капотом? Що таке AnimationDriver і WebAnimationsDriver?

**Signal being tested:** Глибоке розуміння animation pipeline — від Angular DSL до Web Animations API, і performance implications.

**What the interviewer expects:** AnimationRenderer, AnimationEngine, WebAnimationsDriver → element.animate(), GPU optimization, zone.js integration, cleanup requirements.

**How to probe deeper:** "Як оптимізувати animations для 60fps на mobile?" — transform/opacity only, will-change, runOutsideAngular, GPU layer promotion.

**Reference answer:** Pipeline: trigger definition → Angular compiler AST → AnimationRenderer intercepts setStyle/setAttribute → AnimationEngine processes → WebAnimationsDriver.animate() → element.animate() WAAPI. AnimationPlayer: play/pause/reset/finish/destroy lifecycle. Zone.js: callbacks inside zone → CD trigger. Optimization: runOutsideAngular для playback якщо callbacks не потребують CD. Cleanup: player.destroy() в ngOnDestroy.

**Common mistakes:** Не destroy player — memory leak і callbacks on destroyed component.

## Summary

### Key Points

- `provideAnimations()` (sync) vs `provideAnimationsAsync()` (lazy) — вибір залежить від initial route animation needs.
- `:enter`/`:leave` = `void => *` / `* => void` — Angular затримує DOM removal до завершення :leave animation.
- `query()` + `stagger()` для list animations — завжди `{ optional: true }` і `{ limit: N }` для performance.
- Route animations потребують `position: absolute` на router-outlet children і `{ optional: true }` на :leave query.
- AnimationDriver pipeline: Angular DSL → WebAnimationsDriver → `element.animate()` Web Animations API.
- Тільки `transform` і `opacity` — GPU composited, no reflow. Анімація layout properties = jank.
- `prefers-reduced-motion` — Angular не обробляє автоматично, потрібна manual implementation.

### Elevator Pitch (2 minutes)

Angular Animations — declarative DSL поверх Web Animations API. Compiler перетворює `trigger/state/transition/animate` DSL в Animation AST, `AnimationRenderer` перехоплює Angular rendering, `WebAnimationsDriver` викликає `element.animate()` WAAPI.

Ключові concepts: `:enter`/`:leave` (void state transitions), `query()` + `stagger()` для coordinated list animations, `animateChild()` для parent-child orchestration, `group()`/`sequence()` для timing control.

Performance rules: animate тільки `transform` і `opacity` — GPU layer, no reflow. `{ optional: true }` на query для :leave в route transitions. `stagger({ limit: N })` для великих списків. `prefers-reduced-motion` — manual check, disable стagger/heavy animations.

Angular 17: `provideAnimationsAsync()` + `withViewTransitions()` — async load + browser-native route transitions.
