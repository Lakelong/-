import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Stethoscope, FileText, Calendar, Quote } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  hasReport: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, hasReport }) => {
  const navItems = [
    { id: ViewState.DASHBOARD, label: '首页概览', icon: LayoutDashboard },
    { id: ViewState.DIAGNOSTIC, label: '学情诊断', icon: Stethoscope },
    { id: ViewState.REPORT, label: '分析报告', icon: FileText, disabled: !hasReport },
    { id: ViewState.PLAN, label: '学习规划', icon: Calendar, disabled: !hasReport },
  ];

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-10 hidden md:flex print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="h-24 flex items-center px-8">
        {/* Brand Logo */}
        <motion.div 
          whileHover={{ rotate: 12 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-10 h-10 mr-4 shrink-0 cursor-default"
        >
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
        </motion.div>
        <span className="text-xl font-bold text-gray-800 tracking-tight">智学向导</span>
      </div>
      
      <nav className="flex-1 px-6 py-2 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
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
                <Icon size={24} />
              </span>
              <span className="relative z-10">{item.label}</span>
              {currentView === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-100 mb-2">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-brand-50 to-white rounded-3xl p-6 border border-brand-100/50 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex items-center space-x-3 mb-3">
             <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
             <span className="text-sm font-semibold text-brand-600 flex items-center gap-1">
               <Quote size={14} /> 每日一句
             </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">"学习不是填满水桶，而是点燃火种。"</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Sidebar;
