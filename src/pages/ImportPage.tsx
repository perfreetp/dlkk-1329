import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { subjects, chapters } from "@/data/mock";
import { useStudyStore } from "@/store";
import type { ErrorReason } from "@/types";

interface PreviewItem {
  id: string;
  question: string;
  knowledgePoint: string;
  subject: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
}

interface ImportQuestionRaw {
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
  errorReason?: string;
}

export default function ImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importQuestions = useStudyStore((s) => s.importQuestions);
  const setSelectedBatchId = useStudyStore((s) => s.setSelectedBatchId);

  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0].id);
  const [selectedChapter, setSelectedChapter] = useState(chapters[1].id);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [importData, setImportData] = useState<ImportQuestionRaw[]>([]);
  const [importedBatchId, setImportedBatchId] = useState<string>("");
  const [importStats, setImportStats] = useState({ total: 0, correct: 0, wrong: 0 });

  const parseJSON = (text: string): ImportQuestionRaw[] => {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data.map((item, idx) => ({
          questionId: item.questionId || item.id,
          questionContent: item.questionContent || item.content || item.question || "",
          questionType: item.questionType || item.type,
          options: item.options,
          correctAnswer: item.correctAnswer || item.answer,
          analysis: item.analysis || item.explanation,
          knowledgePointId: item.knowledgePointId || item.kpId,
          knowledgePointName: item.knowledgePointName || item.knowledgePoint,
          userAnswer: item.userAnswer || item.yourAnswer,
          isCorrect: item.isCorrect !== undefined ? item.isCorrect : item.correct,
          errorReason: item.errorReason,
        }));
      }
      if (data.questions && Array.isArray(data.questions)) {
        return data.questions.map((item: any, idx: number) => ({
          questionId: item.questionId || item.id,
          questionContent: item.questionContent || item.content || item.question || "",
          questionType: item.questionType || item.type,
          options: item.options,
          correctAnswer: item.correctAnswer || item.answer,
          analysis: item.analysis || item.explanation,
          knowledgePointId: item.knowledgePointId || item.kpId,
          knowledgePointName: item.knowledgePointName || item.knowledgePoint,
          userAnswer: item.userAnswer || item.yourAnswer,
          isCorrect: item.isCorrect !== undefined ? item.isCorrect : item.correct,
          errorReason: item.errorReason,
        }));
      }
      return [];
    } catch (e) {
      console.error("JSON parse error:", e);
      return [];
    }
  };

  const parseCSV = (text: string): ImportQuestionRaw[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const result: ImportQuestionRaw[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || "";
      });

      result.push({
        questionId: obj.questionid || obj.id,
        questionContent: obj.questioncontent || obj.content || obj.question || "",
        questionType: obj.questiontype || obj.type,
        options: obj.options ? obj.options.split("|") : undefined,
        correctAnswer: obj.correctanswer || obj.answer,
        analysis: obj.analysis || obj.explanation,
        knowledgePointId: obj.knowledgepointid || obj.kpid,
        knowledgePointName: obj.knowledgepointname || obj.knowledgepoint,
        userAnswer: obj.useranswer || obj.youranswer,
        isCorrect: obj.iscorrect === "true" || obj.iscorrect === "1" || obj.correct === "true",
        errorReason: obj.errorreason,
      });
    }

    return result;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let data: ImportQuestionRaw[] = [];

      if (file.name.endsWith(".json")) {
        data = parseJSON(text);
      } else if (file.name.endsWith(".csv")) {
        data = parseCSV(text);
      }

      if (data.length === 0) {
        alert("无法解析文件，请检查文件格式");
        return;
      }

      setImportData(data);
      setFileName(file.name);

      const previewItems: PreviewItem[] = data.slice(0, 10).map((item, i) => ({
        id: item.questionId || `q-${i}`,
        question: item.questionContent,
        knowledgePoint: item.knowledgePointName || "待归类",
        subject: subjects.find((s) => s.id === selectedSubject)?.name || "",
        isCorrect: !!item.isCorrect,
        userAnswer: item.userAnswer || "-",
        correctAnswer: item.correctAnswer || "-",
      }));

      setPreview(previewItems);
      setImportStats({
        total: data.length,
        correct: data.filter((d) => d.isCorrect).length,
        wrong: data.filter((d) => !d.isCorrect).length,
      });
      setStep(2);
    };
    reader.readAsText(file);
  }, [selectedSubject]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith(".json") || file.name.endsWith(".csv")) {
        processFile(file);
      } else {
        alert("请上传 JSON 或 CSV 格式的文件");
      }
    }
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClickSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImport = () => {
    setImporting(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setImporting(false);

          const subject = subjects.find((s) => s.id === selectedSubject);
          const chapter = chapters.find((c) => c.id === selectedChapter);

          const batchId = importQuestions(
            importData.map((d) => ({
              ...d,
              errorReason: (d.errorReason as ErrorReason) || undefined,
            })),
            fileName,
            selectedSubject,
            selectedChapter
          );

          setImportedBatchId(batchId);
          setStep(3);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleViewMistakes = () => {
    setSelectedBatchId(importedBatchId);
    navigate("/mistakes");
  };

  const successCount = importStats.correct;
  const failCount = importStats.wrong;

  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-base p-12 text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2 font-serif">
            导入成功
          </h3>
          <p className="text-gray-500 mb-8">
            已成功导入 {importStats.total} 道题目，其中 {failCount} 道错题已加入错题本
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-gray-50">
              <div className="text-2xl font-bold text-gray-800">
                {importStats.total}
              </div>
              <div className="text-xs text-gray-500">总题数</div>
            </div>
            <div className="p-4 rounded-xl bg-green-50">
              <div className="text-2xl font-bold text-green-600">
                {successCount}
              </div>
              <div className="text-xs text-gray-500">答对</div>
            </div>
            <div className="p-4 rounded-xl bg-red-50">
              <div className="text-2xl font-bold text-red-500">{failCount}</div>
              <div className="text-xs text-gray-500">答错</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button className="btn-secondary" onClick={() => {
              setStep(1);
              setFileName("");
              setImportData([]);
              setPreview([]);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}>
              继续导入
            </button>
            <button className="btn-primary" onClick={handleViewMistakes}>查看错题本</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div
          className={`flex items-center gap-2 ${step >= 1 ? "text-primary-800" : "text-gray-400"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-primary-800 text-white" : "bg-gray-100"}`}
          >
            1
          </div>
          <span className="font-medium">上传文件</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
        <div
          className={`flex items-center gap-2 ${step >= 2 ? "text-primary-800" : "text-gray-400"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-primary-800 text-white" : "bg-gray-100"}`}
          >
            2
          </div>
          <span className="font-medium">预览配置</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
        <div
          className={`flex items-center gap-2 ${step >= 3 ? "text-primary-800" : "text-gray-400"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? "bg-primary-800 text-white" : "bg-gray-100"}`}
          >
            3
          </div>
          <span className="font-medium">完成导入</span>
        </div>
      </div>

      {step === 1 && (
        <div
          className={`card-base p-16 transition-all duration-300 ${
            isDragging
              ? "border-2 border-primary-400 bg-primary-50/50 scale-[1.01]"
              : "border-2 border-dashed border-gray-200"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickSelect}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-center max-w-md mx-auto">
            <div
              className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-all duration-300 ${
                isDragging
                  ? "bg-primary-500 scale-110"
                  : "bg-gradient-to-br from-primary-100 to-primary-200"
              }`}
            >
              <Upload
                className={`w-10 h-10 transition-colors ${isDragging ? "text-white" : "text-primary-600"}`}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 font-serif">
              拖拽练习结果文件到这里
            </h3>
            <p className="text-gray-500 mb-6">
              支持 JSON、CSV 格式，或者点击下方按钮选择文件
            </p>
            <div className="flex justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
                <FileJson className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">.json</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">.csv</span>
              </div>
            </div>
            <button className="btn-primary" onClick={handleClickSelect}>
              选择文件
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card-base p-5">
              <div className="text-sm text-gray-500 mb-1">已选择文件</div>
              <div className="font-medium text-gray-800 truncate">
                {fileName}
              </div>
              <div className="flex gap-2 mt-2">
                <FileJson className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-400">
                  {importStats.total} 条记录
                </span>
              </div>
            </div>
            <div className="card-base p-5">
              <label className="text-sm text-gray-500 mb-2 block">
                所属科目
              </label>
              <select
                className="input-base"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  const firstChapter = chapters.find((c) => c.subjectId === e.target.value);
                  if (firstChapter) {
                    setSelectedChapter(firstChapter.id);
                  }
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="card-base p-5">
              <label className="text-sm text-gray-500 mb-2 block">
                所属章节
              </label>
              <select
                className="input-base"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
              >
                {chapters
                  .filter((c) => c.subjectId === selectedSubject)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="card-base overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-800">数据预览</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-500">
                    正确 {successCount}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-500">
                    错误 {failCount}
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 w-12">
                      #
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                      题目
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 w-32">
                      知识点
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 w-24">
                      结果
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 w-32">
                      答案
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.map((item, i) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-800 max-w-xs truncate">
                        {item.question}
                      </td>
                      <td className="px-5 py-4">
                        <span className="tag bg-primary-50 text-primary-700">
                          {item.knowledgePoint}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {item.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-5 py-4 text-center text-sm">
                        <span
                          className={
                            item.isCorrect
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium line-through mr-2"
                          }
                        >
                          {item.userAnswer}
                        </span>
                        {!item.isCorrect && (
                          <span className="text-green-600 font-medium">
                            {item.correctAnswer}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importStats.total > preview.length && (
              <div className="p-3 text-center text-sm text-gray-400 border-t border-gray-100">
                共 {importStats.total} 条记录，仅显示前 {preview.length} 条
              </div>
            )}
          </div>

          {importing ? (
            <div className="card-base p-6">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                <span className="font-medium text-gray-800">正在导入...</span>
                <span className="ml-auto text-primary-600 font-bold">
                  {progress}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-bar bg-gradient-to-r from-primary-400 to-primary-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <button
                className="btn-ghost"
                onClick={() => {
                  setStep(1);
                  setFileName("");
                  setImportData([]);
                  setPreview([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                重新选择
              </button>
              <div className="flex gap-3">
                <button
                  className="btn-secondary flex items-center gap-2"
                  onClick={handleImport}
                >
                  <Sparkles className="w-4 h-4" />
                  智能归类并导入
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
