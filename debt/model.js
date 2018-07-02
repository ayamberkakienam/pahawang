
const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');

const DebtSchema = new mongoose.Schema({
  roomId: String,
  note: String,
  from: String,
  to: String,
  amount: Number
});
DebtSchema.plugin(timestamps);

const DebtModel = mongoose.model('Debt', DebtSchema);

module.exports = { DebtSchema, DebtModel };
