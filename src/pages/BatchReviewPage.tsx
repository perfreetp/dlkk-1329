import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookX,
  CheckCircle2,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  ListChecks,
  Star,
  StarOff,
  CheckCircle2 as CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BrainCircuit,
  Image,
  Edit3,
  Trash2,
  X,
  Upload,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useStudyStore, getErrorReasonLabel, getQuestionTypeLabel } from "@/store";
import { subjects } from "@/data/mock";
import { useState, useRef, useEffect } from "react";

const REASON_COLORS: Record<string, string> = {
  concept: "#a855f7",
  memory: "#f59e0b",
  careless: "#3b82f6",
  method: "#f43f5e",
};

const TYPE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

export default function BatchReviewPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { getBatchStats, toggleMastered, toggleImportant, deleteMistake, updateNote, updateScreenshot } = useStudyStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMistakeId, setUploadingMistakeId] = useState<string | null>(null);

  const stats = useMemo(() => (batchId ? getBatchStats(batchId) : null), [batchId, getBatchStats]);

  const subjectName = useMemo(() => {
    if (!stats) return "";
    return subjects.find((s) => s.id === stats.batch.subjectId)?.name || "";
  }, [stats]);

  const correctRate = useMemo(() => {
    if (!stats) return 0;
    return Math.round((stats.correctCount / stats.totalCount) * 100);
  }, [stats]);

  const typePieData = useMemo(() => {
    if (!stats) return [];
    return stats.typeDistribution.map((t) => ({
      name: t.label,
      value: t.count,
    }));
  }, [stats]);

  const reasonBarData = useMemo(() => {
    if (!stats) return [];
    return stats.reasonDistribution.map((r) => ({
      name: r.label,
      数量: r.count,
      reason: r.reason,
    }));
  }, [stats]);

  const startEditNote = (id: string, currentNote: string) => {
    setEditingNoteId(id);
    setNoteText(currentNote);
  };

  const saveNote = (id: string) => {
    updateNote(id, noteText);
    setEditingNoteId(null);
    setNoteText("");
  };

  const handleUploadClick = (mistakeId: string) => {
    setUploadingMistakeId(mistakeId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingMistakeId) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateScreenshot(uploadingMistakeId, base64);
      setUploadingMistakeId(null);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteScreenshot = (id: string) => {
    updateScreenshot(id, "");
  };

  if (!stats) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <div className="card-base p-16 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-500 mb-1">未找到批次信息</h4>
          <p className="text-sm text-gray-400">请从导入成功页或错题本访问</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800 font-serif">
                {stats.batch.name}
              </h2>
              <span className="tag bg-blue-50 text-blue-700">导入批次回看</span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {subjectName} · {stats.batch.createdAt} · 共 {stats.totalCount} 题
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            className="btn-ghost"
            onClick={() => {
              useStudyStore.getState().setSelectedBatchId(batchId);
              navigate("/mistakes");
            }}
          >
            切换到错题本
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate("/plan")}
          >
            去安排复习
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <ListChecks className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-0.5">总题数</div>
              <div className="text-2xl font-bold text-gray-800 font-serif">
                {stats.totalCount}
              </div>
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-0.5">答对</div>
              <div className="text-2xl font-bold text-green-600 font-serif">
                {stats.correctCount}
                <span className="text-sm text-gray-400 font-normal ml-1">
                  ({correctRate}%)
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <BookX className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-0.5">答错</div>
              <div className="text-2xl font-bold text-red-500 font-serif">
                {stats.mistakeCount}
              </div>
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-0.5">薄弱知识点</div>
              <div className="text-2xl font-bold text-purple-600 font-serif">
                {stats.newWeakPoints.length}
                <span className="text-sm text-gray-400 font-normal ml-1">
                  个
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-gray-800">题型分布</h3>
          </div>
          <div className="h-52">
            {typePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {typePieData.map((_, index) => (
                      <Cell
                        key={`type-cell-${index}`}
                        fill={TYPE_COLORS[index % TYPE_COLORS.length]}
                      />
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
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                暂无数据
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {typePieData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length] }}
                />
                <span className="text-xs text-gray-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-gray-800">错误原因分布</h3>
          </div>
          <div className="h-52">
            {reasonBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar
                    dataKey="数量"
                    radius={[8, 8, 0, 0]}
                    barSize={36}
                  >
                    {reasonBarData.map((entry, index) => (
                      <Cell
                        key={`reason-cell-${index}`}
                        fill={REASON_COLORS[entry.reason] || "#94a3b8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                暂无错误
              </div>
            )}
          </div>
        </div>

        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-gray-800">薄弱知识点</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.newWeakPoints.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                暂无薄弱知识点
              </div>
            ) : (
              stats.newWeakPoints.map((kp) => {
                const rate = stats.mistakeCount > 0 ? (kp.count / stats.mistakeCount) * 100 : 0;
                const levelColor =
                  kp.level === "weak"
                    ? "text-red-600 bg-red-50"
                    : kp.level === "medium"
                    ? "text-amber-600 bg-amber-50"
                    : "text-green-600 bg-green-50";
                return (
                  <div key={kp.id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {kp.name}
                      </span>
                      <span className={`tag text-xs ${levelColor}`}>
                        {kp.level === "weak"
                          ? "薄弱"
                          : kp.level === "medium"
                          ? "一般"
                          : "良好"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            kp.level === "weak"
                              ? "bg-red-500"
                              : kp.level === "medium"
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(100, rate)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {kp.count}题
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="card-base">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">本批次错题 ({stats.mistakeCount})</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              独立展示本批次错题，不受错题本全局筛选影响
            </p>
          </div>
        </div>

        {stats.mistakes.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-200 mx-auto mb-3" />
            <h4 className="font-medium text-gray-500">本批次无错题</h4>
            <p className="text-sm text-gray-400 mt-1">全对了，做得很好！</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.mistakes.map((mistake, idx) => {
              const isExpanded = expandedId === mistake.id;
              return (
                <div
                  key={mistake.id}
                  className={`p-5 ${mistake.mastered ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <button
                        onClick={() => toggleImportant(mistake.id)}
                        className="transition-transform hover:scale-110"
                      >
                        {mistake.important ? (
                          <Star className="w-5 h-5 text-rose-500 fill-rose-500" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleMastered(mistake.id)}
                        className="transition-transform hover:scale-110"
                      >
                        {mistake.mastered ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="tag bg-gray-50 text-gray-500">
                          第 {idx + 1} 题
                        </span>
                        <span className="tag bg-blue-50 text-blue-700">
                          {mistake.subject.name}
                        </span>
                        <span className="tag bg-purple-50 text-purple-700">
                          {mistake.chapter.name}
                        </span>
                        <span className="tag bg-cyan-50 text-cyan-700 flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3" />
                          {mistake.knowledgePoint.name}
                        </span>
                        <span
                          className="tag"
                          style={{
                            backgroundColor:
                              REASON_COLORS[mistake.errorReason] + "20",
                            color: REASON_COLORS[mistake.errorReason],
                          }}
                        >
                          {getErrorReasonLabel(mistake.errorReason)}
                        </span>
                        <span className="tag bg-gray-50 text-gray-600">
                          {getQuestionTypeLabel(mistake.question.type)}
                        </span>
                        {mistake.screenshot && (
                          <span className="tag bg-green-50 text-green-600 flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            有截图
                          </span>
                        )}
                      </div>

                      <h4
                        className={`font-medium text-gray-800 mb-3 ${
                          mistake.mastered ? "line-through" : ""
                        }`}
                      >
                        {mistake.question.content}
                      </h4>

                      {mistake.question.options && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {mistake.question.options.map((opt, i) => {
                            const label = String.fromCharCode(65 + i);
                            const isWrong =
                              label === mistake.wrongAnswer &&
                              label !== mistake.question.correctAnswer;
                            const isCorrect =
                              label === mistake.question.correctAnswer;
                            return (
                              <div
                                key={i}
                                className={`px-3 py-2 rounded-lg text-sm ${
                                  isCorrect
                                    ? "bg-green-50 border border-green-200 text-green-700"
                                    : isWrong
                                    ? "bg-red-50 border border-red-200 text-red-700 line-through"
                                    : "bg-gray-50 text-gray-600"
                                }`}
                              >
                                <span className="font-bold mr-2">{label}.</span>
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : mistake.id)
                        }
                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {isExpanded ? (
                          <>
                            收起详情 <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            查看详情 <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-12 pb-2 mt-4 pt-4 border-t border-gray-100 bg-gray-50/50 -mx-5 -mb-5 -mt-4 ml-20 p-5 rounded-br-xl">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-800 text-sm">
                              订正笔记
                            </h5>
                            {editingNoteId !== mistake.id && (
                              <button
                                onClick={() =>
                                  startEditNote(mistake.id, mistake.note)
                                }
                                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                编辑
                              </button>
                            )}
                          </div>
                          {editingNoteId === mistake.id ? (
                            <div className="space-y-2">
                              <textarea
                                className="input-base min-h-[100px] text-sm"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="写下你的订正笔记..."
                              />
                              <div className="flex gap-2">
                                <button
                                  className="btn-primary text-sm py-1.5 px-3"
                                  onClick={() => saveNote(mistake.id)}
                                >
                                  保存
                                </button>
                                <button
                                  className="btn-ghost text-sm py-1.5 px-3"
                                  onClick={() => setEditingNoteId(null)}
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                              {mistake.note || "暂无笔记，点击编辑添加"}
                            </p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-800 text-sm">
                              题目解析
                            </h5>
                            <button
                              onClick={() => handleUploadClick(mistake.id)}
                              className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                            >
                              <Image className="w-3.5 h-3.5" />
                              {mistake.screenshot ? "更换截图" : "上传截图"}
                            </button>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-3">
                            <p className="text-sm text-gray-600">
                              {mistake.question.analysis || "暂无官方解析"}
                            </p>
                            {mistake.screenshot && (
                              <div className="relative group">
                                <img
                                  src={mistake.screenshot}
                                  alt="解析截图"
                                  className="w-full rounded-lg border border-gray-200"
                                />
                                <button
                                  onClick={() => handleDeleteScreenshot(mistake.id)}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                            <span>已复习 {mistake.reviewedCount} 次</span>
                            <button
                              onClick={() => deleteMistake(mistake.id)}
                              className="flex items-center gap-1 text-red-500 hover:text-red-600 ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
