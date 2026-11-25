const mongoose = require("mongoose");
const Permission = require("../models/Permission");

const permissions = [
  { moduleName: "dashboard", displayName: "Dashboard" },
  { moduleName: "student", displayName: "Student" },
  { moduleName: "parent", displayName: "Parent" },
  { moduleName: "teacher", displayName: "Teacher" },
  { moduleName: "class", displayName: "Class" },
  { moduleName: "section", displayName: "Section" },
  { moduleName: "subject", displayName: "Subject" },
  { moduleName: "assignsubject", displayName: "Assign Subject" },
  { moduleName: "attendance", displayName: "Attendance" },
  { moduleName: "fees", displayName: "Fees" },
  { moduleName: "library", displayName: "Library" },
  { moduleName: "exam", displayName: "Exam" },
  { moduleName: "result", displayName: "Result" },
  { moduleName: "promotion", displayName: "Student Promotion" },
  { moduleName: "role", displayName: "Role Management" },
  { moduleName: "permission", displayName: "Permission Management" },
];

async function seedPermissions() {
  try {
    await mongoose.connect("YOUR_MONGODB_URI");

    for (const item of permissions) {
      await Permission.updateOne(
        { moduleName: item.moduleName },
        { $set: item },
        { upsert: true }
      );
    }

    console.log("Permissions seeded successfully");
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

seedPermissions();