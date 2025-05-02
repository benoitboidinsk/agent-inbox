"use client";

import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useQueryParams } from "../hooks/use-query-params";
import {
  AGENT_INBOX_PARAM,
  INBOX_PARAM,
  START_RUN_QUERY_PARAM, // Added import
  VIEW_STATE_THREAD_QUERY_PARAM,
} from "../constants";
import { HumanInterrupt, ThreadStatusWithAll } from "../types";
import { prettifyText } from "../utils";
import { useThreadsContext } from "../contexts/ThreadContext";
import React from "react";

export function BreadCrumb({ className }: { className?: string }) {
  const { searchParams } = useQueryParams();
  const { threadData, agentInboxes } = useThreadsContext();
  const [agentInboxLabel, setAgentInboxLabel] = React.useState<string>();
  const [selectedInboxLabel, setSelectedInboxLabel] = React.useState<string>();
  const [selectedThreadActionLabel, setSelectedThreadActionLabel] = React.useState<string>();
  const [selectedThreadResultLabel, setSelectedThreadResultLabel] = React.useState<string>();
  const [startRunLabel, setStartRunLabel] = React.useState<string>(); // Added state for start run label

  React.useEffect(() => {
    // Reset labels initially
    setSelectedInboxLabel(undefined);
    setSelectedThreadActionLabel(undefined);
    setSelectedThreadResultLabel(undefined);
    setStartRunLabel(undefined);

    try {
      // 1. Set Agent Inbox Label
      const selectedAgentInbox = agentInboxes.find((a) => a.selected);
      if (selectedAgentInbox) {
        const selectedAgentInboxLabel =
          selectedAgentInbox.name || prettifyText(selectedAgentInbox.graphId);
        setAgentInboxLabel(selectedAgentInbox.name || prettifyText(selectedAgentInbox.graphId));
      }

      // 2. Check for Start Run View
      const isStartRunView = searchParams.get(START_RUN_QUERY_PARAM) === 'true';
      if (isStartRunView) {
        setStartRunLabel("Start New Run");
        // No further labels needed for start run view
        return; 
      }

      // 3. Set Inbox Filter Label (if not in start run view)
      const selectedInboxParam = searchParams.get(INBOX_PARAM) as ThreadStatusWithAll | undefined;
      if (selectedInboxParam) {
        setSelectedInboxLabel(prettifyText(selectedInboxParam));
      }

      // 4. Check for Thread View (Action or Results)
      const selectedThreadIdParam = searchParams.get(VIEW_STATE_THREAD_QUERY_PARAM);
      if (selectedThreadIdParam) {
        const selectedThread = threadData.find(
          (t) => t.thread.thread_id === selectedThreadIdParam
        );
        if (selectedThread) {
          const selectedThreadAction = (selectedThread.interrupts as HumanInterrupt[] | undefined)?.[0]?.action_request?.action;
          if (selectedThreadAction) {
            // Interrupted Thread View
            setSelectedThreadActionLabel(prettifyText(selectedThreadAction));
          } else if (selectedThread.status === 'idle' || selectedThread.status === 'error') {
            // Completed Thread View
            setSelectedThreadResultLabel("Results");
          }
        }
      } 
    } catch (e) {
      console.error("Error while updating breadcrumb", e);
    }
  }, [searchParams, agentInboxes, threadData]);

  const constructBaseUrl = () => {
    const selectedAgentInbox = agentInboxes.find((a) => a.selected);
    if (!selectedAgentInbox) {
      return "/";
    }
    return `/?${AGENT_INBOX_PARAM}=${selectedAgentInbox.id}`;
  };

  const constructInboxLink = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete(VIEW_STATE_THREAD_QUERY_PARAM);
    return `${currentUrl.pathname}${currentUrl.search}`;
  };

  if (!agentInboxLabel) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-start gap-2 text-gray-500 text-sm",
        className
      )}
    >
      <NextLink href={constructBaseUrl()}>
        <Button size="sm" className="text-gray-500" variant="link">
          {agentInboxLabel}
        </Button>
      </NextLink>

      {selectedInboxLabel && (
        <>
          <ChevronRight className="h-[14px] w-[14px]" />
          <NextLink href={constructInboxLink()}>
            <Button size="sm" className="text-gray-500" variant="link">
              {selectedInboxLabel}
            </Button>
          </NextLink>
        </>
      )}
      {/* Render Action Label OR Result Label OR Start Run Label */}
      {(selectedThreadActionLabel || selectedThreadResultLabel || startRunLabel) && (
        <>
          <ChevronRight className="h-[14px] w-[14px]" />
          {/* Link is non-interactive for the last item */}
          <Button size="sm" className="text-gray-700 font-medium px-2" variant="link" disabled style={{ cursor: 'default', textDecoration: 'none', color: 'inherit' }}>
            {startRunLabel || selectedThreadActionLabel || selectedThreadResultLabel}
          </Button>
        </>
      )}
    </div>
  );
}
