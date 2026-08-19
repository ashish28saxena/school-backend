const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({
    name: String,
    dataOfBirth: String,
    gender: String,
    StudentPhoto: String,
    bloodGroup: String,
    fatherName: String,
    motherName: String,
    fatherOccupation: String,
    motherOccupation: String,
    parentMobile: String,
    admissionNumber: String,
    className: String,
    academicYear: String,
    previousSchool: String,
    studentEmail: String,
    emergencyContact: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    isconfirm: String,
    birthCertificate: String,
    aadhaarCard: String,
    transferCertificate: String,
    previousMarksheet: String,

})

module.exports = mongoose.model("Student", studentSchema)