import React, { useState, useEffect } from 'react';
import { ActiveTab } from './types';
import { LAB_STAGES } from './data/projectData';
import { Header } from './components/Header';
import { ArchitectureView } from './components/ArchitectureView';
import { LabGuideView } from './components/LabGuideView';
import { RepoBrowserView } from './components/RepoBrowserView';
import { PipelineSimulatorView } from './components/PipelineSimulatorView';
import { CareerPrepView } from './components/CareerPrepView';
import { Terminal, Shield, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('architecture');
  const [targetStageId, setTargetStageId] = useState<number>(0);
  
  // Persist completed stages in localStorage
  const [completedStages, setCompletedStages] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('devops_completed_stages');
      return saved ? JSON.parse(saved) : [0]; // default stage 0 completed
    } catch {
      return [0];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('devops_completed_stages', JSON.stringify(completedStages));
    } catch (e) {
      console.error(e);
    }
  }, [completedStages]);

  const toggleCompleteStage = (stageId: number) => {
    setCompletedStages(prev => 
      prev.includes(stageId) 
        ? prev.filter(id => id !== stageId) 
        : [...prev, stageId]
    );
  };

  const handleNavigateToStage = (stageId: number) => {
    setTargetStageId(stageId);
    setActiveTab('lab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRunQuickSimulation = () => {
    setActiveTab('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 3-Zone Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        completedStagesCount={completedStages.length}
        totalStagesCount={LAB_STAGES.length}
        onRunQuickSimulation={handleRunQuickSimulation}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'architecture' && (
          <ArchitectureView onNavigateToStage={handleNavigateToStage} />
        )}

        {activeTab === 'lab' && (
          <LabGuideView
            completedStages={completedStages}
            onToggleCompleteStage={toggleCompleteStage}
            initialStageId={targetStageId}
          />
        )}

        {activeTab === 'repo' && (
          <RepoBrowserView />
        )}

        {activeTab === 'simulator' && (
          <PipelineSimulatorView />
        )}

        {activeTab === 'career' && (
          <CareerPrepView />
        )}
      </main>

      {/* Minimal Anti-Slop Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">DevOps CI/CD Mentor</span>
            <span>·</span>
            <span>Jenkins · Docker · SonarQube · Kubernetes · AWS EC2</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('architecture')} 
              className="hover:text-cyan-400 transition-colors"
            >
              Architecture
            </button>
            <button 
              onClick={() => setActiveTab('lab')} 
              className="hover:text-cyan-400 transition-colors"
            >
              Lab Guide
            </button>
            <button 
              onClick={() => setActiveTab('repo')} 
              className="hover:text-cyan-400 transition-colors"
            >
              Repository Files
            </button>
            <button 
              onClick={() => setActiveTab('career')} 
              className="hover:text-cyan-400 transition-colors"
            >
              Resume & LinkedIn
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
