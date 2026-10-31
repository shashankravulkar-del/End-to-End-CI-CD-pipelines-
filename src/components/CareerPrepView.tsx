import React, { useState } from 'react';
import { INTERVIEW_QUESTIONS, TROUBLESHOOTING_DATABASE } from '../data/projectData';
import { 
  Briefcase, Linkedin, Camera, HelpCircle, Copy, Check, 
  ExternalLink, CheckCircle2, ChevronDown, ChevronUp, Sparkles, BookOpen
} from 'lucide-react';

export const CareerPrepView: React.FC = () => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string>('q-1');
  const [resumeLevel, setResumeLevel] = useState<'fresher' | 'junior'>('fresher');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const resumeBullets = {
    fresher: `End-to-End CI/CD Pipeline Automation | Jenkins, Docker, Kubernetes, AWS, SonarQube
• Architected and configured a complete automated CI/CD pipeline on an AWS EC2 Ubuntu instance for a Java Spring Boot microservice, eliminating manual deployment overhead.
• Automated Continuous Integration using Jenkins Declarative Pipelines, triggered via GitHub Webhooks upon code push to main branch.
• Integrated SonarQube static code analysis with quality gates to automatically enforce code coverage thresholds and prevent bugs from entering production.
• Packaged the application into production-grade multi-stage Docker images running as non-root user (appuser), reducing final image footprint by 62%.
• Automated artifact publishing to Docker Hub and executed zero-downtime rolling updates onto a Kubernetes cluster using readiness and liveness health probes.
• Configured Kubernetes Deployment manifests with CPU/RAM resource quotas and exposed the service externally via NodePort 30080.`,
    junior: `Enterprise DevSecOps & Cloud Infrastructure Automation | AWS, Kubernetes, Docker, Jenkins
• Engineered an enterprise CI/CD release workflow on AWS EC2, slashing software release cycles from 45 minutes to 6 minutes while enforcing DevSecOps best practices.
• Implemented Jenkins Declarative Pipelines with asynchronous SonarQube Quality Gate webhooks, Trivy image vulnerability scanning, and automated post-build workspace cleanup.
• Built secure, optimized multi-stage Docker containers with Alpine JRE, enforcing least-privilege non-root execution and JVM CGroup memory boundaries.
• Orchestrated Kubernetes Deployments with zero-downtime RollingUpdate strategies (maxSurge=1, maxUnavailable=0) and customized Actuator health probes (/health and /ready).
• Authored comprehensive Infrastructure-as-Code bash provisioning scripts to bootstrap full toolchains (Docker, Jenkins, K3s, OpenJDK 17) in under 3 minutes.`
  };

  const linkedInPost = `🚀 Excited to share my latest hands-on DevOps project: End-to-End CI/CD Pipeline Automation with Jenkins, Docker, Kubernetes, and AWS!

As part of my journey into Cloud & DevOps Engineering, I built an industry-standard, fully automated CI/CD pipeline from scratch for a Java Spring Boot microservice.

Key Engineering Highlights:
🔹 Automated CI/CD Trigger: GitHub Webhooks trigger Jenkins declarative pipelines automatically on git push.
🔹 Code Quality & Security: SonarQube Quality Gate integration to fail builds automatically if bugs, security hotspots, or coverage criteria violate enterprise thresholds.
🔹 Optimized Containerization: Multi-stage Dockerfile adhering to least privilege principles (non-root runner, minimal Alpine JRE image, reduced image size by 62%).
🔹 Orchestration on AWS EC2: Kubernetes deployment featuring zero-downtime rolling updates, custom health probes (/health & /ready), and NodePort routing.
🔹 Error Handling & Resilience: Automated post-action workspace cleanup, artifact preservation, and pipeline abort mechanics.

👉 Explore the complete architecture, configuration files, and documentation on GitHub:
https://github.com/yourusername/devops-java-app

Special thanks to the DevOps community for continuous guidance! Always eager to learn and take on new challenges.

#DevOps #Kubernetes #Docker #AWS #Jenkins #CICD #CloudEngineering #DevSecOps #Java`;

  const screenshotsChecklist = [
    {
      title: 'AWS EC2 Instance & Security Groups',
      description: 'Show EC2 Management Console with running instance, public IP, and Inbound Rules for ports 22, 8080, 9000, 30080.',
      importance: 'Proves you configured real cloud infrastructure rather than just local simulations.'
    },
    {
      title: 'GitHub Webhook Green Checkmark',
      description: 'Screenshot of GitHub Repo > Settings > Webhooks showing HTTP 200 OK delivery to Jenkins.',
      importance: 'Validates automated event-driven CI trigger.'
    },
    {
      title: 'SonarQube Quality Gate "Passed" Dashboard',
      description: 'SonarQube project dashboard showing 0 Bugs, 0 Vulnerabilities, 0 Security Hotspots, and Quality Gate PASSED.',
      importance: 'Shows recruiters you understand DevSecOps and code quality gates.'
    },
    {
      title: 'Docker Hub Tagged Repository',
      description: 'Docker Hub page showing build-tagged images (build-1, build-2, latest) pushed by Jenkins.',
      importance: 'Demonstrates automated container artifact management.'
    },
    {
      title: 'Jenkins Pipeline Stage View (All Green Stages)',
      description: 'Jenkins Web UI displaying all 9 stages in green from Checkout to Rollout Verification.',
      importance: 'The hero screenshot of any DevOps portfolio.'
    },
    {
      title: 'Kubernetes Cluster Status (kubectl get pods,svc)',
      description: 'EC2 terminal showing kubectl get pods -o wide (2/2 Running) and service mapped to NodePort 30080.',
      importance: 'Proves real container orchestration.'
    },
    {
      title: 'Live Browser Application Response',
      description: 'Browser tab open to http://<EC2-PUBLIC-IP>:30080/api/v1/info displaying UP status and pod hostname.',
      importance: 'The definitive proof that the end-to-end pipeline delivered a working application.'
    }
  ];

  return (
    <div className="space-y-10">
      
      {/* Section 1: ATS-Friendly Resume Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono text-cyan-400 mb-1">CAREER & PORTFOLIO</div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>ATS-Optimized Resume Project Description</span>
            </h2>
            <p className="text-xs text-slate-400">Battle-tested bullet points with quantifiable impact metrics</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => setResumeLevel('fresher')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  resumeLevel === 'fresher' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                DevOps Fresher
              </button>
              <button
                onClick={() => setResumeLevel('junior')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  resumeLevel === 'junior' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Junior DevOps (1-2 Yrs)
              </button>
            </div>

            <button
              onClick={() => handleCopy(resumeBullets[resumeLevel], 'resume')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {copiedItem === 'resume' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedItem === 'resume' ? 'Copied' : 'Copy Bullets'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed">
          {resumeBullets[resumeLevel]}
        </div>
      </div>

      {/* Section 2: Portfolio Screenshots Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Recruiter Screenshots Checklist (7 Mandatory Proofs)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Include these screenshots in your GitHub README to prove hands-on implementation to hiring managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {screenshotsChecklist.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-[11px] font-mono text-cyan-400 flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-white">{item.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">{item.description}</p>
              <div className="text-[11px] text-cyan-300/80 bg-cyan-950/20 p-2 rounded border border-cyan-900/30 ml-7">
                <span className="font-semibold text-cyan-300">Why Recruiters Value This: </span>
                {item.importance}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: LinkedIn Launch Post Template */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-cyan-400" />
              <span>Professional LinkedIn Announcement Post</span>
            </h2>
            <p className="text-xs text-slate-400">Ready to copy and share with your professional network</p>
          </div>

          <button
            onClick={() => handleCopy(linkedInPost, 'linkedin')}
            className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            {copiedItem === 'linkedin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedItem === 'linkedin' ? 'Copied to Clipboard' : 'Copy LinkedIn Post'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
          {linkedInPost}
        </div>
      </div>

      {/* Section 4: Top 5 Interview Questions & Mentor Answers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Top DevOps Fresher Interview Questions & Mentor Answers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Questions interviewers will ask you specifically about this project</p>
        </div>

        <div className="space-y-3">
          {INTERVIEW_QUESTIONS.map((qa) => {
            const isExpanded = expandedQuestionId === qa.id;

            return (
              <div key={qa.id} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                <button
                  onClick={() => setExpandedQuestionId(isExpanded ? '' : qa.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                      {qa.category}
                    </span>
                    <span className="text-xs font-bold text-white">{qa.question}</span>
                  </div>

                  <div className="text-slate-400 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-slate-900/40 border-t border-slate-800 space-y-3">
                    <div className="text-xs text-slate-300 leading-relaxed">
                      {qa.mentorAnswer}
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-slate-500">Key Buzzwords to Mention:</span>
                      {qa.keyPhrases.map((phrase, i) => (
                        <span key={i} className="text-xs text-cyan-300 font-mono bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
