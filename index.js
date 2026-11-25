const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");


const { apiLimiter } = require("./middleware/security");
const { verifyToken } = require("./middleware/auth");

const app = express();

// ========================================
// BASIC SECURITY
// ========================================

app.disable("x-powered-by");

// If hosted behind a proxy, configure trust proxy
// according to your hosting provider's topology.
app.set("trust proxy", 1);

app.use(helmet());

// ========================================
// CORS
// ========================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://school-management-beta-seven.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman/server-to-server requests without Origin
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    maxAge: 86400,
  })
);

// ========================================
// BODY PARSERS
// ========================================

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb",
  })
);

// ========================================
// SECURITY MIDDLEWARE
// ========================================



// app.use(
//   mongoSanitize({
//     replaceWith: "_",
//   })
// );

// ========================================
// STATIC FILES
// ========================================

app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ========================================
// API RATE LIMITING
// ========================================

app.use("/api", apiLimiter);

// ========================================
// MONGODB CONNECTION
// ========================================

// ========================================
// MONGODB CONNECTION
// ========================================

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI environment variable is missing");
    }

    cached.promise = mongoose.connect(uri, {
      retryWrites: false, // FIX
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      bufferCommands: false,
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

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

// ========================================
// DATABASE MIDDLEWARE
// ========================================

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// ========================================
// IMPORT ROUTES
// ========================================

const authRoutes = require("./routes/Auth");
const userRoute = require("./routes/user");
const roleRoute = require("./routes/role");
const classRouter = require("./routes/class");
const studentRouter = require("./routes/student");
const attendenceRouter = require("./routes/attendence");
const subjectRouter = require("./routes/subject");
const teacherRouter = require("./routes/teacher");
const sectionRouter = require("./routes/section");
const assignSubjectRouter = require("./routes/assignSubject");
const assignClassRouter = require("./routes/assignClass");
const TeacherAttendance = require("./routes/teacherAttendance");
const teacherSalaryRoutes = require("./routes/TeacherSalaryRoutes");
const studentAttendanceRoutes = require("./routes/StudentAttendanceRoutes");
const assignClassTeacher = require("./routes/AssignClassTeacher");
const assignStudentRoutes = require("./routes/AssignStudent");
const timetableRoutes = require("./routes/Timetable");
const examMark = require("./routes/ExamMark");
const examRoutes = require("./routes/Exam");
const examScheduleRoutes = require("./routes/ExamSchedule");
const examResultRoutes = require("./routes/ExamResult");
const reportCardRoutes = require("./routes/ReportCard");
const admitCardRoutes = require("./routes/AdmitCard");
const feeStructureRoutes = require("./routes/FeeStructure");
const feeCollectionRoutes = require("./routes/FeeCollection");
const feeDiscountRoutes = require("./routes/FeeDiscount");
const feeDueReportRoutes = require("./routes/FeeDueReport");
const feeReceiptRoutes = require("./routes/FeeReceipt");
const feeInstallmentRoutes = require("./routes/FeeInstallment");
const studentIdCardRoutes = require("./routes/StudentIdCard");
const libraryRoutes = require("./routes/Library");
const libraryExtrasRoutes = require("./routes/LibraryExtras");
const transportRoutes = require("./routes/Transport");
const parentRoutes = require("./routes/Parent");
const dashboardRoutes = require("./routes/Dashboard");
const studentPromotionRoutes = require("./routes/studentPromotion");



const permissionRoutes = require("./routes/permissionRoutes");
const rolePermissionRoutes = require("./routes/rolePermissionRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const leaveTypeRoutes = require("./routes/leaveTypeRoutes");
const leaveBalanceRoutes = require("./routes/leaveBalanceRoutes");
const leaveApprovalRoutes = require("./routes/leaveApprovalRoutes");
const leaveReportRoutes = require("./routes/leaveReportRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const homeworkRoutes = require("./routes/homeworkRoutes");
const homeworkSubmissionRoutes = require("./routes/homeworkSubmissionRoutes");

// ========================================
// PUBLIC AUTH ROUTES
// ========================================

// Login, Register, Roles, Me
app.use("/api/auth", authRoutes);

// ========================================
// JWT PROTECTION
// ALL APIs BELOW REQUIRE VALID TOKEN
// ========================================

app.use("/api", verifyToken);

// ========================================
// PROTECTED API ROUTES
// ========================================

app.use("/api/user", userRoute);
app.use("/api/role", roleRoute);
app.use("/api/class", classRouter);
app.use("/api/student", studentRouter);
app.use("/api/attendence", attendenceRouter);
app.use("/api/subject", subjectRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/section", sectionRouter);
app.use("/api/assignsubject", assignSubjectRouter);
app.use("/api/assignclass", assignClassRouter);
app.use("/api/teacherAttendance", TeacherAttendance);
app.use("/api/teachersalary", teacherSalaryRoutes);
app.use("/api/studentattendance", studentAttendanceRoutes);
app.use("/api/assignclassteacher", assignClassTeacher);
app.use("/api/assignstudent", assignStudentRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/exammark", examMark);
app.use("/api/examschedule", examScheduleRoutes);
app.use("/api/examresult", examResultRoutes);
app.use("/api/reportcard", reportCardRoutes);
app.use("/api/admitcard", admitCardRoutes);
app.use("/api/feestructure", feeStructureRoutes);
app.use("/api/feecollection", feeCollectionRoutes);
app.use("/api/feediscount", feeDiscountRoutes);
app.use("/api/feedue", feeDueReportRoutes);
app.use("/api/feereceipt", feeReceiptRoutes);
app.use("/api/feeinstallment", feeInstallmentRoutes);
app.use("/api/student-id-card", studentIdCardRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/library-extra", libraryExtrasRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/studentpromotion", studentPromotionRoutes);


app.use("/api/permission", permissionRoutes);
app.use("/api/rolepermission", rolePermissionRoutes);
app.use("/api/leave", leaveRoutes);

app.use("/api/leavetype", leaveTypeRoutes);
app.use("/api/leavebalance", leaveBalanceRoutes);
app.use("/api/leave-approval", leaveApprovalRoutes);
app.use("/api/leavereport", leaveReportRoutes);
app.use("/api/holiday", holidayRoutes);

app.use("/api/notification", notificationRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/homework-submission", homeworkSubmissionRoutes);
// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("API Error:", err.message);

  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ========================================
// SERVER
// ========================================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;