const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://school-management-beta-seven.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// MongoDB connection cache for Vercel serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI environment variable is missing");
    }

    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected successfully");
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

// Connect to MongoDB BEFORE running API routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
     console.error("MongoDB connection error:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Import routes
const authRoute = require("./routes/auth");
const userRoute= require("./routes/user");
const roleRoute= require("./routes/role")
const classRouter= require("./routes/class")
const studentRouter= require("./routes/student");
const attendenceRouter=require("./routes/attendence");
const subjectRouter=require("./routes/subject");
const teacherRouter=require("./routes/teacher");
const sectionRouter = require("./routes/section");
const assignSubjectRouter = require("./routes/assignSubject");
const assignClassRouter = require("./routes/assignClass");

// Register routes AFTER the database middleware
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/role", roleRoute);
app.use("/api/class",classRouter);
app.use("/api/student",studentRouter);
app.use("/api/attendence",attendenceRouter);
app.use("/api/subject",subjectRouter);
app.use("/api/teacher",teacherRouter);
app.use("/api/section", sectionRouter);
app.use("/api/assignsubject",assignSubjectRouter);
app.use("/api/assignclass",assignClassRouter);

// Export Express app for Vercel
module.exports = app;




