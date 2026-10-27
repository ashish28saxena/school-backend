const express= require("express");
const mongoose= require("mongoose");
require("dotenv").config();

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
const cors = require("cors");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect("mongodb://127.0.0.1:27017/my-project")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

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
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});