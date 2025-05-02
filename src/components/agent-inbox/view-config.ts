import React from "react";
import { ViewConfig } from "./types/core"; // Updated import path
import { ThreadActionsView } from "./components/thread-actions-view"; // Assuming this is the generic action view
import { MarkdownFinalView } from "./views/MarkdownFinalView";
import { SurveyFinalView } from "./views/SurveyFinalView";

// Define the extended config interface including components
interface ThreadViewConfigExtended extends ViewConfig {
  actionViewComponent: React.ComponentType<any>; // Adjust 'any' as needed
  finalViewComponent: React.ComponentType<any>;  // Adjust 'any' as needed
}

// Configuration for different graph types
export const THREAD_VIEW_CONFIG: Record<string, ThreadViewConfigExtended> = {
  // Survey Builder graph uses SurveyFinalView
  survey_builder: {
    actionViewComponent: ThreadActionsView,
    finalViewComponent: SurveyFinalView,
    finalStateKey: "final_survey",
    actionStateKey: "description" // Assuming description is still used for actions
  },
  
  // Dashboard Analyzer graph uses MarkdownFinalView
  dashboard_analyzer: {
    actionViewComponent: ThreadActionsView,
    finalViewComponent: MarkdownFinalView,
    finalStateKey: "output",
    actionStateKey: "description"
  },
  
  // Default configuration uses MarkdownFinalView
  default: {
    actionViewComponent: ThreadActionsView,
    finalViewComponent: MarkdownFinalView,
    finalStateKey: "output", // Default key for markdown
    actionStateKey: "description"
  }
};
