import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Mistake,
  ReviewTask,
  StudyRecord,
  ErrorReason,
  TaskStatus,
  ImportBatch,
  Question,
  Subject,
  Chapter,
  KnowledgePoint,
  QuestionType,
  KpMasterySnapshot,
} from "@/types";
import {
  mistakes as initialMistakes,
  reviewTasks as initialTasks,
  studyRecords as initialRecords,
  subjects,
  chapters,
  knowledgePoints,
  questions,
  examInfo,
} from "@/data/mock";

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

interface BatchStats {
  batch: ImportBatch;
  mistakes: Mistake[];
  totalCount: number;
  mistakeCount: number;
  correctCount: number;
  typeDistribution: { type: QuestionType; label: string; count: number }[];
  reasonDistribution: { reason: ErrorReason; label: string; count: number }[];
  kpDistribution: { id: string; name: string; count: number }[];
  newWeakPoints: { id: string; name: string; count: number; level: string }[];
  masteryTracking: KpMasterySnapshot[];
}

interface StudyActions {
  toggleMastered: (id: string) => void;
  toggleImportant: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  updateScreenshot: (id: string, screenshot: string) => void;
  deleteMistake: (id: string) => void;
  addMistakes: (newMistakes: Mistake[]) => void;
  importQuestions: (
    data: ImportQuestionData[],
    batchName: string,
    subjectId: string,
    chapterId: string
  ) => string;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  delayTask: (id: string) => void;
  generateDailyTasks: (forceReshuffle?: boolean) => void;
  rescheduleTodayTasks: () => void;
  getBatchStats: (batchId: string) => BatchStats | null;
  getMistakesByBatch: (batchId: string) => Mistake[];
  setSelectedSubjectId: (id: string | null) => void;
  setSelectedBatchId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setMasteryFilter: (filter: "all" | "mastered" | "unmastered") => void;
  setImportantFilter: (filter: boolean) => void;
  getKnowledgePointMastery: (kpId: string) => {
    correctRate: number;
    mistakeCount: number;
    level: "good" | "medium" | "weak";
  };
  getFilteredMistakes: () => Mistake[];
  getDaysUntilExam: () => number;
  getTaskSourceLabel: (task: ReviewTask) => string;
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

const computeDaysUntilExam = (today: string) => {
  try {
    const exam = new Date(examInfo.examDate);
    const t = new Date(today);
    return Math.max(
      0,
      Math.round((exam.getTime() - t.getTime()) / (1000 * 60 * 60 * 24))
    );
  } catch {
    return 60;
  }
};

const computeMasteryLevel = (correctRate: number): "good" | "medium" | "weak" => {
  if (correctRate >= 0.8) return "good";
  if (correctRate < 0.5) return "weak";
  return "medium";
};

export const useStudyStore = create<StudyState & StudyActions>()(
  persist(
    (set, get) => ({
      mistakes: initialMistakes,
      reviewTasks: initialTasks.map((t) => ({
        ...t,
        priorityLabel: (t.priority >= 3
          ? "high"
          : t.priority >= 2
          ? "medium"
          : "low") as "high" | "medium" | "low",
        source: "frequency" as "batch" | "frequency" | "delayed",
        weakLevel: "medium" as "weak" | "medium" | "good",
      })),
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
            m.id === id
              ? { ...m, mastered: !m.mastered, reviewedCount: m.reviewedCount + 1 }
              : m
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
        const today = new Date().toISOString().split("T")[0];
        const daysUntilExam = computeDaysUntilExam(today);

        const newMistakes: Mistake[] = [];
        const newMistakeKpIds = new Set<string>();

        data.forEach((item) => {
          if (item.isCorrect) return;

          const kp = findOrCreateKnowledgePoint(
            item.knowledgePointId,
            item.knowledgePointName,
            chapterId
          );
          newMistakeKpIds.add(kp.id);

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
          selectedSubjectId: subjectId,
        }));

        if (newMistakes.length > 0) {
          const currentState = get();
          const existingToday = currentState.reviewTasks.filter(
            (t) => t.date === today
          );
          const existingTodayKpMap = new Map<string, ReviewTask>();
          existingToday.forEach((t) => existingTodayKpMap.set(t.knowledgePointId, t));

          const kpMistakeMap = new Map<string, Mistake[]>();
          newMistakes.forEach((m) => {
            if (!kpMistakeMap.has(m.knowledgePoint.id)) {
              kpMistakeMap.set(m.knowledgePoint.id, []);
            }
            kpMistakeMap.get(m.knowledgePoint.id)!.push(m);
          });

          const updatedTasks: ReviewTask[] = [];
          const newTasks: ReviewTask[] = [];

          kpMistakeMap.forEach((mistakes, kpId) => {
            const existingTask = existingTodayKpMap.get(kpId);
            const mastery = get().getKnowledgePointMastery(kpId);
            const weakLevel = mastery.level;
            const allKpMistakes = get().mistakes.filter(
              (m) => m.knowledgePoint.id === kpId && !m.mastered
            );
            const mistakeCount = allKpMistakes.length;
            const avgReviewed =
              allKpMistakes.length > 0
                ? allKpMistakes.reduce((sum, m) => sum + m.reviewedCount, 0) /
                  allKpMistakes.length
                : 0;

            let basePriority = mistakeCount * 2;
            if (weakLevel === "weak") basePriority += 4;
            else if (weakLevel === "medium") basePriority += 2;
            if (daysUntilExam <= 14) basePriority += 3;
            else if (daysUntilExam <= 30) basePriority += 2;
            basePriority += Math.max(0, 3 - avgReviewed);

            const priority = Math.min(3, Math.max(1, Math.round(basePriority / 4)));

            if (existingTask) {
              updatedTasks.push({
                ...existingTask,
                priority,
                priorityLabel:
                  priority >= 3
                    ? "high"
                    : priority >= 2
                    ? "medium"
                    : "low",
                mistakeCount,
                estimatedMinutes: mistakeCount * 8 + 10,
                weakLevel,
                source: "batch",
                sourceBatchName: batchName,
                sourceBatchId: batchId,
                status:
                  existingTask.status === "completed" ? "completed" : "pending",
              });
            } else {
              newTasks.push({
                id: `t-${generateId()}`,
                knowledgePointId: kpId,
                knowledgePointName: mistakes[0].knowledgePoint.name,
                subjectName: subject.name,
                date: today,
                status: "pending",
                priority,
                priorityLabel:
                  priority >= 3
                    ? "high"
                    : priority >= 2
                    ? "medium"
                    : "low",
                estimatedMinutes: mistakeCount * 8 + 10,
                mistakeCount,
                source: "batch",
                sourceBatchName: batchName,
                sourceBatchId: batchId,
                weakLevel,
                lastReviewedDate: undefined,
                daysUntilExam,
              });
            }
          });

          if (updatedTasks.length > 0 || newTasks.length > 0) {
            set((state) => {
              const updatedTaskIds = new Set(updatedTasks.map((t) => t.id));
              const restTasks = state.reviewTasks.filter(
                (t) => t.date !== today || !updatedTaskIds.has(t.id)
              );
              const todayRemaining = existingToday.filter(
                (t) => !updatedTaskIds.has(t.id)
              );
              const mergedToday = [...updatedTasks, ...newTasks, ...todayRemaining];
              mergedToday.sort((a, b) => b.priority - a.priority);
              return {
                reviewTasks: [...mergedToday, ...restTasks],
              };
            });
          }
        }

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
              ? {
                  ...t,
                  date: tomorrow.toISOString().split("T")[0],
                  status: "delayed" as TaskStatus,
                  source: "delayed" as "batch" | "frequency" | "delayed",
                }
              : t
          ),
        }));
      },

      generateDailyTasks: (forceReshuffle = false) => {
        const state = get();
        const today = new Date().toISOString().split("T")[0];
        const daysUntilExam = computeDaysUntilExam(today);

        const existingTodayTasks = state.reviewTasks.filter((t) => t.date === today);
        if (existingTodayTasks.length > 0 && !forceReshuffle) return;

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
          masteryLevel: "good" | "medium" | "weak";
          score: number;
        }[] = [];

        kpMistakeMap.forEach((mistakes, kpId) => {
          const first = mistakes[0];
          const avgReviewed =
            mistakes.reduce((sum, m) => sum + m.reviewedCount, 0) /
            mistakes.length;
          const mastery = get().getKnowledgePointMastery(kpId);

          let score = 0;
          score += mistakes.length * 3;
          if (mastery.level === "weak") score += 8;
          else if (mastery.level === "medium") score += 4;
          if (daysUntilExam <= 14) score += 5;
          else if (daysUntilExam <= 30) score += 3;
          else if (daysUntilExam <= 60) score += 1;
          score += Math.max(0, 3 - avgReviewed);

          kpData.push({
            id: kpId,
            name: first.knowledgePoint.name,
            subjectName: first.subject.name,
            mistakeCount: mistakes.length,
            avgReviewedCount: avgReviewed,
            masteryLevel: mastery.level,
            score,
          });
        });

        kpData.sort((a, b) => b.score - a.score);

        const tasksPerDay = Math.min(5, kpData.length);
        const selectedKPs = kpData.slice(0, tasksPerDay);

        const maxScore = selectedKPs.length > 0 ? selectedKPs[0].score : 1;

        const newTasks: ReviewTask[] = selectedKPs.map((kp, index) => {
          const normalized = kp.score / maxScore;
          let priority: 1 | 2 | 3 = 1;
          if (normalized >= 0.75) priority = 3;
          else if (normalized >= 0.4) priority = 2;

          return {
            id: `t-${generateId()}`,
            knowledgePointId: kp.id,
            knowledgePointName: kp.name,
            subjectName: kp.subjectName,
            date: today,
            status: "pending",
            priority,
            priorityLabel:
              priority >= 3 ? "high" : priority >= 2 ? "medium" : "low",
            estimatedMinutes: kp.mistakeCount * 8 + 10,
            mistakeCount: kp.mistakeCount,
            source: "frequency",
            weakLevel: kp.masteryLevel,
            lastReviewedDate: kp.avgReviewedCount > 0 ? today : undefined,
            daysUntilExam,
          };
        });

        if (forceReshuffle) {
          set((state) => ({
            reviewTasks: [
              ...newTasks,
              ...state.reviewTasks.filter((t) => t.date !== today),
            ],
          }));
        } else {
          set((state) => ({
            reviewTasks: [...newTasks, ...state.reviewTasks],
          }));
        }
      },

      rescheduleTodayTasks: () => {
        get().generateDailyTasks(true);
      },

      getBatchStats: (batchId) => {
        const state = get();
        const batch = state.importBatches.find((b) => b.id === batchId);
        if (!batch) return null;

        const mistakes = state.mistakes.filter((m) => m.importBatchId === batchId);

        const typeMap = new Map<string, number>();
        mistakes.forEach((m) => {
          const t = m.question.type;
          typeMap.set(t, (typeMap.get(t) || 0) + 1);
        });
        const typeDistribution = Array.from(typeMap.entries()).map(
          ([type, count]) => ({
            type: type as QuestionType,
            label: getQuestionTypeLabel(type),
            count,
          })
        );

        const reasonMap = new Map<string, number>();
        mistakes.forEach((m) => {
          const r = m.errorReason;
          reasonMap.set(r, (reasonMap.get(r) || 0) + 1);
        });
        const reasonDistribution = Array.from(reasonMap.entries()).map(
          ([reason, count]) => ({
            reason: reason as ErrorReason,
            label: getErrorReasonLabel(reason as ErrorReason),
            count,
          })
        );

        const kpMap = new Map<
          string,
          { id: string; name: string; count: number }
        >();
        mistakes.forEach((m) => {
          const kp = m.knowledgePoint;
          if (!kpMap.has(kp.id)) {
            kpMap.set(kp.id, { id: kp.id, name: kp.name, count: 0 });
          }
          kpMap.get(kp.id)!.count++;
        });
        const kpDistribution = Array.from(kpMap.values()).sort(
          (a, b) => b.count - a.count
        );

        const newWeakPoints = kpDistribution
          .map((k) => {
            const mastery = get().getKnowledgePointMastery(k.id);
            return { ...k, level: mastery.level };
          })
          .filter((k) => k.level === "weak" || k.level === "medium");

        const masteryTracking: KpMasterySnapshot[] = kpDistribution.map((k) => {
          const allMistakesOfKp = state.mistakes.filter(
            (m) => m.knowledgePoint.id === k.id
          );
          const batchMistakes = allMistakesOfKp.filter(
            (m) => m.importBatchId === batchId
          );
          const masteredCount = allMistakesOfKp.filter((m) => m.mastered).length;
          const totalMistakes = allMistakesOfKp.length;

          const afterImportRate = batchMistakes.length > 0
            ? 5 / (5 + batchMistakes.length)
            : 0.8;
          const currentRate = totalMistakes > 0
            ? (5 + masteredCount) / (5 + totalMistakes)
            : 0.8;

          return {
            id: k.id,
            name: k.name,
            afterImport: computeMasteryLevel(afterImportRate),
            afterImportRate: Math.round(afterImportRate * 100),
            current: computeMasteryLevel(currentRate),
            currentRate: Math.round(currentRate * 100),
            totalMistakes,
            masteredCount,
          };
        });

        return {
          batch,
          mistakes,
          totalCount: batch.totalCount,
          mistakeCount: mistakes.length,
          correctCount: batch.totalCount - mistakes.length,
          typeDistribution,
          reasonDistribution,
          kpDistribution,
          newWeakPoints,
          masteryTracking,
        };
      },

      getMistakesByBatch: (batchId) => {
        return get().mistakes.filter((m) => m.importBatchId === batchId);
      },

      setSelectedSubjectId: (id) => set({ selectedSubjectId: id }),
      setSelectedBatchId: (id) => set({ selectedBatchId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setMasteryFilter: (filter) => set({ masteryFilter: filter }),
      setImportantFilter: (filter) => set({ importantFilter: filter }),

      getKnowledgePointMastery: (kpId) => {
        const state = get();
        const kpMistakes = state.mistakes.filter(
          (m) => m.knowledgePoint.id === kpId
        );
        const mistakeCount = kpMistakes.length;
        const masteredCount = kpMistakes.filter((m) => m.mastered).length;
        const totalQuestions = mistakeCount + 5;
        const correctRate =
          totalQuestions > 0 ? (5 + masteredCount) / totalQuestions : 0.5;
        let level: "good" | "medium" | "weak" = "medium";
        if (correctRate >= 0.8) level = "good";
        else if (correctRate < 0.5) level = "weak";
        return { correctRate, mistakeCount, level };
      },

      getFilteredMistakes: () => {
        const state = get();
        let result = state.mistakes;
        if (state.selectedSubjectId) {
          result = result.filter(
            (m) => m.subject.id === state.selectedSubjectId
          );
        }
        if (state.selectedBatchId) {
          result = result.filter(
            (m) => m.importBatchId === state.selectedBatchId
          );
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

      getDaysUntilExam: () => {
        return computeDaysUntilExam(new Date().toISOString().split("T")[0]);
      },

      getTaskSourceLabel: (task) => {
        if (task.source === "batch")
          return `来自导入「${task.sourceBatchName || "新批次"}」`;
        if (task.source === "delayed") return "昨日延期任务";
        if (task.source === "frequency") return "高频错题自动生成";
        return "系统推荐";
      },

      resetToMock: () => {
        set({
          mistakes: initialMistakes,
          reviewTasks: initialTasks.map((t) => ({
            ...t,
            priorityLabel: (t.priority >= 3
              ? "high"
              : t.priority >= 2
              ? "medium"
              : "low") as any,
            source: "frequency" as any,
            weakLevel: "medium" as any,
          })),
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
