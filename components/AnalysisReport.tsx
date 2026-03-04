import React, { useState } from 'react';
import { DiagnosticReport, Subject, TextbookVersion } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { motion } from 'motion/react';
import { 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Lightbulb, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

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
    <div id="analysis-report-content" className="max-w-7xl mx-auto p-4 sm:p-8 md:p-14 space-y-6 md:y-8 pb-32 print:p-0 print:pb-0 bg-[#F5F6F7]">
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-card print:shadow-none print:border-none"
      >
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 w-full lg:w-auto">
          <div className="text-left lg:text-right">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">综合能力得分</span>
            <span className="text-5xl sm:text-6xl font-black tracking-tight" style={{ color: '#3370FF' }}>{report.overallScore}</span>
          </div>
          <div className="w-px h-12 bg-gray-100 hidden sm:block"></div>
          <div className="flex flex-wrap gap-3 export-actions print:hidden w-full sm:w-auto">
            <button onClick={handlePrint} className="flex-1 sm:flex-none bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
              <Printer size={16} />
              打印
            </button>
            <button onClick={handleDownloadPDF} disabled={isExporting} className="flex-1 sm:flex-none bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all disabled:opacity-70 shadow-lg shadow-brand-200 active:scale-95 flex items-center justify-center gap-2">
              <Download size={16} />
              {isExporting ? '导出中...' : '下载报告'}
            </button>
          </div>
        </div>
      </motion.header>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">学生姓名</span><span className="text-lg font-bold text-gray-800" style={{ color: '#1F2329' }}>{studentName}</span></div>
          <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">诊断科目</span><span className="text-lg font-bold text-gray-800" style={{ color: '#1F2329' }}>{subject}</span></div>
          <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">当前版本</span><span className="text-lg font-bold text-gray-800" style={{ color: '#1F2329' }}>{version || '通用版'}</span></div>
          <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">报告时间</span><span className="text-lg font-bold text-gray-800" style={{ color: '#1F2329' }}>{new Date().toLocaleDateString()}</span></div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-8"
        >
          <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-card">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                <TrendingUp size={18} />
              </div>
              <h3 className="font-extrabold text-gray-800 text-xs sm:text-sm uppercase tracking-widest" style={{ color: '#1F2329' }}>能力维度分析</h3>
            </div>
            <div className="h-64 sm:h-72 -ml-2">
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

          <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-card">
             <div className="flex items-center gap-3 mb-5 sm:mb-6 text-emerald-600">
               <CheckCircle2 size={20} />
               <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-widest">优势强项</h3>
             </div>
             <ul className="text-sm sm:text-base space-y-3 sm:space-y-4">
               {report.strengths.map((s, i) => (
                 <motion.li 
                   key={i}
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.4 + i * 0.1 }}
                   className="flex items-start"
                 >
                   <span className="mr-3 text-white font-bold bg-emerald-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] shrink-0">✓</span>
                   <span style={{ color: '#4E5969', fontWeight: 600 }}>{s}</span>
                 </motion.li>
               ))}
             </ul>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-card">
             <div className="flex items-center gap-3 mb-5 sm:mb-6 text-amber-600">
               <AlertCircle size={20} />
               <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-widest">薄弱环节</h3>
             </div>
             <ul className="text-sm sm:text-base space-y-3 sm:space-y-4">
               {report.weaknesses.map((w, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-start"
                  >
                    <span className="mr-3 text-white font-bold bg-amber-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] shrink-0">!</span>
                    <span style={{ color: '#4E5969', fontWeight: 600 }}>{w}</span>
                  </motion.li>
               ))}
             </ul>
           </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-card">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                <Search size={18} />
              </div>
              <h3 className="font-extrabold text-gray-800 text-lg sm:text-xl" style={{ color: '#1F2329' }}>诊断综述</h3>
            </div>
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-brand-50/50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-brand-100">
                <h4 className="font-extrabold text-brand-800 mb-3 sm:mb-4 text-base sm:text-lg">整体评估</h4>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed font-medium" style={{ color: '#4E5969' }}>{report.summary.overview}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-gray-50/50 p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-100">
                   <h4 className="font-extrabold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base tracking-wide flex items-center gap-2">
                     <Search size={16} className="text-brand-500" />
                     深度分析
                   </h4>
                   <ul className="space-y-3 sm:space-y-4">
                    {report.summary.knowledgeAnalysis.map((point, idx) => (
                      <li key={idx} className="flex items-start text-sm sm:text-base">
                         <span className="mr-3 mt-2 w-1.5 h-1.5 bg-brand-400 rounded-full shrink-0"></span>
                         <span style={{ color: '#4E5969', fontWeight: 500 }}>{point}</span>
                      </li>
                    ))}
                   </ul>
                </div>
                <div className="bg-orange-50/30 p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-orange-100">
                   <h4 className="font-extrabold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base tracking-wide flex items-center gap-2">
                     <Lightbulb size={16} className="text-orange-500" />
                     提分建议
                   </h4>
                   <ul className="space-y-3 sm:space-y-4">
                    {report.summary.suggestions.map((point, idx) => (
                      <li key={idx} className="flex items-start text-sm sm:text-base">
                         <span className="mr-3 mt-2 w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0"></span>
                         <span style={{ color: '#4E5969', fontWeight: 500 }}>{point}</span>
                      </li>
                    ))}
                   </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-card">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                <Award size={18} />
              </div>
              <h3 className="font-extrabold text-gray-800 text-xs sm:text-sm uppercase tracking-widest" style={{ color: '#1F2329' }}>知识点掌握详情</h3>
            </div>
            <div className="h-72 sm:h-80 mb-8 sm:mb-12">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.topicBreakdown} layout="vertical" margin={{ left: -20, right: 30, top: 0, bottom: 0 }} barSize={14}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="topic" type="category" width={120} tick={{ fontSize: 11, fill: '#1F2329', fontWeight: 700 }} interval={0} tickLine={false} axisLine={false} />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} background={{ fill: '#F5F6F7', radius: [0, 8, 8, 0] }}>
                    {report.topicBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-brand-600 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl shadow-brand-200 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 sm:p-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Lightbulb size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <Lightbulb size={24} />
                  <h3 className="text-xl sm:text-2xl font-bold">生成个性化提分计划</h3>
                </div>
                <p className="text-brand-50 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 opacity-90 font-medium">基于本次诊断结果，AI 将为你量身定制一套科学的学习路径，精准攻克薄弱环节。</p>
                <button 
                  onClick={generatePlan} 
                  disabled={isGeneratingPlan}
                  className="w-full sm:w-auto bg-white text-brand-600 hover:bg-brand-50 font-bold py-3.5 sm:py-4 px-8 sm:px-10 rounded-xl sm:rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isGeneratingPlan ? '正在生成...' : '立即生成提分计划'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalysisReport;
