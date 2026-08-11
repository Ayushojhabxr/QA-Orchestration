const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "developer", "tester"],
      required: true,
    },
    refreshTokens: {
      type: [
        new mongoose.Schema(
          {
            tokenHash: {
              type: String,
              required: true,
            },
            expiresAt: {
              type: Date,
              required: true,
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
            lastUsedAt: {
              type: Date,
              default: Date.now,
            },
          },
          { _id: false }
        ),
      ],
      select: false,
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

userSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.pruneExpiredRefreshTokens = function pruneExpiredRefreshTokens() {
  const now = new Date();
  this.refreshTokens = (this.refreshTokens || []).filter((session) => session.expiresAt > now);
};

module.exports = mongoose.model("User", userSchema);
