import { Component, inject, signal, computed, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { InterviewService } from '../../../shared/services/interview.service';
import { ContentService } from '../../../shared/services/content.service';
import { InterviewSession } from '../../../shared/models';

@Component({
  selector: 'app-session-summary',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './session-summary.html',
  styleUrl: './session-summary.scss',
})
export class SessionSummary implements OnInit {
  private interviewService = inject(InterviewService);
  private contentService = inject(ContentService);

  id = input.required<string>();
  session = signal<InterviewSession | null>(null);
  aiPrompt = signal('');
  copied = signal(false);

  questions = this.contentService.questions;

  stats = computed(() => {
    const sess = this.session();
    if (!sess) return null;
    const total = sess.answers.length;
    const strong = sess.answers.filter(a => a.quality === 'strong').length;
    const partial = sess.answers.filter(a => a.quality === 'partial').length;
    const weak = sess.answers.filter(a => a.quality === 'weak').length;
    return { total, strong, partial, weak };
  });

  ngOnInit() {
    const loaded = this.interviewService.loadSession(this.id());
    this.session.set(loaded ?? null);
  }

  getQuestionText(questionId: string): string {
    return this.questions().find(q => q.id === questionId)?.question ?? questionId;
  }

  getQuestionLevel(questionId: string): string {
    return this.questions().find(q => q.id === questionId)?.level ?? '';
  }

  generatePrompt() {
    const sess = this.session();
    if (!sess) return;
    const prompt = this.interviewService.generateAIPrompt(sess, this.questions());
    this.aiPrompt.set(prompt);
  }

  async copyPrompt() {
    await navigator.clipboard.writeText(this.aiPrompt());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('uk-UA', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }
}
