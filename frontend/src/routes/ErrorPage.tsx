import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorView } from '@/components/errors/ErrorView';

interface ErrorPageProps {
  status?: number;
  title?: string;
  message?: string;
  standalone?: boolean;
  onRetry?: () => void;
  onSignIn?: () => void;
}

export function ErrorPage({
  status: defaultStatus = 404,
  title: defaultTitle,
  message: defaultMessage,
  standalone = false,
  onRetry,
  onSignIn,
}: ErrorPageProps) {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const codeParam = searchParams.get('code');
  const status = codeParam ? parseInt(codeParam, 10) || defaultStatus : defaultStatus;
  const title = searchParams.get('title') || defaultTitle;
  const message = searchParams.get('message') || defaultMessage;

  return (
    <div
      className={`flex w-full items-center justify-center p-4 sm:p-6 lg:p-8 ${
        standalone ? 'min-h-[100dvh] bg-bone' : 'min-h-[calc(100vh-80px)]'
      }`}
    >
      <div className="w-full max-w-2xl">
        <ErrorView
          status={status}
          title={title}
          message={message}
          onRetry={onRetry}
          onSignIn={onSignIn}
          backUrl={standalone && status === 401 ? undefined : '/'}
          backLabel={
            standalone && status === 401
              ? undefined
              : t('errors.backToDashboard', 'Back to Dashboard')
          }
          showHomeButton={true}
        />
      </div>
    </div>
  );
}
