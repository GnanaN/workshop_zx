export interface User {
  id: string;
  email: string;
  role: string | null;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  url: string;
  description: string | null;
  targetAudience: string | null;
  sellingPoints: string | null;
  advantages: string | null;
  strategy: string | null;
}

export type CompetitorStatus = 'monitoring' | 'paused' | 'collecting';

export interface Competitor {
  id: string;
  userId: string;
  name: string;
  domain: string;
  status: CompetitorStatus;
  relatedLinks: string[];
  companyInfo: Record<string, string>;
}

export type ReportPriority = 'urgent' | 'medium' | 'low';

export interface AnalysisReport {
  id: string;
  competitorId: string;
  userId: string;
  changeSummary: { title: string; summary: string }[];
  strategicIntent: string;
  actionSuggestions: { level: string; action: string; reason: string }[];
  priority: ReportPriority;
  sourceUrl: string;
  readAt: string | null;
  createdAt: string;
}

export type FeedbackType = 'useful' | 'wrong' | 'not_important';

export type ErrorType =
  | 'inaccurate'
  | 'irrelevant'
  | 'outdated'
  | 'duplicate'
  | 'wrong_intent'
  | 'missing_change'
  | 'too_noisy'
  | 'bad_source';

export interface Feedback {
  id: string;
  reportId: string;
  userId: string;
  type: FeedbackType;
  errorType: ErrorType | null;
}
