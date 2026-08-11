const jwt = require("jsonwebtoken");

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || "change-me", {
    expiresIn: "7d",
  });

module.exports = generateToken;
