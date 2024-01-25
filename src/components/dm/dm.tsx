import cn from 'clsx';
import { CustomIcon } from '@components/ui/custom-icon';
import { useAuth } from '@lib/context/auth-context';
import { getDMs, sendMessage } from '@lib/mongo/utils';
import { useEffect, useState } from 'react';
import { getUser } from '@lib/firebase/utils';
import { UserAvatar } from '@components/user/user-avatar';
import { UserUsername } from '@components/user/user-username';
import { UserName } from '@components/user/user-name';
import { Loading } from '@components/ui/loading';
import { MainHeader } from '@components/home/main-header';
import type { ChangeEvent } from 'react';
import type { User } from '@lib/types/user';
import type { DM, DMs } from '@lib/types/dm';

//type DMWithUser = User & DM;

export function DM(): JSX.Element {
  const { user } = useAuth();

  const [Dms, setDms] = useState<DMs | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<(User | null)[]>([]);
  const [chosenDM, setChosenDM] = useState(0);
  const [page, setPage] = useState(0);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (loading) return;

    setLoading(true);

    async function getUserDMs() {
      if (!user) return;

      const dms = await getDMs(user.id);

      setDms(dms);

      const userIds = dms?.flatMap((dm) => dm.users) ?? [];

      // Remove the current user's ID
      const filteredUserIds = userIds.filter((userId) => userId !== user.id);

      // Extract user IDs from the filteredf ids
      const flatUserIds = filteredUserIds
        .map((targetIds) => targetIds)
        .filter(Boolean);

      const usersData = await Promise.all(
        flatUserIds.map(async (userId) => {
          console.log(userId);
          const userSnapshot = await getUser(userId);
          return userSnapshot;
        })
      );

      setUsers(usersData);
    }

    getUserDMs();

    setLoading(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // For whatever reason, user needs to be a dependency

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!user) return;

    if (!users[chosenDM]) return;

    sendMessage(user.id, users[chosenDM]?.id as string, inputValue.trim());
    getDMs(user.id);
    setInputValue('');
  };

  function DMHeader(): JSX.Element {
    return (
      <div
        className='flex h-full min-h-[3.5rem] w-full cursor-pointer flex-row items-center gap-0 px-4'
        onClick={() =>
          page === 0 ? setOpen(!open) : !open ? setOpen(!open) : undefined
        }
      >
        <MainHeader
          action={() => {
            setPage(0);
          }}
          useActionButton={page !== 0}
        >
          <div>
            <p className='text-xl font-bold'>
              {page === 0 ? 'Messages' : users?.[chosenDM]?.name}
            </p>
            {page === 1 && (
              <UserUsername username={users[chosenDM]?.username as string} />
            )}
          </div>
        </MainHeader>

        <CustomIcon
          className='hover-animation ml-auto h-9 w-9 rounded-full p-2 hover:bg-white/10'
          iconName='EnvelopePlusIcon'
        />
        <button onClick={() => setOpen(!open)}>
          <CustomIcon
            className={cn(
              'hover-animation mr-1 h-9 w-9 rounded-full p-2 hover:bg-white/10',
              open && 'rotate-180'
            )}
            iconName='DoubleUpArrowIcon'
          />
        </button>
      </div>
    );
  }

  if (!user) return <></>;

  return (
    <div className='menu-container fixed bottom-0 right-5 flex w-[25rem] flex-col items-center rounded-t-2xl rounded-b-none bg-black'>
      <DMHeader />

      <div
        className={cn(
          'h-[30rem] w-full transition-all duration-300',
          !open && 'h-[0rem] opacity-0'
        )}
      >
        {loading ? (
          <Loading />
        ) : Dms?.length === 0 || Dms == null || Dms === undefined ? (
          <p>Empty</p>
        ) : (
          <>
            {Dms?.map((dm, index) => (
              <>
                {users[index] && page !== 1 && (
                  <button
                    key={index}
                    className='hover-animation flex w-full flex-row items-center gap-3 p-4 hover:bg-[#16181C]'
                    onClick={() => {
                      setChosenDM(index);
                      setPage(1);
                    }}
                  >
                    <UserAvatar
                      src={users[index]?.photoURL ?? ' '}
                      username={users[index]?.username}
                      alt='s'
                    />

                    <div className='flex flex-col'>
                      <div className='flex flex-row items-center gap-2'>
                        <UserName
                          name={users[index]?.name as string}
                          verified={users[index]?.verified as boolean}
                        />
                        <UserUsername
                          username={users[index]?.username as string}
                        />
                      </div>

                      <p className='max-w-[70%] self-start overflow-hidden text-ellipsis whitespace-nowrap text-light-secondary dark:text-dark-secondary'>
                        {dm.messages[dm.messages.length - 1].message}
                      </p>
                    </div>
                  </button>
                )}
              </>
            ))}
          </>
        )}

        {page === 1 && (
          <div className='relative flex h-full w-full flex-col gap-3 overflow-y-auto px-4'>
            {Dms?.[chosenDM].messages.map((message, index) => (
              <>
                {message.receiverId === user.id ? (
                  <div className='z-1 relative mr-auto flex min-w-[3rem] max-w-[18rem] flex-row items-center gap-3 rounded-3xl bg-dark-secondary p-3'>
                    <p
                      className='mr-auto flex w-full max-w-[30rem] items-center justify-center'
                      key={index}
                    >
                      {message.message}
                    </p>
                  </div>
                ) : (
                  <div className='relative ml-auto flex min-w-[3rem] max-w-[18rem] flex-row items-center gap-3 rounded-3xl bg-main-accent p-3'>
                    <p
                      className='ml-auto flex w-full max-w-[30rem] items-center justify-center'
                      key={index}
                    >
                      {message.message}
                    </p>
                  </div>
                )}
              </>
            ))}

            <div id="don't mind me" className='mt-20' />

            <div className='absolute bottom-2 left-0 mt-96 h-12 w-10'>
              <div className='fixed w-[25rem] border-t border-dark-border bg-black py-2 px-4'>
                <div className='flex flex-row items-center rounded-2xl bg-[#202327] px-5'>
                  <input
                    className='h-10 w-full rounded-2xl bg-inherit outline-none'
                    placeholder='Start a new message'
                    type='text'
                    value={inputValue}
                    onChange={handleChange}
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={inputValue === ''}
                  >
                    <CustomIcon
                      className={cn(
                        'h-6 w-6 text-main-accent',
                        inputValue === '' && 'opacity-50'
                      )}
                      iconName='SendMessageIcon'
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
