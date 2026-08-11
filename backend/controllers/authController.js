const User = require("../models/User");
const { createActivityLog } = require("../services/activityService");
const {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  generateAccessToken,
  generateRefreshToken,
  getRefreshExpiry,
  hashToken,
  setRefreshCookie,
} = require("../utils/tokens");

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const persistSession = async (user, res) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  user.pruneExpiredRefreshTokens?.();
  user.refreshTokens = [...(user.refreshTokens || []), {
    tokenHash: refreshTokenHash,
    expiresAt: getRefreshExpiry(),
    createdAt: new Date(),
    lastUsedAt: new Date(),
  }].slice(-5);

  await user.save({ validateBeforeSave: false });
  setRefreshCookie(res, refreshToken);

  return accessToken;
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password, role, refreshTokens: [] });
    const sessionUser = await User.findById(user._id).select("+refreshTokens");
    const token = await persistSession(sessionUser, res);

    await createActivityLog({
      action: "auth.register",
      user: sessionUser,
      target: `User ${sessionUser.email} registered`,
      targetType: "user",
      targetId: sessionUser._id,
      metadata: { role: sessionUser.role },
    });

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password +refreshTokens");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = await persistSession(user, res);

    await createActivityLog({
      action: "auth.login",
      user,
      target: `User ${user.email} logged in`,
      targetType: "user",
      targetId: user._id,
      metadata: { role: user.role },
    });

    return res.json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  return res.json({ user: req.user });
};

const refresh = async (req, res) => {
  try {
    const currentRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!currentRefreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const refreshTokenHash = hashToken(currentRefreshToken);
    const user = await User.findOne({
      "refreshTokens.tokenHash": refreshTokenHash,
    }).select("+refreshTokens");

    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Refresh token invalid" });
    }

    user.pruneExpiredRefreshTokens?.();

    const existingSession = (user.refreshTokens || []).find(
      (session) => session.tokenHash === refreshTokenHash
    );

    if (!existingSession || existingSession.expiresAt <= new Date()) {
      user.refreshTokens = (user.refreshTokens || []).filter(
        (session) => session.tokenHash !== refreshTokenHash
      );
      await user.save({ validateBeforeSave: false });
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Refresh token expired" });
    }

    user.refreshTokens = (user.refreshTokens || []).filter(
      (session) => session.tokenHash !== refreshTokenHash
    );
    const token = await persistSession(user, res);

    return res.json({
      message: "Session refreshed",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const currentRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (currentRefreshToken) {
      const refreshTokenHash = hashToken(currentRefreshToken);
      const user = await User.findOne({
        "refreshTokens.tokenHash": refreshTokenHash,
      }).select("+refreshTokens");

      if (user) {
        user.refreshTokens = (user.refreshTokens || []).filter(
          (session) => session.tokenHash !== refreshTokenHash
        );
        await user.save({ validateBeforeSave: false });
      }
    }

    clearRefreshCookie(res);
    return res.json({ message: "Logged out" });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, refresh, logout };
