import React from "react"; // Added React import
import { Button } from "@/components/ui/button";
import { Thread } from "@langchain/langgraph-sdk";
// Removed ArrowLeft import
import { HumanInterrupt, ThreadData } from "../types";
// Removed constructOpenInStudioURL import
// Removed ThreadIdCopyable import
import { InboxItemInput } from "./inbox-item-input";
import useInterruptedActions from "../hooks/use-interrupted-actions";
// Removed TooltipIconButton import
// Removed VIEW_STATE_THREAD_QUERY_PARAM import
// Removed useToast import
import { cn } from "@/lib/utils";
// Removed useQueryParams import
// Removed useThreadsContext import

interface ThreadActionsViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: {
    thread: Thread<ThreadValues>;
    status: "interrupted";
    interrupts: HumanInterrupt[];
  };
  setThreadData: React.Dispatch<
    React.SetStateAction<ThreadData<ThreadValues> | undefined>
  >;
  handleShowSidePanel: (panel: "state" | "description") => void;
  // Props related to panel toggling are no longer needed here
  // handleShowSidePanel: (panel: "state" | "description") => void;
  // panelView: "state" | "description";
  // panelExpanded: boolean;
}

// Removed ButtonGroup component as it's moved to ThreadPanel

export function ThreadActionsView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  setThreadData,
  // Removed panel-related props
}: ThreadActionsViewProps<ThreadValues>) {
  const {
    acceptAllowed,
    hasEdited,
    hasAddedResponse,
    streaming,
    supportsMultipleMethods,
    streamFinished,
    currentNode,
    loading,
    handleSubmit,
    handleIgnore,
    handleResolve,
    setSelectedSubmitType,
    setHasAddedResponse,
    setHasEdited,
    humanResponse,
    setHumanResponse,
    initialHumanInterruptEditValue,
  } = useInterruptedActions<ThreadValues>({
    threadData,
    setThreadData,
  });
  // Removed context/hook calls related to header elements
  const actionsDisabled = loading || streaming;
  const ignoreAllowed = threadData.interrupts[0].config.allow_ignore;

  return (
    // Removed outer padding, assuming ThreadPanel or parent handles it
    <div className="flex flex-col w-full p-6 gap-6"> {/* Adjusted padding/gap */}
      {/* Header Removed */}

      {/* Resolve/Ignore Buttons */}
      <div className="flex flex-row gap-2 items-center justify-start w-full"> {/* Kept this section */}
        <Button
          variant="outline"
          className="text-gray-800 border-gray-500 font-normal bg-white"
          onClick={handleResolve}
          disabled={actionsDisabled}
        >
          Mark as Resolved
        </Button>
        {ignoreAllowed && (
          <Button
            variant="outline"
            className="text-gray-800 border-gray-500 font-normal bg-white"
            onClick={handleIgnore}
            disabled={actionsDisabled}
          >
            Ignore
          </Button>
        )}
      </div>

      {/* Actions */}
      <InboxItemInput
        acceptAllowed={acceptAllowed}
        hasEdited={hasEdited}
        hasAddedResponse={hasAddedResponse}
        interruptValue={threadData.interrupts[0]}
        humanResponse={humanResponse}
        initialValues={initialHumanInterruptEditValue.current}
        setHumanResponse={setHumanResponse}
        streaming={streaming}
        streamFinished={streamFinished}
        currentNode={currentNode}
        supportsMultipleMethods={supportsMultipleMethods}
        setSelectedSubmitType={setSelectedSubmitType}
        setHasAddedResponse={setHasAddedResponse}
        setHasEdited={setHasEdited}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
