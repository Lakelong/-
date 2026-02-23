import React, { useState } from 'react';
import { StudyPlan, StudyTask, Subject } from '../types';

interface StudyPlannerProps {
  plan: StudyPlan | null;
  studentName: string;
  subject: Subject | null;
}

const StudyPlanner: React.FC<StudyPlannerProps> = ({ plan, studentName, subject }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activePracticeTask, setActivePracticeTask] = useState<StudyTask | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Practice Session State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center p-8">
        <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-6 text-gray-400 shadow-sm">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">暂无学习计划</h3>
        <p className="text-gray-500 max-w-md">完成诊断后，AI 将为您定制专属规划。</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    window.scrollTo(0, 0);

    try {
      const element = document.getElementById('study-plan-content');
      if (!element) return;
      
      const buttons = element.querySelector('.export-actions') as HTMLElement;
      const viewToggle = element.querySelector('.view-toggle') as HTMLElement;
      
      if (buttons) buttons.style.display = 'none';
      if (viewToggle) viewToggle.style.display = 'none';
      
      const practiceButtons = element.querySelectorAll('.practice-btn');
      practiceButtons.forEach((btn: any) => btn.style.display = 'none');

      const canvas = await (window as any).html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#F5F6F7',
        onclone: (clonedDoc: Document) => {
          const clonedElement = clonedDoc.getElementById('study-plan-content');
          if (clonedElement) {
            clonedElement.style.padding = '40px';
            clonedElement.style.backgroundColor = '#F5F6F7';
            
            // Force explicit colors for PDF legibility
            const allText = clonedElement.querySelectorAll('*');
            allText.forEach((el: any) => {
              const style = window.getComputedStyle(el);
              if (style.color === 'rgb(100, 106, 115)') el.style.color = '#4E5969';
              if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.classList.contains('font-bold')) {
                el.style.color = '#1F2329';
                el.style.fontWeight = '800';
              }
            });
          }
        }
      });

      if (buttons) buttons.style.display = '';
      if (viewToggle) viewToggle.style.display = '';
      practiceButtons.forEach((btn: any) => btn.style.display = '');

      const imgData = canvas.toDataURL('image/png', 1.0);
      const { jsPDF } = (window as any).jspdf;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (imgHeight > 297) {
        const longPdf = new jsPDF('p', 'mm', [pdfWidth, imgHeight + 5]);
        longPdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'SLOW');
        longPdf.save(`${studentName}_学习规划_${new Date().toLocaleDateString()}.pdf`);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'SLOW');
        pdf.save(`${studentName}_学习规划_${new Date().toLocaleDateString()}.pdf`);
      }

    } catch (error) {
      console.error(error);
      alert("导出 PDF 失败");
    } finally {
      setIsExporting(false);
    }
  };

  const openPractice = (task: StudyTask) => {
    setActivePracticeTask(task);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setShowResult(false);
  };

  const getActivityIcon = (text: string) => {
    if (text.includes('视频') || text.includes('观看') || text.includes('课')) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      );
    }
    return (
       <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
      </div>
    );
  };

  return (
    <>
      <div id="study-plan-content" className="max-w-7xl mx-auto p-8 md:p-14 pb-32 bg-[#F5F6F7]">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 animate-slide-up-fade gap-6">
          <div>
            <div className="flex items-baseline space-x-2 mb-2 select-none opacity-90">
              <span className="text-xl font-black text-brand-600 tracking-widest">逐鹿未来</span>
              <span className="text-xs font-bold text-brand-400 tracking-[0.2em] uppercase">MetaFuture</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800" style={{ color: '#1F2329' }}><span className="text-brand-600" style={{ color: '#3370FF' }}>{studentName}</span> 的 {subject} 学习规划</h1>
            <p className="text-gray-600 text-sm mt-2 font-bold">定制周期：{new Date().toLocaleDateString()} - {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          </div>
          
          <div className="flex items-center gap-4 export-actions print:hidden">
            <div className="view-toggle bg-white border border-gray-200 p-1 rounded-xl flex items-center mr-2">
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'list' ? 'bg-brand-50 text-brand-600' : 'text-gray-500'}`}>列表</button>
              <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'calendar' ? 'bg-brand-50 text-brand-600' : 'text-gray-500'}`}>日历</button>
            </div>
            <button onClick={handlePrint} className="bg-white border border-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-bold text-sm">打印</button>
            <button onClick={handleDownloadPDF} disabled={isExporting} className="bg-brand-500 text-white py-3 px-6 rounded-2xl font-bold text-sm shadow-lg shadow-brand-200">
              {isExporting ? '导出中...' : '下载规划 PDF'}
            </button>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-card overflow-hidden">
            <div className="p-10 border-b border-gray-100 bg-brand-50/20">
              <h2 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3">本周核心目标</h2>
              <p className="text-xl font-extrabold text-gray-800 leading-relaxed" style={{ color: '#1F2329' }}>{plan.weeklyGoal}</p>
            </div>

            <div className="p-10">
              <div className="grid gap-6">
                {plan.schedule.map((task, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-6 p-8 bg-white rounded-[2rem] border border-gray-100 hover:border-brand-200 transition-all">
                    <div className="md:w-32 flex flex-col justify-start border-r border-gray-100 pr-6 shrink-0">
                      <span className="text-xl font-extrabold text-gray-800" style={{ color: '#1F2329' }}>{task.day}</span>
                      <span className={`inline-block mt-3 px-3 py-1 rounded-lg text-xs font-black ${
                        task.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>{task.priority === 'High' ? '重点关注' : '日常提升'}</span>
                    </div>
                    
                    <div className="flex-1 flex items-start gap-5">
                      {getActivityIcon(task.activity)}
                      <div className="flex-1">
                        <h3 className="font-extrabold text-gray-900 text-lg mb-2" style={{ color: '#1F2329' }}>{task.focusTopic}</h3>
                        <p className="text-base text-gray-700 leading-relaxed font-bold" style={{ color: '#4E5969' }}>{task.activity}</p>
                        
                        {task.practiceExercises && task.practiceExercises.length > 0 && (
                          <div className="mt-4 practice-btn print:hidden">
                            <button onClick={() => openPractice(task)} className="bg-brand-50 text-brand-600 px-4 py-2 rounded-xl text-xs font-black border border-brand-100">
                              开启训练 ({task.practiceExercises.length}题)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-32 flex items-start md:justify-end text-gray-400 font-black text-xs">
                      <div className="flex items-center bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {task.durationMinutes}min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Practice Overlay remains unchanged */}
      {activePracticeTask && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print:hidden">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-10 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{activePracticeTask.focusTopic} - 精练</h3>
              <button onClick={() => setActivePracticeTask(null)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-10 overflow-y-auto max-h-[60vh]">
               <div className="text-xl font-bold text-gray-900 mb-8 leading-relaxed">
                 {activePracticeTask.practiceExercises[currentQIndex].text}
               </div>

               {activePracticeTask.practiceExercises[currentQIndex].type === 'multiple_choice' && activePracticeTask.practiceExercises[currentQIndex].options && (
                 <div className="space-y-4">
                    {activePracticeTask.practiceExercises[currentQIndex].options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => !showResult && setSelectedOption(opt)}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center ${
                          showResult 
                            ? opt === activePracticeTask.practiceExercises[currentQIndex].correctAnswer 
                              ? 'border-green-500 bg-green-50 text-green-700' 
                              : selectedOption === opt ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 opacity-60'
                            : selectedOption === opt ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold mr-4">{String.fromCharCode(65 + idx)}</span>
                        {opt}
                      </button>
                    ))}
                 </div>
               )}

               {showResult && (
                 <div className="mt-8 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                   <h4 className="font-bold text-blue-800 mb-2">解析：</h4>
                   <p className="text-blue-900/70 leading-relaxed">{activePracticeTask.practiceExercises[currentQIndex].explanation}</p>
                 </div>
               )}
            </div>

            <div className="p-8 border-t border-gray-100 flex justify-end gap-4">
              {!showResult ? (
                <button onClick={() => setShowResult(true)} disabled={!selectedOption} className="bg-brand-500 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50">核对答案</button>
              ) : (
                <button onClick={() => currentQIndex < activePracticeTask.practiceExercises.length - 1 ? (setCurrentQIndex(currentQIndex + 1), setShowResult(false), setSelectedOption(null)) : setActivePracticeTask(null)} className="bg-brand-500 text-white font-bold py-3 px-8 rounded-xl">
                  {currentQIndex === activePracticeTask.practiceExercises.length - 1 ? '完成练习' : '下一题'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudyPlanner;