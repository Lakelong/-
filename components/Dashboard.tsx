import React from 'react';
import { ViewState } from '../types';
import { motion } from 'motion/react';
import { FileText, Stethoscope, Target, BarChart3, Clock, ChevronRight } from 'lucide-react';

interface DashboardProps {
  startDiagnostic: () => void;
  hasReport: boolean;
  viewReport: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ startDiagnostic, hasReport, viewReport }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-8 md:p-14 max-w-screen-2xl mx-auto space-y-8 sm:space-y-12"
    >
      <motion.header variants={itemVariants} className="space-y-1 sm:space-y-2 pl-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">欢迎回来，同学 👋</h1>
        <p className="text-gray-500 text-sm sm:text-base">准备好开启今天的学习之旅了吗？</p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        {/* Quick Start Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-card hover:shadow-hover transition-all duration-500 ease-out group cursor-pointer" 
          onClick={startDiagnostic}
        >
          <div className="flex flex-col h-full justify-between space-y-8 sm:space-y-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 group-hover:text-brand-600 transition-colors">开始学情诊断</h2>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-sm">
                  通过 AI 智能出题或拍照识别，<br className="hidden sm:block"/>快速定位知识薄弱点。
                </p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-out shrink-0">
                <Stethoscope size={24} className="sm:hidden" />
                <Stethoscope size={32} className="hidden sm:block" />
              </div>
            </div>
            <button 
              className="w-full sm:w-fit bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg shadow-brand-200 hover:shadow-brand-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <span>开始诊断</span>
              <ChevronRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* Recent Report Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={hasReport ? { y: -4 } : {}}
          className={`bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-card transition-all duration-500 ease-out group
            ${hasReport 
              ? 'hover:shadow-hover cursor-pointer' 
              : 'opacity-80 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`}
          onClick={hasReport ? viewReport : undefined}
        >
          <div className="flex flex-col h-full justify-between space-y-8 sm:space-y-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 group-hover:text-success-500 transition-colors">查看分析报告</h2>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-sm">
                  {hasReport 
                    ? "基于你的诊断结果，生成详细的<br className='hidden sm:block'/>知识点掌握情况分析。" 
                    : "完成诊断后，这里将展示你的<br className='hidden sm:block'/>专属学情报告。"}
                </p>
              </div>
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ease-out shrink-0 ${hasReport ? 'bg-success-50 text-success-500 group-hover:scale-110 group-hover:-rotate-3' : 'bg-gray-100 text-gray-400'}`}>
                <FileText size={24} className="sm:hidden" />
                <FileText size={32} className="hidden sm:block" />
              </div>
            </div>
            <button 
              disabled={!hasReport}
              className={`w-full sm:w-fit font-semibold py-3 px-8 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 text-sm sm:text-base
                ${hasReport 
                  ? 'bg-white border border-gray-200 text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:shadow-md' 
                  : 'bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed'
                }`}
            >
              <span>{hasReport ? "查看详情" : "暂无数据"}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Feature Highlights - Clean Flat Style */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 sm:mb-8 pl-1">功能亮点</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            { color: 'blue', icon: Target, title: '精准定位', desc: 'AI 生成式题目，准确捕捉知识盲区，拒绝题海战术。' },
            { color: 'purple', icon: BarChart3, title: '科学分析', desc: '多维度雷达图展示，优势短板一目了然。' },
            { color: 'orange', icon: Clock, title: '智能规划', desc: '根据诊断结果，动态生成个性化周计划，高效提分。' }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={i} 
                whileHover={{ y: -4 }}
                className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-gray-100 shadow-xs hover:shadow-card transition-all duration-300"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${item.color}-50 text-${item.color}-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5`}>
                  <Icon size={20} className="sm:hidden" />
                  <Icon size={24} className="hidden sm:block" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
