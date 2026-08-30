import { useAuth } from '../lib/auth-context';
import { BrandModal } from './BrandModal';

/** Fires once per session, right after signUp/first Apple sign-in. */
export function WelcomeModal() {
  const { user, justRegistered, clearJustRegistered } = useAuth();

  return (
    <BrandModal
      visible={justRegistered}
      title={`Xoş gəldiniz, ${user?.name?.split(' ')[0] ?? ''}! 👋`}
      body="Hesabınız yaradıldı. Barkodu skan edərək məhsulun halal statusunu dərhal görə bilərsiniz."
      ctaLabel="Başlayaq"
      onCta={clearJustRegistered}
      onClose={clearJustRegistered}
    />
  );
}
