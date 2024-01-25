import { connectMongoDB } from '@lib/mongo/mongodb';
import { DM } from '@lib/models/dm';
import { decryptMessage } from './get-dm';
import type { NextApiRequest, NextApiResponse } from 'next';
import { UserDM, UserDMs } from '@lib/types/dm';
import { Message } from '@lib/types/message';
import { Timestamp } from 'mongodb';

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
              createdAt: message.createdAt,
              updatedAt: message.updatedAt
            };
          }),
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        };
      }
    );

    console.log('Decrypted Conversation:', decryptedConversations);
    console.log('Decrypted message:', decryptedConversations[0].messages);

    return res.status(200).json({ dm: decryptedConversations });
  } catch (err) {
    console.log(err);
  }
}

/*
  const decryptedConversations: UserDMs = conversations.map(
      (conversation: any) => {
        const lastMessage =
          conversation.messages[conversation.messages.length - 1];

        const decryptedMessage = decryptMessage(
          lastMessage.message,
          lastMessage.iv
        );

        const latestMessage: Message = {
          id: lastMessage._id,
          senderId: lastMessage.senderId,
          receiverId: lastMessage.receiverId,
          message: decryptedMessage as string,
          createdAt: lastMessage.createdAt,
          updatedAt: lastMessage.updatedAt
        };

        return {
          id: conversation._id,
          users: conversation.users,
          messages: [latestMessage],
          createdAt: lastMessage.createdAt,
          updatedAt: lastMessage.updatedAt
        };
      }
    );
*/
