const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token is required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || user.status !== true) {
      return res.status(401).json({
        success: false,
        message: "User not found or account inactive.",
      });
    }

    // Token's user details should still match current database record
    if (
      String(user.roleId) !== String(decoded.roleId) ||
      String(user.referenceId || "") !== String(decoded.referenceId || "") ||
      user.role !== decoded.role
    ) {
      return res.status(401).json({
        success: false,
        message: "Token is no longer valid.",
      });
    }

    req.user = {
      userId: user._id,
      referenceId: user.referenceId,
      role: user.role,
      roleId: user.roleId,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden. Insufficient permissions.",
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  allowRoles,
};