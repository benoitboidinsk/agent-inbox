import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SectionRenderer } from "./section-renderer"
import type { Survey } from "@/lib/types"

interface SurveyViewerProps {
  survey: Survey
}

export default function SurveyViewer({ survey }: SurveyViewerProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-2xl">{survey.title}</CardTitle>
          {survey.description && <CardDescription>{survey.description}</CardDescription>}
        </div>
        <div className="mt-4 space-y-2">
          <div>
            <span className="font-semibold">Subject:</span> {survey.subject}
          </div>
          <div>
            <span className="font-semibold">Objective:</span> {survey.objective}
          </div>
        </div>
      </CardHeader>
      <Separator className="h-[2px] bg-gray-200 dark:bg-gray-800" />
      <CardContent className="pt-6">
        <div>
          {survey.sections.map((section, index) => (
            <div key={section.id}>
              {index > 0 && <Separator className="my-10 h-[2px] bg-gray-200 dark:bg-gray-800" />}
              <SectionRenderer section={section} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

