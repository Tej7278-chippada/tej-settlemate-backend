// models/groupModels.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  groupPic: { type: Buffer }, // Stores the image as a URL or base64 string
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
      joined_at: { type: Date, default: Date.now },
      balance: { type: Number, default: 0 }, // Balance of the member in this group // Initialize balance to 0
    },
  ],
  joinCode: { type: String, unique: true },
  joinCodeExpiry: { type: Date },
  transactions: [
    {
      amount: { type: Number, required: true },
      description: { type: String },
      paidBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      splitsTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      transPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      paidAmounts: { type: Map, of: Number }, // Amounts paid by each member
      splitAmounts: { type: Map, of: Number }, // Amounts split to each member
      paidWay: { type: String, enum: ['Equal', 'UnEqual', 'ByPercentage'], default: 'Equal' },
      splitsWay: { type: String, enum: ['Equal', 'UnEqual', 'ByPercentage'], default: 'Equal' },
      createdAt: { type: Date, default: Date.now },
    },{ timestamps: true }
  ],
}, 
  { timestamps: true }
);

groupSchema.methods.generateJoinCode = function () {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-character alphanumeric code
  this.joinCode = code;
  this.joinCodeExpiry = Date.now() + 60 * 60 * 1000; // 1-hour expiry
};

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
