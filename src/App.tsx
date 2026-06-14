import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ImportPage from "@/pages/ImportPage";
import MistakesPage from "@/pages/MistakesPage";
import GraphPage from "@/pages/GraphPage";
import KnowledgeDetailPage from "@/pages/KnowledgeDetailPage";
import PlanPage from "@/pages/PlanPage";
import ReportPage from "@/pages/ReportPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/import" replace />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="mistakes" element={<MistakesPage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="graph/:id" element={<KnowledgeDetailPage />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="report" element={<ReportPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
