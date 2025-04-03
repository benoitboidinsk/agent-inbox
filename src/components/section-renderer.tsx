import { Separator } from "@/components/ui/separator"
import { QuestionRenderer } from "./question-renderer"
import { type Section, SectionType } from "@/lib/types"

interface SectionRendererProps {
  section: Section
}

export function SectionRenderer({ section }: SectionRendererProps) {
  return (
    <div className="space-y-4">
      {section.title && <h2 className="text-xl font-semibold">{section.title}</h2>}

      {section.description && <p className="text-muted-foreground">{section.description}</p>}

      <div className="mt-4">
        {section.section_type === SectionType.TEXT && (
          <div className="prose max-w-none">
            <p>{section.content}</p>
          </div>
        )}

        {section.section_type === SectionType.QUESTIONS && (
          <div>
            {section.questions.map((question, index) => (
              <div key={question.id}>
                {index > 0 && <Separator className="my-6 opacity-50" />}
                <div className="py-2">
                  <QuestionRenderer question={question} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

