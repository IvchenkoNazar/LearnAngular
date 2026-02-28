---
title: "Zoneless Angular — CD Without Zone.js"
block: 9
topic: 5
slug: "zoneless-angular"
difficulty: 4
sinceVersion: "18"
tags: ["zoneless", "provideZonelessChangeDetection", "signals", "markForCheck", "SSR", "performance"]
relatedTopics: ["zonejs", "signals", "cd-mechanism", "onpush-strategy"]
interviewQuestions:
  - id: "b9t5q1"
    level: "junior"
    question: "Що таке Zoneless Angular і як його увімкнути?"
    referenceAnswers:
      junior: "Zoneless Angular — це режим без Zone.js де Angular не відслідковує async операції автоматично. CD запускається тільки через signals або явний markForCheck(). Увімкнути: provideZonelessChangeDetection() в app.config.ts і видалити import 'zone.js' з polyfills."
      mid: "Zoneless Angular (stable Angular 18, recommended Angular 21): 1) Замінити провайдер: provideZonelessChangeDetection() замість provideZoneChangeDetection(). 2) Видалити `import 'zone.js'` з polyfills.ts або angular.json polyfills. 3) CD тепер тригерується тільки через: signal changes, explicit markForCheck()/detectChanges(), async pipe (яка внутрішньо markForCheck). Переваги: ~40KB менший bundle, передбачувана CD поведінка, краща SSR сумісність, більший performance контроль."
      senior: "Zoneless означає що ApplicationRef.tick() більше не викликається автоматично після async operations. Trigger mechanisms: 1) Signals — primary mechanism, targeted dirty marking. 2) markForCheck() у CVA або third-party integration. 3) ChangeDetectorRef.detectChanges() для imperative cases. 4) async pipe (внутрішньо markForCheck). Без цих механізмів UI не оновиться. Перехідний режим: Angular 19+ підтримує hybrid mode де Zone.js і Zoneless співіснують через провайдер tax — для поступової міграції. Breaking point: будь-який код що покладається на implicit Zone.js CD triggering буде broken у zoneless."
      staff: "Zoneless Angular є стратегічним напрямком Angular team. Мотивація: 1) Predictable CD — developer controls exactly when CD runs. 2) Bundle size — zone.js ~40KB. 3) SSR — zone.js має incompatibilities з Node.js async contexts. 4) Performance — немає overhead від monitoring ALL async operations. Migration risk assessment: third-party Angular libs що не підтримують zoneless, legacy code з implicit Zone.js dependencies, setTimeout/setInterval у services без markForCheck(). Testing: Angular 18+ testing utilities автоматично adapt до zoneless via TestBed.configureTestingModule — але async operations in tests потрібен різний підхід (fixture.whenStable() поведінка змінюється). ROI: для new apps — immediate benefit; для large legacy apps — phased migration 3-6 months."
    commonMistakes:
      - "Видаляють zone.js без міграції до signals — UI перестає оновлюватись після async"
      - "Думають provideZonelessChangeDetection() автоматично мігрує код — потрібні manual changes"
    relatedQuestions: ["b9t5q2", "b9t1q4"]
  - id: "b9t5q2"
    level: "mid"
    question: "Що потрібно змінити в компоненті щоб він працював коректно без Zone.js?"
    referenceAnswers:
      junior: "Компоненти мають бути OnPush і використовувати signals або async pipe для state що змінюється після async operations."
      mid: "Для zoneless компонентів: 1) OnPush обов'язково — без Zone.js Default strategy марна (ніколи не буде triggered). 2) State через signals — signal.set() автоматично marks component dirty. 3) Async data через async pipe або toSignal() — обидва внутрішньо markForCheck(). 4) Third-party callbacks що оновлюють Angular state: inject(ChangeDetectorRef).markForCheck() після update. 5) setTimeout/setInterval що оновлюють стан: потрібен явний markForCheck() після callback."
      senior: "Детальний checklist для zoneless migration: 1) Всі компоненти OnPush. 2) Сервіси що expose state — signal() або BehaviorSubject + toSignal(). 3) Component state — signal() замість plain properties. 4) Third-party lib callbacks — NgZone.run() або ChangeDetectorRef.markForCheck() після state update. 5) setTimeout patterns — або NgZone.run(callback) або afterNextRender() для DOM-related operations. 6) Router events, HTTP calls — вони проходять через Angular async mechanisms, зазвичай working out-of-the-box завдяки built-in markForCheck() у router і HttpClient. 7) WebSocket handlers — потрібен явний trigger. 8) E2E tests як safety net — виявляють broken CD."
      staff: "Systematic zoneless migration approach: 1) Enable zoneless in dev mode, зберігаючи zone.js як debug helper — run app і observe what breaks. 2) Categorize issues: a) Component state updates (convert to signal), b) Third-party lib callbacks (add markForCheck), c) Service patterns (convert to signal store). 3) E2E test suite є critical checkpoint між iterations. 4) Component library audit — check each dependency для zoneless support. 5) Performance benchmarking before/after — quantify benefit для stakeholders. 6) Staged rollout: new feature modules first, then legacy modules. 7) Internal documentation: team-specific patterns for 'how to do X without zone.js' (WebSocket, canvas animation, Web Workers). 8) Linting: custom ESLint rule що warns про setTimeout без markForCheck() у zoneless context."
    commonMistakes:
      - "Залишають Default CD strategy — без zone.js trigger, CD ніколи не запуститься"
      - "Не обробляють third-party lib callbacks — вони оновлюють Angular state поза CD awareness"
    relatedQuestions: ["b9t5q1", "b9t4q1"]
  - id: "b9t5q3"
    level: "senior"
    question: "Як zoneless Angular покращує SSR (Server-Side Rendering) і чому Zone.js проблематичний у Node.js?"
    referenceAnswers:
      junior: "Zoneless Angular покращує SSR бо Zone.js має проблеми у Node.js середовищі де деякі browser APIs не існують або поводяться інакше."
      mid: "Zone.js problems у Node.js SSR: 1) Zone.js патчує Node.js async APIs (setTimeout, Promise, process.nextTick) — може interfere з Node.js internal mechanisms. 2) Zone.js стабілізація: SSR чекає поки 'zone stable' — це може зависнути якщо є persistent timers або WebSocket connections у Node.js. 3) Node.js patching може порушити AsyncLocalStorage, яку Angular Universal використовує для request context isolation. Zoneless SSR: Angular знає точно коли rendering завершено через explicit mechanisms — немає ризику premature або delayed serialization."
      senior: "Zone.js і SSR technical issues: 1) Zone stability: Angular Universal чекає zone.onStable перед серіалізацією HTML. Persistent async (WebSocket, long polling, setInterval у services) can prevent stability — app ніколи не serializes. 2) AsyncLocalStorage interop: Zone.js патчує Promise і це може break AsyncLocalStorage propagation у Node.js 12-16. 3) Multiple concurrent requests: Zone.js global patching може cross-contaminate request contexts (zone propagation через async chains). Zoneless рішення: explicit renderApplication() або bootstrapApplication() з knowledge of когда rendering complete — без guessing через zone stability. Angular 17+ partial hydration: zoneless дозволяє precision control над hydration timing."
      staff: "SSR і Zoneless architectural benefits: 1) Deterministic rendering: без zone stability guessing — application explicitly marks rendering complete. 2) Request isolation: AsyncLocalStorage + zoneless = clean request-scoped DI без zone interference. 3) Performance: без zone.js patching Node.js APIs — менший overhead per request, краща concurrency. 4) Compatibility: Node.js 18+ Fetch API нативний + withFetch() + zoneless = no polyfills needed. 5) Incremental hydration (Angular 17+): '@defer' based incremental hydration requires zoneless для precision control. 6) Edge runtime (Cloudflare Workers, Deno): zone.js не підтримується в all edge runtimes — zoneless необхідний для edge deployment. 7) Angular 18+ afterRender/afterNextRender: explicitly hooks into render lifecycle без zone dependency. Migration for SSR: zoneless migration дає immediate SSR stability fixes для apps з persistent timers."
    commonMistakes:
      - "Думають Zone.js і SSR несумісні — вони сумісні але з обмеженнями; zoneless просто краще"
      - "Не враховують edge runtime обмеження при виборі архітектури"
    relatedQuestions: ["b9t5q1", "b9t5q2"]
  - id: "b9t5q4"
    level: "staff"
    question: "Як спланувати zoneless migration для existing large Angular app з мінімальними ризиками?"
    referenceAnswers:
      junior: "Починати з нових компонентів у zoneless режимі, поступово мігрувати старі, використовувати E2E тести для виявлення проблем."
      mid: "Стратегія: 1) Audit існуючого коду (zone.js dependencies), 2) Enable zoneless у dev і виявити issues, 3) Migrate листкові компоненти першими, 4) Конвертувати services до signals, 5) Тести E2E як safety net між кожним кроком."
      senior: "Детальна стратегія: Phase 1 (2-4 weeks) — Event coalescing, ESLint OnPush rule, audit third-party deps. Phase 2 (4-8 weeks) — Нові features тільки з signals + OnPush, migrate leaf components. Phase 3 (4-8 weeks) — Enable zoneless у dev mode, collect broken scenarios list, prioritize. Phase 4 (8-16 weeks) — Fix broken scenarios component by component, E2E coverage. Phase 5 — Remove zone.js in production. Key: E2E suite must cover all major user flows before starting."
      staff: "Enterprise zoneless migration governance: 1) Pre-migration: E2E coverage report (target >80% user flows), dependency compatibility matrix (Angular Material, NgRx, all custom libraries), performance baseline (CD cycles/sec, LCP, INP). 2) Migration phases: shadow mode (zoneless provider + zone.js both active — identify issues without breaking production), incremental module migration, canary rollout (10% traffic zoneless build, monitor error rates). 3) Risk mitigation: feature flags для rollback, monitoring dashboard (real-time CD error rates), hotfix process for critical breaks. 4) Team enablement: zoneless coding guidelines doc, pair programming sessions, dedicated migration sprint per quarter. 5) Post-migration: remove zone.js from bundle, measure bundle size delta, document performance improvements for stakeholders. 6) Long-term: establish zoneless as team default, update code review checklist, training for new engineers. Migration duration estimate: small app (< 50 components) — 2-4 weeks; medium (50-200) — 2-3 months; large enterprise (200+) — 6-12 months with dedicated team."
    commonMistakes:
      - "Починають з core/shared компонентів — найвищий ризик; краще leaf components"
      - "Немає E2E coverage перед початком — немає safety net для регресій"
    relatedQuestions: ["b9t5q3", "b9t1q4"]
---

## Core Concept

**English definition:** Zoneless Angular is an application mode where Zone.js is removed from the application, and Change Detection is triggered exclusively through explicit mechanisms: Signal changes, markForCheck(), detectChanges(), or async pipe emissions — rather than automatically after any async operation.

**Пояснення:** Zoneless Angular — це переhід від "Angular автоматично відстежує всі async операції" до "Angular оновлює UI тільки коли явно told to". Це дає більший control, кращий performance і менший bundle, але вимагає що всі state changes явно trigger CD.

**Яку проблему вирішує:**
1. **Bundle size:** Zone.js ~40KB gzipped — не маленько для critical path
2. **Performance:** Zone.js тригерить CD після КОЖНОЇ async операції, включно з third-party lib internals
3. **SSR stability:** Zone.js zone stability detection проблематично у Node.js з persistent connections
4. **Edge runtime compatibility:** Cloudflare Workers, Deno не підтримують Zone.js API patching
5. **Predictability:** Без Zone.js розробник точно знає що тригерить CD

**Як працює під капотом:** `provideZonelessChangeDetection()` реєструє `ɵZonelessChangeDetectionScheduler` замість Zone.js-based scheduler. Цей scheduler отримує notifications тільки від: `markForCheck()`, Signal consumers dirty marking, explicit `detectChanges()`. `ApplicationRef.tick()` викликається тільки при явних triggers. Без Zone.js monkey-patching — async APIs (setTimeout, Promise, fetch) не повідомляють Angular. Framework-level components (router, HttpClient, async pipe) вже мають built-in explicit markForCheck() calls.

**Trade-offs та обмеження:**
- Потребує повного переходу всього коду (including third-party) до explicit CD triggering
- Third-party Angular libs можуть не підтримувати zoneless
- Збільшує когнітивне навантаження — розробник думає про CD explicitly
- Міграція великих apps — значний effort

**Версійність:**
- Angular 17: `provideExperimentalZonelessChangeDetection()` — developer preview
- Angular 18: `provideZonelessChangeDetection()` — stable, ready for production
- Angular 21: Zoneless recommended for all new applications; zone.js still supported but optional

## Deep Details

### Edge Cases

**Angular framework internals вже zoneless-safe:** Router, HttpClient, NgModel, async pipe — всі мають built-in markForCheck() calls. Вони працюють без Zone.js.

**Angular Material компоненти:** Angular Material v17+ підтримує zoneless. Older versions можуть мати issues.

**Web Animations API:** requestAnimationFrame-based animations потрібні явні triggers якщо вони оновлюють Angular state.

**Observable з subscribe() без async pipe:** Якщо компонент використовує `this.obs$.subscribe(v => this.value = v)` — без Zone.js і без markForCheck() UI не оновиться. Потрібно: async pipe або toSignal() або inject(ChangeDetectorRef).markForCheck() в callback.

**TestBed у zoneless mode:** `fixture.detectChanges()` і `fixture.whenStable()` адаптуються автоматично. Але `fakeAsync()` з zone.js patching може мати різну поведінку.

### Junior vs Senior Understanding

**Junior розуміє:** Zoneless = без zone.js. Потрібні signals і OnPush. Як увімкнути.

**Senior розуміє:**
- Які Angular internals вже підтримують zoneless (router, HttpClient, Material v17+)
- Які патерни broken: subscribe + property assignment, setTimeout + state update
- SSR переваги (zone stability проблема)
- Checklist для migration: OnPush, signals, third-party audit

**Staff розуміє:**
- Phased migration strategy з risk mitigation
- Shadow mode testing (zoneless + zone.js активні одночасно)
- Edge runtime deployment (Cloudflare Workers)
- E2E coverage requirements перед migration
- Performance measurement і business case для stakeholders

### Deprecation & Migration Path

**Zone.js becoming optional (not deprecated yet, but trajectory is clear):**
```typescript
// polyfills.ts — Current (Zone.js based)
import 'zone.js';

// polyfills.ts — Zoneless (remove the import)
// (no zone.js import)
```

```typescript
// app.config.ts — Zone.js based
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
  ],
};

// app.config.ts — Zoneless
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
  ],
};
```

### Connections to Other Concepts

- **Zone.js (b9t1):** What Zoneless replaces
- **Signals (b9t4):** Primary CD trigger mechanism in Zoneless apps
- **CD Mechanism (b9t2):** How LView dirty marking works without Zone.js
- **OnPush (b9t3):** Required strategy for all components in Zoneless

## Examples

### Basic Usage

```typescript
// app.config.ts — Zoneless setup
import { ApplicationConfig } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // Replace provideZoneChangeDetection()
    provideRouter([]),
    provideHttpClient(withFetch()), // Fetch API — perfect companion for zoneless
  ],
};
```

```typescript
// Zoneless-compatible component
import {
  Component, ChangeDetectionStrategy, signal, computed, inject
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-zoneless-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Required for Zoneless
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ double() }}</p>
    <button (click)="increment()">+</button>
  `,
})
export class ZonelessCounterComponent {
  // Signal — primary state mechanism in Zoneless
  readonly count = signal(0);
  readonly double = computed(() => this.count() * 2);

  increment(): void {
    // signal.update() automatically triggers CD for this component
    this.count.update(c => c + 1);
    // No Zone.js needed — signal notifies LView consumer directly
  }
}
```

### Production Scenario

```typescript
// WebSocket service — zoneless compatible
import { Injectable, inject, signal, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ZonelessWebSocketService {
  // Signals for reactive state
  readonly messages = signal<ChatMessage[]>([]);
  readonly connectionStatus = signal<'connected' | 'disconnected' | 'error'>('disconnected');

  private ws: WebSocket | null = null;

  connect(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      // Signal update triggers CD automatically — no NgZone needed!
      this.connectionStatus.set('connected');
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ChatMessage;
      // Signal update → consumers (LViews) marked dirty → CD runs
      this.messages.update(msgs => [...msgs, msg]);
    };

    this.ws.onerror = () => {
      this.connectionStatus.set('error');
    };

    this.ws.onclose = () => {
      this.connectionStatus.set('disconnected');
    };
  }
}

interface ChatMessage { id: string; text: string; timestamp: number; }
```

### Anti-Example

```typescript
// WRONG: Code that breaks in Zoneless Angular
@Component({
  template: `<p>{{ value }}</p>`,
  changeDetection: ChangeDetectionStrategy.Default, // WRONG: Default + Zoneless = never updates
})
class BrokenComponent implements OnInit {
  value = 'Initial';

  ngOnInit(): void {
    // WRONG: Without Zone.js, setTimeout callback does NOT trigger CD
    setTimeout(() => {
      this.value = 'Updated'; // Property changed but UI won't update!
      // CORRECT: Use signal — this.value = signal('Initial'); this.value.set('Updated');
      // OR: inject(ChangeDetectorRef).markForCheck() after this.value = 'Updated'
    }, 1000);

    // WRONG: Observable subscribe without async pipe or markForCheck
    someObservable$.subscribe(data => {
      this.value = data; // UI won't update without Zone.js
      // CORRECT: async pipe | toSignal() | explicit markForCheck()
    });
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `ChangeDetectionStrategy.Default` in Zoneless app | Without Zone.js triggering CD, Default strategy components NEVER update | All components must be OnPush in Zoneless mode |
| `setTimeout(() => { this.value = x; })` without `markForCheck()` | Without Zone.js, setTimeout callback doesn't trigger CD — UI frozen | Use `signal()` for the value, or call `inject(ChangeDetectorRef).markForCheck()` after update |
| `observable$.subscribe(v => this.prop = v)` without markForCheck | Observable emit updates property but no CD trigger without Zone.js | `async pipe`, `toSignal()`, or `inject(ChangeDetectorRef).markForCheck()` in subscribe callback |
| Not auditing third-party libraries before zoneless migration | Third-party Angular libs that use Zone.js internally will have broken behavior | Check each dependency's zoneless support (changelog, GitHub issues) before migration |
| Removing zone.js before enabling `provideZonelessChangeDetection()` | App crashes with runtime errors — the provider must be configured before removing zone.js | First add `provideZonelessChangeDetection()`, verify app works, then remove zone.js import |

## Interview Block

### [L1 — Warm-up] Що таке Zoneless Angular і яка різниця з Zone.js-based Angular?

**Signal being tested:** Базове розуміння що значить "zoneless" і яка принципова зміна у CD triggering.

**What the interviewer expects:** Опис що CD більше не automatic після async, потрібні explicit triggers, і як увімкнути.

**How to probe deeper:** "Якщо я увімкну zoneless і зроблю setTimeout(() => this.value = 'new', 1000) — що відбудеться?"

**Reference answer:** Zoneless Angular (stable Angular 18) означає що Zone.js не включено у bundle і CD не тригерується автоматично після async operations. Без Zone.js: setTimeout, Promise, fetch не повідомляють Angular. CD тригерується тільки через: signal.set(), markForCheck(), detectChanges(), або async pipe. Для `setTimeout(() => this.value = 'new')` у zoneless — UI не оновиться бо немає CD trigger. Потрібно: signal-based state або explicit markForCheck().

**Common mistakes:** Думають що zoneless = просто видалити zone.js import без інших змін — це breaking change.

---

### [L2 — Mid] Які зміни потрібні в компоненті для zoneless сумісності?

**Signal being tested:** Практичне знання що потрібно адаптувати у компоненті для роботи без Zone.js.

**What the interviewer expects:** OnPush requirement, signals для state, async pipe / toSignal для Observables, explicit markForCheck для third-party callbacks.

**How to probe deeper:** "У мене є WebSocket service де я роблю `messageSubject.next(msg)` у ws.onmessage — що потрібно змінити для zoneless?"

**Reference answer:** Zoneless component requirements: 1) OnPush обов'язково — без Zone.js Default strategy ніколи не triggered. 2) State через signals — `signal.set()` автоматично triggers targeted CD. 3) Observable state через `async pipe` або `toSignal()` — обидва внутрішньо markForCheck(). 4) Third-party/native callbacks: inject(ChangeDetectorRef).markForCheck() після state update. Для WebSocket: `signal<Message[]>([])` у service, в ws.onmessage: `this.messages.update(msgs => [...msgs, msg])` — signal update triggers CD automatically.

**Common mistakes:** Залишають Default CD strategy на "деяких" компонентах — вони заморожуються.

---

### [L3 — Senior] Чому zoneless покращує SSR і які конкретні zone.js проблеми воно вирішує?

**Signal being tested:** Розуміння zone.js і SSR incompatibilities на конкретному технічному рівні.

**What the interviewer expects:** Zone stability problem (persistent timers prevent serialization), AsyncLocalStorage interference, Node.js patching issues.

**How to probe deeper:** "Що таке 'zone stability' і чому zone.js може не stabilize для SSR?"

**Reference answer:** Zone.js SSR problems: 1) Zone stability: Angular Universal чекає `zone.onStable` перед HTML serialization. Якщо є persistent timers (setInterval у service) або WebSocket — zone ніколи не stables → SSR зависає або timeout. 2) AsyncLocalStorage: Zone.js патчує Promise і може break AsyncLocalStorage propagation у Node.js — це критично для Angular Universal request-scoped DI. 3) Edge runtimes (Cloudflare Workers) не підтримують zone.js APIs. Zoneless SSR: rendering completion визначається explicit mechanisms, не zone stability guessing — deterministic і надійний.

**Common mistakes:** Думають zone.js і SSR несумісні взагалі — вони сумісні але з обмеженнями.

---

### [L4 — Staff/Principal] Опиши enterprise migration strategy для переходу до zoneless large app (500+ components).

**Signal being tested:** Strategic planning для high-risk migration з risk management, phased approach, rollback strategy.

**What the interviewer expects:** Phased approach, shadow mode testing, E2E coverage requirements, performance baselining, rollback plan.

**How to probe deeper:** "Як виявити всі місця де код implicit залежить від zone.js без зламу production?"

**Reference answer:** Enterprise migration phases: 1) Baseline: E2E coverage >80%, performance metrics (CD cycles/sec, LCP), dependency audit. 2) Shadow mode: enable provideZonelessChangeDetection() у dev build з zone.js ще присутнім — виявити issues без breaking production. 3) Phased fix: leaf components → container components → services → lib integration. 4) Canary: 10% traffic zoneless build — monitor error rates. 5) Full rollout: remove zone.js. Risk mitigation: feature flags для rollback, automated monitoring для CD errors. Key insight: `subscribe() + this.prop = value` patterns — найчастіша причина broken UI у zoneless. Timeline: 500+ components — 6-12 months з dedicated team.

**Common mistakes:** Починають з core компонентів — highest risk; leaf components first.

## Summary

### Key Points

- Zoneless Angular (stable v18) видаляє Zone.js; CD тригерується тільки через signals, markForCheck(), detectChanges(), або async pipe
- Увімкнення: `provideZonelessChangeDetection()` у app.config.ts + видалити `import 'zone.js'` з polyfills
- Всі компоненти у zoneless app МАЮТЬ бути OnPush — Default strategy без Zone.js ніколи не triggered
- Angular framework internals (router, HttpClient, async pipe) вже мають built-in markForCheck() — works without Zone.js
- SSR benefit: без zone stability guessing — deterministic rendering completion, no AsyncLocalStorage interference
- Edge runtime benefit: Cloudflare Workers, Deno — де zone.js не підтримується
- Migration strategy: shadow mode (zoneless + zone.js) → phased leaf-first migration → canary rollout → full removal

### Elevator Pitch (2 minutes)

Zoneless Angular (stable v18) видаляє Zone.js dependency і переходить до explicit CD triggering. Без Zone.js: setTimeout, Promise, fetch не повідомляють Angular. CD тільки через: `signal.set()` (primary mechanism), `markForCheck()`, `detectChanges()`, `async pipe`. Переваги: ~40KB менший bundle, передбачувана CD, краща SSR сумісність (немає zone stability проблем), підтримка edge runtimes. Вимоги: всі компоненти OnPush, state через signals або Observable + async pipe. Увімкнення: `provideZonelessChangeDetection()` + видалити `import 'zone.js'`. Migration: shadow mode testing → phased migration → canary → full. Для нових проектів у Angular 21 — zoneless рекомендований default.
