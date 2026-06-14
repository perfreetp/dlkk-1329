import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Mistake, ReviewTask, StudyRecord, ErrorReason, TaskStatus, ImportBatch, Question, Subject, Chapter, KnowledgePoint } from "@/types";
import { mistakes as initialMistakes, reviewTasks as initialTasks, studyRecords as initialRecords, subjects, chapters, knowledgePoints, questions } from "@/data/mock";

interface StudyState {
  mistakes: Mistake[];
  reviewTasks: ReviewTask[];
  studyRecords: StudyRecord[];
  importBatches: ImportBatch[];
  selectedSubjectId: string | null;
  selectedBatchId: string | null;
  searchQuery: string;
  masteryFilter: "all" | "mastered" | "unmastered";
  importantFilter: boolean;
}

interface ImportQuestionData {
  questionId?: string;
  questionContent: string;
  questionType?: string;
  options?: string[];
  correctAnswer: string;
  analysis?: string;
  knowledgePointId?: string;
  knowledgePointName?: string;
  userAnswer: string;
  isCorrect: boolean;
  errorReason?: ErrorReason;
}

interface StudyActions {
  toggleMastered: (id: string) => void;
  toggleImportant: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  updateScreenshot: (id: string, screenshot: string) => void;
  deleteMistake: (id: string) => void;
  addMistakes: (newMistakes: Mistake[]) => void;
  importQuestions: (data: ImportQuestionData[], batchName: string, subjectId: string, chapterId: string) => string;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  delayTask: (id: string) => void;
  generateDailyTasks: () => void;
  setSelectedSubjectId: (id: string | null) => void;
  setSelectedBatchId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setMasteryFilter: (filter: "all" | "mastered" | "unmastered") => void;
  setImportantFilter: (filter: boolean) => void;
  getKnowledgePointMastery: (kpId: string) => { correctRate: number; mistakeCount: number; level: "good" | "medium" | "weak" };
  getFilteredMistakes: () => Mistake[];
  resetToMock: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const findOrCreateKnowledgePoint = (
  kpId?: string,
  kpName?: string,
  chapterId?: string
): KnowledgePoint => {
  if (kpId) {
    const existing = knowledgePoints.find((k) => k.id === kpId);
    if (existing) return existing;
  }
  if (kpName) {
    const existing = knowledgePoints.find((k) => k.name === kpName);
    if (existing) return existing;
  }
  const defaultChapterId = chapterId || "ch-2";
  return {
    id: `kp-${generateId()}`,
    chapterId: defaultChapterId,
    name: kpName || "未分类知识点",
    description: "导入的知识点",
    relatedIds: [],
    traps: [],
  };
};

const determineErrorReason = (): ErrorReason => {
  const reasons: ErrorReason[] = ["concept", "memory", "careless", "method"];
  return reasons[Math.floor(Math.random() * reasons.length)];
};

export const useStudyStore = create<StudyState & StudyActions>()(
  persist(
    (set, get) => ({
      mistakes: initialMistakes,
      reviewTasks: initialTasks,
      studyRecords: initialRecords,
      importBatches: [],
      selectedSubjectId: null,
      selectedBatchId: null,
      searchQuery: "",
      masteryFilter: "all",
      importantFilter: false,

      toggleMastered: (id) =>
        set((state) => ({
          mistakes: state.mistakes.map((m) =>
            m.id === id ? { ...m, mastered: !m.mastered } : m
          ),
        })),

      toggleImportant: (id) =>
        set((state) => ({
          mistakes: state.mistakes.map((m) =>
            m.id === id ? { ...m, important: !m.important } : m
          ),
        })),

      updateNote: (id, note) =>
        set((state) => ({
          mistakes: state.mistakes.map((m) =>
            m.id === id ? { ...m, note } : m
          ),
        })),

      updateScreenshot: (id, screenshot) =>
        set((state) => ({
          mistakes: state.mistakes.map((m) =>
            m.id === id ? { ...m, screenshot } : m
          ),
        })),

      deleteMistake: (id) =>
        set((state) => ({
          mistakes: state.mistakes.filter((m) => m.id !== id),
        })),

      addMistakes: (newMistakes) =>
        set((state) => ({
          mistakes: [...newMistakes, ...state.mistakes],
        })),

      importQuestions: (data, batchName, subjectId, chapterId) => {
        const state = get();
        const batchId = `batch-${generateId()}`;
        const subject = subjects.find((s) => s.id === subjectId) || subjects[0];
        const chapter = chapters.find((c) => c.id === chapterId) || chapters[0];

        const newMistakes: Mistake[] = [];
        const today = new Date().toISOString().split("T")[0];

        data.forEach((item) => {
          if (item.isCorrect) return;

          const kp = findOrCreateKnowledgePoint(
            item.knowledgePointId,
            item.knowledgePointName,
            chapterId
          );

          const questionId = item.questionId || `q-${generateId()}`;
          const question: Question = {
            id: questionId,
            knowledgePointId: kp.id,
            type: (item.questionType as any) || "single",
            content: item.questionContent,
            options: item.options,
            correctAnswer: item.correctAnswer,
            analysis: item.analysis,
          };

          const mistake: Mistake = {
            id: `m-${generateId()}`,
            questionId,
            question,
            knowledgePoint: kp,
            subject,
            chapter,
            wrongAnswer: item.userAnswer,
            errorReason: item.errorReason || determineErrorReason(),
            mastered: false,
            important: false,
            note: "",
            createdAt: today,
            reviewedCount: 0,
            importBatchId: batchId,
          };

          newMistakes.push(mistake);
        });

        const batch: ImportBatch = {
          id: batchId,
          name: batchName,
          createdAt: today,
          totalCount: data.length,
          mistakeCount: newMistakes.length,
          subjectId,
          chapterId,
        };

        set((state) => ({
          mistakes: [...newMistakes, ...state.mistakes],
          importBatches: [batch, ...state.importBatches],
          selectedBatchId: batchId,
        }));

        get().generateDailyTasks();

        return batchId;
      },

      updateTaskStatus: (id, status) => {
        set((state) => ({
          reviewTasks: state.reviewTasks.map((t) =>
            t.id === id ? { ...t, status } : t
          ),
        }));
      },

      delayTask: (id) => {
        const state = get();
        const task = state.reviewTasks.find((t) => t.id === id);
        if (!task) return;
        const tomorrow = new Date(task.date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        set((state) => ({
          reviewTasks: state.reviewTasks.map((t) =>
            t.id === id
              ? { ...t, date: tomorrow.toISOString().split("T")[0], status: "delayed" as TaskStatus }
              : t
          ),
        }));
      },

      generateDailyTasks: () => {
        const state = get();
        const today = new Date().toISOString().split("T")[0];

        const existingTodayTasks = state.reviewTasks.filter((t) => t.date === today);
        if (existingTodayTasks.length > 0) return;

        const unmasteredMistakes = state.mistakes.filter((m) => !m.mastered);

        const kpMistakeMap = new Map<string, Mistake[]>();
        unmasteredMistakes.forEach((m) => {
          const kpId = m.knowledgePoint.id;
          if (!kpMistakeMap.has(kpId)) {
            kpMistakeMap.set(kpId, []);
          }
          kpMistakeMap.get(kpId)!.push(m);
        });

        const kpData: {
          id: string;
          name: string;
          subjectName: string;
          mistakeCount: number;
          avgReviewedCount: number;
        }[] = [];

        kpMistakeMap.forEach((mistakes, kpId) => {
          const first = mistakes[0];
          const avgReviewed = mistakes.reduce((sum, m) => sum + m.reviewedCount, 0) / mistakes.length;
          kpData.push({
            id: kpId,
            name: first.knowledgePoint.name,
            subjectName: first.subject.name,
            mistakeCount: mistakes.length,
            avgReviewedCount: avgReviewed,
          });
        });

        kpData.sort((a, b) => {
          const scoreA = a.mistakeCount * 2 + (3 - a.avgReviewedCount);
          const scoreB = b.mistakeCount * 2 + (3 - b.avgReviewedCount);
          return scoreB - scoreA;
        });

        const tasksPerDay = Math.min(5, kpData.length);
        const selectedKPs = kpData.slice(0, tasksPerDay);

        const newTasks: ReviewTask[] = selectedKPs.map((kp, index) => {
          const priority = index === 0 ? 3 : index <= 2 ? 2 : 1;
          return {
            id: `t-${generateId()}`,
            knowledgePointId: kp.id,
            knowledgePointName: kp.name,
            subjectName: kp.subjectName,
            date: today,
            status: "pending" as TaskStatus,
            priority,
            estimatedMinutes: kp.mistakeCount * 8 + 10,
            mistakeCount: kp.mistakeCount,
          };
        });

        set((state) => ({
          reviewTasks: [...newTasks, ...state.reviewTasks],
        }));
      },

      setSelectedSubjectId: (id) => set({ selectedSubjectId: id }),
      setSelectedBatchId: (id) => set({ selectedBatchId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setMasteryFilter: (filter) => set({ masteryFilter: filter }),
      setImportantFilter: (filter) => set({ importantFilter: filter }),

      getKnowledgePointMastery: (kpId) => {
        const state = get();
        const kpMistakes = state.mistakes.filter((m) => m.knowledgePoint.id === kpId);
        const mistakeCount = kpMistakes.length;
        const masteredCount = kpMistakes.filter((m) => m.mastered).length;
        const totalQuestions = mistakeCount + 5;
        const correctRate = totalQuestions > 0 ? (5 + masteredCount) / totalQuestions : 0.5;
        let level: "good" | "medium" | "weak" = "medium";
        if (correctRate >= 0.8) level = "good";
        else if (correctRate < 0.5) level = "weak";
        return { correctRate, mistakeCount, level };
      },

      getFilteredMistakes: () => {
        const state = get();
        let result = state.mistakes;
        if (state.selectedSubjectId) {
          result = result.filter((m) => m.subject.id === state.selectedSubjectId);
        }
        if (state.selectedBatchId) {
          result = result.filter((m) => m.importBatchId === state.selectedBatchId);
        }
        if (state.searchQuery) {
          const q = state.searchQuery.toLowerCase();
          result = result.filter(
            (m) =>
              m.question.content.toLowerCase().includes(q) ||
              m.knowledgePoint.name.toLowerCase().includes(q)
          );
        }
        if (state.masteryFilter !== "all") {
          result = result.filter((m) =>
            state.masteryFilter === "mastered" ? m.mastered : !m.mastered
          );
        }
        if (state.importantFilter) {
          result = result.filter((m) => m.important);
        }
        return result;
      },

      resetToMock: () => {
        set({
          mistakes: initialMistakes,
          reviewTasks: initialTasks,
          studyRecords: initialRecords,
          importBatches: [],
          selectedSubjectId: null,
          selectedBatchId: null,
          searchQuery: "",
          masteryFilter: "all",
          importantFilter: false,
        });
      },
    }),
    {
      name: "study-app-storage",
    }
  )
);

export const getErrorReasonLabel = (reason: ErrorReason): string => {
  const map: Record<ErrorReason, string> = {
    concept: "概念混淆",
    memory: "记忆偏差",
    careless: "粗心大意",
    method: "方法错误",
  };
  return map[reason];
};

export const getQuestionTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    single: "单选题",
    multiple: "多选题",
    judge: "判断题",
    short: "简答题",
  };
  return map[type] || type;
};
