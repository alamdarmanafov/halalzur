import * as Sentry from '@sentry/react-native';

const SENTRY_DSN =
  'https://5a32aa3e0ea1bb66599fc0747dfe26af@o4512004971298816.ingest.de.sentry.io/4512004975296592';

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
  });
}

export { Sentry };
