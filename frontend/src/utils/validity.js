// Human label for a validity duration in months. 0 / falsy = lifetime access.
export const formatValidity = (months) => {
  const m = Number(months) || 0;
  if (m <= 0) return "Lifetime access";
  if (m === 12) return "1 Year validity";
  if (m === 24) return "2 Years validity";
  return `${m} Month${m === 1 ? "" : "s"} validity`;
};
