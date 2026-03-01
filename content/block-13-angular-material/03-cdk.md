---
title: "Angular CDK"
block: 13
topic: 3
slug: "cdk"
difficulty: 4
sinceVersion: "7"
tags: ["CDK", "a11y", "overlay", "drag-drop", "virtual scroll", "FocusTrap", "CdkPortal", "CdkTable"]
relatedTopics: ["setup-theming", "key-components", "change-detection", "performance-optimization"]
interviewQuestions:
  - level: "junior"
    question: "Що таке Angular CDK і чим він відрізняється від Angular Material?"
    referenceAnswers:
      junior: "CDK — це набір утиліт для будування UI компонентів. Material використовує CDK але додає Material Design стилі. CDK можна використовувати без Material."
      mid: "CDK (Component Dev Kit) — це behavior primitives без opiniated styling: Overlay (позиціонування попапів), Drag and Drop, Virtual Scrolling, Focus Management, Table primitive, Portal. Angular Material використовує CDK під капотом і додає Material Design CSS і theming. CDK дозволяє будувати власні design systems з правильним behavior без прив'язки до Material Design."
      senior: "CDK архітектура: behavior-focused primitives що вирішують складні UI задачі: 1) Overlay — `PositionStrategy` + `ScrollStrategy` + `OverlayRef` для точного позиціонування floating elements. 2) FocusTrap/FocusMonitor — a11y-correct focus management для modals і custom widgets. 3) Virtual Scroll — rendering windowing для 100k+ items. 4) Drag and Drop — HTML5 drag events abstracted для touch support. 5) Portal — teleporting DOM nodes між locations. 6) CdkTable — headless data table без styling. Material components = CDK primitives + Material Design CSS + theme integration."
      staff: "CDK є foundation для Angular UI ecosystem: 1) CDK першим отримує experimental features (потім Material будується поверх). 2) Custom design systems: Tailwind + CDK = branded components з accessibility без Material overhead. 3) CDK versioning: частина @angular/cdk — release cycle sync з Angular. 4) Tree shaking: CDK modules granular — `@angular/cdk/overlay`, `@angular/cdk/drag-drop`. 5) Platform team рішення: CDK vs Material — CDK для custom design system, Material для швидкий MVP або Google-aligned products. 6) CdkTesting (component harnesses) — загальна testing infrastructure що і Material використовує."
    commonMistakes:
      - "Думають що CDK потребує Angular Material — CDK повністю незалежний"
      - "Не знають CDK модулі granular — імпортують надлишкове"
      - "Будують custom overlays вручну (z-index, position) замість CDK Overlay"
    relatedQuestions: ["b13t3q2", "b13t2q1"]
  - level: "mid"
    question: "Як використати CDK Overlay для створення кастомного popover/tooltip компонента?"
    referenceAnswers:
      junior: "Inject Overlay сервіс, викликати create() з конфігурацією, attach component через PortalOutlet."
      mid: "CDK Overlay для popover: 1) Inject `Overlay` і `ViewContainerRef`. 2) `overlayRef = this.overlay.create({ positionStrategy, scrollStrategy })`. 3) `PositionStrategy`: `this.overlay.position().flexibleConnectedTo(elementRef).withPositions([...])`. 4) Attach: `overlayRef.attach(new ComponentPortal(PopoverComponent))`. 5) Dismiss: `overlayRef.detach()` або `dispose()`. 6) Backdrop: `{ hasBackdrop: true }` + subscribe `overlayRef.backdropClick()`."
      senior: "CDK Overlay internals: 1) `OverlayRef` — wrapper над DOM element що Overlay service creates в overlay container. 2) `FlexibleConnectedPositionStrategy` — розраховує position відносно origin element враховуючи viewport bounds. `withPositions([preferredPos, fallback1, fallback2])` — автоматичний flip при viewport overflow. 3) `ScrollStrategies`: close (dismiss при scroll), reposition (перераховує позицію), block (блокує scroll), noop. 4) Keydown handling: підписуватись на `overlayRef.keydownEvents()` для ESC dismiss. 5) Focus management: `FocusTrap` або `FocusMonitor` для overlay content. 6) `TemplatePortal` vs `ComponentPortal` — template якщо компонент і template в одному file, component для lazy-loadable popover."
      staff: "Enterprise overlay architecture: 1) Tooltip/Popover service pattern: `TooltipService.show(targetEl, config)` — centralizes overlay lifecycle, prevents duplicate instances, cleanup registry. 2) Overlay стек management — z-index через CDK Overlay container (single div, stacking через order). 3) Accessibility: focus trap для modal-like overlays, focus NOT trapped для non-modal popovers. `aria-expanded` на trigger, `aria-controls` посилання на overlay id. 4) Animation: `OverlayRef` не має built-in animations — implement через Angular `@trigger` або CSS transitions + AnimationBuilder. 5) SSR: Overlay creates DOM elements — needs PLATFORM_ID check, `isPlatformBrowser()`. 6) Testing: `OverlayContainer` provider injection для tests — query overlay DOM in test environment. `const overlayContainerEl = TestBed.inject(OverlayContainer).getContainerElement()`."
    commonMistakes:
      - "Не налаштовують fallback positions — popover виходить за межі viewport"
      - "ScrollStrategy noop — overlay залишається де є при scroll замість dismiss/reposition"
      - "Забувають dispose() OverlayRef — memory leak, orphaned DOM elements"
    relatedQuestions: ["b13t3q1", "b13t3q3"]
  - level: "senior"
    question: "Як CDK accessibility utilities (FocusTrap, FocusMonitor, LiveAnnouncer) допомагають будувати accessible компоненти?"
    referenceAnswers:
      junior: "FocusTrap утримує фокус в межах модального діалогу. LiveAnnouncer оголошує зміни для screen readers."
      mid: "1) FocusTrap: `trapFocus = this.focusTrapFactory.create(element)`. Перехоплює Tab і Shift+Tab в межах element. 2) FocusMonitor: `focusMonitor.monitor(element)` — Observable<FocusOrigin> де origin: 'touch' | 'mouse' | 'keyboard' | 'program'. 3) LiveAnnouncer: `liveAnnouncer.announce('Item deleted', 'assertive')` — `aria-live` region. Polite vs assertive: polite чекає паузи, assertive перериває."
      senior: "CDK a11y internals: 1) FocusTrap: встановлює два 'sentinel' span елементи на початку і кінці container. При фокусуванні sentinel — CDK перенаправляє фокус на перший/останній focusable element. `initialFocus` option — specifiy initial element. `autoCapture: true` — автоматично captures при creation. 2) FocusMonitor: monkey-patches global focus/blur events і визначає origin через timing heuristics (mouse click перед focus = mouse origin). Корисно для розрізнення keyboard vs mouse navigation (показувати focus ring лише для keyboard). 3) `ActiveDescendantKeyManager` / `ListKeyManager` — keyboard navigation для listbox, menu, autocomplete patterns: arrow keys, home/end, typeahead. 4) `InteractivityChecker` — перевірити чи element focusable/disabled. 5) `FOCUS_TRAP_INERT` для inert attribute support."
      staff: "Accessibility architecture для enterprise: 1) WCAG compliance strategy: automated (axe-core CI) + manual (screen reader testing: NVDA/VoiceOver). CDK надає primitives, але архітектор відповідає за integration. 2) Focus management flow: dialog open → save previous focus → FocusTrap capture → dialog close → restore focus. CDK MatDialog handles цей flow — custom overlays потребують manual implementation. 3) `aria-live` regions architecture: application-wide announcer service замість localized announce calls — prevents multiple simultaneous announcements. 4) ListKeyManager для custom widget patterns: Tree (nested), Grid (two-dimensional), Tabs (CDK already provides). 5) роль aria-required: Material form fields встановлюють автоматично з `required` attr. Custom controls через `setDescribedByIds()`. 6) High contrast mode: CDK detectSystemColorScheme, Material підтримує Windows High Contrast via `@media (forced-colors: active)` — custom components потребують перевірки."
    commonMistakes:
      - "Не restore фокус після закриття overlay — screen reader втрачає контекст"
      - "LiveAnnouncer assertive для non-critical updates — перериває screen reader без причини"
      - "Не тестують з реальним screen reader — automated axe-core не ловить всі проблеми"
    relatedQuestions: ["b13t3q2", "b13t3q4"]
  - level: "senior"
    question: "Як CDK Virtual Scroll і Drag-Drop вирішують свої задачі під капотом? Які обмеження?"
    referenceAnswers:
      junior: "Virtual Scroll показує тільки видимі елементи замість всіх — швидше для великих списків. Drag-Drop дозволяє перетягувати елементи."
      mid: "Virtual Scroll: `CdkVirtualScrollViewport` з `itemSize` для fixed size items або `AutoSizeVirtualScrollStrategy` для variable. Рендерить тільки visible + buffer items, решта — placeholder div. DragDrop: `CdkDrag` на кожному item, `CdkDropList` на container. `cdkDropListDropped` event для oновлення array. `moveItemInArray()` або `transferArrayItem()` utilities."
      senior: "Virtual Scroll internals: 1) `CdkVirtualScrollViewport` відстежує scrollTop. `VirtualScrollStrategy` вираховує scrolledIndex і total content height. 2) Fixed size: `FixedSizeVirtualScrollStrategy` — O(1) розрахунок. Variable size: `AutoSizeVirtualScrollStrategy` — вимірює rendered items, оцінює решту. 3) Buffer: `minBufferPx` і `maxBufferPx` — скільки extra items рендерити за межами viewport. 4) Limitations: не можна просто замінити `*ngFor` — потрібно знати itemSize, або виміряти. Горизонтальний scroll потребує `orientation='horizontal'`. MatTable + virtual scroll — потребує custom DataSource + measurement. DragDrop: 1) CDK відстежує pointer events (touch і mouse). 2) `cdkDragStartDelay` для mobile. 3) `cdkDragHandle` для specific drag handle. 4) `cdkDropListSortingDisabled` для drop-only zones. 5) `cdkDragPreviewContainer` для custom preview."
      staff: "Virtual Scroll і Drag-Drop at scale: Virtual Scroll: 1) Dynamic content height: `AutoSizeVirtualScrollStrategy` або custom `VirtualScrollStrategy` що implements interface — для chat messages, variable card heights. 2) Restore scroll position: `scrolledIndexChange` + `scrollToIndex()`. 3) Grid virtual scroll: CDK не має built-in — потрібен custom implementation або `@angular/cdk-experimental/scrolling`. 4) Performance profiling: Chrome DevTools Layers panel — перевіряти GPU composite layers для scroll. Drag-Drop: 1) CDK Drag-Drop vs HTML5 native drag: CDK works on mobile (pointer events), native — ні. 2) Large sortable lists performance: `cdkDropListSortPredicate` для обмеження sort operations. 3) Cross-list drag: `cdkDropListConnectedTo` з multiple drop zones. 4) Animation: `@angular/animations` trigger на `CdkDropList` — smooth reorder animation. 5) Undo functionality: snapshot state before drag, restore on escape. 6) Accessibility: drag-and-drop не accessible для keyboard-only users — alternate keyboard reordering (move up/down buttons) обов'язково."
    commonMistakes:
      - "Virtual Scroll з variable item heights без custom VirtualScrollStrategy — неправильний scroll height"
      - "moveItemInArray мутує масив — потрібен immutable copy для OnPush components"
      - "Drag-Drop без keyboard alternative — порушення WCAG 2.1 SC 2.1.1"
    relatedQuestions: ["b13t3q3", "b13t3q5"]
  - level: "staff"
    question: "Як CDK Portals вирішують задачу teleporting DOM content і які architectural patterns вони дозволяють?"
    referenceAnswers:
      junior: "Portal дозволяє рендерити компонент або template в іншому місці DOM дерева."
      mid: "CDK Portals: `TemplatePortal` для ng-template, `ComponentPortal` для components. `CdkPortalOutlet` — місце куди portal рендерить. Або `PortalOutlet` programmatically. Приклад: render breadcrumbs компонента у header outlet з page-level component."
      senior: "Portals internals: 1) `Portal<T>` — abstract base: `TemplatePortal` і `ComponentPortal`. 2) `PortalOutlet` — destination: `CdkPortalOutlet` directive або programmatic `DomPortalOutlet`. 3) `attach(portal)` — переносить rendered content. `detach()` — видаляє. 4) `ComponentPortal` requires `ViewContainerRef` або `Injector` для injection context. 5) `DomPortalOutlet` — attach до arbitrary DOM element (поза Angular zone) — корисно для legacy app integration. 6) Content projection vs Portals: `ng-content` — static, compile-time. Portals — dynamic, runtime teleportation. 7) Use cases: breadcrumbs, page actions в toolbar (content projection не досягне), toast notifications, floating menus."
      staff: "Portal architectural patterns: 1) Named outlet registry: `PortalService` з Map<string, CdkPortalOutlet> — app-shell має named outlets (toolbar-actions, sidebar-content), lazy-loaded pages portal їх content. Replace `ng-content` що не може cross route boundaries. 2) Angular Material CDK Overlay uses DomPortalOutlet — overlay content renders в overlay-container div поза app root. Custom overlays наслідують цей pattern. 3) Storybook integration: PortalOutlet для injecting controls/actions панелі. 4) Micro-frontends: Portal дозволяє MFE component рендерити UI фрагменти в host application shell (toolbar buttons, notifications). 5) Testing: CdkPortalOutlet в test host template — перевіряти що portal content рендерується correctly. 6) Performance: ComponentPortal з lazy-loaded module — component instantiates only when portal attaches. 7) Cleanup: завжди `portal.detach()` і `outlet.dispose()` — інакше orphaned ViewRef memory leaks."
    commonMistakes:
      - "Використовують ng-content де потрібен Portal — ng-content не може cross component tree boundaries"
      - "ComponentPortal без Injector — втрачається DI контекст, inject() кидає помилку"
      - "Не dispose PortalOutlet — ViewRef memory leak, особливо з DomPortalOutlet"
    relatedQuestions: ["b13t3q2", "b13t3q4"]
---

## Core Concept

**English definition:** Angular CDK (Component Dev Kit) is a collection of behavior primitives — Overlay positioning, Focus management, Drag-and-Drop, Virtual Scrolling, Portals, and Table abstraction — that provide the foundational building blocks for UI components without imposing any visual design.

**Пояснення:** CDK — це "behavior без стилів". Якщо Angular Material = CDK + Material Design CSS, то CDK = лише behavior: правильне позиціонування overlay, управління фокусом для accessibility, рендеринг тільки видимих елементів у великих списках. CDK дозволяє будувати custom design systems з production-якісним behavior.

**Яку проблему вирішує:** Складний UI behavior — overlay позиціонування, keyboard navigation, virtual rendering, touch drag-and-drop — потребує сотні рядків коду і глибокого знання браузерних API. CDK вирішує ці задачі once, testing на всіх браузерах, і надає stable API.

**Як працює під капотом:**

CDK архітектура модульна — кожна функціональність у своєму пакеті:

- `@angular/cdk/overlay` — `OverlayRef` (wrapper над DOM), `PositionStrategy` (flexibleConnectedTo, global), `ScrollStrategy`
- `@angular/cdk/a11y` — `FocusTrap`, `FocusMonitor`, `LiveAnnouncer`, `ListKeyManager`, `ActiveDescendantKeyManager`
- `@angular/cdk/drag-drop` — `CdkDrag`, `CdkDropList`, pointer events abstraction
- `@angular/cdk/scrolling` — `CdkVirtualScrollViewport`, `VirtualScrollStrategy`, windowing algorithm
- `@angular/cdk/portal` — `Portal`, `PortalOutlet`, content teleportation
- `@angular/cdk/table` — `CdkTable`, headless data table, `DataSource<T>`

```typescript
// Overlay архітектура (спрощено)
// Overlay service creates single container div в document.body
// Кожен overlay — окремий OverlayRef (host div) в container
// PositionStrategy визначає style.left/top через getBoundingClientRect()
// ScrollStrategy підписується на scroll events для cleanup/reposition
```

**Trade-offs та обмеження:**

- CDK ширший API learning curve — необхідно розуміти PositionStrategy, ScrollStrategy тощо
- Overlay не має вбудованих анімацій — потрібно реалізувати самостійно
- Virtual Scroll з variable item heights вимагає custom `VirtualScrollStrategy`
- CDK Drag-Drop не підтримує automatic scrolling при drag до краю viewport (built-in в деяких інших libs)
- Portal і Overlay потребують cleanup — `dispose()`, `detach()` обов'язкові для prevent memory leaks

**Версійність:**
- CDK v7 (2018): початкова публічна версія як окремий пакет
- CDK v7+: Drag and Drop (`@angular/cdk/drag-drop`)
- CDK v8+: Virtual Scrolling stable
- CDK v10+: `FocusTrap` з inert attribute support
- CDK v14+: standalone directives для CDK modules
- CDK v15+: Listbox primitive (`CdkListbox`)
- CDK v17+: `@angular/cdk/a11y` з `FocusMonitor` signals-based observable

## Deep Details

### Edge Cases

- **Overlay і SSR:** `Overlay.create()` маніпулює DOM — потрібно `isPlatformBrowser()` guard або `afterNextRender()`. `CdkPortalOutlet` SSR-safe — рендерить як regular Angular component.
- **FocusTrap і Shadow DOM:** `FocusTrap` sentinel spans можуть не працювати правильно всередині Shadow DOM — перевіряти в `ViewEncapsulation.ShadowDom` context.
- **Virtual Scroll і dynamic content:** При зміні item data не змінюючи array reference — virtual scroll може не оновитись. Потрібен `checkViewportSize()` call або `trackBy`.
- **Drag-Drop і OnPush:** `cdkDropListDropped` event від `CdkDropList` виходить поза Angular zone в деяких scenarios — потрібно `NgZone.run()` або `markForCheck()`.
- **DomPortalOutlet і zone:** Portal renders поза Angular component tree якщо attach до raw DOM element — `ApplicationRef.attachView()` потрібен для correct CD.

### Junior vs Senior Understanding

**Junior** знає: що CDK існує, базовий `CdkDrag`/`CdkDropList`, Virtual Scroll template syntax.

**Senior** розуміє:

1. **Overlay PositionStrategy subtleties** — `FlexibleConnectedPositionStrategy` має `withPositions([])` array — Angular пробує кожну позицію в порядку поки не знайде що fits у viewport. `withFlexibleDimensions(true)` дозволяє overlay змінювати розмір замість flip.
2. **FocusMonitor origin** — `FocusOrigin` ('mouse' | 'keyboard' | 'touch' | 'program') визначається через timing heuristics: якщо mousedown передує focus за < 1ms — mouse origin. Корисно для "show focus ring only on keyboard" pattern.
3. **ListKeyManager для custom widgets** — клавіатурна навігація для custom listbox/menu без aria-activedescendant boilerplate. `withTypeAhead()` для jump-to-character.
4. **VirtualScrollStrategy interface** — `attach(viewport)`, `onContentScrolled()`, `onDataLengthChanged()`, `onContentRendered()` — custom strategy для non-standard layout (масонрі, горизонтальні картки).

### Deprecation & Migration Path

- **`FocusTrapFactory` (deprecated v14):** Замінено на `FocusTrap` з `ConfigurableFocusTrap` та `ConfigurableFocusTrapFactory`.
- **`CdkScrollable` (deprecated region-based API):** Для custom scrollable containers — використовуйте `ScrollDispatcher` і `CdkScrollable` directive.
- **Legacy `cdkDragLockAxis` string values:** `'x' | 'y'` залишилися але додали additional lock options.
- **Module-based CDK imports (v14+):** `DragDropModule` → `CdkDrag`, `CdkDropList` (standalone imports available).

### Connections to Other Concepts

- **Angular Material:** Material використовує CDK під капотом — MatDialog = CDK Overlay + FocusTrap + AnimationBuilder
- **Performance:** CdkVirtualScrollViewport прямо пов'язаний з Change Detection — правильний `trackBy` і `OnPush` критичні
- **Accessibility:** CDK a11y utilities = implementation фундамент WCAG compliance
- **Testing:** `CdkTestHarness` infrastructure — те ж що Material Testing Harnesses базується на

## Examples

### Basic Usage

```typescript
// custom-tooltip.directive.ts — простий overlay з CDK
import {
  Directive, ElementRef, HostListener, inject, OnDestroy
} from '@angular/core';
import {
  Overlay, OverlayRef, FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipContentComponent } from './tooltip-content.component';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
  inputs: [{ name: 'tooltipText', alias: 'appTooltip' }]
})
export class TooltipDirective implements OnDestroy {
  tooltipText = '';

  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef);
  private overlayRef: OverlayRef | null = null;

  @HostListener('mouseenter')
  show(): void {
    if (this.overlayRef?.hasAttached()) return;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        // Preferred: above
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
        // Fallback: below
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const portal = new ComponentPortal(TooltipContentComponent);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.setInput('text', this.tooltipText);
  }

  @HostListener('mouseleave')
  hide(): void {
    this.overlayRef?.detach();
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose(); // Critical: prevent memory leak
  }
}
```

```typescript
// virtual-scroll-list.component.ts — CDK Virtual Scroll
import { Component } from '@angular/core';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-virtual-list',
  standalone: true,
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="56" class="viewport">
      <div *cdkVirtualFor="let item of items; trackBy: trackById"
           class="list-item">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport { height: 400px; }
    .list-item { height: 56px; display: flex; align-items: center; }
  `]
})
export class VirtualListComponent {
  items = Array.from({ length: 100_000 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  trackById = (index: number, item: { id: number }) => item.id;
}
```

### Production Scenario

```typescript
// drag-drop-kanban.component.ts — реальний kanban board
import { Component, signal, inject } from '@angular/core';
import {
  CdkDragDrop, CdkDrag, CdkDropList,
  moveItemInArray, transferArrayItem, DragDropModule
} from '@angular/cdk/drag-drop';

interface Task {
  id: string;
  title: string;
  assignee: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [DragDropModule],
  template: `
    <div class="kanban-board">
      @for (column of columns(); track column.id) {
        <div class="column">
          <h3>{{ column.title }} ({{ column.tasks.length }})</h3>
          <div
            cdkDropList
            [id]="column.id"
            [cdkDropListData]="column.tasks"
            [cdkDropListConnectedTo]="getConnectedLists(column.id)"
            (cdkDropListDropped)="onDrop($event)"
            class="task-list">
            @for (task of column.tasks; track task.id) {
              <div cdkDrag [cdkDragData]="task" class="task-card">
                <div cdkDragHandle class="drag-handle">⠿</div>
                <span>{{ task.title }}</span>
                <!-- Custom drag preview -->
                <div *cdkDragPreview class="drag-preview">
                  {{ task.title }}
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class KanbanComponent {
  columns = signal<Column[]>([
    { id: 'todo', title: 'To Do', tasks: [
      { id: '1', title: 'Fix login bug', assignee: 'Alice' },
      { id: '2', title: 'Write tests', assignee: 'Bob' },
    ]},
    { id: 'in-progress', title: 'In Progress', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] },
  ]);

  getConnectedLists(currentId: string): string[] {
    return this.columns()
      .map(c => c.id)
      .filter(id => id !== currentId);
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      // Reorder within same column — immutable update
      const newTasks = [...event.container.data];
      moveItemInArray(newTasks, event.previousIndex, event.currentIndex);
      this.updateColumn(event.container.id, newTasks);
    } else {
      // Move between columns — immutable update
      const sourceTasks = [...event.previousContainer.data];
      const targetTasks = [...event.container.data];
      transferArrayItem(sourceTasks, targetTasks, event.previousIndex, event.currentIndex);
      this.updateColumn(event.previousContainer.id, sourceTasks);
      this.updateColumn(event.container.id, targetTasks);
    }
  }

  private updateColumn(id: string, tasks: Task[]): void {
    this.columns.update(cols =>
      cols.map(c => c.id === id ? { ...c, tasks } : c)
    );
  }
}
```

```typescript
// portal-outlet.service.ts — named portal outlets для app shell
import { Injectable, signal } from '@angular/core';
import { Portal } from '@angular/cdk/portal';

@Injectable({ providedIn: 'root' })
export class PortalOutletService {
  // Page components portal content до toolbar і sidebar
  readonly toolbarActions = signal<Portal<unknown> | null>(null);
  readonly sidebarContent = signal<Portal<unknown> | null>(null);

  setToolbarActions(portal: Portal<unknown>): void {
    this.toolbarActions.set(portal);
  }

  clearToolbarActions(): void {
    this.toolbarActions.set(null);
  }
}
```

```html
<!-- app-shell.component.html — named outlets -->
<mat-toolbar>
  <span>My App</span>
  <!-- Lazy-loaded pages portal їх toolbar buttons сюди -->
  <ng-template [cdkPortalOutlet]="portalService.toolbarActions()"></ng-template>
</mat-toolbar>

<router-outlet></router-outlet>
```

```typescript
// product-list.component.ts — portals toolbar actions
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef, ViewChild, TemplateRef } from '@angular/core';
import { PortalOutletService } from '../portal-outlet.service';

@Component({
  template: `
    <!-- Toolbar actions template (буде в toolbar через portal) -->
    <ng-template #toolbarActions>
      <button mat-button (click)="addProduct()">
        <mat-icon>add</mat-icon> Add Product
      </button>
      <button mat-icon-button (click)="exportCsv()">
        <mat-icon>download</mat-icon>
      </button>
    </ng-template>

    <!-- Page content -->
    <app-product-table [products]="products" />
  `
})
export class ProductListComponent implements OnInit, OnDestroy {
  @ViewChild('toolbarActions') toolbarActionsTemplate!: TemplateRef<void>;

  private readonly vcr = inject(ViewContainerRef);
  private readonly portalService = inject(PortalOutletService);

  products = signal([...]);

  ngOnInit(): void {
    // Портал toolbar дій у shell
    const portal = new TemplatePortal(this.toolbarActionsTemplate, this.vcr);
    this.portalService.setToolbarActions(portal);
  }

  ngOnDestroy(): void {
    this.portalService.clearToolbarActions();
  }
}
```

### Anti-Example

```typescript
// WRONG: Ручний overlay без CDK
@Component({...})
export class BadTooltipComponent {
  private tooltipEl: HTMLElement | null = null;

  showTooltip(event: MouseEvent, text: string): void {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.textContent = text;
    this.tooltipEl.style.cssText = `
      position: fixed;
      top: ${event.clientY - 40}px;  // Захардкоджено! Виходить за межі viewport
      left: ${event.clientX}px;
      z-index: 9999;  // Magic number, конфліктує з Material overlays
      background: black; color: white;
    `;
    document.body.appendChild(this.tooltipEl); // Memory leak якщо не видалити!
  }

  hideTooltip(): void {
    this.tooltipEl?.remove();
    // Але якщо компонент зруйнується без hideTooltip — orphaned DOM!
  }
}

// CORRECT: CDK Overlay з proper position strategy і cleanup
// (дивись TooltipDirective вище)

// WRONG: Мутація масиву в DragDrop handler
onDrop(event: CdkDragDrop<Task[]>): void {
  // Прямо мутуємо масив — OnPush компонент не оновиться!
  moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  // tasks array reference не змінився — no change detection!
}

// CORRECT: Immutable update
onDrop(event: CdkDragDrop<Task[]>): void {
  const newTasks = [...event.container.data];
  moveItemInArray(newTasks, event.previousIndex, event.currentIndex);
  this.tasks.set(newTasks); // New reference = CD triggered
}
```

## Code Smells and Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|---|---|---|
| Ручний overlay через DOM manipulation | Немає viewport bounds checking, z-index conflicts, memory leaks при не-cleanup | CDK Overlay з `FlexibleConnectedPositionStrategy` і `dispose()` в ngOnDestroy |
| Virtual Scroll без `trackBy` | Angular re-creates всі DOM nodes при будь-якій зміні data array | Завжди `trackBy: trackById` в `*cdkVirtualFor` |
| Drag-Drop з прямою мутацією масиву | OnPush components не детектять зміни без нової reference | Immutable update: `[...array]`, потім `moveItemInArray` на копії |
| FocusTrap без restore focus | Screen reader втрачає контекст після закриття overlay — WCAG 2.4.3 violation | Зберегти `document.activeElement` перед overlay, restore в `afterClosed` |
| ComponentPortal без Injector | Inject() calls у portal component кидають error — немає DI context | `new ComponentPortal(Comp, viewContainerRef)` або explicit Injector |

## Interview Block

### [L1 — Warm-up] Що таке Angular CDK і навіщо його використовувати окремо від Angular Material?
**Signal being tested:** Розуміння що CDK — це behavior primitive, не просто "частина Material".
**What the interviewer expects:** Пояснення separation of concerns: behavior (CDK) vs styling (Material). Конкретні use cases для CDK без Material.
**How to probe deeper:** "Яку конкретну задачу ви б вирішили через CDK а не Material?"
**Reference answer:** CDK надає behavior primitives без visual design: Overlay (popup positioning), FocusTrap (modal focus management), Drag-Drop, Virtual Scroll, Portals. Використовується без Material коли: 1) Власна design system (Tailwind + CDK). 2) Потрібний custom tooltip/popover з FlexibleConnectedPositionStrategy. 3) Long list performance через CdkVirtualScrollViewport. 4) Sortable kanban через CdkDragDrop. Material = CDK + Material Design CSS.
**Common mistakes:** Думають CDK можна використовувати тільки з Material. Не знають конкретних CDK модулів.

### [L2 — Mid] Як CDK Overlay позиціонує floating elements і що відбувається коли overlay виходить за межі viewport?
**Signal being tested:** Розуміння PositionStrategy, fallback positions, і scroll behavior — не тільки "як викликати API".
**What the interviewer expects:** FlexibleConnectedPositionStrategy, withPositions array з fallbacks, ScrollStrategies, viewport bounds checking.
**How to probe deeper:** "Яку ScrollStrategy обрати для dropdown що відкривається в scrollable container?"
**Reference answer:** `FlexibleConnectedPositionStrategy` пробує positions array в порядку — перша що fits у viewport wins. `withPositions([above, below, left, right])` — fallback chain. При всіх fail — використовує першу і trim до viewport. ScrollStrategies: `close` (dismiss при scroll), `reposition` (перераховує position), `block` (блокує scroll), `noop`. Для dropdown — `reposition` аби overlay слідував за trigger при scroll.
**Common mistakes:** Один preferred position без fallbacks — overlay виходить за viewport. ScrollStrategy noop — overlay "відлітає" від trigger при scroll.

### [L3 — Senior] Як CDK accessibility utilities (FocusTrap, FocusMonitor, ListKeyManager) реалізують WCAG-compliant keyboard navigation?
**Signal being tested:** Глибоке розуміння a11y implementation — не тільки що є в API, але як це maps до WCAG requirements.
**What the interviewer expects:** FocusTrap механізм (sentinels), FocusOrigin для mouse/keyboard distinction, ListKeyManager для ARIA patterns.
**How to probe deeper:** "Як ви реалізуєте accessible custom dropdown (комbobox) з CDK?"
**Reference answer:** FocusTrap: два sentinel span елементи на краях container — при Tab до sentinel CDK redirects до першого/останнього focusable element. FocusMonitor: визначає origin через timing (mousedown → focus = mouse), emits FocusOrigin. Дозволяє `cdk-keyboard-focused` клас — показувати focus ring тільки для keyboard. ListKeyManager: Arrow keys, Home/End, typeahead для custom listbox/menu. `withWrap(true)` для circular navigation. Combobox pattern: ListKeyManager на options + `aria-activedescendant` на input.
**Common mistakes:** Не restore фокус після закриття overlay. Не тестують з реальним screen reader.

### [L4 — Staff/Principal] Як би ви спроєктували CDK-based component library для enterprise design system що підтримує кілька UI frameworks (Angular, React)?
**Signal being tested:** Архітектурне мислення про cross-framework design system, CDK як foundation vs full Material.
**What the interviewer expects:** CDK headless components strategy, Web Components integration, token-based design system, testing strategy.
**How to probe deeper:** "Як би ви забезпечили accessibility consistency між Angular і React реалізаціями одного компонента?"
**Reference answer:** CDK-based design system архітектура: 1) Core logic у @org/ui-core — headless TypeScript (не Angular) з behavior primitives: state machines (XState або custom), keyboard navigation algorithms. Shared між frameworks. 2) Angular layer: CDK Overlay + FocusTrap + framework-specific wrappers. 3) Web Components option: Angular Elements або Lit для framework-agnostic distribution — але DI і CD integration складні. 4) Design tokens: Style Dictionary → CSS custom properties (framework agnostic) + Tailwind theme + Angular Material theme. Single source of truth. 5) Accessibility tests: shared axe-core test suite run проти Angular і React implementations. ARIA patterns spec defines expected DOM structure. 6) Storybook Interaction Tests для behavior consistency.
**Common mistakes:** Rebuild behavior primitives per framework замість shared core. Різні accessibility implementations між Angular і React versions.

## Summary

### Key Points
- CDK — behavior primitives без styling: Overlay, a11y, Drag-Drop, Virtual Scroll, Portal, CdkTable
- `FlexibleConnectedPositionStrategy` автоматично flip між fallback positions при viewport overflow — завжди задавайте масив positions
- FocusTrap і FocusMonitor реалізують WCAG-compliant focus management — обов'язкові для modal-like overlays
- `CdkVirtualScrollViewport` рендерить тільки visible items — критично для списків 1000+ елементів
- Drag-Drop mutation pattern: завжди immutable copy масиву перед `moveItemInArray` — OnPush requires new reference
- CDK Portal teleports rendered content між DOM locations — вирішує cross-route content projection
- Завжди cleanup: `OverlayRef.dispose()`, `PortalOutlet.dispose()`, FocusTrap cleanup — CDK не self-cleanup

### Elevator Pitch (2 minutes)
"Angular CDK — це behavior layer поверх якого будується Angular Material і custom design systems. Ключові примітиви: Overlay для floating elements з FlexibleConnectedPositionStrategy (автоматичні viewport fallbacks), a11y utilities (FocusTrap для modals, FocusMonitor для keyboard vs mouse navigation, ListKeyManager для ARIA listbox patterns), Virtual Scroll для рендерингу тільки visible items у великих списках, Drag-Drop з pointer events abstraction (працює на mobile), і Portal для cross-component DOM teleportation. CDK без Material — оптимальний вибір для custom design systems де потрібен production-якісний behavior без Material visual opinionating."
