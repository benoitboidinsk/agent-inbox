import React from "react";
import { ThreadData } from "../types";
import { MarkdownText } from "@/components/ui/markdown-text";

interface MarkdownFinalViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  stateKey?: string; // The key in thread.values containing the markdown
}

export function MarkdownFinalView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadData, stateKey }: MarkdownFinalViewProps<ThreadValues>) {
  const values = threadData.thread.values || {};
  
  // Get content from the specified stateKey, or fallbacks
  const primaryContent = stateKey ? values[stateKey] : null;
  const fallbackContent = values.survey_md || values.output || values.result || "No results available";
  
  // Ensure content is a string
  const contentToRender = typeof primaryContent === 'string' && primaryContent ? primaryContent : fallbackContent;
  const finalMarkdown = typeof contentToRender === 'string' ? contentToRender : "No valid content found.";

  return (
    <div className="prose max-w-none p-6"> {/* Added padding */}
      <MarkdownText>
        {finalMarkdown}
      </MarkdownText>
    </div>
  );
}
