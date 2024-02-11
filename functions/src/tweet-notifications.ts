import { functions, firestore, regionalFunctions } from './lib/utils';
import { notificationsConverter } from './types/notification';
import { Timestamp } from 'firebase-admin/firestore';
import type { Tweet } from './types';

export const tweetNotifications = regionalFunctions.firestore
  .document('tweets/{tweetId}')
  .onUpdate(async (snapshot): Promise<void> => {
    const tweetId = snapshot.before.id;

    const oldTweetData = snapshot.before.data() as Tweet;
    const newTweetData = snapshot.after.data() as Tweet;

    const userId = newTweetData.createdBy;

    functions.logger.info(
      `Sending notification for tweet ${tweetId} to user ${userId}.`
    );

    const { userLikes: oldUserLikes } = oldTweetData;

    const { userLikes } = newTweetData;

    const userLikesSet = new Set(userLikes);

    const isRemovedLikes = oldUserLikes.some((like) => !userLikesSet.has(like));

    const userNotiRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .withConverter(notificationsConverter);

    if (userLikes != oldUserLikes) {
      if (isRemovedLikes) return;

      const notiRef = await userNotiRef.add({
        id: '',
        type: 'like',
        users: userLikes,
        tweet: tweetId,
        createdAt: Timestamp.now()
      });

      notiRef.update({ id: notiRef.id });
    }

    functions.logger.info(
      `Sending notification for tweet ${tweetId} to user ${userId} is done.`
    );
  });
