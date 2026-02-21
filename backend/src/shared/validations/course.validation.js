import Joi from "joi";

export const createCourseSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().max(5000),
  isPaid: Joi.boolean().default(false),
  tags: Joi.string(), // comma-separated
  price: Joi.number().min(0).when("isPaid", {
    is: true,
    then: Joi.number().positive().required(),
    otherwise: Joi.number().default(0),
  }),
});
