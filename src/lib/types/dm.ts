import { Timestamp } from 'mongodb';
import type { Messages } from './message';

export type DM = {
  id: string;
  users: string[];
  messages: Messages;
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
};

export type DMs = DM[];

export type UserDM = DM;
export type UserDMs = DMs;
