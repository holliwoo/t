import { Timestamp } from 'mongodb';
import type { MediaData } from './file';

export type Message = {
  id: string;
  message: string;
  media?: MediaData[];
  senderId: string;
  receiverId: string;
  iv?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
};

export type Messages = Message[];
