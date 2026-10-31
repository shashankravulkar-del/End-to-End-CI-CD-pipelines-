import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Clock, 
  Terminal, ShieldCheck, Container, Server, Layers, Cpu, GitBranch
} from 'lucide-react';

interface SimStage {
  id: string;
  name: string;
  duration: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  icon: React.ReactNode;
}

type FailureMode = 'none' | 'sonar' | 'docker' | 'k8s';

export const PipelineSimulatorView: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [failureMode, setFailureMode] = useState<FailureMode>('none');
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(-1);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  const initialStages: SimStage[] = [
    { id: 'checkout', name: '1. Git Checkout', duration: '2s', status: 'idle', icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: 'maven', name: '2. Maven Build & Tests', duration: '14s', status: 'idle', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'sonar', name: '3. SonarQube Scanner', duration: '12s', status: 'idle', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'qualitygate', name: '4. Quality Gate Check', duration: '5s', status: 'idle', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'dockerbuild', name: '5. Docker Build Image', duration: '18s', status: 'idle', icon: <Container className="w-3.5 h-3.5" /> },
    { id: 'trivyscan', name: '6. Trivy Security Scan', duration: '6s', status: 'idle', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'dockerpush', name: '7. Push Docker Hub', duration: '8s', status: 'idle', icon: <Server className="w-3.5 h-3.5" /> },
    { id: 'k8sdeploy', name: '8. Kubernetes Deploy', duration: '6s', status: 'idle', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'verify', name: '9. Rollout Verification', duration: '5s', status: 'idle', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  const [stages, setStages] = useState<SimStage[]>(initialStages);

  const addLog = (msg: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const resetPipeline = () => {
    setIsRunning(false);
    setCurrentStageIdx(-1);
    setStages(initialStages);
    setConsoleLogs([
      '=== Jenkins 2.440.1 LTS Console Output ready ===',
      'Select a scenario below and click "Trigger Pipeline Build" to begin simulated CI/CD.'
    ]);
  };

  const startPipeline = () => {
    if (isRunning) return;
    setIsRunning(true);
    setStages(initialStages.map(s => ({ ...s, status: 'idle' })));
    setConsoleLogs([
      `=== Started by GitHub push event from user: devops-engineer ===`,
      `[Pipeline] Start of Pipeline (Build #42)`,
      `[Pipeline] Running on Jenkins agent ip-172-31-42-10 in /var/lib/jenkins/workspace/devops-java-app-pipeline`
    ]);

    runNextStage(0);
  };

  const runNextStage = (stageIdx: number) => {
    if (stageIdx >= initialStages.length) {
      setIsRunning(false);
      addLog(`[Pipeline] Stage: Verification completed successfully.`);
      addLog(`[Pipeline] Finished: SUCCESS! Deployed to Kubernetes Pods. Application accessible on port 30080.`);
      return;
    }

    setCurrentStageIdx(stageIdx);
    setStages(prev => prev.map((s, idx) => idx === stageIdx ? { ...s, status: 'running' } : s));

    const currentStage = initialStages[stageIdx];
    addLog(`[Pipeline] Entering stage: ${currentStage.name}...`);

    // Simulate work duration
    setTimeout(() => {
      // Check for intentional failure modes
      if (failureMode === 'sonar' && currentStage.id === 'qualitygate') {
        setStages(prev => prev.map((s, idx) => idx === stageIdx ? { ...s, status: 'failed' } : s));
        setIsRunning(false);
        addLog(`[ERROR] SonarQube Quality Gate FAILED: 2 Critical Security Vulnerabilities detected!`);
        addLog(`[ERROR] Coverage: 64.2% (Threshold: 80.0%). Aborting pipeline execution.`);
        addLog(`[Pipeline] Finished: FAILURE (Stage Quality Gate Check)`);
        return;
      }

      if (failureMode === 'docker' && currentStage.id === 'dockerpush') {
        setStages(prev => prev.map((s, idx) => idx === stageIdx ? { ...s, status: 'failed' } : s));
        setIsRunning(false);
        addLog(`[ERROR] docker push denied: requested access to resource is denied.`);
        addLog(`[ERROR] Authentication error: Invalid credentials for dockerhub-credentials in Jenkins Store.`);
        addLog(`[Pipeline] Finished: FAILURE (Stage Push Docker Hub)`);
        return;
      }

      if (failureMode === 'k8s' && currentStage.id === 'verify') {
        setStages(prev => prev.map((s, idx) => idx === stageIdx ? { ...s, status: 'failed' } : s));
        setIsRunning(false);
        addLog(`[ERROR] Deployment rollout failed: timed out waiting for condition.`);
        addLog(`[ERROR] Pod devops-java-app-7c89f in CrashLoopBackOff: Container memory limit exceeded (512Mi).`);
        addLog(`[Pipeline] Finished: FAILURE (Stage Rollout Verification)`);
        return;
      }

      // Successful stage completion
      setStages(prev => prev.map((s, idx) => idx === stageIdx ? { ...s, status: 'success' } : s));
      addLog(`[Pipeline] Stage ${currentStage.name} PASSED in ${currentStage.duration}.`);

      // Proceed to next stage
      runNextStage(stageIdx + 1);
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Simulation Controls & Scenarios Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-mono text-cyan-400 mb-1">INTERACTIVE PIPELINE BENCH</div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Jenkins CI/CD Real-Time Simulator
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Simulate declarative pipeline execution, observe live console logs, and test how real error scenarios are diagnosed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startPipeline}
              disabled={isRunning}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                isRunning 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-950'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunning ? 'Pipeline Running...' : 'Trigger Pipeline Build'}</span>
            </button>

            <button
              onClick={resetPipeline}
              disabled={isRunning}
              className="px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Failure Scenario Selector */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Simulate Execution Scenario</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              onClick={() => { setFailureMode('none'); resetPipeline(); }}
              className={`p-3 rounded-lg border text-left transition-all text-xs ${
                failureMode === 'none'
                  ? 'border-emerald-500 bg-emerald-950/20 text-white ring-1 ring-emerald-500'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-emerald-400 mb-0.5">Standard Happy Path</div>
              <div className="text-[11px] text-slate-400">All 9 stages succeed and deploy to K8s</div>
            </button>

            <button
              onClick={() => { setFailureMode('sonar'); resetPipeline(); }}
              className={`p-3 rounded-lg border text-left transition-all text-xs ${
                failureMode === 'sonar'
                  ? 'border-amber-500 bg-amber-950/20 text-white ring-1 ring-amber-500'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-amber-400 mb-0.5">Sonar Quality Gate Failure</div>
              <div className="text-[11px] text-slate-400">Simulate code smell / bug abort</div>
            </button>

            <button
              onClick={() => { setFailureMode('docker'); resetPipeline(); }}
              className={`p-3 rounded-lg border text-left transition-all text-xs ${
                failureMode === 'docker'
                  ? 'border-rose-500 bg-rose-950/20 text-white ring-1 ring-rose-500'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-rose-400 mb-0.5">Docker Registry 401 Error</div>
              <div className="text-[11px] text-slate-400">Simulate bad credentials in Jenkins</div>
            </button>

            <button
              onClick={() => { setFailureMode('k8s'); resetPipeline(); }}
              className={`p-3 rounded-lg border text-left transition-all text-xs ${
                failureMode === 'k8s'
                  ? 'border-purple-500 bg-purple-950/20 text-white ring-1 ring-purple-500'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-purple-400 mb-0.5">Kubernetes CrashLoopBackOff</div>
              <div className="text-[11px] text-slate-400">Simulate pod OOM resource limit crash</div>
            </button>
          </div>
        </div>
      </div>

      {/* Jenkins Pipeline Stage View (Visual Pipeline Matrix) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Jenkins Declarative Stage View</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Pipeline: devops-java-app-pipeline #42</span>
        </div>

        {/* Stage Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {stages.map((stage, idx) => {
            const isCurrent = stage.status === 'running';
            const isSuccess = stage.status === 'success';
            const isFailed = stage.status === 'failed';

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-cyan-400 bg-cyan-950/30 text-cyan-200 ring-1 ring-cyan-400 animate-pulse'
                    : isSuccess
                      ? 'border-emerald-800/80 bg-emerald-950/20 text-emerald-300'
                      : isFailed
                        ? 'border-rose-700 bg-rose-950/30 text-rose-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-center mb-2">
                    {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isFailed && <XCircle className="w-4 h-4 text-rose-400" />}
                    {isCurrent && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />}
                    {stage.status === 'idle' && <span className="text-[10px] font-mono text-slate-600">IDLE</span>}
                  </div>
                  <div className="font-semibold text-xs leading-tight mb-1 text-white">
                    {stage.name.split('. ')[1] || stage.name}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/60 font-mono text-[10px] text-slate-400">
                  {isSuccess ? stage.duration : isCurrent ? 'running...' : isFailed ? 'FAILED' : '--'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Jenkins Console Terminal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold text-white">Console Output · Jenkins Pipeline Log</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
        </div>

        <div className="p-4 bg-black/90 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto space-y-1 selection:bg-cyan-900">
          {consoleLogs.map((line, i) => {
            const isError = line.includes('[ERROR]') || line.includes('FAILURE');
            const isSuccess = line.includes('SUCCESS') || line.includes('PASSED');
            const isStage = line.includes('Entering stage');

            return (
              <div 
                key={i} 
                className={`${
                  isError 
                    ? 'text-rose-400 font-semibold' 
                    : isSuccess 
                      ? 'text-emerald-400 font-semibold' 
                      : isStage
                        ? 'text-cyan-300 font-medium'
                        : 'text-slate-300'
                }`}
              >
                {line}
              </div>
            );
          })}
          <div ref={consoleBottomRef} />
        </div>
      </div>

    </div>
  );
};
