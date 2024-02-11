import type {
  Timestamp,
  FirestoreDataConverter
} from 'firebase-admin/firestore';

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
    fromFirestore(snapshot) {
      const data = snapshot.data();

      return { ...data } as UserNotification;
    }
  };
