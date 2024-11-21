// models/groupModels.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  groupPicture: { type: String }, // Stores the image as a URL or base64 string
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
    },
  ],
  joinCode: { type: String, unique: true },
  joinCodeExpiry: { type: Date },
});

groupSchema.methods.generateJoinCode = function () {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-character alphanumeric code
  this.joinCode = code;
  this.joinCodeExpiry = Date.now() + 60 * 60 * 1000; // 1-hour expiry
};

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
