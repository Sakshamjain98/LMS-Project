import Joi from "joi";

export const submitAnswerSchema = Joi.object({
  questionId: Joi.string().required(),
  selectedOptionIndex: Joi.number().min(0).max(3).allow(null), // null = skip
  timeTaken: Joi.number().min(0).default(0),
});

export const submitTestSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().required(),
        selectedOptionIndex: Joi.number().min(0).max(3).allow(null),
        timeTaken: Joi.number().min(0).default(0),
      })
    )
    .required(),
});
