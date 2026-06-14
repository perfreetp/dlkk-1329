import { useMemo, useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Target,
  TrendingUp,
  SkipForward,
  Pause,
  PlayCircle,
  Zap,
  AlertCircle,
  RefreshCw,
  Download,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useStudyStore, getErrorReasonLabel, getQuestionTypeLabel } from "@/store";
import type { ReviewTask, TaskStatus } from "@/types";

const today = new Date().toISOString().split("T")[0];
const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
})();

const priorityColors: Record<number, { bg: string; text: string; label: string; dot: string }> = {
  1: { bg: "bg-green-50", text: "text-green-600", label: "低", dot: "bg-green-500" },
  2: { bg: "bg-amber-50", text: "text-amber-600", label: "中", dot: "bg-amber-500" },
  3: { bg: "bg-red-50", text: "text-red-600", label: "高", dot: "bg-red-500" },
};

const sourceColors: Record<string, { bg: string; text: string; icon: any }> = {
  batch: { bg: "bg-blue-50", text: "text-blue-600", icon: Download },
  frequency: { bg: "bg-purple-50", text: "text-purple-600", icon: Sparkles },
  delayed: { bg: "bg-orange-50", text: "text-orange-600", icon: SkipForward },
};

const weakLevelColors: Record<string, string> = {
  weak: "bg-red-500",
  medium: "bg-amber-500",
  good: "bg-green-500",
};

export default function PlanPage() {
  const {
    reviewTasks,
    updateTaskStatus,
    delayTask,
    generateDailyTasks,
    rescheduleTodayTasks,
    getTaskSourceLabel,
  } = useStudyStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow" | "week">("today");

  useEffect(() => {
    generateDailyTasks();
  }, [generateDailyTasks]);

  const todayTasks = useMemo(
    () =>
      reviewTasks
        .filter((t) => t.date === today)
        .sort((a, b) => b.priority - a.priority),
    [reviewTasks]
  );

  const tomorrowTasks = useMemo(
    () =>
      reviewTasks
        .filter((t) => t.date === tomorrow)
        .sort((a, b) => b.priority - a.priority),
    [reviewTasks]
  );

  const weekTasks = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return reviewTasks.filter((t) => {
      const d = new Date(t.date);
      return d >= weekStart && d <= weekEnd;
    });
  }, [reviewTasks]);

  const weekTaskByDay = useMemo(() => {
    const groups: Record<string, ReviewTask[]> = {};
    weekTasks.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => b.priority - a.priority);
    });
    return groups;
  }, [weekTasks]);

  const todayStats = useMemo(() => {
    const completed = todayTasks.filter((t) => t.status === "completed").length;
    const pending = todayTasks.filter(
      (t) => t.status === "pending" || t.status === "delayed"
    ).length;
    const minutes = pending > 0
      ? todayTasks
          .filter((t) => t.status !== "completed" && t.status !== "skipped")
          .reduce((acc, t) => acc + t.estimatedMinutes, 0)
      : 0;
    return { completed, pending, total: todayTasks.length, minutes };
  }, [todayTasks]);

  const weekStats = useMemo(() => {
    const weekCompleted = weekTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const weekTotal = weekTasks.length;
    const weekRate = weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0;

    let streak = 0;
    const sortedTasks = [...reviewTasks]
      .filter((t) => t.status === "completed")
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const uniqueDates = new Set(sortedTasks.map((t) => t.date));
    let checkDate = new Date();
    while (uniqueDates.has(checkDate.toISOString().split("T")[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { weekRate, streak, weekCompleted, weekTotal };
  }, [weekTasks, reviewTasks]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: {
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      tasks: ReviewTask[];
      completedCount: number;
      totalCount: number;
    }[] = [];

    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: d.toISOString().split("T")[0],
        day: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
        tasks: [],
        completedCount: 0,
        totalCount: 0,
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split("T")[0];
      const dayTasks = reviewTasks.filter((t) => t.date === dateStr);
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: true,
        isToday: dateStr === today,
        tasks: dayTasks,
        completedCount: dayTasks.filter((t) => t.status === "completed")
          .length,
        totalCount: dayTasks.length,
      });
    }

    return days;
  }, [currentMonth, reviewTasks]);

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const getStatusBadge = (status: TaskStatus) => {
    const map: Record<TaskStatus, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-gray-100", text: "text-gray-600", label: "待完成" },
      completed: { bg: "bg-green-100", text: "text-green-700", label: "已完成" },
      delayed: { bg: "bg-amber-100", text: "text-amber-700", label: "已延期" },
      skipped: { bg: "bg-gray-50", text: "text-gray-400", label: "已跳过" },
    };
    const s = map[status];
    return <span className={`tag ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const renderTaskCard = (task: ReviewTask, idx: number) => {
    const priority = priorityColors[task.priority];
    const source = sourceColors[task.source];
    const SourceIcon = source?.icon || Sparkles;
    return (
      <div
        key={task.id}
        className={`p-4 rounded-xl border transition-all ${
          task.status === "completed"
            ? "bg-green-50/50 border-green-100 opacity-75"
            : task.status === "skipped"
            ? "bg-gray-50 border-gray-100 opacity-50"
            : "bg-white border-gray-100 hover:border-primary-200 hover:shadow-sm"
        }`}
        style={{ animationDelay: `${idx * 50}ms` }}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={() =>
              updateTaskStatus(
                task.id,
                task.status === "completed" ? "pending" : "completed"
              )
            }
            className="mt-0.5 transition-transform hover:scale-110"
          >
            {task.status === "completed" ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-primary-500 transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`tag ${priority.bg} ${priority.text} flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                <Zap className="w-3 h-3" />
                {priority.label}优先级
              </span>
              <span className="tag bg-gray-50 text-gray-600">
                {task.subjectName}
              </span>
              {task.date === today && getStatusBadge(task.status)}
              {task.source && (
                <span className={`tag ${source.bg} ${source.text} flex items-center gap-1`}>
                  <SourceIcon className="w-3 h-3" />
                  {getTaskSourceLabel(task)}
                </span>
              )}
              {task.weakLevel && (
                <span className="tag bg-gray-50 text-gray-500 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${weakLevelColors[task.weakLevel]}`} />
                  掌握度：
                  {task.weakLevel === "weak"
                    ? "薄弱"
                    : task.weakLevel === "medium"
                    ? "一般"
                    : "良好"}
                </span>
              )}
            </div>
            <h4
              className={`font-medium text-gray-800 ${
                task.status === "completed" ? "line-through text-gray-500" : ""
              }`}
            >
              复习「{task.knowledgePointName}」
            </h4>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                预计 {task.estimatedMinutes} 分钟
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {task.mistakeCount} 道错题
              </span>
              {task.daysUntilExam !== undefined && task.daysUntilExam <= 30 && (
                <span className="flex items-center gap-1 text-orange-500">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  考试倒计时 {task.daysUntilExam} 天
                </span>
              )}
            </div>
          </div>

          {task.status !== "completed" && task.status !== "skipped" && (
            <div className="flex items-center gap-1">
              <button
                className="w-8 h-8 rounded-lg hover:bg-green-50 flex items-center justify-center text-green-600 transition-colors"
                onClick={() => updateTaskStatus(task.id, "completed")}
                title="完成打卡"
              >
                <PlayCircle className="w-4 h-4" />
              </button>
              <button
                className="w-8 h-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-amber-600 transition-colors"
                onClick={() => delayTask(task.id)}
                title="延期至明天"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                onClick={() => updateTaskStatus(task.id, "skipped")}
                title="跳过"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const formatWeekDateLabel = (date: string) => {
    const d = new Date(date);
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    const label = `周${weekDays[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
    if (date === today) return `${label} · 今天`;
    if (date === tomorrow) return `${label} · 明天`;
    return label;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-0.5">今日完成</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800 font-serif">
                  {todayStats.completed}
                </span>
                <span className="text-gray-400">/ {todayStats.total}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-0.5">本周完成率</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-green-600 font-serif">
                  {Math.round(weekStats.weekRate)}
                </span>
                <span className="text-gray-400">%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-0.5">连续打卡</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-orange-500 font-serif">
                  {weekStats.streak}
                </span>
                <span className="text-gray-400">天</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-0.5">今日还需</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-purple-600 font-serif">
                  {todayStats.minutes}
                </span>
                <span className="text-gray-400">分钟</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-gray-800">复习任务</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  <button
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "today" ? "bg-primary-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    onClick={() => setActiveTab("today")}
                  >
                    今天 ({todayTasks.length})
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "tomorrow" ? "bg-primary-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    onClick={() => setActiveTab("tomorrow")}
                  >
                    明天 ({tomorrowTasks.length})
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "week" ? "bg-primary-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    onClick={() => setActiveTab("week")}
                  >
                    本周 ({weekTasks.length})
                  </button>
                </div>
                <button
                  onClick={rescheduleTodayTasks}
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
                  title="重新排今日任务"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  重排
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activeTab === "today" && (
                <>
                  {todayTasks.length === 0 ? (
                    <div className="py-16 text-center">
                      <CheckCircle2 className="w-16 h-16 text-green-200 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-500 mb-1">
                        太棒了！
                      </h4>
                      <p className="text-sm text-gray-400">
                        今日暂无复习任务，继续保持
                      </p>
                    </div>
                  ) : (
                    todayTasks.map((t, i) => renderTaskCard(t, i))
                  )}
                </>
              )}

              {activeTab === "tomorrow" && (
                <>
                  {tomorrowTasks.length === 0 ? (
                    <div className="py-16 text-center">
                      <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-500 mb-1">
                        明天暂无安排
                      </h4>
                      <p className="text-sm text-gray-400">
                        延期的任务或新导入错题将自动加入
                      </p>
                    </div>
                  ) : (
                    tomorrowTasks.map((t, i) => renderTaskCard(t, i))
                  )}
                </>
              )}

              {activeTab === "week" && (
                <>
                  {weekTasks.length === 0 ? (
                    <div className="py-16 text-center">
                      <CalendarDays className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-500 mb-1">
                        本周暂无安排
                      </h4>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(weekTaskByDay)
                        .sort(([a], [b]) => (a < b ? -1 : 1))
                        .map(([date, tasks]) => (
                          <div key={date}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-px flex-1 bg-gray-100" />
                              <span className="text-xs font-medium text-gray-400">
                                {formatWeekDateLabel(date)}
                              </span>
                              <div className="h-px flex-1 bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                              {tasks.map((t, i) => renderTaskCard(t, i))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-gray-800">
                  {currentMonth.getFullYear()}年{" "}
                  {currentMonth.getMonth() + 1}月
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  onClick={prevMonth}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  onClick={nextMonth}
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-gray-400 py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center text-sm transition-all cursor-pointer relative ${
                    !day.isCurrentMonth
                      ? "text-gray-300"
                      : day.isToday
                      ? "bg-primary-800 text-white shadow-md"
                      : day.totalCount > 0
                      ? "hover:bg-primary-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className={day.isToday ? "font-bold" : "font-medium"}>
                    {day.day}
                  </span>
                  {day.totalCount > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          day.isToday
                            ? "bg-white"
                            : day.completedCount === day.totalCount
                            ? "bg-green-500"
                            : "bg-primary-400"
                        }`}
                      />
                      {day.totalCount > 1 && (
                        <span
                          className={`text-[10px] ${
                            day.isToday ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {day.completedCount}/{day.totalCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span>全部完成</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-full bg-primary-400" />
                <span>有待完成</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-full bg-primary-800" />
                <span>今天</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
