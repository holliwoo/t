import { connectMongoDB } from '@lib/mongo/mongodb';
import { DM } from '@lib/models/dm';
import { decryptMessage } from './get-dm';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { UserDMs } from '@lib/types/dm';

export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { userId } = req.body;
  try {
    await connectMongoDB('user-messages');

    const conversations = await DM.find({
      users: userId
    });
    if (!conversations || conversations.length === 0) {
      return res.status(200).json({ message: "Conversations don't exist" });
    }

    const decryptedConversations: UserDMs = conversations.map(
      (conversation: any) => {
        return {
          id: conversation._id,
          users: conversation.users,
          messages: conversation.messages.map((message: any) => {
            return {
              id: message._id,
              senderId: message.senderId,
              receiverId: message.receiverId,
              message: decryptMessage(message.message, message.iv) as string,
              media: message.media,
              createdAt: message.createdAt,
              updatedAt: message.updatedAt
            };
          }),
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        };
      }
    );

    //console.log('Decrypted Conversation:', decryptedConversations);

    return res.status(200).json({ dm: decryptedConversations });
  } catch (err) {
    console.log(err);
  }
}
