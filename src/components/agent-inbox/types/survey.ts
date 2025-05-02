// --- Detailed Survey Types ---

export enum SectionType {
  TEXT = "text",
  QUESTIONS = "questions",
}

export enum QuestionType {
  SINGLE_CHOICE = "single_choice",
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  OPEN_ENDED = "open_ended",
  INTEGER_INPUT = "integer_input",
  TEXT_DISPLAY = "text", // Using TEXT_DISPLAY for clarity
}

export interface AnswerOption {
  id: string;
  text: string;
}

export interface BaseQuestion {
  id: string;
  text: string;
  question_type: QuestionType;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  question_type: QuestionType.SINGLE_CHOICE;
  options: AnswerOption[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  question_type: QuestionType.MULTIPLE_CHOICE;
  options: AnswerOption[];
}

export interface TrueFalseQuestion extends BaseQuestion {
  question_type: QuestionType.TRUE_FALSE;
}

export interface OpenEndedQuestion extends BaseQuestion {
  question_type: QuestionType.OPEN_ENDED;
  multiline?: boolean;
}

export interface IntegerInputQuestion extends BaseQuestion {
  question_type: QuestionType.INTEGER_INPUT;
  min_value?: number;
  max_value?: number;
}

export interface TextDisplayQuestion extends BaseQuestion {
  question_type: QuestionType.TEXT_DISPLAY;
}

export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | OpenEndedQuestion
  | IntegerInputQuestion
  | TextDisplayQuestion;

export interface BaseSection {
  id: string;
  title?: string | null;
  description?: string | null;
  section_type: SectionType;
}

export interface TextSection extends BaseSection {
  section_type: SectionType.TEXT;
  content: string;
}

export interface QuestionsSection extends BaseSection {
  section_type: SectionType.QUESTIONS;
  questions: Question[];
}

export type Section = TextSection | QuestionsSection;

export interface Survey {
  // id?: string; // Top-level ID might be optional
  title: string;
  description?: string;
  subject: string;
  objective: string;
  sections: Section[];
}

// Type guard to check if data is a valid Survey object
export function isSurveyData(data: any): data is Survey {
  return (
    data &&
    typeof data === "object" &&
    typeof data.title === "string" &&
    typeof data.subject === "string" &&
    typeof data.objective === "string" &&
    Array.isArray(data.sections) &&
    data.sections.every((sec: any) => sec && typeof sec.id === 'string' && typeof sec.section_type === 'string')
  );
}
