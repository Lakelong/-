export enum Subject {
  MATH = '数学',
  PHYSICS = '物理',
  CHEMISTRY = '化学',
  ENGLISH = '英语',
  CHINESE = '语文',
  BIOLOGY = '生物',
  HISTORY = '历史',
  GEOGRAPHY = '地理',
}

export enum GradeLevel {
  JUNIOR_1 = '初一',
  JUNIOR_2 = '初二',
  JUNIOR_3 = '初三',
  SENIOR_1 = '高一',
  SENIOR_2 = '高二',
  SENIOR_3 = '高三',
}

export enum TextbookVersion {
  SU_JIAO = '苏教版',
  REN_JIAO = '人教版',
  BEI_SHI_DA = '北师大版',
  HU_JIAO = '沪教版',
  LU_JIAO = '鲁教版',
  ZHE_JIAO = '浙教版',
  XIANG_JIAO = '湘教版',
  HUA_SHI_DA = '华师大版',
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  DIAGNOSTIC = 'DIAGNOSTIC',
  REPORT = 'REPORT',
  PLAN = 'PLAN',
}

// Diagnostic Question Structure
export interface Question {
  id: number;
  text: string;
  type: 'multiple_choice' | 'short_answer';
  options?: string[]; // For multiple choice
  topic: string; // The knowledge point being tested
}

// User's answer to a question
export interface Answer {
  questionId: number;
  userResponse: string;
}

// Analysis Result Structure
export interface TopicMastery {
  topic: string;
  score: number; // 0-100
  status: 'Mastered' | 'Needs Improvement' | 'Critical';
  feedback: string;
}

export interface DiagnosticSummary {
  overview: string;      // General assessment
  knowledgeAnalysis: string[]; // Analysis of knowledge depth/breadth (List)
  suggestions: string[];   // High-level advice (List)
}

export interface DiagnosticReport {
  overallScore: number;
  summary: DiagnosticSummary;
  topicBreakdown: TopicMastery[];
  strengths: string[];
  weaknesses: string[];
  radarData: { subject: string; A: number; fullMark: number }[]; // For Radar Chart
}

// New Practice Question Structure for Daily Plan
export interface PracticeQuestion {
  text: string;
  type: 'multiple_choice' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

// Study Plan Structure
export interface StudyTask {
  day: string;
  focusTopic: string;
  activity: string;
  durationMinutes: number;
  priority: 'High' | 'Medium' | 'Low';
  practiceExercises: PracticeQuestion[]; // Updated to structured questions
}

export interface StudyPlan {
  weeklyGoal: string;
  schedule: StudyTask[];
}