export interface ContentBlock {
  id: number;
  slug: string;
  title: string;
  description: string;
  topicCount: number;
  topics: TopicMeta[];
}

export interface TopicMeta {
  id: string;          // "b1t1"
  block: number;
  topic: number;
  slug: string;
  title: string;
  difficulty: number;        // 1-5 scale
  sinceVersion?: string;     // Angular version introduced (omitted for Block 0)
  tags: string[];
  relatedTopics: string[];   // slugs
  questionCount: number;
}

export interface TopicContent extends TopicMeta {
  htmlContent: string;       // rendered markdown
  sections: TopicSection[];
}

export interface TopicSection {
  id: string;
  title: string;
  htmlContent: string;
}

export interface InterviewQuestion {
  id: string;           // "b1t1q1"
  block: number;
  blockTitle: string;
  topic: number;
  topicTitle: string;
  topicSlug: string;
  level: QuestionLevel;
  question: string;
  referenceAnswers: Record<QuestionLevel, string>;
  commonMistakes: string[];
  relatedQuestions: string[];
  tags: string[];
}

export type QuestionLevel = 'junior' | 'mid' | 'senior' | 'staff';

export interface ContentIndex {
  blocks: ContentBlock[];
  totalTopics: number;
  totalQuestions: number;
}
