import { STATUS_CODES } from "../constants/statusCode.js";

/**
 * Joi validation middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
    }

    // Replace req.body with validated value
    req.body = value;
    next();
  };
};