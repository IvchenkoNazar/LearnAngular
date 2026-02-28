import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private router = inject(Router);

  init(): void {
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      filter(e => {
        const target = e.target as HTMLElement;
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
        return !isInput;
      })
    ).subscribe(e => {
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
      }
    });
  }
}
