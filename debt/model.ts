
import { Schema, model } from 'mongoose';
import * as timestamps from 'mongoose-timestamp';

export const debtSchema: Schema = new Schema({
  roomId: String,
  note: String,
  from: String,
  to: String,
  amount: Number
});
debtSchema.plugin(timestamps);

export const debtModel = model('Debt', debtSchema);
