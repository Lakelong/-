import React, { useState } from 'react';
import { DiagnosticReport, Subject, TextbookVersion } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface AnalysisReportProps {
  report: DiagnosticReport;
  subject: Subject;
  version: TextbookVersion | null;
  studentName: string;
  generatePlan: () => void;
  isGeneratingPlan: boolean;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ report, subject, version, studentName, generatePlan, isGeneratingPlan }) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return '#00B365'; // Success Green
    if (score >= 60) return '#FF8800'; // Warning Orange
    return '#F54A45'; // Danger Red
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    window.scrollTo(0, 0);

    try {
      const element = document.getElementById('analysis-report-content');
      if (!element) return;
      
      const buttons = element.querySelector('.export-actions') as HTMLElement;
      if (buttons) buttons.style.display = 'none';

      const canvas = await (window as any).html2canvas(element, {
        scale: 3, // Increased scale for ultra-sharp text
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#F5F6F7',
        onclone: (clonedDoc: Document) => {
          const clonedElement = clonedDoc.getElementById('analysis-report-content');
          if (clonedElement) {
            clonedElement.style.padding = '40px';
            clonedElement.style.backgroundColor = '#F5F6F7';
            
            // Force specific text colors in the clone to ensure contrast in PDF
            const allText = clonedElement.querySelectorAll('*');
            allText.forEach((el: any) => {
              const style = window.getComputedStyle(el);
              // If text is too light (gray-500 or gray-400), darken it for PDF
              if (style.color === 'rgb(100, 106, 115)' || style.color === 'rgb(156, 162, 168)') {
                el.style.color = '#4E5969'; // Force to gray-600
              }
              if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.classList.contains('font-bold')) {
                el.style.color = '#1F2329'; // Ensure titles are deep black-gray
                el.style.fontWeight = '800';
              }
            });
          }
        }
      });

      if (buttons) buttons.style.display = '';

      const imgData = canvas.toDataURL('image/png', 1.0);
      const { jsPDF } = (window as any).jspdf;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (imgHeight > 297) {
        const longPdf = new jsPDF('p', 'mm', [pdfWidth, imgHeight + 5]);
        longPdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'SLOW');
        longPdf.save(`${studentName}_${subject}_学情诊断报告.pdf`);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'SLOW');
        pdf.save(`${studentName}_${subject}_学情诊断报告.pdf`);
      }

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("导出 PDF 失败，请尝试使用打印功能。");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="analysis-report-content" className="max-w-7xl mx-auto p-8 md:p-14 space-y-8 pb-32 print:p-0 print:pb-0 bg-[#F5F6F7]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[2rem] border border-gray-100 shadow-card print:shadow-none print:border-none animate-slide-up-fade">
        <div className="flex-1">
          <div className="flex items-baseline space-x-2 mb-4 select-none opacity-90">
             <span className="text-xl font-black text-brand-600 tracking-widest">逐鹿未来</span>
             <span className="text-xs font-bold text-brand-400 tracking-[0.2em] uppercase">MetaFuture</span>
          </div>
          
          <div className="flex items-center flex-wrap gap-3 mb-3">
             <h1 className="text-3xl font-extrabold text-gray-800" style={{ color: '#1F2329' }}>
               <span className="text-brand-600" style={{ color: '#3370FF' }}>{studentName}</span> 的 {subject} 学情诊断报告
             </h1>
          </div>
          <p className="text-gray-600 text-sm font-medium">报告编号：MF-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">综合能力得分</span>
            <span className="text-6xl font-black tracking-tight" style={{ color: '#3370FF' }}>{report.overallScore}</span>
          </div>
          <div className="w-px h-16 bg-gray-100 hidden md:block"></div>
          <div className="flex space-x-4 export-actions print:hidden">
            <button onClick={handlePrint} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold py-3 px-6 rounded-2xl transition-all active:scale-95">打印</button>
            <button onClick={handleDownloadPDF} disabled={isExporting} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold py-3 px-6 rounded-2xl transition-all disabled:opacity-70 shadow-lg shadow-brand-200 active:scale-95">
              {isExporting ? '导出中...' : '下载报告 PDF'}
            </button>
          </div>
        </div>
      </header>

      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">学生姓名</span><span className="text-lg font-bold text-gray-800" style={{ color: '#1F2329' }}>{studentName}</span></div>
          <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">诊断科目</span><span className="text-lg font-bold text-gray-800" style={{ color: '#1F2329' }}>{subject}</span></div>
          <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">当前版本</span><span className="text-lg font-bold text-gray-800" style={{ color: '#1F2329' }}>{version || '通用版'}</span></div>
          <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">报告时间</span><span className="text-lg font-bold text-gray-800" style={{ color: '#1F2329' }}>{new Date().toLocaleDateString()}</span></div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card">
            <h3 className="font-extrabold text-gray-800 mb-8 flex items-center text-sm uppercase tracking-widest" style={{ color: '#1F2329' }}>能力维度分析</h3>
            <div className="h-72 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={report.radarData}>
                  <PolarGrid stroke="#E5E6EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#1F2329', fontSize: 13, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="得分" dataKey="A" stroke="#3370FF" strokeWidth={4} fill="#3370FF" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card">
             <h3 className="font-extrabold text-gray-800 mb-6 text-sm uppercase tracking-widest" style={{ color: '#1F2329' }}>优势强项</h3>
             <ul className="text-base space-y-4">
               {report.strengths.map((s, i) => (
                 <li key={i} className="flex items-start">
                   <span className="mr-3 text-white font-bold bg-success-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] shrink-0">✓</span>
                   <span style={{ color: '#4E5969', fontWeight: 600 }}>{s}</span>
                 </li>
               ))}
             </ul>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-card">
             <h3 className="font-extrabold text-gray-800 mb-6 text-sm uppercase tracking-widest" style={{ color: '#1F2329' }}>薄弱环节</h3>
             <ul className="text-base space-y-4">
               {report.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-3 text-white font-bold bg-danger-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] shrink-0">!</span>
                    <span style={{ color: '#4E5969', fontWeight: 600 }}>{w}</span>
                  </li>
               ))}
             </ul>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card">
            <h3 className="font-extrabold text-gray-800 mb-8 text-xl flex items-center" style={{ color: '#1F2329' }}>
              <span className="w-1.5 h-6 bg-brand-500 rounded-full mr-3"></span>
              诊断综述
            </h3>
            <div className="space-y-8">
              <div className="bg-brand-50/50 p-6 rounded-2xl border border-brand-100">
                <h4 className="font-extrabold text-brand-800 mb-3 text-lg">整体评估</h4>
                <p className="text-gray-700 text-base leading-relaxed font-medium" style={{ color: '#4E5969' }}>{report.summary.overview}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <h4 className="font-extrabold text-gray-800 mb-4 text-base tracking-wide">🔍 深度分析</h4>
                   <ul className="space-y-4">
                    {report.summary.knowledgeAnalysis.map((point, idx) => (
                      <li key={idx} className="flex items-start text-base">
                         <span className="mr-3 mt-2 w-2 h-2 bg-brand-400 rounded-full shrink-0"></span>
                         <span style={{ color: '#4E5969', fontWeight: 500 }}>{point}</span>
                      </li>
                    ))}
                   </ul>
                </div>
                <div>
                   <h4 className="font-extrabold text-gray-800 mb-4 text-base tracking-wide">💡 学习建议</h4>
                   <ul className="space-y-4">
                    {report.summary.suggestions.map((point, idx) => (
                      <li key={idx} className="flex items-start text-base">
                         <span className="mr-3 mt-2 w-2 h-2 bg-orange-400 rounded-full shrink-0"></span>
                         <span style={{ color: '#4E5969', fontWeight: 500 }}>{point}</span>
                      </li>
                    ))}
                   </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-card">
            <h3 className="font-extrabold text-gray-800 mb-8 text-sm uppercase tracking-widest" style={{ color: '#1F2329' }}>知识点掌握详情</h3>
            <div className="h-80 mb-12">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.topicBreakdown} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }} barSize={16}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="topic" type="category" width={160} tick={{ fontSize: 13, fill: '#1F2329', fontWeight: 700 }} interval={0} tickLine={false} axisLine={false} />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} background={{ fill: '#F5F6F7', radius: [0, 8, 8, 0] }}>
                    {report.topicBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {report.topicBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-start p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="w-3 h-3 rounded-full mt-2.5 mr-5 shrink-0" style={{ backgroundColor: getScoreColor(item.score) }}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-extrabold text-gray-800 text-lg" style={{ color: '#1F2329' }}>{item.topic}</span>
                      <span className="text-sm font-bold" style={{ color: getScoreColor(item.score) }}>
                        {item.score}分 · {item.status === 'Critical' ? '亟待提升' : item.status === 'Needs Improvement' ? '需加强' : '已掌握'}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: '#4E5969' }}>{item.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-8 print:hidden">
            <button onClick={generatePlan} disabled={isGeneratingPlan} className="bg-brand-500 hover:bg-brand-600 text-white font-extrabold py-4 px-10 rounded-2xl shadow-xl shadow-brand-200 transition-all flex items-center space-x-4 disabled:opacity-70">
              {isGeneratingPlan ? '智能生成中...' : '生成专属提升规划'}
              {!isGeneratingPlan && <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisReport;