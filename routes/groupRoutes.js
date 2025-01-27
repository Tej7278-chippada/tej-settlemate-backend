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
// router.get('/:groupId', authMiddleware, fetchGroupDetails);
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

// Fetch Group Details
router.get('/:groupId', authMiddleware, async (req, res) => {
  const { groupId } = req.params;

  // if (req.group.id !== groupId) return res.status(403).json({ message: 'Unauthorized access' });

  try {
    const group = await Group.findById(groupId).populate('members.user', ); // 'username'
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const userId = req.user.id;
    const isMember = group.members.some(
      (member) => member.user._id.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const groupData = group.toObject();
    if (group.groupPic) {
      groupData.groupPic = group.groupPic.toString('base64');
    }

    res.status(200).json(groupData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group details', error });
  }
});

// Delete Group by Admin
router.delete('/:groupId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only the group admin can delete the group' });

    // Remove the groupId from all users' `groups` arrays
    await User.updateMany(
      { groups: req.params.groupId },
      { $pull: { groups: req.params.groupId } }
    );

    // Delete the group
    await Group.findByIdAndDelete(req.params.groupId);
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete the group', error });
  }
});

// Remove Member from Group
router.post('/:groupId/remove-member', authMiddleware, async (req, res) => {
  const { memberId } = req.body;

  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if the requesting user is an Admin
    const requestingUser = group.members.find(
      (member) => member.user.toString() === req.user.id && member.role === 'Admin'
    );
    if (!requestingUser) return res.status(403).json({ message: 'Only Admins can remove members.' });

    // Remove the member
    group.members = group.members.filter((member) => member.user.toString() !== memberId);
    await group.save();

    // Update the user's groups array
    await User.findByIdAndUpdate(memberId, { $pull: { groups: req.params.groupId } });

    res.status(200).json({ message: 'Member removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove member.', error });
  }
});


// Exit Group by member
router.post('/:groupId/exit', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Remove the user from the group's members array
    group.members = group.members.filter((member) => member.user.toString() !== req.user.id);
    await group.save();

    // Remove the groupId from the user's groups array
    await User.findByIdAndUpdate(req.user.id, { $pull: { groups: req.params.groupId } });

    res.status(200).json({ message: 'You have left the group' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to leave the group', error });
  }
});

// Route to Add Transactions on Group
router.post('/:groupId/transactions', authMiddleware, async (req, res) => {
  const { groupId } = req.params;
  const { amount, description, paidBy, splitsTo, transPerson } = req.body;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const newTransaction = {
      amount,
      description,
      paidBy,
      splitsTo,
      transPerson,
      createdAt: new Date(),
    };

    group.transactions = group.transactions || [];
    group.transactions.push(newTransaction);

    await group.save();

    res.status(201).json({ message: 'Transaction added successfully', newTransaction });
  } catch (error) {
    res.status(500).json({ message: 'Error adding transaction', error });
  }
});

// router.post('/:groupId/transactions', authMiddleware, async (req, res) => {
//   const { groupId } = req.params;
//   const { amount, description, paidBy, splitsTo, transPerson } = req.body;

//   try {
//     const group = await Group.findById(groupId);
//     if (!group) return res.status(404).json({ message: 'Group not found' });

//     const newTransaction = {
//       amount,
//       description,
//       paidBy,
//       splitsTo,
//       transPerson,
//       createdAt: new Date(),
//     };

//     group.transactions = group.transactions || [];
//     group.transactions.push(newTransaction);

//     await group.save();
//     res.status(201).json(newTransaction);
//   } catch (error) {
//     res.status(500).json({ message: 'Error adding transaction', error });
//   }
// });

module.exports = router;
