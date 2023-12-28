const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    assignedStudents: {
        type: String,
        required: true,
    },
    createdBy: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    publishedAt: {
        type: Date,
        required: true,
    },
    deadlineDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'ONGOING'],
        default: function () {
            // Determine the status based on the current date
            return this.publishedAt > new Date() ? 'SCHEDULED' : 'ONGOING';
        },
    },
});

module.exports = mongoose.model('Assignment', assignmentSchema);