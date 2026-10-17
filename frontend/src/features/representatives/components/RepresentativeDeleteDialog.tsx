import { Trash, Warning, CircleNotch, X } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { deleteRepresentative, type Representative } from '../api';

interface RepresentativeDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  representative: Representative | null;
}

export function RepresentativeDeleteDialog({
  isOpen,
  onClose,
  representative,
}: RepresentativeDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRepresentative(id),
    onSuccess: () => {
      toast.success(
        `Representative "${representative?.name}" (${representative?.representativeId}) deleted`,
      );
      queryClient.invalidateQueries({ queryKey: ['representatives'] });
      onClose();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete representative'));
    },
  });

  if (!isOpen || !representative) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-hairline overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Warning className="size-6" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-ink">
                Delete Representative?
              </h3>
              <p className="text-xs text-ink-mute mt-1.5 leading-relaxed">
                Are you sure you want to delete representative{' '}
                <strong className="text-ink font-semibold">
                  {representative.name}
                </strong>{' '}
                (<span className="font-mono">{representative.representativeId}</span>)?
              </p>
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 leading-normal">
                This record will be permanently removed. If this agent is temporarily away or taking leave, you can toggle their status to <strong>Inactive</strong> instead.
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1 text-ink-mute hover:bg-paper hover:text-ink transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-hairline">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => deleteMutation.mutate(representative.id)}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              {deleteMutation.isPending ? (
                <>
                  <CircleNotch className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="size-4" />
                  Delete Representative
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
