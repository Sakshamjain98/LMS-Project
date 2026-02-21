import { ApiError } from "../shared/error/ApiError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const message = error.details
        .map((detail) => detail.message)
        .join(", ");
      return next(new ApiError(STATUS_CODES.BAD_REQUEST, message));
    }
    req.body = value;
    next();
  };
};