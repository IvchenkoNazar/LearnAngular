---
title: "OnPush Change Detection Strategy"
block: 9
topic: 3
slug: "onpush-strategy"
difficulty: 3
sinceVersion: "2"
tags: ["OnPush", "ChangeDetectionStrategy", "immutability", "pure-pipe", "markForCheck", "performance"]
relatedTopics: ["cd-mechanism", "signals", "rxjs-subject-types", "input-output"]
interviewQuestions:
  - level: "junior"
    question: "Що таке OnPush change detection strategy і яка різниця з Default?"
    referenceAnswers:
      junior: "OnPush — це стратегія CD де Angular перевіряє компонент тільки якщо змінились його Input значення (за reference), відбулась DOM подія всередині, або async pipe emit нове значення. Default перевіряє кожен компонент при кожному CD cycle."
      mid: "ChangeDetectionStrategy.OnPush повідомляє Angular пропустити компонент під час CD якщо: 1) Жоден @Input() не змінив reference (shallow equality), 2) Немає DOM event в компоненті або його descendants, 3) Немає async pipe що emit нове значення, 4) Не викликано markForCheck() або detectChanges(). Переваги: значно менше CD роботи, особливо для leaf components і компонентів з незмінними даними. Вимога: immutable data — замість мутування об'єктів/масивів потрібно створювати нові references."
      senior: "OnPush у Ivy: LView отримує прапор LViewFlags.CheckAlways (Default) або його відсутність (OnPush). При CD traversal: якщо LView не має Dirty або CheckAlways — пропускається. OnPush компонент стає Dirty коли: Input reference changes (Angular встановлює Dirty при Input binding), DOM event в компоненті/descendants, async pipe emit (async pipe виклика markForCheck() всередині), signal change в template, явний markForCheck()/detectChanges(). Важливий нюанс: навіть якщо OnPush компонент пропускається — Angular все одно traverse down до нього щоб знайти dirty descendants (child components що Dirty). Це означає що OnPush не є 'subtree skip' — це 'current component skip but traverse children'."
      staff: "OnPush є base requirement для performance в large Angular apps — всі компоненти повинні бути OnPush в enterprise context. Architectural implications: 1) Immutable data flow — entities повертаються як нові objects при update (immer.js, structuredClone, spread). 2) Input change detection: Object.is() comparison — reference equality, not deep. 3) Component design: stateless presentational components (OnPush) + stateful container components (OnPush + signals/async pipe). 4) Pure pipes: завжди pure, автоматично OnPush-compatible. 5) Change detection cascade: якщо parent OnPush не dirty — його дочірні компоненти теж не перевіряються (навіть якщо вони Default) — OnPush батьків 'shields' subtree більш ефективно. 6) ESLint rule: @angular-eslint/prefer-on-push-component-change-detection — enforce across team."
    commonMistakes:
      - "Мутують Input об'єкт і очікують що CD спрацює — reference не змінилась"
      - "Думають OnPush пропускає весь subtree — Angular все одно traverse щоб знайти dirty children"
    relatedQuestions: ["b9t3q2", "b9t3q3"]
  - level: "mid"
    question: "Чому з OnPush потрібно використовувати immutable data і як правильно оновлювати стан?"
    referenceAnswers:
      junior: "З OnPush Angular перевіряє Input через reference equality. Якщо мутувати масив (push), reference залишається та сама і Angular не бачить зміну. Потрібно створювати новий масив: [...oldArray, newItem]."
      mid: "OnPush використовує Object.is() для порівняння Input references. Мутація: this.user.name = 'New' → reference та сама → CD не запустить. Правильно: this.user = { ...this.user, name: 'New' } або this.users = [...this.users, newUser]. Для вкладених оновлень: structuredClone() або immer.js produce(). Альтернативи до immutability: async pipe (Observable) — кожен emit тригерить CD незалежно від reference. Signal — кожен signal.set() тригерить targeted CD."
      senior: "Immutability requirement з OnPush є архітектурним рішенням яке впливає на весь data flow. Рівні immutability: 1) Shallow copy (spread) — достатньо якщо Angular тільки перевіряє top-level reference. 2) Deep copy (structuredClone) — для складних nested objects де компонент читає nested properties. 3) Immer.js produce() — structural sharing, тільки змінені частини копіюються. Performance consideration: надмірне cloning (structuredClone великих arrays на кожен keypress) може бути дорожчим ніж Default CD. Trade-off: shallow immutability + signal для targeted notifications = optimal. Реальна проблема з mutation: якщо parent mutates input object — OnPush child ніколи не дізнається про зміну. Це silent bug, важко відлагодити."
      staff: "Immutability в Angular enterprise: 1) Store pattern (NgRx, Signal Store) — entities normalized, updates через selectors що return new references. 2) Immer.js vs spread: immer structural sharing краще для performance при великих state trees. 3) Object identity vs value equality: для деяких use cases (comparison logic) потрібен custom equality fn у signal або computed(). 4) Type system enforcement: readonly properties (Readonly<T>, DeepReadonly<T>) в TypeScript запобігають mutation. 5) ESLint rules: @typescript-eslint/prefer-readonly-parameter-types. 6) Testing: при тестуванні OnPush компонентів — TestBed.get(ChangeDetectorRef).detectChanges() після input change або fixture.detectChanges() — обидва повинні використовуватись правильно. 7) Performance measurement: measure CD cycles before and after OnPush migration через Angular DevTools."
    commonMistakes:
      - "Використовують JSON.parse(JSON.stringify(obj)) для deep clone — повільно і втрачає Date, undefined, функції"
      - "Мутують масиви у service і очікують що OnPush компонент оновиться через reference до того самого масиву"
    relatedQuestions: ["b9t3q1", "b9t3q3"]
  - level: "senior"
    question: "Як async pipe пов'язана з OnPush і чому вона є рекомендованим паттерном?"
    referenceAnswers:
      junior: "async pipe автоматично підписується на Observable або Promise і викликає markForCheck() при новому значенні, що змушує OnPush компонент оновитись. Вона також автоматично відписується при destroy компонента."
      mid: "async pipe для OnPush: 1) Підписується на Observable при ініціалізації, 2) При кожному emit — викликає ChangeDetectorRef.markForCheck() (built-in в AsyncPipe.transform()), 3) Унsubscribe при компонент destroy. Це значить OnPush компонент автоматично оновлюється при нових значеннях Observable без ручного markForCheck(). Без async pipe потрібно: subscribe() + markForCheck() + unsubscribe в ngOnDestroy — async pipe виконує все це безкоштовно."
      senior: "async pipe implementation: AsyncPipe implements PipeTransform і ChangeDetectorRef inject. В transform(obj): якщо obj змінився — subscribe, зберегти latestValue, виклика this._ref.markForCheck(). При emit: latestValue = value, this._ref.markForCheck(). В ngOnDestroy: unsubscribe. Це pure pipe false (impure) — перевіряється на кожному CD cycle — але це потрібно щоб detect reference change на Observable. Edge case: якщо Observable emit синхронно в конструкторі — perший markForCheck() може відбутись до CD — нормально. Декілька async pipe на одному Observable: кожен pipe підписується окремо. Щоб уникнути множинних subscriptions: shareReplay(1) або share з refCount."
      staff: "async pipe vs explicit subscribe patterns для enterprise: 1) async pipe — declarative, automatic lifecycle, no manual unsubscribe — рекомендовано. 2) toSignal() (Angular 16+) — конвертує Observable до Signal — ще краще для OnPush, оскільки signals мають targeted CD замість markForCheck(). 3) Explicit subscribe — тільки якщо потрібна side-effect логіка або складний lifecycle management. Trade-off analysis: async pipe у @if може re-subscribe при condition change — потрібен shareReplay(). toSignal() з initialValue — безпечніший. Для Angular 18+ (zoneless): async pipe все ще підтримується і викликає markForCheck() → з zoneless це triggered targeted CD через signal mechanism. Міграція стратегія: async pipe → toSignal() поступово, старий код підтримується."
    commonMistakes:
      - "Підписуються двічі на один Observable з двома async pipe і дивуються подвійним HTTP запитам"
      - "Думають async pipe робить компонент Default — вона просто викликає markForCheck() при emit"
    relatedQuestions: ["b9t3q2", "b9t3q1", "b9t4q1"]
  - level: "staff"
    question: "Як побудувати scalable component architecture де всі компоненти OnPush без постійних проблем з оновленнями?"
    referenceAnswers:
      junior: "Використовувати immutable data, async pipe або signals для реактивного стану, і signals або BehaviorSubject для services."
      mid: "Container/Presentational pattern: Container компоненти (OnPush) управляють state через services, передають дані дочірнім через Inputs. Presentational компоненти (OnPush) тільки відображають дані через Inputs, emit events через Output. Immutable updates в services (BehaviorSubject.next(newValue)), async pipe або toSignal() в templates."
      senior: "Scalable OnPush architecture: 1) Services expose Observables або Signals (не мутабельний state). 2) Container components inject services, pipe до template через async або toSignal(). 3) Presentational components pure — @Input тільки primitives або immutable objects, @Output EventEmitters для user actions. 4) Pure pipes для transformations — вони automatically compatible з OnPush (тільки recalculate при input change). 5) Signals для derived state: computed() замість template expressions. 6) trackBy/@for track для list performance. 7) @defer для lazy loading heavy components."
      staff: "Enterprise OnPush architecture принципи: 1) One-way data flow: state в services → signals/observables → templates via async/toSignal → events via outputs → services. 2) Signal Store pattern (NgRx Signal Store або custom): patchState() creates new state references, selectSignal() для derived computed. 3) Component isolation: кожен component self-contained — не inject parent component, communicate through services або output events. 4) Linting enforcement: @angular-eslint rules for OnPush, no-direct-mutation rules. 5) Testing: OnPush components tested without fakeAsync у bagatomу більшості cases — signals і observables observable via async. 6) Migration: audit current app з Angular DevTools — identify components that check 90%+ of CD cycles → make them OnPush first. 7) Build metric: track 'CD cycles per interaction' in E2E performance tests — regression prevention. 8) Team education: document immutability patterns specific to your domain models."
    commonMistakes:
      - "Container і Presentational components обидва inject services напряму — Presentational повинні отримувати дані тільки через Input"
      - "Презентаційні компоненти мають внутрішній state що мутується — вони мають бути stateless або використовувати signals"
    relatedQuestions: ["b9t3q3", "b9t4q1"]
---

## Core Concept

**English definition:** OnPush (ChangeDetectionStrategy.OnPush) is a change detection optimization strategy that instructs Angular to skip checking a component during CD traversal unless the component is explicitly marked as dirty through one of the defined trigger conditions: Input reference change, DOM event, async pipe emission, or manual markForCheck()/detectChanges().

**Пояснення:** OnPush — це "opt-out" від Angular's default expensive behavior. За замовчуванням Angular перевіряє кожен компонент при кожному CD cycle. З OnPush Angular каже: "цей компонент не змінився якщо не виконано одна з умов". Це суттєво зменшує CD роботу для leaf і presentational компонентів.

**Яку проблему вирішує:** В app з 500 компонентів — Default CD перевіряє всі 500 при кожній події. З OnPush на leaf компонентах — перевіряє тільки ті де щось дійсно змінилось. Зменшення CD роботи від O(all) до O(dirty).

**Як працює під капотом:** В Ivy: LView без CheckAlways flag є OnPush. Під час CD traversal: `if (lView.flags & LViewFlags.CheckAlways || lView.flags & LViewFlags.Dirty)` — перевіряти, інакше пропустити. OnPush triggers, що встановлюють Dirty flag: `setInputsForProperty()` (Input change) → `markViewDirty(lView)`. Async pipe: `this._ref.markForCheck()`. DOM event: Angular event handlers завжди mark view. Signal: signal consumer notification → `markViewDirty()`.

**Trade-offs та обмеження:**
- Вимагає immutable data flow — більша дисципліна в команді
- Debugging складніший: якщо UI не оновлюється — треба знайти де missed trigger
- Не є silver bullet: якщо parent компонент Default, його subtree все одно перевіряється

**Версійність:**
- Angular 2: ChangeDetectionStrategy.OnPush available від початку
- Angular 17: Signals автоматично сумісні з OnPush (signal changes mark LView dirty)
- Angular 21: OnPush рекомендовано для всіх нових компонентів; eslint rule для enforcement

## Deep Details

### Edge Cases

**OnPush і child events:** Якщо descendant (дочірній) компонент є Default стратегії, але його parent є OnPush — при CD якщо parent не dirty, child теж не перевіряється. Parent "shields" subtree.

**OnPush і content projection:** ng-content — projected content belongs до projector's LView, не host LView. OnPush на host component не запобігає CD для projected content якщо projector перевіряється.

**markForCheck() vs detectChanges() з OnPush:** markForCheck() marks current + all ancestors as dirty → на наступному CD cycle все ланцюжок перевіряється. detectChanges() запускає CD негайно тільки для поточного subtree, але не marks ancestors.

**Signal в OnPush template:** `{{ mySignal() }}` у template OnPush компонента — Angular реєструє LView як consumer. При signal.set() → LView marks dirty → CD перевіряє цей компонент. Це targeted і ефективно.

**Input spreading:** `<comp [data]="{...props}"` — новий object literal на кожен CD cycle parent → завжди новий reference → OnPush child завжди dirty → OnPush втрачає сенс. Потрібно використовувати ViewModel object або signal.

### Junior vs Senior Understanding

**Junior розуміє:** OnPush перевіряє тільки при Input change. Потрібна immutability.

**Senior розуміє:**
- LViewFlags.Dirty mechanism
- Всі 4 trigger умови (Input ref change, DOM event, async pipe, markForCheck)
- async pipe як built-in markForCheck() caller
- Input spreading anti-pattern
- Container/Presentational component pattern

**Staff розуміє:**
- OnPush shielding subtree (Default child under OnPush parent)
- Signal integration з targeted dirty marking
- Enterprise enforcement (ESLint, code review guidelines)
- Performance measurement before/after OnPush migration
- Signal Store patterns для immutable state management

### Deprecation & Migration Path

OnPush не deprecated — навпаки, стає все більш рекомендованим. Angular team рекомендує:
1. Всі нові компоненти — OnPush за замовчуванням
2. Поступова міграція існуючих компонентів: identify leaf components → add OnPush → fix immutability issues → propagate up
3. `ng update` не мігрує автоматично, але Angular Schematic: `ng generate @angular/core:use-strict-standalone` може допомогти

### Connections to Other Concepts

- **CD Mechanism (b9t2):** LViewFlags.Dirty — основа OnPush mechanism
- **Signals (b9t4):** Signals є найкращим trigger для OnPush — targeted і automatic
- **Async Pipe:** Вбудований markForCheck() caller — стандарт для Observable з OnPush
- **Input/Output (b2t3):** Input reference equality — основа OnPush decision
- **Pure Pipes:** Automatically compatible з OnPush — не recalculate якщо input не змінився

## Examples

### Basic Usage

```typescript
import {
  Component, Input, ChangeDetectionStrategy, signal, computed
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
}

// Presentational (dumb) component — pure display, OnPush
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <h2>{{ user.name }}</h2>
      <p>{{ user.email }}</p>
    </div>
  `,
})
export class UserCardComponent {
  @Input({ required: true }) user!: User;
  // OnPush: this component only re-renders when 'user' Input reference changes
  // Mutation: this.user.name = 'New' in parent — OnPush child WON'T re-render
  // New object: this.user = {...this.user, name: 'New'} — OnPush WILL re-render
}

// Container component — manages state, uses async pipe
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [UserCardComponent, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user$ | async; as user) {
      <app-user-card [user]="user" />
    }
  `,
})
export class UserProfileComponent {
  user$: Observable<User>; // Container subscribes to service Observable
  // async pipe: calls markForCheck() on each emit → OnPush works correctly
}
```

### Production Scenario

```typescript
// Signal-based OnPush pattern (Angular 17+) — most modern approach
import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from './user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Welcome, {{ userName() }}</h1>
    <p>Notifications: {{ notificationCount() }}</p>

    @if (isLoading()) {
      <mat-spinner />
    } @else {
      @for (item of dashboardItems(); track item.id) {
        <app-dashboard-item [item]="item" />
      }
    }
  `,
})
export class DashboardComponent {
  private userService = inject(UserService);

  // Convert Observable to Signal — eliminates async pipe, better performance
  private user = toSignal(this.userService.currentUser$, { initialValue: null });
  readonly userName = computed(() => this.user()?.name ?? 'Guest');

  // Writable signals for local UI state
  readonly isLoading = signal(false);
  readonly dashboardItems = toSignal(this.userService.dashboardItems$, { initialValue: [] });

  // computed signals — only recalculate when dependencies change
  readonly notificationCount = toSignal(
    this.userService.notifications$,
    { initialValue: 0 }
  );
  // With OnPush + signals: only dirty LViews for changed signals are checked
  // No global CD traversal needed
}
```

### Anti-Example

```typescript
// WRONG: Anti-patterns that break OnPush
@Component({
  selector: 'app-bad-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of items; track item.id) {
      <app-item [item]="item" />
    }
  `,
})
export class BadListComponent {
  @Input() items: Item[] = [];

  addItem(newItem: Item): void {
    // WRONG: Mutating the Input array — reference unchanged
    // OnPush: Angular sees same array reference → skips CD → UI not updated!
    this.items.push(newItem);

    // CORRECT:
    // this.items = [...this.items, newItem];
  }
}

// WRONG: Creating new object in template
@Component({
  template: `
    <!-- WRONG: New object literal on every parent CD cycle
         OnPush child always has new Input reference → always dirty → defeats OnPush -->
    <app-user-card [config]="{ theme: 'dark', size: 'large' }" />

    <!-- CORRECT: Define config as class property or signal -->
    <app-user-card [config]="cardConfig" />
  `,
})
export class WrongParentComponent {
  // Correct: stable reference that only changes when needed
  readonly cardConfig = { theme: 'dark' as const, size: 'large' as const };
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| `this.items.push(item)` with OnPush Input | Array reference unchanged → OnPush child skips CD → UI stale | `this.items = [...this.items, item]` — new reference triggers OnPush |
| Object literals in template bindings: `[config]="{ key: 'value' }"` | New object created on every parent CD cycle → OnPush child always dirty → OnPush benefit lost | Move config to class property or `readonly signal` |
| Calling `detectChanges()` on every data change | Creates N synchronous CD cycles — defeats batching | Use `markForCheck()` for deferred update, or migrate to signals |
| Default strategy for leaf/presentational components | These components re-render on every CD cycle even when nothing changed | All presentational (display-only) components should be OnPush |
| `subscribe()` without `markForCheck()` in OnPush component | Observable emits but OnPush component doesn't update — silent stale UI | Use `async pipe` (calls markForCheck internally) or `toSignal()` |

## Interview Block

### [L1 — Warm-up] Що таке OnPush і які умови тригерять CD для OnPush компонента?

**Signal being tested:** Базове знання OnPush triggers і контраст з Default стратегією.

**What the interviewer expects:** 4 умови (Input ref change, DOM event, async pipe, markForCheck), і чому immutability потрібна.

**How to probe deeper:** "Якщо я зроблю `this.user.name = 'New'` в parent компоненті — оновиться OnPush child?"

**Reference answer:** OnPush пропускає CD якщо жодна з умов не виконана: 1) @Input() reference змінилась (Object.is() comparison), 2) DOM event всередині компонента, 3) async pipe отримала нове значення (виклика markForCheck()), 4) явний markForCheck() або detectChanges(). `this.user.name = 'New'` — reference не змінилась, OnPush child НЕ оновиться. Потрібно: `this.user = {...this.user, name: 'New'}` — нова reference → OnPush тригер.

**Common mistakes:** Думають що OnPush перевіряє deep equality — ні, тільки shallow reference (Object.is()).

---

### [L2 — Mid] Як async pipe забезпечує сумісність з OnPush?

**Signal being tested:** Розуміння що async pipe не є просто syntax sugar — вона інтегрується з CD через markForCheck().

**What the interviewer expects:** Пояснення що async pipe inject(ChangeDetectorRef) і викликає markForCheck() при emit.

**How to probe deeper:** "Що станеться якщо один Observable прив'язати двома async pipe у OnPush компоненті?"

**Reference answer:** async pipe є impure pipe що inject(ChangeDetectorRef). При кожному Observable emit: `latestValue = value; this._ref.markForCheck()`. Це marks OnPush компонент як dirty → наступний CD cycle перевіряє його. Автоматично відписується при ngOnDestroy. З двома async pipe на одному Observable: два підписники = якщо Observable cold (HttpClient.get()) — два HTTP запити. Рішення: shareReplay(1) або одна підписка + *ngIf template.

**Common mistakes:** Думають async pipe робить компонент Default — вона тільки markForCheck() при emit.

---

### [L3 — Senior] Поясни Container/Presentational pattern з OnPush і як він scale для large apps.

**Signal being tested:** Архітектурне розуміння як структурувати компоненти для максимальної CD efficiency.

**What the interviewer expects:** Чіткий опис ролей (container = state management, presentational = pure display), data flow, і чому обидва OnPush.

**How to probe deeper:** "Як передати дані між двома сусідніми presentational компонентами без порушення паттерну?"

**Reference answer:** Container компонент: OnPush, inject services, отримує Observables/Signals, передає через Input до presentational children. Presentational компонент: OnPush, тільки @Input() і @Output(), жодних inject services — повністю stateless. Data flow: Service → Observable/Signal → Container (async|toSignal) → Input → Presentational. Між сусідніми presentational: через parent container — виклика service через Output → service оновлює Observable/Signal → обидва presentational отримують оновлення через Input. Це unidirectional data flow — передбачувано і debuggable.

**Common mistakes:** Presentational компоненти inject services напряму — порушує isolation і testability.

---

### [L4 — Staff/Principal] Як виміряти impact OnPush migration і довести команді що це варто?

**Signal being tested:** Data-driven підхід до performance optimization і здатність переконати команду через metrics.

**What the interviewer expects:** Конкретні метрики (CD cycles/sec, CD duration, frame time), tooling (Angular DevTools, Lighthouse), і стратегія поступової міграції.

**How to probe deeper:** "Як запобігти регресіям після міграції і переконатись що OnPush не вломив UI?"

**Reference answer:** Measurement strategy: 1) Angular DevTools Profiler — CD cycles per interaction, duration. 2) `performance.mark()`/`measure()` навколо user interactions. 3) Chrome Performance recorder — frame time, Jank. Метрики до/після: CD cycles per second в idle (має бути ~0 після), average CD duration, First Input Delay. E2E tests (Playwright) — функціональна regression prevention. Migration approach: leaf components first (найбезпечніше), далі container. ESLint rule для нових компонентів. Team buy-in: показати flamegraph до/після migration — візуальне підтвердження значно ефективніше ніж слова.

**Common mistakes:** Мігрують великі container компоненти першими — ризик broken UI через missed immutability. Безпечніше — leaf components first.

## Summary

### Key Points

- OnPush пропускає CD для компонента якщо жодна умова не виконана: Input reference change, DOM event, async pipe emit, або явний markForCheck()/detectChanges()
- Input comparison — reference equality (Object.is()), не deep equality; мутація об'єкта не тригерить CD
- async pipe вбудовано викликає markForCheck() при Observable emit — стандарт для OnPush + Observable
- toSignal() (Angular 16+) конвертує Observable до Signal — targeted CD, ще ефективніше за async pipe
- Container/Presentational pattern: container — state management через services, presentational — stateless, тільки @Input/@Output
- Object literals в template bindings `[config]="{ key: 'val' }"` — новий reference на кожен parent CD cycle, defeats OnPush
- Всі компоненти в enterprise Angular app мають бути OnPush — enforce через ESLint @angular-eslint/prefer-on-push-component-change-detection

### Elevator Pitch (2 minutes)

OnPush — це ChangeDetectionStrategy що говорить Angular: "перевіряй мене тільки коли дійсно є причина". Причини: Input reference змінилась (Object.is()), DOM event у компоненті, async pipe отримала нове значення, або явний markForCheck(). За замовчуванням Angular перевіряє КОЖЕН компонент при кожній async операції. З OnPush leaf компоненти пропускаються якщо нічого не змінилось. Вимоги: immutable data — `this.items = [...this.items, newItem]` замість `this.items.push(newItem)`. async pipe — стандартний спосіб тримати Observable і OnPush у синхроні. toSignal() — сучасна альтернатива, ще ефективніша. Для enterprise: всі компоненти OnPush — enforce через ESLint, measure impact через Angular DevTools Profiler.
