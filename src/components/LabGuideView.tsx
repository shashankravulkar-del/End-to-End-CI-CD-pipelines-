import React, { useState } from 'react';
import { LAB_STAGES } from '../data/projectData';
import { 
  CheckCircle2, Circle, Copy, Check, Terminal, AlertTriangle, 
  MapPin, Clock, ArrowRight, ArrowLeft, ShieldAlert, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';

interface LabGuideViewProps {
  completedStages: number[];
  onToggleCompleteStage: (stageId: number) => void;
  initialStageId?: number;
}

export const LabGuideView: React.FC<LabGuideViewProps> = ({
  completedStages,
  onToggleCompleteStage,
  initialStageId = 0
}) => {
  const [activeStageId, setActiveStageId] = useState<number>(initialStageId);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedOutputs, setExpandedOutputs] = useState<Record<string, boolean>>({});

  const stage = LAB_STAGES.find(s => s.id === activeStageId) || LAB_STAGES[0];
  const isCompleted = completedStages.includes(stage.id);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleOutput = (cmdKey: string) => {
    setExpandedOutputs(prev => ({
      ...prev,
      [cmdKey]: !prev[cmdKey]
    }));
  };

  const handleNextStage = () => {
    if (activeStageId < LAB_STAGES.length - 1) {
      setActiveStageId(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStage = () => {
    if (activeStageId > 0) {
      setActiveStageId(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Sidebar: Stage Navigation & Completion Checklist */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-24 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Implementation Stages</h2>
            <p className="text-xs text-slate-400">Step-by-step verified path</p>
          </div>
          <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
            {completedStages.length}/{LAB_STAGES.length} Done
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="bg-cyan-400 h-full transition-all duration-300"
            style={{ width: `${(completedStages.length / LAB_STAGES.length) * 100}%` }}
          />
        </div>

        {/* Stage List */}
        <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {LAB_STAGES.map((s) => {
            const isDone = completedStages.includes(s.id);
            const isCurrent = s.id === activeStageId;

            return (
              <button
                key={s.id}
                onClick={() => setActiveStageId(s.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'border-cyan-400 bg-cyan-950/30 text-white shadow-sm'
                    : isDone
                      ? 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                      : 'border-slate-800/50 bg-slate-950/20 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">Stage {s.id}</span>
                  <span className="font-medium truncate">{s.title.split('&')[0]}</span>
                </div>

                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompleteStage(s.id);
                  }}
                  className="shrink-0 p-1 hover:text-cyan-400 transition-colors"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Active Stage Content */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Stage Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Stage {stage.id}</span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-400">{stage.category}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {stage.duration}
              </span>
              <span className="flex items-center gap-1 text-cyan-300 bg-cyan-950/40 border border-cyan-800 px-2 py-0.5 rounded">
                <MapPin className="w-3.5 h-3.5" />
                {stage.executionLocation}
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {stage.title}
          </h1>

          {/* Mentor Advice Note */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-cyan-300 mb-0.5">Senior DevOps Mentor Note</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {stage.mentorNote}
              </p>
            </div>
          </div>

          {/* Prerequisites */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Prerequisites Checklist</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stage.prerequisites.map((pre, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 p-2 rounded bg-slate-950/60 border border-slate-800/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{pre}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step-by-Step Commands Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Exact Execution Commands</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Location: {stage.executionLocation}</span>
          </div>

          <div className="space-y-6">
            {stage.commands.map((cmd, idx) => {
              const cmdKey = `${stage.id}-${idx}`;
              const isOutputExpanded = expandedOutputs[cmdKey] ?? true;

              return (
                <div key={idx} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                  {/* Command Label and Action Header */}
                  <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center text-cyan-400">
                          {idx + 1}
                        </span>
                        {cmd.label}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{cmd.description}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(cmd.code)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
                      >
                        {copiedText === cmd.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Command</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Code Snippet Box */}
                  <div className="p-4 bg-slate-950 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed selection:bg-cyan-900">
                    {cmd.code}
                  </div>

                  {/* Expected Output Accordion */}
                  {cmd.expectedOutput && (
                    <div className="border-t border-slate-800/80">
                      <button
                        onClick={() => toggleOutput(cmdKey)}
                        className="w-full px-4 py-2 bg-slate-900/50 hover:bg-slate-900 text-left text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span>Expected Command Output</span>
                        </span>
                        {isOutputExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </button>

                      {isOutputExpanded && (
                        <div className="p-4 bg-black/80 font-mono text-[11px] text-emerald-400/90 overflow-x-auto whitespace-pre border-t border-slate-900">
                          {cmd.expectedOutput}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Common Pitfalls & Solutions */}
        {stage.pitfalls.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Common Errors & Senior Solutions</span>
            </h2>

            <div className="space-y-3">
              {stage.pitfalls.map((pitfall, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-amber-950/10 border border-amber-800/30 space-y-2">
                  <div className="text-xs font-mono font-semibold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pitfall.error}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400 font-semibold">Root Cause: </span>
                    {pitfall.cause}
                  </div>
                  <div className="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded border border-emerald-900/40 font-mono">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold mb-1">Resolution:</span>
                    {pitfall.solution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification & Completion Footer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Stage Acceptance Criteria</div>
            <div className="space-y-1.5">
              {stage.verificationSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevStage}
                disabled={activeStageId === 0}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Stage</span>
              </button>

              <button
                onClick={() => onToggleCompleteStage(stage.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  isCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? 'Stage Marked Completed' : 'Confirm & Complete Stage'}</span>
              </button>
            </div>

            <button
              onClick={handleNextStage}
              disabled={activeStageId === LAB_STAGES.length - 1}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
