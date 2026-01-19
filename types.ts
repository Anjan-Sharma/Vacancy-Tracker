export interface Vacancy {
  id: string;
  title: string;
  organization: string;
  publishedDate: string;
  deadline: string;        // Normal / Single Pay Deadline
  deadlineDouble?: string; // Double Pay Deadline (optional)
  daysRemaining?: string;  // Text indicating remaining time (e.g. "5 days left")
  description: string;
  location?: string;
  vacancyNumber?: string;
  sourceUrl?: string;
  
  // Detailed fields
  qualification?: string; 
  level?: string;         
  eligibility?: string;   
  category?: string[];    // Changed to array to support multiple tags (e.g. ["Technical", "Admin"])
}

export interface SearchResult {
  vacancies: Vacancy[];
  rawSummary: string;
  sources: { title: string; uri: string }[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}