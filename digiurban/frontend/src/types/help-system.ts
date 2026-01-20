export interface HelpStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  videoUrl?: string;
  tips?: string[];
  warnings?: string[];
  relatedLinks?: {
    label: string;
    url: string;
  }[];
}

export interface HelpFAQ {
  question: string;
  answer: string;
}

export interface HelpSection {
  id: string;
  emoji: string;
  title: string;
  description: string;
  steps: HelpStep[];
  faqs?: HelpFAQ[];
}

export interface HelpTroubleshooting {
  problem: string;
  solution: string;
}

export interface HelpContent {
  pageTitle: string;
  pageDescription: string;
  quickTips?: string[];
  sections: HelpSection[];
  troubleshooting?: HelpTroubleshooting[];
}
