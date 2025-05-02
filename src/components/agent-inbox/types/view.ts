import { ThreadData } from "../types";

// Survey data types
export interface Question {
  id: string;
  text: string;
  answer?: string;
  type?: string;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  content?: string;
  questions?: Question[];
}

export interface Survey {
  title: string;
  description?: string;
  subject: string;
  objective: string;
  sections: Section[];
}

// View configuration types
export interface ViewConfig {
  // For final view (completed threads)
  finalStateKey?: string;
  // For action view (interrupted threads)
  actionStateKey?: string;
}

// Base props for thread panel
export interface ThreadPanelProps<T extends Record<string, any> = Record<string, any>> {
  threadData: ThreadData<T>;
  panelView: "state" | "description";
  panelExpanded: boolean;
  handleShowSidePanel: (panel: "state" | "description") => void;
  children: React.ReactNode;
}

// Type guard to check if data is a valid Survey object
export function isSurveyData(data: any): data is Survey {
  return (
    data &&
    typeof data === "object" &&
    typeof data.title === "string" &&
    typeof data.subject === "string" &&
    typeof data.objective === "string" &&
    Array.isArray(data.sections)
  );
}
