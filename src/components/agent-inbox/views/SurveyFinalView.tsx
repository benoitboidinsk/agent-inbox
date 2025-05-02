import React from "react";
import { ThreadData } from "../types";
import { Survey, isSurveyData } from "../types/survey"; // Updated import path
import { SectionRenderer } from "../components/section-renderer";
import { MarkdownText } from "@/components/ui/markdown-text"; // For fallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { Separator } from "@/components/ui/separator"; // Import Separator

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
  const potentialSurveyData = stateKey ? values[stateKey] : null;
  
  // Check if it's valid survey data
  const surveyData = isSurveyData(potentialSurveyData) ? potentialSurveyData : null;
  
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

  // Render the survey using Card layout
  return (
    <Card className="w-full max-w-4xl mx-auto my-6 border-none shadow-none"> {/* Adjusted styling */}
      <CardHeader>
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-2xl">{surveyData.title}</CardTitle>
          {surveyData.description && <CardDescription>{surveyData.description}</CardDescription>}
        </div>
        <div className="mt-4 space-y-2">
          <div>
            <span className="font-semibold">Subject:</span> {surveyData.subject}
          </div>
          <div>
            <span className="font-semibold">Objective:</span> {surveyData.objective}
          </div>
        </div>
      </CardHeader>
      {/* Use a simpler separator or remove if ThreadPanel provides one */}
      {/* <Separator className="h-[2px] bg-gray-200 dark:bg-gray-800" /> */}
      <CardContent className="pt-6">
        <div>
          {surveyData.sections.map((section, index) => (
            <div key={section.id || `section-${index}`}>
              {index > 0 && <Separator className="my-10 h-[1px] bg-gray-200 dark:bg-gray-800" />} {/* Adjusted Separator */}
              <SectionRenderer section={section} />
            </div>
          ))}
        </div>
      </CardContent> {/* Added closing tag */}
    </Card> // Added closing tag
  );
}
