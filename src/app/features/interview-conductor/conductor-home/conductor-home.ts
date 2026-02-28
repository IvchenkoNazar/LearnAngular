import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InterviewService } from '../../../shared/services/interview.service';

@Component({
  selector: 'app-conductor-home',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './conductor-home.html',
  styleUrl: './conductor-home.scss',
})
export class ConductorHome {
  private interviewService = inject(InterviewService);

  recentSessions = this.interviewService.sessions;

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('uk-UA', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}
