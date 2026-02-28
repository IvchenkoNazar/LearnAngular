import { Injectable, signal, computed, effect } from '@angular/core';
import {
  InterviewSession, InterviewAnswer, CandidateProfile,
  CustomQuestion, AnswerQuality
} from '../models/interview.model';
import { InterviewQuestion, QuestionLevel } from '../models/content.model';

const STORAGE_KEY = 'angular-portal-interviews';
const CUSTOM_QUESTIONS_KEY = 'angular-portal-custom-questions';

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private _sessions = signal<InterviewSession[]>(this.loadSessions());
  private _activeSession = signal<InterviewSession | null>(null);
  private _savedCustomQuestions = signal<CustomQuestion[]>(this.loadCustomQuestions());

  readonly sessions = this._sessions.asReadonly();
  readonly activeSession = this._activeSession.asReadonly();
  readonly savedCustomQuestions = this._savedCustomQuestions.asReadonly();

  readonly activeAnswers = computed(() => this._activeSession()?.answers ?? []);
  readonly askedQuestionIds = computed(() =>
    new Set(this.activeAnswers().map(a => a.questionId))
  );

  constructor() {
    effect(() => {
      this.saveSessions(this._sessions());
    });
    effect(() => {
      this.saveCustomQuestions(this._savedCustomQuestions());
    });
  }

  startSession(candidate: CandidateProfile): InterviewSession {
    const session: InterviewSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      candidate,
      answers: [],
      customQuestions: [],
      status: 'active',
    };
    this._sessions.update(s => [...s, session]);
    this._activeSession.set(session);
    return session;
  }

  gradeQuestion(
    questionId: string,
    candidateLevel: QuestionLevel,
    quality: AnswerQuality,
    notes: string
  ): void {
    const answer: InterviewAnswer = {
      questionId,
      candidateLevel,
      quality,
      notes,
      askedAt: new Date().toISOString(),
    };
    this._activeSession.update(s => s ? {
      ...s,
      answers: [...s.answers.filter(a => a.questionId !== questionId), answer],
    } : s);
    this.syncActiveToSessions();
  }

  addCustomQuestion(question: CustomQuestion): void {
    this._activeSession.update(s => s ? {
      ...s,
      customQuestions: [...s.customQuestions, question],
    } : s);
    if (question.savedForFuture) {
      this._savedCustomQuestions.update(qs => [...qs, question]);
    }
    this.syncActiveToSessions();
  }

  completeSession(): void {
    this._activeSession.update(s => s ? { ...s, status: 'completed' } : s);
    this.syncActiveToSessions();
    this._activeSession.set(null);
  }

  loadSession(id: string): InterviewSession | undefined {
    const session = this._sessions().find(s => s.id === id);
    if (session) this._activeSession.set(session);
    return session;
  }

  deleteSession(id: string): void {
    this._sessions.update(s => s.filter(sess => sess.id !== id));
  }

  generateAIPrompt(session: InterviewSession, questions: InterviewQuestion[]): string {
    const c = session.candidate;
    const questionMap = new Map(questions.map(q => [q.id, q]));

    let prompt = `You are a senior Angular technical interviewer. Analyze this candidate's interview performance.\n\n`;
    prompt += `## Candidate Profile\n`;
    prompt += `- Name: ${c.name}, ${c.role}, ${c.yearsOfExperience} years experience\n`;
    prompt += `- Angular versions: ${c.angularVersions.join(', ')}\n`;
    prompt += `- Main responsibilities: ${c.mainResponsibilities}\n`;
    prompt += `- Tech stack: ${c.techStack.join(', ')}\n`;
    prompt += `- Proudest work: ${c.proudestWork}\n`;
    prompt += `- Wants to improve: ${c.wantsToImprove}\n\n`;

    prompt += `## Interview Results\n\n`;

    const grouped = new Map<string, InterviewAnswer[]>();
    for (const answer of session.answers) {
      const q = questionMap.get(answer.questionId);
      const key = q ? `Block ${q.block}: ${q.blockTitle}` : 'Unknown';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(answer);
    }

    for (const [group, answers] of grouped) {
      prompt += `### ${group}\n`;
      for (const answer of answers) {
        const q = questionMap.get(answer.questionId);
        if (q) {
          prompt += `- [${q.level}] "${q.question}" — Answered at: ${answer.candidateLevel} level, Grade: ${answer.quality}\n`;
          if (answer.notes) prompt += `  Notes: ${answer.notes}\n`;
        }
      }
      prompt += '\n';
    }

    if (session.customQuestions.length > 0) {
      prompt += `### Custom Questions\n`;
      for (const cq of session.customQuestions) {
        prompt += `- "${cq.question}" (${cq.topicTitle || 'Unclassified'}) — Answered at: ${cq.candidateLevel} level, Grade: ${cq.quality}\n`;
        if (cq.notes) prompt += `  Notes: ${cq.notes}\n`;
      }
      prompt += '\n';
    }

    prompt += `## Please Provide:\n`;
    prompt += `1. Overall assessment (2-3 sentences)\n`;
    prompt += `2. Suggested level: Junior / Mid / Senior / Staff (with justification)\n`;
    prompt += `3. Strong areas (with evidence from specific answers)\n`;
    prompt += `4. Areas to improve (specific gaps identified)\n`;
    prompt += `5. Recommended study materials and topics\n`;
    prompt += `6. Follow-up questions to probe weak areas deeper\n`;
    prompt += `7. Comparison: how does their self-assessment align with actual performance?\n`;

    return prompt;
  }

  getRelatedQuestionIds(questionId: string, allQuestions: InterviewQuestion[]): Set<string> {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return new Set();
    return new Set(question.relatedQuestions);
  }

  getUncoveredBlocks(allQuestions: InterviewQuestion[]): Set<number> {
    const askedBlockIds = new Set<number>();
    const questionMap = new Map(allQuestions.map(q => [q.id, q]));
    for (const answer of this.activeAnswers()) {
      const q = questionMap.get(answer.questionId);
      if (q) askedBlockIds.add(q.block);
    }
    const allBlockIds = new Set(allQuestions.map(q => q.block));
    return new Set([...allBlockIds].filter(id => !askedBlockIds.has(id)));
  }

  private syncActiveToSessions(): void {
    const active = this._activeSession();
    if (!active) return;
    this._sessions.update(sessions =>
      sessions.map(s => s.id === active.id ? active : s)
    );
  }

  private loadSessions(): InterviewSession[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveSessions(sessions: InterviewSession[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  private loadCustomQuestions(): CustomQuestion[] {
    const stored = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveCustomQuestions(questions: CustomQuestion[]): void {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
  }
}
