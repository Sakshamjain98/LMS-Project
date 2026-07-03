import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin", "superadmin"],
      default: "student",
    },
    // Only meaningful when role === "admin" — superadmin is always unrestricted.
    permissions: {
      type: [String],
      default: [],
    },
    // Disable-admin switch, enforced at login and on every authenticated request.
    isActive: {
      type: Boolean,
      default: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    phone: {
      type: String,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

// Don't return password in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);
