import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  Target,
  ChevronRight,
  Zap,
  Lightbulb,
  CheckCircle2,
  BrainCircuit,
} from "lucide-react";
import { knowledgePoints, chapters, subjects } from "@/data/mock";
import { useStudyStore, getQuestionTypeLabel } from "@/store";

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mistakes, getKnowledgePointMastery } = useStudyStore();

  const kp = knowledgePoints.find((k) => k.id === id);
  if (!kp) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">知识点不存在</p>
        <button className="btn-primary" onClick={() => navigate("/graph")}>
          返回知识图谱
        </button>
      </div>
    );
  }

  const chapter = chapters.find((c) => c.id === kp.chapterId);
  const subject = subjects.find((s) => s.id === chapter?.subjectId);
  const mastery = getKnowledgePointMastery(kp.id);
  const relatedMistakes = mistakes.filter(
    (m) => m.knowledgePoint.id === kp.id
  );
  const relatedKps = kp.relatedIds
    .map((rid) => knowledgePoints.find((k) => k.id === rid))
    .filter(Boolean);

  const masteryColor =
    mastery.level === "good"
      ? "text-mastery-good"
      : mastery.level === "medium"
      ? "text-mastery-medium"
      : "text-mastery-weak";

  const masteryBg =
    mastery.level === "good"
      ? "bg-mastery-good"
      : mastery.level === "medium"
      ? "bg-mastery-medium"
      : "bg-mastery-weak";

  const recommendedQuestions = [
    "存货可变现净值的计算中，用于生产产品的材料应以产品售价为基础",
    "存货跌价准备转回的会计处理，转回金额不超过原计提金额",
    "不同存货计价方法对利润和资产负债表的影响分析",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/graph"
          className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回知识图谱
        </Link>
      </div>

      <div className="card-base p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="tag bg-primary-50 text-primary-700">
                {subject?.name}
              </span>
              <span className="tag bg-gray-100 text-gray-600">
                {chapter?.name}
              </span>
              <span
                className="tag"
                style={{
                  backgroundColor:
                    mastery.level === "good"
                      ? "#dcfce7"
                      : mastery.level === "medium"
                      ? "#fef3c7"
                      : "#fee2e2",
                  color:
                    mastery.level === "good"
                      ? "#16a34a"
                      : mastery.level === "medium"
                      ? "#d97706"
                      : "#dc2626",
                }}
              >
                {mastery.level === "good"
                  ? "掌握良好"
                  : mastery.level === "medium"
                  ? "需要加强"
                  : "薄弱环节"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 font-serif mb-2">
              {kp.name}
            </h1>
            <p className="text-gray-600 max-w-2xl">{kp.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">正确率</div>
            <div className={`text-4xl font-bold font-serif ${masteryColor}`}>
              {Math.round(mastery.correctRate * 100)}%
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">掌握度进度</span>
            <span className="text-gray-600 font-medium">
              {Math.round(mastery.correctRate * 100)} / 100
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${masteryBg}`}
              style={{ width: `${mastery.correctRate * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>薄弱</span>
            <span>需加强</span>
            <span>掌握</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <BookOpen className="w-4 h-4" />
              错题数量
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {relatedMistakes.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" />
              已掌握
            </div>
            <div className="text-2xl font-bold text-green-600">
              {relatedMistakes.filter((m) => m.mastered).length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <BrainCircuit className="w-4 h-4" />
              关联知识点
            </div>
            <div className="text-2xl font-bold text-primary-600">
              {kp.relatedIds.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Target className="w-4 h-4" />
              复习次数
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {relatedMistakes.reduce((acc, m) => acc + m.reviewedCount, 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800">常见陷阱</h3>
          </div>
          <div className="space-y-3">
            {kp.traps.map((trap, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-red-50/50 border border-red-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{trap}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="font-bold text-gray-800">推荐练习</h3>
          </div>
          <div className="space-y-3">
            {recommendedQuestions.map((q, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">{q}</p>
                </div>
              </div>
            ))}
            <button className="w-full btn-secondary mt-2">
              开始专项练习
            </button>
          </div>
        </div>
      </div>

      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-bold text-gray-800">相关错题</h3>
            <span className="tag bg-gray-100 text-gray-600">
              {relatedMistakes.length} 道
            </span>
          </div>
          <Link
            to="/mistakes"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {relatedMistakes.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag bg-gray-50 text-gray-500">
                      {getQuestionTypeLabel(m.question.type)}
                    </span>
                    {m.mastered && (
                      <span className="tag bg-green-50 text-green-600">
                        已掌握
                      </span>
                    )}
                    {m.important && (
                      <span className="tag bg-rose-50 text-rose-600">
                        重点
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">
                    {m.question.content}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400 mb-1">你的答案</div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-red-500 font-medium line-through">
                      {m.wrongAnswer}
                    </span>
                    <span className="text-gray-300">→</span>
                    <span className="text-green-600 font-bold">
                      {m.question.correctAnswer}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {relatedMistakes.length === 0 && (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-200 mx-auto mb-3" />
              <p className="text-gray-400">该知识点暂无错题，继续保持！</p>
            </div>
          )}
        </div>
      </div>

      <div className="card-base p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="font-bold text-gray-800">关联知识点</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {relatedKps.map((rk) => (
            <Link
              key={rk!.id}
              to={`/graph/${rk!.id}`}
              className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              {rk!.name}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ))}
          {relatedKps.length === 0 && (
            <p className="text-sm text-gray-400">暂无关联知识点</p>
          )}
        </div>
      </div>
    </div>
  );
}
