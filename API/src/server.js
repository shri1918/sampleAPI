const express = require('express');
const { connectDB, getDB } = require('../db');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// Generate a random 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// API for student verification
app.post('/verify-student', async (req, res) => {
    console.log('Request Body:', req.body); // Log incoming request
  
    try {
      const { mobile, email } = req.body;
  
      if (!mobile && !email) {
        return res.status(400).json({ error: 'Mobile number or email is required' });
      }
  
      if (mobile && email) {
        return res.status(400).json({ error: 'Only one of mobile number or email should be provided' });
      }
  
      const otp = generateOTP();
      const studentId = uuidv4();
      const joinDate = new Date();
      const state = 'unverified';
  
      const db = getDB();
  
      // Check if student with given mobile or email already exists
      const existingStudent = await db.collection('students').findOne({
        $or: [{ mobile }, { email }]
      });
  
      if (existingStudent) {
        console.log('Existing Student Found:', existingStudent); // Log existing student details
  
        // Update existing student with new OTP, keep the state unchanged
        await db.collection('students').updateOne(
          { _id: existingStudent._id },
          { $set: { otp } }
        );
        return res.json({ message: 'OTP updated for existing student', studentId: existingStudent.studentId, otp });
      }
  
      // Insert new student if not already present
      const newStudent = {
        studentId,
        mobile,
        email,
        otp,
        joinDate,
        state,
      };
  
      const result = await db.collection('students').insertOne(newStudent);
  
      console.log('Inserted Document:', result); // Log insertion result
      console.log('Inserted Document Details:', newStudent); // Log the document details
  
      res.json({ message: 'Verification initiated', studentId, otp, joinDate, state });
    } catch (error) {
      console.error('Error verifying student', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// API for OTP verification
app.post('/verify-otp', async (req, res) => {
  console.log('Request Body:', req.body); // Log incoming request
  try {
    const { mobile, email, otp } = req.body;
    
    if (!mobile && !email) {
      return res.status(400).json({ error: 'Mobile number or email is required' });
    }

    if (mobile && email) {
      return res.status(400).json({ error: 'Only one of mobile number or email should be provided' });
    }

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    const db = getDB();
    const query = mobile ? { mobile, otp } : { email, otp };
    console.log('Query:', query); // Log the query used for finding the student

    const student = await db.collection('students').findOne(query);
    
    console.log('Student Found:', student); // Log the found student

    if (!student) {
      return res.status(400).json({ error: 'Invalid OTP or details' });
    }

    if (student.state === 'verified') {
      return res.status(400).json({ message: 'OTP verifed successfully',state: student.state});
    }

    // Update state to 'verified'
    await db.collection('students').updateOne(query, { $set: { state: 'verified' } });

    res.json({ message: 'OTP verified successfully', studentId: student.studentId});
  } catch (error) {
    console.error('Error verifying OTP', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// API for adding student name
app.post('/add-student-name', async (req, res) => {
  console.log('Request Body:', req.body); // Log incoming request
  try {
    const { mobile, email, studentName } = req.body;
    if (!mobile && !email) {
      return res.status(400).json({ error: 'Mobile number or email is required' });
    }

    if (mobile && email) {
      return res.status(400).json({ error: 'Only one of mobile number or email should be provided' });
    }

    if (!studentName) {
      return res.status(400).json({ error: 'Student name is required' });
    }

    const db = getDB();
    const query = mobile ? { mobile, state: 'verified' } : { email, state: 'verified' };
    const update = { $set: { studentName } };

    const result = await db.collection('students').updateOne(query, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'No verified student found with provided details' });
    }

    res.json({ message: 'Student name added successfully' });
  } catch (error) {
    console.error('Error adding student name', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
