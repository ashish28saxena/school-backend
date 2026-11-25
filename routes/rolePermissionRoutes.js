const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Role = require("../models/Role");
const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");

// Get permissions for selected role
router.get("/role/:roleId", async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roleId",
      });
    }

    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const modules = await Permission.find({ status: true }).lean();

    const assigned = await RolePermission.find({ roleId }).lean();

    const permissionMap = new Map(
      assigned.map((item) => [String(item.permissionId), item])
    );

    const data = modules.map((module) => {
      const saved = permissionMap.get(String(module._id));

      return {
        permissionId: module._id,
        moduleName: module.moduleName,
        displayName: module.displayName,
        view: saved?.view || false,
        add: saved?.add || false,
        edit: saved?.edit || false,
        delete: saved?.delete || false,
      };
    });

    res.json({
      success: true,
      role,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Save all permissions for a role
router.post("/assign", async (req, res) => {
  try {
    const { roleId, permissions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: "Valid roleId is required",
      });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "permissions must be an array",
      });
    }

    const role = await Role.findOne({
      _id: roleId,
      status: true,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Active role not found",
      });
    }

    const permissionIds = permissions.map((item) => item.permissionId);

    if (
      permissionIds.some(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      ) ||
      new Set(permissionIds.map(String)).size !== permissionIds.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or duplicate permissionId",
      });
    }

    const validModules = await Permission.find({
      _id: { $in: permissionIds },
      status: true,
    }).select("_id");

    if (validModules.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more permission modules are invalid",
      });
    }

    const operations = permissions.map((item) => {
      for (const key of ["view", "add", "edit", "delete"]) {
        if (item[key] !== undefined && typeof item[key] !== "boolean") {
          throw new Error(`${key} must be true or false`);
        }
      }

      return {
        updateOne: {
          filter: {
            roleId,
            permissionId: item.permissionId,
          },
          update: {
            $set: {
              view: item.view === true,
              add: item.add === true,
              edit: item.edit === true,
              delete: item.delete === true,
            },
            $setOnInsert: {
              roleId,
              permissionId: item.permissionId,
            },
          },
          upsert: true,
        },
      };
    });

    if (operations.length) {
      await RolePermission.bulkWrite(operations);
    }

    res.json({
      success: true,
      message: "Role permissions saved successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;