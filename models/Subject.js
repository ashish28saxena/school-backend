const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    code: {
        type: String,
        required: true
    },

    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true
    },

    subjectType: {
        type: String,
        enum: ["Core", "Optional"],
        default: "Core"
    },

    status: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model("Subject", subjectSchema);