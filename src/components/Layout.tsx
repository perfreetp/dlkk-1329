import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Upload,
  BookOpen,
  Network,
  Calendar,
  BarChart3,
  Brain,
  Bell,
  Search,
} from "lucide-react";
import { examInfo } from "@/data/mock";

const navItems = [
  { to: "/import", label: "练习导入", icon: Upload },
  { to: "/mistakes", label: "错题本", icon: BookOpen },
  { to: "/graph", label: "知识图谱", icon: Network },
  { to: "/plan", label: "复习计划", icon: Calendar },
  { to: "/report", label: "学习报告", icon: BarChart3 },
];

const getDaysUntilExam = () => {
  const today = new Date();
  const exam = new Date(examInfo.examDate);
  const diff = Math.ceil(
    (exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
};

export default function Layout() {
  const location = useLocation();
  const daysUntil = getDaysUntilExam();

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      "/import": "练习导入",
      "/mistakes": "错题本",
      "/graph": "知识图谱",
      "/plan": "复习计划",
      "/report": "学习报告",
    };
    for (const key of Object.keys(titles)) {
      if (location.pathname.startsWith(key)) {
        if (key === "/graph" && location.pathname !== "/graph") {
          return "知识点详情";
        }
        return titles[key];
      }
    }
    return "练习导入";
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-200/50">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-800 font-serif">
                错题智谱
              </h1>
              <p className="text-xs text-gray-400">智能备考助手</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-4">
            <div className="text-xs text-primary-600 font-medium mb-1">
              距离考试
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary-800 font-serif">
                {daysUntil}
              </span>
              <span className="text-sm text-primary-600">天</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {examInfo.examName.slice(0, 10)}...
            </div>
            <div className="mt-2 progress-track">
              <div
                className="progress-bar bg-gradient-to-r from-primary-400 to-primary-600"
                style={{ width: `${Math.min(100, (1 - daysUntil / 90) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-serif">
              {getPageTitle()}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索题目、知识点..."
                className="w-64 pl-9 pr-4 py-2 rounded-xl bg-gray-50 border-0 text-sm focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>
            <button className="relative w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
              考
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
