import { type Survey, SectionType, QuestionType } from "./types"

export const mockSurvey: Survey = {
  id: "survey-001",
  title: "Customer Satisfaction Survey",
  description: "Help us improve our products and services by sharing your feedback",
  subject: "Product Experience",
  objective: "To understand customer satisfaction and identify areas for improvement",
  sections: [
    {
      id: "section-001",
      title: "Introduction",
      section_type: SectionType.TEXT,
      content:
        "Thank you for taking the time to complete this survey. Your feedback is valuable to us and will help us improve our products and services.",
    },
    {
      id: "section-002",
      title: "Product Usage",
      description: "Please tell us about your experience with our products",
      section_type: SectionType.QUESTIONS,
      questions: [
        {
          id: "q-001",
          text: "How often do you use our product?",
          question_type: QuestionType.SINGLE_CHOICE,
          options: [
            { id: "opt-001", text: "Daily" },
            { id: "opt-002", text: "Weekly" },
            { id: "opt-003", text: "Monthly" },
            { id: "opt-004", text: "Rarely" },
          ],
        },
        {
          id: "q-002",
          text: "Which features do you use most frequently? (Select all that apply)",
          question_type: QuestionType.MULTIPLE_CHOICE,
          options: [
            { id: "opt-005", text: "Feature A" },
            { id: "opt-006", text: "Feature B" },
            { id: "opt-007", text: "Feature C" },
            { id: "opt-008", text: "Feature D" },
          ],
        },
        {
          id: "q-003",
          text: "On a scale from 1 to 10, how would you rate the product's ease of use?",
          question_type: QuestionType.INTEGER_INPUT,
          min_value: 1,
          max_value: 10,
        },
      ],
    },
    {
      id: "section-003",
      title: "Customer Support",
      description: "Please share your experience with our customer support team",
      section_type: SectionType.QUESTIONS,
      questions: [
        {
          id: "q-004",
          text: "Have you contacted our customer support in the last 3 months?",
          question_type: QuestionType.TRUE_FALSE,
        },
        {
          id: "q-005",
          text: "Please describe your experience with our customer support team",
          question_type: QuestionType.OPEN_ENDED,
          multiline: true,
        },
        {
          id: "q-006",
          text: "Important note about customer support",
          question_type: QuestionType.TEXT_DISPLAY,
        },
      ],
    },
    {
      id: "section-004",
      title: "Thank You",
      section_type: SectionType.TEXT,
      content:
        "Thank you for completing this survey. Your feedback is important to us and will help us improve our products and services.",
    },
  ],
}

