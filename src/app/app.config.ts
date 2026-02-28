import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withViewTransitions, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { ContentService } from './shared/services/content.service';
import { SearchService } from './shared/services/search.service';
import { ProgressService } from './shared/services/progress.service';

function initializeApp(
  contentService: ContentService,
  searchService: SearchService,
  progressService: ProgressService,
) {
  return async () => {
    await contentService.loadIndex();
    await contentService.loadQuestions();
    await searchService.loadIndex();
    progressService.setTotalTopics(contentService.totalTopics());
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    provideHttpClient(),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: (cs: ContentService, ss: SearchService, ps: ProgressService) => initializeApp(cs, ss, ps),
      deps: [ContentService, SearchService, ProgressService],
      multi: true,
    },
  ],
};
