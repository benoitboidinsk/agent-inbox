import React from "react";
import { Section, Question, SectionType } from "../types/survey"; // Updated import path, added SectionType
import { MarkdownText } from "@/components/ui/markdown-text";
import { QuestionRenderer } from "./question-renderer"; // Import the enhanced renderer
import { Separator } from "@/components/ui/separator"; // Import Separator

interface SectionRendererProps {
  section: Section;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  return (
    <div className="mb-6 space-y-4"> {/* Added space-y-4 */}
      {/* Render title and description if they exist */}
      {section.title && <h3 className="text-xl font-semibold">{section.title}</h3>}
      {section.description && <p className="text-gray-600">{section.description}</p>}
      
      {/* Render content based on section_type */}
      {section.section_type === SectionType.TEXT && section.content && (
        <div className="prose max-w-none">
          {/* Using paragraph instead of MarkdownText for simple text content based on older snippet */}
          <p>{section.content}</p> 
          {/* If content can be markdown, switch back to: <MarkdownText>{section.content}</MarkdownText> */}
        </div>
      )}
      
      {section.section_type === SectionType.QUESTIONS && section.questions && (
        <div> {/* Removed space-y-4, handled in QuestionRenderer/loop */}
          {section.questions.map((question, index) => (
            <div key={question.id}>
              {index > 0 && <Separator className="my-6 opacity-50" />} {/* Added separator */}
              <div className="py-2"> {/* Added padding */}
                <QuestionRenderer question={question} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
