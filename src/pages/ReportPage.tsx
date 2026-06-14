import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  Target,
  CalendarClock,
  BookOpen,
  Clock,
  Award,
  Flame,
  BrainCircuit,
  ChevronRight,
  Lightbulb,
  Upload,
  CheckCircle2,
  ArrowRight,
  BookX,
  BarChart3,
  History,
  Check,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useStudyStore } from "@/store";
import { knowledgePoints, examInfo, subjects } from "@/data/mock";
import type { KnowledgePoint, ImportBatch } from "@/types";

const masteryColors = ["#ef4444", "#f59e0b", "#10b981"];

export default function ReportPage() {
  const navigate = useNavigate();
  const {
    mistakes,
    reviewTasks,
    studyRecords,
    importBatches,
    getKnowledgePointMastery,
    getBatchStats,
    enterBatchContext,
  } = useStudyStore();

  const correctRateData = useMemo(() => {
    return studyRecords.slice(-14).map((r) => ({
      date: r.date.slice(5),
      正确率: Math.round((r.correctCount / r.totalCount) * 100),
      做题数: r.totalCount,
    }));
  }, [studyRecords]);

  const weakKpData = useMemo(() => {
    const data = knowledgePoints
      .map((kp) => {
        const mastery = getKnowledgePointMastery(kp.id);
        return {
          name: kp.name.length > 6 ? kp.name.slice(0, 6) + "..." : kp.name,
          fullName: kp.name,
          id: kp.id,
          错题数: mastery.mistakeCount,
          正确率: Math.round(mastery.correctRate * 100),
          level: mastery.level,
        };
      })
      .filter((d) => d.错题数 > 0)
      .sort((a, b) => b.错题数 - a.错题数)
      .slice(0, 8);
    return data;
  }, [getKnowledgePointMastery]);

  const completionData = useMemo(() => {
    const completed = reviewTasks.filter((t) => t.status === "completed").length;
    const pending = reviewTasks.filter(
      (t) => t.status === "pending" || t.status === "delayed"
    ).length;
    const skipped = reviewTasks.filter((t) => t.status === "skipped").length;
    return [
      { name: "已完成", value: completed, color: "#10b981" },
      { name: "待完成", value: pending, color: "#3b82f6" },
      { name: "已跳过", value: skipped, color: "#94a3b8" },
    ];
  }, [reviewTasks]);

  const stats = useMemo(() => {
    const totalQuestions = studyRecords.reduce(
      (acc, r) => acc + r.totalCount,
      0
    );
    const totalCorrect = studyRecords.reduce(
      (acc, r) => acc + r.correctCount,
      0
    );
    const avgCorrectRate =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;

    const today = new Date();
    const exam = new Date(examInfo.examDate);
    const daysUntil = Math.ceil(
      (exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const last7Rate =
      studyRecords
        .slice(-7)
        .reduce((acc, r) => acc + r.correctCount / r.totalCount, 0) / 7;
    const prev7Rate =
      studyRecords
        .slice(-14, -7)
        .reduce((acc, r) => acc + r.correctCount / r.totalCount, 0) / 7;
    const rateChange = Math.round((last7Rate - prev7Rate) * 100);

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

    const totalReviewMinutes = reviewTasks
      .filter((t) => t.status === "completed")
      .reduce((acc, t) => acc + t.estimatedMinutes, 0);

    const masteredKp = knowledgePoints.filter(
      (kp) => getKnowledgePointMastery(kp.id).level === "good"
    ).length;
    const totalKp = knowledgePoints.length;

    const totalImported = importBatches.reduce(
      (acc, b) => acc + b.totalCount,
      0
    );
    const totalMistakesFromImport = importBatches.reduce(
      (acc, b) => acc + b.mistakeCount,
      0
    );

    return {
      totalQuestions,
      avgCorrectRate,
      daysUntil,
      rateChange,
      streak,
      totalReviewMinutes,
      masteredKp,
      totalKp,
      totalImported,
      totalMistakesFromImport,
    };
  }, [studyRecords, reviewTasks, getKnowledgePointMastery, importBatches]);

  const importTimeline = useMemo(() => {
    const sortedBatches = [...importBatches].sort(
      (a, b) => (a.createdAt < b.createdAt ? 1 : -1)
    );
    return sortedBatches.map((b) => {
      const subject = subjects.find((s) => s.id === b.subjectId)?.name || "";
      const coveredTaskCount = reviewTasks.filter(
        (t) =>
          t.sourceBatchId === b.id ||
          (t.date >= b.createdAt &&
            mistakes
              .filter((m) => m.importBatchId === b.id)
              .some((m) => m.knowledgePoint.id === t.knowledgePointId))
      ).length;
      const batchMistakes = mistakes.filter((m) => m.importBatchId === b.id);
      const masteredAfterImport = batchMistakes.filter((m) => m.mastered)
        .length;
      const batchStats = getBatchStats(b.id);
      return {
        ...b,
        subject,
        coveredTasks: coveredTaskCount,
        masteredCount: masteredAfterImport,
        masteredRate:
          batchMistakes.length > 0
            ? Math.round((masteredAfterImport / batchMistakes.length) * 100)
            : 0,
        weakPoints: batchStats?.newWeakPoints || [],
        masteryTracking: batchStats?.masteryTracking || [],
      };
    });
  }, [importBatches, mistakes, reviewTasks, getBatchStats]);

  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const masteryTrendData = useMemo(() => {
    const sortedBatches = [...importBatches].sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : 1
    );
    let cumulatedGood = 0;
    let cumulatedMedium = 0;
    let cumulatedWeak = 0;

    const kpLevels: Record<string, "good" | "medium" | "weak"> = {};
    const baseLevels = knowledgePoints.map((kp) => {
      const mastery = getKnowledgePointMastery(kp.id);
      return { id: kp.id, level: mastery.level };
    });
    baseLevels.forEach((k) => {
      kpLevels[k.id] = k.level;
    });

    return sortedBatches.map((b, idx) => {
      const batchMistakes = mistakes.filter((m) => m.importBatchId === b.id);
      batchMistakes.forEach((m) => {
        const mastery = getKnowledgePointMastery(m.knowledgePoint.id);
        kpLevels[m.knowledgePoint.id] = mastery.level;
      });

      let good = 0;
      let medium = 0;
      let weak = 0;
      Object.values(kpLevels).forEach((lvl) => {
        if (lvl === "good") good++;
        else if (lvl === "medium") medium++;
        else weak++;
      });

      return {
        batch: `第${idx + 1}次导入`,
        掌握良好: good,
        掌握一般: medium,
        掌握薄弱: weak,
      };
    });
  }, [importBatches, mistakes, getKnowledgePointMastery]);

  const suggestions = useMemo(() => {
    const tips: string[] = [];
    const weakKps = weakKpData.slice(0, 3);
    if (weakKps.length > 0) {
      tips.push(
        `优先攻克「${weakKps[0].fullName}」，该知识点错题最多，需要加强练习`
      );
    }
    if (stats.rateChange < 5) {
      tips.push("近两周正确率提升放缓，建议调整复习策略，增加专项训练");
    }
    if (stats.streak >= 3) {
      tips.push(`连续打卡${stats.streak}天，保持良好的学习习惯！继续加油`);
    }
    if (stats.daysUntil < 30 && stats.daysUntil > 0) {
      tips.push("距离考试不足30天，建议开始模拟真题训练，查漏补缺");
    }
    if (mistakes.filter((m) => m.errorReason === "concept").length > 2) {
      tips.push("概念类错误较多，建议回归教材，夯实基础知识");
    }
    if (importBatches.length > 0) {
      const recentBatch = importTimeline[0];
      if (recentBatch && recentBatch.mistakeCount > 0 && recentBatch.masteredRate < 30) {
        tips.push(
          `最近导入的「${recentBatch.name}」错题掌握度仅${recentBatch.masteredRate}%，建议安排复习`
        );
      }
    }
    return tips.slice(0, 4);
  }, [weakKpData, stats, mistakes, importBatches, importTimeline]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-6 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-500">累计做题</div>
          </div>
          <div className="text-2xl font-bold text-gray-800 font-serif">
            {stats.totalQuestions}
            <span className="text-sm font-normal text-gray-400 ml-1">题</span>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm text-gray-500">平均正确率</div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600 font-serif">
              {stats.avgCorrectRate}%
            </span>
            <span
              className={`text-xs font-medium ${stats.rateChange >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {stats.rateChange >= 0 ? "↑" : "↓"}
              {Math.abs(stats.rateChange)}%
            </span>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-sm text-gray-500">连续打卡</div>
          </div>
          <div className="text-2xl font-bold text-orange-500 font-serif">
            {stats.streak}
            <span className="text-sm font-normal text-gray-400 ml-1">天</span>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-500">复习时长</div>
          </div>
          <div className="text-2xl font-bold text-purple-600 font-serif">
            {Math.floor(stats.totalReviewMinutes / 60)}
            <span className="text-sm font-normal text-gray-400 ml-1">
              小时
            </span>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-sm text-gray-500">掌握知识点</div>
          </div>
          <div className="text-2xl font-bold text-teal-600 font-serif">
            {stats.masteredKp}
            <span className="text-sm font-normal text-gray-400 ml-1">
              / {stats.totalKp}
            </span>
          </div>
        </div>
        <div className="card-base p-5 bg-gradient-to-br from-primary-800 to-primary-900 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm text-white/70">距离考试</div>
          </div>
          <div className="text-2xl font-bold font-serif">
            {stats.daysUntil}
            <span className="text-sm font-normal text-white/70 ml-1">天</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-gray-800">正确率趋势（近14天）</h3>
            </div>
            <span className="text-sm text-gray-400">每日正确率 (%)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={correctRateData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  domain={[40, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="正确率"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#1d4ed8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-gray-800">复习完成率</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-gray-800">反复出错知识点排行</h3>
            </div>
            <span className="text-sm text-gray-400">错题数量</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weakKpData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} 道`,
                    name === "错题数" ? "错题数" : "正确率",
                  ]}
                />
                <Bar
                  dataKey="错题数"
                  radius={[0, 8, 8, 0]}
                  barSize={20}
                >
                  {weakKpData.map((entry, index) => (
                    <Cell
                      key={`weak-${index}`}
                      fill={
                        entry.level === "weak"
                          ? "#ef4444"
                          : entry.level === "medium"
                          ? "#f59e0b"
                          : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-800">学习建议</h3>
          </div>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-start gap-3"
              >
                <Award className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>

          {stats.daysUntil > 0 && stats.daysUntil <= 60 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <CalendarClock className="w-4 h-4 text-primary-600" />
                <h4 className="font-bold text-primary-800 text-sm">
                  考试倒计时提醒
                </h4>
              </div>
              <p className="text-xs text-primary-700 leading-relaxed">
                距离 {examInfo.examName} 还有 {stats.daysUntil} 天，建议：
              </p>
              <ul className="mt-2 space-y-1">
                <li className="text-xs text-primary-600 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  每天保持至少 2 小时高质量复习
                </li>
                <li className="text-xs text-primary-600 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  重点攻克薄弱知识点，查漏补缺
                </li>
                <li className="text-xs text-primary-600 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  每周进行 1-2 次模拟考试练习
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {importTimeline.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-gray-800">导入时间线 & 复习覆盖</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-green-500" /> 复习覆盖
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> 已掌握
                </span>
              </div>
            </div>
            <div className="space-y-3 max-h-[520px] overflow-y-auto">
              {importTimeline.map((b) => {
                const isExpanded = expandedBatchId === b.id;
                return (
                  <div
                    key={b.id}
                    className="rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer flex items-start gap-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedBatchId(isExpanded ? null : b.id);
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800 truncate">
                            {b.name}
                          </span>
                          <span className="tag bg-blue-50 text-blue-700 text-xs">
                            {b.subject}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {b.createdAt}
                          </span>
                          <button
                            className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 hover:text-primary-600 transition-colors ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              enterBatchContext(b.id);
                              navigate(`/batch/${b.id}`);
                            }}
                            title="查看批次详情"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                          <span>共 {b.totalCount} 题</span>
                          <span className="text-red-500">错题 {b.mistakeCount}</span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            复习覆盖 {b.coveredTasks}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            掌握度 {b.masteredRate}%
                          </span>
                        </div>
                        <div className="ml-0 mt-2">
                          <div className="h-2 rounded-full bg-gray-200 overflow-hidden flex">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${b.masteredRate}%` }}
                            />
                            <div
                              className="h-full bg-blue-400"
                              style={{
                                width: `${Math.min(
                                  100 - b.masteredRate,
                                  b.coveredTasks * 10
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-200/50 pt-3 space-y-3 animate-slide-up">
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            本批次薄弱知识点（点击去详情查看掌握度变化）
                          </div>
                          {b.weakPoints.length === 0 ? (
                            <div className="text-xs text-gray-400 py-2 text-center">
                              本批次暂无薄弱知识点
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {b.weakPoints.map((kp) => {
                                const tracking = b.masteryTracking.find(
                                  (t) => t.id === kp.id
                                );
                                const levelColor =
                                  kp.level === "weak"
                                    ? "text-red-600 bg-red-50 border-red-100"
                                    : kp.level === "medium"
                                    ? "text-amber-600 bg-amber-50 border-amber-100"
                                    : "text-green-600 bg-green-50 border-green-100";
                                return (
                                  <div
                                    key={kp.id}
                                    className="p-2.5 rounded-lg bg-white border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      enterBatchContext(b.id);
                                      navigate(`/graph/${kp.id}`);
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-sm font-medium text-gray-800 truncate flex-1">
                                        {kp.name}
                                      </span>
                                      <span className={`tag text-[10px] ${levelColor} ml-2`}>
                                        {kp.level === "weak"
                                          ? "薄弱"
                                          : kp.level === "medium"
                                          ? "一般"
                                          : "良好"}
                                      </span>
                                    </div>
                                    {tracking && (
                                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                        <span>
                                          导入后: {tracking.afterImportRate}%
                                        </span>
                                        <ArrowRight className="w-3 h-3" />
                                        <span
                                          className={
                                            tracking.currentRate >=
                                            tracking.afterImportRate
                                              ? "text-green-600 font-medium"
                                              : "text-red-500 font-medium"
                                          }
                                        >
                                          当前: {tracking.currentRate}%
                                        </span>
                                      </div>
                                    )}
                                    <div className="mt-1.5 flex items-center gap-2">
                                      <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            kp.level === "weak"
                                              ? "bg-red-500"
                                              : kp.level === "medium"
                                              ? "bg-amber-500"
                                              : "bg-green-500"
                                          }`}
                                          style={{
                                            width: `${
                                              tracking
                                                ? tracking.currentRate
                                                : (kp.count /
                                                    (b.mistakeCount || 1)) *
                                                  100
                                            }%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-gray-400 w-6 text-right">
                                        {kp.count}题
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            className="btn-secondary text-xs py-1.5 px-3 flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              enterBatchContext(b.id);
                              navigate(`/batch/${b.id}`);
                            }}
                          >
                            批次回看详情
                          </button>
                          <button
                            className="btn-primary text-xs py-1.5 px-3 flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              enterBatchContext(b.id);
                              navigate(`/plan`);
                            }}
                          >
                            去安排复习
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-gray-800">掌握度变化</h3>
            </div>
            {masteryTrendData.length === 0 ? (
              <div className="py-16 text-center">
                <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">暂无导入记录</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={masteryTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="batch"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="掌握良好"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.4}
                    />
                    <Area
                      type="monotone"
                      dataKey="掌握一般"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.4}
                    />
                    <Area
                      type="monotone"
                      dataKey="掌握薄弱"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
