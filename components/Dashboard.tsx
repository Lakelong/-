import React from 'react';
import { ViewState } from '../types';

interface DashboardProps {
  startDiagnostic: () => void;
  hasReport: boolean;
  viewReport: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ startDiagnostic, hasReport, viewReport }) => {
  return (
    <div className="p-8 md:p-14 max-w-screen-2xl mx-auto space-y-12">
      <header className="space-y-2 pl-1 animate-slide-up-fade">
        <h1 className="text-3xl font-bold text-gray-800">欢迎回来，同学 👋</h1>
        <p className="text-gray-500 text-base">准备好开启今天的学习之旅了吗？</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-slide-up-fade delay-100">
        {/* Quick Start Card */}
        <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-card hover:shadow-hover transition-all duration-500 ease-out group cursor-pointer hover:-translate-y-1" onClick={startDiagnostic}>
          <div className="flex flex-col h-full justify-between space-y-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-brand-600 transition-colors">开始学情诊断</h2>
                <p className="text-gray-500 text-base leading-relaxed max-w-sm">
                  通过 AI 智能出题或拍照识别，<br/>快速定位知识薄弱点。
                </p>
              </div>
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-out">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
            </div>
            <button 
              className="w-fit bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 flex items-center space-x-3 shadow-lg shadow-brand-200 hover:shadow-brand-300 hover:scale-105 active:scale-95 text-base"
            >
              <span>开始诊断</span>
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
        </div>

        {/* Recent Report Card */}
        <div 
          className={`bg-white p-10 rounded-[2rem] border border-gray-100 shadow-card transition-all duration-500 ease-out group
            ${hasReport 
              ? 'hover:shadow-hover cursor-pointer hover:-translate-y-1' 
              : 'opacity-80 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`}
          onClick={hasReport ? viewReport : undefined}
        >
          <div className="flex flex-col h-full justify-between space-y-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-success-500 transition-colors">查看分析报告</h2>
                <p className="text-gray-500 text-base leading-relaxed max-w-sm">
                  {hasReport 
                    ? "基于你的诊断结果，生成详细的<br/>知识点掌握情况分析。" 
                    : "完成诊断后，这里将展示你的<br/>专属学情报告。"}
                </p>
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ease-out ${hasReport ? 'bg-success-50 text-success-500 group-hover:scale-110 group-hover:-rotate-3' : 'bg-gray-100 text-gray-400'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
              </div>
            </div>
            <button 
              disabled={!hasReport}
              className={`w-fit font-semibold py-3 px-8 rounded-xl transition-all duration-300 flex items-center space-x-3 text-base
                ${hasReport 
                  ? 'bg-white border border-gray-200 text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:shadow-md' 
                  : 'bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed'
                }`}
            >
              <span>{hasReport ? "查看详情" : "暂无数据"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights - Clean Flat Style */}
      <div className="animate-slide-up-fade delay-200">
        <h3 className="text-xl font-bold text-gray-800 mb-8 pl-1">功能亮点</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { color: 'blue', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>, title: '精准定位', desc: 'AI 生成式题目，准确捕捉知识盲区，拒绝题海战术。' },
            { color: 'purple', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>, title: '科学分析', desc: '多维度雷达图展示，优势短板一目了然。' },
            { color: 'orange', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>, title: '智能规划', desc: '根据诊断结果，动态生成个性化周计划，高效提分。' }
          ].map((item, i) => (
             <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs hover:shadow-card hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 bg-${item.color}-50 text-${item.color}-500 rounded-2xl flex items-center justify-center mb-5`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">{item.title}</h3>
              <p className="text-base text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;