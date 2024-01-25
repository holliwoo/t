import { Timestamp } from 'mongodb';

export type Message = {
  id: string;
  message: string;
  senderId: string;
  receiverId: string;
  iv?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
};

export type Messages = Message[];
