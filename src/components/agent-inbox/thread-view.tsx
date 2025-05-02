import React from "react";
import { Thread } from "@langchain/langgraph-sdk";
import { ThreadPanel } from "./components/thread-panel";
import { useThreadsContext } from "./contexts/ThreadContext";
import { ThreadData } from "./types";
import { useQueryParams } from "./hooks/use-query-params";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "./constants";
import { THREAD_VIEW_CONFIG } from "./view-config";

export function ThreadView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadId }: { threadId: string }) {
  const { updateQueryParams } = useQueryParams();
  const { threadData: threads, loading, agentInboxes } = useThreadsContext<ThreadValues>();
  const [threadData, setThreadData] =
    React.useState<ThreadData<ThreadValues>>();
  const [panelView, setPanelView] = React.useState<"state" | "description">("description");
  const [panelExpanded, setPanelExpanded] = React.useState(true);
  
  // Get the graph ID from the selected agent inbox
  
  // Get the graph ID from the selected agent inbox
  const graphId = agentInboxes.find(i => i.selected)?.graphId?.toLowerCase() || "default";
  const config = THREAD_VIEW_CONFIG[graphId] || THREAD_VIEW_CONFIG.default;
  console.log("[ThreadView] graphId:", graphId);
  console.log("[ThreadView] Selected Config:", config);

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (!threadId || !threads.length || loading) return;
      const selectedThread = threads.find(
        (t) => t.thread.thread_id === threadId
      );
      if (selectedThread) {
        setThreadData(selectedThread);
        return;
      } else {
        // Route the user back to the inbox view.
        updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
      }
    } catch (e) {
      console.error("Error updating query params & setting thread data", e);
    }
  }, [threads, loading, threadId]);

  // Handle showing/hiding the side panel
  const handleShowSidePanel = (panel: "state" | "description") => {
    if (panelView === panel && panelExpanded) {
      // If the panel is already expanded and showing the requested view, collapse it
      setPanelExpanded(false);
    } else {
      // Otherwise, show the requested panel
      setPanelView(panel);
      setPanelExpanded(true);
    }
  };

  if (!threadData) {
    return null;
  }

  // Determine if this is an interrupted thread or a completed thread
  const isInterrupted = 
    threadData.status === "interrupted" && 
    threadData.interrupts && 
    threadData.interrupts.length > 0;
  
  const isCompleted = threadData.status === "idle" || threadData.status === "error";

  // Determine the component and state key based on status
  let ViewComponent: React.ComponentType<any>;
  let stateKey: string | undefined;
  console.log("[ThreadView] isInterrupted:", isInterrupted, "isCompleted:", isCompleted);

  if (isInterrupted) {
    ViewComponent = config.actionViewComponent;
    // Action view specific props might be needed here if not handled internally
    // For now, assuming ThreadActionsView handles its own data needs via hooks/props
  } else if (isCompleted) {
    ViewComponent = config.finalViewComponent;
    stateKey = config.finalStateKey;
    console.log("[ThreadView] Using Final View Component:", ViewComponent.name, "with stateKey:", stateKey);
  } else {
    // If it's neither interrupted nor completed (e.g., busy), don't render a specific view yet
    // Or potentially render a loading/busy state? For now, return null.
    return null; 
  }

  // Common props for the view component
  const viewProps = {
    threadData: threadData,
    stateKey: stateKey, // Pass stateKey for final views
    // Props needed by ThreadActionsView (if ViewComponent is ThreadActionsView)
    ...(isInterrupted && {
      setThreadData: setThreadData,
      handleShowSidePanel: handleShowSidePanel,
      panelView: panelView,
      panelExpanded: panelExpanded,
      // Ensure interrupts is passed correctly if needed directly by ThreadActionsView
      // This might require adjusting ThreadActionsView props or how data is passed
      interrupts: threadData.interrupts || [], 
    }),
    // Props needed by Final Views (Survey/Markdown) are handled via stateKey
  };

  return (
    <ThreadPanel
      threadData={threadData}
      panelView={panelView}
      panelExpanded={panelExpanded}
      handleShowSidePanel={handleShowSidePanel}
    >
      {/* Render the dynamically selected component */}
      <ViewComponent {...viewProps} />
    </ThreadPanel>
  );
}
