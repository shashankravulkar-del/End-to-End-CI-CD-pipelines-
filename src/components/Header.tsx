import React from 'react';
import { ActiveTab } from '../types';
import { Terminal, CheckCircle2, Play } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  completedStagesCount: number;
  totalStagesCount: number;
  onRunQuickSimulation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  completedStagesCount,
  totalStagesCount,
  onRunQuickSimulation
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <button 
            onClick={() => onTabChange('architecture')}
            className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap text-left"
          >
            DevOps Pipeline Master
          </button>
        </div>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => onTabChange('architecture')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              activeTab === 'architecture'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Architecture
          </button>

          <button
            onClick={() => onTabChange('lab')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'lab'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Hands-On Lab
            <span className="text-xs px-1.5 py-0.2 rounded font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800">
              {completedStagesCount}/{totalStagesCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('repo')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              activeTab === 'repo'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Code Explorer
          </button>

          <button
            onClick={() => onTabChange('simulator')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              activeTab === 'simulator'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Pipeline Simulator
          </button>

          <button
            onClick={() => onTabChange('career')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              activeTab === 'career'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Career & Resume
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRunQuickSimulation}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-cyan-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Build</span>
          </button>
        </div>

      </div>
    </header>
  );
};
