import type { DMs } from '@lib/types/dm';
import type { MediaData } from '@lib/types/file';

export async function sendMessage(
  senderId: string,
  receiverId: string,
  message: string,
  media?: MediaData[]
): Promise<void> {
  if (senderId === receiverId) return;
  try {
    const response = await fetch('/api/v1/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, media, senderId, receiverId })
    });
  } catch (err) {
    console.log(err);
  }
}

export async function getDM(users: string[]): Promise<void> {
  try {
    const response = await fetch('/api/v1/get-dm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ users })
    });
  } catch (err) {
    console.log(err);
  }
}

export async function getDMs(userId: string): Promise<DMs> {
  try {
    const response = await fetch('/api/v1/get-dms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    const dms = (await response.json()).dm as DMs;

    return dms;
  } catch (err) {
    console.log(err);
  }

  return [];
}
