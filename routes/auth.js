const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Role = require("../models/Role");

const {
  loginLimiter,
  registerLimiter,
} = require("../middleware/security");

// ==========================================
// GENERATE JWT TOKEN
// ==========================================

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: user._id,
      referenceId: user.referenceId,
      role: user.role,
      roleId: user.roleId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
      algorithm: "HS256",
    }
  );
};

// ==========================================
// GET ALL ROLES
// PUBLIC API
// ==========================================

router.get("/roles", async (req, res) => {  
  try {
    const roles = await Role.find().sort({ name: 1 });

    return res.status(200).json({
      status: 200,
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    console.error("Roles error:", error.message);

    return res.status(500).json({
      status: 500,
      message: "Unable to fetch roles",
    });
  }
});

// ==========================================
// SIGNUP / REGISTER
// ==========================================

router.post("/register", registerLimiter, async (req, res) => {
  try {
    const {
      name,
      email,
      mobileNumber,
      password,
      roleId,
      referenceId,
    } = req.body;

    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (
      !name ||
      !email ||
      !mobileNumber ||
      !password ||
      !roleId
    ) {
      return res.status(400).json({
        status: 400,
        message: "Name, email, mobile, password and role required",
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof mobileNumber !== "string" ||
      typeof password !== "string" ||
      typeof roleId !== "string"
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid input format",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobileNumber.trim();

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return res.status(400).json({
        status: 400,
        message: "Name must be between 2 and 100 characters",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid email address",
      });
    }

    // Mobile validation
    if (!/^[0-9]{10,15}$/.test(normalizedMobile)) {
      return res.status(400).json({
        status: 400,
        message: "Mobile number must contain 10 to 15 digits",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        status: 400,
        message: "Password must be at least 8 characters",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        status: 400,
        message: "Password is too long",
      });
    }

    // --------------------------------------
    // GET ROLE
    // --------------------------------------

    const roleData = await Role.findById(roleId);

    if (!roleData) {
      return res.status(400).json({
        status: 400,
        message: "Role not found",
      });
    }

    const roleName = roleData.name.trim().toLowerCase();

    // --------------------------------------
    // PUBLIC REGISTRATION ROLE RESTRICTION
    // --------------------------------------
    // Public users should not register as admin.

    const allowedPublicRoles = ["student", "parent"];

    if (!allowedPublicRoles.includes(roleName)) {
      return res.status(403).json({
        status: 403,
        message: "Registration is not allowed for this role",
      });
    }

    // --------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { mobileNumber: normalizedMobile },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        status: 409,
        message: "Email or mobile number already registered",
      });
    }

    // --------------------------------------
    // HASH PASSWORD
    // --------------------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // --------------------------------------
    // CREATE USER
    // --------------------------------------

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      mobileNumber: normalizedMobile,
      password: hashedPassword,
      role: roleName,
      roleId: roleData._id,
      referenceId: referenceId || null,
      status: true,
    });

    // --------------------------------------
    // GENERATE TOKEN
    // --------------------------------------

    const token = generateToken(user);

    return res.status(201).json({
      status: 201,
      message: "Registration successful",
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        roleId: user.roleId,
        referenceId: user.referenceId,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);

    // Duplicate database index error
    if (error.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "Email or mobile number already exists",
      });
    }

    return res.status(500).json({
      status: 500,
      message:
        process.env.NODE_ENV === "production"
          ? "Registration failed"
          : error.message,
    });
  }
});

// ==========================================
// LOGIN
// ==========================================

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { loginId, password, roleId } = req.body;

    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (!loginId || !password || !roleId) {
      return res.status(400).json({
        status: 400,
        message: "Login ID, password and role required",
      });
    }

    if (
      typeof loginId !== "string" ||
      typeof password !== "string" ||
      typeof roleId !== "string"
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid input format",
      });
    }

    const value = loginId.trim();

    if (!value || password.length > 128) {
      return res.status(400).json({
        status: 400,
        message: "Invalid login details",
      });
    }

    // --------------------------------------
    // GET ROLE
    // --------------------------------------

    const roleData = await Role.findById(roleId);

    if (!roleData) {
      return res.status(401).json({
        status: 401,
        message: "Invalid credentials",
      });
    }

    const roleName = roleData.name.trim().toLowerCase();

    // --------------------------------------
    // FIND USER
    // --------------------------------------

    const user = await User.findOne({
      roleId: roleData._id,
      role: roleName,
      status: true,
      $or: [
        { email: value.toLowerCase() },
        { mobileNumber: value },
      ],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Invalid credentials",
      });
    }

    // --------------------------------------
    // PASSWORD CHECK
    // --------------------------------------

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        status: 401,
        message: "Invalid credentials",
      });
    }

    // --------------------------------------
    // GENERATE TOKEN
    // --------------------------------------

    const token = generateToken(user);

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        roleId: user.roleId,
        referenceId: user.referenceId,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      status: 500,
      message:
        process.env.NODE_ENV === "production"
          ? "Login failed"
          : error.message,
    });
  }
});

// ==========================================
// GET CURRENT USER
// ==========================================

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: 401,
        message: "Authorization token required",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        status: 401,
        message: "Authorization token required",
      });
    }

    // --------------------------------------
    // VERIFY TOKEN
    // --------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // --------------------------------------
    // FIND ACTIVE USER
    // --------------------------------------

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || user.status !== true) {
      return res.status(401).json({
        status: 401,
        message: "User not found or inactive",
      });
    }

    // --------------------------------------
    // VALIDATE TOKEN AGAINST DB
    // --------------------------------------

    if (
      String(user.roleId) !== String(decoded.roleId) ||
      String(user.referenceId || "") !== String(decoded.referenceId || "") ||
      user.role !== decoded.role
    ) {
      return res.status(401).json({
        status: 401,
        message: "Token is no longer valid",
      });
    }

    // --------------------------------------
    // RESPONSE
    // --------------------------------------

    return res.status(200).json({
      status: 200,
      message: "Current user fetched successfully",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        roleId: user.roleId,
        referenceId: user.referenceId,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    return res.status(401).json({
      status: 401,
      message: "Invalid or expired token",
    });
  }
});

module.exports = router;