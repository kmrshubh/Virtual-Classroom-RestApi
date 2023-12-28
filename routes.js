const express = require('express');
const { verifyToken } = require('./auth');
const jwt = require('jsonwebtoken');

const Assignment = require('./models/assignments');
const User = require('./models/users');
const AssignmentUser = require('./models/assignmentUsers');

const router = express.Router();

// Authentication endpoint
router.post('/auth', async (req, res) => {
    const { username, password, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      console.log('User not found');
      return res.status(400).json({ message: 'User not found' });
    }

    if (existingUser && password!=existingUser.password ) {
        return res.status(400).json({ message: 'User Invalid' });
    }

    //console.log(username + ' ' + password + ' ' + role);
    const user = { username, role: role };

    const secretKey = 'secret-key-xxxxx';

    const token = jwt.sign(user, secretKey, { expiresIn: '1h' });

    res.json({ token });
});

// Register user
router.post('/register', async (req, res) => {
    try {
      const { username, password, role } = req.body;
  
      // Check if the user with the same name already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'User with the same name already exists' });
      }

      // Validate user role
      if (!['tutor', 'student'].includes(role)) {
        return res.status(400).json({ message: 'UserRole is invalid' });
      }
  
      // Create a new user
      const newUser = new User({
        username,
        password,
        role,
      });
  
      // Save the user to the database
      await newUser.save();
  
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

// Protected endpoints
router.use(verifyToken);

// Create/Update/Delete an assignment as a tutor
router.post('/assignments', async (req, res) => {
    try {
      // Assuming you have a middleware that extracts user information from the request
      const username = req.user.username;
      console.log(req.user);

      // Check if the user exists and is a tutor
      const user = await User.findOne({ username: username });
      console.log(user);
      if (!user || user.role !== 'tutor') {
        return res.status(403).json({ message: 'Forbidden: Only tutors can perform this operation' });
      }
  
      // Assuming req.body contains the assignment details
      const assignmentData = req.body;
      
      const assignmentExist = await Assignment.findOne({ name: assignmentData.name });
      //console.log(assignmentExist);
      if (assignmentExist) {
        return res.status(400).json({ message: 'Assignment already exist' });
      }

      // Assigned student validation
      const studentsArray = assignmentData.assignedStudents.split(',').map(s => s.trim());
      if(studentsArray.length <= 0){
        return res.status(400).json({ message: 'Atleast one student should be provided' });
      }

      for (const studentUsername of studentsArray) {
        const student = await User.findOne({ username: studentUsername, role: 'student' });
  
        // If the student doesn't exist or is not a student, return an error
        if (!student) {
          return res.status(400).json({ message: `Invalid assigned student: ${studentUsername}` });
        }
      }
      
      // Creating assignment
      const newAssignment = await Assignment.create({
        ...assignmentData,
        createdBy: user.username,
      });
  
      for (const studentUsername of studentsArray) {

        const assignmentUser = new AssignmentUser({
          user: studentUsername,
          assignment: assignmentData.name,
          tutor: user.username,
          status: 'PENDING',
        });
  
        await assignmentUser.save();
      }

      res.json({ message: 'Assignment created successfully', assignment: newAssignment });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Assuming you have a middleware that extracts user information from the request
router.get('/assignments/:name', async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(403).json({ message: 'Forbidden: Only authenticated users can perform this operation' });
    }

    const assignmentName = req.params.name;

    // Fetch the assignment details
    const assignment = await Assignment.findOne({ name: assignmentName });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if the user is authorized to view the assignment details
    if (user.role === 'student') {
      // If the user is a student, return only their submission
      const studentSubmission = await AssignmentUser.findOne({ assignment: assignmentName, user: username });

      if (!studentSubmission) {
        return res.status(404).json({ message: 'Submission not found for this assignment' });
      }

      return res.json({ assignment, submission: studentSubmission });
    } else if (user.role === 'tutor') {
      // If the user is a tutor, return all submissions by assigned students
      const assignedStudentsSubmissions = await AssignmentUser.find({ assignment: assignmentName, tutor: username });

      return res.json({ assignment, submissions: assignedStudentsSubmissions });
    } else {
      // Handle other user roles if needed
      return res.status(403).json({ message: 'Forbidden: You are not authorized to view this assignment' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Assuming you have a middleware that extracts user information from the request
router.put('/assignments/:name', async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (!user || user.role !== 'tutor') {
      return res.status(403).json({ message: 'Forbidden: Only tutors can perform this operation' });
    }

    const assignmentName = req.params.name;
    const assignmentData = req.body;

    // Check if the assignment exists
    const existingAssignment = await Assignment.findOne({ name: assignmentName });
    if (!existingAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update assignment details
    existingAssignment.name = assignmentData.name;
    existingAssignment.description = assignmentData.description;
    // Update other properties as needed

    await existingAssignment.save();

    // Update associated assignmentUser entries with the new assignment name
    await AssignmentUser.updateMany({ assignment: assignmentName, tutor: user.username }, { assignment: assignmentData.name });

    res.json({ message: 'Assignment updated successfully', assignment: existingAssignment });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Assuming you have a middleware that extracts user information from the request
router.delete('/assignments/:name', async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (!user || user.role !== 'tutor') {
      return res.status(403).json({ message: 'Forbidden: Only tutors can perform this operation' });
    }

    const assignmentName = req.params.name;

    // Check if the assignment exists
    const existingAssignment = await Assignment.findOne({ name: assignmentName });
    if (!existingAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Delete the assignment
    await Assignment.deleteOne({ name: assignmentName });

    // Delete associated assignmentUser entries
    await AssignmentUser.deleteMany({ assignment: assignmentName, tutor: user.username });

    res.json({ message: 'Assignment deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/assignments/:name/submission', async (req, res) => {
  try {
    const username = req.user.username;
    const assignmentName = req.params.name;

    // Check if the user is a student
    const student = await User.findOne({ username, role: 'student' });
    if (!student) {
      return res.status(403).json({ message: 'Forbidden: Only students can make submissions' });
    }

    // Check if the assignment exists
    const existingAssignment = await AssignmentUser.findOne({ user: username, assignment: assignmentName });

    if (!existingAssignment) {
      // If the assignment doesn't exist for the user, return an error
      return res.status(404).json({ message: 'Assignment not found for the user' });
    }

    // If a submission already exists, update the status to 'SUBMITTED' if it's 'PENDING'
    if (existingAssignment.status === 'PENDING') {
      // Check if the status is 'PENDING', then update the submission and status
      existingAssignment.submission = req.body.submission;
      existingAssignment.status = 'SUBMITTED';
      await existingAssignment.save();
      return res.json({ message: 'Submission updated successfully', submission: existingAssignment });
    } else {
      // If the status is 'SUBMITTED', return an error
      return res.status(400).json({ message: 'Already submitted for this assignment' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Assignment feed
router.get('/assignmentsfeed', async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(403).json({ message: 'Forbidden: User not found' });
    }

    let assignments;

    if (user.role === 'tutor') {
      // Tutor feed: Return all assignments created by the tutor
      assignments = await Assignment.find({ createdBy: username });
    } else if (user.role === 'student') {
      // Student feed: Return all assignments assigned to the student
      assignments = await AssignmentUser.find({ user: username, status: { $ne: 'SUBMITTED' } }).populate('assignment');
    }

    // Filter by publishedAt (Assignment published date)
    const publishedAtFilter = req.query.publishedAt;
    if (publishedAtFilter) {
      assignments = assignments.filter((assignment) => {
        return assignment.publishedAt === publishedAtFilter;
      });
    }

    res.json({ message: 'Assignment feed retrieved successfully', assignments });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;