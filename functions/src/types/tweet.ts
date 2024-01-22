import type {
  Timestamp,
  FirestoreDataConverter
} from 'firebase-admin/firestore';

export type MediaData = {
  src: string;
  alt: string;
};

export type ImagesPreview = (MediaData & {
  id: number;
})[];

export type Tweet = {
  text: string | null;
  images: ImagesPreview | null;
  parent: { id: string; username: string } | null;
  userLikes: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
  userReplies: number;
  userRetweets: string[];
};

export const tweetConverter: FirestoreDataConverter<Tweet> = {
  toFirestore(tweet) {
    return { ...tweet };
  },
  fromFirestore(snapshot) {
    const data = snapshot.data();

    return { ...data } as Tweet;
  }
};
