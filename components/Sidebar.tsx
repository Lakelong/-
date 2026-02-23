import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  hasReport: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, hasReport }) => {
  // SVG Icons
  const Icons = {
    [ViewState.DASHBOARD]: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
    ),
    [ViewState.DIAGNOSTIC]: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
    ),
    [ViewState.REPORT]: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
    ),
    [ViewState.PLAN]: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
    ),
  };

  const navItems = [
    { id: ViewState.DASHBOARD, label: '首页概览' },
    { id: ViewState.DIAGNOSTIC, label: '学情诊断' },
    { id: ViewState.REPORT, label: '分析报告', disabled: !hasReport },
    { id: ViewState.PLAN, label: '学习规划', disabled: !hasReport },
  ];

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-10 hidden md:flex print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="h-24 flex items-center px-8">
        {/* Brand Logo */}
        <div className="w-10 h-10 mr-4 shrink-0 hover:rotate-12 transition-transform duration-500 ease-in-out cursor-default">
          <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
            <rect width="512" height="512" rx="88" fill="url(#paint0_linear_4080_979)"/>
            <path d="M228.566 305.306C207.911 302.849 185.464 311 179.181 329.26C172.899 347.519 183.151 370.565 215.388 375.79C247.624 381.014 277.861 362.151 290.503 333.096M228.566 305.306C284.178 311.919 324.045 373.109 367.237 373.109C410.429 373.109 442.269 335.413 358.783 175.008M228.566 305.306C251.432 308.025 271.636 319.971 290.503 333.096M334.753 136.715L335.299 137.26M63.4573 368.905C190.5 289.5 204.685 150.958 252.199 150.958C299.713 150.958 319.055 267.477 290.503 333.096" stroke="white" strokeWidth="36" strokeLinecap="round"/>
            <defs>
              <linearGradient id="paint0_linear_4080_979" x1="-19.4274" y1="-66.5819" x2="667.381" y2="165.671" gradientUnits="userSpaceOnUse">
                <stop stopColor="#378AFF"/>
                <stop offset="1" stopColor="#054DCA"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-800 tracking-tight">智学向导</span>
      </div>
      
      <nav className="flex-1 px-6 py-2 space-y-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && setView(item.id)}
            disabled={item.disabled}
            className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 ease-out text-base font-medium group relative overflow-hidden
              ${currentView === item.id 
                ? 'bg-brand-50 text-brand-600 shadow-sm' 
                : item.disabled
                  ? 'text-gray-400 cursor-not-allowed opacity-60'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98]'
              }
            `}
          >
            <span className={`transition-transform duration-300 ${currentView === item.id ? 'text-brand-500 scale-110' : 'text-gray-500 group-hover:scale-110 group-hover:text-gray-700'}`}>
              {Icons[item.id]}
            </span>
            <span className="relative z-10">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-100 mb-2">
        <div className="bg-gradient-to-br from-brand-50 to-white rounded-3xl p-6 border border-brand-100/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-3">
             <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
             <span className="text-sm font-semibold text-brand-600">每日一句</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">"学习不是填满水桶，而是点燃火种。"</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;