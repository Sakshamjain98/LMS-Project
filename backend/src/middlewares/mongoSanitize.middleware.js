const FORBIDDEN_KEY_PATTERN = /^\$|\./;

const sanitizeObject = (value) => {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      sanitizeObject(item);
    }
    return;
  }

  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEY_PATTERN.test(key)) {
      delete value[key];
      continue;
    }

    sanitizeObject(value[key]);
  }
};

export const mongoSanitizeMiddleware = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);
  next();
};
