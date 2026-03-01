---
title: "Memory Leaks and Subscription Management"
block: 10
topic: 2
slug: "memory-leaks"
difficulty: 4
sinceVersion: "2"
tags: ["memory-leaks", "unsubscribe", "takeUntilDestroyed", "async-pipe", "subscription-management", "DestroyRef"]
relatedTopics: ["higher-order-operators", "reactive-patterns", "signals-vs-observables"]
interviewQuestions:
  - level: "junior"
    question: "Що таке memory leak в контексті RxJS і як він виникає в Angular?"
    referenceAnswers:
      junior: "Memory leak виникає коли Observable subscription не відписана після знищення компонента. Observable продовжує посилатися на компонент, заважаючи garbage collector звільнити пам'ять."
      mid: "Memory leak в RxJS — це ситуація коли підписка на Observable залишається активною після того, як компонент Angular знищений. Subscriber тримає посилання на компонент (через callback), і GC не може звільнити пам'ять. Це особливо небезпечно для довгоживучих Observable (intervals, WebSocket, BehaviorSubject у services). Наслідки: зростання heap, виклик callbacks на знищеному компоненті, потенційні null reference errors."
      senior: "Memory leak в Angular/RxJS має кілька механізмів: 1) Замикання (closure) у subscribe callback тримає посилання на компонент instance. 2) Subject у service тримає посилання на subscriber (компонент). 3) Long-lived Observable (timer, interval, WebSocket) не завершуються самостійно. Під капотом: Subscription об'єкт містить список `SubscriptionLike` у внутрішньому `_finalizers` масиві. Поки є active subscription — GC не може зібрати ні subscriber, ні все що він замикає. Особливо критично: EventEmitter/Subject у service — навіть після navigate away компонент залишається в пам'яті через subscription reference chain."
      staff: "Memory leaks в Angular — системна проблема, яка вимагає архітектурних рішень, а не лише правил 'завжди unsubscribe'. Глибока проблема: Angular DevTools і Chrome Memory Profiler показують зростання retained heap. Типові причини у великих apps: 1) GlobalStore (BehaviorSubject) зі subscribers що не unsubscribe — компонент 'зомбі'. 2) Router events subscription без cleanup — кожна навігація додає новий subscriber. 3) combineLatest з кількома Subject — кожен Subject тримає subscriber окремо. Архітектурні рішення: async pipe як default (auto-unsubscribe), takeUntilDestroyed як стандарт для imperative subscriptions, lint rules що забороняють bare subscribe без cleanup. Моніторинг: performanceObserver, custom leak detector що перевіряє активні subscriptions при route change."
    commonMistakes:
      - "Думають що HTTP-запити HttpClient не потребують unsubscribe (вони завершуються самостійно, але interval/timer — ні)"
      - "Забувають що Subject у сервісі тримає посилання на всіх subscribers"
    relatedQuestions: ["b10t2q2", "b10t2q3"]
  - level: "mid"
    question: "Порівняйте підходи до управління subscriptions: async pipe, takeUntilDestroyed, manual unsubscribe. Коли що використовувати?"
    referenceAnswers:
      junior: "async pipe автоматично відписується, takeUntilDestroyed теж автоматично, manual unsubscribe потрібно самостійно викликати у ngOnDestroy."
      mid: "async pipe — найбезпечніший, автоматично subscribe/unsubscribe з lifecycle компонента, працює у template. takeUntilDestroyed() (Angular 16+) — для imperative підписок у ngOnInit або конструкторі, використовує DestroyRef. Manual unsubscribe — через Subscription.unsubscribe() у ngOnDestroy, або масив subscriptions з forEach unsubscribe. takeUntil(destroy$) — старий підхід з Subject і ngOnDestroy. Preference order: async pipe > takeUntilDestroyed > manual."
      senior: "Кожен підхід має свій контекст: async pipe — ідеальний для template-driven реактивного UI, не потребує field у component class, але не підходить для side effects (не можна викликати метод у subscribe). takeUntilDestroyed() — найзручніший для imperative logic, inject(DestroyRef) автоматично реєструє cleanup. Під капотом: DestroyRef.onDestroy() реєструє callback що emit'ить в Subject, і takeUntil завершує Observable. Manual Subscription: явний контроль, підходить коли потрібна умовна відписка. Підводний камінь takeUntilDestroyed: якщо викликати поза injection context (в setTimeout, callback) — кине error. Вирішення: inject DestroyRef в конструкторі/полі, передати як параметр."
      staff: "Стратегія для enterprise: 1) async pipe як default — force у code review. Якщо є логіка що заважає, рефактор у signal або computed. 2) takeUntilDestroyed для unavoidable imperative subscriptions — з injection context guard. 3) Заборонити takeUntil(this.destroy$) паттерн — він prone to forgetting ngOnDestroy Subject emit і race conditions якщо компонент не знищений коректно. 4) ESLint rule rxjs/no-unbound-methods і rxjs-x/prefer-takeuntil-subject. 5) Для services: використовувати signals замість Subject де можливо — немає subscription lifecycle проблем взагалі. 6) Memory profiling у CI: custom Playwright test що navigates to/from route і перевіряє heap retention. 7) Глобальний SubscriptionTracker в dev mode — логує всі active subscriptions при route changes."
    commonMistakes:
      - "takeUntilDestroyed поза injection context — runtime error"
      - "Забувають що takeUntil(destroy$) потребує ngOnDestroy з destroy$.next() І destroy$.complete()"
      - "Думають що Subscription у service не потребує cleanup — потребує якщо service є не root-рівня"
    relatedQuestions: ["b10t2q1", "b10t2q3"]
  - level: "senior"
    question: "Як takeUntilDestroyed() працює під капотом? Що таке DestroyRef і як він пов'язаний з lifecycle компонента?"
    referenceAnswers:
      junior: "takeUntilDestroyed — це оператор що автоматично відписується коли компонент знищується."
      mid: "takeUntilDestroyed використовує DestroyRef — Angular DI token що надає доступ до lifecycle destroy компонента або environment. DestroyRef.onDestroy() реєструє callback. takeUntilDestroyed внутрішньо inject(DestroyRef) і при destroy — emit'ить в Subject, що завершує Observable через takeUntil."
      senior: "Введений в Angular 16, stable в v16. takeUntilDestroyed(destroyRef?) — якщо destroyRef не переданий, inject(DestroyRef) автоматично. DestroyRef — абстракція над lifecycle: для компонентів це ChangeDetectorRef cleanup, для environments — EnvironmentInjector cleanup. Під капотом: DestroyRef є NodeInjector context і реєструє callbacks у TView.destroyHooks. При component destroy Angular викликає всі registered onDestroy callbacks. takeUntilDestroyed створює Subject, реєструє DestroyRef.onDestroy(() => { subject.next(); subject.complete(); }), і використовує takeUntil(subject). Injection context requirement: inject() може бути викликаний тільки під час construction phase — тому `takeUntilDestroyed()` в полі class ✅, в `ngOnInit` ✅ (викликається в injection context? — ні! ngOnInit не injection context). Правило: inject() в constructor або field initializer, або передавати destroyRef явно."
      staff: "DestroyRef — це частина Angular's new lifecycle architecture що відходить від interface-based lifecycle hooks. Архітектурно важливо: 1) DestroyRef decouples cleanup від конкретного компонента — функції-утиліти можуть реєструвати cleanup без знання типу 'host'. 2) В injection functions (inject-based guards, resolvers) — inject(DestroyRef) працює бо вони мають injection context. 3) Route-level DestroyRef vs component-level — при lazy loaded route і route reuse strategy поведінка різна. 4) EnvironmentInjector DestroyRef — для application-level cleanup. 5) Порівняно з ngOnDestroy: ngOnDestroy клас-специфічний, DestroyRef — composable і reusable. Мікро-оптимізація: DestroyRef.onDestroy повертає cleanup function — можна 'дереєструвати' callback до destroy якщо потрібно скасувати cleanup."
    commonMistakes:
      - "Викликають takeUntilDestroyed() всередині ngOnInit або методів — injection context error"
      - "Думають що inject(DestroyRef) і ngOnDestroy interface — одне й те саме"
      - "Не знають що DestroyRef можна inject у standalone functions і guards"
    relatedQuestions: ["b10t2q2", "b10t2q4"]
  - level: "mid"
    question: "Чому async pipe є кращим підходом для управління підписками ніж manual subscribe у більшості випадків?"
    referenceAnswers:
      junior: "async pipe автоматично підписується і відписується, не потрібно писати ngOnDestroy."
      mid: "async pipe має кілька переваг: автоматично subscribe при ініціалізації і unsubscribe при destroy, інтегрований з Angular change detection (при OnPush — markForCheck при нових значеннях), не потрібно зберігати Subscription instance. Для multiple subscriptions у template — кожен async pipe незалежний. Недолік: не підходить для side effects без template прив'язки і не можна використовувати значення поза template напряму."
      senior: "async pipe — це ChangeDetectorRef-aware pipe: при нових значеннях вона викликає markForCheck() для OnPush компонентів, що критично для правильного CD без зонального mode. Під капотом: AsyncPipe реалізує OnDestroy і викликає _dispose() що unsubscribe. При OnPush, async pipe також triggers CD що дозволяє уникнути ручного markForCheck() у subscribe. Порівняно з manual subscribe: manual subscribe у ngOnInit і assignment до property — не спрацьовує з OnPush без explicit markForCheck(). З async pipe у template + OnPush — все правильно автоматично. Для zoneless Angular async pipe обов'язковий або сигнали — без Zone.js manual subscribe не триггерить CD взагалі."
      staff: "async pipe — це архітектурний патерн що примушує 'push-based' UI design. Якщо все через async pipe: 1) Немає mutable state у компоненті — state тільки у Observable/Signal. 2) OnPush safe by default. 3) Zoneless ready. 4) Testable — можна замінити Observable на TestScheduler. Обмеження async pipe у template: не може share одного Observable між multiple pipes без shareReplay — кожен pipe creates new subscription. Рішення: ngrxLet directive або async у батьківському *ngIf alias `as`. В Angular 17+: @if (items$ | async; as items) {} — вбудований alias. Для team: enforce async pipe через template-linting, заборонити subscribe в компонентах окрім специфічних cases. Перехід до сигналів: toSignal(obs$) + template interpolation — кращий аналог async pipe у сигнальній архітектурі."
    commonMistakes:
      - "Не знають що async pipe з OnPush автоматично markForCheck — думають треба вручну"
      - "Multiple async pipes на одному Observable без shareReplay — кілька HTTP запитів"
      - "Використовують async pipe у *ngIf без 'as' alias — втрачають доступ до значення"
    relatedQuestions: ["b10t2q2", "b10t2q5"]
  - level: "staff"
    question: "Як би ви виявили та усунули memory leaks через RxJS у production Angular додатку?"
    referenceAnswers:
      junior: "Я б перевірив всі subscribe і переконався що є unsubscribe або takeUntilDestroyed."
      mid: "Для виявлення: Chrome DevTools Memory profiler — heap snapshot до і після navigation, пошук зростаючих retained objects. Angular DevTools — компоненти що не знищуються. Для усунення: audit всіх subscriptions, додати takeUntilDestroyed або async pipe, перевірити services на long-lived Subject subscriptions."
      senior: "Systematic approach: 1) Chrome Memory Timeline — record heap при navigation between routes, шукати heap що не зменшується (retained). 2) Heap Snapshot comparison — snapshot 1 before, snapshot 2 after navigate away, filter 'Objects allocated between snapshots' — шукати Angular component instances. 3) Angular DevTools Component Tree — після navigate away компонент не має бути у дереві. 4) Automated: custom Angular test що navigates, forces GC, перевіряє що компонент instance не alive (WeakRef). 5) Source audit: static analysis — grep для 'subscribe(' без 'takeUntil або takeUntilDestroyed або async'. 6) Runtime detector: override subscribe у dev mode що логує all active subscriptions з stack trace."
      staff: "Production memory leak investigation strategy: 1) Baseline metrics — Navigator.deviceMemory, performance.measureUserAgentSpecificMemory() API (Chrome), відстежуємо через Datadog/Grafana. 2) Canary deployment — відстежити heap growth у конкретних user flows. 3) Component-level investigation: NG.getComponent(), Chrome DevTools — identify retained component trees. 4) Automated prevention: ESLint rules (rxjs/no-exposed-subjects, rxjs-x), custom rule для 'subscribe without takeUntilDestroyed'. 5) Code review checklist: будь-який new subscription проходить review. 6) Architecture: migrate до signals де можливо — eliminates subscription lifecycle management повністю. 7) Service audit: Services з Subject/BehaviorSubject — ensure no component subscriptions або proper cleanup. 8) Route-level cleanup: APP_INITIALIZER або router events — cleanup orphaned subscriptions. 9) WeakRef-based subscription tracker у dev mode — попереджає при active subscriptions від знищеного компонента."
    commonMistakes:
      - "Тестують тільки у dev mode — memory leaks часто видимі тільки у production з реальними даними"
      - "Ігнорують leaks у services — фокусуються тільки на компонентах"
      - "Не знають Chrome Memory Profiler — покладаються тільки на code review"
    relatedQuestions: ["b10t2q3", "b10t2q4"]
---

## Core Concept

**English definition:** Memory leaks in Angular/RxJS occur when Observable subscriptions remain active after a component is destroyed, preventing garbage collection of the component instance and any objects captured in subscriber closures.

**Пояснення:** Коли компонент Angular підписується на Observable (наприклад, Subject у сервісі, interval, WebSocket), Subject або operator внутрішньо зберігає посилання на Subscriber об'єкт. Subscriber closure тримає посилання на компонент. Якщо підписка не завершена до destroy компонента — вся ця chain залишається в пам'яті. Angular знищує компонент (видаляє з DOM, з дерева), але JavaScript GC не може зібрати компонент бо є active reference chain.

**Яку проблему вирішує:** Явне управління підписками запобігає:
- Зростанню використання пам'яті (heap growth) при навігації між роутами
- Викликам методів знищеного компонента (null reference errors, "Cannot set property of undefined")
- Побічним ефектам від "zombie" компонентів що продовжують реагувати на події
- Деградації продуктивності через накопичення мертвих підписок

**Як працює під капотом:**

JavaScript GC (Garbage Collector) використовує mark-and-sweep: об'єкт може бути зібраний тільки якщо немає жодного живого reference chain до нього. RxJS Subscription об'єкт містить масив `_finalizers` — посилання на внутрішні cleanup functions та дочірні Subscription. Subject внутрішньо тримає масив `observers` — посилання на Subscriber objects. Subscriber замикає (closure) callback переданий у subscribe. Callback зазвичай є arrow function у компоненті, яка замикає `this` (сам компонент).

```
Subject.observers[] → Subscriber → callback closure → component instance
```

Якщо не unsubscribe: навіть після `ngOnDestroy` компонент залишається alive через цей reference chain.

**Trade-offs та обмеження:**

- `async pipe` — найбезпечніший, але тільки для template. Не підходить для subscribe з side effects.
- `takeUntilDestroyed()` — зручний, але вимагає injection context при створенні.
- Manual `Subscription` — явний контроль, але verbose і error-prone (забути викликати в ngOnDestroy).
- Сигнали (Signals) — вирішують проблему радикально, але потребують рефакторингу існуючого reactive code.

**Версійність:**
- Angular 2-15: `takeUntil(this.destroy$)` + Subject + ngOnDestroy — стандартний підхід
- Angular 16: `takeUntilDestroyed()` і `DestroyRef` — офіційний lightweight API (stable v16)
- Angular 16+: `inject(DestroyRef)` у standalone functions (guards, resolvers)
- Angular 17+: Signals як альтернатива — `toSignal()` автоматично unsubscribe через `DestroyRef`
- Angular 21: `takeUntilDestroyed` — рекомендований стандарт для всіх нових проектів

## Deep Details

### Edge Cases

- **HttpClient subscriptions:** `http.get()` повертає finite Observable — emit one value, then complete. Тому вони "самовиліковуються" (complete = auto-unsubscribe). Але якщо cancel navigation — subscribe callback може викликатись після destroy.
- **takeUntilDestroyed в ngOnInit:** `ngOnInit` не є injection context! `inject()` не можна викликати там. Але якщо `DestroyRef` inject у constructor або поле класу — можна передати явно: `takeUntilDestroyed(this.destroyRef)`.
- **Subject у service з кількома компонентами:** Якщо 3 компоненти підписані на один Subject і 2 знищені без unsubscribe — Subject має 3 observer, 2 з яких "зомбі".
- **takeUntil race condition:** Якщо `destroy$` Subject emit ПІСЛЯ того як Observable emit фінальне значення у ngOnDestroy — можлива обробка значення у вже знищеному компоненті. Рішення: `takeUntilDestroyed` або `first()` + `takeUntil`.
- **Subscription.add() trap:** `subscription.add(child)` — якщо parent закрито і потім child завершується, child не виконує cleanup (Angular 6- RxJS bug). Краще явний масив subscriptions.

### Junior vs Senior Understanding

**Junior** знає: "треба unsubscribe у ngOnDestroy" і може написати базовий takeUntil паттерн.

**Senior** розуміє глибину:

1. **Reference chain механізм:** Subject.observers → Subscriber → closure → component instance. Розуміє чому саме GC не збирає компонент, а не просто "там є підписка".

2. **Injection context rules:** `inject()` може бути викликаний тільки в construction phase (constructor, field initializer, або функції що викликані звідти). Тому `takeUntilDestroyed()` в `ngOnInit` — runtime error. Але `takeUntilDestroyed(this.destroyRef)` з DestroyRef inject у constructor — ✅.

3. **async pipe CD integration:** async pipe викликає `markForCheck()` при кожному новому значенні — це критично для OnPush і zoneless. Manual subscribe без markForCheck() — UI не оновиться в OnPush режимі.

4. **toSignal() alternative:** `toSignal(obs$)` внутрішньо використовує inject(DestroyRef) і автоматично unsubscribe. Це найчистіший підхід у signal-based компонентах.

### Deprecation & Migration Path

- **`takeUntil(this.destroy$)` патерн:** Не deprecated, але заміщений `takeUntilDestroyed()` у Angular 16+.

  Старий підхід:
  ```typescript
  private destroy$ = new Subject<void>();
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
  obs$.pipe(takeUntil(this.destroy$)).subscribe(...);
  ```

  Новий підхід (Angular 16+):
  ```typescript
  // У конструкторі або полі:
  obs$.pipe(takeUntilDestroyed()).subscribe(...);
  // Або з explicit DestroyRef для non-injection-context:
  private destroyRef = inject(DestroyRef);
  someMethod() { obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...); }
  ```

- **SubSink / ngx-take-until-destroy бібліотеки:** Популярні до Angular 16 third-party рішення. Зараз заміщені офіційним `takeUntilDestroyed`.

### Connections to Other Concepts

- **Higher-Order Operators (b10t1):** switchMap, concatMap автоматично управляють inner subscriptions — але outer subscription все одно потребує cleanup.
- **Signals (b11t1):** `toSignal()` — автоматичний cleanup через DestroyRef. Signals не мають subscription lifecycle.
- **OnPush Change Detection:** async pipe + OnPush — правильна комбінація. Manual subscribe без markForCheck() у OnPush — невидимі оновлення.
- **Zoneless Angular (b9t5):** Без Zone.js manual subscribe взагалі не триггерить CD — async pipe або signals обов'язкові.

## Examples

### Basic Usage

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-timer',
  standalone: true,
  template: `<div>Count: {{ count }}</div>`,
})
export class TimerComponent implements OnInit {
  count = 0;

  // ✅ DestroyRef inject у полі — injection context
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // ✅ Передаємо destroyRef явно бо ngOnInit не injection context
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.count++);
  }
}

// ✅ Альтернатива: inline у конструкторі або полі (injection context)
@Component({
  selector: 'app-data',
  standalone: true,
  template: `<div>{{ data }}</div>`,
})
export class DataComponent {
  private dataService = inject(DataService);
  data: string = '';

  // ✅ У конструкторі — injection context є
  constructor() {
    this.dataService.data$
      .pipe(takeUntilDestroyed()) // inject(DestroyRef) автоматично
      .subscribe(d => this.data = d);
  }
}
```

### Production Scenario

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { combineLatest, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <!-- ✅ async pipe: auto-subscribe, auto-unsubscribe, OnPush-safe -->
    @if (userProfile$ | async; as profile) {
      <h2>{{ profile.name }}</h2>
    }

    <!-- ✅ toSignal: signal-based, auto-cleanup via DestroyRef -->
    <div>Notifications: {{ notificationCount() }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardComponent {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  // ✅ async pipe у template — auto managed
  userProfile$ = this.userService.currentUser$.pipe(
    switchMap(user => this.userService.getProfile(user.id)),
  );

  // ✅ toSignal — converts Observable to Signal, auto-unsubscribes
  notificationCount = toSignal(
    this.notificationService.count$,
    { initialValue: 0 }
  );

  constructor() {
    // ✅ Side-effect subscription з explicit cleanup
    this.userService.sessionExpired$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleSessionExpiry());
  }

  private handleSessionExpiry() {
    // side effect logic
  }
}
```

### Anti-Example

```typescript
// ❌ WRONG: bare subscribe без cleanup
@Component({ selector: 'app-bad', template: '' })
export class BadComponent implements OnInit {
  private dataService = inject(DataService);

  ngOnInit() {
    // Memory leak: підписка живе назавжди
    this.dataService.updates$.subscribe(data => {
      this.processData(data); // викликається навіть після знищення компонента!
    });
  }
}

// ❌ WRONG: takeUntilDestroyed у ngOnInit без DestroyRef
@Component({ selector: 'app-also-bad', template: '' })
export class AlsoBadComponent implements OnInit {
  ngOnInit() {
    // Runtime Error: inject() викликаний поза injection context!
    interval(1000).pipe(takeUntilDestroyed()).subscribe();
  }
}

// ❌ WRONG: неповний takeUntil pattern
@Component({ selector: 'app-incomplete', template: '' })
export class IncompleteComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    // ❌ Забули this.destroy$.complete() — Subject сам тепер leak!
  }
}

// ✅ CORRECT: всі правильні підходи
@Component({ selector: 'app-good', template: '' })
export class GoodComponent {
  private dataService = inject(DataService);
  private destroyRef = inject(DestroyRef);

  // ✅ Підхід 1: toSignal (найкращий для читання даних)
  data = toSignal(this.dataService.data$, { initialValue: null });

  // ✅ Підхід 2: async pipe у template
  data$ = this.dataService.data$;

  // ✅ Підхід 3: takeUntilDestroyed для side effects
  constructor() {
    this.dataService.criticalUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(update => this.handleUpdate(update));
  }
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Bare `subscribe()` без cleanup | Memory leak — компонент не збирається GC після destroy | `takeUntilDestroyed()`, `async pipe`, або `toSignal()` |
| `takeUntilDestroyed()` у `ngOnInit` або методах | Runtime error — `inject()` поза injection context | Inject `DestroyRef` у конструкторі/полі, передати явно |
| `takeUntil(destroy$)` без `destroy$.complete()` у ngOnDestroy | Subject сам є memory leak, потенційний race condition | Мігрувати на `takeUntilDestroyed()` або додати `complete()` |
| Multiple `async pipe` на одному Observable у template | Кілька subscriptions = кілька HTTP запитів | `shareReplay(1)` або `@if (data$ \| async; as data)` alias |
| Subscribe на Subject у service без cleanup | Service singleton живе завжди, subscriber (компонент) — ні | `takeUntilDestroyed` у компоненті або `toSignal` |

## Interview Block

### [L1 — Warm-up] Що таке memory leak в контексті RxJS і як він виникає в Angular?
**Signal being tested:** Чи розуміє кандидат механізм reference chain що утримує компонент у пам'яті
**What the interviewer expects:** Пояснення що subscribe callback замикає компонент, Subject тримає subscriber, GC не може зібрати. Згадка конкретних довгоживучих Observable.
**How to probe deeper:** "Чому HTTP запити HttpClient зазвичай не спричиняють leaks, а interval() — так?"
**Reference answer:** Memory leak виникає коли Observable subscription залишається активною після destroy компонента. Subject у service тримає посилання на Subscriber, Subscriber замикає callback що тримає компонент instance. GC не може зібрати компонент через цей reference chain. Довгоживучі Observable (interval, timer, WebSocket, BehaviorSubject у service) не завершуються самостійно. HttpClient Observable завершуються після однієї відповіді — тому вони safe, але все одно краще cleanup.
**Common mistakes:** Думають що всі Observable потребують unsubscribe (тільки ті що не завершуються самостійно); не можуть пояснити механізм GC і reference chain

### [L2 — Mid] Порівняйте async pipe, takeUntilDestroyed, manual unsubscribe. Коли що використовувати?
**Signal being tested:** Чи знає кандидат сучасні Angular APIs і може обрати правильний підхід для конкретного контексту
**What the interviewer expects:** Розуміння переваг кожного підходу, знання injection context requirement для takeUntilDestroyed, preference async pipe для template-driven, limitation manual підходу
**How to probe deeper:** "Якщо потрібна підписка у ngOnInit і не можна використати async pipe — який підхід обрати і чому?"
**Reference answer:** async pipe — найкращий для template: auto-subscribe/unsubscribe, OnPush-safe (markForCheck), немає lifecycle boilerplate. takeUntilDestroyed() — для imperative subscriptions у constructor або field, inject(DestroyRef) автоматично або explicit. Manual Subscription — для conditional unsubscribe або legacy code. Preference: async pipe / toSignal > takeUntilDestroyed > manual. Для ngOnInit: inject DestroyRef у полі, передати явно `takeUntilDestroyed(this.destroyRef)`.
**Common mistakes:** Не знають injection context requirement; не знають toSignal() як альтернативу; думають async pipe і manual subscribe ідентичні для OnPush

### [L3 — Senior] Як takeUntilDestroyed() працює під капотом? Що таке DestroyRef?
**Signal being tested:** Чи розуміє кандидат Angular DI internals і lifecycle registration mechanism
**What the interviewer expects:** Пояснення DestroyRef.onDestroy(), зв'язок з TView.destroyHooks, injection context requirement і чому. Розуміння що DestroyRef — абстракція для compose-able cleanup.
**How to probe deeper:** "Як би ви використали DestroyRef для написання reusable utility що автоматично cleanup-ає custom resource?"
**Reference answer:** `takeUntilDestroyed()` inject(DestroyRef) при створенні, реєструє `DestroyRef.onDestroy(() => subject.next(); subject.complete())`, використовує `takeUntil(subject)`. DestroyRef — Angular DI token що абстрагує lifecycle destroy: для компонентів реєструє cleanup у TView.destroyHooks, для environment — в EnvironmentInjector. Injection context requirement: `inject()` дозволений тільки в construction phase. Тому `takeUntilDestroyed()` без аргументів у `ngOnInit` — runtime error, бо ngOnInit викликається після construction.
**Common mistakes:** Думають ngOnInit — injection context; не знають що DestroyRef працює в inject-based functions (guards, resolvers); плутають DestroyRef з ngOnDestroy lifecycle hook

### [L4 — Staff/Principal] Як виявити та усунути memory leaks через RxJS у production Angular додатку?
**Signal being tested:** Системне мислення — tooling, monitoring, prevention, architecture
**What the interviewer expects:** Chrome Memory Profiler workflow, heap snapshot comparison, automated detection, архітектурні prevention strategies (signals migration, ESLint rules), production monitoring
**How to probe deeper:** "Як побудувати автоматизований pipeline що виявляє memory leaks до production?"
**Reference answer:** Detection: Chrome Memory Timeline — heap growth при navigation між routes. Heap Snapshot comparison — Objects allocated between snapshots з Angular component instances. Angular DevTools — знищені компоненти у дереві. Automated: Playwright test що navigates to/from route, forces GC, перевіряє WeakRef до компонента — nullified = collected, alive = leak. Prevention: ESLint rules для bare subscribe, code review checklist, async pipe / toSignal як default. Architecture: migrate до signals — eliminates subscription lifecycle. Production monitoring: performance.measureUserAgentSpecificMemory(), custom subscription tracker у dev mode.
**Common mistakes:** Тільки code review без automation; фокусуються на компонентах, ігнорують service leaks; не мають production memory metrics

## Summary

### Key Points
- Memory leak виникає коли Subject тримає Subscriber → closure → component instance, заважаючи GC
- `takeUntilDestroyed()` (Angular 16+) — стандарт для imperative subscriptions, вимагає injection context
- `async pipe` — найбезпечніший для template: auto-cleanup + OnPush-safe markForCheck()
- `toSignal()` — конвертує Observable у Signal з автоматичним cleanup через DestroyRef
- `DestroyRef.onDestroy()` — composable lifecycle registration, не залежить від класу компонента
- HttpClient Observable завершуються самостійно, але interval/timer/Subject — ні
- Chrome Memory Profiler + heap snapshot comparison — основний інструмент для виявлення leaks

### Elevator Pitch (2 minutes)
"Memory leaks в Angular/RxJS — це ситуація коли Subject у сервісі тримає Subscriber що замикає компонент, і GC не може зібрати знищений компонент. Сучасне рішення: async pipe у template, toSignal() для перетворення Observable на Signal, takeUntilDestroyed() для imperative subscriptions у constructor. Важливий нюанс: takeUntilDestroyed() вимагає injection context — inject DestroyRef у полі, не у ngOnInit. Для виявлення leaks: Chrome Memory Timeline і heap snapshot comparison. Для prevention: ESLint rules і prefer signals де можливо."
