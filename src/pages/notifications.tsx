import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { doc, getDoc, orderBy, query } from 'firebase/firestore';
import { useAuth } from '@lib/context/auth-context';
import { useCollection } from '@lib/hooks/useCollection';
import {
  userNotificationsCollection,
  usersCollection
} from '@lib/firebase/collections';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { StatsEmpty } from '@components/tweet/stats-empty';
import { Button } from '@components/ui/button';
import { ToolTip } from '@components/ui/tooltip';
import { HeroIcon } from '@components/ui/hero-icon';
import { Loading } from '@components/ui/loading';
import type { ReactElement, ReactNode } from 'react';
import { User } from '@lib/types/user';
import { UserNotification } from '@lib/types/notification';
import Link from 'next/link';
import { UserAvatar } from '@components/user/user-avatar';
import { isPlural, sleep } from '@lib/utils';

type NotificationWithUsers = Omit<UserNotification, 'user' | 'users'> & {
  usersData: User[];
};

export default function Bookmarks(): JSX.Element {
  const { user } = useAuth();

  const userId = user?.id as string;

  const [notifications, setNotifications] = useState<NotificationWithUsers[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const { data: notificationsRef, loading: notificationsRefLoading } =
    useCollection(
      query(userNotificationsCollection(userId), orderBy('createdAt', 'desc')),
      { allowNull: true }
    );

  useEffect(() => {
    async function getUsers() {
      if (
        !notificationsRef ||
        notificationsRef?.length <= 0 ||
        notificationsRefLoading
      ) {
        setLoading(false);
        return;
      }

      const usersArr: NotificationWithUsers[] = [];

      await Promise.all(
        notificationsRef.map(async (noti) => {
          const { id, type, tweet, createdAt } = noti;

          const ids =
            noti.type !== 'reply' ? noti.users.map((id) => id) : [noti.user];

          const users: User[] = [];

          await Promise.all(
            ids.map(async (id) => {
              const usersRef = await getDoc(doc(usersCollection, id));

              if (!usersRef.exists()) {
                //console.log("user doesn't exist", id);
                return;
              }

              const user = usersRef.data() as User;

              if (noti.id === 'FlWLjNJsV5vnwQvDeE3t') {
                console.log('user', user);
              }

              users.push(user);
            })
          );

          const notification: NotificationWithUsers = {
            id,
            type,
            usersData: users,
            tweet,
            createdAt
          };

          usersArr.push(notification);

          if (noti.id === 'FlWLjNJsV5vnwQvDeE3t') {
            console.log('users', users);
          }
        })
      );

      setNotifications(usersArr);
      setLoading(false);
    }

    getUsers();
  }, [notificationsRef]);

  const determineMessage = (
    type: 'like' | 'retweet' | 'reply',
    username: string,
    userLength: number = 0
  ): string => {
    if (type === 'like') {
      if (userLength > 1) {
        return `Your Tweet was liked by ${username} and ${
          userLength - 1
        } other${isPlural(userLength - 1)}.`;
      }

      return `Your Tweet was liked by ${username}.`;
    }

    return 'New notification.';
  };

  return (
    <MainContainer>
      <SEO title='Bookmarks / Twitter' />

      <MainHeader className='flex items-center justify-between'>
        <div className='-mb-1 flex flex-col'>
          <h2 className='-mt-1 text-xl font-bold'>Notifications</h2>
        </div>
        <Button
          className='dark-bg-tab group relative p-2 hover:bg-light-primary/10
                     active:bg-light-primary/20 dark:hover:bg-dark-primary/10 
                     dark:active:bg-dark-primary/20'
          onClick={undefined}
        >
          <HeroIcon className='h-5 w-5' iconName='ArchiveBoxXMarkIcon' />
          <ToolTip
            className='!-translate-x-20 translate-y-3 md:-translate-x-1/2'
            tip='Clear bookmarks'
          />
        </Button>
      </MainHeader>
      <section className='mt-0.5'>
        {notificationsRefLoading || loading ? (
          <Loading className='mt-5' />
        ) : notifications.length <= 0 || !notificationsRef ? (
          <StatsEmpty
            title='No notifications'
            description='Your notifications will show up here when you get some.'
            imageData={{ src: '/assets/no-bookmarks.png', alt: 'No bookmarks' }}
          />
        ) : (
          <AnimatePresence mode='popLayout'>
            {notifications.map((noti) => (
              <>
                {noti !== null && noti !== undefined && (
                  <Link href={`/tweet/${noti.tweet}`}>
                    <a className='hover-card hover-animation flex w-full flex-row items-center gap-3 py-2 px-5'>
                      <HeroIcon
                        iconName='BellIcon'
                        className='h-8 w-8 self-start text-main-accent'
                        solid
                      />

                      <div className='flex flex-col gap-3'>
                        <UserAvatar
                          src={
                            noti.usersData[noti.usersData.length - 1].photoURL
                          }
                          alt={
                            noti.usersData[noti.usersData.length - 1].photoURL
                          }
                          username={
                            noti.usersData[noti.usersData.length - 1].username
                          }
                          size={35}
                        />

                        <p>
                          {determineMessage(
                            noti.type,
                            noti.usersData[noti.usersData.length - 1].username,
                            noti.usersData.length
                          )}
                        </p>
                      </div>
                    </a>
                  </Link>
                )}
              </>
            ))}
          </AnimatePresence>
        )}
      </section>
    </MainContainer>
  );
}

Bookmarks.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
