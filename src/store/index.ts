import { create } from "zustand";
import type { Mistake, ReviewTask, StudyRecord, ErrorReason, TaskStatus } from "@/types";
import { mistakes as initialMistakes, reviewTasks as initialTasks, studyRecords as initialRecords } from "@/data/mock";

interface StudyState {
  mistakes: Mistake[];
  reviewTasks: ReviewTask[];
  studyRecords: StudyRecord[];
  selectedSubjectId: string | null;
  searchQuery: string;
  masteryFilter: "all" | "mastered" | "unmastered";
  importantFilter: boolean;
}

interface StudyActions {
  toggleMastered: (id: string) => void;
  toggleImportant: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  deleteMistake: (id: string) => void;
  addMistakes: (newMistakes: Mistake[]) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  delayTask: (id: string) => void;
  setSelectedSubjectId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setMasteryFilter: (filter: "all" | "mastered" | "unmastered") => void;
  setImportantFilter: (filter: boolean) => void;
  getKnowledgePointMastery: (kpId: string) => { correctRate: number; mistakeCount: number; level: "good" | "medium" | "weak" };
  getFilteredMistakes: () => Mistake[];
}

export const useStudyStore = create<StudyState & StudyActions>((set, get) => ({
  mistakes: initialMistakes,
  reviewTasks: initialTasks,
  studyRecords: initialRecords,
  selectedSubjectId: null,
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

  deleteMistake: (id) =>
    set((state) => ({
      mistakes: state.mistakes.filter((m) => m.id !== id),
    })),

  addMistakes: (newMistakes) =>
    set((state) => ({
      mistakes: [...newMistakes, ...state.mistakes],
    })),

  updateTaskStatus: (id, status) =>
    set((state) => ({
      reviewTasks: state.reviewTasks.map((t) =>
        t.id === id ? { ...t, status } : t
      ),
    })),

  delayTask: (id) => {
    const state = get();
    const task = state.reviewTasks.find((t) => t.id === id);
    if (!task) return;
    const tomorrow = new Date(task.date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    set((state) => ({
      reviewTasks: state.reviewTasks.map((t) =>
        t.id === id
          ? { ...t, date: tomorrow.toISOString().split("T")[0], status: "pending" as TaskStatus }
          : t
      ),
    }));
  },

  setSelectedSubjectId: (id) => set({ selectedSubjectId: id }),
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
}));

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
