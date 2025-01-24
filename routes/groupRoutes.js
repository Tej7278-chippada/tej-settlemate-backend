// routes/groupRoutes.js
const express = require('express');
const { createGroup, joinGroup, fetchGroups, fetchGroupDetails, generateJoinCode, getUserGroups } = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');
const Group = require('../models/groupModel');
const User = require('../models/userModel');

const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');

// Routes
// router.post('/create', authMiddleware, createGroup);
router.post('/join', authMiddleware, joinGroup);
router.get('/user-groups', authMiddleware, getUserGroups);
router.get('/', authMiddleware, fetchGroups);
router.get('/:groupId', authMiddleware, fetchGroupDetails);
router.post('/:groupId/generate-code', authMiddleware, generateJoinCode);


// Initialize multer with memory storage
const upload = multer({
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
    storage: multer.memoryStorage(),
  });

// Create a Group
router.post('/create', upload.single('groupPic'), authMiddleware,  async (req, res) => {
    const { groupName } = req.body;
    const userId = req.user.id; // From authMiddleware
  
    try {
        // Process the uploaded profile picture
    let groupPictureBuffer = null;
    if (req.file) {
        groupPictureBuffer = await sharp(req.file.buffer)
        .resize({ width: 200, height: 200 })
        .jpeg({ quality: 80 })
        .toBuffer();
    }
      const group = new Group({
        groupName,
        groupPic : groupPictureBuffer,
        createdBy: userId,
        members: [{ user: userId, role: 'Admin' }],
      });
  
      group.generateJoinCode(); // Generate initial join code
      await group.save();
  
      // Add group ID to user's groups array
      await User.findByIdAndUpdate(userId, { $push: { groups: group._id } });
  
      res.status(201).json({ message: 'Group created successfully', group });
    } catch (error) {
      res.status(500).json({ message: 'Error creating group', error });
    }
  });



module.exports = router;
