import { QuestionLevel } from './content.model';

export interface CandidateProfile {
  name: string;
  role: string;
  yearsOfExperience: number;
  angularVersions: string[];
  mainResponsibilities: string;
  techStack: string[];
  proudestWork: string;
  wantsToImprove: string;
}

export interface InterviewSession {
  id: string;
  createdAt: string;          // ISO date
  candidate: CandidateProfile;
  answers: InterviewAnswer[];
  customQuestions: CustomQuestion[];
  status: 'active' | 'completed';
}

export interface InterviewAnswer {
  questionId: string;
  candidateLevel: QuestionLevel;
  quality: AnswerQuality;
  notes: string;
  askedAt: string;            // ISO date
}

export type AnswerQuality = 'strong' | 'partial' | 'weak';

export interface CustomQuestion {
  id: string;                 // "custom-{uuid}"
  question: string;
  block: number | null;
  topicTitle: string;
  candidateLevel: QuestionLevel;
  quality: AnswerQuality;
  notes: string;
  savedForFuture: boolean;
}
