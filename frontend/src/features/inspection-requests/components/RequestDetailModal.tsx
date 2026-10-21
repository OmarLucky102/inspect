import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  CircleNotch,
  User,
  Car,
  Clock,
  ListChecks,
  UserPlus,
  ShieldCheck,
  XCircle,
  ArrowRight,
  MapPin,
  ChatCenteredText,
  IdentificationCard,
  FileText,
  CheckCircle,
  Warning,
  Check,
  ArrowLeft,
  Phone,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import {
  fetchInspectionRequestDetails,
  fetchInspectionStatusHistory,
  updateInspectionStatus,
  assignRepresentative,
  submitMediaReview,
  finalApproveInspection,
  requestPriceRevision,
  fetchInspectionReport,
  fetchVehicleLookups,
} from '../api';
import { fetchBankMembers } from '@/features/banks/api';
import { fetchRepresentatives } from '@/features/representatives/api';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import { InspectionPhotoChecklistTab } from './InspectionPhotoChecklistTab';
import {
  RepresentativeSelect,
  type RepresentativeOption,
} from './RepresentativeSelect';
import { LicensePlateBadge } from './LicensePlateInput';
import { getVehicleColorHex } from '@/lib/colors';

const DEFAULT_SIDE_MIRRORS = [
  { code: 'Manual', name: 'Manual (عادي)' },
  { code: 'Electric', name: 'Electric (كهرباء)' },
];

const DEFAULT_SUNROOF_OPTIONS = [
  { code: 'No Sunroof', name: 'No Sunroof — بدون فتحة سقف' },
  { code: 'Manual Sunroof', name: 'Manual Sunroof — فتحة سقف يدوية' },
  { code: 'Electric Sunroof', name: 'Electric Sunroof — فتحة سقف كهربائية' },
  { code: 'Panoramic Sunroof', name: 'Panoramic Sunroof — فتحة سقف بانورامية' },
  {
    code: 'Panoramic Moonroof',
    name: 'Panoramic Moonroof — فتحة سقف بانورامية زجاجية',
  },
  { code: 'Pop-up Sunroof', name: 'Pop-up Sunroof — فتحة سقف قابلة للرفع' },
  { code: 'Sliding Sunroof', name: 'Sliding Sunroof — فتحة سقف منزلقة' },
  {
    code: 'Tilt-and-Slide Sunroof',
    name: 'Tilt-and-Slide Sunroof — فتحة سقف قابلة للإمالة والانزلاق',
  },
];

const DEFAULT_TRANSMISSION_OPTIONS = [
  { id: '', name: 'Automatic', nameAr: 'أوتوماتيك' },
  { id: '', name: 'Manual', nameAr: 'عادي / مانيوال' },
];

interface RequestDetailModalProps {
  requestId: string;
  onClose?: () => void;
  mode?: 'modal' | 'fullpage';
  bankId?: string;
}

export function RequestDetailModal({
  requestId,
  onClose,
  mode = 'modal',
  bankId: explicitBankId,
}: RequestDetailModalProps) {
  const { activeBankId: contextBankId, user } = useWorkspace();
  const activeBankId = explicitBankId || contextBankId;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'vehicle' | 'inspection-checklist' | 'assignment' | 'history'
  >('overview');

  // Modals for actions
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedRepId, setSelectedRepId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [captureMode, setCaptureMode] = useState<'STANDARD' | 'ADVANCED'>(
    'STANDARD',
  );

  // Status transition modal
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');

  // Media Review Modal (Reviewer -> Propose valuation & review checklist)
  const [isMediaReviewOpen, setIsMediaReviewOpen] = useState(false);
  const [verifiedMileage, setVerifiedMileage] = useState<string>('');
  const [proposedMarketingValue, setProposedMarketingValue] =
    useState<string>('');
  const [mediaReviewNotes, setMediaReviewNotes] = useState<string>('');
  const [selectedTrimId, setSelectedTrimId] = useState<string>('');
  const [selectedTransmissionTypeId, setSelectedTransmissionTypeId] =
    useState<string>('');
  const [selectedSideMirrors, setSelectedSideMirrors] =
    useState<string>('Manual');
  const [selectedSunroof, setSelectedSunroof] = useState<string>('No Sunroof');
  const [checklistDecisions, setChecklistDecisions] = useState<
    Record<string, { decision: 'PASS' | 'FAIL' | 'RESHOOT'; notes: string }>
  >({});

  // Super Admin Price Revision Modal
  const [isPriceRevisionOpen, setIsPriceRevisionOpen] = useState(false);
  const [priceRevisionNotes, setPriceRevisionNotes] = useState<string>('');

  // Super Admin Final Approval Modal
  const [isFinalApproveOpen, setIsFinalApproveOpen] = useState(false);
  const [finalApproveNotes, setFinalApproveNotes] = useState<string>('');
  const [finalApprovedPrice, setFinalApprovedPrice] = useState<string>('');

  // Report download loading
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  // Query: Vehicle Lookups (Trims, Transmissions, Side Mirrors, Sunroofs)
  const { data: vehicleLookups } = useQuery({
    queryKey: ['vehicle-lookups'],
    queryFn: fetchVehicleLookups,
    staleTime: 5 * 60 * 1000,
  });

  // Query: Full Request Details
  const {
    data: details,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ['inspection-request-details', activeBankId, requestId],
    queryFn: () => fetchInspectionRequestDetails(activeBankId!, requestId),
    enabled: !!activeBankId && !!requestId,
  });

  // Query: Status History
  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['inspection-request-history', activeBankId, requestId],
    queryFn: () => fetchInspectionStatusHistory(activeBankId!, requestId),
    enabled: !!activeBankId && !!requestId,
  });

  // Query: All Registered Representatives from Representatives module
  const { data: registeredReps = [], isLoading: isLoadingReps } = useQuery({
    queryKey: ['representatives', 'active'],
    queryFn: () => fetchRepresentatives({ isActive: true }),
    enabled: isAssigning,
  });

  // Query: Bank Members for assignment fallback
  const { data: bankMembers = [] } = useQuery({
    queryKey: ['bank-members', activeBankId],
    queryFn: () => fetchBankMembers(activeBankId!),
    enabled: !!activeBankId && isAssigning,
  });

  // Combine representatives from registered database table and any bank members
  const representativeOptions = useMemo<RepresentativeOption[]>(() => {
    const list: RepresentativeOption[] = [];
    const seenIds = new Set<string>();

    // 1. Registered representatives from the database
    for (const r of registeredReps) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        const loc =
          r.locationName ||
          r.branchName ||
          (r.governorate?.name
            ? `${r.governorate.name}${r.city?.name ? ` - ${r.city.name}` : ''}`
            : undefined);

        list.push({
          id: r.id,
          name: r.name,
          code: r.representativeId,
          location: loc || undefined,
          phone: r.phone || undefined,
          email: r.email || undefined,
          source: 'REGISTERED',
        });
      }
      if (r.userId && !seenIds.has(r.userId)) {
        seenIds.add(r.userId);
      }
    }

    // 2. Bank members with role REPRESENTATIVE (if not already listed)
    for (const m of bankMembers) {
      if (m.role === 'REPRESENTATIVE' && !seenIds.has(m.id)) {
        seenIds.add(m.id);
        list.push({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`.trim(),
          code: `USR-${m.id.slice(0, 6).toUpperCase()}`,
          location: undefined,
          phone: m.phone || undefined,
          email: m.email || undefined,
          source: 'USER',
        });
      }
    }

    return list;
  }, [registeredReps, bankMembers]);

  const selectedRepresentative = useMemo(
    () => representativeOptions.find((r) => r.id === selectedRepId),
    [representativeOptions, selectedRepId],
  );

  // Mutation: Assign Representative
  const assignMutation = useMutation({
    mutationFn: (payload: {
      representativeId: string;
      notes?: string;
      captureMode: 'STANDARD' | 'ADVANCED';
    }) => assignRepresentative(activeBankId!, requestId, payload),
    onSuccess: () => {
      toast.success('Representative assigned successfully');
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', activeBankId, requestId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-history', activeBankId, requestId],
      });
      setIsAssigning(false);
      setSelectedRepId('');
      setAssignNotes('');
      setCaptureMode('STANDARD');
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to assign representative')),
  });

  // Mutation: Update Status
  const statusMutation = useMutation({
    mutationFn: (payload: { status: string; note?: string }) =>
      updateInspectionStatus(activeBankId!, requestId, payload),
    onSuccess: (_, vars) => {
      toast.success(`Request status updated to ${vars.status}`);
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', activeBankId, requestId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-history', activeBankId, requestId],
      });
      setStatusAction(null);
      setStatusNote('');
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to update request status')),
  });

  // Mutation: Submit Media Review
  const mediaReviewMutation = useMutation({
    mutationFn: (payload: {
      verifiedMileage: number;
      proposedMarketingValue: number;
      trimId?: string;
      transmissionTypeId?: string;
      sideMirrors?: string;
      sunroofSpecification?: string;
      notes?: string;
      checklistItems?: Array<{
        checklistItemId: string;
        decision: 'PASS' | 'FAIL' | 'RESHOOT';
        notes?: string;
      }>;
    }) => submitMediaReview(activeBankId!, requestId, payload),
    onSuccess: (data) => {
      toast.success(
        `Review submitted! Proposed market value: EGP ${data.latestMarketingDecision?.estimatedValue.toLocaleString() || ''} — Awaiting Super Admin final approval.`,
      );
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', activeBankId, requestId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-history', activeBankId, requestId],
      });
      setIsMediaReviewOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to submit media review')),
  });

  // Mutation: Final Approve (Super Admin)
  const finalApproveMutation = useMutation({
    mutationFn: (payload?: {
      approvedMarketingValue?: number;
      notes?: string;
    }) => finalApproveInspection(activeBankId!, requestId, payload),
    onSuccess: () => {
      toast.success(
        'Inspection officially approved! Final report is now unlocked and available for download.',
      );
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', activeBankId, requestId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-history', activeBankId, requestId],
      });
      setIsFinalApproveOpen(false);
      setFinalApproveNotes('');
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to approve inspection')),
  });

  // Mutation: Price Revision (Super Admin)
  const priceRevisionMutation = useMutation({
    mutationFn: (revisionNotes: string) =>
      requestPriceRevision(activeBankId!, requestId, revisionNotes),
    onSuccess: () => {
      toast.success(
        'Price revision requested. Inspection returned to Reviewer for valuation update.',
      );
      void queryClient.invalidateQueries({
        queryKey: ['inspection-requests', activeBankId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-details', activeBankId, requestId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['inspection-request-history', activeBankId, requestId],
      });
      setIsPriceRevisionOpen(false);
      setPriceRevisionNotes('');
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to request price revision')),
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepId) {
      toast.error('Please select a representative');
      return;
    }
    assignMutation.mutate({
      representativeId: selectedRepId,
      notes: assignNotes.trim() || undefined,
      captureMode,
    });
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusAction) return;
    if (statusAction === 'REJECTED' && !statusNote.trim()) {
      toast.error('A rejection reason is required');
      return;
    }
    if (
      statusAction === 'IN_PROGRESS' &&
      details?.currentStatus === 'UNDER_REVIEW' &&
      !statusNote.trim()
    ) {
      toast.error('A reshoot explanation note is required');
      return;
    }
    statusMutation.mutate({
      status: statusAction,
      note: statusNote.trim() || undefined,
    });
  };

  const handleOpenMediaReview = () => {
    setVerifiedMileage(
      details?.vehicle?.mileage != null ? String(details.vehicle.mileage) : '',
    );
    setProposedMarketingValue(
      details?.latestMarketingDecision?.estimatedValue != null
        ? String(details.latestMarketingDecision.estimatedValue)
        : '',
    );
    setMediaReviewNotes(details?.latestMarketingDecision?.notes || '');
    setSelectedTrimId(
      details?.vehicle?.trim?.id || details?.originalTrim?.id || '',
    );
    setSelectedTransmissionTypeId(details?.vehicle?.transmissionType?.id || '');
    setSelectedSideMirrors(details?.vehicle?.sideMirrors || 'Manual');
    setSelectedSunroof(details?.vehicle?.sunroofSpecification || 'No Sunroof');
    const initialDecisions: Record<
      string,
      { decision: 'PASS' | 'FAIL' | 'RESHOOT'; notes: string }
    > = {};
    if (details?.checklistItems) {
      for (const item of details.checklistItems) {
        initialDecisions[item.checklistItemId] = {
          decision: (item.reviewDecision as any) || 'PASS',
          notes: item.reviewNotes || '',
        };
      }
    }
    setChecklistDecisions(initialDecisions);
    setIsMediaReviewOpen(true);
  };

  const handleMediaReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mileageNum = parseInt(verifiedMileage, 10);
    const valNum = parseFloat(proposedMarketingValue);

    if (isNaN(mileageNum) || mileageNum < 0) {
      toast.error('Please enter a valid verified mileage in kilometers (KM)');
      return;
    }
    if (isNaN(valNum) || valNum <= 0) {
      toast.error('Please enter a valid proposed marketing value in EGP');
      return;
    }

    const itemsPayload = Object.entries(checklistDecisions).map(
      ([checklistItemId, item]) => ({
        checklistItemId,
        decision: item.decision,
        notes: item.notes.trim() || undefined,
      }),
    );

    mediaReviewMutation.mutate({
      verifiedMileage: mileageNum,
      proposedMarketingValue: valNum,
      trimId: selectedTrimId || undefined,
      transmissionTypeId: selectedTransmissionTypeId || undefined,
      sideMirrors: selectedSideMirrors || undefined,
      sunroofSpecification: selectedSunroof || undefined,
      notes: mediaReviewNotes.trim() || undefined,
      checklistItems: itemsPayload.length > 0 ? itemsPayload : undefined,
    });
  };

  const handleOpenFinalApprove = () => {
    setFinalApprovedPrice(
      details?.latestMarketingDecision?.estimatedValue != null
        ? String(details.latestMarketingDecision.estimatedValue)
        : '',
    );
    setFinalApproveNotes('');
    setIsFinalApproveOpen(true);
  };

  const handleFinalApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const approvedValNum = parseFloat(finalApprovedPrice);
    if (finalApprovedPrice && (isNaN(approvedValNum) || approvedValNum <= 0)) {
      toast.error('Please enter a valid authorized marketing value in EGP');
      return;
    }
    finalApproveMutation.mutate({
      approvedMarketingValue:
        !isNaN(approvedValNum) && approvedValNum > 0
          ? approvedValNum
          : undefined,
      notes: finalApproveNotes.trim() || undefined,
    });
  };

  const handlePriceRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceRevisionNotes.trim()) {
      toast.error('Please specify revision instructions for the reviewer');
      return;
    }
    priceRevisionMutation.mutate(priceRevisionNotes.trim());
  };

  const handleDownloadReport = async () => {
    try {
      setIsDownloadingReport(true);
      const report = await fetchInspectionReport(activeBankId!, requestId);
      const reportData = report?.data ?? report;
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EuroInspect-360-Report-${details?.requestNumber || requestId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Inspection report downloaded successfully');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to download report'));
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-amber-800">
          <Clock className="size-3.5 text-amber-700" />
          AWAITING APPROVAL
        </span>
      );
    }
    const styles: Record<string, string> = {
      DRAFT: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      PENDING: 'bg-amber-500/10 text-amber-800 border-amber-300',
      PENDING_ASSIGNMENT: 'bg-blue-500/10 text-blue-800 border-blue-300',
      ASSIGNED: 'bg-sky-500/10 text-sky-800 border-sky-300',
      IN_PROGRESS: 'bg-indigo-500/10 text-indigo-800 border-indigo-300',
      UNDER_REVIEW: 'bg-purple-500/10 text-purple-800 border-purple-300',
      APPROVED: 'bg-emerald-500/10 text-emerald-800 border-emerald-300',
      REJECTED: 'bg-rose-500/10 text-rose-800 border-rose-300',
      CANCELLED: 'bg-zinc-200 text-zinc-600 border-zinc-300',
    };
    return (
      <span
        className={`inline-flex items-center rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider ${
          styles[status] || 'bg-bone text-ink-soft border-hairline'
        }`}
      >
        {status}
      </span>
    );
  };

  // Calculate allowable status actions according to EuroInspect 360 rules
  const isSuperAdmin =
    user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';
  const isReviewer = user?.role === 'REVIEWER';
  const isRep = user?.role === 'REPRESENTATIVE';
  const canAssign = isSuperAdmin || isReviewer;

  const availableActions: Array<{
    status?: string;
    label: string;
    variant?: 'primary' | 'outline';
    action?: () => void;
  }> = [];

  if (details) {
    const cur = details.currentStatus;

    if (cur === 'PENDING') {
      // Reviewer Initial Review (Stage 2)
      if (isReviewer || isSuperAdmin) {
        availableActions.push({
          status: 'PENDING_ASSIGNMENT',
          label: 'Initial Approve',
          variant: 'primary',
        });
        availableActions.push({
          status: 'REJECTED',
          label: 'Reject Request',
          variant: 'outline',
        });
      }
      if (isSuperAdmin) {
        availableActions.push({
          status: 'CANCELLED',
          label: 'Cancel Request',
          variant: 'outline',
        });
      }
    } else if (cur === 'REJECTED') {
      // Bank Admin / Member can resubmit rejected requests
      if (!isReviewer && !isRep) {
        availableActions.push({
          status: 'PENDING',
          label: 'Resubmit Request',
          variant: 'primary',
        });
      }
    } else if (cur === 'PENDING_ASSIGNMENT') {
      // EuroInspect Reviewer, Super Admin, or System Admin can assign a representative
      // Bank members and bank admins are strictly prohibited from assigning representatives
      if (canAssign) {
        availableActions.push({
          label: 'Assign Representative',
          variant: 'primary',
          action: () => setIsAssigning(true),
        });
      }
      if (isSuperAdmin) {
        availableActions.push({
          status: 'CANCELLED',
          label: 'Cancel Request',
          variant: 'outline',
        });
      }
    } else if (cur === 'ASSIGNED') {
      // Representative starts on-site inspection
      if (isRep || isSuperAdmin) {
        availableActions.push({
          status: 'IN_PROGRESS',
          label: 'Start Inspection',
          variant: 'primary',
        });
      }
      if (canAssign) {
        availableActions.push({
          label: 'Reassign Representative',
          variant: 'outline',
          action: () => setIsAssigning(true),
        });
      }
      if (isSuperAdmin) {
        availableActions.push({
          status: 'CANCELLED',
          label: 'Cancel Request',
          variant: 'outline',
        });
      }
    } else if (cur === 'IN_PROGRESS') {
      // Representative completes capture and submits for media review
      if (isRep || isSuperAdmin) {
        availableActions.push({
          status: 'UNDER_REVIEW',
          label: 'Submit for Review',
          variant: 'primary',
        });
      }
      if (isSuperAdmin) {
        availableActions.push({
          status: 'CANCELLED',
          label: 'Cancel Request',
          variant: 'outline',
        });
      }
    } else if (cur === 'UNDER_REVIEW') {
      // Reviewer verifies media, reviews checklist, and proposes marketing value
      if (isReviewer || isSuperAdmin) {
        availableActions.push({
          label: 'Complete Media Review',
          variant: 'primary',
          action: handleOpenMediaReview,
        });
        availableActions.push({
          status: 'IN_PROGRESS',
          label: 'Request Reshoot',
          variant: 'outline',
        });
      }
      if (isSuperAdmin) {
        availableActions.push({
          status: 'CANCELLED',
          label: 'Cancel Request',
          variant: 'outline',
        });
      }
    } else if (cur === 'COMPLETED') {
      // Only Super Admin can grant final approval or request price revision
      if (isSuperAdmin) {
        availableActions.push({
          label: 'Set Price & Approve',
          variant: 'primary',
          action: handleOpenFinalApprove,
        });
        availableActions.push({
          label: 'Request Price Revision',
          variant: 'outline',
          action: () => setIsPriceRevisionOpen(true),
        });
      }
    } else if (cur === 'APPROVED') {
      // Final inspection report download is available to all authorized users
      availableActions.push({
        label: isDownloadingReport ? 'Downloading…' : 'Download Report',
        variant: 'primary',
        action: handleDownloadReport,
      });
    }
  }

  // Clear informational status label for users when no actions are available to their role
  const getWorkflowStatusMessage = () => {
    if (!details) return '';
    const cur = details.currentStatus;
    if (availableActions.length > 0) {
      if (cur === 'COMPLETED' && isReviewer) {
        return 'Valuation Submitted — Awaiting Super Admin Final Approval';
      }
      if (cur === 'COMPLETED' && isSuperAdmin) {
        return 'Reviewer Valuation Proposed — Awaiting Super Admin Authorization:';
      }
      return 'Next Available Workflow Actions:';
    }
    switch (cur) {
      case 'DRAFT':
        return 'Draft Request — Complete and Submit Vehicle Intake';
      case 'PENDING':
        return 'Awaiting Reviewer Initial Approval';
      case 'PENDING_ASSIGNMENT':
        return 'Awaiting Field Representative Assignment by Super Admin';
      case 'ASSIGNED':
        return 'Representative Assigned — On-Site Field Inspection Pending';
      case 'IN_PROGRESS':
        return 'Field Inspection In Progress by Representative';
      case 'UNDER_REVIEW':
        return 'Inspection Evidence Submitted — Media Review In Progress by Reviewer';
      case 'COMPLETED':
        return 'Valuation Proposed — Awaiting Super Admin Final Approval';
      case 'APPROVED':
        return 'Inspection Officially Approved — Final Report Ready';
      case 'REJECTED':
        return 'Request Rejected by Reviewer';
      case 'CANCELLED':
        return 'Inspection Request Cancelled';
      default:
        return `Workflow Status: ${cur}`;
    }
  };

  const isFullPage = mode === 'fullpage';

  return (
    <div
      className={
        isFullPage
          ? 'w-full'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs'
      }
    >
      <div
        className={
          isFullPage
            ? 'relative flex w-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-xs'
            : 'relative flex h-[90vh] max-h-[850px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl'
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline bg-paper/30 px-6 py-4">
          <div className="flex items-center gap-3">
            {isFullPage && onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="mr-1 h-8 px-2.5 text-xs text-ink-soft hover:text-ink"
              >
                <ArrowLeft className="mr-1 size-3.5" />
                Back
              </Button>
            )}
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <FileText className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-lg font-bold text-ink">
                  {details?.requestNumber || 'Inspection Request'}
                </h3>
                {details && getStatusBadge(details.currentStatus)}
              </div>
              <p className="text-xs text-ink-mute">
                ID: {requestId} • Priority:{' '}
                <span className="font-mono font-medium text-ink">
                  {details?.priority ?? 'MEDIUM'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFullPage && onClose && (
              <button
                type="button"
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-mute hover:bg-paper hover:text-ink"
                onClick={onClose}
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        {isDetailsLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <CircleNotch className="size-8 animate-spin text-ink-mute" />
          </div>
        ) : isDetailsError || !details ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <XCircle className="mb-2 size-10 text-rose-500" />
            <p className="font-medium text-ink">
              Failed to load request details
            </p>
            <p className="mt-1 text-xs text-ink-mute">
              Make sure you have proper permissions for this bank request.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => void refetchDetails()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div
            className={
              isFullPage
                ? 'flex flex-col'
                : 'flex flex-1 flex-col overflow-hidden'
            }
          >
            {/* Quick Transition Action Ribbon */}
            <div className="flex items-center justify-between border-b border-hairline bg-accent/5 px-6 py-2.5">
              <span className="text-xs font-medium text-ink-soft">
                {getWorkflowStatusMessage()}
              </span>
              <div className="flex items-center gap-2">
                {availableActions.map((act, idx) => (
                  <Button
                    key={act.label + idx}
                    size="sm"
                    variant={act.variant ?? 'primary'}
                    className={
                      act.label === 'Assign Representative'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : undefined
                    }
                    onClick={() => {
                      if (act.action) {
                        act.action();
                      } else if (act.status) {
                        setStatusAction(act.status);
                      }
                    }}
                  >
                    <ArrowRight className="size-3.5" />
                    {act.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-hairline bg-bone px-6">
              {[
                { key: 'overview', label: 'Overview & Customer', icon: User },
                { key: 'vehicle', label: 'Vehicle Details', icon: Car },
                {
                  key: 'inspection-checklist',
                  label: `Checklist (${details.checklistItems?.length ?? 0})`,
                  icon: ListChecks,
                },
                {
                  key: 'assignment',
                  label: 'Assignment',
                  icon: ShieldCheck,
                },
                {
                  key: 'history',
                  label: `Audit History (${history.length})`,
                  icon: Clock,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-accent text-accent font-semibold'
                        : 'border-transparent text-ink-mute hover:text-ink'
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Panes */}
            <div
              className={
                isFullPage ? 'p-6 space-y-6' : 'flex-1 overflow-y-auto p-6'
              }
            >
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Valuation & Approval Summary Card */}
                  {(details.latestMarketingDecision ||
                    details.currentStatus === 'COMPLETED' ||
                    details.currentStatus === 'APPROVED' ||
                    details.currentStatus === 'UNDER_REVIEW') && (
                    <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-hairline pb-4">
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                            <ShieldCheck className="size-4" />
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-ink">
                              Market Valuation & Pricing Decision
                            </h4>
                            <p className="text-xs text-ink-mute">
                              Reviewer-verified evaluation and Super Admin
                              authorization
                            </p>
                          </div>
                        </div>
                        <div>
                          {details.currentStatus === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle className="size-3.5" />
                              Super Admin Approved
                            </span>
                          )}
                          {details.currentStatus === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              <Clock className="size-3.5" />
                              Awaiting Super Admin Approval
                            </span>
                          )}
                          {details.currentStatus === 'UNDER_REVIEW' &&
                            details.latestMarketingDecision && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-700">
                                <Warning className="size-3.5" />
                                Price Revision Requested
                              </span>
                            )}
                        </div>
                      </div>

                      {details.latestMarketingDecision ? (
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-xl bg-paper/50 p-3">
                              <p className="text-[11px] font-medium text-ink-mute">
                                Proposed Market Value
                              </p>
                              <p className="mt-1 font-mono text-xl font-bold text-ink">
                                {details.latestMarketingDecision.estimatedValue.toLocaleString()}{' '}
                                <span className="text-xs text-ink-mute font-normal">
                                  EGP
                                </span>
                              </p>
                            </div>
                            <div className="rounded-xl bg-paper/50 p-3">
                              <p className="text-[11px] font-medium text-ink-mute">
                                Verified Mileage
                              </p>
                              <p className="mt-1 font-mono text-xl font-bold text-ink">
                                {details.vehicle?.mileage != null
                                  ? details.vehicle.mileage.toLocaleString()
                                  : '—'}{' '}
                                <span className="text-xs text-ink-mute font-normal">
                                  KM
                                </span>
                              </p>
                            </div>
                            <div className="rounded-xl bg-paper/50 p-3">
                              <p className="text-[11px] font-medium text-ink-mute">
                                Reviewer
                              </p>
                              <p className="mt-1 text-sm font-semibold text-ink">
                                {details.latestMarketingDecision.reviewerName ||
                                  'EuroInspect Reviewer'}
                              </p>
                            </div>
                            <div className="rounded-xl bg-paper/50 p-3">
                              <p className="text-[11px] font-medium text-ink-mute">
                                Review Date
                              </p>
                              <p className="mt-1 font-mono text-xs text-ink">
                                {new Date(
                                  details.latestMarketingDecision.decidedAt,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {details.latestMarketingDecision.notes && (
                            <div className="rounded-lg bg-zinc-50 border border-hairline/60 p-3">
                              <p className="text-[11px] font-semibold text-ink">
                                Reviewer Valuation Notes:
                              </p>
                              <p className="mt-0.5 text-xs text-ink-soft">
                                {details.latestMarketingDecision.notes}
                              </p>
                            </div>
                          )}

                          {details.latestMarketingDecision.rejectedReason && (
                            <div className="rounded-lg bg-amber-500/10 border border-amber-300/60 p-3">
                              <p className="text-[11px] font-semibold text-amber-800">
                                Super Admin Price Revision Instructions:
                              </p>
                              <p className="mt-0.5 text-xs text-amber-700">
                                {details.latestMarketingDecision.rejectedReason}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-hairline py-6 text-center">
                          <Clock className="mx-auto size-7 text-ink-mute" />
                          <p className="mt-2 text-xs font-medium text-ink">
                            Market Valuation Pending
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-mute">
                            The assigned Reviewer will verify mileage and
                            propose the official marketing valuation during
                            Media Review.
                          </p>
                        </div>
                      )}

                      {/* Report Download or Super Admin Action Strip */}
                      {details.currentStatus === 'APPROVED' && (
                        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/5 border border-emerald-300/50 p-4">
                          <div>
                            <p className="text-xs font-semibold text-emerald-900">
                              Official Bilingual Inspection Report Ready
                            </p>
                            <p className="text-[11px] text-emerald-700">
                              Super Admin approval granted. The official
                              EuroInspect 360 inspection report is unlocked for
                              download.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleDownloadReport}
                            disabled={isDownloadingReport}
                          >
                            <FileText className="mr-1.5 size-4" />
                            {isDownloadingReport
                              ? 'Downloading…'
                              : 'Download Report'}
                          </Button>
                        </div>
                      )}

                      {details.currentStatus === 'COMPLETED' &&
                        isSuperAdmin && (
                          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-accent/5 border border-accent/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                                <ShieldCheck className="size-4 text-accent" />
                                <span>Awaiting Super Admin Decision</span>
                              </p>
                              <p className="text-[11px] text-ink-mute mt-0.5">
                                Reviewer proposed <strong className="font-mono text-ink">{details.latestMarketingDecision?.estimatedValue.toLocaleString()} EGP</strong>. You can modify this price or accept it before granting approval.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-300 text-rose-700 hover:bg-rose-50"
                                onClick={() => setIsPriceRevisionOpen(true)}
                              >
                                Request Revision
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                onClick={handleOpenFinalApprove}
                              >
                                <Check className="mr-1 size-3.5" />
                                Set Price & Approve
                              </Button>
                            </div>
                          </div>
                        )}

                      {details.currentStatus === 'COMPLETED' && isReviewer && (
                        <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-300/50 p-4 text-xs text-amber-900">
                          <div className="flex items-center gap-2 font-semibold text-amber-900">
                            <Clock className="size-4 text-amber-700" />
                            <span>Valuation Proposed — Awaiting Super Admin Final Approval</span>
                          </div>
                          <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                            Your proposed valuation of EGP{' '}
                            {details.latestMarketingDecision?.estimatedValue.toLocaleString()}{' '}
                            has been submitted. This request is not complete yet — it is currently awaiting Super Admin authorization.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Card */}
                  <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <IdentificationCard className="size-4 text-accent" />
                      Customer Information
                    </h4>
                    {details.customer ? (
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                          <p className="text-[11px] text-ink-mute">Full Name</p>
                          <p className="mt-0.5 text-sm font-medium text-ink">
                            {details.customer.fullName}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Phone</p>
                          <p className="mt-0.5 font-mono text-sm font-medium text-ink">
                            {details.customer.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Email</p>
                          <p className="mt-0.5 text-sm text-ink-soft">
                            {details.customer.email || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            National ID
                          </p>
                          <p className="mt-0.5 font-mono text-sm text-ink-soft">
                            {details.customer.nationalId || '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-ink-mute">
                        No customer details attached.
                      </p>
                    )}
                  </div>

                  {/* Location & Schedule Card */}
                  <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <MapPin className="size-4 text-accent" />
                      Location & Scheduling
                    </h4>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] text-ink-mute">Governorate</p>
                        <p className="mt-0.5 text-sm text-ink">
                          {details.location?.governorateName || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">City</p>
                        <p className="mt-0.5 text-sm text-ink">
                          {details.location?.cityName || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">
                          Full Address
                        </p>
                        <p className="mt-0.5 text-sm text-ink">
                          {details.location?.address || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">
                          Requested Date
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-ink">
                          {new Date(details.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">
                          Completion Target
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-ink">
                          {details.requestedCompletionDate
                            ? new Date(
                                details.requestedCompletionDate,
                              ).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-mute">
                          {details.currentStatus === 'APPROVED'
                            ? 'Approved At'
                            : details.currentStatus === 'COMPLETED'
                              ? 'Valuation Submitted At'
                              : 'Completed At'}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-ink">
                          {details.currentStatus === 'APPROVED' && details.completedAt
                            ? new Date(details.completedAt).toLocaleString()
                            : details.currentStatus === 'COMPLETED' &&
                                details.latestMarketingDecision?.decidedAt
                              ? new Date(
                                  details.latestMarketingDecision.decidedAt,
                                ).toLocaleString()
                              : details.completedAt
                                ? new Date(details.completedAt).toLocaleString()
                                : 'Pending final approval'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes Card */}
                  {details.notes && (
                    <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <ChatCenteredText className="size-4 text-accent" />
                        Internal Notes & Instructions
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                        {details.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VEHICLE & SPECS */}
              {activeTab === 'vehicle' && (
                <div className="space-y-6">
                  {/* Vehicle Spec Card */}
                  <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Car className="size-4 text-accent" />
                      Vehicle Specifications
                    </h4>
                    {details.vehicle ? (
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            VIN Number
                          </p>
                          <p className="mt-0.5 font-mono text-sm font-bold text-ink">
                            {details.vehicle.vin}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute mb-1">
                            License Plate
                          </p>
                          {details.vehicle.plateNumber ? (
                            <LicensePlateBadge plateNumber={details.vehicle.plateNumber} />
                          ) : (
                            <p className="mt-0.5 font-mono text-sm text-ink-mute">—</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Verified Mileage
                          </p>
                          <p className="mt-0.5 font-mono text-sm font-bold text-accent">
                            {details.vehicle.mileage != null
                              ? `${details.vehicle.mileage.toLocaleString()} KM`
                              : 'Pending verification'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Motor Number
                          </p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.engineNumber || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Calendar Number
                          </p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.calendarNumber || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Make / Brand
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-ink">
                            {details.vehicle.brand?.name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Model</p>
                          <p className="mt-0.5 text-sm font-medium text-ink">
                            {details.vehicle.model?.name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Year</p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.manufactureYear}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Color</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-ink">
                            {details.vehicle.color?.name && (
                              <span
                                className="size-3.5 shrink-0 rounded-full border border-slate-300 shadow-2xs"
                                style={{
                                  backgroundColor: getVehicleColorHex(
                                    details.vehicle.color.name,
                                    details.vehicle.color.hex,
                                  ),
                                }}
                              />
                            )}
                            <span>{details.vehicle.color?.name || '—'}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">Category</p>
                          <p className="mt-0.5 text-sm text-ink">
                            {details.vehicle.category?.name || '—'}
                          </p>
                        </div>
                        <div className="col-span-1 sm:col-span-2 rounded-xl bg-paper/60 p-3 border border-hairline space-y-1">
                          <p className="text-[11px] font-semibold text-ink">
                            Trim / Edition (الفئة / الإصدار)
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            <div>
                              <span className="text-[10px] text-ink-mute block">
                                Original (Bank):
                              </span>
                              <span className="font-medium text-ink">
                                {details.originalTrim?.name ||
                                  details.originalTrim?.code ||
                                  details.vehicle.trim?.name ||
                                  '—'}
                                {details.originalTrim?.nameAr
                                  ? ` (${details.originalTrim.nameAr})`
                                  : ''}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-ink-mute block">
                                Current (Company Decision):
                              </span>
                              <span className="font-semibold text-emerald-700">
                                {details.vehicle.trim?.name || '—'}
                                {details.vehicle.trim?.nameAr
                                  ? ` (${details.vehicle.trim.nameAr})`
                                  : ''}
                                {details.originalTrim?.id &&
                                details.vehicle.trim?.id ===
                                  details.originalTrim.id
                                  ? ' (unchanged)'
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Transmission
                          </p>
                          <p className="mt-0.5 text-sm text-ink font-medium">
                            {details.vehicle.transmissionType?.name || '—'}
                            {details.vehicle.transmissionType?.nameAr
                              ? ` (${details.vehicle.transmissionType.nameAr})`
                              : ''}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Side Mirrors
                          </p>
                          <p className="mt-0.5 text-sm text-ink font-medium">
                            {details.vehicle.sideMirrors || '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Sunroof Specification
                          </p>
                          <p className="mt-0.5 text-sm text-ink font-medium">
                            {details.vehicle.sunroofSpecification || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">CC Power</p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.engineCc
                              ? `${details.vehicle.engineCc} CC`
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Insurance Value (EGP)
                          </p>
                          <p className="mt-0.5 font-mono text-sm text-ink">
                            {details.vehicle.insuranceValue != null
                              ? `${details.vehicle.insuranceValue.toLocaleString()} EGP`
                              : '—'}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-3 border-t border-hairline pt-3">
                          <p className="text-[11px] text-ink-mute">
                            Vehicle Notes
                          </p>
                          <p className="mt-1 text-xs text-ink whitespace-pre-line">
                            {details.vehicle.specialInstructions || '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-ink-mute">
                        No vehicle information linked to this request yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: INSPECTION CHECKLIST & EVIDENCE */}
              {activeTab === 'inspection-checklist' && (
                <div className="space-y-6">
                  {/* Photo Requirement Settings */}
                  <InspectionPhotoChecklistTab
                    requestId={details.id}
                    bankId={details.bankId}
                    status={details.currentStatus}
                    initialChecklist={details.photoChecklist}
                  />

                  {/* Field Checklist Items Evidence & Review Decisions */}
                  {details.checklistItems &&
                    details.checklistItems.length > 0 && (
                      <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-hairline pb-3">
                          <div>
                            <h4 className="text-sm font-semibold text-ink">
                              Field Checklist Evidence & Decisions
                            </h4>
                            <p className="text-xs text-ink-mute">
                              Reviewer decisions (Pass / Fail / Reshoot) entered
                              during Media Review
                            </p>
                          </div>
                          <span className="font-mono text-xs text-ink-mute">
                            {
                              details.checklistItems.filter(
                                (i) => i.reviewDecision === 'PASS',
                              ).length
                            }
                            /{details.checklistItems.length} Passed
                          </span>
                        </div>

                        <div className="mt-4 divide-y divide-hairline">
                          {details.checklistItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-3"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-ink">
                                    {item.label}
                                  </span>
                                  <span className="font-mono text-[10px] text-ink-mute">
                                    [{item.code}]
                                  </span>
                                  {item.isMandatory && (
                                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                                      Required
                                    </span>
                                  )}
                                </div>
                                {item.value && (
                                  <p className="text-xs text-ink-soft">
                                    Captured:{' '}
                                    <span className="font-mono font-medium text-ink">
                                      {item.value}
                                    </span>
                                  </p>
                                )}
                                {item.reviewNotes && (
                                  <p className="text-xs text-ink-soft italic">
                                    Review Note: {item.reviewNotes}
                                  </p>
                                )}
                              </div>

                              <div>
                                {item.reviewDecision === 'PASS' && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700">
                                    <Check className="size-3" />
                                    PASS
                                  </span>
                                )}
                                {item.reviewDecision === 'FAIL' && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-rose-700">
                                    <X className="size-3" />
                                    FAIL
                                  </span>
                                )}
                                {item.reviewDecision === 'RESHOOT' && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber-700">
                                    <Warning className="size-3" />
                                    RESHOOT
                                  </span>
                                )}
                                {!item.reviewDecision && (
                                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-500">
                                    Pending Review
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* TAB 4: ASSIGNMENT */}
              {activeTab === 'assignment' && (
                <div className="space-y-6">
                  {/* Current Active Assignment */}
                  <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-hairline pb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-ink">
                          Assigned Representative
                        </h4>
                        <p className="text-xs text-ink-mute">
                          Active field inspector responsible for evaluating this
                          vehicle
                        </p>
                      </div>
                      {canAssign &&
                        details.assignedRepresentative &&
                        (details.currentStatus === 'PENDING_ASSIGNMENT' ||
                          details.currentStatus === 'ASSIGNED' ||
                          details.currentStatus === 'IN_PROGRESS') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAssigning(true)}
                            className="h-8 text-xs text-ink-soft hover:text-accent"
                          >
                            <UserPlus className="mr-1.5 size-3.5" />
                            Change Representative
                          </Button>
                        )}
                    </div>

                    {details.assignedRepresentative ? (
                      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 font-bold text-accent">
                            {details.assignedRepresentative.firstName[0]}
                            {details.assignedRepresentative.lastName[0]}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              {details.assignedRepresentative.firstName}{' '}
                              {details.assignedRepresentative.lastName}
                            </p>
                            <p className="text-xs text-ink-mute">
                              ID:{' '}
                              {details.assignedRepresentative.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Contact Email
                          </p>
                          <p className="mt-0.5 text-xs font-mono text-ink">
                            {details.assignedRepresentative.email}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Phone Number
                          </p>
                          <p className="mt-0.5 text-xs font-mono text-ink">
                            {details.assignedRepresentative.phone || '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline py-8 text-center">
                        <UserPlus className="mb-2 size-8 text-ink-mute" />
                        <p className="text-xs font-medium text-ink">
                          No representative assigned yet
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-mute max-w-sm">
                          {details.currentStatus === 'PENDING'
                            ? 'The request must first receive Reviewer Initial Approval before a representative can be assigned.'
                            : canAssign
                              ? 'Assign an eligible field representative to conduct the on-site inspection.'
                              : 'EuroInspect Super Admin will assign a field representative for this inspection.'}
                        </p>
                        {canAssign &&
                          (details.currentStatus === 'PENDING_ASSIGNMENT' ||
                            details.currentStatus === 'ASSIGNED') && (
                            <Button
                              size="sm"
                              onClick={() => setIsAssigning(true)}
                              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                              <UserPlus className="mr-1.5 size-4" />
                              Assign Field Representative
                            </Button>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Active Assignment Status Details */}
                  {details.activeAssignment && (
                    <div className="rounded-xl border border-hairline bg-white p-5 shadow-2xs">
                      <h4 className="text-sm font-semibold text-ink">
                        Assignment Lifecycle Details
                      </h4>
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                          <p className="text-[11px] text-ink-mute">Status</p>
                          <span className="mt-0.5 inline-block rounded-md bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent">
                            {details.activeAssignment.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Assigned At
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-ink">
                            {new Date(
                              details.activeAssignment.assignedAt,
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Accepted At
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-ink">
                            {details.activeAssignment.acceptedAt
                              ? new Date(
                                  details.activeAssignment.acceptedAt,
                                ).toLocaleString()
                              : 'Pending acceptance'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-mute">
                            Rejected At
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-ink">
                            {details.activeAssignment.rejectedAt
                              ? new Date(
                                  details.activeAssignment.rejectedAt,
                                ).toLocaleString()
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: AUDIT HISTORY TIMELINE */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-hairline pb-2">
                    <h4 className="text-sm font-semibold text-ink">
                      Status Change Audit Log
                    </h4>
                    <span className="font-mono text-xs text-ink-mute">
                      Total events: {history.length}
                    </span>
                  </div>

                  {isHistoryLoading ? (
                    <div className="flex justify-center py-10">
                      <CircleNotch className="size-6 animate-spin text-ink-mute" />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="py-8 text-center text-xs text-ink-mute">
                      No status transitions recorded for this request yet.
                    </p>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline">
                      {history.map((item, idx) => {
                        const changerName =
                          typeof item.changedBy === 'object' && item.changedBy
                            ? `${item.changedBy.firstName} ${item.changedBy.lastName}`
                            : String(item.changedBy);

                        const changerEmail =
                          typeof item.changedBy === 'object' && item.changedBy
                            ? item.changedBy.email
                            : null;

                        return (
                          <div key={item.id || idx} className="relative group">
                            {/* Marker */}
                            <span className="absolute -left-[27px] top-1.5 flex size-4 items-center justify-center rounded-full bg-white ring-4 ring-bone">
                              <span className="size-2 rounded-full bg-accent" />
                            </span>

                            <div className="rounded-xl border border-hairline bg-white p-4 shadow-2xs transition-shadow hover:shadow-xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {item.fromStatus ? (
                                    <>
                                      {getStatusBadge(item.fromStatus)}
                                      <ArrowRight className="size-3 text-ink-mute" />
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-mono text-ink-mute uppercase">
                                      Initial
                                    </span>
                                  )}
                                  {getStatusBadge(item.toStatus)}
                                </div>
                                <span className="font-mono text-[11px] text-ink-mute">
                                  {new Date(item.changedAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="mt-2.5 flex items-center justify-between text-xs text-ink-soft border-t border-hairline/60 pt-2">
                                <div className="flex items-center gap-1.5">
                                  <User className="size-3.5 text-ink-mute" />
                                  <span className="font-medium text-ink">
                                    {changerName}
                                  </span>
                                  {changerEmail && (
                                    <span className="text-ink-mute">
                                      ({changerEmail})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {item.note && (
                                <p className="mt-2 rounded-lg bg-paper/60 px-3 py-1.5 text-xs text-ink-soft">
                                  <span className="font-semibold text-ink">
                                    Note:{' '}
                                  </span>
                                  {item.note}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal / Page Footer */}
            <div className="flex items-center justify-between border-t border-hairline bg-paper/30 px-6 py-3">
              <span className="font-mono text-xs text-ink-mute">
                EuroInspect 360 ·{' '}
                {details?.requestNumber || 'Inspection Request'}
              </span>
              <div className="flex items-center gap-2">
                {isFullPage
                  ? onClose && (
                      <Button variant="outline" size="sm" onClick={onClose}>
                        <ArrowLeft className="mr-1.5 size-3.5" />
                        Back to Requests
                      </Button>
                    )
                  : onClose && (
                      <Button variant="outline" size="sm" onClick={onClose}>
                        Close Details
                      </Button>
                    )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ASSIGN REPRESENTATIVE MODAL */}
      {isAssigning && canAssign && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer text-ink-mute hover:text-ink"
              onClick={() => setIsAssigning(false)}
            >
              <X className="size-5" />
            </button>
            <h3 className="text-base font-bold text-ink">
              Assign Field Representative
            </h3>
            <p className="mt-1 text-xs text-ink-mute">
              Assign an eligible representative to inspect{' '}
              <span className="font-mono font-medium text-ink">
                {details?.requestNumber}
              </span>
            </p>

            <form onSubmit={handleAssignSubmit} className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-ink-soft">
                    Select Field Representative <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-ink-mute">
                    {representativeOptions.length} available
                  </span>
                </div>

                <RepresentativeSelect
                  options={representativeOptions}
                  value={selectedRepId}
                  onChange={(id) => setSelectedRepId(id)}
                  isLoading={isLoadingReps}
                  required
                  placeholder="Choose an active representative to assign..."
                />

                {/* Selected Representative Quick Preview Card */}
                {selectedRepresentative && (
                  <div className="mt-2.5 rounded-xl border border-accent/20 bg-accent/5 p-3 animate-in fade-in-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 font-mono text-xs font-bold text-accent">
                          {selectedRepresentative.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-ink truncate">
                              {selectedRepresentative.name}
                            </span>
                            <span className="rounded bg-white px-1.5 py-0.2 font-mono text-[10px] font-semibold text-accent border border-accent/20">
                              {selectedRepresentative.code}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-mute mt-0.5">
                            {selectedRepresentative.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3 text-ink-mute shrink-0" />
                                <span className="truncate">
                                  {selectedRepresentative.location}
                                </span>
                              </span>
                            )}
                            {selectedRepresentative.phone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="size-3 text-ink-mute shrink-0" />
                                <span>{selectedRepresentative.phone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Selected
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Capture Mode */}
              <div>
                <label className="mb-2 block text-xs font-medium text-ink-soft">
                  Capture Mode *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        value: 'STANDARD',
                        label: 'Standard',
                        frames: '16 frames',
                        desc: 'Standard exterior capture',
                      },
                      {
                        value: 'ADVANCED',
                        label: 'Advanced',
                        frames: '32 frames',
                        desc: 'Full exterior + interior',
                      },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col rounded-xl border-2 p-3 transition-colors ${
                        captureMode === opt.value
                          ? 'border-accent bg-accent/5'
                          : 'border-hairline bg-white hover:border-accent/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="captureMode"
                        value={opt.value}
                        checked={captureMode === opt.value}
                        onChange={() => setCaptureMode(opt.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold text-ink">
                        {opt.label}
                      </span>
                      <span className="font-mono text-xs text-accent">
                        {opt.frames}
                      </span>
                      <span className="mt-0.5 text-[11px] text-ink-mute">
                        {opt.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Assignment Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Please expedite exterior photos"
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssigning(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assignMutation.isPending || !selectedRepId}
                >
                  {assignMutation.isPending
                    ? 'Assigning…'
                    : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS TRANSITION CONFIRMATION MODAL */}
      {statusAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer text-ink-mute hover:text-ink"
              onClick={() => setStatusAction(null)}
            >
              <X className="size-5" />
            </button>
            <h3 className="text-base font-bold text-ink">
              {statusAction === 'PENDING_ASSIGNMENT'
                ? 'Initial Review Approval'
                : statusAction === 'REJECTED'
                  ? 'Reject Inspection Request'
                  : statusAction === 'IN_PROGRESS' &&
                      details?.currentStatus === 'UNDER_REVIEW'
                    ? 'Request Field Reshoot'
                    : statusAction === 'PENDING'
                      ? 'Resubmit Inspection Request'
                      : `Update Request Status to ${statusAction}`}
            </h3>
            <p className="mt-1 text-xs text-ink-mute">
              {statusAction === 'PENDING_ASSIGNMENT'
                ? 'Approve this request and advance it to representative assignment.'
                : statusAction === 'REJECTED'
                  ? 'Reject this request and return it to the Bank Admin with your reason.'
                  : statusAction === 'IN_PROGRESS' &&
                      details?.currentStatus === 'UNDER_REVIEW'
                    ? 'Return this request to the field representative with reshoot instructions.'
                    : statusAction === 'PENDING'
                      ? 'Resubmit this request to the Reviewer queue for initial evaluation.'
                      : `Transitioning request to ${statusAction}`}
            </p>

            <form onSubmit={handleStatusSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  {statusAction === 'REJECTED'
                    ? 'Rejection Reason *'
                    : statusAction === 'IN_PROGRESS' &&
                        details?.currentStatus === 'UNDER_REVIEW'
                      ? 'Reshoot Instructions *'
                      : 'Reason / Note (Optional)'}
                </label>
                <textarea
                  rows={3}
                  required={
                    statusAction === 'REJECTED' ||
                    (statusAction === 'IN_PROGRESS' &&
                      details?.currentStatus === 'UNDER_REVIEW')
                  }
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder={
                    statusAction === 'REJECTED'
                      ? 'Required: state the specific reason for rejecting this request…'
                      : statusAction === 'IN_PROGRESS' &&
                          details?.currentStatus === 'UNDER_REVIEW'
                        ? 'Required: detail which photos or items must be reshot…'
                        : 'Optional reviewer notes or instructions…'
                  }
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusAction(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={statusMutation.isPending}>
                  {statusMutation.isPending ? 'Updating…' : 'Confirm'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA REVIEW MODAL (Reviewer) */}
      {isMediaReviewOpen && details && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline bg-paper/40 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Reviewer Media Review & Market Valuation
                </h3>
                <p className="text-xs text-ink-mute">
                  Verify odometer mileage, grade checklist items
                  (Pass/Fail/Reshoot), and propose marketing value.
                </p>
              </div>
              <button
                type="button"
                className="cursor-pointer text-ink-mute hover:text-ink"
                onClick={() => setIsMediaReviewOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={handleMediaReviewSubmit}
              className="flex flex-1 flex-col overflow-y-auto p-6 space-y-5"
            >
              {/* Step 1: Trim / Edition Comparison & Decision */}
              <div className="rounded-xl border border-hairline bg-paper/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">
                    Trim / Edition (الفئة / الإصدار)
                  </label>
                  <span className="text-[10px] text-ink-mute font-medium">
                    Our company's decision is final
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-hairline/80 bg-white p-3">
                    <span className="block text-[11px] font-medium text-ink-mute">
                      Original (Bank):
                    </span>
                    <p className="mt-0.5 text-sm font-bold text-ink">
                      {details.originalTrim?.name ||
                        details.originalTrim?.code ||
                        details.vehicle?.trim?.name ||
                        'Standard'}
                      {details.originalTrim?.nameAr
                        ? ` (${details.originalTrim.nameAr})`
                        : ''}
                    </p>
                  </div>

                  <div className="rounded-lg border border-hairline/80 bg-white p-3">
                    <label className="block text-[11px] font-medium text-ink-mute mb-1">
                      Current (Company Decision):
                    </label>
                    <select
                      value={selectedTrimId}
                      onChange={(e) => setSelectedTrimId(e.target.value)}
                      className="w-full rounded-md border border-hairline bg-zinc-50/80 px-2.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-accent"
                    >
                      <option value="">— Select Confirmed Trim —</option>
                      {(vehicleLookups?.trims || []).map((t) => {
                        const origId =
                          details.originalTrim?.id || details.vehicle?.trim?.id;
                        const isUnchanged = t.id === origId;
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} {t.nameAr ? `(${t.nameAr})` : ''}{' '}
                            {isUnchanged ? '— (unchanged)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Mechanical & Exterior Specs Verification */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Transmission (ناقل الحركة)
                  </label>
                  <select
                    value={selectedTransmissionTypeId}
                    onChange={(e) =>
                      setSelectedTransmissionTypeId(e.target.value)
                    }
                    className="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-xs font-medium text-ink outline-none focus:border-accent"
                  >
                    <option value="">— Select Transmission —</option>
                    {(
                      vehicleLookups?.transmissionTypes ||
                      DEFAULT_TRANSMISSION_OPTIONS
                    ).map((tr) => (
                      <option key={tr.id || tr.name} value={tr.id || tr.name}>
                        {tr.name} {tr.nameAr ? `(${tr.nameAr})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Side Mirrors (المرايا الجانبية)
                  </label>
                  <select
                    value={selectedSideMirrors}
                    onChange={(e) => setSelectedSideMirrors(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-xs font-medium text-ink outline-none focus:border-accent"
                  >
                    {DEFAULT_SIDE_MIRRORS.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Sunroof Specification (فتحة السقف) *
                  </label>
                  <select
                    value={selectedSunroof}
                    onChange={(e) => setSelectedSunroof(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-xs font-medium text-ink outline-none focus:border-accent"
                  >
                    {DEFAULT_SUNROOF_OPTIONS.map((sn) => (
                      <option key={sn.code} value={sn.name}>
                        {sn.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 3: Valuation and Mileage inputs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Vehicle Mileage (KM) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={verifiedMileage}
                    onChange={(e) => setVerifiedMileage(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
                  />
                  <p className="mt-1 text-[11px] text-ink-mute">
                    Confirmed reading from odometer photo.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Marketing Value (EGP) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={proposedMarketingValue}
                    onChange={(e) => setProposedMarketingValue(e.target.value)}
                    placeholder="e.g. 750000"
                    className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
                  />
                  <p className="mt-1 text-[11px] text-ink-mute">
                    Estimated valuation submitted for Super Admin authorization.
                  </p>
                </div>
              </div>

              {/* Step 2: Checklist Items Decisions */}
              {details.checklistItems && details.checklistItems.length > 0 && (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-ink">
                    Checklist Items & Evidence Verification
                  </label>
                  <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-hairline bg-zinc-50/50 p-3">
                    {details.checklistItems.map((item) => {
                      const currentDecision =
                        checklistDecisions[item.checklistItemId]?.decision ||
                        'PASS';
                      const currentNote =
                        checklistDecisions[item.checklistItemId]?.notes || '';

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-hairline/80 bg-white p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-ink">
                                {item.label}
                              </span>
                              <span className="ml-1.5 font-mono text-[10px] text-ink-mute">
                                ({item.code})
                              </span>
                              {item.isMandatory && (
                                <span className="ml-1.5 rounded bg-rose-500/10 px-1 py-0.2 text-[9px] font-semibold text-rose-600">
                                  Required
                                </span>
                              )}
                            </div>

                            {/* 3-way toggle: PASS, FAIL, RESHOOT */}
                            <div className="flex items-center rounded-lg border border-hairline bg-paper/40 p-0.5 text-[11px] font-medium">
                              {(['PASS', 'FAIL', 'RESHOOT'] as const).map(
                                (dec) => {
                                  const isSelected = currentDecision === dec;
                                  const colors = {
                                    PASS: 'bg-emerald-600 text-white',
                                    FAIL: 'bg-rose-600 text-white',
                                    RESHOOT: 'bg-amber-600 text-white',
                                  };
                                  return (
                                    <button
                                      key={dec}
                                      type="button"
                                      onClick={() =>
                                        setChecklistDecisions((prev) => ({
                                          ...prev,
                                          [item.checklistItemId]: {
                                            decision: dec,
                                            notes:
                                              prev[item.checklistItemId]
                                                ?.notes || '',
                                          },
                                        }))
                                      }
                                      className={`cursor-pointer rounded-md px-2 py-1 font-mono text-[10px] font-semibold transition-colors ${
                                        isSelected
                                          ? colors[dec]
                                          : 'text-ink-mute hover:text-ink'
                                      }`}
                                    >
                                      {dec}
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          </div>

                          <input
                            type="text"
                            placeholder="Item review note (optional, e.g. slight scratch on bumper)"
                            value={currentNote}
                            onChange={(e) =>
                              setChecklistDecisions((prev) => ({
                                ...prev,
                                [item.checklistItemId]: {
                                  decision: currentDecision,
                                  notes: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-hairline/70 bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-accent"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Overall Review Notes */}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Valuation Justification & Review Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={mediaReviewNotes}
                  onChange={(e) => setMediaReviewNotes(e.target.value)}
                  placeholder="e.g. Vehicle exterior in very good condition; fair market value calculated based on current market comps and verified mileage."
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-hairline pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMediaReviewOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mediaReviewMutation.isPending}>
                  {mediaReviewMutation.isPending
                    ? 'Submitting Review…'
                    : 'Complete Media Review & Propose Value'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN FINAL APPROVAL MODAL */}
      {isFinalApproveOpen && details && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer text-ink-mute hover:text-ink"
              onClick={() => setIsFinalApproveOpen(false)}
            >
              <X className="size-5" />
            </button>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">
                  Final Inspection Approval
                </h3>
                <p className="text-xs text-ink-mute">
                  Super Admin official sign-off for {details?.requestNumber}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-paper/60 p-4 border border-hairline space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-mute">
                  Proposed Marketing Value:
                </span>
                <span className="font-mono text-base font-bold text-ink">
                  {details?.latestMarketingDecision?.estimatedValue != null
                    ? `${details.latestMarketingDecision.estimatedValue.toLocaleString()} EGP`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-mute">Valuation By:</span>
                <span className="font-medium text-ink">
                  {details?.latestMarketingDecision?.reviewerName || 'Reviewer'}
                </span>
              </div>
              {details?.vehicle?.mileage != null && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink-mute">Verified Mileage:</span>
                  <span className="font-mono text-ink">
                    {details.vehicle.mileage.toLocaleString()} KM
                  </span>
                </div>
              )}
            </div>

            <form
              onSubmit={handleFinalApproveSubmit}
              className="mt-4 space-y-4"
            >
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">
                    Authorized Market Value (EGP) *
                  </label>
                  {details.latestMarketingDecision?.estimatedValue != null &&
                    finalApprovedPrice !==
                      String(details.latestMarketingDecision.estimatedValue) && (
                      <button
                        type="button"
                        onClick={() =>
                          setFinalApprovedPrice(
                            String(
                              details.latestMarketingDecision!.estimatedValue,
                            ),
                          )
                        }
                        className="text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                      >
                        Reset to Reviewer's Value
                      </button>
                    )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={finalApprovedPrice}
                    onChange={(e) => setFinalApprovedPrice(e.target.value)}
                    placeholder="e.g. 750000"
                    className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 font-mono text-base font-bold text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                  <span className="absolute right-3.5 top-3 font-mono text-xs font-semibold text-ink-mute">
                    EGP
                  </span>
                </div>

                {/* Live delta calculation */}
                {(() => {
                  const proposed =
                    details.latestMarketingDecision?.estimatedValue;
                  const currentNum = parseFloat(finalApprovedPrice);
                  if (proposed == null || isNaN(currentNum)) return null;
                  const diff = currentNum - proposed;
                  if (diff === 0) {
                    return (
                      <p className="mt-1.5 text-[11px] text-ink-mute">
                        Matches reviewer proposed value of{' '}
                        <span className="font-semibold text-ink">
                          {proposed.toLocaleString()} EGP
                        </span>
                        .
                      </p>
                    );
                  }
                  return (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono font-semibold ${
                          diff > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {diff > 0
                          ? `+${diff.toLocaleString()}`
                          : diff.toLocaleString()}{' '}
                        EGP
                      </span>
                      <span className="text-ink-mute">
                        {diff > 0 ? 'increased' : 'decreased'} from reviewer's
                        proposal ({proposed.toLocaleString()} EGP).
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Approval Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={finalApproveNotes}
                  onChange={(e) => setFinalApproveNotes(e.target.value)}
                  placeholder="e.g. Market valuation confirmed and approved."
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFinalApproveOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  disabled={finalApproveMutation.isPending}
                >
                  {finalApproveMutation.isPending ? (
                    <CircleNotch className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 size-4" />
                  )}
                  {finalApproveMutation.isPending
                    ? 'Approving…'
                    : finalApprovedPrice &&
                        !isNaN(parseFloat(finalApprovedPrice)) &&
                        parseFloat(finalApprovedPrice) > 0
                      ? `Approve with EGP ${parseFloat(finalApprovedPrice).toLocaleString()}`
                      : 'Confirm & Grant Approval'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN REQUEST PRICE REVISION MODAL */}
      {isPriceRevisionOpen && details && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer text-ink-mute hover:text-ink"
              onClick={() => setIsPriceRevisionOpen(false)}
            >
              <X className="size-5" />
            </button>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Warning className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">
                  Request Price Revision
                </h3>
                <p className="text-xs text-ink-mute">
                  Return to Reviewer with instructions for valuation adjustment
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-300/40 p-3 text-xs text-amber-800">
              Current proposed value:{' '}
              <span className="font-mono font-bold">
                {details?.latestMarketingDecision?.estimatedValue != null
                  ? `${details.latestMarketingDecision.estimatedValue.toLocaleString()} EGP`
                  : '—'}
              </span>
            </div>

            <form
              onSubmit={handlePriceRevisionSubmit}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Revision Instructions / Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={priceRevisionNotes}
                  onChange={(e) => setPriceRevisionNotes(e.target.value)}
                  placeholder="e.g. Valuation is 10% above average comps for this model year and condition. Please re-evaluate or explain pricing basis."
                  className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPriceRevisionOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100"
                  disabled={
                    priceRevisionMutation.isPending ||
                    !priceRevisionNotes.trim()
                  }
                >
                  {priceRevisionMutation.isPending
                    ? 'Sending Revision…'
                    : 'Send Revision Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
