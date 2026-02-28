# Angular Learning Portal — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a self-contained Angular 21 learning portal with premium dark-theme UI for studying Angular topics, self-assessment quizzes, and conducting technical interviews.

**Architecture:** Static-First SPA — markdown content files with YAML frontmatter are processed by a build script into JSON assets. Angular app loads JSON for instant navigation and search. Progress and interview sessions stored in localStorage. No backend, no auth.

**Tech Stack:** Angular 21, Angular Material, Tailwind CSS, marked + highlight.js (build-time), lunr.js (client-side search), localStorage.

**Design Doc:** `docs/plans/2026-02-28-angular-learning-portal-design.md`

---

## Phase 1: Project Scaffolding & Configuration

### Task 1.1: Create Angular 21 Project

**Files:**
- Create: New Angular project in current directory

**Step 1: Remove placeholder files**

```bash
rm index.js package.json
```

**Step 2: Scaffold Angular project**

```bash
ng new learn-angular --directory . --style scss --routing --ssr false --skip-git
```

Note: `--skip-git` because we already have a git repo.

**Step 3: Verify it works**

Run: `ng serve`
Expected: App running at localhost:4200 with default Angular welcome page.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold Angular 21 project"
```

---

### Task 1.2: Add Angular Material

**Files:**
- Modify: `angular.json` (schematic will update)
- Modify: `src/styles.scss`

**Step 1: Add Angular Material**

```bash
ng add @angular/material --theme custom --animations included --typography true
```

**Step 2: Verify Material works**

Add a `<button mat-raised-button>Test</button>` to `app.component.html`, check it renders with Material styles.

**Step 3: Remove test button**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Angular Material with custom theme"
```

---

### Task 1.3: Add Tailwind CSS

**Files:**
- Create: `tailwind.config.js` (or auto-generated)
- Modify: `src/styles.scss`

**Step 1: Install Tailwind**

```bash
npm install -D tailwindcss @tailwindcss/typography
npx tailwindcss init
```

**Step 2: Configure Tailwind**

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1e1e2e',
          light: '#2a2a3e',
          lighter: '#363650',
        },
        accent: {
          DEFAULT: '#a29bfe',
          light: '#b8b3ff',
        },
        cyan: {
          DEFAULT: '#56cfe1',
          light: '#72d8e8',
        },
        success: '#00b894',
        warning: '#fdcb6e',
        danger: '#e17055',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
```

**Step 3: Add Tailwind to styles.scss**

At the top of `src/styles.scss`:
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Verify Tailwind works**

Add `<p class="text-cyan">Tailwind works</p>` to app.component.html, check cyan color renders.

**Step 5: Remove test element and commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS with dark theme colors"
```

---

### Task 1.4: Configure Custom Material Theme (Dark)

**Files:**
- Modify: `src/styles.scss`
- Create: `src/styles/_theme.scss`

**Step 1: Create custom Material theme**

`src/styles/_theme.scss`:
```scss
@use '@angular/material' as mat;

$dark-theme: mat.define-theme((
  color: (
    theme-type: dark,
    primary: mat.$violet-palette,
    tertiary: mat.$cyan-palette,
  ),
  typography: (
    brand-family: 'Inter, system-ui, sans-serif',
    plain-family: 'Inter, system-ui, sans-serif',
  ),
));

html {
  @include mat.all-component-themes($dark-theme);
  @include mat.typography-hierarchy($dark-theme);
}

body {
  margin: 0;
  background-color: #1e1e2e;
  color: #e0e0e0;
  font-family: 'Inter', system-ui, sans-serif;
}
```

**Step 2: Import theme in styles.scss**

```scss
@use './styles/theme';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 3: Add Inter font**

Add to `src/index.html` `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Step 4: Verify dark theme renders correctly**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: configure dark Material theme with Inter font"
```

---

## Phase 2: TypeScript Models & Core Services

### Task 2.1: Define TypeScript Interfaces

**Files:**
- Create: `src/app/shared/models/content.model.ts`
- Create: `src/app/shared/models/interview.model.ts`
- Create: `src/app/shared/models/progress.model.ts`

**Step 1: Create content models**

`src/app/shared/models/content.model.ts`:
```typescript
export interface ContentBlock {
  id: number;
  slug: string;
  title: string;
  description: string;
  topicCount: number;
  topics: TopicMeta[];
}

export interface TopicMeta {
  id: string;          // "b1t1"
  block: number;
  topic: number;
  slug: string;
  title: string;
  tags: string[];
  relatedTopics: string[];   // slugs
  questionCount: number;
}

export interface TopicContent extends TopicMeta {
  htmlContent: string;       // rendered markdown
  sections: TopicSection[];
}

export interface TopicSection {
  id: string;
  title: string;
  htmlContent: string;
}

export interface InterviewQuestion {
  id: string;           // "b1t1q1"
  block: number;
  blockTitle: string;
  topic: number;
  topicTitle: string;
  topicSlug: string;
  level: QuestionLevel;
  question: string;
  referenceAnswers: Record<QuestionLevel, string>;
  commonMistakes: string[];
  relatedQuestions: string[];
  tags: string[];
}

export type QuestionLevel = 'junior' | 'mid' | 'senior' | 'staff';

export interface ContentIndex {
  blocks: ContentBlock[];
  totalTopics: number;
  totalQuestions: number;
}
```

**Step 2: Create interview models**

`src/app/shared/models/interview.model.ts`:
```typescript
import { QuestionLevel } from './content.model';

export interface CandidateProfile {
  name: string;
  role: string;
  yearsOfExperience: number;
  angularVersions: string[];
  mainResponsibilities: string;
  techStack: string[];
  proudestWork: string;
  wantsToImprove: string;
}

export interface InterviewSession {
  id: string;
  createdAt: string;          // ISO date
  candidate: CandidateProfile;
  answers: InterviewAnswer[];
  customQuestions: CustomQuestion[];
  status: 'active' | 'completed';
}

export interface InterviewAnswer {
  questionId: string;
  candidateLevel: QuestionLevel;
  quality: AnswerQuality;
  notes: string;
  askedAt: string;            // ISO date
}

export type AnswerQuality = 'strong' | 'partial' | 'weak';

export interface CustomQuestion {
  id: string;                 // "custom-{uuid}"
  question: string;
  block: number | null;
  topicTitle: string;
  candidateLevel: QuestionLevel;
  quality: AnswerQuality;
  notes: string;
  savedForFuture: boolean;
}
```

**Step 3: Create progress models**

`src/app/shared/models/progress.model.ts`:
```typescript
export interface TopicProgress {
  topicId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: string;
  lastVisitedAt?: string;
}

export interface QuizAttempt {
  questionId: string;
  result: 'knew-it' | 'partial' | 'didnt-know';
  attemptedAt: string;
  nextReviewAt?: string;     // spaced repetition
}

export interface UserProgress {
  topics: Record<string, TopicProgress>;
  quizAttempts: QuizAttempt[];
  lastActivity: string;
}
```

**Step 4: Create barrel export**

`src/app/shared/models/index.ts`:
```typescript
export * from './content.model';
export * from './interview.model';
export * from './progress.model';
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: define TypeScript interfaces for content, interview, and progress"
```

---

### Task 2.2: Build Content Service

**Files:**
- Create: `src/app/shared/services/content.service.ts`

**Step 1: Create ContentService**

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ContentIndex, ContentBlock, TopicContent, InterviewQuestion } from '../models';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);

  private _index = signal<ContentIndex | null>(null);
  private _questions = signal<InterviewQuestion[]>([]);
  private _topicCache = new Map<string, TopicContent>();

  readonly index = this._index.asReadonly();
  readonly blocks = computed(() => this._index()?.blocks ?? []);
  readonly questions = this._questions.asReadonly();
  readonly totalTopics = computed(() => this._index()?.totalTopics ?? 0);
  readonly totalQuestions = computed(() => this._index()?.totalQuestions ?? 0);

  async loadIndex(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<ContentIndex>('assets/content-index.json')
    );
    this._index.set(data);
  }

  async loadQuestions(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<InterviewQuestion[]>('assets/interview-questions.json')
    );
    this._questions.set(data);
  }

  async loadTopic(blockSlug: string, topicSlug: string): Promise<TopicContent> {
    const cacheKey = `${blockSlug}/${topicSlug}`;
    if (this._topicCache.has(cacheKey)) {
      return this._topicCache.get(cacheKey)!;
    }
    const data = await firstValueFrom(
      this.http.get<TopicContent>(`assets/content/${blockSlug}/${topicSlug}.json`)
    );
    this._topicCache.set(cacheKey, data);
    return data;
  }

  getBlock(blockId: number): ContentBlock | undefined {
    return this.blocks().find(b => b.id === blockId);
  }

  getQuestionsByBlock(blockId: number): InterviewQuestion[] {
    return this.questions().filter(q => q.block === blockId);
  }

  getQuestionsByLevel(level: string): InterviewQuestion[] {
    return this.questions().filter(q => q.level === level);
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ContentService with signals-based state"
```

---

### Task 2.3: Build Progress Service

**Files:**
- Create: `src/app/shared/services/progress.service.ts`

**Step 1: Create ProgressService**

```typescript
import { Injectable, signal, computed, effect } from '@angular/core';
import { UserProgress, TopicProgress, QuizAttempt } from '../models';

const STORAGE_KEY = 'angular-portal-progress';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private _progress = signal<UserProgress>(this.loadFromStorage());

  readonly progress = this._progress.asReadonly();

  readonly completedTopics = computed(() =>
    Object.values(this._progress().topics).filter(t => t.status === 'completed').length
  );

  readonly inProgressTopics = computed(() =>
    Object.values(this._progress().topics).filter(t => t.status === 'in-progress').length
  );

  readonly completionPercentage = computed(() => {
    const total = 75; // total subtopics
    return Math.round((this.completedTopics() / total) * 100);
  });

  readonly weakQuestions = computed(() =>
    this._progress().quizAttempts
      .filter(a => a.result === 'didnt-know')
      .filter(a => !a.nextReviewAt || new Date(a.nextReviewAt) <= new Date())
  );

  constructor() {
    effect(() => {
      this.saveToStorage(this._progress());
    });
  }

  markTopicStatus(topicId: string, status: TopicProgress['status']): void {
    this._progress.update(p => ({
      ...p,
      lastActivity: new Date().toISOString(),
      topics: {
        ...p.topics,
        [topicId]: {
          topicId,
          status,
          ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
          lastVisitedAt: new Date().toISOString(),
        },
      },
    }));
  }

  recordQuizAttempt(attempt: QuizAttempt): void {
    const nextReview = this.calculateNextReview(attempt);
    this._progress.update(p => ({
      ...p,
      lastActivity: new Date().toISOString(),
      quizAttempts: [...p.quizAttempts, { ...attempt, nextReviewAt: nextReview }],
    }));
  }

  getTopicProgress(topicId: string): TopicProgress | undefined {
    return this._progress().topics[topicId];
  }

  getBlockCompletion(blockId: number): { completed: number; total: number } {
    const topics = Object.values(this._progress().topics)
      .filter(t => t.topicId.startsWith(`b${blockId}t`));
    return {
      completed: topics.filter(t => t.status === 'completed').length,
      total: topics.length,
    };
  }

  private calculateNextReview(attempt: QuizAttempt): string | undefined {
    if (attempt.result === 'knew-it') return undefined;
    const days = attempt.result === 'partial' ? 3 : 1;
    const next = new Date();
    next.setDate(next.getDate() + days);
    return next.toISOString();
  }

  private loadFromStorage(): UserProgress {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return { topics: {}, quizAttempts: [], lastActivity: new Date().toISOString() };
  }

  private saveToStorage(progress: UserProgress): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ProgressService with localStorage persistence"
```

---

### Task 2.4: Build Search Service

**Files:**
- Create: `src/app/shared/services/search.service.ts`

**Step 1: Install lunr**

```bash
npm install lunr
npm install -D @types/lunr
```

**Step 2: Create SearchService**

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import lunr from 'lunr';
import { TopicMeta } from '../models';

export interface SearchResult {
  topicId: string;
  topicSlug: string;
  blockSlug: string;
  title: string;
  blockTitle: string;
  score: number;
  matchedTerms: string[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private idx: lunr.Index | null = null;
  private topicMap = new Map<string, { topic: TopicMeta; blockSlug: string; blockTitle: string }>();

  readonly isLoaded = signal(false);

  async loadIndex(): Promise<void> {
    const serialized = await firstValueFrom(
      this.http.get<object>('assets/search-index.json')
    );
    this.idx = lunr.Index.load(serialized);

    const index = await firstValueFrom(
      this.http.get<any>('assets/content-index.json')
    );
    for (const block of index.blocks) {
      for (const topic of block.topics) {
        this.topicMap.set(topic.id, {
          topic,
          blockSlug: block.slug,
          blockTitle: block.title,
        });
      }
    }
    this.isLoaded.set(true);
  }

  search(query: string): SearchResult[] {
    if (!this.idx || !query.trim()) return [];

    return this.idx.search(query).map(result => {
      const entry = this.topicMap.get(result.ref);
      return {
        topicId: result.ref,
        topicSlug: entry?.topic.slug ?? '',
        blockSlug: entry?.blockSlug ?? '',
        title: entry?.topic.title ?? '',
        blockTitle: entry?.blockTitle ?? '',
        score: result.score,
        matchedTerms: Object.keys(result.matchData.metadata),
      };
    });
  }
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add SearchService with lunr.js full-text search"
```

---

### Task 2.5: Build Interview Service

**Files:**
- Create: `src/app/shared/services/interview.service.ts`

**Step 1: Create InterviewService**

```typescript
import { Injectable, signal, computed, effect } from '@angular/core';
import {
  InterviewSession, InterviewAnswer, CandidateProfile,
  CustomQuestion, AnswerQuality
} from '../models/interview.model';
import { InterviewQuestion, QuestionLevel } from '../models/content.model';

const STORAGE_KEY = 'angular-portal-interviews';
const CUSTOM_QUESTIONS_KEY = 'angular-portal-custom-questions';

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private _sessions = signal<InterviewSession[]>(this.loadSessions());
  private _activeSession = signal<InterviewSession | null>(null);
  private _savedCustomQuestions = signal<CustomQuestion[]>(this.loadCustomQuestions());

  readonly sessions = this._sessions.asReadonly();
  readonly activeSession = this._activeSession.asReadonly();
  readonly savedCustomQuestions = this._savedCustomQuestions.asReadonly();

  readonly activeAnswers = computed(() => this._activeSession()?.answers ?? []);
  readonly askedQuestionIds = computed(() =>
    new Set(this.activeAnswers().map(a => a.questionId))
  );

  constructor() {
    effect(() => {
      this.saveSessions(this._sessions());
    });
    effect(() => {
      this.saveCustomQuestions(this._savedCustomQuestions());
    });
  }

  startSession(candidate: CandidateProfile): InterviewSession {
    const session: InterviewSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      candidate,
      answers: [],
      customQuestions: [],
      status: 'active',
    };
    this._sessions.update(s => [...s, session]);
    this._activeSession.set(session);
    return session;
  }

  gradeQuestion(
    questionId: string,
    candidateLevel: QuestionLevel,
    quality: AnswerQuality,
    notes: string
  ): void {
    const answer: InterviewAnswer = {
      questionId,
      candidateLevel,
      quality,
      notes,
      askedAt: new Date().toISOString(),
    };
    this._activeSession.update(s => s ? {
      ...s,
      answers: [...s.answers.filter(a => a.questionId !== questionId), answer],
    } : s);
    this.syncActiveToSessions();
  }

  addCustomQuestion(question: CustomQuestion): void {
    this._activeSession.update(s => s ? {
      ...s,
      customQuestions: [...s.customQuestions, question],
    } : s);
    if (question.savedForFuture) {
      this._savedCustomQuestions.update(qs => [...qs, question]);
    }
    this.syncActiveToSessions();
  }

  completeSession(): void {
    this._activeSession.update(s => s ? { ...s, status: 'completed' } : s);
    this.syncActiveToSessions();
    this._activeSession.set(null);
  }

  loadSession(id: string): InterviewSession | undefined {
    const session = this._sessions().find(s => s.id === id);
    if (session) this._activeSession.set(session);
    return session;
  }

  deleteSession(id: string): void {
    this._sessions.update(s => s.filter(sess => sess.id !== id));
  }

  generateAIPrompt(session: InterviewSession, questions: InterviewQuestion[]): string {
    const c = session.candidate;
    const questionMap = new Map(questions.map(q => [q.id, q]));

    let prompt = `You are a senior Angular technical interviewer. Analyze this candidate's interview performance.\n\n`;
    prompt += `## Candidate Profile\n`;
    prompt += `- Name: ${c.name}, ${c.role}, ${c.yearsOfExperience} years experience\n`;
    prompt += `- Angular versions: ${c.angularVersions.join(', ')}\n`;
    prompt += `- Main responsibilities: ${c.mainResponsibilities}\n`;
    prompt += `- Tech stack: ${c.techStack.join(', ')}\n`;
    prompt += `- Proudest work: ${c.proudestWork}\n`;
    prompt += `- Wants to improve: ${c.wantsToImprove}\n\n`;

    prompt += `## Interview Results\n\n`;

    const grouped = new Map<string, InterviewAnswer[]>();
    for (const answer of session.answers) {
      const q = questionMap.get(answer.questionId);
      const key = q ? `Block ${q.block}: ${q.blockTitle}` : 'Unknown';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(answer);
    }

    for (const [group, answers] of grouped) {
      prompt += `### ${group}\n`;
      for (const answer of answers) {
        const q = questionMap.get(answer.questionId);
        if (q) {
          prompt += `- [${q.level}] "${q.question}" — Answered at: ${answer.candidateLevel} level, Grade: ${answer.quality}\n`;
          if (answer.notes) prompt += `  Notes: ${answer.notes}\n`;
        }
      }
      prompt += '\n';
    }

    if (session.customQuestions.length > 0) {
      prompt += `### Custom Questions\n`;
      for (const cq of session.customQuestions) {
        prompt += `- "${cq.question}" (${cq.topicTitle || 'Unclassified'}) — Answered at: ${cq.candidateLevel} level, Grade: ${cq.quality}\n`;
        if (cq.notes) prompt += `  Notes: ${cq.notes}\n`;
      }
      prompt += '\n';
    }

    prompt += `## Please Provide:\n`;
    prompt += `1. Overall assessment (2-3 sentences)\n`;
    prompt += `2. Suggested level: Junior / Mid / Senior / Staff (with justification)\n`;
    prompt += `3. Strong areas (with evidence from specific answers)\n`;
    prompt += `4. Areas to improve (specific gaps identified)\n`;
    prompt += `5. Recommended study materials and topics\n`;
    prompt += `6. Follow-up questions to probe weak areas deeper\n`;
    prompt += `7. Comparison: how does their self-assessment align with actual performance?\n`;

    return prompt;
  }

  getRelatedQuestionIds(questionId: string, allQuestions: InterviewQuestion[]): Set<string> {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return new Set();
    return new Set(question.relatedQuestions);
  }

  getUncoveredBlocks(allQuestions: InterviewQuestion[]): Set<number> {
    const askedBlockIds = new Set<number>();
    const questionMap = new Map(allQuestions.map(q => [q.id, q]));
    for (const answer of this.activeAnswers()) {
      const q = questionMap.get(answer.questionId);
      if (q) askedBlockIds.add(q.block);
    }
    const allBlockIds = new Set(allQuestions.map(q => q.block));
    return new Set([...allBlockIds].filter(id => !askedBlockIds.has(id)));
  }

  private syncActiveToSessions(): void {
    const active = this._activeSession();
    if (!active) return;
    this._sessions.update(sessions =>
      sessions.map(s => s.id === active.id ? active : s)
    );
  }

  private loadSessions(): InterviewSession[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveSessions(sessions: InterviewSession[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  private loadCustomQuestions(): CustomQuestion[] {
    const stored = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveCustomQuestions(questions: CustomQuestion[]): void {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add InterviewService with session management and AI prompt generator"
```

---

### Task 2.6: Build Theme Service

**Files:**
- Create: `src/app/shared/services/theme.service.ts`

**Step 1: Create ThemeService**

```typescript
import { Injectable, signal, effect } from '@angular/core';

type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<Theme>(this.loadTheme());
  readonly theme = this._theme.asReadonly();
  readonly isDark = () => this._theme() === 'dark';

  constructor() {
    effect(() => {
      const theme = this._theme();
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('angular-portal-theme', theme);
    });
  }

  toggle(): void {
    this._theme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  private loadTheme(): Theme {
    return (localStorage.getItem('angular-portal-theme') as Theme) ?? 'dark';
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ThemeService with dark/light toggle"
```

---

## Phase 3: App Layout (Shell, Sidenav, Toolbar)

### Task 3.1: Create Shell Layout Component

**Files:**
- Create: `src/app/layout/shell/shell.component.ts`
- Create: `src/app/layout/shell/shell.component.html`
- Create: `src/app/layout/shell/shell.component.scss`
- Modify: `src/app/app.component.ts` — use shell as root layout
- Modify: `src/app/app.routes.ts` — setup route structure

**Step 1: Generate shell component**

```bash
ng generate component layout/shell --standalone
```

**Step 2: Implement shell with Material sidenav**

`shell.component.html`:
```html
<mat-sidenav-container class="h-screen">
  <mat-sidenav
    #sidenav
    mode="side"
    [opened]="sidenavOpen()"
    class="w-72 bg-surface border-r border-surface-lighter">
    <app-sidenav (navigated)="onMobileNavigate(sidenav)" />
  </mat-sidenav>

  <mat-sidenav-content class="flex flex-col bg-surface">
    <app-toolbar
      (toggleSidenav)="toggleSidenav()"
      [sidenavOpen]="sidenavOpen()" />
    <main class="flex-1 overflow-auto p-6">
      <router-outlet />
    </main>
  </mat-sidenav-content>
</mat-sidenav-container>
```

`shell.component.ts`:
```typescript
import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, SidenavComponent, ToolbarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  sidenavOpen = signal(true);

  toggleSidenav(): void {
    this.sidenavOpen.update(v => !v);
  }

  onMobileNavigate(sidenav: MatSidenav): void {
    if (window.innerWidth < 768) {
      sidenav.close();
    }
  }
}
```

**Step 3: Wire up app.component to use shell**

`app.component.ts`:
```typescript
import { Component } from '@angular/core';
import { ShellComponent } from './layout/shell/shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  template: '<app-shell />',
})
export class AppComponent {}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add shell layout with Material sidenav"
```

---

### Task 3.2: Create Sidenav Component

**Files:**
- Create: `src/app/layout/sidenav/sidenav.component.ts`
- Create: `src/app/layout/sidenav/sidenav.component.html`
- Create: `src/app/layout/sidenav/sidenav.component.scss`

**Step 1: Generate component**

```bash
ng generate component layout/sidenav --standalone
```

**Step 2: Implement sidenav with block navigation + progress indicators**

`sidenav.component.html`:
```html
<div class="flex flex-col h-full">
  <!-- Logo/Brand -->
  <div class="p-4 border-b border-surface-lighter">
    <h1 class="text-lg font-bold text-accent">
      <mat-icon class="mr-2 align-middle">school</mat-icon>
      Angular Academy
    </h1>
    <div class="mt-2 text-sm text-gray-400">
      {{ completedTopics() }}/{{ totalTopics() }} topics
    </div>
    <mat-progress-bar
      mode="determinate"
      [value]="completionPercentage()"
      class="mt-1" />
  </div>

  <!-- Quick Links -->
  <nav class="p-2 border-b border-surface-lighter">
    <a mat-button routerLink="/" routerLinkActive="text-accent"
       [routerLinkActiveOptions]="{exact: true}" class="w-full justify-start">
      <mat-icon>dashboard</mat-icon> Dashboard
    </a>
    <a mat-button routerLink="/interview" routerLinkActive="text-accent"
       class="w-full justify-start">
      <mat-icon>quiz</mat-icon> Self-Study
    </a>
    <a mat-button routerLink="/conduct" routerLinkActive="text-accent"
       class="w-full justify-start">
      <mat-icon>assignment</mat-icon> Conduct Interview
    </a>
    <a mat-button routerLink="/cheatsheets" routerLinkActive="text-accent"
       class="w-full justify-start">
      <mat-icon>description</mat-icon> Cheatsheets
    </a>
  </nav>

  <!-- Block List -->
  <div class="flex-1 overflow-auto p-2">
    <h3 class="text-xs uppercase text-gray-500 px-2 py-1 font-semibold">Curriculum</h3>
    @for (block of blocks(); track block.id) {
      <mat-expansion-panel class="bg-transparent shadow-none">
        <mat-expansion-panel-header>
          <div class="flex items-center gap-2 w-full">
            <span class="text-sm font-medium">{{ block.title }}</span>
            <span class="ml-auto text-xs text-gray-500">
              {{ getBlockCompletion(block.id) }}/{{ block.topicCount }}
            </span>
          </div>
        </mat-expansion-panel-header>
        @for (topic of block.topics; track topic.id) {
          <a
            mat-button
            [routerLink]="['/blocks', block.slug, topic.slug]"
            routerLinkActive="text-cyan"
            class="w-full justify-start text-sm pl-6"
            (click)="navigated.emit()">
            <mat-icon class="text-base mr-1">
              {{ getTopicIcon(topic.id) }}
            </mat-icon>
            {{ topic.title }}
          </a>
        }
      </mat-expansion-panel>
    }
  </div>
</div>
```

`sidenav.component.ts`:
```typescript
import { Component, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ContentService } from '../../shared/services/content.service';
import { ProgressService } from '../../shared/services/progress.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive,
    MatButtonModule, MatIconModule, MatExpansionModule, MatProgressBarModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);

  navigated = output<void>();

  blocks = this.contentService.blocks;
  completedTopics = this.progressService.completedTopics;
  totalTopics = this.contentService.totalTopics;
  completionPercentage = this.progressService.completionPercentage;

  getBlockCompletion(blockId: number): number {
    return this.progressService.getBlockCompletion(blockId).completed;
  }

  getTopicIcon(topicId: string): string {
    const progress = this.progressService.getTopicProgress(topicId);
    if (!progress || progress.status === 'not-started') return 'radio_button_unchecked';
    if (progress.status === 'in-progress') return 'pending';
    return 'check_circle';
  }
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add sidenav with block navigation and progress indicators"
```

---

### Task 3.3: Create Toolbar Component

**Files:**
- Create: `src/app/layout/toolbar/toolbar.component.ts`
- Create: `src/app/layout/toolbar/toolbar.component.html`

**Step 1: Generate component**

```bash
ng generate component layout/toolbar --standalone
```

**Step 2: Implement toolbar with search, theme toggle**

`toolbar.component.html`:
```html
<mat-toolbar class="bg-surface-light border-b border-surface-lighter">
  <button mat-icon-button (click)="toggleSidenav.emit()">
    <mat-icon>{{ sidenavOpen() ? 'menu_open' : 'menu' }}</mat-icon>
  </button>

  <!-- Search -->
  <div class="flex-1 max-w-lg mx-4">
    <mat-form-field appearance="outline" class="w-full search-field">
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        placeholder="Search topics... ( / )"
        [(ngModel)]="searchQuery"
        (keyup.enter)="onSearch()"
        (keyup.escape)="searchQuery = ''" />
      @if (searchQuery) {
        <button matSuffix mat-icon-button (click)="searchQuery = ''">
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  </div>

  <!-- Progress chip -->
  <mat-chip class="mr-4">
    {{ completionPercentage() }}% complete
  </mat-chip>

  <!-- Theme toggle -->
  <button mat-icon-button (click)="themeService.toggle()" matTooltip="Toggle theme">
    <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
  </button>
</mat-toolbar>
```

`toolbar.component.ts`:
```typescript
import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../shared/services/theme.service';
import { ProgressService } from '../../shared/services/progress.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    FormsModule,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './toolbar.component.html',
})
export class ToolbarComponent {
  themeService = inject(ThemeService);
  private progressService = inject(ProgressService);
  private router = inject(Router);

  sidenavOpen = input<boolean>(true);
  toggleSidenav = output<void>();

  searchQuery = '';
  completionPercentage = this.progressService.completionPercentage;

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add toolbar with search bar and theme toggle"
```

---

### Task 3.4: Configure App Routes

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.config.ts`

**Step 1: Set up lazy-loaded routes**

`src/app/app.routes.ts`:
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
  },
  {
    path: 'blocks',
    loadComponent: () => import('./features/curriculum/curriculum.component')
      .then(m => m.CurriculumComponent),
  },
  {
    path: 'blocks/:blockSlug',
    loadComponent: () => import('./features/curriculum/block-detail/block-detail.component')
      .then(m => m.BlockDetailComponent),
  },
  {
    path: 'blocks/:blockSlug/:topicSlug',
    loadComponent: () => import('./features/topic-viewer/topic-viewer.component')
      .then(m => m.TopicViewerComponent),
  },
  {
    path: 'interview',
    loadComponent: () => import('./features/interview-center/interview-center.component')
      .then(m => m.InterviewCenterComponent),
  },
  {
    path: 'interview/quiz',
    loadComponent: () => import('./features/interview-center/quiz-mode/quiz-mode.component')
      .then(m => m.QuizModeComponent),
  },
  {
    path: 'conduct',
    loadComponent: () => import('./features/interview-conductor/conductor-home.component')
      .then(m => m.ConductorHomeComponent),
  },
  {
    path: 'conduct/new',
    loadComponent: () => import('./features/interview-conductor/session-setup/session-setup.component')
      .then(m => m.SessionSetupComponent),
  },
  {
    path: 'conduct/session/:id',
    loadComponent: () => import('./features/interview-conductor/session-active/session-active.component')
      .then(m => m.SessionActiveComponent),
  },
  {
    path: 'conduct/session/:id/summary',
    loadComponent: () => import('./features/interview-conductor/session-summary/session-summary.component')
      .then(m => m.SessionSummaryComponent),
  },
  {
    path: 'conduct/history',
    loadComponent: () => import('./features/interview-conductor/session-history/session-history.component')
      .then(m => m.SessionHistoryComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component')
      .then(m => m.SearchComponent),
  },
  {
    path: 'cheatsheets',
    loadComponent: () => import('./features/cheatsheets/cheatsheets.component')
      .then(m => m.CheatsheetsComponent),
  },
  {
    path: 'progress',
    loadComponent: () => import('./features/progress/progress.component')
      .then(m => m.ProgressComponent),
  },
  { path: '**', redirectTo: '' },
];
```

**Step 2: Configure app.config.ts with HttpClient**

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(),
    provideAnimationsAsync(),
  ],
};
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: configure lazy-loaded routes and app providers"
```

---

## Phase 4: Build Script (Markdown → JSON)

### Task 4.1: Create Build Script

**Files:**
- Create: `scripts/build-content.ts`
- Modify: `package.json` — add script command

**Step 1: Install build dependencies**

```bash
npm install -D ts-node marked gray-matter highlight.js @types/node
```

**Step 2: Create build script**

`scripts/build-content.ts`:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import hljs from 'highlight.js';
import lunr from 'lunr';

const CONTENT_DIR = path.resolve(__dirname, '../content');
const OUTPUT_DIR = path.resolve(__dirname, '../src/assets');

// Configure marked with syntax highlighting
marked.setOptions({
  highlight(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

interface BlockDir {
  dirName: string;
  blockId: number;
  slug: string;
  title: string;
  files: string[];
}

function getBlockDirs(): BlockDir[] {
  const dirs = fs.readdirSync(CONTENT_DIR)
    .filter(d => d.startsWith('block-') && fs.statSync(path.join(CONTENT_DIR, d)).isDirectory())
    .sort();

  return dirs.map(dirName => {
    const match = dirName.match(/^block-(\d+)-(.+)$/);
    if (!match) throw new Error(`Invalid block dir name: ${dirName}`);

    const blockId = parseInt(match[1], 10);
    const slug = match[2];
    const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const files = fs.readdirSync(path.join(CONTENT_DIR, dirName))
      .filter(f => f.endsWith('.md'))
      .sort();

    return { dirName, blockId, slug, title, files };
  });
}

function parseTopicFile(blockDir: BlockDir, fileName: string) {
  const filePath = path.join(CONTENT_DIR, blockDir.dirName, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  const htmlContent = marked.parse(content) as string;

  // Parse sections from markdown (## headers)
  const sections: { id: string; title: string; htmlContent: string }[] = [];
  const sectionRegex = /^## (.+)$/gm;
  const sectionParts = content.split(/^## /gm).slice(1);
  let sectionMatch;
  let idx = 0;
  const headerMatches = [...content.matchAll(/^## (.+)$/gm)];
  for (const match of headerMatches) {
    const sectionTitle = match[1].trim();
    const sectionId = sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    // Get content between this header and next
    const startIdx = content.indexOf(match[0]) + match[0].length;
    const nextHeader = headerMatches[idx + 1];
    const endIdx = nextHeader ? content.indexOf(nextHeader[0]) : content.length;
    const sectionContent = content.slice(startIdx, endIdx).trim();
    sections.push({
      id: sectionId,
      title: sectionTitle,
      htmlContent: marked.parse(sectionContent) as string,
    });
    idx++;
  }

  return {
    frontmatter,
    htmlContent,
    sections,
    rawContent: content,
  };
}

function extractInterviewQuestions(frontmatter: any, blockId: number, blockTitle: string): any[] {
  if (!frontmatter.interviewQuestions || !Array.isArray(frontmatter.interviewQuestions)) {
    return [];
  }
  return frontmatter.interviewQuestions.map((q: any) => ({
    ...q,
    block: blockId,
    blockTitle,
    topic: frontmatter.topic,
    topicTitle: frontmatter.title,
    topicSlug: frontmatter.slug,
  }));
}

function build() {
  console.log('Building content...');

  const blockDirs = getBlockDirs();
  const contentIndex: any = { blocks: [], totalTopics: 0, totalQuestions: 0 };
  const allQuestions: any[] = [];
  const searchDocuments: { id: string; title: string; tags: string; content: string }[] = [];

  for (const blockDir of blockDirs) {
    const block: any = {
      id: blockDir.blockId,
      slug: blockDir.slug,
      title: blockDir.title,
      description: '',
      topicCount: blockDir.files.length,
      topics: [],
    };

    // Ensure output directory exists
    const blockOutputDir = path.join(OUTPUT_DIR, 'content', blockDir.slug);
    fs.mkdirSync(blockOutputDir, { recursive: true });

    for (const file of blockDir.files) {
      const parsed = parseTopicFile(blockDir, file);
      const fm = parsed.frontmatter;

      const topicMeta = {
        id: `b${blockDir.blockId}t${fm.topic}`,
        block: blockDir.blockId,
        topic: fm.topic,
        slug: fm.slug,
        title: fm.title,
        tags: fm.tags || [],
        relatedTopics: fm.relatedTopics || [],
        questionCount: fm.interviewQuestions?.length || 0,
      };

      block.topics.push(topicMeta);

      // Write full topic content JSON
      const topicContent = {
        ...topicMeta,
        htmlContent: parsed.htmlContent,
        sections: parsed.sections,
      };
      fs.writeFileSync(
        path.join(blockOutputDir, `${fm.slug}.json`),
        JSON.stringify(topicContent, null, 2)
      );

      // Extract interview questions
      const questions = extractInterviewQuestions(fm, blockDir.blockId, blockDir.title);
      allQuestions.push(...questions);

      // Add to search index
      searchDocuments.push({
        id: topicMeta.id,
        title: fm.title,
        tags: (fm.tags || []).join(' '),
        content: parsed.rawContent.slice(0, 5000), // Limit for search
      });

      contentIndex.totalTopics++;
      contentIndex.totalQuestions += questions.length;
    }

    if (block.topics.length > 0) {
      block.description = `${block.topicCount} topics covering ${block.title.toLowerCase()}`;
    }

    contentIndex.blocks.push(block);
  }

  // Write content index
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'content-index.json'),
    JSON.stringify(contentIndex, null, 2)
  );

  // Write interview questions
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'interview-questions.json'),
    JSON.stringify(allQuestions, null, 2)
  );

  // Build and write lunr search index
  const searchIndex = lunr(function () {
    this.ref('id');
    this.field('title', { boost: 10 });
    this.field('tags', { boost: 5 });
    this.field('content');

    for (const doc of searchDocuments) {
      this.add(doc);
    }
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'search-index.json'),
    JSON.stringify(searchIndex)
  );

  console.log(`Done! ${contentIndex.totalTopics} topics, ${contentIndex.totalQuestions} questions, ${searchDocuments.length} search entries.`);
}

build();
```

**Step 3: Add npm script**

In `package.json` add:
```json
"scripts": {
  "build:content": "npx ts-node scripts/build-content.ts",
  "prebuild": "npm run build:content",
  "prestart": "npm run build:content"
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add build script to convert markdown content to JSON assets"
```

---

### Task 4.2: Create Sample Content (1 Block)

**Files:**
- Create: `content/block-01-core-fundamentals/01-bootstrapping.md` (sample)

**Step 1: Create content directory and one sample topic**

```bash
mkdir -p content/block-01-core-fundamentals
```

Create a sample .md file with proper frontmatter to test the build pipeline. This validates the full flow: md → build script → JSON → app renders it.

The sample should follow the full topic format (Core Concept, Deep Details, Examples, Code Smells, Interview Block, Summary) so we can verify all sections parse correctly.

**Step 2: Run build script to verify**

```bash
npm run build:content
```

Expected: JSON files generated in `src/assets/content/`, `content-index.json`, `interview-questions.json`, `search-index.json`.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add sample content and verify build pipeline"
```

---

## Phase 4B: Generate First 3 Blocks of Content

> **Content is interleaved with feature development.** After the build script works, we generate real content so every subsequent feature can be tested with real data.
>
> **REQUIRED SKILL:** Use `generating-learning-content` skill for ALL content generation tasks. It defines the exact frontmatter schema, section structure, quality standards, and Ukrainian+English language format.

### Task 4B.1: Generate Block 0 — General Software Engineering (7 topics)

Create all markdown files in `content/block-00-general-engineering/`:
- `01-oop-principles.md`
- `02-solid-principles.md`
- `03-design-patterns.md`
- `04-anti-patterns.md`
- `05-general-cs.md`
- `06-typescript-advanced.md`
- `07-git-workflow.md`

Each file must follow the full format: YAML frontmatter (with 4-5 interview questions at all 4 levels with reference answers, relatedQuestions, tags) + Core Concept + Deep Details + Examples + Code Smells + Interview Block + Summary.

**Content language:** Technical terms in English, explanations in Ukrainian. Senior/Staff level depth.

Run `npm run build:content` after to verify.

**Commit after each block.**

### Task 4B.2: Generate Block 1 — Core Fundamentals (4 topics)

Create all markdown files in `content/block-01-core-fundamentals/`:
- `01-bootstrapping.md`
- `02-ngmodules.md`
- `03-standalone-components.md`
- `04-angular-cli.md`

Same format. Run build script. Commit.

### Task 4B.3: Generate Block 2 — Components (6 topics)

Create all markdown files in `content/block-02-components/`:
- `01-component-metadata.md`
- `02-lifecycle-hooks.md`
- `03-input-output.md`
- `04-content-projection.md`
- `05-viewchild-contentchild.md`
- `06-host-element.md`

Same format. Run build script. Commit.

> **With 3 blocks (17 topics, ~85 interview questions), we have enough real content to properly test all features as we build them.**

---

## Phase 5: Feature Components

### Task 5.1: Dashboard Component

**Files:**
- Create: `src/app/features/dashboard/dashboard.component.ts`
- Create: `src/app/features/dashboard/dashboard.component.html`

**Description:** Landing page showing:
- Welcome message and overall completion percentage (large circular progress)
- Quick stats cards: topics completed, questions answered, weak areas count
- Recent activity (last 5 topics visited)
- "Continue where you left off" button
- Weak zones alert (topics due for review from spaced repetition)
- Quick links to main sections

**Step 1: Generate and implement component**

```bash
ng generate component features/dashboard --standalone
```

Inject ContentService and ProgressService. Use Material cards, grid layout with Tailwind.

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add dashboard with progress overview and quick stats"
```

---

### Task 5.2: Curriculum Component (Block List)

**Files:**
- Create: `src/app/features/curriculum/curriculum.component.ts`
- Create: `src/app/features/curriculum/curriculum.component.html`

**Description:** Grid of cards for all 17 blocks. Each card shows:
- Block number and title
- Topic count
- Progress bar (completed/total)
- Priority badge for blocks 9-12 (⚠️ marked in curriculum)
- Click navigates to block detail

**Step 1: Generate and implement**

```bash
ng generate component features/curriculum --standalone
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add curriculum page with block cards and progress"
```

---

### Task 5.3: Block Detail Component

**Files:**
- Create: `src/app/features/curriculum/block-detail/block-detail.component.ts`
- Create: `src/app/features/curriculum/block-detail/block-detail.component.html`

**Description:** Shows all topics for a block as a list with:
- Topic title, tags as chips, status icon (not started / in progress / completed)
- Click navigates to topic viewer

**Step 1: Generate and implement**

```bash
ng generate component features/curriculum/block-detail --standalone
```

Use `ActivatedRoute` to get `blockSlug` param. Filter topics from ContentService.

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add block detail page with topic list"
```

---

### Task 5.4: Topic Viewer Component

**Files:**
- Create: `src/app/features/topic-viewer/topic-viewer.component.ts`
- Create: `src/app/features/topic-viewer/topic-viewer.component.html`
- Create: `src/app/features/topic-viewer/topic-viewer.component.scss`

**Description:** The main learning content view. Shows full topic with:
- Breadcrumb: Curriculum > Block > Topic
- Topic title, tags, related topics links
- Tabbed sections (Material tabs): Core Concept | Deep Details | Examples | Code Smells | Interview | Summary
- Each tab renders the corresponding section's HTML content
- Syntax-highlighted code blocks (highlight.js CSS imported)
- "Mark as complete" button
- Previous/Next topic navigation

**Step 1: Generate and implement**

```bash
ng generate component features/topic-viewer --standalone
```

Load topic content via ContentService.loadTopic(). Use `[innerHTML]` for rendered HTML. Import highlight.js theme CSS in styles.scss.

**Step 2: Add highlight.js CSS to styles.scss**

```scss
@import 'highlight.js/styles/atom-one-dark.css';
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add topic viewer with tabbed sections and syntax highlighting"
```

---

### Task 5.5: Search Component

**Files:**
- Create: `src/app/features/search/search.component.ts`
- Create: `src/app/features/search/search.component.html`

**Description:** Search results page:
- Gets query from URL query param `?q=`
- Calls SearchService.search()
- Displays results as cards with title, block, matched terms highlighted
- Click navigates to topic viewer

**Step 1: Generate and implement**

```bash
ng generate component features/search --standalone
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add search results page"
```

---

### Task 5.6: Cheatsheets Component

**Files:**
- Create: `src/app/features/cheatsheets/cheatsheets.component.ts`
- Create: `src/app/features/cheatsheets/cheatsheets.component.html`

**Description:** Quick reference cards per block, condensed view:
- Grid of expandable cards
- Each card shows key concepts, comparison tables, anti-patterns
- Based on the Summary section of each topic

**Step 1: Generate and implement**

```bash
ng generate component features/cheatsheets --standalone
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add cheatsheets page with quick reference cards"
```

---

### Task 5.7: Progress Component

**Files:**
- Create: `src/app/features/progress/progress.component.ts`
- Create: `src/app/features/progress/progress.component.html`

**Description:** Detailed analytics page:
- Overall completion donut chart
- Per-block progress bars
- Quiz performance stats
- Weak areas list (questions scored "didn't know")
- Spaced repetition queue (questions due for review)
- Timeline of activity

**Step 1: Generate and implement**

```bash
ng generate component features/progress --standalone
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add progress analytics page"
```

---

## Phase 5B: Generate Blocks 3-6 (Content Batch 2)

> After the Topic Viewer is working, generate more content so quiz and interview features have rich data to work with.

### Task 5B.1: Generate Block 3 — Directives & Pipes (6 topics)
### Task 5B.2: Generate Block 4 — Templates & Data Binding (4 topics)
### Task 5B.3: Generate Block 5 — Dependency Injection (5 topics)
### Task 5B.4: Generate Block 6 — Routing & Navigation (6 topics)

Same format as Phase 4B. Run build script after each block. Commit after each block.

> **Now we have 7 blocks (38 topics, ~190 interview questions) — enough for a rich quiz and interview experience.**

---

## Phase 6: Self-Study / Interview Center

### Task 6.1: Interview Center Component

**Files:**
- Create: `src/app/features/interview-center/interview-center.component.ts`
- Create: `src/app/features/interview-center/interview-center.component.html`

**Description:** Hub for self-study:
- Filter questions by block, topic, level
- Table view of all questions with "Practice" button
- Stats: how many practiced, accuracy rate
- Link to Quiz Mode

**Step 1: Generate and implement**

```bash
ng generate component features/interview-center --standalone
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add interview center for self-study"
```

---

### Task 6.2: Quiz Mode Component

**Files:**
- Create: `src/app/features/interview-center/quiz-mode/quiz-mode.component.ts`
- Create: `src/app/features/interview-center/quiz-mode/quiz-mode.component.html`

**Description:** Flashcard-style self-assessment:
- Question displayed, answer hidden
- Click to reveal answer
- Self-grade: "Knew it" / "Partial" / "Didn't know"
- Progress saved via ProgressService
- Spaced repetition: weak questions reappear sooner
- Can filter by block/level before starting
- Shows running score

**Step 1: Generate and implement**

```bash
ng generate component features/interview-center/quiz-mode --standalone
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add flashcard quiz mode with spaced repetition"
```

---

## Phase 7: Interview Conductor

### Task 7.1: Conductor Home Component

**Files:**
- Create: `src/app/features/interview-conductor/conductor-home.component.ts`
- Create: `src/app/features/interview-conductor/conductor-home.component.html`

**Description:** Landing page for interview conductor:
- "Start New Interview" button
- List of recent sessions (from InterviewService)
- Link to full history

**Step 1: Generate and implement**

```bash
ng generate component features/interview-conductor/conductor-home --standalone
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add interview conductor home page"
```

---

### Task 7.2: Session Setup Component (Candidate Profile)

**Files:**
- Create: `src/app/features/interview-conductor/session-setup/session-setup.component.ts`
- Create: `src/app/features/interview-conductor/session-setup/session-setup.component.html`

**Description:** Reactive form for candidate profile:
- All fields from CandidateProfile interface
- Angular version multi-select with chips (v2 through v21)
- Tech stack chips input
- "Start Interview" button → creates session, navigates to active session

**Step 1: Generate and implement**

```bash
ng generate component features/interview-conductor/session-setup --standalone
```

Use Angular Reactive Forms with typed FormGroup. Material form fields, chip lists.

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add candidate profile form for interview setup"
```

---

### Task 7.3: Session Active Component (Main Interview Table)

**Files:**
- Create: `src/app/features/interview-conductor/session-active/session-active.component.ts`
- Create: `src/app/features/interview-conductor/session-active/session-active.component.html`
- Create: `src/app/features/interview-conductor/session-active/session-active.component.scss`

**Description:** The core interview conductor view. This is the most complex component:

**Layout:**
- Top bar: Candidate name, session timer, coverage indicator, "Finish Interview" button
- Filters: Block dropdown, Level filter chips, "Show unanswered only" toggle
- Main: Full table of all questions

**Table columns:** Block | Topic | Question | Level | Status | Actions

**Row behavior:**
- Default: collapsed, shows question text preview
- Click "Ask" → expands inline:
  - Full question text
  - Collapsible reference answers (Junior / Mid / Senior / Staff tabs)
  - Grade selector: "Candidate answered at level:" dropdown + Quality: Strong/Partial/Weak radio
  - Notes textarea
  - "Save Grade" button → marks as "Asked" (green highlight)
- Asked questions get green left border
- **Yellow highlight**: Related/follow-up questions (from relatedQuestions metadata)
- **Blue highlight**: Questions from uncovered blocks (coverage gap suggestions)

**"Add Custom Question" button** at the bottom:
- Opens dialog: question text, optional block/topic assignment, save for future toggle
- After adding, appears in table with "Custom" chip

**Step 1: Generate and implement**

```bash
ng generate component features/interview-conductor/session-active --standalone
```

This component uses InterviewService for state. Material table with expandable rows, chips for filtering.

**Step 2: Create grade-selector shared component**

```bash
ng generate component shared/components/grade-selector --standalone
```

Reusable component with level dropdown + quality radio buttons.

**Step 3: Create custom-question-dialog shared component**

```bash
ng generate component shared/components/custom-question-dialog --standalone
```

Material dialog for adding custom questions.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add interview session active view with question table and grading"
```

---

### Task 7.4: Session Summary Component

**Files:**
- Create: `src/app/features/interview-conductor/session-summary/session-summary.component.ts`
- Create: `src/app/features/interview-conductor/session-summary/session-summary.component.html`

**Description:** Post-interview results view:
- Candidate profile summary
- Scorecard table: Question | Topic | Level | Candidate Level | Quality | Notes
- Stats: Total asked, % strong/partial/weak, breakdown by block
- Simple bar charts (CSS-only or Material, no charting library needed)
- "Generate AI Prompt" button → calls InterviewService.generateAIPrompt()
- Copy-to-clipboard functionality
- "Back to History" link

**Step 1: Generate and implement**

```bash
ng generate component features/interview-conductor/session-summary --standalone
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add interview session summary with AI prompt generator"
```

---

### Task 7.5: Session History Component

**Files:**
- Create: `src/app/features/interview-conductor/session-history/session-history.component.ts`
- Create: `src/app/features/interview-conductor/session-history/session-history.component.html`

**Description:** List of all past interview sessions:
- Table: Date | Candidate | Questions Asked | Score | Actions
- Click to view summary
- Delete session option

**Step 1: Generate and implement**

```bash
ng generate component features/interview-conductor/session-history --standalone
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add interview session history page"
```

---

## Phase 8: App Initialization & Polish

### Task 8.1: App Initializer

**Files:**
- Modify: `src/app/app.config.ts`

**Step 1: Add APP_INITIALIZER to load content index on startup**

```typescript
import { APP_INITIALIZER } from '@angular/core';
import { ContentService } from './shared/services/content.service';
import { SearchService } from './shared/services/search.service';

function initializeApp(contentService: ContentService, searchService: SearchService) {
  return async () => {
    await contentService.loadIndex();
    await contentService.loadQuestions();
    await searchService.loadIndex();
  };
}

// Add to providers:
{
  provide: APP_INITIALIZER,
  useFactory: (cs: ContentService, ss: SearchService) => initializeApp(cs, ss),
  deps: [ContentService, SearchService],
  multi: true,
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add app initializer to load content and search index on startup"
```

---

### Task 8.2: Keyboard Navigation

**Files:**
- Create: `src/app/shared/services/keyboard.service.ts`

**Step 1: Create KeyboardService**

Listen for global keyboard events:
- `/` → focus search input
- `j` / `k` → next/previous topic (when in topic viewer)
- `Escape` → close expanded panels

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add global keyboard shortcuts"
```

---

### Task 8.3: Light Theme Styles

**Files:**
- Modify: `src/styles/_theme.scss`
- Modify: `tailwind.config.js`

**Step 1: Add light theme variant**

Create a light theme Material config that activates when `dark` class is removed from `<html>`. Update Tailwind colors for light mode.

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add light theme support"
```

---

### Task 8.4: Responsive Design Pass

**Files:**
- Modify: Various component templates

**Step 1: Ensure all pages work on mobile**

- Sidenav collapses to overlay on mobile
- Tables become card lists on small screens
- Search is full-width on mobile
- Toolbar adapts

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: responsive design for mobile devices"
```

---

## Phase 9: Remaining Content Generation (Blocks 7-16)

> The app is fully functional. Now generate the remaining 10 blocks of content.

### Task 9.1: Generate Block 7 — Forms (5 topics)
### Task 9.2: Generate Block 8 — HTTP & Interceptors (4 topics)
### Task 9.3: Generate Block 9 — Change Detection (5 topics) ⚠️ PRIORITY
### Task 9.4: Generate Block 10 — RxJS (5 topics) ⚠️ PRIORITY
### Task 9.5: Generate Block 11 — Performance (4 topics) ⚠️ PRIORITY
### Task 9.6: Generate Block 12 — State Management (5 topics) ⚠️ PRIORITY
### Task 9.7: Generate Block 13 — Angular Material (4 topics)
### Task 9.8: Generate Block 14 — Tailwind CSS (4 topics)
### Task 9.9: Generate Block 15 — Modern Angular v17+ (4 topics)
### Task 9.10: Generate Block 16 — Testing (4 topics)

Same format. Priority blocks (9-12) should be generated first as they cover weak zones. Run build script + commit after each block.

---

## Execution Order Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1-1.4 | Project setup, Material, Tailwind, theme |
| 2 | 2.1-2.6 | Models, services |
| 3 | 3.1-3.4 | Layout shell, sidenav, toolbar, routes |
| 4 | 4.1-4.2 | Build script, sample content |
| **4B** | **4B.1-4B.3** | **Content: Blocks 0-2 (17 topics, ~85 questions)** |
| 5 | 5.1-5.7 | Feature pages (dashboard through progress) |
| **5B** | **5B.1-5B.4** | **Content: Blocks 3-6 (21 topics, ~105 questions)** |
| 6 | 6.1-6.2 | Self-study quiz & flashcards |
| 7 | 7.1-7.5 | Interview conductor (setup, table, summary, history) |
| 8 | 8.1-8.4 | Initialization, keyboard nav, themes, responsive |
| **9** | **9.1-9.10** | **Content: Blocks 7-16 (44 topics, ~220 questions)** |

**Total: ~35 implementation tasks + 17 content generation phases**
**Content is generated incrementally so features are always tested with real data.**
