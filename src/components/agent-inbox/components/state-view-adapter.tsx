import React from "react";
import { StateView } from "./state-view";
import { ThreadData } from "../types";

interface StateViewAdapterProps {
  threadData: ThreadData<Record<string, any>>;
  handleShowSidePanel: (panel: "state" | "description") => void;
  view: "state" | "description";
}

export function StateViewAdapter({
  threadData,
  handleShowSidePanel,
  view,
}: StateViewAdapterProps) {
  // Adapter function to convert from new panel-based API to old boolean-based API
  const handleShowSidePanelAdapter = (showState: boolean, showDescription: boolean) => {
    if (showState) {
      handleShowSidePanel("state");
    } else if (showDescription) {
      handleShowSidePanel("description");
    } else {
      // If both are false, we're closing the panel
      handleShowSidePanel(view === "state" ? "description" : "state");
    }
  };

  return (
    <StateView
      threadData={threadData}
      handleShowSidePanel={handleShowSidePanelAdapter}
      view={view}
    />
  );
}
