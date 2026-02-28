import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
  },
  {
    path: 'blocks',
    loadComponent: () => import('./features/curriculum/curriculum').then(m => m.Curriculum),
  },
  {
    path: 'blocks/:blockSlug',
    loadComponent: () => import('./features/curriculum/block-detail/block-detail').then(m => m.BlockDetail),
  },
  {
    path: 'blocks/:blockSlug/:topicSlug',
    loadComponent: () => import('./features/topic-viewer/topic-viewer').then(m => m.TopicViewer),
  },
  {
    path: 'interview',
    loadComponent: () => import('./features/interview-center/interview-center').then(m => m.InterviewCenter),
  },
  {
    path: 'interview/quiz',
    loadComponent: () => import('./features/interview-center/quiz-mode/quiz-mode').then(m => m.QuizMode),
  },
  {
    path: 'conduct',
    loadComponent: () => import('./features/interview-conductor/conductor-home/conductor-home').then(m => m.ConductorHome),
  },
  {
    path: 'conduct/new',
    loadComponent: () => import('./features/interview-conductor/session-setup/session-setup').then(m => m.SessionSetup),
  },
  {
    path: 'conduct/session/:id',
    loadComponent: () => import('./features/interview-conductor/session-active/session-active').then(m => m.SessionActive),
  },
  {
    path: 'conduct/session/:id/summary',
    loadComponent: () => import('./features/interview-conductor/session-summary/session-summary').then(m => m.SessionSummary),
  },
  {
    path: 'conduct/history',
    loadComponent: () => import('./features/interview-conductor/session-history/session-history').then(m => m.SessionHistory),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search').then(m => m.Search),
  },
  {
    path: 'cheatsheets',
    loadComponent: () => import('./features/cheatsheets/cheatsheets').then(m => m.Cheatsheets),
  },
  {
    path: 'progress',
    loadComponent: () => import('./features/progress/progress').then(m => m.Progress),
  },
  { path: '**', redirectTo: '' },
];
