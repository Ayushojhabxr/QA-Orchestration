const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);
const REFRESH_COOKIE_NAME = "testflow_refresh";

const generateAccessToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || "change-me", {
    expiresIn: ACCESS_TTL,
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET || "change-me");

const generateRefreshToken = () => crypto.randomBytes(48).toString("hex");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getRefreshExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);
  return expiresAt;
};

const refreshCookieOptions = () => ({
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
});

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
};

module.exports = {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  generateAccessToken,
  generateRefreshToken,
  getRefreshExpiry,
  hashToken,
  setRefreshCookie,
  verifyAccessToken,
};
