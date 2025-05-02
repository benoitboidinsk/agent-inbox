import React from "react";
import { Section, Question } from "../types/view";
import { MarkdownText } from "@/components/ui/markdown-text";

interface QuestionRendererProps {
  question: Question;
}

function QuestionRenderer({ question }: QuestionRendererProps) {
  return (
    <div className="mb-4">
      <div className="font-medium mb-1">{question.text}</div>
      {question.answer && (
        <div className="pl-4 border-l-2 border-gray-200">
          <MarkdownText>{question.answer}</MarkdownText>
        </div>
      )}
    </div>
  );
}

interface SectionRendererProps {
  section: Section;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
      
      {section.description && (
        <p className="text-gray-600 mb-4">{section.description}</p>
      )}
      
      {section.content ? (
        <div className="prose max-w-none">
          <MarkdownText>{section.content}</MarkdownText>
        </div>
      ) : section.questions && section.questions.length > 0 ? (
        <div className="space-y-4">
          {section.questions.map((question) => (
            <QuestionRenderer key={question.id} question={question} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
