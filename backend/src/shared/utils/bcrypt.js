import bcrypt from "bcrypt";

export const hashPassword = async (plainPassword) => {
  const saltRounds = 10;
  return bcrypt.hash(plainPassword, saltRounds);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  if (!hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
};
