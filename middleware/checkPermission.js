const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");

const checkPermission = (moduleName, action) => {
  const allowedActions = ["view", "add", "edit", "delete"];

  if (!allowedActions.includes(action)) {
    throw new Error("Invalid permission action");
  }

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roleId) {
        return res.status(401).json({
          success: false,
          message: "User role not found",
        });
      }

      const module = await Permission.findOne({
        moduleName: moduleName.toLowerCase(),
        status: true,
      }).select("_id");

      if (!module) {
        return res.status(403).json({
          success: false,
          message: "Module not configured",
        });
      }

      const rolePermission = await RolePermission.findOne({
        roleId: req.user.roleId,
        permissionId: module._id,
      }).lean();

      if (!rolePermission || rolePermission[action] !== true) {
        return res.status(403).json({
          success: false,
          message: `You do not have ${action} permission for ${moduleName}`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

module.exports = checkPermission;