import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withViewTransitions, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { ContentService } from './shared/services/content.service';
import { SearchService } from './shared/services/search.service';

function initializeApp(contentService: ContentService, searchService: SearchService) {
  return async () => {
    await contentService.loadIndex();
    await contentService.loadQuestions();
    await searchService.loadIndex();
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
      useFactory: (cs: ContentService, ss: SearchService) => initializeApp(cs, ss),
      deps: [ContentService, SearchService],
      multi: true,
    },
  ],
};
