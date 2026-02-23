import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DiagnosticSession from './components/DiagnosticSession';
import AnalysisReport from './components/AnalysisReport';
import StudyPlanner from './components/StudyPlanner';
import { ViewState, DiagnosticReport, StudyPlan, Subject, TextbookVersion } from './types';
import { createStudyPlan } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentVersion, setCurrentVersion] = useState<TextbookVersion | null>(null);
  const [studentName, setStudentName] = useState<string>('同学');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const handleDiagnosticComplete = (newReport: DiagnosticReport, subject: Subject, version: TextbookVersion, name: string) => {
    setReport(newReport);
    setCurrentSubject(subject);
    setCurrentVersion(version);
    setStudentName(name || '同学');
    setPlan(null); // Reset plan when new diagnostic is done
    setCurrentView(ViewState.REPORT);
  };

  const handleGeneratePlan = async () => {
    if (!report || !currentSubject || !currentVersion) return;
    setIsGeneratingPlan(true);
    try {
      const newPlan = await createStudyPlan(currentSubject, currentVersion, report);
      setPlan(newPlan);
      setCurrentView(ViewState.PLAN);
    } catch (error) {
      console.error(error);
      alert("Failed to generate plan.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return (
          <Dashboard 
            startDiagnostic={() => setCurrentView(ViewState.DIAGNOSTIC)} 
            hasReport={!!report}
            viewReport={() => setCurrentView(ViewState.REPORT)}
          />
        );
      case ViewState.DIAGNOSTIC:
        return (
          <DiagnosticSession 
            onComplete={handleDiagnosticComplete}
            onCancel={() => setCurrentView(ViewState.DASHBOARD)}
          />
        );
      case ViewState.REPORT:
        return report && currentSubject ? (
          <AnalysisReport 
            report={report} 
            subject={currentSubject}
            version={currentVersion}
            studentName={studentName}
            generatePlan={handleGeneratePlan}
            isGeneratingPlan={isGeneratingPlan}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm animate-fade-in">暂无报告数据</div>
        );
      case ViewState.PLAN:
        return <StudyPlanner plan={plan} studentName={studentName} subject={currentSubject} />;
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7] text-gray-900 font-sans flex overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        hasReport={!!report}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 print:ml-0 print:w-full print:h-auto print:overflow-visible">
        {/* Animated Wrapper for View Switching */}
        <div key={currentView} className="animate-slide-up-fade h-full">
           {renderContent()}
        </div>
      </main>
      
      {/* Mobile Navbar Placeholder */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-around shadow-lg z-50 print:hidden">
        <button onClick={() => setCurrentView(ViewState.DASHBOARD)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-50">🏠</button>
        <button onClick={() => setCurrentView(ViewState.DIAGNOSTIC)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-50">🩺</button>
        <button disabled={!report} onClick={() => setCurrentView(ViewState.REPORT)} className={`p-2 rounded-lg ${!report ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-50'}`}>📊</button>
      </div>
    </div>
  );
};

export default App;