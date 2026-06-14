import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  StarOff,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BrainCircuit,
  Image,
  Search,
  Filter,
  BookMarked,
  BookX,
} from "lucide-react";
import { useStudyStore, getErrorReasonLabel, getQuestionTypeLabel } from "@/store";
import { subjects } from "@/data/mock";

const errorReasonColors: Record<string, string> = {
  concept: "bg-purple-50 text-purple-700",
  memory: "bg-amber-50 text-amber-700",
  careless: "bg-blue-50 text-blue-700",
  method: "bg-rose-50 text-rose-700",
};

export default function MistakesPage() {
  const {
    mistakes,
    getFilteredMistakes,
    toggleMastered,
    toggleImportant,
    deleteMistake,
    updateNote,
    selectedSubjectId,
    searchQuery,
    masteryFilter,
    importantFilter,
    setSelectedSubjectId,
    setSearchQuery,
    setMasteryFilter,
    setImportantFilter,
  } = useStudyStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const filtered = getFilteredMistakes();

  const startEditNote = (id: string, currentNote: string) => {
    setEditingNoteId(id);
    setNoteText(currentNote);
  };

  const saveNote = (id: string) => {
    updateNote(id, noteText);
    setEditingNoteId(null);
    setNoteText("");
  };

  const totalCount = mistakes.length;
  const masteredCount = mistakes.filter((m) => m.mastered).length;
  const importantCount = mistakes.filter((m) => m.important).length;
  const unmasteredCount = totalCount - masteredCount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">错题总数</div>
              <div className="text-3xl font-bold text-gray-800 font-serif">
                {totalCount}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <BookX className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">已掌握</div>
              <div className="text-3xl font-bold text-green-600 font-serif">
                {masteredCount}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">待攻克</div>
              <div className="text-3xl font-bold text-amber-600 font-serif">
                {unmasteredCount}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">重点标记</div>
              <div className="text-3xl font-bold text-rose-600 font-serif">
                {importantCount}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
              <Star className="w-6 h-6 text-rose-500 fill-rose-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="card-base p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索题目内容、知识点..."
              className="input-base pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="input-base !w-32"
              value={selectedSubjectId || ""}
              onChange={(e) =>
                setSelectedSubjectId(e.target.value || null)
              }
            >
              <option value="">全部科目</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${masteryFilter === "all" ? "bg-primary-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              onClick={() => setMasteryFilter("all")}
            >
              全部
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${masteryFilter === "unmastered" ? "bg-primary-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              onClick={() => setMasteryFilter("unmastered")}
            >
              未掌握
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${masteryFilter === "mastered" ? "bg-primary-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              onClick={() => setMasteryFilter("mastered")}
            >
              已掌握
            </button>
          </div>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
              importantFilter
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setImportantFilter(!importantFilter)}
          >
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">重点</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((mistake, idx) => {
          const isExpanded = expandedId === mistake.id;
          return (
            <div
              key={mistake.id}
              className={`card-base overflow-hidden transition-all duration-300 ${
                mistake.mastered ? "opacity-60" : ""
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="p-5">
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
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="tag bg-primary-50 text-primary-700">
                        {mistake.subject.name}
                      </span>
                      <span className="tag bg-gray-100 text-gray-600">
                        {mistake.chapter.name}
                      </span>
                      <Link
                        to={`/graph/${mistake.knowledgePoint.id}`}
                        className="tag bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <BrainCircuit className="w-3 h-3" />
                        {mistake.knowledgePoint.name}
                      </Link>
                      <span
                        className={`tag ${errorReasonColors[mistake.errorReason]}`}
                      >
                        {getErrorReasonLabel(mistake.errorReason)}
                      </span>
                      <span className="tag bg-gray-50 text-gray-500">
                        {getQuestionTypeLabel(mistake.question.type)}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {mistake.createdAt}
                      </span>
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
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 bg-gray-50/50">
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
                        <button className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
                          <Image className="w-3.5 h-3.5" />
                          上传截图
                        </button>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-600">
                          {mistake.question.analysis || "暂无官方解析"}
                        </p>
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

        {filtered.length === 0 && (
          <div className="card-base p-16 text-center">
            <BookMarked className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-1">
              暂无匹配的错题
            </h4>
            <p className="text-sm text-gray-400">尝试调整筛选条件或导入新的练习</p>
          </div>
        )}
      </div>
    </div>
  );
}
