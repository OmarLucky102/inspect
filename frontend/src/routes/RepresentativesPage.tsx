import { useState, useMemo } from 'react';
import {
  IdentificationBadge,
  Plus,
  MagnifyingGlass,
  X,
  PencilSimple,
  Trash,
  Phone,
  EnvelopeSimple,
  MapPin,
  CircleNotch,
  WarningCircle,
  Copy,
  Check,
  UserCheck,
  UserMinus,
  Buildings,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkspace } from '@/features/workspaces/workspace-context';
import {
  fetchRepresentatives,
  toggleRepresentativeStatus,
  fetchGovernorates,
  type Representative,
} from '@/features/representatives/api';
import { RepresentativeOverviewStats } from '@/features/representatives/components/RepresentativeOverviewStats';
import { RepresentativeFormModal } from '@/features/representatives/components/RepresentativeFormModal';
import { RepresentativeDeleteDialog } from '@/features/representatives/components/RepresentativeDeleteDialog';

export function RepresentativesPage() {
  const { user } = useWorkspace();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedGovernorateId, setSelectedGovernorateId] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRepresentative, setEditingRepresentative] =
    useState<Representative | null>(null);
  const [deletingRepresentative, setDeletingRepresentative] =
    useState<Representative | null>(null);

  // Authorization check
  const isAuthorized =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'REVIEWER' ||
    user?.role === 'MANAGER' ||
    user?.role === 'SYSTEM_ADMIN';

  // Fetch Governorates for filtering
  const { data: governorates = [] } = useQuery({
    queryKey: ['locations', 'governorates'],
    queryFn: fetchGovernorates,
    enabled: isAuthorized,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch representatives
  const {
    data: representatives = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['representatives', statusFilter, selectedGovernorateId],
    queryFn: () =>
      fetchRepresentatives({
        isActive:
          statusFilter === 'active'
            ? true
            : statusFilter === 'inactive'
              ? false
              : undefined,
        governorateId:
          selectedGovernorateId === 'all' ? undefined : selectedGovernorateId,
      }),
    enabled: isAuthorized,
  });

  // Client-side search filtering
  const filteredRepresentatives = useMemo(() => {
    if (!searchTerm.trim()) return representatives;
    const term = searchTerm.toLowerCase().trim();
    return representatives.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.representativeId.toLowerCase().includes(term) ||
        (r.branchName && r.branchName.toLowerCase().includes(term)) ||
        (r.locationName && r.locationName.toLowerCase().includes(term)) ||
        (r.governorate?.name && r.governorate.name.toLowerCase().includes(term)) ||
        (r.governorate?.nameAr && r.governorate.nameAr.toLowerCase().includes(term)) ||
        (r.city?.name && r.city.name.toLowerCase().includes(term)) ||
        (r.city?.nameAr && r.city.nameAr.toLowerCase().includes(term)) ||
        (r.phone && r.phone.toLowerCase().includes(term)) ||
        (r.email && r.email.toLowerCase().includes(term)),
    );
  }, [representatives, searchTerm]);

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleRepresentativeStatus(id),
    onSuccess: (updated) => {
      toast.success(
        `Representative "${updated.name}" is now ${updated.isActive ? 'Active' : 'Inactive'}`,
      );
      queryClient.invalidateQueries({ queryKey: ['representatives'] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to toggle status'));
    },
  });

  // Copy to clipboard helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success(`Copied code "${code}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open edit modal
  const handleEdit = (rep: Representative) => {
    setEditingRepresentative(rep);
    setIsFormModalOpen(true);
  };

  // Open add modal
  const handleOpenAdd = () => {
    setEditingRepresentative(null);
    setIsFormModalOpen(true);
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-ink-mute">
        <div className="size-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <WarningCircle className="size-8" />
        </div>
        <h2 className="text-lg font-semibold text-ink">Access Restricted</h2>
        <p className="text-sm text-ink-mute mt-1 max-w-sm text-center">
          Representative management is accessible only to Superadmins and Reviewers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-0 duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-paper px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider text-ink-mute uppercase border border-hairline">
              <IdentificationBadge className="size-3 text-accent" />
              Inspection Domain · Field Ops
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Representatives
          </h1>
          <p className="text-sm text-ink-mute mt-1">
            Manage field inspection agents, operational branches, and availability for vehicle evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleOpenAdd}
            className="h-9 gap-2 bg-ink text-white hover:bg-ink/90 text-xs font-medium cursor-pointer shadow-xs"
          >
            <Plus className="size-4" />
            Add Representative
          </Button>
        </div>
      </div>

      {/* Top Overview KPI Cards */}
      <RepresentativeOverviewStats />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-hairline bg-white shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-2.5 size-4 text-ink-mute" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, branch, governorate, phone..."
              className="pl-9 pr-8 text-xs h-9 bg-paper/30"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-ink-mute hover:text-ink cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs */}
            <div className="inline-flex rounded-lg border border-hairline bg-paper/60 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-ink shadow-2xs font-semibold'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-amber-800 shadow-2xs font-semibold'
                    : 'text-ink-mute hover:text-ink'
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Governorate Filter */}
            {governorates.length > 0 && (
              <select
                value={selectedGovernorateId}
                onChange={(e) => setSelectedGovernorateId(e.target.value)}
                className="h-8 rounded-lg border border-hairline bg-white px-2.5 text-xs text-ink-soft cursor-pointer hover:border-ink/20 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="all">All Governorates ({governorates.length})</option>
                {governorates.map((gov) => (
                  <option key={gov.id} value={gov.id}>
                    {gov.name} {gov.nameAr ? `(${gov.nameAr})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Status Count Indicator */}
        <div className="flex items-center justify-between text-[11px] text-ink-mute pt-1 border-t border-hairline/60">
          <span>
            Showing{' '}
            <strong className="text-ink font-semibold">
              {filteredRepresentatives.length}
            </strong>{' '}
            of {representatives.length} representative
            {representatives.length === 1 ? '' : 's'}
          </span>
          {(searchTerm || statusFilter !== 'all' || selectedGovernorateId !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSelectedGovernorateId('all');
              }}
              className="text-accent hover:underline cursor-pointer font-medium"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Main Representatives Table */}
      <div className="rounded-xl border border-hairline bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
            <CircleNotch className="size-7 animate-spin text-accent mb-2" />
            <p className="text-xs">Loading representatives roster...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-rose-600">
            <WarningCircle className="size-8 mb-2" />
            <p className="text-sm font-medium">Failed to load representatives</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-3 text-xs"
            >
              Try Again
            </Button>
          </div>
        ) : filteredRepresentatives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="size-14 rounded-2xl bg-paper flex items-center justify-center text-ink-mute mb-3 border border-hairline">
              <IdentificationBadge className="size-7" />
            </div>
            {searchTerm || statusFilter !== 'all' || selectedGovernorateId !== 'all' ? (
              <>
                <h3 className="text-sm font-semibold text-ink">
                  No matching representatives found
                </h3>
                <p className="text-xs text-ink-mute mt-1 max-w-sm">
                  We couldn't find any representatives matching your search and filter criteria.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSelectedGovernorateId('all');
                  }}
                  className="mt-4 text-xs"
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-ink">
                  No representatives added yet
                </h3>
                <p className="text-xs text-ink-mute mt-1 max-w-sm">
                  Representatives can be registered without credentials right now and will be available for inspection assignment.
                </p>
                <Button
                  type="button"
                  onClick={handleOpenAdd}
                  className="mt-4 text-xs bg-ink text-white hover:bg-ink/90 gap-1.5"
                >
                  <Plus className="size-4" />
                  Add First Representative
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hairline bg-paper/60 text-ink-mute font-mono text-[10px] tracking-wider uppercase">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Representative Name</th>
                  <th className="px-5 py-3.5">Branch / Region</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5 text-center">Field Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredRepresentatives.map((rep) => {
                  const hasUserLink = !!rep.user;
                  const hasStructuredLocation =
                    rep.branchName || rep.governorate || rep.city || rep.locationName;

                  return (
                    <tr
                      key={rep.id}
                      className="group hover:bg-paper/30 transition-colors"
                    >
                      {/* Rep Code */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-ink bg-paper px-2 py-1 rounded-md border border-hairline tracking-wider text-xs">
                            {rep.representativeId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(rep.representativeId)}
                            title="Copy code"
                            className="cursor-pointer p-1 text-ink-mute hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedId === rep.representativeId ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Rep Name & Account Badge */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink text-sm">
                            {rep.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            {hasUserLink ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <UserCheck className="size-3 text-emerald-600" />
                                Linked: {rep.user?.firstName} ({rep.user?.role})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-normal text-ink-mute bg-paper px-2 py-0.5 rounded-full border border-hairline">
                                <UserMinus className="size-3" />
                                Standalone Agent
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location / Branch (Branch + City + Gov) */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {hasStructuredLocation ? (
                          <div className="flex flex-col">
                            {rep.branchName ? (
                              <span className="font-medium text-ink flex items-center gap-1.5 text-xs">
                                <Buildings className="size-3.5 text-ink-mute shrink-0" />
                                {rep.branchName}
                              </span>
                            ) : null}
                            <span className="text-[11px] text-ink-mute flex items-center gap-1.5 mt-0.5">
                              <MapPin className="size-3 text-accent shrink-0" />
                              {[
                                rep.city?.name || rep.city?.nameAr,
                                rep.governorate?.name || rep.governorate?.nameAr,
                              ]
                                .filter(Boolean)
                                .join(', ') || rep.locationName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink-mute/70 italic text-[11px]">
                            All Regions (Unassigned)
                          </span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {rep.phone ? (
                            <a
                              href={`tel:${rep.phone}`}
                              className="flex items-center gap-1.5 text-ink-soft hover:text-accent transition-colors"
                            >
                              <Phone className="size-3 text-ink-mute" />
                              <span className="font-mono text-[11px]">{rep.phone}</span>
                            </a>
                          ) : null}
                          {rep.email ? (
                            <a
                              href={`mailto:${rep.email}`}
                              className="flex items-center gap-1.5 text-ink-soft hover:text-accent transition-colors"
                            >
                              <EnvelopeSimple className="size-3 text-ink-mute" />
                              <span>{rep.email}</span>
                            </a>
                          ) : null}
                          {!rep.phone && !rep.email && (
                            <span className="text-ink-mute/70 italic text-[11px]">
                              No contact details
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(rep.id)}
                          disabled={toggleMutation.isPending}
                          title="Click to toggle status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-all hover:scale-102 ${
                            rep.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200/80'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              rep.isActive
                                ? 'bg-emerald-600 ring-2 ring-emerald-300'
                                : 'bg-zinc-400'
                            }`}
                          />
                          {rep.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(rep)}
                            className="h-8 px-2.5 text-ink-soft hover:text-ink gap-1 text-xs"
                          >
                            <PencilSimple className="size-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingRepresentative(rep)}
                            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-hairline text-xs"
                            title="Delete representative"
                          >
                            <Trash className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Add / Edit) */}
      <RepresentativeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRepresentative(null);
        }}
        representative={editingRepresentative}
      />

      {/* Delete Confirmation Dialog */}
      <RepresentativeDeleteDialog
        isOpen={!!deletingRepresentative}
        onClose={() => setDeletingRepresentative(null)}
        representative={deletingRepresentative}
      />
    </div>
  );
}
