import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, House } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { RequestDetailModal } from '@/features/inspection-requests/components/RequestDetailModal';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeBankId, setActiveBankId } = useWorkspace();

  const bankIdFromUrl = searchParams.get('bankId');

  // If a specific bankId was provided in query params and differs from activeBankId, sync it
  useEffect(() => {
    if (bankIdFromUrl && bankIdFromUrl !== activeBankId) {
      setActiveBankId(bankIdFromUrl);
    }
  }, [bankIdFromUrl, activeBankId, setActiveBankId]);

  const effectiveBankId = bankIdFromUrl || activeBankId;

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-medium text-ink-mute">
          No inspection request ID specified.
        </p>
        <Button className="mt-4" onClick={() => navigate('/requests')}>
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Inspection Pipeline
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 animate-in fade-in-0 duration-200">
      {/* Top Breadcrumb & Popout Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-white px-5 py-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-ink-mute hover:text-ink transition-colors cursor-pointer"
          >
            <House className="size-3.5" />
            <span>Dashboard</span>
          </button>
          <span className="text-ink-mute/50">/</span>
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="text-ink-mute hover:text-ink transition-colors cursor-pointer"
          >
            Inspection Requests
          </button>
          <span className="text-ink-mute/50">/</span>
          <span className="font-mono font-semibold text-ink">{id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/requests')}
            className="h-8 px-2.5 text-xs text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="mr-1.5 size-3.5" />
            <span>All Requests</span>
          </Button>
        </div>
      </div>

      {/* Main Request Workspace (Dedicated Full-Page Mode) */}
      <RequestDetailModal
        requestId={id}
        bankId={effectiveBankId || undefined}
        mode="fullpage"
        onClose={() => navigate('/requests')}
      />
    </div>
  );
}
