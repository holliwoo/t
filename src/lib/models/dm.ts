import { messageSchema } from './message';
import mongoose, { Schema, models } from 'mongoose';

const dmSchema = new Schema({
  users: [
    {
      type: String,
      required: true
    }
  ],
  messages: [messageSchema]
});

export const DM = models.DM || mongoose.model('DM', dmSchema);
export const DMSchema = DM;

//DM.watch().on('change', (data) => console.log(data));
