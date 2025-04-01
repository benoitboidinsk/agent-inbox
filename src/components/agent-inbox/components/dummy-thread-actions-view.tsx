import { Button } from "@/components/ui/button";
import { Thread } from "@langchain/langgraph-sdk";
import { ArrowLeft } from "lucide-react";
import { ThreadData } from "../types";
import { constructOpenInStudioURL } from "../utils";
import { ThreadIdCopyable } from "./thread-id";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryParams } from "../hooks/use-query-params";
import { useThreadsContext } from "../contexts/ThreadContext";

interface DummyThreadActionsViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  handleShowSidePanel: (showState: boolean, showDescription: boolean) => void;
  showState: boolean;
  showDescription: boolean;
}

function ButtonGroup({
  handleShowState,
  handleShowDescription,
  showingState,
  showingDescription,
}: {
  handleShowState: () => void;
  handleShowDescription: () => void;
  showingState: boolean;
  showingDescription: boolean;
}) {
  return (
    <div className="flex flex-row gap-0 items-center justify-center">
      <Button
        variant="outline"
        className={cn(
          "rounded-l-md rounded-r-none border-r-[0px]",
          showingState ? "text-black" : "bg-white"
        )}
        size="sm"
        onClick={handleShowState}
      >
        State
      </Button>
      <Button
        variant="outline"
        className={cn(
          "rounded-l-none rounded-r-md border-l-[0px]",
          showingDescription ? "text-black" : "bg-white"
        )}
        size="sm"
        onClick={handleShowDescription}
      >
        Details
      </Button>
    </div>
  );
}

export function DummyThreadActionsView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  handleShowSidePanel,
  showDescription,
  showState,
}: DummyThreadActionsViewProps<ThreadValues>) {
  const { agentInboxes } = useThreadsContext<ThreadValues>();
  const { toast } = useToast();
  const { updateQueryParams } = useQueryParams();

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

  const threadTitle = `Thread (${threadData.status})`;

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
          <ButtonGroup
            handleShowState={() => handleShowSidePanel(true, false)}
            handleShowDescription={() => handleShowSidePanel(false, true)}
            showingState={showState}
            showingDescription={showDescription}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
            <div className="flex items-center">
              <span className={cn(
                "inline-block w-3 h-3 rounded-full mr-2",
                threadData.status === "idle" ? "bg-gray-400" :
                threadData.status === "busy" ? "bg-blue-500" :
                threadData.status === "error" ? "bg-red-500" : "bg-yellow-500"
              )}></span>
              <p className="text-base font-medium capitalize">{threadData.status}</p>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Created At</p>
            <p className="text-base font-medium">
              {new Date(threadData.thread.created_at).toLocaleString()}
            </p>
          </div>
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Updated At</p>
            <p className="text-base font-medium">
              {new Date(threadData.thread.updated_at).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500 italic">
              This is a dummy page for {threadData.status} threads. Additional functionality will be implemented in the future.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
