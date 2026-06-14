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
} from "lucide-react";
import { useStudyStore } from "@/store";
import type { ReviewTask, TaskStatus } from "@/types";

const today = new Date().toISOString().split("T")[0];

const priorityColors: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-green-50", text: "text-green-600", label: "低" },
  2: { bg: "bg-amber-50", text: "text-amber-600", label: "中" },
  3: { bg: "bg-red-50", text: "text-red-600", label: "高" },
};

export default function PlanPage() {
  const { reviewTasks, updateTaskStatus, delayTask, generateDailyTasks } = useStudyStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    generateDailyTasks();
  }, [generateDailyTasks]);

  const todayTasks = useMemo(
    () => reviewTasks.filter((t) => t.date === today),
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

  const stats = useMemo(() => {
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

    const todayCompleted = todayTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const todayTotal = todayTasks.length;
    const todayMinutes = todayTasks
      .filter((t) => t.status !== "completed" && t.status !== "skipped")
      .reduce((acc, t) => acc + t.estimatedMinutes, 0);

    return { weekRate, streak, todayCompleted, todayTotal, todayMinutes };
  }, [weekTasks, reviewTasks, todayTasks]);

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-0.5">今日任务</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-800 font-serif">
                  {stats.todayCompleted}
                </span>
                <span className="text-gray-400">/ {stats.todayTotal}</span>
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
                  {Math.round(stats.weekRate)}
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
                  {stats.streak}
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
              <div className="text-sm text-gray-500 mb-0.5">今日预计</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-purple-600 font-serif">
                  {stats.todayMinutes}
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
                <h3 className="font-bold text-gray-800">今日任务</h3>
                <span className="tag bg-primary-50 text-primary-700">
                  {todayTasks.filter((t) => t.status !== "completed" && t.status !== "skipped").length} 项待完成
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {todayTasks.map((task, i) => {
                const priority = priorityColors[task.priority];
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
                    style={{ animationDelay: `${i * 50}ms` }}
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`tag ${priority.bg} ${priority.text}`}>
                            <Zap className="w-3 h-3 mr-1" />
                            {priority.label}优先级
                          </span>
                          <span className="tag bg-gray-50 text-gray-600">
                            {task.subjectName}
                          </span>
                          {getStatusBadge(task.status)}
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
              })}

              {todayTasks.length === 0 && (
                <div className="py-16 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-200 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-500 mb-1">
                    太棒了！
                  </h4>
                  <p className="text-sm text-gray-400">今日暂无复习任务，继续保持</p>
                </div>
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
                      : day.tasks.length > 0
                      ? "hover:bg-primary-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={
                      day.isToday ? "font-bold" : "font-medium"
                    }
                  >
                    {day.day}
                  </span>
                  {day.tasks.length > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          day.isToday
                            ? "bg-white"
                            : day.completedCount === day.tasks.length
                            ? "bg-green-500"
                            : "bg-primary-400"
                        }`}
                      />
                      {day.tasks.length > 1 && (
                        <span
                          className={`text-[10px] ${
                            day.isToday ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {day.tasks.length}
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
