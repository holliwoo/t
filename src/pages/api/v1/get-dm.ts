import crypto from 'crypto';
import { connectMongoDB, key } from '@lib/mongo/mongodb';
import { DM } from '@lib/models/dm';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { UserDM } from '@lib/types/dm';

export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { users } = req.body;
  try {
    await connectMongoDB('user-messages');

    const existingConversation = await DM.findOne({
      users: { $all: users }
    });

    if (!existingConversation) {
      return res.status(200).json({ message: "Conversation doesn't exist" });
    }

    const decryptedConversation: UserDM = {
      id: existingConversation._id,
      users: existingConversation.users,
      messages: existingConversation.messages.map((message: any) => {
        const decryptedMessage = decryptMessage(message.message, message.iv);
        return {
          senderId: message.senderId,
          receiverId: message.receiverId,
          message: decryptedMessage,
          media: message.media,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        };
      }),
      createdAt: existingConversation.createdAt,
      updatedAt: existingConversation.updatedAt
    };

    console.log('Decrypted Conversation:', decryptedConversation);

    return res.status(200).json({ dm: decryptedConversation });
  } catch (err) {
    console.log(err);
  }
}

export function decryptMessage(
  encryptedMessage: string,
  iv: string
): string | undefined {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key),
    Buffer.from(iv, 'hex')
  );

  let decryptedMessage = decipher.update(encryptedMessage, 'hex', 'utf-8');
  decryptedMessage += decipher.final('utf-8');

  return decryptedMessage;
}
