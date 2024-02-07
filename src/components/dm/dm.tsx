import cn from 'clsx';
import { CustomIcon } from '@components/ui/custom-icon';
import { useAuth } from '@lib/context/auth-context';
import { getDMs, sendMessage } from '@lib/mongo/utils';
import { useEffect, useRef, useState } from 'react';
import { getUser, uploadImages } from '@lib/firebase/utils';
import { UserAvatar } from '@components/user/user-avatar';
import { UserUsername } from '@components/user/user-username';
import { UserName } from '@components/user/user-name';
import { Loading } from '@components/ui/loading';
import { MainHeader } from '@components/home/main-header';
import { ImagePreview } from '@components/input/image-preview';
import { getImagesData } from '@lib/validation';
import { HeroIcon } from '@components/ui/hero-icon';
import type { ChangeEvent, ClipboardEvent } from 'react';
import type { User } from '@lib/types/user';
import type { DM, DMs } from '@lib/types/dm';
import type { FilesWithId, ImagesPreview, MediaData } from '@lib/types/file';

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
  const [selectedImages, setSelectedImages] = useState<FilesWithId>([]);
  const [imagesPreview, setImagesPreview] = useState<ImagesPreview>([]);

  const previewCount = imagesPreview.length;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const onClick = (): void => inputFileRef.current?.click();

  const isButtonDisabled = (): boolean => {
    if (imagesPreview.length > 0) return false;

    if (inputValue === '') {
      return true;
    }

    return false;
  };

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

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!user) return;

    if (!users[chosenDM]) return;

    const uploadedMedia = await uploadImages(user.id, selectedImages);

    const media: MediaData[] | undefined = uploadedMedia?.map((img) => {
      return {
        src: img.src,
        alt: img.alt,
        type: img.type?.includes('video') ? 'video' : 'image'
      };
    });

    sendMessage(
      user.id,
      users[chosenDM]?.id as string,
      inputValue.trim(),
      media ?? []
    );
    getDMs(user.id);
    setInputValue('');
  };

  const handleImageUpload = (
    e: ChangeEvent<HTMLInputElement> | ClipboardEvent<HTMLTextAreaElement>
  ): void => {
    const isClipboardEvent = 'clipboardData' in e;

    if (isClipboardEvent) {
      const isPastingText = e.clipboardData.getData('text');
      if (isPastingText) return;
    }

    const files = isClipboardEvent ? e.clipboardData.files : e.target.files;

    const imagesData = getImagesData(files, {
      currentFiles: previewCount,
      allowUploadingVideos: true
    });

    if (!imagesData) {
      return;
    }

    const { imagesPreviewData, selectedImagesData } = imagesData;

    setImagesPreview([...imagesPreview, ...imagesPreviewData]);
    setSelectedImages([...selectedImages, ...selectedImagesData]);

    inputRef.current?.focus();
  };

  const removeImage = (targetId: string) => (): void => {
    setSelectedImages(selectedImages.filter(({ id }) => id !== targetId));
    setImagesPreview(imagesPreview.filter(({ id }) => id !== targetId));

    const { src } = imagesPreview.find(
      ({ id }) => id === targetId
    ) as MediaData;

    URL.revokeObjectURL(src);
  };

  const cleanImage = (): void => {
    imagesPreview.forEach(({ src }) => URL.revokeObjectURL(src));

    setSelectedImages([]);
    setImagesPreview([]);
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

  // TODO: put the chat bubbles etc into their own components
  return (
    <div className='menu-container fixed bottom-0 right-5 hidden w-[25rem] flex-col items-center rounded-t-2xl rounded-b-none bg-black lg:flex'>
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
                      alt={users[index]?.username ?? ' '}
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
                  <div className='relative mr-auto flex min-w-[3rem] max-w-[18rem] flex-row items-center gap-3'>
                    <div className='flex flex-col rounded-3xl rounded-bl-md bg-dark-secondary p-3'>
                      <p
                        className='ml-auto flex w-full max-w-[30rem] items-center justify-center'
                        key={index}
                      >
                        {message.message}
                      </p>

                      {message.media && message.media.length > 0 && (
                        <>
                          <ImagePreview
                            tweet={false}
                            viewTweet={false}
                            previewCount={message.media?.length as number}
                            imagesPreview={message.media as ImagesPreview}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='relative ml-auto flex min-w-[3rem] max-w-[18rem] flex-row gap-3'>
                    <div
                      className={cn(
                        'flex flex-col rounded-3xl rounded-br-md bg-main-accent p-3',
                        message.media && message.media.length > 0 && 'w-[18rem]'
                      )}
                    >
                      <p className='ml-auto flex w-full max-w-[30rem] text-left'>
                        {message.message}
                      </p>

                      {message.media && message.media.length > 0 && (
                        <>
                          <ImagePreview
                            tweet={false}
                            viewTweet={false}
                            previewCount={message.media?.length as number}
                            imagesPreview={message.media as ImagesPreview}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            ))}

            <div id="don't mind me" className='mt-20' />

            <div className='absolute bottom-2 left-0 mt-96 h-12 w-10'>
              <div className='fixed bottom-0 w-[25rem] border-t border-dark-border bg-black py-2 px-4'>
                <div
                  className={cn(
                    'flex flex-col  gap-4 rounded-2xl bg-[#202327] px-5',
                    imagesPreview.length > 0 && 'pt-5'
                  )}
                >
                  {imagesPreview.length > 0 && (
                    <ImagePreview
                      imagesPreview={imagesPreview}
                      previewCount={imagesPreview.length}
                    />
                  )}

                  <div className='flex w-full flex-row items-center'>
                    <input
                      className='hidden'
                      type='file'
                      accept='image/*,video/*'
                      onChange={handleImageUpload}
                      ref={inputFileRef}
                      multiple
                    />
                    <button
                      className='accent-tab accent-bg-tab group relative rounded-full p-2 
                       text-main-accent hover:bg-main-accent/10 active:bg-main-accent/20'
                      onClick={onClick}
                    >
                      <HeroIcon className='h-5 w-5' iconName='PhotoIcon' />
                    </button>

                    <textarea
                      ref={inputRef}
                      className='h-8 w-full resize-none bg-inherit outline-none'
                      placeholder='Start a new message'
                      value={inputValue}
                      onChange={handleChange}
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={isButtonDisabled()}
                    >
                      <CustomIcon
                        className={cn(
                          'h-6 w-6 text-main-accent',
                          isButtonDisabled() && 'opacity-50'
                        )}
                        iconName='SendMessageIcon'
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
