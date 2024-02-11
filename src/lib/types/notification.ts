import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore';

export type UserNotification = {
  id: string;
  tweet: string;
  createdAt: Timestamp;
} & (
  | {
      type: 'like' | 'retweet';
      users: string[];
    }
  | {
      type: 'reply';
      user: string;
      reply: string;
    }
);

export const notificationsConverter: FirestoreDataConverter<UserNotification> =
  {
    toFirestore(notification) {
      return { ...notification };
    },
    fromFirestore(snapshot, options) {
      const data = snapshot.data(options);

      return { ...data } as UserNotification;
    }
  };
