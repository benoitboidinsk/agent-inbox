import React from "react";
import { ThreadPanelProps } from "../types/view";
import { cn } from "@/lib/utils";
import { StateViewAdapter } from "./state-view-adapter";

export function ThreadPanel<T extends Record<string, any> = Record<string, any>>({
  threadData,
  panelView,
  panelExpanded,
  handleShowSidePanel,
  children
}: ThreadPanelProps<T>) {
  const showSidePanel = panelExpanded;

  return (
    <div className="flex flex-col lg:flex-row w-full h-full">
      <div
        className={cn(
          "flex overflow-y-auto",
          showSidePanel ? "lg:min-w-1/2 lg:max-w-2xl w-full" : "w-full"
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          showSidePanel ? "flex" : "hidden",
          "overflow-y-auto lg:max-w-1/2 w-full"
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
