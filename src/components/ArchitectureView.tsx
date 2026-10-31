import React, { useState } from 'react';
import { 
  GitBranch, Server, Cpu, ShieldCheck, Container, Cloud, 
  Layers, Globe, ArrowRight, Play, CheckCircle2, AlertCircle, Info, Copy, Check
} from 'lucide-react';

interface ArchitectureNode {
  id: string;
  name: string;
  category: string;
  role: string;
  ports: string;
  icon: React.ReactNode;
  color: string;
  configSummary: string;
  securityNote: string;
  commands: string[];
}

export const ArchitectureView: React.FC<{
  onNavigateToStage: (stageId: number) => void;
}> = ({ onNavigateToStage }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('jenkins');
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const nodes: ArchitectureNode[] = [
    {
      id: 'git',
      name: 'GitHub Repository',
      category: 'Source Control & Trigger',
      role: 'Stores application code, Jenkinsfile, Dockerfile, and K8s manifests. Sends an HTTP POST Webhook on git push.',
      ports: 'HTTPS 443',
      icon: <GitBranch className="w-5 h-5" />,
      color: 'emerald',
      configSummary: 'Webhook Payload URL: http://<EC2-IP>:8080/github-webhook/ (Event: push)',
      securityNote: 'Use Fine-Grained Personal Access Tokens (PAT) or deploy keys rather than account passwords.',
      commands: [
        'git add .',
        'git commit -m "feat: automated CI/CD pipeline commit"',
        'git push origin main'
      ]
    },
    {
      id: 'jenkins',
      name: 'Jenkins Automation Server',
      category: 'CI/CD Orchestration',
      role: 'Orchestrates the Declarative Pipeline. Receives GitHub webhooks, coordinates Maven tests, SonarQube scans, Docker builds, and K8s deployments.',
      ports: 'TCP 8080',
      icon: <Server className="w-5 h-5" />,
      color: 'cyan',
      configSummary: 'Jenkins LTS daemon running under systemd on AWS EC2 Ubuntu 22.04.',
      securityNote: 'Ensure "jenkins" Linux user is added to docker group (sudo usermod -aG docker jenkins) to run docker without sudo.',
      commands: [
        'sudo systemctl status jenkins',
        'sudo cat /var/lib/jenkins/secrets/initialAdminPassword',
        'sudo usermod -aG docker jenkins'
      ]
    },
    {
      id: 'maven',
      name: 'Maven Build & Surefire',
      category: 'Build Automation & Testing',
      role: 'Compiles Java 17 source code, downloads dependencies, executes JUnit 5 unit tests, and packages executable JAR artifact.',
      ports: 'N/A (CLI Tool)',
      icon: <Cpu className="w-5 h-5" />,
      color: 'amber',
      configSummary: 'Spring Boot 3.2.3 with spring-boot-maven-plugin and maven-surefire-plugin 3.2.5.',
      securityNote: 'Enforce dependency vulnerability scanning and use pinned versions in pom.xml.',
      commands: [
        'mvn clean test',
        'mvn clean package -DskipTests',
        'ls -lh target/devops-java-app-1.0.0.jar'
      ]
    },
    {
      id: 'sonar',
      name: 'SonarQube Quality Gate',
      category: 'Static Analysis & SAST',
      role: 'Scans source code for bugs, vulnerabilities, and code smells. Enforces a strict Quality Gate before allowing Docker image creation.',
      ports: 'TCP 9000',
      icon: <ShieldCheck className="w-5 h-5" />,
      color: 'indigo',
      configSummary: 'Running as Docker container (sonarqube:lts-community) with vm.max_map_count=262144.',
      securityNote: 'Configure Webhook to http://<EC2-IP>:8080/sonarqube-webhook/ so Jenkins receives Quality Gate status asynchronously.',
      commands: [
        'docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community',
        'sudo sysctl -w vm.max_map_count=262144'
      ]
    },
    {
      id: 'docker',
      name: 'Docker Engine',
      category: 'Containerization',
      role: 'Builds lightweight container images using a 2-stage Dockerfile (Maven builder + Alpine JRE runner) and runs as non-root user appuser.',
      ports: 'Internal 8080 / Daemon socket',
      icon: <Container className="w-5 h-5" />,
      color: 'blue',
      configSummary: 'Multi-stage Dockerfile: builder (800MB) -> runtime (180MB). Tagged with build number.',
      securityNote: 'Never run containers as root. Created non-root group and user (appuser:appgroup).',
      commands: [
        'docker build -t yourusername/devops-java-app:build-1 .',
        'docker images | grep devops-java-app'
      ]
    },
    {
      id: 'dockerhub',
      name: 'Docker Hub Registry',
      category: 'Artifact Repository',
      role: 'Hosts version-tagged container images (e.g. build-12, build-13, latest) accessible by Kubernetes nodes for deployment.',
      ports: 'HTTPS 443',
      icon: <Cloud className="w-5 h-5" />,
      color: 'sky',
      configSummary: 'Securely authenticated via Jenkins Credentials Store (Username with password).',
      securityNote: 'Use Docker Hub Personal Access Tokens (PAT) with Read/Write scope instead of account password.',
      commands: [
        'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USER --password-stdin',
        'docker push yourusername/devops-java-app:build-1'
      ]
    },
    {
      id: 'k8s',
      name: 'Kubernetes Cluster (K3s)',
      category: 'Container Orchestration',
      role: 'Manages container lifecycles, self-healing, rolling updates with zero downtime, and scales 2 replica pods across the cluster.',
      ports: 'TCP 6443 (API), 30080 (NodePort)',
      icon: <Layers className="w-5 h-5" />,
      color: 'purple',
      configSummary: 'Deployment with RollingUpdate strategy (maxSurge: 1, maxUnavailable: 0), Liveness and Readiness probes.',
      securityNote: 'ConfigMap isolates environment variables; kubeconfig restricted with chmod 600.',
      commands: [
        'kubectl apply -f k8s/configmap.yaml',
        'kubectl apply -f k8s/deployment.yaml',
        'kubectl apply -f k8s/service.yaml',
        'kubectl get pods,svc -o wide'
      ]
    },
    {
      id: 'enduser',
      name: 'End User / Live Web Traffic',
      category: 'Public Accessibility',
      role: 'Users and external systems connect via HTTP to port 30080 on the AWS EC2 public IP address, mapped to Kubernetes Pods.',
      ports: 'TCP 30080',
      icon: <Globe className="w-5 h-5" />,
      color: 'emerald',
      configSummary: 'AWS EC2 Security Group Custom TCP 30080 open to 0.0.0.0/0.',
      securityNote: 'In corporate environments, front with an AWS Application Load Balancer (ALB) and HTTPS 443 SSL certificate.',
      commands: [
        'curl -i http://<EC2-PUBLIC-IP>:30080/api/v1/info',
        'curl -i http://<EC2-PUBLIC-IP>:30080/api/v1/health'
      ]
    }
  ];

  const pipelineSequence = ['git', 'jenkins', 'maven', 'sonar', 'docker', 'dockerhub', 'k8s', 'enduser'];

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setActiveStepIndex(0);
    setSelectedNodeId(pipelineSequence[0]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < pipelineSequence.length) {
        setActiveStepIndex(step);
        setSelectedNodeId(pipelineSequence[step]);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1200);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[1];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-cyan-400 mb-2">PROJECT ARCHITECTURE & TOPOLOGY</div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              End-to-End Enterprise CI/CD Pipeline
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automated continuous integration, static analysis quality gates, multi-stage Docker containerization, 
              and zero-downtime Kubernetes rolling deployment hosted on an AWS EC2 instance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                isSimulating 
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-800 animate-pulse'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSimulating ? `Tracing Step ${activeStepIndex + 1} of 8...` : 'Simulate Pipeline Flow'}</span>
            </button>
          </div>
        </div>

        {/* Pipeline Stage Indicator Flow Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {pipelineSequence.map((nodeId, idx) => {
              const node = nodes.find(n => n.id === nodeId)!;
              const isActive = activeStepIndex === idx;
              const isPassed = activeStepIndex > idx;
              const isSelected = selectedNodeId === nodeId;

              return (
                <button
                  key={nodeId}
                  onClick={() => setSelectedNodeId(nodeId)}
                  className={`text-left p-2.5 rounded-lg border transition-all text-xs ${
                    isActive 
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400' 
                      : isSelected 
                        ? 'border-slate-500 bg-slate-800/90 text-white' 
                        : isPassed
                          ? 'border-emerald-800/60 bg-emerald-950/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-500">0{idx + 1}</span>
                    {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                  </div>
                  <div className="font-medium truncate">{node.name.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Split: Interactive Visual Flow Canvas + Node Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visual Pipeline Schematic */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Interactive Architecture Map</span>
            </h2>
            <span className="text-xs text-slate-400">Click any component to inspect details</span>
          </div>

          {/* Node Grid Layout */}
          <div className="space-y-4">
            
            {/* Stage Group 1: Source to CI */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3">
                Phase 1: Code Commit & CI Trigger
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedNodeId('git')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    selectedNodeId === 'git' ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="p-2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">GitHub Repo</div>
                    <div className="text-[11px] text-slate-400">Git Push & Webhook trigger</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedNodeId('jenkins')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    selectedNodeId === 'jenkins' ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="p-2 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Jenkins Master</div>
                    <div className="text-[11px] text-slate-400">Port 8080 · CI Orchestration</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Stage Group 2: Verification & Quality Gate */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3">
                Phase 2: Build & Static Security Analysis
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedNodeId('maven')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    selectedNodeId === 'maven' ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="p-2 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Maven 3.9</div>
                    <div className="text-[11px] text-slate-400">Compile & JUnit 5 Tests</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedNodeId('sonar')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    selectedNodeId === 'sonar' ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="p-2 rounded bg-indigo-950/40 text-indigo-400 border border-indigo-800/40">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">SonarQube</div>
                    <div className="text-[11px] text-slate-400">Port 9000 · Quality Gate</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Stage Group 3: Containerization & Registry */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3">
                Phase 3: Dockerization & Artifact Registry
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedNodeId('docker')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    selectedNodeId === 'docker' ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="p-2 rounded bg-blue-950/40 text-blue-400 border border-blue-800/40">
                    <Container className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Docker Engine</div>
                    <div className="text-[11px] text-slate-400">Multi-stage Alpine image</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedNodeId('dockerhub')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    selectedNodeId === 'dockerhub' ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="p-2 rounded bg-sky-950/40 text-sky-400 border border-sky-800/40">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Docker Hub</div>
                    <div className="text-[11px] text-slate-400">Versioned Tagged Registry</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Stage Group 4: Kubernetes & Live Traffic */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3">
                Phase 4: Kubernetes Deployment on AWS EC2
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedNodeId('k8s')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    selectedNodeId === 'k8s' ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="p-2 rounded bg-purple-950/40 text-purple-400 border border-purple-800/40">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Kubernetes (K3s)</div>
                    <div className="text-[11px] text-slate-400">2 Replicas · RollingUpdate</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedNodeId('enduser')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    selectedNodeId === 'enduser' ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="p-2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white">Live NodePort 30080</div>
                    <div className="text-[11px] text-slate-400">Accessible on AWS Public IP</div>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* AWS EC2 Inbound Firewall Port Matrix */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-2">AWS EC2 Security Group Inbound Rules:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SSH</span>
                <span className="text-white">Port 22</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Jenkins</span>
                <span className="text-cyan-400">Port 8080</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SonarQube</span>
                <span className="text-indigo-400">Port 9000</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">App NodePort</span>
                <span className="text-emerald-400">Port 30080</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Node Details Inspector */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{selectedNode.category}</span>
              <h3 className="text-lg font-bold text-white">{selectedNode.name}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
              {selectedNode.icon}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Functional Responsibility</div>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.role}</p>
          </div>

          {/* Port and Protocol */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Network Port / Protocol</span>
            <span className="text-xs font-mono text-cyan-300 font-semibold">{selectedNode.ports}</span>
          </div>

          {/* Configuration Summary */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Configuration Overview</div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
              {selectedNode.configSummary}
            </div>
          </div>

          {/* Security & Production Consideration */}
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40">
            <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DevSecOps Best Practice</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {selectedNode.securityNote}
            </p>
          </div>

          {/* Quick Terminal Commands */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Essential Terminal Commands</div>
            <div className="space-y-2">
              {selectedNode.commands.map((cmd, i) => (
                <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs text-slate-300">
                  <span className="truncate pr-2">{cmd}</span>
                  <button 
                    onClick={() => handleCopy(cmd)}
                    className="text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedText === cmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA to jump to relevant stage */}
          <button
            onClick={() => onNavigateToStage(selectedNode.id === 'git' ? 6 : selectedNode.id === 'jenkins' ? 1 : selectedNode.id === 'maven' ? 2 : selectedNode.id === 'sonar' ? 3 : selectedNode.id === 'docker' ? 4 : selectedNode.id === 'k8s' ? 5 : 7)}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <span>Jump to Hands-On Implementation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
