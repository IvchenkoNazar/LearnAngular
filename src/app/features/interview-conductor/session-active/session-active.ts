import { Component, inject, signal, computed, input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { ContentService } from '../../../shared/services/content.service';
import { InterviewService } from '../../../shared/services/interview.service';
import { InterviewQuestion, QuestionLevel, ContentBlock } from '../../../shared/models';
import { AnswerQuality } from '../../../shared/models';

interface QuestionRow {
  question: InterviewQuestion;
  isAsked: boolean;
  isRelated: boolean;
  isUncoveredBlock: boolean;
}

@Component({
  selector: 'app-session-active',
  imports: [
    RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTabsModule, MatChipsModule, MatExpansionModule,
  ],
  templateUrl: './session-active.html',
  styleUrl: './session-active.scss',
})
export class SessionActive implements OnInit {
  private contentService = inject(ContentService);
  private interviewService = inject(InterviewService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  id = input.required<string>();

  blocks = this.contentService.blocks;
  questions = this.contentService.questions;
  session = this.interviewService.activeSession;

  filterBlock = signal<number | null>(null);
  filterLevel = signal<QuestionLevel | null>(null);
  showUnansweredOnly = signal(false);
  expandedQuestionId = signal<string | null>(null);

  gradeForm = this.fb.group({
    candidateLevel: ['mid' as QuestionLevel],
    quality: ['strong' as AnswerQuality],
    notes: [''],
  });

  levels: QuestionLevel[] = ['junior', 'mid', 'senior', 'staff'];
  qualities: { value: AnswerQuality; label: string }[] = [
    { value: 'strong', label: 'Сильна' },
    { value: 'partial', label: 'Часткова' },
    { value: 'weak', label: 'Слабка' },
  ];

  askedIds = this.interviewService.askedQuestionIds;

  // Questions related to ANY already-asked question, excluding those already asked
  relatedIds = computed(() => {
    const allQuestions = this.questions();
    const askedIds = this.askedIds();
    if (askedIds.size === 0) return new Set<string>();
    const related = new Set<string>();
    for (const id of askedIds) {
      this.interviewService.getRelatedQuestionIds(id, allQuestions)
        .forEach(rid => related.add(rid));
    }
    askedIds.forEach(id => related.delete(id)); // don't re-highlight asked ones
    return related;
  });

  // Blocks with zero asked questions (only meaningful once session has started)
  uncoveredBlocks = computed(() => {
    if (this.askedIds().size === 0) return new Set<number>(); // nothing asked yet → no highlights
    return this.interviewService.getUncoveredBlocks(this.questions());
  });

  rows = computed((): QuestionRow[] => {
    let qs = this.questions();
    const block = this.filterBlock();
    const level = this.filterLevel();
    if (block !== null) qs = qs.filter(q => q.block === block);
    if (level !== null) qs = qs.filter(q => q.level === level);
    if (this.showUnansweredOnly()) qs = qs.filter(q => !this.askedIds().has(q.id));

    return qs.map(q => ({
      question: q,
      isAsked: this.askedIds().has(q.id),
      isRelated: this.relatedIds().has(q.id),
      isUncoveredBlock: this.uncoveredBlocks().has(q.block),
    }));
  });

  coverageStats = computed(() => {
    const total = this.questions().length;
    const asked = this.askedIds().size;
    return { total, asked, percentage: total > 0 ? Math.round(asked / total * 100) : 0 };
  });

  ngOnInit() {
    if (!this.session() || this.session()?.id !== this.id()) {
      const loaded = this.interviewService.loadSession(this.id());
      if (!loaded) {
        this.router.navigate(['/conduct']);
      }
    }
  }

  toggleExpand(questionId: string) {
    const current = this.expandedQuestionId();
    if (current === questionId) {
      this.expandedQuestionId.set(null);
      return;
    }
    this.expandedQuestionId.set(questionId);
    const existing = this.interviewService.activeAnswers().find(a => a.questionId === questionId);
    if (existing) {
      this.gradeForm.patchValue({
        candidateLevel: existing.candidateLevel,
        quality: existing.quality,
        notes: existing.notes,
      });
    } else {
      this.gradeForm.reset({ candidateLevel: 'mid', quality: 'strong', notes: '' });
    }
  }

  saveGrade(questionId: string) {
    const { candidateLevel, quality, notes } = this.gradeForm.value;
    this.interviewService.gradeQuestion(
      questionId,
      candidateLevel as QuestionLevel,
      quality as AnswerQuality,
      notes ?? ''
    );
    this.expandedQuestionId.set(null);
  }

  finishInterview() {
    this.interviewService.completeSession();
    this.router.navigate(['/conduct/session', this.id(), 'summary']);
  }

  getRowClass(row: QuestionRow): string {
    if (row.isAsked) return 'border-l-4 border-success';
    if (row.isRelated) return 'border-l-4 border-warning';
    if (row.isUncoveredBlock) return 'border-l-4 border-cyan';
    return '';
  }

  getLevelColor(level: QuestionLevel): string {
    const map: Record<QuestionLevel, string> = {
      junior: 'text-success', mid: 'text-cyan', senior: 'text-accent', staff: 'text-warning',
    };
    return map[level];
  }
}
