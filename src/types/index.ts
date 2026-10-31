export type ActiveTab = 'architecture' | 'lab' | 'repo' | 'simulator' | 'career';

export interface LabStage {
  id: number;
  slug: string;
  title: string;
  category: string;
  duration: string;
  mentorNote: string;
  executionLocation: 'AWS EC2 Terminal' | 'Local Machine' | 'Jenkins Web UI' | 'SonarQube Web UI' | 'GitHub Web UI';
  prerequisites: string[];
  commands: {
    label: string;
    description: string;
    code: string;
    expectedOutput?: string;
  }[];
  configFiles?: {
    filename: string;
    path: string;
    content: string;
    explanation: string;
  }[];
  pitfalls: {
    error: string;
    cause: string;
    solution: string;
  }[];
  verificationSteps: string[];
}

export interface PipelineStep {
  id: string;
  name: string;
  tool: string;
  duration: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  logs: string[];
}

export interface TroubleshootingItem {
  id: string;
  category: 'Docker' | 'Jenkins' | 'Kubernetes' | 'SonarQube' | 'Maven' | 'AWS';
  errorSnippet: string;
  scenario: string;
  rootCause: string;
  resolutionCommands: string;
  preventionTip: string;
}

export interface InterviewQA {
  id: string;
  question: string;
  category: string;
  difficulty: 'Fresher' | 'Junior' | 'Intermediate';
  mentorAnswer: string;
  keyPhrases: string[];
}
