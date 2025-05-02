import React from "react";
import { ThreadData } from "../types";
import { Survey, isSurveyData } from "../types/view";
import { SectionRenderer } from "../components/section-renderer";
import { MarkdownText } from "@/components/ui/markdown-text"; // For fallback

interface SurveyFinalViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  stateKey?: string; // The key in thread.values containing the Survey object
}

export function SurveyFinalView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadData, stateKey }: SurveyFinalViewProps<ThreadValues>) {
  const values = threadData.thread.values || {};
  
  // Attempt to get the survey data from the specified stateKey
  console.log("[SurveyFinalView] Received stateKey:", stateKey);
  const potentialSurveyData = stateKey ? values[stateKey] : null;
  console.log("[SurveyFinalView] Potential Survey Data:", potentialSurveyData);
  
  // Check if it's valid survey data
  const surveyCheckResult = isSurveyData(potentialSurveyData);
  console.log("[SurveyFinalView] isSurveyData check result:", surveyCheckResult);
  const surveyData = surveyCheckResult ? potentialSurveyData : null;
  
  // Fallback content if survey data is invalid or missing
  const fallbackContent = values.survey_md || values.output || values.result || "Survey data is not available or invalid.";

  if (!surveyData) {
    // Render fallback markdown if survey data is not valid
    return (
      <div className="prose max-w-none p-6">
        <MarkdownText>
          {typeof fallbackContent === 'string' ? fallbackContent : "No valid content found."}
        </MarkdownText>
      </div>
    );
  }

  // Render the survey
  return (
    <div className="w-full p-6"> {/* Added padding */}
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
          <div key={section.id || `section-${index}`}>
            {index > 0 && <div className="my-8 h-px bg-gray-200"></div>}
            <SectionRenderer section={section} />
          </div>
        ))}
      </div>
    </div>
  );
}
