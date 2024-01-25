import crypto from 'crypto';
import { connectMongoDB, key } from '@lib/mongo/mongodb';
import { DM } from '@lib/models/dm';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { message, senderId, receiverId } = req.body;
  try {
    await connectMongoDB('user-messages');

    const { encryptedMessage, iv } = encryptMessage(message);

    console.log('Unencrypted Message:', message);
    console.log('Encrypted Message:', encryptedMessage);

    const existingConversation = await DM.findOne({
      users: { $all: [senderId, receiverId] }
    });

    if (!existingConversation) {
      DM.create({
        users: [senderId, receiverId],
        messages: [
          {
            message: encryptedMessage,
            senderId,
            receiverId: receiverId,
            iv
          }
        ]
      });

      return res.status(200).json({ message: 'Created Conversation' });
    }

    await DM.updateOne(
      { _id: existingConversation._id },
      {
        $addToSet: {
          messages: {
            senderId,
            receiverId: receiverId,
            message: encryptedMessage,
            iv
          }
        }
      }
    );

    return res.status(200).json({ message: 'Updated Conversation' });
  } catch (err) {
    console.log(err);
  }
}

export function encryptMessage(message: string): {
  encryptedMessage: string;
  iv: string;
} {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encryptedMessage = cipher.update(message, 'utf-8', 'hex');
  encryptedMessage += cipher.final('hex');

  return { encryptedMessage, iv: iv.toString('hex') };
}
