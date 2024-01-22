import { HeroIcon } from '@components/ui/hero-icon';
import { useAuth } from '@lib/context/auth-context';

type SignedOutModalProps = {
  closeModal: () => void;
};

export function SignedOutModal({
  closeModal
}: SignedOutModalProps): JSX.Element {
  const { signInWithGoogle } = useAuth();

  const handleClick = () => {
    signInWithGoogle();
    closeModal();
  };

  return (
    <div className='relative flex flex-col gap-6'>
      <p className='w-full text-center text-xl font-bold'>Log in</p>

      <p className='text-center'>You need to be signed in to do this action.</p>

      <button
        className='absolute right-0 top-0 transition-opacity duration-500 hover:opacity-50'
        onClick={closeModal}
      >
        <HeroIcon iconName='XMarkIcon' />
      </button>

      <button
        className='accent-tab rounded-full bg-main-accent p-2 text-lg
                       font-bold text-white outline-none transition hover:brightness-90 active:brightness-75
                       xs:static xs:translate-y-0 xs:hover:bg-main-accent/90 xs:active:bg-main-accent/75'
        onClick={handleClick}
      >
        Log in
      </button>
    </div>
  );
}
