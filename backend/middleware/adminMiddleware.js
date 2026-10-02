
const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role");

    if (!user) {
      return res.status(401).json({
        message: "User not found. Please login again.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);

    return res.status(500).json({
      message: "Server error while verifying admin access.",
    });
  }
};

module.exports = adminMiddleware;