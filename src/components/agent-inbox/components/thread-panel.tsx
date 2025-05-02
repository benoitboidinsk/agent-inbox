import React from "react";
import { ThreadPanelProps } from "../types/core"; // Use core types
import { cn } from "@/lib/utils";
import { StateViewAdapter } from "./state-view-adapter";
import { Button } from "@/components/ui/button"; // Import Button
import { ArrowLeft } from "lucide-react"; // Import ArrowLeft
import { ThreadIdCopyable } from "./thread-id"; // Import ThreadIdCopyable
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button"; // Import TooltipIconButton
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants"; // Import constant
import { useQueryParams } from "../hooks/use-query-params"; // Import hook
import { useThreadsContext } from "../contexts/ThreadContext"; // Import context hook
import { useToast } from "@/hooks/use-toast"; // Import toast hook
import { constructOpenInStudioURL } from "../utils"; // Import util

// ButtonGroup component (moved from ThreadActionsView)
function ButtonGroup({
  handleTogglePanel,
  panelView,
  panelExpanded,
}: {
  handleTogglePanel: (panel: "state" | "description") => void;
  panelView: "state" | "description";
  panelExpanded: boolean;
}) {
  return (
    <div className="flex flex-row gap-0 items-center justify-center">
      <Button
        variant="outline"
        className={cn(
          "rounded-l-md rounded-r-none border-r-[0px]",
          panelView === "state" && panelExpanded ? "text-black" : "bg-white"
        )}
        size="sm"
        onClick={() => handleTogglePanel("state")}
      >
        State
      </Button>
      <Button
        variant="outline"
        className={cn(
          "rounded-l-none rounded-r-md border-l-[0px]",
          panelView === "description" && panelExpanded ? "text-black" : "bg-white"
        )}
        size="sm"
        onClick={() => handleTogglePanel("description")}
      >
        Description
      </Button>
    </div>
  );
}


export function ThreadPanel<T extends Record<string, any> = Record<string, any>>({
  threadData,
  panelView,
  panelExpanded,
  handleShowSidePanel,
  children
}: ThreadPanelProps<T>) {
  const showSidePanel = panelExpanded;
  const { updateQueryParams } = useQueryParams();
  const { agentInboxes } = useThreadsContext<T>(); // Use generic type T
  const { toast } = useToast();

  const deploymentUrl = agentInboxes.find((i) => i.selected)?.deploymentUrl;

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

  // Determine title based on thread status
  const isInterrupted = threadData.status === "interrupted" && threadData.interrupts && threadData.interrupts.length > 0;
  const threadTitle = isInterrupted
    ? threadData.interrupts?.[0]?.action_request?.action || "Action Required"
    : "Results"; // Title for completed threads

  const handleTogglePanel = (panel: "state" | "description") => {
    if (panelView === panel && panelExpanded) {
      handleShowSidePanel(panel === "state" ? "description" : "state"); // Toggle to the other view to collapse
    } else {
      handleShowSidePanel(panel); // Show the requested panel
    }
  };


  return (
    <div className="flex flex-col lg:flex-row w-full h-full">
      {/* Main Content Area (Left Side) */}
      <div
        className={cn(
          "flex flex-col overflow-y-auto", // Changed to flex-col
          showSidePanel ? "lg:min-w-1/2 lg:max-w-2xl w-full" : "w-full"
        )}
      >
        {/* --- Header (Moved Here) --- */}
        <div className="flex flex-wrap items-center justify-between w-full gap-3 p-6 border-b"> {/* Added padding and border */}
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
            <ButtonGroup
              handleTogglePanel={handleTogglePanel}
              panelView={panelView}
              panelExpanded={panelExpanded}
            />
          </div>
        </div>
        {/* --- End Header --- */}

        {/* Specific View Content */}
        <div className="flex-grow overflow-y-auto"> {/* Allow content to scroll */}
          {children}
        </div>
      </div>

      {/* Side Panel Area (Right Side) */}
      <div
        className={cn(
          showSidePanel ? "flex" : "hidden",
          "overflow-y-auto lg:max-w-1/2 w-full border-l" // Added border
        )}
      >
        <StateViewAdapter
          handleShowSidePanel={handleShowSidePanel}
          threadData={threadData}
          view={panelView}
        />
      </div>
    </div>
  );
}
