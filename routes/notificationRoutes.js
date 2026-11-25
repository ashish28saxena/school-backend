
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Notification = require("../models/Notification");

const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

const getUserId = (req) =>
  req.user?._id || req.user?.id || req.user?.userId;

const getRole = (req) =>
  String(req.user?.role || req.user?.roleName || "").toLowerCase();

const isAdmin = (req) =>
  ["admin", "principal", "superadmin", "super admin"].includes(getRole(req));

// Create notification - Admin only
router.post("/add", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      title,
      message,
      type,
      targetAudience,
      targetUserIds,
      expiresAt,
    } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Title and message are required",
      });
    }

    const audience = targetAudience || "all";

    if (audience === "specific") {
      if (!Array.isArray(targetUserIds) || !targetUserIds.length) {
        return res.status(400).json({
          message: "Select at least one target user",
        });
      }

      const invalidIds = targetUserIds.some(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      );

      if (invalidIds) {
        return res.status(400).json({ message: "Invalid target user ID" });
      }
    }

    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      type: type || "general",
      targetAudience: audience,
      targetUserIds: audience === "specific" ? targetUserIds : [],
      createdBy: getUserId(req),
      expiresAt: expiresAt || null,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get notifications for logged-in user
router.get("/my-notifications", async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = getRole(req);

    const audienceRoles = ["teacher", "staff", "student", "parent"];
    const audience = audienceRoles.includes(role) ? role : "all";

    const filter = {
      status: true,
      $and: [
        {
          $or: [
            { targetAudience: "all" },
            { targetAudience: audience },
            {
              targetAudience: "specific",
              targetUserIds: userId,
            },
          ],
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
          ],
        },
      ],
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const data = notifications.map((item) => {
      const read = item.readBy?.some(
        (entry) => String(entry.userId) === String(userId)
      );

      return {
        ...item,
        isRead: Boolean(read),
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unread notification count
router.get("/unread-count", async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = getRole(req);
    const audience = ["teacher", "staff", "student", "parent"].includes(role)
      ? role
      : "all";

    const count = await Notification.countDocuments({
      status: true,
      $and: [
        {
          $or: [
            { targetAudience: "all" },
            { targetAudience: audience },
            { targetAudience: "specific", targetUserIds: userId },
          ],
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
          ],
        },
        {
          "readBy.userId": { $ne: userId },
        },
      ],
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark one notification as read
router.put("/mark-read/:id", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        status: true,
        $or: [
          { targetAudience: "all" },
          { targetAudience: getRole(req) },
          { targetAudience: "specific", targetUserIds: userId },
        ],
      },
      {
        $addToSet: {
          readBy: { userId, readAt: new Date() },
        },
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.put("/mark-all-read", async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = getRole(req);
    const audience = ["teacher", "staff", "student", "parent"].includes(role)
      ? role
      : "all";

    await Notification.updateMany(
      {
        status: true,
        $and: [
          {
            $or: [
              { targetAudience: "all" },
              { targetAudience: audience },
              { targetAudience: "specific", targetUserIds: userId },
            ],
          },
          { "readBy.userId": { $ne: userId } },
        ],
      },
      {
        $addToSet: {
          readBy: { userId, readAt: new Date() },
        },
      }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all notifications
router.get("/list", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const notifications = await Notification.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update notification
router.put("/update/:id", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const allowed = [
      "title",
      "message",
      "type",
      "targetAudience",
      "targetUserIds",
      "status",
      "expiresAt",
    ];

    const updateData = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification updated successfully",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete notification
router.delete("/delete/:id", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET: Notification History with pagination
router.get("/history", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status !== undefined) {
      filter.status = req.query.status === "true";
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate("createdBy", "name email")
        .populate("targetUserIds", "name email mobileNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET: Read / Unread Report for a notification
router.get("/report/:id", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate("targetUserIds", "name email mobileNumber")
      .populate("readBy.userId", "name email mobileNumber");

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const readIds = new Set(
      notification.readBy.map((item) =>
        item.userId?._id?.toString()
      ).filter(Boolean)
    );

    const report = notification.targetUserIds.map((user) => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      status: readIds.has(user._id.toString()) ? "Read" : "Unread",
    }));

    res.json({
      success: true,
      notification: {
        title: notification.title,
        message: notification.message,
      },
      total: report.length,
      read: report.filter((item) => item.status === "Read").length,
      unread: report.filter((item) => item.status === "Unread").length,
      users: report,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET: Read / Unread Summary
router.get("/read-unread-summary", async (req, res) => {
  try {
    const notifications = await Notification.find();

    const result = notifications.map((item) => ({
      _id: item._id,
      title: item.title,
      type: item.type,
      totalRead: item.readBy.length,
      totalTargeted: item.targetUserIds.length,
      createdAt: item.createdAt,
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
