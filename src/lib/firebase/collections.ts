import { collection } from 'firebase/firestore';
import { userConverter } from '@lib/types/user';
import { tweetConverter } from '@lib/types/tweet';
import { bookmarkConverter } from '@lib/types/bookmark';
import { statsConverter } from '@lib/types/stats';
import { notificationsConverter } from '@lib/types/notification';
import { db } from './app';
import type { CollectionReference } from 'firebase/firestore';
import type { UserNotification } from '@lib/types/notification';
import type { Bookmark } from '@lib/types/bookmark';
import type { Stats } from '@lib/types/stats';

export const usersCollection = collection(db, 'users').withConverter(
  userConverter
);

export const tweetsCollection = collection(db, 'tweets').withConverter(
  tweetConverter
);

export function userBookmarksCollection(
  id: string
): CollectionReference<Bookmark> {
  return collection(db, `users/${id}/bookmarks`).withConverter(
    bookmarkConverter
  );
}

export function userStatsCollection(id: string): CollectionReference<Stats> {
  return collection(db, `users/${id}/stats`).withConverter(statsConverter);
}

export function userNotificationsCollection(
  id: string
): CollectionReference<UserNotification> {
  return collection(db, `users/${id}/notifications`).withConverter(
    notificationsConverter
  );
}
