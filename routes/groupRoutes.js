// routes/groupRoutes.js
const express = require('express');
const { createGroup, joinGroup, fetchGroups, fetchGroupDetails, generateJoinCode, getUserGroups } = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Routes
router.post('/create', authMiddleware, createGroup);
router.post('/join', authMiddleware, joinGroup);
router.get('/user-groups', authMiddleware, getUserGroups);
router.get('/', authMiddleware, fetchGroups);
router.get('/:groupId', authMiddleware, fetchGroupDetails);
router.post('/:groupId/generate-code', authMiddleware, generateJoinCode);

module.exports = router;
