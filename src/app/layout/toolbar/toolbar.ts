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
  imports: [
    FormsModule,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './toolbar.html',
})
export class Toolbar {
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
