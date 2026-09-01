import { useEffect, useState } from 'react';
import { checkForNewVersion, markVersionSeen, AppVersionInfo } from '../lib/whatsNew';
import { useLanguage } from '../lib/i18n-context';
import { BrandModal } from './BrandModal';

export function WhatsNewModal() {
  const { t } = useLanguage();
  const [info, setInfo] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    let active = true;
    checkForNewVersion().then((found) => {
      if (active && found) setInfo(found);
    });
    return () => {
      active = false;
    };
  }, []);

  const dismiss = async () => {
    if (info) await markVersionSeen(info.version);
    setInfo(null);
  };

  return (
    <BrandModal
      visible={!!info}
      title={info ? `${t('whatsNewTitle')} ${info.version}` : ''}
      body={info?.releaseNotes ?? ''}
      onClose={dismiss}
    />
  );
}
