---
title: "Programmatic Animations with AnimationBuilder"
block: 20
topic: 2
slug: "animation-builder"
difficulty: 4
sinceVersion: "4"
tags: ["AnimationBuilder", "AnimationPlayer", "programmatic animation", "Web Animations API", "performance", "will-change"]
relatedTopics: ["angular-animations", "error-handling-observability", "logging-monitoring"]
interviewQuestions:
  - level: "junior"
    question: "Що таке AnimationBuilder і коли його використовувати замість декларативних animations в компоненті?"
    referenceAnswers:
      junior: "AnimationBuilder дозволяє створювати анімації програматично в TypeScript, а не декларативно в @Component animations масиві. Корисний коли анімація залежить від runtime даних."
      mid: "AnimationBuilder — service для imperatively creating animations. `builder.build(animation)` повертає AnimationFactory, `factory.create(element)` повертає AnimationPlayer. Use cases: анімації де target element невідомий до runtime (dynamic components), scroll-triggered animations, animations з dynamic duration/easing на основі data, canvas/WebGL integration, анімації поза компонентом (наприклад, loading overlay injected в body)."
      senior: "AnimationBuilder vs declarative animations: declarative — compiler-optimized, TypeScript type checking, integrated з CD cycle. AnimationBuilder — runtime compilation, більш flexible, але extra overhead на build. Internals: `AnimationBuilder.build()` викликає `AnimationCompiler.buildTrigger()` — same compiler as declarative, але at runtime. `AnimationFactory.create(element)` — instantiates AnimationPlayer з конкретним DOM element. Player lifecycle: needs manual `play()`, responds to `onDone`/`onStart` callbacks. Важливо: AnimationBuilder потребує `BrowserAnimationsModule` або `provideAnimations()` — не незалежний."
      staff: "AnimationBuilder design patterns для складних UI: 1) Reusable animation factories (animation services) — один AnimationFactory + multiple instances for same effect. 2) Scroll-linked animations без ScrollTimeline API (pre-Chrome 115) — AnimationPlayer.setPosition() не існує в Angular, але через WebAnimationsPlayer: `(player as any).domPlayer.currentTime = scrollProgress * duration`. 3) Physics-based animations — calculate velocity, create AnimationPlayer з dynamic duration. 4) Sequential complex animations — Promise chain з onDone callbacks. Architectural concern: AnimationBuilder usage розкидане по сервісах і компонентах важко дебажити. Централізований AnimationService з registry pattern допомагає. In v17+: consider Web Animations API напряму для fine-grained control — Angular AnimationBuilder overhead не завжди виправданий."
    commonMistakes:
      - "Не знищують AnimationPlayer в ngOnDestroy — memory leak і potential animation on destroyed element"
      - "Викликають factory.create() без подальшого player.play() — animation не починається автоматично"
    relatedQuestions: ["b20t2q2", "b20t1q5"]
  - level: "mid"
    question: "Як управляти lifecycle AnimationPlayer? Які методи доступні і коли їх використовувати?"
    referenceAnswers:
      junior: "AnimationPlayer має методи play(), pause(), reset(), finish(), destroy() для управління станом анімації."
      mid: "AnimationPlayer lifecycle: `init()` — підготовка (викликається автоматично при create). `play()` — запуск з поточної позиції. `pause()` — зупинка. `reset()` — повернення в початковий стан і pause. `finish()` — стрибок до кінцевого стану. `destroy()` — cleanup, звільнення ресурсів. Callbacks: `onStart(fn)`, `onDone(fn)`, `onDestroy(fn)`. `totalTime` property — повна тривалість. `position` (0-1) — поточна позиція (read-only в Angular player, але через DOM player accessible)."
      senior: "AnimationPlayer internals: кожен player тримає reference на DOM element і animation keyframes. `play()` викликає `element.animate()` якщо ще не started, або `animation.play()` якщо paused. `pause()` → `animation.pause()`. `finish()` → `animation.finish()`. `reset()` → `animation.cancel()` + re-create. Важливий edge case: якщо element видаляється з DOM під час animation — player callbacks все ще виконуються, але DOM operations можуть fail. Guard: `if (this.document.contains(element))`. onDone timing: fired після CSS transition end або requestAnimationFrame callback. Multiple players на одному element: можуть конфліктувати якщо анімують ті самі CSS properties. Web Animations API composite mode: 'replace' (default) vs 'add' vs 'accumulate'. Angular uses 'replace' завжди — потрібен custom driver для 'add'."
      staff: "AnimationPlayer в production scenario: 1) Interruptible animations — pause поточний, start new, blend keyframes (complex). Простіший підхід: `finish()` + нова animation. 2) Chained animations — `player1.onDone(() => player2.play())` — але не забути destroy player1. Promise-based: `new Promise(resolve => player.onDone(resolve))`. 3) Controlling playback rate: Web Animations API `animation.playbackRate = 2` — Angular player does not expose. Через `(player as WebAnimationsPlayer).domPlayer.playbackRate`. 4) Animation groups — якщо N elements мають синхронні animations — GroupPlayer (CDK internal) або manual coordination через `forkJoin`-like pattern. 5) SSR guard: `PLATFORM_ID` check — `isPlatformBrowser(platformId)` перед `builder.build().create()`. Design concern: AnimationPlayer management в service (create, track, destroy) vs in component (simple but scattered). For complex UIs: animation service registry pattern."
    commonMistakes:
      - "Не викликають destroy() після onDone — player тримає reference на element"
      - "Намагаються повторно play() після destroy() — player недійсний"
    relatedQuestions: ["b20t2q1", "b20t2q3"]
  - level: "mid"
    question: "Коли варто використовувати CSS animations замість Angular AnimationBuilder? Які критерії вибору?"
    referenceAnswers:
      junior: "CSS animations простіші і не потребують JavaScript. Angular AnimationBuilder потрібен коли анімація залежить від JS state або потребує programmatic control."
      mid: "CSS animations: hover effects, focus rings, simple transitions — pure CSS, zero JS overhead, browser-optimized. Angular declarative animations: state-driven transitions (expanded/collapsed), :enter/:leave lifecycle animations. AnimationBuilder: runtime-determined targets, dynamic durations, pause/resume/rewind control, non-component DOM elements. Правило: якщо animation triggered by CSS class або pseudo-class — CSS. Якщо triggered by JavaScript state — Angular animations."
      senior: "Детальніший decision tree: CSS transitions — для continuous state changes (hover, active) що описуються CSS properties. CSS animations (@keyframes) — looping animations, independent від JS. Angular declarative — state machine animations з конкретними states і transitions, :enter/:leave lifecycle. AnimationBuilder — imperative control, scroll-linked, dynamic targets. Web Animations API напряму (без Angular) — для performance-critical animations де Angular overhead неприйнятний, або cross-framework shared animation logic. Performance: CSS animations (compositor thread, no JS) > Web Animations API (GPU composited, JS control) > Angular AnimationBuilder (JS + Angular overhead) > CSS class toggle з JS. JS animations блокують main thread тільки якщо non-composited properties (width, height) — composited properties (transform, opacity) завжди GPU."
      staff: "Architectural decision для design system: standardize animation approach. Recommendation: 1) CSS custom properties + keyframes для brand animations (loading, skeleton) — zero framework coupling. 2) Angular declarative triggers для component state animations — integrated з Angular lifecycle. 3) AnimationBuilder тільки для виняткових cases (scroll-linked, dynamic targets). 4) Web Animations API (element.animate()) для utilities і micro-interactions в performance-critical contexts. Consistency matters: якщо різні developers використовують різні підходи — codebase стає важкою для підтримки. Shared animation tokens: design system animation variables (durations, easings) в CSS custom properties і reused в Angular animation constants. `export const ANIMATION_DURATION = { short: 150, medium: 300, long: 500 }` і `const duration = ANIMATION_DURATION.medium; animate('${duration}ms ease')`."
    commonMistakes:
      - "Використовують AnimationBuilder для hover effects — CSS набагато простіше і performant"
      - "Не враховують compositor thread — думають що всі CSS animations автоматично GPU"
    relatedQuestions: ["b20t2q2", "b20t2q4"]
  - level: "senior"
    question: "Що таке will-change і composite properties в контексті Angular animations? Як правильно ними управляти?"
    referenceAnswers:
      junior: "will-change — CSS property що підказує браузеру наперед підготувати GPU layer для елемента перед анімацією, що покращує performance."
      mid: "will-change: transform/opacity — підказує браузеру promote element на окремий GPU layer (compositing layer). Переваги: анімація на GPU, не блокує main thread. Недоліки: кожен layer = додаткова GPU memory. Не ставити will-change назавжди — тільки під час animation. В Angular: `[style.will-change]='isAnimating ? \"transform\" : \"auto\"'`. Composite properties: transform, opacity, filter — анімуються на GPU. Non-composite: width, height, margin — reflow + repaint."
      senior: "GPU layer promotion механізм: browser creates compositing layer коли: `will-change: transform`, `transform: translateZ(0)` (hack), `position: fixed`, `video/canvas`, деякі `filter`. Кожен layer: GPU memory (текстура), CPU для initial rasterization, memory bandwidth для compositing. will-change overuse — OOM на mobile з many layers. Correct approach: встановлювати will-change прямо перед animation start, знімати відразу після. In Angular: AnimationBuilder `onStart`: `el.style.willChange = 'transform, opacity'`, `onDone`: `el.style.willChange = 'auto'`. Angular declarative animations: немає автоматичного will-change — потрібно manual через host bindings або styles в trigger. Composite properties: transform (translate, scale, rotate — GPU) vs left/top (layout — CPU). CSS `translate`, `rotate`, `scale` (окремі properties, CSS 2022) — compositor-only, не потребують full style recalculation."
      staff: "will-change strategy для enterprise apps: 1) Audit layers в DevTools (Rendering → Layer borders) — identify excessive layerization. 2) Animation performance budget: target 16ms per frame (60fps) on mid-range device. 3) For route transitions: will-change на outgoing component on NavigationStart, remove on AnimationEnd. 4) Avoid will-change in CSS static styles (буде в CSS постійно) — тільки через JS перед animation. 5) Mobile budget: mid-range Android — ~512MB RAM, кожен compositing layer = декілька MB GPU memory. 6) Containment CSS: `contain: layout paint` — reduces reflow scope. 7) content-visibility: auto для off-screen content — reduces rendering work. Angular-specific: Zoneless + signals = fewer CD cycles = less interference with animation frames. Profiling: Chrome DevTools Performance tab → Main thread blocking, Layers tab → layer count и memory."
    commonMistakes:
      - "Встановлюють `will-change: transform` в static CSS на всі animated elements — надлишкові GPU layers, OOM на mobile"
      - "Анімують `left`/`top` замість `transform: translate()` — layout reflow замість compositing"
    relatedQuestions: ["b20t2q3", "b20t2q5"]
  - level: "staff"
    question: "Як відключати Angular animations для тестів і для користувачів з prefers-reduced-motion? Яка правильна стратегія?"
    referenceAnswers:
      junior: "provideNoopAnimations() в TestBed відключає анімації для тестів. prefers-reduced-motion — CSS media query для користувачів з motion sensitivity."
      mid: "Тести: `provideNoopAnimations()` в TestBed providers. prefers-reduced-motion: CSS `@media (prefers-reduced-motion: reduce) { transition: none; animation: none; }`. В Angular animations: перевірити `window.matchMedia('(prefers-reduced-motion: reduce)').matches` і умовно встановити animation duration до 0."
      senior: "Дві окремі проблеми: 1) Test animations: `provideNoopAnimations()` — animations skip, duration=0, але callbacks (onDone) спрацьовують. Для unit tests що перевіряють animation state: `fakeAsync()` + `tick(duration)` для симуляції часу навіть з noop. 2) Reduced motion: Angular не має built-in support. Strategies: a) CSS only: `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms!important; transition-duration: 0.01ms!important; } }` — universal disable. b) Angular-specific: inject DOCUMENT, `matchMedia`, build AnimationPlayer з duration=0. c) AnimationModule override: custom AnimationDriver що скорочує duration. d) Tokens: inject `ANIMATION_DURATION` token що визначається на основі matchMedia — `useFactory: () => prefersReducedMotion() ? 0 : 300`. Проблема підходу (a): Angular animations у JS не читають CSS animations duration — вони синхронізуються через WAAPI. Отже CSS `animation-duration: 0.01ms` не впливає на Angular's animate('300ms')."
      staff: "Reduced motion та animations — accessibility і inclusivity concern. WCAG 2.3.3 (AAA): motion animation triggered by interaction can be disabled. WCAG 2.3.1 (A): нічого не блимає більше ніж 3 рази на секунду. Systematic approach: 1) AppModule/appConfig level: provide `ANIMATIONS_ENABLED` token based on matchMedia. 2) Global AnimationDriver override: `class ReducedMotionDriver extends WebAnimationsDriver { animate(el, kf, opts) { if (!this.enabled) opts = {...opts, duration: 1}; return super.animate(el, kf, opts); } }`. 3) Listen for matchMedia changes (user can toggle OS setting) — `matchMedia.addEventListener('change', ...)`. 4) User preference override: якщо user explicitly wants animations (button in UI) — override OS preference. 5) Testing: unit test з mocked matchMedia, E2E з `--force-prefers-reduced-motion` Playwright flag. 6) Design system: animation should be 'enhancement' not 'essential' — content readable і usable без animation. Communicate with design team: кожна animation має `purpose` (feedback? delight? navigation cue?) і reduced motion alternative."
    commonMistakes:
      - "Думають що CSS `@media (prefers-reduced-motion)` відключає Angular JS animations — ні, Angular animate() незалежний від CSS"
      - "Не тестують scenario де OS reduced motion увімкнено під час сесії (user може змінити в OS settings)"
    relatedQuestions: ["b20t2q4", "b20t1q1"]
---

## Core Concept

**English definition:** `AnimationBuilder` is an Angular service that enables imperative (programmatic) creation of animation players — building animation factories from animation metadata at runtime, creating `AnimationPlayer` instances bound to specific DOM elements, and providing full lifecycle control (play, pause, reset, finish, destroy).

**Пояснення:** AnimationBuilder заповнює gap між декларативними animations в `@Component` і сценаріями де animation target або параметри невідомі до runtime. Замість `[@trigger]='state'` в темплейті — `builder.build(animation).create(element).play()` в TypeScript. Це особливо корисно для: dynamically injected components, scroll-triggered animations, animations з runtime-calculated durations, і взаємодії з third-party DOM elements.

**Яку проблему вирішує:** Декларативні animations `@Component.animations` прив'язані до конкретного компонента і його template. AnimationBuilder потрібен коли:
- Target element визначається в runtime (dynamic component, query result)
- Animation triggered поза Angular lifecycle (intersection observer, third-party event)
- Потрібен programmatic control (pause, seek, reverse)
- Animation logic shared між різними компонентами без дублювання

**Як працює під капотом:**

```
AnimationBuilder.build(AnimationMetadata)
  → AnimationCompiler.buildTrigger() — same compiler as declarative animations
  → AnimationFactory (reusable factory для конкретної animation definition)

AnimationFactory.create(HTMLElement)
  → new WebAnimationsPlayer(element, keyframes, options)
  → Binds DOM element to player

AnimationPlayer.play()
  → element.animate(keyframes, options) — Web Animations API
  → Returns Animation object (WAAPI)
  → onDone: animation.onfinish callback (zone-wrapped)
```

**Trade-offs та обмеження:**

- **Runtime compilation overhead:** AnimationBuilder.build() виконується в runtime, а не compile-time — slight overhead per call. Solution: create factory once, reuse for multiple elements.
- **Manual lifecycle management:** На відміну від декларативних animations, AnimationPlayer потребує explicit `play()` і `destroy()`.
- **SSR incompatibility:** WAAPI недоступний на сервері — `isPlatformBrowser()` guard обов'язковий.
- **No automatic will-change:** Declarative animations також не встановлюють will-change — але AnimationBuilder дає повний control для manual management.
- **Reduced motion:** Не обробляється автоматично — AnimationBuilder не перевіряє `prefers-reduced-motion`.

**Версійність:**
- AnimationBuilder API стабільний з Angular 4
- `AnimationFactory` і `AnimationPlayer` — незмінний API
- Angular 9+ WebAnimationsDriver як default (WAAPI)
- Angular 17: Web Animations API напряму може замінити AnimationBuilder для fine-grained control без Angular overhead

## Deep Details

### Edge Cases

**Factory reuse:** `AnimationFactory` є reusable — `builder.build(animation)` викликати once, `factory.create(element)` — для кожного нового element. Не rebuild factory при кожному animation start.

**Player після destroy:** Після `player.destroy()` — `play()`, `pause()`, `reset()` викидають errors або silent fail. Guard: `if (this.player) { this.player.destroy(); this.player = null; }` перед створенням нового.

**Concurrent animations на одному element:** `element.animate()` викликаний двічі — обидві animations active. WAAPI composite mode: за замовчуванням 'replace' — друга замінює першу для тих самих properties. 'add' і 'accumulate' — angular animation builder не підтримує напряму.

**onDone в SSR:** AnimationPlayer callbacks спрацьовують навіть в NoopAnimationPlayer (для provideNoopAnimations) — але timing: immediate (не async). Тести що залежать від onDone мають бути `fakeAsync` aware.

**Angular Zone і animation callbacks:** `onDone`, `onStart` — виконуються всередині Angular zone за замовчуванням → trigger CD. Якщо animation completion не потребує UI update — `zone.runOutsideAngular()` для onDone wrapper.

### Junior vs Senior Understanding

**Junior знає:** build() + create() + play() синтаксис, що AnimationPlayer має pause/finish/destroy.

**Senior розуміє:**

1. **Factory vs Player:** AnimationFactory — stateless, reusable blueprint. AnimationPlayer — stateful, tied до конкретного DOM element. Multiple players від однієї factory — кожен незалежний стан.

2. **WAAPI domPlayer access:** `(player as any).domPlayer` (або `(player as WebAnimationsPlayer).domPlayer`) — прямий доступ до WAAPI Animation object. Enables: `domPlayer.playbackRate = 2` (2x speed), `domPlayer.currentTime = 500` (seek), `domPlayer.effect?.getComputedTiming()` (current state).

3. **Composition with CSS animations:** AnimationBuilder animations і CSS animations на одному element — можуть конфліктувати для same properties. WAAPI з `fill: 'forwards'` і CSS animation oboth setting `transform` — undefined behavior in some browsers.

4. **Memory model:** `create(element)` creates WebAnimationsPlayer що тримає reference на element. Element removed from DOM → player ще active (WAAPI continues even if element detached). Must explicitly call `player.destroy()` — навіть якщо element видалений.

5. **Group vs sequence in builder:** `group([animate(...), animate(...)])` → parallel execution. `sequence([animate(...), animate(...)])` → sequential. Combination: `sequence([group([...]), animate(...)])` — паралельний блок потім послідовний.

### Deprecation & Migration Path

- `AnimationBuilder` API стабільний, без planned deprecation
- Web Animations API (без Angular wrapper) стає viable alternative для complex programmatic animations — підтримка Chrome, Firefox, Safari 13.1+
- `AnimationPlayer.domPlayer` — незадокументований internal API, але широко використовується для playbackRate control. Може змінитись у future versions.

### Connections to Other Concepts

- **Angular Animations** (`angular-animations`) — AnimationBuilder використовує той же compiler і driver
- **Performance** — will-change management, GPU layer promotion, reduced-motion
- **CDK A11y** — animations треба disable для prefers-reduced-motion users
- **Error Handling** — AnimationPlayer errors (invalid keyframes, unsupported properties) потрібно handle

## Examples

### Basic Usage

```typescript
import { AnimationBuilder, AnimationFactory, AnimationPlayer } from '@angular/animations';
import { animate, style, keyframes } from '@angular/animations';

@Component({
  selector: 'app-highlight',
  template: `<div #box class="box">Content to highlight</div>`
})
export class HighlightComponent implements OnDestroy {
  @ViewChild('box') boxRef!: ElementRef;
  private builder = inject(AnimationBuilder);
  private player: AnimationPlayer | null = null;

  // Create factory once — reuse for performance
  private factory: AnimationFactory = this.builder.build([
    animate('600ms ease-out', keyframes([
      style({ backgroundColor: '#fff59d', offset: 0 }),
      style({ backgroundColor: '#fff59d', offset: 0.5 }),
      style({ backgroundColor: '*', offset: 1 }),  // '*' = original value
    ]))
  ]);

  highlight(): void {
    // Cleanup previous animation
    this.player?.destroy();

    this.player = this.factory.create(this.boxRef.nativeElement);
    this.player.onDone(() => {
      this.player?.destroy();
      this.player = null;
    });
    this.player.play();
  }

  ngOnDestroy(): void {
    this.player?.destroy();
  }
}
```

### Production Scenario

```typescript
// Scroll-triggered entrance animation service
@Injectable({ providedIn: 'root' })
export class ScrollAnimationService implements OnDestroy {
  private builder = inject(AnimationBuilder);
  private platformId = inject(PLATFORM_ID);
  private players = new Map<HTMLElement, AnimationPlayer>();
  private observer: IntersectionObserver | null = null;

  // Reusable factory
  private entranceFactory = this.builder.build([
    style({ opacity: 0, transform: 'translateY(30px)' }),
    animate('500ms 100ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'none' })
    )
  ]);

  observe(element: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (!this.observer) {
      this.observer = new IntersectionObserver(
        entries => this.handleIntersection(entries),
        { threshold: 0.1 }
      );
    }

    // Set initial invisible state
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    this.observer.observe(element);
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.filter(e => e.isIntersecting).forEach(entry => {
      const el = entry.target as HTMLElement;
      this.observer?.unobserve(el);

      const player = this.entranceFactory.create(el);
      this.players.set(el, player);

      player.onDone(() => {
        // Clean up after animation
        el.style.opacity = '';
        el.style.transform = '';
        player.destroy();
        this.players.delete(el);
      });

      // Promote to GPU layer before animation
      el.style.willChange = 'transform, opacity';
      player.onStart(() => {});
      player.play();

      // Remove will-change after animation via onDone (handled above)
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.players.forEach(player => player.destroy());
    this.players.clear();
  }
}

// Usage via directive
@Directive({
  selector: '[appScrollAnimate]',
  standalone: true
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private scrollAnim = inject(ScrollAnimationService);

  ngOnInit(): void {
    this.scrollAnim.observe(this.el.nativeElement);
  }
}
```

### Anti-Example

```typescript
// ❌ Factory rebuild при кожному виклику — performance waste
@Component({})
export class BadAnimationComponent {
  private builder = inject(AnimationBuilder);
  @ViewChild('el') el!: ElementRef;

  animate(): void {
    // ❌ Rebuilds factory on every call — overhead
    const factory = this.builder.build([
      animate('300ms', style({ opacity: 0 }))
    ]);
    const player = factory.create(this.el.nativeElement);
    player.play();
    // ❌ No onDone cleanup — memory leak
    // ❌ No destroy in ngOnDestroy
  }
}

// ❌ will-change в static CSS
// styles.scss:
// .card { will-change: transform; } // ❌ Permanent GPU layer для всіх card елементів

// ✅ will-change тільки під час анімації
@Component({
  template: `<div #card [style.will-change]="isAnimating ? 'transform' : 'auto'">...</div>`
})
export class GoodAnimationComponent implements OnDestroy {
  private builder = inject(AnimationBuilder);
  @ViewChild('card') card!: ElementRef;
  isAnimating = false;

  // ✅ Factory created once
  private factory = this.builder.build([
    animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      style({ transform: 'scale(1.05)' })
    )
  ]);

  private player: AnimationPlayer | null = null;

  animate(): void {
    this.player?.finish(); // finish previous
    this.player?.destroy();

    this.isAnimating = true;
    this.player = this.factory.create(this.card.nativeElement);
    this.player.onDone(() => {
      this.isAnimating = false;
      this.player = null;
    });
    this.player.play();
  }

  ngOnDestroy(): void {
    this.player?.destroy();
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `builder.build(animation)` при кожному виклику | AnimationCompiler overhead per call, не reuse | Create factory once в ngOnInit або class field, reuse `factory.create(el)` |
| AnimationPlayer без `destroy()` в ngOnDestroy | Memory leak, WAAPI animation continues, callbacks can fire on destroyed component | `player?.destroy()` і `player = null` в ngOnDestroy, і в onDone |
| `will-change: transform` у static CSS | Permanent GPU layer = додаткова memory для ВСІХ matching elements | Встановлювати programmatically перед animation, знімати після |
| Animations без `isPlatformBrowser()` check | SSR: DOCUMENT.body.animate не існує → runtime error | `if (!isPlatformBrowser(platformId)) return` перед animation logic |
| Ігнорувати `prefers-reduced-motion` | Users з vestibular disorders: nausea, headaches, epileptic seizures | `if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return` |

## Interview Block

### [L1 — Warm-up] Що таке AnimationBuilder і коли його використовувати замість декларативних animations?

**Signal being tested:** Розуміння use cases для imperative vs declarative animations, а не просто знання API.

**What the interviewer expects:** Конкретні use cases (dynamic target, scroll-triggered, pause/resume), розуміння що обидва підходи використовують той самий underlying engine.

**How to probe deeper:** "Чи може AnimationBuilder анімувати element що не є частиною Angular component?" — так, будь-який HTMLElement включаючи dynamically injected content.

**Reference answer:** AnimationBuilder для imperative animations де: target element визначається в runtime, animation triggered поза Angular lifecycle (IntersectionObserver, scroll), потрібен pause/resume control. Declarative — для state-driven component animations. AnimationBuilder потребує provideAnimations().

**Common mistakes:** Думають AnimationBuilder не потребує provideAnimations(). Не destroy player в ngOnDestroy.

---

### [L2 — Mid] Як управляти lifecycle AnimationPlayer? Які методи доступні?

**Signal being tested:** Практичне розуміння player lifecycle, cleanup patterns, і callbacks integration.

**What the interviewer expects:** play/pause/reset/finish/destroy semantics, onDone cleanup pattern, potential issue with callbacks on destroyed components.

**How to probe deeper:** "Як реалізувати interruptible animation — коли нова animation відміняє поточну?" — `player.finish()` або `player.destroy()` перед новим create().

**Reference answer:** `create()` → `play()` → `pause()`/`resume()` → `finish()` (jump to end) / `reset()` (jump to start). `onDone(() => player.destroy())` для cleanup. `destroy()` в ngOnDestroy — завжди. Callbacks виконуються в zone → trigger CD.

**Common mistakes:** Не destroy після onDone. Використовують destroyed player.

---

### [L3 — Senior] Що таке will-change і composite properties? Як правильно ними управляти в Angular?

**Signal being tested:** Глибоке розуміння browser rendering pipeline, GPU compositing, і practical performance optimization.

**What the interviewer expects:** Composite properties (transform, opacity), будь-який GPU layer = memory cost, dynamic will-change management (set before, remove after), mobile memory constraints.

**How to probe deeper:** "Як перевірити скільки GPU layers active на сторінці?" — Chrome DevTools → Rendering → Layer borders, або Layers panel.

**Reference answer:** will-change: transform/opacity → GPU compositing layer. Composite properties (transform, opacity, filter) — GPU, no reflow. Non-composite (width, height) — CPU reflow. will-change в static CSS = permanent GPU layer for all matching elements = memory waste. Pattern: onStart → `el.style.willChange = 'transform'`, onDone → `el.style.willChange = 'auto'`. Mobile budget: ~few MB per layer.

**Common mistakes:** Static will-change у CSS. `left/top` замість `transform: translate()` — layout reflow.

---

### [L4 — Staff/Principal] Як відключати Angular animations для prefers-reduced-motion і тестів? Яка правильна стратегія?

**Signal being tested:** Системне мислення про accessibility і testing як cross-cutting concerns, розуміння що CSS media query не впливає на JS animations.

**What the interviewer expects:** CSS @media не disable Angular animate(), NoopAnimations для тестів, custom AnimationDriver або token для reduced-motion, listening to matchMedia changes.

**How to probe deeper:** "Чому `@media (prefers-reduced-motion: reduce) { animation-duration: 0 }` не відключає Angular animations?" — Angular animate() — JavaScript, не CSS. Duration встановлюється в JS.

**Reference answer:** Tests: `provideNoopAnimations()` — duration=0, callbacks спрацьовують. Reduced motion: CSS media query не впливає на Angular JS animations. Strategies: matchMedia check + return early, custom AnimationDriver з скороченим duration, or `ANIMATION_DURATION` token = 0 if reduced-motion. Listen to matchMedia changes (user can toggle at runtime). Design system: animations as enhancement — UI usable без них.

**Common mistakes:** CSS media query думають відключає Angular animations. Не перевіряють prefers-reduced-motion взагалі.

## Summary

### Key Points

- AnimationBuilder для imperative animations: `builder.build(animation)` → factory (once), `factory.create(element)` → player (per element).
- AnimationPlayer lifecycle: `play()` → `pause()` → `finish()`/`reset()` → `destroy()`. Завжди `destroy()` в ngOnDestroy і в onDone.
- Composite properties (transform, opacity) — GPU, no reflow. Non-composite (width, height) — CPU reflow = jank.
- will-change: встановлювати programmatically перед animation (`onStart`), знімати після (`onDone`) — не в static CSS.
- CSS `@media (prefers-reduced-motion)` не відключає Angular JS animations — потрібна явна перевірка `window.matchMedia(...)` в JS.
- `provideNoopAnimations()` для тестів — animations skip, але onDone callbacks спрацьовують.
- Factory reuse: `builder.build()` once, `factory.create(el)` per animation target — не rebuild при кожному виклику.

### Elevator Pitch (2 minutes)

AnimationBuilder — це imperativeAP angular animations service. `builder.build(animationMetadata)` компілює animation definition в reusable `AnimationFactory` (один раз), `factory.create(element)` повертає `AnimationPlayer` прив'язаний до конкретного DOM element. `player.play()`, `pause()`, `finish()`, `destroy()` — повний lifecycle control.

Use cases: scroll-triggered animations (IntersectionObserver → play), dynamically injected elements (не в Angular template), pause/resume/rewind functionality.

Critical patterns: factory once, player per animation. `destroy()` в ngOnDestroy і onDone — memory leak інакше. Will-change: тільки `onStart`, знімати `onDone` — static CSS will-change = permanent GPU memory для ВСІХ matching elements. Prefers-reduced-motion: CSS media query не впливає на Angular JS animations — потрібна явна `window.matchMedia(...)` перевірка.
