import { Component, inject, input, computed, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { SearchService, SearchResult } from '../../shared/services/search.service';

@Component({
  selector: 'app-search',
  imports: [RouterLink, MatCardModule, MatIconModule, MatChipsModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search implements OnInit {
  private searchService = inject(SearchService);

  q = input<string>('');
  results = signal<SearchResult[]>([]);

  async ngOnInit() {
    if (!this.searchService.isLoaded()) {
      await this.searchService.loadIndex();
    }
    const query = this.q();
    if (query) {
      this.results.set(this.searchService.search(query));
    }
  }
}
