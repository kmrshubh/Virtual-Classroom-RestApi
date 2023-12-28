const mongoose = require("mongoose");

const assignmentUsersSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  assignment: {
    type: String,
    required: true,
  },
  tutor: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["ALL", "PENDING", "OVERDUE", "SUBMITTED"],
  },
  submission: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("AssignmentUser", assignmentUsersSchema);