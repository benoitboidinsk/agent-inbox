import { Button } from "@/components/ui/button";
import { Thread } from "@langchain/langgraph-sdk";
import { ArrowLeft, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { ThreadData } from "../types";
import { constructOpenInStudioURL } from "../utils";
import { ThreadIdCopyable } from "./thread-id";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryParams } from "../hooks/use-query-params";
import { useThreadsContext } from "../contexts/ThreadContext";
import { StateViewObject } from "./state-view";
import { MarkdownText } from "@/components/ui/markdown-text";
import React, { useState, useEffect } from "react";

interface ThreadFinalViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  handleShowSidePanel: (showState: boolean, showDescription: boolean) => void;
}

// Configuration for which view to use based on graph ID
const GRAPH_VIEW_CONFIG = {
  // Map of graph IDs to their display configurations
  "Survey_Builder": {
    // The key in thread values to use for the markdown content
    markdownKey: "surveyMD",
    // Alternative keys to try if the primary key is not found
    alternativeMarkdownKeys: ["SurveyMD", "survey_md", "markdown"],
    // Title to display for the markdown section
    markdownTitle: "Survey Results",
    // Title to display for the state section
    stateTitle: "Complete State",
    // Function to get the page title
    getTitle: (values: Record<string, any>) => 
      values.survey_title || values.title || "Survey Results"
  },
  // Default configuration for any other graph
  "default": {
    markdownKey: "output",
    alternativeMarkdownKeys: ["result", "summary", "markdown"],
    markdownTitle: "Results",
    stateTitle: "Thread State",
    getTitle: (values: Record<string, any>) => 
      values.title || "Thread Results"
  }
};

// Helper function to get the markdown content from thread values
function getMarkdownContent(
  values: Record<string, any>,
  config: typeof GRAPH_VIEW_CONFIG[keyof typeof GRAPH_VIEW_CONFIG]
): string {
  // For debugging - log all keys in values
  console.log("Available keys in thread values:", Object.keys(values));
  
  // Try the primary key first
  if (values[config.markdownKey]) {
    console.log(`Found content in primary key: ${config.markdownKey}`);
    return values[config.markdownKey];
  }
  
  // Try alternative keys
  for (const key of config.alternativeMarkdownKeys) {
    if (values[key]) {
      console.log(`Found content in alternative key: ${key}`);
      return values[key];
    }
  }
  
  // If no markdown content is found, return empty string
  console.log("No markdown content found in any of the expected keys");
  return "";
}

export function ThreadFinalView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  handleShowSidePanel,
}: ThreadFinalViewProps<ThreadValues>) {
  const { agentInboxes } = useThreadsContext<ThreadValues>();
  const { toast } = useToast();
  const { updateQueryParams } = useQueryParams();
  const [expanded, setExpanded] = useState(false);

  const deploymentUrl = agentInboxes.find((i) => i.selected)?.deploymentUrl;
  const graphId = agentInboxes.find((i) => i.selected)?.graphId;

  // Get thread values
  const values = threadData.thread.values || {};
  
  // Determine which configuration to use based on graphId
  const configKey = graphId && GRAPH_VIEW_CONFIG[graphId as keyof typeof GRAPH_VIEW_CONFIG] 
    ? graphId as keyof typeof GRAPH_VIEW_CONFIG 
    : "default";
  
  const config = GRAPH_VIEW_CONFIG[configKey];
  
  // Get markdown content and title
  const markdownContent = getMarkdownContent(values, config);
  
  // Directly check for SurveyMD in case our helper function missed it
  const directSurveyMD = values.surveyMD || values.SurveyMD || values.survey_md || "";
  const effectiveMarkdownContent = markdownContent || directSurveyMD;
  
  const threadTitle = config.getTitle(values);
  
  // Log the content for debugging
  console.log("Markdown content:", effectiveMarkdownContent ? "Found" : "Not found");
  console.log("Thread values:", values);

  const handleOpenInStudio = () => {
    if (!deploymentUrl) {
      toast({
        title: "Error",
        description: "Please set the LangGraph deployment URL in settings.",
        duration: 5000,
      });
      return;
    }

    const studioUrl = constructOpenInStudioURL(
      deploymentUrl,
      threadData.thread.thread_id
    );
    window.open(studioUrl, "_blank");
  };

  return (
    <div className="flex flex-col min-h-full w-full p-12 gap-9">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between w-full gap-3">
        <div className="flex items-center justify-start gap-3">
          <TooltipIconButton
            variant="ghost"
            onClick={() => updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM)}
            tooltip="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </TooltipIconButton>
          <p className="text-2xl tracking-tighter text-pretty">{threadTitle}</p>
          <ThreadIdCopyable threadId={threadData.thread.thread_id} />
        </div>
        <div className="flex flex-row gap-2 items-center justify-start">
          {deploymentUrl && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 bg-white"
              onClick={handleOpenInStudio}
            >
              Studio
            </Button>
          )}
          <Button
            onClick={() => setExpanded((prev) => !prev)}
            variant="ghost"
            className="text-gray-600"
            size="sm"
          >
            {expanded ? (
              <ChevronsUpDown className="w-4 h-4" />
            ) : (
              <ChevronsDownUp className="w-4 h-4" />
            )}
            <span className="ml-1 text-xs">
              {expanded ? "Collapse All" : "Expand All"}
            </span>
          </Button>
        </div>
      </div>

      {/* Thread metadata */}
      <div className="flex flex-wrap gap-6 w-full mb-6">
        <div className="flex items-center bg-white rounded-md px-4 py-2 border border-gray-200">
          <span className={cn(
            "inline-block w-3 h-3 rounded-full mr-2",
            threadData.status === "idle" ? "bg-gray-400" :
            threadData.status === "busy" ? "bg-blue-500" :
            threadData.status === "error" ? "bg-red-500" : "bg-yellow-500"
          )}></span>
          <p className="text-sm font-medium capitalize">{threadData.status}</p>
        </div>
        
        <div className="flex items-center bg-white rounded-md px-4 py-2 border border-gray-200">
          <p className="text-sm">
            <span className="text-gray-500 mr-1">Created:</span>
            {new Date(threadData.thread.created_at).toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center bg-white rounded-md px-4 py-2 border border-gray-200">
          <p className="text-sm">
            <span className="text-gray-500 mr-1">Updated:</span>
            {new Date(threadData.thread.updated_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-full overflow-hidden">
        {/* Markdown content on the left */}
        <div className="min-w-0 overflow-hidden flex flex-col">
          <div className="border border-gray-200 rounded-lg flex flex-col h-full">
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="text-base font-medium">{config.markdownTitle}</h3>
            </div>
            <div className="p-4 overflow-auto flex-grow">
              <div className="prose max-w-none">
                <MarkdownText>
                  {effectiveMarkdownContent || "No results available"}
                </MarkdownText>
              </div>
            </div>
          </div>
        </div>
        
        {/* Full state on the right */}
        <div className="min-w-0 overflow-hidden flex flex-col">
          <div className="border border-gray-200 rounded-lg flex flex-col h-full">
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="text-base font-medium">{config.stateTitle}</h3>
            </div>
            <div className="p-4 overflow-auto flex-grow max-h-[calc(100vh-250px)]">
              <div className="flex flex-col gap-4">
                {Object.entries(values).map(([key, value], idx) => (
                  <StateViewObject
                    key={`state-view-${key}-${idx}`}
                    keyName={key}
                    value={value}
                    expanded={expanded}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
