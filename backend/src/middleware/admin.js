const { verifyToken } = require("../utils/jwt");

module.exports = function adminAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin only" });
  }
  req.admin = decoded;
  next();
}