import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InterviewService } from '../../../shared/services/interview.service';

@Component({
  selector: 'app-session-history',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './session-history.html',
  styleUrl: './session-history.scss',
})
export class SessionHistory {
  private interviewService = inject(InterviewService);

  sessions = this.interviewService.sessions;

  deleteSession(id: string) {
    this.interviewService.deleteSession(id);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('uk-UA', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  getScoreLabel(session: { answers: { quality: string }[] }): string {
    const total = session.answers.length;
    if (total === 0) return '—';
    const strong = session.answers.filter(a => a.quality === 'strong').length;
    return `${strong}/${total} strong`;
  }
}
