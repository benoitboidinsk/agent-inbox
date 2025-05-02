import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThreadData } from "../types";
import { constructOpenInStudioURL } from "../utils";
import { ThreadIdCopyable } from "./thread-id";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { useToast } from "@/hooks/use-toast";
import { useQueryParams } from "../hooks/use-query-params";
import { useThreadsContext } from "../contexts/ThreadContext";
import { MarkdownText } from "@/components/ui/markdown-text";
import { Survey } from "../types/view";
import { SectionRenderer } from "./section-renderer";
import { THREAD_VIEW_CONFIG } from "../view-config";

interface ThreadFinalViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  handleShowSidePanel: (panel: "state" | "description") => void;
  panelView: "state" | "description";
  panelExpanded: boolean;
}

export function ThreadFinalView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  handleShowSidePanel,
  panelView,
  panelExpanded,
}: ThreadFinalViewProps<ThreadValues>) {
  const { agentInboxes } = useThreadsContext<ThreadValues>();
  const { toast } = useToast();
  const { updateQueryParams } = useQueryParams();

  const deploymentUrl = agentInboxes.find((i) => i.selected)?.deploymentUrl;
  const graphId = agentInboxes.find((i) => i.selected)?.graphId?.toLowerCase();
  
  // Get the view config for this graph
  const config = THREAD_VIEW_CONFIG[graphId || ""] || THREAD_VIEW_CONFIG.default;
  
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

  const values = threadData.thread.values || {};
  
  // Determine what to render based on the config
  const surveyData = config.finalStateKey ? values[config.finalStateKey] as Survey : null;
  const markdownContent = !surveyData && config.finalStateKey ? values[config.finalStateKey] as string : null;
  
  // Fallback content if no specific content is found
  const fallbackContent = values.output || values.result || "No results available";

  // Toggle panel view
  const togglePanel = (panel: "state" | "description") => {
    if (panelView === panel && panelExpanded) {
      // If the panel is already expanded and showing the requested view, collapse it
      handleShowSidePanel(panel === "state" ? "description" : "state");
    } else {
      // Otherwise, show the requested panel
      handleShowSidePanel(panel);
    }
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
          <p className="text-2xl tracking-tighter text-pretty">Results</p>
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
          <div className="flex flex-row gap-0 items-center justify-center">
            <Button
              variant="outline"
              className={`rounded-l-md rounded-r-none border-r-[0px] ${
                panelView === "state" && panelExpanded ? "text-black" : "bg-white"
              }`}
              size="sm"
              onClick={() => togglePanel("state")}
            >
              State
            </Button>
            <Button
              variant="outline"
              className={`rounded-l-none rounded-r-md border-l-[0px] ${
                panelView === "description" && panelExpanded ? "text-black" : "bg-white"
              }`}
              size="sm"
              onClick={() => togglePanel("description")}
            >
              Description
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
        {surveyData ? (
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">{surveyData.title}</h2>
              {surveyData.description && (
                <p className="text-gray-600">{surveyData.description}</p>
              )}
              <div className="mt-4 space-y-2">
                <div>
                  <span className="font-semibold">Subject:</span> {surveyData.subject}
                </div>
                <div>
                  <span className="font-semibold">Objective:</span> {surveyData.objective}
                </div>
              </div>
            </div>
            <div className="space-y-8">
              {surveyData.sections.map((section, index) => (
                <div key={section.id}>
                  {index > 0 && <div className="my-8 h-px bg-gray-200"></div>}
                  <SectionRenderer section={section} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            <MarkdownText>
              {markdownContent || fallbackContent}
            </MarkdownText>
          </div>
        )}
      </div>
    </div>
  );
}
