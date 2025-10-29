const { verifyToken } = require("../utils/jwt");

module.exports = function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid token" });
  req.user = decoded;
  next();
};