import Joi from "joi";

/**
 * Validation schema for creating a single question
 */
export const createQuestionSchema = Joi.object({
  questionText: Joi.string()
    .trim()
    .required()
    .min(5)
    .max(1000)
    .messages({
      "string.empty": "Question text is required",
      "string.min": "Question text must be at least 5 characters",
      "string.max": "Question text cannot exceed 1000 characters",
    }),

  questionType: Joi.string()
    .valid("MCQ", "TRUE_FALSE", "MULTIPLE_SELECT")
    .default("MCQ")
    .messages({
      "any.only": "Question type must be MCQ, TRUE_FALSE, or MULTIPLE_SELECT",
    }),

  options: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().trim().required().min(1).max(500).messages({
          "string.empty": "Option text cannot be empty",
          "string.max": "Option text cannot exceed 500 characters",
        }),
      })
    )
    .min(2)
    .max(10)
    .required()
    .messages({
      "array.min": "At least 2 options are required",
      "array.max": "Maximum 10 options allowed",
      "array.required": "Options array is required",
    }),

  correctOptionIndex: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      "number.min": "Correct option index cannot be negative",
      "number.required": "Correct option index is required",
      "number.base": "Correct option index must be a number",
    }),

  marks: Joi.number()
    .positive()
    .default(1)
    .messages({
      "number.positive": "Marks must be a positive number",
    }),

  negativeMarks: Joi.number()
    .min(0)
    .default(0)
    .messages({
      "number.min": "Negative marks cannot be negative",
    }),

  explanation: Joi.string()
    .trim()
    .optional()
    .max(2000)
    .messages({
      "string.max": "Explanation cannot exceed 2000 characters",
    }),

  difficulty: Joi.string()
    .valid("easy", "medium", "hard")
    .default("medium")
    .messages({
      "any.only": "Difficulty must be easy, medium, or hard",
    }),

  tags: Joi.array()
    .items(Joi.string().trim().min(1).max(50))
    .optional()
    .max(10)
    .messages({
      "array.max": "Maximum 10 tags allowed",
    }),

  imageUrl: Joi.string()
    .trim()
    .allow("")
    .optional(),
}).unknown(false); // Reject unknown fields

/**
 * Validation schema for bulk creating questions
 */
export const bulkCreateQuestionsSchema = Joi.object({
  questions: Joi.array()
    .items(createQuestionSchema)
    .min(1)
    .max(100)
    .required()
    .messages({
      "array.min": "At least 1 question is required",
      "array.max": "Maximum 100 questions can be created at once",
      "array.required": "Questions array is required",
    }),
}).unknown(false);

/**
 * Validation schema for updating a question
 */
export const updateQuestionSchema = Joi.object({
  questionText: Joi.string()
    .trim()
    .optional()
    .min(5)
    .max(1000),

  questionType: Joi.string()
    .valid("MCQ", "TRUE_FALSE", "MULTIPLE_SELECT")
    .optional(),

  options: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().trim().required().min(1).max(500),
      })
    )
    .min(2)
    .max(10)
    .optional(),

  correctOptionIndex: Joi.number()
    .integer()
    .min(0)
    .optional(),

  marks: Joi.number()
    .positive()
    .optional(),

  negativeMarks: Joi.number()
    .min(0)
    .optional(),

  explanation: Joi.string()
    .trim()
    .optional()
    .max(2000),

  difficulty: Joi.string()
    .valid("easy", "medium", "hard")
    .optional(),

  tags: Joi.array()
    .items(Joi.string().trim().min(1).max(50))
    .optional()
    .max(10),

  imageUrl: Joi.string()
    .trim()
    .allow("")
    .optional(),
}).unknown(false);
