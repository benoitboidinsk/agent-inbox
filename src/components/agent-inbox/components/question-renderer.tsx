import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Corrected path
import { Checkbox } from "@/components/ui/checkbox"; // Corrected path
import { Input } from "@/components/ui/input"; // Corrected path
import { Textarea } from "@/components/ui/textarea"; // Corrected path
import { Label } from "@/components/ui/label"; // Corrected path
import { Question, QuestionType } from "../types/survey"; // Corrected path

interface QuestionRendererProps {
  question: Question;
}

export function QuestionRenderer({ question }: QuestionRendererProps) {
  // Note: We are rendering the structure/options, not collected answers.
  // The 'disabled' prop is used on inputs to make them non-interactive.

  return (
    <div className="space-y-3">
      <div className="font-medium">{question.text}</div>

      {question.question_type === QuestionType.SINGLE_CHOICE && (
        <RadioGroup disabled className="space-y-2 mt-2">
          {question.options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} /> {/* Ensure unique ID */}
              <Label htmlFor={`${question.id}-${option.id}`}>{option.text}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.question_type === QuestionType.MULTIPLE_CHOICE && (
        <div className="space-y-2 mt-2">
          {question.options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox id={`${question.id}-${option.id}`} disabled /> {/* Ensure unique ID */}
              <Label htmlFor={`${question.id}-${option.id}`}>{option.text}</Label>
            </div>
          ))}
        </div>
      )}

      {question.question_type === QuestionType.TRUE_FALSE && (
        <RadioGroup disabled className="space-y-2 mt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id={`${question.id}-true`} />
            <Label htmlFor={`${question.id}-true`}>True</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id={`${question.id}-false`} />
            <Label htmlFor={`${question.id}-false`}>False</Label>
          </div>
        </RadioGroup>
      )}

      {question.question_type === QuestionType.OPEN_ENDED && (
        <div className="mt-2">
          {question.multiline ? (
            <Textarea disabled placeholder="Answer would go here" className="w-full" />
          ) : (
            <Input disabled placeholder="Answer would go here" className="w-full" />
          )}
        </div>
      )}

      {question.question_type === QuestionType.INTEGER_INPUT && (
        <div className="space-y-2 mt-2">
          <Input type="number" disabled placeholder="Enter a number" className="w-full max-w-xs" />
          {(question.min_value !== undefined || question.max_value !== undefined) && (
            <div className="text-sm text-muted-foreground">
              {question.min_value !== undefined && question.max_value !== undefined ? (
                <>
                  Range: {question.min_value} to {question.max_value}
                </>
              ) : question.min_value !== undefined ? (
                <>Minimum: {question.min_value}</>
              ) : (
                <>Maximum: {question.max_value}</>
              )}
            </div>
          )}
        </div>
      )}

      {/* TEXT_DISPLAY might not need specific rendering if text is already shown above */}
      {/* If TEXT_DISPLAY implies different styling, add it here */}
      {/* Example:
      {question.question_type === QuestionType.TEXT_DISPLAY && (
        <div className="prose max-w-none text-muted-foreground pt-1">
           <p>{question.text}</p> // Text is already rendered above, maybe style differently?
        </div>
      )}
      */}
    </div>
  );
}
