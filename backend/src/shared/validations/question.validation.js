import Joi from "joi";

const optionSchema = Joi.object({
  text: Joi.string().trim().required(),
});

export const createQuestionSchema = Joi.object({
  questionText: Joi.string().trim().min(5).max(2000).required(),
  questionType: Joi.string().valid("MCQ", "TRUE_FALSE", "MULTIPLE_SELECT").default("MCQ"),
  options: Joi.array()
    .items(optionSchema)
    .length(4)
    .required()
    .messages({
      "array.length": "Exactly 4 options are required",
    }),
  correctOptionIndex: Joi.number().min(0).max(3).required().messages({
    "number.min": "Correct option index must be between 0 and 3",
    "number.max": "Correct option index must be between 0 and 3",
  }),
  marks: Joi.number().positive().default(1),
  negativeMarks: Joi.number().min(0).default(0),
  explanation: Joi.string().trim().max(1000),
  difficulty: Joi.string().valid("easy", "medium", "hard").default("medium"),
  tags: Joi.array().items(Joi.string().trim()),
});

export const updateQuestionSchema = Joi.object({
  questionText: Joi.string().trim().min(5).max(2000),
  options: Joi.array().items(optionSchema).length(4),
  correctOptionIndex: Joi.number().min(0).max(3),
  marks: Joi.number().positive(),
  negativeMarks: Joi.number().min(0),
  explanation: Joi.string().trim().max(1000),
  difficulty: Joi.string().valid("easy", "medium", "hard"),
  tags: Joi.array().items(Joi.string().trim()),
});

export const bulkCreateQuestionsSchema = Joi.object({
  questions: Joi.array().items(createQuestionSchema).min(1).max(100).required(),
});
