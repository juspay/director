export type ApprovalRequest = {
  action: string;
  description: string;
  context?: Record<string, unknown>;
};

export type PptOptions = {
  /** Number of slides (5-50). */
  pages?: number;
  theme?: string;
  audience?: string;
  tone?: string;
  generateAIImages?: boolean;
  aspectRatio?: '16:9' | '4:3' | '9:16';
};

export type PptResult = {
  filePath: string;
  totalSlides?: number;
};
