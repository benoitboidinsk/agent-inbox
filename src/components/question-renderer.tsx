import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { type Question, QuestionType } from "@/lib/types"

interface QuestionRendererProps {
  question: Question
}

export function QuestionRenderer({ question }: QuestionRendererProps) {
  return (
    <div className="space-y-3">
      <div className="font-medium">{question.text}</div>

      {question.question_type === QuestionType.SINGLE_CHOICE && (
        <RadioGroup disabled className="space-y-2 mt-2">
          {question.options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id}>{option.text}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.question_type === QuestionType.MULTIPLE_CHOICE && (
        <div className="space-y-2 mt-2">
          {question.options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox id={option.id} disabled />
              <Label htmlFor={option.id}>{option.text}</Label>
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

      {question.question_type === QuestionType.TEXT_DISPLAY && (
        <div className="prose max-w-none text-muted-foreground">
          <p>{question.text}</p>
        </div>
      )}
    </div>
  )
}

