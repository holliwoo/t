import { Schema } from 'mongoose';

const mediaSchema = new Schema(
  {
    type: {
      type: String,
      required: true
    },
    src: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const messageSchema = new Schema(
  {
    // If group-chats are implemented, this will be needed
    senderId: {
      type: String,
      required: true
    },
    receiverId: {
      type: String,
      required: true
    },
    iv: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    media: [mediaSchema]
  },
  { timestamps: true }
);
