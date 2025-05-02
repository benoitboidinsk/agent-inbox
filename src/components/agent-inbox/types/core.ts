import React from "react";
import { ThreadData } from "../types"; // Assuming core ThreadData is in ../types

// --- Config and Panel Types ---

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

// Note: Removed Survey, Section, Question interfaces and isSurveyData type guard.
// They are now located in survey.ts
