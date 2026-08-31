import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/i18n-context';
import { BrandModal } from './BrandModal';

/** Fires once per session, right after signUp/first Apple sign-in. */
export function WelcomeModal() {
  const { user, justRegistered, clearJustRegistered } = useAuth();
  const { t } = useLanguage();

  return (
    <BrandModal
      visible={justRegistered}
      title={`${t('welcomeModalTitle')} ${user?.name?.split(' ')[0] ?? ''}! 👋`}
      body={t('welcomeModalBody')}
      ctaLabel={t('welcomeModalCta')}
      onCta={clearJustRegistered}
      onClose={clearJustRegistered}
    />
  );
}
