export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export interface KnowledgePoint {
  id: string;
  chapterId: string;
  name: string;
  description: string;
  relatedIds: string[];
  traps: string[];
}

export type QuestionType = "single" | "multiple" | "judge" | "short";

export interface Question {
  id: string;
  knowledgePointId: string;
  type: QuestionType;
  content: string;
  options?: string[];
  correctAnswer: string;
  analysis?: string;
}

export type ErrorReason = "concept" | "memory" | "careless" | "method";

export interface ImportBatch {
  id: string;
  name: string;
  createdAt: string;
  totalCount: number;
  mistakeCount: number;
  subjectId: string;
  chapterId: string;
}

export interface Mistake {
  id: string;
  questionId: string;
  question: Question;
  knowledgePoint: KnowledgePoint;
  subject: Subject;
  chapter: Chapter;
  wrongAnswer: string;
  errorReason: ErrorReason;
  mastered: boolean;
  important: boolean;
  note: string;
  screenshot?: string;
  createdAt: string;
  reviewedCount: number;
  importBatchId?: string;
}

export type TaskStatus = "pending" | "completed" | "delayed" | "skipped";

export interface ReviewTask {
  id: string;
  knowledgePointId: string;
  knowledgePointName: string;
  subjectName: string;
  date: string;
  status: TaskStatus;
  priority: number;
  estimatedMinutes: number;
  mistakeCount: number;
}

export interface StudyRecord {
  date: string;
  totalCount: number;
  correctCount: number;
  mistakeCount: number;
}

export interface ImportedQuestion {
  questionId: string;
  knowledgePointId: string;
  isCorrect: boolean;
  userAnswer: string;
  errorReason?: ErrorReason;
}

export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
  masteryLevel: "good" | "medium" | "weak";
  correctRate: number;
  mistakeCount: number;
  subjectId: string;
}

export interface GraphLink {
  source: string;
  target: string;
}
