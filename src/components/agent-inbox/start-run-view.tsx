import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { START_RUN_QUERY_PARAM } from "./constants";
import { useQueryParams } from "./hooks/use-query-params";
import { useThreadsContext } from "./contexts/ThreadContext";
import React from "react";

export function StartRunView() {
  const { updateQueryParams } = useQueryParams();
  const { agentInboxes } = useThreadsContext();
  
  // Get the selected agent inbox
  const selectedInbox = agentInboxes.find(inbox => inbox.selected);

  return (
    <div className="flex flex-col min-h-full w-full p-12 gap-9">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between w-full gap-3">
        <div className="flex items-center justify-start gap-3">
          <TooltipIconButton
            variant="ghost"
            onClick={() => updateQueryParams(START_RUN_QUERY_PARAM)}
            tooltip="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </TooltipIconButton>
          <p className="text-2xl tracking-tighter text-pretty">Start New Run</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 w-full">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          {selectedInbox ? (
            <>
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Agent</p>
                <p className="text-base font-medium">
                  {selectedInbox.name || selectedInbox.graphId}
                </p>
              </div>
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Graph ID</p>
                <p className="text-base font-medium">{selectedInbox.graphId}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500 italic">
                  This is a placeholder for the input form that will be used to create a new thread and start a run.
                  The actual form implementation will be added later.
                </p>
              </div>
            </>
          ) : (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-500 italic">
                No agent inbox selected. Please select an agent inbox in settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
