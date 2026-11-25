const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },
    view: { type: Boolean, default: false },
    add: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

rolePermissionSchema.index(
  { roleId: 1, permissionId: 1 },
  { unique: true }
);

module.exports = mongoose.model("RolePermission", rolePermissionSchema);