// middlewares/auth.js
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  // 1. Get token from cookies or Authorization header
  const tokenFromCookie = req.cookies?.token;
  const authHeader = req.headers['authorization']; // "Bearer <token>"
  const tokenFromHeader = authHeader && authHeader.startsWith("Bearer ") 
    ? authHeader.split(" ")[1] 
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ message: "No token provided, authorization denied" });
  }

  // 2. Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    // 3. Attach decoded payload to req.user
    req.user = user;

    // 4. Proceed to next middleware/route
    next();
  });
};

export default authMiddleware;
